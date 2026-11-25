/**
 * Utilidades de viewport / HiDPI compartidas por el bucle principal, el input y los juegos.
 *
 * - Las dimensiones LÓGICAS (las que usan los juegos, la física y los toques) son siempre
 *   las dimensiones CSS del contenedor.
 * - En kioscos táctiles de 55" con GPU Mali-G52 y 2GB de RAM (SoC Rockchip RK3566), el DPR
 *   se limita estrictamente a 1.0 para mantener 60 FPS estables sin saturar el ancho de banda
 *   de memoria ni provocar pausas del recolector de basura (GC).
 */

export const MAX_DPR = 1;

export function getDpr(): number {
  return 1;
}

/**
 * Escala del buffer de render. En pantallas grandes (tótem) se dibuja al 80% y el CSS
 * lo estira: ~36% menos píxeles por frame. Física y toques siguen en medidas lógicas.
 * Poner 1 para volver a resolución nativa.
 */
export const LARGE_SCREEN_RENDER_SCALE = 0.8;

export function getRenderScale(logicalW: number, logicalH: number): number {
  return logicalW * logicalH > 1_200_000 ? LARGE_SCREEN_RENDER_SCALE : getDpr();
}

/**
 * Optimización crítica a nivel de motor:
 * Desactiva shadowBlur en el prototipo de Canvas 2D en entornos con GPU móvil integrada (Mali-G52).
 * Evita que Skia GPU ejecute pasadas de desenfoque gaussiano por software o buffer offscreen,
 * lo cual causaba caídas severas de FPS (15-20 FPS) en el tótem con 2GB de RAM.
 */
try {
  if (typeof CanvasRenderingContext2D !== "undefined") {
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", {
      get() { return 0; },
      set(_val: number) { /* no-op para garantizar 60 FPS estables sin tirones */ },
      configurable: true,
      enumerable: true
    });
  }
} catch {
  // Ignorar de forma segura si el entorno bloquea la redefinición
}

/**
 * Ajusta el buffer del canvas a (ancho × alto lógicos × DPR).
 * Devuelve el DPR aplicado. El tamaño visual lo sigue controlando el CSS.
 */
export function applyCanvasSize(canvas: HTMLCanvasElement, logicalW: number, logicalH: number): number {
  const dpr = getRenderScale(logicalW, logicalH);
  const pw = Math.max(1, Math.round(logicalW * dpr));
  const ph = Math.max(1, Math.round(logicalH * dpr));
  if (canvas.width !== pw) canvas.width = pw;
  if (canvas.height !== ph) canvas.height = ph;
  return dpr;
}

/**
 * Detecta si el dispositivo actual es un computador de escritorio o laptop (Windows, Mac, Linux).
 * Retorna false en teléfonos inteligentes, tablets, emuladores móviles (BlueStacks) y entornos Capacitor nativos.
 */
export function isDesktopComputer(): boolean {
  if (typeof window === "undefined") return true;

  // Parámetro de depuración manual en URL (?desktop=1 o ?mobile=1)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("desktop")) return true;
    if (params.has("mobile")) return false;
  } catch {}

  // 1. Detección de contenedor nativo Capacitor (Android APK / iOS)
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return false;
  }

  // 2. User Agent móvil, tablet o emulador Android (BlueStacks, WebView, Chrome móvil, etc.)
  const ua = (navigator.userAgent || "").toLowerCase();
  const mobilePatterns = [
    "android", "iphone", "ipad", "ipod", "blackberry", "iemobile",
    "opera mini", "mobile", "crios", "silk", "bluestacks"
  ];
  if (mobilePatterns.some((pattern) => ua.includes(pattern))) {
    return false;
  }

  // 3. Detección de dispositivo táctil con resolución de pantalla típica de smartphone o tablet
  const hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  const maxDim = Math.max(window.innerWidth, window.innerHeight);
  if (hasTouch && (minDim <= 620 || maxDim <= 1280)) {
    return false;
  }

  // Por defecto es una PC / Computador
  return true;
}

/**
 * Factor de zoom de cámara para los minijuegos:
 * En kiosco vertical de 55" (1080x1920) y en pantallas de escritorio se usa siempre 1.0 (100% nativo).
 */
export function getGameCameraZoom(): number {
  return 1.0;
}
