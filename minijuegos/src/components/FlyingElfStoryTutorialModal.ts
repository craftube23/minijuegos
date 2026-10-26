/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡EL VUELO MÁGICO DEL ELFO!
 * ==============================================================================
 *
 * Muestra la historia del Escuadrón Aéreo de Santa y enseña a dominar el vuelo
 * en parapente con una experiencia 100% visual, animada y sin fondos blancos:
 *
 * 1. Capítulo 1 - La Misión en los Cielos: La tormenta sobre la Villa Navideña.
 * 2. Capítulo 2 - Controles de Vuelo: Mantener presionado para subir, soltar para planear.
 * 3. Capítulo 3 - Regalos & Súper Imán: Coleccionables y el poder de la Estrella Dorada.
 * 4. Capítulo 4 - Chimeneas & Estalactitas: Esquivar peligros y proteger las 3 vidas.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface FlyingElfTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "controls" | "collectibles" | "hazards";
}

export class FlyingElfStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: FlyingElfTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡Misión Aérea en la Villa Navideña!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "Una tormenta mágica de viento boreal dispersó cientos de regalos y cartas sobre los tejados nevados de la Villa del Polo Norte. Santa necesita al <strong>Escuadrón de Elfos Aviadores</strong> para surcar el cielo nocturno en sus parapentes encantados y rescatar todos los juguetes antes de que amanezca el día de Navidad.",
      proTip: "¡Elige tu elfo favorito con su parapente exclusivo para iniciar tu patrulla!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES DE VUELO",
      title: "¡Mantén para Subir, Suelta para Planear!",
      badge: "MECÁNICA AERODINÁMICA",
      badgeColor: "#00E5FF",
      storyText:
        "El parapente responde a la física del viento con suavidad:<br>" +
        "• <strong>MANTÉN PRESIONADO:</strong> El elfo impulsará sus alas mágicas y <strong>ascenderá</strong> ganando altura.<br>" +
        "• <strong>SUELTA:</strong> Descenderás suavemente <strong>planeando</strong> por la gravedad.<br>" +
        "• En teclado usa <strong>[ Espacio ]</strong>, <strong>[ W ]</strong> o <strong>[ ▲ ]</strong>. En pantalla táctil o tótem mantén tu dedo pulsado en cualquier lugar.",
      proTip: "¡Da toques cortos y rítmicos para mantener una altitud perfectamente estable!",
      stageType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • REGALOS Y SÚPER IMÁN",
      title: "¡Juguetes y el Poder del Medallón!",
      badge: "PUNTUACIÓN MÁXIMA",
      badgeColor: "#00E676",
      storyText:
        "Atrapa los regalos rojos y verdes en el aire (<strong>+100 a +150 pts</strong>) y los bastones de caramelo (<strong>+200 pts</strong>). Si recoges el <strong>Medallón Dorado o Estrella con Logo</strong>, desatarás el <strong>SÚPER IMÁN MÁGICO</strong>: ¡todos los regalos de la pantalla serán atraídos velozmente hacia tu parapente con bonificación doble!",
      proTip: "¡Cuando actives el Imán Mágico concéntrate solo en esquivar obstáculos!",
      stageType: "collectibles"
    },
    {
      tag: "CAPÍTULO 4 • CHIMENEAS Y PELIGROS",
      title: "¡Esquiva Obstáculos y Cuida tus 3 Vidas!",
      badge: "SUPERVIVENCIA (3 VIDAS)",
      badgeColor: "#FF1744",
      storyText:
        "¡Cuidado con los techos! Esquiva las <strong>Chimeneas Humeantes</strong> que emergen desde abajo y las afiladas <strong>Estalactitas de Hielo</strong> que cuelgan del cielo. Cuentas con <strong>3 Vidas</strong>: si colisionas, recibirás un destello temporal de escudo protector para retomar el vuelo.",
      proTip: "¡Vuela cerca del centro de la pantalla para tener margen arriba y abajo!",
      stageType: "hazards"
    }
  ];

  constructor(containerId: string = "flying-elf-tutorial-modal", audio: AudioManager) {
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: EL VUELO DEL ELFO!</h2>
          </div>
          <button id="btn-elf-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
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
              <span class="step-name">${["Historia", "Vuelo", "Regalos & Imán", "Peligros"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="elf-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-elf-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-elf-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-elf-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#elf-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-elf-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-elf-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-elf-play-now");

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

    // Renderizar escenario visual personalizado de Flying Elf
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-elf-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Villa Navideña y Elfo Volador -->
            <div class="elf-story-skyline">
              <div class="elf-hero-floating-box">
                <div class="elf-glider-aura"></div>
                <img src="./assets/images/elfo-volador.webp" alt="Elfo Volador" class="elf-hero-sprite" />
                <div class="elf-sparkle-trail"></div>
              </div>
              <div class="floating-night-gifts">
                <img src="./assets/images/regalo-rojo.webp" alt="Regalo" class="gift-floating-1" />
                <img src="./assets/images/baston-caramelo.webp" alt="Caramelo" class="gift-floating-2" />
                <img src="./assets/images/regalo-verde.webp" alt="Regalo" class="gift-floating-3" />
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡RESCATA LOS REGALOS SOBRE LA VILLA!</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-elf-controls">
            <!-- Pista de demostración de vuelo ondulante -->
            <div class="elf-flight-demo-track">
              <div class="flight-dotted-path"></div>
              <div class="elf-demo-glider" id="elf-demo-glider">
                <img src="./assets/images/elfo-volador.webp" alt="Elfo" class="demo-elf-sprite" />
                <div class="elf-thrust-particles"></div>
              </div>
              <div class="flight-thrust-hint-badge" id="flight-thrust-hint">
                <span>¡PROPULSIÓN ACTIVA!</span>
              </div>
            </div>

            <!-- Guía de periféricos -->
            <div class="controls-overlay-cues elf-cues">
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL / TÓTEM</span>
                <div class="touch-hold-demo">
                  <div class="touch-hold-finger">
                    ${getIconSvg("gamepad", { size: 24, color: "#00E5FF" })}
                  </div>
                  <div class="touch-hold-ripples"></div>
                </div>
                <span class="cue-hint">Mantén presionado para subir</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair">
                  <span class="key-cap key-cap-space" id="elf-key-space">ESPACIO</span>
                  <span class="key-cap" id="elf-key-up">▲ W</span>
                </div>
                <span class="cue-hint">Mantén para volar, suelta para planear</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "collectibles":
        visualHTML = `
          <div class="ski-stage stage-elf-collectibles">
            <div class="elf-items-grid">
              <!-- Regalos clásicos -->
              <div class="toy-point-card card-classic">
                <div class="point-badge-tag">+100 A +150 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/regalo-rojo.webp" alt="Regalo Rojo" />
                  <img src="./assets/images/regalo-verde.webp" alt="Regalo Verde" />
                </div>
                <span class="point-label">Regalos de la Villa</span>
              </div>

              <!-- Dulces y bastones -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+200 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/baston-caramelo.webp" alt="Bastón Caramelo" />
                  <img src="./assets/images/osito.webp" alt="Peluche" />
                </div>
                <span class="point-label">Dulces y Juguetes</span>
              </div>

              <!-- Medallón / Estrella de Patrocinador -->
              <div class="toy-point-card card-star">
                <div class="point-badge-tag tag-gold">+300 PTS • SÚPER IMÁN</div>
                <div class="point-single-star">
                  <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="star-pulse-img" />
                </div>
                <span class="point-label">¡Atrae Todos los Regalos!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards":
        visualHTML = `
          <div class="ski-stage stage-elf-hazards">
            <div class="elf-hazard-split">
              <!-- Chimeneas y Techos -->
              <div class="hazard-card card-chimney">
                <div class="hazard-title-badge">CHIMENEAS Y TECHOS</div>
                <img src="./assets/images/casa-obstaculo.webp" alt="Casa Obstáculo" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-1 VIDA • ESQUIVA POR ARRIBA</span>
              </div>

              <!-- Estalactitas de hielo -->
              <div class="hazard-card card-icicle">
                <div class="hazard-title-badge badge-ice">ESTALACTITAS DE HIELO</div>
                <img src="./assets/images/obstaculo-cristal.webp" alt="Hielo" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-1 VIDA • ESQUIVA POR ABAJO</span>
              </div>
            </div>

            <!-- 3 Vidas del Aviador -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">VIDAS DE VUELO:</span>
              <div class="lives-hearts-row">
                <span class="elf-heart-icon">${getIconSvg("shield", { size: 18, color: "#00E676" })}</span>
                <span class="elf-heart-icon">${getIconSvg("shield", { size: 18, color: "#00E676" })}</span>
                <span class="elf-heart-icon">${getIconSvg("shield", { size: 18, color: "#00E676" })}</span>
              </div>
              <span class="lives-hint">¡Tras chocar recibes un escudo parpadeante temporal!</span>
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
      const heroElf = this.container.querySelector(".elf-hero-sprite");
      if (heroElf) {
        gsap.to(heroElf, {
          y: -14,
          rotation: -5,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
      const gifts = this.container.querySelectorAll(".floating-night-gifts img");
      gifts.forEach((g, i) => {
        gsap.to(g, {
          y: -10,
          rotation: (i % 2 === 0 ? 8 : -8),
          duration: 1.4 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: i * 0.2
        });
      });
    } else if (data.stageType === "controls") {
      // Simular vuelo con onda suave: elfo subiendo y bajando mientras se pulsa la tecla
      const glider = this.container.querySelector<HTMLElement>("#elf-demo-glider");
      const keySpace = this.container.querySelector<HTMLElement>("#elf-key-space");
      const hintBadge = this.container.querySelector<HTMLElement>("#flight-thrust-hint");

      let isThrusting = false;
      this.stepInterval = setInterval(() => {
        isThrusting = !isThrusting;
        if (glider) {
          gsap.to(glider, {
            y: isThrusting ? -40 : 40,
            rotation: isThrusting ? -12 : 12,
            duration: 0.9,
            ease: isThrusting ? "power2.out" : "power1.in"
          });
        }
        if (keySpace) {
          gsap.to(keySpace, {
            backgroundColor: isThrusting ? "#FFD700" : "#1E293B",
            color: isThrusting ? "#000" : "#FFF",
            scale: isThrusting ? 0.94 : 1,
            duration: 0.25
          });
        }
        if (hintBadge) {
          hintBadge.style.opacity = isThrusting ? "1" : "0.3";
          hintBadge.innerText = isThrusting ? "¡PROPULSIÓN ACTIVA! (SUBIENDO)" : "PLANEANDO SUAVE (BAJANDO)";
        }
      }, 1000);
    } else if (data.stageType === "collectibles") {
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
    } else if (data.stageType === "hazards") {
      const shields = this.container.querySelectorAll(".elf-heart-icon");
      shields.forEach((s, idx) => {
        gsap.to(s, {
          scale: 1.15,
          duration: 0.8,
          delay: idx * 0.2,
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
    const btnQuickClose = this.container.querySelector("#btn-elf-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-elf-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-elf-next");
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

    const btnPlay = this.container.querySelector("#btn-elf-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FFD700", "#00E5FF", "#00E676", "#FF3366"]
        });
      } catch {
        // Ignorar si no está disponible
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-elf-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-elf-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
