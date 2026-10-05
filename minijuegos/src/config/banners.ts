/**
 * ==============================================================================
 * CONFIGURACIÓN DEL CARRUSEL PUBLICITARIO INFERIOR
 * ==============================================================================
 * 
 * Aquí puedes agregar, quitar o modificar los banners que aparecen en la
 * franja inferior de la pantalla (según el diseño wireframe de la Feria).
 * 
 * Para agregar un nuevo banner:
 *   1. Coloca tu imagen (PNG, JPG o SVG) en `public/assets/banners/`
 *   2. Agrega una nueva entrada a la lista `slides` aquí abajo.
 * 
 * Puedes ajustar el tiempo de rotación cambiando `rotationIntervalMs`.
 */

export interface BannerSlide {
  id: string;
  image: string;       // Ruta de la imagen en public/assets/banners/
  title: string;       // Texto alternativo o titular
  subtitle?: string;   // Subtítulo opcional
  badgeText?: string;  // Etiqueta destacada
}

export const BANNER_CONFIG = {
  // Tiempo que permanece cada banner antes de pasar al siguiente (en milisegundos)
  // Ejemplo: 6000 = 6 segundos
  rotationIntervalMs: 6000,
  
  // Efecto de transición: 'slide' o 'fade'
  transitionEffect: 'slide' as 'slide' | 'fade',
  
  // Lista de anuncios del carrusel
  slides: [
    {
      id: "banner-show",
      image: "/assets/banners/banner-1.svg",
      title: "¡Gran Show de Santa y Duendes!",
      subtitle: "Espectáculo en vivo cada tarde",
      badgeText: "🎪 18:00 Y 20:00 HRS"
    },
    {
      id: "banner-games",
      image: "/assets/banners/banner-2.svg",
      title: "¡Zona de Juegos y Sorpresas!",
      subtitle: "Más de 1.000 juguetes y premios",
      badgeText: "⭐ ENTRADA LIBRE ⭐"
    },
    {
      id: "banner-workshop",
      image: "/assets/banners/banner-3.svg",
      title: "¡Taller de Juguetes Mágicos!",
      subtitle: "Arma tu propio juguete con los duendes",
      badgeText: "🎁 CUPOS POR HORA"
    }
  ] as BannerSlide[]
};
