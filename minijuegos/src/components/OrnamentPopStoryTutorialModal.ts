/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡NINJA CORTA-REGALOS!
 * ==============================================================================
 *
 * Muestra la historia del Dojo del Taller y enseña las mecánicas del juego
 * de corte al vuelo siguiendo la misma estructura y diseño de los primeros juegos:
 *
 * 1. 📖 Capítulo 1 - El Desafío del Dojo: Los juguetes saltan al aire en el Taller de Santa.
 * 2. 🕹️ Capítulo 2 - Tajo de Espada & Combos: Desliza el dedo y rebana 3+ objetos seguidos.
 * 3. ⏰ Capítulo 3 - Reloj Dorado & Poderes: +5s extra, Cristal Glacial y Piñata Estrella.
 * 4. 💣 Capítulo 4 - Bombas & Tiempo: ¡Las bombas de carbón te restan -6 segundos!
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface NinjaTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "controls" | "powers" | "hazards";
}

export class OrnamentPopStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: NinjaTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Gran Desafío del Dojo Navideño!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "¡Los juguetes y dulces mágicos de la <strong>Feria Mágica del Juguete</strong> han salido disparados por los aires en el Dojo de Santa! Cajas de regalo, galletas de jengibre y caramelos de menta cruzan la sala a toda velocidad. Empuña tu <strong>Espada de Luz Encantada</strong> y demuéstrale a los duendes tu destreza rebanando todo en dos mitades.",
      proTip: "¡Si se te escapa un regalo no pasa nada! No hay vidas que perder, concéntrate en sumar puntos.",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES & COMBOS",
      title: "¡Tajo de Espada y Cortes Múltiples!",
      badge: "CONTROLES TÁCTILES",
      badgeColor: "#00E5FF",
      storyText:
        "Desliza tu dedo en la pantalla o arrastra con el ratón trazando tajos rápidos y precisos. Cada objeto se partirá físicamente en <strong>dos mitades exactas</strong>. Si logras cortar <strong>3, 4 o 5+ objetos en un solo tajo continuo</strong>, desatarás combos maestros con cientos de puntos extra.",
      proTip: "¡Espera a que varios regalos se crucen en el aire para atravesarlos todos de un solo golpe!",
      stageType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • RELOJ +5s & PODERES",
      title: "¡Reloj Dorado (+5s) y Piñata Estrella!",
      badge: "TIEMPO EXTRA & FRENESÍ",
      badgeColor: "#00E676",
      storyText:
        "¡Atento a los objetos legendarios! Corta el <strong>Reloj Dorado Mágico</strong> cada vez que aparezca para sumar <strong>+5 SEGUNDOS EXTRA</strong> a tu cronómetro. Corta el <strong>Cristal Glacial</strong> para congelar el tiempo en cámara lenta, la <strong>Esfera Arcoíris</strong> para una lluvia frenesí y la <strong>Piñata Estrella</strong> para rebanarla hasta 10 veces seguidas.",
      proTip: "¡Corta también los Cofres de Patrocinadores para activar Puntos Dobles x2 en todo el Dojo!",
      stageType: "powers"
    },
    {
      tag: "CAPÍTULO 4 • ¡PELIGROS Y ENEMIGOS!",
      title: "¡Bombas y el Duende Ladrón del Hielo!",
      badge: "PELIGROS DEL DOJO",
      badgeColor: "#FF1744",
      storyText:
        "¡Cuidado con las amenazas! Las <strong>Bombas de Carbón</strong> restan <strong>-6 SEGUNDOS</strong> si las tocas con tu tajo. Además, en las oleadas avanzadas atacará el travieso <strong>Duende Ladrón del Hielo</strong>: córtalo <strong>3 veces seguidas</strong> para romper su escudo glacial y derrotarlo. ¡Si lo dejas escapar con vida, te robará <strong>-4 SEGUNDOS</strong> del reloj!",
      proTip: "¡Al derrotar al Duende ganarás +400 puntos y soltará de inmediato un Reloj Dorado (+5s) de regalo!",
      stageType: "hazards"
    }
  ];

  constructor(containerId: string = "ornament-pop-tutorial-modal", audio: AudioManager) {
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: NINJA CORTA-REGALOS!</h2>
          </div>
          <button id="btn-ninja-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <!-- Barra de progreso de capítulos -->
        <div class="ski-stepper-bar">
          ${this.steps.map((_s, idx) => `
            <button class="ski-step-pill ${idx === 0 ? "active" : ""}" data-step="${idx}">
              <span class="step-num">${idx + 1}</span>
              <span class="step-name">${["Historia", "Cortes", "Reloj +5s", "Bombas"][idx]}</span>
            </button>
          `).join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="ninja-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-ninja-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-ninja-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-ninja-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#ninja-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de pie
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-ninja-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-ninja-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-ninja-play-now");

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

    // Renderizar escenario visual interactivo
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-toy-story" style="background: radial-gradient(circle at 50% 50%, #3B1E10 0%, #170904 100%);">
            <div class="toy-story-scene" style="gap: 10px; height: auto; min-height: 0;">
              <div class="toy-falling-gifts-demo">
                <img src="./assets/images/regalo-estilizado-rojo.webp" alt="Regalo" class="gift-fall gift-fall-1" style="width: 38px; height: 38px; object-fit: contain;" />
                <img src="./assets/images/galleta-jengibre.webp" alt="Galleta" class="gift-fall gift-fall-2" style="width: 40px; height: 40px; object-fit: contain;" />
                <img src="./assets/images/caramelo-menta.webp" alt="Caramelo" class="gift-fall gift-fall-3" style="width: 36px; height: 36px; object-fit: contain;" />
              </div>
              <div class="toy-bag-hero-wrapper" style="margin-top: 0;">
                <div class="toy-bag-golden-glow" style="background: radial-gradient(circle, rgba(0,229,255,0.45), transparent 70%);"></div>
                <img src="./assets/images/icon-ninja-regalos.webp" alt="Ninja Regalos" class="toy-bag-hero-img" style="max-width: 80px; max-height: 75px; object-fit: contain;" />
              </div>
            </div>
            <div class="stage-story-badge" style="position: relative; top: auto; bottom: auto; margin-top: 6px; background: rgba(255,215,0,0.18); border-color: #FFD700; padding: 3px 10px; font-size: 0.65rem;">
              <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="story-star-badge" />
              <span>OBJETIVO: ¡REBANA TODO EN DOS MITADES!</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-toy-controls" style="background: radial-gradient(circle at 50% 50%, #351A0D 0%, #140803 100%);">
            <div class="toy-controls-track" style="display: flex; align-items: center; justify-content: space-evenly; flex: 1; min-height: 0;">
              <div style="position: relative; display: flex; align-items: center; justify-content: center; gap: clamp(10px, 2.5vw, 24px);">
                <img src="./assets/images/regalo-estilizado-verde.webp" alt="Regalo" class="ninja-demo-item" />
                <img src="./assets/images/galleta-jengibre.webp" alt="Galleta" class="ninja-demo-item" />
                <img src="./assets/images/caramelo-menta.webp" alt="Caramelo" class="ninja-demo-item" />
                <div id="ninja-demo-slash" style="position: absolute; left: -10%; right: -10%; height: 5px; border-radius: 4px; background: linear-gradient(90deg, transparent, #00E5FF, #FFFFFF, #FFD700, transparent); box-shadow: 0 0 16px #00E5FF; transform: rotate(-10deg);"></div>
              </div>
            </div>
            <div class="controls-overlay-cues">
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL / RATÓN</span>
                <div class="touch-hand-anim">
                  <span class="hand-icon">◀</span>
                  <div class="hand-drag-trail" style="background: linear-gradient(90deg, #00E5FF, #FFD700);"></div>
                  <span class="hand-icon">▶</span>
                </div>
                <span class="cue-hint">Desliza para cortar en ráfaga</span>
              </div>
              <div class="cue-divider">✦</div>
              <div class="keys-cue-box">
                <span class="cue-label">COMBOS DE UN SOLO TAJO</span>
                <div class="key-caps-pair">
                  <span class="key-cap" style="border-color: #FFD700; color: #FFD700;">x3 TRIPLE</span>
                  <span class="key-cap" style="border-color: #00E5FF; color: #00E5FF;">x4 CUÁDRUPLE</span>
                </div>
                <span class="cue-hint">Atraviesa varios a la vez</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "powers":
        visualHTML = `
          <div class="ski-stage stage-toy-points" style="background: radial-gradient(circle at 50% 50%, #1A375E 0%, #08162A 100%);">
            <div class="toy-points-grid" style="grid-template-columns: repeat(3, 1fr);">
              <!-- Reloj +5s -->
              <div class="toy-point-card card-star" style="border-color: #00E676;">
                <div class="point-badge-tag" style="background: #00E676; color: #062817;">+5s TIEMPO EXTRA</div>
                <div class="point-single-star">
                  <img src="./assets/images/reloj-magico-tiempo.webp" alt="Reloj +5s" class="star-pulse-img" style="width: 68px; height: 68px; object-fit: contain;" />
                </div>
                <span class="point-label">¡Reloj Dorado (+5s)!</span>
              </div>

              <!-- Piñata Multigolpe -->
              <div class="toy-point-card card-special">
                <div class="point-badge-tag tag-purple">+500 PTS</div>
                <div class="point-single-star">
                  <img src="./assets/images/pinata-estrella.webp" alt="Piñata Estrella" style="width: 70px; height: 70px; object-fit: contain;" />
                </div>
                <span class="point-label">¡Rebana hasta 10 veces!</span>
              </div>

              <!-- Cristal Glacial -->
              <div class="toy-point-card card-classic" style="border-color: #00E5FF;">
                <div class="point-badge-tag" style="background: #00E5FF; color: #052636;">CÁMARA LENTA</div>
                <div class="point-single-star">
                  <img src="./assets/images/fruta-cristal-hielo.webp" alt="Cristal Glacial" style="width: 65px; height: 65px; object-fit: contain;" />
                </div>
                <span class="point-label">¡Tiempo Congelado!</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "hazards":
        visualHTML = `
          <div class="ski-stage stage-toy-hazards" style="background: radial-gradient(circle at 50% 50%, #451218 0%, #140406 100%);">
            <div class="toy-hazard-split">
              <!-- Bomba de Carbón -->
              <div class="hazard-card card-coal" style="border-color: #FF1744; flex: 1.1;">
                <div class="hazard-title-badge" style="background: #FF1744; color: #FFFFFF;">BOMBA DE CARBÓN</div>
                <img src="./assets/images/bomba-carbon-dorada.webp" alt="Bomba" class="hazard-sprite-img" style="width: 78px; height: 78px; object-fit: contain; filter: drop-shadow(0 0 18px rgba(255,23,68,0.8));" />
                <span class="hazard-penalty-tag tag-red">-6 SEGUNDOS AL TOCARLA</span>
              </div>

              <!-- Duende Ladrón del Hielo -->
              <div class="hazard-card card-ice" style="border-color: #00E5FF; flex: 1.1; background: radial-gradient(circle at 50% 40%, rgba(0,229,255,0.18), transparent 75%);">
                <div class="hazard-title-badge badge-ice" style="background: #00E5FF; color: #041B2D;">DUENDE LADRÓN</div>
                <img src="./assets/images/duende-hielo.webp" alt="Duende Hielo" class="hazard-sprite-img" style="width: 82px; height: 82px; object-fit: contain; filter: drop-shadow(0 0 16px rgba(0,229,255,0.75));" />
                <span class="hazard-penalty-tag" style="background: rgba(0,229,255,0.22); color: #00E5FF; border: 1px solid #00E5FF;">¡3 TAJOS O ROBA -4s!</span>
              </div>
            </div>
            <div class="toy-lives-indicator-box" style="background: rgba(0,0,0,0.45); border: 2px solid #00E676;">
              <span class="lives-title" style="color: #00E676;">BOTÍN LEGENDARIO:</span>
              <span class="lives-hint" style="color: #FFFFFF; font-weight: 700;">¡Vence al Duende Ladrón para ganar +400 pts y un Reloj Dorado (+5s) gratis!</span>
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
            <span class="protip-icon">✦</span>
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

    if (data.stageType === "story") {
      this.startStoryFallingGiftsLoop();
    } else if (data.stageType === "controls") {
      this.startControlsDemoLoop();
    }
  }

  private startStoryFallingGiftsLoop(): void {
    const gifts = this.container.querySelectorAll(".gift-fall");
    gifts.forEach((g, idx) => {
      gsap.fromTo(
        g,
        { y: -50, opacity: 0, rotation: -20 },
        {
          y: 65,
          opacity: 1,
          rotation: 20,
          duration: 1.5 + idx * 0.4,
          repeat: -1,
          delay: idx * 0.4,
          ease: "power1.in"
        }
      );
    });
  }

  private startControlsDemoLoop(): void {
    const slash = this.container.querySelector<HTMLElement>("#ninja-demo-slash");
    if (!slash) return;

    this.stepInterval = setInterval(() => {
      gsap.fromTo(
        slash,
        { scaleX: 0.1, opacity: 0.2 },
        { scaleX: 1.1, opacity: 1, duration: 0.45, ease: "power2.out" }
      );
    }, 900);
  }

  private clearStepTimers(): void {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  private setupEvents(): void {
    const btnClose = this.container.querySelector("#btn-ninja-close-quick");
    btnClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    const btnPrev = this.container.querySelector("#btn-ninja-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-ninja-next");
    btnNext?.addEventListener("click", () => {
      if (this.currentStep < this.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    const btnPlay = this.container.querySelector("#btn-ninja-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playPowerUp();
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });
      this.savePreferences();
      this.hide();
      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

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
    const chk = this.container.querySelector<HTMLInputElement>("#chk-ninja-dont-show-again");
    if (chk && chk.checked) {
      this.markTutorialSeen();
    }
  }
}
