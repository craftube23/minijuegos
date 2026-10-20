/**
 * ==============================================================================
 * MINIJUEGO: ¡ENTREGA POR LA CHIMENEA! (Santa's Rooftop Chimney Drop Arcade)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Mecánica:
 * - Santa sobrevuela los tejados nevados de la aldea en su trineo mágico.
 * - Toca la pantalla (o usa las flechas y Espacio) para mover el trineo y
 *   soltar regalos con paracaídas hacia las chimeneas iluminadas.
 * - Chimeneas Doradas de Patrocinador: otorgan +300 pts y activan la Lluvia
 *   Dorada (puntos x2).
 * - Chimeneas con Nube de Carbón: evita soltar regalos dentro o perderás una vida.
 */

import { BaseGame } from "../core/BaseGame";
import type { AudioManager } from "../core/AudioManager";
import type { InputManager } from "../core/InputManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import {
  imgReady,
  roundRectPath,
  makeSkyStars,
  drawNightSky,
  drawPill,
  drawSponsorMedallion
} from "./shared/gameDraw";

type ChimneyKind = "normal" | "golden" | "sponsor" | "soot";

interface SponsorInfo {
  id: string;
  name: string;
  logo: HTMLImageElement;
}

interface RooftopChimney {
  x: number;
  y: number;
  w: number;
  h: number;
  houseW: number;
  houseH: number;
  kind: ChimneyKind;
  sponsor?: SponsorInfo;
  delivered: boolean;
  smokePhase: number;
  houseVariant: number;
}

interface FallingPresent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  spriteIdx: number;
  active: boolean;
}

interface FloatingStarBonus {
  x: number;
  y: number;
  r: number;
  phase: number;
  active: boolean;
}

function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (!imgReady(img)) return;
  const ratio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  const dw = ratio >= boxRatio ? w : h * ratio;
  const dh = ratio >= boxRatio ? w / ratio : h;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export class ChimneyDropGame extends BaseGame {
  private sleighX = 320;
  private sleighTargetX = 320;
  private sleighY = 165;
  private dropCooldown = 0;

  private chimneys: RooftopChimney[] = [];
  private presents: FallingPresent[] = [];
  private bonusStars: FloatingStarBonus[] = [];

  private scrollSpeed = 235;
  private spawnTimer = 0;
  private starSpawnTimer = 1.5;

  private deliveredCount = 0;
  private combo = 0;
  private keyLeft = false;
  private keyRight = false;

  private skyStars = makeSkyStars(52);

  // Assets 2D
  private bgImg: HTMLImageElement;
  private sleighImg: HTMLImageElement;
  private chimneyImg: HTMLImageElement;
  private houseCleanImg: HTMLImageElement;
  private houseRedImg: HTMLImageElement;
  private giftImgs: HTMLImageElement[] = [];
  private starImg: HTMLImageElement;
  private coalImg: HTMLImageElement;
  private sponsors: SponsorInfo[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "chimney-drop",
      "¡Entrega por la Chimenea!",
      "¡Suelta los regalos con paracaídas desde el trineo de Santa justo dentro de las chimeneas iluminadas!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Joy to the world.mp3";
    this.inGameMusicVolume = 0.42;

    this.bgImg = this.getImage("./assets/images/fondo-villa-montanas.jpg");
    this.sleighImg = this.getImage("./assets/images/santa-trineo.png");
    this.chimneyImg = this.getImage("./assets/images/chimenea-obstaculo.png");
    this.houseCleanImg = this.getImage("./assets/images/casa-navidena-clean.png");
    this.houseRedImg = this.getImage("./assets/images/casa-roja.png");
    this.giftImgs = [
      this.getImage("./assets/images/regalo-estilizado-rojo.png"),
      this.getImage("./assets/images/regalo-estilizado-verde.png"),
      this.getImage("./assets/images/regalo-estilizado-azul.png"),
      this.getImage("./assets/images/regalo-estilizado-dorado.png")
    ];
    this.starImg = this.getImage("./assets/images/estrella con logo.png");
    this.coalImg = this.getImage("./assets/images/carbon.png");

    this.sponsors = [
      { id: "campus", name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.png") },
      { id: "cajasan", name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.png") },
      { id: "imebu", name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.png") },
      { id: "feria", name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.png") }
    ];
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = true;
    if (e.key === " " || e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      this.dropPresent();
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") this.keyLeft = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") this.keyRight = false;
  };

  protected onStart(): void {
    const w = this.width || 1024;
    this.sleighX = w * 0.35;
    this.sleighTargetX = this.sleighX;
    this.sleighY = 165;
    this.dropCooldown = 0;

    this.chimneys = [];
    this.presents = [];
    this.bonusStars = [];
    this.scrollSpeed = 235;
    this.spawnTimer = 0.2;
    this.starSpawnTimer = 1.4;

    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;
    this.deliveredCount = 0;
    this.combo = 0;
    this.keyLeft = false;
    this.keyRight = false;

    for (let i = 0; i < 3; i++) {
      this.spawnChimney(w * 0.35 + i * 310);
    }

    this.input.onPointerDown = (_id: number, x: number) => {
      const bw = this.width || 1024;
      this.sleighTargetX = Math.max(110, Math.min(bw - 110, x));
      this.dropPresent();
    };
    this.input.onPointerMove = (_id: number, x: number) => {
      const bw = this.width || 1024;
      this.sleighTargetX = Math.max(110, Math.min(bw - 110, x));
    };

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.addFloatingText("¡SUELTA LOS REGALOS!", w / 2, this.height * 0.45, "#FFD700", 1.35);
  }

  public override destroy(): void {
    super.destroy();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.input.onPointerDown = undefined;
    this.input.onPointerMove = undefined;
  }

  private spawnChimney(startX?: number): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const x = startX ?? w + 120;

    const r = Math.random();
    let kind: ChimneyKind = "normal";
    let sponsor: SponsorInfo | undefined;

    if (r < 0.18) {
      kind = "sponsor";
      sponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
    } else if (r < 0.38) {
      kind = "golden";
    } else if (r < 0.54 && this.chimneys.length > 1) {
      kind = "soot";
    }

    const chimneyW = kind === "sponsor" || kind === "golden" ? 96 : 88;
    const chimneyH = 110 + Math.floor(Math.random() * 45);
    const roofBaseY = h - 75;

    this.chimneys.push({
      x,
      y: roofBaseY - chimneyH,
      w: chimneyW,
      h: chimneyH,
      houseW: chimneyW + 84,
      houseH: 115,
      kind,
      sponsor,
      delivered: false,
      smokePhase: Math.random() * Math.PI * 2,
      houseVariant: Math.floor(Math.random() * 2)
    });
  }

  private dropPresent(): void {
    if (this.dropCooldown > 0) return;
    this.dropCooldown = 0.22;
    this.audio.playTap();

    this.presents.push({
      x: this.sleighX + 10,
      y: this.sleighY + 34,
      vx: 38,
      vy: 140,
      rot: 0,
      vRot: (Math.random() - 0.5) * 3.2,
      spriteIdx: Math.floor(Math.random() * this.giftImgs.length),
      active: true
    });
    this.particles.emitBurst(this.sleighX + 10, this.sleighY + 34, "#FFD700", 6);
  }

  protected onUpdate(dt: number): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const roofBaseY = h - 75;

    this.scrollSpeed = 235 + Math.min(150, Math.max(0, 45 - this.timeRemaining) * 3);

    if (this.dropCooldown > 0) this.dropCooldown = Math.max(0, this.dropCooldown - dt);

    if (this.keyLeft) {
      this.sleighTargetX = Math.max(110, this.sleighTargetX - 540 * dt);
    }
    if (this.keyRight) {
      this.sleighTargetX = Math.min(w - 110, this.sleighTargetX + 540 * dt);
    }

    this.sleighX += (this.sleighTargetX - this.sleighX) * Math.min(1, dt * 12);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnChimney();
      this.spawnTimer = Math.max(0.85, 1.38 - (this.scrollSpeed - 235) * 0.002);
    }

    this.starSpawnTimer -= dt;
    if (this.starSpawnTimer <= 0) {
      this.bonusStars.push({
        x: w + 60,
        y: 255 + Math.random() * Math.max(80, roofBaseY - 420),
        r: 26,
        phase: Math.random() * Math.PI * 2,
        active: true
      });
      this.starSpawnTimer = 2.1 + Math.random() * 1.2;
    }

    for (let i = this.chimneys.length - 1; i >= 0; i--) {
      const ch = this.chimneys[i];
      ch.x -= this.scrollSpeed * dt;
      ch.y = roofBaseY - ch.h;
      ch.smokePhase += dt * 3.5;

      if (ch.x + ch.houseW < -80) {
        this.chimneys.splice(i, 1);
      }
    }

    for (let i = this.bonusStars.length - 1; i >= 0; i--) {
      const st = this.bonusStars[i];
      st.x -= this.scrollSpeed * 0.85 * dt;
      st.phase += dt * 4;
      if (st.x < -60 || !st.active) {
        this.bonusStars.splice(i, 1);
      }
    }

    const gravity = 640;
    for (let i = this.presents.length - 1; i >= 0; i--) {
      const pr = this.presents[i];
      if (!pr.active) continue;

      pr.vy += gravity * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.rot += pr.vRot * dt;

      for (const st of this.bonusStars) {
        if (!st.active) continue;
        if (Math.hypot(pr.x - st.x, pr.y - st.y) <= st.r + 24) {
          st.active = false;
          const pts = 140;
          this.addScore(pts);
          this.audio.playCatchItem(1.35);
          this.particles.emitBurst(st.x, st.y, "#FFD700", 12);
          this.addFloatingText(`¡ESTRELLA +${pts}!`, st.x, st.y, "#FFD700", 1.15);
        }
      }

      for (const ch of this.chimneys) {
        const mouthLeft = ch.x - 10;
        const mouthRight = ch.x + ch.w + 10;
        const mouthTop = ch.y - 16;
        const mouthBottom = ch.y + 34;

        if (pr.x >= mouthLeft && pr.x <= mouthRight && pr.y >= mouthTop && pr.y <= mouthBottom) {
          pr.active = false;
          this.onChimneyHit(ch, pr.x, pr.y);
          break;
        }
      }

      if (pr.active && pr.y > roofBaseY + 25) {
        pr.active = false;
        this.combo = 0;
        this.particles.emitBurst(pr.x, roofBaseY, "#FFD700", 4);
      }
    }
    this.presents = this.presents.filter((p) => p.active);
  }

  private onChimneyHit(ch: RooftopChimney, hitX: number, hitY: number): void {
    if (ch.kind === "soot") {
      this.lives--;
      this.combo = 0;
      this.audio.playElfHit();
      this.triggerShake(0.28, 9);
      this.addFloatingText("¡HOLLÍN DE CARBÓN! -1 VIDA", hitX, hitY - 12, "#FF5252", 1.2);
      if (this.lives <= 0) {
        this.endGame();
      }
      return;
    }

    ch.delivered = true;
    this.deliveredCount++;
    this.combo++;

    const comboMult = Math.min(2.5, 1 + (this.combo - 1) * 0.2);

    if (ch.kind === "sponsor" && ch.sponsor) {
      const pts = 300;
      this.addScore(pts);
      this.triggerLogoPowerUp(ch.sponsor.id, 6);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 20);
      this.addFloatingText(`¡ENTREGA ${ch.sponsor.name.toUpperCase()}! +${pts}`, hitX, hitY - 18, "#FFD700", 1.3);
    } else if (ch.kind === "golden") {
      const pts = Math.round(180 * comboMult);
      this.addScore(pts);
      this.audio.playCatchItem(1.3);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 16);
      this.addFloatingText(`¡CHIMENEA REAL +${pts}!`, hitX, hitY - 14, "#FFD700", 1.2);
    } else {
      const pts = Math.round(100 * comboMult);
      this.addScore(pts);
      this.audio.playCatchItem(1.0 + Math.min(0.5, this.combo * 0.06));
      this.particles.emitBurst(hitX, hitY, "#FFD700", 10);
      this.addFloatingText(
        this.combo > 1 ? `¡ENTREGA x${this.combo}! +${pts}` : `+${pts}`,
        hitX,
        hitY - 12,
        "#00E676",
        1.08
      );
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const roofBaseY = h - 75;
    const t = performance.now() * 0.001;

    drawNightSky(ctx, w, h, t, this.skyStars);
    if (imgReady(this.bgImg)) {
      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.drawImage(this.bgImg, 0, 0, w, h);
      ctx.restore();
    }

    // Línea guía punteada desde el trineo hacia abajo
    ctx.save();
    ctx.strokeStyle = this.isLogoPowerUpActive ? "rgba(255, 215, 0, 0.55)" : "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(this.sleighX + 10, this.sleighY + 40);
    ctx.lineTo(this.sleighX + 55, roofBaseY - 40);
    ctx.stroke();
    ctx.restore();

    for (const st of this.bonusStars) {
      if (!st.active) continue;
      const bobY = st.y + Math.sin(st.phase) * 8;
      ctx.save();
      const glow = ctx.createRadialGradient(st.x, bobY, 2, st.x, bobY, st.r * 1.6);
      glow.addColorStop(0, "rgba(255, 235, 59, 0.7)");
      glow.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(st.x, bobY, st.r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      drawFitted(ctx, this.starImg, st.x - st.r, bobY - st.r, st.r * 2, st.r * 2);
      ctx.restore();
    }

    for (const ch of this.chimneys) {
      this.drawRooftopChimney(ctx, ch, roofBaseY, t);
    }

    const snowGrad = ctx.createLinearGradient(0, roofBaseY - 12, 0, h);
    snowGrad.addColorStop(0, "#FFFFFF");
    snowGrad.addColorStop(0.35, "#E3F2FD");
    snowGrad.addColorStop(1, "#90CAF9");
    ctx.fillStyle = snowGrad;
    ctx.beginPath();
    ctx.moveTo(0, roofBaseY);
    for (let sx = 0; sx <= w + 40; sx += 40) {
      ctx.quadraticCurveTo(
        sx - 20,
        roofBaseY - 8 + Math.sin(sx * 0.04 + t * 2) * 4,
        sx,
        roofBaseY
      );
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    for (const pr of this.presents) {
      if (!pr.active) continue;
      this.drawFallingPresent(ctx, pr);
    }

    this.drawSantaSleigh(ctx, this.sleighX, this.sleighY, t);

    drawPill(ctx, `ENTREGAS EN CHIMENEA: ${this.deliveredCount}`, w / 2, 76, "#00E676", 220);
  }

  private drawRooftopChimney(
    ctx: CanvasRenderingContext2D,
    ch: RooftopChimney,
    roofBaseY: number,
    t: number
  ): void {
    ctx.save();
    const cx = ch.x + ch.w / 2;

    const houseImg = ch.houseVariant === 0 ? this.houseCleanImg : this.houseRedImg;
    if (imgReady(houseImg)) {
      ctx.globalAlpha = 0.88;
      drawFitted(ctx, houseImg, cx - ch.houseW / 2, roofBaseY - ch.houseH * 0.65, ch.houseW, ch.houseH);
      ctx.globalAlpha = 1;
    }

    const glowY = ch.y + 8;
    const halo = ctx.createRadialGradient(cx, glowY, 6, cx, glowY, 58);
    if (ch.kind === "soot") {
      halo.addColorStop(0, "rgba(255, 23, 68, 0.7)");
      halo.addColorStop(1, "rgba(255, 23, 68, 0)");
    } else if (ch.kind === "sponsor" || ch.kind === "golden") {
      halo.addColorStop(0, "rgba(255, 215, 0, 0.85)");
      halo.addColorStop(1, "rgba(255, 215, 0, 0)");
    } else {
      halo.addColorStop(0, "rgba(0, 230, 118, 0.6)");
      halo.addColorStop(1, "rgba(0, 230, 118, 0)");
    }
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, glowY, 58, 0, Math.PI * 2);
    ctx.fill();

    if (imgReady(this.chimneyImg)) {
      ctx.drawImage(this.chimneyImg, ch.x, ch.y, ch.w, ch.h + 10);
    } else {
      ctx.fillStyle = "#B71C1C";
      roundRectPath(ctx, ch.x, ch.y, ch.w, ch.h, 8);
      ctx.fill();
    }

    if (ch.kind === "golden" || ch.kind === "sponsor") {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3.5;
      roundRectPath(ctx, ch.x + 2, ch.y + 4, ch.w - 4, ch.h - 4, 10);
      ctx.stroke();
    }

    if (ch.kind === "sponsor" && ch.sponsor) {
      drawSponsorMedallion(ctx, ch.sponsor.logo, cx, ch.y + ch.h * 0.52, 26);
    }

    if (ch.kind === "soot") {
      const puffY = ch.y - 18 + Math.sin(t * 5 + ch.smokePhase) * 6;
      ctx.fillStyle = "rgba(38, 50, 56, 0.9)";
      ctx.strokeStyle = "#FF5252";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, puffY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawFitted(ctx, this.coalImg, cx - 18, puffY - 18, 36, 36);
    } else if (ch.delivered) {
      drawFitted(ctx, this.starImg, cx - 18, ch.y - 26, 36, 36);
    }

    ctx.restore();
  }

  private drawFallingPresent(ctx: CanvasRenderingContext2D, pr: FallingPresent): void {
    ctx.save();
    ctx.translate(pr.x, pr.y);

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.lineTo(-6, -4);
    ctx.moveTo(18, -22);
    ctx.lineTo(6, -4);
    ctx.stroke();

    const domeGrad = ctx.createLinearGradient(-22, -38, 22, -20);
    domeGrad.addColorStop(0, "#FF2A4D");
    domeGrad.addColorStop(0.5, "#FFFDE7");
    domeGrad.addColorStop(1, "#00E676");
    ctx.fillStyle = domeGrad;
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -22, 22, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.rotate(pr.rot * 0.25);
    const spr = this.giftImgs[pr.spriteIdx];
    drawFitted(ctx, spr, -22, -16, 44, 44);
    ctx.restore();
  }

  private drawSantaSleigh(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    t: number
  ): void {
    ctx.save();
    const bobY = y + Math.sin(t * 3.5) * 6;
    ctx.translate(x, bobY);

    const trailGrad = ctx.createLinearGradient(-115, 0, 0, 0);
    trailGrad.addColorStop(0, "rgba(255, 215, 0, 0)");
    trailGrad.addColorStop(1, "rgba(255, 215, 0, 0.55)");
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-115, -6);
    ctx.lineTo(-10, -16);
    ctx.lineTo(-10, 18);
    ctx.lineTo(-115, 8);
    ctx.closePath();
    ctx.fill();

    drawFitted(ctx, this.sleighImg, -82, -52, 164, 104);
    ctx.restore();
  }
}
