/**
 * ==============================================================================
 * COMPONENTE: CARRUSEL PUBLICITARIO INFERIOR (PATROCINADORES Y FERIA)
 * ==============================================================================
 * 
 * Diseño de alta visibilidad acorde con la interfaz nocturna navideña de la Feria:
 * - Marco Azul Noche Real + Oro Metálico 3D que armoniza con KioskHeader y GameMenu.
 * - Placas individuales Marfil-Oro (.sponsor-plaque-card) de gran tamaño para que
 *   ningún logo se pierda ni se mezcle con el fondo.
 * - Interactividad táctil para cambiar de cartel al tocar los puntos o el banner.
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
    this.setupEvents();
    this.startAutoRotation();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="carousel-gold-trim-top"></div>
      <div class="carousel-track" id="carousel-track">
        ${this.slides.map((slide, idx) => this.renderSlide(slide, idx)).join("")}
      </div>
      <div class="carousel-indicators">
        ${this.slides
          .map(
            (_, idx) => `
          <button type="button" class="carousel-dot ${idx === 0 ? "active" : ""}" data-dot="${idx}" aria-label="Banner ${idx + 1}"></button>
        `
          )
          .join("")}
      </div>
    `;
  }

  private renderSlide(slide: BannerSlide, idx: number): string {
    const isActive = idx === 0 ? "active" : "";

    // 1. MODO VITRINA DE 4 GRANDES PLACAS MARFIL-ORO (Máxima visibilidad de marca)
    if (slide.type === "showcase-grid") {
      return `
        <div class="carousel-slide carousel-slide-grid ${isActive}" data-index="${idx}" style="background: ${slide.bgGradient};">
          <div class="banner-grid-layout">
            <div class="banner-royal-seal">
              <div class="seal-stars">★ ★ ★</div>
              <div class="seal-main">${slide.ribbonTop || "PATROCINAN"}</div>
              <div class="seal-sub">${slide.ribbonSub || "Feria Mágica"}</div>
            </div>

            <div class="banner-plaques-row">
              ${slide.logos
                .map(
                  (logo) => `
                <div class="sponsor-plaque-card" title="${logo.name}">
                  <div class="plaque-inner-shine"></div>
                  <img src="${logo.src}" alt="${logo.alt}" class="plaque-logo-img" />
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      `;
    }

    // 2. MODO DUO SPOTLIGHT (2 Placas Gigantes + Mensaje Festivo + Insignia Dorada)
    if (slide.type === "duo-spotlight") {
      return `
        <div class="carousel-slide carousel-slide-duo ${isActive}" data-index="${idx}" style="background: ${slide.bgGradient};">
          <div class="banner-duo-layout">
            <div class="banner-duo-plaques">
              ${slide.logos
                .map(
                  (logo) => `
                <div class="sponsor-plaque-card plaque-duo-large" title="${logo.name}">
                  <div class="plaque-inner-shine"></div>
                  <img src="${logo.src}" alt="${logo.alt}" class="plaque-logo-img" />
                </div>
              `
                )
                .join("")}
            </div>

            <div class="banner-text-group">
              <div class="banner-headline">${slide.title || ""}</div>
              <div class="banner-subline">${slide.subtitle || ""}</div>
            </div>

            <div class="banner-tag-container">
              <span class="banner-tag">
                ${slide.badgeText || "★ OFICIAL"}
              </span>
            </div>
          </div>
        </div>
      `;
    }

    // 3. MODO CARTEL OFICIAL DEL EVENTO (Fechas, Ubicación y Redes como el Afiche)
    const mainLogo = slide.logos[0];
    return `
      <div class="carousel-slide carousel-slide-event ${isActive}" data-index="${idx}" style="background: ${slide.bgGradient};">
        <div class="banner-event-layout">
          <div class="event-logo-emblem">
            <img src="${mainLogo?.src || "./assets/logos/clean-feria-magica.png"}" alt="Feria Mágica del Juguete" />
          </div>

          <div class="event-info-pills">
            <div class="event-pill event-pill-date">
              <span class="event-pill-icon">📅</span>
              <span class="event-pill-text">${slide.title || "DEL 1 AL 24 DE DICIEMBRE"}</span>
            </div>
            <div class="event-pill event-pill-place">
              <span class="event-pill-icon">📍</span>
              <span class="event-pill-text">${slide.subtitle || "Centro Cultural del Oriente (Frente al Parque Centenario)"}</span>
            </div>
          </div>

          <div class="event-cta-box">
            <div class="banner-tag event-tag-crimson">${slide.badgeText || "¡NOS VEMOS EN LA FERIA!"}</div>
            <div class="event-social-handle">@FeriaMagicaJuguete</div>
          </div>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    // Permitir tocar cualquier punto indicador para ir a ese cartel
    const dots = this.container.querySelectorAll<HTMLElement>(".carousel-dot");
    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number(dot.getAttribute("data-dot") || "0");
        this.goToSlide(idx);
        this.startAutoRotation();
      });
    });

    // Permitir tocar el banner para avanzar manualmente al siguiente cartel
    this.container.addEventListener("click", () => {
      this.nextSlide();
      this.startAutoRotation();
    });
  }

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
