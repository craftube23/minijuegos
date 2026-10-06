/**
 * ==============================================================================
 * GESTOR CENTRALIZADO DE TRANSICIONES CINEMÁTICAS (ScreenTransition)
 * ==============================================================================
 * 
 * Orquesta las transiciones de videojuego 2D:
 * 1. Tormenta de Nieve Inicial & Revelación.
 * 2. Portal de Despegue a los Juegos (Zoom + Vuelo a la derecha).
 * 3. Cuenta Regresiva 3-2-1 antes del inicio de partida.
 */

import { AudioManager } from "./AudioManager";
import { ParticleSystem } from "./ParticleSystem";

export class ScreenTransition {
  private static instance: ScreenTransition;
  private audio: AudioManager;

  private constructor() {
    this.audio = AudioManager.getInstance();
  }

  public static getInstance(): ScreenTransition {
    if (!ScreenTransition.instance) {
      ScreenTransition.instance = new ScreenTransition();
    }
    return ScreenTransition.instance;
  }

  /**
   * 1. Transición Inicial: Tormenta de Nieve Mágica & Revelación
   */
  public runInitialSnowstorm(container: HTMLElement, onRevealed: () => void): void {
    const curtain = document.createElement("div");
    curtain.className = "snowstorm-curtain";
    curtain.innerHTML = `
      <div style="text-align: center; color: #FFF275; font-family: var(--font-festive); font-size: clamp(2rem, 6vw, 3.8rem); font-weight: 900; text-shadow: 0 4px 15px rgba(0,0,0,0.9), 0 0 35px rgba(255,215,0,0.8); animation: pulseBigBtn 2s infinite;">
        ❄️ FERIA MÁGICA ❄️
      </div>
      <div style="font-family: var(--font-main); color: #E2E8F0; font-size: 1.1rem; font-weight: 700; margin-top: 12px; letter-spacing: 2px;">
        PREPARANDO LA MAGIA...
      </div>
    `;

    container.appendChild(curtain);

    // Secuencia de dispersión y revelación
    setTimeout(() => {
      this.audio.playWhoosh();
      curtain.classList.add("is-revealed");

      setTimeout(() => {
        curtain.remove();
        onRevealed();
      }, 750);
    }, 1200);
  }

  /**
   * 2. Transición Menú -> Juego: Glow + Zoom + Vuelo hacia la derecha
   */
  public playCardLaunch(
    selectedCard: HTMLElement,
    allCards: NodeListOf<HTMLElement>,
    onLaunchComplete: () => void
  ): void {
    this.audio.playWhoosh();

    // 1. Desvanecer las otras tarjetas
    allCards.forEach((card) => {
      if (card !== selectedCard) {
        card.classList.add("is-fading-out");
      }
    });

    // 2. Animar la tarjeta seleccionada con vuelo a la derecha
    selectedCard.classList.add("is-launching");

    // 3. Al terminar la animación (600ms), activar cuenta regresiva
    setTimeout(() => {
      // Limpiar clases de animación
      allCards.forEach((card) => {
        card.classList.remove("is-launching", "is-fading-out");
      });
      onLaunchComplete();
    }, 620);
  }

  /**
   * 3. Cuenta Regresiva de Inicio de Juego ("3... 2... 1... ¡A JUGAR!")
   */
  public runCountdown(
    container: HTMLElement,
    particles: ParticleSystem,
    onCountdownComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "countdown-overlay";
    container.appendChild(overlay);

    const steps = [
      { text: "3", subtext: "¡PREPÁRATE!", soundStep: 3, delay: 0 },
      { text: "2", subtext: "¡LISTOS!", soundStep: 2, delay: 850 },
      { text: "1", subtext: "¡ATENTOS!", soundStep: 1, delay: 1700 },
      { text: "¡A JUGAR!", subtext: "¡BUENA SUERTE!", soundStep: 0, delay: 2550 }
    ];

    steps.forEach(({ text, subtext, soundStep, delay }) => {
      setTimeout(() => {
        overlay.innerHTML = `
          <div class="countdown-number">${text}</div>
          <div class="countdown-subtext">${subtext}</div>
        `;

        const bounds = container.getBoundingClientRect();
        if (soundStep > 0) {
          this.audio.playCountdownStep(soundStep);
          particles.emitBurst(bounds.width / 2, bounds.height * 0.45, "#FFD700", 20);
        } else {
          this.audio.playGameStart();
          particles.emitBurst(bounds.width / 2, bounds.height * 0.45, "#00E5FF", 35);
          particles.emitConfetti(bounds.width, 40);
        }
      }, delay);
    });

    // Finalizar cuenta regresiva y comenzar tiempo de juego
    setTimeout(() => {
      overlay.style.transition = "opacity 0.25s ease-out";
      overlay.style.opacity = "0";

      setTimeout(() => {
        overlay.remove();
        onCountdownComplete();
      }, 250);
    }, 3350);
  }
}
