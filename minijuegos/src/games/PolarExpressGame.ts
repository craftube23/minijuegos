/**
 * ==============================================================================
 * JUEGO: ¡EL EXPRESO POLAR MÁGICO! (Polar Express Lane Runner - Edición Deluxe)
 * ==============================================================================
 *
 * Corredor ferroviario de 3 vías con locomotora navideña y vagón de regalos
 * articulado:
 * - Tren completo: Locomotora de vapor + Vagón de Regalos acoplado que sigue
 *   el cambio de vía con retardo articulado realista e inclinación dinámica.
 * - Faro delantero volumétrico que ilumina los rieles dorados y coleccionables,
 *   transformándose en un escudo rompehielos durante el Turbo Vapor.
 * - Escenario multicapa con Aurora Boreal animada, aldea navideña en parallax,
 *   cabañas iluminadas, pinos nevados y semáforos ferroviarios con halos de luz.
 * - Sistema de Caldera de Vapor (Combo x1 a x4): recoger regalos y estrellas
 *   presuriza la caldera hasta desatar el ¡TURBO EXPRESO! automáticamente,
 *   o actívalo al instante con el Regalo Dorado de Patrocinador.
 * - Obstáculos ferroviarios (Barrera de vía, Muñeco de nieve, Cristal polar,
 *   Tronco nevado y Carbón) que salen volando por los aires al ser demolidos.
 * - Estaciones Navideñas cada 400 m con bonificación de puntos.
 *
 * Arte Stylized 2D Game Art. Cero emojis.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import { drawPill, drawSponsorMedallion, imgReady } from "./shared/gameDraw";

type EntityKind = "obstacle" | "gift" | "star" | "sponsor";

interface RunnerEntity {
  kind: EntityKind;
  sprite: HTMLImageElement;
  lane: number;
  x: number;
  hMul: number;
  logo?: HTMLImageElement;
  name?: string;
  taken: boolean;
  phase: number;
  isBarrier?: boolean;
}

interface FlyingDebris {
  sprite: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vRot: number;
  alpha: number;
}

interface SteamPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  maxR: number;
  life: number;
  turboTint: boolean;
}

interface RailSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface TracksideProp {
  kind: "signal" | "cottage" | "milepost";
  x: number;
  scale: number;
  mileNumber?: number;
}

interface StationCheckpoint {
  x: number;
  name: string;
  passed: boolean;
}

interface LaneSample {
  dist: number;
  lane: number;
}

export class PolarExpressGame extends BaseGame {
  private bgImage: HTMLImageElement;
  private spriteTrain: HTMLImageElement;
  private spriteWagon: HTMLImageElement;
  private spriteSignal: HTMLImageElement;
  private spriteBarrier: HTMLImageElement;
  private spriteCottage: HTMLImageElement;
  private spriteTree: HTMLImageElement;
  private spriteStar: HTMLImageElement;
  private obstacleSprites: { img: HTMLImageElement; hMul: number; isBarrier?: boolean }[] = [];
  private giftSprites: HTMLImageElement[] = [];
  private sponsors: { name: string; logo: HTMLImageElement }[] = [];
  private spriteGold: HTMLImageElement;

  private entities: RunnerEntity[] = [];
  private debris: FlyingDebris[] = [];
  private steam: SteamPuff[] = [];
  private sparks: RailSpark[] = [];
  private trackProps: TracksideProp[] = [];
  private stations: StationCheckpoint[] = [];
  private laneHistory: LaneSample[] = [];

  // Estrellas del cielo nocturno
  private skyStars: { x: number; y: number; r: number; phase: number }[] = [];
  // Copos de nieve en primer plano
  private snowFlakes: { x: number; y: number; r: number; speedX: number; speedY: number }[] = [];

  // Geometría del tren y carriles
  private trainW = 240;
  private trainH = 115;
  private wagonW = 195;
  private wagonH = 110;
  private trainX = 230;
  private wagonX = 20;
  private laneGap = 92;
  private laneYs: number[] = [0, 0, 0];

  // Estado de juego
  private laneFloat = 1;
  private wagonLaneFloat = 1;
  private targetLane = 1;
  private trainTilt = 0;
  private speed = 350;
  private elapsed = 0;
  private distance = 0;
  private nextStationDist = 400;
  private nextMilepostDist = 100;
  private stationIdx = 0;
  private scrollX = 0;
  private waveTimer = 0.85;
  private propTimer = 0.6;
  private invuln = 0;
  private turbo = 0;
  private boilerCharge = 0; // 0 a 100
  private combo = 0;
  private comboTimer = 0;
  private giftsCollected = 0;
  private ending = false;
  private scoreAcc = 0;
  private animClock = 0;
  private pointerDown = false;
  private pointerStartY = 0;

  private readonly stationNames = [
    "ESTACIÓN VILLA NOEL",
    "ESTACIÓN CUMBRE BOREAL",
    "ESTACIÓN TALLER MÁGICO",
    "ESTACIÓN FERIA DEL JUGUETE",
    "ESTACIÓN GLACIAR DORADO"
  ];

  constructor(canvas: HTMLCanvasElement, input: InputManager, audio: AudioManager, particles: ParticleSystem) {
    super(
      "polar-express",
      "¡El Expreso Polar Mágico!",
      "¡Cambia de vía con la locomotora y su vagón de regalos, carga la caldera de vapor y esquiva o demuele obstáculos!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/jingle-bells.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImage = this.getImage("./assets/images/fondo-villa-seamless.jpg");
    this.spriteTrain = this.getImage("./assets/images/locomotora-lateral.png");
    this.spriteWagon = this.getImage("./assets/images/vagon-expreso.png");
    this.spriteSignal = this.getImage("./assets/images/semaforo-tren.png");
    this.spriteBarrier = this.getImage("./assets/images/obstaculo-barrera-tren.png");
    this.spriteCottage = this.getImage("./assets/images/casa-navidena-clean.png");
    this.spriteTree = this.getImage("./assets/images/arbol.png");
    this.spriteStar = this.getImage("./assets/images/estrella con logo.png");
    this.spriteGold = this.getImage("./assets/images/regalo-estilizado-dorado.png");

    this.obstacleSprites = [
      { img: this.spriteBarrier, hMul: 0.88, isBarrier: true },
      { img: this.getImage("./assets/images/obstaculo-muneco.png"), hMul: 0.96 },
      { img: this.getImage("./assets/images/obstaculo-cristal.png"), hMul: 0.84 },
      { img: this.getImage("./assets/images/obstaculo-tronco.png"), hMul: 0.68 },
      { img: this.getImage("./assets/images/carbon.png"), hMul: 0.62 }
    ];

    this.giftSprites = [
      this.getImage("./assets/images/regalo-estilizado-rojo.png"),
      this.getImage("./assets/images/regalo-estilizado-verde.png"),
      this.getImage("./assets/images/regalo-estilizado-azul.png")
    ];

    this.sponsors = [
      { name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.png") }
    ];
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      this.setLane(this.targetLane - 1);
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      e.preventDefault();
      this.setLane(this.targetLane + 1);
    }
  };

  private computeLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;

    // Locomotora limpia (aspecto 1056 x 507 = 2.082)
    this.trainW = Math.max(155, Math.min(285, Math.min(w * 0.25, h * 0.42)));
    this.trainH = this.trainW * (507 / 1056);

    // Vagón de regalos (aspecto 1137 x 645 = 1.762)
    this.wagonH = this.trainH * 0.94;
    this.wagonW = this.wagonH * (1137 / 645);

    this.laneGap = Math.max(66, Math.min(h * 0.165, this.trainH * 0.82));
    const centerY = h * 0.64;
    this.laneYs = [centerY - this.laneGap, centerY, centerY + this.laneGap];

    // En pantallas anchas mostramos vagón + locomotora; en pantallas estrechas ajustamos posición
    const couplerGap = Math.max(10, this.trainW * 0.055);
    if (w >= 520) {
      this.wagonX = Math.max(18, w * 0.045);
      this.trainX = this.wagonX + this.wagonW + couplerGap;
    } else {
      this.wagonX = -this.wagonW * 0.55;
      this.trainX = this.wagonX + this.wagonW + couplerGap;
    }

    if (this.skyStars.length === 0) {
      for (let i = 0; i < 42; i++) {
        this.skyStars.push({
          x: Math.random() * w,
          y: Math.random() * (h * 0.42),
          r: 1 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    if (this.snowFlakes.length === 0) {
      for (let i = 0; i < 38; i++) {
        this.snowFlakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.5 + Math.random() * 2.5,
          speedX: 90 + Math.random() * 110,
          speedY: 28 + Math.random() * 42
        });
      }
    }
  }

  protected onStart(): void {
    this.computeLayout();
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;
    this.entities = [];
    this.debris = [];
    this.steam = [];
    this.sparks = [];
    this.trackProps = [];
    this.stations = [];
    this.laneHistory = [{ dist: 0, lane: 1 }];

    this.laneFloat = 1;
    this.wagonLaneFloat = 1;
    this.targetLane = 1;
    this.trainTilt = 0;
    this.speed = 350;
    this.elapsed = 0;
    this.distance = 0;
    this.nextStationDist = 400;
    this.nextMilepostDist = 100;
    this.stationIdx = 0;
    this.scrollX = 0;
    this.waveTimer = 0.9;
    this.propTimer = 0.2;
    this.invuln = 0;
    this.turbo = 0;
    this.boilerCharge = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.giftsCollected = 0;
    this.ending = false;
    this.scoreAcc = 0;
    this.animClock = 0;
    this.pointerDown = false;

    // Poblar señales iniciales en el horizonte
    for (let x = 220; x < this.width + 200; x += 340) {
      this.trackProps.push({
        kind: Math.random() < 0.65 ? "signal" : "cottage",
        x,
        scale: 0.9 + Math.random() * 0.15
      });
    }

    this.input.onPointerDown = (_id: number, _x: number, y: number) => {
      this.pointerDown = true;
      this.pointerStartY = y;
      this.setLaneFromY(y);
    };
    this.input.onPointerMove = (_id: number, _x: number, y: number) => {
      if (!this.pointerDown) return;
      const dy = y - this.pointerStartY;
      if (Math.abs(dy) > 36) {
        this.setLane(this.targetLane + (dy > 0 ? 1 : -1));
        this.pointerStartY = y;
      } else {
        this.setLaneFromY(y);
      }
    };
    this.input.onPointerUp = () => {
      this.pointerDown = false;
    };

    window.removeEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keydown", this.handleKeyDown);

    this.addFloatingText("¡CAMBIA DE VÍA Y CARGA LA CALDERA!", this.width * 0.5, this.height * 0.28, "#FFD700", 1.3);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
    this.input.onPointerUp = undefined;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeLayout();
  }

  private setLane(lane: number): void {
    const next = Math.max(0, Math.min(2, lane));
    if (next !== this.targetLane) {
      this.targetLane = next;
      this.audio.playRunnerLaneSwitch();
      this.emitWheelSparks(8, "#FFD700");
    }
  }

  private setLaneFromY(y: number): void {
    if (!this.isRunning || this.isGameOver) return;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < 3; i++) {
      const d = Math.abs(y - (this.laneYs[i] - this.trainH * 0.35));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    this.setLane(best);
  }

  private emitWheelSparks(count: number, color: string): void {
    const bottom = this.laneYAt(this.laneFloat);
    for (let i = 0; i < count; i++) {
      const wheelX = this.trainX + this.trainW * (0.2 + Math.random() * 0.6);
      this.sparks.push({
        x: wheelX,
        y: bottom - 2,
        vx: -120 - Math.random() * 180,
        vy: -25 - Math.random() * 85,
        life: 0.35 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 2.5
      });
    }
  }

  // ==========================================================================
  // GENERACIÓN DE OLEADAS Y DECORACIÓN FERROVIARIA
  // ==========================================================================
  private spawnWave(): void {
    const x = this.width + 140;
    const safe = Math.floor(Math.random() * 3);

    // Segundo carril seguro ocasional para patrones variados
    const blockedCount = Math.random() < 0.42 ? 2 : 1;
    const otherLanes = [0, 1, 2].filter((l) => l !== safe);
    if (blockedCount === 1) {
      const chosen = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      const o = this.obstacleSprites[Math.floor(Math.random() * this.obstacleSprites.length)];
      this.entities.push({
        kind: "obstacle",
        sprite: o.img,
        lane: chosen,
        x,
        hMul: o.hMul,
        taken: false,
        phase: Math.random() * 6,
        isBarrier: o.isBarrier
      });
    } else {
      for (const lane of otherLanes) {
        const o = this.obstacleSprites[Math.floor(Math.random() * this.obstacleSprites.length)];
        this.entities.push({
          kind: "obstacle",
          sprite: o.img,
          lane,
          x: x + (lane === otherLanes[1] ? 28 : 0),
          hMul: o.hMul,
          taken: false,
          phase: Math.random() * 6,
          isBarrier: o.isBarrier
        });
      }
    }

    // Coleccionables en el carril seguro (o línea diagonal de regalos)
    const r = Math.random();
    if (r < 0.08 && this.sponsors.length) {
      const sp = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
      this.entities.push({
        kind: "sponsor",
        sprite: this.spriteGold,
        lane: safe,
        x: x + 35,
        hMul: 0.64,
        logo: sp.logo,
        name: sp.name,
        taken: false,
        phase: Math.random() * 6
      });
    } else if (r < 0.24) {
      this.entities.push({
        kind: "star",
        sprite: this.spriteStar,
        lane: safe,
        x: x + 35,
        hMul: 0.52,
        taken: false,
        phase: Math.random() * 6
      });
    } else if (r < 0.85) {
      const count = 2 + Math.floor(Math.random() * 3);
      const img = this.giftSprites[Math.floor(Math.random() * this.giftSprites.length)];
      for (let i = 0; i < count; i++) {
        this.entities.push({
          kind: "gift",
          sprite: img,
          lane: safe,
          x: x + 20 + i * (this.trainH * 0.68),
          hMul: 0.48,
          taken: false,
          phase: i * 0.75
        });
      }
    }
  }

  // ==========================================================================
  // ACTUALIZACIÓN
  // ==========================================================================
  private get speedScale(): number {
    return Math.max(0.82, Math.min(1.45, this.width / 1000));
  }

  private get comboMultiplier(): number {
    if (this.combo >= 15) return 4;
    if (this.combo >= 8) return 3;
    if (this.combo >= 4) return 2;
    return 1;
  }

  protected onUpdate(dt: number): void {
    this.animClock += dt;
    this.elapsed += dt;

    const turboMul = this.turbo > 0 ? 1.48 : 1;
    const currentSpeed = (this.ending ? this.speed * 0.2 : this.speed) * turboMul * this.speedScale;

    if (!this.ending) {
      this.speed = Math.min(650, 350 + this.elapsed * 6.8);
    }

    const dx = currentSpeed * dt;
    this.scrollX += dx;
    this.distance += dx / 55;

    if (this.invuln > 0) this.invuln -= dt;
    if (this.turbo > 0) {
      this.turbo = Math.max(0, this.turbo - dt);
      if (Math.random() < dt * 18) {
        this.emitWheelSparks(2, "#00E5FF");
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Puntos por distancia
    if (!this.ending) {
      const mul = (this.turbo > 0 ? 2 : 1) * this.comboMultiplier;
      this.scoreAcc += dt * 12 * mul;
      if (this.scoreAcc >= 1) {
        const add = Math.floor(this.scoreAcc);
        this.scoreAcc -= add;
        this.addScore(add);
      }
    }

    // Cambio de carril suave de la locomotora e inclinación dinámica
    const diff = this.targetLane - this.laneFloat;
    const stepLane = dt * 9.5;
    this.laneFloat += Math.abs(diff) <= stepLane ? diff : Math.sign(diff) * stepLane;
    this.trainTilt += (diff * 0.14 - this.trainTilt) * Math.min(1, dt * 14);

    // Historial de carril para que el vagón trasero siga con retardo articulado
    this.laneHistory.push({ dist: this.scrollX, lane: this.laneFloat });
    const lagPx = Math.max(120, (this.trainX - this.wagonX) * 0.88);
    const targetDist = this.scrollX - lagPx;
    while (this.laneHistory.length > 2 && this.laneHistory[1].dist < targetDist) {
      this.laneHistory.shift();
    }
    if (this.laneHistory.length >= 2) {
      const s0 = this.laneHistory[0];
      const s1 = this.laneHistory[1];
      const span = Math.max(0.001, s1.dist - s0.dist);
      const t = Math.max(0, Math.min(1, (targetDist - s0.dist) / span));
      this.wagonLaneFloat = s0.lane + (s1.lane - s0.lane) * t;
    } else {
      this.wagonLaneFloat = this.laneFloat;
    }

    // Estaciones de control cada 400 m
    if (!this.ending && this.distance >= this.nextStationDist) {
      const stName = this.stationNames[this.stationIdx % this.stationNames.length];
      this.stationIdx++;
      this.nextStationDist += 400;
      this.stations.push({
        x: this.width + 180,
        name: stName,
        passed: false
      });
    }

    // Mojones kilométricos cada 100 m
    if (!this.ending && this.distance >= this.nextMilepostDist) {
      this.trackProps.push({
        kind: "milepost",
        x: this.width + 90,
        scale: 1,
        mileNumber: this.nextMilepostDist
      });
      this.nextMilepostDist += 100;
    }

    // Semáforos y cabañas junto a la vía
    if (!this.ending) {
      this.propTimer -= dt;
      if (this.propTimer <= 0) {
        this.trackProps.push({
          kind: Math.random() < 0.62 ? "signal" : "cottage",
          x: this.width + 140,
          scale: 0.88 + Math.random() * 0.18
        });
        this.propTimer = (290 + Math.random() * 180) / (currentSpeed || 320);
      }
    }

    for (const p of this.trackProps) {
      p.x -= dx * (p.kind === "cottage" ? 0.68 : 1.0);
    }
    this.trackProps = this.trackProps.filter((p) => p.x > -240);

    // Actualizar estaciones
    for (const st of this.stations) {
      st.x -= dx;
      if (!st.passed && st.x <= this.trainX + this.trainW * 0.5) {
        st.passed = true;
        this.addScore(250);
        this.audio.playVictory();
        this.particles.emitConfetti(this.width, 35);
        this.addFloatingText(`¡${st.name}! +250 PTS`, this.width * 0.5, this.height * 0.25, "#00E676", 1.45);
      }
    }
    this.stations = this.stations.filter((st) => st.x > -320);

    // Oleadas de entidades
    if (!this.ending) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.spawnWave();
        const gapPx = 415 + Math.random() * 125;
        this.waveTimer = gapPx / (currentSpeed || 320);
      }
    }

    // Vapor volumétrico saliendo exactamente de la chimenea roja delantera
    if (Math.random() < dt * (this.turbo > 0 ? 28 : 18)) {
      const trainBottom = this.laneYAt(this.laneFloat);
      const chimneyX = this.trainX + this.trainW * 0.765;
      const chimneyY = trainBottom - this.trainH * 0.92;
      this.steam.push({
        x: chimneyX + (Math.random() - 0.5) * 6,
        y: chimneyY,
        vx: -currentSpeed * (0.42 + Math.random() * 0.14),
        vy: -42 - Math.random() * 24,
        r: 7 + Math.random() * 4,
        maxR: 24 + Math.random() * 12,
        life: 1.0,
        turboTint: this.turbo > 0
      });
    }
    for (const s of this.steam) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy *= 0.97;
      s.r = Math.min(s.maxR, s.r + dt * 18);
      s.life -= dt * 0.88;
    }
    this.steam = this.steam.filter((s) => s.life > 0);

    // Chispas de las ruedas
    for (const sp of this.sparks) {
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 260 * dt;
      sp.life -= dt;
    }
    this.sparks = this.sparks.filter((sp) => sp.life > 0);

    // Obstáculos demolidos volando por el aire
    for (const d of this.debris) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 680 * dt;
      d.rot += d.vRot * dt;
      d.alpha -= dt * 0.95;
    }
    this.debris = this.debris.filter((d) => d.alpha > 0);

    // Nieve en primer plano
    for (const f of this.snowFlakes) {
      f.x -= (f.speedX + currentSpeed * 0.35) * dt;
      f.y += f.speedY * dt;
      if (f.x < -10) f.x = this.width + 10;
      if (f.y > this.height + 10) {
        f.y = -10;
        f.x = Math.random() * this.width;
      }
    }

    // Colisiones con entidades
    const hitL = this.trainX + this.trainW * 0.14;
    const hitR = this.trainX + this.trainW * 0.95;

    for (const e of this.entities) {
      e.x -= dx;
      if (e.taken) continue;

      const eh = this.trainH * e.hMul;
      const ew = eh * (imgReady(e.sprite) ? e.sprite.naturalWidth / e.sprite.naturalHeight : 1);
      const ex1 = e.x - ew * 0.36;
      const ex2 = e.x + ew * 0.36;
      if (ex2 < hitL || ex1 > hitR) continue;
      if (Math.abs(e.lane - this.laneFloat) > 0.52) continue;

      e.taken = true;
      const sx = Math.max(hitL, Math.min(hitR, e.x));
      const sy = this.laneYs[e.lane] - this.trainH * 0.42;

      if (e.kind === "obstacle") {
        if (this.turbo > 0) {
          const pts = 120 * this.comboMultiplier;
          this.addScore(pts);
          this.audio.playElfCollectItem();
          this.triggerShake(0.12, 4);
          this.particles.emitBurst(sx, sy, "#00E5FF", 16);
          this.emitWheelSparks(12, "#00E5FF");
          this.addFloatingText(`¡DEMOLIDO! +${pts}`, sx, sy - 24, "#00E5FF", 1.25);

          // Lanzar el obstáculo por los aires girando
          this.debris.push({
            sprite: e.sprite,
            x: e.x,
            y: this.laneYs[e.lane] - eh * 0.5,
            vx: 360 + Math.random() * 220,
            vy: -320 - Math.random() * 160,
            w: ew,
            h: eh,
            rot: 0,
            vRot: (Math.random() < 0.5 ? 1 : -1) * (6 + Math.random() * 5),
            alpha: 1
          });
        } else if (this.invuln > 0) {
          e.taken = false;
        } else {
          this.onHit(sx, sy);
        }
      } else if (e.kind === "gift") {
        this.combo++;
        this.comboTimer = 4.2;
        this.giftsCollected++;
        const pts = 50 * this.comboMultiplier;
        this.addScore(pts);
        this.chargeBoiler(14);
        this.audio.playCatchItem(1.0 + Math.min(0.45, this.combo * 0.03));
        this.particles.emitBurst(sx, sy, "#FFD700", 10);
        const label = this.comboMultiplier > 1 ? `+${pts} (x${this.comboMultiplier})` : `+${pts}`;
        this.addFloatingText(label, sx, sy - 20, "#FFD700", 1.15);
      } else if (e.kind === "star") {
        this.combo += 2;
        this.comboTimer = 4.5;
        const pts = 150 * this.comboMultiplier;
        this.addScore(pts);
        this.chargeBoiler(30);
        this.audio.playPowerUp();
        this.particles.emitBurst(sx, sy, "#FFF176", 16);
        this.addFloatingText(`¡ESTRELLA! +${pts}`, sx, sy - 24, "#FFF176", 1.3);
      } else if (e.kind === "sponsor") {
        this.combo += 3;
        this.comboTimer = 5.0;
        this.addScore(300);
        this.activateTurbo(`¡TURBO ${(e.name || "MÁGICO").toUpperCase()}! +300`);
      }
    }

    this.entities = this.entities.filter((e) => e.x > -240 && !e.taken);
  }

  private chargeBoiler(amount: number): void {
    if (this.turbo > 0) return;
    this.boilerCharge = Math.min(100, this.boilerCharge + amount);
    if (this.boilerCharge >= 100) {
      this.boilerCharge = 0;
      this.activateTurbo("¡CALDERA AL MÁXIMO! ¡TURBO VAPOR!");
    }
  }

  private activateTurbo(bannerText: string): void {
    this.turbo = 4.8;
    this.boilerCharge = 100;
    this.audio.playPowerUp();
    this.triggerShake(0.22, 6);
    this.emitWheelSparks(18, "#00E5FF");
    this.particles.emitConfetti(this.width, 40);
    this.addFloatingText(bannerText, this.width * 0.5, this.height * 0.28, "#00E5FF", 1.5);
  }

  private onHit(x: number, y: number): void {
    this.lives--;
    this.invuln = 1.5;
    this.combo = 0;
    this.comboTimer = 0;
    this.boilerCharge = Math.max(0, this.boilerCharge - 35);
    this.audio.playRunnerHit();
    this.triggerShake(0.3, 9);
    this.particles.emitBurst(x, y, "#FF5252", 18);
    this.addFloatingText("¡CHOQUE EN LA VÍA!", x, y - 30, "#FF5252", 1.4);
    if (this.lives <= 0 && !this.ending) {
      this.ending = true;
      this.setGameTimeout(() => this.endGame(), 900);
    }
  }

  private laneYAt(lf: number): number {
    const clamped = Math.max(0, Math.min(2, lf));
    const lo = Math.floor(clamped);
    const hi = Math.min(2, lo + 1);
    return this.laneYs[lo] + (this.laneYs[hi] - this.laneYs[lo]) * (clamped - lo);
  }

  // ==========================================================================
  // RENDERIZADO DEL ESCENARIO Y TREN
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    this.drawBackdrop(ctx, w, h);

    // Estaciones de control en el terraplén
    for (const st of this.stations) {
      this.drawStationArch(ctx, st);
    }

    // Rieles y durmientes de las 3 vías
    for (let i = 0; i < 3; i++) {
      this.drawTrack(ctx, i, this.laneYs[i], w);
    }

    // Cono de luz del faro delantero sobre la vía activa
    this.drawHeadlightCone(ctx);

    // Ordenamiento por profundidad de carril (0 = Norte arriba, 1 = Central, 2 = Sur abajo)
    const trainNearestLane = Math.round(Math.max(0, Math.min(2, this.laneFloat)));
    const wagonNearestLane = Math.round(Math.max(0, Math.min(2, this.wagonLaneFloat)));

    for (let lane = 0; lane < 3; lane++) {
      // Entidades del carril
      for (const e of this.entities) {
        if (e.lane === lane) this.drawEntity(ctx, e);
      }
      // Si el vagón y la locomotora están en el mismo carril, dibujar acople + vagón + locomotora
      if (wagonNearestLane === lane && trainNearestLane !== lane) {
        this.drawCoupler(ctx);
        this.drawWagon(ctx);
      }
      if (trainNearestLane === lane) {
        if (wagonNearestLane === lane) {
          this.drawCoupler(ctx);
          this.drawWagon(ctx);
        }
        this.drawTrain(ctx);
      }
    }

    // Escombros de obstáculos demolidos volando
    for (const d of this.debris) {
      if (!imgReady(d.sprite)) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.drawImage(d.sprite, -d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }

    // Chispas en los rieles
    for (const sp of this.sparks) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, sp.life * 2.5);
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Vapor volumétrico de la chimenea
    for (const s of this.steam) {
      ctx.save();
      const alpha = Math.max(0, s.life) * 0.72;
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(s.x - s.r * 0.2, s.y - s.r * 0.2, s.r * 0.1, s.x, s.y, s.r);
      if (s.turboTint) {
        grad.addColorStop(0, "#FFFFFF");
        grad.addColorStop(0.55, "#B2EBF2");
        grad.addColorStop(1, "rgba(0, 229, 255, 0)");
      } else {
        grad.addColorStop(0, "#FFFFFF");
        grad.addColorStop(0.6, "#E2EEF8");
        grad.addColorStop(1, "rgba(226, 238, 248, 0)");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Copos de nieve en primer plano
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    for (const f of this.snowFlakes) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Líneas de velocidad durante el Turbo
    if (this.turbo > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 229, 255, 0.42)";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 12; i++) {
        const y = 95 + ((i * 93 + this.animClock * 40) % (h - 130));
        const x = w - ((this.animClock * 1450 + i * 211) % (w + 300));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 130 + (i % 3) * 40, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Indicadores interactivos de vía en el margen izquierdo
    this.drawTrackSelectors(ctx);

    this.particles.draw(ctx, true);

    // HUD superior: Distancia, Caldera de Vapor y Multiplicador
    this.drawTopHud(ctx, w);
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const snowTop = this.laneYs[0] - this.trainH * 0.26;

    // 1. Cielo polar nocturno
    const sky = ctx.createLinearGradient(0, 0, 0, snowTop);
    sky.addColorStop(0, "#050E26");
    sky.addColorStop(0.55, "#13295E");
    sky.addColorStop(1, "#3A68A8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, snowTop + 20);

    // 2. Estrellas titilantes
    ctx.save();
    for (const st of this.skyStars) {
      const twinkle = 0.45 + 0.55 * Math.sin(this.animClock * 2.8 + st.phase);
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = "#FFF9C4";
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Cortinas de Aurora Boreal animadas
    ctx.save();
    const auroraGrad = ctx.createLinearGradient(0, 20, 0, snowTop * 0.65);
    auroraGrad.addColorStop(0, "rgba(0, 230, 118, 0)");
    auroraGrad.addColorStop(0.45, "rgba(0, 230, 118, 0.16)");
    auroraGrad.addColorStop(0.75, "rgba(0, 229, 255, 0.14)");
    auroraGrad.addColorStop(1, "rgba(138, 43, 226, 0)");
    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.moveTo(0, snowTop * 0.55);
    for (let x = 0; x <= w; x += 40) {
      const waveY = snowTop * 0.25 + Math.sin(x * 0.008 + this.animClock * 0.9) * 22 + Math.cos(x * 0.015 - this.animClock * 0.6) * 14;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(w, snowTop * 0.65);
    ctx.lineTo(0, snowTop * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Aldea con parallax
    if (imgReady(this.bgImage)) {
      const scale = (h * 0.58) / this.bgImage.naturalHeight;
      const tw = this.bgImage.naturalWidth * scale;
      const th = this.bgImage.naturalHeight * scale;
      const off = (this.scrollX * 0.18) % tw;
      const by = snowTop + 14 - th;
      for (let x = -off; x < w; x += tw) {
        ctx.drawImage(this.bgImage, x, by, tw + 1, th);
      }
    }

    // 5. Neblina suave de transición en el horizonte nevado
    const mist = ctx.createLinearGradient(0, snowTop - 26, 0, snowTop + 22);
    mist.addColorStop(0, "rgba(218, 236, 255, 0)");
    mist.addColorStop(0.6, "rgba(225, 240, 255, 0.85)");
    mist.addColorStop(1, "#E4F0FE");
    ctx.fillStyle = mist;
    ctx.fillRect(0, snowTop - 26, w, 48);

    // 6. Campo nevado bajo las 3 vías
    const snow = ctx.createLinearGradient(0, snowTop, 0, h);
    snow.addColorStop(0, "#E4F0FE");
    snow.addColorStop(0.5, "#CCE0F8");
    snow.addColorStop(1, "#9FBCE2");
    ctx.fillStyle = snow;
    ctx.fillRect(0, snowTop, w, h - snowTop);

    // 7. Pinos en parallax medio
    if (imgReady(this.spriteTree)) {
      const treeH = this.trainH * 1.12;
      const treeW = treeH * (this.spriteTree.naturalWidth / this.spriteTree.naturalHeight);
      const spacing = treeW * 2.4;
      const off = (this.scrollX * 0.45) % spacing;
      for (let x = -off - treeW; x < w + treeW; x += spacing) {
        ctx.drawImage(this.spriteTree, x, snowTop + 10 - treeH, treeW, treeH);
      }
    }

    // 8. Props junto a la vía superior (Cabañas, Semáforos ferroviarios y Mojones kilométricos)
    for (const p of this.trackProps) {
      if (p.kind === "cottage" && imgReady(this.spriteCottage)) {
        const ch = this.trainH * 0.92 * p.scale;
        const cw = ch * (this.spriteCottage.naturalWidth / this.spriteCottage.naturalHeight);
        ctx.drawImage(this.spriteCottage, p.x - cw / 2, snowTop + 6 - ch, cw, ch);
      } else if (p.kind === "signal" && imgReady(this.spriteSignal)) {
        const sh = this.trainH * 0.96 * p.scale;
        const sw = sh * (this.spriteSignal.naturalWidth / this.spriteSignal.naturalHeight);
        const sy = snowTop + 14 - sh;
        ctx.drawImage(this.spriteSignal, p.x - sw / 2, sy, sw, sh);

        // Resplandor pulsante de la linterna del semáforo
        ctx.save();
        const pulse = 0.65 + 0.35 * Math.sin(this.animClock * 5 + p.x * 0.02);
        const glowX = p.x + sw * 0.16;
        const glowY = sy + sh * 0.3;
        const glow = ctx.createRadialGradient(glowX, glowY, 2, glowX, glowY, 24);
        glow.addColorStop(0, `rgba(0, 230, 118, ${0.7 * pulse})`);
        glow.addColorStop(1, "rgba(0, 230, 118, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(glowX, glowY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "milepost") {
        this.drawMilepost(ctx, p.x, snowTop + 14, p.mileNumber || 100);
      }
    }
  }

  private drawMilepost(ctx: CanvasRenderingContext2D, x: number, y: number, meters: number): void {
    ctx.save();
    // Poste de caramelo con cartel de distancia
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x - 3, y - 34, 6, 34);
    ctx.fillStyle = "#1E293B";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 24, y - 48, 48, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FFD700";
    ctx.font = "900 10px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${meters}m`, x, y - 39);
    ctx.restore();
  }

  private drawStationArch(ctx: CanvasRenderingContext2D, st: StationCheckpoint): void {
    const topY = this.laneYs[0] - this.trainH * 0.95;
    const botY = this.laneYs[2] + 18;
    const x = st.x;

    ctx.save();
    // Pilares de madera y latón a ambos lados del pórtico
    ctx.fillStyle = "#4E2A14";
    ctx.fillRect(x - 8, topY, 16, botY - topY);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(x - 10, topY, 20, 6);
    ctx.fillRect(x - 10, botY - 8, 20, 8);

    // Pancarta superior de la estación
    const bw = 210;
    const bh = 32;
    ctx.fillStyle = "rgba(15, 32, 64, 0.94)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, topY - bh + 4, bw, bh, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = "900 11px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(st.name, x, topY - bh / 2 + 4);
    ctx.restore();
  }

  private drawTrack(ctx: CanvasRenderingContext2D, laneIndex: number, y: number, w: number): void {
    const isTarget = this.targetLane === laneIndex;

    // 1. Terraplén de balasto y nieve con bisel 3D
    const balGrad = ctx.createLinearGradient(0, y - 12, 0, y + 22);
    balGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    balGrad.addColorStop(0.55, "rgba(195, 218, 244, 0.9)");
    balGrad.addColorStop(1, "rgba(130, 165, 208, 0.75)");
    ctx.fillStyle = balGrad;
    ctx.fillRect(0, y - 10, w, 28);

    // Sombra inferior del terraplén
    ctx.fillStyle = "rgba(75, 110, 155, 0.38)";
    ctx.fillRect(0, y + 18, w, 4);

    // Resplandor sutil en la vía seleccionada
    if (isTarget) {
      ctx.save();
      ctx.fillStyle = this.turbo > 0 ? "rgba(0, 229, 255, 0.18)" : "rgba(255, 215, 0, 0.16)";
      ctx.fillRect(0, y - 12, w, 28);
      ctx.restore();
    }

    // 2. Durmientes de madera con placas metálicas y pernos
    const spacing = 42;
    const off = this.scrollX % spacing;
    for (let x = -off; x < w; x += spacing) {
      // Sombra del durmiente
      ctx.fillStyle = "rgba(45, 25, 10, 0.35)";
      ctx.fillRect(x + 2, y - 9, 18, 22);
      // Cuerpo de madera
      ctx.fillStyle = "#5C3418";
      ctx.fillRect(x, y - 10, 18, 21);
      // Bisel iluminado superior
      ctx.fillStyle = "#8B532B";
      ctx.fillRect(x, y - 10, 18, 4);
      // Placas de sujeción de hierro
      ctx.fillStyle = "#334155";
      ctx.fillRect(x + 2, y - 9, 14, 3);
      ctx.fillRect(x + 2, y + 2, 14, 3);
    }

    // 3. Riel trasero (perspectiva)
    ctx.fillStyle = "#5A3B00";
    ctx.fillRect(0, y - 10, w, 4);
    ctx.fillStyle = "#E6AC00";
    ctx.fillRect(0, y - 9, w, 2.5);

    // 4. Riel delantero principal (latón dorado pulido)
    ctx.fillStyle = "#4A3000";
    ctx.fillRect(0, y + 1, w, 7);
    ctx.fillStyle = isTarget ? "#FFD700" : "#F4B400";
    ctx.fillRect(0, y + 2, w, 4.5);
    ctx.fillStyle = "#FFF8C8";
    ctx.fillRect(0, y + 2, w, 1.5);
  }

  private drawHeadlightCone(ctx: CanvasRenderingContext2D): void {
    const trainBottom = this.laneYAt(this.laneFloat);
    const lampX = this.trainX + this.trainW * 0.91;
    const lampY = trainBottom - this.trainH * 0.33;
    const coneLen = Math.min(this.width * 0.48, 440);

    ctx.save();
    const grad = ctx.createLinearGradient(lampX, lampY, lampX + coneLen, lampY);
    if (this.turbo > 0) {
      grad.addColorStop(0, "rgba(0, 229, 255, 0.52)");
      grad.addColorStop(0.45, "rgba(255, 215, 0, 0.24)");
      grad.addColorStop(1, "rgba(0, 229, 255, 0)");
    } else {
      grad.addColorStop(0, "rgba(255, 240, 150, 0.45)");
      grad.addColorStop(0.5, "rgba(255, 210, 80, 0.18)");
      grad.addColorStop(1, "rgba(255, 210, 80, 0)");
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(lampX, lampY - 8);
    ctx.lineTo(lampX + coneLen, lampY - 58);
    ctx.lineTo(lampX + coneLen, lampY + 54);
    ctx.lineTo(lampX, lampY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawCoupler(ctx: CanvasRenderingContext2D): void {
    if (this.wagonX + this.wagonW < 0) return;
    const trainY = this.laneYAt(this.laneFloat) - this.trainH * 0.22;
    const wagonY = this.laneYAt(this.wagonLaneFloat) - this.wagonH * 0.22;
    const x1 = this.wagonX + this.wagonW * 0.95;
    const x2 = this.trainX + this.trainW * 0.05;

    ctx.save();
    // Barra de acople de hierro y cadena dorada
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, wagonY);
    ctx.lineTo(x2, trainY);
    ctx.stroke();

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, wagonY);
    ctx.lineTo(x2, trainY);
    ctx.stroke();
    ctx.restore();
  }

  private drawWagon(ctx: CanvasRenderingContext2D): void {
    if (this.wagonX + this.wagonW < 0) return;
    const bottom = this.laneYAt(this.wagonLaneFloat) + 6;
    const bob = Math.sin(this.animClock * 18 - 1.2) * 1.3;
    const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;
    const wagonTilt = (this.laneFloat - this.wagonLaneFloat) * 0.08;

    ctx.save();
    if (blink) ctx.globalAlpha = 0.45;
    if (this.turbo > 0) {
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 18;
    }

    const cx = this.wagonX + this.wagonW * 0.5;
    const cy = bottom - this.wagonH * 0.5 + bob;
    ctx.translate(cx, cy);
    ctx.rotate(wagonTilt);

    if (imgReady(this.spriteWagon)) {
      ctx.drawImage(this.spriteWagon, -this.wagonW / 2, -this.wagonH / 2, this.wagonW, this.wagonH);
    }
    ctx.restore();
  }

  private drawTrain(ctx: CanvasRenderingContext2D): void {
    const bottom = this.laneYAt(this.laneFloat) + 6;
    const bob = Math.sin(this.animClock * 18) * 1.4;
    const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;

    ctx.save();
    if (blink) ctx.globalAlpha = 0.45;

    if (this.turbo > 0) {
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 24;
    }

    const cx = this.trainX + this.trainW * 0.5;
    const cy = bottom - this.trainH * 0.5 + bob;
    ctx.translate(cx, cy);
    ctx.rotate(this.trainTilt);

    if (imgReady(this.spriteTrain)) {
      ctx.drawImage(this.spriteTrain, -this.trainW / 2, -this.trainH / 2, this.trainW, this.trainH);
    } else {
      ctx.fillStyle = "#C62828";
      ctx.fillRect(-this.trainW / 2, -this.trainH * 0.35, this.trainW, this.trainH * 0.7);
    }

    // Escudo rompehielos energético delante del apartavacas durante el Turbo
    if (this.turbo > 0) {
      const shieldX = this.trainW * 0.49;
      const shieldY = this.trainH * 0.1;
      const pulse = 1 + Math.sin(this.animClock * 16) * 0.08;
      ctx.strokeStyle = "#00E5FF";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(shieldX - 10, shieldY, this.trainH * 0.46 * pulse, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shieldX - 4, shieldY, this.trainH * 0.52 * pulse, -Math.PI * 0.36, Math.PI * 0.36);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawEntity(ctx: CanvasRenderingContext2D, e: RunnerEntity): void {
    if (e.taken) return;
    const eh = this.trainH * e.hMul;
    const aspect = imgReady(e.sprite) ? e.sprite.naturalWidth / e.sprite.naturalHeight : 1;
    const ew = eh * aspect;
    const laneY = this.laneYs[e.lane];

    // Sombra elíptica sobre la vía
    ctx.save();
    ctx.fillStyle = "rgba(15, 28, 55, 0.32)";
    ctx.beginPath();
    ctx.ellipse(e.x, laneY + 4, ew * 0.36, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (e.kind === "obstacle") {
      if (imgReady(e.sprite)) {
        ctx.drawImage(e.sprite, e.x - ew / 2, laneY + 7 - eh, ew, eh);
      }
      // Si es una barrera ferroviaria, añadir pulso luminoso a su farol rojo superior
      if (e.isBarrier) {
        ctx.save();
        const pulse = 0.6 + 0.4 * Math.sin(this.animClock * 9 + e.phase);
        const lx = e.x - ew * 0.04;
        const ly = laneY + 7 - eh * 0.82;
        const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 22);
        g.addColorStop(0, `rgba(255, 23, 68, ${0.85 * pulse})`);
        g.addColorStop(1, "rgba(255, 23, 68, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx, ly, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    // Coleccionables flotando con balanceo y aura mágica
    const bob = Math.sin(this.animClock * 4.5 + e.phase) * 5;
    const by = laneY - this.trainH * 0.1 + bob;

    ctx.save();
    if (e.kind === "sponsor" || e.kind === "star") {
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 18;
    }
    if (imgReady(e.sprite)) {
      ctx.drawImage(e.sprite, e.x - ew / 2, by - eh, ew, eh);
    }
    ctx.restore();

    if (e.kind === "sponsor") {
      drawSponsorMedallion(ctx, e.logo, e.x, by - eh * 0.38, eh * 0.22);
    }
  }

  private drawTrackSelectors(ctx: CanvasRenderingContext2D): void {
    const labels = ["VÍA 1", "VÍA 2", "VÍA 3"];
    for (let i = 0; i < 3; i++) {
      const y = this.laneYs[i] - 3;
      const active = this.targetLane === i;
      ctx.save();
      ctx.fillStyle = active ? "rgba(255, 215, 0, 0.92)" : "rgba(12, 26, 52, 0.72)";
      ctx.strokeStyle = active ? "#FFFFFF" : "rgba(255, 215, 0, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(10, y - 12, 46, 22, 11);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = active ? "#0F172A" : "#E2E8F0";
      ctx.font = "900 10px 'Montserrat', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[i], 33, y - 1);
      ctx.restore();
    }
  }

  private drawTopHud(ctx: CanvasRenderingContext2D, w: number): void {
    // 1. Píldora central de distancia recorrida
    drawPill(ctx, `RECORRIDO ${Math.floor(this.distance)} m`, w * 0.5, 68, "#FFD700", 160);

    // 2. Medidor de Caldera de Vapor / Turbo
    const barW = 148;
    const barH = 26;
    const bx = w - barW / 2 - 20;
    const by = 68;

    ctx.save();
    ctx.fillStyle = "rgba(10, 22, 46, 0.88)";
    ctx.strokeStyle = this.turbo > 0 ? "#00E5FF" : "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - barW / 2, by - barH / 2, barW, barH, 13);
    ctx.fill();
    ctx.stroke();

    const fillPct = this.turbo > 0 ? this.turbo / 4.8 : this.boilerCharge / 100;
    const innerW = Math.max(0, (barW - 6) * Math.min(1, fillPct));
    if (innerW > 0) {
      const grad = ctx.createLinearGradient(bx - barW / 2 + 3, 0, bx + barW / 2 - 3, 0);
      if (this.turbo > 0) {
        grad.addColorStop(0, "#00B0FF");
        grad.addColorStop(1, "#00E5FF");
      } else {
        grad.addColorStop(0, "#FF8F00");
        grad.addColorStop(1, "#FFD700");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(bx - barW / 2 + 3, by - barH / 2 + 3, innerW, barH - 6, 10);
      ctx.fill();
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 10px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = this.turbo > 0 ? `TURBO VAPOR ${this.turbo.toFixed(1)}s` : `CALDERA ${Math.floor(this.boilerCharge)}%`;
    ctx.fillText(label, bx, by);
    ctx.restore();

    // 3. Píldora de Combo si hay racha activa
    if (this.comboMultiplier > 1) {
      drawPill(ctx, `RACHA x${this.comboMultiplier} (${this.combo})`, w * 0.5, 102, "#00E676", 136);
    }
  }
}
