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
import { BRANDING } from "../config/branding";
import { InputManager } from "../core/InputManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { ScreenTransition } from "../core/ScreenTransition";
import { StorageManager } from "../core/StorageManager";
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
  JOY_TO_WORLD_ULTRA_CHART,
  JOY_TO_WORLD_ULTRA_CHART_EASY,
  JOY_TO_WORLD_ULTRA_CHART_NORMAL,
  JOY_TO_WORLD_ULTRA_CHART_HARD,
  JOY_TO_WORLD_ULTRA_CHART_EXPERT,
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
  sanitizeChartNotes,
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
    speedMultiplier: 0.70,
    perfectWindow: 0.125,
    greatWindow: 0.220,
    goodWindow: 0.320,
    missWindow: 0.400,
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
    speedMultiplier: 0.88,
    perfectWindow: 0.095,
    greatWindow: 0.170,
    goodWindow: 0.260,
    missWindow: 0.340,
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
    speedMultiplier: 1.05,
    perfectWindow: 0.082,
    greatWindow: 0.145,
    goodWindow: 0.225,
    missWindow: 0.295,
    scoreMultiplier: 1.60,
    lives: 5,
    description: "Ritmo activo con acordes dobles"
  },
  expert: {
    id: "expert",
    label: "LEYENDA",
    shortLabel: "LEYENDA",
    icon: "🔥",
    color: "#D500F9",
    glowColor: "rgba(213, 0, 249, 0.5)",
    speedMultiplier: 1.25,
    perfectWindow: 0.075,
    greatWindow: 0.135,
    goodWindow: 0.210,
    missWindow: 0.270,
    scoreMultiplier: 2.00,
    lives: 5,
    description: "Nivel Leyenda: ¡Acordes triples, velocidad extrema y shredding total!"
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
  sponsorId?: string;
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
  private lastMissLifeLossTime: number = -1;
  private currentTargetMaxScore: number = 0;

  // MODO ESTRELLA / STAR POWER (Guitar Hero Style x4 Multiplier)
  private starPowerTimer: number = 0;
  private isStarPowerActive: boolean = false;
  private activeStarPowerSponsorId: string = "feria";

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
    this.floatingTextSystem.update(dt);

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
    this.lastMissLifeLossTime = -1;
    this.lanePressed = [false, false, false, false];
    this.activePointerLanes.clear();
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;
    this.activeStarPowerSponsorId = "feria";
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
    const subKey = `${song.id}_${this.selectedDifficulty}`;
    this.setSubKey(subKey);

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
    this.lastMissLifeLossTime = -1;
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;
    this.activeStarPowerSponsorId = "feria";
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
          const hasPendingNotes = this.notes.some(n => !n.hit && !n.missed && n.targetTime >= this.currentTime - 0.2);
          const delay = hasPendingNotes ? 1400 : 500;
          setTimeout(() => {
            if (this.gameState === "playing" && !this.isGameOver) {
              this.endGame();
            }
          }, delay);
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
    this.setSubKey(undefined);
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
    const cleanCustomNotes = sanitizeChartNotes(customNotes, this.selectedDifficulty);
    this.isCustomChartPlaying = true;
    this.lastCustomNotes = [...cleanCustomNotes];
    this.lastCustomSongFile = songFile;
    this.setSubKey("custom");
    this.currentTargetMaxScore = this.calculateMaxScoreForChart(cleanCustomNotes, this.selectedDifficulty);

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
    this.lastMissLifeLossTime = -1;
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;
    this.activeStarPowerSponsorId = "feria";
    this.songIntroTimer = this.SONG_INTRO_DURATION;
    this.lanePressed = [false, false, false, false];
    this.activePointerLanes.clear();

    const lastNoteTime = cleanCustomNotes.length > 0 ? cleanCustomNotes[cleanCustomNotes.length - 1].time + (cleanCustomNotes[cleanCustomNotes.length - 1].duration || 0) + 3.0 : 120;
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
          const hasPendingNotes = this.notes.some(n => !n.hit && !n.missed && n.targetTime >= this.currentTime - 0.2);
          const delay = hasPendingNotes ? 1400 : 500;
          setTimeout(() => {
            if (this.gameState === "playing" && !this.isGameOver) {
              this.endGame();
            }
          }, delay);
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
    const allSponsors = BRANDING.getAllSponsors();
    for (const item of cleanCustomNotes) {
      let logoType: 1 | 2 = 1;
      let sponsorId: string | undefined = undefined;
      if (item.isStar) {
        const sponsor = allSponsors[starCount % allSponsors.length];
        sponsorId = sponsor.id;
        starCount++;
        logoType = sponsor.id === "campus" ? 2 : 1;
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
        logoType: item.isStar ? logoType : undefined,
        sponsorId
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
    const cardH = Math.min(50, Math.max(isShort ? 24 : (isLandscape ? 28 : 34), (availableSongArea - (count - 1) * gap) / (count + 0.95)));

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
        else if (e.key === "7" && this.songList.length >= 7) this.startSong(6);
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
   * Calcula la puntuación máxima teórica (100% Perfect Full Combo) para una canción y dificultad dada
   */
  public calculateMaxScoreForChart(chart: ChartNoteRecord[], diff: DifficultyLevel): number {
    const diffCfg = DIFFICULTY_CONFIGS[diff] || DIFFICULTY_CONFIGS.normal;
    let simulatedScore = 0;
    let simulatedCombo = 0;
    let starPowerRemaining = 0;

    for (let i = 0; i < chart.length; i++) {
      const note = chart[i];
      simulatedCombo++;

      // Multiplicador base por combo (1x, 2x a 10+, 3x a 25+, 4x a 50+)
      let baseMult = 1;
      if (simulatedCombo >= 50) baseMult = 4;
      else if (simulatedCombo >= 25) baseMult = 3;
      else if (simulatedCombo >= 10) baseMult = 2;

      // Si Star Power está activo (simulando x4)
      const effectiveMult = starPowerRemaining > 0 ? 4 : baseMult;

      // Puntos por cabeza Perfect
      const tapPts = Math.round(300 * diffCfg.scoreMultiplier * effectiveMult);
      simulatedScore += tapPts;

      // Si es nota sostenida
      const dur = note.duration && note.duration > 0 ? note.duration : 0;
      if (dur > 0) {
        const ticks = Math.floor(dur / 0.12);
        simulatedScore += ticks * 20 * effectiveMult;
        simulatedScore += 160 * effectiveMult;
      }

      // Si es Star Note
      if (note.isStar) {
        simulatedScore += 800;
        starPowerRemaining = 7.0;
      } else if (starPowerRemaining > 0) {
        const nextTime = i < chart.length - 1 ? chart[i + 1].time : note.time + 1.0;
        starPowerRemaining = Math.max(0, starPowerRemaining - (nextTime - note.time));
      }
    }

    return Math.max(1000, simulatedScore);
  }

  /**
   * Genera y adapta la partitura de notas para la canción según la dificultad seleccionada
   */
  private generateSongChart(song: SongDef): void {
    let sourceChart: ChartNoteRecord[] = [];
    const diff = this.selectedDifficulty;
    let isHandcrafted = false;

    switch (song.id) {
      case "joy-to-world-ultra":
        if (diff === "easy") sourceChart = JOY_TO_WORLD_ULTRA_CHART_EASY;
        else if (diff === "normal") sourceChart = JOY_TO_WORLD_ULTRA_CHART_NORMAL;
        else if (diff === "hard") sourceChart = JOY_TO_WORLD_ULTRA_CHART_HARD;
        else if (diff === "expert") sourceChart = JOY_TO_WORLD_ULTRA_CHART_EXPERT;
        else sourceChart = JOY_TO_WORLD_ULTRA_CHART;
        isHandcrafted = true;
        break;
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
      // Usar partitura artesanal exacta
      adaptedChart = sourceChart.map((n) => ({ ...n }));
      if (diff === "expert") {
        // En dificultad LEYENDA: Olvidar la regla de 2 dedos e inyectar acordes triples en pulsos y acordes clave
        // sin interrumpir ni pisar notas sostenidas (sustains)
        const sustainWindows = adaptedChart
          .filter((n) => n.duration && n.duration > 0)
          .map((n) => [n.time - 0.08, n.time + (n.duration || 0) + 0.16] as const);

        const chordsByTime = new Map<number, number[]>();
        for (const note of adaptedChart) {
          const t = Number(note.time.toFixed(2));
          let matchedKey: number | null = null;
          for (const key of chordsByTime.keys()) {
            if (Math.abs(key - t) <= 0.04) {
              matchedKey = key;
              break;
            }
          }
          if (matchedKey !== null) {
            chordsByTime.get(matchedKey)!.push(note.lane);
          } else {
            chordsByTime.set(t, [note.lane]);
          }
        }

        const tripleChords: ChartNoteRecord[] = [];
        let chordIdx = 0;
        for (const [t, lanes] of chordsByTime.entries()) {
          const insideSustain = sustainWindows.some(([s0, s1]) => t >= s0 && t <= s1);
          if (insideSustain) continue;

          // Si ya hay 2 notas simultáneas (acorde existente) o en acentos rítmicos fuertes sin sustain
          if (lanes.length >= 2 || (lanes.length === 1 && chordIdx % 3 === 0)) {
            chordIdx++;
            const usedLanes = new Set(lanes);
            const freeLanes = [0, 1, 2, 3].filter((l) => !usedLanes.has(l));
            // Si tiene 2 notas, añadir una 3ª para formar un acorde triple completo
            if (lanes.length === 2 && freeLanes.length > 0) {
              const thirdLane = freeLanes[chordIdx % freeLanes.length];
              tripleChords.push({
                lane: thirdLane,
                time: t,
                duration: 0,
                type: "normal"
              });
            } else if (lanes.length === 1 && freeLanes.length >= 2 && chordIdx % 5 === 0) {
              // En compases clave adicionales, promover a acorde triple
              tripleChords.push({
                lane: freeLanes[0],
                time: t,
                duration: 0,
                type: "normal"
              });
              tripleChords.push({
                lane: freeLanes[1],
                time: t,
                duration: 0,
                type: "normal"
              });
            }
          }
        }
        adaptedChart = [...adaptedChart, ...tripleChords].sort((a, b) => a.time - b.time);
      }
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
      // Modo Leyenda: Notas triples simultáneas (acordes de 3 campanas) en pulsos clave
      adaptedChart = sourceChart.map((n) => ({ ...n }));
      const chords: ChartNoteRecord[] = [];
      for (let i = 0; i < sourceChart.length; i++) {
        const cur = sourceChart[i];
        if (i % 3 === 0 && (!cur.duration || cur.duration === 0)) {
          const chordLane1 = (cur.lane + 1) % 4;
          const chordLane2 = (cur.lane + 2) % 4;
          chords.push({
            lane: chordLane1,
            time: cur.time,
            duration: 0,
            type: "normal"
          });
          chords.push({
            lane: chordLane2,
            time: cur.time,
            duration: 0,
            type: "normal"
          });
        }
      }
      adaptedChart = [...adaptedChart, ...chords].sort((a, b) => a.time - b.time);
    }

    // Saneamiento final: evita notas duplicadas en el mismo lugar, sustains sobre sustains o flechas amontonadas
    adaptedChart = sanitizeChartNotes(adaptedChart, diff);

    this.notes = [];
    let noteId = 0;
    let starCount = 0;
    const allSponsors = BRANDING.getAllSponsors();

    for (const item of adaptedChart) {
      let logoType: 1 | 2 = 1;
      let sponsorId: string | undefined = undefined;
      if (item.isStar) {
        const sponsor = allSponsors[starCount % allSponsors.length];
        sponsorId = sponsor.id;
        starCount++;
        logoType = sponsor.id === "campus" ? 2 : 1;
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
        logoType: item.isStar ? logoType : undefined,
        sponsorId
      });
    }

    const lastItem = adaptedChart[adaptedChart.length - 1];
    if (lastItem) {
      const calculatedEnd = lastItem.time + (lastItem.duration || 0) + 3.0;
      this.songDuration = Math.max(song.durationSeconds || 120, calculatedEnd);
    }

    this.currentTargetMaxScore = this.calculateMaxScoreForChart(adaptedChart, this.selectedDifficulty);
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
        const sId = closestNote.sponsorId || (closestNote.logoType === 2 ? "campus" : "feria");
        this.activateStarPower(7.0, laneCenterX, sId);
      }

      // Recuperar 1 campana (vida)
      if (closestNote.isStar || (this.combo > 0 && this.combo % 12 === 0)) {
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
  private activateStarPower(durationSeconds: number = 7.0, x: number = this.width / 2, sponsorIdOrLegacy: string | 1 | 2 = "feria"): void {
    const sponsor = typeof sponsorIdOrLegacy === "string"
      ? BRANDING.getLogoConfig(sponsorIdOrLegacy)
      : BRANDING.getLogoConfig(sponsorIdOrLegacy === 2 ? "campus" : "feria");

    this.isStarPowerActive = true;
    this.activeStarPowerSponsorId = sponsor.id;
    this.starPowerTimer = durationSeconds;
    this.triggerLogoPowerUp(sponsor.id, durationSeconds);
    this.addScore(800);

    this.audio.playPowerUp();
    this.triggerShake(0.25, 7);

    const starColor = sponsor.themeColor || "#FFD700";
    const starText = `¡STAR POWER ${sponsor.shortName.toUpperCase()} x4!`;

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
    if (text !== "MISS" && !text.includes("MISS")) {
      this.hitRings.push({ x, color, t: 0 });
      if (this.hitRings.length > 24) this.hitRings.shift();
    }
  }

  // ==========================================================================
  // AMBIENTE VISUAL: destellos al ritmo, haces de luz, brasas y ecualizador
  // ==========================================================================
  private ambientMotes: { x: number; y: number; vy: number; r: number; phase: number; hue: number }[] = [];
  private hitRings: { x: number; color: string; t: number }[] = [];
  private lastComboSeen: number = 0;
  private comboPop: number = 0;

  private updateAmbient(dt: number): void {
    if (this.ambientMotes.length === 0 && this.width > 0) {
      for (let i = 0; i < 46; i++) {
        this.ambientMotes.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vy: 14 + Math.random() * 34,
          r: 1.2 + Math.random() * 2.6,
          phase: Math.random() * Math.PI * 2,
          hue: Math.random()
        });
      }
    }
    const speedBoost = this.isStarPowerActive ? 3 : (this.combo >= 20 ? 1.8 : 1);
    for (const m of this.ambientMotes) {
      m.y -= m.vy * dt * speedBoost;
      m.phase += dt * 2;
      if (m.y < -10) {
        m.y = this.height + 10;
        m.x = Math.random() * this.width;
      }
    }
    for (let i = this.hitRings.length - 1; i >= 0; i--) {
      this.hitRings[i].t += dt * 2.6;
      if (this.hitRings[i].t >= 1) this.hitRings.splice(i, 1);
    }
    if (this.combo !== this.lastComboSeen) {
      if (this.combo > this.lastComboSeen) this.comboPop = 1;
      this.lastComboSeen = this.combo;
    }
    this.comboPop = Math.max(0, this.comboPop - dt * 4.5);
  }

  private drawAmbient(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const totalW = this.laneWidth * 4;
    const cx = this.laneStartX + totalW / 2;
    const hot = this.isStarPowerActive || this.combo >= 20;
    const inv = 1 - this.beatPulse;
    const flash = (hot ? 0.20 : 0.09) * inv * inv;

    ctx.save();

    // Destello al compás desde el centro de la pista
    const activeSponsor = BRANDING.getLogoConfig(this.activeStarPowerSponsorId || "feria");
    const burst = ctx.createRadialGradient(cx, h * 0.55, 20, cx, h * 0.55, Math.max(w, h) * 0.7);
    if (this.isStarPowerActive) {
      burst.addColorStop(0, `${activeSponsor.themeColor}55`);
      burst.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      burst.addColorStop(0, `rgba(255, 200, 90, ${flash + 0.04})`);
      burst.addColorStop(1, "rgba(0, 0, 0, 0)");
    }
    ctx.fillStyle = burst;
    ctx.fillRect(0, 0, w, h);

    // Haces de luz a los costados de la pista
    const beamAlpha = 0.07 + 0.10 * inv;
    for (const side of [-1, 1]) {
      const bx = side < 0 ? this.laneStartX : this.laneStartX + totalW;
      const beam = ctx.createLinearGradient(bx, 0, bx + side * Math.min(180, w * 0.14), 0);
      if (this.isStarPowerActive) {
        beam.addColorStop(0, `${activeSponsor.themeColor}44`);
        beam.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        beam.addColorStop(0, `rgba(255, 200, 90, ${beamAlpha})`);
        beam.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = beam;
      if (side < 0) {
        ctx.fillRect(Math.max(0, bx - Math.min(180, w * 0.14)), 0, Math.min(180, w * 0.14), h);
      } else {
        ctx.fillRect(bx, 0, Math.min(180, w * 0.14), h);
      }
    }

    // Ecualizador de luces que rebota con la música
    const barW = 9;
    const gap = 6;
    const maxBars = Math.min(8, Math.floor((this.laneStartX - 16) / (barW + gap)));
    const colors = ["#FF4D6D", "#FFD700", "#00E676", "#00E5FF"];
    for (let i = 0; i < maxBars; i++) {
      const energy = 0.35 + 0.65 * Math.abs(Math.sin(this.currentTime * (3.2 + i * 0.7) + i * 1.3));
      const bh = (24 + 120 * energy) * (0.55 + 0.45 * inv) * (hot ? 1.35 : 1);
      const c = colors[i % 4];
      const offset = 10 + i * (barW + gap);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect(this.laneStartX - offset - barW, h - bh, barW, bh, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(this.laneStartX + totalW + offset, h - bh, barW, bh, 4);
      ctx.fill();
    }

    // Brasas / luces de feria flotando
    for (const m of this.ambientMotes) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(m.phase));
      ctx.globalAlpha = 0.5 * tw;
      ctx.fillStyle = m.hue < 0.5 ? "#FFE082" : (m.hue < 0.8 ? "#FFFFFF" : "#FF8A80");
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(m.phase) * 8, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawHitRings(ctx: CanvasRenderingContext2D): void {
    const radius = Math.min(this.laneWidth * 0.38, 38);
    ctx.save();
    for (const r of this.hitRings) {
      const e = 1 - Math.pow(1 - r.t, 3);
      ctx.globalAlpha = (1 - r.t) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 6 * (1 - r.t) + 1;
      ctx.beginPath();
      ctx.arc(r.x, this.hitLineY, radius * (1 + e * 1.9), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawComboHUD(ctx: CanvasRenderingContext2D): void {
    if (this.combo < 3) return;
    const totalW = this.laneWidth * 4;
    const sideRoom = this.laneStartX >= 130;
    const cx = sideRoom ? this.laneStartX / 2 : this.laneStartX + totalW / 2;
    const cy = sideRoom ? this.height * 0.42 : this.height * 0.28;
    const mult = this.getMultiplier();
    const color = mult >= 4 ? "#FF4D6D" : mult === 3 ? "#FF9100" : mult === 2 ? "#FFD700" : "#FFFFFF";
    const pop = 1 + this.comboPop * 0.35;
    const baseAlpha = sideRoom ? 1 : 0.55;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = baseAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "800 14px 'Outfit', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("COMBO", 0, -42);

    ctx.save();
    ctx.scale(pop, pop);
    ctx.font = "900 58px 'Titan One', 'Outfit', sans-serif";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(String(this.combo), 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(String(this.combo), 0, 0);
    ctx.restore();

    ctx.font = "900 20px 'Titan One', 'Outfit', sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(`x${mult}`, 0, 44);
    ctx.fillStyle = color;
    ctx.fillText(`x${mult}`, 0, 44);

    ctx.restore();
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

          // Deducción de vida con protección contra dobles misses instantáneos (acordes de 2 notas o ráfagas)
          if (this.currentTime > 1.2 && (this.lastMissLifeLossTime < 0 || this.currentTime - this.lastMissLifeLossTime >= 0.28)) {
            this.lives = Math.max(0, this.lives - 1);
            this.lastMissLifeLossTime = this.currentTime;
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

    this.updateAmbient(dt);

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

    // Fin de canción (o tras completar la última nota + margen cuando el MP3 tiene cola de silencio)
    const lastChartNote = this.notes.length > 0 ? this.notes[this.notes.length - 1] : null;
    const lastNoteEndTime = lastChartNote ? lastChartNote.targetTime + (lastChartNote.duration || 0) : this.songDuration;
    const allNotesResolved =
      this.notes.length > 0 &&
      this.notes.every((n) => n.missed || (n.hit && (!n.isHolding || n.sustainCompleted || n.sustainFailed)));

    if (this.currentTime >= this.songDuration || (allNotesResolved && this.currentTime >= lastNoteEndTime + 2.0)) {
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

    this.drawAmbient(ctx);

    const trackH = this.height;
    const totalW = this.laneWidth * 4;

    ctx.save();
    ctx.fillStyle = "rgba(10, 25, 48, 0.78)";
    ctx.fillRect(this.laneStartX, 0, totalW, trackH);

    // Resplandor Star Power
    if (this.isStarPowerActive) {
      const activeSponsor = BRANDING.getLogoConfig(this.activeStarPowerSponsorId || "feria");
      const starGlow = ctx.createLinearGradient(this.laneStartX, 0, this.laneStartX + totalW, 0);
      starGlow.addColorStop(0, `${activeSponsor.themeColor}77`);
      starGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.40)");
      starGlow.addColorStop(1, `${activeSponsor.themeColor}77`);
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

      // Tinte de carril con el color de la nota, late con el ritmo
      ctx.save();
      const tint = ctx.createLinearGradient(0, this.hitLineY, 0, this.hitLineY - this.height * 0.55);
      tint.addColorStop(0, lane.glowColor);
      tint.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalAlpha = 0.16 + 0.14 * Math.pow(1 - this.beatPulse, 2);
      ctx.fillStyle = tint;
      ctx.fillRect(lx, 0, this.laneWidth, this.hitLineY);
      ctx.restore();

      if (this.lanePressed[i]) {
        const laneBeam = ctx.createLinearGradient(0, this.hitLineY, 0, 0);
        laneBeam.addColorStop(0, lane.glowColor);
        laneBeam.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = laneBeam;
        ctx.fillRect(lx, 0, this.laneWidth, this.hitLineY);
      }

      const activeSponsor = BRANDING.getLogoConfig(this.activeStarPowerSponsorId || "feria");
      ctx.strokeStyle = this.isStarPowerActive ? activeSponsor.themeColor : "rgba(255, 215, 0, 0.35)";
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
      if (note.missed || note.sustainCompleted || note.sustainFailed) continue;
      if (note.type === "normal" && note.hit) continue;
      if (note.type === "sustain" && note.hit && !note.isHolding) continue;

      const lane = this.lanes[note.lane];
      const noteX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
      const radius = Math.min(this.laneWidth * 0.36, 36);
      const isSustainNote = note.type === "sustain" && note.duration > 0;

      // Si es NOTA SOSTENIDA: Dibujar cuerpo y cola
      if (isSustainNote) {
        const timeHeadDiff = note.targetTime - this.currentTime;
        const timeTailDiff = (note.targetTime + note.duration) - this.currentTime;

        let yHead = this.hitLineY - timeHeadDiff * this.noteSpeed;
        const yTail = this.hitLineY - timeTailDiff * this.noteSpeed;

        // Si se está sosteniendo, la cabeza permanece anclada en la línea de impacto
        if (note.isHolding) {
          yHead = this.hitLineY;
        }

        if (yHead > -100 && yTail < this.height + 100 && yHead > yTail) {
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
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(noteX, this.hitLineY, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      // Dibujar Cabeza de la Nota (anclada en hitLineY mientras se sostiene un sustain)
      const timeDiff = note.targetTime - this.currentTime;
      const noteY = note.isHolding ? this.hitLineY : this.hitLineY - timeDiff * this.noteSpeed;

      if (noteY > -80 && noteY < this.height + 80) {
        ctx.save();
        ctx.translate(noteX, noteY);

        if (note.isStar) {
          const sponsorId = note.sponsorId || (note.logoType === 2 ? "campus" : "feria");
          const sponsor = BRANDING.getLogoConfig(sponsorId);
          const sponsorImg = this.getSponsorImage(sponsor.id) || (sponsor.id === "campus" ? this.imgLogoCampus : this.imgLogoFair);

          const starR = radius * 1.15;

          // Aura luminosa y estela corta (solo para notas que NO son sustain)
          if (!note.hit) {
            const aura = ctx.createRadialGradient(0, 0, starR * 0.2, 0, 0, starR * 1.6);
            aura.addColorStop(0, sponsor.themeColor);
            aura.addColorStop(0.8, "rgba(255, 255, 255, 0.3)");
            aura.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, 0, starR * 1.6, 0, Math.PI * 2);
            ctx.fill();

            if (!isSustainNote) {
              const tailLen = Math.min(44, this.height * 0.06);
              const tail = ctx.createLinearGradient(0, 0, 0, -tailLen);
              tail.addColorStop(0, sponsor.themeColor);
              tail.addColorStop(1, "rgba(0, 0, 0, 0)");
              ctx.fillStyle = tail;
              ctx.beginPath();
              ctx.moveTo(-radius * 0.55, 0);
              ctx.lineTo(radius * 0.55, 0);
              ctx.lineTo(radius * 0.12, -tailLen);
              ctx.lineTo(-radius * 0.12, -tailLen);
              ctx.closePath();
              ctx.fill();
            }
          }

          // Medallón base perla para máxima legibilidad de cualquier logo
          ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
          ctx.beginPath();
          ctx.arc(0, 0, starR, 0, Math.PI * 2);
          ctx.fill();

          // Aro exterior en color de marca
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = sponsor.themeColor;
          ctx.stroke();

          // Anillo interior sutil dorado
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(0, 0, starR - 3.5, 0, Math.PI * 2);
          ctx.stroke();

          // Renderizar logo contenido proporcionalmente sin deformar
          if (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0) {
            const nw = sponsorImg.naturalWidth;
            const nh = sponsorImg.naturalHeight;
            const aspect = nw / nh;
            const maxW = starR * 1.55;
            const maxH = starR * 1.35;
            let dw = maxW;
            let dh = maxW / aspect;
            if (dh > maxH) {
              dh = maxH;
              dw = maxH * aspect;
            }
            ctx.drawImage(sponsorImg, -dw / 2, -dh / 2, dw, dh);
          } else {
            ctx.font = "900 24px 'Cinzel Decorative', 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = sponsor.themeColor;
            ctx.fillText("⭐", 0, 0);
          }
        } else {
          let sprite: HTMLImageElement | null = null;
          if (note.lane === 0) sprite = this.imgArrowLeft;
          else if (note.lane === 1) sprite = this.imgArrowDown;
          else if (note.lane === 2) sprite = this.imgArrowUp;
          else if (note.lane === 3) sprite = this.imgArrowRight;

          const drawSize = radius * 2.35;

          // Estela de cometa compacta + aura luminosa detrás de la nota
          if (!note.hit) {
            const auraColor = lane.glowColor;
            const aura = ctx.createRadialGradient(0, 0, drawSize * 0.1, 0, 0, drawSize * 0.95);
            aura.addColorStop(0, auraColor);
            aura.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize * 0.95, 0, Math.PI * 2);
            ctx.fill();

            if (!isSustainNote) {
              const tailLen = Math.min(44, this.height * 0.06);
              const tail = ctx.createLinearGradient(0, 0, 0, -tailLen);
              tail.addColorStop(0, lane.glowColor);
              tail.addColorStop(1, "rgba(0, 0, 0, 0)");
              ctx.fillStyle = tail;
              ctx.beginPath();
              ctx.moveTo(-radius * 0.55, 0);
              ctx.lineTo(radius * 0.55, 0);
              ctx.lineTo(radius * 0.12, -tailLen);
              ctx.lineTo(-radius * 0.12, -tailLen);
              ctx.closePath();
              ctx.fill();
            }
          }

          if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          } else {
            ctx.font = "900 28px 'Cinzel Decorative', 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = lane.color;
            ctx.fillText(lane.arrow, 0, 0);
          }
        }

        ctx.restore();
      }
    }

    // Anillos de impacto y contador de combo
    this.drawHitRings(ctx);
    this.drawComboHUD(ctx);

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

      // Subtítulo, BPM y Récord de esta canción en esta dificultad
      const subKey = `${song.id}_${this.selectedDifficulty}`;
      const songRecord = StorageManager.getHighScore(this.id, subKey);
      const songRank = StorageManager.getBestRank(this.id, subKey);

      const subFont = Math.max(8, Math.min(10.5, cardH * 0.22));
      ctx.font = `600 ${subFont}px 'Outfit', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      const recordText = songRecord > 0 ? ` • 🏆 ${songRecord.toLocaleString()} pts` : "";
      ctx.fillText(`${song.subtitle} • ${song.bpm} BPM${recordText}`, cardX + iconSize * 2 + 12, cy + cardH * 0.72);

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

      // Badge de Rango obtenido (si existe para esta dificultad)
      if (songRank) {
        const rankW = Math.max(26, Math.min(34, cardW * 0.08));
        const rankX = badgeX - rankW - 6;
        const rankColor = songRank === "S+" || songRank === "S" ? "#FFD700" : songRank === "A" ? "#00E5FF" : songRank === "B" ? "#00E676" : songRank === "C" ? "#FF9100" : "#FF5252";

        ctx.save();
        ctx.fillStyle = "rgba(3, 21, 36, 0.95)";
        ctx.strokeStyle = rankColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(rankX, badgeY, rankW, badgeH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = `900 ${Math.max(8.5, Math.min(11, badgeH * 0.58))}px 'Outfit', sans-serif`;
        ctx.fillStyle = rankColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(songRank, rankX + rankW / 2, badgeY + badgeH / 2);
        ctx.restore();
      }
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
   * Calcula el rango (S+, S, A, B, C, D) basado en precisión, fallos y puntuación teórica de la canción
   */
  public calculateRank(isFinal: boolean = false): {
    rank: "S+" | "S" | "A" | "B" | "C" | "D";
    accuracy: number;
    label: string;
    color: string;
    scorePercent: number;
  } {
    // Si el jugador perdió todas las vidas (campanas) durante la partida
    if (this.lives <= 0) {
      const passedSoFar = this.perfectCount + this.greatCount + this.goodCount + this.missCount;
      const acc = passedSoFar > 0 ? Math.round(((this.perfectCount * 1.0 + this.greatCount * 0.85 + this.goodCount * 0.60) / passedSoFar) * 100) : 0;
      return { rank: "D", accuracy: acc, label: "RANGO ASPIRANTE (SIN CAMPANAS)", color: "#FF5252", scorePercent: 0 };
    }

    // Para el cálculo final al completar la canción
    if (isFinal) {
      const totalChartNotes = this.notes.length > 0 ? this.notes.length : (this.perfectCount + this.greatCount + this.goodCount + this.missCount);
      if (totalChartNotes === 0) return { rank: "S", accuracy: 100, label: "¡PERFECTO!", color: "#FFD700", scorePercent: 100 };

      // Notas tocadas y fallos totales (incluyendo notas no alcanzadas si terminó prematuramente)
      const totalHit = this.perfectCount + this.greatCount + this.goodCount;
      const totalMisses = Math.max(this.missCount, totalChartNotes - totalHit);

      // Ponderación de precisión amigable para ritmos táctiles arcade:
      // Perfect: 100%, Great: 85%, Good: 60%, Miss: 0%
      const weightedScore = (this.perfectCount * 1.0 + this.greatCount * 0.85 + this.goodCount * 0.60);
      const accuracy = Math.min(100, Math.round((weightedScore / totalChartNotes) * 100));

      // Porcentaje de la puntuación máxima teórica
      const targetMax = Math.max(1000, this.currentTargetMaxScore);
      const scorePercent = Math.min(100, Math.round((this.score / targetMax) * 100));

      // Margen de fallos permitido para S+ (Full Combo o hasta 1.5% de notas en canciones largas)
      const allowedMissesForSPlus = Math.max(1, Math.floor(totalChartNotes * 0.015));
      const isFullCombo = totalMisses === 0;

      // Rango S+ (Legendario):
      // - Full Combo con precisión >= 90%
      // - O Precisión >= 94% con fallos mínimos
      // - O Efectividad de puntuación >= 88%
      if ((isFullCombo && accuracy >= 90) || (accuracy >= 94 && totalMisses <= allowedMissesForSPlus) || scorePercent >= 88) {
        return { rank: "S+", accuracy, label: "RANGO LEGENDARIO", color: "#FFD700", scorePercent };
      }
      // Rango S (Excelente):
      // - Precisión >= 86% o Puntuación >= 74%
      else if (accuracy >= 86 || scorePercent >= 74) {
        return { rank: "S", accuracy, label: "RANGO EXCELENTE", color: "#FFD700", scorePercent };
      }
      // Rango A (Genial):
      else if (accuracy >= 74 || scorePercent >= 58) {
        return { rank: "A", accuracy, label: "RANGO GENIAL", color: "#00E5FF", scorePercent };
      }
      // Rango B (Bueno):
      else if (accuracy >= 60 || scorePercent >= 42) {
        return { rank: "B", accuracy, label: "RANGO BUENO", color: "#00E676", scorePercent };
      }
      // Rango C (Regular):
      else if (accuracy >= 45 || scorePercent >= 28) {
        return { rank: "C", accuracy, label: "RANGO REGULAR", color: "#FF9100", scorePercent };
      }
      // Rango D (Aspirante):
      else {
        return { rank: "D", accuracy, label: "RANGO ASPIRANTE", color: "#FF5252", scorePercent };
      }
    }

    // Cálculo en vivo durante el juego (Live HUD badge)
    const passedNotes = this.perfectCount + this.greatCount + this.goodCount + this.missCount;
    if (passedNotes === 0) return { rank: "S+", accuracy: 100, label: "¡PERFECTO!", color: "#FFD700", scorePercent: 100 };

    const scoreWeighted = (this.perfectCount * 1.0 + this.greatCount * 0.85 + this.goodCount * 0.60);
    const liveAccuracy = Math.min(100, Math.round((scoreWeighted / passedNotes) * 100));
    const liveTargetMax = Math.max(1000, this.currentTargetMaxScore);
    const liveScorePercent = Math.min(100, Math.round((this.score / liveTargetMax) * 100));

    if (liveAccuracy >= 94 && this.missCount <= Math.max(1, Math.floor(passedNotes * 0.015))) {
      return { rank: "S+", accuracy: liveAccuracy, label: "RANGO LEGENDARIO", color: "#FFD700", scorePercent: liveScorePercent };
    } else if (liveAccuracy >= 86) {
      return { rank: "S", accuracy: liveAccuracy, label: "RANGO EXCELENTE", color: "#FFD700", scorePercent: liveScorePercent };
    } else if (liveAccuracy >= 74) {
      return { rank: "A", accuracy: liveAccuracy, label: "RANGO GENIAL", color: "#00E5FF", scorePercent: liveScorePercent };
    } else if (liveAccuracy >= 60) {
      return { rank: "B", accuracy: liveAccuracy, label: "RANGO BUENO", color: "#00E676", scorePercent: liveScorePercent };
    } else if (liveAccuracy >= 45) {
      return { rank: "C", accuracy: liveAccuracy, label: "RANGO REGULAR", color: "#FF9100", scorePercent: liveScorePercent };
    } else {
      return { rank: "D", accuracy: liveAccuracy, label: "RANGO ASPIRANTE", color: "#FF5252", scorePercent: liveScorePercent };
    }
  }

  public override endGame(): void {
    this.stopSongAudio();
    const rankInfo = this.calculateRank(true);
    const song = this.songList[this.selectedSongIndex];
    const diffCfg = DIFFICULTY_CONFIGS[this.selectedDifficulty] || DIFFICULTY_CONFIGS.normal;
    const subKey = this.isCustomChartPlaying ? "custom" : `${song?.id || "default"}_${this.selectedDifficulty}`;

    // Guardar el mejor rango obtenido para esta canción y dificultad
    StorageManager.saveBestRank(this.id, subKey, rankInfo.rank);

    const totalNotesCount = this.notes.length > 0 ? this.notes.length : (this.perfectCount + this.greatCount + this.goodCount + this.missCount);
    const totalHit = this.perfectCount + this.greatCount + this.goodCount;
    const finalMissCount = this.notes.length > 0 ? Math.max(this.missCount, totalNotesCount - totalHit) : this.missCount;

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
      scorePercent: rankInfo.scorePercent,
      targetMaxScore: this.currentTargetMaxScore,
      maxCombo: this.maxCombo,
      perfectCount: this.perfectCount,
      greatCount: this.greatCount,
      goodCount: this.goodCount,
      missCount: finalMissCount,
      totalNotes: totalNotesCount
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
