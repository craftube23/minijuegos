/**
 * ==============================================================================
 * COMPONENTE: MENÚ SELECTOR DE MINIJUEGOS (GameMenu)
 * ==============================================================================
 * 
 * Cuadrícula de 4 tarjetas táctiles gigantes con ilustraciones festivas,
 * récord actual de cada minijuego y botón directo de inicio.
 */

import { StorageManager } from "../core/StorageManager";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface GameMenuItem {
  id: string;
  title: string;
  iconName: string;
  category: string;
  tagline: string;
  colorGrad: string;
}

export class GameMenu {
  private container: HTMLElement;
  private audio: AudioManager;
  public onSelectGame?: (gameId: string) => void;

  private gamesList: GameMenuItem[] = [
    {
      id: "toy-catch",
      title: "Atrapa-Regalos Mágico",
      iconName: "gift",
      category: "Acción & Reflejos",
      tagline: "¡Atrapa juguetes con el saco de Santa!",
      colorGrad: "linear-gradient(145deg, #A91D22 0%, #D32F2F 50%, #C0392B 100%)"
    },
    {
      id: "sleigh-rush",
      title: "Dispara-Regalos",
      iconName: "gift",
      category: "Puntería & Vuelo",
      tagline: "¡Vuela en ala delta y encesta en chimeneas!",
      colorGrad: "linear-gradient(145deg, #0D47A1 0%, #1976D2 50%, #2980B9 100%)"
    },
    {
      id: "tree-melody",
      title: "Enciende el Árbol",
      iconName: "music",
      category: "Memoria Musical",
      tagline: "¡Repite la melodía de campanas mágicas!",
      colorGrad: "linear-gradient(145deg, #1B5E20 0%, #2E7D32 50%, #27AE60 100%)"
    },
    {
      id: "magic-pairs",
      title: "Parejas de Juguetes",
      iconName: "layers",
      category: "Ingenio & Rapidez",
      tagline: "¡Encuentra las parejas de cartas mágicas!",
      colorGrad: "linear-gradient(145deg, #4A148C 0%, #7B1FA2 50%, #8E44AD 100%)"
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
      <div class="menu-header">
        <h2 class="menu-title">
          ${getIconSvg("sparkles", { size: 24, color: "var(--color-gold)" })}
          SELECCIONA UN JUEGO DE LA FERIA
          ${getIconSvg("sparkles", { size: 24, color: "var(--color-gold)" })}
        </h2>
        <p class="menu-subtitle">Partidas rápidas y divertidas de 45 segundos</p>
      </div>

      <div class="menu-grid">
        ${this.gamesList
          .map((g) => {
            const record = StorageManager.getHighScore(g.id);
            return `
            <div class="game-card" data-game-id="${g.id}" style="background: ${g.colorGrad}">
              <div class="game-card-icon">
                ${getIconSvg(g.iconName, { size: 48, color: "#ffffff", fill: "rgba(255,255,255,0.2)" })}
              </div>
              <div class="game-card-info">
                <span class="game-card-category">${g.category}</span>
                <h3 class="game-card-title">${g.title}</h3>
                <p class="game-card-tagline">${g.tagline}</p>
                <div class="game-card-record">
                  ${getIconSvg("trophy", { size: 16, color: "var(--color-gold)", fill: "var(--color-gold)" })}
                  <span>Récord: <strong>${record}</strong> pts</span>
                </div>
              </div>
              <button class="btn-card-play">
                <span>¡JUGAR!</span>
                ${getIconSvg("play", { size: 18, fill: "#ffffff", color: "#ffffff" })}
              </button>
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
    const cards = this.container.querySelectorAll(".game-card");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Evitar que el mismo toque que abrió el menú presione una tarjeta por error
        if (Date.now() - this.lastShowTime < 350) {
          return;
        }

        const gameId = card.getAttribute("data-game-id");
        if (gameId && this.onSelectGame) {
          this.audio.playTap();
          this.onSelectGame(gameId);
        }
      });
    });
  }

  public show(): void {
    this.lastShowTime = Date.now();
    this.render(); // Re-render para actualizar récords
    this.container.style.display = "flex";
  }

  public hide(): void {
    this.container.style.display = "none";
  }
}
