/**
 * ==============================================================================
 * COMPONENTE: BARRA SUPERIOR DE KIOSCO (KioskHeader)
 * ==============================================================================
 * 
 * Barra fija en la parte superior con:
 * - Logo oficial de la Feria Mágica del Juguete.
 * - Botón de Sonido (Activar / Silenciar).
 * - Botón de Pantalla Completa (Modo Kiosco).
 * - Botón para volver al Menú Principal.
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
    const isMuted = this.audio.getIsMuted();
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

      <div class="kiosk-header-right">
        <button id="btn-audio" class="kiosk-btn" title="Sonido">
          <span id="audio-icon">${getIconSvg(isMuted ? "volumeOff" : "volumeOn", { size: 22 })}</span>
        </button>
        <button id="btn-fullscreen" class="kiosk-btn" title="Pantalla Completa">
          <span>${getIconSvg("sparkles", { size: 20 })}</span>
        </button>
      </div>
    `;
  }

  private setupEvents(): void {
    const btnHome = this.container.querySelector("#btn-home");
    const btnAudio = this.container.querySelector("#btn-audio");
    const btnFullscreen = this.container.querySelector("#btn-fullscreen");
    const audioIcon = this.container.querySelector("#audio-icon");

    btnHome?.addEventListener("click", () => {
      this.audio.playTap();
      if (this.onHomeClick) this.onHomeClick();
    });

    btnAudio?.addEventListener("click", () => {
      const muted = this.audio.toggleMute();
      if (audioIcon) {
        audioIcon.innerHTML = getIconSvg(muted ? "volumeOff" : "volumeOn", { size: 22 });
      }
      if (!muted) {
        this.audio.playTap();
      }
    });

    btnFullscreen?.addEventListener("click", () => {
      this.audio.playTap();
      this.toggleFullscreen();
    });
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}
