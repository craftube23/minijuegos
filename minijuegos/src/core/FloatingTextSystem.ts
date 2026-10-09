/**
 * ==============================================================================
 * SISTEMA DE TEXTOS FLOTANTES (FloatingTextSystem)
 * ==============================================================================
 * 
 * Gestiona y renderiza números y mensajes emergentes (+100, x2 Combo, -1❤️)
 * con aceleración, desvanecimiento y escalado dinámico.
 */

import type { FloatingText } from "../types/game";

export class FloatingTextSystem {
  private texts: FloatingText[] = [];

  public add(text: string, x: number, y: number, color: string = "#FFD700", scale: number = 1.0): void {
    this.texts.push({
      text,
      x,
      y,
      vy: -140,
      color,
      alpha: 1.0,
      scale,
      life: 0,
      maxLife: 0.85
    });
  }

  public update(dt: number): void {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const ft = this.texts[i];
      ft.life += dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ft.scale += dt * 0.4;
      if (ft.life >= ft.maxLife) {
        this.texts.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, screenWidth: number): void {
    for (const ft of this.texts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      const fontSize = Math.max(16, Math.min(32, screenWidth * 0.045));
      ctx.font = `900 ${fontSize}px 'Outfit', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Sombra exterior
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      // Borde de contraste
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#051124";
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, 0, 0);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
  }

  public clear(): void {
    this.texts = [];
  }
}
