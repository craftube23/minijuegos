/**
 * ==============================================================================
 * SISTEMA CINEMATOGRÁFICO DE MINI-HISTORIAS: LIBRO MÁGICO POP-UP 3D + ARCADE SMASH
 * ==============================================================================
 * 
 * Dirección artística: Stylized 2D / Fantasy Game Art
 * 
 * Flujo de la experiencia (3.3 segundos total):
 * 1. (0.0s - 0.7s) Aparición del gran Libro Navideño de Terciopelo Rojo con
 *    filigrana dorada y gemas. Apertura tridimensional (rotateY -155°) con
 *    haz de luz mágica central.
 * 2. (0.7s - 2.0s) Despliegue de Escenario Pop-Up 2.5D: Capas troqueladas
 *    (fondo, entorno, héroe y juguetes) que se levantan con anticipación,
 *    perspectiva 3D, elasticidad orgánica y sombras proyectadas.
 * 3. (2.0s - 3.1s) Impacto Arcade Smash: Líneas de velocidad doradas, sacudida
 *    sutil de cámara, destello estelar, partículas de celebración y título
 *    cinético 3D de alta legibilidad con la misión del minijuego.
 * 4. (3.3s) Transición fluida hacia las instrucciones / inicio del juego.
 * 
 * Botón «SALTAR»: Visible al 100%, respuesta táctil inmediata, libre de bugs
 * de doble toque, limpieza completa de GSAP y memoria.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export interface PopUpProp {
  src: string;
  className: string;
  xPercent: number;
  yPercent: number;
  delayOffset: number;
  scale?: number;
  rotateDeg?: number;
}

export interface PopUpStoryData {
  gameId: string;
  gameTitle: string;
  subTag: string;
  headline: string;
  tagline: string;
  pageIllustrationBg: string;
  backdropLayerImg?: string;
  sceneryLayerImg?: string;
  heroLayerImg: string;
  heroLayerScale?: number;
  heroLayerOffsetY?: number;
  props: PopUpProp[];
  playHeroSound?: (audio: AudioManager) => void;
}

export class GameStoryCinemaModal {
  private container: HTMLElement;
  private audio: AudioManager;

  // Estado y Control
  private isRunning: boolean = false;
  private isFinishing: boolean = false;
  private currentGameId: string = "";
  private masterTimeline: gsap.core.Timeline | null = null;
  private screenShakeTween: gsap.core.Tween | null = null;

  // Callbacks de navegación
  public onComplete?: () => void;
  public onSkipToPlay?: () => void;
  public onBack?: () => void;

  // Base de datos de historias personalizadas por juego
  private stories: Map<string, PopUpStoryData> = new Map();

  constructor(containerId: string, audio: AudioManager) {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "game-story-cinema-modal hide";
      document.body.appendChild(el);
    }
    this.container = el;
    this.audio = audio;

    this.initStoriesData();
    this.renderDOM();
    this.setupEvents();
  }

  /**
   * Compatibilidad hacia atrás con main.ts
   */
  public get currentStory(): { gameId: string } {
    return { gameId: this.currentGameId };
  }

  public getCurrentGameId(): string {
    return this.currentGameId;
  }

  /**
   * Inicializa la narrativa visual única para cada minijuego del proyecto
   */
  private initStoriesData(): void {
    // 1. ATRAPA-REGALOS MÁGICO (ToyCatchGame)
    this.stories.set("toy-catch", {
      gameId: "toy-catch",
      gameTitle: "ATRAPA-REGALOS MÁGICO",
      subTag: "¡EMERGENCIA EN EL TALLER!",
      headline: "¡ATRAPA LOS REGALOS!",
      tagline: "¡La chimenea se desbordó! Atrapa los juguetes con el saco de Santa.",
      pageIllustrationBg: "./assets/images/fondo-habitacion.webp",
      sceneryLayerImg: "./assets/images/chimenea-obstaculo.webp",
      heroLayerImg: "./assets/images/bolsa de regalos.webp",
      heroLayerScale: 1.15,
      heroLayerOffsetY: 12,
      props: [
        { src: "./assets/images/regalo-estilizado-rojo.webp", className: "prop-catch-gift1", xPercent: -28, yPercent: -45, delayOffset: 0.1, scale: 0.9, rotateDeg: -18 },
        { src: "./assets/images/regalo-estilizado-dorado.webp", className: "prop-catch-gift2", xPercent: 32, yPercent: -50, delayOffset: 0.22, scale: 0.95, rotateDeg: 22 },
        { src: "./assets/images/osito.webp", className: "prop-catch-bear", xPercent: 2, yPercent: -80, delayOffset: 0.35, scale: 1.05, rotateDeg: 8 }
      ],
      playHeroSound: (a) => a.playCatchItem(1.1)
    });

    // 2. SINFONÍA DE CAMPANAS NAVIDEÑAS (BellSymphonyGame)
    this.stories.set("bell-symphony", {
      gameId: "bell-symphony",
      gameTitle: "SINFONÍA DE CAMPANAS",
      subTag: "¡EL GRAN CONCIERTO DE MEDIANOCHE!",
      headline: "¡HAZ SONAR LA NAVIDAD!",
      tagline: "¡Toca las campanas al compás y despierta la magia festiva!",
      pageIllustrationBg: "./assets/images/fondo-nieve.webp",
      backdropLayerImg: "./assets/images/fondo-villa-montanas.webp",
      heroLayerImg: "./assets/images/icon-campanas.webp",
      heroLayerScale: 1.25,
      heroLayerOffsetY: 5,
      props: [
        { src: "./assets/images/bola-roja.webp", className: "prop-note-red", xPercent: -38, yPercent: -35, delayOffset: 0.12, scale: 0.8 },
        { src: "./assets/images/bola-amarilla.webp", className: "prop-note-gold", xPercent: 40, yPercent: -35, delayOffset: 0.22, scale: 0.8 },
        { src: "./assets/images/estrella con logo.webp", className: "prop-bell-star", xPercent: 0, yPercent: -75, delayOffset: 0.34, scale: 1.1 }
      ],
      playHeroSound: (a) => a.playPowerUp()
    });

    // 3. EL VUELO MÁGICO DEL ELFO (FlyingElfGame)
    this.stories.set("flying-elf", {
      gameId: "flying-elf",
      gameTitle: "EL VUELO MÁGICO DEL ELFO",
      subTag: "¡MISIÓN POR LOS CIELOS!",
      headline: "¡VUELA CON EL ELFO!",
      tagline: "¡Una ráfaga helada dispersó las cartas! Vuela y rescátalas.",
      pageIllustrationBg: "./assets/images/fondo-villa-montanas.webp",
      sceneryLayerImg: "./assets/images/casas-techo-fore.webp",
      heroLayerImg: "./assets/images/elfo-volador.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: -10,
      props: [
        { src: "./assets/images/baston-caramelo.webp", className: "prop-elf-candy", xPercent: 44, yPercent: -42, delayOffset: 0.15, scale: 0.9, rotateDeg: 28 },
        { src: "./assets/images/regalo-estilizado-azul.webp", className: "prop-elf-gift", xPercent: -40, yPercent: -25, delayOffset: 0.28, scale: 0.85, rotateDeg: -20 },
        { src: "./assets/images/estrella con logo.webp", className: "prop-elf-star", xPercent: -20, yPercent: -75, delayOffset: 0.38, scale: 1.0 }
      ],
      playHeroSound: (a) => a.playElfFly()
    });

    // 4. PAREJAS DE JUGUETES / MEMORIA (MagicPairsGame)
    this.stories.set("magic-pairs", {
      gameId: "magic-pairs",
      gameTitle: "PAREJAS DE JUGUETES",
      subTag: "¡DESAFÍO DE INGENIO & MEMORIA!",
      headline: "¡ENCUENTRA LAS PAREJAS!",
      tagline: "¡Los traviesos duendes revolvieron las cartas de juguetes!",
      pageIllustrationBg: "./assets/images/fondo-habitacion.webp",
      heroLayerImg: "./assets/images/icon-cartas.webp",
      heroLayerScale: 1.15,
      heroLayerOffsetY: 10,
      props: [
        { src: "./assets/images/osito.webp", className: "prop-card-bear", xPercent: -36, yPercent: -30, delayOffset: 0.12, scale: 0.95 },
        { src: "./assets/images/robot.webp", className: "prop-card-robot", xPercent: 36, yPercent: -30, delayOffset: 0.24, scale: 0.95 },
        { src: "./assets/images/regalo-estilizado-verde.webp", className: "prop-card-gift", xPercent: 0, yPercent: -68, delayOffset: 0.36, scale: 0.9 }
      ],
      playHeroSound: (a) => a.playCardFlip()
    });

    // 5. EL DESCENSO DE SANTA / COLINAS NEVADAS (SantaHillsGame)
    this.stories.set("santa-hills", {
      gameId: "santa-hills",
      gameTitle: "EL DESCENSO DE SANTA",
      subTag: "¡AVENTURA EN LA NIEVE!",
      headline: "¡DESLÍZATE Y RESCATA!",
      tagline: "¡El trineo de Santa perdió los regalos por las colinas nevadas!",
      pageIllustrationBg: "./assets/images/fondo-nieve.webp",
      sceneryLayerImg: "./assets/images/arbol.webp",
      heroLayerImg: "./assets/images/santa-trineo.webp",
      heroLayerScale: 1.25,
      heroLayerOffsetY: 8,
      props: [
        { src: "./assets/images/obstaculo-muneco.webp", className: "prop-hills-snowman", xPercent: 48, yPercent: 12, delayOffset: 0.14, scale: 0.9 },
        { src: "./assets/images/regalo-estilizado-verde.webp", className: "prop-hills-gift1", xPercent: -35, yPercent: 20, delayOffset: 0.25, scale: 0.85, rotateDeg: 25 },
        { src: "./assets/images/regalo-estilizado-rojo.webp", className: "prop-hills-gift2", xPercent: -65, yPercent: -15, delayOffset: 0.38, scale: 0.9, rotateDeg: -30 }
      ],
      playHeroSound: (a) => a.playWindGust()
    });

    // 6. TIRO AL BLANCO NAVIDEÑO (SnowballTargetGame)
    this.stories.set("snowball-target", {
      gameId: "snowball-target",
      gameTitle: "TIRO AL BLANCO NAVIDEÑO",
      subTag: "¡CASETA DE FERIA DE PUNTERÍA!",
      headline: "¡AFINA TU PUNTERÍA!",
      tagline: "¡Apunta con bolas de nieve mágicas a las dianas y regalos!",
      pageIllustrationBg: "./assets/images/fondo-tiro-al-blanco.webp",
      heroLayerImg: "./assets/images/icon-tiro-al-blanco.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: 5,
      props: [
        { src: "./assets/images/obstaculo-muneco.webp", className: "prop-target-snowy", xPercent: 44, yPercent: -5, delayOffset: 0.15, scale: 0.85 },
        { src: "./assets/images/regalo-estilizado-dorado.webp", className: "prop-target-gold", xPercent: -42, yPercent: -22, delayOffset: 0.28, scale: 0.85 }
      ],
      playHeroSound: (a) => a.playPaperTear()
    });

    // 7. TAMBORES DEL CASCANUECES (NutcrackerDrumsGame / tree-melody)
    const drumsStory: PopUpStoryData = {
      gameId: "tree-melody",
      gameTitle: "TAMBORES DEL CASCANUECES",
      subTag: "¡EL DESFILE DE MEDIANOCHE!",
      headline: "¡SIGUE EL COMPÁS!",
      tagline: "¡Acompaña al elfo baterista marcando el ritmo marcial!",
      pageIllustrationBg: "./assets/images/fondo-empresas.webp",
      heroLayerImg: "./assets/images/elfo-baterista.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: -5,
      props: [
        { src: "./assets/images/icon-tambores.webp", className: "prop-drum-kit", xPercent: 0, yPercent: 42, delayOffset: 0.14, scale: 1.0 },
        { src: "./assets/images/estrella con logo.webp", className: "prop-drum-star", xPercent: 42, yPercent: -45, delayOffset: 0.28, scale: 0.95 }
      ],
      playHeroSound: (a) => a.playTap()
    };
    this.stories.set("tree-melody", drumsStory);
    this.stories.set("nutcracker-drums", { ...drumsStory, gameId: "nutcracker-drums" });

    // 8. VISTE AL MUÑECO DE NIEVE (HolidayDressUpGame)
    this.stories.set("gift-tower", {
      gameId: "gift-tower",
      gameTitle: "¡TORRE DE REGALOS MÁGICA!",
      subTag: "¡CONSTRUYE HACIA LA ESTRELLA!",
      headline: "¡APILA HASTA LAS ESTRELLAS!",
      tagline: "¡La grúa mágica de Santa balancea los paquetes! Apílalos con precisión milimétrica.",
      pageIllustrationBg: "./assets/images/fondo-nieve.webp",
      heroLayerImg: "./assets/images/icon-torre-regalos.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: 0,
      props: [
        { src: "./assets/images/regalo-estilizado-dorado.webp", className: "prop-tower-gold", xPercent: -36, yPercent: -30, delayOffset: 0.15, scale: 0.85 },
        { src: "./assets/images/estrella con logo.webp", className: "prop-tower-star", xPercent: 36, yPercent: -45, delayOffset: 0.28, scale: 0.95 }
      ],
      playHeroSound: (a) => a.playPowerUp()
    });

    // 9. EL CAOS DEL TALLER MÁGICO (WorkshopChaosGame)
    this.stories.set("workshop-chaos", {
      gameId: "workshop-chaos",
      gameTitle: "¡EL CAOS DEL TALLER MÁGICO!",
      subTag: "¡MÁQUINA FUERA DE CONTROL!",
      headline: "¡RESCATA LOS JUGUETES!",
      tagline: "¡La máquina mágica escupe juguetes al aire! Tócalos antes de que caigan.",
      pageIllustrationBg: "./assets/images/fondo-habitacion.webp",
      heroLayerImg: "./assets/images/icon-caos-taller.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: 0,
      props: [
        { src: "./assets/images/coche-juguete.webp", className: "prop-chaos-car", xPercent: -35, yPercent: -35, delayOffset: 0.14, scale: 0.9, rotateDeg: -15 },
        { src: "./assets/images/robot.webp", className: "prop-chaos-robot", xPercent: 35, yPercent: -38, delayOffset: 0.26, scale: 0.9, rotateDeg: 18 }
      ],
      playHeroSound: (a) => a.playCatchItem(1.2)
    });

    // 10. SALTO MÁGICO NAVIDEÑO (MagicJumpGame)
    this.stories.set("magic-jump", {
      gameId: "magic-jump",
      gameTitle: "¡SALTO MÁGICO NAVIDEÑO!",
      subTag: "¡ASCENSO A LAS NUBES!",
      headline: "¡SALTA SIN PARAR!",
      tagline: "¡Impúlsate de plataforma en plataforma hasta alcanzar la aurora boreal!",
      pageIllustrationBg: "./assets/images/fondo-villa-montanas.webp",
      heroLayerImg: "./assets/images/elfo-saltador.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: -8,
      props: [
        { src: "./assets/images/regalo-estilizado-rojo.webp", className: "prop-jump-gift", xPercent: -36, yPercent: -40, delayOffset: 0.15, scale: 0.85 },
        { src: "./assets/images/estrella con logo.webp", className: "prop-jump-star", xPercent: 36, yPercent: -55, delayOffset: 0.28, scale: 0.95 }
      ],
      playHeroSound: (a) => a.playElfFly()
    });

    // 11. EL EXPRESO POLAR MÁGICO (PolarExpressGame)
    this.stories.set("polar-express", {
      gameId: "polar-express",
      gameTitle: "¡EL EXPRESO POLAR MÁGICO!",
      subTag: "¡A TODA MÁQUINA POR LA NIEVE!",
      headline: "¡CAMBIA DE VÍA!",
      tagline: "¡Guía la locomotora navideña, recoge regalos y esquiva los obstáculos!",
      pageIllustrationBg: "./assets/images/fondo-nieve.webp",
      heroLayerImg: "./assets/images/icon-expreso-polar.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: 4,
      props: [
        { src: "./assets/images/regalo-estilizado-dorado.webp", className: "prop-train-gift", xPercent: 38, yPercent: -30, delayOffset: 0.16, scale: 0.9 },
        { src: "./assets/images/obstaculo-muneco.webp", className: "prop-train-snow", xPercent: -38, yPercent: -20, delayOffset: 0.28, scale: 0.85 }
      ],
      playHeroSound: (a) => a.playPowerUp()
    });

    // 13. BURBUJAS DE ADORNOS (OrnamentPopGame)
    this.stories.set("ornament-pop", {
      gameId: "ornament-pop",
      gameTitle: "¡NINJA CORTA-REGALOS!",
      subTag: "¡ESPADA DE LUZ DEL DOJO!",
      headline: "¡REBANA AL VUELO!",
      tagline: "¡Corta piñatas, dulces y cajas mágicas en dos mitades y esquiva las bombas!",
      pageIllustrationBg: "./assets/images/fondo-habitacion.webp",
      heroLayerImg: "./assets/images/icon-ninja-regalos.webp",
      heroLayerScale: 1.22,
      heroLayerOffsetY: 2,
      props: [
        { src: "./assets/images/pinata-estrella.webp", className: "prop-pop-red", xPercent: -36, yPercent: -38, delayOffset: 0.14, scale: 0.9 },
        { src: "./assets/images/galleta-jengibre.webp", className: "prop-pop-blue", xPercent: 36, yPercent: -34, delayOffset: 0.26, scale: 0.9 }
      ],
      playHeroSound: (a) => a.playWhoosh()
    });

    // 14. JUGUETERÍA MÁGICA (ToyMatchGame)
    this.stories.set("toy-match", {
      gameId: "toy-match",
      gameTitle: "¡JUGUETERÍA MÁGICA!",
      subTag: "¡VITRINA DE INGENIO!",
      headline: "¡UNE 3 JUGUETES!",
      tagline: "¡Intercambia juguetes iguales en la vitrina y desata combos brillantes!",
      pageIllustrationBg: "./assets/images/fondo-habitacion.webp",
      heroLayerImg: "./assets/images/icon-jugueteria-magica.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: 0,
      props: [
        { src: "./assets/images/osito.webp", className: "prop-claw-gift1", xPercent: -35, yPercent: -30, delayOffset: 0.15, scale: 0.9 },
        { src: "./assets/images/regalo-estilizado-dorado.webp", className: "prop-claw-gift2", xPercent: 35, yPercent: -35, delayOffset: 0.28, scale: 0.95 }
      ],
      playHeroSound: (a) => a.playCatchItem(1.15)
    });

    // 15. ENTREGA POR LA CHIMENEA (ChimneyDropGame)
    this.stories.set("santa-ski", {
      gameId: "santa-ski",
      gameTitle: "¡ESQUÍ ALPINO DE SANTA!",
      subTag: "¡DESCENSO A TODA VELOCIDAD!",
      headline: "¡DESLÍZATE POR LA NIEVE!",
      tagline: "¡Santa compite en el gran eslalon de alta montaña! Cruza las banderas y salta en las rampas.",
      pageIllustrationBg: "./assets/images/fondo-nieve.webp",
      heroLayerImg: "./assets/images/icon-esqui-alpino.webp",
      heroLayerScale: 1.2,
      heroLayerOffsetY: 0,
      props: [
        { src: "./assets/images/rampa-esqui.webp", className: "prop-ski-ramp", xPercent: -36, yPercent: -30, delayOffset: 0.15, scale: 0.85 },
        { src: "./assets/images/puerta-eslalon.webp", className: "prop-ski-gate", xPercent: 36, yPercent: -45, delayOffset: 0.28, scale: 0.95 }
      ],
      playHeroSound: (a) => a.playRunnerJump()
    });
  }

  /**
   * Construye la estructura visual HTML del Libro Pop-Up 3D y Arcade Smash
   */
  private renderDOM(): void {
    this.container.innerHTML = `
      <div class="popup-cinema-backdrop"></div>

      <!-- VIEWPORT 3D PERSPECTIVE -->
      <div class="popup-story-viewport" id="popup-story-viewport">

        <!-- HUD SUPERIOR (Siempre accesible con z-index alto) -->
        <div class="popup-hud-bar">
          <div class="popup-story-badge">
            <span class="story-badge-gem">✦</span>
            <span id="popup-story-game-name">CRÓNICA NAVIDEÑA</span>
          </div>
          <button id="btn-popup-skip" class="btn-popup-skip-arcade" aria-label="Saltar introducción e ir a jugar">
            <span>SALTAR</span>
            ${getIconSvg("play", { size: 16, color: "#FFFFFF", fill: "#FFFFFF" })}
          </button>
        </div>

        <!-- ESCENARIO DEL LIBRO MÁGICO 3D -->
        <div class="magic-book-stage" id="magic-book-stage">
          <div class="magic-book" id="magic-book">
            <!-- CUBIERTA TRASERA Y LOMO -->
            <div class="book-back-cover"></div>
            <div class="book-spine"></div>

            <!-- PÁGINA IZQUIERDA -->
            <div class="book-page book-page-left">
              <div class="page-parchment">
                <div class="page-illustration-bg" id="page-bg-left"></div>
                <div class="page-gold-filigree top-l"></div>
                <div class="page-gold-filigree bot-l"></div>
                <div class="page-inner-spine-shadow"></div>
              </div>
            </div>

            <!-- PÁGINA DERECHA -->
            <div class="book-page book-page-right">
              <div class="page-parchment">
                <div class="page-illustration-bg" id="page-bg-right"></div>
                <div class="page-gold-filigree top-r"></div>
                <div class="page-gold-filigree bot-r"></div>
                <div class="page-inner-spine-shadow right"></div>
              </div>
            </div>

            <!-- PORTADA FRONTAL 3D QUE SE ABRE (rotateY) -->
            <div class="book-front-cover" id="book-front-cover">
              <div class="cover-face cover-front">
                <div class="cover-velvet-texture">
                  <div class="cover-gold-border"></div>
                  <div class="cover-corner-crest tl"></div>
                  <div class="cover-corner-crest tr"></div>
                  <div class="cover-corner-crest bl"></div>
                  <div class="cover-corner-crest br"></div>
                  <div class="cover-center-medallion">
                    <div class="cover-medallion-gem">💎</div>
                    <div class="cover-medallion-title">CRÓNICAS NAVIDEÑAS</div>
                    <div class="cover-medallion-sub">FERIA MÁGICA DEL JUGUETE</div>
                  </div>
                  <div class="cover-snowflakes-foil">❄ &nbsp; ❄ &nbsp; ❄</div>
                </div>
              </div>
              <div class="cover-face cover-back">
                <div class="cover-inner-silk"></div>
              </div>
            </div>

            <!-- RESPLANDOR CENTRAL AL ABRIR -->
            <div class="book-magical-light" id="book-magical-light"></div>

            <!-- ESCENARIO POP-UP 3D (Se eleva desde el pliegue del libro) -->
            <div class="popup-scene-container" id="popup-scene-container">
              <!-- CAPA 1: Fondo / Escenografía Trasera -->
              <div class="popup-layer layer-backdrop" id="layer-backdrop"></div>

              <!-- CAPA 2: Elementos de Entorno -->
              <div class="popup-layer layer-scenery" id="layer-scenery"></div>

              <!-- CAPA 3: Héroe Principal -->
              <div class="popup-layer layer-hero" id="layer-hero"></div>

              <!-- CAPA 4: Props y Objetos de Acción -->
              <div class="popup-layer layer-props" id="layer-props"></div>
            </div>
          </div>
        </div>

        <!-- CAPA SMASH MOTION GRAPHICS ARCADE -->
        <div class="arcade-smash-overlay" id="arcade-smash-overlay">
          <!-- Líneas de Velocidad -->
          <div class="speed-lines-grid" id="speed-lines-grid"></div>
          <!-- Flash de Impacto -->
          <div class="smash-impact-flash" id="smash-flash"></div>
          <!-- Cartel Cinético 3D -->
          <div class="smash-banner-wrapper" id="smash-banner-wrapper">
            <div class="smash-subtag-pill" id="smash-subtag-pill">¡MISIÓN ARCADE!</div>
            <h1 class="smash-headline-text" id="smash-headline-text">¡ATRAPA LOS REGALOS!</h1>
            <p class="smash-tagline-text" id="smash-tagline-text">¡Prepárate para jugar!</p>
            <div class="smash-stars-row">
              <span class="star-sparkle">⭐</span>
              <span class="star-gem">✨</span>
              <span class="star-sparkle">⭐</span>
            </div>
          </div>
        </div>

        <!-- BARRA INFERIOR DE PROGRESO DE CINE -->
        <div class="popup-timeline-bar">
          <div class="popup-timeline-fill" id="popup-timeline-fill"></div>
        </div>
      </div>
    `;
  }

  /**
   * Conecta los eventos táctiles para salto instantáneo
   */
  private setupEvents(): void {
    const btnSkip = this.container.querySelector<HTMLElement>("#btn-popup-skip");
    if (btnSkip) {
      btnSkip.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        this.audio.playTap();
        this.finishAndExit(true);
      });
    }

    // Tocar el fondo o pantalla también permite saltar rápidamente
    const viewport = this.container.querySelector<HTMLElement>("#popup-story-viewport");
    viewport?.addEventListener("pointerdown", (e) => {
      // Ignorar si se pulsó el botón de saltar para no duplicar
      if ((e.target as HTMLElement).closest("#btn-popup-skip")) return;
      this.audio.playTap();
      this.finishAndExit(true);
    });
  }

  /**
   * Muestra y reproduce la mini-historia cinematográfica
   */
  public show(gameId: string): void {
    if (this.isRunning) {
      this.killAnimations();
    }

    this.currentGameId = gameId;
    this.isRunning = true;
    this.isFinishing = false;

    // Obtener los datos personalizados de la historia
    const story = this.stories.get(gameId) || this.stories.get("toy-catch")!;

    // Inyectar datos en la escena
    this.populateStoryScene(story);

    // Desplegar el contenedor
    this.container.classList.remove("hide");
    this.container.classList.add("show");
    this.container.style.display = "flex";

    // Iniciar la secuencia maestra de animación
    this.runMasterTimeline(story);
  }

  /**
   * Rellena las capas del libro con los recursos del juego actual
   */
  private populateStoryScene(story: PopUpStoryData): void {
    // 1. Título superior
    const badgeEl = this.container.querySelector<HTMLElement>("#popup-story-game-name");
    if (badgeEl) badgeEl.textContent = story.gameTitle;

    // 2. Fondos de las páginas
    const bgLeft = this.container.querySelector<HTMLElement>("#page-bg-left");
    const bgRight = this.container.querySelector<HTMLElement>("#page-bg-right");
    if (bgLeft) bgLeft.style.backgroundImage = `url('${story.pageIllustrationBg}')`;
    if (bgRight) bgRight.style.backgroundImage = `url('${story.pageIllustrationBg}')`;

    // 3. Capa de Fondo 3D
    const backdropEl = this.container.querySelector<HTMLElement>("#layer-backdrop");
    if (backdropEl) {
      if (story.backdropLayerImg) {
        backdropEl.innerHTML = `<img src="${story.backdropLayerImg}" class="popup-img backdrop-img" alt="Backdrop" />`;
        backdropEl.style.display = "block";
      } else {
        backdropEl.innerHTML = "";
        backdropEl.style.display = "none";
      }
    }

    // 4. Capa de Escenografía
    const sceneryEl = this.container.querySelector<HTMLElement>("#layer-scenery");
    if (sceneryEl) {
      if (story.sceneryLayerImg) {
        sceneryEl.innerHTML = `<img src="${story.sceneryLayerImg}" class="popup-img scenery-img" alt="Scenery" />`;
        sceneryEl.style.display = "block";
      } else {
        sceneryEl.innerHTML = "";
        sceneryEl.style.display = "none";
      }
    }

    // 5. Capa del Héroe
    const heroEl = this.container.querySelector<HTMLElement>("#layer-hero");
    if (heroEl) {
      const scale = story.heroLayerScale || 1.0;
      const offsetY = story.heroLayerOffsetY || 0;
      heroEl.innerHTML = `
        <div class="hero-wrapper" style="transform: translateY(${offsetY}px) scale(${scale});">
          <img src="${story.heroLayerImg}" class="popup-img hero-img" alt="Hero" />
        </div>
      `;
    }

    // 6. Capa de Props / Juguetes dinámicos
    const propsEl = this.container.querySelector<HTMLElement>("#layer-props");
    if (propsEl) {
      propsEl.innerHTML = story.props
        .map(
          (p) => `
        <div class="prop-item ${p.className}" style="left: calc(50% + ${p.xPercent}%); top: calc(50% + ${p.yPercent}%); transform: scale(${p.scale || 1}) rotate(${p.rotateDeg || 0}deg);">
          <img src="${p.src}" class="popup-img prop-img" alt="Prop" />
        </div>
      `
        )
        .join("");
    }

    // 7. Cartel Smash Arcade
    const subtagEl = this.container.querySelector<HTMLElement>("#smash-subtag-pill");
    const headlineEl = this.container.querySelector<HTMLElement>("#smash-headline-text");
    const taglineEl = this.container.querySelector<HTMLElement>("#smash-tagline-text");
    if (subtagEl) subtagEl.textContent = story.subTag;
    if (headlineEl) headlineEl.textContent = story.headline;
    if (taglineEl) taglineEl.textContent = story.tagline;
  }

  /**
   * Ejecuta la línea de tiempo cinematográfica con GSAP
   */
  private runMasterTimeline(story: PopUpStoryData): void {
    this.killAnimations();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Referencias a los elementos del DOM
    const viewport = this.container.querySelector<HTMLElement>("#popup-story-viewport");
    const book = this.container.querySelector<HTMLElement>("#magic-book");
    const frontCover = this.container.querySelector<HTMLElement>("#book-front-cover");
    const magicLight = this.container.querySelector<HTMLElement>("#book-magical-light");
    const sceneContainer = this.container.querySelector<HTMLElement>("#popup-scene-container");
    const layerBackdrop = this.container.querySelector<HTMLElement>("#layer-backdrop");
    const layerScenery = this.container.querySelector<HTMLElement>("#layer-scenery");
    const layerHero = this.container.querySelector<HTMLElement>("#layer-hero");
    const propItems = Array.from(this.container.querySelectorAll<HTMLElement>(".prop-item"));
    const smashOverlay = this.container.querySelector<HTMLElement>("#arcade-smash-overlay");
    const smashFlash = this.container.querySelector<HTMLElement>("#smash-flash");
    const smashBanner = this.container.querySelector<HTMLElement>("#smash-banner-wrapper");
    const speedLines = this.container.querySelector<HTMLElement>("#speed-lines-grid");
    const timelineFill = this.container.querySelector<HTMLElement>("#popup-timeline-fill");

    // Reinicio inicial de estados con GSAP
    gsap.set(frontCover, { rotateY: 0, transformOrigin: "left center" });
    gsap.set(magicLight, { autoAlpha: 0, scale: 0.2 });
    gsap.set(sceneContainer, { autoAlpha: 1 });
    gsap.set([layerBackdrop, layerScenery], { rotateX: -90, transformOrigin: "bottom center", autoAlpha: 0 });
    gsap.set(layerHero, { rotateX: -90, scale: 0.5, transformOrigin: "bottom center", autoAlpha: 0 });
    gsap.set(propItems, { scale: 0, autoAlpha: 0 });
    gsap.set(smashOverlay, { autoAlpha: 1 });
    gsap.set(smashFlash, { autoAlpha: 0 });
    gsap.set(smashBanner, { scale: 0.2, autoAlpha: 0, y: 30 });
    gsap.set(speedLines, { autoAlpha: 0 });
    gsap.set(timelineFill, { width: "0%" });

    if (prefersReducedMotion) {
      // Modo movimiento reducido: sin rotaciones 3D agresivas, tiempo corto
      gsap.set(frontCover, { rotateY: -155, autoAlpha: 0.1 });
      gsap.set([layerBackdrop, layerScenery, layerHero, ...propItems], { rotateX: 0, scale: 1, autoAlpha: 1 });
      gsap.set(smashBanner, { scale: 1, autoAlpha: 1, y: 0 });
      gsap.to(timelineFill, { width: "100%", duration: 2.0, ease: "linear" });

      this.masterTimeline = gsap.timeline({
        onComplete: () => this.finishAndExit(false)
      });
      this.masterTimeline.to({}, { duration: 2.2 });
      return;
    }

    // =========================================================================
    // LÍNEA DE TIEMPO CINEMATOGRÁFICA COMPLETA (3.3 SEGUNDOS)
    // =========================================================================
    const tl = gsap.timeline({
      onComplete: () => {
        this.finishAndExit(false);
      }
    });
    this.masterTimeline = tl;

    // 0.0s - 0.2s: Inclinación inicial del libro y sonido
    tl.fromTo(
      book,
      { rotateX: 32, rotateY: 8, scale: 0.88, y: 35 },
      { rotateX: 18, rotateY: 0, scale: 1, y: 0, duration: 0.7, ease: "power2.out" },
      0
    );

    // Barra de tiempo dorada fluida de 0% a 100% en 3.3s
    tl.to(timelineFill, { width: "100%", duration: 3.3, ease: "linear" }, 0);

    // 0.25s: La portada de terciopelo se abre en 3D
    tl.to(
      frontCover,
      {
        rotateY: -155,
        duration: 0.95,
        ease: "power3.inOut",
        onStart: () => {
          this.audio.playClawTear(1.35);
        }
      },
      0.25
    );

    // 0.5s: Destello de luz mágica desde el pliegue
    tl.to(magicLight, { autoAlpha: 0.9, scale: 1.3, duration: 0.35, ease: "power2.out" }, 0.5);
    tl.to(magicLight, { autoAlpha: 0, scale: 1.8, duration: 0.45, ease: "power2.in" }, 0.85);

    // 0.75s: Capa de fondo/escenografía se despliega desde el pliegue
    tl.to(
      [layerBackdrop, layerScenery],
      {
        rotateX: 0,
        autoAlpha: 1,
        duration: 0.65,
        stagger: 0.08,
        ease: "back.out(1.8)"
      },
      0.75
    );

    // 0.95s: El Héroe salta con elasticidad orgánica
    tl.to(
      layerHero,
      {
        rotateX: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.75,
        ease: "elastic.out(1, 0.55)",
        onStart: () => {
          if (story.playHeroSound) {
            story.playHeroSound(this.audio);
          }
        }
      },
      0.95
    );

    // 1.1s: Props y juguetes salen disparados con anticipación
    if (propItems.length > 0) {
      tl.to(
        propItems,
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.55,
          stagger: 0.09,
          ease: "back.out(2.4)"
        },
        1.1
      );
    }

    // 2.0s: ¡IMPACTO SMASH ARCADE!
    tl.add(() => {
      // Sacudida de cámara enérgica pero controlada
      if (viewport) {
        this.screenShakeTween = gsap.fromTo(
          viewport,
          { x: -5, y: 3 },
          { x: 0, y: 0, duration: 0.22, ease: "rough({strength: 3, points: 8})", clearProps: "transform" }
        );
      }
      this.audio.playPowerUp();
      this.fireFestiveConfetti();
    }, 2.0);

    // Flash y líneas de velocidad
    tl.to(smashFlash, { autoAlpha: 0.75, duration: 0.08, ease: "power2.out" }, 2.0);
    tl.to(smashFlash, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 2.08);

    tl.to(speedLines, { autoAlpha: 0.65, duration: 0.1, ease: "power2.out" }, 2.0);
    tl.to(speedLines, { autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 2.3);

    // Cartel cinético 3D impacta en pantalla
    tl.to(
      smashBanner,
      {
        scale: 1,
        autoAlpha: 1,
        y: 0,
        duration: 0.38,
        ease: "back.out(2.2)"
      },
      2.05
    );

    // Micro-rebote adicional del cartel
    tl.to(
      smashBanner,
      {
        scale: 1.03,
        duration: 0.4,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      },
      2.45
    );
  }

  /**
   * Genera confeti estelar festivo controlado sin saturar memoria
   */
  private fireFestiveConfetti(): void {
    try {
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.62 },
        colors: ["#FFD700", "#FF1744", "#00E676", "#00E5FF", "#FFF9C4"],
        disableForReducedMotion: true,
        zIndex: 10005
      });
    } catch {
      // Ignorar de forma segura si el canvas de confeti no está disponible
    }
  }

  /**
   * Finaliza la historia y avanza al siguiente paso
   */
  private finishAndExit(isSkip: boolean): void {
    if (this.isFinishing) return;
    this.isFinishing = true;

    this.killAnimations();

    // Guardar en localStorage de forma segura
    try {
      if (this.currentGameId) {
        localStorage.setItem(`fmj_story_seen_v1_${this.currentGameId}`, "true");
      }
    } catch {
      // Ignorar si el almacenamiento local está restringido
    }

    // Ocultar modal con transición limpia
    this.container.classList.remove("show");
    this.container.classList.add("hide");

    setTimeout(() => {
      this.container.style.display = "none";
      this.isRunning = false;
      this.isFinishing = false;

      if (isSkip) {
        this.onSkipToPlay?.();
      } else {
        this.onComplete?.();
      }
    }, 180);
  }

  /**
   * Oculta el modal de forma inmediata (por ejemplo al volver al Menú)
   */
  public hide(): void {
    this.killAnimations();
    this.isRunning = false;
    this.isFinishing = false;
    this.container.classList.remove("show");
    this.container.classList.add("hide");
    this.container.style.display = "none";
  }

  /**
   * Limpia líneas de tiempo y referencias para evitar fugas de memoria
   */
  private killAnimations(): void {
    if (this.masterTimeline) {
      this.masterTimeline.kill();
      this.masterTimeline = null;
    }

    if (this.screenShakeTween) {
      this.screenShakeTween.kill();
      this.screenShakeTween = null;
    }

    try {
      confetti.reset();
    } catch {
      // Silencioso
    }

    const targets = this.container.querySelectorAll<HTMLElement>(
      "#magic-book, #book-front-cover, #book-magical-light, #layer-backdrop, #layer-scenery, #layer-hero, .prop-item, #smash-banner-wrapper, #smash-flash, #speed-lines-grid, #popup-timeline-fill, #popup-story-viewport"
    );
    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
  }
}
