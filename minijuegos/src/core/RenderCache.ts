/**
 * Cachés de dibujo para el tótem: lo que no cambia entre frames se pinta una sola
 * vez en un canvas aparte y luego solo se copia.
 */

/** Capa pre-renderizada: se repinta únicamente cuando cambia `key`. */
export class LayerCache {
  private canvas: HTMLCanvasElement | null = null;
  private key = "";

  /**
   * Copia en (x, y, w, h) la capa pintada por `paint`, que dibuja con las mismas
   * coordenadas lógicas que usaría directamente sobre `ctx`.
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    paint: (layer: CanvasRenderingContext2D) => void
  ): void {
    const scale = ctx.getTransform().a || 1;
    // Región alineada a píxeles del buffer para que la copia sea 1:1 y nítida
    const px = Math.floor(x * scale);
    const py = Math.floor(y * scale);
    const pw = Math.max(1, Math.ceil((x + w) * scale) - px);
    const ph = Math.max(1, Math.ceil((y + h) * scale) - py);
    const fullKey = `${key}|${px},${py},${pw},${ph}|${document.fonts?.status}`;

    if (!this.canvas || this.key !== fullKey) {
      const canvas = this.canvas ?? (this.canvas = document.createElement("canvas"));
      canvas.width = pw; // reasignar el ancho limpia el canvas y su estado
      canvas.height = ph;
      const layer = canvas.getContext("2d")!;
      layer.setTransform(scale, 0, 0, scale, -px, -py);
      paint(layer);
      this.key = fullKey;
    }

    ctx.drawImage(this.canvas, px / scale, py / scale, pw / scale, ph / scale);
  }
}

const GLOW_SIZE = 128;
const glowSprites = new Map<string, HTMLCanvasElement>();

/**
 * Resplandor circular (degradado radial) dibujado desde un sprite cacheado.
 * `inner` es el radio interior como fracción del exterior.
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: number,
  stops: ReadonlyArray<readonly [number, string]>
): void {
  const key = `${inner.toFixed(2)}|${stops.join(";")}`;
  let sprite = glowSprites.get(key);
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = sprite.height = GLOW_SIZE;
    const g = sprite.getContext("2d")!;
    const c = GLOW_SIZE / 2;
    const grad = g.createRadialGradient(c, c, c * inner, c, c, c);
    for (const [offset, color] of stops) grad.addColorStop(offset, color);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(c, c, c, 0, Math.PI * 2);
    g.fill();
    glowSprites.set(key, sprite);
  }
  ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
}
