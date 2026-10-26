/**
 * ==============================================================================
 * COMPONENTE: PANTALLA DE RESULTADOS / FIN DE PARTIDA (GameOverModal)
 * ==============================================================================
 * 
 * Muestra el resumen de la partida con:
 * - Puntuación obtenida y combo/récord.
 * - Soporte avanzado para el Modo Grabador/Editor de Sinfonía de Campanas
 *   (Seguir editando, Rejugar partitura personalizada, Copiar código TypeScript).
 * - Botones grandes para jugar revancha o volver al menú.
 */

import gsap from "gsap";
import confetti from "canvas-confetti";
import type { GameResult } from "../core/BaseGame";
import { AudioManager } from "../core/AudioManager";
import { getIconSvg } from "../utils/icons";

export class GameOverModal {
  private container: HTMLElement;
  private audio: AudioManager;
  public onPlayAgain?: () => void;
  public onBackToMenu?: () => void;
  public onChangeSong?: () => void;

  private entranceTl: gsap.core.Timeline | null = null;
  private scoreTween: gsap.core.Tween | null = null;
  private toastTimerIds: number[] = [];
  private lastCelebratedSignature: string | null = null;
  private isConfettiActive: boolean = false;
  private celebrationCount: number = 0;

  constructor(containerId: string, audio: AudioManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el contenedor de resultados: #${containerId}`);
    this.container = el;
    this.audio = audio;
  }

  public show(result: GameResult): void {
    const wasVisible = this.container.style.display === "flex";
    this.killAnimations();

    const isRecord = result.isNewRecord;
    const isRhythmGame = result.gameId === "bell-symphony";
    const isCustom = !!result.isCustomChart;

    const modalTitle = isRecord
      ? "¡INCREÍBLE! ¡NUEVO RÉCORD!"
      : isCustom
      ? "¡PARTITURA COMPLETADA!"
      : "¡BUEN INTENTO!";

    const modalSubtitle = isRecord
      ? (isRhythmGame ? "¡Nuevo récord histórico en esta canción y dificultad!" : "¡Hiciste una partida legendaria en la Feria Mágica!")
      : isCustom
      ? "¡Has probado tu propia canción grabada con éxito!"
      : "¡Estuviste muy cerca! Vuelve a intentarlo para superar la puntuación.";

    const showRank = result.gameId !== "flying-elf" && (isRhythmGame || result.rank !== undefined);
    const rank = result.rank || (result.score >= Math.max(100, result.highScore) * 0.9 ? "S" : result.score >= Math.max(100, result.highScore) * 0.75 ? "A" : result.score >= Math.max(100, result.highScore) * 0.55 ? "B" : result.score >= Math.max(100, result.highScore) * 0.35 ? "C" : "D");
    const rankColor = result.rankColor || (rank === "S+" || rank === "S" ? "#FFD700" : rank === "A" ? "#00E5FF" : rank === "B" ? "#00E676" : rank === "C" ? "#FF9100" : "#FF5252");
    const rankLabel = result.rankLabel || (rank === "S+" ? "RANGO LEGENDARIO" : rank === "S" ? "RANGO EXCELENTE" : rank === "A" ? "RANGO GENIAL" : rank === "B" ? "RANGO BUENO" : rank === "C" ? "RANGO REGULAR" : "RANGO ASPIRANTE");

    const hasStats = result.perfectCount !== undefined || result.maxCombo !== undefined;

    this.container.innerHTML = `
      <div class="modal-card ${isRhythmGame ? "modal-card-rhythm" : ""}">
        <!-- ADORNOS DE ESQUINA TALLADOS ESTILO FANTASÍA 2D -->
        <div class="card-ornament ornament-tl"></div>
        <div class="card-ornament ornament-tr"></div>
        <div class="card-ornament ornament-bl"></div>
        <div class="card-ornament ornament-br"></div>

        <!-- MEDALLÓN HEROICO SUPERIOR DE LA FERIA MÁGICA -->
        <div class="modal-emblem-header">
          <div class="modal-emblem-aura"></div>
          <div class="modal-medallion-box">
            <img src="./assets/images/medallon-feria.webp" alt="Feria Mágica" class="modal-feria-seal" />
            ${isRecord ? `<div class="record-crown-badge">${getIconSvg("crown", { size: 22, color: "#FFD700", fill: "#FFD700" })}</div>` : ""}
          </div>
        </div>

        <!-- CINTA / LISTÓN FESTIVO DEL TÍTULO -->
        <div class="modal-ribbon-wrapper">
          <div class="ribbon-tail ribbon-tail-left"></div>
          <div class="ribbon-banner-body ${isRecord ? "ribbon-banner-record" : ""}">
            <h2 class="modal-title">${modalTitle}</h2>
          </div>
          <div class="ribbon-tail ribbon-tail-right"></div>
        </div>

        <p class="modal-game-name">${modalSubtitle}</p>

        ${isRhythmGame && result.songTitle ? `
          <div class="modal-song-pill">
            <span class="song-icon">${getIconSvg("music", { size: 16, color: "#FFD700" })}</span>
            <span class="song-name">${result.songTitle}</span>
            ${result.songArtist ? `<span class="song-by">• ${result.songArtist}</span>` : ""}
            ${result.difficultyLabel ? `<span class="song-difficulty-badge" style="background:${result.difficultyColor || '#FFD700'}; color:#031524;">${result.difficultyLabel}</span>` : ""}
          </div>
        ` : ""}

        ${showRank ? `
          <!-- MEDALLÓN 3D DE RANGO ARCADE ESTILO FANTASY GAME ART (S+, S, A, B, C, D) -->
          <div class="modal-rank-container">
            <div class="rank-medallion-badge rank-tier-${rank.toLowerCase().replace('+', 'plus')}" style="--rank-theme: ${rankColor};">
              <div class="rank-medallion-inner">
                <div class="rank-crest-frame">
                  <div class="rank-frost-crown">${getIconSvg("crown", { size: 16, color: "#FFD700", fill: "#FFD700" })}</div>
                  <div class="rank-letter-art">${rank}</div>
                  <div class="rank-crest-shine"></div>
                </div>
                <div class="rank-info-column">
                  <div class="rank-tier-ribbon">${rankLabel}</div>
                  ${result.accuracy !== undefined ? `
                    <div class="rank-accuracy-meter">
                      <div class="accuracy-bar-track">
                        <div class="accuracy-bar-fill" style="width: ${result.accuracy}%;"></div>
                      </div>
                      <div class="accuracy-label-row">
                        <span class="accuracy-label">${getIconSvg("target", { size: 13, color: "#FFD700" })} ${result.accuracy}% Precisión</span>
                        ${result.scorePercent !== undefined ? `<span class="accuracy-sub">• ${result.scorePercent}% Efectividad</span>` : ""}
                      </div>
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- DESGLOSE DE PARTIDA ARCADE (DETALLES Y MÉTRICAS) -->
        ${hasStats ? `
          <div class="modal-breakdown-panel">
            <div class="breakdown-title">
              ${getIconSvg("chart", { size: 14, color: "#FFE082" })}
              <span>DESGLOSE DE PRECISIÓN</span>
            </div>
            <div class="breakdown-grid">
              <div class="stat-chip chip-perfect">
                <span class="stat-name">¡PERFECTO!</span>
                <span class="stat-val">${result.perfectCount || 0}</span>
              </div>
              <div class="stat-chip chip-great">
                <span class="stat-name">¡GENIAL!</span>
                <span class="stat-val">${result.greatCount || 0}</span>
              </div>
              <div class="stat-chip chip-good">
                <span class="stat-name">¡BIEN!</span>
                <span class="stat-val">${result.goodCount || 0}</span>
              </div>
              <div class="stat-chip chip-miss">
                <span class="stat-name">MISS</span>
                <span class="stat-val">${result.missCount || 0}</span>
              </div>
              <div class="stat-chip chip-combo">
                <span class="stat-name">MÁX COMBO</span>
                <span class="stat-val">${getIconSvg("flame", { size: 13, color: "#FF9100", fill: "#FF9100" })} ${result.maxCombo || 0}</span>
              </div>
              <div class="stat-chip chip-notes">
                <span class="stat-name">TOTAL NOTAS</span>
                <span class="stat-val">${getIconSvg("bell", { size: 13, color: "#FFD700", fill: "#FFD700" })} ${result.totalNotes || 0}</span>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- MARCADOR DUAL TALLADO EN MADERA Y ORO -->
        <div class="modal-scores">
          <div class="score-box main-score">
            <div class="score-box-badge">TU PUNTUACIÓN</div>
            <span class="score-value">${result.score.toLocaleString()}</span>
          </div>

          <div class="score-box record-score ${isRecord ? "is-new-record" : ""}">
            <div class="score-box-badge">${isRecord ? "¡NUEVO RÉCORD!" : (isRhythmGame ? "RÉCORD EN ESTA CANCIÓN" : "RÉCORD ACTUAL")}</div>
            <span class="score-value">${result.highScore.toLocaleString()}</span>
          </div>
        </div>

        ${result.targetMaxScore ? `
          <div class="modal-target-score-hint">
            Puntuación Teórica Máxima: <strong style="color: #FFD700;">${result.targetMaxScore.toLocaleString()}</strong> pts
          </div>
        ` : ""}

        <!-- Mensaje Promocional -->
        <div class="modal-branding">
          <p class="modal-promo-text">${
            isCustom
              ? "Guarda o sigue ajustando tus notas grabadas."
              : "¡Sigue jugando y diviértete en la Feria Mágica del Juguete!"
          }</p>
        </div>

        <!-- ACCIONES / BOTONES ARCADE TÁCTILES 3D -->
        <div class="modal-actions ${isRhythmGame ? "modal-actions-rhythm" : ""}">
          <button id="btn-modal-again" class="btn-action btn-again" title="${isRhythmGame ? "Reintentar esta canción" : "Jugar otra vez"}">
            ${getIconSvg("replay", { size: 20, color: "#ffffff" })}
            <span>${isRhythmGame ? "¡REINTENTAR CANCIÓN!" : "¡VOLVER A INTENTAR!"}</span>
          </button>

          ${isRhythmGame ? `
            <button id="btn-modal-change-song" class="btn-action btn-change-song" title="Elegir otra canción de campanas">
              ${getIconSvg("music", { size: 18, color: "#ffffff" })}
              <span>CAMBIAR CANCIÓN</span>
            </button>
          ` : ""}

          <button id="btn-modal-menu" class="btn-action btn-menu" title="Volver al menú de minijuegos">
            ${getIconSvg("grid", { size: 20, color: "#ffffff" })}
            <span>OTROS JUEGOS</span>
          </button>
        </div>

        <!-- Toast de confirmación -->
        <div id="modal-toast" class="modal-toast" style="display: none;"></div>
      </div>
    `;

    this.container.style.display = "flex";
    this.setupEvents();
    this.playEntranceAnimation(result);

    const resultSignature = `${result.gameId}:${result.score}:${result.highScore}:${Boolean(result.isNewRecord)}:${rank}`;
    const isDuplicateRender = wasVisible && this.lastCelebratedSignature === resultSignature;
    if (!isDuplicateRender) {
      this.triggerCelebrationConfetti(result, rank, resultSignature);
    }
  }

  public shouldCelebrateResult(result: GameResult, resolvedRank: string): boolean {
    if (!result || result.score <= 0) {
      return false;
    }
    if (result.isNewRecord) {
      return true;
    }
    return resolvedRank === "S+" || resolvedRank === "S";
  }

  private triggerCelebrationConfetti(result: GameResult, resolvedRank: string, signature: string): void {
    if (!this.shouldCelebrateResult(result, resolvedRank)) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    this.lastCelebratedSignature = signature;
    const particleCount = result.isNewRecord ? 42 : 32; // Límite estricto <= 45 partículas

    try {
      this.isConfettiActive = true;
      this.celebrationCount++;
      confetti({
        particleCount,
        spread: 72,
        startVelocity: 34,
        ticks: 110,
        gravity: 1.05,
        scalar: 0.95,
        origin: { x: 0.5, y: 0.58 },
        colors: ["#FFD700", "#FF2A4D", "#00E5FF", "#00E676", "#FFF275"],
        disableForReducedMotion: true,
        zIndex: 9999
      });
    } catch {
      this.isConfettiActive = false;
    }
  }

  public getCelebrationState(): {
    celebrationCount: number;
    isConfettiActive: boolean;
    lastCelebratedSignature: string | null;
  } {
    return {
      celebrationCount: this.celebrationCount,
      isConfettiActive: this.isConfettiActive,
      lastCelebratedSignature: this.lastCelebratedSignature
    };
  }

  private playEntranceAnimation(result: GameResult): void {
    this.killAnimations(false);

    const card = this.container.querySelector<HTMLElement>(".modal-card");
    const headerEls = Array.from(
      this.container.querySelectorAll<HTMLElement>(
        ".modal-emblem-header, .modal-ribbon-wrapper, .modal-game-name"
      )
    );
    const pillAndRank = Array.from(
      this.container.querySelectorAll<HTMLElement>(
        ".modal-song-pill, .rank-medallion-badge"
      )
    );
    const accuracyFill = this.container.querySelector<HTMLElement>(".accuracy-bar-fill");
    const statChips = Array.from(this.container.querySelectorAll<HTMLElement>(".stat-chip"));
    const scoreBoxes = Array.from(this.container.querySelectorAll<HTMLElement>(".score-box"));
    const recordBox = this.container.querySelector<HTMLElement>(".record-score.is-new-record");
    const footerEls = Array.from(
      this.container.querySelectorAll<HTMLElement>(
        ".modal-target-score-hint, .modal-branding, .modal-actions .btn-action"
      )
    );
    const mainScoreValEl = this.container.querySelector<HTMLElement>(".main-score .score-value");

    const allTargets = [
      card,
      ...headerEls,
      ...pillAndRank,
      accuracyFill,
      ...statChips,
      ...scoreBoxes,
      ...footerEls
    ].filter((el): el is HTMLElement => el !== null);

    if (allTargets.length === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(allTargets, { autoAlpha: 1, clearProps: "transform" });
      if (mainScoreValEl) {
        mainScoreValEl.textContent = result.score.toLocaleString();
      }
      return;
    }

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" }
    });
    this.entranceTl = tl;

    if (card) {
      tl.fromTo(
        card,
        { autoAlpha: 0, y: 22, scale: 0.92 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "back.out(1.28)", clearProps: "transform" }
      );
    }

    if (headerEls.length > 0) {
      tl.fromTo(
        headerEls,
        { autoAlpha: 0, y: -10, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.04,
          ease: "back.out(1.35)",
          clearProps: "transform"
        },
        "-=0.22"
      );
    }

    if (pillAndRank.length > 0) {
      tl.fromTo(
        pillAndRank,
        { autoAlpha: 0, y: 12, scale: 0.95 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.05,
          ease: "back.out(1.35)",
          clearProps: "transform"
        },
        "-=0.18"
      );
    }

    if (accuracyFill) {
      tl.fromTo(
        accuracyFill,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.5, ease: "power2.out", clearProps: "transform" },
        "<0.04"
      );
    }

    if (statChips.length > 0) {
      tl.fromTo(
        statChips,
        { autoAlpha: 0, y: 10, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.24,
          stagger: 0.03,
          ease: "power2.out",
          clearProps: "transform"
        },
        "-=0.3"
      );
    }

    if (scoreBoxes.length > 0) {
      tl.fromTo(
        scoreBoxes,
        { autoAlpha: 0, y: 12, scale: 0.95 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.06,
          ease: "back.out(1.35)",
          clearProps: "transform"
        },
        "-=0.18"
      );
    }

    if (recordBox) {
      tl.fromTo(
        recordBox,
        { scale: 1 },
        {
          scale: 1.04,
          duration: 0.18,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
          clearProps: "transform"
        },
        "-=0.05"
      );
    }

    if (footerEls.length > 0) {
      tl.fromTo(
        footerEls,
        { autoAlpha: 0, y: 10, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.25,
          stagger: 0.04,
          ease: "back.out(1.35)",
          clearProps: "transform"
        },
        "-=0.18"
      );
    }

    if (mainScoreValEl && result.score > 0) {
      const counter = { value: 0 };
      mainScoreValEl.textContent = "0";
      this.scoreTween = gsap.to(counter, {
        value: result.score,
        duration: 0.72,
        ease: "power2.out",
        onUpdate: () => {
          mainScoreValEl.textContent = Math.round(counter.value).toLocaleString();
        },
        onComplete: () => {
          mainScoreValEl.textContent = result.score.toLocaleString();
        }
      });
    }
  }

  public killAnimations(resetConfetti: boolean = true): void {
    if (this.entranceTl) {
      this.entranceTl.kill();
      this.entranceTl = null;
    }

    if (this.scoreTween) {
      this.scoreTween.kill();
      this.scoreTween = null;
    }

    if (this.toastTimerIds.length > 0) {
      this.toastTimerIds.forEach((id) => window.clearTimeout(id));
      this.toastTimerIds = [];
    }

    if (resetConfetti && this.isConfettiActive) {
      try {
        confetti.reset();
      } catch {
        // Ignorar de forma segura si el contexto no está activo
      }
      this.isConfettiActive = false;
    }

    const targets = this.container.querySelectorAll<HTMLElement>(
      ".modal-card, .modal-emblem-header, .modal-ribbon-wrapper, .modal-game-name, .modal-song-pill, .rank-medallion-badge, .accuracy-bar-fill, .stat-chip, .score-box, .modal-target-score-hint, .modal-branding, .modal-actions .btn-action"
    );
    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
  }

  private setupEvents(): void {
    const btnAgain = this.container.querySelector<HTMLElement>("#btn-modal-again");
    const btnChangeSong = this.container.querySelector<HTMLElement>("#btn-modal-change-song");
    const btnMenu = this.container.querySelector<HTMLElement>("#btn-modal-menu");

    const actionButtons = [btnAgain, btnChangeSong, btnMenu].filter(
      (btn): btn is HTMLElement => btn !== null
    );

    actionButtons.forEach((btn) => {
      btn.addEventListener("pointerdown", () => {
        gsap.to(btn, {
          scale: 0.95,
          duration: 0.09,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      const restoreBtn = () => {
        gsap.to(btn, {
          scale: 1,
          duration: 0.16,
          ease: "back.out(1.5)",
          clearProps: "transform",
          overwrite: "auto"
        });
      };

      btn.addEventListener("pointerup", restoreBtn);
      btn.addEventListener("pointerleave", restoreBtn);
      btn.addEventListener("pointercancel", restoreBtn);
    });

    btnAgain?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onPlayAgain) this.onPlayAgain();
    });

    btnChangeSong?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onChangeSong) this.onChangeSong();
    });

    btnMenu?.addEventListener("click", () => {
      this.audio.playTap();
      this.hide();
      if (this.onBackToMenu) this.onBackToMenu();
    });

  }

  public hide(): void {
    this.killAnimations(true);
    this.lastCelebratedSignature = null;
    this.container.style.display = "none";
    this.container.innerHTML = "";
  }
}
