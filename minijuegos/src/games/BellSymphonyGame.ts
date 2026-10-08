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
  JINGLE_BELLS_ROCK_CHART,
  TWELVE_DAYS_CHART,
  JOY_TO_WORLD_POWER_CHART,
  DECK_THE_HALLS_CHART,
  WE_WISH_YOU_CHART,
  type SongDef
} from "../data/songs";

export { type SongDef };

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
      "🔔 Sinfonía de Campanas",
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
    // Línea de impacto al 80% de la pantalla
    this.hitLineY = this.height * 0.80;
  }

  public override start(_durationSeconds: number = 129): void {
    super.start(this.songDuration);
    this.timeRemaining = this.songDuration;
  }

  public override update(dt: number): void {
    if (!this.isRunning || this.isGameOver) return;

    if (this.gameState === "song-select") {
      this.timeRemaining = this.songDuration;
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
      } else {
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
   * Inicia la canción elegida y activa el intro Guitar Hero
   */
  public startSong(index: number): void {
    this.selectedSongIndex = Math.max(0, Math.min(this.songList.length - 1, index));
    const song = this.songList[this.selectedSongIndex];

    this.isCustomChartPlaying = false;
    this.bpm = song.bpm;
    this.noteSpeed = song.speed;
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
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

    this.bpm = bpm;
    this.noteSpeed = 520;
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
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
      // Audio precargado
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

  private handleSongSelectTouch(x: number, y: number): void {
    const count = this.songList.length;
    const cardW = Math.min(this.width * 0.92, 520);
    const titleY = Math.max(46, this.height * 0.07);
    const startY = titleY + 46;
    const gap = Math.max(5, Math.min(8, this.height * 0.010));
    const cardH = Math.min(58, Math.max(44, (this.height * 0.60) / count));
    const cardX = (this.width - cardW) / 2;

    for (let i = 0; i < count; i++) {
      const cy = startY + i * (cardH + gap);

      if (x >= cardX && x <= cardX + cardW && y >= cy && y <= cy + cardH) {
        this.selectedSongIndex = i;
        this.audio.playTap();
        this.startSong(i);
        return;
      }
    }

    // Botón de Modo Grabador / Editor de Canción
    const editorBtnY = startY + count * (cardH + gap) + 6;
    const editorBtnH = Math.min(46, Math.max(38, cardH * 0.85));
    if (x >= cardX && x <= cardX + cardW && y >= editorBtnY && y <= editorBtnY + editorBtnH) {
      this.audio.playTap();
      this.openChartEditor();
    }
  }

  private setupKeyboard(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isGameOver) return;

      if (this.gameState === "song-select") {
        if (e.key === "1") this.startSong(0);
        else if (e.key === "2") this.startSong(1);
        else if (e.key === "3") this.startSong(2);
        else if (e.key === "4") this.startSong(3);
        else if (e.key === "5") this.startSong(4);
        else if (e.key === "6") this.startSong(5);
        else if (e.key === "e" || e.key === "E") this.openChartEditor();
        else if (e.key === "Enter" || e.key === " ") this.startSong(this.selectedSongIndex);
        return;
      }

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
   * Genera la partitura de notas para la canción
   */
  private generateSongChart(song: SongDef): void {
    let sourceChart: ChartNoteRecord[] = [];

    switch (song.id) {
      case "god-rest-metal":
        sourceChart = GOD_REST_METAL_CHART;
        break;
      case "jingle-bells-rock":
        sourceChart = JINGLE_BELLS_ROCK_CHART;
        break;
      case "twelve-days":
        sourceChart = TWELVE_DAYS_CHART;
        break;
      case "joy-to-world":
        sourceChart = JOY_TO_WORLD_POWER_CHART;
        break;
      case "deck-the-halls":
        sourceChart = DECK_THE_HALLS_CHART;
        break;
      case "we-wish-you":
        sourceChart = WE_WISH_YOU_CHART;
        break;
      default:
        sourceChart = GOD_REST_METAL_CHART;
        break;
    }

    this.notes = [];
    let noteId = 0;
    let starCount = 0;

    for (const item of sourceChart) {
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

    const lastItem = sourceChart[sourceChart.length - 1];
    if (lastItem) {
      const calculatedEnd = lastItem.time + (lastItem.duration || 0) + 3.0;
      this.songDuration = Math.max(song.durationSeconds || 120, calculatedEnd);
    }
  }

  /**
   * Presión de un carril: verifica timing de notas normales o inicio de sustain
   */
  private handleLanePress(lane: number): void {
    this.lanePressed[lane] = true;
    this.playHitsound(lane);

    let closestNote: FallingNote | null = null;
    let minDiff = 999;

    for (const note of this.notes) {
      // Regla estricta: Una nota ya tocada (!note.hit) o fallada (!note.missed) nunca se puede volver a tomar
      if (note.lane === lane && !note.hit && !note.missed) {
        const diff = Math.abs(note.targetTime - this.currentTime);
        // Ventana estricta al inicio de la nota (solo inicio/cabeza)
        if (diff < minDiff && diff < 0.24) {
          minDiff = diff;
          closestNote = note;
        }
      }
    }

    const laneCenterX = this.laneStartX + lane * this.laneWidth + this.laneWidth / 2;

    if (closestNote) {
      // Marcar inmediatamente como tocada para que no se pueda volver a tomar jamás
      closestNote.hit = true;

      // Juicio según precisión temporal
      if (minDiff <= 0.06) {
        const pts = 300 * this.getMultiplier();
        this.addScore(pts);
        this.combo++;
        this.perfectCount++;
        this.spawnJudgement("¡PERFECTO!", "#FFD700", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#FFD700", 1.3);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#FFD700", 16);
      } else if (minDiff <= 0.12) {
        const pts = 180 * this.getMultiplier();
        this.addScore(pts);
        this.combo++;
        this.greatCount++;
        this.spawnJudgement("¡GENIAL!", "#00E5FF", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#00E5FF", 1.15);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#00E5FF", 10);
      } else {
        const pts = 80 * this.getMultiplier();
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
          this.addFloatingText("+1 🔔", this.width / 2, this.hitLineY - 95, "#00E676", 1.25);
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
    const starText = isCampus ? "⚡ ¡STAR POWER CAMPUS x4! ⚡" : "⚡ ¡STAR POWER FERIA x4! ⚡";

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
    if (this.gameState === "song-select") {
      this.beatPulse = (Date.now() / 1000 * 2) % 1.0;
      return;
    }

    if (this.bgAudioElement && !this.bgAudioElement.paused && this.bgAudioElement.currentTime > 0) {
      this.currentTime = this.bgAudioElement.currentTime;
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
        if (this.currentTime - note.targetTime > 0.28) {
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
   * Rótulo cinemático de inicio estilo Guitar Hero (Título, Autor y Créditos de Licencia)
   */
  private drawGuitarHeroSongCredits(ctx: CanvasRenderingContext2D): void {
    if (this.songIntroTimer <= 0) return;

    const song = this.songList[this.selectedSongIndex];
    if (!song) return;

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

    // 2. BY [ARTISTA]
    const authorY = cardY + titleFont + 6;
    ctx.font = `800 ${authorFont}px 'Outfit', sans-serif`;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
    ctx.lineWidth = 4;
    ctx.strokeText(`BY ${song.artist.toUpperCase()}`, cardX, authorY);
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(`BY ${song.artist.toUpperCase()}`, cardX, authorY);

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
   * Pantalla de Selección de Canción interactiva con las 6 canciones
   */
  private drawSongSelector(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;

    ctx.save();

    const titleY = Math.max(46, this.height * 0.07);
    const subY = titleY + 24;

    ctx.font = `900 clamp(1.15rem, 3.6vw, 1.65rem) 'Cinzel Decorative', 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("SELECCIONA TU CANCIÓN", cx, titleY);

    ctx.font = `700 clamp(0.70rem, 2.0vw, 0.85rem) 'Outfit', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("Concierto Navideño • Alexander Nakarada", cx, subY);

    const count = this.songList.length;
    const cardW = Math.min(this.width * 0.92, 520);
    const startY = titleY + 44;
    const gap = Math.max(5, Math.min(8, this.height * 0.010));
    const cardH = Math.min(58, Math.max(44, (this.height * 0.60) / count));
    const cardX = (this.width - cardW) / 2;

    for (let i = 0; i < count; i++) {
      const song = this.songList[i];
      const cy = startY + i * (cardH + gap);
      const isSelected = i === this.selectedSongIndex;

      // Fondo
      ctx.fillStyle = isSelected ? "rgba(14, 40, 78, 0.95)" : "rgba(8, 20, 40, 0.90)";
      ctx.beginPath();
      ctx.roundRect(cardX, cy, cardW, cardH, 12);
      ctx.fill();

      // Borde brillante
      ctx.lineWidth = isSelected ? 2.8 : 1.5;
      ctx.strokeStyle = isSelected ? song.tagColor : "rgba(255, 215, 0, 0.35)";
      ctx.stroke();

      // Icono
      const iconSize = Math.max(17, Math.min(23, cardH * 0.40));
      ctx.font = `${iconSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(song.icon, cardX + iconSize + 10, cy + cardH / 2);

      // Título
      const titleFont = Math.max(12, Math.min(15, cardH * 0.30));
      ctx.font = `900 ${titleFont}px 'Outfit', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
      ctx.fillText(song.title, cardX + iconSize * 2 + 14, cy + cardH * 0.38);

      // Subtítulo y BPM
      const subFont = Math.max(9, Math.min(11.5, cardH * 0.22));
      ctx.font = `600 ${subFont}px 'Outfit', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText(`${song.subtitle} • ${song.bpm} BPM`, cardX + iconSize * 2 + 14, cy + cardH * 0.72);

      // Badge de Dificultad
      const badgeW = Math.max(54, Math.min(70, cardW * 0.16));
      const badgeH = Math.max(18, Math.min(22, cardH * 0.38));
      const badgeX = cardX + cardW - badgeW - 10;
      const badgeY = cy + (cardH - badgeH) / 2;

      ctx.fillStyle = song.tagColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
      ctx.fill();

      ctx.font = `900 ${Math.max(8.5, Math.min(10.5, badgeH * 0.54))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#031524";
      ctx.fillText(song.difficultyLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    }

    // Botón Modo Grabador / Editor
    const editorBtnY = startY + count * (cardH + gap) + 6;
    const editorBtnH = Math.min(46, Math.max(38, cardH * 0.85));

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

    ctx.font = `900 ${Math.max(11, Math.min(14, editorBtnH * 0.34))}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#041424";
    ctx.fillText("🛠️ MODO GRABADOR / EDITOR DE RITMO", cx, editorBtnY + editorBtnH * 0.38);

    ctx.font = `700 ${Math.max(9, Math.min(11, editorBtnH * 0.26))}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#041424";
    ctx.fillText("Graba notas normales y sostenidas • Pulsa [ E ]", cx, editorBtnY + editorBtnH * 0.74);

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
      return { rank: "S+", accuracy, label: "🌟 RANGO LEGENDARIO", color: "#FFD700" };
    } else if (accuracy >= 90) {
      return { rank: "S", accuracy, label: "✨ RANGO EXCELENTE", color: "#FFD700" };
    } else if (accuracy >= 78) {
      return { rank: "A", accuracy, label: "⭐ RANGO GENIAL", color: "#00E5FF" };
    } else if (accuracy >= 65) {
      return { rank: "B", accuracy, label: "👍 RANGO BUENO", color: "#00E676" };
    } else if (accuracy >= 50) {
      return { rank: "C", accuracy, label: "🔔 RANGO REGULAR", color: "#FF9100" };
    } else {
      return { rank: "D", accuracy, label: "💫 RANGO ASPIRANTE", color: "#FF5252" };
    }
  }

  public override endGame(): void {
    this.stopSongAudio();
    const rankInfo = this.calculateRank();
    const song = this.songList[this.selectedSongIndex];
    super.endGame({
      isCustomChart: this.isCustomChartPlaying,
      customNotes: this.lastCustomNotes.length > 0 ? this.lastCustomNotes : undefined,
      songFile: this.isCustomChartPlaying ? this.lastCustomSongFile : (song?.audioFile || "juego campanas/God Rest Ye Merry Metalmen.mp3"),
      songTitle: this.isCustomChartPlaying ? "Partitura Personalizada" : (song?.title || "Sinfonía de Campanas"),
      songArtist: this.isCustomChartPlaying ? "Creador de Ritmo" : (song?.artist || "Alexander Nakarada"),
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
