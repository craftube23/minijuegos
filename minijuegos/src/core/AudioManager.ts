/**
 * ==============================================================================
 * GESTOR DE AUDIO (Web Audio API Sintetizado + Clips)
 * ==============================================================================
 * 
 * ¿Por qué sintetizado con Web Audio API?
 * 1. Funciona 100% OFFLINE de forma instantánea sin depender de descargar archivos pesados.
 * 2. Cero latencia en Android 11: no hay retardo al tocar la pantalla.
 * 3. Cumple estrictamente con la política de 'autoplay' de Android: se activa
 *    automáticamente con el primer toque del jugador en la pantalla.
 * 
 * Si deseas agregar tus propios archivos MP3 más adelante, puedes usar el método `playFile()`.
 */

import { Haptics } from "../utils/haptics";

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private isGameActive: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmVolume: number = 0.45;
  private gameBgmAudio: HTMLAudioElement | null = null;
  private gameBgmVolume: number = 0.50;
  private playlist: string[] = [
    "./assets/audio/jingle-bells.mp3",
    "./assets/audio/Joy to the world.mp3",
    "./assets/audio/Deck The Halls.mp3",
    "./assets/audio/Dance of the Sugar Plum Fairy.mp3",
    "./assets/audio/Up on the Housetop.mp3",
    "./assets/audio/We Wish You a Merry Christmas.mp3"
  ];
  private lastSongIndex: number = -1;
  private currentBgmPath: string = "./assets/audio/jingle-bells.mp3";

  private constructor() {
    // Inicialización perezosa (lazy)
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Desbloquea el contexto de audio Web Audio para efectos de sonido
   * (NUNCA reproduce música de fondo dentro de un minijuego)
   */
  public unlockAudio(): void {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    this.isUnlocked = true;
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public getCurrentBgmPath(): string {
    return this.currentBgmPath;
  }

  /**
   * Establece si hay un minijuego activo
   */
  public setGameActive(active: boolean): void {
    this.isGameActive = active;
    if (active) {
      this.stopMenuBGM();
    } else {
      this.stopGameBGM();
    }
  }

  public getIsGameActive(): boolean {
    return this.isGameActive;
  }

  /**
   * Obtiene la siguiente canción al azar de la playlist evitando repetir la anterior
   */
  public getRandomSong(): string {
    if (this.playlist.length === 0) return "./assets/audio/jingle-bells.mp3";
    if (this.playlist.length === 1) return this.playlist[0];

    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * this.playlist.length);
    } while (randomIndex === this.lastSongIndex);

    this.lastSongIndex = randomIndex;
    return this.playlist[randomIndex];
  }

  /**
   * Reproduce una canción aleatoria de la playlist para el Menú / Inicio.
   * Si 'forceNew' es false y ya está sonando una pista, la mantiene fluida sin cortes.
   * Si la canción termina, avanza automáticamente a la siguiente pista al azar.
   */
  public playRandomMenuBGM(forceNew: boolean = false, volume: number = 0.45): void {
    if (this.isGameActive || this.isMuted) {
      this.stopMenuBGM();
      return;
    }

    this.bgmVolume = volume;

    // Si ya está sonando y no se exige una nueva pista, continuar fluidamente
    if (!forceNew && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    const song = this.getRandomSong();
    this.currentBgmPath = song;

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio();
      this.bgmAudio.addEventListener("ended", () => {
        // Al terminar la pista, pasar automáticamente a la siguiente aleatoria
        if (!this.isGameActive && !this.isMuted) {
          this.playRandomMenuBGM(true, this.bgmVolume);
        }
      });
    }

    this.bgmAudio.src = song;
    this.bgmAudio.volume = this.bgmVolume;
    this.bgmAudio.play().catch(() => {});
  }

  /**
   * Reproduce música de fondo ambiental (BGM)
   * Solo suena en inicio y menú; NUNCA dentro de un minijuego
   */
  public playMenuBGM(src?: string, volume: number = 0.45): void {
    if (src) {
      if (this.isGameActive || this.isMuted) {
        this.stopMenuBGM();
        return;
      }

      this.bgmVolume = volume;
      this.currentBgmPath = src;

      if (!this.bgmAudio) {
        this.bgmAudio = new Audio();
        this.bgmAudio.addEventListener("ended", () => {
          if (!this.isGameActive && !this.isMuted) {
            this.playRandomMenuBGM(true, this.bgmVolume);
          }
        });
      }

      if (this.bgmAudio.paused || this.bgmAudio.src !== src) {
        this.bgmAudio.src = src;
        this.bgmAudio.volume = this.bgmVolume;
        this.bgmAudio.play().catch(() => {});
      }
    } else {
      this.playRandomMenuBGM(false, volume);
    }
  }

  /**
   * Detiene por completo la música de fondo al entrar a un juego
   */
  public stopMenuBGM(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  /**
   * Pausa la música de fondo
   */
  public pauseMenuBGM(): void {
    this.stopMenuBGM();
  }

  /**
   * Reanuda la música de fondo de forma fluida (o cambia de pista si se solicita)
   */
  public resumeMenuBGM(forceNew: boolean = false): void {
    this.isGameActive = false;
    this.playRandomMenuBGM(forceNew, this.bgmVolume);
  }

  /**
   * Reproduce música de fondo exclusiva para el minijuego activo
   */
  public playGameBGM(src: string, volume: number = 0.50, loop: boolean = true): void {
    if (this.isMuted) return;
    this.stopGameBGM();
    this.gameBgmVolume = volume;

    try {
      this.gameBgmAudio = new Audio(src);
      this.gameBgmAudio.loop = loop;
      this.gameBgmAudio.volume = volume;
      this.gameBgmAudio.muted = this.isMuted;
      this.gameBgmAudio.play().catch((e) => {
        console.warn("Aviso al reproducir música del minijuego:", e);
      });
    } catch (e) {
      console.warn("Error al inicializar música de minijuego:", e);
    }
  }

  /**
   * Detiene y descarga de memoria la música de fondo del minijuego
   */
  public stopGameBGM(): void {
    if (this.gameBgmAudio) {
      try {
        this.gameBgmAudio.pause();
        this.gameBgmAudio.currentTime = 0;
        this.gameBgmAudio.onended = null;
        this.gameBgmAudio.onerror = null;
        this.gameBgmAudio.removeAttribute("src");
        this.gameBgmAudio.load();
      } catch (e) {
        console.warn("Aviso al detener música de minijuego:", e);
      }
      this.gameBgmAudio = null;
    }
  }

  public pauseGameBGM(): void {
    if (this.gameBgmAudio) {
      this.gameBgmAudio.pause();
    }
  }

  public resumeGameBGM(): void {
    if (this.gameBgmAudio && !this.isMuted && this.isGameActive) {
      this.gameBgmAudio.volume = this.gameBgmVolume;
      this.gameBgmAudio.play().catch(() => {});
    }
  }

  /**
   * Alterna entre silenciado y con sonido
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
      if (!this.isMuted && this.bgmAudio.paused && !this.isGameActive) {
        this.bgmAudio.play().catch(() => {});
      }
    }
    if (this.gameBgmAudio) {
      this.gameBgmAudio.muted = this.isMuted;
      if (!this.isMuted && this.gameBgmAudio.paused && this.isGameActive) {
        this.gameBgmAudio.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
      if (!this.isMuted && this.bgmAudio.paused && !this.isGameActive) {
        this.bgmAudio.play().catch(() => {});
      }
    }
    if (this.gameBgmAudio) {
      this.gameBgmAudio.muted = this.isMuted;
      if (!this.isMuted && this.gameBgmAudio.paused && this.isGameActive) {
        this.gameBgmAudio.play().catch(() => {});
      }
    }
  }

  // Cache / Pool de Audio para efectos de sonido con baja latencia
  private sfxPool: Map<string, HTMLAudioElement[]> = new Map();

  /**
   * Reproduce un archivo de efecto de sonido (.mp3 / .wav) con pool reutilizable sin lag
   */
  public playSoundEffect(src: string, volume: number = 0.85): void {
    if (this.isMuted) return;

    try {
      let pool = this.sfxPool.get(src);
      if (!pool) {
        pool = [];
        this.sfxPool.set(src, pool);
      }

      // Buscar un reproductor disponible o crear uno nuevo (máx 5 por clip para no saturar memoria)
      let player = pool.find((audio) => audio.paused || audio.ended);
      if (!player) {
        if (pool.length < 5) {
          player = new Audio(src);
          pool.push(player);
        } else {
          player = pool[0];
          player.pause();
        }
      }

      player.currentTime = 0;
      player.volume = Math.max(0, Math.min(1, volume));
      player.muted = this.isMuted;
      player.play().catch(() => {});
    } catch (e) {
      console.warn("Aviso al reproducir SFX:", src, e);
    }
  }

  // ==========================================================================
  // EFECTOS DE SONIDO ESPECÍFICOS: EL VUELO MÁGICO DEL ELFO
  // ==========================================================================

  /**
   * Sonido aleatorio al volar / aletear el elfo (alterna entre elfo_volar1 y elfo_volar2)
   */
  public playElfFly(): void {
    const soundFile = Math.random() < 0.5 ? "./assets/audio/elfo/elfo_volar1.mp3" : "./assets/audio/elfo/elfo_volar2.mp3";
    this.playSoundEffect(soundFile, 0.75);
  }

  /**
   * Sonido de impacto al chocar contra casas o estalactitas
   */
  public playElfHit(): void {
    Haptics.impact();
    this.playSoundEffect("./assets/audio/elfo/elfo_golpe.mp3", 0.90);
  }

  /**
   * Sonido unificado para recoger regalos, bastones de caramelo y coleccionables
   */
  public playElfCollectItem(): void {
    Haptics.light();
    this.playSoundEffect("./assets/audio/elfo/recoger_items.mp3", 0.85);
  }

  /**
   * Sonido de ráfaga de viento helado en contra
   */
  public playWindGust(): void {
    this.playSoundEffect("./assets/audio/elfo/viento_fuerte.mp3", 0.70);
  }

  // ==========================================================================
  // EFECTOS DE SONIDO SINTETIZADOS (Navideños, mágicos y arcade)
  // ==========================================================================

  /**
   * Sonido de toque de botón / interfaz (Clic sutil y agradable)
   */
  public playTap(): void {
    Haptics.tap();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Sonido al atrapar un regalo o sumar puntos (Campanita brillante)
   */
  public playCatchItem(pitchMultiplier: number = 1.0): void {
    Haptics.light();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const baseFreq = 880 * pitchMultiplier; // Nota La5 brillante
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.25);
    osc2.stop(this.ctx.currentTime + 0.25);
  }

  /**
   * Sonido de Power-Up especial (¡Logo de la Feria / Bono Mágico!)
   * Efecto ascendente con armónicos de campana
   */
  public playPowerUp(): void {
    Haptics.powerUp();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Do-Mi-Sol-Do-Mi mágico
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime + idx * 0.07;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Sonido crujiente de papel de regalo desgarrándose con fuerza (Paper Rip / Tear)
   */
  public playPaperTear(): void {
    Haptics.impact();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Etapa 1: Ruido blanco filtrado paso-banda rápido (Primer jalón y rotura inicial)
    const createRipBurst = (startTime: number, duration: number, freqStart: number, freqEnd: number, vol: number) => {
      if (!this.ctx) return;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Ruido granular crujiente
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.3 ? 1 : 0.4);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freqStart, startTime);
      filter.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
      filter.Q.setValueAtTime(3.0, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + duration);
    };

    // 1. Crujido inicial del agarre (0ms)
    createRipBurst(t, 0.12, 1200, 2600, 0.4);
    // 2. Gran desgarre central prolongado (70ms después)
    createRipBurst(t + 0.07, 0.32, 2200, 4800, 0.55);
    // 3. Desgarre de fibras y bordes finales (180ms después)
    createRipBurst(t + 0.18, 0.25, 3400, 1600, 0.38);
  }

  /**
   * Sonido de desempaque de regalo pausado y detallado capa por capa (Layer-by-layer Unboxing)
   * Diseñado para una animación clara y visible donde se aprecia cada etapa del rasgado.
   */
  public playExcitedKidUnwrap(): void {
    Haptics.celebration();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Función auxiliar para generar ráfagas de papel rasgado realista
    const createPaperTear = (time: number, dur: number, fLow: number, fHigh: number, vol: number) => {
      if (!this.ctx) return;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.2 ? 1 : 0.3);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(fLow, time);
      filter.frequency.linearRampToValueAtTime(fHigh, time + dur);
      filter.Q.setValueAtTime(2.5, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(time);
      noise.stop(time + dur);
    };

    // 1. Chasquido de cinta rompiéndose (t = 0ms)
    const oscPop = this.ctx.createOscillator();
    const gainPop = this.ctx.createGain();
    oscPop.type = "sine";
    oscPop.frequency.setValueAtTime(480, t);
    oscPop.frequency.exponentialRampToValueAtTime(90, t + 0.1);
    gainPop.gain.setValueAtTime(0.4, t);
    gainPop.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    oscPop.connect(gainPop);
    gainPop.connect(this.ctx.destination);
    oscPop.start(t);
    oscPop.stop(t + 0.1);

    // 2. Primer desgarre: Tira central de papel abriéndose (t = 0.35s)
    createPaperTear(t + 0.35, 0.35, 900, 2400, 0.5);

    // 3. Segundo desgarre: Solapa izquierda desprendiéndose (t = 0.8s)
    createPaperTear(t + 0.8, 0.4, 1400, 3200, 0.55);

    // 4. Tercer desgarre: Solapa derecha y fondo despegándose (t = 1.25s)
    createPaperTear(t + 1.25, 0.45, 1800, 4200, 0.6);

    // 5. Fanfarria mágica al revelarse el juego (t = 1.65s)
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + 1.65 + idx * 0.05;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.28, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.52);
    });
  }

  /**
   * Sonido mágico de desenvoltorio de regalo y apertura de telón
   */
  public playGiftUnwrap(): void {
    Haptics.celebration();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    // Arpegio ascendente festivo con timbres brillantes
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime + idx * 0.045;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  }

  /**
   * Sonido de nota de campana para el minijuego de música/luces
   * @param noteIndex 0: Do, 1: Mi, 2: Sol, 3: Si/Do agudo
   */
  public playBellNote(noteIndex: number): void {
    Haptics.medium();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const scale = [523.25, 659.25, 783.99, 987.77, 1046.50];
    const freq = scale[noteIndex % scale.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  /**
   * Sonido de error o penalización (Golpe grave amortiguado)
   */
  public playError(): void {
    Haptics.impact();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(70, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  /**
   * Fanfarria de Victoria / Fin de Partida
   */
  public playVictory(): void {
    Haptics.celebration();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    // Acorde alegre de victoria
    const chordNotes = [
      { freq: 523.25, time: 0.00 }, // Do
      { freq: 659.25, time: 0.12 }, // Mi
      { freq: 783.99, time: 0.24 }, // Sol
      { freq: 1046.5, time: 0.36 }, // Do agudo
      { freq: 1318.5, time: 0.48 }  // Mi agudo final sostenido
    ];

    chordNotes.forEach(({ freq, time }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime + time;
      const duration = 0.5;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Sonido de cuenta regresiva (3, 2, 1) - Campana afinada con armónico brillante
   */
  public playCountdownStep(stepNumber: number): void {
    Haptics.medium();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    // Frecuencias ascendentes: 3 = 659Hz (Mi), 2 = 784Hz (Sol), 1 = 988Hz (Si)
    const freqs = [659.25, 783.99, 987.77];
    const freq = freqs[Math.max(0, 3 - stepNumber)] || 880;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  /**
   * Sonido de ¡A JUGAR! / Inicio de partida (Acorde triunfal rápido)
   */
  public playGameStart(): void {
    Haptics.celebration();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    [1046.50, 1318.51, 1567.98].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.04);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + i * 0.04);
      osc.stop(this.ctx.currentTime + 0.55);
    });
  }

  /**
   * Sonido Whoosh mágico para transiciones cinemáticas
   */
  public playWhoosh(): void {
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // ==========================================================================
  // SONIDOS DE PERCUSIÓN TAIKO / CASCA-NUECES (Estilo Taiko no Tatsujin)
  // ==========================================================================

  /**
   * Golpe DON (🔴 Centro del Tambor Taiko - Grave y potente)
   */
  public playDrumDon(): void {
    Haptics.impact();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Golpe KA (🔵 Borde / Aro Metálico - Seco y agudo)
   */
  public playDrumKa(): void {
    Haptics.tap();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Golpe GOLD / STAR (🟡 Platillo Festivo + Cascabel Dorado Mágico)
   */
  public playDrumGold(): void {
    Haptics.celebration();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [880, 1320, 1760, 2640];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.02);

      gain.gain.setValueAtTime(0.28, t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.02);
      osc.stop(t + 0.45);
    });
  }

  /**
   * Golpe Fallido (Madera hueca desafinada)
   */
  public playDrumMiss(): void {
    Haptics.impact();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Sonidos dedicados para La Carrera Mágica de la Villa (2.5D Runner)
   */
  public playRunnerJump(): void {
    Haptics.light();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playRunnerSlide(): void {
    Haptics.tap();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(1100, t + 0.22);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.22);
  }

  public playRunnerLaneSwitch(): void {
    Haptics.tap();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playRunnerHit(): void {
    Haptics.impact();
    if (this.isMuted) return;
    this.unlockAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Método opcional para reproducir un archivo de audio externo si lo colocas en public/assets/audio/
   */
  public playFile(filePath: string, volume: number = 1.0): void {
    if (this.isMuted) return;
    this.unlockAudio();
    try {
      const audio = new Audio(filePath);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch {
      // Ignorar si el archivo no existe
    }
  }
}
