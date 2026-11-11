/**
 * ==============================================================================
 * COMPONENTE: BARRA SUPERIOR DE KIOSCO (KioskHeader)
 * ==============================================================================
 * 
 * Barra fija en la parte superior con:
 * - Logo oficial de la Feria Mágica del Juguete centrado.
 * - Botón para volver al Menú Principal a la izquierda.
 */

import { AudioManager } from "../core/AudioManager";
import { BRANDING } from "../config/branding";
import { getIconSvg } from "../utils/icons";

export class KioskHeader {
  private container: HTMLElement;
  private audio: AudioManager;
  public onHomeClick?: () => void;

  constructor(containerId: string, audio: AudioManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor del encabezado: #${containerId}`);
    this.container = el;
    this.audio = audio;
    this.render();
    this.setupEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="kiosk-header-left">
        <button id="btn-home" class="kiosk-btn" title="Menú Principal">
          ${getIconSvg("grid", { size: 20 })}
          <span>Menú</span>
        </button>
      </div>

      <div class="kiosk-header-center">
        <img src="${BRANDING.getLogoPath(1)}" alt="${BRANDING.fairName}" class="header-logo" />
      </div>

      <div class="kiosk-header-right"></div>
    `;
  }

  private setupEvents(): void {
    const btnHome = this.container.querySelector("#btn-home");
    btnHome?.addEventListener("click", () => {
      this.audio.playTap();
      if (this.onHomeClick) this.onHomeClick();
    });
  }
}
