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
   * Desbloquea el contexto de audio tras el primer toque del usuario
   */
  public unlockAudio(): void {
    if (this.isUnlocked && this.ctx && this.ctx.state === "running") return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtxClass();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.isUnlocked = true;
    } catch (e) {
      console.warn("No se pudo desbloquear el AudioContext:", e);
    }
  }

  /**
   * Alterna entre silenciado y con sonido
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
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
