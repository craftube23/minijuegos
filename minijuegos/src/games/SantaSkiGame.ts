/**
 * ==============================================================================
 * MINIJUEGO: ¡ESQUÍ ALPINO DE SANTA! (Estilo Microsoft Edge Surf / SkiFree)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Mecánicas Tipo "Edge Surf / SkiFree Navideño":
 * 1. Mundo Abierto Infinito con Cámara Dinámica:
 *    - La cámara sigue a Santa en X e Y. Al girar a la derecha, las cosas quedan
 *      atrás a la izquierda y aparecen nuevos paisajes, árboles y rampas a la derecha.
 *    - Sin paredes de pasillo: libertad total de movimiento en la montaña alpina.
 * 2. Modo Supervivencia por Vidas (Sin Límite de Tiempo):
 *    - La partida dura mientras tengas vidas (3 vidas festivas). ¡Llega lo más lejos posible!
 * 3. El Monstruo Yeti de Nieve (Persecución estilo Kraken de Edge Surf / SkiFree):
 *    - Tras alcanzar cierta distancia (o por evento), un Yeti Muñeco de Nieve gigante
 *      con cuernos de hielo aparece persiguiendo a Santa desde arriba a gran velocidad.
 *    - ¡Haz giros cerrados, salta en rampas o activa el Super Turbo Dorado para escapar!
 *    - Sprites dedicados: `yeti-run1.webp`, `yeti-run2.webp`, `yeti-dizzy.webp`.
 * 4. Posturas y Sprites de Acción de Santa:
 *    - `santa-ski-left.webp`: Carving a la izquierda con spray de nieve.
 *    - `santa-ski-right.webp`: Carving a la derecha.
 *    - `santa-ski-jump.webp`: Salto acrobático / voltereta mortal aérea con esquís en V.
 *    - `santa-ski-crash.webp`: Golpe con estrellas mareadas y esquís botados.
 * 5. Banderines y Rampas con Integración 3D en la Nieve:
 *    - Postes clavados en montículos de nieve con sombras proyectadas reales.
 *    - Rampas en perspectiva de descenso frontal con flechas de aceleración.
 */

import { BaseGame } from "../core/BaseGame";
import type { AudioManager } from "../core/AudioManager";
import type { InputManager } from "../core/InputManager"; 
import type { ParticleSystem } from "../core/ParticleSystem";
import { imgReady, drawPill } from "./shared/gameDraw";

type EntityKind = "tree" | "snowman" | "crystal" | "log" | "gate" | "ramp" | "gift" | "star" | "chalet" | "billboard" | "snowdrift";
type SantaPose = "straight" | "left" | "right" | "jump" | "crash";

interface WorldEntity {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: EntityKind;
  collected: boolean;
  giftIdx?: number;
  sponsorIdx?: number;
}

interface SkiTrackPoint {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  carve?: boolean;
}

interface SnowSprayParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  isPuff?: boolean;
}

interface AlpineSnowflake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  layer: number; // 0: fondo diminuto, 1: cristal medio, 2: bokeh primer plano
  alpha: number;
  rotation: number;
  rotSpeed: number;
}

interface SnowWindWisp {
  x: number;
  y: number;
  len: number;
  speed: number;
  width: number;
  alpha: number;
  curve: number;
}

interface SponsorInfo {
  id: string;
  name: string;
  logo: HTMLImageElement;
  color?: string;
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

export class SantaSkiGame extends BaseGame {
  // Posición de Santa en el mundo infinito
  private worldX = 0;
  private worldY = 0;
  private vx = 0;
  private tilt = 0;

  // Control táctil suave para móviles / ratón (Sin dashes bruscos)
  private isTouching = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private currentTouchX = 0;
  private currentTouchY = 0;
  private touchSteerAxis = 0;

  // Cámara que sigue al jugador
  private cameraX = 0;
  private cameraY = 0;

  // Estados de Santa
  private currentPose: SantaPose = "straight";
  private crashTimer = 0;

  // Salto en rampa / Voltereta aérea
  private isAirborne = false;
  private airTimer = 0;
  private airDuration = 1.15;
  private airSpin = 0;

  // Turbo e invulnerabilidad
  private turboTimer = 0;
  private invulnerableTimer = 0;

  // Velocidad de descenso y distancia
  private downhillSpeed = 310;
  private baseSpeed = 310;
  private maxSpeed = 620;
  private distanceMeters = 0;
  private combo = 0;

  // Escalamiento de Dificultad (Sectores de Montaña Alpina)
  // 0: Pista Verde (0-350m), 1: Azul (350-750m), 2: Roja (750-1300m), 3: Negra Olímpica (1300m+)
  private mountainSector = 0;

  // Sistema de Racha Limpia (Momentum sin errores)
  private cleanStreakTime = 0; // Tiempo esquiando limpio sin chocar
  private cleanStreakTier = 0; // Nivel 0, 1 (+12%), 2 (+24%), 3 (+38% y x2 pts)
  private speedLines: { x: number; y: number; l: number; vy: number; alpha: number }[] = [];

  // El Monstruo Yeti de Nieve (Estilo Kraken de Edge Surf / SkiFree)
  private yetiActive = false;
  private yetiWorldX = 0;
  private yetiWorldY = 0;
  private yetiSpeed = 390;
  private yetiAnimTimer = 0;
  private yetiStunnedTimer = 0;
  private yetiChaseTimer = 0;
  private nextYetiDistance = 350; // Aparece a los 350m (al entrar a Pista Azul)
  private yetiWarningAlpha = 0;

  // Control de ritmo de pista y espaciados equilibrados
  private lastRampY = -999;
  private lastGateY = -999;
  private gateBoostTimer = 0;

  // Entidades en el mundo abierto
  private entities: WorldEntity[] = [];
  private nextEntityId = 1;
  private lastSpawnY = 0;

  // Huellas y spray
  private tracks: SkiTrackPoint[] = [];
  private trackTimer = 0;
  private snowSpray: SnowSprayParticle[] = [];
  private ghostTrail: { x: number; y: number; pose: SantaPose; tilt: number; alpha: number }[] = [];
  private ghostSpawnTimer = 0;

  // Nieve ambiental
  // Nieve ambiental profesional en 3 capas y ventisca
  private snowFlakes: AlpineSnowflake[] = [];
  private windWisps: SnowWindWisp[] = [];

  // Controles
  private keyLeft = false;
  private keyRight = false;

  // Sprites 2D unificados de Santa (Mismo diseño con gafas, traje rojo y esquís en todas las poses)
  private santaStraightImg: HTMLImageElement;
  private santaStraight2Img: HTMLImageElement;
  private santaLeftImg: HTMLImageElement;
  private santaRightImg: HTMLImageElement;
  private santaJumpImg: HTMLImageElement;
  private santaCrashImg: HTMLImageElement;

  // Sprites del Yeti
  private yetiRun1Img: HTMLImageElement;
  private yetiRun2Img: HTMLImageElement;
  private yetiCatchImg: HTMLImageElement;
  private yetiDizzyImg: HTMLImageElement;

  // Props y obstáculos
  private rampImg: HTMLImageElement;
  private gateImg: HTMLImageElement;
  private treeImg: HTMLImageElement;
  private snowmanImg: HTMLImageElement;
  private crystalImg: HTMLImageElement;
  private logImg: HTMLImageElement;
  private chaletImg: HTMLImageElement;
  private starImg: HTMLImageElement;
  private giftImgs: HTMLImageElement[] = [];

  private sponsors: SponsorInfo[] = [];
  private nextBillboardIdx = 0;
  public onOpenTutorial?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "santa-ski",
      "¡Esquí Alpino de Santa!",
      "¡Mundo abierto de esquí alpino infinito! Desciende por la montaña, esquiva obstáculos, salta rampas y huye del Yeti de Nieve.",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/jingle-bells.mp3";
    this.inGameMusicVolume = 0.45;

    // Sprites 2D unificados de Santa (mismo estilo, proporciones y modelo de personaje)
    this.santaStraightImg = this.getImage("./assets/images/santa-ski-straight.webp");
    this.santaStraight2Img = this.getImage("./assets/images/santa-ski-straight-2.webp");
    this.santaLeftImg = this.getImage("./assets/images/santa-ski-left.webp");
    this.santaRightImg = this.getImage("./assets/images/santa-ski-right.webp");
    this.santaJumpImg = this.getImage("./assets/images/santa-ski-jump.webp");
    this.santaCrashImg = this.getImage("./assets/images/santa-ski-crash.webp");

    // Sprites del Yeti
    this.yetiRun1Img = this.getImage("./assets/images/yeti-run1.webp");
    this.yetiRun2Img = this.getImage("./assets/images/yeti-run2.webp");
    this.yetiCatchImg = this.getImage("./assets/images/yeti-catch.webp");
    this.yetiDizzyImg = this.getImage("./assets/images/yeti-dizzy.webp");

    // Props y obstáculos
    this.rampImg = this.getImage("./assets/images/rampa-esqui.webp");
    this.gateImg = this.getImage("./assets/images/puerta-eslalon.webp");
    this.treeImg = this.getImage("./assets/images/arbol.webp");
    this.snowmanImg = this.getImage("./assets/images/obstaculo-muneco.webp");
    this.crystalImg = this.getImage("./assets/images/obstaculo-cristal.webp");
    this.logImg = this.getImage("./assets/images/obstaculo-tronco.webp");
    this.chaletImg = this.getImage("./assets/images/casa-navidena-clean.webp");
    this.starImg = this.getImage("./assets/images/estrella con logo.webp");

    this.giftImgs = [
      this.getImage("./assets/images/regalo-estilizado-rojo.webp"),
      this.getImage("./assets/images/regalo-estilizado-verde.webp"),
      this.getImage("./assets/images/regalo-estilizado-azul.webp"),
      this.getImage("./assets/images/regalo-estilizado-dorado.webp")
    ];

    this.sponsors = [
      { id: "feria", name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.webp"), color: "#E53935" },
      { id: "campus", name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.webp"), color: "#00E5FF" },
      { id: "cajasan", name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.webp"), color: "#FF9100" },
      { id: "imebu", name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.webp"), color: "#00E676" },
      { id: "fundalas", name: "Fundalas", logo: this.getImage("./assets/logos/clean-fundalas.webp"), color: "#AB47BC" },
      { id: "mariposa", name: "Mariposa", logo: this.getImage("./assets/logos/clean-mariposa.webp"), color: "#EC407A" },
      { id: "practi", name: "Practi-Arepa", logo: this.getImage("./assets/logos/clean-practi-arepa.webp"), color: "#FFD600" }
    ];

    // Sistema profesional de nieve multicapa (Fondo, Cristales Medios y Primer Plano Bokeh)
    for (let i = 0; i < 135; i++) {
      const layer = Math.random() < 0.40 ? 0 : (Math.random() < 0.82 ? 1 : 2);
      let r = 1.6;
      let alpha = 0.75;
      let vy = 160;
      if (layer === 0) {
        // Fondo: polvo de nieve fino con contraste
        r = 1.2 + Math.random() * 1.6;
        alpha = 0.65 + Math.random() * 0.3;
        vy = 130 + Math.random() * 90;
      } else if (layer === 1) {
        // Medio: copos cristalinos nítidos de 6 puntas
        r = 3.2 + Math.random() * 2.4;
        alpha = 0.90 + Math.random() * 0.1;
        vy = 200 + Math.random() * 140;
      } else {
        // Primer plano: grandes copos con desenfoque cinematográfico bokeh
        r = 9.0 + Math.random() * 9.0;
        alpha = 0.55 + Math.random() * 0.25;
        vy = 320 + Math.random() * 160;
      }

      this.snowFlakes.push({
        x: Math.random() * 1600,
        y: Math.random() * 1100,
        r,
        vy,
        vx: -35 + Math.random() * 70,
        layer,
        alpha,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3
      });
    }

    // Ráfagas de ventisca blanca en la montaña
    for (let i = 0; i < 8; i++) {
      this.windWisps.push({
        x: Math.random() * 1600,
        y: Math.random() * 1200,
        len: 140 + Math.random() * 160,
        speed: 380 + Math.random() * 220,
        width: 2.2 + Math.random() * 2.5,
        alpha: 0.25 + Math.random() * 0.22,
        curve: (Math.random() - 0.5) * 45
      });
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = true;
    if (e.key === "h" || e.key === "H" || e.key === "?") {
      if (this.onOpenTutorial) this.onOpenTutorial();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = false;
  };

  protected onStart(): void {
    const w = this.width || 1024;
    const h = this.height || 768;

    // Posición inicial en el mundo abierto
    this.worldX = 0;
    this.worldY = 0;
    this.vx = 0;
    this.tilt = 0;

    // Reset de controles táctiles móviles
    this.isTouching = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.currentTouchX = 0;
    this.currentTouchY = 0;
    this.touchSteerAxis = 0;

    this.cameraX = -w / 2;
    this.cameraY = -h * 0.35;

    this.currentPose = "straight";
    this.crashTimer = 0;

    this.isAirborne = false;
    this.airTimer = 0;
    this.airSpin = 0;

    this.turboTimer = 0;
    this.invulnerableTimer = 0;

    this.downhillSpeed = this.baseSpeed;
    this.distanceMeters = 0;
    this.combo = 0;

    // Escalamiento y Racha Limpia
    this.mountainSector = 0;
    this.cleanStreakTime = 0;
    this.cleanStreakTier = 0;
    this.speedLines = [];

    // Supervivencia por vidas: SIN límite de tiempo
    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;
    this.timeRemaining = 999999; // Desactivar límite de tiempo arcade

    // Yeti de Nieve: Aparece en Pista Azul (350m, ~12s de juego)
    this.yetiActive = false;
    this.yetiWorldX = 0;
    this.yetiWorldY = -300;
    this.yetiAnimTimer = 0;
    this.yetiStunnedTimer = 0;
    this.yetiChaseTimer = 0;
    this.nextYetiDistance = 350;
    this.yetiWarningAlpha = 0;

    // Ritmo de pista equilibrado
    this.lastRampY = -999;
    this.lastGateY = -999;
    this.gateBoostTimer = 0;

    this.entities = [];
    this.tracks = [];
    this.snowSpray = [];
    this.ghostTrail = [];
    this.lastSpawnY = 120;
    this.trackTimer = 0;

    // Generar el primer tramo del mundo abierto equilibrado
    this.generateWorldChunkAhead(h * 2.2);

    // Controles táctiles móviles y ratón: Smooth Carving (sin saltos ni dashes raros)
    this.input.onPointerDown = (_id: number, screenX: number, screenY: number) => {
      if (!this.isRunning || this.isGameOver) return;
      this.isTouching = true;
      this.touchStartX = screenX;
      this.touchStartY = screenY;
      this.currentTouchX = screenX;
      this.currentTouchY = screenY;

      // Toque en el botón superior de Guía / Tutorial
      if (screenX >= 220 && screenX <= 350 && screenY >= 50 && screenY <= 95) {
        if (this.onOpenTutorial) {
          this.onOpenTutorial();
          return;
        }
      }

      // Al tocar a los lados de la pantalla, comenzar giro suave intuitivo
      const screenMid = (this.width || 1024) / 2;
      const offset = screenX - screenMid;
      if (Math.abs(offset) > 35) {
        this.touchSteerAxis = Math.sign(offset) * 0.6;
      } else {
        this.touchSteerAxis = 0;
      }
    };

    this.input.onPointerMove = (_id: number, screenX: number, screenY: number) => {
      if (!this.isTouching || !this.isRunning || this.isGameOver) return;
      this.currentTouchX = screenX;
      this.currentTouchY = screenY;

      // Arrastre relativo suave con el pulgar / ratón (control analógico de carving)
      const dragDiff = this.currentTouchX - this.touchStartX;
      const deadZone = 6;
      const fullDeflection = 70; // 70px de arrastre = 100% de fuerza de giro

      if (Math.abs(dragDiff) > deadZone) {
        const sign = Math.sign(dragDiff);
        const mag = Math.min(1.0, (Math.abs(dragDiff) - deadZone) / (fullDeflection - deadZone));
        this.touchSteerAxis = sign * mag;

        // Ancla flotante: permite arrastrar de forma continua sin topar con el borde
        if (Math.abs(dragDiff) > fullDeflection + 15) {
          this.touchStartX = this.currentTouchX - sign * (fullDeflection + 15);
        }
      } else {
        this.touchSteerAxis = 0;
      }
    };

    this.input.onPointerUp = () => {
      this.isTouching = false;
      this.touchSteerAxis = 0;
    };

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.addFloatingText("¡MUNDO ABIERTO ALPINO!", w / 2, h * 0.45, "#FFD700", 1.45);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
    this.input.onPointerUp = undefined;
  }

  /**
   * Genera pista alpina equilibrada, limpia y legible (Estilo SkiFree / Edge Surf)
   * Sin saturación, con carriles naturales de esquí y separación anti-solapamiento.
   */
  private generateWorldChunkAhead(targetY: number): void {
    const w = this.width || 1024;
    const playWidth = w * 0.92; // Zona activa centrada de descenso

    while (this.lastSpawnY < targetY) {
      // Separación vertical según el sector de dificultad (Escalamiento progresivo)
      // Verde: 135-170px (fácil/abierto), Azul: 122-155px, Roja: 110-142px, Negra: 98-130px (técnico)
      const baseSpacing = this.mountainSector === 0 ? 135 : (this.mountainSector === 1 ? 122 : (this.mountainSector === 2 ? 110 : 98));
      this.lastSpawnY += baseSpacing + Math.random() * 32;
      const spawnY = this.lastSpawnY;

      // 1. Bosque en los flancos exteriores lejanos de la montaña
      const leftTreeX = this.worldX - (w * 0.58 + Math.random() * (w * 0.35));
      const rightTreeX = this.worldX + (w * 0.58 + Math.random() * (w * 0.35));
      const leftTreeW = 110 + Math.random() * 30;
      const rightTreeW = 110 + Math.random() * 30;

      this.entities.push({
        id: this.nextEntityId++,
        x: leftTreeX,
        y: spawnY + (Math.random() - 0.5) * 20,
        w: leftTreeW,
        h: leftTreeW * 1.35,
        kind: "tree",
        collected: false
      });

      this.entities.push({
        id: this.nextEntityId++,
        x: rightTreeX,
        y: spawnY + (Math.random() - 0.5) * 20,
        w: rightTreeW,
        h: rightTreeW * 1.35,
        kind: "tree",
        collected: false
      });

      // Chalet alpino ocasional únicamente en los márgenes exteriores (cada ~800px)
      if (Math.random() < 0.14 && spawnY > 400) {
        const chaletSide = Math.random() < 0.5 ? -1 : 1;
        const chaletX = this.worldX + chaletSide * (w * 0.62 + Math.random() * (w * 0.22));
        this.entities.push({
          id: this.nextEntityId++,
          x: chaletX,
          y: spawnY,
          w: 145,
          h: 130,
          kind: "chalet",
          collected: false
        });
      }

      // Carteles de patrocinadores y de la Feria Mágica en los flancos de la pista alpina
      if (Math.random() < 0.44 && spawnY > 200) {
        const isLeft = (this.nextBillboardIdx % 2 === 0);
        const bbX = isLeft
          ? this.worldX - (playWidth * 0.48 + 10 + Math.random() * 25)
          : this.worldX + (playWidth * 0.48 - 128 + Math.random() * 25);
        this.entities.push({
          id: this.nextEntityId++,
          x: bbX,
          y: spawnY,
          w: 138,
          h: 96,
          kind: "billboard",
          collected: false,
          sponsorIdx: (this.nextBillboardIdx++) % this.sponsors.length
        });
      }

      // Montículos decorativos de nieve suave (Snowdrifts) que embellecen la pista
      if (Math.random() < 0.42) {
        const driftX = this.worldX + (Math.random() - 0.5) * (playWidth * 0.9);
        this.entities.push({
          id: this.nextEntityId++,
          x: driftX,
          y: spawnY + (Math.random() - 0.5) * 35,
          w: 110 + Math.random() * 35,
          h: 38 + Math.random() * 10,
          kind: "snowdrift",
          collected: false
        });
      }

      // 2. Elementos activos en la pista de esquí: SÓLO 1 o 2 elementos por fila (limpio y equilibrado)
      const itemCount = Math.random() < 0.45 ? 1 : 2;
      for (let i = 0; i < itemCount; i++) {
        const spawnX = this.worldX + (Math.random() - 0.5) * playWidth;

        // Comprobación anti-solapamiento estricta: al menos 130px en X y 110px en Y
        const collides = this.entities.some(
          (e) => Math.abs(e.y - spawnY) < 110 && Math.abs(e.x - spawnX) < 130
        );
        if (collides) continue;

        // Control de espaciado para rampas y puertas de eslalon
        const canSpawnRamp = spawnY - this.lastRampY >= 580;
        const canSpawnGate = spawnY - this.lastGateY >= 380;
        const roll = Math.random();

        if (canSpawnRamp && roll < 0.22) {
          // Rampa de salto espaciada
          this.lastRampY = spawnY;
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX,
            y: spawnY,
            w: 165,
            h: 130,
            kind: "ramp",
            collected: false
          });
          // Premio alineado tras el despegue para premiar el salto mortal
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX + 48,
            y: spawnY + 140,
            w: 64,
            h: 64,
            kind: Math.random() < 0.4 ? "star" : "gift",
            collected: false,
            giftIdx: Math.floor(Math.random() * this.giftImgs.length)
          });
        } else if (canSpawnGate && roll < 0.42) {
          // Puerta de eslalon festiva
          this.lastGateY = spawnY;
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX,
            y: spawnY,
            w: 190,
            h: 110,
            kind: "gate",
            collected: false
          });
        } else if (roll < 0.62) {
          // Muñeco de nieve estilizado (Sprite de alta calidad Stylized 2D Game Art)
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX,
            y: spawnY,
            w: 78,
            h: 142,
            kind: "snowman",
            collected: false
          });
        } else if (roll < 0.77) {
          // Pino nevado solitario en la ladera
          const tw = 105 + Math.random() * 25;
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX,
            y: spawnY,
            w: tw,
            h: tw * 1.35,
            kind: "tree",
            collected: false
          });
        } else if (roll < 0.86) {
          // Cristal de hielo o tronco caído
          if (Math.random() < 0.5) {
            this.entities.push({
              id: this.nextEntityId++,
              x: spawnX,
              y: spawnY,
              w: 80,
              h: 95,
              kind: "crystal",
              collected: false
            });
          } else {
            this.entities.push({
              id: this.nextEntityId++,
              x: spawnX,
              y: spawnY,
              w: 125,
              h: 75,
              kind: "log",
              collected: false
            });
          }
        } else if (roll < 0.94) {
          // Regalo satinado para acumular puntos
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX,
            y: spawnY,
            w: 60,
            h: 60,
            kind: "gift",
            collected: false,
            giftIdx: Math.floor(Math.random() * this.giftImgs.length)
          });
        } else {
          // Estrella dorada de patrocinador (Super Turbo e invulnerabilidad)
          this.entities.push({
            id: this.nextEntityId++,
            x: spawnX,
            y: spawnY,
            w: 72,
            h: 72,
            kind: "star",
            collected: false
          });
        }
      }
    }
  }

  protected onUpdate(dt: number): void {
    const w = this.width || 1024;
    const h = this.height || 768;

    // 1. Escalamiento de Dificultad Continuo: la velocidad base sube poco a poco con la distancia
    // Base inicial 310 px/s, aumentando gradualmente (+0.125 px/s por cada metro recorrido) hasta 495 px/s
    const distanceSpeedBonus = Math.min(185, this.distanceMeters * 0.125);
    const continuousBaseSpeed = 310 + distanceSpeedBonus;

    let currentSector = 0;
    if (this.distanceMeters >= 1300) {
      currentSector = 3;
    } else if (this.distanceMeters >= 750) {
      currentSector = 2;
    } else if (this.distanceMeters >= 350) {
      currentSector = 1;
    } else {
      currentSector = 0;
    }

    // Celebración y anuncio al cambiar de sector
    if (currentSector > this.mountainSector) {
      this.mountainSector = currentSector;
      this.audio.playPowerUp();
      this.triggerShake(0.22, 6);
      if (currentSector === 1) {
        this.addFloatingText("¡PISTA AZUL: AUMENTA LA PENDIENTE!", w / 2, h * 0.28, "#00E5FF", 1.45);
      } else if (currentSector === 2) {
        this.addFloatingText("¡PISTA ROJA: DESCENSO VELOZ!", w / 2, h * 0.28, "#FF9100", 1.5);
      } else if (currentSector === 3) {
        this.addFloatingText("¡PISTA NEGRA OLÍMPICA: EXTREMO!", w / 2, h * 0.28, "#FF1744", 1.55);
      }
    }

    // 2. Sistema de Racha Limpia: sube la velocidad progresivamente si esquías sin dificultades
    if (this.crashTimer <= 0) {
      this.cleanStreakTime += dt;
    }

    let streakMultiplier = 1.0;
    let newStreakTier = 0;
    if (this.cleanStreakTime >= 15.0) {
      newStreakTier = 3;
      streakMultiplier = 1.38; // +38% de velocidad y x2 en puntuación
    } else if (this.cleanStreakTime >= 8.5) {
      newStreakTier = 2;
      streakMultiplier = 1.24; // +24% de velocidad
    } else if (this.cleanStreakTime >= 4.0) {
      newStreakTier = 1;
      streakMultiplier = 1.12; // +12% de velocidad
    } else {
      newStreakTier = 0;
      streakMultiplier = 1.0;
    }

    if (newStreakTier > this.cleanStreakTier) {
      this.cleanStreakTier = newStreakTier;
      this.audio.playCatchItem(1.3 + this.cleanStreakTier * 0.15);
      if (newStreakTier === 1) {
        this.addFloatingText("¡RACHA LIMPIA! +12% VEL", w / 2, h * 0.35, "#00E5FF", 1.3);
      } else if (newStreakTier === 2) {
        this.addFloatingText("¡MOMENTUM ALPINO! +24% VEL", w / 2, h * 0.35, "#FFD700", 1.4);
      } else if (newStreakTier === 3) {
        this.addFloatingText("¡MÁXIMO FLUJO! +38% VEL (x2 PUNTOS)", w / 2, h * 0.35, "#FF6D00", 1.5);
      }
    } else if (newStreakTier < this.cleanStreakTier) {
      this.cleanStreakTier = newStreakTier;
    }

    // Velocidad continua combinada (Base progresiva continua × Racha limpia, tope maxSpeed)
    this.downhillSpeed = Math.min(this.maxSpeed, continuousBaseSpeed * streakMultiplier);

    if (this.turboTimer > 0) this.turboTimer = Math.max(0, this.turboTimer - dt);
    if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    if (this.crashTimer > 0) this.crashTimer = Math.max(0, this.crashTimer - dt);
    if (this.gateBoostTimer > 0) this.gateBoostTimer = Math.max(0, this.gateBoostTimer - dt);
    if (this.yetiWarningAlpha > 0) this.yetiWarningAlpha = Math.max(0, this.yetiWarningAlpha - dt * 1.5);

    let currentSpeed = this.downhillSpeed;
    if (this.turboTimer > 0) {
      currentSpeed *= 1.45;
    } else if (this.gateBoostTimer > 0) {
      currentSpeed *= 1.22;
    }

    // Desplazamiento y distancia
    this.distanceMeters += dt * (currentSpeed * 0.12);
    this.worldY += currentSpeed * dt;

    // Movimiento lateral en el mundo abierto (Táctil móvil suave y Teclado)
    if (this.crashTimer <= 0) {
      let steerAxis = 0;

      // Teclado
      if (this.keyLeft) steerAxis -= 1.0;
      if (this.keyRight) steerAxis += 1.0;

      // Táctil móvil / Ratón
      if (this.isTouching) {
        steerAxis += this.touchSteerAxis;
      }

      steerAxis = Math.max(-1.0, Math.min(1.0, steerAxis));

      // Velocidad lateral suave y controlada (520 px/s máximo)
      const targetVx = steerAxis * 520;

      // Aceleración e inercia realista de esquí (sin saltos ni dashes raros)
      const lerpSpeed = steerAxis !== 0 ? 12.0 : 8.0;
      this.vx += (targetVx - this.vx) * Math.min(1.0, lerpSpeed * dt);
      this.worldX += this.vx * dt;

      this.tilt = Math.max(-0.35, Math.min(0.35, (this.vx / 520) * 0.35));
    } else {
      this.vx = 0;
      this.tilt = 0;
      this.touchSteerAxis = 0;
    }

    // Actualizar Cámara centrada en Santa
    this.cameraX = this.worldX - w / 2;
    this.cameraY = this.worldY - h * 0.32;

    // Generar más terreno y entidades adelante
    if (this.worldY + h * 1.8 > this.lastSpawnY) {
      this.generateWorldChunkAhead(this.worldY + h * 2.2);
    }

    // Limpiar entidades muy lejanas detrás de la cámara
    this.entities = this.entities.filter((e) => e.y > this.cameraY - 250);

    // Salto en rampa (Mortal 360°)
    if (this.isAirborne) {
      this.airTimer -= dt;
      this.airSpin += dt * Math.PI * 2.3;
      if (this.airTimer <= 0) {
        this.isAirborne = false;
        this.audio.playCatchItem(1.4);
        this.particles.emitBurst(w / 2, h * 0.32 + 45, "#FFFFFF", 28);
      }
    }

    // Selección de sprite de Santa según la maniobra activa
    if (this.crashTimer > 0) {
      this.currentPose = "crash";
    } else if (this.isAirborne) {
      this.currentPose = "jump";
    } else if (this.vx < -55) {
      this.currentPose = "left";
    } else if (this.vx > 55) {
      this.currentPose = "right";
    } else {
      this.currentPose = "straight";
    }

    // Física profesional de nieve pulverizada (Continuous Snow Spray & Powder Plumes)
    if (!this.isAirborne && this.crashTimer <= 0) {
      if (Math.abs(this.vx) > 55) {
        // Giro fuerte / Carving: gran pluma direccional de nieve en polvo
        const spraySide = this.vx > 0 ? -1 : 1;
        for (let s = 0; s < 3; s++) {
          this.snowSpray.push({
            x: this.worldX + spraySide * 26 + (Math.random() - 0.5) * 10,
            y: this.worldY + 34 + Math.random() * 8,
            vx: spraySide * (160 + Math.random() * 180),
            vy: -40 - Math.random() * 70,
            r: 3.0 + Math.random() * 4.0,
            alpha: 0.95,
            isPuff: false
          });
        }
        // Nubes esponjosas de nieve en polvo que se abomban
        for (let p = 0; p < 2; p++) {
          this.snowSpray.push({
            x: this.worldX + spraySide * (22 + p * 8),
            y: this.worldY + 30 + Math.random() * 6,
            vx: spraySide * (60 + Math.random() * 80),
            vy: -15 - Math.random() * 30,
            r: 8.0 + Math.random() * 7.0,
            alpha: 0.75,
            isPuff: true
          });
        }
      } else {
        // Descenso recto: estela continua de polvo esponjoso detrás de cada esquí
        for (const side of [-20, 20]) {
          if (Math.random() < 0.65) {
            this.snowSpray.push({
              x: this.worldX + side + (Math.random() - 0.5) * 6,
              y: this.worldY + 36,
              vx: (Math.random() - 0.5) * 35,
              vy: -12 - Math.random() * 25,
              r: 5.5 + Math.random() * 4.5,
              alpha: 0.65,
              isPuff: true
            });
          }
        }
      }
    }

    // Actualizar física de partículas de nieve
    for (let i = this.snowSpray.length - 1; i >= 0; i--) {
      const sp = this.snowSpray[i];
      sp.x += sp.vx * dt;
      sp.vx *= Math.pow(0.2, dt); // Fricción del aire
      sp.y += (sp.vy - currentSpeed * 0.28) * dt;
      if (sp.isPuff) {
        sp.r += dt * 24; // Las nubes de nieve se abomban y expanden
        sp.alpha -= dt * 1.5;
      } else {
        sp.r += dt * 4.5;
        sp.alpha -= dt * 2.2;
      }
      if (sp.alpha <= 0) this.snowSpray.splice(i, 1);
    }

    // Estela fantasma durante Turbo (espaciada limpiamente para evitar apilamiento)
    if (this.turboTimer > 0 && this.crashTimer <= 0) {
      this.ghostSpawnTimer += dt;
      if (this.ghostSpawnTimer >= 0.08) {
        this.ghostSpawnTimer = 0;
        this.ghostTrail.push({
          x: this.worldX,
          y: this.worldY,
          pose: this.currentPose,
          tilt: this.tilt,
          alpha: 0.38
        });
      }
    } else {
      this.ghostSpawnTimer = 0;
    }

    for (let i = this.ghostTrail.length - 1; i >= 0; i--) {
      const g = this.ghostTrail[i];
      g.alpha -= dt * 2.5;
      if (g.alpha <= 0) this.ghostTrail.splice(i, 1);
    }

    // Líneas de velocidad de viento cuando hay racha alta o turbo
    if (this.cleanStreakTier >= 2 || this.turboTimer > 0) {
      if (Math.random() < (this.cleanStreakTier === 3 || this.turboTimer > 0 ? 0.6 : 0.3)) {
        this.speedLines.push({
          x: Math.random() * w,
          y: h + 15,
          l: 45 + Math.random() * 55,
          vy: 850 + Math.random() * 300,
          alpha: 0.65
        });
      }
    }

    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const sl = this.speedLines[i];
      sl.y -= sl.vy * dt;
      sl.alpha -= dt * 1.4;
      if (sl.y < -sl.l || sl.alpha <= 0) {
        this.speedLines.splice(i, 1);
      }
    }

    // Huellas continuas en la nieve en coordenadas de mundo
    this.trackTimer += dt;
    if (this.trackTimer > 0.022 && !this.isAirborne && this.crashTimer <= 0) {
      this.trackTimer = 0;
      const skiOffset = 22;
      const isCarving = Math.abs(this.vx) > 55;
      this.tracks.push({
        x1: this.worldX - skiOffset,
        y1: this.worldY + 32,
        x2: this.worldX + skiOffset,
        y2: this.worldY + 32,
        alpha: 0.85,
        carve: isCarving
      });
    }

    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const tr = this.tracks[i];
      tr.alpha -= dt * 0.35;
      if (tr.alpha <= 0 || tr.y1 < this.cameraY - 80) {
        this.tracks.splice(i, 1);
      }
    }

    // ========================================================================
    // LÓGICA DEL MONSTRUO YETI DE NIEVE (Persecución estilo Edge Surf / SkiFree)
    // ========================================================================
    if (!this.yetiActive && this.distanceMeters >= this.nextYetiDistance) {
      this.yetiActive = true;
      this.yetiWorldX = this.worldX + (Math.random() < 0.5 ? -110 : 110);
      // Aparece entrando por la parte superior visible de la pantalla
      this.yetiWorldY = this.cameraY + 30;
      this.yetiSpeed = currentSpeed * 1.06;
      this.yetiStunnedTimer = 0;
      this.yetiChaseTimer = 9.0; // Persecución de 9 segundos: ¡si sobrevives o lo esquivas, escapas!
      this.yetiWarningAlpha = 2.5;
      this.audio.playRunnerHit();
      this.triggerShake(0.5, 12);
      this.particles.emitBurst(w / 2, 80, "#E0F7FA", 35);
      this.addFloatingText("¡EL YETI DE NIEVE!", w / 2, h * 0.22, "#FF1744", 1.6);
    }

    if (this.yetiActive) {
      this.yetiAnimTimer += dt * 8;

      if (this.yetiStunnedTimer > 0) {
        this.yetiStunnedTimer -= dt;
        // Si Santa se aleja mucho mientras el Yeti está aturdido, el Yeti se retira
        if (this.worldY - this.yetiWorldY > h * 1.5) {
          this.yetiActive = false;
          this.nextYetiDistance = this.distanceMeters + 420; // Vuelve en 420m
        }
      } else {
        // Reducir temporizador de persecución (si sobrevives 9s, escapas)
        this.yetiChaseTimer -= dt;
        if (this.yetiChaseTimer <= 0) {
          this.yetiActive = false;
          this.nextYetiDistance = this.distanceMeters + 450;
          this.addScore(500);
          this.audio.playPowerUp();
          this.triggerShake(0.2, 6);
          this.particles.emitBurst(w / 2, h * 0.32, "#00E5FF", 28);
          this.addFloatingText("¡ESCAPASTE DEL YETI! +500", w / 2, h * 0.25, "#00E5FF", 1.5);
        } else {
          // El Yeti persigue hacia la posición de Santa con INERCIA REALISTA (1.35 en vez de 3.0)
          // Esto permite que al hacer giros cerrados (carving), Santa lo esquive limpiamente
          const ydx = this.worldX - this.yetiWorldX;
          this.yetiWorldX += ydx * 1.35 * dt;

          // Velocidad del Yeti: si está algo lejos acelera para verse, pero si Santa usa turbo se le escapa
          const distY = this.worldY - this.yetiWorldY;
          if (distY > 170) {
            this.yetiSpeed = currentSpeed * 1.18;
          } else {
            this.yetiSpeed = Math.max(this.downhillSpeed * 1.05, currentSpeed * 0.98);
          }
          this.yetiWorldY += this.yetiSpeed * dt;

          // Huellas / pisadas del Yeti en la nieve
          if (Math.random() < 0.22) {
            const footSide = Math.random() > 0.5 ? 26 : -26;
            this.tracks.push({
              x1: this.yetiWorldX + footSide - 9,
              y1: this.yetiWorldY + 45,
              x2: this.yetiWorldX + footSide + 9,
              y2: this.yetiWorldY + 45,
              alpha: 0.95
            });
          }

          // MECÁNICA DE ESQUIVE: Si el Yeti choca contra un obstáculo (árbol, roca, muñeco, tronco), ¡tropieza!
          for (const ent of this.entities) {
            if (ent.collected) continue;
            if (
              ent.kind === "tree" ||
              ent.kind === "snowman" ||
              ent.kind === "log" ||
              ent.kind === "crystal" ||
              ent.kind === "chalet"
            ) {
              const entMidX = ent.x + ent.w / 2;
              const entMidY = ent.y + ent.h / 2;
              const hitDist = Math.hypot(this.yetiWorldX - entMidX, this.yetiWorldY - entMidY);
              if (hitDist < 62) {
                this.yetiStunnedTimer = 3.2;
                this.addScore(350);
                this.audio.playRunnerHit();
                this.triggerShake(0.35, 12);
                this.particles.emitBurst(
                  this.yetiWorldX - this.cameraX,
                  this.yetiWorldY - this.cameraY,
                  "#FFFFFF",
                  30
                );
                this.addFloatingText("¡EL YETI TROPEZÓ! +350", w / 2, h * 0.28, "#00E5FF", 1.45);
                break;
              }
            }
          }

          // Comprobar si el Yeti atrapa a Santa
          const distToSanta = Math.hypot(this.worldX - this.yetiWorldX, this.worldY - this.yetiWorldY);

          if (distToSanta < 68) {
            if (this.isAirborne) {
              // Santa saltó por el aire por encima del Yeti: ¡Salvado acrobático!
              this.yetiStunnedTimer = 2.5;
              this.addScore(400);
              this.audio.playCatchItem(1.5);
              this.triggerShake(0.25, 8);
              this.particles.emitBurst(w / 2, h * 0.32, "#00E5FF", 28);
              this.addFloatingText("¡VOLTERETA SOBRE EL YETI! +400", w / 2, h * 0.28, "#00E5FF", 1.45);
            } else if (this.turboTimer > 0) {
              // Con Super Turbo Dorado, Santa noquea al Yeti
              this.yetiStunnedTimer = 4.5;
              this.addScore(600);
              this.audio.playRunnerHit();
              this.triggerShake(0.4, 14);
              this.particles.emitBurst(w / 2, h * 0.32, "#FFD700", 40);
              this.addFloatingText("¡YETI NOQUEADO! +600", w / 2, h * 0.28, "#FFD700", 1.5);
            } else if (this.invulnerableTimer <= 0) {
              // El Yeti atrapa a Santa: pierde 1 vida, se corta la racha y el Yeti se marea temporalmente
              const hadStreak = this.cleanStreakTier > 0;
              this.cleanStreakTime = 0;
              this.cleanStreakTier = 0;
              this.lives = Math.max(0, this.lives - 1);
              this.invulnerableTimer = 2.5;
              this.crashTimer = 1.2;
              this.yetiStunnedTimer = 3.2;
              this.combo = 0;
              this.audio.playElfHit();
              this.triggerShake(0.45, 14);
              this.particles.emitBurst(w / 2, h * 0.32, "#FFFFFF", 36);
              this.addFloatingText(hadStreak ? "¡RACHA PERDIDA! -1" : "¡EL YETI TE ATRAPÓ! -1", w / 2, h * 0.28, "#FF1744", 1.45);

              if (this.lives <= 0) {
                this.endGame();
                return;
              }
            }
          }
        }
      }
    }

    // ========================================================================
    // COLISIONES CON ENTIDADES DEL MUNDO
    // ========================================================================
    const santaBox = {
      x: this.worldX - 42,
      y: this.worldY - 25,
      w: 84,
      h: 80
    };

    for (const ent of this.entities) {
      if (ent.collected) continue;

      if (ent.kind === "snowdrift") {
        if (
          !ent.collected &&
          this.worldX >= ent.x - 15 &&
          this.worldX <= ent.x + ent.w + 15 &&
          this.worldY >= ent.y - 10 &&
          this.worldY <= ent.y + ent.h + 10
        ) {
          ent.collected = true;
          this.particles.emitBurst(w / 2, h * 0.32 + 20, "#FFFFFF", 12);
        }
      } else if (ent.kind === "gate") {
        if (
          santaBox.y + santaBox.h >= ent.y + 20 &&
          santaBox.y <= ent.y + ent.h &&
          this.worldX >= ent.x + 20 &&
          this.worldX <= ent.x + ent.w - 20
        ) {
          ent.collected = true;
          this.combo++;
          this.gateBoostTimer = 1.6; // Impulso de aceleración por pasar la puerta
          this.cleanStreakTime += 2.5; // Buen eslalon suma tiempo a la racha
          const multiplier = this.cleanStreakTier === 3 ? 2 : 1;
          const gatePoints = (150 + this.combo * 50) * multiplier;
          this.addScore(gatePoints);
          this.audio.playCatchItem(1.2 + Math.min(0.6, this.combo * 0.1));
          this.particles.emitBurst(w / 2, h * 0.32, "#FFD700", 20);
          this.addFloatingText(`¡ESLALON x${this.combo}! TURBO`, w / 2, h * 0.25, "#FFD700", 1.35);
        }
      } else if (ent.kind === "ramp") {
        if (
          !this.isAirborne &&
          this.worldX >= ent.x - 20 &&
          this.worldX <= ent.x + ent.w + 20 &&
          this.worldY + 30 >= ent.y &&
          this.worldY <= ent.y + ent.h
        ) {
          ent.collected = true;
          this.isAirborne = true;
          this.airTimer = this.airDuration;
          this.airSpin = 0;
          this.cleanStreakTime += 3.0; // Gran salto suma a la racha
          this.audio.playRunnerJump();
          const multiplier = this.cleanStreakTier === 3 ? 2 : 1;
          this.addScore(300 * multiplier);
          this.particles.emitBurst(w / 2, h * 0.32, "#00E5FF", 28);
          this.addFloatingText("¡GRAN SALTO 360°! +300", w / 2, h * 0.25, "#00E5FF", 1.4);
        }
      } else if (ent.kind === "gift") {
        if (
          this.worldX >= ent.x - 25 &&
          this.worldX <= ent.x + ent.w + 25 &&
          this.worldY >= ent.y - 25 &&
          this.worldY <= ent.y + ent.h + 25
        ) {
          ent.collected = true;
          const multiplier = this.cleanStreakTier === 3 ? 2 : 1;
          this.addScore(100 * multiplier);
          this.audio.playCatchItem(1.1);
          this.particles.emitBurst(w / 2, h * 0.32, "#FFD700", 12);
        }
      } else if (ent.kind === "star") {
        if (
          this.worldX >= ent.x - 25 &&
          this.worldX <= ent.x + ent.w + 25 &&
          this.worldY >= ent.y - 25 &&
          this.worldY <= ent.y + ent.h + 25
        ) {
          ent.collected = true;
          this.turboTimer = 6.0;
          this.cleanStreakTime += 4.0;
          const multiplier = this.cleanStreakTier === 3 ? 2 : 1;
          this.addScore(250 * multiplier);
          this.audio.playPowerUp();
          this.particles.emitConfetti(w, 32);
          const sponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
          this.triggerLogoPowerUp(sponsor.id, 6);
          this.addFloatingText("¡SUPER TURBO DORADO!", w / 2, h * 0.25, "#FFD700", 1.4);
        }
      } else {
        // Obstáculos sólidos (árboles, muñecos de nieve, carteles de madera, cristales, troncos, chalets)
        const isSnowman = ent.kind === "snowman";
        const isBillboard = ent.kind === "billboard";
        const colW = ent.w * (isSnowman ? 0.52 : (isBillboard ? 0.88 : 0.62));
        const colH = ent.h * (isSnowman ? 0.55 : (isBillboard ? 0.85 : 0.62));
        const colX = ent.x + (ent.w - colW) / 2;
        const colY = isBillboard ? ent.y + 10 : ent.y + (ent.h - colH) / 2;

        const sLeft = this.worldX - 26;
        const sRight = this.worldX + 26;
        const sTop = this.worldY - 20;
        const sBottom = this.worldY + 26;

        if (
          sRight >= colX &&
          sLeft <= colX + colW &&
          sBottom >= colY &&
          sTop <= colY + colH
        ) {
          if (this.isAirborne) continue;

          if (this.turboTimer > 0) {
            ent.collected = true;
            if (isBillboard) {
              this.addScore(250);
              this.audio.playRunnerHit();
              this.triggerShake(0.26, 8);
              this.particles.emitBurst(w / 2, h * 0.32, "#FFD700", 24);
              this.particles.emitBurst(w / 2, h * 0.32, "#6D4C41", 16);
              this.addFloatingText("¡CARTEL DEMOLIDO! +250", w / 2, h * 0.25, "#FFD700", 1.3);
            } else {
              this.addScore(200);
              this.audio.playRunnerHit();
              this.particles.emitBurst(w / 2, h * 0.32, "#FFD700", 22);
              this.addFloatingText("¡DEMOLICIÓN! +200", w / 2, h * 0.25, "#FFD700", 1.2);
            }
          } else if (this.invulnerableTimer <= 0) {
            const hadStreak = this.cleanStreakTier > 0;
            this.cleanStreakTime = 0;
            this.cleanStreakTier = 0;
            ent.collected = true;
            this.lives = Math.max(0, this.lives - 1);
            this.invulnerableTimer = 2.0;
            this.crashTimer = 1.1;
            this.combo = 0;
            this.audio.playElfHit();
            this.triggerShake(0.35, 12);
            if (isBillboard) {
              this.particles.emitBurst(w / 2, h * 0.32, "#6D4C41", 20);
              this.particles.emitBurst(w / 2, h * 0.32, "#A1887F", 16);
              this.particles.emitBurst(w / 2, h * 0.32, "#FFFFFF", 20);
              this.addFloatingText("¡CHOQUE CON CARTEL! -1", w / 2, h * 0.25, "#FF5252", 1.35);
            } else {
              this.particles.emitBurst(w / 2, h * 0.32, "#FFFFFF", 32);
              this.addFloatingText(hadStreak ? "¡RACHA PERDIDA! -1" : "¡GOLPE EN LA NIEVE! -1", w / 2, h * 0.25, "#FF5252", 1.35);
            }

            if (this.lives <= 0) {
              this.endGame();
              return;
            }
          }
        }
      }
    }

    // Copos de nieve multicapa (polvo fino, cristales estrellados y bokeh desenfocado)
    const animT = performance.now() * 0.001;
    for (const flake of this.snowFlakes) {
      const layerSpeedMul = flake.layer === 0 ? 0.3 : (flake.layer === 1 ? 0.55 : 0.95);
      flake.y += (flake.vy + currentSpeed * layerSpeedMul) * dt;
      flake.x += (flake.vx + Math.sin(animT * 1.8 + flake.y * 0.02) * 14) * dt;
      flake.rotation += flake.rotSpeed * dt;

      if (flake.y > h + 30) {
        flake.y = -20;
        flake.x = Math.random() * w;
      } else if (flake.x < -30) {
        flake.x = w + 20;
      } else if (flake.x > w + 30) {
        flake.x = -20;
      }
    }

    // Ráfagas y ventiscas de polvo alpino (Snow Wind Wisps)
    for (const wisp of this.windWisps) {
      wisp.x += wisp.speed * 0.65 * dt;
      wisp.y += (wisp.speed * 0.25 + currentSpeed * 0.35) * dt;
      if (wisp.x > w + 250 || wisp.y > h + 150) {
        wisp.x = -200 - Math.random() * 200;
        wisp.y = Math.random() * (h * 0.85);
        wisp.len = 110 + Math.random() * 160;
        wisp.alpha = 0.16 + Math.random() * 0.22;
      }
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const t = performance.now() * 0.001;

    // 1. Fondo de nieve alpina suave y degradado atmosférico de alta montaña (SIN REJILLA)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#F5FAFE");
    bgGrad.addColorStop(0.5, "#ECF4FA");
    bgGrad.addColorStop(1, "#E0EFF8");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // Lomas y ondulaciones suaves de nieve virgen (Snow Swells & Dunes procedurales)
    const swellStep = 220;
    const swellOffsetY = -((this.cameraY * 0.75) % swellStep);
    for (let sy = swellOffsetY - swellStep; sy < h + swellStep; sy += swellStep) {
      const swellIdx = Math.floor((sy - swellOffsetY + this.cameraY * 0.75) / swellStep);
      const waveShift = Math.sin(swellIdx * 1.7) * 45;
      const gradSwell = ctx.createLinearGradient(0, sy, 0, sy + 75);
      gradSwell.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      gradSwell.addColorStop(0.4, "rgba(225, 240, 252, 0.45)");
      gradSwell.addColorStop(1, "rgba(210, 232, 248, 0)");

      ctx.fillStyle = gradSwell;
      ctx.beginPath();
      ctx.moveTo(-50, sy + 25);
      ctx.bezierCurveTo(
        w * 0.25 + waveShift,
        sy - 15,
        w * 0.65 - waveShift,
        sy + 45,
        w + 50,
        sy + 10
      );
      ctx.lineTo(w + 50, sy + 85);
      ctx.lineTo(-50, sy + 85);
      ctx.closePath();
      ctx.fill();
    }

    // Bordes de nieve virgen acumulada a los lados de la pista (Alpine Off-Piste Snowbanks)
    const trackHalfW = 460;
    const leftBorderScreen = -trackHalfW - this.cameraX;
    const rightBorderScreen = trackHalfW - this.cameraX;

    // Banco de nieve profundo izquierdo
    if (leftBorderScreen > -250 && leftBorderScreen < w + 250) {
      const bankGrad = ctx.createLinearGradient(leftBorderScreen - 120, 0, leftBorderScreen + 80, 0);
      bankGrad.addColorStop(0, "#D0E5F5");
      bankGrad.addColorStop(0.6, "#E4F1FA");
      bankGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = bankGrad;
      ctx.fillRect(leftBorderScreen - 400, 0, 480, h);

      const lobeStep = 130;
      const lobeOffsetY = -((this.cameraY * 0.9) % lobeStep);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let ly = lobeOffsetY - lobeStep; ly < h + lobeStep; ly += lobeStep) {
        ctx.beginPath();
        ctx.ellipse(leftBorderScreen, ly, 45, 30, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Banco de nieve profundo derecho
    if (rightBorderScreen > -250 && rightBorderScreen < w + 250) {
      const bankGrad = ctx.createLinearGradient(rightBorderScreen - 80, 0, rightBorderScreen + 120, 0);
      bankGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      bankGrad.addColorStop(0.4, "#E4F1FA");
      bankGrad.addColorStop(1, "#D0E5F5");
      ctx.fillStyle = bankGrad;
      ctx.fillRect(rightBorderScreen, 0, 400, h);

      const lobeStep = 130;
      const lobeOffsetY = -((this.cameraY * 0.9) % lobeStep);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let ly = lobeOffsetY - lobeStep; ly < h + lobeStep; ly += lobeStep) {
        ctx.beginPath();
        ctx.ellipse(rightBorderScreen, ly, 45, 30, -0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Textura de pisanieves ultra-suave y elegante (micro-líneas sutiles sin efecto rejilla)
    ctx.strokeStyle = "rgba(185, 220, 245, 0.10)";
    ctx.lineWidth = 1.2;
    const groomerStep = 36;
    const groomerOffsetX = -((this.cameraX * 0.95) % groomerStep);
    for (let gx = groomerOffsetX - groomerStep; gx < w + groomerStep * 2; gx += groomerStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    // Destellos de diamantes de nieve centelleantes bajo el sol
    for (let s = 0; s < 36; s++) {
      const spkWorldX = (s * 197) % 1800;
      const spkWorldY = (s * 283) % 2400;
      const spkScreenX = ((spkWorldX - this.cameraX * 0.85) % w + w) % w;
      const spkScreenY = ((spkWorldY - this.cameraY * 0.85) % h + h) % h;
      const pulse = Math.sin(t * 4.0 + s * 1.3) * 0.5 + 0.5;
      if (pulse > 0.38) {
        const glow = pulse * 0.95;
        ctx.fillStyle = `rgba(255, 255, 255, ${glow})`;
        ctx.beginPath();
        ctx.arc(spkScreenX, spkScreenY, 1.8 + pulse * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(160, 215, 255, ${glow * 0.85})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(spkScreenX - 5.0 * pulse, spkScreenY);
        ctx.lineTo(spkScreenX + 5.0 * pulse, spkScreenY);
        ctx.moveTo(spkScreenX, spkScreenY - 5.0 * pulse);
        ctx.lineTo(spkScreenX, spkScreenY + 5.0 * pulse);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Huellas continuas talladas en la nieve (Ski Carving Trenches)
    if (this.tracks.length >= 2) {
      ctx.save();
      for (let i = 1; i < this.tracks.length; i++) {
        const p0 = this.tracks[i - 1];
        const p1 = this.tracks[i];
        const a = (p0.alpha + p1.alpha) * 0.5;
        if (a <= 0.02) continue;

        const dy = Math.abs(p1.y1 - p0.y1);
        if (dy > 80) continue;

        const p0x1 = p0.x1 - this.cameraX;
        const p0y1 = p0.y1 - this.cameraY;
        const p1x1 = p1.x1 - this.cameraX;
        const p1y1 = p1.y1 - this.cameraY;

        const p0x2 = p0.x2 - this.cameraX;
        const p0y2 = p0.y2 - this.cameraY;
        const p1x2 = p1.x2 - this.cameraX;
        const p1y2 = p1.y2 - this.cameraY;

        const isCarve = p1.carve;
        const trackW = isCarve ? 6.5 : 4.0;

        // Surco de nieve compactada y sombra azul hielo
        ctx.strokeStyle = `rgba(120, 180, 225, ${a * 0.75})`;
        ctx.lineWidth = trackW;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(p0x1, p0y1);
        ctx.lineTo(p1x1, p1y1);
        ctx.moveTo(p0x2, p0y2);
        ctx.lineTo(p1x2, p1y2);
        ctx.stroke();

        // Surco interior más profundo
        ctx.strokeStyle = `rgba(75, 140, 195, ${a * 0.45})`;
        ctx.lineWidth = trackW * 0.45;
        ctx.beginPath();
        ctx.moveTo(p0x1, p0y1);
        ctx.lineTo(p1x1, p1y1);
        ctx.moveTo(p0x2, p0y2);
        ctx.lineTo(p1x2, p1y2);
        ctx.stroke();

        // Borde elevado de nieve en polvo pulverizada blanca
        ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p0x1 + (isCarve ? 2 : 1), p0y1);
        ctx.lineTo(p1x1 + (isCarve ? 2 : 1), p1y1);
        ctx.moveTo(p0x2 - (isCarve ? 2 : 1), p0y2);
        ctx.lineTo(p1x2 - (isCarve ? 2 : 1), p1y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Entidades del mundo abierto (ordenadas por Y para oclusión 2.5D perfecta)
    // Filtramos solo las que están en el campo de visión de la cámara
    const visibleEntities = this.entities.filter(
      (e) =>
        e.x + e.w > this.cameraX - 100 &&
        e.x < this.cameraX + w + 100 &&
        e.y + e.h > this.cameraY - 100 &&
        e.y < this.cameraY + h + 150
    );

    visibleEntities.sort((a, b) => a.y - b.y);

    for (const ent of visibleEntities) {
      if (ent.collected) continue;

      const sx = ent.x - this.cameraX;
      const sy = ent.y - this.cameraY;

      if (ent.kind === "billboard") {
        this.drawSponsorBillboard(ctx, sx, sy, ent.w, ent.h, ent.sponsorIdx ?? 0);
      } else if (ent.kind === "snowdrift") {
        this.drawSnowDrift(ctx, sx, sy, ent.w, ent.h);
      } else if (ent.kind === "gate") {
        if (imgReady(this.gateImg)) {
          drawFitted(ctx, this.gateImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "ramp") {
        this.drawDownhillRamp(ctx, sx, sy, ent.w, ent.h, t);
      } else if (ent.kind === "tree") {
        // Montículo de nieve esponjosa al pie del árbol
        ctx.fillStyle = "rgba(70, 115, 160, 0.30)";
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 4, ent.w * 0.44, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        const treeSnowGrad = ctx.createLinearGradient(sx, sy + ent.h - 16, sx, sy + ent.h);
        treeSnowGrad.addColorStop(0, "#FFFFFF");
        treeSnowGrad.addColorStop(1, "#D0E6F6");
        ctx.fillStyle = treeSnowGrad;
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 8, ent.w * 0.36, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        if (imgReady(this.treeImg)) {
          drawFitted(ctx, this.treeImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "snowman") {
        // Sombra suave en la nieve bajo el muñeco
        ctx.fillStyle = "rgba(45, 75, 125, 0.35)";
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 6, ent.w * 0.44, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        if (imgReady(this.snowmanImg)) {
          drawFitted(ctx, this.snowmanImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "crystal") {
        // Sombra de contacto en la nieve para el cristal
        ctx.fillStyle = "rgba(45, 75, 125, 0.32)";
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 5, ent.w * 0.42, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        if (imgReady(this.crystalImg)) {
          drawFitted(ctx, this.crystalImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "log") {
        // Sombra y montículo de nieve de contacto para el tronco
        ctx.fillStyle = "rgba(45, 75, 125, 0.40)";
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 4, ent.w * 0.46, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(220, 240, 255, 0.90)";
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 6, ent.w * 0.38, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        if (imgReady(this.logImg)) {
          drawFitted(ctx, this.logImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "chalet") {
        ctx.fillStyle = "rgba(40, 70, 110, 0.38)";
        ctx.beginPath();
        ctx.ellipse(sx + ent.w / 2, sy + ent.h - 6, ent.w * 0.48, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        if (imgReady(this.chaletImg)) {
          drawFitted(ctx, this.chaletImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "gift") {
        const gIdx = ent.giftIdx ?? 0;
        const gImg = this.giftImgs[gIdx];
        if (imgReady(gImg)) {
          drawFitted(ctx, gImg, sx, sy, ent.w, ent.h);
        }
      } else if (ent.kind === "star") {
        if (imgReady(this.starImg)) {
          const pulse = 1 + Math.sin(t * 8) * 0.12;
          ctx.save();
          ctx.translate(sx + ent.w / 2, sy + ent.h / 2);
          ctx.scale(pulse, pulse);
          drawFitted(ctx, this.starImg, -ent.w / 2, -ent.h / 2, ent.w, ent.h);
          ctx.restore();
        }
      }
    }



    // 5. Partículas de spray de nieve y nubes de polvo (Snow Carving Powder Puffs)
    ctx.save();
    for (const sp of this.snowSpray) {
      const spx = sp.x - this.cameraX;
      const spy = sp.y - this.cameraY;
      if (sp.isPuff) {
        const puffGrad = ctx.createRadialGradient(spx, spy, 0, spx, spy, sp.r);
        puffGrad.addColorStop(0, `rgba(255, 255, 255, ${sp.alpha * 0.85})`);
        puffGrad.addColorStop(0.5, `rgba(240, 248, 255, ${sp.alpha * 0.45})`);
        puffGrad.addColorStop(1, "rgba(220, 240, 255, 0)");
        ctx.fillStyle = puffGrad;
        ctx.beginPath();
        ctx.arc(spx, spy, sp.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha})`;
        ctx.beginPath();
        ctx.arc(spx, spy, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 6. Oclusión 2.5D Dinámica: quien esté más abajo en la colina va al frente
    const santaScreenX = this.worldX - this.cameraX;
    const santaScreenY = this.worldY - this.cameraY;

    if (this.yetiActive && this.yetiWorldY > this.worldY) {
      this.drawSantaPose(ctx, santaScreenX, santaScreenY, t);
      this.drawYeti(ctx);
    } else {
      if (this.yetiActive) {
        this.drawYeti(ctx);
      }
      this.drawSantaPose(ctx, santaScreenX, santaScreenY, t);
    }

    // 7. Ráfagas y estelas de ventisca alpina (Wind Wisps)
    ctx.save();
    for (const wisp of this.windWisps) {
      const wGrad = ctx.createLinearGradient(wisp.x, wisp.y, wisp.x + wisp.len, wisp.y + wisp.curve);
      wGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      wGrad.addColorStop(0.3, `rgba(255, 255, 255, ${wisp.alpha})`);
      wGrad.addColorStop(0.7, `rgba(235, 248, 255, ${wisp.alpha * 0.75})`);
      wGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = wGrad;
      ctx.lineWidth = wisp.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(wisp.x, wisp.y);
      ctx.bezierCurveTo(
        wisp.x + wisp.len * 0.35,
        wisp.y + wisp.curve * 0.5 - 10,
        wisp.x + wisp.len * 0.7,
        wisp.y + wisp.curve * 0.5 + 10,
        wisp.x + wisp.len,
        wisp.y + wisp.curve
      );
      ctx.stroke();
    }
    ctx.restore();

    // 8. Nevada profesional multicapa cinematográfica
    ctx.save();
    for (const flake of this.snowFlakes) {
      if (flake.layer === 0) {
        ctx.fillStyle = `rgba(235, 245, 255, ${flake.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (flake.layer === 1) {
        ctx.save();
        ctx.translate(flake.x, flake.y);
        ctx.rotate(flake.rotation || 0);
        ctx.strokeStyle = `rgba(255, 255, 255, ${flake.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const ang = (i * Math.PI) / 3;
          const cos = Math.cos(ang) * flake.r * 1.3;
          const sin = Math.sin(ang) * flake.r * 1.3;
          ctx.moveTo(-cos, -sin);
          ctx.lineTo(cos, sin);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(0, 0, flake.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const bokehGrad = ctx.createRadialGradient(flake.x, flake.y, 0, flake.x, flake.y, flake.r);
        bokehGrad.addColorStop(0, `rgba(255, 255, 255, ${flake.alpha * 0.55})`);
        bokehGrad.addColorStop(0.6, `rgba(240, 248, 255, ${flake.alpha * 0.3})`);
        bokehGrad.addColorStop(1, "rgba(220, 240, 255, 0)");
        ctx.fillStyle = bokehGrad;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 8. Líneas de velocidad y viento (efecto de alta velocidad por racha)
    if (this.speedLines.length > 0) {
      ctx.save();
      ctx.lineWidth = 2.0;
      for (const sl of this.speedLines) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${sl.alpha})`;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x, sl.y - sl.l);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 9. HUD de Supervivencia: Sector Alpino, Racha Limpia de Velocidad y Turbos
    const distMeters = Math.floor(this.distanceMeters);
    const sectorNames = ["PISTA VERDE", "PISTA AZUL", "PISTA ROJA", "PISTA NEGRA"];
    const sectorColors = ["#00E676", "#00E5FF", "#FF9100", "#FF1744"];
    const secName = sectorNames[this.mountainSector] || "PISTA NEGRA";
    const secColor = sectorColors[this.mountainSector] || "#FF1744";

    drawPill(ctx, `${secName}: ${distMeters} m`, 125, 72, secColor, 175);
    drawPill(ctx, "❓ GUÍA [H]", 285, 72, "#00E5FF", 125);

    if (this.cleanStreakTier > 0) {
      const streakPills = ["", "⚡ RACHA +12%", "⚡ MOMENTUM +24%", "🔥 MÁXIMO FLUJO +38% (x2)"];
      const streakColors = ["", "#00E5FF", "#FFD700", "#FF6D00"];
      const text = streakPills[this.cleanStreakTier] || "";
      const col = streakColors[this.cleanStreakTier] || "#FFD700";
      drawPill(ctx, text, w / 2, 72, col, 185);
    } else if (this.combo > 1) {
      drawPill(ctx, `COMBO x${this.combo}`, w / 2, 72, "#FFD700", 150);
    }

    if (this.turboTimer > 0) {
      const turboSecs = this.turboTimer.toFixed(1);
      drawPill(ctx, `¡SUPER TURBO! ${turboSecs}s`, w - 130, 72, "#FF6D00", 170);
    } else if (this.gateBoostTimer > 0) {
      drawPill(ctx, "¡TURBO ESLALON!", w - 130, 72, "#00E5FF", 160);
    }

    // Alerta de Yeti
    if (this.yetiWarningAlpha > 0) {
      ctx.save();
      const pulseAlpha = Math.min(1, this.yetiWarningAlpha * (0.8 + Math.sin(t * 12) * 0.2));
      ctx.fillStyle = `rgba(255, 23, 68, ${pulseAlpha})`;
      ctx.font = "900 24px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("¡ALERTA: EL YETI DE NIEVE TE PERSIGUE!", w / 2, 125);
      ctx.restore();
    }

    // Guía visual táctil sutil para móvil / ratón
    if (this.isTouching && Math.abs(this.touchSteerAxis) > 0.05) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.touchStartX, this.touchStartY, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.touchStartX, this.touchStartY);
      ctx.lineTo(this.currentTouchX, this.currentTouchY);
      ctx.stroke();

      ctx.fillStyle = "rgba(0, 229, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(this.currentTouchX, this.currentTouchY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawYeti(ctx: CanvasRenderingContext2D): void {
    const yx = this.yetiWorldX - this.cameraX;
    const yy = this.yetiWorldY - this.cameraY;
    const w = this.width || 1024;

    // Si el Yeti está ligeramente arriba fuera del viewport, mostrar indicador de proximidad
    if (yy < 25) {
      const clampedX = Math.max(90, Math.min(w - 90, yx));
      const distM = Math.max(1, Math.round((this.worldY - this.yetiWorldY) * 0.1));
      drawPill(ctx, `YETI: ${distM}m ATRÁS`, clampedX, 42, "#FF1744", 150);
    }

    ctx.save();
    ctx.translate(yx, yy);

    let yetiImg = this.yetiRun1Img;
    const yd = Math.hypot(this.worldX - this.yetiWorldX, this.worldY - this.yetiWorldY);
    const isCatching = yd < 120 && (this.crashTimer > 0 || yd < 75);
    if (this.yetiStunnedTimer > 0) {
      yetiImg = this.yetiDizzyImg;
    } else if (isCatching && imgReady(this.yetiCatchImg)) {
      yetiImg = this.yetiCatchImg;
    } else {
      const step = Math.floor(this.yetiAnimTimer) % 2;
      yetiImg = step === 0 ? this.yetiRun1Img : this.yetiRun2Img;
    }

    const yw = 225;
    const yh = 245;

    // Aura gélida del Yeti
    const frostGlow = ctx.createRadialGradient(0, 10, 45, 0, 10, 130);
    frostGlow.addColorStop(0, "rgba(0, 229, 255, 0.18)");
    frostGlow.addColorStop(1, "rgba(0, 229, 255, 0)");
    ctx.fillStyle = frostGlow;
    ctx.beginPath();
    ctx.arc(0, 10, 130, 0, Math.PI * 2);
    ctx.fill();

    // Sombra del Yeti en la nieve
    ctx.fillStyle = "rgba(35, 65, 115, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 96, 75, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    if (imgReady(yetiImg)) {
      drawFitted(ctx, yetiImg, -yw / 2, -yh / 2, yw, yh);
    }

    // Estrellas mareadas si el Yeti está aturdido
    if (this.yetiStunnedTimer > 0) {
      const t = performance.now() * 0.001;
      for (let i = 0; i < 5; i++) {
        const ang = t * 6 + (i * Math.PI * 2) / 5;
        const sx = Math.cos(ang) * 58;
        const sy = -105 + Math.sin(ang) * 18;
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#FF6F00";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }



  private drawDownhillRamp(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    t: number
  ): void {
    ctx.save();
    // 1. Sombra de la elevación bajo el labio de despegue
    ctx.fillStyle = "rgba(45, 75, 125, 0.38)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 8, w * 0.48, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sprite de rampa en perspectiva
    if (imgReady(this.rampImg)) {
      drawFitted(ctx, this.rampImg, x, y, w, h);
    }

    // 3. Flechas de velocidad doradas animadas hacia abajo
    const arrowCycle = (t * 4) % 1;
    for (let i = 0; i < 3; i++) {
      const ay = y + 25 + ((i + arrowCycle) % 3) * 32;
      if (ay > y + h - 20) continue;
      ctx.strokeStyle = "rgba(255, 215, 0, 0.85)";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 20, ay - 8);
      ctx.lineTo(x + w / 2, ay + 6);
      ctx.lineTo(x + w / 2 + 20, ay - 8);
      ctx.stroke();
    }
    ctx.restore();
  }



  private drawSantaPose(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    t: number
  ): void {
    if (this.invulnerableTimer > 0 && this.crashTimer <= 0 && Math.floor(t * 18) % 2 === 0) {
      return;
    }

    // Tamaño base unificado (148 x 148) para evitar cualquier salto o popping de tamaño
    const baseW = 148;
    const baseH = 148;

    // Estela fantasma durante Super Turbo
    if (this.turboTimer > 0 && this.crashTimer <= 0) {
      for (const g of this.ghostTrail) {
        ctx.save();
        const gx = g.x - this.cameraX;
        const gy = g.y - this.cameraY;
        ctx.translate(gx, gy);
        ctx.rotate(g.tilt);
        ctx.globalAlpha = g.alpha;
        const ghostImg = this.getSpriteForPose(g.pose);
        if (imgReady(ghostImg)) {
          drawFitted(ctx, ghostImg, -baseW / 2, -baseH / 2, baseW, baseH);
        }
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Sombra en la nieve
    const shadowDist = this.isAirborne ? 55 : (this.crashTimer > 0 ? 8 : 18);
    const shadowScale = this.isAirborne ? 0.72 : 1.0;
    ctx.fillStyle = "rgba(60, 100, 150, 0.38)";
    ctx.beginPath();
    ctx.ellipse(0, shadowDist, 46 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    let activeImg = this.santaStraightImg;
    let renderW = baseW;
    let renderH = baseH;
    let offsetY = 0;

    if (this.crashTimer > 0) {
      // Choque: sprite dedicado de choque en la nieve con esquís botados
      activeImg = this.santaCrashImg;
      renderW = 156;
      renderH = 156;
      offsetY = 6;
      ctx.fillStyle = "rgba(220, 240, 255, 0.85)";
      ctx.beginPath();
      ctx.ellipse(0, 30, 56, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isAirborne) {
      // Salto acrobático en el aire: sprite de vuelo con voltereta aérea
      activeImg = this.santaJumpImg;
      const airScale = 1.0 + Math.sin((this.airTimer / this.airDuration) * Math.PI) * 0.35;
      ctx.scale(airScale, airScale);
      ctx.rotate(this.airSpin);
      renderW = 150;
      renderH = 175;
      offsetY = -12;
    } else if (this.currentPose === "left") {
      activeImg = this.santaLeftImg;
      ctx.rotate(this.tilt * 0.85);
      renderW = baseW;
      renderH = baseH;
    } else if (this.currentPose === "right") {
      activeImg = this.santaRightImg;
      ctx.rotate(this.tilt * 0.85);
      renderW = baseW;
      renderH = baseH;
    } else {
      // De frente / recto: alternancia fluida entre 2 frames de balanceo y esquís dinámicos
      const stride = Math.sin(t * 10) > 0;
      activeImg = stride && imgReady(this.santaStraight2Img) ? this.santaStraight2Img : this.santaStraightImg;
      const shudder = Math.sin(t * 14) * 0.02;
      ctx.rotate(shudder);
      renderW = baseW;
      renderH = baseH;
    }

    // Aura dorada en Super Turbo
    if (this.turboTimer > 0 && this.crashTimer <= 0) {
      const glowGrad = ctx.createRadialGradient(0, offsetY, 15, 0, offsetY, 95);
      glowGrad.addColorStop(0, "rgba(255, 215, 0, 0.85)");
      glowGrad.addColorStop(0.5, "rgba(255, 179, 0, 0.4)");
      glowGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, offsetY, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar el sprite seleccionado (mismo personaje unificado en todas las poses)
    if (imgReady(activeImg)) {
      drawFitted(ctx, activeImg, -renderW / 2, -renderH / 2 + offsetY, renderW, renderH);
    }

    // Estrellas mareadas en choque
    if (this.crashTimer > 0) {
      for (let i = 0; i < 4; i++) {
        const ang = t * 6 + (i * Math.PI * 2) / 4;
        const sx = Math.cos(ang) * 36;
        const sy = -65 + Math.sin(ang) * 12;
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#FF6F00";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawSponsorBillboard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    sponsorIdx: number = 0
  ): void {
    const sp = this.sponsors[sponsorIdx % this.sponsors.length];
    if (!sp) return;

    ctx.save();

    // 1. Sombra del cartel en la nieve
    ctx.fillStyle = "rgba(40, 70, 110, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 2, w * 0.52, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Postes de madera rústicos que sostienen el cartel
    const postW = 10;
    const postH = h * 0.45;
    const postY = y + h - postH;
    ctx.fillStyle = "#4E342E";
    ctx.fillRect(x + 18, postY, postW, postH);
    ctx.fillRect(x + w - 28, postY, postW, postH);

    ctx.fillStyle = "#3E2723";
    ctx.fillRect(x + 20, postY, 2, postH);
    ctx.fillRect(x + w - 26, postY, 2, postH);

    // Montículo de nieve en la base de los postes
    ctx.fillStyle = "rgba(235, 245, 255, 0.95)";
    ctx.beginPath();
    ctx.ellipse(x + 23, y + h, 14, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w - 23, y + h, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Tablero principal de madera
    const boardH = h * 0.72;
    const boardY = y;
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.roundRect(x, boardY, w, boardH, 8);
    ctx.fill();

    // Ribete festivo con color del patrocinador
    ctx.strokeStyle = sp.color || "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Placa interior esmaltada blanca donde va el logo
    const padX = 10;
    const padY = 8;
    const innerW = w - padX * 2;
    const innerH = boardH - padY * 2 - 8;
    const innerX = x + padX;
    const innerY = boardY + padY;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerW, innerH, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dibujar el logo del patrocinador o de la Feria centrado
    if (imgReady(sp.logo)) {
      const margin = 6;
      drawFitted(ctx, sp.logo, innerX + margin, innerY + margin, innerW - margin * 2, innerH - margin * 2);
    }

    // Listón inferior con el nombre oficial del patrocinador
    ctx.fillStyle = sp.color || "#C62828";
    ctx.beginPath();
    ctx.roundRect(x + 12, boardY + boardH - 12, w - 24, 12, 3);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sp.name.toUpperCase(), x + w / 2, boardY + boardH - 6);

    // 5. Capa de nieve acumulada sobre el techo del cartel con carámbanos
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(x - 4, boardY + 4);
    ctx.bezierCurveTo(x + w * 0.25, boardY - 8, x + w * 0.75, boardY - 8, x + w + 4, boardY + 4);
    ctx.lineTo(x + w + 2, boardY + 7);
    ctx.lineTo(x + w * 0.85, boardY + 5);
    ctx.lineTo(x + w * 0.78, boardY + 11); // Carámbano 1
    ctx.lineTo(x + w * 0.72, boardY + 5);
    ctx.lineTo(x + w * 0.5, boardY + 6);
    ctx.lineTo(x + w * 0.44, boardY + 12); // Carámbano 2
    ctx.lineTo(x + w * 0.38, boardY + 5);
    ctx.lineTo(x + w * 0.22, boardY + 10); // Carámbano 3
    ctx.lineTo(x + w * 0.16, boardY + 5);
    ctx.lineTo(x - 2, boardY + 7);
    ctx.closePath();
    ctx.fill();

    // Guirnalda festiva de pino verde en las esquinas
    ctx.fillStyle = "#2E7D32";
    ctx.beginPath();
    ctx.arc(x + 6, boardY + 5, 5, 0, Math.PI * 2);
    ctx.arc(x + w - 6, boardY + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E53935";
    ctx.beginPath();
    ctx.arc(x + 6, boardY + 5, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w - 6, boardY + 5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawSnowDrift(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.save();
    // 1. Sombra suave en la nieve bajo el montículo
    ctx.fillStyle = "rgba(75, 125, 175, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.72, w * 0.52, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Lóbulo posterior (sombra gélida)
    const backGrad = ctx.createLinearGradient(x, y, x, y + h);
    backGrad.addColorStop(0, "#E8F3FA");
    backGrad.addColorStop(1, "#C8E2F5");
    ctx.fillStyle = backGrad;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.42, y + h * 0.48, w * 0.44, h * 0.38, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // 3. Lóbulo lateral derecho
    const rightGrad = ctx.createLinearGradient(x + w * 0.5, y, x + w * 0.8, y + h);
    rightGrad.addColorStop(0, "#F2F8FC");
    rightGrad.addColorStop(1, "#D2E7F6");
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.65, y + h * 0.54, w * 0.32, h * 0.34, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 4. Domo frontal principal iluminado por el sol alpino
    const frontGrad = ctx.createLinearGradient(x, y + 2, x, y + h);
    frontGrad.addColorStop(0, "#FFFFFF");
    frontGrad.addColorStop(0.55, "#F0F7FC");
    frontGrad.addColorStop(1, "#D8ECF8");
    ctx.fillStyle = frontGrad;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h * 0.62);
    ctx.bezierCurveTo(x + w * 0.25, y, x + w * 0.75, y, x + w - 10, y + h * 0.62);
    ctx.bezierCurveTo(x + w * 0.65, y + h * 0.95, x + w * 0.35, y + h * 0.95, x + 10, y + h * 0.62);
    ctx.fill();

    // 5. Cresta brillante de nieve fresca
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * 0.32);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.16, x + w * 0.78, y + h * 0.32);
    ctx.stroke();

    // 6. Micro-destello de diamante en la cima
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(x + w * 0.48, y + h * 0.22, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private getSpriteForPose(pose: SantaPose): HTMLImageElement {
    switch (pose) {
      case "left":
        return this.santaLeftImg;
      case "right":
        return this.santaRightImg;
      case "jump":
        return this.santaJumpImg;
      case "crash":
        return this.santaCrashImg;
      default:
        return this.santaStraightImg;
    }
  }
}
