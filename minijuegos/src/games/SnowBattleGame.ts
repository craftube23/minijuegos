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
 *   rodolfo-battle-down-1.webp, rodolfo-battle-up-1.webp, rodolfo-battle-side-1.png,
 *   rodolfo-battle-hit.webp, snowman-evil-1.webp, snowman-evil-hit.webp,
 *   elf-mischief-1.webp, yeti-boss-1.webp, yeti-boss-hit.webp, snowball-proj.webp,
 *   pu-triple.webp, pu-shield.webp, pu-cookie.webp, heart-ui.webp,
 *   fondo-plaza-nevada.webp, snow-battle-portada.png (portada del menú)
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";
import { VirtualJoystick } from "./shared/VirtualJoystick";
import { imgReady } from "./shared/gameDraw";

type EnemyKind = "snowman" | "elf" | "yeti";
type PowerUpKind = "triple" | "shield" | "cookie" | "logo";
type FacingDir = "down" | "up" | "right" | "left";

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
  attackTimer?: number;
  defeatTimer?: number;
  abilityCooldown?: number;
  isDashing?: boolean;
}

interface Snowball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  bounces?: number;
  lastHitId?: number;
}

interface UpgradeOption {
  id: string;
  title: string;
  desc: string;
  spriteImg: HTMLImageElement;
  tag: string;
  color: string;
  level: number;
  maxLevel: number;
}

interface UpgradeCardRect {
  opt: UpgradeOption;
  x: number;
  y: number;
  w: number;
  h: number;
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
  private invulnerable = 0;
  private fireTimer = 0;
  private tripleTimer = 0;
  private shieldTimer = 0;
  private walkAnim = 0;
  private stepParticleTimer = 0;

  // Estado de derrota / muerte comica
  private isDying = false;
  private deathTimer = 0;

  // Control de generación continua y dificultad por Yeti
  private nextYetiTime = 25;
  private yetiCount = 0;
  private spawnTimer = 0.8;

  // Entidades
  private enemies: Enemy[] = [];
  private snowballs: Snowball[] = [];
  private enemySnowballs: Snowball[] = [];
  private powerUps: PowerUp[] = [];
  private survivalTime = 0;
  private combo = 0;
  private comboPulse = 0;
  private lastDt = 1 / 60;

  // Sistema de mejoras estilo Roguelike / Vampire Survivors
  private enemiesDefeatedCount = 0;
  private nextUpgradeKillThreshold = 10;
  private upgradeLevel = 0;
  private isUpgradeModalActive = false;
  private currentUpgradeOptions: UpgradeOption[] = [];
  private upgradeCardRects: UpgradeCardRect[] = [];
  private upgradeAnimTimer = 0;

  // Modificadores de mejoras acumuladas
  private statFireRateMult = 1.0;
  private statDamage = 1;
  private statSpeedMult = 1.0;
  private statFrostAuraRadius = 90;
  private statRicochet = 0;
  private upgradeLevels: Record<string, number> = {
    fire_rate: 0,
    heavy_snow: 0,
    speed: 0,
    frost_aura: 0,
    heart_boost: 0,
    ricochet: 0
  };

  // Copos decorativos de fondo
  private flakes: { x: number; y: number; r: number; vy: number; vx: number }[] = [];

  // Sprites de Rodolfo en las 4 direcciones (Paso 1, Juntas/Pass, Paso 2, Stop)
  private rodolfoSprites: Record<FacingDir, {
    step1: HTMLImageElement;
    pass: HTMLImageElement;
    step2: HTMLImageElement;
    stop: HTMLImageElement;
  }>;
  private rodolfoHitImg: HTMLImageElement;
  private rodolfoDeadImg: HTMLImageElement;
  private snowmanImg: HTMLImageElement;
  private snowmanImg2: HTMLImageElement;
  private snowmanHitImg: HTMLImageElement;
  private snowmanAtkImg: HTMLImageElement;
  private snowmanDeadImg: HTMLImageElement;
  private elfImg: HTMLImageElement;
  private elfImg2: HTMLImageElement;
  private elfHitImg: HTMLImageElement;
  private elfAtkImg: HTMLImageElement;
  private yetiImg: HTMLImageElement;
  private yetiImg2: HTMLImageElement;
  private yetiHitImg: HTMLImageElement;
  private yetiSlamImg: HTMLImageElement;
  private snowballImg: HTMLImageElement;
  private starImg: HTMLImageElement;
  private clockImg: HTMLImageElement;
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

    this.inGameMusicPath = "./assets/audio/Batalla de Nieve/Christmas synths.ogg";
    this.inGameMusicVolume = 0.45;

    this.joystick = new VirtualJoystick(canvas, () => ({ width: this.width, height: this.height }));

    const base = "./assets/images/";
    this.rodolfoSprites = {
      right: {
        step1: this.getImage(base + "rodolfo-battle-right-1.webp"),
        pass: this.getImage(base + "rodolfo-battle-right-pass.webp"),
        step2: this.getImage(base + "rodolfo-battle-right-2.webp"),
        stop: this.getImage(base + "rodolfo-battle-right-stop.webp")
      },
      left: {
        step1: this.getImage(base + "rodolfo-battle-left-1.webp"),
        pass: this.getImage(base + "rodolfo-battle-left-pass.webp"),
        step2: this.getImage(base + "rodolfo-battle-left-2.webp"),
        stop: this.getImage(base + "rodolfo-battle-left-stop.webp")
      },
      down: {
        step1: this.getImage(base + "rodolfo-battle-down-1.webp"),
        pass: this.getImage(base + "rodolfo-battle-down-pass.webp"),
        step2: this.getImage(base + "rodolfo-battle-down-2.webp"),
        stop: this.getImage(base + "rodolfo-battle-down-stop.webp")
      },
      up: {
        step1: this.getImage(base + "rodolfo-battle-up-1.webp"),
        pass: this.getImage(base + "rodolfo-battle-up-pass.webp"),
        step2: this.getImage(base + "rodolfo-battle-up-2.webp"),
        stop: this.getImage(base + "rodolfo-battle-up-stop.webp")
      }
    };
    this.rodolfoHitImg = this.getImage(base + "rodolfo-battle-hit.webp");
    this.rodolfoDeadImg = this.getImage(base + "rodolfo-battle-dead.webp");
    this.snowmanImg = this.getImage(base + "snowman-evil-1.webp");
    this.snowmanImg2 = this.getImage(base + "snowman-evil-2.webp");
    this.snowmanHitImg = this.getImage(base + "snowman-evil-hit.webp");
    this.snowmanAtkImg = this.getImage(base + "snowman-evil-attack.webp");
    this.snowmanDeadImg = this.getImage(base + "snowman-evil-dead.webp");
    this.elfImg = this.getImage(base + "elf-mischief-1.webp");
    this.elfImg2 = this.getImage(base + "elf-mischief-2.webp");
    this.elfHitImg = this.getImage(base + "elf-mischief-hit.webp");
    this.elfAtkImg = this.getImage(base + "elf-mischief-attack.webp");
    this.yetiImg = this.getImage(base + "yeti-boss-1.webp");
    this.yetiImg2 = this.getImage(base + "yeti-boss-2.webp");
    this.yetiHitImg = this.getImage(base + "yeti-boss-hit.webp");
    this.yetiSlamImg = this.getImage(base + "yeti-boss-slam.webp");
    this.snowballImg = this.getImage(base + "snowball-proj.webp");
        this.starImg = this.getImage(base + "estrella_con_logo.webp");
    this.clockImg = this.getImage(base + "reloj-magico-tiempo.webp");
    this.puTripleImg = this.getImage(base + "pu-triple.webp");
    this.puShieldImg = this.getImage(base + "pu-shield.webp");
    this.puCookieImg = this.getImage(base + "pu-cookie.webp");
    this.heartImg = this.getImage(base + "heart-ui.webp");
    this.backgroundImg = this.getImage(base + "fondo-plaza-nevada.webp");

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
    this.isDying = false;
    this.deathTimer = 0;

    const startBounds = this.getArenaBounds();
    this.px = (startBounds.left + startBounds.right) / 2;
    this.py = startBounds.top + startBounds.height * 0.55;
    this.pvx = 0;
    this.pvy = 0;
    this.facing = "down";
    this.invulnerable = 0;
    this.fireTimer = 0;
    this.tripleTimer = 0;
    this.shieldTimer = 0;
    this.walkAnim = 0;

    this.enemies = [];
    this.snowballs = [];
    this.enemySnowballs = [];
    this.powerUps = [];
    this.nextYetiTime = 25;
    this.yetiCount = 0;

    // Reinicio completo de mejoras y fases al perder / reiniciar
    this.enemiesDefeatedCount = 0;
    this.nextUpgradeKillThreshold = 10;
    this.upgradeLevel = 0;
    this.isUpgradeModalActive = false;
    this.currentUpgradeOptions = [];
    this.upgradeCardRects = [];
    this.statFireRateMult = 1.0;
    this.statDamage = 1;
    this.statSpeedMult = 1.0;
    this.statFrostAuraRadius = 90;
    this.statRicochet = 0;
    this.upgradeLevels = {
      fire_rate: 0,
      heavy_snow: 0,
      speed: 0,
      frost_aura: 0,
      heart_boost: 0,
      ricochet: 0
    };
    this.spawnTimer = 0.8;
    this.combo = 0;
    this.comboPulse = 0;

    this.joystick.detach();
    this.joystick.attach();

    window.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("pointerdown", this.handleUpgradePointerDown);
    window.addEventListener("keydown", this.handleKeyDown);
    this.canvas.addEventListener("pointerdown", this.handleUpgradePointerDown);

    this.addFloatingText("¡DEFIENDE LA PLAZA!", w / 2, h * 0.42, "#FFD700", 1.4);
  }

  public override endGame(extraData?: Parameters<BaseGame["endGame"]>[0]): void {
    this.joystick.detach();
    window.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("pointerdown", this.handleUpgradePointerDown);
    super.endGame(extraData);
  }

  public override destroy(): void {
    super.destroy();
    this.joystick.detach();
    window.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("pointerdown", this.handleUpgradePointerDown);
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

    // Si el modal de mejoras est activo, pausar el tiempo del juego
    if (this.isUpgradeModalActive) {
      this.upgradeAnimTimer += dt;
      return;
    }

    this.updateFlakes(dt, w, h);
    if (this.isFinishing) return;
    this.survivalTime += dt;

    if (this.isDying) {
      this.updateDeath(dt);
      return;
    }

    this.updatePlayer(dt, w, h);
    this.updateSpawning(dt, w, h);
    this.updateFiring(dt);
    this.updateSnowballs(dt, w, h);
    this.updateEnemySnowballs(dt);
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
      const isPortrait = h > w;
      // En modo horizontal (16:9), la plaza se expande en toda su gloria
      // En vertical, ajustamos la escala para que la zona de combate central no quede cortada
      const s = isPortrait
        ? Math.max(w / (img.naturalWidth * 0.72), h / img.naturalHeight)
        : Math.max(w / img.naturalWidth, h / img.naturalHeight);
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
    const targetVx = js.x * js.magnitude * (PLAYER_SPEED * this.statSpeedMult);
    const targetVy = js.y * js.magnitude * (PLAYER_SPEED * this.statSpeedMult);
    const accel = Math.min(1, dt * 12);
    this.pvx += (targetVx - this.pvx) * accel;
    this.pvy += (targetVy - this.pvy) * accel;

    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    // Confinar a Rodolfo estrictamente dentro del recuadro central
    const bounds = this.getArenaBounds();
    this.px = Math.max(bounds.left + PLAYER_RADIUS, Math.min(bounds.right - PLAYER_RADIUS, this.px));
    this.py = Math.max(bounds.top + PLAYER_RADIUS, Math.min(bounds.bottom - PLAYER_RADIUS, this.py));

    const speed = Math.hypot(this.pvx, this.pvy);
    const isMoving = js.magnitude > 0.08 || speed > 25;
    if (isMoving) {
      const speedFactor = Math.min(1.4, Math.max(0.45, speed / (PLAYER_SPEED * 0.85)));
      this.walkAnim += dt * 3.2 * speedFactor;
      const absX = Math.abs(js.x);
      const absY = Math.abs(js.y);
      const isCurrentlyHoriz = this.facing === "left" || this.facing === "right";
      if (isCurrentlyHoriz) {
        if (absY > absX * 1.35) {
          this.facing = js.y < 0 ? "up" : "down";
        } else if (absX > 0.05) {
          this.facing = js.x > 0 ? "right" : "left";
        }
      } else {
        if (absX > absY * 1.35) {
          this.facing = js.x > 0 ? "right" : "left";
        } else if (absY > 0.05) {
          this.facing = js.y < 0 ? "up" : "down";
        }
      }
      this.stepParticleTimer += dt;
      if (this.stepParticleTimer > 0.18) {
        this.stepParticleTimer = 0;
        this.particles.emitBurst(this.px + (Math.random() - 0.5) * 16, this.py + PLAYER_RADIUS * 0.92, "#E0F7FA", 2);
      }
    } else {
      this.walkAnim = 0;
      this.stepParticleTimer = 0;
    }
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.tripleTimer > 0) this.tripleTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
  }

  private updateDeath(dt: number): void {
    this.deathTimer -= dt;
    this.pvx *= 0.88;
    this.pvy *= 0.88;
    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    const bounds = this.getArenaBounds();
    this.px = Math.max(bounds.left + PLAYER_RADIUS, Math.min(bounds.right - PLAYER_RADIUS, this.px));
    this.py = Math.max(bounds.top + PLAYER_RADIUS, Math.min(bounds.bottom - PLAYER_RADIUS, this.py));

    // Partículas de estrellas mareadas ocasionales
    if (Math.random() < 0.25) {
      this.particles.emitBurst(
        this.px + (Math.random() - 0.5) * 36,
        this.py - PLAYER_RADIUS * 1.3 + (Math.random() - 0.5) * 16,
        "#FFD700",
        1
      );
    }

    if (this.deathTimer <= 0) {
      this.isDying = false;
      this.endGame();
    }
  }

  private updateSpawning(dt: number, w: number, h: number): void {
    const t = this.survivalTime;

    // Aparición periódica del Mini-Jefe Yeti: cada que aparece se van agregando +1 enemigos
    if (t >= this.nextYetiTime) {
      this.yetiCount++;
      this.nextYetiTime = t + 35;
      this.spawnEnemy("yeti", w, h);
      this.addFloatingText("¡ALERTA: YETI!", w / 2, h * 0.35, "#00E5FF", 1.6);
      this.triggerShake(0.5, 9);
      this.audio.playRunnerHit();
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const progress = Math.min(2.0, t / 60);
      this.spawnTimer = Math.max(0.45, 1.15 - 0.25 * progress);

      // Inicia con 1 enemigo y cada que aparece un Yeti se agrega 1 más a la tanda (+1 por Yeti)
      const countToSpawn = 1 + this.yetiCount;
      const elfChance = Math.min(0.55, 0.25 + 0.12 * progress);

      for (let i = 0; i < countToSpawn; i++) {
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

    // Balance equilibrado: reducido ~10% de HP para un combate más dinámico y satisfactorio
    const extraHp = Math.floor(this.upgradeLevel * 1.3);
    const stats: Record<EnemyKind, { r: number; hp: number; speed: number }> = {
      snowman: { r: 36, hp: 3 + extraHp, speed: 85 },
      elf: { r: 26, hp: 2 + Math.floor(extraHp * 0.7), speed: 180 },
      yeti: { r: 72, hp: 16 + extraHp * 4, speed: 60 }
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
    this.fireTimer = FIRE_INTERVAL / this.statFireRateMult;

    const baseAngle = Math.atan2(target.y - this.py, target.x - this.px);
    const spread = (14 * Math.PI) / 180;
    const angles = this.tripleTimer > 0 ? [baseAngle - spread, baseAngle, baseAngle + spread] : [baseAngle];
    for (const a of angles) {
      this.snowballs.push({
        x: this.px + Math.cos(a) * 30,
        y: this.py + Math.sin(a) * 30,
        vx: Math.cos(a) * SNOWBALL_SPEED,
        vy: Math.sin(a) * SNOWBALL_SPEED,
        life: 1.6,
        bounces: this.statRicochet
      });
    }
    this.audio.playWhoosh();
  }


  private updateEnemySnowballs(dt: number): void {
    const bounds = this.getArenaBounds();
    for (let i = this.enemySnowballs.length - 1; i >= 0; i--) {
      const b = this.enemySnowballs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      const hitWall = b.x <= bounds.left || b.x >= bounds.right || b.y <= bounds.top || b.y >= bounds.bottom;
      let consumed = b.life <= 0 || hitWall;

      if (!consumed && (this.invulnerable <= 0 && this.shieldTimer <= 0) && !this.isDying) {
        if (Math.hypot(b.x - this.px, b.y - this.py) < PLAYER_RADIUS + 8) {
          this.lives--;
          this.invulnerable = INVULNERABLE_TIME;
          this.combo = 0;
          this.triggerShake(0.25, 7);
          this.particles.emitBurst(this.px, this.py, "#FF1744", 12);
          this.audio.playElfHit();
          consumed = true;
        }
      }

      if (consumed) this.enemySnowballs.splice(i, 1);
    }
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
        for (let ei = 0; ei < this.enemies.length; ei++) {
          const e = this.enemies[ei];
          if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 10) {
            // Si la bola ya golpe a este enemigo en el rebote anterior, ignorarlo
            if (b.lastHitId === ei) continue;

            this.damageEnemy(e, this.statDamage);
            this.particles.emitBurst(b.x, b.y, "#FFFFFF", 8);

            // Mecnica de Rebote en Enemigos (Ricochet Chain)
            if ((b.bounces || 0) > 0) {
              b.bounces = (b.bounces || 0) - 1;
              b.lastHitId = ei;

              // Buscar el enemigo ms cercano distinto a este
              let nextEnemy: Enemy | null = null;
              let nextDist = 420;
              for (let ni = 0; ni < this.enemies.length; ni++) {
                if (ni === ei) continue;
                const ne = this.enemies[ni];
                if (ne.hp > 0 && (ne.defeatTimer ?? 0) <= 0) {
                  const d = Math.hypot(ne.x - b.x, ne.y - b.y);
                  if (d < nextDist) {
                    nextDist = d;
                    nextEnemy = ne;
                  }
                }
              }

              if (nextEnemy) {
                const ang = Math.atan2(nextEnemy.y - b.y, nextEnemy.x - b.x);
                b.vx = Math.cos(ang) * SNOWBALL_SPEED * 1.05;
                b.vy = Math.sin(ang) * SNOWBALL_SPEED * 1.05;
                b.life = 1.3;
                this.particles.emitBurst(b.x, b.y, "#FFD700", 10);
                this.audio.playCatchItem(1.4);
                consumed = false;
              } else {
                consumed = true;
              }
            } else {
              consumed = true;
            }
            break;
          }
        }
      }
      if (consumed) this.snowballs.splice(i, 1);
    }
    this.removeDeadEnemies();
  }

  private damageEnemy(e: Enemy, amount: number): void {
    if ((e.defeatTimer ?? 0) > 0) return;
    e.hp -= amount;
    e.hitFlash = 0.15;
    if (e.hp <= 0) this.onEnemyDefeated(e);
  }

  private onEnemyDefeated(e: Enemy): void {
    e.defeatTimer = 0.35;
    this.combo++;
    this.enemiesDefeatedCount++;
    if (this.enemiesDefeatedCount >= this.nextUpgradeKillThreshold) {
      this.triggerUpgradeSelection();
    }
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
    this.enemies = this.enemies.filter((e) => e.hp > 0 || (e.defeatTimer !== undefined && e.defeatTimer > 0));
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
      // Efecto de Ventisca Congelante: permite entrar libremente a los enemigos, ralentiza un 30% y causa daño continuo leve

      const dx = this.px - e.x;
      const dy = this.py - e.y;
      const d = Math.hypot(dx, dy) || 1;

      // ======================================================================
      // HABILIDADES ESPECIALES DE ENEMIGOS (ACTIVAS A PARTIR DE FASE 3)
      // ======================================================================
      if (this.upgradeLevel >= 3 && (e.defeatTimer ?? 0) <= 0) {
        if (e.abilityCooldown === undefined) {
          e.abilityCooldown = 2.5 + Math.random() * 3.0;
        } else {
          e.abilityCooldown -= dt;
        }

        // Habilidad 1: Muñeco de Nieve lanza bola de nieve helada a distancia
        if (e.kind === "snowman" && e.abilityCooldown <= 0 && d > 140 && d < 550) {
          e.abilityCooldown = 4.0 + Math.random() * 2.0;
          e.attackTimer = 0.4;
          const shotAng = Math.atan2(this.py - e.y, this.px - e.x);
          this.enemySnowballs.push({
            x: e.x + Math.cos(shotAng) * (e.r + 8),
            y: e.y + Math.sin(shotAng) * (e.r + 8),
            vx: Math.cos(shotAng) * 260,
            vy: Math.sin(shotAng) * 260,
            life: 2.2
          });
          this.particles.emitBurst(e.x, e.y, "#B0BEC5", 6);
          this.audio.playWhoosh();
        }

        // Habilidad 2: Duende Travieso realiza embestida rápida (Dash de aceleración)
        if (e.kind === "elf" && e.abilityCooldown <= 0 && d > 120 && d < 400) {
          e.abilityCooldown = 5.0 + Math.random() * 2.5;
          e.isDashing = true;
          this.particles.emitBurst(e.x, e.y, "#00E5FF", 8);
          setTimeout(() => { e.isDashing = false; }, 650);
        }

        // Habilidad 3: Yeti ejecuta Pisotón Sísmico (Slam) que sacude la plaza
        if (e.kind === "yeti" && e.abilityCooldown <= 0) {
          e.abilityCooldown = 7.0 + Math.random() * 3.0;
          e.attackTimer = 0.6;
          this.triggerShake(0.35, 6);
          this.particles.emitBurst(e.x, e.y, "#00E5FF", 22);
          this.audio.playRunnerHit();
          if (d < e.r + PLAYER_RADIUS + 90) {
            this.pvx += (this.px - e.x) * 4.5;
            this.pvy += (this.py - e.y) * 4.5;
          }
        }
      }

      let currentSpeed = e.speed * (e.isDashing ? 2.1 : 1.0);
      if ((this.upgradeLevels.frost_aura || 0) > 0 && (e.defeatTimer ?? 0) <= 0) {
        const dToPlayer = Math.hypot(e.x - this.px, e.y - this.py);
        if (dToPlayer < this.statFrostAuraRadius + e.r) {
          currentSpeed = e.speed * 0.70;
          if (Math.random() < 0.035) {
            this.damageEnemy(e, 1);
            this.particles.emitBurst(e.x, e.y, "#E040FB", 3);
          }
        }
      }
      if ((e.defeatTimer ?? 0) > 0) {
        e.defeatTimer = (e.defeatTimer ?? 0) - dt;
        continue;
      }
      if ((e.attackTimer ?? 0) > 0) {
        e.attackTimer = (e.attackTimer ?? 0) - dt;
      }
      e.wobble += dt * (e.kind === "elf" ? 9 : 4);
      if (d < e.r + PLAYER_RADIUS + 35 && (e.attackTimer ?? 0) <= 0) {
        e.attackTimer = 0.35;
      }

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
      e.x += mx * currentSpeed * dt;
      e.y += my * currentSpeed * dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.shieldTick > 0) e.shieldTick -= dt;

      // Escudo de nariz brillante: daña por contacto
      if (this.shieldTimer > 0 && d < e.r + PLAYER_RADIUS + 26) {
        if (e.shieldTick <= 0) {
          e.shieldTick = 0.3;
          this.damageEnemy(e, this.statDamage);
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
    this.audio.playElfHit();
    this.particles.emitBurst(this.px, this.py, "#FF5252", 20);
    this.addFloatingText("-1 ❤", this.px, this.py - 50, "#FF5252", 1.1);

    if (this.lives <= 0) {
      this.lives = 0;
      this.isDying = true;
      this.deathTimer = 2.4;
      this.pvx = mx * 320;
      this.pvy = my * 320;
      this.triggerShake(0.6, 12);
      this.audio.playElfHit();
      this.particles.emitBurst(this.px, this.py, "#FF1744", 30);
      this.particles.emitBurst(this.px, this.py, "#FFD700", 25);
      this.addFloatingText("¡K.O.!", this.px, this.py - 60, "#FF1744", 2.0);
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


  // ==========================================================================
  // SISTEMA DE MEJORAS ROGUELIKE (UPGRADE SELECTION)
  // ==========================================================================
  private triggerUpgradeSelection(): void {
    if (this.isUpgradeModalActive || this.isDying || this.isGameOver) return;
    this.isUpgradeModalActive = true;
    this.upgradeAnimTimer = 0;
    this.upgradeLevel++;

    // Siguiente umbral con escalado progresivo (+10, +14, +18...)
    this.nextUpgradeKillThreshold += 10 + this.upgradeLevel * 4;

    this.audio.playPowerUp();
    this.particles.emitConfetti(this.width, 50);

    // Desconectar momentaneamente el joystick para no interferir con los toques
    this.joystick.detach();

    // Pool de mejoras posibles
    const allPool: UpgradeOption[] = [
      {
        id: "fire_rate",
        title: "Ametralladora Polar",
        desc: "Dispara bolas de nieve un +30% más rápido.",
        spriteImg: this.puTripleImg,
        tag: "CADENCIA DE TIRO",
        color: "#00E5FF",
        level: (this.upgradeLevels.fire_rate || 0) + 1,
        maxLevel: 4
      },
      {
        id: "heavy_snow",
        title: "Bola de Nieve Gigante",
        desc: "Aumenta el daño de impacto en +1 punto y tamaño de bola.",
        spriteImg: this.snowballImg,
        tag: "POTENCIA DE IMPACTO",
        color: "#FF5252",
        level: (this.upgradeLevels.heavy_snow || 0) + 1,
        maxLevel: 4
      },
      {
        id: "speed",
        title: "Patines de Hielo Mágico",
        desc: "Rodolfo se desplaza un +22% más ágil por la plaza.",
        spriteImg: this.clockImg,
        tag: "MOVILIDAD VELOZ",
        color: "#69F0AE",
        level: (this.upgradeLevels.speed || 0) + 1,
        maxLevel: 3
      },
      {
        id: "frost_aura",
        title: "Ventisca Congelante",
        desc: "Genera una ventisca mística que congela y daña enemigos.",
        spriteImg: this.puShieldImg,
        tag: "AURA DEFENSIVA",
        color: "#E040FB",
        level: (this.upgradeLevels.frost_aura || 0) + 1,
        maxLevel: 3
      },
      {
        id: "heart_boost",
        title: "Galleta de Vida Extra",
        desc: "Restaura 1 corazón y aumenta tu vida máxima.",
        spriteImg: this.puCookieImg,
        tag: "SUPERVIVENCIA",
        color: "#FFD700",
        level: (this.upgradeLevels.heart_boost || 0) + 1,
        maxLevel: 3
      },
      {
        id: "ricochet",
        title: "Rebote en Enemigos",
        desc: "¡Al golpear a un invasor, la bola rebota hacia otro cercano!",
        spriteImg: this.starImg,
        tag: "REBOTE EN CADENA",
        color: "#FFB300",
        level: (this.upgradeLevels.ricochet || 0) + 1,
        maxLevel: 3
      }
    ];

    const available = allPool.filter((u) => (this.upgradeLevels[u.id] || 0) < u.maxLevel);
    available.sort(() => Math.random() - 0.5);
    this.currentUpgradeOptions = available.slice(0, 3);
  }

  private applyUpgrade(id: string): void {
    this.upgradeLevels[id] = (this.upgradeLevels[id] || 0) + 1;

    // ¡Aumenta la vida de los enemigos con cada nivel de mejora!
    for (const e of this.enemies) {
      if (e.hp > 0) {
        e.maxHp += 1;
        e.hp += 1;
      }
    }

    switch (id) {
      case "fire_rate":
        this.statFireRateMult += 0.30;
        this.addFloatingText("¡CADENCIA +30%!", this.px, this.py - 60, "#00E5FF", 1.4);
        break;
      case "heavy_snow":
        this.statDamage += 1;
        this.addFloatingText("¡DAÑO AUMENTADO!", this.px, this.py - 60, "#FF5252", 1.4);
        break;
      case "speed":
        this.statSpeedMult += 0.22;
        this.addFloatingText("¡VELOCIDAD +22%!", this.px, this.py - 60, "#69F0AE", 1.4);
        break;
      case "frost_aura":
        this.statFrostAuraRadius += 25;
        this.addFloatingText("¡AURA CONGELANTE!", this.px, this.py - 60, "#E040FB", 1.4);
        break;
      case "heart_boost":
        this.maxLives = Math.min(6, this.maxLives + 1);
        this.lives = Math.min(this.maxLives, this.lives + 1);
        this.addFloatingText("¡+1 VIDA EXTRA!", this.px, this.py - 60, "#FFD700", 1.4);
        break;
      case "ricochet":
        this.statRicochet += 1;
        this.addFloatingText("¡REBOTE EN MUROS!", this.px, this.py - 60, "#FFB300", 1.4);
        break;
    }

    this.audio.playCatchItem(1.5);
    this.particles.emitBurst(this.px, this.py, "#FFD700", 25);
    this.particles.emitBurst(this.px, this.py, "#FFFFFF", 20);

    // Cerrar modal y reanudar juego
    this.isUpgradeModalActive = false;
    this.currentUpgradeOptions = [];
    this.upgradeCardRects = [];
    this.joystick.attach();
  }

  private handleUpgradePointerDown = (e: PointerEvent): void => {
    if (!this.isUpgradeModalActive) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.width / rect.width;
    const sy = this.height / rect.height;
    const clickX = (e.clientX - rect.left) * sx;
    const clickY = (e.clientY - rect.top) * sy;

    for (const card of this.upgradeCardRects) {
      if (
        clickX >= card.x &&
        clickX <= card.x + card.w &&
        clickY >= card.y &&
        clickY <= card.y + card.h
      ) {
        this.applyUpgrade(card.opt.id);
        break;
      }
    }
  };

  /** Dibuja el modal de mejoras flotante tipo Vampire Survivors */
  private drawUpgradeModal(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.isUpgradeModalActive || this.currentUpgradeOptions.length === 0) return;

    ctx.save();

    // 1. Fondo oscurecido con desenfoque simulado
    ctx.fillStyle = "rgba(7, 18, 38, 0.85)";
    ctx.fillRect(0, 0, w, h);

    // 2. Título superior con resplandor dorado
    const animPulse = 1.0 + Math.sin(this.upgradeAnimTimer * 5) * 0.04;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const titleY = h * 0.18;
    ctx.font = `900 ${Math.round(38 * animPulse)}px 'Titan One', 'Fredoka', sans-serif`;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#FFD700";
    ctx.fillText("¡MEJORA DE PODER!", w * 0.5, titleY);

    ctx.shadowBlur = 0;
    ctx.font = "700 18px sans-serif";
    ctx.fillStyle = "#E1F5FE";
    ctx.fillText("¡Derrotaste suficientes invasores! Elige 1 mejora para Rodolfo:", w * 0.5, titleY + 45);

    // 3. Renderizado de las 3 tarjetas de mejora
    const count = this.currentUpgradeOptions.length;
    const isVertical = h > w * 1.2;
    this.upgradeCardRects = [];

    if (isVertical) {
      // Formato Tótem Vertical: 3 tarjetas apiladas verticalmente
      const cardW = Math.min(w * 0.88, 480);
      const cardH = Math.min(130, h * 0.14);
      let startY = h * 0.32;

      for (let i = 0; i < count; i++) {
        const opt = this.currentUpgradeOptions[i];
        const cardX = (w - cardW) / 2;
        const cardY = startY + i * (cardH + 20);

        this.upgradeCardRects.push({ opt, x: cardX, y: cardY, w: cardW, h: cardH });
        this.renderUpgradeCardHorizontal(ctx, opt, cardX, cardY, cardW, cardH);
      }
    } else {
      // Formato Panorámico: 3 tarjetas lado a lado
      const cardW = Math.min(270, (w * 0.9) / 3 - 20);
      const cardH = Math.min(340, h * 0.52);
      const totalCardsW = count * cardW + (count - 1) * 24;
      const startX = (w - totalCardsW) / 2;
      const cardY = h * 0.28;

      for (let i = 0; i < count; i++) {
        const opt = this.currentUpgradeOptions[i];
        const cardX = startX + i * (cardW + 24);

        this.upgradeCardRects.push({ opt, x: cardX, y: cardY, w: cardW, h: cardH });
        this.renderUpgradeCardVertical(ctx, opt, cardX, cardY, cardW, cardH);
      }
    }

    ctx.restore();
  }

  private renderUpgradeCardHorizontal(
    ctx: CanvasRenderingContext2D,
    opt: UpgradeOption,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.save();

    // Fondo de tarjeta con gradiente
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#1A2E4C");
    grad.addColorStop(1, "#0D182A");
    ctx.fillStyle = grad;

    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = opt.color;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Emblema e Ícono Stylized 2D Game Art
    const iconBoxSize = Math.min(68, h * 0.72);
    const iconBoxX = x + 24;
    const iconBoxY = y + (h - iconBoxSize) / 2;

    // Resplandor de marco para el ícono
    ctx.save();
    ctx.fillStyle = "rgba(7, 18, 38, 0.6)";
    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 12);
    ctx.fill();
    ctx.stroke();

    if (imgReady(opt.spriteImg)) {
      ctx.shadowColor = opt.color;
      ctx.shadowBlur = 10;
      const pad = 8;
      ctx.drawImage(opt.spriteImg, iconBoxX + pad, iconBoxY + pad, iconBoxSize - pad * 2, iconBoxSize - pad * 2);
    }
    ctx.restore();

    // Contenido textual
    ctx.textAlign = "left";

    // Tag superior
    ctx.font = "900 12px sans-serif";
    ctx.fillStyle = opt.color;
    ctx.fillText(opt.tag, x + 108, y + 26);

    // Nivel
    ctx.textAlign = "right";
    ctx.font = "900 13px sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`NIVEL ${opt.level}/${opt.maxLevel}`, x + w - 24, y + 26);

    // Título de la mejora
    ctx.textAlign = "left";
    ctx.font = "900 20px 'Titan One', 'Fredoka', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(opt.title, x + 108, y + 54);

    // Descripción
    ctx.font = "500 14px sans-serif";
    ctx.fillStyle = "#B0BEC5";
    ctx.fillText(opt.desc, x + 108, y + 84);

    // Botón / Indicador de pulsar
    ctx.textAlign = "right";
    ctx.font = "900 13px sans-serif";
    ctx.fillStyle = opt.color;
    ctx.fillText("¡TOCA PARA ELEGIR! ▶", x + w - 24, y + h - 22);

    ctx.restore();
  }

  private renderUpgradeCardVertical(
    ctx: CanvasRenderingContext2D,
    opt: UpgradeOption,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.save();

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#1A2E4C");
    grad.addColorStop(1, "#0D182A");
    ctx.fillStyle = grad;

    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = opt.color;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Tag
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 12px sans-serif";
    ctx.fillStyle = opt.color;
    ctx.fillText(opt.tag, x + w * 0.5, y + 28);

    // Emblema e Ícono Stylized 2D Game Art
    const iconBoxSize = 78;
    const iconBoxX = x + (w - iconBoxSize) * 0.5;
    const iconBoxY = y + 52;

    ctx.save();
    ctx.fillStyle = "rgba(7, 18, 38, 0.6)";
    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 14);
    ctx.fill();
    ctx.stroke();

    if (imgReady(opt.spriteImg)) {
      ctx.shadowColor = opt.color;
      ctx.shadowBlur = 6;
      const pad = 10;
      ctx.drawImage(opt.spriteImg, iconBoxX + pad, iconBoxY + pad, iconBoxSize - pad * 2, iconBoxSize - pad * 2);
    }
    ctx.restore();

    // Título
    ctx.font = "900 20px 'Titan One', 'Fredoka', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(opt.title, x + w * 0.5, y + 152);

    // Nivel
    ctx.font = "900 13px sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`NIVEL ${opt.level} / ${opt.maxLevel}`, x + w * 0.5, y + 178);

    // Descripción multi-línea
    ctx.font = "500 13px sans-serif";
    ctx.fillStyle = "#B0BEC5";
    const words = opt.desc.split(" ");
    let line = "";
    let lineY = y + 215;
    for (const word of words) {
      const testLine = line + word + " ";
      if (ctx.measureText(testLine).width > w - 30 && line !== "") {
        ctx.fillText(line, x + w * 0.5, lineY);
        line = word + " ";
        lineY += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + w * 0.5, lineY);

    // Botón inferior
    const btnW = w - 40;
    const btnH = 38;
    const btnX = x + 20;
    const btnY = y + h - 52;
    ctx.fillStyle = opt.color;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 10);
    ctx.fill();

    ctx.fillStyle = "#0A192F";
    ctx.font = "900 14px sans-serif";
    ctx.fillText("¡ELEGIR!", x + w * 0.5, btnY + btnH * 0.5);

    ctx.restore();
  }

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
      ctx.shadowBlur = 6;
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
    // Bolas de nieve enemigas Stylized 2D (con núcleo de hielo carmesí y halo de escarcha)
    for (const b of this.enemySnowballs) {
      ctx.save();
      // Resplandor exterior
      const grad = ctx.createRadialGradient(b.x, b.y, 3, b.x, b.y, 14);
      grad.addColorStop(0, "#FF8A80");
      grad.addColorStop(0.6, "#E53935");
      grad.addColorStop(1, "rgba(213, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo cristalino
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#D50000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pequeñas chispas de escarcha rotatorias
      for (let si = 0; si < 3; si++) {
        const sAng = t * 7 + (si * Math.PI * 2 / 3);
        const sx = b.x + Math.cos(sAng) * 9;
        const sy = b.y + Math.sin(sAng) * 9;
        ctx.fillStyle = "#FFCDD2";
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      }
      ctx.restore();
    }


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
    this.drawUpgradeModal(ctx, w, h);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (imgReady(this.backgroundImg)) {
      const img = this.backgroundImg;
      const isPortrait = h > w;
      const s = isPortrait
        ? Math.max(w / (img.naturalWidth * 0.72), h / img.naturalHeight)
        : Math.max(w / img.naturalWidth, h / img.naturalHeight);
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

  private drawSprite(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
    flip = false,
    rot = 0,
    scaleX = 1,
    scaleY = 1
  ): void {
    const ratio = img.naturalWidth / img.naturalHeight;
    const dw = (ratio >= 1 ? size : size * ratio) * scaleX;
    const dh = (ratio >= 1 ? size / ratio : size) * scaleY;
    ctx.save();
    ctx.translate(x, y);
    if (rot !== 0) ctx.rotate(rot);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  // ---------------------------- Jugador -------------------------------------

  private drawPlayer(ctx: CanvasRenderingContext2D, t: number): void {
    const x = this.px;
    const y = this.py;
    // Ventisca / Aura Congelante visible alrededor de Rodolfo
    if ((this.upgradeLevels.frost_aura || 0) > 0) {
      ctx.save();
      const auraR = this.statFrostAuraRadius;
      const pulse = 1.0 + Math.sin(t * 6) * 0.06;
      const r = auraR * pulse;

      // Gradiente radial místico
      const auraGrad = ctx.createRadialGradient(x, y, r * 0.45, x, y, r);
      auraGrad.addColorStop(0, "rgba(224, 64, 251, 0.0)");
      auraGrad.addColorStop(0.65, "rgba(224, 64, 251, 0.16)");
      auraGrad.addColorStop(0.9, "rgba(0, 229, 255, 0.28)");
      auraGrad.addColorStop(1, "rgba(255, 255, 255, 0.55)");

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Borde de escarcha con destellos
      ctx.strokeStyle = "rgba(0, 229, 255, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Copos y cristales girando en el vórtice del aura
      const crystalCount = 6;
      for (let ci = 0; ci < crystalCount; ci++) {
        const cAng = t * 3.5 + (ci * (Math.PI * 2 / crystalCount));
        const cx = x + Math.cos(cAng) * (r * 0.88);
        const cy = y + Math.sin(cAng) * (r * 0.88);
        ctx.fillStyle = "#E0F7FA";
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }


    if (this.isDying) {
      this.drawShadow(ctx, x, y + PLAYER_RADIUS * 0.9, PLAYER_RADIUS * 0.95);
      const wobble = Math.sin(t * 7) * 0.06;
      const dizzyBob = Math.sin(t * 3.5) * 2;
      const deadImg = imgReady(this.rodolfoDeadImg) ? this.rodolfoDeadImg : this.rodolfoHitImg;
      if (imgReady(deadImg)) {
        this.drawSprite(ctx, deadImg, x, y + dizzyBob, PLAYER_RADIUS * 3.0, false, wobble, 1.0, 1.0);
      } else {
        this.drawRodolfoFallback(ctx, x, y + dizzyBob, true, t);
      }

      // Estrellas mareadas dando vueltas sobre la cabeza
      ctx.save();
      const headY = y - PLAYER_RADIUS * 1.5;
      const numStars = 4;
      for (let i = 0; i < numStars; i++) {
        const starAng = t * 4.5 + (i * (Math.PI * 2 / numStars));
        const sx = x + Math.cos(starAng) * 28;
        const sy = headY + Math.sin(starAng) * 10;
        ctx.fillStyle = "#FFD700";
        ctx.shadowColor = "#FFF8E1";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = (p * Math.PI) / 2.5 - Math.PI / 2 + starAng;
          const rOut = 7;
          const rIn = 3;
          if (p === 0) ctx.moveTo(sx + Math.cos(a) * rOut, sy + Math.sin(a) * rOut);
          else ctx.lineTo(sx + Math.cos(a) * rOut, sy + Math.sin(a) * rOut);
          const aMid = a + Math.PI / 5;
          ctx.lineTo(sx + Math.cos(aMid) * rIn, sy + Math.sin(aMid) * rIn);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

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

    const speed = Math.hypot(this.pvx, this.pvy);
    const isMoving = this.joystick.magnitude > 0.08 || speed > 25;
    const isHit = this.invulnerable > INVULNERABLE_TIME - 0.35;

    let img: HTMLImageElement;
    let bob = 0;
    let rot = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (isHit) {
      img = this.rodolfoHitImg;
      bob = Math.sin(t * 18) * 2;
      rot = Math.sin(t * 22) * 0.08;
    } else if (isMoving) {
      // Fase continua entre 0.0 y 1.0 para interpolación orgánica
      const phase = (this.walkAnim) % 1.0;
      const dirSet = this.rodolfoSprites[this.facing];

      // Temporización de animación profesional:
      // 0.00 a 0.32: Zancada pie 1 (extensión y apoyo)
      // 0.32 a 0.50: Paso intermedio (pies juntos en transición)
      // 0.50 a 0.82: Zancada pie 2 (extensión y apoyo)
      // 0.82 a 1.00: Paso intermedio (pies juntos en transición)
      if (phase < 0.32) {
        img = dirSet.step1;
      } else if (phase < 0.50) {
        img = dirSet.pass;
      } else if (phase < 0.82) {
        img = dirSet.step2;
      } else {
        img = dirSet.pass;
      }

      // Rebote vertical orgánico (suave elevación en paso intermedio, caída al apoyar el pie)
      bob = -Math.abs(Math.sin(phase * Math.PI * 2)) * 4.8;

      // Deformación elástica sutil (Squash & Stretch ~2.5% estilo Supercell) que da vida a los sprites
      const squashWave = Math.sin(phase * Math.PI * 2);
      scaleX = 1.0 + Math.abs(squashWave) * 0.035;
      scaleY = 1.0 - Math.abs(squashWave) * 0.035;

      // Inclinación pendular natural del torso según la zancada
      const swayFactor = (this.facing === "left" || this.facing === "right") ? 0.4 : 1.0;
      rot = Math.sin(phase * Math.PI * 2) * 0.045 * swayFactor;
    } else {
      // Pose de STOP / Quieto mirando a esa dirección con ambos pies firmes
      img = this.rodolfoSprites[this.facing].stop;
      // Respiración sutil en reposo
      bob = Math.sin(t * 3.2) * 1.6;
      scaleY = 1.0 + Math.sin(t * 3.2) * 0.018;
      scaleX = 1.0 - Math.sin(t * 3.2) * 0.012;
    }

    if (imgReady(img)) {
      this.drawSprite(ctx, img, x, y + bob, PLAYER_RADIUS * 2.8, false, rot, scaleX, scaleY);
    } else {
      this.drawRodolfoFallback(ctx, x, y + bob, isHit, t);
    }
  }

  private drawRodolfoFallback(ctx: CanvasRenderingContext2D, x: number, y: number, isHit: boolean, t: number): void {
    const s = PLAYER_RADIUS;
    ctx.save();
    ctx.translate(x, y);
    if (this.facing === "left") ctx.scale(-1, 1);

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
      const off = (this.facing === "left" || this.facing === "right") ? s * 0.18 : 0;
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
    const isDying = (e.defeatTimer ?? 0) > 0;
    this.drawShadow(ctx, e.x, e.y + e.r * 0.95, e.r * (isDying ? 1.1 : 0.85));
    const flash = e.hitFlash > 0;
    const isAttacking = (e.attackTimer ?? 0) > 0;

    let img: HTMLImageElement | null = null;
    if (e.kind === "snowman") {
      if (isDying && imgReady(this.snowmanDeadImg)) {
        img = this.snowmanDeadImg;
      } else if (flash && imgReady(this.snowmanHitImg)) {
        img = this.snowmanHitImg;
      } else if (isAttacking && imgReady(this.snowmanAtkImg)) {
        img = this.snowmanAtkImg;
      } else {
        img = Math.sin(e.wobble) > 0 ? this.snowmanImg : (imgReady(this.snowmanImg2) ? this.snowmanImg2 : this.snowmanImg);
      }
    } else if (e.kind === "elf") {
      if (flash && imgReady(this.elfHitImg)) {
        img = this.elfHitImg;
      } else if (isAttacking && imgReady(this.elfAtkImg)) {
        img = this.elfAtkImg;
      } else {
        img = Math.sin(e.wobble) > 0 || !imgReady(this.elfImg2) ? this.elfImg : this.elfImg2;
      }
      if (e.isDashing) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        const trailImg = imgReady(this.elfAtkImg) ? this.elfAtkImg : img;
        if (trailImg && imgReady(trailImg)) {
          this.drawSprite(ctx, trailImg, e.x - (this.px - e.x) * 0.08, e.y - (this.py - e.y) * 0.08, e.r * 2.6, false, 0, 1.0, 1.0);
        }
        ctx.restore();
      }
    } else {
      if (isAttacking) {
        // Onda expansiva de escarcha rúnica generada por el pisotón del Yeti
        ctx.save();
        const shockRadius = e.r * 2.2 * (1 - (e.attackTimer || 0) / 0.6);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.75)";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, shockRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, shockRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (flash && imgReady(this.yetiHitImg)) {
        img = this.yetiHitImg;
      } else if (isAttacking && imgReady(this.yetiSlamImg)) {
        img = this.yetiSlamImg;
      } else {
        img = Math.sin(e.wobble) > 0 || !imgReady(this.yetiImg2) ? this.yetiImg : this.yetiImg2;
      }
    }

    const sway = isDying ? 0 : Math.sin(e.wobble) * (e.kind === "elf" ? 0.12 : 0.05);
    if (imgReady(img)) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (isDying) {
        const fade = Math.max(0, (e.defeatTimer ?? 0) / 0.35);
        ctx.globalAlpha = fade;
        if (e.kind === "snowman") {
          ctx.scale(1.15, 0.7);
        } else {
          ctx.rotate(-0.35);
        }
      } else {
        ctx.rotate(sway);
        if (flash && e.kind === "elf" && !imgReady(this.elfHitImg)) ctx.globalAlpha = 0.6;
      }
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

    // Barra de vida (enemigos con más de 1 impacto mientras sigan en combate)
    if (!isDying && e.maxHp > 1 && e.hp < e.maxHp) {
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


    // ------------------------------------------------------------------------
    // BARRA DE PROGRESO DE FASE / MEJORA (Stylized 2D Game HUD)
    // ------------------------------------------------------------------------
    const prevThreshold = this.upgradeLevel === 0 ? 0 : this.nextUpgradeKillThreshold - (10 + this.upgradeLevel * 4);
    const range = Math.max(1, this.nextUpgradeKillThreshold - prevThreshold);
    const currentProgress = Math.min(range, Math.max(0, this.enemiesDefeatedCount - prevThreshold));
    const pct = Math.min(1.0, currentProgress / range);

    const barW = Math.min(380, w * 0.72);
    const barH = 22;
    const barX = (w - barW) / 2;
    const barY = 96;

    ctx.save();
    // Marco exterior con relieve y sombra
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(10, 25, 47, 0.88)";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Relleno de barra con gradiente dorado/cian festivo
    if (pct > 0.02) {
      const fillW = Math.max(14, (barW - 6) * pct);
      const barGrad = ctx.createLinearGradient(barX + 3, barY + 3, barX + 3 + fillW, barY + barH - 6);
      barGrad.addColorStop(0, "#00E5FF");
      barGrad.addColorStop(0.5, "#76FF03");
      barGrad.addColorStop(1, "#FFD700");
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX + 3, barY + 3, fillW, barH - 6, 8);
      ctx.fill();

      // Brillo en la cresta de la barra
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillRect(barX + 5, barY + 4, fillW - 4, (barH - 8) * 0.4);
    }

    // Texto de la barra de fase
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 11px 'Titan One', 'Fredoka', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(`FASE ${this.upgradeLevel + 1}  •  ${currentProgress} / ${range} INVASORES`, w / 2, barY + barH * 0.52);
    ctx.restore();

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
