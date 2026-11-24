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
   * Inicializa la nieve ambiente multinivel (24 copos ligeros de alto rendimiento a 60 FPS)
   */
  public initSnow(width: number, height: number): void {
    const flakeCount = 24;
    this.snowFlakes = [];
    for (let i = 0; i < flakeCount; i++) {
      const isFront = i % 3 === 0;
      this.snowFlakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: isFront ? 0.9 + Math.random() * 0.7 : 0.4 + Math.random() * 0.4,
        size: isFront ? 2.2 + Math.random() * 1.8 : 1.2 + Math.random() * 1.2,
        color: "rgba(255, 255, 255, 0.85)",
        alpha: isFront ? 0.85 : 0.5,
        life: 0,
        maxLife: 99999,
        type: "snow",
        layer: isFront ? "front" : "back"
      });
    }
  }

  /**
   * Estela táctil mágica (Touch Magic Trail) - ligera, suave y reactiva
   */
  public emitTouchTrail(x: number, y: number, count: number = 2): void {
    if (this.particles.length > 30) return;

    const colors = ["#FFD700", "#FFF9C4", "#FFFFFF", "#00E5FF"];
    const actualCount = Math.min(count, 2);
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.3,
        size: 2.0 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        life: 0,
        maxLife: 16 + Math.random() * 10,
        type: "star"
      });
    }
  }

  /**
   * Genera una explosión festiva de chispas en una posición (x, y)
   */
  public emitBurst(x: number, y: number, color: string = "#FFD700", count: number = 6): void {
    if (this.particles.length > 35) return;
    const finalCount = Math.min(count, 6);
    for (let i = 0; i < finalCount; i++) {
      const angle = (Math.PI * 2 * i) / finalCount + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2.5,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 18 + Math.random() * 10,
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
