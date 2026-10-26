/**
 * ==============================================================================
 * MODAL UNIVERSAL ANIMADO DE HISTORIA & TUTORIAL VISUAL (TODOS LOS MINIJUEGOS)
 * ==============================================================================
 *
 * Reemplaza los textos estáticos por tutoriales visuales interactivos animados
 * para los 15 minijuegos de la Feria Mágica del Juguete.
 *
 * Características:
 * 1. Detección de primera vez por juego: localStorage (`feria_tutorial_seen_${gameId}`).
 * 2. Capítulos animados (Historia, Controles Interactivos, Puntos & Power-Ups, Peligros & Vidas).
 * 3. Botón de inicio rápido arcade «¡A JUGAR!» con lluvia de confeti.
 * 4. Botón «✕ SALTAR» en cualquier segundo.
 * 5. Pestañas interactivas de capítulos para saltar entre pasos.
 * 6. Casilla «No volver a mostrar automáticamente».
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface TutorialStep {
  tag: string;
  title: string;
  badge: string;
  badgeColor: string;
  storyText: string;
  proTip: string;
  stageType: string;
}

export interface UniversalGameTutorialData {
  gameId: string;
  gameTitle: string;
  themeColor: string;
  steps: TutorialStep[];
}

export class UniversalStoryTutorialModal {
  private container: HTMLElement;
  private audio: AudioManager;
  private currentGameId: string = "santa-ski";
  private currentStep: number = 0;
  private isVisible: boolean = false;
  private stepInterval: any = null;

  public onPlayGame?: (gameId: string) => void;
  public onClose?: (gameId: string) => void;

  private database: Map<string, UniversalGameTutorialData> = new Map();

  constructor(containerId: string = "universal-tutorial-modal", audio: AudioManager) {
    this.audio = audio;
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "ski-tutorial-modal-overlay hide";
      document.body.appendChild(el);
    }
    this.container = el;

    this.initDatabase();
    this.renderDOM();
    this.setupEvents();
  }

  public hasSeenTutorial(_gameId: string): boolean {
    return false;
  }

  public markTutorialSeen(_gameId: string): void {
    // Siempre mostrar
  }

  public show(gameId: string, initialStep: number = 0): void {
    if (!this.database.has(gameId)) {
      this.currentGameId = "santa-ski";
    } else {
      this.currentGameId = gameId;
    }

    const data = this.getCurrentData();
    this.currentStep = Math.max(0, Math.min(initialStep, data.steps.length - 1));
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
          if (this.onClose) this.onClose(this.currentGameId);
        }
      });
    } else {
      this.isVisible = false;
      this.container.classList.add("hide");
      this.container.style.display = "none";
    }
  }

  private getCurrentData(): UniversalGameTutorialData {
    return this.database.get(this.currentGameId) || this.database.get("santa-ski")!;
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
            <img src="./assets/images/medallon-feria.webp" alt="Feria Mágica" class="ski-feria-seal" />
          </div>
          <div class="ski-header-title-wrap">
            <span class="ski-header-sub">FERIA MÁGICA DEL JUGUETE</span>
            <h2 class="ski-header-title" id="tut-header-game-title">¡HISTORIA & GUÍA!</h2>
          </div>
          <button id="btn-tut-close-quick" class="ski-close-quick-btn" title="Saltar / Cerrar">
            ✕
          </button>
        </div>

        <!-- Pestañas de capítulos dinámicos -->
        <div class="ski-stepper-bar" id="tut-stepper-bar">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Contenedor principal del capítulo activo -->
        <div class="ski-tutorial-body" id="tut-tutorial-body">
          <!-- Renderizado dinámico -->
        </div>

        <!-- Pie de navegación y acción -->
        <div class="ski-tutorial-footer">
          

          <div class="ski-nav-buttons">
            <button id="btn-tut-prev" class="btn-ski-nav btn-ski-prev" disabled>
              ${getIconSvg("arrowLeft", { size: 16, color: "#FFFFFF" })}
              <span>ANTERIOR</span>
            </button>
            <button id="btn-tut-next" class="btn-ski-nav btn-ski-next">
              <span>SIGUIENTE</span>
              ${getIconSvg("arrowRight", { size: 16, color: "#FFFFFF" })}
            </button>
            <button id="btn-tut-play-now" class="btn-ski-action-play">
              <span>¡A JUGAR!</span>
              ${getIconSvg("play", { size: 20, color: "#FFFFFF", fill: "#FFFFFF" })}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStepContent(): void {
    const gameData = this.getCurrentData();
    const stepData = gameData.steps[this.currentStep];
    this.clearStepTimers();

    // Actualizar título de cabecera
    const headerTitle = this.container.querySelector("#tut-header-game-title");
    if (headerTitle) {
      headerTitle.textContent = gameData.gameTitle.toUpperCase();
    }

    // Actualizar stepper
    const stepperBar = this.container.querySelector("#tut-stepper-bar");
    if (stepperBar) {
      stepperBar.innerHTML = gameData.steps.map((_s, idx) => `
        <button class="ski-step-pill ${idx === this.currentStep ? "active" : (idx < this.currentStep ? "completed" : "")}" data-step="${idx}">
          <span class="step-num">${idx + 1}</span>
          <span class="step-name">${["Misión", "Controles", "Puntos", "Peligros", "Final"][idx] || `Paso ${idx + 1}`}</span>
        </button>
      `).join("");
    }

    // Actualizar botones de pie
    const btnPrev = this.container.querySelector<HTMLButtonElement>("#btn-tut-prev");
    const btnNext = this.container.querySelector<HTMLButtonElement>("#btn-tut-next");
    const btnPlay = this.container.querySelector<HTMLButtonElement>("#btn-tut-play-now");

    if (btnPrev) btnPrev.disabled = this.currentStep === 0;
    if (btnNext) btnNext.style.display = this.currentStep === gameData.steps.length - 1 ? "none" : "flex";
    if (btnPlay) {
      if (this.currentStep === gameData.steps.length - 1) {
        btnPlay.classList.add("pulse-highlight");
      } else {
        btnPlay.classList.remove("pulse-highlight");
      }
    }

    // Generar escenario visual interactivo
    const visualHTML = this.buildStageVisual(this.currentGameId, stepData.stageType, stepData);

    const body = this.container.querySelector("#tut-tutorial-body");
    if (body) {
      body.innerHTML = `
        <div class="ski-step-view">
          <div class="ski-visual-column">
            ${visualHTML}
          </div>
          <div class="ski-info-column">
            <div class="ski-info-badge" style="border-color: ${stepData.badgeColor}; color: ${stepData.badgeColor}">
              ${stepData.badge}
            </div>
            <span class="ski-info-tag">${stepData.tag}</span>
            <h3 class="ski-info-title">${stepData.title}</h3>
            <p class="ski-info-story">${stepData.storyText}</p>
            <div class="ski-info-protip">
              <span class="protip-icon">💡</span>
              <span class="protip-text">${stepData.proTip}</span>
            </div>
          </div>
        </div>
      `;
    }

    this.playStepAnimation();
  }

  private buildStageVisual(gameId: string, stageType: string, _step: TutorialStep): string {
    // Si es Esquí Alpino, renderizamos sus escenarios especiales
    if (gameId === "santa-ski") {
      switch (stageType) {
        case "ski_story":
          return `
            <div class="ski-stage stage-story">
              <div class="stage-sky-backdrop"></div>
              <div class="stage-mountain-peak">
                <img src="./assets/images/santa-ski-straight.webp" alt="Santa Esquiador" class="santa-hero-story" />
                <div class="santa-snow-pedestal"></div>
              </div>
              <div class="stage-story-badge">
                <img src="./assets/images/estrella con logo.webp" alt="Estrella Feria" class="story-star-badge" />
                <span>OBJETIVO: INAUGURAR LA FERIA DEL JUGUETE</span>
              </div>
            </div>
          `;
        case "ski_controls":
          return `
            <div class="ski-stage stage-controls">
              <div class="stage-controls-track">
                <div class="santa-control-demo" id="santa-control-demo">
                  <img src="./assets/images/santa-ski-straight.webp" alt="Santa" id="santa-demo-sprite" class="demo-skier-img" />
                </div>
              </div>
              <div class="controls-overlay-cues">
                <div class="touch-cue-box">
                  <span class="cue-label">TÁCTIL / MOUSE</span>
                  <div class="touch-hand-anim"><span>👈</span><span>👉</span></div>
                  <span class="cue-hint">Desliza a los lados</span>
                </div>
                <div class="cue-divider">O</div>
                <div class="keys-cue-box">
                  <span class="cue-label">TECLADO</span>
                  <div class="key-caps-pair">
                    <span class="key-cap" id="key-cap-left">◄ A</span>
                    <span class="key-cap" id="key-cap-right">D ►</span>
                  </div>
                  <span class="cue-hint">Pulsa para girar</span>
                </div>
              </div>
            </div>
          `;
        case "ski_slalom_ramps":
          return `
            <div class="ski-stage stage-slalom-ramps">
              <div class="slalom-demo-card">
                <div class="demo-card-header"><span class="card-chip chip-green">PUERTA DE ESLALON</span><span class="card-pts">+150 PTS • TURBO</span></div>
                <div class="demo-card-visual gate-visual">
                  <img src="./assets/images/puerta-eslalon-3d.webp" alt="Puerta" class="demo-gate-img" />
                  <img src="./assets/images/santa-ski-straight.webp" alt="Santa" class="demo-santa-gate" />
                  <div class="turbo-burst-badge">¡TURBO ESLALON!</div>
                </div>
              </div>
              <div class="slalom-demo-card">
                <div class="demo-card-header"><span class="card-chip chip-cyan">RAMPA DE SALTO</span><span class="card-pts">+300 PTS • TRUCO 360°</span></div>
                <div class="demo-card-visual ramp-visual">
                  <img src="./assets/images/rampa-esqui-downhill.webp" alt="Rampa" class="demo-ramp-img" />
                  <img src="./assets/images/santa-ski-jump.webp" alt="Salto" class="demo-santa-jump" />
                  <div class="jump-sparkle-badge">¡GRAN SALTO 360°!</div>
                </div>
              </div>
            </div>
          `;
        case "ski_hazards":
          return `
            <div class="ski-stage stage-hazards-turbo">
              <div class="hazard-split danger-side">
                <div class="split-title-bar bar-danger"><span>⛔ PELIGROS (-1 VIDA)</span></div>
                <div class="hazard-props-row">
                  <div class="prop-hazard-item"><img src="./assets/images/arbol.webp" alt="Pino" /><span>Pino</span></div>
                  <div class="prop-hazard-item"><img src="./assets/images/obstaculo-muneco-estilizado.webp" alt="Muñeco" /><span>Muñeco</span></div>
                  <div class="prop-hazard-item"><div class="mini-wood-billboard"><span class="mini-bb-label">CARTEL</span></div><span>Cartel</span></div>
                </div>
                <div class="crash-preview-box">
                  <img src="./assets/images/santa-ski-crash.webp" alt="Choque" class="demo-santa-crash" />
                  <span class="crash-alert-tag">¡GOLPE Y RACHA PERDIDA!</span>
                </div>
              </div>
              <div class="hazard-split turbo-side">
                <div class="split-title-bar bar-turbo"><span>⭐ SÚPER TURBO (+250 PTS)</span></div>
                <div class="turbo-power-showcase">
                  <img src="./assets/images/estrella con logo.webp" alt="Estrella" class="demo-star-power" />
                  <div class="turbo-smash-demo"><span class="smash-impact-star">💥</span><span class="smash-tag">¡ARRASA TODO!</span></div>
                </div>
                <p class="turbo-tip-text">Al agarrar la Estrella serás invencible y demolerás los carteles a tu paso.</p>
              </div>
            </div>
          `;
        case "ski_yeti":
          return `
            <div class="ski-stage stage-yeti">
              <div class="yeti-chase-arena">
                <img src="./assets/images/yeti-run1.webp" alt="Yeti" class="demo-yeti-monster" id="demo-yeti-sprite" />
                <div class="yeti-chase-target"><img src="./assets/images/santa-ski-straight.webp" alt="Santa" class="demo-santa-flee" /></div>
                <div class="yeti-warning-banner"><span>⚠️</span><span>¡EL YETI TE PERSIGUE!</span></div>
              </div>
              <div class="yeti-escape-tips">
                <div class="escape-rule"><span>⚡</span><span>Pasa por los eslalons para ganar velocidad.</span></div>
                <div class="escape-rule"><span>🚀</span><span>Toma rampas para dejarlo atrás.</span></div>
              </div>
            </div>
          `;
      }
    }

    // Escenarios propios de ¡Batalla de Nieve!
    if (gameId === "snow-battle") {
      switch (stageType) {
        case "battle_story":
          return `
            <div class="ski-stage stage-story">
              <div class="stage-sky-backdrop"></div>
              <div class="stage-mountain-peak">
                <img src="./assets/images/rodolfo-battle-down-1.webp" alt="Rodolfo" class="santa-hero-story" />
                <div class="santa-snow-pedestal"></div>
              </div>
              <div class="stage-story-badge">
                <img src="./assets/images/estrella con logo.webp" alt="Estrella Feria" class="story-star-badge" />
                <span>OBJETIVO: DEFENDER LA PLAZA NEVADA 45 SEGUNDOS</span>
              </div>
            </div>
          `;
        case "battle_controls":
          return `
            <div class="ski-stage stage-controls">
              <div class="stage-controls-track">
                <img src="./assets/images/rodolfo-battle-side-1.webp" alt="Rodolfo" class="universal-control-demo-img" id="universal-demo-hero" />
              </div>
              <div class="controls-overlay-cues">
                <div class="touch-cue-box">
                  <span class="cue-label">JOYSTICK TÁCTIL</span>
                  <div class="touch-hand-anim"><span>👆</span><span>🕹️</span></div>
                  <span class="cue-hint">Toca y arrastra donde quieras</span>
                </div>
                <div class="cue-divider">O</div>
                <div class="keys-cue-box">
                  <span class="cue-label">TECLADO</span>
                  <div class="key-caps-pair">
                    <span class="key-cap">W A S D</span>
                    <span class="key-cap">▲ ◄ ▼ ►</span>
                  </div>
                  <span class="cue-hint">Movimiento 360° • disparo automático</span>
                </div>
              </div>
            </div>
          `;
        case "battle_enemies":
          return `
            <div class="ski-stage stage-hazards-turbo">
              <div class="hazard-split danger-side">
                <div class="split-title-bar bar-danger"><span>⛔ ENEMIGOS (-1 ❤ AL TOCARTE)</span></div>
                <div class="hazard-props-row">
                  <div class="prop-hazard-item"><img src="./assets/images/snowman-evil-1.webp" alt="Muñeco malvado" /><span>Muñeco • 2 golpes</span></div>
                  <div class="prop-hazard-item"><img src="./assets/images/elf-mischief-1.webp" alt="Duende travieso" /><span>Duende • 1 golpe</span></div>
                </div>
                <div class="crash-preview-box">
                  <img src="./assets/images/rodolfo-battle-hit.webp" alt="Rodolfo golpeado" class="demo-santa-crash" />
                  <span class="crash-alert-tag">¡GOLPE Y COMBO PERDIDO!</span>
                </div>
              </div>
              <div class="hazard-split turbo-side">
                <div class="split-title-bar bar-turbo"><span>🔥 COMBOS HASTA x3</span></div>
                <div class="turbo-power-showcase">
                  <img src="./assets/images/snowball-proj.webp" alt="Bola de nieve" class="demo-star-power" />
                  <div class="turbo-smash-demo"><span class="smash-impact-star">💥</span><span class="smash-tag">¡ELIMINACIONES SEGUIDAS!</span></div>
                </div>
                <p class="turbo-tip-text">Cada 5 eliminaciones sin recibir daño tus puntos suben +0.5x.</p>
              </div>
            </div>
          `;
        case "battle_powerups":
          return `
            <div class="ski-stage stage-hazards-turbo">
              <div class="hazard-split turbo-side" style="grid-column: span 2;">
                <div class="split-title-bar bar-turbo"><span>🎁 POWER-UPS DE LOS ENEMIGOS</span></div>
                <div class="hazard-props-row" style="margin: 18px 0;">
                  <div class="prop-hazard-item"><img src="./assets/images/pu-triple.webp" alt="Disparo triple" /><span>Disparo Triple</span></div>
                  <div class="prop-hazard-item"><img src="./assets/images/pu-shield.webp" alt="Escudo de nariz" /><span>Nariz Brillante</span></div>
                  <div class="prop-hazard-item"><img src="./assets/images/pu-cookie.webp" alt="Galleta" /><span>Galleta +1 ❤</span></div>
                  <div class="prop-hazard-item"><img src="./assets/images/estrella con logo.webp" alt="Logo patrocinador" /><span>Logo x2 pts</span></div>
                </div>
              </div>
            </div>
          `;
        case "battle_yeti":
          return `
            <div class="ski-stage stage-yeti">
              <div class="yeti-chase-arena">
                <img src="./assets/images/yeti-boss-1.webp" alt="Yeti" class="demo-yeti-monster" />
                <div class="yeti-chase-target"><img src="./assets/images/rodolfo-battle-down-1.webp" alt="Rodolfo" class="demo-santa-flee" /></div>
                <div class="yeti-warning-banner"><span>⚠️</span><span>¡EL YETI LLEGA A LOS 30 s!</span></div>
              </div>
              <div class="yeti-escape-tips">
                <div class="escape-rule"><span>❄️</span><span>Aguanta 10 bolas de nieve: ¡+1500 pts!</span></div>
                <div class="escape-rule"><span>🎁</span><span>Siempre suelta un power-up al caer.</span></div>
              </div>
            </div>
          `;
      }
    }

    // Escenarios universales para todos los otros juegos
    switch (stageType) {
      case "generic_story":
        return `
          <div class="ski-stage stage-story">
            <div class="stage-sky-backdrop"></div>
            <div class="universal-hero-showcase">
              <div class="hero-halo-aura"></div>
              <img src="${this.getHeroImageForGame(gameId)}" alt="Hero" class="universal-hero-img" />
            </div>
            <div class="stage-story-badge">
              <img src="./assets/images/estrella con logo.webp" alt="Feria" class="story-star-badge" />
              <span>MISIÓN OFICIAL DE LA FERIA MÁGICA</span>
            </div>
          </div>
        `;

      case "generic_controls":
        return `
          <div class="ski-stage stage-controls">
            <div class="stage-controls-track">
              <img src="${this.getHeroImageForGame(gameId)}" alt="Demo" class="universal-control-demo-img" id="universal-demo-hero" />
            </div>
            <div class="controls-overlay-cues">
              <div class="touch-cue-box">
                <span class="cue-label">TÁCTIL / MOUSE</span>
                <div class="touch-hand-anim"><span>👆</span></div>
                <span class="cue-hint">Toca o desliza en pantalla</span>
              </div>
              <div class="cue-divider">O</div>
              <div class="keys-cue-box">
                <span class="cue-label">TECLADO</span>
                <div class="key-caps-pair">
                  <span class="key-cap">◄ / ►</span>
                  <span class="key-cap">ESPACIO</span>
                </div>
                <span class="cue-hint">Usa teclas rápidas</span>
              </div>
            </div>
          </div>
        `;

      case "generic_points":
        return `
          <div class="ski-stage stage-slalom-ramps">
            <div class="slalom-demo-card">
              <div class="demo-card-header"><span class="card-chip chip-green">OBJETIVOS CLAVE</span><span class="card-pts">+PUNTOS & COMBOS</span></div>
              <div class="demo-card-visual">
                <img src="./assets/images/regalo-estilizado-rojo.webp" alt="Regalo" style="width: 70px; height: 70px; object-fit: contain;" />
                <div class="turbo-burst-badge">¡SUMA PUNTOS!</div>
              </div>
            </div>
            <div class="slalom-demo-card">
              <div class="demo-card-header"><span class="card-chip chip-cyan">LOGOS PATROCINADORES</span><span class="card-pts">PODER x2 / STAR POWER</span></div>
              <div class="demo-card-visual">
                <img src="./assets/images/estrella con logo.webp" alt="Estrella" style="width: 70px; height: 70px; object-fit: contain;" />
                <div class="jump-sparkle-badge">¡SUPER PODER!</div>
              </div>
            </div>
          </div>
        `;

      case "generic_hazards":
      default:
        return `
          <div class="ski-stage stage-hazards-turbo">
            <div class="hazard-split danger-side" style="grid-column: span 2;">
              <div class="split-title-bar bar-danger"><span>⛔ ¡QUÉ DEBES EVITAR!</span></div>
              <div class="hazard-props-row" style="margin: 18px 0;">
                <div class="prop-hazard-item"><span style="font-size: 2.2rem;">🔥</span><span>Carbón / Fuego</span></div>
                <div class="prop-hazard-item"><span style="font-size: 2.2rem;">❄️</span><span>Hielo Frágil</span></div>
                <div class="prop-hazard-item"><span style="font-size: 2.2rem;">⏳</span><span>Tiempo Límite</span></div>
              </div>
              <div class="crash-preview-box" style="justify-content: center;">
                <span class="crash-alert-tag">¡CUIDA TUS VIDAS Y MANTÉN TU RACHA PARA GANAR EL RÉCORD!</span>
              </div>
            </div>
          </div>
        `;
    }
  }

  private getHeroImageForGame(gameId: string): string {
    const map: Record<string, string> = {
      "toy-catch": "./assets/images/bolsa de regalos.webp",
      "bell-symphony": "./assets/images/icon-campanas.webp",
      "tree-melody": "./assets/images/icon-tambor.png",
      "flying-elf": "./assets/images/elfo-volador.webp",
      "magic-pairs": "./assets/images/icon-cartas.webp",
      "santa-hills": "./assets/images/santa-trineo.webp",
      "snowball-target": "./assets/images/icon-resortera.png",
      "workshop-chaos": "./assets/images/juguete-cuerda.png",
      "christmas-jump": "./assets/images/elfo-saltador.webp",
      "gift-tower": "./assets/images/caja-regalo.png",
      "polar-express": "./assets/images/locomotora.png",
      "ice-breaker": "./assets/images/paleta-caramelo.png",
      "ornament-pop": "./assets/images/canon-caramelo.png",
      "toy-match": "./assets/images/vitrina-juguetes.png",
      "santa-ski": "./assets/images/santa-ski-straight.webp",
      "snow-battle": "./assets/images/rodolfo-battle-down-1.webp"
    };
    return map[gameId] || "./assets/images/medallon-feria.webp";
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
    const infoCol = this.container.querySelector(".ski-info-column");
    const visualCol = this.container.querySelector(".ski-visual-column");

    if (infoCol) {
      gsap.fromTo(infoCol, { opacity: 0, x: 25 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" });
    }
    if (visualCol) {
      gsap.fromTo(visualCol, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" });
    }

    // Animación interactiva de controles en demo
    if (this.currentGameId === "santa-ski") {
      const sprite = this.container.querySelector<HTMLImageElement>("#santa-demo-sprite");
      const demoBox = this.container.querySelector<HTMLElement>("#santa-control-demo");
      const keyLeft = this.container.querySelector<HTMLElement>("#key-cap-left");
      const keyRight = this.container.querySelector<HTMLElement>("#key-cap-right");

      if (sprite && demoBox) {
        let dir = 1;
        this.stepInterval = setInterval(() => {
          dir *= -1;
          if (dir === 1) {
            sprite.src = "./assets/images/santa-ski-right.webp";
            gsap.to(demoBox, { x: 50, rotation: 8, duration: 0.55, ease: "power1.inOut" });
            if (keyRight) keyRight.classList.add("key-active");
            if (keyLeft) keyLeft.classList.remove("key-active");
          } else {
            sprite.src = "./assets/images/santa-ski-left.webp";
            gsap.to(demoBox, { x: -50, rotation: -8, duration: 0.55, ease: "power1.inOut" });
            if (keyLeft) keyLeft.classList.add("key-active");
            if (keyRight) keyRight.classList.remove("key-active");
          }
        }, 700);
      }

      const yetiSprite = this.container.querySelector<HTMLImageElement>("#demo-yeti-sprite");
      if (yetiSprite) {
        let step = 0;
        this.stepInterval = setInterval(() => {
          step = 1 - step;
          yetiSprite.src = step === 0 ? "./assets/images/yeti-run1.webp" : "./assets/images/yeti-run2.webp";
        }, 280);
      }
    } else {
      const hero = this.container.querySelector<HTMLElement>("#universal-demo-hero");
      if (hero) {
        gsap.to(hero, {
          x: 40,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
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

  private setupEvents(): void {
    // 1. Cerrar / Saltar
    const btnClose = this.container.querySelector("#btn-tut-close-quick");
    btnClose?.addEventListener("click", () => {
      this.audio.playTap();
      this.savePreferences();
      this.hide();
    });

    // 2. Anterior
    const btnPrev = this.container.querySelector("#btn-tut-prev");
    btnPrev?.addEventListener("click", () => {
      if (this.currentStep > 0) {
        this.audio.playTap();
        this.currentStep--;
        this.renderStepContent();
      }
    });

    // 3. Siguiente
    const btnNext = this.container.querySelector("#btn-tut-next");
    btnNext?.addEventListener("click", () => {
      const data = this.getCurrentData();
      if (this.currentStep < data.steps.length - 1) {
        this.audio.playTap();
        this.currentStep++;
        this.renderStepContent();
      }
    });

    // 4. ¡A Jugar!
    const btnPlay = this.container.querySelector("#btn-tut-play-now");
    btnPlay?.addEventListener("click", () => {
      this.audio.playPowerUp();
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });
      this.savePreferences();
      if ((window as any).kioskApp?.tryLockLandscape) {
        (window as any).kioskApp.tryLockLandscape();
      }
      this.hide();
      if (this.onPlayGame) {
        this.onPlayGame(this.currentGameId);
      }
    });

    // 5. Clics en stepper
    this.container.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest(".ski-step-pill");
      if (target) {
        const step = parseInt(target.getAttribute("data-step") || "0", 10);
        const data = this.getCurrentData();
        if (!isNaN(step) && step >= 0 && step < data.steps.length && step !== this.currentStep) {
          this.audio.playTap();
          this.currentStep = step;
          this.renderStepContent();
        }
      }
    });
  }

  private savePreferences(): void {
    const chk = this.container.querySelector<HTMLInputElement>("#chk-tut-dont-show-again");
    if (chk && chk.checked) {
      this.markTutorialSeen(this.currentGameId);
    }
  }

  private initDatabase(): void {
    // 1. ATRAPA-REGALOS MÁGICO
    this.database.set("toy-catch", {
      gameId: "toy-catch",
      gameTitle: "Atrapa-Regalos Mágico",
      themeColor: "#FF2A4D",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Emergencia en la Fábrica de Juguetes!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡La chimenea del taller se desbordó por la gran nevada de medianoche! Santa necesita llenar su gran saco mágico con todos los juguetes antes de que el trineo despegue.",
          proTip: "¡Mueve el saco de un lado a otro y no dejes caer los regalos!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Mueve el Saco de Santa!",
          badge: "CONTROLES INTERACTIVOS",
          badgeColor: "#00E5FF",
          storyText: "Desliza tu dedo en la pantalla hacia los lados o usa las teclas <strong>[ ◄ / ► ]</strong> o <strong>[ A / D ]</strong> para mover el saco con rapidez y atrapar los regalos que caen.",
          proTip: "¡Los juguetes que caen más rápido dan mayores bonificaciones de puntos!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS Y PODERES",
          title: "¡Juguetes y Logos de Patrocinador!",
          badge: "PUNTUACIÓN MÁXIMA",
          badgeColor: "#00E676",
          storyText: "Atrapa regalos clásicos (+100 pts) y peluches especiales (+150 pts). Si atrapas la <strong>Estrella de la Feria</strong> activarás el poder de puntos dobles con imán temporal.",
          proTip: "¡Atrapar regalos seguidos sin fallar desata combos multiplicadores!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Cuidado con el Carbón y el Hielo!",
          badge: "SUPERVIVENCIA",
          badgeColor: "#FF1744",
          storyText: "¡Esquiva el carbón ardiente que resta tus puntos y los cristales de hielo que congelan tu saco inmovilizándote por unos segundos!",
          proTip: "¡Tienes un tiempo límite de partida; maximiza tu puntuación antes de que el reloj llegue a cero!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 2. SINFONÍA DE CAMPANAS
    this.database.set("bell-symphony", {
      gameId: "bell-symphony",
      gameTitle: "Sinfonía de Campanas",
      themeColor: "#00E5FF",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡El Concierto Navideño de Medianoche!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "El campanario de la catedral de la Feria Mágica debe entonar los villancicos sagrados para dar la bienvenida a la Nochebuena. ¡Toca las campanas al compás exacto de la música!",
          proTip: "¡La precisión en el compás desbloquea rangos S y fuegos artificiales!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca los 4 Carriles Rítmicos!",
          badge: "CONTROLES RÍTMICOS",
          badgeColor: "#00E5FF",
          storyText: "Toca cada carril justo en el instante en que la nota cruce la línea inferior dorada. En teclado, usa las teclas <strong>[ D - F - J - K ]</strong>.",
          proTip: "¡Tocar las notas en el centro otorga puntuación PERFECT!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & STAR POWER",
          title: "¡Combos y Notas Estrella!",
          badge: "PUNTUACIÓN Y PODER",
          badgeColor: "#00E676",
          storyText: "Encadenar aciertos aumentará tu multiplicador de combo. Al tocar las <strong>Notas Estrella</strong> con logos oficiales activarás el <strong>Star Power x4</strong> de puntuación.",
          proTip: "¡Las notas sostenidas largas deben mantenerse pulsadas hasta que termine su cola dorada!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Cuida tus Campanas de Vida!",
          badge: "SUPERVIVENCIA",
          badgeColor: "#FF1744",
          storyText: "Cada nota que dejes pasar o toques a destiempo apagará una de tus campanas de vida. Si se apagan todas, el concierto terminará antes de tiempo.",
          proTip: "¡Sigue el ritmo musical con tus oídos y ojos sincronizados!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 3. TAMBORES DEL CASCANUECES
    this.database.set("tree-melody", {
      gameId: "tree-melody",
      gameTitle: "Tambores del Cascanueces",
      themeColor: "#FFB300",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡El Gran Desfile de los Soldaditos!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "El Capitán Cascanueces está liderando la marcha de tambores de la Feria del Juguete. Observa atentamente la melodía que toca y repítela sin equivocarte.",
          proTip: "¡Entrena tu oído musical y memoria rítmica!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca los 3 Tambores Mágicos!",
          badge: "MEMORIA RÍTMICA",
          badgeColor: "#00E5FF",
          storyText: "Toca los 3 tambores en pantalla <strong>[ DON | STAR | KA ]</strong> o usa las teclas numéricas <strong>[ 1 - 2 - 3 ]</strong> para reproducir exactamente la secuencia del elfo.",
          proTip: "¡Las secuencias van sumando más notas a medida que avanzas de ronda!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & MULTIPLICADORES",
          title: "¡Tambores Dorados!",
          badge: "BONIFICACIONES",
          badgeColor: "#00E676",
          storyText: "Superar las rondas a la perfección desbloquea el <strong>Tambor Dorado</strong> con multiplicadores festivos y ráfagas de confeti.",
          proTip: "¡No te apresures: escucha toda la secuencia antes de tocar!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡No Pierdas el Compás!",
          badge: "VIDAS",
          badgeColor: "#FF1744",
          storyText: "Tocar un tambor incorrecto te costará una de tus vidas festivas. Mantén la concentración para llegar al gran clímax del desfile.",
          proTip: "¡El desfile termina si te quedas sin vidas!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 4. EL VUELO MÁGICO DEL ELFO
    this.database.set("flying-elf", {
      gameId: "flying-elf",
      gameTitle: "El Vuelo Mágico del Elfo",
      themeColor: "#D500F9",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Misión por los Cielos Navideños!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "Una ráfaga de viento helado dispersó las cartas de deseos sobre los tejados nevados. ¡El elfo volador debe planear entre las casas y rescatarlas todas!",
          proTip: "¡Controla la gravedad con toques suaves y fluidos!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Mantén para Ascender, Suelta para Caer!",
          badge: "VUELO FLUIDO",
          badgeColor: "#00E5FF",
          storyText: "Mantén presionada la pantalla o la tecla <strong>[ Espacio / W / ▲ ]</strong> para impulsar al elfo hacia arriba, y suelta para dejarlo planear suavemente en caída.",
          proTip: "¡Los toques rítmicos cortos te permitirán volar en línea recta!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & PODERES",
          title: "¡Cartas, Bastones y Logo Feria!",
          badge: "PUNTUACIÓN",
          badgeColor: "#00E676",
          storyText: "Recoge cartas y bastones de caramelo para sumar puntos. Agarrar el <strong>Logo de la Feria Mágica</strong> te dará un Turbo de Aceleración con imán de regalos.",
          proTip: "¡Las cartas doradas otorgan triple puntuación!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Esquiva Chimeneas y Nubes de Tormenta!",
          badge: "OBSTÁCULOS",
          badgeColor: "#FF1744",
          storyText: "Chocar contra las chimeneas humeantes o las nubes de hielo te restará valiosos segundos de tu cronómetro de vuelo.",
          proTip: "¡El tiempo corre; vuela sin chocar para completar la misión!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 5. PAREJAS DE JUGUETES
    this.database.set("magic-pairs", {
      gameId: "magic-pairs",
      gameTitle: "Parejas de Juguetes",
      themeColor: "#D500F9",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡El Misterio de las Cartas Navideñas!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡Los traviesos duendes revolvieron las cartas mágicas con los planos de los juguetes! Demuestra tu agilidad mental encontrando todas las parejas antes de que termine el tiempo.",
          proTip: "¡Memoriza las esquinas del tablero primero!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca para Girar las Cartas!",
          badge: "MEMORIA VISUAL",
          badgeColor: "#00E5FF",
          storyText: "Toca cualquier carta para revelarla y luego toca otra para encontrar su pareja. Si coinciden quedarán descubiertas; si no, volverán a voltearse.",
          proTip: "¡Girar cartas a buen ritmo genera combos de memoria!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & BONUS",
          title: "¡Parejas Consecutivas y Logos!",
          badge: "BONIFICACIONES",
          badgeColor: "#00E676",
          storyText: "Acertar parejas consecutivas desata multiplicadores x2 y x3. Encontrar la pareja con el <strong>Logo de la Feria</strong> sumará tiempo extra al reloj.",
          proTip: "¡Completar el tablero rápido suma bonus por tiempo restante!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡El Cronómetro No Perdona!",
          badge: "TIEMPO LÍMITE",
          badgeColor: "#FF1744",
          storyText: "El tiempo corre sin detenerse. Si el cronómetro llega a cero antes de despejar la vitrina, la partida terminará.",
          proTip: "¡Concéntrate para no olvidar las cartas que ya viste!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 6. EL DESCENSO DE SANTA (SantaHillsGame)
    this.database.set("santa-hills", {
      gameId: "santa-hills",
      gameTitle: "El Descenso de Santa",
      themeColor: "#FF2A4D",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Aventura en las Colinas Nevadas!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡El trineo de Santa perdió los regalos por las colinas nevadas de la cordillera! Ayuda a Papá Noel a deslizarse en su trineo mágico para rescatar todos los paquetes.",
          proTip: "¡Usa la física de las pendientes para ganar aceleración!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca para Saltar y Doble Salto!",
          badge: "SALTO PRECISO",
          badgeColor: "#00E5FF",
          storyText: "Toca la pantalla o usa <strong>[ Espacio / W / ▲ ]</strong> para saltar. Pulsa de nuevo en el aire para realizar un <strong>Doble Salto Acrobático</strong>.",
          proTip: "¡Aterriza en las bajadas de las colinas para conservar tu velocidad!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & TRINEO DORADO",
          title: "¡Regalos y Medallón de la Feria!",
          badge: "PODER MÁGICO",
          badgeColor: "#00E676",
          storyText: "Recoge dulces y paquetes flotantes. Al recoger el <strong>Medallón de la Feria Mágica</strong> activarás el <strong>Trineo Dorado</strong> con imán y velocidad supersónica.",
          proTip: "¡Encadena saltos perfectos para llenar el medidor de racha!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Evita Rocas y Placas de Hielo!",
          badge: "VIDAS",
          badgeColor: "#FF1744",
          storyText: "Chocar contra las rocas de carbón te quitará una de tus 3 vidas, y pisar hielo quebradizo frenará en seco tu trineo.",
          proTip: "¡Usa el doble salto para sobrevolar las trampas del camino!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 7. TIRO AL BLANCO NAVIDEÑO
    this.database.set("snowball-target", {
      gameId: "snowball-target",
      gameTitle: "Tiro al Blanco Navideño",
      themeColor: "#00E676",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡El Gran Torneo de Puntería!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡La feria ha inaugurado la caseta de tiro invernal! Carga tu resortera mágica y demuestra tus reflejos abatiendo las dianas móviles y los muñecos traviesos.",
          proTip: "¡Dispara rápido para no dejar escapar los blancos raros!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca o Clic para Disparar!",
          badge: "DISPARO RÁPIDO",
          badgeColor: "#00E5FF",
          storyText: "Toca o haz clic directamente sobre cualquier diana o enemigo que aparezca en pantalla para lanzar una bola de nieve con tu resortera.",
          proTip: "¡Puedes disparar con varios dedos en pantallas multitáctiles!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • SUPERPODERES DE PATROCINADOR",
          title: "¡Triple Tiro y Cámara Lenta!",
          badge: "SUPERPODERES",
          badgeColor: "#00E676",
          storyText: "Impacta los <strong>Logos de Patrocinadores</strong> para desatar superpoderes: <em>Triple Tiro en Abanico</em>, <em>Cámara Lenta</em>, <em>Mega-Bola Explosiva</em> y <em>Escudo</em>.",
          proTip: "¡Atrapar al elfo pillo rápido te otorgará +350 pts!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Cuidado con el Carbón y el Muñeco Gruñón!",
          badge: "PUNTUACIÓN",
          badgeColor: "#FF1744",
          storyText: "Dispararle al carbón ardiente te restará 150 pts y romperá tu racha. Y si no abates al muñeco gruñón a tiempo, ¡te arrojará nieve a la lente!",
          proTip: "¡No dispares a lo loco: selecciona bien tus objetivos!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 8. CAOS EN EL TALLER
    this.database.set("workshop-chaos", {
      gameId: "workshop-chaos",
      gameTitle: "¡El Caos del Taller Mágico!",
      themeColor: "#FF9100",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Sobrecarga en la Máquina de Juguetes!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡La máquina empacadora de duendes tuvo una sobrecarga de engranajes y está disparando juguetes por los aires! Salva la Navidad atrapándolos a todos antes de que caigan.",
          proTip: "¡Mantén tus reflejos al máximo nivel!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca los Juguetes en el Aire!",
          badge: "REFLEJOS RÁPIDOS",
          badgeColor: "#00E5FF",
          storyText: "Toca con rapidez cada peluche, robot y caja de regalo mientras vuelan por la pantalla antes de que caigan al piso del taller.",
          proTip: "¡Los juguetes que giran en el vértice del salto son más fáciles de atrapar!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & FIEBRE DORADA",
          title: "¡Fiebre de Juguetes x2!",
          badge: "LLUVIA DE PUNTOS",
          badgeColor: "#00E676",
          storyText: "Toca regalos patrocinados con logo para recargar el medidor de energía y desatar la <strong>Fiebre de Juguetes</strong>: ¡lluvia masiva de regalos dorados con puntos dobles!",
          proTip: "¡Los robots y coches mecánicos otorgan el doble de puntos!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Evita el Carbón y Cajas Defectuosas!",
          badge: "PENALIZACIONES",
          badgeColor: "#FF1744",
          storyText: "Tocar carbón ardiente o paquetes con calavera te restará entre 25 y 30 puntos y romperá de inmediato tu racha de combo.",
          proTip: "¡Mira antes de tocar para no pinchar las trampas!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 9. SALTO MÁGICO NAVIDEÑO (Christmas Jump)
    this.database.set("christmas-jump", {
      gameId: "christmas-jump",
      gameTitle: "¡Salto Mágico Navideño!",
      themeColor: "#00E5FF",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Escalando hacia la Gran Estrella!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡El elfo saltador debe ascender hasta la copa del árbol navideño más alto de Santander! Rebota sobre las plataformas nevadas, nubes de malvavisco y escala hacia el firmamento cósmico.",
          proTip: "¡A mayor altura alcanzada, más bonificaciones de hito desbloquearás (100m, 250m, 500m...)!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡El Elfo Rebota Automáticamente!",
          badge: "CONTROL LATERAL",
          badgeColor: "#00E5FF",
          storyText: "El elfo rebota sin parar. Solo debes arrastrar a los lados en pantalla táctil, usar los botones [ ◀ / ▶ ] o las flechas <strong>[ ◄ / ► / A / D ]</strong> para guiar su aterrizaje.",
          proTip: "¡Aprovecha los bordes de la pantalla: si sales por la izquierda reapareces por la derecha!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • COHETES, BUMPERS & RESORTES",
          title: "¡Ascenso Hipersónico!",
          badge: "SUPER SALTOS",
          badgeColor: "#00E676",
          storyText: "Usa los <strong>Resortes de Bastón</strong> para súper saltos, los <strong>Bumpers de Pinball</strong> para rebotar en 360° y los <strong>Cohetes Propulsores</strong> para dispararte a toda velocidad.",
          proTip: "¡Recoge estrellas doradas (+250 pts), regalos (+100 pts) y relojes mágicos (+5s de tiempo)!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • DUENDES VOLADORES & PELIGROS",
          title: "¡Pisa a los Duendes y Esquiva el Hielo!",
          badge: "COMBATE AÉREO",
          badgeColor: "#FF1744",
          storyText: "¡Salta sobre la cabeza de los <strong>Duendes del Hielo</strong> para aplastarlos y rebotar con +350 pts! Si te golpean por los lados perderás tu combo. ¡Cuidado con el hielo frágil!",
          proTip: "¡Las nubes de algodón desaparecen tras 1 solo rebote: planifica bien tus saltos!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 10. LA TORRE DE REGALOS (GiftTowerGame)
    this.database.set("gift-tower", {
      gameId: "gift-tower",
      gameTitle: "¡Torre de Regalos Mágica!",
      themeColor: "#FFD700",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Construyendo la Torre Hacia el Cielo!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "Los niños de Santander sueñan con la torre de regalos más alta jamás construida. ¡Coordina el gancho de la grúa mágica y apila los paquetes hasta alcanzar las nubes!",
          proTip: "¡La precisión milimétrica es la clave del récord!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Toca para Soltar el Paquete!",
          badge: "TIMING PERFECTO",
          badgeColor: "#00E5FF",
          storyText: "Toca la pantalla o usa <strong>[ Espacio / Enter / ▼ ]</strong> en el instante en que el paquete oscilante esté exactamente alineado con la base inferior.",
          proTip: "¡Suelta la caja un milisegundo antes de que llegue al centro para compensar la caída!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & ALINEACIÓN PERFECTA",
          title: "¡Alineación Perfecta y Expansión!",
          badge: "COMBOS",
          badgeColor: "#00E676",
          storyText: "Si alineas el paquete a la perfección ganarás +300 pts y notas musicales armónicas. ¡Las cajas de patrocinador otorgan +500 pts y expanden el tamaño de tu base!",
          proTip: "¡Tres perfectos seguidos activan la Fiebre Navideña con puntos dobles!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Los Desbordes Recortan la Caja!",
          badge: "VIDAS",
          badgeColor: "#FF1744",
          storyText: "La parte del paquete que sobresalga de la base será rebanada, haciendo la torre cada vez más estrecha. Si una caja cae completamente al vacío perderás 1 vida.",
          proTip: "¡Tienes 3 vidas en total; construye con serenidad!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 11. EL EXPRESO POLAR (PolarExpressGame)
    this.database.set("polar-express", {
      gameId: "polar-express",
      gameTitle: "¡El Expreso Polar Mágico!",
      themeColor: "#FF2A4D",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡A Toda Máquina por las Vías Nevadas!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡La locomotora mágica de vapor atraviesa a toda velocidad los bosques de pino de Santander! Conduce el tren cambiando de vía para recoger los regalos y evitar los bloqueos.",
          proTip: "¡Mantén los ojos bien abiertos al frente del camino!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Cambia Entre las 3 Vías!",
          badge: "CAMBIO DE CARRIL",
          badgeColor: "#00E5FF",
          storyText: "Toca directamente la vía a la que quieres moverte, o usa las flechas <strong>[ ▲ / ▼ ]</strong> o <strong>[ W / S ]</strong> para cambiar de carril ágilmente.",
          proTip: "¡Cambiar de carril a tiempo evita choques en curvas cerradas!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • PUNTOS & TURBO VAPOR",
          title: "¡Regalos y Turbo Vapor Invencible!",
          badge: "POWER-UP",
          badgeColor: "#00E676",
          storyText: "Recoge paquetes (+50 pts) y estrellas (+150 pts). Al agarrar el <strong>Regalo de Patrocinador</strong> activarás el <strong>Turbo Vapor</strong>: ¡el tren se vuelve dorado e indestructible!",
          proTip: "¡En Turbo Vapor puedes arrasar con todos los obstáculos en tu vía!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡Muñecos, Cristales y Troncos!",
          badge: "VIDAS",
          badgeColor: "#FF1744",
          storyText: "Chocar contra los muñecos de nieve, troncos caídos o montones de carbón dañará la locomotora costándote una de tus 3 vidas.",
          proTip: "¡Anticipa los obstáculos con varias vías de antelación!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 12. ROMPE-HIELOS MÁGICO (IceBreakerGame)
    this.database.set("ice-breaker", {
      gameId: "ice-breaker",
      gameTitle: "¡Rompe-Hielos Mágico!",
      themeColor: "#D500F9",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Liberando los Regalos Congelados!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "Un encantamiento invernal congeló los cofres de regalos dentro de bloques de hielo irrompibles. ¡Usa la paleta de bastón de caramelo y la esfera mágica para liberarlos!",
          proTip: "¡El ángulo en que golpeas la paleta determina la trayectoria de la bola!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Mueve la Paleta de Caramelo!",
          badge: "CONTROL DE REBOTE",
          badgeColor: "#00E5FF",
          storyText: "Desliza tu dedo o ratón hacia los lados o usa las teclas <strong>[ ◄ / ► ]</strong> para mover la paleta. Pulsa <strong>[ Espacio ]</strong> o toca para lanzar la esfera al inicio.",
          proTip: "¡Golpear con las esquinas de la paleta enviará la bola en ángulos rasantes muy veloces!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • CÁPSULAS & ESFERA DE FUEGO",
          title: "¡Multi-Esfera y Paleta Gigante!",
          badge: "CÁPSULAS MÁGICAS",
          badgeColor: "#00E676",
          storyText: "Destruye bloques para que caigan cápsulas de poder: <strong>Multi-Esfera x3</strong>, <strong>Paleta Gigante</strong> y la devastadora <strong>Esfera de Fuego</strong> que atraviesa el hielo sin rebotar.",
          proTip: "¡El cofre de patrocinador otorga +250 pts y fuego instantáneo!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡No Dejes Caer las Esferas!",
          badge: "VIDAS",
          badgeColor: "#FF1744",
          storyText: "Si dejas caer todas las esferas por la parte inferior de la pantalla perderás una de tus 3 vidas festivas. Mantén la vista fija en la trayectoria de rebote.",
          proTip: "¡Si tienes multi-esferas activas no perderás vida mientras quede al menos una en juego!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 13. BURBUJAS DE ADORNOS (OrnamentPopGame)
    this.database.set("ornament-pop", {
      gameId: "ornament-pop",
      gameTitle: "¡Burbujas de Adornos!",
      themeColor: "#00E5FF",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Decorando el Gran Árbol Navideño!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡Las ramas del árbol están sobrecargadas de esferas y guirnaldas desordenadas! Apunta tu cañón de caramelo y junta grupos de colores para hacer estallar los adornos en destellos festivos.",
          proTip: "¡Hacer rebotar las esferas contra las paredes te permite alcanzar lugares difíciles!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Apunta y Dispara tu Cañón!",
          badge: "PUNTERÍA PRECISA",
          badgeColor: "#00E5FF",
          storyText: "Arrastra el dedo o ratón para dirigir la guía de puntería y suelta para disparar el adorno. En teclado, usa <strong>[ ◄ / ► ]</strong> y <strong>[ Espacio ]</strong>.",
          proTip: "¡Mira el adorno de reserva en la base para planear tu siguiente jugada!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • COMBOS & BOLA PATROCINADORA",
          title: "¡Lluvias de Adornos y Bombas!",
          badge: "CASCADAS DE PUNTOS",
          badgeColor: "#00E676",
          storyText: "Junta 3 o más esferas del mismo color para reventarlas (+50 pts cada una). Los adornos que queden colgando en el aire caerán en cascada otorgando +80 pts cada uno.",
          proTip: "¡La Bola Patrocinadora explota todo el racimo en un radio de 3 colores!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡No Dejes Cruzar la Línea Roja!",
          badge: "PELIGRO DE DERROTA",
          badgeColor: "#FF1744",
          storyText: "Cada disparo que no logre reventar esferas acercará una nueva fila desde arriba. Si los adornos tocan la línea roja inferior, la partida se dará por perdida.",
          proTip: "¡Despeja las conexiones superiores para tumbar techos completos!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 14. CONECTA 3 JUGUETES (ToyMatchGame)
    this.database.set("toy-match", {
      gameId: "toy-match",
      gameTitle: "¡Juguetería Mágica!",
      themeColor: "#FFD700",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Orden en la Vitrina de la Feria!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "¡La vitrina principal de juguetes está repleta de trenes, ositos, robots y muñecas! Conecta los juguetes iguales para empaquetarlos y preparar los pedidos de Navidad.",
          proTip: "¡Planea tus movimientos para provocar reacciones en cadena!",
          stageType: "generic_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Intercambia Juguetes Vecinos!",
          badge: "PUZZLE MATCH-3",
          badgeColor: "#00E5FF",
          storyText: "Toca o desliza un juguete hacia una casilla vecina (arriba, abajo, izquierda o derecha) para intercambiarlos y formar líneas rectas de 3 o más iguales.",
          proTip: "¡Solo puedes intercambiar si el movimiento forma una combinación válida!",
          stageType: "generic_controls"
        },
        {
          tag: "CAPÍTULO 3 • ESTRELLAS EXPLOSIVAS",
          title: "¡Combos de 4 y 5 Juguetes!",
          badge: "SUPER PODERES",
          badgeColor: "#00E676",
          storyText: "Unir 4 o 5 juguetes iguales creará una <strong>Estrella Explosiva de Patrocinador</strong> (+450 pts) que al tocarla detonará filas y columnas completas en fuegos artificiales.",
          proTip: "¡Usa el botón de Mezclar Vitrina si no encuentras combinaciones a la vista!",
          stageType: "generic_points"
        },
        {
          tag: "CAPÍTULO 4 • ¡PELIGRO!",
          title: "¡El Tiempo Corre en la Juguetería!",
          badge: "CRONÓMETRO",
          badgeColor: "#FF1744",
          storyText: "Cuentas con un cronómetro de partida. Realizar movimientos vacíos sin combinación romperá tu racha de combo. ¡Sé rápido y bate el récord de la feria!",
          proTip: "¡Las cascadas automáticas siguen sumando puntos mientras el reloj avanza!",
          stageType: "generic_hazards"
        }
      ]
    });

    // 16. ¡BATALLA DE NIEVE! (SnowBattleGame)
    this.database.set("snow-battle", {
      gameId: "snow-battle",
      gameTitle: "¡Batalla de Nieve!",
      themeColor: "#FF2A4D",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡La Plaza Nevada está en Peligro!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "Un ejército de <strong>muñecos de nieve malvados</strong> y <strong>duendes traviesos</strong> invadió la plaza de la <strong>Feria Mágica del Juguete</strong>. ¡Rodolfo el Reno se ha armado de bolas de nieve para defender el recuadro central!",
          proTip: "¡Sobrevive con tus 3 corazones y suma la mayor puntuación posible!",
          stageType: "battle_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Joystick Mágico y Disparo Automático!",
          badge: "CONTROLES",
          badgeColor: "#00E5FF",
          storyText: "Toca la pantalla donde quieras: aparecerá un <strong>joystick dorado</strong> bajo tu pulgar. Arrástralo para mover a Rodolfo en 360°. En PC usa <strong>[ W A S D ]</strong> o las <strong>flechas</strong>. ¡Rodolfo apunta y dispara solo al enemigo más cercano!",
          proTip: "¡Concéntrate en esquivar; la puntería corre por cuenta de Rodolfo!",
          stageType: "battle_controls"
        },
        {
          tag: "CAPÍTULO 3 • ENEMIGOS Y COMBOS",
          title: "¡Muñecos, Duendes y Combos!",
          badge: "OLEADAS",
          badgeColor: "#FF9100",
          storyText: "Los <strong>muñecos malvados</strong> son lentos pero aguantan 2 bolas; los <strong>duendes</strong> son rápidos y caen con 1. Cada eliminación seguida sube tu <strong>combo</strong> y multiplica tus puntos hasta x3, ¡pero si te golpean el combo se reinicia!",
          proTip: "¡Mantente en movimiento para no quedar rodeado!",
          stageType: "battle_enemies"
        },
        {
          tag: "CAPÍTULO 4 • POWER-UPS",
          title: "¡Regalos que Caen del Cielo!",
          badge: "POWER-UPS",
          badgeColor: "#00E676",
          storyText: "Los enemigos derrotados pueden soltar: <strong>Disparo Triple</strong> (abanico de 3 bolas), <strong>Escudo de Nariz Brillante</strong> (aura roja que daña al contacto), <strong>Galleta Navideña</strong> (+1 corazón) y el <strong>Logo del Patrocinador</strong> (¡puntos x2!).",
          proTip: "¡Los power-ups parpadean antes de desaparecer, recógelos rápido!",
          stageType: "battle_powerups"
        },
        {
          tag: "CAPÍTULO 5 • ¡ALERTA YETI!",
          title: "¡El Mini-Jefe Yeti!",
          badge: "JEFE FINAL",
          badgeColor: "#FF2A4D",
          storyText: "El temible <strong>Yeti</strong> entra a la plaza periódicamente. Necesita <strong>10 impactos</strong> para caer, pero derrotarlo otorga <strong>+1500 pts</strong> y un power-up garantizado.",
          proTip: "¡Guarda el Disparo Triple para derribar al Yeti más rápido!",
          stageType: "battle_yeti"
        }
      ]
    });

    // 15. ESQUÍ ALPINO DE SANTA (SantaSkiGame)
    this.database.set("santa-ski", {
      gameId: "santa-ski",
      gameTitle: "¡Esquí Alpino de Santa!",
      themeColor: "#00E5FF",
      steps: [
        {
          tag: "CAPÍTULO 1 • LA HISTORIA",
          title: "¡Misión en la Cumbre de los Andes!",
          badge: "HISTORIA FESTIVA",
          badgeColor: "#FFD700",
          storyText: "Una feroz ventisca inmovilizó el trineo en lo más alto de la cordillera de Santander. Santa se ha calzado sus veloces esquís mágicos para descender a toda velocidad por la montaña y llevar todos los regalos a la gran inauguración de la <strong>Feria Mágica del Juguete</strong>.",
          proTip: "¡Ayuda a Santa a esquiar cuesta abajo, mantener el ritmo y llegar a salvo!",
          stageType: "ski_story"
        },
        {
          tag: "CAPÍTULO 2 • CONTROLES",
          title: "¡Aprende a Esquiar y Carvear!",
          badge: "CONTROLES INTERACTIVOS",
          badgeColor: "#00E5FF",
          storyText: "Desliza tu dedo en la pantalla hacia los lados o usa las teclas <strong>[ ◄ / ► ]</strong> o <strong>[ A / D ]</strong> en tu teclado. Al moverte, Santa inclinará sus esquís despidiendo nubes de nieve polvo. Mantenerte esquiando sin chocar activará tu <strong>Racha de Flujo</strong> (+12%, +24% y +38% de velocidad y puntos x2).",
          proTip: "¡Los movimientos suaves te permitirán esquivar mejor en curvas cerradas!",
          stageType: "ski_controls"
        },
        {
          tag: "CAPÍTULO 3 • ESLALON Y RAMPAS",
          title: "¡Banderas Turbo y Saltos 360°!",
          badge: "VELOCIDAD Y TRUCOS",
          badgeColor: "#00E676",
          storyText: "Pasa exactamente por el centro de las <strong>Puertas de Eslalon</strong> con banderas festivas para ganar <strong>+150 pts</strong> y activar el <strong>Turbo Eslalon</strong> acumulando combos. Además, embiste las <strong>Rampas de Salto</strong> con flechas doradas para elevarte por los cielos realizando acrobacias 360° con <strong>+300 pts</strong>.",
          proTip: "¡Encadenar varias puertas seguidas desatará una aceleración legendaria!",
          stageType: "ski_slalom_ramps"
        },
        {
          tag: "CAPÍTULO 4 • PELIGROS Y PODER",
          title: "¡Esquiva Peligros o Demuélelos!",
          badge: "SUPERVIVENCIA & POWER-UP",
          badgeColor: "#FF9100",
          storyText: "¡Cuidado con los pinos nevados, muñecos de nieve y los <strong>Carteles de Patrocinadores</strong>! Si chocas con ellos perderás 1 vida y romperás tu racha. Pero si recoges la <strong>Estrella Dorada</strong>, activarás el <strong>SÚPER TURBO</strong>: serás completamente invencible y demolerás los carteles a tu paso (+250 pts).",
          proTip: "¡Tienes 3 vidas en total; conduce con precisión para sobrevivir!",
          stageType: "ski_hazards"
        },
        {
          tag: "CAPÍTULO 5 • ¡ALERTA YETI!",
          title: "¡El Abominable Monstruo de Nieve!",
          badge: "PELIGRO EN LA NIEVE",
          badgeColor: "#FF1744",
          storyText: "¡No te duermas en la pista! Si esquías muy lento o tardas en avanzar, el <strong>Abominable Yeti de Nieve</strong> bajará rugiendo colina abajo con sus cuernos de hielo para atraparte. ¡Mantén tu velocidad alta, cruza las puertas de eslalon y salta en las rampas para dejarlo atrás!",
          proTip: "¡El indicador superior te avisará a cuántos metros te sigue el Yeti!",
          stageType: "ski_yeti"
        }
      ]
    });
  }
}
