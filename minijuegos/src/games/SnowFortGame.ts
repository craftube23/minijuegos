/**
 * ==============================================================================
 * MINIJUEGO: ¡DEFENSA DEL FUERTE DE NIEVE! (Snow Fort Battle Defense)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Mecánica:
 * - Defiende el gran fuerte de hielo y nieve de la aldea navideña.
 * - Muñecos de nieve traviesos, pingüinos con regalos y muñecos dorados asoman
 *   por las almenas y torres del castillo.
 * - Toca o haz clic en cualquier objetivo para lanzar bolas de nieve a toda velocidad.
 * - Estandarte de Patrocinador: activa la ¡Mega Ráfaga de Nieve! (lanza ráfagas triples).
 * - Muñeco de Carbón / Hollín: esquívalo, si le disparas te resta vidas.
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

type TargetKind = "snowman" | "elf-gift" | "golden-king" | "sponsor" | "soot";

interface SponsorInfo {
  id: string;
  name: string;
  logo: HTMLImageElement;
}

interface FortSpot {
  x: number; // 0..1 normalizado a ancho
  y: number; // Y de la almena
  depth: number; // 0 = torre trasera, 1 = muro delantero
  target: FortTarget | null;
}

interface FortTarget {
  kind: TargetKind;
  sponsor?: SponsorInfo;
  riseProgress: number; // 0..1 (0 escondido, 1 asomado completo)
  state: "rising" | "waiting" | "hiding" | "hit";
  waitTimer: number;
  hitTimer: number;
  w: number;
  h: number;
}

interface FlyingSnowball {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0..1
  scale: number;
  arcHeight: number;
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

export class SnowFortGame extends BaseGame {
  private spots: FortSpot[] = [];
  private snowballs: FlyingSnowball[] = [];

  private spawnCooldown = 0.5;
  private combo = 0;
  private hitsCount = 0;
  private tripleBurstTimer = 0;

  private skyStars = makeSkyStars(64);

  // Assets 2D
  private bgImg: HTMLImageElement;
  private snowmanImg: HTMLImageElement;
  private giftImg: HTMLImageElement;
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
      "snow-fort",
      "¡Defensa del Fuerte de Nieve!",
      "¡Toca para lanzar bolas de nieve a los muñecos y duendes que asoman por las almenas del castillo!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/jingle-bells.mp3";
    this.inGameMusicVolume = 0.44;

    this.bgImg = this.getImage("./assets/images/fondo-villa-montanas.jpg");
    this.snowmanImg = this.getImage("./assets/images/obstaculo-muneco.png");
    this.giftImg = this.getImage("./assets/images/regalo-estilizado-dorado.png");
    this.starImg = this.getImage("./assets/images/estrella con logo.png");
    this.coalImg = this.getImage("./assets/images/carbon.png");

    this.sponsors = [
      { id: "campus", name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.png") },
      { id: "cajasan", name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.png") },
      { id: "imebu", name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.png") },
      { id: "feria", name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.png") }
    ];
  }

  protected onStart(): void {
    const w = this.width || 1024;
    const h = this.height || 768;

    this.snowballs = [];
    this.spawnCooldown = 0.4;
    this.combo = 0;
    this.hitsCount = 0;
    this.tripleBurstTimer = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;

    // Configurar 6 posiciones estratégicas en el fuerte
    this.spots = [
      { x: w * 0.18, y: h * 0.42, depth: 0, target: null }, // Torre izquierda
      { x: w * 0.82, y: h * 0.42, depth: 0, target: null }, // Torre derecha
      { x: w * 0.35, y: h * 0.52, depth: 1, target: null }, // Almena frontal izquierda
      { x: w * 0.50, y: h * 0.45, depth: 0.5, target: null }, // Almena central
      { x: w * 0.65, y: h * 0.52, depth: 1, target: null }, // Almena frontal derecha
      { x: w * 0.50, y: h * 0.64, depth: 1, target: null }  // Puerta / parapeto bajo
    ];

    this.input.onPointerDown = (_id: number, px: number, py: number) => {
      this.throwSnowball(px, py);
    };

    this.addFloatingText("¡LANZA BOLAS DE NIEVE!", w / 2, h * 0.45, "#FFD700", 1.35);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onPointerDown = undefined;
  }

  private throwSnowball(tx: number, ty: number): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    this.audio.playWhoosh();

    if (this.tripleBurstTimer > 0) {
      // Disparo triple en abanico
      for (const off of [-40, 0, 40]) {
        this.snowballs.push({
          startX: w / 2 + off * 0.8,
          startY: h + 10,
          targetX: tx + off,
          targetY: ty,
          progress: 0,
          scale: 1,
          arcHeight: 50 + Math.random() * 20,
          active: true
        });
      }
    } else {
      this.snowballs.push({
        startX: w / 2 + (Math.random() - 0.5) * 80,
        startY: h + 10,
        targetX: tx,
        targetY: ty,
        progress: 0,
        scale: 1,
        arcHeight: 60,
        active: true
      });
    }
  }

  protected onUpdate(dt: number): void {
    const w = this.width || 1024;
    const h = this.height || 768;

    if (this.tripleBurstTimer > 0) {
      this.tripleBurstTimer = Math.max(0, this.tripleBurstTimer - dt);
    }

    // Actualizar posiciones de las almenas si cambió el tamaño
    this.spots[0].x = w * 0.18; this.spots[0].y = h * 0.42;
    this.spots[1].x = w * 0.82; this.spots[1].y = h * 0.42;
    this.spots[2].x = w * 0.35; this.spots[2].y = h * 0.52;
    this.spots[3].x = w * 0.50; this.spots[3].y = h * 0.45;
    this.spots[4].x = w * 0.65; this.spots[4].y = h * 0.52;
    this.spots[5].x = w * 0.50; this.spots[5].y = h * 0.64;

    // Gestionar asomado y ocultación de objetivos en los spots
    for (const spot of this.spots) {
      const tgt = spot.target;
      if (!tgt) continue;

      if (tgt.state === "rising") {
        tgt.riseProgress += dt * 4.2;
        if (tgt.riseProgress >= 1) {
          tgt.riseProgress = 1;
          tgt.state = "waiting";
        }
      } else if (tgt.state === "waiting") {
        tgt.waitTimer -= dt;
        if (tgt.waitTimer <= 0) {
          tgt.state = "hiding";
        }
      } else if (tgt.state === "hiding") {
        tgt.riseProgress -= dt * 4.0;
        if (tgt.riseProgress <= 0) {
          spot.target = null;
        }
      } else if (tgt.state === "hit") {
        tgt.hitTimer -= dt;
        tgt.riseProgress -= dt * 3.5;
        if (tgt.hitTimer <= 0 || tgt.riseProgress <= 0) {
          spot.target = null;
        }
      }
    }

    // Generar nuevos objetivos
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0) {
      this.spawnNewTarget();
      this.spawnCooldown = 0.55 + Math.random() * 0.45;
    }

    // Mover bolas de nieve en vuelo
    const flightSpeed = 3.6;
    for (const sb of this.snowballs) {
      if (!sb.active) continue;

      sb.progress += dt * flightSpeed;
      if (sb.progress >= 1) {
        sb.progress = 1;
        sb.active = false;
        this.onSnowballImpact(sb.targetX, sb.targetY);
      }
    }
    this.snowballs = this.snowballs.filter((s) => s.active);
  }

  private spawnNewTarget(): void {
    const freeSpots = this.spots.filter((s) => s.target === null);
    if (freeSpots.length === 0) return;

    const spot = freeSpots[Math.floor(Math.random() * freeSpots.length)];
    const r = Math.random();
    let kind: TargetKind = "snowman";
    let sponsor: SponsorInfo | undefined;
    let waitTime = 1.35;

    if (r < 0.18) {
      kind = "sponsor";
      sponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
      waitTime = 1.6;
    } else if (r < 0.36) {
      kind = "golden-king";
      waitTime = 1.1;
    } else if (r < 0.52) {
      kind = "soot";
      waitTime = 1.4;
    } else if (r < 0.72) {
      kind = "elf-gift";
      waitTime = 1.3;
    }

    spot.target = {
      kind,
      sponsor,
      riseProgress: 0,
      state: "rising",
      waitTimer: waitTime,
      hitTimer: 0.3,
      w: 88,
      h: 96
    };
  }

  private onSnowballImpact(x: number, y: number): void {
    this.audio.playCatchItem(1.2);
    this.particles.emitBurst(x, y, "#FFFFFF", 12);

    let hitAny = false;
    for (const spot of this.spots) {
      const tgt = spot.target;
      if (!tgt || tgt.state === "hit" || tgt.riseProgress < 0.3) continue;

      const tgtH = tgt.h * tgt.riseProgress;
      const tgtTop = spot.y - tgtH;
      const tgtBottom = spot.y + 10;
      const tgtLeft = spot.x - tgt.w / 2;
      const tgtRight = spot.x + tgt.w / 2;

      if (x >= tgtLeft && x <= tgtRight && y >= tgtTop && y <= tgtBottom) {
        hitAny = true;
        tgt.state = "hit";
        this.onTargetHit(tgt, spot.x, spot.y - tgtH / 2);
        break;
      }
    }

    if (!hitAny) {
      this.combo = 0;
    }
  }

  private onTargetHit(tgt: FortTarget, hitX: number, hitY: number): void {
    if (tgt.kind === "soot") {
      this.lives--;
      this.combo = 0;
      this.audio.playElfHit();
      this.triggerShake(0.3, 9);
      this.addFloatingText("¡CARBÓN TRAVIESO! -1 VIDA", hitX, hitY - 14, "#FF5252", 1.25);
      if (this.lives <= 0) {
        this.endGame();
      }
      return;
    }

    this.hitsCount++;
    this.combo++;
    const comboMult = Math.min(2.5, 1 + (this.combo - 1) * 0.2);

    if (tgt.kind === "sponsor" && tgt.sponsor) {
      const pts = 350;
      this.addScore(pts);
      this.tripleBurstTimer = 7.0;
      this.triggerLogoPowerUp(tgt.sponsor.id, 7);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 24);
      this.addFloatingText(`¡${tgt.sponsor.name.toUpperCase()} RÁFAGA TRIPLE! +${pts}`, hitX, hitY - 18, "#FFD700", 1.35);
    } else if (tgt.kind === "golden-king") {
      const pts = Math.round(220 * comboMult);
      this.addScore(pts);
      this.audio.playCatchItem(1.4);
      this.particles.emitBurst(hitX, hitY, "#FFD700", 18);
      this.addFloatingText(`¡REY DE LA NIEVE +${pts}!`, hitX, hitY - 14, "#FFD700", 1.2);
    } else if (tgt.kind === "elf-gift") {
      const pts = Math.round(130 * comboMult);
      this.addScore(pts);
      this.audio.playCatchItem(1.15);
      this.particles.emitBurst(hitX, hitY, "#00E5FF", 14);
      this.addFloatingText(`¡REGALO RESCATADO +${pts}!`, hitX, hitY - 12, "#00E5FF", 1.15);
    } else {
      const pts = Math.round(80 * comboMult);
      this.addScore(pts);
      this.audio.playCatchItem(1.0 + Math.min(0.5, this.combo * 0.05));
      this.particles.emitBurst(hitX, hitY, "#FFFFFF", 10);
      this.addFloatingText(this.combo > 1 ? `¡IMPACTO x${this.combo}! +${pts}` : `+${pts}`, hitX, hitY - 12, "#00E676", 1.08);
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const t = performance.now() * 0.001;

    // 1. Cielo estrellado y villa de montaña
    drawNightSky(ctx, w, h, t, this.skyStars);
    if (imgReady(this.bgImg)) {
      ctx.save();
      ctx.globalAlpha = 0.44;
      ctx.drawImage(this.bgImg, 0, 0, w, h);
      ctx.restore();
    }

    // 2. Objetos de torre trasera (depth = 0)
    for (const spot of this.spots) {
      if (spot.depth === 0 && spot.target) {
        this.drawTarget(ctx, spot, spot.target);
      }
    }

    // 3. Estructura de muralla y castillo nevado
    this.drawFortressStructure(ctx, w, h, t);

    // 4. Objetos de almena frontal (depth > 0)
    for (const spot of this.spots) {
      if (spot.depth > 0 && spot.target) {
        this.drawTarget(ctx, spot, spot.target);
      }
    }

    // 5. Parapeto frontal inferior que oculta las bases de los muñecos
    this.drawFrontParapets(ctx, w, h);

    // 6. Bolas de nieve en vuelo hacia sus objetivos
    for (const sb of this.snowballs) {
      if (!sb.active) continue;
      this.drawFlyingSnowball(ctx, sb);
    }

    // 7. Píldoras de estado y power-up
    drawPill(ctx, `ACIERTO DE NIEVE: ${this.hitsCount}`, w / 2, 76, "#00E5FF", 220);

    if (this.tripleBurstTimer > 0) {
      drawPill(
        ctx,
        `¡MEGA RÁFAGA TRIPLE! (${this.tripleBurstTimer.toFixed(1)}s)`,
        w / 2,
        112,
        "#FFD700",
        280
      );
    }
  }

  private drawFortressStructure(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number
  ): void {
    ctx.save();

    // Torres laterales de nieve y madera
    const drawTower = (tx: number, ty: number, tw: number, th: number) => {
      const grad = ctx.createLinearGradient(tx, ty, tx, ty + th);
      grad.addColorStop(0, "#E1F5FE");
      grad.addColorStop(0.5, "#B3E5FC");
      grad.addColorStop(1, "#81D4FA");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      roundRectPath(ctx, tx, ty, tw, th, 14);
      ctx.fill();
      ctx.stroke();

      // Almenas superiores de la torre
      const battW = tw / 3;
      ctx.fillStyle = "#FFFFFF";
      roundRectPath(ctx, tx, ty - 16, battW * 0.8, 18, 4);
      ctx.fill();
      roundRectPath(ctx, tx + tw - battW * 0.8, ty - 16, battW * 0.8, 18, 4);
      ctx.fill();

      // Banderín navideño ondulante en la cima
      ctx.save();
      ctx.strokeStyle = "#B71C1C";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx + tw / 2, ty - 16);
      ctx.lineTo(tx + tw / 2, ty - 56);
      ctx.stroke();

      ctx.fillStyle = "#FF2A4D";
      ctx.beginPath();
      ctx.moveTo(tx + tw / 2, ty - 56);
      ctx.lineTo(tx + tw / 2 + 28 + Math.sin(t * 4) * 4, ty - 46);
      ctx.lineTo(tx + tw / 2, ty - 36);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawTower(w * 0.11, h * 0.38, 140, 240);
    drawTower(w * 0.75, h * 0.38, 140, 240);

    // Muralla central
    const wallX = w * 0.22;
    const wallY = h * 0.46;
    const wallW = w * 0.56;
    const wallH = h * 0.28;

    const wallGrad = ctx.createLinearGradient(wallX, wallY, wallX, wallY + wallH);
    wallGrad.addColorStop(0, "#FFFFFF");
    wallGrad.addColorStop(0.4, "#E1F5FE");
    wallGrad.addColorStop(1, "#90CAF9");
    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    roundRectPath(ctx, wallX, wallY, wallW, wallH, 18);
    ctx.fill();
    ctx.stroke();

    // Dientes de almena central
    const count = 5;
    const bw = wallW / (count * 2 - 1);
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < count; i++) {
      roundRectPath(ctx, wallX + i * bw * 2, wallY - 18, bw, 20, 6);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawFrontParapets(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    // Parapeto nevado bajo frontal
    const py = h * 0.65;
    const grad = ctx.createLinearGradient(0, py, 0, h);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.2, "#E0F7FA");
    grad.addColorStop(1, "#80DEEA");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, py + 14);
    for (let x = 0; x <= w + 40; x += 40) {
      ctx.quadraticCurveTo(x - 20, py, x, py + 14);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawTarget(ctx: CanvasRenderingContext2D, spot: FortSpot, tgt: FortTarget): void {
    ctx.save();
    const cx = spot.x;
    const cy = spot.y;
    const h = tgt.h * tgt.riseProgress;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - tgt.w, cy - tgt.h - 30, tgt.w * 2, tgt.h + 30);
    ctx.clip();

    ctx.translate(cx, cy - h);

    if (tgt.kind === "sponsor" && tgt.sponsor) {
      // Estandarte real con escudo de patrocinador
      ctx.fillStyle = "#FFD700";
      roundRectPath(ctx, -tgt.w * 0.45, -tgt.h * 0.5, tgt.w * 0.9, tgt.h * 0.9, 14);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.stroke();
      drawSponsorMedallion(ctx, tgt.sponsor.logo, 0, 0, tgt.w * 0.35);
    } else if (tgt.kind === "golden-king") {
      drawFitted(ctx, this.snowmanImg, -tgt.w / 2, -tgt.h / 2, tgt.w, tgt.h);
      drawFitted(ctx, this.starImg, -20, -tgt.h * 0.65, 40, 40);
    } else if (tgt.kind === "elf-gift") {
      drawFitted(ctx, this.giftImg, -tgt.w / 2, -tgt.h / 2, tgt.w, tgt.h);
    } else if (tgt.kind === "soot") {
      drawFitted(ctx, this.coalImg, -tgt.w / 2, -tgt.h / 2, tgt.w, tgt.h);
    } else {
      drawFitted(ctx, this.snowmanImg, -tgt.w / 2, -tgt.h / 2, tgt.w, tgt.h);
    }

    ctx.restore();
    ctx.restore();
  }

  private drawFlyingSnowball(ctx: CanvasRenderingContext2D, sb: FlyingSnowball): void {
    ctx.save();
    const p = sb.progress;
    const curX = sb.startX + (sb.targetX - sb.startX) * p;
    const lineY = sb.startY + (sb.targetY - sb.startY) * p;
    const curY = lineY - Math.sin(p * Math.PI) * sb.arcHeight;
    const radius = 22 * (1 - p * 0.45);

    // Estela de copos
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(curX - 6, curY + 6, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Bola de nieve principal
    const grad = ctx.createRadialGradient(curX - radius * 0.3, curY - radius * 0.3, 2, curX, curY, radius);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.7, "#E1F5FE");
    grad.addColorStop(1, "#B3E5FC");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(curX, curY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
