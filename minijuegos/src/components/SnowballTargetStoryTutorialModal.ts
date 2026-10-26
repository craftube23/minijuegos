/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡TIRO AL BLANCO NAVIDEÑO!
 * ==============================================================================
 *
 * Muestra la historia de la Caseta de Feria Navideña y enseña a apuntar con
 * la resortera mágica con una experiencia 100% visual y sin fondos blancos:
 *
 * 1. Capítulo 1 - La Caseta de Feria: Historia festiva de la galería de tiro.
 * 2. Capítulo 2 - Puntería & Resortera: Cómo apuntar y disparar bolas de nieve.
 * 3. Capítulo 3 - Dianas & Superpoderes: Regalos, elfo veloz y poderes de marcas.
 * 4. Capítulo 4 - Trampas & Modo Fiebre: Carbón, hielo y multiplicadores cometa x4.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface SnowballTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "controls" | "targets" | "hazards";
}

export class SnowballTargetStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: SnowballTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡La Gran Caseta de la Feria Mágica!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "En el corazón de la <strong>Feria Mágica del Juguete</strong>, la tradicional caseta de tiro al blanco abre sus marquesinas iluminadas. Los duendes de Santa han montado una galería arcade con juguetes de cuerda en rieles, dianas de caramelo y regalos sorpresa. ¡Toma la <strong>Resortera de Nieve Encantada</strong> y afina tu puntería para derribar todos los blancos!",
      proTip: "¡Los blancos en movimiento en las repisas superiores otorgan mayores bonificaciones!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • PUNTERÍA Y DISPARO",
      title: "¡Apunta con la Resortera Mágica!",
      badge: "PUNTERÍA DIRECTA",
      badgeColor: "#00E5FF",
      storyText:
        "El sistema de disparo es intuitivo y reactivo:<br>" +
        "• <strong>TOCA O HAZ CLIC:</strong> Toca directamente sobre cualquier diana o muñeco para disparar una bola de nieve con parábola balística.<br>" +
        "• <strong>FÍSICA DE BISAGRA:</strong> Al recibir el impacto, las dianas girarán hacia atrás derribándose con rebote de madera.<br>" +
        "• ¡Disparar en racha encadena combos de precisión para multiplicar tu puntuación!",
      proTip: "¡Anticipa la trayectoria de los blancos en movimiento apuntando ligeramente adelante!",
      stageType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • DIANAS Y SUPERPODERES",
      title: "¡Juguetes, Elfos y Poderes Oficiales!",
      badge: "PUNTUACIÓN MÁXIMA",
      badgeColor: "#00E676",
      storyText:
        "Descubre el valor de cada blanco en la galería:<br>" +
        "• <strong>Dianas Clásicas y Juguetes (Ositos/Robots):</strong> <strong>+150 a +200 pts</strong>.<br>" +
        "• <strong>Regalos Sorpresa y Elfo Travieso:</strong> <strong>+300 a +350 pts</strong> (el elfo se asoma fugazmente).<br>" +
        "• <strong>Dianas con Logo de Patrocinador:</strong> <strong>+500 pts</strong> y otorgan <strong>Superpoderes Únicos</strong> como Triple Disparo, Cámara Lenta (Slow-Mo) o Mega-Bolas con onda expansiva.",
      proTip: "¡Prioriza las dianas con logo oficial para activar habilidades que limpian la caseta!",
      stageType: "targets"
    },
    {
      tag: "CAPÍTULO 4 • TRAMPAS Y MODO FIEBRE",
      title: "¡Carbón, Hielo y Racha x4!",
      badge: "PRECISIÓN & FIEBRE",
      badgeColor: "#FF9100",
      storyText:
        "¡No dispares a ciegas! Evita las trampas que restan puntos:<br>" +
        "• <strong>Barril de Carbón:</strong> <strong>-150 pts</strong> y rompe tu combo rítmico.<br>" +
        "• <strong>Cristal Helado:</strong> <strong>-200 pts</strong> y congela tu resortera por 2 segundos.<br>" +
        "• <strong>Muñeco Gruñón:</strong> Salpicará nieve en tu pantalla si le disparas.<br>" +
        "• <strong>MODO FIEBRE:</strong> Encadenar tiros perfectos desata bolas de nieve cometa doradas con <strong>multiplicador x2 y x4</strong>.",
      proTip: "¡Mantén la calma en Modo Fiebre: cada diana derribada sumará una avalancha de puntos!",
      stageType: "hazards"
    }
  ];

  constructor(containerId: string = "snowball-target-tutorial-modal", audio: AudioManager) {
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: TIRO AL BLANCO!</h2>
          </div>
          <button id="btn-target-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
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
              <span class="step-name">${["Historia", "Puntería", "Dianas & Poder", "Trampas"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="target-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-target-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-target-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-target-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#target-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-target-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-target-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-target-play-now");

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

    // Renderizar escenario visual personalizado de Snowball Target
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-target-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Caseta de Feria con Dianas Móviles -->
            <div class="target-story-scene">
              <div class="carnival-tent-roof">
                <div class="carnival-lamp-glow"></div>
                <div class="target-carnival-shelf shelf-top">
                  <div class="shelf-toy toy-robot-anim">
                    <img src="./assets/images/robot.webp" alt="Robot" />
                  </div>
                  <div class="shelf-bullseye">
                    <img src="./assets/images/medallon-feria.webp" alt="Diana Feria" />
                  </div>
                  <div class="shelf-toy toy-teddy-anim">
                    <img src="./assets/images/osito.webp" alt="Osito" />
                  </div>
                </div>
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡DERRIBA TODAS LAS DIANAS EN LA FERIA!</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-target-controls">
            <!-- Pista animada de tiro con resortera y diana abatible -->
            <div class="target-aim-demo-box">
              <div class="demo-shelf-wood"></div>
              <!-- Diana en bisagra -->
              <div class="demo-hinge-target" id="demo-hinge-target">
                <img src="./assets/images/medallon-feria.webp" alt="Diana" class="hinge-target-img" />
                <div class="target-splat-burst" id="demo-target-splat">
                  ${getIconSvg("sparkles", { size: 24, color: "#FFFFFF" })}
                </div>
              </div>
              <!-- Retícula de mira arcade -->
              <div class="demo-crosshair-reticle" id="demo-crosshair">
                <div class="reticle-ring"></div>
                <div class="reticle-dot"></div>
              </div>
              <div class="target-hit-score-popup" id="demo-hit-popup">
                <span>+200 ¡DIANA!</span>
              </div>
            </div>

            <!-- Guía de periféricos -->
            <div class="controls-overlay-cues target-cues">
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL O RATÓN</span>
                <div class="touch-tap-aim-demo">
                  <div class="tap-aim-target">
                    ${getIconSvg("target", { size: 26, color: "#00E5FF" })}
                  </div>
                </div>
                <span class="cue-hint">Toca cualquier blanco para disparar</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="keys-cue-box">
                <span class="cue-label">RESORTERA MÁGICA</span>
                <span class="cue-hint">Balística continua con parábola</span>
                <div class="slingshot-quick-pill">
                  ${getIconSvg("sparkles", { size: 14, color: "#FFD700" })}
                  <span>¡RITMO RÁPIDO!</span>
                </div>
              </div>
            </div>
          </div>
        `;
        break;

      case "targets":
        visualHTML = `
          <div class="ski-stage stage-target-types">
            <div class="target-items-grid">
              <!-- Dianas y Juguetes -->
              <div class="toy-point-card card-classic">
                <div class="point-badge-tag">+150 A +200 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/osito.webp" alt="Osito" />
                  <img src="./assets/images/robot.webp" alt="Robot" />
                </div>
                <span class="point-label">Dianas y Juguetes</span>
              </div>

              <!-- Regalos y Elfo -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+300 A +350 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/regalo-rojo2.webp" alt="Regalo" />
                  <img src="./assets/images/elfo-volador.webp" alt="Elfo Travieso" />
                </div>
                <span class="point-label">Regalos & Elfo Pillo</span>
              </div>

              <!-- Dianas de Patrocinador con Poderes -->
              <div class="toy-point-card card-star">
                <div class="point-badge-tag tag-gold">+500 PTS • SUPERPODERES</div>
                <div class="point-single-star">
                  <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="star-pulse-img" />
                </div>
                <span class="point-label">¡Triple Tiro & Mega-Bola!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards":
        visualHTML = `
          <div class="ski-stage stage-target-hazards">
            <div class="target-hazard-split">
              <!-- Carbón ardiente -->
              <div class="hazard-card card-coal">
                <div class="hazard-title-badge">BARRIL DE CARBÓN</div>
                <img src="./assets/images/carbon.webp" alt="Carbón" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-150 PTS • ROMPE COMBO</span>
              </div>

              <!-- Cristal de hielo -->
              <div class="hazard-card card-ice">
                <div class="hazard-title-badge badge-ice">CRISTAL HELADO</div>
                <img src="./assets/images/obstaculo-cristal.webp" alt="Cristal Helado" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-200 PTS • CONGELA LA MIRA</span>
              </div>
            </div>

            <!-- Modo Fiebre Navideña -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">MODO FIEBRE NAVIDEÑA:</span>
              <div class="target-fever-badge">
                ${getIconSvg("sparkles", { size: 16, color: "#FFD700" })}
                <span>¡BOLAS DE NIEVE COMETA x4!</span>
              </div>
              <span class="lives-hint">¡Encadena tiros seguidos sin fallar para activarlo!</span>
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
      const robot = this.container.querySelector(".toy-robot-anim");
      const teddy = this.container.querySelector(".toy-teddy-anim");
      if (robot) {
        gsap.to(robot, { x: 15, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
      if (teddy) {
        gsap.to(teddy, { x: -15, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
    } else if (data.stageType === "controls") {
      // Simular retícula apuntando, disparo, salpicadura y diana girando hacia atrás
      const crosshair = this.container.querySelector<HTMLElement>("#demo-crosshair");
      const target = this.container.querySelector<HTMLElement>("#demo-hinge-target");
      const splat = this.container.querySelector<HTMLElement>("#demo-target-splat");
      const popup = this.container.querySelector<HTMLElement>("#demo-hit-popup");

      let phase = 0;
      this.stepInterval = setInterval(() => {
        if (phase === 0) {
          // Mover retícula hacia el centro de la diana
          if (crosshair) {
            gsap.to(crosshair, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.4 });
          }
          if (target) {
            gsap.to(target, { transform: "rotateX(0deg)", opacity: 1, duration: 0.3 });
          }
          if (splat) splat.style.opacity = "0";
          if (popup) popup.style.opacity = "0";
          phase = 1;
        } else if (phase === 1) {
          // Disparo e impacto
          this.audio.playCatchItem();
          if (crosshair) {
            gsap.fromTo(crosshair, { scale: 0.8 }, { scale: 1.25, duration: 0.2, yoyo: true, repeat: 1 });
          }
          if (splat) {
            gsap.fromTo(splat, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.4, duration: 0.2 });
          }
          if (popup) {
            gsap.fromTo(popup, { opacity: 0, y: 0 }, { opacity: 1, y: -18, duration: 0.4 });
          }
          if (target) {
            // Diana gira hacia atrás sobre su eje horizontal (física de bisagra)
            gsap.to(target, { transform: "rotateX(75deg)", opacity: 0.3, duration: 0.45, ease: "bounce.out" });
          }
          phase = 2;
        } else {
          // Restaurar para el siguiente tiro
          phase = 0;
        }
      }, 1100);
    } else if (data.stageType === "targets") {
      const star = this.container.querySelector(".star-pulse-img");
      if (star) {
        gsap.to(star, { scale: 1.15, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
    } else if (data.stageType === "hazards") {
      const feverBadge = this.container.querySelector(".target-fever-badge");
      if (feverBadge) {
        gsap.fromTo(
          feverBadge,
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
    const btnQuickClose = this.container.querySelector("#btn-target-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-target-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-target-next");
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

    const btnPlay = this.container.querySelector("#btn-target-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FFD700", "#00E5FF", "#00E676", "#FF1744"]
        });
      } catch {
        // Ignorar si no está disponible
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-target-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-target-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
