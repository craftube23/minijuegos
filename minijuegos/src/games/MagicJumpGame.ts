/**
 * ==============================================================================
 * JUEGO: ¡SALTO MÁGICO NAVIDEÑO! (Christmas Magic Jump - Deluxe Edition)
 * ==============================================================================
 *
 * Minijuego arcade vertical estilo Doodle Jump / Icy Tower / Sonic Jump:
 * - Estética Stylized 2D Game Art / Fantasy Game Concept Art (Supercell / Disney Klaus).
 * - Sprite oficial de alta definición del Elfo Saltador con física squash & stretch y rotación dinámica.
 * - Plataformas temáticas interactivas:
 *     * Tronco Nevado (madera tallada con manta de nieve)
 *     * Plataforma Móvil (patrulla horizontal con estela de viento y brillos)
 *     * Hielo Cristalino Frágil (se fractura en dos piezas giratorias con esquirlas)
 *     * Nube de Algodón Mágica (nube de malvavisco que se disuelve en vapor tras 1 rebote)
 *     * Resorte de Bastón de Caramelo (animación de compresión física y súper impulso)
 *     * Bumpers Reboteadores Polares (pinball arcade con rebote 360°, destello y sonido)
 *     * Pedestal Dorado de Patrocinador Oficial (activa Cohete Propulsor supersónico)
 * - Enemigo Aéreo: Duende del Hielo Volador (patrulla sinusoidal en las alturas):
 *     * Pisotón aéreo (stomp estilo Mario): ¡derrota al duende y propulsa al elfo con +350 pts!
 *     * Choque lateral: empuje con mareo y pérdida de combo.
 * - Power-Ups y coleccionables:
 *     * Cohete Propulsor Navideño (mochila propulsora con dobles llamas y estela)
 *     * Reloj de Tiempo Extra (+5 segundos al cronómetro)
 *     * Estrellas Doradas (+250 pts) y Regalos Festivos (+100 pts)
 * - Progresión por capas atmosféricas y banners de altitud (100m, 250m, 500m, 750m, 1000m+).
 * - Efecto de líneas de velocidad supersónica (speed lines) en ascensos rápidos.
 * - Sin emojis en canvas, HUD o código.
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
  type: "normal" | "moving" | "fragile" | "cloud" | "spring" | "sponsor";
  moveDir: number;
  moveSpeed: number;
  minX: number;
  maxX: number;
  broken: boolean;
  breakY?: number;
  breakAlpha?: number;
  breakRot?: number;
  squishTimer?: number;
  cloudAlpha?: number;
  springCompression?: number;
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
  hasItem?: "gift" | "star" | "rocket" | "clock";
  itemCollected?: boolean;
}

interface PinballBumper {
  x: number;
  y: number;
  radius: number;
  pulseTimer: number;
  pulseScale: number;
  rotation: number;
}

interface FrostGoblin {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  amp: number;
  freq: number;
  timeOffset: number;
  w: number;
  h: number;
  isDefeated: boolean;
  defeatVy: number;
  defeatRot: number;
  defeatAlpha: number;
  rot: number;
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  width: number;
}

interface TwinkleStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  parallaxFactor: number;
}

interface SnowFlake {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  drift: number;
  par: number;
}

interface PlayerGhost {
  x: number;
  y: number;
  rot: number;
  faceRight: boolean;
  alpha: number;
}

interface LandRing {
  x: number;
  y: number;
  t: number;
}

interface MilestoneBanner {
  text: string;
  subtext: string;
  timer: number;
  maxTimer: number;
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
  private spritePlatNube: HTMLImageElement;
  private spriteCandyCane: HTMLImageElement;
  private spriteBumper: HTMLImageElement;
  private spriteGoblin: HTMLImageElement;
  private spriteRocket: HTMLImageElement;
  private spriteStar: HTMLImageElement;
  private spriteGift: HTMLImageElement;
  private spriteClock: HTMLImageElement;
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
  private playerRotation: number = 0;
  private squashTimer: number = 0;
  private dizzyTimer: number = 0;
  private isRocketActive: boolean = false;
  private rocketTimer: number = 0;

  // Físicas del salto
  private readonly gravity: number = 990;
  private readonly normalJumpSpeed: number = -650;
  private readonly springJumpSpeed: number = -1120;
  private readonly rocketSpeed: number = -1350;
  private readonly stompJumpSpeed: number = -880;

  // Cámara vertical y progresión
  private cameraY: number = 0;
  private maxAltitudeReached: number = 0;
  private nextMilestone: number = 100;

  // Entidades del mundo
  private platforms: JumpPlatform[] = [];
  private highestPlatformY: number = 0;
  private bumpers: PinballBumper[] = [];
  private goblins: FrostGoblin[] = [];
  private speedLines: SpeedLine[] = [];
  private activeBanner: MilestoneBanner | null = null;

  // Estrellas de fondo procedimentales
  private skyStars: TwinkleStar[] = [];
  private snowFlakes: SnowFlake[] = [];

  // Efectos visuales: estela del elfo, ondas de aterrizaje y zona actual
  private ghosts: PlayerGhost[] = [];
  private landRings: LandRing[] = [];
  private currentZone: number = 0;

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
      "¡Salta sobre plataformas nevadas, aplasta duendes traviesos y vuela a las estrellas con cohetes propulsores!",
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
    this.spritePlatNube = this.getImage("./assets/images/plataforma-nube.png");
    this.spriteCandyCane = this.getImage("./assets/images/baston-caramelo.png");
    this.spriteBumper = this.getImage("./assets/images/bumper-polar.png");
    this.spriteGoblin = this.getImage("./assets/images/duende-hielo.png");
    this.spriteRocket = this.getImage("./assets/images/cohete-navideno.png");
    this.spriteStar = this.getImage("./assets/images/estrella con logo.png");
    this.spriteGift = this.getImage("./assets/images/regalo-estilizado-rojo.png");
    this.spriteClock = this.getImage("./assets/images/reloj-magico-tiempo.png");
    this.spriteArrowLeft = this.getImage("./assets/images/flecha-izq.png");
    this.spriteArrowRight = this.getImage("./assets/images/flecha-der.png");

    this.initSkyStars();
    this.initSnowFlakes();
    this.initSpeedLines();
    this.computeGameLayout();
  }

  private initSnowFlakes(): void {
    this.snowFlakes = [];
    for (let i = 0; i < 70; i++) {
      const near = Math.random() < 0.3;
      this.snowFlakes.push({
        x: Math.random(),
        y: Math.random(),
        size: near ? 2.6 + Math.random() * 1.8 : 1.2 + Math.random() * 1.4,
        alpha: near ? 0.85 : 0.45 + Math.random() * 0.3,
        speed: near ? 70 + Math.random() * 40 : 25 + Math.random() * 30,
        drift: 0.6 + Math.random() * 1.2,
        par: near ? 0.5 : 0.2
      });
    }
  }

  private loadImage(src: string): HTMLImageElement {
    return this.getImage(src);
  }

  private initSkyStars(): void {
    this.skyStars = [];
    const count = 65;
    for (let i = 0; i < count; i++) {
      this.skyStars.push({
        x: Math.random(),
        y: Math.random(),
        size: 1.5 + Math.random() * 2.8,
        alpha: 0.35 + Math.random() * 0.65,
        twinkleSpeed: 1.8 + Math.random() * 3.2,
        parallaxFactor: 0.08 + Math.random() * 0.22
      });
    }
  }

  private initSpeedLines(): void {
    this.speedLines = [];
    for (let i = 0; i < 24; i++) {
      this.speedLines.push({
        x: Math.random() < 0.5 ? Math.random() * 120 : (this.width > 0 ? this.width - Math.random() * 120 : 700),
        y: Math.random() * (this.height > 0 ? this.height : 600),
        length: 40 + Math.random() * 90,
        speed: 900 + Math.random() * 600,
        alpha: 0.25 + Math.random() * 0.5,
        width: 1.5 + Math.random() * 2.5
      });
    }
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.maxAltitudeReached = 0;
    this.nextMilestone = 100;
    this.isRocketActive = false;
    this.rocketTimer = 0;
    this.squashTimer = 0;
    this.dizzyTimer = 0;
    this.playerRotation = 0;
    this.targetPlayerX = null;
    this.activeBanner = null;
    this.ghosts = [];
    this.landRings = [];
    this.currentZone = 0;

    this.bumpers = [];
    this.goblins = [];

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
    this.bumpers = [];
    this.goblins = [];
    this.speedLines = [];
    this.activeBanner = null;
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
    this.bumpers = [];
    this.goblins = [];

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

    let curY = h * 0.78 - 95;
    this.highestPlatformY = curY;

    for (let i = 0; i < 15; i++) {
      this.generatePlatformTier(curY);
      curY -= 92 + Math.random() * 24;
      this.highestPlatformY = curY;
    }
  }

  /**
   * Genera plataformas equilibradas, bumpers y duendes aéreos en una altura Y específica
   */
  private generatePlatformTier(y: number): void {
    const w = this.width > 0 ? this.width : 800;
    const altitudeMeters = Math.max(0, Math.floor(-y / 12));

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
      const platY = y + (idx === 0 ? (Math.random() - 0.5) * 10 : 26 + Math.random() * 20);

      // Probabilidades según altitud
      const rand = idx === 0 ? 0.25 + Math.random() * 0.75 : Math.random();
      let type: JumpPlatform["type"] = "normal";
      let moveSpeed = 0;
      let minX = platX;
      let maxX = platX;
      let sponsorName: string | undefined = undefined;
      let sponsorLogo: HTMLImageElement | undefined = undefined;
      let hasItem: JumpPlatform["hasItem"] = undefined;

      if (rand < 0.14) {
        // Plataforma móvil patrullera
        type = "moving";
        moveSpeed = 75 + Math.random() * 45;
        const patrolSpan = Math.min(140, laneWidth * 0.38);
        minX = Math.max(16, platX - patrolSpan * 0.5);
        maxX = Math.max(minX, Math.min(w - platW - 16, platX + patrolSpan * 0.5));
      } else if (rand < 0.26 && hasSolidPlatform) {
        // Hielo quebradizo
        type = "fragile";
      } else if (rand < 0.38 && hasSolidPlatform) {
        // Nube de malvavisco (se disuelve tras 1 salto)
        type = "cloud";
      } else if (rand < 0.50) {
        // Súper resorte de bastón de caramelo
        type = "spring";
        hasSolidPlatform = true;
      } else if (rand < 0.58 && this.sponsorLogos.length > 0) {
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

        const itemRoll = Math.random();
        if (itemRoll < 0.22) {
          hasItem = "star";
        } else if (itemRoll < 0.42) {
          hasItem = "gift";
        } else if (itemRoll < 0.49) {
          hasItem = "clock";
        } else if (itemRoll < 0.53 && altitudeMeters > 150) {
          hasItem = "rocket";
        }
      }

      this.platforms.push({
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
        cloudAlpha: 1.0,
        springCompression: 0,
        sponsorName,
        sponsorLogo,
        hasItem,
        itemCollected: false
      });
    }

    // Ocasionalmente generar un Pinball Bumper suspendido en el espacio abierto
    if (Math.random() < 0.28 && altitudeMeters > 60) {
      const bumperX = 50 + Math.random() * (w - 100);
      const bumperY = y - 48;
      this.bumpers.push({
        x: bumperX,
        y: bumperY,
        radius: 28,
        pulseTimer: 0,
        pulseScale: 1.0,
        rotation: Math.random() * Math.PI * 2
      });
    }

    // A partir de 80m de altura, generar Duendes del Hielo voladores en trayectoria sinusoidal
    if (Math.random() < 0.24 && altitudeMeters >= 80) {
      const goblinW = 50;
      const goblinH = 50;
      const goblinX = Math.random() < 0.5 ? 40 : w - 90;
      this.goblins.push({
        x: goblinX,
        y: y - 55,
        baseY: y - 55,
        vx: (Math.random() < 0.5 ? 1 : -1) * (60 + Math.random() * 40),
        amp: 18 + Math.random() * 14,
        freq: 1.8 + Math.random() * 1.2,
        timeOffset: Math.random() * Math.PI * 2,
        w: goblinW,
        h: goblinH,
        isDefeated: false,
        defeatVy: 0,
        defeatRot: 0,
        defeatAlpha: 1.0,
        rot: 0
      });
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
    if (this.dizzyTimer > 0) {
      this.dizzyTimer -= dt;
    }

    // 1. Control de propulsor cohete
    if (this.isRocketActive) {
      this.rocketTimer -= dt;
      this.playerVy = this.rocketSpeed;

      // Estela de chispas doradas y humo festivo
      this.particles.emitBurst(this.playerX - 10, this.playerY + this.playerH * 0.45, "#FFD700", 3);
      this.particles.emitBurst(this.playerX + 10, this.playerY + this.playerH * 0.45, "#FF9100", 3);

      if (this.rocketTimer <= 0) {
        this.isRocketActive = false;
        this.playerVy = this.normalJumpSpeed * 0.9;
        this.audio.playWhoosh();
      }
    } else {
      // Gravedad normal
      this.playerVy += this.gravity * dt;
    }

    // 2. Movimiento horizontal ágil y reactivo
    const maxHorizontalSpeed = 450;
    const accel = 2300;

    if (this.targetPlayerX !== null) {
      let dx = this.targetPlayerX - this.playerX;
      if (dx > this.width * 0.5) {
        dx -= this.width;
      } else if (dx < -this.width * 0.5) {
        dx += this.width;
      }

      if (Math.abs(dx) > 6) {
        this.playerVx = Math.sign(dx) * Math.min(maxHorizontalSpeed, Math.abs(dx) * 8.2);
        this.playerFacingRight = dx > 0;
      } else {
        this.playerVx *= 0.82;
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

    // Inclinación suave del cuerpo según velocidad horizontal
    const targetRot = (this.playerVx / maxHorizontalSpeed) * 0.22;
    this.playerRotation += (targetRot - this.playerRotation) * Math.min(1, dt * 14);

    this.playerX += this.playerVx * dt;
    this.playerY += this.playerVy * dt;

    // Envoltura horizontal de pantalla (wrap-around Doodle Jump)
    if (this.playerX < -this.playerW * 0.5) {
      this.playerX = this.width + this.playerW * 0.5;
    } else if (this.playerX > this.width + this.playerW * 0.5) {
      this.playerX = -this.playerW * 0.5;
    }

    // 3. Movimiento de plataformas y temporizador de squish / resorte
    this.platforms.forEach((plat) => {
      if (plat.squishTimer && plat.squishTimer > 0) {
        plat.squishTimer -= dt;
      }

      if (plat.springCompression && plat.springCompression > 0) {
        plat.springCompression = Math.max(0, plat.springCompression - dt * 4.5);
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
        if (plat.breakRot === undefined) plat.breakRot = 0;
        plat.breakY += 210 * dt;
        plat.breakRot += (plat.x % 2 === 0 ? 1 : -1) * 3.5 * dt;
        plat.breakAlpha = Math.max(0, plat.breakAlpha - dt * 2.4);
      }

      // Desvanecimiento de nube mágica
      if (plat.type === "cloud" && plat.cloudAlpha !== undefined && plat.cloudAlpha < 1.0) {
        plat.cloudAlpha = Math.max(0, plat.cloudAlpha - dt * 2.8);
      }
    });

    // 4. Actualización de Bumpers de Pinball
    this.bumpers.forEach((bumper) => {
      if (bumper.pulseTimer > 0) {
        bumper.pulseTimer -= dt;
        bumper.pulseScale = 1.0 + Math.sin((1 - bumper.pulseTimer / 0.22) * Math.PI) * 0.35;
      } else {
        bumper.pulseScale = 1.0;
      }
    });

    // 5. Actualización de Duendes del Hielo Aéreos
    this.goblins.forEach((goblin) => {
      if (goblin.isDefeated) {
        goblin.y += goblin.defeatVy * dt;
        goblin.defeatVy += 1100 * dt;
        goblin.rot += goblin.defeatRot * dt;
        goblin.defeatAlpha = Math.max(0, goblin.defeatAlpha - dt * 1.8);
      } else {
        // Movimiento horizontal con rebote en paredes
        goblin.x += goblin.vx * dt;
        if (goblin.x <= 20) {
          goblin.x = 20;
          goblin.vx = Math.abs(goblin.vx);
        } else if (goblin.x >= this.width - goblin.w - 20) {
          goblin.x = this.width - goblin.w - 20;
          goblin.vx = -Math.abs(goblin.vx);
        }

        // Ondulación sinusoidal vertical
        goblin.y = goblin.baseY + Math.sin(this.animTimer * goblin.freq + goblin.timeOffset) * goblin.amp;
        goblin.rot = Math.sin(this.animTimer * 4 + goblin.timeOffset) * 0.12;
      }
    });

    // 6. Colisiones con plataformas (sólo cuando desciende: playerVy > 0)
    if (this.playerVy > 0 && !this.isRocketActive) {
      const feetY = this.playerY + this.playerH * 0.48;
      const prevFeetY = feetY - this.playerVy * dt;

      for (let i = 0; i < this.platforms.length; i++) {
        const plat = this.platforms[i];
        if (plat.broken) continue;
        if (plat.type === "cloud" && plat.cloudAlpha !== undefined && plat.cloudAlpha < 0.3) continue;

        const platSurfaceY = plat.y + 4;
        const platSurfaceDepth = Math.max(16, plat.h * 0.38);

        if (
          feetY >= platSurfaceY &&
          prevFeetY <= platSurfaceY + platSurfaceDepth &&
          this.playerX + this.playerW * 0.32 >= plat.x &&
          this.playerX - this.playerW * 0.32 <= plat.x + plat.w
        ) {
          // ¡Aterrizaje y rebote!
          this.playerY = platSurfaceY - this.playerH * 0.48;
          this.squashTimer = 0.22;
          plat.squishTimer = 0.18;

          if (plat.type === "spring") {
            // Súper rebote con resorte de bastón de caramelo
            plat.springCompression = 1.0;
            this.playerVy = this.springJumpSpeed;
            this.combo += 2;
            this.audio.playCatchItem(1.5);
            this.triggerShake(0.15, 4);
            this.particles.emitBurst(this.playerX, plat.y, "#FF1744", 16);
            this.particles.emitBurst(this.playerX, plat.y, "#FFD700", 12);
            this.addFloatingText("¡SÚPER SALTO! +150", this.playerX, plat.y - 24, "#FFD700", 1.35);
            this.score += 150;
          } else if (plat.type === "cloud") {
            // Nube de malvavisco: 1 salto y se desvanece
            plat.cloudAlpha = 0.95;
            plat.broken = true;
            this.playerVy = this.normalJumpSpeed * 1.05;
            this.combo++;
            this.audio.playWhoosh();
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y + 8, "#FFFFFF", 16);
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y + 8, "#B3E5FC", 10);
            this.addFloatingText("¡PUFF NUBE! +75", this.playerX, plat.y - 22, "#E0F7FA", 1.2);
            this.score += 75;
          } else if (plat.type === "fragile") {
            // Hielo quebradizo
            plat.broken = true;
            this.playerVy = this.normalJumpSpeed;
            this.combo++;
            this.audio.playElfHit();
            this.triggerShake(0.1, 3);
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y + 10, "#81D4FA", 16);
            this.particles.emitBurst(plat.x + plat.w * 0.5, plat.y + 10, "#E1F5FE", 10);
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
          this.landRings.push({ x: this.playerX, y: platSurfaceY, t: 0 });

          // Recoger coleccionables sobre la plataforma
          if (plat.hasItem && !plat.itemCollected) {
            this.collectItem(plat.hasItem, plat.x + plat.w * 0.5, plat.y - 20);
            plat.itemCollected = true;
          }

          break;
        }
      }
    }

    // 7. Colisiones con Bumpers Polares Arcade (Pinball en cualquier dirección)
    for (let i = 0; i < this.bumpers.length; i++) {
      const b = this.bumpers[i];
      const dx = this.playerX - b.x;
      const dy = this.playerY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitDist = b.radius + this.playerW * 0.42;

      if (dist < hitDist) {
        const nx = dist > 0.001 ? dx / dist : 0;
        const ny = dist > 0.001 ? dy / dist : -1;

        b.pulseTimer = 0.22;
        this.playerVx = nx * 560;
        this.playerVy = ny < 0 ? -Math.max(780, Math.abs(ny * 980)) : -720;
        this.squashTimer = 0.25;

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += 150;

        this.audio.playCatchItem(1.65);
        this.triggerShake(0.18, 6);
        this.particles.emitBurst(b.x, b.y, "#00E5FF", 18);
        this.particles.emitBurst(b.x, b.y, "#FFD700", 12);
        this.addFloatingText("¡BUMPER POLAR! +150", b.x, b.y - 32, "#00E5FF", 1.4);
        break;
      }
    }

    // 8. Colisiones y Combate con Duendes del Hielo Aéreos
    for (let i = 0; i < this.goblins.length; i++) {
      const g = this.goblins[i];
      if (g.isDefeated) continue;

      const goblinCenterX = g.x + g.w * 0.5;
      const goblinCenterY = g.y + g.h * 0.5;
      const dx = this.playerX - goblinCenterX;
      const dy = this.playerY - goblinCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (g.w * 0.55 + this.playerW * 0.45)) {
        // ¿PISOTÓN AÉREO (STOMP)? Si el elfo desciende y sus pies están en la mitad superior del duende
        const isStomp = this.playerVy > 0 && this.playerY < goblinCenterY - 6;

        if (isStomp || this.isRocketActive) {
          // ¡DUENDE DERROTADO!
          g.isDefeated = true;
          g.defeatVy = 320;
          g.defeatRot = (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 6);

          this.playerVy = this.stompJumpSpeed;
          this.squashTimer = 0.24;
          this.combo += 2;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          this.score += 350;

          this.audio.playElfHit();
          this.audio.playElfCollectItem();
          this.triggerShake(0.2, 5);
          this.particles.emitBurst(goblinCenterX, goblinCenterY, "#00E5FF", 20);
          this.particles.emitBurst(goblinCenterX, goblinCenterY, "#FFD700", 14);
          this.particles.emitConfetti(this.width, 20);
          this.addFloatingText("★ ¡PISOTÓN DUENDE! +350 ★", goblinCenterX, goblinCenterY - 28, "#FFD700", 1.45);
        } else {
          // Choque lateral/inferior: el elfo recibe golpe y pierde combo
          this.dizzyTimer = 0.75;
          this.combo = 0;
          this.playerVx = dx < 0 ? -380 : 380;
          this.playerVy = Math.max(150, this.playerVy + 180);
          this.score = Math.max(0, this.score - 50);

          this.audio.playElfHit();
          this.triggerShake(0.25, 7);
          this.particles.emitBurst(this.playerX, this.playerY, "#FF1744", 12);
          this.addFloatingText("¡CUIDADO! -50", this.playerX, this.playerY - 26, "#FF1744", 1.3);
        }
        break;
      }
    }

    // 9. Actualización de Líneas de Velocidad Supersónicas
    const isHighSpeed = this.playerVy < -700 || this.isRocketActive;
    this.speedLines.forEach((line) => {
      if (isHighSpeed) {
        line.y += (line.speed + Math.abs(this.playerVy) * 0.8) * dt;
        if (line.y > this.height) {
          line.y = -line.length;
          line.x = Math.random() < 0.5 ? Math.random() * 140 : this.width - Math.random() * 140;
        }
      }
    });

    // 9b. Estela del elfo en ascensos rápidos y ondas de aterrizaje
    if (this.playerVy < -500 || this.isRocketActive) {
      this.ghosts.push({
        x: this.playerX,
        y: this.playerY,
        rot: this.playerRotation,
        faceRight: this.playerFacingRight,
        alpha: 0.4
      });
    }
    this.ghosts.forEach((gh) => { gh.alpha -= dt * 1.8; });
    this.ghosts = this.ghosts.filter((gh) => gh.alpha > 0).slice(-9);
    this.landRings.forEach((r) => { r.t += dt * 3.2; });
    this.landRings = this.landRings.filter((r) => r.t < 1);

    // 10. Actualización de Banners de Altitud
    if (this.activeBanner) {
      this.activeBanner.timer -= dt;
      if (this.activeBanner.timer <= 0) {
        this.activeBanner = null;
      }
    }

    // 11. Seguimiento suave de cámara vertical hacia arriba
    const targetCameraY = this.playerY - this.height * 0.52;
    if (targetCameraY < this.cameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * Math.min(1, dt * 11);
    }

    // 12. Registro de altitud máxima, puntos por escalada e hitos de altitud
    const currentAltitude = Math.max(0, Math.floor(-this.playerY / 12));
    if (currentAltitude > this.maxAltitudeReached) {
      const diff = currentAltitude - this.maxAltitudeReached;
      this.score += diff * 2;
      this.maxAltitudeReached = currentAltitude;

      // Hito alcanzado
      if (this.maxAltitudeReached >= this.nextMilestone) {
        this.triggerAltitudeMilestone(this.nextMilestone);
        if (this.nextMilestone === 100) this.nextMilestone = 250;
        else if (this.nextMilestone === 250) this.nextMilestone = 500;
        else if (this.nextMilestone === 500) this.nextMilestone = 750;
        else if (this.nextMilestone === 750) this.nextMilestone = 1000;
        else this.nextMilestone += 500;
      }
    }

    // 12b. Anuncio de cambio de zona (cielo y decorado nuevos)
    const zoneNow = this.zoneIndexAt(this.maxAltitudeReached);
    if (zoneNow > this.currentZone) {
      this.currentZone = zoneNow;
      this.activeBanner = {
        text: MagicJumpGame.ZONES[zoneNow].name,
        subtext: "NUEVA ZONA DESBLOQUEADA",
        timer: 2.6,
        maxTimer: 2.6
      };
    }

    // 13. Generación continua de plataformas superiores sin vacíos
    while (this.highestPlatformY > this.cameraY - 260) {
      this.highestPlatformY -= 92 + Math.random() * 24;
      this.generatePlatformTier(this.highestPlatformY);
    }

    // 14. Limpieza de entidades fuera de pantalla inferior
    const cleanupY = this.cameraY + this.height + 160;
    this.platforms = this.platforms.filter((p) => p.y < cleanupY);
    this.bumpers = this.bumpers.filter((b) => b.y < cleanupY);
    this.goblins = this.goblins.filter((g) => g.y < cleanupY && (!g.isDefeated || g.defeatAlpha > 0.05));

    // 15. Caída por el fondo (red elástica mágica de rescate)
    if (this.playerY > this.cameraY + this.height + 70) {
      this.handlePlayerFall();
    }
  }

  /**
   * Recoge un ítem coleccionable o power-up
   */
  private collectItem(item: "gift" | "star" | "rocket" | "clock", x: number, y: number): void {
    if (item === "star") {
      this.score += 250;
      this.audio.playElfCollectItem();
      this.particles.emitBurst(x, y, "#FFD700", 14);
      this.addFloatingText("+250 ESTRELLA", x, y - 10, "#FFD700", 1.3);
    } else if (item === "gift") {
      this.score += 100;
      this.audio.playCatchItem(1.3);
      this.particles.emitBurst(x, y, "#FF1744", 12);
      this.addFloatingText("+100 REGALO", x, y - 10, "#FF5252", 1.25);
    } else if (item === "clock") {
      if (this.showTimer) {
        this.timeRemaining += 5;
      }
      this.score += 120;
      this.audio.playBellNote(1);
      this.triggerShake(0.12, 3);
      this.particles.emitBurst(x, y, "#00E5FF", 16);
      this.particles.emitBurst(x, y, "#FFD700", 10);
      this.addFloatingText("¡+5s TIEMPO EXTRA!", x, y - 16, "#00E5FF", 1.45);
    } else if (item === "rocket") {
      this.triggerRocketBoost("PROPULSIÓN");
    }
  }

  /**
   * Activa el hito de altitud con banner festivo y fanfarria
   */
  private triggerAltitudeMilestone(meters: number): void {
    const bonus = meters;
    this.score += bonus;
    this.audio.playVictory();
    this.triggerShake(0.2, 5);
    this.particles.emitConfetti(this.width, 35);

    this.activeBanner = {
      text: `★ ¡ALTURA ${meters}m ALCANZADA! ★`,
      subtext: `+${bonus} PUNTOS DE BONIFICACIÓN`,
      timer: 2.8,
      maxTimer: 2.8
    };
  }

  /**
   * Activa el Cohete Mágico de Patrocinador
   */
  private triggerRocketBoost(sponsorName: string): void {
    this.isRocketActive = true;
    this.rocketTimer = 3.2; // 3.2s de ascenso supersónico
    this.audio.playPowerUp();
    this.triggerShake(0.22, 6);
    this.particles.emitConfetti(this.width, 40);
    this.addFloatingText(`★ ¡COHETE ${sponsorName.toUpperCase()}! ★`, this.width * 0.5, this.height * 0.35, "#FFD700", 1.6);
  }

  /**
   * Trampolín de rescate cuando el elfo cae por la base
   */
  private handlePlayerFall(): void {
    this.combo = 0;
    this.audio.playWhoosh();
    this.triggerShake(0.2, 6);

    // Impulsar hacia arriba con cama elástica mágica potente
    this.playerVy = this.normalJumpSpeed * 1.3;
    this.playerY = this.cameraY + this.height * 0.82;

    // Crear una plataforma de emergencia ancha justo debajo
    const emergencyW = Math.max(190, Math.min(340, this.width * 0.38));
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
      squishTimer: 0.22
    });

    // Generar inmediatamente un peldaño con resorte encima para recuperar altura sin esperar
    const springPlatW = 135;
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

    this.particles.emitBurst(this.playerX, this.playerY, "#FF9100", 14);
    this.addFloatingText("¡TRAMPOLÍN DE RESCATE!", this.width * 0.5, this.height * 0.58, "#FFD700", 1.3);
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS (Stylized 2D Game Concept Art)
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo dinámico con capas atmosféricas y scroll parallax
    this.drawBackground(ctx);

    // 2. Líneas de velocidad supersónicas de fondo
    this.drawSpeedLines(ctx);

    ctx.save();
    // Desplazamiento de la cámara vertical
    ctx.translate(0, -this.cameraY);

    // 3. Dibujar plataformas temáticas y coleccionables
    this.drawPlatforms(ctx);

    // 4. Dibujar Bumpers Polares Arcade
    this.drawBumpers(ctx);

    // 5. Dibujar Duendes de Hielo Aéreos
    this.drawGoblins(ctx);

    // 5b. Ondas de aterrizaje y estela del elfo
    this.drawLandRings(ctx);
    this.drawGhosts(ctx);

    // 6. Dibujar al Elfo Saltador Stylized 2D
    this.drawPlayer(ctx);

    ctx.restore();

    // 6b. Nieve en primer plano
    this.drawSnowfall(ctx);

    // 7. Partículas en pantalla
    this.particles.draw(ctx, true);

    // 8. Banners de Altitud Celebratorios
    this.drawMilestoneBanner(ctx);

    // 9. Botones táctiles inferiores y HUD de altura
    this.drawTouchButtonsAndHUD(ctx);
  }

  // ==========================================================================
  // MUNDO POR ZONAS: cada tramo de altura tiene su propio cielo y decorado
  // ==========================================================================
  private static readonly ZONES: { at: number; name: string; top: number[]; mid: number[]; bot: number[] }[] = [
    { at: 0, name: "ALDEA AL ATARDECER", top: [44, 30, 86], mid: [176, 74, 122], bot: [255, 166, 112] },
    { at: 140, name: "BOSQUE DE PINOS", top: [8, 24, 52], mid: [14, 64, 84], bot: [28, 110, 110] },
    { at: 380, name: "AURORA BOREAL", top: [6, 14, 44], mid: [26, 40, 96], bot: [30, 120, 130] },
    { at: 650, name: "MAR DE NUBES", top: [70, 60, 140], mid: [236, 130, 160], bot: [255, 214, 150] },
    { at: 950, name: "ESPACIO ESTRELLADO", top: [3, 4, 16], mid: [14, 10, 40], bot: [40, 20, 80] }
  ];

  private zoneIndexAt(meters: number): number {
    let idx = 0;
    for (let i = 0; i < MagicJumpGame.ZONES.length; i++) {
      if (meters >= MagicJumpGame.ZONES[i].at) idx = i;
    }
    return idx;
  }

  private ramp(v: number, from: number, to: number): number {
    return Math.min(1, Math.max(0, (v - from) / (to - from)));
  }

  private lerpRgb(a: number[], b: number[], t: number): number[] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  private rgba(c: number[], alpha: number = 1, shade: number = 1): string {
    return `rgba(${Math.round(c[0] * shade)}, ${Math.round(c[1] * shade)}, ${Math.round(c[2] * shade)}, ${alpha})`;
  }

  private hash(i: number): number {
    return Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
  }

  /**
   * Cielo por zonas con transición suave y capas de parallax (montañas, pinos,
   * aurora, mar de nubes y espacio) que aparecen según la altura.
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const time = this.animTimer;
    const m = Math.max(0, -this.cameraY / 12);
    const zones = MagicJumpGame.ZONES;

    const zi = this.zoneIndexAt(m);
    const cur = zones[zi];
    const nxt = zones[Math.min(zi + 1, zones.length - 1)];
    const rawT = zi < zones.length - 1 ? this.ramp(m, nxt.at - 90, nxt.at) : 0;
    const t = rawT * rawT * (3 - 2 * rawT);
    const top = this.lerpRgb(cur.top, nxt.top, t);
    const mid = this.lerpRgb(cur.mid, nxt.mid, t);
    const bot = this.lerpRgb(cur.bot, nxt.bot, t);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, this.rgba(top));
    sky.addColorStop(0.55, this.rgba(mid));
    sky.addColorStop(1, this.rgba(bot));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sol poniente (sólo en la aldea)
    const sunVis = 1 - this.ramp(m, 0, 180);
    if (sunVis > 0.02) {
      const sx = w * 0.3;
      const sy = h * 0.58 + m * 1.1;
      ctx.save();
      ctx.globalAlpha = sunVis;
      const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 190);
      glow.addColorStop(0, "rgba(255, 214, 150, 0.75)");
      glow.addColorStop(1, "rgba(255, 150, 100, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, 190, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFE3A8";
      ctx.beginPath();
      ctx.arc(sx, sy, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Estrellas parpadeantes: aparecen de noche y vuelven en el espacio
    const starVis = Math.max(this.ramp(m, 60, 260) * (1 - 0.8 * this.ramp(m, 600, 700)), this.ramp(m, 900, 1000));
    if (starVis > 0.02) {
      ctx.save();
      this.skyStars.forEach((star) => {
        const starX = star.x * w;
        const starY = ((star.y * h * 2 - this.cameraY * star.parallaxFactor) % h + h) % h;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.x * 10);
        const alpha = Math.max(0.1, Math.min(1, star.alpha + twinkle * 0.3)) * starVis;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Luna con cráteres
    const moonVis = this.ramp(m, 120, 260) * (1 - this.ramp(m, 600, 720));
    if (moonVis > 0.02) {
      const moonX = w * 0.82;
      const moonY = Math.min(h * 0.5, h * 0.14 + m * 0.25);
      ctx.save();
      ctx.globalAlpha = moonVis;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 14, moonX, moonY, 78);
      moonGlow.addColorStop(0, "rgba(255, 254, 230, 0.5)");
      moonGlow.addColorStop(1, "rgba(255, 254, 230, 0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFDE7";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200, 190, 150, 0.35)";
      ctx.beginPath();
      ctx.arc(moonX - 9, moonY - 6, 6, 0, Math.PI * 2);
      ctx.arc(moonX + 8, moonY + 8, 4.5, 0, Math.PI * 2);
      ctx.arc(moonX + 6, moonY - 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawAurora(ctx, m, time);
    this.drawCloudSea(ctx, m, time);
    this.drawSpaceScenery(ctx, m, time);

    // Montañas lejanas
    const mountVis = 1 - this.ramp(m, 260, 420);
    if (mountVis > 0.02) {
      const layers = [
        { par: 0.12, base: 0.80, amp: 70, shade: 0.55, seed: 1.3 },
        { par: 0.22, base: 0.88, amp: 52, shade: 0.38, seed: 4.1 }
      ];
      layers.forEach((L) => {
        const off = -this.cameraY * L.par;
        const baseY = h * L.base + off;
        if (baseY - L.amp * 1.5 > h) return;
        ctx.fillStyle = this.rgba(bot, mountVis, L.shade);
        ctx.beginPath();
        ctx.moveTo(0, h + 4);
        for (let x = 0; x <= w + 20; x += 20) {
          const y = baseY - (Math.sin(x * 0.004 + L.seed) * 0.6 + 0.4) * L.amp - Math.sin(x * 0.013 + L.seed * 2) * 14;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h + 4);
        ctx.closePath();
        ctx.fill();
      });
    }

    // Bosque de pinos nevados
    const forestVis = 1 - this.ramp(m, 330, 480);
    if (forestVis > 0.02) {
      const off = -this.cameraY * 0.38;
      const baseY = h * 0.96 + off;
      if (baseY - 150 < h) {
        const spacing = 46;
        const count = Math.ceil(w / spacing) + 2;
        for (let i = 0; i < count; i++) {
          const tx = i * spacing - 10 + this.hash(i) * 22;
          const th = 70 + this.hash(i + 40) * 70;
          const tw = 34 + this.hash(i + 80) * 14;
          ctx.fillStyle = this.rgba(bot, forestVis, 0.3);
          for (let tier = 0; tier < 3; tier++) {
            const ty = baseY - th * (tier * 0.28);
            const tierW = tw * (1 - tier * 0.26);
            ctx.beginPath();
            ctx.moveTo(tx, ty - th * 0.42);
            ctx.lineTo(tx + tierW, ty);
            ctx.lineTo(tx - tierW, ty);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = `rgba(235, 245, 255, ${0.7 * forestVis})`;
          ctx.beginPath();
          ctx.moveTo(tx, baseY - th * 0.56 - th * 0.42 * 0.6);
          ctx.lineTo(tx + tw * 0.2, baseY - th * 0.56 - th * 0.42 * 0.2);
          ctx.lineTo(tx - tw * 0.2, baseY - th * 0.56 - th * 0.42 * 0.2);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Aldea navideña de la base: se aleja con parallax y deja ver el mundo nuevo
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      const bgH = Math.max(h, (w * 1080) / 1920);
      const villageY = (h - bgH) - (this.cameraY * 0.45);
      const fadeAlpha = 1 - this.ramp(m, 0, 220);
      if (villageY < h && fadeAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = fadeAlpha;
        ctx.drawImage(this.bgImage, 0, villageY, w, bgH);
        ctx.restore();
      }
    }

    // Viñeta suave
    const vignette = ctx.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, "rgba(8, 16, 36, 0.25)");
    vignette.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(10, 22, 48, 0.4)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  /** Cortinas de aurora boreal (zona 380m - 750m) */
  private drawAurora(ctx: CanvasRenderingContext2D, m: number, time: number): void {
    const vis = this.ramp(m, 280, 420) * (1 - this.ramp(m, 700, 800));
    if (vis < 0.02) return;

    const w = this.width;
    const h = this.height;
    const colors = [[0, 255, 170], [0, 200, 255], [170, 100, 255]];

    ctx.save();
    colors.forEach((c, b) => {
      const baseY = h * (0.1 + b * 0.09);
      const grad = ctx.createLinearGradient(0, baseY - 30, 0, baseY + h * 0.42);
      grad.addColorStop(0, this.rgba(c, 1));
      grad.addColorStop(1, this.rgba(c, 0));
      ctx.fillStyle = grad;
      for (let x = 0; x < w; x += 10) {
        const wave = Math.sin(x * 0.007 + time * 0.9 + b * 1.7) * 0.5 + 0.5;
        const y0 = baseY + Math.sin(x * 0.011 + time * 0.6 + b) * 26;
        const len = h * 0.2 + wave * h * 0.18;
        ctx.globalAlpha = vis * (0.12 + wave * 0.26);
        ctx.fillRect(x, y0, 10, len);
      }
    });
    ctx.restore();
  }

  /** Bancos de nubes esponjosas que se desplazan (zona 650m - 1000m) */
  private drawCloudSea(ctx: CanvasRenderingContext2D, m: number, time: number): void {
    const vis = this.ramp(m, 560, 700) * (1 - this.ramp(m, 940, 1040));
    if (vis < 0.02) return;

    const w = this.width;
    const h = this.height;
    ctx.save();
    for (let r = 0; r < 3; r++) {
      const par = 0.28 + r * 0.2;
      const scale = 0.8 + r * 0.45;
      for (let i = 0; i < 4; i++) {
        const seed = r * 10 + i;
        const cx = ((this.hash(seed) * (w + 300) + time * (8 + r * 7)) % (w + 300)) - 150;
        const cy = ((h * 0.25 * (i + r * 0.4) + -this.cameraY * par) % (h + 240)) - 120;
        ctx.globalAlpha = vis * (0.5 + r * 0.2);
        ctx.fillStyle = "rgba(255, 238, 232, 1)";
        ctx.beginPath();
        ctx.arc(cx, cy, 34 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 38 * scale, cy - 14 * scale, 42 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 82 * scale, cy, 36 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 40 * scale, cy + 12 * scale, 38 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(244, 170, 190, 0.55)";
        ctx.beginPath();
        ctx.ellipse(cx + 40 * scale, cy + 30 * scale, 64 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Planetas y cometa del espacio (a partir de 950m) */
  private drawSpaceScenery(ctx: CanvasRenderingContext2D, m: number, time: number): void {
    const vis = this.ramp(m, 880, 1050);
    if (vis < 0.02) return;

    const w = this.width;
    const h = this.height;
    ctx.save();
    ctx.globalAlpha = vis;

    // Planeta con anillos
    const px = w * 0.2;
    const py = ((h * 0.2 + -this.cameraY * 0.06) % (h * 2)) - h * 0.3;
    const pr = Math.max(34, w * 0.06);
    const pg = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
    pg.addColorStop(0, "#FFB74D");
    pg.addColorStop(1, "#8E3A1B");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 224, 178, 0.7)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 1.7, pr * 0.42, -0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Planeta pequeño azul
    const qx = w * 0.8;
    const qy = ((h * 0.55 + -this.cameraY * 0.1) % (h * 2)) - h * 0.4;
    const qr = Math.max(18, w * 0.03);
    const qg = ctx.createRadialGradient(qx - qr * 0.3, qy - qr * 0.3, qr * 0.1, qx, qy, qr);
    qg.addColorStop(0, "#80DEEA");
    qg.addColorStop(1, "#1A4F8B");
    ctx.fillStyle = qg;
    ctx.beginPath();
    ctx.arc(qx, qy, qr, 0, Math.PI * 2);
    ctx.fill();

    // Cometa
    const ct = (time % 7) / 7;
    const cx = w * (1.1 - ct * 1.3);
    const cy = h * (0.08 + ct * 0.45);
    const tail = ctx.createLinearGradient(cx, cy, cx + 150, cy - 70);
    tail.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    tail.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.strokeStyle = tail;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 150, cy - 70);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /** Nieve (y polvo de estrellas en el espacio) en primer plano */
  private drawSnowfall(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const m = Math.max(0, -this.cameraY / 12);
    const space = this.ramp(m, 880, 1000);

    ctx.save();
    this.snowFlakes.forEach((f) => {
      const x = f.x * w + Math.sin(this.animTimer * f.drift + f.y * 20) * 18;
      const y = ((f.y * h + this.animTimer * f.speed + -this.cameraY * f.par) % (h + 20)) - 10;
      ctx.fillStyle = space > 0.5 ? `rgba(255, 224, 130, ${f.alpha * 0.7})` : `rgba(255, 255, 255, ${f.alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, f.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  /**
   * Líneas de velocidad vertical cuando asciende a alta velocidad
   */
  private drawSpeedLines(ctx: CanvasRenderingContext2D): void {
    const isHighSpeed = this.playerVy < -700 || this.isRocketActive;
    if (!isHighSpeed) return;

    ctx.save();
    this.speedLines.forEach((line) => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`;
      ctx.lineWidth = line.width;
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x, line.y + line.length);
      ctx.stroke();
    });
    ctx.restore();
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

      // Si está rota
      if (plat.broken) {
        if (plat.breakAlpha !== undefined && plat.breakAlpha <= 0) {
          ctx.restore();
          return;
        }
        ctx.globalAlpha = plat.breakAlpha !== undefined ? plat.breakAlpha : 0.8;
        drawY = plat.breakY || plat.y;
      }

      if (plat.type === "sponsor") {
        // Plataforma Dorada de Patrocinador Oficial
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

          ctx.drawImage(
            plat.sponsorLogo,
            emblemX + emblemSize * 0.08,
            emblemY + emblemSize * 0.08,
            emblemSize * 0.84,
            emblemSize * 0.84
          );

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
      } else if (plat.type === "cloud") {
        // Nube de malvavisco mágica (plataforma-nube.png)
        if (plat.cloudAlpha !== undefined) {
          ctx.globalAlpha = Math.min(ctx.globalAlpha, plat.cloudAlpha);
        }
        if (this.spritePlatNube && this.spritePlatNube.complete && this.spritePlatNube.naturalWidth > 0) {
          ctx.drawImage(this.spritePlatNube, plat.x, drawY - plat.h * 0.15, plat.w, plat.h * 1.35);
        } else {
          ctx.fillStyle = "#E1F5FE";
          this.roundRect(ctx, plat.x, drawY, plat.w, plat.h, 16);
          ctx.fill();
        }
      } else if (plat.type === "fragile") {
        // Plataforma de Hielo Cristalino (plataforma-hielo.png)
        if (plat.broken && plat.breakRot !== undefined) {
          // Dibujar dos mitades de hielo quebrándose
          const halfW = plat.w * 0.5;
          ctx.save();
          ctx.translate(plat.x + halfW * 0.5, drawY + plat.h * 0.5);
          ctx.rotate(-plat.breakRot);
          if (this.spritePlatHielo && this.spritePlatHielo.complete && this.spritePlatHielo.naturalWidth > 0) {
            ctx.drawImage(this.spritePlatHielo, 0, 0, this.spritePlatHielo.naturalWidth * 0.5, this.spritePlatHielo.naturalHeight, -halfW * 0.5, -plat.h * 0.5, halfW, plat.h);
          }
          ctx.restore();

          ctx.save();
          ctx.translate(plat.x + halfW * 1.5, drawY + plat.h * 0.5);
          ctx.rotate(plat.breakRot);
          if (this.spritePlatHielo && this.spritePlatHielo.complete && this.spritePlatHielo.naturalWidth > 0) {
            ctx.drawImage(this.spritePlatHielo, this.spritePlatHielo.naturalWidth * 0.5, 0, this.spritePlatHielo.naturalWidth * 0.5, this.spritePlatHielo.naturalHeight, -halfW * 0.5, -plat.h * 0.5, halfW, plat.h);
          }
          ctx.restore();
        } else {
          if (this.spritePlatHielo && this.spritePlatHielo.complete && this.spritePlatHielo.naturalWidth > 0) {
            ctx.drawImage(this.spritePlatHielo, plat.x, drawY - plat.h * 0.1, plat.w, plat.h * 1.25);
          } else {
            ctx.fillStyle = "rgba(129, 212, 250, 0.85)";
            this.roundRect(ctx, plat.x, drawY, plat.w, plat.h, 6);
            ctx.fill();
          }
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

        if (!plat.broken) {
          this.drawPlatformLights(ctx, plat, drawY);
        }

        // Resorte de bastón de caramelo para tipo "spring"
        if (plat.type === "spring") {
          const springW = 34;
          const compression = plat.springCompression || 0;
          const springH = 34 * (1 - compression * 0.45);
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
          }
          ctx.restore();
        }

        // Si es moving, brillo sutil en los extremos
        if (plat.type === "moving") {
          // Estela de viento detrás de la plataforma
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) {
            const lx = plat.moveDir > 0 ? plat.x - 8 - k * 9 : plat.x + plat.w + 8 + k * 9;
            ctx.beginPath();
            ctx.moveTo(lx, drawY + plat.h * (0.25 + k * 0.22));
            ctx.lineTo(lx + (plat.moveDir > 0 ? -10 : 10), drawY + plat.h * (0.25 + k * 0.22));
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(255, 215, 0, 0.85)";
          ctx.beginPath();
          ctx.arc(plat.x + 12, drawY + plat.h * 0.45, 3.5 + Math.sin(time * 5) * 1.5, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.w - 12, drawY + plat.h * 0.45, 3.5 + Math.cos(time * 5) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Coleccionables (Estrella, Regalo, Reloj o Cohete) flotando sobre la plataforma
      if (plat.hasItem && !plat.itemCollected && plat.type !== "sponsor") {
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
        } else if (plat.hasItem === "gift") {
          const giftSize = 28;
          if (this.spriteGift && this.spriteGift.complete && this.spriteGift.naturalWidth > 0) {
            ctx.save();
            ctx.shadowColor = "#FF1744";
            ctx.shadowBlur = 10;
            ctx.drawImage(this.spriteGift, itemX - giftSize / 2, itemY - giftSize / 2, giftSize, giftSize);
            ctx.restore();
          }
        } else if (plat.hasItem === "clock") {
          const clockSize = 32;
          if (this.spriteClock && this.spriteClock.complete && this.spriteClock.naturalWidth > 0) {
            ctx.save();
            ctx.shadowColor = "#00E5FF";
            ctx.shadowBlur = 12;
            ctx.drawImage(this.spriteClock, itemX - clockSize / 2, itemY - clockSize / 2, clockSize, clockSize);
            ctx.restore();
          }
        } else if (plat.hasItem === "rocket") {
          const rSize = 32;
          if (this.spriteRocket && this.spriteRocket.complete && this.spriteRocket.naturalWidth > 0) {
            ctx.save();
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 12;
            ctx.drawImage(this.spriteRocket, itemX - rSize / 2, itemY - rSize / 2, rSize, rSize);
            ctx.restore();
          }
        }
      }

      ctx.restore();
    });
  }

  /**
   * Dibuja los Bumpers Reboteadores Polares Arcade
   */
  private drawBumpers(ctx: CanvasRenderingContext2D): void {
    this.bumpers.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.pulseScale, b.pulseScale);

      const d = b.radius * 2;
      if (this.spriteBumper && this.spriteBumper.complete && this.spriteBumper.naturalWidth > 0) {
        ctx.shadowColor = b.pulseTimer > 0 ? "#00E5FF" : "rgba(0, 229, 255, 0.5)";
        ctx.shadowBlur = b.pulseTimer > 0 ? 18 : 8;
        ctx.drawImage(this.spriteBumper, -b.radius, -b.radius, d, d);
      } else {
        ctx.fillStyle = "#00E5FF";
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Anillo de pulso expansivo al rebotar
      if (b.pulseTimer > 0) {
        const ringProgress = 1 - b.pulseTimer / 0.22;
        ctx.strokeStyle = `rgba(0, 229, 255, ${1 - ringProgress})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius + ringProgress * 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  /**
   * Dibuja los Duendes del Hielo Aéreos
   */
  private drawGoblins(ctx: CanvasRenderingContext2D): void {
    this.goblins.forEach((g) => {
      ctx.save();
      const cx = g.x + g.w * 0.5;
      const cy = g.y + g.h * 0.5;
      ctx.translate(cx, cy);
      ctx.rotate(g.rot);

      if (g.isDefeated) {
        ctx.globalAlpha = g.defeatAlpha;
      }

      // Orientación horizontal del duende
      if (g.vx < 0 && !g.isDefeated) {
        ctx.scale(-1, 1);
      }

      if (this.spriteGoblin && this.spriteGoblin.complete && this.spriteGoblin.naturalWidth > 0) {
        ctx.shadowColor = "rgba(0, 229, 255, 0.6)";
        ctx.shadowBlur = 10;
        ctx.drawImage(this.spriteGoblin, -g.w * 0.5, -g.h * 0.5, g.w, g.h);
      } else {
        ctx.fillStyle = "#00B0FF";
        ctx.beginPath();
        ctx.arc(0, 0, g.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Alas translúcidas aleteando
      if (!g.isDefeated) {
        const flap = Math.sin(this.animTimer * 16 + g.timeOffset);
        ctx.fillStyle = "rgba(224, 247, 250, 0.65)";
        ctx.save();
        ctx.scale(1, flap);
        ctx.beginPath();
        ctx.ellipse(-g.w * 0.45, -4, 12, 6, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(g.w * 0.45, -4, 12, 6, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    // Rotación e inclinación
    ctx.rotate(this.playerRotation);

    // Orientación horizontal del elfo
    if (!this.playerFacingRight) {
      ctx.scale(-1, 1);
    }

    // Squash & Stretch dinámico según rebote y velocidad vertical
    let scaleX = 1;
    let scaleY = 1;
    if (this.squashTimer > 0) {
      const p = this.squashTimer / 0.22;
      scaleY = 1 - 0.24 * p;
      scaleX = 1 + 0.22 * p;
    } else if (this.playerVy < -250) {
      scaleY = 1.1;
      scaleX = 0.92;
    } else if (this.playerVy > 350) {
      scaleY = 0.94;
      scaleX = 1.05;
    }
    ctx.scale(scaleX, scaleY);

    const w = this.playerW;
    const h = this.playerH;

    // Mochila Cohete y llamaradas cuando está activo
    if (this.isRocketActive) {
      ctx.save();

      // Llamarada propulsora
      const flameH = 34 + Math.random() * 20;
      const grad = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.38 + flameH);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.2, "#FFD700");
      grad.addColorStop(0.65, "#FF6D00");
      grad.addColorStop(1, "rgba(255, 23, 68, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.28, h * 0.38);
      ctx.lineTo(w * 0.28, h * 0.38);
      ctx.lineTo(0, h * 0.38 + flameH);
      ctx.closePath();
      ctx.fill();

      // Mochila Cohete Navideño HD
      const rocketW = w * 0.58;
      const rocketH = rocketW * 1.02;
      if (this.spriteRocket && this.spriteRocket.complete && this.spriteRocket.naturalWidth > 0) {
        ctx.drawImage(this.spriteRocket, -rocketW * 0.85, -rocketH * 0.5, rocketW, rocketH);
      } else {
        ctx.fillStyle = "#D50000";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        this.roundRect(ctx, -w * 0.44, -h * 0.2, w * 0.24, h * 0.46, 6);
        ctx.fill();
        ctx.stroke();
      }

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
      ctx.fillStyle = "#2E7D32";
      this.roundRect(ctx, -w * 0.35, -h * 0.1, w * 0.7, h * 0.48, 8);
      ctx.fill();

      ctx.fillStyle = "#FFE0B2";
      ctx.beginPath();
      ctx.arc(0, -h * 0.22, w * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Estrellitas giratorias de mareo si fue golpeado por un duende
    if (this.dizzyTimer > 0) {
      ctx.save();
      const dizzyAngle = this.animTimer * 10;
      for (let s = 0; s < 3; s++) {
        const ang = dizzyAngle + (s * Math.PI * 2) / 3;
        const sx = Math.cos(ang) * (w * 0.38);
        const sy = -h * 0.55 + Math.sin(ang) * 8;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /** Ondas doradas que salen de la plataforma al aterrizar */
  private drawLandRings(ctx: CanvasRenderingContext2D): void {
    this.landRings.forEach((r) => {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 224, 130, ${(1 - r.t) * 0.85})`;
      ctx.lineWidth = 3 * (1 - r.t) + 1;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 12 + r.t * 54, 4 + r.t * 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  /** Imágenes residuales del elfo en ascensos rápidos */
  private drawGhosts(ctx: CanvasRenderingContext2D): void {
    if (!(this.spritePlayer.complete && this.spritePlayer.naturalWidth > 0)) return;
    this.ghosts.forEach((gh) => {
      ctx.save();
      ctx.globalAlpha = gh.alpha;
      ctx.translate(gh.x, gh.y);
      ctx.rotate(gh.rot);
      if (!gh.faceRight) ctx.scale(-1, 1);
      ctx.shadowColor = "#80DEEA";
      ctx.shadowBlur = 14;
      ctx.drawImage(this.spritePlayer, -this.playerW * 0.5, -this.playerH * 0.5, this.playerW, this.playerH);
      ctx.restore();
    });
  }

  /** Cuerda de luces navideñas bajo la plataforma */
  private drawPlatformLights(ctx: CanvasRenderingContext2D, plat: JumpPlatform, drawY: number): void {
    const bulbs = Math.max(3, Math.floor(plat.w / 24));
    const palette = ["#FF5252", "#FFD740", "#69F0AE", "#40C4FF"];
    const y0 = drawY + plat.h * 0.95;
    const x0 = plat.x + 10;
    const span = plat.w - 20;

    ctx.save();
    ctx.strokeStyle = "rgba(20, 30, 20, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + span / 2, y0 + 9, x0 + span, y0);
    ctx.stroke();

    for (let i = 0; i < bulbs; i++) {
      const f = bulbs === 1 ? 0.5 : i / (bulbs - 1);
      const bx = x0 + span * f;
      const by = y0 + Math.sin(f * Math.PI) * 4.5 + 2;
      const on = 0.55 + 0.45 * Math.sin(this.animTimer * 4 + i * 1.3 + plat.x);
      ctx.globalAlpha = on;
      ctx.shadowColor = palette[i % palette.length];
      ctx.shadowBlur = 8;
      ctx.fillStyle = palette[i % palette.length];
      ctx.beginPath();
      ctx.arc(bx, by + 2.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Dibuja los Banners de Altitud Celebratorios
   */
  private drawMilestoneBanner(ctx: CanvasRenderingContext2D): void {
    if (!this.activeBanner) return;

    ctx.save();
    const progress = this.activeBanner.timer / this.activeBanner.maxTimer;
    let alpha = 1;
    if (progress > 0.8) {
      alpha = (1 - progress) / 0.2;
    } else if (progress < 0.2) {
      alpha = progress / 0.2;
    }

    ctx.globalAlpha = alpha;

    const bannerW = Math.min(this.width * 0.85, 360);
    const bannerH = 58;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = this.height * 0.22;

    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerH);
    grad.addColorStop(0, "rgba(255, 215, 0, 0.95)");
    grad.addColorStop(1, "rgba(255, 145, 0, 0.95)");

    ctx.fillStyle = grad;
    this.roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 16px 'Titan One', 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.activeBanner.text, this.width / 2, bannerY + 20);

    ctx.fillStyle = "#7C2D12";
    ctx.font = "800 12px 'Titan One', 'Fredoka', sans-serif";
    ctx.fillText(this.activeBanner.subtext, this.width / 2, bannerY + 40);

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
    const altW = 168;
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
