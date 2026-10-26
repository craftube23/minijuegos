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
import gsap from "gsap";
import { BANNER_CONFIG, type BannerSlide } from "../config/banners";
import { renderBannerIcon } from "../utils/bannerIcons";

export class GameBannerCarousel {
  private container: HTMLElement;
  private swiper: Swiper | null = null;
  private activeTimeline: gsap.core.Timeline | null = null;
  private animatedTargets: Element[] = [];
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
      this.activeTimeline?.pause();
    } else {
      this.swiper?.autoplay?.start();
      this.activeTimeline?.resume();
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
   * Genera el marcado de cada slide respetando archivos y proporciones oficiales
   */
  private renderSlide(slide: BannerSlide, idx: number): string {
    const bgStyle = slide.bgImage
      ? `background: url('${slide.bgImage}') center center / 100% 100% no-repeat, ${slide.bgGradient};`
      : `background: ${slide.bgGradient};`;

    const kickerIconSvg = renderBannerIcon(slide.kickerIcon, 13, "kicker-svg");
    const titleIconSvg = renderBannerIcon(slide.titleIcon, 16, "title-svg");
    const subtitleIconSvg = renderBannerIcon(slide.subtitleIcon, 14, "subtitle-svg");
    const badgeIconSvg = renderBannerIcon(slide.badgeIcon, 13, "badge-svg");
    const ctaIconSvg = renderBannerIcon(slide.ctaIcon, 12, "cta-svg");

    const highlightsHtml =
      slide.highlights && slide.highlights.length > 0
        ? `
        <div class="banner-highlights-row js-banner-highlights">
          ${slide.highlights
            .map(
              (h) => `
            <span class="banner-highlight-chip">
              ${h.icon ? renderBannerIcon(h.icon, 12, "highlight-svg") : ""}
              <span>${h.label}</span>
            </span>
          `
            )
            .join("")}
        </div>
        `
        : "";

    if (slide.type === "hero-billboard") {
      const logo = slide.logos[0] || {
        src: "",
        alt: "",
        name: "",
        fitMode: "standard" as const
      };
      const fitClass = `fit-${logo.fitMode || "standard"}`;

      return `
        <div class="swiper-slide banner-slide banner-slide-hero ${slide.themeClass || ""}" data-index="${idx}" data-slide-id="${slide.id}" style="${bgStyle}">
          <div class="banner-hero-container">
            <div class="banner-logo-card ${fitClass} js-banner-card" title="${logo.name}">
              <div class="plaque-inner-shine"></div>
              <div class="plaque-glint-sweep js-plaque-shine"></div>
              <img
                src="${logo.src}"
                alt="${logo.alt}"
                class="banner-logo-img ${fitClass}"
                loading="eager"
                decoding="async"
                draggable="false"
              />
            </div>

            <div class="banner-text-content">
              ${
                slide.kickerText
                  ? `
              <div class="banner-kicker js-banner-kicker">
                <span class="kicker-pill" style="border-color: ${slide.accentColor}; color: ${slide.accentColor};">
                  ${kickerIconSvg}
                  <span class="kicker-label">${slide.kickerText}</span>
                </span>
              </div>
              `
                  : ""
              }
              <div class="banner-headline js-banner-title">
                ${titleIconSvg}
                <span>${slide.title}</span>
              </div>
              <div class="banner-subline js-banner-subtitle">
                ${subtitleIconSvg}
                <span>${slide.subtitle}</span>
              </div>
              ${highlightsHtml}
            </div>

            ${
              slide.badgeText
                ? `
            <div class="banner-badge-wrapper">
              <div class="banner-sponsor-event-cobrand js-banner-badge">
                <span class="banner-badge-pill" style="border-color: ${slide.accentColor};">
                  ${badgeIconSvg}
                  <span>${slide.badgeText}</span>
                </span>
                ${
                  slide.ctaText
                    ? `<span class="event-social-tag">${ctaIconSvg}<span>${slide.ctaText}</span></span>`
                    : ""
                }
              </div>
            </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    }

    // CARTEL INSTITUCIONAL DEL EVENTO (FERIA MÁGICA DEL JUGUETE)
    const eventLogo = slide.logos[0] || {
      src: "./assets/logos/Feria-magica-del-jugete-sin-fondo.webp",
      alt: "Feria Mágica del Juguete",
      name: "FERIA MÁGICA DEL JUGUETE",
      fitMode: "standard" as const
    };

    return `
      <div class="swiper-slide banner-slide banner-slide-event ${slide.themeClass || ""}" data-index="${idx}" data-slide-id="${slide.id}" style="${bgStyle}">
        <div class="banner-event-container">
          <div class="event-logo-emblem js-banner-card">
            <img
              src="${eventLogo.src}"
              alt="${eventLogo.alt}"
              class="event-logo-img"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </div>

          <div class="banner-text-content">
            ${
              slide.kickerText
                ? `
            <div class="banner-kicker js-banner-kicker">
              <span class="kicker-pill event-kicker-pill">
                ${kickerIconSvg}
                <span class="kicker-label">${slide.kickerText}</span>
              </span>
            </div>
            `
                : ""
            }
            <div class="banner-headline event-headline js-banner-title">
              ${titleIconSvg}
              <span>${slide.title}</span>
            </div>
            <div class="banner-subline event-subline js-banner-subtitle">
              ${subtitleIconSvg}
              <span>${slide.subtitle}</span>
            </div>
            ${highlightsHtml}
          </div>

          <div class="banner-badge-wrapper">
            <div class="banner-sponsor-event-cobrand js-banner-badge">
              <span class="banner-badge-pill event-badge-crimson">
                ${badgeIconSvg}
                <span>${slide.badgeText || "ACCESO LIBRE"}</span>
              </span>
              ${
                slide.ctaText
                  ? `<span class="event-social-tag">${ctaIconSvg}<span>${slide.ctaText}</span></span>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Inicializa Swiper 14 con navegación táctil horizontal y paginación
   */
  private initSwiper(): void {
    this.killActiveAnimation();
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
        : false,
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
   * Limpia de forma segura cualquier animación GSAP en curso para evitar fugas
   */
  private killActiveAnimation(): void {
    if (this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
    }
    if (this.animatedTargets.length > 0) {
      gsap.killTweensOf(this.animatedTargets);
      this.animatedTargets = [];
    }
  }

  /**
   * Anima únicamente los elementos hijos del slide activo sin tocar las propiedades de Swiper
   */
  private animateSlide(slideEl: HTMLElement): void {
    this.killActiveAnimation();

    const kicker = slideEl.querySelector(".js-banner-kicker");
    const card = slideEl.querySelector(".js-banner-card");
    const title = slideEl.querySelector(".js-banner-title");
    const subtitle = slideEl.querySelector(".js-banner-subtitle");
    const highlights = slideEl.querySelector(".js-banner-highlights");
    const badge = slideEl.querySelector(".js-banner-badge");
    const shine = slideEl.querySelector(".js-plaque-shine");

    const targets = [kicker, card, title, subtitle, highlights, badge, shine].filter(
      (el): el is Element => el !== null
    );
    this.animatedTargets = targets;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set([kicker, card, title, subtitle, highlights, badge].filter(Boolean), {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        clearProps: "transform"
      });
      return;
    }

    this.activeTimeline = gsap.timeline({
      defaults: { ease: "power2.out", overwrite: "auto" }
    });

    if (card) {
      this.activeTimeline.fromTo(
        card,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.38, ease: "back.out(1.3)" }
      );
    }

    if (shine) {
      this.activeTimeline
        .fromTo(
          shine,
          { xPercent: -140, opacity: 0 },
          { xPercent: 120, opacity: 0.75, duration: 0.3, ease: "power1.in" },
          "-=0.25"
        )
        .to(shine, { xPercent: 340, opacity: 0, duration: 0.32, ease: "power1.out" });
    }

    if (kicker) {
      this.activeTimeline.fromTo(
        kicker,
        { y: -6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28 },
        "-=0.3"
      );
    }

    if (title) {
      this.activeTimeline.fromTo(
        title,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.34 },
        "-=0.32"
      );
    }

    if (subtitle) {
      this.activeTimeline.fromTo(
        subtitle,
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.32 },
        "-=0.26"
      );
    }

    if (highlights) {
      this.activeTimeline.fromTo(
        highlights,
        { y: 5, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3 },
        "-=0.22"
      );
    }

    if (badge) {
      this.activeTimeline.fromTo(
        badge,
        { scale: 0.88, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.35)" },
        "-=0.2"
      );
    }
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
    this.killActiveAnimation();
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }
}

