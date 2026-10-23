/**
 * ==============================================================================
 * MINIJUEGO: ¡JUGUETERÍA MÁGICA! (Magical Toy Shop Match-3 Puzzle)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Mecánica:
 * - Tablero vitrina de madera y oro de 6x6 casillas repleto de juguetes y
 *   adornos ilustrados 2D (Osito, Robot, Cochecito, Regalo Dorado, Esfera Roja,
 *   Esfera Azul).
 * - Toca o arrastra dos casillas vecinas para intercambiarlas y formar líneas
 *   de 3, 4 o 5 juguetes iguales.
 * - Unir 4 o más crea una Estrella Explosiva de Patrocinador que despeja toda
 *   su fila y columna con lluvia de puntos.
 */

import { BaseGame } from "../core/BaseGame";
import type { AudioManager } from "../core/AudioManager";
import type { InputManager } from "../core/InputManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import {
  imgReady,
  roundRectPath,
  makeSkyStars,
  drawNightSky,
  drawPill
} from "./shared/gameDraw";

interface SponsorInfo {
  id: string;
  name: string;
  logo: HTMLImageElement;
}

interface TileCell {
  kind: number;
  visualX: number;
  visualY: number;
  scale: number;
  isBomb: boolean;
  sponsor?: SponsorInfo;
}

const GRID_SIZE = 6;
const TILE_KINDS = 6;

const KIND_COLORS = [
  "#FF9100", // 0: Osito
  "#00E5FF", // 1: Robot
  "#FF2A4D", // 2: Cochecito
  "#FFD700", // 3: Regalo Dorado
  "#FF5252", // 4: Esfera Roja
  "#448AFF"  // 5: Esfera Azul
];

function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (!imgReady(img)) return;
  const ratio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  const dw = ratio >= boxRatio ? w : h * ratio;
  const dh = ratio >= boxRatio ? w / ratio : h;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export class ToyMatchGame extends BaseGame {
  private grid: (TileCell | null)[][] = [];
  private selectedCell: { r: number; c: number } | null = null;
  private dragStartCell: { r: number; c: number; px: number; py: number } | null = null;

  private busyTimer = 0;
  private idleHintTimer = 0;
  private combo = 0;
  private hintPair: [{ r: number; c: number }, { r: number; c: number }] | null = null;

  private skyStars = makeSkyStars(42);

  // Assets 2D
  private bgImg: HTMLImageElement;
  private tileSprites: HTMLImageElement[] = [];
  private starImg: HTMLImageElement;
  private sponsors: SponsorInfo[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "toy-match",
      "¡Juguetería Mágica!",
      "¡Intercambia juguetes vecinos en la vitrina mágica para formar líneas de 3, 4 o 5 iguales!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Joy to the world.mp3";
    this.inGameMusicVolume = 0.42;

    this.bgImg = this.getImage("./assets/images/fondo-habitacion.webp");
    this.tileSprites = [
      this.getImage("./assets/images/osito.png"),
      this.getImage("./assets/images/robot.png"),
      this.getImage("./assets/images/coche-juguete.png"),
      this.getImage("./assets/images/regalo-estilizado-dorado.png"),
      this.getImage("./assets/images/bola-roja.webp"),
      this.getImage("./assets/images/bola-azul.webp")
    ];
    this.starImg = this.getImage("./assets/images/estrella con logo.png");

    this.sponsors = [
      { id: "campus", name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.webp") },
      { id: "cajasan", name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.webp") },
      { id: "imebu", name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.webp") },
      { id: "feria", name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.webp") }
    ];
  }

  protected onStart(): void {
    this.selectedCell = null;
    this.dragStartCell = null;
    this.busyTimer = 0;
    this.idleHintTimer = 0;
    this.combo = 0;
    this.showLives = false;

    this.generateInitialBoard();
    this.hintPair = this.findAvailableMove();

    this.input.onPointerDown = (_id: number, px: number, py: number) => {
      if (this.busyTimer > 0) return;
      const metrics = this.getBoardMetrics();

      const shufBtn = this.getShuffleButtonRect(metrics);
      if (
        px >= shufBtn.x &&
        px <= shufBtn.x + shufBtn.w &&
        py >= shufBtn.y &&
        py <= shufBtn.y + shufBtn.h
      ) {
        this.shuffleBoard(true);
        return;
      }

      const cellCoord = this.pixelToCell(px, py, metrics);
      if (cellCoord) {
        this.audio.playTap();
        this.dragStartCell = { r: cellCoord.r, c: cellCoord.c, px, py };

        const tappedTile = this.grid[cellCoord.r]?.[cellCoord.c];
        if (tappedTile?.isBomb) {
          this.detonateSponsorBomb(cellCoord.r, cellCoord.c, metrics);
          return;
        }

        if (this.selectedCell) {
          const dr = Math.abs(this.selectedCell.r - cellCoord.r);
          const dc = Math.abs(this.selectedCell.c - cellCoord.c);
          if (dr + dc === 1) {
            this.trySwap(this.selectedCell.r, this.selectedCell.c, cellCoord.r, cellCoord.c, metrics);
            this.selectedCell = null;
            this.dragStartCell = null;
            return;
          }
        }
        this.selectedCell = cellCoord;
      }
    };

    this.input.onPointerMove = (_id: number, px: number, py: number) => {
      if (this.busyTimer > 0 || !this.dragStartCell) return;
      const metrics = this.getBoardMetrics();
      const dx = px - this.dragStartCell.px;
      const dy = py - this.dragStartCell.py;
      const threshold = metrics.cellSize * 0.36;
      if (Math.hypot(dx, dy) >= threshold) {
        let tr = this.dragStartCell.r;
        let tc = this.dragStartCell.c;
        if (Math.abs(dx) > Math.abs(dy)) {
          tc += dx > 0 ? 1 : -1;
        } else {
          tr += dy > 0 ? 1 : -1;
        }
        if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
          this.trySwap(this.dragStartCell.r, this.dragStartCell.c, tr, tc, metrics);
        }
        this.selectedCell = null;
        this.dragStartCell = null;
      }
    };

    this.input.onPointerUp = () => {
      this.dragStartCell = null;
    };

    this.addFloatingText("¡UNE 3 JUGUETES!", this.width / 2, this.height * 0.45, "#FFD700", 1.35);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
    this.input.onPointerUp = undefined;
  }

  private getBoardMetrics() {
    const w = this.width || 1024;
    const h = this.height || 768;
    const availH = h - 185;
    const availW = w - 60;
    const boardPx = Math.min(availW, availH, 520);
    const cellSize = boardPx / GRID_SIZE;
    const boardX = (w - boardPx) / 2;
    const boardY = 118 + (availH - boardPx) / 2;
    return { w, h, boardPx, cellSize, boardX, boardY };
  }

  private generateInitialBoard(): void {
    this.grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: (TileCell | null)[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let kind = Math.floor(Math.random() * TILE_KINDS);
        while (
          (c >= 2 && row[c - 1]?.kind === kind && row[c - 2]?.kind === kind) ||
          (r >= 2 && this.grid[r - 1][c]?.kind === kind && this.grid[r - 2][c]?.kind === kind)
        ) {
          kind = (kind + 1) % TILE_KINDS;
        }
        row.push({
          kind,
          visualX: c,
          visualY: r - GRID_SIZE * 0.6,
          scale: 1,
          isBomb: false
        });
      }
      this.grid.push(row);
    }

    if (!this.findAvailableMove()) {
      this.shuffleBoard(false);
    }
  }

  private shuffleBoard(showFeedback: boolean): void {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let kind = Math.floor(Math.random() * TILE_KINDS);
        while (
          (c >= 2 && this.grid[r][c - 1]?.kind === kind && this.grid[r][c - 2]?.kind === kind) ||
          (r >= 2 && this.grid[r - 1][c]?.kind === kind && this.grid[r - 2][c]?.kind === kind)
        ) {
          kind = (kind + 1) % TILE_KINDS;
        }
        this.grid[r][c] = {
          kind,
          visualX: c,
          visualY: r - 1.5,
          scale: 0.7,
          isBomb: false
        };
      }
    }
    this.selectedCell = null;
    this.hintPair = this.findAvailableMove();
    if (showFeedback) {
      this.audio.playPowerUp();
      this.addFloatingText("¡VITRINA MEZCLADA!", this.width / 2, this.height / 2, "#00E5FF", 1.2);
    }
  }

  protected onUpdate(dt: number): void {
    const metrics = this.getBoardMetrics();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r]?.[c];
        if (!cell) continue;
        cell.visualX += (c - cell.visualX) * Math.min(1, dt * 16);
        cell.visualY += (r - cell.visualY) * Math.min(1, dt * 16);
        cell.scale += (1 - cell.scale) * Math.min(1, dt * 14);
      }
    }

    if (this.busyTimer > 0) {
      this.busyTimer = Math.max(0, this.busyTimer - dt);
      if (this.busyTimer === 0) {
        this.resolveCascades(metrics);
      }
      return;
    }

    this.idleHintTimer += dt;
  }

  private pixelToCell(
    px: number,
    py: number,
    metrics: { boardX: number; boardY: number; boardPx: number; cellSize: number }
  ): { r: number; c: number } | null {
    if (
      px < metrics.boardX ||
      px > metrics.boardX + metrics.boardPx ||
      py < metrics.boardY ||
      py > metrics.boardY + metrics.boardPx
    ) {
      return null;
    }
    const c = Math.floor((px - metrics.boardX) / metrics.cellSize);
    const r = Math.floor((py - metrics.boardY) / metrics.cellSize);
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
    return { r, c };
  }

  private trySwap(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    metrics: { boardX: number; boardY: number; cellSize: number }
  ): void {
    const a = this.grid[r1][c1];
    const b = this.grid[r2][c2];
    if (!a || !b) return;

    this.grid[r1][c1] = b;
    this.grid[r2][c2] = a;

    if (a.isBomb) {
      this.detonateSponsorBomb(r2, c2, metrics);
      return;
    }
    if (b.isBomb) {
      this.detonateSponsorBomb(r1, c1, metrics);
      return;
    }

    const matches = this.findAllMatches();
    if (matches.size === 0) {
      this.grid[r1][c1] = a;
      this.grid[r2][c2] = b;
      a.scale = 0.82;
      b.scale = 0.82;
      this.combo = 0;
      this.audio.playElfHit();
      return;
    }

    this.idleHintTimer = 0;
    this.processMatches(matches, { r: r2, c: c2 }, metrics);
  }

  private detonateSponsorBomb(
    br: number,
    bc: number,
    metrics: { boardX: number; boardY: number; cellSize: number }
  ): void {
    const bombTile = this.grid[br][bc];
    const sponsor = bombTile?.sponsor || this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
    this.idleHintTimer = 0;
    this.selectedCell = null;

    const toClear = new Set<string>();
    for (let i = 0; i < GRID_SIZE; i++) {
      toClear.add(`${br},${i}`);
      toClear.add(`${i},${bc}`);
    }

    this.combo++;
    const pts = 450;
    this.addScore(pts);
    this.triggerLogoPowerUp(sponsor.id, 6);
    this.triggerShake(0.26, 8);

    const cx = metrics.boardX + (bc + 0.5) * metrics.cellSize;
    const cy = metrics.boardY + (br + 0.5) * metrics.cellSize;
    this.particles.emitBurst(cx, cy, "#FFD700", 24);
    this.addFloatingText(`¡EXPLOSIÓN ${sponsor.name.toUpperCase()}! +${pts}`, cx, cy, "#FFD700", 1.3);

    for (const key of toClear) {
      const [rStr, cStr] = key.split(",");
      const r = Number(rStr);
      const c = Number(cStr);
      this.grid[r][c] = null;
    }

    this.collapseAndRefill();
    this.busyTimer = 0.26;
  }

  private findAllMatches(): Set<string> {
    const matched = new Set<string>();

    for (let r = 0; r < GRID_SIZE; r++) {
      let run = 1;
      for (let c = 1; c <= GRID_SIZE; c++) {
        const prev = this.grid[r][c - 1];
        const curr = c < GRID_SIZE ? this.grid[r][c] : null;
        if (curr && prev && curr.kind === prev.kind) {
          run++;
        } else {
          if (run >= 3) {
            for (let k = c - run; k < c; k++) matched.add(`${r},${k}`);
          }
          run = 1;
        }
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      let run = 1;
      for (let r = 1; r <= GRID_SIZE; r++) {
        const prev = this.grid[r - 1][c];
        const curr = r < GRID_SIZE ? this.grid[r][c] : null;
        if (curr && prev && curr.kind === prev.kind) {
          run++;
        } else {
          if (run >= 3) {
            for (let k = r - run; k < r; k++) matched.add(`${k},${c}`);
          }
          run = 1;
        }
      }
    }

    return matched;
  }

  private processMatches(
    matches: Set<string>,
    pivot: { r: number; c: number } | null,
    metrics: { boardX: number; boardY: number; cellSize: number }
  ): void {
    this.combo++;
    const count = matches.size;
    const mult = Math.min(3.5, 1 + (this.combo - 1) * 0.25);
    const pts = Math.round(count * 45 * mult);
    this.addScore(pts);
    this.audio.playCatchItem(1.0 + Math.min(0.6, this.combo * 0.08));

    let sumX = 0;
    let sumY = 0;
    let sampleKind = 0;

    for (const key of matches) {
      const [rStr, cStr] = key.split(",");
      const r = Number(rStr);
      const c = Number(cStr);
      const px = metrics.boardX + (c + 0.5) * metrics.cellSize;
      const py = metrics.boardY + (r + 0.5) * metrics.cellSize;
      sumX += px;
      sumY += py;
      sampleKind = this.grid[r][c]?.kind ?? 0;
      this.particles.emitBurst(px, py, "#FFD700", 5);
      this.grid[r][c] = null;
    }

    if (count >= 4) {
      const target = pivot || { r: 2, c: 2 };
      const sponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
      this.grid[target.r][target.c] = {
        kind: sampleKind,
        visualX: target.c,
        visualY: target.r,
        scale: 1.35,
        isBomb: true,
        sponsor
      };
      this.audio.playPowerUp();
    }

    const cx = sumX / count;
    const cy = sumY / count;
    this.addFloatingText(
      this.combo > 1 ? `¡COMBO x${this.combo}! +${pts}` : `+${pts}`,
      cx,
      cy,
      KIND_COLORS[sampleKind] || "#FFD700",
      count >= 4 ? 1.25 : 1.05
    );

    this.collapseAndRefill();
    this.busyTimer = 0.24;
  }

  private collapseAndRefill(): void {
    for (let c = 0; c < GRID_SIZE; c++) {
      let writeRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          const tile = this.grid[r][c]!;
          this.grid[r][c] = null;
          this.grid[writeRow][c] = tile;
          writeRow--;
        }
      }
      let spawnOffset = 1;
      while (writeRow >= 0) {
        this.grid[writeRow][c] = {
          kind: Math.floor(Math.random() * TILE_KINDS),
          visualX: c,
          visualY: -spawnOffset,
          scale: 0.85,
          isBomb: false
        };
        writeRow--;
        spawnOffset++;
      }
    }
  }

  private resolveCascades(metrics: { boardX: number; boardY: number; cellSize: number }): void {
    const matches = this.findAllMatches();
    if (matches.size > 0) {
      this.processMatches(matches, null, metrics);
      return;
    }
    this.hintPair = this.findAvailableMove();
    if (!this.hintPair) {
      this.shuffleBoard(true);
    }
  }

  private findAvailableMove(): [{ r: number; c: number }, { r: number; c: number }] | null {
    const dirs = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 }
    ];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        for (const { dr, dc } of dirs) {
          const r2 = r + dr;
          const c2 = c + dc;
          if (r2 >= GRID_SIZE || c2 >= GRID_SIZE) continue;
          const a = this.grid[r][c];
          const b = this.grid[r2][c2];
          if (!a || !b) continue;
          this.grid[r][c] = b;
          this.grid[r2][c2] = a;
          const hasMatch = this.findAllMatches().size > 0;
          this.grid[r][c] = a;
          this.grid[r2][c2] = b;
          if (hasMatch) {
            return [
              { r, c },
              { r: r2, c: c2 }
            ];
          }
        }
      }
    }
    return null;
  }

  private getShuffleButtonRect(metrics: { w: number; boardX: number; boardY: number; boardPx: number }) {
    const bw = 190;
    const bh = 40;
    return {
      x: metrics.w / 2 - bw / 2,
      y: metrics.boardY + metrics.boardPx + 14,
      w: bw,
      h: bh
    };
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const metrics = this.getBoardMetrics();
    const { w, h, boardX, boardY, boardPx, cellSize } = metrics;
    const t = performance.now() * 0.001;

    drawNightSky(ctx, w, h, t, this.skyStars);
    if (imgReady(this.bgImg)) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(this.bgImg, 0, 0, w, h);
      ctx.restore();
    }

    // Marco de madera tallada y oro de la vitrina 6x6
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    const frameGrad = ctx.createLinearGradient(boardX - 14, boardY - 14, boardX, boardY + boardPx + 14);
    frameGrad.addColorStop(0, "#5D2906");
    frameGrad.addColorStop(0.5, "#3E1B04");
    frameGrad.addColorStop(1, "#260F02");
    ctx.fillStyle = frameGrad;
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 5;
    roundRectPath(ctx, boardX - 14, boardY - 14, boardPx + 28, boardPx + 28, 22);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cx = boardX + c * cellSize;
        const cy = boardY + r * cellSize;
        const isEven = (r + c) % 2 === 0;
        ctx.fillStyle = isEven ? "rgba(24, 48, 88, 0.85)" : "rgba(14, 30, 62, 0.85)";
        ctx.strokeStyle = "rgba(255, 215, 0, 0.18)";
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, cx + 3, cy + 3, cellSize - 6, cellSize - 6, 12);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (this.idleHintTimer > 3.2 && this.hintPair) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 7);
      ctx.save();
      ctx.strokeStyle = `rgba(0, 230, 118, ${0.45 + pulse * 0.55})`;
      ctx.lineWidth = 4;
      for (const pos of this.hintPair) {
        const hx = boardX + pos.c * cellSize + 5;
        const hy = boardY + pos.r * cellSize + 5;
        roundRectPath(ctx, hx, hy, cellSize - 10, cellSize - 10, 12);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.selectedCell) {
      const sx = boardX + this.selectedCell.c * cellSize + 4;
      const sy = boardY + this.selectedCell.r * cellSize + 4;
      ctx.save();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      roundRectPath(ctx, sx, sy, cellSize - 8, cellSize - 8, 12);
      ctx.stroke();
      ctx.restore();
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = this.grid[r]?.[c];
        if (!tile) continue;

        const px = boardX + (tile.visualX + 0.5) * cellSize;
        const py = boardY + (tile.visualY + 0.5) * cellSize;
        const isSelected = this.selectedCell?.r === r && this.selectedCell?.c === c;
        const bounce = isSelected ? 1.12 + Math.sin(t * 9) * 0.05 : tile.scale;

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(bounce, bounce);

        const col = KIND_COLORS[tile.kind] || "#FFD700";
        ctx.fillStyle = tile.isBomb ? "rgba(255, 215, 0, 0.42)" : `${col}28`;
        ctx.strokeStyle = tile.isBomb ? "#FFD700" : `${col}88`;
        ctx.lineWidth = tile.isBomb ? 3 : 2;
        const pad = cellSize * 0.41;
        roundRectPath(ctx, -pad, -pad, pad * 2, pad * 2, 12);
        ctx.fill();
        ctx.stroke();

        const spr = tile.isBomb ? this.starImg : this.tileSprites[tile.kind];
        const sprSize = cellSize * 0.72;
        drawFitted(ctx, spr, -sprSize / 2, -sprSize / 2, sprSize, sprSize);

        if (tile.isBomb) {
          ctx.fillStyle = "#FFFDE7";
          ctx.font = "900 11px 'Fredoka', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("¡TOCA!", 0, pad - 4);
        }

        ctx.restore();
      }
    }

    const shuf = this.getShuffleButtonRect(metrics);
    ctx.save();
    const btnGrad = ctx.createLinearGradient(shuf.x, shuf.y, shuf.x, shuf.y + shuf.h);
    btnGrad.addColorStop(0, "#1E88E5");
    btnGrad.addColorStop(1, "#0D47A1");
    ctx.fillStyle = btnGrad;
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, shuf.x, shuf.y, shuf.w, shuf.h, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 13px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MEZCLAR VITRINA", shuf.x + shuf.w / 2, shuf.y + shuf.h / 2);
    ctx.restore();

    drawPill(ctx, "UNE 3 O MÁS JUGUETES IGUALES • 4+ CREA ESTRELLA EXPLOSIVA", w / 2, 76, "#FFD700", 420);
  }
}
