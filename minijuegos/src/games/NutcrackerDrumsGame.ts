/**
 * ==============================================================================
 * JUEGO 3: TAMBORES DEL CASCANUECES (Nutcracker Elf Taiko Drummer) — EDICIÓN ARCADE
 * ==============================================================================
 * 
 * MECÁNICA TAIKO CALL & RESPONSE (Estilo Taiko no Tatsujin):
 * - Estilo visual: Stylized 2D Fantasy Game Concept Art.
 * - Fase 1 ("¡TURNO DEL ELFO! 🧝🥁"): Elfo baterista del Cascanueces en un
 *   escenario teatral con reflectores, tocando ritmos con baquetas festivas.
 * - Fase 2 ("¡TU TURNO! 🎯✨"): El jugador repite la secuencia en los 3 tambores táctiles:
 *     1. 🔴 Tambor Rojo (DON - Grave / Centro con golpe potente)
 *     2. 🟡 Tambor Dorado (STAR - Platillo / Cascabel Festivo Mágico)
 *     3. 🔵 Tambor Azul (KA - Agudo / Aro Metálico Crystalline)
 * - Rondas progresivas, combos con modo fiebre 🔥, efectos de shockwave,
 *   notas musicales voladoras 🎵, confeti, iluminación teatral y música del Cascanueces.
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
  keyLabel: string;
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

interface DrumRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface MusicalNoteFx {
  x: number;
  y: number;
  vx: number;
  vy: number;
  symbol: string;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
}

export class NutcrackerDrumsGame extends BaseGame {
  // Estado del juego
  private drums: DrumPad[] = [];
  private sequence: number[] = [];
  private playerStep: number = 0;
  private currentRound: number = 1;
  private maxRounds: number = 10;
  
  // Turnos: 'elf_turn' | 'player_turn' | 'round_success' | 'round_fail'
  private turnState: "elf_turn" | "player_turn" | "round_success" | "round_fail" = "elf_turn";
  private stateTimer: number = 0;
  
  // Reproducción de la demo del elfo
  private elfStepIndex: number = 0;
  private elfBeatTimer: number = 0;
  private elfBeatInterval: number = 0.55;
  
  // Posición y animación del Elfo
  private elfX: number = 0;
  private elfY: number = 0;
  private elfScale: number = 1.0;
  private elfAnimState: "idle" | "hit_left" | "hit_center" | "hit_right" | "cheer" | "confused" = "idle";
  private elfAnimTimer: number = 0;
  private elfBouncePhase: number = 0;
  private elfJumpOffset: number = 0;
  private elfLeanAngle: number = 0;

  // Bocadillo de diálogo / Expresión del Elfo
  private speechBubbleText: string = "¡Hola! 🥁";
  private speechBubbleTimer: number = 2.0;

  // Combo y Multiplicador
  private comboCount: number = 0;
  private maxCombo: number = 0;

  // Efectos visuales de impacto y notas musicales
  private ripples: DrumRipple[] = [];
  private musicalNotes: MusicalNoteFx[] = [];

  // Sprites
  private bgRoom: HTMLImageElement;
  private elfSprite: HTMLImageElement;

  // Teclado
  private prevKeyStates: Record<string, boolean> = {};

  // Tiempo global de animación
  private globalTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "tree-melody",
      "Tambores del Cascanueces",
      "¡Mira al elfo tocar el ritmo y repite exactamente su secuencia en los tambores mágicos!",
      canvas,
      input,
      audio,
      particles
    );

    this.showLives = false;

    // Música festiva del Cascanueces (Tchaikovsky: Dance of the Sugar Plum Fairy)
    this.inGameMusicPath = "./assets/audio/Dance of the Sugar Plum Fairy.mp3";
    this.inGameMusicVolume = 0.32;

    // Carga de Sprites de alta definición reutilizando caché
    this.bgRoom = this.getImage("./assets/images/fondo-habitacion.webp");
    this.elfSprite = this.getImage("./assets/images/elfo-baterista.webp");
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.layoutElements();
  }

  private getSequenceBarLayout(): { x: number; y: number; w: number; h: number; titleY: number; noteY: number; fontSize: number } {
    const isShort = this.height < 520;
    const hudH = isShort
      ? Math.max(36, Math.min(48, this.height * 0.10))
      : Math.max(44, Math.min(68, this.height * 0.075));
    
    const w = Math.min(this.width * 0.94, 520);
    const h = isShort ? 44 : Math.min(62, this.height * 0.095);
    const x = (this.width - w) / 2;
    const y = hudH + (isShort ? 2 : Math.max(6, this.height * 0.012));
    const titleY = y + (isShort ? 3 : 6);
    const noteY = y + h * 0.68;
    const fontSize = isShort ? 11 : 13;
    return { x, y, w, h, titleY, noteY, fontSize };
  }

  private layoutElements(): void {
    const cx = this.width / 2;
    const isShort = this.height < 520;
    const bar = this.getSequenceBarLayout();

    // Tamaño y separación de los 3 tambores táctiles (área ergonómica inferior)
    const drumRadius = Math.max(36, Math.min(82, Math.min(this.width * 0.135, this.height * 0.135)));
    const drumSpacing = Math.min(this.width * 0.31, drumRadius * 2.45);
    const drumY = this.height - drumRadius - (isShort ? 12 : Math.max(18, this.height * 0.045));

    // Posición de tambores táctiles
    const starDrumY = drumY - Math.max(8, drumRadius * 0.18);
    const starDrumTop = starDrumY - drumRadius * 1.12;

    // Posición del Elfo: centrado en el espacio libre entre la barra de secuencia y los tambores
    this.elfX = cx;
    const stageTop = bar.y + bar.h + 10;
    const availableMidH = Math.max(80, (starDrumTop - 10) - stageTop);
    
    // Escala del elfo ajustada para que quepa perfectamente
    const baseScale = Math.min(this.width / 460, availableMidH / 230);
    this.elfScale = Math.max(0.46, Math.min(1.08, baseScale));
    this.elfY = stageTop + availableMidH * 0.45;

    this.drums = [
      {
        id: 0,
        name: "DON",
        label: "DON",
        subLabel: "GRAVE",
        keyLabel: "[ 1 / D ]",
        x: cx - drumSpacing,
        y: drumY,
        radius: drumRadius,
        primaryColor: "#FF2A4D",
        accentColor: "#990022",
        glowColor: "rgba(255, 42, 77, 0.75)",
        isPressed: false,
        pressScale: 1.0,
        lastHitTime: 0
      },
      {
        id: 1,
        name: "STAR",
        label: "STAR",
        subLabel: "MÁGICO",
        keyLabel: "[ 2 / F ]",
        x: cx,
        y: drumY - Math.max(8, drumRadius * 0.18), // Ligeramente elevado
        radius: drumRadius * 1.12,
        primaryColor: "#FFD700",
        accentColor: "#B78A00",
        glowColor: "rgba(255, 215, 0, 0.85)",
        isPressed: false,
        pressScale: 1.0,
        lastHitTime: 0
      },
      {
        id: 2,
        name: "KA",
        label: "KA",
        subLabel: "AGUDO",
        keyLabel: "[ 3 / J ]",
        x: cx + drumSpacing,
        y: drumY,
        radius: drumRadius,
        primaryColor: "#00E5FF",
        accentColor: "#007799",
        glowColor: "rgba(0, 229, 255, 0.75)",
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
    this.showLives = false;
    this.timeRemaining = 45;
    this.elfAnimState = "idle";
    this.elfBouncePhase = 0;
    this.elfJumpOffset = 0;
    this.elfLeanAngle = 0;
    this.ripples = [];
    this.musicalNotes = [];
    this.prevKeyStates = {};
    this.setSpeech("¡Atento al ritmo! 🥁", 2.2);

    // Toque táctil con radio extendido
    this.input.onTap = (x: number, y: number) => {
      if (this.turnState !== "player_turn" || this.isGameOver || !this.isRunning) return;

      for (const drum of this.drums) {
        const dx = x - drum.x;
        const dy = y - drum.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= drum.radius * 1.45) {
          this.onPlayerHitDrum(drum.id);
          break;
        }
      }
    };

    this.startRound(1);
  }

  private setSpeech(text: string, duration: number = 2.0): void {
    this.speechBubbleText = text;
    this.speechBubbleTimer = duration;
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

    // Generar secuencia rítmica incremental (de 3 a 7 notas)
    const beatsCount = Math.min(8, 2 + round);
    this.sequence = [];
    for (let i = 0; i < beatsCount; i++) {
      // 50% DON (0), 30% KA (2), 20% STAR DORADO (1)
      const rand = Math.random();
      if (rand < 0.50) {
        this.sequence.push(0);
      } else if (rand < 0.80) {
        this.sequence.push(2);
      } else {
        this.sequence.push(1);
      }
    }

    // Intervalo de tiempo dinámico según ronda
    this.elfBeatInterval = Math.max(0.40, 0.65 - round * 0.025);
    this.elfBeatTimer = 0.7; // Pausa antes de que el elfo empiece
    this.elfAnimState = "idle";
    this.setSpeech(`¡Ronda ${round}! Escucha 🥁`, 1.8);
  }

  protected onUpdate(dt: number): void {
    this.globalTime += dt;
    this.elfBouncePhase += dt * 5.5;

    // Temporizador de bocadillo de diálogo
    if (this.speechBubbleTimer > 0) {
      this.speechBubbleTimer -= dt;
    }

    // Animación de lean y salto del elfo
    this.elfAnimTimer -= dt;
    if (this.elfAnimTimer <= 0 && this.turnState !== "round_success" && this.turnState !== "round_fail") {
      this.elfAnimState = "idle";
      this.elfLeanAngle *= 0.85;
      this.elfJumpOffset *= 0.85;
    } else if (this.elfAnimState === "cheer") {
      this.elfJumpOffset = Math.sin(this.globalTime * 12) * 16;
    }

    // Amortiguación suave de escala de tambores (Squash & Stretch con spring)
    for (const drum of this.drums) {
      if (drum.pressScale > 1.0) {
        drum.pressScale = Math.max(1.0, drum.pressScale - dt * 3.8);
      }
    }

    // Actualizar ondas expansivas (ripples)
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += dt * (rip.maxRadius * 2.8);
      rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
      if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // Actualizar notas musicales voladoras
    for (let i = this.musicalNotes.length - 1; i >= 0; i--) {
      const note = this.musicalNotes[i];
      note.life += dt;
      note.x += note.vx * dt * 60;
      note.y += note.vy * dt * 60;
      note.vy += 0.04; // Gravedad suave
      note.rotation += note.vRot * dt;
      note.alpha = Math.max(0, 1 - note.life / note.maxLife);
      if (note.life >= note.maxLife) {
        this.musicalNotes.splice(i, 1);
      }
    }

    // Soporte teclado: [1, 2, 3] o [D, F, J]
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
          // Elfo termina su demo -> Turno del jugador
          this.turnState = "player_turn";
          this.playerStep = 0;
          this.elfAnimState = "idle";
          this.setSpeech("¡Tu turno! ¡Dale! 🎯", 2.2);
          this.addFloatingText("¡TU TURNO! ✨", this.width / 2, this.height * 0.50, "#00E676", 1.4);
          Haptics.medium();
        }
      }
    } else if (this.turnState === "round_success") {
      this.stateTimer += dt;
      if (this.stateTimer >= 1.3) {
        if (this.currentRound >= this.maxRounds) {
          this.endGame();
        } else {
          this.startRound(this.currentRound + 1);
        }
      }
    } else if (this.turnState === "round_fail") {
      this.stateTimer += dt;
      if (this.stateTimer >= 1.2) {
        // Repetir la ronda para que el jugador lo logre
        this.startRound(this.currentRound);
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

    drum.pressScale = 1.24;
    drum.lastHitTime = performance.now();

    // Efecto de inclinación y sonido
    if (drumId === 0) {
      this.audio.playDrumDon();
      this.elfAnimState = "hit_left";
      this.elfLeanAngle = -0.18;
    } else if (drumId === 1) {
      this.audio.playDrumGold();
      this.elfAnimState = "hit_center";
      this.elfLeanAngle = 0.0;
      this.elfJumpOffset = -8;
    } else {
      this.audio.playDrumKa();
      this.elfAnimState = "hit_right";
      this.elfLeanAngle = 0.18;
    }
    this.elfAnimTimer = this.elfBeatInterval * 0.75;

    // Onda expansiva en el tambor del elfo y en el tambor inferior
    this.spawnRipple(drum.x, drum.y, drum.primaryColor, drum.radius * 1.5);
    this.spawnMusicalNotes(drum.x, drum.y - drum.radius * 0.4, drum.primaryColor, 3);
    this.particles.emitBurst(drum.x, drum.y - drum.radius * 0.4, drum.primaryColor, 12);
  }

  /**
   * Ejecuta la evaluación del golpe del jugador
   */
  private onPlayerHitDrum(drumId: number): void {
    const drum = this.drums[drumId];
    if (!drum) return;

    drum.pressScale = 1.28;
    drum.lastHitTime = performance.now();

    const expectedDrumId = this.sequence[this.playerStep];

    if (drumId === expectedDrumId) {
      // ¡ACIERTO RÍTMICO!
      if (drumId === 0) this.audio.playDrumDon();
      else if (drumId === 1) this.audio.playDrumGold();
      else this.audio.playDrumKa();

      this.comboCount++;
      if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

      const baseScore = drumId === 1 ? 250 : 150;
      const mult = this.comboCount >= 10 ? 4 : (this.comboCount >= 6 ? 3 : (this.comboCount >= 3 ? 2 : 1));
      const pointsEarned = baseScore * mult;
      this.addScore(pointsEarned);

      // Micro-temblor de impacto táctil
      this.triggerShake(0.08, 3.5);

      // Efectos visuales de acierto
      this.spawnRipple(drum.x, drum.y, drum.primaryColor, drum.radius * 1.7);
      this.spawnMusicalNotes(drum.x, drum.y - drum.radius * 0.5, drum.primaryColor, 4);
      this.particles.emitBurst(drum.x, drum.y, drum.primaryColor, 16);

      const rating = mult >= 3 ? "¡FIESTA! 🔥" : (drumId === 1 ? "¡PERFECTO! ⭐" : "¡GENIAL! 🎵");
      this.addFloatingText(`${rating} +${pointsEarned}`, drum.x, drum.y - drum.radius * 1.2, drum.primaryColor, 1.25);

      this.playerStep++;

      // Reacción del elfo al golpe correcto
      if (drumId === 0) this.elfLeanAngle = -0.12;
      else if (drumId === 2) this.elfLeanAngle = 0.12;
      this.elfAnimTimer = 0.25;

      // ¿Completó toda la secuencia?
      if (this.playerStep >= this.sequence.length) {
        this.turnState = "round_success";
        this.stateTimer = 0;
        this.elfAnimState = "cheer";
        this.setSpeech("¡INCREÍBLE! 🌟🎉", 2.0);
        this.audio.playVictory();
        Haptics.celebration();

        // Bonus de tiempo +3.5s
        this.timeRemaining = Math.min(60, this.timeRemaining + 3.5);

        const roundBonus = this.currentRound * 600;
        this.addScore(roundBonus);

        // Explosión de confeti festivo y estrellas
        this.particles.emitConfetti(this.width, 50);
        this.particles.emitBurst(this.width / 2, this.height * 0.42, "#FFD700", 40);
        this.addFloatingText(`¡RONDA ${this.currentRound} SUPERADA! (+${roundBonus})`, this.width / 2, this.height * 0.45, "#00E5FF", 1.45);
        this.addFloatingText("+3.5s TIEMPO EXTRA ⏱️", this.width / 2, this.height * 0.52, "#00E676", 1.35);
      }
    } else {
      // ¡FALLO DE RITMO!
      this.audio.playDrumMiss();
      this.triggerShake(0.28, 9);
      this.comboCount = 0;

      this.turnState = "round_fail";
      this.stateTimer = 0;
      this.elfAnimState = "confused";
      this.setSpeech("¡Casi! ¡Otra vez! 😅", 2.0);

      this.spawnRipple(drum.x, drum.y, "#FF1744", drum.radius * 1.6);
      this.particles.emitBurst(drum.x, drum.y, "#FF1744", 22);
      this.addFloatingText("¡RITMO FALLIDO!", this.width / 2, this.height * 0.50, "#FF1744", 1.35);
    }
  }

  private spawnRipple(x: number, y: number, color: string, maxRadius: number): void {
    if (this.ripples.length > 15) this.ripples.shift();
    this.ripples.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 0.9,
      lineWidth: 4
    });
  }

  private spawnMusicalNotes(x: number, y: number, color: string, count: number = 3): void {
    const symbols = ["🎵", "🎶", "⭐", "✨", "🥁"];
    for (let i = 0; i < count; i++) {
      if (this.musicalNotes.length > 30) this.musicalNotes.shift();
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 1.8 + Math.random() * 3.5;
      this.musicalNotes.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        color,
        size: 16 + Math.random() * 12,
        alpha: 1.0,
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 2.5,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4
      });
    }
  }

  // =========================================================================
  // RENDERIZADO VISUAL TEATRAL (Stylized 2D Fantasy Art)
  // =========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo de la Habitación Navideña Cálida
    if (this.bgRoom && this.bgRoom.complete && this.bgRoom.naturalWidth > 0) {
      ctx.drawImage(this.bgRoom, 0, 0, this.width, this.height);
      // Tinte nocturno atmosférico para resaltar escenario y reflectores
      ctx.fillStyle = "rgba(6, 12, 28, 0.60)";
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#0D1B2A");
      grad.addColorStop(1, "#050811");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Reflectores teatrales y luces de ambientación
    this.drawTheatricalSpotlights(ctx);

    // 3. Partículas mágicas de fondo
    this.particles.draw(ctx, true);

    // 4. Ondas expansivas de impacto (ripples)
    this.drawRipples(ctx);

    // 5. Escenario y Telón Festivo del Cascanueces
    this.drawStage(ctx);

    // 6. Elfo Baterista Animado
    this.drawElfDrummer(ctx);

    // 7. Notas musicales voladoras
    this.drawMusicalNotes(ctx);

    // 8. Barra de Secuencia / Marquee de Ritmo
    this.drawSequenceBar(ctx);

    // 9. Los 3 Tambores Taiko Interactivos
    this.drawDrums(ctx);

    // 10. Partículas de primer plano
    this.particles.draw(ctx, false);
  }

  /**
   * Dibuja conos de luz teatrales que iluminan al elfo y al escenario
   */
  private drawTheatricalSpotlights(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const pulse = 0.85 + Math.sin(this.globalTime * 3.5) * 0.15;

    // Reflector 1: Ámbar / Dorado sobre el elfo
    const gradElf = ctx.createRadialGradient(
      this.elfX, this.elfY - 40, 10,
      this.elfX, this.elfY, Math.max(160, 260 * this.elfScale)
    );
    gradElf.addColorStop(0, `rgba(255, 215, 0, ${0.30 * pulse})`);
    gradElf.addColorStop(0.5, `rgba(255, 140, 0, ${0.12 * pulse})`);
    gradElf.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradElf;
    ctx.beginPath();
    ctx.arc(this.elfX, this.elfY, Math.max(160, 260 * this.elfScale), 0, Math.PI * 2);
    ctx.fill();

    // Reflector cónico desde arriba a la izquierda
    ctx.beginPath();
    ctx.moveTo(this.width * 0.15, 0);
    ctx.lineTo(this.elfX - 120 * this.elfScale, this.elfY + 120 * this.elfScale);
    ctx.lineTo(this.elfX + 120 * this.elfScale, this.elfY + 120 * this.elfScale);
    ctx.closePath();
    const coneGrad = ctx.createLinearGradient(0, 0, this.elfX, this.elfY);
    coneGrad.addColorStop(0, "rgba(255, 230, 150, 0.22)");
    coneGrad.addColorStop(1, "rgba(255, 230, 150, 0.02)");
    ctx.fillStyle = coneGrad;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dibuja ondas de choque sonoras
   */
  private drawRipples(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const rip of this.ripples) {
      ctx.strokeStyle = rip.color;
      ctx.globalAlpha = rip.alpha;
      ctx.lineWidth = rip.lineWidth;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Dibuja notas musicales y símbolos voladores
   */
  private drawMusicalNotes(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const note of this.musicalNotes) {
      ctx.save();
      ctx.translate(note.x, note.y);
      ctx.rotate(note.rotation);
      ctx.globalAlpha = note.alpha;
      ctx.font = `bold ${note.size}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = note.color;
      ctx.fillText(note.symbol, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Dibuja el Escenario Teatral con molduras doradas y luces de candilejas
   */
  private drawStage(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Plataforma de madera lustrada
    const stageY = this.elfY + 98 * this.elfScale;
    const stageW = Math.min(this.width * 0.90, 480);
    const stageH = Math.max(22, 28 * this.elfScale);
    const stageX = (this.width - stageW) / 2;

    // Sombra proyectada del estrado
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.ellipse(this.width / 2, stageY + stageH + 6, stageW * 0.52, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Superficie de madera de roble lustrado con degradado cálido
    const woodGrad = ctx.createLinearGradient(stageX, stageY, stageX, stageY + stageH);
    woodGrad.addColorStop(0, "#8D4925");
    woodGrad.addColorStop(0.3, "#AA5A2C");
    woodGrad.addColorStop(0.7, "#6E3518");
    woodGrad.addColorStop(1, "#3D1C0B");
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(stageX, stageY, stageW, stageH, [14, 14, 8, 8]);
    ctx.fill();

    // Borde biselado superior dorado
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Alfombra roja central sobre el escenario
    const rugW = stageW * 0.70;
    const rugX = (this.width - rugW) / 2;
    const rugGrad = ctx.createLinearGradient(rugX, stageY, rugX + rugW, stageY);
    rugGrad.addColorStop(0, "#C0392B");
    rugGrad.addColorStop(0.5, "#E74C3C");
    rugGrad.addColorStop(1, "#C0392B");
    ctx.fillStyle = rugGrad;
    ctx.fillRect(rugX, stageY, rugW, 5);

    // Candilejas / Bombillas doradas del borde del escenario
    const bulbCount = 9;
    const bulbPulse = 0.8 + Math.sin(this.globalTime * 6) * 0.2;
    for (let i = 0; i < bulbCount; i++) {
      const bx = stageX + 16 + (i * (stageW - 32)) / (bulbCount - 1);
      const by = stageY + stageH - 4;
      
      // Resplandor de la bombilla
      ctx.fillStyle = `rgba(255, 215, 0, ${0.45 * bulbPulse})`;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();

      // Centro brillante
      ctx.fillStyle = "#FFF9C4";
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Telones festivos superiores en las esquinas
    this.drawFestiveCurtains(ctx);

    ctx.restore();
  }

  /**
   * Dibuja los telones de terciopelo rojo en las esquinas superiores
   */
  private drawFestiveCurtains(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const curtainW = Math.min(this.width * 0.18, 120);
    const curtainH = Math.min(this.height * 0.22, 130);

    // Telón izquierdo
    const gradL = ctx.createLinearGradient(0, 0, curtainW, curtainH);
    gradL.addColorStop(0, "#99001A");
    gradL.addColorStop(0.6, "#7A0014");
    gradL.addColorStop(1, "#4D000D");
    ctx.fillStyle = gradL;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(curtainW, 0);
    ctx.quadraticCurveTo(curtainW * 0.4, curtainH * 0.5, 0, curtainH);
    ctx.closePath();
    ctx.fill();

    // Borde dorado con borlas
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Telón derecho
    const gradR = ctx.createLinearGradient(this.width, 0, this.width - curtainW, curtainH);
    gradR.addColorStop(0, "#99001A");
    gradR.addColorStop(0.6, "#7A0014");
    gradR.addColorStop(1, "#4D000D");
    ctx.fillStyle = gradR;
    ctx.beginPath();
    ctx.moveTo(this.width, 0);
    ctx.lineTo(this.width - curtainW, 0);
    ctx.quadraticCurveTo(this.width - curtainW * 0.4, curtainH * 0.5, this.width, curtainH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Dibuja al personaje del Elfo Baterista (Sprite 2D de alta calidad + Animación)
   */
  private drawElfDrummer(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const bounce = Math.sin(this.elfBouncePhase) * 5;
    const drawX = this.elfX;
    const drawY = this.elfY + bounce + this.elfJumpOffset;

    ctx.translate(drawX, drawY);
    ctx.rotate(this.elfLeanAngle);

    // Sombra del elfo en el escenario
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 96 * this.elfScale - bounce * 0.5, 60 * this.elfScale, 14 * this.elfScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Si el sprite de alta definición está disponible, renderizarlo con efectos
    if (this.elfSprite && this.elfSprite.complete && this.elfSprite.naturalWidth > 0) {
      const spriteW = 240 * this.elfScale;
      const spriteH = 240 * this.elfScale;

      // Resplandor de victoria o aura de combo
      if (this.turnState === "round_success") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255, 215, 0, 0.45)";
        ctx.beginPath();
        ctx.arc(0, 0, spriteW * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.drawImage(this.elfSprite, -spriteW / 2, -spriteH * 0.62, spriteW, spriteH);

      // Efecto de impacto en el tambor del elfo cuando golpea
      if (this.elfAnimState !== "idle" && this.elfAnimTimer > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const hitColor = this.elfAnimState === "hit_left" ? "#FF2A4D" : (this.elfAnimState === "hit_center" ? "#FFD700" : "#00E5FF");
        ctx.fillStyle = hitColor;
        ctx.beginPath();
        ctx.arc(10 * this.elfScale, 30 * this.elfScale, 32 * this.elfScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Fallback vectorial estilizado
      this.drawFallbackElf(ctx, bounce);
    }

    // Estrellas mareadas si falló
    if (this.turnState === "round_fail") {
      this.drawDizzyStars(ctx);
    }

    // Bocadillo de diálogo del Elfo
    this.drawSpeechBubble(ctx);

    ctx.restore();
  }

  /**
   * Estrellas de mareo en la cabeza si falló
   */
  private drawDizzyStars(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const starY = -120 * this.elfScale;
    const angle = this.globalTime * 8;
    for (let i = 0; i < 3; i++) {
      const a = angle + (i * Math.PI * 2) / 3;
      const sx = Math.cos(a) * 36 * this.elfScale;
      const sy = starY + Math.sin(a) * 12 * this.elfScale;
      ctx.font = `${Math.round(18 * this.elfScale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFD700";
      ctx.fillText("⭐", sx, sy);
    }
    ctx.restore();
  }

  /**
   * Bocadillo de diálogo animado del Elfo
   */
  private drawSpeechBubble(ctx: CanvasRenderingContext2D): void {
    if (this.speechBubbleTimer <= 0 || !this.speechBubbleText) return;

    ctx.save();
    const bubbleX = 110 * this.elfScale;
    const bubbleY = -55 * this.elfScale;
    
    ctx.font = "bold 13px 'Outfit', sans-serif";
    const textWidth = ctx.measureText(this.speechBubbleText).width;
    const padX = 14;
    const padY = 8;
    const bw = textWidth + padX * 2;
    const bh = 14 + padY * 2;

    // Fondo del bocadillo blanco con sombra
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(bubbleX - bw / 2 + 2, bubbleY - bh / 2 + 3, bw, bh, 14);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(bubbleX - bw / 2, bubbleY - bh / 2, bw, bh, 14);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pico del bocadillo hacia el elfo (hacia la izquierda)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(bubbleX - bw / 2 + 1, bubbleY);
    ctx.lineTo(bubbleX - bw / 2 - 12, bubbleY - 4);
    ctx.lineTo(bubbleX - bw / 2 + 1, bubbleY + 10);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0A192F";
    ctx.fillText(this.speechBubbleText, bubbleX, bubbleY);

    ctx.restore();
  }

  /**
   * Renderizado vectorial de fallback por si la imagen tarda en cargar
   */
  private drawFallbackElf(ctx: CanvasRenderingContext2D, bounce: number): void {
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.roundRect(-30, 0 + bounce, 60, 65, [14]);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cabeza
    ctx.fillStyle = "#FFDFC4";
    ctx.beginPath();
    ctx.arc(0, -20 + bounce, 30, 0, Math.PI * 2);
    ctx.fill();

    // Gorro
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.moveTo(-30, -32 + bounce);
    ctx.lineTo(0, -75 + bounce);
    ctx.lineTo(30, -32 + bounce);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Cartel Marquee Rítmico ("¡MIRA AL ELFO!" vs "¡TU TURNO!")
   */
  private drawSequenceBar(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const { x: barX, y: barY, w: barW, h: barH, titleY, noteY, fontSize } = this.getSequenceBarLayout();

    const isElfTurn = this.turnState === "elf_turn";

    // 1. Marco exterior con iluminación de bombillas de marquesina
    ctx.fillStyle = "rgba(4, 12, 24, 0.92)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 16);
    ctx.fill();

    const frameColor = isElfTurn ? "#F39C12" : "#2ECC71";
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Bombillas perimetrales animadas
    const bulbCount = 14;
    const bulbPhase = this.globalTime * 8;
    for (let i = 0; i < bulbCount; i++) {
      const bx = barX + 14 + (i * (barW - 28)) / (bulbCount - 1);
      const isLit = Math.sin(bulbPhase + i * 0.8) > 0;
      ctx.fillStyle = isLit ? (isElfTurn ? "#FFD700" : "#A7F3D0") : "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(bx, barY + 4, 3, 0, Math.PI * 2);
      ctx.arc(bx, barY + barH - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Título de la Fase
    const titleText = isElfTurn
      ? "🥁 ¡MIRA Y ESCUCHA EL RITMO! 🎶"
      : "🎯 ¡TU TURNO! ¡REPITE EL RITMO! ✨";
    
    ctx.font = `900 ${fontSize}px 'Outfit', sans-serif`;
    ctx.fillStyle = isElfTurn ? "#FFD700" : "#00E676";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(titleText, this.width / 2, titleY);

    // 3. Tokens Rítmicos en la Marquesina (Grandes, brillantes y claros)
    const totalNotes = this.sequence.length;
    const tokenSpacing = Math.min(48, (barW - 50) / Math.max(1, totalNotes));
    const startX = this.width / 2 - ((totalNotes - 1) * tokenSpacing) / 2;

    for (let i = 0; i < totalNotes; i++) {
      const drumId = this.sequence[i];
      const nx = startX + i * tokenSpacing;
      
      const isPast = isElfTurn ? i < this.elfStepIndex : i < this.playerStep;
      const isCurrent = isElfTurn ? i === this.elfStepIndex - 1 : i === this.playerStep;

      const baseColor = drumId === 0 ? "#FF2A4D" : (drumId === 1 ? "#FFD700" : "#00E5FF");
      const label = drumId === 0 ? "DON" : (drumId === 1 ? "★" : "KA");

      // Tamaño de la chapa
      let radius = isCurrent ? 13 : 10;
      if (isCurrent && isElfTurn) {
        radius += Math.sin(this.globalTime * 12) * 2;
      }

      // Resplandor del elemento actual
      if (isCurrent) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(this.globalTime * 10) * 0.2})`;
        ctx.beginPath();
        ctx.arc(nx, noteY, radius + 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fondo de la ficha
      ctx.fillStyle = isPast ? (isElfTurn ? baseColor : "#2ECC71") : (isCurrent ? baseColor : "rgba(255, 255, 255, 0.20)");
      ctx.beginPath();
      ctx.arc(nx, noteY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isCurrent ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = isCurrent ? 2.5 : 1.5;
      ctx.stroke();

      // Símbolo o etiqueta dentro de la chapa
      ctx.font = `900 ${radius > 11 ? 10 : 8}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isPast || isCurrent ? (drumId === 1 ? "#0A192F" : "#FFFFFF") : "rgba(255, 255, 255, 0.6)";
      
      // Si el jugador ya lo acertó con éxito, mostrar checkmark
      if (!isElfTurn && isPast) {
        ctx.fillText("✓", nx, noteY);
      } else {
        ctx.fillText(label, nx, noteY);
      }
    }

    ctx.restore();
  }

  /**
   * Dibuja los 3 Tambores Taiko Interactivos con estética 3D Stylized
   */
  private drawDrums(ctx: CanvasRenderingContext2D): void {
    for (const drum of this.drums) {
      ctx.save();
      ctx.translate(drum.x, drum.y);
      ctx.scale(drum.pressScale, drum.pressScale);

      const r = drum.radius;

      // 1. Aura de modo racha / combo ardiente 🔥
      if (this.comboCount >= 3) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const auraPulse = 0.5 + Math.sin(this.globalTime * 8 + drum.id) * 0.3;
        ctx.fillStyle = drum.glowColor;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.35 * auraPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Sombra base proyectada en el piso
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.ellipse(0, r * 0.95, r * 1.05, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Cuerpo cilíndrico de madera tallada (Perspectiva 3D)
      const woodGrad = ctx.createLinearGradient(-r, 0, r, 0);
      if (drum.id === 0) {
        // DON: Caoba / Cerezo rojizo festivo
        woodGrad.addColorStop(0, "#4D000D");
        woodGrad.addColorStop(0.3, "#99001A");
        woodGrad.addColorStop(0.7, "#CC1133");
        woodGrad.addColorStop(1, "#4D000D");
      } else if (drum.id === 1) {
        // STAR: Latón Dorado Metálico
        woodGrad.addColorStop(0, "#735100");
        woodGrad.addColorStop(0.3, "#D4AC0D");
        woodGrad.addColorStop(0.7, "#F1C40F");
        woodGrad.addColorStop(1, "#735100");
      } else {
        // KA: Zafiro / Cobre Crystalline
        woodGrad.addColorStop(0, "#0B3050");
        woodGrad.addColorStop(0.3, "#1E6091");
        woodGrad.addColorStop(0.7, "#2980B9");
        woodGrad.addColorStop(1, "#0B3050");
      }

      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(-r, -r * 0.25, r * 2, r * 1.25, [18, 18, 28, 28]);
      ctx.fill();

      // Cuerdas doradas en forma de rombo / diamantes (Estilo Taiko tradicional)
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      const points = [-r * 0.8, -r * 0.4, 0, r * 0.4, r * 0.8];
      for (let p = 0; p < points.length - 1; p++) {
        ctx.moveTo(points[p], -r * 0.2);
        ctx.lineTo(points[p] + (points[p + 1] - points[p]) / 2, r * 0.6);
        ctx.lineTo(points[p + 1], -r * 0.2);
      }
      ctx.stroke();

      // Tachuelas doradas de fijación
      ctx.fillStyle = "#FFF9C4";
      for (let p = 0; p < points.length; p++) {
        ctx.beginPath();
        ctx.arc(points[p], r * 0.65, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Aro exterior del tambor (Rim pulido)
      const rimGrad = ctx.createRadialGradient(0, -r * 0.15, r * 0.6, 0, -r * 0.15, r);
      rimGrad.addColorStop(0, "#FFFFFF");
      rimGrad.addColorStop(0.5, "#D5D8DC");
      rimGrad.addColorStop(1, "#2C3E50");
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.12, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = drum.primaryColor;
      ctx.lineWidth = 4.0;
      ctx.stroke();

      // 5. Parche interior del tambor (Membrana con textura)
      const skinGrad = ctx.createRadialGradient(0, -r * 0.12, r * 0.1, 0, -r * 0.12, r * 0.84);
      if (drum.isPressed || performance.now() - drum.lastHitTime < 90) {
        skinGrad.addColorStop(0, "#FFFFFF");
        skinGrad.addColorStop(0.5, drum.primaryColor);
        skinGrad.addColorStop(1, drum.accentColor);
      } else {
        skinGrad.addColorStop(0, "#FFFFFF");
        skinGrad.addColorStop(0.65, "#F8F9FA");
        skinGrad.addColorStop(1, "#D0D7DE");
      }
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(0, -r * 0.12, r * 0.84, 0, Math.PI * 2);
      ctx.fill();

      // 6. Emblema central del tambor
      ctx.fillStyle = drum.primaryColor;
      if (drum.id === 1) {
        // Estrella dorada de 5 puntas con halo
        ctx.save();
        ctx.translate(0, -r * 0.12);
        ctx.beginPath();
        const starR = r * 0.42;
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * starR, -Math.sin((18 + i * 72) * Math.PI / 180) * starR);
          ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (starR * 0.45), -Math.sin((54 + i * 72) * Math.PI / 180) * (starR * 0.45));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // Espiral / Círculo sagrado Taiko
        ctx.beginPath();
        ctx.arc(0, -r * 0.12, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        // Círculo interior blanco
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, -r * 0.12, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Placa de texto de alto impacto Arcade
      ctx.font = `900 ${Math.max(14, r * 0.34)}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(drum.label, 0, r * 0.70);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(drum.label, 0, r * 0.70);

      // Subetiqueta de tecla
      ctx.font = `700 ${Math.max(10, r * 0.20)}px 'Outfit', sans-serif`;
      ctx.fillStyle = "#FFD700";
      ctx.fillText(drum.keyLabel, 0, r * 0.94);

      ctx.restore();
    }
  }

  /**
   * Barra de estado superior (HUD) con Puntos, Tiempo Restante y Combo
   */
  protected override drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const isNarrow = this.width < 460;
    const isShort = this.height < 500;
    const hudH = Math.round(isShort
      ? Math.max(40, Math.min(52, this.height * 0.11))
      : Math.max(48, Math.min(62, this.height * 0.080)));

    // 1. BARRA BASE SUPERIOR: Opaca al 100%
    const hudGrad = ctx.createLinearGradient(0, 0, 0, hudH);
    hudGrad.addColorStop(0, "#132438");
    hudGrad.addColorStop(0.7, "#0A1422");
    hudGrad.addColorStop(1, "#050B13");
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, this.width, hudH);

    // Ribete de madera caoba + filete de oro noble
    ctx.fillStyle = "#3D1C06";
    ctx.fillRect(0, hudH - 3, this.width, 3);
    ctx.fillStyle = "#F1C40F";
    ctx.fillRect(0, hudH - 1.5, this.width, 1.5);

    const fontMain = Math.round(isShort
      ? (isNarrow ? Math.max(11, this.width * 0.033) : Math.max(13, Math.min(18, this.height * 0.045)))
      : (isNarrow ? Math.max(12, this.width * 0.034) : Math.max(14, Math.min(20, this.width * 0.030))));
    const fontSub = Math.round(isShort
      ? (isNarrow ? Math.max(8.5, this.width * 0.024) : Math.max(9.5, Math.min(13, this.height * 0.034)))
      : (isNarrow ? Math.max(9, this.width * 0.025) : Math.max(10, Math.min(13, this.width * 0.024))));

    const paddingX = Math.round(Math.max(6, this.width * 0.02));
    const plaqueH = Math.round(isShort ? 28 : 34);
    const plaqueY = Math.round((hudH - plaqueH) / 2);

    // 2. PLACA DE PUNTUACIÓN & COMBO (Izquierda)
    const scoreStr = `${this.score.toLocaleString()} PTS`;
    ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    const scoreTextW = ctx.measureText(scoreStr).width;
    const comboStr = this.comboCount >= 2 ? ` ${this.comboCount}x` : "";
    const comboTextW = comboStr ? ctx.measureText(comboStr).width + 6 : 0;
    const scorePlaqueW = Math.round(scoreTextW + comboTextW + (isNarrow ? 32 : 46));
    const scorePlaqueX = paddingX;

    // Fondo de placa de puntuación
    ctx.save();
    const scorePlaqueGrad = ctx.createLinearGradient(scorePlaqueX, plaqueY, scorePlaqueX, plaqueY + plaqueH);
    scorePlaqueGrad.addColorStop(0, "rgba(30, 41, 59, 0.95)");
    scorePlaqueGrad.addColorStop(1, "rgba(15, 23, 42, 0.98)");
    ctx.fillStyle = scorePlaqueGrad;
    ctx.beginPath();
    ctx.roundRect(scorePlaqueX, plaqueY, scorePlaqueW, plaqueH, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 215, 0, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Estrella / Medallón
    const starRadius = Math.round(Math.min(plaqueH * 0.34, 12));
    const starX = scorePlaqueX + starRadius + 6;
    const starY = plaqueY + plaqueH / 2;
    
    // Dibujo de estrella
    ctx.save();
    ctx.translate(starX, starY);
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? starRadius : starRadius * 0.44;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Texto de puntuación con sombra nítida
    ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillText(scoreStr, starX + starRadius + 4 + 1, plaqueY + plaqueH / 2 + 1);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(scoreStr, starX + starRadius + 4, plaqueY + plaqueH / 2);

    if (this.comboCount >= 2) {
      ctx.fillStyle = this.comboCount >= 5 ? "#F43F5E" : "#38BDF8";
      ctx.font = `900 ${fontSub * 1.1}px 'Titan One', cursive, sans-serif`;
      ctx.fillText(comboStr, starX + starRadius + 4 + scoreTextW + 4, plaqueY + plaqueH / 2);
    }
    ctx.restore();

    // 3. TIEMPO RESTANTE (Centro)
    let timeFormatted: string;
    if (this.timeRemaining >= 60) {
      const mins = Math.floor(this.timeRemaining / 60);
      const secs = Math.floor(this.timeRemaining % 60);
      timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeFormatted = `${Math.ceil(this.timeRemaining)}s`;
    }

    const isUrgent = this.timeRemaining < 10;
    const clockIconR = Math.round(Math.min(plaqueH * 0.28, 10));
    ctx.font = `900 ${fontMain * 0.95}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    const timeTextW = ctx.measureText(timeFormatted).width;
    const clockW = Math.round(timeTextW + clockIconR * 2 + (isNarrow ? 14 : 18));
    const clockX = Math.round((this.width - clockW) / 2);

    ctx.save();
    ctx.fillStyle = isUrgent ? "rgba(127, 29, 29, 0.70)" : "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(clockX, plaqueY, clockW, plaqueH, 8);
    ctx.fill();
    ctx.strokeStyle = isUrgent ? "#EF4444" : "rgba(255, 215, 0, 0.35)";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Icono de reloj vectorial
    const clockIconX = clockX + clockIconR + 5;
    const clockIconY = plaqueY + plaqueH / 2;
    ctx.fillStyle = isUrgent ? "#7F1D1D" : "#1E293B";
    ctx.beginPath();
    ctx.arc(clockIconX, clockIconY, clockIconR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isUrgent ? "#EF4444" : "#CBD5E1";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = isUrgent ? "#FCA5A5" : "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(clockIconX, clockIconY);
    ctx.lineTo(clockIconX, clockIconY - clockIconR * 0.55);
    ctx.moveTo(clockIconX, clockIconY);
    ctx.lineTo(clockIconX + clockIconR * 0.4, clockIconY);
    ctx.stroke();

    ctx.font = `900 ${fontMain * 0.95}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillText(timeFormatted, clockIconX + clockIconR + 4 + 1, plaqueY + plaqueH / 2 + 1);
    ctx.fillStyle = isUrgent ? "#FF4D4D" : "#FFFFFF";
    ctx.fillText(timeFormatted, clockIconX + clockIconR + 4, plaqueY + plaqueH / 2);
    ctx.restore();

    // 4. RONDA ACTUAL (Derecha - Placa Esmeralda)
    const roundLabel = `RONDA ${this.currentRound}`;
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    const roundTextW = ctx.measureText(roundLabel).width;
    const roundPlaqueW = Math.round(roundTextW + (isNarrow ? 14 : 20));
    const roundPlaqueX = Math.round(this.width - paddingX - roundPlaqueW);

    ctx.save();
    ctx.fillStyle = "rgba(6, 78, 59, 0.65)";
    ctx.beginPath();
    ctx.roundRect(roundPlaqueX, plaqueY, roundPlaqueW, plaqueH, 8);
    ctx.fill();
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.font = `900 ${fontSub * 1.05}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.fillStyle = "#A7F3D0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(roundLabel, roundPlaqueX + roundPlaqueW / 2, plaqueY + plaqueH / 2);
    ctx.restore();

    ctx.restore();
  }

  public override destroy(): void {
    super.destroy();
    this.sequence = [];
    this.ripples = [];
    this.musicalNotes = [];
    this.drums.forEach((d) => {
      d.isPressed = false;
    });
  }
}
