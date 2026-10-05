/**
 * ==============================================================================
 * SISTEMA DE FEEDBACK HÁPTICO (Vibration API para Dispositivos Móviles)
 * ==============================================================================
 * 
 * Brinda respuesta táctil instantánea en pantallas táctiles y teléfonos Android / iOS:
 * - Toque de interfaz: micro-vibración sutil (15ms).
 * - Captura de objeto / punto: pulso ligero (25ms).
 * - Combo / Power-Up de la Feria: pulso doble vibrante (35ms, 40ms, 35ms).
 * - Daño / Bomba / Pérdida de vida: sacudida intensa (75ms).
 * - Victoria / Nuevo Récord: secuencia festiva rítmica.
 */

export class Haptics {
  private static isSupported: boolean = typeof navigator !== "undefined" && "vibrate" in navigator;

  /**
   * Vibración corta para botones y toques de menú
   */
  public static tap(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(15);
    } catch {
      // Ignorar restricciones del navegador si no hubo interacción previa
    }
  }

  /**
   * Vibración ligera para recolectar juguetes o acertar notas/cartas
   */
  public static light(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(28);
    } catch {}
  }

  /**
   * Vibración media para combos, chimeneas acertadas o parejas encontradas
   */
  public static medium(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(45);
    } catch {}
  }

  /**
   * Vibración doble para bonificación de la Feria / Power-Up
   */
  public static powerUp(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([35, 45, 50]);
    } catch {}
  }

  /**
   * Vibración fuerte para daño, carbón, bomba o impacto
   */
  public static impact(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([70, 50, 70]);
    } catch {}
  }

  /**
   * Secuencia rítmica festiva para victoria / récord
   */
  public static celebration(): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([40, 50, 60, 50, 100]);
    } catch {}
  }
}
