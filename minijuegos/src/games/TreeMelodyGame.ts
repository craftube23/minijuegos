/**
 * ==============================================================================
 * JUEGO 3: ENCIENDE EL ÁRBOL MÁGICO (Magic Lights Melody - Edición Pulida)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El gran Árbol Mágico de Navidad de la Feria tiene 4 esferas ornamentales táctiles gigantes:
 *   1. Esfera Roja (Campana Navideña)
 *   2. Esfera Dorada (Estrella de Belén)
 *   3. Esfera Esmeralda (Pino Festivo)
 *   4. Esfera Zafiro (Cristal de Nieve)
 * - El juego toca una secuencia musical luminosa que se alarga en cada ronda (Estilo Simón Dice).
 * - El jugador debe repetir la melodía tocando las esferas en el orden correcto.
 * - En rondas avanzadas (Ronda 4+) se activa el Modo Feria con confeti y Bonus x2.
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
}

export class TreeMelodyGame extends BaseGame {
  private bulbs: MagicBulb[] = [];
  private sequence: number[] = [];
  private playerStep: number = 0;
  private isShowingSequence: boolean = false;
  private sequenceIndex: number = 0;
  private playbackTimer: number = 0;
  private readonly stepDelay: number = 0.55;
  private currentRound: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "tree-melody",
      "Enciende el Árbol Mágico",
      "¡Mira la secuencia de luces navideñas y repite la melodía tocando las esferas mágicas!",
      canvas,
      input,
      audio,
      particles
    );

    this.input.onTap = (x: number, y: number) => {
      if (this.isShowingSequence || this.timeRemaining <= 0) return;
      for (const bulb of this.bulbs) {
        const dist = Math.hypot(x - bulb.x, y - bulb.y);
        if (dist <= bulb.radius) {
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
    const cy = this.height * 0.53;
    const radius = Math.min(105, Math.max(55, this.width * 0.18));
    const offset = radius * 1.25;

    this.bulbs = [
      {
        id: 0,
        x: cx - offset,
        y: cy - offset + 30,
        radius,
        colorName: "Rojo",
        baseColor: "#922B21",
        litColor: "#FF416C",
        soundIndex: 0,
        iconType: "bell",
        isLit: false,
        litTimer: 0
      },
      {
        id: 1,
        x: cx + offset,
        y: cy - offset + 30,
        radius,
        colorName: "Dorado",
        baseColor: "#B7950B",
        litColor: "#FFD700",
        soundIndex: 1,
        iconType: "star",
        isLit: false,
        litTimer: 0
      },
      {
        id: 2,
        x: cx - offset,
        y: cy + offset - 20,
        radius,
        colorName: "Verde",
        baseColor: "#196F3D",
        litColor: "#2ECC71",
        soundIndex: 2,
        iconType: "tree",
        isLit: false,
        litTimer: 0
      },
      {
        id: 3,
        x: cx + offset,
        y: cy + offset - 20,
        radius,
        colorName: "Azul",
        baseColor: "#1B4F72",
        litColor: "#00E5FF",
        soundIndex: 3,
        iconType: "snowflake",
        isLit: false,
        litTimer: 0
      }
    ];
  }

  private startNewRound(): void {
    const nextBulb = Math.floor(Math.random() * 4);
    this.sequence.push(nextBulb);
    this.playerStep = 0;
    this.isShowingSequence = true;
    this.sequenceIndex = 0;
    this.playbackTimer = 0.6;
  }

  protected onStart(): void {
    this.layoutBulbs();
    this.sequence = [];
    this.currentRound = 1;
    this.startNewRound();
  }

  protected onUpdate(dt: number): void {
    // 1. Actualizar timers de iluminación de las esferas
    for (const bulb of this.bulbs) {
      if (bulb.isLit) {
        bulb.litTimer -= dt;
        if (bulb.litTimer <= 0) {
          bulb.isLit = false;
        }
      }
    }

    // 2. Modo Reproducción de Secuencia
    if (this.isShowingSequence) {
      this.playbackTimer -= dt;
      if (this.playbackTimer <= 0) {
        if (this.sequenceIndex < this.sequence.length) {
          const bulbId = this.sequence[this.sequenceIndex];
          this.lightBulb(bulbId, 0.45);
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
      this.audio.playBellNote(bulb.soundIndex);
      this.particles.emitBurst(bulb.x, bulb.y, bulb.litColor, 12);
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

      // Comprobar si completó toda la secuencia
      if (this.playerStep >= this.sequence.length) {
        const roundBonus = this.sequence.length * 150;
        this.addScore(roundBonus);
        this.addFloatingText(`¡RONDA SUPERADA! +${roundBonus}`, this.width / 2, this.height * 0.28, "#FFD700", 1.3);
        this.audio.playCatchItem();
        this.particles.emitConfetti(this.width, 25);
        this.currentRound++;

        // Bonus especial cada 3 rondas
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
      this.addFloatingText("¡VUELVE A INTENTAR!", this.width / 2, this.height * 0.28, "#FF1744", 1.2);
      this.particles.emitBurst(this.bulbs[bulbId].x, this.bulbs[bulbId].y, "#FF416C", 20);

      // Repetir la misma secuencia para que el jugador lo intente de nuevo
      this.isShowingSequence = true;
      this.sequenceIndex = 0;
      this.playerStep = 0;
      this.playbackTimer = 1.0;
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo místico navideño
    const bgGrad = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.5,
      100,
      this.width / 2,
      this.height * 0.5,
      this.height * 0.7
    );
    bgGrad.addColorStop(0, "#0E3A2F");
    bgGrad.addColorStop(0.5, "#071E1A");
    bgGrad.addColorStop(1, "#030D0C");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Silueta vectorial del Gran Árbol Mágico
    const cx = this.width / 2;
    const treeTopY = this.height * 0.16;
    const treeBottomY = this.height * 0.88;

    ctx.save();
    ctx.fillStyle = "rgba(10, 60, 40, 0.4)";
    ctx.beginPath();
    ctx.moveTo(cx, treeTopY);
    ctx.lineTo(cx + this.width * 0.42, treeBottomY);
    ctx.lineTo(cx - this.width * 0.42, treeBottomY);
    ctx.closePath();
    ctx.fill();

    // Estrella dorada en la cima del árbol
    const starR = 24;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(angle) * starR;
      const py = treeTopY + Math.sin(angle) * starR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Guirnaldas de luces navideñas decorativas
    ctx.strokeStyle = "rgba(255, 215, 0, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.bulbs[0].x, this.bulbs[0].y);
    ctx.bezierCurveTo(cx, this.bulbs[0].y - 30, cx, this.bulbs[1].y - 30, this.bulbs[1].x, this.bulbs[1].y);
    ctx.bezierCurveTo(this.bulbs[1].x + 40, cx, this.bulbs[3].x + 40, cx, this.bulbs[3].x, this.bulbs[3].y);
    ctx.bezierCurveTo(cx, this.bulbs[3].y + 30, cx, this.bulbs[2].y + 30, this.bulbs[2].x, this.bulbs[2].y);
    ctx.stroke();

    // 4. Dibujar las 4 Esferas Navideñas Táctiles
    for (const bulb of this.bulbs) {
      ctx.save();

      // Efecto de resplandor cuando está encendida
      if (bulb.isLit) {
        ctx.fillStyle = bulb.litColor;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(bulb.x, bulb.y, bulb.radius * 1.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Esfera base con gradiente 3D
      const bulbGrad = ctx.createRadialGradient(
        bulb.x - bulb.radius * 0.3,
        bulb.y - bulb.radius * 0.3,
        bulb.radius * 0.1,
        bulb.x,
        bulb.y,
        bulb.radius
      );
      bulbGrad.addColorStop(0, bulb.isLit ? "#FFFFFF" : "#E0E0E0");
      bulbGrad.addColorStop(0.3, bulb.isLit ? bulb.litColor : bulb.baseColor);
      bulbGrad.addColorStop(1, "#0A0A0A");

      ctx.fillStyle = bulbGrad;
      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, bulb.radius, 0, Math.PI * 2);
      ctx.fill();

      // Borde dorado de lujo
      ctx.strokeStyle = bulb.isLit ? "#FFFFFF" : "#FFD700";
      ctx.lineWidth = bulb.isLit ? 6 : 4;
      ctx.stroke();

      // Corona de sujeción ornamental de la esfera
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(bulb.x - 14, bulb.y - bulb.radius - 12, 28, 14);

      // Icono vectorial festivo en el centro de la esfera
      ctx.fillStyle = bulb.isLit ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;

      const iconR = bulb.radius * 0.4;
      if (bulb.iconType === "star") {
        // Estrella
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = bulb.x + Math.cos(angle) * iconR;
          const py = bulb.y + Math.sin(angle) * iconR;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (bulb.iconType === "tree") {
        // Pino
        ctx.beginPath();
        ctx.moveTo(bulb.x, bulb.y - iconR);
        ctx.lineTo(bulb.x + iconR * 0.8, bulb.y + iconR * 0.8);
        ctx.lineTo(bulb.x - iconR * 0.8, bulb.y + iconR * 0.8);
        ctx.closePath();
        ctx.fill();
      } else if (bulb.iconType === "snowflake") {
        // Cristal de nieve
        for (let a = 0; a < 3; a++) {
          const angle = (a * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(bulb.x + Math.cos(angle) * iconR, bulb.y + Math.sin(angle) * iconR);
          ctx.lineTo(bulb.x - Math.cos(angle) * iconR, bulb.y - Math.sin(angle) * iconR);
          ctx.stroke();
        }
      } else {
        // Campana
        ctx.beginPath();
        ctx.arc(bulb.x, bulb.y - iconR * 0.2, iconR * 0.6, Math.PI, 0);
        ctx.lineTo(bulb.x + iconR * 0.7, bulb.y + iconR * 0.6);
        ctx.lineTo(bulb.x - iconR * 0.7, bulb.y + iconR * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // 5. Banner de Instrucción Superior
    const bannerText = this.isShowingSequence
      ? `MIRA Y ESCUCHA LA MELODÍA (Ronda ${this.currentRound})`
      : `¡TU TURNO! (Paso ${this.playerStep + 1} de ${this.sequence.length})`;

    const bannerColor = this.isShowingSequence ? "#FFD700" : "#2ECC71";

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.roundRect(this.width * 0.08, this.height * 0.22, this.width * 0.84, 48, [14]);
    ctx.fill();

    ctx.font = "700 20px 'Fredoka', 'Outfit', sans-serif";
    ctx.fillStyle = bannerColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bannerText, this.width / 2, this.height * 0.22 + 24);
  }
}
