/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡ROMPE-HIELOS MÁGICO!
 * ==============================================================================
 *
 * Muestra la narrativa navideña de la Bóveda Glacial y enseña las mecánicas
 * renovadas con simulaciones animadas en tiempo real:
 *
 * 1. Capítulo 1 - La Bóveda Glacial: Juguetes atrapados en bloques de cristal.
 * 2. Capítulo 2 - Paleta Lanzadora & Mira: Control de ángulos y guía de tiro.
 * 3. Capítulo 3 - Bloques, Acorazados y Bumpers: Cristales, regalos y pinball.
 * 4. Capítulo 4 - 5 Súper Poderes & Patrocinadores: Fuego, Multi-Esfera y Cañón.
 *
 * Cero emojis. Arte Stylized 2D Game Art.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface IceBreakerStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  visualType: "story" | "controls" | "bricks" | "powers";
}

export class IceBreakerStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep = 0;
  private isVisible = false;
  private animTimeline: gsap.core.Timeline | null = null;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: IceBreakerStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡8 Bóvedas Glaciales y 1 Sola Vida!",
      badge: "SIN LÍMITE DE TIEMPO",
      badgeColor: "#00E5FF",
      storyText:
        "Una helada polar ha encerrado los juguetes de la <strong>Feria Mágica del Juguete</strong> a lo largo de <strong>8 niveles con formaciones únicas</strong> (<em>El Arco Polar, El Gran Pino de Cristal, El Corazón Navideño, La Fortaleza del Cascanueces, El Carrusel Móvil</em> y más). Juegas <strong>sin reloj</strong> pero con <strong>1 sola vida</strong>: si dejas caer todas las esferas activas al vacío, terminará tu partida.",
      proTip: "¡Superar cada formación te otorga +500 puntos de bonificación y desbloquea el siguiente diseño glacial!",
      visualType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES Y PUNTERÍA",
      title: "¡Domina la Paleta y el Ángulo de Rebote!",
      badge: "MIRA LÁSER & ÁNGULOS",
      badgeColor: "#FFD700",
      storyText:
        "Desliza tu dedo horizontalmente o usa las teclas <strong>[ ◄ / ► ]</strong> y <strong>[ A / D ]</strong> para desplazar la paleta. Antes de lanzar, usa la <strong>Guía de Trayectoria</strong> para apuntar tu primer disparo. Donde golpee la esfera en tu paleta determinará el ángulo: <strong>centro</strong> para rebotes verticales y <strong>extremos de cristal</strong> para tiros diagonales.",
      proTip: "¡Encadenar golpes seguidos sin perder la esfera eleva tu multiplicador de racha hasta x4!",
      visualType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • BLOQUES Y BUMPERS",
      title: "¡Hielo Acorazado y Bumpers de Pinball!",
      badge: "FORMACIONES GLACIALES",
      badgeColor: "#00E676",
      storyText:
        "Cada oleada presenta una formación distinta con <strong>Hielo Glacial (1 golpe)</strong>, <strong>Regalos Congelados (+95 pts)</strong> y <strong>Bloques Acorazados Dorados (2 golpes)</strong> que se agrietan antes de estallar. Además, los <strong>Bumpers Reboteadores Polares</strong> impulsan la esfera a toda velocidad otorgando <strong>+100 puntos</strong> por rebote.",
      proTip: "¡Apunta hacia la parte superior de la bóveda para que la esfera rebote sola entre los bloques y bumpers!",
      visualType: "bricks"
    },
    {
      tag: "CAPÍTULO 4 • SÚPER PODERES",
      title: "¡Cañón de Carámbanos, Fuego y Multi-Esfera!",
      badge: "5 CÁPSULAS MÁGICAS",
      badgeColor: "#FF9100",
      storyText:
        "Atrapa con tu paleta las cápsulas que caen de los bloques y <strong>Cofres de Patrocinador</strong>: activa <strong>Multi-Esfera x3</strong>, la <strong>Esfera de Fuego Solar</strong> que atraviesa bloques sin rebotar, el <strong>Cañón de Carámbanos</strong> que dispara ráfagas dobles desde tu paleta, la <strong>Paleta Gigante</strong> y el <strong>Escudo Glacial</strong> que protege el suelo.",
      proTip: "¡Romper un Cofre de Patrocinador activa automáticamente la Esfera de Fuego y lanza una cápsula Multi-Esfera!",
      visualType: "powers"
    }
  ];

  constructor(containerId: string = "ice-breaker-tutorial-modal", audio: AudioManager) {
    this.audio = audio;
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "ski-tutorial-modal-overlay ice-tutorial-theme hide";
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
            <img src="./assets/images/icon-rompe-hielos.png" alt="Rompe-Hielos" class="ski-feria-seal" />
          </div>
          <div class="ski-header-title-wrap">
            <span class="ski-header-sub">FERIA MÁGICA DEL JUGUETE • BÓVEDA DE CRISTAL</span>
            <h2 class="ski-header-title">¡ROMPE-HIELOS MÁGICO!</h2>
          </div>
          <button id="btn-ice-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <div class="ski-stepper-bar">
          ${this.steps
            .map(
              (_s, idx) => `
            <button class="ski-step-pill ${idx === 0 ? "active" : ""}" data-step="${idx}">
              <span class="step-num">${idx + 1}</span>
              <span class="step-name">${["Bóveda", "Paleta", "Bloques", "Poderes"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <div class="ski-tutorial-body" id="ice-tutorial-body"></div>

        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-ice-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-ice-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-ice-play-now" class="btn-ski-action-play">
              <span>¡A ROMPER EL HIELO!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#ice-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-ice-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-ice-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-ice-play-now");

    if (btnPrev) btnPrev.disabled = this.currentStep === 0;
    if (btnNext) btnNext.style.display = this.currentStep === this.steps.length - 1 ? "none" : "flex";
    if (btnPlay) {
      btnPlay.classList.toggle("pulse-highlight", this.currentStep === this.steps.length - 1);
    }

    const pills = this.container.querySelectorAll(".ski-step-pill");
    pills.forEach((p, idx) => {
      p.classList.toggle("active", idx === this.currentStep);
      p.classList.toggle("completed", idx < this.currentStep);
    });

    body.innerHTML = `
      <div class="ski-step-view">
        <div class="ski-visual-column ice-stage-dark" id="ice-visual-stage">
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
              <strong>CONSEJO GLACIAL:</strong> ${data.proTip}
            </div>
          </div>
        </div>
      </div>
    `;

    this.startStageAnimation(data.visualType);
  }

  private getVisualStageHTML(type: IceBreakerStepData["visualType"]): string {
    switch (type) {
      case "story":
        return `
          <div class="ice-demo-stage">
            <div class="polar-demo-badge-top">BÓVEDA GLACIAL • RESCATE DE JUGUETES</div>
            <div class="ice-demo-bricks-row">
              <img src="./assets/images/bloque-hielo-cristal.png" alt="Hielo" class="ice-demo-brick-img" />
              <img src="./assets/images/bloque-regalo-congelado.png" alt="Regalo" class="ice-demo-brick-img" />
              <img src="./assets/images/bloque-hielo-dorado.png" alt="Acorazado" class="ice-demo-brick-img" />
            </div>
            <div class="ice-demo-arena-mid">
              <img src="./assets/images/esfera-rompehielos.png" alt="Esfera" class="ice-demo-orb-img" id="ice-demo-orb" />
            </div>
            <img src="./assets/images/paleta-rompehielos.png" alt="Paleta" class="ice-demo-paddle-img" id="ice-demo-paddle" />
          </div>
        `;

      case "controls":
        return `
          <div class="ice-demo-stage">
            <div class="ice-aim-preview">
              <div class="ice-aim-ray" id="ice-aim-ray"></div>
              <img src="./assets/images/esfera-rompehielos.png" alt="Esfera" class="ice-aim-orb" />
              <img src="./assets/images/paleta-rompehielos.png" alt="Paleta" class="ice-demo-paddle-img" id="ice-ctrl-paddle" />
            </div>
            <div class="polar-controls-bar">
              <span class="polar-ctrl-hint">DESLIZA DEDO</span>
              <span class="polar-ctrl-sep">O USA</span>
              <div class="key-caps-pair">
                <span class="key-cap" id="ice-key-left">◄ / A</span>
                <span class="key-cap" id="ice-key-right">► / D</span>
              </div>
            </div>
          </div>
        `;

      case "bricks":
        return `
          <div class="ice-demo-stage">
            <div class="ice-bricks-showcase-grid">
              <div class="ice-brick-card">
                <img src="./assets/images/bloque-hielo-cristal.png" alt="Hielo Glacial" />
                <span class="b-title">HIELO GLACIAL</span>
                <span class="b-pts">1 GOLPE • +60 PTS</span>
              </div>
              <div class="ice-brick-card">
                <img src="./assets/images/bloque-regalo-congelado.png" alt="Regalo Congelado" />
                <span class="b-title">REGALO CONGELADO</span>
                <span class="b-pts">RESCATA JUGUETE • +95</span>
              </div>
              <div class="ice-brick-card">
                <img src="./assets/images/bloque-hielo-dorado.png" alt="Acorazado Dorado" />
                <span class="b-title">ACORAZADO DORADO</span>
                <span class="b-pts">2 GOLPES • +160 PTS</span>
              </div>
              <div class="ice-brick-card">
                <img src="./assets/images/bumper-polar.png" alt="Bumper Polar" class="bumper-spin-img" />
                <span class="b-title">BUMPER POLAR</span>
                <span class="b-pts">IMPULSO • +100 PTS</span>
              </div>
            </div>
          </div>
        `;

      case "powers":
        return `
          <div class="ice-demo-stage">
            <div class="ice-powers-grid">
              <div class="ice-power-pill">
                <img src="./assets/images/estrella con logo.png" alt="Multi-Esfera" />
                <div>
                  <strong>MULTI-ESFERA x3</strong>
                  <span>Divide tu tiro en 3 esferas mágicas</span>
                </div>
              </div>
              <div class="ice-power-pill">
                <img src="./assets/images/regalo-estilizado-dorado.png" alt="Esfera de Fuego" />
                <div>
                  <strong>ESFERA DE FUEGO SOLAR</strong>
                  <span>Derrite y atraviesa bloques sin rebotar</span>
                </div>
              </div>
              <div class="ice-power-pill">
                <img src="./assets/images/estalactita-hielo.png" alt="Cañón de Carámbanos" />
                <div>
                  <strong>CAÑÓN DE CARÁMBANOS</strong>
                  <span>Torretas dobles que disparan desde la paleta</span>
                </div>
              </div>
              <div class="ice-power-pill">
                <img src="./assets/images/baston-caramelo.png" alt="Paleta Gigante" />
                <div>
                  <strong>PALETA GIGANTE + ESCUDO</strong>
                  <span>Expande la paleta y protege el abismo</span>
                </div>
              </div>
            </div>
          </div>
        `;
    }
  }

  private startStageAnimation(type: IceBreakerStepData["visualType"]): void {
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

    if (type === "story") {
      const orb = this.container.querySelector<HTMLElement>("#ice-demo-orb");
      const paddle = this.container.querySelector<HTMLElement>("#ice-demo-paddle");
      if (orb && paddle) {
        gsap.to(paddle, {
          x: 34,
          duration: 1.1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.fromTo(
          orb,
          { y: 26, x: -25 },
          { y: -32, x: 25, duration: 0.65, repeat: -1, yoyo: true, ease: "power1.inOut" }
        );
      }
    } else if (type === "controls") {
      const paddle = this.container.querySelector<HTMLElement>("#ice-ctrl-paddle");
      const ray = this.container.querySelector<HTMLElement>("#ice-aim-ray");
      const kL = this.container.querySelector<HTMLElement>("#ice-key-left");
      const kR = this.container.querySelector<HTMLElement>("#ice-key-right");
      let leftDir = true;
      this.stepInterval = setInterval(() => {
        leftDir = !leftDir;
        kL?.classList.toggle("key-active", leftDir);
        kR?.classList.toggle("key-active", !leftDir);
        if (paddle) {
          gsap.to(paddle, { x: leftDir ? -38 : 38, duration: 0.55, ease: "power2.out" });
        }
        if (ray) {
          gsap.to(ray, { rotate: leftDir ? -24 : 24, duration: 0.55, ease: "power2.out" });
        }
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
    const btnClose = this.container.querySelector("#btn-ice-close-quick");
    const btnPrev = this.container.querySelector("#btn-ice-prev");
    const btnNext = this.container.querySelector("#btn-ice-next");
    const btnPlay = this.container.querySelector("#btn-ice-play-now");
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-ice-dont-show-again");

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
