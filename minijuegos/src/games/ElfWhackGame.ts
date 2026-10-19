/**
 * ==============================================================================
 * JUEGO: ¡GOLPEA AL DUENDE TRAVIESO! (Christmas Elf Whack-a-Mole)
 * ==============================================================================
 *
 * Minijuego arcade clásico estilo Whack-a-Mole con ambientación navideña:
 * - 6 u 8 chimeneas nevadas en un tejado acogedor.
 * - Los duendes traviesos se asoman por turnos con regalos y sorpresas.
 * - Duende Común (+100 pts), Duende Dorado Patrocinador (+250 pts) y Muñeco Gruñón (-50 pts).
 * - Toques táctiles inmediatos a 60 FPS con animaciones cartoon y partículas.
 * - Sistema de Combos y modo Fiebre de Regalos.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";

interface ChimneyHole {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  state: "hidden" | "rising" | "visible" | "hiding" | "hit";
  elfType: "normal" | "gold" | "hazard";
  sponsorName?: string;
  sponsorLogo?: HTMLImageElement;
  progress: number; // 0 (oculto) a 1 (totalmente visible)
  stateTimer: number;
  stayDuration: number;
}

export class ElfWhackGame extends BaseGame {
  // Sprites
  private bgImage: HTMLImageElement;
  private fairLogo: HTMLImageElement;
  private sponsorLogos: { name: string; logo: HTMLImageElement }[] = [];

  // Tablero de Chimeneas
  private holes: ChimneyHole[] = [];
  private spawnInterval: number = 0.95;
  private spawnTimer: number = 0;

  // Combos
  private combo: number = 0;
  private maxCombo: number = 0;

  // Animaciones
  private animClock: number = 0;

  // Sprites Stylized 2D
  private spriteElf: HTMLImageElement;
  private spriteHazardSnowman: HTMLImageElement;
  private spriteChimney: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "elf-whack",
      "¡Golpea al Duende Travieso!",
      "¡Toca a los duendes traviesos que se asoman por las chimeneas y evita el carbón!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Dance of the Sugar Plum Fairy.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImage = this.loadImage("./assets/images/fondo-nieve.webp");
    this.fairLogo = this.loadImage("./assets/logos/clean-feria-magica.png");

    this.sponsorLogos = [
      { name: "Campuslands", logo: this.loadImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.loadImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.loadImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.fairLogo }
    ];

    // Carga de sprites estilizados HD
    this.spriteElf = this.getImage("./assets/images/icon-aldea-elfos.png");
    this.spriteHazardSnowman = this.getImage("./assets/images/obstaculo-muneco.png");
    this.spriteChimney = this.getImage("./assets/images/chimenea-obstaculo.png");

    this.computeHolesLayout();
  }

  private loadImage(src: string): HTMLImageElement {
    return this.getImage(src);
  }

  protected onStart(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.spawnTimer = 0;

    this.computeHolesLayout();

    // Entrada táctil
    this.input.onTap = (x: number, y: number) => {
      if (!this.isRunning || this.isGameOver) return;
      this.handlePlayerTap(x, y);
    };

    this.addFloatingText("¡ATRAPA A LOS DUENDES!", this.width * 0.5, this.height * 0.4, "#FFD700", 1.5);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onTap = undefined;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeHolesLayout();
  }

  /**
   * Calcula la distribución de las chimeneas (2 filas de 3 columnas o 3 filas de 2 columnas)
   */
  private computeHolesLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;

    const isLandscape = w >= h;
    const cols = isLandscape ? 3 : 2;
    const rows = isLandscape ? 2 : 3;

    this.holes = [];

    const areaW = Math.min(w * 0.88, 640);
    const areaH = Math.min(h * 0.65, 540);
    const originX = (w - areaW) / 2;
    const originY = Math.max(90, h * 0.18 + (h * 0.72 - areaH) / 2);

    const holeW = areaW / cols * 0.76;
    const holeH = holeW * 0.75;
    const stepX = areaW / cols;
    const stepY = areaH / rows;

    let id = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = originX + c * stepX + stepX * 0.5;
        const cy = originY + r * stepY + stepY * 0.5;

        this.holes.push({
          id: id++,
          x: cx - holeW * 0.5,
          y: cy - holeH * 0.5,
          w: holeW,
          h: holeH,
          state: "hidden",
          elfType: "normal",
          progress: 0,
          stateTimer: 0,
          stayDuration: 1.2
        });
      }
    }
  }

  // ==========================================================================
  // LÓGICA DE JUEGO A 60 FPS
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animClock += dt;

    // Control de aparición periódica de duendes
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandomElf();
    }

    // Actualización de estado de cada chimenea
    this.holes.forEach((h) => {
      if (h.state === "rising") {
        h.progress += dt * 4.5;
        if (h.progress >= 1.0) {
          h.progress = 1.0;
          h.state = "visible";
          h.stateTimer = 0;
        }
      } else if (h.state === "visible") {
        h.stateTimer += dt;
        if (h.stateTimer >= h.stayDuration) {
          h.state = "hiding";
        }
      } else if (h.state === "hiding") {
        h.progress -= dt * 4.0;
        if (h.progress <= 0) {
          h.progress = 0;
          h.state = "hidden";
        }
      } else if (h.state === "hit") {
        h.stateTimer += dt;
        if (h.stateTimer >= 0.28) {
          h.progress -= dt * 5.0;
          if (h.progress <= 0) {
            h.progress = 0;
            h.state = "hidden";
          }
        }
      }
    });
  }

  private spawnRandomElf(): void {
    const hiddenHoles = this.holes.filter((h) => h.state === "hidden");
    if (hiddenHoles.length === 0) return;

    const hole = hiddenHoles[Math.floor(Math.random() * hiddenHoles.length)];

    const rand = Math.random();
    if (rand < 0.25 && this.sponsorLogos.length > 0) {
      // Duende Dorado con Patrocinador
      hole.elfType = "gold";
      const sp = this.sponsorLogos[Math.floor(Math.random() * this.sponsorLogos.length)];
      hole.sponsorName = sp.name;
      hole.sponsorLogo = sp.logo;
      hole.stayDuration = 0.95;
    } else if (rand < 0.42) {
      // Muñeco de nieve gruñón / peligro
      hole.elfType = "hazard";
      hole.sponsorName = undefined;
      hole.sponsorLogo = undefined;
      hole.stayDuration = 1.3;
    } else {
      // Duende normal
      hole.elfType = "normal";
      hole.sponsorName = undefined;
      hole.sponsorLogo = undefined;
      hole.stayDuration = 1.1;
    }

    hole.state = "rising";
    hole.progress = 0;
    hole.stateTimer = 0;
  }

  /**
   * Maneja el toque del jugador sobre una chimenea
   */
  private handlePlayerTap(x: number, y: number): void {
    for (let i = 0; i < this.holes.length; i++) {
      const h = this.holes[i];

      // Comprobar si tocó la chimenea o el duende
      const touchBoxTop = h.y - h.h * h.progress * 0.9;
      if (
        x >= h.x - 10 &&
        x <= h.x + h.w + 10 &&
        y >= touchBoxTop &&
        y <= h.y + h.h + 10
      ) {
        if (h.state === "rising" || h.state === "visible") {
          h.state = "hit";
          h.stateTimer = 0;

          if (h.elfType === "gold") {
            // ¡Acierto especial patrocinado!
            this.combo += 2;
            const pts = 250;
            this.score += pts;
            this.audio.playPowerUp();
            this.triggerShake(0.18, 5);
            this.particles.emitBurst(h.x + h.w * 0.5, h.y - 20, "#FFD700", 18);
            this.addFloatingText(`★ ${h.sponsorName?.toUpperCase() || "PATROCINADOR"}! +${pts}`, h.x + h.w * 0.5, h.y - 35, "#FFD700", 1.4);
          } else if (h.elfType === "hazard") {
            // ¡Penalización por tocar muñeco gruñón!
            this.combo = 0;
            this.score = Math.max(0, this.score - 50);
            this.audio.playElfHit();
            this.triggerShake(0.2, 6);
            this.particles.emitBurst(h.x + h.w * 0.5, h.y, "#FF1744", 12);
            this.addFloatingText("¡CUIDADO! -50", h.x + h.w * 0.5, h.y - 25, "#FF1744", 1.2);
          } else {
            // Duende normal
            this.combo++;
            const pts = 100 + (this.combo > 3 ? 50 : 0);
            this.score += pts;
            this.audio.playCatchItem(1.0 + (this.combo % 6) * 0.08);
            this.triggerShake(0.1, 3);
            this.particles.emitBurst(h.x + h.w * 0.5, h.y - 15, "#00E676", 12);
            this.addFloatingText(`+${pts}`, h.x + h.w * 0.5, h.y - 25, "#FFD700", 1.2);
          }

          if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          return;
        }
      }
    }
  }

  // ==========================================================================
  // RENDERIZADO VISUAL A 60 FPS
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo invernal
    if (this.bgImage && this.bgImage.complete) {
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#09152C");
      grad.addColorStop(0.5, "#142A52");
      grad.addColorStop(1, "#E8F0FE");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Chimeneas y Duendes
    this.holes.forEach((h) => {
      this.drawChimneyAndElf(ctx, h);
    });

    // 3. Partículas
    this.particles.draw(ctx, true);

    // 4. HUD de Combo
    if (this.combo >= 2) {
      const tagW = 120;
      const tagH = 26;
      const tagX = (this.width - tagW) / 2;
      const tagY = 72;

      ctx.save();
      ctx.fillStyle = "rgba(10, 22, 45, 0.9)";
      ctx.strokeStyle = "#FF9100";
      ctx.lineWidth = 2;
      this.roundRect(ctx, tagX, tagY, tagW, tagH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FF9100";
      ctx.font = "900 12px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`¡RACHA x${this.combo}!`, this.width / 2, tagY + 13);
      ctx.restore();
    }
  }

  /**
   * Dibuja una chimenea y al personaje que se asoma de ella
   */
  private drawChimneyAndElf(ctx: CanvasRenderingContext2D, h: ChimneyHole): void {
    ctx.save();

    // 1. Dibujar al Duende / Muñeco asomándose por la chimenea
    if (h.progress > 0) {
      ctx.save();
      // Clip rectangular para que sólo se vea lo que sobresale de la chimenea
      ctx.beginPath();
      ctx.rect(h.x - 20, h.y - h.h * 1.5, h.w + 40, h.h * 1.5);
      ctx.clip();

      const elfY = h.y + h.h * 0.15 - (h.h * 0.9 * h.progress);
      const elfX = h.x + h.w * 0.5;

      if (h.elfType === "hazard") {
        if (this.spriteHazardSnowman && this.spriteHazardSnowman.complete && this.spriteHazardSnowman.naturalWidth > 0) {
          const snowW = h.w * 0.88;
          const snowH = h.w * 1.05;
          ctx.drawImage(this.spriteHazardSnowman, elfX - snowW / 2, elfY - snowH * 0.72, snowW, snowH);
        } else {
          // Muñeco de nieve gruñón con ceño fruncido
          ctx.fillStyle = "#ECEFF1";
          ctx.beginPath();
          ctx.arc(elfX, elfY, h.w * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#90A4AE";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Ojos de carbón y ceño
          ctx.fillStyle = "#212121";
          ctx.fillRect(elfX - 12, elfY - 6, 6, 6);
          ctx.fillRect(elfX + 6, elfY - 6, 6, 6);
          ctx.strokeStyle = "#D50000";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(elfX - 14, elfY - 10);
          ctx.lineTo(elfX - 6, elfY - 6);
          ctx.moveTo(elfX + 14, elfY - 10);
          ctx.lineTo(elfX + 6, elfY - 6);
          ctx.stroke();
        }
      } else {
        const isGold = h.elfType === "gold";
        if (this.spriteElf && this.spriteElf.complete && this.spriteElf.naturalWidth > 0) {
          const elfSize = h.w * 0.95;
          ctx.drawImage(this.spriteElf, elfX - elfSize / 2, elfY - elfSize * 0.72, elfSize, elfSize);

          if (isGold) {
            // Corona/Aura dorada
            ctx.save();
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(elfX, elfY - elfSize * 0.7, elfSize * 0.3, elfSize * 0.1, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Medallón de patrocinador
            if (h.sponsorLogo && h.sponsorLogo.complete) {
              const logoR = 14;
              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(elfX, elfY + h.w * 0.12, logoR, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = "#FFD700";
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.drawImage(h.sponsorLogo, elfX - 10, elfY + h.w * 0.12 - 10, 20, 20);
            }
            ctx.restore();
          }
        } else {
          // Gorro navideño
          ctx.fillStyle = isGold ? "#FFD700" : "#D50000";
          ctx.beginPath();
          ctx.moveTo(elfX - h.w * 0.32, elfY - h.h * 0.1);
          ctx.lineTo(elfX + h.w * 0.32, elfY - h.h * 0.1);
          ctx.quadraticCurveTo(elfX, elfY - h.h * 0.65, elfX - h.w * 0.35, elfY - h.h * 0.55);
          ctx.closePath();
          ctx.fill();

          // Cara
          ctx.fillStyle = isGold ? "#FFF8E1" : "#FFE0B2";
          ctx.beginPath();
          ctx.arc(elfX, elfY, h.w * 0.32, 0, Math.PI * 2);
          ctx.fill();

          // Orejas puntiagudas
          ctx.fillStyle = isGold ? "#FFF8E1" : "#FFE0B2";
          ctx.beginPath();
          ctx.moveTo(elfX - h.w * 0.28, elfY - 2);
          ctx.lineTo(elfX - h.w * 0.44, elfY - 8);
          ctx.lineTo(elfX - h.w * 0.28, elfY + 4);
          ctx.moveTo(elfX + h.w * 0.28, elfY - 2);
          ctx.lineTo(elfX + h.w * 0.44, elfY - 8);
          ctx.lineTo(elfX + h.w * 0.28, elfY + 4);
          ctx.fill();

          // Ojos y sonrisa
          ctx.fillStyle = "#3E2723";
          ctx.beginPath();
          ctx.arc(elfX - 8, elfY - 2, 2.5, 0, Math.PI * 2);
          ctx.arc(elfX + 8, elfY - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Medallón de patrocinador si es dorado
          if (isGold && h.sponsorLogo && h.sponsorLogo.complete) {
            const logoR = 14;
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(elfX, elfY + h.w * 0.28, logoR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.drawImage(h.sponsorLogo, elfX - 10, elfY + h.w * 0.28 - 10, 20, 20);
          }
        }
      }

      ctx.restore();
    }

    // 2. Chimenea rústica
    if (this.spriteChimney && this.spriteChimney.complete && this.spriteChimney.naturalWidth > 0) {
      const chimW = h.w * 1.16;
      const chimH = h.h * 1.25;
      ctx.drawImage(this.spriteChimney, h.x - (chimW - h.w) / 2, h.y - 8, chimW, chimH);
    } else {
      // Chimenea rústica de ladrillo rojo
      ctx.fillStyle = "#B71C1C";
      ctx.strokeStyle = "#3E2723";
      ctx.lineWidth = 2.5;
      this.roundRect(ctx, h.x, h.y, h.w, h.h, 6);
      ctx.fill();
      ctx.stroke();

      // Líneas decorativas de ladrillo
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(h.x + 4, h.y + h.h * 0.5);
      ctx.lineTo(h.x + h.w - 4, h.y + h.h * 0.5);
      ctx.stroke();

      // Manto grueso de nieve en la corona de la chimenea
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#CFD8DC";
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, h.x - 4, h.y - 6, h.w + 8, 12, 6);
      ctx.fill();
    }
    ctx.stroke();

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
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
