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

export interface SongDef {
  id: string;
  title: string;
  subtitle: string;
  bpm: number;
  speed: number;
  stars: number;
  difficultyLabel: string;
  tagColor: string;
  audioFile: string;
  icon: string;
}

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
  public readonly songList: SongDef[] = [
    {
      id: "jingle-bells",
      title: "Jingle Bells Rock",
      subtitle: "Ritmo clásico y alegre",
      bpm: 119,
      speed: 490,
      stars: 2,
      difficultyLabel: "FÁCIL",
      tagColor: "#00E676",
      audioFile: "jingle-bells.mp3",
      icon: "🎅"
    },
    {
      id: "deck-the-halls",
      title: "Deck The Halls Rush",
      subtitle: "Fiesta y cascadas de notas",
      bpm: 140,
      speed: 540,
      stars: 3,
      difficultyLabel: "MEDIO",
      tagColor: "#FFD700",
      audioFile: "deck-the-halls.mp3",
      icon: "🎄"
    },
    {
      id: "carol-of-bells",
      title: "Carol of the Bells",
      subtitle: "Sinfonía rápida FNF Pro",
      bpm: 156,
      speed: 600,
      stars: 5,
      difficultyLabel: "DIFÍCIL",
      tagColor: "#FF3366",
      audioFile: "carol-of-bells.mp3",
      icon: "❄️"
    }
  ];

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
  private songDuration: number = 45;
  private currentTime: number = 0;
  private noteSpeed: number = 520;
  private hitLineY: number = 0;
  private laneWidth: number = 0;
  private laneStartX: number = 0;

  // Notas activas
  private notes: FallingNote[] = [];
  private lanePressed: boolean[] = [false, false, false, false];
  private lanePressTimers: number[] = [0, 0, 0, 0];

  // Métricas y Combo
  private combo: number = 0;
  private maxCombo: number = 0;
  private perfectCount: number = 0;
  private greatCount: number = 0;
  private goodCount: number = 0;
  private missCount: number = 0;

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

  protected onStart(): void {
    this.gameState = "song-select";
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.greatCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
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

    this.bpm = song.bpm;
    this.noteSpeed = song.speed;
    this.currentTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.activeJudgements = [];
    this.starPowerTimer = 0;
    this.isStarPowerActive = false;

    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
      this.bgAudioElement = null;
    }

    try {
      this.bgAudioElement = new Audio(`./assets/audio/${song.audioFile}`);
      this.bgAudioElement.volume = 0.75;
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

  private handleSongSelectTouch(x: number, y: number): void {
    const cardH = Math.min(105, this.height * 0.14);
    const cardW = Math.min(this.width * 0.88, 480);
    const startY = this.height * 0.28;
    const gap = 16;

    for (let i = 0; i < this.songList.length; i++) {
      const cy = startY + i * (cardH + gap);
      const cx = (this.width - cardW) / 2;

      if (x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH) {
        this.selectedSongIndex = i;
        this.audio.playTap();
        this.startSong(i);
        return;
      }
    }
  }

  private setupKeyboard(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isGameOver) return;

      if (this.gameState === "song-select") {
        if (e.key === "1") this.startSong(0);
        else if (e.key === "2") this.startSong(1);
        else if (e.key === "3") this.startSong(2);
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
    const secondsPerBeat = 60 / song.bpm;
    let noteId = 0;
    let starCount = 0;

    let pattern: { lane: number; b: number; isStar?: boolean }[] = [];

    if (song.id === "jingle-bells") {
      // Partitura alineada con la voz y letra real de la canción (Intro, Verso y Coro completo)
      const vocalChart = [
        // --- INTRO / CALIBRACIÓN (0s - 9s) ---
        { lane: 0, time: 2.00, isStar: false },
        { lane: 1, time: 4.00, isStar: false },
        { lane: 2, time: 6.00, isStar: false },
        { lane: 3, time: 8.00, isStar: true, logoType: 1 },

        // --- VERSO 1 (9.0s - 24.5s): "Dashing through the snow..." ---
        { lane: 0, time: 9.20, isStar: false },
        { lane: 0, time: 9.60, isStar: false },
        { lane: 1, time: 10.00, isStar: false },
        { lane: 1, time: 10.30, isStar: false }, // Segundo toque añadido
        { lane: 2, time: 10.60, isStar: false },
        { lane: 0, time: 11.20, isStar: false },

        { lane: 1, time: 12.20, isStar: false },
        { lane: 1, time: 12.60, isStar: false },
        { lane: 2, time: 13.20, isStar: false },
        { lane: 3, time: 13.80, isStar: true, logoType: 2 },
        { lane: 1, time: 14.40, isStar: false },

        { lane: 0, time: 15.20, isStar: false },
        { lane: 1, time: 15.60, isStar: false },
        { lane: 2, time: 16.20, isStar: false },
        { lane: 3, time: 16.80, isStar: false },
        { lane: 2, time: 17.40, isStar: false },

        { lane: 1, time: 18.40, isStar: false },
        { lane: 2, time: 18.90, isStar: false },
        { lane: 3, time: 19.40, isStar: true, logoType: 1 },
        { lane: 2, time: 20.10, isStar: false },

        { lane: 0, time: 21.20, isStar: false },
        { lane: 1, time: 21.60, isStar: false },
        { lane: 2, time: 22.00, isStar: false },
        { lane: 3, time: 22.50, isStar: false },
        { lane: 1, time: 23.10, isStar: false },
        { lane: 2, time: 23.60, isStar: false },
        { lane: 3, time: 24.20, isStar: true, logoType: 2 },

        // --- CORO PRINCIPAL (25.0s - 42.0s): "JINGLE BELLS, JINGLE BELLS..." ---
        { lane: 1, time: 25.20, isStar: false },
        { lane: 1, time: 25.70, isStar: false },
        { lane: 1, time: 26.20, isStar: false },

        { lane: 1, time: 27.20, isStar: false },
        { lane: 1, time: 27.70, isStar: false },
        { lane: 1, time: 28.20, isStar: false },

        { lane: 1, time: 29.20, isStar: false },
        { lane: 3, time: 29.70, isStar: true, logoType: 1 },
        { lane: 0, time: 30.20, isStar: false },
        { lane: 1, time: 30.70, isStar: false },
        { lane: 2, time: 31.40, isStar: false },

        { lane: 2, time: 33.00, isStar: false },
        { lane: 2, time: 33.50, isStar: false },
        { lane: 2, time: 34.00, isStar: false },
        { lane: 2, time: 34.50, isStar: false },

        { lane: 2, time: 35.20, isStar: false },
        { lane: 1, time: 35.70, isStar: false },
        { lane: 1, time: 36.20, isStar: false },
        { lane: 1, time: 36.70, isStar: false },
        { lane: 1, time: 37.20, isStar: false },

        // Acorde Doble "HEY!"
        { lane: 0, time: 38.20, isStar: true, logoType: 2 },
        { lane: 3, time: 38.20, isStar: false },

        // Segunda vuelta del Coro
        { lane: 1, time: 39.20, isStar: false },
        { lane: 1, time: 39.60, isStar: false },
        { lane: 1, time: 40.00, isStar: false },

        { lane: 1, time: 40.80, isStar: false },
        { lane: 1, time: 41.20, isStar: false },
        { lane: 1, time: 41.60, isStar: false },

        { lane: 1, time: 42.40, isStar: false },
        { lane: 3, time: 42.80, isStar: true, logoType: 1 },
        { lane: 0, time: 43.20, isStar: false },
        { lane: 1, time: 43.60, isStar: false },
        { lane: 2, time: 44.00, isStar: false },

        // Clímax Final
        { lane: 0, time: 44.60, isStar: true, logoType: 2 },
        { lane: 3, time: 44.60, isStar: false }
      ];

      for (const item of vocalChart) {
        pattern.push({
          lane: item.lane,
          b: item.time / secondsPerBeat,
          isStar: item.isStar
        });
      }
    } else if (song.id === "deck-the-halls") {
      pattern = [
        { lane: 3, b: 2.0, isStar: true }, { lane: 2, b: 3.0 }, { lane: 1, b: 4.0 }, { lane: 0, b: 5.0 },
        { lane: 1, b: 6.0 }, { lane: 2, b: 6.5 }, { lane: 3, b: 7.0 }, { lane: 2, b: 8.0 },
        { lane: 1, b: 9.0 }, { lane: 2, b: 9.5 }, { lane: 3, b: 10.0 }, { lane: 2, b: 10.5 },
        { lane: 1, b: 11.0 }, { lane: 0, b: 11.5 }, { lane: 1, b: 12.0 }, { lane: 2, b: 12.5, isStar: true },

        { lane: 3, b: 14.0 }, { lane: 2, b: 14.5 }, { lane: 1, b: 15.0 }, { lane: 0, b: 15.5 },
        { lane: 1, b: 16.0 }, { lane: 2, b: 16.5 }, { lane: 3, b: 17.0, isStar: true },
        { lane: 0, b: 18.0 }, { lane: 1, b: 18.5 }, { lane: 2, b: 19.0 }, { lane: 3, b: 19.5 },
        { lane: 2, b: 20.0 }, { lane: 1, b: 20.5 }, { lane: 0, b: 21.0 }, { lane: 1, b: 21.5 },

        { lane: 0, b: 23.0 }, { lane: 1, b: 23.5 }, { lane: 2, b: 24.0 }, { lane: 3, b: 24.5, isStar: true },
        { lane: 2, b: 25.0 }, { lane: 1, b: 25.5 }, { lane: 0, b: 26.0 }, { lane: 1, b: 26.5 },
        { lane: 3, b: 28.0 }, { lane: 2, b: 28.5 }, { lane: 1, b: 29.0 }, { lane: 0, b: 29.5 },
        { lane: 0, b: 30.5 }, { lane: 3, b: 30.5, isStar: true },
        { lane: 1, b: 31.5 }, { lane: 2, b: 31.5 },
        { lane: 0, b: 33.0 }, { lane: 1, b: 33.5 }, { lane: 2, b: 34.0 }, { lane: 3, b: 34.5, isStar: true },
        { lane: 2, b: 36.0 }, { lane: 1, b: 36.5 }, { lane: 0, b: 37.0 },
        { lane: 0, b: 39.0 }, { lane: 3, b: 39.0, isStar: true },
        { lane: 1, b: 40.0 }, { lane: 2, b: 40.0, isStar: true }
      ];
    } else {
      pattern = [
        { lane: 2, b: 2.0 }, { lane: 1, b: 2.33 }, { lane: 2, b: 2.66 }, { lane: 0, b: 3.0 },
        { lane: 2, b: 4.0 }, { lane: 1, b: 4.33 }, { lane: 2, b: 4.66 }, { lane: 0, b: 5.0 },
        { lane: 2, b: 6.0 }, { lane: 1, b: 6.33 }, { lane: 2, b: 6.66 }, { lane: 0, b: 7.0 },
        { lane: 3, b: 8.0, isStar: true }, { lane: 2, b: 8.33 }, { lane: 1, b: 8.66 }, { lane: 0, b: 9.0 },

        { lane: 2, b: 10.0 }, { lane: 1, b: 10.33 }, { lane: 2, b: 10.66 }, { lane: 0, b: 11.0 },
        { lane: 3, b: 12.0 }, { lane: 2, b: 12.33 }, { lane: 3, b: 12.66 }, { lane: 1, b: 13.0, isStar: true },
        { lane: 0, b: 14.0 }, { lane: 1, b: 14.33 }, { lane: 2, b: 14.66 }, { lane: 3, b: 15.0 },
        { lane: 2, b: 16.0 }, { lane: 1, b: 16.33 }, { lane: 0, b: 16.66 }, { lane: 1, b: 17.0 },

        { lane: 0, b: 19.0 }, { lane: 1, b: 19.33 }, { lane: 2, b: 19.66 }, { lane: 3, b: 20.0, isStar: true },
        { lane: 3, b: 20.33 }, { lane: 2, b: 20.66 }, { lane: 1, b: 21.0 }, { lane: 0, b: 21.33 },
        { lane: 0, b: 22.0 }, { lane: 2, b: 22.33 }, { lane: 1, b: 22.66 }, { lane: 3, b: 23.0 },
        { lane: 2, b: 24.0 }, { lane: 1, b: 24.33 }, { lane: 2, b: 24.66 }, { lane: 0, b: 25.0, isStar: true },

        { lane: 0, b: 27.0 }, { lane: 3, b: 27.0 },
        { lane: 1, b: 28.0 }, { lane: 2, b: 28.0 },
        { lane: 0, b: 29.0 }, { lane: 3, b: 29.0, isStar: true },
        { lane: 1, b: 30.0 }, { lane: 2, b: 30.0 },
        { lane: 0, b: 31.0 }, { lane: 1, b: 31.33 }, { lane: 2, b: 31.66 }, { lane: 3, b: 32.0, isStar: true },
        { lane: 2, b: 33.0 }, { lane: 1, b: 33.33 }, { lane: 0, b: 33.66 },
        { lane: 0, b: 35.0 }, { lane: 3, b: 35.0, isStar: true }
      ];
    }

    pattern.forEach((p) => {
      let logoType: 1 | 2 = 1;
      if (p.isStar) {
        starCount++;
        logoType = starCount % 2 === 0 ? 2 : 1; // Alterna entre Feria Mágica (1) y Campuslands (2)
      }

      this.notes.push({
        id: noteId++,
        lane: p.lane,
        targetTime: p.b * secondsPerBeat,
        hit: false,
        missed: false,
        isStar: p.isStar || false,
        logoType: p.isStar ? logoType : undefined
      });
    });
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
        if (this.currentTime - note.targetTime > 0.24) {
          note.missed = true;
          this.missCount++;
          const wasHighCombo = this.combo >= 10;
          this.combo = 0;

          const laneCenterX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
          this.spawnJudgement("MISS", "#E53935", laneCenterX);

          if (wasHighCombo) {
            this.audio.playError();
            this.triggerShake(0.18, 5);
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
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      ctx.fillStyle = "rgba(4, 12, 24, 0.72)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#071426";
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
    ctx.shadowColor = this.isStarPowerActive ? (this.activeStarPowerType === 2 ? "rgba(0, 229, 255, 0.95)" : "rgba(255, 215, 0, 0.95)") : "rgba(255, 215, 0, 0.9)";
    ctx.shadowBlur = this.isStarPowerActive ? 22 : 15;
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
      ctx.fillStyle = isPressed ? "#FFFFFF" : lane.color;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
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
        const glowColor = note.isStar ? (isCampus ? "rgba(0, 229, 255, 0.95)" : "rgba(255, 215, 0, 0.95)") : lane.glowColor;

        // Estela mágica luminosa detrás de la nota
        const trailGrad = ctx.createLinearGradient(0, 0, 0, -65);
        trailGrad.addColorStop(0, glowColor);
        trailGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, 0);
        ctx.lineTo(radius * 0.6, 0);
        ctx.lineTo(0, -70);
        ctx.closePath();
        ctx.fill();

        // Sprite de Flecha de Bastón de Caramelo o Logo de la Marca
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
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = note.isStar ? 24 : 16;
          ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          ctx.fillStyle = lane.color;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // HUD de Ritmo
    this.drawRhythmHUD(ctx);

    // Popups de Juicio (¡PERFECTO!, ¡GENIAL!, MISS)
    for (const j of this.activeJudgements) {
      ctx.save();
      ctx.globalAlpha = j.alpha;
      ctx.font = `900 clamp(1.4rem, 3.8vw, 2.2rem) 'Cinzel Decorative', 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = j.color;
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.fillText(j.text, j.x, j.y);
      ctx.restore();
    }
  }

  /**
   * Dibuja la pantalla de Selección de Canción interactiva
   */
  private drawSongSelector(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;

    ctx.save();

    // Título Principal
    ctx.font = `900 clamp(1.6rem, 5vw, 2.4rem) 'Cinzel Decorative', 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
    ctx.shadowBlur = 16;
    ctx.fillText("SELECCIONA TU CANCIÓN", cx, this.height * 0.17);

    ctx.font = `700 clamp(0.85rem, 2.8vw, 1.1rem) 'Outfit', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.shadowBlur = 0;
    ctx.fillText("Toca una canción para comenzar el concierto navideño", cx, this.height * 0.22);

    // Tarjetas de Canción
    const cardH = Math.min(105, this.height * 0.14);
    const cardW = Math.min(this.width * 0.88, 480);
    const startY = this.height * 0.28;
    const gap = 16;

    for (let i = 0; i < this.songList.length; i++) {
      const song = this.songList[i];
      const cy = startY + i * (cardH + gap);
      const cardX = (this.width - cardW) / 2;
      const isSelected = i === this.selectedSongIndex;

      // Fondo de la tarjeta
      ctx.fillStyle = isSelected ? "rgba(12, 35, 68, 0.95)" : "rgba(8, 20, 38, 0.85)";
      ctx.beginPath();
      ctx.roundRect(cardX, cy, cardW, cardH, 14);
      ctx.fill();

      // Borde dorado brillante
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.strokeStyle = isSelected ? song.tagColor : "rgba(255, 215, 0, 0.4)";
      ctx.shadowColor = isSelected ? song.tagColor : "transparent";
      ctx.shadowBlur = isSelected ? 16 : 0;
      ctx.stroke();

      // Icono
      ctx.font = "34px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(song.icon, cardX + 38, cy + cardH / 2);

      // Título de la Canción
      ctx.font = "900 clamp(1.05rem, 3.2vw, 1.35rem) 'Outfit', sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E0E0E0";
      ctx.fillText(song.title, cardX + 75, cy + cardH * 0.38);

      // Subtítulo y BPM
      ctx.font = "600 clamp(0.75rem, 2.4vw, 0.95rem) 'Outfit', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText(`${song.subtitle} • ${song.bpm} BPM`, cardX + 75, cy + cardH * 0.72);

      // Badge de Dificultad
      const badgeW = 75;
      const badgeH = 26;
      const badgeX = cardX + cardW - badgeW - 14;
      const badgeY = cy + (cardH - badgeH) / 2;

      ctx.fillStyle = song.tagColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();

      ctx.font = "900 11px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#031524";
      ctx.fillText(song.difficultyLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    }

    ctx.restore();
  }

  private drawRhythmHUD(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;

    // Banner de MODO ESTRELLA GUITAR HERO (Si está activo)
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

    // Contador de Combo
    if (this.combo >= 2) {
      ctx.save();
      const comboScale = 1.0 + Math.sin(this.currentTime * 10) * 0.06;
      ctx.translate(cx, this.hitLineY - 120);
      ctx.scale(comboScale, comboScale);

      ctx.font = "900 clamp(1.8rem, 4.5vw, 2.8rem) 'Cinzel Decorative', 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = this.isStarPowerActive || this.combo >= 20 ? "#FFD700" : "#FFFFFF";
      ctx.shadowColor = this.isStarPowerActive || this.combo >= 20 ? "rgba(255, 215, 0, 0.9)" : "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 15;
      ctx.fillText(`${this.combo} COMBO!`, 0, 0);

      const mult = this.getMultiplier();
      if (mult > 1) {
        ctx.font = "800 clamp(0.85rem, 2vw, 1.15rem) 'Outfit', sans-serif";
        ctx.fillStyle = "#FFF9C4";
        ctx.fillText(`PUNTOS x${mult}`, 0, 24);
      }
      ctx.restore();
    }

    // Barra de Progreso de la Canción (Arriba)
    ctx.save();
    const barW = Math.min(this.width * 0.88, 500);
    const barH = 8;
    const barX = (this.width - barW) / 2;
    const barY = 55;
    const progress = Math.min(1, this.currentTime / this.songDuration);

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(barX, barY, barW, barH);

    const progGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    progGrad.addColorStop(0, "#FFD700");
    progGrad.addColorStop(1, "#00E5FF");
    ctx.fillStyle = progGrad;
    ctx.fillRect(barX, barY, barW * progress, barH);

    ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.restore();
  }

  public override endGame(): void {
    if (this.bgAudioElement) {
      this.bgAudioElement.pause();
    }
    super.endGame();
  }

  public override destroy(): void {
    super.destroy();
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
