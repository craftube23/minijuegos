/**
 * ==============================================================================
 * ¡EL CAOS DEL TALLER MÁGICO! (WorkshopChaosGame)
 * ==============================================================================
 * 
 * Género: Arcade de reflejos, combos y puntuación a 60 FPS.
 * 
 * Premisa:
 * La máquina de fabricación de juguetes del taller de Santa ha sufrido una
 * sobrecarga mágica. ¡Una tromba de juguetes, peluches, robots y regalos sale
 * disparada por los aires! El jugador debe rescatar los juguetes correctos
 * tocándolos antes de que caigan, evitando el carbón encantado y los paquetes defectuosos.
 * 
 * Características:
 * - 5 categorías de juguetes positivos con puntuaciones y comportamientos diferenciados.
 * - 2 tipos de peligros (Carbón ardiente y Regalos defectuosos) que rompen el combo.
 * - Sistema de combos con multiplicadores progresivos (x1, x1.5, x2, x3).
 * - Modo «FIEBRE DE JUGUETES»: barra de energía mágica que desata una lluvia dorada.
 * - Controles táctiles ultra responsivos (0 latencia, detección precisa sin duplicados).
 * - Gráficos en estética Stylized 2D / Fantasy Game Concept Art.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

export type ToyType =
  | "gift_red"
  | "gift_green"
  | "gift_blue"
  | "bear"
  | "robot"
  | "car"
  | "gold_gift"
  | "hazard_coal"
  | "hazard_defective";

export interface SponsorInfo {
  name: string;
  logo: HTMLImageElement;
}

export interface WorkshopObject {
  id: number;
  type: ToyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  rotSpeed: number;
  radius: number;
  scale: number;
  scoreValue: number;
  isHazard: boolean;
  collected: boolean;
  collectTimer: number;
  alpha: number;
  sparkleTimer: number;
  // Propiedades de Regalo Patrocinado con Logo
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
}

export class WorkshopChaosGame extends BaseGame {
  // Sprites e Ilustraciones 2D
  private bgImage: HTMLImageElement;
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteGiftBlue: HTMLImageElement;
  private spriteGiftGold: HTMLImageElement;
  private spriteBear: HTMLImageElement;
  private spriteRobot: HTMLImageElement;
  private spriteCar: HTMLImageElement;
  private spriteCoal: HTMLImageElement;
  private spriteDefective: HTMLImageElement;

  // Logotipos de Patrocinadores Oficiales para Fondo y Regalos
  private fairLogo: HTMLImageElement;
  private sponsorList: SponsorInfo[] = [];

  // Objetos en vuelo
  private objects: WorkshopObject[] = [];
  private nextObjectId: number = 1;

  // Temporizadores y Spawner
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.85; // Se reduce con la dificultad progresiva
  private gameTimeElapsed: number = 0;

  // Sistema de Combo
  private combo: number = 0;
  private maxCombo: number = 0;
  private comboTimeoutTimer: number = 0;
  private readonly comboMaxGraceTime: number = 3.6; // Segundos antes de que el combo expire

  // Sistema de Fiebre de Juguetes
  private feverEnergy: number = 0; // 0 a 100
  private isFeverActive: boolean = false;
  private feverTimer: number = 0;
  private readonly feverDuration: number = 6.0;

  // Estadísticas para Game Over
  private totalToysCollected: number = 0;
  private goldGiftsCollected: number = 0;
  private hazardsHitCount: number = 0;

  // Chutes de la máquina (Posiciones X relativas de lanzamiento)
  private machineChutes: number[] = [0.22, 0.5, 0.78];
  private nextChuteIndex: number = 1;

  // Animación de vapor y engranajes de la máquina
  private machineAnimTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "workshop-chaos",
      "¡El Caos del Taller Mágico!",
      "¡Toca los juguetes que salen volando de la máquina y evita el carbón!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Dance of the Sugar Plum Fairy.mp3";
    this.inGameMusicVolume = 0.45;

    // Carga de Sprites Oficiales
    this.bgImage = this.loadImage("./assets/images/fondo-habitacion.webp");
    this.spriteGiftRed = this.loadImage("./assets/images/regalo-estilizado-rojo.png");
    this.spriteGiftGreen = this.loadImage("./assets/images/regalo-estilizado-verde.png");
    this.spriteGiftBlue = this.loadImage("./assets/images/regalo-estilizado-azul.png");
    this.spriteGiftGold = this.loadImage("./assets/images/regalo-estilizado-dorado.png");
    this.spriteBear = this.loadImage("./assets/images/osito.png");
    this.spriteRobot = this.loadImage("./assets/images/robot.png");
    this.spriteCar = this.loadImage("./assets/images/coche-juguete.png");
    this.spriteCoal = this.loadImage("./assets/images/carbon.png");
    this.spriteDefective = this.loadImage("./assets/images/regalo-defectuoso.png");

    // Carga de Logotipos Oficiales de la Feria y Patrocinadores
    this.fairLogo = this.loadImage("./assets/logos/clean-feria-magica.png");
    this.sponsorList = [
      { name: "Campuslands", logo: this.loadImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.loadImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.loadImage("./assets/logos/clean-imebu.png") },
      { name: "Mariposa", logo: this.loadImage("./assets/logos/clean-mariposa.png") },
      { name: "Angelus", logo: this.loadImage("./assets/logos/clean-angelus.png") },
      { name: "Factor Humano", logo: this.loadImage("./assets/logos/clean-factor-humano.png") },
      { name: "Fundalas", logo: this.loadImage("./assets/logos/clean-fundalas.png") },
      { name: "Practi Arepa", logo: this.loadImage("./assets/logos/clean-practi-arepa.png") },
      { name: "Feria Mágica", logo: this.fairLogo }
    ];
  }

  private loadImage(src: string): HTMLImageElement {
    return this.getImage(src);
  }

  /**
   * Ciclo de Inicio: Preparar partida y registrar entrada táctil
   */
  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimeoutTimer = 0;
    this.feverEnergy = 0;
    this.isFeverActive = false;
    this.feverTimer = 0;
    this.gameTimeElapsed = 0;
    this.totalToysCollected = 0;
    this.goldGiftsCollected = 0;
    this.hazardsHitCount = 0;
    this.objects = [];
    this.nextObjectId = 1;
    // El primer juguete sale casi de inmediato para que la partida nunca parezca vacía.
    this.spawnTimer = 0.08;
    this.spawnInterval = 0.85;

    // Conectar entrada táctil directa
    this.input.onTap = (x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;
      this.processTapAt(x, y);
    };

    this.addFloatingText("¡ATRAPA LOS JUGUETES!", this.width * 0.5, this.height * 0.4, "#FFD700", 1.5);
  }

  /**
   * Limpieza de eventos al desmontar el minijuego
   */
  public override destroy(): void {
    super.destroy();
    this.input.onTap = undefined;
    this.objects = [];
  }

  /**
   * Bucle de actualización por fotograma
   */
  protected onUpdate(dt: number): void {
    this.gameTimeElapsed += dt;
    this.machineAnimTime += dt;

    // 1. Dificultad progresiva (Ajuste dinámico según el tiempo transcurrido)
    this.updateDifficultyProgression();

    // 2. Gestión de Fiebre de Juguetes
    this.updateFeverState(dt);

    // 3. Temporizador de gracia del Combo
    if (this.combo > 0) {
      this.comboTimeoutTimer += dt;
      if (this.comboTimeoutTimer >= this.comboMaxGraceTime) {
        this.resetCombo(false);
      }
    }

    // 4. Lanzamiento de nuevos juguetes (Spawner)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.launchBatch();
      this.spawnTimer = this.isFeverActive ? this.spawnInterval * 0.48 : this.spawnInterval;
    }

    // 5. Actualización física de objetos en vuelo
    this.updateObjects(dt);
  }

  /**
   * Ajuste de dificultad por fases para la duración actual de 45-60 segundos
   */
  private updateDifficultyProgression(): void {
    if (this.gameTimeElapsed < 8) {
      // Fase 1: Calentamiento amigable pero dinámico
      this.spawnInterval = 0.75;
    } else if (this.gameTimeElapsed < 18) {
      // Fase 2: El taller cobra ritmo
      this.spawnInterval = 0.58;
    } else if (this.gameTimeElapsed < 30) {
      // Fase 3: Sobrecarga mágica
      this.spawnInterval = 0.44;
    } else {
      // Fase 4: Clímax de fuegos artificiales
      this.spawnInterval = 0.34;
    }
  }

  /**
   * Control del estado Fiebre de Juguetes
   */
  private updateFeverState(dt: number): void {
    if (this.isFeverActive) {
      this.feverTimer -= dt;
      this.feverEnergy = Math.max(0, (this.feverTimer / this.feverDuration) * 100);

      // Partículas continuas de celebración en fiebre
      if (Math.random() < 0.28) {
        this.particles.emitBurst(Math.random() * this.width, Math.random() * (this.height * 0.7), "#FFD700", 3);
      }

      if (this.feverTimer <= 0) {
        this.isFeverActive = false;
        this.feverEnergy = 0;
        this.addFloatingText("¡FIN DE FIEBRE!", this.width * 0.5, this.height * 0.38, "#E0E7FF", 1.2);
      }
    }
  }

  /**
   * Lanza un lote de juguetes desde los chutes de la máquina
   */
  private launchBatch(): void {
    let count = 1;
    if (this.isFeverActive) {
      count = 2 + (Math.random() < 0.5 ? 1 : 0);
    } else if (this.gameTimeElapsed > 22) {
      count = Math.random() < 0.65 ? 2 : (Math.random() < 0.22 ? 3 : 1);
    } else if (this.gameTimeElapsed > 7) {
      count = Math.random() < 0.45 ? 2 : 1;
    }

    for (let i = 0; i < count; i++) {
      // Si lanzamos en lote y no es fiebre, forzar que uno sea enemigo con alta probabilidad
      const forceHazard = i > 0 && !this.isFeverActive && Math.random() < 0.65;
      this.spawnSingleObject(forceHazard);
    }
  }

  /**
   * Genera un objeto individual con física, categoría balanceada y logos en regalos
   */
  private spawnSingleObject(forceHazard: boolean = false): void {
    const chuteRelX = this.machineChutes[this.nextChuteIndex];
    this.nextChuteIndex = (this.nextChuteIndex + 1 + Math.floor(Math.random() * 2)) % this.machineChutes.length;

    const startX = this.width * chuteRelX + (Math.random() * 40 - 20);
    const radius = Math.min(58, Math.max(40, Math.min(this.width, this.height) * 0.075));
    const machineHeight = this.getMachineHeight();
    // El objeto nace justo por encima de la máquina para que no quede tapado por ella.
    const startY = this.height - machineHeight - radius * 0.45;

    const type = this.chooseRandomToyType(forceHazard);
    const config = this.getToyConfig(type);

    // ¿Es un regalo con logotipo oficial de patrocinador?
    let isSponsored = false;
    let sponsorName: string | undefined;
    let sponsorLogo: HTMLImageElement | undefined;
    let scoreValue = config.score;

    const isGiftType = type === "gift_red" || type === "gift_green" || type === "gift_blue" || type === "gold_gift";
    if (isGiftType && !config.isHazard && this.sponsorList.length > 0 && Math.random() < 0.52) {
      isSponsored = true;
      const sp = this.sponsorList[Math.floor(Math.random() * this.sponsorList.length)];
      sponsorName = sp.name;
      sponsorLogo = sp.logo;
      scoreValue += 15; // Bonificación de puntos por regalo de patrocinador
    }

    // Velocidades parabólicas dinámicas
    const speedY = -Math.max(this.height * (1.05 + Math.random() * 0.18), this.width * 0.48);
    const spreadX = chuteRelX < 0.4 ? 1 : chuteRelX > 0.6 ? -1 : (Math.random() - 0.5) * 2;
    const speedX = spreadX * (60 + Math.random() * 140);

    this.objects.push({
      id: this.nextObjectId++,
      type,
      x: startX,
      y: startY,
      vx: speedX,
      vy: speedY,
      gravity: Math.max(this.height * 1.05, this.width * 0.48),
      rotation: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 2.8,
      radius,
      scale: config.baseScale,
      scoreValue,
      isHazard: config.isHazard,
      collected: false,
      collectTimer: 0,
      alpha: 1,
      sparkleTimer: 0,
      isSponsored,
      sponsorName,
      sponsorLogo
    });

    // Humito o vapor en el chute al disparar
    const puffColor = config.isHazard ? "#FF5722" : (isSponsored ? "#FFD700" : "#FFF9C4");
    this.particles.emitBurst(startX, startY - 20, puffColor, 4);
  }

  /**
   * Selección probabilística del tipo de juguete (con enemigos frecuentes)
   */
  private chooseRandomToyType(forceHazard: boolean = false): ToyType {
    if (this.isFeverActive) {
      // En fiebre: solo juguetes y alta probabilidad de regalos dorados (¡Cero peligros!)
      const rand = Math.random();
      if (rand < 0.42) return "gold_gift";
      if (rand < 0.64) return "car";
      if (rand < 0.82) return "robot";
      return "bear";
    }

    if (forceHazard) {
      return Math.random() < 0.52 ? "hazard_coal" : "hazard_defective";
    }

    const rand = Math.random();

    // Probabilidad de Peligros (Aparecen rápido desde los 3s y con alta frecuencia)
    let hazardChance = 0;
    if (this.gameTimeElapsed >= 24) {
      hazardChance = 0.46; // Clímax caótico: casi 1 de cada 2
    } else if (this.gameTimeElapsed >= 12) {
      hazardChance = 0.36; // Fase media intensa
    } else if (this.gameTimeElapsed >= 3.0) {
      hazardChance = 0.26; // Fase temprana: suficiente tensión desde el inicio
    }

    if (rand < hazardChance) {
      return Math.random() < 0.52 ? "hazard_coal" : "hazard_defective";
    }

    // Objetos Especiales y Normales
    const toyRand = Math.random();
    if (toyRand < 0.20) return "gold_gift";
    if (toyRand < 0.36) return "car";
    if (toyRand < 0.52) return "robot";
    if (toyRand < 0.68) return "bear";
    if (toyRand < 0.80) return "gift_green";
    if (toyRand < 0.90) return "gift_blue";
    return "gift_red";
  }

  /**
   * Metadatos y balance por objeto
   */
  private getToyConfig(type: ToyType): { score: number; isHazard: boolean; baseScale: number } {
    switch (type) {
      case "gift_red":
      case "gift_green":
      case "gift_blue":
        return { score: 10, isHazard: false, baseScale: 1.0 };
      case "bear":
        return { score: 15, isHazard: false, baseScale: 1.05 };
      case "robot":
        return { score: 20, isHazard: false, baseScale: 1.08 };
      case "car":
        return { score: 25, isHazard: false, baseScale: 1.05 };
      case "gold_gift":
        return { score: 50, isHazard: false, baseScale: 1.15 };
      case "hazard_coal":
        return { score: -30, isHazard: true, baseScale: 0.95 };
      case "hazard_defective":
        return { score: -25, isHazard: true, baseScale: 1.0 };
    }
  }

  /**
   * Procesa el toque de un jugador sobre las coordenadas
   */
  private processTapAt(x: number, y: number): void {
    let closestObj: WorkshopObject | null = null;
    let closestDistSq = Infinity;

    // Buscar el objeto no recogido más cercano dentro del radio de toque
    for (const obj of this.objects) {
      if (obj.collected) continue;

      const hitMargin = obj.radius * 1.35; // Área táctil generosa para pantalla táctil
      const dx = x - obj.x;
      const dy = y - obj.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= hitMargin * hitMargin && distSq < closestDistSq) {
        closestDistSq = distSq;
        closestObj = obj;
      }
    }

    if (closestObj) {
      this.collectObject(closestObj);
    }
  }

  /**
   * Rescata un juguete positivo o activa la penalización de un peligro
   */
  private collectObject(obj: WorkshopObject): void {
    if (obj.collected) return;
    obj.collected = true;
    obj.collectTimer = 0.18;

    if (obj.isHazard) {
      // ======================================================================
      // IMPACTO CON OBJETO PELIGROSO (Carbón o Regalo Defectuoso)
      // ======================================================================
      this.hazardsHitCount++;
      this.score = Math.max(0, this.score + obj.scoreValue);
      this.resetCombo(true);
      this.triggerShake(0.24, 11);
      this.audio.playElfHit();

      const label = obj.type === "hazard_coal" ? "¡CARBÓN! -30" : "¡BOOM DEFECTO! -25";
      this.addFloatingText(label, obj.x, obj.y - 20, "#FF1744", 1.25);

      // Partículas de humo oscuro y chispas de fuego
      this.particles.emitBurst(obj.x, obj.y, "#B71C1C", 12);
      this.particles.emitBurst(obj.x, obj.y, "#FF5722", 6);
    } else {
      // ======================================================================
      // ACIERTO CON JUGUETE POSITIVO
      // ======================================================================
      this.totalToysCollected++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.comboTimeoutTimer = 0;

      // Cálculo del multiplicador de combo
      const multiplier = this.getComboMultiplier();
      const feverBonus = this.isFeverActive ? 2 : 1;
      const finalPoints = Math.round(obj.scoreValue * multiplier * feverBonus);
      this.score += finalPoints;

      // Sonido dinámico con pitch ascendente por racha
      const pitch = Math.min(1.6, 0.95 + this.combo * 0.04);
      if (obj.isSponsored) {
        this.audio.playPowerUp();
        this.triggerShake(0.12, 3);
      } else if (obj.type === "gold_gift") {
        this.goldGiftsCollected++;
        this.audio.playPowerUp();
        this.triggerShake(0.15, 4);
      } else {
        this.audio.playCatchItem(pitch);
      }

      // Carga de la Barra de Fiebre
      const energyGain = obj.type === "gold_gift" ? 22 : (obj.isSponsored ? 14 : 6);
      if (!this.isFeverActive) {
        this.feverEnergy = Math.min(100, this.feverEnergy + energyGain);
        if (this.feverEnergy >= 100) {
          this.triggerFeverMode();
        }
      }

      // Feedback visual del flotante de puntos y mención de marca
      if (obj.isSponsored && obj.sponsorName) {
        this.addFloatingText(`★ ${obj.sponsorName.toUpperCase()} ★`, obj.x, obj.y - 36, "#FFD700", 1.2);
        this.addFloatingText(`+${finalPoints}`, obj.x, obj.y - 14, "#00E5FF", 1.15);
        this.particles.emitBurst(obj.x, obj.y, "#FFD700", 16);
      } else {
        const comboTag = multiplier > 1 ? ` (x${multiplier.toFixed(1)})` : "";
        const text = `+${finalPoints}${comboTag}`;
        const textColor = obj.type === "gold_gift" ? "#FFD700" : multiplier >= 2 ? "#00E5FF" : "#FFFFFF";
        this.addFloatingText(text, obj.x, obj.y - 15, textColor, 1.1);
        this.particles.emitBurst(obj.x, obj.y, obj.type === "gold_gift" ? "#FFD700" : "#00E676", obj.type === "gold_gift" ? 14 : 7);
      }

      // Carteles de Racha / Hitos de Combo
      if (this.combo === 5) {
        this.addFloatingText("¡COMBO x5!", this.width * 0.5, this.height * 0.32, "#00E5FF", 1.3);
      } else if (this.combo === 10) {
        this.addFloatingText("¡RACHA MÁGICA x10!", this.width * 0.5, this.height * 0.32, "#FFD700", 1.5);
        this.particles.emitConfetti(this.width, 25);
      } else if (this.combo === 20) {
        this.addFloatingText("¡PERFECTO x20!", this.width * 0.5, this.height * 0.32, "#FF1744", 1.7);
        this.particles.emitConfetti(this.width, 45);
      }
    }
  }

  /**
   * Dispara el modo especial Fiebre de Juguetes
   */
  private triggerFeverMode(): void {
    this.isFeverActive = true;
    this.feverTimer = this.feverDuration;
    this.feverEnergy = 100;

    this.audio.playPowerUp();
    this.triggerShake(0.25, 7);
    this.particles.emitConfetti(this.width, 45);

    this.addFloatingText("★ ¡FIEBRE DE JUGUETES! ★", this.width * 0.5, this.height * 0.3, "#FFD700", 1.8);
  }

  /**
   * Multiplicador según el número de aciertos consecutivos
   */
  private getComboMultiplier(): number {
    if (this.combo >= 20) return 3.0;
    if (this.combo >= 10) return 2.0;
    if (this.combo >= 5) return 1.5;
    return 1.0;
  }

  /**
   * Resetea el combo tras fallo o tiempo de inactividad
   */
  private resetCombo(wasHazardHit: boolean): void {
    if (this.combo >= 5 && !wasHazardHit) {
      this.addFloatingText("Fin de Racha", this.width * 0.5, this.height * 0.35, "#B0BEC5", 1.0);
    }
    this.combo = 0;
    this.comboTimeoutTimer = 0;
  }

  /**
   * Actualización física y limpieza de objetos
   */
  private updateObjects(dt: number): void {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];

      if (obj.collected) {
        // Animación de recogida: escala y desvanecimiento veloz
        obj.scale += dt * 2.8;
        obj.alpha -= dt * 5.5;
        obj.y -= dt * 45;

        if (obj.alpha <= 0) {
          this.objects.splice(i, 1);
          continue;
        }
      } else {
        // Física parabólica real
        obj.x += obj.vx * dt;
        obj.y += obj.vy * dt;
        obj.vy += obj.gravity * dt;
        obj.rotation += obj.rotSpeed * dt;

        // Estelas y destellos visuales dinámicos
        obj.sparkleTimer += dt;
        if (obj.type === "gold_gift" || obj.isSponsored) {
          if (obj.sparkleTimer >= 0.12) {
            obj.sparkleTimer = 0;
            this.particles.emitBurst(obj.x, obj.y, "#FFD700", 2);
          }
        } else if (obj.type === "hazard_coal") {
          if (obj.sparkleTimer >= 0.14) {
            obj.sparkleTimer = 0;
            this.particles.emitBurst(obj.x, obj.y, "#FF3D00", 2);
          }
        } else if (obj.type === "hazard_defective") {
          if (obj.sparkleTimer >= 0.14) {
            obj.sparkleTimer = 0;
            this.particles.emitBurst(obj.x, obj.y - obj.radius * 0.45, "#FFD600", 2);
          }
        }

        // Si cae por debajo del borde de la pantalla, eliminarlo
        if (obj.y > this.height + 60 && obj.vy > 0) {
          this.objects.splice(i, 1);
        }
      }
    }
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo del Taller Navideño con Banners de Patrocinadores
    this.drawBackground(ctx);

    // 2. Partículas y Destellos en Fiebre
    if (this.isFeverActive) {
      this.drawFeverAura(ctx);
    }

    // 3. Juguetes y Objetos en vuelo (incluye sellos de marcas)
    this.drawObjects(ctx);

    // 4. Máquina de fabricación de juguetes en la parte inferior
    this.drawToyMachine(ctx);

    // 5. Partículas ambientales
    this.particles.draw(ctx, true);

    // 6. Barra de Fiebre y Multiplicador
    this.drawInGameFeverAndComboHUD(ctx);
  }

  /**
   * Dibuja el fondo del taller de Santa con iluminación cálida y letreros festivos
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    if (this.bgImage && this.bgImage.complete) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#12203e");
      grad.addColorStop(1, "#070e1c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Viñeta cálida en los bordes
    const vignette = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.35,
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.8
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(4, 8, 18, 0.65)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    // Letreros festivos colgantes de patrocinadores en la pared superior
    this.drawBackgroundSponsorBanners(ctx);
  }

  /**
   * Dibuja letreros festivos colgantes de patrocinadores en la pared superior del taller
   */
  private drawBackgroundSponsorBanners(ctx: CanvasRenderingContext2D): void {
    if (this.sponsorList.length === 0) return;

    ctx.save();

    const bannerCount = this.width >= 600 ? 3 : 2;
    const bannerH = Math.min(64, Math.max(44, this.height * 0.082));
    const bannerW = Math.min(132, Math.max(90, bannerH * 1.75));
    const bannerY = Math.max(92, Math.min(145, this.height * 0.135));

    // Rotación dinámica de patrocinadores cada 5 segundos
    const cycleOffset = Math.floor(this.machineAnimTime / 5.2);

    for (let i = 0; i < bannerCount; i++) {
      const relX = bannerCount === 3
        ? (i === 0 ? 0.18 : i === 1 ? 0.5 : 0.82)
        : (i === 0 ? 0.25 : 0.75);
      const cx = this.width * relX;
      const cy = bannerY;

      const sponsorIdx = (cycleOffset + i) % this.sponsorList.length;
      const sponsor = this.sponsorList[sponsorIdx];

      // Suave balanceo pendular navideño
      const swayAngle = Math.sin(this.machineAnimTime * 1.8 + i * 1.4) * 0.024;

      ctx.save();
      ctx.translate(cx, cy - bannerH / 2);
      ctx.rotate(swayAngle);

      // 1. Cadenas doradas de sujeción al techo
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-bannerW * 0.38, -26);
      ctx.lineTo(-bannerW * 0.38, 0);
      ctx.moveTo(bannerW * 0.38, -26);
      ctx.lineTo(bannerW * 0.38, 0);
      ctx.stroke();

      // Argollas doradas
      ctx.fillStyle = "#FFA000";
      ctx.beginPath();
      ctx.arc(-bannerW * 0.38, 0, 3, 0, Math.PI * 2);
      ctx.arc(bannerW * 0.38, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Tablero de madera rústica
      const woodGrad = ctx.createLinearGradient(0, 0, 0, bannerH);
      woodGrad.addColorStop(0, "#4E2714");
      woodGrad.addColorStop(0.5, "#381A0B");
      woodGrad.addColorStop(1, "#240E04");
      ctx.fillStyle = woodGrad;
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      this.roundRect(ctx, -bannerW / 2, 0, bannerW, bannerH, 8);
      ctx.fill();
      ctx.stroke();

      // 3. Placa interior marfil/pergamino para el logo
      const platePad = 5;
      ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
      this.roundRect(ctx, -bannerW / 2 + platePad, platePad, bannerW - platePad * 2, bannerH - platePad * 2, 5);
      ctx.fill();

      // 4. Logo del Patrocinador
      if (sponsor && sponsor.logo && sponsor.logo.complete) {
        const maxLogoW = bannerW - platePad * 2 - 8;
        const maxLogoH = bannerH - platePad * 2 - 6;
        const nw = sponsor.logo.naturalWidth || 1;
        const nh = sponsor.logo.naturalHeight || 1;
        const aspect = nw / nh;
        let dw = maxLogoW;
        let dh = maxLogoW / aspect;
        if (dh > maxLogoH) {
          dh = maxLogoH;
          dw = maxLogoH * aspect;
        }
        ctx.drawImage(sponsor.logo, -dw / 2, (bannerH - dh) / 2, dw, dh);
      }

      // 5. Nieve decorativa en el borde superior
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(-bannerW / 2 - 2, 0);
      ctx.quadraticCurveTo(-bannerW * 0.25, -5, 0, -3);
      ctx.quadraticCurveTo(bannerW * 0.25, -6, bannerW / 2 + 2, 0);
      ctx.lineTo(bannerW / 2 + 2, 4);
      ctx.quadraticCurveTo(bannerW * 0.25, 6, 0, 3);
      ctx.quadraticCurveTo(-bannerW * 0.25, 5, -bannerW / 2 - 2, 4);
      ctx.closePath();
      ctx.fill();

      // Adornos en las esquinas
      ctx.fillStyle = "#2E7D32";
      ctx.beginPath();
      ctx.arc(-bannerW / 2 + 3, 2, 2.8, 0, Math.PI * 2);
      ctx.arc(bannerW / 2 - 3, 2, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#E53935";
      ctx.beginPath();
      ctx.arc(-bannerW / 2 + 3, 2, 1.6, 0, Math.PI * 2);
      ctx.arc(bannerW / 2 - 3, 2, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Resplandor dorado de la Fiebre de Juguetes
   */
  private drawFeverAura(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const borderGlow = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.4,
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.75
    );
    borderGlow.addColorStop(0, "rgba(255, 215, 0, 0)");
    borderGlow.addColorStop(1, "rgba(255, 215, 0, 0.22)");
    ctx.fillStyle = borderGlow;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  /**
   * Dibuja los juguetes con rotación, sombra, auras de peligro y sellos de logo
   */
  private drawObjects(ctx: CanvasRenderingContext2D): void {
    for (const obj of this.objects) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, obj.alpha));
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      ctx.scale(obj.scale, obj.scale);

      const sprite = this.getSpriteForType(obj.type);
      const size = obj.radius * 2;

      // Resplandor optimizado para regalos dorados o carbón/defectuoso (halo rápido sin GPU blur stall)
      if (obj.type === "gold_gift") {
        ctx.save();
        ctx.fillStyle = "rgba(255, 215, 0, 0.22)";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 1.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 215, 0, 0.40)";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 1.10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (obj.type === "hazard_coal") {
        ctx.save();
        ctx.fillStyle = "rgba(255, 23, 68, 0.22)";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 1.20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 23, 68, 0.45)";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (obj.type === "hazard_defective") {
        ctx.save();
        ctx.fillStyle = "rgba(255, 145, 0, 0.20)";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 1.20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 145, 0, 0.40)";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius * 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      } else {
        // Respaldo geométrico de emergencia mientras carga el sprite
        ctx.fillStyle = obj.isHazard ? "#D50000" : "#00E676";
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sello festivo oficial con logotipo de patrocinador sobre el regalo
      if (obj.isSponsored && obj.sponsorLogo && obj.sponsorLogo.complete) {
        ctx.save();
        const badgeR = obj.radius * 0.52;

        // Medallón circular blanco/marfil de fondo
        ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
        ctx.beginPath();
        ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
        ctx.fill();

        // Borde dorado festivo grueso
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = Math.max(2.5, badgeR * 0.16);
        ctx.stroke();

        // Ribete interior carmesí festivo
        ctx.strokeStyle = "#C62828";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, badgeR - 2.4, 0, Math.PI * 2);
        ctx.stroke();

        // Logo del patrocinador centrado con proporción contenida
        const innerSize = badgeR * 1.42;
        const nw = obj.sponsorLogo.naturalWidth || 1;
        const nh = obj.sponsorLogo.naturalHeight || 1;
        const aspect = nw / nh;
        let dw = innerSize;
        let dh = innerSize;
        if (aspect >= 1) {
          dh = innerSize / aspect;
        } else {
          dw = innerSize * aspect;
        }
        ctx.drawImage(obj.sponsorLogo, -dw / 2, -dh / 2, dw, dh);

        ctx.restore();
      }

      ctx.restore();
    }
  }

  /**
   * Obtiene la imagen correspondiente a cada tipo
   */
  private getSpriteForType(type: ToyType): HTMLImageElement | null {
    switch (type) {
      case "gift_red":
        return this.spriteGiftRed;
      case "gift_green":
        return this.spriteGiftGreen;
      case "gift_blue":
        return this.spriteGiftBlue;
      case "gold_gift":
        return this.spriteGiftGold;
      case "bear":
        return this.spriteBear;
      case "robot":
        return this.spriteRobot;
      case "car":
        return this.spriteCar;
      case "hazard_coal":
        return this.spriteCoal;
      case "hazard_defective":
        return this.spriteDefective;
      default:
        return null;
    }
  }

  /**
   * Máquina artesanal de fabricación de juguetes en la base de la pantalla
   */
  private drawToyMachine(ctx: CanvasRenderingContext2D): void {
    const machineHeight = this.getMachineHeight();
    const machineY = this.height - machineHeight;

    ctx.save();

    // 1. Cuerpo principal de madera rústica y latón
    const grad = ctx.createLinearGradient(0, machineY, 0, this.height);
    grad.addColorStop(0, "#4A2810");
    grad.addColorStop(0.3, "#2C1708");
    grad.addColorStop(1, "#150A04");
    ctx.fillStyle = grad;
    ctx.fillRect(0, machineY, this.width, machineHeight);

    // 2. Ribete superior dorado con remaches
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, machineY, this.width, 6);

    // 3. Chutes de lanzamiento con iluminación mágica
    for (const chuteRelX of this.machineChutes) {
      const cx = this.width * chuteRelX;
      const chuteWidth = Math.min(112, Math.max(72, this.width * 0.095));

      // Boca del embudo
      ctx.fillStyle = "#1E1005";
      ctx.beginPath();
      ctx.ellipse(cx, machineY + 8, chuteWidth / 2, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Borde de bronce
      ctx.strokeStyle = "#FFB300";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Resplandor interior mágico
      const glowGrad = ctx.createRadialGradient(cx, machineY + 8, 2, cx, machineY + 8, chuteWidth / 2);
      glowGrad.addColorStop(0, "rgba(255, 235, 59, 0.7)");
      glowGrad.addColorStop(1, "rgba(255, 145, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, machineY + 8, chuteWidth / 2 - 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Placa dorada central con título y logotipo oficial
    const plaqueW = Math.min(360, this.width * 0.54);
    const plaqueH = Math.min(38, machineHeight * 0.40);
    const plaqueX = (this.width - plaqueW) / 2;
    const plaqueY = machineY + machineHeight * 0.48;

    ctx.fillStyle = "rgba(10, 20, 40, 0.9)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 8);
    ctx.fill();
    ctx.stroke();

    // Si el logo de Feria Mágica está listo, dibujarlo en la placa
    if (this.fairLogo && this.fairLogo.complete) {
      const logoH = plaqueH - 8;
      const nw = this.fairLogo.naturalWidth || 1;
      const nh = this.fairLogo.naturalHeight || 1;
      const logoW = Math.min(logoH * 2.2, logoH * (nw / nh));
      const startX = plaqueX + 8;
      ctx.drawImage(this.fairLogo, startX, plaqueY + 4, logoW, logoH);

      ctx.fillStyle = "#FFD700";
      ctx.font = `900 ${Math.max(10, Math.min(14, plaqueH * 0.44))}px 'Fredoka', 'Montserrat', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ TALLER OFICIAL DE JUGUETES ★", plaqueX + (plaqueW + logoW) / 2, plaqueY + plaqueH / 2);
    } else {
      ctx.fillStyle = "#FFD700";
      ctx.font = `900 ${Math.max(10, Math.min(15, plaqueH * 0.46))}px 'Fredoka', 'Montserrat', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ TALLER MÁGICO DE SANTA ★", this.width / 2, plaqueY + plaqueH / 2);
    }

    // 5. Medallones de latón en los flancos de la máquina
    this.drawMachineSponsorMedallions(ctx, machineY, machineHeight);

    ctx.restore();
  }

  /**
   * Medallones de latón en los extremos izquierdo y derecho de la máquina
   */
  private drawMachineSponsorMedallions(ctx: CanvasRenderingContext2D, machineY: number, machineH: number): void {
    if (this.sponsorList.length < 2) return;

    const r = Math.min(24, Math.max(16, machineH * 0.22));
    const cy = machineY + machineH * 0.58;
    const margin = Math.max(r + 8, this.width * 0.08);

    const leftX = margin;
    const rightX = this.width - margin;

    const cycleOffset = Math.floor(this.machineAnimTime / 6.0);
    const spLeft = this.sponsorList[cycleOffset % this.sponsorList.length];
    const spRight = this.sponsorList[(cycleOffset + 1) % this.sponsorList.length];

    [
      { x: leftX, sp: spLeft },
      { x: rightX, sp: spRight }
    ].forEach(({ x, sp }) => {
      ctx.save();
      // Base circular blanca para destacar el logo
      ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Borde de bronce dorado
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (sp && sp.logo && sp.logo.complete) {
        const logoSize = r * 1.45;
        const nw = sp.logo.naturalWidth || 1;
        const nh = sp.logo.naturalHeight || 1;
        const aspect = nw / nh;
        let dw = logoSize;
        let dh = logoSize;
        if (aspect >= 1) {
          dh = logoSize / aspect;
        } else {
          dw = logoSize * aspect;
        }
        ctx.drawImage(sp.logo, x - dw / 2, cy - dh / 2, dw, dh);
      }
      ctx.restore();
    });
  }

  private getMachineHeight(): number {
    // Conserva una base visible tanto en los tótems verticales como en pantallas anchas.
    return Math.max(76, Math.min(142, this.height * 0.16));
  }

  /**
   * Dibuja los indicadores interactivos propios de WorkshopChaos (Fiebre y Racha)
   */
  private drawInGameFeverAndComboHUD(ctx: CanvasRenderingContext2D): void {
    const feverBarW = Math.min(320, this.width * 0.55);
    const feverBarH = 16;
    const feverBarX = (this.width - feverBarW) / 2;
    const feverBarY = 72; // Debajo del HUD estándar

    ctx.save();

    // Fondo de la barra
    ctx.fillStyle = "rgba(10, 20, 42, 0.85)";
    ctx.strokeStyle = this.isFeverActive ? "#FFD700" : "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 2;
    this.roundRect(ctx, feverBarX, feverBarY, feverBarW, feverBarH, 8);
    ctx.fill();
    ctx.stroke();

    // Relleno de la barra
    const fillPercent = this.feverEnergy / 100;
    if (fillPercent > 0) {
      const fillW = Math.max(8, (feverBarW - 4) * fillPercent);
      const fillGrad = ctx.createLinearGradient(feverBarX, 0, feverBarX + fillW, 0);
      fillGrad.addColorStop(0, "#FF9100");
      fillGrad.addColorStop(1, "#FFD700");
      ctx.fillStyle = fillGrad;
      this.roundRect(ctx, feverBarX + 2, feverBarY + 2, fillW, feverBarH - 4, 6);
      ctx.fill();
    }

    // Etiqueta de la barra
    ctx.font = "900 10px 'Fredoka', sans-serif";
    ctx.fillStyle = this.isFeverActive ? "#FFD700" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const feverLabel = this.isFeverActive ? "★ ¡FIEBRE ACTIVA! (x2 PUNTOS) ★" : "ENERGÍA MÁGICA";
    ctx.fillText(feverLabel, this.width / 2, feverBarY + feverBarH / 2);

    // Pill de Combo / Multiplicador si está activo
    if (this.combo >= 2) {
      const mult = this.getComboMultiplier();
      const comboX = this.width - 120;
      const comboY = 80;

      ctx.fillStyle = "rgba(10, 22, 45, 0.9)";
      ctx.strokeStyle = mult >= 2 ? "#00E5FF" : "#FFD700";
      ctx.lineWidth = 2;
      this.roundRect(ctx, comboX - 50, comboY - 14, 100, 28, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = mult >= 2 ? "#00E5FF" : "#FFD700";
      ctx.font = "900 13px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`RACHA x${this.combo}`, comboX, comboY);
    }

    ctx.restore();
  }

  /**
   * Helper para rectángulos con esquinas redondeadas
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
