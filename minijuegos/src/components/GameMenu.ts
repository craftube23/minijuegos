/**
 * ==============================================================================
 * COMPONENTE: MENÚ SELECTOR DE MINIJUEGOS (GameMenu - Edición Videojuego 2D)
 * ==============================================================================
 * 
 * Interfaz estilizada de videojuego 2D de fantasía navideña:
 * - 4 Tarjetas maestras con marcos ornamentados (Madera, Piedra, Gemas y Acebo).
 * - Miniaturas ilustradas volumétricas representativas de cada minijuego.
 * - Cintas de pergamino/madera para categorías y placas para récords.
 * - Botones arcade dorados con relieve 3D, brillo y respuesta física.
 * - Entrada escalonada (Staggered entrance: 0ms, 70ms, 140ms, 210ms).
 */

import gsap from "gsap";
import { StorageManager } from "../core/StorageManager";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface GameMenuItem {
  id: string;
  title: string;
  imageSrc: string;
  frameImageSrc: string;
  themeClass: "theme-wood-red" | "theme-stone-blue" | "theme-forest-green" | "theme-magic-purple";
  category: string;
  tagline: string;
  gemColor: string;
}

export class GameMenu {
  private container: HTMLElement;
  private audio: AudioManager;
  public onSelectGame?: (gameId: string, cardElement: HTMLElement) => void;
  public onBackToLanding?: () => void;
  private lastShowTime: number = 0;
  private entranceTl: gsap.core.Timeline | null = null;

  private gamesList: GameMenuItem[] = [
    {
      id: "toy-catch",
      title: "Atrapa-Regalos Mágico",
      imageSrc: "./assets/images/targetas/bolsa-de-regalos-clean.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "ACCIÓN & REFLEJOS",
      tagline: "¡Atrapa juguetes con el saco de Santa!",
      gemColor: "#FF2A4D"
    },
    {
      id: "bell-symphony",
      title: "Sinfonía de Campanas",
      imageSrc: "./assets/images/icon-campanas.png",
      frameImageSrc: "./assets/images/marco-juego-azul.png",
      themeClass: "theme-stone-blue",
      category: "RITMO & MÚSICA",
      tagline: "¡Toca las campanas al ritmo navideño!",
      gemColor: "#00E5FF"
    },
    {
      id: "tree-melody",
      title: "Tambores del Cascanueces",
      imageSrc: "./assets/images/icon-tambores.png",
      frameImageSrc: "./assets/images/marco-juego-verde.png",
      themeClass: "theme-forest-green",
      category: "TAIKO & RITMO",
      tagline: "¡Sigue el ritmo del elfo en los tambores mágicos!",
      gemColor: "#FFB300"
    },
    {
      id: "flying-elf",
      title: "El Vuelo Mágico del Elfo",
      imageSrc: "./assets/images/icon-elfo-volador.png",
      frameImageSrc: "./assets/images/marco-juego-azul.png",
      themeClass: "theme-stone-blue",
      category: "ARCADE & VUELO",
      tagline: "¡Vuela con el elfo y entrega los regalos!",
      gemColor: "#00E5FF"
    },
    {
      id: "magic-pairs",
      title: "Parejas de Juguetes",
      imageSrc: "./assets/images/targetas/icon cartas.png",
      frameImageSrc: "./assets/images/marco-juego-morado.png",
      themeClass: "theme-magic-purple",
      category: "INGENIO & MEMORIA",
      tagline: "¡Encuentra las parejas de cartas mágicas!",
      gemColor: "#D500F9"
    },
    {
      id: "santa-hills",
      title: "El Descenso de Santa",
      imageSrc: "./assets/images/icon-santa-colinas.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "CARRERA & COLINAS",
      tagline: "¡Deslízate por las colinas y rescata los regalos!",
      gemColor: "#FF2A4D"
    },
    {
      id: "snowball-target",
      title: "Tiro al Blanco Navideño",
      imageSrc: "./assets/images/icon-tiro-al-blanco.png",
      frameImageSrc: "./assets/images/marco-juego-verde.png",
      themeClass: "theme-forest-green",
      category: "PUNTERÍA & ARCADE",
      tagline: "¡Apunta con bolas de nieve a las dianas y regalos!",
      gemColor: "#00E676"
    },
    {
      id: "workshop-chaos",
      title: "¡El Caos del Taller Mágico!",
      imageSrc: "./assets/images/icon-caos-taller.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "REFLEJOS & ACCIÓN",
      tagline: "¡Salva los juguetes que salen disparados de la máquina!",
      gemColor: "#FF9100"
    },
    {
      id: "christmas-jump",
      title: "¡Salto Mágico Navideño!",
      imageSrc: "./assets/images/icon-salto-magico.png",
      frameImageSrc: "./assets/images/marco-juego-azul.png",
      themeClass: "theme-stone-blue",
      category: "ARCADE & SALTO",
      tagline: "¡Salta sobre plataformas nevadas y vuela con cohetes!",
      gemColor: "#00E5FF"
    },
    {
      id: "gift-tower",
      title: "¡Torre de Regalos Mágica!",
      imageSrc: "./assets/images/icon-torre-regalos.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "EQUILIBRIO & APILADO",
      tagline: "¡Apila los regalos con la grúa mágica y crea la torre más alta!",
      gemColor: "#FFD700"
    },
    {
      id: "polar-express",
      title: "¡El Expreso Polar Mágico!",
      imageSrc: "./assets/images/icon-expreso-polar.png",
      frameImageSrc: "./assets/images/marco-juego-verde.png",
      themeClass: "theme-forest-green",
      category: "CARRERA & REFLEJOS",
      tagline: "¡Cambia de vía, recoge regalos y esquiva obstáculos!",
      gemColor: "#00E676"
    },
    {
      id: "ice-breaker",
      title: "¡Rompe-Hielos Mágico!",
      imageSrc: "./assets/images/icon-rompe-hielos.png",
      frameImageSrc: "./assets/images/marco-juego-morado.png",
      themeClass: "theme-magic-purple",
      category: "ARCADE & BLOQUES",
      tagline: "¡Rebota la esfera dorada y rompe los bloques de cristal!",
      gemColor: "#D500F9"
    },
    {
      id: "ornament-pop",
      title: "¡Ninja Corta-Regalos!",
      imageSrc: "./assets/images/icon-ninja-regalos.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "ACCIÓN & CORTES",
      tagline: "¡Rebana al vuelo piñatas, dulces y regalos en dos mitades!",
      gemColor: "#FF2A4D"
    },
    {
      id: "toy-match",
      title: "¡Juguetería Mágica!",
      imageSrc: "./assets/images/icon-jugueteria-magica.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "PUZZLE & COMBOS",
      tagline: "¡Intercambia juguetes y une 3 o más en la vitrina!",
      gemColor: "#FFD700"
    },
    {
      id: "santa-ski",
      title: "¡Esquí Alpino de Santa!",
      imageSrc: "./assets/images/icon-esqui-alpino.png",
      frameImageSrc: "./assets/images/marco-juego-azul.png",
      themeClass: "theme-stone-blue",
      category: "VELOCIDAD & DESTREZA",
      tagline: "¡Desciende por las pistas alpinas, cruza eslalons y salta en rampas!",
      gemColor: "#00E5FF"
    },
    {
      id: "snow-battle",
      title: "¡Batalla de Nieve!",
      imageSrc: "./assets/images/snow-battle-portada.png",
      frameImageSrc: "./assets/images/marco-juego-rojo.png",
      themeClass: "theme-wood-red",
      category: "ACCIÓN & PUNTERÍA",
      tagline: "¡Guía a Rodolfo con el joystick y defiende la plaza a bolazos de nieve!",
      gemColor: "#FF2A4D"
    }
  ];

  constructor(containerId: string, audio: AudioManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor del menú: #${containerId}`);
    this.container = el;
    this.audio = audio;
  }

  public render(): void {
    this.killAnimations();

    this.container.innerHTML = `
      <!-- Decoración Superior de Fantasía Navideña -->
      <div class="menu-header">
        <div class="menu-top-actions">
          <button id="btn-back-to-landing" class="btn-fantasy-back-landing" title="Regresar al inicio de la Feria">
            <span class="btn-icon">${getIconSvg("tent", { size: 20, color: "#FFD700" })}</span>
            <span class="btn-text">VOLVER A LA FERIA</span>
          </button>
        </div>

        <div class="menu-ribbon-top">
          <span class="ribbon-flourish">❧</span>
          <span class="ribbon-text">Partidas rápidas y divertidas de 45 segundos</span>
          <span class="ribbon-flourish">☙</span>
        </div>
        <h2 class="menu-title">
          ${getIconSvg("sparkles", { size: 26, color: "var(--color-gold)" })}
          SELECCIONA UN JUEGO DE LA FERIA
          ${getIconSvg("sparkles", { size: 26, color: "var(--color-gold)" })}
        </h2>
      </div>


      <!-- Cuadrícula 2D Fantasy Game UI -->
      <div class="menu-grid" id="menu-grid-cards">
        ${this.gamesList
          .map((g) => {
            const record = StorageManager.getHighScore(g.id);
            return `
            <div 
              class="game-card-fantasy ${g.themeClass}" 
              data-game-id="${g.id}"
            >
              <!-- Marco Físico Ilustrado HD -->
              <img src="${g.frameImageSrc}" alt="Marco ${g.title}" class="card-fantasy-frame-bg" />

              <!-- Reflejo mágico que recorre la tarjeta periódicamente -->
              <div class="card-shine-sweep"></div>

              <!-- Contenido Interior de la Tarjeta -->
              <div class="card-inner-body">
                <!-- Miniatura Ilustrada Superior (Saco de Santa / Personaje) -->
                <div class="card-art-box">
                  <img src="${g.imageSrc}" alt="${g.title}" class="card-art-image" />
                  <div class="art-glow-halo"></div>
                </div>

                <!-- Título con volumen 3D y sombra gruesa -->
                <h3 class="card-fantasy-title">${g.title}</h3>

                <!-- Cinta de Categoría (Pergamino Medieval) -->
                <div class="card-ribbon-category">
                  <span>${g.category}</span>
                </div>

                <!-- Tagline Descriptivo -->
                <p class="card-fantasy-tagline">${g.tagline}</p>

                <!-- Placa de Madera Rústica para el Récord -->
                <div class="card-record-plaque">
                  <span class="plaque-trophy">${getIconSvg("trophy", { size: 18, color: "#FFD700" })}</span>
                  <span class="plaque-label">Récord: <strong class="plaque-value">${record}</strong> pts</span>
                </div>

                <!-- Botón Físico Dorado (Integrado a la placa dorada del marco) -->
                <button class="btn-fantasy-play" aria-label="Jugar ${g.title}">
                  <span class="btn-play-label">¡JUGAR!</span>
                  <span class="btn-play-arrow">▶</span>
                </button>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;

    this.setupEvents();
  }

  private setupEvents(): void {
    const btnBackLanding = this.container.querySelector<HTMLElement>("#btn-back-to-landing");
    if (btnBackLanding) {
      btnBackLanding.addEventListener("pointerdown", () => {
        gsap.to(btnBackLanding, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      const restoreBackBtn = () => {
        gsap.to(btnBackLanding, {
          scale: 1,
          duration: 0.16,
          ease: "back.out(1.5)",
          clearProps: "transform",
          overwrite: "auto"
        });
      };

      btnBackLanding.addEventListener("pointerup", restoreBackBtn);
      btnBackLanding.addEventListener("pointerleave", restoreBackBtn);
      btnBackLanding.addEventListener("pointercancel", restoreBackBtn);

      btnBackLanding.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.playTap();
        if (this.onBackToLanding) {
          this.onBackToLanding();
        }
      });
    }

    const cards = this.container.querySelectorAll<HTMLElement>(".game-card-fantasy");
    cards.forEach((card) => {
      let startX = 0;
      let startY = 0;
      let isDragging = false;

      const clearPressed = () => {
        card.classList.remove("is-pressed");
        gsap.to(card, {
          scale: 1,
          y: 0,
          duration: 0.18,
          ease: "back.out(1.5)",
          clearProps: "transform",
          overwrite: "auto"
        });
      };

      // Feedback háptico/táctil en 'pointerdown' coordinado con GSAP
      card.addEventListener("pointerdown", (e: PointerEvent) => {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;

        card.classList.add("is-pressed");
        gsap.to(card, {
          scale: 0.96,
          y: 2,
          duration: 0.1,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      card.addEventListener("pointermove", (e: PointerEvent) => {
        if (!isDragging) {
          const dx = Math.abs(e.clientX - startX);
          const dy = Math.abs(e.clientY - startY);
          if (dx > 14 || dy > 14) {
            isDragging = true;
            clearPressed();
          }
        }
      });

      card.addEventListener("pointerup", clearPressed);
      card.addEventListener("pointercancel", clearPressed);
      card.addEventListener("pointerleave", clearPressed);

      // Evento de toque y selección de tarjeta (solo si no fue arrastre de scroll)
      card.addEventListener("click", (e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        // Evitar doble pulsación fantasma en el mismo frame de apertura
        if (Date.now() - this.lastShowTime < 60) {
          return;
        }

        const gameId = card.getAttribute("data-game-id");
        if (gameId && this.onSelectGame) {
          this.audio.playTap();
          this.onSelectGame(gameId, card);
        }
      });
    });
  }

  private playEntranceAnimation(): void {
    this.killAnimations();

    const headerItems = Array.from(
      this.container.querySelectorAll<HTMLElement>(
        "#btn-back-to-landing, .menu-ribbon-top, .menu-title"
      )
    );
    const cards = Array.from(this.container.querySelectorAll<HTMLElement>(".game-card-fantasy"));
    const artImages = Array.from(this.container.querySelectorAll<HTMLElement>(".card-art-image"));

    const allTargets = [...headerItems, ...cards, ...artImages];
    if (allTargets.length === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(allTargets, { autoAlpha: 1, clearProps: "transform" });
      return;
    }

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" }
    });
    this.entranceTl = tl;

    if (headerItems.length > 0) {
      tl.fromTo(
        headerItems,
        { autoAlpha: 0, y: -14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.34,
          stagger: 0.045,
          ease: "power2.out",
          clearProps: "transform"
        }
      );
    }

    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { autoAlpha: 0, y: 24, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.38,
          stagger: 0.045,
          ease: "back.out(1.25)",
          clearProps: "transform"
        },
        "-=0.2"
      );
    }

    if (artImages.length > 0) {
      tl.fromTo(
        artImages,
        { scale: 0.88 },
        {
          scale: 1,
          duration: 0.4,
          stagger: 0.045,
          ease: "back.out(1.5)",
          clearProps: "transform"
        },
        "<0.04"
      );
    }
  }

  public killAnimations(): void {
    if (this.entranceTl) {
      this.entranceTl.kill();
      this.entranceTl = null;
    }

    const targets = this.container.querySelectorAll<HTMLElement>(
      "#btn-back-to-landing, .menu-ribbon-top, .menu-title, .game-card-fantasy, .card-art-image"
    );
    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
  }

  public show(): void {
    this.lastShowTime = Date.now();
    this.render(); // Re-renderiza para actualizar récords
    this.container.style.display = "flex";
    this.container.classList.remove("menu-exit-anim");
    this.container.classList.add("menu-enter-anim");
    this.playEntranceAnimation();
  }

  public hide(): void {
    this.killAnimations();
    this.container.style.display = "none";
    this.container.classList.remove("menu-enter-anim");
  }
}
