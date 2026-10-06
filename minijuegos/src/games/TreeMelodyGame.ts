/**
 * ==============================================================================
 * JUEGO 3: ENCIENDE EL ÁRBOL MÁGICO (Magic Lights Melody - Edición Pulida HD)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El gran Árbol Mágico de Navidad de la Feria tiene 4 esferas ornamentales táctiles gigantes:
 *   1. Esfera Roja (bola-roja.png) - Nota Do
 *   2. Esfera Amarilla/Dorada (bola-amarilla.png) - Nota Mi
 *   3. Esfera Verde (bola-verde.png) - Nota Sol
 *   4. Esfera Azul (bola-azul.png) - Nota Do agudo
 * - Cima del Árbol: Estrella luminosa con logo de la Feria (estrella con logo.png).
 * - Fondo: Habitación navideña cálida (fondo-habitacion.webp).
 * - Simón Dice Navideño: El juego reproduce una melodía luminosa y el jugador la repite.
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
  private readonly stepDelay: number = 0.58;
  private currentRound: number = 1;
  private isRoundTransitioning: boolean = false;

  // Dimensiones del Árbol y Estrella
  private treeX: number = 0;
  private treeY: number = 0;
  private treeW: number = 0;
  private treeH: number = 0;
  private starX: number = 0;
  private starY: number = 0;
  private starSize: number = 0;
  private starPulse: number = 0;

  // Sprites HD
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

    // Carga de Sprites
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

    // Manejador táctil
    this.input.onTap = (x: number, y: number) => {
      if (this.isShowingSequence || this.isRoundTransitioning || this.timeRemaining <= 0 || !this.isRunning) {
        return;
      }

      for (const bulb of this.bulbs) {
        const dist = Math.hypot(x - bulb.x, y - bulb.y);
        // Zona táctil generosa y ergonómica
        if (dist <= bulb.radius + 20) {
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

    // Árbol más ancho, frondoso y pegado abajo
    const treeAspectRatio = 1.15; // Árbol robusto y amplio
    this.treeH = Math.min(this.height * 0.80, this.width * 1.08);
    this.treeW = this.treeH / treeAspectRatio;
    this.treeX = cx - this.treeW / 2;
    // Pegado directamente a la base/suelo
    this.treeY = this.height - this.treeH + 22;

    // Estrella ajustada a la copa superior
    this.starSize = Math.max(70, Math.min(125, this.width * 0.21));
    this.starX = cx;
    this.starY = this.treeY + this.treeH * 0.05;

    // Radio de las esferas
    const radius = Math.min(54, Math.max(38, this.width * 0.108));

    // Nivel superior (Esfera Roja y Amarilla dentro de las hojas superiores)
    const upperY = this.treeY + this.treeH * 0.44;
    const upperOffsetX = this.treeW * 0.22;

    // Nivel inferior (Esfera Verde y Azul dentro del follaje ancho inferior)
    const lowerY = this.treeY + this.treeH * 0.69;
    const lowerOffsetX = this.treeW * 0.27;

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
    this.isRoundTransitioning = false;
    this.sequenceIndex = 0;
    this.playbackTimer = 0.75; // Pausa inicial antes de empezar a tocar
  }

  protected onStart(): void {
    this.layoutBulbs();
    this.sequence = [];
    this.currentRound = 1;
    this.starPulse = 0;
    this.isRoundTransitioning = false;
    this.startNewRound();
  }

  protected onUpdate(dt: number): void {
    this.starPulse += dt * 3;

    // 1. Actualizar iluminación y rebote elástico de las 4 esferas
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

    // 2. Reproducción de la Secuencia Musical
    if (this.isShowingSequence && !this.isRoundTransitioning) {
      this.playbackTimer -= dt;
      if (this.playbackTimer <= 0) {
        if (this.sequenceIndex < this.sequence.length) {
          const bulbId = this.sequence[this.sequenceIndex];
          this.lightBulb(bulbId, 0.40);
          this.sequenceIndex++;
          this.playbackTimer = this.stepDelay;
        } else {
          // Secuencia completada: el turno pasa al jugador
          this.isShowingSequence = false;
          this.playerStep = 0;
        }
      }
    }
  }

  private lightBulb(bulbId: number, duration: number = 0.38): void {
    const bulb = this.bulbs[bulbId];
    if (bulb) {
      bulb.isLit = true;
      bulb.litTimer = duration;
      bulb.scale = 1.30;
      this.audio.playBellNote(bulb.soundIndex);
      this.particles.emitBurst(bulb.x, bulb.y, bulb.litColor, 15);
    }
  }

  private handleBulbTouch(bulbId: number): void {
    this.lightBulb(bulbId, 0.32);

    const expectedBulb = this.sequence[this.playerStep];
    if (bulbId === expectedBulb) {
      // Acierto de nota
      this.addScore(50);
      this.addFloatingText("+50", this.bulbs[bulbId].x, this.bulbs[bulbId].y - 35, "#00E676");
      this.playerStep++;

      // Comprobar si completó toda la secuencia de la ronda
      if (this.playerStep >= this.sequence.length) {
        this.isRoundTransitioning = true;
        const roundBonus = this.sequence.length * 150;
        this.addScore(roundBonus);
        this.addFloatingText(`¡RONDA ${this.currentRound} SUPERADA! +${roundBonus}`, this.width / 2, this.height * 0.16, "#FFD700", 1.35);
        this.audio.playCatchItem();
        this.particles.emitConfetti(this.width, 30);
        this.currentRound++;

        // Bonus especial cada 3 rondas
        if (this.currentRound % 3 === 0) {
          this.triggerLogoPowerUp(1, 6);
        }

        // Breve pausa para admirar el acierto y comenzar siguiente ronda
        setTimeout(() => {
          if (this.timeRemaining > 0 && this.isRunning) {
            this.startNewRound();
          }
        }, 900);
      }
    } else {
      // Error de secuencia
      this.audio.playError();
      this.triggerShake(0.25, 8);
      this.addFloatingText("¡VUELVE A INTENTAR!", this.width / 2, this.height * 0.16, "#FF1744", 1.25);
      this.particles.emitBurst(this.bulbs[bulbId].x, this.bulbs[bulbId].y, "#FF416C", 20);

      // Repetir la misma secuencia para que el jugador la vuelva a escuchar
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
      ctx.fillStyle = "rgba(5, 15, 28, 0.35)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const bgGrad = ctx.createRadialGradient(cx, this.height * 0.5, 100, cx, this.height * 0.5, this.height * 0.75);
      bgGrad.addColorStop(0, "#0E3A2F");
      bgGrad.addColorStop(0.5, "#071E1A");
      bgGrad.addColorStop(1, "#030D0C");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Gran Árbol Navideño (Sprite HD con proporciones naturales intactas)
    if (this.treeImage && this.treeImage.complete && this.treeImage.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(this.treeImage, this.treeX, this.treeY, this.treeW, this.treeH);
      ctx.restore();
    }

    // 3. Estrella con Logo Oficial en la Cima del Árbol
    ctx.save();
    const starGlowAlpha = 0.45 + Math.sin(this.starPulse) * 0.25;
    const currentStarSize = this.starSize * (1.0 + Math.sin(this.starPulse * 1.5) * 0.04);

    // Halo dorado resplandeciente
    const starHalo = ctx.createRadialGradient(this.starX, this.starY, currentStarSize * 0.15, this.starX, this.starY, currentStarSize * 0.80);
    starHalo.addColorStop(0, `rgba(255, 215, 0, ${starGlowAlpha})`);
    starHalo.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = starHalo;
    ctx.beginPath();
    ctx.arc(this.starX, this.starY, currentStarSize * 0.80, 0, Math.PI * 2);
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
    }
    ctx.restore();

    // 4. Dibujar las 4 Esferas Navideñas Táctiles sobre las ramas
    for (const bulb of this.bulbs) {
      ctx.save();
      ctx.translate(bulb.x, bulb.y);
      ctx.scale(bulb.scale, bulb.scale);

      // Efecto de halo expansivo cuando la esfera se enciende
      if (bulb.isLit) {
        const halo = ctx.createRadialGradient(0, 0, bulb.radius * 0.3, 0, 0, bulb.radius * 1.6);
        halo.addColorStop(0, bulb.litColor);
        halo.addColorStop(0.6, bulb.litColor);
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = halo;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(0, 0, bulb.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Sprite HD de la esfera correspondiente
      let ballImg: HTMLImageElement | null = null;
      if (bulb.id === 0) ballImg = this.imgBallRed;
      else if (bulb.id === 1) ballImg = this.imgBallYellow;
      else if (bulb.id === 2) ballImg = this.imgBallGreen;
      else if (bulb.id === 3) ballImg = this.imgBallBlue;

      const drawSize = bulb.radius * 2.15;

      if (ballImg && ballImg.complete && ballImg.naturalWidth > 0) {
        ctx.shadowColor = bulb.isLit ? bulb.litColor : "rgba(0, 0, 0, 0.75)";
        ctx.shadowBlur = bulb.isLit ? 28 : 10;
        ctx.drawImage(ballImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

        // Borde blanco de pulso si está encendida
        if (bulb.isLit) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, bulb.radius * 0.98, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // 5. Placa de Instrucción Superior (Ubicada en la parte superior sin tapar el árbol)
    const bannerText = this.isShowingSequence
      ? `MIRA LA MELODÍA (Ronda ${this.currentRound})`
      : `¡TU TURNO! (Paso ${this.playerStep + 1} de ${this.sequence.length})`;

    const isPlayerTurn = !this.isShowingSequence;
    const bannerBorder = isPlayerTurn ? "#00E676" : "#FFD700";
    const bannerTextColor = isPlayerTurn ? "#E8F8F5" : "#FFF9C4";

    ctx.save();
    const bannerW = Math.min(this.width * 0.82, 420);
    const bannerH = 42;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = Math.max(14, this.height * 0.035); // En la parte superior despejada

    // Fondo de madera/pergamino oscuro
    ctx.fillStyle = "rgba(10, 20, 35, 0.92)";
    ctx.strokeStyle = bannerBorder;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, [20]);
    ctx.fill();
    ctx.stroke();

    // Texto con sombra
    ctx.font = "800 17px 'Outfit', sans-serif";
    ctx.fillStyle = bannerTextColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 6;
    ctx.fillText(bannerText, this.width / 2, bannerY + bannerH / 2);
    ctx.restore();
  }
}
