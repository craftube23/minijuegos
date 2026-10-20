/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡ATRAPA-REGALOS MÁGICO!
 * ==============================================================================
 *
 * Muestra la historia festiva y enseña a jugar de forma 100% visual y animada:
 *
 * 1. 📖 Capítulo 1 - La Gran Noche de los Juguetes: Emergencia en el taller de Santa.
 * 2. 🕹️ Capítulo 2 - Controles & Movimiento Suave: Cómo mover el saco mágico.
 * 3. ⭐ Capítulo 3 - Puntos, Juguetes & Logos: Peluches, robots y poder x2.
 * 4. ⛔ Capítulo 4 - Peligros & Vidas: Carbón ardiente, hielo y las 5 vidas.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface ToyCatchTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "controls" | "points" | "hazards";
}

export class ToyCatchStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: ToyCatchTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡La Gran Noche de los Juguetes!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "¡Alerta en la Fábrica de Juguetes de Santa! La chimenea mágica de empaque se sobrecargó por la gran nevada de Nochebuena y cientos de regalos están cayendo del cielo nocturno. Santa necesita que tomes su <strong>Saco Mágico Encantado</strong> para atrapar todos los juguetes antes de que toquen el suelo y se rompan.",
      proTip: "¡Atrapa los juguetes en el centro del saco para mayor absorción!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES",
      title: "¡Mueve el Saco de Santa!",
      badge: "CONTROLES INTERACTIVOS",
      badgeColor: "#00E5FF",
      storyText:
        "Desliza tu dedo en la pantalla hacia los lados o usa las teclas <strong>[ ◄ / ► ]</strong> o <strong>[ A / D ]</strong> en tu teclado. El saco se inclinará suavemente al acelerar. Mantenerte atrapando regalos seguidos sin fallar activará tus <strong>Combos de Puntuación</strong>.",
      proTip: "¡El saco tiene inercia suave: anticípate a los regalos que caen más rápido!",
      stageType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • PUNTOS Y PODERES",
      title: "¡Juguetes y Cajas con Logo!",
      badge: "PUNTUACIÓN MÁXIMA",
      badgeColor: "#00E676",
      storyText:
        "Atrapa los regalos clásicos (<strong>+100 pts</strong>), ositos de peluche y robots mecánicos (<strong>+150 pts</strong>). Si atrapas la <strong>Caja con Estrella de Patrocinador</strong> activarás el <strong>Poder x2 de Puntos</strong> con un imán que atraerá los regalos cercanos.",
      proTip: "¡No dejes escapar los ositos ni los robots: otorgan bonificaciones mayores!",
      stageType: "points"
    },
    {
      tag: "CAPÍTULO 4 • ¡CUIDADO!",
      title: "¡Carbón, Hielo y Vidas!",
      badge: "SUPERVIVENCIA (5 VIDAS)",
      badgeColor: "#FF1744",
      storyText:
        "¡Mucho cuidado con el <strong>Carbón Ardiente</strong> y los <strong>Cristales de Hielo</strong>! Si tocas carbón perderás puntos y romperás tu combo. Si tocas hielo, tu saco se congelará y <strong>perderás 1 de tus 5 vidas</strong>. ¡Si pierdes todas las vidas, se acabará la partida!",
      proTip: "¡Si ves caer hielo, apártate de inmediato aunque dejes caer un regalo menor!",
      stageType: "hazards"
    }
  ];

  constructor(containerId: string = "toy-catch-tutorial-modal", audio: AudioManager) {
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
      return localStorage.getItem("feria_tutorial_seen_toy-catch") === "true";
    } catch {
      return false;
    }
  }

  public markTutorialSeen(): void {
    try {
      localStorage.setItem("feria_tutorial_seen_toy-catch", "true");
    } catch {
      // Ignorar
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
        <!-- Nieve y guirnaldas sobre el marco -->
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: ATRAPA-REGALOS!</h2>
          </div>
          <button id="btn-toy-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <!-- Barra de progreso de capítulos -->
        <div class="ski-stepper-bar">
          ${this.steps.map((_s, idx) => `
            <button class="ski-step-pill ${idx === 0 ? "active" : ""}" data-step="${idx}">
              <span class="step-num">${idx + 1}</span>
              <span class="step-name">${["Historia", "Controles", "Puntos", "Peligros"][idx]}</span>
            </button>
          `).join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="toy-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          <div class="ski-remember-box">
            <label class="ski-checkbox-container">
              <input type="checkbox" id="chk-toy-dont-show-again" />
              <span class="ski-checkmark"></span>
              <span class="ski-chk-label">No mostrar automáticamente</span>
            </label>
          </div>

          <div class="ski-nav-buttons">
            <button id="btn-toy-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-toy-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-toy-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#toy-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de pie
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-toy-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-toy-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-toy-play-now");

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

    // Renderizar escenario visual personalizado de Toy Catch
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-toy-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Regalos flotando cayendo del cielo hacia el saco -->
            <div class="toy-story-scene">
              <div class="toy-falling-gifts-demo">
                <img src="./assets/images/regalo-rojo.png" alt="Regalo Rojo" class="gift-fall gift-fall-1" />
                <img src="./assets/images/osito.png" alt="Osito" class="gift-fall gift-fall-2" />
                <img src="./assets/images/regalo-verde.png" alt="Regalo Verde" class="gift-fall gift-fall-3" />
              </div>
              <div class="toy-bag-hero-wrapper">
                <div class="toy-bag-golden-glow"></div>
                <img src="./assets/images/bolsa de regalos.png" alt="Saco Mágico de Santa" class="toy-bag-hero-img" />
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.png" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡LLENA EL SACO DE SANTA!</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-toy-controls">
            <div class="toy-controls-track">
              <!-- Saco moviéndose a los lados -->
              <div class="toy-bag-moving-demo" id="toy-bag-moving-demo">
                <img src="./assets/images/bolsa de regalos.png" alt="Saco" class="demo-bag-sprite" />
                <div class="bag-catch-star-burst">✨</div>
              </div>
            </div>
            <div class="controls-overlay-cues">
              <!-- Guía táctil -->
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL / MOUSE</span>
                <div class="touch-hand-anim">
                  <span class="hand-icon">👈</span>
                  <div class="hand-drag-trail"></div>
                  <span class="hand-icon">👉</span>
                </div>
                <span class="cue-hint">Desliza a los lados</span>
              </div>
              <div class="cue-divider">O</div>
              <!-- Guía teclado -->
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair">
                  <span class="key-cap" id="toy-key-left">◄ A</span>
                  <span class="key-cap" id="toy-key-right">D ►</span>
                </div>
                <span class="cue-hint">Mueve el saco</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "points":
        visualHTML = `
          <div class="ski-stage stage-toy-points">
            <div class="toy-points-grid">
              <!-- Regalos clásicos -->
              <div class="toy-point-card card-classic">
                <div class="point-badge-tag">+100 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/regalo-rojo.png" alt="Regalo Rojo" />
                  <img src="./assets/images/regalo-verde.png" alt="Regalo Verde" />
                </div>
                <span class="point-label">Regalos Festivos</span>
              </div>

              <!-- Juguetes especiales -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+150 PTS</div>
                <div class="point-images-duo">
                  <img src="./assets/images/osito.png" alt="Osito de Peluche" />
                  <img src="./assets/images/robot.png" alt="Robot Mecánico" />
                </div>
                <span class="point-label">Juguetes Especiales</span>
              </div>

              <!-- Caja Patrocinador / Estrella -->
              <div class="toy-point-card card-star">
                <div class="point-badge-tag tag-gold">+250 PTS • PODER x2</div>
                <div class="point-single-star">
                  <img src="./assets/images/estrella con logo.png" alt="Estrella Dorada" class="star-pulse-img" />
                </div>
                <span class="point-label">¡Imán & Doble Puntos!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards":
        visualHTML = `
          <div class="ski-stage stage-toy-hazards">
            <div class="toy-hazard-split">
              <!-- Carbón -->
              <div class="hazard-card card-coal">
                <div class="hazard-title-badge">🔥 CARBÓN ARDIENTE</div>
                <img src="./assets/images/carbon.png" alt="Carbón" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag">RESTA PUNTOS • ROMPE COMBO</span>
              </div>

              <!-- Hielo -->
              <div class="hazard-card card-ice">
                <div class="hazard-title-badge badge-ice">❄️ CRISTAL DE HIELO</div>
                <img src="./assets/images/hielo.png" alt="Hielo" class="hazard-sprite-img" />
                <span class="hazard-penalty-tag tag-red">-1 VIDA ❤️ • TE CONGELA</span>
              </div>
            </div>
            <!-- Alerta de 5 vidas -->
            <div class="toy-lives-indicator-box">
              <span class="lives-title">TUS VIDAS:</span>
              <div class="lives-hearts-row">
                <span>❤️</span><span>❤️</span><span>❤️</span><span>❤️</span><span>❤️</span>
              </div>
              <span class="lives-hint">¡Esquiva el hielo para no perder vidas!</span>
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
            <span class="protip-icon">💡</span>
            <span class="protip-text">${data.proTip}</span>
          </div>
        </div>
      </div>
    `;

    this.playStepAnimation();
  }

  private playEntranceAnimation(): void {
    const card = this.container.querySelector(".ski-tutorial-card");
    if (!card) return;

    this.audio.playPowerUp();
    gsap.fromTo(
      card,
      { scale: 0.82, opacity: 0, y: 35 },
      { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.5)" }
    );
  }

  private playStepAnimation(): void {
    const data = this.steps[this.currentStep];
    const infoCol = this.container.querySelector(".ski-info-column");
    const visualCol = this.container.querySelector(".ski-visual-column");

    if (infoCol) {
      gsap.fromTo(infoCol, { opacity: 0, x: 25 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" });
    }
    if (visualCol) {
      gsap.fromTo(visualCol, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" });
    }

    // Animaciones interactivas por paso
    if (data.stageType === "controls") {
      this.startControlsDemoLoop();
    } else if (data.stageType === "story") {
      this.startStoryFallingGiftsLoop();
    }
  }

  private startStoryFallingGiftsLoop(): void {
    const gifts = this.container.querySelectorAll(".gift-fall");
    gifts.forEach((g, idx) => {
      gsap.fromTo(
        g,
        { y: -60, opacity: 0, rotation: -20 },
        {
          y: 70,
          opacity: 1,
          rotation: 20,
          duration: 1.6 + idx * 0.4,
          repeat: -1,
          delay: idx * 0.5,
          ease: "power1.in"
        }
      );
    });
  }

  private startControlsDemoLoop(): void {
    const bag = this.container.querySelector<HTMLElement>("#toy-bag-moving-demo");
    const keyLeft = this.container.querySelector<HTMLElement>("#toy-key-left");
    const keyRight = this.container.querySelector<HTMLElement>("#toy-key-right");

    if (!bag) return;

    let dir = 1;
    this.stepInterval = setInterval(() => {
      dir *= -1;
      if (dir === 1) {
        gsap.to(bag, { x: 50, rotation: 6, duration: 0.55, ease: "power1.inOut" });
        if (keyRight) keyRight.classList.add("key-active");
        if (keyLeft) keyLeft.classList.remove("key-active");
      } else {
        gsap.to(bag, { x: -50, rotation: -6, duration: 0.55, ease: "power1.inOut" });
        if (keyLeft) keyLeft.classList.add("key-active");
        if (keyRight) keyRight.classList.remove("key-active");
      }
    }, 700);
  }

  private clearStepTimers(): void {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  private setupEvents(): void {
    // 1. Cerrar / Saltar
    const btnClose = this.container.querySelector("#btn-toy-close-quick");
    btnClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    // 2. Anterior
    const btnPrev = this.container.querySelector("#btn-toy-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    // 3. Siguiente
    const btnNext = this.container.querySelector("#btn-toy-next");
    btnNext?.addEventListener("click", () => {
      if (this.currentStep < this.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    // 4. ¡A Jugar!
    const btnPlay = this.container.querySelector("#btn-toy-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playPowerUp();
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });
      this.savePreferences();
      this.hide();
      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    // 5. Clics en stepper
    this.container.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest(".ski-step-pill");
      if (target) {
        const step = parseInt(target.getAttribute("data-step") || "0", 10);
        if (!isNaN(step) && step >= 0 && step < this.steps.length && step !== this.currentStep) {
          this.audio.playTap();
          this.currentStep = step;
          this.renderStepContent();
        }
      }
    });
  }

  private savePreferences(): void {
    const chk = this.container.querySelector<HTMLInputElement>("#chk-toy-dont-show-again");
    if (chk && chk.checked) {
      this.markTutorialSeen();
    }
  }
}
