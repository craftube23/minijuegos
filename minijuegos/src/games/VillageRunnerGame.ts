/**
 * ==============================================================================
 * MINIJUEGO 6: LA CARRERA MÁGICA DE LA VILLA (VillageRunnerGame)
 * ==============================================================================
 * 
 * RUNNER ARCADE HORIZONTAL 2D NAVIDEÑO (Estilo Google T-Rex / Arcade Clásico):
 * - Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art.
 * - Vista: 2D SIDE-SCROLLER DE PERFIL LATERAL.
 * - Movimiento automático continuo de IZQUIERDA a DERECHA (el mundo se desplaza a la izquierda).
 * - ÚNICO CONTROL: TAP EN PANTALLA / ESPACIO -> ⬆️ SALTO.
 * - Personaje: Elfo alegre en Mini Trineo Mágico tallado con farol, bufanda y el logo oficial de la Feria Mágica.
 * - Obstáculos laterales (todos para saltar):
 *     🪵 Vallas de madera con nieve y campanas.
 *     🧊 Bloques de hielo cristalino.
 *     🛒 Carretas navideñas de juguetes.
 *     🦉 Búhos mágicos planeando.
 * - Power-Up "🎪 MEDALLÓN DE LA FERIA": Aura dorada, imán suave y BONUS x2 durante 6 segundos.
 * - 3 Capas de Parallax Scrolling con casas de la Villa, carteles con logo de la Feria y montañas alpinas.
 * - Estructura de 45 segundos sin muerte instantánea.
 */

import { BaseGame } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { InputManager } from "../core/InputManager";
import { ParticleSystem } from "../core/ParticleSystem";

type ObstacleType = "fence" | "ice" | "cart" | "owl";
type ItemType = "gift_red" | "gift_green" | "candy" | "medallion";

interface RunnerObstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  hit: boolean;
  cleared: boolean;
}

interface RunnerItem {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  size: number;
  collected: boolean;
  rotAngle: number;
}

interface SceneryHouse {
  x: number;
  width: number;
  height: number;
  type: "house" | "banner_feria" | "banner_campus" | "tree";
}

export class VillageRunnerGame extends BaseGame {
  // Posición y física del Jugador (Trineo Lateral)
  private playerX: number = 180;
  private playerY: number = 0;
  private groundY: number = 0;
  private playerWidth: number = 150;
  private playerHeight: number = 120;
  private verticalVelocity: number = 0;
  private isJumping: boolean = false;
  private jumpForce: number = 780;
  private gravity: number = 1750;
  private sledPitch: number = 0; // Inclinación angular
  private hitInvulnerabilityTimer: number = 0;

  // Progresión y velocidad de la carrera (px/seg)
  private currentSpeed: number = 420;
  private baseSpeed: number = 420;
  private distanceMeters: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;

  // Entidades activas
  private obstacles: RunnerObstacle[] = [];
  private items: RunnerItem[] = [];
  private sceneryHouses: SceneryHouse[] = [];
  private entityCounter: number = 0;

  // Parallax offsets
  private skyOffset: number = 0;
  private midgroundOffset: number = 0;
  private foregroundOffset: number = 0;
  private nextObstacleSpawnX: number = 600;

  // Assets gráficos laterales
  private imgSledLateral: HTMLImageElement | null = null;
  private imgFenceLateral: HTMLImageElement | null = null;
  private imgCartLateral: HTMLImageElement | null = null;
  private imgIceLateral: HTMLImageElement | null = null;
  private imgOwlLateral: HTMLImageElement | null = null;
  private imgGiftRed: HTMLImageElement | null = null;
  private imgGiftGreen: HTMLImageElement | null = null;
  private imgCandy: HTMLImageElement | null = null;
  private imgMedallion: HTMLImageElement | null = null;
  private imgHorizonBg: HTMLImageElement | null = null;
  private imgBannerFeria: HTMLImageElement | null = null;
  private imgBannerCampus: HTMLImageElement | null = null;
  private imgHouse: HTMLImageElement | null = null;
  private imgTree: HTMLImageElement | null = null;

  // Partículas locales de nieve y polvo mágico
  private snowPuffs: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];

  // Tutorial / Indicador en pantalla
  private showTutorialHint: boolean = true;
  private tutorialHintTimer: number = 3.5;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "village-runner",
      "La Carrera Mágica de la Villa",
      "¡Toca la pantalla para saltar vallas, carretas y bloques de hielo!",
      canvas,
      input,
      audio,
      particles
    );

    this.loadAssets();
    this.setupSingleTapControl();
  }

  private loadAssets(): void {
    const load = (src: string): HTMLImageElement => {
      const img = new Image();
      img.src = src;
      return img;
    };

    this.imgSledLateral = load("./assets/images/corredor-trineo-lateral.png");
    this.imgFenceLateral = load("./assets/images/obstaculo-valla-lateral.png");
    this.imgCartLateral = load("./assets/images/obstaculo-carreta-lateral.png");
    this.imgIceLateral = load("./assets/images/obstaculo-hielo-lateral.png");
    this.imgOwlLateral = load("./assets/images/obstaculo-buho-lateral.png");
    this.imgGiftRed = load("./assets/images/regalo-rojo.png");
    this.imgGiftGreen = load("./assets/images/regalo-verde.png");
    this.imgCandy = load("./assets/images/baston-caramelo.png");
    this.imgMedallion = load("./assets/images/medallon-feria.png");
    this.imgHorizonBg = load("./assets/images/fondo-carrera-horizonte.jpg");
    this.imgBannerFeria = load("./assets/images/cartel-feria.png");
    this.imgBannerCampus = load("./assets/images/cartel-sponsor.png");
    this.imgHouse = load("./assets/images/casa-roja.png");
    this.imgTree = load("./assets/images/arbol.png");
  }

  /**
   * ÚNICO CONTROL: TAP / TOQUE PARA SALTAR
   */
  private setupSingleTapControl(): void {
    // 1. Toque en pantalla táctil (Mobile / Tótem Android)
    this.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!this.isRunning || this.isGameOver) return;
      this.handleJump();
    }, { passive: false });

    // 2. Barra espaciadora / Flecha arriba / Enter para teclado
    window.addEventListener("keydown", (e) => {
      if (!this.isRunning || this.isGameOver) return;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === "Enter") {
        e.preventDefault();
        this.handleJump();
      }
    });
  }

  private handleJump(): void {
    if (!this.isJumping) {
      this.isJumping = true;
      this.verticalVelocity = -this.jumpForce;
      this.audio.playRunnerJump();
      this.triggerSnowPuff(this.playerX + 20, this.groundY, 15, "#FFFFFF");
    }
  }

  protected onStart(): void {
    this.groundY = this.height * 0.78;
    this.playerX = Math.max(90, this.width * 0.16);
    this.playerY = this.groundY;
    this.playerWidth = Math.max(100, Math.min(170, this.width * 0.16));
    this.playerHeight = this.playerWidth * 0.82;

    this.verticalVelocity = 0;
    this.isJumping = false;
    this.sledPitch = 0;
    this.hitInvulnerabilityTimer = 0;

    this.currentSpeed = this.baseSpeed;
    this.distanceMeters = 0;
    this.combo = 0;
    this.maxCombo = 0;

    this.obstacles = [];
    this.items = [];
    this.sceneryHouses = [];
    this.snowPuffs = [];

    this.skyOffset = 0;
    this.midgroundOffset = 0;
    this.foregroundOffset = 0;
    this.nextObstacleSpawnX = this.width + 250;

    this.showTutorialHint = true;
    this.tutorialHintTimer = 3.5;

    // Inicializar casas y carteles de la Villa en el plano medio
    let currentX = 50;
    while (currentX < this.width * 2) {
      this.spawnSceneryElement(currentX);
      currentX += 280 + Math.random() * 180;
    }

    // Primer lote de regalos introductorios
    this.spawnGiftArc(this.width + 100, 3, "gift_green");
  }

  private spawnSceneryElement(x: number): void {
    const types: ("house" | "banner_feria" | "banner_campus" | "tree")[] = [
      "house", "tree", "banner_feria", "house", "tree", "banner_campus"
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const w = type.includes("banner") ? 140 : 160;
    const h = type.includes("banner") ? 110 : 160;

    this.sceneryHouses.push({
      x,
      width: w,
      height: h,
      type
    });
  }

  protected onUpdate(dt: number): void {
    // 1. Progresión de velocidad según los 45 segundos
    const elapsed = 45 - this.timeRemaining;
    if (elapsed < 10) {
      this.currentSpeed = 420; // Fase 1: Aprendizaje
    } else if (elapsed < 20) {
      this.currentSpeed = 500; // Fase 2: Ritmo medio
    } else if (elapsed < 30) {
      this.currentSpeed = 580; // Fase 3: Villa rápida
    } else if (elapsed < 40) {
      this.currentSpeed = 660; // Fase 4: Desafío ágil
    } else {
      this.currentSpeed = 760; // Fase 5: Clímax "¡LA VILLA SE ACELERA!"
    }

    if (this.isLogoPowerUpActive) {
      this.currentSpeed *= 1.15; // Turbo x2 Power-Up
    }

    const moveStep = this.currentSpeed * dt;
    this.distanceMeters += (moveStep / 100);

    // 2. Parallax Scrolling horizontal
    this.skyOffset = (this.skyOffset + moveStep * 0.1) % this.width;
    this.midgroundOffset += moveStep * 0.45;
    this.foregroundOffset = (this.foregroundOffset + moveStep) % 80;

    // 3. Temporizador de pista tutorial
    if (this.showTutorialHint) {
      this.tutorialHintTimer -= dt;
      if (this.tutorialHintTimer <= 0) {
        this.showTutorialHint = false;
      }
    }

    // 4. Física del Salto y Gravedad
    if (this.isJumping) {
      this.playerY += this.verticalVelocity * dt;
      this.verticalVelocity += this.gravity * dt;

      // Inclinación angular dinámica (sube con morro hacia arriba, cae con morro nivelado)
      if (this.verticalVelocity < 0) {
        this.sledPitch = -12; // Subiendo
      } else {
        this.sledPitch = Math.min(8, this.sledPitch + dt * 25); // Cayendo
      }

      // Aterrizaje suave en el suelo
      if (this.playerY >= this.groundY) {
        this.playerY = this.groundY;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.sledPitch = 0;
        this.triggerSnowPuff(this.playerX + this.playerWidth * 0.4, this.groundY + this.playerHeight * 0.4, 18, "#E0F7FA");
      }
    } else {
      // Pequeña estela continua de nieve mientras se desliza en el suelo
      if (Math.random() < 0.6) {
        this.triggerSnowPuff(
          this.playerX + 15,
          this.groundY + this.playerHeight * 0.38,
          1,
          this.isLogoPowerUpActive ? "#FFD700" : "#FFFFFF"
        );
      }
    }

    // 5. Temporizador de invulnerabilidad tras impacto
    if (this.hitInvulnerabilityTimer > 0) {
      this.hitInvulnerabilityTimer -= dt;
    }

    // 6. Actualizar partículas locales
    for (let i = this.snowPuffs.length - 1; i >= 0; i--) {
      const p = this.snowPuffs[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life >= p.maxLife) {
        this.snowPuffs.splice(i, 1);
      }
    }

    // 7. Actualizar casas y carteles del escenario medio
    for (let i = this.sceneryHouses.length - 1; i >= 0; i--) {
      const h = this.sceneryHouses[i];
      h.x -= moveStep * 0.45;
      if (h.x + h.width < -100) {
        this.sceneryHouses.splice(i, 1);
      }
    }
    const rightmostHouse = this.sceneryHouses.reduce((max, h) => Math.max(max, h.x), 0);
    if (rightmostHouse < this.width + 200) {
      this.spawnSceneryElement(rightmostHouse + 260 + Math.random() * 160);
    }

    // 8. Actualizar Obstáculos y Colisiones
    this.updateObstacles(moveStep);

    // 9. Actualizar Coleccionables y Power-Ups
    this.updateItems(moveStep, dt);

    // 10. Generador Procedural de Obstáculos y Regalos
    this.nextObstacleSpawnX -= moveStep;
    if (this.nextObstacleSpawnX <= this.width) {
      this.spawnProceduralPattern();
      // Espaciado generoso garantizado (siempre tiempo de reacción)
      const minGap = Math.max(380, 520 - (elapsed * 3));
      this.nextObstacleSpawnX = this.width + minGap + Math.random() * 160;
    }
  }

  private triggerSnowPuff(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      this.snowPuffs.push({
        x,
        y,
        vx: -this.currentSpeed * 0.5 + (Math.random() - 0.5) * 120,
        vy: (Math.random() * -100) - 20,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.3,
        color,
        size: 3 + Math.random() * 4
      });
    }
  }

  /**
   * Generador de patrones 100% justos (diseñados para ser saltados con tap)
   */
  private spawnProceduralPattern(): void {
    const elapsed = 45 - this.timeRemaining;
    const patterns = [
      // Patrón 1: Valla baja con regalo flotante justo arriba
      () => {
        this.spawnObstacle("fence", this.width + 20);
        this.spawnItem("gift_green", this.width + 30, this.groundY - 140);
      },
      // Patrón 2: Bloque de hielo cristalino con arco de dulces
      () => {
        this.spawnObstacle("ice", this.width + 20);
        this.spawnGiftArc(this.width - 20, 3, "candy");
      },
      // Patrón 3: Carreta de juguetes cargada (requiere salto completo)
      () => {
        this.spawnObstacle("cart", this.width + 20);
        this.spawnItem("gift_red", this.width + 60, this.groundY - 170);
      },
      // Patrón 4: Búho invernal volando bajo
      () => {
        this.spawnObstacle("owl", this.width + 20);
        this.spawnItem("candy", this.width + 30, this.groundY - 160);
      },
      // Patrón 5: Medallón de la Feria (Power-Up x2 cada ~12s)
      () => {
        this.spawnItem("medallion", this.width + 40, this.groundY - 130);
      }
    ];

    if (elapsed > 38 && Math.random() < 0.4) {
      // Clímax: Más medallones y dulces
      this.spawnItem("medallion", this.width + 20, this.groundY - 130);
      this.spawnGiftArc(this.width + 120, 4, "candy");
    } else {
      const chosen = patterns[Math.floor(Math.random() * patterns.length)];
      chosen();
    }
  }

  private spawnObstacle(type: ObstacleType, x: number): void {
    let w = 80;
    let h = 65;
    let y = this.groundY + this.playerHeight * 0.45 - h;

    if (type === "fence") {
      w = 90;
      h = 60;
      y = this.groundY + this.playerHeight * 0.42 - h;
    } else if (type === "ice") {
      w = 85;
      h = 70;
      y = this.groundY + this.playerHeight * 0.42 - h;
    } else if (type === "cart") {
      w = 110;
      h = 95;
      y = this.groundY + this.playerHeight * 0.42 - h;
    } else if (type === "owl") {
      w = 75;
      h = 60;
      y = this.groundY - 35; // Vuela a baja altura
    }

    this.obstacles.push({
      id: ++this.entityCounter,
      type,
      x,
      y,
      width: w,
      height: h,
      hit: false,
      cleared: false
    });
  }

  private spawnItem(type: ItemType, x: number, y: number): void {
    this.items.push({
      id: ++this.entityCounter,
      type,
      x,
      y,
      size: type === "medallion" ? 64 : 46,
      collected: false,
      rotAngle: 0
    });
  }

  private spawnGiftArc(startX: number, count: number, type: ItemType): void {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1 || 1);
      const arcY = this.groundY - 120 - Math.sin(t * Math.PI) * 60;
      this.spawnItem(type, startX + i * 55, arcY);
    }
  }

  private updateObstacles(moveStep: number): void {
    // Caja de colisión precisa del jugador (AABB recortada)
    const pBox = {
      x: this.playerX + this.playerWidth * 0.22,
      y: this.playerY - this.playerHeight * 0.35,
      w: this.playerWidth * 0.58,
      h: this.playerHeight * 0.72
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= moveStep;

      // Detección de colisión AABB
      if (!obs.hit && !obs.cleared) {
        const isColliding = (
          pBox.x < obs.x + obs.width * 0.85 &&
          pBox.x + pBox.w > obs.x + obs.width * 0.15 &&
          pBox.y < obs.y + obs.height &&
          pBox.y + pBox.h > obs.y + obs.height * 0.2
        );

        if (isColliding) {
          if (this.hitInvulnerabilityTimer <= 0 && !this.isLogoPowerUpActive) {
            obs.hit = true;
            this.handleObstacleHit();
          }
        } else if (pBox.x > obs.x + obs.width) {
          // Superó el obstáculo con éxito
          obs.cleared = true;
          this.addScore(50);
        }
      }

      if (obs.x + obs.width < -80) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private handleObstacleHit(): void {
    this.hitInvulnerabilityTimer = 1.25;
    this.triggerShake(0.3, 8);
    this.audio.playRunnerHit();
    this.combo = 0;

    const penalty = Math.min(this.score, 100);
    this.score = Math.max(0, this.score - penalty);
    this.addFloatingText(`-100 💥`, this.playerX + 40, this.playerY - 60, "#FF2A4D", 1.3);
    this.triggerSnowPuff(this.playerX + 50, this.playerY, 25, "#FF5252");
  }

  private updateItems(moveStep: number, dt: number): void {
    const pCenterX = this.playerX + this.playerWidth * 0.5;
    const pCenterY = this.playerY;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.x -= moveStep;
      item.rotAngle += dt * 3;

      // Atracción magnética durante el Power-Up
      if (this.isLogoPowerUpActive && !item.collected) {
        const dx = pCenterX - item.x;
        const dy = pCenterY - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 420 && dist > 10) {
          item.x += (dx / dist) * 450 * dt;
          item.y += (dy / dist) * 450 * dt;
        }
      }

      // Detección de recolección
      if (!item.collected) {
        const dx = pCenterX - item.x;
        const dy = pCenterY - item.y;
        if (Math.hypot(dx, dy) < (this.playerWidth * 0.45 + item.size * 0.5)) {
          item.collected = true;
          this.collectItem(item);
        }
      }

      if (item.x + item.size < -60 || item.collected) {
        this.items.splice(i, 1);
      }
    }
  }

  private collectItem(item: RunnerItem): void {
    const multiplier = this.isLogoPowerUpActive ? 2 : 1;

    if (item.type === "gift_red" || item.type === "gift_green") {
      const pts = 100 * multiplier;
      this.addScore(pts);
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.audio.playCatchItem(1.0 + Math.min(0.6, this.combo * 0.04));
      this.addFloatingText(`+${pts}`, item.x, item.y - 25, "#00E676");
      this.triggerSnowPuff(item.x, item.y, 10, "#69F0AE");
    } else if (item.type === "candy") {
      const pts = 150 * multiplier;
      this.addScore(pts);
      this.combo += 2;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.audio.playCatchItem(1.3);
      this.addFloatingText(`+${pts} 🍭`, item.x, item.y - 25, "#FFD700");
      this.triggerSnowPuff(item.x, item.y, 12, "#FF4081");
    } else if (item.type === "medallion") {
      this.triggerLogoPowerUp(1, 6.0);
      this.addScore(500);
      this.audio.playPowerUp();
      this.triggerShake(0.35, 6);
      this.addFloatingText(`✨ ¡PODER DE LA FERIA! x2 ✨`, this.width * 0.5, this.height * 0.35, "#FFD700", 1.5);
      this.triggerSnowPuff(item.x, item.y, 35, "#FFD700");
    }
  }

  // ==========================================================================
  // RENDERIZADO 2D HORIZONTAL
  // ==========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Capa Lejana (Cielo nocturno, montañas y auroras boreales)
    this.drawSkyLayer(ctx);

    // 2. Capa Media (Casas de la Villa Navideña, chimeneas, pinos y carteles con el logo)
    this.drawMidgroundVillage(ctx);

    // 3. Capa Primer Plano (Suelo nevado con adoquines y faroles)
    this.drawForegroundTrack(ctx);

    // 4. Obstáculos y Coleccionables
    this.drawEntities(ctx);

    // 5. Elfo en Trineo Mágico (Lateral 2D)
    this.drawPlayer(ctx);

    // 6. Efectos de velocidad y clima
    this.drawAtmosphere(ctx);

    // 7. HUD y Feedback Tutorial
    this.drawOverlayInfo(ctx);
  }

  private drawSkyLayer(ctx: CanvasRenderingContext2D): void {
    const horizonH = this.groundY;

    if (this.imgHorizonBg && this.imgHorizonBg.complete && this.imgHorizonBg.naturalWidth > 0) {
      // Repetir fondo panorámico con parallax suave
      const bgW = this.width;
      const bgH = horizonH + 30;
      ctx.drawImage(this.imgHorizonBg, -this.skyOffset, 0, bgW, bgH);
      ctx.drawImage(this.imgHorizonBg, bgW - this.skyOffset, 0, bgW, bgH);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonH);
      skyGrad.addColorStop(0, "#081224");
      skyGrad.addColorStop(0.7, "#17345C");
      skyGrad.addColorStop(1, "#36688D");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, horizonH);
    }
  }

  private drawMidgroundVillage(ctx: CanvasRenderingContext2D): void {
    for (const elem of this.sceneryHouses) {
      const y = this.groundY - elem.height + 15;

      ctx.save();
      if (elem.type === "house" && this.imgHouse && this.imgHouse.complete) {
        ctx.drawImage(this.imgHouse, elem.x, y, elem.width, elem.height);
      } else if (elem.type === "tree" && this.imgTree && this.imgTree.complete) {
        ctx.drawImage(this.imgTree, elem.x, y, elem.width * 0.8, elem.height);
      } else if (elem.type === "banner_feria" && this.imgBannerFeria && this.imgBannerFeria.complete) {
        ctx.drawImage(this.imgBannerFeria, elem.x, y + 20, elem.width, elem.height * 0.85);
      } else if (elem.type === "banner_campus" && this.imgBannerCampus && this.imgBannerCampus.complete) {
        ctx.drawImage(this.imgBannerCampus, elem.x, y + 20, elem.width, elem.height * 0.85);
      } else {
        ctx.fillStyle = "#3E2723";
        ctx.fillRect(elem.x, y + 30, elem.width * 0.8, elem.height * 0.7);
      }
      ctx.restore();
    }
  }

  private drawForegroundTrack(ctx: CanvasRenderingContext2D): void {
    const trackY = this.groundY + this.playerHeight * 0.42;
    const trackH = this.height - trackY;

    // Base de nieve sólida
    const snowGrad = ctx.createLinearGradient(0, trackY, 0, this.height);
    snowGrad.addColorStop(0, "#FFFFFF");
    snowGrad.addColorStop(0.15, "#E1F5FE");
    snowGrad.addColorStop(0.5, "#B3E5FC");
    snowGrad.addColorStop(1, "#81D4FA");
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, trackY, this.width, trackH);

    // Borde brillante de nieve fresca
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(this.width, trackY);
    ctx.stroke();

    // Línea de adoquines nevados y huellas de patines en movimiento
    ctx.save();
    ctx.strokeStyle = "rgba(129, 212, 250, 0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([24, 16]);
    ctx.lineDashOffset = -this.foregroundOffset;
    ctx.beginPath();
    ctx.moveTo(0, trackY + 12);
    ctx.lineTo(this.width, trackY + 12);
    ctx.stroke();
    ctx.restore();
  }

  private drawEntities(ctx: CanvasRenderingContext2D): void {
    // 1. Dibujar Obstáculos
    for (const obs of this.obstacles) {
      ctx.save();
      if (obs.type === "fence" && this.imgFenceLateral && this.imgFenceLateral.complete) {
        ctx.drawImage(this.imgFenceLateral, obs.x, obs.y, obs.width, obs.height);
      } else if (obs.type === "cart" && this.imgCartLateral && this.imgCartLateral.complete) {
        ctx.drawImage(this.imgCartLateral, obs.x, obs.y, obs.width, obs.height);
      } else if (obs.type === "ice" && this.imgIceLateral && this.imgIceLateral.complete) {
        ctx.drawImage(this.imgIceLateral, obs.x, obs.y, obs.width, obs.height);
      } else if (obs.type === "owl" && this.imgOwlLateral && this.imgOwlLateral.complete) {
        ctx.drawImage(this.imgOwlLateral, obs.x, obs.y, obs.width, obs.height);
      } else {
        ctx.fillStyle = "#8D6E63";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
      ctx.restore();
    }

    // 2. Dibujar Coleccionables
    for (const item of this.items) {
      ctx.save();
      const hover = Math.sin(item.rotAngle * 2) * 5;
      const drawY = item.y + hover;

      if (item.type === "medallion") {
        // Aura mágica dorada
        const halo = ctx.createRadialGradient(item.x, drawY, 5, item.x, drawY, item.size * 0.7);
        halo.addColorStop(0, "rgba(255, 215, 0, 0.85)");
        halo.addColorStop(0.5, "rgba(255, 140, 0, 0.4)");
        halo.addColorStop(1, "rgba(255, 215, 0, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(item.x, drawY, item.size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        if (this.imgMedallion && this.imgMedallion.complete) {
          ctx.drawImage(this.imgMedallion, item.x - item.size * 0.5, drawY - item.size * 0.5, item.size, item.size);
        }
      } else {
        let img = this.imgGiftGreen;
        if (item.type === "gift_red") img = this.imgGiftRed;
        else if (item.type === "candy") img = this.imgCandy;

        if (img && img.complete) {
          ctx.drawImage(img, item.x - item.size * 0.5, drawY - item.size * 0.5, item.size, item.size);
        }
      }
      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const drawX = this.playerX;
    const drawY = this.playerY;

    // 1. Sombra en el suelo (se encoge durante el salto)
    const shadowY = this.groundY + this.playerHeight * 0.42;
    const heightAboveGround = Math.max(0, this.groundY - this.playerY);
    const shadowScale = Math.max(0.3, 1 - heightAboveGround / 240);

    ctx.fillStyle = "rgba(7, 20, 38, 0.35)";
    ctx.beginPath();
    ctx.ellipse(
      drawX + this.playerWidth * 0.45,
      shadowY,
      this.playerWidth * 0.4 * shadowScale,
      10 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. Aura dorada si está activo el Power-Up
    if (this.isLogoPowerUpActive) {
      const auraGrad = ctx.createRadialGradient(
        drawX + this.playerWidth * 0.5,
        drawY,
        15,
        drawX + this.playerWidth * 0.5,
        drawY,
        this.playerWidth * 0.75
      );
      auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.8)");
      auraGrad.addColorStop(0.5, "rgba(255, 110, 0, 0.35)");
      auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(drawX + this.playerWidth * 0.5, drawY, this.playerWidth * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Parpadeo de invulnerabilidad tras golpe
    if (this.hitInvulnerabilityTimer > 0) {
      const flash = Math.sin(this.hitInvulnerabilityTimer * 25);
      if (flash > 0) {
        ctx.globalAlpha = 0.45;
      }
    }

    // 4. Dibujar partículas locales de nieve
    for (const p of this.snowPuffs) {
      const a = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 5. Inclinación física angular del trineo
    ctx.translate(drawX + this.playerWidth * 0.5, drawY);
    ctx.rotate((this.sledPitch * Math.PI) / 180);

    if (this.imgSledLateral && this.imgSledLateral.complete && this.imgSledLateral.naturalWidth > 0) {
      ctx.drawImage(
        this.imgSledLateral,
        -this.playerWidth * 0.5,
        -this.playerHeight * 0.55,
        this.playerWidth,
        this.playerHeight
      );
    } else {
      ctx.fillStyle = "#D32F2F";
      ctx.fillRect(-this.playerWidth * 0.5, -this.playerHeight * 0.5, this.playerWidth, this.playerHeight);
    }

    ctx.restore();
  }

  private drawAtmosphere(ctx: CanvasRenderingContext2D): void {
    // Líneas de velocidad si va rápido o está en Power-Up
    if (this.currentSpeed > 550 || this.isLogoPowerUpActive) {
      ctx.save();
      ctx.strokeStyle = this.isLogoPowerUpActive ? "rgba(255, 215, 0, 0.4)" : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      const count = this.isLogoPowerUpActive ? 6 : 3;
      for (let i = 0; i < count; i++) {
        const lx = Math.random() * this.width;
        const ly = Math.random() * (this.groundY - 50);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 45, ly);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawOverlayInfo(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Banner Tutorial Inicial
    if (this.showTutorialHint) {
      ctx.fillStyle = "rgba(7, 18, 34, 0.88)";
      const boxW = Math.min(this.width * 0.88, 480);
      const boxH = 68;
      const boxX = (this.width - boxW) * 0.5;
      const boxY = this.height * 0.84;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 18px 'Outfit', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👆 ¡TOCA LA PANTALLA PARA SALTAR!", this.width * 0.5, boxY + boxH * 0.5);
    }

    // 2. Indicador de Combo
    if (this.combo >= 3) {
      const comboY = this.height * 0.15;
      ctx.font = "900 24px 'Outfit', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.lineWidth = 5;
      ctx.strokeText(`🔥 COMBO x${this.combo} 🔥`, this.width * 0.5, comboY);
      ctx.fillText(`🔥 COMBO x${this.combo} 🔥`, this.width * 0.5, comboY);
    }

    ctx.restore();
  }
}
