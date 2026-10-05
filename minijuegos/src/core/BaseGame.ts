/**
 * ==============================================================================
 * CLASE BASE ABSTRACTA PARA TODOS LOS MINIJUEGOS (BaseGame)
 * ==============================================================================
 * 
 * Arquitectura profesional para juegos táctiles de 60 FPS:
 * - Ciclo de vida estricto: Inicio, Bucle de actualización (dt), Renderizado y Fin.
 * - Sistema de feedback visual: Screen Shake físico y Textos flotantes (+100, x2 Combo!).
 * - Gestión de Power-Ups con cuenta regresiva.
 * - HUD responsivo adaptable a resoluciones móviles, tótems y escritorio.
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

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
}

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
  protected lives: number = 3;
  protected maxLives: number = 3;
  protected showLives: boolean = false;

  // Sistema de Screen Shake (Feedback de impacto)
  protected shakeTimer: number = 0;
  protected shakeIntensity: number = 0;

  // Sistema de Textos flotantes (Score Popups)
  protected floatingTexts: FloatingText[] = [];

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
    this.score = 0;
    this.timeRemaining = durationSeconds;
    this.isRunning = true;
    this.isGameOver = false;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    this.shakeTimer = 0;
    this.floatingTexts = [];
    this.highScore = StorageManager.getHighScore(this.id);
    this.particles.clear();

    this.onStart();
  }

  protected abstract onStart(): void;

  public update(dt: number): void {
    if (!this.isRunning || this.isGameOver) return;

    // Actualizar temporizador de partida
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame();
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
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ft.scale += dt * 0.4;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

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

    // 1. Dibujar lógica del juego
    this.onDraw(this.ctx);

    // 2. Dibujar Textos Flotantes (+100, +500 x2, -1❤️)
    this.drawFloatingTexts(this.ctx);

    this.ctx.restore();

    // 3. Dibujar HUD fijo superior (no afectado por el shake)
    this.drawHUD(this.ctx);
  }

  protected abstract onDraw(ctx: CanvasRenderingContext2D): void;

  /**
   * Genera un impacto de temblor en la pantalla (Screen Shake)
   */
  public triggerShake(duration: number = 0.22, intensity: number = 7): void {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  /**
   * Muestra un número flotante que sube y se desvanece
   */
  public addFloatingText(text: string, x: number, y: number, color: string = "#FFD700", scale: number = 1.0): void {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -140,
      color,
      alpha: 1.0,
      scale,
      life: 0,
      maxLife: 0.85
    });
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      const fontSize = Math.max(18, Math.min(32, this.width * 0.048));
      ctx.font = `900 ${fontSize}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Sombra gruesa de alto contraste
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = 5;
      ctx.strokeText(ft.text, 0, 0);

      // Texto de color
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
  }

  /**
   * Dibuja la barra de estado superior (HUD) moderna con acabado de cristal y oro
   */
  protected drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const hudH = Math.max(48, Math.min(70, this.height * 0.08));

    // Fondo oscuro translúcido con borde dorado brillante
    ctx.fillStyle = "rgba(8, 20, 38, 0.94)";
    ctx.fillRect(0, 0, this.width, hudH);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, hudH);
    ctx.lineTo(this.width, hudH);
    ctx.stroke();

    const fontMain = Math.max(15, Math.min(26, this.width * 0.04));
    const fontSub = Math.max(13, Math.min(22, this.width * 0.034));
    const textY = hudH * 0.64;
    const paddingX = Math.max(14, this.width * 0.03);

    // 1. PUNTUACIÓN (Izquierda)
    ctx.font = `bold ${fontMain}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.fillText(`⭐ ${this.score}`, paddingX, textY);

    // 2. VIDAS Y TIEMPO RESTANTE (Centro)
    const timeFormatted = Math.ceil(this.timeRemaining);
    ctx.textAlign = "center";

    if (this.showLives) {
      const hearts = "❤️".repeat(Math.max(0, this.lives)) + "🖤".repeat(Math.max(0, this.maxLives - this.lives));
      ctx.font = `bold ${fontMain * 0.92}px 'Segoe UI Emoji', sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${hearts}  ⏳ ${timeFormatted}s`, this.width / 2, textY);
    } else {
      ctx.font = `bold ${fontMain * 1.06}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = this.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
      ctx.fillText(`⏳ ${timeFormatted}s`, this.width / 2, textY);
    }

    // 3. RÉCORD / MEJOR PUNTUACIÓN (Derecha)
    ctx.font = `bold ${fontSub}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#2ECC71";
    ctx.textAlign = "right";
    ctx.fillText(`🏆 ${Math.max(this.score, this.highScore)}`, this.width - paddingX, textY);

    // 4. Indicador de Power-Up del Logo de la Feria activo
    if (this.isLogoPowerUpActive) {
      const bannerH = Math.max(26, Math.min(36, hudH * 0.55));
      ctx.fillStyle = "rgba(255, 215, 0, 0.96)";
      ctx.fillRect(0, hudH, this.width, bannerH);
      ctx.fillStyle = "#0A2518";
      ctx.font = `bold ${Math.max(12, Math.min(18, this.width * 0.03))}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`✨ ¡BONUS FERIA (x${this.activeLogo.bonusMultiplier})! - ${Math.ceil(this.logoPowerUpTimer)}s ✨`, this.width / 2, hudH + bannerH * 0.7);
    }

    ctx.restore();
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
