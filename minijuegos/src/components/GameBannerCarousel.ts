/**
 * ==============================================================================
 * COMPONENTE: CARRUSEL PUBLICITARIO INFERIOR (Banners de la Feria)
 * ==============================================================================
 * 
 * Cumple con el boceto del proyecto:
 * - Ocupa la franja inferior de la pantalla sin tapar el juego.
 * - Cambia automáticamente cada X segundos (configurable en `src/config/banners.ts`).
 * - Permite agregar nuevos anuncios simplemente editando la lista de imágenes.
 */

import { BANNER_CONFIG, type BannerSlide } from "../config/banners";

export class GameBannerCarousel {
  private container: HTMLElement;
  private currentSlideIndex: number = 0;
  private timer: number | null = null;
  private slides: BannerSlide[] = BANNER_CONFIG.slides;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor de banners: #${containerId}`);
    this.container = el;
    this.render();
    this.startAutoRotation();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="carousel-track" id="carousel-track">
        ${this.slides
          .map(
            (slide, idx) => `
          <div class="carousel-slide ${idx === 0 ? "active" : ""}" data-index="${idx}">
            <img src="${slide.image}" alt="${slide.title}" class="carousel-img" />
          </div>
        `
          )
          .join("")}
      </div>
      <div class="carousel-indicators">
        ${this.slides
          .map(
            (_, idx) => `
          <div class="carousel-dot ${idx === 0 ? "active" : ""}" data-dot="${idx}"></div>
        `
          )
          .join("")}
      </div>
    `;
  }

  /**
   * Inicia la rotación automática de diapositivas
   */
  public startAutoRotation(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.nextSlide();
    }, BANNER_CONFIG.rotationIntervalMs);
  }

  public stopAutoRotation(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
    this.updateActiveSlide();
  }

  public goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.updateActiveSlide();
  }

  private updateActiveSlide(): void {
    const slideElements = this.container.querySelectorAll(".carousel-slide");
    const dotElements = this.container.querySelectorAll(".carousel-dot");

    slideElements.forEach((el, idx) => {
      if (idx === this.currentSlideIndex) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    dotElements.forEach((dot, idx) => {
      if (idx === this.currentSlideIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  public destroy(): void {
    this.stopAutoRotation();
  }
}
