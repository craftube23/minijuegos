/**
 * ==============================================================================
 * JUEGO: ¡TORRE DE REGALOS MÁGICA! (Magical Holiday Gift Tower - Deluxe Edition)
 * ==============================================================================
 *
 * Apilador arcade de alta fidelidad estilo Tower Bloxx / Icy Tower / Stacker:
 * - Estética Stylized 2D Game Art / Fantasy Game Concept Art (Supercell / Disney Klaus).
 * - Grúa mecánica navideña con carro de vapor y engranajes dorados (grua-carro-navideno.png).
 * - Garra mecánica festiva articulada con apertura elástica (garra-gancho-navideno.png).
 * - Mecánica clásica de Stacker con rebanado físico de sobrantes (overhang slicing):
 *     * ¡Alineación Perfecta (<= 4px)! Destello magnético, notas musicales en escala
 *       y expansión restauradora de la base.
 *     * Rebanado: El exceso que desborde se corta en tiempo real y cae al abismo rotando.
 *     * Caída al vacío: Si el paquete no toca la torre, se precipita y cuesta 1 vida.
 * - Fiebre Navideña (Fever Mode): 3 alineaciones perfectas consecutivas activan
 *     puntos dobles (x2), lluvia de chispas doradas y guirnaldas resplandecientes.
 * - Variedad de regalos temáticos:
 *     * Cajas clásicas: Rojo Carmesí, Verde Pino, Azul Boreal.
 *     * Regalo Dorado de Patrocinador (cada 5 pisos): +500 pts y expansión masiva de la torre.
 *     * Regalo Joyero Real (regalo-estilizado-morado.png): +750 pts y fuegos artificiales.
 *     * Caja Reloj Mágico: Restaura +1 Vida o +10s de tiempo.
 * - Balanceo y física pendular de la torre según el centro de masas.
 * - Hitos de altura con banners celebratorios y fanfarria cada 5 pisos.
 * - Sin emojis en canvas, HUD o código.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import { drawNightSky, drawPill, drawSponsorMedallion, imgReady, makeSkyStars, roundRectPath } from "./shared/gameDraw";
import type { SkyStar } from "./shared/gameDraw";

interface TowerBlock {
  cx: number;
  width: number;
  bottom: number; // Y de mundo de la base de la caja
  kind: number; // 0: rojo, 1: verde, 2: azul, 3: dorado, 4: morado real, 5: reloj
  gold: boolean;
  royal: boolean;
  clock: boolean;
  logo?: HTMLImageElement;
  sponsorName?: string;
  squash: number;
  perfect: boolean;
  swayFactor: number;
}

interface DroppingBlock {
  cx: number;
  width: number;
  bottom: number;
  vy: number;
  kind: number;
  gold: boolean;
  royal: boolean;
  clock: boolean;
  logo?: HTMLImageElement;
  sponsor?: string;
}

interface SlicedPiece {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  kind: number;
  alpha: number;
}

interface FallingBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  kind: number;
  gold: boolean;
}

interface MilestoneBanner {
  title: string;
  subtitle: string;
  timer: number;
  maxTimer: number;
}

export class GiftTowerGame extends BaseGame {
  // Recursos visuales
  private bgImage: HTMLImageElement;
  private spritePedestal: HTMLImageElement;
  private spriteTrolley: HTMLImageElement;
  private spriteClaw: HTMLImageElement;
  private boxSprites: HTMLImageElement[] = [];
  private spriteClock: HTMLImageElement;
  private sponsors: { name: string; logo: HTMLImageElement }[] = [];
  private stars: SkyStar[] = makeSkyStars(90);

  // Entidades del mundo
  private blocks: TowerBlock[] = [];
  private falling: FallingBlock[] = [];
  private slices: SlicedPiece[] = [];
  private dropping: DroppingBlock | null = null;
  private activeBanner: MilestoneBanner | null = null;

  // Geometría y dimensiones
  private initialBw = 120; // ancho inicial de caja
  private currentBw = 120; // ancho activo actual
  private minAllowedBw = 36; // límite mínimo de ancho
  private groundY = 0; // superficie del pedestal (mundo)
  private towerTopY = 0; // Y de mundo de apoyo
  private cameraY = 0;

  // Grúa pendular y oscilación
  private swingT = 0;
  private swingSpeed = 1.45;
  private clawOpenTimer = 0;

  // Próximo paquete
  private nextKind = 0;
  private nextGold = false;
  private nextRoyal = false;
  private nextClock = false;
  private nextSponsor: { name: string; logo: HTMLImageElement } | null = null;

  // Racha y modos especiales
  private combo = 0;
  private isFeverMode = false;
  private feverTimer = 0;
  private locked = false;
  private animClock = 0;

  constructor(canvas: HTMLCanvasElement, input: InputManager, audio: AudioManager, particles: ParticleSystem) {
    super(
      "gift-tower",
      "¡Torre de Regalos Mágica!",
      "¡Toca para soltar cada paquete y apílalos con precisión milimétrica hacia las estrellas!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/We Wish You a Merry Christmas.mp3";
    this.inGameMusicVolume = 0.45;

    // Carga de fondos y sprites Stylized 2D Game Concept Art
    this.bgImage = this.getImage("./assets/images/fondo-nieve.webp");
    this.spritePedestal = this.getImage("./assets/images/pedestal-torre-regalos.png");
    this.spriteTrolley = this.getImage("./assets/images/grua-carro-navideno.png");
    this.spriteClaw = this.getImage("./assets/images/garra-gancho-navideno.png");
    this.spriteClock = this.getImage("./assets/images/reloj-magico-tiempo.png");

    this.boxSprites = [
      this.getImage("./assets/images/regalo-estilizado-rojo.png"),
      this.getImage("./assets/images/regalo-estilizado-verde.png"),
      this.getImage("./assets/images/regalo-estilizado-azul.png"),
      this.getImage("./assets/images/regalo-estilizado-dorado.png"),
      this.getImage("./assets/images/regalo-estilizado-morado.png")
    ];

    this.sponsors = [
      { name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.webp") },
      { name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.webp") },
      { name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.webp") },
      { name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.webp") }
    ];
  }

  // ==========================================================================
  // GEOMETRÍA
  // ==========================================================================
  private get boxH(): number {
    return this.initialBw * 1.15;
  }

  private get step(): number {
    return this.boxH * 0.72;
  }

  private get swingAmp(): number {
    return Math.max(20, this.width * 0.5 - this.currentBw * 0.65);
  }

  private computeLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;
    this.initialBw = Math.max(86, Math.min(136, Math.round(Math.min(w * 0.22, h * 0.19))));
    this.minAllowedBw = Math.round(this.initialBw * 0.28);
    this.groundY = h * 0.84;
  }

  // ==========================================================================
  // CICLO DE VIDA
  // ==========================================================================
  protected onStart(): void {
    this.computeLayout();
    this.score = 0;
    this.combo = 0;
    this.isFeverMode = false;
    this.feverTimer = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;
    this.locked = false;
    this.blocks = [];
    this.falling = [];
    this.slices = [];
    this.dropping = null;
    this.activeBanner = null;
    this.cameraY = 0;
    this.swingT = 0;
    this.swingSpeed = 1.45;
    this.animClock = 0;
    this.clawOpenTimer = 0;
    this.currentBw = this.initialBw;

    // Caja base ya colocada sobre el pedestal festivo
    const baseCx = this.width / 2;
    this.blocks.push({
      cx: baseCx,
      width: this.initialBw,
      bottom: this.groundY + 4,
      kind: 0,
      gold: false,
      royal: false,
      clock: false,
      squash: 0,
      perfect: true,
      swayFactor: 0
    });
    this.towerTopY = this.groundY + 4 - this.step;
    this.prepareNext();

    // Controles táctiles y de teclado
    this.input.onTap = () => this.dropBlock();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keydown", this.handleKeyDown);

    this.addFloatingText("¡TOCA PARA SOLTAR!", this.width * 0.5, this.height * 0.42, "#FFD700", 1.4);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onTap = undefined;
    window.removeEventListener("keydown", this.handleKeyDown);
    this.blocks = [];
    this.falling = [];
    this.slices = [];
    this.dropping = null;
    this.activeBanner = null;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeLayout();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.dropBlock();
    }
  };

  /**
   * Prepara el siguiente bloque y selecciona tipo especial según progresión
   */
  private prepareNext(): void {
    const floors = this.blocks.length;

    this.nextGold = floors > 0 && floors % 5 === 0;
    this.nextRoyal = !this.nextGold && (this.isFeverMode || (floors > 0 && floors % 8 === 0));
    this.nextClock = !this.nextGold && !this.nextRoyal && floors > 3 && Math.random() < 0.16;

    if (this.nextGold) {
      this.nextSponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
      this.nextKind = 3;
    } else if (this.nextRoyal) {
      this.nextSponsor = null;
      this.nextKind = 4;
    } else {
      this.nextSponsor = null;
      let k = Math.floor(Math.random() * 3);
      if (this.blocks.length && k === this.blocks[this.blocks.length - 1].kind) {
        k = (k + 1) % 3;
      }
      this.nextKind = k;
    }
  }

  private get swingCx(): number {
    return this.width / 2 + Math.sin(this.swingT) * this.swingAmp;
  }

  private get hangBottom(): number {
    return this.cameraY + this.height * 0.28;
  }

  // ==========================================================================
  // ACCIONES DE JUEGO (STACKER & TOWER BLOXX)
  // ==========================================================================
  private dropBlock(): void {
    if (!this.isRunning || this.isGameOver || this.isFinishing || this.locked || this.dropping) return;

    this.audio.playWhoosh();
    this.audio.playClawTear();
    this.clawOpenTimer = 0.35; // Abre la garra mecánicamente

    this.dropping = {
      cx: this.swingCx,
      width: this.currentBw,
      bottom: this.hangBottom,
      vy: 140,
      kind: this.nextKind,
      gold: this.nextGold,
      royal: this.nextRoyal,
      clock: this.nextClock,
      logo: this.nextSponsor?.logo,
      sponsor: this.nextSponsor?.name
    };
  }

  /**
   * Procesa el aterrizaje, corte de sobrantes o caída libre del paquete
   */
  private landBlock(d: DroppingBlock): void {
    const topBlock = this.blocks[this.blocks.length - 1];
    const dx = d.cx - topBlock.cx;
    const absDx = Math.abs(dx);
    const perfectThreshold = Math.max(4, topBlock.width * 0.05);

    // 1. ¿FALLO TOTAL? Si la caja cae completamente fuera del soporte
    if (absDx >= topBlock.width) {
      this.falling.push({
        x: d.cx,
        y: this.towerTopY,
        width: d.width,
        height: this.boxH,
        vx: Math.sign(dx || 1) * (140 + Math.random() * 40),
        vy: -140,
        rot: 0,
        vr: Math.sign(dx || 1) * (3.5 + Math.random() * 2),
        kind: d.kind,
        gold: d.gold
      });
      this.dropping = null;
      this.combo = 0;
      this.isFeverMode = false;
      this.lives--;
      this.audio.playError();
      this.triggerShake(0.28, 8);
      this.addFloatingText("¡SE CAYÓ! -1 VIDA", Math.max(80, Math.min(this.width - 80, d.cx)), this.towerTopY - this.cameraY - 45, "#FF1744", 1.45);

      if (this.lives <= 0) {
        this.locked = true;
        this.setGameTimeout(() => this.endGame(), 950);
      } else {
        this.prepareNext();
      }
      return;
    }

    // 2. ¿ALINEACIÓN PERFECTA?
    const isPerfect = absDx <= perfectThreshold;
    let newCx = topBlock.cx;
    let newWidth = d.width;
    const floorNumber = this.blocks.length;

    if (isPerfect) {
      // ¡Alineación perfecta! Se centra magnéticamente
      newCx = topBlock.cx;
      this.combo++;

      // Recompensa de expansión si la caja se había estrechado
      if (this.currentBw < this.initialBw) {
        this.currentBw = Math.min(this.initialBw, this.currentBw + 6);
        newWidth = this.currentBw;
      }

      // Comprobar Fiebre Navideña
      if (this.combo >= 3) {
        this.triggerFeverMode();
      }

      // Sonido de campana en escala armónica según combo
      const noteIdx = Math.min(7, this.combo - 1);
      this.audio.playBellNote(noteIdx);
      this.particles.emitBurst(newCx, this.towerTopY, "#FFD700", 20);
      this.particles.emitBurst(newCx, this.towerTopY, "#00E5FF", 12);
      this.addFloatingText(this.combo > 1 ? `★ ¡PERFECTO x${this.combo}! ★` : "★ ¡PERFECTO! ★", newCx, this.towerTopY - this.cameraY - 42, "#FFD700", 1.55);
    } else {
      // 3. REBANADO DE SOBRANTE (OVERHANG SLICE)
      this.combo = 0;
      this.isFeverMode = false;

      // Calcular nueva porción superpuesta y trozo que se corta
      newWidth = topBlock.width - absDx;
      this.currentBw = Math.max(this.minAllowedBw, newWidth);
      newWidth = this.currentBw;

      const sliceWidth = absDx;
      newCx = topBlock.cx + (dx > 0 ? absDx * 0.5 : -absDx * 0.5);

      // Crear el trozo rebanado que cae al vacío
      const sliceCx = topBlock.cx + (dx > 0 ? topBlock.width * 0.5 + sliceWidth * 0.5 : -topBlock.width * 0.5 - sliceWidth * 0.5);
      this.slices.push({
        x: sliceCx,
        y: this.towerTopY - this.boxH * 0.45,
        width: Math.max(8, sliceWidth),
        height: this.boxH * 0.85,
        vx: (dx > 0 ? 1 : -1) * (110 + Math.random() * 50),
        vy: -90,
        rot: 0,
        vr: (dx > 0 ? 1 : -1) * (4 + Math.random() * 3),
        kind: d.kind,
        alpha: 1.0
      });

      this.audio.playCatchItem(1.0 + Math.min(0.5, floorNumber * 0.025));
      this.triggerShake(0.12, 3);
      this.particles.emitBurst(newCx, this.towerTopY, "#FFFFFF", 8);
    }

    // Si es Caja de Patrocinador Dorado: Expande la torre hacia su tamaño original
    if (d.gold) {
      this.currentBw = Math.min(this.initialBw, this.currentBw + 28);
      newWidth = this.currentBw;
    }

    // Registrar bloque en la torre
    this.blocks.push({
      cx: newCx,
      width: newWidth,
      bottom: this.towerTopY,
      kind: d.kind,
      gold: d.gold,
      royal: d.royal,
      clock: d.clock,
      logo: d.logo,
      sponsorName: d.sponsor,
      squash: 1.0,
      perfect: isPerfect,
      swayFactor: (newCx - this.width / 2) / (this.width * 0.25)
    });

    this.towerTopY -= this.step;
    this.dropping = null;

    // Cálculo de puntuación con multiplicador de Fiebre
    const multiplier = this.isFeverMode ? 2 : 1;
    let pts = (100 + floorNumber * 8) * multiplier;

    if (isPerfect) {
      pts += (120 + this.combo * 50) * multiplier;
    }

    if (d.gold) {
      pts += 500 * multiplier;
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 35);
      this.triggerShake(0.2, 5);
      this.addFloatingText(`★ ${(d.sponsor || "PATROCINADOR").toUpperCase()} +${500 * multiplier} ★`, this.width * 0.5, this.height * 0.38, "#FFD700", 1.6);
    } else if (d.royal) {
      pts += 750 * multiplier;
      this.audio.playVictory();
      this.particles.emitConfetti(this.width, 40);
      this.addFloatingText(`★ ¡JOYERO REAL! +${750 * multiplier} ★`, this.width * 0.5, this.height * 0.38, "#E040FB", 1.6);
    } else if (d.clock) {
      if (this.lives < this.maxLives) {
        this.lives++;
        this.audio.playBellNote(6);
        this.addFloatingText("¡+1 VIDA EXTRA!", newCx, this.towerTopY - this.cameraY - 45, "#00E5FF", 1.5);
      } else {
        pts += 300 * multiplier;
        this.addFloatingText(`¡TIEMPO MÁGICO! +${300 * multiplier}`, newCx, this.towerTopY - this.cameraY - 45, "#00E5FF", 1.4);
      }
      this.particles.emitBurst(newCx, this.towerTopY, "#00E5FF", 18);
    }

    this.addScore(pts);

    // Hitos cada 5 pisos (Piso 5, 10, 15, 20...)
    if (this.blocks.length > 1 && (this.blocks.length - 1) % 5 === 0) {
      this.triggerFloorMilestone(this.blocks.length - 1);
    }

    // Dificultad progresiva de balanceo
    this.swingSpeed = Math.min(3.8, 1.45 + (this.blocks.length - 1) * 0.065);
    this.prepareNext();
  }

  /**
   * Activa el modo Fiebre Navideña (Fever Mode)
   */
  private triggerFeverMode(): void {
    this.isFeverMode = true;
    this.feverTimer = 8.0;
    this.audio.playPowerUp();
    this.triggerShake(0.2, 5);
    this.particles.emitConfetti(this.width, 30);
    this.addFloatingText("★ ¡FIEBRE NAVIDEÑA (PUNTOS x2)! ★", this.width * 0.5, this.height * 0.32, "#FFD700", 1.65);
  }

  /**
   * Muestra un banner festivo al completar hitos de pisos
   */
  private triggerFloorMilestone(floors: number): void {
    const bonus = floors * 100;
    this.addScore(bonus);
    this.audio.playVictory();
    this.particles.emitConfetti(this.width, 40);

    this.activeBanner = {
      title: `★ ¡PISO ${floors} CONSTRUIDO! ★`,
      subtitle: `+${bonus} PUNTOS DE BONIFICACIÓN`,
      timer: 2.8,
      maxTimer: 2.8
    };
  }

  // ==========================================================================
  // ACTUALIZACIÓN DE FÍSICAS A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animClock += dt;
    this.swingT += dt * this.swingSpeed;

    if (this.clawOpenTimer > 0) {
      this.clawOpenTimer -= dt;
    }

    // Temporizador de Fiebre Navideña
    if (this.isFeverMode) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.isFeverMode = false;
      }
    }

    // Banner de hitos
    if (this.activeBanner) {
      this.activeBanner.timer -= dt;
      if (this.activeBanner.timer <= 0) {
        this.activeBanner = null;
      }
    }

    // Caída libre del bloque soltado
    if (this.dropping) {
      const d = this.dropping;
      const prevBottom = d.bottom;
      d.vy += 2700 * dt;
      d.bottom += d.vy * dt;

      if (prevBottom <= this.towerTopY && d.bottom >= this.towerTopY) {
        d.bottom = this.towerTopY;
        this.landBlock(d);
      }
    }

    // Trozos rebanados que caen con giro
    for (const s of this.slices) {
      s.vy += 1900 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      s.alpha = Math.max(0, s.alpha - dt * 0.9);
    }
    this.slices = this.slices.filter((s) => s.y < this.cameraY + this.height + 250 && s.alpha > 0.05);

    // Bloques caídos por fallo total
    for (const f of this.falling) {
      f.vy += 1900 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
    }
    this.falling = this.falling.filter((f) => f.y < this.cameraY + this.height + 300);

    // Rebote de aplastamiento squash
    for (const b of this.blocks) {
      if (b.squash > 0) {
        b.squash = Math.max(0, b.squash - dt * 3.4);
      }
    }

    // Cámara vertical: sigue el crecimiento de la torre
    const targetCam = Math.min(0, this.towerTopY - this.height * 0.62);
    this.cameraY += (targetCam - this.cameraY) * Math.min(1, dt * 4.5);
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS (Stylized 2D Game Concept Art)
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const climb = -this.cameraY;

    // 1. Cielo nocturno con estrellas y aldea con scroll parallax
    drawNightSky(ctx, w, h, this.animClock, this.stars, climb);

    if (imgReady(this.bgImage)) {
      const scale = Math.max(w / this.bgImage.naturalWidth, h / this.bgImage.naturalHeight);
      const dw = this.bgImage.naturalWidth * scale;
      const dh = this.bgImage.naturalHeight * scale;
      const bottomY = h + climb * 0.55;
      ctx.drawImage(this.bgImage, (w - dw) / 2, bottomY - dh, dw, dh);

      const top = bottomY - dh;
      if (top > 0) {
        const fade = ctx.createLinearGradient(0, top - 90, 0, top + 40);
        fade.addColorStop(0, "rgba(16, 34, 77, 0)");
        fade.addColorStop(1, "rgba(16, 34, 77, 0.92)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, top - 90, w, 130);
      }
    }

    // 2. Pedestal nevado de soporte
    const pedW = Math.min(w * 0.84, this.initialBw * 3.8);
    const pedH = pedW * (546 / 1188);
    const pedSurface = this.groundY - this.cameraY;

    if (imgReady(this.spritePedestal)) {
      ctx.drawImage(this.spritePedestal, (w - pedW) / 2, pedSurface - pedH * 0.22, pedW, pedH);
    } else {
      ctx.fillStyle = "#6D3B1B";
      roundRectPath(ctx, (w - pedW) / 2, pedSurface, pedW, pedH * 0.8, 12);
      ctx.fill();
    }

    // 3. Torre de regalos apilados (con balanceo armónico acumulado)
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      const cumulativeLean = b.swayFactor * 12;
      const sway = Math.sin(this.animClock * 1.8 + i * 0.45) * (Math.min(i, 18) * 0.4 + cumulativeLean);

      this.drawBox(
        ctx,
        b.cx + sway,
        b.bottom - this.cameraY,
        b.width,
        b.kind,
        b.squash,
        b.gold ? b.logo : undefined,
        b.sponsorName
      );

      // Marcadores de altitud a los lados de la torre cada 5 pisos
      if (i > 0 && i % 5 === 0) {
        this.drawHeightMarker(ctx, b.cx + sway - b.width * 0.65 - 28, b.bottom - this.cameraY - this.boxH * 0.4, i * 4);
      }
    }

    // 4. Trozos rebanados (overhang slices) cayendo
    for (const s of this.slices) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y - this.cameraY);
      ctx.rotate(s.rot);
      this.drawSliceBox(ctx, s.width, s.height, s.kind);
      ctx.restore();
    }

    // 5. Bloques caídos por fallo total
    for (const f of this.falling) {
      ctx.save();
      ctx.translate(f.x, f.y - this.cameraY);
      ctx.rotate(f.rot);
      this.drawBox(ctx, 0, this.boxH * 0.5, f.width, f.kind, 0, undefined);
      ctx.restore();
    }

    // 6. Bloque en caída libre
    if (this.dropping) {
      const d = this.dropping;
      this.drawBox(ctx, d.cx, d.bottom - this.cameraY, d.width, d.kind, 0, d.gold ? d.logo : undefined, d.sponsor);
    }

    // 7. Grúa mecánica festiva con garra
    this.drawMechanicalCrane(ctx);

    // 8. Partículas y confeti
    this.particles.draw(ctx, true);

    // 9. Banner celebratorio de hito
    this.drawMilestoneBanner(ctx);

    // 10. HUD Superior de pisos, combo y fiebre
    this.drawHUDPanels(ctx);
  }

  /**
   * Dibuja una caja de regalo con squash, logo y decoraciones
   */
  private drawBox(
    ctx: CanvasRenderingContext2D,
    cx: number,
    bottomScreen: number,
    bw: number,
    kind: number,
    squash: number,
    logo?: HTMLImageElement,
    sponsorName?: string
  ): void {
    const bh = this.boxH;
    const sy = 1 - squash * 0.16;
    const sx = 1 + squash * 0.12;

    ctx.save();
    ctx.translate(cx, bottomScreen);
    ctx.scale(sx, sy);

    const sprite = this.boxSprites[kind % this.boxSprites.length];
    if (imgReady(sprite)) {
      ctx.drawImage(sprite, -bw / 2, -bh * 0.98, bw, bh);
    } else {
      ctx.fillStyle = ["#C62828", "#2E7D32", "#1565C0", "#FFB300", "#7B1FA2"][kind % 5];
      roundRectPath(ctx, -bw / 2, -bh * 0.82, bw, bh * 0.8, 8);
      ctx.fill();
    }

    // Reloj mágico dibujado sobre la caja si es tipo clock
    if (kind === 5 && imgReady(this.spriteClock)) {
      const clkSize = bw * 0.38;
      ctx.drawImage(this.spriteClock, -clkSize / 2, -bh * 0.55, clkSize, clkSize);
    }

    ctx.restore();

    // Medallón dorado corporativo
    if (logo) {
      drawSponsorMedallion(ctx, logo, cx, bottomScreen - bh * 0.36, bw * 0.22);

      if (sponsorName) {
        ctx.save();
        ctx.fillStyle = "#0F172A";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1.4;
        const tagW = Math.min(bw * 0.9, 100);
        const tagH = 16;
        roundRectPath(ctx, cx - tagW / 2, bottomScreen - bh * 0.12, tagW, tagH, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFD700";
        ctx.font = "900 9px 'Titan One', 'Fredoka', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sponsorName.toUpperCase(), cx, bottomScreen - bh * 0.12 + tagH / 2);
        ctx.restore();
      }
    }
  }

  /**
   * Dibuja el trozo rebanado que cae al vacío
   */
  private drawSliceBox(ctx: CanvasRenderingContext2D, width: number, height: number, kind: number): void {
    const sprite = this.boxSprites[kind % this.boxSprites.length];
    if (imgReady(sprite)) {
      // Recorte parcial del sprite
      ctx.drawImage(
        sprite,
        0, 0, sprite.naturalWidth * 0.5, sprite.naturalHeight,
        -width / 2, -height / 2, width, height
      );
    } else {
      ctx.fillStyle = ["#C62828", "#2E7D32", "#1565C0", "#FFB300", "#7B1FA2"][kind % 5];
      roundRectPath(ctx, -width / 2, -height / 2, width, height, 4);
      ctx.fill();
    }
  }

  /**
   * Dibuja la grúa mecánica navideña con carro, cable y garra articulada
   */
  private drawMechanicalCrane(ctx: CanvasRenderingContext2D): void {
    const cx = this.swingCx;
    const railY = 88;
    const bottomScreen = this.hangBottom - this.cameraY;
    const boxTop = bottomScreen - this.boxH * 0.95;

    // 1. Riel mecánico de bastón de caramelo y latón
    ctx.save();
    ctx.strokeStyle = "#D32F2F";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(18, railY);
    ctx.lineTo(this.width - 18, railY);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(18, railY);
    ctx.lineTo(this.width - 18, railY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Topes dorados de riel
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(18, railY, 8, 0, Math.PI * 2);
    ctx.arc(this.width - 18, railY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Carro de Grúa Mecánica (grua-carro-navideno.png)
    const trolleyW = 68;
    const trolleyH = 62;
    if (imgReady(this.spriteTrolley)) {
      ctx.drawImage(this.spriteTrolley, cx - trolleyW / 2, railY - trolleyH * 0.5, trolleyW, trolleyH);
    } else {
      ctx.fillStyle = "#FFB300";
      ctx.strokeStyle = "#5D3A00";
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, cx - 20, railY - 12, 40, 24, 6);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Cable de acero y garra oscilante
    const clawY = boxTop - 12;
    ctx.save();
    ctx.strokeStyle = "#FFE082";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, railY + 12);
    ctx.lineTo(cx, clawY);
    ctx.stroke();
    ctx.restore();

    // 4. Garra mecánica articulada (garra-gancho-navideno.png)
    const clawW = 56;
    const clawH = 60;
    ctx.save();
    ctx.translate(cx, clawY);

    // Oscilación y apertura al soltar
    const isOpen = this.clawOpenTimer > 0;
    const clawScaleX = isOpen ? 1.3 : 1.0;
    const clawScaleY = isOpen ? 0.88 : 1.0;
    ctx.scale(clawScaleX, clawScaleY);

    if (imgReady(this.spriteClaw)) {
      ctx.drawImage(this.spriteClaw, -clawW / 2, -clawH * 0.35, clawW, clawH);
    } else {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Si no está cayendo ningún bloque, dibujar el paquete sostenido por la garra
    if (!this.dropping && !this.locked) {
      ctx.save();
      ctx.translate(cx, boxTop + this.boxH * 0.2);
      ctx.rotate(Math.cos(this.swingT) * 0.06);
      ctx.translate(-cx, -(boxTop + this.boxH * 0.2));

      this.drawBox(
        ctx,
        cx,
        bottomScreen,
        this.currentBw,
        this.nextKind,
        0,
        this.nextGold ? this.nextSponsor?.logo : undefined,
        this.nextSponsor?.name
      );
      ctx.restore();
    }
  }

  /**
   * Marcador de altitud en madera tallada al lado de la torre
   */
  private drawHeightMarker(ctx: CanvasRenderingContext2D, x: number, y: number, meters: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.8;
    const tagW = 54;
    const tagH = 22;
    roundRectPath(ctx, x - tagW / 2, y - tagH / 2, tagW, tagH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = "900 11px 'Titan One', 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${meters}m`, x, y);
    ctx.restore();
  }

  /**
   * Banner celebratorio de hitos de pisos
   */
  private drawMilestoneBanner(ctx: CanvasRenderingContext2D): void {
    if (!this.activeBanner) return;

    ctx.save();
    const progress = this.activeBanner.timer / this.activeBanner.maxTimer;
    let alpha = 1;
    if (progress > 0.8) alpha = (1 - progress) / 0.2;
    else if (progress < 0.2) alpha = progress / 0.2;

    ctx.globalAlpha = alpha;
    const bannerW = Math.min(this.width * 0.85, 360);
    const bannerH = 56;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = this.height * 0.36;

    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerH);
    grad.addColorStop(0, "rgba(255, 215, 0, 0.95)");
    grad.addColorStop(1, "rgba(255, 145, 0, 0.95)");

    ctx.fillStyle = grad;
    roundRectPath(ctx, bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 16px 'Titan One', 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.activeBanner.title, this.width / 2, bannerY + 20);

    ctx.fillStyle = "#7C2D12";
    ctx.font = "800 12px 'Titan One', 'Fredoka', sans-serif";
    ctx.fillText(this.activeBanner.subtitle, this.width / 2, bannerY + 40);
    ctx.restore();
  }

  /**
   * HUD Superior de información
   */
  private drawHUDPanels(ctx: CanvasRenderingContext2D): void {
    const floorsCount = Math.max(0, this.blocks.length - 1);
    drawPill(ctx, `★ PISO ${floorsCount} ★`, this.width / 2, 68, "#FFD700", 124);

    if (this.isFeverMode) {
      drawPill(ctx, "★ ¡FIEBRE x2! ★", this.width - 86, 68, "#FF1744", 136);
    } else if (this.combo >= 2) {
      drawPill(ctx, `PERFECTO x${this.combo}`, this.width - 86, 68, "#FF9100", 130);
    }
  }
}
