/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡EL DESCENSO DE SANTA!
 * ==============================================================================
 *
 * Muestra la historia de la carrera en trineo por las colinas nevadas y enseña
 * a dominar los saltos acrobáticos con una experiencia 100% visual y sin fondos blancos:
 *
 * 1. Capítulo 1 - La Gran Carrera de Nochebuena: Descenso en trineo por la cordillera.
 * 2. Capítulo 2 - Salto en Crestas & Doble Salto: Físicas, saltos dobles y aterrizajes suaves.
 * 3. Capítulo 3 - Regalos & Trineo Dorado: Peluches, robots y el poder del medallón imán.
 * 4. Capítulo 4 - Obstáculos & 5 Vidas: Troncos, rocas y muñecos de nieve.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface SantaHillsTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "jump_mechanics" | "collectibles" | "hazards";
}

export class SantaHillsStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: SantaHillsTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Descenso por las Colinas Nevadas!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "En la Nochebuena, Santa debe descender a toda velocidad por la cordillera nevada en su <strong>Trineo Mágico Encantado</strong> para inaugurar la gran Feria del Juguete. En una curva cerrada, parte de los regalos rodaron por las laderas. ¡Santa necesita que tomes las riendas para recuperar todos los juguetes mientras surcas las colinas a máxima velocidad!",
      proTip: "¡Aprovecha las pendientes de bajada para ganar impulso y volar más lejos!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • SALTOS Y ACROBACIAS",
      title: "¡Salto en Crestas y Doble Giro 360°!",
      badge: "FÍSICAS Y TRUCOS",
      badgeColor: "#00E5FF",
      storyText:
        "Domina la inercia del trineo sobre la nieve:<br>" +
        "• <strong>TOCA LA PANTALLA O [ Espacio / W / ▲ ]</strong> justo en la cresta de una colina para elevarte hacia el cielo.<br>" +
        "• <strong>DOBLE TOQUE EN EL AIRE:</strong> ¡Desata un <strong>Doble Salto Mágico</strong> con giro 360° para esquivar peligros lejanos y sumar puntos de estilo (+200 pts)!<br>" +
        "• <strong>ATERRIZAJE SUAVE:</strong> Apunta a caer sobre una bajada para recibir un impulso sónico de velocidad.",
      proTip: "¡Hacer doble salto en el punto más alto maximiza tu tiempo de vuelo!",
      stageType: "jump_mechanics"
    },
    {
      tag: "CAPÍTULO 3 • JUGUETES Y TRINEO DORADO",
      title: "¡Coleccionables y el Poder Imán!",
      badge: "PUNTUACIÓN MÁXIMA",
      badgeColor: "#00E676",
      storyText:
        "Recupera todos los paquetes a lo largo del sendero:<br>" +
        "• <strong>Regalos Clásicos (Rojos y Verdes):</strong> <strong>+100 a +150 pts</strong>.<br>" +
        "• <strong>Ositos, Robots y Dulces:</strong> <strong>+200 a +250 pts</strong>.<br>" +
        "• <strong>Medallón Dorado de la Feria:</strong> <strong>+300 pts</strong> y activa el <strong>Trineo Dorado + Imán x2</strong>: ¡deslízate sin fricción atrayendo todos los regalos del valle!",
      proTip: "¡Con el Trineo Dorado no perderás velocidad en subidas empinadas!",
      stageType: "collectibles"
    },
    {
      tag: "CAPÍTULO 4 • OBSTÁCULOS Y 5 VIDAS",
      title: "¡Troncos, Muñecos y Carbón!",
      badge: "SUPERVIVENCIA (5 VIDAS)",
      badgeColor: "#FF1744",
      storyText:
        "El camino alpino está repleto de sorpresas:<br>" +
        "• <strong>Esquiva Troncos, Muñecos de Nieve y Cristales de Hielo:</strong> Chocar contra ellos frenará tu trineo en seco y te costará <strong>1 de tus 5 vidas</strong>.<br>" +
        "• <strong>Recuperación Rápida:</strong> Tras un impacto parpadearás con invulnerabilidad temporal. ¡Salta de inmediato para retomar la racha!",
      proTip: "¡Cuentas con 5 vidas; usa el doble salto para sobrevolar obstáculos dobles!",
      stageType: "hazards"
    }
  ];

  constructor(containerId: string = "santa-hills-tutorial-modal", audio: AudioManager) {
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
      return localStorage.getItem("feria_tutorial_seen_santa-hills") === "true";
    } catch {
      return false;
    }
  }

  public markTutorialSeen(): void {
    try {
      localStorage.setItem("feria_tutorial_seen_santa-hills", "true");
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: EL DESCENSO DE SANTA!</h2>
          </div>
          <button id="btn-hills-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
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
              <span class="step-name">${["Historia", "Saltos 360°", "Trineo Dorado", "Peligros"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="hills-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          <div class="ski-remember-box">
            <label class="ski-checkbox-container">
              <input type="checkbox" id="chk-hills-dont-show-again" />
              <span class="ski-checkmark"></span>
              <span class="ski-chk-label">No mostrar automáticamente</span>
            </label>
          </div>

          <div class="ski-nav-buttons">
            <button id="btn-hills-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-hills-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-hills-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#hills-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-hills-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-hills-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-hills-play-now");

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

    // Renderizar escenario visual personalizado de Santa Hills
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-hills-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Colina Nevada & Trineo Mágico de Santa -->
            <div class="hills-story-scene">
              <div class="hills-crest-slope">
                <div class="hills-sleigh-box">
                  <div class="sleigh-gold-aura"></div>
                  <img src="./assets/images/santa-trineo.png" alt="Trineo de Santa" class="hills-sleigh-sprite" />
                  <div class="hills-snow-spray"></div>
                </div>
              </div>
              <div class="hills-floating-gifts">
                <img src="./assets/images/regalo-rojo.png" alt="Regalo" class="hills-gift-1" />
                <img src="./assets/images/osito.png" alt="Osito" class="hills-gift-2" />
                <img src="./assets/images/regalo-verde.png" alt="Regalo" class="hills-gift-3" />
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.png" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡RESCATA LOS REGALOS POR LAS COLINAS!</span>
            </div>
          </div>
        `;
        break;

      case "jump_mechanics":
        visualHTML = `
          <div class="ski-stage stage-hills-jump">
            <!-- Pista animada de salto en cresta -->
            <div class="hills-jump-track">
              <div class="hills-curved-terrain-svg">
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" class="terrain-hill-curve">
                  <path d="M 0 95 Q 80 95 120 50 Q 150 15 180 50 Q 220 95 300 95 L 300 120 L 0 120 Z" fill="#0E223D" stroke="#00E5FF" stroke-width="2"/>
                </svg>
              </div>
              <div class="hills-demo-sleigh" id="hills-demo-sleigh">
                <img src="./assets/images/santa-trineo.png" alt="Trineo" class="sleigh-jump-sprite" />
              </div>
              <div class="hills-trick-bubble" id="hills-trick-bubble">
                <span>¡DOBLE SALTO 360°!</span>
              </div>
            </div>

            <!-- Guía de acción de saltos -->
            <div class="controls-overlay-cues hills-cues">
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL</span>
                <div class="touch-double-tap-anim">
                  <span class="tap-circle tap-1">1</span>
                  <span class="tap-circle tap-2">2</span>
                </div>
                <span class="cue-hint">Doble toque en el aire</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair">
                  <span class="key-cap key-cap-space" id="hills-key-space">ESPACIO</span>
                  <span class="key-cap" id="hills-key-up">▲ W</span>
                </div>
                <span class="cue-hint">Salto en crestas y doble salto</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "collectibles":
        visualHTML = `
          <div class="ski-stage stage-hills-collectibles">
            <div class="hills-items-grid">
              <!-- Regalos clásicos -->
              <div class="toy-point-card card-classic">
                <div class="point-badge-tag">+100 A +150 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/regalo-rojo.png" alt="Regalo Rojo" />
                  <img src="./assets/images/regalo-verde.png" alt="Regalo Verde" />
                </div>
                <span class="point-label">Regalos de Nieve</span>
              </div>

              <!-- Juguetes especiales -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+200 A +250 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/osito.png" alt="Osito" />
                  <img src="./assets/images/robot.png" alt="Robot" />
                </div>
                <span class="point-label">Juguetes de Fábrica</span>
              </div>

              <!-- Medallón Dorado / Imán x2 -->
              <div class="toy-point-card card-star">
                <div class="point-badge-tag tag-gold">+300 PTS • TRINEO DORADO</div>
                <div class="point-single-star">
                  <img src="./assets/images/medallon-feria.png" alt="Medallón Feria" class="star-pulse-img" />
                </div>
                <span class="point-label">¡Super Imán x2 & Turbo!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards":
        visualHTML = `
          <div class="ski-stage stage-hills-hazards">
            <div class="hills-hazard-split">
              <!-- Troncos y Rocas -->
              <div class="hazard-card card-log">
                <div class="hazard-title-badge">TRONCOS Y ROCAS</div>
                <img src="./assets/images/obstaculo-tronco.png" alt="Tronco" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-1 VIDA • SALTA POR ENCIMA</span>
              </div>

              <!-- Muñeco de Nieve & Hielo -->
              <div class="hazard-card card-snowman">
                <div class="hazard-title-badge badge-ice">MUÑECOS Y CRISTALES</div>
                <img src="./assets/images/obstaculo-muneco.png" alt="Muñeco" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-1 VIDA • FRENA TU TRINEO</span>
              </div>
            </div>

            <!-- 5 Vidas Protegidas -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">VIDAS DE SANTA:</span>
              <div class="lives-hearts-row">
                <span class="hills-life-heart">${getIconSvg("heart", { size: 18, color: "#FF1744" })}</span>
                <span class="hills-life-heart">${getIconSvg("heart", { size: 18, color: "#FF1744" })}</span>
                <span class="hills-life-heart">${getIconSvg("heart", { size: 18, color: "#FF1744" })}</span>
                <span class="hills-life-heart">${getIconSvg("heart", { size: 18, color: "#FF1744" })}</span>
                <span class="hills-life-heart">${getIconSvg("heart", { size: 18, color: "#FF1744" })}</span>
              </div>
              <span class="lives-hint">¡Aterriza en las bajadas para conservar impulso y esquivar peligros!</span>
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
      const sleigh = this.container.querySelector(".hills-sleigh-sprite");
      if (sleigh) {
        gsap.to(sleigh, {
          y: -8,
          rotation: -4,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
      const gifts = this.container.querySelectorAll(".hills-floating-gifts img");
      gifts.forEach((g, i) => {
        gsap.to(g, {
          y: -10,
          rotation: i % 2 === 0 ? 10 : -10,
          duration: 1.3 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: i * 0.18
        });
      });
    } else if (data.stageType === "jump_mechanics") {
      // Simular trineo deslizándose, saltando en la cresta y haciendo giro 360°
      const sleigh = this.container.querySelector<HTMLElement>("#hills-demo-sleigh");
      const trickBubble = this.container.querySelector<HTMLElement>("#hills-trick-bubble");
      const keySpace = this.container.querySelector<HTMLElement>("#hills-key-space");

      let phase = 0;
      this.stepInterval = setInterval(() => {
        if (phase === 0) {
          // Deslizándose en bajada
          if (sleigh) {
            gsap.to(sleigh, { x: 30, y: 0, rotation: 8, duration: 0.5, ease: "power1.in" });
          }
          if (keySpace) gsap.to(keySpace, { backgroundColor: "#1E293B", color: "#FFF", scale: 1 });
          if (trickBubble) trickBubble.style.opacity = "0";
          phase = 1;
        } else if (phase === 1) {
          // Salto en la cresta
          if (sleigh) {
            gsap.to(sleigh, { x: 90, y: -45, rotation: -18, duration: 0.6, ease: "power2.out" });
          }
          if (keySpace) gsap.to(keySpace, { backgroundColor: "#00E5FF", color: "#000", scale: 0.94 });
          phase = 2;
        } else if (phase === 2) {
          // Doble salto 360° en el aire
          if (sleigh) {
            gsap.to(sleigh, {
              x: 140,
              y: -65,
              rotation: -378,
              duration: 0.7,
              ease: "power1.inOut"
            });
          }
          if (trickBubble) trickBubble.style.opacity = "1";
          if (keySpace) gsap.to(keySpace, { backgroundColor: "#FFD700", color: "#000", scale: 0.92 });
          phase = 3;
        } else {
          // Aterrizaje suave en la bajada
          if (sleigh) {
            gsap.to(sleigh, { x: 0, y: 0, rotation: 0, duration: 0.5, ease: "bounce.out" });
          }
          if (trickBubble) trickBubble.style.opacity = "0";
          phase = 0;
        }
      }, 950);
    } else if (data.stageType === "collectibles") {
      const medal = this.container.querySelector(".star-pulse-img");
      if (medal) {
        gsap.to(medal, {
          scale: 1.15,
          duration: 0.75,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    } else if (data.stageType === "hazards") {
      const hearts = this.container.querySelectorAll(".hills-life-heart");
      hearts.forEach((h, idx) => {
        gsap.to(h, {
          scale: 1.15,
          duration: 0.7,
          delay: idx * 0.15,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
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
    const btnQuickClose = this.container.querySelector("#btn-hills-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-hills-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-hills-next");
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

    const btnPlay = this.container.querySelector("#btn-hills-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FFD700", "#FF1744", "#00E5FF", "#00E676"]
        });
      } catch {
        // Ignorar si no está disponible
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-hills-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-hills-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
