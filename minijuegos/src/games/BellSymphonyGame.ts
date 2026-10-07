/**
 * ==============================================================================
 * JUEGO: SINFONÍA DE CAMPANAS NAVIDEÑAS (Bell Symphony Rhythm Rush)
 * ==============================================================================
 * 
 * Minijuego musical estilo Friday Night Funkin' (FNF) / Guitar Hero con estética
 * Stylized 2D Fantasy Game Art:
 * - Selector interactivo de canciones navideñas antes de jugar (Jingle Bells, Deck The Halls, Carol of the Bells).
 * - Notas rítmicas con Flechas de Bastón de Caramelo (Candy Cane Arrows) estilizadas con ribetes de oro.
 * - Star Notes con Logos Oficiales de la Feria Mágica del Juguete y Campuslands que activan el "MODO ESTRELLA x4" (Guitar Hero Style).
 * - Acompañamiento musical festivo sintetizado en tiempo real + soporte para MP3 personalizados.
 * - Sistema de juicio arcade: ¡PERFECTO!, ¡GENIAL!, ¡BIEN! y MISS.
 * - Control multitáctil en pads inferiores y teclado (D, F, J, K o flechas).
 */

import { BaseGame } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { InputManager } from "../core/InputManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { ChartEditorModal, type ChartNoteRecord } from "../components/ChartEditorModal";
import {
  RHYTHM_SONG_LIST,
  JINGLE_BELLS_CHART,
  ROCKIN_AROUND_CHART,
  DANIELA_CHART,
  BURRITO_METAL_CHART,
  JOY_TO_THE_WORLD_CHART,
  type SongDef
} from "../data/songs";

export { type SongDef };

interface FallingNote {
  id: number;
  lane: number; // 0: Rojo (← / D), 1: Dorado (↓ / F), 2: Verde (↑ / J), 3: Azul (→ / K)
  targetTime: number; // Segundo exacto en que la nota debe impactar la línea de objetivo
  hit: boolean;
  missed: boolean;
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
  private gameState: "song-select" | "playing" = "song-select";

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

  // Notas activas
  private notes: FallingNote[] = [];
  private lanePressed: boolean[] = [false, false, false, false];
  private lanePressTimers: number[] = [0, 0, 0, 0];

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

  // Sistema de Música de Fondo (Sintetizador + MP3 opcional)
  private bgAudioElement: HTMLAudioElement | null = null;
  private lastAccompanimentBeat: number = -1;

  // Editor y Grabador de notas en tiempo real
  private chartEditor: ChartEditorModal;
  private isCustomChartPlaying: boolean = false;
  private lastCustomNotes: ChartNoteRecord[] = [];
  private lastCustomSongFile: string = "jingle-bells.mp3";

  // Listener de teclado desacoplable
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
      "¡Elige tu canción navideña y toca las flechas de bastón de caramelo al ritmo de la música!",
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

    // Logos oficiales transparentes
    this.imgLogoFair = new Image();
    this.imgLogoFair.src = "./assets/logos/Feria-magica-del-jugete-sin-fondo.png";

    this.imgLogoCampus = new Image();
    this.imgLogoCampus.src = "./assets/logos/logo-campus-sin-fondo.png";

    this.imgStarWithLogo = new Image();
    this.imgStarWithLogo.src = "./assets/images/estrella con logo.png";

    // Editor de ritmos
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
    // Línea de impacto ubicada al 80% de la altura de la pantalla
    this.hitLineY = this.height * 0.80;
  }

  public override start(_durationSeconds: number = 129): void {
    super.start(this.songDuration);
    this.timeRemaining = this.songDuration;
  }

  public override update(dt: number): void {
    if (!this.isRunning || this.isGameOver) return;

    // Calcular el tiempo restante real de la canción para el HUD
    if (this.gameState === "song-select") {
      this.timeRemaining = this.songDuration;
    } else {
      this.timeRemaining = Math.max(0, this.songDuration - this.currentTime);
    }

    // Feedback visual y de partículas
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
      }
    }

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
    this.lanePressTimers = [0, 0, 0, 0];
    this.lastAccompanimentBeat = -1;
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;

    this.recalculateLayout();

    // Manejador táctil para selección de canciones y juego
    this.input.onTap = (x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;

      if (this.gameState === "song-select") {
        this.handleSongSelectTouch(x, y);
      } else {
        const lane = Math.floor((x - this.laneStartX) / this.laneWidth);
        if (lane >= 0 && lane < 4) {
          this.handleLanePress(lane);
        }
      }
    };
  }

  /**
   * Inicia la canción elegida y genera su partitura rítmica
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
    this.songDuration = song.durationSeconds || 129;

    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
      this.bgAudioElement = null;
    }

    try {
      this.bgAudioElement = new Audio(`./assets/audio/${encodeURIComponent(song.audioFile)}`);
      this.bgAudioElement.volume = 0.75;
      this.bgAudioElement.addEventListener("loadedmetadata", () => {
        if (this.bgAudioElement && !isNaN(this.bgAudioElement.duration) && this.bgAudioElement.duration > 5) {
          this.songDuration = this.bgAudioElement.duration;
        }
      });
      if (!this.audio.getIsMuted()) {
        this.bgAudioElement.play().catch(() => {
          // Fallback a Web Audio
        });
      }
    } catch {
      this.bgAudioElement = null;
    }

    this.generateSongChart(song);
    this.gameState = "playing";
    this.audio.playGameStart();
    this.particles.emitConfetti(this.width, 30);
  }

  /**
   * Reinicia la última canción o partitura jugada inmediatamente
   */
  public replayLastSong(): void {
    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
      this.bgAudioElement = null;
    }
    this.score = 0;
    this.isRunning = true;
    this.isGameOver = false;
    this.highScore = this.highScore;
    this.particles.clear();
    this.recalculateLayout();

    if (this.isCustomChartPlaying && this.lastCustomNotes.length > 0) {
      this.startCustomChart(this.lastCustomNotes, this.lastCustomSongFile, this.bpm);
    } else {
      this.startSong(this.selectedSongIndex);
    }
  }

  /**
   * Regresa al selector interno de canciones de Sinfonía de Campanas
   */
  public goToSongSelect(): void {
    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
      this.bgAudioElement = null;
    }
    this.start();
  }

  public openChartEditor(defaultSongFile?: string, initialNotes?: ChartNoteRecord[]): void {
    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
    }
    const song = this.songList[this.selectedSongIndex];
    const file = defaultSongFile || (this.isCustomChartPlaying ? this.lastCustomSongFile : (song ? song.audioFile : "Rockin' Around The Christmas Tree.mp3"));
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

    const lastNoteTime = customNotes.length > 0 ? customNotes[customNotes.length - 1].time + 2.5 : 129;
    this.songDuration = Math.max(129, lastNoteTime);

    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
      this.bgAudioElement = null;
    }

    try {
      this.bgAudioElement = new Audio(`./assets/audio/${encodeURIComponent(songFile)}`);
      this.bgAudioElement.volume = 0.75;
      this.bgAudioElement.addEventListener("loadedmetadata", () => {
        if (this.bgAudioElement && !isNaN(this.bgAudioElement.duration) && this.bgAudioElement.duration > 5) {
          this.songDuration = Math.max(this.bgAudioElement.duration, lastNoteTime);
        }
      });
      if (!this.audio.getIsMuted()) {
        this.bgAudioElement.play().catch(() => {});
      }
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
      this.notes.push({
        id: noteId++,
        lane: item.lane,
        targetTime: item.time,
        hit: false,
        missed: false,
        isStar: item.isStar || false,
        logoType: item.isStar ? logoType : undefined
      });
    }

    this.gameState = "playing";
    this.audio.playGameStart();
    this.particles.emitConfetti(this.width, 30);
  }

  private handleSongSelectTouch(x: number, y: number): void {
    const count = this.songList.length;
    const cardW = Math.min(this.width * 0.90, 500);
    const titleY = Math.max(46, this.height * 0.07);
    const startY = titleY + 46;
    const gap = Math.max(6, Math.min(9, this.height * 0.011));
    const cardH = Math.min(62, Math.max(46, (this.height * 0.60) / count));
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
        this.lanePressed[lane] = false;
      }
    };

    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
  }

  /**
   * Genera la partitura musical adaptada a la canción seleccionada con alternancia de logos
   */
  private generateSongChart(song: SongDef): void {
    this.notes = [];
    let noteId = 0;
    let starCount = 0;

    // 1. Partitura directa por segundos exactos (Jingle Bells, Daniela, Rockin')
    if (song.id === "daniela") {
      for (const item of DANIELA_CHART) {
        let logoType: 1 | 2 = 1;
        if (item.isStar) {
          starCount++;
          logoType = starCount % 2 === 0 ? 2 : 1;
        }
        this.notes.push({
          id: noteId++,
          lane: item.lane,
          targetTime: item.time,
          hit: false,
          missed: false,
          isStar: item.isStar || false,
          logoType: item.isStar ? logoType : undefined
        });
      }
      return;
    }

    if (song.id === "jingle-bells") {
      for (const item of JINGLE_BELLS_CHART) {
        let logoType: 1 | 2 = 1;
        if (item.isStar) {
          starCount++;
          logoType = starCount % 2 === 0 ? 2 : 1;
        }
        this.notes.push({
          id: noteId++,
          lane: item.lane,
          targetTime: item.time,
          hit: false,
          missed: false,
          isStar: item.isStar || false,
          logoType: item.isStar ? logoType : undefined
        });
      }
      return;
    }

    if (song.id === "rockin-around" && ROCKIN_AROUND_CHART.length > 0) {
      for (const item of ROCKIN_AROUND_CHART) {
        let logoType: 1 | 2 = 1;
        if (item.isStar) {
          starCount++;
          logoType = starCount % 2 === 0 ? 2 : 1;
        }
        this.notes.push({
          id: noteId++,
          lane: item.lane,
          targetTime: item.time,
          hit: false,
          missed: false,
          isStar: item.isStar || false,
          logoType: item.isStar ? logoType : undefined
        });
      }
      return;
    }

    if (song.id === "burrito-metal") {
      for (const item of BURRITO_METAL_CHART) {
        let logoType: 1 | 2 = 1;
        if (item.isStar) {
          starCount++;
          logoType = starCount % 2 === 0 ? 2 : 1;
        }
        this.notes.push({
          id: noteId++,
          lane: item.lane,
          targetTime: item.time,
          hit: false,
          missed: false,
          isStar: item.isStar || false,
          logoType: item.isStar ? logoType : undefined
        });
      }
      return;
    }

    if (song.id === "joy-to-world") {
      for (const item of JOY_TO_THE_WORLD_CHART) {
        let logoType: 1 | 2 = 1;
        if (item.isStar) {
          starCount++;
          logoType = starCount % 2 === 0 ? 2 : 1;
        }
        this.notes.push({
          id: noteId++,
          lane: item.lane,
          targetTime: item.time,
          hit: false,
          missed: false,
          isStar: item.isStar || false,
          logoType: item.isStar ? logoType : undefined
        });
      }
      return;
    }
  }

  /**
   * Al presionar un carril: verifica timing de notas y emite hitsound cálido y agradable
   */
  private handleLanePress(lane: number): void {
    this.lanePressed[lane] = true;
    this.lanePressTimers[lane] = 0.16;

    this.playHitsound(lane);

    let closestNote: FallingNote | null = null;
    let minDiff = 999;

    for (const note of this.notes) {
      if (note.lane === lane && !note.hit && !note.missed) {
        const diff = Math.abs(note.targetTime - this.currentTime);
        if (diff < minDiff && diff < 0.24) {
          minDiff = diff;
          closestNote = note;
        }
      }
    }

    const laneCenterX = this.laneStartX + lane * this.laneWidth + this.laneWidth / 2;

    if (closestNote) {
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

      // Si es Nota Especial con Logo: ACTIVA MODO ESTRELLA GUITAR HERO (x4 por 7 segundos)
      if (closestNote.isStar) {
        this.activateStarPower(7.0, laneCenterX, closestNote.logoType || 1);
      }

      // Recuperar 1 vida (Campana 🔔) con Star Notes o cada 15 de combo
      if (closestNote.isStar || (this.combo > 0 && this.combo % 15 === 0)) {
        if (this.lives < this.maxLives) {
          this.lives = Math.min(this.maxLives, this.lives + 1);
          this.addFloatingText("+1 🔔", this.width / 2, this.hitLineY - 95, "#00E676", 1.25);
        }
      }

      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
    }
  }

  /**
   * Activa el Modo Estrella estilo Guitar Hero (Multiplicador x4 durante 7s) con el logo capturado
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
    if (this.isStarPowerActive) {
      return 4;
    }
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
      y: this.hitLineY - 65,
      time: 0.65
    });
    if (this.activeJudgements.length > 8) {
      this.activeJudgements.shift();
    }
  }

  /**
   * Hitsound cálido, rítmico y armónico (Sin tonos agudos chillones, perfectamente mezclado con la música)
   */
  private playHitsound(lane: number): void {
    if (this.audio.getIsMuted()) return;
    this.audio.unlockAudio();

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      // Frecuencias medias cálidas (La3, Do4, Re4, Mi4) entre 220Hz y 330Hz
      const notes = [220.00, 261.63, 293.66, 329.63];
      const freq = notes[lane % 4];

      // 1. Golpe percusivo suave (Tap de percusión de madera)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // 2. Chime armónico sutil no invasivo
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();

      chime.type = "triangle";
      chime.frequency.setValueAtTime(freq * 1.5, now);
      chimeGain.gain.setValueAtTime(0.04, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chime.start(now);
      chime.stop(now + 0.12);
    } catch {
      // Fallback
    }
  }

  /**
   * Acompañamiento rítmico sintetizado continuo (Cascabeles y Bajo alegre)
   */
  private updateAccompaniment(): void {
    if (this.audio.getIsMuted() || (this.bgAudioElement && !this.bgAudioElement.paused)) return;

    const secondsPerBeat = 60 / this.bpm;
    const currentBeat = Math.floor(this.currentTime / secondsPerBeat);

    if (currentBeat > this.lastAccompanimentBeat) {
      this.lastAccompanimentBeat = currentBeat;

      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtxClass();
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(2400 + (currentBeat % 2 === 0 ? 300 : 0), now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch {
        // Fallback
      }
    }
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

    if (this.isStarPowerActive) {
      this.starPowerTimer -= dt;
      if (this.starPowerTimer <= 0) {
        this.isStarPowerActive = false;
        this.starPowerTimer = 0;
      }
    }

    this.updateAccompaniment();

    for (let l = 0; l < 4; l++) {
      if (this.lanePressTimers[l] > 0) {
        this.lanePressTimers[l] -= dt;
        if (this.lanePressTimers[l] <= 0) {
          this.lanePressed[l] = false;
        }
      }
    }

    this.beatPulse = (this.currentTime * (this.bpm / 60)) % 1.0;

    for (const note of this.notes) {
      if (!note.hit && !note.missed) {
        if (this.currentTime - note.targetTime > 0.28) {
          note.missed = true;
          this.missCount++;
          this.combo = 0;
          
          // Solo restar vida después del segundo 1.0 para dar margen de reacción inicial
          if (this.currentTime > 1.0) {
            this.lives = Math.max(0, this.lives - 1);
          }

          const laneCenterX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
          this.spawnJudgement("MISS", "#E53935", laneCenterX);
          this.particles.emitBurst(laneCenterX, this.hitLineY, "#E53935", 10);
          this.audio.playError();
          this.triggerShake(0.18, 6);

          if (this.lives <= 0) {
            this.addFloatingText("¡SIN VIDAS!", this.width / 2, this.height * 0.45, "#FF1744", 1.8);
            setTimeout(() => {
              this.endGame();
            }, 300);
            return;
          }
        }
      }
    }

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

    if (this.currentTime >= this.songDuration) {
      this.endGame();
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // Fondo base 100% opaco para evitar que elementos inferiores se filtren
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

    // Resplandor de MODO ESTRELLA GUITAR HERO (Dorado para Feria Mágica o Cian para Campuslands)
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

    // Dibujar los 4 Carriles y Separadores
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

    // Línea de Impacto Mágica
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

    // 4 Receptores de Campanas Inferiores
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

    // 5. Dibujar las Notas que Caen (Flechas de Bastón de Caramelo & Logos Star Power)
    for (const note of this.notes) {
      if (note.hit || note.missed) continue;

      const timeDiff = note.targetTime - this.currentTime;
      const noteY = this.hitLineY - timeDiff * this.noteSpeed;

      if (noteY > -80 && noteY < this.height + 40) {
        const lane = this.lanes[note.lane];
        const noteX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
        const radius = Math.min(this.laneWidth * 0.36, 36);

        ctx.save();
        ctx.translate(noteX, noteY);

        const isCampus = note.logoType === 2;

        // Sprite de Flecha de Bastón de Caramelo o Logo de la Marca (sin círculos de fondo)
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
          // Renderizado vectorial nítido de respaldo sólo si la imagen no ha cargado
          ctx.font = "900 28px 'Cinzel Decorative', 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = note.isStar ? "#FFD700" : lane.color;
          ctx.fillText(note.isStar ? "⭐" : lane.arrow, 0, 0);
        }

        ctx.restore();
      }
    }

    // Efectos de Modo Estrella y Contador de Combo
    const cx = this.width / 2;
    if (this.isStarPowerActive) {
      ctx.save();
      const bannerW = Math.min(this.width * 0.88, 440);
      const bannerH = 34;
      const bannerX = (this.width - bannerW) / 2;
      const bannerY = this.hitLineY - 170;

      const isCampus = this.activeStarPowerType === 2;
      const starGrad = ctx.createLinearGradient(bannerX, 0, bannerX + bannerW, 0);
      if (isCampus) {
        starGrad.addColorStop(0, "#00E5FF");
        starGrad.addColorStop(0.5, "#FFFFFF");
        starGrad.addColorStop(1, "#00E5FF");
      } else {
        starGrad.addColorStop(0, "#FFD700");
        starGrad.addColorStop(0.5, "#00E5FF");
        starGrad.addColorStop(1, "#FFD700");
      }
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 10);
      ctx.fill();

      ctx.font = "900 15px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#041424";
      const bannerTitle = isCampus ? "⚡ ¡STAR POWER CAMPUS x4 ACTIVO! ⚡" : "⚡ ¡STAR POWER FERIA x4 ACTIVO! ⚡";
      ctx.fillText(`${bannerTitle} (${Math.ceil(this.starPowerTimer)}s)`, cx, bannerY + bannerH / 2);
      ctx.restore();
    }

    if (this.combo >= 2) {
      ctx.save();
      const comboScale = 1.0 + Math.sin(this.currentTime * 10) * 0.06;
      ctx.translate(cx, this.hitLineY - 120);
      ctx.scale(comboScale, comboScale);

      ctx.font = "900 clamp(1.8rem, 4.5vw, 2.8rem) 'Cinzel Decorative', 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = 5;
      ctx.strokeText(`${this.combo} COMBO!`, 0, 0);
      ctx.fillStyle = this.isStarPowerActive || this.combo >= 20 ? "#FFD700" : "#FFFFFF";
      ctx.fillText(`${this.combo} COMBO!`, 0, 0);

      const mult = this.getMultiplier();
      if (mult > 1) {
        ctx.font = "800 clamp(0.85rem, 2vw, 1.15rem) 'Outfit', sans-serif";
        ctx.fillStyle = "#FFF9C4";
        ctx.fillText(`PUNTOS x${mult}`, 0, 24);
      }
      ctx.restore();
    }

    // Popups de Juicio (¡PERFECTO!, ¡GENIAL!, MISS)
    for (const j of this.activeJudgements) {
      ctx.save();
      ctx.globalAlpha = j.alpha;
      ctx.font = `900 clamp(1.4rem, 3.8vw, 2.2rem) 'Cinzel Decorative', 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
      ctx.lineWidth = 4;
      ctx.strokeText(j.text, j.x, j.y);
      ctx.fillStyle = j.color;
      ctx.fillText(j.text, j.x, j.y);
      ctx.restore();
    }
  }

  /**
   * Dibuja la barra de estado superior (HUD) con 5 Campanas Doradas 🔔
   */
  protected override drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const isNarrow = this.width < 460;
    const hudH = Math.max(44, Math.min(68, this.height * 0.075));

    // Fondo oscuro translúcido con borde dorado brillante
    ctx.fillStyle = "rgba(7, 18, 34, 0.96)";
    ctx.fillRect(0, 0, this.width, hudH);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, hudH);
    ctx.lineTo(this.width, hudH);
    ctx.stroke();

    const fontMain = isNarrow ? Math.max(13, this.width * 0.038) : Math.max(15, Math.min(24, this.width * 0.036));
    const fontSub = isNarrow ? Math.max(10, this.width * 0.028) : Math.max(12, Math.min(18, this.width * 0.028));
    const textY = hudH * 0.65;
    const paddingX = Math.max(10, this.width * 0.025);

    // 1. PUNTUACIÓN (Izquierda con estrella)
    const starRadius = fontMain * 0.44;
    const starX = paddingX + starRadius;
    const starY = textY - fontMain * 0.3;

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? starRadius : starRadius * 0.48;
      const px = starX + Math.cos(angle) * r;
      const py = starY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.font = `900 ${fontMain}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.fillText(`${this.score}`, starX + starRadius + 5, textY);

    // 2. 🔔 5 CAMPANAS (VIDAS) + TIEMPO RESTANTE (Centro)
    let timeFormatted: string;
    if (this.timeRemaining >= 60) {
      const mins = Math.floor(this.timeRemaining / 60);
      const secs = Math.floor(this.timeRemaining % 60);
      timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeFormatted = `${Math.ceil(this.timeRemaining)}s`;
    }

    if (this.gameState === "playing") {
      const bellSize = isNarrow ? 15 : 19;
      const bellGap = isNarrow ? 3 : 6;
      const totalBellsW = this.maxLives * bellSize + (this.maxLives - 1) * bellGap;
      const bellsStartX = (this.width / 2) - totalBellsW - (isNarrow ? 6 : 14);

      // Dibujar las 5 Campanas Doradas
      for (let i = 0; i < this.maxLives; i++) {
        const bx = bellsStartX + i * (bellSize + bellGap) + bellSize / 2;
        const by = textY - fontMain * 0.28;
        const isAlive = i < this.lives;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isAlive) {
          ctx.font = `${bellSize}px sans-serif`;
          ctx.fillText("🔔", bx, by);
        } else {
          ctx.font = `${bellSize * 0.85}px sans-serif`;
          ctx.globalAlpha = 0.25;
          ctx.fillText("🔔", bx, by);
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = "#FF1744";
          ctx.font = `900 ${bellSize * 0.7}px 'Outfit', sans-serif`;
          ctx.fillText("✕", bx, by);
        }
      }

      // Tiempo restante
      ctx.font = `900 ${fontMain}px 'Outfit', sans-serif`;
      ctx.fillStyle = this.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(timeFormatted, (this.width / 2) + (isNarrow ? 6 : 14), textY);

      // Barra de progreso justo debajo del HUD
      const barW = Math.min(this.width * 0.92, 500);
      const barH = 5;
      const barX = (this.width - barW) / 2;
      const barY = hudH + 2;
      const progress = Math.min(1, this.currentTime / this.songDuration);

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(barX, barY, barW, barH);

      const progGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      progGrad.addColorStop(0, "#FFD700");
      progGrad.addColorStop(1, "#00E5FF");
      ctx.fillStyle = progGrad;
      ctx.fillRect(barX, barY, barW * progress, barH);
    } else {
      ctx.font = `900 ${fontMain * 1.05}px 'Outfit', sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(timeFormatted, this.width / 2, textY);
    }

    // 3. RÉCORD (Derecha)
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#2ECC71";
    ctx.textAlign = "right";
    const recordLabel = isNarrow ? `TOP: ${Math.max(this.score, this.highScore)}` : `RÉCORD: ${Math.max(this.score, this.highScore)}`;
    ctx.fillText(recordLabel, this.width - paddingX, textY);

    ctx.restore();
  }

  /**
   * Dibuja la pantalla de Selección de Canción interactiva con las 5 canciones y el editor
   */
  private drawSongSelector(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;

    ctx.save();

    // 1. Título Principal y Subtítulo
    const titleY = Math.max(46, this.height * 0.07);
    const subY = titleY + 26;

    ctx.font = `900 clamp(1.15rem, 3.6vw, 1.7rem) 'Cinzel Decorative', 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("SELECCIONA TU CANCIÓN", cx, titleY);

    ctx.font = `700 clamp(0.70rem, 2.1vw, 0.85rem) 'Outfit', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("Toca una canción para comenzar el concierto navideño", cx, subY);

    // 2. Tarjetas de Canción estilizadas
    const count = this.songList.length;
    const cardW = Math.min(this.width * 0.90, 500);
    const startY = titleY + 46;
    const gap = Math.max(6, Math.min(9, this.height * 0.011));
    const cardH = Math.min(62, Math.max(46, (this.height * 0.60) / count));
    const cardX = (this.width - cardW) / 2;

    for (let i = 0; i < count; i++) {
      const song = this.songList[i];
      const cy = startY + i * (cardH + gap);
      const isSelected = i === this.selectedSongIndex;

      // Fondo de la tarjeta
      ctx.fillStyle = isSelected ? "rgba(14, 40, 78, 0.95)" : "rgba(8, 20, 40, 0.90)";
      ctx.beginPath();
      ctx.roundRect(cardX, cy, cardW, cardH, 12);
      ctx.fill();

      // Borde brillante
      ctx.lineWidth = isSelected ? 2.8 : 1.6;
      ctx.strokeStyle = isSelected ? song.tagColor : "rgba(255, 215, 0, 0.35)";
      ctx.stroke();

      // Icono
      const iconSize = Math.max(18, Math.min(24, cardH * 0.42));
      ctx.font = `${iconSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(song.icon, cardX + iconSize + 10, cy + cardH / 2);

      // Título de la Canción
      const titleFont = Math.max(12, Math.min(16, cardH * 0.30));
      ctx.font = `900 ${titleFont}px 'Outfit', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
      ctx.fillText(song.title, cardX + iconSize * 2 + 14, cy + cardH * 0.38);

      // Subtítulo y BPM
      const subFont = Math.max(9.5, Math.min(12, cardH * 0.22));
      ctx.font = `600 ${subFont}px 'Outfit', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText(`${song.subtitle} • ${song.bpm} BPM`, cardX + iconSize * 2 + 14, cy + cardH * 0.72);

      // Badge de Dificultad
      const badgeW = Math.max(50, Math.min(66, cardW * 0.15));
      const badgeH = Math.max(17, Math.min(22, cardH * 0.38));
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

    // 3. Botón Destacado: MODO GRABADOR / EDITOR DE CANCIÓN (Limpio y sin glitches)
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

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    ctx.font = `900 ${Math.max(11, Math.min(14, editorBtnH * 0.34))}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#041424";
    ctx.fillText("🛠️ MODO GRABADOR / EDITOR DE RITMO", cx, editorBtnY + editorBtnH * 0.38);

    ctx.font = `700 ${Math.max(9, Math.min(11, editorBtnH * 0.26))}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#041424";
    ctx.fillText("Toca aquí o pulsa [ E ] para grabar notas en vivo", cx, editorBtnY + editorBtnH * 0.74);

    ctx.restore();
  }

  public override endGame(): void {
    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
    }
    super.endGame({
      isCustomChart: this.isCustomChartPlaying,
      customNotes: this.lastCustomNotes.length > 0 ? this.lastCustomNotes : undefined,
      songFile: this.isCustomChartPlaying ? this.lastCustomSongFile : (this.songList[this.selectedSongIndex]?.audioFile || "jingle-bells.mp3"),
      bpm: this.bpm
    });
  }

  public override destroy(): void {
    super.destroy();
    this.chartEditor.hide();
    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
    }
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
    }
    if (this.keyupHandler) {
      window.removeEventListener("keyup", this.keyupHandler);
    }
  }
}
