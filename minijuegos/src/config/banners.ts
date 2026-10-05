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
  rotationIntervalMs: 6000,
  
  // Lista de anuncios interactivos y responsivos
  slides: [
    {
      id: "banner-show",
      title: "¡GRAN SHOW DE SANTA Y DUENDES!",
      subtitle: "Espectáculo en vivo, música y magia navideña cada tarde.",
      badgeText: "18:00 Y 20:00 HRS",
      iconName: "sparkles",
      bgGradient: "linear-gradient(90deg, #6A1B9A 0%, #AD1457 50%, #E65100 100%)",
      badgeColor: "#880E4F"
    },
    {
      id: "banner-games",
      title: "¡ZONA DE JUEGOS Y SORPRESAS!",
      subtitle: "Más de 1.000 juguetes, premios instantáneos y atracciones.",
      badgeText: "ENTRADA LIBRE PARA FAMILIAS",
      iconName: "gift",
      bgGradient: "linear-gradient(90deg, #01579B 0%, #00695C 50%, #2E7D32 100%)",
      badgeColor: "#004D40"
    },
    {
      id: "banner-workshop",
      title: "¡TALLER DE JUGUETES MÁGICOS!",
      subtitle: "Crea tu propio juguete con los duendes artesanos y llévatelo.",
      badgeText: "CUPOS LIMITADOS POR HORA",
      iconName: "tree",
      bgGradient: "linear-gradient(90deg, #C62828 0%, #D84315 50%, #F57F17 100%)",
      badgeColor: "#BF360C"
    }
  ] as BannerSlide[]
};
