/**
 * ==============================================================================
 * JUEGO 1: 🎁 ATRAPA-REGALOS MÁGICO (Toy Catch Express)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El jugador desliza su dedo para mover la Saco Mágico de Santa en la parte inferior.
 * - Caerán regalos navideños, juguetes (osos, robots) y estrellas.
 * - Si atrapa el "Regalo Dorado de la Feria", se activa el Power-Up del Logo 1.
 * - Debe esquivar los bloques de hielo/carbón para no perder puntos.
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
  type: "gift_red" | "gift_green" | "teddy" | "robot" | "star" | "fair_logo_box" | "coal";
  points: number;
  rotation: number;
  vRot: number;
  emoji: string;
}

export class ToyCatchGame extends BaseGame {
  // Posición y dimensiones del saco recolector (Más grande para pantalla táctil)
  private basketX: number = 540;
  private basketY: number = 1350;
  private basketWidth: number = 240;
  private basketHeight: number = 120;

  // Lista de objetos cayendo
  private items: FallingItem[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.85; // Segundos entre cada objeto

  // Racha de aciertos (Combo)
  private comboCount: number = 0;

  // Colección de imágenes del juego
  private bagImage: HTMLImageElement;
  private bgImage: HTMLImageElement;
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
      "¡Desliza tu dedo para mover el saco mágico y atrapar todos los juguetes y regalos!",
      canvas,
      input,
      audio,
      particles
    );

    // Cargar todas las imágenes del Juego 1
    this.bagImage = new Image();
    this.bagImage.src = "/assets/images/bolsa de regalos.png";

    this.bgImage = new Image();
    this.bgImage.src = "/assets/images/fondo-nieve.webp";

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
  }

  protected onUpdate(dt: number): void {
    // 1. Control del jugador (Táctil / Arrastre)
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown) {
      this.basketX = pointer.x;
    }

    // Soporte teclado PC
    if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
      this.basketX -= this.width * 0.8 * dt;
    }
    if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      this.basketX += this.width * 0.8 * dt;
    }

    // Mantener dentro de los bordes de la pantalla
    const halfW = this.basketWidth / 2;
    if (this.basketX < halfW) this.basketX = halfW;
    if (this.basketX > this.width - halfW) this.basketX = this.width - halfW;

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

      // Colisión con el saco de Santa (margen ampliado para el hielo/piedra)
      const dx = Math.abs(item.x - this.basketX);
      const dy = Math.abs(item.y - this.basketY);
      const extraMargin = item.type === "coal" ? item.size * 0.45 : item.size * 0.25;

      if (dx < this.basketWidth / 2 + extraMargin && dy < this.basketHeight / 2 + extraMargin) {
        // ¡Atrapado!
        this.handleItemCaught(item);
        this.items.splice(i, 1);
        continue;
      }

      // Si cayó al fondo
      if (item.y > this.height + 60) {
        if (item.type !== "coal") {
          this.comboCount = 0; // Se corta el combo
        }
        this.items.splice(i, 1);
      }
    }
  }

  /**
   * Genera un nuevo objeto aleatorio en la parte superior
   */
  private spawnFallingItem(): void {
    const roll = Math.random();
    let type: FallingItem["type"] = "gift_red";
    let points = 100;
    let emoji = "🎁";

    const baseSize = Math.max(48, Math.min(105, this.width * 0.15));
    let size = baseSize;

    if (roll < 0.12) {
      // 12% probabilidad: ¡Caja Especial con Logo de la Feria!
      type = "fair_logo_box";
      points = 500;
      emoji = "⭐";
      size = baseSize * 1.05;
    } else if (roll < 0.32) {
      type = "teddy";
      points = 250;
      emoji = "🧸";
      size = baseSize;
    } else if (roll < 0.50) {
      type = "robot";
      points = 200;
      emoji = "🤖";
      size = baseSize;
    } else if (roll < 0.65) {
      type = "star";
      points = 300;
      emoji = "✨";
      size = baseSize * 0.95;
    } else if (roll < 0.85) {
      type = "gift_green";
      points = 150;
      emoji = "🎁";
      size = baseSize;
    } else {
      // 15% probabilidad: Carbón / Obstáculo (35% más grande para que sea fácil atraparlo por error)
      type = "coal";
      points = -150;
      emoji = "🪨";
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
      vRot: (Math.random() - 0.5) * 2,
      emoji
    });
  }

  /**
   * Lógica al atrapar un objeto
   */
  private handleItemCaught(item: FallingItem): void {
    if (item.type === "coal") {
      this.comboCount = 0;
      this.addScore(item.points);
      this.lives--;
      this.audio.playError();
      this.particles.emitBurst(this.basketX, this.basketY, "#00E5FF", 25);

      // Si se acaban las vidas → Fin de la partida
      if (this.lives <= 0) {
        this.lives = 0;
        this.endGame();
      }
    } else if (item.type === "fair_logo_box") {
      this.comboCount++;
      this.addScore(item.points);
      // ¡Activa el Power-Up del Logo 1 de la Feria!
      this.triggerLogoPowerUp(1, 7);
    } else {
      this.comboCount++;
      const comboBonus = Math.min(this.comboCount * 20, 200);
      this.addScore(item.points + comboBonus);
      this.audio.playCatchItem(1.0 + Math.min(this.comboCount * 0.05, 0.5));
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Limpiar canvas transparente para mostrar el fondo único del Kiosco sin duplicar imágenes
    ctx.clearRect(0, 0, this.width, this.height);

    // 2. Dibujar objetos que caen
    for (const item of this.items) {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.type !== "fair_logo_box") {
        ctx.rotate(item.rotation);
      }

      let drawnWithImage = false;
      const drawSize = item.size;

      if (item.type === "gift_red" && this.imgGiftRed.complete && this.imgGiftRed.naturalWidth > 0) {
        ctx.drawImage(this.imgGiftRed, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        drawnWithImage = true;
      } else if (item.type === "gift_green" && this.imgGiftGreen.complete && this.imgGiftGreen.naturalWidth > 0) {
        ctx.drawImage(this.imgGiftGreen, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        drawnWithImage = true;
      } else if (item.type === "teddy" && this.imgTeddy.complete && this.imgTeddy.naturalWidth > 0) {
        ctx.drawImage(this.imgTeddy, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        drawnWithImage = true;
      } else if (item.type === "robot" && this.imgRobot.complete && this.imgRobot.naturalWidth > 0) {
        ctx.drawImage(this.imgRobot, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        drawnWithImage = true;
      } else if (item.type === "coal") {
        if (this.imgIce && this.imgIce.complete && this.imgIce.naturalWidth > 0) {
          ctx.drawImage(this.imgIce, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          drawnWithImage = true;
        } else if (this.imgCoal.complete && this.imgCoal.naturalWidth > 0) {
          ctx.drawImage(this.imgCoal, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          drawnWithImage = true;
        }
      } else if (item.type === "fair_logo_box") {
        // Aura brillante dorada
        ctx.fillStyle = "rgba(255, 215, 0, 0.5)";
        ctx.beginPath();
        ctx.arc(0, 0, drawSize * 0.7, 0, Math.PI * 2);
        ctx.fill();

        if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
          // Dibujar el Logo Oficial de la Feria
          const logoW = drawSize * 1.25;
          const logoH = drawSize * 0.8;
          ctx.drawImage(this.logoImage1, -logoW / 2, -logoH / 2, logoW, logoH);
          drawnWithImage = true;
        }
      }

      if (!drawnWithImage) {
        if (item.type === "fair_logo_box") {
          ctx.fillStyle = "#FFD700";
          ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 4;
          ctx.strokeRect(-item.size / 2, -item.size / 2, item.size, item.size);

          ctx.font = "bold 24px 'Segoe UI', sans-serif";
          ctx.fillStyle = "#C0392B";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("FERIA", 0, 0);
        } else {
          // Emojis de fallback si falta alguna imagen
          ctx.font = `${item.size}px 'Segoe UI Emoji', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.emoji, 0, 0);
        }
      }

      ctx.restore();
    }

    // 3. Dibujar el Saco Mágico de Santa
    ctx.save();
    ctx.translate(this.basketX, this.basketY);

    // Aura mágica si el power-up está activo
    if (this.isLogoPowerUpActive) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, this.basketWidth * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.bagImage && this.bagImage.complete && this.bagImage.naturalWidth > 0) {
      // Dibujar la imagen recortada de la bolsa de regalos
      const imgW = this.basketWidth + 20;
      const imgH = this.basketHeight + 25;
      ctx.drawImage(this.bagImage, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
      // Dibujo vectorial de respaldo
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.roundRect(-this.basketWidth / 2, -this.basketHeight / 2, this.basketWidth, this.basketHeight, [25, 25, 40, 40]);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(-this.basketWidth / 2 - 10, -this.basketHeight / 2 - 15, this.basketWidth + 20, 30, 15);
      ctx.fill();

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 24px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎅 SACO MÁGICO 🎁", 0, 20);
    }

    ctx.restore();

    // 4. Indicador de Combo si hay racha
    if (this.comboCount >= 3) {
      ctx.save();
      ctx.font = "bold 32px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#00E5FF";
      ctx.textAlign = "center";
      ctx.fillText(`🔥 ¡RACHA x${this.comboCount}!`, this.basketX, this.basketY - 70);
      ctx.restore();
    }
  }
}
