/**
 * ==============================================================================
 * JUEGO: 🧝‍♂️ EL VUELO MÁGICO DEL ELFO (Flying Elf Magic Paraglider - 2D Fantasy)
 * ==============================================================================
 * 
 * ARQUITECTURA VISUAL UNIFICADA (Single Cohesive Christmas World):
 * - Un ÚNICO escenario panorámico continuo de Villa Navideña Mágica.
 * - Sin collages, sin recortes superpuestos de casas desalineadas, sin paneles extraños.
 * - Personaje 100% limpio y transparente con el Logo Oficial de la Feria Mágica en el parapente.
 * - Obstáculos ilustrados integrados (Chimenea rústica y Estalactitas de hielo).
 * - Coleccionables con sutil aura verde y Medallón de Poder con aura dorada.
 * - Scroll infinito continuo y pre-cargado desde el primer frame.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { ScreenTransition } from "../core/ScreenTransition";

export type ElfCharacterId = "feria" | "campus";

interface CollectibleItem {
  x: number;
  y: number;
  size: number;
  type: "gift_red" | "gift_green" | "candy" | "teddy" | "logo_feria" | "logo_campus" | "logo_star";
  points: number;
  bobOffset: number;
  bobSpeed: number;
  isMagnetized?: boolean;
}

interface ObstacleItem {
  x: number;
  y: number;
  baseY: number;
  width: number;
  height: number;
  baseHeight?: number;
  type: "house" | "icicle";
  isOscillating?: boolean;
  oscillateSpeed?: number;
  oscillateAmp?: number;
  oscillateTime?: number;
  smokeTimer?: number;
}

interface GroundProp {
  x: number;
  type: "lamp" | "tree" | "fence" | "gift_pile";
  scale: number;
  lightPhase: number;
}

interface BackgroundSign {
  x: number;
  type: "feria" | "sponsor";
  scale: number;
  lightPhase: number;
}

export class FlyingElfGame extends BaseGame {
  // Físicas y posición del Elfo
  private elfX: number = 240;
  private elfY: number = 550;
  private elfVy: number = 0;
  private elfAngle: number = 0;
  private elfTargetAngle: number = 0;
  private elfWidth: number = 175;
  private elfHeight: number = 175;

  // Parapente y balanceo orgánico
  private gliderSwayTime: number = 0;

  // Invulnerabilidad tras golpe
  private hitCooldown: number = 0;
  private isFlashing: boolean = false;

  // Power-Up Mágico (Turbo + Imán)
  private magnetRadius: number = 360;

  // Combo
  private comboCount: number = 0;
  private comboTimer: number = 0;

  // Listas de entidades activas
  private collectibles: CollectibleItem[] = [];
  private obstacles: ObstacleItem[] = [];
  private groundProps: GroundProp[] = [];
  private backgroundSigns: BackgroundSign[] = [];

  // Temporizadores de spawn y dificultad
  private spawnItemTimer: number = 0;
  private spawnObstacleTimer: number = 0;
  private logoSpawnTimer: number = 6.0; // Cadencia garantizada para Logos cada 8-10s
  private speedMultiplier: number = 1.0;
  private baseScrollSpeed: number = 460; // Velocidad base equilibrada para arcade accesible

  // Ráfagas de viento / Vórtice mágico
  private windTimer: number = 0;
  private isWindActive: boolean = false;
  private windForceY: number = 0;

  // Estado de audio para vuelo
  private wasThrusting: boolean = false;
  private flyAudioCooldown: number = 0;

  // Desplazamiento del Escenario Unificado
  private bgScrollX: number = 0;
  private groundScrollX: number = 0;

  // Partículas de humo de chimenea
  private chimneyPuffs: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number; maxLife: number; life: number }[] = [];

  // Selección de Personaje y Estado del Juego
  public selectedElf: ElfCharacterId = "feria";
  private gameState: "character-select" | "countdown" | "playing" = "character-select";
  private charSelectAnimTime: number = 0;

  // Assets Ilustrados Pre-cargados
  private imgElfFeria: HTMLImageElement;
  private imgElfCampus: HTMLImageElement;
  private imgIconFeria: HTMLImageElement;
  private imgIconCampus: HTMLImageElement;
  private imgLogoCampus: HTMLImageElement;
  private imgBgPanorama: HTMLImageElement;
  private imgHouseObstacle: HTMLImageElement;
  private imgIcicle: HTMLImageElement;
  private imgCartelFeria: HTMLImageElement;
  private imgCartelSponsor: HTMLImageElement;
  private imgTree: HTMLImageElement;
  private imgGiftRed: HTMLImageElement;
  private imgGiftGreen: HTMLImageElement;
  private imgGiftRed2: HTMLImageElement;
  private imgCandy: HTMLImageElement;
  private imgTeddy: HTMLImageElement;
  private imgStarLogo: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "flying-elf",
      "El Vuelo Mágico del Elfo",
      "¡Mantén pulsado para volar y suelta para planear! Recoge regalos y esquiva peligros.",
      canvas,
      input,
      audio,
      particles
    );

    // 1. Personajes Elfo con Parapente: Feria Mágica y Campuslands
    this.imgElfFeria = new Image();
    this.imgElfFeria.src = "./assets/images/elfo-volador.png";

    this.imgElfCampus = new Image();
    this.imgElfCampus.src = "./assets/images/elfo-volador-campus.png";

    this.imgIconFeria = new Image();
    this.imgIconFeria.src = "./assets/images/icon-elfo-feria.png";

    this.imgIconCampus = new Image();
    this.imgIconCampus.src = "./assets/images/icon-elfo-campus.png";

    this.imgLogoCampus = new Image();
    this.imgLogoCampus.src = "./assets/logos/logo-campus-sin-fondo.png";

    // 2. Único Fondo Panorámico Continuo de la Villa Navideña
    this.imgBgPanorama = new Image();
    this.imgBgPanorama.src = "./assets/images/fondo-villa-seamless.jpg";

    // 3. Obstáculos Ilustrados 2D (Casa navideña con tejado/chimenea y Estalactitas)
    this.imgHouseObstacle = new Image();
    this.imgHouseObstacle.src = "./assets/images/casa-obstaculo.png";

    this.imgIcicle = new Image();
    this.imgIcicle.src = "./assets/images/estalactita-hielo.png";

    // 4. Carteles de Publicidad con Logos Integrados en el Escenario
    this.imgCartelFeria = new Image();
    this.imgCartelFeria.src = "./assets/images/cartel-feria.png";

    this.imgCartelSponsor = new Image();
    this.imgCartelSponsor.src = "./assets/images/cartel-sponsor.png";

    // 5. Decoraciones de Piso
    this.imgTree = new Image();
    this.imgTree.src = "./assets/images/arbol.png";

    // 6. Coleccionables Ilustrados 2D
    this.imgGiftRed = new Image();
    this.imgGiftRed.src = "./assets/images/regalo-rojo.png";

    this.imgGiftGreen = new Image();
    this.imgGiftGreen.src = "./assets/images/regalo-verde.png";

    this.imgGiftRed2 = new Image();
    this.imgGiftRed2.src = "./assets/images/regalo-rojo2.png";

    this.imgCandy = new Image();
    this.imgCandy.src = "./assets/images/baston-caramelo.png";

    this.imgTeddy = new Image();
    this.imgTeddy.src = "./assets/images/osito.png";

    this.imgStarLogo = new Image();
    this.imgStarLogo.src = "./assets/images/estrella con logo.png";

    // Configuración del sistema de 5 Vidas
    this.showLives = false; // Se mostrará una vez inicie el vuelo activo tras la cuenta regresiva
    this.maxLives = 5;
    this.lives = 5;

    // Música temática exclusiva para El Vuelo Mágico del Elfo
    this.inGameMusicPath = "./assets/audio/The Builder.mp3";
    this.inGameMusicVolume = 0.50;
  }

  private totalPlayTime: number = 0;

  protected override onStart(): void {
    // Iniciar siempre en la pantalla de selección de Personaje
    this.gameState = "character-select";
    this.charSelectAnimTime = 0;
    this.showLives = false;
    this.maxLives = 5;
    this.lives = 5;
    this.totalPlayTime = 0;
    this.initialGameDuration = this.timeRemaining > 5 ? this.timeRemaining : 45;

    this.elfX = Math.max(140, this.width * 0.22);
    this.elfY = this.height * 0.45;
    this.elfVy = 0;
    this.elfAngle = 0;
    this.hitCooldown = 0;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.speedMultiplier = 1.0;
    this.bgScrollX = 0;
    this.groundScrollX = 0;
    this.chimneyPuffs = [];

    this.collectibles = [];
    this.obstacles = [];
    this.groundProps = [];
    this.backgroundSigns = [];
    this.spawnItemTimer = 0.4;
    this.spawnObstacleTimer = 1.1;
    this.logoSpawnTimer = 2.0;
    this.windTimer = 6.5;
    this.isWindActive = false;
    this.wasThrusting = false;
    this.flyAudioCooldown = 0;

    // Configuración de listeners táctiles para selección de personaje
    this.input.onPointerDown = (_pointerId: number, x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;
      if (this.gameState === "character-select") {
        this.handleCharacterSelectTouch(x, y);
      }
    };

    // Inicializar decoraciones del suelo y carteles publicitarios de fondo
    this.initGroundProps();
    this.initBackgroundSigns();
  }

  private initBackgroundSigns(): void {
    const spacing = 480;
    const count = Math.ceil(this.width / spacing) + 3;
    for (let i = 0; i < count; i++) {
      this.backgroundSigns.push({
        x: i * spacing + 100,
        type: i % 2 === 0 ? "feria" : "sponsor",
        scale: 1.0 + Math.random() * 0.15,
        lightPhase: Math.random() * Math.PI * 2
      });
    }
  }

  private initGroundProps(): void {
    const spacing = 180;
    const count = Math.ceil(this.width / spacing) + 3;
    const propTypes: ("lamp" | "tree" | "fence" | "gift_pile")[] = ["lamp", "tree", "fence", "gift_pile", "lamp", "tree"];
    for (let i = 0; i < count; i++) {
      this.groundProps.push({
        x: i * spacing + (Math.random() * 40 - 20),
        type: propTypes[i % propTypes.length],
        scale: 0.85 + Math.random() * 0.3,
        lightPhase: Math.random() * Math.PI * 2
      });
    }
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.elfX = Math.max(140, this.width * 0.22);
    this.elfWidth = Math.max(130, Math.min(195, this.width * 0.22));
    this.elfHeight = this.elfWidth;
  }

  protected override onUpdate(dt: number): void {
    if (this.gameState === "character-select") {
      this.timeRemaining = this.initialGameDuration;
      this.charSelectAnimTime += dt;
      this.bgScrollX += 35 * dt;
      this.groundScrollX += 65 * dt;
      this.gliderSwayTime += dt * 3.5;

      // Navegación por teclado en la pantalla de selección
      if (this.input.isKeyDown("Digit1") || this.input.isKeyDown("KeyA") || this.input.isKeyDown("ArrowLeft")) {
        this.selectCharacter("feria");
      } else if (this.input.isKeyDown("Digit2") || this.input.isKeyDown("KeyD") || this.input.isKeyDown("ArrowRight")) {
        this.selectCharacter("campus");
      }

      if (this.input.isKeyDown("Space") || this.input.isKeyDown("Enter")) {
        this.startGameWithCountdown();
      }

      return;
    }

    if (this.gameState === "countdown") {
      this.timeRemaining = this.initialGameDuration;
      this.gliderSwayTime += dt * 3.5;
      return;
    }

    this.totalPlayTime += dt;

    // 1. Progresión de Dificultad Dinámica Continua (A más tiempo de juego, mayor velocidad y reto)
    const timeProgress = this.totalPlayTime;
    let baseMultiplier = 1.0;
    if (timeProgress < 10) {
      baseMultiplier = 1.0 + (timeProgress / 10) * 0.22; // 1.00x -> 1.22x
    } else if (timeProgress < 22) {
      baseMultiplier = 1.22 + ((timeProgress - 10) / 12) * 0.38; // 1.22x -> 1.60x
    } else if (timeProgress < 38) {
      baseMultiplier = 1.60 + ((timeProgress - 22) / 16) * 0.45; // 1.60x -> 2.05x
    } else {
      baseMultiplier = Math.min(2.45, 2.05 + ((timeProgress - 38) / 20) * 0.40); // 2.05x -> 2.45x
    }

    this.speedMultiplier = baseMultiplier;

    if (this.isLogoPowerUpActive) {
      this.speedMultiplier *= 1.25; // Turbo activo
    }

    const currentScrollSpeed = this.baseScrollSpeed * this.speedMultiplier * dt;
    this.bgScrollX += currentScrollSpeed * 0.44;
    this.groundScrollX += currentScrollSpeed * 1.0;
    this.gliderSwayTime += dt * 4.6;

    // 2. Sistema de Viento / Turbulencia Mágica Agradable (Más dinámico a medida que avanza la partida)
    this.windTimer -= dt;
    if (this.windTimer <= 0) {
      if (!this.isWindActive) {
        this.isWindActive = true;
        this.windTimer = 2.8 + Math.random() * 1.0;
        const windIntensity = (240 + Math.random() * 160) * Math.min(1.4, this.speedMultiplier);
        this.windForceY = (Math.random() > 0.5 ? 1 : -1) * windIntensity;
        this.audio.playWindGust();
      } else {
        this.isWindActive = false;
        this.windTimer = Math.max(4.0, (7.0 - (this.totalPlayTime / 15)) + Math.random() * 3.0);
        this.windForceY = 0;
      }
    }

    // 3. Entrada de Usuario: Pantalla Táctil o Teclado
    const pointer = this.input.getPrimaryPointer();
    const isTouchThrust = pointer ? pointer.isDown : false;
    const isKeyboardThrust =
      this.input.isKeyDown("Space") ||
      this.input.isKeyDown("KeyW") ||
      this.input.isKeyDown("ArrowUp");

    const thrusting = isTouchThrust || isKeyboardThrust;

    // Reproducir efecto de sonido de aleteo/vuelo aleatorio (elfo_volar1 / elfo_volar2)
    if (thrusting) {
      if (!this.wasThrusting) {
        this.audio.playElfFly();
        this.flyAudioCooldown = 0.35;
      } else {
        this.flyAudioCooldown -= dt;
        if (this.flyAudioCooldown <= 0) {
          this.audio.playElfFly();
          this.flyAudioCooldown = 0.38;
        }
      }
    }
    this.wasThrusting = thrusting;

    // 4. Físicas ágiles pero dóciles del Elfo
    const gravity = 1420; // px/s^2
    const lift = 2380;    // px/s^2

    if (thrusting) {
      this.elfVy -= lift * dt;
      if (this.elfVy < -580) this.elfVy = -580;
      this.elfTargetAngle = -0.22;

      // Estela mágica de vuelo adaptada al personaje elegido
      if (Math.random() < 0.48) {
        const exhaustX = this.elfX - this.elfWidth * 0.28;
        const exhaustY = this.elfY + this.elfHeight * 0.12;
        const isCampus = this.selectedElf === "campus";
        const trailColor = this.isLogoPowerUpActive
          ? (isCampus ? "#00E5FF" : "#FFD700")
          : (isCampus ? "#80D8FF" : "#FFF59D");
        this.particles.emitBurst(
          exhaustX,
          exhaustY,
          trailColor,
          1
        );
      }
    } else {
      this.elfVy += gravity * dt;
      if (this.elfVy > 600) this.elfVy = 600;
      this.elfTargetAngle = 0.16;
    }

    // Efecto de viento sobre el elfo
    if (this.isWindActive) {
      this.elfVy += this.windForceY * dt * 0.65;
    }

    // Suavizado del ángulo de cabeceo
    this.elfAngle += (this.elfTargetAngle - this.elfAngle) * 8.0 * dt;

    // Actualizar posición vertical
    this.elfY += this.elfVy * dt;

    // Límites de pantalla seguros
    const minY = 90;
    const maxY = this.height - 130;
    if (this.elfY < minY) {
      this.elfY = minY;
      this.elfVy = 0;
    } else if (this.elfY > maxY) {
      this.elfY = maxY;
      this.elfVy = 0;
    }

    // Cooldown de golpe con parpadeo visual
    if (this.hitCooldown > 0) {
      this.hitCooldown -= dt;
      this.isFlashing = Math.floor(this.hitCooldown * 14) % 2 === 0;
    } else {
      this.isFlashing = false;
    }

    // Temporizador de Combo
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Power-up de Logo activo (Turbo + Imán)
    if (this.isLogoPowerUpActive) {
      this.logoPowerUpTimer -= dt;
      if (this.logoPowerUpTimer <= 0) {
        this.isLogoPowerUpActive = false;
      } else if (Math.random() < 0.3) {
        this.particles.emitBurst(
          this.elfX + (Math.random() - 0.5) * 50,
          this.elfY + (Math.random() - 0.5) * 50,
          "#FFD700",
          1
        );
      }
    }

    // 5. Actualizar Entidades, Carteles de Publicidad y Decoraciones
    this.updateBackgroundSigns(dt, currentScrollSpeed);
    this.updateGroundProps(dt, currentScrollSpeed);
    this.updateCollectibles(dt, currentScrollSpeed);
    this.updateObstacles(dt, currentScrollSpeed);
    this.updateChimneyPuffs(dt);

    // 6. Generación de Nuevos Objetos y Obstáculos Equilibrados
    this.spawnItemTimer -= dt;
    if (this.spawnItemTimer <= 0) {
      this.spawnCollectiblePattern();
      this.spawnItemTimer = Math.max(0.38, 0.95 / this.speedMultiplier);
    }

    // Chequeo de aparición de Logos Oficiales: Alta frecuencia garantizada (cada 4 a 6 segundos)
    this.logoSpawnTimer -= dt;
    if (this.logoSpawnTimer <= 0) {
      this.logoSpawnTimer = 4.0 + Math.random() * 2.0;
      if (!this.isLogoPowerUpActive) {
        this.spawnLogoMedallion();
      }
    }

    this.spawnObstacleTimer -= dt;
    if (this.spawnObstacleTimer <= 0) {
      this.spawnObstacle();
      this.spawnObstacleTimer = Math.max(0.70, 1.50 / this.speedMultiplier);
    }
  }

  private updateBackgroundSigns(_dt: number, scrollSpeed: number): void {
    const spacing = 520;
    for (let i = 0; i < this.backgroundSigns.length; i++) {
      const sign = this.backgroundSigns[i];
      sign.x -= scrollSpeed * 0.72; // Movimiento de fondo medio / parallax
      sign.lightPhase += _dt * 3.0;
    }

    for (let i = 0; i < this.backgroundSigns.length; i++) {
      const sign = this.backgroundSigns[i];
      if (sign.x < -220) {
        let maxX = 0;
        for (const s of this.backgroundSigns) {
          if (s.x > maxX) maxX = s.x;
        }
        sign.x = Math.max(this.width + 80, maxX + spacing + (Math.random() * 60 - 30));
        sign.type = Math.random() > 0.5 ? "feria" : "sponsor";
        sign.scale = 0.95 + Math.random() * 0.15;
      }
    }
  }

  private updateGroundProps(_dt: number, scrollSpeed: number): void {
    const spacing = 190;
    for (let i = 0; i < this.groundProps.length; i++) {
      const prop = this.groundProps[i];
      prop.x -= scrollSpeed;
      prop.lightPhase += _dt * 3.5;
    }

    // Reciclar props que salen por la izquierda
    for (let i = 0; i < this.groundProps.length; i++) {
      const prop = this.groundProps[i];
      if (prop.x < -160) {
        // Encontrar el prop más a la derecha
        let maxX = 0;
        for (const p of this.groundProps) {
          if (p.x > maxX) maxX = p.x;
        }
        prop.x = Math.max(this.width + 40, maxX + spacing + (Math.random() * 30 - 15));
        const propTypes: ("lamp" | "tree" | "fence" | "gift_pile")[] = ["lamp", "tree", "fence", "gift_pile"];
        prop.type = propTypes[Math.floor(Math.random() * propTypes.length)];
        prop.scale = 0.85 + Math.random() * 0.3;
      }
    }
  }

  private updateChimneyPuffs(dt: number): void {
    for (let i = this.chimneyPuffs.length - 1; i >= 0; i--) {
      const p = this.chimneyPuffs[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += dt * 14;
      p.alpha = Math.max(0, (1 - p.life / p.maxLife) * 0.65);

      if (p.life >= p.maxLife || p.x < -50) {
        this.chimneyPuffs.splice(i, 1);
      }
    }
  }

  private spawnCollectiblePattern(): void {
    // 15% de probabilidad de generar un logo directamente si no hay power-up activo
    if (!this.isLogoPowerUpActive && Math.random() < 0.15) {
      this.spawnLogoMedallion();
      return;
    }

    const types: ("gift_red" | "gift_green" | "candy" | "teddy")[] = [
      "gift_red",
      "gift_green",
      "candy",
      "gift_red",
      "candy",
      "teddy"
    ];

    const chosenType = types[Math.floor(Math.random() * types.length)];
    let points = 100;
    let size = 64;

    if (chosenType === "gift_red") {
      points = 100;
      size = 66;
    } else if (chosenType === "gift_green") {
      points = 150;
      size = 66;
    } else if (chosenType === "candy") {
      points = 50;
      size = 60;
    } else if (chosenType === "teddy") {
      points = 250;
      size = 74;
    }

    const baseSpawnY = 140 + Math.random() * (this.height - 350);

    // Ocasionalmente genera una fila o arco de 2-3 coleccionables desafiantes
    const patternCount = Math.random() < 0.35 ? 2 : 1;
    for (let k = 0; k < patternCount; k++) {
      const offsetX = k * 70;
      const offsetY = k * (Math.random() > 0.5 ? 35 : -35);
      const clampedY = Math.max(120, Math.min(this.height - 180, baseSpawnY + offsetY));

      this.collectibles.push({
        x: this.width + 80 + offsetX,
        y: clampedY,
        size: size,
        type: chosenType,
        points: points,
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 3.0 + Math.random() * 1.5
      });
    }
  }

  /**
   * Genera un Medallón de Logo Oficial (Feria Mágica / Campuslands) en trayectoria accesible
   */
  private spawnLogoMedallion(): void {
    const brandLogo: "logo_feria" | "logo_campus" | "logo_star" =
      Math.random() < 0.48 ? "logo_feria" : Math.random() < 0.88 ? "logo_campus" : "logo_star";

    const baseSpawnY = 160 + Math.random() * (this.height - 400);
    const clampedY = Math.max(140, Math.min(this.height - 200, baseSpawnY));

    this.collectibles.push({
      x: this.width + 90,
      y: clampedY,
      size: 94,
      type: brandLogo,
      points: 500,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 3.2
    });

    // Destello de anticipación mágica
    this.particles.emitBurst(this.width + 80, clampedY, "#FFD700", 16);
  }

  private spawnObstacle(): void {
    const isTopObstacle = Math.random() > 0.52;
    const canOscillate = this.totalPlayTime > 8 && Math.random() < Math.min(0.65, 0.35 + (this.totalPlayTime / 45));

    if (isTopObstacle) {
      // Estalactita de hielo colgante firmemente anclada al borde superior del cielo
      const oWidth = 105 + Math.random() * 30;
      const oHeight = 170 + Math.random() * 120;
      this.obstacles.push({
        x: this.width + 100,
        y: -10,
        baseY: -10,
        width: oWidth,
        height: oHeight,
        baseHeight: oHeight,
        type: "icicle",
        isOscillating: canOscillate,
        oscillateSpeed: (2.2 + Math.random() * 1.8) * Math.min(1.5, this.speedMultiplier),
        oscillateAmp: (25 + Math.random() * 30) * Math.min(1.4, this.speedMultiplier),
        oscillateTime: Math.random() * Math.PI * 2
      });
    } else {
      // Casa rústica navideña con tejado nevado y chimenea humeante en la cima
      const oWidth = 230 + Math.random() * 55;
      const oHeight = 240 + Math.random() * 100;
      const startY = this.height - oHeight - 20;
      this.obstacles.push({
        x: this.width + 100,
        y: startY,
        baseY: startY,
        width: oWidth,
        height: oHeight,
        type: "house",
        smokeTimer: 0.1
      });
    }
  }

  private updateCollectibles(dt: number, scrollSpeed: number): void {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      let beingPulled = false;

      // Atracción magnética en tiempo real si el Power-Up está activo
      if (this.isLogoPowerUpActive) {
        const dx = this.elfX - item.x;
        const dy = this.elfY - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.magnetRadius && dist > 1) {
          beingPulled = true;
          const pullForce = 920 * dt;
          item.x += (dx / dist) * pullForce;
          item.y += (dy / dist) * pullForce;
        }
      }

      // Si no está siendo atraído activamente por el imán, se desplaza y oscila normalmente (NUNCA se queda congelado)
      if (!beingPulled) {
        item.x -= scrollSpeed;
        item.bobOffset += item.bobSpeed * dt;
      }

      // Colisión circular precisa con el Elfo
      const elfHitboxRadius = 46;
      const itemRadius = item.size * 0.42;
      const currentY = item.y + Math.sin(item.bobOffset) * 10;

      const cdx = this.elfX - item.x;
      const cdy = this.elfY - currentY;
      const distElf = Math.sqrt(cdx * cdx + cdy * cdy);

      if (distElf < elfHitboxRadius + itemRadius) {
        this.collectItem(item, i);
        continue;
      }

      if (item.x < -120) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  private collectItem(item: CollectibleItem, index: number): void {
    this.collectibles.splice(index, 1);

    // Incrementar combo
    this.comboCount++;
    this.comboTimer = 2.8;
    const comboMultiplier = Math.min(5, Math.floor(1 + this.comboCount / 3));

    let finalPoints = item.points * comboMultiplier;
    if (this.isLogoPowerUpActive) {
      finalPoints *= 2;
    }

    this.score += finalPoints;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Feedback visual y de audio
    if (item.type === "logo_feria") {
      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 7.0;
      this.timeRemaining = Math.min(45, this.timeRemaining + 6.0); // +6s Tiempo Extra
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 35);
      this.addFloatingText("¡FERIA MÁGICA! +6s & IMÁN x2", this.elfX, this.elfY - 45, "#FFD700", 1.4);
    } else if (item.type === "logo_campus") {
      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 7.0;
      this.timeRemaining = Math.min(45, this.timeRemaining + 6.0); // +6s Tiempo Extra
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 35);
      this.addFloatingText("¡CAMPUSLANDS! +6s & IMÁN x2", this.elfX, this.elfY - 45, "#00E5FF", 1.4);
    } else if (item.type === "logo_star") {
      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 6.0;
      this.timeRemaining = Math.min(45, this.timeRemaining + 5.0); // +5s Tiempo Extra
      this.audio.playGiftUnwrap();
      this.particles.emitBurst(this.elfX, this.elfY, "#FFD700", 25);
      this.addFloatingText("¡TURBO + IMÁN +5s!", this.elfX, this.elfY - 45, "#FFE082", 1.35);
    } else {
      this.audio.playElfCollectItem();
      this.particles.emitBurst(this.elfX, this.elfY, "#00E676", 6);
      const comboLabel = comboMultiplier > 1 ? ` (x${comboMultiplier})` : "";
      this.addFloatingText(`+${finalPoints}${comboLabel}`, item.x, item.y, "#76FF03", 1.15);
    }
  }

  private updateObstacles(dt: number, scrollSpeed: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= scrollSpeed;

      // Movimiento oscilante dinámico: las casas no oscilan en Y; las estalactitas crecen/disminuyen su longitud sin separarse del techo
      if (obs.isOscillating && obs.oscillateSpeed && obs.oscillateAmp !== undefined) {
        obs.oscillateTime = (obs.oscillateTime || 0) + dt * obs.oscillateSpeed;
        if (obs.type === "icicle" && obs.baseHeight) {
          obs.y = -10; // Siempre firmemente anclada al borde superior (sin cortes flotantes)
          obs.height = obs.baseHeight + Math.sin(obs.oscillateTime) * obs.oscillateAmp;
        } else {
          obs.y = obs.baseY + Math.sin(obs.oscillateTime) * obs.oscillateAmp;
        }
      }

      // Emisión de humo y chispas cálidas desde la chimenea de la casa
      if (obs.type === "house") {
        obs.smokeTimer = (obs.smokeTimer || 0) - dt;
        if (obs.smokeTimer <= 0) {
          obs.smokeTimer = 0.16 + Math.random() * 0.14;
          const chimneyTopX = obs.x + obs.width * 0.67;
          const chimneyTopY = obs.y + obs.height * 0.12;

          this.chimneyPuffs.push({
            x: chimneyTopX + (Math.random() * 12 - 6),
            y: chimneyTopY,
            vx: -scrollSpeed * 0.45 + (Math.random() * 16 - 8),
            vy: -48 - Math.random() * 32,
            radius: 8 + Math.random() * 6,
            alpha: 0.65,
            maxLife: 1.4,
            life: 0
          });
        }
      }

      // Colisión precisa con la hitbox del Elfo
      const elfLeft = this.elfX - 34;
      const elfRight = this.elfX + 34;
      const elfTop = this.elfY - 38;
      const elfBottom = this.elfY + 38;

      if (obs.type === "icicle") {
        const obsLeft = obs.x + obs.width * 0.18;
        const obsRight = obs.x + obs.width * 0.82;
        const obsTop = obs.y;
        const obsBottom = obs.y + obs.height;

        if (
          elfRight > obsLeft &&
          elfLeft < obsRight &&
          elfBottom > obsTop &&
          elfTop < obsBottom
        ) {
          this.hitObstacle(obs, i);
        }
      } else if (obs.type === "house") {
        // Colisión en 2 bloques: Tejado/Chimenea superior y Cuerpo de la casa
        // 1. Tejado y Chimenea (zona alta)
        const roofLeft = obs.x + obs.width * 0.26;
        const roofRight = obs.x + obs.width * 0.78;
        const roofTop = obs.y + obs.height * 0.08;
        const roofBottom = obs.y + obs.height * 0.50;

        // 2. Base de la casa (zona inferior)
        const baseLeft = obs.x + obs.width * 0.12;
        const baseRight = obs.x + obs.width * 0.88;
        const baseTop = obs.y + obs.height * 0.50;
        const baseBottom = obs.y + obs.height;

        const hitRoof = elfRight > roofLeft && elfLeft < roofRight && elfBottom > roofTop && elfTop < roofBottom;
        const hitBase = elfRight > baseLeft && elfLeft < baseRight && elfBottom > baseTop && elfTop < baseBottom;

        if (hitRoof || hitBase) {
          this.hitObstacle(obs, i);
        }
      }

      if (obs.x < -280) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private hitObstacle(obs: ObstacleItem, index: number): void {
    // Si el escudo de turbo está activo, destruye el obstáculo
    if (this.isLogoPowerUpActive) {
      this.obstacles.splice(index, 1);
      this.particles.emitBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, "#FFD700", 22);
      this.audio.playTap();
      this.addFloatingText("¡DESTRUIDO! +300", obs.x, obs.y, "#FFE082", 1.25);
      this.score += 300;
      return;
    }

    if (this.hitCooldown > 0) return;

    this.hitCooldown = 1.4;
    this.lives--;
    this.comboCount = 0;

    // Feedback de impacto controlado
    this.triggerShake(0.38, 14);
    this.audio.playElfHit();
    this.particles.emitBurst(this.elfX, this.elfY, "#FF1744", 20);
    this.addFloatingText(`-1 VIDA (${Math.max(0, this.lives)}/5)`, this.elfX, this.elfY - 45, "#FF1744", 1.35);

    if (this.lives <= 0) {
      this.lives = 0;
      this.timeRemaining = 0;
      this.isFinishing = true;
      this.finishTimer = 1.6;
      this.audio.stopGameBGM();
      this.audio.playError();
      this.particles.emitBurst(this.elfX, this.elfY, "#FF3D00", 35);
      this.addFloatingText("¡SIN VIDAS!", this.width / 2, this.height * 0.45, "#FF1744", 1.8);
    }
  }

  protected override onDraw(ctx: CanvasRenderingContext2D): void {
    // ========================================================================
    // 1. FONDO OBLIGATORIO: UN ÚNICO MUNDO VISUAL CONTINUO
    // ========================================================================
    this.renderSingleUnifiedWorld(ctx);

    // ========================================================================
    // 2. CARTELES PUBLICITARIOS INTEGRADOS EN LA VILLA (Logos Oficiales)
    // ========================================================================
    this.renderBackgroundSigns(ctx);

    // ========================================================================
    // 3. HUMO DE CHIMENEAS Y EFECTOS DE VIENTO
    // ========================================================================
    this.renderChimneyPuffs(ctx);
    if (this.isWindActive) {
      this.renderWindGusts(ctx);
    }

    // ========================================================================
    // PANTALLA DE SELECCIÓN DE PERSONAJE
    // ========================================================================
    if (this.gameState === "character-select") {
      this.renderAtmosphere(ctx);
      this.renderCharacterSelect(ctx);
      return;
    }

    // ========================================================================
    // 4. ELEMENTOS DE GAMEPLAY: Obstáculos y Coleccionables
    // ========================================================================
    this.renderObstacles(ctx);
    this.renderCollectibles(ctx);

    // ========================================================================
    // 5. DECORACIÓN DEL SUELO (Farolas, Árboles, Vallas con Luces, Montículos)
    // ========================================================================
    this.renderGroundDecorations(ctx);

    // ========================================================================
    // 6. PERSONAJE: Elfo Mensajero con Parapente Oficial Elegido
    // ========================================================================
    this.renderElf(ctx);

    // ========================================================================
    // 7. AMBIENTE Y HUD: Nieve flotante y medidores arcade
    // ========================================================================
    this.renderAtmosphere(ctx);
    this.renderHUDOverlay(ctx);
  }

  private initialGameDuration: number = 45;

  /**
   * Cambia el personaje seleccionado con feedback visual y sonoro
   */
  public selectCharacter(character: ElfCharacterId): void {
    if (this.selectedElf === character) return;
    this.selectedElf = character;
    this.audio.playBellNote(character === "feria" ? 0 : 2);
    this.particles.emitBurst(
      this.width / 2,
      this.height * 0.45,
      character === "campus" ? "#00E5FF" : "#FFD700",
      16
    );
  }

  /**
   * Inicia el juego con la cinemática de cuenta regresiva oficial 3-2-1
   */
  public startGameWithCountdown(): void {
    if (this.gameState !== "character-select") return;
    this.gameState = "countdown";
    this.audio.playCountdownStep(3);

    const mainContainer = document.getElementById("game-container") || document.body;
    ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
      this.gameState = "playing";
      this.showLives = true;
      this.timeRemaining = this.initialGameDuration;
      this.totalPlayTime = 0;
      this.audio.playGameBGM(this.inGameMusicPath, this.inGameMusicVolume);
    });
  }

  /**
   * Obtiene la geometría y coordenadas de las tarjetas interactivas de personaje
   */
  private getCharacterSelectLayout(): {
    titleY: number;
    subtitleY: number;
    card1: { x: number; y: number; w: number; h: number };
    card2: { x: number; y: number; w: number; h: number };
    btn: { x: number; y: number; w: number; h: number };
    hintY: number;
    isTwoCol: boolean;
  } {
    const isLandscape = this.width > this.height;
    const isTwoCol = (this.width >= 560 && isLandscape) || (this.width >= 720 && this.width / this.height >= 0.88);
    const isShortHeight = this.height < 520;

    const titleY = isShortHeight ? Math.max(20, this.height * 0.075) : Math.max(36, this.height * 0.095);
    const subtitleY = titleY + (isShortHeight ? 18 : 26);
    const cardStartY = subtitleY + (isShortHeight ? 12 : 20);

    if (isTwoCol) {
      const pad = isShortHeight ? 14 : Math.min(32, this.width * 0.035);
      const cardW = (this.width - pad * 3) / 2;
      const btnH = isShortHeight ? 40 : Math.min(64, this.height * 0.085);
      const bottomReserved = btnH + (isShortHeight ? 24 : 44);
      const maxCardH = isShortHeight ? Math.max(100, this.height - cardStartY - bottomReserved) : 380;
      const cardH = Math.min(maxCardH, Math.max(100, this.height - cardStartY - bottomReserved));

      const card1 = { x: pad, y: cardStartY, w: cardW, h: cardH };
      const card2 = { x: pad * 2 + cardW, y: cardStartY, w: cardW, h: cardH };

      const btnW = Math.min(360, Math.max(200, this.width * 0.44));
      const btnY = cardStartY + cardH + (isShortHeight ? 6 : 14);
      const btn = { x: (this.width - btnW) / 2, y: btnY, w: btnW, h: btnH };
      const hintY = btnY + btnH + (isShortHeight ? 12 : 18);

      return { titleY, subtitleY, card1, card2, btn, hintY, isTwoCol };
    } else {
      // Single column (Mobile portrait, vertical totems, kiosks)
      const cardW = Math.min(480, this.width * 0.92);
      const cardX = (this.width - cardW) / 2;
      const btnH = isShortHeight ? 42 : Math.min(60, Math.max(44, this.height * 0.065));
      const gap = Math.max(8, Math.min(14, this.height * 0.015));
      const bottomReserved = btnH + (isShortHeight ? 26 : 46);
      const availableH = this.height - cardStartY - bottomReserved;
      const cardH = Math.min(220, Math.max(76, (availableH - gap) / 2));

      const card1Y = cardStartY;
      const card2Y = card1Y + cardH + gap;
      const card1 = { x: cardX, y: card1Y, w: cardW, h: cardH };
      const card2 = { x: cardX, y: card2Y, w: cardW, h: cardH };

      const btnW = Math.min(360, this.width * 0.86);
      const btnY = card2Y + cardH + Math.max(6, gap);
      const btn = { x: (this.width - btnW) / 2, y: btnY, w: btnW, h: btnH };
      const hintY = btnY + btnH + 16;

      return { titleY, subtitleY, card1, card2, btn, hintY, isTwoCol };
    }
  }

  /**
   * Procesa toques y clics en la pantalla de selección de personaje
   */
  private handleCharacterSelectTouch(x: number, y: number): void {
    const layout = this.getCharacterSelectLayout();

    // Tocar Tarjeta 1 (Feria Mágica)
    if (
      x >= layout.card1.x &&
      x <= layout.card1.x + layout.card1.w &&
      y >= layout.card1.y &&
      y <= layout.card1.y + layout.card1.h
    ) {
      if (this.selectedElf === "feria") {
        this.startGameWithCountdown();
      } else {
        this.selectCharacter("feria");
      }
      return;
    }

    // Tocar Tarjeta 2 (Campuslands)
    if (
      x >= layout.card2.x &&
      x <= layout.card2.x + layout.card2.w &&
      y >= layout.card2.y &&
      y <= layout.card2.y + layout.card2.h
    ) {
      if (this.selectedElf === "campus") {
        this.startGameWithCountdown();
      } else {
        this.selectCharacter("campus");
      }
      return;
    }

    // Tocar Botón "¡A VOLAR!"
    if (
      x >= layout.btn.x &&
      x <= layout.btn.x + layout.btn.w &&
      y >= layout.btn.y &&
      y <= layout.btn.y + layout.btn.h
    ) {
      this.startGameWithCountdown();
    }
  }

  /**
   * Renderiza la interfaz de selección de personaje (Stylized 2D Fantasy Art)
   */
  private renderCharacterSelect(ctx: CanvasRenderingContext2D): void {
    const layout = this.getCharacterSelectLayout();

    ctx.save();

    // 1. Overlay translúcido de noche mágica
    ctx.fillStyle = "rgba(4, 12, 28, 0.88)";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Resplandor central decorativo
    const centerGlow = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.45,
      20,
      this.width / 2,
      this.height * 0.45,
      this.width * 0.7
    );
    centerGlow.addColorStop(0, "rgba(255, 215, 0, 0.08)");
    centerGlow.addColorStop(0.5, "rgba(0, 229, 255, 0.05)");
    centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. Título y Subtítulo Cinemático
    ctx.textAlign = "center";
    const titleSize = Math.max(16, Math.min(34, this.width * 0.042));

    // Sombra 3D dorada
    ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#FFD700";
    ctx.font = `900 ${titleSize}px 'Outfit', sans-serif`;
    ctx.fillText("🧝‍♂️ ELIGE A TU ELFO MÁGICO", this.width / 2, layout.titleY);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const subtitleSize = Math.max(10, Math.min(15, titleSize * 0.5));
    ctx.font = `600 ${subtitleSize}px 'Outfit', sans-serif`;
    ctx.fillText("Selecciona a tu mensajero navideño para volar", this.width / 2, layout.subtitleY);

    // 4. Renderizado de Tarjetas de Personaje
    const isTwoCol = layout.isTwoCol;

    // === TARJETA 1: ELFO FERIA MÁGICA ===
    const isFeriaSelected = this.selectedElf === "feria";
    this.renderElfCard(
      ctx,
      layout.card1,
      "feria",
      "ELFO FERIA MÁGICA",
      "Logo Oficial Feria Mágica • Vuelo Festivo",
      "#FFD700",
      "rgba(255, 215, 0, 0.4)",
      this.imgElfFeria,
      isFeriaSelected,
      isTwoCol
    );

    // === TARJETA 2: ELFO CAMPUSLANDS ===
    const isCampusSelected = this.selectedElf === "campus";
    this.renderElfCard(
      ctx,
      layout.card2,
      "campus",
      "ELFO CAMPUSLANDS",
      "Logo Oficial Campuslands • Vuelo Cósmico",
      "#00E5FF",
      "rgba(0, 229, 255, 0.4)",
      this.imgElfCampus,
      isCampusSelected,
      isTwoCol
    );

    // === BOTÓN DE ACCIÓN: ¡A VOLAR! ===
    const btnPulse = Math.sin(this.charSelectAnimTime * 4.5) * 0.035;
    ctx.save();
    ctx.translate(layout.btn.x + layout.btn.w / 2, layout.btn.y + layout.btn.h / 2);
    ctx.scale(1.0 + btnPulse, 1.0 + btnPulse);

    // Sombra de botón
    ctx.shadowColor = isCampusSelected ? "rgba(0, 229, 255, 0.85)" : "rgba(255, 215, 0, 0.85)";
    ctx.shadowBlur = 24;

    const btnGrad = ctx.createLinearGradient(-layout.btn.w / 2, 0, layout.btn.w / 2, 0);
    if (isCampusSelected) {
      btnGrad.addColorStop(0, "#00B0FF");
      btnGrad.addColorStop(0.5, "#00E5FF");
      btnGrad.addColorStop(1, "#2979FF");
    } else {
      btnGrad.addColorStop(0, "#FF6D00");
      btnGrad.addColorStop(0.5, "#FFD700");
      btnGrad.addColorStop(1, "#00E676");
    }

    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(-layout.btn.w / 2, -layout.btn.h / 2, layout.btn.w, layout.btn.h, 38);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0A192F";
    const btnFontSize = Math.max(14, Math.min(22, layout.btn.h * 0.42));
    ctx.font = `900 ${btnFontSize}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("¡A VOLAR! 🚀", 0, 1);
    ctx.restore();

    // Atajos de teclado en la parte inferior (si hay espacio vertical)
    if (layout.hintY < this.height - 8) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.font = "500 11px 'Outfit', sans-serif";
      ctx.fillText("[1] Feria Mágica   [2] Campuslands   [ESPACIO / ENTER] Iniciar", this.width / 2, layout.hintY);
    }

    ctx.restore();
  }

  /**
   * Renderiza una tarjeta individual de personaje con preview animado
   */
  private renderElfCard(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; w: number; h: number },
    _charId: ElfCharacterId,
    title: string,
    desc: string,
    themeColor: string,
    glowColor: string,
    img: HTMLImageElement,
    isSelected: boolean,
    isTwoCol: boolean
  ): void {
    ctx.save();

    const isHorizontalLayout = !isTwoCol || box.w > box.h * 1.35;
    const cornerRadius = Math.max(10, Math.min(20, box.h * 0.14));

    // 1. Fondo de la tarjeta con efecto Glassmorphism
    ctx.save();
    if (isSelected) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 24;
    }

    const cardGrad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    if (isSelected) {
      cardGrad.addColorStop(0, "rgba(20, 38, 70, 0.95)");
      cardGrad.addColorStop(1, "rgba(10, 22, 45, 0.95)");
    } else {
      cardGrad.addColorStop(0, "rgba(12, 24, 48, 0.72)");
      cardGrad.addColorStop(1, "rgba(8, 16, 32, 0.72)");
    }

    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, cornerRadius);
    ctx.fill();

    // Borde iluminado
    ctx.strokeStyle = isSelected ? themeColor : "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = isSelected ? 3.0 : 1.5;
    ctx.stroke();
    ctx.restore();

    // 2. Insignia de Estado (ELEGIDO / SELECCIONAR)
    const pillW = Math.max(72, Math.min(115, box.w * 0.28));
    const pillH = Math.max(18, Math.min(26, box.h * 0.22));
    const pillX = box.x + box.w - pillW - Math.max(6, box.w * 0.025);
    const pillY = box.y + Math.max(6, box.h * 0.08);

    ctx.save();
    ctx.fillStyle = isSelected ? themeColor : "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 14);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.fillStyle = isSelected ? "#0A192F" : "rgba(255, 255, 255, 0.75)";
    ctx.font = `800 ${Math.max(8.5, Math.min(11.5, pillH * 0.48))}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isSelected ? "✓ ELEGIDO" : "SELECCIONAR", pillX + pillW / 2, pillY + pillH / 2);
    ctx.restore();

    // 3. Preview Ilustrado en Vivo del Elfo flotando
    const sway = Math.sin(this.charSelectAnimTime * 3.2 + (isSelected ? 0 : 1.5)) * 4;
    let previewX = 0;
    let previewY = 0;
    let previewSize = 0;

    if (!isHorizontalLayout) {
      // Formato Vertical (Columna con Preview Arriba y Texto Abajo)
      previewSize = Math.min(box.w * 0.65, box.h * 0.46);
      previewX = box.x + box.w / 2;
      previewY = box.y + box.h * 0.38 + sway;
    } else {
      // Formato Horizontal (Preview a la Izquierda y Texto a la Derecha)
      previewSize = Math.min(box.h * 0.82, box.w * 0.30);
      previewX = box.x + previewSize / 2 + 14;
      previewY = box.y + box.h / 2 + sway;
    }

    ctx.save();
    ctx.translate(previewX, previewY);

    // Resplandor detrás del personaje
    if (isSelected) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;
      const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, previewSize * 0.58);
      aura.addColorStop(0, glowColor);
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, previewSize * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -previewSize / 2, -previewSize / 2, previewSize, previewSize);
    } else {
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(0, 0, previewSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Textos Descriptivos de la Tarjeta
    ctx.save();
    if (!isHorizontalLayout) {
      ctx.textAlign = "center";
      const textCenter = box.x + box.w / 2;
      const titleFont = Math.max(12, Math.min(18, box.h * 0.08));
      const titleTextY = box.y + box.h - titleFont * 2.3;

      ctx.fillStyle = isSelected ? themeColor : "#FFFFFF";
      ctx.font = `800 ${titleFont}px 'Outfit', sans-serif`;
      ctx.fillText(title, textCenter, titleTextY, box.w - 20);

      const descFont = Math.max(9, Math.min(12, titleFont * 0.65));
      ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
      ctx.font = `500 ${descFont}px 'Outfit', sans-serif`;
      ctx.fillText(desc, textCenter, titleTextY + titleFont + 4, box.w - 16);
    } else {
      ctx.textAlign = "left";
      const textX = box.x + previewSize + Math.max(10, box.w * 0.035);
      const titleFont = Math.max(11, Math.min(17, box.h * 0.18));
      const titleTextY = box.y + box.h * 0.42;

      ctx.fillStyle = isSelected ? themeColor : "#FFFFFF";
      ctx.font = `800 ${titleFont}px 'Outfit', sans-serif`;
      const maxTextW = box.x + box.w - textX - (box.w < 380 ? 8 : pillW + 10);
      ctx.fillText(title, textX, titleTextY, Math.max(60, maxTextW));

      const descFont = Math.max(8.5, Math.min(11.5, titleFont * 0.65));
      ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
      ctx.font = `500 ${descFont}px 'Outfit', sans-serif`;
      const maxDescW = box.x + box.w - textX - 10;
      ctx.fillText(desc, textX, titleTextY + titleFont + 4, Math.max(80, maxDescW));
    }
    ctx.restore();

    ctx.restore();
  }

  /**
   * Dibuja carteles publicitarios de madera con los logos de la Feria y Patrocinadores integrados en la villa
   */
  private renderBackgroundSigns(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const signBaseY = this.height - 195;

    for (const sign of this.backgroundSigns) {
      if (sign.x < -200 || sign.x > this.width + 200) continue;

      ctx.save();
      ctx.translate(sign.x, signBaseY);
      ctx.scale(sign.scale * 0.35, sign.scale * 0.35);

      const imgToDraw = sign.type === "feria" ? this.imgCartelFeria : this.imgCartelSponsor;
      if (imgToDraw.complete && imgToDraw.naturalWidth > 0) {
        // Resplandor cálido de las luces navideñas del cartel
        const lightFlicker = 0.8 + Math.sin(sign.lightPhase) * 0.2;
        ctx.shadowColor = sign.type === "feria" ? "rgba(255, 215, 0, 0.85)" : "rgba(129, 212, 250, 0.85)";
        ctx.shadowBlur = 22 * lightFlicker;

        ctx.drawImage(imgToDraw, -imgToDraw.naturalWidth / 2, -imgToDraw.naturalHeight / 2);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Dibuja un único mundo panorámico continuo de Villa Navideña sin solapamientos
   */
  private renderSingleUnifiedWorld(ctx: CanvasRenderingContext2D): void {
    // Relleno base nocturno para asegurar opacidad al 100%
    ctx.fillStyle = "#061226";
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.imgBgPanorama.complete && this.imgBgPanorama.naturalWidth > 0) {
      const imgW = this.imgBgPanorama.naturalWidth;
      const imgH = this.imgBgPanorama.naturalHeight;

      const scale = Math.max(this.height / imgH, this.width / imgW);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawY = this.height - drawH;

      let offsetX = -(this.bgScrollX % drawW);
      while (offsetX < this.width) {
        ctx.drawImage(this.imgBgPanorama, offsetX, drawY, drawW, drawH);
        offsetX += drawW - 1;
      }
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, "#030A16");
      skyGrad.addColorStop(0.5, "#091B33");
      skyGrad.addColorStop(1, "#122E54");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderChimneyPuffs(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.chimneyPuffs) {
      ctx.fillStyle = `rgba(220, 230, 242, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Pequeño núcleo cálido cerca de la boca de la chimenea
      if (p.life < 0.4) {
        ctx.fillStyle = `rgba(255, 179, 0, ${p.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderWindGusts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = "rgba(179, 229, 252, 0.4)";
    ctx.lineWidth = 2.5;
    const windOffset = (this.gliderSwayTime * 500) % (this.width + 200);

    for (let w = 0; w < 4; w++) {
      const wx = this.width - ((windOffset + w * 180) % (this.width + 200));
      const wy = 150 + w * 120 + Math.sin(this.gliderSwayTime + w) * 30;

      ctx.beginPath();
      ctx.moveTo(wx + 100, wy);
      ctx.quadraticCurveTo(wx + 40, wy + (this.windForceY > 0 ? 25 : -25), wx, wy);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renderiza la capa de decoración del piso:
   * - Montículos de nieve iluminados
   * - Farolas victorianas cálidas
   * - Árboles navideños decorados
   * - Vallas de madera con guirnaldas y luces
   * - Cajas de regalos
   */
  private renderGroundDecorations(ctx: CanvasRenderingContext2D): void {
    const floorBaseY = this.height - 55;

    // 1. Capa base de montículos de nieve con degradado invernal
    ctx.save();
    const snowGrad = ctx.createLinearGradient(0, floorBaseY - 35, 0, this.height);
    snowGrad.addColorStop(0, "rgba(225, 245, 254, 0.95)");
    snowGrad.addColorStop(0.3, "rgba(179, 229, 252, 0.95)");
    snowGrad.addColorStop(1, "rgba(79, 134, 198, 0.98)");

    ctx.fillStyle = snowGrad;
    ctx.beginPath();
    ctx.moveTo(0, this.height);

    // Ondulación suave de la nieve
    const step = 45;
    for (let x = 0; x <= this.width + step; x += step) {
      const worldX = x + this.groundScrollX;
      const wave = Math.sin(worldX * 0.012) * 14 + Math.cos(worldX * 0.024) * 8;
      const y = floorBaseY + wave;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();

    // Borde brillante de escarcha/hielo sobre la cresta de nieve
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 2. Elementos decorativos (Props de suelo)
    for (const prop of this.groundProps) {
      if (prop.x < -100 || prop.x > this.width + 100) continue;

      const worldX = prop.x + this.groundScrollX;
      const groundY = floorBaseY + Math.sin(worldX * 0.012) * 14 + Math.cos(worldX * 0.024) * 8;

      ctx.save();
      ctx.translate(prop.x, groundY);
      ctx.scale(prop.scale, prop.scale);

      if (prop.type === "lamp") {
        // Farola Victoriana Dorada con Luz Cálida
        this.drawStreetLamp(ctx, prop.lightPhase);
      } else if (prop.type === "tree") {
        // Pino Navideño con Luces de Colores
        this.drawFestiveTree(ctx, prop.lightPhase);
      } else if (prop.type === "fence") {
        // Valla de Madera con Guirnalda
        this.drawGarlandFence(ctx, prop.lightPhase);
      } else if (prop.type === "gift_pile") {
        // Pila de Regalos en la Nieve
        this.drawGiftPile(ctx);
      }

      ctx.restore();
    }
  }

  private drawStreetLamp(ctx: CanvasRenderingContext2D, lightPhase: number): void {
    const flicker = 0.85 + Math.sin(lightPhase) * 0.15;

    // Resplandor cálido de la farola
    ctx.save();
    const lampGlow = ctx.createRadialGradient(0, -68, 5, 0, -68, 55);
    lampGlow.addColorStop(0, `rgba(255, 224, 130, ${0.7 * flicker})`);
    lampGlow.addColorStop(0.5, `rgba(255, 160, 0, ${0.35 * flicker})`);
    lampGlow.addColorStop(1, "rgba(255, 160, 0, 0)");
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(0, -68, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Poste de hierro forjado oscuro con detalles dorados
    ctx.fillStyle = "#1A2530";
    ctx.fillRect(-3.5, -60, 7, 60);

    // Base del poste
    ctx.fillStyle = "#0F1720";
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 8, 2);
    ctx.fill();

    // Corona y campana de la farola
    ctx.fillStyle = "#D4AF37"; // Dorado
    ctx.beginPath();
    ctx.moveTo(-10, -60);
    ctx.lineTo(10, -60);
    ctx.lineTo(7, -78);
    ctx.lineTo(-7, -78);
    ctx.closePath();
    ctx.fill();

    // Cristal encendido
    ctx.fillStyle = `rgba(255, 241, 118, ${0.95 * flicker})`;
    ctx.beginPath();
    ctx.arc(0, -68, 8, 0, Math.PI * 2);
    ctx.fill();

    // Tejadillo con nieve
    ctx.fillStyle = "#37474F";
    ctx.beginPath();
    ctx.moveTo(-13, -76);
    ctx.lineTo(0, -88);
    ctx.lineTo(13, -76);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ECEFF1"; // Nieve sobre el tejadillo
    ctx.beginPath();
    ctx.arc(0, -87, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFestiveTree(ctx: CanvasRenderingContext2D, lightPhase: number): void {
    if (this.imgTree.complete && this.imgTree.naturalWidth > 0) {
      ctx.drawImage(this.imgTree, -32, -85, 64, 90);
    } else {
      // Dibujo estilizado de pino invernal
      ctx.fillStyle = "#1B4D3E";
      // Nivel inferior
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(0, -45);
      ctx.lineTo(28, 0);
      ctx.closePath();
      ctx.fill();

      // Nivel medio
      ctx.fillStyle = "#246B56";
      ctx.beginPath();
      ctx.moveTo(-22, -30);
      ctx.lineTo(0, -68);
      ctx.lineTo(22, -30);
      ctx.closePath();
      ctx.fill();

      // Nivel superior
      ctx.fillStyle = "#2E8B6E";
      ctx.beginPath();
      ctx.moveTo(-15, -55);
      ctx.lineTo(0, -85);
      ctx.lineTo(15, -55);
      ctx.closePath();
      ctx.fill();
    }

    // Luces navideñas parpadeantes sobre el árbol
    const colors = ["#FF1744", "#FFEA00", "#00E676", "#00E5FF"];
    for (let l = 0; l < 5; l++) {
      const lx = (l - 2) * 11;
      const ly = -20 - l * 12;
      const lightAlpha = 0.4 + Math.sin(lightPhase + l * 1.5) * 0.55;
      ctx.save();
      ctx.globalAlpha = Math.max(0.2, Math.min(1, lightAlpha));
      ctx.fillStyle = colors[l % colors.length];
      ctx.shadowColor = colors[l % colors.length];
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawGarlandFence(ctx: CanvasRenderingContext2D, lightPhase: number): void {
    // Postes de madera rústica
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(-35, -36, 8, 40);
    ctx.fillRect(27, -36, 8, 40);

    // Tablas horizontales
    ctx.fillStyle = "#795548";
    ctx.fillRect(-35, -30, 70, 6);
    ctx.fillRect(-35, -16, 70, 6);

    // Sombrero de nieve sobre los postes
    ctx.fillStyle = "#ECEFF1";
    ctx.beginPath();
    ctx.arc(-31, -36, 6, Math.PI, 0);
    ctx.arc(31, -36, 6, Math.PI, 0);
    ctx.fill();

    // Guirnalda de pino colgante
    ctx.strokeStyle = "#2E7D32";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-31, -26);
    ctx.quadraticCurveTo(0, -10, 31, -26);
    ctx.stroke();

    // Moño rojo central con luces
    ctx.fillStyle = "#D50000";
    ctx.beginPath();
    ctx.arc(0, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const lightFlash = 0.5 + Math.sin(lightPhase * 2) * 0.5;
    ctx.fillStyle = `rgba(255, 235, 59, ${lightFlash})`;
    ctx.beginPath();
    ctx.arc(-15, -18, 2.5, 0, Math.PI * 2);
    ctx.arc(15, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGiftPile(ctx: CanvasRenderingContext2D): void {
    // Regalo rojo principal
    if (this.imgGiftRed2.complete && this.imgGiftRed2.naturalWidth > 0) {
      ctx.drawImage(this.imgGiftRed2, -28, -36, 36, 36);
    } else if (this.imgGiftRed.complete && this.imgGiftRed.naturalWidth > 0) {
      ctx.drawImage(this.imgGiftRed, -26, -34, 34, 34);
    } else {
      ctx.fillStyle = "#D32F2F";
      ctx.fillRect(-24, -30, 30, 30);
    }

    // Regalo verde secundario
    if (this.imgGiftGreen.complete && this.imgGiftGreen.naturalWidth > 0) {
      ctx.drawImage(this.imgGiftGreen, 2, -28, 28, 28);
    } else {
      ctx.fillStyle = "#388E3C";
      ctx.fillRect(2, -24, 24, 24);
    }

    // Bastón de caramelo apoyado
    if (this.imgCandy.complete && this.imgCandy.naturalWidth > 0) {
      ctx.drawImage(this.imgCandy, -8, -38, 20, 38);
    }

    // Nieve cubriendo la base de los regalos
    ctx.fillStyle = "rgba(236, 239, 241, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderObstacles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const obs of this.obstacles) {
      // Sutil aura de advertencia
      ctx.shadowColor = "rgba(255, 23, 68, 0.6)";
      ctx.shadowBlur = 14;

      if (obs.type === "house") {
        if (this.imgHouseObstacle.complete && this.imgHouseObstacle.naturalWidth > 0) {
          ctx.drawImage(this.imgHouseObstacle, obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = "#5D4037";
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      } else if (obs.type === "icicle") {
        ctx.save();
        // Aura fría de peligro sutil
        ctx.shadowColor = "rgba(0, 229, 255, 0.75)";
        ctx.shadowBlur = 18;

        if (this.imgIcicle.complete && this.imgIcicle.naturalWidth > 0) {
          // Dibujar con holgura superior para que quede perfectamente sumergida en el techo
          ctx.drawImage(this.imgIcicle, obs.x, -25, obs.width, obs.height + 25);
        } else {
          ctx.fillStyle = "#B3E5FC";
          ctx.fillRect(obs.x, 0, obs.width, obs.height);
        }

        // Borde superior de escarcha y nieve estilizada (Stylized 2D Game Art) para fusión perfecta con el cielo
        const ledgeGrad = ctx.createLinearGradient(obs.x - 10, 0, obs.x + obs.width + 10, 16);
        ledgeGrad.addColorStop(0, "rgba(220, 245, 255, 0.95)");
        ledgeGrad.addColorStop(0.5, "rgba(255, 255, 255, 1.0)");
        ledgeGrad.addColorStop(1, "rgba(180, 230, 255, 0.95)");
        ctx.fillStyle = ledgeGrad;
        ctx.beginPath();
        ctx.roundRect(obs.x - 8, 0, obs.width + 16, 12, [0, 0, 8, 8]);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.restore();
      }
    }
    ctx.restore();
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const item of this.collectibles) {
      const curY = item.y + Math.sin(item.bobOffset) * 10;

      // Halo verde en coleccionables / Dorado en Logos de la Feria y Estrella
      if (item.type === "logo_feria" || item.type === "logo_star") {
        ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
        ctx.shadowBlur = 22;
      } else if (item.type === "logo_campus") {
        ctx.shadowColor = "rgba(0, 229, 255, 0.9)";
        ctx.shadowBlur = 22;
      } else {
        ctx.shadowColor = "rgba(0, 230, 118, 0.6)";
        ctx.shadowBlur = 14;
      }

      ctx.save();
      ctx.translate(item.x, curY);

      if (item.type === "gift_red" && this.imgGiftRed.complete) {
        ctx.drawImage(this.imgGiftRed, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "gift_green" && this.imgGiftGreen.complete) {
        ctx.drawImage(this.imgGiftGreen, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "candy" && this.imgCandy.complete) {
        ctx.drawImage(this.imgCandy, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "teddy" && this.imgTeddy.complete) {
        ctx.drawImage(this.imgTeddy, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "logo_feria" && this.logoImage1 && this.logoImage1.complete) {
        // Medallón Dorado de la Feria Mágica (Alta visibilidad y brillo)
        const rot = Math.sin(this.gliderSwayTime * 1.5) * 0.12;
        ctx.rotate(rot);

        const radius = item.size * 0.48;
        const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        bgGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        bgGrad.addColorStop(0.82, "rgba(255, 248, 220, 0.96)");
        bgGrad.addColorStop(1, "rgba(255, 215, 0, 0.92)");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.drawImage(this.logoImage1, -item.size * 0.40, -item.size * 0.40, item.size * 0.80, item.size * 0.80);
      } else if (item.type === "logo_campus" && this.logoImage2 && this.logoImage2.complete) {
        // Medallón Cian/Dorado de Campuslands (Base blanca luminosa)
        const rot = Math.sin(this.gliderSwayTime * 1.5) * 0.12;
        ctx.rotate(rot);

        const radius = item.size * 0.48;
        const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        bgGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        bgGrad.addColorStop(0.82, "rgba(240, 250, 255, 0.96)");
        bgGrad.addColorStop(1, "rgba(0, 229, 255, 0.92)");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.drawImage(this.logoImage2, -item.size * 0.40, -item.size * 0.40, item.size * 0.80, item.size * 0.80);
      } else if (item.type === "logo_star" && this.imgStarLogo.complete) {
        ctx.rotate(this.gliderSwayTime * 1.1);
        ctx.drawImage(this.imgStarLogo, -item.size / 2, -item.size / 2, item.size, item.size);
      } else {
        ctx.fillStyle = "#00E676";
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private renderElf(ctx: CanvasRenderingContext2D): void {
    if (this.isFlashing) return; // Parpadeo durante daño

    ctx.save();
    ctx.translate(this.elfX, this.elfY);
    ctx.rotate(this.elfAngle);

    // Balanceo suave del parapente
    const sway = Math.sin(this.gliderSwayTime) * 2.5;
    const isCampus = this.selectedElf === "campus";
    const elfSprite = isCampus ? this.imgElfCampus : this.imgElfFeria;

    // Escudo de Burbuja Mágica durante Turbo/Imán activo
    if (this.isLogoPowerUpActive) {
      ctx.save();
      ctx.shadowColor = isCampus ? "rgba(0, 229, 255, 0.85)" : "rgba(255, 215, 0, 0.85)";
      ctx.shadowBlur = 24;
      const shieldGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 95);
      if (isCampus) {
        shieldGrad.addColorStop(0, "rgba(0, 229, 255, 0.15)");
        shieldGrad.addColorStop(0.85, "rgba(0, 229, 255, 0.40)");
        shieldGrad.addColorStop(1, "rgba(255, 255, 255, 0.90)");
      } else {
        shieldGrad.addColorStop(0, "rgba(255, 215, 0, 0.12)");
        shieldGrad.addColorStop(0.85, "rgba(255, 235, 59, 0.35)");
        shieldGrad.addColorStop(1, "rgba(255, 255, 255, 0.85)");
      }
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isCampus ? "#80D8FF" : "#FFF59D";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Dibujar el Sprite Ilustrado del Elfo con su Parapente Oficial Elegido
    if (elfSprite && elfSprite.complete && elfSprite.naturalWidth > 0) {
      ctx.drawImage(
        elfSprite,
        -this.elfWidth / 2,
        -this.elfHeight / 2 + sway,
        this.elfWidth,
        this.elfHeight
      );
    } else {
      ctx.fillStyle = isCampus ? "#00E5FF" : "#4CAF50";
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderAtmosphere(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    const snowTime = this.gliderSwayTime * 2;
    for (let s = 0; s < 22; s++) {
      const sx = (s * 52 + snowTime * 35) % this.width;
      const sy = (s * 68 + snowTime * 65) % this.height;
      const sRadius = 1.6 + (s % 3);
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderHUDOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Indicador de Combo Activo
    if (this.comboCount > 1) {
      const comboMult = Math.min(5, Math.floor(1 + this.comboCount / 3));
      const comboX = this.width / 2;
      const comboY = 115;

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
      ctx.shadowBlur = 14;
      ctx.font = "900 28px 'Outfit', sans-serif";
      ctx.fillText(`COMBO x${comboMult}`, comboX, comboY);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    // 2. Barra de Turbo / Power-Up de la Feria
    if (this.isLogoPowerUpActive) {
      const barW = Math.min(300, this.width * 0.65);
      const barH = 12;
      const barX = this.width / 2 - barW / 2;
      const barY = 140;
      const progress = Math.max(0, this.logoPowerUpTimer / 5.0);

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4, 4);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFF9C4";
      ctx.font = "bold 13px 'Outfit', sans-serif";
      ctx.fillText("¡PODER MÁGICO ACTIVO!", this.width / 2, barY - 5);
      ctx.textAlign = "left";
    }

    // 3. Indicador de Viento Activo
    if (this.isWindActive) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#81D4FA";
      ctx.shadowColor = "rgba(129, 212, 250, 0.8)";
      ctx.shadowBlur = 10;
      ctx.font = "bold 16px 'Outfit', sans-serif";
      const directionArrow = this.windForceY > 0 ? "↓" : "↑";
      ctx.fillText(`VIENTO MÁGICO ${directionArrow}`, this.width / 2, 170);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    // 4. Banner de Clímax últimos 5 segundos
    if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#FF1744";
      ctx.shadowColor = "rgba(255, 23, 68, 0.85)";
      ctx.shadowBlur = 18;
      ctx.font = "900 32px 'Outfit', sans-serif";
      ctx.fillText("¡ÚLTIMOS SEGUNDOS!", this.width / 2, this.height * 0.28);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    ctx.restore();
  }

  /**
   * En la pantalla de selección de personaje se oculta el HUD de vidas/tiempo para evitar solapamientos
   */
  protected override drawHUD(ctx: CanvasRenderingContext2D): void {
    if (this.gameState === "character-select") {
      return;
    }
    super.drawHUD(ctx);
  }
}

