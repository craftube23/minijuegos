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
  "workshop-chaos": {
    id: "workshop-chaos",
    title: "¡El Caos del Taller Mágico!",
    iconName: "sparkles",
    themeColor: "#FF9100",
    goal: "¡La máquina de juguetes sufrió una sobrecarga! Toca los juguetes y regalos que salen volando antes de que caigan, y evita el carbón y los paquetes defectuosos.",
    positiveItems: [
      { iconName: "gift", label: "Regalos y Peluches (+10 a +15 pts)" },
      { iconName: "target", label: "Robots y Coches (+20 a +25 pts)" },
      { iconName: "star", label: "Regalos Patrocinados con Logo (¡+Bonus y Energía!)" },
      { iconName: "sparkles", label: "Fiebre de Juguetes (¡Lluvia dorada y Puntos x2!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Carbón Ardiente (-30 pts y Rompe Combo)" },
      { iconName: "skull", label: "Regalo Defectuoso (-25 pts y Rompe Combo)" }
    ],
    controls: "Toca rápidamente los juguetes en pantalla antes de que caigan"
  },
  "christmas-jump": {
    id: "christmas-jump",
    title: "¡Salto Mágico Navideño!",
    iconName: "sparkles",
    themeColor: "#00E5FF",
    goal: "¡Salta sin parar hacia las alturas! Rebota sobre plataformas de nieve, nubes y bumpers. Aplasta a los duendes del hielo en el aire y usa cohetes propulsores para alcanzar las estrellas.",
    positiveItems: [
      { iconName: "star", label: "Cohete Propulsor (¡Ascenso supersónico a toda velocidad!)" },
      { iconName: "gift", label: "Regalos y Estrellas (+100 a +250 pts)" },
      { iconName: "target", label: "Bumpers y Resortes (¡Rebotes acrobáticos de alta potencia!)" },
      { iconName: "clock", label: "Reloj Mágico (+5s de tiempo extra)" },
      { iconName: "sparkles", label: "Pisotón a Duendes (¡Aplástalos desde arriba para +350 pts!)" }
    ],
    negativeItems: [
      { iconName: "skull", label: "Choque Lateral con Duendes (-50 pts y Rompe Combo)" },
      { iconName: "snowflake", label: "Hielo Quebradizo y Nubes de 1 Solo Rebote" },
      { iconName: "flame", label: "Caída al Fondo (El trampolín te salva, pero reinicia tu combo)" }
    ],
    controls: "Arrastra el dedo hacia los lados, usa los botones táctiles [ ◀ IZQUIERDA / DERECHA ▶ ] o usa [ ◄ / ► / A / D ]"
  },
  "gift-tower": {
    id: "gift-tower",
    title: "¡Torre de Regalos Mágica!",
    iconName: "gift",
    themeColor: "#FFD700",
    goal: "¡Suelta los paquetes en el momento exacto para construir la torre más alta hacia el cielo!",
    positiveItems: [
      { iconName: "gift", label: "Alineación Perfecta (+300 pts y combo musical)" },
      { iconName: "star", label: "Cajas de Patrocinador (¡+500 pts y expansión mágica!)" },
      { iconName: "sparkles", label: "Fiebre Navideña (¡Puntos dobles tras 3 perfectos!)" },
      { iconName: "target", label: "Joyero Real y Reloj Mágico (+750 pts o +1 Vida Extra)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Desbordes (Rebanan la caja haciéndola más estrecha)" },
      { iconName: "skull", label: "Caer fuera de la torre (-1 Vida)" }
    ],
    controls: "Toca la pantalla o usa [ Espacio / Enter / ▼ ] para soltar la caja"
  },
  "polar-express": {
    id: "polar-express",
    title: "¡El Expreso Polar Mágico!",
    iconName: "sparkles",
    themeColor: "#FF2A4D",
    goal: "¡Conduce la locomotora mágica por tres vías! Cambia de carril para recoger regalos y estrellas y esquivar muñecos de nieve, cristales de hielo, troncos y carbón.",
    positiveItems: [
      { iconName: "gift", label: "Regalos (+50 pts)" },
      { iconName: "star", label: "Estrella Brillante (+150 pts)" },
      { iconName: "sparkles", label: "Regalo de Patrocinador (¡Turbo Vapor: invencible y +300 pts!)" }
    ],
    negativeItems: [
      { iconName: "snowflake", label: "Muñecos, cristales y troncos (pierdes una vida)" },
      { iconName: "flame", label: "Carbón en la vía (pierdes una vida)" }
    ],
    controls: "Toca o arrastra hacia la vía a la que quieres ir, o usa [ ▲ / ▼ ] / [ W / S ]"
  },
  "ice-breaker": {
    id: "ice-breaker",
    title: "¡Rompe-Hielos Mágico!",
    iconName: "snowflake",
    themeColor: "#D500F9",
    goal: "¡Mueve la paleta de bastón de caramelo para rebotar la esfera dorada y destruir los bloques de hielo y regalos congelados!",
    positiveItems: [
      { iconName: "gift", label: "Bloques de cristal y regalos (+60 a +140 pts)" },
      { iconName: "star", label: "Cápsulas mágicas (¡Multi-Esfera x3, Paleta Gigante y Fuego!)" },
      { iconName: "sparkles", label: "Cofre de Patrocinador (+250 pts y Esfera de Fuego)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Dejar caer todas las esferas (pierdes una de tus 3 vidas)" }
    ],
    controls: "Desliza el dedo / ratón a los lados o usa [ ◄ / ► ] y [ Espacio ] para lanzar"
  },
  "ornament-pop": {
    id: "ornament-pop",
    title: "¡Ninja Corta-Regalos!",
    iconName: "sparkles",
    themeColor: "#FF2A4D",
    goal: "¡Desliza tu espada de luz para cortar en dos mitades exactas los regalos, galletas de jengibre, caramelos y piñatas sin tocar las bombas!",
    positiveItems: [
      { iconName: "gift", label: "Regalos, Galletas y Caramelos (+80 pts y combos x3, x4, x5)" },
      { iconName: "snowflake", label: "Cristal Glacial y Esfera Arcoíris (¡Tiempo Congelado y Lluvia Frenesí!)" },
      { iconName: "star", label: "Gran Piñata Estrella (¡Córtala hasta 10 veces seguidas +500 pts!)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Cortar una Bomba de Carbón o dejar caer un regalo (pierdes 1 de tus 3 vidas)" }
    ],
    controls: "Desliza el dedo o el ratón a toda velocidad sobre los regalos y dulces en el aire."
  },
  "toy-match": {
    id: "toy-match",
    title: "¡Juguetería Mágica!",
    iconName: "sparkles",
    themeColor: "#FFD700",
    goal: "¡Intercambia juguetes vecinos en la vitrina mágica para formar líneas de 3, 4 o 5 iguales! Unir 4 o más crea una Estrella Explosiva de Patrocinador.",
    positiveItems: [
      { iconName: "gift", label: "Línea de 3 juguetes iguales (+135 pts + multiplicador)" },
      { iconName: "star", label: "Unir 4 o más crea una Estrella Explosiva (+450 pts)" },
      { iconName: "sparkles", label: "Botón Mezclar Vitrina (renueva el tablero al instante)" }
    ],
    negativeItems: [
      { iconName: "flame", label: "Movimiento sin combinación (reinicia tu racha de combo)" }
    ],
    controls: "Toca o desliza dos juguetes contiguos para intercambiarlos, o toca una Estrella Explosiva"
  },
  "santa-ski": {
    id: "santa-ski",
    title: "¡Esquí Alpino de Santa!",
    iconName: "sparkles",
    themeColor: "#00E5FF",
    goal: "¡Desciende por la montaña en un mundo abierto alpino infinito! Esquiva pinos, muñecos y rocas, salta en rampas doradas y huye del temible Yeti de Nieve.",
    positiveItems: [
      { iconName: "star", label: "Puerta de Eslalon (+150 pts y combo x2/x3)" },
      { iconName: "sparkles", label: "Rampa de Salto (+300 pts y acrobacia aérea 360°)" },
      { iconName: "gift", label: "Estrella de Patrocinador (¡Super Turbo Dorado que arrasa todo!)" }
    ],
    negativeItems: [
      { iconName: "snowflake", label: "Pinos, Rocas y Muñecos (Pierdes 1 vida)" },
      { iconName: "flame", label: "El Yeti de Nieve te persigue (¡Salta en rampas o usa turbo para escapar!)" }
    ],
    controls: "Desliza el dedo hacia los lados o usa las flechas [ ◄ / ► / A / D ] para tallar en el mundo abierto"
  },
  "snow-battle": {
    id: "snow-battle",
    title: "¡Batalla de Nieve!",
    iconName: "snowflake",
    themeColor: "#FF2A4D",
    goal: "¡Defiende la plaza el mayor tiempo posible! Tienes 3 vidas: lanza bolas de nieve automáticamente a los enemigos dentro del recuadro, encadena combos y derrota al Yeti.",
    positiveItems: [
      { iconName: "sparkles", label: "Disparo Triple (abanico de 3 bolas de nieve)" },
      { iconName: "star", label: "Escudo de Nariz Brillante (aura roja que daña al contacto)" },
      { iconName: "gift", label: "Galleta Navideña (+1 corazón) y Logo Patrocinador (puntos x2)" }
    ],
    negativeItems: [
      { iconName: "snowflake", label: "Muñecos malvados (2 impactos) y Duendes traviesos (1 impacto)" },
      { iconName: "flame", label: "Yeti mini-jefe periódico (10 impactos). Cada golpe resta 1 de tus 3 corazones" }
    ],
    controls: "Toca y arrastra en cualquier lugar para usar el joystick flotante, o usa [ W A S D / Flechas ]"
  }
};

export class GameInstructionsModal {
  private container: HTMLElement;
  private audio: AudioManager;
  public onStartGame?: (gameId: string) => void;
  public onWatchStory?: (gameId: string) => void;
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
            <img src="./assets/images/medallon-feria.webp" alt="Feria Mágica" class="instructions-feria-seal" />
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
          <button id="btn-instructions-story" class="btn-instruction-story">
            ${getIconSvg("sparkles", { size: 18, color: "#FFD700" })}
            <span>🎬 HISTORIA & TUTORIAL</span>
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

    const btnStory = this.container.querySelector<HTMLElement>("#btn-instructions-story");
    btnStory?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onWatchStory) {
        this.onWatchStory(this.currentGameId);
      }
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
