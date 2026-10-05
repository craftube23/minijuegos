/**
 * ==============================================================================
 * SISTEMA DE PARTÍCULAS LIGERO Y OPTIMIZADO (60 FPS)
 * ==============================================================================
 * 
 * Genera efectos visuales mágicos con consumo mínimo de CPU en Android 11:
 * - Nieve constante flotando en segundo plano.
 * - Estallido de chispas y estrellas al atrapar regalos.
 * - Confeti festivo multicolor al terminar la partida o batir récords.
 * - Auras brillantes alrededor de los logos de la Feria.
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
  type: "snow" | "spark" | "confetti" | "star";
  rotation?: number;
  vRot?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private snowFlakes: Particle[] = [];
  private maxSnowFlakes: number = 40; // Límite controlado para máximo rendimiento

  constructor(width: number, height: number) {
    this.initSnow(width, height);
  }

  /**
   * Inicializa la nieve ambiente de fondo
   */
  public initSnow(width: number, height: number): void {
    this.snowFlakes = [];
    for (let i = 0; i < this.maxSnowFlakes; i++) {
      this.snowFlakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1 + Math.random() * 2,
        size: 2 + Math.random() * 4,
        color: "#FFFFFF",
        alpha: 0.3 + Math.random() * 0.5,
        life: 1,
        maxLife: 1,
        type: "snow"
      });
    }
  }

  /**
   * Genera una explosión de chispas o estrellas en una posición (x, y)
   */
  public emitBurst(x: number, y: number, color: string = "#FFD700", count: number = 15): void {
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
        maxLife: 30 + Math.random() * 20,
        type: "spark"
      });
    }
  }

  /**
   * Genera una explosión de confeti multicolor para celebraciones
   */
  public emitConfetti(width: number, count: number = 60): void {
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
        maxLife: 120 + Math.random() * 60,
        type: "confetti",
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  /**
   * Actualiza la posición y vida de todas las partículas
   */
  public update(width: number, height: number): void {
    // 1. Actualizar Nieve
    for (const flake of this.snowFlakes) {
      flake.y += flake.vy;
      flake.x += flake.vx + Math.sin(flake.y * 0.02) * 0.5;

      if (flake.y > height) {
        flake.y = -10;
        flake.x = Math.random() * width;
      }
      if (flake.x < 0) flake.x = width;
      if (flake.x > width) flake.x = 0;
    }

    // 2. Actualizar Partículas dinámicas (chispas, confeti)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === "confetti") {
        p.vy += 0.05; // Gravedad suave
        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot;
        }
      } else {
        p.vx *= 0.95; // Fricción
        p.vy *= 0.95;
      }

      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Dibuja todas las partículas en el contexto 2D del Canvas
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

    // 2. Dibujar chispas y confeti
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Limpia las partículas activas
   */
  public clear(): void {
    this.particles = [];
  }
}
