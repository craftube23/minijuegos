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
import { BRANDING } from "../config/branding";

interface FallingItem {
  x: number;
  y: number;
  vy: number;
  size: number;
  type: "gift_red" | "gift_green" | "teddy" | "robot" | "sponsor_logo_box" | "fair_logo_box" | "campus_logo_box" | "ice" | "rock";
  sponsorId?: string;
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

    this.bagImage = this.getImage("./assets/images/bolsa de regalos.webp");
    this.imgGiftRed = this.getImage("./assets/images/regalo-rojo.png");
    this.imgGiftGreen = this.getImage("./assets/images/regalo-verde.png");
    this.imgTeddy = this.getImage("./assets/images/osito.png");
    this.imgRobot = this.getImage("./assets/images/robot.png");
    this.imgCoal = this.getImage("./assets/images/carbon.webp");
    this.imgIce = this.getImage("./assets/images/hielo.png");

    this.showLives = true;
    this.lives = 5;
    this.maxLives = 5;

    // Música temática festiva para Atrapa-Regalos
    this.inGameMusicPath = "./assets/audio/Up on the Housetop.mp3";
    this.inGameMusicVolume = 0.48;

    // Precarga segura del efecto piloto en Howler.js
    this.audio.preloadToyCatchPilotAudio();
  }

  protected onStart(): void {
    this.audio.preloadToyCatchPilotAudio();
    this.lives = 5;
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
    this.basketWidth = Math.max(80, Math.min(220, Math.min(this.width * 0.28, this.height * 0.35)));
    this.basketHeight = this.basketWidth * 0.52;
    this.basketY = this.height - this.basketHeight * 0.85 - Math.max(8, this.height * 0.015);
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

    // 2. Generación dinámica de objetos que caen (Spawn ágil y equilibrado)
    const progress = Math.max(0, Math.min(1, (45 - this.timeRemaining) / 45));
    const currentSpawnInterval = Math.max(0.38, 0.58 - progress * 0.18);

    this.spawnTimer += dt;
    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnFallingItem();
      // En la segunda mitad del juego, probabilidad moderada de drop doble
      if (progress > 0.45 && Math.random() < 0.22) {
        this.setGameTimeout(() => {
          this.spawnFallingItem();
        }, 180);
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
    let sponsorId: string | undefined;
    let points = 100;

    const baseSize = Math.max(40, Math.min(95, Math.min(this.width * 0.14, this.height * 0.18)));
    let size = baseSize;

    if (roll < 0.15) {
      // 15% Medallón / Regalo de Patrocinador Oficial (Feria, Campus, Cajasan, Practi, Mariposa, Ángelus, Factor, Fundalas, IMEBU)
      const sponsor = BRANDING.getRandomSponsor();
      type = "sponsor_logo_box";
      sponsorId = sponsor.id;
      points = 500;
      size = baseSize * 1.15;
    } else if (roll < 0.32) {
      // 17% Osito
      type = "teddy";
      points = 250;
      size = baseSize;
    } else if (roll < 0.50) {
      // 18% Robot
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
    // Velocidad de caída progresiva vinculada al avance de la partida
    const fallSpeedBase = this.height * (0.42 + Math.random() * 0.18) + (progress * this.height * 0.42);
    this.items.push({
      x: margin + Math.random() * (this.width - margin * 2),
      y: -60,
      vy: fallSpeedBase,
      size,
      type,
      sponsorId,
      points,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3.5,
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
        this.timeRemaining = 0;
        this.isFinishing = true;
        this.finishTimer = 1.4;
        this.audio.stopGameBGM();
        this.audio.playError();
        this.particles.emitBurst(this.basketX, this.basketY, "#FF1744", 30);
        this.addFloatingText("¡SIN VIDAS!", this.width / 2, this.height * 0.45, "#FF1744", 1.8);
      }
    } else if (item.type === "sponsor_logo_box" || item.type === "fair_logo_box" || item.type === "campus_logo_box") {
      // MEDALLÓN OFICIAL DE PATROCINADOR
      const sponsorKey = item.sponsorId || (item.type === "campus_logo_box" ? "campus" : "feria");
      const sponsor = BRANDING.getLogoConfig(sponsorKey);

      this.comboCount++;
      this.addScore(item.points);
      this.triggerLogoPowerUp(sponsor.id, 7);
      this.triggerShake(0.12, 3);
    } else {
      this.comboCount++;
      const comboBonus = Math.min(this.comboCount * 20, 200);
      const totalPoints = item.points + comboBonus;
      this.addScore(totalPoints);
      this.audio.playCatchItem(1.0 + Math.min(this.comboCount * 0.05, 0.5));

      // Los puntos se suman al HUD superior sin dejar texto flotante ni marcas en pantalla
      // Los juguetes entran limpios al saco sin dejar puntos ni rastro.
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Limpiar canvas transparente para mostrar el fondo original del Kiosco
    ctx.clearRect(0, 0, this.width, this.height);

    // 2. Dibujar objetos que caen (100% sprites con feedback visual)
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
      } else if (item.type === "sponsor_logo_box" || item.type === "fair_logo_box" || item.type === "campus_logo_box") {
        // Medallón oficial de patrocinador (Alto contraste con halo temático)
        const sponsorKey = item.sponsorId || (item.type === "campus_logo_box" ? "campus" : "feria");
        const sponsor = BRANDING.getLogoConfig(sponsorKey);
        const radius = drawSize * 0.72;
        
        ctx.save();
        // Fondo blanco perlado de alto contraste (para que se distinga 100% sobre la nieve)
        const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        bgGrad.addColorStop(0, "#FFFFFF");
        bgGrad.addColorStop(0.85, "rgba(248, 250, 252, 0.98)");
        bgGrad.addColorStop(1, sponsor.themeColor + "99");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Borde brillante en el color del patrocinador
        ctx.strokeStyle = sponsor.themeColor;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        const sponsorImg = this.getSponsorImage(sponsor.id) || (sponsor.id === "logo-campus" ? this.logoImage2 : this.logoImage1);
        if (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0) {
          const aspect = sponsorImg.naturalWidth / (sponsorImg.naturalHeight || 1);
          let logoW = drawSize * 1.15;
          let logoH = drawSize * 0.78;
          if (aspect > 1.35) {
            logoW = drawSize * 1.25;
            logoH = logoW / aspect;
          } else if (aspect < 0.75) {
            logoH = drawSize * 0.85;
            logoW = logoH * aspect;
          }
          ctx.drawImage(sponsorImg, -logoW / 2, -logoH / 2, logoW, logoH);
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
    if (this.isLogoPowerUpActive && this.activeLogo) {
      const now = performance.now() * 0.005;
      const auraPulse = Math.sin(now) * 6;
      const auraRadius = (this.basketWidth * 0.75) + auraPulse;
      const themeColor = this.activeLogo.themeColor || "#FFD700";

      ctx.save();
      // Capa 1: Resplandor radial exterior temático
      const auraGrad = ctx.createRadialGradient(0, 0, auraRadius * 0.35, 0, 0, auraRadius);
      auraGrad.addColorStop(0, themeColor + "A6");
      auraGrad.addColorStop(0.65, themeColor + "4D");
      auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Capa 2: Anillos mágicos de energía
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -now * 15;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Logo activo para estampar en el saco (cambia al logo del patrocinador durante el Power-Up)
    const currentSponsorImg = this.isLogoPowerUpActive && this.activeLogo
      ? (this.getSponsorImage(this.activeLogo.id) || this.logoImage1)
      : this.logoImage1;

    if (this.bagImage && this.bagImage.complete && this.bagImage.naturalWidth > 0) {
      const imgW = this.basketWidth + 20;
      const imgH = this.basketHeight + 25;
      ctx.drawImage(this.bagImage, -imgW / 2, -imgH / 2, imgW, imgH);

      // Logo estampado en el centro del saco
      if (currentSponsorImg && currentSponsorImg.complete && currentSponsorImg.naturalWidth > 0) {
        const aspect = currentSponsorImg.naturalWidth / (currentSponsorImg.naturalHeight || 1);
        let logoW = this.basketWidth * 0.52;
        let logoH = logoW / (aspect > 0 ? aspect : 1);
        if (logoH > this.basketHeight * 0.55) {
          logoH = this.basketHeight * 0.55;
          logoW = logoH * aspect;
        }
        const logoY = imgH * 0.12;

        ctx.save();
        ctx.drawImage(currentSponsorImg, -logoW / 2, logoY - logoH / 2, logoW, logoH);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = "#C0392B";
      ctx.beginPath();
      ctx.roundRect(-this.basketWidth / 2, -this.basketHeight / 2, this.basketWidth, this.basketHeight, [25, 25, 40, 40]);
      ctx.fill();
      ctx.strokeStyle = this.isLogoPowerUpActive && this.activeLogo ? this.activeLogo.themeColor : "#FFD700";
      ctx.lineWidth = 4;
      ctx.stroke();

      if (currentSponsorImg && currentSponsorImg.complete && currentSponsorImg.naturalWidth > 0) {
        const logoW = this.basketWidth * 0.6;
        const logoH = logoW * 0.6;
        ctx.drawImage(currentSponsorImg, -logoW / 2, -logoH / 2, logoW, logoH);
      }
    }

    ctx.restore();
  }

  public override destroy(): void {
    super.destroy();
    this.audio.stopHowlSfx(AudioManager.TOY_CATCH_PILOT_SFX.catchBag);
    this.items = [];
  }
}


