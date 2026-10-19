/**
 * ==============================================================================
 * JUEGO: ¡CORTA-REGALOS NAVIDEÑO! (Christmas Gift Slash / Ninja)
 * ==============================================================================
 *
 * Minijuego arcade de reflejos estilo Fruit Ninja con temática festiva:
 * - Cajas de regalos, peluches y paquetes vuelan en arcos parabólicos desde la base.
 * - El jugador desliza el dedo o el ratón creando una estela cortante de escarcha brillante.
 * - Rebanar regalos los divide en dos mitades con partículas y revela sorpresas (+100 a +250 pts).
 * - Cortar varios regalos de un solo trazo produce combos ("¡CORTE TRIPLE!").
 * - Evitar cortar las piezas de carbón ardiente (-50 pts y rompe racha).
 * - Duración de 60 segundos con acción constante y respuesta inmediata a 60 FPS.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";

interface FlyingItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  rotSpeed: number;
  radius: number;
  type: "gift_red" | "gift_green" | "gift_gold" | "coal";
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
  sliced: boolean;
  sliceAngle: number;
  splitDistance: number;
  halfVx1: number;
  halfVy1: number;
  halfVx2: number;
  halfVy2: number;
}

interface BladePoint {
  x: number;
  y: number;
  time: number;
}

export class GiftSlashGame extends BaseGame {
  // Sprites
  private bgImage: HTMLImageElement;
  private fairLogo: HTMLImageElement;
  private sponsorLogos: { name: string; logo: HTMLImageElement }[] = [];

  // Objetos voladores
  private items: FlyingItem[] = [];
  private nextItemId: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.85;

  // Estela cortante del dedo / ratón
  private bladeTrail: BladePoint[] = [];
  private isTouching: boolean = false;
  private lastTouchPos = { x: 0, y: 0 };

  // Combos
  private combo: number = 0;
  private maxCombo: number = 0;
  private sliceInSingleSwipe: number = 0;

  // Sprites Stylized 2D
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteGiftGold: HTMLImageElement;
  private spriteCoal: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "gift-slash",
      "¡Corta-Regalos Navideño!",
      "¡Desliza el dedo para cortar los regalos en el aire y evita el carbón ardiente!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Jingle Bells.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImage = this.loadImage("./assets/images/fondo-nieve.webp");
    this.fairLogo = this.loadImage("./assets/logos/clean-feria-magica.png");

    this.sponsorLogos = [
      { name: "Campuslands", logo: this.loadImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.loadImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.loadImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.fairLogo }
    ];

    // Carga de sprites estilizados HD
    this.spriteGiftRed = this.getImage("./assets/images/regalo-estilizado-rojo.png");
    this.spriteGiftGreen = this.getImage("./assets/images/regalo-estilizado-verde.png");
    this.spriteGiftGold = this.getImage("./assets/images/regalo-estilizado-dorado.png");
    this.spriteCoal = this.getImage("./assets/images/carbon.png");
  }

  private loadImage(src: string): HTMLImageElement {
    return this.getImage(src);
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.items = [];
    this.bladeTrail = [];
    this.isTouching = false;
    this.spawnTimer = 0;

    // Controles de deslizamiento continuo
    this.input.onPointerDown = (_pointerId: number, x: number, y: number) => {
      this.isTouching = true;
      this.lastTouchPos = { x, y };
      this.bladeTrail = [{ x, y, time: performance.now() }];
      this.sliceInSingleSwipe = 0;
    };

    this.input.onPointerMove = (_pointerId: number, x: number, y: number) => {
      if (this.isTouching) {
        const now = performance.now();
        this.checkBladeSlice(this.lastTouchPos.x, this.lastTouchPos.y, x, y);
        this.lastTouchPos = { x, y };
        this.bladeTrail.push({ x, y, time: now });
      }
    };

    this.input.onPointerUp = (_pointerId: number, _x: number, _y: number) => {
      this.isTouching = false;
      if (this.sliceInSingleSwipe >= 3) {
        this.addFloatingText(`★ ¡CORTE TRIPLE! +150 ★`, this.lastTouchPos.x, this.lastTouchPos.y - 20, "#FFD700", 1.5);
        this.score += 150;
      }
      this.sliceInSingleSwipe = 0;
    };

    this.addFloatingText("¡DESLIZA PARA CORTAR!", this.width * 0.5, this.height * 0.4, "#FFD700", 1.5);
  }

  public override destroy(): void {
    super.destroy();
    this.isTouching = false;
    this.bladeTrail = [];
    this.items = [];
  }

  // ==========================================================================
  // LÓGICA DE FÍSICAS A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    // 1. Limpieza de puntos antiguos de la estela
    const now = performance.now();
    this.bladeTrail = this.bladeTrail.filter((pt) => now - pt.time < 180);

    // 2. Control de lanzamiento periódico de regalos
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave();
    }

    // 3. Físicas de los objetos voladores
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];

      if (it.sliced) {
        // Objeto partido en dos mitades
        it.splitDistance += dt * 180;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vy += it.gravity * dt;
        it.rotation += it.rotSpeed * dt;
      } else {
        // Vuelo parabólico normal
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vy += it.gravity * dt;
        it.rotation += it.rotSpeed * dt;
      }

      // Eliminar cuando sale por la parte inferior
      if (it.y > this.height + 80 && it.vy > 0) {
        this.items.splice(i, 1);
      }
    }
  }

  private spawnWave(): void {
    const waveCount = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < waveCount; i++) {
      this.spawnSingleItem();
    }
  }

  private spawnSingleItem(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;

    const startX = w * 0.18 + Math.random() * (w * 0.64);
    const startY = h + 40;

    // Velocidad hacia arriba y ligera curva horizontal
    const vy = -(h * 0.95 + Math.random() * 140);
    const vx = (w * 0.5 - startX) * (1.1 + Math.random() * 0.5);

    const rand = Math.random();
    let type: FlyingItem["type"] = "gift_red";
    let sponsorName: string | undefined = undefined;
    let sponsorLogo: HTMLImageElement | undefined = undefined;

    if (rand < 0.22 && this.sponsorLogos.length > 0) {
      type = "gift_gold";
      const sp = this.sponsorLogos[Math.floor(Math.random() * this.sponsorLogos.length)];
      sponsorName = sp.name;
      sponsorLogo = sp.logo;
    } else if (rand < 0.42) {
      type = "coal";
    } else if (rand < 0.72) {
      type = "gift_green";
    } else {
      type = "gift_red";
    }

    const radius = type === "gift_gold" ? 36 : 30;

    this.items.push({
      id: this.nextItemId++,
      x: startX,
      y: startY,
      vx,
      vy,
      gravity: 860,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      radius,
      type,
      sponsorName,
      sponsorLogo,
      sliced: false,
      sliceAngle: 0,
      splitDistance: 0,
      halfVx1: -80,
      halfVy1: -40,
      halfVx2: 80,
      halfVy2: 40
    });
  }

  /**
   * Comprueba si el segmento de corte (x1,y1)->(x2,y2) corta algún regalo
   */
  private checkBladeSlice(x1: number, y1: number, x2: number, y2: number): void {
    const segDx = x2 - x1;
    const segDy = y2 - y1;
    const segLenSq = segDx * segDx + segDy * segDy;
    if (segLenSq < 16) return; // Movimiento insignificante

    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      if (it.sliced) continue;

      // Distancia del círculo al segmento de corte
      const t = Math.max(0, Math.min(1, ((it.x - x1) * segDx + (it.y - y1) * segDy) / segLenSq));
      const closestX = x1 + t * segDx;
      const closestY = y1 + t * segDy;
      const dist = Math.hypot(it.x - closestX, it.y - closestY);

      if (dist < it.radius + 8) {
        // ¡Corte exitoso!
        it.sliced = true;
        it.sliceAngle = Math.atan2(segDy, segDx);

        const normalX = -Math.sin(it.sliceAngle);
        const normalY = Math.cos(it.sliceAngle);
        it.halfVx1 = normalX * -140;
        it.halfVy1 = normalY * -140;
        it.halfVx2 = normalX * 140;
        it.halfVy2 = normalY * 140;

        if (it.type === "coal") {
          // Penalización por carbón
          this.combo = 0;
          this.score = Math.max(0, this.score - 50);
          this.audio.playElfHit();
          this.triggerShake(0.2, 6);
          this.particles.emitBurst(it.x, it.y, "#FF1744", 16);
          this.addFloatingText("¡CARBÓN! -50", it.x, it.y - 20, "#FF1744", 1.3);
        } else if (it.type === "gift_gold") {
          // Regalo dorado patrocinador
          this.combo += 2;
          this.sliceInSingleSwipe++;
          const pts = 250;
          this.score += pts;
          this.audio.playPowerUp();
          this.triggerShake(0.16, 5);
          this.particles.emitBurst(it.x, it.y, "#FFD700", 22);
          this.addFloatingText(`★ ${it.sponsorName?.toUpperCase() || "OFICIAL"}! +${pts}`, it.x, it.y - 25, "#FFD700", 1.4);
        } else {
          // Regalo normal rojo o verde
          this.combo++;
          this.sliceInSingleSwipe++;
          const pts = 100;
          this.score += pts;
          this.audio.playPaperTear();
          this.triggerShake(0.1, 3);
          this.particles.emitBurst(it.x, it.y, it.type === "gift_red" ? "#FF1744" : "#00E676", 14);
          this.addFloatingText(`+${pts}`, it.x, it.y - 20, "#FFD700", 1.1);
        }

        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      }
    }
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo invernal
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

    // 2. Objetos voladores
    this.items.forEach((it) => {
      this.drawFlyingItem(ctx, it);
    });

    // 3. Estela cortante del dedo
    this.drawBladeTrail(ctx);

    // 4. Partículas
    this.particles.draw(ctx, true);

    // 5. HUD de Racha
    if (this.combo >= 2) {
      const tagW = 120;
      const tagH = 26;
      const tagX = (this.width - tagW) / 2;
      const tagY = 72;

      ctx.save();
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
      ctx.fillText(`¡COMBO x${this.combo}!`, this.width / 2, tagY + 13);
      ctx.restore();
    }
  }

  /**
   * Dibuja los regalos voladores o sus dos mitades rebanadas
   */
  private drawFlyingItem(ctx: CanvasRenderingContext2D, it: FlyingItem): void {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rotation);

    const r = it.radius;

    if (it.sliced) {
      // Dibujar dos mitades separándose
      ctx.save();
      ctx.translate(it.halfVx1 * 0.15, it.halfVy1 * 0.15);
      this.drawHalfItem(ctx, it, -1);
      ctx.restore();

      ctx.save();
      ctx.translate(it.halfVx2 * 0.15, it.halfVy2 * 0.15);
      this.drawHalfItem(ctx, it, 1);
      ctx.restore();
    } else {
      // Objeto entero
      const sprite = it.type === "coal"
        ? this.spriteCoal
        : it.type === "gift_gold"
        ? this.spriteGiftGold
        : it.type === "gift_green"
        ? this.spriteGiftGreen
        : this.spriteGiftRed;

      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.drawImage(sprite, -r, -r, r * 2, r * 2);

        // Logo centrado si es patrocinador
        if (it.type === "gift_gold" && it.sponsorLogo && it.sponsorLogo.complete) {
          const badgeR = r * 0.52;
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const logoSize = badgeR * 1.45;
          ctx.drawImage(it.sponsorLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
        }
      } else {
        // Respaldo geométrico de emergencia
        if (it.type === "coal") {
          ctx.fillStyle = "#212121";
          ctx.strokeStyle = "#FF3D00";
          ctx.lineWidth = 2.5;
          this.roundRect(ctx, -r, -r, r * 2, r * 2, 8);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = it.type === "gift_gold" ? "#FFD700" : it.type === "gift_green" ? "#2E7D32" : "#D50000";
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          this.roundRect(ctx, -r, -r, r * 2, r * 2, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = it.type === "gift_gold" ? "#D50000" : "#FFD700";
          ctx.fillRect(-r * 0.2, -r, r * 0.4, r * 2);
          ctx.fillRect(-r, -r * 0.2, r * 2, r * 0.4);

          if (it.type === "gift_gold" && it.sponsorLogo && it.sponsorLogo.complete) {
            const logoSize = r * 1.1;
            ctx.drawImage(it.sponsorLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
          }
        }
      }
    }

    ctx.restore();
  }

  private drawHalfItem(ctx: CanvasRenderingContext2D, it: FlyingItem, side: number): void {
    const r = it.radius;
    const sprite = it.type === "coal"
      ? this.spriteCoal
      : it.type === "gift_gold"
      ? this.spriteGiftGold
      : it.type === "gift_green"
      ? this.spriteGiftGreen
      : this.spriteGiftRed;

    ctx.save();
    ctx.beginPath();
    if (side === -1) {
      ctx.rect(-r - 4, -r - 4, r + 4, (r + 4) * 2);
    } else {
      ctx.rect(0, -r - 4, r + 4, (r + 4) * 2);
    }
    ctx.clip();

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, -r, -r, r * 2, r * 2);
    } else {
      ctx.fillStyle = it.type === "gift_gold" ? "#FFD700" : it.type === "gift_green" ? "#2E7D32" : "#D50000";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (side === -1) {
        ctx.rect(-r, -r, r, r * 2);
      } else {
        ctx.rect(0, -r, r, r * 2);
      }
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Dibuja la estela luminosa de corte
   */
  private drawBladeTrail(ctx: CanvasRenderingContext2D): void {
    if (this.bladeTrail.length < 2) return;

    ctx.save();
    const now = performance.now();

    for (let i = 1; i < this.bladeTrail.length; i++) {
      const p1 = this.bladeTrail[i - 1];
      const p2 = this.bladeTrail[i];
      const life = 1 - (now - p2.time) / 180;
      if (life <= 0) continue;

      ctx.strokeStyle = `rgba(0, 229, 255, ${life * 0.9})`;
      ctx.lineWidth = Math.max(2, life * 8);
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Núcleo blanco brillante
      ctx.strokeStyle = `rgba(255, 255, 255, ${life * 0.95})`;
      ctx.lineWidth = Math.max(1, life * 3);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
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
