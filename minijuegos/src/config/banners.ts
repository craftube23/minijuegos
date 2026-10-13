/**
 * ==============================================================================
 * CONFIGURACIÓN DEL CARRUSEL PUBLICITARIO INFERIOR (PATROCINADORES Y FERIA)
 * ==============================================================================
 * 
 * Banners 100% profesionales y responsivos diseñados para el Tótem Publicitario.
 * Incorpora los 8 patrocinadores oficiales de la Feria Mágica del Juguete:
 * 1. FUNDALAS
 * 2. Actor Humano
 * 3. Campuslands
 * 4. Angelus
 * 5. Practi Arepa
 * 6. Dulces Mariposa
 * 7. Cajasan
 * 8. IMEBU / Alcaldía de Bucaramanga
 */

export interface SponsorLogo {
  src: string;
  alt: string;
  name: string;
  maxHeight?: string;
}

export interface BannerSlide {
  id: string;
  type: "showcase" | "spotlight" | "event";
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  bgGradient: string;
  iconName?: string;
  image?: string;
  logos?: SponsorLogo[];
  highlightText?: string;
}

export const OFFICIAL_SPONSORS: SponsorLogo[] = [
  {
    src: "./assets/logos/Logo-Fundalas-sin-fondo.png",
    alt: "Fundalas",
    name: "Fundalas",
    maxHeight: "36px"
  },
  {
    src: "./assets/logos/logo-actor-humano-sin-fondo.png",
    alt: "Actor Humano",
    name: "Actor Humano",
    maxHeight: "42px"
  },
  {
    src: "./assets/logos/logo-campus-sin-fondo.png",
    alt: "Campuslands",
    name: "Campuslands",
    maxHeight: "38px"
  },
  {
    src: "./assets/logos/logo-Angelus-sin-fondo.png",
    alt: "Angelus",
    name: "Angelus",
    maxHeight: "40px"
  },
  {
    src: "./assets/logos/logo-preza-arepa-sin-fondo.png",
    alt: "Practi Arepa",
    name: "Practi Arepa",
    maxHeight: "38px"
  },
  {
    src: "./assets/logos/logo-mariposa-clean-sin-fondo.png",
    alt: "Dulces Mariposa",
    name: "Mariposa",
    maxHeight: "32px"
  },
  {
    src: "./assets/logos/logo-cajasan-sin-fondo.png",
    alt: "Cajasan",
    name: "Cajasan",
    maxHeight: "36px"
  },
  {
    src: "./assets/logos/logo-imebu-sin-fondo.png",
    alt: "IMEBU - Alcaldía de Bucaramanga",
    name: "IMEBU",
    maxHeight: "40px"
  }
];

export const BANNER_CONFIG = {
  // Rotación suave cada 6.5 segundos para dar tiempo de lectura y lucimiento a cada marca
  rotationIntervalMs: 6500,

  slides: [
    // 1. EL GRAN PANEL DE PATROCINADORES (Fiel al cartel publicitario oficial)
    {
      id: "banner-patrocinadores-showcase",
      type: "showcase",
      title: "PATROCINADORES OFICIALES",
      subtitle: "La Feria Mágica del Juguete es una realidad gracias a su gran apoyo",
      badgeText: "DONDE VIVE LA MAGIA",
      badgeColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #100408 0%, #2D0913 25%, #3D0C1A 50%, #2D0913 75%, #100408 100%)",
      logos: OFFICIAL_SPONSORS
    },

    // 2. DUO: CAMPUSLANDS & CAJASAN (Tecnología y Bienestar)
    {
      id: "banner-campus-cajasan",
      type: "spotlight",
      title: "CAMPUSLANDS & CAJASAN",
      subtitle: "Innovación, formación tecnológica y bienestar familiar en esta Navidad.",
      badgeText: "PATROCINADORES OFICIALES",
      badgeColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #051424 0%, #0C2E52 50%, #051424 100%)",
      logos: [
        { src: "./assets/logos/logo-campus-sin-fondo.png", alt: "Campuslands", name: "Campuslands", maxHeight: "42px" },
        { src: "./assets/logos/logo-cajasan-sin-fondo.png", alt: "Cajasan", name: "Cajasan", maxHeight: "38px" }
      ]
    },

    // 3. INSTITUCIONAL: ALCALDÍA DE BUCARAMANGA & IMEBU
    {
      id: "banner-alcaldia-imebu",
      type: "spotlight",
      title: "ALCALDÍA DE BUCARAMANGA & IMEBU",
      subtitle: "Instituto de Empleo y Fomento Empresarial • Respaldando la alegría de nuestra ciudad.",
      badgeText: "APOYO INSTITUCIONAL",
      badgeColor: "#00E676",
      bgGradient: "linear-gradient(90deg, #041F14 0%, #0A432B 50%, #041F14 100%)",
      logos: [
        { src: "./assets/logos/logo-imebu-sin-fondo.png", alt: "Alcaldía e IMEBU", name: "IMEBU", maxHeight: "45px" }
      ]
    },

    // 4. SOLIDARIDAD: FUNDALAS & ÁNGELUS
    {
      id: "banner-fundalas-angelus",
      type: "spotlight",
      title: "FUNDALAS & ÁNGELUS",
      subtitle: "Sembrando sonrisas, esperanza y momentos inolvidables para los niños.",
      badgeText: "CORAZÓN Y SOLIDARIDAD",
      badgeColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #2A0914 0%, #521327 50%, #2A0914 100%)",
      logos: [
        { src: "./assets/logos/Logo-Fundalas-sin-fondo.png", alt: "Fundalas", name: "Fundalas", maxHeight: "36px" },
        { src: "./assets/logos/logo-Angelus-sin-fondo.png", alt: "Angelus", name: "Angelus", maxHeight: "44px" }
      ]
    },

    // 5. GASTRONOMÍA & TRADICIÓN: PRACTI AREPA & DULCES MARIPOSA
    {
      id: "banner-arepa-mariposa",
      type: "spotlight",
      title: "PRACTI AREPA & CONFITERÍA MARIPOSA",
      subtitle: "El sabor inconfundible de nuestras tradiciones y la más dulce magia navideña.",
      badgeText: "SABOR Y TRADICIÓN",
      badgeColor: "#FF9100",
      bgGradient: "linear-gradient(90deg, #2B1503 0%, #542A07 50%, #2B1503 100%)",
      logos: [
        { src: "./assets/logos/logo-preza-arepa-sin-fondo.png", alt: "Practi Arepa", name: "Practi Arepa", maxHeight: "42px" },
        { src: "./assets/logos/logo-mariposa-clean-sin-fondo.png", alt: "Dulces Mariposa", name: "Mariposa", maxHeight: "36px" }
      ]
    },

    // 6. EVENTO OFICIAL & FACTOR HUMANO: FECHAS Y UBICACIÓN
    {
      id: "banner-feria-evento",
      type: "event",
      title: "DEL 1 AL 24 DE DICIEMBRE • CENTRO CULTURAL DEL ORIENTE",
      subtitle: "Frente al Parque Centenario • Síguenos en @FeriaMagicaJuguete • ¡Nos vemos en la Feria!",
      badgeText: "¡NOS VEMOS EN LA FERIA!",
      badgeColor: "#FF3366",
      bgGradient: "linear-gradient(90deg, #3A0B16 0%, #6E152A 50%, #3A0B16 100%)",
      logos: [
        { src: "./assets/logos/logo-actor-humano-sin-fondo.png", alt: "Actor Humano", name: "Actor Humano", maxHeight: "45px" },
        { src: "./assets/logos/Feria-magica-del-jugete-sin-fondo.png", alt: "Feria Mágica", name: "Feria Mágica", maxHeight: "48px" }
      ]
    }
  ] as BannerSlide[]
};
