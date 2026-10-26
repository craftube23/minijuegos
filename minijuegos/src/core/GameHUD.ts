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
  showTimer?: boolean;
  isLogoPowerUpActive: boolean;
  logoPowerUpTimer: number;
  activeLogo: LogoConfig;
}

export class GameHUD {
  private static drawClockIcon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, isUrgent: boolean): void {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Botón superior del cronómetro
    ctx.fillStyle = isUrgent ? "#FF4D4D" : "#E2E8F0";
    ctx.fillRect(-1.5, -radius - 2.5, 3, 2.5);

    // Esfera del reloj
    ctx.fillStyle = isUrgent ? "#7F1D1D" : "#1E293B";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isUrgent ? "#EF4444" : "#94A3B8";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Manecillas del reloj
    ctx.strokeStyle = isUrgent ? "#FCA5A5" : "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -radius * 0.58);
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 0.42, 0);
    ctx.stroke();

    ctx.restore();
  }

  public static draw(ctx: CanvasRenderingContext2D, state: HUDState): void {
    ctx.save();

    const isNarrow = state.width < 520;
    const isShort = state.height < 500;
    const isUltraShort = state.height < 420;
    const hudH = Math.round(isUltraShort
      ? 26
      : (isShort
        ? Math.max(28, Math.min(36, state.height * 0.085))
        : Math.max(48, Math.min(62, state.height * 0.080))));

    // 1. BARRA BASE SUPERIOR: Totalmente opaca (#0A1422) para que ningún elemento inferior traspase
    const hudGrad = ctx.createLinearGradient(0, 0, 0, hudH);
    hudGrad.addColorStop(0, "#132438");
    hudGrad.addColorStop(0.7, "#0A1422");
    hudGrad.addColorStop(1, "#050B13");
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, state.width, hudH);

    // Ribete de madera caoba + filete de oro noble
    ctx.fillStyle = "#3D1C06";
    ctx.fillRect(0, hudH - 3, state.width, 3);
    ctx.fillStyle = "#F1C40F";
    ctx.fillRect(0, hudH - 1.5, state.width, 1.5);

    const fontMain = Math.round(isUltraShort
      ? 11
      : (isShort
        ? (isNarrow ? Math.max(10, state.width * 0.028) : Math.max(11, Math.min(14, state.height * 0.038)))
        : (isNarrow ? Math.max(12, state.width * 0.034) : Math.max(14, Math.min(20, state.width * 0.030)))));
    const fontSub = Math.round(isUltraShort
      ? 8
      : (isShort
        ? (isNarrow ? Math.max(7.5, state.width * 0.020) : Math.max(8, Math.min(11, state.height * 0.028)))
        : (isNarrow ? Math.max(9, state.width * 0.025) : Math.max(10, Math.min(13, state.width * 0.024)))));

    const paddingX = Math.round(Math.max(6, state.width * 0.02));
    const plaqueH = Math.round(isUltraShort ? 20 : (isShort ? 24 : 34));
    const plaqueY = Math.round((hudH - plaqueH) / 2);

    // 2. PLACA DE PUNTUACIÓN (Izquierda - Estilo Medallón Arcade)
    const scoreStr = `${state.score}`;
    ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    const scoreTextW = ctx.measureText(scoreStr).width;
    const starRadius = Math.round(isUltraShort ? 7 : Math.min(plaqueH * 0.34, 12));
    const scorePlaqueW = Math.round(scoreTextW + starRadius * 2 + (isNarrow ? 16 : 24));
    const scorePlaqueX = paddingX;

    // Fondo de placa de puntuación con borde nítido
    ctx.save();
    const scorePlaqueGrad = ctx.createLinearGradient(scorePlaqueX, plaqueY, scorePlaqueX, plaqueY + plaqueH);
    scorePlaqueGrad.addColorStop(0, "rgba(30, 41, 59, 0.95)");
    scorePlaqueGrad.addColorStop(1, "rgba(15, 23, 42, 0.98)");
    ctx.fillStyle = scorePlaqueGrad;
    ctx.beginPath();
    ctx.roundRect(scorePlaqueX, plaqueY, scorePlaqueW, plaqueH, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 215, 0, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Estrella de la puntuación
    const starX = scorePlaqueX + starRadius + 5;
    const starY = plaqueY + plaqueH / 2;
    this.drawStar(ctx, starX, starY, starRadius);

    // Texto de puntuación con sombra nítida (sin blur para evitar Skia GPU glitches)
    ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillText(scoreStr, starX + starRadius + 4 + 1, plaqueY + plaqueH / 2 + 1);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(scoreStr, starX + starRadius + 4, plaqueY + plaqueH / 2);
    ctx.restore();

    // Preparación del tiempo y récord
    let timeFormatted: string;
    if (state.timeRemaining >= 60) {
      const mins = Math.floor(state.timeRemaining / 60);
      const secs = Math.floor(state.timeRemaining % 60);
      timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeFormatted = `${Math.ceil(state.timeRemaining)}s`;
    }
    const isUrgent = state.timeRemaining < 10;

    const recordVal = Math.max(state.score, state.highScore);
    const recordLabel = isNarrow ? `TOP: ${recordVal}` : `🏆 TOP: ${recordVal}`;
    ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
    const recordTextW = ctx.measureText(recordLabel).width;
    const recordPlaqueW = Math.round(recordTextW + (isNarrow ? 12 : 16));

    const clockIconR = Math.round(isUltraShort ? 6 : Math.min(plaqueH * 0.28, 10));
    ctx.font = `900 ${fontMain * 0.95}px 'Titan One', 'Fredoka', cursive, sans-serif`;
    const timeTextW = ctx.measureText(timeFormatted).width;
    const clockPlaqueW = Math.round(timeTextW + clockIconR * 2 + (isNarrow ? 14 : 18));

    // 3. CENTRO: VIDAS (o Cronómetro si no hay vidas)
    if (state.showLives) {
      const iconSize = Math.round(isUltraShort ? 8 : (isShort ? 10 : Math.max(8, Math.min(13, plaqueH * 0.36))));
      const iconGap = Math.round(iconSize * 1.8);
      const totalIconsW = state.maxLives * iconGap;
      const centerTrayW = Math.round(totalIconsW + 12);

      // Calculamos posiciones de forma garantizada sin colisiones:
      // Record en extremo derecho
      const recordPlaqueX = Math.round(state.width - paddingX - recordPlaqueW);
      // Clock a la izquierda de Record
      const hasTimer = state.showTimer !== false && state.timeRemaining <= 3600;
      const clockPlaqueX = hasTimer ? Math.round(recordPlaqueX - 6 - clockPlaqueW) : recordPlaqueX;

      // El centro de vidas se ubica centrado en el espacio restante entre Score y Clock
      const spaceBetween = clockPlaqueX - (scorePlaqueX + scorePlaqueW);
      let centerTrayX = Math.round((state.width - centerTrayW) / 2);
      // Si la pantalla es muy estrecha y centrar en pantalla colisiona, lo centramos en el hueco
      if (centerTrayX + centerTrayW > clockPlaqueX - 4) {
        centerTrayX = Math.round(scorePlaqueX + scorePlaqueW + (spaceBetween - centerTrayW) / 2);
      }
      if (centerTrayX < scorePlaqueX + scorePlaqueW + 4) {
        centerTrayX = scorePlaqueX + scorePlaqueW + 4;
      }

      // Bandeja de vidas
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(centerTrayX, plaqueY, centerTrayW, plaqueH, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      // Iconos de vidas
      const startIconsX = centerTrayX + 6 + iconSize / 2;
      for (let i = 0; i < state.maxLives; i++) {
        const hx = Math.round(startIconsX + i * iconGap);
        const hy = Math.round(plaqueY + plaqueH / 2);
        const isFilled = i < state.lives;
        this.drawLifeIcon(ctx, state.gameId, hx, hy, iconSize, isFilled);
      }

      // 4. CRONÓMETRO CON ICONO VECTORIAL (Sin emojis para evitar Skia GPU atlas fallback)
      if (hasTimer) {
      ctx.save();
      ctx.fillStyle = isUrgent ? "rgba(127, 29, 29, 0.70)" : "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(clockPlaqueX, plaqueY, clockPlaqueW, plaqueH, 8);
      ctx.fill();
      ctx.strokeStyle = isUrgent ? "#EF4444" : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      const clockIconX = clockPlaqueX + clockIconR + 5;
      const clockIconY = plaqueY + plaqueH / 2;
      this.drawClockIcon(ctx, clockIconX, clockIconY, clockIconR, isUrgent);

      ctx.font = `900 ${fontMain * 0.95}px 'Titan One', 'Fredoka', cursive, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillText(timeFormatted, clockIconX + clockIconR + 4 + 1, plaqueY + plaqueH / 2 + 1);
      ctx.fillStyle = isUrgent ? "#FF4D4D" : "#FFFFFF";
      ctx.fillText(timeFormatted, clockIconX + clockIconR + 4, plaqueY + plaqueH / 2);
      ctx.restore();
      }
      // 5. RÉCORD / TOP (Derecha - Placa de Honor Esmeralda)
      ctx.save();
      ctx.fillStyle = "rgba(6, 78, 59, 0.65)";
      ctx.beginPath();
      ctx.roundRect(recordPlaqueX, plaqueY, recordPlaqueW, plaqueH, 8);
      ctx.fill();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
      ctx.fillStyle = "#A7F3D0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(recordLabel, recordPlaqueX + recordPlaqueW / 2, plaqueY + plaqueH / 2);
      ctx.restore();
    } else {
      // Solo cronómetro centrado en placa
      if (state.showTimer !== false && state.timeRemaining <= 3600) {
      const clockW = Math.round(Math.max(75, isNarrow ? 70 : 95));
      const clockX = Math.round((state.width - clockW) / 2);

      ctx.save();
      ctx.fillStyle = isUrgent ? "rgba(127, 29, 29, 0.70)" : "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(clockX, plaqueY, clockW, plaqueH, 8);
      ctx.fill();
      ctx.strokeStyle = isUrgent ? "#EF4444" : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      const clockIconX = clockX + clockIconR + 6;
      const clockIconY = plaqueY + plaqueH / 2;
      this.drawClockIcon(ctx, clockIconX, clockIconY, clockIconR, isUrgent);

      ctx.font = `900 ${fontMain}px 'Titan One', 'Fredoka', cursive, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isUrgent ? "#FF4D4D" : "#FFFFFF";
      ctx.fillText(timeFormatted, clockIconX + clockIconR + 4, plaqueY + plaqueH / 2);
      ctx.restore();
      }

      // Récord a la derecha
      const recordPlaqueX = Math.round(state.width - paddingX - recordPlaqueW);
      ctx.save();
      ctx.fillStyle = "rgba(6, 78, 59, 0.65)";
      ctx.beginPath();
      ctx.roundRect(recordPlaqueX, plaqueY, recordPlaqueW, plaqueH, 8);
      ctx.fill();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.font = `800 ${fontSub}px 'Outfit', sans-serif`;
      ctx.fillStyle = "#A7F3D0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(recordLabel, recordPlaqueX + recordPlaqueW / 2, plaqueY + plaqueH / 2);
      ctx.restore();
    }

    // 6. Indicador de Power-Up del Logo Activo (Soporta todos los patrocinadores)
    if (state.isLogoPowerUpActive && state.activeLogo) {
      const bannerH = Math.round(Math.max(20, Math.min(32, hudH * 0.52)));
      const brandColor = state.activeLogo.themeColor || "#FFD700";
      const brandName = (state.activeLogo.shortName || state.activeLogo.name || "FERIA").toUpperCase();

      ctx.fillStyle = brandColor;
      ctx.fillRect(0, hudH, state.width, bannerH);
      ctx.fillStyle = "#0A192F";
      ctx.font = `900 ${Math.max(10, Math.min(15, isShort ? 11 : state.width * 0.027))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      const bonusTitle = `¡BONUS ${brandName}!`;
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

    ctx.fillStyle = "rgba(4, 12, 28, 0.82)";
    ctx.fillRect(0, 0, width, height);

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
    ctx.translate(Math.round(x), Math.round(y));

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
    ctx.translate(Math.round(x), Math.round(y));
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
    ctx.translate(Math.round(x), Math.round(y));
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

    ctx.fillStyle = "#FFAA80";
    ctx.strokeStyle = "#8D3B1B";
    ctx.lineWidth = 1.2;

    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.bezierCurveTo(-15, -4, -16, 1, -7, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.bezierCurveTo(15, -4, 16, 1, 7, 5); ctx.closePath(); ctx.fill(); ctx.stroke();

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
    ctx.translate(Math.round(x), Math.round(y));
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
