/**
 * ==============================================================================
 * JUEGO 3: 💡 ENCIENDE EL ÁRBOL MÁGICO (Magic Lights Melody)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - Un gran árbol de Navidad tiene 4 campanas/bombillas gigantes luminosas.
 * - El árbol toca una melodía iluminando las luces en secuencia.
 * - El jugador debe repetir la secuencia tocando los botones gigantes.
 * - Cada acierto suma puntos, enciende guirnaldas y aumenta la dificultad.
 * - Al completar rondas clave, la Estrella del Logo 1 en la cúspide se ilumina con confeti.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface BulbButton {
  id: number;
  x: number;
  y: number;
  radius: number;
  colorName: string;
  baseColor: string;
  litColor: string;
  soundIndex: number;
  emoji: string;
  isLit: boolean;
  litTimer: number;
}

export class TreeMelodyGame extends BaseGame {
  private bulbs: BulbButton[] = [];
  private sequence: number[] = [];
  private playerStep: number = 0;
  
  // Estados del juego: 'showing_sequence' | 'player_turn' | 'round_success' | 'game_over'
  private gameState: "showing_sequence" | "player_turn" | "round_success" = "showing_sequence";
  private sequencePlayIndex: number = 0;
  private sequenceTimer: number = 0;
  private sequenceDelay: number = 0.6; // Segundos entre notas

  private currentRound: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "tree-melody",
      "💡 Enciende el Árbol Mágico",
      "¡Memoriza la melodía y toca las campanas luminosas en el orden correcto!",
      canvas,
      input,
      audio,
      particles
    );
  }

  protected onStart(): void {
    this.initBulbs();
    this.currentRound = 1;
    this.sequence = [];
    this.startNewRound();
  }

  private initBulbs(): void {
    const cx = this.width / 2;
    const cy = this.height / 2 + 100;
    const offset = 180;
    const radius = 95; // Botones gigantes ideales para pantallas táctiles de niños

    this.bulbs = [
      {
        id: 0,
        x: cx - offset,
        y: cy - offset + 40,
        radius,
        colorName: "Rojo",
        baseColor: "#922B21",
        litColor: "#FF416C",
        soundIndex: 0,
        emoji: "🔔",
        isLit: false,
        litTimer: 0
      },
      {
        id: 1,
        x: cx + offset,
        y: cy - offset + 40,
        radius,
        colorName: "Dorado",
        baseColor: "#B7950B",
        litColor: "#FFD700",
        soundIndex: 1,
        emoji: "⭐",
        isLit: false,
        litTimer: 0
      },
      {
        id: 2,
        x: cx - offset,
        y: cy + offset - 20,
        radius,
        colorName: "Verde",
        baseColor: "#196F3D",
        litColor: "#2ECC71",
        soundIndex: 2,
        emoji: "🎄",
        isLit: false,
        litTimer: 0
      },
      {
        id: 3,
        x: cx + offset,
        y: cy + offset - 20,
        radius,
        colorName: "Azul",
        baseColor: "#1B4F72",
        litColor: "#00E5FF",
        soundIndex: 3,
        emoji: "❄️",
        isLit: false,
        litTimer: 0
      }
    ];
  }

  private startNewRound(): void {
    // Añadir una nueva nota a la secuencia
    const nextBulb = Math.floor(Math.random() * 4);
    this.sequence.push(nextBulb);

    this.gameState = "showing_sequence";
    this.sequencePlayIndex = 0;
    this.sequenceTimer = 0.5; // Breve pausa antes de empezar
    this.playerStep = 0;
  }

  protected onUpdate(dt: number): void {
    // 1. Actualizar temporizador de iluminación de cada bombilla
    for (const bulb of this.bulbs) {
      if (bulb.isLit) {
        bulb.litTimer -= dt;
        if (bulb.litTimer <= 0) {
          bulb.isLit = false;
        }
      }
    }

    // 2. Estado: Mostrando secuencia al jugador
    if (this.gameState === "showing_sequence") {
      this.sequenceTimer -= dt;
      if (this.sequenceTimer <= 0) {
        if (this.sequencePlayIndex < this.sequence.length) {
          const bulbId = this.sequence[this.sequencePlayIndex];
          this.lightBulb(bulbId, 0.4);
          this.sequencePlayIndex++;
          this.sequenceTimer = this.sequenceDelay;
        } else {
          // Secuencia terminada, es el turno del jugador
          this.gameState = "player_turn";
          this.playerStep = 0;
        }
      }
      return;
    }

    // 3. Estado: Turno del jugador (Detectar toques)
    if (this.gameState === "player_turn") {
      const pointer = this.input.getPrimaryPointer();
      if (pointer && pointer.isDown) {
        // Comprobar si tocó alguna bombilla
        for (const bulb of this.bulbs) {
          const dist = Math.hypot(pointer.x - bulb.x, pointer.y - bulb.y);
          if (dist <= bulb.radius) {
            // Evitar toques múltiples continuos si ya está encendida
            if (!bulb.isLit) {
              this.handlePlayerTouch(bulb.id);
            }
            break;
          }
        }
      }
    }
  }

  private lightBulb(bulbId: number, duration: number = 0.35): void {
    const b = this.bulbs[bulbId];
    if (b) {
      b.isLit = true;
      b.litTimer = duration;
      this.audio.playBellNote(b.soundIndex);
      this.particles.emitBurst(b.x, b.y, b.litColor, 8);
    }
  }

  private handlePlayerTouch(bulbId: number): void {
    this.lightBulb(bulbId, 0.3);

    // Comprobar si acertó el paso
    if (bulbId === this.sequence[this.playerStep]) {
      this.playerStep++;
      this.addScore(100 * this.currentRound);

      // ¿Completó toda la secuencia?
      if (this.playerStep >= this.sequence.length) {
        this.gameState = "round_success";
        this.currentRound++;
        this.addScore(500);

        // Cada 2 rondas, activa el Power-Up del Logo de la Feria
        if (this.currentRound % 2 === 0) {
          this.triggerLogoPowerUp(1, 5);
        } else {
          this.audio.playCatchItem(1.3);
          this.particles.emitConfetti(this.width, 25);
        }

        // Siguiente ronda tras 1 segundo
        setTimeout(() => {
          if (this.isRunning && !this.isGameOver) {
            this.startNewRound();
          }
        }, 900);
      }
    } else {
      // Error: Sonido de error y reinicio del turno actual
      this.audio.playError();
      this.particles.emitBurst(this.bulbs[bulbId].x, this.bulbs[bulbId].y, "#FF0000", 20);
      this.gameState = "showing_sequence";
      this.sequencePlayIndex = 0;
      this.sequenceTimer = 0.8;
      this.playerStep = 0;
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo nocturno de salón navideño
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, "#1A0A2A");
    bgGrad.addColorStop(0.6, "#2E114D");
    bgGrad.addColorStop(1, "#120524");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;

    // 2. Silueta del Árbol Navideño en el centro
    ctx.save();
    ctx.fillStyle = "#0E4D2B";
    ctx.beginPath();
    ctx.moveTo(cx, 160);
    ctx.lineTo(cx + 340, 1150);
    ctx.lineTo(cx - 340, 1150);
    ctx.closePath();
    ctx.fill();

    // Tronco
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(cx - 45, 1150, 90, 120);
    ctx.restore();

    // 3. Estrella de la Feria Mágica en la Cúspide
    ctx.save();
    ctx.translate(cx, 160);
    const starGlow = this.isLogoPowerUpActive ? "rgba(255, 215, 0, 0.8)" : "rgba(255, 215, 0, 0.3)";
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "80px 'Segoe UI Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⭐", 0, 0);

    ctx.fillStyle = "#0A2518";
    ctx.font = "bold 16px 'Segoe UI', sans-serif";
    ctx.fillText("FERIA", 0, 5);
    ctx.restore();

    // 4. Cartel de Estado / Turno
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.roundRect(cx - 240, 240, 480, 55, 25);
    ctx.fill();

    ctx.fillStyle = this.gameState === "player_turn" ? "#2ECC71" : "#FFD700";
    ctx.font = "bold 26px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const statusText = this.gameState === "player_turn" 
      ? `👉 ¡TU TURNO! (Paso ${this.playerStep + 1} de ${this.sequence.length})` 
      : `👀 ¡MIRA Y ESCUCHA LA MELODÍA! (Ronda ${this.currentRound})`;
    ctx.fillText(statusText, cx, 268);
    ctx.restore();

    // 5. Dibujar las 4 Bombillas / Campanas Táctiles Gigantes
    for (const b of this.bulbs) {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Aura brillante al encenderse
      if (b.isLit) {
        ctx.fillStyle = b.litColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius + 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Cuerpo del botón circular
      ctx.fillStyle = b.isLit ? b.litColor : b.baseColor;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = b.isLit ? 8 : 4;
      ctx.stroke();

      // Icono interior
      ctx.font = "70px 'Segoe UI Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.emoji, 0, 0);

      ctx.restore();
    }
  }
}
