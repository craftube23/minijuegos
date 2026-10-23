/**
 * ==============================================================================
 * CONFIGURACIÓN DE IDENTIDAD Y LOGOS - FERIA MÁGICA DEL JUGUETE
 * ==============================================================================
 * 
 * Este archivo centraliza la configuración de marcas y logos del proyecto.
 * Para cambiar un logo en el futuro:
 *   1. Guarda tu nueva imagen en la carpeta `public/assets/logos/` (por ejemplo: `mi-logo.png` o `.svg`)
 *   2. Actualiza la ruta aquí abajo en `logo1` o `logo2`.
 * 
 * ¡Listo! Todo el sistema (menús, power-ups, cartas, pantallas de victoria)
 * utilizará automáticamente el nuevo logo sin necesidad de tocar el código de los juegos.
 */

export interface LogoConfig {
  id: string;
  name: string;
  shortName: string;
  path: string;       // Ruta al archivo en la carpeta public/
  alt: string;
  themeColor: string; // Color distintivo para efectos de partículas y auras
  accentColor: string; // Color secundario para bordes o texto
  bonusMultiplier: number; // Multiplicador cuando aparece como Power-Up
  tagline?: string;
}

export const SPONSOR_CATALOG: Record<string, LogoConfig> = {
  feria: {
    id: "logo-feria",
    name: "Feria Mágica del Juguete",
    shortName: "Feria Mágica",
    path: "./assets/logos/Feria-magica-del-jugete-sin-fondo.webp",
    alt: "Feria Mágica del Juguete",
    themeColor: "#FFD700",
    accentColor: "#C92A2A",
    bonusMultiplier: 2,
    tagline: "¡Donde la magia cobra vida!"
  },
  campus: {
    id: "logo-campus",
    name: "Campuslands",
    shortName: "Campuslands",
    path: "./assets/logos/clean-campuslands.webp",
    alt: "Campuslands - Colaborador Oficial",
    themeColor: "#00E5FF",
    accentColor: "#0055FF",
    bonusMultiplier: 2,
    tagline: "Talento Tech y Educación"
  },
  cajasan: {
    id: "logo-cajasan",
    name: "Cajasan",
    shortName: "Cajasan",
    path: "./assets/logos/clean-cajasan.webp",
    alt: "Cajasan - Patrocinador Oficial",
    themeColor: "#38BDF8",
    accentColor: "#0B4F9C",
    bonusMultiplier: 2,
    tagline: "Bienestar para tu Familia"
  },
  practi: {
    id: "logo-practi",
    name: "Practi Arepa",
    shortName: "Practi Arepa",
    path: "./assets/logos/clean-practi-arepa.webp",
    alt: "Practi Arepa - Patrocinador Oficial",
    themeColor: "#FBBF24",
    accentColor: "#DC2626",
    bonusMultiplier: 2,
    tagline: "Sabor y Tradición Santandereana"
  },
  mariposa: {
    id: "logo-mariposa",
    name: "Dulces Mariposa",
    shortName: "Dulces Mariposa",
    path: "./assets/logos/clean-mariposa.webp",
    alt: "Dulces Mariposa - Patrocinador Oficial",
    themeColor: "#F472B6",
    accentColor: "#EC4899",
    bonusMultiplier: 2,
    tagline: "Dulzura y Tradición"
  },
  angelus: {
    id: "logo-angelus",
    name: "Ángelus Seguridad",
    shortName: "Ángelus",
    path: "./assets/logos/clean-angelus.webp",
    alt: "Ángelus Seguridad - Patrocinador Oficial",
    themeColor: "#94A3B8",
    accentColor: "#1E3A8A",
    bonusMultiplier: 2,
    tagline: "Protección y Tranquilidad"
  },
  factor: {
    id: "logo-factor",
    name: "Factor Humano",
    shortName: "Factor Humano",
    path: "./assets/logos/clean-factor-humano.webp",
    alt: "Factor Humano - Patrocinador Oficial",
    themeColor: "#EF4444",
    accentColor: "#991B1B",
    bonusMultiplier: 2,
    tagline: "Potenciando el Talento"
  },
  fundalas: {
    id: "logo-fundalas",
    name: "Fundalas",
    shortName: "Fundalas",
    path: "./assets/logos/clean-fundalas.webp",
    alt: "Fundalas - Patrocinador Oficial",
    themeColor: "#10B981",
    accentColor: "#047857",
    bonusMultiplier: 2,
    tagline: "Solidaridad y Esperanza"
  },
  imebu: {
    id: "logo-imebu",
    name: "IMEBU & Alcaldía de Bucaramanga",
    shortName: "IMEBU",
    path: "./assets/logos/clean-imebu.webp",
    alt: "IMEBU - Alcaldía de Bucaramanga",
    themeColor: "#34D399",
    accentColor: "#059669",
    bonusMultiplier: 2,
    tagline: "Apoyando el Emprendimiento"
  }
};

export const BRANDING = {
  fairName: "Feria Mágica del Juguete",
  fairTagline: "Una experiencia mágica para toda la familia",
  
  // Lista de logos intercambiables (compatibilidad estricta con código previo)
  logos: {
    logo1: SPONSOR_CATALOG.feria,
    logo2: SPONSOR_CATALOG.campus,
    collaborator: SPONSOR_CATALOG.campus
  },

  // Catálogo completo de patrocinadores
  sponsors: SPONSOR_CATALOG,
  
  /**
   * Helper para obtener la ruta rápida de un logo (1, 2, o clave de patrocinador)
   */
  getLogoPath(numOrKey: 1 | 2 | string = 1): string {
    if (numOrKey === 1) return this.logos.logo1.path;
    if (numOrKey === 2) return this.logos.logo2.path;
    const item = SPONSOR_CATALOG[numOrKey] || Object.values(SPONSOR_CATALOG).find(s => s.id === numOrKey);
    return item ? item.path : this.logos.logo1.path;
  },

  /**
   * Helper para obtener el logo del colaborador
   */
  getCollaboratorLogoPath(): string {
    return this.logos.collaborator.path;
  },

  /**
   * Helper para obtener la configuración completa del logo (por 1, 2 o ID de patrocinador)
   */
  getLogoConfig(numOrKey: 1 | 2 | string = 1): LogoConfig {
    if (numOrKey === 1 || numOrKey === "1") return this.logos.logo1;
    if (numOrKey === 2 || numOrKey === "2") return this.logos.logo2;
    const item = SPONSOR_CATALOG[numOrKey] || Object.values(SPONSOR_CATALOG).find(s => s.id === numOrKey || s.shortName.toLowerCase() === String(numOrKey).toLowerCase());
    return item || this.logos.logo1;
  },

  /**
   * Retorna la lista de todos los patrocinadores oficiales
   */
  getAllSponsors(): LogoConfig[] {
    return Object.values(SPONSOR_CATALOG);
  },

  /**
   * Retorna un patrocinador aleatorio (opcionalmente excluyendo IDs)
   */
  getRandomSponsor(excludeIds: string[] = []): LogoConfig {
    const pool = Object.values(SPONSOR_CATALOG).filter(s => !excludeIds.includes(s.id));
    if (pool.length === 0) return SPONSOR_CATALOG.feria;
    return pool[Math.floor(Math.random() * pool.length)];
  }
};
