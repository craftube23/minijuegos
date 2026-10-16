/**
 * ==============================================================================
 * CORTO ANIMADO CINEMÁTICO FESTIVO (GameStoryCinemaModal - Cutscene Engine)
 * ==============================================================================
 * 
 * Cinemática animada fluida de 4.4 segundos (Estilo Cartoon / Cutscene arcade):
 * - 100% visual y cinematográfico: sin viñetas estáticas ni textos largos.
 * - Animación continua a 60 FPS en Canvas 2D de alta resolución.
 * - Explica el porqué de cada juego con acción, humor y física en tiempo real:
 *   Ej. Santa pierde los regalos en el aire, se le abre el saco, caen rebotando,
 *   y Santa se zambulle en su trineo para rescatarlos.
 * - Barra de cine panorámica con borde de oro y barra de tiempo sutil.
 * - Botón "⏭ SALTAR / ¡A JUGAR!" siempre accesible para jugar al instante.
 */

import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

interface FallingToy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  img: HTMLImageElement;
  size: number;
}

export class GameStoryCinemaModal {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: AudioManager;

  private isRunning: boolean = false;
  private startTime: number = 0;
  private readonly totalDuration: number = 4.4; // 4.4 segundos exactos
  private currentGameId: string = "";
  private animFrameId: number | null = null;

  // Cache de imágenes
  private images: Map<string, HTMLImageElement> = new Map();
  private fallingToys: FallingToy[] = [];
  private soundTriggers: Set<string> = new Set();

  public onComplete?: () => void;
  public onSkipToPlay?: () => void;
  public onBack?: () => void;

  constructor(containerId: string, audio: AudioManager) {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "game-story-cinema-modal hide";
      document.body.appendChild(el);
    }
    this.container = el;
    this.audio = audio;

    this.container.innerHTML = `
      <div class="cinema-backdrop"></div>
      <div class="cinema-theater-frame cutscene-frame">
        <!-- BARRAS CINEMATOGRÁFICAS -->
        <div class="cinema-letterbox-bar bar-top">
          <div class="cutscene-badge">
            <span class="badge-dot">●</span>
            <span id="cutscene-title-badge">MISIÓN NAVIDEÑA</span>
          </div>
          <button id="btn-cutscene-skip" class="btn-cutscene-skip-clean">
            <span>SALTAR</span>
            ${getIconSvg("play", { size: 14, color: "#FFFFFF", fill: "#FFFFFF" })}
          </button>
        </div>

        <!-- CANVAS DE ACCIÓN ANIMADA -->
        <canvas id="cinema-cutscene-canvas" class="cinema-cutscene-canvas"></canvas>

        <div class="cinema-letterbox-bar bar-bottom">
          <div class="cutscene-progress-container">
            <div id="cutscene-progress-fill" class="cutscene-progress-fill"></div>
          </div>
        </div>
      </div>
    `;

    const canvasEl = this.container.querySelector<HTMLCanvasElement>("#cinema-cutscene-canvas");
    if (!canvasEl) throw new Error("No se encontró canvas en cutscene");
    this.canvas = canvasEl;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener context 2D para cutscene");
    this.ctx = ctx;

    this.preloadAssets();
    this.setupEvents();
  }

  private preloadAssets(): void {
    const list = [
      "./assets/images/santa-trineo.png",
      "./assets/images/bolsa de regalos.png",
      "./assets/images/regalo-estilizado-rojo.png",
      "./assets/images/regalo-estilizado-verde.png",
      "./assets/images/regalo-estilizado-azul.png",
      "./assets/images/regalo-estilizado-dorado.png",
      "./assets/images/fondo-villa-montanas.jpg",
      "./assets/images/fondo-villa-seamless.jpg",
      "./assets/images/fondo-nieve.webp",
      "./assets/images/fondo-tiro-al-blanco.webp",
      "./assets/images/fondo-habitacion.webp",
      "./assets/images/elfo-volador.png",
      "./assets/images/elfo-baterista.png",
      "./assets/images/obstaculo-muneco.png",
      "./assets/images/pedestal-torre-regalos.png",
      "./assets/images/baston-caramelo.png",
      "./assets/images/osito.png",
      "./assets/images/robot.png",
      "./assets/images/estrella con logo.png",
      "./assets/images/chimenea-obstaculo.png",
      "./assets/images/icon-campanas.png",
      "./assets/images/icon-tambores.png",
      "./assets/images/icon-cartas.png"
    ];

    list.forEach(src => {
      const img = new Image();
      img.src = src;
      this.images.set(src, img);
    });
  }

  private getImage(src: string): HTMLImageElement | undefined {
    return this.images.get(src);
  }

  private setupEvents(): void {
    const btnSkip = this.container.querySelector<HTMLElement>("#btn-cutscene-skip");
    btnSkip?.addEventListener("click", () => {
      this.audio.playTap();
      this.finishAndExit(true);
    });

    // Toque en el canvas salta directamente al juego
    this.canvas.addEventListener("pointerdown", () => {
      this.audio.playTap();
      this.finishAndExit(true);
    });
  }

  public show(gameId: string): void {
    this.currentGameId = gameId;
    this.isRunning = true;
    this.startTime = performance.now();
    this.soundTriggers.clear();
    this.fallingToys = [];

    this.container.classList.remove("hide");
    this.container.classList.add("show");
    this.container.style.display = "flex";

    this.resizeCanvas();
    this.initCutsceneData(gameId);

    // Arrancar loop animado a 60fps
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  }

  public hide(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.container.classList.remove("show");
    this.container.classList.add("hide");
    this.container.style.display = "none";
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = (rect.width || 800) * dpr;
    this.canvas.height = (rect.height || 450) * dpr;
  }

  private initCutsceneData(gameId: string): void {
    const badge = this.container.querySelector<HTMLElement>("#cutscene-title-badge");
    if (badge) {
      const titles: Record<string, string> = {
        "santa-hills": "¡SANTA PERDIÓ LOS REGALOS!",
        "toy-catch": "¡LLUVIA MÁGICA EN LA FÁBRICA!",
        "gift-tower": "¡LA TORRE HACIA LA ESTRELLA!",
        "flying-elf": "¡RESCATE DE LA CARTA DORADA!",
        "snowball-target": "¡PILLOS EN LA FERIA!",
        "bell-symphony": "¡LA SINFONÍA DE LA CIUDAD!",
        "tree-melody": "¡EL REDOBLE DEL CASCANUECES!",
        "magic-pairs": "¡LOS REGALOS DESORDENADOS!"
      };
      badge.textContent = titles[gameId] || "MISIÓN NAVIDEÑA";
    }

    // Inicializar juguetes si aplica
    if (gameId === "santa-hills" || gameId === "toy-catch") {
      const giftSources = [
        "./assets/images/regalo-estilizado-rojo.png",
        "./assets/images/regalo-estilizado-verde.png",
        "./assets/images/regalo-estilizado-azul.png",
        "./assets/images/regalo-estilizado-dorado.png",
        "./assets/images/osito.png",
        "./assets/images/robot.png"
      ];

      for (let i = 0; i < 7; i++) {
        const src = giftSources[i % giftSources.length];
        const img = this.getImage(src) || new Image();
        this.fallingToys.push({
          x: 0,
          y: 0,
          vx: (Math.random() - 0.7) * 220,
          vy: -80 - Math.random() * 120,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 6,
          img,
          size: 42 + Math.random() * 20
        });
      }
    }
  }

  private renderLoop = (now: number): void => {
    if (!this.isRunning) return;

    const elapsedSec = (now - this.startTime) / 1000;
    const progress = Math.min(1.0, elapsedSec / this.totalDuration);

    // Actualizar barra de progreso
    const fill = this.container.querySelector<HTMLElement>("#cutscene-progress-fill");
    if (fill) fill.style.width = `${progress * 100}%`;

    // Renderizar fotograma según el juego
    this.renderFrame(elapsedSec);

    if (elapsedSec >= this.totalDuration) {
      this.finishAndExit(false);
    } else {
      this.animFrameId = requestAnimationFrame(this.renderLoop);
    }
  };

  private renderFrame(t: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    switch (this.currentGameId) {
      case "santa-hills":
        this.renderSantaHillsScene(ctx, w, h, t);
        break;
      case "toy-catch":
        this.renderToyCatchScene(ctx, w, h, t);
        break;
      case "gift-tower":
        this.renderGiftTowerScene(ctx, w, h, t);
        break;
      case "flying-elf":
        this.renderFlyingElfScene(ctx, w, h, t);
        break;
      case "snowball-target":
        this.renderSnowballTargetScene(ctx, w, h, t);
        break;
      case "bell-symphony":
        this.renderBellSymphonyScene(ctx, w, h, t);
        break;
      case "tree-melody":
        this.renderNutcrackerScene(ctx, w, h, t);
        break;
      case "magic-pairs":
        this.renderMagicPairsScene(ctx, w, h, t);
        break;
      default:
        this.renderGenericScene(ctx, w, h, t);
        break;
    }

    // Efecto viñeta y copos suaves en primer plano
    this.drawCinematicOverlay(ctx, w, h, t);

    ctx.restore();
  }

  // ==========================================================================
  // ESCENA 1: EL DESCENSO DE SANTA (Santa vuela, el saco se abre y se zambulle)
  // ==========================================================================
  private renderSantaHillsScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    // Fondo de montañas nevadas en movimiento
    const bg = this.getImage("./assets/images/fondo-villa-montanas.jpg");
    if (bg && bg.complete) {
      const offsetX = -(t * 45) % (w * 0.4);
      ctx.drawImage(bg, offsetX, 0, w * 1.3, h);
    } else {
      ctx.fillStyle = "#0d1b2a";
      ctx.fillRect(0, 0, w, h);
    }

    // Posición del Trineo de Santa
    let sleighX: number;
    let sleighY: number;
    let sleighRot = 0;
    const sleighImg = this.getImage("./assets/images/santa-trineo.png");
    const bagImg = this.getImage("./assets/images/bolsa de regalos.png");

    if (t < 1.3) {
      // Fase 1: Vuelo pacífico de izquierda al centro
      const ease = t / 1.3;
      sleighX = -100 + ease * (w * 0.48 + 100);
      sleighY = h * 0.36 + Math.sin(t * 5) * 14;
      sleighRot = Math.sin(t * 5) * 0.05;
    } else if (t < 2.3) {
      // Fase 2: ¡ZAS! El saco tiembla y se desata
      sleighX = w * 0.48 + Math.sin(t * 30) * 4;
      sleighY = h * 0.36 + Math.sin(t * 5) * 10;
      sleighRot = -0.06;

      if (!this.soundTriggers.has("pop")) {
        this.soundTriggers.add("pop");
        this.audio.playClawTear();
      }
    } else {
      // Fase 3: Santa se voltea y se zambulle en picada por las colinas nevadas
      const diveT = (t - 2.3) / 2.1;
      sleighX = w * 0.48 + diveT * (w * 0.35);
      sleighY = h * 0.36 + diveT * (h * 0.4);
      sleighRot = 0.28; // Inclinación en picada

      if (!this.soundTriggers.has("whoosh")) {
        this.soundTriggers.add("whoosh");
        this.audio.playWhoosh();
      }
    }

    // Dibujar Trineo
    if (sleighImg && sleighImg.complete) {
      const sW = Math.min(260, w * 0.28);
      const sH = sW * 0.65;
      ctx.save();
      ctx.translate(sleighX, sleighY);
      ctx.rotate(sleighRot);
      ctx.drawImage(sleighImg, -sW / 2, -sH / 2, sW, sH);

      // Si el saco se rompió en t >= 1.3, dibujar el saco abierto temblando
      if (t >= 1.3 && t < 2.5 && bagImg && bagImg.complete) {
        ctx.save();
        ctx.translate(-sW * 0.32, -sH * 0.2);
        ctx.rotate(Math.sin(t * 25) * 0.2);
        ctx.drawImage(bagImg, -30, -30, 60, 60);
        ctx.restore();
      }
      ctx.restore();
    }

    // Regalos saliendo disparados y cayendo
    if (t >= 1.3) {
      const dt = t - 1.3;
      this.fallingToys.forEach((toy, i) => {
        const originX = w * 0.42;
        const originY = h * 0.32;
        const x = originX + toy.vx * dt + Math.sin(dt * 3 + i) * 15;
        const y = originY + toy.vy * dt + 0.5 * 380 * dt * dt;
        const rot = toy.rot + toy.vRot * dt;

        if (toy.img && toy.img.complete && y < h + 50) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.drawImage(toy.img, -toy.size / 2, -toy.size / 2, toy.size, toy.size);
          ctx.restore();
        }
      });
    }

    // Textos de Acción Cinemática
    if (t >= 1.3 && t < 2.4) {
      this.drawActionBubble(ctx, w * 0.35, h * 0.22, "¡OH NO! ¡EL SACO SE ABRIÓ!", "#FF2A4D");
    } else if (t >= 2.4) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.22, "«¡TENGO QUE RECUPERARLOS EN MI TRINEO!»", "#FFD700");
    }
  }

  // ==========================================================================
  // ESCENA 2: ATRAPA-REGALOS MÁGICO (Chimenea dispara juguetes y saco se posiciona)
  // ==========================================================================
  private renderToyCatchScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-nieve.webp");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#102a43";
      ctx.fillRect(0, 0, w, h);
    }

    // Chimenea que vibra
    const chimney = this.getImage("./assets/images/chimenea-obstaculo.png");
    const bagImg = this.getImage("./assets/images/bolsa de regalos.png");

    const chimW = Math.min(180, w * 0.22);
    const chimH = chimW * 1.0;
    const chimX = w * 0.5;
    const chimY = h * 0.68;

    if (chimney && chimney.complete) {
      ctx.save();
      const shakeX = t < 1.2 ? Math.sin(t * 30) * 3 : 0;
      ctx.translate(chimX + shakeX, chimY);
      ctx.drawImage(chimney, -chimW / 2, -chimH / 2, chimW, chimH);
      ctx.restore();
    }

    // Explosión de juguetes en t >= 1.2
    if (t >= 1.2) {
      if (!this.soundTriggers.has("boom")) {
        this.soundTriggers.add("boom");
        this.audio.playCatchItem(1.5);
      }

      const dt = t - 1.2;
      this.fallingToys.forEach((toy, i) => {
        const originX = chimX;
        const originY = chimY - chimH * 0.45;
        const spreadVx = (i - 3) * 65;
        const x = originX + spreadVx * dt;
        const y = originY - 260 * dt + 0.5 * 320 * dt * dt;
        const rot = toy.rot + toy.vRot * dt;

        if (toy.img && toy.img.complete && y < h + 40) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.drawImage(toy.img, -toy.size / 2, -toy.size / 2, toy.size, toy.size);
          ctx.restore();
        }
      });
    }

    // Gran saco de Santa deslizándose a la acción
    if (t >= 2.0 && bagImg && bagImg.complete) {
      const sackEase = Math.min(1.0, (t - 2.0) / 0.8);
      const sackW = Math.min(190, w * 0.24);
      const sackH = sackW * 0.65;
      const sackX = -100 + sackEase * (w * 0.5 + 100);
      const sackY = h * 0.82;

      ctx.save();
      ctx.translate(sackX, sackY);
      ctx.drawImage(bagImg, -sackW / 2, -sackH / 2, sackW, sackH);
      ctx.restore();
    }

    if (t >= 1.2 && t < 2.5) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "¡BOOM! ¡LLUEVEN REGALOS!", "#FF9800");
    } else if (t >= 2.5) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "«¡MUEVE EL SACO Y ATRÁPALOS TODOS!»", "#00E676");
    }
  }

  // ==========================================================================
  // ESCENA 3: TORRE DE REGALOS MÁGICA (Pedestal, grúa y paquetes apilándose)
  // ==========================================================================
  private renderGiftTowerScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-villa-montanas.jpg");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#081026";
      ctx.fillRect(0, 0, w, h);
    }

    const pedestal = this.getImage("./assets/images/pedestal-torre-regalos.png");
    const giftRed = this.getImage("./assets/images/regalo-estilizado-rojo.png");
    const giftGold = this.getImage("./assets/images/regalo-estilizado-dorado.png");

    const pedW = Math.min(300, w * 0.42);
    const pedH = pedW * 0.35;
    const pedX = w * 0.5;
    const pedY = h * 0.82;

    if (pedestal && pedestal.complete) {
      ctx.drawImage(pedestal, pedX - pedW / 2, pedY, pedW, pedH);
    }

    // Regalo 1 cayendo en t = 1.0
    const boxSize = Math.min(120, w * 0.18);
    const boxH = boxSize * 0.72;

    if (t >= 1.0 && giftRed && giftRed.complete) {
      const dropT = Math.min(1.0, (t - 1.0) / 0.7);
      const startY = h * 0.15;
      const targetY = pedY - boxH + 12;
      const curY = startY + dropT * (targetY - startY);

      ctx.drawImage(giftRed, pedX - boxSize / 2, curY, boxSize, boxH);

      if (dropT >= 1.0 && !this.soundTriggers.has("box1")) {
        this.soundTriggers.add("box1");
        this.audio.playTap();
      }
    }

    // Regalo 2 cayendo en t = 2.2
    if (t >= 2.2 && giftGold && giftGold.complete) {
      const dropT2 = Math.min(1.0, (t - 2.2) / 0.7);
      const startY2 = h * 0.12;
      const targetY2 = pedY - boxH * 2 + 20;
      const curY2 = startY2 + dropT2 * (targetY2 - startY2);

      ctx.drawImage(giftGold, pedX - boxSize / 2, curY2, boxSize, boxH);

      if (dropT2 >= 1.0 && !this.soundTriggers.has("box2")) {
        this.soundTriggers.add("box2");
        this.audio.playCatchItem(1.4);
      }
    }

    // Gran Estrella arriba
    const star = this.getImage("./assets/images/estrella con logo.png");
    if (star && star.complete) {
      const starSize = 56 + Math.sin(t * 4) * 8;
      ctx.drawImage(star, pedX - starSize / 2, h * 0.08, starSize, starSize);
    }

    if (t < 2.2) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.32, "«¡LA GRAN ESTRELLA ESTÁ MUY ALTA!»", "#FFD700");
    } else {
      this.drawActionBubble(ctx, w * 0.5, h * 0.32, "«¡APILA LOS REGALOS HASTA TOCAR EL CIELO!»", "#00E5FF");
    }
  }

  // ==========================================================================
  // ESCENA 4: EL VUELO DEL ELFO (Elfo pierde la carta y vuela en parapente)
  // ==========================================================================
  private renderFlyingElfScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-villa-seamless.jpg");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0c1b33";
      ctx.fillRect(0, 0, w, h);
    }

    const elf = this.getImage("./assets/images/elfo-volador.png");
    const candy = this.getImage("./assets/images/baston-caramelo.png");

    let elfX = w * 0.3;
    let elfY = h * 0.5;

    if (t >= 1.5) {
      const flyT = (t - 1.5) / 2.9;
      elfX = w * 0.3 + flyT * (w * 0.5);
      elfY = h * 0.5 - flyT * (h * 0.28) + Math.sin(t * 6) * 16;
    }

    // Dibujar elfo
    if (elf && elf.complete) {
      const eW = Math.min(180, w * 0.25);
      const eH = eW;
      ctx.save();
      ctx.translate(elfX, elfY);
      ctx.rotate(t >= 1.5 ? -0.15 : 0);
      ctx.drawImage(elf, -eW / 2, -eH / 2, eW, eH);
      ctx.restore();
    }

    // Bastón / carta que vuela en espiral
    if (t >= 1.0 && candy && candy.complete) {
      const dt = t - 1.0;
      const cX = w * 0.45 + dt * 90;
      const cY = h * 0.45 - dt * 70 + Math.sin(dt * 8) * 20;

      ctx.save();
      ctx.translate(cX, cY);
      ctx.rotate(dt * 8);
      ctx.drawImage(candy, -20, -20, 40, 40);
      ctx.restore();
    }

    if (t < 1.8) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "¡UNA VENTISCA SE LLEVÓ LA CARTA!", "#00E5FF");
    } else {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "«¡VUELA POR LOS TECHOS A RESCATARLA!»", "#FF4081");
    }
  }

  // ==========================================================================
  // ESCENA 5: TIRO AL BLANCO (Muñeco invade y resortera dispara)
  // ==========================================================================
  private renderSnowballTargetScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-tiro-al-blanco.webp");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#1f1008";
      ctx.fillRect(0, 0, w, h);
    }

    const snowman = this.getImage("./assets/images/obstaculo-muneco.png");
    const gift = this.getImage("./assets/images/regalo-estilizado-dorado.png");

    if (snowman && snowman.complete) {
      const sW = Math.min(160, w * 0.22);
      const sH = sW * 1.1;
      const sX = w * 0.65;
      const sY = h * 0.58 + (t < 1.5 ? Math.sin(t * 6) * 8 : 0);

      ctx.save();
      ctx.translate(sX, sY);
      if (t >= 2.5) {
        ctx.rotate(0.4); // Derribado por la bola
      }
      ctx.drawImage(snowman, -sW / 2, -sH / 2, sW, sH);
      ctx.restore();
    }

    // Bola de nieve volando en t = 2.0
    if (t >= 1.8 && t < 2.5) {
      const ballT = (t - 1.8) / 0.6;
      const bx = w * 0.2 + ballT * (w * 0.45);
      const by = h * 0.7 - ballT * (h * 0.15);

      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(bx, by, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (t >= 2.4 && gift && gift.complete) {
      // Regalo liberado
      ctx.drawImage(gift, w * 0.65 - 35, h * 0.35, 70, 70);
    }

    if (t < 2.0) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "¡LOS PILLOS SE ADUEÑARON DE LA CASETA!", "#FF2A4D");
    } else {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "«¡APUNTA CON LA RESORTERA Y DESPÉJALA!»", "#00E676");
    }
  }

  // ==========================================================================
  // ESCENA 6: SINFONÍA DE CAMPANAS (Carillón despierta con notas de luz)
  // ==========================================================================
  private renderBellSymphonyScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-habitacion.webp");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#050e1a";
      ctx.fillRect(0, 0, w, h);
    }

    const bell = this.getImage("./assets/images/icon-campanas.png");
    const colors = ["#FF2A4D", "#00E676", "#00E5FF", "#FFD700"];

    for (let i = 0; i < 4; i++) {
      const cx = w * (0.24 + i * 0.17);
      const cy = h * 0.55;
      const bSize = Math.min(90, w * 0.13);

      ctx.save();
      if (t >= 1.2) {
        ctx.shadowColor = colors[i];
        ctx.shadowBlur = 20;
      }
      if (bell && bell.complete) {
        ctx.drawImage(bell, cx - bSize / 2, cy - bSize / 2, bSize, bSize);
      }
      ctx.restore();

      // Rayo de luz cayendo
      if (t >= 1.2) {
        ctx.save();
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (t < 1.8) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "¡EL GRAN CARILLÓN PERDIÓ SU MÚSICA!", "#00E5FF");
    } else {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "«¡TOCA LAS CAMPANAS Y DESPIERTA LA CIUDAD!»", "#FFD700");
    }
  }

  // ==========================================================================
  // ESCENA 7: TAMBORES DEL CASCANUECES (Elfo baterista redobla con honor)
  // ==========================================================================
  private renderNutcrackerScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-habitacion.webp");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#1f1008";
      ctx.fillRect(0, 0, w, h);
    }

    const drummer = this.getImage("./assets/images/elfo-baterista.png");
    const drums = this.getImage("./assets/images/icon-tambores.png");

    if (drummer && drummer.complete) {
      const dW = Math.min(220, w * 0.32);
      const dH = dW;
      const dX = w * 0.5;
      const dY = h * 0.52 + Math.sin(t * 20) * 3;

      ctx.save();
      ctx.translate(dX, dY);
      ctx.drawImage(drummer, -dW / 2, -dH / 2, dW, dH);
      ctx.restore();
    }

    if (t < 2.0) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "¡EL DESFILE MILITAR DE MEDIANOCHE!", "#FFB300");
    } else {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "«¡SIGUE EL COMPÁS Y GUÍA AL BATALLÓN!»", "#00E676");
    }
  }

  // ==========================================================================
  // ESCENA 8: PAREJAS DE JUGUETES (Tarjetas que se mezclan y ordenan)
  // ==========================================================================
  private renderMagicPairsScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const bg = this.getImage("./assets/images/fondo-habitacion.webp");
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#140b24";
      ctx.fillRect(0, 0, w, h);
    }

    const card = this.getImage("./assets/images/icon-cartas.png");

    for (let i = 0; i < 4; i++) {
      const cX = w * (0.25 + i * 0.17);
      const cY = h * 0.55 + (t >= 1.2 ? Math.sin(t * 8 + i) * 16 : 0);
      const cSize = Math.min(100, w * 0.14);

      if (card && card.complete) {
        ctx.save();
        ctx.translate(cX, cY);
        if (t >= 1.2) ctx.rotate(Math.sin(t * 6 + i) * 0.3);
        ctx.drawImage(card, -cSize / 2, -cSize / 2, cSize, cSize);
        ctx.restore();
      }
    }

    if (t < 1.8) {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "¡LOS DUENDES REVOLVIERON LAS TARJETAS!", "#D500F9");
    } else {
      this.drawActionBubble(ctx, w * 0.5, h * 0.2, "«¡ENCUENTRA LAS PAREJAS GEMELAS!»", "#FFD700");
    }
  }

  private renderGenericScene(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number): void {
    ctx.fillStyle = "#0c1b33";
    ctx.fillRect(0, 0, w, h);
    this.drawActionBubble(ctx, w * 0.5, h * 0.5, "¡PREPARANDO MISIÓN NAVIDEÑA!", "#FFD700");
  }

  // ==========================================================================
  // HELPERS VISUALES: Globo de Acción y Capa Cinemática
  // ==========================================================================
  private drawActionBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, color: string): void {
    ctx.save();
    ctx.font = `900 clamp(16px, 2.5vw, 24px) 'Fredoka', 'Montserrat', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(text);
    const padX = 22;
    const padY = 12;
    const boxW = metrics.width + padX * 2;
    const boxH = 46;

    // Sombra del cartel
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.beginPath();
    this.roundRect(ctx, cx - boxW / 2 + 3, cy - boxH / 2 + 4, boxW, boxH, 12);
    ctx.fill();

    // Fondo del cartel
    ctx.fillStyle = "rgba(10, 22, 45, 0.95)";
    ctx.beginPath();
    this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 12);
    ctx.fill();

    // Borde brillante
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Texto
    ctx.fillStyle = color;
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  private drawCinematicOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    // Copos suaves flotantes en primer plano
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (let i = 0; i < 18; i++) {
      const flakeX = (Math.sin(i * 99 + t * 0.4) * 0.5 + 0.5) * w;
      const flakeY = ((i * 35 + t * 45) % h);
      const r = (i % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(flakeX, flakeY, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

  private finishAndExit(byUserSkip: boolean): void {
    this.hide();

    if (byUserSkip) {
      if (this.onSkipToPlay) {
        this.onSkipToPlay();
      } else if (this.onComplete) {
        this.onComplete();
      }
    } else {
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }
}
