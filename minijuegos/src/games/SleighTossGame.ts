/**
 * ==============================================================================
 * JUEGO: ¡LANZA-REGALOS AL TRINEO! (Christmas Sleigh Gift Toss)
 * ==============================================================================
 *
 * Minijuego arcade clásico estilo Paper Toss / Canasta con temática navideña:
 * - El trineo mágico de Papá Noel se desplaza horizontalmente por el cielo.
 * - El jugador apunta y lanza regalos hacia el trineo deslizando hacia arriba o tocando.
 * - Físicas balísticas 2D en perspectiva con escala de profundidad.
 * - Encestar en el trineo suma puntos (+150 pts), genera confeti y aumenta el combo.
 * - Regalos dorados patrocinados (+300 pts) y trineos veloces.
 * - Duración de 60 segundos con acción fluida y respuesta inmediata a 60 FPS.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";

interface TossedGift {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  isSponsored: boolean;
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
  scored: boolean;
  active: boolean;
}

export class SleighTossGame extends BaseGame {
  // Sprites
  private bgImage: HTMLImageElement;
  private fairLogo: HTMLImageElement;
  private sponsorLogos: { name: string; logo: HTMLImageElement }[] = [];

  // Trineo volador objetivo
  private sleighX: number = 0;
  private sleighY: number = 130;
  private sleighW: number = 140;
  private sleighH: number = 65;
  private sleighSpeed: number = 180;
  private sleighDir: number = 1;

  // Regalos lanzados
  private gifts: TossedGift[] = [];
  private nextGiftId: number = 0;
  private isAiming: boolean = false;
  private aimStartX: number = 0;
  private aimStartY: number = 0;

  // Regalo preparado en la base para lanzar
  private readyGiftX: number = 0;
  private readyGiftY: number = 0;
  private isNextSponsored: boolean = false;
  private nextSponsorIdx: number = 0;

  // Botón táctil directo para pantallas kiosco / tótem
  private btnTossRect = { x: 0, y: 0, w: 180, h: 48 };

  // Combos
  private combo: number = 0;
  private maxCombo: number = 0;

  // Animaciones
  private animClock: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "sleigh-toss",
      "¡Lanza-Regalos al Trineo!",
      "¡Desliza hacia arriba para encestar los regalos en el trineo de Santa!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Deck The Halls.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImage = this.loadImage("./assets/images/fondo-nieve.webp");
    this.fairLogo = this.loadImage("./assets/logos/clean-feria-magica.png");

    this.sponsorLogos = [
      { name: "Campuslands", logo: this.loadImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.loadImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.loadImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.fairLogo }
    ];

    this.computeLayout();
  }

  private loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.gifts = [];
    this.isAiming = false;
    this.isNextSponsored = Math.random() < 0.35;
    this.nextSponsorIdx = 0;

    this.computeLayout();

    // Controles de deslizamiento (swipe up) o toque directo
    this.input.onPointerDown = (x: number, y: number) => {
      // ¿Tocó el botón de lanzamiento directo?
      if (
        x >= this.btnTossRect.x &&
        x <= this.btnTossRect.x + this.btnTossRect.w &&
        y >= this.btnTossRect.y &&
        y <= this.btnTossRect.y + this.btnTossRect.h
      ) {
        this.tossGiftStraight();
        return;
      }

      this.isAiming = true;
      this.aimStartX = x;
      this.aimStartY = y;
    };

    this.input.onPointerUp = (x: number, y: number) => {
      if (this.isAiming) {
        this.isAiming = false;
        const dy = y - this.aimStartY;
        const dx = x - this.aimStartX;

        // Si deslizó hacia arriba con suficiente ímpetu
        if (dy < -25) {
          const power = Math.min(850, Math.max(450, -dy * 3.2));
          const vx = Math.min(320, Math.max(-320, dx * 2.8));
          this.tossGift(vx, -power);
        } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
          // Toque simple: lanzamiento hacia el trineo
          this.tossGiftStraight();
        }
      }
    };

    this.addFloatingText("¡ENCESTA EN EL TRINEO!", this.width * 0.5, this.height * 0.4, "#FFD700", 1.5);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onPointerDown = undefined;
    this.input.onPointerUp = undefined;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeLayout();
  }

  private computeLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;

    this.sleighW = Math.min(160, Math.max(110, w * 0.22));
    this.sleighH = this.sleighW * 0.46;
    this.sleighY = Math.max(95, h * 0.18);
    this.sleighX = (w - this.sleighW) / 2;

    this.readyGiftX = w * 0.5;
    this.readyGiftY = h * 0.82;

    const btnW = Math.min(220, w * 0.48);
    const btnH = 46;
    this.btnTossRect = {
      x: (w - btnW) / 2,
      y: Math.min(h - btnH - 12, h * 0.91),
      w: btnW,
      h: btnH
    };
  }

  /**
   * Lanza un regalo con vector específico
   */
  private tossGift(vx: number, vy: number): void {
    const sp = this.isNextSponsored && this.sponsorLogos.length > 0
      ? this.sponsorLogos[this.nextSponsorIdx % this.sponsorLogos.length]
      : undefined;

    this.gifts.push({
      id: this.nextGiftId++,
      x: this.readyGiftX,
      y: this.readyGiftY,
      vx,
      vy,
      scale: 1.0,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 5,
      isSponsored: this.isNextSponsored,
      sponsorName: sp?.name,
      sponsorLogo: sp?.logo,
      scored: false,
      active: true
    });

    this.audio.playCatchItem(1.1);
    this.particles.emitBurst(this.readyGiftX, this.readyGiftY, "#FFD700", 8);

    // Preparar siguiente regalo
    this.isNextSponsored = Math.random() < 0.35;
    if (this.isNextSponsored) this.nextSponsorIdx++;
  }

  private tossGiftStraight(): void {
    // Calcular trayectoria orientada hacia la posición actual del trineo
    const targetX = this.sleighX + this.sleighW * 0.5;
    const dx = targetX - this.readyGiftX;
    const vx = dx * 1.35;
    const vy = -680;
    this.tossGift(vx, vy);
  }

  // ==========================================================================
  // LÓGICA DE FÍSICAS A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animClock += dt;

    // 1. Movimiento del trineo de Santa de lado a lado
    this.sleighX += this.sleighDir * this.sleighSpeed * dt;
    if (this.sleighX < 20) {
      this.sleighX = 20;
      this.sleighDir = 1;
    } else if (this.sleighX + this.sleighW > this.width - 20) {
      this.sleighX = this.width - 20 - this.sleighW;
      this.sleighDir = -1;
    }

    // 2. Físicas balísticas de los regalos lanzados
    const gravity = 880;
    for (let i = this.gifts.length - 1; i >= 0; i--) {
      const g = this.gifts[i];
      if (!g.active) continue;

      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += gravity * dt;
      g.rotation += g.rotSpeed * dt;

      // Efecto de perspectiva (se hace más pequeño a medida que asciende hacia el fondo)
      g.scale = Math.max(0.48, 1.0 - (this.readyGiftY - g.y) / (this.height * 1.5));

      // Estela de chispas
      if (Math.random() < 0.4) {
        this.particles.emitBurst(g.x, g.y, g.isSponsored ? "#FFD700" : "#FFFFFF", 2);
      }

      // Comprobar si entra en la canasta del trineo
      const sleighCenterX = this.sleighX + this.sleighW * 0.5;
      const sleighCenterY = this.sleighY + this.sleighH * 0.5;
      const distToSleigh = Math.hypot(g.x - sleighCenterX, g.y - sleighCenterY);

      if (!g.scored && distToSleigh < this.sleighW * 0.42 && g.vy > -200 && g.vy < 300) {
        // ¡CANASTA EXITOSA!
        g.scored = true;
        g.active = false;

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        const basePts = g.isSponsored ? 300 : 150;
        const pts = basePts + (this.combo > 2 ? (this.combo - 1) * 50 : 0);
        this.score += pts;

        if (g.isSponsored) {
          this.audio.playPowerUp();
          this.triggerShake(0.18, 5);
          this.particles.emitConfetti(this.width, 30);
          this.addFloatingText(`★ ¡REGALO ${g.sponsorName?.toUpperCase() || "OFICIAL"}! +${pts} ★`, g.x, g.y - 30, "#FFD700", 1.5);
        } else {
          this.audio.playVictory();
          this.triggerShake(0.12, 3);
          this.particles.emitBurst(g.x, g.y, "#00E676", 18);
          this.addFloatingText(`¡CANASTA! +${pts}`, g.x, g.y - 25, "#FFD700", 1.3);
        }
      }

      // Eliminar si cae por debajo del suelo o sale de la pantalla
      if (g.y > this.height + 60 && g.vy > 0) {
        if (!g.scored) {
          this.combo = 0;
        }
        this.gifts.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo crepuscular
    if (this.bgImage && this.bgImage.complete) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#081329");
      grad.addColorStop(0.5, "#102347");
      grad.addColorStop(1, "#E8F0FE");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Trineo volador de Santa
    this.drawSleigh(ctx);

    // 3. Regalos en el aire
    this.gifts.forEach((g) => {
      if (g.active) this.drawGift(ctx, g.x, g.y, g.scale, g.rotation, g.isSponsored, g.sponsorLogo);
    });

    // 4. Regalo preparado en la plataforma de lanzamiento
    this.drawLaunchPedestal(ctx);

    // 5. Partículas
    this.particles.draw(ctx, true);

    // 6. Botón táctil inferior y HUD
    this.drawTouchButtonAndHUD(ctx);
  }

  /**
   * Dibuja el trineo de Papá Noel con renos y regalos
   */
  private drawSleigh(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.sleighX, this.sleighY);

    const w = this.sleighW;
    const h = this.sleighH;
    const sway = Math.sin(this.animClock * 3.5) * 3;

    ctx.translate(0, sway);

    // Patines dorados del trineo
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.95);
    ctx.lineTo(w * 0.9, h * 0.95);
    ctx.arcTo(w * 1.05, h * 0.95, w * 1.05, h * 0.7, 10);
    ctx.stroke();

    // Cuerpo de madera caoba del trineo
    ctx.fillStyle = "#B71C1C";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, w * 0.15, h * 0.2, w * 0.7, h * 0.65, 12);
    ctx.fill();
    ctx.stroke();

    // Saco de regalos asomándose
    ctx.fillStyle = "#2E7D32";
    ctx.beginPath();
    ctx.arc(w * 0.38, h * 0.35, w * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Santa Claus saludando
    ctx.fillStyle = "#D50000";
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.28, w * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Barba blanca
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.36, w * 0.12, 0, Math.PI);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dibuja un regalo individual con rotación y escala
   */
  private drawGift(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    rot: number,
    isSponsored: boolean,
    logo?: HTMLImageElement
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);

    const s = 34;

    // Caja
    ctx.fillStyle = isSponsored ? "#FFD700" : "#D50000";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    this.roundRect(ctx, -s / 2, -s / 2, s, s, 6);
    ctx.fill();
    ctx.stroke();

    // Cintas cruzadas
    ctx.fillStyle = isSponsored ? "#D50000" : "#FFD700";
    ctx.fillRect(-s * 0.15, -s / 2, s * 0.3, s);
    ctx.fillRect(-s / 2, -s * 0.15, s, s * 0.3);

    // Logo si es patrocinador
    if (isSponsored && logo && logo.complete) {
      const logoSize = s * 0.9;
      ctx.drawImage(logo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    }

    ctx.restore();
  }

  /**
   * Pedestal de lanzamiento en la base
   */
  private drawLaunchPedestal(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Pedestal de nieve y madera
    ctx.fillStyle = "#3E2723";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    this.roundRect(ctx, this.readyGiftX - 45, this.readyGiftY + 22, 90, 16, 8);
    ctx.fill();
    ctx.stroke();

    // Manto de nieve
    ctx.fillStyle = "#FFFFFF";
    this.roundRect(ctx, this.readyGiftX - 42, this.readyGiftY + 18, 84, 8, 4);
    ctx.fill();

    // Regalo preparado flotando ligeramente
    const floatY = this.readyGiftY + Math.sin(this.animClock * 4) * 3;
    const sp = this.isNextSponsored && this.sponsorLogos.length > 0
      ? this.sponsorLogos[this.nextSponsorIdx % this.sponsorLogos.length]
      : undefined;

    this.drawGift(ctx, this.readyGiftX, floatY, 1.0, 0, this.isNextSponsored, sp?.logo);

    ctx.restore();
  }

  /**
   * Botón táctil directo y HUD
   */
  private drawTouchButtonAndHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Botón Lanzar
    const btn = this.btnTossRect;
    ctx.fillStyle = "rgba(30, 45, 75, 0.92)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 13px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚀 ¡LANZAR AL TRINEO!", btn.x + btn.w / 2, btn.y + btn.h / 2);

    // 2. HUD de Combo
    if (this.combo >= 2) {
      const tagW = 120;
      const tagH = 26;
      const tagX = (this.width - tagW) / 2;
      const tagY = 72;

      ctx.fillStyle = "rgba(10, 22, 45, 0.9)";
      ctx.strokeStyle = "#FF9100";
      ctx.lineWidth = 2;
      this.roundRect(ctx, tagX, tagY, tagW, tagH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FF9100";
      ctx.font = "900 12px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`¡CANASTA x${this.combo}!`, this.width / 2, tagY + 13);
    }

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
