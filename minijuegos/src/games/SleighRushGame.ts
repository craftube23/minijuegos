/**
 * ==============================================================================
 * JUEGO 2: 🛷 EL VUELO DEL TRINEO MÁGICO (Sleigh Magic Rush)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El trineo mágico de Santa vuela hacia arriba a través de la noche estrellada.
 * - Hay 3 carriles táctiles gigantes (Izquierda, Centro, Derecha).
 * - Toca el carril deseado para mover el trineo al instante.
 * - Recoge estrellas mágicas y regalos flotantes.
 * - Esquiva chimeneas altas, nubes de tormenta y pinos nevados.
 * - Atraviesa los "Portales de la Feria" con el Logo 2 para obtener Turbo e Invulnerabilidad.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface SleighObstacle {
  lane: number; // 0: Izquierda, 1: Centro, 2: Derecha
  y: number;
  type: "chimney" | "cloud" | "tree";
  size: number;
  passed: boolean;
}

interface SleighCollectible {
  lane: number;
  y: number;
  type: "star" | "toy_box" | "fair_portal";
  points: number;
  passed: boolean;
  rotation: number;
}

export class SleighRushGame extends BaseGame {
  // Carriles (3 carriles centrados en la pantalla)
  private readonly laneCount: number = 3;
  private laneWidth: number = 280;
  private currentLane: number = 1; // Empieza en el carril central
  private targetLaneX: number = 540;
  private currentSleighX: number = 540;
  private sleighY: number = 1200;

  // Velocidad de avance
  private worldSpeed: number = 550; // Píxeles por segundo
  private turboTimer: number = 0;

  // Listas de obstáculos y coleccionables
  private obstacles: SleighObstacle[] = [];
  private collectibles: SleighCollectible[] = [];
  private spawnTimer: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "sleigh-rush",
      "🛷 El Vuelo del Trineo Mágico",
      "¡Toca los 3 carriles para esquivar obstáculos y volar a través de los portales mágicos!",
      canvas,
      input,
      audio,
      particles
    );
  }

  private updateLaneDimensions(): void {
    this.laneWidth = Math.min(280, Math.max(90, this.width / 3.4));
    this.sleighY = this.height - 160;
  }

  private getLaneCenterX(lane: number): number {
    const totalW = this.laneCount * this.laneWidth;
    const startX = (this.width - totalW) / 2;
    return startX + lane * this.laneWidth + this.laneWidth / 2;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.updateLaneDimensions();
    this.targetLaneX = this.getLaneCenterX(this.currentLane);
    this.currentSleighX = this.targetLaneX;
  }

  protected onStart(): void {
    this.updateLaneDimensions();
    this.currentLane = 1;
    this.targetLaneX = this.getLaneCenterX(1);
    this.currentSleighX = this.targetLaneX;
    this.worldSpeed = 550;
    this.turboTimer = 0;
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
  }

  protected onUpdate(dt: number): void {
    // 1. Manejo del Turbo de la Feria
    if (this.turboTimer > 0) {
      this.turboTimer -= dt;
      this.worldSpeed = 900;
    } else {
      this.worldSpeed = 550 + (45 - this.timeRemaining) * 4;
    }

    // 2. Control Táctil por Carriles
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown) {
      // Determinar carril tocado
      const totalW = this.laneCount * this.laneWidth;
      const startX = (this.width - totalW) / 2;
      const relX = pointer.x - startX;

      if (relX >= 0 && relX < totalW) {
        const touchedLane = Math.floor(relX / this.laneWidth);
        if (touchedLane >= 0 && touchedLane < 3 && touchedLane !== this.currentLane) {
          this.currentLane = touchedLane;
          this.audio.playTap();
        }
      }
    }

    // Soporte teclado PC
    if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
      if (this.currentLane > 0) {
        this.currentLane--;
        this.audio.playTap();
      }
    }
    if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      if (this.currentLane < 2) {
        this.currentLane++;
        this.audio.playTap();
      }
    }

    // Suavizado del movimiento horizontal del trineo
    this.targetLaneX = this.getLaneCenterX(this.currentLane);
    this.currentSleighX += (this.targetLaneX - this.currentSleighX) * 18 * dt;

    // 3. Generación continua de obstáculos y premios
    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.75) {
      this.spawnTimer = 0;
      this.spawnRow();
    }

    // 4. Mover y colisionar obstáculos
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.worldSpeed * dt;

      // Comprobar colisión con el trineo
      if (!obs.passed && Math.abs(obs.y - this.sleighY) < 70 && obs.lane === this.currentLane) {
        obs.passed = true;
        if (this.turboTimer <= 0) {
          // Si no tiene turbo, choca
          this.addScore(-100);
          this.audio.playError();
          this.particles.emitBurst(this.currentSleighX, this.sleighY, "#FF416C", 15);
        } else {
          // Con turbo destruye el obstáculo
          this.addScore(200);
          this.audio.playCatchItem();
          this.particles.emitBurst(this.currentSleighX, this.sleighY, "#FFD700", 20);
        }
      }

      if (obs.y > this.height + 100) {
        this.obstacles.splice(i, 1);
      }
    }

    // 5. Mover y recolectar coleccionables
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.y += this.worldSpeed * dt;
      col.rotation += 3 * dt;

      if (!col.passed && Math.abs(col.y - this.sleighY) < 70 && col.lane === this.currentLane) {
        col.passed = true;
        if (col.type === "fair_portal") {
          this.addScore(col.points);
          this.turboTimer = 5.0; // 5 segundos de turbo
          this.triggerLogoPowerUp(2, 5); // Logo 2
        } else {
          this.addScore(col.points);
          this.audio.playCatchItem();
          this.particles.emitBurst(this.getLaneCenterX(col.lane), col.y, "#FFD700", 12);
        }
        this.collectibles.splice(i, 1);
        continue;
      }

      if (col.y > this.height + 100) {
        this.collectibles.splice(i, 1);
      }
    }

    // Puntos por avanzar continuamente
    this.addScore(Math.floor(dt * 30));
  }

  private spawnRow(): void {
    const laneRoll = Math.floor(Math.random() * 3);
    const itemRoll = Math.random();

    if (itemRoll < 0.15) {
      // Portal de la Feria Mágica (Logo 2)
      this.collectibles.push({
        lane: laneRoll,
        y: -100,
        type: "fair_portal",
        points: 400,
        passed: false,
        rotation: 0
      });
    } else if (itemRoll < 0.50) {
      // Coleccionables (Estrellas / Juguetes)
      this.collectibles.push({
        lane: laneRoll,
        y: -100,
        type: itemRoll < 0.35 ? "star" : "toy_box",
        points: 150,
        passed: false,
        rotation: 0
      });
    } else {
      // Obstáculos
      const types: SleighObstacle["type"][] = ["chimney", "cloud", "tree"];
      this.obstacles.push({
        lane: laneRoll,
        y: -100,
        type: types[Math.floor(Math.random() * types.length)],
        size: 70,
        passed: false
      });
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Cielo nocturno con auroras
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, "#030A1C");
    skyGrad.addColorStop(0.5, "#0D1B2A");
    skyGrad.addColorStop(1, "#1B263B");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Líneas y pistas de los 3 Carriles
    const totalW = this.laneCount * this.laneWidth;
    const startX = (this.width - totalW) / 2;

    for (let i = 0; i < this.laneCount; i++) {
      const lx = startX + i * this.laneWidth;
      // Fondo sutil del carril
      ctx.fillStyle = i === this.currentLane ? "rgba(255, 215, 0, 0.08)" : "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(lx, 0, this.laneWidth, this.height);

      // Separadores punteados de nieve
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Borde derecho del último carril
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX + totalW, 0);
    ctx.lineTo(startX + totalW, this.height);
    ctx.stroke();

    // 3. Dibujar Obstáculos
    for (const obs of this.obstacles) {
      const cx = this.getLaneCenterX(obs.lane);
      ctx.save();
      ctx.translate(cx, obs.y);

      ctx.font = "65px 'Segoe UI Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (obs.type === "chimney") {
        ctx.fillText("🏠", 0, 0);
      } else if (obs.type === "cloud") {
        ctx.fillText("⚡", 0, 0);
      } else {
        ctx.fillText("🌲", 0, 0);
      }
      ctx.restore();
    }

    // 4. Dibujar Coleccionables y Portales
    for (const col of this.collectibles) {
      const cx = this.getLaneCenterX(col.lane);
      ctx.save();
      ctx.translate(cx, col.y);

      if (col.type === "fair_portal") {
        // Portal brillante con Logo 2
        ctx.fillStyle = "rgba(46, 204, 113, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#2ECC71";
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 22px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚡ TURBO", 0, -10);
        ctx.fillText("FERIA", 0, 16);
      } else {
        ctx.rotate(col.rotation);
        ctx.font = "55px 'Segoe UI Emoji', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(col.type === "star" ? "⭐" : "🎁", 0, 0);
      }
      ctx.restore();
    }

    // 5. Dibujar el Trineo Mágico de Santa
    ctx.save();
    ctx.translate(this.currentSleighX, this.sleighY);

    if (this.turboTimer > 0) {
      // Efecto de aura turbo
      ctx.fillStyle = "rgba(46, 204, 113, 0.4)";
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trineo / Reno
    ctx.font = "80px 'Segoe UI Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🛷", 0, 0);

    ctx.restore();

    // 6. Botones táctiles indicativos en la parte inferior de los carriles
    for (let i = 0; i < 3; i++) {
      const cx = this.getLaneCenterX(i);
      ctx.fillStyle = i === this.currentLane ? "#FFD700" : "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(cx, this.height - 40, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
