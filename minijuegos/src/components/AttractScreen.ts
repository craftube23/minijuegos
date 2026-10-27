/**
 * ==============================================================================
 * COMPONENTE: PANTALLA DE ATRACCIÓN / SALVAPANTALLAS (AttractScreen)
 * ==============================================================================
 * 
 * Se muestra cuando nadie está jugando para llamar la atención del público
 * que pasa frente al tótem con animaciones brillantes y un gran botón interactivo.
 */

import gsap from "gsap";
import { BRANDING } from "../config/branding";
import { KIOSK_CONFIG } from "../config/kiosk";
import { getIconSvg } from "../utils/icons";

export class AttractScreen {
  private container: HTMLElement;
  public onStartClick?: () => void;
  private entranceTl: gsap.core.Timeline | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor: #${containerId}`);
    this.container = el;
    this.render();
    this.setupEvents();
    this.playEntranceAnimation();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="attract-wrapper">
        <div class="attract-logo-box">
          <img src="${BRANDING.getLogoPath(1)}" alt="${BRANDING.fairName}" class="attract-logo pulse-anim" />
        </div>

        <h1 class="attract-title">${KIOSK_CONFIG.texts.attractTitle}</h1>
        <p class="attract-subtitle">Toca la pantalla para comenzar a jugar</p>

        <div class="attract-button-wrapper">
          <button id="btn-attract-start" class="btn-play-big">
            <span class="btn-icon">${getIconSvg("play", { size: 32, fill: "#ffffff", color: "#ffffff" })}</span>
            <span class="btn-text">¡TOCA PARA JUGAR!</span>
            <span class="btn-sparkle">${getIconSvg("sparkles", { size: 28, color: "var(--color-gold)" })}</span>
          </button>
        </div>

        <div class="attract-games-preview">
          <div class="preview-badge">${getIconSvg("gift", { size: 18, color: "var(--color-gold)" })} 15 Minijuegos Mágicos</div>
          <div class="preview-badge">${getIconSvg("trophy", { size: 18, color: "var(--color-gold)" })} Guarda tus Récords</div>
          <div class="preview-badge">${getIconSvg("sparkles", { size: 18, color: "var(--color-gold)" })} Gana Premios de la Feria</div>
        </div>
      </div>
    `;
  }

  private setupEvents(): void {
    const btn = this.container.querySelector<HTMLElement>("#btn-attract-start");
    const btnWrapper = this.container.querySelector<HTMLElement>(".attract-button-wrapper");

    if (btn && btnWrapper) {
      btn.addEventListener("pointerdown", () => {
        gsap.to(btnWrapper, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      const restoreButton = () => {
        gsap.to(btnWrapper, {
          scale: 1,
          duration: 0.18,
          ease: "back.out(1.6)",
          clearProps: "transform",
          overwrite: "auto"
        });
      };

      btn.addEventListener("pointerup", restoreButton);
      btn.addEventListener("pointerleave", restoreButton);
      btn.addEventListener("pointercancel", restoreButton);
    }

    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onStartClick) this.onStartClick();
    });

    // También responde si toca el fondo de la pantalla de atracción
    this.container.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id !== "btn-attract-start" && !(e.target as HTMLElement).closest("#btn-attract-start")) {
        e.preventDefault();
        e.stopPropagation();
        if (this.onStartClick) this.onStartClick();
      }
    });
  }

  private playEntranceAnimation(): void {
    this.killAnimations();

    const logoBox = this.container.querySelector<HTMLElement>(".attract-logo-box");
    const title = this.container.querySelector<HTMLElement>(".attract-title");
    const subtitle = this.container.querySelector<HTMLElement>(".attract-subtitle");
    const btnWrapper = this.container.querySelector<HTMLElement>(".attract-button-wrapper");
    const badges = Array.from(this.container.querySelectorAll<HTMLElement>(".preview-badge"));

    const allTargets = [logoBox, title, subtitle, btnWrapper, ...badges].filter(
      (el): el is HTMLElement => el !== null
    );
    if (allTargets.length === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(allTargets, { autoAlpha: 1, clearProps: "transform" });
      return;
    }

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" }
    });
    this.entranceTl = tl;

    if (logoBox) {
      tl.fromTo(
        logoBox,
        { autoAlpha: 0, y: -18, scale: 0.92 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.35)", clearProps: "transform" }
      );
    }

    if (title) {
      tl.fromTo(
        title,
        { autoAlpha: 0, y: 14, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out", clearProps: "transform" },
        "-=0.28"
      );
    }

    if (subtitle) {
      tl.fromTo(
        subtitle,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.34, ease: "power2.out", clearProps: "transform" },
        "-=0.25"
      );
    }

    if (btnWrapper) {
      tl.fromTo(
        btnWrapper,
        { autoAlpha: 0, y: 14, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.5)", clearProps: "transform" },
        "-=0.22"
      );
    }

    if (badges.length > 0) {
      tl.fromTo(
        badges,
        { autoAlpha: 0, y: 12, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.32,
          stagger: 0.06,
          ease: "power2.out",
          clearProps: "transform"
        },
        "-=0.2"
      );
    }
  }

  public killAnimations(): void {
    if (this.entranceTl) {
      this.entranceTl.kill();
      this.entranceTl = null;
    }

    const targets = this.container.querySelectorAll<HTMLElement>(
      ".attract-logo-box, .attract-title, .attract-subtitle, .attract-button-wrapper, .preview-badge"
    );
    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
  }

  public show(): void {
    this.container.style.display = "flex";
    this.playEntranceAnimation();
  }

  public hide(): void {
    this.killAnimations();
    this.container.style.display = "none";
  }
}
