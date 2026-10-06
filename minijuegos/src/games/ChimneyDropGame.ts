/**
 * ==============================================================================
 * JUEGO 2: DISPARA-REGALOS A LAS CHIMENEAS (Chimney Toy Drop / Elfo de Altos Vuelos)
 * ==============================================================================
 * 
 * Inspirado en el clásico "Elfo de Altos Vuelos" de Google Santa Tracker.
 * 
 * MECÁNICA:
 * - El Elfo de la Feria vuela en su ala delta festiva en la parte superior del cielo.
 * - El jugador controla la posición del elfo arrastrando el dedo o con toques.
 * - Al tocar la pantalla, el elfo suelta un regalo que cae con inercia y gravedad parabólica.
 * - En la parte inferior se desplaza una aldea navideña con tejados y chimeneas activas con humo.
 * - Encestar regalos en las chimeneas otorga puntos y combo de precisión.
 * - Los regalos dorados con el Logo Oficial de la Feria otorgan +500 pts y Bonus x2.
 * - Esquiva globos de tormenta en el cielo para proteger tus 3 vidas.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";

interface ChimneyTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  chimneyX: number;
  chimneyY: number;
  chimneyW: number;
  chimneyH: number;
  roofType: number;
  color: string;
  scored: boolean;
}

interface DroppedPresent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  type: "red" | "green" | "teddy" | "fair_logo";
  points: number;
  active: boolean;
}

interface SkyHazard {
  x: number;
  y: number;
  vx: number;
  radius: number;
  type: "storm_balloon" | "gold_star";
  passed: boolean;
}

export class ChimneyDropGame extends BaseGame {
  // Elfo en Ala Delta (Movimiento 2D Libre en el Cielo)
  private elfX: number = 300;
  private elfY: number = 160;
  private targetElfX: number = 300;
  private targetElfY: number = 160;
  private elfVx: number = 0;
  private elfTilt: number = 0;
  private elfWingSpan: number = 90;
  private invulnerableTimer: number = 0; // Tiempo de inmunidad tras recibir daño

  // Aldea Nevada y desplazamiento
  private scrollSpeed: number = 220;
  private houses: ChimneyTarget[] = [];
  private hazards: SkyHazard[] = [];
  private droppedPresents: DroppedPresent[] = [];

  private dropCooldown: number = 0;
  private spawnHazardTimer: number = 0;
  private chimneySmokeTimer: number = 0;

  // Sprites Oficiales HD
  private spriteElf: HTMLImageElement;
  private spriteHouseRed: HTMLImageElement;
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteTeddy: HTMLImageElement;
  private spriteFairLogo: HTMLImageElement;
  private spriteCampusLogo: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "sleigh-rush", // Mantiene el id para compatibilidad con récords
      "Dispara-Regalos a las Chimeneas",
      "¡Mueve al elfo en cualquier dirección para esquivar y toca abajo para encestar regalos!",
      canvas,
      input,
      audio,
      particles
    );

    this.showLives = true;
    this.maxLives = 3;
    this.lives = 3;

    // Cargar sprites oficiales
    this.spriteElf = new Image();
    this.spriteElf.src = "/assets/images/elfo-planeador.png";

    this.spriteHouseRed = new Image();
    this.spriteHouseRed.src = "/assets/images/casa-roja.png";

    this.spriteGiftRed = new Image();
    this.spriteGiftRed.src = "/assets/images/regalo-rojo.png";

    this.spriteGiftGreen = new Image();
    this.spriteGiftGreen.src = "/assets/images/regalo-verde.png";

    this.spriteTeddy = new Image();
    this.spriteTeddy.src = "/assets/images/osito.png";

    this.spriteFairLogo = new Image();
    this.spriteFairLogo.src = BRANDING.getLogoPath(1);

    this.spriteCampusLogo = new Image();
    this.spriteCampusLogo.src = BRANDING.getLogoPath(2);
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.elfWingSpan = Math.min(120, Math.max(75, width * 0.16));
  }

  protected onStart(): void {
    this.elfX = this.width / 2;
    this.targetElfX = this.width / 2;
    this.elfY = Math.max(120, this.height * 0.20);
    this.targetElfY = this.elfY;
    this.elfVx = 0;
    this.elfTilt = 0;
    this.invulnerableTimer = 0;
    this.scrollSpeed = 220;
    this.lives = this.maxLives;

    this.houses = [];
    this.hazards = [];
    this.droppedPresents = [];
    this.dropCooldown = 0;
    this.spawnHazardTimer = 0;

    // Generar casas iniciales en la aldea
    this.seedInitialVillage();
  }

  private seedInitialVillage(): void {
    let currentX = 50;
    while (currentX < this.width + 400) {
      const houseW = 160 + Math.random() * 80;
      this.createHouse(currentX, houseW);
      currentX += houseW + 20 + Math.random() * 40;
    }
  }

  private createHouse(x: number, w: number): void {
    const groundY = this.height - 110;
    const h = 140 + Math.random() * 70;
    const houseY = groundY - h;

    const colors = ["#1E3A8A", "#312E81", "#4C1D95", "#1E293B", "#14532D"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Chimenea en el techo
    const chimneyW = 42;
    const chimneyH = 48;
    const chimneyOffset = 25 + Math.random() * (w - 75);

    this.houses.push({
      x,
      y: houseY,
      width: w,
      height: h,
      chimneyX: x + chimneyOffset,
      chimneyY: houseY - chimneyH + 10,
      chimneyW,
      chimneyH,
      roofType: Math.floor(Math.random() * 3),
      color,
      scored: false
    });
  }

  protected onUpdate(dt: number): void {
    const maxFlightY = Math.min(this.height * 0.46, this.height - 240);
    const minFlightY = 70;

    // 1. Control Táctil del Elfo en Ala Delta (Movimiento 2D Completo)
    const pointer = this.input.getPrimaryPointer();
    if (pointer && pointer.isDown) {
      const dropZoneY = this.height - 140;

      // Si toca en la zona inferior de botón → Disparar
      if (pointer.y >= dropZoneY) {
        if (this.dropCooldown <= 0) {
          this.dropPresent();
        }
      } else {
        // En cualquier otra parte de la pantalla → Control de Vuelo 2D Suave
        this.targetElfX = Math.max(50, Math.min(this.width - 50, pointer.x));
        this.targetElfY = Math.max(minFlightY, Math.min(maxFlightY, pointer.y));

        // Si toca un poco más abajo del elfo, también suelta regalo
        if (pointer.y > this.elfY + 90 && this.dropCooldown <= 0) {
          this.dropPresent();
        }
      }
    }

    // Soporte teclado PC (Movimiento en 4 direcciones + Espacio)
    const speedPC = 520 * dt;
    if (this.input.isKeyDown("ArrowLeft") || this.input.isKeyDown("KeyA")) {
      this.targetElfX = Math.max(50, this.targetElfX - speedPC);
    }
    if (this.input.isKeyDown("ArrowRight") || this.input.isKeyDown("KeyD")) {
      this.targetElfX = Math.min(this.width - 50, this.targetElfX + speedPC);
    }
    if (this.input.isKeyDown("ArrowUp") || this.input.isKeyDown("KeyW")) {
      this.targetElfY = Math.max(minFlightY, this.targetElfY - speedPC);
    }
    if (this.input.isKeyDown("ArrowDown") || this.input.isKeyDown("KeyS")) {
      this.targetElfY = Math.min(maxFlightY, this.targetElfY + speedPC);
    }
    if (this.input.isKeyDown("Space") && this.dropCooldown <= 0) {
      this.dropPresent();
    }

    // Suavizado e inercia del vuelo en X e Y
    const prevX = this.elfX;
    this.elfX += (this.targetElfX - this.elfX) * 14 * dt;
    this.elfY += (this.targetElfY - this.elfY) * 14 * dt;
    this.elfVx = (this.elfX - prevX) / Math.max(0.001, dt);
    this.elfTilt = (this.elfVx / 380) * 0.32;

    // Cooldown de lanzamiento y tiempo de inmunidad
    if (this.dropCooldown > 0) this.dropCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // 2. Desplazamiento de la Aldea Nevada (Hacia la izquierda)
    const currentSpeed = this.scrollSpeed + (45 - this.timeRemaining) * 2.5;

    for (let i = this.houses.length - 1; i >= 0; i--) {
      const house = this.houses[i];
      house.x -= currentSpeed * dt;
      house.chimneyX -= currentSpeed * dt;

      if (house.x + house.width < -100) {
        this.houses.splice(i, 1);
      }
    }

    // Generar nuevas casas continuamente
    const lastHouse = this.houses[this.houses.length - 1];
    if (!lastHouse || lastHouse.x + lastHouse.width < this.width + 100) {
      const startX = lastHouse ? lastHouse.x + lastHouse.width + 25 + Math.random() * 40 : this.width + 50;
      this.createHouse(startX, 160 + Math.random() * 80);
    }

    // Humo de chimeneas
    this.chimneySmokeTimer += dt;
    if (this.chimneySmokeTimer > 0.12) {
      this.chimneySmokeTimer = 0;
      for (const house of this.houses) {
        if (house.chimneyX > -50 && house.chimneyX < this.width + 50) {
          this.particles.emitBurst(house.chimneyX + house.chimneyW / 2, house.chimneyY, "rgba(255,255,255,0.4)", 1);
        }
      }
    }

    // 3. Generación y Movimiento de Obstáculos/Estrellas en Carriles Claros del Cielo
    this.spawnHazardTimer += dt;
    if (this.spawnHazardTimer > 2.0) {
      this.spawnHazardTimer = 0;
      const isStar = Math.random() < 0.45;
      // Generar en 2 alturas predecibles (alta o baja) para que siempre haya un carril libre para esquivar
      const laneY = Math.random() < 0.5 ? 90 + Math.random() * 50 : maxFlightY - 40 - Math.random() * 50;

      this.hazards.push({
        x: this.width + 60,
        y: laneY,
        vx: -(currentSpeed * 0.95),
        radius: isStar ? 22 : 24,
        type: isStar ? "gold_star" : "storm_balloon",
        passed: false
      });
    }

    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const haz = this.hazards[i];
      haz.x += haz.vx * dt;

      // Colisión con el Elfo (Hitbox ajustada y justa)
      const distToElf = Math.hypot(haz.x - this.elfX, haz.y - this.elfY);
      if (!haz.passed && distToElf < haz.radius + 22) {
        if (haz.type === "storm_balloon") {
          // Solo recibe daño si no está en tiempo de inmunidad
          if (this.invulnerableTimer <= 0) {
            haz.passed = true;
            this.lives--;
            this.invulnerableTimer = 1.6; // 1.6 segundos de invulnerabilidad
            this.addScore(-100);
            this.audio.playError();
            this.triggerShake(0.25, 8);
            this.addFloatingText("-1 VIDA", this.elfX, this.elfY - 45, "#FF1744", 1.3);
            this.particles.emitBurst(haz.x, haz.y, "#FF416C", 20);

            if (this.lives <= 0) {
              this.lives = 0;
              this.endGame();
            }
            this.hazards.splice(i, 1);
            continue;
          }
        } else {
          // Estrella dorada coleccionable
          haz.passed = true;
          this.addScore(150);
          this.audio.playCatchItem();
          this.addFloatingText("+150", haz.x, haz.y - 30, "#FFD700");
          this.particles.emitBurst(haz.x, haz.y, "#FFD700", 15);
          this.hazards.splice(i, 1);
          continue;
        }
      }

      if (haz.x < -80) {
        this.hazards.splice(i, 1);
      }
    }

    // 4. Físicas y Colisiones de Regalos Lanzados
    const gravity = 850; // Píxeles por segundo cuadrado

    for (let i = this.droppedPresents.length - 1; i >= 0; i--) {
      const p = this.droppedPresents[i];
      p.vy += gravity * dt;
      p.x += (p.vx - currentSpeed * 0.3) * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      let hitSomething = false;

      // Comprobar si entró en una chimenea
      for (const house of this.houses) {
        const topOfChimney = house.chimneyY;
        const leftChimney = house.chimneyX - 10;
        const rightChimney = house.chimneyX + house.chimneyW + 10;

        if (
          p.y >= topOfChimney &&
          p.y <= topOfChimney + 35 &&
          p.x >= leftChimney &&
          p.x <= rightChimney
        ) {
          // ¡CANASTA EN LA CHIMENEA!
          hitSomething = true;
          this.audio.playCatchItem(1.2);

          if (p.type === "fair_logo") {
            // LOGO OFICIAL: FERIA MÁGICA
            this.addScore(500);
            this.triggerLogoPowerUp(1, 6);
            this.triggerShake(0.18, 6);
            this.addFloatingText("¡SUPER BONUS FERIA! +500", p.x, p.y - 50, "#FFD700", 1.4);
            this.particles.emitConfetti(this.width, 35);
          } else {
            const pts = p.points;
            this.addScore(pts);
            this.addFloatingText(`+${pts} ¡CHIMENEA!`, p.x, p.y - 40, "#00E676", 1.25);
            this.particles.emitBurst(house.chimneyX + house.chimneyW / 2, house.chimneyY, "#FFD700", 25);
          }
          break;
        }
      }

      // Si cayó al tejado o al suelo sin entrar
      const groundY = this.height - 110;
      if (!hitSomething && p.y >= groundY) {
        hitSomething = true;
        this.particles.emitBurst(p.x, groundY, "#FFFFFF", 6);
      }

      if (hitSomething || p.y > this.height + 60) {
        this.droppedPresents.splice(i, 1);
      }
    }
  }

  private dropPresent(): void {
    this.dropCooldown = 0.38; // Cadencia de lanzamiento
    this.audio.playTap();

    const roll = Math.random();
    let type: DroppedPresent["type"] = "red";
    let points = 200;

    if (roll < 0.12) {
      // 12% Regalo Especial Feria Mágica (+500 pts y halo dorado)
      type = "fair_logo";
      points = 500;
    } else if (roll < 0.40) {
      type = "teddy";
      points = 300;
    } else if (roll < 0.70) {
      type = "green";
      points = 200;
    }

    this.droppedPresents.push({
      x: this.elfX,
      y: this.elfY + 25,
      vx: this.elfVx * 0.45,
      vy: 120, // Impulso inicial hacia abajo
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 6,
      type,
      points,
      active: true
    });
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Cielo Nocturno con degradado de invierno
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, "#050D1E");
    skyGrad.addColorStop(0.5, "#0D1E3A");
    skyGrad.addColorStop(0.85, "#1E293B");
    skyGrad.addColorStop(1, "#0F172A");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Luna llena brillante en el fondo
    ctx.fillStyle = "rgba(255, 255, 230, 0.85)";
    ctx.beginPath();
    ctx.arc(this.width * 0.85, this.height * 0.12, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 200, 0.2)";
    ctx.beginPath();
    ctx.arc(this.width * 0.85, this.height * 0.12, 54, 0, Math.PI * 2);
    ctx.fill();

    // 2. Silueta de Montañas Nevadas en el Horizonte
    ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
    ctx.beginPath();
    ctx.moveTo(0, this.height * 0.65);
    ctx.lineTo(this.width * 0.25, this.height * 0.52);
    ctx.lineTo(this.width * 0.55, this.height * 0.62);
    ctx.lineTo(this.width * 0.8, this.height * 0.48);
    ctx.lineTo(this.width, this.height * 0.58);
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // 3. Dibujar Casas de la Aldea y Chimeneas
    for (const house of this.houses) {
      // Cuerpo de la casa
      ctx.fillStyle = house.color;
      ctx.fillRect(house.x, house.y, house.width, house.height);

      // Ventanas iluminadas cálidas
      ctx.fillStyle = "#FDE047";
      ctx.fillRect(house.x + 20, house.y + 35, 28, 28);
      ctx.fillRect(house.x + house.width - 48, house.y + 35, 28, 28);

      // Chimenea de ladrillos
      ctx.fillStyle = "#B91C1C";
      ctx.fillRect(house.chimneyX, house.chimneyY, house.chimneyW, house.chimneyH);
      ctx.fillStyle = "#7F1D1D";
      ctx.fillRect(house.chimneyX + 4, house.chimneyY + 8, house.chimneyW - 8, 4);

      // Corona nevada en la boca de la chimenea
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(house.chimneyX - 4, house.chimneyY - 6, house.chimneyW + 8, 10, [4]);
      ctx.fill();

      // Tejado Triangular Nevado
      ctx.fillStyle = "#1E1B4B";
      ctx.beginPath();
      ctx.moveTo(house.x - 12, house.y);
      ctx.lineTo(house.x + house.width / 2, house.y - 35);
      ctx.lineTo(house.x + house.width + 12, house.y);
      ctx.closePath();
      ctx.fill();

      // Manto de nieve en el tejado
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(house.x - 12, house.y);
      ctx.lineTo(house.x + house.width / 2, house.y - 35);
      ctx.lineTo(house.x + house.width + 12, house.y);
      ctx.stroke();
    }

    // Suelo nevado
    const groundY = this.height - 110;
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, groundY, this.width, this.height - groundY);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // 4. Dibujar Obstáculos y Estrellas en el Cielo
    for (const haz of this.hazards) {
      ctx.save();
      ctx.translate(haz.x, haz.y);

      if (haz.type === "storm_balloon") {
        // Globo de advertencia con signo de exclamación (Estilo Santa Tracker)
        ctx.fillStyle = "#84CC16"; // Verde lima
        ctx.beginPath();
        ctx.arc(0, -6, haz.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#65A30D";
        ctx.beginPath();
        ctx.moveTo(-6, 20);
        ctx.lineTo(6, 20);
        ctx.lineTo(0, 26);
        ctx.closePath();
        ctx.fill();

        // Triángulo de advertencia en el centro
        ctx.fillStyle = "#FACC15";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(12, 4);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", 0, -4);
      } else {
        // Estrella dorada coleccionable
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(angle) * haz.radius;
          const py = Math.sin(angle) * haz.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#FFF385";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Dibujar Regalos en Vuelo Parabólico (100% Sprites HD)
    for (const p of this.droppedPresents) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const isLogo = p.type === "fair_logo";
      const size = isLogo ? 54 : 44;

      let imgToDraw: HTMLImageElement | null = null;
      if (p.type === "fair_logo") imgToDraw = this.spriteFairLogo;
      else if (p.type === "teddy") imgToDraw = this.spriteTeddy;
      else if (p.type === "green") imgToDraw = this.spriteGiftGreen;
      else imgToDraw = this.spriteGiftRed;

      if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
        ctx.drawImage(imgToDraw, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = p.type === "fair_logo" ? "#FFD700" : "#EF4444";
        ctx.fillRect(-size / 2, -size / 2, size, size);
      }

      ctx.restore();
    }

    // 6. Dibujar el Elfo en Ala Delta (Sprite HD + Efecto de Inmunidad y Vuelo)
    ctx.save();
    ctx.translate(this.elfX, this.elfY);
    ctx.rotate(this.elfTilt);

    // Efecto de parpadeo si está invulnerable
    if (this.invulnerableTimer > 0) {
      ctx.globalAlpha = Math.floor(Date.now() / 90) % 2 === 0 ? 0.35 : 0.9;
    }

    const elfDrawSize = this.elfWingSpan * 1.35;

    if (this.spriteElf && this.spriteElf.complete && this.spriteElf.naturalWidth > 0) {
      ctx.drawImage(this.spriteElf, -elfDrawSize / 2, -elfDrawSize / 2, elfDrawSize, elfDrawSize);
    } else {
      const halfW = this.elfWingSpan / 2;

      // Ala Delta Triangular (Amarillo dorado con franja roja de la Feria)
      ctx.fillStyle = "#FACC15";
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(halfW, 14);
      ctx.lineTo(0, 6);
      ctx.lineTo(-halfW, 14);
      ctx.closePath();
      ctx.fill();

      // Franja roja central
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(halfW * 0.45, -2);
      ctx.lineTo(0, 6);
      ctx.lineTo(-halfW * 0.45, -2);
      ctx.closePath();
      ctx.fill();

      // Estructura y barra de control del ala delta
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.lineTo(0, 24);
      ctx.lineTo(16, 8);
      ctx.stroke();

      // Cabeza y Gorro del Elfo
      ctx.fillStyle = "#16A34A"; // Traje verde elfo
      ctx.fillRect(-12, 14, 24, 18);

      // Gorro rojo navideño hacia atrás por el viento
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-24, 6);
      ctx.lineTo(0, 18);
      ctx.closePath();
      ctx.fill();

      // Pompón blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(-26, 6, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cabeza del elfo con gafas de aviador
      ctx.fillStyle = "#FBCFE8";
      ctx.beginPath();
      ctx.arc(4, 16, 8, 0, Math.PI * 2);
      ctx.fill();

      // Gafas de aviador
      ctx.fillStyle = "#0284C7";
      ctx.fillRect(4, 13, 8, 5);
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 13, 8, 5);

      // Saco de regalos colgado detrás del elfo
      ctx.fillStyle = "#78350F";
      ctx.beginPath();
      ctx.ellipse(-14, 24, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 7. Botón Táctil Gigante de Lanzamiento en la parte inferior
    ctx.save();
    const btnW = Math.min(480, this.width * 0.76);
    const btnH = Math.max(48, Math.min(56, this.height * 0.07));
    const btnX = (this.width - btnW) / 2;
    const btnY = this.height - btnH - 18;

    ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, [btnH / 2]);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${Math.max(14, Math.min(18, this.width * 0.038))}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎁 TOCA PARA SOLTAR REGALO 🎁", this.width / 2, btnY + btnH / 2);
    ctx.restore();
  }
}
