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
 * - En Computador (PC / Laptop): 1.0 (100% de escala nativa)
 * - En Teléfono / Tablet / APK Android: ~0.67 (1 / 1.5, aleja la cámara dando 150% de visión panorámica)
 */
export function getGameCameraZoom(): number {
  if (isDesktopComputer()) {
    return 1.0;
  }
  // En teléfonos y tablets alejamos la cámara (zoom 0.67 = 1/1.5) para que no se perciba al 150%
  return 0.67;
}
