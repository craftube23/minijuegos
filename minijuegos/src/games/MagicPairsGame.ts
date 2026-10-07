/**
 * ==============================================================================
 * JUEGO 4: PAREJAS MÁGICAS DE JUGUETES (Memory Toy Match - Edición Pulida)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - Tablero de 8 cartas táctiles (4 parejas de juguetes de la Feria).
 * - Sprites oficiales HD: Osito de peluche, Robot interactivo, Regalo de Santa y Logo de la Feria.
 * - Animación fluida de giro de cartas (Flip Animation) y efectos de partículas al acertar.
 * - Al emparejar el Logo de la Feria se activa el Bonus x2 temporal.
 * - Al despejar el tablero completo se reparten cartas nuevas con bonificación rápida.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";
import { BRANDING } from "../config/branding";

interface MemoryCard {
  id: number;
  pairKey: string;
  isSpecialLogo: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  isFlipped: boolean;
  isMatched: boolean;
  flipProgress: number; // 0 (oculta) a 1 (revelada)
}

export class MagicPairsGame extends BaseGame {
  private cards: MemoryCard[] = [];
  private firstSelectedCard: MemoryCard | null = null;
  private secondSelectedCard: MemoryCard | null = null;
  private isCheckingMatch: boolean = false;
  private checkTimer: number = 0;
  private pairsFound: number = 0;
  private level: number = 1;
  private totalPairs: number = 2; // Nivel 1: 2 pares (4 cartas)

  // Sprites Oficiales HD
  private spriteTeddy: HTMLImageElement;
  private spriteRobot: HTMLImageElement;
  private spriteGift: HTMLImageElement;
  private spriteLogo1: HTMLImageElement;
  private spriteLogo2: HTMLImageElement;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "magic-pairs",
      "Parejas Mágicas de Juguetes",
      "¡Encuentra todas las parejas de juguetes mágicos tocando las cartas!",
      canvas,
      input,
      audio,
      particles
    );

    this.spriteTeddy = new Image();
    this.spriteTeddy.src = "./assets/images/osito.png";

    this.spriteRobot = new Image();
    this.spriteRobot.src = "./assets/images/robot.png";

    this.spriteGift = new Image();
    this.spriteGift.src = "./assets/images/regalo-rojo.png";

    this.spriteLogo1 = new Image();
    this.spriteLogo1.src = BRANDING.getLogoPath(1);

    this.spriteLogo2 = new Image();
    this.spriteLogo2.src = BRANDING.getLogoPath(2);
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);
    this.layoutCards();
  }

  protected onStart(): void {
    this.level = 1;
    this.pairsFound = 0;
    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;

    // Asignar manejador de toques exclusivo
    this.input.onTap = (x: number, y: number) => {
      if (this.isCheckingMatch || this.timeRemaining <= 0 || !this.isRunning) return;
      for (const card of this.cards) {
        if (
          !card.isMatched &&
          !card.isFlipped &&
          x >= card.x &&
          x <= card.x + card.w &&
          y >= card.y &&
          y <= card.y + card.h
        ) {
          this.handleCardClick(card);
          break;
        }
      }
    };

    this.setupDeck();
  }

  private setupDeck(): void {
    this.cards = [];
    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;

    // Determinar cantidad de parejas según nivel (4 → 6 → 8 → 12)
    // Nivel 1: 2 pares (4 cartas)
    // Nivel 2: 3 pares (6 cartas)
    // Nivel 3: 4 pares (8 cartas)
    // Nivel 4+: 6 pares (12 cartas)
    const allAvailablePairs = [
      { key: "teddy", isSpecial: false },
      { key: "fair_logo", isSpecial: true },   // Feria Mágica (Dorado x2)
      { key: "robot", isSpecial: false },
      { key: "campus_logo", isSpecial: true }, // Campuslands (Cian x2)
      { key: "gift", isSpecial: false },
      { key: "teddy_blue", isSpecial: false }
    ];

    if (this.level === 1) {
      this.totalPairs = 2;
    } else if (this.level === 2) {
      this.totalPairs = 3;
    } else if (this.level === 3) {
      this.totalPairs = 4;
    } else {
      this.totalPairs = 6;
    }

    const selectedPairs = allAvailablePairs.slice(0, this.totalPairs);
    const rawDeck: Array<{ pairKey: string; isSpecial: boolean }> = [];
    for (const p of selectedPairs) {
      rawDeck.push({ pairKey: p.key, isSpecial: p.isSpecial });
      rawDeck.push({ pairKey: p.key, isSpecial: p.isSpecial });
    }

    // Barajar cartas (Fisher-Yates)
    for (let i = rawDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawDeck[i], rawDeck[j]] = [rawDeck[j], rawDeck[i]];
    }

    // Inicializar cartas
    this.cards = rawDeck.map((item, index) => ({
      id: index,
      pairKey: item.pairKey,
      isSpecialLogo: item.isSpecial,
      x: 0,
      y: 0,
      w: 180,
      h: 140,
      isFlipped: false,
      isMatched: false,
      flipProgress: 0
    }));

    this.layoutCards();
  }

  private layoutCards(): void {
    if (this.cards.length === 0) return;

    const isPortrait = this.height > this.width;
    let cols = 2;
    let rows = 2;

    if (this.cards.length === 4) {
      cols = 2;
      rows = 2;
    } else if (this.cards.length === 6) {
      cols = isPortrait ? 2 : 3;
      rows = isPortrait ? 3 : 2;
    } else if (this.cards.length === 8) {
      cols = isPortrait ? 2 : 4;
      rows = isPortrait ? 4 : 2;
    } else {
      // 12 cartas
      cols = isPortrait ? 3 : 4;
      rows = isPortrait ? 4 : 3;
    }

    const startY = this.height * 0.20;
    const gridH = this.height * 0.72;
    const gridW = Math.min(this.width * 0.90, cols * 180);
    const startX = (this.width - gridW) / 2;

    const gapX = Math.max(10, this.width * 0.025);
    const gapY = Math.max(10, this.height * 0.02);

    const cardW = (gridW - gapX * (cols - 1)) / cols;
    const cardH = (gridH - gapY * (rows - 1)) / rows;

    for (let i = 0; i < this.cards.length; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      this.cards[i].x = startX + c * (cardW + gapX);
      this.cards[i].y = startY + r * (cardH + gapY);
      this.cards[i].w = cardW;
      this.cards[i].h = cardH;
    }
  }

  protected onUpdate(dt: number): void {
    // 1. Animación fluida de giro de cartas
    for (const card of this.cards) {
      const target = card.isFlipped || card.isMatched ? 1 : 0;
      card.flipProgress += (target - card.flipProgress) * 16 * dt;
    }

    // 2. Temporizador de verificación de pareja incorrecta
    if (this.isCheckingMatch) {
      this.checkTimer -= dt;
      if (this.checkTimer <= 0) {
        if (this.firstSelectedCard && this.secondSelectedCard) {
          this.firstSelectedCard.isFlipped = false;
          this.secondSelectedCard.isFlipped = false;
          this.firstSelectedCard = null;
          this.secondSelectedCard = null;
        }
        this.isCheckingMatch = false;
      }
    }
  }

  private handleCardClick(card: MemoryCard): void {
    if (this.isCheckingMatch || card.isFlipped || card.isMatched) return;

    card.isFlipped = true;
    this.audio.playTap();

    if (!this.firstSelectedCard) {
      this.firstSelectedCard = card;
    } else if (!this.secondSelectedCard) {
      this.secondSelectedCard = card;
      this.evaluatePair();
    }
  }

  private evaluatePair(): void {
    if (!this.firstSelectedCard || !this.secondSelectedCard) return;

    if (this.firstSelectedCard.pairKey === this.secondSelectedCard.pairKey) {
      // ¡Pareja Correcta!
      this.firstSelectedCard.isMatched = true;
      this.secondSelectedCard.isMatched = true;
      this.pairsFound++;

      this.audio.playCatchItem();

      // Partículas y puntos
      const isLogo = this.firstSelectedCard.isSpecialLogo;
      const isCampus = this.firstSelectedCard.pairKey === "campus_logo";
      const isFair = this.firstSelectedCard.pairKey === "fair_logo";
      const points = isLogo ? 500 : 200;
      this.addScore(points);

      const centerX = (this.firstSelectedCard.x + this.secondSelectedCard.x) / 2 + this.firstSelectedCard.w / 2;
      const centerY = (this.firstSelectedCard.y + this.secondSelectedCard.y) / 2 + this.firstSelectedCard.h / 2;

      if (isFair) {
        this.triggerLogoPowerUp(1, 6);
        this.addFloatingText("¡PAREJA DE LA FERIA! +500", centerX, centerY, "#FFD700", 1.35);
        this.particles.emitConfetti(this.width, 35);
      } else if (isCampus) {
        this.triggerLogoPowerUp(2, 6);
        this.addFloatingText("¡PAREJA CAMPUSLANDS! +500", centerX, centerY, "#00E5FF", 1.35);
        this.particles.emitConfetti(this.width, 35);
      } else {
        this.addFloatingText(`+${points} ¡PAREJA!`, centerX, centerY, "#00E676", 1.2);
        this.particles.emitBurst(centerX, centerY, "#00E676", 20);
      }

      this.firstSelectedCard = null;
      this.secondSelectedCard = null;

      // Comprobar si completó el nivel
      if (this.pairsFound >= this.totalPairs) {
        const levelBonus = 300 * this.level;
        this.addScore(levelBonus);
        this.timeRemaining = Math.min(60, this.timeRemaining + 6); // +6s bonus de tiempo por nivel superado
        this.audio.playPowerUp();
        this.addFloatingText(`¡NIVEL ${this.level} SUPERADO! +${levelBonus}`, this.width / 2, this.height * 0.35, "#FFD700", 1.5);
        this.particles.emitConfetti(this.width, 45);

        this.level++;
        setTimeout(() => {
          if (this.timeRemaining > 0 && this.isRunning) {
            this.pairsFound = 0;
            this.setupDeck();
          }
        }, 900);
      }
    } else {
      // Pareja Incorrecta (🔴 Glow rojo y feedback)
      this.isCheckingMatch = true;
      this.checkTimer = 0.65;
      this.audio.playError();
      this.triggerShake(0.12, 4);

      const errX = (this.firstSelectedCard.x + this.secondSelectedCard.x) / 2 + this.firstSelectedCard.w / 2;
      const errY = (this.firstSelectedCard.y + this.secondSelectedCard.y) / 2 + this.firstSelectedCard.h / 2;
      this.particles.emitBurst(errX, errY, "#FF1744", 8);
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo elegante navideño
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, "#120826");
    bgGrad.addColorStop(0.5, "#200E3B");
    bgGrad.addColorStop(1, "#0A0414");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Banner de progreso superior
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.roundRect(this.width * 0.08, this.height * 0.10, this.width * 0.84, 44, [14]);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "900 18px 'Outfit', sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `⭐ NIVEL ${this.level}  •  PAREJAS: ${this.pairsFound}/${this.totalPairs}`,
      this.width / 2,
      this.height * 0.10 + 22
    );

    // 3. Dibujar las Cartas con animación de rotación 3D y Halo 🟢/🔴
    for (const card of this.cards) {
      ctx.save();

      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2;
      ctx.translate(cx, cy);

      // Efecto escala horizontal simulando giro 3D (Coseno del progreso)
      const flipScale = Math.abs(Math.cos(card.flipProgress * Math.PI));
      ctx.scale(flipScale, 1.0);

      const isShowingFront = card.flipProgress >= 0.5;
      const isCardSelected = card === this.firstSelectedCard || card === this.secondSelectedCard;
      const isMismatch = this.isCheckingMatch && isCardSelected;

      if (card.isMatched) {
        ctx.globalAlpha = 0.65;
      }

      const halfW = card.w / 2;
      const halfH = card.h / 2;

      if (!isShowingFront) {
        // --- DORSO DE LA CARTA (Cresta Navideña con copo de nieve) ---
        const backGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
        backGrad.addColorStop(0, "#7B1FA2");
        backGrad.addColorStop(1, "#4A148C");
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, card.w, card.h, [16]);
        ctx.fill();

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Patrón vectorial en el dorso
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(halfW, halfH) * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        // Estrella de la feria en el dorso
        const dorStarR = Math.min(halfW, halfH) * 0.25;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(angle) * dorStarR;
          const py = Math.sin(angle) * dorStarR;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // --- FRENTE DE LA CARTA (Juguete / Logo Revelado) ---
        const isFair = card.pairKey === "fair_logo";
        const isCampus = card.pairKey === "campus_logo";

        if (card.isMatched) {
          ctx.fillStyle = "#E8F5E9"; // Fondo suave verde al acertar
        } else if (isMismatch) {
          ctx.fillStyle = "#FFEBEE"; // Fondo suave rojo al fallar
        } else if (isFair) {
          ctx.fillStyle = "#FFF9C4";
        } else if (isCampus) {
          ctx.fillStyle = "#E0F7FA";
        } else {
          ctx.fillStyle = "#FFFFFF";
        }
        ctx.beginPath();
        ctx.roundRect(-halfW, -halfH, card.w, card.h, [16]);
        ctx.fill();

        let strokeColor = isFair ? "#FFD700" : (isCampus ? "#00E5FF" : "#E0E0E0");
        if (card.isMatched) strokeColor = "#00E676";
        if (isMismatch) strokeColor = "#FF1744";

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = card.isMatched || isMismatch ? 5 : (card.isSpecialLogo ? 4.5 : 3);
        ctx.stroke();

        // Renderizar Sprite Oficial del Juguete / Logo
        let imgToDraw: HTMLImageElement | null = null;
        if (card.pairKey === "teddy") imgToDraw = this.spriteTeddy;
        else if (card.pairKey === "robot") imgToDraw = this.spriteRobot;
        else if (card.pairKey === "gift") imgToDraw = this.spriteGift;
        else if (card.pairKey === "teddy_blue") imgToDraw = this.spriteTeddy;
        else if (card.pairKey === "fair_logo") imgToDraw = this.spriteLogo1;
        else if (card.pairKey === "campus_logo") imgToDraw = this.spriteLogo2;

        const iconSize = Math.min(card.w, card.h) * 0.65;

        if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
          ctx.drawImage(imgToDraw, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
        } else {
          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(0, 0, iconSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Etiqueta para la carta especial
        if (isFair) {
          ctx.fillStyle = "#E65100";
          ctx.font = "800 12px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("FERIA x2", 0, halfH - 14);
        } else if (isCampus) {
          ctx.fillStyle = "#006064";
          ctx.font = "800 12px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("CAMPUS x2", 0, halfH - 14);
        }
      }

      ctx.restore();
    }
  }
}
