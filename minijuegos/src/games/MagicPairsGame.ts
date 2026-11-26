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
  private spriteMedallion: HTMLImageElement;
  private bgImage: HTMLImageElement;
  private sponsorCardSprites: Map<string, HTMLImageElement> = new Map();

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
    this.spriteTeddy = this.createImage("./assets/images/osito.webp");
    this.spriteRobot = this.createImage("./assets/images/robot.webp");
    this.spriteGiftRed = this.createImage("./assets/images/regalo-rojo2.webp");
    this.spriteGiftGreen = this.createImage("./assets/images/regalo-verde.webp");
    this.spriteCandyCane = this.createImage("./assets/images/baston-caramelo.webp");
    this.spriteFlyingElf = this.createImage("./assets/images/elfo-volador.webp");
    this.spriteDrums = this.createImage("./assets/images/icon-tambores.webp");
    this.spriteBells = this.createImage("./assets/images/icon-campanas.webp");
    this.spriteTree = this.createImage("./assets/images/arbol.webp");
    this.spriteHouse = this.createImage("./assets/images/casa-obstaculo.webp");
    this.spriteStarLogo = this.createImage("./assets/images/estrella con logo.webp");
    this.spriteLogo1 = this.createImage(BRANDING.getLogoPath(1));
    this.spriteMedallion = this.createImage("./assets/images/medallon-feria.webp");
    this.bgImage = this.createImage("./assets/images/fondo-habitacion.webp");

    // Precargar sprites de todos los patrocinadores oficiales
    for (const sponsor of BRANDING.getAllSponsors()) {
      const img = this.createImage(sponsor.path);
      this.sponsorCardSprites.set(sponsor.id, img);
      this.sponsorCardSprites.set(sponsor.shortName.toLowerCase(), img);
    }

    // Música temática para el juego de memoria
    this.inGameMusicPath = "./assets/audio/We Wish You a Merry Christmas.mp3";
    this.inGameMusicVolume = 0.45;

    // Precargar efectos de sonido de cartas para respuesta inmediata (0ms latencia)
    this.audio.preloadMagicPairsAudio();
  }

  private createImage(src: string): HTMLImageElement {
    return this.getImage(src);
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

    // Asegurar precarga y desbloqueo de audio para latencia cero
    this.audio.preloadMagicPairsAudio();

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
      { key: "campus_logo", name: "Campuslands", isSpecial: true },
      { key: "cajasan_logo", name: "Cajasan", isSpecial: true },
      { key: "practi_logo", name: "Practi Arepa", isSpecial: true },
      { key: "mariposa_logo", name: "Dulces Mariposa", isSpecial: true },
      { key: "angelus_logo", name: "Ángelus Seguridad", isSpecial: true },
      { key: "factor_logo", name: "Factor Humano", isSpecial: true },
      { key: "fundalas_logo", name: "Fundalas", isSpecial: true },
      { key: "imebu_logo", name: "IMEBU", isSpecial: true }
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

    // Separar juguetes clásicos y patrocinadores para garantizar presencia de marcas
    const sponsorPairs = fullPool.filter((p) => p.isSpecial);
    const standardPairs = fullPool.filter((p) => !p.isSpecial);

    // Barajar ambos conjuntos (Fisher-Yates)
    const shuffleArray = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledSponsors = shuffleArray(sponsorPairs);
    const shuffledStandards = shuffleArray(standardPairs);

    // Cantidad equilibrada de cartas de patrocinadores (al menos 1 en nivel 1-2, 2-3 en niveles superiores)
    const numSponsors = Math.min(shuffledSponsors.length, Math.max(1, Math.floor(this.totalPairs * 0.45)));
    const numStandards = this.totalPairs - numSponsors;

    const selectedPairs = [
      ...shuffledSponsors.slice(0, numSponsors),
      ...shuffledStandards.slice(0, numStandards)
    ];

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

  private getHeaderLayout(): { y: number; h: number; w: number; x: number; fontSize: number } {
    const isShort = this.height <= 700;
    const hudH = isShort
      ? Math.max(36, Math.min(48, this.height * 0.10))
      : Math.max(44, Math.min(68, this.height * 0.075));
    
    const h = isShort ? Math.max(24, Math.min(32, this.height * 0.08)) : Math.max(30, Math.min(42, this.height * 0.065));
    const y = hudH + (isShort ? 3 : Math.max(6, this.height * 0.012));
    const w = Math.min(this.width * 0.88, 540);
    const x = (this.width - w) / 2;
    const fontSize = Math.max(11, Math.min(17, h * 0.46));
    return { y, h, w, x, fontSize };
  }

  private layoutCards(): void {
    if (this.cards.length === 0) return;

    const aspectRatio = this.width / Math.max(1, this.height);
    const isPortrait = aspectRatio < 0.95;
    const isLandscape = aspectRatio > 1.25;
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
      if (aspectRatio > 1.6) {
        cols = 6;
        rows = 2;
      } else if (isLandscape) {
        cols = 4;
        rows = 3;
      } else if (aspectRatio < 0.65) {
        cols = 2;
        rows = 6;
      } else {
        cols = 3;
        rows = 4;
      }
    }

    const header = this.getHeaderLayout();
    const isShort = this.height <= 700;
    const startY = header.y + header.h + (isShort ? 4 : Math.max(8, this.height * 0.015));
    const bottomPad = isShort ? 6 : Math.max(10, this.height * 0.02);
    const gridH = Math.max(100, this.height - startY - bottomPad);

    const gapX = Math.max(6, Math.min(18, this.width * 0.02));
    const gapY = Math.max(6, Math.min(14, this.height * 0.015));

    const maxCardWByH = ((gridH - gapY * (rows - 1)) / rows) * 1.5;
    const gridW = Math.min(this.width * 0.94, cols * Math.max(80, Math.min(220, maxCardWByH)));
    const startX = (this.width - gridW) / 2;

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
    const pairKey = this.firstSelectedCard.pairKey;
    const isStar = pairKey === "star_logo";
    const isElf = pairKey === "elf_flyer";
    const points = isLogo ? 500 : (isElf ? 300 : 200);

    this.addScore(points);

    const centerX = (this.firstSelectedCard.x + this.secondSelectedCard.x) / 2 + this.firstSelectedCard.w / 2;
    const centerY = (this.firstSelectedCard.y + this.secondSelectedCard.y) / 2 + this.firstSelectedCard.h / 2;

    // Detectar si la pareja corresponde a un patrocinador oficial
    const sponsorKey = pairKey.replace("_logo", "");
    const sponsorConfig = BRANDING.sponsors[sponsorKey] || (pairKey === "fair_logo" ? BRANDING.sponsors.feria : null);

    if (sponsorConfig) {
      this.triggerLogoPowerUp(sponsorConfig.id, 6);
      this.addFloatingText(`¡PAREJA ${sponsorConfig.shortName.toUpperCase()}! +500`, centerX, centerY, sponsorConfig.themeColor, 1.35);
      this.particles.emitBurst(centerX, centerY, sponsorConfig.themeColor, 30);
      this.particles.emitConfetti(this.width, 30);
    } else if (isStar) {
      this.addFloatingText("¡ESTRELLA MÁGICA! +500", centerX, centerY, "#FFE082", 1.35);
      this.particles.emitBurst(centerX, centerY, "#FFD700", 25);
    } else if (isElf) {
      this.addFloatingText("¡ELFO VOLADOR! +300", centerX, centerY, "#76FF03", 1.3);
      this.particles.emitBurst(centerX, centerY, "#00E676", 20);
    } else if (pairKey === "candy_cane") {
      this.addFloatingText("¡BASTÓN DULCE! +200", centerX, centerY, "#FF1744", 1.25);
      this.particles.emitBurst(centerX, centerY, "#FF5252", 18);
    } else if (pairKey === "drums") {
      this.addFloatingText("¡TAMBORES! +200", centerX, centerY, "#FF9100", 1.25);
      this.particles.emitBurst(centerX, centerY, "#FFAB40", 18);
    } else if (pairKey === "bells") {
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
    this.setGameTimeout(() => {
      this.pairsFound = 0;
      this.setupDeck();
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
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      // Dibujar fondo de habitación navideña acogedora
      ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      // Viñeta festiva para enfocar la atención en el tablero de cartas
      const vignette = ctx.createRadialGradient(
        this.width / 2, this.height * 0.5, 50,
        this.width / 2, this.height * 0.5, Math.max(this.width, this.height) * 0.65
      );
      vignette.addColorStop(0, "rgba(8, 16, 32, 0.65)");
      vignette.addColorStop(1, "rgba(4, 8, 18, 0.92)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, "#120826");
      bgGrad.addColorStop(0.5, "#200E3B");
      bgGrad.addColorStop(1, "#0A0414");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderHeader(ctx: CanvasRenderingContext2D): void {
    const { y, h, w, x, fontSize } = this.getHeaderLayout();

    // Placa de madera tallada para el nivel y progreso
    ctx.save();
    const plaqueGrad = ctx.createLinearGradient(x, y, x, y + h);
    plaqueGrad.addColorStop(0, "#2D1810");
    plaqueGrad.addColorStop(0.5, "#1B0E09");
    plaqueGrad.addColorStop(1, "#0F0704");
    ctx.fillStyle = plaqueGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [14]);
    ctx.fill();

    // Borde noble dorado
    ctx.strokeStyle = "#F1C40F";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Ribete interior fino
    ctx.strokeStyle = "rgba(255, 215, 0, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, w - 6, h - 6, [11]);
    ctx.stroke();

    // Texto con tipografía festiva y contorno nítido (sin shadowBlur)
    ctx.font = `900 ${fontSize}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      `⭐ NIVEL ${this.level}   •   🎁 PAREJAS: ${this.pairsFound} / ${this.totalPairs}`,
      this.width / 2,
      y + h / 2 + 1
    );
    ctx.restore();
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
      ctx.globalAlpha = 0.55;
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
    // Sombra de tarjeta
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    // Fondo estilo terciopelo real azul medianoche
    const backGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    backGrad.addColorStop(0, "#1E293B");
    backGrad.addColorStop(0.5, "#0F172A");
    backGrad.addColorStop(1, "#030712");
    ctx.fillStyle = backGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, w, h, [16]);
    ctx.fill();

    // Borde doble dorado biselado
    ctx.strokeStyle = "#F1C40F";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Marco interior dorado
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-halfW + 6, -halfH + 6, w - 12, h - 12, [10]);
    ctx.stroke();

    // Adornos de esquina tallados
    const orn = Math.min(12, halfW * 0.25);
    ctx.fillStyle = "#FFD700";
    // TL
    ctx.beginPath();
    ctx.moveTo(-halfW + 8, -halfH + 8);
    ctx.lineTo(-halfW + 8 + orn, -halfH + 8);
    ctx.lineTo(-halfW + 8, -halfH + 8 + orn);
    ctx.fill();
    // TR
    ctx.beginPath();
    ctx.moveTo(halfW - 8, -halfH + 8);
    ctx.lineTo(halfW - 8 - orn, -halfH + 8);
    ctx.lineTo(halfW - 8, -halfH + 8 + orn);
    ctx.fill();
    // BL
    ctx.beginPath();
    ctx.moveTo(-halfW + 8, halfH - 8);
    ctx.lineTo(-halfW + 8 + orn, halfH - 8);
    ctx.lineTo(-halfW + 8, halfH - 8 - orn);
    ctx.fill();
    // BR
    ctx.beginPath();
    ctx.moveTo(halfW - 8, halfH - 8);
    ctx.lineTo(halfW - 8 - orn, halfH - 8);
    ctx.lineTo(halfW - 8, halfH - 8 - orn);
    ctx.fill();

    // Medallón oficial de la Feria Mágica en el centro del dorso
    const medalSize = Math.min(w, h) * 0.52;
    if (this.spriteMedallion && this.spriteMedallion.complete && this.spriteMedallion.naturalWidth > 0) {
      // Resplandor dorado detrás del sello
      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, medalSize * 0.5);
      aura.addColorStop(0, "rgba(255, 215, 0, 0.35)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, medalSize * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(this.spriteMedallion, -medalSize / 2, -medalSize / 2, medalSize, medalSize);
    } else {
      // Respaldo ornamental
      const starR = Math.min(halfW, halfH) * 0.28;
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

    ctx.restore();
  }

  private renderCardFront(
    ctx: CanvasRenderingContext2D,
    card: MemoryCard,
    halfW: number,
    halfH: number,
    isMismatch: boolean
  ): void {
    const sponsorKey = card.pairKey.replace("_logo", "");
    const sponsorConfig = BRANDING.sponsors[sponsorKey] || (card.pairKey === "fair_logo" ? BRANDING.sponsors.feria : null);
    const isStar = card.pairKey === "star_logo";

    ctx.save();

    // Sombra si está seleccionada o resplandor de acierto
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    // Fondo estilo pergamino marfil noble
    const frontGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    if (card.isMatched) {
      frontGrad.addColorStop(0, "#D1FAE5");
      frontGrad.addColorStop(1, "#A7F3D0");
    } else if (isMismatch) {
      frontGrad.addColorStop(0, "#FEE2E2");
      frontGrad.addColorStop(1, "#FECACA");
    } else if (sponsorConfig) {
      frontGrad.addColorStop(0, "#FFFFFF");
      frontGrad.addColorStop(1, "#F8FAFC");
    } else {
      frontGrad.addColorStop(0, "#FFFFFF");
      frontGrad.addColorStop(1, "#F8FAFC");
    }

    ctx.fillStyle = frontGrad;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, card.w, card.h, [16]);
    ctx.fill();

    // Borde exterior con color temático del patrocinador
    let strokeColor = sponsorConfig ? sponsorConfig.themeColor : (isStar ? "#F59E0B" : "#D4AF37");
    if (card.isMatched) strokeColor = "#10B981";
    if (isMismatch) strokeColor = "#EF4444";

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = card.isMatched || isMismatch ? 4.5 : (card.isSpecialLogo ? 4 : 2.8);
    ctx.stroke();

    // Sprite HD del Juguete o Logo
    const imgToDraw = this.getSpriteForCard(card.pairKey);
    const iconSize = Math.min(card.w, card.h) * 0.70;

    if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
      // Si es un logo de patrocinador con relación de aspecto ancha, mantener proporción contain
      const aspect = imgToDraw.naturalWidth / (imgToDraw.naturalHeight || 1);
      let drawW = iconSize;
      let drawH = iconSize;
      if (aspect > 1.3) {
        drawW = Math.min(card.w * 0.82, iconSize * 1.35);
        drawH = drawW / aspect;
      } else if (aspect < 0.75) {
        drawH = iconSize;
        drawW = drawH * aspect;
      }
      ctx.drawImage(imgToDraw, -drawW / 2, -drawH / 2 - 4, drawW, drawH);
    } else {
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(0, -4, iconSize * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Etiquetas especiales y badge del patrocinador
    if (sponsorConfig) {
      ctx.fillStyle = sponsorConfig.accentColor || sponsorConfig.themeColor;
      ctx.font = "900 11px 'Titan One', cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${sponsorConfig.shortName.toUpperCase()} x2`, 0, halfH - 12);
    } else if (isStar) {
      ctx.fillStyle = "#B45309";
      ctx.font = "900 11px 'Titan One', cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ESTRELLA", 0, halfH - 12);
    }

    ctx.restore();
  }

  private getSpriteForCard(pairKey: string): HTMLImageElement | null {
    const sponsorKey = pairKey.replace("_logo", "");
    const sponsorConfig = BRANDING.sponsors[sponsorKey] || (pairKey === "fair_logo" ? BRANDING.sponsors.feria : null);
    if (sponsorConfig) {
      return this.sponsorCardSprites.get(sponsorConfig.id) || this.spriteLogo1;
    }

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
      default: return null;
    }
  }

  public override destroy(): void {
    super.destroy();
    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;
    this.cards = [];
  }
}
