# Guía del código de Feria Mágica del Juguete

Este documento explica cómo está organizado el proyecto y cómo funciona, en particular, el minijuego **¡El Caos del Taller Mágico!**. Está escrito a partir del código que existe actualmente en `src/`.

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

Cada archivo contiene una clase de juego: `ToyCatchGame.ts`, `BellSymphonyGame.ts`, `NutcrackerDrumsGame.ts`, `FlyingElfGame.ts`, `MagicPairsGame.ts`, `SantaHillsGame.ts`, `SnowballTargetGame.ts`, `WorkshopChaosGame.ts` y `WishTreeGame.ts`. Todos reciben el Canvas y los servicios compartidos desde `main.ts`.

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

Al seleccionar `workshop-chaos`, la información del menú y las instrucciones se buscan usando ese mismo identificador. Cuando el jugador inicia, `BaseGame.start(KIOSK_CONFIG.defaultGameDurationSeconds)` prepara la partida y llama el método `onStart()` de `WorkshopChaosGame`.

## 4. El juego «¡El Caos del Taller Mágico!»

### Clase e integración

El archivo `src/games/WorkshopChaosGame.ts` exporta `WorkshopChaosGame`, que hereda de `BaseGame`. El constructor recibe Canvas, entrada, audio y partículas; asigna el identificador `workshop-chaos`, el título e instrucciones; define música y carga los sprites de fondo, regalos, osito, robot, coche, carbón y regalo defectuoso.

`loadImage()` crea imágenes del navegador de forma asíncrona. Si un sprite todavía no ha terminado de cargar cuando se dibuja, `drawObjects()` utiliza un círculo provisional.

### Tipos y datos de cada objeto

`ToyType` restringe las categorías que el código puede asignar: regalos rojos/verdes/azules, osito, robot, coche, regalo dorado, carbón y regalo defectuoso.

`WorkshopObject` describe una instancia que está volando: identificador, tipo, posición (`x`, `y`), velocidades (`vx`, `vy`), gravedad, rotación, radio de toque, escala, valor de puntos, si es peligroso y datos temporales de recogida/transparencia/brillo.

La lista `objects` guarda los objetos activos. `nextObjectId` entrega identificadores únicos para distinguirlos.

### Inicio y ciclo por fotograma

`onStart()` reinicia puntuación, combo, energía, estadísticas, objetos y temporizadores. Conecta `input.onTap` al procesamiento de toques y presenta un mensaje inicial. `destroy()` desconecta ese callback y limpia objetos al desmontar el minijuego.

`onUpdate(dt)` ejecuta la lógica usando `dt` en segundos, por lo que el movimiento se adapta a la duración real entre fotogramas:

1. Suma tiempo transcurrido y actualiza la animación de la máquina.
2. Ajusta la dificultad mediante `updateDifficultyProgression()`.
3. Actualiza la Fiebre de Juguetes.
4. Deja expirar el combo si pasan 3,6 segundos sin aciertos.
5. Reduce el temporizador de lanzamiento y crea objetos cuando llega a cero.
6. Actualiza física, animación y limpieza de objetos.

El `BaseGame` descuenta el tiempo total de partida. Cuando llega a cero detiene la música de juego, activa una breve celebración y luego informa el resultado.

### Dificultad y generación

`updateDifficultyProgression()` aumenta el ritmo por fases. El intervalo de lanzamiento baja de 0,85 s al inicio a 0,68 s, 0,52 s y finalmente 0,38 s conforme progresa el contador interno. Las fases se distribuyen ahora en 0–11, 11–22, 22–34 y desde 34 s para que todas aparezcan durante la partida configurada de 45 s.

`launchBatch()` normalmente lanza un objeto; en fases avanzadas a veces lanza dos. Durante la fiebre lanza dos o tres. `spawnSingleObject()` elige uno de tres conductos de la máquina y genera velocidad horizontal/vertical, gravedad, giro, tamaño y configuración de puntos con variaciones aleatorias. La gravedad hace que el objeto describa un arco: primero sube y después cae.

`chooseRandomToyType()` selecciona el tipo al azar. Los peligros aparecen después de 14 s del contador interno. En fiebre se reduce el riesgo: solo selecciona juguetes, con mayor probabilidad de dorados. `getToyConfig()` concentra los puntos, escala base y condición de peligro:

| Objeto | Puntos base |
|---|---:|
| Regalo rojo, verde o azul | 10 |
| Osito | 15 |
| Robot | 20 |
| Coche | 25 |
| Regalo dorado | 50 |
| Carbón mágico | -30 |
| Regalo defectuoso | -25 |

### Toques, aciertos y penalizaciones

`InputManager` entrega a `onTap` coordenadas escaladas al Canvas. `processTapAt(x, y)` busca el objeto no recogido más cercano dentro de un radio ampliado (`radius * 1.35`), pensado para facilitar el uso táctil. Si encuentra uno, `collectObject()` lo marca como recogido inmediatamente; esa marca evita contabilizar el mismo objeto dos veces.

Si se toca un peligro, el juego descuenta sus puntos (sin permitir bajar de cero), rompe el combo, aumenta el contador de peligros, genera temblor, sonido y humo, y muestra un aviso.

Si se toca un juguete:

- Aumenta la puntuación de combo y actualiza el máximo alcanzado.
- Calcula puntos usando el multiplicador del combo y, durante Fiebre, un multiplicador adicional x2.
- Reproduce sonido; el regalo dorado usa un efecto especial y registra estadísticas.
- Carga energía mágica (5 por juguete normal y 22 por dorado).
- Muestra puntos y, al llegar a los hitos 5, 10 y 20, mensajes de combo y confeti.
- Emite partículas de celebración.

`getComboMultiplier()` define el multiplicador: x1 hasta cuatro aciertos, x1,5 desde cinco, x2 desde diez y x3 desde veinte. `resetCombo()` lo pone a cero al tocar un peligro o al agotarse el tiempo de gracia.

### Fiebre de Juguetes

`feverEnergy` va de 0 a 100. Al completarse, `triggerFeverMode()` activa un estado de seis segundos, reproduce un power-up, sacude ligeramente la pantalla, lanza confeti y muestra el anuncio. Durante la fiebre:

- el ritmo de aparición se acelera (intervalo multiplicado por 0,48);
- se generan más objetos por lanzamiento;
- aparecen más regalos dorados y no se seleccionan peligros;
- los puntos de los aciertos se duplican;
- se dibujan destellos/partículas doradas y una etiqueta de estado.

`updateFeverState()` cuenta el tiempo restante y desactiva la habilidad al terminar.

### Física, animación y dibujo

`updateObjects(dt)` aplica velocidad y gravedad, actualiza rotación y elimina objetos que caen fuera de la pantalla. Los regalos dorados dejan una estela de pequeñas partículas. Los objetos tocados crecen, se desvanecen y se desplazan hacia arriba antes de eliminarse.

`onDraw()` define el orden de las capas: fondo, aura de fiebre, objetos voladores, máquina, partículas y HUD propio. `drawBackground()` usa la imagen de fondo y añade una viñeta; si falta la imagen, pinta un degradado. `drawObjects()` centra y rota cada sprite, añade brillo a los regalos dorados y elige la imagen según `getSpriteForType()`. `drawToyMachine()` dibuja en Canvas el cuerpo, borde, conductos y placa del taller. `drawFeverAura()` agrega el halo de la fiebre. `drawInGameFeverAndComboHUD()` dibuja la barra energética y el combo. `roundRect()` es una ayuda para dibujar paneles redondeados.

## 5. Puntuación, resultado y guardado

`BaseGame` conserva el puntaje, el récord y el tiempo. El gestor compartido de resultados recibe un `GameResult` al finalizar; `StorageManager` permite leer y guardar récords localmente y `GameOverModal` presenta el resultado. El puntaje del Caos se calcula en `collectObject()`. Las estadísticas como juguetes recogidos, regalos dorados y peligros tocados se mantienen en la clase del juego; el resultado compartido puede estar limitado a los campos definidos en `GameResult`.

## 6. Cómo modificar valores comunes

- Cambiar duración de partida: `src/config/kiosk.ts`, `defaultGameDurationSeconds`.
- Cambiar intervalos de dificultad: método `updateDifficultyProgression()` en `WorkshopChaosGame.ts`.
- Cambiar valores de cada objeto: método `getToyConfig()`.
- Cambiar probabilidades: método `chooseRandomToyType()`.
- Cambiar duración/efectos de fiebre: `feverDuration`, `updateFeverState()` y `triggerFeverMode()`.
- Cambiar hitbox táctil: constante `hitMargin` en `processTapAt()`.
- Cambiar imágenes: rutas asignadas en el constructor del juego, dentro de `public/assets/images/`.
- Cambiar instrucciones visibles: entrada `workshop-chaos` en `GAME_INSTRUCTIONS`, dentro de `src/components/GameInstructionsModal.ts`.
- Cambiar nombre, icono o color en el menú: entrada correspondiente de `src/components/GameMenu.ts`.
- Cambiar registro y lógica de integración: `registerGames()` y los datos de transición de `src/main.ts`.

## 7. Glosario corto

- **Canvas:** superficie de dibujo donde se representa el juego.
- **Sprite:** imagen usada para representar un objeto o personaje.
- **`dt`:** tiempo transcurrido desde el fotograma anterior, en segundos.
- **Spawner:** lógica que crea objetos nuevos.
- **Combo:** cantidad de aciertos consecutivos.
- **HUD:** información del juego dibujada sobre la partida.
- **Callback:** función que un módulo entrega a otro para avisar que ocurrió algo, por ejemplo `onGameOver`.
- **Herencia:** `WorkshopChaosGame extends BaseGame` significa que el juego reutiliza los mecanismos comunes de `BaseGame` y añade sus propias reglas.

## 8. Mapa rápido de lectura

Para entender el proyecto de arriba hacia abajo, lee `index.html` → `src/main.ts` → `src/core/BaseGame.ts` → `src/games/WorkshopChaosGame.ts`. Luego revisa `InputManager.ts`, `AudioManager.ts`, `ParticleSystem.ts`, `GameInstructionsModal.ts` y `GameMenu.ts` para entender los servicios y pantallas conectados al juego.

