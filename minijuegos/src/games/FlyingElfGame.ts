/**
 * ==============================================================================
 * JUEGO: 🧝‍♂️ EL VUELO MÁGICO DEL ELFO (Flying Elf Magic Paraglider - 2D Fantasy)
 * ==============================================================================
 * 
 * ARQUITECTURA VISUAL UNIFICADA (Single Cohesive Christmas World):
 * - Un ÚNICO escenario panorámico continuo de Villa Navideña Mágica.
 * - Sin collages, sin recortes superpuestos de casas desalineadas, sin paneles extraños.
 * - Personaje 100% limpio y transparente con el Logo Oficial de la Feria Mágica en el parapente.
 * - Obstáculos ilustrados integrados (Chimenea rústica y Estalactitas de hielo).
 * - Coleccionables con sutil aura verde y Medallón de Poder con aura dorada.
 * - Scroll infinito continuo y pre-cargado desde el primer frame.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface CollectibleItem {
  x: number;
  y: number;
  size: number;
  type: "gift_red" | "gift_green" | "candy" | "teddy" | "logo_star";
  points: number;
  bobOffset: number;
  bobSpeed: number;
  isMagnetized?: boolean;
}

interface ObstacleItem {
  x: number;
  y: number;
  baseY: number;
  width: number;
  height: number;
  type: "house" | "icicle";
  isOscillating?: boolean;
  oscillateSpeed?: number;
  oscillateAmp?: number;
  oscillateTime?: number;
  smokeTimer?: number;
}

interface GroundProp {
  x: number;
  type: "lamp" | "tree" | "fence" | "gift_pile";
  scale: number;
  lightPhase: number;
}

interface BackgroundSign {
  x: number;
  type: "feria" | "sponsor";
  scale: number;
  lightPhase: number;
}

export class FlyingElfGame extends BaseGame {
  // Físicas y posición del Elfo
  private elfX: number = 240;
  private elfY: number = 550;
  private elfVy: number = 0;
  private elfAngle: number = 0;
  private elfTargetAngle: number = 0;
  private elfWidth: number = 175;
  private elfHeight: number = 175;

  // Parapente y balanceo orgánico
  private gliderSwayTime: number = 0;

  // Invulnerabilidad tras golpe
  private hitCooldown: number = 0;
  private isFlashing: boolean = false;

  // Power-Up Mágico (Turbo + Imán)
  private magnetRadius: number = 360;

  // Combo
  private comboCount: number = 0;
  private comboTimer: number = 0;

  // Listas de entidades activas
  private collectibles: CollectibleItem[] = [];
  private obstacles: ObstacleItem[] = [];
  private groundProps: GroundProp[] = [];
  private backgroundSigns: BackgroundSign[] = [];

  // Temporizadores de spawn y dificultad
  private spawnItemTimer: number = 0;
  private spawnObstacleTimer: number = 0;
  private speedMultiplier: number = 1.0;
  private baseScrollSpeed: number = 520; // Velocidad base incrementada para alta adrenalina arcade

  // Ráfagas de viento / Vórtice mágico
  private windTimer: number = 0;
  private isWindActive: boolean = false;
  private windForceY: number = 0;

  // Desplazamiento del Escenario Unificado
  private bgScrollX: number = 0;
  private groundScrollX: number = 0;

  // Partículas de humo de chimenea
  private chimneyPuffs: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number; maxLife: number; life: number }[] = [];

  // Assets Ilustrados Pre-cargados
  private imgElf: HTMLImageElement;
  private imgBgPanorama: HTMLImageElement;
  private imgHouseObstacle: HTMLImageElement;
  private imgIcicle: HTMLImageElement;
  private imgCartelFeria: HTMLImageElement;
  private imgCartelSponsor: HTMLImageElement;
  private imgTree: HTMLImageElement;
  private imgGiftRed: HTMLImageElement;
  private imgGiftGreen: HTMLImageElement;
  private imgGiftRed2: HTMLImageElement;
  private imgCandy: HTMLImageElement;
  private imgTeddy: HTMLImageElement;
  private imgStarLogo: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "flying-elf",
      "🧝‍♂️ El Vuelo Mágico del Elfo",
      "¡Mantén pulsado para volar y suelta para planear! Recoge regalos y esquiva peligros.",
      canvas,
      input,
      audio,
      particles
    );

    // 1. Personaje Elfo con Parapente Limpio y Logo Oficial integrado
    this.imgElf = new Image();
    this.imgElf.src = "./assets/images/elfo-volador.png";

    // 2. Único Fondo Panorámico Continuo de la Villa Navideña
    this.imgBgPanorama = new Image();
    this.imgBgPanorama.src = "./assets/images/fondo-villa-seamless.jpg";

    // 3. Obstáculos Ilustrados 2D (Casa navideña con tejado/chimenea y Estalactitas)
    this.imgHouseObstacle = new Image();
    this.imgHouseObstacle.src = "./assets/images/casa-obstaculo.png";

    this.imgIcicle = new Image();
    this.imgIcicle.src = "./assets/images/estalactita-hielo.png";

    // 4. Carteles de Publicidad con Logos Integrados en el Escenario
    this.imgCartelFeria = new Image();
    this.imgCartelFeria.src = "./assets/images/cartel-feria.png";

    this.imgCartelSponsor = new Image();
    this.imgCartelSponsor.src = "./assets/images/cartel-sponsor.png";

    // 5. Decoraciones de Piso
    this.imgTree = new Image();
    this.imgTree.src = "./assets/images/arbol.png";

    // 6. Coleccionables Ilustrados 2D
    this.imgGiftRed = new Image();
    this.imgGiftRed.src = "./assets/images/regalo-rojo.png";

    this.imgGiftGreen = new Image();
    this.imgGiftGreen.src = "./assets/images/regalo-verde.png";

    this.imgGiftRed2 = new Image();
    this.imgGiftRed2.src = "./assets/images/regalo-rojo2.png";

    this.imgCandy = new Image();
    this.imgCandy.src = "./assets/images/baston-caramelo.png";

    this.imgTeddy = new Image();
    this.imgTeddy.src = "./assets/images/osito.png";

    this.imgStarLogo = new Image();
    this.imgStarLogo.src = "./assets/images/estrella con logo.png";
  }

  protected override onStart(): void {
    this.elfX = Math.max(140, this.width * 0.22);
    this.elfY = this.height * 0.45;
    this.elfVy = 0;
    this.elfAngle = 0;
    this.hitCooldown = 0;
    this.isLogoPowerUpActive = false;
    this.logoPowerUpTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.speedMultiplier = 1.0;
    this.bgScrollX = 0;
    this.groundScrollX = 0;
    this.chimneyPuffs = [];

    this.collectibles = [];
    this.obstacles = [];
    this.groundProps = [];
    this.backgroundSigns = [];
    this.spawnItemTimer = 0.35;
    this.spawnObstacleTimer = 0.95;
    this.windTimer = 5.5;
    this.isWindActive = false;

    // Inicializar decoraciones del suelo y carteles publicitarios de fondo
    this.initGroundProps();
    this.initBackgroundSigns();
  }

  private initBackgroundSigns(): void {
    const spacing = 480;
    const count = Math.ceil(this.width / spacing) + 3;
    for (let i = 0; i < count; i++) {
      this.backgroundSigns.push({
        x: i * spacing + 100,
        type: i % 2 === 0 ? "feria" : "sponsor",
        scale: 1.0 + Math.random() * 0.15,
        lightPhase: Math.random() * Math.PI * 2
      });
    }
  }

  private initGroundProps(): void {
    const spacing = 180;
    const count = Math.ceil(this.width / spacing) + 3;
    const propTypes: ("lamp" | "tree" | "fence" | "gift_pile")[] = ["lamp", "tree", "fence", "gift_pile", "lamp", "tree"];
    for (let i = 0; i < count; i++) {
      this.groundProps.push({
        x: i * spacing + (Math.random() * 40 - 20),
        type: propTypes[i % propTypes.length],
        scale: 0.85 + Math.random() * 0.3,
        lightPhase: Math.random() * Math.PI * 2
      });
    }
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.elfX = Math.max(140, this.width * 0.22);
    this.elfWidth = Math.max(130, Math.min(195, this.width * 0.22));
    this.elfHeight = this.elfWidth;
  }

  protected override onUpdate(dt: number): void {
    // 1. Progresión de Dificultad Dinámica Elevada (Arcade rápido y desafiante)
    const timeElapsed = 45 - this.timeRemaining;
    if (timeElapsed < 10) {
      this.speedMultiplier = 1.15;
    } else if (timeElapsed < 22) {
      this.speedMultiplier = 1.55;
    } else if (timeElapsed < 35) {
      this.speedMultiplier = 1.95;
    } else {
      this.speedMultiplier = 2.40; // Clímax ultra rápido
    }

    if (this.isLogoPowerUpActive) {
      this.speedMultiplier *= 1.25; // Turbo activo
    }

    const currentScrollSpeed = this.baseScrollSpeed * this.speedMultiplier * dt;
    this.bgScrollX += currentScrollSpeed * 0.45;
    this.groundScrollX += currentScrollSpeed * 1.0;
    this.gliderSwayTime += dt * 5.0;

    // 2. Sistema de Viento / Turbulencia Mágica
    this.windTimer -= dt;
    if (this.windTimer <= 0) {
      if (!this.isWindActive) {
        this.isWindActive = true;
        this.windTimer = 3.5;
        this.windForceY = (Math.random() > 0.5 ? 1 : -1) * (380 + Math.random() * 260);
      } else {
        this.isWindActive = false;
        this.windTimer = 5.0 + Math.random() * 4.0;
        this.windForceY = 0;
      }
    }

    // 3. Entrada de Usuario: Pantalla Táctil o Teclado
    const pointer = this.input.getPrimaryPointer();
    const isTouchThrust = pointer ? pointer.isDown : false;
    const isKeyboardThrust =
      this.input.isKeyDown("Space") ||
      this.input.isKeyDown("KeyW") ||
      this.input.isKeyDown("ArrowUp");

    const thrusting = isTouchThrust || isKeyboardThrust;

    // 4. Físicas ágiles del Elfo (Mayor respuesta y reto en caída/elevación)
    const gravity = 1550; // px/s^2
    const lift = 2600;    // px/s^2

    if (thrusting) {
      this.elfVy -= lift * dt;
      if (this.elfVy < -640) this.elfVy = -640;
      this.elfTargetAngle = -0.24;

      // Estela mágica de vuelo
      if (Math.random() < 0.5) {
        const exhaustX = this.elfX - this.elfWidth * 0.28;
        const exhaustY = this.elfY + this.elfHeight * 0.12;
        this.particles.emitBurst(
          exhaustX,
          exhaustY,
          this.isLogoPowerUpActive ? "#FFD700" : "#FFF59D",
          1
        );
      }
    } else {
      this.elfVy += gravity * dt;
      if (this.elfVy > 660) this.elfVy = 660;
      this.elfTargetAngle = 0.18;
    }

    // Efecto de viento sobre el elfo
    if (this.isWindActive) {
      this.elfVy += this.windForceY * dt * 0.85;
    }

    // Suavizado del ángulo de cabeceo
    this.elfAngle += (this.elfTargetAngle - this.elfAngle) * 9.5 * dt;

    // Actualizar posición vertical
    this.elfY += this.elfVy * dt;

    // Límites de pantalla seguros
    const minY = 90;
    const maxY = this.height - 130;
    if (this.elfY < minY) {
      this.elfY = minY;
      this.elfVy = 0;
    } else if (this.elfY > maxY) {
      this.elfY = maxY;
      this.elfVy = 0;
    }

    // Cooldown de golpe con parpadeo visual
    if (this.hitCooldown > 0) {
      this.hitCooldown -= dt;
      this.isFlashing = Math.floor(this.hitCooldown * 14) % 2 === 0;
    } else {
      this.isFlashing = false;
    }

    // Temporizador de Combo
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Power-up de Logo activo (Turbo + Imán)
    if (this.isLogoPowerUpActive) {
      this.logoPowerUpTimer -= dt;
      if (this.logoPowerUpTimer <= 0) {
        this.isLogoPowerUpActive = false;
      } else if (Math.random() < 0.3) {
        this.particles.emitBurst(
          this.elfX + (Math.random() - 0.5) * 50,
          this.elfY + (Math.random() - 0.5) * 50,
          "#FFD700",
          1
        );
      }
    }

    // 5. Actualizar Entidades, Carteles de Publicidad y Decoraciones
    this.updateBackgroundSigns(dt, currentScrollSpeed);
    this.updateGroundProps(dt, currentScrollSpeed);
    this.updateCollectibles(dt, currentScrollSpeed);
    this.updateObstacles(dt, currentScrollSpeed);
    this.updateChimneyPuffs(dt);

    // 6. Generación Rápida de Nuevos Objetos y Obstáculos Desafiantes
    this.spawnItemTimer -= dt;
    if (this.spawnItemTimer <= 0) {
      this.spawnCollectiblePattern();
      this.spawnItemTimer = Math.max(0.32, 0.82 / this.speedMultiplier);
    }

    this.spawnObstacleTimer -= dt;
    if (this.spawnObstacleTimer <= 0) {
      this.spawnObstacle();
      this.spawnObstacleTimer = Math.max(0.55, 1.25 / this.speedMultiplier);
    }
  }

  private updateBackgroundSigns(_dt: number, scrollSpeed: number): void {
    const spacing = 520;
    for (let i = 0; i < this.backgroundSigns.length; i++) {
      const sign = this.backgroundSigns[i];
      sign.x -= scrollSpeed * 0.72; // Movimiento de fondo medio / parallax
      sign.lightPhase += _dt * 3.0;
    }

    for (let i = 0; i < this.backgroundSigns.length; i++) {
      const sign = this.backgroundSigns[i];
      if (sign.x < -220) {
        let maxX = 0;
        for (const s of this.backgroundSigns) {
          if (s.x > maxX) maxX = s.x;
        }
        sign.x = Math.max(this.width + 80, maxX + spacing + (Math.random() * 60 - 30));
        sign.type = Math.random() > 0.5 ? "feria" : "sponsor";
        sign.scale = 0.95 + Math.random() * 0.15;
      }
    }
  }

  private updateGroundProps(_dt: number, scrollSpeed: number): void {
    const spacing = 190;
    for (let i = 0; i < this.groundProps.length; i++) {
      const prop = this.groundProps[i];
      prop.x -= scrollSpeed;
      prop.lightPhase += _dt * 3.5;
    }

    // Reciclar props que salen por la izquierda
    for (let i = 0; i < this.groundProps.length; i++) {
      const prop = this.groundProps[i];
      if (prop.x < -160) {
        // Encontrar el prop más a la derecha
        let maxX = 0;
        for (const p of this.groundProps) {
          if (p.x > maxX) maxX = p.x;
        }
        prop.x = Math.max(this.width + 40, maxX + spacing + (Math.random() * 30 - 15));
        const propTypes: ("lamp" | "tree" | "fence" | "gift_pile")[] = ["lamp", "tree", "fence", "gift_pile"];
        prop.type = propTypes[Math.floor(Math.random() * propTypes.length)];
        prop.scale = 0.85 + Math.random() * 0.3;
      }
    }
  }

  private updateChimneyPuffs(dt: number): void {
    for (let i = this.chimneyPuffs.length - 1; i >= 0; i--) {
      const p = this.chimneyPuffs[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += dt * 14;
      p.alpha = Math.max(0, (1 - p.life / p.maxLife) * 0.65);

      if (p.life >= p.maxLife || p.x < -50) {
        this.chimneyPuffs.splice(i, 1);
      }
    }
  }

  private spawnCollectiblePattern(): void {
    const types: ("gift_red" | "gift_green" | "candy" | "teddy" | "logo_star")[] = [
      "gift_red",
      "gift_green",
      "candy",
      "gift_red",
      "candy",
      "teddy"
    ];

    if (Math.random() < 0.14 && !this.isLogoPowerUpActive) {
      types.push("logo_star");
    }

    const chosenType = types[Math.floor(Math.random() * types.length)];
    let points = 100;
    let size = 64;

    if (chosenType === "gift_red") {
      points = 100;
      size = 66;
    } else if (chosenType === "gift_green") {
      points = 150;
      size = 66;
    } else if (chosenType === "candy") {
      points = 50;
      size = 60;
    } else if (chosenType === "teddy") {
      points = 250;
      size = 74;
    } else if (chosenType === "logo_star") {
      points = 500;
      size = 82;
    }

    const baseSpawnY = 140 + Math.random() * (this.height - 350);

    // Ocasionalmente genera una fila o arco de 2-3 coleccionables desafiantes
    const patternCount = Math.random() < 0.35 ? 2 : 1;
    for (let k = 0; k < patternCount; k++) {
      const offsetX = k * 70;
      const offsetY = k * (Math.random() > 0.5 ? 35 : -35);
      const clampedY = Math.max(120, Math.min(this.height - 180, baseSpawnY + offsetY));

      this.collectibles.push({
        x: this.width + 80 + offsetX,
        y: clampedY,
        size: size,
        type: chosenType,
        points: points,
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 3.0 + Math.random() * 1.5
      });
    }
  }

  private spawnObstacle(): void {
    const isTopObstacle = Math.random() > 0.52;
    const timeElapsed = 45 - this.timeRemaining;
    const canOscillate = timeElapsed > 12 && Math.random() < 0.45;

    if (isTopObstacle) {
      // Estalactita de hielo colgante del cielo
      const oWidth = 105 + Math.random() * 30;
      const oHeight = 170 + Math.random() * 120;
      this.obstacles.push({
        x: this.width + 100,
        y: 0,
        baseY: 0,
        width: oWidth,
        height: oHeight,
        type: "icicle",
        isOscillating: canOscillate,
        oscillateSpeed: 2.2 + Math.random() * 1.8,
        oscillateAmp: 30 + Math.random() * 35,
        oscillateTime: Math.random() * Math.PI * 2
      });
    } else {
      // Casa rústica navideña con tejado nevado y chimenea humeante en la cima
      const oWidth = 230 + Math.random() * 55;
      const oHeight = 240 + Math.random() * 100;
      const startY = this.height - oHeight - 20;
      this.obstacles.push({
        x: this.width + 100,
        y: startY,
        baseY: startY,
        width: oWidth,
        height: oHeight,
        type: "house",
        smokeTimer: 0.1
      });
    }
  }

  private updateCollectibles(dt: number, scrollSpeed: number): void {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];

      // Atracción magnética si el Power-Up está activo
      if (this.isLogoPowerUpActive) {
        const dx = this.elfX - item.x;
        const dy = this.elfY - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.magnetRadius) {
          item.isMagnetized = true;
          const pullForce = 820 * dt;
          item.x += (dx / dist) * pullForce;
          item.y += (dy / dist) * pullForce;
        }
      }

      if (!item.isMagnetized) {
        item.x -= scrollSpeed;
        item.bobOffset += item.bobSpeed * dt;
      }

      // Colisión circular precisa con el Elfo
      const elfHitboxRadius = 46;
      const itemRadius = item.size * 0.42;
      const currentY = item.y + Math.sin(item.bobOffset) * 10;

      const cdx = this.elfX - item.x;
      const cdy = this.elfY - currentY;
      const distElf = Math.sqrt(cdx * cdx + cdy * cdy);

      if (distElf < elfHitboxRadius + itemRadius) {
        this.collectItem(item, i);
        continue;
      }

      if (item.x < -120) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  private collectItem(item: CollectibleItem, index: number): void {
    this.collectibles.splice(index, 1);

    // Incrementar combo
    this.comboCount++;
    this.comboTimer = 2.8;
    const comboMultiplier = Math.min(5, Math.floor(1 + this.comboCount / 3));

    let finalPoints = item.points * comboMultiplier;
    if (this.isLogoPowerUpActive) {
      finalPoints *= 2;
    }

    this.score += finalPoints;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Feedback visual y de audio
    if (item.type === "logo_star") {
      this.isLogoPowerUpActive = true;
      this.logoPowerUpTimer = 5.0;
      this.audio.playGiftUnwrap();
      this.particles.emitBurst(this.elfX, this.elfY, "#FFD700", 25);
      this.addFloatingText("✨ ¡TURBO + IMÁN x2! ✨", this.elfX, this.elfY - 45, "#FFE082", 1.35);
    } else {
      this.audio.playBellNote(2);
      this.particles.emitBurst(this.elfX, this.elfY, "#00E676", 6);
      const comboLabel = comboMultiplier > 1 ? ` (x${comboMultiplier})` : "";
      this.addFloatingText(`+${finalPoints}${comboLabel}`, item.x, item.y, "#76FF03", 1.15);
    }
  }

  private updateObstacles(dt: number, scrollSpeed: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= scrollSpeed;

      // Movimiento oscilante dinámico para estalactitas desafiantes
      if (obs.isOscillating && obs.oscillateSpeed && obs.oscillateAmp !== undefined) {
        obs.oscillateTime = (obs.oscillateTime || 0) + dt * obs.oscillateSpeed;
        obs.y = obs.baseY + Math.sin(obs.oscillateTime) * obs.oscillateAmp;
      }

      // Emisión de humo y chispas cálidas desde la chimenea de la casa
      if (obs.type === "house") {
        obs.smokeTimer = (obs.smokeTimer || 0) - dt;
        if (obs.smokeTimer <= 0) {
          obs.smokeTimer = 0.16 + Math.random() * 0.14;
          const chimneyTopX = obs.x + obs.width * 0.67;
          const chimneyTopY = obs.y + obs.height * 0.12;

          this.chimneyPuffs.push({
            x: chimneyTopX + (Math.random() * 12 - 6),
            y: chimneyTopY,
            vx: -scrollSpeed * 0.45 + (Math.random() * 16 - 8),
            vy: -48 - Math.random() * 32,
            radius: 8 + Math.random() * 6,
            alpha: 0.65,
            maxLife: 1.4,
            life: 0
          });
        }
      }

      // Colisión precisa con la hitbox del Elfo
      const elfLeft = this.elfX - 34;
      const elfRight = this.elfX + 34;
      const elfTop = this.elfY - 38;
      const elfBottom = this.elfY + 38;

      if (obs.type === "icicle") {
        const obsLeft = obs.x + obs.width * 0.18;
        const obsRight = obs.x + obs.width * 0.82;
        const obsTop = obs.y;
        const obsBottom = obs.y + obs.height;

        if (
          elfRight > obsLeft &&
          elfLeft < obsRight &&
          elfBottom > obsTop &&
          elfTop < obsBottom
        ) {
          this.hitObstacle(obs, i);
        }
      } else if (obs.type === "house") {
        // Colisión en 2 bloques: Tejado/Chimenea superior y Cuerpo de la casa
        // 1. Tejado y Chimenea (zona alta)
        const roofLeft = obs.x + obs.width * 0.26;
        const roofRight = obs.x + obs.width * 0.78;
        const roofTop = obs.y + obs.height * 0.08;
        const roofBottom = obs.y + obs.height * 0.50;

        // 2. Base de la casa (zona inferior)
        const baseLeft = obs.x + obs.width * 0.12;
        const baseRight = obs.x + obs.width * 0.88;
        const baseTop = obs.y + obs.height * 0.50;
        const baseBottom = obs.y + obs.height;

        const hitRoof = elfRight > roofLeft && elfLeft < roofRight && elfBottom > roofTop && elfTop < roofBottom;
        const hitBase = elfRight > baseLeft && elfLeft < baseRight && elfBottom > baseTop && elfTop < baseBottom;

        if (hitRoof || hitBase) {
          this.hitObstacle(obs, i);
        }
      }

      if (obs.x < -280) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private hitObstacle(obs: ObstacleItem, index: number): void {
    // Si el escudo de turbo está activo, destruye el obstáculo
    if (this.isLogoPowerUpActive) {
      this.obstacles.splice(index, 1);
      this.particles.emitBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, "#FFD700", 22);
      this.audio.playTap();
      this.addFloatingText("💥 ¡DESTRUIDO! +300", obs.x, obs.y, "#FFE082", 1.25);
      this.score += 300;
      return;
    }

    if (this.hitCooldown > 0) return;

    this.hitCooldown = 1.35;
    this.timeRemaining = Math.max(1, this.timeRemaining - 3.5); // Penalización estricta -3.5s
    this.comboCount = 0;

    // Feedback de impacto controlado
    this.triggerShake(0.40, 14);
    this.audio.playError();
    this.particles.emitBurst(this.elfX, this.elfY, "#FF1744", 20);
    this.addFloatingText("-3.5s ⚠️", this.elfX, this.elfY - 45, "#FF1744", 1.35);
  }

  protected override onDraw(ctx: CanvasRenderingContext2D): void {
    // ========================================================================
    // 1. FONDO OBLIGATORIO: UN ÚNICO MUNDO VISUAL CONTINUO
    // ========================================================================
    this.renderSingleUnifiedWorld(ctx);

    // ========================================================================
    // 2. CARTELES PUBLICITARIOS INTEGRADOS EN LA VILLA (Logos Oficiales)
    // ========================================================================
    this.renderBackgroundSigns(ctx);

    // ========================================================================
    // 3. HUMO DE CHIMENEAS Y EFECTOS DE VIENTO
    // ========================================================================
    this.renderChimneyPuffs(ctx);
    if (this.isWindActive) {
      this.renderWindGusts(ctx);
    }

    // ========================================================================
    // 4. ELEMENTOS DE GAMEPLAY: Obstáculos y Coleccionables
    // ========================================================================
    this.renderObstacles(ctx);
    this.renderCollectibles(ctx);

    // ========================================================================
    // 5. DECORACIÓN DEL SUELO (Farolas, Árboles, Vallas con Luces, Montículos)
    // ========================================================================
    this.renderGroundDecorations(ctx);

    // ========================================================================
    // 6. PERSONAJE: Elfo Mensajero Limpio con Parapente Oficial
    // ========================================================================
    this.renderElf(ctx);

    // ========================================================================
    // 7. AMBIENTE Y HUD: Nieve flotante y medidores arcade
    // ========================================================================
    this.renderAtmosphere(ctx);
    this.renderHUDOverlay(ctx);
  }

  /**
   * Dibuja carteles publicitarios de madera con los logos de la Feria y Patrocinadores integrados en la villa
   */
  private renderBackgroundSigns(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const signBaseY = this.height - 195;

    for (const sign of this.backgroundSigns) {
      if (sign.x < -200 || sign.x > this.width + 200) continue;

      ctx.save();
      ctx.translate(sign.x, signBaseY);
      ctx.scale(sign.scale * 0.35, sign.scale * 0.35);

      const imgToDraw = sign.type === "feria" ? this.imgCartelFeria : this.imgCartelSponsor;
      if (imgToDraw.complete && imgToDraw.naturalWidth > 0) {
        // Resplandor cálido de las luces navideñas del cartel
        const lightFlicker = 0.8 + Math.sin(sign.lightPhase) * 0.2;
        ctx.shadowColor = sign.type === "feria" ? "rgba(255, 215, 0, 0.85)" : "rgba(129, 212, 250, 0.85)";
        ctx.shadowBlur = 22 * lightFlicker;

        ctx.drawImage(imgToDraw, -imgToDraw.naturalWidth / 2, -imgToDraw.naturalHeight / 2);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Dibuja un único mundo panorámico continuo de Villa Navideña sin solapamientos
   */
  private renderSingleUnifiedWorld(ctx: CanvasRenderingContext2D): void {
    // Relleno base nocturno para asegurar opacidad al 100%
    ctx.fillStyle = "#061226";
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.imgBgPanorama.complete && this.imgBgPanorama.naturalWidth > 0) {
      const imgW = this.imgBgPanorama.naturalWidth;
      const imgH = this.imgBgPanorama.naturalHeight;

      const scale = Math.max(this.height / imgH, this.width / imgW);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawY = this.height - drawH;

      let offsetX = -(this.bgScrollX % drawW);
      while (offsetX < this.width) {
        ctx.drawImage(this.imgBgPanorama, offsetX, drawY, drawW, drawH);
        offsetX += drawW - 1;
      }
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, "#030A16");
      skyGrad.addColorStop(0.5, "#091B33");
      skyGrad.addColorStop(1, "#122E54");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderChimneyPuffs(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.chimneyPuffs) {
      ctx.fillStyle = `rgba(220, 230, 242, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Pequeño núcleo cálido cerca de la boca de la chimenea
      if (p.life < 0.4) {
        ctx.fillStyle = `rgba(255, 179, 0, ${p.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderWindGusts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = "rgba(179, 229, 252, 0.4)";
    ctx.lineWidth = 2.5;
    const windOffset = (this.gliderSwayTime * 500) % (this.width + 200);

    for (let w = 0; w < 4; w++) {
      const wx = this.width - ((windOffset + w * 180) % (this.width + 200));
      const wy = 150 + w * 120 + Math.sin(this.gliderSwayTime + w) * 30;

      ctx.beginPath();
      ctx.moveTo(wx + 100, wy);
      ctx.quadraticCurveTo(wx + 40, wy + (this.windForceY > 0 ? 25 : -25), wx, wy);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renderiza la capa de decoración del piso:
   * - Montículos de nieve iluminados
   * - Farolas victorianas cálidas
   * - Árboles navideños decorados
   * - Vallas de madera con guirnaldas y luces
   * - Cajas de regalos
   */
  private renderGroundDecorations(ctx: CanvasRenderingContext2D): void {
    const floorBaseY = this.height - 55;

    // 1. Capa base de montículos de nieve con degradado invernal
    ctx.save();
    const snowGrad = ctx.createLinearGradient(0, floorBaseY - 35, 0, this.height);
    snowGrad.addColorStop(0, "rgba(225, 245, 254, 0.95)");
    snowGrad.addColorStop(0.3, "rgba(179, 229, 252, 0.95)");
    snowGrad.addColorStop(1, "rgba(79, 134, 198, 0.98)");

    ctx.fillStyle = snowGrad;
    ctx.beginPath();
    ctx.moveTo(0, this.height);

    // Ondulación suave de la nieve
    const step = 45;
    for (let x = 0; x <= this.width + step; x += step) {
      const worldX = x + this.groundScrollX;
      const wave = Math.sin(worldX * 0.012) * 14 + Math.cos(worldX * 0.024) * 8;
      const y = floorBaseY + wave;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();

    // Borde brillante de escarcha/hielo sobre la cresta de nieve
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 2. Elementos decorativos (Props de suelo)
    for (const prop of this.groundProps) {
      if (prop.x < -100 || prop.x > this.width + 100) continue;

      const worldX = prop.x + this.groundScrollX;
      const groundY = floorBaseY + Math.sin(worldX * 0.012) * 14 + Math.cos(worldX * 0.024) * 8;

      ctx.save();
      ctx.translate(prop.x, groundY);
      ctx.scale(prop.scale, prop.scale);

      if (prop.type === "lamp") {
        // Farola Victoriana Dorada con Luz Cálida
        this.drawStreetLamp(ctx, prop.lightPhase);
      } else if (prop.type === "tree") {
        // Pino Navideño con Luces de Colores
        this.drawFestiveTree(ctx, prop.lightPhase);
      } else if (prop.type === "fence") {
        // Valla de Madera con Guirnalda
        this.drawGarlandFence(ctx, prop.lightPhase);
      } else if (prop.type === "gift_pile") {
        // Pila de Regalos en la Nieve
        this.drawGiftPile(ctx);
      }

      ctx.restore();
    }
  }

  private drawStreetLamp(ctx: CanvasRenderingContext2D, lightPhase: number): void {
    const flicker = 0.85 + Math.sin(lightPhase) * 0.15;

    // Resplandor cálido de la farola
    ctx.save();
    const lampGlow = ctx.createRadialGradient(0, -68, 5, 0, -68, 55);
    lampGlow.addColorStop(0, `rgba(255, 224, 130, ${0.7 * flicker})`);
    lampGlow.addColorStop(0.5, `rgba(255, 160, 0, ${0.35 * flicker})`);
    lampGlow.addColorStop(1, "rgba(255, 160, 0, 0)");
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(0, -68, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Poste de hierro forjado oscuro con detalles dorados
    ctx.fillStyle = "#1A2530";
    ctx.fillRect(-3.5, -60, 7, 60);

    // Base del poste
    ctx.fillStyle = "#0F1720";
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 8, 2);
    ctx.fill();

    // Corona y campana de la farola
    ctx.fillStyle = "#D4AF37"; // Dorado
    ctx.beginPath();
    ctx.moveTo(-10, -60);
    ctx.lineTo(10, -60);
    ctx.lineTo(7, -78);
    ctx.lineTo(-7, -78);
    ctx.closePath();
    ctx.fill();

    // Cristal encendido
    ctx.fillStyle = `rgba(255, 241, 118, ${0.95 * flicker})`;
    ctx.beginPath();
    ctx.arc(0, -68, 8, 0, Math.PI * 2);
    ctx.fill();

    // Tejadillo con nieve
    ctx.fillStyle = "#37474F";
    ctx.beginPath();
    ctx.moveTo(-13, -76);
    ctx.lineTo(0, -88);
    ctx.lineTo(13, -76);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ECEFF1"; // Nieve sobre el tejadillo
    ctx.beginPath();
    ctx.arc(0, -87, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFestiveTree(ctx: CanvasRenderingContext2D, lightPhase: number): void {
    if (this.imgTree.complete && this.imgTree.naturalWidth > 0) {
      ctx.drawImage(this.imgTree, -32, -85, 64, 90);
    } else {
      // Dibujo estilizado de pino invernal
      ctx.fillStyle = "#1B4D3E";
      // Nivel inferior
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(0, -45);
      ctx.lineTo(28, 0);
      ctx.closePath();
      ctx.fill();

      // Nivel medio
      ctx.fillStyle = "#246B56";
      ctx.beginPath();
      ctx.moveTo(-22, -30);
      ctx.lineTo(0, -68);
      ctx.lineTo(22, -30);
      ctx.closePath();
      ctx.fill();

      // Nivel superior
      ctx.fillStyle = "#2E8B6E";
      ctx.beginPath();
      ctx.moveTo(-15, -55);
      ctx.lineTo(0, -85);
      ctx.lineTo(15, -55);
      ctx.closePath();
      ctx.fill();
    }

    // Luces navideñas parpadeantes sobre el árbol
    const colors = ["#FF1744", "#FFEA00", "#00E676", "#00E5FF"];
    for (let l = 0; l < 5; l++) {
      const lx = (l - 2) * 11;
      const ly = -20 - l * 12;
      const lightAlpha = 0.4 + Math.sin(lightPhase + l * 1.5) * 0.55;
      ctx.save();
      ctx.globalAlpha = Math.max(0.2, Math.min(1, lightAlpha));
      ctx.fillStyle = colors[l % colors.length];
      ctx.shadowColor = colors[l % colors.length];
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawGarlandFence(ctx: CanvasRenderingContext2D, lightPhase: number): void {
    // Postes de madera rústica
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(-35, -36, 8, 40);
    ctx.fillRect(27, -36, 8, 40);

    // Tablas horizontales
    ctx.fillStyle = "#795548";
    ctx.fillRect(-35, -30, 70, 6);
    ctx.fillRect(-35, -16, 70, 6);

    // Sombrero de nieve sobre los postes
    ctx.fillStyle = "#ECEFF1";
    ctx.beginPath();
    ctx.arc(-31, -36, 6, Math.PI, 0);
    ctx.arc(31, -36, 6, Math.PI, 0);
    ctx.fill();

    // Guirnalda de pino colgante
    ctx.strokeStyle = "#2E7D32";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-31, -26);
    ctx.quadraticCurveTo(0, -10, 31, -26);
    ctx.stroke();

    // Moño rojo central con luces
    ctx.fillStyle = "#D50000";
    ctx.beginPath();
    ctx.arc(0, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const lightFlash = 0.5 + Math.sin(lightPhase * 2) * 0.5;
    ctx.fillStyle = `rgba(255, 235, 59, ${lightFlash})`;
    ctx.beginPath();
    ctx.arc(-15, -18, 2.5, 0, Math.PI * 2);
    ctx.arc(15, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGiftPile(ctx: CanvasRenderingContext2D): void {
    // Regalo rojo principal
    if (this.imgGiftRed2.complete && this.imgGiftRed2.naturalWidth > 0) {
      ctx.drawImage(this.imgGiftRed2, -28, -36, 36, 36);
    } else if (this.imgGiftRed.complete && this.imgGiftRed.naturalWidth > 0) {
      ctx.drawImage(this.imgGiftRed, -26, -34, 34, 34);
    } else {
      ctx.fillStyle = "#D32F2F";
      ctx.fillRect(-24, -30, 30, 30);
    }

    // Regalo verde secundario
    if (this.imgGiftGreen.complete && this.imgGiftGreen.naturalWidth > 0) {
      ctx.drawImage(this.imgGiftGreen, 2, -28, 28, 28);
    } else {
      ctx.fillStyle = "#388E3C";
      ctx.fillRect(2, -24, 24, 24);
    }

    // Bastón de caramelo apoyado
    if (this.imgCandy.complete && this.imgCandy.naturalWidth > 0) {
      ctx.drawImage(this.imgCandy, -8, -38, 20, 38);
    }

    // Nieve cubriendo la base de los regalos
    ctx.fillStyle = "rgba(236, 239, 241, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderObstacles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const obs of this.obstacles) {
      // Sutil aura de advertencia
      ctx.shadowColor = "rgba(255, 23, 68, 0.6)";
      ctx.shadowBlur = 14;

      if (obs.type === "house") {
        if (this.imgHouseObstacle.complete && this.imgHouseObstacle.naturalWidth > 0) {
          ctx.drawImage(this.imgHouseObstacle, obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = "#5D4037";
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      } else if (obs.type === "icicle") {
        if (this.imgIcicle.complete && this.imgIcicle.naturalWidth > 0) {
          ctx.drawImage(this.imgIcicle, obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = "#B3E5FC";
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      }
    }
    ctx.restore();
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const item of this.collectibles) {
      const curY = item.y + Math.sin(item.bobOffset) * 10;

      // Halo verde en coleccionables / Dorado en Estrella de la Feria
      if (item.type === "logo_star") {
        ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowColor = "rgba(0, 230, 118, 0.6)";
        ctx.shadowBlur = 14;
      }

      ctx.save();
      ctx.translate(item.x, curY);

      if (item.type === "gift_red" && this.imgGiftRed.complete) {
        ctx.drawImage(this.imgGiftRed, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "gift_green" && this.imgGiftGreen.complete) {
        ctx.drawImage(this.imgGiftGreen, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "candy" && this.imgCandy.complete) {
        ctx.drawImage(this.imgCandy, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "teddy" && this.imgTeddy.complete) {
        ctx.drawImage(this.imgTeddy, -item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === "logo_star" && this.imgStarLogo.complete) {
        ctx.rotate(this.gliderSwayTime * 1.1);
        ctx.drawImage(this.imgStarLogo, -item.size / 2, -item.size / 2, item.size, item.size);
      } else {
        ctx.fillStyle = "#00E676";
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private renderElf(ctx: CanvasRenderingContext2D): void {
    if (this.isFlashing) return; // Parpadeo durante daño

    ctx.save();
    ctx.translate(this.elfX, this.elfY);
    ctx.rotate(this.elfAngle);

    // Balanceo suave del parapente
    const sway = Math.sin(this.gliderSwayTime) * 2.5;

    // Escudo de Burbuja Mágica durante Turbo/Imán activo
    if (this.isLogoPowerUpActive) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
      ctx.shadowBlur = 24;
      const shieldGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 95);
      shieldGrad.addColorStop(0, "rgba(255, 215, 0, 0.12)");
      shieldGrad.addColorStop(0.85, "rgba(255, 235, 59, 0.35)");
      shieldGrad.addColorStop(1, "rgba(255, 255, 255, 0.85)");
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFF59D";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Dibujar el Sprite Ilustrado del Elfo con su Parapente Limpio
    if (this.imgElf.complete && this.imgElf.naturalWidth > 0) {
      ctx.drawImage(
        this.imgElf,
        -this.elfWidth / 2,
        -this.elfHeight / 2 + sway,
        this.elfWidth,
        this.elfHeight
      );
    } else {
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderAtmosphere(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    const snowTime = this.gliderSwayTime * 2;
    for (let s = 0; s < 22; s++) {
      const sx = (s * 52 + snowTime * 35) % this.width;
      const sy = (s * 68 + snowTime * 65) % this.height;
      const sRadius = 1.6 + (s % 3);
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderHUDOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Indicador de Combo Activo
    if (this.comboCount > 1) {
      const comboMult = Math.min(5, Math.floor(1 + this.comboCount / 3));
      const comboX = this.width / 2;
      const comboY = 115;

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
      ctx.shadowBlur = 14;
      ctx.font = "900 28px 'Outfit', sans-serif";
      ctx.fillText(`🔥 COMBO x${comboMult}`, comboX, comboY);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    // 2. Barra de Turbo / Power-Up de la Feria
    if (this.isLogoPowerUpActive) {
      const barW = Math.min(300, this.width * 0.65);
      const barH = 12;
      const barX = this.width / 2 - barW / 2;
      const barY = 140;
      const progress = Math.max(0, this.logoPowerUpTimer / 5.0);

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4, 4);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFF9C4";
      ctx.font = "bold 13px 'Outfit', sans-serif";
      ctx.fillText("✨ ¡PODER MÁGICO ACTIVO!", this.width / 2, barY - 5);
      ctx.textAlign = "left";
    }

    // 3. Indicador de Viento Activo
    if (this.isWindActive) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#81D4FA";
      ctx.shadowColor = "rgba(129, 212, 250, 0.8)";
      ctx.shadowBlur = 10;
      ctx.font = "bold 16px 'Outfit', sans-serif";
      const directionArrow = this.windForceY > 0 ? "⬇️" : "⬆️";
      ctx.fillText(`💨 VIENTO MÁGICO ${directionArrow}`, this.width / 2, 170);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    // 4. Banner de Clímax últimos 5 segundos
    if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#FF1744";
      ctx.shadowColor = "rgba(255, 23, 68, 0.85)";
      ctx.shadowBlur = 18;
      ctx.font = "900 32px 'Outfit', sans-serif";
      ctx.fillText("⚠️ ¡ÚLTIMOS SEGUNDOS!", this.width / 2, this.height * 0.28);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    }

    ctx.restore();
  }
}
