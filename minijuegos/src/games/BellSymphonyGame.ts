/**
 * ==============================================================================
 * JUEGO: SINFONÍA DE CAMPANAS NAVIDEÑAS (Bell Symphony Rhythm Rush)
 * ==============================================================================
 * 
 * Minijuego musical estilo Friday Night Funkin' (FNF) / Guitar Hero con estética
 * Stylized 2D Fantasy Game Art:
 * - 4 Carriles mágicos verticales con campanas afinadas (Do, Mi, Sol, Do agudo).
 * - Partitura rítmica completa de 45 segundos con +120 notas (Jingle Bells, We Wish You a Merry Christmas, Deck the Halls y Clímax Rápido).
 * - Acompañamiento musical festivo sintetizado en tiempo real (Base rítmica navideña + cascabeles) con soporte para MP3 opcional.
 * - Sistema de juicio arcade: ¡PERFECTO!, ¡GENIAL!, ¡BIEN! y MISS.
 * - Medidor de Combo dinámico y Modo Fiesta Navideña (Fever Mode a +20 combo).
 * - Control multitáctil con pads inferiores y teclado (D, F, J, K o flechas).
 */

import { BaseGame } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { InputManager } from "../core/InputManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface FallingNote {
  id: number;
  lane: number; // 0: Rojo (← / D), 1: Dorado (↓ / F), 2: Verde (↑ / J), 3: Azul (→ / K)
  targetTime: number; // Segundo exacto en que la nota debe impactar la línea de objetivo
  hit: boolean;
  missed: boolean;
  isStar?: boolean;
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

  // Sprites e imágenes
  private bgImage: HTMLImageElement;
  private iconBellImage: HTMLImageElement;
  private imgBallRed: HTMLImageElement;
  private imgBallYellow: HTMLImageElement;
  private imgBallGreen: HTMLImageElement;
  private imgBallBlue: HTMLImageElement;

  // Estado del juego de ritmo
  private bpm: number = 138;
  private songDuration: number = 45;
  private currentTime: number = 0;
  private noteSpeed: number = 520; // Píxeles por segundo de caída
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
      "¡Toca las campanas al ritmo navideño cuando las notas crucen la línea mágica!",
      canvas,
      input,
      audio,
      particles
    );

    // Carga de Sprites
    this.bgImage = new Image();
    this.bgImage.src = "./assets/images/fondo-habitacion.webp";

    this.iconBellImage = new Image();
    this.iconBellImage.src = "./assets/images/icon-campanas.png";

    this.imgBallRed = new Image();
    this.imgBallRed.src = "./assets/images/bola-roja.png";

    this.imgBallYellow = new Image();
    this.imgBallYellow.src = "./assets/images/bola-amarilla.png";

    this.imgBallGreen = new Image();
    this.imgBallGreen.src = "./assets/images/bola-verde.png";

    this.imgBallBlue = new Image();
    this.imgBallBlue.src = "./assets/images/bola-azul.png";

    // Intentar precargar pista musical de audio si el usuario la agrega en public/assets/audio/
    try {
      this.bgAudioElement = new Audio("./assets/audio/cancion-navidad.mp3");
      this.bgAudioElement.loop = false;
      this.bgAudioElement.volume = 0.7;
    } catch {
      this.bgAudioElement = null;
    }

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

    this.recalculateLayout();
    this.generateChristmasSongChart();

    // Iniciar audio MP3 si está disponible y no silenciado
    if (this.bgAudioElement && !this.audio.getIsMuted()) {
      this.bgAudioElement.currentTime = 0;
      this.bgAudioElement.play().catch(() => {
        // Si no existe o no tiene permiso, la síntesis procedural Web Audio continuará automáticamente
      });
    }

    // Manejador táctil para móviles y tótems
    this.input.onTap = (x: number, _y: number) => {
      if (!this.isRunning || this.isGameOver) return;

      const lane = Math.floor((x - this.laneStartX) / this.laneWidth);
      if (lane >= 0 && lane < 4) {
        this.handleLanePress(lane);
      }
    };
  }

  private setupKeyboard(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isGameOver) return;
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
   * Genera la partitura rítmica completa que cubre los 45 segundos sin interrupción (+120 notas)
   */
  private generateChristmasSongChart(): void {
    this.notes = [];
    const secondsPerBeat = 60 / this.bpm;
    let noteId = 0;

    // Patrón melódico continuo de 0s a 44s:
    // 1. Intro & Jingle Bells Coro (compases 2 a 32)
    // 2. We Wish You a Merry Christmas (compases 34 a 58)
    // 3. Deck The Halls Fa-la-la (compases 60 a 76)
    // 4. Solo de Campanas Mágicas Rush (compases 78 a 92)
    // 5. Clímax Final Triunfal (compases 94 a 102)
    const pattern = [
      // --- SECCIÓN 1: Jingle Bells Coro ---
      { lane: 1, b: 2.0 }, { lane: 1, b: 2.5 }, { lane: 1, b: 3.0 },
      { lane: 1, b: 4.0 }, { lane: 1, b: 4.5 }, { lane: 1, b: 5.0 },
      { lane: 1, b: 6.0 }, { lane: 2, b: 6.5 }, { lane: 0, b: 7.0 }, { lane: 1, b: 7.5, isStar: true },
      // Fa Fa Fa Fa Fa Mi Mi Mi
      { lane: 2, b: 8.5 }, { lane: 2, b: 9.0 }, { lane: 2, b: 9.5 }, { lane: 2, b: 10.0 },
      { lane: 1, b: 10.5 }, { lane: 1, b: 11.0 }, { lane: 1, b: 11.5 },
      // Mi Re Re Mi Re Sol
      { lane: 1, b: 12.0 }, { lane: 0, b: 12.5 }, { lane: 0, b: 13.0 }, { lane: 1, b: 13.5 }, { lane: 0, b: 14.0 }, { lane: 2, b: 14.5, isStar: true },

      // Repetición Rápida de Jingle Bells con dobles notas
      { lane: 1, b: 16.0 }, { lane: 1, b: 16.5 }, { lane: 1, b: 17.0 },
      { lane: 1, b: 18.0 }, { lane: 1, b: 18.5 }, { lane: 1, b: 19.0 },
      { lane: 1, b: 20.0 }, { lane: 2, b: 20.5 }, { lane: 0, b: 21.0 }, { lane: 1, b: 21.5 },
      { lane: 2, b: 22.0 }, { lane: 2, b: 22.5 }, { lane: 2, b: 23.0 }, { lane: 2, b: 23.5 },
      { lane: 3, b: 24.0, isStar: true }, { lane: 3, b: 24.5 }, { lane: 2, b: 25.0 }, { lane: 1, b: 25.5 }, { lane: 0, b: 26.0 },

      // Ráfaga Rítmica de Transición
      { lane: 0, b: 27.5 }, { lane: 1, b: 28.0 }, { lane: 2, b: 28.5 }, { lane: 3, b: 29.0, isStar: true },
      { lane: 3, b: 29.5 }, { lane: 2, b: 30.0 }, { lane: 1, b: 30.5 }, { lane: 0, b: 31.0 },

      // --- SECCIÓN 2: We Wish You A Merry Christmas (14s a 25s) ---
      { lane: 0, b: 33.0 }, // We
      { lane: 1, b: 34.0 }, { lane: 1, b: 34.5 }, { lane: 2, b: 35.0 }, { lane: 1, b: 35.5 }, // wish you a mer-ry
      { lane: 0, b: 36.0 }, { lane: 0, b: 37.0 }, // Christ-mas
      { lane: 1, b: 38.0 }, { lane: 1, b: 38.5 }, { lane: 2, b: 39.0 }, { lane: 1, b: 39.5 },
      { lane: 0, b: 40.0 }, { lane: 0, b: 41.0 },
      { lane: 2, b: 42.0 }, { lane: 2, b: 42.5 }, { lane: 3, b: 43.0, isStar: true }, { lane: 2, b: 43.5 },
      { lane: 1, b: 44.0 }, { lane: 0, b: 45.0 }, { lane: 1, b: 45.5 }, { lane: 2, b: 46.0 },
      { lane: 3, b: 47.0, isStar: true }, { lane: 2, b: 47.5 }, { lane: 1, b: 48.0 }, { lane: 0, b: 49.0 },

      // --- SECCIÓN 3: Deck The Halls & Fa-la-la Rápido (25s a 34s) ---
      { lane: 3, b: 51.0, isStar: true }, { lane: 2, b: 52.0 }, { lane: 1, b: 53.0 }, { lane: 0, b: 54.0 },
      { lane: 1, b: 55.0 }, { lane: 2, b: 55.5 }, { lane: 3, b: 56.0 }, { lane: 2, b: 57.0 },
      // Fa-la-la-la-la (Ráfaga rápida de 8vas)
      { lane: 1, b: 58.0 }, { lane: 2, b: 58.5 }, { lane: 3, b: 59.0 }, { lane: 2, b: 59.5 },
      { lane: 1, b: 60.0 }, { lane: 0, b: 60.5 }, { lane: 1, b: 61.0 }, { lane: 2, b: 61.5, isStar: true },

      { lane: 3, b: 63.0 }, { lane: 2, b: 63.5 }, { lane: 1, b: 64.0 }, { lane: 0, b: 64.5 },
      { lane: 1, b: 65.0 }, { lane: 2, b: 65.5 }, { lane: 3, b: 66.0, isStar: true },
      { lane: 0, b: 67.0 }, { lane: 1, b: 67.5 }, { lane: 2, b: 68.0 }, { lane: 3, b: 68.5 },
      { lane: 2, b: 69.0 }, { lane: 1, b: 69.5 }, { lane: 0, b: 70.0 }, { lane: 1, b: 70.5 },

      // --- SECCIÓN 4: Solo de Campanas Mágicas FNF Rush (34s a 40s) ---
      { lane: 0, b: 72.0 }, { lane: 1, b: 72.5 }, { lane: 2, b: 73.0 }, { lane: 3, b: 73.5, isStar: true },
      { lane: 2, b: 74.0 }, { lane: 1, b: 74.5 }, { lane: 0, b: 75.0 }, { lane: 1, b: 75.5 },
      { lane: 2, b: 76.0 }, { lane: 3, b: 76.5 }, { lane: 2, b: 77.0 }, { lane: 1, b: 77.5 },
      { lane: 0, b: 78.0 }, { lane: 2, b: 78.5 }, { lane: 1, b: 79.0 }, { lane: 3, b: 79.5, isStar: true },
      { lane: 0, b: 80.0 }, { lane: 3, b: 80.5 }, { lane: 1, b: 81.0 }, { lane: 2, b: 81.5 },
      { lane: 0, b: 82.0 }, { lane: 1, b: 82.5 }, { lane: 2, b: 83.0 }, { lane: 3, b: 83.5, isStar: true },
      { lane: 3, b: 84.0 }, { lane: 2, b: 84.5 }, { lane: 1, b: 85.0 }, { lane: 0, b: 85.5 },

      // --- SECCIÓN 5: Gran Clímax Final Acelerado (40s a 44.5s) ---
      { lane: 0, b: 87.0 }, { lane: 1, b: 87.5 }, { lane: 2, b: 88.0 }, { lane: 3, b: 88.5, isStar: true },
      { lane: 1, b: 89.0 }, { lane: 2, b: 89.5 }, { lane: 3, b: 90.0 }, { lane: 0, b: 90.5 },
      { lane: 1, b: 91.0 }, { lane: 3, b: 91.5, isStar: true }, { lane: 0, b: 92.0 }, { lane: 2, b: 92.5 },
      { lane: 0, b: 93.0 }, { lane: 1, b: 93.5 }, { lane: 2, b: 94.0 }, { lane: 3, b: 94.5 },
      { lane: 0, b: 95.0 }, { lane: 3, b: 95.0, isStar: true }, // Doble nota simultánea
      { lane: 1, b: 96.0 }, { lane: 2, b: 96.0, isStar: true }, // Doble nota simultánea
      { lane: 0, b: 97.0 }, { lane: 3, b: 97.0, isStar: true },
      { lane: 1, b: 98.0 }, { lane: 2, b: 98.0, isStar: true },
      { lane: 0, b: 99.0 }, { lane: 1, b: 99.5 }, { lane: 2, b: 100.0 }, { lane: 3, b: 100.5, isStar: true }
    ];

    pattern.forEach((p) => {
      this.notes.push({
        id: noteId++,
        lane: p.lane,
        targetTime: p.b * secondsPerBeat,
        hit: false,
        missed: false,
        isStar: p.isStar || false
      });
    });
  }

  /**
   * Al presionar un carril: verifica timing de notas y emite sonido de campana
   */
  private handleLanePress(lane: number): void {
    this.lanePressed[lane] = true;
    this.lanePressTimers[lane] = 0.16;

    // Reproducir la nota musical de la campana en tiempo real con Web Audio
    this.playBellTone(this.lanes[lane].freq);

    // Buscar la nota más cercana en este carril que no haya sido tocada
    let closestNote: FallingNote | null = null;
    let minDiff = 999;

    for (const note of this.notes) {
      if (note.lane === lane && !note.hit && !note.missed) {
        const diff = Math.abs(note.targetTime - this.currentTime);
        if (diff < minDiff && diff < 0.24) { // Ventana de impacto: 240ms
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
        // ¡PERFECTO! (±60ms)
        const pts = 300 * this.getComboMultiplier();
        this.addScore(pts);
        this.combo++;
        this.perfectCount++;
        this.spawnJudgement("¡PERFECTO!", "#FFD700", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#FFD700", 1.3);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#FFD700", 16);
      } else if (minDiff <= 0.12) {
        // ¡GENIAL! (±120ms)
        const pts = 180 * this.getComboMultiplier();
        this.addScore(pts);
        this.combo++;
        this.greatCount++;
        this.spawnJudgement("¡GENIAL!", "#00E5FF", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#00E5FF", 1.15);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#00E5FF", 10);
      } else {
        // ¡BIEN! (±240ms)
        const pts = 80 * this.getComboMultiplier();
        this.addScore(pts);
        this.combo++;
        this.goodCount++;
        this.spawnJudgement("¡BIEN!", "#00E676", laneCenterX);
        this.addFloatingText(`+${pts}`, laneCenterX, this.hitLineY - 40, "#00E676", 1.0);
        this.particles.emitBurst(laneCenterX, this.hitLineY, "#00E676", 6);
      }

      if (closestNote.isStar) {
        this.addScore(500);
        this.particles.emitConfetti(this.width, 25);
        this.audio.playCatchItem(1.3);
      }

      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
    }
  }

  private getComboMultiplier(): number {
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
   * Sintetizador Web Audio de Campanas Navideñas con armónicos brillantes
   */
  private playBellTone(freq: number): void {
    if (this.audio.getIsMuted()) return;
    this.audio.unlockAudio();

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Armónico Fundamental + Armónicos de Campana Cristalina
      [
        { fRatio: 1.0, gainVal: 0.35, decay: 0.8 },
        { fRatio: 2.76, gainVal: 0.20, decay: 0.5 },
        { fRatio: 5.40, gainVal: 0.12, decay: 0.3 }
      ].forEach((harm) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * harm.fRatio, now);

        gain.gain.setValueAtTime(harm.gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + harm.decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + harm.decay);
      });
    } catch {
      // Audio fallback silencioso
    }
  }

  /**
   * Acompañamiento rítmico sintetizado continuo (Cascabeles y Bajo alegre de villancico)
   */
  private updateAccompaniment(): void {
    if (this.audio.getIsMuted() || (this.bgAudioElement && !this.bgAudioElement.paused)) return;

    const secondsPerBeat = 60 / this.bpm;
    const currentBeat = Math.floor(this.currentTime / secondsPerBeat);

    if (currentBeat > this.lastAccompanimentBeat) {
      this.lastAccompanimentBeat = currentBeat;

      // Reproducir percusión de cascabel festivo en cada compás
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtxClass();
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;

        // Sonido de Sleigh Bells (Cascabel rítmico ligero)
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
        // Ignorar si audio está suspendido
      }
    }
  }

  protected onUpdate(dt: number): void {
    this.currentTime += dt;

    // Acompañamiento rítmico en segundo plano
    this.updateAccompaniment();

    // Actualizar timers de animación de presión de carriles
    for (let l = 0; l < 4; l++) {
      if (this.lanePressTimers[l] > 0) {
        this.lanePressTimers[l] -= dt;
        if (this.lanePressTimers[l] <= 0) {
          this.lanePressed[l] = false;
        }
      }
    }

    // Pulso rítmico del escenario (BPM)
    this.beatPulse = (this.currentTime * (this.bpm / 60)) % 1.0;

    // Verificar notas perdidas (Miss) que cruzaron la línea de objetivo
    for (const note of this.notes) {
      if (!note.hit && !note.missed) {
        if (this.currentTime - note.targetTime > 0.24) {
          note.missed = true;
          this.missCount++;
          const wasHighCombo = this.combo >= 10;
          this.combo = 0; // Romper racha

          const laneCenterX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
          this.spawnJudgement("MISS", "#E53935", laneCenterX);

          if (wasHighCombo) {
            this.audio.playError();
            this.triggerShake(0.18, 5);
          }
        }
      }
    }

    // Actualizar popups de juicio
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

    // Fin de la canción / partida
    if (this.currentTime >= this.songDuration) {
      this.endGame();
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo de Habitación Navideña
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      ctx.fillStyle = "rgba(4, 12, 24, 0.72)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#071426";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Luces de Escenario en los Carriles
    const trackH = this.height;
    const totalW = this.laneWidth * 4;

    // Contenedor principal de pistas musicales
    ctx.save();
    ctx.fillStyle = "rgba(10, 25, 48, 0.78)";
    ctx.fillRect(this.laneStartX, 0, totalW, trackH);

    // Resplandor de Modo Fiesta Navideña (Fever Mode a +20 combo)
    if (this.combo >= 20) {
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

      // Haz de luz vertical cuando el carril está presionado
      if (this.lanePressed[i]) {
        const laneBeam = ctx.createLinearGradient(0, this.hitLineY, 0, 0);
        laneBeam.addColorStop(0, lane.glowColor);
        laneBeam.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = laneBeam;
        ctx.fillRect(lx, 0, this.laneWidth, this.hitLineY);
      }

      // Líneas divisorias doradas
      ctx.strokeStyle = "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, trackH);
      ctx.stroke();
    }
    // Borde derecho final
    ctx.beginPath();
    ctx.moveTo(this.laneStartX + totalW, 0);
    ctx.lineTo(this.laneStartX + totalW, trackH);
    ctx.stroke();
    ctx.restore();

    // 3. Línea de Impacto Mágica (Hit Target Bar)
    ctx.save();
    const hitBarGlow = ctx.createLinearGradient(this.laneStartX, 0, this.laneStartX + totalW, 0);
    hitBarGlow.addColorStop(0, "rgba(255, 215, 0, 0.8)");
    hitBarGlow.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    hitBarGlow.addColorStop(1, "rgba(255, 215, 0, 0.8)");
    ctx.strokeStyle = hitBarGlow;
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(this.laneStartX, this.hitLineY);
    ctx.lineTo(this.laneStartX + totalW, this.hitLineY);
    ctx.stroke();
    ctx.restore();

    // 4. Dibujar los 4 Receptores de Campanas Inferiores
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

      // Halo de Receptor
      const padHalo = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.5);
      padHalo.addColorStop(0, lane.glowColor);
      padHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = padHalo;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Anillo exterior de la campana
      ctx.lineWidth = isPressed ? 4.5 : 3;
      ctx.strokeStyle = isPressed ? "#FFFFFF" : lane.color;
      ctx.fillStyle = isPressed ? lane.color : "rgba(8, 20, 38, 0.85)";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Flecha / Icono indicador
      ctx.font = "900 24px 'Cinzel Decorative', 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isPressed ? "#FFFFFF" : lane.color;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(lane.arrow, 0, -1);

      // Tecla de ayuda (D, F, J, K)
      ctx.font = "700 12px 'Outfit', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText(lane.keyLabel, 0, radius + 16);

      ctx.restore();
    }

    // 5. Dibujar las Notas que Caen (Esferas y Campanas con Estela)
    for (const note of this.notes) {
      if (note.hit || note.missed) continue;

      const timeDiff = note.targetTime - this.currentTime;
      const noteY = this.hitLineY - timeDiff * this.noteSpeed;

      // Solo dibujar si está dentro del campo visual
      if (noteY > -80 && noteY < this.height + 40) {
        const lane = this.lanes[note.lane];
        const noteX = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
        const radius = Math.min(this.laneWidth * 0.32, 32);

        ctx.save();
        ctx.translate(noteX, noteY);

        // Estela mágica luminosa detrás de la nota
        const trailGrad = ctx.createLinearGradient(0, 0, 0, -60);
        trailGrad.addColorStop(0, lane.glowColor);
        trailGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.6, 0);
        ctx.lineTo(radius * 0.6, 0);
        ctx.lineTo(0, -65);
        ctx.closePath();
        ctx.fill();

        // Sprite de Esfera / Campana
        let sprite: HTMLImageElement | null = null;
        if (note.isStar && this.iconBellImage.complete && this.iconBellImage.naturalWidth > 0) {
          sprite = this.iconBellImage;
        } else if (note.lane === 0) sprite = this.imgBallRed;
        else if (note.lane === 1) sprite = this.imgBallYellow;
        else if (note.lane === 2) sprite = this.imgBallGreen;
        else if (note.lane === 3) sprite = this.imgBallBlue;

        const drawSize = radius * 2.3;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          ctx.shadowColor = lane.glowColor;
          ctx.shadowBlur = 16;
          ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          // Fallback vectorial
          ctx.fillStyle = lane.color;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // 6. HUD de Ritmo: Combo y Feedback Visual
    this.drawRhythmHUD(ctx);

    // 7. Popups de Juicio (¡PERFECTO!, ¡GENIAL!, MISS)
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

  private drawRhythmHUD(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;

    // Contador de Combo
    if (this.combo >= 2) {
      ctx.save();
      const comboScale = 1.0 + Math.sin(this.currentTime * 10) * 0.06;
      ctx.translate(cx, this.hitLineY - 120);
      ctx.scale(comboScale, comboScale);

      ctx.font = "900 clamp(1.8rem, 4.5vw, 2.8rem) 'Cinzel Decorative', 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = this.combo >= 20 ? "#FFD700" : "#FFFFFF";
      ctx.shadowColor = this.combo >= 20 ? "rgba(255, 215, 0, 0.9)" : "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 15;
      ctx.fillText(`${this.combo} COMBO!`, 0, 0);

      // Multiplicador de Puntos
      const mult = this.getComboMultiplier();
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
