/**
 * ==============================================================================
 * COMPONENTE: MODAL DE INSTRUCCIONES RÁPIDAS (GameInstructionsModal)
 * ==============================================================================
 * 
 * Modal ultra-visual y conciso (lectura en ~5 segundos):
 * - 🎯 Objetivo en una sola frase.
 * - 🟢 Qué da puntos (con glow verde).
 * - 🔴 Qué debes evitar o qué te hace perder (con glow rojo).
 * - 🕹️ Controles intuitivos.
 * - Botón arcade "¡A JUGAR!" y botón "VOLVER".
 */

import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface GameInstructionData {
  id: string;
  title: string;
  iconName: string;
  themeColor: string;
  goal: string;
  positiveItems: { iconName: string; label: string }[];
  negativeItems: { iconName: string; label: string }[];
  controls: string;
}

export const GAME_INSTRUCTIONS: Record<string, GameInstructionData> = {
  "toy-catch": {
    id: "toy-catch",
    title: "Atrapa-Regalos Mágico",
    iconName: "gift",
    themeColor: "#FF2A4D",
    goal: "Mueve el saco de Santa para atrapar la mayor cantidad de juguetes.",
    positiveItems: [
      { iconName: "gift", label: "Regalos (+100 pts)" },
      { iconName: "sparkles", label: "Juguetes (+150 pts)" },
      { iconName: "star", label: "Logos (¡Poder x2!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Carbón (Resta puntos)" },
      { iconName: "snowflake", label: "Hielo (Te congela)" }
    ],
    controls: "Arrastra con el dedo o usa Teclas [ A / D ] o [ ◄ / ► ]"
  },
  "bell-symphony": {
    id: "bell-symphony",
    title: "Sinfonía de Campanas",
    iconName: "bell",
    themeColor: "#00E5FF",
    goal: "Toca las flechas justo cuando pasen por la línea inferior.",
    positiveItems: [
      { iconName: "bell", label: "Notas al compás (+Puntos y Combo)" },
      { iconName: "star", label: "Notas Logo (¡Star Power x4!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Fallos = Pérdida de Campanas (Vidas)" }
    ],
    controls: "Toca los 4 carriles o usa las teclas [ D - F - J - K ]"
  },
  "tree-melody": {
    id: "tree-melody",
    title: "Tambores del Cascanueces",
    iconName: "drum",
    themeColor: "#FFB300",
    goal: "Observa al elfo tocar el ritmo y repite exactamente su secuencia en los tambores.",
    positiveItems: [
      { iconName: "drum", label: "Golpes al compás (+Puntos y Combo x2/x3)" },
      { iconName: "star", label: "Tambor Dorado (¡Doble puntuación festiva!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Fallos = Pérdida de Vidas" }
    ],
    controls: "Toca los 3 tambores [ DON | STAR | KA ] o teclas [ 1 - 2 - 3 ]"
  },
  "flying-elf": {
    id: "flying-elf",
    title: "El Vuelo Mágico del Elfo",
    iconName: "sparkles",
    themeColor: "#D500F9",
    goal: "Mantén pulsada la pantalla para ascender y suelta para planear.",
    positiveItems: [
      { iconName: "gift", label: "Regalos y Dulces (+100 a +250 pts)" },
      { iconName: "star", label: "Logo Feria (¡Turbo + Imán x2 de Puntos!)" }
    ],
    negativeItems: [
      { iconName: "snowflake", label: "Chimeneas y Hielo (-2.5s de tiempo)" }
    ],
    controls: "Mantén presionado en pantalla táctil o usa [ Espacio / W / ▲ ]"
  },
  "magic-pairs": {
    id: "magic-pairs",
    title: "Parejas de Juguetes",
    iconName: "cards",
    themeColor: "#D500F9",
    goal: "Gira las cartas y encuentra todas las parejas antes de que acabe el tiempo.",
    positiveItems: [
      { iconName: "cards", label: "Parejas iguales (+Puntos y nuevo nivel)" },
      { iconName: "star", label: "Logo Feria (¡Bonus x2 de Puntos!)" }
    ],
    negativeItems: [
      { iconName: "timer", label: "El tiempo corre sin detenerse" }
    ],
    controls: "Toca cualquier carta para girarla"
  },
  "santa-hills": {
    id: "santa-hills",
    title: "El Descenso de Santa",
    iconName: "gift",
    themeColor: "#FF2A4D",
    goal: "Deslízate por las colinas nevadas, salta en las crestas y recupera los regalos perdidos de Papá Noel.",
    positiveItems: [
      { iconName: "gift", label: "Regalos y Dulces (+100 a +300 pts)" },
      { iconName: "star", label: "Medallón Feria (¡Trineo Dorado + Imán x2!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Rocas de Carbón (-1 Vida)" },
      { iconName: "snowflake", label: "Hielo (Frena y pierde poderes)" }
    ],
    controls: "Toca para saltar, doble toque en el aire o [ Espacio / W / ▲ ]"
  }
};

export class GameInstructionsModal {
  private container: HTMLElement;
  private audio: AudioManager;
  public onStartGame?: (gameId: string) => void;
  public onBack?: () => void;
  private currentGameId: string = "";

  constructor(containerId: string, audio: AudioManager) {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "kiosk-overlay modal-layer";
      el.style.display = "none";
      const mainEl = document.getElementById("kiosk-main") || document.body;
      mainEl.appendChild(el);
    }
    this.container = el;
    this.audio = audio;
  }

  public show(gameId: string): void {
    this.currentGameId = gameId;
    const data = GAME_INSTRUCTIONS[gameId];
    if (!data) {
      if (this.onStartGame) this.onStartGame(gameId);
      return;
    }

    this.render(data);
    this.container.style.display = "flex";
    this.container.classList.remove("hide");
    this.container.classList.add("show");
    this.setupEvents();
  }

  public hide(): void {
    this.container.classList.remove("show");
    this.container.classList.add("hide");
    setTimeout(() => {
      this.container.style.display = "none";
    }, 250);
  }

  private render(data: GameInstructionData): void {
    this.container.innerHTML = `
      <div class="instructions-card fantasy-modal-card">
        <!-- ADORNOS DE ESQUINA TALLADOS ESTILO FANTASÍA 2D -->
        <div class="card-ornament ornament-tl"></div>
        <div class="card-ornament ornament-tr"></div>
        <div class="card-ornament ornament-bl"></div>
        <div class="card-ornament ornament-br"></div>

        <!-- MEDALLÓN HEROICO SUPERIOR DE LA FERIA MÁGICA -->
        <div class="instructions-emblem-header">
          <div class="instructions-emblem-aura"></div>
          <div class="instructions-medallion-box">
            <img src="./assets/images/medallon-feria.png" alt="Feria Mágica" class="instructions-feria-seal" />
          </div>
        </div>

        <!-- CINTA / LISTÓN FESTIVO DEL TÍTULO -->
        <div class="instructions-ribbon-wrapper">
          <div class="ribbon-tail ribbon-tail-left"></div>
          <div class="ribbon-banner-body">
            <div class="instructions-ribbon-tag">CÓMO JUGAR</div>
            <h2 class="instructions-title">${data.title}</h2>
          </div>
          <div class="ribbon-tail ribbon-tail-right"></div>
        </div>

        <!-- OBJETIVO DE LA MISIÓN -->
        <div class="instructions-goal-box">
          <div class="goal-tag">${getIconSvg("target", { size: 15, color: "#FFD700" })} <span>OBJETIVO</span></div>
          <p class="goal-text">${data.goal}</p>
        </div>

        <!-- CUADRÍCULA VISUAL: BUENO vs PELIGRO -->
        <div class="instructions-grid">
          <!-- QUÉ RECOGER / BENEFICIOSO -->
          <div class="instruction-box box-positive">
            <div class="box-title positive-title">
              <span class="dot-indicator green-dot"></span>
              ${getIconSvg("sparkles", { size: 16, color: "#2ECC71", fill: "#2ECC71" })}
              <span>¡SUMA PUNTOS!</span>
            </div>
            <div class="items-list">
              ${data.positiveItems.map(item => `
                <div class="item-chip chip-positive">
                  <span class="chip-icon">${getIconSvg(item.iconName, { size: 18, color: "#2ECC71" })}</span>
                  <span class="chip-text">${item.label}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- QUÉ EVITAR / PELIGRO -->
          <div class="instruction-box box-negative">
            <div class="box-title negative-title">
              <span class="dot-indicator red-dot"></span>
              ${getIconSvg("flame", { size: 16, color: "#EF4444", fill: "#EF4444" })}
              <span>¡CUIDADO!</span>
            </div>
            <div class="items-list">
              ${data.negativeItems.map(item => `
                <div class="item-chip chip-negative">
                  <span class="chip-icon">${getIconSvg(item.iconName, { size: 18, color: "#EF4444" })}</span>
                  <span class="chip-text">${item.label}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- CONTROLES -->
        <div class="instructions-controls">
          <span class="controls-icon">${getIconSvg("gamepad", { size: 20, color: "#FFD700" })}</span>
          <span class="controls-text"><strong>Controles:</strong> ${data.controls}</span>
        </div>

        <!-- BOTONES DE ACCIÓN 3D ARCADE -->
        <div class="instructions-actions">
          <button id="btn-instructions-back" class="btn-instruction-secondary btn-action-wood">
            ${getIconSvg("arrowLeft", { size: 18, color: "#FFFFFF" })}
            <span>VOLVER</span>
          </button>
          <button id="btn-instructions-play" class="btn-instruction-primary btn-action-play">
            <span>¡A JUGAR!</span>
            ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
          </button>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    const btnPlay = this.container.querySelector("#btn-instructions-play");
    const btnBack = this.container.querySelector("#btn-instructions-back");

    btnPlay?.addEventListener("click", () => {
      this.hide();
      if (this.onStartGame) {
        this.onStartGame(this.currentGameId);
      }
    });

    btnBack?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onBack) {
        this.onBack();
      }
    });
  }
}
