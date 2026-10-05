/**
 * ==============================================================================
 * GESTOR DE ALMACENAMIENTO LOCAL (RÉCORDS Y ESTADÍSTICAS)
 * ==============================================================================
 * 
 * Permite guardar y recuperar las mejores puntuaciones de cada juego en el
 * almacenamiento local del tótem sin necesidad de servidores o internet.
 */

import { KIOSK_CONFIG } from "../config/kiosk";

export class StorageManager {
  private static getKey(gameId: string): string {
    return `${KIOSK_CONFIG.storageKeyPrefix}${gameId}`;
  }

  /**
   * Obtiene la mejor puntuación histórica de un minijuego
   */
  public static getHighScore(gameId: string): number {
    try {
      const val = localStorage.getItem(this.getKey(gameId));
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Guarda una nueva puntuación si supera el récord actual.
   * Retorna true si es un nuevo récord.
   */
  public static saveScore(gameId: string, score: number): { isNewRecord: boolean; highScore: number } {
    const currentHigh = this.getHighScore(gameId);
    if (score > currentHigh) {
      try {
        localStorage.setItem(this.getKey(gameId), score.toString());
      } catch (e) {
        console.warn("No se pudo guardar en localStorage:", e);
      }
      return { isNewRecord: true, highScore: score };
    }
    return { isNewRecord: false, highScore: currentHigh };
  }

  /**
   * Reinicia los récords (útil para el inicio de una nueva jornada en la feria)
   */
  public static resetScores(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(KIOSK_CONFIG.storageKeyPrefix)) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn("Error al reiniciar puntuaciones:", e);
    }
  }
}
