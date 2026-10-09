/**
 * ==============================================================================
 * ICON UTILITIES - FERIA MÁGICA DEL JUGUETE
 * ==============================================================================
 * Reemplazo 100% vectorial de emojis por iconos SVG nítidos de alta definición.
 */

export interface IconOptions {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

/**
 * Generador de SVGs optimizados para interfaz de Kiosco & Web
 */
export function getIconSvg(name: string, options: IconOptions = {}): string {
  const size = options.size || 24;
  const color = options.color || "currentColor";
  const strokeWidth = options.strokeWidth || 2.2;
  const className = options.className ? `class="${options.className}"` : "";
  const fill = options.fill || "none";

  const icons: Record<string, string> = {
    // Vidas / Salud
    heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
    heartFilled: `<path fill="${color}" stroke="${color}" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
    heartEmpty: `<path stroke="rgba(255,255,255,0.3)" fill="none" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
    bell: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
    bellFilled: `<path fill="${fill === 'none' ? color : fill}" d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,

    // Trofeos y Premios
    trophy: `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`,
    award: `<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>`,
    crown: `<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>`,
    medal: `<circle cx="12" cy="14" r="6"/><path d="m15.4 7.2 2.6-4.2H6l2.6 4.2"/><path d="m10.8 11.8 1.2-2 1.2 2"/>`,

    // Audio & Música
    volumeOn: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />`,
    volumeOff: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" />`,
    music: `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,
    guitar: `<path d="m14 8 2-2 5 5-2 2-5-5z"/><path d="m11 11 3 3"/><path d="M9.5 9.5 4 15c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0l5.5-5.5"/><circle cx="8" cy="16" r="2"/>`,
    trumpet: `<path d="M4 14v4h3l9 4V2L7 6H4v4"/><path d="M16 10v4"/><path d="M19 8v8"/>`,
    drum: `<ellipse cx="12" cy="7" rx="9" ry="4"/><path d="M3 7v10c0 2.2 4 4 9 4s9-1.8 9-4V7"/><path d="m5 9 7 4 7-4"/>`,

    // Menú y Navegación
    menu: `<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" />`,
    grid: `<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>`,
    arrowLeft: `<path d="m15 18-6-6 6-6"/>`,
    arrowRight: `<path d="m9 18 6-6-6-6"/>`,
    arrowUp: `<path d="m18 15-6-6-6 6"/>`,
    arrowDown: `<path d="m6 9 6 6 6-6"/>`,

    // Acciones y Controles
    play: `<polygon fill="${fill === 'none' ? color : fill}" points="6 3 20 12 6 21 6 3"/>`,
    pause: `<rect x="6" y="4" width="4" height="16" rx="1" fill="${fill === 'none' ? color : fill}"/><rect x="14" y="4" width="4" height="16" rx="1" fill="${fill === 'none' ? color : fill}"/>`,
    stop: `<rect x="5" y="5" width="14" height="14" rx="2" fill="${fill === 'none' ? color : fill}"/>`,
    replay: `<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>`,
    wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    clipboard: `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>`,
    trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
    save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`,
    check: `<polyline points="20 6 9 17 4 12"/>`,
    edit: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,

    // Estadísticas & Métricas
    target: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
    chart: `<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>`,
    flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
    timer: `<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>`,
    gamepad: `<line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="6"/>`,
    cards: `<rect width="14" height="18" x="2" y="3" rx="2"/><path d="M6 3v18"/><path d="M18 7v14a2 2 0 0 1-2 2H8"/>`,

    // Efectos Mágicos y Navidad
    sparkles: `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>`,
    star: `<polygon fill="${fill === 'none' ? color : fill}" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    gift: `<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>`,
    snowflake: `<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>`,
    zap: `<polygon fill="${fill === 'none' ? color : fill}" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    tree: `<path d="M12 2 5 12h4l-3 6h12l-3-6h4L12 2z"/><path d="M12 18v4"/>`,
    layers: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
    tent: `<path d="M12 2 2 22h20L12 2Z"/><path d="m12 2 5 20"/><path d="m12 2-5 20"/><path d="M2 22h20"/>`,
    wing: `<path d="M16 3c-4.4 0-8 3.6-8 8 0 4.4 3.6 8 8 8 3.5 0 6.5-2.2 7.6-5.4A8.01 8.01 0 0 0 16 3z"/><path d="M2 13c1.6 3 4.6 5 8 5"/><path d="M4 8c2.2 3 5.4 5 9 5"/>`,
    candy: `<path d="M18.5 5.5a4.5 4.5 0 0 0-6.4 0L4 13.6a3.5 3.5 0 1 0 5 5l4.5-4.5"/><path d="m8 9.5 3 3"/><path d="m11 6.5 3 3"/>`
  };

  const body = icons[name] || icons.sparkles;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${className}>${body}</svg>`;
}

