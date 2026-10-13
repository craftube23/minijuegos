/**
 * ==============================================================================
 * CONFIGURACIÓN DE LA CAMPAÑA PUBLICITARIA (BANNERS INFERIORES)
 * ==============================================================================
 * 
 * Campaña comercial oficial de la Feria Mágica del Juguete:
 * - 8 Hero Billboards (Patrocinador individual de gala).
 * - 2 Duo Spotlights (Alianzas de prestigio).
 * - 1 Cartel Oficial del Evento (Feria Mágica del Juguete).
 * 
 * Todos los logos provienen exclusivamente de los archivos oficiales verificados
 * en public/assets/logos/ y se presentan con object-fit: contain en tarjetas de soporte.
 */

export type BannerType = "hero-billboard" | "duo-spotlight" | "official-event";

export interface SponsorLogo {
  src: string;
  alt: string;
  name: string;
}

export interface BannerSlide {
  id: string;
  type: BannerType;
  title: string;
  subtitle: string;
  badgeText?: string;
  accentColor: string;
  bgGradient: string;
  logos: SponsorLogo[];
  statusNote?: "VERIFICADO" | "PROPUESTA" | "PENDIENTE";
}

export const BANNER_CONFIG = {
  // Rotación automática aproximada de 5.5 segundos por cartel
  rotationIntervalMs: 5500,

  slides: [
    // 1. HERO BILLBOARD: IMEBU & ALCALDÍA DE BUCARAMANGA
    {
      id: "hero-imebu",
      type: "hero-billboard",
      title: "ALCALDÍA DE BUCARAMANGA & IMEBU",
      subtitle: "Impulsando el empleo, el emprendimiento y el fomento empresarial",
      badgeText: "★ APOYO INSTITUCIONAL",
      accentColor: "#00E676",
      bgGradient: "linear-gradient(90deg, #041B12 0%, #0A3D27 50%, #041B12 100%)",
      logos: [
        {
          src: "./assets/logos/clean-imebu.png",
          alt: "Alcaldía de Bucaramanga e IMEBU",
          name: "IMEBU"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 2. HERO BILLBOARD: CAJASAN
    {
      id: "hero-cajasan",
      type: "hero-billboard",
      title: "CAJASAN",
      subtitle: "Bienestar integral, recreación y sonrisas para las familias santandereanas",
      badgeText: "★ BIENESTAR FAMILIAR",
      accentColor: "#FFA000",
      bgGradient: "linear-gradient(90deg, #051833 0%, #0C2E5E 50%, #051833 100%)",
      logos: [
        {
          src: "./assets/logos/clean-cajasan.png",
          alt: "Cajasan",
          name: "CAJASAN"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 3. HERO BILLBOARD: CAMPUSLANDS
    {
      id: "hero-campuslands",
      type: "hero-billboard",
      title: "CAMPUSLANDS",
      subtitle: "Formando la próxima generación de talento tecnológico para el mundo",
      badgeText: "★ TALENTO TECH & INNOVACIÓN",
      accentColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #041224 0%, #08284D 50%, #041224 100%)",
      logos: [
        {
          src: "./assets/logos/clean-campuslands.png",
          alt: "Campuslands",
          name: "CAMPUSLANDS"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 4. HERO BILLBOARD: PRACTI AREPA
    {
      id: "hero-practi-arepa",
      type: "hero-billboard",
      title: "PRACTI AREPA",
      subtitle: "El auténtico sabor tradicional de nuestra tierra en cada bocado",
      badgeText: "★ SABOR SANTANDEREANO",
      accentColor: "#FFB300",
      bgGradient: "linear-gradient(90deg, #240C05 0%, #4D1A0A 50%, #240C05 100%)",
      logos: [
        {
          src: "./assets/logos/clean-practi-arepa.png",
          alt: "Practi Arepa",
          name: "PRACTI AREPA"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 5. HERO BILLBOARD: DULCES MARIPOSA
    {
      id: "hero-mariposa",
      type: "hero-billboard",
      title: "DULCES MARIPOSA",
      subtitle: "Tradición artesanal y dulce magia que alegra los hogares en Navidad",
      badgeText: "★ TRADICIÓN DULCE",
      accentColor: "#FFD500",
      bgGradient: "linear-gradient(90deg, #26060E 0%, #4D1020 50%, #26060E 100%)",
      logos: [
        {
          src: "./assets/logos/clean-mariposa.png",
          alt: "Dulces Mariposa",
          name: "MARIPOSA"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 6. HERO BILLBOARD: ÁNGELUS SEGURIDAD
    {
      id: "hero-angelus",
      type: "hero-billboard",
      title: "ÁNGELUS SEGURIDAD",
      subtitle: "Protección, confianza y tecnología avanzada para cuidar lo que más amas",
      badgeText: "★ SEGURIDAD INTEGRAL",
      accentColor: "#E2E8F0",
      bgGradient: "linear-gradient(90deg, #061326 0%, #0E294D 50%, #061326 100%)",
      logos: [
        {
          src: "./assets/logos/clean-angelus.png",
          alt: "Ángelus Seguridad",
          name: "ÁNGELUS"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 7. HERO BILLBOARD: FACTOR HUMANO
    {
      id: "hero-factor-humano",
      type: "hero-billboard",
      title: "FACTOR HUMANO",
      subtitle: "Conectando el talento con las grandes oportunidades empresariales del país",
      badgeText: "★ TALENTO HUMANO",
      accentColor: "#FF5252",
      bgGradient: "linear-gradient(90deg, #1F070E 0%, #420F1E 50%, #1F070E 100%)",
      logos: [
        {
          src: "./assets/logos/clean-factor-humano.png",
          alt: "Factor Humano",
          name: "FACTOR HUMANO"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 8. HERO BILLBOARD: FUNDALAS
    {
      id: "hero-fundalas",
      type: "hero-billboard",
      title: "FUNDALAS",
      subtitle: "Sembrando sonrisas, esperanza y momentos mágicos en los niños de Santander",
      badgeText: "★ COMPROMISO SOCIAL",
      accentColor: "#38BDF8",
      bgGradient: "linear-gradient(90deg, #031B2E 0%, #083B5E 50%, #031B2E 100%)",
      logos: [
        {
          src: "./assets/logos/clean-fundalas.png",
          alt: "Fundalas",
          name: "FUNDALAS"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 9. DUO SPOTLIGHT: CAMPUSLANDS + CAJASAN
    {
      id: "duo-campus-cajasan",
      type: "duo-spotlight",
      title: "CAMPUSLANDS & CAJASAN",
      subtitle: "Alianza por el talento, la formación tecnológica y el bienestar familiar",
      badgeText: "★ PATROCINADORES OFICIALES",
      accentColor: "#00E5FF",
      bgGradient: "linear-gradient(90deg, #051428 0%, #0C2E52 50%, #051428 100%)",
      logos: [
        {
          src: "./assets/logos/clean-campuslands.png",
          alt: "Campuslands",
          name: "CAMPUSLANDS"
        },
        {
          src: "./assets/logos/clean-cajasan.png",
          alt: "Cajasan",
          name: "CAJASAN"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 10. DUO SPOTLIGHT: PRACTI AREPA + DULCES MARIPOSA
    {
      id: "duo-arepa-mariposa",
      type: "duo-spotlight",
      title: "PRACTI AREPA & DULCES MARIPOSA",
      subtitle: "El auténtico sabor de nuestras tradiciones y la más dulce magia navideña",
      badgeText: "★ SABOR Y TRADICIÓN",
      accentColor: "#FFB300",
      bgGradient: "linear-gradient(90deg, #2B1503 0%, #542A07 50%, #2B1503 100%)",
      logos: [
        {
          src: "./assets/logos/clean-practi-arepa.png",
          alt: "Practi Arepa",
          name: "PRACTI AREPA"
        },
        {
          src: "./assets/logos/clean-mariposa.png",
          alt: "Dulces Mariposa",
          name: "MARIPOSA"
        }
      ],
      statusNote: "PROPUESTA"
    },

    // 11. CARTEL OFICIAL DEL EVENTO: FERIA MÁGICA DEL JUGUETE
    {
      id: "official-event-info",
      type: "official-event",
      title: "DEL 1 AL 24 DE DICIEMBRE",
      subtitle: "Centro Cultural del Oriente (Frente al Parque Centenario) • Entrada Libre",
      badgeText: "¡NOS VEMOS EN LA FERIA!",
      accentColor: "#FF2A4D",
      bgGradient: "linear-gradient(90deg, #2A0712 0%, #5E1127 50%, #2A0712 100%)",
      logos: [
        {
          src: "./assets/logos/clean-feria-magica.png",
          alt: "Feria Mágica del Juguete",
          name: "FERIA MÁGICA"
        }
      ],
      statusNote: "PENDIENTE"
    }
  ] as BannerSlide[]
};
