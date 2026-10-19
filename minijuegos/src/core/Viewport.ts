/**
 * Utilidades de viewport / HiDPI compartidas por el bucle principal, el input y los juegos.
 *
 * - Las dimensiones LÓGICAS (las que usan los juegos, la física y los toques) son siempre
 *   las dimensiones CSS del contenedor.
 * - El buffer físico del canvas es lógico × DPR (DPR limitado a 2 para no gastar memoria).
 */

export const MAX_DPR = 2;

export function getDpr(): number {
  const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.max(1, Math.min(MAX_DPR, raw));
}

/**
 * Ajusta el buffer del canvas a (ancho × alto lógicos × DPR).
 * Devuelve el DPR aplicado. El tamaño visual lo sigue controlando el CSS.
 */
export function applyCanvasSize(canvas: HTMLCanvasElement, logicalW: number, logicalH: number): number {
  const dpr = getDpr();
  const pw = Math.max(1, Math.round(logicalW * dpr));
  const ph = Math.max(1, Math.round(logicalH * dpr));
  if (canvas.width !== pw) canvas.width = pw;
  if (canvas.height !== ph) canvas.height = ph;
  return dpr;
}
