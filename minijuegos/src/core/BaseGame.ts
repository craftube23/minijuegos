/**
 * ==============================================================================
 * CLASE BASE ABSTRACTA PARA TODOS LOS MINIJUEGOS (BaseGame)
 * ==============================================================================
 * 
 * Arquitectura modular para minijuegos táctiles de 60 FPS:
 * - Ciclo de vida estricto: Inicio, Bucle de actualización (dt), Renderizado y Fin.
 * - Feedback visual: Screen Shake físico y Textos flotantes (+100, x2 Combo!).
 * - Gestión de Power-Ups con cuenta regresiva.
 * - HUD responsivo modular delegando en GameHUD.
 */

import { AudioManager } from "./AudioManager";
import { InputManager } from "./InputManager";
import { ParticleSystem } from "./ParticleSystem";
import { StorageManager } from "./StorageManager";
import { GameHUD, type HUDState } from "./GameHUD";
import { FloatingTextSystem } from "./FloatingTextSystem";
import { BRANDING, type LogoConfig } from "../config/branding";
import { Haptics } from "../utils/haptics";
import type { GameResult, FloatingText } from "../types/game";

export type { GameResult, FloatingText };

export abstract class BaseGame {
  public id: string;
  public title: string;
  public instructions: string;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected width: number = 1080;
  protected height: number = 1500;

  protected input: InputManager;
  protected audio: AudioManager;
  protected particles: ParticleSystem;

  protected score: number = 0;
  protected highScore: number = 0;
  protected timeRemaining: number = 45;
  protected isRunning: boolean = false;
  protected isGameOver: boolean = false;

  // Vidas del jugador
  protected lives: number = 5;
  protected maxLives: number = 5;
  protected showLives: boolean = false;

  // Sistema de Screen Shake (Feedback de impacto)
  protected shakeTimer: number = 0;
  protected shakeIntensity: number = 0;

  // Estado de Finalización Cinemática (Fin de Partida Suave)
  protected isFinishing: boolean = false;
  protected finishTimer: number = 0;
  protected lastCountdownStepSec: number = -1;

  // Sistema modular de Textos flotantes (Score Popups)
  protected floatingTextSystem: FloatingTextSystem = new FloatingTextSystem();

  // Sistema de Música de Fondo del Juego
  protected inGameMusicPath: string = "";
  protected inGameMusicVolume: number = 0.48;

  // Sistema de Power-Up del Logo de la Feria
  protected isLogoPowerUpActive: boolean = false;
  protected logoPowerUpTimer: number = 0;
  protected activeLogo: LogoConfig;
  protected logoImage1: HTMLImageElement | null = null;
  protected logoImage2: HTMLImageElement | null = null;

  // Callback al terminar partida
  public onGameOver?: (result: GameResult) => void;

  constructor(
    id: string,
    title: string,
    instructions: string,
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    this.id = id;
    this.title = title;
    this.instructions = instructions;
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo obtener el contexto 2D del Canvas");
    this.ctx = context;
    this.input = input;
    this.audio = audio;
    this.particles = particles;

    this.activeLogo = BRANDING.getLogoConfig(1);
    this.highScore = StorageManager.getHighScore(this.id);

    this.loadLogos();
  }

  private loadLogos(): void {
    this.logoImage1 = new Image();
    this.logoImage1.src = BRANDING.getLogoPath(1);

    this.logoImage2 = new Image();
    this.logoImage2.src = BRANDING.getLogoPath(2);
  }

  public start(durationSeconds: number = 45): void {
    this.audio.setGameActive(true);
    this.audio.stopMenuBGM();
    if (this.inGameMusicPath) {
      this.audio.playGameBGM(this.inGameMusicPath, this.inGameMusicVolume, true);
    }
    this.score = 0;
    this.timeRemaining = durationSeconds;
    this.isRunning = true;
    this.isGameOver = false;
    this.isFinishing = false;
    this.finishTimer = 0;
    this.lastCountdownStepSec = -1;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    this.shakeTimer = 0;
    this.floatingTextSystem.clear();
    this.highScore = StorageManager.getHighScore(this.id);
    this.particles.clear();

    this.onStart();
  }

  protected abstract onStart(): void;

  public update(dt: number): void {
    if (!this.isRunning || this.isGameOver) return;

    // Si está en la animación de celebración final
    if (this.isFinishing) {
      this.finishTimer -= dt;
      if (this.finishTimer <= 0) {
        this.endGame();
        return;
      }
      this.onUpdate(dt * 0.35); // Ralentización cinemática suave al final
      return;
    }

    // Actualizar temporizador de partida
    this.timeRemaining -= dt;

    // Alerta sonora en los últimos 5 segundos (5, 4, 3, 2, 1)
    if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
      const currentSec = Math.ceil(this.timeRemaining);
      if (currentSec !== this.lastCountdownStepSec) {
        this.lastCountdownStepSec = currentSec;
        this.audio.playCountdownStep(currentSec);
      }
    }

    // Cuando el tiempo llega a 0 → Iniciar celebración cinemática suave
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isFinishing = true;
      this.finishTimer = 1.6;
      this.audio.stopGameBGM();
      this.audio.playVictory();
      this.particles.emitConfetti(this.width, 70);
      return;
    }

    // Actualizar Screen Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
      }
    }

    // Actualizar Textos Flotantes
    this.floatingTextSystem.update(dt);

    // Actualizar Power-Up del Logo
    if (this.isLogoPowerUpActive) {
      this.logoPowerUpTimer -= dt;
      if (this.logoPowerUpTimer <= 0) {
        this.isLogoPowerUpActive = false;
        this.logoPowerUpTimer = 0;
      }
    }

    this.onUpdate(dt);
  }

  protected abstract onUpdate(dt: number): void;

  public draw(): void {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Aplicar Screen Shake si está activo
    if (this.shakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Dibujar lógica visual propia del minijuego
    this.onDraw(this.ctx);

    // 2. Dibujar Textos Flotantes (+100, +500 x2, -1❤️)
    this.floatingTextSystem.draw(this.ctx, this.width);

    this.ctx.restore();

    // 3. Dibujar HUD fijo superior
    this.drawHUD(this.ctx);

    // 4. Dibujar Banner Cinemático de Fin de Partida si está activo
    this.drawFinishOverlay(this.ctx);
  }

  protected abstract onDraw(ctx: CanvasRenderingContext2D): void;

  /**
   * Genera un impacto de temblor en la pantalla (Screen Shake) con feedback háptico
   */
  public triggerShake(duration: number = 0.22, intensity: number = 7): void {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
    if (intensity >= 5) {
      Haptics.impact();
    } else {
      Haptics.medium();
    }
  }

  /**
   * Muestra un número flotante que sube y se desvanece
   */
  public addFloatingText(text: string, x: number, y: number, color: string = "#FFD700", scale: number = 1.0): void {
    this.floatingTextSystem.add(text, x, y, color, scale);
  }

  /**
   * Dibuja la barra de estado superior (HUD) moderna con acabado de cristal y oro
   */
  protected drawHUD(ctx: CanvasRenderingContext2D): void {
    const hudState: HUDState = {
      gameId: this.id,
      width: this.width,
      height: this.height,
      score: this.score,
      highScore: this.highScore,
      timeRemaining: this.timeRemaining,
      lives: this.lives,
      maxLives: this.maxLives,
      showLives: this.showLives,
      isLogoPowerUpActive: this.isLogoPowerUpActive,
      logoPowerUpTimer: this.logoPowerUpTimer,
      activeLogo: this.activeLogo
    };

    GameHUD.draw(ctx, hudState);
  }

  /**
   * Renderiza el banner cinematográfico centrado de FIN DE PARTIDA
   */
  protected drawFinishOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.isFinishing) return;
    GameHUD.drawFinishOverlay(ctx, this.width, this.height);
  }

  protected triggerLogoPowerUp(logoNumber: 1 | 2 = 1, durationSeconds: number = 6): void {
    this.activeLogo = BRANDING.getLogoConfig(logoNumber);
    this.isLogoPowerUpActive = true;
    this.logoPowerUpTimer = durationSeconds;
    this.audio.playPowerUp();
    this.particles.emitConfetti(this.width, 30);
  }

  protected addScore(basePoints: number): void {
    const pointsToAdd = this.isLogoPowerUpActive ? basePoints * this.activeLogo.bonusMultiplier : basePoints;
    this.score += pointsToAdd;
    if (this.score < 0) this.score = 0;
  }

  public endGame(extraData?: Partial<GameResult>): void {
    if (this.isGameOver) return;
    this.isRunning = false;
    this.isGameOver = true;

    if (this.inGameMusicPath) {
      this.audio.stopGameBGM();
    }

    const recordCheck = StorageManager.saveScore(this.id, this.score);
    if (recordCheck.isNewRecord) {
      this.audio.playVictory();
      this.particles.emitConfetti(this.width, 80);
    } else {
      this.audio.playVictory();
    }

    if (this.onGameOver) {
      this.onGameOver({
        gameId: this.id,
        gameTitle: this.title,
        score: this.score,
        highScore: recordCheck.highScore,
        isNewRecord: recordCheck.isNewRecord,
        logoUsed: this.activeLogo,
        ...extraData
      });
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.particles.initSnow(width, height);
  }

  public getScore(): number {
    return this.score;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public destroy(): void {
    this.isRunning = false;
    this.isGameOver = true;
    this.floatingTextSystem.clear();
    if (this.inGameMusicPath) {
      this.audio.stopGameBGM();
    }
  }
}
