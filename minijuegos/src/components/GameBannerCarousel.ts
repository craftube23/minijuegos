/**
 * ==============================================================================
 * COMPONENTE: CARRUSEL PUBLICITARIO INFERIOR (PATROCINADORES Y FERIA)
 * ==============================================================================
 * 
 * Cumple con los requerimientos de diseño publicitario profesional para el Tótem:
 * - Soporte para vitrina general de los 8 patrocinadores oficiales (tal como el afiche).
 * - Banners dobles e individuales de alto impacto con cápsulas de contraste blanco/marfil.
 * - Tipografía festiva y nítida visible desde varios metros de distancia.
 * - Rotación automática fluida sin bloquear el juego ni causar caídas de frames.
 */

import { BANNER_CONFIG, type BannerSlide } from "../config/banners";
import { getIconSvg } from "../utils/icons";

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
          .map((slide, idx) => this.renderSlide(slide, idx))
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

  private renderSlide(slide: BannerSlide, idx: number): string {
    const isActive = idx === 0 ? "active" : "";

    // 1. MODO SHOWCASE GENERAL (La vitrina completa de gala de los 8 patrocinadores)
    if (slide.type === "showcase") {
      return `
        <div class="carousel-slide carousel-slide-showcase ${isActive}" data-index="${idx}" style="background: ${slide.bgGradient};">
          <div class="banner-showcase-panel">
            <div class="showcase-header-badge">
              <span class="showcase-sparkle">★</span>
              <span class="showcase-title">${slide.title}</span>
              <span class="showcase-sparkle">★</span>
            </div>
            <div class="showcase-logos-row">
              ${(slide.logos || [])
                .map(
                  (logo) => `
                <div class="showcase-logo-item" title="${logo.name}">
                  <img src="${logo.src}" alt="${logo.alt}" style="max-height: ${logo.maxHeight || "34px"};" />
                </div>
              `
                )
                .join("")}
            </div>
            <div class="showcase-social-tag">
              <span class="social-icon">📱</span>
              <span class="social-handle">@FeriaMagicaJuguete</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. MODO SPOTLIGHT / EVENTO (Destacado de marcas con logos en cápsula blanca)
    return `
      <div class="carousel-slide ${isActive}" data-index="${idx}" style="background: ${slide.bgGradient};">
        <div class="banner-flex-card">
          <div class="banner-logos-capsule">
            ${
              slide.logos && slide.logos.length > 0
                ? slide.logos
                    .map(
                      (logo) => `
                  <div class="banner-logo-wrapper" title="${logo.name}">
                    <img src="${logo.src}" alt="${logo.alt}" style="max-height: ${logo.maxHeight || "42px"};" />
                  </div>
                `
                    )
                    .join("")
                : slide.image
                ? `<div class="banner-logo-wrapper"><img src="${slide.image}" alt="${slide.title}" style="max-height: 40px;" /></div>`
                : `<div class="banner-icon-badge">${getIconSvg(slide.iconName || "sparkles", { size: 30, color: "#ffffff", fill: "rgba(255,255,255,0.3)" })}</div>`
            }
          </div>

          <div class="banner-text-group">
            <div class="banner-headline">${slide.title}</div>
            <div class="banner-subline">${slide.subtitle}</div>
          </div>

          <div class="banner-tag-container">
            <span class="banner-tag" style="border-color: ${slide.badgeColor}; color: #331A00;">
              ${slide.badgeText}
            </span>
          </div>
        </div>
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
