/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡TAMBORES DEL CASCANUECES!
 * ==============================================================================
 *
 * Muestra la historia del Pequeño Elfo Baterista y enseña a dominar la percusión
 * estilo Taiko (Call & Response) con una experiencia 100% visual y sin fondos blancos:
 *
 * 1. Capítulo 1 - El Concierto del Cascanueces: Ensayo general en la Nochebuena.
 * 2. Capítulo 2 - Los 3 Tambores Mágicos: DON (Rojo), STAR (Dorado) y KA (Azul).
 * 3. Capítulo 3 - ¡Escucha y Repite!: La mecánica rítmica de turno del elfo y tu turno.
 * 4. Capítulo 4 - Modo Fiebre & 10 Rondas: Combos, multiplicadores y maestría.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface NutcrackerTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "drums" | "call_response" | "fever";
}

export class NutcrackerDrumsStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: NutcrackerTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Gran Concierto del Cascanueces!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "En la víspera de Navidad, el <strong>Pequeño Elfo Baterista</strong> afina sus instrumentos en el escenario del Palacio de Juguetes para la marcha sinfónica del Cascanueces. Para sincronizar la orquesta de Santa, necesita un aprendiz con buen oído que responda a sus repiques rítmicos. ¡Toma tus baquetas mágicas y sigue el compás festivo!",
      proTip: "¡Escucha atentamente el timbre de cada tambor: el sonido te ayudará a memorizar!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • LOS 3 TAMBORES",
      title: "¡DON, STAR y KA!",
      badge: "INSTRUMENTOS MÁGICOS",
      badgeColor: "#00E5FF",
      storyText:
        "El set de percusión cuenta con 3 tambores táctiles únicos:<br>" +
        "• <strong>Tambor Rojo (DON):</strong> Golpe grave y potente. Tecla <strong>[ D / 1 ]</strong> o pad izquierdo.<br>" +
        "• <strong>Tambor Dorado (STAR):</strong> Platillo brillante y cascabel. Tecla <strong>[ F / Espacio / 2 ]</strong> o pad central.<br>" +
        "• <strong>Tambor Azul (KA):</strong> Golpe agudo y cristalino de aro. Tecla <strong>[ K / 3 ]</strong> o pad derecho.",
      proTip: "¡En tótem o móvil, coloca tus dedos sobre los 3 círculos inferiores para una respuesta instantánea!",
      stageType: "drums"
    },
    {
      tag: "CAPÍTULO 3 • ¡ESCUCHA Y REPITE!",
      title: "¡Mecánica Rítmica por Turnos!",
      badge: "CALL & RESPONSE",
      badgeColor: "#00E676",
      storyText:
        "Cada ronda se divide en 2 fases clave:<br>" +
        "• <strong>1. ¡TURNO DEL ELFO!</strong> El elfo baterista tocará una secuencia rítmica con sus baquetas y las notas se iluminarán en la barra superior.<br>" +
        "• <strong>2. ¡TU TURNO!</strong> En cuanto el elfo termine, repite la secuencia exacta en los tambores antes de que se agote la barra de tiempo.<br>" +
        "¡Si tocas todas las notas correctas, la sala estallará en aplausos y fuegos artificiales!",
      proTip: "¡Espera a que el elfo termine su último golpe antes de tocar tu primera nota!",
      stageType: "call_response"
    },
    {
      tag: "CAPÍTULO 4 • MODO FIEBRE Y RONDAS",
      title: "¡Combos Legendarios y 10 Rondas!",
      badge: "MAESTRÍA RÍTMICA",
      badgeColor: "#FF9100",
      storyText:
        "¡Entre más rondas superes, más rápida y larga será la melodía!<br>" +
        "• <strong>Racha Imparable:</strong> Acertar rondas seguidas aumentará tu multiplicador (<strong>x2, x3 y x4</strong>).<br>" +
        "• <strong>Modo Fiebre Rítmica:</strong> Al alcanzar combos altos, los tambores despedirán chispas doradas y tus puntos se duplicarán.<br>" +
        "• <strong>Cuidado con los Fallos:</strong> Tocar el tambor equivocado romperá tu racha de inmediato.",
      proTip: "¡Tararear mentalmente el ritmo (Don-Star-Ka) te ayudará en secuencias largas!",
      stageType: "fever"
    }
  ];

  constructor(containerId: string = "nutcracker-drums-tutorial-modal", audio: AudioManager) {
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
            <img src="./assets/images/medallon-feria.webp" alt="Feria Mágica" class="ski-feria-seal" />
          </div>
          <div class="ski-header-title-wrap">
            <span class="ski-header-sub">FERIA MÁGICA DEL JUGUETE</span>
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: TAMBORES DEL CASCANUECES!</h2>
          </div>
          <button id="btn-drums-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
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
              <span class="step-name">${["Historia", "3 Tambores", "¡Tu Turno!", "Modo Fiebre"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="drums-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-drums-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-drums-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-drums-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#drums-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-drums-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-drums-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-drums-play-now");

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

    // Renderizar escenario visual personalizado de Nutcracker Drums
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-drums-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Escenario Teatral con Elfo Baterista -->
            <div class="drums-story-scene">
              <div class="drums-spotlight-beam"></div>
              <div class="drums-elf-hero-box">
                <img src="./assets/images/elfo-baterista.webp" alt="Elfo Baterista" class="drums-elf-sprite" />
                <div class="drums-musical-notes-fx">
                  <span class="note-fx note-fx-1">${getIconSvg("music", { size: 16, color: "#FF2A4D" })}</span>
                  <span class="note-fx note-fx-2">${getIconSvg("sparkles", { size: 16, color: "#FFD700" })}</span>
                  <span class="note-fx note-fx-3">${getIconSvg("music", { size: 16, color: "#00E5FF" })}</span>
                </div>
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡SIGUE EL RITMO DEL CASCANUECES!</span>
            </div>
          </div>
        `;
        break;

      case "drums":
        visualHTML = `
          <div class="ski-stage stage-drums-instruments">
            <!-- 3 Tambores Táctiles en Acción -->
            <div class="drums-trio-display">
              <div class="drum-demo-pad pad-red" id="pad-sim-0">
                <div class="pad-rim">
                  <div class="pad-head">
                    <span class="pad-title">DON</span>
                    <span class="pad-sub">GRAVE</span>
                  </div>
                </div>
                <div class="pad-key-badge">D / 1</div>
              </div>

              <div class="drum-demo-pad pad-gold" id="pad-sim-1">
                <div class="pad-rim">
                  <div class="pad-head">
                    <span class="pad-title">STAR</span>
                    <span class="pad-sub">PLATILLO</span>
                  </div>
                </div>
                <div class="pad-key-badge">F / ESPACIO</div>
              </div>

              <div class="drum-demo-pad pad-blue" id="pad-sim-2">
                <div class="pad-rim">
                  <div class="pad-head">
                    <span class="pad-title">KA</span>
                    <span class="pad-sub">AGUDO</span>
                  </div>
                </div>
                <div class="pad-key-badge">K / 3</div>
              </div>
            </div>

            <!-- Guía de periféricos -->
            <div class="controls-overlay-cues drums-cues">
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL / TÓTEM</span>
                <span class="cue-hint">Toca directamente cada tambor</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair">
                  <span class="key-cap key-cap-red">D</span>
                  <span class="key-cap key-cap-gold">F / ESP</span>
                  <span class="key-cap key-cap-blue">K</span>
                </div>
                <span class="cue-hint">O usa los números [ 1 / 2 / 3 ]</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "call_response":
        visualHTML = `
          <div class="ski-stage stage-drums-call-response">
            <!-- Barra de Secuencia Superior -->
            <div class="drums-seq-bar-demo">
              <div class="seq-bar-header">
                <span class="seq-turn-badge" id="demo-turn-badge">TURNO DEL ELFO: ¡MIRA Y ESCUCHA!</span>
              </div>
              <div class="seq-notes-track">
                <div class="seq-note-ball ball-red" id="seq-note-0">DON</div>
                <div class="seq-note-ball ball-gold" id="seq-note-1">STAR</div>
                <div class="seq-note-ball ball-blue" id="seq-note-2">KA</div>
                <div class="seq-note-ball ball-red" id="seq-note-3">DON</div>
              </div>
            </div>

            <!-- Mini Escena de Repetición -->
            <div class="drums-call-response-split">
              <div class="call-card card-elf-turn">
                <span class="turn-title">1. EL ELFO TOCA</span>
                <img src="./assets/images/elfo-baterista.webp" alt="Elfo" class="turn-elf-mini" />
                <span class="turn-desc">Observa el orden de notas</span>
              </div>
              <div class="call-card card-player-turn">
                <span class="turn-title title-gold">2. ¡TU TURNO!</span>
                <div class="turn-hands-icon">${getIconSvg("gamepad", { size: 30, color: "#FFD700" })}</div>
                <span class="turn-desc">Repite en los tambores</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "fever":
        visualHTML = `
          <div class="ski-stage stage-drums-fever">
            <div class="drums-fever-grid">
              <!-- Indicador Modo Fiebre -->
              <div class="fever-card card-fever-status">
                <span class="fever-title">MODO FIEBRE RÍTMICA</span>
                <div class="fever-mult-badge">
                  <span class="fever-mult-num">x3</span>
                  <span class="fever-mult-txt">PUNTOS DOBLES</span>
                </div>
                <span class="fever-hint">¡Actívalo encadenando rondas perfectas!</span>
              </div>

              <!-- Progreso de Rondas -->
              <div class="fever-card card-rounds-status">
                <span class="fever-title">DESAFÍO PROGRESIVO</span>
                <div class="rounds-stepper-visual">
                  <span class="round-dot dot-done">1</span>
                  <span class="round-dot dot-done">2</span>
                  <span class="round-dot dot-active">3</span>
                  <span class="round-dot">...</span>
                  <span class="round-dot dot-boss">10</span>
                </div>
                <span class="fever-hint">10 Rondas con velocidad ascendente</span>
              </div>
            </div>

            <!-- Alerta de precisión -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">ATENCIÓN:</span>
              <div class="drums-precision-pill">
                ${getIconSvg("shield", { size: 16, color: "#00E5FF" })}
                <span>¡UN FALLO REINICIA TU COMBO!</span>
              </div>
              <span class="lives-hint">¡Tómate un instante para recordar la melodía!</span>
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
      const elf = this.container.querySelector(".drums-elf-sprite");
      if (elf) {
        gsap.to(elf, {
          y: -8,
          rotation: 3,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
      const notes = this.container.querySelectorAll(".note-fx");
      notes.forEach((n, idx) => {
        gsap.to(n, {
          y: -14,
          opacity: 0.3,
          duration: 1.1 + idx * 0.3,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: idx * 0.2
        });
      });
    } else if (data.stageType === "drums") {
      // Simular repiques sucesivos en DON, STAR, KA con sus sonidos reales
      const pads = [
        this.container.querySelector<HTMLElement>("#pad-sim-0"),
        this.container.querySelector<HTMLElement>("#pad-sim-1"),
        this.container.querySelector<HTMLElement>("#pad-sim-2")
      ];

      let padIdx = 0;
      this.stepInterval = setInterval(() => {
        const curPad = pads[padIdx % 3];
        if (curPad) {
          if (padIdx % 3 === 0) {
            this.audio.playDrumDon();
          } else if (padIdx % 3 === 1) {
            this.audio.playDrumGold();
          } else {
            this.audio.playDrumKa();
          }

          gsap.fromTo(
            curPad,
            { scale: 1.15, filter: "brightness(1.8)" },
            { scale: 1, filter: "brightness(1)", duration: 0.35, ease: "back.out(2)" }
          );
        }
        padIdx++;
      }, 750);
    } else if (data.stageType === "call_response") {
      // Animar secuencia iluminándose
      const badge = this.container.querySelector<HTMLElement>("#demo-turn-badge");
      const notes = [
        this.container.querySelector<HTMLElement>("#seq-note-0"),
        this.container.querySelector<HTMLElement>("#seq-note-1"),
        this.container.querySelector<HTMLElement>("#seq-note-2"),
        this.container.querySelector<HTMLElement>("#seq-note-3")
      ];

      let noteIdx = 0;
      let isPlayerTurn = false;
      this.stepInterval = setInterval(() => {
        if (!isPlayerTurn) {
          if (badge) badge.innerText = "1. TURNO DEL ELFO: ¡MIRA Y ESCUCHA!";
          notes.forEach((n) => n?.classList.remove("active-note"));
          const curNote = notes[noteIdx % 4];
          curNote?.classList.add("active-note");
          if (noteIdx % 4 === 3) {
            isPlayerTurn = true;
          }
        } else {
          if (badge) badge.innerText = "2. ¡TU TURNO! REPITE EN LOS TAMBORES";
          notes.forEach((n) => n?.classList.add("active-note"));
          isPlayerTurn = false;
        }
        noteIdx++;
      }, 800);
    } else if (data.stageType === "fever") {
      const mult = this.container.querySelector(".fever-mult-num");
      if (mult) {
        gsap.fromTo(
          mult,
          { scale: 0.9 },
          { scale: 1.15, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" }
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
    const btnQuickClose = this.container.querySelector("#btn-drums-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-drums-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-drums-next");
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

    const btnPlay = this.container.querySelector("#btn-drums-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FF2A4D", "#FFD700", "#00E5FF", "#00E676"]
        });
      } catch {
        // Ignorar si no está disponible
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-drums-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-drums-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
