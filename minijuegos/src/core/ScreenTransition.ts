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
import { getIconSvg } from "../utils/icons";

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
        <p class="intro-magic-status" id="intro-status-text">Preparando la magia navideña...</p>
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
        if (textEl) textEl.textContent = "Empacando juguetes mágicos...";
      }, 700);
      setTimeout(() => { 
        fillEl.style.width = "100%"; 
        if (textEl) textEl.textContent = "¡Feria lista! Abriendo puertas...";
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
    onCountdownComplete: () => void,
    initialDelay: number = 50
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "countdown-overlay";
    container.appendChild(overlay);

    setTimeout(() => {
      // Reproducir pista de audio oficial de cuenta regresiva
      this.audio.playMenuCountdown();

      // Sincronización exacta con los picos acústicos de FL Studio
      const steps = [
        { text: "3", subtext: "¡PREPÁRATE!", soundStep: 3, delay: 1000 },
        { text: "2", subtext: "¡LISTOS!", soundStep: 2, delay: 1970 },
        { text: "1", subtext: "¡ATENTOS!", soundStep: 1, delay: 2920 },
        { text: "¡A JUGAR!", subtext: "¡BUENA SUERTE!", soundStep: 0, delay: 4050 }
      ];

      steps.forEach(({ text, subtext, soundStep, delay }) => {
        setTimeout(() => {
          overlay.innerHTML = `
            <div class="countdown-number">${text}</div>
            <div class="countdown-subtext">${subtext}</div>
          `;

          const bounds = container.getBoundingClientRect();
          if (soundStep > 0) {
            particles.emitBurst(bounds.width / 2, bounds.height * 0.45, "#FFD700", 20);
          } else {
            particles.emitBurst(bounds.width / 2, bounds.height * 0.45, "#00E5FF", 35);
            particles.emitConfetti(bounds.width, 40);
          }
        }, delay);
      });

      // Finalizar cuenta regresiva y comenzar tiempo de juego (4.9s)
      setTimeout(() => {
        overlay.style.transition = "opacity 0.25s ease-out";
        overlay.style.opacity = "0";

        setTimeout(() => {
          overlay.remove();
          onCountdownComplete();
        }, 250);
      }, 4900);
    }, initialDelay);
  }

  /**
   * 4. Transición Landing -> Kiosquito: Manos de Santa/Elfo Desgarrando el Gran Paquete de la Feria
   */
  public runHandsTearLandingTransition(
    container: HTMLElement,
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "gift-transition-overlay hands-mode";
    
    overlay.innerHTML = `
      <!-- Grieta Mágica de Rasgadura Central -->
      <div class="gift-tear-crack"></div>

      <!-- 4 Paneles de Papel de Regalo con Bordes Rasgados 3D -->
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

      <!-- Virutas de Papel Rasgado Volando en 3D -->
      <div class="gift-flying-scrap scrap-1"></div>
      <div class="gift-flying-scrap scrap-2"></div>
      <div class="gift-flying-scrap scrap-3"></div>
      <div class="gift-flying-scrap scrap-4"></div>
      <div class="gift-flying-scrap scrap-5"></div>
      <div class="gift-flying-scrap scrap-6"></div>

      <!-- Cintas de Satén Dorado 3D con Reflejo -->
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

      <div class="gift-shockwave-ring"></div>

      <!-- Gran Moño 3D y Emblema de la Feria Mágica -->
      <div class="gift-center-box" style="--seal-theme-color: #FFD700">
        <div class="gift-floating-particles">
          <span class="g-sparkle s1">✦</span>
          <span class="g-sparkle s2">★</span>
          <span class="g-sparkle s3">✦</span>
          <span class="g-sparkle s4">◆</span>
          <span class="g-sparkle s5">✦</span>
          <span class="g-sparkle s6">★</span>
        </div>

        <div class="gift-luxury-bow">
          <div class="gift-bow-tail tail-left"></div>
          <div class="gift-bow-tail tail-right"></div>
          <div class="gift-bow-loop loop-back-left"></div>
          <div class="gift-bow-loop loop-back-right"></div>
          <div class="gift-bow-loop loop-main-left"></div>
          <div class="gift-bow-loop loop-main-right"></div>

          <div class="gift-bow-center-knot">
            <div class="gift-knot-aura"></div>
            <img src="./assets/images/estrella con logo.png" alt="Feria Mágica" class="gift-bow-star" />
          </div>
        </div>

        <div class="gift-game-badge">
          <div class="gift-badge-corner tl"></div>
          <div class="gift-badge-corner tr"></div>
          <div class="gift-badge-corner bl"></div>
          <div class="gift-badge-corner br"></div>

          <div class="gift-icon-container">
            <div class="gift-icon-glow"></div>
            <span class="gift-game-icon">${getIconSvg("tent", { size: 36, color: "#FFD700" })}</span>
          </div>
          
          <h2 class="gift-game-title">FERIA MÁGICA</h2>
          
          <div class="gift-unwrapping-pill">
            <span class="gift-pill-dot"></span>
            <span class="gift-pill-text">¡ABRIENDO KIOSCO DE JUEGOS!</span>
            <span class="gift-pill-dot"></span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(overlay);
    this.audio.playWhoosh();

    requestAnimationFrame(() => {
      overlay.classList.add("is-wrapping");
    });

    setTimeout(() => {
      onMidpoint();

      setTimeout(() => {
        overlay.classList.add("is-hands-grabbing");

        setTimeout(() => {
          this.audio.playPaperTear();
          setTimeout(() => this.audio.playGiftUnwrap(), 160);

          const bounds = container.getBoundingClientRect();
          particles.emitBurst(bounds.width / 2, bounds.height * 0.45, "#FFD700", 45);
          particles.emitConfetti(bounds.width, 70);

          overlay.classList.remove("is-wrapping");
          overlay.classList.add("is-unwrapping");

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

  /**
   * 5. Transición Kiosco -> Minijuegos: ¡DESEMPAQUE EMOCIONADO DE UN NIÑO CAPA POR CAPA!
   * Enfoque en primer plano del paquete de regalo que es desgarrado con rapidez y euforia capa por capa.
   */
  public runExcitedKidGiftTransition(
    container: HTMLElement,
    gameData: { title: string; icon: string; themeColor?: string; subtitle?: string },
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "gift-transition-overlay kid-unboxing-mode";
    const subText = gameData.subtitle || "¡ABRIENDO JUGUETE MÁGICO!";
    
    overlay.innerHTML = `
      <!-- Capas de Papel de Regalo Navideño que se Desgarran una a una -->
      
      <!-- 1.1 Solapa de Fondo Inferior -->
      <div class="kid-paper-layer layer-bottom">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="kid-torn-fringe top"></div>
      </div>

      <!-- 1.2 Solapa Izquierda (Se desgasta y arruga a la izquierda) -->
      <div class="kid-paper-layer layer-left">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="kid-torn-fringe right"></div>
        <div class="kid-paper-crease c1"></div>
      </div>

      <!-- 1.3 Solapa Derecha (Se desgasta y arruga a la derecha) -->
      <div class="kid-paper-layer layer-right">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="kid-torn-fringe left"></div>
        <div class="kid-paper-crease c2"></div>
      </div>

      <!-- 1.4 Tira Central de Rasgado Rápido (Se arranca primero hacia arriba) -->
      <div class="kid-paper-layer layer-center-strip">
        <div class="gift-paper-texture"></div>
        <div class="gift-paper-damask"></div>
        <div class="kid-torn-fringe left"></div>
        <div class="kid-torn-fringe right"></div>
        <div class="kid-rip-tear-line"></div>
      </div>

      <!-- 1.5 Manitas Rápidas que Desgarran con Emoción -->
      <div class="kid-rapid-hand hand-left-rip">
        <div class="kid-glove-shape"></div>
      </div>
      <div class="kid-rapid-hand hand-right-rip">
        <div class="kid-glove-shape"></div>
      </div>

      <!-- Cintas de Satén que se parten y revientan con el primer tirón -->
      <div class="kid-ribbon kid-ribbon-h">
        <div class="gift-ribbon-stitch top"></div>
        <div class="gift-ribbon-glint"></div>
        <div class="gift-ribbon-stitch bottom"></div>
        <div class="kid-ribbon-snap-break"></div>
      </div>

      <div class="kid-ribbon kid-ribbon-v">
        <div class="gift-ribbon-stitch left"></div>
        <div class="gift-ribbon-glint-v"></div>
        <div class="gift-ribbon-stitch right"></div>
        <div class="kid-ribbon-snap-break"></div>
      </div>

      <!-- Retazos y Tiras de Papel Rasgado que Vuelan por los Aires -->
      <div class="kid-paper-shred shred-1"></div>
      <div class="kid-paper-shred shred-2"></div>
      <div class="kid-paper-shred shred-3"></div>
      <div class="kid-paper-shred shred-4"></div>
      <div class="kid-paper-shred shred-5"></div>
      <div class="kid-paper-shred shred-6"></div>
      <div class="kid-paper-shred shred-7"></div>
      <div class="kid-paper-shred shred-8"></div>
      <div class="kid-paper-shred shred-9"></div>
      <div class="kid-paper-shred shred-10"></div>

      <!-- Moño 3D y Placa con el Título del Minijuego -->
      <div class="gift-center-box kid-center-box" style="--seal-theme-color: ${gameData.themeColor || '#FFD700'}">
        <div class="gift-floating-particles">
          <span class="g-sparkle s1">✦</span>
          <span class="g-sparkle s2">★</span>
          <span class="g-sparkle s3">✦</span>
          <span class="g-sparkle s4">◆</span>
          <span class="g-sparkle s5">✦</span>
          <span class="g-sparkle s6">★</span>
        </div>

        <div class="gift-luxury-bow">
          <div class="gift-bow-tail tail-left"></div>
          <div class="gift-bow-tail tail-right"></div>
          <div class="gift-bow-loop loop-back-left"></div>
          <div class="gift-bow-loop loop-back-right"></div>
          <div class="gift-bow-loop loop-main-left"></div>
          <div class="gift-bow-loop loop-main-right"></div>

          <div class="gift-bow-center-knot">
            <div class="gift-knot-aura"></div>
            <img src="./assets/images/estrella con logo.png" alt="Feria Mágica" class="gift-bow-star" />
          </div>
        </div>

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
    this.audio.playWhoosh();

    // 1. Envolver el paquete (0 a 700ms)
    requestAnimationFrame(() => {
      overlay.classList.add("is-wrapping");
    });

    // 2. Punto medio: Pantalla 100% cubierta por el regalo completo
    setTimeout(() => {
      onMidpoint();

      setTimeout(() => {
        // 3. Comienza la secuencia de 3 desgarres sincronizados con el audio de FL Studio
        this.audio.playClawTear();

        const bounds = container.getBoundingClientRect();
        particles.emitBurst(bounds.width / 2, bounds.height * 0.45, gameData.themeColor || "#FFD700", 40);
        particles.emitConfetti(bounds.width, 60);

        // Desencadenar la animación progresiva capa por capa
        overlay.classList.remove("is-wrapping");
        overlay.classList.add("is-kid-unboxing");

        // 4. Finalización suave y limpia revelando el juego tras completarse los 3 rasgados (4.4s)
        setTimeout(() => {
          overlay.classList.add("is-finished");
          setTimeout(() => {
            overlay.remove();
            onComplete();
          }, 350);
        }, 4400);

      }, 100);

    }, 600);
  }

  /**
   * Alias de compatibilidad: redirige al desempaque rápido de niño para los juegos
   */
  public runGiftUnwrapTransition(
    container: HTMLElement,
    gameData: { title: string; icon: string; themeColor?: string; subtitle?: string },
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    this.runExcitedKidGiftTransition(container, gameData, particles, onMidpoint, onComplete);
  }

  /**
   * Alias para llamadas de zarpazo de garras si existen
   */
  public runClawSlashGameTransition(
    container: HTMLElement,
    gameData: { title: string; icon: string; themeColor?: string; subtitle?: string },
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    this.runExcitedKidGiftTransition(container, gameData, particles, onMidpoint, onComplete);
  }
}
