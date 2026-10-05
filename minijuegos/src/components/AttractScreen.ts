/**
 * ==============================================================================
 * COMPONENTE: PANTALLA DE ATRACCIÓN / SALVAPANTALLAS (AttractScreen)
 * ==============================================================================
 * 
 * Se muestra cuando nadie está jugando para llamar la atención del público
 * que pasa frente al tótem con animaciones brillantes y un gran botón interactivo.
 */

import { BRANDING } from "../config/branding";
import { KIOSK_CONFIG } from "../config/kiosk";

export class AttractScreen {
  private container: HTMLElement;
  public onStartClick?: () => void;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor: #${containerId}`);
    this.container = el;
    this.render();
    this.setupEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="attract-wrapper">
        <div class="attract-decorations">✨ 🎄 ⭐ 🎁 ❄️</div>
        
        <div class="attract-logo-box">
          <img src="${BRANDING.getLogoPath(1)}" alt="${BRANDING.fairName}" class="attract-logo pulse-anim" />
        </div>

        <h1 class="attract-title">${KIOSK_CONFIG.texts.attractTitle}</h1>
        <p class="attract-subtitle">${KIOSK_CONFIG.texts.attractSubtitle}</p>

        <div class="attract-button-wrapper">
          <button id="btn-attract-start" class="btn-play-big">
            <span class="btn-icon">🎅</span>
            <span class="btn-text">¡TOCA PARA JUGAR!</span>
            <span class="btn-sparkle">✨</span>
          </button>
        </div>

        <div class="attract-games-preview">
          <div class="preview-badge">🎁 4 Juegos Disponibles</div>
          <div class="preview-badge">🏆 Guarda tus Récords</div>
          <div class="preview-badge">⚡ Gana Premios de la Feria</div>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    const btn = this.container.querySelector("#btn-attract-start");
    btn?.addEventListener("click", () => {
      if (this.onStartClick) this.onStartClick();
    });

    // También responde a cualquier toque en la pantalla de atracción
    this.container.addEventListener("pointerdown", (e) => {
      // Si tocó el fondo también inicia
      if ((e.target as HTMLElement).id !== "btn-attract-start") {
        if (this.onStartClick) this.onStartClick();
      }
    });
  }

  public show(): void {
    this.container.style.display = "flex";
  }

  public hide(): void {
    this.container.style.display = "none";
  }
}
