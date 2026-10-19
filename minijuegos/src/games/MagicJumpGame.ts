/**
 * ==============================================================================
 * JUEGO: ¡SALTO MÁGICO NAVIDEÑO! (Christmas Magic Jump)
 * ==============================================================================
 *
 * Minijuego arcade vertical estilo Doodle Jump / Icy Tower con temática festiva:
 * - El elfo salta automáticamente al caer sobre plataformas nevadas.
 * - Plataformas estables de madera, deslizantes de hielo, frágiles y con resortes de caramelo.
 * - Plataformas patrocinadas con marcas oficiales (Campuslands, Cajasan, IMEBU, Feria Mágica)
 *   que otorgan Cohete Mágico / Super-Vuelo con estrellas doradas.
 * - Control táctil intuitivo (arrastre horizontal, toques laterales o teclado A/D / Flechas).
 * - Envoltura horizontal de pantalla (wrap-around de izquierda a derecha).
 * - Cámara vertical suave y red de seguridad elástica inferior (60s de diversión continua).
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";

interface JumpPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "normal" | "moving" | "fragile" | "spring" | "sponsor";
  moveDir: number;
  moveSpeed: number;
  minX: number;
  maxX: number;
  broken: boolean;
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
  hasItem?: "gift" | "star" | "rocket";
  itemCollected?: boolean;
}

export class MagicJumpGame extends BaseGame {
  // Sprites y Fondos
  private bgImage: HTMLImageElement;
  private fairLogo: HTMLImageElement;
  private sponsorLogos: { name: string; logo: HTMLImageElement }[] = [];

  // Personaje (Elfo Navideño)
  private playerX: number = 0;
  private playerY: number = 0;
  private playerVx: number = 0;
  private playerVy: number = 0;
  private playerW: number = 44;
  private playerH: number = 52;
  private playerFacingRight: boolean = true;
  private isRocketActive: boolean = false;
  private rocketTimer: number = 0;

  // Físicas del salto
  private readonly gravity: number = 960;
  private readonly normalJumpSpeed: number = -620;
  private readonly springJumpSpeed: number = -1050;
  private readonly rocketSpeed: number = -1200;

  // Cámara vertical
  private cameraY: number = 0;
  private maxAltitudeReached: number = 0;

  // Plataformas y Coleccionables
  private platforms: JumpPlatform[] = [];
  private highestPlatformY: number = 0;

  // Combos
  private combo: number = 0;
  private maxCombo: number = 0;

  // Entrada
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private isPointerActive: boolean = false;
  private targetPlayerX: number | null = null;

  // Botones táctiles inferiores para pantalla táctil / tótem
  private btnLeftRect = { x: 0, y: 0, w: 110, h: 48 };
  private btnRightRect = { x: 0, y: 0, w: 110, h: 48 };

  // Animaciones
  private animTimer: number = 0;

  // Sprites Stylized 2D
  private spriteStar: HTMLImageElement;
  private spriteGift: HTMLImageElement;
  private spriteArrowLeft: HTMLImageElement;
  private spriteArrowRight: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "christmas-jump",
      "¡Salto Mágico Navideño!",
      "¡Salta sobre las plataformas de nieve, recoge regalos y vuela alto con los propulsores!",
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

    // Carga de sprites estilizados HD
    this.spriteStar = this.getImage("./assets/images/estrella con logo.png");
    this.spriteGift = this.getImage("./assets/images/regalo-estilizado-rojo.png");
    this.spriteArrowLeft = this.getImage("./assets/images/flecha-izq.png");
    this.spriteArrowRight = this.getImage("./assets/images/flecha-der.png");

    this.computeGameLayout();
  }

  private loadImage(src: string): HTMLImageElement {
    return this.getImage(src);
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.maxAltitudeReached = 0;
    this.isRocketActive = false;
    this.rocketTimer = 0;
    this.targetPlayerX = null;

    this.computeGameLayout();
    this.initPlatforms();

    // Posición inicial del jugador sobre la plataforma base
    this.playerX = this.width * 0.5;
    this.playerY = this.height * 0.72;
    this.playerVx = 0;
    this.playerVy = this.normalJumpSpeed;
    this.cameraY = 0;

    // Controles táctiles continuos de arrastre y toque
    this.input.onPointerDown = (_pointerId: number, x: number, _y: number) => {
      this.isPointerActive = true;
      this.handlePointerInput(x);
    };

    this.input.onPointerMove = (_pointerId: number, x: number, _y: number) => {
      if (this.isPointerActive) {
        this.handlePointerInput(x);
      }
    };

    this.input.onPointerUp = (_pointerId: number, _x: number, _y: number) => {
      this.isPointerActive = false;
      this.isMovingLeft = false;
      this.isMovingRight = false;
      this.targetPlayerX = null;
    };

    // Soporte para teclado (flechas o A/D) con eliminación previa para evitar duplicados
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.addFloatingText("¡SALTA HACIA LAS ESTRELLAS!", this.width * 0.5, this.height * 0.4, "#FFD700", 1.5);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.isPointerActive = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.targetPlayerX = null;
    this.platforms = [];
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeGameLayout();
  }

  private computeGameLayout(): void {
    const w = this.width > 0 ? this.width : (this.canvas.width > 0 ? this.canvas.width : (typeof window !== "undefined" ? window.innerWidth : 800));
    const h = this.height > 0 ? this.height : (this.canvas.height > 0 ? this.canvas.height : (typeof window !== "undefined" ? window.innerHeight : 600));
    if (w <= 0 || h <= 0) return;

    this.playerW = Math.max(38, Math.min(52, w * 0.08));
    this.playerH = this.playerW * 1.25;

    // Botones táctiles inferiores para kiosco táctil y móviles
    const btnW = Math.min(160, Math.max(104, Math.round(w * 0.28)));
    const btnH = Math.max(52, Math.min(68, Math.round(h * 0.048)));
    const btnY = Math.min(h - btnH - 14, h * 0.91);

    this.btnLeftRect = {
      x: 16,
      y: btnY,
      w: btnW,
      h: btnH
    };

    this.btnRightRect = {
      x: w - btnW - 16,
      y: btnY,
      w: btnW,
      h: btnH
    };
  }

  /**
   * Genera el conjunto inicial de plataformas
   */
  private initPlatforms(): void {
    this.platforms = [];

    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;

    // Plataforma base inicial
    const baseW = Math.min(220, w * 0.5);
    this.platforms.push({
      x: (w - baseW) / 2,
      y: h * 0.78,
      w: baseW,
      h: 18,
      type: "normal",
      moveDir: 0,
      moveSpeed: 0,
      minX: 0,
      maxX: w,
      broken: false
    });

    // Generar plataformas hacia arriba
    let curY = h * 0.78 - 85;
    this.highestPlatformY = curY;

    for (let i = 0; i < 18; i++) {
      this.generatePlatformAt(curY);
      curY -= 75 + Math.random() * 25;
      this.highestPlatformY = curY;
    }
  }

  /**
   * Genera una plataforma en una altura Y específica
   */
  private generatePlatformAt(y: number): void {
    const w = this.width > 0 ? this.width : 800;
    const platW = Math.max(68, Math.min(115, w * 0.22));
    const platH = 16;
    const platX = Math.random() * (w - platW - 32) + 16;

    // Decidir tipo de plataforma
    const rand = Math.random();
    let type: JumpPlatform["type"] = "normal";
    let moveSpeed = 0;
    let sponsorName: string | undefined = undefined;
    let sponsorLogo: HTMLImageElement | undefined = undefined;
    let hasItem: JumpPlatform["hasItem"] = undefined;

    if (rand < 0.16) {
      type = "moving";
      moveSpeed = 60 + Math.random() * 50;
    } else if (rand < 0.28) {
      type = "fragile";
    } else if (rand < 0.40) {
      type = "spring";
    } else if (rand < 0.55 && this.sponsorLogos.length > 0) {
      type = "sponsor";
      const sp = this.sponsorLogos[Math.floor(Math.random() * this.sponsorLogos.length)];
      sponsorName = sp.name;
      sponsorLogo = sp.logo;
      hasItem = "rocket";
    } else {
      type = "normal";
      if (Math.random() < 0.35) {
        hasItem = Math.random() < 0.6 ? "gift" : "star";
      }
    }

    const platform: JumpPlatform = {
      x: platX,
      y,
      w: platW,
      h: platH,
      type,
      moveDir: Math.random() < 0.5 ? 1 : -1,
      moveSpeed,
      minX: 16,
      maxX: w - 16,
      broken: false,
      sponsorName,
      sponsorLogo,
      hasItem,
      itemCollected: false
    };

    this.platforms.push(platform);
  }

  // ==========================================================================
  // CONTROLES
  // ==========================================================================
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      this.isMovingLeft = true;
      this.isMovingRight = false;
      this.targetPlayerX = null;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      this.isMovingRight = true;
      this.isMovingLeft = false;
      this.targetPlayerX = null;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      this.isMovingLeft = false;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      this.isMovingRight = false;
    }
  };

  private handlePointerInput(screenX: number): void {
    if (!this.isRunning || this.isGameOver) return;

    // Si toca directamente los botones táctiles
    if (screenX < this.width * 0.4) {
      this.isMovingLeft = true;
      this.isMovingRight = false;
      this.targetPlayerX = null;
    } else if (screenX > this.width * 0.6) {
      this.isMovingRight = true;
      this.isMovingLeft = false;
      this.targetPlayerX = null;
    } else {
      // Arrastre directo hacia el centro
      this.targetPlayerX = screenX;
    }
  }

  // ==========================================================================
  // ACTUALIZACIÓN DE FÍSICAS A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animTimer += dt;

    // 1. Control de propulsor cohete
    if (this.isRocketActive) {
      this.rocketTimer -= dt;
      this.playerVy = this.rocketSpeed;

      // Estela de chispas mágicas
      this.particles.emitBurst(this.playerX, this.playerY + this.playerH * 0.5, "#FFD700", 3);

      if (this.rocketTimer <= 0) {
        this.isRocketActive = false;
        this.playerVy = this.normalJumpSpeed * 0.8;
      }
    } else {
      // Gravedad normal
      this.playerVy += this.gravity * dt;
    }

    // 2. Movimiento horizontal
    const maxHorizontalSpeed = 380;
    const accel = 1800;

    if (this.targetPlayerX !== null) {
      // Seguimiento suave de toque
      const dx = this.targetPlayerX - this.playerX;
      if (Math.abs(dx) > 6) {
        this.playerVx = Math.sign(dx) * Math.min(maxHorizontalSpeed, Math.abs(dx) * 8);
        this.playerFacingRight = dx > 0;
      } else {
        this.playerVx *= 0.8;
      }
    } else if (this.isMovingLeft) {
      this.playerVx = Math.max(-maxHorizontalSpeed, this.playerVx - accel * dt);
      this.playerFacingRight = false;
    } else if (this.isMovingRight) {
      this.playerVx = Math.min(maxHorizontalSpeed, this.playerVx + accel * dt);
      this.playerFacingRight = true;
    } else {
      // Fricción del aire
      this.playerVx *= 0.88;
    }

    this.playerX += this.playerVx * dt;
    this.playerY += this.playerVy * dt;

    // Envoltura horizontal de pantalla (wrap-around)
    if (this.playerX < -this.playerW * 0.5) {
      this.playerX = this.width + this.playerW * 0.5;
    } else if (this.playerX > this.width + this.playerW * 0.5) {
      this.playerX = -this.playerW * 0.5;
    }

    // 3. Movimiento de plataformas deslizantes
    this.platforms.forEach((plat) => {
      if (plat.type === "moving") {
        plat.x += plat.moveDir * plat.moveSpeed * dt;
        if (plat.x < plat.minX) {
          plat.x = plat.minX;
          plat.moveDir = 1;
        } else if (plat.x + plat.w > plat.maxX) {
          plat.x = plat.maxX - plat.w;
          plat.moveDir = -1;
        }
      }
    });

    // 4. Colisiones con plataformas (sólo cuando cae con vy > 0)
    if (this.playerVy > 0 && !this.isRocketActive) {
      const feetY = this.playerY + this.playerH * 0.5;
      const prevFeetY = feetY - this.playerVy * dt;

      for (let i = 0; i < this.platforms.length; i++) {
        const plat = this.platforms[i];
        if (plat.broken) continue;

        // Comprobar si los pies del elfo cruzan la parte superior de la plataforma
        if (
          feetY >= plat.y &&
          prevFeetY <= plat.y + 14 &&
          this.playerX + this.playerW * 0.35 >= plat.x &&
          this.playerX - this.playerW * 0.35 <= plat.x + plat.w
        ) {
          // ¡Aterrizaje y rebote!
          this.playerY = plat.y - this.playerH * 0.5;

          if (plat.type === "spring") {
            // Súper rebote con resorte de bastón de caramelo
            this.playerVy = this.springJumpSpeed;
            this.combo += 2;
            this.audio.playCatchItem(1.4);
            this.triggerShake(0.14, 4);
            this.particles.emitBurst(this.playerX, plat.y, "#FF1744", 14);
            this.addFloatingText("¡SÚPER SALTO! +150", this.playerX, plat.y - 20, "#FFD700", 1.3);
            this.score += 150;
          } else if (plat.type === "fragile") {
            // Plataforma de hielo quebradizo
            plat.broken = true;
            this.playerVy = this.normalJumpSpeed;
            this.combo++;
            this.audio.playElfHit();
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y, "#81D4FA", 12);
            this.score += 50;
          } else if (plat.type === "sponsor") {
            // Plataforma de patrocinador oficial: activa Cohete Propulsor
            this.playerVy = this.normalJumpSpeed;
            this.combo += 3;
            plat.itemCollected = true;
            this.triggerRocketBoost(plat.sponsorName || "OFICIAL");
          } else {
            // Plataforma normal o móvil
            this.playerVy = this.normalJumpSpeed;
            this.combo++;
            this.audio.playCatchItem(1.0 + (this.combo % 6) * 0.05);
            this.particles.emitBurst(this.playerX, plat.y, "#FFFFFF", 6);
            this.score += 25;
          }

          if (this.combo > this.maxCombo) this.maxCombo = this.combo;

          // Recoger coleccionables sobre la plataforma
          if (plat.hasItem && !plat.itemCollected) {
            plat.itemCollected = true;
            const pts = plat.hasItem === "star" ? 250 : 100;
            this.score += pts;
            this.audio.playPowerUp();
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y - 20, "#FFD700", 10);
            this.addFloatingText(`+${pts}`, plat.x + plat.w * 0.5, plat.y - 30, "#FFD700", 1.2);
          }

          break;
        }
      }
    }

    // 5. Seguimiento suave de cámara vertical
    const targetCameraY = this.playerY - this.height * 0.52;
    if (targetCameraY < this.cameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * Math.min(1, dt * 10);
    }

    // 6. Registro de altitud máxima y puntos por escalada
    const currentAltitude = Math.max(0, Math.floor(-this.playerY / 12));
    if (currentAltitude > this.maxAltitudeReached) {
      const diff = currentAltitude - this.maxAltitudeReached;
      this.score += diff * 2;
      this.maxAltitudeReached = currentAltitude;
    }

    // 7. Generación continua de plataformas superiores
    while (this.highestPlatformY > this.cameraY - 200) {
      this.highestPlatformY -= 75 + Math.random() * 25;
      this.generatePlatformAt(this.highestPlatformY);
    }

    // 8. Limpieza de plataformas inferiores fuera de pantalla
    const cleanupY = this.cameraY + this.height + 120;
    this.platforms = this.platforms.filter((p) => p.y < cleanupY);

    // 9. Caída por el fondo (red elástica de rescate)
    if (this.playerY > this.cameraY + this.height + 60) {
      this.handlePlayerFall();
    }
  }

  /**
   * Activa el Cohete Mágico de Patrocinador
   */
  private triggerRocketBoost(sponsorName: string): void {
    this.isRocketActive = true;
    this.rocketTimer = 2.8; // 2.8s de ascenso supersónico
    this.audio.playPowerUp();
    this.triggerShake(0.2, 5);
    this.particles.emitConfetti(this.width, 35);
    this.addFloatingText(`★ ¡COHETE ${sponsorName.toUpperCase()}! ★`, this.width * 0.5, this.height * 0.35, "#FFD700", 1.6);
  }

  /**
   * Trampolín de rescate cuando el elfo cae por la base
   */
  private handlePlayerFall(): void {
    this.combo = 0;
    this.audio.playElfHit();
    this.triggerShake(0.18, 5);

    // Impulsar hacia arriba con cama elástica mágica
    this.playerVy = this.normalJumpSpeed * 1.15;
    this.playerY = this.cameraY + this.height * 0.85;

    // Crear una plataforma de emergencia justo debajo
    this.platforms.push({
      x: Math.max(20, this.playerX - 60),
      y: this.playerY + 20,
      w: 120,
      h: 18,
      type: "normal",
      moveDir: 0,
      moveSpeed: 0,
      minX: 0,
      maxX: this.width,
      broken: false
    });

    this.particles.emitBurst(this.playerX, this.playerY, "#FF9100", 12);
    this.addFloatingText("¡TRAMPOLÍN DE RESCATE!", this.width * 0.5, this.height * 0.6, "#FFD700", 1.3);
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS (Stylized 2D Game Concept Art)
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo invernal con auroras boreales
    this.drawBackground(ctx);

    ctx.save();
    // Desplazamiento de la cámara vertical
    ctx.translate(0, -this.cameraY);

    // 2. Dibujar plataformas y coleccionables
    this.drawPlatforms(ctx);

    // 3. Dibujar al Elfo Navideño
    this.drawPlayer(ctx);

    ctx.restore();

    // 4. Partículas en pantalla
    this.particles.draw(ctx, true);

    // 5. Botones táctiles inferiores y HUD de altura
    this.drawTouchButtonsAndHUD(ctx);
  }

  /**
   * Fondo con cielo crepuscular y nieve suave
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
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

    // Suave viñeta cálida en los bordes
    const vignette = ctx.createLinearGradient(0, 0, 0, this.height);
    vignette.addColorStop(0, "rgba(10, 20, 45, 0.45)");
    vignette.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(15, 30, 60, 0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Dibuja todas las plataformas en el mundo
   */
  private drawPlatforms(ctx: CanvasRenderingContext2D): void {
    this.platforms.forEach((plat) => {
      if (plat.broken) return;

      ctx.save();

      if (plat.type === "sponsor") {
        // Plataforma dorada de patrocinador
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#FFF8E1";
        ctx.lineWidth = 2.5;
        this.roundRect(ctx, plat.x, plat.y, plat.w, plat.h, 8);
        ctx.fill();
        ctx.stroke();

        // Nieve en la parte superior
        ctx.fillStyle = "#FFFFFF";
        this.roundRect(ctx, plat.x + 2, plat.y - 3, plat.w - 4, 6, 3);
        ctx.fill();

        // Medallón con logo
        if (plat.sponsorLogo && plat.sponsorLogo.complete) {
          const logoSize = plat.h * 1.5;
          const logoX = plat.x + (plat.w - logoSize) / 2;
          const logoY = plat.y - logoSize - 2;

          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.drawImage(plat.sponsorLogo, logoX, logoY, logoSize, logoSize);
        }
      } else if (plat.type === "fragile") {
        // Plataforma de hielo cristalino
        ctx.fillStyle = "rgba(129, 212, 250, 0.75)";
        ctx.strokeStyle = "#E1F5FE";
        ctx.lineWidth = 2;
        this.roundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.stroke();

        // Grietas decorativas de hielo
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plat.x + plat.w * 0.3, plat.y + 2);
        ctx.lineTo(plat.x + plat.w * 0.5, plat.y + plat.h - 2);
        ctx.moveTo(plat.x + plat.w * 0.6, plat.y + 2);
        ctx.lineTo(plat.x + plat.w * 0.75, plat.y + plat.h - 3);
        ctx.stroke();
      } else if (plat.type === "spring") {
        // Plataforma normal con resorte de caramelo
        ctx.fillStyle = "#4E342E";
        ctx.strokeStyle = "#8D6E63";
        ctx.lineWidth = 2;
        this.roundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.stroke();

        // Manto de nieve
        ctx.fillStyle = "#FFFFFF";
        this.roundRect(ctx, plat.x + 2, plat.y - 3, plat.w - 4, 6, 3);
        ctx.fill();

        // Resorte de caramelo en el centro
        const springX = plat.x + plat.w * 0.5;
        const springY = plat.y - 8;
        ctx.strokeStyle = "#D50000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(springX, springY, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(springX, springY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Madera rústica pulida (normal o móvil)
        ctx.fillStyle = plat.type === "moving" ? "#1B5E20" : "#5D4037";
        ctx.strokeStyle = "#8D6E63";
        ctx.lineWidth = 2;
        this.roundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.stroke();

        // Manto suave de nieve
        ctx.fillStyle = "#FFFFFF";
        this.roundRect(ctx, plat.x + 2, plat.y - 4, plat.w - 4, 7, 3);
        ctx.fill();
      }

      // Regalo o Estrella sobre la plataforma
      if (plat.hasItem && !plat.itemCollected && plat.type !== "sponsor") {
        const itemX = plat.x + plat.w * 0.5;
        const itemY = plat.y - 14 + Math.sin(this.animTimer * 4) * 3;

        if (plat.hasItem === "star") {
          const itemSize = 24;
          if (this.spriteStar && this.spriteStar.complete && this.spriteStar.naturalWidth > 0) {
            ctx.drawImage(this.spriteStar, itemX - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize);
          } else {
            ctx.fillStyle = "#FFD700";
            ctx.font = "900 16px 'Fredoka', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("★", itemX, itemY);
          }
        } else {
          const itemSize = 22;
          if (this.spriteGift && this.spriteGift.complete && this.spriteGift.naturalWidth > 0) {
            ctx.drawImage(this.spriteGift, itemX - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize);
          } else {
            ctx.fillStyle = "#FF1744";
            ctx.beginPath();
            ctx.arc(itemX, itemY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    });
  }

  /**
   * Dibuja al personaje (Elfo Navideño)
   */
  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.playerX, this.playerY);

    if (!this.playerFacingRight) {
      ctx.scale(-1, 1);
    }

    const w = this.playerW;
    const h = this.playerH;

    // Si tiene cohete activo, dibujar llama propulsora
    if (this.isRocketActive) {
      ctx.fillStyle = "#FF9100";
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, h * 0.45);
      ctx.lineTo(w * 0.2, h * 0.45);
      ctx.lineTo(0, h * 0.85 + Math.random() * 8);
      ctx.closePath();
      ctx.fill();

      // Mochila cohete en la espalda
      ctx.fillStyle = "#D50000";
      this.roundRect(ctx, -w * 0.42, -h * 0.2, w * 0.25, h * 0.5, 4);
      ctx.fill();
    }

    // 1. Cuerpo del elfo (Traje verde navideño)
    ctx.fillStyle = "#2E7D32";
    this.roundRect(ctx, -w * 0.35, -h * 0.1, w * 0.7, h * 0.48, 8);
    ctx.fill();

    // Cinturón negro con hebilla dorada
    ctx.fillStyle = "#212121";
    ctx.fillRect(-w * 0.35, h * 0.14, w * 0.7, 5);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-w * 0.12, h * 0.12, w * 0.24, 9);

    // 2. Cabeza del elfo
    ctx.fillStyle = "#FFE0B2";
    ctx.beginPath();
    ctx.arc(0, -h * 0.22, w * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Oreja puntiaguda
    ctx.fillStyle = "#FFE0B2";
    ctx.beginPath();
    ctx.moveTo(w * 0.24, -h * 0.24);
    ctx.lineTo(w * 0.42, -h * 0.3);
    ctx.lineTo(w * 0.26, -h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Ojos y sonrisa
    ctx.fillStyle = "#3E2723";
    ctx.beginPath();
    ctx.arc(w * 0.08, -h * 0.23, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mejillas sonrosadas
    ctx.fillStyle = "rgba(255, 112, 67, 0.65)";
    ctx.beginPath();
    ctx.arc(w * 0.12, -h * 0.18, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Gorro festivo rojo con pompón blanco
    ctx.fillStyle = "#D50000";
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.28);
    ctx.lineTo(w * 0.3, -h * 0.28);
    ctx.quadraticCurveTo(0, -h * 0.7, -w * 0.35, -h * 0.6);
    ctx.closePath();
    ctx.fill();

    // Banda blanca del gorro
    ctx.fillStyle = "#FFFFFF";
    this.roundRect(ctx, -w * 0.34, -h * 0.32, w * 0.68, 6, 3);
    ctx.fill();

    // Pompón
    ctx.beginPath();
    ctx.arc(-w * 0.35, -h * 0.6, 5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Botitas con resorte
    ctx.fillStyle = "#C62828";
    this.roundRect(ctx, -w * 0.28, h * 0.38, w * 0.25, 10, 4);
    this.roundRect(ctx, w * 0.04, h * 0.38, w * 0.25, 10, 4);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dibuja los botones táctiles y el HUD de altura
   */
  private drawTouchButtonsAndHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Botón Izquierda
    const btnL = this.btnLeftRect;
    ctx.fillStyle = this.isMovingLeft ? "#00C853" : "rgba(30, 45, 75, 0.92)";
    ctx.strokeStyle = this.isMovingLeft ? "#69F0AE" : "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, btnL.x, btnL.y, btnL.w, btnL.h, 14);
    ctx.fill();
    ctx.stroke();

    if (this.spriteArrowLeft && this.spriteArrowLeft.complete && this.spriteArrowLeft.naturalWidth > 0) {
      ctx.drawImage(this.spriteArrowLeft, btnL.x + 8, btnL.y + (btnL.h - 18) / 2, 18, 18);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 12px 'Fredoka', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("IZQUIERDA", btnL.x + 30, btnL.y + btnL.h / 2);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 13px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("◀ IZQUIERDA", btnL.x + btnL.w / 2, btnL.y + btnL.h / 2);
    }

    // 2. Botón Derecha
    const btnR = this.btnRightRect;
    ctx.fillStyle = this.isMovingRight ? "#00C853" : "rgba(30, 45, 75, 0.92)";
    ctx.strokeStyle = this.isMovingRight ? "#69F0AE" : "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, btnR.x, btnR.y, btnR.w, btnR.h, 14);
    ctx.fill();
    ctx.stroke();

    if (this.spriteArrowRight && this.spriteArrowRight.complete && this.spriteArrowRight.naturalWidth > 0) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 12px 'Fredoka', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("DERECHA", btnR.x + btnR.w - 30, btnR.y + btnR.h / 2);
      ctx.drawImage(this.spriteArrowRight, btnR.x + btnR.w - 26, btnR.y + (btnR.h - 18) / 2, 18, 18);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 13px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DERECHA ▶", btnR.x + btnR.w / 2, btnR.y + btnR.h / 2);
    }

    // 3. Indicador de Altura
    const altW = 140;
    const altH = 26;
    const altX = (this.width - altW) / 2;
    const altY = 72;

    ctx.fillStyle = "rgba(10, 22, 45, 0.9)";
    ctx.strokeStyle = this.isRocketActive ? "#00E5FF" : "#FFD700";
    ctx.lineWidth = 2;
    this.roundRect(ctx, altX, altY, altW, altH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.isRocketActive ? "#00E5FF" : "#FFD700";
    ctx.font = "900 12px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ALTURA: ${this.maxAltitudeReached}m`, this.width / 2, altY + altH / 2);

    // 4. Indicador de Combo
    if (this.combo >= 2) {
      const comboW = 100;
      const comboX = this.width - comboW - 16;
      const comboY = 72;

      ctx.fillStyle = "rgba(10, 22, 45, 0.9)";
      ctx.strokeStyle = "#FF9100";
      ctx.lineWidth = 2;
      this.roundRect(ctx, comboX, comboY, comboW, 26, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FF9100";
      ctx.font = "900 12px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`¡COMBO x${this.combo}!`, comboX + comboW / 2, comboY + 13);
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
