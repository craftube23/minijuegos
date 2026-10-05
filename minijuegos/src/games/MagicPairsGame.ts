/**
 * ==============================================================================
 * JUEGO 4: 🃏 PAREJAS MÁGICAS DE JUGUETES (Memory Toy Match)
 * ==============================================================================
 * 
 * MECÁNICA:
 * - Tablero de cartas táctiles con reverso de la Feria Mágica (Logo 1).
 * - El jugador toca 2 cartas para voltearlas y buscar parejas de juguetes.
 * - Al encontrar la pareja dorada con el Logo 2, recibe un Gran Bono y confeti.
 * - Al despejar el tablero, se reparte una nueva ronda con más bonificación.
 */

import { BaseGame } from "../core/BaseGame";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { ParticleSystem } from "../core/ParticleSystem";

interface MemoryCard {
  id: number;
  pairKey: string;
  emoji: string;
  isSpecialLogo: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  isFlipped: boolean;
  isMatched: boolean;
  flipProgress: number; // 0: Cerrada, 1: Abierta (para animación suave)
}

export class MagicPairsGame extends BaseGame {
  private cards: MemoryCard[] = [];
  private firstSelectedCard: MemoryCard | null = null;
  private secondSelectedCard: MemoryCard | null = null;
  private isCheckingMatch: boolean = false;
  private pairsFound: number = 0;
  private totalPairs: number = 4; // 8 cartas en total (4 columnas x 2 filas grandes)

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "magic-pairs",
      "🃏 Parejas Mágicas de Juguetes",
      "¡Toca las cartas para encontrar los pares de juguetes antes de que se acabe el tiempo!",
      canvas,
      input,
      audio,
      particles
    );
  }

  protected onStart(): void {
    this.pairsFound = 0;
    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;
    this.setupDeck();
  }

  private setupDeck(): void {
    this.cards = [];
    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;

    // Lista de pares posibles
    const toyPairs = [
      { key: "teddy", emoji: "🧸", isSpecial: false },
      { key: "train", emoji: "🚂", isSpecial: false },
      { key: "robot", emoji: "🤖", isSpecial: false },
      { key: "fair_star", emoji: "⭐", isSpecial: true } // Pareja especial con Logo 2
    ];

    const rawDeck: Array<{ pairKey: string; emoji: string; isSpecial: boolean }> = [];
    for (const p of toyPairs) {
      rawDeck.push({ pairKey: p.key, emoji: p.emoji, isSpecial: p.isSpecial });
      rawDeck.push({ pairKey: p.key, emoji: p.emoji, isSpecial: p.isSpecial });
    }

    // Barajar cartas (Fisher-Yates)
    for (let i = rawDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawDeck[i], rawDeck[j]] = [rawDeck[j], rawDeck[i]];
    }

    // Calcular dimensiones y posiciones de las cartas en el Canvas
    const cols = 2;
    const rows = 4;
    const cardW = 380;
    const cardH = 220;
    const gapX = 40;
    const gapY = 35;

    const totalGridW = cols * cardW + (cols - 1) * gapX;
    const startX = (this.width - totalGridW) / 2;
    const startY = 220;

    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (index >= rawDeck.length) break;
        const item = rawDeck[index];
        this.cards.push({
          id: index,
          pairKey: item.pairKey,
          emoji: item.emoji,
          isSpecialLogo: item.isSpecial,
          x: startX + c * (cardW + gapX),
          y: startY + r * (cardH + gapY),
          w: cardW,
          h: cardH,
          isFlipped: false,
          isMatched: false,
          flipProgress: 0
        });
        index++;
      }
    }
  }

  protected onUpdate(dt: number): void {
    // 1. Animar volteo de cartas
    for (const card of this.cards) {
      const target = card.isFlipped || card.isMatched ? 1 : 0;
      card.flipProgress += (target - card.flipProgress) * 15 * dt;
    }

    // 2. Control Táctil
    if (!this.isCheckingMatch) {
      const pointer = this.input.getPrimaryPointer();
      if (pointer && pointer.isDown) {
        for (const card of this.cards) {
          if (!card.isFlipped && !card.isMatched) {
            // Verificar si el toque cayó dentro de la carta
            if (
              pointer.x >= card.x &&
              pointer.x <= card.x + card.w &&
              pointer.y >= card.y &&
              pointer.y <= card.y + card.h
            ) {
              this.handleCardClick(card);
              break;
            }
          }
        }
      }
    }
  }

  private handleCardClick(card: MemoryCard): void {
    this.audio.playTap();
    card.isFlipped = true;

    if (!this.firstSelectedCard) {
      this.firstSelectedCard = card;
    } else if (!this.secondSelectedCard && card !== this.firstSelectedCard) {
      this.secondSelectedCard = card;
      this.isCheckingMatch = true;

      // Comprobar coincidencia tras una fracción de segundo
      setTimeout(() => {
        this.checkMatch();
      }, 500);
    }
  }

  private checkMatch(): void {
    if (!this.firstSelectedCard || !this.secondSelectedCard) return;

    if (this.firstSelectedCard.pairKey === this.secondSelectedCard.pairKey) {
      // ¡Acierto!
      this.firstSelectedCard.isMatched = true;
      this.secondSelectedCard.isMatched = true;
      this.pairsFound++;

      if (this.firstSelectedCard.isSpecialLogo) {
        // Pareja especial del Logo 2
        this.addScore(800);
        this.triggerLogoPowerUp(2, 6);
      } else {
        this.addScore(300);
        this.audio.playCatchItem();
        this.particles.emitBurst(this.firstSelectedCard.x + this.firstSelectedCard.w / 2, this.firstSelectedCard.y + this.firstSelectedCard.h / 2, "#FFD700", 15);
      }

      // ¿Completó todo el tablero?
      if (this.pairsFound >= this.totalPairs) {
        this.addScore(1000);
        this.audio.playVictory();
        this.particles.emitConfetti(this.width, 50);

        // Repartir un nuevo tablero para seguir sumando puntos
        setTimeout(() => {
          if (this.isRunning && !this.isGameOver) {
            this.pairsFound = 0;
            this.setupDeck();
          }
        }, 1200);
      }
    } else {
      // Error: Voltear de nuevo boca abajo
      this.audio.playError();
      this.firstSelectedCard.isFlipped = false;
      this.secondSelectedCard.isFlipped = false;
    }

    this.firstSelectedCard = null;
    this.secondSelectedCard = null;
    this.isCheckingMatch = false;
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    // 1. Fondo elegante festivo
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, "#082032");
    bgGrad.addColorStop(0.5, "#1F4068");
    bgGrad.addColorStop(1, "#162447");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Título de instrucción
    ctx.save();
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`✨ ENCUENTRA TODAS LAS PAREJAS (${this.pairsFound}/${this.totalPairs}) ✨`, this.width / 2, 160);
    ctx.restore();

    // 3. Dibujar Cartas
    for (const card of this.cards) {
      ctx.save();
      const cx = card.x + card.w / 2;
      const cy = card.y + card.h / 2;

      ctx.translate(cx, cy);

      // Efecto 3D de volteo (escala horizontal)
      const scaleX = Math.abs(Math.cos(card.flipProgress * Math.PI));
      ctx.scale(Math.max(scaleX, 0.05), 1);

      const isFaceUp = card.flipProgress > 0.5;

      if (isFaceUp) {
        // Cara descubierta
        ctx.fillStyle = card.isMatched ? "rgba(46, 204, 113, 0.3)" : "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(-card.w / 2, -card.h / 2, card.w, card.h, 20);
        ctx.fill();

        ctx.strokeStyle = card.isSpecialLogo ? "#FFD700" : "#2ECC71";
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.font = "80px 'Segoe UI Emoji', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(card.emoji, 0, -10);

        if (card.isSpecialLogo) {
          ctx.fillStyle = "#0A2518";
          ctx.font = "bold 20px 'Segoe UI', sans-serif";
          ctx.fillText("FERIA MÁGICA", 0, 60);
        }
      } else {
        // Reverso (Diseño de la Feria)
        ctx.fillStyle = "#C0392B";
        ctx.beginPath();
        ctx.roundRect(-card.w / 2, -card.h / 2, card.w, card.h, 20);
        ctx.fill();

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 5;
        ctx.stroke();

        // Patrón interior
        ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
        ctx.beginPath();
        ctx.roundRect(-card.w / 2 + 12, -card.h / 2 + 12, card.w - 24, card.h - 24, 12);
        ctx.fill();

        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 26px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🎁", 0, -20);
        ctx.fillText("FERIA MÁGICA", 0, 30);
      }

      ctx.restore();
    }
  }
}
