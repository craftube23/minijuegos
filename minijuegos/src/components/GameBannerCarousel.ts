/**
 * ==============================================================================
 * COMPONENTE: CARRUSEL PUBLICITARIO INFERIOR CON SWIPER 14 + GSAP 3
 * ==============================================================================
 * 
 * Arquitectura publicitaria profesional:
 * - Swiper 14: Manejo nativo de slides, navegación cíclica, transiciones fade,
 *   autoplay continuo (~5.5s) y pausas seguras por toque / cursor.
 * - GSAP 3: Micro-animaciones escalonadas de entrada para logos oficiales, titulares,
 *   eslóganes e insignias comerciales, con limpieza de timelines para evitar fugas.
 * - Anti-truncamiento: Diseño responsivo para 360x740, 412x915, 844x390, 1080x1920 y desktop.
 */

import Swiper from "swiper";
import { Autoplay, EffectFade } from "swiper/modules";
import gsap from "gsap";
import { BANNER_CONFIG, type BannerSlide } from "../config/banners";

export class GameBannerCarousel {
  private container: HTMLElement;
  private swiper: Swiper | null = null;
  private activeTimeline: gsap.core.Timeline | null = null;
  private slides: BannerSlide[] = BANNER_CONFIG.slides;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor de banners: #${containerId}`);
    this.container = el;
    this.render();
    this.initSwiper();
    this.setupTouchSafety();
  }

  /**
   * Renderiza el esqueleto HTML compatible con Swiper
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="carousel-gold-trim-top"></div>
      <div class="swiper kiosk-swiper">
        <div class="swiper-wrapper">
          ${this.slides.map((slide, idx) => this.renderSlide(slide, idx)).join("")}
        </div>
      </div>
    `;
  }

  /**
   * Genera el marcado de cada slide según su tipo publicitario
   */
  private renderSlide(slide: BannerSlide, idx: number): string {
    // 1. HERO BILLBOARD (PATROCINADOR INDIVIDUAL DE GALA)
    if (slide.type === "hero-billboard") {
      const logo = slide.logos[0] || { src: "", alt: "", name: "" };
      return `
        <div class="swiper-slide banner-slide banner-slide-hero" data-index="${idx}" style="background: ${slide.bgGradient};">
          <div class="banner-hero-container">
            <div class="banner-logo-card" title="${logo.name}">
              <div class="plaque-inner-shine"></div>
              <img src="${logo.src}" alt="${logo.alt}" class="banner-logo-img" loading="eager" />
            </div>

            <div class="banner-text-content">
              <div class="banner-headline">${slide.title}</div>
              <div class="banner-subline">${slide.subtitle}</div>
            </div>

            ${
              slide.badgeText
                ? `
            <div class="banner-badge-wrapper">
              <span class="banner-badge-pill" style="border-color: ${slide.accentColor};">
                ${slide.badgeText}
              </span>
            </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    }

    // 2. DUO SPOTLIGHT (ALIANZA DE PRESTIGIO ENTRE DOS PATROCINADORES)
    if (slide.type === "duo-spotlight") {
      return `
        <div class="swiper-slide banner-slide banner-slide-duo" data-index="${idx}" style="background: ${slide.bgGradient};">
          <div class="banner-duo-container">
            <div class="banner-duo-logos">
              ${slide.logos
                .map(
                  (logo) => `
                <div class="banner-logo-card plaque-duo" title="${logo.name}">
                  <div class="plaque-inner-shine"></div>
                  <img src="${logo.src}" alt="${logo.alt}" class="banner-logo-img" loading="eager" />
                </div>
              `
                )
                .join("")}
            </div>

            <div class="banner-text-content">
              <div class="banner-headline">${slide.title}</div>
              <div class="banner-subline">${slide.subtitle}</div>
            </div>

            ${
              slide.badgeText
                ? `
            <div class="banner-badge-wrapper">
              <span class="banner-badge-pill" style="border-color: ${slide.accentColor};">
                ${slide.badgeText}
              </span>
            </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    }

    // 3. CARTEL OFICIAL DEL EVENTO (FERIA MÁGICA DEL JUGUETE)
    const eventLogo = slide.logos[0] || { src: "./assets/logos/clean-feria-magica.png", alt: "Feria Mágica", name: "Feria Mágica" };
    return `
      <div class="swiper-slide banner-slide banner-slide-event" data-index="${idx}" style="background: ${slide.bgGradient};">
        <div class="banner-event-container">
          <div class="event-logo-emblem">
            <img src="${eventLogo.src}" alt="${eventLogo.alt}" class="event-logo-img" loading="eager" />
          </div>

          <div class="event-info-block">
            <div class="event-pill event-pill-date">
              <span class="event-pill-icon">📅</span>
              <span class="event-pill-text">${slide.title}</span>
            </div>
            <div class="event-pill event-pill-place">
              <span class="event-pill-icon">📍</span>
              <span class="event-pill-text">${slide.subtitle}</span>
            </div>
          </div>

          <div class="event-cta-block">
            <span class="banner-badge-pill event-badge-crimson">
              ${slide.badgeText || "¡NOS VEMOS EN LA FERIA!"}
            </span>
            <span class="event-social-tag">@FeriaMagicaJuguete</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Inicializa la instancia de Swiper con módulo Autoplay y EffectFade
   */
  private initSwiper(): void {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }

    const swiperEl = this.container.querySelector<HTMLElement>(".kiosk-swiper");
    if (!swiperEl) return;

    this.swiper = new Swiper(swiperEl, {
      modules: [Autoplay, EffectFade],
      effect: "fade",
      fadeEffect: { crossFade: true },
      loop: true,
      speed: 600,
      autoplay: {
        delay: BANNER_CONFIG.rotationIntervalMs,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      allowTouchMove: true,
      on: {
        init: (sw) => {
          const activeSlide = sw.slides[sw.activeIndex] as HTMLElement | undefined;
          if (activeSlide) this.animateSlide(activeSlide);
        },
        slideChangeTransitionStart: (sw) => {
          const activeSlide = sw.slides[sw.activeIndex] as HTMLElement | undefined;
          if (activeSlide) this.animateSlide(activeSlide);
        }
      }
    });
  }

  /**
   * Anima los elementos internos del slide activo con GSAP de forma escalonada
   */
  private animateSlide(slideEl: HTMLElement): void {
    if (this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logoCards = slideEl.querySelectorAll(".banner-logo-card, .event-logo-emblem");
    const headline = slideEl.querySelector(".banner-headline, .event-pill-date");
    const subline = slideEl.querySelector(".banner-subline, .event-pill-place");
    const badge = slideEl.querySelector(".banner-badge-pill, .event-cta-block");

    if (prefersReducedMotion) {
      gsap.set([...logoCards, headline, subline, badge].filter(Boolean), {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        clearProps: "transform"
      });
      return;
    }

    this.activeTimeline = gsap.timeline({ defaults: { ease: "power2.out" } });

    if (logoCards.length > 0) {
      this.activeTimeline.fromTo(
        logoCards,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.48, ease: "back.out(1.35)", stagger: 0.08 }
      );
    }

    if (headline) {
      this.activeTimeline.fromTo(
        headline,
        { y: 9, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42 },
        "-=0.32"
      );
    }

    if (subline) {
      this.activeTimeline.fromTo(
        subline,
        { y: 7, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
        "-=0.28"
      );
    }

    if (badge) {
      this.activeTimeline.fromTo(
        badge,
        { scale: 0.84, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.4)" },
        "-=0.22"
      );
    }
  }

  /**
   * Garantiza que los toques en el banner no interfieran con los juegos
   * y que el autoplay pause para permitir la lectura y se reanude tras interactuar
   */
  private setupTouchSafety(): void {
    this.container.addEventListener(
      "touchstart",
      () => {
        if (this.swiper?.autoplay) {
          this.swiper.autoplay.stop();
        }
      },
      { passive: true }
    );

    this.container.addEventListener(
      "touchend",
      () => {
        if (this.swiper?.autoplay) {
          this.swiper.autoplay.start();
        }
      },
      { passive: true }
    );
  }

  public nextSlide(): void {
    this.swiper?.slideNext();
  }

  public prevSlide(): void {
    this.swiper?.slidePrev();
  }

  public destroy(): void {
    if (this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
    }
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }
}
