/**
 * ==============================================================================
 * JUEGO: 🎯 TIRO AL BLANCO NAVIDEÑO (Snowball Carnival Target Gallery - Pro Deluxe)
 * ==============================================================================
 * 
 * Experiencia arcade festiva de alta producción en estilo Stylized 2D Game Concept Art:
 * - Galería de feria navideña en carrusel continuo: NUNCA se detiene ni se queda vacía.
 *   Los blancos fluyen sin cesar en rieles cinéticos y repisas mecánicas.
 * - Gran elenco de enemigos y blancos festivos:
 *   * Muñecos de Nieve Lanzadores (wind-up con advertencia de bola de nieve a la pantalla)
 *   * Elfos Traviesos hiper-ágiles con fintas y bonus
 *   * Duendes del Hielo que intentan escarchar objetivos
 *   * Piñatas Doradas de Jackpot (multi-hit de 2 toques con lluvia de monedas)
 *   * Galletas de Jengibre saltarinas y Relojes Mágicos de Tiempo Extra
 *   * Dianas concéntricas clásicas, Robots de cuerda, Ositos y Regalos sorpresa
 * - SUPERPODERES ESPECTACULARES DE PATROCINADORES:
 *   * ⚡ CAMPUSLANDS: Metralladora de Plasma de Nieve (Ráfaga continua hiper-rápida)
 *   * ❄️ CAJASAN: Ventisca Glacial (Congela todo y desata explosiones de hielo en cadena)
 *   * 💣 PRACTI AREPA: Super-Mortero de Santa (Mega-explosión que limpia la pantalla)
 *   * 🦋 DULCES MARIPOSA: Reloj de Hadas (+5s y Dulce Frenesí x2)
 *   * 🛡️ ÁNGELUS SEGURIDAD: Escudo Angelical (Purifica carbón e hielo en regalos)
 *   * 💥 FACTOR HUMANO: Ultra-Multiplicador Cósmico x4
 *   * 🎯 FUNDALAS: Puntería Rúnica Divina con Ricochet Teledirigido
 *   * 💰 IMEBU: Lluvia Dorada de Monedas y Jackpot Emprendedor
 * - Retícula rúnica arcade con auto-bloqueo magnético y resortera elástica con destellos.
 * - Sonidos sintetizados ultra-reactivos a 0ms de latencia.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING, type LogoConfig } from "../config/branding";

export type TargetType =
  | "bullseye"        // Diana concéntrica clásica (+200)
  | "toy_robot"       // Robot de hojalata (+180)
  | "toy_bear"        // Osito de peluche (+180)
  | "gift_box"        // Regalo festivo sorpresa (+300)
  | "pinata_star"     // Piñata festiva de jackpot (2 HP, +600)
  | "gingerbread"     // Galleta de jengibre saltarina (+250)
  | "magic_clock"     // Reloj dorado mágico (+5s tiempo extra!)
  | "sponsor_target"  // Diana oficial de Patrocinador con SUPERPODER
  | "mischievous_elf" // Elfo travieso veloz (+400)
  | "grumpy_snowman"  // Muñeco de nieve lanzador (arroja bola si no se abate a tiempo)
  | "ice_goblin"      // Duende del hielo pillo (+320)
  | "ice_spike"       // Cristal de hielo congelante (-150)
  | "coal";           // Barril de carbón (-150)

export interface GalleryTarget {
  id: number;
  type: TargetType;
  shelfIndex: number; // 0: Superior, 1: Media, 2: Inferior
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  hp: number;
  maxHp: number;
  isPeek: boolean;
  peekTimer: number;
  peekDuration: number;
  peekOffset: number; // 0 = visible, 1 = oculto
  attackTimer?: number; // Para muñeco gruñón
  isHit: boolean;
  hitTimer: number;
  hingePitch: number; // 0 a 90 grados
  wobbleAngle: number;
  splatOnTarget?: { dx: number; dy: number; r: number };
  points: number;
  sponsorId?: string;
  wobblePhase: number;
  bobPhase: number;
  isFrozen?: boolean;
}

export interface FlyingSnowball {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number;
  flightDuration: number;
  scale: number;
  arcHeight: number;
  isSpecial: boolean;
  isFever: boolean;
  isGatling?: boolean;
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

export interface LightningArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  color: string;
}

export class SnowballTargetGame extends BaseGame {
  // Sprites e Ilustraciones 2D Stylized
  private bgCarnivalImage: HTMLImageElement;
  private spriteSnowman: HTMLImageElement;
  private spriteSnowmanAttack: HTMLImageElement;
  private spriteTeddy: HTMLImageElement;
  private spriteRobot: HTMLImageElement;
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteGiftGold: HTMLImageElement;
  private spriteCoal: HTMLImageElement;
  private spriteMedallion: HTMLImageElement;
  private spriteIceSpike: HTMLImageElement;
  private spriteElf: HTMLImageElement;
  private spriteElfAttack: HTMLImageElement;
  private spriteDuendeHielo: HTMLImageElement;
  private spritePinata: HTMLImageElement;
  private spriteClock: HTMLImageElement;
  private spriteGingerbread: HTMLImageElement;
  private spriteRocket: HTMLImageElement;

  // Estado del Mundo
  private targets: GalleryTarget[] = [];
  private nextTargetId: number = 1;
  private targetSpawnTimer: number = 0;
  private flyingSnowballs: FlyingSnowball[] = [];
  private snowSplats: SnowSplat[] = [];
  private lightningArcs: LightningArc[] = [];

  // Mira / Retícula Rúnica Arcade
  private crosshairX: number = 0;
  private crosshairY: number = 0;
  private crosshairVisible: boolean = false;
  private crosshairRecoil: number = 0;
  private crosshairAngle: number = 0;

  // Resortera Elástica Interactiva
  private slingshotSnapTimer: number = 0;
  private slingshotAngle: number = 0;
  private rapidFireTimer: number = 0;

  // Modo Fiebre / Frenesí Navideño
  private isFeverMode: boolean = false;
  private feverTimer: number = 0;
  private readonly FEVER_DURATION: number = 5.5;
  private feverMarqueeOffset: number = 0;

  // SUPERPODERES ESPECTACULARES DE PATROCINADORES
  private gatlingTimer: number = 0;         // Campuslands: Ráfaga de plasma continuo
  private blizzardFreezeTimer: number = 0;  // Cajasan: Ventisca y explosión en cadena
  private megaMortarTimer: number = 0;      // Practi Arepa: Mortero gigante de Santa
  private fairyTimeTimer: number = 0;       // Dulces Mariposa: Reloj de hadas + bono
  private divineShieldTimer: number = 0;    // Ángelus Seguridad: Escudo purificador
  private cosmicMultTimer: number = 0;      // Factor Humano: Multiplicador x4
  private arcaneAimTimer: number = 0;       // Fundalas: Puntería rúnica teledirigida
  private activeAbilityName: string = "";
  private activeAbilityColor: string = "#FFD700";

  // Penalizaciones y Efectos de Enemigos
  private frostFreezeTimer: number = 0;     // Resortera congelada por cristal
  private cameraSplatTimer: number = 0;     // Muñeco gruñón: mancha en la pantalla
  private cameraSplatAlpha: number = 0;

  // Sistema de Oleadas Especiales (Rush Waves)
  private rushEventTimer: number = 0;
  private currentRushBanner: string = "";
  private rushBannerTimer: number = 0;

  // Métricas, Combo y Puntuación
  private combo: number = 0;
  private maxCombo: number = 0;
  private hitsCount: number = 0;
  private shotsFired: number = 0;
  private perfectHits: number = 0;
  private lastShotTime: number = 0;

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
      "¡Tiro al Blanco Navideño!",
      "¡Dispara con la resortera mágica! Abate juguetes, muñecos y dianas con superpoderes.",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Up on the Housetop.mp3";
    this.inGameMusicVolume = 0.46;

    // Carga de Sprites 100% WebP Oficiales
    this.bgCarnivalImage = this.getImage("./assets/images/fondo-tiro-al-blanco.webp");
    this.spriteSnowman = this.getImage("./assets/images/snowman-evil-1.webp");
    this.spriteSnowmanAttack = this.getImage("./assets/images/snowman-evil-attack.webp");
    this.spriteTeddy = this.getImage("./assets/images/osito.webp");
    this.spriteRobot = this.getImage("./assets/images/robot.webp");
    this.spriteGiftRed = this.getImage("./assets/images/regalo-estilizado-rojo.webp");
    this.spriteGiftGreen = this.getImage("./assets/images/regalo-estilizado-verde.webp");
    this.spriteGiftGold = this.getImage("./assets/images/regalo-estilizado-dorado.webp");
    this.spriteCoal = this.getImage("./assets/images/carbon.webp");
    this.spriteMedallion = this.getImage("./assets/images/medallon-feria.webp");
    this.spriteIceSpike = this.getImage("./assets/images/obstaculo-cristal.webp");
    this.spriteElf = this.getImage("./assets/images/elf-mischief-1.webp");
    this.spriteElfAttack = this.getImage("./assets/images/elf-mischief-attack.webp");
    this.spriteDuendeHielo = this.getImage("./assets/images/duende-hielo.webp");
    this.spritePinata = this.getImage("./assets/images/pinata-estrella.webp");
    this.spriteClock = this.getImage("./assets/images/reloj-magico-tiempo.webp");
    this.spriteGingerbread = this.getImage("./assets/images/galleta-jengibre.webp");
    this.spriteRocket = this.getImage("./assets/images/cohete-navideno.webp");
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.recalculateShelves();
  }

  private recalculateShelves(): void {
    this.shelfLeft = this.width * 0.20;
    this.shelfRight = this.width * 0.80;

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
    const count = Math.min(45, Math.floor(this.width / 25));
    for (let i = 0; i < count; i++) {
      this.ambientSnowDrift.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 20 + Math.random() * 30,
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
    this.lightningArcs = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.hitsCount = 0;
    this.shotsFired = 0;
    this.perfectHits = 0;
    this.targetSpawnTimer = 0;
    this.lastShotTime = 0;
    this.crosshairRecoil = 0;
    this.crosshairVisible = false;
    this.crosshairX = this.width / 2;
    this.crosshairY = this.height * 0.58;
    this.isFeverMode = false;
    this.feverTimer = 0;
    this.slingshotSnapTimer = 0;
    this.rapidFireTimer = 0;
    this.rushEventTimer = 0;
    this.currentRushBanner = "";
    this.rushBannerTimer = 0;

    // Reset de Superpoderes
    this.gatlingTimer = 0;
    this.blizzardFreezeTimer = 0;
    this.megaMortarTimer = 0;
    this.fairyTimeTimer = 0;
    this.divineShieldTimer = 0;
    this.cosmicMultTimer = 0;
    this.arcaneAimTimer = 0;
    this.activeAbilityName = "";
    this.frostFreezeTimer = 0;
    this.cameraSplatTimer = 0;
    this.cameraSplatAlpha = 0;

    // Poblado continuo inicial
    this.spawnInitialTargets();

    // Controles táctiles / puntero reactivos
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

  /**
   * Poblado balanceado de inicio: 8 blancos vibrantes distribuidos
   */
  private spawnInitialTargets(): void {
    const sw = this.shelfRight - this.shelfLeft;
    // Repisa 0 (Arriba): Reloj Mágico + Galleta + Medallón Patrocinador
    this.spawnTargetOnShelf(0, "magic_clock", this.shelfLeft + sw * 0.22);
    this.spawnTargetOnShelf(0, "sponsor_target", this.shelfLeft + sw * 0.50);
    this.spawnTargetOnShelf(0, "gingerbread", this.shelfLeft + sw * 0.78);

    // Repisa 1 (Medio): Diana clásica + Piñata Dorada + Duende del Hielo
    this.spawnTargetOnShelf(1, "bullseye", this.shelfLeft + sw * 0.20);
    this.spawnTargetOnShelf(1, "pinata_star", this.shelfLeft + sw * 0.50);
    this.spawnTargetOnShelf(1, "ice_goblin", this.shelfLeft + sw * 0.80);

    // Repisa 2 (Abajo): Muñeco de Nieve Lanzador + Elfo Travieso + Regalo
    this.spawnTargetOnShelf(2, "grumpy_snowman", this.shelfLeft + sw * 0.25);
    this.spawnTargetOnShelf(2, "gift_box", this.shelfLeft + sw * 0.55);
    this.spawnTargetOnShelf(2, "mischievous_elf", this.shelfLeft + sw * 0.82);
  }

  /**
   * Genera un objetivo dinámicamente en una repisa
   */
  private spawnTargetOnShelf(shelfIndex: number, forcedType?: TargetType, fixedX?: number): void {
    const shelfY = this.shelfY[shelfIndex];
    const shelfScale = shelfIndex === 0 ? 0.80 : (shelfIndex === 1 ? 0.92 : 1.05);
    const baseSize = Math.min(this.width * 0.12, 68) * shelfScale;

    const minX = this.shelfLeft + baseSize * 0.55;
    const maxX = this.shelfRight - baseSize * 0.55;

    let x = fixedX;
    if (x === undefined) {
      // Si el carrusel de riel está activo, generar desde los extremos de la pantalla
      if (shelfIndex === 0) {
        // Repisa 0 avanza de Izquierda a Derecha
        x = minX - 30;
      } else if (shelfIndex === 1) {
        // Repisa 1 avanza de Derecha a Izquierda
        x = maxX + 30;
      } else {
        // Repisa 2 es de pop-up / emboscada
        const candidateX = minX + Math.random() * (maxX - minX);
        const existingOnShelf = this.targets.filter(t => !t.isHit && t.shelfIndex === shelfIndex);
        const tooClose = existingOnShelf.some(t => Math.abs(t.x - candidateX) < baseSize * 1.3);
        if (tooClose && existingOnShelf.length >= 3) return;
        x = candidateX;
      }
    }

    // Selección rica y variada de blancos
    let type: TargetType = forcedType ?? "bullseye";
    if (!forcedType) {
      const roll = Math.random();
      if (this.isFeverMode) {
        if (roll < 0.35) type = "sponsor_target";
        else if (roll < 0.55) type = "pinata_star";
        else if (roll < 0.75) type = "magic_clock";
        else if (roll < 0.90) type = "gingerbread";
        else type = "mischievous_elf";
      } else {
        if (roll < 0.18) type = "sponsor_target";      // ¡Superpoderes de marcas!
        else if (roll < 0.30) type = "grumpy_snowman";  // Enemigo atacante
        else if (roll < 0.42) type = "ice_goblin";      // Duende helado
        else if (roll < 0.52) type = "mischievous_elf"; // Elfo veloz
        else if (roll < 0.62) type = "pinata_star";     // Piñata 2-hit jackpot
        else if (roll < 0.70) type = "magic_clock";     // Reloj +5s
        else if (roll < 0.78) type = "gingerbread";     // Jengibre
        else if (roll < 0.86) type = "gift_box";        // Regalo
        else if (roll < 0.93) type = "bullseye";        // Diana concéntrica
        else if (roll < 0.97) type = "ice_spike";       // Obstáculo congelante
        else type = "coal";                             // Obstáculo carbón
      }
    }

    let points = 200;
    let vx = 0;
    let isPeek = false;
    let peekDuration = 2.4;
    let sponsorId: string | undefined = undefined;
    let hp = 1;

    switch (type) {
      case "bullseye":
        points = 200;
        vx = (shelfIndex === 1 ? -1 : 1) * (35 + Math.random() * 25);
        break;
      case "toy_robot":
      case "toy_bear":
        points = 180;
        vx = (shelfIndex === 1 ? -1 : 1) * (30 + Math.random() * 25);
        break;
      case "gift_box":
        points = 300;
        vx = (shelfIndex === 1 ? -1 : 1) * (40 + Math.random() * 25);
        break;
      case "pinata_star":
        points = 600;
        hp = 2; // Requiere 2 toques
        vx = (shelfIndex === 1 ? -1 : 1) * 28;
        break;
      case "gingerbread":
        points = 250;
        vx = (shelfIndex === 1 ? -1 : 1) * (45 + Math.random() * 30);
        break;
      case "magic_clock":
        points = 350;
        vx = 55 + Math.random() * 25; // Flota velozmente en la repisa superior
        break;
      case "sponsor_target": {
        points = 500;
        const sponsors = BRANDING.getAllSponsors();
        const randSponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
        sponsorId = randSponsor.id;
        vx = (shelfIndex === 1 ? -1 : 1) * (32 + Math.random() * 24);
        break;
      }
      case "mischievous_elf":
        points = 400;
        vx = (Math.random() < 0.5 ? -1 : 1) * (65 + Math.random() * 35);
        break;
      case "grumpy_snowman":
        points = 250;
        isPeek = true;
        peekDuration = 2.4;
        break;
      case "ice_goblin":
        points = 320;
        vx = (Math.random() < 0.5 ? -1 : 1) * (42 + Math.random() * 24);
        break;
      case "ice_spike":
        points = -150;
        isPeek = true;
        peekDuration = 2.6;
        break;
      case "coal":
        points = -150;
        isPeek = true;
        peekDuration = 2.8;
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
      hp,
      maxHp: hp,
      isPeek,
      peekTimer: peekDuration,
      peekDuration,
      peekOffset: isPeek ? 1.0 : 0.0,
      attackTimer: type === "grumpy_snowman" ? 2.2 : undefined,
      isHit: false,
      hitTimer: 0,
      hingePitch: 0,
      wobbleAngle: 0,
      points,
      sponsorId,
      wobblePhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,
      isFrozen: this.blizzardFreezeTimer > 0
    });
  }

  // ============================================================================
  // FÍSICA Y DISPARO
  // ============================================================================

  private shootSnowball(targetX: number, targetY: number): void {
    const now = Date.now() / 1000;
    const cooldown = this.gatlingTimer > 0 ? 0.075 : (this.isFeverMode ? 0.09 : 0.11);
    if (now - this.lastShotTime < cooldown) return;

    if (this.frostFreezeTimer > 0) {
      this.playWoodClackSound(220);
      this.triggerShake(0.12, 3);
      this.addFloatingText("¡RESORTERA CONGELADA!", this.width / 2, this.height * 0.85, "#00E5FF", 1.3);
      return;
    }

    this.lastShotTime = now;
    this.shotsFired++;
    this.crosshairRecoil = 1.0;
    this.slingshotSnapTimer = 0.22;

    this.playSlingshotSound();

    const startX = this.width / 2;
    const startY = this.height * 0.91 - 24;

    this.slingshotAngle = Math.atan2(targetX - startX, startY - targetY);

    const isMega = this.megaMortarTimer > 0;
    const isGatling = this.gatlingTimer > 0;
    const themeColor = this.isFeverMode
      ? "#FFD700"
      : (isMega ? "#FF6D00" : (isGatling ? "#00E5FF" : (this.activeLogo ? this.activeLogo.themeColor : "#FFFFFF")));

    // 1. Disparo principal
    this.createFlyingBall(startX, startY, targetX, targetY, isMega, themeColor, isGatling);

    // 2. Disparo Gatling / Triple continuo (Campuslands)
    if (isGatling) {
      const spread = Math.min(85, this.width * 0.10);
      this.createFlyingBall(startX, startY, targetX - spread, targetY - 12, false, "#00E5FF", true);
      this.createFlyingBall(startX, startY, targetX + spread, targetY - 12, false, "#00E5FF", true);
    }

    // Destello de escarcha en boca de resortera
    this.particles.emitBurst(startX, startY - 25, themeColor, isMega ? 20 : (isGatling ? 14 : 8));
  }

  private createFlyingBall(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    isMega: boolean,
    themeColor: string,
    isGatling: boolean = false
  ): void {
    this.flyingSnowballs.push({
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0,
      flightDuration: isMega ? 0.19 : (isGatling ? 0.11 : 0.14),
      scale: isMega ? 2.6 : (isGatling ? 1.2 : 1.35),
      arcHeight: Math.min(85, Math.abs(targetY - startY) * 0.18),
      isSpecial: this.activeLogo !== null || isMega || isGatling,
      isFever: this.isFeverMode,
      isGatling,
      themeColor
    });
  }

  protected onUpdate(dt: number): void {
    this.lanternFlicker += dt * 3.8;
    this.crosshairAngle += dt * 2.8;
    this.crosshairRecoil = Math.max(0, this.crosshairRecoil - dt * 5.5);
    this.feverMarqueeOffset += dt * 45;

    // Disparo continuo al mantener pulsado (Gatling o Modo Fiebre)
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown && (this.gatlingTimer > 0 || this.isFeverMode)) {
      this.rapidFireTimer += dt;
      if (this.rapidFireTimer >= (this.gatlingTimer > 0 ? 0.08 : 0.10)) {
        this.rapidFireTimer = 0;
        this.crosshairX = pointer.x;
        this.crosshairY = pointer.y;
        this.crosshairVisible = true;
        this.shootSnowball(pointer.x, pointer.y);
      }
    } else {
      this.rapidFireTimer = 0;
    }

    if (this.slingshotSnapTimer > 0) {
      this.slingshotSnapTimer = Math.max(0, this.slingshotSnapTimer - dt);
    }

    // Modo Fiebre
    if (this.isFeverMode) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.isFeverMode = false;
        this.feverTimer = 0;
      }
    }

    // Temporizadores de Superpoderes Épicos
    if (this.gatlingTimer > 0) this.gatlingTimer = Math.max(0, this.gatlingTimer - dt);
    if (this.blizzardFreezeTimer > 0) this.blizzardFreezeTimer = Math.max(0, this.blizzardFreezeTimer - dt);
    if (this.megaMortarTimer > 0) this.megaMortarTimer = Math.max(0, this.megaMortarTimer - dt);
    if (this.fairyTimeTimer > 0) this.fairyTimeTimer = Math.max(0, this.fairyTimeTimer - dt);
    if (this.divineShieldTimer > 0) this.divineShieldTimer = Math.max(0, this.divineShieldTimer - dt);
    if (this.cosmicMultTimer > 0) this.cosmicMultTimer = Math.max(0, this.cosmicMultTimer - dt);
    if (this.arcaneAimTimer > 0) this.arcaneAimTimer = Math.max(0, this.arcaneAimTimer - dt);

    // Penalizaciones
    if (this.frostFreezeTimer > 0) this.frostFreezeTimer = Math.max(0, this.frostFreezeTimer - dt);
    if (this.cameraSplatTimer > 0) {
      this.cameraSplatTimer = Math.max(0, this.cameraSplatTimer - dt);
      this.cameraSplatAlpha = Math.max(0, this.cameraSplatTimer / 1.3);
    }

    // Banner de oleada especial
    if (this.rushBannerTimer > 0) {
      this.rushBannerTimer = Math.max(0, this.rushBannerTimer - dt);
      if (this.rushBannerTimer <= 0) this.currentRushBanner = "";
    }

    // Oleadas especiales cada 14 segundos (Ráfagas dinámicas)
    this.rushEventTimer += dt;
    if (this.rushEventTimer >= 14.0) {
      this.rushEventTimer = 0;
      this.triggerRushEvent();
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

    // Rayos de escarcha / arcos mágicos
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      this.lightningArcs[i].life -= dt * 3.5;
      if (this.lightningArcs[i].life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    // 1. Bolas de Nieve en Vuelo
    for (let i = this.flyingSnowballs.length - 1; i >= 0; i--) {
      const ball = this.flyingSnowballs[i];

      // Auto-aim rúnico teledirigido (Fundalas)
      if (this.arcaneAimTimer > 0) {
        let bestTarget: GalleryTarget | null = null;
        let minDist = 220;
        for (const tg of this.targets) {
          if (tg.isHit || (tg.isPeek && tg.peekOffset > 0.4)) continue;
          const d = Math.hypot(ball.currentX - tg.x, ball.currentY - tg.y);
          if (d < minDist) {
            minDist = d;
            bestTarget = tg;
          }
        }
        if (bestTarget) {
          ball.targetX += (bestTarget.x - ball.targetX) * dt * 7.5;
          ball.targetY += (bestTarget.y - ball.targetY) * dt * 7.5;
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
        ball.scale = (ball.scale > 1.6 ? 2.5 : 1.4) - t * 0.65;

        if (ball.isFever || ball.isSpecial) {
          this.particles.emitTouchTrail(ball.currentX, ball.currentY, 2);
        }
      }
    }

    // 2. Objetivos en Movimiento y Física de Carrusel
    const isBlizzardActive = this.blizzardFreezeTimer > 0;
    const speedMult = isBlizzardActive ? 0.0 : 1.0;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.wobblePhase += dt * 3.2;
      t.bobPhase += dt * 4.5;
      t.isFrozen = isBlizzardActive;

      // Abatimiento de diana tras impacto
      if (t.isHit) {
        t.hitTimer += dt;
        t.hingePitch = Math.min(90, t.hingePitch + dt * 320);
        t.wobbleAngle = Math.sin(t.hitTimer * 24) * Math.exp(-t.hitTimer * 7) * 18;
        if (t.hingePitch >= 75) {
          t.y += dt * 350;
        }
        if (t.hitTimer > 0.45) {
          this.targets.splice(i, 1);
        }
        continue;
      }

      // Comportamiento del Muñeco de Nieve Lanzador
      if (t.type === "grumpy_snowman" && t.attackTimer !== undefined) {
        t.attackTimer -= dt * speedMult;
        // Si el temporizador llega a cero y el jugador no le disparó, arroja bola a la cámara!
        if (t.attackTimer <= 0) {
          if (this.divineShieldTimer > 0) {
            this.addFloatingText("🛡️ ¡ESCUDO REPELIÓ BOLA!", this.width / 2, this.height * 0.44, "#38BDF8", 1.4);
          } else if (this.cameraSplatTimer <= 0) {
            this.cameraSplatTimer = 1.4;
            this.cameraSplatAlpha = 1.0;
            this.playWoodClackSound(260);
            this.triggerShake(0.20, 6);
            this.addFloatingText("¡EL MUÑECO TE SALPICÓ!", this.width / 2, this.height * 0.42, "#FF1744", 1.5);
          }
          t.isHit = true; // El muñeco se retira tras lanzar
          t.hitTimer = 0;
          continue;
        }
      }

      // Peeking targets
      if (t.isPeek) {
        t.peekTimer -= dt * speedMult;
        if (t.peekTimer <= 0) {
          t.peekOffset = Math.min(1.0, t.peekOffset + dt * 4.5);
          if (t.peekOffset >= 1.0) {
            this.targets.splice(i, 1);
            continue;
          }
        } else {
          t.peekOffset = Math.max(0.0, t.peekOffset - dt * 4.5);
        }
      }

      // Movimiento horizontal en rieles carrusel
      if (t.vx !== 0) {
        t.x += t.vx * dt * speedMult;

        // Si sale de los límites del riel, ciclar continuamente
        if (t.shelfIndex === 0) {
          // Repisa superior avanza hacia la derecha
          if (t.x > this.shelfRight + 40) {
            t.x = this.shelfLeft - 30;
          }
        } else if (t.shelfIndex === 1) {
          // Repisa media avanza hacia la izquierda
          if (t.x < this.shelfLeft - 40) {
            t.x = this.shelfRight + 30;
          }
        } else {
          // Repisa inferior rebota mecánicamente
          if (t.x <= this.shelfLeft + t.width * 0.5) {
            t.x = this.shelfLeft + t.width * 0.5;
            t.vx = Math.abs(t.vx);
          } else if (t.x >= this.shelfRight - t.width * 0.5) {
            t.x = this.shelfRight - t.width * 0.5;
            t.vx = -Math.abs(t.vx);
          }
        }
      }
    }

    // 3. Spawner de Carrusel Continuo (NUNCA se detiene)
    this.targetSpawnTimer += dt;
    const maxActiveTargets = this.isFeverMode ? 12 : 9;
    const activeCount = this.targets.filter(t => !t.isHit).length;

    // Si hay menos de 9 blancos, rellenar de inmediato (cada 0.32s)
    if (activeCount < maxActiveTargets && this.targetSpawnTimer >= 0.32) {
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

    // 4. Salpicaduras de nieve
    for (let i = this.snowSplats.length - 1; i >= 0; i--) {
      const splat = this.snowSplats[i];
      splat.alpha -= dt * 0.85;
      for (const p of splat.splatPoints) {
        p.dripY += dt * 9;
      }
      if (splat.alpha <= 0) {
        this.snowSplats.splice(i, 1);
      }
    }
  }

  /**
   * Dispara una ráfaga especial con un banner temático emocionante
   */
  private triggerRushEvent(): void {
    const events = [
      { name: "¡AVALANCHA DE DUENDES!", type: "mischievous_elf" as TargetType },
      { name: "¡FRENESÍ DE REGALOS Y TIEMPO!", type: "magic_clock" as TargetType },
      { name: "¡ASALTO DE MUÑECOS DE NIEVE!", type: "grumpy_snowman" as TargetType },
      { name: "¡FIESTA DE PIÑATAS DORADAS!", type: "pinata_star" as TargetType }
    ];
    const ev = events[Math.floor(Math.random() * events.length)];
    this.currentRushBanner = ev.name;
    this.rushBannerTimer = 2.4;

    this.audio.playPowerUp();
    this.triggerShake(0.18, 5);
    this.particles.emitConfetti(this.width, 35);

    // Generar 3 objetivos especiales en cada repisa
    this.spawnTargetOnShelf(0, ev.type);
    this.spawnTargetOnShelf(1, ev.type);
    this.spawnTargetOnShelf(2, ev.type);
  }

  /**
   * Resuelve el impacto de la bola de nieve
   */
  private handleSnowballImpact(x: number, y: number, isSpecial: boolean, themeColor: string): void {
    const isMega = this.megaMortarTimer > 0;
    const hitRadius = isMega ? 150 : (isSpecial ? 65 : 48);

    this.createSnowSplat(x, y, isSpecial ? themeColor : "#FFFFFF");
    this.particles.emitBurst(x, y, isSpecial ? themeColor : "#FFFFFF", isMega ? 45 : (isSpecial ? 25 : 14));

    if (isMega) {
      this.triggerShake(0.35, 12);
      this.audio.playCoalBombExplosion();
    }

    // Detección de impacto
    const hitTargets: GalleryTarget[] = [];
    for (const target of this.targets) {
      if (target.isHit) continue;
      if (target.isPeek && target.peekOffset > 0.55) continue;

      const targetCenterY = target.y - target.height * 0.46 * (1 - target.peekOffset);
      const dx = x - target.x;
      const dy = y - targetCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const effectiveRadius = (target.width / 2) + hitRadius * 0.65;
      if (dist < effectiveRadius) {
        hitTargets.push(target);
        if (!isMega) break; // Si no es mega-mortero, impacta al objetivo principal
      }
    }

    if (hitTargets.length > 0) {
      for (const t of hitTargets) {
        this.resolveTargetHit(t, x, y);
      }

      // Si la Ventisca Glacial (Cajasan) está activa, ¡desatar explosión de hielo en cadena!
      if (this.blizzardFreezeTimer > 0) {
        this.triggerIceChainReaction(hitTargets[0]);
      }
    } else {
      this.playWoodClackSound(400);
      this.combo = 0;
    }
  }

  /**
   * Explosión en cadena de hielo (Ventisca Glacial de Cajasan)
   */
  private triggerIceChainReaction(originTarget: GalleryTarget): void {
    const sameShelfTargets = this.targets.filter(
      t => !t.isHit && t.shelfIndex === originTarget.shelfIndex && t !== originTarget
    );

    for (const t of sameShelfTargets) {
      // Dibujar arco de rayo de hielo
      this.lightningArcs.push({
        x1: originTarget.x,
        y1: originTarget.y - originTarget.height * 0.4,
        x2: t.x,
        y2: t.y - t.height * 0.4,
        life: 1.0,
        color: "#00E5FF"
      });

      t.isHit = true;
      t.hitTimer = 0;
      this.addScore(t.points);
      this.particles.emitBurst(t.x, t.y - 20, "#00E5FF", 16);
    }

    if (sameShelfTargets.length > 0) {
      this.playBellDingSound();
      this.addFloatingText(`❄️ ¡EXPLOSIÓN EN CADENA x${sameShelfTargets.length + 1}!`, originTarget.x, originTarget.y - 40, "#00E5FF", 1.5);
    }
  }

  private resolveTargetHit(target: GalleryTarget, hitX: number, hitY: number): void {
    // Manejo de objetivos multi-hit (como la Piñata Dorada)
    if (target.hp > 1) {
      target.hp--;
      this.playWoodClackSound(800);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 18);
      this.addFloatingText("¡TOCA OTRA VEZ! 💥", hitX, hitY - 35, "#FFD700", 1.3);
      return;
    }

    target.isHit = true;
    target.hitTimer = 0;
    const localSplatY = hitY - (target.y - target.height * 0.5 * (1 - target.peekOffset));
    target.splatOnTarget = {
      dx: Math.max(-target.width * 0.38, Math.min(target.width * 0.38, hitX - target.x)),
      dy: Math.max(-target.height * 0.38, Math.min(target.height * 0.38, localSplatY)),
      r: 12 + Math.random() * 6
    };
    this.hitsCount++;

    const hasShield = this.divineShieldTimer > 0;

    // 1. IMPACTO EN HAZARDS (Carbón y Hielo)
    if (target.type === "coal") {
      if (hasShield) {
        this.addScore(250);
        this.addFloatingText("🛡️ ¡CARBÓN PURIFICADO! +250", hitX, hitY - 35, "#38BDF8", 1.4);
        this.particles.emitBurst(hitX, hitY, "#38BDF8", 22);
        this.playBellDingSound();
      } else {
        this.combo = 0;
        this.isFeverMode = false;
        this.addScore(target.points);
        this.triggerShake(0.30, 9);
        this.audio.playError();
        this.addFloatingText("¡CARBÓN! -150", hitX, hitY - 35, "#FF3366", 1.4);
        this.particles.emitBurst(hitX, hitY, "#222222", 24);
      }
      return;
    }

    if (target.type === "ice_spike") {
      if (hasShield) {
        this.addScore(300);
        this.addFloatingText("🛡️ ¡CRISTAL PURIFICADO! +300", hitX, hitY - 35, "#38BDF8", 1.4);
        this.particles.emitBurst(hitX, hitY, "#38BDF8", 22);
        this.playBellDingSound();
      } else {
        this.combo = 0;
        this.frostFreezeTimer = 0.85;
        this.addScore(target.points);
        this.triggerShake(0.35, 10);
        this.playWoodClackSound(200);
        this.addFloatingText("¡HIELO! -150 (CONGELADO)", hitX, hitY - 35, "#00E5FF", 1.4);
        this.particles.emitBurst(hitX, hitY, "#80D8FF", 26);
      }
      return;
    }

    // 2. IMPACTO EN ENEMIGOS DINÁMICOS
    if (target.type === "grumpy_snowman") {
      this.combo++;
      this.addScore(target.points);
      this.playWoodClackSound(650);
      this.addFloatingText("¡MUÑECO DESARMADO! +250", hitX, hitY - 35, "#FFD700", 1.45);
      this.particles.emitBurst(hitX, hitY, "#FFFFFF", 25);
      return;
    }

    if (target.type === "ice_goblin") {
      this.combo += 2;
      this.addScore(target.points);
      this.playWoodClackSound(700);
      this.addFloatingText("¡DUENDE CAZADO! +320", hitX, hitY - 35, "#00E5FF", 1.45);
      this.particles.emitBurst(hitX, hitY, "#00E5FF", 24);
      return;
    }

    if (target.type === "mischievous_elf") {
      this.combo += 2;
      this.addScore(target.points);
      this.playBellDingSound();
      this.addFloatingText("¡ELFO ATRAPADO! +400", hitX, hitY - 35, "#00E676", 1.55);
      this.particles.emitBurst(hitX, hitY, "#00E676", 28);
      this.particles.emitConfetti(this.width, 30);
      return;
    }

    if (target.type === "pinata_star") {
      this.combo += 3;
      this.addScore(target.points);
      this.playBellDingSound();
      this.addFloatingText("🎉 ¡PIÑATA JACKPOT! +600", hitX, hitY - 35, "#FFD700", 1.7);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 40);
      this.particles.emitConfetti(this.width, 45);
      return;
    }

    if (target.type === "magic_clock") {
      this.timeRemaining += 5.0; // ¡+5s tiempo extra!
      this.addScore(target.points);
      this.playBellDingSound();
      this.addFloatingText("⏱️ ¡+5 SEGUNDOS EXTRA!", hitX, hitY - 35, "#00E676", 1.6);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 25);
      return;
    }

    // 3. DIANA DE PATROCINADOR CON SUPERPODER ESPECTACULAR
    if (target.type === "sponsor_target") {
      this.combo += 2;
      const sponsorKey = target.sponsorId || "feria";
      const sponsor = BRANDING.getLogoConfig(sponsorKey);
      const mult = this.getComboMultiplier();
      const basePoints = target.points * mult;
      this.addScore(basePoints);

      this.triggerLogoPowerUp(sponsor.id, 8);
      this.triggerShake(0.22, 7);
      this.playBellDingSound();
      this.particles.emitBurst(hitX, hitY, sponsor.themeColor, 35);
      this.particles.emitConfetti(this.width, 45);

      this.activateSponsorSuperpower(sponsor, hitX, hitY);
      return;
    }

    // 4. DIANAS CLÁSICAS
    this.playWoodClackSound(650);

    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    if (this.combo === 5 && !this.isFeverMode) {
      this.activateFeverMode();
    }

    let mult = this.getComboMultiplier();
    if (this.cosmicMultTimer > 0) mult *= 4; // Factor Humano

    let pts = target.points * mult;

    let isBullseyeCenter = false;
    if (target.type === "bullseye") {
      const distCenter = Math.abs(hitX - target.x);
      if (distCenter < target.width * 0.22) {
        isBullseyeCenter = true;
        this.perfectHits++;
        pts += 200 * mult;
        this.playBellDingSound();
      }
    }

    this.addScore(pts);
    this.audio.playCatchItem(1.0 + Math.min(1.0, this.combo * 0.08));

    const tagText = isBullseyeCenter ? `¡DIANA PERFECTA! +${pts}` : `+${pts}`;
    const color = isBullseyeCenter ? "#FFD700" : (mult > 1 ? "#00E5FF" : "#FFFFFF");
    this.addFloatingText(tagText, hitX, hitY - 35, color, isBullseyeCenter ? 1.5 : 1.25);

    if (this.combo > 1 && this.combo % 4 === 0) {
      this.particles.emitConfetti(this.width, 24);
      this.addFloatingText(`¡RACHA x${this.combo}!`, this.width / 2, this.height * 0.36, "#FFD700", 1.6);
    }
  }

  private activateSponsorSuperpower(sponsor: LogoConfig, hitX: number, hitY: number): void {
    this.activeAbilityColor = sponsor.themeColor;

    switch (sponsor.id) {
      case "logo-campus":
      case "campus":
        this.gatlingTimer = 5.5;
        this.activeAbilityName = "⚡ METRALLADORA DE PLASMA";
        this.addFloatingText("⚡ ¡METRALLADORA DE NIEVE ACTIVADA!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        break;

      case "logo-cajasan":
      case "cajasan":
        this.blizzardFreezeTimer = 5.0;
        this.activeAbilityName = "❄️ VENTISCA GLACIAL TOTAL";
        this.addFloatingText("❄️ ¡VENTISCA GLACIAL! ¡DISPARA EN CADENA!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        this.triggerShake(0.25, 8);
        break;

      case "logo-practi":
      case "practi":
        this.megaMortarTimer = 5.0;
        this.activeAbilityName = "💣 SUPER-MORTERO DESTRUCTOR";
        this.addFloatingText("💣 ¡SUPER-MORTERO DESTRUCTOR!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        break;

      case "logo-mariposa":
      case "mariposa":
        this.timeRemaining += 5.0;
        this.fairyTimeTimer = 5.0;
        this.activeAbilityName = "🦋 DULCE BONANZA +5s";
        this.addFloatingText("🍬 ¡RELOJ DE HADAS +5s (x2 PUNTOS)!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        this.particles.emitConfetti(this.width, 40);
        break;

      case "logo-angelus":
      case "angelus":
        this.divineShieldTimer = 6.0;
        this.activeAbilityName = "🛡️ ESCUDO CELESTIAL";
        this.addFloatingText("🛡️ ¡PURIFICACIÓN Y ESCUDO SAGRADO!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        // Purificar todos los peligros actuales en pantalla
        for (const tg of this.targets) {
          if (tg.type === "coal" || tg.type === "ice_spike") {
            tg.type = "gift_box";
            tg.points = 250;
            this.particles.emitBurst(tg.x, tg.y - 20, "#38BDF8", 15);
          }
        }
        break;

      case "logo-factor":
      case "factor":
        this.cosmicMultTimer = 5.0;
        this.activeAbilityName = "💥 MULTIPLICADOR CÓSMICO x4";
        this.addFloatingText("💥 ¡PUNTOS CUÁDRUPLES x4!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        break;

      case "logo-fundalas":
      case "fundalas":
        this.arcaneAimTimer = 5.5;
        this.activeAbilityName = "🎯 PUNTERÍA RÚNICA DIVINA";
        this.addFloatingText("🎯 ¡PUNTERÍA TELEDIRIGIDA!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        break;

      case "logo-imebu":
      case "imebu":
      default:
        this.addScore(1000);
        this.activeAbilityName = "💰 LLUVIA DE ORO EMPRENDEDOR";
        this.addFloatingText("💰 ¡JACKPOT EMPRENDEDOR +1000!", hitX, hitY - 50, sponsor.themeColor, 1.65);
        this.particles.emitConfetti(this.width, 50);
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
  // AUDIO SINTETIZADO A 0MS
  // ============================================================================

  private playSlingshotSound(): void {
    if (this.audio.getIsMuted()) return;
    try {
      const ctx = (this.audio as any).ctx as AudioContext | undefined;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(340, ctx.currentTime);
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
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
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

    // 1. Fondo de Caseta
    if (this.bgCarnivalImage && this.bgCarnivalImage.complete && this.bgCarnivalImage.naturalWidth > 0) {
      ctx.drawImage(this.bgCarnivalImage, 0, 0, w, h);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#1A0E08");
      bgGrad.addColorStop(0.5, "#3D1F0D");
      bgGrad.addColorStop(1, "#1A0E08");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Efecto de resplandor del Modo Fiebre
    if (this.isFeverMode) {
      const feverAura = ctx.createRadialGradient(w / 2, h * 0.45, 40, w / 2, h * 0.45, w * 0.75);
      feverAura.addColorStop(0, "rgba(255, 215, 0, 0.25)");
      feverAura.addColorStop(0.6, "rgba(255, 69, 0, 0.15)");
      feverAura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = feverAura;
      ctx.fillRect(0, 0, w, h);
    }

    // Efecto de Ventisca Glacial (Cajasan)
    if (this.blizzardFreezeTimer > 0) {
      const iceVignette = ctx.createLinearGradient(0, 0, 0, h);
      iceVignette.addColorStop(0, "rgba(0, 229, 255, 0.22)");
      iceVignette.addColorStop(0.5, "rgba(128, 222, 234, 0.08)");
      iceVignette.addColorStop(1, "rgba(0, 229, 255, 0.24)");
      ctx.fillStyle = iceVignette;
      ctx.fillRect(0, 0, w, h);
    }

    // 1.5. Guirnalda de patrocinadores en la pared
    this.drawBackgroundSponsorBanner(ctx);

    // 2. Nieve ambiente
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (const flake of this.ambientSnowDrift) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Salpicaduras de nieve
    this.drawSnowSplats(ctx);

    // 4. Rayos de Hielo en Cadena
    this.drawLightningArcs(ctx);

    // 5. Dianas y Objetivos
    this.drawTargets(ctx);

    // 6. Bolas de Nieve en Vuelo
    this.drawFlyingSnowballs(ctx);

    // 7. Resortera animada en el mostrador
    this.drawAnimatedSlingshot(ctx);

    // 8. Mancha de nieve en cámara (ataque del muñeco)
    if (this.cameraSplatAlpha > 0.02) {
      this.drawCameraSnowSplat(ctx);
    }

    // 8.5. Banner de Oleada Especial (Rush Event)
    if (this.rushBannerTimer > 0 && this.currentRushBanner) {
      this.drawRushBanner(ctx);
    }

    // 9. Luces de marquesina en fiebre
    this.drawCarnivalMarquee(ctx);

    // 10. Partículas
    this.particles.draw(ctx, true);

    // 11. Retícula Rúnica Arcade
    this.drawCrosshair(ctx);

    // 12. HUD Superior
    this.drawTargetHUD(ctx);
  }

  private drawLightningArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.lightningArcs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, arc.life));
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 24;
      const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 24;
      ctx.lineTo(midX, midY);
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawRushBanner(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const cx = this.width / 2;
    const cy = this.height * 0.32;
    const alpha = Math.min(1.0, this.rushBannerTimer * 2.5);
    ctx.globalAlpha = alpha;

    const bannerW = Math.min(380, this.width * 0.85);
    const bannerH = 46;

    ctx.fillStyle = "rgba(10, 25, 47, 0.92)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - bannerW / 2, cy - bannerH / 2, bannerW, bannerH, 23);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 17px 'Titan One', 'Fredoka', sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.currentRushBanner, cx, cy);

    ctx.restore();
  }

  private drawCarnivalMarquee(ctx: CanvasRenderingContext2D): void {
    if (!this.isFeverMode) return;

    const w = this.width;
    const h = this.height;

    ctx.save();
    const marqueeColors = ["#FF1744", "#FFEA00", "#00E676", "#00E5FF", "#D500F9"];
    const bulbCount = Math.min(24, Math.floor(w / 38));
    const awningY = Math.min(68, h * 0.11);

    for (let i = 0; i < bulbCount; i++) {
      const bx = (i / (bulbCount - 1)) * (w - 30) + 15;
      const by = awningY + Math.sin(i * 0.5 + this.feverMarqueeOffset * 0.12) * 3;
      const colorIdx = Math.floor((i + this.feverMarqueeOffset * 0.12) % marqueeColors.length);
      const color = marqueeColors[Math.abs(colorIdx)];

      const halo = ctx.createRadialGradient(bx, by, 2, bx, by, 22);
      halo.addColorStop(0, color);
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBackgroundSponsorBanner(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    const sponsors = BRANDING.getAllSponsors();
    const count = sponsors.length;
    if (count === 0) return;

    ctx.save();

    const startX = w * 0.15;
    const endX = w * 0.85;
    const baseY = h * 0.285;

    // Cuerda de pino
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

    // Medallones
    const step = (endX - startX) / (count - 1);
    const badgeR = Math.min(24, Math.max(16, w * 0.024));

    for (let i = 0; i < count; i++) {
      const sp = sponsors[i];
      const t = i / (count - 1);
      const bx = startX + step * i;
      const by = baseY + Math.sin(t * Math.PI) * (h * 0.038) + badgeR * 0.85;

      const isCurrentActive = this.activeLogo && this.activeLogo.id === sp.id;

      ctx.strokeStyle = "#C62828";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by - badgeR * 1.35);
      ctx.lineTo(bx, by - badgeR);
      ctx.stroke();

      if (isCurrentActive) {
        const halo = ctx.createRadialGradient(bx, by, badgeR * 0.4, bx, by, badgeR * 1.8);
        halo.addColorStop(0, sp.themeColor);
        halo.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(bx, by, badgeR * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#3E2723";
      ctx.beginPath();
      ctx.arc(bx, by, badgeR + 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isCurrentActive ? "#FFD700" : "rgba(255, 215, 0, 0.85)";
      ctx.lineWidth = isCurrentActive ? 3.5 : 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fill();

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
    }

    ctx.restore();
  }

  private drawTargets(ctx: CanvasRenderingContext2D): void {
    for (const target of this.targets) {
      // Sombra de contacto sobre el riel
      ctx.save();
      ctx.fillStyle = "rgba(20, 10, 5, 0.42)";
      ctx.beginPath();
      ctx.ellipse(target.x, target.y, target.width * 0.40, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(target.x, target.y);

      // Efecto 3D de abatimiento sobre la bisagra
      if (target.isHit) {
        const pitchRad = (target.hingePitch * Math.PI) / 180;
        const scaleY = Math.max(0.05, Math.cos(pitchRad));
        ctx.scale(1.0, scaleY);
        ctx.rotate((target.wobbleAngle * Math.PI) / 180);
      } else {
        ctx.rotate((Math.sin(target.wobblePhase) * 2.2 * Math.PI) / 180);
      }

      ctx.translate(0, -(target.height * 0.5) * (1 - target.peekOffset));

      if (target.isPeek && target.peekOffset > 0) {
        ctx.beginPath();
        ctx.rect(-target.width, -target.height * 1.5, target.width * 2, target.height * (1.5 - target.peekOffset));
        ctx.clip();
      }

      // Dibujar objetivo según tipo
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
        case "gift_box": {
          const giftSpr = target.points > 250 || this.isFeverMode
            ? this.spriteGiftGold
            : (target.id % 2 === 0 ? this.spriteGiftRed : this.spriteGiftGreen);
          this.drawSpriteTarget(ctx, target, giftSpr);
          break;
        }
        case "pinata_star":
          this.drawPinataTarget(ctx, target);
          break;
        case "gingerbread":
          this.drawSpriteTarget(ctx, target, this.spriteGingerbread);
          break;
        case "magic_clock":
          this.drawClockTarget(ctx, target);
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
        case "ice_goblin":
          this.drawIceGoblinTarget(ctx, target);
          break;
        case "mischievous_elf":
          this.drawMischievousElfTarget(ctx, target);
          break;
      }

      // Mancha de nieve si fue impactada
      if (target.splatOnTarget) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(target.splatOnTarget.dx, target.splatOnTarget.dy, target.splatOnTarget.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Si está congelada por Ventisca Glacial (Cajasan)
      if (target.isFrozen) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 229, 255, 0.35)";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.5;
        const pad = target.width * 0.52;
        ctx.beginPath();
        ctx.roundRect(-pad, -pad, pad * 2, pad * 2, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  private drawBullseyeTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const r = target.width / 2;

    ctx.strokeStyle = "#8D6E63";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(0, r + 18);
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-6, r + 8, 12, 6);

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
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }
  }

  private drawPinataTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width * 1.15;
    const pulse = Math.sin(target.bobPhase) * 3;

    // Resplandor dorado
    const glow = ctx.createRadialGradient(0, pulse, size * 0.2, 0, pulse, size * 0.8);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.55)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, pulse, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    if (this.spritePinata && this.spritePinata.complete && this.spritePinata.naturalWidth > 0) {
      ctx.drawImage(this.spritePinata, -size / 2, -size / 2 + pulse, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }

    // Indicador de HP si tiene 2 toques
    if (target.hp === 2) {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(-8, -size * 0.48 + pulse, 4.5, 0, Math.PI * 2);
      ctx.arc(8, -size * 0.48 + pulse, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawClockTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width * 1.05;
    const bob = Math.sin(target.bobPhase) * 4;

    const glow = ctx.createRadialGradient(0, bob, size * 0.2, 0, bob, size * 0.75);
    glow.addColorStop(0, "rgba(0, 230, 118, 0.5)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, bob, size * 0.75, 0, Math.PI * 2);
    ctx.fill();

    if (this.spriteClock && this.spriteClock.complete && this.spriteClock.naturalWidth > 0) {
      ctx.drawImage(this.spriteClock, -size / 2, -size / 2 + bob, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }

    // Badge "+5s"
    ctx.fillStyle = "#00E676";
    ctx.beginPath();
    ctx.roundRect(-22, size * 0.40 + bob, 44, 15, 6);
    ctx.fill();
    ctx.fillStyle = "#0F172A";
    ctx.font = "900 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+5s", 0, size * 0.40 + bob + 8);
  }

  private drawGrumpySnowmanTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const w = target.width * 1.18;
    const h = target.height * 1.28;

    const isAttacking = target.attackTimer !== undefined && target.attackTimer < 1.0;
    const spr = isAttacking ? this.spriteSnowmanAttack : this.spriteSnowman;

    if (spr && spr.complete && spr.naturalWidth > 0) {
      ctx.drawImage(spr, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 8, target.width * 0.4, 0, Math.PI * 2);
      ctx.arc(0, -14, target.width * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Advertencia de lanzamiento con exclamación pulsante
    if (target.attackTimer !== undefined) {
      const urgency = 1 - target.attackTimer / 2.2;
      const pulse = 1 + Math.sin(this.lanternFlicker * 4) * 0.2;

      ctx.save();
      ctx.fillStyle = urgency > 0.6 ? "#D50000" : "#FF6D00";
      ctx.beginPath();
      ctx.arc(0, -h * 0.52, 9 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", 0, -h * 0.52);
      ctx.restore();
    }
  }

  private drawIceGoblinTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width * 1.15;
    const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 0.75);
    glow.addColorStop(0, "rgba(0, 229, 255, 0.45)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
    ctx.fill();

    if (this.spriteDuendeHielo && this.spriteDuendeHielo.complete && this.spriteDuendeHielo.naturalWidth > 0) {
      ctx.drawImage(this.spriteDuendeHielo, -size / 2, -size / 2, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }
  }

  private drawMischievousElfTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width * 1.18;
    const isFast = Math.abs(target.vx) > 70;
    const spr = isFast ? this.spriteElfAttack : this.spriteElf;

    if (spr && spr.complete && spr.naturalWidth > 0) {
      ctx.drawImage(spr, -size / 2, -size / 2, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }
  }

  private drawSponsorTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const r = target.width / 2;
    const sponsor = target.sponsorId ? BRANDING.getLogoConfig(target.sponsorId) : BRANDING.getLogoConfig("feria");
    const sponsorImg = this.getSponsorImage(sponsor.id);

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
    ctx.roundRect(-28, r - 10, 56, 18, 6);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SUPERPODER", 0, r - 1);
  }

  private drawCoalTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width;
    if (this.spriteCoal && this.spriteCoal.complete && this.spriteCoal.naturalWidth > 0) {
      ctx.drawImage(this.spriteCoal, -size / 2, -size / 2, size, size);
    } else {
      this.drawBullseyeTarget(ctx, target);
    }
  }

  private drawIceSpikeTarget(ctx: CanvasRenderingContext2D, target: GalleryTarget): void {
    const size = target.width;
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
      this.drawBullseyeTarget(ctx, target);
    }
  }

  private drawFlyingSnowballs(ctx: CanvasRenderingContext2D): void {
    for (const ball of this.flyingSnowballs) {
      const radius = 19 * ball.scale;

      ctx.save();

      // Sombra en perspectiva sobre pared
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(ball.currentX, ball.currentY + radius * 1.5, radius * 1.25, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura especial o ráfaga Gatling
      if (ball.isSpecial || ball.isFever || ball.isGatling) {
        const glow = ctx.createRadialGradient(ball.currentX, ball.currentY, radius * 0.3, ball.currentX, ball.currentY, radius * 2.4);
        glow.addColorStop(0, ball.themeColor);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ball.currentX, ball.currentY, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bola de nieve 3D o Cohete Mortero
      if (ball.scale > 2.0 && this.spriteRocket && this.spriteRocket.complete) {
        const rSize = radius * 1.9;
        ctx.drawImage(this.spriteRocket, ball.currentX - rSize / 2, ball.currentY - rSize / 2, rSize, rSize);
      } else {
        const ballGrad = ctx.createRadialGradient(
          ball.currentX - radius * 0.35,
          ball.currentY - radius * 0.35,
          radius * 0.2,
          ball.currentX,
          ball.currentY,
          radius
        );
        ballGrad.addColorStop(0, "#FFFFFF");
        ballGrad.addColorStop(0.7, ball.isGatling ? "#B2EBF2" : "#E2EEF8");
        ballGrad.addColorStop(1, ball.isGatling ? "#00E5FF" : "#A8C8E6");
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.currentX, ball.currentY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

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

  private drawAnimatedSlingshot(ctx: CanvasRenderingContext2D): void {
    const cx = this.width / 2;
    const cy = this.height * 0.91;

    ctx.save();
    ctx.translate(cx, cy);

    const recoilY = Math.sin(this.slingshotSnapTimer * 32) * Math.exp(-this.slingshotSnapTimer * 8) * 16;
    const recoilRot = (this.slingshotAngle * 0.35);
    ctx.rotate(recoilRot);

    const forkW = Math.min(58, this.width * 0.12);
    const forkH = 58;

    // Horquilla de madera
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

    // Vetas doradas
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(-forkW / 2, -forkH, 5.5, 0, Math.PI * 2);
    ctx.arc(forkW / 2, -forkH, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bandas elásticas
    const pouchX = 0;
    const pouchY = -24 + recoilY;

    ctx.lineWidth = 4;
    ctx.strokeStyle = this.gatlingTimer > 0 ? "#00E5FF" : "#E53935";
    ctx.beginPath();
    ctx.moveTo(-forkW / 2, -forkH);
    ctx.lineTo(pouchX, pouchY);
    ctx.lineTo(forkW / 2, -forkH);
    ctx.stroke();

    // Parche
    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.roundRect(pouchX - 9, pouchY - 5, 18, 10, 3);
    ctx.fill();

    // Bola cargada
    ctx.fillStyle = this.gatlingTimer > 0 ? "#00E5FF" : (this.megaMortarTimer > 0 ? "#FF6D00" : "#FFFFFF");
    ctx.beginPath();
    ctx.arc(pouchX, pouchY - 4, this.megaMortarTimer > 0 ? 15 : 10, 0, Math.PI * 2);
    ctx.fill();

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

  private drawCameraSnowSplat(ctx: CanvasRenderingContext2D): void {
    const cx = this.width * 0.44;
    const cy = this.height * 0.48;
    ctx.save();
    ctx.globalAlpha = this.cameraSplatAlpha * 0.94;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();

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

    // Detectar si está apuntando a un objetivo activo
    let isHovering = false;
    for (const tg of this.targets) {
      if (!tg.isHit && Math.hypot(x - tg.x, y - (tg.y - tg.height * 0.5)) < tg.width * 0.6) {
        isHovering = true;
        break;
      }
    }

    // Anillo giratorio
    ctx.save();
    ctx.rotate(this.crosshairAngle);
    ctx.strokeStyle = isHovering ? "#FFD700" : (this.isFeverMode ? "#FFD700" : "#00E5FF");
    ctx.lineWidth = isHovering ? 3.5 : 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, baseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Miras cardinales
    ctx.strokeStyle = isHovering ? "#FFD700" : "#FFFFFF";
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
    ctx.fillStyle = isHovering ? "#00E676" : "#FF1744";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  private drawTargetHUD(ctx: CanvasRenderingContext2D): void {
    const badgeX = this.width / 2;
    const badgeY = this.height <= 700 ? 32 : 82;

    ctx.save();
    ctx.translate(badgeX, badgeY);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Banner de Superpoder Activo
    const activePowerTime = Math.max(
      this.gatlingTimer,
      this.blizzardFreezeTimer,
      this.megaMortarTimer,
      this.fairyTimeTimer,
      this.divineShieldTimer,
      this.cosmicMultTimer,
      this.arcaneAimTimer
    );

    if (activePowerTime > 0 && this.activeAbilityName) {
      const bannerW = 280;
      const bannerH = 38;
      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.strokeStyle = this.activeAbilityColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 19);
      ctx.fill();
      ctx.stroke();

      ctx.font = "900 13px 'Titan One', 'Fredoka', sans-serif";
      ctx.fillStyle = this.activeAbilityColor;
      ctx.fillText(`${this.activeAbilityName} (${Math.ceil(activePowerTime)}s)`, 0, 0);
      ctx.restore();
      return;
    }

    // Banner de Fiebre
    if (this.isFeverMode) {
      const bannerW = 230;
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

    // Banner de Combo
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
    this.lightningArcs = [];
    this.crosshairVisible = false;
  }
}
