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
  type: "gift_red" | "gift_green" | "teddy" | "robot" | "fair_logo_box" | "campus_logo_box" | "ice" | "rock";
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
  private bgImage: HTMLImageElement;
  private bgSponsorSign: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "toy-catch",
      "Atrapa-Regalos Mágico",
      "¡Mueve el saco de Santa para atrapar regalos y esquivar el hielo y las rocas!",
      canvas,
      input,
      audio,
      particles
    );

    this.bagImage = new Image();
    this.bagImage.src = "./assets/images/bolsa de regalos.png";

    this.imgGiftRed = new Image();
    this.imgGiftRed.src = "./assets/images/regalo-rojo.png";

    this.imgGiftGreen = new Image();
    this.imgGiftGreen.src = "./assets/images/regalo-verde.png";

    this.imgTeddy = new Image();
    this.imgTeddy.src = "./assets/images/osito.png";

    this.imgRobot = new Image();
    this.imgRobot.src = "./assets/images/robot.png";

    this.imgCoal = new Image();
    this.imgCoal.src = "./assets/images/carbon.png";

    this.imgIce = new Image();
    this.imgIce.src = "./assets/images/hielo.png";

    this.bgImage = new Image();
    this.bgImage.src = "./assets/images/fondo-nieve.webp";

    this.bgSponsorSign = new Image();
    this.bgSponsorSign.src = "./assets/images/cartel-sponsor.png";

    this.showLives = true;
    this.lives = 3;
    this.maxLives = 3;

    // Música temática festiva para Atrapa-Regalos
    this.inGameMusicPath = "./assets/audio/Up on the Housetop.mp3";
    this.inGameMusicVolume = 0.48;
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
    // 1. Control del jugador (Alta responsividad táctil y de teclado)
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown) {
      this.targetBasketX = pointer.x;
    }

    if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
      this.targetBasketX -= this.width * 1.85 * dt;
    }
    if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      this.targetBasketX += this.width * 1.85 * dt;
    }

    const halfW = this.basketWidth / 2;
    if (this.targetBasketX < halfW) this.targetBasketX = halfW;
    if (this.targetBasketX > this.width - halfW) this.targetBasketX = this.width - halfW;

    // Física de arrastre ultra-reactiva e inclinación dinámica
    const prevX = this.basketX;
    this.basketX += (this.targetBasketX - this.basketX) * 36 * dt;
    const velocityX = (this.basketX - prevX) / Math.max(dt, 0.001);
    this.basketTilt = Math.max(-0.28, Math.min(0.28, velocityX * 0.00035));

    // Recuperación elástica de squash & stretch
    this.basketSquashX += (1.0 - this.basketSquashX) * 16 * dt;
    this.basketSquashY += (1.0 - this.basketSquashY) * 16 * dt;

    // 2. Generación dinámica de objetos que caen (Spawn ágil y progresivo)
    const progress = Math.max(0, Math.min(1, (45 - this.timeRemaining) / 45));
    const currentSpawnInterval = Math.max(0.28, 0.44 - progress * 0.16);

    this.spawnTimer += dt;
    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnFallingItem();
      // En la segunda mitad del juego, 25% de probabilidad de drop doble
      if (progress > 0.35 && Math.random() < 0.28) {
        setTimeout(() => {
          if (this.isRunning && !this.isGameOver) {
            this.spawnFallingItem();
          }
        }, 120);
      }
    }

    // 3. Mover y colisionar objetos
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.vy * dt;
      item.rotation += item.vRot * dt;

      // Colisión precisa con la boca del saco
      const isObstacle = item.type === "ice" || item.type === "rock";
      // Hitbox adaptada para alta velocidad
      const hitHalfW = (this.basketWidth * 0.50) + (isObstacle ? item.size * 0.16 : item.size * 0.22);
      const hitHalfH = (this.basketHeight * 0.50) + (item.size * 0.22);
      const bagCenterY = this.basketY - this.basketHeight * 0.05;

      const dx = Math.abs(item.x - this.basketX);
      const dy = Math.abs(item.y - bagCenterY);

      if (dx < hitHalfW && dy < hitHalfH) {
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
      // 6% Moneda / Logo Dorado Feria Mágica (Super Bonus x2)
      type = "fair_logo_box";
      points = 500;
      size = baseSize * 1.15;
    } else if (roll < 0.12) {
      // 6% Logo Oficial Campuslands (Super Bonus x2)
      type = "campus_logo_box";
      points = 500;
      size = baseSize * 1.15;
    } else if (roll < 0.30) {
      // 18% Osito
      type = "teddy";
      points = 250;
      size = baseSize;
    } else if (roll < 0.50) {
      // 20% Robot
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
    const progress = Math.max(0, Math.min(1, (45 - this.timeRemaining) / 45));
    // Velocidad de caída rápida y dinámica (el doble de rápida que antes)
    const fallSpeedBase = this.height * (0.62 + Math.random() * 0.28) + (progress * this.height * 0.28);
    this.items.push({
      x: margin + Math.random() * (this.width - margin * 2),
      y: -60,
      vy: fallSpeedBase,
      size,
      type,
      points,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 4.5,
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
      this.audio.playElfHit();
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
      // LOGO OFICIAL: FERIA MÁGICA
      this.comboCount++;
      this.addScore(item.points);
      this.triggerLogoPowerUp(1, 7);
      this.triggerShake(0.15, 4);
      this.addFloatingText("¡BONUS FERIA x2! +500", this.basketX, this.basketY - 50, "#FFD700", 1.3);
      this.particles.emitConfetti(this.width, 35);
    } else if (item.type === "campus_logo_box") {
      // LOGO OFICIAL: CAMPUSLANDS
      this.comboCount++;
      this.addScore(item.points);
      this.triggerLogoPowerUp(2, 7);
      this.triggerShake(0.15, 4);
      this.addFloatingText("¡BONUS CAMPUSLANDS x2! +500", this.basketX, this.basketY - 50, "#00E5FF", 1.3);
      this.particles.emitConfetti(this.width, 35);
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
    // 1. Fondo de Escenario Navideño Cálido y Nevado
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      // Capa de viñeta suave para contraste y profundidad
      ctx.fillStyle = "rgba(4, 14, 26, 0.38)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#081E38");
      grad.addColorStop(1, "#030A14");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Cartel / Marco con los Logos Oficiales en el Fondo
    this.drawBackgroundLogos(ctx);

    // 3. Dibujar objetos que caen (100% sprites con feedback visual)
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
        // Medallón de alto contraste y energía dorada mística
        const radius = drawSize * 0.72;
        
        ctx.save();
        // Fondo blanco perlado de alto contraste (para que se distinga 100% sobre la nieve)
        const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        bgGrad.addColorStop(0.8, "rgba(255, 248, 220, 0.94)");
        bgGrad.addColorStop(1, "rgba(255, 215, 0, 0.85)");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Borde dorado brillante
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
          const logoW = drawSize * 1.15;
          const logoH = drawSize * 0.78;
          ctx.drawImage(this.logoImage1, -logoW / 2, -logoH / 2, logoW, logoH);
        }
      } else if (item.type === "campus_logo_box") {
        // Medallón Campuslands: Base blanca nítida y halo cian vibrante
        const radius = drawSize * 0.72;

        ctx.save();
        // Base blanca nítida para evitar que el logo azul se confunda con la nieve
        const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        bgGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        bgGrad.addColorStop(0.85, "rgba(240, 250, 255, 0.96)");
        bgGrad.addColorStop(1, "rgba(0, 229, 255, 0.85)");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Borde cian tecnológico
        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        if (this.logoImage2 && this.logoImage2.complete && this.logoImage2.naturalWidth > 0) {
          const logoW = drawSize * 1.18;
          const logoH = drawSize * 0.80;
          ctx.drawImage(this.logoImage2, -logoW / 2, -logoH / 2, logoW, logoH);
        }
      }

      ctx.restore();
    }

    // 2. Dibujar el Saco Mágico con deformación elástica (Squash & Stretch) e inclinación
    ctx.save();
    ctx.translate(this.basketX, this.basketY);
    ctx.rotate(this.basketTilt);
    ctx.scale(this.basketSquashX, this.basketSquashY);

    // Aura de poder épico cuando el power-up de logo está activo
    if (this.isLogoPowerUpActive) {
      const now = performance.now() * 0.005;
      const auraPulse = Math.sin(now) * 6;
      const auraRadius = (this.basketWidth * 0.75) + auraPulse;

      ctx.save();
      // Capa 1: Resplandor radial exterior
      const auraGrad = ctx.createRadialGradient(0, 0, auraRadius * 0.4, 0, 0, auraRadius);
      auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.65)");
      auraGrad.addColorStop(0.6, "rgba(255, 153, 0, 0.45)");
      auraGrad.addColorStop(1, "rgba(255, 80, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Capa 2: Anillos mágicos de energía
      ctx.strokeStyle = "rgba(255, 235, 59, 0.85)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -now * 15;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.bagImage && this.bagImage.complete && this.bagImage.naturalWidth > 0) {
      const imgW = this.basketWidth + 20;
      const imgH = this.basketHeight + 25;
      ctx.drawImage(this.bagImage, -imgW / 2, -imgH / 2, imgW, imgH);

      // Logo Oficial de la Feria Mágica del Juguete estampado en el centro del saco
      if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
        const logoW = this.basketWidth * 0.52;
        const logoRatio = this.logoImage1.naturalHeight / (this.logoImage1.naturalWidth || 1);
        const logoH = logoW * (logoRatio > 0 ? logoRatio : 0.65);
        const logoY = imgH * 0.12;

        ctx.save();
        ctx.drawImage(this.logoImage1, -logoW / 2, logoY - logoH / 2, logoW, logoH);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.roundRect(-this.basketWidth / 2, -this.basketHeight / 2, this.basketWidth, this.basketHeight, [25, 25, 40, 40]);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.stroke();

      if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
        const logoW = this.basketWidth * 0.6;
        const logoH = logoW * 0.6;
        ctx.drawImage(this.logoImage1, -logoW / 2, -logoH / 2, logoW, logoH);
      }
    }

    ctx.restore();
  }

  /**
   * Renderiza el cartel / marquesina con los Logos Oficiales en el fondo del escenario
   */
  private drawBackgroundLogos(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const signW = Math.min(640, this.width * 0.90);
    const signH = Math.max(72, Math.min(104, this.height * 0.095));
    const signX = (this.width - signW) / 2;
    const signY = Math.max(72, this.height * 0.075);
    const centerX = this.width / 2;
    const centerY = signY + signH / 2;

    // 1. Sombra suave para despegar el cartel del fondo
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    if (this.bgSponsorSign && this.bgSponsorSign.complete && this.bgSponsorSign.naturalWidth > 0) {
      // Dibujar imagen de cartel si está disponible
      ctx.drawImage(this.bgSponsorSign, signX, signY, signW, signH);
    } else {
      // Cartel de madera festivo estilizado 2D Game Art
      // Placa base de madera oscura
      const woodGrad = ctx.createLinearGradient(signX, signY, signX, signY + signH);
      woodGrad.addColorStop(0, "rgba(45, 25, 15, 0.88)");
      woodGrad.addColorStop(0.5, "rgba(28, 14, 8, 0.92)");
      woodGrad.addColorStop(1, "rgba(18, 8, 4, 0.95)");
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(signX, signY, signW, signH, 16);
      ctx.fill();

      // Borde dorado de fantasía
      ctx.strokeStyle = "rgba(255, 215, 0, 0.75)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Borde interior fino
      ctx.strokeStyle = "rgba(255, 240, 180, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(signX + 4, signY + 4, signW - 8, signH - 8, 12);
      ctx.stroke();

      // Capa de nieve sobre el marco superior
      ctx.fillStyle = "rgba(245, 250, 255, 0.95)";
      ctx.beginPath();
      ctx.roundRect(signX - 4, signY - 5, signW + 8, 10, [8, 8, 3, 3]);
      ctx.fill();
    }

    // Resetear sombra
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Luces de hadas parpadeantes en el borde superior del cartel
    const time = performance.now() * 0.003;
    const bulbCount = Math.max(6, Math.floor(signW / 45));
    for (let i = 0; i <= bulbCount; i++) {
      const bx = signX + 16 + (i * (signW - 32)) / bulbCount;
      const by = signY - 2;
      const bulbColor = i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#00E5FF" : "#FF3366";
      const pulse = 0.5 + Math.sin(time + i * 1.2) * 0.5;

      ctx.save();
      ctx.fillStyle = bulbColor;
      ctx.globalAlpha = 0.4 + pulse * 0.6;
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Halo de luz
      ctx.fillStyle = bulbColor;
      ctx.globalAlpha = 0.25 * pulse;
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Medallón / Logo 1: FERIA MÁGICA DEL JUGUETE (Lado Izquierdo)
    const logoAreaW = (signW - 40) / 2;
    const logo1CenterX = signX + 20 + logoAreaW / 2;

    if (this.logoImage1 && this.logoImage1.complete && this.logoImage1.naturalWidth > 0) {
      const maxLw = logoAreaW * 0.88;
      const maxLh = signH * 0.76;
      const aspect = this.logoImage1.naturalWidth / this.logoImage1.naturalHeight;
      let lw = maxLw;
      let lh = lw / aspect;
      if (lh > maxLh) {
        lh = maxLh;
        lw = lh * aspect;
      }

      // Fondo perlado suave de contraste para el logo
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.roundRect(logo1CenterX - lw / 2 - 8, centerY - lh / 2 - 4, lw + 16, lh + 8, 10);
      ctx.fill();

      // Logo
      ctx.drawImage(this.logoImage1, logo1CenterX - lw / 2, centerY - lh / 2, lw, lh);
      ctx.restore();
    }

    // Divisor central festivo (Estrella o Ramo navideño)
    ctx.save();
    ctx.fillStyle = "rgba(255, 215, 0, 0.75)";
    ctx.font = `900 ${Math.max(10, Math.min(14, signH * 0.20))}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", centerX, centerY);
    ctx.restore();

    // 3. Medallón / Logo 2: CAMPUSLANDS (Lado Derecho)
    const logo2CenterX = signX + signW - 20 - logoAreaW / 2;

    if (this.logoImage2 && this.logoImage2.complete && this.logoImage2.naturalWidth > 0) {
      const maxLw = logoAreaW * 0.88;
      const maxLh = signH * 0.76;
      const aspect = this.logoImage2.naturalWidth / this.logoImage2.naturalHeight;
      let lw = maxLw;
      let lh = lw / aspect;
      if (lh > maxLh) {
        lh = maxLh;
        lw = lh * aspect;
      }

      // Fondo perlado suave de contraste para el logo
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.roundRect(logo2CenterX - lw / 2 - 8, centerY - lh / 2 - 4, lw + 16, lh + 8, 10);
      ctx.fill();

      // Logo
      ctx.drawImage(this.logoImage2, logo2CenterX - lw / 2, centerY - lh / 2, lw, lh);
      ctx.restore();
    }

    ctx.restore();
  }
}

