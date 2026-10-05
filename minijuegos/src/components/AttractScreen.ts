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
import { getIconSvg } from "../utils/icons";

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
        <div class="attract-logo-box">
          <img src="${BRANDING.getLogoPath(1)}" alt="${BRANDING.fairName}" class="attract-logo pulse-anim" />
        </div>

        <h1 class="attract-title">${KIOSK_CONFIG.texts.attractTitle}</h1>
        <p class="attract-subtitle">Toca la pantalla para comenzar a jugar</p>

        <div class="attract-button-wrapper">
          <button id="btn-attract-start" class="btn-play-big">
            <span class="btn-icon">${getIconSvg("play", { size: 32, fill: "#ffffff", color: "#ffffff" })}</span>
            <span class="btn-text">¡TOCA PARA JUGAR!</span>
            <span class="btn-sparkle">${getIconSvg("sparkles", { size: 28, color: "var(--color-gold)" })}</span>
          </button>
        </div>

        <div class="attract-games-preview">
          <div class="preview-badge">${getIconSvg("gift", { size: 18, color: "var(--color-gold)" })} 4 Juegos Disponibles</div>
          <div class="preview-badge">${getIconSvg("trophy", { size: 18, color: "var(--color-gold)" })} Guarda tus Récords</div>
          <div class="preview-badge">${getIconSvg("sparkles", { size: 18, color: "var(--color-gold)" })} Gana Premios de la Feria</div>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    const btn = this.container.querySelector("#btn-attract-start");
    
    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onStartClick) this.onStartClick();
    });

    // También responde si toca el fondo de la pantalla de atracción
    this.container.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id !== "btn-attract-start" && !(e.target as HTMLElement).closest("#btn-attract-start")) {
        e.preventDefault();
        e.stopPropagation();
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
