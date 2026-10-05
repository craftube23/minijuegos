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
  path: string;       // Ruta al archivo en la carpeta public/
  alt: string;
  themeColor: string; // Color distintivo para efectos de partículas y auras
  bonusMultiplier: number; // Multiplicador cuando aparece como Power-Up
}

export const BRANDING = {
  fairName: "Feria Mágica del Juguete",
  fairTagline: "Una experiencia mágica para toda la familia",
  
  // Lista de logos intercambiables
  logos: {
    // Logo 1: Logo Oficial Transparente de la Feria Mágica del Juguete
    logo1: {
      id: "logo-1",
      name: "Feria Mágica del Juguete",
      path: "/assets/logos/Feria-magica-del-jugete-sin-fondo.png",
      alt: "Feria Mágica del Juguete",
      themeColor: "#FFD700",
      bonusMultiplier: 2,
    } as LogoConfig,
    
    // Logo 2: Logo Oficial de Campuslands (Colaborador)
    logo2: {
      id: "logo-2",
      name: "Campuslands",
      path: "/assets/logos/logo-campus-sin-fondo.png",
      alt: "Campuslands - Colaborador Oficial",
      themeColor: "#00E5FF",
      bonusMultiplier: 2,
    } as LogoConfig,

    // Alias directo para colaborador
    collaborator: {
      id: "logo-campus",
      name: "Campuslands",
      path: "/assets/logos/logo-campus-sin-fondo.png",
      alt: "Campuslands - Colaborador Oficial",
      themeColor: "#00E5FF",
      bonusMultiplier: 2,
    } as LogoConfig
  },
  
  /**
   * Helper para obtener la ruta rápida de un logo (1 o 2)
   */
  getLogoPath(num: 1 | 2 = 1): string {
    return num === 1 ? this.logos.logo1.path : this.logos.logo2.path;
  },

  /**
   * Helper para obtener el logo del colaborador
   */
  getCollaboratorLogoPath(): string {
    return this.logos.collaborator.path;
  },

  /**
   * Helper para obtener la configuración completa del logo
   */
  getLogoConfig(num: 1 | 2 = 1): LogoConfig {
    return num === 1 ? this.logos.logo1 : this.logos.logo2;
  }
};
