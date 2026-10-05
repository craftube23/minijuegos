/**
 * ==============================================================================
 * JUEGO 1: 🎁 ATRAPA-REGALOS MÁGICO (Toy Catch Express)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El jugador desliza su dedo para mover el Saco Mágico de Santa.
 * - Caen regalos navideños, ositos, robots y el Logo Dorado de la Feria.
 * - Esquivar los bloques de hielo y rocas: si los atrapas pierdes 1 vida (❤️).
 * - ¡3 Vidas por partida! Si pierdes las 3 vidas termina el juego.
 * - Todos los elementos usan gráficos y sprites de alta calidad (sin emojis).
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
  // Posición y dimensiones del saco recolector
  private basketX: number = 540;
  private basketY: number = 1350;
  private basketWidth: number = 240;
  private basketHeight: number = 120;

  // Lista de objetos cayendo
  private items: FallingItem[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.70; // Frecuencia de caída de objetos

  // Racha de aciertos (Combo)
  private comboCount: number = 0;

  // Colección de imágenes del juego
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
      "¡Desliza tu dedo para mover el saco mágico y atrapar todos los juguetes y regalos!",
      canvas,
      input,
      audio,
      particles
    );

    // Cargar sprites oficiales del juego
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
      this.basketX -= this.width * 0.85 * dt;
    }
    if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      this.basketX += this.width * 0.85 * dt;
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

      // Colisión con el saco de Santa
      const dx = Math.abs(item.x - this.basketX);
      const dy = Math.abs(item.y - this.basketY);
      const isObstacle = item.type === "ice" || item.type === "rock";
      const extraMargin = isObstacle ? item.size * 0.45 : item.size * 0.28;

      if (dx < this.basketWidth / 2 + extraMargin && dy < this.basketHeight / 2 + extraMargin) {
        // ¡Atrapado!
        this.handleItemCaught(item);
        this.items.splice(i, 1);
        continue;
      }

      // Si cayó al fondo
      if (item.y > this.height + 70) {
        if (!isObstacle) {
          this.comboCount = 0; // Se corta el combo
        }
        this.items.splice(i, 1);
      }
    }
  }

  /**
   * Genera un nuevo objeto aleatorio en la parte superior con probabilidades balanceadas
   */
  private spawnFallingItem(): void {
    const roll = Math.random();
    let type: FallingItem["type"] = "gift_red";
    let points = 100;

    const baseSize = Math.max(48, Math.min(105, this.width * 0.15));
    let size = baseSize;

    if (roll < 0.06) {
      // 6% probabilidad: ¡Caja Especial con Logo de la Feria! (Rara y valiosa)
      type = "fair_logo_box";
      points = 500;
      size = baseSize * 1.1;
    } else if (roll < 0.28) {
      // 22% probabilidad: Osito de peluche
      type = "teddy";
      points = 250;
      size = baseSize;
    } else if (roll < 0.50) {
      // 22% probabilidad: Robot de juguete
      type = "robot";
      points = 200;
      size = baseSize;
    } else if (roll < 0.72) {
      // 22% probabilidad: Regalo verde/rojo
      type = Math.random() > 0.5 ? "gift_green" : "gift_red";
      points = 150;
      size = baseSize;
    } else if (roll < 0.86) {
      // 14% probabilidad: Bloque de Hielo (Obstáculo grande)
      type = "ice";
      points = -150;
      size = baseSize * 1.35;
    } else {
      // 14% probabilidad: Roca / Carbón (Obstáculo grande)
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
      vRot: (Math.random() - 0.5) * 3, // Efecto de rotación al caer
    });
  }

  /**
   * Lógica al atrapar un objeto
   */
  private handleItemCaught(item: FallingItem): void {
    if (item.type === "ice" || item.type === "rock") {
      this.comboCount = 0;
      this.addScore(item.points);
      this.lives--;
      this.audio.playError();
      const burstColor = item.type === "ice" ? "#00E5FF" : "#8D6E63";
      this.particles.emitBurst(this.basketX, this.basketY, burstColor, 25);

      // Si se acaban las 3 vidas → Fin de la partida
      if (this.lives <= 0) {
        this.lives = 0;
        this.endGame();
      }
    } else if (item.type === "fair_logo_box") {
      this.comboCount++;
      this.addScore(item.points);
      // ¡Activa el Power-Up del Logo 1 de la Feria!
      this.triggerLogoPowerUp(1, 7);
      this.particles.emitConfetti(this.width, 25);
    } else {
      this.comboCount++;
      const comboBonus = Math.min(this.comboCount * 20, 200);
      this.addScore(item.points + comboBonus);
      this.audio.playCatchItem(1.0 + Math.min(this.comboCount * 0.05, 0.5));
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Limpiar canvas transparente para mostrar el fondo único del Kiosco
    ctx.clearRect(0, 0, this.width, this.height);

    // 2. Dibujar objetos que caen (100% sprites visuales, sin emojis)
    for (const item of this.items) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation); // Todos los objetos caen girando

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
        // Bloque de hielo
        ctx.drawImage(this.imgIce, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "rock" && this.imgCoal.complete && this.imgCoal.naturalWidth > 0) {
        // Roca / Carbón
        ctx.drawImage(this.imgCoal, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (item.type === "fair_logo_box") {
        // Aura brillante dorada
        ctx.fillStyle = "rgba(255, 215, 0, 0.55)";
        ctx.beginPath();
        ctx.arc(0, 0, drawSize * 0.75, 0, Math.PI * 2);
        ctx.fill();

        if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
          // Dibujar el Logo Oficial de la Feria
          const logoW = drawSize * 1.25;
          const logoH = drawSize * 0.85;
          ctx.drawImage(this.logoImage1, -logoW / 2, -logoH / 2, logoW, logoH);
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
