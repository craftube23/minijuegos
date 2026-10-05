/**
 * ==============================================================================
 * JUEGO 1: 🎁 ATRAPA-REGALOS MÁGICO (Toy Catch Express - Edición Pulida)
 * ==============================================================================
 * 
 * CARACTERÍSTICAS Y FÍSICAS DE NIVEL PROFESIONAL:
 * - Movimiento suave del saco con inercia, inclinación (tilt) y rebote elástico (squash & stretch).
 * - Feedback visual de impacto: Números flotantes (+150, +500, -1❤️) y Screen Shake al chocar con hielo/roca.
 * - Sistema de combo con estallidos de partículas de colores.
 * - 3 Vidas en HUD.
 * - 100% sprites sin emojis.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface FallingItem {
  x: number;
  y: number;
  vy: number;
  size: number;
  type: "gift_red" | "gift_green" | "teddy" | "robot" | "fair_logo_box" | "ice" | "rock";
  points: number;
  rotation: number;
  vRot: number;
}

export class ToyCatchGame extends BaseGame {
  // Posición y físicas del saco recolector
  private basketX: number = 540;
  private targetBasketX: number = 540;
  private basketY: number = 1350;
  private basketWidth: number = 240;
  private basketHeight: number = 120;
  private basketTilt: number = 0;
  private basketSquashX: number = 1.0;
  private basketSquashY: number = 1.0;

  // Lista de objetos cayendo
  private items: FallingItem[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.70;

  // Racha de aciertos (Combo)
  private comboCount: number = 0;

  // Colección de imágenes
  private bagImage: HTMLImageElement;
  private imgGiftRed: HTMLImageElement;
  private imgGiftGreen: HTMLImageElement;
  private imgTeddy: HTMLImageElement;
  private imgRobot: HTMLImageElement;
  private imgCoal: HTMLImageElement;
  private imgIce: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "toy-catch",
      "🎁 Atrapa-Regalos Mágico",
      "¡Mueve el saco de Santa para atrapar regalos y esquivar el hielo y las rocas!",
      canvas,
      input,
      audio,
      particles
    );

    this.bagImage = new Image();
    this.bagImage.src = "/assets/images/bolsa de regalos.png";

    this.imgGiftRed = new Image();
    this.imgGiftRed.src = "/assets/images/regalo-rojo.png";

    this.imgGiftGreen = new Image();
    this.imgGiftGreen.src = "/assets/images/regalo-verde.png";

    this.imgTeddy = new Image();
    this.imgTeddy.src = "/assets/images/osito.png";

    this.imgRobot = new Image();
    this.imgRobot.src = "/assets/images/robot.png";

    this.imgCoal = new Image();
    this.imgCoal.src = "/assets/images/carbon.png";

    this.imgIce = new Image();
    this.imgIce.src = "/assets/images/hielo.jfif";

    this.showLives = true;
    this.lives = 3;
    this.maxLives = 3;
  }

  protected onStart(): void {
    this.lives = 3;
    this.updateBasketDimensions();
    this.basketX = this.width / 2;
    this.targetBasketX = this.basketX;
    this.basketTilt = 0;
    this.basketSquashX = 1.0;
    this.basketSquashY = 1.0;
    this.items = [];
    this.spawnTimer = 0;
    this.comboCount = 0;
  }

  private updateBasketDimensions(): void {
    this.basketWidth = Math.max(90, Math.min(220, this.width * 0.28));
    this.basketHeight = this.basketWidth * 0.52;
    this.basketY = this.height - this.basketHeight * 0.85 - 12;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.updateBasketDimensions();
    const halfW = this.basketWidth / 2;
    if (this.basketX < halfW) this.basketX = halfW;
    if (this.basketX > this.width - halfW) this.basketX = this.width - halfW;
    this.targetBasketX = this.basketX;
  }

  protected onUpdate(dt: number): void {
    // 1. Control del jugador (Suavizado táctil / inercia de nivel profesional)
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown) {
      this.targetBasketX = pointer.x;
    }

    if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
      this.targetBasketX -= this.width * 0.9 * dt;
    }
    if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      this.targetBasketX += this.width * 0.9 * dt;
    }

    const halfW = this.basketWidth / 2;
    if (this.targetBasketX < halfW) this.targetBasketX = halfW;
    if (this.targetBasketX > this.width - halfW) this.targetBasketX = this.width - halfW;

    // Física de arrastre suave e inclinación
    const prevX = this.basketX;
    this.basketX += (this.targetBasketX - this.basketX) * 20 * dt;
    const velocityX = (this.basketX - prevX) / Math.max(dt, 0.001);
    this.basketTilt = Math.max(-0.25, Math.min(0.25, velocityX * 0.0003));

    // Recuperación elástica de squash & stretch
    this.basketSquashX += (1.0 - this.basketSquashX) * 14 * dt;
    this.basketSquashY += (1.0 - this.basketSquashY) * 14 * dt;

    // 2. Generación de objetos que caen (Spawn)
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnFallingItem();
    }

    // 3. Mover y colisionar objetos
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.vy * dt;
      item.rotation += item.vRot * dt;

      // Colisión con el saco
      const dx = Math.abs(item.x - this.basketX);
      const dy = Math.abs(item.y - this.basketY);
      const isObstacle = item.type === "ice" || item.type === "rock";
      const extraMargin = isObstacle ? item.size * 0.45 : item.size * 0.28;

      if (dx < this.basketWidth / 2 + extraMargin && dy < this.basketHeight / 2 + extraMargin) {
        this.handleItemCaught(item);
        this.items.splice(i, 1);
        continue;
      }

      // Si cayó al fondo sin atrapar
      if (item.y > this.height + 70) {
        if (!isObstacle) {
          this.comboCount = 0;
        }
        this.items.splice(i, 1);
      }
    }
  }

  private spawnFallingItem(): void {
    const roll = Math.random();
    let type: FallingItem["type"] = "gift_red";
    let points = 100;

    const baseSize = Math.max(48, Math.min(105, this.width * 0.15));
    let size = baseSize;

    if (roll < 0.06) {
      // 6% Logo Dorado Especial
      type = "fair_logo_box";
      points = 500;
      size = baseSize * 1.1;
    } else if (roll < 0.28) {
      // 22% Osito
      type = "teddy";
      points = 250;
      size = baseSize;
    } else if (roll < 0.50) {
      // 22% Robot
      type = "robot";
      points = 200;
      size = baseSize;
    } else if (roll < 0.72) {
      // 22% Regalos
      type = Math.random() > 0.5 ? "gift_green" : "gift_red";
      points = 150;
      size = baseSize;
    } else if (roll < 0.86) {
      // 14% Hielo (Obstáculo)
      type = "ice";
      points = -150;
      size = baseSize * 1.35;
    } else {
      // 14% Roca / Carbón (Obstáculo)
      type = "rock";
      points = -150;
      size = baseSize * 1.35;
    }

    const margin = Math.max(30, this.width * 0.08);
    const fallSpeedBase = this.height * 0.32;
    this.items.push({
      x: margin + Math.random() * (this.width - margin * 2),
      y: -60,
      vy: fallSpeedBase + Math.random() * (this.height * 0.18) + (45 - this.timeRemaining) * 3,
      size,
      type,
      points,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3,
    });
  }

  private handleItemCaught(item: FallingItem): void {
    // Rebote elástico del saco
    this.basketSquashX = 1.25;
    this.basketSquashY = 0.80;

    if (item.type === "ice" || item.type === "rock") {
      this.comboCount = 0;
      this.addScore(item.points);
      this.lives--;
      this.audio.playError();
      this.triggerShake(0.26, 8); // Temblor de pantalla

      // Mensaje flotante de pérdida de vida
      this.addFloatingText("-1 VIDA", this.basketX, this.basketY - 45, "#FF1744", 1.25);

      const burstColor = item.type === "ice" ? "#00E5FF" : "#8D6E63";
      this.particles.emitBurst(this.basketX, this.basketY, burstColor, 25);

      if (this.lives <= 0) {
        this.lives = 0;
        this.endGame();
      }
    } else if (item.type === "fair_logo_box") {
      this.comboCount++;
      this.addScore(item.points);
      this.triggerLogoPowerUp(1, 7);
      this.triggerShake(0.15, 4);
      this.addFloatingText("¡SUPER BONUS x2! +500", this.basketX, this.basketY - 50, "#FFD700", 1.3);
      this.particles.emitConfetti(this.width, 30);
    } else {
      this.comboCount++;
      const comboBonus = Math.min(this.comboCount * 20, 200);
      const totalPoints = item.points + comboBonus;
      this.addScore(totalPoints);
      this.audio.playCatchItem(1.0 + Math.min(this.comboCount * 0.05, 0.5));

      // Texto de puntos flotante con combo
      const comboLabel = this.comboCount > 2 ? ` (x${this.comboCount})` : "";
      const scoreColor = this.comboCount > 4 ? "#FFD700" : "#00E676";
      this.addFloatingText(`+${totalPoints}${comboLabel}`, this.basketX, this.basketY - 40, scoreColor);
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Dibujar objetos que caen (100% sprites)
    for (const item of this.items) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);

      const drawSize = item.size;

      if (item.type === "gift_red" && this.imgGiftRed.complete && this.imgGiftRed.naturalWidth > 0) {
        ctx.drawImage(this.imgGiftRed, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "gift_green" && this.imgGiftGreen.complete && this.imgGiftGreen.naturalWidth > 0) {
        ctx.drawImage(this.imgGiftGreen, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "teddy" && this.imgTeddy.complete && this.imgTeddy.naturalWidth > 0) {
        ctx.drawImage(this.imgTeddy, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "robot" && this.imgRobot.complete && this.imgRobot.naturalWidth > 0) {
        ctx.drawImage(this.imgRobot, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "ice" && this.imgIce.complete && this.imgIce.naturalWidth > 0) {
        ctx.drawImage(this.imgIce, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "rock" && this.imgCoal.complete && this.imgCoal.naturalWidth > 0) {
        ctx.drawImage(this.imgCoal, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "fair_logo_box") {
        // Halo dorado resplandeciente
        ctx.fillStyle = "rgba(255, 215, 0, 0.55)";
        ctx.beginPath();
        ctx.arc(0, 0, drawSize * 0.75, 0, Math.PI * 2);
        ctx.fill();

        if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
          const logoW = drawSize * 1.25;
          const logoH = drawSize * 0.85;
          ctx.drawImage(this.logoImage1, -logoW / 2, -logoH / 2, logoW, logoH);
        }
      }

      ctx.restore();
    }

    // 2. Dibujar el Saco Mágico con deformación elástica (Squash & Stretch) e inclinación
    ctx.save();
    ctx.translate(this.basketX, this.basketY);
    ctx.rotate(this.basketTilt);
    ctx.scale(this.basketSquashX, this.basketSquashY);

    if (this.isLogoPowerUpActive) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, this.basketWidth * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.bagImage && this.bagImage.complete && this.bagImage.naturalWidth > 0) {
      const imgW = this.basketWidth + 20;
      const imgH = this.basketHeight + 25;
      ctx.drawImage(this.bagImage, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.roundRect(-this.basketWidth / 2, -this.basketHeight / 2, this.basketWidth, this.basketHeight, [25, 25, 40, 40]);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  }
}
