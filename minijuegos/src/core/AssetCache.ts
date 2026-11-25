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

  private scaledMap: Map<string, HTMLCanvasElement> = new Map();

  /**
   * Copia de una imagen ya escalada al tamaño en píxeles pedido (se calcula una sola vez).
   * Dibujarla es una copia 1:1, mucho más barata que reescalar la original en cada frame.
   * Guarda una sola copia por imagen.
   */
  public getScaled(img: HTMLImageElement, pixelW: number, pixelH: number): HTMLCanvasElement {
    const w = Math.max(1, Math.round(pixelW));
    const h = Math.max(1, Math.round(pixelH));
    const key = `${img.src}_${w}x${h}`;
    let c = this.scaledMap.get(key);
    if (!c) {
      c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      if (img.complete && img.naturalWidth > 0) {
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        this.scaledMap.set(key, c);
      }
    }
    return c;
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
