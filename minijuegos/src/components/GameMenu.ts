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

import { StorageManager } from "../core/StorageManager";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface GameMenuItem {
  id: string;
  title: string;
  imageSrc: string;
  themeClass: "theme-wood-red" | "theme-stone-blue" | "theme-forest-green" | "theme-magic-purple";
  category: string;
  tagline: string;
  gemColor: string;
}

export class GameMenu {
  private container: HTMLElement;
  private audio: AudioManager;
  public onSelectGame?: (gameId: string, cardElement: HTMLElement) => void;

  private gamesList: GameMenuItem[] = [
    {
      id: "toy-catch",
      title: "Atrapa-Regalos Mágico",
      imageSrc: "/assets/images/bolsa de regalos.png",
      themeClass: "theme-wood-red",
      category: "Acción & Reflejos",
      tagline: "¡Atrapa juguetes con el saco de Santa!",
      gemColor: "#FF2A4D"
    },
    {
      id: "sleigh-rush",
      title: "Dispara-Regalos",
      imageSrc: "/assets/images/elfo-planeador.png",
      themeClass: "theme-stone-blue",
      category: "Puntería & Vuelo",
      tagline: "¡Vuela en ala delta y encesta en chimeneas!",
      gemColor: "#00E5FF"
    },
    {
      id: "tree-melody",
      title: "Enciende el Árbol",
      imageSrc: "/assets/images/arbol.png",
      themeClass: "theme-forest-green",
      category: "Memoria Musical",
      tagline: "¡Repite la melodía de campanas mágicas!",
      gemColor: "#00E676"
    },
    {
      id: "magic-pairs",
      title: "Parejas de Juguetes",
      imageSrc: "/assets/images/estrella con logo.png",
      themeClass: "theme-magic-purple",
      category: "Ingenio & Rapidez",
      tagline: "¡Encuentra las parejas de cartas mágicas!",
      gemColor: "#D500F9"
    }
  ];

  constructor(containerId: string, audio: AudioManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor del menú: #${containerId}`);
    this.container = el;
    this.audio = audio;
  }

  public render(): void {
    this.container.innerHTML = `
      <!-- Decoración Superior de Fantasía Navideña -->
      <div class="menu-header">
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
          .map((g, index) => {
            const record = StorageManager.getHighScore(g.id);
            const animDelay = index * 70; // Escalado 0ms, 70ms, 140ms, 210ms
            return `
            <div 
              class="game-card-fantasy ${g.themeClass}" 
              data-game-id="${g.id}"
              style="animation-delay: ${animDelay}ms;"
            >
              <!-- Esquinas ornamentadas con gemas y acebo -->
              <div class="corner-ornament top-left" style="--gem-color: ${g.gemColor};"></div>
              <div class="corner-ornament top-right" style="--gem-color: ${g.gemColor};"></div>
              <div class="corner-ornament bottom-left" style="--gem-color: ${g.gemColor};"></div>
              <div class="corner-ornament bottom-right" style="--gem-color: ${g.gemColor};"></div>

              <!-- Reflejo mágico que recorre la tarjeta periódicamente -->
              <div class="card-shine-sweep"></div>

              <!-- Contenido Interior de la Tarjeta -->
              <div class="card-inner-body">
                <!-- Miniatura Ilustrada Central -->
                <div class="card-art-box">
                  <img src="${g.imageSrc}" alt="${g.title}" class="card-art-image" />
                  <div class="art-glow-halo"></div>
                </div>

                <!-- Título con volumen y sombra -->
                <h3 class="card-fantasy-title">${g.title}</h3>

                <!-- Cinta de Categoría (Pergamino) -->
                <div class="card-ribbon-category">
                  <span>${g.category}</span>
                </div>

                <!-- Descripción / Tagline -->
                <p class="card-fantasy-tagline">${g.tagline}</p>

                <!-- Placa de Madera para el Récord -->
                <div class="card-record-plaque">
                  <div class="plaque-trophy">${getIconSvg("trophy", { size: 18, color: "#FFE082", fill: "#FFD700" })}</div>
                  <span class="plaque-label">Récord: <strong class="plaque-value">${record}</strong> pts</span>
                </div>

                <!-- Botón Físico Dorado de Fantasía -->
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

  private lastShowTime: number = 0;

  private setupEvents(): void {
    const cards = this.container.querySelectorAll<HTMLElement>(".game-card-fantasy");
    cards.forEach((card) => {
      // Evento de toque y selección de tarjeta
      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Evitar doble pulsación accidental durante la apertura
        if (Date.now() - this.lastShowTime < 350) {
          return;
        }

        const gameId = card.getAttribute("data-game-id");
        if (gameId && this.onSelectGame) {
          this.audio.playTap();
          this.onSelectGame(gameId, card);
        }
      });

      // Feedback háptico/táctil en 'pointerdown'
      card.addEventListener("pointerdown", () => {
        card.classList.add("is-pressed");
      });

      const clearPressed = () => card.classList.remove("is-pressed");
      card.addEventListener("pointerup", clearPressed);
      card.addEventListener("pointercancel", clearPressed);
      card.addEventListener("pointerleave", clearPressed);
    });
  }

  public show(): void {
    this.lastShowTime = Date.now();
    this.render(); // Re-renderiza para actualizar récords
    this.container.style.display = "flex";
    this.container.classList.remove("menu-exit-anim");
    this.container.classList.add("menu-enter-anim");
  }

  public hide(): void {
    this.container.style.display = "none";
    this.container.classList.remove("menu-enter-anim");
  }
}
