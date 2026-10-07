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
   * 4. Transición de Papel de Regalo Navideño con Efecto Físico de Desgarre por Manos (Hands Tearing / Unboxing)
   * Envuelve la pantalla en papel de regalo navideño con lazos dorados y dos manos animadas desgarran el paquete con fuerza.
   */
  public runGiftUnwrapTransition(
    container: HTMLElement,
    gameData: { title: string; icon: string; themeColor?: string; subtitle?: string },
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "gift-transition-overlay";
    const subText = gameData.subtitle || "¡ABRIENDO JUGUETE MÁGICO!";
    
    overlay.innerHTML = `
      <!-- Destello de Fondo / God Rays al abrirse -->
      <div class="gift-backdrop-glow"></div>

      <!-- Grieta Mágica de Rasgadura Central -->
      <div class="gift-tear-crack"></div>

      <!-- 4 Paneles / Solapas de Papel de Regalo con Bordes Rasgados 3D -->
      <div class="gift-tear-piece tear-top-left">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="gift-tear-edge edge-h"></div>
        <div class="gift-tear-edge edge-v"></div>
        <div class="gift-paper-curl curl-tl"></div>
      </div>

      <div class="gift-tear-piece tear-top-right">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="gift-tear-edge edge-h"></div>
        <div class="gift-tear-edge edge-v"></div>
        <div class="gift-paper-curl curl-tr"></div>
      </div>

      <div class="gift-tear-piece tear-bottom-left">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="gift-tear-edge edge-h"></div>
        <div class="gift-tear-edge edge-v"></div>
        <div class="gift-paper-curl curl-bl"></div>
      </div>

      <div class="gift-tear-piece tear-bottom-right">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="gift-tear-edge edge-h"></div>
        <div class="gift-tear-edge edge-v"></div>
        <div class="gift-paper-curl curl-br"></div>
      </div>

      <!-- Costura Dentada de Rasgado Central -->
      <div class="gift-rip-seam"></div>

      <!-- Manos Animadas de Santa / Elfo Desgarrando el Paquete con Fuerza -->
      <div class="gift-tearing-hand hand-left">
        <div class="hand-sleeve"></div>
        <div class="hand-cuff"></div>
        <div class="hand-glove">
          <div class="hand-finger f1"></div>
          <div class="hand-finger f2"></div>
          <div class="hand-finger f3"></div>
          <div class="hand-thumb"></div>
        </div>
      </div>

      <div class="gift-tearing-hand hand-right">
        <div class="hand-sleeve"></div>
        <div class="hand-cuff"></div>
        <div class="hand-glove">
          <div class="hand-finger f1"></div>
          <div class="hand-finger f2"></div>
          <div class="hand-finger f3"></div>
          <div class="hand-thumb"></div>
        </div>
      </div>

      <!-- Trozos / Virutas de Papel Rasgado Volando en 3D -->
      <div class="gift-flying-scrap scrap-1"></div>
      <div class="gift-flying-scrap scrap-2"></div>
      <div class="gift-flying-scrap scrap-3"></div>
      <div class="gift-flying-scrap scrap-4"></div>
      <div class="gift-flying-scrap scrap-5"></div>
      <div class="gift-flying-scrap scrap-6"></div>

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

        <!-- Moño 3D Majestuoso con Orejas y Cintas Colgantes -->
        <div class="gift-luxury-bow">
          <!-- Colas de cinta colgantes -->
          <div class="gift-bow-tail tail-left"></div>
          <div class="gift-bow-tail tail-right"></div>
          
          <!-- Lazos superiores e inferiores en capas 3D -->
          <div class="gift-bow-loop loop-back-left"></div>
          <div class="gift-bow-loop loop-back-right"></div>
          <div class="gift-bow-loop loop-main-left"></div>
          <div class="gift-bow-loop loop-main-right"></div>

          <!-- Nudo Central con Gran Logo Estrella 3D -->
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
            <span class="gift-pill-text">${subText}</span>
            <span class="gift-pill-dot"></span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    // Sonido de envoltorio con whoosh
    this.audio.playWhoosh();

    // 1. Envolver (Cierre elástico con impacto en 600ms)
    requestAnimationFrame(() => {
      overlay.classList.add("is-wrapping");
    });

    // 2. Punto medio: Pantalla completamente cubierta
    setTimeout(() => {
      onMidpoint();

      // Pausa para apreciar el paquete de regalo antes de que aparezcan las manos a desgarrarlo
      setTimeout(() => {
        // Las manos agarran el centro del paquete
        overlay.classList.add("is-hands-grabbing");

        // 180ms después: ¡Jalón y desgarre violento del paquete!
        setTimeout(() => {
          this.audio.playPaperTear();
          setTimeout(() => this.audio.playGiftUnwrap(), 160);

          const bounds = container.getBoundingClientRect();
          particles.emitBurst(bounds.width / 2, bounds.height * 0.45, gameData.themeColor || "#FFD700", 45);
          particles.emitConfetti(bounds.width, 70);

          // 3. ¡Desgarrar papel de regalo en 3D con las manos abriendo el hueco!
          overlay.classList.remove("is-wrapping");
          overlay.classList.add("is-unwrapping");

          // 4. Finalización limpia
          setTimeout(() => {
            overlay.classList.add("is-finished");
            setTimeout(() => {
              overlay.remove();
              onComplete();
            }, 450);
          }, 950);

        }, 220);

      }, 850);

    }, 600);
  }
}
