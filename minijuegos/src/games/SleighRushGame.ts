/**
 * ==============================================================================
 * JUEGO 2: EL VUELO DEL TRINEO MÁGICO (Sleigh Magic Rush - Edición Pulida)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - El trineo mágico de Santa vuela a través de la noche estrellada.
 * - 3 Carriles táctiles gigantes interactivos (Izquierda, Centro, Derecha).
 * - Toca el carril deseado para mover el trineo suavemente con inercia.
 * - Recoge regalos de la Feria (sprites HD) y estrellas mágicas doradas.
 * - Esquiva chimeneas nevadas, nubes de tormenta y pinos navideños.
 * - Sistema de 3 Vidas con temblor de pantalla (Screen Shake) y textos flotantes.
 * - Atraviesa los Portales de la Feria con el Logo oficial para activar Super Turbo e Invulnerabilidad.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";

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
  type: "star" | "toy_red" | "toy_green" | "fair_portal";
  points: number;
  passed: boolean;
  rotation: number;
}

export class SleighRushGame extends BaseGame {
  // Carriles (3 carriles táctiles centrados)
  private readonly laneCount: number = 3;
  private laneWidth: number = 280;
  private currentLane: number = 1;
  private targetLaneX: number = 540;
  private currentSleighX: number = 540;
  private sleighY: number = 1200;
  private sleighTilt: number = 0;

  // Velocidad de avance y estado
  private worldSpeed: number = 550;
  private turboTimer: number = 0;

  // Sprites
  private giftRedImg: HTMLImageElement;
  private giftGreenImg: HTMLImageElement;
  private fairLogoImg: HTMLImageElement;

  // Listas de obstáculos y coleccionables
  private obstacles: SleighObstacle[] = [];
  private collectibles: SleighCollectible[] = [];
  private spawnTimer: number = 0;
  private trailTimer: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "sleigh-rush",
      "El Vuelo del Trineo Mágico",
      "¡Toca los 3 carriles para esquivar obstáculos y volar a través de los portales mágicos!",
      canvas,
      input,
      audio,
      particles
    );

    this.showLives = true;
    this.maxLives = 3;
    this.lives = 3;

    // Cargar sprites oficiales
    this.giftRedImg = new Image();
    this.giftRedImg.src = "/assets/images/regalo-rojo.png";

    this.giftGreenImg = new Image();
    this.giftGreenImg.src = "/assets/images/regalo-verde.png";

    this.fairLogoImg = new Image();
    this.fairLogoImg.src = BRANDING.getLogoPath(1);
  }

  private updateLaneDimensions(): void {
    this.laneWidth = Math.min(280, Math.max(90, this.width / 3.4));
    this.sleighY = this.height - 150;
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
    this.lives = this.maxLives;
  }

  protected onUpdate(dt: number): void {
    // 1. Manejo del Turbo de la Feria
    if (this.turboTimer > 0) {
      this.turboTimer -= dt;
      this.worldSpeed = 950;
      // Emisión de partículas de estela dorada
      this.trailTimer += dt;
      if (this.trailTimer > 0.05) {
        this.trailTimer = 0;
        this.particles.emitBurst(this.currentSleighX, this.sleighY + 30, "#FFD700", 6);
      }
    } else {
      this.worldSpeed = 550 + (45 - this.timeRemaining) * 4;
    }

    // 2. Control Táctil por Carriles
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown) {
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

    // Soporte teclado PC (Flechas o A/D)
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

    // Suavizado del movimiento horizontal con inercia e inclinación
    this.targetLaneX = this.getLaneCenterX(this.currentLane);
    const diffX = this.targetLaneX - this.currentSleighX;
    this.currentSleighX += diffX * 16 * dt;
    this.sleighTilt = (diffX / this.laneWidth) * 0.35;

    // 3. Generación continua de obstáculos y premios
    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.72) {
      this.spawnTimer = 0;
      this.spawnRow();
    }

    // 4. Mover y colisionar obstáculos
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.worldSpeed * dt;

      // Comprobar colisión con el trineo
      if (!obs.passed && Math.abs(obs.y - this.sleighY) < 65 && obs.lane === this.currentLane) {
        obs.passed = true;
        if (this.turboTimer <= 0) {
          // Si no tiene turbo, pierde vida y puntos
          this.lives--;
          this.addScore(-150);
          this.audio.playError();
          this.triggerShake(0.25, 8);
          this.addFloatingText("-1 VIDA", this.currentSleighX, this.sleighY - 45, "#FF1744", 1.25);
          this.particles.emitBurst(this.currentSleighX, this.sleighY, "#FF416C", 20);

          if (this.lives <= 0) {
            this.lives = 0;
            this.endGame();
          }
        } else {
          // Con turbo destruye el obstáculo con bonus
          this.addScore(250);
          this.audio.playCatchItem();
          this.addFloatingText("+250 IMPACTO", this.currentSleighX, this.sleighY - 40, "#FFD700", 1.15);
          this.particles.emitBurst(this.currentSleighX, this.sleighY, "#FFD700", 20);
        }
      }

      if (obs.y > this.height + 120) {
        this.obstacles.splice(i, 1);
      }
    }

    // 5. Mover y recolectar coleccionables
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.y += this.worldSpeed * dt;
      col.rotation += 2.5 * dt;

      if (!col.passed && Math.abs(col.y - this.sleighY) < 70 && col.lane === this.currentLane) {
        col.passed = true;
        if (col.type === "fair_portal") {
          this.addScore(col.points);
          this.turboTimer = 5.0; // 5 segundos de turbo
          this.triggerLogoPowerUp(1, 5);
          this.triggerShake(0.18, 5);
          this.addFloatingText("¡SUPER TURBO x2! +500", this.currentSleighX, this.sleighY - 50, "#FFD700", 1.3);
          this.particles.emitConfetti(this.width, 35);
        } else {
          this.addScore(col.points);
          this.audio.playCatchItem();
          this.addFloatingText(`+${col.points}`, this.currentSleighX, this.sleighY - 40, "#00E676");
          this.particles.emitBurst(this.getLaneCenterX(col.lane), col.y, "#FFD700", 14);
        }
        this.collectibles.splice(i, 1);
        continue;
      }

      if (col.y > this.height + 120) {
        this.collectibles.splice(i, 1);
      }
    }

    // Puntos por avanzar en el aire
    this.addScore(Math.floor(dt * 30));
  }

  private spawnRow(): void {
    const laneRoll = Math.floor(Math.random() * 3);
    const itemRoll = Math.random();

    if (itemRoll < 0.12) {
      // Portal de la Feria Mágica
      this.collectibles.push({
        lane: laneRoll,
        y: -100,
        type: "fair_portal",
        points: 500,
        passed: false,
        rotation: 0
      });
    } else if (itemRoll < 0.50) {
      // Coleccionables (Estrellas doradas o Regalos oficiales)
      const giftType = Math.random() < 0.5 ? "toy_red" : "toy_green";
      this.collectibles.push({
        lane: laneRoll,
        y: -100,
        type: itemRoll < 0.30 ? "star" : giftType,
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
        size: 75,
        passed: false
      });
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Cielo nocturno con auroras y nieve
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
      // Fondo sutil del carril activo
      ctx.fillStyle = i === this.currentLane ? "rgba(255, 215, 0, 0.09)" : "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(lx, 0, this.laneWidth, this.height);

      // Separadores punteados de nieve brillante
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Borde derecho
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX + totalW, 0);
    ctx.lineTo(startX + totalW, this.height);
    ctx.stroke();

    // 3. Dibujar Obstáculos Vectoriales Pulidos
    for (const obs of this.obstacles) {
      const cx = this.getLaneCenterX(obs.lane);
      ctx.save();
      ctx.translate(cx, obs.y);

      if (obs.type === "chimney") {
        // Chimenea con ladrillos y nieve en la cima
        ctx.fillStyle = "#A93226";
        ctx.fillRect(-32, -20, 64, 55);
        ctx.fillStyle = "#78281F";
        ctx.fillRect(-30, -5, 60, 4);
        ctx.fillRect(-30, 15, 60, 4);
        // Nieve en la chimenea
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(-36, -28, 72, 14, [6, 6, 4, 4]);
        ctx.fill();
      } else if (obs.type === "cloud") {
        // Nube de tormenta con rayos eléctricos
        ctx.fillStyle = "#34495E";
        ctx.beginPath();
        ctx.arc(-20, -5, 22, 0, Math.PI * 2);
        ctx.arc(10, -10, 28, 0, Math.PI * 2);
        ctx.arc(28, 5, 20, 0, Math.PI * 2);
        ctx.arc(0, 12, 22, 0, Math.PI * 2);
        ctx.fill();
        // Rayo central brillante
        ctx.fillStyle = "#F1C40F";
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-8, 5);
        ctx.lineTo(2, 5);
        ctx.lineTo(-5, 25);
        ctx.lineTo(12, 0);
        ctx.lineTo(2, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Pino navideño nevado con adornos
        ctx.fillStyle = "#1E8449";
        // 3 niveles triangulares
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(22, -10);
        ctx.lineTo(-22, -10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(30, 12);
        ctx.lineTo(-30, 12);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(38, 35);
        ctx.lineTo(-38, 35);
        ctx.closePath();
        ctx.fill();

        // Tronco
        ctx.fillStyle = "#6E2C00";
        ctx.fillRect(-8, 35, 16, 15);

        // Nieve en las puntas
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, -35, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Dibujar Coleccionables y Portales
    for (const col of this.collectibles) {
      const cx = this.getLaneCenterX(col.lane);
      ctx.save();
      ctx.translate(cx, col.y);

      if (col.type === "fair_portal") {
        // Portal mágico de la Feria con el logo oficial
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
        ctx.scale(pulse, pulse);

        // Anillo de energía exterior
        ctx.fillStyle = "rgba(46, 204, 113, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Logo oficial en el centro
        if (this.fairLogoImg.complete && this.fairLogoImg.naturalWidth > 0) {
          ctx.drawImage(this.fairLogoImg, -42, -42, 84, 84);
        } else {
          ctx.fillStyle = "#FFD700";
          ctx.font = "bold 16px 'Fredoka', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("TURBO", 0, 0);
        }
      } else if (col.type === "star") {
        // Estrella mágica dorada giratoria
        ctx.rotate(col.rotation);
        const starR = 26;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(angle) * starR;
          const py = Math.sin(angle) * starR;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#FFF385";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        // Regalo Sprite Oficial HD
        ctx.rotate(col.rotation * 0.5);
        const giftImg = col.type === "toy_red" ? this.giftRedImg : this.giftGreenImg;
        if (giftImg.complete && giftImg.naturalWidth > 0) {
          ctx.drawImage(giftImg, -28, -28, 56, 56);
        } else {
          ctx.fillStyle = col.type === "toy_red" ? "#E74C3C" : "#27AE60";
          ctx.fillRect(-22, -22, 44, 44);
        }
      }
      ctx.restore();
    }

    // 5. Dibujar el Trineo Mágico de Santa (Vectorial + Glow)
    ctx.save();
    ctx.translate(this.currentSleighX, this.sleighY);
    ctx.rotate(this.sleighTilt);

    if (this.turboTimer > 0) {
      // Aura dorada de super turbo
      ctx.fillStyle = "rgba(255, 215, 0, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, 75, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Patines dorados del trineo
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-45, 28);
    ctx.lineTo(35, 28);
    ctx.arc(38, 20, 8, Math.PI / 2, -Math.PI / 2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-35, 34);
    ctx.lineTo(40, 34);
    ctx.arc(44, 26, 8, Math.PI / 2, -Math.PI / 2, true);
    ctx.stroke();

    // Cuerpo del trineo rojo festivo
    ctx.fillStyle = "#C0392B";
    ctx.beginPath();
    ctx.moveTo(-40, 18);
    ctx.bezierCurveTo(-45, -10, -25, -25, 10, -25);
    ctx.bezierCurveTo(35, -25, 45, -5, 40, 18);
    ctx.closePath();
    ctx.fill();

    // Borde dorado
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Regalos cargados en el trineo
    if (this.giftRedImg.complete && this.giftRedImg.naturalWidth > 0) {
      ctx.drawImage(this.giftRedImg, -28, -38, 32, 32);
    }
    if (this.giftGreenImg.complete && this.giftGreenImg.naturalWidth > 0) {
      ctx.drawImage(this.giftGreenImg, -2, -42, 34, 34);
    }

    ctx.restore();

    // 6. Indicadores de toque táctil en los 3 carriles
    for (let i = 0; i < 3; i++) {
      const cx = this.getLaneCenterX(i);
      ctx.fillStyle = i === this.currentLane ? "#FFD700" : "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(cx, this.height - 35, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
