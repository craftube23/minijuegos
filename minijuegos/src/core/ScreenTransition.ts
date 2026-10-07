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
   * 1. Transición Inicial: Tormenta de Nieve Mágica & Revelación Cinemática
   */
  public runInitialSnowstorm(container: HTMLElement, onRevealed: () => void): void {
    const curtain = document.createElement("div");
    curtain.className = "snowstorm-curtain";
    curtain.innerHTML = `
      <div class="intro-magic-box">
        <!-- Logo Estrella 3D Animado con Aura y Chispas -->
        <div class="intro-star-wrapper">
          <div class="intro-magic-glow"></div>
          <img src="./assets/images/estrella con logo.png" alt="Feria Mágica del Juguete" class="intro-star-logo" />
          <div class="intro-sparkle s1">✦</div>
          <div class="intro-sparkle s2">✧</div>
          <div class="intro-sparkle s3">✦</div>
          <div class="intro-sparkle s4">★</div>
        </div>

        <!-- Título 3D Volumétrico Dorado -->
        <h1 class="intro-magic-title">FERIA MÁGICA</h1>
        <div class="intro-magic-badge">DEL JUGUETE</div>

        <!-- Barra de Carga Mágica Iluminada -->
        <div class="intro-progress-container">
          <div class="intro-progress-bar">
            <div class="intro-progress-fill" id="intro-progress-fill"></div>
            <div class="intro-progress-glint"></div>
          </div>
        </div>

        <!-- Texto de Estado Dinámico -->
        <p class="intro-magic-status" id="intro-status-text">✨ Preparando la magia navideña...</p>
      </div>
    `;

    container.appendChild(curtain);

    const fillEl = curtain.querySelector<HTMLElement>("#intro-progress-fill");
    const textEl = curtain.querySelector<HTMLElement>("#intro-status-text");

    // Animación de llenado de barra y cambio de textos mágicos
    if (fillEl) {
      setTimeout(() => { fillEl.style.width = "40%"; }, 100);
      setTimeout(() => { 
        fillEl.style.width = "75%"; 
        if (textEl) textEl.textContent = "🎁 Empacando juguetes mágicos...";
      }, 700);
      setTimeout(() => { 
        fillEl.style.width = "100%"; 
        if (textEl) textEl.textContent = "🎄 ¡Feria lista! Abriendo puertas...";
      }, 1350);
    }

    // Secuencia de dispersión, sonido y revelación
    setTimeout(() => {
      this.audio.playWhoosh();
      curtain.classList.add("is-revealed");

      setTimeout(() => {
        curtain.remove();
        onRevealed();
      }, 650);
    }, 1850);
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

  /**
   * 4. Transición de Telón / Desenvolvimiento de Regalo Navideño (Gift Unwrap Transition)
   * Cierra dos telones de terciopelo/papel de regalo con lazo dorado y abre mágicamente el minijuego.
   */
  public runGiftUnwrapTransition(
    container: HTMLElement,
    gameData: { title: string; icon: string; themeColor?: string },
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "gift-transition-overlay";
    overlay.innerHTML = `
      <!-- Destello de Fondo / God Rays al abrirse -->
      <div class="gift-backdrop-glow"></div>

      <!-- Telón Izquierdo de Regalo de Terciopelo con Pliegues 3D y Brocado -->
      <div class="gift-curtain gift-curtain-left">
        <div class="gift-curtain-folds"></div>
        <div class="gift-curtain-damask"></div>
        <div class="gift-curtain-gold-trim">
          <div class="gift-trim-braid"></div>
        </div>
      </div>

      <!-- Telón Derecho de Regalo de Terciopelo con Pliegues 3D y Brocado -->
      <div class="gift-curtain gift-curtain-right">
        <div class="gift-curtain-folds"></div>
        <div class="gift-curtain-damask"></div>
        <div class="gift-curtain-gold-trim">
          <div class="gift-trim-braid"></div>
        </div>
      </div>

      <!-- Cintas de Satén Dorado 3D con Costuras y Reflejo Líquido -->
      <div class="gift-ribbon gift-ribbon-horizontal">
        <div class="gift-ribbon-stitch top"></div>
        <div class="gift-ribbon-glint"></div>
        <div class="gift-ribbon-stitch bottom"></div>
      </div>
      <div class="gift-ribbon gift-ribbon-vertical">
        <div class="gift-ribbon-stitch left"></div>
        <div class="gift-ribbon-glint-v"></div>
        <div class="gift-ribbon-stitch right"></div>
      </div>

      <!-- Anillo de Onda de Choque Mágica al cerrar y abrir -->
      <div class="gift-shockwave-ring"></div>

      <!-- Gran Moño 3D y Sello Mágico Festivo -->
      <div class="gift-center-box" style="--seal-theme-color: ${gameData.themeColor || '#FFD700'}">
        <!-- Partículas y Estrellas Giratorias -->
        <div class="gift-floating-particles">
          <span class="g-sparkle s1">✨</span>
          <span class="g-sparkle s2">⭐</span>
          <span class="g-sparkle s3">✦</span>
          <span class="g-sparkle s4">❄️</span>
          <span class="g-sparkle s5">✨</span>
          <span class="g-sparkle s6">★</span>
        </div>

        <!-- Moño 3D con Orejas y Cintas Colgantes -->
        <div class="gift-luxury-bow">
          <!-- Colas de cinta colgantes -->
          <div class="gift-bow-tail tail-left"></div>
          <div class="gift-bow-tail tail-right"></div>
          
          <!-- Lazos superiores e inferiores en capas 3D -->
          <div class="gift-bow-loop loop-back-left"></div>
          <div class="gift-bow-loop loop-back-right"></div>
          <div class="gift-bow-loop loop-main-left"></div>
          <div class="gift-bow-loop loop-main-right"></div>

          <!-- Nudo Central con Logo Estrella 3D -->
          <div class="gift-bow-center-knot">
            <div class="gift-knot-aura"></div>
            <img src="./assets/images/estrella con logo.png" alt="Feria Mágica" class="gift-bow-star" />
          </div>
        </div>

        <!-- Placa Emblema Tallada en Oro y Madera Festiva -->
        <div class="gift-game-badge">
          <div class="gift-badge-corner tl"></div>
          <div class="gift-badge-corner tr"></div>
          <div class="gift-badge-corner bl"></div>
          <div class="gift-badge-corner br"></div>

          <div class="gift-icon-container">
            <div class="gift-icon-glow"></div>
            <span class="gift-game-icon">${gameData.icon}</span>
          </div>
          
          <h2 class="gift-game-title">${gameData.title}</h2>
          
          <div class="gift-unwrapping-pill">
            <span class="gift-pill-dot"></span>
            <span class="gift-pill-text">¡ABRIENDO JUGUETE MÁGICO!</span>
            <span class="gift-pill-dot"></span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    // Sonido de cierre envolvente con whoosh cinematográfico
    this.audio.playWhoosh();

    // 1. Envolver (Cierre elástico con impacto)
    requestAnimationFrame(() => {
      overlay.classList.add("is-wrapping");
    });

    // 2. Punto medio: La pantalla está 100% cubierta
    setTimeout(() => {
      onMidpoint();

      // Sonido de desenvoltorio festivo y desatado de lazo
      this.audio.playGiftUnwrap();

      const bounds = container.getBoundingClientRect();
      particles.emitBurst(bounds.width / 2, bounds.height * 0.45, gameData.themeColor || "#FFD700", 35);
      particles.emitConfetti(bounds.width, 50);

      // 3. ¡Desatar lazo y abrir telones con efecto dramático!
      overlay.classList.remove("is-wrapping");
      overlay.classList.add("is-unwrapping");

      // 4. Finalización suave
      setTimeout(() => {
        overlay.classList.add("is-finished");
        setTimeout(() => {
          overlay.remove();
          onComplete();
        }, 380);
      }, 750);

    }, 600);
  }
}
