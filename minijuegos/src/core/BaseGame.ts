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
import { Haptics } from "../utils/haptics";

export interface GameResult {
  gameId: string;
  gameTitle: string;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  logoUsed: LogoConfig;
  rank?: string; // "S+", "S", "A", "B", "C", "D"
  rankLabel?: string;
  rankColor?: string;
  accuracy?: number; // 0 - 100%
  maxCombo?: number;
  perfectCount?: number;
  greatCount?: number;
  goodCount?: number;
  missCount?: number;
  totalNotes?: number;
  songTitle?: string;
  songArtist?: string;
  difficulty?: string;
  difficultyLabel?: string;
  difficultyColor?: string;
  isCustomChart?: boolean;
  customNotes?: any[];
  songFile?: string;
  bpm?: number;
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

  // Estado de Finalización Cinemática (Fin de Partida Suave)
  protected isFinishing: boolean = false;
  protected finishTimer: number = 0;
  protected lastCountdownStepSec: number = -1;

  // Sistema de Textos flotantes (Score Popups)
  protected floatingTexts: FloatingText[] = [];

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
    this.floatingTexts = [];
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

      const fontSize = Math.max(16, Math.min(32, this.width * 0.045));
      ctx.font = `900 ${fontSize}px 'Outfit', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Sombra gruesa de alto contraste
      ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
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

    const isNarrow = this.width < 460;
    const hudH = Math.max(44, Math.min(68, this.height * 0.075));

    // Fondo oscuro translúcido con borde dorado brillante
    ctx.fillStyle = "rgba(7, 18, 34, 0.96)";
    ctx.fillRect(0, 0, this.width, hudH);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, hudH);
    ctx.lineTo(this.width, hudH);
    ctx.stroke();

    const fontMain = isNarrow ? Math.max(13, this.width * 0.038) : Math.max(15, Math.min(24, this.width * 0.036));
    const fontSub = isNarrow ? Math.max(10, this.width * 0.028) : Math.max(12, Math.min(18, this.width * 0.028));
    const textY = hudH * 0.65;
    const paddingX = Math.max(10, this.width * 0.025);

    // 1. PUNTUACIÓN (Izquierda con estrella de fantasía 2D Stylized Game Art)
    const starRadius = fontMain * 0.48;
    const starX = paddingX + starRadius;
    const starY = textY - fontMain * 0.3;
    
    ctx.save();
    ctx.translate(starX, starY);

    // Resplandor áurico dorado
    ctx.shadowColor = "rgba(255, 215, 0, 0.75)";
    ctx.shadowBlur = 8;

    // Cuerpo base de la estrella con degradado dorado volumétrico
    const starGrad = ctx.createLinearGradient(-starRadius, -starRadius, starRadius, starRadius);
    starGrad.addColorStop(0, "#FFF9C4");
    starGrad.addColorStop(0.35, "#FFD700");
    starGrad.addColorStop(0.75, "#FF9100");
    starGrad.addColorStop(1, "#DD2C00");

    ctx.fillStyle = starGrad;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? starRadius : starRadius * 0.44;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Borde dorado nítido de fantasía
    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Faceta central en relieve (Líneas de diamante)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -starRadius + 1);
    ctx.moveTo(0, 0);
    ctx.lineTo(-starRadius * 0.8, -starRadius * 0.25);
    ctx.stroke();

    // Destello blanco en la punta superior
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, -starRadius * 0.7, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.font = `900 ${fontMain}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.fillText(`${this.score}`, starX + starRadius + 6, textY);

    // 2. VIDAS Y TIEMPO RESTANTE (Centro)
    let timeFormatted: string;
    if (this.timeRemaining >= 60) {
      const mins = Math.floor(this.timeRemaining / 60);
      const secs = Math.floor(this.timeRemaining % 60);
      timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeFormatted = `${Math.ceil(this.timeRemaining)}s`;
    }
    
    if (this.showLives) {
      const iconSize = Math.max(11, Math.min(19, fontMain * 0.70));
      const iconGap = iconSize * 2.2;
      const totalIconsW = this.maxLives * iconGap;
      const startIconsX = (this.width / 2) - (totalIconsW / 2) - (isNarrow ? 12 : 22);
      
      for (let i = 0; i < this.maxLives; i++) {
        const hx = startIconsX + i * iconGap;
        const hy = textY - fontMain * 0.24;
        const isFilled = i < this.lives;
        this.drawLifeIcon(ctx, hx, hy, iconSize, isFilled);
      }

      ctx.font = `900 ${fontMain * 0.95}px 'Outfit', sans-serif`;
      ctx.fillStyle = this.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(timeFormatted, startIconsX + totalIconsW + (isNarrow ? 6 : 12), textY);
    } else {
      ctx.font = `900 ${fontMain * 1.05}px 'Outfit', sans-serif`;
      ctx.fillStyle = this.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(timeFormatted, this.width / 2, textY);
    }

    // 3. RÉCORD / MEJOR PUNTUACIÓN (Derecha)
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#2ECC71";
    ctx.textAlign = "right";
    const recordLabel = isNarrow ? `TOP: ${Math.max(this.score, this.highScore)}` : `RÉCORD: ${Math.max(this.score, this.highScore)}`;
    ctx.fillText(recordLabel, this.width - paddingX, textY);

    // 4. Indicador de Power-Up del Logo Activo (Feria Mágica o Campuslands)
    if (this.isLogoPowerUpActive) {
      const bannerH = Math.max(24, Math.min(34, hudH * 0.55));
      const isCampus = this.activeLogo.id === "logo-2";
      
      // Fondo dinámico: Cian para Campuslands, Dorado para Feria Mágica
      ctx.fillStyle = isCampus ? "rgba(0, 229, 255, 0.96)" : "rgba(255, 215, 0, 0.96)";
      ctx.fillRect(0, hudH, this.width, bannerH);
      ctx.fillStyle = isCampus ? "#031B33" : "#0A2518";
      ctx.font = `900 ${Math.max(11, Math.min(16, this.width * 0.028))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      const bonusTitle = isCampus ? "¡BONUS CAMPUSLANDS!" : "¡BONUS FERIA MÁGICA!";
      ctx.fillText(`${bonusTitle} (x${this.activeLogo.bonusMultiplier}) - ${Math.ceil(this.logoPowerUpTimer)}s`, this.width / 2, hudH + bannerH * 0.7);
    }

    ctx.restore();
  }

  /**
   * Dibuja el ícono de vida correspondiente al minijuego (Campana Dorada, Carita de Elfo o Corazón)
   */
  protected drawLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    if (this.id === "flying-elf") {
      this.drawStylizedElfLifeIcon(ctx, x, y, size, isFilled);
    } else if (this.id === "bell-symphony") {
      this.drawStylizedBellLifeIcon(ctx, x, y, size, isFilled);
    } else {
      this.drawHeartLifeIcon(ctx, x, y, size, isFilled);
    }
  }

  /**
   * Renderiza la Campana Dorada Mágica con estilo Stylized 2D Game Art / Fantasy Game Concept Art
   */
  private drawStylizedBellLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 14;
    ctx.scale(s, s);

    if (!isFilled) {
      // Estado de vida perdida (Campana atenuada / silueta translúcida con marca de fallo)
      ctx.globalAlpha = 0.26;

      // Silueta campana
      ctx.fillStyle = "rgba(140, 160, 190, 0.4)";
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.bezierCurveTo(-5, -6, -8, 2, -10, 6);
      ctx.lineTo(10, 6);
      ctx.bezierCurveTo(8, 2, 5, -6, 3, -7);
      ctx.closePath();
      ctx.fill();

      // Reborde inferior
      ctx.beginPath();
      ctx.roundRect(-11, 5.5, 22, 3, 1.5);
      ctx.fill();

      // Badajo apagado
      ctx.beginPath();
      ctx.arc(0, 8.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Marca de fallo estilizada (Cruz / Grieta de cristal)
      ctx.strokeStyle = "rgba(255, 80, 80, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, -1); ctx.lineTo(4, 4);
      ctx.moveTo(4, -1); ctx.lineTo(-4, 4);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // --- ESTADO ACTIVO: Stylized 2D Fantasy Game Concept Art (Campana Dorada Navideña) ---
    
    // 1. Resplandor dorado mágico sutil
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 7;

    // 2. Anillo / Argolla superior de suspensión
    ctx.strokeStyle = "#FF8F00";
    ctx.lineWidth = 2.0;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, -7.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-1, -8.5, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 3. Badajo de campana (Clapper esférico con brillo)
    const clapperGrad = ctx.createRadialGradient(-0.8, 7.5, 0.5, 0, 8.5, 3.2);
    clapperGrad.addColorStop(0, "#FFF3B0");
    clapperGrad.addColorStop(0.4, "#FFD700");
    clapperGrad.addColorStop(1, "#8A4E00");
    ctx.fillStyle = clapperGrad;
    ctx.beginPath();
    ctx.arc(0, 8.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#422200";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // 4. Cuerpo de la Campana (Cúpula estilizada con degradado 3D dorado)
    const bellGrad = ctx.createLinearGradient(-8, -6, 8, 6);
    bellGrad.addColorStop(0, "#FFF9C4");
    bellGrad.addColorStop(0.25, "#FFEB3B");
    bellGrad.addColorStop(0.65, "#FFB300");
    bellGrad.addColorStop(1, "#E65100");

    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.moveTo(-3.5, -6.5);
    ctx.bezierCurveTo(-6, -4, -8.5, 1.5, -10.5, 6);
    ctx.lineTo(10.5, 6);
    ctx.bezierCurveTo(8.5, 1.5, 6, -4, 3.5, -6.5);
    ctx.closePath();
    ctx.fill();

    // Contorno oscuro nítido (Stylized outline)
    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 5. Brillo de luz especular curvo en el hombro izquierdo
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2.5, -5);
    ctx.bezierCurveTo(-4.5, -2.5, -6.5, 1, -8, 4.5);
    ctx.stroke();

    // 6. Reborde Inferior Grueso (Embossed Rim)
    const rimGrad = ctx.createLinearGradient(-11, 5, 11, 8.5);
    rimGrad.addColorStop(0, "#FFE082");
    rimGrad.addColorStop(0.5, "#FFD54F");
    rimGrad.addColorStop(1, "#FF8F00");
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.roundRect(-11.5, 5, 23, 3.6, 1.8);
    ctx.fill();
    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Línea de brillo en el reborde
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.roundRect(-9, 5.5, 8, 1.2, 0.6);
    ctx.fill();

    // 7. Lazo / Moño Navideño Rojo Fantasía en la corona
    ctx.shadowBlur = 0; // Desactivar sombra para el lazo
    ctx.fillStyle = "#FF1744";
    ctx.strokeStyle = "#700010";
    ctx.lineWidth = 1.0;

    // Cinta izquierda
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(-4, -7.5, -5, -4, 0, -4);
    ctx.fill();
    ctx.stroke();

    // Cinta derecha
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(4, -7.5, 5, -4, 0, -4);
    ctx.fill();
    ctx.stroke();

    // Nudo central del lazo (Gema dorada/roja)
    ctx.fillStyle = "#00E676"; // Toque verde esmeralda festivo
    ctx.beginPath();
    ctx.arc(0, -4.6, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#004D20";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 8. Destello / Chispita estelar mágica en el hombro
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(4.5, -2);
    ctx.lineTo(5.5, -0.5);
    ctx.lineTo(7, 0.5);
    ctx.lineTo(5.5, 1.5);
    ctx.lineTo(4.5, 3);
    ctx.lineTo(3.5, 1.5);
    ctx.lineTo(2, 0.5);
    ctx.lineTo(3.5, -0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renderiza el Corazón de Vida con estilo Stylized 2D Game Art / Fantasy RPG Gem Heart
   */
  private drawHeartLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 12;
    ctx.scale(s, s);

    if (!isFilled) {
      // Estado de vida perdida: Silueta de cristal translúcido con marcas de grieta
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "rgba(140, 160, 190, 0.45)";
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.bezierCurveTo(-5, -4, -12, 1, 0, 12);
      ctx.bezierCurveTo(12, 1, 5, -4, 0, 3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 80, 80, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-3, 1);
      ctx.lineTo(2, 6);
      ctx.lineTo(-1, 9);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // --- ESTADO ACTIVO: GEMA DE RUBÍ FESTIVA 3D STYLIZED ---
    // 1. Resplandor exterior magenta / rubí
    ctx.shadowColor = "rgba(255, 23, 68, 0.85)";
    ctx.shadowBlur = 8;

    // 2. Bisel / Montura dorada exterior
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(0, 2.5);
    ctx.bezierCurveTo(-5.5, -4.8, -13.5, 0.5, 0, 13);
    ctx.bezierCurveTo(13.5, 0.5, 5.5, -4.8, 0, 2.5);
    ctx.closePath();
    ctx.fill();

    // Contorno oscuro nítido
    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.shadowBlur = 0; // Quitar sombra para capas interiores

    // 3. Faceta interna de Rubí (Degradado 3D multicapa)
    const rubyGrad = ctx.createRadialGradient(-2, 2, 1, 0, 4, 10);
    rubyGrad.addColorStop(0, "#FF80AB");
    rubyGrad.addColorStop(0.35, "#FF1744");
    rubyGrad.addColorStop(0.75, "#D50000");
    rubyGrad.addColorStop(1, "#6A0014");

    ctx.fillStyle = rubyGrad;
    ctx.beginPath();
    ctx.moveTo(0, 3.2);
    ctx.bezierCurveTo(-4.6, -3.8, -11.5, 1.2, 0, 11.6);
    ctx.bezierCurveTo(11.5, 1.2, 4.6, -3.8, 0, 3.2);
    ctx.closePath();
    ctx.fill();

    // 4. Brillo especular curvo de cristal (Lóbulo superior izquierdo)
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.beginPath();
    ctx.ellipse(-4.2, 1.2, 3.2, 1.6, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Destello de diamante estelar en la esquina
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-5.5, -1.5);
    ctx.lineTo(-4.5, -0.2);
    ctx.lineTo(-3.2, 0.5);
    ctx.lineTo(-4.5, 1.2);
    ctx.lineTo(-5.5, 2.5);
    ctx.lineTo(-6.5, 1.2);
    ctx.lineTo(-7.8, 0.5);
    ctx.lineTo(-6.5, -0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renderiza la Carita de Elfo con estilo Stylized 2D Game Art / Fantasy Game Concept Art
   */
  private drawStylizedElfLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 15;
    ctx.scale(s, s);

    if (!isFilled) {
      // Estado de vida perdida (Carita atenuada / silueta translúcida)
      ctx.globalAlpha = 0.25;
      
      // Silueta cabeza
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(0, 2, 9, 0, Math.PI * 2);
      ctx.fill();
      
      // Orejas elfo
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-14, -3);
      ctx.lineTo(-7, 4);
      ctx.moveTo(7, 0);
      ctx.lineTo(14, -3);
      ctx.lineTo(7, 4);
      ctx.fill();

      // Gorro elfo apagado
      ctx.beginPath();
      ctx.moveTo(-8, -1);
      ctx.bezierCurveTo(-8, -8, 2, -15, 10, -12);
      ctx.bezierCurveTo(5, -7, 8, -2, 8, -1);
      ctx.closePath();
      ctx.fillStyle = "rgba(120, 140, 160, 0.4)";
      ctx.fill();

      // Ojos derrotados en X
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4.5, 0.2); ctx.lineTo(-2, 2.7);
      ctx.moveTo(-2, 0.2); ctx.lineTo(-4.5, 2.7);
      ctx.moveTo(2, 0.2); ctx.lineTo(4.5, 2.7);
      ctx.moveTo(4.5, 0.2); ctx.lineTo(2, 2.7);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // --- ESTADO ACTIVO: Stylized 2D Fantasy Game Art ---
    
    // 1. Resplandor / Halo dorado mágico sutil
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 5;

    // 2. Orejas puntiagudas de Elfo (Fantasy Elven Ears)
    ctx.fillStyle = "#FFAA80";
    ctx.strokeStyle = "#8D3B1B";
    ctx.lineWidth = 1.2;

    // Oreja izquierda
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.bezierCurveTo(-15, -4, -16, 1, -7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sombra interna oreja izquierda
    ctx.fillStyle = "#FF8060";
    ctx.beginPath();
    ctx.moveTo(-8, 0.5);
    ctx.bezierCurveTo(-13, -2.5, -13, 0.5, -8, 3.5);
    ctx.closePath();
    ctx.fill();

    // Oreja derecha
    ctx.fillStyle = "#FFAA80";
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.bezierCurveTo(15, -4, 16, 1, 7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sombra interna oreja derecha
    ctx.fillStyle = "#FF8060";
    ctx.beginPath();
    ctx.moveTo(8, 0.5);
    ctx.bezierCurveTo(13, -2.5, 13, 0.5, 8, 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0; // Desactivar sombra para detalles limpios

    // 3. Cabeza redonda y simpática
    ctx.fillStyle = "#FFD8B3";
    ctx.beginPath();
    ctx.arc(0, 2.5, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7D3210";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 4. Mejillas sonrosadas kawaii / Stylized
    ctx.fillStyle = "rgba(255, 80, 110, 0.70)";
    ctx.beginPath();
    ctx.arc(-4.6, 4.2, 2.2, 0, Math.PI * 2);
    ctx.arc(4.6, 4.2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Ojos brillantes expresivos (Stylized Game Art)
    ctx.fillStyle = "#162842";
    ctx.beginPath();
    ctx.arc(-3.2, 1.2, 1.9, 0, Math.PI * 2);
    ctx.arc(3.2, 1.2, 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Brillos especulares en los ojos
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-2.6, 0.5, 0.75, 0, Math.PI * 2);
    ctx.arc(3.8, 0.5, 0.75, 0, Math.PI * 2);
    ctx.arc(-3.8, 2.0, 0.35, 0, Math.PI * 2);
    ctx.arc(2.6, 2.0, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sonrisa alegre
    ctx.strokeStyle = "#802A0A";
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2.2, 5.2);
    ctx.quadraticCurveTo(0, 7.2, 2.2, 5.2);
    ctx.stroke();

    // 7. Gorro Navideño Verde Puntiagudo Curvado
    ctx.fillStyle = "#1E8A38";
    ctx.beginPath();
    ctx.moveTo(-8.5, -0.5);
    ctx.bezierCurveTo(-9, -8, 1, -15, 11, -12);
    ctx.bezierCurveTo(6, -7, 8, -2, 8.5, -0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0B4A1C";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 8. Ribete / Borde del Gorro (Dorado festivo brillante)
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.roundRect(-9.5, -2.5, 19, 4.5, 2.2);
    ctx.fill();
    ctx.strokeStyle = "#B38600";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 9. Cascabel Dorado en la punta del gorro
    ctx.fillStyle = "#FFE600";
    ctx.beginPath();
    ctx.arc(11, -12, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#996D00";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Cruz / orificio del cascabel
    ctx.strokeStyle = "#6B4C00";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(10.2, -12); ctx.lineTo(11.8, -12);
    ctx.moveTo(11, -12.8); ctx.lineTo(11, -11.2);
    ctx.stroke();

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

  /**
   * Renderiza el banner cinemático de finalización cuando se agota el tiempo
   */
  protected drawFinishOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.isFinishing) return;

    ctx.save();
    const cx = this.width / 2;
    const cy = this.height * 0.44;

    // Fondo oscurecido con viñeta festiva
    const alpha = Math.min(0.78, (1.6 - this.finishTimer) * 2.2);
    ctx.fillStyle = `rgba(5, 12, 28, ${alpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Escala de entrada con rebote elástico
    const progress = Math.min(1.0, (1.6 - this.finishTimer) / 0.45);
    const scale = 0.55 + Math.sin(progress * Math.PI * 0.5) * 0.48;

    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const bannerW = Math.min(540, this.width * 0.88);
    const bannerH = 145;

    // Placa dorada brillante estilo Fantasy Game Art
    const goldGrad = ctx.createLinearGradient(0, -bannerH / 2, 0, bannerH / 2);
    goldGrad.addColorStop(0, "rgba(255, 235, 59, 0.98)");
    goldGrad.addColorStop(0.5, "rgba(255, 179, 0, 0.98)");
    goldGrad.addColorStop(1, "rgba(230, 81, 0, 0.98)");

    ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
    ctx.shadowBlur = 30;

    ctx.fillStyle = "rgba(10, 25, 47, 0.95)";
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 20);
    ctx.fill();
    ctx.stroke();

    // Texto principal 3D: ¡TIEMPO AGOTADO!
    ctx.shadowBlur = 0;
    ctx.font = `900 ${Math.max(22, Math.min(38, this.width * 0.068))}px 'Titan One', 'Fredoka', 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Sombra gruesa de alto contraste
    ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
    ctx.lineWidth = 6;
    ctx.strokeText("⏰ ¡TIEMPO AGOTADO!", 0, -20);

    // Relleno dorado
    ctx.fillStyle = "#FFF59D";
    ctx.fillText("¡TIEMPO AGOTADO!", 0, -20);

    // Subtítulo
    ctx.font = `800 ${Math.max(14, Math.min(22, this.width * 0.038))}px 'Outfit', sans-serif`;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 4;
    ctx.strokeText("¡CALCULANDO PUNTUACIÓN MÁGICA!", 0, 26);
    ctx.fillStyle = "#FFD700";
    ctx.fillText("¡CALCULANDO PUNTUACIÓN MÁGICA!", 0, 26);

    ctx.restore();
  }

  public destroy(): void {
    this.isRunning = false;
    this.isGameOver = true;
    if (this.inGameMusicPath) {
      this.audio.stopGameBGM();
    }
    this.audio.setGameActive(false);
  }
}
