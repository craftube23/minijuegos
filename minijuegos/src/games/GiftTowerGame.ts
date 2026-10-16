/**
 * ==============================================================================
 * JUEGO: 🎁 TORRE DE REGALOS MÁGICA (Magical Holiday Gift Tower - Pro Edition)
 * ==============================================================================
 * 
 * Experiencia arcade festiva de física, precisión y equilibrio en estilo Stylized 2D Game Concept Art:
 * - Grúa oscilante mágica: Una estrella navideña balancea los regalos en movimiento armónico pendular.
 * - Física de apilamiento y rebanado preciso: Alineación perfecta genera combos musicales y expansiones de caja;
 *   el desbordamiento se rebana con trozos que caen con física realista.
 * - Balance y balanceo elástico de la torre a gran altitud.
 * - Cámara dinámica y progresión de altitudes: Desde la villa navideña nevada, pasando por nubes de algodón,
 *   auroras boreales, hasta el cielo estrellado con la luna y el trineo de Santa.
 * - Cajas festivas tematizadas: Rubí imperial, Esmeralda pino, Zafiro real, Bastón de caramelo y Cajas Doradas.
 * - Integración oficial de patrocinadores (Practi, Campus, etc.) con cajas mágicas, bonificaciones y auras doradas.
 * - Modo Fiebre Navideña tras rachas perfectas y efectos sonoros sintetizados a 0ms de latencia.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";
import { Haptics } from "../utils/haptics";

export type BoxThemeType = "ruby" | "emerald" | "sapphire" | "gold" | "candycane" | "sponsor";

export interface BoxTheme {
  type: BoxThemeType;
  primaryColor: string;
  secondaryColor: string;
  ribbonColor: string;
  glowColor: string;
  patternType: "stars" | "snowflakes" | "stripes" | "dots" | "plain";
}

export interface StackedBox {
  id: number;
  x: number; // Centro X
  y: number; // Borde superior Y en coordenadas del mundo
  width: number;
  height: number;
  theme: BoxTheme;
  isPerfect: boolean;
  sponsorId?: string;
  sponsorName?: string;
  settleProgress: number; // Para animación de impacto squash & stretch
  wobbleX: number; // Desplazamiento elástico temporal
}

export interface FallingSlice {
  x: number;
  y: number;
  width: number;
  height: number;
  theme: BoxTheme;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export interface DroppingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  theme: BoxTheme;
  vx: number;
  vy: number;
  rotation: number;
  isSponsor?: boolean;
  sponsorId?: string;
  sponsorName?: string;
}

const THEME_PALETTES: BoxTheme[] = [
  {
    type: "ruby",
    primaryColor: "#D50032",
    secondaryColor: "#9B0024",
    ribbonColor: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.4)",
    patternType: "stars"
  },
  {
    type: "emerald",
    primaryColor: "#1B5E20",
    secondaryColor: "#0D3813",
    ribbonColor: "#E0F7FA",
    glowColor: "rgba(0, 230, 118, 0.4)",
    patternType: "snowflakes"
  },
  {
    type: "sapphire",
    primaryColor: "#1565C0",
    secondaryColor: "#0D3C75",
    ribbonColor: "#FFD700",
    glowColor: "rgba(0, 229, 255, 0.4)",
    patternType: "dots"
  },
  {
    type: "candycane",
    primaryColor: "#E53935",
    secondaryColor: "#B71C1C",
    ribbonColor: "#FFFFFF",
    glowColor: "rgba(255, 255, 255, 0.5)",
    patternType: "stripes"
  },
  {
    type: "gold",
    primaryColor: "#FFA000",
    secondaryColor: "#E65100",
    ribbonColor: "#FFF8E1",
    glowColor: "rgba(255, 215, 0, 0.6)",
    patternType: "stars"
  }
];

export class GiftTowerGame extends BaseGame {
  // Grúa / Péndulo Oscilante
  private swingAngle: number = 0;
  private swingSpeed: number = 2.4;
  private swingAmplitude: number = 0.52; // Radianes
  private swingTime: number = 0;
  private ropeLength: number = 150;
  private isSwinging: boolean = true;

  // Cajas y Torre
  private stackedBoxes: StackedBox[] = [];
  private fallingSlices: FallingSlice[] = [];
  private activeDroppingBox: DroppingBox | null = null;
  private nextBoxId: number = 1;

  // Propiedades de la caja actual en la grúa
  private currentBoxWidth: number = 240;
  private readonly defaultBoxHeight: number = 72;
  private currentBoxTheme: BoxTheme = THEME_PALETTES[0];
  private nextIsSponsor: boolean = false;
  private nextSponsorId?: string;
  private nextSponsorName?: string;
  private boxSpawnCount: number = 0;

  // Base / Pedestal
  private basePlatformY: number = 0;
  private basePlatformWidth: number = 280;
  private basePlatformHeight: number = 80;

  // Cámara suave y Altitud
  private cameraY: number = 0;
  private targetCameraY: number = 0;
  private maxAltitudeMeters: number = 0;

  // Mecánicas de Combo & Fiebre
  private combo: number = 0;
  private maxCombo: number = 0;
  private perfectCount: number = 0;
  private feverTimer: number = 0;
  private isFeverActive: boolean = false;

  // Feedback de balance / oscilación de la torre
  private towerSwayPhase: number = 0;
  private towerSwayAmount: number = 0;

  // Sonidos sintetizados (Escala musical para combos perfectos)
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

    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch {
      // Ignorar de forma segura si el navegador lo bloquea antes de interacción
    }
  }

  private playTone(freq: number, duration: number = 0.22, type: OscillatorType = "sine", gainVal: number = 0.25): void {
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
    } catch {
      // Silencioso
    }
  }

  private playChimeScale(step: number): void {
    // Escala pentatónica mayor festiva navideña: C5, D5, E5, G5, A5, C6, D6, E6
    const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const freq = freqs[Math.min(step, freqs.length - 1)];
    this.playTone(freq, 0.35, "sine", 0.32);
    // Armónico campana brillante
    setTimeout(() => this.playTone(freq * 2, 0.25, "triangle", 0.15), 35);
  }

  private handleKeyDownBound = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowDown") {
      e.preventDefault();
      this.handlePlayerDrop();
    }
  };

  protected onStart(): void {
    this.lives = this.maxLives;
    this.stackedBoxes = [];
    this.fallingSlices = [];
    this.activeDroppingBox = null;
    this.nextBoxId = 1;
    this.boxSpawnCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.feverTimer = 0;
    this.isFeverActive = false;
    this.swingTime = 0;
    this.swingAngle = 0;
    this.towerSwayPhase = 0;
    this.towerSwayAmount = 0;
    this.maxAltitudeMeters = 0;

    // Ajuste responsivo de la base
    this.basePlatformWidth = Math.min(300, Math.max(220, this.width * 0.45));
    this.basePlatformY = this.height - 130;
    this.currentBoxWidth = this.basePlatformWidth * 0.88;

    // Cámara centrada al suelo
    this.cameraY = 0;
    this.targetCameraY = 0;

    this.prepareNextCraneBox();

    // Eventos táctiles y de teclado
    this.input.onPointerDown = (_pointerId: number, _x: number, _y: number) => {
      this.handlePlayerDrop();
    };

    window.addEventListener("keydown", this.handleKeyDownBound);
  }

  public resize(width: number, height: number): void {
    super.resize(width, height);
    this.basePlatformWidth = Math.min(300, Math.max(220, this.width * 0.45));
    this.basePlatformY = this.height - 130;
  }

  private prepareNextCraneBox(): void {
    this.isSwinging = true;
    this.boxSpawnCount++;

    // ¿Es caja de patrocinador? (Cada 6 cajas)
    if (this.boxSpawnCount > 1 && this.boxSpawnCount % 6 === 0) {
      this.nextIsSponsor = true;
      const sponsors = BRANDING.getAllSponsors();
      const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
      this.nextSponsorId = sponsor.id;
      this.nextSponsorName = sponsor.shortName;
      this.currentBoxTheme = {
        type: "sponsor",
        primaryColor: sponsor.themeColor || "#FFB300",
        secondaryColor: "#1A237E",
        ribbonColor: "#FFD700",
        glowColor: "rgba(255, 215, 0, 0.75)",
        patternType: "stars"
      };
    } else {
      this.nextIsSponsor = false;
      this.nextSponsorId = undefined;
      this.nextSponsorName = undefined;
      // Elegir paleta festiva secuencial o aleatoria sin repetir
      const themeIdx = this.boxSpawnCount % THEME_PALETTES.length;
      this.currentBoxTheme = THEME_PALETTES[themeIdx];
    }

    // Aumentar ligeramente la velocidad del péndulo conforme crece la torre
    const speedBonus = Math.min(1.2, this.stackedBoxes.length * 0.04);
    this.swingSpeed = 2.4 + speedBonus;
  }

  private handlePlayerDrop(): void {
    if (!this.isRunning || this.isGameOver || this.isFinishing) return;
    if (!this.isSwinging || this.activeDroppingBox !== null) return;

    // Calcular posición actual de la caja en el péndulo
    const craneAnchorX = this.width / 2;
    const craneAnchorY = this.cameraY + 95;
    const hookX = craneAnchorX + Math.sin(this.swingAngle) * this.ropeLength;
    const hookY = craneAnchorY + Math.cos(this.swingAngle) * this.ropeLength;

    // Velocidad tangencial al soltar (inercia horizontal)
    const tangentialVel = Math.cos(this.swingAngle) * this.swingSpeed * this.ropeLength * 0.65;

    this.activeDroppingBox = {
      x: hookX,
      y: hookY,
      width: this.currentBoxWidth,
      height: this.defaultBoxHeight,
      theme: this.currentBoxTheme,
      vx: tangentialVel,
      vy: 120, // Empuje inicial suave hacia abajo
      rotation: this.swingAngle * 0.45,
      isSponsor: this.nextIsSponsor,
      sponsorId: this.nextSponsorId,
      sponsorName: this.nextSponsorName
    };

    this.isSwinging = false;
    this.audio.playWhoosh();
    Haptics.light();
  }

  protected onUpdate(dt: number): void {
    // 1. Actualizar oscilación del Péndulo
    if (this.isSwinging) {
      this.swingTime += dt * this.swingSpeed;
      this.swingAngle = Math.sin(this.swingTime) * this.swingAmplitude;
    }

    // 2. Actualizar Modo Fiebre
    if (this.isFeverActive) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.isFeverActive = false;
        this.feverTimer = 0;
      }
    }

    // 3. Actualizar balanceo elástico de la torre
    this.towerSwayPhase += dt * 2.8;
    this.towerSwayAmount = Math.max(0, this.towerSwayAmount - dt * 0.5);

    // 4. Actualizar Caja que está Cayendo
    if (this.activeDroppingBox) {
      const box = this.activeDroppingBox;
      box.vy += 1650 * dt; // Gravedad
      box.y += box.vy * dt;
      box.x += box.vx * dt;
      box.rotation *= 0.94; // Enderezar gradualmente

      // Determinar la superficie de impacto
      let targetY: number;
      let topBoxWidth: number;
      let topBoxCenterX: number;

      if (this.stackedBoxes.length === 0) {
        targetY = this.basePlatformY - box.height;
        topBoxWidth = this.basePlatformWidth;
        topBoxCenterX = this.width / 2;
      } else {
        const topBox = this.stackedBoxes[this.stackedBoxes.length - 1];
        targetY = topBox.y - box.height;
        topBoxWidth = topBox.width;
        topBoxCenterX = topBox.x;
      }

      // Si ha alcanzado la altura de impacto
      if (box.y >= targetY) {
        this.handleBoxLanding(box, targetY, topBoxCenterX, topBoxWidth);
      }
    }

    // 5. Actualizar Rebanadas / Trozos que caen al abismo
    for (let i = this.fallingSlices.length - 1; i >= 0; i--) {
      const slice = this.fallingSlices[i];
      slice.vy += 1500 * dt;
      slice.y += slice.vy * dt;
      slice.x += slice.vx * dt;
      slice.rotation += slice.vRot * dt;
      slice.alpha -= dt * 0.7;

      if (slice.alpha <= 0 || slice.y > this.basePlatformY + 400) {
        this.fallingSlices.splice(i, 1);
      }
    }

    // 6. Actualizar animación de aplastamiento (settle) en cajas colocadas
    for (const b of this.stackedBoxes) {
      if (b.settleProgress > 0) {
        b.settleProgress -= dt * 4.5;
        if (b.settleProgress < 0) b.settleProgress = 0;
      }
      if (Math.abs(b.wobbleX) > 0.1) {
        b.wobbleX *= 0.88;
      } else {
        b.wobbleX = 0;
      }
    }

    // 7. Seguimiento suave de la cámara hacia la cima de la torre
    if (this.stackedBoxes.length > 0) {
      const highestY = this.stackedBoxes[this.stackedBoxes.length - 1].y;
      // Mantener la cima de la torre aproximadamente al 55% de la pantalla
      const desiredScreenTop = this.height * 0.58;
      this.targetCameraY = Math.max(0, this.basePlatformY - highestY - desiredScreenTop + 100);
    } else {
      this.targetCameraY = 0;
    }

    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1.0, dt * 5.0);

    // Calcular altitud en metros
    const currentMeters = Math.max(0, Math.round(this.stackedBoxes.length * 2.2));
    if (currentMeters > this.maxAltitudeMeters) {
      this.maxAltitudeMeters = currentMeters;
    }
  }

  private handleBoxLanding(
    box: DroppingBox,
    targetY: number,
    topBoxCenterX: number,
    topBoxWidth: number
  ): void {
    const deltaX = box.x - topBoxCenterX;
    const maxAllowedDist = (box.width + topBoxWidth) / 2;

    // CASO 1: FALLO COMPLETO (Se cae fuera de la torre)
    if (Math.abs(deltaX) >= maxAllowedDist - 6) {
      this.activeDroppingBox = null;
      this.lives--;
      this.combo = 0;
      this.isFeverActive = false;
      this.triggerShake(9, 0.35);
      this.audio.playError();
      Haptics.impact();

      // Salpicadura de nieve
      this.particles.emitBurst(box.x, targetY, "#E0F7FA", 16);
      this.addFloatingText("¡SE CAYÓ! -1 VIDA", box.x, targetY - 20, "#FF2A4D", 1.3);

      if (this.lives <= 0) {
        this.timeRemaining = 0; // Provoca fin de partida
      } else {
        // Nueva caja
        setTimeout(() => this.prepareNextCraneBox(), 300);
      }
      return;
    }

    // CASO 2: IMPACTO EXITOSO (Se apila)
    const perfectThreshold = 9; // Margen de perfección en píxeles
    const isPerfect = Math.abs(deltaX) <= perfectThreshold;

    let finalCenterX: number;
    let finalWidth: number;

    if (isPerfect) {
      // ¡PERFECTO! Centrado exacto y sin recorte
      finalCenterX = topBoxCenterX;
      finalWidth = box.width;
      this.combo++;
      this.perfectCount++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      // Sonido melódico de campana en escala ascendente
      this.playChimeScale(this.combo);
      Haptics.light();

      const mult = this.isFeverActive ? 2.5 : 1.0 + Math.min(1.5, this.combo * 0.2);
      const points = Math.round(300 * mult);
      this.addScore(points);

      this.addFloatingText(`¡PERFECTO! +${points}`, finalCenterX, targetY - 30, "#FFD700", 1.4);
      this.particles.emitBurst(finalCenterX, targetY, "#FFD700", 22);

      // Fiebre Navideña tras 3 perfectos consecutivos
      if (this.combo >= 3 && !this.isFeverActive) {
        this.isFeverActive = true;
        this.feverTimer = 8.0;
        this.audio.playPowerUp();
        this.addFloatingText("¡FIEBRE NAVIDEÑA x2!", this.width / 2, this.height * 0.35, "#FF4081", 1.6);
        this.particles.emitConfetti(this.width, 35);
      }

      // Recompensa de expansión: si la caja se había hecho estrecha, recupera un poco de ancho
      if (this.combo % 3 === 0 && this.currentBoxWidth < this.basePlatformWidth * 0.85) {
        this.currentBoxWidth = Math.min(this.basePlatformWidth * 0.85, this.currentBoxWidth + 18);
        this.addFloatingText("¡EXPANSIÓN MÁGICA!", finalCenterX, targetY - 60, "#00E5FF", 1.25);
      }
    } else {
      // Buen toque con recorte de rebanada sobrante (Slicing)
      const overhang = Math.abs(deltaX);
      finalWidth = Math.max(38, box.width - overhang);
      finalCenterX = topBoxCenterX + (deltaX > 0 ? (box.width - finalWidth) / 2 : -(box.width - finalWidth) / 2);

      // Trozo que cae al vacío
      const sliceWidth = overhang;
      const sliceX = deltaX > 0
        ? finalCenterX + finalWidth / 2 + sliceWidth / 2
        : finalCenterX - finalWidth / 2 - sliceWidth / 2;

      this.fallingSlices.push({
        x: sliceX,
        y: targetY,
        width: sliceWidth,
        height: box.height,
        theme: box.theme,
        vx: deltaX > 0 ? 80 : -80,
        vy: -60,
        rotation: 0,
        vRot: deltaX > 0 ? 3.5 : -3.5,
        alpha: 1.0
      });

      this.currentBoxWidth = finalWidth;
      this.combo = 0;
      this.audio.playTap();
      Haptics.light();

      const points = 100;
      this.addScore(points);
      this.addFloatingText(`¡BIEN! +${points}`, finalCenterX, targetY - 25, "#FFFFFF", 1.15);
      this.particles.emitBurst(finalCenterX, targetY, "#FFFFFF", 10);

      // Añadir balanceo a la torre
      this.towerSwayAmount = Math.min(1.0, this.towerSwayAmount + 0.35);
    }

    // BONIFICACIÓN SI ES CAJA DE PATROCINADOR OFICIAL
    if (box.isSponsor && box.sponsorId) {
      const sponsorBonus = 500;
      this.addScore(sponsorBonus);
      this.audio.playPowerUp();
      this.addFloatingText(
        `¡REGALO ${box.sponsorName || "OFICIAL"}! +${sponsorBonus}`,
        finalCenterX,
        targetY - 50,
        "#00E676",
        1.5
      );
      this.particles.emitBurst(finalCenterX, targetY, "#00E676", 30);
      // Restablecer ancho completo de la siguiente caja como superpoder
      this.currentBoxWidth = this.basePlatformWidth * 0.88;
    }

    // Registrar en la pila
    const stackedBox: StackedBox = {
      id: this.nextBoxId++,
      x: finalCenterX,
      y: targetY,
      width: finalWidth,
      height: box.height,
      theme: box.theme,
      isPerfect,
      sponsorId: box.sponsorId,
      sponsorName: box.sponsorName,
      settleProgress: 1.0,
      wobbleX: (deltaX / (box.width || 1)) * 12
    };

    this.stackedBoxes.push(stackedBox);
    this.activeDroppingBox = null;

    // Próxima caja en la grúa
    setTimeout(() => this.prepareNextCraneBox(), 220);
  }

  // ==========================================================================
  // RENDERIZADO VISUAL PRO: Stylized 2D Game Concept Art
  // ==========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo Dinámico según Altitud (Parallax Sky & Atmosphere)
    this.drawDynamicSky(ctx);

    // 2. Dibujar Elementos del Mundo con Transformación de Cámara
    ctx.save();
    ctx.translate(0, this.cameraY);

    // Escenografía de fondo en el suelo (Pinos, Casas nevadas y Faroles)
    this.drawGroundScenery(ctx);

    // Rebanadas de regalo que caen
    this.drawFallingSlices(ctx);

    // Base / Pedestal de la Torre
    this.drawBasePedestal(ctx);

    // Cajas apiladas
    this.drawStackedBoxes(ctx);

    // Caja en caída libre
    if (this.activeDroppingBox) {
      this.drawBoxObject(
        ctx,
        this.activeDroppingBox.x,
        this.activeDroppingBox.y,
        this.activeDroppingBox.width,
        this.activeDroppingBox.height,
        this.activeDroppingBox.theme,
        this.activeDroppingBox.rotation,
        1.0,
        this.activeDroppingBox.isSponsor,
        this.activeDroppingBox.sponsorId
      );
    }

    // Grúa / Péndulo oscilante
    this.drawCrane(ctx);

    ctx.restore();

    // 3. Sistema de Partículas
    this.particles.draw(ctx);

    // 4. HUD Exclusivo de la Torre (Metros, Vidas, Fiebre, Combo)
    this.drawCustomHUD(ctx);
  }

  private drawDynamicSky(ctx: CanvasRenderingContext2D): void {
    const altitude = this.maxAltitudeMeters;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);

    if (altitude < 25) {
      // Nivel 1: Atardecer/Noche de Villa Navideña
      grad.addColorStop(0, "#0B132B");
      grad.addColorStop(0.5, "#1C2541");
      grad.addColorStop(1, "#3A506B");
    } else if (altitude < 55) {
      // Nivel 2: Nubes de Algodón y Viento
      grad.addColorStop(0, "#080E21");
      grad.addColorStop(0.5, "#152238");
      grad.addColorStop(1, "#283E58");
    } else if (altitude < 90) {
      // Nivel 3: Cielo de Aurora Boreal
      grad.addColorStop(0, "#050814");
      grad.addColorStop(0.35, "#0A2540");
      grad.addColorStop(0.7, "#004D40");
      grad.addColorStop(1, "#00695C");
    } else {
      // Nivel 4: Reino Celestial de Santa (Espacio Estelar & Luna Gigante)
      grad.addColorStop(0, "#02030A");
      grad.addColorStop(0.5, "#080B1E");
      grad.addColorStop(1, "#1A1A3A");
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Dibujar Aurora Boreal si la altitud es media-alta
    if (altitude >= 40) {
      const auroraAlpha = Math.min(0.45, (altitude - 40) / 45);
      ctx.save();
      ctx.globalAlpha = auroraAlpha;
      const t = performance.now() * 0.001;
      const waveGrad = ctx.createLinearGradient(0, 0, this.width, this.height * 0.4);
      waveGrad.addColorStop(0, "rgba(0, 229, 255, 0.4)");
      waveGrad.addColorStop(0.5, "rgba(0, 230, 118, 0.6)");
      waveGrad.addColorStop(1, "rgba(213, 0, 249, 0.3)");

      ctx.fillStyle = waveGrad;
      ctx.beginPath();
      ctx.moveTo(0, this.height * 0.2);
      for (let x = 0; x <= this.width; x += 40) {
        const y = this.height * 0.22 + Math.sin(x * 0.008 + t) * 35 + Math.cos(x * 0.015 - t * 0.8) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Dibujar Luna Mágica en grandes altitudes
    if (altitude >= 70) {
      const moonAlpha = Math.min(1.0, (altitude - 70) / 20);
      ctx.save();
      ctx.globalAlpha = moonAlpha;
      const moonX = this.width * 0.82;
      const moonY = this.height * 0.18;
      // Resplandor
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 90);
      moonGlow.addColorStop(0, "rgba(255, 249, 196, 0.8)");
      moonGlow.addColorStop(0.5, "rgba(255, 236, 179, 0.3)");
      moonGlow.addColorStop(1, "transparent");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 90, 0, Math.PI * 2);
      ctx.fill();

      // Luna creciente dorada
      ctx.fillStyle = "#FFF9C4";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(moonX - 12, moonY - 6, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawGroundScenery(ctx: CanvasRenderingContext2D): void {
    const baseY = this.basePlatformY;
    // Suelo nevado con montículos suaves
    ctx.fillStyle = "#E0F7FA";
    ctx.beginPath();
    ctx.moveTo(0, baseY + 60);
    ctx.quadraticCurveTo(this.width * 0.25, baseY + 45, this.width * 0.5, baseY + 55);
    ctx.quadraticCurveTo(this.width * 0.75, baseY + 65, this.width, baseY + 50);
    ctx.lineTo(this.width, baseY + 300);
    ctx.lineTo(0, baseY + 300);
    ctx.closePath();
    ctx.fill();

    // Siluetas de pinos navideños a los lados
    this.drawPineSilhouette(ctx, 40, baseY + 50, 70, 140);
    this.drawPineSilhouette(ctx, 110, baseY + 55, 55, 110);
    this.drawPineSilhouette(ctx, this.width - 50, baseY + 50, 70, 140);
    this.drawPineSilhouette(ctx, this.width - 120, baseY + 55, 55, 110);
  }

  private drawPineSilhouette(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.save();
    ctx.fillStyle = "#0A2F1D";
    ctx.beginPath();
    // 3 Niveles de ramas triangulares
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w * 0.35, y - h * 0.65);
    ctx.lineTo(x + w * 0.22, y - h * 0.65);
    ctx.lineTo(x + w * 0.45, y - h * 0.35);
    ctx.lineTo(x + w * 0.28, y - h * 0.35);
    ctx.lineTo(x + w * 0.55, y);
    ctx.lineTo(x - w * 0.55, y);
    ctx.lineTo(x - w * 0.28, y - h * 0.35);
    ctx.lineTo(x - w * 0.45, y - h * 0.35);
    ctx.lineTo(x - w * 0.22, y - h * 0.65);
    ctx.lineTo(x - w * 0.35, y - h * 0.65);
    ctx.closePath();
    ctx.fill();

    // Nieve en la punta
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w * 0.2, y - h * 0.75);
    ctx.lineTo(x - w * 0.2, y - h * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawBasePedestal(ctx: CanvasRenderingContext2D): void {
    const x = this.width / 2;
    const y = this.basePlatformY;
    const w = this.basePlatformWidth;
    const h = this.basePlatformHeight;

    ctx.save();
    // Sombra del pedestal
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.7, w * 0.55, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bloque de madera festiva tallada (Cuerpo del pedestal)
    const woodGrad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
    woodGrad.addColorStop(0, "#4E2608");
    woodGrad.addColorStop(0.15, "#8D4925");
    woodGrad.addColorStop(0.5, "#A0522D");
    woodGrad.addColorStop(0.85, "#8D4925");
    woodGrad.addColorStop(1, "#4E2608");

    ctx.fillStyle = woodGrad;
    this.roundRect(ctx, x - w / 2, y, w, h, 14);
    ctx.fill();

    // Moldura dorada decorativa
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    this.roundRect(ctx, x - w / 2 + 5, y + 5, w - 10, h - 10, 10);
    ctx.stroke();

    // Cojín de nieve gruesa superior sobre el que descansan los regalos
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 8, y + 4);
    ctx.quadraticCurveTo(x - w * 0.25, y - 10, x, y - 8);
    ctx.quadraticCurveTo(x + w * 0.25, y - 10, x + w / 2 + 8, y + 4);
    ctx.quadraticCurveTo(x + w * 0.25, y + 14, x, y + 12);
    ctx.quadraticCurveTo(x - w * 0.25, y + 14, x - w / 2 - 8, y + 4);
    ctx.closePath();
    ctx.fill();

    // Placa dorada "FERIA MÁGICA"
    ctx.fillStyle = "#FFD700";
    ctx.font = "900 13px 'Fredoka', 'Cinzel', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★ FERIA MÁGICA DEL JUGUETE ★", x, y + h * 0.52);

    ctx.restore();
  }

  private drawStackedBoxes(ctx: CanvasRenderingContext2D): void {
    const totalBoxes = this.stackedBoxes.length;

    for (let i = 0; i < totalBoxes; i++) {
      const box = this.stackedBoxes[i];
      // Altura relativa en la torre para aplicar balanceo acumulativo
      const heightFactor = i / Math.max(1, totalBoxes);
      const swayOffset = Math.sin(this.towerSwayPhase + i * 0.18) * (this.towerSwayAmount * 18 * heightFactor);

      // Efecto squash & stretch en impacto
      const squash = box.settleProgress > 0 ? Math.sin(box.settleProgress * Math.PI) * 0.12 : 0;
      const renderW = box.width * (1.0 + squash);
      const renderH = box.height * (1.0 - squash);
      const renderY = box.y + (box.height - renderH);

      this.drawBoxObject(
        ctx,
        box.x + box.wobbleX + swayOffset,
        renderY,
        renderW,
        renderH,
        box.theme,
        0,
        1.0,
        box.theme.type === "sponsor",
        box.sponsorId
      );
    }
  }

  private drawFallingSlices(ctx: CanvasRenderingContext2D): void {
    for (const slice of this.fallingSlices) {
      ctx.save();
      ctx.globalAlpha = slice.alpha;
      this.drawBoxObject(
        ctx,
        slice.x,
        slice.y,
        slice.width,
        slice.height,
        slice.theme,
        slice.rotation,
        slice.alpha
      );
      ctx.restore();
    }
  }

  private drawBoxObject(
    ctx: CanvasRenderingContext2D,
    cx: number,
    topY: number,
    w: number,
    h: number,
    theme: BoxTheme,
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

    // Resplandor si está en modo Fiebre o es caja dorada/patrocinador
    if (this.isFeverActive || theme.type === "gold" || isSponsor) {
      ctx.shadowColor = theme.glowColor;
      ctx.shadowBlur = 18;
    }

    // 1. Cuerpo principal del regalo con degradado tridimensional
    const bodyGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    bodyGrad.addColorStop(0, theme.primaryColor);
    bodyGrad.addColorStop(1, theme.secondaryColor);

    ctx.fillStyle = bodyGrad;
    this.roundRect(ctx, -halfW, -halfH, w, h, 8);
    ctx.fill();

    // 2. Patrones decorativos festivos
    ctx.save();
    ctx.clip(); // Limitar patrones dentro de la caja
    this.drawBoxPatterns(ctx, halfW, halfH, theme.patternType);
    ctx.restore();

    // 3. Cinta satinada vertical
    const ribbonW = Math.min(22, w * 0.22);
    ctx.fillStyle = theme.ribbonColor;
    ctx.fillRect(-ribbonW / 2, -halfH, ribbonW, h);

    // 4. Cinta satinada horizontal
    const ribbonH = Math.min(14, h * 0.28);
    ctx.fillRect(-halfW, -ribbonH / 2, w, ribbonH);

    // Borde brillante de las cintas
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-ribbonW / 2, -halfH, ribbonW, h);
    ctx.strokeRect(-halfW, -ribbonH / 2, w, ribbonH);

    // 5. Borde / Outlines estilizados
    ctx.shadowBlur = 0; // Desactivar sombra para bordes limpios
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, -halfW, -halfH, w, h, 8);
    ctx.stroke();

    // 6. Si es caja de Patrocinador Oficial → Dibujar insignia/placa
    if (isSponsor && sponsorId) {
      this.drawSponsorBadgeOnBox(ctx, sponsorId, halfW, halfH);
    } else {
      // Moño dorado o festivo en la intersección central
      this.drawRibbonBow(ctx, 0, 0, ribbonW, theme.ribbonColor);
    }

    ctx.restore();
  }

  private drawBoxPatterns(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    pattern: BoxTheme["patternType"]
  ): void {
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";

    if (pattern === "stripes") {
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      for (let x = -halfW * 2; x < halfW * 2; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, -halfH);
        ctx.lineTo(x + halfH * 2, halfH);
        ctx.stroke();
      }
    } else if (pattern === "snowflakes" || pattern === "stars") {
      // Estrellitas flotantes en la textura
      const step = 28;
      for (let x = -halfW + 12; x < halfW; x += step) {
        for (let y = -halfH + 12; y < halfH; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === "dots") {
      for (let x = -halfW + 10; x < halfW; x += 18) {
        ctx.beginPath();
        ctx.arc(x, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawRibbonBow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    // Lazo izquierdo
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.5, cy, size * 0.45, size * 0.32, -0.25, 0, Math.PI * 2);
    ctx.fill();
    // Lazo derecho
    ctx.beginPath();
    ctx.ellipse(cx + size * 0.5, cy, size * 0.45, size * 0.32, 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Nudo central
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Brillo central
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSponsorBadgeOnBox(
    ctx: CanvasRenderingContext2D,
    sponsorId: string,
    halfW: number,
    halfH: number
  ): void {
    const badgeW = Math.min(100, halfW * 1.5);
    const badgeH = Math.min(36, halfH * 1.4);

    // Fondo madera pulida para el letrero del patrocinador
    ctx.fillStyle = "#FFF9C4";
    this.roundRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 6);
    ctx.fill();

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 6);
    ctx.stroke();

    const sponsorImg = this.getSponsorImage(sponsorId);
    if (sponsorImg && sponsorImg.complete && sponsorImg.naturalWidth > 0) {
      const imgAspect = sponsorImg.naturalWidth / sponsorImg.naturalHeight;
      const targetH = badgeH - 6;
      const targetW = Math.min(badgeW - 8, targetH * imgAspect);
      ctx.drawImage(sponsorImg, -targetW / 2, -targetH / 2, targetW, targetH);
    } else {
      ctx.fillStyle = "#1A237E";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sponsorId.toUpperCase(), 0, 0);
    }
  }

  private drawCrane(ctx: CanvasRenderingContext2D): void {
    const anchorX = this.width / 2;
    const anchorY = this.cameraY + 80;

    // Resplandor de la estrella ancla superior
    ctx.save();
    ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
    ctx.shadowBlur = 18;

    // Estrella dorada anclada al cielo
    ctx.fillStyle = "#FFD700";
    this.drawStar(ctx, anchorX, anchorY, 5, 20, 9);
    ctx.fill();

    // Núcleo blanco brillante
    ctx.fillStyle = "#FFFFFF";
    this.drawStar(ctx, anchorX, anchorY, 5, 8, 4);
    ctx.fill();
    ctx.restore();

    // Si la grúa tiene la caja colgando
    if (this.isSwinging) {
      const hookX = anchorX + Math.sin(this.swingAngle) * this.ropeLength;
      const hookY = anchorY + Math.cos(this.swingAngle) * this.ropeLength;

      // Cuerda trenzada festiva dorada y roja
      ctx.save();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      // Gancho de estrella dorada
      ctx.fillStyle = "#FFA000";
      ctx.beginPath();
      ctx.arc(hookX, hookY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Dibujar la caja balanceándose en el gancho
      this.drawBoxObject(
        ctx,
        hookX,
        hookY,
        this.currentBoxWidth,
        this.defaultBoxHeight,
        this.currentBoxTheme,
        this.swingAngle * 0.45,
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

  // ==========================================================================
  // HUD ESPECIALIZADO: ALTURA (M), VIDAS, COMBO Y FIEBRE
  // ==========================================================================

  private drawCustomHUD(ctx: CanvasRenderingContext2D): void {
    const pad = 16;
    const topY = 18;

    // 1. Contador de Altitud (Izquierda: Torre en Metros)
    const altitude = this.maxAltitudeMeters;
    ctx.save();
    ctx.fillStyle = "rgba(10, 20, 45, 0.75)";
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

    // 2. Vidas (Corazones Navideños - Centro / Derecha)
    const heartX = this.width - pad - 120;
    ctx.fillStyle = "rgba(10, 20, 45, 0.75)";
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

    // 3. Indicador de Racha / Combo si está activo
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

    // 4. Banner de Fiebre Navideña si está activo
    if (this.isFeverActive) {
      const feverY = topY + 58;
      ctx.fillStyle = "rgba(255, 64, 129, 0.85)";
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

    // 5. Botón / Indicación de Control Táctil en la parte inferior si es el inicio
    if (this.stackedBoxes.length === 0 && !this.activeDroppingBox) {
      const hintY = this.height - 40;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
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

    // Puntos extra por altura final lograda
    const heightBonus = this.maxAltitudeMeters * 60;
    this.score += heightBonus;

    // Calcular rango
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
        rankLabel: `Torre de ${this.maxAltitudeMeters}m (${this.stackedBoxes.length} pisos)`,
        rankColor,
        maxCombo: this.maxCombo,
        perfectCount: this.perfectCount,
        accuracy: this.stackedBoxes.length > 0 ? Math.round((this.perfectCount / this.stackedBoxes.length) * 100) : 100
      });
    }
  }
}
