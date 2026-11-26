/**
 * ==============================================================================
 * COMPONENTE: CARRUSEL PUBLICITARIO INFERIOR CON SWIPER 14 + GSAP 3
 * ==============================================================================
 *
 * Arquitectura controlada para modo Kiosco y Web:
 * - Swiper 14 (`Autoplay`, `Pagination`): Gestiona exclusivamente el desplazamiento
 *   horizontal de `.swiper-wrapper`, el bucle continuo, los gestos táctiles (swipe)
 *   y los indicadores de paginación interactivos.
 * - GSAP 3: Anima exclusivamente los nodos hijos internos del slide activo
 *   (`.js-banner-card`, `.js-banner-title`, `.js-banner-subtitle`, `.js-banner-badge`,
 *   `.js-plaque-shine`), evitando cualquier conflicto de propiedades con Swiper.
 * - Gestión de ciclo de vida: Limpieza estricta de timelines, tweens y listeners
 *   DOM en cambios de slide, cambios de visibilidad de pestaña y `destroy()`.
 */

import Swiper from "swiper";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { BANNER_CONFIG, type BannerSlide } from "../config/banners";

export class GameBannerCarousel {
  private container: HTMLElement;
  private swiper: Swiper | null = null;
  private slides: BannerSlide[] = BANNER_CONFIG.slides;
  private listenersAttached: boolean = false;

  private readonly handleTouchStart = (): void => {
    if (this.swiper?.autoplay) {
      this.swiper.autoplay.stop();
    }
  };

  private readonly handleTouchEnd = (): void => {
    if (!document.hidden && this.swiper?.autoplay) {
      this.swiper.autoplay.start();
    }
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.swiper?.autoplay?.stop();
    } else {
      this.swiper?.autoplay?.start();
    }
  };

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor de banners: #${containerId}`);
    this.container = el;
    this.render();
    this.initSwiper();
    this.setupLifecycleListeners();
  }

  /**
   * Renderiza la estructura DOM compatible con Swiper 14
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="carousel-gold-trim-top"></div>
      <div class="swiper kiosk-swiper">
        <div class="swiper-wrapper">
          ${this.slides.map((slide, idx) => this.renderSlide(slide, idx)).join("")}
        </div>
        <div class="swiper-pagination kiosk-swiper-pagination" aria-label="Indicadores de patrocinadores"></div>
      </div>
    `;
  }

  /**
   * Cada slide es una imagen completa (arte, logo y texto ya integrados).
   */
  private renderSlide(slide: BannerSlide, idx: number): string {
    return `
      <div class="swiper-slide banner-slide-image" data-index="${idx}" data-slide-id="${slide.id}">
        <img src="./assets/banners/finales/${slide.id}.webp" alt="${slide.title}" decoding="async" draggable="false" />
      </div>
    `;
  }

  /**
   * Inicializa Swiper 14 con navegación táctil horizontal y paginación
   */
  private initSwiper(): void {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }

    const swiperEl = this.container.querySelector<HTMLElement>(".kiosk-swiper");
    const paginationEl = this.container.querySelector<HTMLElement>(".kiosk-swiper-pagination");
    if (!swiperEl) return;

    this.swiper = new Swiper(swiperEl, {
      modules: [Autoplay, Pagination],
      direction: "horizontal",
      slidesPerView: 1,
      spaceBetween: 0,
      loop: this.slides.length > 1,
      speed: 520,
      grabCursor: true,
      allowTouchMove: true,
      simulateTouch: true,
      touchRatio: 1,
      threshold: 6,
      resistanceRatio: 0.85,
      observer: true,
      observeParents: true,
      watchSlidesProgress: true,
      autoplay: {
        delay: BANNER_CONFIG.rotationIntervalMs,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true
          }
        : false
    });
  }

  /**
   * Registra listeners de ciclo de vida y seguridad táctil con referencias limpiables
   */
  private setupLifecycleListeners(): void {
    if (this.listenersAttached) return;
    this.container.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    this.container.addEventListener("touchend", this.handleTouchEnd, { passive: true });
    this.container.addEventListener("touchcancel", this.handleTouchEnd, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.listenersAttached = true;
  }

  private removeLifecycleListeners(): void {
    if (!this.listenersAttached) return;
    this.container.removeEventListener("touchstart", this.handleTouchStart);
    this.container.removeEventListener("touchend", this.handleTouchEnd);
    this.container.removeEventListener("touchcancel", this.handleTouchEnd);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.listenersAttached = false;
  }

  public nextSlide(): void {
    this.swiper?.slideNext();
  }

  public prevSlide(): void {
    this.swiper?.slidePrev();
  }

  /**
   * Pausa las animaciones y el autoplay cuando se está jugando una partida activa
   * para liberar CPU/GPU y asegurar cero tareas en segundo plano.
   */
  public pause(): void {
    if (this.swiper?.autoplay) {
      this.swiper.autoplay.stop();
    }
  }

  /**
   * Reanuda las animaciones y el autoplay al volver al menú principal
   */
  public resume(): void {
    if (!document.hidden && this.swiper?.autoplay) {
      this.swiper.autoplay.start();
    }
  }

  /**
   * Reinicializa el carrusel de forma segura liberando recursos previos
   */
  public reinit(): void {
    this.destroy();
    this.render();
    this.initSwiper();
    this.setupLifecycleListeners();
  }

  /**
   * Libera todas las instancias de Swiper, timelines GSAP y event listeners
   */
  public destroy(): void {
    this.removeLifecycleListeners();
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }
}

