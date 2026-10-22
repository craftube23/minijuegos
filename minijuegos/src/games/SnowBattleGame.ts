/**
 * ==============================================================================
 * MINIJUEGO #16: ¡BATALLA DE NIEVE! (Top-down shooter con joystick virtual)
 * ==============================================================================
 * Rodolfo el Reno defiende la plaza nevada de la feria contra oleadas de
 * muñecos de nieve malvados, duendes traviesos y un mini-jefe Yeti.
 *
 * - Movimiento 360° con joystick virtual flotante (o WASD / Flechas).
 * - Auto-apuntado y disparo automático continuo de bolas de nieve.
 * - 3 corazones, parpadeo e invulnerabilidad temporal tras recibir daño.
 * - Power-ups: disparo triple, escudo de nariz brillante, galleta (+1 vida)
 *   y logo de patrocinador (x2 puntos vía triggerLogoPowerUp()).
 * - Combos por eliminaciones consecutivas (se reinicia al recibir daño).
 *
 * ASSETS (./assets/images/) — si un PNG aún no existe se dibuja un fallback vectorial:
 *   rodolfo-battle-down-1.png, rodolfo-battle-up-1.png, rodolfo-battle-side-1.png,
 *   rodolfo-battle-hit.png, snowman-evil-1.png, snowman-evil-hit.png,
 *   elf-mischief-1.png, yeti-boss-1.png, yeti-boss-hit.png, snowball-proj.png,
 *   pu-triple.png, pu-shield.png, pu-cookie.png, heart-ui.png,
 *   fondo-plaza-nevada.png, snow-battle-portada.png (portada del menú)
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";
import { VirtualJoystick } from "./shared/VirtualJoystick";

type EnemyKind = "snowman" | "elf" | "yeti";
type PowerUpKind = "triple" | "shield" | "cookie" | "logo";
type FacingDir = "down" | "up" | "side";

interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  hitFlash: number;
  shieldTick: number;
  wobble: number;
}

interface Snowball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface PowerUp {
  kind: PowerUpKind;
  x: number;
  y: number;
  life: number;
  bob: number;
  sponsorId?: string;
}

const PLAYER_SPEED = 320;
const PLAYER_RADIUS = 34;
const FIRE_INTERVAL = 0.4;
const SNOWBALL_SPEED = 620;
const INVULNERABLE_TIME = 1.2;
const TRIPLE_TIME = 8;
const SHIELD_TIME = 6;
const POWERUP_LIFE = 8;
const DROP_CHANCE = 0.18;

function imgReady(img: HTMLImageElement | null | undefined): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

export class SnowBattleGame extends BaseGame {
  private joystick: VirtualJoystick;

  /**
   * Ratios normalizados (0.0 a 1.0) del área jugable dentro de la textura de fondo.
   * Si la imagen de fondo cambia o se escala, los límites se adaptan automáticamente.
   */
  public arenaRatios = {
    minX: 0.135,
    maxX: 0.865,
    minY: 0.14,
    maxY: 0.835
  };

  /**
   * Permite reconfigurar dinámicamente los ratios límite de la arena de combate.
   */
  public setArenaLimits(ratios: { minX: number; maxX: number; minY: number; maxY: number }): void {
    this.arenaRatios = { ...ratios };
  }

  // Jugador (Rodolfo)
  private px = 0;
  private py = 0;
  private pvx = 0;
  private pvy = 0;
  private facing: FacingDir = "down";
  private facingLeft = false;
  private invulnerable = 0;
  private fireTimer = 0;
  private tripleTimer = 0;
  private shieldTimer = 0;
  private walkAnim = 0;

  // Entidades
  private enemies: Enemy[] = [];
  private snowballs: Snowball[] = [];
  private powerUps: PowerUp[] = [];
  private survivalTime = 0;
  private nextYetiTime = 28;
  private spawnTimer = 0;
  private combo = 0;
  private comboPulse = 0;
  private lastDt = 1 / 60;

  // Copos decorativos de fondo
  private flakes: { x: number; y: number; r: number; vy: number; vx: number }[] = [];

  // Sprites
  private rodolfoDownImg: HTMLImageElement;
  private rodolfoUpImg: HTMLImageElement;
  private rodolfoSideImg: HTMLImageElement;
  private rodolfoHitImg: HTMLImageElement;
  private snowmanImg: HTMLImageElement;
  private snowmanHitImg: HTMLImageElement;
  private elfImg: HTMLImageElement;
  private yetiImg: HTMLImageElement;
  private yetiHitImg: HTMLImageElement;
  private snowballImg: HTMLImageElement;
  private puTripleImg: HTMLImageElement;
  private puShieldImg: HTMLImageElement;
  private puCookieImg: HTMLImageElement;
  private heartImg: HTMLImageElement;
  private backgroundImg: HTMLImageElement;

  public onOpenTutorial?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "snow-battle",
      "¡Batalla de Nieve!",
      "¡Mueve a Rodolfo con el joystick, dispara bolas de nieve automáticamente y defiende la plaza de muñecos malvados, duendes y el Yeti!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/Jingle Bells.mp3";
    this.inGameMusicVolume = 0.45;

    this.joystick = new VirtualJoystick(canvas, () => ({ width: this.width, height: this.height }));

    const base = "./assets/images/";
    this.rodolfoDownImg = this.getImage(base + "rodolfo-battle-down-1.png");
    this.rodolfoUpImg = this.getImage(base + "rodolfo-battle-up-1.png");
    this.rodolfoSideImg = this.getImage(base + "rodolfo-battle-side-1.png");
    this.rodolfoHitImg = this.getImage(base + "rodolfo-battle-hit.png");
    this.snowmanImg = this.getImage(base + "snowman-evil-1.png");
    this.snowmanHitImg = this.getImage(base + "snowman-evil-hit.png");
    this.elfImg = this.getImage(base + "elf-mischief-1.png");
    this.yetiImg = this.getImage(base + "yeti-boss-1.png");
    this.yetiHitImg = this.getImage(base + "yeti-boss-hit.png");
    this.snowballImg = this.getImage(base + "snowball-proj.png");
    this.puTripleImg = this.getImage(base + "pu-triple.png");
    this.puShieldImg = this.getImage(base + "pu-shield.png");
    this.puCookieImg = this.getImage(base + "pu-cookie.png");
    this.heartImg = this.getImage(base + "heart-ui.png");
    this.backgroundImg = this.getImage(base + "fondo-plaza-nevada.png");

    for (let i = 0; i < 60; i++) {
      this.flakes.push({
        x: Math.random() * 1600,
        y: Math.random() * 1600,
        r: 1.2 + Math.random() * 2.8,
        vy: 30 + Math.random() * 60,
        vx: -15 + Math.random() * 30
      });
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning || this.isGameOver) return;
    if (e.key === "h" || e.key === "H" || e.key === "?") {
      if (this.onOpenTutorial) this.onOpenTutorial();
    }
  };

  protected onStart(): void {
    const w = this.width || 1024;
    const h = this.height || 768;

    // Modo supervivencia por vidas (sin límite de tiempo)
    this.showTimer = false;
    this.timeRemaining = 999999;
    this.lives = 3;
    this.maxLives = 3;
    this.showLives = true;
    this.survivalTime = 0;
    this.nextYetiTime = 28;

    this.px = w / 2;
    this.py = h * 0.6;
    this.pvx = 0;
    this.pvy = 0;
    this.facing = "down";
    this.facingLeft = false;
    this.invulnerable = 0;
    this.fireTimer = 0;
    this.tripleTimer = 0;
    this.shieldTimer = 0;
    this.walkAnim = 0;

    this.enemies = [];
    this.snowballs = [];
    this.powerUps = [];
    this.spawnTimer = 0.6;
        this.combo = 0;
    this.comboPulse = 0;

    this.joystick.detach();
    this.joystick.attach();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keydown", this.handleKeyDown);

    this.addFloatingText("¡DEFIENDE LA PLAZA!", w / 2, h * 0.42, "#FFD700", 1.4);
  }

  public override endGame(extraData?: Parameters<BaseGame["endGame"]>[0]): void {
    this.joystick.detach();
    window.removeEventListener("keydown", this.handleKeyDown);
    super.endGame(extraData);
  }

  public override destroy(): void {
    super.destroy();
    this.joystick.detach();
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private get elapsed(): number {
    return this.survivalTime;
  }

  private get comboMultiplier(): number {
    return Math.min(3, 1 + Math.floor(this.combo / 5) * 0.5);
  }

  // ==========================================================================
  // ACTUALIZACIÓN
  // ==========================================================================

  protected onUpdate(dt: number): void {
    this.lastDt = dt;
    const w = this.width || 1024;
    const h = this.height || 768;

    this.updateFlakes(dt, w, h);
    if (this.isFinishing) return;
    this.survivalTime += dt;

    this.updatePlayer(dt, w, h);
    this.updateSpawning(dt, w, h);
    this.updateFiring(dt);
    this.updateSnowballs(dt, w, h);
    this.updateEnemies(dt);
    this.updatePowerUps(dt);

    if (this.comboPulse > 0) this.comboPulse -= dt;
  }

  private updateFlakes(dt: number, w: number, h: number): void {
    for (const f of this.flakes) {
      f.y += f.vy * dt;
      f.x += f.vx * dt;
      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
      if (f.x < -5) f.x = w + 5;
      if (f.x > w + 5) f.x = -5;
    }
  }

  /**
   * Recuadro central de juego: delimita el área de combate en la plaza nevada.
   * Ni Rodolfo ni sus bolas de nieve pueden salir de este recuadro.
   */
  public getArenaBounds(): { left: number; right: number; top: number; bottom: number; width: number; height: number } {
    const w = this.width || 1024;
    const h = this.height || 768;

    let left: number;
    let right: number;
    let top: number;
    let bottom: number;

    if (imgReady(this.backgroundImg)) {
      const img = this.backgroundImg;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;

      // Límites calculados dinámicamente a partir de la escala y posición de la imagen de fondo
      left = Math.round(dx + this.arenaRatios.minX * dw);
      right = Math.round(dx + this.arenaRatios.maxX * dw);
      top = Math.round(dy + this.arenaRatios.minY * dh);
      bottom = Math.round(dy + this.arenaRatios.maxY * dh);

      // Márgenes de seguridad para respetar el HUD superior y límites de pantalla
      top = Math.max(72, top);
      bottom = Math.min(h - 18, bottom);
      left = Math.max(16, left);
      right = Math.min(w - 16, right);
    } else {
      left = Math.round(w * 0.12);
      right = Math.round(w * 0.88);
      top = 80;
      bottom = h - 25;
    }

    return {
      left,
      right,
      top,
      bottom,
      width: Math.max(100, right - left),
      height: Math.max(100, bottom - top)
    };
  }

  private updatePlayer(dt: number, _w: number, _h: number): void {
    const js = this.joystick;
    const targetVx = js.x * js.magnitude * PLAYER_SPEED;
    const targetVy = js.y * js.magnitude * PLAYER_SPEED;
    const accel = Math.min(1, dt * 12);
    this.pvx += (targetVx - this.pvx) * accel;
    this.pvy += (targetVy - this.pvy) * accel;

    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    // Confinar a Rodolfo estrictamente dentro del recuadro central
    const bounds = this.getArenaBounds();
    this.px = Math.max(bounds.left + PLAYER_RADIUS, Math.min(bounds.right - PLAYER_RADIUS, this.px));
    this.py = Math.max(bounds.top + PLAYER_RADIUS, Math.min(bounds.bottom - PLAYER_RADIUS, this.py));

    if (js.magnitude > 0.05) {
      this.walkAnim += dt * 10 * js.magnitude;
      if (Math.abs(js.x) > Math.abs(js.y)) {
        this.facing = "side";
        this.facingLeft = js.x < 0;
      } else {
        this.facing = js.y < 0 ? "up" : "down";
      }
    }

    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.tripleTimer > 0) this.tripleTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
  }

  private updateSpawning(dt: number, w: number, h: number): void {
    const t = this.survivalTime;

    // Aparición periódica del Mini-Jefe Yeti en modo supervivencia
    if (t >= this.nextYetiTime) {
      this.nextYetiTime = t + 40;
      this.spawnEnemy("yeti", w, h);
      this.addFloatingText("¡ALERTA: YETI!", w / 2, h * 0.35, "#00E5FF", 1.6);
      this.triggerShake(0.5, 9);
      this.audio.playRunnerHit();
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const progress = Math.min(2.5, t / 60);
      this.spawnTimer = Math.max(0.38, 0.95 - 0.22 * progress);
      const elfChance = Math.min(0.65, 0.35 + 0.15 * progress);
      this.spawnEnemy(Math.random() < elfChance ? "elf" : "snowman", w, h);
      if (t > 10 && Math.random() < Math.min(0.55, 0.25 + 0.15 * progress)) {
        this.spawnEnemy(Math.random() < elfChance ? "elf" : "snowman", w, h);
      }
    }
  }

  private spawnEnemy(kind: EnemyKind, _w: number, _h: number): void {
    const bounds = this.getArenaBounds();
    const side = Math.floor(Math.random() * 4);
    const offset = 48;
    let x = 0;
    let y = 0;
    if (side === 0) {
      // Arriba del recuadro
      x = bounds.left + Math.random() * bounds.width;
      y = bounds.top - offset;
    } else if (side === 1) {
      // Derecha del recuadro
      x = bounds.right + offset;
      y = bounds.top + Math.random() * bounds.height;
    } else if (side === 2) {
      // Abajo del recuadro
      x = bounds.left + Math.random() * bounds.width;
      y = bounds.bottom + offset;
    } else {
      // Izquierda del recuadro
      x = bounds.left - offset;
      y = bounds.top + Math.random() * bounds.height;
    }

    // Evitar aparecer inmediatamente encima de Rodolfo
    if (Math.hypot(x - this.px, y - this.py) < 180) {
      x = this.px < (bounds.left + bounds.right) / 2 ? bounds.right + offset : bounds.left - offset;
    }

    const stats: Record<EnemyKind, { r: number; hp: number; speed: number }> = {
      snowman: { r: 36, hp: 2, speed: 90 },
      elf: { r: 26, hp: 1, speed: 195 },
      yeti: { r: 72, hp: 10, speed: 60 }
    };
    const s = stats[kind];
    this.enemies.push({
      kind, x, y,
      r: s.r,
      hp: s.hp,
      maxHp: s.hp,
      speed: s.speed * (1 + Math.min(0.35, this.elapsed / 120)),
      hitFlash: 0,
      shieldTick: 0,
      wobble: Math.random() * Math.PI * 2
    });
  }

  private findNearestEnemy(): Enemy | null {
    const bounds = this.getArenaBounds();
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      // No disparar fuera del recuadro central: solo apuntar a enemigos dentro de la plaza
      const insideArena =
        e.x >= bounds.left - 8 &&
        e.x <= bounds.right + 8 &&
        e.y >= bounds.top - 8 &&
        e.y <= bounds.bottom + 8;

      if (insideArena) {
        const d = Math.hypot(e.x - this.px, e.y - this.py);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
    }
    return best;
  }

  private updateFiring(dt: number): void {
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;
    const target = this.findNearestEnemy();
    if (!target) return;
    this.fireTimer = FIRE_INTERVAL;

    const baseAngle = Math.atan2(target.y - this.py, target.x - this.px);
    const spread = (14 * Math.PI) / 180;
    const angles = this.tripleTimer > 0 ? [baseAngle - spread, baseAngle, baseAngle + spread] : [baseAngle];
    for (const a of angles) {
      this.snowballs.push({
        x: this.px + Math.cos(a) * 30,
        y: this.py + Math.sin(a) * 30,
        vx: Math.cos(a) * SNOWBALL_SPEED,
        vy: Math.sin(a) * SNOWBALL_SPEED,
        life: 1.6
      });
    }
    this.audio.playWhoosh();
  }

  private updateSnowballs(dt: number, _w: number, _h: number): void {
    const bounds = this.getArenaBounds();
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const b = this.snowballs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // El proyectil no puede viajar fuera del recuadro central
      const hitWall =
        b.x <= bounds.left ||
        b.x >= bounds.right ||
        b.y <= bounds.top ||
        b.y >= bounds.bottom;

      let consumed = b.life <= 0 || hitWall;
      if (hitWall) {
        // Impacto contra el borde nevado del recuadro
        const clampX = Math.max(bounds.left, Math.min(bounds.right, b.x));
        const clampY = Math.max(bounds.top, Math.min(bounds.bottom, b.y));
        this.particles.emitBurst(clampX, clampY, "#E0F7FA", 6);
        this.particles.emitBurst(clampX, clampY, "#FFFFFF", 4);
      } else if (!consumed) {
        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 10) {
            this.damageEnemy(e, 1);
            this.particles.emitBurst(b.x, b.y, "#FFFFFF", 8);
            consumed = true;
            break;
          }
        }
      }
      if (consumed) this.snowballs.splice(i, 1);
    }
    this.removeDeadEnemies();
  }

  private damageEnemy(e: Enemy, amount: number): void {
    e.hp -= amount;
    e.hitFlash = 0.15;
    if (e.hp <= 0) this.onEnemyDefeated(e);
  }

  private onEnemyDefeated(e: Enemy): void {
    this.combo++;
    this.comboPulse = 0.35;
    const basePoints = e.kind === "yeti" ? 1500 : e.kind === "snowman" ? 100 : 75;
    const points = Math.round(basePoints * this.comboMultiplier);
    this.addScore(points);

    const color = e.kind === "yeti" ? "#00E5FF" : "#FFD700";
    this.addFloatingText(`+${points}`, e.x, e.y - e.r, color, e.kind === "yeti" ? 1.6 : 1.0);
    if (this.combo > 0 && this.combo % 5 === 0) {
      this.addFloatingText(`¡COMBO x${this.comboMultiplier}!`, this.px, this.py - 70, "#FF5252", 1.25);
    }

    this.particles.emitBurst(e.x, e.y, "#FFFFFF", e.kind === "yeti" ? 50 : 18);
    if (e.kind === "elf") this.particles.emitBurst(e.x, e.y, "#2E7D32", 10);
    if (e.kind === "yeti") {
      this.particles.emitConfetti(this.width, 40);
      this.triggerShake(0.4, 8);
      this.audio.playPowerUp();
    } else {
      this.audio.playCatchItem(1.0 + Math.min(0.8, this.combo * 0.04));
    }

    const dropChance = e.kind === "yeti" ? 1 : DROP_CHANCE;
    if (Math.random() < dropChance) this.dropPowerUp(e.x, e.y);
  }

  private removeDeadEnemies(): void {
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  private dropPowerUp(x: number, y: number): void {
    const kinds: PowerUpKind[] = ["triple", "shield", "cookie", "logo"];
    const weights = [0.32, 0.25, this.lives < this.maxLives ? 0.25 : 0.08, 0.18];
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let kind: PowerUpKind = "triple";
    for (let i = 0; i < kinds.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { kind = kinds[i]; break; }
    }
    const sponsors = BRANDING.getAllSponsors();
    const sponsorId = kind === "logo" && sponsors.length > 0
      ? sponsors[Math.floor(Math.random() * sponsors.length)].id
      : undefined;
    const bounds = this.getArenaBounds();
    const clampedX = Math.max(bounds.left + 35, Math.min(bounds.right - 35, x));
    const clampedY = Math.max(bounds.top + 35, Math.min(bounds.bottom - 35, y));
    this.powerUps.push({ kind, x: clampedX, y: clampedY, life: POWERUP_LIFE, bob: Math.random() * Math.PI * 2, sponsorId });
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      const dx = this.px - e.x;
      const dy = this.py - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.wobble += dt * (e.kind === "elf" ? 9 : 4);

      let mx = dx / d;
      let my = dy / d;
      if (e.kind === "elf") {
        // Zigzag travieso perpendicular a la dirección de avance
        const zig = Math.sin(e.wobble) * 0.7;
        mx += -my * zig;
        my += (dx / d) * zig;
        const n = Math.hypot(mx, my) || 1;
        mx /= n;
        my /= n;
      }
      e.x += mx * e.speed * dt;
      e.y += my * e.speed * dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.shieldTick > 0) e.shieldTick -= dt;

      // Escudo de nariz brillante: daña por contacto
      if (this.shieldTimer > 0 && d < e.r + PLAYER_RADIUS + 26) {
        if (e.shieldTick <= 0) {
          e.shieldTick = 0.3;
          this.damageEnemy(e, 1);
          this.particles.emitBurst(e.x, e.y, "#FF1744", 10);
          // Empuje hacia afuera
          e.x -= mx * 30;
          e.y -= my * 30;
        }
        continue;
      }

      // Contacto con Rodolfo
      if (e.hp > 0 && d < e.r + PLAYER_RADIUS * 0.8) {
        this.hitPlayer(e, mx, my);
      }
    }
    this.removeDeadEnemies();
  }

  private hitPlayer(e: Enemy, mx: number, my: number): void {
    // Empuje al enemigo para evitar golpes repetidos
    e.x -= mx * 60;
    e.y -= my * 60;
    if (this.invulnerable > 0 || this.shieldTimer > 0) return;

    this.lives--;
    this.invulnerable = INVULNERABLE_TIME;
    if (this.combo >= 5) {
      this.addFloatingText("¡COMBO PERDIDO!", this.px, this.py - 80, "#90A4AE", 1.0);
    }
    this.combo = 0;
    this.pvx += mx * 420;
    this.pvy += my * 420;
    this.triggerShake(0.3, 8);
    this.audio.playRunnerHit();
    this.particles.emitBurst(this.px, this.py, "#FF5252", 20);
    this.addFloatingText("-1 ❤", this.px, this.py - 50, "#FF5252", 1.1);

    if (this.lives <= 0) {
      this.lives = 0;
      this.endGame();
    }
  }

  private updatePowerUps(dt: number): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.life -= dt;
      p.bob += dt * 4;
      if (p.life <= 0) {
        this.powerUps.splice(i, 1);
        continue;
      }
      if (Math.hypot(p.x - this.px, p.y - this.py) < PLAYER_RADIUS + 30) {
        this.collectPowerUp(p);
        this.powerUps.splice(i, 1);
      }
    }
  }

  private collectPowerUp(p: PowerUp): void {
    switch (p.kind) {
      case "triple":
        this.tripleTimer = TRIPLE_TIME;
        this.addFloatingText("¡DISPARO TRIPLE!", this.px, this.py - 70, "#00E5FF", 1.2);
        this.audio.playPowerUp();
        break;
      case "shield":
        this.shieldTimer = SHIELD_TIME;
        this.addFloatingText("¡NARIZ BRILLANTE!", this.px, this.py - 70, "#FF1744", 1.2);
        this.audio.playPowerUp();
        break;
      case "cookie":
        if (this.lives < this.maxLives) {
          this.lives++;
          this.addFloatingText("+1 ❤", this.px, this.py - 70, "#FF8A80", 1.2);
        } else {
          this.addScore(150);
          this.addFloatingText("+150", this.px, this.py - 70, "#FFD700", 1.0);
        }
        this.audio.playCatchItem(1.5);
        break;
      case "logo":
        this.triggerLogoPowerUp(p.sponsorId ?? 1, 6);
        this.addFloatingText("¡PUNTOS x2!", this.px, this.py - 70, "#FFD700", 1.3);
        break;
    }
    this.particles.emitBurst(p.x, p.y, "#FFD700", 16);
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const t = performance.now() * 0.001;

    this.drawBackground(ctx, w, h);
    // Marco delimitador: solo se dibuja en fallback si no hay imagen de fondo
    if (!imgReady(this.backgroundImg)) {
      const bounds = this.getArenaBounds();
      ctx.save();
      ctx.strokeStyle = "rgba(0, 229, 255, 0.40)";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 12;
      const rad = 14;
      ctx.beginPath();
      ctx.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, rad);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 215, 0, 0.30)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(bounds.left + 4, bounds.top + 4, bounds.width - 8, bounds.height - 8, Math.max(4, rad - 4));
      ctx.stroke();

      ctx.fillStyle = "#FFD700";
      const corners = [
        [bounds.left, bounds.top],
        [bounds.right, bounds.top],
        [bounds.left, bounds.bottom],
        [bounds.right, bounds.bottom]
      ];
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Power-ups
    for (const p of this.powerUps) {
      const blink = p.life < 2 && Math.floor(p.life * 8) % 2 === 0;
      if (!blink) this.drawPowerUp(ctx, p, t);
    }

    // Sombras + enemigos ordenados por profundidad
    const sorted = [...this.enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) this.drawEnemy(ctx, e, t);

    // Bolas de nieve
    for (const b of this.snowballs) this.drawSnowball(ctx, b.x, b.y, 10);

    this.drawPlayer(ctx, t);

    // Copos ambientales encima de la escena
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (const f of this.flakes) {
      if (f.x > w || f.y > h) continue;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.joystick.draw(ctx, this.lastDt);
    this.drawStatusOverlay(ctx, w, h);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (imgReady(this.backgroundImg)) {
      // Cover
      const img = this.backgroundImg;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return;
    }

    // Fallback: plaza nevada con adoquines y montículos
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#DCEBF5");
    grad.addColorStop(1, "#F4F9FD");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = "rgba(120, 144, 156, 0.12)";
    ctx.lineWidth = 2;
    const tile = 70;
    for (let y = 0; y < h + tile; y += tile) {
      const row = Math.floor(y / tile);
      for (let x = (row % 2) * (tile / 2) - tile; x < w + tile; x += tile) {
        ctx.strokeRect(x, y, tile, tile * 0.9);
      }
    }

    // Círculo central festivo
    ctx.strokeStyle = "rgba(229, 57, 53, 0.15)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.58, Math.min(w, h) * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 215, 0, 0.18)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.58, Math.min(w, h) * 0.28 + 14, 0, Math.PI * 2);
    ctx.stroke();

    // Montículos de nieve en los bordes
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    for (let i = 0; i < 8; i++) {
      const x = (i / 7) * w;
      ctx.beginPath();
      ctx.ellipse(x, h + 10, 90, 45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number): void {
    ctx.save();
    ctx.fillStyle = "rgba(40, 70, 100, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number, flip = false): void {
    const ratio = img.naturalWidth / img.naturalHeight;
    const dw = ratio >= 1 ? size : size * ratio;
    const dh = ratio >= 1 ? size / ratio : size;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  // ---------------------------- Jugador -------------------------------------

  private drawPlayer(ctx: CanvasRenderingContext2D, t: number): void {
    const x = this.px;
    const y = this.py;

    // Aura del escudo de nariz brillante
    if (this.shieldTimer > 0) {
      const pulse = 1 + Math.sin(t * 10) * 0.06;
      const r = (PLAYER_RADIUS + 26) * pulse;
      const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r);
      g.addColorStop(0, "rgba(255, 23, 68, 0)");
      g.addColorStop(0.7, "rgba(255, 23, 68, 0.22)");
      g.addColorStop(1, "rgba(255, 82, 82, 0.55)");
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.shieldTimer < 1.5 && Math.floor(t * 8) % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255, 23, 68, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    this.drawShadow(ctx, x, y + PLAYER_RADIUS, PLAYER_RADIUS * 0.9);

    // Parpadeo durante invulnerabilidad
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 12) % 2 === 0) return;

    const bob = Math.sin(this.walkAnim) * 3;
    const isHit = this.invulnerable > INVULNERABLE_TIME - 0.35;
    let img: HTMLImageElement;
    if (isHit) img = this.rodolfoHitImg;
    else if (this.facing === "up") img = this.rodolfoUpImg;
    else if (this.facing === "side") img = this.rodolfoSideImg;
    else img = this.rodolfoDownImg;

    if (imgReady(img)) {
      this.drawSprite(ctx, img, x, y + bob, PLAYER_RADIUS * 2.8, this.facing === "side" && this.facingLeft);
    } else {
      this.drawRodolfoFallback(ctx, x, y + bob, isHit, t);
    }
  }

  private drawRodolfoFallback(ctx: CanvasRenderingContext2D, x: number, y: number, isHit: boolean, t: number): void {
    const s = PLAYER_RADIUS;
    ctx.save();
    ctx.translate(x, y);
    if (this.facing === "side" && this.facingLeft) ctx.scale(-1, 1);

    // Cuerpo
    ctx.fillStyle = isHit ? "#A1887F" : "#8D6E63";
    ctx.beginPath();
    ctx.ellipse(0, s * 0.35, s * 0.75, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bufanda
    ctx.fillStyle = "#E53935";
    ctx.fillRect(-s * 0.55, -s * 0.12, s * 1.1, s * 0.22);

    // Cabeza
    const headY = -s * 0.45;
    ctx.fillStyle = isHit ? "#BCAAA4" : "#A1887F";
    ctx.beginPath();
    ctx.arc(0, headY, s * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Cuernos
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.25, headY - s * 0.4);
      ctx.lineTo(side * s * 0.5, headY - s * 0.95);
      ctx.moveTo(side * s * 0.4, headY - s * 0.7);
      ctx.lineTo(side * s * 0.75, headY - s * 0.8);
      ctx.stroke();
    }

    // Orejas
    ctx.fillStyle = "#795548";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * s * 0.55, headY - s * 0.12, s * 0.2, s * 0.1, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.facing !== "up") {
      const off = this.facing === "side" ? s * 0.18 : 0;
      // Ojos
      ctx.fillStyle = "#212121";
      if (isHit) {
        ctx.strokeStyle = "#212121";
        ctx.lineWidth = 2.5;
        for (const ex of [-0.18, 0.18]) {
          ctx.beginPath();
          ctx.moveTo(off + ex * s - 5, headY - s * 0.1 - 5);
          ctx.lineTo(off + ex * s + 5, headY - s * 0.1 + 5);
          ctx.moveTo(off + ex * s + 5, headY - s * 0.1 - 5);
          ctx.lineTo(off + ex * s - 5, headY - s * 0.1 + 5);
          ctx.stroke();
        }
      } else {
        for (const ex of [-0.18, 0.18]) {
          ctx.beginPath();
          ctx.arc(off + ex * s, headY - s * 0.1, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Nariz roja brillante
      const glow = 0.6 + Math.sin(t * 6) * 0.4;
      ctx.shadowColor = "#FF1744";
      ctx.shadowBlur = 12 + glow * 10;
      ctx.fillStyle = "#FF1744";
      ctx.beginPath();
      ctx.arc(off * 1.8, headY + s * 0.18, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(off * 1.8 - 3, headY + s * 0.13, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // De espaldas: cola blanca
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, s * 0.85, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------- Enemigos ------------------------------------

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
    this.drawShadow(ctx, e.x, e.y + e.r * 0.95, e.r * 0.85);
    const flash = e.hitFlash > 0;

    let img: HTMLImageElement | null = null;
    if (e.kind === "snowman") img = flash && imgReady(this.snowmanHitImg) ? this.snowmanHitImg : this.snowmanImg;
    else if (e.kind === "elf") img = this.elfImg;
    else img = flash && imgReady(this.yetiHitImg) ? this.yetiHitImg : this.yetiImg;

    const sway = Math.sin(e.wobble) * (e.kind === "elf" ? 0.12 : 0.05);
    if (imgReady(img)) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(sway);
      if (flash && e.kind === "elf") ctx.globalAlpha = 0.6;
      this.drawSprite(ctx, img, 0, 0, e.r * 2.6, this.px < e.x);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(sway);
      if (e.kind === "snowman") this.drawSnowmanFallback(ctx, e.r, flash);
      else if (e.kind === "elf") this.drawElfFallback(ctx, e.r, flash);
      else this.drawYetiFallback(ctx, e.r, flash, t);
      ctx.restore();
    }

    // Barra de vida (enemigos con más de 1 impacto)
    if (e.maxHp > 1 && e.hp < e.maxHp) {
      const bw = e.kind === "yeti" ? e.r * 2 : e.r * 1.4;
      const bx = e.x - bw / 2;
      const by = e.y - e.r * 1.35 - 10;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = e.kind === "yeti" ? "#00E5FF" : "#FF5252";
      ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 8);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, 8);
      ctx.restore();
    }
  }

  private drawSnowmanFallback(ctx: CanvasRenderingContext2D, r: number, flash: boolean): void {
    const body = flash ? "#FFCDD2" : "#FFFFFF";
    ctx.strokeStyle = "#B0BEC5";
    ctx.lineWidth = 2;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, r * 0.35, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r * 0.5, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Bufanda morada
    ctx.fillStyle = "#6A1B9A";
    ctx.fillRect(-r * 0.45, -r * 0.12, r * 0.9, r * 0.16);
    // Ceño malvado
    ctx.strokeStyle = "#212121";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.72);
    ctx.lineTo(-r * 0.08, -r * 0.62);
    ctx.moveTo(r * 0.28, -r * 0.72);
    ctx.lineTo(r * 0.08, -r * 0.62);
    ctx.stroke();
    ctx.fillStyle = "#D50000";
    for (const ex of [-0.17, 0.17]) {
      ctx.beginPath();
      ctx.arc(ex * r, -r * 0.55, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Nariz zanahoria
    ctx.fillStyle = "#FF6D00";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.45);
    ctx.lineTo(r * 0.3, -r * 0.4);
    ctx.lineTo(0, -r * 0.36);
    ctx.fill();
    // Sombrero de copa
    ctx.fillStyle = "#263238";
    ctx.fillRect(-r * 0.4, -r * 0.98, r * 0.8, r * 0.08);
    ctx.fillRect(-r * 0.26, -r * 1.3, r * 0.52, r * 0.34);
    // Botones
    ctx.fillStyle = "#37474F";
    for (const by of [0.2, 0.45]) {
      ctx.beginPath();
      ctx.arc(0, by * r, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawElfFallback(ctx: CanvasRenderingContext2D, r: number, flash: boolean): void {
    // Cuerpo verde
    ctx.fillStyle = flash ? "#A5D6A7" : "#2E7D32";
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, r * 0.9);
    ctx.lineTo(r * 0.6, r * 0.9);
    ctx.lineTo(r * 0.35, -r * 0.05);
    ctx.lineTo(-r * 0.35, -r * 0.05);
    ctx.closePath();
    ctx.fill();
    // Cinturón
    ctx.fillStyle = "#3E2723";
    ctx.fillRect(-r * 0.48, r * 0.35, r * 0.96, r * 0.14);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-r * 0.1, r * 0.33, r * 0.2, r * 0.18);
    // Cara
    ctx.fillStyle = "#FFCC80";
    ctx.beginPath();
    ctx.arc(0, -r * 0.35, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    // Orejas puntiagudas
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.35, -r * 0.4);
      ctx.lineTo(side * r * 0.75, -r * 0.55);
      ctx.lineTo(side * r * 0.38, -r * 0.25);
      ctx.fill();
    }
    // Ojos traviesos y sonrisa
    ctx.fillStyle = "#212121";
    for (const ex of [-0.15, 0.15]) {
      ctx.beginPath();
      ctx.arc(ex * r, -r * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#BF360C";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -r * 0.28, r * 0.15, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Gorro rojo con pompón
    ctx.fillStyle = "#D32F2F";
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.55);
    ctx.lineTo(r * 0.42, -r * 0.55);
    ctx.lineTo(r * 0.55, -r * 1.25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 1.25, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawYetiFallback(ctx: CanvasRenderingContext2D, r: number, flash: boolean, t: number): void {
    const fur = flash ? "#FFFFFF" : "#E1F5FE";
    // Brazos
    ctx.fillStyle = flash ? "#F5F5F5" : "#B3E5FC";
    const swing = Math.sin(t * 5) * 0.25;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * r * 0.75, -r * 0.1);
      ctx.rotate(side * (0.4 + swing));
      ctx.beginPath();
      ctx.ellipse(0, r * 0.35, r * 0.22, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Cuerpo peludo
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.82, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#81D4FA";
    ctx.lineWidth = 3;
    ctx.stroke();
    // Mechones
    ctx.strokeStyle = "rgba(129, 212, 250, 0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const ax = -r * 0.6 + i * r * 0.2;
      ctx.beginPath();
      ctx.moveTo(ax, r * 0.55);
      ctx.lineTo(ax + 5, r * 0.75);
      ctx.stroke();
    }
    // Cara azul
    ctx.fillStyle = "#4FC3F7";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.32, r * 0.45, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ojos furiosos
    ctx.fillStyle = "#FFEB3B";
    for (const ex of [-0.18, 0.18]) {
      ctx.beginPath();
      ctx.arc(ex * r, -r * 0.42, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#01579B";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, -r * 0.58);
    ctx.lineTo(-r * 0.08, -r * 0.48);
    ctx.moveTo(r * 0.32, -r * 0.58);
    ctx.lineTo(r * 0.08, -r * 0.48);
    ctx.stroke();
    // Boca con colmillos
    ctx.fillStyle = "#01579B";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.18, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    for (const fx of [-0.12, 0.12]) {
      ctx.beginPath();
      ctx.moveTo(fx * r - 4, -r * 0.24);
      ctx.lineTo(fx * r + 4, -r * 0.24);
      ctx.lineTo(fx * r, -r * 0.12);
      ctx.fill();
    }
  }

  // ---------------------------- Proyectiles y power-ups ---------------------

  private drawSnowball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    if (imgReady(this.snowballImg)) {
      ctx.drawImage(this.snowballImg, x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
      return;
    }
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, "#FFFFFF");
    g.addColorStop(1, "#B3E5FC");
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(0, 150, 220, 0.5)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, t: number): void {
    const x = p.x;
    const y = p.y + Math.sin(p.bob) * 6;
    const size = 52;

    // Halo dorado
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 4, x, y, size * 0.8);
    halo.addColorStop(0, "rgba(255, 215, 0, 0.45)");
    halo.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let img: HTMLImageElement | undefined;
    if (p.kind === "triple") img = this.puTripleImg;
    else if (p.kind === "shield") img = this.puShieldImg;
    else if (p.kind === "cookie") img = this.puCookieImg;
    else if (p.sponsorId) img = this.getSponsorImage(p.sponsorId);

    if (imgReady(img)) {
      if (p.kind === "logo") {
        // Insignia blanca con el logo del patrocinador
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        this.drawSprite(ctx, img, x, y, size * 0.75);
      } else {
        this.drawSprite(ctx, img, x, y, size);
      }
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    if (p.kind === "triple") {
      ctx.fillStyle = "#0288D1";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.stroke();
      for (const a of [-0.45, 0, 0.45]) {
        ctx.save();
        ctx.rotate(a - Math.PI / 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(size * 0.22, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (p.kind === "shield") {
      const glow = 0.5 + Math.sin(t * 8) * 0.5;
      ctx.shadowColor = "#FF1744";
      ctx.shadowBlur = 10 + glow * 14;
      ctx.fillStyle = "#FF1744";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(-6, -6, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "cookie") {
      ctx.fillStyle = "#C68642";
      ctx.beginPath();
      ctx.arc(0, -size * 0.25, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, size * 0.08, size * 0.18, size * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#C68642";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size * 0.32, -size * 0.05);
      ctx.lineTo(size * 0.32, -size * 0.05);
      ctx.moveTo(-size * 0.12, size * 0.28);
      ctx.lineTo(-size * 0.2, size * 0.42);
      ctx.moveTo(size * 0.12, size * 0.28);
      ctx.lineTo(size * 0.2, size * 0.42);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      for (const by of [0, 0.12]) {
        ctx.beginPath();
        ctx.arc(0, by * size, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Logo genérico: estrella dorada con x2
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? size * 0.48 : size * 0.22;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#B71C1C";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("x2", 0, 2);
    }
    ctx.restore();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    if (imgReady(this.heartImg)) {
      this.drawSprite(ctx, this.heartImg, x, y, size);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#FF1744";
    ctx.beginPath();
    const s = size / 2;
    ctx.moveTo(0, s * 0.7);
    ctx.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.6, -s * 1.0, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.6, -s * 1.0, s * 1.2, -s * 0.1, 0, s * 0.7);
    ctx.fill();
    ctx.restore();
  }

  /** Indicadores de combo y power-ups activos en la parte inferior */
  private drawStatusOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Combo
    if (this.combo >= 2) {
      const scale = 1 + Math.max(0, this.comboPulse) * 0.8;
      ctx.font = `900 ${Math.round(28 * scale)}px sans-serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      const label = `COMBO ${this.combo}  ·  x${this.comboMultiplier}`;
      ctx.strokeText(label, w / 2, 150);
      ctx.fillStyle = "#FFD700";
      ctx.fillText(label, w / 2, 150);
    }

    // Power-ups activos
    const chips: { label: string; time: number; color: string }[] = [];
    if (this.tripleTimer > 0) chips.push({ label: "TRIPLE", time: this.tripleTimer, color: "#0288D1" });
    if (this.shieldTimer > 0) chips.push({ label: "NARIZ", time: this.shieldTimer, color: "#D50000" });
    const chipW = 150;
    let cx = w / 2 - ((chips.length - 1) * (chipW + 12)) / 2;
    for (const c of chips) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(cx - chipW / 2, h - 60, chipW, 36);
      ctx.fillStyle = c.color;
      ctx.fillRect(cx - chipW / 2, h - 60, chipW * Math.min(1, c.time / (c.label === "TRIPLE" ? TRIPLE_TIME : SHIELD_TIME)), 36);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 18px sans-serif";
      ctx.fillText(`${c.label} ${Math.ceil(c.time)}s`, cx, h - 42);
      cx += chipW + 12;
    }

    // Corazones junto a Rodolfo (refuerzo visual además del HUD)
    for (let i = 0; i < this.maxLives; i++) {
      ctx.globalAlpha = i < this.lives ? 1 : 0.25;
      this.drawHeart(ctx, this.px - 22 + i * 22, this.py - PLAYER_RADIUS * 1.9, 18);
    }
    ctx.restore();
  }
}
