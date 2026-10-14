/**
 * ==============================================================================
 * JUEGO 6: 🛷 EL DESCENSO DE PAPÁ NOEL: RESCATE EN LAS COLINAS NEVADAS
 * ==============================================================================
 *
 * Dirección Artística: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Arquitectura:
 * - Espacio virtual independiente de la resolución: toda la jugabilidad se simula en
 *   un área de juego de VH unidades de alto; se escala a la pantalla real con `S`.
 *   Así el trineo, las colinas y los obstáculos mantienen la misma proporción en
 *   móvil, tablet, tótem o escritorio.
 * - Terreno por segmentos (llanos, colinas, valles, ondulaciones y rampas) unidos con
 *   interpolación coseno: las uniones son suaves y los tramos planos son realmente planos.
 * - Los coleccionables, obstáculos y la decoración se generan por segmento, reservando
 *   espacio para que nunca se encimen.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";

type CollectibleType = "gift_red" | "gift_green" | "candy" | "teddy" | "robot" | "logo_feria" | "logo_sponsor";
type ObstacleType = "snowman" | "crystal" | "log" | "rock" | "ice";
type SegmentKind = "flat" | "hill" | "valley" | "rolling" | "kicker";

interface TerrainPoint {
  x: number;
  y: number;
}

interface SledCollectible {
  worldX: number;
  y: number;
  type: CollectibleType;
  sponsorId?: string;
  points: number;
  size: number;
  floatPhase: number;
}

interface SledObstacle {
  worldX: number;
  type: ObstacleType;
  width: number;
  height: number;
  cleared: boolean;
}

interface ScenicProp {
  worldX: number;
  kind: "tree" | "house" | "banner";
  scale: number;
  variant: number;
}

interface DistantProp {
  worldX: number;
  kind: "tree" | "house";
  scale: number;
}

interface SnowSprayParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  gold: boolean;
}

interface AmbientSnowflake {
  x: number;
  y: number;
  r: number;
  vy: number;
  drift: number;
  phase: number;
  alpha: number;
}

interface SkiTrackPoint {
  worldX: number;
  y: number;
  seg: number;
  life: number;
}

// ---------------------------------------------------------------------------
// Constantes del espacio virtual
// ---------------------------------------------------------------------------
const VH = 560; // Alto virtual del área de juego
const Y_HIGH = 235; // Cota más alta posible del terreno
const Y_LOW = 505; // Cota más baja posible del terreno
const Y_START = 420;

const GRAVITY = 2100;
const HOLD_GRAVITY = 1150;
const HOLD_MAX_TIME = 0.28;
const JUMP_VELOCITY = -760;
const DOUBLE_JUMP_VELOCITY = -640;
const BASE_SPEED = 400;
const MAX_SPEED = 820;
const MIN_SPEED = 290;
const SLOPE_ACCEL = 950;

const SLEIGH_W = 150;
const SLEIGH_H = (SLEIGH_W / 1183) * 791;

const OBSTACLE_SPECS: Record<ObstacleType, { w: number; h: number }> = {
  snowman: { w: 68, h: 80 },
  crystal: { w: 68, h: 80 },
  log: { w: 98, h: 74 },
  rock: { w: 58, h: 50 },
  ice: { w: 58, h: 52 }
};

const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export class SantaHillsGame extends BaseGame {
  // Viewport (escala real ↔ virtual)
  private S: number = 1;
  private playTop: number = 60;
  private VW: number = 1000;

  // Papá Noel
  private santaX: number = 240;
  private santaY: number = Y_START;
  private santaVy: number = 0;
  private santaAngle: number = 0;
  private isGrounded: boolean = true;
  private canDoubleJump: boolean = false;
  private holdTimer: number = 0;
  private wasActionPressed: boolean = false;
  private trickProgress: number = 0;
  private isDoingTrick: boolean = false;
  private airTime: number = 0;

  // Suspensión elástica (resorte amortiguado)
  private squashX: number = 1;
  private squashY: number = 1;
  private squashVX: number = 0;
  private squashVY: number = 0;
  private bobPhase: number = 0;

  // Mundo
  private worldDistance: number = 0;
  private speed: number = BASE_SPEED;
  private diffMult: number = 1;
  private totalPlayTime: number = 0;

  // Terreno procedural
  private terrain: TerrainPoint[] = [];
  private genX: number = 0;
  private genY: number = Y_START;
  private segmentsSinceFlat: number = 0;
  private lastKind: SegmentKind = "flat";
  private occupied: Array<[number, number]> = [];
  private nextLogoX: number = 2600;
  private flatCounter: number = 0;

  // Entidades
  private collectibles: SledCollectible[] = [];
  private obstacles: SledObstacle[] = [];
  private scenic: ScenicProp[] = [];
  private distantProps: DistantProp[] = [];
  private nextDistantX: number = 0;

  // Efectos
  private spray: SnowSprayParticle[] = [];
  private flakes: AmbientSnowflake[] = [];
  private tracks: SkiTrackPoint[] = [];
  private trackSeg: number = 0;
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private hitCooldown: number = 0;

  // Sprites
  private imgSantaSleigh: HTMLImageElement;
  private imgGiftRed: HTMLImageElement;
  private imgGiftGreen: HTMLImageElement;
  private imgCandy: HTMLImageElement;
  private imgTeddy: HTMLImageElement;
  private imgRobot: HTMLImageElement;
  private imgRock: HTMLImageElement;
  private imgIce: HTMLImageElement;
  private imgSnowman: HTMLImageElement;
  private imgCrystal: HTMLImageElement;
  private imgLog: HTMLImageElement;
  private imgTree: HTMLImageElement;
  private imgHouse: HTMLImageElement;
  private imgSignFeria: HTMLImageElement;
  private imgSignSponsor: HTMLImageElement;
  private imgMedallonFeria: HTMLImageElement;
  private imgBgSeamless: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement, input: InputManager, audio: AudioManager, particles: ParticleSystem) {
    super(
      "santa-hills",
      "El Descenso de Santa",
      "¡Deslízate por las colinas nevadas, salta en las crestas y recupera los regalos de Papá Noel!",
      canvas,
      input,
      audio,
      particles
    );

    this.showLives = true;
    this.maxLives = 5;
    this.lives = 5;
    this.inGameMusicPath = "./assets/audio/jingle-bells.mp3";
    this.inGameMusicVolume = 0.44;

    const load = (src: string): HTMLImageElement => {
      const img = new Image();
      img.src = src;
      return img;
    };

    this.imgSantaSleigh = load("./assets/images/santa-trineo.png");
    this.imgGiftRed = load("./assets/images/regalo-rojo.png");
    this.imgGiftGreen = load("./assets/images/regalo-verde.png");
    this.imgCandy = load("./assets/images/baston-caramelo.png");
    this.imgTeddy = load("./assets/images/osito.png");
    this.imgRobot = load("./assets/images/robot.png");
    this.imgRock = load("./assets/images/carbon.png");
    this.imgIce = load("./assets/images/hielo.png");
    this.imgSnowman = load("./assets/images/obstaculo-muneco.png");
    this.imgCrystal = load("./assets/images/obstaculo-cristal.png");
    this.imgLog = load("./assets/images/obstaculo-tronco.png");
    this.imgTree = load("./assets/images/arbol.png");
    this.imgHouse = load("./assets/images/casa-navidena-clean.png");
    this.imgSignFeria = load("./assets/images/cartel-feria.png");
    this.imgSignSponsor = load("./assets/images/cartel-sponsor.png");
    this.imgMedallonFeria = load("./assets/images/medallon-feria.png");
    this.imgBgSeamless = load("./assets/images/fondo-villa-seamless.jpg");
  }

  // =========================================================================
  // CICLO DE VIDA
  // =========================================================================

  protected override onStart(): void {
    this.updateViewport();

    this.score = 0;
    this.timeRemaining = 45;
    this.lives = 5;
    this.worldDistance = 0;
    this.speed = BASE_SPEED;
    this.diffMult = 1;
    this.totalPlayTime = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.hitCooldown = 0;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;

    this.santaVy = 0;
    this.isGrounded = true;
    this.canDoubleJump = false;
    this.holdTimer = 0;
    this.wasActionPressed = false;
    this.trickProgress = 0;
    this.isDoingTrick = false;
    this.airTime = 0;
    this.squashX = this.squashY = 1;
    this.squashVX = this.squashVY = 0;
    this.bobPhase = 0;

    this.collectibles = [];
    this.obstacles = [];
    this.scenic = [];
    this.distantProps = [];
    this.nextDistantX = -200;
    this.spray = [];
    this.tracks = [];
    this.trackSeg = 0;
    this.occupied = [];

    // Terreno inicial: tramo plano de calentamiento
    this.terrain = [
      { x: -600, y: Y_START },
      { x: 700, y: Y_START }
    ];
    this.genX = 700;
    this.genY = Y_START;
    this.segmentsSinceFlat = 0;
    this.lastKind = "flat";
    this.nextLogoX = 2600;
    this.flatCounter = 0;
    this.occupied.push([-600, 700]);
    this.addScenic(380, "tree", 1.0);
    this.ensureTerrain();

    this.santaY = this.terrainY(this.worldDistance + this.santaX);
    this.santaAngle = 0;

    this.initFlakes();
  }

  private updateViewport(): void {
    const hudTop = clamp(this.height * 0.11, 46, 80);
    const playH = Math.max(200, this.height - hudTop);
    const isPortrait = this.height > this.width;

    if (isPortrait) {
      // En modo vertical móvil, escala el trineo a un tamaño protagonista (~135-155px)
      // para que Papá Noel y las colinas se aprecien en detalle y no queden diminutos.
      const targetSleighW = clamp(this.width * 0.36, 130, 160);
      this.S = clamp(targetSleighW / SLEIGH_W, 0.85, 1.15);
      // Colocar la cota media del terreno (~Y_START) alrededor del 68% de la pantalla
      // para que las colinas ocupen el 60% inferior con gran dinamismo y el cielo el 40% superior.
      const targetBaseY = this.height * 0.68;
      this.playTop = targetBaseY - Y_START * this.S;
      this.VW = this.width / this.S;
      this.santaX = clamp(this.VW * 0.23, 100, 150);
    } else {
      this.S = Math.min(playH / VH, this.width / 820);
      this.playTop = this.height - VH * this.S;
      this.VW = this.width / this.S;
      this.santaX = clamp(this.VW * 0.24, 150, 300);
    }
  }

  /** Convierte coordenadas virtuales a coordenadas de pantalla (para textos/partículas globales) */
  private sx(x: number): number {
    return x * this.S;
  }

  private sy(y: number): number {
    return this.playTop + y * this.S;
  }

  private initFlakes(): void {
    this.flakes = [];
    const count = Math.round(clamp((this.width * this.height) / 18000, 30, 90));
    for (let i = 0; i < count; i++) {
      this.flakes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: rand(1, 2.8),
        vy: rand(35, 85),
        drift: rand(-25, -8),
        phase: Math.random() * Math.PI * 2,
        alpha: rand(0.35, 0.85)
      });
    }
  }

  // =========================================================================
  // TERRENO POR SEGMENTOS
  // =========================================================================

  private terrainY(x: number): number {
    const pts = this.terrain;
    if (x <= pts[0].x) return pts[0].y;
    const last = pts[pts.length - 1];
    if (x >= last.x) return last.y;

    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].x <= x) lo = mid;
      else hi = mid;
    }
    const a = pts[lo];
    const b = pts[hi];
    const t = (x - a.x) / (b.x - a.x);
    return a.y + (b.y - a.y) * (1 - Math.cos(Math.PI * t)) * 0.5;
  }

  /** Ángulo de la pendiente (positivo = cuesta abajo, ya que Y crece hacia abajo) */
  private terrainAngle(x: number): number {
    const pts = this.terrain;
    if (x <= pts[0].x || x >= pts[pts.length - 1].x) return 0;
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].x <= x) lo = mid;
      else hi = mid;
    }
    const a = pts[lo];
    const b = pts[hi];
    const len = b.x - a.x;
    const t = (x - a.x) / len;
    const dydx = ((b.y - a.y) * Math.PI * 0.5 * Math.sin(Math.PI * t)) / len;
    return Math.atan(dydx);
  }

  private ensureTerrain(): void {
    const ahead = this.worldDistance + this.VW + 900;
    while (this.genX < ahead) {
      this.generateSegment();
    }
    // Liberar puntos ya recorridos
    while (this.terrain.length > 3 && this.terrain[1].x < this.worldDistance - 400) {
      this.terrain.shift();
    }
    this.occupied = this.occupied.filter((r) => r[1] > this.worldDistance - 400);
  }

  private pushPoint(dx: number, y: number): void {
    this.genX += dx;
    this.genY = clamp(y, Y_HIGH, Y_LOW);
    this.terrain.push({ x: this.genX, y: this.genY });
  }

  private chooseKind(): SegmentKind {
    if (this.segmentsSinceFlat >= 2) return "flat";
    const r = Math.random();
    // Si el terreno está muy alto, preferir descensos; si está bajo, preferir colinas
    if (this.genY < Y_HIGH + 70) return r < 0.6 ? "valley" : "flat";
    if (this.genY > Y_LOW - 60) return r < 0.6 ? "hill" : "kicker";
    if (r < 0.3) return "hill";
    if (r < 0.5) return "valley";
    if (r < 0.68) return "rolling";
    if (r < 0.82) return "kicker";
    return this.lastKind === "flat" ? "hill" : "flat";
  }

  private generateSegment(): void {
    const kind = this.chooseKind();
    this.lastKind = kind;
    this.segmentsSinceFlat = kind === "flat" ? 0 : this.segmentsSinceFlat + 1;
    const startX = this.genX;

    switch (kind) {
      case "flat": {
        this.flatCounter++;
        const len = rand(420, 680);
        this.pushPoint(len, this.genY);
        this.populateFlat(startX, this.genX);
        break;
      }
      case "hill": {
        const up = Math.min(rand(110, 190), this.genY - Y_HIGH);
        const lenUp = Math.max(260, up / rand(0.32, 0.44));
        this.pushPoint(lenUp, this.genY - up);
        const peakX = this.genX;
        const peakY = this.genY;
        const down = Math.min(rand(up * 0.8, up * 1.35), Y_LOW - this.genY);
        const lenDown = Math.max(260, down / rand(0.3, 0.42));
        this.pushPoint(lenDown, this.genY + down);
        this.populateHill(startX, peakX, peakY, this.genX);
        break;
      }
      case "valley": {
        const down = Math.min(rand(90, 170), Y_LOW - this.genY);
        const lenDown = Math.max(240, down / rand(0.32, 0.42));
        this.pushPoint(lenDown, this.genY + down);
        const bottomX = this.genX;
        const up = Math.min(rand(down * 0.6, down * 1.1), this.genY - Y_HIGH);
        const lenUp = Math.max(240, up / rand(0.32, 0.42));
        this.pushPoint(lenUp, this.genY - up);
        this.populateValley(startX, bottomX, this.genX);
        break;
      }
      case "rolling": {
        const bumps = Math.random() < 0.5 ? 2 : 3;
        const tops: number[] = [];
        for (let i = 0; i < bumps; i++) {
          const amp = rand(38, 62);
          this.pushPoint(rand(180, 230), this.genY - amp);
          tops.push(this.genX);
          this.pushPoint(rand(180, 230), this.genY + amp);
        }
        this.populateRolling(startX, tops, this.genX);
        break;
      }
      case "kicker": {
        // Rampa corta y pronunciada + meseta + caída: invita a un gran salto
        const rise = Math.min(rand(80, 115), this.genY - Y_HIGH);
        this.pushPoint(rand(210, 250), this.genY - rise);
        const lipX = this.genX;
        const lipY = this.genY;
        this.pushPoint(rand(120, 180), this.genY);
        const drop = Math.min(rand(120, 200), Y_LOW - this.genY);
        this.pushPoint(Math.max(300, drop / 0.4), this.genY + drop);
        this.populateKicker(startX, lipX, lipY, this.genX);
        break;
      }
    }

    this.maybePlaceLogo(startX, this.genX);
    this.decorateSegment(startX, this.genX);
  }

  // -------------------------------------------------------------------------
  // Población de segmentos
  // -------------------------------------------------------------------------

  private reserve(a: number, b: number): void {
    this.occupied.push([a, b]);
  }

  private isFree(a: number, b: number): boolean {
    for (const r of this.occupied) {
      if (a < r[1] && b > r[0]) return false;
    }
    for (const p of this.scenic) {
      const half = p.kind === "house" ? 80 : p.kind === "banner" ? 80 : 60;
      if (a < p.worldX + half && b > p.worldX - half) return false;
    }
    return true;
  }

  private addCollectible(x: number, y: number, type: CollectibleType, sponsorId?: string): void {
    const sizes: Record<CollectibleType, number> = {
      gift_red: 50,
      gift_green: 50,
      candy: 48,
      teddy: 56,
      robot: 54,
      logo_feria: 84,
      logo_sponsor: 84
    };
    const pts: Record<CollectibleType, number> = {
      gift_red: 100,
      gift_green: 150,
      candy: 50,
      teddy: 250,
      robot: 300,
      logo_feria: 500,
      logo_sponsor: 500
    };
    this.collectibles.push({
      worldX: x,
      y,
      type,
      sponsorId,
      points: pts[type],
      size: sizes[type],
      floatPhase: Math.random() * Math.PI * 2
    });
  }

  private addObstacle(x: number, type?: ObstacleType): void {
    const pool: ObstacleType[] = ["snowman", "crystal", "log"];
    const t = type ?? pool[Math.floor(Math.random() * pool.length)];
    const spec = OBSTACLE_SPECS[t];
    this.obstacles.push({ worldX: x, type: t, width: spec.w, height: spec.h, cleared: false });
    this.reserve(x - spec.w * 0.5 - 30, x + spec.w * 0.5 + 30);
  }

  /** Arco de regalos centrado en cx que sigue la parábola de un salto */
  private addGiftArc(cx: number, groundY: number, count: number = 5, spacing: number = 72, lift: number = 95): void {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = cx + (i - (count - 1) / 2) * spacing;
      const y = groundY - 52 - Math.sin(t * Math.PI) * lift;
      const type: CollectibleType = i === (count - 1) / 2 ? "gift_green" : i % 2 === 0 ? "gift_red" : "candy";
      this.addCollectible(x, y, type);
    }
    this.reserve(cx - ((count - 1) / 2) * spacing - 30, cx + ((count - 1) / 2) * spacing + 30);
  }

  private randomToy(): CollectibleType {
    const pool: CollectibleType[] = ["gift_red", "gift_green", "candy", "candy", "teddy", "robot"];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private populateFlat(a: number, b: number): void {
    if (a < 900) return; // Zona de calentamiento libre
    const mid = (a + b) * 0.5;
    const r = Math.random();
    if (r < 0.62) {
      // Obstáculo en el llano con arco de regalos encima: salto limpio y gratificante
      this.addObstacle(mid);
      this.addGiftArc(mid, this.terrainY(mid));
    } else if (r < 0.85) {
      // Fila de juguetes a ras de nieve
      const n = 4;
      for (let i = 0; i < n; i++) {
        const x = mid + (i - (n - 1) / 2) * 62;
        this.addCollectible(x, this.terrainY(x) - 40, i === 1 ? this.randomToy() : "candy");
      }
      this.reserve(mid - 130, mid + 130);
    } else {
      // Dos obstáculos separados: ritmo de doble salto
      const x1 = a + (b - a) * 0.3;
      const x2 = a + (b - a) * 0.75;
      if (x2 - x1 > 240) {
        this.addObstacle(x1);
        this.addObstacle(x2);
        this.addCollectible(x1, this.terrainY(x1) - 150, "gift_green");
        this.addCollectible(x2, this.terrainY(x2) - 150, "gift_red");
      }
    }
  }

  private populateHill(a: number, peakX: number, peakY: number, b: number): void {
    // Juguetes subiendo la ladera
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = a + (peakX - a) * (0.35 + i * 0.2);
      this.addCollectible(x, this.terrainY(x) - 40, i === n - 1 ? "gift_red" : "candy");
    }
    this.reserve(a + (peakX - a) * 0.3, a + (peakX - a) * 0.8);

    // Arco aéreo tras la cresta: recompensa por despegar en la cima
    if (Math.random() < 0.7) {
      const cx = peakX + 170;
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const x = cx + (i - 1.5) * 75;
        const y = peakY - 70 - Math.sin(t * Math.PI) * 70 + t * 40;
        this.addCollectible(x, y, i === 2 ? "gift_green" : "gift_red");
      }
      this.reserve(peakX + 30, peakX + 320);
    }

    // Obstáculo al pie de la bajada (en la parte suave)
    if (Math.random() < 0.35) {
      const ox = b - 90;
      if (Math.abs(this.terrainAngle(ox)) < 0.3) this.addObstacle(ox, Math.random() < 0.5 ? "log" : "crystal");
    }
  }

  private populateValley(a: number, bottomX: number, b: number): void {
    if (Math.random() < 0.45) {
      this.addObstacle(bottomX, Math.random() < 0.5 ? "snowman" : "log");
      this.addGiftArc(bottomX, this.terrainY(bottomX), 3, 80, 85);
    } else {
      for (let i = 0; i < 5; i++) {
        const x = bottomX + (i - 2) * 58;
        this.addCollectible(x, this.terrainY(x) - 40, i === 2 ? this.randomToy() : "candy");
      }
      this.reserve(bottomX - 150, bottomX + 150);
    }
    void a;
    void b;
  }

  private populateRolling(_a: number, tops: number[], _b: number): void {
    for (const tx of tops) {
      this.addCollectible(tx, this.terrainY(tx) - 60, Math.random() < 0.3 ? this.randomToy() : "candy");
      this.reserve(tx - 40, tx + 40);
    }
  }

  private populateKicker(_a: number, lipX: number, lipY: number, b: number): void {
    // Arco alto y largo tras la rampa
    const cx = lipX + 260;
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const x = cx + (i - 2) * 80;
      const y = lipY - 90 - Math.sin(t * Math.PI) * 90 + t * 60;
      this.addCollectible(x, y, i === 2 ? "teddy" : i % 2 === 0 ? "gift_red" : "candy");
    }
    this.reserve(lipX, lipX + 450);
    void b;
  }

  private maybePlaceLogo(a: number, b: number): void {
    if (this.nextLogoX > b) return;
    // Buscar un hueco libre en el segmento
    for (let x = Math.max(a + 80, this.nextLogoX); x < b - 80; x += 40) {
      if (this.isFree(x - 70, x + 70)) {
        const sponsor = BRANDING.getRandomSponsor();
        this.addCollectible(x, this.terrainY(x) - 135, "logo_sponsor", sponsor.id);
        this.reserve(x - 70, x + 70);
        this.nextLogoX = x + rand(3600, 4800);
        return;
      }
    }
  }

  private addScenic(x: number, kind: ScenicProp["kind"], scale: number): void {
    this.scenic.push({ worldX: x, kind, scale, variant: Math.floor(x / 97) % 2 });
  }

  private decorateSegment(a: number, b: number): void {
    // Vallas oficiales en algunos llanos
    if (this.lastKind === "flat" && this.flatCounter % 2 === 0) {
      const bx = b - 110;
      if (this.isFree(bx - 90, bx + 90)) this.addScenic(bx, "banner", 1);
    }

    // Árboles y casas en espacios libres con pendiente suave
    const attempts = Math.floor((b - a) / 260);
    for (let i = 0; i < attempts; i++) {
      if (Math.random() > 0.45) continue;
      const x = rand(a + 60, b - 60);
      if (Math.abs(this.terrainAngle(x)) > 0.38) continue;
      const isHouse = Math.random() < 0.22 && Math.abs(this.terrainAngle(x)) < 0.15;
      const half = isHouse ? 80 : 60;
      if (!this.isFree(x - half, x + half)) continue;
      this.addScenic(x, isHouse ? "house" : "tree", isHouse ? rand(0.85, 1.0) : rand(0.8, 1.1));
    }
  }

  // =========================================================================
  // ACTUALIZACIÓN
  // =========================================================================

  protected override onUpdate(dt: number): void {
    dt = Math.min(dt, 1 / 30);
    this.updateViewport();
    this.totalPlayTime += dt;

    this.diffMult = 1 + Math.min(0.75, (this.totalPlayTime / 35) * 0.75);
    const turbo = this.isLogoPowerUpActive ? 1.30 : 1;
    const targetSpeed = BASE_SPEED * this.diffMult * turbo;
    const maxSpeed = MAX_SPEED * this.diffMult * turbo;

    // ----- Entrada (tap = salto corto, mantener = salto alto) -----
    const pointer = this.input.getPrimaryPointer();
    const action =
      (pointer ? pointer.isDown : false) ||
      this.input.isKeyDown("Space") ||
      this.input.isKeyDown("KeyW") ||
      this.input.isKeyDown("ArrowUp");
    const justPressed = action && !this.wasActionPressed;
    this.wasActionPressed = action;

    // ----- Avance del mundo -----
    const prevGround = this.terrainY(this.worldDistance + this.santaX);
    this.worldDistance += this.speed * dt;
    this.ensureTerrain();
    const santaWorldX = this.worldDistance + this.santaX;
    const groundY = this.terrainY(santaWorldX);
    const groundAngle = this.terrainAngle(santaWorldX);

    if (this.isGrounded) {
      // Velocidad según la pendiente (bajar acelera, subir frena)
      this.speed += SLOPE_ACCEL * Math.sin(groundAngle) * dt;
      if (this.speed < targetSpeed) this.speed += (targetSpeed - this.speed) * 1.3 * dt;
      this.speed = clamp(this.speed, MIN_SPEED, maxSpeed);
      this.bobPhase += dt * this.speed * 0.04;

      const groundVy = (groundY - prevGround) / Math.max(dt, 0.0001);

      if (justPressed) {
        this.launch(JUMP_VELOCITY + Math.min(0, groundVy) * 0.35, groundAngle);
      } else {
        // Despegue natural en crestas: si el suelo "cae" más rápido que la gravedad
        const ballisticY = this.santaY + groundVy * dt + 0.5 * GRAVITY * dt * dt;
        if (groundY > ballisticY + 1.5 && this.speed > 420) {
          this.isGrounded = false;
          this.canDoubleJump = true;
          this.holdTimer = HOLD_MAX_TIME; // Sin bonus de mantener en despegue natural
          this.santaVy = groundVy;
          this.airTime = 0;
          this.trackSeg++;
        } else {
          this.santaY = groundY;
          this.santaVy = groundVy;
          this.santaAngle += (groundAngle - this.santaAngle) * Math.min(1, 12 * dt);
          this.emitRoosterTail();
          this.tracks.push({ worldX: santaWorldX - 30, y: groundY, seg: this.trackSeg, life: 1 });
        }
      }
    } else if (justPressed && this.canDoubleJump) {
      this.doubleJump();
    }

    if (!this.isGrounded) {
      this.airTime += dt;
      const holding = action && this.santaVy < 0 && this.holdTimer < HOLD_MAX_TIME;
      if (holding) this.holdTimer += dt;
      this.santaVy += (holding ? HOLD_GRAVITY : GRAVITY) * dt;
      this.santaY += this.santaVy * dt;
      this.speed += (targetSpeed - this.speed) * 0.15 * dt;

      // Techo suave para que Santa nunca salga del área visible
      if (this.santaY < SLEIGH_H + 6) {
        this.santaY = SLEIGH_H + 6;
        if (this.santaVy < 0) this.santaVy = 0;
      }

      // Pirueta con easing
      if (this.isDoingTrick) {
        this.trickProgress += dt * 2.6;
        if (this.trickProgress >= 1) {
          this.trickProgress = 0;
          this.isDoingTrick = false;
          this.score += 150;
          this.addFloatingText("¡PIRUETA! +150", this.sx(this.santaX), this.sy(this.santaY - 90), "#00E5FF", 1.1);
        }
      }

      const flightAngle = clamp(Math.atan2(this.santaVy, this.speed), -0.5, 0.6);
      this.santaAngle += (flightAngle - this.santaAngle) * Math.min(1, 7 * dt);

      if (this.santaY >= groundY) this.land(groundY, groundAngle);
    }

    // ----- Resorte de suspensión -----
    const k = 210;
    const damp = 15;
    this.squashVX += (-k * (this.squashX - 1) - damp * this.squashVX) * dt;
    this.squashVY += (-k * (this.squashY - 1) - damp * this.squashVY) * dt;
    this.squashX += this.squashVX * dt;
    this.squashY += this.squashVY * dt;

    // ----- Temporizadores -----
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }
    if (this.isLogoPowerUpActive && this.timeRemaining <= 0) {
      this.isLogoPowerUpActive = false;
      this.logoPowerUpTimer = 0;
    }

    this.updateEffects(dt);
    this.updateEntities(dt);
  }

  private launch(vy: number, groundAngle: number): void {
    this.isGrounded = false;
    this.canDoubleJump = true;
    this.holdTimer = 0;
    this.airTime = 0;
    this.santaVy = vy;
    this.trackSeg++;

    this.squashX = 0.84;
    this.squashY = 1.2;
    this.squashVX = 3;
    this.squashVY = -3;

    // Despegue en subida pronunciada = gran salto
    if (groundAngle < -0.25) {
      this.speed += 60;
      this.addFloatingText("¡GRAN SALTO!", this.sx(this.santaX), this.sy(this.santaY - 80), "#FFD700", 1.15);
    }
    this.audio.playElfFly();
    this.emitSnowBurst(this.santaX - 10, this.santaY, 10);
  }

  private doubleJump(): void {
    this.canDoubleJump = false;
    this.santaVy = DOUBLE_JUMP_VELOCITY;
    this.holdTimer = HOLD_MAX_TIME;
    this.isDoingTrick = true;
    this.trickProgress = 0;
    this.squashX = 0.86;
    this.squashY = 1.18;
    this.squashVX = 3;
    this.squashVY = -3;
    this.audio.playElfFly();
    this.particles.emitBurst(this.sx(this.santaX), this.sy(this.santaY - 30), "#B3E5FC", 12);
  }

  private land(groundY: number, groundAngle: number): void {
    const impact = Math.min(1, Math.abs(this.santaVy) / 1100);
    const wasTrick = this.isDoingTrick;
    this.santaY = groundY;
    this.isGrounded = true;
    this.isDoingTrick = false;
    this.trickProgress = 0;

    this.squashX = 1 + 0.25 * impact + 0.05;
    this.squashY = 1 - 0.28 * impact - 0.05;
    this.squashVX = 0;
    this.squashVY = 0;

    this.emitSnowBurst(this.santaX, groundY, 8 + Math.round(impact * 12));

    const diff = Math.abs(this.santaAngle - groundAngle);
    if (!wasTrick && this.airTime > 0.45 && diff < 0.3) {
      this.speed += 110;
      this.score += 100;
      this.audio.playTap();
      this.addFloatingText("¡PERFECTO! +100", this.sx(this.santaX), this.sy(groundY - 95), "#76FF03", 1);
    }
    this.santaAngle = groundAngle * 0.5 + this.santaAngle * 0.5;
    this.santaVy = 0;
  }

  // =========================================================================
  // EFECTOS
  // =========================================================================

  private emitRoosterTail(): void {
    if (Math.random() > 0.75) return;
    const count = this.speed > 560 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const ang = Math.PI + 0.35 + (Math.random() - 0.5) * 0.5; // hacia atrás y arriba
      const v = rand(120, 240);
      this.spray.push({
        x: this.santaX - 55,
        y: this.santaY - 4,
        vx: Math.cos(ang) * v,
        vy: -Math.abs(Math.sin(ang) * v) - rand(30, 80),
        size: rand(2.5, 5),
        life: 0,
        maxLife: rand(0.3, 0.5),
        gold: this.isLogoPowerUpActive
      });
    }
  }

  private emitSnowBurst(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.PI + Math.random() * Math.PI; // semicírculo superior
      const v = rand(90, 260);
      this.spray.push({
        x: x + rand(-30, 30),
        y: y - 2,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        size: rand(3, 6),
        life: 0,
        maxLife: rand(0.35, 0.6),
        gold: false
      });
    }
  }

  private updateEffects(dt: number): void {
    for (let i = this.spray.length - 1; i >= 0; i--) {
      const p = this.spray[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.spray.splice(i, 1);
        continue;
      }
      p.x += (p.vx - this.speed * 0.35) * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
    }

    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const t = this.tracks[i];
      t.life -= dt * 0.6;
      if (t.life <= 0 || t.worldX < this.worldDistance - 50) this.tracks.splice(i, 1);
    }
    if (this.tracks.length > 160) this.tracks.splice(0, this.tracks.length - 160);

    for (const f of this.flakes) {
      f.phase += dt * 1.6;
      f.y += f.vy * dt;
      f.x += (f.drift - this.speed * 0.06 * f.r) * dt + Math.sin(f.phase) * 10 * dt;
      if (f.y > this.height + 6) {
        f.y = -6;
        f.x = Math.random() * this.width;
      }
      if (f.x < -8) f.x = this.width + 8;
    }
  }

  // =========================================================================
  // COLISIONES
  // =========================================================================

  private updateEntities(dt: number): void {
    const bx1 = this.santaX - 55;
    const bx2 = this.santaX + 62;
    const by1 = this.santaY - SLEIGH_H * 0.82;
    const by2 = this.santaY - 4;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.floatPhase += dt * 3;
      let cx = c.worldX - this.worldDistance;

      // Imán del Trineo Dorado
      if (this.isLogoPowerUpActive && c.type !== "logo_feria") {
        const dx = this.santaX - cx;
        const dy = this.santaY - 40 - c.y;
        const d = Math.hypot(dx, dy);
        if (d < 380 && d > 1) {
          const pull = 700 * dt;
          c.worldX += (dx / d) * pull;
          c.y += (dy / d) * pull;
          cx = c.worldX - this.worldDistance;
        }
      }

      const h = c.size * 0.42;
      if (cx + h > bx1 && cx - h < bx2 && c.y + h > by1 && c.y - h < by2) {
        this.collect(c);
        this.collectibles.splice(i, 1);
        continue;
      }
      if (cx < -150) this.collectibles.splice(i, 1);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      const ox = o.worldX - this.worldDistance;
      if (ox < -200) {
        this.obstacles.splice(i, 1);
        continue;
      }
      if (o.cleared || this.hitCooldown > 0) continue;
      const gy = this.terrainY(o.worldX);
      const hw = o.width * 0.34;
      const top = gy - o.height * 0.72;
      if (ox + hw > bx1 + 15 && ox - hw < bx2 - 15 && by2 > top && by1 < gy) {
        this.hit(o);
      }
    }

    this.scenic = this.scenic.filter((p) => p.worldX - this.worldDistance > -250);
  }

  private collect(c: SledCollectible): void {
    const x = this.sx(c.worldX - this.worldDistance);
    const y = this.sy(c.y);

    if (c.type === "logo_sponsor" || c.type === "logo_feria") {
      const sponsorKey = c.sponsorId || "feria";
      const sponsor = BRANDING.getLogoConfig(sponsorKey);
      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 3.5;
      this.activeLogo = sponsor;
      this.timeRemaining = Math.min(45, this.timeRemaining + 1.5);
      this.score += 500;
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 40);
      this.addFloatingText(`¡BONUS ${sponsor.shortName.toUpperCase()}! +1.5s & x2`, x, y - 30, sponsor.themeColor, 1.35);
      return;
    }

    this.comboCount++;
    this.comboTimer = 2.5;
    const mult = Math.min(5, 1 + Math.floor(this.comboCount / 4));
    let pts = c.points * mult;
    if (this.isLogoPowerUpActive) pts *= 2;
    this.score += pts;

    this.audio.playElfCollectItem();
    const color = c.type === "gift_green" ? "#69F0AE" : c.type === "candy" ? "#FF8A80" : "#FFD54F";
    this.particles.emitBurst(x, y, color, 8);
    this.addFloatingText(mult > 1 ? `+${pts} x${mult}` : `+${pts}`, x, y - 20, color, 1);
  }

  private hit(o: SledObstacle): void {
    o.cleared = true;
    this.hitCooldown = 1.2;
    this.comboCount = 0;
    this.speed = Math.max(MIN_SPEED, this.speed * 0.6);
    this.squashX = 0.8;
    this.squashY = 1.25;
    this.squashVX = 4;
    this.squashVY = -4;
    this.triggerShake(0.25, 7);
    this.audio.playElfHit();

    const x = this.sx(this.santaX);
    const y = this.sy(this.santaY - 60);
    this.particles.emitBurst(x, y, "#FFFFFF", 14);

    // Chocar hace perder el Trineo Dorado en lugar de una vida
    if (this.isLogoPowerUpActive) {
      this.isLogoPowerUpActive = false;
      this.logoPowerUpTimer = 0;
      this.addFloatingText("¡PODER PERDIDO!", x, y - 20, "#FF8A80", 1.2);
      return;
    }

    this.lives = Math.max(0, this.lives - 1);
    this.addFloatingText("¡CHOQUE! -1 ❤️", x, y - 20, "#FF5252", 1.2);
    if (this.lives <= 0) this.endGame({ reason: "lives_depleted" } as any);
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  protected override onDraw(ctx: CanvasRenderingContext2D): void {
    this.updateViewport();
    if (this.terrain.length < 2) return;

    this.renderSky(ctx);

    ctx.save();
    ctx.translate(0, this.playTop);
    ctx.scale(this.S, this.S);

    this.renderDistantLayer(ctx);
    this.renderTerrain(ctx);
    this.renderScenic(ctx);
    this.renderTracks(ctx);
    this.renderObstacles(ctx);
    this.renderCollectibles(ctx);
    this.renderSpray(ctx);
    this.renderSanta(ctx);

    ctx.restore();

    this.renderFlakes(ctx);
  }

  private renderSky(ctx: CanvasRenderingContext2D): void {
    const img = this.imgBgSeamless;
    if (img.complete && img.naturalWidth > 0) {
      const scale = Math.max(this.height / img.naturalHeight, this.width / img.naturalWidth);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const period = w * 2;
      let x = -((this.worldDistance * this.S * 0.06) % period);
      let flip = false;
      while (x < this.width) {
        if (flip) {
          ctx.save();
          ctx.translate(x + w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, w + 1, h);
          ctx.restore();
        } else {
          ctx.drawImage(img, x, 0, w + 1, h);
        }
        x += w;
        flip = !flip;
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, this.height);
      g.addColorStop(0, "#0B1D3A");
      g.addColorStop(1, "#3A6E96");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private distantY(x: number): number {
    return 300 + Math.sin(x * 0.0042 + 1.3) * 38 + Math.sin(x * 0.0017) * 30;
  }

  private renderDistantLayer(ctx: CanvasRenderingContext2D): void {
    const par = 0.4;
    const off = this.worldDistance * par;

    // Generar decoración lejana de forma perezosa
    while (this.nextDistantX < off + this.VW + 200) {
      const isHouse = Math.random() < 0.3;
      this.distantProps.push({ worldX: this.nextDistantX, kind: isHouse ? "house" : "tree", scale: rand(0.45, 0.65) });
      this.nextDistantX += rand(140, 300);
    }
    this.distantProps = this.distantProps.filter((p) => p.worldX - off > -150);

    const bottomDist = Math.max(VH + 40, (this.height - this.playTop) / this.S + 40);

    ctx.beginPath();
    ctx.moveTo(-20, bottomDist);
    for (let x = -20; x <= this.VW + 20; x += 16) ctx.lineTo(x, this.distantY(off + x));
    ctx.lineTo(this.VW + 20, bottomDist);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 240, 0, bottomDist);
    g.addColorStop(0, "#A9C9DF");
    g.addColorStop(0.5, "#7FA6C4");
    g.addColorStop(1, "#5D86A8");
    ctx.fillStyle = g;
    ctx.fill();

    // Cresta nevada lejana
    ctx.beginPath();
    for (let x = -20; x <= this.VW + 20; x += 16) {
      const y = this.distantY(off + x);
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(235, 247, 255, 0.85)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Árboles y casas lejanas con niebla atmosférica
    ctx.globalAlpha = 0.7;
    for (const p of this.distantProps) {
      const x = p.worldX - off;
      if (x < -100 || x > this.VW + 100) continue;
      const gy = this.distantY(p.worldX);
      if (p.kind === "tree" && this.imgTree.complete && this.imgTree.naturalWidth) {
        const w = 110 * p.scale;
        const h = w * (this.imgTree.naturalHeight / this.imgTree.naturalWidth);
        ctx.drawImage(this.imgTree, x - w / 2, gy - h + 4, w, h);
      } else if (p.kind === "house" && this.imgHouse.complete && this.imgHouse.naturalWidth) {
        const w = 110 * p.scale;
        const h = w * (this.imgHouse.naturalHeight / this.imgHouse.naturalWidth);
        ctx.drawImage(this.imgHouse, x - w / 2, gy - h + 6, w, h);
      }
    }
    ctx.globalAlpha = 1;

    // Velo de niebla para separar planos
    const fog = ctx.createLinearGradient(0, 260, 0, bottomDist);
    fog.addColorStop(0, "rgba(200, 225, 242, 0)");
    fog.addColorStop(1, "rgba(200, 225, 242, 0.35)");
    ctx.fillStyle = fog;
    ctx.fillRect(-20, 200, this.VW + 40, bottomDist);
  }

  private renderTerrain(ctx: CanvasRenderingContext2D): void {
    const step = 8;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let x = -20; x <= this.VW + 20; x += step) {
      xs.push(x);
      ys.push(this.terrainY(this.worldDistance + x));
    }
    const n = xs.length;
    const bottom = Math.max(VH + 40, (this.height - this.playTop) / this.S + 40);

    const pathTop = (offset: number): void => {
      ctx.moveTo(xs[0], ys[0] + offset);
      for (let i = 1; i < n; i++) ctx.lineTo(xs[i], ys[i] + offset);
    };

    // 1. Cuerpo de nieve compacta (azul hielo pintado, sin negros)
    ctx.beginPath();
    pathTop(0);
    ctx.lineTo(xs[n - 1], bottom);
    ctx.lineTo(xs[0], bottom);
    ctx.closePath();
    const body = ctx.createLinearGradient(0, Y_HIGH, 0, bottom);
    body.addColorStop(0, "#DDEFF9");
    body.addColorStop(0.45, "#B4D7EC");
    body.addColorStop(1, "#86B4D3");
    ctx.fillStyle = body;
    ctx.fill();

    // 2. Estratos de nieve que siguen el relieve (dan volumen pintado)
    const bands: Array<[number, number, string]> = [
      [70, 120, "rgba(150, 196, 226, 0.35)"],
      [140, 210, "rgba(120, 172, 210, 0.30)"]
    ];
    for (const [o1, o2, color] of bands) {
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0] + o1);
      for (let i = 1; i < n; i++) {
        const wx = this.worldDistance + xs[i];
        ctx.lineTo(xs[i], ys[i] + o1 + Math.sin(wx * 0.006) * 8);
      }
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(xs[i], ys[i] + o2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // 3. Manto superior de nieve fresca (blanco) con sombra propia inferior
    ctx.beginPath();
    pathTop(0);
    for (let i = n - 1; i >= 0; i--) {
      const wx = this.worldDistance + xs[i];
      ctx.lineTo(xs[i], ys[i] + 26 + Math.sin(wx * 0.021) * 4 + Math.sin(wx * 0.053) * 2);
    }
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const wx = this.worldDistance + xs[i];
      const y = ys[i] + 26 + Math.sin(wx * 0.021) * 4 + Math.sin(wx * 0.053) * 2;
      if (i === 0) ctx.moveTo(xs[i], y);
      else ctx.lineTo(xs[i], y);
    }
    ctx.strokeStyle = "rgba(120, 175, 215, 0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Borde superior nítido con luz fría
    ctx.beginPath();
    pathTop(0);
    ctx.strokeStyle = "#F7FCFF";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    pathTop(2.5);
    ctx.strokeStyle = "rgba(160, 205, 235, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Destellos de escarcha deterministas sobre el manto
    ctx.fillStyle = "rgba(190, 225, 248, 0.9)";
    const startCell = Math.floor((this.worldDistance - 20) / 46);
    const endCell = Math.ceil((this.worldDistance + this.VW + 20) / 46);
    for (let c = startCell; c <= endCell; c++) {
      const h = Math.abs(Math.sin(c * 127.1) * 43758.5453) % 1;
      if (h > 0.55) continue;
      const wx = c * 46 + h * 30;
      const x = wx - this.worldDistance;
      const y = this.terrainY(wx) + 8 + h * 14;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + h * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Montículo de nieve que asienta un objeto sobre la ladera */
  private drawSnowMound(ctx: CanvasRenderingContext2D, x: number, worldX: number, halfW: number, h: number): void {
    const gy = this.terrainY(worldX);
    const ang = this.terrainAngle(worldX);
    ctx.save();
    ctx.translate(x, gy + 2);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-halfW, 4);
    ctx.bezierCurveTo(-halfW * 0.6, -h, halfW * 0.6, -h, halfW, 4);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.7, 2);
    ctx.bezierCurveTo(-halfW * 0.3, -h * 0.35, halfW * 0.3, -h * 0.35, halfW * 0.7, 2);
    ctx.strokeStyle = "rgba(140, 190, 225, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private renderScenic(ctx: CanvasRenderingContext2D): void {
    for (const p of this.scenic) {
      const x = p.worldX - this.worldDistance;
      if (x < -160 || x > this.VW + 160) continue;
      const gy = this.terrainY(p.worldX);

      let img: HTMLImageElement;
      let w: number;
      let sink: number;
      if (p.kind === "tree") {
        img = this.imgTree;
        w = 125 * p.scale;
        sink = 10;
      } else if (p.kind === "house") {
        img = this.imgHouse;
        w = 150 * p.scale;
        sink = 14;
      } else {
        img = p.variant === 0 ? this.imgSignFeria : this.imgSignSponsor;
        w = 135;
        sink = 12;
      }
      if (!img.complete || !img.naturalWidth) continue;
      const h = w * (img.naturalHeight / img.naturalWidth);
      ctx.drawImage(img, x - w / 2, gy - h + sink, w, h);
      this.drawSnowMound(ctx, x, p.worldX, w * 0.42, 16);
    }
  }

  private renderTracks(ctx: CanvasRenderingContext2D): void {
    if (this.tracks.length < 2) return;
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    for (let i = 1; i < this.tracks.length; i++) {
      const a = this.tracks[i - 1];
      const b = this.tracks[i];
      if (a.seg !== b.seg) continue;
      const ax = a.worldX - this.worldDistance;
      const bx = b.worldX - this.worldDistance;
      ctx.strokeStyle = `rgba(110, 165, 205, ${0.45 * b.life})`;
      ctx.beginPath();
      ctx.moveTo(ax, a.y + 6);
      ctx.lineTo(bx, b.y + 6);
      ctx.moveTo(ax, a.y + 11);
      ctx.lineTo(bx, b.y + 11);
      ctx.stroke();
    }
  }

  private obstacleImage(t: ObstacleType): HTMLImageElement {
    switch (t) {
      case "snowman":
        return this.imgSnowman;
      case "crystal":
        return this.imgCrystal;
      case "log":
        return this.imgLog;
      case "rock":
        return this.imgRock;
      default:
        return this.imgIce;
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D): void {
    for (const o of this.obstacles) {
      const x = o.worldX - this.worldDistance;
      if (x < -120 || x > this.VW + 120) continue;
      const gy = this.terrainY(o.worldX);
      const ang = this.terrainAngle(o.worldX);
      const img = this.obstacleImage(o.type);

      // Sombra de contacto
      ctx.save();
      ctx.translate(x, gy + 3);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(40, 80, 120, 0.22)";
      ctx.beginPath();
      ctx.ellipse(0, 0, o.width * 0.48, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (img.complete && img.naturalWidth) {
        ctx.globalAlpha = o.cleared ? 0.55 : 1;
        ctx.drawImage(img, -o.width / 2, -o.height + 8, o.width, o.height);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      this.drawSnowMound(ctx, x, o.worldX, o.width * 0.5, 10);
    }
  }

  private collectibleImage(t: CollectibleType): HTMLImageElement {
    switch (t) {
      case "gift_red":
        return this.imgGiftRed;
      case "gift_green":
        return this.imgGiftGreen;
      case "candy":
        return this.imgCandy;
      case "teddy":
        return this.imgTeddy;
      case "robot":
        return this.imgRobot;
      default:
        return this.imgMedallonFeria;
    }
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D): void {
    for (const c of this.collectibles) {
      const x = c.worldX - this.worldDistance;
      if (x < -100 || x > this.VW + 100) continue;
      const img = this.collectibleImage(c.type);
      if (!img.complete || !img.naturalWidth) continue;
      const bob = Math.sin(c.floatPhase) * 4;
      const s = c.size;

      if (c.type === "logo_feria" || c.type === "logo_sponsor") {
        const sponsorKey = c.sponsorId || "feria";
        const sponsor = BRANDING.getLogoConfig(sponsorKey);
        const sponsorImg = this.getSponsorImage(sponsor.id) || this.imgMedallonFeria;

        // Halo pintado y anillo temático del patrocinador
        const pulse = 1 + Math.sin(c.floatPhase * 1.5) * 0.06;
        ctx.save();
        ctx.translate(x, c.y + bob);
        ctx.scale(pulse, pulse);

        const halo = ctx.createRadialGradient(0, 0, s * 0.25, 0, 0, s * 0.75);
        halo.addColorStop(0, sponsor.themeColor + "80");
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Base circular blanca nítida
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = sponsor.themeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0) {
          const aspect = sponsorImg.naturalWidth / (sponsorImg.naturalHeight || 1);
          let logoW = s * 0.78;
          let logoH = s * 0.78;
          if (aspect > 1.35) {
            logoW = s * 0.85;
            logoH = logoW / aspect;
          } else if (aspect < 0.75) {
            logoH = s * 0.85;
            logoW = logoH * aspect;
          }
          ctx.drawImage(sponsorImg, -logoW / 2, -logoH / 2, logoW, logoH);
        }
        ctx.restore();
        continue;
      }

      const ratio = img.naturalHeight / img.naturalWidth;
      const w = ratio > 1 ? s / ratio : s;
      const h = ratio > 1 ? s : s * ratio;
      ctx.drawImage(img, x - w / 2, c.y + bob - h / 2, w, h);
    }
  }

  private renderSpray(ctx: CanvasRenderingContext2D): void {
    for (const p of this.spray) {
      const a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = p.gold ? "#FFE082" : "#FFFFFF";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderSanta(ctx: CanvasRenderingContext2D): void {
    const wx = this.worldDistance + this.santaX;
    const gy = this.terrainY(wx);
    const ga = this.terrainAngle(wx);
    const alt = Math.max(0, gy - this.santaY);

    // Sombra de contacto proyectada en la nieve
    const sh = clamp(1 - alt / 320, 0.25, 1);
    ctx.save();
    ctx.translate(this.santaX, gy + 2);
    ctx.rotate(ga);
    ctx.fillStyle = `rgba(30, 70, 110, ${0.28 * sh})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 62 * sh, 8 * sh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const bob = this.isGrounded ? Math.sin(this.bobPhase) * 1.5 : 0;
    ctx.translate(this.santaX, this.santaY + bob);
    const spin = this.isDoingTrick ? (0.5 - 0.5 * Math.cos(this.trickProgress * Math.PI)) * Math.PI * 2 * -1 : 0;
    // La pirueta gira alrededor del centro del trineo, no de los patines
    ctx.rotate(this.santaAngle);
    if (spin !== 0) {
      ctx.translate(0, -SLEIGH_H * 0.45);
      ctx.rotate(spin);
      ctx.translate(0, SLEIGH_H * 0.45);
    }
    ctx.scale(this.squashX, this.squashY);

    if (this.isLogoPowerUpActive) {
      const t = this.logoPowerUpTimer;
      const blink = t < 1.5 ? (Math.floor(t * 8) % 2 === 0 ? 0.25 : 0.6) : 0.55;
      const aura = ctx.createRadialGradient(0, -SLEIGH_H * 0.45, 20, 0, -SLEIGH_H * 0.45, 100);
      aura.addColorStop(0, `rgba(255, 215, 64, ${blink * 0.5})`);
      aura.addColorStop(1, "rgba(255, 215, 64, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -SLEIGH_H * 0.45, 100, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hitCooldown > 0 && Math.floor(this.hitCooldown * 12) % 2 === 0) ctx.globalAlpha = 0.4;

    const img = this.imgSantaSleigh;
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, -SLEIGH_W * 0.48, -SLEIGH_H + 8, SLEIGH_W, SLEIGH_H);
    }
    ctx.restore();
  }

  private renderFlakes(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#FFFFFF";
    for (const f of this.flakes) {
      ctx.globalAlpha = f.alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  public override endGame(extraData?: any): void {
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    super.endGame(extraData);
  }
}
