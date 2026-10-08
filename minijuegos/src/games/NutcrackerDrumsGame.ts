/**
 * ==============================================================================
 * JUEGO 3: TAMBORES DEL CASCANUECES (Nutcracker Elf Taiko Drummer)
 * ==============================================================================
 * 
 * MECÁNICA TAIKO CALL & RESPONSE (Estilo Taiko no Tatsujin):
 * - Estilo visual: Stylized 2D Fantasy Game Concept Art.
 * - Fase 1 ("¡TURNO DEL ELFO! 🧝🥁"): Un elfo baterista toca una secuencia
 *   rítmica en sus tambores tradicionales con baquetas de bastón de caramelo.
 * - Fase 2 ("¡TU TURNO! 🎯✨"): El jugador repite la secuencia exacta en los 3 tambores táctiles:
 *     1. 🔴 Tambor Rojo (DON - Grave / Centro)
 *     2. 🟡 Tambor Dorado (STAR - Platillo / Cascabel Festivo)
 *     3. 🔵 Tambor Azul (KA - Agudo / Aro)
 * - Rondas progresivas con velocidad y complejidad creciente, combo x2/x3/x4,
 *   5 vidas con campanas doradas, feedback háptico y efectos de partículas.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { Haptics } from "../utils/haptics";

interface DrumPad {
  id: number; // 0: Rojo (DON), 1: Dorado (STAR), 2: Azul (KA)
  name: string;
  label: string;
  subLabel: string;
  x: number;
  y: number;
  radius: number;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  isPressed: boolean;
  pressScale: number;
  lastHitTime: number;
}

export class NutcrackerDrumsGame extends BaseGame {
  // Estado del juego
  private drums: DrumPad[] = [];
  private sequence: number[] = [];
  private playerStep: number = 0;
  private currentRound: number = 1;
  private maxRounds: number = 10;
  
  // Turnos: 'elf_turn' (Elfo tocando) | 'player_turn' (Jugador respondiendo) | 'round_success' | 'round_fail'
  private turnState: "elf_turn" | "player_turn" | "round_success" | "round_fail" = "elf_turn";
  private stateTimer: number = 0;
  
  // Reproducción de la demo del elfo
  private elfStepIndex: number = 0;
  private elfBeatTimer: number = 0;
  private elfBeatInterval: number = 0.55; // Segundos entre golpes del elfo
  
  // Animación del Elfo
  private elfX: number = 0;
  private elfY: number = 0;
  private elfScale: number = 1.0;
  private elfAnimState: "idle" | "hit_left" | "hit_center" | "hit_right" | "cheer" | "confused" = "idle";
  private elfAnimTimer: number = 0;
  private elfBouncePhase: number = 0;

  // Combo y Multiplicador
  private comboCount: number = 0;
  private maxCombo: number = 0;

  // Sprites
  private bgRoom: HTMLImageElement;

  // Seguimiento de teclas pulsadas
  private prevKeyStates: Record<string, boolean> = {};

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "tree-melody",
      "🥁 Tambores del Cascanueces",
      "¡Mira al elfo tocar el ritmo y repite exactamente su secuencia en los tambores mágicos!",
      canvas,
      input,
      audio,
      particles
    );

    this.showLives = true;
    this.maxLives = 5;
    this.lives = 5;

    // Carga de Sprites de fondo
    this.bgRoom = new Image();
    this.bgRoom.src = "./assets/images/fondo-habitacion.webp";

    // En el juego de tambores se mantiene silencio de fondo para escuchar con total nitidez cada golpe de percusión
    this.inGameMusicPath = "";
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.layoutElements();
  }

  private layoutElements(): void {
    const cx = this.width / 2;
    
    // Posición del Elfo en el escenario (tercio superior)
    this.elfX = cx;
    this.elfY = Math.max(160, this.height * 0.28);
    this.elfScale = Math.max(0.85, Math.min(1.3, this.width / 480));

    // Posición y tamaño de los 3 Tambores Taiko (tercio inferior táctil)
    const drumY = Math.min(this.height * 0.76, this.height - 130);
    const drumRadius = Math.max(48, Math.min(78, this.width * 0.145));
    const drumSpacing = Math.min(this.width * 0.31, drumRadius * 2.35);

    this.drums = [
      {
        id: 0,
        name: "DON",
        label: "🔴 DON",
        subLabel: "[ 1 ]",
        x: cx - drumSpacing,
        y: drumY,
        radius: drumRadius,
        primaryColor: "#E74C3C",
        accentColor: "#C0392B",
        glowColor: "rgba(231, 76, 60, 0.6)",
        isPressed: false,
        pressScale: 1.0,
        lastHitTime: 0
      },
      {
        id: 1,
        name: "STAR",
        label: "⭐ STAR",
        subLabel: "[ 2 ]",
        x: cx,
        y: drumY - 20, // Tambor dorado ligeramente elevado
        radius: drumRadius * 1.12,
        primaryColor: "#F1C40F",
        accentColor: "#D4AC0D",
        glowColor: "rgba(241, 196, 15, 0.75)",
        isPressed: false,
        pressScale: 1.0,
        lastHitTime: 0
      },
      {
        id: 2,
        name: "KA",
        label: "🔵 KA",
        subLabel: "[ 3 ]",
        x: cx + drumSpacing,
        y: drumY,
        radius: drumRadius,
        primaryColor: "#3498DB",
        accentColor: "#2980B9",
        glowColor: "rgba(52, 152, 219, 0.6)",
        isPressed: false,
        pressScale: 1.0,
        lastHitTime: 0
      }
    ];
  }

  protected onStart(): void {
    this.layoutElements();
    this.sequence = [];
    this.currentRound = 1;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.lives = 5;
    this.elfAnimState = "idle";
    this.elfBouncePhase = 0;
    this.prevKeyStates = {};

    // Manejador de toques táctiles con zona amplia
    this.input.onTap = (x: number, y: number) => {
      if (this.turnState !== "player_turn" || this.isGameOver || !this.isRunning) return;

      for (const drum of this.drums) {
        const dx = x - drum.x;
        const dy = y - drum.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= drum.radius * 1.35) {
          this.onPlayerHitDrum(drum.id);
          break;
        }
      }
    };

    this.startRound(1);
  }

  /**
   * Inicia una nueva ronda de ritmo aumentando el patrón
   */
  private startRound(round: number): void {
    this.currentRound = round;
    this.turnState = "elf_turn";
    this.stateTimer = 0;
    this.playerStep = 0;
    this.elfStepIndex = 0;

    // Generar secuencia rítmica incremental
    const beatsCount = Math.min(8, 2 + round);
    this.sequence = [];
    for (let i = 0; i < beatsCount; i++) {
      // 55% DON (0), 30% KA (2), 15% STAR DORADO (1)
      const rand = Math.random();
      if (rand < 0.50) {
        this.sequence.push(0);
      } else if (rand < 0.82) {
        this.sequence.push(2);
      } else {
        this.sequence.push(1);
      }
    }

    // Intervalo de tiempo más ágil a medida que avanza la ronda
    this.elfBeatInterval = Math.max(0.38, 0.62 - round * 0.025);
    this.elfBeatTimer = 0.5; // Pausa antes de que el elfo empiece a tocar
    this.elfAnimState = "idle";
  }

  protected onUpdate(dt: number): void {
    this.elfBouncePhase += dt * 4;
    this.elfAnimTimer -= dt;
    if (this.elfAnimTimer <= 0 && this.elfAnimState !== "idle" && this.turnState !== "round_success" && this.turnState !== "round_fail") {
      this.elfAnimState = "idle";
    }

    // Suavizar escala de presión de los tambores
    for (const drum of this.drums) {
      if (drum.pressScale > 1.0) {
        drum.pressScale = Math.max(1.0, drum.pressScale - dt * 4.0);
      }
    }

    // Soporte para teclado [1, 2, 3] o [D, F, J] para pruebas y escritorio
    if (this.turnState === "player_turn" && !this.isGameOver) {
      this.checkKeyboardHit("Digit1", "KeyD", 0);
      this.checkKeyboardHit("Digit2", "KeyF", 1);
      this.checkKeyboardHit("Digit3", "KeyJ", 2);
    }

    // =========================================================================
    // LÓGICA DE TURNOS (CALL & RESPONSE)
    // =========================================================================
    if (this.turnState === "elf_turn") {
      this.elfBeatTimer -= dt;
      if (this.elfBeatTimer <= 0) {
        if (this.elfStepIndex < this.sequence.length) {
          const drumId = this.sequence[this.elfStepIndex];
          this.triggerElfDrumHit(drumId);
          this.elfStepIndex++;
          this.elfBeatTimer = this.elfBeatInterval;
        } else {
          // El elfo terminó de tocar: Pasar el turno al jugador
          this.turnState = "player_turn";
          this.playerStep = 0;
          this.elfAnimState = "idle";
          this.addFloatingText("¡TU TURNO! 🎯", this.width / 2, this.height * 0.58, "#00E676", 1.3);
        }
      }
    } else if (this.turnState === "round_success") {
      this.stateTimer += dt;
      if (this.stateTimer >= 1.2) {
        if (this.currentRound >= this.maxRounds) {
          this.endGame();
        } else {
          this.startRound(this.currentRound + 1);
        }
      }
    } else if (this.turnState === "round_fail") {
      this.stateTimer += dt;
      if (this.stateTimer >= 1.3) {
        if (this.lives <= 0) {
          this.endGame();
        } else {
          // Repetir la misma ronda
          this.startRound(this.currentRound);
        }
      }
    }
  }

  private checkKeyboardHit(key1: string, key2: string, drumId: number): void {
    const isDown = this.input.isKeyDown(key1) || this.input.isKeyDown(key2);
    const keyKey = `${key1}_${key2}`;
    if (isDown && !this.prevKeyStates[keyKey]) {
      this.onPlayerHitDrum(drumId);
    }
    this.prevKeyStates[keyKey] = isDown;
  }

  /**
   * El elfo golpea un tambor durante su demostración
   */
  private triggerElfDrumHit(drumId: number): void {
    const drum = this.drums[drumId];
    if (!drum) return;

    drum.pressScale = 1.18;
    drum.lastHitTime = performance.now();

    if (drumId === 0) {
      this.audio.playDrumDon();
      this.elfAnimState = "hit_left";
    } else if (drumId === 1) {
      this.audio.playDrumGold();
      this.elfAnimState = "hit_center";
    } else {
      this.audio.playDrumKa();
      this.elfAnimState = "hit_right";
    }
    this.elfAnimTimer = this.elfBeatInterval * 0.75;

    // Chispas festivas sobre el tambor golpeado por el elfo
    this.particles.emitBurst(drum.x, drum.y - drum.radius * 0.4, drum.primaryColor, 10);
  }

  /**
   * Ejecuta la evaluación del golpe del jugador
   */
  private onPlayerHitDrum(drumId: number): void {
    const drum = this.drums[drumId];
    if (!drum) return;

    drum.pressScale = 1.22;
    drum.lastHitTime = performance.now();

    const expectedDrumId = this.sequence[this.playerStep];

    if (drumId === expectedDrumId) {
      // ¡Acierto de nota!
      if (drumId === 0) this.audio.playDrumDon();
      else if (drumId === 1) this.audio.playDrumGold();
      else this.audio.playDrumKa();

      this.comboCount++;
      if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

      const baseScore = drumId === 1 ? 250 : 150;
      const mult = this.comboCount >= 10 ? 3 : (this.comboCount >= 5 ? 2 : 1);
      const pointsEarned = baseScore * mult;
      this.addScore(pointsEarned);

      this.particles.emitBurst(drum.x, drum.y, drum.primaryColor, 14);
      this.addFloatingText(`+${pointsEarned}`, drum.x, drum.y - drum.radius, "#FFD700", 1.1);

      this.playerStep++;

      // ¿Completó toda la secuencia de la ronda?
      if (this.playerStep >= this.sequence.length) {
        this.turnState = "round_success";
        this.stateTimer = 0;
        this.elfAnimState = "cheer";
        this.audio.playVictory();
        Haptics.celebration();
        
        const roundBonus = this.currentRound * 500;
        this.addScore(roundBonus);
        
        this.particles.emitBurst(this.width / 2, this.height * 0.45, "#FFD700", 35);
        this.addFloatingText(`¡RONDA ${this.currentRound} SUPERADA! (+${roundBonus})`, this.width / 2, this.height * 0.52, "#00E5FF", 1.2);
      }
    } else {
      // ¡Error en el ritmo!
      this.audio.playDrumMiss();
      this.triggerShake(0.3, 8);
      this.comboCount = 0;
      this.lives = Math.max(0, this.lives - 1);
      
      this.turnState = "round_fail";
      this.stateTimer = 0;
      this.elfAnimState = "confused";
      
      this.particles.emitBurst(drum.x, drum.y, "#FF1744", 20);
      this.addFloatingText("¡RITMO FALLIDO! ✕", this.width / 2, this.height * 0.52, "#FF1744", 1.2);
    }
  }

  // =========================================================================
  // RENDERIZADO GRÁFICO (Canvas 2D Stylized Fantasy Art)
  // =========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo de Escenario Navideño Cálido
    if (this.bgRoom && this.bgRoom.complete && this.bgRoom.naturalWidth > 0) {
      ctx.drawImage(this.bgRoom, 0, 0, this.width, this.height);
      ctx.fillStyle = "rgba(4, 14, 26, 0.65)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#0A192F");
      grad.addColorStop(1, "#040B14");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Partículas mágicas de fondo
    this.particles.draw(ctx, true);

    // 3. Telón y Escenario del Cascanueces
    this.drawStage(ctx);

    // 4. Dibujar al Elfo Baterista Animado
    this.drawElfDrummer(ctx);

    // 5. Dibujar la Barra de Secuencia / Estado
    this.drawSequenceBar(ctx);

    // 6. Dibujar los 3 Tambores Taiko Interactivos
    this.drawDrums(ctx);
  }

  /**
   * Dibuja el marco y escenario del teatro de juguetes
   */
  private drawStage(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Plataforma de madera lustrada del elfo
    const stageY = this.elfY + 95 * this.elfScale;
    const stageW = Math.min(this.width * 0.85, 420);
    const stageH = 26;
    const stageX = (this.width - stageW) / 2;

    const woodGrad = ctx.createLinearGradient(stageX, 0, stageX + stageW, 0);
    woodGrad.addColorStop(0, "#5C2C16");
    woodGrad.addColorStop(0.5, "#8D4925");
    woodGrad.addColorStop(1, "#5C2C16");
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(stageX, stageY, stageW, stageH, [12, 12, 6, 6]);
    ctx.fill();

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Dibuja al personaje del Elfo Baterista (Stylized Fantasy Art)
   */
  private drawElfDrummer(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.elfX, this.elfY);
    ctx.scale(this.elfScale, this.elfScale);

    const bounce = Math.sin(this.elfBouncePhase) * 4;

    // Sombra del elfo en el escenario
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 92, 55, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo / Chaquetilla Verde Navideña
    ctx.fillStyle = "#27AE60";
    ctx.beginPath();
    ctx.roundRect(-28, 20 + bounce, 56, 50, [18, 18, 8, 8]);
    ctx.fill();
    ctx.strokeStyle = "#1E8449";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cinturón rojo con hebilla dorada
    ctx.fillStyle = "#C0392B";
    ctx.fillRect(-28, 48 + bounce, 56, 12);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-8, 46 + bounce, 16, 16);
    ctx.fillStyle = "#07111E";
    ctx.fillRect(-4, 50 + bounce, 8, 8);

    // Botones dorados
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, 32 + bounce, 4, 0, Math.PI * 2);
    ctx.arc(0, 42 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cuello de bufanda festiva roja y blanca
    ctx.fillStyle = "#E74C3C";
    ctx.beginPath();
    ctx.ellipse(0, 20 + bounce, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza del Elfo
    ctx.fillStyle = "#FFDFC4";
    ctx.beginPath();
    ctx.arc(0, -6 + bounce, 28, 0, Math.PI * 2);
    ctx.fill();

    // Orejas puntiagudas de elfo
    ctx.fillStyle = "#FFDFC4";
    // Oreja izquierda
    ctx.beginPath();
    ctx.moveTo(-24, -8 + bounce);
    ctx.lineTo(-44, -18 + bounce);
    ctx.lineTo(-24, 4 + bounce);
    ctx.closePath();
    ctx.fill();
    // Oreja derecha
    ctx.beginPath();
    ctx.moveTo(24, -8 + bounce);
    ctx.lineTo(44, -18 + bounce);
    ctx.lineTo(24, 4 + bounce);
    ctx.closePath();
    ctx.fill();

    // Ojos expresivos
    ctx.fillStyle = "#07111E";
    if (this.elfAnimState === "cheer") {
      // Ojos sonrientes cerrados ^ ^
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#07111E";
      ctx.beginPath();
      ctx.arc(-10, -8 + bounce, 6, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, -8 + bounce, 6, Math.PI, 0);
      ctx.stroke();
    } else if (this.elfAnimState === "confused") {
      // Ojos en espiral / confundidos
      ctx.font = "900 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", 0, -42 + bounce);
      ctx.beginPath();
      ctx.arc(-10, -6 + bounce, 4, 0, Math.PI * 2);
      ctx.arc(10, -6 + bounce, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ojos grandes animados
      ctx.beginPath();
      ctx.ellipse(-10, -6 + bounce, 5, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(10, -6 + bounce, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brillo blanco en pupilas
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(-12, -8 + bounce, 2.5, 0, Math.PI * 2);
      ctx.arc(8, -8 + bounce, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mejillas rosadas
    ctx.fillStyle = "rgba(255, 105, 180, 0.45)";
    ctx.beginPath();
    ctx.arc(-18, 3 + bounce, 7, 0, Math.PI * 2);
    ctx.arc(18, 3 + bounce, 7, 0, Math.PI * 2);
    ctx.fill();

    // Boca sonriente
    ctx.strokeStyle = "#C0392B";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 3 + bounce, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Gorro Navideño Rojo con pompón y cascabel
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.moveTo(-28, -20 + bounce);
    ctx.quadraticCurveTo(0, -60 + bounce, 35, -50 + bounce);
    ctx.lineTo(26, -18 + bounce);
    ctx.closePath();
    ctx.fill();

    // Borde blanco de borrego del gorro
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(-30, -26 + bounce, 60, 12, [6]);
    ctx.fill();

    // Cascabel dorado en la punta del gorro
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(36, -50 + bounce, 7, 0, Math.PI * 2);
    ctx.fill();

    // Brazos y Baquetas de Bastón de Caramelo
    this.drawElfDrumsticks(ctx, bounce);

    ctx.restore();
  }

  /**
   * Dibuja los brazos y baquetas de bastón de caramelo según la animación
   */
  private drawElfDrumsticks(ctx: CanvasRenderingContext2D, bounce: number): void {
    ctx.save();
    
    let leftStickAngle = -0.4;
    let rightStickAngle = 0.4;

    if (this.elfAnimState === "hit_left") {
      leftStickAngle = 0.8; // Brazo izquierdo abajo golpeando
      rightStickAngle = -0.6;
    } else if (this.elfAnimState === "hit_center") {
      leftStickAngle = 0.5;
      rightStickAngle = -0.5;
    } else if (this.elfAnimState === "hit_right") {
      leftStickAngle = -0.6;
      rightStickAngle = 0.8; // Brazo derecho abajo golpeando
    } else if (this.elfAnimState === "cheer") {
      leftStickAngle = -1.4; // Brazos arriba festejando
      rightStickAngle = 1.4;
    }

    // Brazo y Baqueta Izquierda
    ctx.save();
    ctx.translate(-26, 32 + bounce);
    ctx.rotate(leftStickAngle);
    // Manga verde
    ctx.fillStyle = "#27AE60";
    ctx.fillRect(-6, -6, 12, 24);
    // Mano piel
    ctx.fillStyle = "#FFDFC4";
    ctx.beginPath();
    ctx.arc(0, 20, 6, 0, Math.PI * 2);
    ctx.fill();
    // Baqueta de caramelo (rayas rojas y blancas)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 48);
    ctx.stroke();
    ctx.strokeStyle = "#E74C3C";
    ctx.lineWidth = 5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    // Punta de goma de la baqueta
    ctx.setLineDash([]);
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, 50, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Brazo y Baqueta Derecha
    ctx.save();
    ctx.translate(26, 32 + bounce);
    ctx.rotate(rightStickAngle);
    // Manga verde
    ctx.fillStyle = "#27AE60";
    ctx.fillRect(-6, -6, 12, 24);
    // Mano piel
    ctx.fillStyle = "#FFDFC4";
    ctx.beginPath();
    ctx.arc(0, 20, 6, 0, Math.PI * 2);
    ctx.fill();
    // Baqueta de caramelo
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 48);
    ctx.stroke();
    ctx.strokeStyle = "#E74C3C";
    ctx.lineWidth = 5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    // Punta dorada
    ctx.setLineDash([]);
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, 50, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Barra visual de Estado y Secuencia de Notas rítmicas
   */
  private drawSequenceBar(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const barW = Math.min(this.width * 0.92, 480);
    const barH = 50;
    const barX = (this.width - barW) / 2;
    const barY = Math.max(76, this.height * 0.12);

    // Fondo translúcido con borde dorado
    ctx.fillStyle = "rgba(7, 17, 30, 0.85)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 16);
    ctx.fill();

    const isElfTurn = this.turnState === "elf_turn";
    ctx.strokeStyle = isElfTurn ? "#F39C12" : "#2ECC71";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Título del Turno actual
    const titleText = isElfTurn
      ? "🧝 ¡MIRA Y ESCUCHA AL ELFO!"
      : "🎯 ¡TU TURNO! REPITE EL RITMO";
    
    ctx.font = "900 13px 'Outfit', sans-serif";
    ctx.fillStyle = isElfTurn ? "#F39C12" : "#2ECC71";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(titleText, this.width / 2, barY + 6);

    // Notas de la secuencia representadas en la barra
    const totalNotes = this.sequence.length;
    const noteSpacing = Math.min(34, (barW - 40) / Math.max(1, totalNotes));
    const startX = this.width / 2 - ((totalNotes - 1) * noteSpacing) / 2;
    const noteY = barY + 33;

    for (let i = 0; i < totalNotes; i++) {
      const drumId = this.sequence[i];
      const nx = startX + i * noteSpacing;
      const isPast = isElfTurn ? i < this.elfStepIndex : i < this.playerStep;
      const isCurrent = isElfTurn ? i === this.elfStepIndex - 1 : i === this.playerStep;

      const color = drumId === 0 ? "#E74C3C" : (drumId === 1 ? "#F1C40F" : "#3498DB");
      
      ctx.fillStyle = isPast ? color : "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(nx, noteY, isCurrent ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      if (isCurrent) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Dibuja los 3 Tambores Taiko Interactivos (Stylized Concept Art)
   */
  private drawDrums(ctx: CanvasRenderingContext2D): void {
    for (const drum of this.drums) {
      ctx.save();
      ctx.translate(drum.x, drum.y);
      ctx.scale(drum.pressScale, drum.pressScale);

      const r = drum.radius;

      // 1. Sombra base del tambor
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, r * 0.92, r * 0.95, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Cuerpo de madera tallada del tambor (Cilindro 3D estilizado)
      const woodGrad = ctx.createLinearGradient(-r, 0, r, 0);
      woodGrad.addColorStop(0, "#4A2311");
      woodGrad.addColorStop(0.3, "#78391A");
      woodGrad.addColorStop(0.7, "#8D4420");
      woodGrad.addColorStop(1, "#4A2311");
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(-r, -r * 0.3, r * 2, r * 1.3, [16, 16, 24, 24]);
      ctx.fill();

      // Tachuelas doradas de latón en el cuerpo del tambor
      ctx.fillStyle = "#FFD700";
      const studCount = 7;
      for (let s = 0; s < studCount; s++) {
        const sx = -r * 0.75 + (s * (r * 1.5)) / (studCount - 1);
        ctx.beginPath();
        ctx.arc(sx, r * 0.45, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Aro exterior del tambor (Rim)
      const rimGrad = ctx.createRadialGradient(0, -r * 0.2, r * 0.6, 0, -r * 0.2, r);
      rimGrad.addColorStop(0, "#D5D8DC");
      rimGrad.addColorStop(0.8, "#566573");
      rimGrad.addColorStop(1, "#2C3E50");
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = drum.primaryColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // 4. Membrana / Parche interior del tambor
      const skinGrad = ctx.createRadialGradient(0, -r * 0.1, r * 0.1, 0, -r * 0.1, r * 0.84);
      if (drum.isPressed) {
        skinGrad.addColorStop(0, "#FFFFFF");
        skinGrad.addColorStop(0.6, drum.primaryColor);
        skinGrad.addColorStop(1, drum.accentColor);
      } else {
        skinGrad.addColorStop(0, "#FFFFFF");
        skinGrad.addColorStop(0.7, "#EAECEE");
        skinGrad.addColorStop(1, "#BDC3C7");
      }
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.84, 0, Math.PI * 2);
      ctx.fill();

      // 5. Emblema central del parche (Símbolo Taiko / Estrella)
      ctx.fillStyle = drum.primaryColor;
      if (drum.id === 1) {
        // Estrella dorada de 5 puntas en el tambor central
        ctx.save();
        ctx.translate(0, -r * 0.1);
        ctx.beginPath();
        const starR = r * 0.38;
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * starR, -Math.sin((18 + i * 72) * Math.PI / 180) * starR);
          ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (starR * 0.45), -Math.sin((54 + i * 72) * Math.PI / 180) * (starR * 0.45));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // Círculo concéntrico estilizado Taiko
        ctx.beginPath();
        ctx.arc(0, -r * 0.1, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Etiquetas de texto
      ctx.font = "900 15px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(drum.label, 0, r * 0.72);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(drum.label, 0, r * 0.72);

      ctx.restore();
    }
  }

  /**
   * Barra de estado superior (HUD) con 5 Campanas Doradas de vida
   */
  protected override drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const isNarrow = this.width < 460;
    const hudH = Math.max(44, Math.min(68, this.height * 0.075));
    const paddingX = Math.max(12, this.width * 0.035);

    // Barra superior sólida translúcida
    ctx.fillStyle = "rgba(4, 14, 26, 0.90)";
    ctx.fillRect(0, 0, this.width, hudH);

    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, hudH);
    ctx.lineTo(this.width, hudH);
    ctx.stroke();

    const fontMain = isNarrow ? Math.max(13, this.width * 0.038) : Math.max(15, Math.min(24, this.width * 0.036));
    const fontSub = isNarrow ? Math.max(10, this.width * 0.028) : Math.max(12, Math.min(18, this.width * 0.028));
    const textY = hudH * 0.52;

    // 1. PUNTOS & COMBO (Izquierda)
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontMain}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`${this.score.toLocaleString()} PTS`, paddingX, textY);

    if (this.comboCount >= 2) {
      ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
      ctx.fillStyle = "#00E5FF";
      ctx.fillText(` (${this.comboCount} COMBO!)`, paddingX + ctx.measureText(`${this.score.toLocaleString()} PTS`).width + 4, textY);
    }

    // 2. 5 CAMPANAS DE VIDA (Centro)
    const bellSize = isNarrow ? 15 : 19;
    const bellGap = isNarrow ? 3 : 6;
    const totalBellsW = this.maxLives * bellSize + (this.maxLives - 1) * bellGap;
    const bellsStartX = (this.width / 2) - totalBellsW / 2;

    for (let i = 0; i < this.maxLives; i++) {
      const bx = bellsStartX + i * (bellSize + bellGap) + bellSize / 2;
      const by = textY;
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

    // 3. RONDA ACTUAL / TIEMPO (Derecha)
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText(`RONDA ${this.currentRound}/${this.maxRounds}`, this.width - paddingX, textY);

    ctx.restore();
  }
}
