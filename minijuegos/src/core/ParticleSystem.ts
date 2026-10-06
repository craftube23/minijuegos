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
  private maxSnowFlakes: number = 42; // Control estricto de memoria

  constructor(width: number, height: number) {
    this.initSnow(width, height);
  }

  /**
   * Inicializa la nieve ambiente multinivel
   */
  public initSnow(width: number, height: number): void {
    this.snowFlakes = [];
    for (let i = 0; i < this.maxSnowFlakes; i++) {
      const isForeground = i % 3 === 0;
      this.snowFlakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isForeground ? 1.2 : 0.6),
        vy: isForeground ? 1.8 + Math.random() * 2.2 : 0.8 + Math.random() * 1.2,
        size: isForeground ? 3.5 + Math.random() * 3.5 : 1.5 + Math.random() * 2.0,
        color: "#FFFFFF",
        alpha: isForeground ? 0.65 + Math.random() * 0.3 : 0.25 + Math.random() * 0.35,
        life: 1,
        maxLife: 1,
        type: "snow",
        layer: isForeground ? "front" : "back"
      });
    }
  }

  /**
   * Estela táctil mágica (Touch Magic Trail)
   */
  public emitTouchTrail(x: number, y: number, count: number = 3): void {
    // Limitar partículas totales activas a 120 para no saturar memoria
    if (this.particles.length > 120) return;

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
   * Genera una explosión de chispas o estrellas en una posición (x, y)
   */
  public emitBurst(x: number, y: number, color: string = "#FFD700", count: number = 15): void {
    if (this.particles.length > 150) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 28 + Math.random() * 18,
        type: "spark"
      });
    }
  }

  /**
   * Genera una explosión de confeti multicolor para celebraciones
   */
  public emitConfetti(width: number, count: number = 50): void {
    const colors = ["#FF416C", "#FFD700", "#2ECC71", "#00E5FF", "#9B59B6", "#FFFFFF"];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 3 + Math.random() * 5,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        life: 0,
        maxLife: 100 + Math.random() * 50,
        type: "confetti",
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
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
   * Dibuja todas las partículas en el Canvas
   */
  public draw(ctx: CanvasRenderingContext2D, renderSnow: boolean = true): void {
    ctx.save();

    // 1. Dibujar nieve
    if (renderSnow) {
      for (const flake of this.snowFlakes) {
        ctx.fillStyle = flake.color;
        ctx.globalAlpha = flake.alpha;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Dibujar partículas (chispas, estrellas, confeti)
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
        // Micro-estrella brillante
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.3, -p.size * 0.3);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(p.size * 0.3, p.size * 0.3);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.3, p.size * 0.3);
        ctx.lineTo(-p.size, 0);
        ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
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
