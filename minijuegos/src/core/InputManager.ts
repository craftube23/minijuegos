/**
 * ==============================================================================
 * ADAPTADOR DE ENTRADA UNIFICADO (Touch, Pointer, Mouse y Teclado)
 * ==============================================================================
 * 
 * Este módulo abstrae todas las formas de interacción:
 * - En la pantalla táctil de la feria: responde a toques rápidos, arrastres y toques múltiples sin retardo.
 * - En la PC del desarrollador: permite jugar cómodamente con ratón o teclado (Flechas, Espacio, Números).
 * - Convierte las coordenadas de la pantalla a las coordenadas internas del Canvas virtual (1080x1920).
 */

export interface TouchPoint {
  id: number;
  x: number; // Coordenada X escalada al canvas del juego
  y: number; // Coordenada Y escalada al canvas del juego
  rawX: number; // Coordenada X física en píxeles del navegador
  rawY: number; // Coordenada Y física en píxeles del navegador
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private activeTouches: Map<number, TouchPoint> = new Map();
  private keysDown: Set<string> = new Set();
  
  // Callbacks para eventos directos
  public onTap?: (x: number, y: number) => void;
  public onDrag?: (x: number, y: number, dx: number, dy: number) => void;
  public onRelease?: (x: number, y: number) => void;
  public onPointerDown?: (pointerId: number, x: number, y: number) => void;
  public onPointerUp?: (pointerId: number, x: number, y: number) => void;
  public onPointerMove?: (pointerId: number, x: number, y: number) => void;

  private lastPosition: { x: number; y: number } | null = null;
  private isPointerDown: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  private setupListeners(): void {
    // 1. Desactivar menú contextual con clic derecho o toque sostenido
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // 2. Eventos Pointer (Maneja Touch, Mouse y Stylus de forma moderna y unificada)
    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), { passive: false });
    window.addEventListener("pointermove", this.handlePointerMove.bind(this), { passive: false });
    window.addEventListener("pointerup", this.handlePointerUp.bind(this), { passive: false });
    window.addEventListener("pointercancel", this.handlePointerUp.bind(this), { passive: false });

    // 3. Eventos de Teclado (Para pruebas en PC durante el desarrollo)
    window.addEventListener("keydown", (e) => {
      this.keysDown.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.code);
    });
  }

  private cachedRect: DOMRect | null = null;
  private scaleX: number = 1;
  private scaleY: number = 1;

  public updateBounds(): void {
    this.cachedRect = this.canvas.getBoundingClientRect();
    if (this.cachedRect.width > 0 && this.cachedRect.height > 0) {
      this.scaleX = this.canvas.width / this.cachedRect.width;
      this.scaleY = this.canvas.height / this.cachedRect.height;
    }
  }

  /**
   * Transforma las coordenadas de la ventana a la resolución interna del canvas
   */
  private getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.cachedRect) {
      this.updateBounds();
    }
    const rect = this.cachedRect || this.canvas.getBoundingClientRect();

    return {
      x: (clientX - rect.left) * this.scaleX,
      y: (clientY - rect.top) * this.scaleY
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    e.preventDefault();
    this.updateBounds();
    this.isPointerDown = true;
    const { x, y } = this.getCanvasCoordinates(e.clientX, e.clientY);
    
    this.activeTouches.set(e.pointerId, {
      id: e.pointerId,
      x,
      y,
      rawX: e.clientX,
      rawY: e.clientY
    });

    this.lastPosition = { x, y };

    if (this.onPointerDown) {
      this.onPointerDown(e.pointerId, x, y);
    }

    if (this.onTap) {
      this.onTap(x, y);
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isPointerDown && e.pointerType === "mouse") return;
    const touch = this.activeTouches.get(e.pointerId);
    if (!touch && !this.isPointerDown) return;

    const { x, y } = this.getCanvasCoordinates(e.clientX, e.clientY);
    const prev = this.lastPosition || { x, y };
    const dx = x - prev.x;
    const dy = y - prev.y;

    this.activeTouches.set(e.pointerId, {
      id: e.pointerId,
      x,
      y,
      rawX: e.clientX,
      rawY: e.clientY
    });

    this.lastPosition = { x, y };

    if (this.onPointerMove) {
      this.onPointerMove(e.pointerId, x, y);
    }

    if (this.onDrag) {
      this.onDrag(x, y, dx, dy);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    const touch = this.activeTouches.get(e.pointerId);
    if (touch) {
      this.activeTouches.delete(e.pointerId);
      if (this.onPointerUp) {
        this.onPointerUp(e.pointerId, touch.x, touch.y);
      }
      if (this.onRelease) {
        this.onRelease(touch.x, touch.y);
      }
    }

    if (this.activeTouches.size === 0) {
      this.isPointerDown = false;
      this.lastPosition = null;
    }
  }

  /**
   * Obtiene la posición del toque principal o ratón
   */
  public getPrimaryPointer(): { x: number; y: number; isDown: boolean } | null {
    if (this.lastPosition) {
      return {
        x: this.lastPosition.x,
        y: this.lastPosition.y,
        isDown: this.isPointerDown
      };
    }
    return null;
  }

  /**
   * Comprueba si una tecla de PC está presionada (Ej: "ArrowLeft", "ArrowRight", "Space")
   */
  public isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  /**
   * Limpia todos los estados de toques
   */
  public reset(): void {
    this.activeTouches.clear();
    this.keysDown.clear();
    this.lastPosition = null;
    this.isPointerDown = false;
  }
}
