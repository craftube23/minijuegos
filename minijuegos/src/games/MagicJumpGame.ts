/**
 * ==============================================================================
 * JUEGO: ¡SALTO MÁGICO NAVIDEÑO! (Christmas Magic Jump)
 * ==============================================================================
 *
 * Minijuego arcade vertical estilo Doodle Jump / Icy Tower con estética:
 * - Stylized 2D Game Art / Fantasy Game Concept Art (Supercell / Disney Klaus).
 * - Sprite oficial de alta definición del Elfo Saltador con botas de resorte.
 * - Plataformas temáticas de Concept Art:
 *     * Plataforma Tronco Nevada (madera tallada, lazo de bastón de caramelo y nieve)
 *     * Plataforma Hielo Cristalino (cristal de hielo traslúcido con estalactitas que se quiebra)
 *     * Plataforma Dorada Festiva (pedestal barroco de oro puro con cojín de terciopelo)
 *     * Plataformas con resorte de bastón de caramelo para Súper Saltos
 * - Scroll vertical con transición visual:
 *     * Base: Aldea navideña con chalets iluminados
 *     * Ascenso: Bosque nevado, auroras boreales ondulantes, luna llena y cielo estrellado
 * - Física fluida de squash & stretch, colisión continua, propulsor cohete y trampolín de rescate.
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
  breakY?: number;
  breakAlpha?: number;
  squishTimer?: number;
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
  hasItem?: "gift" | "star" | "rocket";
  itemCollected?: boolean;
}

interface TwinkleStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  parallaxFactor: number;
}

export class MagicJumpGame extends BaseGame {
  // Fondos y Logos
  private bgImage: HTMLImageElement;
  private fairLogo: HTMLImageElement;
  private sponsorLogos: { name: string; logo: HTMLImageElement }[] = [];

  // Sprites Stylized 2D Game Concept Art
  private spritePlayer: HTMLImageElement;
  private spritePlatTronco: HTMLImageElement;
  private spritePlatHielo: HTMLImageElement;
  private spritePlatDorada: HTMLImageElement;
  private spriteCandyCane: HTMLImageElement;
  private spriteStar: HTMLImageElement;
  private spriteGift: HTMLImageElement;
  private spriteArrowLeft: HTMLImageElement;
  private spriteArrowRight: HTMLImageElement;

  // Personaje (Elfo Saltador)
  private playerX: number = 0;
  private playerY: number = 0;
  private playerVx: number = 0;
  private playerVy: number = 0;
  private playerW: number = 68;
  private playerH: number = 82;
  private playerFacingRight: boolean = true;
  private squashTimer: number = 0;
  private isRocketActive: boolean = false;
  private rocketTimer: number = 0;

  // Físicas del salto
  private readonly gravity: number = 980;
  private readonly normalJumpSpeed: number = -640;
  private readonly springJumpSpeed: number = -1080;
  private readonly rocketSpeed: number = -1250;

  // Cámara vertical y progresión
  private cameraY: number = 0;
  private maxAltitudeReached: number = 0;

  // Plataformas
  private platforms: JumpPlatform[] = [];
  private highestPlatformY: number = 0;

  // Estrellas de fondo procedimentales
  private skyStars: TwinkleStar[] = [];

  // Combos
  private combo: number = 0;
  private maxCombo: number = 0;

  // Entrada
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private isPointerActive: boolean = false;
  private targetPlayerX: number | null = null;

  // Botones táctiles inferiores para pantalla táctil / tótem
  private btnLeftRect = { x: 0, y: 0, w: 120, h: 52 };
  private btnRightRect = { x: 0, y: 0, w: 120, h: 52 };

  // Animaciones y tiempo
  private animTimer: number = 0;

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

    // Fondos y logos
    this.bgImage = this.loadImage("./assets/images/fondo-nieve.webp");
    this.fairLogo = this.loadImage("./assets/logos/clean-feria-magica.png");

    this.sponsorLogos = [
      { name: "Campuslands", logo: this.loadImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.loadImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.loadImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.fairLogo }
    ];

    // Carga de sprites Stylized 2D Game Concept Art
    this.spritePlayer = this.getImage("./assets/images/elfo-saltador.png");
    this.spritePlatTronco = this.getImage("./assets/images/plataforma-tronco.png");
    this.spritePlatHielo = this.getImage("./assets/images/plataforma-hielo.png");
    this.spritePlatDorada = this.getImage("./assets/images/plataforma-dorada.png");
    this.spriteCandyCane = this.getImage("./assets/images/baston-caramelo.png");
    this.spriteStar = this.getImage("./assets/images/estrella con logo.png");
    this.spriteGift = this.getImage("./assets/images/regalo-estilizado-rojo.png");
    this.spriteArrowLeft = this.getImage("./assets/images/flecha-izq.png");
    this.spriteArrowRight = this.getImage("./assets/images/flecha-der.png");

    this.initSkyStars();
    this.computeGameLayout();
  }

  private loadImage(src: string): HTMLImageElement {
    return this.getImage(src);
  }

  private initSkyStars(): void {
    this.skyStars = [];
    const count = 55;
    for (let i = 0; i < count; i++) {
      this.skyStars.push({
        x: Math.random(),
        y: Math.random(),
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1.5 + Math.random() * 3,
        parallaxFactor: 0.1 + Math.random() * 0.2
      });
    }
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.maxAltitudeReached = 0;
    this.isRocketActive = false;
    this.rocketTimer = 0;
    this.squashTimer = 0;
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
    this.input.onPointerDown = (_pointerId: number, x: number, y: number) => {
      this.isPointerActive = true;
      this.handlePointerInput(x, y);
    };

    this.input.onPointerMove = (_pointerId: number, x: number, y: number) => {
      if (this.isPointerActive) {
        this.handlePointerInput(x, y);
      }
    };

    this.input.onPointerUp = (_pointerId: number, _x: number, _y: number) => {
      this.isPointerActive = false;
      this.isMovingLeft = false;
      this.isMovingRight = false;
      this.targetPlayerX = null;
    };

    // Soporte para teclado (flechas o A/D)
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.addFloatingText("¡SALTA HACIA LAS ESTRELLAS!", this.width * 0.5, this.height * 0.38, "#FFD700", 1.5);
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

    // Dimensiones proporcionales del Elfo Saltador HD
    this.playerW = Math.max(54, Math.min(84, Math.round(w * 0.075)));
    this.playerH = Math.round(this.playerW * 1.21);

    // Botones táctiles inferiores para kiosco táctil y móviles
    const btnW = Math.min(160, Math.max(108, Math.round(w * 0.25)));
    const btnH = Math.max(48, Math.min(62, Math.round(h * 0.055)));
    const btnY = Math.min(h - btnH - 12, h * 0.91);

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

    // Plataforma base inicial sólida y generosa
    const baseW = Math.max(220, Math.min(420, Math.round(w * 0.38)));
    const baseH = Math.round(baseW * 0.28);
    this.platforms.push({
      x: (w - baseW) / 2,
      y: h * 0.78,
      w: baseW,
      h: baseH,
      type: "normal",
      moveDir: 0,
      moveSpeed: 0,
      minX: 0,
      maxX: w,
      broken: false,
      squishTimer: 0
    });

    // Generar plataformas hacia arriba con ritmo continuo y denso
    let curY = h * 0.78 - 95;
    this.highestPlatformY = curY;

    for (let i = 0; i < 14; i++) {
      this.generatePlatformTier(curY);
      curY -= 95 + Math.random() * 25;
      this.highestPlatformY = curY;
    }
  }

  /**
   * Genera plataformas equilibradas en una altura Y específica garantizando rutas alcanzables y sin vacíos
   */
  private generatePlatformTier(y: number): void {
    const w = this.width > 0 ? this.width : 800;

    // Pocas plataformas por nivel para mantener el juego limpio y legible:
    // anchas -> 2 de 3 carriles; medianas -> 1 (a veces 2); móviles -> 1
    const numLanes = w >= 1050 ? 3 : (w >= 650 ? 2 : 1);
    const platW = Math.max(105, Math.min(195, Math.round(w * (w >= 1050 ? 0.125 : 0.22))));
    const platH = Math.round(platW * 0.28);
    const laneWidth = w / numLanes;

    const laneOrder: number[] = [];
    for (let l = 0; l < numLanes; l++) laneOrder.push(l);
    laneOrder.sort(() => Math.random() - 0.5);
    const count = numLanes >= 3 ? 2 : (numLanes === 2 ? (Math.random() < 0.35 ? 2 : 1) : 1);
    const chosenLanes = laneOrder.slice(0, count);

    let hasSolidPlatform = false;

    for (let idx = 0; idx < chosenLanes.length; idx++) {
      const lane = chosenLanes[idx];
      const laneMinX = lane * laneWidth + 18;
      const laneMaxX = (lane + 1) * laneWidth - platW - 18;
      const platX = Math.max(laneMinX, Math.min(laneMaxX, laneMinX + Math.random() * Math.max(0, laneMaxX - laneMinX)));

      // La segunda plataforma se desfasa en altura para no formar filas rígidas
      const platY = y + (idx === 0 ? (Math.random() - 0.5) * 10 : 26 + Math.random() * 20);

      // La primera plataforma del nivel nunca es móvil ni frágil: garantiza una ruta segura
      const rand = idx === 0 ? 0.30 + Math.random() * 0.70 : Math.random();
      let type: JumpPlatform["type"] = "normal";
      let moveSpeed = 0;
      let minX = platX;
      let maxX = platX;
      let sponsorName: string | undefined = undefined;
      let sponsorLogo: HTMLImageElement | undefined = undefined;
      let hasItem: JumpPlatform["hasItem"] = undefined;

      if (rand < 0.14) {
        // Plataforma móvil: minX/maxX son límites del borde IZQUIERDO (patrulla local)
        type = "moving";
        moveSpeed = 70 + Math.random() * 40;
        const patrolSpan = Math.min(120, laneWidth * 0.35);
        minX = Math.max(16, platX - patrolSpan * 0.5);
        maxX = Math.max(minX, Math.min(w - platW - 16, platX + patrolSpan * 0.5));
      } else if (rand < 0.30 && hasSolidPlatform) {
        // Hielo quebradizo (solo si ya hay una sólida en este nivel para no bloquear al jugador)
        type = "fragile";
      } else if (rand < 0.38) {
        // Súper resorte de bastón de caramelo
        type = "spring";
        hasSolidPlatform = true;
      } else if (rand < 0.44 && this.sponsorLogos.length > 0) {
        // Cohete mágico de patrocinador
        type = "sponsor";
        const sp = this.sponsorLogos[Math.floor(Math.random() * this.sponsorLogos.length)];
        sponsorName = sp.name;
        sponsorLogo = sp.logo;
        hasItem = "rocket";
        hasSolidPlatform = true;
      } else {
        type = "normal";
        hasSolidPlatform = true;
        if (Math.random() < 0.38) {
          hasItem = Math.random() < 0.55 ? "gift" : "star";
        }
      }

      const platform: JumpPlatform = {
        x: platX,
        y: platY,
        w: platW,
        h: platH,
        type,
        moveDir: Math.random() < 0.5 ? 1 : -1,
        moveSpeed,
        minX,
        maxX,
        broken: false,
        squishTimer: 0,
        sponsorName,
        sponsorLogo,
        hasItem,
        itemCollected: false
      };

      this.platforms.push(platform);
    }
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

  private handlePointerInput(screenX: number, screenY?: number): void {
    if (!this.isRunning || this.isGameOver) return;

    // 1. Si se proporciona screenY, comprobar primero si el toque impacta los botones inferiores
    if (typeof screenY === "number") {
      const touchMargin = 16;
      const isLeft = (
        screenX >= this.btnLeftRect.x - touchMargin &&
        screenX <= this.btnLeftRect.x + this.btnLeftRect.w + touchMargin &&
        screenY >= this.btnLeftRect.y - touchMargin &&
        screenY <= this.btnLeftRect.y + this.btnLeftRect.h + touchMargin
      );
      if (isLeft) {
        this.isMovingLeft = true;
        this.isMovingRight = false;
        this.targetPlayerX = null;
        return;
      }

      const isRight = (
        screenX >= this.btnRightRect.x - touchMargin &&
        screenX <= this.btnRightRect.x + this.btnRightRect.w + touchMargin &&
        screenY >= this.btnRightRect.y - touchMargin &&
        screenY <= this.btnRightRect.y + this.btnRightRect.h + touchMargin
      );
      if (isRight) {
        this.isMovingRight = true;
        this.isMovingLeft = false;
        this.targetPlayerX = null;
        return;
      }
    }

    // 2. Si el jugador toca o arrastra en cualquier otra zona del canvas,
    // el elfo persigue directamente la posición X del puntero/dedo con fluidez
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.targetPlayerX = screenX;
  }

  // ==========================================================================
  // ACTUALIZACIÓN DE FÍSICAS A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animTimer += dt;

    if (this.squashTimer > 0) {
      this.squashTimer -= dt;
    }

    // 1. Control de propulsor cohete
    if (this.isRocketActive) {
      this.rocketTimer -= dt;
      this.playerVy = this.rocketSpeed;

      // Estela de chispas doradas y humo festivo
      this.particles.emitBurst(this.playerX, this.playerY + this.playerH * 0.45, "#FFD700", 3);
      this.particles.emitBurst(this.playerX, this.playerY + this.playerH * 0.5, "#FF9100", 2);

      if (this.rocketTimer <= 0) {
        this.isRocketActive = false;
        this.playerVy = this.normalJumpSpeed * 0.85;
      }
    } else {
      // Gravedad normal
      this.playerVy += this.gravity * dt;
    }

    // 2. Movimiento horizontal ágil y reactivo
    const maxHorizontalSpeed = 440;
    const accel = 2200;

    if (this.targetPlayerX !== null) {
      let dx = this.targetPlayerX - this.playerX;
      if (dx > this.width * 0.5) {
        dx -= this.width;
      } else if (dx < -this.width * 0.5) {
        dx += this.width;
      }

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
      this.playerVx *= 0.88;
    }

    this.playerX += this.playerVx * dt;
    this.playerY += this.playerVy * dt;

    // Envoltura horizontal de pantalla (wrap-around Doodle Jump)
    if (this.playerX < -this.playerW * 0.5) {
      this.playerX = this.width + this.playerW * 0.5;
    } else if (this.playerX > this.width + this.playerW * 0.5) {
      this.playerX = -this.playerW * 0.5;
    }

    // 3. Movimiento de plataformas y temporizador de squish
    this.platforms.forEach((plat) => {
      if (plat.squishTimer && plat.squishTimer > 0) {
        plat.squishTimer -= dt;
      }

      if (plat.type === "moving") {
        plat.x += plat.moveDir * plat.moveSpeed * dt;
        if (plat.x <= plat.minX) {
          plat.x = plat.minX;
          plat.moveDir = 1;
        } else if (plat.x >= plat.maxX) {
          plat.x = plat.maxX;
          plat.moveDir = -1;
        }
      }

      // Animación de quiebre de hielo frágil
      if (plat.broken) {
        if (plat.breakY === undefined) plat.breakY = plat.y;
        if (plat.breakAlpha === undefined) plat.breakAlpha = 1;
        plat.breakY += 180 * dt;
        plat.breakAlpha = Math.max(0, plat.breakAlpha - dt * 2.2);
      }
    });

    // 4. Colisiones con plataformas (sólo cuando desciende: playerVy > 0)
    if (this.playerVy > 0 && !this.isRocketActive) {
      const feetY = this.playerY + this.playerH * 0.48;
      const prevFeetY = feetY - this.playerVy * dt;

      for (let i = 0; i < this.platforms.length; i++) {
        const plat = this.platforms[i];
        if (plat.broken) continue;

        // Superficie de contacto (tercio superior de la plataforma)
        const platSurfaceY = plat.y + 4;
        const platSurfaceDepth = Math.max(14, plat.h * 0.35);

        if (
          feetY >= platSurfaceY &&
          prevFeetY <= platSurfaceY + platSurfaceDepth &&
          this.playerX + this.playerW * 0.32 >= plat.x &&
          this.playerX - this.playerW * 0.32 <= plat.x + plat.w
        ) {
          // ¡Aterrizaje y rebote instantáneo!
          this.playerY = platSurfaceY - this.playerH * 0.48;
          this.squashTimer = 0.22;
          plat.squishTimer = 0.18;

          if (plat.type === "spring") {
            // Súper rebote con resorte de caramelo
            this.playerVy = this.springJumpSpeed;
            this.combo += 2;
            this.audio.playCatchItem(1.4);
            this.triggerShake(0.14, 4);
            this.particles.emitBurst(this.playerX, plat.y, "#FF1744", 16);
            this.particles.emitBurst(this.playerX, plat.y, "#FFD700", 10);
            this.addFloatingText("¡SÚPER SALTO! +150", this.playerX, plat.y - 24, "#FFD700", 1.3);
            this.score += 150;
          } else if (plat.type === "fragile") {
            // Hielo quebradizo
            plat.broken = true;
            this.playerVy = this.normalJumpSpeed;
            this.combo++;
            this.audio.playElfHit();
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y + 10, "#81D4FA", 14);
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y + 10, "#E1F5FE", 8);
            this.score += 50;
          } else if (plat.type === "sponsor") {
            // Patrocinador oficial: activa Cohete Propulsor
            this.playerVy = this.normalJumpSpeed;
            this.combo += 3;
            plat.itemCollected = true;
            this.triggerRocketBoost(plat.sponsorName || "OFICIAL");
          } else {
            // Plataforma normal o móvil
            this.playerVy = this.normalJumpSpeed;
            this.combo++;
            this.audio.playCatchItem(1.0 + (this.combo % 6) * 0.05);
            this.particles.emitBurst(this.playerX, plat.y + 8, "#FFFFFF", 6);
            this.score += 25;
          }

          if (this.combo > this.maxCombo) this.maxCombo = this.combo;

          // Recoger coleccionables sobre la plataforma
          if (plat.hasItem && !plat.itemCollected) {
            plat.itemCollected = true;
            const pts = plat.hasItem === "star" ? 250 : 100;
            this.score += pts;
            this.audio.playElfCollectItem();
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y - 16, "#FFD700", 12);
            this.addFloatingText(`+${pts}`, plat.x + plat.w * 0.5, plat.y - 28, "#FFD700", 1.25);
          }

          break;
        }
      }
    }

    // 5. Seguimiento suave de cámara vertical hacia arriba
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

    // 7. Generación continua de plataformas superiores sin vacíos
    while (this.highestPlatformY > this.cameraY - 240) {
      this.highestPlatformY -= 95 + Math.random() * 25;
      this.generatePlatformTier(this.highestPlatformY);
    }

    // 8. Limpieza de plataformas inferiores fuera de pantalla
    const cleanupY = this.cameraY + this.height + 140;
    this.platforms = this.platforms.filter((p) => p.y < cleanupY);

    // 9. Caída por el fondo (red elástica mágica de rescate)
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
    this.audio.playWhoosh();
    this.triggerShake(0.18, 5);

    // Impulsar hacia arriba con cama elástica mágica potente
    this.playerVy = this.normalJumpSpeed * 1.25;
    this.playerY = this.cameraY + this.height * 0.82;

    // Crear una plataforma de emergencia ancha justo debajo
    const emergencyW = Math.max(180, Math.min(320, this.width * 0.35));
    this.platforms.push({
      x: Math.max(16, Math.min(this.width - emergencyW - 16, this.playerX - emergencyW * 0.5)),
      y: this.playerY + 28,
      w: emergencyW,
      h: Math.round(emergencyW * 0.28),
      type: "normal",
      moveDir: 0,
      moveSpeed: 0,
      minX: 0,
      maxX: this.width,
      broken: false,
      squishTimer: 0.2
    });

    // Generar inmediatamente un peldaño con resorte encima para recuperar altura sin esperar
    const springPlatW = 130;
    this.platforms.push({
      x: Math.max(20, Math.min(this.width - springPlatW - 20, this.playerX - springPlatW * 0.5)),
      y: this.playerY - 88,
      w: springPlatW,
      h: Math.round(springPlatW * 0.28),
      type: "spring",
      moveDir: 0,
      moveSpeed: 0,
      minX: 0,
      maxX: this.width,
      broken: false,
      squishTimer: 0
    });

    this.particles.emitBurst(this.playerX, this.playerY, "#FF9100", 12);
    this.addFloatingText("¡TRAMPOLÍN DE RESCATE!", this.width * 0.5, this.height * 0.58, "#FFD700", 1.3);
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS (Stylized 2D Game Concept Art)
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo dinámico según altitud con scroll parallax
    this.drawBackground(ctx);

    ctx.save();
    // Desplazamiento de la cámara vertical
    ctx.translate(0, -this.cameraY);

    // 2. Dibujar plataformas temáticas y coleccionables
    this.drawPlatforms(ctx);

    // 3. Dibujar al Elfo Saltador Stylized 2D
    this.drawPlayer(ctx);

    ctx.restore();

    // 4. Partículas en pantalla
    this.particles.draw(ctx, true);

    // 5. Botones táctiles inferiores y HUD de altura
    this.drawTouchButtonsAndHUD(ctx);
  }

  /**
   * Fondo con cielo crepuscular y scroll parallax vertical
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    // Gradiente dinámico de cielo (oscurece al ascender al espacio)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    const altRatio = Math.min(1, Math.max(0, -this.cameraY / 3200));

    const topColor = altRatio > 0.5 ? "#020617" : "#071329";
    const midColor = altRatio > 0.5 ? "#0B192C" : "#0F284E";
    const botColor = altRatio > 0.5 ? "#1E1B4B" : "#1E3A8A";

    skyGrad.addColorStop(0, topColor);
    skyGrad.addColorStop(0.55, midColor);
    skyGrad.addColorStop(1, botColor);

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Estrellas parpadeantes procedimentales
    ctx.save();
    this.skyStars.forEach((star) => {
      const starX = star.x * w;
      // Scroll parallax vertical de estrellas
      const starY = ((star.y * h * 2 - this.cameraY * star.parallaxFactor) % h + h) % h;
      const twinkle = Math.sin(this.animTimer * star.twinkleSpeed + star.x * 10);
      const alpha = Math.max(0.15, Math.min(1, star.alpha + twinkle * 0.25));

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Aurora Boreal ondulante mágica
    const auroraAlpha = 0.24 + Math.sin(this.animTimer * 1.2) * 0.08;
    const auroraGrad = ctx.createLinearGradient(0, h * 0.08, w, h * 0.38);
    auroraGrad.addColorStop(0, `rgba(0, 229, 255, ${auroraAlpha * 0.5})`);
    auroraGrad.addColorStop(0.5, `rgba(0, 230, 118, ${auroraAlpha})`);
    auroraGrad.addColorStop(1, `rgba(186, 104, 200, ${auroraAlpha * 0.45})`);

    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.16 + Math.sin(this.animTimer * 0.8) * 18);
    ctx.bezierCurveTo(
      w * 0.35, h * 0.08 + Math.cos(this.animTimer * 0.6) * 22,
      w * 0.7, h * 0.26 + Math.sin(this.animTimer * 0.7) * 18,
      w, h * 0.14 + Math.cos(this.animTimer * 0.5) * 16
    );
    ctx.lineTo(w, h * 0.42);
    ctx.lineTo(0, h * 0.42);
    ctx.closePath();
    ctx.fill();

    // Luna llena resplandeciente
    const moonX = w * 0.82;
    const moonY = h * 0.12 - (this.cameraY * 0.04);
    if (moonY > -80 && moonY < h + 80) {
      ctx.save();
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 14, moonX, moonY, 68);
      moonGlow.addColorStop(0, "rgba(255, 254, 230, 0.45)");
      moonGlow.addColorStop(1, "rgba(255, 254, 230, 0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 68, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFDE7";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Aldea navideña en la base con scroll parallax (desciende al subir)
    if (this.bgImage && this.bgImage.complete) {
      const bgW = w;
      const bgH = Math.max(h, (w * 1080) / 1920);
      const parallaxFactor = 0.45;
      const villageY = (h - bgH) - (this.cameraY * parallaxFactor);

      if (villageY < h) {
        ctx.save();
        const fadeAlpha = Math.max(0.15, 1 - (-this.cameraY / 1900));
        ctx.globalAlpha = fadeAlpha;
        ctx.drawImage(this.bgImage, 0, villageY, bgW, bgH);
        ctx.restore();
      }
    }

    // Viñeta cálida suave
    const vignette = ctx.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, "rgba(8, 16, 36, 0.3)");
    vignette.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(10, 22, 48, 0.45)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Dibuja todas las plataformas estilizadas en el mundo
   */
  private drawPlatforms(ctx: CanvasRenderingContext2D): void {
    const time = this.animTimer;

    this.platforms.forEach((plat) => {
      ctx.save();

      // Efecto squish al rebotar
      const dipY = plat.squishTimer && plat.squishTimer > 0 ? (plat.squishTimer / 0.18) * 6 : 0;
      let drawY = plat.y + dipY;

      // Si está rota (hielo quebrado en caída)
      if (plat.broken) {
        if (plat.breakAlpha !== undefined && plat.breakAlpha <= 0) {
          ctx.restore();
          return;
        }
        ctx.globalAlpha = plat.breakAlpha || 0.8;
        drawY = plat.breakY || plat.y;
      }

      if (plat.type === "sponsor") {
        // Plataforma Dorada de Patrocinador Oficial (plataforma-dorada.png)
        if (this.spritePlatDorada && this.spritePlatDorada.complete && this.spritePlatDorada.naturalWidth > 0) {
          ctx.drawImage(this.spritePlatDorada, plat.x, drawY - plat.h * 0.15, plat.w, plat.h * 1.3);
        } else {
          ctx.fillStyle = "#FFD700";
          this.roundRect(ctx, plat.x, drawY, plat.w, plat.h, 8);
          ctx.fill();
        }

        // Medallón dorado flotante con el logo oficial del patrocinador
        if (plat.sponsorLogo && plat.sponsorLogo.complete && plat.sponsorLogo.naturalWidth > 0) {
          const emblemSize = Math.max(34, Math.min(54, plat.h * 1.25));
          const emblemX = plat.x + (plat.w - emblemSize) / 2;
          const floatBob = Math.sin(time * 3 + plat.x) * 4;
          const emblemY = drawY - emblemSize - 8 + floatBob;

          // Resplandor del medallón
          ctx.save();
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 12;
          ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
          ctx.beginPath();
          ctx.arc(emblemX + emblemSize * 0.5, emblemY + emblemSize * 0.5, emblemSize * 0.56, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();

          // Logo corporativo centrado
          ctx.drawImage(
            plat.sponsorLogo,
            emblemX + emblemSize * 0.08,
            emblemY + emblemSize * 0.08,
            emblemSize * 0.84,
            emblemSize * 0.84
          );

          // Cartelito con denominación oficial
          if (plat.sponsorName) {
            ctx.fillStyle = "#0F172A";
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 1.5;
            const tagW = Math.min(plat.w * 0.85, 120);
            const tagH = 18;
            const tagX = plat.x + (plat.w - tagW) / 2;
            const tagY = drawY + plat.h * 0.82;
            this.roundRect(ctx, tagX, tagY, tagW, tagH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#FFD700";
            ctx.font = "900 10px 'Titan One', 'Fredoka', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(plat.sponsorName.toUpperCase(), tagX + tagW / 2, tagY + tagH / 2);
          }
        }
      } else if (plat.type === "fragile") {
        // Plataforma de Hielo Cristalino (plataforma-hielo.png)
        if (this.spritePlatHielo && this.spritePlatHielo.complete && this.spritePlatHielo.naturalWidth > 0) {
          ctx.drawImage(this.spritePlatHielo, plat.x, drawY - plat.h * 0.1, plat.w, plat.h * 1.25);
        } else {
          ctx.fillStyle = "rgba(129, 212, 250, 0.85)";
          this.roundRect(ctx, plat.x, drawY, plat.w, plat.h, 6);
          ctx.fill();
        }
      } else {
        // Plataforma Tronco Nevada (plataforma-tronco.png) para "normal", "moving" y "spring"
        if (this.spritePlatTronco && this.spritePlatTronco.complete && this.spritePlatTronco.naturalWidth > 0) {
          ctx.drawImage(this.spritePlatTronco, plat.x, drawY - plat.h * 0.15, plat.w, plat.h * 1.3);
        } else {
          ctx.fillStyle = "#5D4037";
          this.roundRect(ctx, plat.x, drawY, plat.w, plat.h, 6);
          ctx.fill();
        }

        // Resorte de bastón de caramelo para tipo "spring"
        if (plat.type === "spring") {
          const springW = 34;
          const springH = 34;
          const springX = plat.x + (plat.w - springW) / 2;
          const springY = drawY - springH + 8;

          ctx.save();
          if (this.spriteCandyCane && this.spriteCandyCane.complete && this.spriteCandyCane.naturalWidth > 0) {
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 8;
            ctx.drawImage(this.spriteCandyCane, springX, springY, springW, springH);
          } else {
            ctx.strokeStyle = "#FF1744";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(springX + springW / 2, springY + springH / 2, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(springX + springW / 2, springY + springH / 2, 5, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Si es moving, brillo sutil en los extremos
        if (plat.type === "moving") {
          ctx.fillStyle = "rgba(255, 215, 0, 0.85)";
          ctx.beginPath();
          ctx.arc(plat.x + 12, drawY + plat.h * 0.45, 3.5 + Math.sin(time * 5) * 1.5, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.w - 12, drawY + plat.h * 0.45, 3.5 + Math.cos(time * 5) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Coleccionables (Estrella o Regalo) flotando sobre la plataforma
      if (plat.hasItem && !plat.itemCollected && plat.type !== "sponsor" && plat.type !== "spring") {
        const itemX = plat.x + plat.w * 0.5;
        const itemBob = Math.sin(time * 4 + plat.x) * 4;
        const itemY = drawY - 22 + itemBob;

        if (plat.hasItem === "star") {
          const starSize = 30;
          if (this.spriteStar && this.spriteStar.complete && this.spriteStar.naturalWidth > 0) {
            ctx.save();
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 12;
            ctx.drawImage(this.spriteStar, itemX - starSize / 2, itemY - starSize / 2, starSize, starSize);
            ctx.restore();
          }
        } else {
          const giftSize = 28;
          if (this.spriteGift && this.spriteGift.complete && this.spriteGift.naturalWidth > 0) {
            ctx.save();
            ctx.shadowColor = "#FF1744";
            ctx.shadowBlur = 10;
            ctx.drawImage(this.spriteGift, itemX - giftSize / 2, itemY - giftSize / 2, giftSize, giftSize);
            ctx.restore();
          }
        }
      }

      ctx.restore();
    });
  }

  /**
   * Dibuja al personaje (Elfo Saltador Stylized 2D Game Concept Art)
   */
  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.playerX, this.playerY);

    // Orientación horizontal del elfo
    if (!this.playerFacingRight) {
      ctx.scale(-1, 1);
    }

    // Squash & Stretch dinámico según rebote y velocidad vertical
    let scaleX = 1;
    let scaleY = 1;
    if (this.squashTimer > 0) {
      const p = this.squashTimer / 0.22;
      scaleY = 1 - 0.22 * p;
      scaleX = 1 + 0.2 * p;
    } else if (this.playerVy < -250) {
      scaleY = 1.08;
      scaleX = 0.94;
    } else if (this.playerVy > 350) {
      scaleY = 0.96;
      scaleX = 1.04;
    }
    ctx.scale(scaleX, scaleY);

    const w = this.playerW;
    const h = this.playerH;

    // Llama propulsora del Cohete Mágico cuando está activo
    if (this.isRocketActive) {
      ctx.save();
      const flameH = 32 + Math.random() * 18;
      const grad = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.38 + flameH);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.2, "#FFD700");
      grad.addColorStop(0.65, "#FF6D00");
      grad.addColorStop(1, "rgba(255, 23, 68, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, h * 0.38);
      ctx.lineTo(w * 0.24, h * 0.38);
      ctx.lineTo(0, h * 0.38 + flameH);
      ctx.closePath();
      ctx.fill();

      // Mochila cohete festiva en la espalda
      ctx.fillStyle = "#D50000";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      this.roundRect(ctx, -w * 0.44, -h * 0.2, w * 0.24, h * 0.46, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Dibujo del Sprite oficial Stylized 2D Game Concept Art
    if (this.spritePlayer && this.spritePlayer.complete && this.spritePlayer.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(this.spritePlayer, -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
    } else {
      // Fallback procedural
      ctx.fillStyle = "#2E7D32";
      this.roundRect(ctx, -w * 0.35, -h * 0.1, w * 0.7, h * 0.48, 8);
      ctx.fill();

      ctx.fillStyle = "#FFE0B2";
      ctx.beginPath();
      ctx.arc(0, -h * 0.22, w * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#D50000";
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.28);
      ctx.lineTo(w * 0.3, -h * 0.28);
      ctx.quadraticCurveTo(0, -h * 0.7, -w * 0.35, -h * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Dibuja los botones táctiles y el HUD de altura
   */
  private drawTouchButtonsAndHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Botón Izquierda
    const btnL = this.btnLeftRect;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    const gradL = ctx.createLinearGradient(btnL.x, btnL.y, btnL.x, btnL.y + btnL.h);
    if (this.isMovingLeft) {
      gradL.addColorStop(0, "#00E676");
      gradL.addColorStop(1, "#00B0FF");
    } else {
      gradL.addColorStop(0, "rgba(15, 23, 42, 0.94)");
      gradL.addColorStop(1, "rgba(30, 41, 59, 0.96)");
    }
    ctx.fillStyle = gradL;
    ctx.strokeStyle = this.isMovingLeft ? "#FFD700" : "rgba(255, 215, 0, 0.7)";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, btnL.x, btnL.y, btnL.w, btnL.h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (this.spriteArrowLeft && this.spriteArrowLeft.complete && this.spriteArrowLeft.naturalWidth > 0) {
      ctx.drawImage(this.spriteArrowLeft, btnL.x + 10, btnL.y + (btnL.h - 20) / 2, 20, 20);
      ctx.fillStyle = this.isMovingLeft ? "#FFFFFF" : "#FFD700";
      ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("IZQUIERDA", btnL.x + 36, btnL.y + btnL.h / 2);
    } else {
      ctx.fillStyle = this.isMovingLeft ? "#FFFFFF" : "#FFD700";
      ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("◀ IZQUIERDA", btnL.x + btnL.w / 2, btnL.y + btnL.h / 2);
    }

    // 2. Botón Derecha
    const btnR = this.btnRightRect;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    const gradR = ctx.createLinearGradient(btnR.x, btnR.y, btnR.x, btnR.y + btnR.h);
    if (this.isMovingRight) {
      gradR.addColorStop(0, "#00E676");
      gradR.addColorStop(1, "#00B0FF");
    } else {
      gradR.addColorStop(0, "rgba(15, 23, 42, 0.94)");
      gradR.addColorStop(1, "rgba(30, 41, 59, 0.96)");
    }
    ctx.fillStyle = gradR;
    ctx.strokeStyle = this.isMovingRight ? "#FFD700" : "rgba(255, 215, 0, 0.7)";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, btnR.x, btnR.y, btnR.w, btnR.h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (this.spriteArrowRight && this.spriteArrowRight.complete && this.spriteArrowRight.naturalWidth > 0) {
      ctx.fillStyle = this.isMovingRight ? "#FFFFFF" : "#FFD700";
      ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("DERECHA", btnR.x + btnR.w - 36, btnR.y + btnR.h / 2);
      ctx.drawImage(this.spriteArrowRight, btnR.x + btnR.w - 30, btnR.y + (btnR.h - 20) / 2, 20, 20);
    } else {
      ctx.fillStyle = this.isMovingRight ? "#FFFFFF" : "#FFD700";
      ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DERECHA ▶", btnR.x + btnR.w / 2, btnR.y + btnR.h / 2);
    }

    // 3. Indicador Central de Altura (Pill Flotante Dorada)
    const altW = 164;
    const altH = 30;
    const altX = (this.width - altW) / 2;
    const altY = 68;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "rgba(10, 22, 45, 0.92)";
    ctx.strokeStyle = this.isRocketActive ? "#00E5FF" : "#FFD700";
    ctx.lineWidth = 2.2;
    this.roundRect(ctx, altX, altY, altW, altH, 15);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = this.isRocketActive ? "#00E5FF" : "#FFD700";
    ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`★ ALTURA: ${this.maxAltitudeReached}m ★`, this.width / 2, altY + altH / 2);

    // 4. Indicador de Combo Multiplicador
    if (this.combo >= 2) {
      const comboW = 110;
      const comboX = this.width - comboW - 16;
      const comboY = 68;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(10, 22, 45, 0.92)";
      ctx.strokeStyle = "#FF9100";
      ctx.lineWidth = 2.2;
      this.roundRect(ctx, comboX, comboY, comboW, 30, 15);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFB300";
      ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`¡COMBO x${this.combo}!`, comboX + comboW / 2, comboY + 15);
      ctx.restore();
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
