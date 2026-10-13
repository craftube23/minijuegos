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
  private static getKey(gameId: string, subKey?: string): string {
    if (subKey) {
      return `${KIOSK_CONFIG.storageKeyPrefix}${gameId}_${subKey}`;
    }
    return `${KIOSK_CONFIG.storageKeyPrefix}${gameId}`;
  }

  /**
   * Obtiene la mejor puntuación histórica de un minijuego o subclave específica (ej: bell-symphony_cancion_dificultad)
   */
  public static getHighScore(gameId: string, subKey?: string): number {
    try {
      if (subKey) {
        const val = localStorage.getItem(this.getKey(gameId, subKey));
        return val ? parseInt(val, 10) || 0 : 0;
      }

      // Si no hay subKey, obtener el mayor récord entre el global y todas sus subclaves
      let maxScore = 0;
      const globalVal = localStorage.getItem(this.getKey(gameId));
      if (globalVal) maxScore = parseInt(globalVal, 10) || 0;

      const prefix = `${KIOSK_CONFIG.storageKeyPrefix}${gameId}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix) && !k.endsWith("_rank")) {
          const v = parseInt(localStorage.getItem(k) || "0", 10) || 0;
          if (v > maxScore) maxScore = v;
        }
      }
      return maxScore;
    } catch {
      return 0;
    }
  }

  /**
   * Guarda una nueva puntuación si supera el récord actual.
   * Si es para un subKey, también actualiza el récord global si lo supera.
   * Retorna true si es un nuevo récord.
   */
  public static saveScore(gameId: string, score: number, subKey?: string): { isNewRecord: boolean; highScore: number } {
    const currentHigh = this.getHighScore(gameId, subKey);
    let isNewRecord = false;
    let finalHigh = currentHigh;

    if (score > currentHigh) {
      isNewRecord = true;
      finalHigh = score;
      try {
        localStorage.setItem(this.getKey(gameId, subKey), score.toString());
      } catch (e) {
        console.warn("No se pudo guardar en localStorage:", e);
      }
    }

    // Si tiene subKey, actualizar también el récord global del minijuego si lo supera
    if (subKey) {
      const globalHigh = this.getHighScore(gameId);
      if (score > globalHigh) {
        try {
          localStorage.setItem(this.getKey(gameId), score.toString());
        } catch {}
      }
    }

    return { isNewRecord, highScore: finalHigh };
  }

  /**
   * Guarda y obtiene el mejor rango ("S+", "S", "A", etc.) para un subKey
   */
  public static getBestRank(gameId: string, subKey: string): string | null {
    try {
      return localStorage.getItem(`${this.getKey(gameId, subKey)}_rank`);
    } catch {
      return null;
    }
  }

  public static saveBestRank(gameId: string, subKey: string, rank: string): void {
    try {
      const currentRank = this.getBestRank(gameId, subKey);
      const rankOrder: Record<string, number> = { "S+": 6, "S": 5, "A": 4, "B": 3, "C": 2, "D": 1 };
      const currentVal = currentRank ? (rankOrder[currentRank] || 0) : 0;
      const newVal = rankOrder[rank] || 0;
      if (newVal >= currentVal) {
        localStorage.setItem(`${this.getKey(gameId, subKey)}_rank`, rank);
      }
    } catch (e) {
      console.warn("No se pudo guardar rango en localStorage:", e);
    }
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
