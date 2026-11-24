/**
 * ==============================================================================
 * SISTEMA DE PARTÍCULAS LIGERO Y OPTIMIZADO (Objetivo 60 FPS)
 * ==============================================================================
 * 
 * Genera efectos visuales mágicos con consumo mínimo de CPU:
 * - Nieve ambiental multinivel (primer plano y fondo).
 * - Touch Magic Trail (estela de chispas y polvo de hadas al deslizar el dedo).
 * - Estallido de chispas y estrellas al atrapar regalos.
 * - Confeti festivo multicolor para celebraciones y récords.
 * - Ráfagas de tormenta de nieve para la transición cinemática inicial.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: "snow" | "spark" | "confetti" | "star" | "speedline";
  rotation?: number;
  vRot?: number;
  layer?: "front" | "back";
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private snowFlakes: Particle[] = [];

  constructor(width: number, height: number) {
    this.initSnow(width, height);
  }

  /**
   * Inicializa la nieve ambiente multinivel (Desactivada para ultra-rendimiento en kiosco)
   */
  public initSnow(_width: number, _height: number): void {
    // 0 copos de nieve para garantizar 60 FPS estables sin carga de GPU Mali-G52
    this.snowFlakes = [];
  }

  /**
   * Estela táctil mágica (Touch Magic Trail)
   */
  public emitTouchTrail(x: number, y: number, count: number = 3): void {
    // Limitar partículas totales activas a 120 para no saturar memoria
    if (true) return; // Estela del cursor desactivada permanentemente

    const colors = ["#FFD700", "#FFF9C4", "#FFFFFF", "#FF80AB", "#00E5FF"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.4, // Suave caída
        size: 2.5 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        type: Math.random() > 0.4 ? "star" : "spark"
      });
    }
  }

  /**
   * Genera una explosión mínima de chispas en una posición (x, y) - Reducida para kiosco
   */
  public emitBurst(x: number, y: number, color: string = "#FFD700", count: number = 4): void {
    if (this.particles.length > 20) return;
    const finalCount = Math.min(count, 4);
    for (let i = 0; i < finalCount; i++) {
      const angle = (Math.PI * 2 * i) / finalCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 15 + Math.random() * 10,
        type: "spark"
      });
    }
  }

  /**
   * Genera una explosión ligera de confeti multicolor para celebraciones
   */
  public emitConfetti(width: number, count: number = 6): void {
    if (this.particles.length > 20) return;
    const finalCount = Math.min(count, 6);
    const colors = ["#FF416C", "#FFD700", "#2ECC71", "#00E5FF"];
    for (let i = 0; i < finalCount; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        size: 5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        life: 0,
        maxLife: 40 + Math.random() * 20,
        type: "confetti",
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1
      });
    }
  }

  /**
   * Actualiza la posición y ciclo de vida de todas las partículas
   */
  public update(width: number, height: number): void {
    // 1. Actualizar Nieve ambiental multinivel
    for (const flake of this.snowFlakes) {
      flake.y += flake.vy;
      flake.x += flake.vx + Math.sin(flake.y * 0.02) * (flake.layer === "front" ? 0.7 : 0.3);

      if (flake.y > height) {
        flake.y = -10;
        flake.x = Math.random() * width;
      }
      if (flake.x < 0) flake.x = width;
      if (flake.x > width) flake.x = 0;
    }

    // 2. Actualizar Partículas dinámicas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === "confetti") {
        p.vy += 0.06;
        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot;
        }
      } else {
        p.vx *= 0.94;
        p.vy *= 0.94;
      }

      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Dibuja todas las partículas en el Canvas con renderizado por lotes (Batch Rendering)
   */
  public draw(ctx: CanvasRenderingContext2D, renderSnow: boolean = false): void {
    if (this.particles.length === 0 && (!renderSnow || this.snowFlakes.length === 0)) return;
    ctx.save();

    // 1. Dibujar nieve por lotes (1 solo fill para todas las partículas)
    if (renderSnow && this.snowFlakes.length > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      for (const flake of this.snowFlakes) {
        ctx.moveTo(flake.x + flake.size, flake.y);
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 2. Dibujar partículas dinámicas
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.type === "star") {
        // Micro-estrella rápida
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
  }
}
