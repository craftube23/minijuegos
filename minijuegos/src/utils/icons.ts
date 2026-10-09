/**
 * ==============================================================================
 * ICON UTILITIES - FERIA MÁGICA DEL JUGUETE
 * ==============================================================================
 * Iconografía estilizada de Videojuego 2D / Fantasy Game Concept Art
 * 100% Vectorial, con degradados de volumen, biseles y brillos mágicos.
 */

export interface IconOptions {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
  fill?: string;
  glow?: boolean;
}

let iconIdCounter = 0;

/**
 * Generador de SVGs optimizados con estilo Stylized 2D Game Art / Fantasy Game Concept Art
 */
export function getIconSvg(name: string, options: IconOptions = {}): string {
  const size = options.size || 24;
  const color = options.color || "currentColor";
  const strokeWidth = options.strokeWidth || 2.0;
  const className = options.className ? `class="${options.className}"` : "";
  const fill = options.fill || "none";
  const glow = options.glow ?? true;

  const uid = `fg-icon-${name}-${++iconIdCounter}`;

  // Definición de paletas y degradados de Fantasía 2D Game Art
  const defs = `
    <defs>
      <linearGradient id="${uid}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF9C4" />
        <stop offset="30%" stop-color="#FFD700" />
        <stop offset="70%" stop-color="#FF9100" />
        <stop offset="100%" stop-color="#DD2C00" />
      </linearGradient>
      <linearGradient id="${uid}-ruby" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF80AB" />
        <stop offset="35%" stop-color="#FF1744" />
        <stop offset="75%" stop-color="#D50000" />
        <stop offset="100%" stop-color="#6A0014" />
      </linearGradient>
      <linearGradient id="${uid}-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E0F7FA" />
        <stop offset="30%" stop-color="#00E5FF" />
        <stop offset="70%" stop-color="#0091EA" />
        <stop offset="100%" stop-color="#01579B" />
      </linearGradient>
      <linearGradient id="${uid}-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E8F5E9" />
        <stop offset="35%" stop-color="#00E676" />
        <stop offset="75%" stop-color="#00C853" />
        <stop offset="100%" stop-color="#1B5E20" />
      </linearGradient>
      <linearGradient id="${uid}-purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F3E5F5" />
        <stop offset="35%" stop-color="#E040FB" />
        <stop offset="75%" stop-color="#AA00FF" />
        <stop offset="100%" stop-color="#4A148C" />
      </linearGradient>
      <linearGradient id="${uid}-flame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF59D" />
        <stop offset="30%" stop-color="#FFAB00" />
        <stop offset="70%" stop-color="#FF3D00" />
        <stop offset="100%" stop-color="#BF360C" />
      </linearGradient>
      <filter id="${uid}-glow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${color}" flood-opacity="0.45" />
      </filter>
    </defs>
  `;

  const icons: Record<string, string> = {
    // Vidas / Salud (Gemas de Fantasía 2D)
    heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
    heartFilled: `
      <path fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1.2" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path fill="rgba(255,255,255,0.75)" d="M8.5 5.5c-1.8 0-3 1.2-3.3 2.8.6-.8 1.8-1.3 3.3-1.3 1.2 0 2.2.4 3 1.2-.5-1.8-1.5-2.7-3-2.7Z" />
      <circle cx="7" cy="7.5" r="1" fill="#FFFFFF" />
    `,
    heartEmpty: `<path stroke="rgba(255,255,255,0.3)" stroke-width="1.8" fill="rgba(255,255,255,0.06)" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,

    // Campana de Fantasía 2D
    bell: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
    bellFilled: `
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2" d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z"/>
      <path fill="#FFD700" stroke="#4A2600" stroke-width="1" d="M10 20a2 2 0 0 0 4 0h-4Z"/>
      <ellipse cx="9" cy="8" rx="2" ry="4" fill="rgba(255,255,255,0.7)" transform="rotate(-20 9 8)" />
      <path fill="#FF1744" stroke="#7A0012" stroke-width="0.8" d="M12 3.5c-1.5-1.5-3.5 0-2 1.5 1.5-1.5 3.5 0 2-1.5Z" />
    `,

    // Trofeos, Coronas y Premios
    trophy: `
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2" d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1" d="M6 4H4.5a2.5 2.5 0 0 0 0 5H6V4Zm12 0h1.5a2.5 2.5 0 0 1 0 5H18V4Z"/>
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1" d="M10 15v2c0 .6-.5 1-1 1.2-1.2.5-2 2-2 3.8h10c0-1.8-.8-3.3-2-3.8-.5-.2-1-.6-1-1.2v-2h-4Z"/>
      <circle cx="12" cy="7" r="1.8" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="0.6"/>
      <ellipse cx="9" cy="5" rx="1.5" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(-15 9 5)"/>
    `,
    crown: `
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.3" d="m2 5 3.5 11h13L22 5l-5 6-5-7-5 7-5-6Z"/>
      <rect x="5" y="16" width="14" height="3" rx="1.5" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1"/>
      <circle cx="12" cy="4" r="1.5" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="0.6"/>
      <circle cx="2" cy="5" r="1.2" fill="url(#${uid}-emerald)" stroke="#0E3812" stroke-width="0.5"/>
      <circle cx="22" cy="5" r="1.2" fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="0.5"/>
      <circle cx="9" cy="17.5" r="0.9" fill="url(#${uid}-ruby)"/>
      <circle cx="12" cy="17.5" r="0.9" fill="url(#${uid}-emerald)"/>
      <circle cx="15" cy="17.5" r="0.9" fill="url(#${uid}-cyan)"/>
    `,
    award: `<circle cx="12" cy="8" r="6" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2"/><path fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1" d="M15.5 13 17 22l-5-3-5 3 1.5-9"/><circle cx="12" cy="8" r="2.5" fill="rgba(255,255,255,0.5)"/>`,
    medal: `<circle cx="12" cy="14" r="6" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2"/><path fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1" d="m15.4 7.2 2.6-4.2H6l2.6 4.2"/><circle cx="12" cy="14" r="2.5" fill="url(#${uid}-ruby)"/>`,

    // Audio & Música (Stylized Neon & Wood)
    volumeOn: `
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" stroke="${color}" stroke-width="${strokeWidth}" />
      <path d="M19 5a10 10 0 0 1 0 14" stroke="${color}" stroke-width="${strokeWidth}" />
    `,
    volumeOff: `
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.2)" stroke="${color}" stroke-width="1.2" />
      <line x1="22" x2="16" y1="9" y2="15" stroke="#FF1744" stroke-width="2.4" stroke-linecap="round" />
      <line x1="16" x2="22" y1="9" y2="15" stroke="#FF1744" stroke-width="2.4" stroke-linecap="round" />
    `,
    music: `
      <path d="M9 18V5l12-2v13" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="6" cy="18" r="3.5" fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1"/>
      <circle cx="18" cy="16" r="3.5" fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1"/>
    `,
    guitar: `
      <path d="m14 8 2-2 5 5-2 2-5-5z" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1"/>
      <path d="M9.5 9.5 4 15c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0l5.5-5.5" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1"/>
      <circle cx="8" cy="16" r="2.2" fill="#1A0005" stroke="#FFD700" stroke-width="0.8"/>
    `,
    drum: `
      <ellipse cx="12" cy="7" rx="9" ry="4" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2"/>
      <path d="M3 7v10c0 2.2 4 4 9 4s9-1.8 9-4V7" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1.2"/>
      <path d="m5 9 7 4 7-4" stroke="#FFD700" stroke-width="1.5"/>
    `,

    // Menú y Navegación Fantasy
    menu: `
      <rect width="18" height="18" x="3" y="3" rx="4" fill="rgba(10,25,47,0.85)" stroke="url(#${uid}-gold)" stroke-width="1.5"/>
      <path d="M7 8h10M7 12h10M7 16h10" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
    `,
    grid: `
      <rect width="7" height="7" x="3" y="3" rx="2" fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1"/>
      <rect width="7" height="7" x="14" y="3" rx="2" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1"/>
      <rect width="7" height="7" x="14" y="14" rx="2" fill="url(#${uid}-emerald)" stroke="#0E3812" stroke-width="1"/>
      <rect width="7" height="7" x="3" y="14" rx="2" fill="url(#${uid}-purple)" stroke="#300052" stroke-width="1"/>
    `,
    arrowLeft: `<path d="m15 18-6-6 6-6" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    arrowRight: `<path d="m9 18 6-6-6-6" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    arrowUp: `<path d="m18 15-6-6-6 6" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    arrowDown: `<path d="m6 9 6 6 6-6" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,

    // Acciones y Botones Stylized
    play: `<polygon points="6 3 20 12 6 21 6 3" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2" />`,
    pause: `
      <rect x="6" y="4" width="4" height="16" rx="1.5" fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1" />
    `,
    stop: `<rect x="5" y="5" width="14" height="14" rx="3" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1.2" />`,
    replay: `<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8m0-5v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16m0 5h-5v-5" stroke="url(#${uid}-gold)" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    wrench: `<path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    clipboard: `<rect width="14" height="18" x="5" y="4" rx="2" fill="rgba(240,245,255,0.9)" stroke="#4A2600" stroke-width="1.2"/><rect width="8" height="4" x="8" y="2" rx="1.5" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1"/><path d="M9 10h6M9 14h6" stroke="#4A2600" stroke-width="1.2"/>`,
    trash: `<path fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1" d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14Z"/><path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="#FFD700" stroke-width="1.5"/>`,
    save: `<path fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1.2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><rect x="7" y="3" width="10" height="5" rx="1" fill="#FFFFFF"/><rect x="7" y="13" width="10" height="8" rx="1" fill="rgba(0,0,0,0.3)"/>`,
    check: `<polyline points="20 6 9 17 4 12" stroke="url(#${uid}-emerald)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    edit: `<path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1" d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#FFD700" stroke-width="1.5"/>`,

    // Estadísticas & Métricas Fantasy
    target: `
      <circle cx="12" cy="12" r="10" stroke="url(#${uid}-gold)" stroke-width="1.5" fill="rgba(10,25,47,0.5)"/>
      <circle cx="12" cy="12" r="6" stroke="url(#${uid}-ruby)" stroke-width="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2.5" fill="url(#${uid}-gold)"/>
    `,
    chart: `
      <rect x="4" y="13" width="3.5" height="7" rx="1" fill="url(#${uid}-emerald)"/>
      <rect x="10.25" y="8" width="3.5" height="12" rx="1" fill="url(#${uid}-gold)"/>
      <rect x="16.5" y="4" width="3.5" height="16" rx="1" fill="url(#${uid}-cyan)"/>
    `,
    flame: `
      <path fill="url(#${uid}-flame)" stroke="#801500" stroke-width="1" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      <circle cx="12" cy="15" r="2" fill="#FFF9C4"/>
    `,
    timer: `
      <circle cx="12" cy="14" r="8" fill="rgba(10,25,47,0.7)" stroke="url(#${uid}-gold)" stroke-width="1.5"/>
      <line x1="12" x2="15" y1="14" y2="11" stroke="#FFD700" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="10" x2="14" y1="2" y2="2" stroke="url(#${uid}-gold)" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" x2="12" y1="2" y2="6" stroke="url(#${uid}-gold)" stroke-width="1.5"/>
    `,
    gamepad: `
      <rect width="20" height="12" x="2" y="6" rx="6" fill="url(#${uid}-purple)" stroke="#FFD700" stroke-width="1.3"/>
      <line x1="6" x2="10" y1="12" y2="12" stroke="#FFFFFF" stroke-width="1.5"/>
      <line x1="8" x2="8" y1="10" y2="14" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="15" cy="13" r="1.2" fill="url(#${uid}-cyan)"/>
      <circle cx="18" cy="11" r="1.2" fill="url(#${uid}-ruby)"/>
    `,
    cards: `
      <rect width="11" height="16" x="2" y="4" rx="2" fill="url(#${uid}-ruby)" stroke="#FFD700" stroke-width="1.2"/>
      <rect width="11" height="16" x="11" y="4" rx="2" fill="url(#${uid}-cyan)" stroke="#FFD700" stroke-width="1.2"/>
      <circle cx="7.5" cy="12" r="1.5" fill="#FFD700"/>
      <circle cx="16.5" cy="12" r="1.5" fill="#FFD700"/>
    `,

    // Efectos Mágicos y Navidad
    sparkles: `
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="0.8" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
      <circle cx="12" cy="12" r="1.8" fill="#FFFFFF"/>
      <path fill="url(#${uid}-cyan)" d="m19 17-.6 1.8-.7.3.7.3.6 1.8.6-1.8.7-.3-.7-.3-.6-1.8Z"/>
      <path fill="url(#${uid}-gold)" d="m5 3-.6 1.8-.7.3.7.3.6 1.8.6-1.8.7-.3-.7-.3-.6-1.8Z"/>
    `,
    star: `
      <polygon fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="1.2" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      <circle cx="12" cy="12" r="2.2" fill="rgba(255,255,255,0.7)"/>
    `,
    gift: `
      <rect x="3" y="8" width="18" height="4" rx="1.5" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1"/>
      <rect x="4" y="12" width="16" height="9" rx="1.5" fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1"/>
      <rect x="10.5" y="8" width="3" height="13" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="0.8"/>
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="0.8" d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5Z"/>
      <circle cx="12" cy="7" r="1.2" fill="#FFFFFF"/>
    `,
    snowflake: `
      <line x1="2" x2="22" y1="12" y2="12" stroke="url(#${uid}-cyan)" stroke-width="2"/>
      <line x1="12" x2="12" y1="2" y2="22" stroke="url(#${uid}-cyan)" stroke-width="2"/>
      <path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="2" fill="url(#${uid}-cyan)"/>
    `,
    zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="url(#${uid}-gold)" stroke="#FF6F00" stroke-width="1.2"/>`,
    tree: `
      <path fill="url(#${uid}-emerald)" stroke="#0E3812" stroke-width="1.2" d="M12 2 5 12h4l-3 6h12l-3-6h4L12 2z"/>
      <rect x="10.5" y="18" width="3" height="4" rx="0.5" fill="#5D4037" stroke="#3E2723" stroke-width="0.8"/>
      <circle cx="12" cy="2" r="1.5" fill="url(#${uid}-gold)"/>
      <circle cx="8" cy="10" r="1.2" fill="url(#${uid}-ruby)"/>
      <circle cx="16" cy="10" r="1.2" fill="url(#${uid}-gold)"/>
      <circle cx="10" cy="15" r="1.2" fill="url(#${uid}-cyan)"/>
      <circle cx="14" cy="15" r="1.2" fill="url(#${uid}-ruby)"/>
    `,
    tent: `
      <path fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1.2" d="M12 2 2 22h20L12 2Z"/>
      <path fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="0.8" d="M12 2 8 22h3l1-20Zm0 0 4 20h-3l-1-20Z"/>
      <rect x="2" y="20" width="20" height="2.5" fill="url(#${uid}-gold)" stroke="#4A2600" stroke-width="0.8"/>
      <polygon points="12 0 15 2 12 4" fill="#FFD700"/>
    `,
    wing: `
      <path fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1.2" d="M16 3c-4.4 0-8 3.6-8 8 0 4.4 3.6 8 8 8 3.5 0 6.5-2.2 7.6-5.4A8 8 0 0 0 16 3z"/>
      <path fill="url(#${uid}-cyan)" stroke="#013A6B" stroke-width="1" d="M2 13c1.6 3 4.6 5 8 5M4 8c2.2 3 5.4 5 9 5"/>
      <ellipse cx="14" cy="8" rx="2" ry="4" fill="rgba(255,255,255,0.6)" transform="rotate(25 14 8)"/>
    `,
    candy: `
      <path fill="url(#${uid}-ruby)" stroke="#4A000E" stroke-width="1.2" d="M18.5 5.5a4.5 4.5 0 0 0-6.4 0L4 13.6a3.5 3.5 0 1 0 5 5l4.5-4.5"/>
      <path d="m8 9.5 3 3M11 6.5l3 3M14 12.5l3 3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    `
  };

  const body = icons[name] || icons.sparkles;
  const filterAttr = glow ? `filter="url(#${uid}-glow)"` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${filterAttr} ${className}>${defs}${body}</svg>`;
}
