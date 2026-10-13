/**
 * ==============================================================================
 * CONFIGURACIÓN DEL CARRUSEL PUBLICITARIO INFERIOR (PATROCINADORES Y FERIA)
 * ==============================================================================
 * 
 * Diseño de alta visibilidad para Tótem Publicitario Vertical (9:16) y Móvil:
 * - Estética Azul Noche Real + Oro Metálico + Carmesí Navideño (100% acorde a la app).
 * - Placas individuales Marfil-Oro de gran formato para que ningún logo se pierda.
 * - Logos procesados y recortados al milímetro en formato horizontal de alto impacto.
 */

export interface SponsorLogo {
  src: string;
  alt: string;
  name: string;
  scale?: number;
}

export interface BannerSlide {
  id: string;
  type: "showcase-grid" | "duo-spotlight" | "official-event";
  ribbonTop?: string;
  ribbonSub?: string;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  accentColor: string;
  bgGradient: string;
  logos: SponsorLogo[];
}

export const BANNER_CONFIG = {
  // Tiempo de rotación entre carteles (6 segundos)
  rotationIntervalMs: 6000,

  slides: [
    // 1. VITRINA DE GALA (BLOQUE 1 DE 4 GRANDES PLACAS)
    {
      id: "showcase-patrocinan-1",
      type: "showcase-grid",
      ribbonTop: "PATROCINAN",
      ribbonSub: "Feria Mágica",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #071428 0%, #102A52 50%, #071428 100%)",
      logos: [
        {
          src: "./assets/logos/horiz-fundalas.png",
          alt: "Fundalas",
          name: "FUNDALAS"
        },
        {
          src: "./assets/logos/horiz-factor-humano.png",
          alt: "Factor Humano",
          name: "FACTOR HUMANO"
        },
        {
          src: "./assets/logos/horiz-campuslands.png",
          alt: "Campuslands",
          name: "CAMPUSLANDS"
        },
        {
          src: "./assets/logos/horiz-angelus.png",
          alt: "Angelus Seguridad",
          name: "ANGELUS"
        }
      ]
    },

    // 2. VITRINA DE GALA (BLOQUE 2 DE 4 GRANDES PLACAS)
    {
      id: "showcase-patrocinan-2",
      type: "showcase-grid",
      ribbonTop: "PATROCINAN",
      ribbonSub: "Aliados Oficiales",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #071428 0%, #122E59 50%, #071428 100%)",
      logos: [
        {
          src: "./assets/logos/horiz-practi-arepa.png",
          alt: "Practi Arepa",
          name: "PRACTI AREPA"
        },
        {
          src: "./assets/logos/clean-mariposa.png",
          alt: "Dulces Mariposa",
          name: "MARIPOSA"
        },
        {
          src: "./assets/logos/clean-cajasan.png",
          alt: "Cajasan",
          name: "CAJASAN"
        },
        {
          src: "./assets/logos/clean-imebu.png",
          alt: "Alcaldía de Bucaramanga e IMEBU",
          name: "IMEBU • ALCALDÍA"
        }
      ]
    },

    // 3. DESTACADO GIGANTE DUO: CAMPUSLANDS & CAJASAN
    {
      id: "spotlight-campus-cajasan",
      type: "duo-spotlight",
      title: "TALENTO, TECNOLOGÍA Y BIENESTAR FAMILIAR",
      subtitle: "Campuslands y Cajasan impulsando la magia de nuestra Navidad",
      badgeText: "★ PATROCINADORES",
      accentColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #06152B 0%, #0E3466 55%, #071830 100%)",
      logos: [
        {
          src: "./assets/logos/horiz-campuslands.png",
          alt: "Campuslands",
          name: "CAMPUSLANDS"
        },
        {
          src: "./assets/logos/clean-cajasan.png",
          alt: "Cajasan",
          name: "CAJASAN"
        }
      ]
    },

    // 4. DESTACADO GIGANTE DUO: ALCALDÍA / IMEBU & FACTOR HUMANO
    {
      id: "spotlight-imebu-factor",
      type: "duo-spotlight",
      title: "IMPULSO EMPRESARIAL Y TALENTO HUMANO",
      subtitle: "Alcaldía de Bucaramanga, IMEBU y Factor Humano presentes en la Feria",
      badgeText: "★ APOYO OFICIAL",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #071B2E 0%, #0D3B5E 55%, #071B2E 100%)",
      logos: [
        {
          src: "./assets/logos/clean-imebu.png",
          alt: "IMEBU Alcaldía de Bucaramanga",
          name: "IMEBU"
        },
        {
          src: "./assets/logos/horiz-factor-humano.png",
          alt: "Factor Humano",
          name: "FACTOR HUMANO"
        }
      ]
    },

    // 5. DESTACADO GIGANTE DUO: PRACTI AREPA & MARIPOSA
    {
      id: "spotlight-arepa-mariposa",
      type: "duo-spotlight",
      title: "EL SABOR Y LA DULZURA DE LA NAVIDAD",
      subtitle: "Disfruta la tradición de Practi Arepa y Mariposa en la Feria Mágica",
      badgeText: "★ SABOR Y TRADICIÓN",
      accentColor: "#FFB300",
      bgGradient: "linear-gradient(90deg, #1E0D06 0%, #4A1F0D 55%, #1E0D06 100%)",
      logos: [
        {
          src: "./assets/logos/horiz-practi-arepa.png",
          alt: "Practi Arepa",
          name: "PRACTI AREPA"
        },
        {
          src: "./assets/logos/clean-mariposa.png",
          alt: "Mariposa",
          name: "MARIPOSA"
        }
      ]
    },

    // 6. DESTACADO GIGANTE DUO: FUNDALAS & ÁNGELUS SEGURIDAD
    {
      id: "spotlight-fundalas-angelus",
      type: "duo-spotlight",
      title: "CORAZÓN, SONRISAS Y SEGURIDAD",
      subtitle: "Fundalas y Ángelus Seguridad unidos por las familias en esta Navidad",
      badgeText: "★ ALIADOS OFICIALES",
      accentColor: "#FFD700",
      bgGradient: "linear-gradient(90deg, #1A0818 0%, #441338 55%, #1A0818 100%)",
      logos: [
        {
          src: "./assets/logos/horiz-fundalas.png",
          alt: "Fundalas",
          name: "FUNDALAS"
        },
        {
          src: "./assets/logos/horiz-angelus.png",
          alt: "Angelus Seguridad",
          name: "ANGELUS"
        }
      ]
    },

    // 7. CARTEL OFICIAL DEL EVENTO (FECHAS Y LUGAR DEL AFICHE REAL)
    {
      id: "official-event-info",
      type: "official-event",
      title: "DEL 1 AL 24 DE DICIEMBRE",
      subtitle: "Centro Cultural del Oriente (Frente al Parque Centenario)",
      badgeText: "¡NOS VEMOS EN LA FERIA!",
      accentColor: "#FF2A4D",
      bgGradient: "linear-gradient(90deg, #2A0712 0%, #5E1127 50%, #2A0712 100%)",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.png",
          alt: "Feria Mágica del Juguete",
          name: "FERIA MÁGICA"
        }
      ]
    }
  ] as BannerSlide[]
};
