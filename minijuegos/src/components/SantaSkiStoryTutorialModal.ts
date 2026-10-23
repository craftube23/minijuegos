/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡ESQUÍ ALPINO DE SANTA!
 * ==============================================================================
 *
 * Muestra la historia festiva de la misión en la montaña y enseña a jugar
 * de forma 100% visual y animada (reemplazando textos estáticos aburridos):
 *
 * 1. 📖 Capítulo 1 - La Misión en la Cumbre: Emergencia navideña y descenso.
 * 2. 🕹️ Capítulo 2 - Controles & Carving: Manos táctiles y teclas alternadas.
 * 3. 🚩 Capítulo 3 - Puertas de Eslalon & Rampas: Turbos, combos y saltos 360°.
 * 4. 🌲 Capítulo 4 - Obstáculos & Súper Turbo: Choques, vidas y demolición dorada.
 * 5. ❄️ Capítulo 5 - ¡El Temible Yeti de Nieve!: La persecución gélida de alta montaña.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface TutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  visualType: "story" | "controls" | "slalom_ramps" | "hazards_turbo" | "yeti";
}

export class SantaSkiStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private animTimeline: gsap.core.Timeline | null = null;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: TutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡Misión en la Cumbre de los Andes!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "Una feroz ventisca gélida inmovilizó el trineo de Santa en lo más alto de la cordillera de Santander. Para que la Navidad no se detenga, Santa se ha calzado sus veloces esquís mágicos para descender a toda velocidad por la montaña y llevar todos los regalos a la gran inauguración de la <strong>Feria Mágica del Juguete</strong>.",
      proTip: "¡Ayuda a Santa a esquiar cuesta abajo, mantener el ritmo y llegar a salvo!",
      visualType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES",
      title: "¡Aprende a Esquiar y Carvear!",
      badge: "CONTROLES INTERACTIVOS",
      badgeColor: "#00E5FF",
      storyText:
        "Desliza tu dedo en la pantalla hacia los lados o usa las teclas <strong>[ ◄ / ► ]</strong> o <strong>[ A / D ]</strong> en tu teclado. Al moverte, Santa inclinará sus esquís despidiendo nubes de nieve polvo. Mantenerte esquiando sin chocar activará tu <strong>Racha de Flujo</strong> (+12%, +24% y +38% de velocidad con multiplicador x2 de puntos).",
      proTip: "¡Los movimientos suaves te permitirán esquivar mejor en curvas cerradas!",
      visualType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • ESLALON Y RAMPAS",
      title: "¡Banderas Turbo y Saltos 360°!",
      badge: "VELOCIDAD Y TRUCOS",
      badgeColor: "#00E676",
      storyText:
        "Pasa exactamente por el centro de las <strong>Puertas de Eslalon</strong> con banderas festivas para ganar <strong>+150 pts</strong> y activar el <strong>Turbo Eslalon</strong> acumulando combos. Además, embiste las <strong>Rampas de Salto</strong> con flechas doradas para elevarte por los cielos realizando acrobacias 360° con <strong>+300 pts</strong>.",
      proTip: "¡Encadenar varias puertas seguidas desatará una aceleración legendaria!",
      visualType: "slalom_ramps"
    },
    {
      tag: "CAPÍTULO 4 • PELIGROS Y PODER",
      title: "¡Esquiva Peligros o Demuélelos!",
      badge: "SUPERVIVENCIA & POWER-UP",
      badgeColor: "#FF9100",
      storyText:
        "¡Cuidado con los pinos nevados, muñecos de nieve y los <strong>Carteles de Patrocinadores</strong>! Si chocas con ellos perderás 1 vida y romperás tu racha. Pero si recoges la <strong>Estrella Dorada</strong>, activarás el <strong>SÚPER TURBO</strong>: serás completamente invencible y demolerás los carteles a tu paso (+250 pts).",
      proTip: "¡Tienes 3 vidas en total; conduce con precisión para sobrevivir!",
      visualType: "hazards_turbo"
    },
    {
      tag: "CAPÍTULO 5 • ¡ALERTA YETI!",
      title: "¡El Abominable Monstruo de Nieve!",
      badge: "PELIGRO EN LA NIEVE",
      badgeColor: "#FF1744",
      storyText:
        "¡No te duermas en la pista! Si esquías muy lento o tardas en avanzar, el <strong>Abominable Yeti de Nieve</strong> bajará rugiendo colina abajo con sus cuernos de hielo para atraparte. ¡Mantén tu velocidad alta, cruza las puertas de eslalon y salta en las rampas para dejarlo atrás!",
      proTip: "¡El indicador superior te avisará a cuántos metros te sigue el Yeti!",
      visualType: "yeti"
    }
  ];

  constructor(containerId: string = "santa-ski-tutorial-modal", audio: AudioManager) {
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
        <!-- Nieve y guirnaldas sobre el marco -->
        <div class="ski-snow-roof">
          <div class="ski-snow-cap"></div>
          <div class="ski-icicle icicle-1"></div>
          <div class="ski-icicle icicle-2"></div>
          <div class="ski-icicle icicle-3"></div>
        </div>

        <!-- Encabezado con medallón de la Feria Mágica -->
        <div class="ski-tutorial-header">
          <div class="ski-emblem-box">
            <img src="./assets/images/medallon-feria.png" alt="Feria Mágica" class="ski-feria-seal" />
          </div>
          <div class="ski-header-title-wrap">
            <span class="ski-header-sub">FERIA MÁGICA DEL JUGUETE</span>
            <h2 class="ski-header-title">¡HISTORIA & GUÍA DE ESQUÍ!</h2>
          </div>
          <button id="btn-ski-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <!-- Barra de progreso / Pestañas de capítulos -->
        <div class="ski-stepper-bar">
          ${this.steps.map((_s, idx) => `
            <button class="ski-step-pill ${idx === 0 ? "active" : ""}" data-step="${idx}">
              <span class="step-num">${idx + 1}</span>
              <span class="step-name">${["Historia", "Controles", "Eslalon", "Peligros", "Yeti"][idx]}</span>
            </button>
          `).join("")}
        </div>

        <!-- Contenedor principal de la etapa activa -->
        <div class="ski-tutorial-body" id="ski-tutorial-body">
          <!-- Renderizado dinámico en renderStepContent() -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-ski-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-ski-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-ski-play-now" class="btn-ski-action-play">
              <span>¡A ESQUIAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#ski-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de pie
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-ski-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-ski-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-ski-play-now");

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

    // Renderizar escenario animado según el paso
    let visualHTML = "";
    switch (data.visualType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
              <div class="animated-snowflakes-box"></div>
            </div>
            <div class="stage-mountain-peak">
              <img src="./assets/images/santa-ski-straight.png" alt="Santa Esquiador" class="santa-hero-story" />
              <div class="santa-snow-pedestal"></div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.png" alt="Estrella Feria" class="story-star-badge" />
              <span>OBJETIVO: INAUGURAR LA FERIA DEL JUGUETE</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-controls">
            <div class="stage-controls-track">
              <div class="track-carve-lines"></div>
              <div class="santa-control-demo" id="santa-control-demo">
                <img src="./assets/images/santa-ski-straight.png" alt="Santa" id="santa-demo-sprite" class="demo-skier-img" />
                <div class="demo-ski-spray" id="demo-ski-spray"></div>
              </div>
            </div>
            <div class="controls-overlay-cues">
              <!-- Guía táctil -->
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL / MOUSE</span>
                <div class="touch-hand-anim">
                  <span class="hand-icon">${getIconSvg("arrowLeft", { size: 16, color: "#00E5FF" })}</span>
                  <div class="hand-drag-trail"></div>
                  <span class="hand-icon">${getIconSvg("arrowRight", { size: 16, color: "#00E5FF" })}</span>
                </div>
                <span class="cue-hint">Desliza a los lados</span>
              </div>
              <div class="cue-divider">O</div>
              <!-- Guía teclado -->
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair">
                  <span class="key-cap key-left" id="key-cap-left">◄ A</span>
                  <span class="key-cap key-right" id="key-cap-right">D ►</span>
                </div>
                <span class="cue-hint">Pulsa para girar</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "slalom_ramps":
        visualHTML = `
          <div class="ski-stage stage-slalom-ramps">
            <div class="slalom-demo-card">
              <div class="demo-card-header">
                <span class="card-chip chip-green">PUERTA DE ESLALON</span>
                <span class="card-pts">+150 PTS • TURBO</span>
              </div>
              <div class="demo-card-visual gate-visual">
                <img src="./assets/images/puerta-eslalon-3d.png" alt="Puerta Eslalon" class="demo-gate-img" />
                <img src="./assets/images/santa-ski-straight.png" alt="Santa Cruzando" class="demo-santa-gate" />
                <div class="turbo-burst-badge">¡TURBO ESLALON!</div>
              </div>
            </div>

            <div class="slalom-demo-card">
              <div class="demo-card-header">
                <span class="card-chip chip-cyan">RAMPA DE SALTO</span>
                <span class="card-pts">+300 PTS • SALTO 360°</span>
              </div>
              <div class="demo-card-visual ramp-visual">
                <img src="./assets/images/rampa-esqui-downhill.png" alt="Rampa" class="demo-ramp-img" />
                <img src="./assets/images/santa-ski-jump.png" alt="Santa en el Aire" class="demo-santa-jump" />
                <div class="jump-sparkle-badge">¡GRAN SALTO 360°!</div>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards_turbo":
        visualHTML = `
          <div class="ski-stage stage-hazards-turbo">
            <div class="hazard-split danger-side">
              <div class="split-title-bar bar-danger">
                <span>PELIGROS (-1 VIDA)</span>
              </div>
              <div class="hazard-props-row">
                <div class="prop-hazard-item">
                  <img src="./assets/images/arbol.webp" alt="Pino Nevado" />
                  <span>Pino</span>
                </div>
                <div class="prop-hazard-item">
                  <img src="./assets/images/obstaculo-muneco-estilizado.png" alt="Muñeco" />
                  <span>Muñeco</span>
                </div>
                <div class="prop-hazard-item">
                  <div class="mini-wood-billboard">
                    <span class="mini-bb-label">PATROCINADOR</span>
                  </div>
                  <span>Cartel</span>
                </div>
              </div>
              <div class="crash-preview-box">
                <img src="./assets/images/santa-ski-crash.png" alt="Choque en Nieve" class="demo-santa-crash" />
                <span class="crash-alert-tag">¡GOLPE Y RACHA PERDIDA!</span>
              </div>
            </div>

            <div class="hazard-split turbo-side">
              <div class="split-title-bar bar-turbo">
                <span>SÚPER TURBO (+250 PTS)</span>
              </div>
              <div class="turbo-power-showcase">
                <img src="./assets/images/estrella con logo.png" alt="Estrella Dorada" class="demo-star-power" />
                <div class="turbo-smash-demo">
                  <span class="smash-impact-star">${getIconSvg("sparkles", { size: 24, color: "#FFD700" })}</span>
                  <span class="smash-tag">¡ARRASA Y DEMUELE TODO!</span>
                </div>
              </div>
              <p class="turbo-tip-text">Al agarrar la Estrella serás invencible y demolerás los carteles con lluvia de astillas.</p>
            </div>
          </div>
        `;
        break;

      case "yeti":
        visualHTML = `
          <div class="ski-stage stage-yeti">
            <div class="yeti-chase-arena">
              <div class="yeti-frost-aura"></div>
              <img src="./assets/images/yeti-run1.webp" alt="Yeti de Nieve" class="demo-yeti-monster" id="demo-yeti-sprite" />
              <div class="yeti-chase-target">
                <img src="./assets/images/santa-ski-straight.png" alt="Santa Huyendo" class="demo-santa-flee" />
              </div>
              <div class="yeti-warning-banner">
                <span class="yeti-skull-icon">${getIconSvg("shield", { size: 16, color: "#FF1744" })}</span>
                <span>¡ALERTA: EL YETI DE NIEVE TE PERSIGUE!</span>
              </div>
            </div>
            <div class="yeti-escape-tips">
              <div class="escape-rule">
                <span class="rule-icon">${getIconSvg("sparkles", { size: 14, color: "#00E5FF" })}</span>
                <span>Mantén combos de eslalon para ir más rápido que él.</span>
              </div>
              <div class="escape-rule">
                <span class="rule-icon">${getIconSvg("arrowRight", { size: 14, color: "#00E676" })}</span>
                <span>Toma rampas acrobáticas para dejarlo atrás.</span>
              </div>
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
      gsap.fromTo(
        infoCol,
        { opacity: 0, x: 25 },
        { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
      );
    }

    if (visualCol) {
      gsap.fromTo(
        visualCol,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" }
      );
    }

    // Animaciones específicas interactivas por paso
    if (data.visualType === "controls") {
      this.startControlsDemoLoop();
    } else if (data.visualType === "yeti") {
      this.startYetiDemoLoop();
    } else if (data.visualType === "slalom_ramps") {
      this.startSlalomRampDemoLoop();
    }
  }

  private startControlsDemoLoop(): void {
    const sprite = this.container.querySelector<HTMLImageElement>("#santa-demo-sprite");
    const demoBox = this.container.querySelector<HTMLElement>("#santa-control-demo");
    const keyLeft = this.container.querySelector<HTMLElement>("#key-cap-left");
    const keyRight = this.container.querySelector<HTMLElement>("#key-cap-right");

    if (!sprite || !demoBox) return;

    let dir = 1;
    this.stepInterval = setInterval(() => {
      dir *= -1;
      if (dir === 1) {
        sprite.src = "./assets/images/santa-ski-right.png";
        gsap.to(demoBox, { x: 55, rotation: 8, duration: 0.55, ease: "power1.inOut" });
        if (keyRight) keyRight.classList.add("key-active");
        if (keyLeft) keyLeft.classList.remove("key-active");
      } else {
        sprite.src = "./assets/images/santa-ski-left.png";
        gsap.to(demoBox, { x: -55, rotation: -8, duration: 0.55, ease: "power1.inOut" });
        if (keyLeft) keyLeft.classList.add("key-active");
        if (keyRight) keyRight.classList.remove("key-active");
      }
    }, 700);
  }

  private startYetiDemoLoop(): void {
    const yetiSprite = this.container.querySelector<HTMLImageElement>("#demo-yeti-sprite");
    if (!yetiSprite) return;

    let step = 0;
    this.stepInterval = setInterval(() => {
      step = 1 - step;
      yetiSprite.src = step === 0 ? "./assets/images/yeti-run1.webp" : "./assets/images/yeti-run2.webp";
    }, 280);
  }

  private startSlalomRampDemoLoop(): void {
    const turboBadge = this.container.querySelector<HTMLElement>(".turbo-burst-badge");
    const jumpBadge = this.container.querySelector<HTMLElement>(".jump-sparkle-badge");
    const santaJump = this.container.querySelector<HTMLElement>(".demo-santa-jump");

    if (turboBadge && jumpBadge && santaJump) {
      gsap.fromTo(
        santaJump,
        { y: 0, scale: 0.95, rotation: 0 },
        { y: -30, scale: 1.15, rotation: 360, duration: 1.2, repeat: -1, yoyo: true, ease: "power2.inOut" }
      );
      gsap.fromTo(
        turboBadge,
        { scale: 0.9, opacity: 0.8 },
        { scale: 1.1, opacity: 1, duration: 0.6, repeat: -1, yoyo: true, ease: "power1.inOut" }
      );
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

  private setupEvents(): void {
    // 1. Botón cerrar rápido
    const btnClose = this.container.querySelector("#btn-ski-close-quick");
    btnClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    // 2. Botón anterior
    const btnPrev = this.container.querySelector("#btn-ski-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    // 3. Botón siguiente
    const btnNext = this.container.querySelector("#btn-ski-next");
    btnNext?.addEventListener("click", () => {
      if (this.currentStep < this.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    // 4. Botón ¡A Esquiar! (Inicio inmediato con confeti festivo)
    const btnPlay = this.container.querySelector("#btn-ski-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playPowerUp();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 }
      });
      this.savePreferences();
      this.hide();
      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    // 5. Clics en los botones de paso del stepper
    this.container.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest(".ski-step-pill");
      if (target) {
        const step = parseInt(target.getAttribute("data-step") || "0", 10);
        if (!isNaN(step) && step !== this.currentStep) {
          this.audio.playTap();
          this.currentStep = step;
          this.renderStepContent();
        }
      }
    });
  }

  private savePreferences(): void {
    const chk = this.container.querySelector<HTMLInputElement>("#chk-ski-dont-show-again");
    if (chk && chk.checked) {
      try {
        localStorage.setItem("santa_ski_story_tutorial_seen", "true");
      } catch (err) {
        // Ignorar en sandbox
      }
    }
  }
}
