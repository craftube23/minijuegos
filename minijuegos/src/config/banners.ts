/**
 * ==============================================================================
 * CONFIGURACIÓN DEL CARRUSEL PUBLICITARIO INFERIOR
 * ==============================================================================
 * 
 * Banners 100% responsivos para la franja publicitaria de la Feria.
 * Se adaptan con flexbox a cualquier ancho de pantalla sin deformarse ni cortarse.
 */

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  iconName: string;
  bgGradient: string;
  badgeColor: string;
  image?: string;
}

export const BANNER_CONFIG = {
  // Tiempo que permanece cada banner antes de rotar (en milisegundos)
  rotationIntervalMs: 5500,
  
  // Lista de anuncios interactivos y responsivos
  slides: [
    {
      id: "banner-campus",
      title: "¡IMPULSADO POR CAMPUSLANDS!",
      subtitle: "Innovación, tecnología y talento en la Feria Mágica del Juguete.",
      badgeText: "COLABORADOR OFICIAL",
      iconName: "sparkles",
      bgGradient: "linear-gradient(90deg, #071626 0%, #0F3254 50%, #071626 100%)",
      badgeColor: "#00E5FF",
      image: "./assets/logos/logo-campus-con-fondo.png"
    },
    {
      id: "banner-show",
      title: "¡GRAN SHOW DE SANTA Y DUENDES!",
      subtitle: "Espectáculo en vivo, música y magia navideña cada tarde.",
      badgeText: "18:00 Y 20:00 HRS",
      iconName: "sparkles",
      bgGradient: "linear-gradient(90deg, #3D0C1C 0%, #631430 50%, #2A0813 100%)",
      badgeColor: "#F43F5E"
    },
    {
      id: "banner-games",
      title: "¡ZONA DE JUEGOS Y SORPRESAS!",
      subtitle: "Más de 1.000 juguetes, premios instantáneos y atracciones.",
      badgeText: "ENTRADA LIBRE PARA FAMILIAS",
      iconName: "gift",
      bgGradient: "linear-gradient(90deg, #052E1B 0%, #0D4E2F 50%, #031F12 100%)",
      badgeColor: "#10B981"
    },
    {
      id: "banner-workshop",
      title: "¡TALLER DE JUGUETES MÁGICOS!",
      subtitle: "Crea tu propio juguete con los duendes artesanos y llévatelo.",
      badgeText: "CUPOS LIMITADOS POR HORA",
      iconName: "tree",
      bgGradient: "linear-gradient(90deg, #3B1B08 0%, #5E2B0E 50%, #261105 100%)",
      badgeColor: "#F59E0B"
    }
  ] as BannerSlide[]
};
