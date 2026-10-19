/**
 * ==============================================================================
 * JUEGO: ¡SERPIENTE DE LUCES NAVIDEÑAS! (Christmas Lights Snake)
 * ==============================================================================
 *
 * Minijuego arcade clásico estilo Snake con temática festiva:
 * - Una guirnalda de bombillas navideñas de colores brillantes que avanza por el tapete festivo.
 * - Recoge galletas de jengibre, bastones de caramelo y estrellas doradas para alargar la guirnalda.
 * - Estrellas de Patrocinador Oficial (+250 pts y resplandor arcoíris).
 * - Controles táctiles versátiles (D-Pad virtual inferior, deslizamiento táctil y teclado).
 * - Sistema accesible para niños (chocar contra el propio cuerpo reduce longitud con sonido cómico,
 *   sin interrumpir los 60s de la partida).
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";

interface SnakeSegment {
  x: number;
  y: number;
  color: string;
}

interface FoodItem {
  x: number;
  y: number;
  type: "cookie" | "star" | "sponsor";
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
}

export class ChristmasSnakeGame extends BaseGame {
  // Sprites
  private bgImage: HTMLImageElement;
  private fairLogo: HTMLImageElement;
  private sponsorLogos: { name: string; logo: HTMLImageElement }[] = [];

  // Tablero de Snake
  private gridCols: number = 20;
  private gridRows: number = 20;
  private cellSize: number = 24;
  private boardX: number = 0;
  private boardY: number = 0;

  // Serpiente de Luces
  private snake: SnakeSegment[] = [];
  private dirX: number = 1;
  private dirY: number = 0;
  private nextDirX: number = 1;
  private nextDirY: number = 0;
  private stepTimer: number = 0;
  private stepInterval: number = 0.15; // Velocidad de avance

  // Comida
  private food: FoodItem | null = null;
  private readonly bulbColors = ["#FF1744", "#00E676", "#FFD700", "#00E5FF", "#D500F9"];

  // Combos
  private combo: number = 0;
  private maxCombo: number = 0;

  // Botones táctiles virtuales (D-Pad en pantalla para kioscos)
  private btnUp = { x: 0, y: 0, w: 54, h: 44 };
  private btnDown = { x: 0, y: 0, w: 54, h: 44 };
  private btnLeft = { x: 0, y: 0, w: 54, h: 44 };
  private btnRight = { x: 0, y: 0, w: 54, h: 44 };

  // Animaciones
  private animClock: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "christmas-snake",
      "¡Serpiente de Luces Navideñas!",
      "¡Guía la guirnalda de luces navideñas para recoger galletas de jengibre y estrellas!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Deck The Halls.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImage = this.loadImage("./assets/images/fondo-nieve.webp");
    this.fairLogo = this.loadImage("./assets/logos/clean-feria-magica.png");

    this.sponsorLogos = [
      { name: "Campuslands", logo: this.loadImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.loadImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.loadImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.fairLogo }
    ];

    this.computeBoardLayout();
  }

  private loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.stepTimer = 0;

    this.computeBoardLayout();
    this.initSnake();
    this.spawnFood();

    // Controles táctiles
    this.input.onTap = (x: number, y: number) => {
      this.handleTouchTap(x, y);
    };

    window.addEventListener("keydown", this.handleKeyDown);

    this.addFloatingText("¡ENCIENDE LAS LUCES!", this.width * 0.5, this.height * 0.4, "#FFD700", 1.5);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    this.input.onTap = undefined;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeBoardLayout();
  }

  private computeBoardLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;

    const isLandscape = w >= h;
    const availableW = Math.min(w * 0.9, isLandscape ? h * 0.72 : w * 0.94);
    const availableH = Math.min(h * 0.62, availableW);

    this.gridCols = 18;
    this.gridRows = 18;
    this.cellSize = Math.floor(Math.min(availableW / this.gridCols, availableH / this.gridRows));
    this.cellSize = Math.max(18, Math.min(32, this.cellSize));

    const boardTotalW = this.gridCols * this.cellSize;
    const boardTotalH = this.gridRows * this.cellSize;
    this.boardX = (w - boardTotalW) / 2;
    this.boardY = Math.max(86, h * 0.16 + (availableH - boardTotalH) / 2);

    // D-Pad virtual inferior
    const dpadCenterX = w * 0.5;
    const dpadCenterY = Math.min(h - 48, this.boardY + boardTotalH + 52);
    const btnSize = Math.min(52, Math.max(40, w * 0.12));

    this.btnUp = { x: dpadCenterX - btnSize / 2, y: dpadCenterY - btnSize - 6, w: btnSize, h: btnSize };
    this.btnDown = { x: dpadCenterX - btnSize / 2, y: dpadCenterY + 6, w: btnSize, h: btnSize };
    this.btnLeft = { x: dpadCenterX - btnSize * 1.5 - 6, y: dpadCenterY - btnSize / 2, w: btnSize, h: btnSize };
    this.btnRight = { x: dpadCenterX + btnSize * 0.5 + 6, y: dpadCenterY - btnSize / 2, w: btnSize, h: btnSize };
  }

  private initSnake(): void {
    const startX = Math.floor(this.gridCols / 2);
    const startY = Math.floor(this.gridRows / 2);

    this.snake = [
      { x: startX, y: startY, color: "#FFD700" },
      { x: startX - 1, y: startY, color: "#FF1744" },
      { x: startX - 2, y: startY, color: "#00E676" },
      { x: startX - 3, y: startY, color: "#00E5FF" }
    ];

    this.dirX = 1;
    this.dirY = 0;
    this.nextDirX = 1;
    this.nextDirY = 0;
  }

  private spawnFood(): void {
    let fx = 0;
    let fy = 0;
    let valid = false;

    // Buscar celda vacía
    for (let attempts = 0; attempts < 100; attempts++) {
      fx = Math.floor(Math.random() * this.gridCols);
      fy = Math.floor(Math.random() * this.gridRows);
      const onSnake = this.snake.some((s) => s.x === fx && s.y === fy);
      if (!onSnake) {
        valid = true;
        break;
      }
    }

    if (!valid) return;

    const rand = Math.random();
    if (rand < 0.28 && this.sponsorLogos.length > 0) {
      const sp = this.sponsorLogos[Math.floor(Math.random() * this.sponsorLogos.length)];
      this.food = {
        x: fx,
        y: fy,
        type: "sponsor",
        sponsorName: sp.name,
        sponsorLogo: sp.logo
      };
    } else if (rand < 0.55) {
      this.food = { x: fx, y: fy, type: "star" };
    } else {
      this.food = { x: fx, y: fy, type: "cookie" };
    }
  }

  // ==========================================================================
  // CONTROLES
  // ==========================================================================
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && this.dirY !== 1) {
      this.nextDirX = 0;
      this.nextDirY = -1;
      this.audio.playTap();
    }
    if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && this.dirY !== -1) {
      this.nextDirX = 0;
      this.nextDirY = 1;
      this.audio.playTap();
    }
    if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && this.dirX !== 1) {
      this.nextDirX = -1;
      this.nextDirY = 0;
      this.audio.playTap();
    }
    if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && this.dirX !== -1) {
      this.nextDirX = 1;
      this.nextDirY = 0;
      this.audio.playTap();
    }
  };

  private handleTouchTap(x: number, y: number): void {
    const checkBtn = (btn: { x: number; y: number; w: number; h: number }) => {
      return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    };

    if (checkBtn(this.btnUp) && this.dirY !== 1) {
      this.nextDirX = 0;
      this.nextDirY = -1;
      this.audio.playTap();
      return;
    }
    if (checkBtn(this.btnDown) && this.dirY !== -1) {
      this.nextDirX = 0;
      this.nextDirY = 1;
      this.audio.playTap();
      return;
    }
    if (checkBtn(this.btnLeft) && this.dirX !== 1) {
      this.nextDirX = -1;
      this.nextDirY = 0;
      this.audio.playTap();
      return;
    }
    if (checkBtn(this.btnRight) && this.dirX !== -1) {
      this.nextDirX = 1;
      this.nextDirY = 0;
      this.audio.playTap();
      return;
    }

    // Toque en el tablero: orientar hacia la posición tocada
    const head = this.snake[0];
    if (head) {
      const headPxX = this.boardX + (head.x + 0.5) * this.cellSize;
      const headPxY = this.boardY + (head.y + 0.5) * this.cellSize;
      const dx = x - headPxX;
      const dy = y - headPxY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && this.dirX !== -1) {
          this.nextDirX = 1;
          this.nextDirY = 0;
        } else if (dx < 0 && this.dirX !== 1) {
          this.nextDirX = -1;
          this.nextDirY = 0;
        }
      } else {
        if (dy > 0 && this.dirY !== -1) {
          this.nextDirX = 0;
          this.nextDirY = 1;
        } else if (dy < 0 && this.dirY !== 1) {
          this.nextDirX = 0;
          this.nextDirY = -1;
        }
      }
    }
  }

  // ==========================================================================
  // ACTUALIZACIÓN DE FÍSICAS A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animClock += dt;

    this.stepTimer += dt;
    if (this.stepTimer >= this.stepInterval) {
      this.stepTimer = 0;
      this.advanceSnake();
    }
  }

  private advanceSnake(): void {
    this.dirX = this.nextDirX;
    this.dirY = this.nextDirY;

    const head = this.snake[0];
    if (!head) return;

    let nextX = head.x + this.dirX;
    let nextY = head.y + this.dirY;

    // Envoltura pacífica en los bordes
    if (nextX < 0) nextX = this.gridCols - 1;
    else if (nextX >= this.gridCols) nextX = 0;
    if (nextY < 0) nextY = this.gridRows - 1;
    else if (nextY >= this.gridRows) nextY = 0;

    // Comprobar colisión consigo misma
    const selfHit = this.snake.slice(1).some((s) => s.x === nextX && s.y === nextY);
    if (selfHit) {
      // Tropiezo cómico: pierde 2 segmentos pero no muere
      if (this.snake.length > 3) {
        this.snake.pop();
        this.snake.pop();
      }
      this.combo = 0;
      this.audio.playElfHit();
      this.triggerShake(0.14, 4);
      this.addFloatingText("¡TROPIEZO!", this.boardX + nextX * this.cellSize, this.boardY + nextY * this.cellSize, "#FF1744", 1.1);
      return;
    }

    // Nuevo segmento de cabeza
    const color = this.bulbColors[this.snake.length % this.bulbColors.length];
    this.snake.unshift({ x: nextX, y: nextY, color });

    // Comprobar si comió la comida
    if (this.food && nextX === this.food.x && nextY === this.food.y) {
      const foodItem = this.food;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const px = this.boardX + (nextX + 0.5) * this.cellSize;
      const py = this.boardY + (nextY + 0.5) * this.cellSize;

      if (foodItem.type === "sponsor") {
        const bonus = 250;
        this.score += bonus;
        this.audio.playPowerUp();
        this.triggerShake(0.18, 5);
        this.particles.emitConfetti(this.width, 25);
        this.addFloatingText(`★ ¡${foodItem.sponsorName?.toUpperCase() || "OFICIAL"}! +${bonus} ★`, px, py - 20, "#FFD700", 1.4);
      } else if (foodItem.type === "star") {
        const pts = 150;
        this.score += pts;
        this.audio.playCatchItem(1.2);
        this.particles.emitBurst(px, py, "#FFD700", 14);
        this.addFloatingText(`+${pts}`, px, py - 18, "#FFD700", 1.2);
      } else {
        const pts = 100;
        this.score += pts;
        this.audio.playCatchItem(1.0 + (this.combo % 6) * 0.06);
        this.particles.emitBurst(px, py, "#00E676", 10);
        this.addFloatingText(`+${pts}`, px, py - 18, "#FFD700", 1.1);
      }

      this.spawnFood();
    } else {
      // Avanzar normalmente quitando la cola
      this.snake.pop();
    }
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo invernal
    if (this.bgImage && this.bgImage.complete) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#081329");
      grad.addColorStop(0.5, "#102347");
      grad.addColorStop(1, "#E8F0FE");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Tablero de juego
    this.drawBoard(ctx);

    // 3. Comida (galleta, estrella o patrocinador)
    this.drawFood(ctx);

    // 4. Guirnalda de luces (Snake)
    this.drawSnake(ctx);

    // 5. Partículas
    this.particles.draw(ctx, true);

    // 6. D-Pad táctil inferior y HUD
    this.drawDPadAndHUD(ctx);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const w = this.gridCols * this.cellSize;
    const h = this.gridRows * this.cellSize;

    // Marco de madera noble
    ctx.fillStyle = "#3E2723";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    this.roundRect(ctx, this.boardX - 8, this.boardY - 8, w + 16, h + 16, 16);
    ctx.fill();
    ctx.stroke();

    // Tapete de juego (verde pino profundo)
    ctx.fillStyle = "#0A2818";
    this.roundRect(ctx, this.boardX, this.boardY, w, h, 12);
    ctx.fill();

    // Rejilla sutil decorativa
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let c = 1; c < this.gridCols; c++) {
      ctx.beginPath();
      ctx.moveTo(this.boardX + c * this.cellSize, this.boardY);
      ctx.lineTo(this.boardX + c * this.cellSize, this.boardY + h);
      ctx.stroke();
    }
    for (let r = 1; r < this.gridRows; r++) {
      ctx.beginPath();
      ctx.moveTo(this.boardX, this.boardY + r * this.cellSize);
      ctx.lineTo(this.boardX + w, this.boardY + r * this.cellSize);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawFood(ctx: CanvasRenderingContext2D): void {
    if (!this.food) return;

    ctx.save();
    const cx = this.boardX + (this.food.x + 0.5) * this.cellSize;
    const cy = this.boardY + (this.food.y + 0.5) * this.cellSize;
    const s = this.cellSize * 0.75;

    ctx.translate(cx, cy);

    if (this.food.type === "sponsor") {
      // Medallón de patrocinador
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (this.food.sponsorLogo && this.food.sponsorLogo.complete) {
        const logoSize = s * 0.95;
        ctx.drawImage(this.food.sponsorLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
      }
    } else if (this.food.type === "star") {
      // Estrella dorada resplandeciente
      ctx.fillStyle = "#FFD700";
      ctx.font = `900 ${Math.max(14, s)}px 'Fredoka', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", 0, 0);
    } else {
      // Galleta de jengibre navideña
      ctx.fillStyle = "#D7CCC8";
      ctx.font = `900 ${Math.max(13, s * 0.9)}px 'Fredoka', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍪", 0, 0);
    }

    ctx.restore();
  }

  private drawSnake(ctx: CanvasRenderingContext2D): void {
    if (this.snake.length === 0) return;

    ctx.save();

    // Línea de cable que une las bombillas
    ctx.strokeStyle = "#1B5E20";
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.snake.forEach((seg, i) => {
      const sx = this.boardX + (seg.x + 0.5) * this.cellSize;
      const sy = this.boardY + (seg.y + 0.5) * this.cellSize;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    // Bombillas individuales
    this.snake.forEach((seg, i) => {
      const sx = this.boardX + (seg.x + 0.5) * this.cellSize;
      const sy = this.boardY + (seg.y + 0.5) * this.cellSize;
      const r = this.cellSize * 0.38;

      if (i === 0) {
        // Cabeza con gorro navideño
        ctx.fillStyle = "#FFEB3B";
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ojos sonrientes
        ctx.fillStyle = "#212121";
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 2, 2, 0, Math.PI * 2);
        ctx.arc(sx + 3, sy - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Gorro navideño diminuto
        ctx.fillStyle = "#D50000";
        ctx.beginPath();
        ctx.moveTo(sx - r * 0.7, sy - r * 0.5);
        ctx.lineTo(sx + r * 0.7, sy - r * 0.5);
        ctx.lineTo(sx, sy - r * 1.5);
        ctx.closePath();
        ctx.fill();
      } else {
        // Bombilla del cuerpo con halo luminoso
        const pulse = Math.sin(this.animClock * 6 + i) * 0.15;
        ctx.fillStyle = seg.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r * (0.85 + pulse), 0, Math.PI * 2);
        ctx.fill();

        // Brillo blanco interior
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(sx - r * 0.25, sy - r * 0.25, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  private drawDPadAndHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // D-Pad botones
    const drawBtn = (btn: { x: number; y: number; w: number; h: number }, label: string) => {
      ctx.fillStyle = "rgba(30, 45, 75, 0.92)";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 16px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    };

    drawBtn(this.btnUp, "▲");
    drawBtn(this.btnDown, "▼");
    drawBtn(this.btnLeft, "◀");
    drawBtn(this.btnRight, "▶");

    // HUD de Longitud y Racha
    if (this.combo >= 2) {
      const tagW = 120;
      const tagH = 26;
      const tagX = (this.width - tagW) / 2;
      const tagY = 72;

      ctx.fillStyle = "rgba(10, 22, 45, 0.9)";
      ctx.strokeStyle = "#FF9100";
      ctx.lineWidth = 2;
      this.roundRect(ctx, tagX, tagY, tagW, tagH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FF9100";
      ctx.font = "900 12px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`¡RACHA x${this.combo}!`, this.width / 2, tagY + 13);
    }

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
