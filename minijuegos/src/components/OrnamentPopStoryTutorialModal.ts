/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡BURBUJAS DE ADORNOS!
 * ==============================================================================
 *
 * Muestra la narrativa navideña del Gran Árbol de Adornos y enseña las mecánicas
 * renovadas con simulaciones animadas en tiempo real:
 *
 * 1. Capítulo 1 - El Gran Árbol Encantado: Adornos de 5 colores y Cajas Colectoras.
 * 2. Capítulo 2 - Cañón Mágico e Intercambio: Apunta con mira láser y cambia esferas.
 * 3. Capítulo 3 - Racimos y Lluvia de Regalos: Junta 3+ iguales y derriba colgantes.
 * 4. Capítulo 4 - 4 Esferas de Poder & Fiebre: Arcoíris, Bomba, Rayo y Patrocinador.
 *
 * Cero emojis. Arte Stylized 2D Game Art.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface OrnamentPopStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  visualType: "story" | "controls" | "clusters" | "powers";
}

export class OrnamentPopStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep = 0;
  private isVisible = false;
  private animTimeline: gsap.core.Timeline | null = null;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: OrnamentPopStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Cañón Real de Adornos Navideños!",
      badge: "PUZZLE ARCADE",
      badgeColor: "#FFD700",
      storyText:
        "Las ramas del Gran Pino de la <strong>Feria Mágica del Juguete</strong> se están llenando de esferas encantadas de <strong>5 colores reales</strong> (Rubí, Zafiro, Esmeralda, Oro Solar y Amatista Real). ¡Usa el <strong>Cañón Lanzador de Relojería</strong> para despejar las oleadas antes de que los adornos desciendan hasta la línea roja!",
      proTip: "¡Despejar todo el tablero te otorga +1000 puntos de bonificación y avanza a la siguiente Oleada!",
      visualType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES E INTERCAMBIO",
      title: "¡Mira Láser Predictiva y Cambio de Esfera!",
      badge: "APUNTA & CAMBIA",
      badgeColor: "#00E5FF",
      storyText:
        "Arrastra tu dedo o usa <strong>[ ◄ / ► ]</strong> para orientar el cañón; la <strong>Silueta Fantasma</strong> te mostrará el hexágono exacto donde encajará tu tiro. ¿El color actual no te sirve? ¡Toca la <strong>Canasta del Elfo Ayudante (CAMBIAR)</strong> o presiona <strong>[ C / Shift ]</strong> para intercambiar tu adorno actual con el siguiente!",
      proTip: "¡Aprovecha el rebote en las columnas de bastón de caramelo laterales para colar tiros en rincones altos!",
      visualType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • RACIMOS Y CAJAS COLECTORAS",
      title: "¡Derriba Racimos hacia las Cajas x2 • x3 • x5!",
      badge: "LLUVIA DE PUNTOS",
      badgeColor: "#00E676",
      storyText:
        "Junta <strong>3 o más adornos del mismo color</strong> para hacerlos estallar. Todos los adornos que queden colgando debajo sin soporte caerán en picada hacia las <strong>5 Cajas Colectoras de Regalos</strong> en la base (<strong>x2, x3 y x5</strong>), otorgando bonificaciones masivas por cada esfera atrapada.",
      proTip: "¡Apunta a la raíz superior de un racimo grande para provocar una avalancha de adornos hacia la caja central x5!",
      visualType: "clusters"
    },
    {
      tag: "CAPÍTULO 4 • ESFERAS DE PODER Y FIEBRE",
      title: "¡Arcoíris, Bomba, Rayo Boreal y Patrocinador!",
      badge: "4 ESFERAS MÁGICAS",
      badgeColor: "#FF9100",
      storyText:
        "Llena el <strong>Medidor de Fiebre Estelar</strong> haciendo combos o golpea las esferas especiales del tablero: la <strong>Esfera Estrella Arcoíris</strong> revienta todos los colores vecinos, la <strong>Bola Bomba</strong> detona un radio de 2 anillos, el <strong>Rayo Boreal</strong> pulveriza toda la fila horizontal y la <strong>Bola Patrocinadora</strong> libera +420 puntos.",
      proTip: "¡También hay Bombas y Rayos incrustados entre las filas: toca cualquier adorno junto a ellos para detonarlos en cadena!",
      visualType: "powers"
    }
  ];

  constructor(containerId: string = "ornament-pop-tutorial-modal", audio: AudioManager) {
    this.audio = audio;
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "ski-tutorial-modal-overlay ornament-tutorial-theme hide";
      document.body.appendChild(el);
    }
    this.container = el;
    this.renderDOM();
    this.setupEvents();
  }

  public hasSeenTutorial(): boolean {
    try {
      return localStorage.getItem("ornament_pop_story_tutorial_seen") === "true";
    } catch {
      return false;
    }
  }

  public markTutorialSeen(): void {
    try {
      localStorage.setItem("ornament_pop_story_tutorial_seen", "true");
    } catch {
      // Ignorar
    }
  }

  public show(step: number = 0): void {
    this.currentStep = Math.max(0, Math.min(step, this.steps.length - 1));
    this.isVisible = true;
    this.container.classList.remove("hide");
    this.container.style.display = "flex";

    this.updateStepUI();

    const card = this.container.querySelector(".ski-tutorial-card") as HTMLElement;
    if (card) {
      gsap.killTweensOf(card);
      gsap.fromTo(
        card,
        { scale: 0.84, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }
      );
    }
  }

  public hide(triggerCallback: boolean = true): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.clearStepAnimations();

    const card = this.container.querySelector(".ski-tutorial-card") as HTMLElement;
    if (card) {
      gsap.to(card, {
        scale: 0.88,
        opacity: 0,
        y: 20,
        duration: 0.26,
        ease: "power2.in",
        onComplete: () => {
          this.container.classList.add("hide");
          this.container.style.display = "none";
          if (triggerCallback && this.onClose) this.onClose();
        }
      });
    } else {
      this.container.classList.add("hide");
      this.container.style.display = "none";
      if (triggerCallback && this.onClose) this.onClose();
    }
  }

  private renderDOM(): void {
    const dotsHTML = this.steps
      .map(
        (_, idx) => `
        <button class="ski-step-dot ${idx === 0 ? "active" : ""}" data-step="${idx}" aria-label="Paso ${idx + 1}">
          <span>${idx + 1}</span>
        </button>
      `
      )
      .join("");

    this.container.innerHTML = `
      <div class="ski-tutorial-backdrop"></div>

      <div class="ski-tutorial-card ornament-tutorial-card">
        <div class="ski-tutorial-garland"></div>

        <button class="ski-tutorial-close-btn" id="btn-ornament-tut-close" aria-label="Cerrar tutorial">
          ${getIconSvg("close", { size: 24 })}
        </button>

        <div class="ski-tutorial-header">
          <div class="ski-tutorial-header-badge">
            <img src="./assets/images/icono-burbujas-adornos.png" alt="Burbujas de Adornos" class="ski-header-mini-icon" />
            <span>GUÍA DE JUEGO • ¡BURBUJAS DE ADORNOS!</span>
          </div>
          <div class="ski-step-dots-nav">
            ${dotsHTML}
          </div>
        </div>

        <div class="ski-tutorial-body">
          <div class="ski-visual-column">
            <div class="ski-visual-stage" id="ornament-visual-stage"></div>
          </div>

          <div class="ski-info-column">
            <div class="ski-step-tag-row">
              <span class="ski-step-tag" id="ornament-tut-tag">CAPÍTULO 1</span>
              <span class="ski-step-pill" id="ornament-tut-badge">PUZZLE ARCADE</span>
            </div>

            <h2 class="ski-step-title" id="ornament-tut-title">¡El Cañón Real de Adornos Navideños!</h2>

            <p class="ski-step-desc" id="ornament-tut-desc"></p>

            <div class="ski-pro-tip-box">
              <div class="ski-pro-tip-icon">${getIconSvg("sparkles", { size: 22 })}</div>
              <div class="ski-pro-tip-text">
                <strong>CONSEJO DEL TALLER:</strong>
                <span id="ornament-tut-protip"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="ski-tutorial-footer">
          <button class="ski-tut-btn ski-tut-btn-ghost" id="btn-ornament-tut-prev">
            <span>◄ ANTERIOR</span>
          </button>

          <button class="ski-tut-btn ski-tut-btn-skip" id="btn-ornament-tut-skip">
            <span>SALTAR A LA PARTIDA</span>
          </button>

          <button class="ski-tut-btn ski-tut-btn-primary" id="btn-ornament-tut-next">
            <span id="ornament-tut-next-label">SIGUIENTE ►</span>
          </button>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    const closeBtn = this.container.querySelector("#btn-ornament-tut-close");
    const prevBtn = this.container.querySelector("#btn-ornament-tut-prev");
    const nextBtn = this.container.querySelector("#btn-ornament-tut-next");
    const skipBtn = this.container.querySelector("#btn-ornament-tut-skip");
    const backdrop = this.container.querySelector(".ski-tutorial-backdrop");
    const dots = this.container.querySelectorAll(".ski-step-dot");

    closeBtn?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide(true);
    });

    backdrop?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide(true);
    });

    prevBtn?.addEventListener("click", () => {
      this.audio.playTap();
      if (this.currentStep > 0) {
        this.currentStep--;
        this.updateStepUI();
      }
    });

    nextBtn?.addEventListener("click", () => {
      this.audio.playTap();
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        this.updateStepUI();
      } else {
        this.finishAndPlay();
      }
    });

    skipBtn?.addEventListener("click", () => {
      this.audio.playTap();
      this.finishAndPlay();
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = Number((dot as HTMLElement).dataset.step || 0);
        this.audio.playTap();
        this.currentStep = idx;
        this.updateStepUI();
      });
    });
  }

  private finishAndPlay(): void {
    this.markTutorialSeen();
    this.audio.playGameStart();
    try {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FF2A4D", "#00E5FF", "#B388FF"]
      });
    } catch {
      // Ignorar
    }

    this.hide(false);
    if (this.onPlayGame) this.onPlayGame();
  }

  private updateStepUI(): void {
    const stepData = this.steps[this.currentStep];

    const tagEl = this.container.querySelector("#ornament-tut-tag") as HTMLElement;
    const badgeEl = this.container.querySelector("#ornament-tut-badge") as HTMLElement;
    const titleEl = this.container.querySelector("#ornament-tut-title") as HTMLElement;
    const descEl = this.container.querySelector("#ornament-tut-desc") as HTMLElement;
    const proTipEl = this.container.querySelector("#ornament-tut-protip") as HTMLElement;
    const prevBtn = this.container.querySelector("#btn-ornament-tut-prev") as HTMLButtonElement;
    const nextLabel = this.container.querySelector("#ornament-tut-next-label") as HTMLElement;
    const nextBtn = this.container.querySelector("#btn-ornament-tut-next") as HTMLButtonElement;

    if (tagEl) tagEl.textContent = stepData.tag;
    if (badgeEl) {
      badgeEl.textContent = stepData.badge;
      badgeEl.style.background = stepData.badgeColor;
      badgeEl.style.color = "#1A090D";
    }
    if (titleEl) titleEl.textContent = stepData.title;
    if (descEl) descEl.innerHTML = stepData.storyText;
    if (proTipEl) proTipEl.textContent = stepData.proTip;

    const dots = this.container.querySelectorAll(".ski-step-dot");
    dots.forEach((d, idx) => {
      d.classList.toggle("active", idx === this.currentStep);
      d.classList.toggle("completed", idx < this.currentStep);
    });

    if (prevBtn) {
      prevBtn.style.visibility = this.currentStep === 0 ? "hidden" : "visible";
    }

    const isLast = this.currentStep === this.steps.length - 1;
    if (nextLabel) {
      nextLabel.textContent = isLast ? "¡LANZAR ADORNOS! ►" : "SIGUIENTE ►";
    }
    if (nextBtn) {
      nextBtn.classList.toggle("ski-tut-btn-launch", isLast);
    }

    const infoCol = this.container.querySelector(".ski-info-column");
    if (infoCol) {
      gsap.fromTo(infoCol, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
    }

    this.renderVisualSimulation(stepData.visualType);
  }

  private clearStepAnimations(): void {
    if (this.animTimeline) {
      this.animTimeline.kill();
      this.animTimeline = null;
    }
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  private renderVisualSimulation(type: OrnamentPopStepData["visualType"]): void {
    this.clearStepAnimations();
    const stage = this.container.querySelector("#ornament-visual-stage") as HTMLElement;
    if (!stage) return;

    if (type === "story") {
      stage.innerHTML = `
        <div class="ski-sim-scene ice-stage-dark">
          <div class="ornament-sim-row">
            <img src="./assets/images/bola-roja.png" class="ornament-sim-bauble" alt="Roja" />
            <img src="./assets/images/bola-azul.png" class="ornament-sim-bauble" alt="Azul" />
            <img src="./assets/images/bola-verde.png" class="ornament-sim-bauble" alt="Verde" />
            <img src="./assets/images/bola-amarilla.png" class="ornament-sim-bauble" alt="Oro" />
            <img src="./assets/images/bola-morada.png" class="ornament-sim-bauble" alt="Amatista" />
          </div>

          <div class="ornament-sim-cannon-wrap" id="sim-ornament-cannon-story">
            <img src="./assets/images/canon-adornos-tubo.png" class="ornament-sim-barrel" id="sim-barrel-story" alt="Tubo" />
            <img src="./assets/images/canon-adornos-base.png" class="ornament-sim-base" alt="Base" />
          </div>

          <div class="ski-sim-caption-pill">5 Colores Reales • Cañón de Relojería</div>
        </div>
      `;

      const barrel = stage.querySelector("#sim-barrel-story");
      this.animTimeline = gsap.timeline({ repeat: -1, yoyo: true });
      if (barrel) {
        this.animTimeline.fromTo(barrel, { rotation: -24 }, { rotation: 24, duration: 1.4, ease: "sine.inOut" });
      }
    } else if (type === "controls") {
      stage.innerHTML = `
        <div class="ski-sim-scene ice-stage-dark">
          <div class="ornament-sim-ghost-target" id="sim-ghost-target"></div>

          <div class="ornament-sim-swap-box" id="sim-swap-box">
            <img src="./assets/images/elfo-frente.png" class="ornament-sim-elf" alt="Elfo" />
            <div class="ornament-sim-swap-ring">
              <img src="./assets/images/bola-morada.png" id="sim-swap-orb" alt="Siguiente" />
            </div>
            <span>TOCA: CAMBIAR [C]</span>
          </div>

          <div class="ornament-sim-cannon-wrap">
            <img src="./assets/images/canon-adornos-tubo.png" class="ornament-sim-barrel" id="sim-barrel-ctrl" alt="Tubo" />
            <img src="./assets/images/canon-adornos-base.png" class="ornament-sim-base" alt="Base" />
          </div>

          <div class="ski-sim-caption-pill">Mira Fantasma + Botón CAMBIAR Esfera</div>
        </div>
      `;

      const barrel = stage.querySelector("#sim-barrel-ctrl");
      const swapBox = stage.querySelector("#sim-swap-box");
      this.animTimeline = gsap.timeline({ repeat: -1, yoyo: true });
      if (barrel) {
        this.animTimeline.fromTo(barrel, { rotation: -18 }, { rotation: 18, duration: 1.2, ease: "sine.inOut" }, 0);
      }
      if (swapBox) {
        this.animTimeline.to(swapBox, { scale: 1.1, duration: 0.6, ease: "back.out(2)" }, 0.3);
      }
    } else if (type === "clusters") {
      stage.innerHTML = `
        <div class="ski-sim-scene ice-stage-dark">
          <div class="ornament-sim-row">
            <img src="./assets/images/bola-roja.png" class="ornament-sim-bauble" alt="Roja" />
            <img src="./assets/images/bola-roja.png" class="ornament-sim-bauble" alt="Roja" />
            <img src="./assets/images/bola-roja.png" class="ornament-sim-bauble" alt="Roja" />
          </div>

          <div class="ornament-sim-falling-group" id="sim-falling-orbs">
            <img src="./assets/images/bola-azul.png" class="ornament-sim-bauble" alt="Cae 1" />
            <img src="./assets/images/bola-verde.png" class="ornament-sim-bauble" alt="Cae 2" />
          </div>

          <div class="ornament-sim-bins-row">
            <div class="ornament-sim-bin">x2</div>
            <div class="ornament-sim-bin">x3</div>
            <div class="ornament-sim-bin gold">x5 (+250)</div>
            <div class="ornament-sim-bin">x3</div>
            <div class="ornament-sim-bin">x2</div>
          </div>

          <div class="ski-sim-caption-pill">Derriba Colgantes hacia las Cajas Colectoras</div>
        </div>
      `;

      const falling = stage.querySelector("#sim-falling-orbs");
      this.animTimeline = gsap.timeline({ repeat: -1 });
      if (falling) {
        this.animTimeline
          .fromTo(falling, { y: -15, opacity: 1 }, { y: 58, opacity: 1, duration: 0.75, ease: "power2.in" })
          .to(falling, { opacity: 0, scale: 1.25, duration: 0.25 });
      }
    } else if (type === "powers") {
      stage.innerHTML = `
        <div class="ski-sim-scene ice-stage-dark">
          <div class="ornament-sim-powers-grid">
            <div class="ornament-power-card">
              <img src="./assets/images/bola-arcoiris.png" alt="Arcoíris" />
              <strong>ESTRELLA ARCOÍRIS</strong>
              <span>Comodín Multicolor</span>
            </div>
            <div class="ornament-power-card">
              <img src="./assets/images/bola-bomba.png" alt="Bomba" />
              <strong>BOMBA CONFETI</strong>
              <span>Explosión Radial</span>
            </div>
            <div class="ornament-power-card">
              <img src="./assets/images/bola-rayo.png" alt="Rayo" />
              <strong>RAYO BOREAL</strong>
              <span>Limpia Toda la Fila</span>
            </div>
            <div class="ornament-power-card">
              <img src="./assets/logos/clean-campuslands.png" alt="Patrocinador" />
              <strong>PATROCINADOR</strong>
              <span>Súper Explosión +420</span>
            </div>
          </div>

          <div class="ski-sim-caption-pill">4 Esferas Mágicas y Medidor de Fiebre</div>
        </div>
      `;
    }
  }
}
