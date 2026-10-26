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
          <img src="./assets/images/estrella con logo.webp" alt="Feria Mágica del Juguete" class="intro-star-logo" />
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
          const isWord = text.length > 2;
          overlay.innerHTML = `
            <div class="countdown-number ${isWord ? "countdown-word" : ""}">${text}</div>
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
   * 4. Transición Landing -> Kiosquito: Apertura de Puertas del Gran Regalo Navideño 2D Stylized Art
   */
  public runHandsTearLandingTransition(
    container: HTMLElement,
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    overlay.className = "gift-transition-overlay fantasy-gift-mode";
    
    overlay.innerHTML = `
      <!-- Solapas Izquierda y Derecha de Arte Conceptual 2D -->
      <div class="fantasy-gift-flap flap-left"></div>
      <div class="fantasy-gift-flap flap-right"></div>
      <div class="fantasy-gift-seam-glow"></div>

      <!-- Partículas Mágicas Flotantes -->
      <div class="fantasy-gift-sparkles">
        <span class="f-sparkle s1">✦</span>
        <span class="f-sparkle s2">★</span>
        <span class="f-sparkle s3">✦</span>
        <span class="f-sparkle s4">★</span>
        <span class="f-sparkle s5">✦</span>
        <span class="f-sparkle s6">★</span>
      </div>

      <!-- Medallón Central Tallado en Oro y Fantasía -->
      <div class="fantasy-crest-badge" style="--seal-theme-color: #FFD700">
        <div class="fantasy-crest-glow"></div>
        <div class="fantasy-crest-icon-wrapper">
          <img src="./assets/images/estrella con logo.webp" alt="Feria Mágica" class="fantasy-crest-logo-img" />
        </div>
        <h2 class="fantasy-crest-title">FERIA MÁGICA</h2>
        <div class="fantasy-crest-pill">
          <span class="fantasy-pill-star">✦</span>
          <span>¡ABRIENDO KIOSCO DE JUEGOS!</span>
          <span class="fantasy-pill-star">✦</span>
        </div>
      </div>
    `;

    container.appendChild(overlay);
    this.audio.playWhoosh();

    requestAnimationFrame(() => {
      overlay.classList.add("is-wrapping");
    });

    // 1. A los 380ms: Pantalla 100% cubierta con el arte del regalo. Cambiar vista detrás
    setTimeout(() => {
      onMidpoint();

      // 2. A los 580ms: Desempaque mágico y apertura de puertas en 3D
      setTimeout(() => {
        this.audio.playGiftUnwrap();

        const bounds = container.getBoundingClientRect();
        particles.emitBurst(bounds.width / 2, bounds.height * 0.5, "#FFD700", 45);
        particles.emitConfetti(bounds.width, 65);

        overlay.classList.remove("is-wrapping");
        overlay.classList.add("is-unwrapping");

        // 3. A los 550ms tras abrirse: Remover overlay y finalizar
        setTimeout(() => {
          overlay.remove();
          onComplete();
        }, 550);

      }, 200);

    }, 380);
  }

  /**
   * 5. Transición Kiosco <-> Minijuegos: ¡DESEMPAQUE DE 3 RASGADOS SINCRONIZADOS A VELOCIDAD EXACTA!
   * Sincronizado milimétricamente con los 3 rasgados de audio (0.22s, 0.74s, 1.28s) a 1.85s de duración total.
   */
  public runExcitedKidGiftTransition(
    container: HTMLElement,
    gameData: { title: string; icon: string; themeColor?: string; subtitle?: string },
    particles: ParticleSystem,
    onMidpoint: () => void,
    onComplete: () => void
  ): void {
    const overlay = document.createElement("div");
    // Selección aleatoria entre 4 patrones dinámicos: Cruzado X, Transversal Zig-Zag, Corte en V y Doble Cuchillada
    const patternIndex = Math.floor(Math.random() * 4);
    overlay.className = `gift-transition-overlay kid-unboxing-mode cut-pattern-${patternIndex}`;
    const subText = gameData.subtitle || "¡ABRIENDO JUGUETE MÁGICO!";
    const themeColor = gameData.themeColor || "#FFD700";

    // Puntos de origen geométricos coherentes con los rayos de luz de cada patrón
    const cutSparkOrigins = [
      // Patrón 0: Cruzado en X & Centro
      [
        { x: 0.31, y: 0.50, color: "#FFD700" },
        { x: 0.71, y: 0.50, color: "#FF8F00" },
        { x: 0.50, y: 0.50, color: "#00E5FF" }
      ],
      // Patrón 1: Transversal Superior y Diagonal Inferior
      [
        { x: 0.50, y: 0.44, color: "#FFD700" },
        { x: 0.59, y: 0.72, color: "#FF3D00" },
        { x: 0.35, y: 0.75, color: "#00E5FF" }
      ],
      // Patrón 2: Corte en V Mágico
      [
        { x: 0.25, y: 0.425, color: "#FFD700" },
        { x: 0.75, y: 0.425, color: "#FFD700" },
        { x: 0.50, y: 0.85, color: "#00E5FF" }
      ],
      // Patrón 3: Cuchillada Asimétrica
      [
        { x: 0.25, y: 0.50, color: "#FFD700" },
        { x: 0.635, y: 0.50, color: "#FF8F00" },
        { x: 0.57, y: 0.75, color: "#00E5FF" }
      ]
    ];
    const currentOrigins = cutSparkOrigins[patternIndex] || cutSparkOrigins[0];

    overlay.innerHTML = `
      <!-- Capas de Papel de Regalo Navideño 2D que se Desgarran físicamente dejando ver la pantalla debajo -->
      
      <!-- 1. Capa / Solapa 1 (Paso 1: Se desgarra a los 0.22s y revela el 1er sector de la pantalla) -->
      <div class="kid-paper-layer layer-1 layer-left">
        <div class="kid-torn-fiber edge-right"></div>
        <div class="kid-paper-shadow edge-right"></div>
        <div class="kid-curl-corner corner-tr"></div>
        <div class="kid-curl-corner corner-br"></div>
      </div>

      <!-- 2. Capa / Solapa 2 (Paso 2: Se desgarra a los 0.74s y revela el 2do sector de la pantalla) -->
      <div class="kid-paper-layer layer-2 layer-right">
        <div class="kid-torn-fiber edge-left"></div>
        <div class="kid-paper-shadow edge-left"></div>
        <div class="kid-curl-corner corner-tl"></div>
        <div class="kid-curl-corner corner-bl"></div>
      </div>

      <!-- 3. Capa / Solapa 3 (Paso 3: Se arranca a los 1.28s y revela el resto de la pantalla) -->
      <div class="kid-paper-layer layer-3 layer-center-strip">
        <div class="kid-torn-fiber edge-left"></div>
        <div class="kid-torn-fiber edge-right"></div>
        <div class="kid-paper-shadow edge-left"></div>
        <div class="kid-paper-shadow edge-right"></div>
      </div>

      <!-- Rayos de Luz Cortante Sincronizados Coherentemente con la Línea de Corte -->
      <div class="kid-claw-cut cut-1">
        <div class="cut-blade-beam"></div>
        <div class="cut-burst-sparks"></div>
      </div>
      <div class="kid-claw-cut cut-2">
        <div class="cut-blade-beam"></div>
        <div class="cut-burst-sparks"></div>
      </div>
      <div class="kid-claw-cut cut-3">
        <div class="cut-blade-beam"></div>
        <div class="cut-burst-sparks"></div>
      </div>

      <!-- Cintas de Satén que se Parten -->
      <div class="kid-ribbon kid-ribbon-h">
        <div class="kid-ribbon-snap-break"></div>
      </div>
      <div class="kid-ribbon kid-ribbon-v">
        <div class="kid-ribbon-snap-break"></div>
      </div>

      <!-- Retazos de Papel Rasgado Volando en 3D -->
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

      <!-- Medallón Central Tallado en Oro y Fantasía -->
      <div class="fantasy-crest-badge" style="--seal-theme-color: ${themeColor}">
        <div class="fantasy-crest-glow"></div>
        <div class="fantasy-crest-icon-wrapper">
          ${gameData.icon}
        </div>
        <h2 class="fantasy-crest-title">${gameData.title}</h2>
        <div class="fantasy-crest-pill">
          <span class="fantasy-pill-star">✦</span>
          <span>${subText}</span>
          <span class="fantasy-pill-star">✦</span>
        </div>
      </div>
    `;

    container.appendChild(overlay);
    this.audio.playWhoosh();

    // 1. Envolver el paquete herméticamente
    requestAnimationFrame(() => {
      overlay.classList.add("is-wrapping");
    });

    // 2. A los 500ms: Pantalla 100% cubierta. Cambiar pantalla de fondo de forma limpia
    setTimeout(() => {
      onMidpoint();

      setTimeout(() => {
        // 3. Comienza la secuencia de 3 desgarres sincronizados con el audio de FL Studio
        this.audio.playClawTear();

        overlay.classList.remove("is-wrapping");
        overlay.classList.add("is-kid-unboxing");

        // Partículas en el primer corte sincronizadas con el rayo y el desgarre
        setTimeout(() => {
          const bounds = container.getBoundingClientRect();
          particles.emitBurst(bounds.width * currentOrigins[0].x, bounds.height * currentOrigins[0].y, currentOrigins[0].color, 24);
        }, 220);

        // Partículas en el segundo corte
        setTimeout(() => {
          const bounds = container.getBoundingClientRect();
          particles.emitBurst(bounds.width * currentOrigins[1].x, bounds.height * currentOrigins[1].y, currentOrigins[1].color, 24);
        }, 740);

        // Partículas y confeti en el corte de liberación final
        setTimeout(() => {
          const bounds = container.getBoundingClientRect();
          particles.emitBurst(bounds.width * currentOrigins[2].x, bounds.height * currentOrigins[2].y, currentOrigins[2].color, 36);
          particles.emitConfetti(bounds.width, 55);
        }, 1280);

        // 4. Finalización suave tras completarse los 3 rasgados de audio (1.85s exactos)
        setTimeout(() => {
          overlay.classList.add("is-finished");
          setTimeout(() => {
            overlay.remove();
            onComplete();
          }, 300);
        }, 1850);

      }, 100);

    }, 500);
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
