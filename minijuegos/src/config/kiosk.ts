/**
 * ==============================================================================
 * CONFIGURACIÓN DE MODO KIOSCO Y EXPERIENCIA DE PANTALLA TÁCTIL
 * ==============================================================================
 * 
 * Este archivo controla los tiempos de inactividad, modo de pantalla completa
 * y comportamiento general de la pantalla pública.
 */

export const KIOSK_CONFIG = {
  // Tiempo de inactividad sin toques antes de regresar a la pantalla de bienvenida (en segundos)
  // En eventos públicos se recomienda entre 20 y 45 segundos.
  inactivityTimeoutSeconds: 30,

  // Duración estándar por partida en segundos para los minijuegos rápidos
  defaultGameDurationSeconds: 45,

  // Nombre de la clave de almacenamiento local para récords
  storageKeyPrefix: "feria_magica_score_",

  // Habilitar monitor de rendimiento en pantalla (FPS, toques) para pruebas
  debugMode: false,

  // Textos y llamadas a la acción
  texts: {
    attractTitle: "¡BIENVENIDO A LA FERIA MÁGICA!",
    attractSubtitle: "Toca la pantalla para comenzar a jugar",
    playAgain: "¡Jugar de Nuevo!",
    backToMenu: "Elegir Otro Juego",
    soundOn: "Sonido Activado",
    soundOff: "Sonido Silenciado",
    newRecord: "¡NUEVO RÉCORD DE LA FERIA!",
    finalScore: "Puntuación Final",
  }
};
