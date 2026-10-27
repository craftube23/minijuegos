/**
 * ==============================================================================
 * MINIJUEGO: ¡ROMPE-HIELOS MÁGICO! (Magical Christmas Ice Breaker - Edición Deluxe)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Reglas y Mecánicas:
 * - SIN LÍMITE DE TIEMPO (showTimer = false) y MODO SUPERVIVENCIA DE 1 SOLA VIDA:
 *   mantén siempre al menos una esfera en juego o protégela con el Escudo Glacial.
 * - 8 NIVELES CON DISEÑOS Y FORMACIONES ÚNICAS:
 *   1. El Arco Polar
 *   2. El Gran Pino de Cristal
 *   3. El Corazón de la Navidad
 *   4. La Fortaleza del Cascanueces
 *   5. El Copo de Nieve Boreal
 *   6. El Carrusel Glacial (con filas móviles)
 *   7. La Bóveda de Diamante
 *   8. La Corona Real de la Feria (con filas móviles)
 * - Bumpers Reboteadores Polares ('bumper-polar.webp') integrados en cada nivel.
 * - 5 Súper Poderes: Multi-Esfera x3, Paleta Gigante, Esfera de Fuego Solar,
 *   Cañón de Carámbanos y Escudo Glacial Protector.
 * - Cero emojis.
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
  drawPill,
  drawSponsorMedallion
} from "./shared/gameDraw";

type BrickKind = "ice" | "crystal" | "gift-red" | "gift-green" | "gift-blue" | "gold" | "sponsor";
type DropPowerKind = "multiball" | "wide" | "fireball" | "cannon" | "shield";

interface SponsorInfo {
  id: string;
  name: string;
  logo: HTMLImageElement;
}

interface Brick {
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BrickKind;
  hp: number;
  maxHp: number;
  points: number;
  color: string;
  sponsor?: SponsorInfo;
  hitShake: number;
  movingSpeed: number; // px/s si la fila es móvil
  alive: boolean;
}

interface PolarBumper {
  nx: number;
  ny: number;
  x: number;
  y: number;
  r: number;
  hitPop: number;
  ringProgress: number;
}

interface LevelBlueprint {
  name: string;
  // Leyenda de caracteres (8 columnas por fila, bloques grandes, 9-10 filas hacia abajo):
  // '.' = vacío
  // 'I' = Hielo Glacial (1 HP)
  // 'R' = Regalo Rojo Congelado (1 HP)
  // 'G' = Regalo Verde Congelado (1 HP)
  // 'B' = Regalo Azul Congelado (1 HP)
  // 'A' = Bloque Acorazado Dorado (2 HP)
  // 'S' = Cofre de Patrocinador (1 HP + Poder Solar + Multi-Esfera)
  grid: string[];
  bumpers: { nx: number; ny: number; r: number }[];
  movingRows?: number[];
}

const LEVEL_BLUEPRINTS: LevelBlueprint[] = [
  {
    name: "EL GRAN PINO DE CRISTAL",
    grid: [
      "....SS....",
      "...I..I...",
      "..IC..CI..",
      ".IGRRRRGI.",
      "ICGGGGGGCI",
      "...AAAA..."
    ],
    bumpers: [
      { nx: 0.24, ny: 0.55, r: 24 },
      { nx: 0.76, ny: 0.55, r: 24 }
    ]
  },
  {
    name: "EL CORAZÓN DE LA NAVIDAD",
    grid: [
      ".CC....CC.",
      "CRRSSSSRRC",
      "CGGGGGGGGC",
      ".CBBBBBBC.",
      "..IAAAAI..",
      "...ICCI..."
    ],
    bumpers: [
      { nx: 0.22, ny: 0.56, r: 24 },
      { nx: 0.50, ny: 0.60, r: 25 },
      { nx: 0.78, ny: 0.56, r: 24 }
    ]
  },
  {
    name: "LA ESTRELLA POLAR",
    grid: [
      "....SS....",
      "...ICCI...",
      "..IAAAAI..",
      "CIARRRRAIC",
      "..IAAAAI..",
      "...ICCI...",
      "....II...."
    ],
    bumpers: [
      { nx: 0.25, ny: 0.54, r: 25 },
      { nx: 0.75, ny: 0.54, r: 25 }
    ]
  },
  {
    name: "EL TRINEO MÁGICO DE SANTA",
    grid: [
      "..RRGG....",
      ".BSSSSB...",
      "CCCCCCCC..",
      "A......A..",
      "AAAAAAAAAA"
    ],
    bumpers: [
      { nx: 0.50, ny: 0.52, r: 26 },
      { nx: 0.22, ny: 0.58, r: 23 },
      { nx: 0.78, ny: 0.58, r: 23 }
    ]
  },
  {
    name: "EL COPO DE NIEVE BOREAL",
    grid: [
      "...IIII...",
      ".C..SS..C.",
      "I..AAAA..I",
      ".C..SS..C.",
      "...IIII..."
    ],
    bumpers: [
      { nx: 0.28, ny: 0.54, r: 25 },
      { nx: 0.72, ny: 0.54, r: 25 }
    ]
  },
  {
    name: "LA FORTALEZA DEL CASCANUECES",
    grid: [
      "AA......AA",
      "AA.SSSS.AA",
      "AC.RRRR.CA",
      "AC......CA",
      "AC......CA"
    ],
    bumpers: [
      { nx: 0.25, ny: 0.54, r: 24 },
      { nx: 0.50, ny: 0.58, r: 25 },
      { nx: 0.75, ny: 0.54, r: 24 }
    ],
    movingRows: [1, 2]
  },
  {
    name: "LA CAMPANA DE NAVIDAD",
    grid: [
      "....AA....",
      "...ISSI...",
      "..IRGGRI..",
      ".ICCCCCI..",
      "CCCCCCCCCC",
      "....AA...."
    ],
    bumpers: [
      { nx: 0.22, ny: 0.54, r: 24 },
      { nx: 0.50, ny: 0.58, r: 25 },
      { nx: 0.78, ny: 0.54, r: 24 }
    ]
  },
  {
    name: "LA CORONA REAL DE LA FERIA",
    grid: [
      "A..A..A..A",
      "AS.A..A.SA",
      "ARCGGGCRA.",
      "ACSSSSCA..",
      "AAAAAAAAAA"
    ],
    bumpers: [
      { nx: 0.25, ny: 0.54, r: 24 },
      { nx: 0.50, ny: 0.58, r: 26 },
      { nx: 0.75, ny: 0.54, r: 24 }
    ],
    movingRows: [1, 3]
  },
  {
    name: "EL BASTÓN DE CARAMELO MÁGICO",
    grid: [
      "..RRRR....",
      ".RA..AR...",
      "....AAR...",
      "....RRA...",
      "....AAR...",
      "....RRA...",
      "....AAR..."
    ],
    bumpers: [
      { nx: 0.25, ny: 0.55, r: 25 },
      { nx: 0.75, ny: 0.55, r: 25 }
    ]
  },
  {
    name: "EL MUÑECO DE NIEVE GLACIAL",
    grid: [
      "...AAAA...",
      "..ACSSCA..",
      "...CCCC...",
      "..CRRRRC..",
      ".CGGGGGGC.",
      "CBBBBBBBBC"
    ],
    bumpers: [
      { nx: 0.22, ny: 0.55, r: 24 },
      { nx: 0.78, ny: 0.55, r: 24 }
    ]
  },
  {
    name: "LA BOTA NAVIDEÑA DE REGALOS",
    grid: [
      ".RRGGSS...",
      ".CCCCCC...",
      ".CCCCCC...",
      ".CCCCCCCC.",
      ".CCCCCCCC.",
      "..AAAAAA.."
    ],
    bumpers: [
      { nx: 0.65, ny: 0.52, r: 25 },
      { nx: 0.25, ny: 0.58, r: 24 }
    ]
  },
  {
    name: "EL GRAN REGALO MÁGICO",
    grid: [
      "..SS..SS..",
      "..SS..SS..",
      "RRRRSSRRRR",
      "SSSSSSSSSS",
      "GGGGSSGGGG",
      "GGGGSSGGGG"
    ],
    bumpers: [
      { nx: 0.22, ny: 0.56, r: 24 },
      { nx: 0.78, ny: 0.56, r: 24 }
    ]
  },
  {
    name: "EL ÁNGEL DE CRISTAL",
    grid: [
      "C........C",
      "CC..SS..CC",
      "CCRRAARRCC",
      ".C.G..G.C.",
      "..C....C.."
    ],
    bumpers: [
      { nx: 0.30, ny: 0.54, r: 25 },
      { nx: 0.50, ny: 0.58, r: 25 },
      { nx: 0.70, ny: 0.54, r: 25 }
    ]
  },
  {
    name: "EL RENO RODOLFO",
    grid: [
      "A..A..A..A",
      ".A.A..A.A.",
      "..CAAAAC..",
      "..C.RR.C..",
      "...CSSC...",
      "....CC...."
    ],
    bumpers: [
      { nx: 0.24, ny: 0.55, r: 24 },
      { nx: 0.76, ny: 0.55, r: 24 }
    ]
  }
];

interface MagicBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  stuck: boolean;
  trail: { x: number; y: number }[];
}

interface PowerDrop {
  x: number;
  y: number;
  vy: number;
  kind: DropPowerKind;
  active: boolean;
  phase: number;
}

interface IcicleBolt {
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

interface IceShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  color: string;
  alpha: number;
}

interface RescuedToy {
  sprite: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
}

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

export class IceBreakerGame extends BaseGame {
  private paddleX = 500;
  private paddleTargetX = 500;
  private paddleVelX = 0;
  private paddleW = 168;
  private readonly paddleBaseW = 168;
  private readonly paddleH = 38;

  private balls: MagicBall[] = [];
  private bricks: Brick[] = [];
  private bumpers: PolarBumper[] = [];
  private drops: PowerDrop[] = [];
  private bolts: IcicleBolt[] = [];
  private shards: IceShard[] = [];
  private rescuedToys: RescuedToy[] = [];

  private wave = 1;
  private currentLevelTitle = LEVEL_BLUEPRINTS[0].name;
  private levelDeck: number[] = [];
  private combo = 0;
  private wideTimer = 0;
  private fireballTimer = 0;
  private cannonTimer = 0;
  private cannonShotCooldown = 0;
  private shieldTimer = 0;
  private aimClock = 0;
  private keyLeft = false;
  private keyRight = false;

  private skyStars = makeSkyStars(58);

  // Assets 2D
  private bgImg: HTMLImageElement;
  private paddleImg: HTMLImageElement;
  private orbImg: HTMLImageElement;
  private brickIceImg: HTMLImageElement;
  private brickGoldImg: HTMLImageElement;
  private brickGiftImg: HTMLImageElement;
  private bumperImg: HTMLImageElement;
  private icicleImg: HTMLImageElement;
  private giftRedImg: HTMLImageElement;
  private giftGreenImg: HTMLImageElement;
  private giftBlueImg: HTMLImageElement;
  private giftGoldImg: HTMLImageElement;
  private starImg: HTMLImageElement;
  private candyImg: HTMLImageElement;
  private bearImg: HTMLImageElement;
  private robotImg: HTMLImageElement;
  private carImg: HTMLImageElement;
  private sponsors: SponsorInfo[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "ice-breaker",
      "¡Rompe-Hielos Mágico!",
      "¡Supera los niveles de la Bóveda Glacial con 1 sola vida y sin límite de tiempo!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Joy to the world.mp3";
    this.inGameMusicVolume = 0.42;

    this.bgImg = this.getImage("./assets/images/fondo-villa-montanas.webp");
    this.paddleImg = this.getImage("./assets/images/paleta-rompehielos.webp");
    this.orbImg = this.getImage("./assets/images/esfera-rompehielos.webp");
    this.brickIceImg = this.getImage("./assets/images/bloque-hielo-cristal.webp");
    this.brickGoldImg = this.getImage("./assets/images/bloque-hielo-dorado.webp");
    this.brickGiftImg = this.getImage("./assets/images/bloque-regalo-congelado.webp");
    this.bumperImg = this.getImage("./assets/images/bumper-polar.webp");
    this.icicleImg = this.getImage("./assets/images/estalactita-hielo.webp");

    this.giftRedImg = this.getImage("./assets/images/regalo-estilizado-rojo.webp");
    this.giftGreenImg = this.getImage("./assets/images/regalo-estilizado-verde.webp");
    this.giftBlueImg = this.getImage("./assets/images/regalo-estilizado-azul.webp");
    this.giftGoldImg = this.getImage("./assets/images/regalo-estilizado-dorado.webp");
    this.starImg = this.getImage("./assets/images/estrella con logo.webp");
    this.candyImg = this.getImage("./assets/images/baston-caramelo.webp");
    this.bearImg = this.getImage("./assets/images/osito.webp");
    this.robotImg = this.getImage("./assets/images/robot.webp");
    this.carImg = this.getImage("./assets/images/coche-juguete.webp");

    this.sponsors = [
      { id: "campus", name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.webp") },
      { id: "cajasan", name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.webp") },
      { id: "imebu", name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.webp") },
      { id: "feria", name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.webp") }
    ];
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = true;
    if (e.key === " " || e.key === "ArrowUp") {
      this.launchStuckBalls();
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = false;
  };

  protected onStart(): void {
    const w = this.width || 1024;
    this.paddleX = w / 2;
    this.paddleTargetX = w / 2;
    this.paddleVelX = 0;
    this.paddleW = this.paddleBaseW;

    // 1 sola vida y sin cronómetro
    this.lives = 1;
    this.maxLives = 1;
    this.showLives = true;
    this.showTimer = false;
    this.timeRemaining = 999999;

    this.wave = 1;
    this.combo = 0;
    this.wideTimer = 0;
    this.fireballTimer = 0;
    this.cannonTimer = 0;
    this.cannonShotCooldown = 0;
    this.shieldTimer = 0;
    this.aimClock = 0;
    this.keyLeft = false;
    this.keyRight = false;
    this.drops = [];
    this.bolts = [];
    this.shards = [];
    this.rescuedToys = [];

    this.buildBrickGrid(this.wave);
    this.spawnStuckBall();

    this.input.onPointerDown = (_id: number, x: number) => {
      this.paddleTargetX = x;
      this.launchStuckBalls();
    };
    this.input.onPointerMove = (_id: number, x: number) => {
      this.paddleTargetX = x;
    };

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.addFloatingText(this.currentLevelTitle, w / 2, this.height * 0.46, "#00E5FF", 1.35);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.repositionArenaGeometry();
  }

  private getArenaBounds() {
    const w = this.width || 1024;
    const h = this.height || 768;
    const arenaW = Math.min(w - 32, 880);
    const left = (w - arenaW) / 2;
    const right = left + arenaW;
    const top = 98;
    const bottom = h - 18;
    const paddleY = bottom - 48;
    return { w, h, arenaW, left, right, top, bottom, paddleY };
  }

  private spawnStuckBall(): void {
    const { paddleY } = this.getArenaBounds();
    this.balls = [
      {
        x: this.paddleX,
        y: paddleY - 22,
        vx: 220,
        vy: -480,
        r: 15,
        rot: 0,
        stuck: true,
        trail: []
      }
    ];
  }

  private buildBrickGrid(wave: number): void {
    const { left, arenaW, top, paddleY } = this.getArenaBounds();
    // Mazo aleatorio sin repetir hasta agotar todas las formaciones
    if (this.levelDeck.length === 0) {
      const indices = Array.from({ length: LEVEL_BLUEPRINTS.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      this.levelDeck = indices;
    }

    const bpIndex = this.levelDeck.pop() ?? 0;
    const bp = LEVEL_BLUEPRINTS[bpIndex];
    const cycle = Math.floor((wave - 1) / LEVEL_BLUEPRINTS.length);
    this.currentLevelTitle = `NIVEL ${wave} • ${bp.name}${cycle > 0 ? ` ★${cycle + 1}` : ''}`;
    const shouldFlip = Math.random() < 0.5;

    const numRows = bp.grid.length;
    const cols = Math.max(...bp.grid.map((r) => r.length));
    const padX = 14;
    const gapX = 7;
    const usableW = arenaW - padX * 2 - gapX * (cols - 1);
    const bw = usableW / cols;
    const arenaH = Math.max(200, paddleY - top);
    const isShortArena = arenaH < 460;
    const maxGridH = Math.min(isShortArena ? 180 : 235, arenaH * 0.38);
    const gapY = Math.max(4, Math.min(6, Math.round(maxGridH * 0.035)));
    const bh = Math.max(isShortArena ? 19 : 24, Math.min(34, Math.floor((maxGridH - (numRows - 1) * gapY) / numRows)));

    this.bricks = [];
    let sponsorIdx = wave;

    for (let r = 0; r < bp.grid.length; r++) {
      const rowStr = shouldFlip ? bp.grid[r].split("").reverse().join("") : bp.grid[r];
      const isMovingRow = bp.movingRows?.includes(r) || (cycle > 0 && r % 2 === 1);
      const rowSpeed = isMovingRow ? (r % 2 === 0 ? 1 : -1) * (38 + wave * 4) : 0;

      for (let c = 0; c < cols; c++) {
        const ch = rowStr[c] || ".";
        if (ch === ".") continue;

        let kind: BrickKind = "ice";
        let hp = 1;
        let points = 60;
        let color = "#4FC3F7";
        let sponsor: SponsorInfo | undefined;

        if (ch === "S") {
          kind = "sponsor";
          hp = 2; // Cofre de Patrocinador: 2 golpes
          points = 260;
          sponsor = this.sponsors[sponsorIdx % this.sponsors.length];
          sponsorIdx++;
          color = "#FFD700";
        } else if (ch === "A") {
          kind = "gold";
          hp = 3 + (cycle > 0 ? 1 : 0); // Bloque Acorazado Dorado: 3 golpes
          points = 180;
          color = "#FFD700";
        } else if (ch === "C") {
          kind = "crystal";
          hp = 2; // Cristal Reforzado: 2 golpes
          points = 110;
          color = "#29B6F6";
        } else if (ch === "R") {
          kind = "gift-red";
          hp = 2; // Regalo Rojo Congelado: 2 golpes
          points = 95;
          color = "#FF2A4D";
        } else if (ch === "G") {
          kind = "gift-green";
          hp = 2; // Regalo Verde Congelado: 2 golpes
          points = 95;
          color = "#00E676";
        } else if (ch === "B") {
          kind = "gift-blue";
          hp = 2; // Regalo Azul Congelado: 2 golpes
          points = 95;
          color = "#2979FF";
        } else {
          kind = "ice";
          hp = 1; // Hielo Escarchado Básico: 1 golpe
          points = 60;
          color = "#00E5FF";
        }

        this.bricks.push({
          col: c,
          row: r,
          x: left + padX + c * (bw + gapX),
          y: top + 22 + r * (bh + gapY),
          w: bw,
          h: bh,
          kind,
          hp,
          maxHp: hp,
          points,
          color,
          sponsor,
          hitShake: 0,
          movingSpeed: rowSpeed,
          alive: true
        });
      }
    }

    this.bumpers = bp.bumpers.map((b) => {
      const nx = shouldFlip ? (1 - b.nx) : b.nx;
      return {
        nx,
        ny: b.ny,
        x: left + arenaW * nx,
        y: top + arenaH * b.ny,
        r: b.r,
        hitPop: 0,
        ringProgress: 0
      };
    });
  }

  private repositionArenaGeometry(): void {
    const bounds = this.getArenaBounds();
    const bp = LEVEL_BLUEPRINTS[(this.wave - 1) % LEVEL_BLUEPRINTS.length];
    const cols = 8;
    const padX = 16;
    const gapX = 8;
    const usableW = bounds.arenaW - padX * 2 - gapX * (cols - 1);
    const bw = usableW / cols;
    const arenaH = Math.max(200, bounds.paddleY - bounds.top);
    const isShortArena = arenaH < 460;
    const numRows = bp.grid.length;
    const maxGridH = Math.min(isShortArena ? 180 : 195, arenaH * 0.38);
    const gapY = Math.max(4, Math.min(6, Math.round(maxGridH * 0.035)));
    const bh = Math.max(isShortArena ? 19 : 24, Math.min(34, Math.floor((maxGridH - (numRows - 1) * gapY) / numRows)));

    for (const br of this.bricks) {
      if (br.movingSpeed === 0) {
        br.x = bounds.left + padX + br.col * (bw + gapX);
      } else {
        br.x = Math.max(bounds.left + 12, Math.min(bounds.right - bw - 12, br.x));
      }
      br.y = bounds.top + 20 + br.row * (bh + gapY);
      br.w = bw;
      br.h = bh;
    }
    for (const bmp of this.bumpers) {
      bmp.x = bounds.left + bounds.arenaW * bmp.nx;
      bmp.y = bounds.top + arenaH * bmp.ny;
    }
  }

  private getAimAngle(): number {
    return -Math.PI / 2 + Math.sin(this.aimClock * 2.6) * 0.42;
  }

  private launchStuckBalls(): void {
    let launched = false;
    const angle = this.getAimAngle();
    for (const b of this.balls) {
      if (b.stuck) {
        b.stuck = false;
        const speed = 520 + Math.min(130, (this.wave - 1) * 24);
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        launched = true;
      }
    }
    if (launched) {
      this.audio.playWhoosh();
    }
  }

  private get comboMultiplier(): number {
    if (this.combo >= 12) return 4;
    if (this.combo >= 7) return 3;
    if (this.combo >= 3) return 2;
    return 1;
  }

  protected onUpdate(dt: number): void {
    this.aimClock += dt;
    const bounds = this.getArenaBounds();
    const { left, right, top, bottom, paddleY } = bounds;

    if (this.wideTimer > 0) {
      this.wideTimer = Math.max(0, this.wideTimer - dt);
      this.paddleW = this.paddleBaseW * 1.46;
    } else {
      this.paddleW = this.paddleBaseW;
    }
    if (this.fireballTimer > 0) {
      this.fireballTimer = Math.max(0, this.fireballTimer - dt);
    }
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    }

    // Cañón de Carámbanos automático
    if (this.cannonTimer > 0) {
      this.cannonTimer = Math.max(0, this.cannonTimer - dt);
      this.cannonShotCooldown -= dt;
      if (this.cannonShotCooldown <= 0) {
        this.cannonShotCooldown = 0.48;
        const halfW = this.paddleW * 0.42;
        this.bolts.push({ x: this.paddleX - halfW, y: paddleY - 8, vy: -640, active: true });
        this.bolts.push({ x: this.paddleX + halfW, y: paddleY - 8, vy: -640, active: true });
        this.audio.playTap();
      }
    }

    const kbSpeed = 700;
    if (this.keyLeft) this.paddleTargetX -= kbSpeed * dt;
    if (this.keyRight) this.paddleTargetX += kbSpeed * dt;

    const halfP = this.paddleW / 2;
    this.paddleTargetX = Math.max(left + halfP + 10, Math.min(right - halfP - 10, this.paddleTargetX));
    const prevPaddleX = this.paddleX;
    this.paddleX += (this.paddleTargetX - this.paddleX) * Math.min(1, dt * 18);
    this.paddleX = Math.max(left + halfP + 10, Math.min(right - halfP - 10, this.paddleX));
    this.paddleVelX = (this.paddleX - prevPaddleX) / Math.max(0.001, dt);

    // Actualizar bloques en filas móviles
    for (const br of this.bricks) {
      if (!br.alive || br.movingSpeed === 0) continue;
      br.x += br.movingSpeed * dt;
      if (br.x < left + 14) {
        br.x = left + 14;
        br.movingSpeed = Math.abs(br.movingSpeed);
      } else if (br.x + br.w > right - 14) {
        br.x = right - 14 - br.w;
        br.movingSpeed = -Math.abs(br.movingSpeed);
      }
    }

    // Actualizar proyectiles del Cañón de Carámbanos
    for (const bolt of this.bolts) {
      if (!bolt.active) continue;
      bolt.y += bolt.vy * dt;
      if (bolt.y < top + 10) {
        bolt.active = false;
        continue;
      }
      for (const br of this.bricks) {
        if (!br.alive) continue;
        if (bolt.x >= br.x && bolt.x <= br.x + br.w && bolt.y >= br.y && bolt.y <= br.y + br.h) {
          bolt.active = false;
          this.damageBrick(br, 1, bolt.x, bolt.y);
          break;
        }
      }
    }
    this.bolts = this.bolts.filter((b) => b.active);

    // Actualizar Bumpers
    for (const bmp of this.bumpers) {
      if (bmp.hitPop > 0) bmp.hitPop = Math.max(0, bmp.hitPop - dt * 5);
      if (bmp.ringProgress > 0) {
        bmp.ringProgress += dt * 3.2;
        if (bmp.ringProgress > 1) bmp.ringProgress = 0;
      }
    }

    // Actualizar Esquirlas de Hielo
    for (const s of this.shards) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 580 * dt;
      s.rot += s.vRot * dt;
      s.alpha -= dt * 1.25;
    }
    this.shards = this.shards.filter((s) => s.alpha > 0);

    // Actualizar Juguetes Rescatados
    for (const toy of this.rescuedToys) {
      toy.x += toy.vx * dt;
      toy.y += toy.vy * dt;
      toy.vy += 260 * dt;
      toy.alpha -= dt * 0.75;
    }
    this.rescuedToys = this.rescuedToys.filter((t) => t.alpha > 0);

    // Actualizar Esferas Mágicas
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (b.stuck) {
        b.x = this.paddleX;
        b.y = paddleY - b.r - 4;
        continue;
      }

      // Aceleración progresiva con el paso del tiempo mientras la esfera está en juego
      const curSpd = Math.hypot(b.vx, b.vy);
      const maxSpd = 980;
      if (curSpd > 1 && curSpd < maxSpd) {
        const nextSpd = Math.min(maxSpd, curSpd + 22 * dt);
        const factor = nextSpd / curSpd;
        b.vx *= factor;
        b.vy *= factor;
      }

      b.rot += dt * 7;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 10) b.trail.shift();

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x - b.r < left + 10) {
        b.x = left + 10 + b.r;
        b.vx = Math.abs(b.vx);
        this.audio.playTap();
      } else if (b.x + b.r > right - 10) {
        b.x = right - 10 - b.r;
        b.vx = -Math.abs(b.vx);
        this.audio.playTap();
      }
      if (b.y - b.r < top + 12) {
        b.y = top + 12 + b.r;
        b.vy = Math.abs(b.vy);
        this.audio.playTap();
      }

      // Colisión con la paleta
      if (
        b.vy > 0 &&
        b.y + b.r >= paddleY - 4 &&
        b.y - b.r <= paddleY + this.paddleH * 0.7 &&
        b.x >= this.paddleX - halfP - b.r * 0.65 &&
        b.x <= this.paddleX + halfP + b.r * 0.65
      ) {
        const hitNorm = Math.max(-1, Math.min(1, (b.x - this.paddleX) / halfP));
        const maxBounceAngle = Math.PI * 0.37;
        const speed = Math.min(maxSpd, Math.hypot(b.vx, b.vy) * 1.025);
        const bounceAngle = hitNorm * maxBounceAngle;
        b.vx = Math.sin(bounceAngle) * speed;
        b.vy = -Math.cos(bounceAngle) * speed;
        b.y = paddleY - b.r - 4;
        this.audio.playCatchItem(1.08);
        this.particles.emitBurst(b.x, paddleY, "#00E5FF", 8);
      }

      // Colisión con el Escudo Glacial Protector en la base
      const shieldY = bottom - 12;
      if (this.shieldTimer > 0 && b.vy > 0 && b.y + b.r >= shieldY) {
        b.y = shieldY - b.r;
        b.vy = -Math.abs(b.vy);
        this.audio.playPowerUp();
        this.particles.emitBurst(b.x, shieldY, "#00E5FF", 14);
        this.addFloatingText("¡ESCUDO GLACIAL!", b.x, shieldY - 20, "#00E5FF", 1.15);
      }

      // Colisión con Bumpers Polares
      for (let bi = 0; bi < this.bumpers.length; bi++) {
        const bmp = this.bumpers[bi];
        const dx = b.x - bmp.x;
        const dy = b.y - bmp.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b.r + bmp.r;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          b.x = bmp.x + nx * (minDist + 2);
          b.y = bmp.y + ny * (minDist + 2);
          const speed = Math.min(maxSpd, Math.max(560, Math.hypot(b.vx, b.vy) * 1.06));
          b.vx = nx * speed;
          b.vy = ny * speed;
          bmp.hitPop = 1;
          bmp.ringProgress = 0.01;
          const pts = 100 * this.comboMultiplier;
          this.addScore(pts);
          this.audio.playBellNote(bi % 4);
          this.particles.emitBurst(bmp.x, bmp.y, "#00E5FF", 12);
          this.addFloatingText(`+${pts}`, bmp.x, bmp.y - bmp.r - 8, "#00E5FF", 1.1);
        }
      }

      // Colisión con ladrillos
      for (const br of this.bricks) {
        if (!br.alive) continue;
        if (br.hitShake > 0) br.hitShake = Math.max(0, br.hitShake - dt * 6);

        const closestX = Math.max(br.x, Math.min(b.x, br.x + br.w));
        const closestY = Math.max(br.y, Math.min(b.y, br.y + br.h));
        const dx = b.x - closestX;
        const dy = b.y - closestY;

        if (dx * dx + dy * dy <= b.r * b.r) {
          // Rebote físico: La esfera solar rebota naturalmente sin glitch de atravesar infinito
          if (Math.abs(dx) > Math.abs(dy)) {
            b.vx = -b.vx;
          } else {
            b.vy = -b.vy;
          }

          // Pequeño incremento de velocidad por cada bloque impactado
          const hitSpd = Math.hypot(b.vx, b.vy);
          if (hitSpd > 1 && hitSpd < maxSpd) {
            const boost = Math.min(maxSpd, hitSpd * 1.012) / hitSpd;
            b.vx *= boost;
            b.vy *= boost;
          }

          // Daño balanceado: La Esfera Solar inflige 2 de daño directo + explosión ígnea en área
          const isSolar = this.fireballTimer > 0;
          const directDmg = isSolar ? 2 : 1;
          this.damageBrick(br, directDmg, b.x, b.y);

          // Explosión en área para la Esfera Solar (daño splash 1 HP a bloques adyacentes)
          if (isSolar) {
            this.particles.emitBurst(b.x, b.y, "#FF9100", 14);
            this.audio.playCatchItem(1.3);
            const splashRadius = Math.max(br.w, br.h) * 1.35;
            for (const neighbor of this.bricks) {
              if (neighbor !== br && neighbor.alive) {
                const ncx = neighbor.x + neighbor.w / 2;
                const ncy = neighbor.y + neighbor.h / 2;
                const distSq = (ncx - b.x) * (ncx - b.x) + (ncy - b.y) * (ncy - b.y);
                if (distSq <= splashRadius * splashRadius) {
                  this.damageBrick(neighbor, 1, ncx, ncy);
                }
              }
            }
          }
          break;
        }
      }

      if (b.y - b.r > bottom + 22) {
        this.balls.splice(i, 1);
      }
    }

    // 1 sola vida: si se pierden todas las esferas activas, termina la partida
    if (this.balls.length === 0) {
      this.lives = 0;
      this.combo = 0;
      this.audio.playElfHit();
      this.triggerShake(0.3, 9);
      this.endGame();
      return;
    }

    // Actualizar Cápsulas de Poder
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (!d.active) continue;
      d.phase += dt * 4;
      d.y += d.vy * dt;

      if (
        d.y + 22 >= paddleY &&
        d.y - 22 <= paddleY + this.paddleH + 12 &&
        Math.abs(d.x - this.paddleX) <= halfP + 26
      ) {
        d.active = false;
        this.applyPowerDrop(d);
      } else if (d.y > bottom + 40) {
        d.active = false;
      }
    }
    this.drops = this.drops.filter((d) => d.active);

    // Siguiente Nivel con diseño distinto al limpiar todos los bloques
    if (this.bricks.every((br) => !br.alive)) {
      this.wave++;
      this.addScore(500);
      this.audio.playVictory();
      this.particles.emitConfetti(this.width, 45);
      this.resetLevelAbilities();
      this.buildBrickGrid(this.wave);
      this.spawnStuckBall();
      this.addFloatingText(`¡${this.currentLevelTitle}! +500`, this.width / 2, this.height * 0.45, "#FFD700", 1.4);
    }
  }

  private resetLevelAbilities(): void {
    this.wideTimer = 0;
    this.fireballTimer = 0;
    this.cannonTimer = 0;
    this.cannonShotCooldown = 0;
    this.shieldTimer = 0;
    this.paddleW = this.paddleBaseW;
    this.drops = [];
    this.bolts = [];
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
  }

  private damageBrick(br: Brick, dmg: number, hitX: number, hitY: number): void {
    br.hp -= dmg;
    br.hitShake = 1;
    this.emitIceShards(hitX, hitY, br.color, br.hp <= 0 ? 9 : 4);

    if (br.hp <= 0) {
      br.alive = false;
      this.onBrickDestroyed(br);
    } else {
      this.audio.playTap();
      this.particles.emitBurst(hitX, hitY, "#FFD700", 6);
    }
  }

  private emitIceShards(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 190;
      this.shards.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 90,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 12,
        color,
        alpha: 1
      });
    }
  }

  private onBrickDestroyed(br: Brick): void {
    const cx = br.x + br.w / 2;
    const cy = br.y + br.h / 2;

    this.combo++;
    const pts = Math.round(br.points * this.comboMultiplier);
    this.addScore(pts);

    // Si era un bloque de regalo, liberar un juguete rescatado animado
    if (br.kind === "gift-red" || br.kind === "gift-green" || br.kind === "gift-blue") {
      const toys = [this.bearImg, this.robotImg, this.carImg, this.giftRedImg];
      const spr = toys[Math.floor(Math.random() * toys.length)];
      this.rescuedToys.push({
        sprite: spr,
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 90,
        vy: -150,
        scale: 1,
        alpha: 1
      });
    }

    if (br.kind === "sponsor" && br.sponsor) {
      this.fireballTimer = Math.max(this.fireballTimer, 3.8);
      this.triggerLogoPowerUp(br.sponsor.id, 3.5);
      this.particles.emitBurst(cx, cy, "#FFD700", 20);
      this.addFloatingText(`¡${br.sponsor.name.toUpperCase()} SOLAR! +${pts}`, cx, cy, "#FFD700", 1.3);
    } else {
      this.audio.playCatchItem(1.0 + Math.min(0.5, this.combo * 0.04));
      this.particles.emitBurst(cx, cy, br.color, 12);
      const label = this.comboMultiplier > 1 ? `+${pts} (x${this.comboMultiplier})` : `+${pts}`;
      this.addFloatingText(label, cx, cy, br.color, 1.08);
    }

    // Probabilidad de cápsula aumentada: 100% en patrocinador, 60% en regalos, 40% en bloques
    const dropRate = br.kind === "sponsor" ? 1.0 : (br.kind.startsWith("gift") ? 0.60 : 0.40);
    if (Math.random() < dropRate) {
      const kinds: DropPowerKind[] = ["multiball", "wide", "fireball", "cannon", "shield"];
      const kind = br.kind === "sponsor" ? "multiball" : kinds[Math.floor(Math.random() * kinds.length)];
      this.drops.push({
        x: cx,
        y: cy,
        vy: 185 + Math.random() * 45,
        kind,
        active: true,
        phase: Math.random() * 6
      });
    }
  }

  private applyPowerDrop(d: PowerDrop): void {
    this.audio.playPowerUp();
    this.particles.emitBurst(d.x, d.y, "#FFD700", 16);
    let label = "+150 PTS";
    let col = "#FFD700";

    if (d.kind === "multiball") {
      this.addScore(150);
      label = "¡MULTI-ESFERA x3!";
      col = "#00E5FF";
      const baseBall = this.balls[0];
      if (baseBall && this.balls.length < 5) {
        if (baseBall.stuck) this.launchStuckBalls();
        for (const angOffset of [-0.38, 0.38]) {
          const speed = 525;
          const baseAng = Math.atan2(baseBall.vy, baseBall.vx) + angOffset;
          this.balls.push({
            x: baseBall.x,
            y: baseBall.y,
            vx: Math.cos(baseAng) * speed,
            vy: -Math.abs(Math.sin(baseAng) * speed) - 120,
            r: 15,
            rot: 0,
            stuck: false,
            trail: []
          });
        }
      }
    } else if (d.kind === "wide") {
      this.addScore(130);
      this.wideTimer = 5.0;
      label = "¡PALETA GIGANTE!";
      col = "#00E676";
    } else if (d.kind === "fireball") {
      this.addScore(150);
      this.fireballTimer = 3.8;
      label = "¡ESFERA DE FUEGO SOLAR!";
      col = "#FF9100";
    } else if (d.kind === "cannon") {
      this.addScore(160);
      this.cannonTimer = 4.5;
      this.cannonShotCooldown = 0.1;
      label = "¡CAÑÓN DE CARÁMBANOS!";
      col = "#00E5FF";
    } else {
      this.addScore(150);
      this.shieldTimer = 6.5;
      label = "¡ESCUDO GLACIAL BASE!";
      col = "#80DEEA";
    }

    this.addFloatingText(label, d.x, d.y - 18, col, 1.25);
  }

  // ==========================================================================
  // RENDERIZADO DEL ESCENARIO Y ELEMENTOS
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const bounds = this.getArenaBounds();
    const { w, h, left, right, top, bottom, arenaW, paddleY } = bounds;
    const t = performance.now() * 0.001;

    drawNightSky(ctx, w, h, t, this.skyStars);
    if (imgReady(this.bgImg)) {
      ctx.save();
      ctx.globalAlpha = 0.44;
      ctx.drawImage(this.bgImg, 0, 0, w, h);
      ctx.restore();
    }

    // 1. Bóveda Glacial 3D (Marco del Templo de Cristal)
    this.drawGlacialArenaFrame(ctx, left, top, arenaW, bottom - top, t);

    // 2. Escudo Glacial Protector en la base si está activo
    if (this.shieldTimer > 0) {
      const shieldY = bottom - 12;
      const pulse = 0.65 + 0.35 * Math.sin(t * 9);
      ctx.save();
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.9 * pulse})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(left + 12, shieldY);
      ctx.lineTo(right - 12, shieldY);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Bumpers Polares
    for (const bmp of this.bumpers) {
      this.drawPolarBumper(ctx, bmp, t);
    }

    // 4. Ladrillos de Cristal y Regalos Congelados
    for (const br of this.bricks) {
      if (!br.alive) continue;
      this.drawBrick(ctx, br, t);
    }

    // 5. Esquirlas de Hielo físicas
    for (const s of this.shards) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(0, -s.size);
      ctx.lineTo(s.size * 0.7, 0);
      ctx.lineTo(0, s.size);
      ctx.lineTo(-s.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 6. Juguetes Rescatados flotando
    for (const toy of this.rescuedToys) {
      if (!imgReady(toy.sprite)) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, toy.alpha);
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 12;
      ctx.drawImage(toy.sprite, toy.x - 20, toy.y - 20, 40, 40);
      ctx.restore();
    }

    // 7. Proyectiles del Cañón de Carámbanos
    for (const bolt of this.bolts) {
      ctx.save();
      ctx.fillStyle = "#00E5FF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(bolt.x, bolt.y - 12);
      ctx.lineTo(bolt.x + 4, bolt.y + 6);
      ctx.lineTo(bolt.x - 4, bolt.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 8. Cápsulas de Poder
    for (const d of this.drops) {
      if (!d.active) continue;
      this.drawPowerDrop(ctx, d);
    }

    // 9. Guía de Puntería Láser cuando la esfera está lista para despegar
    const stuckBall = this.balls.find((b) => b.stuck);
    if (stuckBall) {
      this.drawAimGuide(ctx, stuckBall.x, stuckBall.y, this.getAimAngle());
    }

    // 10. Paleta Lanzadora Navideña
    this.drawPaddle(ctx, this.paddleX, paddleY, this.paddleW, this.paddleH, t);

    // 11. Esferas Mágicas
    for (const b of this.balls) {
      this.drawBall(ctx, b);
    }

    // 12. HUD Superior e Indicadores de Nivel y Poder
    const remaining = this.bricks.filter((b) => b.alive).length;
    drawPill(ctx, `${this.currentLevelTitle} • BLOQUES: ${remaining}`, w / 2, 64, "#00E5FF", 310);

    if (this.comboMultiplier > 1) {
      drawPill(ctx, `RACHA x${this.comboMultiplier} (${this.combo})`, left + 95, 64, "#00E676", 145);
    }

    if (this.fireballTimer > 0) {
      drawPill(ctx, `ESFERA SOLAR: ${this.fireballTimer.toFixed(1)}s`, w / 2, paddleY - 46, "#FF9100", 235);
    } else if (this.cannonTimer > 0) {
      drawPill(ctx, `CAÑÓN DE HIELO: ${this.cannonTimer.toFixed(1)}s`, w / 2, paddleY - 46, "#00E5FF", 235);
    } else if (this.wideTimer > 0) {
      drawPill(ctx, `PALETA GIGANTE: ${this.wideTimer.toFixed(1)}s`, w / 2, paddleY - 46, "#00E676", 235);
    } else if (stuckBall) {
      drawPill(ctx, "APUNTA Y TOCA PARA LANZAR LA ESFERA", w / 2, paddleY - 52, "#FFD700", 310);
    }
  }

  private drawGlacialArenaFrame(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    arenaW: number,
    arenaH: number,
    t: number
  ): void {
    ctx.save();
    const bgGrad = ctx.createLinearGradient(left, top, left, top + arenaH);
    bgGrad.addColorStop(0, "rgba(7, 20, 44, 0.88)");
    bgGrad.addColorStop(0.6, "rgba(10, 28, 58, 0.84)");
    bgGrad.addColorStop(1, "rgba(6, 16, 36, 0.92)");
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    roundRectPath(ctx, left, top, arenaW, arenaH, 22);
    ctx.fill();
    ctx.stroke();

    const glowAlpha = 0.35 + 0.15 * Math.sin(t * 2.5);
    ctx.strokeStyle = `rgba(0, 229, 255, ${glowAlpha})`;
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, left + 7, top + 7, arenaW - 14, arenaH - 14, 16);
    ctx.stroke();

    if (imgReady(this.icicleImg)) {
      const count = 9;
      const step = (arenaW - 80) / (count - 1);
      for (let i = 0; i < count; i++) {
        const ix = left + 40 + i * step;
        ctx.drawImage(this.icicleImg, ix - 11, top + 3, 22, 26);
      }
    }
    ctx.restore();
  }

  private drawAimGuide(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    ctx.save();
    const len = 125;
    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const d = (len / steps) * i;
      const px = x + Math.cos(angle) * d;
      const py = y + Math.sin(angle) * d;
      const r = 4.2 - (i / steps) * 1.8;
      ctx.fillStyle = i % 2 === 0 ? "#00E5FF" : "#FFD700";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPolarBumper(ctx: CanvasRenderingContext2D, bmp: PolarBumper, t: number): void {
    ctx.save();
    if (bmp.ringProgress > 0) {
      const ringR = bmp.r + bmp.ringProgress * 34;
      ctx.strokeStyle = `rgba(0, 229, 255, ${1 - bmp.ringProgress})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bmp.x, bmp.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    const scale = 1 + bmp.hitPop * 0.25 + Math.sin(t * 4) * 0.03;
    ctx.translate(bmp.x, bmp.y);
    ctx.scale(scale, scale);

    ctx.shadowColor = "rgba(0, 229, 255, 0.55)";
    ctx.shadowBlur = 12;

    if (imgReady(this.bumperImg)) {
      const d = bmp.r * 2.25;
      ctx.drawImage(this.bumperImg, -d / 2, -d / 2, d, d);
    } else {
      ctx.fillStyle = "#00E5FF";
      ctx.beginPath();
      ctx.arc(0, 0, bmp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBrick(ctx: CanvasRenderingContext2D, br: Brick, t: number): void {
    ctx.save();
    const ox = br.hitShake > 0 ? Math.sin(t * 55) * 3.5 * br.hitShake : 0;
    const x = br.x + ox;
    const y = br.y;

    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    if (br.kind === "ice" && imgReady(this.brickIceImg)) {
      ctx.drawImage(this.brickIceImg, x - 2, y - 3, br.w + 4, br.h + 6);
    } else if (br.kind === "crystal") {
      if (imgReady(this.brickIceImg)) {
        ctx.save();
        ctx.filter = "hue-rotate(25deg) brightness(1.15)";
        ctx.drawImage(this.brickIceImg, x - 2, y - 3, br.w + 4, br.h + 6);
        ctx.restore();
      } else {
        ctx.fillStyle = br.color;
        roundRectPath(ctx, x, y, br.w, br.h, 8);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 3, y + 3, br.w - 6, br.h - 6);
    } else if (br.kind === "gold" && imgReady(this.brickGoldImg)) {
      ctx.drawImage(this.brickGoldImg, x - 2, y - 2, br.w + 4, br.h + 4);
    } else if (br.kind === "gift-red" && imgReady(this.brickGiftImg)) {
      ctx.drawImage(this.brickGiftImg, x - 2, y - 2, br.w + 4, br.h + 4);
    } else if ((br.kind === "gift-green" || br.kind === "gift-blue") && imgReady(this.brickIceImg)) {
      ctx.drawImage(this.brickIceImg, x - 2, y - 3, br.w + 4, br.h + 6);
      const giftSpr = br.kind === "gift-green" ? this.giftGreenImg : this.giftBlueImg;
      drawFitted(ctx, giftSpr, x + br.w / 2 - 16, y + br.h / 2 - 15, 32, 32);
    } else if (br.kind === "sponsor" && br.sponsor) {
      if (imgReady(this.brickGoldImg)) {
        ctx.drawImage(this.brickGoldImg, x - 2, y - 2, br.w + 4, br.h + 4);
      }
      drawSponsorMedallion(ctx, br.sponsor.logo, x + br.w / 2, y + br.h / 2, Math.min(br.w, br.h) * 0.44);
    } else {
      ctx.fillStyle = br.color;
      roundRectPath(ctx, x, y, br.w, br.h, 10);
      ctx.fill();
    }

    if (br.maxHp > 1 && br.hp < br.maxHp) {
      const cx = x + br.w / 2;
      const cy = y + br.h / 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - 16, y + 6);
      ctx.lineTo(cx - 3, cy);
      ctx.lineTo(cx + 10, cy - 5);
      ctx.lineTo(cx + 18, y + br.h - 6);
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx - 12, y + br.h - 7);
      if (br.hp === 1 && br.maxHp >= 3) {
        ctx.moveTo(cx + 10, cy - 5);
        ctx.lineTo(cx + 20, cy - 2);
        ctx.moveTo(cx - 8, y + 4);
        ctx.lineTo(cx - 16, cy + 4);
      }
      ctx.stroke();

      // Indicadores de HP restantes en la base del bloque
      for (let h = 0; h < br.hp; h++) {
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(x + 8 + h * 9, y + br.h - 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawPaddle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    y: number,
    w: number,
    h: number,
    t: number
  ): void {
    ctx.save();
    const tilt = Math.max(-0.08, Math.min(0.08, this.paddleVelX * 0.00009));
    ctx.translate(cx, y + h / 2);
    ctx.rotate(tilt);

    if (this.wideTimer > 0) {
      ctx.shadowColor = "#00E676";
      ctx.shadowBlur = 16;
    } else if (this.cannonTimer > 0) {
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = 10;
    }

    if (imgReady(this.paddleImg)) {
      ctx.drawImage(this.paddleImg, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = "#D32F2F";
      roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
    }

    if (this.cannonTimer > 0) {
      const pulse = 1 + Math.sin(t * 12) * 0.1;
      for (const side of [-1, 1]) {
        const tx = side * (w * 0.42);
        const ty = -h * 0.52;
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tx - 6, ty - 8 * pulse, 12, 14, 4);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawBall(ctx: CanvasRenderingContext2D, b: MagicBall): void {
    ctx.save();
    const isFire = this.fireballTimer > 0;

    for (let i = 0; i < b.trail.length; i++) {
      const tr = b.trail[i];
      const ratio = (i + 1) / b.trail.length;
      ctx.fillStyle = isFire
        ? `rgba(255, 145, 0, ${ratio * 0.5})`
        : `rgba(0, 229, 255, ${ratio * 0.38})`;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, b.r * ratio * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    const halo = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.r * 2.0);
    halo.addColorStop(0, isFire ? "rgba(255, 109, 0, 0.9)" : "rgba(0, 229, 255, 0.75)");
    halo.addColorStop(1, "rgba(0, 229, 255, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    if (imgReady(this.orbImg)) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      const d = b.r * 2.35;
      ctx.drawImage(this.orbImg, -d / 2, -d / 2, d, d);
      ctx.restore();
    } else {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPowerDrop(ctx: CanvasRenderingContext2D, d: PowerDrop): void {
    ctx.save();
    ctx.translate(d.x, d.y);

    const col =
      d.kind === "multiball"
        ? "#00E5FF"
        : d.kind === "wide"
        ? "#00E676"
        : d.kind === "fireball"
        ? "#FF9100"
        : d.kind === "cannon"
        ? "#40C4FF"
        : "#FFD700";

    ctx.fillStyle = "rgba(10, 24, 52, 0.92)";
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const spr =
      d.kind === "multiball"
        ? this.starImg
        : d.kind === "wide"
        ? this.candyImg
        : d.kind === "fireball"
        ? this.giftGoldImg
        : d.kind === "cannon"
        ? this.icicleImg
        : this.brickIceImg;

    drawFitted(ctx, spr, -15, -15, 30, 30);
    ctx.restore();
  }
}
