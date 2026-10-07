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

export interface GameInstructionData {
  id: string;
  title: string;
  icon: string;
  themeColor: string;
  goal: string;
  positiveItems: { icon: string; label: string }[];
  negativeItems: { icon: string; label: string }[];
  controls: string;
}

export const GAME_INSTRUCTIONS: Record<string, GameInstructionData> = {
  "toy-catch": {
    id: "toy-catch",
    title: "Atrapa-Regalos Mágico",
    icon: "🎁",
    themeColor: "#FF2A4D",
    goal: "Mueve el saco de Santa para atrapar la mayor cantidad de juguetes.",
    positiveItems: [
      { icon: "🎁", label: "Regalos (+100 pts)" },
      { icon: "🧸", label: "Juguetes (+150 pts)" },
      { icon: "⭐", label: "Logos (¡Poder x2!)" }
    ],
    negativeItems: [
      { icon: "🪨", label: "Carbón (Resta puntos)" },
      { icon: "🧊", label: "Hielo (Te congela)" }
    ],
    controls: "Arrastra con el dedo o usa Teclas [ A / D ] o [ ◄ / ► ]"
  },
  "bell-symphony": {
    id: "bell-symphony",
    title: "Sinfonía de Campanas",
    icon: "🔔",
    themeColor: "#00E5FF",
    goal: "Toca las flechas justo cuando pasen por la línea inferior.",
    positiveItems: [
      { icon: "🔔", label: "Notas al compás (+Puntos y Combo)" },
      { icon: "⭐", label: "Notas Logo (¡Star Power x4!)" }
    ],
    negativeItems: [
      { icon: "⚠️", label: "5 Fallos = ¡Fin del Juego! (5 Vidas)" }
    ],
    controls: "Toca los 4 carriles o usa las teclas [ D - F - J - K ]"
  },
  "tree-melody": {
    id: "tree-melody",
    title: "Tambores del Cascanueces",
    icon: "🥁",
    themeColor: "#FFB300",
    goal: "Observa al elfo tocar el ritmo y repite exactamente su secuencia en los tambores.",
    positiveItems: [
      { icon: "🥁", label: "Golpes al compás (+Puntos y Combo x2/x3)" },
      { icon: "🟡", label: "Tambor Dorado (¡Doble puntuación festiva!)" }
    ],
    negativeItems: [
      { icon: "⚠️", label: "5 Fallos = ¡Fin del Concierto! (5 Vidas)" }
    ],
    controls: "Toca los 3 tambores [ 🔴 DON | 🟡 STAR | 🔵 KA ] o teclas [ 1 - 2 - 3 ]"
  },
  "flying-elf": {
    id: "flying-elf",
    title: "El Vuelo Mágico del Elfo",
    icon: "🧝‍♂️",
    themeColor: "#D500F9",
    goal: "Mantén pulsada la pantalla para ascender y suelta para planear.",
    positiveItems: [
      { icon: "🎁", label: "Regalos y Dulces (+100 a +250 pts)" },
      { icon: "⭐", label: "Logo Feria (¡Turbo + Imán x2 de Puntos!)" }
    ],
    negativeItems: [
      { icon: "⚠️", label: "Chimeneas y Hielo (-2.5s de tiempo)" }
    ],
    controls: "Mantén presionado en pantalla táctil o usa [ Espacio / W / ▲ ]"
  },
  "magic-pairs": {
    id: "magic-pairs",
    title: "Parejas de Juguetes",
    icon: "🃏",
    themeColor: "#D500F9",
    goal: "Gira las cartas y encuentra todas las parejas antes de que acabe el tiempo.",
    positiveItems: [
      { icon: "🃏", label: "Parejas iguales (+Puntos y nuevo nivel)" },
      { icon: "⭐", label: "Logo Feria (¡Bonus x2 de Puntos!)" }
    ],
    negativeItems: [
      { icon: "⏳", label: "El tiempo corre sin detenerse" }
    ],
    controls: "Toca cualquier carta para girarla"
  },
  "village-runner": {
    id: "village-runner",
    title: "La Carrera Mágica de la Villa",
    icon: "🛷",
    themeColor: "#FFB300",
    goal: "Esquiva obstáculos y recoge regalos a toda velocidad en tu trineo.",
    positiveItems: [
      { icon: "🎁", label: "Regalos y Dulces (+100 a +150 pts)" },
      { icon: "🎪", label: "Medallón Feria (¡Poder x2 + Imán!)" },
      { icon: "🪵", label: "Vallas (¡Salta por encima!)" },
      { icon: "🧊", label: "Arcos de Hielo (¡Deslízate abajo!)" }
    ],
    negativeItems: [
      { icon: "💥", label: "Carretas y Choques (Resta 100 pts y velocidad)" }
    ],
    controls: "Desliza en pantalla: ◄ ► Mover | ▲ Saltar | ▼ Agacharse"
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
      <div class="instructions-card fantasy-border" style="--accent-color: ${data.themeColor}">
        <!-- CABECERA -->
        <div class="instructions-header">
          <span class="instructions-badge">CÓMO JUGAR</span>
          <h2 class="instructions-title">
            <span class="instructions-icon">${data.icon}</span>
            ${data.title}
          </h2>
          <p class="instructions-goal">🎯 <strong>Objetivo:</strong> ${data.goal}</p>
        </div>

        <!-- CUADRÍCULA VISUAL: 🟢 BUENO vs 🔴 PELIGRO -->
        <div class="instructions-grid">
          <!-- 🟢 QUÉ RECOGER / BENEFICIOSO -->
          <div class="instruction-box box-positive">
            <div class="box-title positive-title">
              <span class="dot-indicator green-dot"></span>
              🟢 ¡SUMA PUNTOS! (RECOGER)
            </div>
            <div class="items-list">
              ${data.positiveItems.map(item => `
                <div class="item-chip chip-positive">
                  <span class="chip-icon">${item.icon}</span>
                  <span class="chip-text">${item.label}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 🔴 QUÉ EVITAR / PELIGRO -->
          <div class="instruction-box box-negative">
            <div class="box-title negative-title">
              <span class="dot-indicator red-dot"></span>
              🔴 ¡CUIDADO! (EVITAR / NO TOCAR)
            </div>
            <div class="items-list">
              ${data.negativeItems.map(item => `
                <div class="item-chip chip-negative">
                  <span class="chip-icon">${item.icon}</span>
                  <span class="chip-text">${item.label}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- CONTROLES -->
        <div class="instructions-controls">
          <span class="controls-icon">🕹️</span>
          <span class="controls-text"><strong>Controles:</strong> ${data.controls}</span>
        </div>

        <!-- BOTONES DE ACCIÓN -->
        <div class="instructions-actions">
          <button id="btn-instructions-back" class="btn-instruction-secondary">
            ⬅️ VOLVER
          </button>
          <button id="btn-instructions-play" class="btn-instruction-primary">
            ¡A JUGAR! ▶
          </button>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    const btnPlay = this.container.querySelector("#btn-instructions-play");
    const btnBack = this.container.querySelector("#btn-instructions-back");

    btnPlay?.addEventListener("click", () => {
      this.audio.playGameStart();
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
