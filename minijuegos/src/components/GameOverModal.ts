/**
 * ==============================================================================
 * COMPONENTE: PANTALLA DE RESULTADOS / FIN DE PARTIDA (GameOverModal)
 * ==============================================================================
 * 
 * Muestra el resumen de la partida con:
 * - Puntuación obtenida y combo/récord.
 * - Soporte avanzado para el Modo Grabador/Editor de Sinfonía de Campanas
 *   (Seguir editando, Rejugar partitura personalizada, Copiar código TypeScript).
 * - Botones grandes para jugar revancha o volver al menú.
 */

import type { GameResult } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export class GameOverModal {
  private container: HTMLElement;
  private audio: AudioManager;
  public onPlayAgain?: () => void;
  public onBackToMenu?: () => void;
  public onEditAgain?: (songFile?: string, customNotes?: any[]) => void;

  constructor(containerId: string, audio: AudioManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor de resultados: #${containerId}`);
    this.container = el;
    this.audio = audio;
  }

  public show(result: GameResult): void {
    const isRecord = result.isNewRecord;
    const isRhythmGame = result.gameId === "bell-symphony";
    const isCustom = !!result.isCustomChart;

    const modalTitle = isRecord
      ? "¡INCREÍBLE! ¡NUEVO RÉCORD!"
      : isCustom
      ? "🎉 ¡PARTITURA COMPLETADA!"
      : "¡BUEN INTENTO!";

    const modalSubtitle = isRecord
      ? "¡Hiciste una partida legendaria en la Feria Mágica!"
      : isCustom
      ? "¡Has probado tu propia canción grabada con éxito!"
      : "¡Estuviste muy cerca! Vuelve a intentarlo para superar la puntuación.";

    this.container.innerHTML = `
      <div class="modal-card ${isRhythmGame ? "modal-card-rhythm" : ""}">
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

        <!-- Mensaje Promocional -->
        <div class="modal-branding">
          <p class="modal-promo-text">${
            isCustom
              ? "⭐ ¿Deseas seguir ajustando el ritmo o guardar tus notas?"
              : "¡Sigue jugando y diviértete en la Feria Mágica del Juguete!"
          }</p>
        </div>

        <!-- ACCIONES / BOTONES -->
        <div class="modal-actions ${isRhythmGame ? "modal-actions-rhythm" : ""}">
          <button id="btn-modal-again" class="btn-action btn-again" title="Jugar otra vez">
            ${getIconSvg("replay", { size: 22, color: "#ffffff" })}
            <span>${isCustom ? "JUGAR DE NUEVO" : "¡VOLVER A INTENTAR!"}</span>
          </button>

          ${isRhythmGame ? `
            <button id="btn-modal-editor" class="btn-action btn-editor-action" title="Abrir el editor con tus notas">
              <span>🛠️ ${isCustom ? "SEGUIR EDITANDO / GRABAR" : "MODO GRABADOR"}</span>
            </button>
          ` : ""}

          ${isCustom && result.customNotes && result.customNotes.length > 0 ? `
            <button id="btn-modal-copy" class="btn-action btn-copy-action" title="Copiar código TypeScript al portapapeles">
              <span>📋 GUARDAR / COPIAR CÓDIGO</span>
            </button>
          ` : ""}

          <button id="btn-modal-menu" class="btn-action btn-menu" title="Volver al menú de minijuegos">
            ${getIconSvg("grid", { size: 22, color: "#ffffff" })}
            <span>OTROS JUEGOS</span>
          </button>
        </div>

        <!-- Toast de confirmación -->
        <div id="modal-toast" class="modal-toast" style="display: none;"></div>
      </div>
    `;

    this.container.style.display = "flex";
    this.setupEvents(result);
  }

  private setupEvents(result: GameResult): void {
    const btnAgain = this.container.querySelector("#btn-modal-again");
    const btnMenu = this.container.querySelector("#btn-modal-menu");
    const btnEditor = this.container.querySelector("#btn-modal-editor");
    const btnCopy = this.container.querySelector("#btn-modal-copy");

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

    btnEditor?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onEditAgain) {
        this.onEditAgain(result.songFile, result.customNotes);
      }
    });

    btnCopy?.addEventListener("click", () => {
      if (!result.customNotes || result.customNotes.length === 0) return;

      const codeLines = result.customNotes.map((n: { lane: number; time: number; isStar?: boolean }) => {
        const starStr = n.isStar ? ", isStar: true" : "";
        return `  { lane: ${n.lane}, time: ${n.time.toFixed(2)}${starStr} },`;
      });

      const output = `// Partitura generada con el Grabador de Ritmo\nconst vocalChart = [\n${codeLines.join("\n")}\n];`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output).then(() => {
          this.showToast("📋 ¡Código TypeScript copiado al portapapeles con éxito!");
        }).catch(() => {
          this.fallbackCopy(output);
        });
      } else {
        this.fallbackCopy(output);
      }
    });
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      this.showToast("📋 ¡Código copiado al portapapeles!");
    } catch {
      alert("Partitura:\n\n" + text);
    }
    document.body.removeChild(textArea);
  }

  private showToast(msg: string): void {
    const toast = this.container.querySelector("#modal-toast") as HTMLElement;
    if (toast) {
      toast.textContent = msg;
      toast.style.display = "block";
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          toast.style.display = "none";
        }, 300);
      }, 3000);
    }
  }

  public hide(): void {
    this.container.style.display = "none";
    this.container.innerHTML = "";
  }
}
