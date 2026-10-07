/**
 * ==============================================================================
 * MINIJUEGO 6: LA CARRERA MÁGICA DE LA VILLA (VillageRunnerGame)
 * ==============================================================================
 * 
 * RUNNER ARCADE 2D HORIZONTAL PROFESIONAL (Estilo T-Rex / Mario 2D Runner Navideño)
 * 
 * - Perspectiva: 2D SIDE-SCROLLING ESTRICTO DE PERFIL LATERAL.
 * - Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art.
 * - ÚNICO CONTROL: TAP / CLIC / ESPACIO -> ⬆️ SALTO.
 * - Personaje: Elfo alegre en Mini Trineo Mágico con el logo oficial de la Feria Mágica.
 * - Parallax 2D de 3 Capas Continuas:
 *     1. Cielo nocturno con aurora boreal, luna y cordillera alpina.
 *     2. Villa Navideña con casas de madera iluminadas, chimeneas y carteles oficiales.
 *     3. Plataforma de suelo nevado con vigas talladas y campanas.
 * - Obstáculos 2D para saltar:
 *     🪵 Valla rústica de madera con lazo.
 *     🧊 Bloque de hielo cristalino.
 *     🛒 Carreta de juguetes navideña.
 *     🦉 Búho mágico planeando a baja altura.
 * - Power-Up "🎪 MEDALLÓN DE LA FERIA": Aura dorada, imán suave y BONUS x2.
 * - 45 segundos de juego continuo sin muerte instantánea.
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

interface MidgroundBanner {
  x: number;
  type: "feria" | "campus";
}

export class VillageRunnerGame extends BaseGame {
  // Posición y física del Jugador (Trineo Lateral)
  private playerX: number = 160;
  private playerY: number = 0; // Altura de los patines
  private groundSurfaceY: number = 0;
  private playerWidth: number = 140;
  private playerHeight: number = 110;
  private verticalVelocity: number = 0;
  private isJumping: boolean = false;
  private jumpForce: number = 740;
  private gravity: number = 1650;
  private sledPitch: number = 0; // Grados de inclinación
  private hitInvulnerabilityTimer: number = 0;

  // Velocidad y Progresión
  private currentSpeed: number = 380;
  private baseSpeed: number = 380;
  private distanceMeters: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;

  // Parallax Scroll Offsets (px acumulados)
  private skyScrollX: number = 0;
  private villageScrollX: number = 0;
  private groundScrollX: number = 0;

  // Entidades activas
  private obstacles: RunnerObstacle[] = [];
  private items: RunnerItem[] = [];
  private midgroundBanners: MidgroundBanner[] = [];
  private entityCounter: number = 0;
  private nextObstacleSpawnX: number = 800;
  private nextBannerSpawnX: number = 1200;

  // Assets gráficos oficiales 2D de perfil
  private imgSky: HTMLImageElement | null = null;
  private imgVillageStrip: HTMLImageElement | null = null;
  private imgGroundStrip: HTMLImageElement | null = null;
  private imgSledLateral: HTMLImageElement | null = null;
  private imgFenceLateral: HTMLImageElement | null = null;
  private imgCartLateral: HTMLImageElement | null = null;
  private imgIceLateral: HTMLImageElement | null = null;
  private imgOwlLateral: HTMLImageElement | null = null;
  private imgGiftRed: HTMLImageElement | null = null;
  private imgGiftGreen: HTMLImageElement | null = null;
  private imgCandy: HTMLImageElement | null = null;
  private imgMedallion: HTMLImageElement | null = null;
  private imgBannerFeria: HTMLImageElement | null = null;
  private imgBannerCampus: HTMLImageElement | null = null;

  // Partículas de estela de nieve y aterrizaje
  private snowParticles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];

  // Tutorial interactivo inicial
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
      "¡Toca la pantalla para saltar vallas, carretas y bloques de hielo con tu trineo!",
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

    this.imgSky = load("./assets/images/runner-2d-cielo.jpg");
    this.imgVillageStrip = load("./assets/images/runner-2d-villa.png");
    this.imgGroundStrip = load("./assets/images/runner-2d-suelo.png");
    this.imgSledLateral = load("./assets/images/corredor-trineo-lateral.png");
    this.imgFenceLateral = load("./assets/images/obstaculo-valla-lateral.png");
    this.imgCartLateral = load("./assets/images/obstaculo-carreta-lateral.png");
    this.imgIceLateral = load("./assets/images/obstaculo-hielo-lateral.png");
    this.imgOwlLateral = load("./assets/images/obstaculo-buho-lateral.png");
    this.imgGiftRed = load("./assets/images/regalo-rojo.png");
    this.imgGiftGreen = load("./assets/images/regalo-verde.png");
    this.imgCandy = load("./assets/images/baston-caramelo.png");
    this.imgMedallion = load("./assets/images/medallon-feria.png");
    this.imgBannerFeria = load("./assets/images/cartel-feria.png");
    this.imgBannerCampus = load("./assets/images/cartel-sponsor.png");
  }

  /**
   * ÚNICO CONTROL: TAP / TOQUE PARA SALTAR
   */
  private setupSingleTapControl(): void {
    this.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!this.isRunning || this.isGameOver) return;
      this.handleJump();
    }, { passive: false });

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
      this.triggerSnowPuff(this.playerX + 20, this.groundSurfaceY, 14, "#FFFFFF");
    }
  }

  protected onStart(): void {
    this.groundSurfaceY = Math.round(this.height * 0.72);
    this.playerX = Math.max(80, Math.round(this.width * 0.16));
    this.playerY = this.groundSurfaceY;

    this.playerWidth = Math.max(90, Math.min(150, this.width * 0.15));
    this.playerHeight = this.playerWidth * 0.8;

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
    this.midgroundBanners = [];
    this.snowParticles = [];

    this.skyScrollX = 0;
    this.villageScrollX = 0;
    this.groundScrollX = 0;

    this.nextObstacleSpawnX = this.width + 250;
    this.nextBannerSpawnX = this.width + 400;

    this.showTutorialHint = true;
    this.tutorialHintTimer = 3.5;

    // Primer lote de regalos introductorios
    this.spawnGiftArc(this.width + 80, 3, "gift_green");
  }

  protected onUpdate(dt: number): void {
    // 1. Progresión temporal (45 segundos)
    const elapsed = 45 - this.timeRemaining;
    if (elapsed < 10) {
      this.currentSpeed = 380;
    } else if (elapsed < 20) {
      this.currentSpeed = 460;
    } else if (elapsed < 30) {
      this.currentSpeed = 540;
    } else if (elapsed < 40) {
      this.currentSpeed = 620;
    } else {
      this.currentSpeed = 720; // Clímax ¡LA VILLA SE ACELERA!
    }

    if (this.isLogoPowerUpActive) {
      this.currentSpeed *= 1.15;
    }

    const moveStep = this.currentSpeed * dt;
    this.distanceMeters += (moveStep / 100);

    // 2. Parallax 2D continuo
    this.skyScrollX += moveStep * 0.08;
    this.villageScrollX += moveStep * 0.35;
    this.groundScrollX += moveStep;

    // 3. Tutorial Timer
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

      if (this.verticalVelocity < 0) {
        this.sledPitch = -12; // Inclinación hacia arriba al ascender
      } else {
        this.sledPitch = Math.min(8, this.sledPitch + dt * 25); // Nivelación al descender
      }

      // Aterrizaje sobre la nieve
      if (this.playerY >= this.groundSurfaceY) {
        this.playerY = this.groundSurfaceY;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.sledPitch = 0;
        this.triggerSnowPuff(this.playerX + this.playerWidth * 0.4, this.groundSurfaceY, 16, "#E0F7FA");
      }
    } else {
      // Estela continua del trineo deslizándose en la nieve
      if (Math.random() < 0.5) {
        this.triggerSnowPuff(
          this.playerX + 15,
          this.groundSurfaceY - 4,
          1,
          this.isLogoPowerUpActive ? "#FFD700" : "#FFFFFF"
        );
      }
    }

    // 5. Invulnerabilidad tras golpe
    if (this.hitInvulnerabilityTimer > 0) {
      this.hitInvulnerabilityTimer -= dt;
    }

    // 6. Actualizar partículas de nieve
    for (let i = this.snowParticles.length - 1; i >= 0; i--) {
      const p = this.snowParticles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life >= p.maxLife) {
        this.snowParticles.splice(i, 1);
      }
    }

    // 7. Actualizar Carteles del Escenario
    for (let i = this.midgroundBanners.length - 1; i >= 0; i--) {
      this.midgroundBanners[i].x -= moveStep * 0.35;
      if (this.midgroundBanners[i].x < -200) {
        this.midgroundBanners.splice(i, 1);
      }
    }
    this.nextBannerSpawnX -= moveStep * 0.35;
    if (this.nextBannerSpawnX <= this.width) {
      this.midgroundBanners.push({
        x: this.width + 50,
        type: Math.random() < 0.5 ? "feria" : "campus"
      });
      this.nextBannerSpawnX = this.width + 650 + Math.random() * 300;
    }

    // 8. Actualizar Obstáculos y Colisiones
    this.updateObstacles(moveStep);

    // 9. Actualizar Coleccionables
    this.updateItems(moveStep, dt);

    // 10. Generador Procedural de Obstáculos
    this.nextObstacleSpawnX -= moveStep;
    if (this.nextObstacleSpawnX <= this.width) {
      this.spawnProceduralPattern();
      const minGap = Math.max(380, 520 - (elapsed * 3));
      this.nextObstacleSpawnX = this.width + minGap + Math.random() * 150;
    }
  }

  private triggerSnowPuff(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      this.snowParticles.push({
        x,
        y,
        vx: -this.currentSpeed * 0.45 + (Math.random() - 0.5) * 100,
        vy: (Math.random() * -80) - 20,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.25,
        color,
        size: 2.5 + Math.random() * 3.5
      });
    }
  }

  private spawnProceduralPattern(): void {
    const elapsed = 45 - this.timeRemaining;
    const patterns = [
      // 1. Valla con regalo arriba
      () => {
        this.spawnObstacle("fence", this.width + 20);
        this.spawnItem("gift_green", this.width + 35, this.groundSurfaceY - 140);
      },
      // 2. Bloque de hielo con arco de dulces
      () => {
        this.spawnObstacle("ice", this.width + 20);
        this.spawnGiftArc(this.width - 20, 3, "candy");
      },
      // 3. Carreta de juguetes navideña
      () => {
        this.spawnObstacle("cart", this.width + 20);
        this.spawnItem("gift_red", this.width + 60, this.groundSurfaceY - 165);
      },
      // 4. Búho mágico volando bajo
      () => {
        this.spawnObstacle("owl", this.width + 20);
        this.spawnItem("candy", this.width + 30, this.groundSurfaceY - 150);
      },
      // 5. Medallón de la Feria (Power-Up x2)
      () => {
        this.spawnItem("medallion", this.width + 40, this.groundSurfaceY - 130);
      }
    ];

    if (elapsed > 38 && Math.random() < 0.4) {
      this.spawnItem("medallion", this.width + 20, this.groundSurfaceY - 130);
      this.spawnGiftArc(this.width + 120, 4, "candy");
    } else {
      const chosen = patterns[Math.floor(Math.random() * patterns.length)];
      chosen();
    }
  }

  private spawnObstacle(type: ObstacleType, x: number): void {
    let w = 85;
    let h = 65;
    let y = this.groundSurfaceY - h + 4;

    if (type === "fence") {
      w = 90;
      h = 60;
      y = this.groundSurfaceY - h + 4;
    } else if (type === "ice") {
      w = 85;
      h = 70;
      y = this.groundSurfaceY - h + 4;
    } else if (type === "cart") {
      w = 110;
      h = 95;
      y = this.groundSurfaceY - h + 4;
    } else if (type === "owl") {
      w = 75;
      h = 60;
      y = this.groundSurfaceY - 80; // Vuela a media altura
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
      size: type === "medallion" ? 60 : 44,
      collected: false,
      rotAngle: 0
    });
  }

  private spawnGiftArc(startX: number, count: number, type: ItemType): void {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1 || 1);
      const arcY = this.groundSurfaceY - 120 - Math.sin(t * Math.PI) * 60;
      this.spawnItem(type, startX + i * 55, arcY);
    }
  }

  private updateObstacles(moveStep: number): void {
    // Caja de colisión precisa del jugador
    const pBox = {
      x: this.playerX + this.playerWidth * 0.18,
      y: this.playerY - this.playerHeight * 0.85,
      w: this.playerWidth * 0.64,
      h: this.playerHeight * 0.85
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= moveStep;

      // Colisión AABB
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
    this.triggerSnowPuff(this.playerX + 50, this.playerY - 20, 20, "#FF5252");
  }

  private updateItems(moveStep: number, dt: number): void {
    const pCenterX = this.playerX + this.playerWidth * 0.5;
    const pCenterY = this.playerY - this.playerHeight * 0.45;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.x -= moveStep;
      item.rotAngle += dt * 3;

      // Efecto Imán suave del Power-Up
      if (this.isLogoPowerUpActive && !item.collected) {
        const dx = pCenterX - item.x;
        const dy = pCenterY - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 400 && dist > 10) {
          item.x += (dx / dist) * 450 * dt;
          item.y += (dy / dist) * 450 * dt;
        }
      }

      // Recolección
      if (!item.collected) {
        const dx = pCenterX - item.x;
        const dy = pCenterY - item.y;
        if (Math.hypot(dx, dy) < (this.playerWidth * 0.42 + item.size * 0.5)) {
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
      this.triggerSnowPuff(item.x, item.y, 8, "#69F0AE");
    } else if (item.type === "candy") {
      const pts = 150 * multiplier;
      this.addScore(pts);
      this.combo += 2;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.audio.playCatchItem(1.3);
      this.addFloatingText(`+${pts} 🍭`, item.x, item.y - 25, "#FFD700");
      this.triggerSnowPuff(item.x, item.y, 10, "#FF4081");
    } else if (item.type === "medallion") {
      this.triggerLogoPowerUp(1, 6.0);
      this.addScore(500);
      this.audio.playPowerUp();
      this.triggerShake(0.35, 6);
      this.addFloatingText(`✨ ¡PODER DE LA FERIA! x2 ✨`, this.width * 0.5, this.height * 0.35, "#FFD700", 1.5);
      this.triggerSnowPuff(item.x, item.y, 30, "#FFD700");
    }
  }

  // ==========================================================================
  // RENDERIZADO 2D LATERAL CONTINUO
  // ==========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Capa 1: Cielo Nocturno y Montañas Lejanas
    this.drawSkyParallax(ctx);

    // 2. Capa 2: Villa Navideña de Perfil (Casas iluminadas y carteles de la Feria)
    this.drawVillageParallax(ctx);

    // 3. Capa 3: Suelo Nevado con Madera Tallada
    this.drawGroundParallax(ctx);

    // 4. Obstáculos y Coleccionables
    this.drawEntities(ctx);

    // 5. Elfo en Mini Trineo Mágico (Perfil 2D)
    this.drawPlayer(ctx);

    // 6. Efectos Atmosféricos y Velocidad
    this.drawAtmosphere(ctx);

    // 7. Tutorial / Combo
    this.drawOverlayInfo(ctx);
  }

  private drawSkyParallax(ctx: CanvasRenderingContext2D): void {
    const skyH = this.height;
    if (this.imgSky && this.imgSky.complete && this.imgSky.naturalWidth > 0) {
      const imgW = this.width;
      const offsetX = this.skyScrollX % imgW;
      ctx.drawImage(this.imgSky, -offsetX, 0, imgW, skyH);
      ctx.drawImage(this.imgSky, imgW - offsetX, 0, imgW, skyH);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, skyH);
      grad.addColorStop(0, "#081224");
      grad.addColorStop(0.7, "#17345C");
      grad.addColorStop(1, "#36688D");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, skyH);
    }
  }

  private drawVillageParallax(ctx: CanvasRenderingContext2D): void {
    const stripH = Math.round(this.height * 0.42);
    const stripY = this.groundSurfaceY - stripH + 20;

    // Dibujar casas de la Villa
    if (this.imgVillageStrip && this.imgVillageStrip.complete && this.imgVillageStrip.naturalWidth > 0) {
      const stripW = Math.round(stripH * (this.imgVillageStrip.naturalWidth / this.imgVillageStrip.naturalHeight));
      const offsetX = this.villageScrollX % stripW;

      let drawX = -offsetX;
      while (drawX < this.width) {
        ctx.drawImage(this.imgVillageStrip, drawX, stripY, stripW, stripH);
        drawX += stripW;
      }
    }

    // Dibujar carteles oficiales de la Feria en el plano medio
    for (const banner of this.midgroundBanners) {
      const bannerW = 120;
      const bannerH = 90;
      const bannerY = this.groundSurfaceY - bannerH - 10;
      const img = banner.type === "feria" ? this.imgBannerFeria : this.imgBannerCampus;
      if (img && img.complete) {
        ctx.drawImage(img, banner.x, bannerY, bannerW, bannerH);
      }
    }
  }

  private drawGroundParallax(ctx: CanvasRenderingContext2D): void {
    const groundH = this.height - this.groundSurfaceY + 10;
    const groundY = this.groundSurfaceY - 10;

    if (this.imgGroundStrip && this.imgGroundStrip.complete && this.imgGroundStrip.naturalWidth > 0) {
      const tileW = Math.round(groundH * (this.imgGroundStrip.naturalWidth / this.imgGroundStrip.naturalHeight));
      const offsetX = this.groundScrollX % tileW;

      let drawX = -offsetX;
      while (drawX < this.width + tileW) {
        ctx.drawImage(this.imgGroundStrip, drawX, groundY, tileW, groundH);
        drawX += tileW;
      }
    } else {
      // Fallback
      ctx.fillStyle = "#E1F5FE";
      ctx.fillRect(0, this.groundSurfaceY, this.width, this.height - this.groundSurfaceY);
      ctx.fillStyle = "#3E2723";
      ctx.fillRect(0, this.groundSurfaceY + 25, this.width, this.height - this.groundSurfaceY - 25);
    }
  }

  private drawEntities(ctx: CanvasRenderingContext2D): void {
    // 1. Obstáculos
    for (const obs of this.obstacles) {
      ctx.save();
      let img = this.imgFenceLateral;
      if (obs.type === "cart") img = this.imgCartLateral;
      else if (obs.type === "ice") img = this.imgIceLateral;
      else if (obs.type === "owl") img = this.imgOwlLateral;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
      } else {
        ctx.fillStyle = "#8D6E63";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
      ctx.restore();
    }

    // 2. Coleccionables
    for (const item of this.items) {
      ctx.save();
      const hover = Math.sin(item.rotAngle * 2) * 5;
      const drawY = item.y + hover;

      if (item.type === "medallion") {
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

    // 1. Sombra en la nieve
    const heightAboveGround = Math.max(0, this.groundSurfaceY - this.playerY);
    const shadowScale = Math.max(0.25, 1 - heightAboveGround / 220);

    ctx.fillStyle = "rgba(7, 20, 38, 0.35)";
    ctx.beginPath();
    ctx.ellipse(
      drawX + this.playerWidth * 0.48,
      this.groundSurfaceY + 2,
      this.playerWidth * 0.42 * shadowScale,
      8 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. Aura Power-Up
    if (this.isLogoPowerUpActive) {
      const auraGrad = ctx.createRadialGradient(
        drawX + this.playerWidth * 0.5,
        drawY - this.playerHeight * 0.4,
        15,
        drawX + this.playerWidth * 0.5,
        drawY - this.playerHeight * 0.4,
        this.playerWidth * 0.75
      );
      auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.8)");
      auraGrad.addColorStop(0.5, "rgba(255, 110, 0, 0.35)");
      auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(drawX + this.playerWidth * 0.5, drawY - this.playerHeight * 0.4, this.playerWidth * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Parpadeo de invulnerabilidad tras golpe
    if (this.hitInvulnerabilityTimer > 0) {
      const flash = Math.sin(this.hitInvulnerabilityTimer * 25);
      if (flash > 0) {
        ctx.globalAlpha = 0.45;
      }
    }

    // 4. Partículas locales de nieve
    for (const p of this.snowParticles) {
      const a = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 5. Inclinación y renderizado del trineo
    ctx.translate(drawX + this.playerWidth * 0.5, drawY - this.playerHeight * 0.5);
    ctx.rotate((this.sledPitch * Math.PI) / 180);

    if (this.imgSledLateral && this.imgSledLateral.complete && this.imgSledLateral.naturalWidth > 0) {
      ctx.drawImage(
        this.imgSledLateral,
        -this.playerWidth * 0.5,
        -this.playerHeight * 0.5,
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
    if (this.currentSpeed > 520 || this.isLogoPowerUpActive) {
      ctx.save();
      ctx.strokeStyle = this.isLogoPowerUpActive ? "rgba(255, 215, 0, 0.4)" : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      const count = this.isLogoPowerUpActive ? 6 : 3;
      for (let i = 0; i < count; i++) {
        const lx = Math.random() * this.width;
        const ly = Math.random() * (this.groundSurfaceY - 40);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 50, ly);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawOverlayInfo(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Mensaje Tutorial
    if (this.showTutorialHint) {
      ctx.fillStyle = "rgba(7, 18, 34, 0.88)";
      const boxW = Math.min(this.width * 0.88, 480);
      const boxH = 68;
      const boxX = (this.width - boxW) * 0.5;
      const boxY = this.height * 0.82;

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
