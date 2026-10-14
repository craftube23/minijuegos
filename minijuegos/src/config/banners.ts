/**
 * ==============================================================================
 * CONFIGURACIÓN DE LA CAMPAÑA PUBLICITARIA (BANNERS INFERIORES)
 * ==============================================================================
 *
 * Estructura promocional mixta (Evento + Patrocinadores Oficiales):
 * - 4 Carteles Promocionales de la Feria Mágica del Juguete intercalados cada
 *   2 patrocinadores para mantener presencia constante del evento (fechas,
 *   ubicación en el Centro Cultural del Oriente frente al Parque Centenario,
 *   experiencia familiar y zona interactiva).
 * - 8 Carteles Individuales de Patrocinador Oficial (las 8 marcas del bloque "PATROCINAN"),
 *   que además incluyen co-branding visual del evento (emblema y fechas de la Feria).
 */

export type BannerType = "official-event" | "hero-billboard";

export type LogoFitMode =
  | "standard"
  | "trim-horizontal"
  | "trim-vertical"
  | "corporate-blue";

export interface SponsorLogo {
  src: string;
  alt: string;
  name: string;
  fitMode?: LogoFitMode;
}

export interface BannerSlide {
  id: string;
  type: BannerType;
  title: string;
  subtitle: string;
  badgeText?: string;
  socialTag?: string;
  topIcon?: string;
  bottomIcon?: string;
  eventReminder?: string;
  accentColor: string;
  bgGradient: string;
  logos: SponsorLogo[];
  statusNote: "CONFIRMADO_AFICHE" | "CONFIRMADO_LOGO" | "PENDIENTE_APROBACION_SLOGAN";
}

export const BANNER_CONFIG = {
  // Intervalo de rotación automática de 5.0 segundos por cartel
  rotationIntervalMs: 5000,

  slides: [
    // =========================================================================
    // EVENTO 1/4: FECHAS Y UBICACIÓN OFICIAL DE LA FERIA
    // =========================================================================
    {
      id: "official-event-info",
      type: "official-event",
      title: "DEL 1 AL 24 DE DICIEMBRE",
      subtitle: "Centro Cultural del Oriente (Frente al Parque Centenario)",
      badgeText: "¡NOS VEMOS EN LA FERIA!",
      socialTag: "@FeriaMagicaJuguete",
      topIcon: "📅",
      bottomIcon: "📍",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #2A0712 0%, #68122B 50%, #2A0712 100%)",
      logos: [
        {
          src: "./assets/logos/Feria-magica-del-jugete-sin-fondo.png",
          alt: "Feria Mágica del Juguete - Donde vive la magia",
          name: "FERIA MÁGICA DEL JUGUETE",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 1/8: FUNDALAS
    {
      id: "hero-fundalas",
      type: "hero-billboard",
      title: "FUNDALAS",
      subtitle: "Patrocinador Oficial • Feria Mágica del Juguete (1 al 24 de Dic)",
      badgeText: "★ PATROCINAN",
      eventReminder: "📍 Centro Cultural del Oriente",
      accentColor: "#38BDF8",
      bgGradient: "linear-gradient(90deg, #04192E 0%, #0A365C 50%, #04192E 100%)",
      logos: [
        {
          src: "./assets/logos/Logo-Fundalas-sin-fondo.png",
          alt: "Logotipo oficial de Fundalas",
          name: "FUNDALAS",
          fitMode: "trim-horizontal"
        }
      ],
      statusNote: "PENDIENTE_APROBACION_SLOGAN"
    },

    // PATROCINADOR OFICIAL 2/8: FACTOR HUMANO S.A.S.
    {
      id: "hero-factor-humano",
      type: "hero-billboard",
      title: "FACTOR HUMANO S.A.S.",
      subtitle: "Patrocinador Oficial • Feria Mágica del Juguete (1 al 24 de Dic)",
      badgeText: "★ PATROCINAN",
      eventReminder: "📍 Centro Cultural del Oriente",
      accentColor: "#FF5252",
      bgGradient: "linear-gradient(90deg, #1F070E 0%, #420F1E 50%, #1F070E 100%)",
      logos: [
        {
          src: "./assets/logos/logo-actor-humano-sin-fondo.png",
          alt: "Logotipo oficial de Factor Humano S.A.S.",
          name: "FACTOR HUMANO S.A.S.",
          fitMode: "standard"
        }
      ],
      statusNote: "PENDIENTE_APROBACION_SLOGAN"
    },

    // =========================================================================
    // EVENTO 2/4: EXPERIENCIA FAMILIAR — DONDE VIVE LA MAGIA
    // =========================================================================
    {
      id: "official-event-experience",
      type: "official-event",
      title: "FERIA MÁGICA DEL JUGUETE • DONDE VIVE LA MAGIA",
      subtitle: "Juguetes, luces, tradición y alegría navideña para toda la familia",
      badgeText: "✨ VIVE LA MAGIA",
      socialTag: "1 al 24 de Dic • Bucaramanga",
      topIcon: "🎄",
      bottomIcon: "🎁",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #072A18 0%, #115E36 50%, #072A18 100%)",
      logos: [
        {
          src: "./assets/logos/Feria-magica-del-jugete-sin-fondo.png",
          alt: "Feria Mágica del Juguete - Donde vive la magia",
          name: "FERIA MÁGICA DEL JUGUETE",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 3/8: CAMPUSLANDS
    {
      id: "hero-campuslands",
      type: "hero-billboard",
      title: "CAMPUSLANDS",
      subtitle: "Patrocinador Oficial • Feria Mágica del Juguete (1 al 24 de Dic)",
      badgeText: "★ PATROCINAN",
      eventReminder: "📍 Centro Cultural del Oriente",
      accentColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #041224 0%, #08284D 50%, #041224 100%)",
      logos: [
        {
          src: "./assets/logos/logo-campus-sin-fondo.png",
          alt: "Logotipo oficial de Campuslands",
          name: "CAMPUSLANDS",
          fitMode: "standard"
        }
      ],
      statusNote: "PENDIENTE_APROBACION_SLOGAN"
    },

    // PATROCINADOR OFICIAL 4/8: ÁNGELUS SEGURIDAD LTDA.
    {
      id: "hero-angelus",
      type: "hero-billboard",
      title: "ANGELUS SEGURIDAD LTDA",
      subtitle: "Patrocinador Oficial • Feria Mágica del Juguete (1 al 24 de Dic)",
      badgeText: "★ PATROCINAN",
      eventReminder: "📍 Centro Cultural del Oriente",
      accentColor: "#E2E8F0",
      bgGradient: "linear-gradient(90deg, #061326 0%, #0E294D 50%, #061326 100%)",
      logos: [
        {
          src: "./assets/logos/logo-Angelus-sin-fondo.png",
          alt: "Logotipo oficial de Angelus Seguridad Ltda",
          name: "ANGELUS SEGURIDAD LTDA",
          fitMode: "standard"
        }
      ],
      statusNote: "PENDIENTE_APROBACION_SLOGAN"
    },

    // =========================================================================
    // EVENTO 3/4: ZONA DE JUEGOS, JUGUETES Y SORPRESAS
    // =========================================================================
    {
      id: "official-event-games",
      type: "official-event",
      title: "¡GRAN FERIA DE JUGUETES, JUEGOS Y SORPRESAS!",
      subtitle: "Visítanos frente al Parque Centenario • Centro Cultural del Oriente",
      badgeText: "🎪 ENTRADA FAMILIAR",
      socialTag: "@FeriaMagicaJuguete",
      topIcon: "🧸",
      bottomIcon: "📍",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #1E0B36 0%, #4A157A 50%, #1E0B36 100%)",
      logos: [
        {
          src: "./assets/logos/Feria-magica-del-jugete-sin-fondo.png",
          alt: "Feria Mágica del Juguete",
          name: "FERIA MÁGICA DEL JUGUETE",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 5/8: PRACTI AREPA
    {
      id: "hero-practi-arepa",
      type: "hero-billboard",
      title: "PRACTI AREPA",
      subtitle: "La auténtica y Tradicional • Patrocinador Oficial de la Feria",
      badgeText: "★ PATROCINAN",
      eventReminder: "📅 Del 1 al 24 de Diciembre",
      accentColor: "#FFB300",
      bgGradient: "linear-gradient(90deg, #240C05 0%, #4D1A0A 50%, #240C05 100%)",
      logos: [
        {
          src: "./assets/logos/logo-preza-arepa-sin-fondo.png",
          alt: "Logotipo oficial de Practi Arepa - La auténtica y Tradicional",
          name: "PRACTI AREPA",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_LOGO"
    },

    // PATROCINADOR OFICIAL 6/8: DULCES MARIPOSA
    {
      id: "hero-mariposa",
      type: "hero-billboard",
      title: "DULCES MARIPOSA",
      subtitle: "Patrocinador Oficial • Feria Mágica del Juguete (1 al 24 de Dic)",
      badgeText: "★ PATROCINAN",
      eventReminder: "📍 Centro Cultural del Oriente",
      accentColor: "#FFD500",
      bgGradient: "linear-gradient(90deg, #26060E 0%, #4D1020 50%, #26060E 100%)",
      logos: [
        {
          src: "./assets/logos/clean-mariposa.png",
          alt: "Logotipo oficial de Dulces Mariposa",
          name: "DULCES MARIPOSA",
          fitMode: "standard"
        }
      ],
      statusNote: "PENDIENTE_APROBACION_SLOGAN"
    },

    // =========================================================================
    // EVENTO 4/4: INVITACIÓN ESPECIAL DE DICIEMBRE
    // =========================================================================
    {
      id: "official-event-invite",
      type: "official-event",
      title: "¡EL PLAN NAVIDEÑO IMPERDIBLE EN BUCARAMANGA!",
      subtitle: "Del 1 al 24 de Diciembre • Centro Cultural del Oriente",
      badgeText: "🎅 ¡TE ESPERAMOS!",
      socialTag: "Donde vive la magia",
      topIcon: "🌟",
      bottomIcon: "📅",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #330814 0%, #7A142E 50%, #330814 100%)",
      logos: [
        {
          src: "./assets/logos/Feria-magica-del-jugete-sin-fondo.png",
          alt: "Feria Mágica del Juguete",
          name: "FERIA MÁGICA DEL JUGUETE",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 7/8: CAJASAN
    {
      id: "hero-cajasan",
      type: "hero-billboard",
      title: "CAJASAN",
      subtitle: "Patrocinador Oficial • Feria Mágica del Juguete (1 al 24 de Dic)",
      badgeText: "★ PATROCINAN",
      eventReminder: "📍 Centro Cultural del Oriente",
      accentColor: "#FFA000",
      bgGradient: "linear-gradient(90deg, #051833 0%, #0C2E5E 50%, #051833 100%)",
      logos: [
        {
          src: "./assets/logos/logo-cajasan.png",
          alt: "Logotipo oficial de Cajasan",
          name: "CAJASAN",
          fitMode: "corporate-blue"
        }
      ],
      statusNote: "PENDIENTE_APROBACION_SLOGAN"
    },

    // PATROCINADOR OFICIAL 8/8: ALCALDÍA DE BUCARAMANGA & IMEBU
    {
      id: "hero-imebu",
      type: "hero-billboard",
      title: "ALCALDÍA DE BUCARAMANGA • IMEBU",
      subtitle: "Instituto Municipal de Empleo y Fomento Empresarial de Bucaramanga",
      badgeText: "★ PATROCINAN",
      eventReminder: "📅 Feria: 1 al 24 de Dic",
      accentColor: "#00E676",
      bgGradient: "linear-gradient(90deg, #041B12 0%, #0A3D27 50%, #041B12 100%)",
      logos: [
        {
          src: "./assets/logos/logo-imebu-sin-fondo.png",
          alt: "Alcaldía de Bucaramanga e IMEBU - Instituto Municipal de Empleo y Fomento Empresarial",
          name: "IMEBU",
          fitMode: "trim-vertical"
        }
      ],
      statusNote: "CONFIRMADO_LOGO"
    }
  ] as BannerSlide[]
};
