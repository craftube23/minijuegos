/**
 * ==============================================================================
 * COMPONENTE: PANTALLA DE RESULTADOS / FIN DE PARTIDA (GameOverModal)
 * ==============================================================================
 * 
 * Muestra el resumen de la partida con:
 * - Puntuación obtenida.
 * - Indicador especial si se rompió el récord del evento.
 * - Branding de la Feria Mágica del Juguete (Logo 2).
 * - Botones grandes para jugar revancha o volver al menú.
 */

import type { GameResult } from "../core/BaseGame";
import { BRANDING } from "../config/branding";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export class GameOverModal {
  private container: HTMLElement;
  private audio: AudioManager;
  public onPlayAgain?: () => void;
  public onBackToMenu?: () => void;

  constructor(containerId: string, audio: AudioManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor de resultados: #${containerId}`);
    this.container = el;
    this.audio = audio;
  }

  public show(result: GameResult): void {
    const isRecord = result.isNewRecord;
    const modalTitle = isRecord ? "¡INCREÍBLE! ¡NUEVO RÉCORD!" : "¡BUEN INTENTO!";
    const modalSubtitle = isRecord
      ? "¡Hiciste una partida legendaria en la Feria Mágica!"
      : "¡Estuviste muy cerca! Vuelve a intentarlo para superar la puntuación.";

    this.container.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-trophy">
            ${isRecord 
              ? getIconSvg("trophy", { size: 56, color: "var(--color-gold)", fill: "var(--color-gold)" })
              : getIconSvg("sparkles", { size: 56, color: "var(--color-gold)" })}
          </div>
          <h2 class="modal-title">${modalTitle}</h2>
          <p class="modal-game-name">${modalSubtitle}</p>
        </div>

        <div class="modal-scores">
          <div class="score-box main-score">
            <span class="score-label">TU PUNTUACIÓN</span>
            <span class="score-value">${result.score}</span>
          </div>

          <div class="score-box record-score">
            <span class="score-label">RÉCORD ACTUAL</span>
            <span class="score-value">${result.highScore}</span>
          </div>
        </div>

        <!-- Integración del Logo de la Feria en la pantalla de resultados -->
        <div class="modal-branding">
          <img src="${BRANDING.getLogoPath(2)}" alt="${BRANDING.fairName}" class="modal-logo" />
          <p class="modal-promo-text">¡Sigue jugando y diviértete en la Feria Mágica del Juguete!</p>
        </div>

        <div class="modal-actions">
          <button id="btn-modal-again" class="btn-action btn-again">
            ${getIconSvg("replay", { size: 22, color: "#ffffff" })}
            <span>¡VOLVER A INTENTAR!</span>
          </button>
          <button id="btn-modal-menu" class="btn-action btn-menu">
            ${getIconSvg("grid", { size: 22, color: "#ffffff" })}
            <span>OTROS JUEGOS</span>
          </button>
        </div>
      </div>
    `;

    this.container.style.display = "flex";
    this.setupEvents();
  }

  private setupEvents(): void {
    const btnAgain = this.container.querySelector("#btn-modal-again");
    const btnMenu = this.container.querySelector("#btn-modal-menu");

    btnAgain?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onPlayAgain) this.onPlayAgain();
    });

    btnMenu?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onBackToMenu) this.onBackToMenu();
    });
  }

  public hide(): void {
    this.container.style.display = "none";
    this.container.innerHTML = "";
  }
}
