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

import gsap from "gsap";
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
  },
  "snowball-target": {
    id: "snowball-target",
    title: "Tiro al Blanco Navideño",
    iconName: "target",
    themeColor: "#00E676",
    goal: "Apunta y lanza bolas de nieve a las dianas y enemigos. ¡Los logos de patrocinadores te darán superpoderes únicos!",
    positiveItems: [
      { iconName: "target", label: "Dianas, Juguetes y Regalos (+150 a +300 pts)" },
      { iconName: "star", label: "Logos Patrocinador (¡Superpoderes: Triple Tiro, Slow-Mo, Mega-Bola, Escudo!)" },
      { iconName: "award", label: "Elfo Pillo Enemigo (+350 pts si lo atrapas rápido)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Carbón Ardiente (-150 pts y rompe la racha)" },
      { iconName: "snowflake", label: "Cristal Helado (-200 pts y congela tu resortera)" },
      { iconName: "skull", label: "Muñeco Gruñón (¡Te arrojará nieve a la lente si no lo abates!)" }
    ],
    controls: "Toca o haz clic en cualquier diana para disparar tu resortera"
  },
  "gift-tower": {
    id: "gift-tower",
    title: "Torre de Regalos Mágica",
    iconName: "gift",
    themeColor: "#FFD700",
    goal: "Suelta los paquetes en el momento exacto para construir la torre más alta hacia el cielo.",
    positiveItems: [
      { iconName: "gift", label: "Alineación Perfecta (+300 pts, Combo y Escala Musical)" },
      { iconName: "star", label: "Cajas de Patrocinador (¡+500 pts y Expansión Mágica!)" },
      { iconName: "sparkles", label: "Fiebre Navideña (¡Puntos dobles tras 3 Perfectos!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Desbordes (Rebanan la caja haciéndola más estrecha)" },
      { iconName: "skull", label: "Caer fuera de la torre (-1 Vida)" }
    ],
    controls: "Toca la pantalla o usa [ Espacio / Enter / ▼ ] para soltar la caja"
  }
};

export class GameInstructionsModal {
  private container: HTMLElement;
  private audio: AudioManager;
  public onStartGame?: (gameId: string) => void;
  public onBack?: () => void;
  private currentGameId: string = "";
  private entranceTl: gsap.core.Timeline | null = null;

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
    this.killAnimations();
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
    this.playEntranceAnimation();
  }

  public hide(): void {
    this.killAnimations();
    this.container.classList.remove("show");
    this.container.classList.add("hide");
    this.container.style.display = "none";
  }

  private playEntranceAnimation(): void {
    this.killAnimations();

    const card = this.container.querySelector<HTMLElement>(".instructions-card");
    const headerEls = Array.from(
      this.container.querySelectorAll<HTMLElement>(
        ".instructions-emblem-header, .instructions-ribbon-wrapper"
      )
    );
    const goalBox = this.container.querySelector<HTMLElement>(".instructions-goal-box");
    const boxes = Array.from(this.container.querySelectorAll<HTMLElement>(".instruction-box"));
    const controls = this.container.querySelector<HTMLElement>(".instructions-controls");
    const buttons = Array.from(
      this.container.querySelectorAll<HTMLElement>(".instructions-actions button")
    );

    const allTargets = [card, ...headerEls, goalBox, ...boxes, controls, ...buttons].filter(
      (el): el is HTMLElement => el !== null
    );
    if (allTargets.length === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(allTargets, { autoAlpha: 1, clearProps: "transform" });
      return;
    }

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" }
    });
    this.entranceTl = tl;

    if (card) {
      tl.fromTo(
        card,
        { autoAlpha: 0, y: 20, scale: 0.93 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.28)", clearProps: "transform" }
      );
    }

    if (headerEls.length > 0) {
      tl.fromTo(
        headerEls,
        { autoAlpha: 0, y: -10, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.04,
          ease: "back.out(1.4)",
          clearProps: "transform"
        },
        "-=0.22"
      );
    }

    if (goalBox) {
      tl.fromTo(
        goalBox,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out", clearProps: "transform" },
        "-=0.18"
      );
    }

    if (boxes.length > 0) {
      tl.fromTo(
        boxes,
        { autoAlpha: 0, y: 12, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.055,
          ease: "power2.out",
          clearProps: "transform"
        },
        "-=0.16"
      );
    }

    if (controls) {
      tl.fromTo(
        controls,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out", clearProps: "transform" },
        "-=0.16"
      );
    }

    if (buttons.length > 0) {
      tl.fromTo(
        buttons,
        { autoAlpha: 0, y: 10, scale: 0.95 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.26,
          stagger: 0.05,
          ease: "back.out(1.4)",
          clearProps: "transform"
        },
        "-=0.16"
      );
    }
  }

  public killAnimations(): void {
    if (this.entranceTl) {
      this.entranceTl.kill();
      this.entranceTl = null;
    }

    const targets = this.container.querySelectorAll<HTMLElement>(
      ".instructions-card, .instructions-emblem-header, .instructions-ribbon-wrapper, .instructions-goal-box, .instruction-box, .instructions-controls, .instructions-actions button"
    );
    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
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
    const btnPlay = this.container.querySelector<HTMLElement>("#btn-instructions-play");
    const btnBack = this.container.querySelector<HTMLElement>("#btn-instructions-back");

    [btnPlay, btnBack].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("pointerdown", () => {
        gsap.to(btn, {
          scale: 0.95,
          duration: 0.09,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      const restoreBtn = () => {
        gsap.to(btn, {
          scale: 1,
          duration: 0.16,
          ease: "back.out(1.5)",
          clearProps: "transform",
          overwrite: "auto"
        });
      };

      btn.addEventListener("pointerup", restoreBtn);
      btn.addEventListener("pointerleave", restoreBtn);
      btn.addEventListener("pointercancel", restoreBtn);
    });

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
