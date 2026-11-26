/**
 * Utilidades de dibujo compartidas por los minijuegos (estilo Stylized 2D Game Art).
 * Sin emojis: todo se dibuja con trazos vectoriales o sprites de concept art.
 */

export function imgReady(img?: HTMLImageElement | null): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export interface SkyStar {
  x: number; // 0..1
  y: number; // 0..1
  r: number;
  p: number; // fase de parpadeo
}

export function makeSkyStars(count: number): SkyStar[] {
  const stars: SkyStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, p: Math.random() * Math.PI * 2 });
  }
  return stars;
}

let cachedSkyGrad: CanvasGradient | null = null;
let cachedSkyGradH: number = -1;
let cachedAurGrad: CanvasGradient | null = null;
let cachedAurGradH: number = -1;

/** Cielo nocturno de feria con estrellas titilantes y luna */
export function drawNightSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  stars: SkyStar[],
  scrollY: number = 0
): void {
  if (!cachedSkyGrad || cachedSkyGradH !== h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#060B24");
    g.addColorStop(0.55, "#10224D");
    g.addColorStop(1, "#1C3A73");
    cachedSkyGrad = g;
    cachedSkyGradH = h;
  }
  ctx.fillStyle = cachedSkyGrad;
  ctx.fillRect(0, 0, w, h);

  // Aurora suave
  ctx.save();
  ctx.globalAlpha = 0.22;
  if (!cachedAurGrad || cachedAurGradH !== h) {
    const a = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.55);
    a.addColorStop(0, "rgba(0,229,160,0)");
    a.addColorStop(0.5, "rgba(0,229,160,0.9)");
    a.addColorStop(1, "rgba(0,160,255,0)");
    cachedAurGrad = a;
    cachedAurGradH = h;
  }
  ctx.fillStyle = cachedAurGrad;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.3);
  for (let x = 0; x <= w; x += 40) {
    ctx.lineTo(x, h * 0.28 + Math.sin(x * 0.012 + t * 0.6) * 26 + Math.sin(x * 0.03 + t) * 8 + scrollY * 0.05);
  }
  ctx.lineTo(w, h * 0.62);
  ctx.lineTo(0, h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Estrellas por lotes (Batch Rendering en 1 solo trazado)
  if (stars.length > 0) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#FFFDE7";
    ctx.beginPath();
    for (const s of stars) {
      const y = ((s.y * h + scrollY * 0.15) % h + h) % h;
      const x = s.x * w;
      ctx.moveTo(x + s.r, y);
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  // Luna con halo (Capa pura translúcida sin recrear gradiente radial cada frame)
  const mx = w * 0.84;
  const my = h * 0.2 + scrollY * 0.04;
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 220, 0.18)";
  ctx.beginPath();
  ctx.arc(mx, my, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFF8DC";
  ctx.beginPath();
  ctx.arc(mx, my, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Pastilla informativa (altura, combo, piso...) con borde dorado */
export function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color: string = "#FFD700",
  minW: number = 120
): void {
  ctx.save();
  ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
  const tw = Math.max(minW, ctx.measureText(text).width + 34);
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "rgba(10, 22, 45, 0.92)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  roundRectPath(ctx, cx - tw / 2, y, tw, 30, 15);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, y + 15.5);
  ctx.restore();
}

/** Medallón circular con logo de patrocinador */
export function drawSponsorMedallion(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | undefined,
  cx: number,
  cy: number,
  r: number,
  glow: string = "#FFD700"
): void {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#FFB300";
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.stroke();
  if (imgReady(logo)) {
    const ratio = logo.naturalWidth / logo.naturalHeight;
    const maxS = r * 1.45;
    const dw = ratio >= 1 ? maxS : maxS * ratio;
    const dh = ratio >= 1 ? maxS / ratio : maxS;
    ctx.drawImage(logo, cx - dw / 2, cy - dh / 2, dw, dh);
  }
  ctx.restore();
}
