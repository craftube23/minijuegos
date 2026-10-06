/**
 * ==============================================================================
 * JUEGO 3: ENCIENDE EL ÁRBOL MÁGICO (Magic Lights Melody - Edición Pulida HD)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El gran Árbol Mágico de Navidad de la Feria tiene 4 esferas ornamentales táctiles gigantes:
 *   1. Esfera Roja (bola-roja.png)
 *   2. Esfera Amarilla/Dorada (bola-amarilla.png)
 *   3. Esfera Verde (bola-verde.png)
 *   4. Esfera Azul (bola-azul.png)
 * - Cima del Árbol: Estrella luminosa con logo oficial de la Feria (estrella con logo.png).
 * - Fondo: Habitación navideña cálida y festiva (fondo-habitacion.webp).
 * - El juego reproduce una secuencia musical luminosa que crece en cada ronda (Estilo Simón Dice).
 * - El jugador debe repetir la melodía tocando las esferas en el orden correcto.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface MagicBulb {
  id: number;
  x: number;
  y: number;
  radius: number;
  colorName: string;
  baseColor: string;
  litColor: string;
  soundIndex: number;
  iconType: "bell" | "star" | "tree" | "snowflake";
  isLit: boolean;
  litTimer: number;
  scale: number;
}

export class TreeMelodyGame extends BaseGame {
  private bulbs: MagicBulb[] = [];
  private sequence: number[] = [];
  private playerStep: number = 0;
  private isShowingSequence: boolean = false;
  private sequenceIndex: number = 0;
  private playbackTimer: number = 0;
  private readonly stepDelay: number = 0.52;
  private currentRound: number = 1;

  // Dimensiones del Árbol y Estrella
  private treeX: number = 0;
  private treeY: number = 0;
  private treeW: number = 0;
  private treeH: number = 0;
  private starX: number = 0;
  private starY: number = 0;
  private starSize: number = 0;
  private starPulse: number = 0;

  // Sprites HD de los nuevos elementos
  private bgImage: HTMLImageElement;
  private treeImage: HTMLImageElement;
  private starImage: HTMLImageElement;
  private imgBallRed: HTMLImageElement;
  private imgBallYellow: HTMLImageElement;
  private imgBallGreen: HTMLImageElement;
  private imgBallBlue: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "tree-melody",
      "🎄 Enciende el Árbol Mágico",
      "¡Mira la secuencia de luces navideñas y repite la melodía tocando las esferas mágicas!",
      canvas,
      input,
      audio,
      particles
    );

    // Carga de Sprites HD
    this.bgImage = new Image();
    this.bgImage.src = "/assets/images/fondo-habitacion.webp";

    this.treeImage = new Image();
    this.treeImage.src = "/assets/images/arbol.png";

    this.starImage = new Image();
    this.starImage.src = "/assets/images/estrella con logo.png";

    this.imgBallRed = new Image();
    this.imgBallRed.src = "/assets/images/bola-roja.png";

    this.imgBallYellow = new Image();
    this.imgBallYellow.src = "/assets/images/bola-amarilla.png";

    this.imgBallGreen = new Image();
    this.imgBallGreen.src = "/assets/images/bola-verde.png";

    this.imgBallBlue = new Image();
    this.imgBallBlue.src = "/assets/images/bola-azul.png";

    this.input.onTap = (x: number, y: number) => {
      if (this.isShowingSequence || this.timeRemaining <= 0) return;
      for (const bulb of this.bulbs) {
        const dist = Math.hypot(x - bulb.x, y - bulb.y);
        // Zona táctil ergonómica (radio + tolerancia de 15px)
        if (dist <= bulb.radius + 15) {
          this.handleBulbTouch(bulb.id);
          break;
        }
      }
    };
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.layoutBulbs();
  }

  private layoutBulbs(): void {
    const cx = this.width / 2;

    // Dimensiones y posición del Árbol de Navidad
    this.treeW = Math.min(this.width * 0.94, this.height * 0.68);
    this.treeH = this.treeW * 1.24;
    this.treeX = (this.width - this.treeW) / 2;
    this.treeY = this.height * 0.58 - this.treeH * 0.50;

    // Estrella en la cima
    this.starSize = Math.max(68, Math.min(135, this.width * 0.22));
    this.starX = cx;
    this.starY = this.treeY + this.treeH * 0.08;

    // Radio de las esferas táctiles
    const radius = Math.min(68, Math.max(44, this.width * 0.125));

    // Distribución natural en las ramas del árbol
    const upperY = this.treeY + this.treeH * 0.44;
    const upperOffsetX = this.treeW * 0.22;

    const lowerY = this.treeY + this.treeH * 0.72;
    const lowerOffsetX = this.treeW * 0.31;

    this.bulbs = [
      {
        id: 0,
        x: cx - upperOffsetX,
        y: upperY,
        radius,
        colorName: "Rojo",
        baseColor: "#E53935",
        litColor: "#FF1744",
        soundIndex: 0,
        iconType: "bell",
        isLit: false,
        litTimer: 0,
        scale: 1.0
      },
      {
        id: 1,
        x: cx + upperOffsetX,
        y: upperY,
        radius,
        colorName: "Dorado",
        baseColor: "#FBC02D",
        litColor: "#FFD700",
        soundIndex: 1,
        iconType: "star",
        isLit: false,
        litTimer: 0,
        scale: 1.0
      },
      {
        id: 2,
        x: cx - lowerOffsetX,
        y: lowerY,
        radius,
        colorName: "Verde",
        baseColor: "#43A047",
        litColor: "#00E676",
        soundIndex: 2,
        iconType: "tree",
        isLit: false,
        litTimer: 0,
        scale: 1.0
      },
      {
        id: 3,
        x: cx + lowerOffsetX,
        y: lowerY,
        radius,
        colorName: "Azul",
        baseColor: "#1E88E5",
        litColor: "#00E5FF",
        soundIndex: 3,
        iconType: "snowflake",
        isLit: false,
        litTimer: 0,
        scale: 1.0
      }
    ];
  }

  private startNewRound(): void {
    const nextBulb = Math.floor(Math.random() * 4);
    this.sequence.push(nextBulb);
    this.playerStep = 0;
    this.isShowingSequence = true;
    this.sequenceIndex = 0;
    this.playbackTimer = 0.65;
  }

  protected onStart(): void {
    this.layoutBulbs();
    this.sequence = [];
    this.currentRound = 1;
    this.starPulse = 0;
    this.startNewRound();
  }

  protected onUpdate(dt: number): void {
    this.starPulse += dt * 3;

    // 1. Actualizar timers y rebote elástico de las esferas
    for (const bulb of this.bulbs) {
      if (bulb.isLit) {
        bulb.litTimer -= dt;
        bulb.scale += (1.25 - bulb.scale) * 16 * dt;
        if (bulb.litTimer <= 0) {
          bulb.isLit = false;
        }
      } else {
        bulb.scale += (1.0 - bulb.scale) * 12 * dt;
      }
    }

    // 2. Modo Reproducción de Secuencia Musical
    if (this.isShowingSequence) {
      this.playbackTimer -= dt;
      if (this.playbackTimer <= 0) {
        if (this.sequenceIndex < this.sequence.length) {
          const bulbId = this.sequence[this.sequenceIndex];
          this.lightBulb(bulbId, 0.42);
          this.sequenceIndex++;
          this.playbackTimer = this.stepDelay;
        } else {
          this.isShowingSequence = false;
          this.playerStep = 0;
        }
      }
    }
  }

  private lightBulb(bulbId: number, duration: number = 0.4): void {
    const bulb = this.bulbs[bulbId];
    if (bulb) {
      bulb.isLit = true;
      bulb.litTimer = duration;
      bulb.scale = 1.32; // Impulso elástico
      this.audio.playBellNote(bulb.soundIndex);
      this.particles.emitBurst(bulb.x, bulb.y, bulb.litColor, 16);
    }
  }

  private handleBulbTouch(bulbId: number): void {
    this.lightBulb(bulbId, 0.35);

    const expectedBulb = this.sequence[this.playerStep];
    if (bulbId === expectedBulb) {
      // Nota correcta
      this.addScore(50);
      this.addFloatingText("+50", this.bulbs[bulbId].x, this.bulbs[bulbId].y - 45, "#00E676");
      this.playerStep++;

      // Comprobar si completó toda la secuencia de la ronda
      if (this.playerStep >= this.sequence.length) {
        const roundBonus = this.sequence.length * 150;
        this.addScore(roundBonus);
        this.addFloatingText(`¡RONDA ${this.currentRound} SUPERADA! +${roundBonus}`, this.width / 2, this.height * 0.26, "#FFD700", 1.35);
        this.audio.playCatchItem();
        this.particles.emitConfetti(this.width, 30);
        this.currentRound++;

        // Bonus especial de la Feria Mágica cada 3 rondas
        if (this.currentRound % 3 === 0) {
          this.triggerLogoPowerUp(1, 6);
        }

        // Breve pausa y siguiente ronda
        setTimeout(() => {
          if (this.timeRemaining > 0) {
            this.startNewRound();
          }
        }, 900);
      }
    } else {
      // Error de secuencia
      this.audio.playError();
      this.triggerShake(0.25, 8);
      this.addFloatingText("¡VUELVE A INTENTAR!", this.width / 2, this.height * 0.26, "#FF1744", 1.25);
      this.particles.emitBurst(this.bulbs[bulbId].x, this.bulbs[bulbId].y, "#FF416C", 20);

      // Repetir la misma secuencia para aprendizaje
      this.isShowingSequence = true;
      this.sequenceIndex = 0;
      this.playerStep = 0;
      this.playbackTimer = 1.0;
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;

    // 1. Fondo de Habitación Navideña HD
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      // Capa de penumbra suave para que resalten las luces del árbol
      ctx.fillStyle = "rgba(5, 15, 28, 0.42)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // Degradado místico de respaldo
      const bgGrad = ctx.createRadialGradient(cx, this.height * 0.5, 100, cx, this.height * 0.5, this.height * 0.75);
      bgGrad.addColorStop(0, "#0E3A2F");
      bgGrad.addColorStop(0.5, "#071E1A");
      bgGrad.addColorStop(1, "#030D0C");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Silueta / Sprite HD del Gran Árbol Navideño
    if (this.treeImage && this.treeImage.complete && this.treeImage.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(this.treeImage, this.treeX, this.treeY, this.treeW, this.treeH);
      ctx.restore();
    } else {
      // Silueta vectorial de respaldo si la imagen aún carga
      ctx.save();
      ctx.fillStyle = "rgba(10, 60, 40, 0.6)";
      ctx.beginPath();
      ctx.moveTo(cx, this.treeY);
      ctx.lineTo(cx + this.treeW * 0.45, this.treeY + this.treeH);
      ctx.lineTo(cx - this.treeW * 0.45, this.treeY + this.treeH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Estrella con Logo Oficial en la Cima del Árbol
    ctx.save();
    const starGlowAlpha = 0.45 + Math.sin(this.starPulse) * 0.25;
    const currentStarSize = this.starSize * (1.0 + Math.sin(this.starPulse * 1.5) * 0.04);

    // Halo dorado de la estrella
    const starHalo = ctx.createRadialGradient(this.starX, this.starY, currentStarSize * 0.2, this.starX, this.starY, currentStarSize * 0.85);
    starHalo.addColorStop(0, `rgba(255, 215, 0, ${starGlowAlpha})`);
    starHalo.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = starHalo;
    ctx.beginPath();
    ctx.arc(this.starX, this.starY, currentStarSize * 0.85, 0, Math.PI * 2);
    ctx.fill();

    if (this.starImage && this.starImage.complete && this.starImage.naturalWidth > 0) {
      ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
      ctx.shadowBlur = 18;
      ctx.drawImage(
        this.starImage,
        this.starX - currentStarSize / 2,
        this.starY - currentStarSize / 2,
        currentStarSize,
        currentStarSize
      );
    } else {
      // Estrella vectorial de respaldo
      const starR = currentStarSize * 0.35;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = this.starX + Math.cos(angle) * starR;
        const py = this.starY + Math.sin(angle) * starR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 4. Guirnaldas de luces entre las esferas
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.bulbs[0].x, this.bulbs[0].y);
    ctx.bezierCurveTo(cx, this.bulbs[0].y - 25, cx, this.bulbs[1].y - 25, this.bulbs[1].x, this.bulbs[1].y);
    ctx.bezierCurveTo(this.bulbs[1].x + 35, cx, this.bulbs[3].x + 35, cx, this.bulbs[3].x, this.bulbs[3].y);
    ctx.bezierCurveTo(cx, this.bulbs[3].y + 25, cx, this.bulbs[2].y + 25, this.bulbs[2].x, this.bulbs[2].y);
    ctx.stroke();

    // 5. Dibujar las 4 Esferas Navideñas Táctiles (Sprites HD)
    for (const bulb of this.bulbs) {
      ctx.save();
      ctx.translate(bulb.x, bulb.y);
      ctx.scale(bulb.scale, bulb.scale);

      // Efecto de resplandor expansivo cuando está encendida
      if (bulb.isLit) {
        const halo = ctx.createRadialGradient(0, 0, bulb.radius * 0.3, 0, 0, bulb.radius * 1.6);
        halo.addColorStop(0, bulb.litColor);
        halo.addColorStop(0.6, bulb.litColor);
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = halo;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, bulb.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Identificar sprite HD correspondiente
      let ballImg: HTMLImageElement | null = null;
      if (bulb.id === 0) ballImg = this.imgBallRed;
      else if (bulb.id === 1) ballImg = this.imgBallYellow;
      else if (bulb.id === 2) ballImg = this.imgBallGreen;
      else if (bulb.id === 3) ballImg = this.imgBallBlue;

      const drawSize = bulb.radius * 2.15;

      if (ballImg && ballImg.complete && ballImg.naturalWidth > 0) {
        ctx.shadowColor = bulb.isLit ? bulb.litColor : "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = bulb.isLit ? 28 : 12;
        ctx.drawImage(ballImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

        // Borde de luz activa si está encendida
        if (bulb.isLit) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, bulb.radius * 0.98, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Fallback 3D Canvas
        const bulbGrad = ctx.createRadialGradient(-bulb.radius * 0.3, -bulb.radius * 0.3, bulb.radius * 0.1, 0, 0, bulb.radius);
        bulbGrad.addColorStop(0, bulb.isLit ? "#FFFFFF" : "#E0E0E0");
        bulbGrad.addColorStop(0.3, bulb.isLit ? bulb.litColor : bulb.baseColor);
        bulbGrad.addColorStop(1, "#0A0A0A");

        ctx.fillStyle = bulbGrad;
        ctx.beginPath();
        ctx.arc(0, 0, bulb.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = bulb.isLit ? "#FFFFFF" : "#FFD700";
        ctx.lineWidth = bulb.isLit ? 6 : 4;
        ctx.stroke();
      }

      ctx.restore();
    }

    // 6. Banner de Instrucción Superior con Estilo Festivo
    const bannerText = this.isShowingSequence
      ? `MIRA Y ESCUCHA LA MELODÍA (Ronda ${this.currentRound})`
      : `¡TU TURNO! (Paso ${this.playerStep + 1} de ${this.sequence.length})`;

    const bannerColor = this.isShowingSequence ? "#FFD700" : "#2ECC71";

    ctx.save();
    ctx.fillStyle = "rgba(5, 15, 28, 0.85)";
    ctx.strokeStyle = bannerColor;
    ctx.lineWidth = 2;
    const bannerW = Math.min(this.width * 0.88, 480);
    const bannerH = 46;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = this.height * 0.20;

    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, [16]);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 18px 'Outfit', sans-serif";
    ctx.fillStyle = bannerColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 6;
    ctx.fillText(bannerText, this.width / 2, bannerY + bannerH / 2);
    ctx.restore();
  }
}
