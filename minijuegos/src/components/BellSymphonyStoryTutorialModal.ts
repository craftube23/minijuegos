/**
 * ==============================================================================
 * MODAL ANIMADO DE HISTORIA & TUTORIAL VISUAL - ¡SINFONÍA DE CAMPANAS NAVIDEÑAS!
 * ==============================================================================
 *
 * Muestra la historia del Campanario Real de Santa y enseña a dominar el juego
 * de ritmo arcade con una experiencia 100% visual, animada y de alto contraste:
 *
 * 1. Capítulo 1 - El Concierto Real de Nochebuena: La historia del Campanario Mágico.
 * 2. Capítulo 2 - Los 4 Carriles & Controles Arcade: Teclas [D, F, J, K] y toques táctiles.
 * 3. Capítulo 3 - Notas Sostenidas (Rayos de Luz): Mantener presionado hasta el final.
 * 4. Capítulo 4 - Racha x4, Star Power & 5 Vidas: Multiplicadores, notas estrella y precisión.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface BellTutorialStepData {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: "story" | "controls" | "sustain" | "combo";
}

export class BellSymphonyStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: () => void;
  public onClose?: () => void;

  private readonly steps: BellTutorialStepData[] = [
    {
      tag: "CAPÍTULO 1 • LA HISTORIA",
      title: "¡El Concierto Real de Nochebuena!",
      badge: "HISTORIA FESTIVA",
      badgeColor: "#FFD700",
      storyText:
        "En lo más alto del Campanario Encantado del Polo Norte, las <strong>4 Campanas Sagradas de la Navidad</strong> deben repicar para abrir el portal boreal que guía el trineo de Santa. Si las melodías pierden el compás, la magia se debilitará. ¡Santa te ha nombrado <strong>Director y Campanero Supremo</strong> para liderar la sinfonía!",
      proTip: "¡Siente el pulso de la música: la clave está en el compás y la anticipación!",
      stageType: "story"
    },
    {
      tag: "CAPÍTULO 2 • CONTROLES ARCADE",
      title: "¡Los 4 Carriles de Notas!",
      badge: "CONTROLES INTERACTIVOS",
      badgeColor: "#00E5FF",
      storyText:
        "Las notas musicales mágicas caen a través de 4 carriles de colores. Toca la pantalla justo cuando la nota coincida con el <strong>Anillo Objetivo</strong> en la base, o usa tu teclado:<br>" +
        "• <strong>Carril Rojo:</strong> Tecla <strong>[ D ]</strong> o <strong>[ ◄ ]</strong><br>" +
        "• <strong>Carril Dorado:</strong> Tecla <strong>[ F ]</strong> o <strong>[ ▼ ]</strong><br>" +
        "• <strong>Carril Verde:</strong> Tecla <strong>[ J ]</strong> o <strong>[ ▲ ]</strong><br>" +
        "• <strong>Carril Azul:</strong> Tecla <strong>[ K ]</strong> o <strong>[ ► ]</strong>",
      proTip: "¡En pantallas táctiles o tótems puedes usar ambos pulgares sobre los pads inferiores!",
      stageType: "controls"
    },
    {
      tag: "CAPÍTULO 3 • RAYOS DE LUZ",
      title: "¡Notas Sostenidas (Sustain)!",
      badge: "MECÁNICA AVANZADA",
      badgeColor: "#00E676",
      storyText:
        "¡No te limites a tocar una sola vez! Cuando veas una <strong>Nota Sostenida</strong> con una estela brillante o rayo de energía, debes <strong>MANTENER PRESIONADO</strong> el carril sin soltarlo. Conforme el rayo fluya acumularás puntos continuos (+10, +20, +50...) y al completar la cola recibirás un bono legendario de <strong>¡SUSTAIN PERFECTO!</strong>.",
      proTip: "¡Si sueltas el carril antes de que pase la cola de la nota, perderás el bono final!",
      stageType: "sustain"
    },
    {
      tag: "CAPÍTULO 4 • RACHA Y PODER",
      title: "¡Multiplicador x4 y Star Power!",
      badge: "PUNTUACIÓN DE LEYENDA",
      badgeColor: "#FF9100",
      storyText:
        "Cada impacto califica tu precisión: <strong>¡PERFECTO!</strong> (100%), <strong>¡GENIAL!</strong> o <strong>¡BIEN!</strong>. Encadenar notas sin fallar subirá tu multiplicador de racha a <strong>x2, x3 y x4</strong>. Además, toca las <strong>Notas Estrella con Logos Oficiales</strong> para cargar el <strong>Star Power</strong>. ¡Cuidado: si tienes un <strong>MISS</strong>, romperás el combo y <strong>perderás 1 de tus 5 vidas</strong>!",
      proTip: "¡Con 5 vidas dispones de margen, pero mantén la calma en pasajes rápidos!",
      stageType: "combo"
    }
  ];

  constructor(containerId: string = "bell-symphony-tutorial-modal", audio: AudioManager) {
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
      return localStorage.getItem("feria_tutorial_seen_bell-symphony") === "true";
    } catch {
      return false;
    }
  }

  public markTutorialSeen(): void {
    try {
      localStorage.setItem("feria_tutorial_seen_bell-symphony", "true");
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
            <h2 class="ski-header-title">¡HISTORIA & GUÍA: SINFONÍA DE CAMPANAS!</h2>
          </div>
          <button id="btn-bell-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
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
              <span class="step-name">${["Historia", "4 Carriles", "Sustain", "Star Power"][idx]}</span>
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="bell-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          <div class="ski-remember-box">
            <label class="ski-checkbox-container">
              <input type="checkbox" id="chk-bell-dont-show-again" />
              <span class="ski-checkmark"></span>
              <span class="ski-chk-label">No mostrar automáticamente</span>
            </label>
          </div>

          <div class="ski-nav-buttons">
            <button id="btn-bell-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-bell-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-bell-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const body = this.container.querySelector("#bell-tutorial-body");
    if (!body) return;

    const data = this.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar botones de navegación
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-bell-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-bell-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-bell-play-now");

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

    // Renderizar escenario visual personalizado de Bell Symphony
    let visualHTML = "";
    switch (data.stageType) {
      case "story":
        visualHTML = `
          <div class="ski-stage stage-bell-story">
            <div class="stage-sky-backdrop">
              <div class="floating-cloud cloud-1"></div>
              <div class="floating-cloud cloud-2"></div>
            </div>
            <!-- Campanario Real Mágico -->
            <div class="bell-story-scene">
              <div class="bell-belfry-arch">
                <div class="bell-glow-halo"></div>
                <img src="./assets/images/icon-campanas.png" alt="Campanas Mágicas" class="bell-belfry-hero-img" />
              </div>
              <div class="bell-notes-cascade">
                <div class="music-floating-note note-red">
                  <img src="./assets/images/flecha-izq.png" alt="Nota Roja" />
                </div>
                <div class="music-floating-note note-gold">
                  <img src="./assets/images/flecha-abajo.png" alt="Nota Dorada" />
                </div>
                <div class="music-floating-note note-green">
                  <img src="./assets/images/flecha-arriba.png" alt="Nota Verde" />
                </div>
                <div class="music-floating-note note-blue">
                  <img src="./assets/images/flecha-der.png" alt="Nota Azul" />
                </div>
              </div>
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.png" alt="Estrella" class="story-star-badge" />
              <span>MISIÓN: ¡HAZ REPICAR EL CAMPANARIO REAL!</span>
            </div>
          </div>
        `;
        break;

      case "controls":
        visualHTML = `
          <div class="ski-stage stage-bell-controls">
            <!-- Pista simulada de 4 carriles -->
            <div class="bell-sim-fretboard">
              <div class="fret-lane lane-red" id="fret-lane-0">
                <span class="lane-header-pill">ROJO</span>
                <div class="lane-track-strip">
                  <div class="sim-falling-note note-sim-0">
                    <img src="./assets/images/flecha-izq.png" alt="Izquierda" />
                  </div>
                </div>
                <div class="fret-target-ring ring-red">
                  <span class="target-key-label">D</span>
                </div>
              </div>

              <div class="fret-lane lane-gold" id="fret-lane-1">
                <span class="lane-header-pill">DORADO</span>
                <div class="lane-track-strip">
                  <div class="sim-falling-note note-sim-1">
                    <img src="./assets/images/flecha-abajo.png" alt="Abajo" />
                  </div>
                </div>
                <div class="fret-target-ring ring-gold">
                  <span class="target-key-label">F</span>
                </div>
              </div>

              <div class="fret-lane lane-green" id="fret-lane-2">
                <span class="lane-header-pill">VERDE</span>
                <div class="lane-track-strip">
                  <div class="sim-falling-note note-sim-2">
                    <img src="./assets/images/flecha-arriba.png" alt="Arriba" />
                  </div>
                </div>
                <div class="fret-target-ring ring-green">
                  <span class="target-key-label">J</span>
                </div>
              </div>

              <div class="fret-lane lane-blue" id="fret-lane-3">
                <span class="lane-header-pill">AZUL</span>
                <div class="lane-track-strip">
                  <div class="sim-falling-note note-sim-3">
                    <img src="./assets/images/flecha-der.png" alt="Derecha" />
                  </div>
                </div>
                <div class="fret-target-ring ring-blue">
                  <span class="target-key-label">K</span>
                </div>
              </div>
            </div>

            <!-- Guía de periféricos -->
            <div class="controls-overlay-cues bell-cues">
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair bell-keys-quad">
                  <span class="key-cap key-cap-red">D</span>
                  <span class="key-cap key-cap-gold">F</span>
                  <span class="key-cap key-cap-green">J</span>
                  <span class="key-cap key-cap-blue">K</span>
                </div>
                <span class="cue-hint">O usa flechas [ ◄ ▼ ▲ ► ]</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="touch-cue-box">
                <span class="cue-label">PANTALLA TÁCTIL / TÓTEM</span>
                <div class="bell-touch-pads-demo">
                  <div class="touch-tap-bubble pad-tap-red"></div>
                  <div class="touch-tap-bubble pad-tap-gold"></div>
                  <div class="touch-tap-bubble pad-tap-green"></div>
                  <div class="touch-tap-bubble pad-tap-blue"></div>
                </div>
                <span class="cue-hint">Toca las 4 campanas en la base</span>
              </div>
            </div>
          </div>
        `;
        break;

      case "sustain":
        visualHTML = `
          <div class="ski-stage stage-bell-sustain">
            <div class="sustain-demo-stage">
              <!-- Demostración del rayo continuo -->
              <div class="sustain-beam-track">
                <div class="sustain-lane-backdrop"></div>
                <div class="sustain-beam-glow">
                  <div class="sustain-head-bubble">
                    <img src="./assets/images/flecha-abajo.png" alt="Sustain Head" />
                  </div>
                  <div class="sustain-lightning-trail"></div>
                  <div class="sustain-tail-cap"></div>
                </div>
                <!-- Impact ring con feedback de sostener -->
                <div class="sustain-target-active">
                  <div class="sustain-hold-sparkles"></div>
                  <span class="hold-action-text">¡MANTÉN PRESIONADO!</span>
                </div>
              </div>

              <!-- Tarjetas informativas de Sustain -->
              <div class="sustain-callouts-col">
                <div class="sustain-card-box card-box-head">
                  <div class="callout-badge-tag">1. IMPACTO INICIAL</div>
                  <span class="callout-main-txt">Presiona exactamente al llegar la cabeza de la nota</span>
                </div>
                <div class="sustain-card-box card-box-hold">
                  <div class="callout-badge-tag tag-green">2. FLUJO CONTINUO (+10, +20, +50 pts)</div>
                  <span class="callout-main-txt">No sueltes tu dedo ni la tecla mientras pase el rayo</span>
                </div>
                <div class="sustain-card-box card-box-tail">
                  <div class="callout-badge-tag tag-gold">3. ¡SUSTAIN PERFECTO! (+150 pts)</div>
                  <span class="callout-main-txt">Recibe la gran bonificación al completar toda la cola</span>
                </div>
              </div>
            </div>
          </div>
        `;
        break;

      case "combo":
        visualHTML = `
          <div class="ski-stage stage-bell-combo">
            <div class="bell-combo-grid">
              <!-- Calificaciones Arcade -->
              <div class="bell-hud-card card-judgements">
                <span class="card-mini-title">PRECISIÓN ARCADE</span>
                <div class="judgement-pills-stack">
                  <div class="judgement-pill pill-perfect">
                    <span class="pill-word">¡PERFECTO!</span>
                    <span class="pill-score">+100 PTS</span>
                  </div>
                  <div class="judgement-pill pill-great">
                    <span class="pill-word">¡GENIAL!</span>
                    <span class="pill-score">+75 PTS</span>
                  </div>
                  <div class="judgement-pill pill-good">
                    <span class="pill-word">¡BIEN!</span>
                    <span class="pill-score">+50 PTS</span>
                  </div>
                  <div class="judgement-pill pill-miss">
                    <span class="pill-word">MISS (FALLO)</span>
                    <span class="pill-score">-1 VIDA</span>
                  </div>
                </div>
              </div>

              <!-- Multiplicador & Star Power -->
              <div class="bell-hud-card card-multiplier">
                <span class="card-mini-title">COMBO & STAR POWER</span>
                <div class="multiplier-hero-badge">
                  <span class="mult-prefix">RACHA</span>
                  <span class="mult-big-number">x4</span>
                  <span class="mult-sub">MÁXIMO MULTIPLICADOR</span>
                </div>
                <div class="star-power-demo-bar">
                  <div class="star-bar-fill">
                    <img src="./assets/images/estrella con logo.png" alt="Star" class="star-bar-icon" />
                    <span>¡MODO ESTRELLA ACTIVO!</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vidas protegidas -->
            <div class="bell-lives-card">
              <div class="bell-lives-header">
                <span class="lives-title-label">VIDAS DE LA ORQUESTA:</span>
                <span class="lives-count-badge">5 VIDAS</span>
              </div>
              <div class="bell-lives-notes-row">
                <div class="bell-life-note">${getIconSvg("music", { size: 18, color: "#FF3366" })}</div>
                <div class="bell-life-note">${getIconSvg("music", { size: 18, color: "#FF3366" })}</div>
                <div class="bell-life-note">${getIconSvg("music", { size: 18, color: "#FF3366" })}</div>
                <div class="bell-life-note">${getIconSvg("music", { size: 18, color: "#FF3366" })}</div>
                <div class="bell-life-note">${getIconSvg("music", { size: 18, color: "#FF3366" })}</div>
              </div>
              <span class="lives-footer-desc">¡Evita los fallos (MISS) para conservar todas tus vidas y llegar a la ovación final!</span>
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
      const heroBell = this.container.querySelector(".bell-belfry-hero-img");
      if (heroBell) {
        gsap.to(heroBell, {
          rotation: 8,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
      const notes = this.container.querySelectorAll(".music-floating-note");
      notes.forEach((note, i) => {
        gsap.to(note, {
          y: -18,
          duration: 1.2 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: i * 0.18
        });
      });
    } else if (data.stageType === "controls") {
      // Simular notas cayendo en los 4 carriles al compás y destellos de impacto
      let activeLane = 0;
      const lanes = [0, 1, 2, 3];
      const rings = this.container.querySelectorAll(".fret-target-ring");
      const keyCaps = this.container.querySelectorAll(".bell-keys-quad .key-cap");
      const touchPads = this.container.querySelectorAll(".bell-touch-pads-demo .touch-tap-bubble");

      this.stepInterval = setInterval(() => {
        const laneIdx = lanes[activeLane % lanes.length];
        const noteEl = this.container.querySelector<HTMLElement>(`.note-sim-${laneIdx}`);
        const ringEl = rings[laneIdx] as HTMLElement;
        const keyEl = keyCaps[laneIdx] as HTMLElement;
        const padEl = touchPads[laneIdx] as HTMLElement;

        if (noteEl) {
          gsap.fromTo(
            noteEl,
            { y: 0, opacity: 0.2, scale: 0.8 },
            {
              y: 130,
              opacity: 1,
              scale: 1.1,
              duration: 0.65,
              ease: "power2.in",
              onComplete: () => {
                // Tocar nota de campana real sintetizada
                this.audio.playBellNote(laneIdx);

                if (ringEl) {
                  gsap.fromTo(
                    ringEl,
                    { scale: 1.35, filter: "brightness(2)" },
                    { scale: 1, filter: "brightness(1)", duration: 0.25, ease: "back.out(2)" }
                  );
                }
                if (keyEl) {
                  gsap.fromTo(
                    keyEl,
                    { scale: 0.9, backgroundColor: "#FFD700", color: "#000" },
                    { scale: 1, backgroundColor: "", color: "", duration: 0.28 }
                  );
                }
                if (padEl) {
                  gsap.fromTo(
                    padEl,
                    { scale: 1.3, opacity: 1 },
                    { scale: 1, opacity: 0.6, duration: 0.25 }
                  );
                }
                gsap.to(noteEl, { opacity: 0, duration: 0.1 });
              }
            }
          );
        }
        activeLane++;
      }, 750);
    } else if (data.stageType === "sustain") {
      // Animación continua del rayo de sustain pulsando
      const trail = this.container.querySelector(".sustain-lightning-trail");
      const target = this.container.querySelector(".sustain-target-active");
      if (trail) {
        gsap.to(trail, {
          backgroundPosition: "0% 200%",
          duration: 1.6,
          repeat: -1,
          ease: "none"
        });
      }
      if (target) {
        gsap.to(target, {
          boxShadow: "0 0 25px rgba(255, 215, 0, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.8)",
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    } else if (data.stageType === "combo") {
      // Confeti sutil y pulso en el multiplicador x4
      const multHero = this.container.querySelector(".multiplier-hero-badge");
      if (multHero) {
        gsap.fromTo(
          multHero,
          { scale: 0.92 },
          { scale: 1.05, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" }
        );
      }
      const starBar = this.container.querySelector(".star-bar-fill");
      if (starBar) {
        gsap.to(starBar, {
          filter: "drop-shadow(0 0 14px #FFD700)",
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
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
    // Botón cerrar / saltar rápido
    const btnQuickClose = this.container.querySelector("#btn-bell-close-quick");
    btnQuickClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    // Botones de paso anterior y siguiente
    const btnPrev = this.container.querySelector("#btn-bell-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    const btnNext = this.container.querySelector("#btn-bell-next");
    btnNext?.addEventListener("click", () => {
      if (this.currentStep < this.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    // Pills del stepper
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

    // Botón ¡A JUGAR!
    const btnPlay = this.container.querySelector("#btn-bell-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();

      // Confeti festivo de despedida
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#FFD700", "#FF3366", "#00E5FF", "#00E676"]
        });
      } catch {
        // Ignorar si no está cargado
      }

      if (this.onPlayGame) {
        this.onPlayGame();
      }
    });

    // Checkbox de no volver a mostrar
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-bell-dont-show-again");
    chkDontShow?.addEventListener("change", () => {
      this.savePreferences();
    });
  }

  private savePreferences(): void {
    const chkDontShow = this.container.querySelector<HTMLInputElement>("#chk-bell-dont-show-again");
    if (chkDontShow && chkDontShow.checked) {
      this.markTutorialSeen();
    }
  }
}
