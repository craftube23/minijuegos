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

// Componentes de Interfaz
import { KioskHeader } from "./components/KioskHeader";
import { GameBannerCarousel } from "./components/GameBannerCarousel";
import { AttractScreen } from "./components/AttractScreen";
import { GameMenu } from "./components/GameMenu";
import { GameOverModal } from "./components/GameOverModal";

// Los 4 Minijuegos Navideños
import { ToyCatchGame } from "./games/ToyCatchGame";
import { ChimneyDropGame } from "./games/ChimneyDropGame";
import { TreeMelodyGame } from "./games/TreeMelodyGame";
import { MagicPairsGame } from "./games/MagicPairsGame";

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

  constructor() {
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

    // 4. Instanciar los 4 Minijuegos
    this.registerGames();

    // 5. Adaptar resolución nativa al tamaño del contenedor
    this.handleResize();
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

    console.log("[Feria Mágica del Juguete] Kiosco Interactivo Listo");
  }

  private cachedCanvasRect: DOMRect | null = null;

  /**
   * Ajusta el Canvas y los juegos a la resolución exacta del dispositivo
   */
  public handleResize(): void {
    const container = this.canvas.parentElement;
    const width = container && container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
    const height = container && container.clientHeight > 0 ? container.clientHeight : (window.innerHeight - 130);

    if (width > 0 && height > 0) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.cachedCanvasRect = this.canvas.getBoundingClientRect();
      this.input.updateBounds();

      this.particles.initSnow(width, height);

      this.games.forEach((game) => {
        game.resize(width, height);
      });
    }
  }

  /**
   * Registra los 4 juegos en el gestor
   */
  private registerGames(): void {
    const game1 = new ToyCatchGame(this.canvas, this.input, this.audio, this.particles);
    const game2 = new ChimneyDropGame(this.canvas, this.input, this.audio, this.particles);
    const game3 = new TreeMelodyGame(this.canvas, this.input, this.audio, this.particles);
    const game4 = new MagicPairsGame(this.canvas, this.input, this.audio, this.particles);

    // Conectar callback de Game Over de cada juego
    [game1, game2, game3, game4].forEach((g) => {
      g.onGameOver = (result: GameResult) => this.handleGameOver(result);
      this.games.set(g.id, g);
    });
  }

  /**
   * Conecta los botones y transiciones entre pantallas
   */
  private setupNavigationCallbacks(): void {
    // 1. Al presionar "Toca para Jugar" en el Salvapantallas → Ir al Menú
    this.attractScreen.onStartClick = () => {
      this.audio.unlockAudio();
      this.audio.playTap();
      this.goToMenu();
    };

    // 2. Al seleccionar un juego en el Menú → Transición Cinemática de Despegue y Cuenta Regresiva
    this.gameMenu.onSelectGame = (gameId: string, cardElement: HTMLElement) => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const allCards = document.querySelectorAll<HTMLElement>(".game-card-fantasy");
      ScreenTransition.getInstance().playCardLaunch(cardElement, allCards, () => {
        this.launchGameWithCountdown(gameId);
      });
    };

    // 3. Al pulsar el botón "Menú" en la barra superior
    this.header.onHomeClick = () => {
      this.goToMenu();
    };

    // 4. Al terminar una partida: "Jugar de nuevo" o "Otros juegos"
    this.gameOverModal.onPlayAgain = () => {
      if (this.currentGame) {
        this.launchGameDirect(this.currentGame.id);
      } else {
        this.goToMenu();
      }
    };

    this.gameOverModal.onBackToMenu = () => {
      this.goToMenu();
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
   * Navega a la pantalla de selección de juegos
   */
  public goToMenu(): void {
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
    this.isTransitioning = false;
    this.input.reset();
    this.appState = "menu";
    this.attractScreen.hide();
    this.gameOverModal.hide();
    this.gameMenu.show();
    this.resetInactivity();
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

    this.currentGame = game;
    this.appState = "playing";

    this.attractScreen.hide();
    this.gameMenu.hide();
    this.gameOverModal.hide();

    this.input.reset();
    this.resetInactivity();

    const mainContainer = document.getElementById("kiosk-main") || document.body;

    // Ejecutar cuenta regresiva antes de activar el tiempo del juego
    ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
      this.currentGame?.start(KIOSK_CONFIG.defaultGameDurationSeconds);
      this.isTransitioning = false;
    });
  }

  /**
   * Inicio directo (para revancha desde el modal de resultados)
   */
  public launchGameDirect(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    this.currentGame = game;
    this.appState = "playing";

    this.attractScreen.hide();
    this.gameMenu.hide();
    this.gameOverModal.hide();

    this.input.reset();
    this.resetInactivity();

    const mainContainer = document.getElementById("kiosk-main") || document.body;
    ScreenTransition.getInstance().runCountdown(mainContainer, this.particles, () => {
      this.currentGame?.start(KIOSK_CONFIG.defaultGameDurationSeconds);
    });
  }

  /**
   * Maneja el fin de partida
   */
  private handleGameOver(result: GameResult): void {
    this.appState = "gameover";
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
    this.isTransitioning = false;
    this.appState = "attract";
    this.gameMenu.hide();
    this.gameOverModal.hide();
    this.attractScreen.show();
  }

  /**
   * Detector de inactividad para reiniciar el tótem automáticamente
   */
  private setupInactivityWatcher(): void {
    const resetTimer = () => {
      this.lastUserInteractionTime = Date.now();
    };

    window.addEventListener("pointerdown", resetTimer, { passive: true });
    window.addEventListener("keydown", resetTimer, { passive: true });

    window.setInterval(() => {
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
      const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = currentTime;

      // Actualizar y dibujar el juego si está activo
      if (this.appState === "playing" && this.currentGame) {
        this.currentGame.update(dt);
        this.currentGame.draw();
      } else {
        // Dibujar partículas de nieve ambiente y chispas táctiles de fondo
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.particles.update(this.canvas.width, this.canvas.height);
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
