/**
 * ==============================================================================
 * CONFIGURACIÓN DE LA CAMPAÑA PUBLICITARIA (BANNERS INFERIORES)
 * ==============================================================================
 *
 * Estructura promocional mixta (Evento + Patrocinadores Oficiales):
 * - 6 Carteles de Alto Impacto de la Feria Mágica del Juguete.
 * - 8 Carteles Comerciales de Patrocinadores Oficiales con propuestas de valor vibrantes.
 * - Tipografías navideñas de alto rendimiento, súper nítidas y legibles.
 * - Paletas cromáticas navideñas exclusivas y cero emojis (100% iconos SVG vectoriales).
 * - Highlights informativos enriquecidos para ocupar armónicamente el espacio panorámico.
 */

import type { BannerIconName } from "../utils/bannerIcons";

export type BannerType = "official-event" | "hero-billboard";

export type LogoFitMode =
  | "standard"
  | "compact"
  | "trim-horizontal"
  | "trim-vertical"
  | "corporate-blue";

export interface SponsorLogo {
  src: string;
  alt: string;
  name: string;
  fitMode?: LogoFitMode;
}

export interface BannerHighlight {
  label: string;
  icon?: BannerIconName;
}

export interface BannerSlide {
  id: string;
  type: BannerType;
  themeClass: string;
  kickerText?: string;
  kickerIcon?: BannerIconName;
  title: string;
  titleIcon?: BannerIconName;
  subtitle: string;
  subtitleIcon?: BannerIconName;
  highlights?: BannerHighlight[];
  badgeText?: string;
  badgeIcon?: BannerIconName;
  ctaText?: string;
  ctaIcon?: BannerIconName;
  accentColor: string;
  bgGradient: string;
  bgImage?: string;
  logos: SponsorLogo[];
  statusNote: "CONFIRMADO_AFICHE" | "CONFIRMADO_LOGO" | "PENDIENTE_APROBACION_SLOGAN";
}

export const BANNER_CONFIG = {
  // Rotación dinámica cada 6.2 segundos para lectura placentera y dinamismo festivo
  rotationIntervalMs: 6200,

  slides: [
    // =========================================================================
    // EVENTO 1/6: FECHAS Y UBICACIÓN OFICIAL DE LA FERIA
    // =========================================================================
    {
      id: "official-event-info",
      type: "official-event",
      themeClass: "theme-official-royal",
      kickerText: "GRAN APERTURA NAVIDEÑA • BUCARAMANGA",
      kickerIcon: "calendar",
      title: "¡DEL 1 AL 24 DE DICIEMBRE • ENTRADA 100% LIBRE!",
      titleIcon: "ticket",
      subtitle: "Centro Cultural del Oriente • Abierto todos los días de 10:00 AM a 9:00 PM con atracciones para toda la familia.",
      subtitleIcon: "map-pin",
      highlights: [
        { label: "Entrada Gratuita", icon: "ticket" },
        { label: "Centro Cultural del Oriente", icon: "map-pin" },
        { label: "10:00 AM a 9:00 PM", icon: "calendar" }
      ],
      badgeText: "ACCESO LIBRE",
      badgeIcon: "star",
      ctaText: "¡El punto de encuentro navideño de la ciudad!",
      ctaIcon: "sparkles",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #2A0712 0%, #68122B 50%, #2A0712 100%)",
      bgImage: "./assets/banners/8.png",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.webp",
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
      themeClass: "theme-fundalas-charity",
      kickerText: "CAMPAÑA NAVIDAD CON CORAZÓN",
      kickerIcon: "heart",
      title: "¡DIBUJA UNA SONRISA EN UN NIÑO ESTA NAVIDAD!",
      titleIcon: "gift",
      subtitle: "Apoya nuestros comedores comunitarios, entrega de juguetes y programas de formación integral en Santander.",
      subtitleIcon: "heart-handshake",
      highlights: [
        { label: "Comedores Infantiles", icon: "heart" },
        { label: "Kits y Juguetes Navideños", icon: "gift" },
        { label: "Santander Solidario", icon: "heart-handshake" }
      ],
      badgeText: "UNIDOS POR LA NIÑEZ",
      badgeIcon: "award",
      ctaText: "Visita el punto de donaciones en la feria",
      ctaIcon: "arrow-right",
      accentColor: "#38BDF8",
      bgGradient: "linear-gradient(90deg, #04192E 0%, #0A365C 50%, #04192E 100%)",
      bgImage: "./assets/banners/7.png",
      logos: [
        {
          src: "./assets/logos/horiz-fundalas.webp",
          alt: "Logotipo oficial de Fundalas",
          name: "FUNDALAS",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 2/8: FACTOR HUMANO S.A.S.
    {
      id: "hero-factor-humano",
      type: "hero-billboard",
      themeClass: "theme-factor-talent",
      kickerText: "POTENCIA EL CRECIMIENTO DE TU NEGOCIO",
      kickerIcon: "trending-up",
      title: "¡EL MEJOR EQUIPO HUMANO PARA TU EMPRESA EN 2027!",
      titleIcon: "briefcase",
      subtitle: "Headhunting especializado, selección por competencias, baterías psicotécnicas y consultoría de productividad.",
      subtitleIcon: "award",
      highlights: [
        { label: "Headhunting de Élite", icon: "briefcase" },
        { label: "Pruebas Psicotécnicas", icon: "award" },
        { label: "Consultoría Empresarial", icon: "trending-up" }
      ],
      badgeText: "TALENTO LÍDER",
      badgeIcon: "star",
      ctaText: "Diagnóstico organizacional gratuito para empresas",
      ctaIcon: "phone-call",
      accentColor: "#FF5252",
      bgGradient: "linear-gradient(90deg, #1F070E 0%, #420F1E 50%, #1F070E 100%)",
      bgImage: "./assets/banners/4.png",
      logos: [
        {
          src: "./assets/logos/horiz-factor-humano.webp",
          alt: "Logotipo oficial de Factor Humano S.A.S.",
          name: "FACTOR HUMANO S.A.S.",
          fitMode: "compact"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // =========================================================================
    // EVENTO 2/6: EXPERIENCIA FAMILIAR — DONDE VIVE LA MAGIA
    // =========================================================================
    {
      id: "official-event-experience",
      type: "official-event",
      themeClass: "theme-village-fantasy",
      kickerText: "LA EXPERIENCIA MÁS MÁGICA DEL AÑO",
      kickerIcon: "sparkles",
      title: "¡LA FIESTA NAVIDEÑA MÁS MÁGICA DE SANTANDER!",
      titleIcon: "party-popper",
      subtitle: "Vive la nevada artificial cada noche, el majestuoso túnel de luces LED, coros en vivo y los personajes de la Navidad.",
      subtitleIcon: "star",
      highlights: [
        { label: "Nevada Artificial Diaria", icon: "sparkles" },
        { label: "Túnel de Luces LED", icon: "star" },
        { label: "Coros y Personajes en Vivo", icon: "party-popper" }
      ],
      badgeText: "PLAN FAMILIAR",
      badgeIcon: "ticket",
      ctaText: "Un mundo de fantasía e ilusión frente al Parque Centenario",
      ctaIcon: "sparkles",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #072A18 0%, #115E36 50%, #072A18 100%)",
      bgImage: "./assets/banners/5.png",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.webp",
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
      themeClass: "theme-campus-cyber",
      kickerText: "REVOLUCIÓN TECH EN SANTANDER",
      kickerIcon: "rocket",
      title: "¡BECA 100% EN PROGRAMACIÓN DE SOFTWARE E IA!",
      titleIcon: "zap",
      subtitle: "Fórmate como desarrollador de software de clase mundial desde cero y trabaja con empresas líderes globales.",
      subtitleIcon: "award",
      highlights: [
        { label: "Beca 100% Gratuita", icon: "rocket" },
        { label: "Inteligencia Artificial & Web", icon: "zap" },
        { label: "Empleo Tech Internacional", icon: "award" }
      ],
      badgeText: "TALENTO GLOBAL",
      badgeIcon: "star",
      ctaText: "Aplica a las becas en campuslands.com",
      ctaIcon: "arrow-right",
      accentColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #041224 0%, #08284D 50%, #041224 100%)",
      bgImage: "./assets/banners/1.png",
      logos: [
        {
          src: "./assets/logos/horiz-campuslands.webp",
          alt: "Logotipo oficial de Campuslands",
          name: "CAMPUSLANDS",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 4/8: ÁNGELUS SEGURIDAD LTDA.
    {
      id: "hero-angelus",
      type: "hero-billboard",
      themeClass: "theme-angelus-shield",
      kickerText: "TRANQUILIDAD ABSOLUTA EN ESTAS FIESTAS",
      kickerIcon: "shield-check",
      title: "¡SEGURIDAD DE ÉLITE Y MONITOREO INTELIGENTE 24/7!",
      titleIcon: "shield",
      subtitle: "Protegemos hogares, empresas y eventos con videovigilancia satelital, alarmas inteligentes y patrullaje motorizado.",
      subtitleIcon: "shield-check",
      highlights: [
        { label: "Monitoreo Central 24/7", icon: "shield-check" },
        { label: "Cámaras con IA Satelital", icon: "shield" },
        { label: "Respuesta Rápida Inmediata", icon: "award" }
      ],
      badgeText: "PROTECCIÓN TOTAL",
      badgeIcon: "award",
      ctaText: "Cotiza tu esquema con tarifas especiales de fin de año",
      ctaIcon: "phone-call",
      accentColor: "#E2E8F0",
      bgGradient: "linear-gradient(90deg, #061326 0%, #0E294D 50%, #061326 100%)",
      bgImage: "./assets/banners/11.png",
      logos: [
        {
          src: "./assets/logos/horiz-angelus.webp",
          alt: "Logotipo oficial de Angelus Seguridad Ltda",
          name: "ANGELUS SEGURIDAD LTDA",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // =========================================================================
    // EVENTO 3/6: ZONA DE JUEGOS Y KIOSCOS DIGITALES
    // =========================================================================
    {
      id: "official-event-games",
      type: "official-event",
      themeClass: "theme-arcade-carnival",
      kickerText: "ZONA GAMER Y DESAFÍO TÁCTIL INTERACTIVO",
      kickerIcon: "gamepad-2",
      title: "¡JUEGA GRATIS EN PANTALLAS GIGANTES Y GANA!",
      titleIcon: "trophy",
      subtitle: "13 minijuegos arcade táctiles navideños, desafíos contra reloj, tablero de récords y fantásticos premios al instante.",
      subtitleIcon: "zap",
      highlights: [
        { label: "13 Minijuegos Arcade", icon: "gamepad-2" },
        { label: "Retos Táctiles en Pantalla", icon: "zap" },
        { label: "Premios al Instante", icon: "trophy" }
      ],
      badgeText: "RETO ARCADE",
      badgeIcon: "trophy",
      ctaText: "¡Compite con tus amigos y gana sorpresas al instante!",
      ctaIcon: "gift",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #1E0B36 0%, #4A157A 50%, #1E0B36 100%)",
      bgImage: "./assets/banners/6.png",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.webp",
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
      themeClass: "theme-arepa-tradition",
      kickerText: "EL AUTÉNTICO SABOR SANTANDEREANO",
      kickerIcon: "flame",
      title: "¡CALIENTITAS, CRUJIENTES Y 100% PURO MAÍZ!",
      titleIcon: "award",
      subtitle: "El sabor casero tradicional que reúne a la familia santandereana: maíz seleccionado, queso fresco y asado al carbón.",
      subtitleIcon: "star",
      highlights: [
        { label: "Maíz 100% Natural", icon: "flame" },
        { label: "Asadas al Momento", icon: "award" },
        { label: "Zona Gastronómica Feria", icon: "shopping-bag" }
      ],
      badgeText: "100% NATURAL",
      badgeIcon: "award",
      ctaText: "Pídelas asadas al instante en la zona gastronómica",
      ctaIcon: "shopping-bag",
      accentColor: "#FFB300",
      bgGradient: "linear-gradient(90deg, #240C05 0%, #4D1A0A 50%, #240C05 100%)",
      bgImage: "./assets/banners/9.png",
      logos: [
        {
          src: "./assets/logos/clean-practi-arepa.webp",
          alt: "Logotipo oficial de Practi Arepa - La auténtica y Tradicional",
          name: "PRACTI AREPA",
          fitMode: "compact"
        }
      ],
      statusNote: "CONFIRMADO_LOGO"
    },

    // PATROCINADOR OFICIAL 6/8: DULCES MARIPOSA
    {
      id: "hero-mariposa",
      type: "hero-billboard",
      themeClass: "theme-mariposa-sweets",
      kickerText: "TRADICIÓN DULCE QUE ENAMORA",
      kickerIcon: "gift",
      title: "¡OBLEAS CON AREQUIPE ARTESANAL Y DULCES TÍPICOS!",
      titleIcon: "star",
      subtitle: "Cortados de leche de cabra, arequipe santandereano tradicional, panderos crocantes y anchetas dulces navideñas.",
      subtitleIcon: "award",
      highlights: [
        { label: "Arequipe 100% Artesanal", icon: "sparkles" },
        { label: "Cortados de Leche de Cabra", icon: "star" },
        { label: "Degustaciones en Stand", icon: "gift" }
      ],
      badgeText: "SABOR TÍPICO",
      badgeIcon: "sparkles",
      ctaText: "Degustaciones gratis y anchetas en nuestro stand",
      ctaIcon: "shopping-bag",
      accentColor: "#FFD500",
      bgGradient: "linear-gradient(90deg, #26060E 0%, #4D1020 50%, #26060E 100%)",
      bgImage: "./assets/banners/3.png",
      logos: [
        {
          src: "./assets/logos/clean-mariposa.webp",
          alt: "Logotipo oficial de Dulces Mariposa",
          name: "DULCES MARIPOSA",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // =========================================================================
    // EVENTO 4/6: MERCADO DE JUGUETES Y REGALOS EXCLUSIVOS
    // =========================================================================
    {
      id: "official-event-invite",
      type: "official-event",
      themeClass: "theme-toys-market",
      kickerText: "MÁS DE 50 FABRICANTES Y DISTRIBUIDORES DIRECTOS",
      kickerIcon: "shopping-bag",
      title: "¡EL GRAN MERCADO DEL JUGUETE CON PRECIOS DE FÁBRICA!",
      titleIcon: "tag",
      subtitle: "Más de 50 marcas y fabricantes directos con muñecas, drones, pistas de carritos, peluches y juegos educativos.",
      subtitleIcon: "gift",
      highlights: [
        { label: "Precios Directos de Fábrica", icon: "tag" },
        { label: "+50 Marcas y Distribuidores", icon: "shopping-bag" },
        { label: "Garantía Oficial en Juguetes", icon: "gift" }
      ],
      badgeText: "OFERTAS NAVIDAD",
      badgeIcon: "tag",
      ctaText: "¡Encuentra el regalo prometido sin pagar de más!",
      ctaIcon: "shopping-bag",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #330814 0%, #7A142E 50%, #330814 100%)",
      bgImage: "./assets/banners/12.png",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.webp",
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
      themeClass: "theme-cajasan-family",
      kickerText: "EXPERIENCIAS INOLVIDABLES EN FAMILIA",
      kickerIcon: "star",
      title: "¡VACACIONES SOÑADAS, PARQUES Y SUBSIDIOS FAMILIARES!",
      titleIcon: "ticket",
      subtitle: "Ven a Mundo Guarigua, aprovecha subsidios de temporada, paquetes turísticos, salud integral y recreación para afiliados.",
      subtitleIcon: "award",
      highlights: [
        { label: "Parque Acuático Mundo Guarigua", icon: "ticket" },
        { label: "Subsidios y Cuota Monetaria", icon: "award" },
        { label: "Planes Turísticos Navideños", icon: "star" }
      ],
      badgeText: "BENEFICIOS EXCLUSIVOS",
      badgeIcon: "star",
      ctaText: "Descubre los beneficios de tu categoría Cajasan",
      ctaIcon: "arrow-right",
      accentColor: "#FFA000",
      bgGradient: "linear-gradient(90deg, #051833 0%, #0C2E5E 50%, #051833 100%)",
      bgImage: "./assets/banners/10.png",
      logos: [
        {
          src: "./assets/logos/clean-cajasan.webp",
          alt: "Logotipo oficial de Cajasan",
          name: "CAJASAN",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // PATROCINADOR OFICIAL 8/8: ALCALDÍA DE BUCARAMANGA & IMEBU
    {
      id: "hero-imebu",
      type: "hero-billboard",
      themeClass: "theme-imebu-progress",
      kickerText: "ORGULLO Y TALENTO BUMANGUÉS",
      kickerIcon: "landmark",
      title: "¡COMPRA JUGUETES HECHOS EN BUCARAMANGA!",
      titleIcon: "award",
      subtitle: "Apoya el talento local: más de 200 artesanos y microempresarios santandereanos con creaciones de alta calidad y precios justos.",
      subtitleIcon: "briefcase",
      highlights: [
        { label: "200+ Talleres Emprendedores", icon: "landmark" },
        { label: "Fomento al Productor Local", icon: "briefcase" },
        { label: "Diseños Creativos Exclusivos", icon: "award" }
      ],
      badgeText: "BUCARAMANGA BONITA",
      badgeIcon: "award",
      ctaText: "Fomento empresarial directo al productor local",
      ctaIcon: "trending-up",
      accentColor: "#00E676",
      bgGradient: "linear-gradient(90deg, #041B12 0%, #0A3D27 50%, #041B12 100%)",
      bgImage: "./assets/banners/2.png",
      logos: [
        {
          src: "./assets/logos/clean-imebu.webp",
          alt: "Alcaldía de Bucaramanga e IMEBU - Instituto Municipal de Empleo y Fomento Empresarial",
          name: "IMEBU",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_LOGO"
    },

    // =========================================================================
    // EVENTO 5/6: ZONA FOTOGRÁFICA MÁGICA CON SANTA Y DUENDES
    // =========================================================================
    {
      id: "official-event-photos",
      type: "official-event",
      themeClass: "theme-santa-polar",
      kickerText: "SET FOTOGRÁFICO PROFESIONAL POLO NORTE",
      kickerIcon: "camera",
      title: "¡FOTO OFICIAL CON PAPÁ NOEL EN SU TRINEO REAL!",
      titleIcon: "sparkles",
      subtitle: "Trae tu carta al buzón de los duendes, tómate la foto en el trineo de Santa y admira el árbol gigante de 15 metros.",
      subtitleIcon: "camera",
      highlights: [
        { label: "Papá Noel en su Trineo Real", icon: "camera" },
        { label: "Árbol Gigante Iluminado 15m", icon: "sparkles" },
        { label: "Buzón Secreto del Polo Norte", icon: "gift" }
      ],
      badgeText: "RECUERDO ETERNO",
      badgeIcon: "star",
      ctaText: "Santa recibe a los niños todos los días en la plaza",
      ctaIcon: "sparkles",
      accentColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #051A2E 0%, #0D3E6B 50%, #051A2E 100%)",
      bgImage: "./assets/banners/13.png",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.webp",
          alt: "Feria Mágica del Juguete",
          name: "FERIA MÁGICA DEL JUGUETE",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    },

    // =========================================================================
    // EVENTO 6/6: NOCHES DE LUCES Y MÚSICA NAVIDEÑA
    // =========================================================================
    {
      id: "official-event-nights",
      type: "official-event",
      themeClass: "theme-carols-symphony",
      kickerText: "FESTIVAL ARTÍSTICO Y MÚSICA EN VIVO",
      kickerIcon: "music",
      title: "¡NOCHES DE VILLANCICOS Y ALUMBRADO MONUMENTAL!",
      titleIcon: "sparkles",
      subtitle: "Gran programación musical en vivo todas las noches desde las 5:00 PM con corales infantiles, danza y luces doradas.",
      subtitleIcon: "music",
      highlights: [
        { label: "Conciertos Navideños Diarios", icon: "music" },
        { label: "Iluminación Monumental", icon: "sparkles" },
        { label: "Presentaciones Artísticas 5 PM", icon: "party-popper" }
      ],
      badgeText: "SHOW EN VIVO",
      badgeIcon: "party-popper",
      ctaText: "¡Ambiente festivo vibrante con entrada libre para todos!",
      ctaIcon: "ticket",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #041B12 0%, #0E472C 50%, #041B12 100%)",
      bgImage: "./assets/banners/14.png",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.webp",
          alt: "Feria Mágica del Juguete",
          name: "FERIA MÁGICA DEL JUGUETE",
          fitMode: "standard"
        }
      ],
      statusNote: "CONFIRMADO_AFICHE"
    }
  ] as BannerSlide[]
};
