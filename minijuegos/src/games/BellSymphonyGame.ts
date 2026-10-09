/**
 * ==============================================================================
 * JUEGO: SINFONÍA DE CAMPANAS NAVIDEÑAS (Guitar Hero Edition)
 * ==============================================================================
 * 
 * Experiencia musical arcade de alto impacto con estética Stylized 2D Fantasy Art:
 * - 6 Canciones oficiales de Alexander Nakarada (CreatorChords).
 * - Intro de Créditos Cinemática estilo Guitar Hero antes de iniciar el concierto.
 * - Soporte nativo para Notas Normales y NOTAS SOSTENIDAS (Sustain Notes).
 * - Feedback táctil y visual continuo mientras se mantiene presionado el sustain.
 * - Star Notes con Logos Oficiales de la Feria Mágica y Campuslands (Modo Estrella x4).
 * - Control multitáctil responsivo para tótem Android 11 y teclado en PC (D, F, J, K o flechas).
 * - Sistema de juicio arcade: ¡PERFECTO!, ¡GENIAL!, ¡BIEN!, ¡SUSTAIN PERFECTO! y MISS.
 */

import { BaseGame } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { InputManager } from "../core/InputManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { ScreenTransition } from "../core/ScreenTransition";
import { ChartEditorModal, type ChartNoteRecord } from "../components/ChartEditorModal";
import {
  RHYTHM_SONG_LIST,
  GOD_REST_METAL_CHART,
  GOD_REST_METAL_CHART_EASY,
  GOD_REST_METAL_CHART_NORMAL,
  GOD_REST_METAL_CHART_HARD,
  GOD_REST_METAL_CHART_EXPERT,
  JINGLE_BELLS_ROCK_CHART,
  JINGLE_BELLS_ROCK_CHART_EASY,
  JINGLE_BELLS_ROCK_CHART_NORMAL,
  JINGLE_BELLS_ROCK_CHART_HARD,
  JINGLE_BELLS_ROCK_CHART_EXPERT,
  TWELVE_DAYS_CHART,
  TWELVE_DAYS_CHART_EASY,
  TWELVE_DAYS_CHART_NORMAL,
  TWELVE_DAYS_CHART_HARD,
  TWELVE_DAYS_CHART_EXPERT,
  JOY_TO_WORLD_POWER_CHART,
  JOY_TO_WORLD_POWER_CHART_EASY,
  JOY_TO_WORLD_POWER_CHART_NORMAL,
  JOY_TO_WORLD_POWER_CHART_HARD,
  JOY_TO_WORLD_POWER_CHART_EXPERT,
  DECK_THE_HALLS_CHART,
  DECK_THE_HALLS_CHART_EASY,
  DECK_THE_HALLS_CHART_NORMAL,
  DECK_THE_HALLS_CHART_HARD,
  DECK_THE_HALLS_CHART_EXPERT,
  WE_WISH_YOU_CHART,
  WE_WISH_YOU_CHART_EASY,
  WE_WISH_YOU_CHART_NORMAL,
  WE_WISH_YOU_CHART_HARD,
  WE_WISH_YOU_CHART_EXPERT,
  type SongDef
} from "../data/songs";

export { type SongDef };

export type DifficultyLevel = "easy" | "normal" | "hard" | "expert";

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  glowColor: string;
  speedMultiplier: number;
  perfectWindow: number;
  greatWindow: number;
  goodWindow: number;
  missWindow: number;
  scoreMultiplier: number;
  lives: number;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: "easy",
    label: "FÁCIL",
    shortLabel: "FÁCIL",
    icon: "",
    color: "#00E676",
    glowColor: "rgba(0, 230, 118, 0.5)",
    speedMultiplier: 0.72,
    perfectWindow: 0.095,
    greatWindow: 0.170,
    goodWindow: 0.270,
    missWindow: 0.350,
    scoreMultiplier: 1.0,
    lives: 5,
    description: "Ideal para niños y principiantes"
  },
  normal: {
    id: "normal",
    label: "NORMAL",
    shortLabel: "NORMAL",
    icon: "",
    color: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.5)",
    speedMultiplier: 0.95,
    perfectWindow: 0.070,
    greatWindow: 0.130,
    goodWindow: 0.220,
    missWindow: 0.280,
    scoreMultiplier: 1.25,
    lives: 5,
    description: "Ritmo fluido y entretenido"
  },
  hard: {
    id: "hard",
    label: "DIFÍCIL",
    shortLabel: "DIFÍCIL",
    icon: "",
    color: "#FF3366",
    glowColor: "rgba(255, 51, 102, 0.5)",
    speedMultiplier: 1.18,
    perfectWindow: 0.052,
    greatWindow: 0.100,
    goodWindow: 0.170,
    missWindow: 0.230,
    scoreMultiplier: 1.60,
    lives: 4,
    description: "Enérgico con acordes dobles"
  },
  expert: {
    id: "expert",
    label: "EXPERTO",
    shortLabel: "EXPERTO",
    icon: "",
    color: "#D500F9",
    glowColor: "rgba(213, 0, 249, 0.5)",
    speedMultiplier: 1.38,
    perfectWindow: 0.042,
    greatWindow: 0.078,
    goodWindow: 0.140,
    missWindow: 0.190,
    scoreMultiplier: 2.00,
    lives: 4,
    description: "Máximo reto para pantalla táctil"
  }
};

interface FallingNote {
  id: number;
  lane: number; // 0: Rojo (← / D), 1: Dorado (↓ / F), 2: Verde (↑ / J), 3: Azul (→ / K)
  targetTime: number; // Segundo exacto en que la cabeza debe impactar la línea de objetivo
  duration: number; // Duración en segundos (0 para nota normal, > 0 para sustain)
  type: "normal" | "sustain";
  hit: boolean; // ¿Se tocó la cabeza?
  missed: boolean; // ¿Se perdió la nota completamente?

  // Estado del Sustain:
  isHolding: boolean; // ¿El jugador la mantiene presionada en este momento?
  holdStartTime: number; // Segundo en que se comenzó a sostener
  holdDuration: number; // Duración total sostenida
  sustainCompleted: boolean; // ¿Llegó al final con éxito?
  sustainFailed: boolean; // ¿Se soltó demasiado pronto?
  lastScoreTickTime: number; // Control de puntuación continua mientras se sostiene

  isStar?: boolean;
  logoType?: 1 | 2; // 1: Feria Mágica (Dorado), 2: Campuslands (Cian)
}

interface LaneConfig {
  name: string;
  keyLabel: string;
  arrow: string;
  color: string;
  glowColor: string;
  freq: number;
}

interface JudgementPopup {
  text: string;
  color: string;
  alpha: number;
  scale: number;
  x: number;
  y: number;
  time: number;
}

export class BellSymphonyGame extends BaseGame {
  // Lista de canciones seleccionables
  public readonly songList: SongDef[] = RHYTHM_SONG_LIST;

  public selectedDifficulty: DifficultyLevel = "normal";
  private selectedSongIndex: number = 0;
  private gameState: "song-select" | "countdown" | "playing" = "song-select";

  // Configuración de los 4 carriles
  private lanes: LaneConfig[] = [
    {
      name: "Rojo",
      keyLabel: "D",
      arrow: "←",
      color: "#FF3366",
      glowColor: "rgba(255, 51, 102, 0.9)",
      freq: 523.25 // Do5
    },
    {
      name: "Dorado",
      keyLabel: "F",
      arrow: "↓",
      color: "#FFD700",
      glowColor: "rgba(255, 215, 0, 0.9)",
      freq: 659.25 // Mi5
    },
    {
      name: "Verde",
      keyLabel: "J",
      arrow: "↑",
      color: "#00E676",
      glowColor: "rgba(0, 230, 118, 0.9)",
      freq: 783.99 // Sol5
    },
    {
      name: "Azul",
      keyLabel: "K",
      arrow: "→",
      color: "#00E5FF",
      glowColor: "rgba(0, 229, 255, 0.9)",
      freq: 1046.50 // Do6
    }
  ];

  // Sprites e imágenes HD
  private bgImage: HTMLImageElement;
  private imgArrowLeft: HTMLImageElement;
  private imgArrowDown: HTMLImageElement;
  private imgArrowUp: HTMLImageElement;
  private imgArrowRight: HTMLImageElement;
  private imgLogoFair: HTMLImageElement;
  private imgLogoCampus: HTMLImageElement;
  private imgStarWithLogo: HTMLImageElement;

  // Estado del juego de ritmo
  private bpm: number = 138;
  private songDuration: number = 129;
  private currentTime: number = 0;
  private noteSpeed: number = 520;
  private hitLineY: number = 0;
  private laneWidth: number = 0;
  private laneStartX: number = 0;

  // Intro de Créditos Guitar Hero
  private songIntroTimer: number = 0;
  private readonly SONG_INTRO_DURATION: number = 4.4;

  // Notas activas
  private notes: FallingNote[] = [];
  private lanePressed: boolean[] = [false, false, false, false];
  private activePointerLanes: Map<number, number> = new Map(); // pointerId -> lane

  // Métricas, Combo y Vidas (5 Campanas Doradas)
  private combo: number = 0;
  private maxCombo: number = 0;
  private perfectCount: number = 0;
  private greatCount: number = 0;
  private goodCount: number = 0;
  private missCount: number = 0;
  protected override lives: number = 5;
  protected override maxLives: number = 5;
  protected override showLives: boolean = true;

  // MODO ESTRELLA / STAR POWER (Guitar Hero Style x4 Multiplier)
  private starPowerTimer: number = 0;
  private isStarPowerActive: boolean = false;
  private activeStarPowerType: 1 | 2 = 1; // 1: Feria Mágica, 2: Campuslands

  // Popups visuales
  private activeJudgements: JudgementPopup[] = [];
  private beatPulse: number = 0;

  // Sistema de Audio
  private bgAudioElement: HTMLAudioElement | null = null;

  // Editor y Grabador de notas en tiempo real
  private chartEditor: ChartEditorModal;
  private isCustomChartPlaying: boolean = false;
  private lastCustomNotes: ChartNoteRecord[] = [];
  private lastCustomSongFile: string = "juego campanas/God Rest Ye Merry Metalmen.mp3";

  // Listeners de teclado
  private keydownHandler?: (e: KeyboardEvent) => void;
  private keyupHandler?: (e: KeyboardEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "bell-symphony",
      "Sinfonía de Campanas",
      "¡Elige tu concierto navideño, toca las flechas y mantén las notas sostenidas al ritmo de la música!",
      canvas,
      input,
      audio,
      particles
    );

    // Carga de Sprites HD
    this.bgImage = new Image();
    this.bgImage.src = "./assets/images/fondo-habitacion.webp";

    this.imgArrowLeft = new Image();
    this.imgArrowLeft.src = "./assets/images/flecha-izq.png";

    this.imgArrowDown = new Image();
    this.imgArrowDown.src = "./assets/images/flecha-abajo.png";

    this.imgArrowUp = new Image();
    this.imgArrowUp.src = "./assets/images/flecha-arriba.png";

    this.imgArrowRight = new Image();
    this.imgArrowRight.src = "./assets/images/flecha-der.png";

    this.imgLogoFair = new Image();
    this.imgLogoFair.src = "./assets/logos/Feria-magica-del-jugete-sin-fondo.png";

    this.imgLogoCampus = new Image();
    this.imgLogoCampus.src = "./assets/logos/logo-campus-sin-fondo.png";

    this.imgStarWithLogo = new Image();
    this.imgStarWithLogo.src = "./assets/images/estrella con logo.png";

    // Editor de partituras
    this.chartEditor = new ChartEditorModal("chart-editor-modal");
    this.chartEditor.onPlayCustomChart = (customNotes, songFile, bpm) => {
      this.startCustomChart(customNotes, songFile, bpm);
    };

    this.setupKeyboard();
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.recalculateLayout();
  }

  private recalculateLayout(): void {
    const totalTrackWidth = Math.min(this.width * 0.94, 620);
    this.laneWidth = totalTrackWidth / 4;
    this.laneStartX = (this.width - totalTrackWidth) / 2;
    // Línea de impacto adaptativa: no muy pegada al fondo en pantallas cortas
    this.hitLineY = this.height < 500
      ? Math.max(this.height * 0.76, this.height - 75)
      : this.height * 0.80;
  }

  public override start(_durationSeconds: number = 129): void {
    super.start(this.songDuration);
    this.timeRemaining = this.songDuration;
  }

  public override update(dt: number): void {
    if (!this.isRunning || this.isGameOver) return;

    if (this.gameState === "song-select" || this.gameState === "countdown") {
      this.timeRemaining = this.songDuration;
      this.currentTime = 0;
    } else {
      this.timeRemaining = Math.max(0, this.songDuration - this.currentTime);
    }

    // Screen Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
      }
    }

    // Textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ft.scale += dt * 0.4;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

    this.onUpdate(dt);
  }

  protected onStart(): void {
    this.gameState = "song-select";
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.showLives = true;
    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;
    this.maxLives = diffCfg.lives;
    this.lives = this.maxLives;
    this.activeJudgements = [];
    this.lanePressed = [false, false, false, false];
    this.activePointerLanes.clear();
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;
    this.songIntroTimer = 0;

    this.recalculateLayout();

    // Multitouch en pantalla
    this.input.onPointerDown = (pointerId: number, x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;

      if (this.gameState === "song-select") {
        this.handleSongSelectTouch(x, y);
      } else if (this.gameState === "playing") {
        const lane = Math.floor((x - this.laneStartX) / this.laneWidth);
        if (lane >= 0 && lane < 4) {
          this.activePointerLanes.set(pointerId, lane);
          this.handleLanePress(lane);
        }
      }
    };

    this.input.onPointerUp = (pointerId: number, _x: number, _y: number) => {
      if (this.gameState === "playing") {
        const lane = this.activePointerLanes.get(pointerId);
        if (lane !== undefined) {
          this.activePointerLanes.delete(pointerId);
          this.handleLaneRelease(lane);
        }
      }
    };
  }

  private stopSongAudio(): void {
    if (this.bgAudioElement) {
      try {
        this.bgAudioElement.pause();
        this.bgAudioElement.currentTime = 0;
        this.bgAudioElement.onended = null;
        this.bgAudioElement.onerror = null;
        this.bgAudioElement.removeAttribute("src");
        this.bgAudioElement.load();
      } catch (e) {
        console.warn("Aviso deteniendo audio de juego:", e);
      }
      this.bgAudioElement = null;
    }
  }

  /**
   * Inicia la canción elegida y activa el intro Guitar Hero con la dificultad configurada
   */
  public startSong(index: number, difficulty?: DifficultyLevel): void {
    if (difficulty) {
      this.selectedDifficulty = difficulty;
    }
    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;

    this.selectedSongIndex = Math.max(0, Math.min(this.songList.length - 1, index));
    const song = this.songList[this.selectedSongIndex];

    this.showLives = true;
    this.isCustomChartPlaying = false;
    this.bpm = song.bpm;
    this.noteSpeed = Math.round(song.speed * diffCfg.speedMultiplier);
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.maxLives = diffCfg.lives;
    this.lives = this.maxLives;
    this.activeJudgements = [];
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;
    this.songDuration = song.durationSeconds || 120;
    this.songIntroTimer = this.SONG_INTRO_DURATION;
    this.lanePressed = [false, false, false, false];
    this.activePointerLanes.clear();

    // Detener música del menú y limpiar instancias previas
    this.audio.stopMenuBGM();
    this.audio.setGameActive(true);
    this.stopSongAudio();

    try {
      const safeAudioUrl = `./assets/audio/${song.audioFile.split("/").map(encodeURIComponent).join("/")}`;
      this.bgAudioElement = new Audio(safeAudioUrl);
      this.bgAudioElement.volume = 0.82;
      this.bgAudioElement.addEventListener("loadedmetadata", () => {
        if (this.bgAudioElement && !isNaN(this.bgAudioElement.duration) && this.bgAudioElement.duration > 5) {
          this.songDuration = Math.max(this.songDuration, this.bgAudioElement.duration + 1.2);
        }
      });
      this.bgAudioElement.addEventListener("ended", () => {
        if (this.gameState === "playing" && !this.isGameOver) {
          setTimeout(() => {
            if (this.gameState === "playing" && !this.isGameOver) {
              this.endGame();
            }
          }, 400);
        }
      });
      this.bgAudioElement.addEventListener("error", (e) => {
        console.error("❌ Error cargando pista de audio:", safeAudioUrl, e);
      });
      // Audio precargado listo para reproducirse cuando termine la cuenta regresiva
    } catch (e) {
      console.error("Error al inicializar Audio:", e);
      this.bgAudioElement = null;
    }

    this.generateSongChart(song);
    this.gameState = "countdown";

    const mainContainer = document.getElementById("kiosk-main") || document.body;
    ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
      this.gameState = "playing";
      this.currentTime = 0;
      if (!this.audio.getIsMuted() && this.bgAudioElement) {
        this.bgAudioElement.currentTime = 0;
        this.bgAudioElement.play().catch((err) => {
          console.warn("⚠️ Autoplay pendiente o bloqueado:", err);
        });
      }
      this.particles.emitConfetti(this.width, 35);
    });
  }

  public replayLastSong(): void {
    this.stopSongAudio();
    this.score = 0;
    this.isRunning = true;
    this.isGameOver = false;
    this.particles.clear();
    this.recalculateLayout();

    if (this.isCustomChartPlaying && this.lastCustomNotes.length > 0) {
      this.startCustomChart(this.lastCustomNotes, this.lastCustomSongFile, this.bpm);
    } else {
      this.startSong(this.selectedSongIndex);
    }
  }

  public goToSongSelect(): void {
    this.stopSongAudio();
    this.gameState = "song-select";
    this.score = 0;
    this.isRunning = true;
    this.isGameOver = false;
    this.isFinishing = false;
    this.particles.clear();
    this.recalculateLayout();
    this.start();
  }

  public openChartEditor(defaultSongFile?: string, initialNotes?: ChartNoteRecord[]): void {
    this.stopSongAudio();
    const song = this.songList[this.selectedSongIndex];
    const file = defaultSongFile || (this.isCustomChartPlaying ? this.lastCustomSongFile : (song ? song.audioFile : "juego campanas/God Rest Ye Merry Metalmen.mp3"));
    const notes = initialNotes || (this.lastCustomNotes.length > 0 ? this.lastCustomNotes : undefined);
    this.chartEditor.show(file, notes);
  }

  public startCustomChart(customNotes: ChartNoteRecord[], songFile: string, bpm: number): void {
    this.isCustomChartPlaying = true;
    this.lastCustomNotes = [...customNotes];
    this.lastCustomSongFile = songFile;

    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;
    this.bpm = bpm;
    this.noteSpeed = Math.round(520 * diffCfg.speedMultiplier);
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.maxLives = diffCfg.lives;
    this.lives = this.maxLives;
    this.activeJudgements = [];
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;
    this.songIntroTimer = this.SONG_INTRO_DURATION;
    this.lanePressed = [false, false, false, false];
    this.activePointerLanes.clear();

    const lastNoteTime = customNotes.length > 0 ? customNotes[customNotes.length - 1].time + (customNotes[customNotes.length - 1].duration || 0) + 3.0 : 120;
    this.songDuration = Math.max(120, lastNoteTime);

    this.audio.stopMenuBGM();
    this.audio.setGameActive(true);
    this.stopSongAudio();

    try {
      const safeAudioUrl = `./assets/audio/${songFile.split("/").map(encodeURIComponent).join("/")}`;
      this.bgAudioElement = new Audio(safeAudioUrl);
      this.bgAudioElement.volume = 0.82;
      this.bgAudioElement.addEventListener("loadedmetadata", () => {
        if (this.bgAudioElement && !isNaN(this.bgAudioElement.duration) && this.bgAudioElement.duration > 5) {
          this.songDuration = Math.max(this.bgAudioElement.duration + 1.2, lastNoteTime);
        }
      });
      this.bgAudioElement.addEventListener("ended", () => {
        if (this.gameState === "playing" && !this.isGameOver) {
          setTimeout(() => {
            if (this.gameState === "playing" && !this.isGameOver) {
              this.endGame();
            }
          }, 400);
        }
      });
      this.bgAudioElement.addEventListener("error", (e) => {
        console.error("❌ Error cargando pista de audio personalizada:", safeAudioUrl, e);
      });
    } catch {
      this.bgAudioElement = null;
    }

    this.notes = [];
    let noteId = 0;
    let starCount = 0;
    for (const item of customNotes) {
      let logoType: 1 | 2 = 1;
      if (item.isStar) {
        starCount++;
        logoType = starCount % 2 === 0 ? 2 : 1;
      }
      const dur = item.duration && item.duration > 0 ? item.duration : 0;
      this.notes.push({
        id: noteId++,
        lane: item.lane,
        targetTime: item.time,
        duration: dur,
        type: dur > 0 ? "sustain" : "normal",
        hit: false,
        missed: false,
        isHolding: false,
        holdStartTime: 0,
        holdDuration: 0,
        sustainCompleted: false,
        sustainFailed: false,
        lastScoreTickTime: 0,
        isStar: item.isStar || false,
        logoType: item.isStar ? logoType : undefined
      });
    }

    this.gameState = "countdown";
    const mainContainer = document.getElementById("kiosk-main") || document.body;
    ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
      this.gameState = "playing";
      this.currentTime = 0;
      if (!this.audio.getIsMuted() && this.bgAudioElement) {
        this.bgAudioElement.currentTime = 0;
        this.bgAudioElement.play().catch(() => {});
      }
      this.particles.emitConfetti(this.width, 35);
    });
  }

  /**
   * Cálculo responsive unificado para la pantalla de selección de canciones
   */
  private getSongSelectLayout(): {
    cx: number;
    titleY: number;
    subY: number;
    cardW: number;
    cardX: number;
    diffBarY: number;
    diffBarH: number;
    tabW: number;
    tabGap: number;
    startY: number;
    gap: number;
    cardH: number;
    editorBtnY: number;
    editorBtnH: number;
    count: number;
  } {
    const cx = this.width / 2;
    const isLandscape = this.width > this.height;
    const isShort = this.height < 500;
    const cardW = Math.min(this.width * 0.94, isLandscape ? 620 : 520);
    const cardX = (this.width - cardW) / 2;
    const count = this.songList.length;

    // Alturas y márgenes adaptativos fluidos
    const titleY = isShort ? Math.max(16, this.height * 0.04) : (isLandscape ? Math.max(22, this.height * 0.05) : Math.max(34, this.height * 0.045));
    const subY = titleY + (isShort ? 14 : (isLandscape ? 16 : 22));

    const diffBarY = subY + (isShort ? 6 : (isLandscape ? 8 : 14));
    const diffBarH = isShort ? 24 : (isLandscape ? 28 : Math.min(36, Math.max(28, this.height * 0.04)));
    const tabGap = isShort ? 4 : 6;
    const tabW = (cardW - 3 * tabGap) / 4;

    const startY = diffBarY + diffBarH + (isShort ? 4 : (isLandscape ? 6 : 10));
    const bottomReserved = isShort ? 34 : (isLandscape ? 44 : Math.max(48, Math.min(68, this.height * 0.065)));
    const availableSongArea = Math.max(160, this.height - startY - bottomReserved);
    const gap = isShort ? 2 : (isLandscape ? 3 : Math.max(4, Math.min(6, this.height * 0.007)));
    const cardH = Math.min(50, Math.max(isShort ? 26 : (isLandscape ? 30 : 38), (availableSongArea - (count - 1) * gap) / (count + 0.95)));

    const editorBtnY = startY + count * (cardH + gap) + (isShort ? 3 : (isLandscape ? 4 : 8));
    const editorBtnH = Math.min(40, Math.max(isShort ? 22 : (isLandscape ? 26 : 34), cardH * 0.88));

    return {
      cx,
      titleY,
      subY,
      cardW,
      cardX,
      diffBarY,
      diffBarH,
      tabW,
      tabGap,
      startY,
      gap,
      cardH,
      editorBtnY,
      editorBtnH,
      count
    };
  }

  private handleSongSelectTouch(x: number, y: number): void {
    const layout = this.getSongSelectLayout();
    const diffKeys: DifficultyLevel[] = ["easy", "normal", "hard", "expert"];

    // Pestañas de Dificultad
    if (y >= layout.diffBarY && y <= layout.diffBarY + layout.diffBarH && x >= layout.cardX && x <= layout.cardX + layout.cardW) {
      for (let d = 0; d < 4; d++) {
        const tx = layout.cardX + d * (layout.tabW + layout.tabGap);
        if (x >= tx && x <= tx + layout.tabW) {
          if (this.selectedDifficulty !== diffKeys[d]) {
            this.selectedDifficulty = diffKeys[d];
            this.audio.playTap();
          }
          return;
        }
      }
    }

    // Lista de Canciones
    for (let i = 0; i < layout.count; i++) {
      const cy = layout.startY + i * (layout.cardH + layout.gap);

      if (x >= layout.cardX && x <= layout.cardX + layout.cardW && y >= cy && y <= cy + layout.cardH) {
        this.selectedSongIndex = i;
        this.audio.playTap();
        this.startSong(i);
        return;
      }
    }

    // Botón de Modo Grabador / Editor de Canción
    if (x >= layout.cardX && x <= layout.cardX + layout.cardW && y >= layout.editorBtnY && y <= layout.editorBtnY + layout.editorBtnH) {
      this.audio.playTap();
      this.openChartEditor();
    }
  }

  private setupKeyboard(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isGameOver) return;

      if (this.gameState === "song-select") {
        if (e.key === "q" || e.key === "Q") {
          this.selectedDifficulty = "easy";
          this.audio.playTap();
        } else if (e.key === "w" || e.key === "W") {
          this.selectedDifficulty = "normal";
          this.audio.playTap();
        } else if (e.key === "e" || e.key === "E") {
          this.selectedDifficulty = "hard";
          this.audio.playTap();
        } else if (e.key === "r" || e.key === "R") {
          this.selectedDifficulty = "expert";
          this.audio.playTap();
        } else if (e.key === "ArrowLeft") {
          const diffs: DifficultyLevel[] = ["easy", "normal", "hard", "expert"];
          const currIdx = diffs.indexOf(this.selectedDifficulty);
          this.selectedDifficulty = diffs[Math.max(0, currIdx - 1)];
          this.audio.playTap();
        } else if (e.key === "ArrowRight") {
          const diffs: DifficultyLevel[] = ["easy", "normal", "hard", "expert"];
          const currIdx = diffs.indexOf(this.selectedDifficulty);
          this.selectedDifficulty = diffs[Math.min(diffs.length - 1, currIdx + 1)];
          this.audio.playTap();
        } else if (e.key === "1") this.startSong(0);
        else if (e.key === "2") this.startSong(1);
        else if (e.key === "3") this.startSong(2);
        else if (e.key === "4") this.startSong(3);
        else if (e.key === "5") this.startSong(4);
        else if (e.key === "6") this.startSong(5);
        else if (e.key === "x" || e.key === "X") this.openChartEditor();
        else if (e.key === "Enter" || e.key === " ") this.startSong(this.selectedSongIndex);
        return;
      }

      if (this.gameState !== "playing") return;

      let lane = -1;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowLeft") lane = 0;
      else if (e.key === "f" || e.key === "F" || e.key === "ArrowDown") lane = 1;
      else if (e.key === "j" || e.key === "J" || e.key === "ArrowUp") lane = 2;
      else if (e.key === "k" || e.key === "K" || e.key === "ArrowRight") lane = 3;

      if (lane !== -1 && !this.lanePressed[lane]) {
        this.handleLanePress(lane);
      }
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      if (this.gameState !== "playing") return;
      let lane = -1;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowLeft") lane = 0;
      else if (e.key === "f" || e.key === "F" || e.key === "ArrowDown") lane = 1;
      else if (e.key === "j" || e.key === "J" || e.key === "ArrowUp") lane = 2;
      else if (e.key === "k" || e.key === "K" || e.key === "ArrowRight") lane = 3;

      if (lane !== -1) {
        this.handleLaneRelease(lane);
      }
    };

    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
  }

  /**
   * Genera y adapta la partitura de notas para la canción según la dificultad seleccionada
   */
  private generateSongChart(song: SongDef): void {
    let sourceChart: ChartNoteRecord[] = [];
    const diff = this.selectedDifficulty;
    let isHandcrafted = false;

    switch (song.id) {
      case "god-rest-metal":
        if (diff === "easy") sourceChart = GOD_REST_METAL_CHART_EASY;
        else if (diff === "normal") sourceChart = GOD_REST_METAL_CHART_NORMAL;
        else if (diff === "hard") sourceChart = GOD_REST_METAL_CHART_HARD;
        else if (diff === "expert") sourceChart = GOD_REST_METAL_CHART_EXPERT;
        else sourceChart = GOD_REST_METAL_CHART;
        isHandcrafted = true;
        break;
      case "jingle-bells-rock":
        if (diff === "easy") sourceChart = JINGLE_BELLS_ROCK_CHART_EASY;
        else if (diff === "normal") sourceChart = JINGLE_BELLS_ROCK_CHART_NORMAL;
        else if (diff === "hard") sourceChart = JINGLE_BELLS_ROCK_CHART_HARD;
        else if (diff === "expert") sourceChart = JINGLE_BELLS_ROCK_CHART_EXPERT;
        else sourceChart = JINGLE_BELLS_ROCK_CHART;
        isHandcrafted = true;
        break;
      case "twelve-days":
        if (diff === "easy") sourceChart = TWELVE_DAYS_CHART_EASY;
        else if (diff === "normal") sourceChart = TWELVE_DAYS_CHART_NORMAL;
        else if (diff === "hard") sourceChart = TWELVE_DAYS_CHART_HARD;
        else if (diff === "expert") sourceChart = TWELVE_DAYS_CHART_EXPERT;
        else sourceChart = TWELVE_DAYS_CHART;
        isHandcrafted = true;
        break;
      case "joy-to-world":
        if (diff === "easy") sourceChart = JOY_TO_WORLD_POWER_CHART_EASY;
        else if (diff === "normal") sourceChart = JOY_TO_WORLD_POWER_CHART_NORMAL;
        else if (diff === "hard") sourceChart = JOY_TO_WORLD_POWER_CHART_HARD;
        else if (diff === "expert") sourceChart = JOY_TO_WORLD_POWER_CHART_EXPERT;
        else sourceChart = JOY_TO_WORLD_POWER_CHART;
        isHandcrafted = true;
        break;
      case "deck-the-halls":
        if (diff === "easy") sourceChart = DECK_THE_HALLS_CHART_EASY;
        else if (diff === "normal") sourceChart = DECK_THE_HALLS_CHART_NORMAL;
        else if (diff === "hard") sourceChart = DECK_THE_HALLS_CHART_HARD;
        else if (diff === "expert") sourceChart = DECK_THE_HALLS_CHART_EXPERT;
        else sourceChart = DECK_THE_HALLS_CHART;
        isHandcrafted = true;
        break;
      case "we-wish-you":
        if (diff === "easy") sourceChart = WE_WISH_YOU_CHART_EASY;
        else if (diff === "normal") sourceChart = WE_WISH_YOU_CHART_NORMAL;
        else if (diff === "hard") sourceChart = WE_WISH_YOU_CHART_HARD;
        else if (diff === "expert") sourceChart = WE_WISH_YOU_CHART_EXPERT;
        else sourceChart = WE_WISH_YOU_CHART;
        isHandcrafted = true;
        break;
      default:
        sourceChart = GOD_REST_METAL_CHART;
        break;
    }

    // Adaptación según Dificultad: Fácil, Normal, Difícil, Experto
    let adaptedChart: ChartNoteRecord[] = [];

    if (isHandcrafted) {
      // Usar partitura artesanal exacta sin alteraciones automáticas
      adaptedChart = sourceChart.map((n) => ({ ...n }));
    } else if (diff === "easy") {
      // Modo Fácil: Simplifica secuencias muy densas manteniendo notas clave y estrellas
      let lastNoteTime = -1;
      for (const item of sourceChart) {
        if (lastNoteTime < 0 || item.time - lastNoteTime >= 0.28 || item.isStar) {
          adaptedChart.push({
            ...item,
            duration: item.duration ? Math.min(item.duration, 1.2) : 0
          });
          lastNoteTime = item.time;
        }
      }
    } else if (diff === "normal") {
      // Modo Normal: Partitura completa estándar
      adaptedChart = sourceChart.map((n) => ({ ...n }));
    } else if (diff === "hard") {
      // Modo Difícil: Partitura completa + notas de contratiempo en descansos
      adaptedChart = sourceChart.map((n) => ({ ...n }));
      for (let i = 0; i < sourceChart.length - 1; i++) {
        const cur = sourceChart[i];
        const next = sourceChart[i + 1];
        const gap = next.time - (cur.time + (cur.duration || 0));
        if (gap > 1.3 && gap < 3.2) {
          const midTime = Number((cur.time + gap * 0.5).toFixed(2));
          const newLane = (cur.lane + 2) % 4;
          adaptedChart.push({
            lane: newLane,
            time: midTime,
            duration: 0,
            type: "normal"
          });
        }
      }
      adaptedChart.sort((a, b) => a.time - b.time);
    } else if (diff === "expert") {
      // Modo Experto: Notas dobles simultáneas (acordes de campanas) en pulsos clave
      adaptedChart = sourceChart.map((n) => ({ ...n }));
      const chords: ChartNoteRecord[] = [];
      for (let i = 0; i < sourceChart.length; i++) {
        const cur = sourceChart[i];
        if (i % 3 === 0 && (!cur.duration || cur.duration === 0)) {
          const chordLane = (cur.lane + 1) % 4;
          chords.push({
            lane: chordLane,
            time: cur.time,
            duration: 0,
            type: "normal"
          });
        }
      }
      adaptedChart = [...adaptedChart, ...chords].sort((a, b) => a.time - b.time);
    }

    this.notes = [];
    let noteId = 0;
    let starCount = 0;

    for (const item of adaptedChart) {
      let logoType: 1 | 2 = 1;
      if (item.isStar) {
        starCount++;
        logoType = starCount % 2 === 0 ? 2 : 1;
      }

      const dur = item.duration && item.duration > 0 ? item.duration : 0;

      this.notes.push({
        id: noteId++,
        lane: item.lane,
        targetTime: item.time,
        duration: dur,
        type: dur > 0 ? "sustain" : "normal",
        hit: false,
        missed: false,
        isHolding: false,
        holdStartTime: 0,
        holdDuration: 0,
        sustainCompleted: false,
        sustainFailed: false,
        lastScoreTickTime: 0,
        isStar: item.isStar || false,
        logoType: item.isStar ? logoType : undefined
      });
    }

    const lastItem = adaptedChart[adaptedChart.length - 1];
    if (lastItem) {
      const calculatedEnd = lastItem.time + (lastItem.duration || 0) + 3.0;
      this.songDuration = Math.max(song.durationSeconds || 120, calculatedEnd);
    }
  }

  /**
   * Presión de un carril: verifica timing según las ventanas de la dificultad activa
   */
  private handleLanePress(lane: number): void {
    this.lanePressed[lane] = true;
    this.playHitsound(lane);

    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;

    let closestNote: FallingNote | null = null;
    let minDiff = 999;

    for (const note of this.notes) {
      // Regla estricta: Una nota ya tocada (!note.hit) o fallada (!note.missed) nunca se puede volver a tomar
      if (note.lane === lane && !note.hit && !note.missed) {
        const diff = Math.abs(note.targetTime - this.currentTime);
        // Ventana estricta al inicio de la nota según la dificultad
        if (diff < minDiff && diff < diffCfg.goodWindow + 0.05) {
          minDiff = diff;
          closestNote = note;
        }
      }
    }

    const laneCenterX = this.laneStartX + lane * this.laneWidth + this.laneWidth / 2;

    if (closestNote) {
      // Marcar inmediatamente como tocada para que no se pueda volver a tomar jamás
      closestNote.hit = true;

      // Juicio según precisión temporal y multiplicador de dificultad
      if (minDiff <= diffCfg.perfectWindow) {
        const pts = Math.round(300 * diffCfg.scoreMultiplier * this.getMultiplier());
        this.addScore(pts);
        this.combo++;
        this.perfectCount++;
        this.spawnJudgement("¡PERFECTO!", "#FFD700", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#FFD700", 1.3);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#FFD700", 16);
      } else if (minDiff <= diffCfg.greatWindow) {
        const pts = Math.round(180 * diffCfg.scoreMultiplier * this.getMultiplier());
        this.addScore(pts);
        this.combo++;
        this.greatCount++;
        this.spawnJudgement("¡GENIAL!", "#00E5FF", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#00E5FF", 1.15);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#00E5FF", 10);
      } else {
        const pts = Math.round(80 * diffCfg.scoreMultiplier * this.getMultiplier());
        this.addScore(pts);
        this.combo++;
        this.goodCount++;
        this.spawnJudgement("¡BIEN!", "#00E676", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#00E676", 1.0);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#00E676", 6);
      }

      // Si es una NOTA SOSTENIDA: comenzar a registrar el sustain SOLO si se tocó al inicio
      if (closestNote.type === "sustain" && closestNote.duration > 0) {
        closestNote.isHolding = true;
        closestNote.holdStartTime = this.currentTime;
        closestNote.lastScoreTickTime = this.currentTime;
      }

      // Star Note: ACTIVA MODO ESTRELLA GUITAR HERO (x4 por 7s)
      if (closestNote.isStar) {
        this.activateStarPower(7.0, laneCenterX, closestNote.logoType || 1);
      }

      // Recuperar 1 campana (vida)
      if (closestNote.isStar || (this.combo > 0 && this.combo % 15 === 0)) {
        if (this.lives < this.maxLives) {
          this.lives = Math.min(this.maxLives, this.lives + 1);
          this.addFloatingText("+1 VIDA", this.width / 2, this.hitLineY - 95, "#00E676", 1.25);
        }
      }

      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
    } else {
      // Si no tocó al inicio e intenta presionar durante la mitad del cuerpo de una nota sostenida: se cuenta como MISS
      for (const note of this.notes) {
        if (note.lane === lane && !note.hit && !note.sustainCompleted) {
          if (note.type === "sustain" && this.currentTime > note.targetTime + 0.24 && this.currentTime < note.targetTime + note.duration + 0.15) {
            note.sustainFailed = true;
            this.spawnJudgement("¡TARDE / MISS!", "#FF1744", laneCenterX);
            this.particles.emitBurst(laneCenterX, this.hitLineY, "#FF1744", 8);
            this.audio.playError();
            this.triggerShake(0.12, 4);
            break;
          }
        }
      }
    }
  }

  /**
   * Liberación de un carril: maneja corte o finalización anticipada de sustain
   */
  private handleLaneRelease(lane: number): void {
    this.lanePressed[lane] = false;

    for (const note of this.notes) {
      if (note.lane === lane && note.isHolding && !note.sustainCompleted) {
        note.isHolding = false;
        const laneCenterX = this.laneStartX + lane * this.laneWidth + this.laneWidth / 2;

        if (note.holdDuration < note.duration * 0.60) {
          // Soltó demasiado pronto
          note.sustainFailed = true;
          this.spawnJudgement("¡SOLTADO!", "#FF9100", laneCenterX);
        } else {
          // Mantuvo una buena porción
          note.sustainCompleted = true;
          const partialBonus = 60 * this.getMultiplier();
          this.addScore(partialBonus);
          this.spawnJudgement("¡BIEN SOSTENIDO!", "#00E676", laneCenterX);
        }
      }
    }
  }

  /**
   * Activa el Modo Estrella estilo Guitar Hero (Multiplicador x4 durante 7s)
   */
  private activateStarPower(durationSeconds: number = 7.0, x: number = this.width / 2, logoType: 1 | 2 = 1): void {
    this.isStarPowerActive = true;
    this.activeStarPowerType = logoType;
    this.starPowerTimer = durationSeconds;
    this.addScore(800);

    this.audio.playPowerUp();
    this.triggerShake(0.25, 7);

    const isCampus = logoType === 2;
    const starColor = isCampus ? "#00E5FF" : "#FFD700";
    const starText = isCampus ? "¡STAR POWER CAMPUS x4!" : "¡STAR POWER FERIA x4!";

    this.particles.emitConfetti(this.width, 40);
    this.addFloatingText(starText, x, this.hitLineY - 75, starColor, 1.55);
  }

  private getMultiplier(): number {
    if (this.isStarPowerActive) return 4;
    if (this.combo >= 30) return 4;
    if (this.combo >= 20) return 3;
    if (this.combo >= 10) return 2;
    return 1;
  }

  private spawnJudgement(text: string, color: string, x: number): void {
    this.activeJudgements.push({
      text,
      color,
      alpha: 1.0,
      scale: 1.25,
      x,
      y: this.hitLineY - 60,
      time: 0.65
    });
  }

  private playHitsound(_lane: number): void {
    // Silenciado intencionalmente: No generar tonos/frecuencias sintéticas para que la música del juego suene limpia sin interferencias
  }

  protected onUpdate(dt: number): void {
    if (this.gameState === "song-select" || this.gameState === "countdown") {
      this.beatPulse = (Date.now() / 1000 * 2) % 1.0;
      this.currentTime = 0;
      return;
    }

    if (this.bgAudioElement && !this.bgAudioElement.paused && this.bgAudioElement.currentTime > 0) {
      const audioTime = this.bgAudioElement.currentTime;
      const diff = audioTime - this.currentTime;
      // Resincronización suave de alta fidelidad: previene saltos discretos y jitter visual
      if (Math.abs(diff) > 0.12) {
        this.currentTime = audioTime;
      } else {
        this.currentTime += dt + diff * 0.25;
      }
    } else {
      this.currentTime += dt;
    }

    // Temporizador de Intro Guitar Hero
    if (this.songIntroTimer > 0) {
      this.songIntroTimer -= dt;
      if (this.songIntroTimer < 0) this.songIntroTimer = 0;
    }

    // Temporizador de Modo Estrella
    if (this.isStarPowerActive) {
      this.starPowerTimer -= dt;
      if (this.starPowerTimer <= 0) {
        this.isStarPowerActive = false;
        this.starPowerTimer = 0;
      }
    }

    this.beatPulse = (this.currentTime * (this.bpm / 60)) % 1.0;

    // Actualización de Notas & NOTAS SOSTENIDAS
    for (const note of this.notes) {
      const laneCenterX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;

      // 1. Manejo del Sustain activo (Holding)
      if (note.type === "sustain" && note.isHolding && !note.sustainCompleted) {
        note.holdDuration += dt;

        // Puntuación por ticks continuos
        if (this.currentTime - note.lastScoreTickTime >= 0.12) {
          note.lastScoreTickTime = this.currentTime;
          const tickPoints = 20 * this.getMultiplier();
          this.addScore(tickPoints);
          this.particles.emitBurst(laneCenterX, this.hitLineY, "#FFD700", 3);
        }

        // ¿Llegó al final del sustain mientras se mantenía presionado?
        if (this.currentTime >= note.targetTime + note.duration) {
          note.isHolding = false;
          note.sustainCompleted = true;
          const completeBonus = 160 * this.getMultiplier();
          this.addScore(completeBonus);
          this.combo++;
          this.spawnJudgement("¡SUSTAIN PERFECTO!", "#FFD700", laneCenterX);
          this.addFloatingText("+BONUS SUSTAIN", laneCenterX, this.hitLineY - 65, "#FFD700", 1.35);
          this.particles.emitBurst(laneCenterX, this.hitLineY, "#FFD700", 18);
        }
      }

      // 2. Manejo de Miss de notas no tocadas
      if (!note.hit && !note.missed) {
        const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;
        if (this.currentTime - note.targetTime > diffCfg.missWindow) {
          note.missed = true;
          this.missCount++;
          this.combo = 0;

          if (this.currentTime > 1.2) {
            this.lives = Math.max(0, this.lives - 1);
          }

          this.spawnJudgement("MISS", "#E53935", laneCenterX);
          this.particles.emitBurst(laneCenterX, this.hitLineY, "#E53935", 10);
          this.audio.playError();
          this.triggerShake(0.18, 6);

          if (this.lives <= 0) {
            this.addFloatingText("¡SIN CAMPANAS!", this.width / 2, this.height * 0.45, "#FF1744", 1.8);
            setTimeout(() => {
              this.endGame();
            }, 300);
            return;
          }
        }
      }
    }

    // Actualización de popups de juicio
    for (let i = this.activeJudgements.length - 1; i >= 0; i--) {
      const j = this.activeJudgements[i];
      j.time -= dt;
      j.y -= dt * 45;
      j.alpha = Math.max(0, j.time / 0.65);
      j.scale = 1.0 + Math.sin(j.time * 6) * 0.15;
      if (j.time <= 0) {
        this.activeJudgements.splice(i, 1);
      }
    }

    // Fin de canción
    if (this.currentTime >= this.songDuration) {
      this.endGame();
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#060F1E";
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      ctx.fillStyle = "rgba(4, 12, 24, 0.85)";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.gameState === "song-select") {
      this.drawSongSelector(ctx);
      return;
    }

    const trackH = this.height;
    const totalW = this.laneWidth * 4;

    ctx.save();
    ctx.fillStyle = "rgba(10, 25, 48, 0.78)";
    ctx.fillRect(this.laneStartX, 0, totalW, trackH);

    // Resplandor Star Power
    if (this.isStarPowerActive) {
      const isCampus = this.activeStarPowerType === 2;
      const starGlow = ctx.createLinearGradient(this.laneStartX, 0, this.laneStartX + totalW, 0);
      if (isCampus) {
        starGlow.addColorStop(0, "rgba(0, 229, 255, 0.45)");
        starGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.40)");
        starGlow.addColorStop(1, "rgba(0, 229, 255, 0.45)");
      } else {
        starGlow.addColorStop(0, "rgba(255, 215, 0, 0.45)");
        starGlow.addColorStop(0.5, "rgba(255, 65, 108, 0.35)");
        starGlow.addColorStop(1, "rgba(255, 215, 0, 0.45)");
      }
      ctx.fillStyle = starGlow;
      ctx.fillRect(this.laneStartX, 0, totalW, trackH);
    } else if (this.combo >= 20) {
      const feverGlow = ctx.createLinearGradient(this.laneStartX, 0, this.laneStartX + totalW, 0);
      feverGlow.addColorStop(0, "rgba(255, 215, 0, 0.25)");
      feverGlow.addColorStop(0.5, "rgba(255, 65, 108, 0.20)");
      feverGlow.addColorStop(1, "rgba(255, 215, 0, 0.25)");
      ctx.fillStyle = feverGlow;
      ctx.fillRect(this.laneStartX, 0, totalW, trackH);
    }

    // Dibujar los 4 Carriles y Rayos de Presión
    for (let i = 0; i < 4; i++) {
      const lx = this.laneStartX + i * this.laneWidth;
      const lane = this.lanes[i];

      if (this.lanePressed[i]) {
        const laneBeam = ctx.createLinearGradient(0, this.hitLineY, 0, 0);
        laneBeam.addColorStop(0, lane.glowColor);
        laneBeam.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = laneBeam;
        ctx.fillRect(lx, 0, this.laneWidth, this.hitLineY);
      }

      ctx.strokeStyle = this.isStarPowerActive ? (this.activeStarPowerType === 2 ? "#00E5FF" : "#FFD700") : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = this.isStarPowerActive ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, trackH);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(this.laneStartX + totalW, 0);
    ctx.lineTo(this.laneStartX + totalW, trackH);
    ctx.stroke();
    ctx.restore();

    // Línea de Impacto
    ctx.save();
    const hitBarGlow = ctx.createLinearGradient(this.laneStartX, 0, this.laneStartX + totalW, 0);
    hitBarGlow.addColorStop(0, "rgba(255, 215, 0, 0.8)");
    hitBarGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    hitBarGlow.addColorStop(1, "rgba(255, 215, 0, 0.8)");
    ctx.strokeStyle = hitBarGlow;
    ctx.lineWidth = this.isStarPowerActive ? 6 : 4;
    ctx.beginPath();
    ctx.moveTo(this.laneStartX, this.hitLineY);
    ctx.lineTo(this.laneStartX + totalW, this.hitLineY);
    ctx.stroke();
    ctx.restore();

    // Receptores inferiores
    for (let i = 0; i < 4; i++) {
      const lane = this.lanes[i];
      const cx = this.laneStartX + i * this.laneWidth + this.laneWidth / 2;
      const cy = this.hitLineY;
      const radius = Math.min(this.laneWidth * 0.38, 38);
      const isPressed = this.lanePressed[i];
      const scale = isPressed ? 0.90 : (1.0 + Math.sin(this.beatPulse * Math.PI) * 0.05);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      const padHalo = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.5);
      padHalo.addColorStop(0, lane.glowColor);
      padHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = padHalo;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = isPressed ? 4.5 : 3;
      ctx.strokeStyle = isPressed ? "#FFFFFF" : lane.color;
      ctx.fillStyle = isPressed ? lane.color : "rgba(8, 20, 38, 0.85)";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = "900 24px 'Cinzel Decorative', 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 4;
      ctx.strokeText(lane.arrow, 0, -1);
      ctx.fillStyle = isPressed ? "#FFFFFF" : lane.color;
      ctx.fillText(lane.arrow, 0, -1);

      ctx.font = "700 12px 'Outfit', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText(lane.keyLabel, 0, radius + 16);

      ctx.restore();
    }

    // ==========================================================================
    // RENDERIZADO DE NOTAS Y NOTAS SOSTENIDAS (SUSTAIN NOTES)
    // ==========================================================================
    for (const note of this.notes) {
      if (note.missed) continue;

      const lane = this.lanes[note.lane];
      const noteX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
      const radius = Math.min(this.laneWidth * 0.36, 36);

      // Si es NOTA SOSTENIDA: Dibujar cuerpo y cola
      if (note.type === "sustain" && note.duration > 0 && !note.sustainCompleted) {
        const timeHeadDiff = note.targetTime - this.currentTime;
        const timeTailDiff = (note.targetTime + note.duration) - this.currentTime;

        let yHead = this.hitLineY - timeHeadDiff * this.noteSpeed;
        const yTail = this.hitLineY - timeTailDiff * this.noteSpeed;

        // Si se está sosteniendo, la cabeza permanece anclada en la línea de impacto
        if (note.isHolding) {
          yHead = this.hitLineY;
        }

        if (yHead > -100 && yTail < this.height + 100) {
          const bodyWidth = Math.max(14, radius * 0.75);

          ctx.save();

          // 1. Cuerpo del Sustain (Haz de luz navideño / Bastón de Caramelo brillante)
          const bodyGrad = ctx.createLinearGradient(noteX - bodyWidth / 2, 0, noteX + bodyWidth / 2, 0);
          if (note.isHolding) {
            bodyGrad.addColorStop(0, "#FFFFFF");
            bodyGrad.addColorStop(0.3, lane.color);
            bodyGrad.addColorStop(0.7, "#FFD700");
            bodyGrad.addColorStop(1, "#FFFFFF");
          } else {
            bodyGrad.addColorStop(0, lane.glowColor);
            bodyGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
            bodyGrad.addColorStop(1, lane.glowColor);
          }

          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.roundRect(noteX - bodyWidth / 2, yTail, bodyWidth, Math.max(4, yHead - yTail), bodyWidth / 2);
          ctx.fill();

          // Borde con brillo
          ctx.lineWidth = note.isHolding ? 3.0 : 1.8;
          ctx.strokeStyle = note.isHolding ? "#FFFFFF" : lane.color;
          ctx.stroke();

          // 2. Extremo final (Cola / Terminación)
          ctx.fillStyle = note.isHolding ? "#FFD700" : lane.color;
          ctx.beginPath();
          ctx.arc(noteX, yTail, bodyWidth * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.stroke();

          // 3. Efectos de chispas en la zona de contacto si se sostiene
          if (note.isHolding) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = lane.color;
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(noteX, this.hitLineY, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      // Dibujar Cabeza de la Nota
      const timeDiff = note.targetTime - this.currentTime;
      const noteY = this.hitLineY - timeDiff * this.noteSpeed;

      if (noteY > -80 && noteY < this.height + 80) {
        ctx.save();

        // Si ya fue tocada, mostrarla translúcida / opaca para indicar que ya fue consumida
        if (note.hit) {
          ctx.globalAlpha = 0.32;
        }

        ctx.translate(noteX, noteY);

        const isCampus = note.logoType === 2;

        let sprite: HTMLImageElement | null = null;
        if (note.isStar) {
          if (isCampus) {
            sprite = this.imgLogoCampus.complete && this.imgLogoCampus.naturalWidth > 0 ? this.imgLogoCampus : this.imgStarWithLogo;
          } else {
            sprite = this.imgLogoFair.complete && this.imgLogoFair.naturalWidth > 0 ? this.imgLogoFair : this.imgStarWithLogo;
          }
        } else if (note.lane === 0) sprite = this.imgArrowLeft;
        else if (note.lane === 1) sprite = this.imgArrowDown;
        else if (note.lane === 2) sprite = this.imgArrowUp;
        else if (note.lane === 3) sprite = this.imgArrowRight;

        const drawSize = radius * 2.35;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          ctx.font = "900 28px 'Cinzel Decorative', 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = note.isStar ? "#FFD700" : lane.color;
          ctx.fillText(note.isStar ? "⭐" : lane.arrow, 0, 0);
        }

        ctx.restore();
      }
    }

    // Dibujar Popups de Juicio
    for (const j of this.activeJudgements) {
      ctx.save();
      ctx.globalAlpha = j.alpha;
      ctx.translate(j.x, j.y);
      ctx.scale(j.scale, j.scale);

      ctx.font = "900 22px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = 5;
      ctx.strokeText(j.text, 0, 0);

      ctx.fillStyle = j.color;
      ctx.fillText(j.text, 0, 0);

      ctx.restore();
    }

    // Badge de Rango en Vivo (Live Grade Rank)
    const rankInfo = this.calculateRank();
    const totalTrackW = this.laneWidth * 4;
    const rankBadgeX = Math.min(this.laneStartX + totalTrackW - 35, this.width - 55);
    const rankBadgeY = 72;
    
    ctx.save();
    ctx.translate(rankBadgeX, rankBadgeY);
    ctx.fillStyle = "rgba(4, 16, 32, 0.88)";
    ctx.strokeStyle = rankInfo.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-28, -18, 56, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 19px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = rankInfo.color;
    ctx.shadowColor = rankInfo.color;
    ctx.shadowBlur = 10;
    ctx.fillText(rankInfo.rank, 0, 0);
    ctx.restore();

    // ==========================================================================
    // INTRO DE CRÉDITOS CINEMÁTICA ESTILO GUITAR HERO
    // ==========================================================================
    this.drawGuitarHeroSongCredits(ctx);
  }

  /**
   * Rótulo cinemático de inicio estilo Guitar Hero (Título, Autor, Dificultad y Créditos de Licencia)
   */
  private drawGuitarHeroSongCredits(ctx: CanvasRenderingContext2D): void {
    if (this.songIntroTimer <= 0) return;

    const song = this.songList[this.selectedSongIndex];
    if (!song) return;

    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;
    const elapsed = this.SONG_INTRO_DURATION - this.songIntroTimer;
    let alpha = 1.0;
    let slideOffsetX = 0;

    // Fade In & Slide In (0.0s - 0.6s)
    if (elapsed < 0.6) {
      const progress = elapsed / 0.6;
      alpha = progress;
      slideOffsetX = (1 - progress) * -40;
    } 
    // Fade Out & Slide Out (3.6s - 4.4s)
    else if (this.songIntroTimer < 0.8) {
      const progress = this.songIntroTimer / 0.8;
      alpha = progress;
      slideOffsetX = (1 - progress) * -30;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const hudH = Math.max(44, Math.min(68, this.height * 0.075));
    const cardX = 30 + slideOffsetX;
    const cardY = hudH + 26;

    // Rótulo de Estilo Guitar Hero / Rock Navideño
    const titleFont = Math.max(16, Math.min(26, this.width * 0.046));
    const authorFont = Math.max(12, Math.min(17, this.width * 0.032));
    const creditFont = Math.max(9.5, Math.min(12.5, this.width * 0.024));

    // 1. TÍTULO DE LA CANCIÓN
    ctx.font = `900 ${titleFont}px 'Cinzel Decorative', 'Outfit', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
    ctx.lineWidth = 6;
    ctx.strokeText(song.title.toUpperCase(), cardX, cardY);

    const titleGrad = ctx.createLinearGradient(cardX, cardY, cardX + 300, cardY);
    titleGrad.addColorStop(0, "#FFD700");
    titleGrad.addColorStop(0.5, "#FFFFFF");
    titleGrad.addColorStop(1, song.tagColor);
    ctx.fillStyle = titleGrad;
    ctx.fillText(song.title.toUpperCase(), cardX, cardY);

    // 2. BY [ARTISTA] + BADGE DIFICULTAD
    const authorY = cardY + titleFont + 6;
    ctx.font = `800 ${authorFont}px 'Outfit', sans-serif`;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
    ctx.lineWidth = 4;
    const authText = `BY ${song.artist.toUpperCase()}  •  [${diffCfg.label} • ${diffCfg.scoreMultiplier}x]`;
    ctx.strokeText(authText, cardX, authorY);
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(authText, cardX, authorY);

    // 3. NOTA DE LICENCIA / CRÉDITOS
    const creditY = authorY + authorFont + 4;
    ctx.font = `600 ${creditFont}px 'Outfit', sans-serif`;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 3;
    ctx.strokeText(song.credits, cardX, creditY);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(song.credits, cardX, creditY);

    ctx.restore();
  }

  /**
   * Dibuja un icono vectorial temático de alta calidad en el canvas para cada canción
   */
  private drawSongBadgeVectorIcon(ctx: CanvasRenderingContext2D, iconName: string, x: number, y: number, size: number, color: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const s = size / 24;
    ctx.scale(s, s);

    ctx.beginPath();
    switch (iconName) {
      case "guitar":
        // Guitarra estilizada
        ctx.moveTo(0, -9);
        ctx.lineTo(8, -1);
        ctx.moveTo(5, -6);
        ctx.lineTo(-4, 3);
        ctx.bezierCurveTo(-9, 8, -9, 10, -5, 10);
        ctx.bezierCurveTo(-1, 10, 2, 7, 0, 0);
        ctx.stroke();
        break;
      case "zap":
        // Rayo / Trueno
        ctx.moveTo(2, -10);
        ctx.lineTo(-8, 2);
        ctx.lineTo(0, 2);
        ctx.lineTo(-2, 10);
        ctx.lineTo(8, -2);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case "crown":
        // Corona Real
        ctx.moveTo(-10, -5);
        ctx.lineTo(-7, 7);
        ctx.lineTo(7, 7);
        ctx.lineTo(10, -5);
        ctx.lineTo(4, 2);
        ctx.lineTo(0, -7);
        ctx.lineTo(-4, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case "sparkles":
        // Destello mágico de 4 puntas
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(0, 0, 10, 0);
        ctx.quadraticCurveTo(0, 0, 0, 10);
        ctx.quadraticCurveTo(0, 0, -10, 0);
        ctx.quadraticCurveTo(0, 0, 0, -10);
        ctx.fill();
        ctx.stroke();
        break;
      case "bell":
        // Campana dorada
        ctx.arc(0, -2, 6, Math.PI, 0, false);
        ctx.lineTo(9, 6);
        ctx.lineTo(-9, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 8, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "tree":
        // Árbol navideño
        ctx.moveTo(0, -10);
        ctx.lineTo(7, 0);
        ctx.lineTo(3, 0);
        ctx.lineTo(9, 7);
        ctx.lineTo(-9, 7);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(-2, 7, 4, 3);
        break;
      default:
        // Nota musical por defecto
        ctx.arc(-3, 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-1, -8, 2, 12);
        ctx.fillRect(-1, -8, 8, 3);
        break;
    }

    ctx.restore();
  }

  /**
   * En la pantalla de selección de canciones se oculta el HUD de vidas/tiempo para evitar solapamientos
   */
  protected override drawHUD(ctx: CanvasRenderingContext2D): void {
    if (this.gameState === "song-select") {
      return;
    }
    super.drawHUD(ctx);
  }

  /**
   * Pantalla de Selección de Canción interactiva con selector de dificultad y canciones
   */
  private drawSongSelector(ctx: CanvasRenderingContext2D): void {
    const layout = this.getSongSelectLayout();
    const cx = layout.cx;

    ctx.save();

    // Fondo / Viñeta suave para enfocar el selector
    ctx.fillStyle = "rgba(4, 12, 26, 0.45)";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = `900 clamp(1.05rem, 3.2vw, 1.45rem) 'Cinzel Decorative', 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("SELECCIONA TU CANCIÓN", cx, layout.titleY);

    ctx.font = `700 clamp(0.65rem, 1.8vw, 0.80rem) 'Outfit', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("Concierto Navideño • Alexander Nakarada", cx, layout.subY);

    const cardW = layout.cardW;
    const cardX = layout.cardX;

    // =========================================================================
    // BARRA SELECTORA DE DIFICULTADES (4 PESTAÑAS / BOTONES PILL)
    // =========================================================================
    const diffKeys: DifficultyLevel[] = ["easy", "normal", "hard", "expert"];

    for (let d = 0; d < 4; d++) {
      const key = diffKeys[d];
      const cfg = DIFFICULTY_CONFIGS[key];
      const tx = cardX + d * (layout.tabW + layout.tabGap);
      const isSelected = this.selectedDifficulty === key;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(tx, layout.diffBarY, layout.tabW, layout.diffBarH, 10);

      if (isSelected) {
        // Pestaña Activa: Fondo brillante
        const activeGrad = ctx.createLinearGradient(tx, layout.diffBarY, tx, layout.diffBarY + layout.diffBarH);
        activeGrad.addColorStop(0, cfg.color);
        activeGrad.addColorStop(1, "rgba(255, 255, 255, 0.9)");
        ctx.fillStyle = activeGrad;
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Resplandor exterior
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 12;

        ctx.font = `900 ${Math.max(9, Math.min(12, layout.diffBarH * 0.38))}px 'Outfit', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#031524";
        ctx.fillText(cfg.shortLabel, tx + layout.tabW / 2, layout.diffBarY + layout.diffBarH * 0.42);

        ctx.font = `800 ${Math.max(7.5, Math.min(9.5, layout.diffBarH * 0.26))}px 'Outfit', sans-serif`;
        ctx.fillStyle = "#0A2540";
        ctx.fillText(`${cfg.scoreMultiplier}x Pts`, tx + layout.tabW / 2, layout.diffBarY + layout.diffBarH * 0.78);
      } else {
        // Pestaña Inactiva
        ctx.fillStyle = "rgba(8, 22, 44, 0.85)";
        ctx.fill();

        ctx.strokeStyle = cfg.glowColor;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.font = `800 ${Math.max(8.5, Math.min(11, layout.diffBarH * 0.36))}px 'Outfit', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillText(cfg.shortLabel, tx + layout.tabW / 2, layout.diffBarY + layout.diffBarH * 0.42);

        ctx.font = `600 ${Math.max(7, Math.min(9, layout.diffBarH * 0.24))}px 'Outfit', sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fillText(`${cfg.scoreMultiplier}x`, tx + layout.tabW / 2, layout.diffBarY + layout.diffBarH * 0.78);
      }

      ctx.restore();
    }

    // =========================================================================
    // LISTA DE CANCIONES (6 Canciones)
    // =========================================================================
    const activeDiffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;
    const count = layout.count;
    const cardH = layout.cardH;

    for (let i = 0; i < count; i++) {
      const song = this.songList[i];
      const cy = layout.startY + i * (cardH + layout.gap);
      const isSelected = i === this.selectedSongIndex;

      // Fondo
      ctx.fillStyle = isSelected ? "rgba(14, 40, 78, 0.95)" : "rgba(8, 20, 40, 0.90)";
      ctx.beginPath();
      ctx.roundRect(cardX, cy, cardW, cardH, 12);
      ctx.fill();

      // Borde brillante
      ctx.lineWidth = isSelected ? 2.8 : 1.5;
      ctx.strokeStyle = isSelected ? activeDiffCfg.color : "rgba(255, 215, 0, 0.35)";
      ctx.stroke();

      // Icono Vectorial estilizado
      const iconSize = Math.max(16, Math.min(24, cardH * 0.44));
      const iconX = cardX + iconSize + 8;
      const iconY = cy + cardH / 2;
      this.drawSongBadgeVectorIcon(ctx, song.icon, iconX, iconY, iconSize, isSelected ? activeDiffCfg.color : "#FFD700");

      // Título
      const titleFont = Math.max(10.5, Math.min(14, cardH * 0.29));
      ctx.font = `900 ${titleFont}px 'Outfit', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
      ctx.fillText(song.title, cardX + iconSize * 2 + 12, cy + cardH * 0.36);

      // Subtítulo y BPM
      const subFont = Math.max(8, Math.min(10.5, cardH * 0.22));
      ctx.font = `600 ${subFont}px 'Outfit', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText(`${song.subtitle} • ${song.bpm} BPM`, cardX + iconSize * 2 + 12, cy + cardH * 0.72);

      // Badge de Dificultad Dinámica
      const badgeW = Math.max(54, Math.min(76, cardW * 0.17));
      const badgeH = Math.max(17, Math.min(22, cardH * 0.40));
      const badgeX = cardX + cardW - badgeW - 10;
      const badgeY = cy + (cardH - badgeH) / 2;

      ctx.fillStyle = activeDiffCfg.color;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
      ctx.fill();

      ctx.font = `900 ${Math.max(8, Math.min(10.5, badgeH * 0.52))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#031524";
      ctx.fillText(`${activeDiffCfg.shortLabel} ${activeDiffCfg.scoreMultiplier}x`, badgeX + badgeW / 2, badgeY + badgeH / 2);
    }

    // Botón Modo Grabador / Editor
    const editorBtnY = layout.editorBtnY;
    const editorBtnH = layout.editorBtnH;

    const btnGrad = ctx.createLinearGradient(cardX, editorBtnY, cardX + cardW, editorBtnY);
    btnGrad.addColorStop(0, "#FF8F00");
    btnGrad.addColorStop(0.5, "#FFD700");
    btnGrad.addColorStop(1, "#FF8F00");

    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, editorBtnY, cardW, editorBtnH, 12);
    ctx.fill();

    ctx.lineWidth = 2.0;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    ctx.font = `900 ${Math.max(10, Math.min(13, editorBtnH * 0.35))}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#041424";
    ctx.fillText("MODO GRABADOR / EDITOR DE RITMO", cx, editorBtnY + editorBtnH * 0.38);

    ctx.font = `700 ${Math.max(8, Math.min(10, editorBtnH * 0.25))}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#041424";
    ctx.fillText("Graba notas normales y sostenidas • Pulsa [ X ]", cx, editorBtnY + editorBtnH * 0.74);

    ctx.restore();
  }

  /**
   * Calcula el rango (S+, S, A, B, C, D) basado en precisión y fallos
   */
  public calculateRank(): { rank: "S+" | "S" | "A" | "B" | "C" | "D"; accuracy: number; label: string; color: string } {
    const totalNotes = this.perfectCount + this.greatCount + this.goodCount + this.missCount;
    if (totalNotes === 0) return { rank: "S", accuracy: 100, label: "¡PERFECTO!", color: "#FFD700" };

    const scoreWeighted = (this.perfectCount * 1.0 + this.greatCount * 0.70 + this.goodCount * 0.40);
    const accuracy = Math.min(100, Math.round((scoreWeighted / totalNotes) * 100));

    if (accuracy >= 95 && this.missCount === 0) {
      return { rank: "S+", accuracy, label: "RANGO LEGENDARIO", color: "#FFD700" };
    } else if (accuracy >= 90) {
      return { rank: "S", accuracy, label: "RANGO EXCELENTE", color: "#FFD700" };
    } else if (accuracy >= 78) {
      return { rank: "A", accuracy, label: "RANGO GENIAL", color: "#00E5FF" };
    } else if (accuracy >= 65) {
      return { rank: "B", accuracy, label: "RANGO BUENO", color: "#00E676" };
    } else if (accuracy >= 50) {
      return { rank: "C", accuracy, label: "RANGO REGULAR", color: "#FF9100" };
    } else {
      return { rank: "D", accuracy, label: "RANGO ASPIRANTE", color: "#FF5252" };
    }
  }

  public override endGame(): void {
    this.stopSongAudio();
    const rankInfo = this.calculateRank();
    const song = this.songList[this.selectedSongIndex];
    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;

    super.endGame({
      isCustomChart: this.isCustomChartPlaying,
      customNotes: this.lastCustomNotes.length > 0 ? this.lastCustomNotes : undefined,
      songFile: this.isCustomChartPlaying ? this.lastCustomSongFile : (song?.audioFile || "juego campanas/God Rest Ye Merry Metalmen.mp3"),
      songTitle: this.isCustomChartPlaying ? "Partitura Personalizada" : (song?.title || "Sinfonía de Campanas"),
      songArtist: this.isCustomChartPlaying ? "Creador de Ritmo" : (song?.artist || "Alexander Nakarada"),
      difficulty: this.selectedDifficulty,
      difficultyLabel: diffCfg.label,
      difficultyColor: diffCfg.color,
      bpm: this.bpm,
      rank: rankInfo.rank,
      rankLabel: rankInfo.label,
      rankColor: rankInfo.color,
      accuracy: rankInfo.accuracy,
      maxCombo: this.maxCombo,
      perfectCount: this.perfectCount,
      greatCount: this.greatCount,
      goodCount: this.goodCount,
      missCount: this.missCount,
      totalNotes: this.perfectCount + this.greatCount + this.goodCount + this.missCount
    });
  }

  public override destroy(): void {
    super.destroy();
    this.chartEditor.hide();
    this.stopSongAudio();
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
    }
    if (this.keyupHandler) {
      window.removeEventListener("keyup", this.keyupHandler);
    }
  }
}
