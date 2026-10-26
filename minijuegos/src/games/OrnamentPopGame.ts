/**
 * ==============================================================================
 * MINIJUEGO 13: ¡NINJA CORTA-REGALOS! (Edición Quick-Game Estilo Fruit Ninja)
 * ==============================================================================
 *
 * Acción táctil instantánea de reflejos y corte con espada mágica:
 * - Desliza el dedo (o el ratón) para rebanar en el aire Galletas de Jengibre,
 *   Caramelos de Menta, Cajas de Regalo Sorpresa y Esferas de Cristal.
 * - Cada objeto cortado se divide físicamente en DOS MITADES REALES (ctx.clip)
 *   en el ángulo exacto de tu tajo de espada, liberando juguetes y dulces.
 * - Corta 3, 4 o 5+ objetos en un mismo tajo para desatar COMBOS MAESTROS.
 * - Reloj Dorado Mágico (+5s): Sale volando cada 5 segundos; córtalo para
 *   ganar +5 SEGUNDOS EXTRA en el cronómetro.
 * - Publicidad Integrada de Patrocinadores: Cartelera luminosa en el Dojo +
 *   Cofres Patrocinadores que liberan el logo oficial en grande y activan x2.
 * - Visualización de Tiempo y Alerta de Últimos Segundos (<= 10s).
 *
 * Arte 100% Stylized 2D Game Art. Cero emojis.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import { SPONSOR_CATALOG } from "../config/branding";

type TargetKind =
  | "gingerbread"
  | "peppermint"
  | "giftRed"
  | "giftGreen"
  | "giftBlue"
  | "timeClock"
  | "freezeCrystal"
  | "frenzyOrb"
  | "pinataBoss"
  | "sponsorGift"
  | "frostGoblin"
  | "frozenGift"
  | "bomb";

interface SponsorEntry {
  key: string;
  name: string;
  tagline: string;
  themeColor: string;
  logo: HTMLImageElement;
}

interface FlyingTarget {
  id: number;
  kind: TargetKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  vAngle: number;
  sliced: boolean;
  reachedPeak: boolean;
  multiHits: number;
  maxMultiHits: number;
  hitCooldown: number;
  hoverTimer: number;
  sponsor: SponsorEntry | null;
}

interface SlicedHalf {
  kind: TargetKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  vAngle: number;
  cutAngle: number;
  side: -1 | 1;
  alpha: number;
  life: number;
  maxLife: number;
  seamColor: string;
  sponsor: SponsorEntry | null;
}

interface PoppedToy {
  img: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  vAngle: number;
  alpha: number;
  life: number;
  maxLife: number;
  isSponsorBadge?: boolean;
  sponsorName?: string;
  badgeColor?: string;
}

interface WallSplatter {
  x: number;
  y: number;
  r: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  drops: { dx: number; dy: number; r: number }[];
}

interface SlashFlash {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  alpha: number;
}

interface BladePoint {
  x: number;
  y: number;
  age: number;
  pointerId?: number;
}

interface DroppedCross {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  life: number;
}

interface FloatingBanner {
  x: number;
  y: number;
  vy: number;
  text: string;
  subText?: string;
  color: string;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class OrnamentPopGame extends BaseGame {
  public onOpenTutorial?: () => void;

  // Sprites 2D
  private bgImg: HTMLImageElement;
  private pinataImg: HTMLImageElement;
  private gingerbreadImg: HTMLImageElement;
  private peppermintImg: HTMLImageElement;
  private clockImg: HTMLImageElement;
  private freezeCrystalImg: HTMLImageElement;
  private frenzyOrbImg: HTMLImageElement;
  private bombImg: HTMLImageElement;
  private duendeImg: HTMLImageElement;
  private frozenGiftImg: HTMLImageElement;
  private giftRedImg: HTMLImageElement;
  private giftGreenImg: HTMLImageElement;
  private giftBlueImg: HTMLImageElement;
  private giftGoldImg: HTMLImageElement;
  private bearImg: HTMLImageElement;
  private robotImg: HTMLImageElement;
  private carImg: HTMLImageElement;

  // Catálogo completo de patrocinadores para publicidad en el Dojo y en los cofres
  private sponsors: SponsorEntry[] = [];
  private sponsorIdx = 0;
  private billboardSponsorIdx = 0;
  private billboardSwapTimer = 0;
  private billboardGlowTimer = 0;

  // Entidades en juego
  private targets: FlyingTarget[] = [];
  private halves: SlicedHalf[] = [];
  private poppedToys: PoppedToy[] = [];
  private splatters: WallSplatter[] = [];
  private slashFlashes: SlashFlash[] = [];
  private droppedCrosses: DroppedCross[] = [];
  private banners: FloatingBanner[] = [];
  private nextTargetId = 1;

  // Hoja de espada táctil (multitouch seguro)
  private activePointers = new Map<number, { lastX: number; lastY: number }>();
  private bladePoints: BladePoint[] = [];

  // Sistema de Combo por Tajo
  private swipeSliceCount = 0;
  private swipeComboWindow = 0;
  private lastSliceX = 0;
  private lastSliceY = 0;
  private totalSlicedCount = 0;

  // Estados especiales (Freeze, Frenzy y Reloj +5s cada 5s)
  private freezeTimer = 0;
  private frenzyTimer = 0;
  private frenzyBurstCooldown = 0;
  private clockSpawnCooldown = 5.0;
  private timeAddedFlash = 0;
  private initialDuration = 45;

  // Generador de oleadas progresivas
  private waveNumber = 0;
  private spawnTimer = 0.55;
  private animClock = 0;

  // Botón de tutorial
  private helpBtnRect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "ornament-pop",
      "¡Ninja Corta-Regalos!",
      "¡Desliza tu espada de luz para cortar regalos, relojes (+5s) y piñatas sin tocar las bombas!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Deck The Halls.mp3";
    this.inGameMusicVolume = 0.44;

    this.showTimer = true;
    this.showLives = false;

    this.bgImg = this.getImage("./assets/images/fondo-habitacion.webp");
    this.pinataImg = this.getImage("./assets/images/pinata-estrella.webp");
    this.gingerbreadImg = this.getImage("./assets/images/galleta-jengibre.webp");
    this.peppermintImg = this.getImage("./assets/images/caramelo-menta.webp");
    this.clockImg = this.getImage("./assets/images/reloj-magico-tiempo.webp");
    this.freezeCrystalImg = this.getImage("./assets/images/fruta-cristal-hielo.webp");
    this.frenzyOrbImg = this.getImage("./assets/images/bola-arcoiris.webp");
    this.bombImg = this.getImage("./assets/images/bomba-carbon-dorada.webp");
    this.duendeImg = this.getImage("./assets/images/duende-hielo.webp");
    this.frozenGiftImg = this.getImage("./assets/images/bloque-regalo-congelado.webp");
    this.giftRedImg = this.getImage("./assets/images/regalo-estilizado-rojo.webp");
    this.giftGreenImg = this.getImage("./assets/images/regalo-estilizado-verde.webp");
    this.giftBlueImg = this.getImage("./assets/images/regalo-estilizado-azul.webp");
    this.giftGoldImg = this.getImage("./assets/images/regalo-estilizado-dorado.webp");
    this.bearImg = this.getImage("./assets/images/osito.webp");
    this.robotImg = this.getImage("./assets/images/robot.webp");
    this.carImg = this.getImage("./assets/images/coche-juguete.webp");

    this.sponsors = Object.entries(SPONSOR_CATALOG).map(([key, cfg]) => ({
      key,
      name: cfg.shortName || cfg.name,
      tagline: cfg.tagline || "Patrocinador Oficial",
      themeColor: cfg.themeColor || "#FFD700",
      logo: this.getImage(cfg.path)
    }));
  }

  private nextSponsor(): SponsorEntry | null {
    if (this.sponsors.length === 0) return null;
    const s = this.sponsors[this.sponsorIdx % this.sponsors.length];
    this.sponsorIdx++;
    return s;
  }

  protected onStart(): void {
    this.showLives = false;
    this.showTimer = true;
    this.initialDuration = 45;
    this.timeRemaining = this.initialDuration;

    this.targets = [];
    this.halves = [];
    this.poppedToys = [];
    this.splatters = [];
    this.slashFlashes = [];
    this.droppedCrosses = [];
    this.banners = [];
    this.bladePoints = [];
    this.activePointers.clear();

    this.swipeSliceCount = 0;
    this.swipeComboWindow = 0;
    this.totalSlicedCount = 0;
    this.freezeTimer = 0;
    this.frenzyTimer = 0;
    this.frenzyBurstCooldown = 0;
    // Reloj Dorado sale cada 5 segundos
    this.clockSpawnCooldown = 5.0;
    this.timeAddedFlash = 0;
    this.billboardSwapTimer = 0;
    this.billboardGlowTimer = 0;
    this.waveNumber = 0;
    this.spawnTimer = 0.45;
    this.animClock = 0;

    this.input.onPointerDown = (id: number, x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;
      if (this.pointInRect(x, y, this.helpBtnRect)) {
        this.audio.playTap();
        this.onOpenTutorial?.();
        return;
      }
      this.activePointers.set(id, { lastX: x, lastY: y });
      this.bladePoints.push({ x, y, age: 0, pointerId: id });
      this.checkSegmentCuts(x - 8, y - 8, x + 8, y + 8);
    };

    this.input.onPointerMove = (id: number, x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;
      let ptr = this.activePointers.get(id);
      if (!ptr) {
        this.activePointers.set(id, { lastX: x, lastY: y });
        return;
      }
      const dist = Math.hypot(x - ptr.lastX, y - ptr.lastY);
      // Prevenir bug láser multitáctil: solo cortar dentro del rango de swipe continuo (4px a 130px)
      if (dist >= 4 && dist <= 130) {
        this.checkSegmentCuts(ptr.lastX, ptr.lastY, x, y);
        ptr.lastX = x;
        ptr.lastY = y;
        this.bladePoints.push({ x, y, age: 0, pointerId: id });
        if (this.bladePoints.length > 32) {
          this.bladePoints.shift();
        }
      } else if (dist > 130) {
        // Salto brusco / multitouch cross-read: reposicionar sin cortar toda la pantalla
        ptr.lastX = x;
        ptr.lastY = y;
      }
    };

    this.input.onPointerUp = (id: number) => {
      this.activePointers.delete(id);
      if (this.activePointers.size === 0) {
        this.flushSwipeCombo();
      }
    };

    this.addBanner(
      this.width * 0.5,
      this.height * 0.42,
      "¡DESLIZA PARA CORTAR!",
      "¡Corta los Relojes Dorados para ganar +5 SEGUNDOS EXTRA!",
      "#FFD700",
      1.18
    );
  }

  public override destroy(): void {
    super.destroy();
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
    this.input.onPointerUp = undefined;
  }

  private getTargetRadius(kind: TargetKind): number {
    const base = Math.max(42, Math.min(60, Math.min(this.width, this.height) * 0.068));
    if (kind === "pinataBoss") return base * 1.48;
    if (kind === "frostGoblin") return base * 1.35;
    if (kind === "frozenGift") return base * 1.18;
    if (kind === "timeClock") return base * 1.12;
    if (kind === "sponsorGift") return base * 1.15;
    if (kind === "bomb") return base * 0.96;
    if (kind === "freezeCrystal" || kind === "frenzyOrb") return base * 1.06;
    return base;
  }

  private spawnWave(): void {
    this.waveNumber++;
    const w = this.width;
    const h = this.height;

    // 1. Asalto de la Piñata Estrella cada 6 oleadas
    if (this.waveNumber % 6 === 0) {
      this.spawnSingleTarget("pinataBoss", w * 0.5 + (Math.random() - 0.5) * 140, h + 40);
      this.addBanner(
        w * 0.5,
        h * 0.34,
        "¡PIÑATA ESTRELLA REAL!",
        "¡Córtala repetidas veces antes de que explote!",
        "#FFD700",
        1.15
      );
      return;
    }

    // 2. Nuevo Enemigo: ¡Asalto del Duende Ladrón del Hielo! (Oleada 3, 7, 11...)
    if (this.waveNumber >= 3 && this.waveNumber % 4 === 3) {
      const fromSide = Math.random() < 0.5 ? "left" : "right";
      this.spawnSingleTarget("frostGoblin", w * 0.5, h + 30, fromSide);
      this.audio.playCountdownStep(2);
      this.addBanner(
        w * 0.5,
        h * 0.32,
        "¡ALERTA: DUENDE LADRÓN!",
        "¡Córtalo 3 veces antes de que escape o te robará 4 segundos!",
        "#00E5FF",
        1.25
      );
    }

    const count = Math.min(6, 2 + Math.floor(this.waveNumber / 3) + (Math.random() < 0.45 ? 1 : 0));
    const normalPool: TargetKind[] = [
      "gingerbread",
      "peppermint",
      "giftRed",
      "giftGreen",
      "giftBlue"
    ];
    if (this.waveNumber >= 2) {
      normalPool.push("frozenGift");
    }

    let bombsInWave = 0;
    const maxBombs = this.waveNumber <= 1 ? 0 : Math.min(2, 1 + Math.floor(this.waveNumber / 5));

    for (let i = 0; i < count; i++) {
      let kind: TargetKind = normalPool[Math.floor(Math.random() * normalPool.length)];

      const roll = Math.random();
      if (roll < 0.08 && this.freezeTimer <= 0) {
        kind = "freezeCrystal";
      } else if (roll >= 0.08 && roll < 0.15 && this.frenzyTimer <= 0) {
        kind = "frenzyOrb";
      } else if (roll >= 0.15 && roll < 0.32) {
        // Alta frecuencia de Cofres Patrocinadores para destacar las marcas
        kind = "sponsorGift";
      } else if (roll >= 0.32 && roll < 0.48 && bombsInWave < maxBombs) {
        kind = "bomb";
        bombsInWave++;
      }

      const spreadX = w * 0.16 + (i + 0.5) * ((w * 0.68) / count) + (Math.random() - 0.5) * 55;
      this.spawnSingleTarget(kind, spreadX, h + 35 + i * 22);
    }

    // Emboscada de Dificultad Dinámica: a partir de oleada 4, si hay bombas, sincronizar una bomba trampa paralela
    if (bombsInWave > 0 && this.waveNumber >= 4 && Math.random() < 0.55) {
      const ambushX = w * (0.28 + Math.random() * 0.44);
      this.spawnSingleTarget("bomb", ambushX, h + 42);
    }
  }

  private spawnSingleTarget(kind: TargetKind, startX: number, startY: number, fromSide?: "left" | "right"): void {
    const w = this.width;
    const h = this.height;
    const r = this.getTargetRadius(kind);

    let vx = 0;
    let vy = 0;

    if (fromSide === "left") {
      startX = -r;
      startY = h * (0.42 + Math.random() * 0.28);
      vx = w * (0.48 + Math.random() * 0.25);
      vy = -(h * (0.42 + Math.random() * 0.22));
    } else if (fromSide === "right") {
      startX = w + r;
      startY = h * (0.42 + Math.random() * 0.28);
      vx = -w * (0.48 + Math.random() * 0.25);
      vy = -(h * (0.42 + Math.random() * 0.22));
    } else {
      const targetPeakX = w * (0.25 + Math.random() * 0.5);
      const flightTime = 1.05 + Math.random() * 0.22;
      vx = (targetPeakX - startX) / flightTime;
      const desiredPeakY = kind === "pinataBoss" ? h * 0.36 : h * (0.24 + Math.random() * 0.2);
      const gravity = 940;
      const riseHeight = Math.max(250, startY - desiredPeakY);
      vy = -Math.sqrt(2 * gravity * riseHeight);
    }

    const sponsor = kind === "sponsorGift" ? this.nextSponsor() : null;

    this.targets.push({
      id: this.nextTargetId++,
      kind,
      x: startX,
      y: startY,
      vx,
      vy,
      r,
      angle: (Math.random() - 0.5) * 0.45,
      vAngle: kind === "timeClock" || kind === "sponsorGift" ? (Math.random() - 0.5) * 1.6 : (Math.random() - 0.5) * 3.8,
      sliced: false,
      reachedPeak: false,
      multiHits: 0,
      maxMultiHits: kind === "pinataBoss" ? 10 : kind === "frostGoblin" ? 3 : kind === "frozenGift" ? 2 : 1,
      hitCooldown: 0,
      hoverTimer: kind === "pinataBoss" ? 2.6 : kind === "frostGoblin" ? 1.2 : 0,
      sponsor
    });
  }

  private checkSegmentCuts(x1: number, y1: number, x2: number, y2: number): void {
    const cutAngle = Math.atan2(y2 - y1, x2 - x1);

    for (const t of this.targets) {
      if (t.sliced || t.hitCooldown > 0) continue;

      if (this.segmentIntersectsCircle(x1, y1, x2, y2, t.x, t.y, t.r * 1.08)) {
        this.sliceTarget(t, cutAngle);
      }
    }
  }

  private sliceTarget(t: FlyingTarget, cutAngle: number): void {
    // 1. ¿Es una Bomba de Carbón? -> ¡Quita tiempo del reloj (-6 segundos)!
    if (t.kind === "bomb") {
      t.sliced = true;
      this.swipeSliceCount = 0;
      this.audio.playCoalBombExplosion();
      this.triggerShake(0.38, 16);
      this.particles.emitBurst(t.x, t.y, "#FF1744", 32);
      this.particles.emitBurst(t.x, t.y, "#FF9100", 24);
      this.addSlashFlash(t.x, t.y, cutAngle, "#FF1744", t.r * 2.2);

      for (const other of this.targets) {
        if (other.kind === "bomb") other.sliced = true;
      }

      this.timeRemaining = Math.max(0, this.timeRemaining - 6);
      this.addBanner(
        t.x,
        t.y - 25,
        "¡BOMBA! -6 SEGUNDOS",
        "¡Las bombas de carbón te quitan tiempo del reloj!",
        "#FF1744",
        1.24
      );
      return;
    }

    // Cualquier otro objetivo alcanzado por el tajo es un corte exitoso
    this.audio.playSliceCut();

    // 2. ¿Es el Duende Ladrón del Hielo? (Enemigo especial de 3 tajos obligatorios)
    if (t.kind === "frostGoblin" && t.multiHits + 1 < t.maxMultiHits) {
      t.multiHits++;
      t.hitCooldown = 0.08;
      t.vy = Math.min(t.vy, -135);
      t.vx = (Math.random() > 0.5 ? 1 : -1) * (160 + Math.random() * 80);
      t.vAngle = (Math.random() > 0.5 ? 1 : -1) * 8.5;

      const hitPts = t.multiHits === 1 ? 100 : 150;
      this.addScore(hitPts);
      this.audio.playCatchItem(1.3 + t.multiHits * 0.2);
      this.triggerShake(0.12, 6);
      this.addSlashFlash(t.x, t.y, cutAngle, "#00E5FF", t.r * 2.3);
      this.particles.emitBurst(t.x, t.y, "#00E5FF", 20);
      this.particles.emitBurst(t.x, t.y, "#FFFFFF", 12);
      const title = t.multiHits === 1 ? "¡ESCUDO DE HIELO ROTO!" : "¡CORONA QUEBRADA!";
      this.addBanner(
        t.x,
        t.y - 35,
        `${title} +${hitPts}`,
        `¡Corte ${t.multiHits}/3! ¡Termínalo antes de que escape!`,
        "#00E5FF",
        1.1
      );
      return;
    }

    // 3. ¿Es un Regalo Acorazado de Hielo? (Requiere 2 tajos)
    if (t.kind === "frozenGift" && t.multiHits === 0) {
      t.multiHits = 1;
      t.hitCooldown = 0.08;
      t.vy = Math.min(t.vy, -90);
      const hitPts = 90;
      this.addScore(hitPts);
      this.audio.playCatchItem(1.2);
      this.triggerShake(0.1, 5);
      this.addSlashFlash(t.x, t.y, cutAngle, "#80D8FF", t.r * 2.2);
      this.particles.emitBurst(t.x, t.y, "#80D8FF", 18);
      this.addBanner(
        t.x,
        t.y - 30,
        `¡CORAZA AGRIETADA! +${hitPts}`,
        "¡Corta de nuevo el regalo!",
        "#80D8FF",
        1.05
      );
      return;
    }

    // 4. ¿Es la Gran Piñata Estrella Multigolpe?
    if (t.kind === "pinataBoss" && t.multiHits + 1 < t.maxMultiHits) {
      t.multiHits++;
      t.hitCooldown = 0.075;
      t.vy = Math.min(t.vy, -80);
      t.vx *= 0.5;
      t.vAngle = (Math.random() > 0.5 ? 1 : -1) * 7.5;

      const hitPts = 65;
      this.addScore(hitPts);
      this.audio.playCatchItem(1.0 + t.multiHits * 0.08);
      this.triggerShake(0.08, 4);
      this.addSlashFlash(t.x, t.y, cutAngle, "#FFD700", t.r * 2.1);
      this.particles.emitBurst(t.x, t.y, "#FFD700", 14);
      this.addBanner(
        t.x + (Math.random() - 0.5) * 60,
        t.y - 35,
        `¡TAJO x${t.multiHits}! +${hitPts}`,
        undefined,
        "#FFD700",
        0.95
      );
      return;
    }

    // 3. Corte completo en DOS MITADES REALES
    t.sliced = true;
    this.totalSlicedCount++;
    this.swipeSliceCount++;
    this.swipeComboWindow = 0.22;
    this.lastSliceX = t.x;
    this.lastSliceY = t.y;

    const palette = this.getTargetPalette(t.kind);
    this.addSlashFlash(t.x, t.y, cutAngle, palette.flash, t.r * 2.25);
    this.addWallSplatter(t.x, t.y, t.r * 0.9, palette.splatter);
    this.particles.emitBurst(t.x, t.y, palette.spark, 18);

    const perpX = -Math.sin(cutAngle);
    const perpY = Math.cos(cutAngle);
    const splitSpeed = 125;

    for (const side of [-1, 1] as const) {
      this.halves.push({
        kind: t.kind,
        x: t.x + perpX * side * 8,
        y: t.y + perpY * side * 8,
        vx: t.vx * 0.55 + perpX * side * splitSpeed,
        vy: Math.min(t.vy * 0.45, -90) + perpY * side * splitSpeed * 0.6,
        r: t.r,
        angle: t.angle,
        vAngle: side * (3.6 + Math.random() * 2.4),
        cutAngle: cutAngle - t.angle,
        side,
        alpha: 1,
        life: 0,
        maxLife: 1.05,
        seamColor: palette.flash,
        sponsor: t.sponsor
      });
    }

    // Si era un Cofre Patrocinador, emerge la Insignia Gigante del Patrocinador Oficial
    if (t.kind === "sponsorGift" && t.sponsor) {
      this.poppedToys.push({
        img: t.sponsor.logo,
        x: t.x,
        y: t.y,
        vx: 0,
        vy: -155,
        size: t.r * 1.9,
        angle: 0,
        vAngle: 0,
        alpha: 1,
        life: 0,
        maxLife: 1.35,
        isSponsorBadge: true,
        sponsorName: t.sponsor.name,
        badgeColor: t.sponsor.themeColor
      });
      // Sincronizar la cartelera del Dojo con el patrocinador cortado
      const foundIdx = this.sponsors.findIndex((s) => s.key === t.sponsor!.key);
      if (foundIdx >= 0) {
        this.billboardSponsorIdx = foundIdx;
        this.billboardSwapTimer = 0;
        this.billboardGlowTimer = 2.5;
      }
    } else if (t.kind === "giftRed" || t.kind === "giftGreen" || t.kind === "giftBlue" || t.kind === "frozenGift") {
      const toys = [this.bearImg, this.robotImg, this.carImg];
      const toyImg = toys[Math.floor(Math.random() * toys.length)];
      this.poppedToys.push({
        img: toyImg,
        x: t.x,
        y: t.y,
        vx: (Math.random() - 0.5) * 160,
        vy: -260 - Math.random() * 80,
        size: t.r * 1.35,
        angle: 0,
        vAngle: (Math.random() - 0.5) * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.95
      });
    }

    // Puntos, Tiempo Extra (+5s) y Poderes según el tipo cortado
    if (t.kind === "timeClock") {
      // ¡RELOJ DORADO MÁGICO: +5 SEGUNDOS EXTRA!
      this.timeRemaining = Math.min(90, this.timeRemaining + 5);
      this.timeAddedFlash = 1.0;
      const pts = 150;
      this.addScore(pts);
      this.audio.playPowerUp();
      this.particles.emitBurst(t.x, t.y, "#00E676", 26);
      this.particles.emitBurst(t.x, t.y, "#FFD700", 20);
      this.addBanner(
        t.x,
        t.y - 32,
        "¡+5 SEGUNDOS EXTRA!",
        `¡RELOJ MÁGICO CORTADO! (+${pts} PTS)`,
        "#00E676",
        1.28
      );
    } else if (t.kind === "frostGoblin") {
      const pts = 400;
      this.addScore(pts);
      this.audio.playPowerUp();
      this.audio.playVictory();
      this.triggerShake(0.25, 12);
      this.particles.emitBurst(t.x, t.y, "#00E5FF", 32);
      this.particles.emitBurst(t.x, t.y, "#FFD700", 25);
      this.particles.emitConfetti(this.width, 35);
      // Recompensa legendaria: suelta de inmediato un Reloj Dorado (+5s)
      this.spawnSingleTarget("timeClock", t.x, t.y);
      this.addBanner(
        t.x,
        t.y - 32,
        "¡DUENDE DERROTADO! +400",
        "¡Soltó un Reloj Dorado (+5s) de regalo!",
        "#00E5FF",
        1.3
      );
    } else if (t.kind === "frozenGift") {
      const pts = 250;
      this.addScore(pts);
      this.audio.playPowerUp();
      this.particles.emitBurst(t.x, t.y, "#80D8FF", 24);
      this.addBanner(t.x, t.y - 30, `¡REGALO DESCONGELADO! +${pts}`, "¡Juguetes liberados!", "#80D8FF", 1.2);
    } else if (t.kind === "pinataBoss") {
      const pts = 500;
      this.addScore(pts);
      this.audio.playVictory();
      this.triggerShake(0.28, 12);
      this.particles.emitConfetti(this.width, 40);
      this.addBanner(t.x, t.y - 30, `¡PIÑATA REVENTADA! +${pts}`, "¡EXPLOSIÓN DE DULCES!", "#FFD700", 1.25);
    } else if (t.kind === "freezeCrystal") {
      this.freezeTimer = 5.5;
      this.addScore(180);
      this.audio.playPowerUp();
      this.addBanner(
        t.x,
        t.y - 28,
        "¡TIEMPO CONGELADO! +180",
        "¡Cámara Lenta Glacial por 5.5s!",
        "#00E5FF",
        1.15
      );
    } else if (t.kind === "frenzyOrb") {
      this.frenzyTimer = 4.2;
      this.frenzyBurstCooldown = 0.05;
      this.addScore(200);
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 30);
      this.addBanner(
        t.x,
        t.y - 28,
        "¡LLUVIA FRENESÍ! +200",
        "¡Avalancha lateral de regalos sin bombas!",
        "#00E676",
        1.18
      );
    } else if (t.kind === "sponsorGift") {
      const sponsorKey = t.sponsor ? t.sponsor.key : 1;
      const sponsorName = t.sponsor ? t.sponsor.name.toUpperCase() : "PATROCINADOR";
      this.triggerLogoPowerUp(sponsorKey, 6);
      this.addScore(280);
      this.addBanner(
        t.x,
        t.y - 30,
        `¡${sponsorName}! +280`,
        "¡PUNTOS DOBLES x2 ACTIVADOS!",
        "#FFD700",
        1.18
      );
    } else {
      const basePts = 80;
      this.addScore(basePts);
      this.audio.playCatchItem(1.1 + Math.min(0.5, this.swipeSliceCount * 0.1));
      // Los juguetes salen volando limpios sin dejar puntos ni marcas en pantalla
    }
  }

  private flushSwipeCombo(): void {
    if (this.swipeSliceCount >= 3) {
      const count = this.swipeSliceCount;
      const bonus = count * 65;
      this.addScore(bonus);
      this.audio.playPowerUp();
      this.billboardGlowTimer = 1.8;
      this.particles.emitBurst(this.lastSliceX, this.lastSliceY, "#FFD700", 22);
      const label =
        count === 3
          ? "¡CORTE TRIPLE!"
          : count === 4
          ? "¡CORTE CUÁDRUPLE!"
          : `¡CORTE MAESTRO NINJA x${count}!`;
      this.addBanner(
        Math.max(140, Math.min(this.width - 140, this.lastSliceX)),
        Math.max(130, this.lastSliceY - 35),
        label,
        `+${bonus} PUNTOS DE COMBO`,
        "#FFD700",
        1.22
      );
    }
    this.swipeSliceCount = 0;
    this.swipeComboWindow = 0;
  }

  private getTargetPalette(kind: TargetKind): { flash: string; splatter: string; spark: string } {
    switch (kind) {
      case "timeClock":
        return { flash: "#00E676", splatter: "rgba(0, 230, 118, 0.42)", spark: "#FFD700" };
      case "gingerbread":
        return { flash: "#FFE082", splatter: "rgba(210, 138, 71, 0.42)", spark: "#FFB300" };
      case "peppermint":
        return { flash: "#FF80AB", splatter: "rgba(255, 42, 77, 0.38)", spark: "#FF4081" };
      case "giftRed":
        return { flash: "#FF5252", splatter: "rgba(229, 57, 53, 0.38)", spark: "#FFD700" };
      case "giftGreen":
        return { flash: "#69F0AE", splatter: "rgba(0, 200, 83, 0.38)", spark: "#00E676" };
      case "giftBlue":
      case "freezeCrystal":
        return { flash: "#84FFFF", splatter: "rgba(0, 229, 255, 0.42)", spark: "#00E5FF" };
      case "frenzyOrb":
      case "pinataBoss":
      case "sponsorGift":
        return { flash: "#FFF59D", splatter: "rgba(255, 215, 0, 0.42)", spark: "#FFD700" };
      case "frostGoblin":
        return { flash: "#00E5FF", splatter: "rgba(0, 229, 255, 0.45)", spark: "#00E5FF" };
      case "frozenGift":
        return { flash: "#80D8FF", splatter: "rgba(128, 216, 255, 0.42)", spark: "#FFFFFF" };
      default:
        return { flash: "#FF5252", splatter: "rgba(120, 120, 120, 0.4)", spark: "#FF9100" };
    }
  }

  private addSlashFlash(cx: number, cy: number, angle: number, color: string, length: number): void {
    const dx = Math.cos(angle) * length * 0.5;
    const dy = Math.sin(angle) * length * 0.5;
    this.slashFlashes.push({
      x1: cx - dx,
      y1: cy - dy,
      x2: cx + dx,
      y2: cy + dy,
      color,
      alpha: 1
    });
  }

  private addWallSplatter(_x: number, _y: number, _r: number, _color: string): void {
    // Desactivado: no dejar manchas ni puntos en la pared, solo que los juguetes salgan volando
    return;
  }

  private addBanner(
    x: number,
    y: number,
    text: string,
    subText: string | undefined,
    color: string,
    scale = 1
  ): void {
    this.banners.push({
      x,
      y,
      vy: -38,
      text,
      subText,
      color,
      scale,
      alpha: 1,
      life: 0,
      maxLife: 1.35
    });
  }

  protected onUpdate(dt: number): void {
    const safeDt = Math.min(dt, 0.033);
    this.animClock += safeDt;

    if (this.timeAddedFlash > 0) {
      this.timeAddedFlash = Math.max(0, this.timeAddedFlash - safeDt * 1.6);
    }

    // Rotación de la cartelera publicitaria del Dojo
    this.billboardSwapTimer += safeDt;
    if (this.billboardSwapTimer >= 4.8 && this.sponsors.length > 1) {
      this.billboardSwapTimer = 0;
      this.billboardSponsorIdx = (this.billboardSponsorIdx + 1) % this.sponsors.length;
    }
    if (this.billboardGlowTimer > 0) {
      this.billboardGlowTimer = Math.max(0, this.billboardGlowTimer - safeDt);
    }

    // Lanzador periódico del Reloj Dorado (+5 segundos cada 5 segundos)
    this.clockSpawnCooldown -= safeDt;
    if (this.clockSpawnCooldown <= 0) {
      this.clockSpawnCooldown = 5.0;
      const clockX = this.width * (0.26 + Math.random() * 0.48);
      this.spawnSingleTarget("timeClock", clockX, this.height + 35);
    }

    if (this.swipeComboWindow > 0) {
      this.swipeComboWindow -= safeDt;
      if (this.swipeComboWindow <= 0) {
        this.flushSwipeCombo();
      }
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - safeDt);
    }

    if (this.frenzyTimer > 0) {
      this.frenzyTimer = Math.max(0, this.frenzyTimer - safeDt);
      this.frenzyBurstCooldown -= safeDt;
      if (this.frenzyBurstCooldown <= 0) {
        this.frenzyBurstCooldown = 0.26;
        const pool: TargetKind[] = ["gingerbread", "peppermint", "giftRed", "giftGreen", "giftBlue", "sponsorGift"];
        const kind = pool[Math.floor(Math.random() * pool.length)];
        const side = Math.random() < 0.5 ? "left" : "right";
        this.spawnSingleTarget(kind, 0, 0, side);
      }
    }

    const timeScale = this.freezeTimer > 0 ? 0.44 : 1.0;
    const worldDt = safeDt * timeScale;
    const gravity = 940;

    if (this.frenzyTimer <= 0) {
      this.spawnTimer -= worldDt;
      if (this.spawnTimer <= 0 && this.targets.length <= 2) {
        this.spawnWave();
        this.spawnTimer = Math.max(1.05, 1.95 - this.waveNumber * 0.05);
      }
    }

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.sliced) {
        this.targets.splice(i, 1);
        continue;
      }

      if (t.hitCooldown > 0) {
        t.hitCooldown = Math.max(0, t.hitCooldown - safeDt);
      }

      if (t.kind === "pinataBoss" && t.y <= this.height * 0.42 && t.hoverTimer > 0) {
        t.hoverTimer -= safeDt;
        t.vy *= 0.85;
        t.vx *= 0.92;
        t.x += t.vx * worldDt;
        t.y += Math.sin(this.animClock * 5) * 28 * worldDt;
        t.angle += t.vAngle * safeDt * 0.5;
        t.reachedPeak = true;
        continue;
      }

      if (t.kind === "frostGoblin" && !t.sliced) {
        // Vuelo sinusoidal oscilante con estela mágica de escarcha
        t.x += Math.sin(this.animClock * 8 + t.id) * 110 * worldDt;
        if (Math.random() < 0.35) {
          this.particles.emitBurst(t.x + (Math.random() - 0.5) * 20, t.y + (Math.random() - 0.5) * 20, "#00E5FF", 2);
        }
      }

      t.vy += gravity * worldDt;
      t.x += t.vx * worldDt;
      t.y += t.vy * worldDt;
      t.angle += t.vAngle * worldDt;

      if (t.vy >= 0 || t.y < this.height * 0.72) {
        t.reachedPeak = true;
      }

      if (t.x - t.r < 24 && t.vx < 0) {
        t.x = 24 + t.r;
        t.vx = Math.abs(t.vx) * 0.75;
      } else if (t.x + t.r > this.width - 24 && t.vx > 0) {
        t.x = this.width - 24 - t.r;
        t.vx = -Math.abs(t.vx) * 0.75;
      }

      if (t.y - t.r > this.height + 55 && t.vy > 0) {
        if (t.kind === "frostGoblin" && !t.sliced) {
          // ¡EL DUENDE ESCAPÓ! Penalización de tiempo (-4 segundos)
          this.timeRemaining = Math.max(0, this.timeRemaining - 4);
          this.triggerShake(0.24, 10);
          this.audio.playError();
          this.addBanner(
            Math.max(160, Math.min(this.width - 160, t.x)),
            this.height * 0.65,
            "¡EL DUENDE ESCAPÓ! -4s",
            "¡El ladrón huyó riéndose con tu tiempo!",
            "#FF1744",
            1.25
          );
        }
        this.targets.splice(i, 1);
      }
    }

    for (let i = this.halves.length - 1; i >= 0; i--) {
      const h = this.halves[i];
      h.life += safeDt;
      h.vy += gravity * 1.05 * safeDt;
      h.x += h.vx * safeDt;
      h.y += h.vy * safeDt;
      h.angle += h.vAngle * safeDt;
      h.alpha = Math.max(0, 1 - h.life / h.maxLife);
      if (h.life >= h.maxLife || h.y > this.height + 120) {
        this.halves.splice(i, 1);
      }
    }

    for (let i = this.poppedToys.length - 1; i >= 0; i--) {
      const pt = this.poppedToys[i];
      pt.life += safeDt;
      pt.vy += (pt.isSponsorBadge ? 140 : 520) * safeDt;
      pt.x += pt.vx * safeDt;
      pt.y += pt.vy * safeDt;
      pt.angle += pt.vAngle * safeDt;
      pt.alpha = Math.max(0, 1 - Math.pow(pt.life / pt.maxLife, 1.6));
      if (pt.life >= pt.maxLife) {
        this.poppedToys.splice(i, 1);
      }
    }

    for (let i = this.splatters.length - 1; i >= 0; i--) {
      const sp = this.splatters[i];
      sp.life += safeDt;
      sp.alpha = Math.max(0, 0.75 * (1 - sp.life / sp.maxLife));
      if (sp.life >= sp.maxLife) {
        this.splatters.splice(i, 1);
      }
    }

    for (let i = this.slashFlashes.length - 1; i >= 0; i--) {
      const sf = this.slashFlashes[i];
      sf.alpha -= safeDt * 6.5;
      if (sf.alpha <= 0) {
        this.slashFlashes.splice(i, 1);
      }
    }

    for (let i = this.bladePoints.length - 1; i >= 0; i--) {
      this.bladePoints[i].age += safeDt;
      if (this.bladePoints[i].age > 0.13) {
        this.bladePoints.splice(i, 1);
      }
    }

    for (let i = this.droppedCrosses.length - 1; i >= 0; i--) {
      const dc = this.droppedCrosses[i];
      dc.life += safeDt;
      dc.alpha = Math.max(0, 1 - dc.life / 1.3);
      if (dc.life >= 1.3) {
        this.droppedCrosses.splice(i, 1);
      }
    }

    for (let i = this.banners.length - 1; i >= 0; i--) {
      const fb = this.banners[i];
      fb.life += safeDt;
      fb.y += fb.vy * safeDt;
      fb.alpha = Math.max(0, 1 - Math.pow(fb.life / fb.maxLife, 1.7));
      if (fb.life >= fb.maxLife) {
        this.banners.splice(i, 1);
      }
    }
  }

  private segmentIntersectsCircle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number,
    r: number
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) {
      t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }
    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;
    const distSq = (cx - nearX) * (cx - nearX) + (cy - nearY) * (cy - nearY);
    return distSq <= r * r;
  }

  private pointInRect(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  // ============================================================================
  // RENDERIZADO 2D ESTILIZADO
  // ============================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    this.drawDojoBackground(ctx);
    this.drawDojoSponsorBillboard(ctx);
    this.drawWallSplatters(ctx);
    this.drawTopStatusBarAndTimerGauge(ctx);
    this.drawLowTimeUrgencyOverlay(ctx);
    this.drawSlicedHalves(ctx);
    this.drawPoppedToys(ctx);
    this.drawFlyingTargets(ctx);
    this.drawSlashFlashes(ctx);
    this.drawKatanaBlade(ctx);
    this.drawDroppedCrosses(ctx);
    this.drawFreezeAndFrenzyBorders(ctx);
    this.drawBanners(ctx);

    ctx.restore();
  }

  private drawDojoBackground(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    if (this.bgImg.complete && this.bgImg.naturalWidth > 0) {
      const scale = Math.max(w / this.bgImg.naturalWidth, h / this.bgImg.naturalHeight);
      const dw = this.bgImg.naturalWidth * scale;
      const dh = this.bgImg.naturalHeight * scale;
      ctx.drawImage(this.bgImg, (w - dw) * 0.5, (h - dh) * 0.5, dw, dh);
    }

    const dojoGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.1, w * 0.5, h * 0.5, w * 0.85);
    dojoGrad.addColorStop(0, "rgba(42, 22, 12, 0.72)");
    dojoGrad.addColorStop(0.65, "rgba(26, 13, 7, 0.84)");
    dojoGrad.addColorStop(1, "rgba(12, 6, 3, 0.92)");
    ctx.fillStyle = dojoGrad;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Cartelera / Estandarte publicitario de Patrocinadores integrado en el Dojo
   */
  private drawDojoSponsorBillboard(ctx: CanvasRenderingContext2D): void {
    if (this.sponsors.length === 0) return;
    const sponsor = this.sponsors[this.billboardSponsorIdx % this.sponsors.length];
    const w = this.width;
    const isShort = this.height <= 700;
    const boardW = isShort ? Math.min(290, w * 0.40) : Math.min(340, w * 0.36);
    const boardH = isShort ? 50 : 68;
    const boardX = isShort ? 14 : (w - boardW) * 0.5;
    const boardY = isShort ? this.height - boardH - 10 : 128;

    ctx.save();

    // Resplandor cuando se activa un patrocinador o combo
    if (this.billboardGlowTimer > 0 || this.isLogoPowerUpActive) {
      ctx.shadowColor = sponsor.themeColor;
      ctx.shadowBlur = isShort ? 14 : 22;
    }

    // Marco de madera noble y bronce del Dojo
    const bgGrad = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardH);
    bgGrad.addColorStop(0, "rgba(30, 16, 10, 0.94)");
    bgGrad.addColorStop(1, "rgba(16, 8, 5, 0.97)");
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = this.isLogoPowerUpActive ? "#00E676" : "#FFD700";
    ctx.lineWidth = isShort ? 2 : 2.5;
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, isShort ? 12 : 16);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Medallón claro a la izquierda para máxima legibilidad del logo
    const logoBoxW = isShort ? 70 : 92;
    const logoBoxH = boardH - (isShort ? 10 : 12);
    const logoBoxX = boardX + (isShort ? 6 : 8);
    const logoBoxY = boardY + (isShort ? 5 : 6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
    ctx.beginPath();
    ctx.roundRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, isShort ? 8 : 11);
    ctx.fill();

    if (sponsor.logo.complete && sponsor.logo.naturalWidth > 0) {
      const pad = isShort ? 4 : 6;
      const maxW = logoBoxW - pad * 2;
      const maxH = logoBoxH - pad * 2;
      const scale = Math.min(maxW / sponsor.logo.naturalWidth, maxH / sponsor.logo.naturalHeight);
      const dw = sponsor.logo.naturalWidth * scale;
      const dh = sponsor.logo.naturalHeight * scale;
      ctx.drawImage(
        sponsor.logo,
        logoBoxX + (logoBoxW - dw) * 0.5,
        logoBoxY + (logoBoxH - dh) * 0.5,
        dw,
        dh
      );
    }

    // Textos del patrocinador a la derecha
    const textX = logoBoxX + logoBoxW + (isShort ? 10 : 12);
    const maxTextW = boardW - logoBoxW - (isShort ? 18 : 28);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (isShort) {
      ctx.fillStyle = this.isLogoPowerUpActive ? "#00E676" : "#FFD700";
      ctx.font = "900 10px 'Nunito', sans-serif";
      ctx.fillText(
        this.isLogoPowerUpActive ? "¡PODER x2 ACTIVADO!" : "PATROCINADOR OFICIAL",
        textX,
        boardY + 12,
        maxTextW
      );

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 14px 'Titan One', 'Fredoka', 'Nunito', sans-serif";
      ctx.fillText(sponsor.name.toUpperCase(), textX, boardY + 26, maxTextW);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "700 10.5px 'Nunito', sans-serif";
      ctx.fillText(sponsor.tagline, textX, boardY + 39, maxTextW);
    } else {
      ctx.fillStyle = "#FFD700";
      ctx.font = "900 10px 'Nunito', sans-serif";
      ctx.fillText(
        this.isLogoPowerUpActive ? "¡PODER PATROCINADOR x2 ACTIVO!" : "PATROCINADOR DEL DOJO",
        textX,
        boardY + 18,
        maxTextW
      );

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 15px 'Nunito', sans-serif";
      ctx.fillText(sponsor.name.toUpperCase(), textX, boardY + 36, maxTextW);

      ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
      ctx.font = "700 11px 'Nunito', sans-serif";
      ctx.fillText(sponsor.tagline, textX, boardY + 53, maxTextW);
    }

    ctx.restore();
  }

  private drawWallSplatters(ctx: CanvasRenderingContext2D): void {
    for (const sp of this.splatters) {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r * 0.58, 0, Math.PI * 2);
      for (const d of sp.drops) {
        ctx.moveTo(sp.x + d.dx + d.r, sp.y + d.dy);
        ctx.arc(sp.x + d.dx, sp.y + d.dy, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  private drawTopStatusBarAndTimerGauge(ctx: CanvasRenderingContext2D): void {
    const isShort = this.height <= 700;
    const hudH = this.height < 420 ? 26 : (isShort ? 30 : 54);
    const powerBannerH = this.isLogoPowerUpActive ? 24 : 0;
    const barY = isShort ? hudH + powerBannerH + 6 : 82;
    const barH = isShort ? 22 : 38;
    const secs = Math.max(0, Math.ceil(this.timeRemaining));
    const isLowTime = this.timeRemaining <= 10;

    ctx.save();

    // 1. Placa Izquierda: Cortes y Oleada
    const leftW = isShort ? 160 : 215;
    const leftX = 14;
    ctx.fillStyle = "rgba(20, 12, 8, 0.88)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(leftX, barY, leftW, barH, barH * 0.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = isShort ? "900 10.5px 'Nunito', sans-serif" : "900 13px 'Nunito', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`CORTES: ${this.totalSlicedCount} • OLEADA ${this.waveNumber}`, leftX + 12, barY + barH * 0.5);

    // 2. Placa Central: Barra Visual de Tiempo + Indicador de Reloj Dorado (+5s)
    if (!isShort) {
      const timerW = Math.min(350, this.width * 0.36);
      const timerX = (this.width - timerW) * 0.5;
      const pulse = isLowTime ? 1 + Math.sin(this.animClock * 16) * 0.04 : 1;

      ctx.save();
      ctx.translate(timerX + timerW * 0.5, barY + barH * 0.5);
      ctx.scale(pulse, pulse);
      ctx.translate(-(timerX + timerW * 0.5), -(barY + barH * 0.5));

      ctx.fillStyle = isLowTime
        ? "rgba(90, 10, 18, 0.94)"
        : this.timeAddedFlash > 0
        ? "rgba(8, 75, 48, 0.94)"
        : "rgba(20, 12, 8, 0.9)";
      ctx.strokeStyle = isLowTime ? "#FF1744" : this.timeAddedFlash > 0 ? "#00E676" : "#FFD700";
      ctx.lineWidth = isLowTime || this.timeAddedFlash > 0 ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(timerX, barY, timerW, barH, 19);
      ctx.fill();
      ctx.stroke();

      // Barra de progreso de tiempo interna
      const fillRatio = Math.max(0, Math.min(1, this.timeRemaining / this.initialDuration));
      const innerPad = 5;
      const fillW = Math.max(0, (timerW - innerPad * 2) * fillRatio);
      if (fillW > 0) {
        const barGrad = ctx.createLinearGradient(timerX, barY, timerX + timerW, barY);
        if (isLowTime) {
          barGrad.addColorStop(0, "rgba(255, 23, 68, 0.55)");
          barGrad.addColorStop(1, "rgba(255, 145, 0, 0.55)");
        } else {
          barGrad.addColorStop(0, "rgba(0, 230, 118, 0.42)");
          barGrad.addColorStop(1, "rgba(0, 229, 255, 0.42)");
        }
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(timerX + innerPad, barY + innerPad, fillW, barH - innerPad * 2, 14);
        ctx.fill();
      }

      // Icono del Reloj Dorado a la izquierda de la barra
      if (this.clockImg.complete && this.clockImg.naturalWidth > 0) {
        ctx.drawImage(this.clockImg, timerX + 10, barY + 3, 32, 32);
      }

      ctx.fillStyle = isLowTime ? "#FF8A80" : "#FFFFFF";
      ctx.font = "900 14px 'Nunito', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        isLowTime
          ? `¡TIEMPO: ${secs}s! ¡CORTA EL RELOJ +5s!`
          : `TIEMPO: ${secs}s • RELOJ DORADO = +5s`,
        timerX + timerW * 0.5 + 10,
        barY + barH * 0.5
      );
      ctx.restore();
    } else if (isLowTime || this.timeAddedFlash > 0) {
      // En modo apaisado compacto, solo mostrar píldora central si hay alerta o bono +5s
      const bonusW = 165;
      const bonusX = (this.width - bonusW) * 0.5;
      ctx.save();
      ctx.fillStyle = isLowTime
        ? "rgba(180, 20, 30, 0.92)"
        : "rgba(0, 180, 80, 0.92)";
      ctx.strokeStyle = isLowTime ? "#FF1744" : "#00E676";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bonusX, barY, bonusW, barH, barH * 0.5);
      ctx.fill();
      ctx.stroke();

      if (this.clockImg.complete && this.clockImg.naturalWidth > 0) {
        ctx.drawImage(this.clockImg, bonusX + 6, barY + 2, 18, 18);
      }

      ctx.fillStyle = isLowTime ? "#FFCDD2" : "#FFFFFF";
      ctx.font = "900 10px 'Nunito', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        isLowTime
          ? `¡TIEMPO BAJO: ${secs}s!`
          : "¡+5s TIEMPO EXTRA!",
        bonusX + bonusW * 0.5 + 8,
        barY + barH * 0.5
      );
      ctx.restore();
    }

    // 3. Botón Tutorial a la derecha
    const helpW = isShort ? 78 : 116;
    const helpX = this.width - helpW - 14;
    this.helpBtnRect = { x: helpX, y: barY, w: helpW, h: barH };

    ctx.fillStyle = "rgba(24, 14, 10, 0.88)";
    ctx.strokeStyle = "#00E5FF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(helpX, barY, helpW, barH, barH * 0.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = isShort ? "900 9.5px 'Nunito', sans-serif" : "900 12px 'Nunito', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("? TUTORIAL", helpX + helpW * 0.5, barY + barH * 0.5);

    ctx.restore();
  }

  /**
   * Alerta visual dramática cuando quedan <= 10 segundos en el reloj
   */
  private drawLowTimeUrgencyOverlay(ctx: CanvasRenderingContext2D): void {
    if (this.timeRemaining > 10 || this.timeRemaining <= 0) return;

    const w = this.width;
    const h = this.height;
    const secs = Math.ceil(this.timeRemaining);
    const pulse = 0.5 + 0.5 * Math.sin(this.animClock * 14);

    ctx.save();

    // Viñeta / marco pulsante rojo de alerta
    ctx.strokeStyle = `rgba(255, 23, 68, ${0.28 + pulse * 0.45})`;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);

    // Cuenta regresiva grande en el centro del Dojo
    const scale = 1 + pulse * 0.14;
    ctx.translate(w * 0.5, h * 0.52);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "900 110px 'Nunito', sans-serif";
    ctx.fillStyle = `rgba(255, 23, 68, ${0.16 + pulse * 0.14})`;
    ctx.fillText(`${secs}`, 0, 0);

    ctx.font = "900 18px 'Nunito', sans-serif";
    ctx.fillStyle = `rgba(255, 215, 0, ${0.55 + pulse * 0.35})`;
    ctx.fillText("¡ÚLTIMOS SEGUNDOS! ¡CORTA UN RELOJ DORADO (+5s)!", 0, 68);

    ctx.restore();
  }

  private getSpriteForKind(kind: TargetKind): HTMLImageElement {
    switch (kind) {
      case "timeClock":
        return this.clockImg;
      case "pinataBoss":
        return this.pinataImg;
      case "gingerbread":
        return this.gingerbreadImg;
      case "peppermint":
        return this.peppermintImg;
      case "freezeCrystal":
        return this.freezeCrystalImg;
      case "frenzyOrb":
        return this.frenzyOrbImg;
      case "bomb":
        return this.bombImg;
      case "giftRed":
        return this.giftRedImg;
      case "giftGreen":
        return this.giftGreenImg;
      case "giftBlue":
        return this.giftBlueImg;
      case "sponsorGift":
        return this.giftGoldImg;
      case "frostGoblin":
        return this.duendeImg;
      case "frozenGift":
        return this.frozenGiftImg;
    }
  }

  private drawFlyingTargets(ctx: CanvasRenderingContext2D): void {
    for (const t of this.targets) {
      if (t.sliced) continue;

      // Sombra proyectada en la pared del dojo (sensación de profundidad 3D)
      ctx.save();
      ctx.fillStyle = "rgba(10, 5, 2, 0.40)";
      ctx.beginPath();
      ctx.ellipse(t.x + 16, t.y + 22, t.r * 0.95, t.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      if (t.kind === "bomb") {
        const pulse = 1 + Math.sin(this.animClock * 18) * 0.12;
        const dangerGlow = ctx.createRadialGradient(0, 0, t.r * 0.3, 0, 0, t.r * 1.55 * pulse);
        dangerGlow.addColorStop(0, "rgba(255, 23, 68, 0.58)");
        dangerGlow.addColorStop(1, "rgba(255, 23, 68, 0)");
        ctx.fillStyle = dangerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, t.r * 1.55 * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.kind === "frostGoblin") {
        const pulse = 1 + Math.sin(this.animClock * 14) * 0.15;
        const goblinAura = ctx.createRadialGradient(0, 0, t.r * 0.2, 0, 0, t.r * 1.65 * pulse);
        goblinAura.addColorStop(0, "rgba(0, 229, 255, 0.65)");
        goblinAura.addColorStop(0.7, "rgba(0, 150, 255, 0.3)");
        goblinAura.addColorStop(1, "rgba(0, 229, 255, 0)");
        ctx.fillStyle = goblinAura;
        ctx.beginPath();
        ctx.arc(0, 0, t.r * 1.65 * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.kind === "frozenGift") {
        const frostAura = ctx.createRadialGradient(0, 0, t.r * 0.3, 0, 0, t.r * 1.45);
        frostAura.addColorStop(0, "rgba(128, 216, 255, 0.45)");
        frostAura.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = frostAura;
        ctx.beginPath();
        ctx.arc(0, 0, t.r * 1.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (
        t.kind === "timeClock" ||
        t.kind === "pinataBoss" ||
        t.kind === "freezeCrystal" ||
        t.kind === "frenzyOrb" ||
        t.kind === "sponsorGift"
      ) {
        const auraColor =
          t.kind === "timeClock"
            ? "rgba(0, 230, 118, 0.62)"
            : t.kind === "freezeCrystal"
            ? "rgba(0, 229, 255, 0.52)"
            : t.kind === "frenzyOrb"
            ? "rgba(0, 230, 118, 0.5)"
            : "rgba(255, 215, 0, 0.55)";
        const aura = ctx.createRadialGradient(0, 0, t.r * 0.3, 0, 0, t.r * 1.65);
        aura.addColorStop(0, auraColor);
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, t.r * 1.65, 0, Math.PI * 2);
        ctx.fill();
      }

      const img = this.getSpriteForKind(t.kind);
      const drawSize = t.r * 2.25;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      } else {
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, t.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Medallón de alto contraste con el Logo del Patrocinador sobre el Cofre Volador
      if (t.kind === "sponsorGift" && t.sponsor) {
        ctx.rotate(-t.angle);
        const badgeR = t.r * 0.68;
        ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
        ctx.strokeStyle = t.sponsor.themeColor || "#FFD700";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 4, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (t.sponsor.logo.complete && t.sponsor.logo.naturalWidth > 0) {
          const maxDim = badgeR * 1.45;
          const sc = Math.min(maxDim / t.sponsor.logo.naturalWidth, maxDim / t.sponsor.logo.naturalHeight);
          const lw = t.sponsor.logo.naturalWidth * sc;
          const lh = t.sponsor.logo.naturalHeight * sc;
          ctx.drawImage(t.sponsor.logo, -lw * 0.5, 4 - lh * 0.5, lw, lh);
        }
      }

      // Etiqueta "+5 SEGUNDOS" sobre el Reloj Dorado Mágico
      if (t.kind === "timeClock") {
        ctx.rotate(-t.angle);
        ctx.fillStyle = "rgba(6, 52, 32, 0.94)";
        ctx.strokeStyle = "#00E676";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-42, -t.r - 26, 84, 24, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#00E676";
        ctx.font = "900 13px 'Nunito', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+5 SEG", 0, -t.r - 14);
      }

      if (t.kind === "frostGoblin") {
        ctx.rotate(-t.angle);
        ctx.fillStyle = "rgba(4, 24, 48, 0.92)";
        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-68, -t.r - 32, 136, 26, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#00E5FF";
        ctx.font = "900 12px 'Nunito', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`¡DUENDE! ${t.multiHits}/3 TAJOS`, 0, -t.r - 19);
      }

      if (t.kind === "frozenGift") {
        ctx.rotate(-t.angle);
        ctx.fillStyle = "rgba(6, 32, 60, 0.9)";
        ctx.strokeStyle = "#80D8FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-54, -t.r - 28, 108, 22, 11);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#80D8FF";
        ctx.font = "900 11px 'Nunito', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.multiHits === 0 ? "¡HIELO DURO!" : "¡REGALO!", 0, -t.r - 17);
      }

      if (t.kind === "pinataBoss") {
        ctx.rotate(-t.angle);
        ctx.fillStyle = "rgba(10, 20, 40, 0.88)";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-56, -t.r - 30, 112, 24, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFD700";
        ctx.font = "900 12px 'Nunito', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`¡CÓRTALA! ${t.multiHits}/${t.maxMultiHits}`, 0, -t.r - 18);
      }

      ctx.restore();
    }
  }

  private drawSlicedHalves(ctx: CanvasRenderingContext2D): void {
    for (const h of this.halves) {
      const img = this.getSpriteForKind(h.kind);
      if (!img.complete || img.naturalWidth === 0) continue;

      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.translate(h.x, h.y);
      ctx.rotate(h.angle);

      ctx.save();
      ctx.rotate(h.cutAngle);
      ctx.beginPath();
      const clipExtent = h.r * 2.6;
      if (h.side === -1) {
        ctx.rect(-clipExtent, -clipExtent, clipExtent * 2, clipExtent);
      } else {
        ctx.rect(-clipExtent, 0, clipExtent * 2, clipExtent);
      }
      ctx.clip();

      ctx.rotate(-h.cutAngle);
      const drawSize = h.r * 2.25;
      ctx.drawImage(img, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();

      if (h.life < 0.12) {
        ctx.save();
        ctx.rotate(h.cutAngle);
        ctx.globalAlpha = h.alpha * (1 - h.life / 0.12);
        ctx.strokeStyle = h.seamColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-h.r * 0.85, 0);
        ctx.lineTo(h.r * 0.85, 0);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  private drawPoppedToys(ctx: CanvasRenderingContext2D): void {
    for (const pt of this.poppedToys) {
      if (!pt.img.complete || pt.img.naturalWidth === 0) continue;
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle);

      if (pt.isSponsorBadge) {
        // Placa publicitaria flotante grande al cortar un Cofre de Patrocinador
        const cardW = pt.size * 1.35;
        const cardH = pt.size * 0.88;
        ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
        ctx.strokeStyle = pt.badgeColor || "#FFD700";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-cardW * 0.5, -cardH * 0.5, cardW, cardH, 16);
        ctx.fill();
        ctx.stroke();

        const maxW = cardW * 0.82;
        const maxH = cardH * 0.78;
        const sc = Math.min(maxW / pt.img.naturalWidth, maxH / pt.img.naturalHeight);
        const dw = pt.img.naturalWidth * sc;
        const dh = pt.img.naturalHeight * sc;
        ctx.drawImage(pt.img, -dw * 0.5, -dh * 0.5, dw, dh);
      } else {
        ctx.drawImage(pt.img, -pt.size * 0.5, -pt.size * 0.5, pt.size, pt.size);
      }

      ctx.restore();
    }
  }

  private drawSlashFlashes(ctx: CanvasRenderingContext2D): void {
    for (const sf of this.slashFlashes) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sf.alpha);
      ctx.strokeStyle = sf.color;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sf.x1, sf.y1);
      ctx.lineTo(sf.x2, sf.y2);
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sf.x1, sf.y1);
      ctx.lineTo(sf.x2, sf.y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawKatanaBlade(ctx: CanvasRenderingContext2D): void {
    if (this.bladePoints.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 1; i < this.bladePoints.length; i++) {
      const p0 = this.bladePoints[i - 1];
      const p1 = this.bladePoints[i];
      // Evitar unir trazos de dedos distintos o distancias mayores a 130px
      if (p0.pointerId !== p1.pointerId) continue;
      const d = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (d > 130) continue;

      const ratio = i / this.bladePoints.length;
      const alpha = Math.max(0, 1 - p1.age / 0.13) * ratio;

      ctx.strokeStyle = this.freezeTimer > 0 ? `rgba(0, 229, 255, ${alpha})` : `rgba(255, 215, 0, ${alpha})`;
      ctx.lineWidth = Math.max(2, ratio * 14);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = Math.max(1, ratio * 6);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawDroppedCrosses(ctx: CanvasRenderingContext2D): void {
    for (const dc of this.droppedCrosses) {
      ctx.save();
      ctx.globalAlpha = dc.alpha;
      ctx.translate(dc.x, dc.y);
      ctx.scale(dc.scale, dc.scale);

      ctx.strokeStyle = "#FF1744";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(14, 14);
      ctx.moveTo(14, -14);
      ctx.lineTo(-14, 14);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawFreezeAndFrenzyBorders(ctx: CanvasRenderingContext2D): void {
    if (this.freezeTimer > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 229, 255, 0.55)";
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, this.width - 14, this.height - 14);
      ctx.restore();
    } else if (this.frenzyTimer > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, this.width - 12, this.height - 12);
      ctx.restore();
    }
  }

  private drawBanners(ctx: CanvasRenderingContext2D): void {
    for (const fb of this.banners) {
      ctx.save();
      ctx.globalAlpha = fb.alpha;
      ctx.translate(fb.x, fb.y);
      ctx.scale(fb.scale, fb.scale);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "900 22px 'Nunito', sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(12, 8, 6, 0.92)";
      ctx.strokeText(fb.text, 0, 0);
      ctx.fillStyle = fb.color;
      ctx.fillText(fb.text, 0, 0);

      if (fb.subText) {
        ctx.font = "800 14px 'Nunito', sans-serif";
        ctx.lineWidth = 4;
        ctx.strokeText(fb.subText, 0, 22);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(fb.subText, 0, 22);
      }
      ctx.restore();
    }
  }
}
