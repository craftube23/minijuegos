# Guía del código de Feria Mágica del Juguete

Este documento explica cómo está organizado el proyecto y cómo funciona. Está escrito a partir del código que existe actualmente en `src/`.

> **Duración real:** las partidas usan `KIOSK_CONFIG.defaultGameDurationSeconds`, que actualmente vale **45 segundos** en `src/config/kiosk.ts`. El juego lleva además un contador interno para la dificultad progresiva. El prompt original hablaba de aproximadamente 60 segundos, pero esa duración no está configurada hoy.

## 1. Vista general

El proyecto es una aplicación web de minijuegos construida con **TypeScript**, **Canvas 2D** y **Vite**. Puede ejecutarse en el navegador y usa **Capacitor** para el empaquetado móvil Android. El Canvas dibuja los objetos y efectos; el HTML y CSS presentan el menú, instrucciones, cabecera, banners y ventanas de resultados.

El flujo general es:

1. `index.html` proporciona el contenedor de la aplicación y el Canvas.
2. `src/main.ts` crea el kiosco, los sistemas compartidos y las pantallas.
3. El jugador selecciona un juego en el menú.
4. Se muestra el modal de instrucciones.
5. El juego seleccionado se inicia con la duración configurada.
6. En cada fotograma el juego actualiza su lógica y dibuja en el Canvas.
7. Al agotarse el tiempo, el resultado se guarda y aparece la pantalla final.

## 2. Archivos y carpetas principales

### Entrada y configuración

- `index.html`: documento HTML inicial. Contiene el elemento Canvas y los contenedores de interfaz que utiliza la aplicación.
- `src/main.ts`: punto de entrada y coordinador del kiosco. Inicializa servicios, registra los juegos, ajusta el Canvas, conecta botones y callbacks, administra transiciones y ejecuta el bucle principal.
- `src/style.css`: estilos visuales de las pantallas, modales, menú, cabecera y disposición adaptable.
- `src/config/kiosk.ts`: valores globales del kiosco, como duración de una partida (45 s), tiempo de inactividad (30 s) y textos comunes.
- `src/config/branding.ts`: datos de marca y configuración de logotipos y patrocinadores.
- `src/config/banners.ts`: configuración del carrusel publicitario.
- `src/types/game.ts`: tipos compartidos, especialmente `GameResult`, textos flotantes y metadatos de juegos.
- `vite.config.ts`, `tsconfig.json` y `package.json`: configuración del servidor y compilación, opciones de TypeScript y dependencias/comandos del proyecto.

### Código común (`src/core/`)

- `BaseGame.ts`: clase abstracta que comparten los minijuegos. Mantiene puntuación, tiempo, récord, audio, Canvas, partículas y estados de partida. Controla `start`, `update`, `draw`, fin de partida, HUD, vibración, textos flotantes y temblor de pantalla. Cada juego implementa sus métodos `onStart`, `onUpdate` y dibujo.
- `InputManager.ts`: escucha eventos Pointer (toque, mouse y lápiz), teclado, movimiento y liberación. Convierte coordenadas físicas a coordenadas internas del Canvas y llama callbacks como `onTap`.
- `AudioManager.ts`: servicio compartido para música, efectos y desbloqueo de audio tras la primera interacción. Usa Howler y Web Audio.
- `ParticleSystem.ts`: crea y dibuja partículas, ráfagas, nieve y confeti reutilizados por los juegos y transiciones.
- `GameHUD.ts`: dibuja elementos comunes de interfaz de partida, por ejemplo tiempo y puntuación.
- `FloatingTextSystem.ts`: anima mensajes temporales como puntos, combos y avisos.
- `StorageManager.ts`: lee y guarda récords localmente en el navegador.
- `ScreenTransition.ts`: reúne animaciones de transición entre pantallas.

### Interfaz (`src/components/`)

- `AttractScreen.ts`: pantalla de bienvenida/espera del kiosco.
- `GameMenu.ts`: menú y selección de minijuegos.
- `GameInstructionsModal.ts`: datos y presentación de instrucciones por juego.
- `GameOverModal.ts`: resultados y acciones posteriores a una partida.
- `KioskHeader.ts`: cabecera común.
- `GameBannerCarousel.ts`: banners promocionales.
- `GameStoryCinemaModal.ts`: componente de historias/escenas que algunas rutas del kiosco pueden usar.
- `ChartEditorModal.ts`: editor auxiliar de mapas de notas musicales.

### Minijuegos (`src/games/`)

Cada archivo contiene una clase de juego: `ToyCatchGame.ts`, `BellSymphonyGame.ts`, `NutcrackerDrumsGame.ts`, `FlyingElfGame.ts`, `MagicPairsGame.ts`, `SantaHillsGame.ts`, `SnowballTargetGame.ts` y `WishTreeGame.ts`. Todos reciben el Canvas y los servicios compartidos desde `main.ts`.

`WishTreeGame.ts` implementa **El Árbol de los Deseos**, un puzzle táctil de arrastrar adornos hasta una rama iluminada. Dibuja el árbol, la guirnalda, la nieve, los adornos y la bandeja en Canvas; registra el arrastre con `InputManager`; puntúa aciertos con combos y penaliza los destinos incorrectos. Su registro también aparece en `GameMenu.ts`, `GameInstructionsModal.ts` y en el mapa de transiciones de `main.ts`.

### Utilidades (`src/utils/`)

- `icons.ts`: iconos SVG de interfaz.
- `haptics.ts`: vibración táctil cuando la plataforma la permite.
- `kioskNative.ts`: integración opcional con funciones nativas del kiosco Android. En navegador puede actuar como no-op.

Los recursos se sirven desde `public/assets/`: imágenes de juguetes y fondos, logos, banners y archivos de audio. Las rutas que empiezan con `./assets/` apuntan a esa carpeta pública.

## 3. Cómo llega el jugador a una partida

`KioskApp` en `src/main.ts` es el orquestador:

1. Inicializa el modo nativo, busca `#game-canvas` y crea `AudioManager`, `InputManager` y `ParticleSystem`.
2. Crea los componentes de pantalla y llama `registerGames()`.
3. `registerGames()` instancia cada minijuego y lo guarda en un `Map` usando el `id` de cada juego. También conecta `onGameOver` con el gestor de resultados.
4. Ajusta tamaño y resolución del Canvas al dispositivo y registra cambios de tamaño/orientación.
5. Conecta callbacks de selección, inicio, regreso y finalización.
6. El bucle principal calcula el tiempo transcurrido entre fotogramas (`dt`), actualiza y dibuja el juego activo.

Al seleccionar un juego, la información del menú y las instrucciones se buscan usando ese mismo identificador. Cuando el jugador inicia, `BaseGame.start(KIOSK_CONFIG.defaultGameDurationSeconds)` prepara la partida y llama el método `onStart()` de su clase.

## 4. Puntuación, resultado y guardado

`BaseGame` conserva el puntaje, el récord y el tiempo. El gestor compartido de resultados recibe un `GameResult` al finalizar; `StorageManager` permite leer y guardar récords localmente y `GameOverModal` presenta el resultado.

## 5. Cómo modificar valores comunes

- Cambiar duración de partida: `src/config/kiosk.ts`, `defaultGameDurationSeconds`.
- Cambiar valores de cada objeto: método `getToyConfig()`.
- Cambiar probabilidades: método `chooseRandomToyType()`.
- Cambiar duración/efectos de fiebre: `feverDuration`, `updateFeverState()` y `triggerFeverMode()`.
- Cambiar hitbox táctil: constante `hitMargin` en `processTapAt()`.
- Cambiar imágenes: rutas asignadas en el constructor del juego, dentro de `public/assets/images/`.
- Cambiar nombre, icono o color en el menú: entrada correspondiente de `src/components/GameMenu.ts`.
- Cambiar registro y lógica de integración: `registerGames()` y los datos de transición de `src/main.ts`.

## 6. Glosario corto

- **Canvas:** superficie de dibujo donde se representa el juego.
- **Sprite:** imagen usada para representar un objeto o personaje.
- **`dt`:** tiempo transcurrido desde el fotograma anterior, en segundos.
- **Spawner:** lógica que crea objetos nuevos.
- **Combo:** cantidad de aciertos consecutivos.
- **HUD:** información del juego dibujada sobre la partida.
- **Callback:** función que un módulo entrega a otro para avisar que ocurrió algo, por ejemplo `onGameOver`.
- **Herencia:** `ToyCatchGame extends BaseGame` significa que el juego reutiliza los mecanismos comunes de `BaseGame` y añade sus propias reglas.

## 7. Mapa rápido de lectura

Para entender el proyecto de arriba hacia abajo, lee `index.html` → `src/main.ts` → `src/core/BaseGame.ts` → `src/games/ToyCatchGame.ts`. Luego revisa `InputManager.ts`, `AudioManager.ts`, `ParticleSystem.ts`, `GameInstructionsModal.ts` y `GameMenu.ts` para entender los servicios y pantallas conectados al juego.

