/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡EL CAOS DEL TALLER MÁGICO!
 * ==============================================================================
 *
 * Muestra la historia de la fábrica de Santa y enseña a atrapar los juguetes
 * en vuelo con una experiencia 100% visual, animada y sin fondos blancos:
 *
 * 1. Capítulo 1 - ¡Sobrecarga en la Fábrica!: La máquina expulsando juguetes.
 * 2. Capítulo 2 - Reflejos & Toque al Vuelo: Cómo tocar los juguetes en el aire.
 * 3. Capítulo 3 - Regalos Dorados & Logos: Carritos, robots y marcas oficiales.
 * 4. Capítulo 4 - Trampas & Modo Fiebre: Carbón ardiente y lluvia dorada x2.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface WorkshopTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "controls" | "toys" | "hazards";
}

export class WorkshopChaosStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: WorkshopTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡Emergencia en la Fábrica de Santa!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "¡Alerta máxima en el Polo Norte! La gran máquina ensambladora de Santa ha sufrido una <strong>sobrecarga mágica de vapor</strong> por el exceso de pedidos de Nochebuena. ¡Cientos de ositos, robots, carritos y regalos están saliendo disparados por los aires! Santa necesita tus reflejos de duende para atrapar los juguetes antes de que caigan al suelo y se rompan.",
      proTip: "¡Los juguetes alcanzan su punto más fácil de atrapar en la cima de su salto!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • REFLEJOS Y TOQUE AL VUELO",
      title: "¡Toca Rápido para Rescatarlos!",
      badge: "REFLEJOS ARCADE",
      badgeColor: "#00E5FF",
      storyText:
        "El ritmo es frenético y emocionante:<br>" +
        "• <strong>TOCA CADA JUGUETE:</strong> Toca directamente sobre cualquier regalo o muñeco mientras vuela por la pantalla.<br>" +
        "• <strong>COMBOS CON SONIDO ASCENDENTE:</strong> Tocar juguetes seguidos sin fallar elevará el tono musical y activará multiplicadores de racha (<strong>x1.5, x2 y x3</strong>).<br>" +
        "• ¡Aprovecha la pantalla táctil usando varios dedos a la vez para no dejar escapar ninguno!",
      proTip: "¡Puedes usar ambas manos para atrapar juguetes en los extremos de la pantalla!",
      stageType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • JUGUETES Y REGALOS CON LOGO",
      title: "¡Carritos, Robots y Cajas Doradas!",
      badge: "PUNTUACIÓN MÁXIMA",
      badgeColor: "#00E676",
      storyText:
        "Cada creación tiene un valor especial en la fábrica:<br>" +
        "• <strong>Cajas Festivas (Rojas, Verdes, Azules):</strong> <strong>+10 pts</strong>.<br>" +
        "• <strong>Ositos de Peluche y Robots:</strong> <strong>+15 a +20 pts</strong>.<br>" +
        "• <strong>Coches de Juguete:</strong> <strong>+25 pts</strong>.<br>" +
        "• <strong>Regalo Dorado con Logo de Patrocinador:</strong> <strong>+50 pts</strong> y recarga masivamente tu <strong>Barra de Fiebre</strong>.",
      proTip: "¡Los regalos dorados son prioritarios: suman el quíntuple y activan la Fiebre!",
      stageType: "toys"
    },
    {
      tag: "CAPÍTULO 4 • TRAMPAS Y MODO FIEBRE",
      title: "¡Cuidado con el Carbón y Fiebre x2!",
      badge: "FRENESÍ DE ORO",
      badgeColor: "#FF9100",
      storyText:
        "¡No toques todo lo que brilla! Evita las trampas de la máquina:<br>" +
        "• <strong>Carbón Ardiente:</strong> <strong>-30 pts</strong>, sacudida de pantalla y rompe tu combo rítmico.<br>" +
        "• <strong>Regalo Defectuoso:</strong> <strong>-25 pts</strong> y explosión de humo.<br>" +
        "• <strong>MODO FIEBRE DE JUGUETES:</strong> Cuando tu barra llegue al 100%, se desatarán <strong>6 segundos de lluvia continua de regalos dorados</strong> con puntos dobles (<strong>x2</strong>) y cero peligros.",
      proTip: "¡En Modo Fiebre toca la pantalla a máxima velocidad sin miedo a equivocarte!",
      stageType: "hazards"
    }
  ];

  constructor(containerId: string = "workshop-chaos-tutorial-modal", audio: AudioManager) {
    this.audio = audio;
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "ski-tutorial-modal-overlay hide";
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

    const card = this.container.querySelector(".ski-tutorial-card");
    if (card) {
      gsap.to(card, {
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
    } else {
      this.isVisible = false;
      this.container.classList.add("hide");
      this.container.style.display = "none";
    }
  }

  private renderDOM(): void {
    this.container.innerHTML = `
      <div class="ski-tutorial-backdrop"></div>
      <div class="ski-tutorial-card fantasy-modal-card">
        <!-- Nieve y tejado invernal decorativo -->
        <div class="ski-snow-roof">
          <div class="ski-snow-cap"></div>
          <div class="ski-icicle icicle-1"></div>
          <div class="ski-icicle icicle-2"></div>
          <div class="ski-icicle icicle-3"></div>
        </div>

        <!-- Encabezado con medallón oficial -->
        <div class="ski-tutorial-header">
          <div class="ski-emblem-box">
            <img src="./assets/images/medallon-feria.png" alt="Feria Mágica" class="ski-feria-seal" />
          </div>
          <div class="ski-header-title-wrap">
            <span class="ski-header-sub">FERIA MÁGICA DEL JUGUETE</span>
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: CAOS EN EL TALLER!</h2>
          </div>
          <button id="btn-workshop-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <!-- Barra de progreso de capítulos -->
        <div class="ski-stepper-bar">
          ${this.steps
            .map(
              (_s, idx) => `
            <button class="ski-step-pill ${idx === 0 ? "active" : ""}" data-step="${idx}">
              <span class="step-num">${idx + 1}</span>
              <span class="step-name">${["Historia", "Reflejos", "Juguetes", "Fiebre x2"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="workshop-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-workshop-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-workshop-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-workshop-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#workshop-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-workshop-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-workshop-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-workshop-play-now");

    if (btnPrev) btnPrev.disabled = this.currentStep === 0;
    if (btnNext) btnNext.style.display = this.currentStep === this.steps.length - 1 ? "none" : "flex";
    if (btnPlay) {
      if (this.currentStep === this.steps.length - 1) {
        btnPlay.classList.add("pulse-highlight");
      } else {
        btnPlay.classList.remove("pulse-highlight");
      }
    }

    // Actualizar pills del stepper
    const pills = this.container.querySelectorAll(".ski-step-pill");
    pills.forEach((p, idx) => {
      if (idx === this.currentStep) {
        p.classList.add("active");
      } else if (idx < this.currentStep) {
        p.classList.add("completed");
        p.classList.remove("active");
      } else {
        p.classList.remove("active", "completed");
      }
    });

    // Renderizar escenario visual personalizado de Workshop Chaos
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-workshop-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Fábrica con Chutes y Juguetes Volando -->
            <div class="workshop-story-scene">
              <div class="workshop-machine-base">
                <div class="machine-gear-glow"></div>
                <div class="machine-chutes-row">
                  <div class="chute-pipe"></div>
                  <div class="chute-pipe pipe-center"></div>
                  <div class="chute-pipe"></div>
                </div>
              </div>
              <div class="workshop-flying-toys-cluster">
                <img src="./assets/images/regalo-estilizado-dorado.png" alt="Dorado" class="flying-toy toy-1" />
                <img src="./assets/images/robot.png" alt="Robot" class="flying-toy toy-2" />
                <img src="./assets/images/osito.png" alt="Osito" class="flying-toy toy-3" />
                <img src="./assets/images/coche-juguete.png" alt="Coche" class="flying-toy toy-4" />
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.png" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡RESCATA LOS JUGUETES ANTES DE QUE CAIGAN!</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-workshop-controls">
            <!-- Pista animada de toque al vuelo con feedback de combo -->
            <div class="workshop-touch-demo-stage">
              <div class="demo-flying-target" id="demo-fly-toy">
                <img src="./assets/images/robot.png" alt="Robot Volando" class="demo-toy-img" />
                <div class="demo-tap-burst" id="demo-tap-burst">
                  ${getIconSvg("sparkles", { size: 28, color: "#FFD700" })}
                </div>
              </div>
              <div class="demo-tap-hand" id="demo-tap-hand">
                ${getIconSvg("gamepad", { size: 26, color: "#00E5FF" })}
              </div>
              <div class="demo-combo-popup" id="demo-combo-popup">
                <span>+20 ¡COMBO x3!</span>
              </div>
            </div>

            <!-- Guía de acción -->
            <div class="controls-overlay-cues workshop-cues">
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL MULTITÁCTIL</span>
                <span class="cue-hint">Toca cualquier juguete en el aire</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="keys-cue-box">
                <span class="cue-label">RACHA DE COMBOS</span>
                <div class="workshop-combo-pill">
                  ${getIconSvg("sparkles", { size: 14, color: "#00E5FF" })}
                  <span>¡SONIDO ASCENDENTE!</span>
                </div>
              </div>
            </div>
          </div>
        `;
        break;

      case "toys":
        visualHTML = `
          <div class="ski-stage stage-workshop-toys">
            <div class="workshop-toys-grid">
              <!-- Cajas clásicas -->
              <div class="toy-point-card card-classic">
                <div class="point-badge-tag">+10 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/regalo-estilizado-rojo.png" alt="Regalo Rojo" />
                  <img src="./assets/images/regalo-estilizado-verde.png" alt="Regalo Verde" />
                </div>
                <span class="point-label">Cajas Clásicas</span>
              </div>

              <!-- Juguetes mecánicos -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+15 A +25 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/robot.png" alt="Robot" />
                  <img src="./assets/images/coche-juguete.png" alt="Coche" />
                </div>
                <span class="point-label">Robots & Coches</span>
              </div>

              <!-- Regalo Dorado / Patrocinador -->
              <div class="toy-point-card card-star">
                <div class="point-badge-tag tag-gold">+50 PTS • CARGA FIEBRE</div>
                <div class="point-single-star">
                  <img src="./assets/images/regalo-estilizado-dorado.png" alt="Regalo Dorado" class="star-pulse-img" />
                </div>
                <span class="point-label">¡Logos de Patrocinador!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards":
        visualHTML = `
          <div class="ski-stage stage-workshop-hazards">
            <div class="workshop-hazard-split">
              <!-- Carbón ardiente -->
              <div class="hazard-card card-coal">
                <div class="hazard-title-badge">CARBÓN ARDIENTE</div>
                <img src="./assets/images/carbon.webp" alt="Carbón" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-30 PTS • ROMPE COMBO</span>
              </div>

              <!-- Regalo defectuoso -->
              <div class="hazard-card card-defective">
                <div class="hazard-title-badge badge-ice">CAJA DEFECTUOSA</div>
                <img src="./assets/images/regalo-defectuoso.png" alt="Defectuoso" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-25 PTS • HUMO Y EXPLOSIÓN</span>
              </div>
            </div>

            <!-- Barra de Fiebre de Juguetes -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">FIEBRE DE JUGUETES:</span>
              <div class="workshop-fever-badge">
                ${getIconSvg("sparkles", { size: 16, color: "#FFD700" })}
                <span>¡LLUVIA DORADA x2 SIN ENEMIGOS!</span>
              </div>
              <span class="lives-hint">¡Llena la barra al 100% atrapando regalos dorados!</span>
            </div>
          </div>
        `;
        break;
    }

    body.innerHTML = `
      <div class="ski-step-view">
        <div class="ski-visual-column">
          ${visualHTML}
        </div>
        <div class="ski-info-column">
          <div class="ski-info-badge" style="border-color: ${data.badgeColor}; color: ${data.badgeColor}">
            ${data.badge}
          </div>
          <span class="ski-info-tag">${data.tag}</span>
          <h3 class="ski-info-title">${data.title}</h3>
          <p class="ski-info-story">${data.storyText}</p>
          <div class="ski-info-protip">
            <span class="protip-icon">${getIconSvg("sparkles", { size: 18, color: "#FFD700" })}</span>
            <span class="protip-text"><strong>CONSEJO MAESTRO:</strong> ${data.proTip}</span>
          </div>
        </div>
      </div>
    `;

    this.startStepAnimation();
  }

  private startStepAnimation(): void {
    const data = this.steps[this.currentStep];

    if (data.stageType === "story") {
      const toys = this.container.querySelectorAll(".workshop-flying-toys-cluster img");
      toys.forEach((t, i) => {
        gsap.to(t, {
          y: -18,
          rotation: i % 2 === 0 ? 12 : -12,
          duration: 1.2 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: i * 0.15
        });
      });
    } else if (data.stageType === "controls") {
      // Simular juguete volando en arco, mano tocando y explosión de puntos
      const toy = this.container.querySelector<HTMLElement>("#demo-fly-toy");
      const hand = this.container.querySelector<HTMLElement>("#demo-tap-hand");
      const burst = this.container.querySelector<HTMLElement>("#demo-tap-burst");
      const popup = this.container.querySelector<HTMLElement>("#demo-combo-popup");

      let phase = 0;
      this.stepInterval = setInterval(() => {
        if (phase === 0) {
          // Juguete saliendo del chute y subiendo
          if (toy) {
            gsap.fromTo(toy, { y: 60, scale: 0.8, opacity: 1 }, { y: -20, scale: 1.1, duration: 0.5, ease: "power1.out" });
          }
          if (hand) {
            gsap.fromTo(hand, { x: 30, y: 30, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.4 });
          }
          if (burst) burst.style.opacity = "0";
          if (popup) popup.style.opacity = "0";
          phase = 1;
        } else if (phase === 1) {
          // Toque en el aire e impacto
          this.audio.playCatchItem(1.2);
          if (burst) {
            gsap.fromTo(burst, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.4, duration: 0.2 });
          }
          if (popup) {
            gsap.fromTo(popup, { opacity: 0, y: 0 }, { opacity: 1, y: -18, duration: 0.35 });
          }
          if (toy) {
            gsap.to(toy, { scale: 1.3, opacity: 0, duration: 0.25 });
          }
          phase = 2;
        } else {
          phase = 0;
        }
      }, 1050);
    } else if (data.stageType === "toys") {
      const goldGift = this.container.querySelector(".star-pulse-img");
      if (goldGift) {
        gsap.to(goldGift, { scale: 1.15, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
    } else if (data.stageType === "hazards") {
      const fever = this.container.querySelector(".workshop-fever-badge");
      if (fever) {
        gsap.fromTo(
          fever,
          { scale: 0.95 },
          { scale: 1.06, duration: 0.75, repeat: -1, yoyo: true, ease: "sine.inOut" }
        );
      }
    }
  }

  private clearStepTimers(): void {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  private playEntranceAnimation(): void {
    const card = this.container.querySelector(".ski-tutorial-card");
    if (!card) return;

    gsap.fromTo(
      card,
      { scale: 0.85, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.2)" }
    );
  }

  private setupEvents(): void {
    const btnQuickClose = this.container.querySelector("#btn-workshop-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-workshop-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-workshop-next");
    btnNext?.addEventListener("click", () => {
      if (this.currentStep < this.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    const pills = this.container.querySelectorAll(".ski-step-pill");
    pills.forEach((p) => {
      p.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const step = parseInt(target.getAttribute("data-step") || "0", 10);
        this.audio.playTap();
        this.currentStep = step;
        this.renderStepContent();
      });
    });

    const btnPlay = this.container.querySelector("#btn-workshop-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FFD700", "#FF2A4D", "#00E5FF", "#00E676"]
        });
      } catch {
        // Ignorar si no está disponible
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-workshop-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-workshop-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
