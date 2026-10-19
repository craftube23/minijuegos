/**
 * ==============================================================================
 * PUNTO DE ENTRADA Y ORQUESTADOR PRINCIPAL - FERIA MÁGICA DEL JUGUETE
 * ==============================================================================
 * 
 * Controla el flujo completo del Kiosco:
 * 1. Inicialización de Audio, Partículas, Entrada Táctil y Carrusel Publicitario.
 * 2. Transición cinemática inicial: Tormenta de Nieve & Revelación.
 * 3. Transición de Portal a los Juegos: Glow + Zoom + Vuelo a la derecha.
 * 4. Cuenta regresiva arcade 3-2-1 antes de comenzar cada minijuego.
 * 5. Touch Magic Trail interactivo continuo.
 * 6. Temporizador de inactividad de Kiosco (regreso suave al inicio).
 */

import { AudioManager } from "./core/AudioManager";
import { InputManager } from "./core/InputManager";
import { ParticleSystem } from "./core/ParticleSystem";
import { ScreenTransition } from "./core/ScreenTransition";
import { BaseGame, type GameResult } from "./core/BaseGame";
import { KIOSK_CONFIG } from "./config/kiosk";
import { applyCanvasSize } from "./core/Viewport";

// Componentes de Interfaz
import { KioskHeader } from "./components/KioskHeader";
import { GameBannerCarousel } from "./components/GameBannerCarousel";
import { AttractScreen } from "./components/AttractScreen";
import { GameMenu } from "./components/GameMenu";
import { GameOverModal } from "./components/GameOverModal";
import { GameInstructionsModal } from "./components/GameInstructionsModal";
import { GameStoryCinemaModal } from "./components/GameStoryCinemaModal";

// Los Minijuegos Navideños
import { ToyCatchGame } from "./games/ToyCatchGame";
import { BellSymphonyGame } from "./games/BellSymphonyGame";
import { NutcrackerDrumsGame } from "./games/NutcrackerDrumsGame";
import { FlyingElfGame } from "./games/FlyingElfGame";
import { MagicPairsGame } from "./games/MagicPairsGame";
import { SantaHillsGame } from "./games/SantaHillsGame";
import { SnowballTargetGame } from "./games/SnowballTargetGame";
import { WorkshopChaosGame } from "./games/WorkshopChaosGame";
import { MagicJumpGame } from "./games/MagicJumpGame";
import { ElfWhackGame } from "./games/ElfWhackGame";
import { GiftSlashGame } from "./games/GiftSlashGame";
import { SleighTossGame } from "./games/SleighTossGame";
import { ChristmasSnakeGame } from "./games/ChristmasSnakeGame";
import { getIconSvg } from "./utils/icons";
import {
  initKioskNativeMode,
  getKioskNativeDiagnostics,
  runIsolatedNativeResilienceCheck
} from "./utils/kioskNative";

class KioskApp {
  private canvas: HTMLCanvasElement;
  private audio: AudioManager;
  private input: InputManager;
  private particles: ParticleSystem;

  // Componentes UI
  public header: KioskHeader;
  public carousel: GameBannerCarousel;
  public attractScreen: AttractScreen;
  public gameMenu: GameMenu;
  public gameOverModal: GameOverModal;
  public instructionsModal: GameInstructionsModal;
  public storyModal: GameStoryCinemaModal;

  // Diagnóstico de modo kiosco nativo (Fase 4)
  public getKioskNativeStatus = getKioskNativeDiagnostics;
  public testNativeResilience = runIsolatedNativeResilienceCheck;

  // Colección de Minijuegos
  private games: Map<string, BaseGame> = new Map();
  private currentGame: BaseGame | null = null;

  // Estado del Kiosco: 'attract' | 'menu' | 'playing' | 'gameover'
  private appState: "attract" | "menu" | "playing" | "gameover" = "attract";
  private isTransitioning: boolean = false;

  // Temporizador de inactividad
  private lastUserInteractionTime: number = Date.now();

  // Game Loop
  private lastFrameTime: number = performance.now();
  private logicalWidth: number = 0;
  private logicalHeight: number = 0;
  private isPageHidden: boolean = false;

  constructor() {
    // 0. Inicializar modo kiosco nativo (Capacitor Android: KeepAwake + StatusBar)
    // En navegador web es un no-op seguro e idempotente.
    void initKioskNativeMode();

    // 1. Obtener y configurar el Canvas responsive
    const canvasEl = document.getElementById("game-canvas") as HTMLCanvasElement;
    if (!canvasEl) throw new Error("No se encontró el elemento #game-canvas");
    this.canvas = canvasEl;

    // 2. Inicializar subsistemas del Core
    this.audio = AudioManager.getInstance();
    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem(window.innerWidth, window.innerHeight);

    // 3. Inicializar componentes de UI
    this.header = new KioskHeader("kiosk-header", this.audio);
    this.carousel = new GameBannerCarousel("kiosk-banner-carousel");
    this.attractScreen = new AttractScreen("attract-screen");
    this.gameMenu = new GameMenu("menu-screen", this.audio);
    this.gameOverModal = new GameOverModal("gameover-modal", this.audio);
    this.instructionsModal = new GameInstructionsModal("instructions-modal", this.audio);
    this.storyModal = new GameStoryCinemaModal("story-modal", this.audio);

    // 4. Instanciar los minijuegos disponibles
    this.registerGames();

    // 5. Adaptar resolución nativa al tamaño del contenedor
    this.handleResize();
    this.setupContainerResizeObserver();
    this.setupVisibilityHandling();
    window.addEventListener("resize", () => this.handleResize());
    window.addEventListener("orientationchange", () => setTimeout(() => this.handleResize(), 100));

    // 6. Conectar eventos y callbacks entre pantallas
    this.setupNavigationCallbacks();

    // 7. Configurar detector de inactividad y estela mágica táctil
    this.setupInactivityWatcher();
    this.setupTouchMagicTrail();

    // 8. Arrancar bucle de renderizado
    this.startMainLoop();

    // 9. Ejecutar Tormenta de Nieve Inicial & Revelación
    const kioskAppContainer = document.getElementById("kiosk-app");
    if (kioskAppContainer) {
      ScreenTransition.getInstance().runInitialSnowstorm(kioskAppContainer, () => {
        console.log("[Feria Mágica del Juguete] Magia Revelada y Lista");
      });
    }

    // 10. Iniciar música de fondo festiva para inicio y menú
    this.audio.playMenuBGM();

    (window as any).kioskApp = this;

    console.log("[Feria Mágica del Juguete] Kiosco Interactivo Listo");
  }

  private cachedCanvasRect: DOMRect | null = null;

  /**
   * Intento seguro de activar Pantalla Completa en navegador tras interacción del usuario.
   * En plataforma nativa Android se delega a StatusBar.hide() mediante kioskNative.
   */
  private tryEnterFullscreen(): void {
    if (getKioskNativeDiagnostics().isNative) {
      return;
    }
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignorar silenciosamente si el navegador bloquea la petición
        });
      }
    } catch {
      // Ignorar de forma segura sin interrumpir la experiencia
    }
  }

  /**
   * Ajusta el Canvas y los juegos a la resolución exacta del dispositivo
   */
  public handleResize(): void {
    const container = this.canvas.parentElement;
    const width = container && container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
    const height = container && container.clientHeight > 0 ? container.clientHeight : (window.innerHeight - 130);

    if (width > 0 && height > 0) {
      // Buffer físico = lógico × DPR (máx. 2). Los juegos y los toques usan coordenadas lógicas.
      this.logicalWidth = width;
      this.logicalHeight = height;
      applyCanvasSize(this.canvas, width, height);

      this.cachedCanvasRect = this.canvas.getBoundingClientRect();
      this.input.setLogicalSize(width, height);

      this.particles.initSnow(width, height);

      this.games.forEach((game) => {
        game.resize(width, height);
      });
    }
  }

  /**
   * Observa cambios de tamaño del contenedor (no solo de la ventana), con throttle por frame.
   */
  private setupContainerResizeObserver(): void {
    const container = this.canvas.parentElement;
    if (!container || typeof ResizeObserver === "undefined") return;
    let pending = false;
    const observer = new ResizeObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0 && (w !== this.logicalWidth || h !== this.logicalHeight)) {
          this.handleResize();
        }
      });
    });
    observer.observe(container);
  }

  /**
   * Pausa el juego (sin acumular tiempo ni notas) cuando la pestaña/WebView queda oculta.
   */
  private setupVisibilityHandling(): void {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.isPageHidden = true;
        this.audio.onPageHidden();
        this.currentGame?.onPageHidden();
      } else {
        this.isPageHidden = false;
        // Evita un salto de delta tras la suspensión y limpia toques/teclas atascados
        this.lastFrameTime = performance.now();
        this.input.reset();
        this.audio.onPageVisible();
        this.currentGame?.onPageVisible();
        this.resetInactivity();
      }
    });
  }

  /**
   * Registra los 4 juegos en el gestor
   */
  private registerGames(): void {
    const game1 = new ToyCatchGame(this.canvas, this.input, this.audio, this.particles);
    const game2 = new BellSymphonyGame(this.canvas, this.input, this.audio, this.particles);
    const game3 = new NutcrackerDrumsGame(this.canvas, this.input, this.audio, this.particles);
    const game4 = new FlyingElfGame(this.canvas, this.input, this.audio, this.particles);
    const game5 = new MagicPairsGame(this.canvas, this.input, this.audio, this.particles);
    const game6 = new SantaHillsGame(this.canvas, this.input, this.audio, this.particles);
    const game7 = new SnowballTargetGame(this.canvas, this.input, this.audio, this.particles);
    const game8 = new WorkshopChaosGame(this.canvas, this.input, this.audio, this.particles);
    const game9 = new MagicJumpGame(this.canvas, this.input, this.audio, this.particles);
    const game10 = new ElfWhackGame(this.canvas, this.input, this.audio, this.particles);
    const game11 = new GiftSlashGame(this.canvas, this.input, this.audio, this.particles);
    const game12 = new SleighTossGame(this.canvas, this.input, this.audio, this.particles);
    const game13 = new ChristmasSnakeGame(this.canvas, this.input, this.audio, this.particles);

    // Conectar callback de Game Over de cada juego
    [game1, game2, game3, game4, game5, game6, game7, game8, game9, game10, game11, game12, game13].forEach((g) => {
      g.onGameOver = (result: GameResult) => this.handleGameOver(result);
      this.games.set(g.id, g);
    });
  }

  /**
   * Conecta los botones y transiciones entre pantallas
   */
  private setupNavigationCallbacks(): void {
    // 1. Al presionar "Toca para Jugar" en el Salvapantallas → Manos de Santa desgarran el gran paquete para revelar el Menú
    this.attractScreen.onStartClick = () => {
      this.audio.unlockAudio();
      this.audio.playTap();
      this.audio.resumeMenuBGM();
      this.tryEnterFullscreen();

      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const mainContainer = document.getElementById("kiosk-main") || document.body;
      ScreenTransition.getInstance().runHandsTearLandingTransition(
        mainContainer,
        this.particles,
        () => {
          this.appState = "menu";
          this.attractScreen.hide();
          this.gameOverModal.hide();
          this.instructionsModal.hide();
          this.gameMenu.show();
          this.resetInactivity();
        },
        () => {
          this.isTransitioning = false;
        }
      );
    };

    // 2. Al pulsar "🎪 VOLVER A LA FERIA" en el Dashboard de juegos → Regresar a la Landing
    this.gameMenu.onBackToLanding = () => {
      this.goToAttractScreen();
    };

    // 3. Al seleccionar un juego en el Menú → ¡ZARPAZO DE GARRAS Y MINI-HISTORIA CINEMÁTICA!
    this.gameMenu.onSelectGame = (gameId: string) => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const mainContainer = document.getElementById("kiosk-main") || document.body;
      const gameInfo = this.getGameTransitionInfo(gameId);

      // Ejecutar la transición de garras cortando el paquete
      ScreenTransition.getInstance().runClawSlashGameTransition(
        mainContainer,
        gameInfo,
        this.particles,
        () => {
          // Punto medio: Pantalla cubierta. Revelar directamente el modal de instrucciones rápidas
          this.gameMenu.hide();
          this.instructionsModal.show(gameId);
        },
        () => {
          // Las garras terminan de desgarrar
          this.isTransitioning = false;
        }
      );
    };

    // Al terminar la mini-historia animada → Mostrar el modal de instrucciones rápidas
    this.storyModal.onComplete = () => {
      const activeStory = (this.storyModal as any).currentStory;
      const gameId = activeStory?.gameId || "";
      if (gameId) {
        this.instructionsModal.show(gameId);
      }
    };

    // Si el jugador presiona "¡A JUGAR!" directamente en la historia
    this.storyModal.onSkipToPlay = () => {
      const activeStory = (this.storyModal as any).currentStory;
      const gameId = activeStory?.gameId || "";
      if (gameId) {
        this.isTransitioning = true;
        this.audio.stopMenuBGM();
        this.launchGameWithCountdown(gameId);
      }
    };

    // Si desde el modal de instrucciones el usuario quiere volver a ver la historia
    this.instructionsModal.onWatchStory = (gameId: string) => {
      this.instructionsModal.hide();
      this.storyModal.show(gameId);
    };

    // 4. Cuando el usuario confirma "¡A JUGAR! ▶" en el modal de instrucciones
    this.instructionsModal.onStartGame = (gameId: string) => {
      this.isTransitioning = true;
      this.audio.stopMenuBGM();
      this.launchGameWithCountdown(gameId);
    };

    this.instructionsModal.onBack = () => {
      this.goToMenu();
    };

    // 5. Al pulsar el botón "Menú" en la barra superior
    this.header.onHomeClick = () => {
      this.goToMenu();
    };

    // 6. Al terminar una partida: "Jugar de nuevo", "Cambiar canción" o "Otros juegos"
    this.gameOverModal.onPlayAgain = () => {
      if (this.currentGame) {
        this.launchGameDirect(this.currentGame.id);
      } else {
        this.goToMenu();
      }
    };

    this.gameOverModal.onChangeSong = () => {
      const bellGame = this.games.get("bell-symphony") as BellSymphonyGame | undefined;
      if (bellGame) {
        if (this.currentGame && this.currentGame !== bellGame) {
          this.currentGame.destroy();
        }
        this.currentGame = bellGame;
        this.appState = "playing";
        this.isTransitioning = false;
        this.attractScreen.hide();
        this.gameMenu.hide();
        this.gameOverModal.hide();
        this.instructionsModal.hide();
        this.audio.stopMenuBGM();
        this.audio.setGameActive(true);
        this.resetInactivity();
        bellGame.goToSongSelect();
      } else {
        this.goToMenu();
      }
    };

    this.gameOverModal.onBackToMenu = () => {
      this.goToMenu();
    };

    // 7. Al pulsar "Seguir Editando / Grabar" en la pantalla de resultados
    this.gameOverModal.onEditAgain = (songFile?: string, customNotes?: any[]) => {
      const bellGame = this.games.get("bell-symphony") as BellSymphonyGame | undefined;
      if (bellGame) {
        if (this.currentGame && this.currentGame !== bellGame) {
          this.currentGame.destroy();
        }
        this.currentGame = bellGame;
        this.appState = "playing";
        this.isTransitioning = false;
        this.attractScreen.hide();
        this.gameMenu.hide();
        this.gameOverModal.hide();
        this.instructionsModal.hide();
        this.audio.stopMenuBGM();
        this.audio.setGameActive(true);
        this.resetInactivity();
        bellGame.start();
        bellGame.openChartEditor(songFile, customNotes);
      } else {
        this.goToMenu();
      }
    };
  }

  /**
   * Estela mágica táctil (Touch Magic Trail - Optimizado sin Reflow)
   */
  private setupTouchMagicTrail(): void {
    let lastX = 0;
    let lastY = 0;

    const emit = (clientX: number, clientY: number, count: number) => {
      const rect = this.cachedCanvasRect || this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      this.particles.emitTouchTrail(x, y, count);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        // Solo emitir si el puntero se movió al menos 10px para evitar saturar el loop
        if (dx * dx + dy * dy > 100) {
          lastX = e.clientX;
          lastY = e.clientY;
          emit(e.clientX, e.clientY, 1);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        emit(e.clientX, e.clientY, 3);
      },
      { passive: true }
    );
  }

  /**
   * Navega a la pantalla de selección de juegos con transición mágica
   */
  public goToMenu(withTransition: boolean = true): void {
    if (this.isTransitioning) return;
    this.audio.resumeMenuBGM();

    if (withTransition && this.appState !== "attract") {
      this.isTransitioning = true;
      const mainContainer = document.getElementById("kiosk-main") || document.body;
      const menuInfo = {
        title: "FERIA MÁGICA",
        icon: getIconSvg("tent", { size: 36, color: "#FFD700" }),
        themeColor: "#FFD700",
        subtitle: "¡ELIGE TU JUEGO MÁGICO!"
      };

      ScreenTransition.getInstance().runGiftUnwrapTransition(
        mainContainer,
        menuInfo,
        this.particles,
        () => {
          if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
          }
          this.input.reset();
          this.appState = "menu";
          this.attractScreen.hide();
          this.gameOverModal.hide();
          this.instructionsModal.hide();
          this.storyModal.hide();
          this.gameMenu.show();
          this.resetInactivity();
        },
        () => {
          this.isTransitioning = false;
        }
      );
    } else {
      if (this.currentGame) {
        this.currentGame.destroy();
        this.currentGame = null;
      }
      this.isTransitioning = false;
      this.input.reset();
      this.appState = "menu";
      this.attractScreen.hide();
      this.gameOverModal.hide();
      this.instructionsModal.hide();
      this.storyModal.hide();
      this.gameMenu.show();
      this.resetInactivity();
    }
  }

  private getGameTransitionInfo(gameId: string): { title: string; icon: string; themeColor: string } {
    const map: Record<string, { title: string; icon: string; themeColor: string }> = {
      "toy-catch": { title: "Atrapa-Regalos Mágico", icon: getIconSvg("gift", { size: 36, color: "#FF2A4D" }), themeColor: "#FF2A4D" },
      "bell-symphony": { title: "Sinfonía de Campanas", icon: getIconSvg("bell", { size: 36, color: "#00E5FF" }), themeColor: "#00E5FF" },
      "tree-melody": { title: "Tambores del Cascanueces", icon: getIconSvg("drum", { size: 36, color: "#FFB300" }), themeColor: "#FFB300" },
      "flying-elf": { title: "El Vuelo Mágico del Elfo", icon: getIconSvg("wing", { size: 36, color: "#D500F9" }), themeColor: "#D500F9" },
      "magic-pairs": { title: "Parejas de Juguetes", icon: getIconSvg("cards", { size: 36, color: "#D500F9" }), themeColor: "#D500F9" },
      "santa-hills": { title: "El Descenso de Santa", icon: getIconSvg("gift", { size: 36, color: "#FF2A4D" }), themeColor: "#FF2A4D" },
      "snowball-target": { title: "Tiro al Blanco Navideño", icon: getIconSvg("target", { size: 36, color: "#00E676" }), themeColor: "#00E676" },
      "workshop-chaos": { title: "¡El Caos del Taller Mágico!", icon: getIconSvg("sparkles", { size: 36, color: "#FF9100" }), themeColor: "#FF9100" },
      "magic-jump": { title: "¡Salto Mágico Navideño!", icon: getIconSvg("sparkles", { size: 36, color: "#00E5FF" }), themeColor: "#00E5FF" },
      "elf-whack": { title: "¡Golpea al Duende!", icon: getIconSvg("target", { size: 36, color: "#FF1744" }), themeColor: "#FF1744" },
      "gift-slash": { title: "¡Corta-Regalos Navideño!", icon: getIconSvg("sparkles", { size: 36, color: "#00E676" }), themeColor: "#00E676" },
      "sleigh-toss": { title: "¡Lanza-Regalos al Trineo!", icon: getIconSvg("gift", { size: 36, color: "#FFD700" }), themeColor: "#FFD700" },
      "christmas-snake": { title: "¡Serpiente de Luces!", icon: getIconSvg("sparkles", { size: 36, color: "#FFD700" }), themeColor: "#FFD700" },
      "polar-express": { title: "¡El Expreso Polar Mágico!", icon: getIconSvg("sparkles", { size: 36, color: "#00E5FF" }), themeColor: "#00E5FF" }
    };
    return map[gameId] || { title: "Minijuego Mágico", icon: getIconSvg("tree", { size: 36, color: "#FFD700" }), themeColor: "#FFD700" };
  }

  /**
   * Inicia el minijuego con la cuenta regresiva cinemática 3-2-1
   */
  public launchGameWithCountdown(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) {
      this.isTransitioning = false;
      return;
    }

    if (this.currentGame && this.currentGame !== game) {
      this.currentGame.destroy();
    }

    this.audio.pauseMenuBGM();
    this.currentGame = game;
    this.appState = "playing";

    this.attractScreen.hide();
    this.gameMenu.hide();
    this.gameOverModal.hide();
    this.instructionsModal.hide();

    this.input.reset();
    this.resetInactivity();

    const mainContainer = document.getElementById("kiosk-main") || document.body;

    // Si el juego tiene pantalla de selección previa (Sinfonía de Campanas o El Vuelo del Elfo),
    // ingresar directamente a su pantalla de selección sin conteo previo.
    // La única cuenta regresiva se ejecutará tras presionar "Jugar" / "Volar".
    if (gameId === "bell-symphony" || gameId === "flying-elf") {
      this.currentGame.start(KIOSK_CONFIG.defaultGameDurationSeconds);
      this.isTransitioning = false;
    } else {
      // Ejecutar cuenta regresiva arcade 3-2-1 al presionar Jugar
      ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
        if (this.appState !== "playing" || this.currentGame !== game) {
          this.isTransitioning = false;
          return;
        }
        this.currentGame?.start(KIOSK_CONFIG.defaultGameDurationSeconds);
        this.isTransitioning = false;
      });
    }
  }

  /**
   * Inicio directo con transición mágica (para revancha desde el modal de resultados)
   */
  public launchGameDirect(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    if (this.currentGame && this.currentGame !== game) {
      this.currentGame.destroy();
    }

    this.audio.pauseMenuBGM();
    const mainContainer = document.getElementById("kiosk-main") || document.body;
    const gameInfo = this.getGameTransitionInfo(gameId);

    ScreenTransition.getInstance().runGiftUnwrapTransition(
      mainContainer,
      gameInfo,
      this.particles,
      () => {
        this.currentGame = game;
        this.appState = "playing";

        this.attractScreen.hide();
        this.gameMenu.hide();
        this.gameOverModal.hide();

        this.input.reset();
        this.resetInactivity();
      },
      () => {
        if (this.appState !== "playing" || this.currentGame !== game) {
          return;
        }
        if (game instanceof BellSymphonyGame) {
          game.replayLastSong();
        } else if (game instanceof FlyingElfGame) {
          game.replayWithCountdown();
        } else {
          ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
            if (this.appState !== "playing" || this.currentGame !== game) {
              return;
            }
            game.start(KIOSK_CONFIG.defaultGameDurationSeconds);
          });
        }
      }
    );
  }

  /**
   * Maneja el fin de partida
   */
  private handleGameOver(result: GameResult): void {
    this.appState = "gameover";
    this.audio.resumeMenuBGM();
    this.audio.playVictory();
    this.gameOverModal.show(result);
    this.resetInactivity();
  }

  /**
   * Regresa a la pantalla de atracción (Salvapantallas)
   */
  public goToAttractScreen(): void {
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
    this.audio.resumeMenuBGM();
    this.isTransitioning = false;
    this.appState = "attract";
    this.gameMenu.hide();
    this.gameOverModal.hide();
    this.instructionsModal.hide();
    this.storyModal.hide();
    this.attractScreen.show();
  }

  /**
   * Detector de inactividad para reiniciar el tótem automáticamente en menús/salvapantallas
   */
  private setupInactivityWatcher(): void {
    const resetTimer = () => {
      this.lastUserInteractionTime = Date.now();
    };

    window.addEventListener("pointerdown", resetTimer, { passive: true });
    window.addEventListener("pointermove", resetTimer, { passive: true });
    window.addEventListener("pointerup", resetTimer, { passive: true });
    window.addEventListener("touchstart", resetTimer, { passive: true });
    window.addEventListener("touchmove", resetTimer, { passive: true });
    window.addEventListener("touchend", resetTimer, { passive: true });
    window.addEventListener("keydown", resetTimer, { passive: true });

    window.setInterval(() => {
      // Si el usuario está jugando activamente una partida, el juego gestiona su propio tiempo
      if (this.appState === "playing") {
        return;
      }

      const elapsedSeconds = (Date.now() - this.lastUserInteractionTime) / 1000;
      if (elapsedSeconds >= KIOSK_CONFIG.inactivityTimeoutSeconds) {
        if (this.appState !== "attract" && !this.isTransitioning) {
          console.log("⏱️ Tiempo de inactividad superado. Regresando a pantalla de bienvenida...");
          this.goToAttractScreen();
        }
      }
    }, 2000);
  }

  private resetInactivity(): void {
    this.lastUserInteractionTime = Date.now();
  }

  /**
   * Bucle principal de animación a 60 FPS (o tasa de refresco del hardware)
   */
  private startMainLoop(): void {
    const loop = (currentTime: number) => {
      if (this.isPageHidden) {
        this.lastFrameTime = currentTime;
        requestAnimationFrame(loop);
        return;
      }

      // Delta time acotado para evitar saltos bruscos tras microbloqueos o cambios de pestaña
      const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 1 / 30);
      this.lastFrameTime = currentTime;

      // Actualizar y dibujar el juego si está activo
      if (this.appState === "playing" && this.currentGame) {
        this.currentGame.update(dt);
        this.currentGame.draw();
      } else {
        // Dibujar partículas de nieve ambiente y chispas táctiles de fondo con HiDPI
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
          const dpr = this.logicalWidth > 0 ? this.canvas.width / this.logicalWidth : 1;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
          this.particles.update(this.logicalWidth, this.logicalHeight);
          this.particles.draw(ctx, true);
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
window.addEventListener("DOMContentLoaded", () => {
  new KioskApp();
});
