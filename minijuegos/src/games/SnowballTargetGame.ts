/**
 * ==============================================================================
 * JUEGO: 🎯 TIRO AL BLANCO NAVIDEÑO (Snowball Carnival Target Gallery - Pro Edition)
 * ==============================================================================
 * 
 * Experiencia arcade festiva de alta producción en estilo Stylized 2D Game Concept Art:
 * - Escenario cinemático de caseta de feria navideña en alta resolución con faroles cálidos y guirnaldas.
 * - Resortera mágica interactiva con física elástica, retroceso elástico y destello de escarcha en boca de disparo.
 * - Dianas con física de bisagra real: al recibir el impacto giran hacia atrás sobre su eje y caen con rebote.
 * - Gran variedad de blancos: Dianas de caramelo, muñecos de nieve, robots de cuerda, ositos, renos dorados de jackpot y dianas de patrocinadores oficiales.
 * - Modo Fiebre Navideña (Fever Mode): Luces de marquesina animadas, bolas de nieve cometa doradas y multiplicador x2/x4.
 * - Salpicaduras de nieve con micro-gotas que chorrean suavemente y se disipan.
 * - Efectos de sonido sintetizados a 0ms de latencia: chasquido de resortera, golpe de madera en diana y campanas mágicas.
 * - Retícula / Crosshair arcade con rubí central, retroceso reactivo y anillo giratorio.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING, type LogoConfig } from "../config/branding";

export type TargetType =
  | "bullseye"        // Diana concéntrica clásica (+200)
  | "toy_robot"       // Robot mecánico en riel (+150)
  | "toy_bear"        // Osito de peluche en riel (+150)
  | "gift_box"        // Regalo festivo sorpresa (+300)
  | "sponsor_target"  // ¡Diana oficial de Patrocinador con SUPERPODER exclusivo! (+500)
  | "coal"            // Barril de carbón (-150 y rompe combo)
  | "ice_spike"       // Cristal de hielo espinoso (-200 y congela resortera)
  | "grumpy_snowman"  // Muñeco de nieve gruñón (-100 y arroja bola a la pantalla)
  | "mischievous_elf";// Elfo travieso veloz (+350 bonus al acertarle)

export interface GalleryTarget {
  id: number;
  type: TargetType;
  shelfIndex: number; // 0: Arriba, 1: Medio, 2: Abajo
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number; // Velocidad horizontal
  minX: number;
  maxX: number;
  isPeek: boolean; // ¿Se asoma y se oculta?
  peekTimer: number;
  peekDuration: number;
  peekOffset: number; // 0 = visible, 1 = completamente oculto
  isHit: boolean;
  hitTimer: number;
  hingePitch: number; // 0 a 90 grados (giro hacia atrás al ser abatida)
  wobbleAngle: number; // Oscilación elástica
  splatOnTarget?: { dx: number; dy: number; r: number };
  points: number;
  sponsorId?: string;
  wobblePhase: number;
}

export interface FlyingSnowball {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number; // 0 a 1
  flightDuration: number;
  scale: number;
  arcHeight: number;
  isSpecial: boolean;
  isFever: boolean;
  themeColor: string;
}

export interface SnowSplat {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
  splatPoints: { dx: number; dy: number; r: number; dripY: number }[];
}

export class SnowballTargetGame extends BaseGame {
  // Sprites e Ilustraciones HD
  private bgCarnivalImage: HTMLImageElement;
  private spriteSnowman: HTMLImageElement;
  private spriteTeddy: HTMLImageElement;
  private spriteRobot: HTMLImageElement;
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteCoal: HTMLImageElement;
  private spriteMedallion: HTMLImageElement;
  private spriteIceSpike: HTMLImageElement;
  private spriteElf: HTMLImageElement;

  // Estado del Juego
  private targets: GalleryTarget[] = [];
  private nextTargetId: number = 1;
  private targetSpawnTimer: number = 0;
  private flyingSnowballs: FlyingSnowball[] = [];
  private snowSplats: SnowSplat[] = [];

  // Mira / Retícula Arcade
  private crosshairX: number = 0;
  private crosshairY: number = 0;
  private crosshairVisible: boolean = false;
  private crosshairRecoil: number = 0;
  private crosshairAngle: number = 0;

  // Resortera Elástica Interactiva
  private slingshotSnapTimer: number = 0; // Rebote elástico
  private slingshotAngle: number = 0;

  // Modo Fiebre / Frenesí Navideño
  private isFeverMode: boolean = false;
  private feverTimer: number = 0;
  private readonly FEVER_DURATION: number = 5.0;
  private feverMarqueeOffset: number = 0;

  // Habilidades Especiales Exclusivas de los Patrocinadores
  private tripleShotTimer: number = 0;   // Campuslands: 3 bolas a la vez
  private slowMoTimer: number = 0;       // Cajasan: dianas al 30% de velocidad
  private giantBallTimer: number = 0;    // Practi Arepa: mega-bola con onda expansiva
  private shieldTimer: number = 0;       // Ángelus: escudo protector contra carbón/hielo
  private ultraMultTimer: number = 0;    // Factor Humano: multiplicador x3
  private magnetAimTimer: number = 0;    // Fundalas: puntería mágica teledirigida
  private activeAbilityName: string = "";
  private activeAbilityColor: string = "#FFD700";

  // Penalizaciones y Efectos de Enemigos
  private frostFreezeTimer: number = 0;  // Cristal de hielo: resortera congelada
  private cameraSplatTimer: number = 0;  // Muñeco gruñón: mancha de nieve en la pantalla
  private cameraSplatAlpha: number = 0;

  // Métricas, Combo y Puntuación
  private combo: number = 0;
  private maxCombo: number = 0;
  private hitsCount: number = 0;
  private shotsFired: number = 0;
  private perfectHits: number = 0;
  private lastShotTime: number = 0;
  private readonly SHOT_COOLDOWN: number = 0.11;

  // Repisas
  private shelfY: number[] = [0, 0, 0];
  private shelfLeft: number = 0;
  private shelfRight: number = 0;

  // Animaciones decorativas
  private lanternFlicker: number = 0;
  private ambientSnowDrift: { x: number; y: number; speed: number; size: number }[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "snowball-target",
      "Tiro al Blanco Navideño",
      "¡Apunta con la resortera mágica y derriba las dianas y regalos de la feria!",
      canvas,
      input,
      audio,
      particles
    );

    // Música festiva enérgica
    this.inGameMusicPath = "./assets/audio/We Wish You a Merry Christmas.mp3";
    this.inGameMusicVolume = 0.52;

    // Carga de Sprites HD
    this.bgCarnivalImage = this.createImage("./assets/images/fondo-tiro-al-blanco.webp");
    this.spriteSnowman = this.createImage("./assets/images/obstaculo-muneco.png");
    this.spriteTeddy = this.createImage("./assets/images/osito.png");
    this.spriteRobot = this.createImage("./assets/images/robot.png");
    this.spriteGiftRed = this.createImage("./assets/images/regalo-rojo2.png");
    this.spriteGiftGreen = this.createImage("./assets/images/regalo-verde.png");
    this.spriteCoal = this.createImage("./assets/images/carbon.png");
    this.spriteMedallion = this.createImage("./assets/images/medallon-feria.png");
    this.spriteIceSpike = this.createImage("./assets/images/obstaculo-cristal.png");
    this.spriteElf = this.createImage("./assets/images/elfo-volador.png");
  }

  private createImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  // ============================================================================
  // CICLO DE VIDA (LIFECYCLE)
  // ============================================================================

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.recalculateShelves();
    this.initAmbientSnow();
  }

  private recalculateShelves(): void {
    // Coordenadas calibradas al milímetro con el fondo ilustrado de la caseta
    this.shelfLeft = this.width * 0.22;
    this.shelfRight = this.width * 0.78;

    // 3 repisas alineadas exactamente con los rieles de madera ilustrados
    this.shelfY[0] = this.height * 0.455; // Repisa superior
    this.shelfY[1] = this.height * 0.588; // Repisa central
    this.shelfY[2] = this.height * 0.728; // Repisa inferior

    if (this.crosshairX === 0) {
      this.crosshairX = this.width / 2;
      this.crosshairY = this.height * 0.58;
    }
  }

  private initAmbientSnow(): void {
    this.ambientSnowDrift = [];
    const count = Math.min(35, Math.floor(this.width / 30));
    for (let i = 0; i < count; i++) {
      this.ambientSnowDrift.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 18 + Math.random() * 28,
        size: 1.5 + Math.random() * 2.5
      });
    }
  }

  protected onStart(): void {
    this.recalculateShelves();
    this.initAmbientSnow();
    this.targets = [];
    this.flyingSnowballs = [];
    this.snowSplats = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.hitsCount = 0;
    this.shotsFired = 0;
    this.perfectHits = 0;
    this.targetSpawnTimer = 0;
    this.lastShotTime = 0;
    this.crosshairRecoil = 0;
    this.crosshairVisible = false; // Permanece oculta hasta la primera interacción
    this.crosshairX = this.width / 2;
    this.crosshairY = this.height * 0.58;
    this.isFeverMode = false;
    this.feverTimer = 0;
    this.slingshotSnapTimer = 0;

    // Reset de Habilidades de Patrocinadores y Efectos de Enemigos
    this.tripleShotTimer = 0;
    this.slowMoTimer = 0;
    this.giantBallTimer = 0;
    this.shieldTimer = 0;
    this.ultraMultTimer = 0;
    this.magnetAimTimer = 0;
    this.activeAbilityName = "";
    this.frostFreezeTimer = 0;
    this.cameraSplatTimer = 0;
    this.cameraSplatAlpha = 0;

    // Poblar inicialmente cada repisa
    this.spawnInitialTargets();

    // Controles táctiles / puntero
    this.input.onPointerDown = (_pointerId: number, x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;
      this.crosshairX = x;
      this.crosshairY = y;
      this.crosshairVisible = true;
      this.shootSnowball(x, y);
    };

    this.input.onPointerMove = (_pointerId: number, x: number, y: number) => {
      this.crosshairX = x;
      this.crosshairY = y;
      this.crosshairVisible = true;
    };
  }

  private spawnInitialTargets(): void {
    const sw = this.shelfRight - this.shelfLeft;
    // Repisa 0 (Arriba): Diana de Patrocinador + Regalo Sorpresa
    this.spawnTargetOnShelf(0, "sponsor_target", this.shelfLeft + sw * 0.30);
    this.spawnTargetOnShelf(0, "gift_box", this.shelfLeft + sw * 0.70);

    // Repisa 1 (Medio): Diana clásica + Robot + Elfo Pillo Enemigo
    this.spawnTargetOnShelf(1, "bullseye", this.shelfLeft + sw * 0.22);
    this.spawnTargetOnShelf(1, "toy_robot", this.shelfLeft + sw * 0.50);
    this.spawnTargetOnShelf(1, "mischievous_elf", this.shelfLeft + sw * 0.78);

    // Repisa 2 (Abajo): Muñeco de nieve gruñón + Cristal de Hielo + Osito
    this.spawnTargetOnShelf(2, "grumpy_snowman", this.shelfLeft + sw * 0.26);
    this.spawnTargetOnShelf(2, "toy_bear", this.shelfLeft + sw * 0.54);
    this.spawnTargetOnShelf(2, "ice_spike", this.shelfLeft + sw * 0.82);
  }

  private spawnTargetOnShelf(shelfIndex: number, forcedType?: TargetType, fixedX?: number): void {
    const shelfY = this.shelfY[shelfIndex];

    const shelfScale = shelfIndex === 0 ? 0.78 : (shelfIndex === 1 ? 0.90 : 1.05);
    const baseSize = Math.min(this.width * 0.12, 68) * shelfScale;

    // Márgenes seguros para que nunca toquen ni invadan los pilares laterales
    const minX = this.shelfLeft + baseSize * 0.65;
    const maxX = this.shelfRight - baseSize * 0.65;

    // Posición horizontal con prevención rigurosa de solapamiento
    let x = fixedX;
    if (x === undefined) {
      const minDistance = baseSize * 1.45;
      const existingOnShelf = this.targets.filter(t => !t.isHit && t.shelfIndex === shelfIndex);

      let bestX = minX + Math.random() * (maxX - minX);
      let foundValid = false;

      // Buscar un hueco libre en la repisa
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidateX = minX + Math.random() * (maxX - minX);
        const tooClose = existingOnShelf.some(t => Math.abs(t.x - candidateX) < minDistance);
        if (!tooClose) {
          bestX = candidateX;
          foundValid = true;
          break;
        }
      }

      // Si la repisa está copada, no encimar objetivos
      if (!foundValid && existingOnShelf.length >= 3) {
        return;
      }
      x = bestX;
    }

    // Determinar tipo
    let type: TargetType = forcedType ?? "bullseye";
    if (!forcedType) {
      const roll = Math.random();
      if (this.isFeverMode) {
        // En Modo Fiebre: Abundancia de logos patrocinadores y dianas doradas
        if (roll < 0.40) type = "sponsor_target";
        else if (roll < 0.70) type = "bullseye";
        else if (roll < 0.85) type = "gift_box";
        else type = "mischievous_elf";
      } else {
        // Variedad dinámica con enemigos y patrocinadores con superpoderes
        if (roll < 0.22) type = "sponsor_target";      // ¡LOGOS CON PODERES!
        else if (roll < 0.38) type = "bullseye";        // Diana
        else if (roll < 0.48) type = "toy_robot";       // Robot
        else if (roll < 0.58) type = "toy_bear";        // Osito
        else if (roll < 0.68) type = "gift_box";        // Regalo
        else if (roll < 0.78) type = "mischievous_elf"; // Enemigo: Elfo travieso
        else if (roll < 0.86) type = "grumpy_snowman";  // Enemigo: Muñeco gruñón
        else if (roll < 0.93) type = "ice_spike";       // Enemigo: Cristal helado
        else type = "coal";                             // Enemigo: Carbón
      }
    }

    let points = 150;
    let vx = 0;
    let isPeek = false;
    let peekDuration = 2.4;
    let sponsorId: string | undefined = undefined;

    switch (type) {
      case "bullseye":
        points = 200;
        vx = (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 26);
        break;
      case "toy_robot":
      case "toy_bear":
        points = 150;
        vx = (Math.random() < 0.5 ? -1 : 1) * (28 + Math.random() * 30);
        break;
      case "gift_box":
        points = 300;
        vx = (Math.random() < 0.5 ? -1 : 1) * (36 + Math.random() * 32);
        break;
      case "sponsor_target": {
        points = 500;
        const sponsors = BRANDING.getAllSponsors();
        const randSponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
        sponsorId = randSponsor.id;
        vx = (Math.random() < 0.5 ? -1 : 1) * (24 + Math.random() * 26);
        break;
      }
      case "mischievous_elf":
        // Enemigo veloz y escurridizo que da alto bonus si lo cazas
        points = 350;
        vx = (Math.random() < 0.5 ? -1 : 1) * (58 + Math.random() * 35);
        break;
      case "grumpy_snowman":
        // Enemigo que se asoma; si no le das, arroja bola de nieve a la pantalla
        points = 220;
        isPeek = true;
        peekDuration = 1.9 + Math.random() * 0.6;
        break;
      case "ice_spike":
        // Obstáculo congelante que inhabilita temporalmente la resortera
        points = -200;
        isPeek = true;
        peekDuration = 2.4;
        break;
      case "coal":
        // Barril de carbón que rompe combo
        points = -150;
        isPeek = true;
        peekDuration = 2.6;
        break;
    }

    this.targets.push({
      id: this.nextTargetId++,
      type,
      shelfIndex,
      x,
      y: shelfY,
      width: baseSize,
      height: baseSize,
      vx,
      minX,
      maxX,
      isPeek,
      peekTimer: peekDuration,
      peekDuration,
      peekOffset: isPeek ? 1.0 : 0.0,
      isHit: false,
      hitTimer: 0,
      hingePitch: 0,
      wobbleAngle: 0,
      points,
      sponsorId,
      wobblePhase: Math.random() * Math.PI * 2
    });
  }

  // ============================================================================
  // FÍSICA Y DISPARO
  // ============================================================================

  private shootSnowball(targetX: number, targetY: number): void {
    const now = Date.now() / 1000;
    if (now - this.lastShotTime < this.SHOT_COOLDOWN) return;

    // Si la resortera está congelada por cristal de hielo
    if (this.frostFreezeTimer > 0) {
      this.playWoodClackSound(220);
      this.triggerShake(0.12, 3);
      this.addFloatingText("¡RESORTERA CONGELADA!", this.width / 2, this.height * 0.85, "#00E5FF", 1.3);
      return;
    }

    this.lastShotTime = now;
    this.shotsFired++;
    this.crosshairRecoil = 1.0;
    this.slingshotSnapTimer = 0.22; // Dispara retroceso elástico de la resortera

    // Sonido de disparo (Whip / Snap elástico)
    this.playSlingshotSound();

    const startX = this.width / 2;
    const startY = this.height * 0.91 - 24;

    // Calcular ángulo de apuntado de la resortera
    this.slingshotAngle = Math.atan2(targetX - startX, startY - targetY);

    const isGiant = this.giantBallTimer > 0;
    const themeColor = this.isFeverMode
      ? "#FFD700"
      : (isGiant ? "#FF9100" : (this.activeLogo ? this.activeLogo.themeColor : "#FFFFFF"));

    // Disparo principal
    this.createFlyingBall(startX, startY, targetX, targetY, isGiant, themeColor);

    // Habilidad Triple Disparo (Campuslands)
    if (this.tripleShotTimer > 0) {
      const spreadX = Math.min(100, this.width * 0.12);
      this.createFlyingBall(startX, startY, targetX - spreadX, targetY - 10, false, "#00E5FF");
      this.createFlyingBall(startX, startY, targetX + spreadX, targetY - 10, false, "#00E5FF");
    }

    // Destello de escarcha en la boca de la resortera
    this.particles.emitBurst(startX, startY - 25, themeColor, 8);
  }

  private createFlyingBall(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    isGiant: boolean,
    themeColor: string
  ): void {
    this.flyingSnowballs.push({
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0,
      flightDuration: isGiant ? 0.18 : 0.15,
      scale: isGiant ? 2.2 : 1.0,
      arcHeight: Math.min(85, Math.abs(targetY - startY) * 0.20),
      isSpecial: this.activeLogo !== null || isGiant,
      isFever: this.isFeverMode,
      themeColor
    });
  }

  protected onUpdate(dt: number): void {
    this.lanternFlicker += dt * 3.8;
    this.crosshairAngle += dt * 2.5;
    this.crosshairRecoil = Math.max(0, this.crosshairRecoil - dt * 5.5);
    this.feverMarqueeOffset += dt * 40;

    // Temporizador de retroceso elástico de la resortera
    if (this.slingshotSnapTimer > 0) {
      this.slingshotSnapTimer -= dt;
      if (this.slingshotSnapTimer < 0) this.slingshotSnapTimer = 0;
    }

    // Modo Fiebre / Frenesí
    if (this.isFeverMode) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.isFeverMode = false;
        this.feverTimer = 0;
      }
    }

    // Actualizar temporizadores de Superpoderes de Patrocinadores
    if (this.tripleShotTimer > 0) this.tripleShotTimer = Math.max(0, this.tripleShotTimer - dt);
    if (this.slowMoTimer > 0) this.slowMoTimer = Math.max(0, this.slowMoTimer - dt);
    if (this.giantBallTimer > 0) this.giantBallTimer = Math.max(0, this.giantBallTimer - dt);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.ultraMultTimer > 0) this.ultraMultTimer = Math.max(0, this.ultraMultTimer - dt);
    if (this.magnetAimTimer > 0) this.magnetAimTimer = Math.max(0, this.magnetAimTimer - dt);

    // Actualizar penalizaciones de enemigos
    if (this.frostFreezeTimer > 0) this.frostFreezeTimer = Math.max(0, this.frostFreezeTimer - dt);
    if (this.cameraSplatTimer > 0) {
      this.cameraSplatTimer = Math.max(0, this.cameraSplatTimer - dt);
      this.cameraSplatAlpha = Math.max(0, this.cameraSplatTimer / 1.3);
    }

    // Copos de nieve ambiente
    for (const flake of this.ambientSnowDrift) {
      flake.y += flake.speed * dt;
      flake.x += Math.sin(flake.y * 0.04) * 0.5;
      if (flake.y > this.height) {
        flake.y = -10;
        flake.x = Math.random() * this.width;
      }
    }

    // 1. Bolas de Nieve en Vuelo
    for (let i = this.flyingSnowballs.length - 1; i >= 0; i--) {
      const ball = this.flyingSnowballs[i];

      // Auto-aim magnético (Fundalas)
      if (this.magnetAimTimer > 0) {
        let nearestTarget: GalleryTarget | null = null;
        let minDist = 180;
        for (const tg of this.targets) {
          if (tg.isHit || (tg.isPeek && tg.peekOffset > 0.5)) continue;
          const d = Math.hypot(ball.currentX - tg.x, ball.currentY - tg.y);
          if (d < minDist) {
            minDist = d;
            nearestTarget = tg;
          }
        }
        if (nearestTarget) {
          ball.targetX += (nearestTarget.x - ball.targetX) * dt * 4.5;
          ball.targetY += (nearestTarget.y - ball.targetY) * dt * 4.5;
        }
      }

      ball.progress += dt / ball.flightDuration;

      if (ball.progress >= 1.0) {
        this.flyingSnowballs.splice(i, 1);
        this.handleSnowballImpact(ball.targetX, ball.targetY, ball.isSpecial || ball.isFever, ball.themeColor);
      } else {
        const t = ball.progress;
        ball.currentX = ball.startX + (ball.targetX - ball.startX) * t;
        const linearY = ball.startY + (ball.targetY - ball.startY) * t;
        const arc = Math.sin(t * Math.PI) * ball.arcHeight;
        ball.currentY = linearY - arc;
        ball.scale = (ball.scale > 1.5 ? 2.3 : 1.38) - t * 0.68; // Perspectiva

        // Ráfaga cometa de chispas
        if (ball.isFever || ball.isSpecial) {
          this.particles.emitTouchTrail(ball.currentX, ball.currentY, 2);
        }
      }
    }

    // 2. Objetivos y Física de Bisagra al ser Abatidos
    const slowMoMultiplier = this.slowMoTimer > 0 ? 0.35 : 1.0;
    const targetDt = dt * slowMoMultiplier;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.wobblePhase += dt * 3.2;

      if (t.isHit) {
        t.hitTimer += dt;
        // Gira hacia atrás sobre su eje inferior (0° a 90°)
        t.hingePitch = Math.min(90, t.hingePitch + dt * 280);
        // Oscilación lateral amortiguada
        t.wobbleAngle = Math.sin(t.hitTimer * 24) * Math.exp(-t.hitTimer * 7) * 18;
        // Una vez abatida, cae hacia abajo
        if (t.hingePitch >= 80) {
          t.y += dt * 320;
        }
        if (t.hitTimer > 0.48) {
          this.targets.splice(i, 1);
        }
        continue;
      }

      // Peeking
      if (t.isPeek) {
        t.peekTimer -= targetDt;
        if (t.peekTimer <= 0) {
          // Si es muñeco gruñón y no fue impactado antes de ocultarse, arroja nieve a la lente
          if (t.type === "grumpy_snowman" && t.peekOffset < 0.2 && this.cameraSplatTimer <= 0) {
            this.cameraSplatTimer = 1.3;
            this.cameraSplatAlpha = 1.0;
            this.playWoodClackSound(280);
            this.triggerShake(0.18, 5);
            this.addFloatingText("¡EL MUÑECO TE SALPICÓ!", this.width / 2, this.height * 0.42, "#FFEA00", 1.4);
          }

          t.peekOffset = Math.min(1.0, t.peekOffset + targetDt * 4.2);
          if (t.peekOffset >= 1.0) {
            this.targets.splice(i, 1);
            continue;
          }
        } else {
          t.peekOffset = Math.max(0.0, t.peekOffset - targetDt * 4.2);
        }
      }

      // Movimiento horizontal en rieles
      if (t.vx !== 0) {
        t.x += t.vx * targetDt;
        if (t.x <= t.minX) {
          t.x = t.minX;
          t.vx = Math.abs(t.vx);
        } else if (t.x >= t.maxX) {
          t.x = t.maxX;
          t.vx = -Math.abs(t.vx);
        }

        // Evitar que dos dianas activas en el mismo riel choquen o se encimen (rebote mecánico)
        for (const other of this.targets) {
          if (other === t || other.isHit || other.shelfIndex !== t.shelfIndex) continue;
          const minDist = (t.width + other.width) * 0.52;
          const dist = t.x - other.x;
          if (Math.abs(dist) < minDist) {
            if (dist > 0 && t.vx < 0) {
              t.vx = Math.abs(t.vx);
              other.vx = -Math.abs(other.vx);
            } else if (dist < 0 && t.vx > 0) {
              t.vx = -Math.abs(t.vx);
              other.vx = Math.abs(other.vx);
            }
          }
        }
      }
    }

    // 3. Spawner de Dianas (Dinámico con Frenesí)
    this.targetSpawnTimer += dt;
    const maxTargets = this.isFeverMode ? 8 : (this.width < 500 ? 5 : 7);
    const spawnInterval = this.isFeverMode ? 0.65 : (this.timeRemaining < 15 ? 0.85 : 1.2);

    if (this.targetSpawnTimer >= spawnInterval && this.targets.filter(t => !t.isHit).length < maxTargets) {
      this.targetSpawnTimer = 0;
      const counts = [0, 0, 0];
      for (const t of this.targets) {
        if (!t.isHit) counts[t.shelfIndex]++;
      }
      let minShelf = 0;
      if (counts[1] < counts[minShelf]) minShelf = 1;
      if (counts[2] < counts[minShelf]) minShelf = 2;

      this.spawnTargetOnShelf(minShelf);
    }

    // 4. Salpicaduras de nieve con chorreo
    for (let i = this.snowSplats.length - 1; i >= 0; i--) {
      const splat = this.snowSplats[i];
      splat.alpha -= dt * 0.9;
      for (const p of splat.splatPoints) {
        p.dripY += dt * 8; // Chorreo suave hacia abajo
      }
      if (splat.alpha <= 0) {
        this.snowSplats.splice(i, 1);
      }
    }
  }

  /**
   * Resuelve el impacto de la bola de nieve con física de diana abatible
   */
  private handleSnowballImpact(x: number, y: number, isSpecial: boolean, themeColor: string): void {
    const isGiant = this.giantBallTimer > 0;
    const hitRadius = isGiant ? 95 : (isSpecial ? 58 : 46);

    this.createSnowSplat(x, y, isSpecial ? themeColor : "#FFFFFF");
    this.particles.emitBurst(x, y, isSpecial ? themeColor : "#FFFFFF", isGiant ? 35 : (isSpecial ? 24 : 14));

    // Si es mega-bola gigante (Practi Arepa), puede abatir múltiples dianas en el radio
    const hitTargets: GalleryTarget[] = [];
    for (const target of this.targets) {
      if (target.isHit) continue;
      if (target.isPeek && target.peekOffset > 0.6) continue;

      const targetCenterY = target.y - target.height * 0.46 * (1 - target.peekOffset);
      const dx = x - target.x;
      const dy = y - targetCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const effectiveRadius = (target.width / 2) + hitRadius * 0.65;
      if (dist < effectiveRadius) {
        hitTargets.push(target);
        if (!isGiant) break; // Si no es mega-bola, solo impacta a una
      }
    }

    if (hitTargets.length > 0) {
      for (const t of hitTargets) {
        this.resolveTargetHit(t, x, y);
      }
    } else {
      // Impacto en madera / fondo sin diana
      this.playWoodClackSound(400);
      this.combo = 0;
    }
  }

  private resolveTargetHit(target: GalleryTarget, hitX: number, hitY: number): void {
    target.isHit = true;
    target.hitTimer = 0;
    const localSplatY = hitY - (target.y - target.height * 0.5 * (1 - target.peekOffset));
    target.splatOnTarget = {
      dx: Math.max(-target.width * 0.38, Math.min(target.width * 0.38, hitX - target.x)),
      dy: Math.max(-target.height * 0.38, Math.min(target.height * 0.38, localSplatY)),
      r: 12 + Math.random() * 6
    };
    this.hitsCount++;

    const hasShield = this.shieldTimer > 0;

    // 1. IMPACTO EN ENEMIGOS Y OBSTÁCULOS
    if (target.type === "coal") {
      if (hasShield) {
        this.addScore(200);
        this.addFloatingText("¡ESCUDO ÁNGELUS! +200", hitX, hitY - 35, "#38BDF8", 1.4);
        this.particles.emitBurst(hitX, hitY, "#38BDF8", 18);
        this.playBellDingSound();
      } else {
        this.combo = 0;
        this.isFeverMode = false;
        this.addScore(target.points);
        this.triggerShake(0.30, 9);
        this.audio.playError();
        this.addFloatingText("¡CARBÓN! -150", hitX, hitY - 35, "#FF3366", 1.4);
        this.particles.emitBurst(hitX, hitY, "#222222", 22);
      }
      return;
    }

    if (target.type === "ice_spike") {
      if (hasShield) {
        this.addScore(250);
        this.addFloatingText("¡ESCUDO ÁNGELUS! +250", hitX, hitY - 35, "#38BDF8", 1.4);
        this.particles.emitBurst(hitX, hitY, "#38BDF8", 20);
        this.playBellDingSound();
      } else {
        this.combo = 0;
        this.frostFreezeTimer = 0.85; // Congela temporalmente la resortera
        this.addScore(target.points);
        this.triggerShake(0.35, 10);
        this.playWoodClackSound(200);
        this.addFloatingText("¡HIELO! -200 (CONGELADO)", hitX, hitY - 35, "#00E5FF", 1.4);
        this.particles.emitBurst(hitX, hitY, "#80D8FF", 25);
      }
      return;
    }

    if (target.type === "grumpy_snowman") {
      this.combo++;
      this.addScore(target.points);
      this.playWoodClackSound(600);
      this.addFloatingText("¡MUÑECO DESARMADO! +220", hitX, hitY - 35, "#FFD700", 1.4);
      this.particles.emitBurst(hitX, hitY, "#FFFFFF", 20);
      return;
    }

    if (target.type === "mischievous_elf") {
      this.combo += 2;
      this.addScore(target.points);
      this.playBellDingSound();
      this.addFloatingText("¡ELFO ATRAPADO! +350", hitX, hitY - 35, "#00E676", 1.5);
      this.particles.emitBurst(hitX, hitY, "#00E676", 26);
      this.particles.emitConfetti(this.width, 30);
      return;
    }

    // 2. ¡DIANA DE PATROCINADOR OFICIAL CON SUPERPODER EXCLUSIVO!
    if (target.type === "sponsor_target") {
      this.combo += 2;
      const sponsorKey = target.sponsorId || "feria";
      const sponsor = BRANDING.getLogoConfig(sponsorKey);
      const mult = this.getComboMultiplier();
      const basePoints = target.points * mult;
      this.addScore(basePoints);

      this.triggerLogoPowerUp(sponsor.id, 8);
      this.triggerShake(0.20, 6);
      this.playBellDingSound();
      this.particles.emitBurst(hitX, hitY, sponsor.themeColor, 35);
      this.particles.emitConfetti(this.width, 40);

      this.activateSponsorSuperpower(sponsor, hitX, hitY);
      return;
    }

    // 3. DIANAS CLÁSICAS (Bullseye, Robots, Ositos, Regalos)
    this.playWoodClackSound(650);

    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Si llega a combo 5+, activar MODO FIEBRE
    if (this.combo === 5 && !this.isFeverMode) {
      this.activateFeverMode();
    }

    let mult = this.getComboMultiplier();
    if (this.ultraMultTimer > 0) mult *= 3; // Superpoder Factor Humano

    let pts = target.points * mult;

    // Diana perfecta en el centro
    let isBullseyeCenter = false;
    if (target.type === "bullseye") {
      const distCenter = Math.abs(hitX - target.x);
      if (distCenter < target.width * 0.24) {
        isBullseyeCenter = true;
        this.perfectHits++;
        pts += 150 * mult;
        this.playBellDingSound();
      }
    }

    this.addScore(pts);
    this.audio.playCatchItem(1.0 + Math.min(1.0, this.combo * 0.09));

    const tagText = isBullseyeCenter ? `¡DIANA PERFECTA! +${pts}` : `+${pts}`;
    const color = isBullseyeCenter ? "#FFD700" : (mult > 1 ? "#00E5FF" : "#FFFFFF");
    this.addFloatingText(tagText, hitX, hitY - 35, color, isBullseyeCenter ? 1.5 : 1.25);

    if (this.combo > 1 && this.combo % 4 === 0) {
      this.particles.emitConfetti(this.width, 22);
      this.addFloatingText(`¡RACHA x${this.combo}!`, this.width / 2, this.height * 0.36, "#FFD700", 1.6);
    }
  }

  private activateSponsorSuperpower(sponsor: LogoConfig, hitX: number, hitY: number): void {
    this.activeAbilityColor = sponsor.themeColor;

    switch (sponsor.id) {
      case "logo-feria":
      case "feria":
        this.activateFeverMode();
        this.activeAbilityName = "🔥 FIEBRE FERIA MÁGICA";
        this.addFloatingText("🔥 ¡MODO FIEBRE INSTANTÁNEO!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-campus":
      case "campus":
        this.tripleShotTimer = 5.0;
        this.activeAbilityName = "⚡ TRIPLE DISPARO TECH";
        this.addFloatingText("⚡ ¡TRIPLE DISPARO ACTIVADO!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-cajasan":
      case "cajasan":
        this.slowMoTimer = 4.5;
        this.activeAbilityName = "❄️ SLOW-MO DIANAS";
        this.addFloatingText("❄️ ¡DIANAS RALENTIZADAS!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-practi":
      case "practi":
        this.giantBallTimer = 5.0;
        this.activeAbilityName = "💣 MEGA-BOLA EXPLOSIVA";
        this.addFloatingText("💣 ¡MEGA BOLA GIGANTE!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-mariposa":
      case "mariposa":
        this.timeRemaining += 3.0;
        this.activeAbilityName = "⏱️ +3s TIEMPO EXTRA";
        this.addFloatingText("🍬 ¡DULCES +3 SEGUNDOS!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        this.particles.emitConfetti(this.width, 35);
        break;

      case "logo-angelus":
      case "angelus":
        this.shieldTimer = 5.0;
        this.activeAbilityName = "🛡️ ESCUDO TOTAL";
        this.addFloatingText("🛡️ ¡ESCUDO ANTI-CARBÓN!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-factor":
      case "factor":
        this.ultraMultTimer = 4.5;
        this.activeAbilityName = "💥 MULTIPLICADOR x3";
        this.addFloatingText("💥 ¡PUNTOS TRIPLES x3!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-fundalas":
      case "fundalas":
        this.magnetAimTimer = 5.0;
        this.activeAbilityName = "🎯 PUNTERÍA MÁGICA";
        this.addFloatingText("🎯 ¡AUTO-PUNTERÍA MÁGICA!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        break;

      case "logo-imebu":
      case "imebu":
      default:
        this.addScore(750);
        this.activeAbilityName = "💰 ORO EMPRENDEDOR";
        this.addFloatingText("💰 ¡BONUS IMEBU +750!", hitX, hitY - 50, sponsor.themeColor, 1.6);
        this.particles.emitConfetti(this.width, 45);
        break;
    }
  }

  private activateFeverMode(): void {
    this.isFeverMode = true;
    this.feverTimer = this.FEVER_DURATION;
    this.audio.playPowerUp();
    this.triggerShake(0.26, 7);
    this.particles.emitConfetti(this.width, 45);
    this.addFloatingText("🔥 ¡FIEBRE NAVIDEÑA! x2 🔥", this.width / 2, this.height * 0.40, "#FFD700", 1.75);
  }

  private getComboMultiplier(): number {
    const powerMult = this.activeLogo ? 2 : 1;
    const feverMult = this.isFeverMode ? 2 : 1;
    let base = 1;
    if (this.combo >= 12) base = 4;
    else if (this.combo >= 8) base = 3;
    else if (this.combo >= 4) base = 2;
    return base * powerMult * feverMult;
  }

  private createSnowSplat(x: number, y: number, color: string): void {
    const points: { dx: number; dy: number; r: number; dripY: number }[] = [];
    const count = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 24;
      points.push({
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist,
        r: 3 + Math.random() * 6,
        dripY: 0
      });
    }

    this.snowSplats.push({
      x,
      y,
      radius: 18 + Math.random() * 9,
      alpha: 0.95,
      color,
      splatPoints: points
    });

    if (this.snowSplats.length > 25) {
      this.snowSplats.shift();
    }
  }

  // ============================================================================
  // AUDIO SINTETIZADO DE ALTA RESPUESTA (0ms Latencia)
  // ============================================================================

  private playSlingshotSound(): void {
    if (this.audio.getIsMuted()) return;
    try {
      const ctx = (this.audio as any).ctx as AudioContext | undefined;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  private playWoodClackSound(baseFreq: number = 550): void {
    if (this.audio.getIsMuted()) return;
    try {
      const ctx = (this.audio as any).ctx as AudioContext | undefined;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  private playBellDingSound(): void {
    if (this.audio.getIsMuted()) return;
    try {
      const ctx = (this.audio as any).ctx as AudioContext | undefined;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // La6
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.26, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  // ============================================================================
  // RENDERIZADO VISUAL
  // ============================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    // 1. Fondo de la Caseta de Feria en Alta Producción
    if (this.bgCarnivalImage && this.bgCarnivalImage.complete && this.bgCarnivalImage.naturalWidth > 0) {
      ctx.drawImage(this.bgCarnivalImage, 0, 0, w, h);
    } else {
      // Fallback procedural con degradado
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#1A0E08");
      bgGrad.addColorStop(0.5, "#3D1F0D");
      bgGrad.addColorStop(1, "#1A0E08");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Efecto de resplandor del Modo Fiebre en el fondo
    if (this.isFeverMode) {
      const feverAura = ctx.createRadialGradient(w / 2, h * 0.45, 40, w / 2, h * 0.45, w * 0.7);
      feverAura.addColorStop(0, "rgba(255, 215, 0, 0.25)");
      feverAura.addColorStop(0.6, "rgba(255, 69, 0, 0.15)");
      feverAura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = feverAura;
      ctx.fillRect(0, 0, w, h);
    }

    // 1.5. GUIRNALDA DE ESCUDOS CON LOGOS DE PATROCINADORES EN LA PARED TRASERA
    this.drawBackgroundSponsorBanner(ctx);

    // 2. Nieve ambiente cayendo en la caseta
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (const flake of this.ambientSnowDrift) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Salpicaduras de nieve en la pared posterior
    this.drawSnowSplats(ctx);

    // 4. Objetivos y Dianas
    this.drawTargets(ctx);

    // 5. Marco frontal de la caseta (Toldo festivo, luces de marquesina y mostrador)
    this.drawCarnivalMarquee(ctx);

    // 6. Bolas de Nieve en vuelo
    this.drawFlyingSnowballs(ctx);

    // 7. Resortera elástica interactiva en el mostrador inferior
    this.drawAnimatedSlingshot(ctx);

    // 8. Retícula / Crosshair arcade
    this.drawCrosshair(ctx);

    // 8.5. Mancha de nieve en la cámara si el muñeco de nieve gruñón te salpicó
    if (this.cameraSplatTimer > 0 && this.cameraSplatAlpha > 0.05) {
      this.drawCameraSnowSplat(ctx);
    }

    // 9. HUD de Racha, Fiebre y Superpoderes
    this.drawTargetHUD(ctx);
  }

  private drawCarnivalMarquee(ctx: CanvasRenderingContext2D): void {
    // El fondo ilustrado ya tiene bombillas colgantes integradas.
    // En Modo Fiebre proyectamos un barrido de resplandor festivo dinámico en la marquesina superior.
    if (!this.isFeverMode) return;

    const w = this.width;
    const h = this.height;

    ctx.save();
    const marqueeColors = ["#FF1744", "#FFEA00", "#00E676", "#00E5FF", "#D500F9"];
    const bulbCount = Math.min(22, Math.floor(w / 40));
    const awningY = Math.min(68, h * 0.11);

    for (let i = 0; i < bulbCount; i++) {
      const bx = (i / (bulbCount - 1)) * (w - 30) + 15;
      const by = awningY + Math.sin(i * 0.5 + this.feverMarqueeOffset * 0.12) * 3;
      const colorIdx = Math.floor((i + this.feverMarqueeOffset * 0.12) % marqueeColors.length);
      const color = marqueeColors[Math.abs(colorIdx)];

      // Resplandor cálido festivo de fiesta
      const halo = ctx.createRadialGradient(bx, by, 2, bx, by, 24);
      halo.addColorStop(0, color);
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(bx, by, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Banderines y medallones con los logos de los patrocinadores en el fondo de la caseta
   */
  private drawBackgroundSponsorBanner(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const sponsors = BRANDING.getAllSponsors();
    const count = sponsors.length;
    if (count === 0) return;

    ctx.save();

    // 1. Cuerda festiva de pino verde que cruza la pared trasera de madera
    const startX = w * 0.15;
    const endX = w * 0.85;
    const baseY = h * 0.285;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(46, 125, 50, 0.75)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const x = startX + (endX - startX) * t;
      const sag = Math.sin(t * Math.PI) * (h * 0.038);
      const y = baseY + sag;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Micro bombillas de hadas doradas en la cuerda
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = startX + (endX - startX) * t;
      const y = baseY + Math.sin(t * Math.PI) * (h * 0.038);
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 6);
      glow.addColorStop(0, i % 2 === 0 ? "#FFD700" : "#FF6D00");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Medallones de madera con los logos nítidos de los patrocinadores
    const step = (endX - startX) / (count - 1);
    const badgeR = Math.min(24, Math.max(16, w * 0.024));

    for (let i = 0; i < count; i++) {
      const sp = sponsors[i];
      const t = i / (count - 1);
      const bx = startX + step * i;
      const by = baseY + Math.sin(t * Math.PI) * (h * 0.038) + badgeR * 0.85;

      const isCurrentActive = this.activeLogo && this.activeLogo.id === sp.id;

      // Cadenita o lazo rojo que suspende el escudo
      ctx.strokeStyle = "#C62828";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by - badgeR * 1.35);
      ctx.lineTo(bx, by - badgeR);
      ctx.stroke();

      // Halo pulsante si ese patrocinador está activo con superpoder
      if (isCurrentActive) {
        const halo = ctx.createRadialGradient(bx, by, badgeR * 0.4, bx, by, badgeR * 1.8);
        halo.addColorStop(0, sp.themeColor);
        halo.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(bx, by, badgeR * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Base del escudo de madera caoba tallada
      ctx.fillStyle = "#3E2723";
      ctx.beginPath();
      ctx.arc(bx, by, badgeR + 3, 0, Math.PI * 2);
      ctx.fill();

      // Borde de oro
      ctx.strokeStyle = isCurrentActive ? "#FFD700" : "rgba(255, 215, 0, 0.85)";
      ctx.lineWidth = isCurrentActive ? 3.5 : 2;
      ctx.stroke();

      // Fondo blanco puro para máxima legibilidad del logo
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fill();

      // Imagen del logo oficial
      const img = this.getSponsorImage(sp.id);
      if (img && img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / img.naturalHeight;
        const maxW = badgeR * 1.5;
        const maxH = badgeR * 1.3;
        let dw = maxW;
        let dh = maxW / aspect;
        if (dh > maxH) {
          dh = maxH;
          dw = maxH * aspect;
        }
        ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
      } else {
        ctx.font = `bold ${Math.round(badgeR * 0.7)}px sans-serif`;
        ctx.fillStyle = sp.themeColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sp.shortName.charAt(0), bx, by);
      }

      // Pequeño copo de nieve decorativo encima del escudo
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(bx, by - badgeR + 1, badgeR * 0.75, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawTargets(ctx: CanvasRenderingContext2D): void {
    for (const target of this.targets) {
      ctx.save();
      // Trasladar al eje inferior de la diana para simular giro sobre bisagra
      ctx.translate(target.x, target.y);

      // Efecto 3D de abatimiento sobre la bisagra
      if (target.isHit) {
        const pitchRad = (target.hingePitch * Math.PI) / 180;
        const scaleY = Math.max(0.05, Math.cos(pitchRad));
        ctx.scale(1.0, scaleY);
        ctx.rotate((target.wobbleAngle * Math.PI) / 180);
      } else {
        ctx.rotate((Math.sin(target.wobblePhase) * 2.5 * Math.PI) / 180);
      }

      ctx.translate(0, -(target.height * 0.5) * (1 - target.peekOffset));

      // Clip si está en Peeking
      if (target.isPeek && target.peekOffset > 0) {
        ctx.beginPath();
        ctx.rect(-target.width, -target.height * 1.5, target.width * 2, target.height * (1.5 - target.peekOffset));
        ctx.clip();
      }

      switch (target.type) {
        case "bullseye":
          this.drawBullseyeTarget(ctx, target);
          break;
        case "toy_robot":
          this.drawSpriteTarget(ctx, target, this.spriteRobot);
          break;
        case "toy_bear":
          this.drawSpriteTarget(ctx, target, this.spriteTeddy);
          break;
        case "gift_box":
          this.drawSpriteTarget(ctx, target, target.id % 2 === 0 ? this.spriteGiftRed : this.spriteGiftGreen);
          break;
        case "sponsor_target":
          this.drawSponsorTarget(ctx, target);
          break;
        case "coal":
          this.drawCoalTarget(ctx, target);
          break;
        case "ice_spike":
          this.drawIceSpikeTarget(ctx, target);
          break;
        case "grumpy_snowman":
          this.drawGrumpySnowmanTarget(ctx, target);
          break;
        case "mischievous_elf":
          this.drawMischievousElfTarget(ctx, target);
          break;
      }

      // Si fue impactada, dibujar la mancha de nieve sobre ella
      if (target.splatOnTarget) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(target.splatOnTarget.dx, target.splatOnTarget.dy, target.splatOnTarget.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawBullseyeTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const r = target.width / 2;

    // Poste vertical y bisagra metálica
    ctx.strokeStyle = "#8D6E63";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(0, r + 18);
    ctx.stroke();

    // Bisagra de latón
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-6, r + 8, 12, 6);

    // Diana concéntrica estilo festivo
    const rings = [
      { radius: r, color: "#D32F2F" },
      { radius: r * 0.78, color: "#FFFFFF" },
      { radius: r * 0.54, color: "#D32F2F" },
      { radius: r * 0.30, color: "#FFD700" }
    ];

    for (const ring of rings) {
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `bold ${Math.round(r * 0.44)}px sans-serif`;
    ctx.fillStyle = "#5D4037";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⭐", 0, 0);
  }

  private drawSpriteTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget, sprite: HTMLImageElement): void {
    const size = target.width;
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      // Sombra sutil de contacto que asienta el juguete limpiamente sobre el riel
      ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
      ctx.beginPath();
      ctx.ellipse(0, size * 0.48, size * 0.38, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }
  }

  private drawIceSpikeTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width;

    // Resplandor helado peligroso
    const halo = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 0.8);
    halo.addColorStop(0, "rgba(0, 229, 255, 0.6)");
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    if (this.spriteIceSpike && this.spriteIceSpike.complete && this.spriteIceSpike.naturalWidth > 0) {
      ctx.drawImage(this.spriteIceSpike, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = "#80D8FF";
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size * 0.35, size * 0.4);
      ctx.lineTo(-size * 0.35, size * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    // Insignia estilizada de hielo
    ctx.save();
    ctx.fillStyle = "rgba(128, 222, 234, 0.90)";
    ctx.beginPath();
    ctx.arc(0, -size * 0.45, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.45 - 5);
    ctx.lineTo(4, -size * 0.45);
    ctx.lineTo(0, -size * 0.45 + 5);
    ctx.lineTo(-4, -size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawGrumpySnowmanTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const w = target.width * 1.18;
    const h = target.height * 1.28;

    if (this.spriteSnowman && this.spriteSnowman.complete && this.spriteSnowman.naturalWidth > 0) {
      ctx.drawImage(this.spriteSnowman, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 8, target.width * 0.4, 0, Math.PI * 2);
      ctx.arc(0, -14, target.width * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Insignia estilizada de enfado/peligro
    ctx.save();
    ctx.fillStyle = "#D50000";
    ctx.beginPath();
    ctx.arc(0, -h * 0.50, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 11px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", 0, -h * 0.50);
    ctx.restore();
  }

  private drawMischievousElfTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width * 1.15;

    // Destello de velocidad
    ctx.strokeStyle = "rgba(0, 230, 118, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, 0);
    ctx.lineTo(size * 0.6, 0);
    ctx.stroke();

    if (this.spriteElf && this.spriteElf.complete && this.spriteElf.naturalWidth > 0) {
      ctx.drawImage(this.spriteElf, -size / 2, -size / 2, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }

    // Insignia estilizada de velocidad
    ctx.save();
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, -size * 0.48, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#E65100";
    ctx.beginPath();
    ctx.moveTo(1, -size * 0.48 - 5);
    ctx.lineTo(-3, -size * 0.48);
    ctx.lineTo(0, -size * 0.48);
    ctx.lineTo(-1, -size * 0.48 + 5);
    ctx.lineTo(3, -size * 0.48);
    ctx.lineTo(0, -size * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawSponsorTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const r = target.width / 2;
    const sponsor = target.sponsorId ? BRANDING.getLogoConfig(target.sponsorId) : BRANDING.getLogoConfig("feria");
    const sponsorImg = this.getSponsorImage(sponsor.id);

    // Poste vertical y bisagra mecánica sobre el riel
    ctx.strokeStyle = "#8D6E63";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(0, r + 16);
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-6, r + 6, 12, 6);

    const halo = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.5);
    halo.addColorStop(0, sponsor.themeColor);
    halo.addColorStop(0.7, "rgba(255, 255, 255, 0.4)");
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = sponsor.themeColor;
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, 0, r - 3.5, 0, Math.PI * 2);
    ctx.stroke();

    const imgToDraw = (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0)
      ? sponsorImg
      : (this.spriteMedallion.complete && this.spriteMedallion.naturalWidth > 0 ? this.spriteMedallion : null);

    if (imgToDraw) {
      const nw = imgToDraw.naturalWidth;
      const nh = imgToDraw.naturalHeight;
      const aspect = nw / nh;
      const maxW = r * 1.45;
      const maxH = r * 1.25;
      let dw = maxW;
      let dh = maxW / aspect;
      if (dh > maxH) {
        dh = maxH;
        dw = maxH * aspect;
      }
      ctx.drawImage(imgToDraw, -dw / 2, -dh / 2, dw, dh);
    } else {
      ctx.font = `bold ${Math.round(r * 0.7)}px sans-serif`;
      ctx.fillStyle = sponsor.themeColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", 0, 0);
    }

    ctx.fillStyle = sponsor.themeColor;
    ctx.beginPath();
    ctx.roundRect(-25, r - 10, 50, 18, 6);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("x2 BONUS", 0, r - 1);
  }

  private drawCoalTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width;
    if (this.spriteCoal && this.spriteCoal.complete && this.spriteCoal.naturalWidth > 0) {
      ctx.drawImage(this.spriteCoal, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = "#1E1E1E";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FF3366";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Insignia estilizada de peligro
    ctx.save();
    ctx.fillStyle = "#FF3D00";
    ctx.beginPath();
    ctx.arc(0, -size * 0.42, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 12px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✕", 0, -size * 0.42);
    ctx.restore();
  }

  private drawFlyingSnowballs(ctx: CanvasRenderingContext2D): void {
    for (const ball of this.flyingSnowballs) {
      const radius = 19 * ball.scale;

      ctx.save();

      // Sombra en perspectiva
      ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
      ctx.beginPath();
      ctx.ellipse(ball.currentX, ball.currentY + radius * 1.5, radius * 1.25, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura cometa si es especial o fiebre
      if (ball.isSpecial || ball.isFever) {
        const glow = ctx.createRadialGradient(ball.currentX, ball.currentY, radius * 0.3, ball.currentX, ball.currentY, radius * 2.4);
        glow.addColorStop(0, ball.themeColor);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ball.currentX, ball.currentY, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bola de nieve con volumen 3D
      const ballGrad = ctx.createRadialGradient(
        ball.currentX - radius * 0.35,
        ball.currentY - radius * 0.35,
        radius * 0.2,
        ball.currentX,
        ball.currentY,
        radius
      );
      ballGrad.addColorStop(0, "#FFFFFF");
      ballGrad.addColorStop(0.7, "#E2EEF8");
      ballGrad.addColorStop(1, "#A8C8E6");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.currentX, ball.currentY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawSnowSplats(ctx: CanvasRenderingContext2D): void {
    for (const splat of this.snowSplats) {
      ctx.save();
      ctx.globalAlpha = splat.alpha;
      ctx.fillStyle = splat.color;

      ctx.beginPath();
      ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
      ctx.fill();

      for (const p of splat.splatPoints) {
        ctx.beginPath();
        ctx.arc(splat.x + p.dx, splat.y + p.dy + p.dripY, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Resortera interactiva con física elástica animada apoyada en el mostrador
   */
  private drawAnimatedSlingshot(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;
    const cy = this.height * 0.91;

    ctx.save();
    ctx.translate(cx, cy);

    // Oscilación de retroceso
    const recoilY = Math.sin(this.slingshotSnapTimer * 32) * Math.exp(-this.slingshotSnapTimer * 8) * 16;
    const recoilRot = (this.slingshotAngle * 0.35);
    ctx.rotate(recoilRot);

    const forkW = Math.min(58, this.width * 0.12);
    const forkH = 58;

    // Horquilla de madera tallada con remates dorados
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#5D4037";
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, -14);
    ctx.lineTo(-forkW / 2, -forkH);
    ctx.moveTo(0, -14);
    ctx.lineTo(forkW / 2, -forkH);
    ctx.stroke();

    // Vetas doradas de adorno
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(-forkW / 2, -forkH, 5.5, 0, Math.PI * 2);
    ctx.arc(forkW / 2, -forkH, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bandas elásticas rojas y parche de cuero
    const pouchX = 0;
    const pouchY = -24 + recoilY;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#E53935";
    ctx.beginPath();
    ctx.moveTo(-forkW / 2, -forkH);
    ctx.lineTo(pouchX, pouchY);
    ctx.lineTo(forkW / 2, -forkH);
    ctx.stroke();

    // Parche de cuero con la siguiente bola de nieve lista
    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.roundRect(pouchX - 9, pouchY - 5, 18, 10, 3);
    ctx.fill();

    // Bola de nieve cargada con resplandor
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(pouchX, pouchY - 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Efecto de escarcha si la resortera está congelada
    if (this.frostFreezeTimer > 0) {
      ctx.fillStyle = "rgba(128, 222, 234, 0.55)";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -22, forkW * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E0F7FA";
      ctx.font = "900 13px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("¡CONGELADO!", 0, -22);
    }

    ctx.restore();
  }

  /**
   * Mancha cómica de nieve en la lente de la cámara cuando el muñeco de nieve gruñón ataca
   */
  private drawCameraSnowSplat(ctx: CanvasRenderingContext2D): void {
    const cx = this.width * 0.44;
    const cy = this.height * 0.48;
    ctx.save();
    ctx.globalAlpha = this.cameraSplatAlpha * 0.94;

    // Mancha blanca central
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();

    // Gotas y salpicaduras con chorreo
    const drips = [
      { dx: -35, dy: -20, r: 22, drip: 18 },
      { dx: 40, dy: -15, r: 25, drip: 22 },
      { dx: -18, dy: 42, r: 24, drip: 36 },
      { dx: 26, dy: 38, r: 23, drip: 30 },
      { dx: -50, dy: 14, r: 15, drip: 14 },
      { dx: 48, dy: 20, r: 16, drip: 16 }
    ];
    for (const d of drips) {
      ctx.beginPath();
      ctx.arc(cx + d.dx, cy + d.dy + d.drip * (1 - this.cameraSplatAlpha), d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#FF1744";
    ctx.font = "900 17px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("¡LENTE MANCHADA!", cx, cy + 85);

    ctx.restore();
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D): void {
    if (!this.crosshairVisible) return;

    const x = this.crosshairX;
    const y = this.crosshairY;
    const baseR = 26 + this.crosshairRecoil * 14;

    ctx.save();
    ctx.translate(x, y);

    // Anillo giratorio punteado
    ctx.save();
    ctx.rotate(this.crosshairAngle);
    ctx.strokeStyle = this.isFeverMode ? "#FFD700" : "#00E5FF";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, baseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4 miras cardinales de latón
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    const tickLen = 9;
    ctx.beginPath();
    ctx.moveTo(0, -baseR - tickLen);
    ctx.lineTo(0, -baseR + 4);
    ctx.moveTo(0, baseR - 4);
    ctx.lineTo(0, baseR + tickLen);
    ctx.moveTo(-baseR - tickLen, 0);
    ctx.lineTo(-baseR + 4, 0);
    ctx.moveTo(baseR - 4, 0);
    ctx.lineTo(baseR + tickLen, 0);
    ctx.stroke();

    // Rubí central
    ctx.fillStyle = "#FF1744";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private drawTargetHUD(ctx: CanvasRenderingContext2D): void {
    const badgeX = this.width / 2;
    const badgeY = 82;

    ctx.save();
    ctx.translate(badgeX, badgeY);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 0. Banner de Superpoder Activo de Patrocinador
    const activePowerTime = Math.max(
      this.tripleShotTimer,
      this.slowMoTimer,
      this.giantBallTimer,
      this.shieldTimer,
      this.ultraMultTimer,
      this.magnetAimTimer
    );
    if (activePowerTime > 0 && this.activeAbilityName) {
      const bannerW = 250;
      const bannerH = 36;
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = this.activeAbilityColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.font = "900 14px 'Outfit', sans-serif";
      ctx.fillStyle = this.activeAbilityColor;
      ctx.fillText(`${this.activeAbilityName} (${Math.ceil(activePowerTime)}s)`, 0, 0);
      ctx.restore();
      return;
    }

    // 1. Banner de Fiebre Navideña
    if (this.isFeverMode) {
      const bannerW = 220;
      const bannerH = 38;
      ctx.fillStyle = "rgba(211, 47, 47, 0.92)";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 19);
      ctx.fill();
      ctx.stroke();

      ctx.font = "900 15px 'Outfit', sans-serif";
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`★ ¡FIEBRE! (x${this.getComboMultiplier()}) - ${Math.ceil(this.feverTimer)}s ★`, 0, 0);
      ctx.restore();
      return;
    }

    // 2. Banner de Combo Normal
    if (this.combo >= 2) {
      const mult = this.getComboMultiplier();
      const isSpecial = this.activeLogo !== null;
      const color = isSpecial ? this.activeLogo!.themeColor : (mult >= 4 ? "#FF1744" : (mult >= 3 ? "#FF9100" : "#FFD700"));

      ctx.fillStyle = "rgba(10, 20, 36, 0.88)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-85, -18, 170, 36, 18);
      ctx.fill();
      ctx.stroke();

      ctx.font = "900 16px 'Outfit', sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(`RACHA x${this.combo}  (x${mult})`, 0, 0);
    }

    ctx.restore();
  }

  public override destroy(): void {
    super.destroy();
    this.targets = [];
    this.flyingSnowballs = [];
    this.snowSplats = [];
    this.crosshairVisible = false;
  }
}
