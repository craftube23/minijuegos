/**
 * ==============================================================================
 * JUEGO 4: PAREJAS MÁGICAS DE JUGUETES (Memory Toy Match - Edición Pulida)
 * ==============================================================================
 * 
 * ARQUITECTURA VISUAL Y JUGABILIDAD:
 * - Sistema de cartas táctiles con rotación 3D realista (Flip Animation).
 * - Dificultad progresiva por niveles: 4 cartas -> 6 cartas -> 8 cartas -> 12 cartas.
 * - Sprites HD oficiales con efectos de halo dinámicos (Oro para Feria, Cian para Campuslands, Verde/Rojo para aciertos/fallos).
 * - Efectos de sonido dedicados (volteo de carta, acierto de pareja y fallo).
 * - Bonificaciones por racha y multiplicadores temáticos.
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
  flipProgress: number; // 0.0 (dorso) a 1.0 (frente revelado)
}

interface PairDefinition {
  key: string;
  name: string;
  isSpecial: boolean;
}

export class MagicPairsGame extends BaseGame {
  // Estado del Tablero y Selección
  private cards: MemoryCard[] = [];
  private firstSelectedCard: MemoryCard | null = null;
  private secondSelectedCard: MemoryCard | null = null;
  private isCheckingMatch: boolean = false;
  private checkTimer: number = 0;
  private pairsFound: number = 0;
  private level: number = 1;
  private totalPairs: number = 2; // Nivel 1: 2 pares (4 cartas)

  // Catálogo de Sprites HD Pre-cargados
  private spriteTeddy: HTMLImageElement;
  private spriteRobot: HTMLImageElement;
  private spriteGiftRed: HTMLImageElement;
  private spriteGiftGreen: HTMLImageElement;
  private spriteCandyCane: HTMLImageElement;
  private spriteFlyingElf: HTMLImageElement;
  private spriteDrums: HTMLImageElement;
  private spriteBells: HTMLImageElement;
  private spriteTree: HTMLImageElement;
  private spriteHouse: HTMLImageElement;
  private spriteStarLogo: HTMLImageElement;
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

    // Cargar todos los sprites temáticos
    this.spriteTeddy = this.createImage("./assets/images/osito.png");
    this.spriteRobot = this.createImage("./assets/images/robot.png");
    this.spriteGiftRed = this.createImage("./assets/images/regalo-rojo2.png");
    this.spriteGiftGreen = this.createImage("./assets/images/regalo-verde.png");
    this.spriteCandyCane = this.createImage("./assets/images/baston-caramelo.png");
    this.spriteFlyingElf = this.createImage("./assets/images/elfo-volador.png");
    this.spriteDrums = this.createImage("./assets/images/icon-tambores.png");
    this.spriteBells = this.createImage("./assets/images/icon-campanas.png");
    this.spriteTree = this.createImage("./assets/images/arbol.png");
    this.spriteHouse = this.createImage("./assets/images/casa-obstaculo.png");
    this.spriteStarLogo = this.createImage("./assets/images/estrella con logo.png");
    this.spriteLogo1 = this.createImage(BRANDING.getLogoPath(1));
    this.spriteLogo2 = this.createImage(BRANDING.getLogoPath(2));

    // Música temática para el juego de memoria
    this.inGameMusicPath = "./assets/audio/We Wish You a Merry Christmas.mp3";
    this.inGameMusicVolume = 0.45;
  }

  private createImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  // ============================================================================
  // CICLO DE VIDA (LIFECYCLE)
  // ============================================================================

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

    // Asignar manejador de interacción táctil / ratón
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

  protected onUpdate(dt: number): void {
    // 1. Animación fluida de giro 3D en las cartas
    for (const card of this.cards) {
      const target = card.isFlipped || card.isMatched ? 1 : 0;
      card.flipProgress += (target - card.flipProgress) * 16 * dt;
    }

    // 2. Temporizador de verificación de fallo (desacierto)
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

  // ============================================================================
  // GESTIÓN DEL MAZO Y TABLERO (DECK & GRID LAYOUT)
  // ============================================================================

  private setupDeck(): void {
    this.cards = [];
    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;

    const fullPool: PairDefinition[] = [
      { key: "elf_flyer", name: "Elfo Volador", isSpecial: false },
      { key: "candy_cane", name: "Bastón Dulce", isSpecial: false },
      { key: "drums", name: "Tambores Mágicos", isSpecial: false },
      { key: "bells", name: "Campanas", isSpecial: false },
      { key: "tree", name: "Pino Navideño", isSpecial: false },
      { key: "house", name: "Villa Navideña", isSpecial: false },
      { key: "star_logo", name: "Estrella Mágica", isSpecial: true },
      { key: "gift_green", name: "Regalo Verde", isSpecial: false },
      { key: "gift_red", name: "Regalo Rojo", isSpecial: false },
      { key: "teddy", name: "Osito", isSpecial: false },
      { key: "robot", name: "Robot", isSpecial: false },
      { key: "fair_logo", name: "Feria Mágica", isSpecial: true },
      { key: "campus_logo", name: "Campuslands", isSpecial: true }
    ];

    // Número de parejas según el nivel
    if (this.level === 1) {
      this.totalPairs = 2; // 4 cartas (2x2)
    } else if (this.level === 2) {
      this.totalPairs = 3; // 6 cartas (2x3)
    } else if (this.level === 3) {
      this.totalPairs = 4; // 8 cartas (2x4)
    } else {
      this.totalPairs = 6; // 12 cartas (3x4)
    }

    // Barajar el catálogo completo (Fisher-Yates)
    const shuffledPool = [...fullPool];
    for (let i = shuffledPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }

    const selectedPairs = shuffledPool.slice(0, this.totalPairs);
    const rawDeck: Array<{ pairKey: string; isSpecial: boolean }> = [];
    for (const p of selectedPairs) {
      rawDeck.push({ pairKey: p.key, isSpecial: p.isSpecial });
      rawDeck.push({ pairKey: p.key, isSpecial: p.isSpecial });
    }

    // Barajar las cartas generadas en el tablero
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
      cols = isPortrait ? 3 : 4;
      rows = isPortrait ? 4 : 3;
    }

    const startY = this.height * 0.18;
    const gridH = this.height * 0.74;
    const gridW = Math.min(this.width * 0.92, cols * 200);
    const startX = (this.width - gridW) / 2;

    const gapX = Math.max(8, this.width * 0.024);
    const gapY = Math.max(8, this.height * 0.018);

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

  // ============================================================================
  // LÓGICA DE JUEGO (GAMEPLAY & AUDIO FEEDBACK)
  // ============================================================================

  private handleCardClick(card: MemoryCard): void {
    if (this.isCheckingMatch || card.isFlipped || card.isMatched) return;

    card.isFlipped = true;
    this.audio.playCardFlip(); // Sonido exclusivo de voltear carta

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
      this.handleMatchSuccess();
    } else {
      this.handleMatchFailure();
    }
  }

  private handleMatchSuccess(): void {
    if (!this.firstSelectedCard || !this.secondSelectedCard) return;

    this.firstSelectedCard.isMatched = true;
    this.secondSelectedCard.isMatched = true;
    this.pairsFound++;

    this.audio.playCardMatch(); // Sonido exclusivo de pareja acertada

    const isLogo = this.firstSelectedCard.isSpecialLogo;
    const isCampus = this.firstSelectedCard.pairKey === "campus_logo";
    const isFair = this.firstSelectedCard.pairKey === "fair_logo";
    const isStar = this.firstSelectedCard.pairKey === "star_logo";
    const isElf = this.firstSelectedCard.pairKey === "elf_flyer";
    const points = isLogo ? 500 : (isElf ? 300 : 200);

    this.addScore(points);

    const centerX = (this.firstSelectedCard.x + this.secondSelectedCard.x) / 2 + this.firstSelectedCard.w / 2;
    const centerY = (this.firstSelectedCard.y + this.secondSelectedCard.y) / 2 + this.firstSelectedCard.h / 2;

    if (isFair) {
      this.triggerLogoPowerUp(1, 6);
      this.addFloatingText("¡PAREJA FERIA MÁGICA! +500", centerX, centerY, "#FFD700", 1.35);
      this.particles.emitConfetti(this.width, 35);
    } else if (isCampus) {
      this.triggerLogoPowerUp(2, 6);
      this.addFloatingText("¡PAREJA CAMPUSLANDS! +500", centerX, centerY, "#00E5FF", 1.35);
      this.particles.emitConfetti(this.width, 35);
    } else if (isStar) {
      this.addFloatingText("¡ESTRELLA MÁGICA! +500", centerX, centerY, "#FFE082", 1.35);
      this.particles.emitBurst(centerX, centerY, "#FFD700", 25);
    } else if (isElf) {
      this.addFloatingText("¡ELFO VOLADOR! +300", centerX, centerY, "#76FF03", 1.3);
      this.particles.emitBurst(centerX, centerY, "#00E676", 20);
    } else if (this.firstSelectedCard.pairKey === "candy_cane") {
      this.addFloatingText("¡BASTÓN DULCE! +200", centerX, centerY, "#FF1744", 1.25);
      this.particles.emitBurst(centerX, centerY, "#FF5252", 18);
    } else if (this.firstSelectedCard.pairKey === "drums") {
      this.addFloatingText("¡TAMBORES! +200", centerX, centerY, "#FF9100", 1.25);
      this.particles.emitBurst(centerX, centerY, "#FFAB40", 18);
    } else if (this.firstSelectedCard.pairKey === "bells") {
      this.addFloatingText("¡CAMPANAS! +200", centerX, centerY, "#FFD700", 1.25);
      this.particles.emitBurst(centerX, centerY, "#FFE57F", 18);
    } else {
      this.addFloatingText(`+${points} ¡PAREJA!`, centerX, centerY, "#00E676", 1.2);
      this.particles.emitBurst(centerX, centerY, "#00E676", 18);
    }

    this.firstSelectedCard = null;
    this.secondSelectedCard = null;

    // Verificar si se completó el tablero del nivel actual
    if (this.pairsFound >= this.totalPairs) {
      this.handleLevelComplete();
    }
  }

  private handleMatchFailure(): void {
    if (!this.firstSelectedCard || !this.secondSelectedCard) return;

    this.isCheckingMatch = true;
    this.checkTimer = 0.65;
    this.audio.playCardMismatch(); // Sonido exclusivo de fallo de pareja
    this.triggerShake(0.12, 4);

    const errX = (this.firstSelectedCard.x + this.secondSelectedCard.x) / 2 + this.firstSelectedCard.w / 2;
    const errY = (this.firstSelectedCard.y + this.secondSelectedCard.y) / 2 + this.firstSelectedCard.h / 2;
    this.particles.emitBurst(errX, errY, "#FF1744", 8);
  }

  private handleLevelComplete(): void {
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

  // ============================================================================
  // RENDERIZADO VISUAL (CANVAS DRAWING PIPELINE)
  // ============================================================================

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo nocturno mágico festivo
    this.renderBackground(ctx);

    // 2. Banner de progreso superior
    this.renderHeader(ctx);

    // 3. Renderizar cada carta con su rotación 3D
    for (const card of this.cards) {
      this.renderCard(ctx, card);
    }
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, "#120826");
    bgGrad.addColorStop(0.5, "#200E3B");
    bgGrad.addColorStop(1, "#0A0414");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private renderHeader(ctx: CanvasRenderingContext2D): void {
    const headerH = 44;
    const headerY = this.height * 0.095;
    const headerW = this.width * 0.86;
    const headerX = (this.width - headerW) / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.roundRect(headerX, headerY, headerW, headerH, [14]);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "900 18px 'Outfit', sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `⭐ NIVEL ${this.level}  •  PAREJAS: ${this.pairsFound}/${this.totalPairs}`,
      this.width / 2,
      headerY + headerH / 2
    );
  }

  private renderCard(ctx: CanvasRenderingContext2D, card: MemoryCard): void {
    ctx.save();

    const cx = card.x + card.w / 2;
    const cy = card.y + card.h / 2;
    ctx.translate(cx, cy);

    // Efecto de escala horizontal simulando giro 3D (Coseno del progreso)
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
      this.renderCardBack(ctx, halfW, halfH, card.w, card.h);
    } else {
      this.renderCardFront(ctx, card, halfW, halfH, isMismatch);
    }

    ctx.restore();
  }

  private renderCardBack(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    w: number,
    h: number
  ): void {
    const backGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    backGrad.addColorStop(0, "#7B1FA2");
    backGrad.addColorStop(1, "#4A148C");
    ctx.fillStyle = backGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, w, h, [16]);
    ctx.fill();

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Patrón ornamental en el dorso
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(halfW, halfH) * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    // Estrella de la feria en el dorso
    const starR = Math.min(halfW, halfH) * 0.25;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * starR;
      const py = Math.sin(angle) * starR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderCardFront(
    ctx: CanvasRenderingContext2D,
    card: MemoryCard,
    halfW: number,
    halfH: number,
    isMismatch: boolean
  ): void {
    const isFair = card.pairKey === "fair_logo";
    const isCampus = card.pairKey === "campus_logo";
    const isStar = card.pairKey === "star_logo";

    if (card.isMatched) {
      ctx.fillStyle = "#E8F5E9"; // Fondo suave verde al acertar
    } else if (isMismatch) {
      ctx.fillStyle = "#FFEBEE"; // Fondo suave rojo al fallar
    } else if (isFair || isStar) {
      ctx.fillStyle = "#FFF9C4";
    } else if (isCampus) {
      ctx.fillStyle = "#E0F7FA";
    } else {
      ctx.fillStyle = "#FFFFFF";
    }

    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, card.w, card.h, [16]);
    ctx.fill();

    let strokeColor = isFair || isStar ? "#FFD700" : (isCampus ? "#00E5FF" : "#E0E0E0");
    if (card.isMatched) strokeColor = "#00E676";
    if (isMismatch) strokeColor = "#FF1744";

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = card.isMatched || isMismatch ? 5 : (card.isSpecialLogo ? 4.5 : 3);
    ctx.stroke();

    // Obtener sprite correspondiente
    const imgToDraw = this.getSpriteForCard(card.pairKey);
    const iconSize = Math.min(card.w, card.h) * 0.68;

    if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
      ctx.drawImage(imgToDraw, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
    } else {
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(0, 0, iconSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Etiquetas especiales
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
    } else if (isStar) {
      ctx.fillStyle = "#B78103";
      ctx.font = "800 12px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ESTRELLA", 0, halfH - 14);
    }
  }

  private getSpriteForCard(pairKey: string): HTMLImageElement | null {
    switch (pairKey) {
      case "elf_flyer": return this.spriteFlyingElf;
      case "candy_cane": return this.spriteCandyCane;
      case "drums": return this.spriteDrums;
      case "bells": return this.spriteBells;
      case "tree": return this.spriteTree;
      case "house": return this.spriteHouse;
      case "star_logo": return this.spriteStarLogo;
      case "gift_red": return this.spriteGiftRed;
      case "gift_green": return this.spriteGiftGreen;
      case "teddy": return this.spriteTeddy;
      case "robot": return this.spriteRobot;
      case "fair_logo": return this.spriteLogo1;
      case "campus_logo": return this.spriteLogo2;
      default: return null;
    }
  }
}
