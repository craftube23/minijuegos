**Plan Maestro: Juegos Interactivos — Feria Mágica del Juguete**
================================================================

> **Proyecto:** Colección de 4 Minijuegos Táctiles Navideños para Tótem Interactivo de Kiosco (Android 11 / Web).  
> **Objetivo:** Experiencias públicas rápidas (1-2 min), altamente intuitivas, optimizadas para touch en hardware comercial, con integración no intrusiva de branding (logos intercambiables) y carrusel publicitario inferior persistente.

* * *

**🔍 FASE 1: Investigación Técnica y de Hardware**
--------------------------------------------------

### **1.1. Análisis del Hardware y Entorno de Ejecución (Android 11 Kiosk)**

Un tótem publicitario con **Android 11** presenta particularidades clave que definen la viabilidad técnica:

* **Incertidumbres del Hardware:**
  * CPU/GPU: Dispositivos de cartelería digital suelen contar con procesadores ARM de gama de entrada/media (Rockchip RK3399/RK3568, Amlogic o Allwinner) con GPUs Mali básicas.
  * RAM: Generalmente 2GB a 4GB compartida con el sistema.
  * WebView / Navegador: Android 11 corre Chromium WebView (versión ~87 a ~120 según actualizaciones).
  * Pantalla táctil: Paneles infrarrojos (IR) o capacitivos (PCAP) verticales (usualmente 1080x1920 Full HD o 720x1280).
* **Restricciones de Rendimiento:**
  * Evitar sobrecarga de memoria (evitar texturas descomunales o memory leaks entre partidas).
  * 60 FPS estables con mínimo consumo de CPU para evitar sobrecalentamiento (_thermal throttling_ en recintos cerrados).
* **Audio en Navegadores (Autoplay Policy):**
  * Android/Chromium bloquea la reproducción de sonido hasta el primer toque del usuario (`AudioContext.resume()` al primer `pointerdown`).
* **Modo Kiosco / UX Táctil:**
  * Debe anularse el zoom por doble toque (`touch-action: none; user-select: none;`).
  * Sin recarga al arrastrar hacia abajo (_overscroll-behavior: none_).
  * Zona interactiva en tercios medio e inferior para garantizar accesibilidad a niños.

* * *

### **1.2. Comparativa de Motores y Tecnologías**

| Criterio                                   | Opción A: HTML5 + Canvas 2D / WebGL (Vite + TS)                  | Opción B: Phaser 3                         | Opción C: Godot 4 (Export Web)                                | Opción D: PixiJS + Howler                    |
| ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------- |
| **Rendimiento Android 11**                 | 🟢 **Excelente** (cero overhead, 60 FPS)                         | 🟢 **Muy bueno** (Canvas/WebGL optimizado) | 🔴 **Riesgoso** (WASM pesado, shaders lentos en GPUs básicas) | 🟢 **Excelente** (Render WebGL ultrarrápido) |
| **Peso Inicial del Bundle**                | 🟢 **< 200 KB** (Carga instantánea)                              | 🟡 **~1.2 MB**                             | 🔴 **> 25 MB** (Descarga y arranque lentos)                   | 🟡 **~800 KB**                               |
| **Soporte Táctil & Multi-touch**           | 🟢 Totalmente configurable vía PointerEvents                     | 🟢 Soporte integrado                       | 🟡 Requiere mapeo WebGL                                       | 🟢 Soporte PointerEvents                     |
| **Reutilización de Código / Arquitectura** | 🟢 **Máxima** (Módulos TS limpios, componentes DOM + Canvas)     | 🟢 Buena (Scenes)                          | 🟡 Escenas Godot aisladas                                     | 🟡 Requiere armar motor de juego             |
| **Integración UI Banner y Logos DOM**      | 🟢 **Nativa y perfecta** (CSS Grid/Flexbox + Canvas superpuesto) | 🟡 Canvas full o DOM Elements de Phaser    | 🔴 Compleja sobre canvas WASM                                 | 🟡 Híbrido manual                            |
| **Independencia / Cero Fallos**            | 🟢 Sin dependencias frágiles                                     | 🟢 Muy probado                             | 🔴 Posibles incompatibilidades WebGL2                         | 🟢 Estable                                   |

### **🏆 Recomendación Tecnológica Principal:**

**Opción A / Híbrida: Arquitectura Modular en TypeScript + HTML5 Canvas optimizado + Vite + Web Audio API.**

* **Por qué:** Cero peso muerto en el bundle, arranque instantáneo (menos de 0.5s), renderizado de 60 FPS garantizado en procesadores ARM de Android 11, separación perfecta entre la zona de juego (Canvas 2D de alto rendimiento) y el carrusel publicitario / UI de resultados (DOM/CSS acelerado por hardware).
* Además, no requiere instalación de software pesado en el tótem: se puede empaquetar como PWA (offline total), WebView APK ligera o correr en un navegador Kiosk como Fully Kiosk Browser.

* * *

**💡 FASE 2: Propuesta de 8 Conceptos de Juegos Navideños**
-----------------------------------------------------------

⚠️ Failed to render Mermaid diagram: Invalid mermaid header: "mindmap". Expected "graph TD", "flowchart LR", "stateDiagram-v2", etc.. Supported types: flowchart/graph, stateDiagram-v2, sequenceDiagram, classDiagram, erDiagram, xychart-beta.

`mindmap   root((Feria Mágica))     J1["1. Atrapa-Regalos Mágico<br><i>(Catch / Reacción)</i>"]     J2["2. El Vuelo del Trineo Mágico<br><i>(Navegación / Obstáculos)</i>"]     J3["3. Taller Exprés de Juguetes<br><i>(Clasificación / Sorting)</i>"]     J4["4. Enciende las Luces Navideñas<br><i>(Memoria / Secuencia Simón)</i>"]     J5["5. Carrera de Galletas de Jengibre<br><i>(Tap Rápido / Ritmo)</i>"]     J6["6. Dispara-Regalos a las Chimeneas<br><i>(Timing / Lanzamiento)</i>"]     J7["7. Muñeco de Nieve Relámpago<br><i>(Puzle / Montaje Rápido)</i>"]     J8["8. Parejas Mágicas de Juguetes<br><i>(Memorama Visual)</i>"]`

* * *

### **Concepto 1: 🎁 Atrapa-Regalos Mágico (Toy Catch Express)**

1. **Objetivo:** Mover la bolsa mágica de Santa deslizando el dedo para atrapar la mayor cantidad de juguetes y regalos que caen, evitando los carbones/bolas de nieve pesadas.
2. **Mecánica:** Deslizamiento horizontal suave o toques directos a las columnas.
3. **Inicio:** Cuenta regresiva 3, 2, 1 con sonido de campana navideña.
4. **Final:** Temporizador de 45 segundos o al cometer 3 fallos.
5. **Duración:** ~45 a 60 segundos.
6. **Puntuación:** Regalo normal (+100 pts), Muñeco/Oso de juguete (+250 pts), Combo x2/x3 al atrapar 5 seguidos sin fallar, Carbón (-150 pts).
7. **Integración del Logo:** El "Regalo Dorado de la Feria" lleva el Logo 1. Al atraparlo, activa el efecto _"¡Lluvia Mágica de la Feria!"_ duplicando puntos durante 6 segundos.
8. **Elementos Navideños:** Bolsa de Santa, nieve animada de fondo, osos de peluche, robots de juguete, estrellas, copos dorados.
9. **Dificultad:** Dinámica y progresiva (empieza suave y caen más rápido a partir de los 20 seg).
10. **Por qué atrae:** Es instantáneamente comprensible para cualquier edad; ver llover juguetes despierta el instinto natural de atraparlos.

* * *

### **Concepto 2: 🛷 El Vuelo del Trineo Mágico (Sleigh Magic Rush)**

1. **Objetivo:** Guiar el trineo de la feria esquivando nubes de tormenta, chimeneas altas y pinos nevados mientras recolecta estrellas mágicas.
2. **Mecánica:** Toque para elevarse / soltar para descender suavemente (o cambio de carril vertical en 3 carriles táctiles amplios).
3. **Inicio:** Santa saluda en el trineo y despega hacia el cielo nocturno estrellado.
4. **Final:** Tras completar una ruta de 60 segundos o chocar 3 veces (sistema de 3 corazones/estrellas).
5. **Duración:** ~60 segundos.
6. **Puntuación:** Distancia recorrida (+10 pts/seg) + Estrellas (+150 pts) + Regalos flotantes (+300 pts).
7. **Integración del Logo:** Las alas del trineo y los portales mágicos de aceleración (_Portales de la Feria_) tienen el Logo 2 brillando; atravesar un portal otorga invulnerabilidad temporal y música especial.
8. **Elementos Navideños:** Trineo mágico, renos con nariz brillante, auroras boreales, pinos nevados, luna llena.
9. **Dificultad:** Media-Baja, accesible y sin frustración.
10. **Por qué atrae:** El efecto de movimiento continuo y la estética del cielo nocturno navideño llaman mucho la atención a distancia.

* * *

### **Concepto 3: 🏭 Taller Exprés de Juguetes (Toy Sorting Wonder)**

1. **Objetivo:** Ayudar a los elfos a clasificar juguetes terminados enviándolos a la caja correcta (Peluches a la izquierda, Carritos/Robots al centro, Instrumentos/Muñecas a la derecha) antes de que la cinta transportadora se llene.
2. **Mecánica:** Toque rápido en los botones grandes de caja o arrastre rápido (_swipe_) hacia el contenedor correspondiente.
3. **Inicio:** La cinta del taller se enciende con sonido de maquinaria de duendes.
4. **Final:** Partida contrarreloj de 50 segundos.
5. **Duración:** ~50 segundos.
6. **Puntuación:** Clasificación correcta (+100 pts), Racha perfecta (+500 pts bonus cada 10 seguidos).
7. **Integración del Logo:** Los paquetes sellados especiales llevan el sello oficial de la _Feria Mágica_; al tocar la caja especial suma puntuación extra.
8. **Elementos Navideños:** Taller de madera rústica, duendes simpáticos, cintas de regalo, juguetes clásicos y modernos.
9. **Dificultad:** Fácil de entender, desafía la velocidad de reacción motriz.
10. **Por qué atrae:** El ritmo rápido y la satisfacción de ordenar juguetes a gran velocidad generan ganas inmediatas de revancha.

* * *

### **Concepto 4: 💡 Enciende el Árbol Mágico (Magic Lights Melody)**

1. **Objetivo:** Repetir la secuencia de luces y campanas mágicas que se encienden en el gran árbol de Navidad de la feria.
2. **Mecánica:** Juego de memoria táctil (tipo Simón Mágico) con 4 bombillas/juguetes luminosos gigantes (Rojo, Verde, Dorado, Azul).
3. **Inicio:** El árbol se ilumina por completo y suena una melodía navideña.
4. **Final:** Al fallar 2 veces o al completar 8 rondas crecientes (tiempo límite total 60s).
5. **Duración:** ~45 a 60 segundos.
6. **Puntuación:** Por cada nivel de secuencia completado (+200, +400, +800 pts) + Bonus de velocidad.
7. **Integración del Logo:** La estrella en la punta del árbol contiene el Logo 1, el cual destella y lanza confeti al superar cada ronda.
8. **Elementos Navideños:** Árbol navideño gigante, esferas brillantes, campanas con notas musicales reales, lazos y nieve.
9. **Dificultad:** Progresiva (comienza con 2 pasos y sube hasta 6-7 pasos).
10. **Por qué atrae:** Es musical, llamativo visualmente y perfecto para niños y familias.

* * *

### **Concepto 5: 🍪 Carrera de Galletas de Jengibre (Gingerbread Dash)**

1. **Objetivo:** Esquivar rodillos de amasar, tazas de chocolate caliente y charcos de caramelo mientras la galleta corre por la mesa navideña.
2. **Mecánica:** Tocar izquierda/derecha para esquivar obstáculos en 3 carriles.
3. **Inicio:** La galleta de jengibre cobra vida y salta a la pista.
4. **Final:** Temporizador de 45 segundos o 3 impactos.
5. **Duración:** ~45 segundos.
6. **Puntuación:** Metros recorridos + Gomitas y chispas de colores recolectadas.
7. **Integración del Logo:** Pancartas publicitarias a los lados de la pista con el Logo 2.
8. **Elementos Navideños:** Galletas de jengibre, bastones de caramelo, chocolate caliente, escarcha dulce.
9. **Dificultad:** Media.
10. **Por qué atrae:** Muy dinámico y cómico.

* * *

### **Concepto 6: 🏠 Dispara-Regalos a las Chimeneas (Chimney Toy Drop)**

1. **Objetivo:** El trineo sobrevuela un pueblo nevado y el jugador debe tocar la pantalla en el momento exacto para soltar el paquete y encestar en las chimeneas iluminadas.
2. **Mecánica:** Toque de precisión temporal (_Timing Tap_).
3. **Inicio:** Vista lateral de casitas con nieve y humo saliendo de chimeneas.
4. **Final:** 15 casas para entregar o 45 segundos de tiempo.
5. **Duración:** ~45 segundos.
6. **Puntuación:** Acierto directo (+200 pts), Chimenea dorada especial (+500 pts), Fallo fuera (+0 pts).
7. **Integración del Logo:** Las chimeneas decoradas con el Logo 1 otorgan fuegos artificiales y puntuación doble.
8. **Elementos Navideños:** Techos nevados, chimeneas con guirnaldas, luces en las ventanas, estrellas fugaces.
9. **Dificultad:** Baja-Media.
10. **Por qué atrae:** Mecánica simple de un solo toque muy satisfactoria.

* * *

### **Concepto 7: ⛄ Muñeco de Nieve Relámpago (Snowman Builder Rush)**

1. **Objetivo:** Montar las partes correctas del muñeco de nieve que Santa solicita en una tarjeta de pedido antes de que se derrita el tiempo.
2. **Mecánica:** Arrastrar o tocar la pieza correcta (Sombreros, Bufandas, Narices de zanahoria, Botones).
3. **Inicio:** Un bloque de nieve base esperando ser vestido.
4. **Final:** 3 muñecos armados o 60 segundos.
5. **Duración:** ~50 segundos.
6. **Puntuación:** Pieza correcta (+150 pts), Muñeco idéntico al modelo (+500 pts).
7. **Integración del Logo:** Bufanda o broche especial de la feria con el Logo 2.
8. **Elementos Navideños:** Nieve, zanahorias, sombreros de copa, bufandas a rayas, escobas de ramas.
9. **Dificultad:** Baja (muy familiar).
10. **Por qué atrae:** Muy creativo y tierno para niños pequeños.

* * *

### **Concepto 8: 🃏 Parejas Mágicas de Juguetes (Memory Toy Match)**

1. **Objetivo:** Voltear cartas mágicas de regalos para encontrar las parejas de juguetes navideños idénticos en el menor tiempo posible.
2. **Mecánica:** Tocar las cartas (Tablero de 8 o 12 cartas con botones gigantes).
3. **Inicio:** Las cartas se muestran boca arriba 2 segundos para memorizar y se voltean.
4. **Final:** Al encontrar todas las parejas o agotarse los 60 segundos.
5. **Duración:** ~30 a 50 segundos.
6. **Puntuación:** Pareja encontrada (+200 pts) - Penalización de tiempo (-5 pts/seg).
7. **Integración del Logo:** El dorso de todas las cartas tiene el Logo 1 oficial; la pareja comodín dorada lleva el Logo 2 y resuelve automáticamente otra pareja.
8. **Elementos Navideños:** Baraja con trenes de juguete, muñecas, peluches, campanas, renos y copos.
9. **Dificultad:** Baja-Media.
10. **Por qué atrae:** Clásico infalible que cualquier persona de 3 a 99 años entiende sin una sola palabra de instrucción.

* * *

**🎯 FASE 3: Selección de los 4 Mejores Minijuegos**
----------------------------------------------------

Para el prototipo de esta primera semana seleccionamos **4 juegos que ofrecen la máxima variedad de mecánicas (Atrapar, Navegar/Esquivar, Memoria Musical y Emparejamiento Rápido)** garantizando máxima reutilización de código y rendimiento sobresaliente:

text

┌──────────────────────────────────────────────────────────────────────────────┐

│                  LOS 4 JUEGOS SELECCIONADOS PARA EL MVP                      │

├────────────────────────────────┬──────────────────────┬──────────────────────┤

│ Minijuego                      │ Mecánica Central     │ Tipo de Jugador      │

├────────────────────────────────┼──────────────────────┼──────────────────────┤

│ 1. 🎁 Atrapa-Regalos Mágico    │ Catch / Deslizamiento│ Acción rápida / Kids │

│ 2. 🛷 El Vuelo del Trineo      │ Navegación 3 Carriles│ Reflejos y emoción   │

│ 3. 💡 Enciende el Árbol Mágico │ Secuencia y Memoria  │ Musical e interactivo│

│ 4. 🃏 Parejas Mágicas de Feria │ Memory / Parejas     │ Visual y familiar    │

└────────────────────────────────┴──────────────────────┴──────────────────────┘

### **Justificación de la selección:**

1. **Cero redundancia:** Cada juego explora un tipo de interacción táctil diferente (Deslizar, Tocar carriles, Secuencia musical con feedback auditivo, Tocar cuadrícula).
2. **Máxima reutilización:** Los 4 juegos comparten el mismo motor de partículas, renderizado Canvas, sistema de sonido Web Audio, temporizadores, lógica de logos y pantalla de Game Over / Récords.
3. **Rendimiento ultra-ligero:** Los 4 minijuegos corren con consumo ínfimo de CPU/RAM en Android 11.

* * *

**🏗️ FASE 4: Arquitectura del Sistema**
----------------------------------------

### **4.1. Estructura de Directorios del Proyecto**

text

c:\Users\ESSA7\OneDrive\Documentos\feria magica el jugete\

├── index.html                  # Contenedor Kiosk principal (Full viewport, No-scroll)

├── package.json                # Vite + TypeScript (Zero overhead)

├── tsconfig.json

├── vite.config.ts

├── public/

│   ├── favicon.ico

│   └── manifest.json           # PWA Kiosk Ready

├── src/

│   ├── main.ts                 # Punto de entrada y orquestador del Kiosco

│   ├── config/

│   │   ├── branding.ts         # Configuración centralizada de Logos y Assets

│   │   ├── banners.ts          # Configuración del Carrusel Publicitario (tiempos, imágenes)

│   │   └── kiosk.ts            # Tiempos de inactividad, modo debug, FPS limiter

│   ├── assets/

│   │   ├── logos/              # logo-1.png, logo-2.png (fácilmente reemplazables)

│   │   ├── banners/            # banner-1.png, banner-2.png, banner-3.png

│   │   ├── images/             # Spritesheets y texturas SVG/PNG optimizadas

│   │   └── audio/              # Clips de audio MP3/OGG (y sintetizador WebAudio fallback)

│   ├── components/             # Componentes UI compartidos (DOM / CSS optimizado)

│   │   ├── KioskHeader.ts      # Barra superior con selector de juego, sonido y reloj

│   │   ├── GameBannerCarousel.ts # Carrusel inferior rotativo de la Feria

│   │   ├── AttractScreen.ts    # Pantalla de bienvenida "Toca para jugar" / Salvapantallas

│   │   ├── GameModal.ts        # Pantallas de pausa, instrucciones visuales exprés

│   │   └── GameOverScreen.ts   # Pantalla de resultados con puntuación, logo y botón de revancha

│   ├── core/                   # Motor compartido de minijuegos

│   │   ├── AudioManager.ts     # Gestor de audio con Web Audio API y auto-unlock

│   │   ├── InputManager.ts     # Abstracción Pointer / Touch / Mouse / Keyboard

│   │   ├── StorageManager.ts   # Récords locales en localStorage

│   │   ├── ParticleSystem.ts   # Efectos de estrellas, copos de nieve y confeti

│   │   ├── BaseGame.ts         # Clase abstracta base para todos los juegos

│   │   └── GameEngine.ts       # Loop a 60 FPS con DeltaTime y escalado responsivo

│   └── games/

│       ├── toy-catch/          # Juego 1: Atrapa-Regalos Mágico

│       │   ├── ToyCatchGame.ts

│       │   └── entities/

│       ├── sleigh-rush/        # Juego 2: El Vuelo del Trineo Mágico

│       │   ├── SleighRushGame.ts

│       │   └── entities/

│       ├── tree-melody/        # Juego 3: Enciende el Árbol Mágico

│       │   ├── TreeMelodyGame.ts

│       │   └── entities/

│       └── magic-pairs/        # Juego 4: Parejas Mágicas de Juguetes

│           ├── MagicPairsGame.ts

│           └── entities/

* * *

### **4.2. Diagrama de la Arquitectura y Layout de Pantalla**

![Mermaid diagram](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMzkzLjQ3Mjk5OTk5OTk5OTUgNDM5LjYiIHdpZHRoPSIxMzkzLjQ3Mjk5OTk5OTk5OTUiIGhlaWdodD0iNDM5LjYiIHN0eWxlPSItLWJnOiMxRjFGMUY7LS1mZzojQ0NDQ0NDOy0tbGluZTojQ0NDQ0NDOy0tYWNjZW50OiMwMDc4RDQ7LS1tdXRlZDojQ0NDQ0NDQ0M7LS1zdXJmYWNlOiMxODE4MTg7LS1ib3JkZXI6I0NDQ0NDQztiYWNrZ3JvdW5kOnZhcigtLWJnKSI+CjxzdHlsZT4KICBAaW1wb3J0IHVybCgnaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1JbnRlcjp3Z2h0QDQwMDs1MDA7NjAwOzcwMCZhbXA7ZGlzcGxheT1zd2FwJyk7CiAgdGV4dCB7IGZvbnQtZmFtaWx5OiAnSW50ZXInLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWY7IH0KICBzdmcgewogICAgLyogRGVyaXZlZCBmcm9tIC0tYmcgYW5kIC0tZmcgKG92ZXJyaWRhYmxlIHZpYSAtLWxpbmUsIC0tYWNjZW50LCBldGMuKSAqLwogICAgLS1fdGV4dDogICAgICAgICAgdmFyKC0tZmcpOwogICAgLS1fdGV4dC1zZWM6ICAgICAgdmFyKC0tbXV0ZWQsIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1mZykgNjAlLCB2YXIoLS1iZykpKTsKICAgIC0tX3RleHQtbXV0ZWQ6ICAgIHZhcigtLW11dGVkLCBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZmcpIDQwJSwgdmFyKC0tYmcpKSk7CiAgICAtLV90ZXh0LWZhaW50OiAgICBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZmcpIDI1JSwgdmFyKC0tYmcpKTsKICAgIC0tX2xpbmU6ICAgICAgICAgIHZhcigtLWxpbmUsIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1mZykgNTAlLCB2YXIoLS1iZykpKTsKICAgIC0tX2Fycm93OiAgICAgICAgIHZhcigtLWFjY2VudCwgY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLWZnKSA4NSUsIHZhcigtLWJnKSkpOwogICAgLS1fbm9kZS1maWxsOiAgICAgdmFyKC0tc3VyZmFjZSwgY29sb3ItbWl4KGluIHNyZ2IsIHZhcigtLWZnKSAzJSwgdmFyKC0tYmcpKSk7CiAgICAtLV9ub2RlLXN0cm9rZTogICB2YXIoLS1ib3JkZXIsIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1mZykgMjAlLCB2YXIoLS1iZykpKTsKICAgIC0tX2dyb3VwLWZpbGw6ICAgIHZhcigtLWJnKTsKICAgIC0tX2dyb3VwLWhkcjogICAgIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1mZykgNSUsIHZhcigtLWJnKSk7CiAgICAtLV9pbm5lci1zdHJva2U6ICBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tZmcpIDEyJSwgdmFyKC0tYmcpKTsKICAgIC0tX2tleS1iYWRnZTogICAgIGNvbG9yLW1peChpbiBzcmdiLCB2YXIoLS1mZykgMTAlLCB2YXIoLS1iZykpOwogIH0KPC9zdHlsZT4KPGRlZnM+CiAgPG1hcmtlciBpZD0iYXJyb3doZWFkIiBtYXJrZXJXaWR0aD0iOCIgbWFya2VySGVpZ2h0PSI1IiByZWZYPSI3IiByZWZZPSIyLjUiIG9yaWVudD0iYXV0byI+CiAgICA8cG9seWdvbiBwb2ludHM9IjAgMCwgOCAyLjUsIDAgNSIgZmlsbD0idmFyKC0tX2Fycm93KSIgc3Ryb2tlPSJ2YXIoLS1fYXJyb3cpIiBzdHJva2Utd2lkdGg9IjAuNzUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIC8+CiAgPC9tYXJrZXI+CiAgPG1hcmtlciBpZD0iYXJyb3doZWFkLXN0YXJ0IiBtYXJrZXJXaWR0aD0iOCIgbWFya2VySGVpZ2h0PSI1IiByZWZYPSIxIiByZWZZPSIyLjUiIG9yaWVudD0iYXV0by1zdGFydC1yZXZlcnNlIj4KICAgIDxwb2x5Z29uIHBvaW50cz0iOCAwLCAwIDIuNSwgOCA1IiBmaWxsPSJ2YXIoLS1fYXJyb3cpIiBzdHJva2U9InZhcigtLV9hcnJvdykiIHN0cm9rZS13aWR0aD0iMC43NSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgLz4KICA8L21hcmtlcj4KPC9kZWZzPgo8ZyBjbGFzcz0ic3ViZ3JhcGgiIGRhdGEtaWQ9IktJT1NLX1ZJRVdQT1JUIiBkYXRhLWxhYmVsPSJUw7N0ZW0gVmVydGljYWwgS2lvc2sgKDEwODAgeCAxOTIwKSI+CiAgPHJlY3QgeD0iNDAiIHk9IjQwIiB3aWR0aD0iMTI4NS40NzI5OTk5OTk5OTk1IiBoZWlnaHQ9IjM1MS42IiByeD0iMCIgcnk9IjAiIGZpbGw9InZhcigtLV9ncm91cC1maWxsKSIgc3Ryb2tlPSJ2YXIoLS1fbm9kZS1zdHJva2UpIiBzdHJva2Utd2lkdGg9IjEiIC8+CiAgPHJlY3QgeD0iNDAiIHk9IjQwIiB3aWR0aD0iMTI4NS40NzI5OTk5OTk5OTk1IiBoZWlnaHQ9IjI4IiByeD0iMCIgcnk9IjAiIGZpbGw9InZhcigtLV9ncm91cC1oZHIpIiBzdHJva2U9InZhcigtLV9ub2RlLXN0cm9rZSkiIHN0cm9rZS13aWR0aD0iMSIgLz4KICA8dGV4dCB4PSI1MiIgeT0iNTQiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9InZhcigtLV90ZXh0LXNlYykiIGR5PSI0LjE5OTk5OTk5OTk5OTk5OSI+VMOzdGVtIFZlcnRpY2FsIEtpb3NrICgxMDgwIHggMTkyMCk8L3RleHQ+CjxnIGNsYXNzPSJzdWJncmFwaCIgZGF0YS1pZD0iR0FNRV9WSUVXIiBkYXRhLWxhYmVsPSLwn5W577iPIFpvbmEgQ2VudHJhbCBkZSBKdWVnbyAoQ2FudmFzIDJEIC8gNjAgRlBTKSI+CiAgPHJlY3QgeD0iNTQwLjkwOTk5OTk5OTk5OTkiIHk9Ijg0IiB3aWR0aD0iMzA4LjEwNTk5OTk5OTk5OTk0IiBoZWlnaHQ9IjI2Ny42IiByeD0iMCIgcnk9IjAiIGZpbGw9InZhcigtLV9ncm91cC1maWxsKSIgc3Ryb2tlPSJ2YXIoLS1fbm9kZS1zdHJva2UpIiBzdHJva2Utd2lkdGg9IjEiIC8+CiAgPHJlY3QgeD0iNTQwLjkwOTk5OTk5OTk5OTkiIHk9Ijg0IiB3aWR0aD0iMzA4LjEwNTk5OTk5OTk5OTk0IiBoZWlnaHQ9IjI4IiByeD0iMCIgcnk9IjAiIGZpbGw9InZhcigtLV9ncm91cC1oZHIpIiBzdHJva2U9InZhcigtLV9ub2RlLXN0cm9rZSkiIHN0cm9rZS13aWR0aD0iMSIgLz4KICA8dGV4dCB4PSI1NTIuOTA5OTk5OTk5OTk5OSIgeT0iOTgiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9InZhcigtLV90ZXh0LXNlYykiIGR5PSI0LjE5OTk5OTk5OTk5OTk5OSI+8J+Vue+4jyBab25hIENlbnRyYWwgZGUgSnVlZ28gKENhbnZhcyAyRCAvIDYwIEZQUyk8L3RleHQ+CjwvZz4KPC9nPgo8cG9seWxpbmUgY2xhc3M9ImVkZ2UiIGRhdGEtZnJvbT0iSEVBREVSIiBkYXRhLXRvPSJHQU1FX1ZJRVciIGRhdGEtc3R5bGU9InNvbGlkIiBkYXRhLWFycm93LXN0YXJ0PSJmYWxzZSIgZGF0YS1hcnJvdy1lbmQ9InRydWUiIHBvaW50cz0iMjg0LjQ1NDk5OTk5OTk5OTksMzQzLjYgMjg0LjQ1NDk5OTk5OTk5OTksMzYzLjYgNDY0LjAzMzQ5OTk5OTk5OTgzLDM2My42IDQ2NC4wMzM0OTk5OTk5OTk4MywzOTEuNiAxMzQ1LjQ3Mjk5OTk5OTk5OTUsMzkxLjYgMTM0NS40NzI5OTk5OTk5OTk1LDMyMy42IDQyNC4wMzM0OTk5OTk5OTk4MywzMjMuNiA2MDMuNjExOTk5OTk5OTk5OSwzMjMuNiA2MDMuNjExOTk5OTk5OTk5NywzMTEuNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ2YXIoLS1fbGluZSkiIHN0cm9rZS13aWR0aD0iMSIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiAvPgo8cG9seWxpbmUgY2xhc3M9ImVkZ2UiIGRhdGEtZnJvbT0iR0FNRV9WSUVXIiBkYXRhLXRvPSJCQU5ORVIiIGRhdGEtc3R5bGU9InNvbGlkIiBkYXRhLWFycm93LXN0YXJ0PSJmYWxzZSIgZGF0YS1hcnJvdy1lbmQ9InRydWUiIHBvaW50cz0iNzA2LjMxMzk5OTk5OTk5OTcsMzExLjYgNzA2LjMxMzk5OTk5OTk5OTksMzIzLjYgODc5Ljc3OTI0OTk5OTk5OTYsMzIzLjYgODc5Ljc3OTI0OTk5OTk5OTYsMzUxLjYgMjAsMzUxLjYgMjAsMzYzLjYgOTE5Ljc3OTI0OTk5OTk5OTYsMzYzLjYgMTA5My4yNDQ0OTk5OTk5OTk2LDM2My42IDEwOTMuMjQ0NDk5OTk5OTk5NiwzNDMuNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ2YXIoLS1fbGluZSkiIHN0cm9rZS13aWR0aD0iMSIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiAvPgo8ZyBjbGFzcz0ibm9kZSIgZGF0YS1pZD0iSEVBREVSIiBkYXRhLWxhYmVsPSLwn5SdIEJhcnJhIFN1cGVyaW9yIChMb2dvIEZlcmlhICsgQm90w7NuIEF1ZGlvICsgVGVtcG9yaXphZG9yIC8gUsOpY29yZCkiIGRhdGEtc2hhcGU9InJlY3RhbmdsZSI+CiAgPHJlY3QgeD0iNTYiIHk9IjMwNi43MDAwMDAwMDAwMDAwNSIgd2lkdGg9IjQ1Ni45MDk5OTk5OTk5OTk4IiBoZWlnaHQ9IjM2LjkwMDAwMDAwMDAwMDAwNiIgcng9IjAiIHJ5PSIwIiBmaWxsPSJ2YXIoLS1fbm9kZS1maWxsKSIgc3Ryb2tlPSJ2YXIoLS1fbm9kZS1zdHJva2UpIiBzdHJva2Utd2lkdGg9IjAuNzUiIC8+CiAgPHRleHQgeD0iMjg0LjQ1NDk5OTk5OTk5OTkiIHk9IjMyNS4xNTAwMDAwMDAwMDAwMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0idmFyKC0tX3RleHQpIiBkeT0iNC41NSI+8J+UnSBCYXJyYSBTdXBlcmlvciAoTG9nbyBGZXJpYSArIEJvdMOzbiBBdWRpbyArIFRlbXBvcml6YWRvciAvIFLDqWNvcmQpPC90ZXh0Pgo8L2c+CjxnIGNsYXNzPSJub2RlIiBkYXRhLWlkPSJCQU5ORVIiIGRhdGEtbGFiZWw9IvCfk6IgQ2FycnVzZWwgUHVibGljaXRhcmlvIEluZmVyaW9yIChBdXRvLXJvdGF0aXZvLCBCYW5uZXJzIGRlIGxhIEZlcmlhKSIgZGF0YS1zaGFwZT0icmVjdGFuZ2xlIj4KICA8cmVjdCB4PSI4NzcuMDE1OTk5OTk5OTk5NiIgeT0iMzA2LjcwMDAwMDAwMDAwMDA1IiB3aWR0aD0iNDMyLjQ1Njk5OTk5OTk5OTgiIGhlaWdodD0iMzYuOTAwMDAwMDAwMDAwMDA2IiByeD0iMCIgcnk9IjAiIGZpbGw9InZhcigtLV9ub2RlLWZpbGwpIiBzdHJva2U9InZhcigtLV9ub2RlLXN0cm9rZSkiIHN0cm9rZS13aWR0aD0iMC43NSIgLz4KICA8dGV4dCB4PSIxMDkzLjI0NDQ5OTk5OTk5OTYiIHk9IjMyNS4xNTAwMDAwMDAwMDAwMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0idmFyKC0tX3RleHQpIiBkeT0iNC41NSI+8J+ToiBDYXJydXNlbCBQdWJsaWNpdGFyaW8gSW5mZXJpb3IgKEF1dG8tcm90YXRpdm8sIEJhbm5lcnMgZGUgbGEgRmVyaWEpPC90ZXh0Pgo8L2c+CjxnIGNsYXNzPSJub2RlIiBkYXRhLWlkPSJHQU1FX0xPT1AiIGRhdGEtbGFiZWw9IkNvcmUgRW5naW5lIChCYXNlR2FtZSBMaWZlY3ljbGUpIiBkYXRhLXNoYXBlPSJyZWN0YW5nbGUiPgogIDxyZWN0IHg9IjU1Ni45MDk5OTk5OTk5OTk5IiB5PSIyNDEuOCIgd2lkdGg9IjI0NS43MjQ5OTk5OTk5OTk5NCIgaGVpZ2h0PSIzNi45MDAwMDAwMDAwMDAwMDYiIHJ4PSIwIiByeT0iMCIgZmlsbD0idmFyKC0tX25vZGUtZmlsbCkiIHN0cm9rZT0idmFyKC0tX25vZGUtc3Ryb2tlKSIgc3Ryb2tlLXdpZHRoPSIwLjc1IiAvPgogIDx0ZXh0IHg9IjY3OS43NzI0OTk5OTk5OTk4IiB5PSIyNjAuMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9InZhcigtLV90ZXh0KSIgZHk9IjQuNTUiPkNvcmUgRW5naW5lIChCYXNlR2FtZSBMaWZlY3ljbGUpPC90ZXh0Pgo8L2c+CjxnIGNsYXNzPSJub2RlIiBkYXRhLWlkPSJJTlBVVCIgZGF0YS1sYWJlbD0iSW5wdXRNYW5hZ2VyIChUb3VjaCAvIFBvaW50ZXIpIiBkYXRhLXNoYXBlPSJyZWN0YW5nbGUiPgogIDxyZWN0IHg9IjU1Ni45MDk5OTk5OTk5OTk5IiB5PSIxODQuOSIgd2lkdGg9IjIyMy40OTQ5OTk5OTk5OTk5OCIgaGVpZ2h0PSIzNi45MDAwMDAwMDAwMDAwMDYiIHJ4PSIwIiByeT0iMCIgZmlsbD0idmFyKC0tX25vZGUtZmlsbCkiIHN0cm9rZT0idmFyKC0tX25vZGUtc3Ryb2tlKSIgc3Ryb2tlLXdpZHRoPSIwLjc1IiAvPgogIDx0ZXh0IHg9IjY2OC42NTc0OTk5OTk5OTk4IiB5PSIyMDMuMzUwMDAwMDAwMDAwMDIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9InZhcigtLV90ZXh0KSIgZHk9IjQuNTUiPklucHV0TWFuYWdlciAoVG91Y2ggLyBQb2ludGVyKTwvdGV4dD4KPC9nPgo8ZyBjbGFzcz0ibm9kZSIgZGF0YS1pZD0iUEFSVElDTEVTIiBkYXRhLWxhYmVsPSJQYXJ0aWNsZVN5c3RlbSAoTmlldmUgLyBDb25mZXRpKSIgZGF0YS1zaGFwZT0icmVjdGFuZ2xlIj4KICA8cmVjdCB4PSI1NTYuOTA5OTk5OTk5OTk5OSIgeT0iMTI4IiB3aWR0aD0iMjIyLjc1Mzk5OTk5OTk5OTkzIiBoZWlnaHQ9IjM2LjkwMDAwMDAwMDAwMDAwNiIgcng9IjAiIHJ5PSIwIiBmaWxsPSJ2YXIoLS1fbm9kZS1maWxsKSIgc3Ryb2tlPSJ2YXIoLS1fbm9kZS1zdHJva2UpIiBzdHJva2Utd2lkdGg9IjAuNzUiIC8+CiAgPHRleHQgeD0iNjY4LjI4Njk5OTk5OTk5OTgiIHk9IjE0Ni40NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0idmFyKC0tX3RleHQpIiBkeT0iNC41NSI+UGFydGljbGVTeXN0ZW0gKE5pZXZlIC8gQ29uZmV0aSk8L3RleHQ+CjwvZz4KPGcgY2xhc3M9Im5vZGUiIGRhdGEtaWQ9IkFVRElPIiBkYXRhLWxhYmVsPSJBdWRpb01hbmFnZXIgKFdlYkF1ZGlvIEZYICsgSmluZ2xlcykiIGRhdGEtc2hhcGU9InJlY3RhbmdsZSI+CiAgPHJlY3QgeD0iNTU2LjkwOTk5OTk5OTk5OTkiIHk9IjMwNi43MDAwMDAwMDAwMDAwNSIgd2lkdGg9IjI3Ni4xMDU5OTk5OTk5OTk5NCIgaGVpZ2h0PSIzNi45MDAwMDAwMDAwMDAwMDYiIHJ4PSIwIiByeT0iMCIgZmlsbD0idmFyKC0tX25vZGUtZmlsbCkiIHN0cm9rZT0idmFyKC0tX25vZGUtc3Ryb2tlKSIgc3Ryb2tlLXdpZHRoPSIwLjc1IiAvPgogIDx0ZXh0IHg9IjY5NC45NjI5OTk5OTk5OTk5IiB5PSIzMjUuMTUwMDAwMDAwMDAwMDMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTMiIGZvbnQtd2VpZ2h0PSI1MDAiIGZpbGw9InZhcigtLV90ZXh0KSIgZHk9IjQuNTUiPkF1ZGlvTWFuYWdlciAoV2ViQXVkaW8gRlggKyBKaW5nbGVzKTwvdGV4dD4KPC9nPgo8L3N2Zz4=)

* * *

### **4.3. Especificación del Sistema de Logos y Banners**

#### **Sistema de Logos (`src/config/branding.ts`):**

* Configuración con ruta flexible a `assets/logos/logo-1.svg` y `assets/logos/logo-2.svg`.
* Los minijuegos consultan `Branding.getLogo(1)` o `Branding.getLogo(2)` sin importar el archivo subyacente.
* Si no hay archivo de imagen presente, el sistema genera dinámicamente un render vectorial SVG con el texto temático de la Feria.

#### **Sistema del Carrusel Inferior (`src/components/GameBannerCarousel.ts`):**

* Ubicado en la franja inferior (aproximadamente 15% a 20% de la altura de la pantalla, dejando el 80% libre para el juego, como en el boceto wireframe adjunto).
* Transición suave CSS (_cross-fade_ o _slide_), configurable a 5-8 segundos por slide.
* Totalmente configurable mediante un array JSON de banners (`src/config/banners.ts`).
* No bloquea toques ni eventos del juego.

#### **Sistema de Audio Responsivo (`src/core/AudioManager.ts`):**

* Incluye un **sintetizador Web Audio API nativo** capaz de generar efectos de sonido navideños (campanillas, monedas, victoria, fallo, power-up) de forma instantánea **sin necesidad de esperar a descargar archivos externos de audio**, además de soportar archivos `.mp3`/`.ogg` si están presentes.
* Desbloqueo automático en el primer toque de pantalla conforme a las políticas de Chromium en Android 11.

#### **Temporizador de Inactividad de Kiosco:**

* Si pasan 30 segundos sin interacción táctil en cualquier pantalla o juego, la aplicación regresa suavemente a la **Pantalla de Atracción (Salvapantallas interactivo)** con música ambiente y llamado a la acción _"¡Toca la pantalla para jugar!"_.

* * *

**📅 FASE 5: Plan de Implementación por Fases**
-----------------------------------------------

1. **Paso 1: Configuración del Proyecto Base**
   * Inicializar proyecto con Vite + TypeScript optimizado.
   * Estructurar carpetas de assets, configuración de logos y banners.
   * Configurar modo Kiosk (viewport bloqueado, CSS reset táctil).
2. **Paso 2: Desarrollo del Core Compartido**
   * Implementar `InputManager` (Multi-touch, Pointer, Mouse, Keyboard).
   * Implementar `AudioManager` (Web Audio sintetizador de efectos navideños + reproductor).
   * Implementar `ParticleSystem` (Nieve flotante constante + confeti de celebración).
   * Implementar `StorageManager` (Récords locales en memoria/localStorage).
   * Implementar `GameBannerCarousel` (Carrusel inferior de banners con cambio automático).
   * Implementar `KioskHeader` y `GameOverScreen` con integración del Logo 1 y Logo 2.
3. **Paso 3: Desarrollo del Minijuego 1 (🎁 Atrapa-Regalos Mágico)**
   * Lógica de caída de regalos, juguetes, estrellas y carbón.
   * Power-up del Logo Dorado de la Feria con lluvia mágica.
4. **Paso 4: Desarrollo del Minijuego 2 (🛷 El Vuelo del Trineo Mágico)**
   * Sistema de 3 carriles táctiles y movimiento continuo.
   * Portales mágicos de aceleración con el Logo de la Feria.
5. **Paso 5: Desarrollo del Minijuego 3 (💡 Enciende el Árbol Mágico)**
   * Sistema de notas musicales y bombillas táctiles gigantes.
   * Estrella del Logo de la Feria en la cúspide con animación de destellos.
6. **Paso 6: Desarrollo del Minijuego 4 (🃏 Parejas Mágicas de Feria)**
   * Cuadrícula de cartas táctiles con reverso oficial del Logo 1.
   * Pareja comodín dorada con Logo 2.
7. **Paso 7: Pantalla de Menú Principal / Selector de Juegos & Modo Atracción**
   * Selector visual tipo carrusel de minijuegos con estética navideña.
   * Temporizador de reinicio por inactividad.
8. **Paso 8: Documentación Completa (`README.md`)**
   * Instrucciones de ejecución, despliegue en Android 11 Kiosk, personalización de logos y banners.

* * *

**🧪 FASE 6 & 7: Plan de Verificación y Optimización**
------------------------------------------------------

### **Verificación Funcional:**

* Cambio fluido entre los 4 juegos desde el menú principal.
* Correcta acumulación y guardado de puntuación máxima local.
* Funcionamiento de los power-ups con logos en cada juego.
* Rotación automática del carrusel publicitario inferior cada X segundos.
* Retorno automático a la pantalla de atracción tras inactividad.
* Botón de silenciar/activar audio funcional.

### **Verificación Táctil y Kiosk:**

* Toques simultáneos y arrastre suave sin retraso (_input latency_ < 16ms).
* Sin zoom accidental, selección de texto ni menús contextuales.
* Adaptación responsive tanto en resolución vertical 9:16 (1080x1920) como en pantallas horizontales o tablets.

### **Optimización de Rendimiento:**

* 60 FPS estables medidos con monitor interno de rendimiento.
* Peso total del bundle compilado < 1.5 MB para carga instantánea en Android 11.
* Cero consumo de CPU en reposo / modo salvapantallas.
