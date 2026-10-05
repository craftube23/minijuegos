/**
 * ==============================================================================
 * CLASE BASE ABSTRACTA PARA TODOS LOS MINIJUEGOS (BaseGame)
 * ==============================================================================
 * 
 * Esta clase proporciona la estructura común para los 4 juegos:
 * - Ciclo de vida: Iniciar, Pausar, Actualizar a 60 FPS, Dibujar y Terminar.
 * - Temporizador de partida integrado con cuenta regresiva.
 * - Sistema de puntuación y detección de nuevos récords.
 * - Integración con AudioManager, InputManager y ParticleSystem.
 * - Integración de Logos de la Feria como Power-ups o elementos gráficos.
 */

import { AudioManager } from "./AudioManager";
import { InputManager } from "./InputManager";
import { ParticleSystem } from "./ParticleSystem";
import { StorageManager } from "./StorageManager";
import { BRANDING, type LogoConfig } from "../config/branding";

export interface GameResult {
  gameId: string;
  gameTitle: string;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  logoUsed: LogoConfig;
}

export abstract class BaseGame {
  public id: string;
  public title: string;
  public instructions: string;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected width: number = 1080;
  protected height: number = 1500; // Altura del área de juego (dejando espacio para el carrusel inferior)

  protected input: InputManager;
  protected audio: AudioManager;
  protected particles: ParticleSystem;

  protected score: number = 0;
  protected highScore: number = 0;
  protected timeRemaining: number = 45; // Segundos por defecto
  protected isRunning: boolean = false;
  protected isGameOver: boolean = false;

  // Sistema de Power-Up del Logo de la Feria
  protected isLogoPowerUpActive: boolean = false;
  protected logoPowerUpTimer: number = 0;
  protected activeLogo: LogoConfig;
  protected logoImage1: HTMLImageElement | null = null;
  protected logoImage2: HTMLImageElement | null = null;

  // Callback cuando termina la partida
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

  /**
   * Carga las imágenes de los logos para usarlas en el Canvas
   */
  private loadLogos(): void {
    this.logoImage1 = new Image();
    this.logoImage1.src = BRANDING.getLogoPath(1);

    this.logoImage2 = new Image();
    this.logoImage2.src = BRANDING.getLogoPath(2);
  }

  /**
   * Inicializa o reinicia el estado interno del juego
   */
  public start(durationSeconds: number = 45): void {
    this.score = 0;
    this.timeRemaining = durationSeconds;
    this.isRunning = true;
    this.isGameOver = false;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    this.highScore = StorageManager.getHighScore(this.id);
    this.particles.clear();

    this.onStart();
  }

  /**
   * Método abstracto que cada juego implementa para su lógica de inicio
   */
  protected abstract onStart(): void;

  /**
   * Bucle principal de actualización (se llama ~60 veces por segundo)
   * @param dt Delta time en segundos (ej: 0.016 para 60 FPS)
   */
  public update(dt: number): void {
    if (!this.isRunning || this.isGameOver) return;

    // Actualizar temporizador de partida
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame();
      return;
    }

    // Actualizar duración del Power-Up del Logo de la Feria
    if (this.isLogoPowerUpActive) {
      this.logoPowerUpTimer -= dt;
      if (this.logoPowerUpTimer <= 0) {
        this.isLogoPowerUpActive = false;
        this.logoPowerUpTimer = 0;
      }
    }

    // Lógica específica de cada juego
    this.onUpdate(dt);
  }

  /**
   * Método abstracto con la lógica propia de cada minijuego
   */
  protected abstract onUpdate(dt: number): void;

  /**
   * Renderizado en pantalla (Limpio sin motas ni puntos)
   */
  public draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Dibujar el fondo y elementos propios del juego
    this.onDraw(this.ctx);

    // 2. Dibujar interfaz superior (HUD: Puntuación, Tiempo y Power-Up)
    this.drawHUD(this.ctx);
  }

  /**
   * Método abstracto de dibujo específico de cada minijuego
   */
  protected abstract onDraw(ctx: CanvasRenderingContext2D): void;

  /**
   * Dibuja la barra de estado superior (HUD) con estilo navideño
   */
  protected drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const hudHeight = Math.max(54, Math.min(75, this.height * 0.08));

    // Fondo sólido semi-transparente pegado a la parte superior (y=0)
    ctx.fillStyle = "rgba(8, 21, 39, 0.94)";
    ctx.fillRect(0, 0, this.width, hudHeight);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, hudHeight);
    ctx.lineTo(this.width, hudHeight);
    ctx.stroke();

    // Tamaños de texto adaptables a cualquier dispositivo
    const fontMain = Math.max(16, Math.min(26, this.width * 0.034));
    const fontRecord = Math.max(14, Math.min(22, this.width * 0.028));
    const textY = hudHeight * 0.62;

    // 1. PUNTUACIÓN (Izquierda)
    ctx.font = `bold ${fontMain}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.fillText(`⭐ PUNTOS: ${this.score}`, Math.max(16, this.width * 0.025), textY);

    // 2. TIEMPO RESTANTE (Centro)
    const timeFormatted = Math.ceil(this.timeRemaining);
    ctx.font = `bold ${fontMain * 1.08}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = this.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(`⏳ ${timeFormatted}s`, this.width / 2, textY);

    // 3. RÉCORD / MEJOR PUNTUACIÓN (Derecha)
    ctx.font = `bold ${fontRecord}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#2ECC71";
    ctx.textAlign = "right";
    ctx.fillText(`🏆 RÉCORD: ${Math.max(this.score, this.highScore)}`, this.width - Math.max(16, this.width * 0.025), textY);

    // 4. Indicador de Power-Up del Logo de la Feria activo
    if (this.isLogoPowerUpActive) {
      const bannerH = 34;
      ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
      ctx.fillRect(0, hudHeight, this.width, bannerH);
      ctx.fillStyle = "#0A2518";
      ctx.font = `bold ${Math.max(13, Math.min(19, this.width * 0.024))}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`✨ ¡BONUS FERIA ACTIVO! (x${this.activeLogo.bonusMultiplier}) - ${Math.ceil(this.logoPowerUpTimer)}s ✨`, this.width / 2, hudHeight + bannerH * 0.68);
    }

    ctx.restore();
  }

  /**
   * Activa el Power-Up del Logo de la Feria
   */
  protected triggerLogoPowerUp(logoNumber: 1 | 2 = 1, durationSeconds: number = 6): void {
    this.activeLogo = BRANDING.getLogoConfig(logoNumber);
    this.isLogoPowerUpActive = true;
    this.logoPowerUpTimer = durationSeconds;
    this.audio.playPowerUp();
    this.particles.emitConfetti(this.width, 30);
  }

  /**
   * Suma puntos aplicando el multiplicador si el Power-Up está activo
   */
  protected addScore(basePoints: number): void {
    const pointsToAdd = this.isLogoPowerUpActive ? basePoints * this.activeLogo.bonusMultiplier : basePoints;
    this.score += pointsToAdd;
    if (this.score < 0) this.score = 0;
  }

  /**
   * Finaliza la partida y calcula récords
   */
  public endGame(): void {
    if (this.isGameOver) return;
    this.isRunning = false;
    this.isGameOver = true;

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
        logoUsed: this.activeLogo
      });
    }
  }

  /**
   * Redimensiona el canvas interno
   */
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
  }
}
