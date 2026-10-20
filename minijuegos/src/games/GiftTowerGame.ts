/**
 * ==============================================================================
 * JUEGO: ¡TORRE DE REGALOS MÁGICA! (Magical Holiday Gift Tower)
 * ==============================================================================
 *
 * Apilador arcade: una grúa de Santa balancea un regalo; toca para soltarlo y
 * colócalo sobre la torre. Si cae muy desalineado se pierde y cuesta una vida.
 * - Encaje perfecto: +bonus y racha (la caja se centra con destellos).
 * - Cada 5 pisos baja un Regalo Dorado con logo de patrocinador (+300).
 * - La grúa se acelera a medida que la torre crece y la cámara sube con ella.
 *
 * Arte: sprites Stylized 2D Game Art (regalos, pedestal navideño) + cielo
 * nocturno de la Feria Mágica. Sin emojis.
 */

import { BaseGame } from "../core/BaseGame";
import type { InputManager } from "../core/InputManager";
import type { AudioManager } from "../core/AudioManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import { drawNightSky, drawPill, drawSponsorMedallion, imgReady, makeSkyStars, roundRectPath } from "./shared/gameDraw";
import type { SkyStar } from "./shared/gameDraw";

interface TowerBlock {
  cx: number;
  bottom: number; // Y de mundo de la base de la caja
  kind: number;
  gold: boolean;
  logo?: HTMLImageElement;
  squash: number;
}

interface DroppingBlock {
  cx: number;
  bottom: number;
  vy: number;
  kind: number;
  gold: boolean;
  logo?: HTMLImageElement;
  sponsor?: string;
}

interface FallingBlock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  kind: number;
  gold: boolean;
}

export class GiftTowerGame extends BaseGame {
  private bgImage: HTMLImageElement;
  private sponsors: { name: string; logo: HTMLImageElement }[] = [];
  private boxSprites: HTMLImageElement[] = [];
  private spritePedestal: HTMLImageElement;
  private stars: SkyStar[] = makeSkyStars(90);

  private blocks: TowerBlock[] = [];
  private falling: FallingBlock[] = [];
  private dropping: DroppingBlock | null = null;

  private bw = 110; // ancho de caja
  private groundY = 0; // superficie del pedestal (mundo)
  private towerTopY = 0; // Y de mundo donde se apoya la siguiente caja
  private lastCx = 0;
  private cameraY = 0;

  private swingT = 0;
  private swingSpeed = 1.5;
  private nextKind = 0;
  private nextGold = false;
  private nextSponsor: { name: string; logo: HTMLImageElement } | null = null;

  private combo = 0;
  private locked = false;
  private animClock = 0;

  constructor(canvas: HTMLCanvasElement, input: InputManager, audio: AudioManager, particles: ParticleSystem) {
    super(
      "gift-tower",
      "¡Torre de Regalos Mágica!",
      "¡Toca para soltar cada regalo y apílalos bien alineados hasta tocar las estrellas!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/We Wish You a Merry Christmas.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImage = this.getImage("./assets/images/fondo-nieve.webp");
    this.spritePedestal = this.getImage("./assets/images/pedestal-torre-regalos.png");
    this.boxSprites = [
      this.getImage("./assets/images/regalo-estilizado-rojo.png"),
      this.getImage("./assets/images/regalo-estilizado-verde.png"),
      this.getImage("./assets/images/regalo-estilizado-azul.png"),
      this.getImage("./assets/images/regalo-estilizado-dorado.png")
    ];
    this.sponsors = [
      { name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.png") },
      { name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.png") },
      { name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.png") },
      { name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.png") }
    ];
  }

  // ==========================================================================
  // GEOMETRÍA
  // ==========================================================================
  private get step(): number {
    return this.bw * 0.8;
  }

  private get boxH(): number {
    return this.bw * 1.155;
  }

  private get swingAmp(): number {
    return Math.max(10, this.width * 0.5 - this.bw * 0.62);
  }

  private computeLayout(): void {
    const w = this.width > 0 ? this.width : 800;
    const h = this.height > 0 ? this.height : 600;
    this.bw = Math.max(78, Math.min(132, Math.round(Math.min(w * 0.2, h * 0.19))));
    this.groundY = h * 0.84;
  }

  // ==========================================================================
  // CICLO DE VIDA
  // ==========================================================================
  protected onStart(): void {
    this.computeLayout();
    this.score = 0;
    this.combo = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;
    this.locked = false;
    this.blocks = [];
    this.falling = [];
    this.dropping = null;
    this.cameraY = 0;
    this.swingT = 0;
    this.swingSpeed = 1.5;
    this.animClock = 0;

    // Caja base ya colocada sobre el pedestal
    this.lastCx = this.width / 2;
    this.blocks.push({ cx: this.lastCx, bottom: this.groundY + 4, kind: 0, gold: false, squash: 0 });
    this.towerTopY = this.groundY + 4 - this.step;
    this.prepareNext();

    this.input.onTap = () => this.dropBlock();

    this.addFloatingText("¡TOCA PARA SOLTAR!", this.width * 0.5, this.height * 0.42, "#FFD700", 1.4);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onTap = undefined;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.computeLayout();
  }

  private prepareNext(): void {
    const floors = this.blocks.length; // pisos ya construidos
    this.nextGold = floors > 0 && floors % 5 === 0;
    if (this.nextGold) {
      this.nextSponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
      this.nextKind = 3;
    } else {
      this.nextSponsor = null;
      let k = Math.floor(Math.random() * 3);
      if (this.blocks.length && k === this.blocks[this.blocks.length - 1].kind) k = (k + 1) % 3;
      this.nextKind = k;
    }
  }

  private get swingCx(): number {
    return this.width / 2 + Math.sin(this.swingT) * this.swingAmp;
  }

  private get hangBottom(): number {
    return this.cameraY + this.height * 0.3;
  }

  // ==========================================================================
  // ACCIONES
  // ==========================================================================
  private dropBlock(): void {
    if (!this.isRunning || this.isGameOver || this.isFinishing || this.locked || this.dropping) return;
    this.audio.playWhoosh();
    this.dropping = {
      cx: this.swingCx,
      bottom: this.hangBottom,
      vy: 120,
      kind: this.nextKind,
      gold: this.nextGold,
      logo: this.nextSponsor?.logo,
      sponsor: this.nextSponsor?.name
    };
  }

  private landBlock(d: DroppingBlock): void {
    const dx = d.cx - this.lastCx;
    const absDx = Math.abs(dx);
    const tolerance = this.bw * 0.62;

    if (absDx > tolerance) {
      // ¡Se cae de la torre!
      this.falling.push({
        x: d.cx,
        y: this.towerTopY,
        vx: Math.sign(dx || 1) * 160,
        vy: -120,
        rot: 0,
        vr: Math.sign(dx || 1) * 4,
        kind: d.kind,
        gold: d.gold
      });
      this.dropping = null;
      this.combo = 0;
      this.lives--;
      this.audio.playError();
      this.triggerShake(0.25, 7);
      this.addFloatingText("¡SE CAYÓ!", Math.max(70, Math.min(this.width - 70, d.cx)), this.towerTopY - this.cameraY - 40, "#FF5252", 1.4);
      if (this.lives <= 0) {
        this.locked = true;
        this.setGameTimeout(() => this.endGame(), 900);
      } else {
        this.prepareNext();
      }
      return;
    }

    const perfect = absDx <= this.bw * 0.07;
    const cx = perfect ? this.lastCx : d.cx;
    const floorNumber = this.blocks.length;

    this.blocks.push({ cx, bottom: this.towerTopY, kind: d.kind, gold: d.gold, logo: d.logo, squash: 1 });
    this.lastCx = cx;
    this.towerTopY -= this.step;
    this.dropping = null;

    const screenX = cx;
    const screenY = this.towerTopY + this.step - this.cameraY - this.boxH * 0.8;

    let pts = 100 + floorNumber * 5;
    if (perfect) {
      this.combo++;
      pts += 100 + this.combo * 50;
      this.audio.playPowerUp();
      this.particles.emitBurst(screenX, screenY + this.boxH * 0.6, "#FFD700", 18);
      this.addFloatingText(this.combo > 1 ? `¡PERFECTO x${this.combo}!` : "¡PERFECTO!", screenX, screenY, "#FFD700", 1.5);
    } else {
      this.combo = 0;
      this.audio.playCatchItem(1.0 + Math.min(0.6, floorNumber * 0.03));
      this.particles.emitBurst(screenX, screenY + this.boxH * 0.7, "#FFFFFF", 8);
      this.addFloatingText(`+${pts}`, screenX, screenY, "#FFFFFF", 1.1);
      this.triggerShake(0.12, 3);
    }

    if (d.gold) {
      pts += 300;
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 40);
      this.triggerShake(0.2, 5);
      this.addFloatingText(`${(d.sponsor || "PATROCINADOR").toUpperCase()}  +300`, this.width * 0.5, this.height * 0.4, "#FFD700", 1.6);
    }

    this.addScore(pts);

    // Dificultad progresiva: la grúa se acelera con la altura
    this.swingSpeed = Math.min(3.6, 1.5 + this.blocks.length * 0.07);
    this.prepareNext();
  }

  // ==========================================================================
  // ACTUALIZACIÓN
  // ==========================================================================
  protected onUpdate(dt: number): void {
    this.animClock += dt;
    this.swingT += dt * this.swingSpeed;

    // Caída del bloque soltado
    if (this.dropping) {
      const d = this.dropping;
      const prevBottom = d.bottom;
      d.vy += 2600 * dt;
      d.bottom += d.vy * dt;
      if (prevBottom <= this.towerTopY && d.bottom >= this.towerTopY) {
        d.bottom = this.towerTopY;
        this.landBlock(d);
      }
    }

    // Bloques caídos (fallidos)
    for (const f of this.falling) {
      f.vy += 1800 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
    }
    this.falling = this.falling.filter((f) => f.y < this.cameraY + this.height + 300);

    // Rebote de aplastamiento de bloques colocados
    for (const b of this.blocks) {
      if (b.squash > 0) b.squash = Math.max(0, b.squash - dt * 3.2);
    }

    // Cámara: sigue la altura de la torre
    const targetCam = Math.min(0, this.towerTopY - this.height * 0.62);
    this.cameraY += (targetCam - this.cameraY) * Math.min(1, dt * 4);
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const climb = -this.cameraY;

    // 1. Cielo + aldea que se hunde al subir
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
        fade.addColorStop(0, "rgba(16,34,77,0)");
        fade.addColorStop(1, "rgba(16,34,77,0.9)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, top - 90, w, 130);
      }
    }

    // 2. Pedestal
    const pedW = Math.min(w * 0.82, this.bw * 3.8);
    const pedH = pedW * (546 / 1188);
    const pedSurface = this.groundY - this.cameraY;
    if (imgReady(this.spritePedestal)) {
      ctx.drawImage(this.spritePedestal, (w - pedW) / 2, pedSurface - pedH * 0.2, pedW, pedH);
    } else {
      ctx.fillStyle = "#6D3B1B";
      roundRectPath(ctx, (w - pedW) / 2, pedSurface, pedW, pedH * 0.8, 12);
      ctx.fill();
    }

    // 3. Torre (de abajo hacia arriba para que cada caja tape el moño de la anterior)
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      const sway = Math.sin(this.animClock * 1.6 + i * 0.5) * Math.min(i, 14) * 0.45;
      this.drawBox(ctx, b.cx + sway, b.bottom - this.cameraY, b.kind, b.squash, b.gold ? b.logo : undefined);
    }

    // 4. Bloque en caída libre
    if (this.dropping) {
      const d = this.dropping;
      this.drawBox(ctx, d.cx, d.bottom - this.cameraY, d.kind, 0, d.gold ? d.logo : undefined);
    }

    // 5. Bloques fallidos
    for (const f of this.falling) {
      ctx.save();
      ctx.translate(f.x, f.y - this.cameraY);
      ctx.rotate(f.rot);
      this.drawBox(ctx, 0, this.boxH * 0.5, f.kind, 0, undefined);
      ctx.restore();
    }

    // 6. Grúa con regalo colgante
    if (!this.dropping && !this.locked) {
      this.drawCrane(ctx);
    } else {
      this.drawCraneRail(ctx, this.swingCx);
    }

    // 7. Partículas e indicadores
    this.particles.draw(ctx, true);
    drawPill(ctx, `PISO ${this.blocks.length}`, w / 2, 70, "#FFD700", 110);
    if (this.combo >= 2) {
      drawPill(ctx, `PERFECTO x${this.combo}`, w - 82, 70, "#FF9100", 130);
    }
  }

  private drawBox(
    ctx: CanvasRenderingContext2D,
    cx: number,
    bottomScreen: number,
    kind: number,
    squash: number,
    logo?: HTMLImageElement
  ): void {
    const bw = this.bw;
    const bh = this.boxH;
    const sprite = this.boxSprites[kind % this.boxSprites.length];
    const sy = 1 - squash * 0.14;
    const sx = 1 + squash * 0.10;

    ctx.save();
    ctx.translate(cx, bottomScreen);
    ctx.scale(sx, sy);
    if (imgReady(sprite)) {
      ctx.drawImage(sprite, -bw / 2, -bh * 0.97, bw, bh);
    } else {
      ctx.fillStyle = ["#C62828", "#2E7D32", "#1565C0", "#FFB300"][kind % 4];
      roundRectPath(ctx, -bw / 2, -bh * 0.8, bw, bh * 0.78, 8);
      ctx.fill();
    }
    ctx.restore();

    if (logo) {
      drawSponsorMedallion(ctx, logo, cx, bottomScreen - bh * 0.34, bw * 0.2);
    }
  }

  private drawCraneRail(ctx: CanvasRenderingContext2D, cx: number): void {
    const railY = 112;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(14, railY);
    ctx.lineTo(this.width - 14, railY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Carro de la grúa
    ctx.fillStyle = "#FFB300";
    ctx.strokeStyle = "#5D3A00";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, cx - 16, railY - 9, 32, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawCrane(ctx: CanvasRenderingContext2D): void {
    const cx = this.swingCx;
    const bottomScreen = this.hangBottom - this.cameraY;
    const top = bottomScreen - this.boxH * 0.97;

    this.drawCraneRail(ctx, cx);

    // Cuerda
    ctx.save();
    ctx.strokeStyle = "#E8C97A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 112);
    ctx.lineTo(cx, top + this.boxH * 0.22);
    ctx.stroke();
    ctx.restore();

    // Regalo colgante con ligera oscilación
    ctx.save();
    ctx.translate(cx, top + this.boxH * 0.22);
    ctx.rotate(Math.cos(this.swingT) * 0.07);
    ctx.translate(-cx, -(top + this.boxH * 0.22));
    this.drawBox(ctx, cx, bottomScreen, this.nextKind, 0, this.nextGold ? this.nextSponsor?.logo : undefined);
    ctx.restore();
  }
}
