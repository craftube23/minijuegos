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
import { BRANDING } from "../config/branding";

export type ElfCharacterId =
  | "feria"
  | "campus"
  | "cajasan"
  | "practi"
  | "mariposa"
  | "angelus"
  | "factor"
  | "fundalas"
  | "imebu";

export interface ElfCharacterDef {
  id: ElfCharacterId;
  name: string;
  sponsorName: string;
  subtitle: string;
  badgeText: string;
  perkName: string;
  perkDesc: string;
  themeColor: string;
  glowColor: string;
  accentColor: string;
  spritePath: string;
  iconPath: string;
  soundNote: number;
}

export const ELF_ROSTER: ElfCharacterDef[] = [
  {
    id: "feria",
    name: "Elfo Feria Mágica",
    sponsorName: "Feria Mágica del Juguete",
    subtitle: "Guardián de la Alegría Navideña",
    badgeText: "EDICIÓN ESPECIAL",
    perkName: "Vuelo Festivo",
    perkDesc: "Gran estabilidad y estela dorada de bendiciones",
    themeColor: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.45)",
    accentColor: "#DC2626",
    spritePath: "./assets/images/elfo-volador.webp",
    iconPath: "./assets/images/icon-elfo-feria.webp",
    soundNote: 0
  },
  {
    id: "campus",
    name: "Elfo Campuslands",
    sponsorName: "Campuslands",
    subtitle: "Explorador Cósmico del Futuro",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Vuelo Cósmico",
    perkDesc: "Turbo estelar y campo de fuerza electromagnético",
    themeColor: "#00E5FF",
    glowColor: "rgba(0, 229, 255, 0.45)",
    accentColor: "#0284C7",
    spritePath: "./assets/images/elfo-volador-campus.webp",
    iconPath: "./assets/images/icon-elfo-campus.webp",
    soundNote: 2
  },
  {
    id: "cajasan",
    name: "Elfo Cajasan",
    sponsorName: "Cajasan",
    subtitle: "Embajador de Bienestar Familiar",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Recreación Familiar",
    perkDesc: "Escudos protectores duraderos y planeo confortable",
    themeColor: "#38BDF8",
    glowColor: "rgba(56, 189, 248, 0.45)",
    accentColor: "#0B4F9C",
    spritePath: "./assets/images/elfo-volador-cajasan.webp",
    iconPath: "./assets/images/icon-elfo-cajasan.webp",
    soundNote: 4
  },
  {
    id: "practi",
    name: "Elfo Practi Arepa",
    sponsorName: "Practi Arepa",
    subtitle: "Sabor y Energía Tradicional",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Energía Dorada",
    perkDesc: "Impulso de vuelo cálido y deliciosa agilidad en giros",
    themeColor: "#FBBF24",
    glowColor: "rgba(251, 191, 36, 0.45)",
    accentColor: "#DC2626",
    spritePath: "./assets/images/elfo-volador-practi.webp",
    iconPath: "./assets/images/icon-elfo-practi.webp",
    soundNote: 1
  },
  {
    id: "mariposa",
    name: "Elfo Dulces Mariposa",
    sponsorName: "Dulces Mariposa",
    subtitle: "Dulzura y Tradición Santandereana",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Vuelo de Seda",
    perkDesc: "Atracción dulce de caramelos y planeo suave",
    themeColor: "#F472B6",
    glowColor: "rgba(244, 114, 182, 0.45)",
    accentColor: "#F59E0B",
    spritePath: "./assets/images/elfo-volador-mariposa.webp",
    iconPath: "./assets/images/icon-elfo-mariposa.webp",
    soundNote: 3
  },
  {
    id: "angelus",
    name: "Elfo Ángelus Seguridad",
    sponsorName: "Ángelus Seguridad Ltda.",
    subtitle: "Guardián de la Paz y Tranquilidad",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Escudo Angelical",
    perkDesc: "Blindaje de titanio y resistencia férrea ante peligros",
    themeColor: "#94A3B8",
    glowColor: "rgba(148, 163, 184, 0.45)",
    accentColor: "#1E3A8A",
    spritePath: "./assets/images/elfo-volador-angelus.webp",
    iconPath: "./assets/images/icon-elfo-angelus.webp",
    soundNote: 5
  },
  {
    id: "factor",
    name: "Elfo Factor Humano",
    sponsorName: "Factor Humano",
    subtitle: "Talento, Liderazgo y Vigor",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Impulso Humano",
    perkDesc: "Capacidad de ascenso veloz y tenacidad heroica",
    themeColor: "#EF4444",
    glowColor: "rgba(239, 68, 68, 0.45)",
    accentColor: "#1E293B",
    spritePath: "./assets/images/elfo-volador-factor.webp",
    iconPath: "./assets/images/icon-elfo-factor.webp",
    soundNote: 6
  },
  {
    id: "fundalas",
    name: "Elfo Fundalas",
    sponsorName: "Fundalas",
    subtitle: "Alas de Esperanza y Solidaridad",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Alas Solidarias",
    perkDesc: "Poderoso radio de atracción magnética para regalos",
    themeColor: "#38BDF8",
    glowColor: "rgba(56, 189, 248, 0.45)",
    accentColor: "#0284C7",
    spritePath: "./assets/images/elfo-volador-fundalas.webp",
    iconPath: "./assets/images/icon-elfo-fundalas.webp",
    soundNote: 2
  },
  {
    id: "imebu",
    name: "Elfo IMEBU",
    sponsorName: "IMEBU & Alcaldía",
    subtitle: "Orgullo y Emprendimiento Búcaro",
    badgeText: "PATROCINADOR OFICIAL",
    perkName: "Impulso Búcaro",
    perkDesc: "Frecuencia mejorada de medallones y regalos especiales",
    themeColor: "#4ADE80",
    glowColor: "rgba(74, 222, 128, 0.45)",
    accentColor: "#EAB308",
    spritePath: "./assets/images/elfo-volador-imebu.webp",
    iconPath: "./assets/images/icon-elfo-imebu.webp",
    soundNote: 4
  }
];

interface CollectibleItem {
  x: number;
  y: number;
  size: number;
  type: "gift_red" | "gift_green" | "candy" | "teddy" | "logo_sponsor" | "logo_feria" | "logo_campus" | "logo_star";
  sponsorId?: string;
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
  sponsorKey: string;
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
  private cartelImages: Map<string, HTMLImageElement> = new Map();
  private nextSignSponsorIndex: number = 0;
  private nextCollectibleSponsorIndex: number = 0;

  // Temporizadores de spawn y dificultad
  private spawnItemTimer: number = 0;
  private spawnObstacleTimer: number = 0;
  private logoSpawnTimer: number = 8.5; // Cadencia equilibrada para Logos cada 10-14s
  private speedMultiplier: number = 1.0;
  private lastSpeedTier: number = 1;
  private baseScrollSpeed: number = 480; // Velocidad base equilibrada y ágil para arcade accesible

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
  public elfSprites: Map<ElfCharacterId, HTMLImageElement> = new Map();
  public elfIcons: Map<ElfCharacterId, HTMLImageElement> = new Map();
  private keyNavCooldown: number = 0;

  private imgElfFeria: HTMLImageElement;
  private imgBgPanorama: HTMLImageElement;
  private imgHouseObstacle: HTMLImageElement;
  private imgIcicle: HTMLImageElement;
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

    // 1. Pre-cargar el Roster Completo de 9 Elfos de Patrocinadores con caché compartida
    for (const elfDef of ELF_ROSTER) {
      this.elfSprites.set(elfDef.id, this.getImage(elfDef.spritePath));
      this.elfIcons.set(elfDef.id, this.getImage(elfDef.iconPath));
    }

    this.imgElfFeria = this.elfSprites.get("feria")!;

    // 2. Único Fondo Panorámico Continuo de la Villa Navideña
    this.imgBgPanorama = this.getImage("./assets/images/fondo-villa-seamless.jpg");

    // 3. Obstáculos Ilustrados 2D (Casa navideña con tejado/chimenea y Estalactitas)
    this.imgHouseObstacle = this.getImage("./assets/images/casa-obstaculo.webp");
    this.imgIcicle = this.getImage("./assets/images/estalactita-hielo.webp");

    // 4. Carteles de Publicidad con Logos Integrados de Todos los Patrocinadores
    const cartelKeys = ["feria", "campus", "cajasan", "practi", "mariposa", "angelus", "factor", "fundalas", "imebu"];
    for (const key of cartelKeys) {
      this.cartelImages.set(key, this.getImage(`./assets/images/cartel-${key}.png`));
    }

    // 5. Decoraciones de Piso
    this.imgTree = this.getImage("./assets/images/arbol.webp");

    // 6. Coleccionables Ilustrados 2D
    this.imgGiftRed = this.getImage("./assets/images/regalo-rojo.webp");
    this.imgGiftGreen = this.getImage("./assets/images/regalo-verde.webp");
    this.imgGiftRed2 = this.getImage("./assets/images/regalo-rojo2.webp");
    this.imgCandy = this.getImage("./assets/images/baston-caramelo.webp");
    this.imgTeddy = this.getImage("./assets/images/osito.webp");
    this.imgStarLogo = this.getImage("./assets/images/estrella con logo.webp");

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
    this.lastSpeedTier = 1;
    this.bgScrollX = 0;
    this.groundScrollX = 0;
    this.chimneyPuffs = [];

    this.collectibles = [];
    this.obstacles = [];
    this.groundProps = [];
    this.backgroundSigns = [];
    this.spawnItemTimer = 0.4;
    this.spawnObstacleTimer = 1.1;
    this.logoSpawnTimer = 8.5;
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
    const cartelKeys = ["feria", "campus", "cajasan", "practi", "mariposa", "angelus", "factor", "fundalas", "imebu"];
    for (let i = 0; i < count; i++) {
      const sponsorKey = cartelKeys[this.nextSignSponsorIndex % cartelKeys.length];
      this.nextSignSponsorIndex++;
      this.backgroundSigns.push({
        x: i * spacing + 100,
        sponsorKey: sponsorKey,
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

      // Navegación por teclado en la pantalla de selección con cooldown
      if (this.keyNavCooldown > 0) {
        this.keyNavCooldown -= dt;
      } else {
        const curIdx = ELF_ROSTER.findIndex((e) => e.id === this.selectedElf);
        if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
          const prevIdx = (curIdx - 1 + ELF_ROSTER.length) % ELF_ROSTER.length;
          this.selectCharacter(ELF_ROSTER[prevIdx].id);
          this.keyNavCooldown = 0.22;
        } else if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
          const nextIdx = (curIdx + 1) % ELF_ROSTER.length;
          this.selectCharacter(ELF_ROSTER[nextIdx].id);
          this.keyNavCooldown = 0.22;
        } else {
          // Teclas numéricas 1 a 9 para selección instantánea
          for (let i = 0; i < ELF_ROSTER.length; i++) {
            if (this.input.isKeyDown(`Digit${i + 1}`)) {
              this.selectCharacter(ELF_ROSTER[i].id);
              this.keyNavCooldown = 0.25;
              break;
            }
          }
        }
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
    if (timeProgress < 6) {
      baseMultiplier = 1.0 + (timeProgress / 6) * 0.35; // 1.00x -> 1.35x en los primeros 6 segundos
    } else if (timeProgress < 18) {
      baseMultiplier = 1.35 + ((timeProgress - 6) / 12) * 0.50; // 1.35x -> 1.85x
    } else if (timeProgress < 32) {
      baseMultiplier = 1.85 + ((timeProgress - 18) / 14) * 0.55; // 1.85x -> 2.40x
    } else {
      baseMultiplier = Math.min(2.80, 2.40 + ((timeProgress - 32) / 13) * 0.40); // 2.40x -> 2.80x
    }

    this.speedMultiplier = baseMultiplier;

    if (this.isLogoPowerUpActive) {
      this.speedMultiplier *= 1.30; // Turbo activo por power-up
    }

    // Celebración visual y sonora al alcanzar cada nivel de velocidad
    const currentTier = this.speedMultiplier >= 2.2 ? 4 : this.speedMultiplier >= 1.7 ? 3 : this.speedMultiplier >= 1.3 ? 2 : 1;
    if (currentTier > this.lastSpeedTier) {
      this.lastSpeedTier = currentTier;
      const tierLabels = ["", "", "⚡ ¡VELOCIDAD x1.4!", "⚡ ¡SUPER VELOCIDAD x1.8!", "🚀 ¡HIPERVELOCIDAD x2.2!"];
      const tierColors = ["", "", "#00E5FF", "#FFD700", "#FF3D00"];
      this.addFloatingText(tierLabels[currentTier], this.elfX, this.elfY - 50, tierColors[currentTier], 1.5);
      this.audio.playWindGust();
      this.particles.emitBurst(this.elfX, this.elfY, tierColors[currentTier], 20);
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
        const currentDef = ELF_ROSTER.find((e) => e.id === this.selectedElf) || ELF_ROSTER[0];
        const trailColor = this.isLogoPowerUpActive
          ? currentDef.themeColor
          : currentDef.glowColor;
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
      if (this.timeRemaining <= 0) {
        this.isLogoPowerUpActive = false;
        this.logoPowerUpTimer = 0;
      } else {
        this.logoPowerUpTimer -= dt;
        if (this.logoPowerUpTimer <= 0) {
          this.isLogoPowerUpActive = false;
          this.logoPowerUpTimer = 0;
        } else if (Math.random() < 0.3) {
          this.particles.emitBurst(
            this.elfX + (Math.random() - 0.5) * 50,
            this.elfY + (Math.random() - 0.5) * 50,
            "#FFD700",
            1
          );
        }
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

    // Chequeo de aparición de Logos Oficiales: Frecuencia equilibrada (cada 10 a 14 segundos)
    this.logoSpawnTimer -= dt;
    if (this.logoSpawnTimer <= 0) {
      this.logoSpawnTimer = 10.0 + Math.random() * 4.0;
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

    const cartelKeys = ["feria", "campus", "cajasan", "practi", "mariposa", "angelus", "factor", "fundalas", "imebu"];
    for (let i = 0; i < this.backgroundSigns.length; i++) {
      const sign = this.backgroundSigns[i];
      if (sign.x < -220) {
        let maxX = 0;
        for (const s of this.backgroundSigns) {
          if (s.x > maxX) maxX = s.x;
        }
        sign.x = Math.max(this.width + 80, maxX + spacing + (Math.random() * 60 - 30));
        sign.sponsorKey = cartelKeys[this.nextSignSponsorIndex % cartelKeys.length];
        this.nextSignSponsorIndex++;
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
    // 5% de probabilidad moderada de generar un medallón oficial rotatorio si no hay poder activo
    if (!this.isLogoPowerUpActive && Math.random() < 0.05) {
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
   * Genera un Medallón de Logo Oficial rotando equitativamente por los 9 patrocinadores
   */
  private spawnLogoMedallion(): void {
    const isStar = Math.random() < 0.10;
    const allSponsors = BRANDING.getAllSponsors();
    const sponsor = allSponsors[this.nextCollectibleSponsorIndex % allSponsors.length];
    this.nextCollectibleSponsorIndex++;
    const brandLogo = isStar ? "logo_star" : "logo_sponsor";

    const baseSpawnY = 160 + Math.random() * (this.height - 400);
    const clampedY = Math.max(140, Math.min(this.height - 200, baseSpawnY));

    this.collectibles.push({
      x: this.width + 90,
      y: clampedY,
      size: 94,
      type: brandLogo,
      sponsorId: sponsor.id,
      points: 500,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 3.2
    });

    // Destello de anticipación mágica con el color distintivo del patrocinador
    this.particles.emitBurst(this.width + 80, clampedY, isStar ? "#FFD700" : sponsor.themeColor, 16);
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
    if (item.type === "logo_sponsor" || item.type === "logo_feria" || item.type === "logo_campus") {
      const sponsorKey = item.sponsorId || (item.type === "logo_campus" ? "campus" : "feria");
      const sponsor = BRANDING.getLogoConfig(sponsorKey);

      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 3.5;
      this.activeLogo = sponsor;
      this.timeRemaining = Math.min(45, this.timeRemaining + 1.5); // +1.5s Tiempo Extra
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 35);
      this.addFloatingText(`¡${sponsor.shortName.toUpperCase()}! +1.5s & IMÁN x2`, this.elfX, this.elfY - 45, sponsor.themeColor, 1.4);
    } else if (item.type === "logo_star") {
      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 3.0;
      this.timeRemaining = Math.min(45, this.timeRemaining + 1.5); // +1.5s Tiempo Extra
      this.audio.playGiftUnwrap();
      this.particles.emitBurst(this.elfX, this.elfY, "#FFD700", 25);
      this.addFloatingText("¡TURBO + IMÁN +1.5s!", this.elfX, this.elfY - 45, "#FFE082", 1.35);
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

  private hitObstacle(_obs: ObstacleItem, index: number): void {
    // Si el power-up está activo, chocar con un obstáculo hace perder los efectos inmediatamente
    if (this.isLogoPowerUpActive) {
      this.isLogoPowerUpActive = false;
      this.logoPowerUpTimer = 0;
      this.hitCooldown = 1.2;
      this.obstacles.splice(index, 1);
      this.triggerShake(0.32, 12);
      this.audio.playElfHit();
      this.particles.emitBurst(this.elfX, this.elfY, "#FF1744", 25);
      this.addFloatingText("¡EFECTO PERDIDO!", this.elfX, this.elfY - 45, "#FF1744", 1.4);
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
    const def = ELF_ROSTER.find((e) => e.id === character) || ELF_ROSTER[0];
    this.audio.playBellNote(def.soundNote);
    this.particles.emitBurst(
      this.width / 2,
      this.height * 0.45,
      def.themeColor,
      18
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
      if (!this.isRunning || this.isGameOver) return;
      this.gameState = "playing";
      this.showLives = true;
      this.timeRemaining = this.initialGameDuration;
      this.totalPlayTime = 0;
      this.audio.playGameBGM(this.inGameMusicPath, this.inGameMusicVolume);
    });
  }

  /**
   * Reinicia una partida directa manteniendo el elfo elegido y lanzando la cuenta regresiva oficial 3-2-1
   */
  public replayWithCountdown(): void {
    this.score = 0;
    this.lives = 5;
    this.maxLives = 5;
    this.totalPlayTime = 0;
    this.initialGameDuration = 45;
    this.timeRemaining = 45;
    this.isRunning = true;
    this.isGameOver = false;
    this.isFinishing = false;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.speedMultiplier = 1.0;
    this.lastSpeedTier = 1;
    this.bgScrollX = 0;
    this.groundScrollX = 0;
    this.chimneyPuffs = [];
    this.collectibles = [];
    this.obstacles = [];
    this.groundProps = [];
    this.backgroundSigns = [];
    this.spawnItemTimer = 0.4;
    this.spawnObstacleTimer = 1.1;
    this.logoSpawnTimer = 8.5;
    this.windTimer = 6.5;
    this.isWindActive = false;
    this.wasThrusting = false;
    this.flyAudioCooldown = 0;
    this.elfX = Math.max(140, this.width * 0.22);
    this.elfY = this.height * 0.45;
    this.elfVy = 0;
    this.elfAngle = 0;
    this.initGroundProps();
    this.initBackgroundSigns();

    this.gameState = "countdown";
    this.audio.playCountdownStep(3);

    const mainContainer = document.getElementById("game-container") || document.body;
    ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
      if (!this.isRunning || this.isGameOver) return;
      this.gameState = "playing";
      this.showLives = true;
      this.timeRemaining = this.initialGameDuration;
      this.totalPlayTime = 0;
      this.audio.playGameBGM(this.inGameMusicPath, this.inGameMusicVolume);
    });
  }

  /**
   * Obtiene la geometría y coordenadas de la interfaz de selección de 9 personajes
   */
  private getCharacterSelectLayout(): {
    titleY: number;
    subtitleY: number;
    heroCard: { x: number; y: number; w: number; h: number };
    btnLeft: { x: number; y: number; w: number; h: number };
    btnRight: { x: number; y: number; w: number; h: number };
    thumbDock: {
      x: number;
      y: number;
      w: number;
      h: number;
      itemSize: number;
      gap: number;
      items: { id: ElfCharacterId; x: number; y: number; w: number; h: number }[];
    };
    btn: { x: number; y: number; w: number; h: number };
    hintY: number;
    isLandscape: boolean;
  } {
    const isLandscape = this.width > this.height;
    const isShortHeight = this.height <= 700;

    const titleY = isShortHeight ? Math.max(18, this.height * 0.065) : Math.max(28, this.height * 0.075);
    const subtitleY = titleY + (isShortHeight ? 16 : 22);

    let heroW: number, heroH: number, heroX: number, heroY: number;
    let btnLeft: { x: number; y: number; w: number; h: number };
    let btnRight: { x: number; y: number; w: number; h: number };
    let thumbY: number, thumbH: number, itemSize: number, gap: number, totalThumbW: number, thumbStartX: number;
    let btnW: number, btnH: number, btnX: number, btnY: number, hintY: number;

    if (isLandscape) {
      heroW = Math.min(680, this.width * 0.74);
      heroH = Math.min(270, Math.max(150, this.height * (isShortHeight ? 0.44 : 0.48)));
      heroX = (this.width - heroW) / 2;
      heroY = subtitleY + (isShortHeight ? 8 : 12);

      const btnArrowW = Math.min(46, Math.max(34, this.width * 0.045));
      btnLeft = { x: Math.max(8, heroX - btnArrowW - 10), y: heroY + (heroH - btnArrowW) / 2, w: btnArrowW, h: btnArrowW };
      btnRight = { x: Math.min(this.width - btnArrowW - 8, heroX + heroW + 10), y: heroY + (heroH - btnArrowW) / 2, w: btnArrowW, h: btnArrowW };

      thumbH = Math.min(50, Math.max(34, this.height * (isShortHeight ? 0.11 : 0.10)));
      gap = 6;
      itemSize = Math.min(thumbH, Math.floor((heroW - 8 * gap) / 9));
      totalThumbW = 9 * itemSize + 8 * gap;
      thumbStartX = (this.width - totalThumbW) / 2;
      thumbY = heroY + heroH + (isShortHeight ? 8 : 12);

      btnW = Math.min(320, this.width * 0.42);
      btnH = Math.min(50, Math.max(36, this.height * (isShortHeight ? 0.11 : 0.09)));
      btnX = (this.width - btnW) / 2;
      btnY = thumbY + thumbH + (isShortHeight ? 6 : 10);
      hintY = btnY + btnH + 14;
    } else {
      // Portrait / Totem
      heroW = Math.min(480, this.width * 0.90);
      heroH = Math.min(400, Math.max(230, this.height * 0.40));
      heroX = (this.width - heroW) / 2;
      heroY = subtitleY + 12;

      const btnArrowW = 42;
      btnLeft = { x: heroX + 8, y: heroY + heroH * 0.32 - btnArrowW / 2, w: btnArrowW, h: btnArrowW };
      btnRight = { x: heroX + heroW - btnArrowW - 8, y: heroY + heroH * 0.32 - btnArrowW / 2, w: btnArrowW, h: btnArrowW };

      thumbH = Math.min(56, Math.max(38, this.height * 0.075));
      const availW = Math.min(this.width * 0.94, 520);
      gap = Math.max(4, Math.min(8, Math.floor((availW - 9 * 36) / 8)));
      itemSize = Math.min(thumbH, Math.floor((availW - 8 * gap) / 9));
      totalThumbW = 9 * itemSize + 8 * gap;
      thumbStartX = (this.width - totalThumbW) / 2;
      thumbY = heroY + heroH + 12;

      btnW = Math.min(360, this.width * 0.85);
      btnH = Math.min(58, Math.max(44, this.height * 0.065));
      btnX = (this.width - btnW) / 2;
      btnY = thumbY + thumbH + 14;
      hintY = btnY + btnH + 16;
    }

    const thumbItems = ELF_ROSTER.map((def, i) => ({
      id: def.id,
      x: thumbStartX + i * (itemSize + gap),
      y: thumbY,
      w: itemSize,
      h: itemSize
    }));

    return {
      titleY,
      subtitleY,
      heroCard: { x: heroX, y: heroY, w: heroW, h: heroH },
      btnLeft,
      btnRight,
      thumbDock: {
        x: thumbStartX,
        y: thumbY,
        w: totalThumbW,
        h: thumbH,
        itemSize,
        gap,
        items: thumbItems
      },
      btn: { x: btnX, y: btnY, w: btnW, h: btnH },
      hintY,
      isLandscape
    };
  }

  /**
   * Procesa toques y clics en la pantalla de selección de personaje (9 patrocinadores)
   */
  private handleCharacterSelectTouch(x: number, y: number): void {
    const layout = this.getCharacterSelectLayout();
    const curIdx = ELF_ROSTER.findIndex((e) => e.id === this.selectedElf);

    // 1. Tocar Flecha Izquierda (Anterior Elfo)
    if (
      x >= layout.btnLeft.x &&
      x <= layout.btnLeft.x + layout.btnLeft.w &&
      y >= layout.btnLeft.y &&
      y <= layout.btnLeft.y + layout.btnLeft.h
    ) {
      const prevIdx = (curIdx - 1 + ELF_ROSTER.length) % ELF_ROSTER.length;
      this.selectCharacter(ELF_ROSTER[prevIdx].id);
      return;
    }

    // 2. Tocar Flecha Derecha (Siguiente Elfo)
    if (
      x >= layout.btnRight.x &&
      x <= layout.btnRight.x + layout.btnRight.w &&
      y >= layout.btnRight.y &&
      y <= layout.btnRight.y + layout.btnRight.h
    ) {
      const nextIdx = (curIdx + 1) % ELF_ROSTER.length;
      this.selectCharacter(ELF_ROSTER[nextIdx].id);
      return;
    }

    // 3. Tocar miniaturas en la barra de selección (9 Elfos)
    for (const item of layout.thumbDock.items) {
      if (
        x >= item.x &&
        x <= item.x + item.w &&
        y >= item.y &&
        y <= item.y + item.h
      ) {
        if (this.selectedElf === item.id) {
          this.startGameWithCountdown();
        } else {
          this.selectCharacter(item.id);
        }
        return;
      }
    }

    // 4. Tocar Botón "¡A VOLAR! ▶"
    if (
      x >= layout.btn.x &&
      x <= layout.btn.x + layout.btn.w &&
      y >= layout.btn.y &&
      y <= layout.btn.y + layout.btn.h
    ) {
      this.startGameWithCountdown();
      return;
    }

    // 5. Tocar la tarjeta de personaje principal para iniciar
    if (
      x >= layout.heroCard.x &&
      x <= layout.heroCard.x + layout.heroCard.w &&
      y >= layout.heroCard.y &&
      y <= layout.heroCard.y + layout.heroCard.h
    ) {
      this.startGameWithCountdown();
    }
  }

  /**
   * Renderiza la interfaz de selección de personaje con los 9 elfos de patrocinadores oficiales
   */
  private renderCharacterSelect(ctx: CanvasRenderingContext2D): void {
    const layout = this.getCharacterSelectLayout();
    const curDef = ELF_ROSTER.find((e) => e.id === this.selectedElf) || ELF_ROSTER[0];
    const elfSprite = this.elfSprites.get(curDef.id) || this.imgElfFeria;

    ctx.save();

    // 1. Overlay translúcido de noche mágica
    ctx.fillStyle = "rgba(4, 12, 28, 0.88)";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Resplandor central con el color temático del elfo activo
    const centerGlow = ctx.createRadialGradient(
      this.width / 2,
      layout.heroCard.y + layout.heroCard.h * 0.45,
      20,
      this.width / 2,
      layout.heroCard.y + layout.heroCard.h * 0.45,
      this.width * 0.65
    );
    centerGlow.addColorStop(0, curDef.glowColor);
    centerGlow.addColorStop(0.5, "rgba(255, 215, 0, 0.04)");
    centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. Título y Subtítulo Cinemático
    ctx.textAlign = "center";
    const titleSize = Math.max(16, Math.min(32, this.width * 0.040));
    ctx.font = `900 ${titleSize}px 'Outfit', sans-serif`;
    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 4;
    ctx.strokeText("ELIGE A TU ELFO MÁGICO", this.width / 2, layout.titleY);
    ctx.fillStyle = "#FFD700";
    ctx.fillText("ELIGE A TU ELFO MÁGICO", this.width / 2, layout.titleY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const subtitleSize = Math.max(10, Math.min(14, titleSize * 0.48));
    ctx.font = `600 ${subtitleSize}px 'Outfit', sans-serif`;
    ctx.fillText("9 Mensajeros Navideños Oficiales • Selecciona tu elfo para volar", this.width / 2, layout.subtitleY);

    // 4. Botones de Navegación Flechas [<] y [>]
    this.renderNavArrowButton(ctx, layout.btnLeft, "<", curDef.themeColor);
    this.renderNavArrowButton(ctx, layout.btnRight, ">", curDef.themeColor);

    // 5. Tarjeta Hero Showcase del Personaje Activo
    this.renderHeroShowcaseCard(ctx, layout.heroCard, curDef, elfSprite, layout.isLandscape);

    // 6. Barra Dock de Miniaturas de los 9 Elfos
    this.renderThumbnailDock(ctx, layout.thumbDock);

    // 7. Botón de Acción Principal: ¡A VOLAR!
    const btnPulse = Math.sin(this.charSelectAnimTime * 4.5) * 0.025;
    ctx.save();
    ctx.translate(layout.btn.x + layout.btn.w / 2, layout.btn.y + layout.btn.h / 2);
    ctx.scale(1.0 + btnPulse, 1.0 + btnPulse);

    const btnW = layout.btn.w;
    const btnH = layout.btn.h;

    // Bisel inferior 3D
    ctx.fillStyle = "#7F1D1D";
    ctx.beginPath();
    ctx.roundRect(-btnW / 2, -btnH / 2 + 5, btnW, btnH, 18);
    ctx.fill();

    // Cuerpo del botón con degradado festivo dorado / esmeralda
    const btnGrad = ctx.createLinearGradient(0, -btnH / 2, 0, btnH / 2);
    btnGrad.addColorStop(0, "#FBBF24");
    btnGrad.addColorStop(0.35, "#F59E0B");
    btnGrad.addColorStop(0.7, "#D97706");
    btnGrad.addColorStop(1, "#B45309");

    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 18);
    ctx.fill();

    // Borde doble dorado
    ctx.strokeStyle = "#FFFBEB";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Texto del botón
    ctx.fillStyle = "#3B1B04";
    const btnFontSize = Math.max(14, Math.min(24, btnH * 0.44));
    ctx.font = `900 ${btnFontSize}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("¡A VOLAR! ▶", 0, 1);
    ctx.restore();

    // 8. Atajos de teclado en la parte inferior
    if (layout.hintY < this.height - 6) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "600 11.5px 'Outfit', sans-serif";
      ctx.fillText("[← / →] Cambiar   [1..9] Selección rápida   [ESPACIO / ENTER] Iniciar", this.width / 2, layout.hintY);
    }

    ctx.restore();
  }

  /**
   * Dibuja los botones de flecha < y > con estilo festivo 3D
   */
  private renderNavArrowButton(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; w: number; h: number },
    symbol: string,
    accentColor: string
  ): void {
    ctx.save();
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const r = box.w / 2;

    // Sombra
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.arc(cx, cy + 3, r, 0, Math.PI * 2);
    ctx.fill();

    // Fondo botón circular
    const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    grad.addColorStop(0, "rgba(30, 41, 59, 0.95)");
    grad.addColorStop(1, "rgba(15, 23, 42, 0.98)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Borde brillante con color temático
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Flecha
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${Math.max(16, r * 0.9)}px 'Titan One', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, cx, cy + (symbol === "<" || symbol === ">" ? -1 : 0));
    ctx.restore();
  }

  /**
   * Renderiza la tarjeta principal Showcase del Elfo seleccionado
   */
  private renderHeroShowcaseCard(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; w: number; h: number },
    def: ElfCharacterDef,
    spriteImg: HTMLImageElement,
    isLandscape: boolean
  ): void {
    ctx.save();
    const cornerRadius = 18;

    // 1. Fondo de la tarjeta con estilo madera noble / metal pulido
    const cardGrad = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    cardGrad.addColorStop(0, "rgba(18, 38, 68, 0.96)");
    cardGrad.addColorStop(0.5, "rgba(10, 24, 46, 0.98)");
    cardGrad.addColorStop(1, "rgba(5, 12, 25, 0.98)");

    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, cornerRadius);
    ctx.fill();

    // 2. Bisel y Borde temático
    ctx.strokeStyle = def.themeColor;
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Adornos de esquina dorados
    const ornSize = 10;
    ctx.fillStyle = def.themeColor;
    // TL
    ctx.beginPath();
    ctx.moveTo(box.x + 4, box.y + 4);
    ctx.lineTo(box.x + 4 + ornSize, box.y + 4);
    ctx.lineTo(box.x + 4, box.y + 4 + ornSize);
    ctx.fill();
    // TR
    ctx.beginPath();
    ctx.moveTo(box.x + box.w - 4, box.y + 4);
    ctx.lineTo(box.x + box.w - 4 - ornSize, box.y + 4);
    ctx.lineTo(box.x + box.w - 4, box.y + 4 + ornSize);
    ctx.fill();
    // BL
    ctx.beginPath();
    ctx.moveTo(box.x + 4, box.y + box.h - 4);
    ctx.lineTo(box.x + 4 + ornSize, box.y + box.h - 4);
    ctx.lineTo(box.x + 4, box.y + box.h - 4 - ornSize);
    ctx.fill();
    // BR
    ctx.beginPath();
    ctx.moveTo(box.x + box.w - 4, box.y + box.h - 4);
    ctx.lineTo(box.x + box.w - 4 - ornSize, box.y + box.h - 4);
    ctx.lineTo(box.x + box.w - 4, box.y + box.h - 4 - ornSize);
    ctx.fill();

    // 3. Insignia de Estado (PATROCINADOR OFICIAL / EDICIÓN ESPECIAL)
    const pillW = Math.max(120, Math.min(180, box.w * 0.32));
    const pillH = Math.max(20, Math.min(26, box.h * 0.11));
    const pillX = box.x + box.w - pillW - 14;
    const pillY = box.y + 12;

    ctx.fillStyle = def.themeColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 12);
    ctx.fill();
    ctx.fillStyle = "#0A192F";
    ctx.font = `900 ${Math.max(9, pillH * 0.44)}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.badgeText, pillX + pillW / 2, pillY + pillH / 2);

    // 4. Preview Ilustrado en Vivo del Elfo + Pedestal de Nieve Flotante
    const sway = Math.sin(this.charSelectAnimTime * 3.2) * 5;
    let previewX: number, previewY: number, previewSize: number;

    if (!isLandscape) {
      // Disposición vertical (Portrait)
      previewSize = Math.min(box.w * 0.62, box.h * 0.46);
      previewX = box.x + box.w / 2;
      previewY = box.y + box.h * 0.32 + sway;
    } else {
      // Disposición horizontal (Landscape)
      previewSize = Math.min(box.h * 0.78, box.w * 0.38);
      previewX = box.x + previewSize / 2 + 20;
      previewY = box.y + box.h / 2 + sway;
    }

    // Pedestal de energía / nieve
    ctx.save();
    ctx.translate(previewX, previewY + previewSize * 0.42);
    const pedGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, previewSize * 0.42);
    pedGrad.addColorStop(0, def.themeColor);
    pedGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, previewSize * 0.44, previewSize * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Aura mágica del personaje
    ctx.save();
    ctx.translate(previewX, previewY);
    const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, previewSize * 0.55);
    aura.addColorStop(0, def.glowColor);
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, previewSize * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar Sprite del Elfo
    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      ctx.drawImage(spriteImg, -previewSize / 2, -previewSize / 2, previewSize, previewSize);
    } else {
      ctx.fillStyle = def.themeColor;
      ctx.beginPath();
      ctx.arc(0, 0, previewSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Textos y Atributos del Personaje
    if (!isLandscape) {
      // Vertical / Portrait Text Block (debajo del elfo)
      ctx.textAlign = "center";
      const textCenter = box.x + box.w / 2;
      const curY = box.y + box.h * 0.58;

      const nameFont = Math.max(16, Math.min(22, box.h * 0.065));
      ctx.font = `900 ${nameFont}px 'Titan One', 'Fredoka', cursive, sans-serif`;
      ctx.strokeStyle = "#051124";
      ctx.lineWidth = 3.5;
      ctx.strokeText(def.name, textCenter, curY, box.w - 30);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(def.name, textCenter, curY, box.w - 30);

      // Sponsor y Subtítulo
      ctx.fillStyle = def.themeColor;
      ctx.font = `700 ${Math.max(11, nameFont * 0.60)}px 'Outfit', sans-serif`;
      ctx.fillText(`${def.sponsorName} • ${def.subtitle}`, textCenter, curY + 20, box.w - 30);

      // Tarjeta de Habilidad Especial
      const perkBoxY = curY + 34;
      const perkBoxW = Math.min(box.w - 36, 420);
      const perkBoxH = Math.min(48, box.h - (perkBoxY - box.y) - 12);
      if (perkBoxH > 24) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.roundRect(textCenter - perkBoxW / 2, perkBoxY, perkBoxW, perkBoxH, 10);
        ctx.fill();
        ctx.strokeStyle = def.themeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#FDE68A";
        ctx.font = "800 11.5px 'Outfit', sans-serif";
        ctx.fillText(`★ ${def.perkName}`, textCenter, perkBoxY + 16, perkBoxW - 16);

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "500 10.5px 'Outfit', sans-serif";
        ctx.fillText(def.perkDesc, textCenter, perkBoxY + 34, perkBoxW - 16);
      }
    } else {
      // Horizontal / Landscape Text Block (a la derecha del elfo)
      const contentX = box.x + previewSize + 28;
      const contentAvailW = pillX - contentX - 10;
      const fullAvailW = box.x + box.w - contentX - 18;
      let curY = box.y + 20;

      // Tag de categoría / rol
      ctx.textAlign = "left";
      ctx.fillStyle = def.themeColor;
      ctx.font = "800 11px 'Outfit', sans-serif";
      ctx.fillText(`PATROCINIO: ${def.sponsorName.toUpperCase()}`, contentX, curY);
      curY += 22;

      // Nombre del Personaje con contorno nítido
      const nameFont = Math.max(16, Math.min(23, box.h * 0.10));
      ctx.font = `900 ${nameFont}px 'Titan One', 'Fredoka', cursive, sans-serif`;
      ctx.strokeStyle = "#051124";
      ctx.lineWidth = 3.5;
      ctx.strokeText(def.name, contentX, curY, contentAvailW);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(def.name, contentX, curY, contentAvailW);
      curY += 20;

      // Subtítulo
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "500 11.5px 'Outfit', sans-serif";
      ctx.fillText(def.subtitle, contentX, curY, fullAvailW);
      curY += 22;

      // Habilidad Especial (Tarjeta destacada)
      const abilityH = Math.max(34, Math.min(46, box.h * 0.18));
      ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      ctx.beginPath();
      ctx.roundRect(contentX, curY, Math.min(fullAvailW, 360), abilityH, 10);
      ctx.fill();
      ctx.strokeStyle = def.themeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#FDE68A";
      ctx.font = "800 11.5px 'Outfit', sans-serif";
      ctx.fillText(`★ HABILIDAD: ${def.perkName}`, contentX + 10, curY + 16);
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.font = "500 10.5px 'Outfit', sans-serif";
      ctx.fillText(def.perkDesc, contentX + 10, curY + abilityH - 8, fullAvailW - 20);
      curY += abilityH + 16;

      // Barras de Estadísticas Arcade
      const stats = [
        { label: "Velocidad", val: 5 },
        { label: "Planeo Mágico", val: 5 },
        { label: "Energía Navideña", val: 5 }
      ];

      const barW = Math.min(fullAvailW * 0.85, 240);
      stats.forEach((st) => {
        if (curY > box.y + box.h - 16) return;
        ctx.fillStyle = "#94A3B8";
        ctx.font = "700 10px 'Outfit', sans-serif";
        ctx.fillText(st.label, contentX, curY + 8);

        const meterX = contentX + 96;
        const meterW = Math.max(70, barW - 96);
        const meterH = 7;

        // Fondo del medidor
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.beginPath();
        ctx.roundRect(meterX, curY + 2, meterW, meterH, 4);
        ctx.fill();

        // Relleno del medidor con degradado
        const fillW = (meterW * st.val) / 5;
        const fillGrad = ctx.createLinearGradient(meterX, 0, meterX + fillW, 0);
        fillGrad.addColorStop(0, def.themeColor);
        fillGrad.addColorStop(1, "#FFFFFF");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(meterX, curY + 2, fillW, meterH, 4);
        ctx.fill();

        curY += 16;
      });
    }

    ctx.restore();
  }

  /**
   * Renderiza la fila dock de miniaturas de los 9 elfos
   */
  private renderThumbnailDock(
    ctx: CanvasRenderingContext2D,
    dock: {
      x: number;
      y: number;
      w: number;
      h: number;
      itemSize: number;
      gap: number;
      items: { id: ElfCharacterId; x: number; y: number; w: number; h: number }[];
    }
  ): void {
    ctx.save();

    for (let i = 0; i < dock.items.length; i++) {
      const item = dock.items[i];
      const def = ELF_ROSTER[i];
      const isSelected = this.selectedElf === item.id;
      const iconImg = this.elfIcons.get(item.id);

      ctx.save();
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;

      // Escalar ligeramente la miniatura activa
      if (isSelected) {
        ctx.translate(cx, cy);
        ctx.scale(1.08, 1.08);
        ctx.translate(-cx, -cy);
      }

      // Fondo de la miniatura
      ctx.fillStyle = isSelected ? "rgba(30, 58, 102, 0.95)" : "rgba(15, 23, 42, 0.80)";
      ctx.beginPath();
      ctx.roundRect(item.x, item.y, item.w, item.h, 10);
      ctx.fill();

      // Borde dorado si está seleccionado
      ctx.strokeStyle = isSelected ? def.themeColor : "rgba(255, 255, 255, 0.20)";
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.stroke();

      // Dibujar icono recortado con máscara circular / bordes redondeados
      if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(item.x + 2, item.y + 2, item.w - 4, item.h - 4, 8);
        ctx.clip();
        ctx.drawImage(iconImg, item.x + 2, item.y + 2, item.w - 4, item.h - 4);
        ctx.restore();
      }

      // Insignia ✓ si está seleccionado
      if (isSelected) {
        const checkR = Math.max(7, item.w * 0.18);
        const checkX = item.x + item.w - checkR - 1;
        const checkY = item.y + checkR + 1;

        ctx.fillStyle = def.themeColor;
        ctx.beginPath();
        ctx.arc(checkX, checkY, checkR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0A192F";
        ctx.font = `900 ${Math.max(8, checkR * 1.1)}px 'Outfit', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓", checkX, checkY);
      }

      // Número de tecla [1..9] en la esquina superior izquierda
      ctx.fillStyle = isSelected ? def.themeColor : "rgba(255, 255, 255, 0.65)";
      ctx.font = `800 ${Math.max(7.5, item.w * 0.20)}px 'Outfit', sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${i + 1}`, item.x + 4, item.y + 3);

      ctx.restore();
    }

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

      const imgToDraw = this.cartelImages.get(sign.sponsorKey) || this.cartelImages.get("feria");
      if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
        // Resplandor cálido de las luces navideñas del cartel con tono distintivo de la marca
        const sponsorCfg = BRANDING.getLogoConfig(sign.sponsorKey);
        const themeColor = sponsorCfg?.themeColor || "#FFD700";
        const lightFlicker = 0.8 + Math.sin(sign.lightPhase) * 0.2;
        const signGlow = ctx.createRadialGradient(0, 0, imgToDraw.naturalWidth * 0.2, 0, 0, imgToDraw.naturalWidth * 0.6);
        const alphaHex = Math.min(255, Math.max(0, Math.floor(0.40 * lightFlicker * 255))).toString(16).padStart(2, "0");
        signGlow.addColorStop(0, `${themeColor}${alphaHex}`);
        signGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = signGlow;
        ctx.fillRect(-imgToDraw.naturalWidth * 0.6, -imgToDraw.naturalHeight * 0.6, imgToDraw.naturalWidth * 1.2, imgToDraw.naturalHeight * 1.2);

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
      const col = colors[l % colors.length];
      // Halo exterior
      ctx.globalAlpha = Math.max(0.1, lightAlpha * 0.35);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(lx, ly, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // Núcleo brillante
      ctx.globalAlpha = Math.max(0.2, Math.min(1, lightAlpha));
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
      if (obs.type === "house") {
        // Sombra de contacto de la casa sobre la nieve
        ctx.save();
        ctx.fillStyle = "rgba(10, 20, 45, 0.38)";
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height - 2, obs.width * 0.52, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.imgHouseObstacle.complete && this.imgHouseObstacle.naturalWidth > 0) {
          ctx.drawImage(this.imgHouseObstacle, obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = "#5D4037";
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      } else if (obs.type === "icicle") {
        ctx.save();
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

      ctx.save();
      ctx.translate(item.x, curY);

      // Halo degradado suave y limpio (sin shadowBlur para evitar tile glitching en Skia GPU)
      if (item.type === "logo_sponsor" || item.type === "logo_feria" || item.type === "logo_campus") {
        const sponsorKey = item.sponsorId || (item.type === "logo_campus" ? "campus" : "feria");
        const sponsor = BRANDING.getLogoConfig(sponsorKey);
        const glow = ctx.createRadialGradient(0, 0, item.size * 0.25, 0, 0, item.size * 0.72);
        glow.addColorStop(0, sponsor.themeColor + "80");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Medallón oficial del patrocinador (Fondo blanco nítido y aro temático brillante)
        const rot = Math.sin(this.gliderSwayTime * 1.5) * 0.12;
        ctx.rotate(rot);

        const radius = item.size * 0.48;
        const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        bgGrad.addColorStop(0, "#FFFFFF");
        bgGrad.addColorStop(0.85, "rgba(248, 250, 252, 0.98)");
        bgGrad.addColorStop(1, sponsor.themeColor + "99");
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = sponsor.themeColor;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        const sponsorImg = this.getSponsorImage(sponsor.id) || this.getSponsorImage(sponsor.shortName) || this.getSponsorImage(item.sponsorId || "") || (sponsor.id === "logo-campus" ? this.logoImage2 : this.logoImage1);
        if (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0) {
          const aspect = sponsorImg.naturalWidth / (sponsorImg.naturalHeight || 1);
          let logoW = item.size * 0.80;
          let logoH = item.size * 0.80;
          if (aspect > 1.35) {
            logoW = item.size * 0.85;
            logoH = logoW / aspect;
          } else if (aspect < 0.75) {
            logoH = item.size * 0.85;
            logoW = logoH * aspect;
          }
          ctx.drawImage(sponsorImg, -logoW / 2, -logoH / 2, logoW, logoH);
        }
      } else if (item.type === "logo_star") {
        const glow = ctx.createRadialGradient(0, 0, item.size * 0.25, 0, 0, item.size * 0.72);
        glow.addColorStop(0, "rgba(255, 215, 0, 0.45)");
        glow.addColorStop(1, "rgba(255, 215, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.72, 0, Math.PI * 2);
        ctx.fill();

        if (this.imgStarLogo.complete) {
          ctx.rotate(this.gliderSwayTime * 1.1);
          ctx.drawImage(this.imgStarLogo, -item.size / 2, -item.size / 2, item.size, item.size);
        }
      } else {
        const glow = ctx.createRadialGradient(0, 0, item.size * 0.2, 0, 0, item.size * 0.65);
        glow.addColorStop(0, "rgba(0, 230, 118, 0.35)");
        glow.addColorStop(1, "rgba(0, 230, 118, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.65, 0, Math.PI * 2);
        ctx.fill();

        if (item.type === "gift_red" && this.imgGiftRed.complete) {
          ctx.drawImage(this.imgGiftRed, -item.size / 2, -item.size / 2, item.size, item.size);
        } else if (item.type === "gift_green" && this.imgGiftGreen.complete) {
          ctx.drawImage(this.imgGiftGreen, -item.size / 2, -item.size / 2, item.size, item.size);
        } else if (item.type === "candy" && this.imgCandy.complete) {
          ctx.drawImage(this.imgCandy, -item.size / 2, -item.size / 2, item.size, item.size);
        } else if (item.type === "teddy" && this.imgTeddy.complete) {
          ctx.drawImage(this.imgTeddy, -item.size / 2, -item.size / 2, item.size, item.size);
        } else {
          ctx.fillStyle = "#00E676";
          ctx.beginPath();
          ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
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
    const curElfDef = ELF_ROSTER.find((e) => e.id === this.selectedElf) || ELF_ROSTER[0];
    const elfSprite = this.elfSprites.get(this.selectedElf) || this.imgElfFeria;

    // Escudo de Burbuja Mágica durante Turbo/Imán activo (Gradiente temático del patrocinador)
    if (this.isLogoPowerUpActive) {
      ctx.save();
      const shieldGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 95);
      shieldGrad.addColorStop(0, curElfDef.glowColor);
      shieldGrad.addColorStop(0.75, curElfDef.glowColor);
      shieldGrad.addColorStop(1, "rgba(255, 255, 255, 0.92)");
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = curElfDef.themeColor;
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
      ctx.fillStyle = curElfDef.themeColor;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderAtmosphere(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Copos de nieve con velocidad vinculada al desplazamiento real
    ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
    const snowScroll = this.groundScrollX * 0.75;
    for (let s = 0; s < 28; s++) {
      const sx = ((s * 48 - snowScroll * (0.8 + (s % 4) * 0.25)) % this.width + this.width) % this.width;
      const sy = (s * 62 + this.gliderSwayTime * 25) % this.height;
      const sRadius = 1.5 + (s % 3) * 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Líneas de viento dinámicas / Speedlines (Aparecen conforme aumenta la velocidad)
    if (this.speedMultiplier > 1.25) {
      const streakCount = Math.min(12, Math.floor((this.speedMultiplier - 1.1) * 7));
      const lineSpeed = this.groundScrollX * 1.5;
      ctx.lineWidth = 2.0;

      for (let k = 0; k < streakCount; k++) {
        const lineY = ((k * 89 + 60) % (this.height - 180)) + 60;
        const lineX = ((k * 170 - lineSpeed) % (this.width + 300) + (this.width + 300)) % (this.width + 300) - 100;
        const lineLength = 40 + (this.speedMultiplier - 1.0) * 60;
        const alpha = Math.min(0.70, (this.speedMultiplier - 1.15) * 0.45);

        ctx.strokeStyle = `rgba(224, 247, 250, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX - lineLength, lineY);
        ctx.stroke();
      }
    }

    // 3. Estela aerodinámica detrás del parapente del elfo a altas velocidades
    if (this.speedMultiplier > 1.35) {
      const tailLen = (this.speedMultiplier - 1.2) * 55;
      const tailAlpha = Math.min(0.65, (this.speedMultiplier - 1.2) * 0.40);
      const curElf = ELF_ROSTER.find(e => e.id === this.selectedElf) || ELF_ROSTER[0];

      const grad = ctx.createLinearGradient(this.elfX - 55, this.elfY, this.elfX - 55 - tailLen, this.elfY);
      grad.addColorStop(0, curElf.themeColor);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = tailAlpha;
      ctx.beginPath();
      ctx.moveTo(this.elfX - 50, this.elfY - 12);
      ctx.lineTo(this.elfX - 50 - tailLen, this.elfY - 12);
      ctx.moveTo(this.elfX - 50, this.elfY + 12);
      ctx.lineTo(this.elfX - 50 - tailLen, this.elfY + 12);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  private renderHUDOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 0. Velocímetro Dinámico en Tiempo Real (Muestra la progresión continua de velocidad)
    const speedX = 18;
    const speedY = 78;
    const speedW = 120;
    const speedH = 26;

    let tierColor = "#00E5FF";
    let tierText = "NORMAL";
    if (this.speedMultiplier >= 2.2) {
      tierColor = "#FF3D00";
      tierText = "HIPER";
    } else if (this.speedMultiplier >= 1.7) {
      tierColor = "#FFD700";
      tierText = "TURBO";
    } else if (this.speedMultiplier >= 1.3) {
      tierColor = "#76FF03";
      tierText = "RÁPIDO";
    }

    ctx.save();
    ctx.fillStyle = "rgba(4, 18, 38, 0.82)";
    ctx.strokeStyle = tierColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(speedX, speedY, speedW, speedH, 13);
    ctx.fill();
    ctx.stroke();

    // Barra de progreso interior del velocímetro
    const maxSpeedLimit = 2.8;
    const speedPct = Math.max(0, Math.min(1, (this.speedMultiplier - 1.0) / (maxSpeedLimit - 1.0)));
    ctx.fillStyle = `${tierColor}44`;
    ctx.beginPath();
    ctx.roundRect(speedX + 2, speedY + 2, (speedW - 4) * speedPct, speedH - 4, 11);
    ctx.fill();

    // Texto de velocidad
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "900 12px 'Outfit', sans-serif";
    ctx.fillStyle = tierColor;
    ctx.fillText(`${this.speedMultiplier.toFixed(1)}x`, speedX + 9, speedY + speedH / 2);

    ctx.textAlign = "right";
    ctx.font = "bold 10px 'Outfit', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tierText, speedX + speedW - 9, speedY + speedH / 2);
    ctx.restore();

    // 1. Indicador de Combo Activo
    if (this.comboCount > 1) {
      const comboMult = Math.min(5, Math.floor(1 + this.comboCount / 3));
      const comboX = this.width / 2;
      const comboY = 115;

      ctx.textAlign = "center";
      ctx.font = "900 28px 'Outfit', sans-serif";
      ctx.strokeStyle = "#4A2600";
      ctx.lineWidth = 4;
      ctx.strokeText(`COMBO x${comboMult}`, comboX, comboY);
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`COMBO x${comboMult}`, comboX, comboY);
      ctx.textAlign = "left";
    }

    // 2. Barra de Turbo / Power-Up Dinámica con Identidad del Patrocinador
    if (this.isLogoPowerUpActive) {
      const barW = Math.min(300, this.width * 0.65);
      const barH = 12;
      const barX = this.width / 2 - barW / 2;
      const barY = 140;
      const progress = Math.max(0, this.logoPowerUpTimer / 3.5);
      const activeColor = this.activeLogo?.themeColor || "#FFD700";
      const sponsorTitle = this.activeLogo?.shortName ? `¡PODER ${this.activeLogo.shortName.toUpperCase()} ACTIVO!` : "¡PODER MÁGICO ACTIVO!";

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = activeColor;
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4, 4);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.font = "bold 13px 'Outfit', sans-serif";
      ctx.strokeStyle = "#051124";
      ctx.lineWidth = 2.5;
      ctx.strokeText(sponsorTitle, this.width / 2, barY - 5);
      ctx.fillStyle = "#FFF9C4";
      ctx.fillText(sponsorTitle, this.width / 2, barY - 5);
      ctx.textAlign = "left";
    }

    // 3. Indicador de Viento Activo
    if (this.isWindActive) {
      ctx.textAlign = "center";
      ctx.font = "bold 16px 'Outfit', sans-serif";
      const directionArrow = this.windForceY > 0 ? "↓" : "↑";
      ctx.strokeStyle = "#022B42";
      ctx.lineWidth = 3;
      ctx.strokeText(`VIENTO MÁGICO ${directionArrow}`, this.width / 2, 170);
      ctx.fillStyle = "#81D4FA";
      ctx.fillText(`VIENTO MÁGICO ${directionArrow}`, this.width / 2, 170);
      ctx.textAlign = "left";
    }

    // 4. Banner de Clímax últimos 5 segundos
    if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
      ctx.textAlign = "center";
      ctx.font = "900 32px 'Outfit', sans-serif";
      ctx.strokeStyle = "#38000A";
      ctx.lineWidth = 4;
      ctx.strokeText("¡ÚLTIMOS SEGUNDOS!", this.width / 2, this.height * 0.28);
      ctx.fillStyle = "#FF1744";
      ctx.fillText("¡ÚLTIMOS SEGUNDOS!", this.width / 2, this.height * 0.28);
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

  public override endGame(extraData?: any): void {
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    super.endGame(extraData);
  }

  public override destroy(): void {
    super.destroy();
    this.gameState = "character-select";
    this.collectibles = [];
    this.obstacles = [];
    this.chimneyPuffs = [];
  }
}

