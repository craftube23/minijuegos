/**
 * ==============================================================================
 * JUEGO: 🎁 TORRE DE REGALOS MÁGICA (Magical Holiday Gift Tower - Pro Edition)
 * ==============================================================================
 * 
 * Experiencia arcade festiva de física, precisión y corte limpio en estilo 
 * Stylized 2D Game Concept Art (Supercell / Disney Klaus):
 * - Fondo panorámico de la Villa Navideña nevada y cielo de auroras con scroll parallax.
 * - Pedestal tallado en madera noble de caoba con guirnaldas, campanas doradas y cojín de nieve.
 * - Sprites de regalos ilustrados en alta definición: Rubí terciopelo, Esmeralda pino, Zafiro real y Oro celestial.
 * - Corte y rebanado físico preciso (Slicing): El desborde se rebana limpiamente y cae al abismo con física.
 * - Sin regalos flotantes: Si falla el soporte, el regalo cae al vacío; si aterriza, se ajusta al bloque inferior.
 * - Cajas de Patrocinadores Oficiales (Cajasan, Practi, Campus, etc.) con placas talladas y superpoder de expansión.
 * - Grúa fija en el marco superior con péndulo armónico continuo.
 * - Modo Fiebre Navideña x2 con escala musical pentatónica ascendente.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";
import { Haptics } from "../utils/haptics";

export type BoxSpriteType = "rojo" | "verde" | "azul" | "dorado" | "sponsor";

export interface StackedGift {
  id: number;
  x: number; // Centro X en el mundo
  y: number; // Borde superior Y en el mundo
  width: number;
  height: number;
  spriteType: BoxSpriteType;
  srcNormX: number; // Proporción X en el sprite (0 a 1)
  srcNormW: number; // Proporción de ancho en el sprite (0 a 1)
  isPerfect: boolean;
  isSponsor: boolean;
  sponsorId?: string;
  sponsorName?: string;
  settleProgress: number; // Squash & stretch al aterrizar
  wobbleX: number;
}

export interface TumblingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  spriteType: BoxSpriteType;
  srcNormX: number;
  srcNormW: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
  isSponsor: boolean;
  sponsorId?: string;
}

export interface ActiveDroppingGift {
  x: number; // Centro X en el mundo
  y: number; // Borde superior Y en el mundo
  width: number;
  height: number;
  spriteType: BoxSpriteType;
  vx: number;
  vy: number;
  rotation: number;
  vRot?: number;
  hasMissed?: boolean;
  isSponsor: boolean;
  sponsorId?: string;
  sponsorName?: string;
}

export class GiftTowerGame extends BaseGame {
  // Sprites e Ilustraciones 2D Stylized Game Concept Art
  private bgVillaImage: HTMLImageElement;
  private pedestalImage: HTMLImageElement;
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteGiftBlue: HTMLImageElement;
  private spriteGiftGold: HTMLImageElement;

  // Grúa / Péndulo Oscilante (Fijo en la parte superior de la pantalla)
  private swingAngle: number = 0;
  private swingSpeed: number = 2.3;
  private swingAmplitude: number = 0.54;
  private swingTime: number = 0;
  private ropeLength: number = 130;
  private readonly craneScreenAnchorY: number = 72; // Fijo en pantalla
  private isSwinging: boolean = true;

  // Cajas y Torre
  private stackedGifts: StackedGift[] = [];
  private tumblingGifts: TumblingBox[] = [];
  private activeDroppingGift: ActiveDroppingGift | null = null;
  private nextGiftId: number = 1;

  // Configuración de tamaño de cajas
  private baseBoxWidth: number = 190;
  private boxHeight: number = 133;

  // Próximo regalo en la grúa
  private currentGiftSprite: BoxSpriteType = "rojo";
  private nextIsSponsor: boolean = false;
  private nextSponsorId?: string;
  private nextSponsorName?: string;
  private giftSpawnCount: number = 0;

  // Base / Pedestal
  private basePlatformY: number = 0;
  private basePlatformWidth: number = 360;
  private basePlatformHeight: number = 120;

  // Cámara suave y Altitud
  private cameraY: number = 0;
  private targetCameraY: number = 0;
  private maxAltitudeMeters: number = 0;

  // Mecánicas de Combo & Fiebre Navideña
  private combo: number = 0;
  private maxCombo: number = 0;
  private perfectCount: number = 0;
  private feverTimer: number = 0;
  private isFeverActive: boolean = false;

  // Balanceo elástico de la torre
  private towerSwayPhase: number = 0;
  private towerSwayIntensity: number = 0;

  // Sonidos sintetizados
  private audioContext: AudioContext | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "gift-tower",
      "Torre de Regalos Mágica",
      "¡Toca la pantalla para soltar los paquetes navideños y construye la torre más alta hacia las estrellas!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/The Builder.mp3";
    this.inGameMusicVolume = 0.48;
    this.showLives = true;
    this.maxLives = 3;
    this.lives = 3;

    // Cargar sprites Stylized 2D Game Concept Art
    this.bgVillaImage = new Image();
    this.bgVillaImage.src = "./assets/images/fondo-villa-montanas.jpg";

    this.pedestalImage = new Image();
    this.pedestalImage.src = "./assets/images/pedestal-torre-regalos.png";

    this.spriteGiftRed = new Image();
    this.spriteGiftRed.src = "./assets/images/regalo-estilizado-rojo.png";

    this.spriteGiftGreen = new Image();
    this.spriteGiftGreen.src = "./assets/images/regalo-estilizado-verde.png";

    this.spriteGiftBlue = new Image();
    this.spriteGiftBlue.src = "./assets/images/regalo-estilizado-azul.png";

    this.spriteGiftGold = new Image();
    this.spriteGiftGold.src = "./assets/images/regalo-estilizado-dorado.png";

    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch {}
  }

  private playTone(freq: number, duration: number = 0.25, type: OscillatorType = "sine", gainVal: number = 0.28): void {
    if (!this.audioContext || this.audio.getIsMuted()) return;
    try {
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      gain.gain.setValueAtTime(gainVal, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch {}
  }

  private playChimeScale(step: number): void {
    const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const freq = freqs[Math.min(step, freqs.length - 1)];
    this.playTone(freq, 0.38, "sine", 0.30);
    setTimeout(() => this.playTone(freq * 2, 0.22, "triangle", 0.16), 35);
  }

  private handleKeyDownBound = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowDown") {
      e.preventDefault();
      this.handlePlayerDrop();
    }
  };

  protected onStart(): void {
    this.lives = this.maxLives;
    this.stackedGifts = [];
    this.tumblingGifts = [];
    this.activeDroppingGift = null;
    this.nextGiftId = 1;
    this.giftSpawnCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.feverTimer = 0;
    this.isFeverActive = false;
    this.swingTime = 0;
    this.swingAngle = 0;
    this.towerSwayPhase = 0;
    this.towerSwayIntensity = 0;
    this.maxAltitudeMeters = 0;

    // Dimensionamiento adaptativo proporcional al arte estilizado 2D
    this.baseBoxWidth = Math.min(220, Math.max(165, this.width * 0.36));
    this.boxHeight = Math.round(this.baseBoxWidth * 0.70); // Proporción natural ~0.9 de los regalos con moño
    this.basePlatformWidth = Math.min(380, Math.max(260, this.width * 0.50));
    this.basePlatformHeight = Math.round(this.basePlatformWidth * 0.36);
    this.basePlatformY = this.height - this.basePlatformHeight - 12; // Base firme visible por encima de la barra inferior
    this.ropeLength = Math.min(180, Math.max(130, this.height * 0.22));
    this.swingAmplitude = 0.82; // Arco de balanceo amplio y generoso para apuntar con precisión

    this.cameraY = 0;
    this.targetCameraY = 0;

    this.prepareNextCraneBox();

    this.input.onPointerDown = (_pointerId: number, _x: number, _y: number) => {
      this.handlePlayerDrop();
    };

    window.addEventListener("keydown", this.handleKeyDownBound);
  }

  public resize(width: number, height: number): void {
    super.resize(width, height);
    this.baseBoxWidth = Math.min(220, Math.max(165, this.width * 0.36));
    this.boxHeight = Math.round(this.baseBoxWidth * 0.70);
    this.basePlatformWidth = Math.min(380, Math.max(260, this.width * 0.50));
    this.basePlatformHeight = Math.round(this.basePlatformWidth * 0.36);
    this.basePlatformY = this.height - this.basePlatformHeight - 12;
    this.ropeLength = Math.min(180, Math.max(130, this.height * 0.22));
  }

  private prepareNextCraneBox(): void {
    this.isSwinging = true;
    this.giftSpawnCount++;

    // ¿Es caja de patrocinador oficial? (Cada 6 cajas)
    if (this.giftSpawnCount > 1 && this.giftSpawnCount % 6 === 0) {
      this.nextIsSponsor = true;
      const sponsors = BRANDING.getAllSponsors();
      const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
      this.nextSponsorId = sponsor.id;
      this.nextSponsorName = sponsor.shortName;
      this.currentGiftSprite = "sponsor";
    } else {
      this.nextIsSponsor = false;
      this.nextSponsorId = undefined;
      this.nextSponsorName = undefined;

      const types: BoxSpriteType[] = ["rojo", "verde", "azul", "dorado"];
      this.currentGiftSprite = types[this.giftSpawnCount % types.length];
    }

    const speedBonus = Math.min(1.1, this.stackedGifts.length * 0.04);
    this.swingSpeed = 2.4 + speedBonus;
  }

  private handlePlayerDrop(): void {
    if (!this.isRunning || this.isGameOver || this.isFinishing) return;
    if (!this.isSwinging || this.activeDroppingGift !== null) return;

    // Posición en coordenadas de pantalla
    const craneAnchorScreenX = this.width / 2;
    const craneAnchorScreenY = this.craneScreenAnchorY;
    const hookScreenX = craneAnchorScreenX + Math.sin(this.swingAngle) * this.ropeLength;
    const hookScreenY = craneAnchorScreenY + Math.cos(this.swingAngle) * this.ropeLength;

    // Convertir de pantalla a mundo restando cameraY
    const spawnWorldX = hookScreenX;
    const spawnWorldY = hookScreenY - this.cameraY;

    this.activeDroppingGift = {
      x: spawnWorldX,
      y: spawnWorldY,
      width: this.baseBoxWidth,
      height: this.boxHeight,
      spriteType: this.currentGiftSprite,
      vx: 0, // Caída vertical limpia y directa exactamente donde apuntó el jugador
      vy: 200, // Aceleración inicial limpia hacia abajo
      rotation: 0,
      hasMissed: false,
      isSponsor: this.nextIsSponsor,
      sponsorId: this.nextSponsorId,
      sponsorName: this.nextSponsorName
    };

    this.isSwinging = false;
    this.audio.playWhoosh();
    Haptics.light();
  }

  protected onUpdate(dt: number): void {
    // 1. Oscilación del Péndulo
    if (this.isSwinging) {
      this.swingTime += dt * this.swingSpeed;
      this.swingAngle = Math.sin(this.swingTime) * this.swingAmplitude;
    }

    // 2. Modo Fiebre
    if (this.isFeverActive) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.isFeverActive = false;
        this.feverTimer = 0;
      }
    }

    // 3. Balanceo oscilatorio de la torre
    this.towerSwayPhase += dt * 2.8;
    this.towerSwayIntensity = Math.max(0, this.towerSwayIntensity - dt * 0.45);

    // 4. Caja Cayendo
    if (this.activeDroppingGift) {
      const box = this.activeDroppingGift;
      box.vy += 1750 * dt;
      box.y += box.vy * dt;
      box.x += box.vx * dt;

      if (!box.hasMissed) {
        box.rotation *= 0.94;
      } else {
        box.rotation += (box.vRot || 4) * dt;
      }

      // Superficie de aterrizaje en el mundo
      let targetY: number;
      let topBoxWidth: number;
      let topBoxCenterX: number;

      if (this.stackedGifts.length === 0) {
        // Aterriza directamente sobre el cojín de nieve del pedestal de caoba
        targetY = this.basePlatformY + this.basePlatformHeight * 0.18 - box.height;
        topBoxWidth = this.basePlatformWidth * 0.76;
        topBoxCenterX = this.width / 2;
      } else {
        const topBox = this.stackedGifts[this.stackedGifts.length - 1];
        // Se asienta sobre la tapa y el moño del regalo inferior con perspectiva natural
        targetY = topBox.y - box.height + (box.height * 0.16);
        topBoxWidth = topBox.width;
        topBoxCenterX = topBox.x;
      }

      const topBoxLeft = topBoxCenterX - topBoxWidth / 2;
      const topBoxRight = topBoxCenterX + topBoxWidth / 2;

      // Detección al alcanzar la altura de impacto
      if (box.y >= targetY) {
        const boxLeft = box.x - box.width / 2;
        const boxRight = box.x + box.width / 2;
        const overlapLeft = Math.max(boxLeft, topBoxLeft);
        const overlapRight = Math.min(boxRight, topBoxRight);
        const overlapWidth = overlapRight - overlapLeft;

        // ¿Suficiente apoyo para mantenerse en pie?
        // En física de cajas de regalo, requiere al menos 48% de solapamiento para no volcar
        const minRequiredSupport = box.width * 0.48;

        if (overlapWidth < minRequiredSupport) {
          // CASO 1: SIN APOYO SUFICIENTE - ¡EL REGALO SE INCLINA Y CAE AL VACÍO!
          if (!box.hasMissed) {
            box.hasMissed = true;
            this.lives--;
            this.combo = 0;
            this.isFeverActive = false;
            this.triggerShake(9, 0.35);
            this.audio.playError();
            Haptics.impact();
            this.addFloatingText("¡SE CAYÓ! -1 VIDA", box.x, targetY - 20, "#FF2A4D", 1.35);

            // Inercia angular realista hacia el lado del abismo
            const dir = box.x >= topBoxCenterX ? 1 : -1;
            box.vx = dir * 160;
            box.vRot = dir * 5.2;

            if (this.lives <= 0) {
              this.timeRemaining = 0;
              this.endGame();
            } else {
              setTimeout(() => this.prepareNextCraneBox(), 420);
            }
          }

          // Continúa cayendo hacia el fondo de la pantalla sin detenerse
          if (box.y > this.basePlatformY + 500) {
            this.activeDroppingGift = null;
          }
        } else if (!box.hasMissed) {
          // CASO 2: ATERRIZAJE EXITOSO EN LA TORRE (Perfecto o Corte Limpio con Soporte Sólido)
          this.handleBoxLanding(box, targetY, topBoxCenterX, topBoxWidth, overlapLeft, overlapRight, overlapWidth);
        }
      }
    }

    // 5. Cajas y trozos rebanados que caen rodando al abismo
    for (let i = this.tumblingGifts.length - 1; i >= 0; i--) {
      const tb = this.tumblingGifts[i];
      tb.vy += 1650 * dt;
      tb.y += tb.vy * dt;
      tb.x += tb.vx * dt;
      tb.rotation += tb.vRot * dt;
      tb.alpha -= dt * 0.65;

      if (tb.alpha <= 0 || tb.y > this.basePlatformY + 500) {
        this.tumblingGifts.splice(i, 1);
      }
    }

    // 6. Squash & stretch al asentar
    for (const g of this.stackedGifts) {
      if (g.settleProgress > 0) {
        g.settleProgress -= dt * 5.0;
        if (g.settleProgress < 0) g.settleProgress = 0;
      }
    }

    // 7. Seguimiento Suave de Cámara: Mantiene el pedestal a la vista y acompaña el crecimiento
    if (this.stackedGifts.length > 0) {
      const highestBox = this.stackedGifts[this.stackedGifts.length - 1];
      const highestY = highestBox.y;
      // Solo desplaza hacia abajo cuando la torre supera la mitad superior de la pantalla
      const targetViewingY = this.height * 0.48;
      if (highestY < targetViewingY) {
        this.targetCameraY = targetViewingY - highestY;
      } else {
        this.targetCameraY = 0;
      }
    } else {
      this.targetCameraY = 0;
    }

    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1.0, dt * 4.0);

    const currentMeters = Math.max(0, Math.round(this.stackedGifts.length * 2.5));
    if (currentMeters > this.maxAltitudeMeters) {
      this.maxAltitudeMeters = currentMeters;
    }
  }

  private handleBoxLanding(
    box: ActiveDroppingGift,
    targetY: number,
    topBoxCenterX: number,
    _topBoxWidth: number,
    overlapLeft: number,
    overlapRight: number,
    overlapWidth: number
  ): void {
    const deltaX = box.x - topBoxCenterX;
    const isPerfect = Math.abs(deltaX) <= 14;

    let finalX: number;
    let finalWidth: number;
    let srcNormX = 0;
    let srcNormW = 1.0;

    if (isPerfect) {
      // ¡PERFECTO! Alineación impecable en el centro
      finalX = topBoxCenterX;
      finalWidth = box.width;
      this.combo++;
      this.perfectCount++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      this.playChimeScale(this.combo);
      Haptics.light();

      const mult = this.isFeverActive ? 2.5 : 1.0 + Math.min(1.5, this.combo * 0.25);
      const points = Math.round(300 * mult);
      this.addScore(points);

      this.addFloatingText(`¡PERFECTO! +${points}`, finalX, targetY - 25, "#FFD700", 1.4);
      this.particles.emitBurst(finalX, targetY + box.height / 2, "#FFD700", 24);

      // Fiebre Navideña tras 3 perfectos seguidos
      if (this.combo >= 3 && !this.isFeverActive) {
        this.isFeverActive = true;
        this.feverTimer = 8.0;
        this.audio.playPowerUp();
        this.addFloatingText("¡FIEBRE NAVIDEÑA x2!", this.width / 2, this.height * 0.35, "#FF4081", 1.6);
        this.particles.emitConfetti(this.width, 40);
      }
    } else {
      // ¡CORTE LIMPIO Y EQUILIBRIO!
      // El desborde se rebana limpiamente, manteniendo una presencia de regalo sólida (mínimo 75% de ancho)
      const rawOverhang = box.width - overlapWidth;
      const sliceWidth = Math.min(box.width * 0.22, Math.max(6, rawOverhang));
      finalWidth = Math.max(this.baseBoxWidth * 0.75, box.width - sliceWidth);

      const sliceDir = deltaX > 0 ? 1 : -1;
      finalX = box.x - (sliceDir * sliceWidth * 0.4);

      // Trozo rebanado que cae al abismo con física y rotación
      if (sliceWidth >= 6) {
        const sliceX = deltaX > 0 ? overlapRight + sliceWidth * 0.5 : overlapLeft - sliceWidth * 0.5;

        this.tumblingGifts.push({
          x: sliceX,
          y: targetY,
          width: sliceWidth,
          height: box.height,
          spriteType: box.spriteType,
          srcNormX: deltaX > 0 ? 0.75 : 0,
          srcNormW: 0.25,
          vx: sliceDir * 120,
          vy: -80,
          rotation: 0,
          vRot: sliceDir * 4.8,
          alpha: 1.0,
          isSponsor: box.isSponsor,
          sponsorId: box.sponsorId
        });

        // Partículas en el borde del corte
        const cutX = deltaX > 0 ? overlapRight : overlapLeft;
        this.particles.emitBurst(cutX, targetY + box.height / 2, "#FFFFFF", 16);
      }

      this.combo = 0;
      this.audio.playTap();
      Haptics.light();

      const points = 150;
      this.addScore(points);
      this.addFloatingText(`¡CORTE LIMPIO! +${points}`, finalX, targetY - 20, "#FFFFFF", 1.2);

      // El descentrado produce un balanceo armónico en la torre
      this.towerSwayIntensity = Math.min(1.0, this.towerSwayIntensity + 0.28);
    }

    // Bonificación de Patrocinador Oficial
    if (box.isSponsor && box.sponsorId) {
      const sponsorBonus = 500;
      this.addScore(sponsorBonus);
      this.audio.playPowerUp();
      this.addFloatingText(
        `¡REGALO ${box.sponsorName || "OFICIAL"}! +${sponsorBonus}`,
        finalX,
        targetY - 50,
        "#00E676",
        1.5
      );
      this.particles.emitBurst(finalX, targetY + box.height / 2, "#00E676", 30);
    }

    // Registrar en la pila (siempre con apoyo firme)
    const stackedGift: StackedGift = {
      id: this.nextGiftId++,
      x: finalX,
      y: targetY,
      width: finalWidth,
      height: box.height,
      spriteType: box.spriteType,
      srcNormX,
      srcNormW,
      isPerfect,
      isSponsor: box.isSponsor,
      sponsorId: box.sponsorId,
      sponsorName: box.sponsorName,
      settleProgress: 1.0,
      wobbleX: 0
    };

    this.stackedGifts.push(stackedGift);
    this.activeDroppingGift = null;

    setTimeout(() => this.prepareNextCraneBox(), 240);
  }

  // ==========================================================================
  // RENDERIZADO VISUAL: Stylized 2D Game Concept Art
  // ==========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo Panorámico de la Villa Navideña con Parallax Vertical
    this.drawParallaxBackground(ctx);

    // 2. Elementos del Mundo en Coordenadas del Mundo (Afectados por cameraY)
    ctx.save();
    ctx.translate(0, this.cameraY);

    // Trozos rebanados y cajas rodando al abismo
    this.drawTumblingGifts(ctx);

    // Pedestal de madera tallada con cojín de nieve
    this.drawPedestal(ctx);

    // Torre de regalos apilados
    this.drawStackedTower(ctx);

    // Regalo activo en caída libre
    if (this.activeDroppingGift) {
      this.drawGiftSprite(
        ctx,
        this.activeDroppingGift.x,
        this.activeDroppingGift.y,
        this.activeDroppingGift.width,
        this.activeDroppingGift.height,
        this.activeDroppingGift.spriteType,
        0,
        1.0,
        this.activeDroppingGift.rotation,
        1.0,
        this.activeDroppingGift.isSponsor,
        this.activeDroppingGift.sponsorId
      );
    }

    ctx.restore();

    // 3. Grúa y Péndulo Oscilante (Fijados en Pantalla Superior, fuera de cameraY)
    this.drawScreenCrane(ctx);

    // 4. Sistema de Partículas
    this.particles.draw(ctx);

    // 5. HUD Personalizado del Juego
    this.drawCustomHUD(ctx);
  }

  private drawParallaxBackground(ctx: CanvasRenderingContext2D): void {
    if (this.bgVillaImage.complete && this.bgVillaImage.naturalWidth > 0) {
      const img = this.bgVillaImage;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW = this.width;
      let drawH = this.height * 1.35;
      if (drawW / drawH < imgAspect) {
        drawW = drawH * imgAspect;
      }
      const drawX = (this.width - drawW) / 2;
      const parallaxY = -(this.cameraY * 0.15);
      ctx.drawImage(img, drawX, parallaxY, drawW, drawH);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#080E21");
      grad.addColorStop(0.5, "#152238");
      grad.addColorStop(1, "#283E58");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const altitude = this.maxAltitudeMeters;
    if (altitude >= 25) {
      const auroraAlpha = Math.min(0.55, (altitude - 25) / 50);
      ctx.save();
      ctx.globalAlpha = auroraAlpha;
      const t = performance.now() * 0.001;
      const auroraGrad = ctx.createLinearGradient(0, 0, this.width, this.height * 0.45);
      auroraGrad.addColorStop(0, "rgba(0, 229, 255, 0.4)");
      auroraGrad.addColorStop(0.5, "rgba(0, 230, 118, 0.6)");
      auroraGrad.addColorStop(1, "rgba(213, 0, 249, 0.35)");

      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(0, this.height * 0.22);
      for (let x = 0; x <= this.width; x += 35) {
        const y = this.height * 0.2 + Math.sin(x * 0.009 + t) * 35 + Math.cos(x * 0.014 - t * 0.8) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPedestal(ctx: CanvasRenderingContext2D): void {
    const x = this.width / 2;
    const y = this.basePlatformY;
    const w = this.basePlatformWidth;
    const h = this.basePlatformHeight;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.75, w * 0.52, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.pedestalImage.complete && this.pedestalImage.naturalWidth > 0) {
      ctx.drawImage(this.pedestalImage, x - w / 2, y, w, h);
    } else {
      ctx.fillStyle = "#8D4925";
      this.roundRect(ctx, x - w / 2, y, w, h, 14);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawStackedTower(ctx: CanvasRenderingContext2D): void {
    const total = this.stackedGifts.length;

    for (let i = 0; i < total; i++) {
      const gift = this.stackedGifts[i];
      const heightFactor = i / Math.max(1, total);
      const swayOffset = Math.sin(this.towerSwayPhase + i * 0.22) * (this.towerSwayIntensity * 16 * heightFactor);

      const squash = gift.settleProgress > 0 ? Math.sin(gift.settleProgress * Math.PI) * 0.12 : 0;
      const renderW = gift.width * (1.0 + squash);
      const renderH = gift.height * (1.0 - squash);
      const renderY = gift.y + (gift.height - renderH);

      this.drawGiftSprite(
        ctx,
        gift.x + gift.wobbleX + swayOffset,
        renderY,
        renderW,
        renderH,
        gift.spriteType,
        gift.srcNormX,
        gift.srcNormW,
        0,
        1.0,
        gift.isSponsor,
        gift.sponsorId
      );
    }
  }

  private drawTumblingGifts(ctx: CanvasRenderingContext2D): void {
    for (const tg of this.tumblingGifts) {
      this.drawGiftSprite(
        ctx,
        tg.x,
        tg.y,
        tg.width,
        tg.height,
        tg.spriteType,
        tg.srcNormX,
        tg.srcNormW,
        tg.rotation,
        tg.alpha,
        tg.isSponsor,
        tg.sponsorId
      );
    }
  }

  private drawGiftSprite(
    ctx: CanvasRenderingContext2D,
    cx: number,
    topY: number,
    w: number,
    h: number,
    type: BoxSpriteType,
    srcNormX: number = 0,
    srcNormW: number = 1.0,
    rotation: number = 0,
    alpha: number = 1.0,
    isSponsor: boolean = false,
    sponsorId?: string
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, topY + h / 2);
    if (rotation !== 0) ctx.rotate(rotation);

    const halfW = w / 2;
    const halfH = h / 2;

    if (this.isFeverActive || isSponsor || type === "dorado") {
      ctx.shadowColor = isSponsor ? "rgba(0, 230, 118, 0.8)" : "rgba(255, 215, 0, 0.75)";
      ctx.shadowBlur = 18;
    }

    let spriteImg: HTMLImageElement = this.spriteGiftRed;
    if (type === "verde") spriteImg = this.spriteGiftGreen;
    else if (type === "azul") spriteImg = this.spriteGiftBlue;
    else if (type === "dorado" || type === "sponsor") spriteImg = this.spriteGiftGold;

    if (spriteImg.complete && spriteImg.naturalWidth > 0) {
      const nw = spriteImg.naturalWidth;
      const nh = spriteImg.naturalHeight;
      const sx = Math.max(0, Math.min(nw - 1, srcNormX * nw));
      const sw = Math.max(1, Math.min(nw - sx, srcNormW * nw));

      ctx.drawImage(spriteImg, sx, 0, sw, nh, -halfW, -halfH, w, h);
    } else {
      ctx.fillStyle = type === "verde" ? "#1B5E20" : type === "azul" ? "#1565C0" : "#D50032";
      this.roundRect(ctx, -halfW, -halfH, w, h, 8);
      ctx.fill();
    }

    // Si es patrocinador oficial y la caja tiene al menos 65px de ancho
    if (isSponsor && sponsorId && w >= 65) {
      this.drawSponsorSignOnGift(ctx, sponsorId, halfW, halfH);
    }

    ctx.restore();
  }

  private drawSponsorSignOnGift(
    ctx: CanvasRenderingContext2D,
    sponsorId: string,
    halfW: number,
    halfH: number
  ): void {
    const signW = Math.min(110, halfW * 1.5);
    const signH = Math.min(38, halfH * 1.3);

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#FFD700";

    ctx.fillStyle = "#FFFDE7";
    this.roundRect(ctx, -signW / 2, -signH / 2, signW, signH, 6);
    ctx.fill();

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, -signW / 2, -signH / 2, signW, signH, 6);
    ctx.stroke();

    const sponsorImg = this.getSponsorImage(sponsorId);
    if (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0) {
      const imgAspect = sponsorImg.naturalWidth / sponsorImg.naturalHeight;
      const targetH = signH - 8;
      const targetW = Math.min(signW - 10, targetH * imgAspect);
      ctx.drawImage(sponsorImg, -targetW / 2, -targetH / 2, targetW, targetH);
    } else {
      ctx.fillStyle = "#1A237E";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sponsorId.toUpperCase(), 0, 0);
    }
    ctx.restore();
  }

  private drawScreenCrane(ctx: CanvasRenderingContext2D): void {
    const anchorScreenX = this.width / 2;
    const anchorScreenY = this.craneScreenAnchorY;

    ctx.save();
    ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
    ctx.shadowBlur = 20;

    // Gran estrella dorada anclada al marco
    ctx.fillStyle = "#FFD700";
    this.drawStar(ctx, anchorScreenX, anchorScreenY, 5, 22, 10);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    this.drawStar(ctx, anchorScreenX, anchorScreenY, 5, 9, 4);
    ctx.fill();
    ctx.restore();

    if (this.isSwinging) {
      const hookScreenX = anchorScreenX + Math.sin(this.swingAngle) * this.ropeLength;
      const hookScreenY = anchorScreenY + Math.cos(this.swingAngle) * this.ropeLength;

      ctx.save();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorScreenX, anchorScreenY);
      ctx.lineTo(hookScreenX, hookScreenY);
      ctx.stroke();

      ctx.fillStyle = "#FFA000";
      ctx.beginPath();
      ctx.arc(hookScreenX, hookScreenY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      this.drawGiftSprite(
        ctx,
        hookScreenX,
        hookScreenY,
        this.baseBoxWidth,
        this.boxHeight,
        this.currentGiftSprite,
        0,
        1.0,
        this.swingAngle * 0.35,
        1.0,
        this.nextIsSponsor,
        this.nextSponsorId
      );
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerR;
      y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  }

  private drawCustomHUD(ctx: CanvasRenderingContext2D): void {
    const pad = 16;
    const topY = 18;

    ctx.save();

    // 1. Contador de Altitud
    const altitude = this.maxAltitudeMeters;
    ctx.fillStyle = "rgba(10, 20, 45, 0.80)";
    this.roundRect(ctx, pad, topY, 150, 48, 10);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    this.roundRect(ctx, pad, topY, 150, 48, 10);
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = "900 20px 'Fredoka', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`🏰 ${altitude} m`, pad + 14, topY + 24);

    // 2. Vidas (Corazones)
    const heartX = this.width - pad - 120;
    ctx.fillStyle = "rgba(10, 20, 45, 0.80)";
    this.roundRect(ctx, heartX, topY, 120, 48, 10);
    ctx.fill();
    ctx.strokeStyle = "#FF2A4D";
    ctx.lineWidth = 2;
    this.roundRect(ctx, heartX, topY, 120, 48, 10);
    ctx.stroke();

    let heartsStr = "";
    for (let i = 0; i < this.maxLives; i++) {
      heartsStr += i < this.lives ? "❤️" : "🖤";
    }
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(heartsStr, heartX + 60, topY + 25);

    // 3. Indicador de Combo
    if (this.combo > 1) {
      const comboX = this.width / 2;
      const comboY = topY + 24;
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 10;
      ctx.font = "900 22px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`¡x${this.combo} COMBO! 🔥`, comboX, comboY);
      ctx.shadowBlur = 0;
    }

    // 4. Banner de Fiebre Navideña
    if (this.isFeverActive) {
      const feverY = topY + 58;
      ctx.fillStyle = "rgba(255, 64, 129, 0.88)";
      this.roundRect(ctx, this.width / 2 - 120, feverY, 240, 28, 14);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, this.width / 2 - 120, feverY, 240, 28, 14);
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 13px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ FIEBRE NAVIDEÑA: ${this.feverTimer.toFixed(1)}s ⚡`, this.width / 2, feverY + 14);
    }

    // 5. Indicador táctil de bienvenida
    if (this.stackedGifts.length === 0 && !this.activeDroppingGift) {
      const hintY = this.height - 40;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.font = "700 16px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("👆 ¡Toca la pantalla para soltar el paquete! 🎁", this.width / 2, hintY);
    }

    ctx.restore();
  }

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
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  public endGame(): void {
    window.removeEventListener("keydown", this.handleKeyDownBound);
    super.endGame();

    const heightBonus = this.maxAltitudeMeters * 60;
    this.score += heightBonus;

    let rank = "C";
    let rankColor = "#FF9100";
    if (this.score >= 5000 || this.maxAltitudeMeters >= 45) {
      rank = "S+";
      rankColor = "#FFD700";
    } else if (this.score >= 3800 || this.maxAltitudeMeters >= 30) {
      rank = "S";
      rankColor = "#00E5FF";
    } else if (this.score >= 2600 || this.maxAltitudeMeters >= 20) {
      rank = "A";
      rankColor = "#00E676";
    } else if (this.score >= 1500 || this.maxAltitudeMeters >= 10) {
      rank = "B";
      rankColor = "#2979FF";
    }

    if (this.onGameOver) {
      this.onGameOver({
        gameId: this.id,
        gameTitle: this.title,
        score: this.score,
        highScore: this.highScore,
        isNewRecord: this.score > this.highScore,
        logoUsed: this.activeLogo,
        rank,
        rankLabel: `Torre de ${this.maxAltitudeMeters}m (${this.stackedGifts.length} pisos)`,
        rankColor,
        maxCombo: this.maxCombo,
        perfectCount: this.perfectCount,
        accuracy: this.stackedGifts.length > 0 ? Math.round((this.perfectCount / this.stackedGifts.length) * 100) : 100
      });
    }
  }
}
