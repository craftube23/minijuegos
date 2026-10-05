# 🎄 Feria Mágica del Juguete — Minijuegos Táctiles para Tótem

Colección de **4 minijuegos navideños interactivos** diseñados especialmente para pantallas táctiles y tótems publicitarios con **Android 11 / Navegador Web**.

---

## 🚀 Inicio Rápido

### Requisitos
* Node.js (versión 18 o superior recomendada).

### 1. Ejecutar en Modo Desarrollo (Pruebas en PC)
Abre la terminal en la carpeta `minijuegos` y ejecuta:

```bash
npm run dev
```

Abre en tu navegador la dirección que aparezca (normalmente `http://localhost:5173`).

### 2. Compilar para Producción / Kiosco
Para generar la versión final optimizada y ultra-rápida:

```bash
npm run build
```

Los archivos finales listos para desplegar quedarán en la carpeta `dist/`.

---

## 🎮 Los 4 Minijuegos Desarrollados

| Minijuego | Icono | Mecánica Principal | Integración del Logo |
| :--- | :---: | :--- | :--- |
| **1. Atrapa-Regalos Mágico** | 🎁 | Deslizar el saco de Santa para recoger regalos y juguetes que caen. | **Logo 1:** Caja dorada especial que activa la *Lluvia Mágica* (puntos x2). |
| **2. El Vuelo del Trineo Mágico** | 🛷 | Tocar 3 carriles táctiles para volar esquivando chimeneas y nubes. | **Logo 2:** *Portal de la Feria* que otorga turbo e invulnerabilidad. |
| **3. Enciende el Árbol Mágico** | 💡 | Memoria musical tocando 4 bombillas/campanas gigantes iluminadas. | **Logo 1:** La gran estrella del árbol se ilumina y lanza confeti al superar rondas. |
| **4. Parejas Mágicas de Juguetes** | 🃏 | Memorama táctil de cartas con juguetes navideños clásicos. | **Logo 1:** Reverso oficial de las cartas.<br>**Logo 2:** Pareja comodín dorada de 1.000 pts. |

---

## 🖼️ Cómo Personalizar Logos y Banners

Todo el proyecto fue diseñado de forma modular para que puedas cambiar imágenes y textos sin tocar la lógica de los juegos.

### 1. Cambiar los Logos Oficiales
1. Coloca tus imágenes (`.png`, `.svg` o `.jpg`) en la carpeta:
   ```text
   public/assets/logos/
   ```
2. Abre el archivo de configuración:
   👉 `src/config/branding.ts`
3. Actualiza la ruta del archivo en `logo1` o `logo2`. ¡Listo! Se actualizará automáticamente en toda la aplicación.

---

### 2. Cambiar o Agregar Banners al Carrusel Inferior
El carrusel publicitario de la parte inferior rota de forma automática según el diseño del evento.

1. Guarda tus imágenes publicitarias en:
   ```text
   public/assets/banners/
   ```
2. Abre el archivo de configuración:
   👉 `src/config/banners.ts`
3. Agrega o modifica las entradas dentro de `slides`:
   ```typescript
   {
     id: "mi-nuevo-banner",
     image: "/assets/banners/mi-imagen.png",
     title: "Gran Concurso de Navidad",
     badgeText: "⭐ PREMIOS EN VIVO ⭐"
   }
   ```
4. Puedes cambiar el tiempo de rotación modificando `rotationIntervalMs` (por defecto: `6000` = 6 segundos).

---

### 3. Cambiar Tiempos de Juego y Modo Kiosco
Abre el archivo:
👉 `src/config/kiosk.ts`

* `inactivityTimeoutSeconds: 30` → Tiempo sin toques antes de volver a la pantalla de bienvenida.
* `defaultGameDurationSeconds: 45` → Duración de cada partida.

---

## 📱 Configuración para Tótem Android 11

Para ejecutar esta experiencia en una pantalla táctil con Android 11 como un verdadero kiosco público sin barras ni menús del sistema:

### Opción Recomendada: **Fully Kiosk Browser & Launcher**
1. Instala la app **Fully Kiosk Browser** desde Google Play o APK en el dispositivo Android.
2. En los ajustes de Fully Kiosk:
   * **Start URL:** Configura la URL local o servidor donde esté la carpeta `dist/` (o una IP local).
   * **Kiosk Mode:** Activa *"Enable Kiosk Mode"* (bloquea la barra de notificaciones, botón Home y salir de la app).
   * **Web Zoom and Viewport:** Activa *"Enable Viewport Meta Tag"* y desactiva el zoom manual.
   * **Sound & Volume:** Fija el volumen al nivel deseado para el recinto.
   * **Auto-Start on Boot:** Activa *"Launch on Android Boot"* para que si se va la luz, el juego arranque solo al encender el tótem.

---

## 📂 Estructura del Código

```text
minijuegos/
├── index.html                  # Contenedor Kiosk (Viewport bloqueado, sin zoom)
├── package.json
├── tsconfig.json
├── public/
│   ├── assets/
│   │   ├── logos/              # logo-1.svg, logo-2.svg (Reemplazables)
│   │   └── banners/            # banner-1.svg, banner-2.svg, banner-3.svg
│
└── src/
    ├── main.ts                 # Orquestador del Kiosco y loop a 60 FPS
    ├── style.css               # Estilos festivos y optimizaciones táctiles
    ├── config/
    │   ├── branding.ts         # Configuración centralizada de Logos
    │   ├── banners.ts          # Configuración del carrusel inferior
    │   └── kiosk.ts            # Ajustes de inactividad y textos
    ├── core/
    │   ├── AudioManager.ts     # Sintetizador Web Audio API (Cero latencia)
    │   ├── InputManager.ts     # Adaptador Touch/Pointer/Mouse/Teclado
    │   ├── StorageManager.ts   # Récords locales en localStorage
    │   ├── ParticleSystem.ts   # Nieve, chispas y confeti a 60 FPS
    │   └── BaseGame.ts         # Clase abstracta base para todos los juegos
    ├── components/
    │   ├── KioskHeader.ts      # Barra superior (Logo, Sonido, Pantalla Completa)
    │   ├── GameBannerCarousel.ts # Carrusel publicitario inferior
    │   ├── AttractScreen.ts    # Pantalla de atracción "Toca para jugar"
    │   ├── GameMenu.ts         # Menú con tarjetas táctiles de 4 juegos
    │   └── GameOverModal.ts    # Pantalla de resultados y revancha
    └── games/
        ├── ToyCatchGame.ts     # 🎁 Juego 1: Atrapa-Regalos
        ├── SleighRushGame.ts   # 🛷 Juego 2: Vuelo del Trineo
        ├── TreeMelodyGame.ts   # 💡 Juego 3: Enciende el Árbol
        └── MagicPairsGame.ts   # 🃏 Juego 4: Parejas de Juguetes
```

---

## 🎯 Controles para Pruebas en PC
* **Pantalla Táctil / Ratón:** Toca o haz clic y arrastra sobre la pantalla.
* **Teclado:**
  * Flechas Izquierda / Derecha (`←` / `→`) o teclas `A` / `D` para mover el saco o cambiar de carril.
