/**
 * ==============================================================================
 * JUEGO: ¡BURBUJAS DE ADORNOS! (Ornament Pop – Edición Deluxe Feria Mágica)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Características Deluxe:
 * - SIN LÍMITE DE TIEMPO (showTimer = false): ¡Juega a tu ritmo por niveles!
 * - 8 NIVELES CON DISEÑOS NAVIDEÑOS ÚNICOS:
 *   1. El Gran Pino Navideño
 *   2. La Campana Dorada
 *   3. La Estrella de Belén
 *   4. El Bastón de Caramelo
 *   5. El Muñeco de Nieve
 *   6. La Corona Real de Adviento
 *   7. El Regalo Sorpresa de Santa
 *   8. El Copo Glacial Mágico
 * - Cañón Lanzador Mágico articulado con retroceso físico ('canon-adornos-tubo.png'
 *   y 'canon-adornos-base.png').
 * - 5 Colores de Adornos Navideños ('bola-roja', 'bola-azul', 'bola-verde',
 *   'bola-amarilla' y 'bola-morada' Amatista Real).
 * - 4 Esferas Especiales:
 *   1. Esfera Estrella Arcoíris ('bola-arcoiris.png'): Comodín que revienta todos
 *      los colores vecinos.
 *   2. Bola Bomba de Confeti ('bola-bomba.png'): Detona en radio de 2 anillos.
 *   3. Esfera Rayo Boreal ('bola-rayo.png'): Limpia toda la fila horizontal.
 *   4. Esfera Dorada de Patrocinador: Súper explosión solar (+420 pts).
 * - Canasta de Intercambio "CAMBIAR" con Elfo Ayudante: toca la canasta o pulsa
 *   [C / Shift / Espacio] para alternar la esfera actual con la siguiente.
 * - Cancelación segura de tiro: si arrastras el dedo hacia abajo del cañón,
 *   el disparo se cancela limpiamente sin disparar accidentalmente.
 * - Mira Láser Predictiva con Silueta Fantasma del hexágono exacto de encaje.
 * - 5 Cajas Colectoras de Regalos en la base (x2, x3, x5, x3, x2).
 * - Cero emojis.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import {
  drawNightSky,
  drawPill,
  drawSponsorMedallion,
  imgReady,
  makeSkyStars,
  roundRectPath
} from "./shared/gameDraw";
import type { SkyStar } from "./shared/gameDraw";

const COLS = 10;
const COLOR_HEX = ["#FF2A4D", "#2979FF", "#00E676", "#FFD700", "#B388FF"];

type SpecialKind = "none" | "rainbow" | "bomb" | "lightning" | "sponsor";

interface GridCell {
  color: number; // -1 = vacío, 0..4 = color base
  special: SpecialKind;
  sponsorIdx?: number;
}

interface LoadedAmmo {
  color: number;
  special: SpecialKind;
  sponsorIdx: number;
}

interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  special: SpecialKind;
  sponsorIdx: number;
  trail: { x: number; y: number }[];
}

interface Faller {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  color: number;
  special: SpecialKind;
}

interface PopFx {
  x: number;
  y: number;
  color: number;
  t: number;
}

interface ShockwaveFx {
  x: number;
  y: number;
  maxR: number;
  color: string;
  t: number;
}

interface LightningBeamFx {
  y: number;
  t: number;
}

interface CollectorBin {
  label: string;
  mult: number;
  basePts: number;
  color: string;
  bounce: number;
}

interface LevelBlueprint {
  name: string;
  grid: string[];
}

const LEVEL_BLUEPRINTS: LevelBlueprint[] = [
  {
    name: "NIVEL 1 • EL GRAN PINO NAVIDEÑO",
    grid: [
      "....$$....",
      "...GGGG...",
      "..GRYYRG..",
      ".GG!GG!GG.",
      "GGGBBBGGGG",
      "...YYYY..."
    ]
  },
  {
    name: "NIVEL 2 • LA CAMPANA DORADA",
    grid: [
      "..YYYYYY..",
      ".YYRYYRYY.",
      "YYYY~YYYYY",
      "YYBBYYBBYY",
      "YYYYYYYYYY",
      "....!!...."
    ]
  },
  {
    name: "NIVEL 3 • LA ESTRELLA DE BELÉN",
    grid: [
      "....**....",
      "..YYYYYY..",
      "YYRR**RRYY",
      ".YYGGGGYY.",
      "..YYYYYY..",
      "...!..!..."
    ]
  },
  {
    name: "NIVEL 4 • EL BASTÓN DE CARAMELO",
    grid: [
      "RR..RR..RR",
      ".RR..RR..R",
      "PPRRPPRRPP",
      ".PP~..~PP.",
      "PPRRPPRRPP",
      ".RR..RR..R"
    ]
  },
  {
    name: "NIVEL 5 • EL MUÑECO DE NIEVE",
    grid: [
      "...BBBB...",
      "..B!BB!B..",
      ".RRRRRRRR.",
      "..BB**BB..",
      ".BBBBBBBB.",
      "...BBBB..."
    ]
  },
  {
    name: "NIVEL 6 • LA CORONA REAL DE ADVIENTO",
    grid: [
      ".GGGGGGGG.",
      "GGRR..RRGG",
      "GG~....~GG",
      "GGPP..PPGG",
      ".GGGGGGGG.",
      "....$$...."
    ]
  },
  {
    name: "NIVEL 7 • EL REGALO SORPRESA DE SANTA",
    grid: [
      "RRRRYYRRRR",
      "RRRRYYRRRR",
      "YYYY!!YYYY",
      "RRRRYYRRRR",
      "RRRRYYRRRR",
      "...~..~..."
    ]
  },
  {
    name: "NIVEL 8 • EL COPO GLACIAL MÁGICO",
    grid: [
      "P..GGGG..P",
      ".P.Y**Y.P.",
      "..G~~~~G..",
      ".P.Y$$Y.P.",
      "P..GGGG..P",
      "...!!!!..."
    ]
  }
];

export class OrnamentPopGame extends BaseGame {
  private sprites: HTMLImageElement[] = [];
  private rainbowSprite!: HTMLImageElement;
  private bombSprite!: HTMLImageElement;
  private lightningSprite!: HTMLImageElement;
  private cannonBarrelSprite!: HTMLImageElement;
  private cannonBaseSprite!: HTMLImageElement;
  private bgVillageSprite!: HTMLImageElement;
  private elfHelperSprite!: HTMLImageElement;
  private giftBoxSprites: HTMLImageElement[] = [];
  private sponsors: { name: string; logo: HTMLImageElement }[] = [];
  private stars: SkyStar[] = makeSkyStars(85);

  // Tutorial interactivo
  public onOpenTutorial?: () => void;

  // Geometría del tablero
  private r = 28;
  private left = 0;
  private fieldTop = 96;
  private rowH = 48;
  private rowLimit = 10;
  private cannonX = 0;
  private cannonY = 0;
  private swapCenterX = 0;
  private swapCenterY = 0;

  // Rejilla hexagonal y niveles
  private grid: GridCell[][] = [];
  private shift = 0;
  private wave = 1;
  private currentLevelTitle = "NIVEL 1 • EL GRAN PINO NAVIDEÑO";

  // Disparo y munición
  private aim = 0;
  private shot: Shot | null = null;
  private curAmmo: LoadedAmmo = { color: 0, special: "none", sponsorIdx: 0 };
  private nextAmmo: LoadedAmmo = { color: 1, special: "none", sponsorIdx: 0 };
  private shotsFired = 0;
  private missCounter = 0;
  private readonly missLimit = 5;
  private aiming = false;
  private aimCancelled = false;
  private keyLeft = false;
  private keyRight = false;
  private cannonRecoil = 0;
  private swapAnim = 0;
  private ceilingDropOffset = 0;

  // Fiebre Estelar (0..100)
  private feverCharge = 0;

  // Efectos visuales y colectores inferiores
  private fallers: Faller[] = [];
  private pops: PopFx[] = [];
  private shockwaves: ShockwaveFx[] = [];
  private lightningBeams: LightningBeamFx[] = [];
  private bins: CollectorBin[] = [
    { label: "x2", mult: 2, basePts: 90, color: "#2979FF", bounce: 0 },
    { label: "x3", mult: 3, basePts: 140, color: "#00E676", bounce: 0 },
    { label: "x5", mult: 5, basePts: 250, color: "#FFD700", bounce: 0 },
    { label: "x3", mult: 3, basePts: 140, color: "#00E676", bounce: 0 },
    { label: "x2", mult: 2, basePts: 90, color: "#2979FF", bounce: 0 }
  ];

  private combo = 0;
  private ending = false;
  private animClock = 0;

  constructor(canvas: HTMLCanvasElement, input: InputManager, audio: AudioManager, particles: ParticleSystem) {
    super(
      "ornament-pop",
      "¡Burbujas de Adornos!",
      "¡Apunta con el Cañón Navideño, intercambia esferas y completa los 8 niveles de adornos mágicos!",
      canvas,
      input,
      audio,
      particles
    );

    // Sin límite de tiempo (el juego se rige por superar las formaciones o ser vencido en la línea de peligro)
    this.showTimer = false;
    this.lives = 1;
    this.maxLives = 1;
    this.showLives = false;

    this.inGameMusicPath = "./assets/audio/Joy to the world.mp3";
    this.inGameMusicVolume = 0.42;

    this.sprites = [
      this.getImage("./assets/images/bola-roja.png"),
      this.getImage("./assets/images/bola-azul.png"),
      this.getImage("./assets/images/bola-verde.png"),
      this.getImage("./assets/images/bola-amarilla.png"),
      this.getImage("./assets/images/bola-morada.png")
    ];
    this.rainbowSprite = this.getImage("./assets/images/bola-arcoiris.png");
    this.bombSprite = this.getImage("./assets/images/bola-bomba.png");
    this.lightningSprite = this.getImage("./assets/images/bola-rayo.png");
    this.cannonBarrelSprite = this.getImage("./assets/images/canon-adornos-tubo.png");
    this.cannonBaseSprite = this.getImage("./assets/images/canon-adornos-base.png");
    this.bgVillageSprite = this.getImage("./assets/images/fondo-nieve.png");
    this.elfHelperSprite = this.getImage("./assets/images/elfo-frente.png");
    this.giftBoxSprites = [
      this.getImage("./assets/images/regalo-azul.png"),
      this.getImage("./assets/images/regalo-verde.png"),
      this.getImage("./assets/images/regalo-rojo.png"),
      this.getImage("./assets/images/regalo-verde.png"),
      this.getImage("./assets/images/regalo-azul.png")
    ];

    this.sponsors = [
      { name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.png") }
    ];
  }

  // ==========================================================================
  // GEOMETRÍA
  // ==========================================================================
  private computeLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;
    this.fieldTop = 96;
    const avail = h - this.fieldTop - 16;

    let r = Math.min(Math.min(w * 0.94, 680) / (COLS * 2 + 1), 33);
    let limit = Math.floor((avail - 4.2 * r) / (r * 1.732));
    if (limit < 8) {
      r = avail / (8 * 1.732 + 4.2);
      limit = 8;
    }
    this.r = r;
    this.rowLimit = Math.min(limit, 13);
    this.rowH = r * 1.732;
    this.left = (w - (COLS * 2 + 1) * r) / 2;
    this.cannonX = w / 2;
    this.cannonY = this.fieldTop + this.rowLimit * this.rowH + r * 1.95;
    this.swapCenterX = this.cannonX - r * 4.4;
    this.swapCenterY = this.cannonY + r * 0.15;
  }

  private cellX(row: number, col: number): number {
    return this.left + this.r + col * 2 * this.r + (((row + this.shift) & 1) === 1 ? this.r : 0);
  }

  private cellY(row: number): number {
    return this.fieldTop + this.r + row * this.rowH + this.ceilingDropOffset;
  }

  private neighbors(row: number, col: number): [number, number][] {
    const p = (row + this.shift) & 1;
    const res: [number, number][] = [
      [row, col - 1],
      [row, col + 1]
    ];
    const cs = p === 0 ? [col - 1, col] : [col, col + 1];
    for (const c of cs) {
      res.push([row - 1, c]);
      res.push([row + 1, c]);
    }
    return res.filter(([rr, cc]) => rr >= 0 && cc >= 0 && cc < COLS);
  }

  private emptyCell(): GridCell {
    return { color: -1, special: "none" };
  }

  private ensureRow(row: number): void {
    while (this.grid.length <= row) {
      const arr: GridCell[] = [];
      for (let c = 0; c < COLS; c++) arr.push(this.emptyCell());
      this.grid.push(arr);
    }
  }

  private getCell(row: number, col: number): GridCell | null {
    if (row < 0 || row >= this.grid.length || col < 0 || col >= COLS) return null;
    return this.grid[row][col];
  }

  private isOccupied(row: number, col: number): boolean {
    const cell = this.getCell(row, col);
    return !!cell && (cell.color >= 0 || cell.special !== "none");
  }

  private lastOccupiedRow(): number {
    for (let r = this.grid.length - 1; r >= 0; r--) {
      if (this.grid[r].some((cell) => cell.color >= 0 || cell.special !== "none")) return r;
    }
    return -1;
  }

  private presentColors(): number[] {
    const set = new Set<number>();
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.color >= 0) set.add(cell.color);
      }
    }
    if (set.size > 0) return Array.from(set);
    return [0, 1, 2, 3, 4];
  }

  // ==========================================================================
  // CICLO DE VIDA Y CONTROLES
  // ==========================================================================
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = true;
    if (e.key === "c" || e.key === "C" || e.key === "Shift" || e.key === "ArrowDown") {
      this.swapAmmo();
      e.preventDefault();
    }
    if (e.key === " " || e.key === "ArrowUp") {
      this.fire();
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = false;
  };

  protected onStart(): void {
    this.showTimer = false;
    this.computeLayout();
    this.score = 0;
    this.combo = 0;
    this.wave = 1;
    this.feverCharge = 0;
    this.ending = false;
    this.animClock = 0;
    this.shot = null;
    this.fallers = [];
    this.pops = [];
    this.shockwaves = [];
    this.lightningBeams = [];
    this.shift = 0;
    this.shotsFired = 0;
    this.missCounter = 0;
    this.aim = 0;
    this.aiming = false;
    this.aimCancelled = false;
    this.keyLeft = false;
    this.keyRight = false;
    this.cannonRecoil = 0;
    this.swapAnim = 0;
    this.ceilingDropOffset = 0;
    this.lives = 1;
    this.maxLives = 1;
    this.showLives = false;

    this.grid = [];
    this.buildLevelGrid(this.wave);

    this.curAmmo = { color: this.randomPresentColor(), special: "none", sponsorIdx: 0 };
    this.nextAmmo = { color: this.randomPresentColor(), special: "none", sponsorIdx: 1 };

    this.input.onPointerDown = (_id: number, x: number, y: number) => {
      // 1. ¿Tocó la canasta de intercambio "CAMBIAR"?
      if (Math.hypot(x - this.swapCenterX, y - this.swapCenterY) <= this.r * 2.3) {
        this.swapAmmo();
        this.aiming = false;
        return;
      }

      // 2. ¿Tocó el botón de Guía / Tutorial?
      const helpX = this.left + (COLS * 2 + 1) * this.r - 28;
      const helpY = this.fieldTop - 32;
      if (Math.hypot(x - helpX, y - helpY) <= 24) {
        if (this.onOpenTutorial) this.onOpenTutorial();
        return;
      }

      // 3. Apuntado normal
      if (y < this.cannonY - this.r * 0.8) {
        this.aiming = true;
        this.aimCancelled = false;
        this.setAimFromPoint(x, y);
      }
    };

    this.input.onPointerMove = (_id: number, x: number, y: number) => {
      if (!this.aiming) return;
      // Si el jugador arrastra hacia abajo del cañón, cancela el tiro limpiamente
      if (y >= this.cannonY - this.r * 0.6) {
        this.aimCancelled = true;
      } else {
        this.aimCancelled = false;
        this.setAimFromPoint(x, y);
      }
    };

    this.input.onPointerUp = (_id: number, x: number, y: number) => {
      if (this.aiming && !this.aimCancelled) {
        this.setAimFromPoint(x, y);
        this.fire();
      }
      this.aiming = false;
      this.aimCancelled = false;
    };

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.addFloatingText(`¡${this.currentLevelTitle}!`, this.width * 0.5, this.height * 0.44, "#FFD700", 1.4);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
    this.input.onPointerUp = undefined;
    this.aiming = false;
    this.aimCancelled = false;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeLayout();
  }

  private buildLevelGrid(wave: number): void {
    const bp = LEVEL_BLUEPRINTS[(wave - 1) % LEVEL_BLUEPRINTS.length];
    const cycle = Math.floor((wave - 1) / LEVEL_BLUEPRINTS.length);
    this.currentLevelTitle = cycle > 0 ? `${bp.name} ★${cycle + 1}` : bp.name;

    this.grid = [];
    let sponsorIdx = wave;

    for (let r = 0; r < bp.grid.length; r++) {
      const rowStr = bp.grid[r];
      const row: GridCell[] = [];

      for (let c = 0; c < COLS; c++) {
        const ch = rowStr[c] || ".";
        if (ch === ".") {
          row.push(this.emptyCell());
          continue;
        }

        let color = 0;
        let special: SpecialKind = "none";

        if (ch === "$" || ch === "S") {
          special = "sponsor";
          color = 3;
        } else if (ch === "*" || ch === "W") {
          special = "rainbow";
          color = Math.floor(Math.random() * 5);
        } else if (ch === "!" || ch === "X") {
          special = "bomb";
          color = 0;
        } else if (ch === "~" || ch === "L") {
          special = "lightning";
          color = 1;
        } else if (ch === "R" || ch === "0") {
          color = 0;
        } else if (ch === "B" || ch === "1") {
          color = 1;
        } else if (ch === "G" || ch === "2") {
          color = 2;
        } else if (ch === "Y" || ch === "3") {
          color = 3;
        } else if (ch === "P" || ch === "4") {
          color = 4;
        } else {
          color = Math.floor(Math.random() * 4);
        }

        row.push({ color, special, sponsorIdx: special === "sponsor" ? sponsorIdx++ : undefined });
      }
      this.grid.push(row);
    }
  }

  private randomPresentColor(): number {
    const cols = this.presentColors();
    return cols[Math.floor(Math.random() * cols.length)];
  }

  private swapAmmo(): void {
    if (!this.isRunning || this.isGameOver || this.ending || this.shot) return;
    const tmp = this.curAmmo;
    this.curAmmo = this.nextAmmo;
    this.nextAmmo = tmp;
    this.swapAnim = 1;
    this.audio.playTap();
    this.particles.emitBurst(this.swapCenterX, this.swapCenterY, "#FFD700", 8);
  }

  // ==========================================================================
  // PUNTERÍA Y DISPARO
  // ==========================================================================
  private setAimFromPoint(x: number, y: number): void {
    if (this.ending) return;
    const dy = Math.min(this.cannonY - 26, y);
    let a = Math.atan2(x - this.cannonX, this.cannonY - dy);
    const max = 1.36;
    a = Math.max(-max, Math.min(max, a));
    this.aim = a;
  }

  private fire(): void {
    if (!this.isRunning || this.isGameOver || this.isFinishing || this.ending || this.shot) return;
    const speed = this.r * 45;
    const tipX = this.cannonX + Math.sin(this.aim) * this.r * 2.35;
    const tipY = this.cannonY - Math.cos(this.aim) * this.r * 2.35;
    this.shot = {
      x: tipX,
      y: tipY,
      vx: Math.sin(this.aim) * speed,
      vy: -Math.cos(this.aim) * speed,
      color: this.curAmmo.color,
      special: this.curAmmo.special,
      sponsorIdx: this.curAmmo.sponsorIdx,
      trail: []
    };
    this.cannonRecoil = 1;
    this.particles.emitBurst(tipX, tipY, "#FFD700", 10);
    this.audio.playWhoosh();
    this.shotsFired++;

    // Avanzar cargador
    this.curAmmo = this.nextAmmo;
    this.nextAmmo = this.generateNextAmmo();
  }

  private generateNextAmmo(): LoadedAmmo {
    // Si la Fiebre Estelar llegó al 100%, regala una Esfera Estrella Arcoíris, Bomba o Rayo
    if (this.feverCharge >= 100) {
      this.feverCharge = 0;
      const specials: SpecialKind[] = ["rainbow", "bomb", "lightning"];
      const picked = specials[this.shotsFired % specials.length];
      this.addFloatingText("¡ESFERA DE FIEBRE LISTA!", this.cannonX, this.cannonY - this.r * 3.4, "#00E5FF", 1.25);
      return {
        color: this.randomPresentColor(),
        special: picked,
        sponsorIdx: 0
      };
    }

    // Cada 8 disparos aparece una Bola Patrocinadora o Esfera Especial
    if (this.shotsFired % 8 === 7) {
      return {
        color: 3,
        special: "sponsor",
        sponsorIdx: Math.floor(Math.random() * this.sponsors.length)
      };
    }
    if (this.shotsFired % 6 === 5) {
      const cycle: SpecialKind[] = ["rainbow", "bomb", "lightning"];
      return {
        color: this.randomPresentColor(),
        special: cycle[Math.floor(this.shotsFired / 6) % cycle.length],
        sponsorIdx: 0
      };
    }

    return {
      color: this.randomPresentColor(),
      special: "none",
      sponsorIdx: 0
    };
  }

  // ==========================================================================
  // ACTUALIZACIÓN
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animClock += dt;

    if (this.cannonRecoil > 0) this.cannonRecoil = Math.max(0, this.cannonRecoil - dt * 6);
    if (this.swapAnim > 0) this.swapAnim = Math.max(0, this.swapAnim - dt * 5);
    if (this.ceilingDropOffset > 0) this.ceilingDropOffset = Math.max(0, this.ceilingDropOffset - dt * 95);

    for (const bin of this.bins) {
      if (bin.bounce > 0) bin.bounce = Math.max(0, bin.bounce - dt * 5);
    }

    if (this.keyLeft) this.aim = Math.max(-1.36, this.aim - dt * 1.75);
    if (this.keyRight) this.aim = Math.min(1.36, this.aim + dt * 1.75);

    // Actualizar adornos cayendo hacia las Cajas Colectoras de Regalos
    const fieldW = (COLS * 2 + 1) * this.r;
    const binTopY = this.cannonY + this.r * 0.45;
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i];
      f.vy += 1480 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vRot * dt;

      if (f.x < this.left + this.r) {
        f.x = this.left + this.r;
        f.vx = Math.abs(f.vx) * 0.7;
      } else if (f.x > this.left + fieldW - this.r) {
        f.x = this.left + fieldW - this.r;
        f.vx = -Math.abs(f.vx) * 0.7;
      }

      if (f.y >= binTopY) {
        const rel = Math.max(0, Math.min(0.999, (f.x - this.left) / fieldW));
        const binIdx = Math.floor(rel * this.bins.length);
        const bin = this.bins[binIdx];
        bin.bounce = 1;
        const pts = bin.basePts;
        this.addScore(pts);
        this.audio.playBellNote(binIdx % 4);
        this.particles.emitBurst(f.x, binTopY, bin.color, 10);
        this.addFloatingText(`+${pts} (${bin.label})`, f.x, binTopY - 18, bin.color, 1.15);
        this.fallers.splice(i, 1);
      }
    }

    for (const p of this.pops) p.t += dt * 3.2;
    this.pops = this.pops.filter((p) => p.t < 1);

    for (const sw of this.shockwaves) sw.t += dt * 2.6;
    this.shockwaves = this.shockwaves.filter((sw) => sw.t < 1);

    for (const lb of this.lightningBeams) lb.t += dt * 3.0;
    this.lightningBeams = this.lightningBeams.filter((lb) => lb.t < 1);

    if (this.shot) this.updateShot(dt);
  }

  private updateShot(dt: number): void {
    const s = this.shot!;
    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > 9) s.trail.shift();

    const stepLen = this.r * 0.42;
    const dist = Math.hypot(s.vx, s.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / stepLen));
    const sdt = dt / steps;
    const minX = this.left + this.r;
    const maxX = this.left + (COLS * 2 + 1) * this.r - this.r;

    for (let i = 0; i < steps; i++) {
      s.x += s.vx * sdt;
      s.y += s.vy * sdt;

      if (s.x < minX) {
        s.x = minX;
        s.vx = Math.abs(s.vx);
        this.audio.playTap();
        this.particles.emitBurst(s.x, s.y, "#FFD700", 5);
      } else if (s.x > maxX) {
        s.x = maxX;
        s.vx = -Math.abs(s.vx);
        this.audio.playTap();
        this.particles.emitBurst(s.x, s.y, "#FFD700", 5);
      }

      let hit = s.y <= this.fieldTop + this.r;
      if (!hit) hit = this.touchesBubble(s.x, s.y, this.r * 1.82);
      if (hit) {
        this.shot = null;
        this.settleShot(s);
        return;
      }
    }
  }

  private touchesBubble(x: number, y: number, dist: number): boolean {
    const d2 = dist * dist;
    for (let row = 0; row < this.grid.length; row++) {
      const cy = this.cellY(row);
      if (Math.abs(cy - y) > dist) continue;
      for (let col = 0; col < COLS; col++) {
        if (!this.isOccupied(row, col)) continue;
        const dx = this.cellX(row, col) - x;
        const dy = cy - y;
        if (dx * dx + dy * dy < d2) return true;
      }
    }
    return false;
  }

  private findSnapCell(x: number, y: number): [number, number] {
    const maxRow = this.lastOccupiedRow() + 2;
    this.ensureRow(maxRow);
    let best: [number, number] = [0, 0];
    let bestD = Infinity;
    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col < COLS; col++) {
        if (this.isOccupied(row, col)) continue;
        let supported = row === 0;
        if (!supported) {
          for (const [nr, nc] of this.neighbors(row, col)) {
            if (this.isOccupied(nr, nc)) {
              supported = true;
              break;
            }
          }
        }
        if (!supported) continue;
        const dx = this.cellX(row, col) - x;
        const dy = this.cellY(row) - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = [row, col];
        }
      }
    }
    return best;
  }

  private settleShot(s: Shot): void {
    const [row, col] = this.findSnapCell(s.x, s.y);

    // 1. Esfera Patrocinadora
    if (s.special === "sponsor") {
      this.explodeRadius(row, col, this.r * 4.5, "#FFD700", "BOLA PATROCINADORA", 420);
      this.afterResolve(true);
      return;
    }

    // 2. Bola Bomba de Confeti
    if (s.special === "bomb") {
      this.explodeRadius(row, col, this.r * 3.5, "#FF5252", "¡BOMBA DE CONFETI!", 280);
      this.afterResolve(true);
      return;
    }

    // 3. Esfera Rayo Boreal (limpia toda la fila de impacto y adyacentes)
    if (s.special === "lightning") {
      this.triggerLightningRow(row);
      this.afterResolve(true);
      return;
    }

    // 4. Esfera Estrella Arcoíris (Comodín: revienta todos los grupos de colores vecinos)
    if (s.special === "rainbow") {
      this.triggerRainbowWildcard(row, col);
      this.afterResolve(true);
      return;
    }

    // 5. Adorno normal
    this.ensureRow(row);
    this.grid[row][col] = { color: s.color, special: "none" };

    // ¿Tocó un adorno Bomba o Rayo que estaba dentro del tablero?
    for (const [nr, nc] of this.neighbors(row, col)) {
      const nb = this.getCell(nr, nc);
      if (!nb) continue;
      if (nb.special === "bomb") {
        this.grid[nr][nc] = this.emptyCell();
        this.explodeRadius(nr, nc, this.r * 3.4, "#FF5252", "¡DETONACIÓN EN CADENA!", 300);
        this.afterResolve(true);
        return;
      }
      if (nb.special === "lightning") {
        this.grid[nr][nc] = this.emptyCell();
        this.triggerLightningRow(nr);
        this.afterResolve(true);
        return;
      }
    }

    // Buscar grupo del mismo color
    const group = this.floodSameColor(row, col);
    if (group.length >= 3) {
      this.combo++;
      this.feverCharge = Math.min(100, this.feverCharge + group.length * 9 + this.combo * 5);
      this.popCells(group);
      const pts = group.length * 55 + Math.max(0, group.length - 3) * 45 + (this.combo > 1 ? this.combo * 35 : 0);
      this.addScore(pts);
      const c = group[0];
      this.addFloatingText(`+${pts}`, this.cellX(c[0], c[1]), this.cellY(c[0]), "#FFD700", 1.3);
      this.audio.playCatchItem(1.0 + Math.min(0.6, group.length * 0.06));
      if (this.combo >= 2) {
        this.addFloatingText(`¡COMBO x${this.combo}!`, this.width * 0.5, this.height * 0.4, "#FF9100", 1.35);
      }
      this.dropFloating();
      this.missCounter = 0;
      this.afterResolve(true);
    } else {
      this.combo = 0;
      this.missCounter++;
      this.audio.playTap();
      this.afterResolve(false);
    }
  }

  private triggerRainbowWildcard(row: number, col: number): void {
    this.ensureRow(row);
    const neighborColors = new Set<number>();
    for (const [nr, nc] of this.neighbors(row, col)) {
      const cell = this.getCell(nr, nc);
      if (cell && cell.color >= 0) neighborColors.add(cell.color);
    }

    const toPop = new Map<number, [number, number]>();
    toPop.set(row * COLS + col, [row, col]);

    for (const targetColor of neighborColors) {
      this.grid[row][col] = { color: targetColor, special: "none" };
      for (const [gr, gc] of this.floodSameColor(row, col)) {
        toPop.set(gr * COLS + gc, [gr, gc]);
      }
    }
    this.grid[row][col] = this.emptyCell();

    const cells = Array.from(toPop.values());
    this.popCells(cells);
    const cx = this.cellX(row, col);
    const cy = this.cellY(row);
    this.shockwaves.push({ x: cx, y: cy, maxR: this.r * 3.8, color: "#00E5FF", t: 0 });
    const pts = 250 + cells.length * 60;
    this.addScore(pts);
    this.combo++;
    this.missCounter = 0;
    this.audio.playPowerUp();
    this.particles.emitConfetti(this.width, 30);
    this.addFloatingText(`¡ESTRELLA ARCOÍRIS! +${pts}`, this.width * 0.5, this.height * 0.36, "#00E5FF", 1.45);
    this.dropFloating();
  }

  private triggerLightningRow(targetRow: number): void {
    const r = Math.max(0, Math.min(this.grid.length - 1, targetRow));
    if (r < 0 || !this.grid[r]) return;
    const cy = this.cellY(r);
    this.lightningBeams.push({ y: cy, t: 0 });

    const cells: [number, number][] = [];
    for (let c = 0; c < COLS; c++) {
      if (this.isOccupied(r, c)) cells.push([r, c]);
    }
    this.popCells(cells);
    const pts = 300 + cells.length * 55;
    this.addScore(pts);
    this.combo++;
    this.missCounter = 0;
    this.audio.playPowerUp();
    this.triggerShake(0.22, 6);
    this.addFloatingText(`¡RAYO BOREAL! +${pts}`, this.width * 0.5, cy - 16, "#00E5FF", 1.45);
    this.dropFloating();
  }

  private explodeRadius(row: number, col: number, radius: number, waveColor: string, label: string, basePts: number): void {
    const cx = this.cellX(row, col);
    const cy = this.cellY(row);
    this.shockwaves.push({ x: cx, y: cy, maxR: radius, color: waveColor, t: 0 });

    let count = 0;
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!this.isOccupied(r, c)) continue;
        const x = this.cellX(r, c);
        const y = this.cellY(r);
        if (Math.hypot(x - cx, y - cy) <= radius) {
          const color = Math.max(0, this.grid[r][c].color);
          this.pops.push({ x, y, color, t: 0 });
          this.particles.emitBurst(x, y, waveColor, 6);
          this.grid[r][c] = this.emptyCell();
          count++;
        }
      }
    }
    const pts = basePts + count * 45;
    this.addScore(pts);
    this.audio.playPowerUp();
    this.triggerShake(0.25, 6);
    this.particles.emitConfetti(this.width, 35);
    this.addFloatingText(`${label} +${pts}`, this.width * 0.5, this.height * 0.35, waveColor, 1.45);
    this.dropFloating();
    this.missCounter = 0;
  }

  private floodSameColor(row: number, col: number): [number, number][] {
    const cell = this.getCell(row, col);
    if (!cell || cell.color < 0) return [];
    const color = cell.color;
    const seen = new Set<number>([row * COLS + col]);
    const queue: [number, number][] = [[row, col]];
    const out: [number, number][] = [];
    while (queue.length) {
      const [r, c] = queue.pop()!;
      out.push([r, c]);
      for (const [nr, nc] of this.neighbors(r, c)) {
        const key = nr * COLS + nc;
        if (seen.has(key)) continue;
        const nb = this.getCell(nr, nc);
        if (nb && nb.color === color) {
          seen.add(key);
          queue.push([nr, nc]);
        }
      }
    }
    return out;
  }

  private popCells(cells: [number, number][]): void {
    for (const [r, c] of cells) {
      const cell = this.getCell(r, c);
      if (!cell) continue;
      const color = Math.max(0, cell.color);
      const x = this.cellX(r, c);
      const y = this.cellY(r);
      this.grid[r][c] = this.emptyCell();
      this.pops.push({ x, y, color, t: 0 });
      this.particles.emitBurst(x, y, COLOR_HEX[color] ?? "#FFD700", 7);
    }
  }

  private dropFloating(): void {
    const seen = new Set<number>();
    const queue: [number, number][] = [];
    if (this.grid.length) {
      for (let c = 0; c < COLS; c++) {
        if (this.isOccupied(0, c)) {
          seen.add(c);
          queue.push([0, c]);
        }
      }
    }
    while (queue.length) {
      const [r, c] = queue.pop()!;
      for (const [nr, nc] of this.neighbors(r, c)) {
        const key = nr * COLS + nc;
        if (seen.has(key)) continue;
        if (this.isOccupied(nr, nc)) {
          seen.add(key);
          queue.push([nr, nc]);
        }
      }
    }

    let dropped = 0;
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.isOccupied(r, c) && !seen.has(r * COLS + c)) {
          const cell = this.grid[r][c];
          this.fallers.push({
            x: this.cellX(r, c),
            y: this.cellY(r),
            vx: (Math.random() - 0.5) * 150,
            vy: -130 - Math.random() * 110,
            rot: 0,
            vRot: (Math.random() - 0.5) * 6,
            color: Math.max(0, cell.color),
            special: cell.special
          });
          this.grid[r][c] = this.emptyCell();
          dropped++;
        }
      }
    }
    if (dropped > 0) {
      this.feverCharge = Math.min(100, this.feverCharge + dropped * 10);
      this.audio.playPowerUp();
      this.addFloatingText(`¡LLUVIA DE ${dropped} ADORNOS!`, this.width * 0.5, this.height * 0.28, "#00E676", 1.3);
    }
  }

  private resetLevelAbilities(): void {
    this.combo = 0;
    this.fallers = [];
    this.pops = [];
    this.shockwaves = [];
    this.lightningBeams = [];
    this.missCounter = 0;
    this.ceilingDropOffset = 0;
    this.shot = null;
    this.aiming = false;
    this.aimCancelled = false;
  }

  private afterResolve(popped: boolean): void {
    // Si se despejaron todos los adornos del nivel actual
    if (this.lastOccupiedRow() < 0) {
      this.wave++;
      this.addScore(1000);
      this.audio.playVictory();
      this.particles.emitConfetti(this.width, 65);
      this.resetLevelAbilities();
      this.buildLevelGrid(this.wave);
      this.curAmmo = { color: this.randomPresentColor(), special: "none", sponsorIdx: 0 };
      this.nextAmmo = { color: this.randomPresentColor(), special: "none", sponsorIdx: 1 };
      this.addFloatingText(`¡${this.currentLevelTitle}! +1000`, this.width * 0.5, this.height * 0.4, "#FFD700", 1.55);
      return;
    } else if (!popped && this.missCounter >= this.missLimit) {
      this.pushNewRow();
    }

    const present = this.presentColors();
    if (this.curAmmo.special === "none" && !present.includes(this.curAmmo.color)) {
      this.curAmmo.color = present[Math.floor(Math.random() * present.length)];
    }
    if (this.nextAmmo.special === "none" && !present.includes(this.nextAmmo.color)) {
      this.nextAmmo.color = present[Math.floor(Math.random() * present.length)];
    }

    this.checkDefeat();
  }

  private pushNewRow(): void {
    const colors = this.presentColors();
    const row: GridCell[] = [];
    for (let c = 0; c < COLS; c++) {
      let special: SpecialKind = "none";
      if (Math.random() < 0.08) {
        special = Math.random() < 0.5 ? "bomb" : "lightning";
      }
      row.push({
        color: colors[Math.floor(Math.random() * colors.length)],
        special
      });
    }
    this.grid.unshift(row);
    this.shift ^= 1;
    this.missCounter = 0;
    this.ceilingDropOffset = -this.rowH * 0.65;
    this.audio.playWhoosh();
    this.triggerShake(0.18, 4);
    this.addFloatingText("¡DESCIENDEN LOS ADORNOS!", this.width * 0.5, this.height * 0.45, "#FF5252", 1.25);
  }

  private checkDefeat(): void {
    if (this.ending) return;
    const last = this.lastOccupiedRow();
    if (last >= this.rowLimit) {
      this.ending = true;
      this.audio.playError();
      this.triggerShake(0.3, 8);
      this.addFloatingText("¡LLEGARON A LA BASE!", this.width * 0.5, this.height * 0.45, "#FF5252", 1.5);
      this.setGameTimeout(() => this.endGame(), 1100);
    }
  }

  // ==========================================================================
  // RENDERIZADO DELUXE
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    drawNightSky(ctx, w, h, this.animClock, this.stars, 0);

    // Fondo de aldea navideña con veladura nocturna
    if (imgReady(this.bgVillageSprite)) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(this.bgVillageSprite, 0, 0, w, h);
      ctx.restore();
    }

    // Marco escénico del taller/árbol de adornos
    const fieldW = (COLS * 2 + 1) * this.r;
    const panelTop = this.fieldTop - 14;
    const panelBottom = this.cannonY + this.r * 1.95;

    ctx.save();
    const panelGrad = ctx.createLinearGradient(0, panelTop, 0, panelBottom);
    panelGrad.addColorStop(0, "rgba(7, 18, 42, 0.84)");
    panelGrad.addColorStop(0.6, "rgba(10, 26, 58, 0.78)");
    panelGrad.addColorStop(1, "rgba(18, 12, 38, 0.88)");
    ctx.fillStyle = panelGrad;
    roundRectPath(ctx, this.left - 12, panelTop, fieldW + 24, panelBottom - panelTop, 20);
    ctx.fill();

    // Columnas laterales de bastón de caramelo y bronce
    this.drawCandyPillar(ctx, this.left - 14, panelTop, 12, panelBottom - panelTop);
    this.drawCandyPillar(ctx, this.left + fieldW + 2, panelTop, 12, panelBottom - panelTop);

    // Viga superior de pino y guirnalda real
    this.drawFestiveCeiling(ctx, this.left - 14, panelTop, fieldW + 28, 22);
    ctx.restore();

    // Cajas Colectoras de Regalos en la base
    this.drawCollectorBins(ctx, fieldW);

    // Línea de límite de peligro con luces de advertencia
    const dangerY = this.fieldTop + this.rowLimit * this.rowH;
    ctx.save();
    const dangerPulse = 0.55 + Math.sin(this.animClock * 5) * 0.25;
    ctx.strokeStyle = `rgba(255, 68, 68, ${dangerPulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 9]);
    ctx.beginPath();
    ctx.moveTo(this.left + 4, dangerY);
    ctx.lineTo(this.left + fieldW - 4, dangerY);
    ctx.stroke();
    ctx.restore();

    // Guía de puntería láser + Silueta Fantasma de encaje hexagonal
    if (!this.shot && !this.ending) {
      this.drawAimGuideAndGhost(ctx);
    }

    // Adornos de la rejilla
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.grid[row][col];
        if (!cell || (cell.color < 0 && cell.special === "none")) continue;
        const wob = Math.sin(this.animClock * 2.2 + row * 0.7 + col * 0.5) * 1.1;
        this.drawGridCell(ctx, cell, this.cellX(row, col), this.cellY(row) + wob, this.r);
      }
    }

    // Ondas expansivas de explosión
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = 1 - sw.t;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 5 * (1 - sw.t);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.maxR * sw.t, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rayos Boreales Horizontales
    for (const lb of this.lightningBeams) {
      ctx.save();
      ctx.globalAlpha = 1 - lb.t;
      ctx.strokeStyle = "#00E5FF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 18;
      ctx.lineWidth = 10 * (1 - lb.t);
      ctx.beginPath();
      ctx.moveTo(this.left, lb.y);
      for (let x = this.left; x <= this.left + fieldW; x += 28) {
        const jitter = (Math.sin(x * 0.25 + this.animClock * 40) * 8) * (1 - lb.t);
        ctx.lineTo(x, lb.y + jitter);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Adornos cayendo hacia las cajas colectoras
    for (const f of this.fallers) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      this.drawOrnament(ctx, f.color, 0, 0, this.r);
      ctx.restore();
    }

    // Efectos de estallido
    for (const p of this.pops) {
      ctx.save();
      ctx.globalAlpha = 1 - p.t;
      this.drawOrnament(ctx, p.color, p.x, p.y, this.r * (1 + p.t * 0.5));
      ctx.restore();
      this.drawStar(ctx, p.x, p.y, this.r * (0.6 + p.t * 1.2), `rgba(255,236,140,${1 - p.t})`);
    }

    // Estela y adorno en vuelo
    if (this.shot) {
      for (let i = 0; i < this.shot.trail.length; i++) {
        const pt = this.shot.trail[i];
        const alpha = ((i + 1) / this.shot.trail.length) * 0.42;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.shot.special !== "none" ? "#00E5FF" : COLOR_HEX[this.shot.color % COLOR_HEX.length];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, this.r * 0.35 * ((i + 1) / this.shot.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this.drawAmmo(ctx, this.shot.x, this.shot.y, this.shot, this.r);
    }

    // Cañón Lanzador Mágico + Canasta de Intercambio + Medidor de Fiebre
    this.drawCannonAndSwapper(ctx);

    this.particles.draw(ctx, true);

    // Indicadores superiores: Nivel actual + descensos restantes
    const shotsLeft = this.missLimit - this.missCounter;
    drawPill(
      ctx,
      `${this.currentLevelTitle} • DESCIENDEN EN: ${shotsLeft}`,
      w / 2,
      64,
      shotsLeft <= 2 ? "#FF5252" : "#FFD700",
      320
    );

    if (this.combo >= 2) {
      drawPill(ctx, `COMBO x${this.combo}`, this.left + fieldW - 68, 64, "#FF9100", 125);
    }

    // Botón de Ayuda / Tutorial en la esquina superior derecha
    this.drawHelpButton(ctx, this.left + fieldW - 24, this.fieldTop - 28);
  }

  private drawHelpButton(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(10, 25, 52, 0.9)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = "900 15px 'Titan One', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", x, y + 1);
    ctx.restore();
  }

  private drawCandyPillar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, 6);
    ctx.clip();
    ctx.fillStyle = "#FFF8E7";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#D32F2F";
    for (let sy = y - 20; sy < y + h + 20; sy += 28) {
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.lineTo(x + w, sy + 10);
      ctx.lineTo(x + w, sy + 22);
      ctx.lineTo(x, sy + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    roundRectPath(ctx, x, y, w, h, 6);
    ctx.stroke();
  }

  private drawFestiveCeiling(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#1B5E20");
    grad.addColorStop(0.6, "#2E7D32");
    grad.addColorStop(1, "#0D3B10");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // Luces navideñas parpadeantes en la viga superior
    const bulbColors = ["#FF2A4D", "#FFD700", "#00E5FF", "#00E676"];
    const step = 36;
    let idx = 0;
    for (let bx = x + 22; bx < x + w - 16; bx += step) {
      const c = bulbColors[idx % bulbColors.length];
      const pulse = 0.65 + Math.sin(this.animClock * 5 + idx) * 0.35;
      ctx.save();
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 8 * pulse;
      ctx.beginPath();
      ctx.arc(bx, y + h * 0.55, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      idx++;
    }
  }

  private drawCollectorBins(ctx: CanvasRenderingContext2D, fieldW: number): void {
    const binCount = this.bins.length;
    const binW = fieldW / binCount;
    const baseY = this.cannonY + this.r * 0.65;

    for (let i = 0; i < binCount; i++) {
      const bx = this.left + i * binW;
      const bin = this.bins[i];
      const bounceOffset = bin.bounce * 7;

      ctx.save();
      ctx.fillStyle = "rgba(12, 28, 60, 0.72)";
      ctx.strokeStyle = bin.color;
      ctx.lineWidth = 2;
      roundRectPath(ctx, bx + 4, baseY - bounceOffset, binW - 8, this.r * 1.15, 10);
      ctx.fill();
      ctx.stroke();

      if (i !== 2) {
        const giftImg = this.giftBoxSprites[i % this.giftBoxSprites.length];
        if (imgReady(giftImg)) {
          const gs = this.r * 0.95;
          ctx.drawImage(giftImg, bx + 10, baseY - bounceOffset + 2, gs, gs);
        }
      }

      ctx.fillStyle = bin.color;
      ctx.font = `900 ${Math.round(this.r * 0.5)}px 'Titan One', 'Fredoka', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${bin.label} (+${bin.basePts})`,
        bx + binW * (i === 2 ? 0.5 : 0.6),
        baseY - bounceOffset + this.r * 0.58
      );
      ctx.restore();
    }
  }

  private drawGridCell(ctx: CanvasRenderingContext2D, cell: GridCell, x: number, y: number, r: number): void {
    if (cell.special !== "none") {
      if (cell.color >= 0) {
        this.drawOrnament(ctx, cell.color, x, y, r);
      }
      this.drawSpecialOrb(ctx, cell.special, cell.sponsorIdx || 0, x, y, r * 0.92);
    } else {
      this.drawOrnament(ctx, cell.color, x, y, r);
    }
  }

  private drawOrnament(ctx: CanvasRenderingContext2D, color: number, x: number, y: number, r: number): void {
    const img = this.sprites[color % this.sprites.length];
    if (imgReady(img)) {
      const sy = img.naturalHeight * 0.17;
      const sh = img.naturalHeight - sy;
      const dw = r * 2.04;
      const dh = dw * (sh / img.naturalWidth);
      ctx.drawImage(img, 0, sy, img.naturalWidth, sh, x - dw / 2, y + r * 1.02 - dh, dw, dh);
    } else {
      ctx.fillStyle = COLOR_HEX[color % COLOR_HEX.length];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSpecialOrb(
    ctx: CanvasRenderingContext2D,
    special: SpecialKind,
    sponsorIdx: number,
    x: number,
    y: number,
    r: number
  ): void {
    if (special === "sponsor") {
      ctx.save();
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 20;
      this.drawOrnament(ctx, 3, x, y, r);
      ctx.restore();
      const sponsor = this.sponsors[sponsorIdx % this.sponsors.length];
      drawSponsorMedallion(ctx, sponsor?.logo, x, y + r * 0.08, r * 0.56);
      return;
    }

    const sprite =
      special === "rainbow"
        ? this.rainbowSprite
        : special === "bomb"
          ? this.bombSprite
          : this.lightningSprite;

    if (imgReady(sprite)) {
      ctx.save();
      ctx.shadowColor = special === "rainbow" ? "#FF80AB" : special === "bomb" ? "#FF5252" : "#00E5FF";
      ctx.shadowBlur = 14;
      const size = r * 2.15;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    } else {
      this.drawOrnament(ctx, 3, x, y, r);
    }
  }

  private drawAmmo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ammo: { color: number; special: SpecialKind; sponsorIdx: number },
    r: number
  ): void {
    if (ammo.special !== "none") {
      this.drawSpecialOrb(ctx, ammo.special, ammo.sponsorIdx, x, y, r);
    } else {
      this.drawOrnament(ctx, ammo.color, x, y, r);
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rad = i % 2 === 0 ? r : r * 0.35;
      const a = (i * Math.PI) / 4 + this.animClock;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  private drawAimGuideAndGhost(ctx: CanvasRenderingContext2D): void {
    if (this.aimCancelled) return;

    let x = this.cannonX + Math.sin(this.aim) * this.r * 2.3;
    let y = this.cannonY - Math.cos(this.aim) * this.r * 2.3;
    let vx = Math.sin(this.aim);
    let vy = -Math.cos(this.aim);
    const step = this.r * 0.45;
    const minX = this.left + this.r;
    const maxX = this.left + (COLS * 2 + 1) * this.r - this.r;

    const guideColor =
      this.curAmmo.special !== "none"
        ? "#00E5FF"
        : COLOR_HEX[this.curAmmo.color % COLOR_HEX.length] || "#FFF3B0";

    ctx.save();
    for (let i = 0; i < 280; i++) {
      x += vx * step;
      y += vy * step;
      if (x < minX) {
        x = minX;
        vx = Math.abs(vx);
      } else if (x > maxX) {
        x = maxX;
        vx = -Math.abs(vx);
      }
      if (y <= this.fieldTop + this.r || this.touchesBubble(x, y, this.r * 1.82)) break;
      if (i % 3 === 0) {
        ctx.globalAlpha = Math.max(0.18, 0.92 - i / 220);
        ctx.fillStyle = guideColor;
        ctx.beginPath();
        ctx.arc(x, y, this.r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Silueta fantasma hexagonal donde aterrizará el adorno
    const [snapRow, snapCol] = this.findSnapCell(x, y);
    const gx = this.cellX(snapRow, snapCol);
    const gy = this.cellY(snapRow);
    ctx.globalAlpha = 0.45 + Math.sin(this.animClock * 7) * 0.18;
    ctx.strokeStyle = guideColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(gx, gy, this.r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawCannonAndSwapper(ctx: CanvasRenderingContext2D): void {
    const cx = this.cannonX;
    const cy = this.cannonY;
    const r = this.r;

    // 1. Tubo giratorio del cañón ('canon-adornos-tubo.png')
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.aim);
    const recoilOffset = this.cannonRecoil * r * 0.45;
    ctx.translate(0, recoilOffset);

    if (imgReady(this.cannonBarrelSprite)) {
      const bw = r * 2.55;
      const bh = bw * (this.cannonBarrelSprite.naturalHeight / this.cannonBarrelSprite.naturalWidth);
      ctx.drawImage(this.cannonBarrelSprite, -bw / 2, -bh * 0.78, bw, bh);
    } else {
      ctx.fillStyle = "#C77B3A";
      roundRectPath(ctx, -r * 0.8, -r * 2.7, r * 1.6, r * 3.2, r * 0.4);
      ctx.fill();
    }

    // Adorno cargado asomando en la boca del cañón
    if (!this.shot) {
      this.drawAmmo(ctx, 0, -r * 1.65, this.curAmmo, r * 0.94);
    }
    ctx.restore();

    // 2. Pedestal estacionario de relojería ('canon-adornos-base.png')
    if (imgReady(this.cannonBaseSprite)) {
      const baseW = r * 4.5;
      const baseH = baseW * (this.cannonBaseSprite.naturalHeight / this.cannonBaseSprite.naturalWidth);
      ctx.drawImage(this.cannonBaseSprite, cx - baseW / 2, cy - baseH * 0.35, baseW, baseH);
    }

    // 3. Canasta de Intercambio "CAMBIAR" con Elfo Ayudante a la izquierda
    const sx = this.swapCenterX;
    const sy = this.swapCenterY;
    ctx.save();
    const scale = 1 + Math.sin(this.swapAnim * Math.PI) * 0.18;
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);

    if (imgReady(this.elfHelperSprite)) {
      const ew = r * 2.1;
      const eh = ew * (this.elfHelperSprite.naturalHeight / this.elfHelperSprite.naturalWidth);
      ctx.drawImage(this.elfHelperSprite, -r * 2.5, -eh * 0.55, ew, eh);
    }

    // Aro decorativo pulsante
    const ringPulse = 0.85 + Math.sin(this.animClock * 4) * 0.15;
    ctx.fillStyle = "rgba(10, 24, 52, 0.92)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3 * ringPulse;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawAmmo(ctx, 0, 0, this.nextAmmo, r * 0.92);

    // Etiqueta interactiva "TOCA: CAMBIAR"
    ctx.fillStyle = "#FFD700";
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.38))}px 'Titan One', 'Fredoka', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("TOCA: CAMBIAR", 0, r * 1.68);
    ctx.restore();

    // 4. Medidor de Fiebre Estelar a la derecha del cañón
    const fx = cx + r * 4.4;
    const fy = cy + r * 0.15;
    const barW = r * 3.2;
    const barH = r * 0.62;
    ctx.save();
    ctx.fillStyle = "rgba(10, 24, 52, 0.9)";
    ctx.strokeStyle = "#00E5FF";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, fx - barW / 2, fy - barH / 2, barW, barH, barH / 2);
    ctx.fill();
    ctx.stroke();

    const fillW = Math.max(0, (barW - 6) * (this.feverCharge / 100));
    if (fillW > 0) {
      const fGrad = ctx.createLinearGradient(fx - barW / 2, 0, fx + barW / 2, 0);
      fGrad.addColorStop(0, "#00E5FF");
      fGrad.addColorStop(0.5, "#FFD700");
      fGrad.addColorStop(1, "#FF4081");
      ctx.fillStyle = fGrad;
      roundRectPath(ctx, fx - barW / 2 + 3, fy - barH / 2 + 3, fillW, barH - 6, (barH - 6) / 2);
      ctx.fill();
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.36))}px 'Titan One', 'Fredoka', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`FIEBRE ${Math.round(this.feverCharge)}%`, fx, fy + r * 0.85);
    ctx.restore();
  }
}
