/**
 * ==============================================================================
 * MINIJUEGO 6: LA CARRERA MÁGICA DE LA VILLA (VillageRunnerGame)
 * ==============================================================================
 * 
 * Runner arcade 2.5D navideño estilo Subway Surfers:
 * - Perspectiva 2.5D con 3 carriles de proyección continua.
 * - Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art.
 * - Control principal: GESTOS SWIPE (← / → / ↑ / ↓) + Teclado + Botones auxiliares discretos.
 * - Personaje: Elfo alegre en Trineo Mágico tallado con estela de nieve y animaciones de salto/deslizamiento/golpe.
 * - Obstáculos inteligentes:
 *     🪵 Valla baja -> ⬆️ SALTAR
 *     🧊 Arco de hielo -> ⬇️ AGACHARSE / DESLIZAR
 *     🛒 Carreta de juguetes -> ↔️ CAMBIAR DE CARRIL
 * - Power-Up "🎪 MEDALLÓN DE LA FERIA": Aura dorada, imán de regalos y Bonus x2 de puntos.
 * - Generador procedural por patrones controlados (100% justo, sin bloqueos imposibles).
 * - Transición de 4 fases temporales en 45s con clímax final.
 */

import { BaseGame } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { InputManager } from "../core/InputManager";
import { ParticleSystem } from "../core/ParticleSystem";

type Lane = -1 | 0 | 1; // -1: Izquierda, 0: Centro, 1: Derecha
type ObstacleType = "fence" | "ice_arch" | "cart";
type ItemType = "gift_red" | "gift_green" | "candy" | "medallion";

interface RunnerObstacle {
  id: number;
  type: ObstacleType;
  lane: Lane;
  z: number; // 0 (cámara) a 2000 (horizonte)
  cleared: boolean;
  hit: boolean;
}

interface RunnerItem {
  id: number;
  type: ItemType;
  lane: Lane;
  z: number;
  collected: boolean;
  rotAngle: number;
}

interface SceneryProp {
  id: number;
  side: -1 | 1; // -1: Izquierda de la pista, 1: Derecha
  z: number;
  type: "house" | "tree" | "lantern" | "market_stall";
}

export class VillageRunnerGame extends BaseGame {
  // Estado del jugador
  private playerLane: Lane = 0;
  private currentLaneX: number = 0; // Interpolación suave (-1 a 1)
  private playerYOffset: number = 0; // Elevación de salto (px)
  private playerVerticalVelocity: number = 0;
  private isJumping: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private slideDuration: number = 0.65;
  private hitInvulnerabilityTimer: number = 0;
  private sledTilt: number = 0; // Grados de inclinación

  // Progresión y velocidad de la carrera
  private gameSpeed: number = 650; // Unidades Z por segundo
  private baseSpeed: number = 650;
  private distanceTraveled: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;

  // Objetos y entidades
  private obstacles: RunnerObstacle[] = [];
  private items: RunnerItem[] = [];
  private sceneryProps: SceneryProp[] = [];
  private entityIdCounter: number = 0;

  // Temporizador de generación procedural
  private nextWaveZ: number = 900;
  private nextSceneryZ: number = 200;

  // Texturas / Imágenes del Arte Conceptual
  private imgSledElf: HTMLImageElement | null = null;
  private imgFence: HTMLImageElement | null = null;
  private imgIceArch: HTMLImageElement | null = null;
  private imgCart: HTMLImageElement | null = null;
  private imgGiftRed: HTMLImageElement | null = null;
  private imgGiftGreen: HTMLImageElement | null = null;
  private imgCandy: HTMLImageElement | null = null;
  private imgMedallion: HTMLImageElement | null = null;
  private imgHorizonBg: HTMLImageElement | null = null;
  private imgHouse: HTMLImageElement | null = null;
  private imgTree: HTMLImageElement | null = null;

  // Reconocimiento de Gestos Swipe
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isSwiping: boolean = false;

  // Tutorial / Indicador inicial en pantalla
  private showTutorialHint: boolean = true;
  private tutorialHintTimer: number = 3.5;

  // Partículas internas de nieve del trineo
  private sledSparks: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "village-runner",
      "La Carrera Mágica de la Villa",
      "¡Desliza a los lados para esquivar, arriba para saltar vallas y abajo para pasar bajo los arcos de hielo!",
      canvas,
      input,
      audio,
      particles
    );

    this.loadAssets();
    this.setupGestureListeners();
  }

  private loadAssets(): void {
    const loadImage = (src: string): HTMLImageElement => {
      const img = new Image();
      img.src = src;
      return img;
    };

    this.imgSledElf = loadImage("./assets/images/corredor-trineo.png");
    this.imgFence = loadImage("./assets/images/obstaculo-valla.png");
    this.imgIceArch = loadImage("./assets/images/obstaculo-arco-hielo.png");
    this.imgCart = loadImage("./assets/images/obstaculo-carreta.png");
    this.imgGiftRed = loadImage("./assets/images/regalo-rojo.png");
    this.imgGiftGreen = loadImage("./assets/images/regalo-verde.png");
    this.imgCandy = loadImage("./assets/images/baston-caramelo.png");
    this.imgMedallion = loadImage("./assets/images/medallon-feria.png");
    this.imgHorizonBg = loadImage("./assets/images/fondo-carrera-horizonte.jpg");
    this.imgHouse = loadImage("./assets/images/casa-roja.png");
    this.imgTree = loadImage("./assets/images/arbol.png");
  }

  /**
   * Detector de gestos Swipe de alta precisión con cero latencia
   */
  private setupGestureListeners(): void {
    const minSwipeDistance = 38; // px

    this.canvas.addEventListener("pointerdown", (e) => {
      if (!this.isRunning || this.isGameOver) return;
      this.touchStartX = e.clientX;
      this.touchStartY = e.clientY;
      this.isSwiping = true;
    }, { passive: true });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.isSwiping || !this.isRunning || this.isGameOver) return;
      const dx = e.clientX - this.touchStartX;
      const dy = e.clientY - this.touchStartY;

      // Detección instantánea al sobrepasar el umbral
      if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Swipe Horizontal
          if (dx > 0) {
            this.handleLaneChange(1); // Derecha
          } else {
            this.handleLaneChange(-1); // Izquierda
          }
        } else {
          // Swipe Vertical
          if (dy < 0) {
            this.handleJump(); // Arriba -> Saltar
          } else {
            this.handleSlide(); // Abajo -> Agacharse / Deslizar
          }
        }
        // Reiniciar punto de inicio para permitir gestos encadenados fluidos
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
      }
    }, { passive: true });

    const endSwipe = () => {
      this.isSwiping = false;
    };
    this.canvas.addEventListener("pointerup", endSwipe, { passive: true });
    this.canvas.addEventListener("pointercancel", endSwipe, { passive: true });

    // Listener de teclado para testing en PC / Desktop
    window.addEventListener("keydown", (e) => {
      if (!this.isRunning || this.isGameOver) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.handleLaneChange(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.handleLaneChange(1);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        this.handleJump();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        this.handleSlide();
      }
    });
  }

  protected onStart(): void {
    this.playerLane = 0;
    this.currentLaneX = 0;
    this.playerYOffset = 0;
    this.playerVerticalVelocity = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.hitInvulnerabilityTimer = 0;
    this.sledTilt = 0;
    this.gameSpeed = this.baseSpeed;
    this.distanceTraveled = 0;
    this.combo = 0;
    this.maxCombo = 0;

    this.obstacles = [];
    this.items = [];
    this.sceneryProps = [];
    this.sledSparks = [];
    this.nextWaveZ = 800;
    this.nextSceneryZ = 150;

    this.showTutorialHint = true;
    this.tutorialHintTimer = 3.5;

    // Poblar props escénicos iniciales a lo largo de la pista
    for (let z = 150; z < 1800; z += 220) {
      this.spawnSceneryPair(z);
    }

    // Primer lote de regalos introductorios
    this.spawnCollectibleLine(0, 700, 3, "gift_green");
  }

  private handleLaneChange(direction: -1 | 1): void {
    if (direction === -1 && this.playerLane > -1) {
      this.playerLane = (this.playerLane - 1) as Lane;
      this.audio.playRunnerLaneSwitch();
      this.sledTilt = -14;
    } else if (direction === 1 && this.playerLane < 1) {
      this.playerLane = (this.playerLane + 1) as Lane;
      this.audio.playRunnerLaneSwitch();
      this.sledTilt = 14;
    }
  }

  private handleJump(): void {
    if (!this.isJumping) {
      this.isJumping = true;
      this.isSliding = false;
      this.playerVerticalVelocity = 640; // Impulso vertical hacia arriba
      this.audio.playRunnerJump();
      this.triggerSledSparks(20, "#FFFFFF");
    }
  }

  private handleSlide(): void {
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    // Si estaba en el aire, forzar descenso rápido (Fast Drop)
    if (this.isJumping) {
      this.playerVerticalVelocity = -400;
    }
    this.audio.playRunnerSlide();
    this.triggerSledSparks(25, "#80D8FF");
  }

  protected onUpdate(dt: number): void {
    // 1. Progresión temporal y velocidad según la fase de partida (45 segundos totales)
    const elapsed = 45 - this.timeRemaining;
    if (elapsed < 10) {
      // Fase 1: Calentamiento y calles de la Villa
      this.gameSpeed = 620;
    } else if (elapsed < 25) {
      // Fase 2: Bosque Nevado
      this.gameSpeed = 740;
    } else if (elapsed < 38) {
      // Fase 3: Mercado Navideño y Puente de Hielo
      this.gameSpeed = 850;
    } else {
      // Fase 4: Clímax "¡LA VILLA SE ACELERA!"
      this.gameSpeed = 980;
    }

    if (this.isLogoPowerUpActive) {
      this.gameSpeed *= 1.15; // Turbo extra durante Power-Up
    }

    const moveStep = this.gameSpeed * dt;
    this.distanceTraveled += moveStep;

    // 2. Temporizador de pista / tutorial
    if (this.showTutorialHint) {
      this.tutorialHintTimer -= dt;
      if (this.tutorialHintTimer <= 0) {
        this.showTutorialHint = false;
      }
    }

    // 3. Suavizado de posición de carril (Interpolación elástica)
    this.currentLaneX += (this.playerLane - this.currentLaneX) * Math.min(1, dt * 14);
    // Recuperar inclinación recta del trineo
    this.sledTilt += (0 - this.sledTilt) * Math.min(1, dt * 8);

    // 4. Física del salto y gravedad
    if (this.isJumping) {
      this.playerYOffset += this.playerVerticalVelocity * dt;
      this.playerVerticalVelocity -= 1450 * dt; // Gravedad

      if (this.playerYOffset <= 0) {
        this.playerYOffset = 0;
        this.playerVerticalVelocity = 0;
        this.isJumping = false;
        this.triggerSledSparks(12, "#E0F7FA");
      }
    }

    // 5. Temporizador de deslizamiento (Agacharse)
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      } else {
        // Generar estela de fricción en la nieve mientras desliza
        if (Math.random() < 0.6) {
          this.triggerSledSparks(2, "#80DEEA");
        }
      }
    }

    // 6. Invulnerabilidad tras impacto
    if (this.hitInvulnerabilityTimer > 0) {
      this.hitInvulnerabilityTimer -= dt;
    }

    // 7. Actualizar partículas de nieve del trineo
    for (let i = this.sledSparks.length - 1; i >= 0; i--) {
      const p = this.sledSparks[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life >= p.maxLife) {
        this.sledSparks.splice(i, 1);
      }
    }

    // Generar pequeñas partículas continuas de estela de nieve
    if (!this.isJumping && Math.random() < 0.5) {
      this.triggerSledSparks(1, this.isLogoPowerUpActive ? "#FFD700" : "#FFFFFF");
    }

    // 8. Avanzar Obstáculos y Colisiones
    this.updateObstacles(moveStep, dt);

    // 9. Avanzar Coleccionables y Power-Ups
    this.updateItems(moveStep, dt);

    // 10. Avanzar Paisaje 2.5D (Casas, faroles, pinos)
    this.updateScenery(moveStep);

    // 11. Generación procedural de oleadas
    this.nextWaveZ -= moveStep;
    if (this.nextWaveZ <= 1200) {
      this.spawnProceduralWave();
      this.nextWaveZ += Math.max(480, 720 - (elapsed * 4));
    }
  }

  /**
   * Generador de patrones 100% justos (Nunca bloquea los 3 carriles)
   */
  private spawnProceduralWave(): void {
    const elapsed = 45 - this.timeRemaining;
    const wavePatterns = [
      // Patrón 1: Valla baja central + regalos a los lados
      () => {
        this.spawnObstacle("fence", 0, 1900);
        this.spawnCollectibleLine(-1, 1900, 3, "gift_green");
        this.spawnCollectibleLine(1, 1900, 3, "gift_red");
      },
      // Patrón 2: Carreta a la izquierda + Valla a la derecha -> Centro libre con dulces
      () => {
        this.spawnObstacle("cart", -1, 1900);
        this.spawnObstacle("fence", 1, 1900);
        this.spawnCollectibleLine(0, 1900, 4, "candy");
      },
      // Patrón 3: Arco de hielo alto (obliga a deslizarse o esquivar)
      () => {
        this.spawnObstacle("ice_arch", 0, 1900);
        this.spawnCollectibleLine(0, 1850, 4, "gift_red"); // Dulces justo debajo del arco
        if (Math.random() < 0.4) {
          this.spawnObstacle("cart", 1, 1900);
        }
      },
      // Patrón 4: Doble valla lateral -> Camino central
      () => {
        this.spawnObstacle("fence", -1, 1900);
        this.spawnObstacle("fence", 1, 1900);
        this.spawnCollectibleLine(0, 1900, 3, "gift_green");
      },
      // Patrón 5: Carreta central + Valla lateral
      () => {
        this.spawnObstacle("cart", 0, 1900);
        this.spawnObstacle("fence", -1, 1900);
        this.spawnCollectibleLine(1, 1900, 3, "gift_red");
      },
      // Patrón 6: Power-Up Medallón de la Feria (Aparece cada ~12-15s)
      () => {
        const lane = (Math.floor(Math.random() * 3) - 1) as Lane;
        this.spawnItem("medallion", lane, 1900);
        this.spawnCollectibleLine(lane === 0 ? 1 : 0, 1900, 3, "candy");
      }
    ];

    // Selección de patrón según fase
    let chosenPattern = wavePatterns[Math.floor(Math.random() * wavePatterns.length)];
    if (elapsed > 35 && Math.random() < 0.4) {
      // Clímax: Más medallones y dulces
      this.spawnItem("medallion", 0, 1900);
      this.spawnCollectibleLine(-1, 1900, 4, "candy");
      this.spawnCollectibleLine(1, 1900, 4, "candy");
    } else {
      chosenPattern();
    }
  }

  private spawnObstacle(type: ObstacleType, lane: Lane, z: number): void {
    this.obstacles.push({
      id: ++this.entityIdCounter,
      type,
      lane,
      z,
      cleared: false,
      hit: false
    });
  }

  private spawnItem(type: ItemType, lane: Lane, z: number): void {
    this.items.push({
      id: ++this.entityIdCounter,
      type,
      lane,
      z,
      collected: false,
      rotAngle: 0
    });
  }

  private spawnCollectibleLine(lane: Lane, startZ: number, count: number, type: ItemType): void {
    for (let i = 0; i < count; i++) {
      this.spawnItem(type, lane, startZ + i * 110);
    }
  }

  private spawnSceneryPair(z: number): void {
    const types: ("house" | "tree" | "lantern" | "market_stall")[] = ["house", "tree", "lantern"];
    const leftType = types[Math.floor(Math.random() * types.length)];
    const rightType = types[Math.floor(Math.random() * types.length)];

    this.sceneryProps.push({
      id: ++this.entityIdCounter,
      side: -1,
      z,
      type: leftType
    });
    this.sceneryProps.push({
      id: ++this.entityIdCounter,
      side: 1,
      z,
      type: rightType
    });
  }

  private updateScenery(moveStep: number): void {
    for (let i = this.sceneryProps.length - 1; i >= 0; i--) {
      const prop = this.sceneryProps[i];
      prop.z -= moveStep;
      if (prop.z < -100) {
        this.sceneryProps.splice(i, 1);
      }
    }

    this.nextSceneryZ -= moveStep;
    if (this.nextSceneryZ <= 1500) {
      this.spawnSceneryPair(1900);
      this.nextSceneryZ += 240;
    }
  }

  private updateObstacles(moveStep: number, _dt: number): void {
    const playerZRangeMin = 30;
    const playerZRangeMax = 110;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= moveStep;

      // Detección de colisión con el jugador
      if (!obs.hit && !obs.cleared && obs.z >= playerZRangeMin && obs.z <= playerZRangeMax) {
        const isSameLane = Math.abs(this.currentLaneX - obs.lane) < 0.55;

        if (isSameLane) {
          let hasDodged = false;

          if (obs.type === "fence") {
            // Valla baja: Debe saltar (playerYOffset > 45px)
            if (this.playerYOffset > 45) {
              hasDodged = true;
            }
          } else if (obs.type === "ice_arch") {
            // Arco de hielo: Debe deslizarse agachado
            if (this.isSliding) {
              hasDodged = true;
            }
          } else if (obs.type === "cart") {
            // Carreta de juguetes: Bloqueo total del carril
            hasDodged = false;
          }

          if (hasDodged) {
            obs.cleared = true;
            this.addScore(50);
            this.audio.playCatchItem(1.3);
          } else {
            // ¡GOLPE! (Sin muerte instantánea: penalización justa y feedback arcade)
            if (this.hitInvulnerabilityTimer <= 0 && !this.isLogoPowerUpActive) {
              obs.hit = true;
              this.handleObstacleHit(obs.type);
            }
          }
        }
      }

      // Eliminar cuando sale de la pantalla trasera
      if (obs.z < -120) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private handleObstacleHit(_type: ObstacleType): void {
    this.hitInvulnerabilityTimer = 1.25; // 1.25s de invulnerabilidad
    this.triggerShake(0.3, 9);
    this.audio.playRunnerHit();
    this.combo = 0; // Reiniciar combo

    // Pequeña deducción de puntos (sin bajar de 0)
    const penalty = Math.min(this.score, 100);
    this.score = Math.max(0, this.score - penalty);
    this.addFloatingText(`-100 💥`, this.width * 0.5, this.height * 0.65, "#FF2A4D", 1.3);

    this.triggerSledSparks(30, "#FF5252");
  }

  private updateItems(moveStep: number, dt: number): void {
    const playerZRangeMin = 20;
    const playerZRangeMax = 120;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.z -= moveStep;
      item.rotAngle += dt * 3.5;

      // Efecto Imán del Power-Up del Logo de la Feria
      if (this.isLogoPowerUpActive && !item.collected && item.z < 650 && item.z > 0) {
        const laneDiff = this.playerLane - item.lane;
        item.lane = (item.lane + Math.sign(laneDiff) * dt * 3.5) as Lane;
      }

      // Detección de recolección
      if (!item.collected && item.z >= playerZRangeMin && item.z <= playerZRangeMax) {
        const isClose = Math.abs(this.currentLaneX - item.lane) < 0.65;
        if (isClose) {
          item.collected = true;
          this.collectItem(item);
        }
      }

      if (item.z < -100 || item.collected) {
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
      this.addFloatingText(`+${pts}`, this.getLaneScreenX(item.lane, 50), this.getScreenY(50, 0) - 40, "#00E676");
      this.triggerSledSparks(10, "#69F0AE");
    } else if (item.type === "candy") {
      const pts = 150 * multiplier;
      this.addScore(pts);
      this.combo += 2;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.audio.playCatchItem(1.3);
      this.addFloatingText(`+${pts} 🍭`, this.getLaneScreenX(item.lane, 50), this.getScreenY(50, 0) - 40, "#FFD700");
      this.triggerSledSparks(12, "#FF4081");
    } else if (item.type === "medallion") {
      // ¡PODER DE LA FERIA! x2
      this.triggerLogoPowerUp(1, 6.0);
      this.addScore(500);
      this.audio.playPowerUp();
      this.triggerShake(0.35, 6);
      this.addFloatingText(`✨ ¡PODER DE LA FERIA! x2 ✨`, this.width * 0.5, this.height * 0.45, "#FFD700", 1.5);
      this.triggerSledSparks(40, "#FFD700");
    }
  }

  private triggerSledSparks(count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      this.sledSparks.push({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() * -120) - 40,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.35,
        color
      });
    }
  }

  // ==========================================================================
  // PROYECCIÓN MATEMÁTICA 2.5D
  // ==========================================================================

  private getProjectionScale(z: number): number {
    const cameraDepth = 280;
    return cameraDepth / (cameraDepth + Math.max(0, z));
  }

  private getHorizonY(): number {
    return this.height * 0.34;
  }

  private getGroundY(): number {
    return this.height * 0.92;
  }

  private getLaneScreenX(lane: number, z: number): number {
    const scale = this.getProjectionScale(z);
    const centerX = this.width * 0.5;
    const laneSpacing = (this.width * 0.29) * scale;
    return centerX + lane * laneSpacing;
  }

  private getScreenY(z: number, elevation: number = 0): number {
    const scale = this.getProjectionScale(z);
    const horY = this.getHorizonY();
    const grY = this.getGroundY();
    return horY + (grY - horY) * scale - elevation * scale;
  }

  // ==========================================================================
  // RENDERIZADO 2.5D DEL VIDEOJUEGO
  // ==========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo atmosférico lejano (Cielo, montañas, aurora y luna)
    this.drawSkyAndHorizon(ctx);

    // 2. Pista 2.5D (Adoquines, nieve acumulada y carriles de proyección)
    this.drawCobblestoneTrack(ctx);

    // 3. Elementos escénicos laterales ordenados por profundidad Z
    this.drawScenery(ctx);

    // 4. Objetos interactivos y coleccionables ordenados por Z (de lejos a cerca)
    this.drawEntities(ctx);

    // 5. Elfo en Trineo Mágico (Jugador)
    this.drawPlayer(ctx);

    // 6. Primer plano (Partículas de nieve cayendo y estelas de velocidad)
    this.drawForegroundAtmosphere(ctx);

    // 7. Feedback de Combo e Indicador Tutorial
    this.drawGameplayOverlay(ctx);
  }

  private drawSkyAndHorizon(ctx: CanvasRenderingContext2D): void {
    const horY = this.getHorizonY();

    if (this.imgHorizonBg && this.imgHorizonBg.complete && this.imgHorizonBg.naturalWidth > 0) {
      ctx.drawImage(this.imgHorizonBg, 0, 0, this.width, horY + 20);
    } else {
      // Degradado crepuscular de respaldo
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horY);
      skyGrad.addColorStop(0, "#081224");
      skyGrad.addColorStop(0.65, "#152E52");
      skyGrad.addColorStop(1, "#36688D");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, horY);
    }

    // Resplandor cálido de la Villa en el horizonte
    const glowGrad = ctx.createRadialGradient(
      this.width * 0.5, horY, 10,
      this.width * 0.5, horY, this.width * 0.6
    );
    glowGrad.addColorStop(0, "rgba(255, 215, 0, 0.35)");
    glowGrad.addColorStop(0.5, "rgba(255, 140, 0, 0.15)");
    glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, horY - 80, this.width, 100);
  }

  private drawCobblestoneTrack(ctx: CanvasRenderingContext2D): void {
    const horY = this.getHorizonY();
    const grY = this.getGroundY();
    const cx = this.width * 0.5;

    // 1. Base nevada del suelo
    const snowGrad = ctx.createLinearGradient(0, horY, 0, this.height);
    snowGrad.addColorStop(0, "#8FB0C6");
    snowGrad.addColorStop(0.3, "#C3DBEC");
    snowGrad.addColorStop(1, "#EBF5FB");
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, horY, this.width, this.height - horY);

    // 2. Carretera central 2.5D (Perspectiva trapezoidal)
    const topWidth = this.width * 0.16;
    const botWidth = this.width * 0.94;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - topWidth * 0.5, horY);
    ctx.lineTo(cx + topWidth * 0.5, horY);
    ctx.lineTo(cx + botWidth * 0.5, grY + 60);
    ctx.lineTo(cx - botWidth * 0.5, grY + 60);
    ctx.closePath();

    // Textura empedrada con bordes nevados
    const roadGrad = ctx.createLinearGradient(0, horY, 0, grY);
    roadGrad.addColorStop(0, "#2B3A4A");
    roadGrad.addColorStop(0.5, "#3D4F63");
    roadGrad.addColorStop(1, "#4E647D");
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // Borde iluminado de la pista
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Líneas de carriles 2.5D con animación continua de velocidad
    const laneDivOffsetTop = topWidth / 3;
    const laneDivOffsetBot = botWidth / 3;
    const dashOffset = (this.distanceTraveled * 0.8) % 60;

    ctx.setLineDash([25, 20]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 3;

    // Línea divisoria izquierda
    ctx.beginPath();
    ctx.moveTo(cx - laneDivOffsetTop * 0.5, horY);
    ctx.lineTo(cx - laneDivOffsetBot * 0.5, grY + 60);
    ctx.stroke();

    // Línea divisoria derecha
    ctx.beginPath();
    ctx.moveTo(cx + laneDivOffsetTop * 0.5, horY);
    ctx.lineTo(cx + laneDivOffsetBot * 0.5, grY + 60);
    ctx.stroke();

    ctx.restore();
  }

  private drawScenery(ctx: CanvasRenderingContext2D): void {
    // Ordenar de mayor a menor Z para dibujar primero el fondo
    const sortedScenery = [...this.sceneryProps].sort((a, b) => b.z - a.z);

    for (const prop of sortedScenery) {
      const scale = this.getProjectionScale(prop.z);
      if (scale <= 0.05) continue;

      const laneOffset = prop.side === -1 ? -1.85 : 1.85;
      const x = this.getLaneScreenX(laneOffset, prop.z);
      const y = this.getScreenY(prop.z, 0);

      const size = Math.max(20, 260 * scale);

      ctx.save();
      ctx.globalAlpha = Math.min(1, scale * 2.2);

      if (prop.type === "house" && this.imgHouse && this.imgHouse.complete) {
        ctx.drawImage(this.imgHouse, x - size * 0.5, y - size * 0.9, size, size);
      } else if (prop.type === "tree" && this.imgTree && this.imgTree.complete) {
        ctx.drawImage(this.imgTree, x - size * 0.4, y - size * 0.95, size * 0.8, size);
      } else {
        // Farol navideño brillante de fantasía
        const lanternH = size * 0.85;
        const lanternW = lanternH * 0.35;
        // Poste de madera
        ctx.fillStyle = "#3E2723";
        ctx.fillRect(x - lanternW * 0.15, y - lanternH, lanternW * 0.3, lanternH);
        // Luz dorada brillante
        const lanternGlow = ctx.createRadialGradient(x, y - lanternH * 0.85, 2, x, y - lanternH * 0.85, lanternW * 1.5);
        lanternGlow.addColorStop(0, "#FFF9C4");
        lanternGlow.addColorStop(0.5, "rgba(255, 193, 7, 0.6)");
        lanternGlow.addColorStop(1, "rgba(255, 193, 7, 0)");
        ctx.fillStyle = lanternGlow;
        ctx.beginPath();
        ctx.arc(x, y - lanternH * 0.85, lanternW * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawEntities(ctx: CanvasRenderingContext2D): void {
    // Combinar obstáculos y coleccionables en una lista unificada para ordenar por profundidad Z
    const allEntities: { type: "obstacle" | "item"; data: RunnerObstacle | RunnerItem; z: number }[] = [
      ...this.obstacles.map(o => ({ type: "obstacle" as const, data: o, z: o.z })),
      ...this.items.map(i => ({ type: "item" as const, data: i, z: i.z }))
    ];

    allEntities.sort((a, b) => b.z - a.z);

    for (const ent of allEntities) {
      if (ent.type === "obstacle") {
        this.drawObstacle(ctx, ent.data as RunnerObstacle);
      } else {
        this.drawItem(ctx, ent.data as RunnerItem);
      }
    }
  }

  private drawObstacle(ctx: CanvasRenderingContext2D, obs: RunnerObstacle): void {
    const scale = this.getProjectionScale(obs.z);
    if (scale <= 0.05) return;

    const x = this.getLaneScreenX(obs.lane, obs.z);
    const y = this.getScreenY(obs.z, 0);

    ctx.save();
    ctx.globalAlpha = Math.min(1, scale * 2.5);

    if (obs.type === "fence") {
      // 🪵 Valla baja para saltar
      const w = Math.max(25, 240 * scale);
      const h = w * 0.72;
      if (this.imgFence && this.imgFence.complete && this.imgFence.naturalWidth > 0) {
        ctx.drawImage(this.imgFence, x - w * 0.5, y - h * 0.95, w, h);
      } else {
        ctx.fillStyle = "#8D6E63";
        ctx.fillRect(x - w * 0.5, y - h, w, h);
      }
    } else if (obs.type === "ice_arch") {
      // 🧊 Arco de hielo alto para deslizarse debajo
      const w = Math.max(35, 340 * scale);
      const h = w * 1.05;
      if (this.imgIceArch && this.imgIceArch.complete && this.imgIceArch.naturalWidth > 0) {
        ctx.drawImage(this.imgIceArch, x - w * 0.5, y - h * 0.96, w, h);
      } else {
        ctx.fillStyle = "rgba(0, 229, 255, 0.75)";
        ctx.fillRect(x - w * 0.5, y - h, w, h);
      }
    } else if (obs.type === "cart") {
      // 🛒 Carreta de juguetes
      const w = Math.max(30, 260 * scale);
      const h = w * 0.9;
      if (this.imgCart && this.imgCart.complete && this.imgCart.naturalWidth > 0) {
        ctx.drawImage(this.imgCart, x - w * 0.5, y - h * 0.95, w, h);
      } else {
        ctx.fillStyle = "#5D4037";
        ctx.fillRect(x - w * 0.5, y - h, w, h);
      }
    }

    ctx.restore();
  }

  private drawItem(ctx: CanvasRenderingContext2D, item: RunnerItem): void {
    const scale = this.getProjectionScale(item.z);
    if (scale <= 0.05) return;

    const x = this.getLaneScreenX(item.lane, item.z);
    // Leve levitación flotante
    const hoverOffset = Math.sin(item.rotAngle * 2) * 10 * scale;
    const y = this.getScreenY(item.z, 25) - hoverOffset;

    ctx.save();
    ctx.globalAlpha = Math.min(1, scale * 2.5);

    if (item.type === "medallion") {
      // 🎪 MEDALLÓN DE LA FERIA (Power-Up Dorado con aura y brillo)
      const size = Math.max(28, 200 * scale);

      // Aura mágica dorada
      const halo = ctx.createRadialGradient(x, y, size * 0.1, x, y, size * 0.65);
      halo.addColorStop(0, "rgba(255, 215, 0, 0.8)");
      halo.addColorStop(0.5, "rgba(255, 140, 0, 0.4)");
      halo.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.65, 0, Math.PI * 2);
      ctx.fill();

      if (this.imgMedallion && this.imgMedallion.complete && this.imgMedallion.naturalWidth > 0) {
        ctx.drawImage(this.imgMedallion, x - size * 0.5, y - size * 0.5, size, size);
      }
    } else {
      // Regalos o Dulces normales
      const size = Math.max(20, 140 * scale);
      let img = this.imgGiftGreen;
      if (item.type === "gift_red") img = this.imgGiftRed;
      else if (item.type === "candy") img = this.imgCandy;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x - size * 0.5, y - size * 0.5, size, size);
      }
    }

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const playerZ = 45;
    const scale = this.getProjectionScale(playerZ);
    const x = this.getLaneScreenX(this.currentLaneX, playerZ);
    const groundY = this.getScreenY(playerZ, 0);
    const y = groundY - this.playerYOffset;

    ctx.save();

    // 1. Sombra elíptica en el suelo (siempre se queda en el suelo durante el salto)
    const shadowScale = Math.max(0.35, 1 - (this.playerYOffset / 260));
    const shadowW = 160 * scale * shadowScale;
    const shadowH = 40 * scale * shadowScale;

    ctx.fillStyle = "rgba(0, 10, 25, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x, groundY - 4, shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Parpadeo si fue golpeado recientemente
    if (this.hitInvulnerabilityTimer > 0) {
      const flash = Math.sin(this.hitInvulnerabilityTimer * 28);
      if (flash > 0) {
        ctx.globalAlpha = 0.45;
      }
    }

    // 3. Aura del Power-Up del Logo de la Feria
    if (this.isLogoPowerUpActive) {
      const auraSize = 220 * scale;
      const auraGrad = ctx.createRadialGradient(x, y - 60, 20, x, y - 60, auraSize);
      auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.75)");
      auraGrad.addColorStop(0.5, "rgba(255, 110, 0, 0.35)");
      auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(x, y - 60, auraSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Dibujar chispas de nieve del trineo
    for (const spark of this.sledSparks) {
      const alpha = Math.max(0, 1 - spark.life / spark.maxLife);
      ctx.fillStyle = spark.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x + spark.x * scale, groundY + spark.y * scale, 3.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 5. Transformaciones del Trineo: Inclinación lateral y escala de agachado
    ctx.translate(x, y);
    ctx.rotate((this.sledTilt * Math.PI) / 180);

    let scaleX = 1.0;
    let scaleY = 1.0;

    if (this.isSliding) {
      scaleY = 0.58; // Aplastado hacia abajo para pasar bajo el arco
      scaleX = 1.25; // Ensanchado
    } else if (this.isJumping) {
      scaleY = 1.1; // Estirado verticalmente en el salto
      scaleX = 0.95;
    }

    ctx.scale(scaleX, scaleY);

    const charW = 230 * scale;
    const charH = 230 * scale;

    if (this.imgSledElf && this.imgSledElf.complete && this.imgSledElf.naturalWidth > 0) {
      ctx.drawImage(this.imgSledElf, -charW * 0.5, -charH * 0.92, charW, charH);
    } else {
      // Fallback
      ctx.fillStyle = "#D32F2F";
      ctx.fillRect(-charW * 0.3, -charH * 0.7, charW * 0.6, charH * 0.7);
    }

    ctx.restore();
  }

  private drawForegroundAtmosphere(ctx: CanvasRenderingContext2D): void {
    // Estelas de velocidad en los bordes si la velocidad es alta o está activo el Power-Up
    if (this.gameSpeed > 750 || this.isLogoPowerUpActive) {
      ctx.save();
      ctx.strokeStyle = this.isLogoPowerUpActive ? "rgba(255, 215, 0, 0.35)" : "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      const count = this.isLogoPowerUpActive ? 8 : 4;
      for (let i = 0; i < count; i++) {
        const lineX = (i % 2 === 0) ? Math.random() * this.width * 0.15 : this.width * 0.85 + Math.random() * this.width * 0.15;
        const lineY = Math.random() * this.height;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX + (Math.random() - 0.5) * 20, lineY + 60);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawGameplayOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Mensaje de Tutorial Inicial
    if (this.showTutorialHint) {
      ctx.fillStyle = "rgba(7, 18, 34, 0.85)";
      const boxW = Math.min(this.width * 0.88, 480);
      const boxH = 68;
      const boxX = (this.width - boxW) * 0.5;
      const boxY = this.height * 0.78;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 17px 'Outfit', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👆 ¡DESLIZA: ◄ ► MOVER | ▲ SALTAR | ▼ AGACHAR!", this.width * 0.5, boxY + boxH * 0.5);
    }

    // 2. Indicador de Combo activo
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
