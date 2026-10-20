/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡PAREJAS MÁGICAS DE JUGUETES!
 * ==============================================================================
 *
 * Muestra la historia del Cofre Encantado de Santa y enseña a jugar
 * con una experiencia 100% visual, animada y sin fondos blancos:
 *
 * 1. Capítulo 1 - El Secreto del Cofre: La mezcla mágica de juguetes.
 * 2. Capítulo 2 - Volteo 3D & Acierto: Cómo girar cartas y encontrar gemelos.
 * 3. Capítulo 3 - Cartas Doradas & Logos: Puntos, Elfos y poderes de patrocinador.
 * 4. Capítulo 4 - Niveles & Contrarreloj: Progresión de 4 a 12 cartas contra el tiempo.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface MagicPairsTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "flip" | "special_cards" | "levels";
}

export class MagicPairsStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: MagicPairsTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Gran Desafío de la Memoria!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "En la víspera de Navidad, Santa guarda en su <strong>Cofre Encantado</strong> las cartas doradas con los prototipos de juguetes más valiosos y los sellos mágicos de la Feria. Pero un elfo bromista mezcló todas las cartas y las puso boca abajo. ¡Santa necesita tu memoria mágica para emparejar cada juguete antes de que el reloj marque la medianoche!",
      proTip: "¡Presta atención a cada carta revelada para recordar dónde quedó su gemelo!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • VOLTEO 3D Y PAREJAS",
      title: "¡Toca para Girar y Emparejar!",
      badge: "MECÁNICA TÁCTIL",
      badgeColor: "#00E5FF",
      storyText:
        "Toca cualquier carta para girarla en 3D y descubrir el juguete que oculta. Luego, toca una segunda carta buscando su pareja idéntica:<br>" +
        "• <strong>¡PAREJA CORRECTA!</strong> Las cartas brillarán en esmeralda y se quedarán descubiertas (<strong>+200 a +500 pts</strong>).<br>" +
        "• <strong>FALLO:</strong> Si no coinciden, se volverán a voltear boca abajo. ¡Memoriza sus posiciones!",
      proTip: "¡Si descubres una carta que ya viste antes, ve directo a emparejarla sin dudar!",
      stageType: "flip"
    },
    {
      tag: "CAPÍTULO 3 • SELLOS Y LOGOS ESPECIALES",
      title: "¡Elfos, Estrellas y Patrocinadores!",
      badge: "PUNTUACIÓN MÁXIMA",
      badgeColor: "#00E676",
      storyText:
        "No todas las cartas valen lo mismo:<br>" +
        "• <strong>Juguetes Clásicos (Ositos, Robots, Dulces):</strong> <strong>+200 pts</strong>.<br>" +
        "• <strong>Elfo Volador:</strong> <strong>+300 pts</strong>.<br>" +
        "• <strong>Cartas con Estrella Dorada y Logos Oficiales:</strong> <strong>+500 pts</strong> y activan un <strong>Poder Especial de Patrocinador</strong> con explosión de confeti y bonus festivo.",
      proTip: "¡Las cartas con logo oficial otorgan más del doble de puntos que las cartas estándar!",
      stageType: "special_cards"
    },
    {
      tag: "CAPÍTULO 4 • NIVELES Y CONTRARRELOJ",
      title: "¡Tableros Crecientes y Tiempo!",
      badge: "DESAFÍO PROGRESIVO",
      badgeColor: "#FF9100",
      storyText:
        "El juego premia la rapidez y la concentración mental:<br>" +
        "• <strong>Nivel 1:</strong> Tablero inicial rápido de <strong>4 cartas</strong> (2 parejas).<br>" +
        "• <strong>Niveles 2 y 3:</strong> Se expande a <strong>6 y 8 cartas</strong>.<br>" +
        "• <strong>Nivel Maestro:</strong> El gran reto de <strong>12 cartas</strong> con múltiples parejas especiales.<br>" +
        "¡El tiempo nunca se detiene: entre más rápido limpies el tablero, mayor será tu bono final!",
      proTip: "¡Mantén la calma y no toques al azar; planear dos pasos por delante ahorra segundos!",
      stageType: "levels"
    }
  ];

  constructor(containerId: string = "magic-pairs-tutorial-modal", audio: AudioManager) {
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
    try {
      return localStorage.getItem("feria_tutorial_seen_magic-pairs") === "true";
    } catch {
      return false;
    }
  }

  public markTutorialSeen(): void {
    try {
      localStorage.setItem("feria_tutorial_seen_magic-pairs", "true");
    } catch {
      // Ignorar si hay restricciones de almacenamiento
    }
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: PAREJAS MÁGICAS!</h2>
          </div>
          <button id="btn-pairs-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
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
              <span class="step-name">${["Historia", "Volteo 3D", "Especiales", "Niveles"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="pairs-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          <div class="ski-remember-box">
            <label class="ski-checkbox-container">
              <input type="checkbox" id="chk-pairs-dont-show-again" />
              <span class="ski-checkmark"></span>
              <span class="ski-chk-label">No mostrar automáticamente</span>
            </label>
          </div>

          <div class="ski-nav-buttons">
            <button id="btn-pairs-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-pairs-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-pairs-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#pairs-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-pairs-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-pairs-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-pairs-play-now");

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

    // Renderizar escenario visual personalizado de Magic Pairs
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-pairs-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Escena del Cofre de Cartas Mágicas -->
            <div class="pairs-story-scene">
              <div class="pairs-cards-fan">
                <div class="fan-card fan-card-1">
                  <div class="card-back-ornament">
                    <img src="./assets/images/medallon-feria.png" alt="Dorso" />
                  </div>
                </div>
                <div class="fan-card fan-card-hero">
                  <div class="card-face-content">
                    <img src="./assets/images/osito.png" alt="Osito de Peluche" />
                    <span class="card-hero-caption">¡PAREJA!</span>
                  </div>
                </div>
                <div class="fan-card fan-card-3">
                  <div class="card-back-ornament">
                    <img src="./assets/images/estrella con logo.png" alt="Dorso" />
                  </div>
                </div>
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.png" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡EMPAREJA TODOS LOS JUGUETES MÁGICOS!</span>
            </div>
          </div>
        `;
        break;

      case "flip":
        visualHTML = `
          <div class="ski-stage stage-pairs-flip">
            <!-- Mini tablero interactivo de 4 cartas -->
            <div class="pairs-mini-grid">
              <div class="demo-card demo-card-0" id="card-sim-0">
                <div class="demo-card-inner">
                  <div class="demo-card-back">
                    <img src="./assets/images/medallon-feria.png" alt="Dorso" />
                  </div>
                  <div class="demo-card-front">
                    <img src="./assets/images/osito.png" alt="Osito" />
                  </div>
                </div>
              </div>

              <div class="demo-card demo-card-1" id="card-sim-1">
                <div class="demo-card-inner">
                  <div class="demo-card-back">
                    <img src="./assets/images/medallon-feria.png" alt="Dorso" />
                  </div>
                  <div class="demo-card-front">
                    <img src="./assets/images/robot.png" alt="Robot" />
                  </div>
                </div>
              </div>

              <div class="demo-card demo-card-2" id="card-sim-2">
                <div class="demo-card-inner">
                  <div class="demo-card-back">
                    <img src="./assets/images/medallon-feria.png" alt="Dorso" />
                  </div>
                  <div class="demo-card-front">
                    <img src="./assets/images/osito.png" alt="Osito" />
                  </div>
                </div>
              </div>

              <div class="demo-card demo-card-3" id="card-sim-3">
                <div class="demo-card-inner">
                  <div class="demo-card-back">
                    <img src="./assets/images/medallon-feria.png" alt="Dorso" />
                  </div>
                  <div class="demo-card-front">
                    <img src="./assets/images/robot.png" alt="Robot" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Guía de acción de volteo -->
            <div class="pairs-flip-feedback-bar" id="pairs-flip-feedback">
              <span class="feedback-text">¡TOCA UNA CARTA PARA REVELAR SU JUGUETE!</span>
            </div>
          </div>
        `;
        break;

      case "special_cards":
        visualHTML = `
          <div class="ski-stage stage-pairs-special">
            <div class="pairs-cards-tier-grid">
              <!-- Juguetes estándar -->
              <div class="toy-point-card card-classic">
                <div class="point-badge-tag">+200 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/osito.png" alt="Osito" />
                  <img src="./assets/images/robot.png" alt="Robot" />
                </div>
                <span class="point-label">Juguetes Clásicos</span>
              </div>

              <!-- Elfo Volador -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+300 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/elfo-volador.png" alt="Elfo Volador" />
                  <img src="./assets/images/baston-caramelo.png" alt="Bastón" />
                </div>
                <span class="point-label">Elfo & Dulces</span>
              </div>

              <!-- Logos y Estrella Dorada -->
              <div class="toy-point-card card-star">
                <div class="point-badge-tag tag-gold">+500 PTS • PODER ESPECIAL</div>
                <div class="point-single-star">
                  <img src="./assets/images/estrella con logo.png" alt="Estrella con Logo" class="star-pulse-img" />
                </div>
                <span class="point-label">¡Logos de Patrocinador!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "levels":
        visualHTML = `
          <div class="ski-stage stage-pairs-levels">
            <div class="pairs-levels-showcase">
              <!-- Nivel 1 -->
              <div class="level-box-card">
                <div class="level-badge-pill">NIVEL 1</div>
                <div class="level-mini-matrix matrix-4">
                  <span></span><span></span><span></span><span></span>
                </div>
                <span class="level-meta">4 CARTAS (2x2)</span>
              </div>

              <!-- Nivel 2 y 3 -->
              <div class="level-box-card">
                <div class="level-badge-pill pill-cyan">NIVEL 2 & 3</div>
                <div class="level-mini-matrix matrix-8">
                  <span></span><span></span><span></span><span></span>
                  <span></span><span></span><span></span><span></span>
                </div>
                <span class="level-meta">6 Y 8 CARTAS</span>
              </div>

              <!-- Nivel Maestro -->
              <div class="level-box-card card-master">
                <div class="level-badge-pill pill-gold">NIVEL MAESTRO</div>
                <div class="level-mini-matrix matrix-12">
                  <span></span><span></span><span></span><span></span>
                  <span></span><span></span><span></span><span></span>
                  <span></span><span></span><span></span><span></span>
                </div>
                <span class="level-meta">12 CARTAS (3x4)</span>
              </div>
            </div>

            <!-- Barra de tiempo y concentración -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">BONO DE TIEMPO:</span>
              <div class="pairs-timer-pill">
                ${getIconSvg("timer", { size: 16, color: "#FFD700" })}
                <span>¡EL RELOJ CORRE SIN DETENERSE!</span>
              </div>
              <span class="lives-hint">¡Apresúrate para maximizar tus puntos!</span>
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
      const heroCard = this.container.querySelector(".fan-card-hero");
      if (heroCard) {
        gsap.to(heroCard, {
          y: -10,
          scale: 1.05,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    } else if (data.stageType === "flip") {
      // Simular volteo sincronizado de dos cartas gemelas con audio de acierto
      const c0 = this.container.querySelector<HTMLElement>("#card-sim-0");
      const c2 = this.container.querySelector<HTMLElement>("#card-sim-2");
      const feedback = this.container.querySelector<HTMLElement>("#pairs-flip-feedback .feedback-text");

      let phase = 0;
      this.stepInterval = setInterval(() => {
        if (phase === 0) {
          // Voltear carta 1
          this.audio.playCardFlip();
          c0?.classList.add("flipped");
          if (feedback) feedback.innerText = "1. REVELAS LA PRIMERA CARTA: ¡UN OSITO!";
          phase = 1;
        } else if (phase === 1) {
          // Voltear carta gemela 2
          this.audio.playCardFlip();
          c2?.classList.add("flipped");
          if (feedback) feedback.innerText = "2. ¡ENCUENTRAS LA SEGUNDA CARTA!";
          phase = 2;
        } else if (phase === 2) {
          // Pareja acertada con destello y sonido
          this.audio.playCardMatch();
          c0?.classList.add("matched");
          c2?.classList.add("matched");
          if (feedback) feedback.innerText = "¡PAREJA ACERTADA! +200 PTS";
          phase = 3;
        } else {
          // Reiniciar ciclo
          c0?.classList.remove("flipped", "matched");
          c2?.classList.remove("flipped", "matched");
          if (feedback) feedback.innerText = "¡TOCA UNA CARTA PARA REVELAR SU JUGUETE!";
          phase = 0;
        }
      }, 1400);
    } else if (data.stageType === "special_cards") {
      const starImg = this.container.querySelector(".star-pulse-img");
      if (starImg) {
        gsap.to(starImg, {
          scale: 1.15,
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    } else if (data.stageType === "levels") {
      const cards = this.container.querySelectorAll(".level-box-card");
      cards.forEach((c, i) => {
        gsap.fromTo(
          c,
          { y: 0 },
          { y: -6, duration: 1.2 + i * 0.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.15 }
        );
      });
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
    const btnQuickClose = this.container.querySelector("#btn-pairs-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-pairs-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-pairs-next");
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

    const btnPlay = this.container.querySelector("#btn-pairs-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FFD700", "#D500F9", "#00E5FF", "#00E676"]
        });
      } catch {
        // Ignorar si no está disponible
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-pairs-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-pairs-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
