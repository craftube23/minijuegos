/**
 * ==============================================================================
 * SISTEMA DE RENDERIZADO DE HUD ARCADE (GameHUD)
 * ==============================================================================
 * 
 * Renderizado de alta definición (Stylized 2D Game Art):
 * - Barra superior Glassmorphism con ribetes dorados
 * - Indicador de Vidas con iconos vectoriales temáticos (Campanas, Elfos, Corazones)
 * - Puntuación y Récord con estrella volumétrica 3D
 * - Cronómetro de partida con alerta en clímax (<10s)
 * - Banner de Power-Up activo (Feria Mágica y Campuslands)
 * - Banner cinematográfico de Fin de Partida / Victoria
 */

import type { LogoConfig } from "../config/branding";

export interface HUDState {
  gameId: string;
  width: number;
  height: number;
  score: number;
  highScore: number;
  timeRemaining: number;
  lives: number;
  maxLives: number;
  showLives: boolean;
  isLogoPowerUpActive: boolean;
  logoPowerUpTimer: number;
  activeLogo: LogoConfig;
}

export class GameHUD {
  public static draw(ctx: CanvasRenderingContext2D, state: HUDState): void {
    ctx.save();

    const isNarrow = state.width < 460;
    const isShort = state.height < 500;
    const hudH = isShort
      ? Math.max(36, Math.min(48, state.height * 0.10))
      : Math.max(44, Math.min(68, state.height * 0.075));

    // Fondo oscuro translúcido con borde dorado brillante
    ctx.fillStyle = "rgba(7, 18, 34, 0.96)";
    ctx.fillRect(0, 0, state.width, hudH);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, hudH);
    ctx.lineTo(state.width, hudH);
    ctx.stroke();

    const fontMain = isShort
      ? (isNarrow ? Math.max(12, state.width * 0.035) : Math.max(13, Math.min(18, state.height * 0.045)))
      : (isNarrow ? Math.max(13, state.width * 0.038) : Math.max(15, Math.min(24, state.width * 0.036)));
    const fontSub = isShort
      ? (isNarrow ? Math.max(9.5, state.width * 0.026) : Math.max(10, Math.min(14, state.height * 0.034)))
      : (isNarrow ? Math.max(10, state.width * 0.028) : Math.max(12, Math.min(18, state.width * 0.028)));
    const textY = hudH * 0.65;
    const paddingX = Math.max(8, state.width * 0.025);

    // 1. PUNTUACIÓN (Izquierda con estrella de fantasía 2D)
    const starRadius = fontMain * 0.48;
    const starX = paddingX + starRadius;
    const starY = textY - fontMain * 0.3;

    this.drawStar(ctx, starX, starY, starRadius);

    ctx.font = `900 ${fontMain}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.fillText(`${state.score}`, starX + starRadius + 6, textY);

    // 2. VIDAS Y TIEMPO RESTANTE (Centro)
    let timeFormatted: string;
    if (state.timeRemaining >= 60) {
      const mins = Math.floor(state.timeRemaining / 60);
      const secs = Math.floor(state.timeRemaining % 60);
      timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeFormatted = `${Math.ceil(state.timeRemaining)}s`;
    }

    if (state.showLives) {
      const iconSize = Math.max(10, Math.min(19, fontMain * 0.70));
      const iconGap = iconSize * 2.2;
      const totalIconsW = state.maxLives * iconGap;
      const startIconsX = (state.width / 2) - (totalIconsW / 2) - (isNarrow ? 10 : 20);

      for (let i = 0; i < state.maxLives; i++) {
        const hx = startIconsX + i * iconGap;
        const hy = textY - fontMain * 0.24;
        const isFilled = i < state.lives;
        this.drawLifeIcon(ctx, state.gameId, hx, hy, iconSize, isFilled);
      }

      ctx.font = `900 ${fontMain * 0.95}px 'Outfit', sans-serif`;
      ctx.fillStyle = state.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(timeFormatted, startIconsX + totalIconsW + (isNarrow ? 4 : 10), textY);
    } else {
      ctx.font = `900 ${fontMain * 1.05}px 'Outfit', sans-serif`;
      ctx.fillStyle = state.timeRemaining < 10 ? "#FF416C" : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(timeFormatted, state.width / 2, textY);
    }

    // 3. RÉCORD / TOP (Derecha)
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#2ECC71";
    ctx.textAlign = "right";
    const recordLabel = isNarrow ? `TOP: ${Math.max(state.score, state.highScore)}` : `RÉCORD: ${Math.max(state.score, state.highScore)}`;
    ctx.fillText(recordLabel, state.width - paddingX, textY);

    // 4. Indicador de Power-Up del Logo Activo
    if (state.isLogoPowerUpActive) {
      const bannerH = Math.max(20, Math.min(34, hudH * 0.55));
      const isCampus = state.activeLogo.id === "logo-2";

      ctx.fillStyle = isCampus ? "rgba(0, 229, 255, 0.96)" : "rgba(255, 215, 0, 0.96)";
      ctx.fillRect(0, hudH, state.width, bannerH);
      ctx.fillStyle = isCampus ? "#031B33" : "#0A2518";
      ctx.font = `900 ${Math.max(10, Math.min(16, isShort ? 12 : state.width * 0.028))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      const bonusTitle = isCampus ? "¡BONUS CAMPUSLANDS!" : "¡BONUS FERIA MÁGICA!";
      ctx.fillText(`${bonusTitle} (x${state.activeLogo.bonusMultiplier}) - ${Math.ceil(state.logoPowerUpTimer)}s`, state.width / 2, hudH + bannerH * 0.7);
    }

    ctx.restore();
  }

  public static drawFinishOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    const isShort = height < 500;
    const isNarrow = width < 460;
    const bannerH = isShort
      ? Math.max(70, Math.min(95, height * 0.22))
      : Math.max(90, Math.min(130, height * 0.16));
    const bannerY = (height / 2) - (bannerH / 2);

    ctx.fillStyle = "rgba(4, 12, 28, 0.75)";
    ctx.fillRect(0, 0, width, height);

    ctx.shadowColor = "rgba(255, 215, 0, 0.85)";
    ctx.shadowBlur = 24;

    const bannerGrad = ctx.createLinearGradient(0, bannerY, width, bannerY);
    bannerGrad.addColorStop(0, "rgba(255, 143, 0, 0.95)");
    bannerGrad.addColorStop(0.5, "rgba(255, 215, 0, 0.98)");
    bannerGrad.addColorStop(1, "rgba(255, 143, 0, 0.95)");

    ctx.fillStyle = bannerGrad;
    ctx.fillRect(0, bannerY, width, bannerH);

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, bannerY); ctx.lineTo(width, bannerY);
    ctx.moveTo(0, bannerY + bannerH); ctx.lineTo(width, bannerY + bannerH);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const titleSize = isShort
      ? (isNarrow ? 22 : 28)
      : (isNarrow ? 28 : Math.max(34, Math.min(52, width * 0.055)));
    ctx.font = `900 ${titleSize}px 'Cinzel Decorative', 'Outfit', sans-serif`;
    ctx.fillStyle = "#031524";
    ctx.fillText("¡TIEMPO TERMINADO!", width / 2, bannerY + bannerH * 0.40);

    const subSize = isShort
      ? (isNarrow ? 10 : 12)
      : (isNarrow ? 12 : Math.max(14, Math.min(18, width * 0.022)));
    ctx.font = `800 ${subSize}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#1A3300";
    ctx.fillText("✨ Calculando Puntuación Mágica... ✨", width / 2, bannerY + bannerH * 0.78);

    ctx.restore();
  }

  private static drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, starRadius: number): void {
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = "rgba(255, 215, 0, 0.75)";
    ctx.shadowBlur = 8;

    const starGrad = ctx.createLinearGradient(-starRadius, -starRadius, starRadius, starRadius);
    starGrad.addColorStop(0, "#FFF9C4");
    starGrad.addColorStop(0.35, "#FFD700");
    starGrad.addColorStop(0.75, "#FF9100");
    starGrad.addColorStop(1, "#DD2C00");

    ctx.fillStyle = starGrad;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? starRadius : starRadius * 0.44;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -starRadius + 1);
    ctx.moveTo(0, 0); ctx.lineTo(-starRadius * 0.8, -starRadius * 0.25);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, -starRadius * 0.7, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public static drawLifeIcon(ctx: CanvasRenderingContext2D, gameId: string, x: number, y: number, size: number, isFilled: boolean): void {
    if (gameId === "flying-elf") {
      this.drawStylizedElfLifeIcon(ctx, x, y, size, isFilled);
    } else if (gameId === "bell-symphony") {
      this.drawStylizedBellLifeIcon(ctx, x, y, size, isFilled);
    } else {
      this.drawHeartLifeIcon(ctx, x, y, size, isFilled);
    }
  }

  private static drawStylizedBellLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 14;
    ctx.scale(s, s);

    if (!isFilled) {
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = "rgba(140, 160, 190, 0.4)";
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.bezierCurveTo(-5, -6, -8, 2, -10, 6);
      ctx.lineTo(10, 6);
      ctx.bezierCurveTo(8, 2, 5, -6, 3, -7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(-11, 5.5, 22, 3, 1.5);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 8.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 80, 80, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, -1); ctx.lineTo(4, 4);
      ctx.moveTo(4, -1); ctx.lineTo(-4, 4);
      ctx.stroke();

      ctx.restore();
      return;
    }

    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 7;

    ctx.strokeStyle = "#FF8F00";
    ctx.lineWidth = 2.0;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, -7.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const clapperGrad = ctx.createRadialGradient(-0.8, 7.5, 0.5, 0, 8.5, 3.2);
    clapperGrad.addColorStop(0, "#FFF3B0");
    clapperGrad.addColorStop(0.4, "#FFD700");
    clapperGrad.addColorStop(1, "#8A4E00");
    ctx.fillStyle = clapperGrad;
    ctx.beginPath();
    ctx.arc(0, 8.5, 2.8, 0, Math.PI * 2);
    ctx.fill();

    const bellGrad = ctx.createLinearGradient(-8, -6, 8, 6);
    bellGrad.addColorStop(0, "#FFF9C4");
    bellGrad.addColorStop(0.25, "#FFEB3B");
    bellGrad.addColorStop(0.65, "#FFB300");
    bellGrad.addColorStop(1, "#E65100");

    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.moveTo(-3.5, -6.5);
    ctx.bezierCurveTo(-6, -4, -8.5, 1.5, -10.5, 6);
    ctx.lineTo(10.5, 6);
    ctx.bezierCurveTo(8.5, 1.5, 6, -4, 3.5, -6.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    const rimGrad = ctx.createLinearGradient(-11, 5, 11, 8.5);
    rimGrad.addColorStop(0, "#FFE082");
    rimGrad.addColorStop(0.5, "#FFD54F");
    rimGrad.addColorStop(1, "#FF8F00");
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.roundRect(-11.5, 5, 23, 3.6, 1.8);
    ctx.fill();
    ctx.strokeStyle = "#4A2600";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FF1744";
    ctx.strokeStyle = "#700010";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.bezierCurveTo(-4, -7.5, -5, -4, 0, -4); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.bezierCurveTo(4, -7.5, 5, -4, 0, -4); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#00E676";
    ctx.beginPath();
    ctx.arc(0, -4.6, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawStylizedElfLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 14;
    ctx.scale(s, s);

    if (!isFilled) {
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = "rgba(140, 160, 190, 0.4)";
      ctx.beginPath();
      ctx.arc(0, 2.5, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-8.5, -0.5);
      ctx.bezierCurveTo(-9, -8, 1, -15, 11, -12);
      ctx.bezierCurveTo(6, -7, 8, -2, 8.5, -0.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 80, 80, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 5);
      ctx.moveTo(4, 0); ctx.lineTo(-4, 5);
      ctx.stroke();

      ctx.restore();
      return;
    }

    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 5;

    ctx.fillStyle = "#FFAA80";
    ctx.strokeStyle = "#8D3B1B";
    ctx.lineWidth = 1.2;

    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.bezierCurveTo(-15, -4, -16, 1, -7, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.bezierCurveTo(15, -4, 16, 1, 7, 5); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFD8B3";
    ctx.beginPath(); ctx.arc(0, 2.5, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#7D3210"; ctx.lineWidth = 1.3; ctx.stroke();

    ctx.fillStyle = "rgba(255, 80, 110, 0.70)";
    ctx.beginPath(); ctx.arc(-4.6, 4.2, 2.2, 0, Math.PI * 2); ctx.arc(4.6, 4.2, 2.2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#162842";
    ctx.beginPath(); ctx.arc(-3.2, 1.2, 1.9, 0, Math.PI * 2); ctx.arc(3.2, 1.2, 1.9, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(-2.6, 0.5, 0.75, 0, Math.PI * 2); ctx.arc(3.8, 0.5, 0.75, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#802A0A"; ctx.lineWidth = 1.3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-2.2, 5.2); ctx.quadraticCurveTo(0, 7.2, 2.2, 5.2); ctx.stroke();

    ctx.fillStyle = "#1E8A38";
    ctx.beginPath(); ctx.moveTo(-8.5, -0.5); ctx.bezierCurveTo(-9, -8, 1, -15, 11, -12); ctx.bezierCurveTo(6, -7, 8, -2, 8.5, -0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#0B4A1C"; ctx.lineWidth = 1.3; ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.beginPath(); ctx.roundRect(-9.5, -2.5, 19, 4.5, 2.2); ctx.fill();

    ctx.fillStyle = "#FFE600";
    ctx.beginPath(); ctx.arc(11, -12, 2.8, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  private static drawHeartLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isFilled: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 14;
    ctx.scale(s, s);

    if (!isFilled) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "rgba(160, 180, 205, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.bezierCurveTo(-10, -5, -10, -11, 0, -5);
      ctx.bezierCurveTo(10, -11, 10, -5, 0, 4);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 80, 80, 0.8)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, -5); ctx.lineTo(4, 1);
      ctx.moveTo(4, -5); ctx.lineTo(-4, 1);
      ctx.stroke();

      ctx.restore();
      return;
    }

    ctx.shadowColor = "#FF1744";
    ctx.shadowBlur = 8;

    const heartGrad = ctx.createLinearGradient(0, -11, 0, 6);
    heartGrad.addColorStop(0, "#FF5252");
    heartGrad.addColorStop(0.5, "#D50000");
    heartGrad.addColorStop(1, "#8A0000");

    ctx.fillStyle = heartGrad;
    ctx.beginPath();
    ctx.moveTo(0, 5.5);
    ctx.bezierCurveTo(-12, -4.5, -10, -13, 0, -6.5);
    ctx.bezierCurveTo(10, -13, 12, -4.5, 0, 5.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#400000";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.bezierCurveTo(-6, -9, -7, -5, -6, -2);
    ctx.stroke();

    ctx.restore();
  }
}
