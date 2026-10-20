/**
 * ==============================================================================
 * MINIJUEGO: ¡VISTE LA NAVIDAD! (Modular Holiday Character Creator)
 * ==============================================================================
 * Dirección de Arte: Stylized 2D Game Art / Fantasy Game Concept Art
 *
 * Características Modulares:
 * - Sistema Mix & Match completo en 2D:
 *   1. Cabezas intercambiables: Muñeco de Nieve, Reno, Santa Claus y Elfo.
 *   2. Cuerpos / Panzas intercambiables: Panza de Nieve con ramas, Panza de Santa,
 *      Suéter navideño de Reno y Traje de Elfo.
 *   3. Sombreros y Accesorios: Cuernos de Reno con luces, Gorro de Santa,
 *      Sombrero de Copa con acebo, Gorro de Elfo y Corona Dorada Real.
 *   4. Bufandas: Lana Roja, Caramelo Peppermint, Esmeralda y Seda Dorada.
 *   5. Objetos en mano: Bastón de Caramelo, Estrella Mágica, Regalo y Osito.
 * - Diseño de pantalla inteligente:
 *   * Pasarela del personaje a la izquierda, completamente despejada.
 *   * Armario táctil elegante a la derecha con pestañas y tarjetas interactivas.
 * - Misiones dinámicas de Santa (ej: "¡Crea un Muñeco con Panza de Santa y Cuernos!").
 * - Botón "¡Foto Mágica!" con flash de cámara, confeti y evaluación de estilo.
 * - Botón "¡Aleatorio!" para combinaciones insólitas al instante.
 */

import { BaseGame } from "../core/BaseGame";
import type { AudioManager } from "../core/AudioManager";
import type { InputManager } from "../core/InputManager";
import type { ParticleSystem } from "../core/ParticleSystem";
import {
  imgReady,
  roundRectPath,
  makeSkyStars,
  drawNightSky,
  drawPill
} from "./shared/gameDraw";

export type CategoryId = "cabeza" | "cuerpo" | "sombreros" | "bufandas" | "objetos";

export interface ModularOutfit {
  head: number;   // 0..3: Muñeco, Reno, Santa, Elfo
  body: number;   // 0..3: Nieve, Reno, Santa, Elfo
  hat: number;    // 0 = Ninguno, 1 = Cuernos, 2 = Santa, 3 = Copa, 4 = Elfo, 5 = Corona
  scarf: number;  // 0 = Ninguno, 1 = Roja, 2 = Caramelo, 3 = Esmeralda, 4 = Dorada
  item: number;   // 0 = Ninguno, 1 = Bastón, 2 = Estrella, 3 = Regalo, 4 = Osito
}

interface FashionMission {
  description: string;
  check: (outfit: ModularOutfit) => boolean;
  points: number;
}

interface SponsorInfo {
  id: string;
  name: string;
  logo: HTMLImageElement;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutGeometry {
  isLandscape: boolean;
  stageCx: number;
  stageCy: number;
  scale: number;
  panelRect: Rect;
  tabs: { id: CategoryId; label: string; rect: Rect }[];
  itemTiles: { index: number; label: string; rect: Rect }[];
  rndBtnRect: Rect;
  photoBtnRect: Rect;
}

function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (!imgReady(img)) return;
  const ratio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  const dw = ratio >= boxRatio ? w : h * ratio;
  const dh = ratio >= boxRatio ? w / ratio : h;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export class HolidayDressUpGame extends BaseGame {
  private currentCategory: CategoryId = "cabeza";

  private outfit: ModularOutfit = {
    head: 0,
    body: 2, // Panza de Santa por defecto con cabeza de muñeco (el combo del usuario)
    hat: 1,  // Cuernos de reno
    scarf: 2, // Bufanda de caramelo
    item: 1  // Bastón
  };

  private currentMission: FashionMission | null = null;
  private cameraFlashAlpha = 0;
  private photoshootAnimTimer = 0;
  private completedPhotosCount = 0;

  private skyStars = makeSkyStars(50);

  // Sprites 2D Stylized Game Art
  private bgImg: HTMLImageElement;

  private headImgs: HTMLImageElement[] = [];
  private bodyImgs: HTMLImageElement[] = [];
  private hatImgs: HTMLImageElement[] = [];
  private scarfImgs: HTMLImageElement[] = [];
  private itemImgs: HTMLImageElement[] = [];

  private sponsors: SponsorInfo[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    audio: AudioManager,
    particles: ParticleSystem
  ) {
    super(
      "holiday-dress-up",
      "¡Viste al Muñeco de Nieve!",
      "¡Crea y combina personajes navideños: Muñeco de Nieve, Reno, Santa y Elfo con sombreros, bufandas y accesorios en 2D!",
      canvas,
      input,
      audio,
      particles
    );

    this.inGameMusicPath = "./assets/audio/We Wish You a Merry Christmas.mp3";
    this.inGameMusicVolume = 0.45;

    this.bgImg = this.getImage("./assets/images/fondo-nieve.webp");

    // 4 Cabezas Modulares
    this.headImgs = [
      this.getImage("./assets/images/head-snowman.png"),
      this.getImage("./assets/images/head-reindeer.png"),
      this.getImage("./assets/images/head-santa.png"),
      this.getImage("./assets/images/head-elf.png")
    ];

    // 4 Cuerpos Modulares
    this.bodyImgs = [
      this.getImage("./assets/images/body-snowman.png"),
      this.getImage("./assets/images/body-reindeer.png"),
      this.getImage("./assets/images/body-santa.png"),
      this.getImage("./assets/images/body-elf.png")
    ];

    // Sombreros y cuernos (1..5)
    this.hatImgs = [
      this.getImage("./assets/images/hat-cuernos.png"),
      this.getImage("./assets/images/hat-santa.png"),
      this.getImage("./assets/images/hat-copa.png"),
      this.getImage("./assets/images/hat-elfo.png"),
      this.getImage("./assets/images/hat-corona.png")
    ];

    // Bufandas (1..4)
    this.scarfImgs = [
      this.getImage("./assets/images/scarf-roja.png"),
      this.getImage("./assets/images/scarf-caramelo.png"),
      this.getImage("./assets/images/scarf-esmeralda.png"),
      this.getImage("./assets/images/scarf-dorada.png")
    ];

    // Objetos en mano (1..4)
    this.itemImgs = [
      this.getImage("./assets/images/baston-caramelo.png"),
      this.getImage("./assets/images/estrella con logo.png"),
      this.getImage("./assets/images/regalo-estilizado-dorado.png"),
      this.getImage("./assets/images/osito.png")
    ];

    this.sponsors = [
      { id: "campus", name: "Campuslands", logo: this.getImage("./assets/logos/clean-campuslands.png") },
      { id: "cajasan", name: "Cajasan", logo: this.getImage("./assets/logos/clean-cajasan.png") },
      { id: "imebu", name: "IMEBU", logo: this.getImage("./assets/logos/clean-imebu.png") },
      { id: "feria", name: "Feria Mágica", logo: this.getImage("./assets/logos/clean-feria-magica.png") }
    ];
  }

  protected onStart(): void {
    this.currentCategory = "cabeza";
    this.cameraFlashAlpha = 0;
    this.photoshootAnimTimer = 0;
    this.completedPhotosCount = 0;
    this.showLives = false;

    this.outfit = {
      head: 0,
      body: 2, // Panza de Santa
      hat: 1,  // Cuernos de Reno
      scarf: 2, // Bufanda de caramelo
      item: 1  // Bastón
    };

    this.generateNewMission();

    this.input.onPointerDown = (_id: number, px: number, py: number) => {
      this.handleClick(px, py);
    };

    this.addFloatingText("¡CREADOR NAVIDEÑO 2D!", this.width / 2, this.height * 0.45, "#FFD700", 1.35);
  }

  public override destroy(): void {
    super.destroy();
    this.input.onPointerDown = undefined;
  }

  private generateNewMission(): void {
    const missionTypes = [
      {
        desc: "¡Crea un Muñeco con Panza de Santa!",
        check: (o: ModularOutfit) => o.head === 0 && o.body === 2
      },
      {
        desc: "¡Crea un Reno con Cuerpo de Nieve!",
        check: (o: ModularOutfit) => o.head === 1 && o.body === 0
      },
      {
        desc: "¡Ponle Cuernos de Reno a Santa!",
        check: (o: ModularOutfit) => o.head === 2 && o.hat === 1
      },
      {
        desc: "¡Viste al Elfo con la Corona Real!",
        check: (o: ModularOutfit) => o.head === 3 && o.hat === 5
      },
      {
        desc: "¡Abrígalo con la Bufanda de Caramelo!",
        check: (o: ModularOutfit) => o.scarf === 2
      },
      {
        desc: "¡Entrégale la Estrella Mágica!",
        check: (o: ModularOutfit) => o.item === 2
      },
      {
        desc: "¡Combina al Reno con Traje de Elfo!",
        check: (o: ModularOutfit) => o.head === 1 && o.body === 3
      },
      {
        desc: "¡Viste a Santa con Sombrero de Copa!",
        check: (o: ModularOutfit) => o.head === 2 && o.hat === 3
      },
      {
        desc: "¡Equipa el Regalo Dorado en mano!",
        check: (o: ModularOutfit) => o.item === 3
      },
      {
        desc: "¡Abrígalo con la Bufanda Dorada!",
        check: (o: ModularOutfit) => o.scarf === 4
      }
    ];

    const pick = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    this.currentMission = {
      description: pick.desc,
      check: pick.check,
      points: 350
    };
  }

  private getLayout(w: number, h: number): LayoutGeometry {
    const isLandscape = w >= 740;
    const scale = isLandscape ? 1.0 : 0.76;

    if (isLandscape) {
      const stageCx = w * 0.33;
      const stageCy = h * 0.53;

      const panelX = Math.max(w * 0.60, w - 420);
      const panelY = 56;
      const panelW = w - panelX - 18;
      const panelH = h - 72;

      const tabDefs: { id: CategoryId; label: string }[] = [
        { id: "cabeza", label: "CABEZA" },
        { id: "cuerpo", label: "CUERPO" },
        { id: "sombreros", label: "GORROS" },
        { id: "bufandas", label: "BUFANDAS" },
        { id: "objetos", label: "OBJETOS" }
      ];

      const tabH = 36;
      const tabW = Math.floor((panelW - 16) / tabDefs.length);
      const tabs = tabDefs.map((t, i) => ({
        id: t.id,
        label: t.label,
        rect: {
          x: panelX + 8 + i * tabW,
          y: panelY + 44,
          w: tabW - 3,
          h: tabH
        }
      }));

      // Item grid (2 columnas dentro del panel)
      const gridTop = panelY + 92;
      const gridW = panelW - 20;
      const cols = 2;
      const cardW = Math.floor((gridW - 10) / cols);
      const cardH = 58;

      const itemTiles = this.getItemsForCategory(this.currentCategory).map((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return {
          index: item.index,
          label: item.label,
          rect: {
            x: panelX + 10 + col * (cardW + 8),
            y: gridTop + row * (cardH + 7),
            w: cardW,
            h: cardH
          }
        };
      });

      // Botones inferiores
      const btnH = 46;
      const btnW = Math.floor((panelW - 24) / 2);
      const btnY = panelY + panelH - btnH - 12;

      const rndBtnRect = {
        x: panelX + 10,
        y: btnY,
        w: btnW,
        h: btnH
      };

      const photoBtnRect = {
        x: panelX + 14 + btnW,
        y: btnY,
        w: btnW,
        h: btnH
      };

      return {
        isLandscape,
        stageCx,
        stageCy,
        scale,
        panelRect: { x: panelX, y: panelY, w: panelW, h: panelH },
        tabs,
        itemTiles,
        rndBtnRect,
        photoBtnRect
      };
    } else {
      // Vista Portrait / Móvil
      const stageCx = w * 0.5;
      const stageCy = h * 0.28;

      const panelX = 10;
      const panelY = Math.floor(h * 0.50);
      const panelW = w - 20;
      const panelH = h - panelY - 14;

      const tabDefs: { id: CategoryId; label: string }[] = [
        { id: "cabeza", label: "CABEZA" },
        { id: "cuerpo", label: "CUERPO" },
        { id: "sombreros", label: "GORROS" },
        { id: "bufandas", label: "BUFANDAS" },
        { id: "objetos", label: "OBJETOS" }
      ];

      const tabH = 32;
      const tabW = Math.floor((panelW - 12) / tabDefs.length);
      const tabs = tabDefs.map((t, i) => ({
        id: t.id,
        label: t.label,
        rect: {
          x: panelX + 6 + i * tabW,
          y: panelY + 36,
          w: tabW - 2,
          h: tabH
        }
      }));

      const gridTop = panelY + 76;
      const cols = 3;
      const cardW = Math.floor((panelW - 24) / cols);
      const cardH = 50;

      const itemTiles = this.getItemsForCategory(this.currentCategory).map((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return {
          index: item.index,
          label: item.label,
          rect: {
            x: panelX + 8 + col * (cardW + 6),
            y: gridTop + row * (cardH + 6),
            w: cardW,
            h: cardH
          }
        };
      });

      const btnH = 40;
      const btnW = Math.floor((panelW - 24) / 2);
      const btnY = panelY + panelH - btnH - 8;

      return {
        isLandscape,
        stageCx,
        stageCy,
        scale,
        panelRect: { x: panelX, y: panelY, w: panelW, h: panelH },
        tabs,
        itemTiles,
        rndBtnRect: { x: panelX + 8, y: btnY, w: btnW, h: btnH },
        photoBtnRect: { x: panelX + 14 + btnW, y: btnY, w: btnW, h: btnH }
      };
    }
  }

  private getItemsForCategory(cat: CategoryId): { index: number; label: string }[] {
    switch (cat) {
      case "cabeza":
        return [
          { index: 0, label: "Muñeco" },
          { index: 1, label: "Reno" },
          { index: 2, label: "Santa" },
          { index: 3, label: "Elfo" }
        ];
      case "cuerpo":
        return [
          { index: 0, label: "Nieve" },
          { index: 1, label: "Reno" },
          { index: 2, label: "Santa" },
          { index: 3, label: "Elfo" }
        ];
      case "sombreros":
        return [
          { index: 0, label: "Ninguno" },
          { index: 1, label: "Cuernos" },
          { index: 2, label: "Santa" },
          { index: 3, label: "Copa" },
          { index: 4, label: "Elfo" },
          { index: 5, label: "Corona" }
        ];
      case "bufandas":
        return [
          { index: 0, label: "Ninguna" },
          { index: 1, label: "Roja" },
          { index: 2, label: "Caramelo" },
          { index: 3, label: "Esmeralda" },
          { index: 4, label: "Dorada" }
        ];
      case "objetos":
        return [
          { index: 0, label: "Ninguno" },
          { index: 1, label: "Bastón" },
          { index: 2, label: "Estrella" },
          { index: 3, label: "Regalo" },
          { index: 4, label: "Osito" }
        ];
    }
  }

  private handleClick(px: number, py: number): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const layout = this.getLayout(w, h);

    // 1. Selector de pestañas
    for (const tab of layout.tabs) {
      if (
        px >= tab.rect.x &&
        px <= tab.rect.x + tab.rect.w &&
        py >= tab.rect.y &&
        py <= tab.rect.y + tab.rect.h
      ) {
        this.currentCategory = tab.id;
        this.audio.playTap();
        return;
      }
    }

    // 2. Tarjetas de prendas / partes
    for (const tile of layout.itemTiles) {
      if (
        px >= tile.rect.x &&
        px <= tile.rect.x + tile.rect.w &&
        py >= tile.rect.y &&
        py <= tile.rect.y + tile.rect.h
      ) {
        this.applyChoice(this.currentCategory, tile.index);
        return;
      }
    }

    // 3. Botón Aleatorio
    const rb = layout.rndBtnRect;
    if (px >= rb.x && px <= rb.x + rb.w && py >= rb.y && py <= rb.y + rb.h) {
      this.randomizeOutfit();
      return;
    }

    // 4. Botón Foto Mágica
    const pb = layout.photoBtnRect;
    if (px >= pb.x && px <= pb.x + pb.w && py >= pb.y && py <= pb.y + pb.h) {
      this.takeMagicPhoto();
      return;
    }
  }

  private applyChoice(cat: CategoryId, index: number): void {
    if (cat === "cabeza") {
      this.outfit.head = index;
    } else if (cat === "cuerpo") {
      this.outfit.body = index;
    } else if (cat === "sombreros") {
      this.outfit.hat = this.outfit.hat === index ? 0 : index;
    } else if (cat === "bufandas") {
      this.outfit.scarf = this.outfit.scarf === index ? 0 : index;
    } else if (cat === "objetos") {
      this.outfit.item = this.outfit.item === index ? 0 : index;
    }

    this.audio.playCatchItem(1.15);
    const layout = this.getLayout(this.width || 1024, this.height || 768);
    this.particles.emitBurst(layout.stageCx, layout.stageCy, "#FFD700", 10);
    this.checkMissionMatch();
  }

  private randomizeOutfit(): void {
    this.outfit.head = Math.floor(Math.random() * 4);
    this.outfit.body = Math.floor(Math.random() * 4);
    this.outfit.hat = Math.floor(Math.random() * 6);
    this.outfit.scarf = Math.floor(Math.random() * 5);
    this.outfit.item = Math.floor(Math.random() * 5);

    this.audio.playPowerUp();
    const layout = this.getLayout(this.width || 1024, this.height || 768);
    this.particles.emitBurst(layout.stageCx, layout.stageCy, "#00E5FF", 20);
    this.addFloatingText("¡COMBINACIÓN SORPRESA!", layout.stageCx, layout.stageCy - 120, "#00E5FF", 1.25);
    this.checkMissionMatch();
  }

  private takeMagicPhoto(): void {
    this.cameraFlashAlpha = 0.92;
    this.photoshootAnimTimer = 1.2;
    this.completedPhotosCount++;
    this.audio.playVictory();
    this.triggerShake(0.2, 6);
    this.particles.emitConfetti(this.width, 40);

    const bonus = 280 + Math.floor(Math.random() * 150);
    this.addScore(bonus);
    const layout = this.getLayout(this.width || 1024, this.height || 768);
    this.addFloatingText(`¡FOTO ESPECTACULAR! +${bonus}`, layout.stageCx, layout.stageCy - 110, "#FFD700", 1.35);

    const sponsor = this.sponsors[Math.floor(Math.random() * this.sponsors.length)];
    this.triggerLogoPowerUp(sponsor.id, 6);
  }

  private checkMissionMatch(): void {
    if (!this.currentMission) return;
    if (this.currentMission.check(this.outfit)) {
      const pts = this.currentMission.points;
      this.addScore(pts);
      this.audio.playPowerUp();
      this.particles.emitConfetti(this.width, 34);
      const layout = this.getLayout(this.width || 1024, this.height || 768);
      this.addFloatingText(`¡MISIÓN CUMPLIDA! +${pts}`, layout.stageCx, layout.stageCy - 140, "#00E676", 1.4);
      this.generateNewMission();
    }
  }

  protected onUpdate(dt: number): void {
    if (this.cameraFlashAlpha > 0) {
      this.cameraFlashAlpha = Math.max(0, this.cameraFlashAlpha - dt * 2.8);
    }
    if (this.photoshootAnimTimer > 0) {
      this.photoshootAnimTimer = Math.max(0, this.photoshootAnimTimer - dt);
    }
  }

  protected onDraw(ctx: CanvasRenderingContext2D): void {
    const w = this.width || 1024;
    const h = this.height || 768;
    const t = performance.now() * 0.001;
    const layout = this.getLayout(w, h);

    // 1. Fondo invernal estrellado
    drawNightSky(ctx, w, h, t, this.skyStars);
    if (imgReady(this.bgImg)) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.drawImage(this.bgImg, 0, 0, w, h);
      ctx.restore();
    }

    // 2. Pedestal circular nevado en la pasarela
    this.drawStagePedestal(ctx, layout.stageCx, layout.stageCy, layout.scale, t);

    // 3. Dibujar al personaje modular con sus capas exactas
    this.drawModularCharacter(ctx, layout.stageCx, layout.stageCy, layout.scale, t);

    // 4. Armario Navideño 2D en el lateral
    this.drawWardrobePanel(ctx, layout);

    // 5. HUD Superior: Misión actual y contador de fotos
    if (this.currentMission) {
      const missionText = `MISIÓN: ${this.currentMission.description}`;
      if (layout.isLandscape) {
        drawPill(ctx, missionText, layout.stageCx, 68, "#FFD700", 380);
        drawPill(ctx, `FOTOS: ${this.completedPhotosCount}`, 110, 68, "#00E5FF", 140);
      } else {
        drawPill(ctx, missionText, w / 2, 60, "#FFD700", Math.min(360, w - 20));
      }
    }

    // 6. Flash de cámara al tomar foto
    if (this.cameraFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.cameraFlashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private drawStagePedestal(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    t: number
  ): void {
    const prX = 180 * scale;
    const prY = 58 * scale;
    const baseY = cy + 140 * scale;

    ctx.save();
    // Halo dorado mágico
    const glowGrad = ctx.createRadialGradient(cx, baseY, 10, cx, baseY, prX * 1.3);
    glowGrad.addColorStop(0, "rgba(255, 215, 0, 0.45)");
    glowGrad.addColorStop(0.5, "rgba(255, 235, 59, 0.15)");
    glowGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, prX * 1.3, prY * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Alfombra festiva roja de terciopelo con ribete de oro
    ctx.fillStyle = "#8E0000";
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, prX, prY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Destellos sobre el borde de la alfombra
    const sparkCount = 6;
    for (let i = 0; i < sparkCount; i++) {
      const ang = (i / sparkCount) * Math.PI * 2 + t * 0.5;
      const sx = cx + Math.cos(ang) * (prX * 0.85);
      const sy = baseY + Math.sin(ang) * (prY * 0.85);
      const pulse = 2 + Math.sin(t * 4 + i) * 1.5;
      ctx.fillStyle = "#FFF9C4";
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawModularCharacter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    t: number
  ): void {
    ctx.save();
    const photoPose = this.photoshootAnimTimer > 0 ? Math.abs(Math.sin(this.photoshootAnimTimer * 10)) * 14 : 0;
    const bobY = cy + Math.sin(t * 3) * 5 - photoPose;

    const s = scale;

    // 1. CUERPO MODULAR (Base)
    const bodyImg = this.bodyImgs[this.outfit.body];
    const bw = 250 * s;
    const bh = imgReady(bodyImg) ? (bw * bodyImg.naturalHeight / bodyImg.naturalWidth) : (210 * s);
    const bodyX = cx - bw / 2;
    const bodyY = bobY - 45 * s;

    if (imgReady(bodyImg)) {
      ctx.drawImage(bodyImg, bodyX, bodyY, bw, bh);
    }

    // 2. CABEZA MODULAR (Encima del cuello del cuerpo)
    const headImg = this.headImgs[this.outfit.head];
    const hw = 185 * s;
    const hh = imgReady(headImg) ? (hw * headImg.naturalHeight / headImg.naturalWidth) : (175 * s);
    const headX = cx - hw / 2;
    const headY = bodyY - hh + 46 * s;

    if (imgReady(headImg)) {
      ctx.drawImage(headImg, headX, headY, hw, hh);
    }

    // 3. BUFANDA (Cubre la unión entre cabeza y cuerpo)
    if (this.outfit.scarf > 0) {
      const scarfImg = this.scarfImgs[this.outfit.scarf - 1];
      if (imgReady(scarfImg)) {
        const sw = 165 * s;
        const sh = (sw * scarfImg.naturalHeight / scarfImg.naturalWidth);
        const scarfX = cx - sw / 2;
        const scarfY = headY + hh - 55 * s;
        ctx.drawImage(scarfImg, scarfX, scarfY, sw, sh);
      }
    }

    // 4. SOMBRERO / CUERNOS (Sobre la corona de la cabeza)
    if (this.outfit.hat > 0) {
      const hatImg = this.hatImgs[this.outfit.hat - 1];
      if (imgReady(hatImg)) {
        const isAntler = this.outfit.hat === 1; // Cuernos de reno
        const hatW = isAntler ? (210 * s) : (175 * s);
        const hatH = (hatW * hatImg.naturalHeight / hatImg.naturalWidth);
        const hatX = cx - hatW / 2;
        const hatY = headY - hatH + (isAntler ? (48 * s) : (36 * s));
        ctx.drawImage(hatImg, hatX, hatY, hatW, hatH);
      }
    }

    // 5. OBJETO EN MANO (Sostenido en el costado derecho)
    if (this.outfit.item > 0) {
      const itemImg = this.itemImgs[this.outfit.item - 1];
      if (imgReady(itemImg)) {
        const itemW = 76 * s;
        const itemH = 76 * s;
        const itemX = cx + 80 * s;
        const itemY = bobY + 15 * s;
        drawFitted(ctx, itemImg, itemX, itemY, itemW, itemH);
      }
    }

    ctx.restore();
  }

  private drawWardrobePanel(ctx: CanvasRenderingContext2D, layout: LayoutGeometry): void {
    const p = layout.panelRect;

    ctx.save();
    // Caja del armario (marco de madera oscura escarchada con reflejos mágicos)
    const bgGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    bgGrad.addColorStop(0, "rgba(10, 24, 52, 0.94)");
    bgGrad.addColorStop(1, "rgba(5, 12, 28, 0.96)");
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    roundRectPath(ctx, p.x, p.y, p.w, p.h, 18);
    ctx.fill();
    ctx.stroke();

    // Título del Armario
    ctx.fillStyle = "#FFD700";
    ctx.font = "900 15px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ARMARIO MÁGICO 2D", p.x + p.w / 2, p.y + 22);

    // Pestañas de categoría
    for (const tab of layout.tabs) {
      const isSelected = this.currentCategory === tab.id;
      ctx.save();
      const tabGrad = ctx.createLinearGradient(tab.rect.x, tab.rect.y, tab.rect.x, tab.rect.y + tab.rect.h);
      if (isSelected) {
        tabGrad.addColorStop(0, "#00E5FF");
        tabGrad.addColorStop(1, "#00B0FF");
      } else {
        tabGrad.addColorStop(0, "rgba(22, 44, 84, 0.9)");
        tabGrad.addColorStop(1, "rgba(14, 28, 54, 0.9)");
      }
      ctx.fillStyle = tabGrad;
      ctx.strokeStyle = isSelected ? "#FFFFFF" : "rgba(255, 215, 0, 0.35)";
      ctx.lineWidth = isSelected ? 2.5 : 1;
      roundRectPath(ctx, tab.rect.x, tab.rect.y, tab.rect.w, tab.rect.h, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#012B47" : "#FFFFFF";
      ctx.font = isSelected ? "900 11px 'Fredoka', sans-serif" : "700 11px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tab.label, tab.rect.x + tab.rect.w / 2, tab.rect.y + tab.rect.h / 2);
      ctx.restore();
    }

    // Tarjetas de prendas / opciones
    const activeSelection = this.getActiveSelection(this.currentCategory);

    for (const tile of layout.itemTiles) {
      const isSelected = activeSelection === tile.index;
      ctx.save();
      const tileGrad = ctx.createLinearGradient(tile.rect.x, tile.rect.y, tile.rect.x, tile.rect.y + tile.rect.h);
      if (isSelected) {
        tileGrad.addColorStop(0, "rgba(255, 215, 0, 0.35)");
        tileGrad.addColorStop(1, "rgba(255, 179, 0, 0.2)");
      } else {
        tileGrad.addColorStop(0, "rgba(18, 38, 76, 0.8)");
        tileGrad.addColorStop(1, "rgba(11, 24, 48, 0.8)");
      }
      ctx.fillStyle = tileGrad;
      ctx.strokeStyle = isSelected ? "#FFD700" : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = isSelected ? 3 : 1;
      roundRectPath(ctx, tile.rect.x, tile.rect.y, tile.rect.w, tile.rect.h, 12);
      ctx.fill();
      ctx.stroke();

      // Miniatura / Thumbnail
      const thumbW = tile.rect.h - 14;
      const thumbH = thumbW;
      const thumbX = tile.rect.x + 8;
      const thumbY = tile.rect.y + 7;

      if (tile.index === 0 && (this.currentCategory === "sombreros" || this.currentCategory === "bufandas" || this.currentCategory === "objetos")) {
        // Opción 'Ninguno / Quitar'
        ctx.fillStyle = "#FF5252";
        ctx.font = "900 12px 'Fredoka', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("X", thumbX + thumbW / 2, thumbY + thumbH / 2);
      } else {
        this.drawCategoryThumbnail(ctx, this.currentCategory, tile.index, thumbX, thumbY, thumbW, thumbH);
      }

      // Etiqueta de texto
      ctx.fillStyle = isSelected ? "#FFD700" : "#FFFFFF";
      ctx.font = isSelected ? "900 12px 'Fredoka', sans-serif" : "700 11px 'Fredoka', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(tile.label, thumbX + thumbW + 8, tile.rect.y + tile.rect.h / 2);

      ctx.restore();
    }

    // Botón ¡Aleatorio!
    const rb = layout.rndBtnRect;
    ctx.save();
    const rndGrad = ctx.createLinearGradient(rb.x, rb.y, rb.x, rb.y + rb.h);
    rndGrad.addColorStop(0, "#8E24AA");
    rndGrad.addColorStop(1, "#5E35B1");
    ctx.fillStyle = rndGrad;
    ctx.strokeStyle = "#E1BEE7";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, rb.x, rb.y, rb.w, rb.h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 13px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ALEATORIO", rb.x + rb.w / 2, rb.y + rb.h / 2);
    ctx.restore();

    // Botón ¡Foto Mágica!
    const pb = layout.photoBtnRect;
    ctx.save();
    const photoGrad = ctx.createLinearGradient(pb.x, pb.y, pb.x, pb.y + pb.h);
    photoGrad.addColorStop(0, "#FFD700");
    photoGrad.addColorStop(1, "#FF8F00");
    ctx.fillStyle = photoGrad;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, pb.x, pb.y, pb.w, pb.h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1B5E20";
    ctx.font = "900 13px 'Fredoka', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("¡FOTO!", pb.x + pb.w / 2, pb.y + pb.h / 2);
    ctx.restore();

    ctx.restore();
  }

  private getActiveSelection(cat: CategoryId): number {
    switch (cat) {
      case "cabeza": return this.outfit.head;
      case "cuerpo": return this.outfit.body;
      case "sombreros": return this.outfit.hat;
      case "bufandas": return this.outfit.scarf;
      case "objetos": return this.outfit.item;
    }
  }

  private drawCategoryThumbnail(
    ctx: CanvasRenderingContext2D,
    cat: CategoryId,
    idx: number,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    if (cat === "cabeza") {
      drawFitted(ctx, this.headImgs[idx], x, y, w, h);
    } else if (cat === "cuerpo") {
      drawFitted(ctx, this.bodyImgs[idx], x, y, w, h);
    } else if (cat === "sombreros") {
      if (idx > 0) drawFitted(ctx, this.hatImgs[idx - 1], x, y, w, h);
    } else if (cat === "bufandas") {
      if (idx > 0) drawFitted(ctx, this.scarfImgs[idx - 1], x, y, w, h);
    } else if (cat === "objetos") {
      if (idx > 0) drawFitted(ctx, this.itemImgs[idx - 1], x, y, w, h);
    }
  }
}
