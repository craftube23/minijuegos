/**
 * ==============================================================================
 * CACHÉ GLOBAL DE RECURSOS GRÁFICOS (AssetCache)
 * ==============================================================================
 * 
 * Evita la creación redundante de objetos HTMLImageElement en memoria:
 * - Una única instancia por URL compartida entre todos los minijuegos.
 * - Reutilización automática sin descargas o decodificaciones duplicadas.
 * - Manejo robusto de errores sin bloquear el bucle Canvas.
 */

export class AssetCache {
  private static instance: AssetCache;
  private imageMap: Map<string, HTMLImageElement> = new Map();

  private constructor() {}

  public static getInstance(): AssetCache {
    if (!AssetCache.instance) {
      AssetCache.instance = new AssetCache();
    }
    return AssetCache.instance;
  }

  /**
   * Obtiene una imagen compartida desde la caché o la instancia si aún no existe.
   */
  public getImage(src: string): HTMLImageElement {
    if (!src) {
      return new Image();
    }

    const cached = this.imageMap.get(src);
    if (cached) {
      return cached;
    }

    const img = new Image();
    img.src = src;
    img.onerror = (e) => {
      console.warn(`[AssetCache] No se pudo cargar el recurso gráfico: ${src}`, e);
    };
    this.imageMap.set(src, img);
    return img;
  }

  /**
   * Devuelve si una imagen está completamente cargada y lista para dibujarse.
   */
  public isReady(src: string): boolean {
    const img = this.imageMap.get(src);
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  /**
   * Número de recursos únicos gestionados en la caché.
   */
  public size(): number {
    return this.imageMap.size;
  }
}
