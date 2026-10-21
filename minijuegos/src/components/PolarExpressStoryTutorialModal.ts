/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡EL EXPRESO POLAR MÁGICO!
 * ==============================================================================
 *
 * Muestra la narrativa navideña del Expreso Polar de la Feria Mágica y enseña
 * sus mecánicas renovadas con simulaciones animadas en tiempo real:
 *
 * 1. Capítulo 1 - El Expreso de Medianoche: Locomotora + Vagón de Regalos.
 * 2. Capítulo 2 - Las 3 Vías Doradas: Cambio de carril táctil o con teclado.
 * 3. Capítulo 3 - Caldera de Vapor y Estaciones: Rachas x2-x4 y bonos cada 400m.
 * 4. Capítulo 4 - Peligros en la Vía y Turbo Rompehielos: Demolición de obstáculos.
 *
 * Cero emojis. Arte Stylized 2D Game Art.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface PolarExpressStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  visualType: "story" | "tracks" | "boiler" | "turbo";
}

export class PolarExpressStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep = 0;
  private isVisible = false;
  private animTimeline: gsap.core.Timeline | null = null;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: PolarExpressStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Expreso Polar de la Feria Mágica!",
      badge: "LOCOMOTORA + VAGÓN REAL",
      badgeColor: "#FFD700",
      storyText:
        "Faltan pocas horas para la gran apertura de la <strong>Feria Mágica del Juguete</strong> y la legendaria locomotora de vapor ha partido a toda máquina arrastrando su <strong>Vagón Real de Regalos</strong>. Tu misión como maquinista jefe es guiar el tren a través de las tres vías doradas de la cordillera invernal sin perder tu valiosa carga.",
      proTip: "¡Observa cómo el vagón trasero sigue tus cambios de vía con movimiento articulado e ilumina el camino con su faro delantero!",
      visualType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES DE VÍA",
      title: "¡Cambia entre las 3 Vías Doradas!",
      badge: "AGUJAS FERROVIARIAS",
      badgeColor: "#00E5FF",
      storyText:
        "Toca directamente cualquiera de las <strong>3 vías (Vía 1, Vía 2 o Vía 3)</strong> en la pantalla, desliza hacia arriba o abajo, o usa las teclas <strong>[ ▲ / ▼ ]</strong> y <strong>[ W / S ]</strong>. La vía seleccionada brillará en oro y las ruedas soltarán chispas al cambiar de riel.",
      proTip: "¡Los indicadores laterales VÍA 1, VÍA 2 y VÍA 3 te muestran en todo momento hacia qué carril se dirige tu locomotora!",
      visualType: "tracks"
    },
    {
      tag: "CAPÍTULO 3 • CALDERA Y ESTACIONES",
      title: "¡Presión de Vapor y Rachas x4!",
      badge: "CALDERA MÁGICA & BONOS",
      badgeColor: "#00E676",
      storyText:
        "Recoge <strong>Regalos (+50 pts)</strong> y <strong>Estrellas (+150 pts)</strong> sobre los rieles para elevar tu multiplicador de racha hasta <strong>x4</strong> y llenar el medidor de la <strong>Caldera de Vapor (0% a 100%)</strong>. Además, cada <strong>400 metros</strong> cruzarás una <strong>Estación Navideña</strong> que te otorgará un bono especial de <strong>+250 puntos</strong>.",
      proTip: "¡Cuando la caldera llegue al 100% de presión, desatarás el Turbo Vapor automáticamente!",
      visualType: "boiler"
    },
    {
      tag: "CAPÍTULO 4 • PELIGROS Y TURBO",
      title: "¡Esquiva o Demuele con el Escudo!",
      badge: "ESCUDO ROMPEHIELOS",
      badgeColor: "#FF9100",
      storyText:
        "Esquiva las <strong>Barreras Ferroviarias</strong> con farol rojo, <strong>Muñecos de Nieve</strong>, <strong>Cristales de Hielo</strong>, <strong>Troncos</strong> y <strong>Carbón</strong> para proteger tus 3 vidas. Pero al recoger un <strong>Regalo Dorado de Patrocinador (+300 pts)</strong> o llenar la caldera, activarás el <strong>Escudo Rompehielos</strong> y mandarás los obstáculos a volar por los aires ganando <strong>+120 pts</strong> por cada demolición.",
      proTip: "¡Aprovecha el Turbo Vapor para embestir todos los obstáculos de la vía y duplicar tus puntos!",
      visualType: "turbo"
    }
  ];

  constructor(containerId: string = "polar-express-tutorial-modal", audio: AudioManager) {
    this.audio = audio;
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "ski-tutorial-modal-overlay polar-tutorial-theme hide";
      document.body.appendChild(el);
    }
    this.container = el;
    this.renderDOM();
    this.setupEvents();
  }

  public hasSeenTutorial(): boolean {
    return false;
  }

  public markTutorialSeen(): void {
    // Siempre mostrar
  }

  public show(step: number = 0): void {
    this.currentStep = Math.max(0, Math.min(step, this.steps.length - 1));
    this.isVisible = true;
    this.container.classList.remove("hide");
    this.container.style.display = "flex";

    this.renderStepContent();
    this.playEntranceAnimation();
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.clearStepTimers();

    gsap.to(this.container.querySelector(".ski-tutorial-card"), {
      scale: 0.9,
      opacity: 0,
      y: 20,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        this.isVisible = false;
        this.container.classList.add("hide");
        this.container.style.display = "none";
        if (this.onClose) this.onClose();
      }
    });
  }

  private renderDOM(): void {
    this.container.innerHTML = `
      <div class="ski-tutorial-backdrop"></div>
      <div class="ski-tutorial-card fantasy-modal-card">
        <div class="ski-snow-roof">
          <div class="ski-snow-cap"></div>
          <div class="ski-icicle icicle-1"></div>
          <div class="ski-icicle icicle-2"></div>
          <div class="ski-icicle icicle-3"></div>
        </div>

        <div class="ski-tutorial-header">
          <div class="ski-emblem-box">
            <img src="./assets/images/icon-expreso-polar.png" alt="Expreso Polar" class="ski-feria-seal" />
          </div>
          <div class="ski-header-title-wrap">
            <span class="ski-header-sub">FERIA MÁGICA DEL JUGUETE • FERROCARRIL REAL</span>
            <h2 class="ski-header-title">¡EL EXPRESO POLAR MÁGICO!</h2>
          </div>
          <button id="btn-polar-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <div class="ski-stepper-bar">
          ${this.steps
            .map(
              (_s, idx) => `
            <button class="ski-step-pill ${idx === 0 ? "active" : ""}" data-step="${idx}">
              <span class="step-num">${idx + 1}</span>
              <span class="step-name">${["El Expreso", "3 Vías", "Caldera", "Turbo Escudo"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <div class="ski-tutorial-body" id="polar-tutorial-body"></div>

        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-polar-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-polar-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-polar-play-now" class="btn-ski-action-play">
              <span>¡A TODA MÁQUINA!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#polar-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-polar-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-polar-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-polar-play-now");

    if (btnPrev) btnPrev.disabled = this.currentStep === 0;
    if (btnNext) btnNext.style.display = this.currentStep === this.steps.length - 1 ? "none" : "flex";
    if (btnPlay) {
      if (this.currentStep === this.steps.length - 1) {
        btnPlay.classList.add("pulse-highlight");
      } else {
        btnPlay.classList.remove("pulse-highlight");
      }
    }

    const pills = this.container.querySelectorAll(".ski-step-pill");
    pills.forEach((p, idx) => {
      p.classList.toggle("active", idx === this.currentStep);
      p.classList.toggle("completed", idx < this.currentStep);
    });

    body.innerHTML = `
      <div class="ski-step-view">
        <div class="ski-visual-column polar-stage-dark" id="polar-visual-stage">
          ${this.getVisualStageHTML(data.visualType)}
        </div>

        <div class="ski-info-column">
          <div class="ski-info-badge" style="border-color: ${data.badgeColor}; color: ${data.badgeColor};">
            ${data.badge}
          </div>
          <span class="ski-info-tag">${data.tag}</span>
          <h3 class="ski-info-headline">${data.title}</h3>
          <p class="ski-info-paragraph">${data.storyText}</p>

          <div class="ski-pro-tip-box">
            <div class="pro-tip-icon">
              ${getIconSvg("sparkles", { size: 20, color: "#FFD700" })}
            </div>
            <div class="pro-tip-text">
              <strong>CONSEJO DE MAQUINISTA:</strong> ${data.proTip}
            </div>
          </div>
        </div>
      </div>
    `;

    this.startStageAnimation(data.visualType);
  }

  private getVisualStageHTML(type: PolarExpressStepData["visualType"]): string {
    switch (type) {
      case "story":
        return `
          <div class="polar-demo-stage">
            <div class="polar-demo-badge-top">CONVOY OFICIAL • LOCOMOTORA + VAGÓN</div>
            <div class="polar-demo-rail-bed">
              <div class="polar-demo-convoy" id="polar-demo-convoy">
                <img src="./assets/images/vagon-expreso.png" alt="Vagón" class="polar-demo-wagon-img" />
                <div class="polar-demo-coupler"></div>
                <img src="./assets/images/locomotora-lateral.png" alt="Locomotora" class="polar-demo-loco-img" />
                <div class="polar-demo-beam"></div>
              </div>
              <div class="polar-demo-golden-rail"></div>
            </div>
            <img src="./assets/images/semaforo-tren.png" alt="Semáforo" class="polar-demo-signal-bg" />
          </div>
        `;

      case "tracks":
        return `
          <div class="polar-demo-stage polar-tracks-stage">
            <div class="polar-lanes-stack">
              <div class="polar-lane-row" id="polar-lane-0"><span class="polar-lane-chip">VÍA 1</span><div class="polar-lane-rail"></div></div>
              <div class="polar-lane-row active" id="polar-lane-1"><span class="polar-lane-chip">VÍA 2</span><div class="polar-lane-rail"></div></div>
              <div class="polar-lane-row" id="polar-lane-2"><span class="polar-lane-chip">VÍA 3</span><div class="polar-lane-rail"></div></div>
              <div class="polar-lane-mover" id="polar-lane-mover">
                <img src="./assets/images/vagon-expreso.png" alt="Vagón" class="mover-wagon" />
                <img src="./assets/images/locomotora-lateral.png" alt="Locomotora" class="mover-loco" />
              </div>
            </div>
            <div class="polar-controls-bar">
              <span class="polar-ctrl-hint">TOCA LA VÍA</span>
              <span class="polar-ctrl-sep">O USA</span>
              <div class="key-caps-pair">
                <span class="key-cap" id="polar-key-up">▲ / W</span>
                <span class="key-cap" id="polar-key-down">▼ / S</span>
              </div>
            </div>
          </div>
        `;

      case "boiler":
        return `
          <div class="polar-demo-stage polar-boiler-stage">
            <div class="polar-boiler-meter-card">
              <div class="polar-boiler-header">
                <span>CALDERA DE VAPOR</span>
                <span id="polar-boiler-pct" class="polar-boiler-pct">75%</span>
              </div>
              <div class="polar-boiler-bar-bg">
                <div class="polar-boiler-bar-fill" id="polar-boiler-fill"></div>
              </div>
            </div>
            <div class="polar-collectibles-row">
              <div class="polar-col-card">
                <img src="./assets/images/regalo-estilizado-rojo.png" alt="Regalo" />
                <span class="col-title">REGALOS</span>
                <span class="col-pts">+50 PTS • +14%</span>
              </div>
              <div class="polar-col-card">
                <img src="./assets/images/estrella con logo.png" alt="Estrella" />
                <span class="col-title">ESTRELLA</span>
                <span class="col-pts">+150 PTS • +30%</span>
              </div>
              <div class="polar-col-card station-col-card">
                <img src="./assets/images/semaforo-tren.png" alt="Estación" />
                <span class="col-title">ESTACIÓN 400m</span>
                <span class="col-pts">+250 BONO</span>
              </div>
            </div>
          </div>
        `;

      case "turbo":
        return `
          <div class="polar-demo-stage polar-turbo-stage">
            <div class="polar-turbo-split">
              <div class="polar-split-card">
                <div class="split-title-bar bar-danger">OBSTÁCULOS DE VÍA</div>
                <div class="polar-obstacles-mini">
                  <div class="polar-obs-item">
                    <img src="./assets/images/obstaculo-barrera-tren.png" alt="Barrera" />
                    <span>Barrera</span>
                  </div>
                  <div class="polar-obs-item">
                    <img src="./assets/images/obstaculo-muneco.png" alt="Muñeco" />
                    <span>Muñeco</span>
                  </div>
                  <div class="polar-obs-item">
                    <img src="./assets/images/obstaculo-cristal.png" alt="Cristal" />
                    <span>Cristal</span>
                  </div>
                </div>
                <div class="polar-danger-note">¡Quitan 1 vida si no llevas Turbo!</div>
              </div>

              <div class="polar-split-card">
                <div class="split-title-bar bar-turbo">ESCUDO ROMPEHIELOS</div>
                <div class="polar-turbo-showcase">
                  <img src="./assets/images/regalo-estilizado-dorado.png" alt="Regalo Dorado" class="polar-gold-gift" />
                  <div class="polar-smash-info">
                    <span class="polar-smash-badge">¡DEMOLICIÓN +120!</span>
                    <p>El Regalo Patrocinador o Caldera al 100% activa el escudo que lanza obstáculos por los aires.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
    }
  }

  private startStageAnimation(type: PolarExpressStepData["visualType"]): void {
    this.clearStepTimers();
    this.animTimeline = gsap.timeline();

    const infoItems = this.container.querySelectorAll(
      ".ski-info-badge, .ski-info-tag, .ski-info-headline, .ski-info-paragraph, .ski-pro-tip-box"
    );
    gsap.fromTo(
      infoItems,
      { opacity: 0, x: 18 },
      { opacity: 1, x: 0, duration: 0.32, stagger: 0.05, ease: "power2.out" }
    );

    if (type === "tracks") {
      const mover = this.container.querySelector<HTMLElement>("#polar-lane-mover");
      const rows = [
        this.container.querySelector<HTMLElement>("#polar-lane-0"),
        this.container.querySelector<HTMLElement>("#polar-lane-1"),
        this.container.querySelector<HTMLElement>("#polar-lane-2")
      ];
      const keyUp = this.container.querySelector<HTMLElement>("#polar-key-up");
      const keyDown = this.container.querySelector<HTMLElement>("#polar-key-down");

      const offsets = [-54, 0, 54];
      let idx = 1;
      let dir = -1;

      this.stepInterval = setInterval(() => {
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx > 2) {
          dir *= -1;
        }
        const prevIdx = idx;
        idx = idx + dir;

        rows.forEach((r, i) => r?.classList.toggle("active", i === idx));
        if (keyUp) keyUp.classList.toggle("key-active", idx < prevIdx);
        if (keyDown) keyDown.classList.toggle("key-active", idx > prevIdx);

        if (mover) {
          gsap.to(mover, {
            y: offsets[idx],
            duration: 0.42,
            ease: "power2.out"
          });
        }
      }, 1150);
    } else if (type === "boiler") {
      const fill = this.container.querySelector<HTMLElement>("#polar-boiler-fill");
      const pct = this.container.querySelector<HTMLElement>("#polar-boiler-pct");
      let val = 25;
      this.stepInterval = setInterval(() => {
        val = val >= 100 ? 25 : val + 25;
        if (fill) fill.style.width = `${val}%`;
        if (pct) pct.textContent = val >= 100 ? "¡100% TURBO!" : `${val}%`;
      }, 950);
    }
  }

  private clearStepTimers(): void {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
    if (this.animTimeline) {
      this.animTimeline.kill();
      this.animTimeline = null;
    }
  }

  private playEntranceAnimation(): void {
    const card = this.container.querySelector(".ski-tutorial-card");
    if (card) {
      gsap.fromTo(
        card,
        { scale: 0.88, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.36, ease: "back.out(1.4)" }
      );
    }
  }

  private setupEvents(): void {
    const btnClose = this.container.querySelector("#btn-polar-close-quick");
    const btnPrev = this.container.querySelector("#btn-polar-prev");
    const btnNext = this.container.querySelector("#btn-polar-next");
    const btnPlay = this.container.querySelector("#btn-polar-play-now");
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-polar-dont-show-again");

    btnClose?.addEventListener("click", () => {
      this.audio.playTap();
      if (chkDontShow?.checked) this.markTutorialSeen();
      this.hide();
    });

    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    btnNext?.addEventListener("click", () => {
      if (this.currentStep < this.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    btnPlay?.addEventListener("click", () => {
      this.audio.playGameStart();
      if (chkDontShow?.checked) this.markTutorialSeen();
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignorar
      }
      this.hide();
      if (this.onPlayGame) this.onPlayGame();
    });

    const pills = this.container.querySelectorAll(".ski-step-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const step = Number((pill as HTMLElement).dataset.step || 0);
        if (step !== this.currentStep) {
          this.audio.playTap();
          this.currentStep = step;
          this.renderStepContent();
        }
      });
    });
  }
}
