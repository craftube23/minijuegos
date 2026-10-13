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
      ? Math.max(40, Math.min(52, state.height * 0.11))
      : Math.max(48, Math.min(68, state.height * 0.082));

    // 1. BARRA BASE SUPERIOR: Madera noble pulida y ribete dorado
    const hudGrad = ctx.createLinearGradient(0, 0, 0, hudH);
    hudGrad.addColorStop(0, "rgba(19, 36, 56, 0.98)");
    hudGrad.addColorStop(0.7, "rgba(10, 20, 34, 0.98)");
    hudGrad.addColorStop(1, "rgba(5, 11, 19, 0.99)");
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, state.width, hudH);

    // Ribete de madera caoba + filete de oro noble
    ctx.fillStyle = "#3D1C06";
    ctx.fillRect(0, hudH - 3, state.width, 3);
    ctx.fillStyle = "#F1C40F";
    ctx.fillRect(0, hudH - 1.5, state.width, 1.5);

    const fontMain = isShort
      ? (isNarrow ? Math.max(12, state.width * 0.035) : Math.max(13, Math.min(18, state.height * 0.045)))
      : (isNarrow ? Math.max(13, state.width * 0.038) : Math.max(15, Math.min(22, state.width * 0.034)));
    const fontSub = isShort
      ? (isNarrow ? Math.max(9.5, state.width * 0.026) : Math.max(10, Math.min(13, state.height * 0.034)))
      : (isNarrow ? Math.max(10, state.width * 0.028) : Math.max(11, Math.min(15, state.width * 0.026)));

    const paddingX = Math.max(8, state.width * 0.025);
    const plaqueY = Math.max(4, (hudH - (isShort ? 30 : 38)) / 2);
    const plaqueH = isShort ? 30 : 38;

    // 2. PLACA DE PUNTUACIÓN (Izquierda - Estilo Medallón Arcade)
    const scoreStr = `${state.score}`;
    ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    const scoreTextW = ctx.measureText(scoreStr).width;
    const scorePlaqueW = Math.max(85, scoreTextW + (isNarrow ? 40 : 54));

    // Fondo de placa de puntuación
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    const scorePlaqueGrad = ctx.createLinearGradient(paddingX, plaqueY, paddingX, plaqueY + plaqueH);
    scorePlaqueGrad.addColorStop(0, "rgba(30, 41, 59, 0.85)");
    scorePlaqueGrad.addColorStop(1, "rgba(15, 23, 42, 0.95)");
    ctx.fillStyle = scorePlaqueGrad;
    ctx.beginPath();
    ctx.roundRect(paddingX, plaqueY, scorePlaqueW, plaqueH, 10);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Estrella de la puntuación
    const starRadius = Math.min(plaqueH * 0.35, 14);
    const starX = paddingX + starRadius + 7;
    const starY = plaqueY + plaqueH / 2;
    this.drawStar(ctx, starX, starY, starRadius);

    // Texto de puntuación con sombra dorada
    ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 6;
    ctx.fillText(scoreStr, starX + starRadius + 6, plaqueY + plaqueH / 2 + 1);
    ctx.shadowBlur = 0;

    // 3. CENTRO: VIDAS Y CRONÓMETRO DE PARTIDA
    let timeFormatted: string;
    if (state.timeRemaining >= 60) {
      const mins = Math.floor(state.timeRemaining / 60);
      const secs = Math.floor(state.timeRemaining % 60);
      timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeFormatted = `${Math.ceil(state.timeRemaining)}s`;
    }

    const isUrgent = state.timeRemaining < 10;

    if (state.showLives) {
      const iconSize = Math.max(9, Math.min(16, plaqueH * 0.40));
      const iconGap = iconSize * 2.1;
      const totalIconsW = state.maxLives * iconGap;
      const centerTrayW = totalIconsW + (isNarrow ? 50 : 75);
      const centerTrayX = (state.width - centerTrayW) / 2;

      // Bandeja de vidas y tiempo
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(centerTrayX, plaqueY, centerTrayW, plaqueH, 10);
      ctx.fill();
      ctx.strokeStyle = isUrgent ? "rgba(239, 68, 68, 0.6)" : "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Iconos de vidas
      const startIconsX = centerTrayX + 10;
      for (let i = 0; i < state.maxLives; i++) {
        const hx = startIconsX + i * iconGap + iconSize / 2;
        const hy = plaqueY + plaqueH / 2;
        const isFilled = i < state.lives;
        this.drawLifeIcon(ctx, state.gameId, hx, hy, iconSize, isFilled);
      }

      // Tiempo con reloj
      const timeX = startIconsX + totalIconsW + (isNarrow ? 4 : 8);
      ctx.font = `900 ${fontMain * 0.95}px 'Titan One', 'Fredoka', cursive, sans-serif`;
      ctx.fillStyle = isUrgent ? "#FF4D4D" : "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (isUrgent) {
        ctx.shadowColor = "#EF4444";
        ctx.shadowBlur = 8;
      }
      ctx.fillText(`⏱️ ${timeFormatted}`, timeX, plaqueY + plaqueH / 2 + 1);
      ctx.shadowBlur = 0;
    } else {
      // Solo cronómetro centrado en placa
      const clockW = Math.max(80, isNarrow ? 70 : 100);
      const clockX = (state.width - clockW) / 2;

      ctx.save();
      ctx.fillStyle = isUrgent ? "rgba(127, 29, 29, 0.65)" : "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(clockX, plaqueY, clockW, plaqueH, 10);
      ctx.fill();
      ctx.strokeStyle = isUrgent ? "#EF4444" : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      ctx.font = `900 ${fontMain * 1.05}px 'Titan One', 'Fredoka', cursive, sans-serif`;
      ctx.fillStyle = isUrgent ? "#FF4D4D" : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (isUrgent) {
        ctx.shadowColor = "#EF4444";
        ctx.shadowBlur = 8;
      }
      ctx.fillText(`⏱️ ${timeFormatted}`, state.width / 2, plaqueY + plaqueH / 2 + 1);
      ctx.shadowBlur = 0;
    }

    // 4. RÉCORD / TOP (Derecha - Placa de Honor)
    const recordVal = Math.max(state.score, state.highScore);
    const recordLabel = isNarrow ? `TOP: ${recordVal}` : `🏆 RÉCORD: ${recordVal}`;
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    const recordTextW = ctx.measureText(recordLabel).width;
    const recordPlaqueW = recordTextW + 18;
    const recordPlaqueX = state.width - paddingX - recordPlaqueW;

    ctx.save();
    ctx.fillStyle = "rgba(6, 78, 59, 0.55)";
    ctx.beginPath();
    ctx.roundRect(recordPlaqueX, plaqueY, recordPlaqueW, plaqueH, 10);
    ctx.fill();
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    ctx.fillStyle = "#A7F3D0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(recordLabel, recordPlaqueX + recordPlaqueW / 2, plaqueY + plaqueH / 2);
    ctx.restore();

    // 5. Indicador de Power-Up del Logo Activo
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
