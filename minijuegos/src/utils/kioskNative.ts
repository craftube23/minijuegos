/**
 * ==============================================================================
 * MÓDULO DE MODO KIOSCO NATIVO (CAPACITOR / ANDROID) - FASE 4
 * ==============================================================================
 *
 * Responsabilidades:
 * 1. Mantener la pantalla encendida mediante `@capacitor-community/keep-awake`
 *    cuando la aplicación se ejecuta en plataforma nativa compatible.
 * 2. Ocultar la barra de estado superior mediante `@capacitor/status-bar`
 *    (`StatusBar.hide()`) sin forzar `setOverlaysWebView`, preservando el
 *    layout del contenedor WebView.
 *    Nota: Ocultar la barra de estado superior (`StatusBar.hide()`) NO equivale
 *    al modo inmersivo completo de Android (que también oculta la barra de
 *    navegación inferior del sistema o aplica Screen Pinning / Lock Task Mode).
 * 3. Ser completamente inocuo en navegador web (`!Capacitor.isNativePlatform()`),
 *    evitando llamadas innecesarias o errores cuando los complementos nativos
 *    no están activos.
 * 4. Evitar inicializaciones duplicadas y llamadas repetidas al navegar entre
 *    pantallas, reaplicando el estado únicamente cuando la app vuelve a primer
 *    plano (`visibilitychange` -> `visible`) en entorno nativo.
 */

import { Capacitor } from "@capacitor/core";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { StatusBar, Style } from "@capacitor/status-bar";

export interface KioskNativeDiagnostics {
  platform: string;
  isNative: boolean;
  initialized: boolean;
  initCallsCount: number;
  nativePluginCallsCount: number;
  keepAwakeSupported: boolean;
  keepAwakeActive: boolean;
  statusBarHidden: boolean;
  visibilityListenerAttached: boolean;
  status: "uninitialized" | "initializing" | "noop-web" | "active-native" | "partial-native" | "error-recovered";
  lastError: string | null;
}

export interface KioskNativeAdapter {
  isNativePlatform: () => boolean;
  getPlatform: () => string;
  isPluginAvailable: (name: string) => boolean;
  keepAwake: {
    isSupported: () => Promise<{ isSupported: boolean }>;
    isKeptAwake: () => Promise<{ isKeptAwake: boolean }>;
    keepAwake: () => Promise<void>;
    allowSleep: () => Promise<void>;
  };
  statusBar: {
    setStyle: (options: { style: Style }) => Promise<void>;
    hide: () => Promise<void>;
    show: () => Promise<void>;
  };
}

const defaultAdapter: KioskNativeAdapter = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  getPlatform: () => Capacitor.getPlatform(),
  isPluginAvailable: (name: string) => Capacitor.isPluginAvailable(name),
  keepAwake: {
    isSupported: () => KeepAwake.isSupported(),
    isKeptAwake: () => KeepAwake.isKeptAwake(),
    keepAwake: () => KeepAwake.keepAwake(),
    allowSleep: () => KeepAwake.allowSleep()
  },
  statusBar: {
    setStyle: (options) => StatusBar.setStyle(options),
    hide: () => StatusBar.hide(),
    show: () => StatusBar.show()
  }
};

const diagnostics: KioskNativeDiagnostics = {
  platform: "web",
  isNative: false,
  initialized: false,
  initCallsCount: 0,
  nativePluginCallsCount: 0,
  keepAwakeSupported: false,
  keepAwakeActive: false,
  statusBarHidden: false,
  visibilityListenerAttached: false,
  status: "uninitialized",
  lastError: null
};

let initPromise: Promise<KioskNativeDiagnostics> | null = null;
let visibilityHandler: (() => void) | null = null;
let lastResumeReapplyTime = 0;
const RESUME_COOLDOWN_MS = 1500;

/**
 * Aplica la activación de KeepAwake de forma segura e idempotente.
 */
async function applyKeepAwakeSafe(adapter: KioskNativeAdapter): Promise<boolean> {
  if (!adapter.isPluginAvailable("KeepAwake")) {
    return false;
  }

  try {
    diagnostics.nativePluginCallsCount++;
    const supportResult = await adapter.keepAwake.isSupported();
    diagnostics.keepAwakeSupported = Boolean(supportResult?.isSupported);

    if (!diagnostics.keepAwakeSupported) {
      return false;
    }

    diagnostics.nativePluginCallsCount++;
    const stateResult = await adapter.keepAwake.isKeptAwake();
    if (stateResult?.isKeptAwake) {
      diagnostics.keepAwakeActive = true;
      return true;
    }

    diagnostics.nativePluginCallsCount++;
    await adapter.keepAwake.keepAwake();
    diagnostics.keepAwakeActive = true;
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    diagnostics.lastError = `KeepAwake: ${msg}`;
    diagnostics.keepAwakeActive = false;
    console.warn("[KioskNative] No se pudo activar KeepAwake:", msg);
    return false;
  }
}

/**
 * Oculta la barra de estado superior de forma segura sin alterar el layout
 * con `setOverlaysWebView`.
 */
async function applyStatusBarHideSafe(adapter: KioskNativeAdapter): Promise<boolean> {
  if (!adapter.isPluginAvailable("StatusBar")) {
    return false;
  }

  try {
    try {
      diagnostics.nativePluginCallsCount++;
      await adapter.statusBar.setStyle({ style: Style.Dark });
    } catch {
      // Estilo opcional; continuar con hide()
    }

    diagnostics.nativePluginCallsCount++;
    await adapter.statusBar.hide();
    diagnostics.statusBarHidden = true;
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    diagnostics.lastError = diagnostics.lastError
      ? `${diagnostics.lastError} | StatusBar: ${msg}`
      : `StatusBar: ${msg}`;
    diagnostics.statusBarHidden = false;
    console.warn("[KioskNative] No se pudo ocultar StatusBar:", msg);
    return false;
  }
}

/**
 * Registra una única vez el listener de visibilidad en plataforma nativa
 * para restaurar KeepAwake y ocultar StatusBar al volver a primer plano.
 */
function attachNativeVisibilityListenerOnce(adapter: KioskNativeAdapter): void {
  if (diagnostics.visibilityListenerAttached || typeof document === "undefined") {
    return;
  }

  visibilityHandler = () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const now = Date.now();
    if (now - lastResumeReapplyTime < RESUME_COOLDOWN_MS) {
      return;
    }
    lastResumeReapplyTime = now;

    void (async () => {
      await applyKeepAwakeSafe(adapter);
      await applyStatusBarHideSafe(adapter);
    })();
  };

  document.addEventListener("visibilitychange", visibilityHandler, { passive: true });
  diagnostics.visibilityListenerAttached = true;
}

/**
 * Inicializa el modo kiosco nativo una única vez durante el arranque de la app.
 * En navegador web (`!Capacitor.isNativePlatform()`), finaliza de forma inocua
 * sin invocar complementos nativos.
 */
export async function initKioskNativeMode(): Promise<KioskNativeDiagnostics> {
  diagnostics.initCallsCount++;

  if (diagnostics.initialized) {
    return { ...diagnostics };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const platform = defaultAdapter.getPlatform();
      const isNative = defaultAdapter.isNativePlatform();

      diagnostics.platform = platform;
      diagnostics.isNative = isNative;
      diagnostics.status = "initializing";

      if (!isNative) {
        diagnostics.initialized = true;
        diagnostics.status = "noop-web";
        return { ...diagnostics };
      }

      const [awakeOk, statusBarOk] = await Promise.all([
        applyKeepAwakeSafe(defaultAdapter),
        applyStatusBarHideSafe(defaultAdapter)
      ]);

      attachNativeVisibilityListenerOnce(defaultAdapter);

      diagnostics.initialized = true;
      if (awakeOk && statusBarOk) {
        diagnostics.status = "active-native";
      } else if (awakeOk || statusBarOk) {
        diagnostics.status = "partial-native";
      } else {
        diagnostics.status = "error-recovered";
      }

      return { ...diagnostics };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      diagnostics.initialized = true;
      diagnostics.status = "error-recovered";
      diagnostics.lastError = msg;
      console.warn("[KioskNative] Error controlado durante inicialización:", msg);
      return { ...diagnostics };
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Libera el bloqueo de pantalla encendida y el listener de visibilidad si se
 * requiere desactivar el modo kiosco explícitamente.
 */
export async function releaseKioskNativeMode(): Promise<void> {
  if (visibilityHandler && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
    diagnostics.visibilityListenerAttached = false;
  }

  if (!diagnostics.isNative || !defaultAdapter.isPluginAvailable("KeepAwake")) {
    return;
  }

  try {
    await defaultAdapter.keepAwake.allowSleep();
    diagnostics.keepAwakeActive = false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[KioskNative] No se pudo liberar KeepAwake:", msg);
  }
}

/**
 * Devuelve una copia de solo lectura del estado diagnóstico actual del módulo.
 */
export function getKioskNativeDiagnostics(): KioskNativeDiagnostics {
  return { ...diagnostics };
}

/**
 * Función de diagnóstico aislada para verificar que errores o rechazos
 * asíncronos de los plugins nativos nunca bloquean ni lanzan excepciones no
 * capturadas (sin alterar el estado real de la sesión).
 */
export async function runIsolatedNativeResilienceCheck(
  customAdapter: KioskNativeAdapter
): Promise<{ recoveredWithoutThrow: boolean; awakeOk: boolean; statusBarOk: boolean }> {
  const savedDiagnostics = { ...diagnostics };
  try {
    const awakeOk = await applyKeepAwakeSafe(customAdapter);
    const statusBarOk = await applyStatusBarHideSafe(customAdapter);
    return {
      recoveredWithoutThrow: true,
      awakeOk,
      statusBarOk
    };
  } finally {
    Object.assign(diagnostics, savedDiagnostics);
  }
}
