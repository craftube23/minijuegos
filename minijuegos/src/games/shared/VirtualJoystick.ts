/**
 * ==============================================================================
 * JOYSTICK VIRTUAL REUTILIZABLE (VirtualJoystick)
 * ==============================================================================
 * - Joystick táctil flotante: aparece donde el usuario apoya el pulgar.
 * - Seguimiento de un único pointerId (los demás dedos se ignoran).
 * - Soporte de teclado WASD / Flechas para pruebas en PC.
 * - Expone vector normalizado (x, y), magnitud (0 a 1) y ángulo (radianes).
 * - Renderizado en Canvas con estética festiva dorada traslúcida.
 */

export class VirtualJoystick {
  public readonly radius: number;
  public readonly deadZone: number;

  private canvas: HTMLCanvasElement;
  private getLogicalSize: () => { width: number; height: number };
  private attached = false;

  // Estado táctil
  private pointerId: number | null = null;
  private baseX = 0;
  private baseY = 0;
  private knobX = 0;
  private knobY = 0;
  private appearAlpha = 0;

  // Estado de teclado
  private keys = { up: false, down: false, left: false, right: false };

  // Salida
  private outX = 0;
  private outY = 0;
  private outMag = 0;

  // Sprites cacheados offscreen para ultra-rendimiento (Cero llamadas a createRadialGradient por frame)
  private baseCanvas: HTMLCanvasElement | null = null;
  private knobCanvas: HTMLCanvasElement | null = null;
  private baseR: number = 0;
  private knobR: number = 0;

  private ensureSprites(): void {
    if (this.baseCanvas && this.knobCanvas) return;

    const r = this.radius;
    const baseMargin = Math.ceil(r * 1.25);
    const baseSize = baseMargin * 2;
    this.baseR = baseMargin;

    const baseC = document.createElement("canvas");
    baseC.width = baseSize;
    baseC.height = baseSize;
    const bCtx = baseC.getContext("2d")!;
    const bcx = baseMargin;
    const bcy = baseMargin;

    const baseGrad = bCtx.createRadialGradient(bcx, bcy, r * 0.2, bcx, bcy, r * 1.15);
    baseGrad.addColorStop(0, "rgba(255, 215, 0, 0.10)");
    baseGrad.addColorStop(0.75, "rgba(255, 193, 7, 0.22)");
    baseGrad.addColorStop(1, "rgba(255, 152, 0, 0.0)");
    bCtx.fillStyle = baseGrad;
    bCtx.beginPath();
    bCtx.arc(bcx, bcy, r * 1.15, 0, Math.PI * 2);
    bCtx.fill();

    bCtx.strokeStyle = "rgba(255, 215, 0, 0.55)";
    bCtx.lineWidth = 4;
    bCtx.beginPath();
    bCtx.arc(bcx, bcy, r, 0, Math.PI * 2);
    bCtx.stroke();

    bCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
    bCtx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      bCtx.moveTo(bcx + Math.cos(ang) * r * 0.82 + 3.5, bcy + Math.sin(ang) * r * 0.82);
      bCtx.arc(bcx + Math.cos(ang) * r * 0.82, bcy + Math.sin(ang) * r * 0.82, 3.5, 0, Math.PI * 2);
    }
    bCtx.fill();
    this.baseCanvas = baseC;

    // Knob
    const kr = r * 0.46;
    const knobMargin = Math.ceil(kr * 1.4);
    const knobSize = knobMargin * 2;
    this.knobR = knobMargin;

    const knobC = document.createElement("canvas");
    knobC.width = knobSize;
    knobC.height = knobSize;
    const kCtx = knobC.getContext("2d")!;
    const kcx = knobMargin;
    const kcy = knobMargin;

    const knobGrad = kCtx.createRadialGradient(kcx - kr * 0.35, kcy - kr * 0.35, kr * 0.1, kcx, kcy, kr);
    knobGrad.addColorStop(0, "rgba(255, 138, 128, 0.95)");
    knobGrad.addColorStop(0.6, "rgba(229, 57, 53, 0.9)");
    knobGrad.addColorStop(1, "rgba(183, 28, 28, 0.9)");
    kCtx.fillStyle = knobGrad;
    kCtx.beginPath();
    kCtx.arc(kcx, kcy, kr, 0, Math.PI * 2);
    kCtx.fill();

    kCtx.strokeStyle = "#FFD700";
    kCtx.lineWidth = 3;
    kCtx.stroke();

    kCtx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    kCtx.lineWidth = 2;
    kCtx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI) / 3;
      const xOff = Math.cos(ang) * kr * 0.5;
      const yOff = Math.sin(ang) * kr * 0.5;
      kCtx.moveTo(kcx - xOff, kcy - yOff);
      kCtx.lineTo(kcx + xOff, kcy + yOff);
    }
    kCtx.stroke();
    this.knobCanvas = knobC;
  }

  constructor(
    canvas: HTMLCanvasElement,
    getLogicalSize: () => { width: number; height: number },
    radius: number = 70,
    deadZone: number = 0.12
  ) {
    this.canvas = canvas;
    this.getLogicalSize = getLogicalSize;
    this.radius = radius;
    this.deadZone = deadZone;
  }

  public get x(): number { return this.outX; }
  public get y(): number { return this.outY; }
  public get magnitude(): number { return this.outMag; }
  public get angle(): number { return Math.atan2(this.outY, this.outX); }
  /** true si hay un pulgar controlando el joystick */
  public get active(): boolean { return this.pointerId !== null; }

  public attach(): void {
    if (this.attached) return;
    this.attached = true;
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  public detach(): void {
    if (!this.attached) return;
    this.attached = false;
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.reset();
  }

  public reset(): void {
    this.pointerId = null;
    this.keys = { up: false, down: false, left: false, right: false };
    this.outX = 0;
    this.outY = 0;
    this.outMag = 0;
    this.appearAlpha = 0;
  }

  /** Convierte coordenadas de cliente a coordenadas lógicas del canvas */
  private toLogical(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const size = this.getLogicalSize();
    const sx = rect.width > 0 ? size.width / rect.width : 1;
    const sy = rect.height > 0 ? size.height / rect.height : 1;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    const p = this.toLogical(e.clientX, e.clientY);
    this.baseX = this.knobX = p.x;
    this.baseY = this.knobY = p.y;
    this.recompute();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    const p = this.toLogical(e.clientX, e.clientY);
    let dx = p.x - this.baseX;
    let dy = p.y - this.baseY;
    const d = Math.hypot(dx, dy);
    if (d > this.radius) {
      dx = (dx / d) * this.radius;
      dy = (dy / d) * this.radius;
    }
    this.knobX = this.baseX + dx;
    this.knobY = this.baseY + dy;
    this.recompute();
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.recompute();
  };

  private setKey(key: string, value: boolean): boolean {
    switch (key) {
      case "ArrowUp": case "w": case "W": this.keys.up = value; return true;
      case "ArrowDown": case "s": case "S": this.keys.down = value; return true;
      case "ArrowLeft": case "a": case "A": this.keys.left = value; return true;
      case "ArrowRight": case "d": case "D": this.keys.right = value; return true;
    }
    return false;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.setKey(e.key, true)) {
      e.preventDefault();
      this.recompute();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (this.setKey(e.key, false)) this.recompute();
  };

  private recompute(): void {
    // El toque prevalece sobre el teclado
    if (this.pointerId !== null) {
      const dx = (this.knobX - this.baseX) / this.radius;
      const dy = (this.knobY - this.baseY) / this.radius;
      const m = Math.min(1, Math.hypot(dx, dy));
      if (m < this.deadZone) {
        this.outX = this.outY = this.outMag = 0;
        return;
      }
      const n = Math.hypot(dx, dy);
      this.outX = dx / n;
      this.outY = dy / n;
      this.outMag = (m - this.deadZone) / (1 - this.deadZone);
      return;
    }

    const kx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const ky = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    const n = Math.hypot(kx, ky);
    if (n === 0) {
      this.outX = this.outY = this.outMag = 0;
    } else {
      this.outX = kx / n;
      this.outY = ky / n;
      this.outMag = 1;
    }
  }

  /** Dibuja el joystick flotante (solo mientras hay un pulgar activo) con sprites pre-renderizados */
  public draw(ctx: CanvasRenderingContext2D, dt: number = 1 / 60): void {
    const target = this.pointerId !== null ? 1 : 0;
    this.appearAlpha += (target - this.appearAlpha) * Math.min(1, dt * 14);
    if (this.appearAlpha < 0.02) return;

    this.ensureSprites();

    ctx.save();
    ctx.globalAlpha = this.appearAlpha;

    // Copia 1:1 de los sprites offscreen (Cero cálculo de curvas ni gradientes en tiempo real)
    ctx.drawImage(this.baseCanvas!, this.baseX - this.baseR, this.baseY - this.baseR);
    ctx.drawImage(this.knobCanvas!, this.knobX - this.knobR, this.knobY - this.knobR);

    ctx.restore();
  }
}
