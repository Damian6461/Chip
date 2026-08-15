# Chip

Virtual pet en pixel art. HTML, CSS y JavaScript vanilla con módulos ES. Sin frameworks, sin build, sin dependencias.

Este archivo documenta **lo que el código hace hoy**: cómo correrlo, qué contratos hay que respetar y dónde están los bordes filosos. El *por qué* de las decisiones de diseño vive en el brief del proyecto, que no está en el repo.

---

## Correrlo

Hay que servirlo por HTTP. **Los módulos ES no cargan desde `file://`** — abrir `index.html` con doble clic tira error de CORS. Usá Live Server o cualquier server estático sobre la carpeta.

```
http://127.0.0.1:5500/index.html
```

## Tests

100 pruebas, mismos archivos en dos entrypoints:

```bash
node tests/correr.mjs        # sale 0 si pasa todo, 1 si no
```

```
http://127.0.0.1:5500/tests/   # verde/rojo en la página, resumen en el <title>
```

No hace falta `package.json`: Node detecta la sintaxis de módulo sola. Los dos entrypoints instalan un `localStorage` en memoria antes de importar nada del juego, así que **la suite nunca toca tu partida**, ni siquiera en el navegador donde el origen es el mismo.

Se corren después de cualquier cambio que toque estado, decay o persistencia.

## Panel de debug

```
http://127.0.0.1:5500/index.html?debug=1
```

Sin el parámetro, `js/debug.js` ni se descarga (import dinámico).

| Control | Qué hace |
|---|---|
| multiplicador | escala las horas de los dos controles de abajo |
| simular h | aplica el decay de N horas **en el momento** |
| volver tras N h | retrocede `ultimaVisita` **sin** aplicar decay y recarga |
| visual | fuerza un estado visual, o `auto` para volver a la cadena |
| hora | fuerza la hora del reloj (0-23), o `auto` |
| sumar días | suma presencia acumulada, para ver el arco de los gigantes avanzar |
| disparar hito | dispara el hito pendiente sin esperar a la próxima apertura |
| sumar objeto | agrega el primer objeto que falte, para poblar el estante |
| reiniciar partida | save nuevo en 100/100/100 |

La lectura de abajo muestra los stats con decimales, la colección cruda, la presencia, la capa que alcanzó el arco y los hitos ya vividos.

**`visual` y `hora` no son lo mismo.** `visual` pisa el resultado de la cadena y no toca nada más: forzar `standby` cambia el sprite y deja el galpón como esté. `hora` mueve el reloj que usa el juego, así que arrastra la cadena **y** el fondo: poner 23 muestra a Chip en standby con el galpón de noche, que es el estado real de esa hora. `hora` no se resetea al reiniciar la partida — el save y el reloj son cosas distintas.

**`simular h` y `volver tras N h` no son lo mismo.** El primero cobra el decay ya; al recargar no quedan horas transcurridas y **los eventos nunca se disparan**. El segundo recorre el camino de arranque real, como si hubieras cerrado y vuelto a abrir la app: es el único que sirve para ver eventos.

La lectura de stats de abajo sigue **también** a los botones del juego: `iniciarDebug` devuelve su función de refresco y `pintar()` la engancha.

---

## Reglas de arquitectura

Se rompen y el proyecto se degrada rápido.

- **`estado.js` es el único que toca `localStorage`.**
- **`ui.js` es el único que toca el DOM del juego** (lo declarado en `index.html`). Recibe y pinta: no calcula. Excepción declarada: `debug.js` crea su propio subárbol, lo appendea a `document.body` y no lee ni modifica nada que no haya creado él.
- **`decay.js` es puro.** No guarda, no lee `localStorage`, no toca el DOM, no muta lo que recibe.
- **`acciones.js` es puro.** Señala "no apliqué" devolviendo la misma referencia.
- **`config.js` es el único hogar de las constantes del juego.** Tres carve-outs documentados en el propio archivo: `sw.js`, `manifest.json` y `tests/config.pruebas.js`.
- **El decay se calcula por diferencia de timestamps, nunca con un contador corriendo.**

`main.js` orquesta: mantiene el estado vivo, resuelve el reloj y es el único con timers.

---

## Cadena de estados visuales

Prioridad, gana la primera condición verdadera:

1. acción en curso → `cargando` / `jugando` / `limpiando`
2. `bateria < 15` → `critico`
3. hora local entre 23 y 7 → `standby`
4. `bateria > 70` **y** `humor > 70` → `feliz`
5. resto → `idle`

Las tres comparaciones son **estrictas**: batería en 15 exacto no es `critico`, y `feliz` pide que los dos stats pasen el umbral.

Las acciones van primero porque son feedback transitorio: si tocás Cargar con la batería en 12 y no cambia nada, la acción se siente muerta justo cuando más importa que responda. El bucle queda `critico` → `cargando` → `idle`.

**Las acciones del jugador saltean el debounce.** Sin eso, con el debounce y la duración de acción valiendo lo mismo (2 s), la ventana se come la transición y a veces no ves nada.

`resolverEstadoVisual({ estado, ahora, accion })` recibe `ahora` como timestamp **sin default**: el reloj entra por el llamador, así `standby` es testeable en cualquier zona horaria.

---

## Contrato de sprites

`/sprites/`, **carpeta en minúscula** — Windows no distingue, un hosting Linux sí.

```
idle.png  feliz.png  critico.png  standby.png  cargando.png  jugando.png  limpiando.png
```

256×256, PNG con transparencia, personaje centrado. **Mismo tamaño y mismo encuadre en todos**: si el robot está más arriba en uno, salta al cambiar de estado.

Siete archivos ideales, **seis obligatorios**: `limpiando.png` es opcional. Los siete están en el repo desde `2e6b288`, todos a 256×256.

Además hay dos **recortes de la región ocular** —`idle-ojos.png` y `feliz-ojos.png`— para el parpadeo: mismo lienzo de 256, transparentes, alineados al original. Un estado sin recorte no parpadea y no rompe nada.

El loader degrada en dos escalones: falta el sprite pedido → usa el de `idle`; falta ese también → placeholder con el nombre del estado escrito. Eso permitió desarrollar sin arte y verificar la cadena a ojo. **Contrapartida, y ahora está activa:** con los siete PNG en su lugar, un sprite que falte se ve como `idle` en vez de cantar el error.

`ui.js` apaga el suavizado (`ctx.imageSmoothingEnabled = false`) apenas crea el contexto: el bilineal del navegador emborrona el pixel art al escalarlo. Es estado del contexto, no un parámetro de `drawImage`, así que se setea una sola vez y sobrevive a `clearRect`. **Cambiar el tamaño del canvas lo resetea a `true`** — si algún día el canvas deja de ser fijo, hay que volver a bajarlo.

Esa arista se cerró con el rediseño full-bleed: **el canvas mide 256, igual que los sprites**, así que el contexto 2D dibuja 1 a 1 y el escalado a pantalla lo hace el CSS con `image-rendering: pixelated`. Antes el canvas medía 320 y el ×1,25 dejaba uno de cada cuatro píxeles del doble de ancho.

---

## El fondo del galpón

Dos panorámicas de 1672×941 en `/sprites/`: `fondo-dia.png` y `fondo-noche.png`. No son sprites de estado — no entran en `RUTAS_SPRITES` ni pasan por el loader con fallback. Las rutas viven en `RUTAS_FONDOS` (`config.js`) y `ui.js` las escribe en `--fondo-actual`, la custom property que pinta la escena.

**La panorámica no es el fondo de una interfaz: es la pantalla.** Va nítida y sin filtro, a altura completa, y todo lo demás flota encima.

### El encuadre

```
background-size: auto 100%;
background-position-x: calc(var(--alto-escena) * var(--fondo-corrimiento) * -1);
```

El encuadre buscado es entrar **8% dentro de la panorámica** desde su borde izquierdo: con eso la ventana del galpón queda a la izquierda del cuadro y detrás de Chip pasa la pared lisa del portón.

**Ese 8% no se puede escribir como `background-position-x: 8%`.** El porcentaje de `background-position` no mide sobre la imagen, mide sobre el **sobrante** entre la imagen escalada y el contenedor, así que el valor equivalente cambia con cada viewport: en el panel cuadrado de 320 que hubo antes eran 18,3%, y en un teléfono de 390×844 son 10,8%. Un número fijo le come la ventana por la izquierda en cuanto cambia la pantalla.

Lo que se conserva es la lógica, no el número. Con `background-size: auto 100%` la imagen escalada mide `alto × 1,7768`, así que entrar 8% en ella es correrla `alto × 0,08 × 1,7768` hacia la izquierda — un `calc` que da el mismo encuadre en cualquier pantalla. `FONDO_CORRIMIENTO` (`config.js`) es ese factor, derivado en el código de `FONDO_ENTRADA` y `FONDO_PROPORCION` para que la cuenta quede a la vista.

### Día y noche

El swap usa `esDeNoche()` de `sprites.js`, que es **la misma franja que el standby** (23 a 7): si Chip duerme, afuera es de noche. No es una regla paralela, es la misma función — hay una prueba que lo verifica en los cuatro bordes.

`main.js` la resuelve con el mismo `relojEfectivo()` que la cadena, así el sprite y el fondo no pueden discrepar. El tick de 60 s evalúa **las dos cosas sin cortocircuito**: con la batería en `critico`, cruzar las 23:00 no cambia el sprite —`critico` le gana a `standby`— pero el galpón igual se tiene que hacer de noche.

La clase `es-noche` del `body` sale del mismo dato, para lo que cambia de ritmo y no de imagen: el latido de la antena y el polvo del haz.

### Contraste sobre la escena

La escena va a plena luz, así que **ningún texto se apoya directamente sobre ella**: cada pieza trae su propio fondo. Medido contra el píxel más claro de cada panorámica —el peor caso, en cualquier viewport:

| Texto | Sobre | Día | Noche |
|---|---|---|---|
| evento `#c9ced7` | `rgba(6,8,12,.72)` | 5.75:1 | 6.58:1 |
| etiqueta `#b8bec8` | `rgba(10,12,17,.93)` | 9.14:1 | 9.36:1 |
| número `#e6e6e6` | `rgba(10,12,17,.93)` | 13.69:1 | 14.01:1 |

Los tres pasan AA (4,5:1) con margen. Las teclas deshabilitadas quedan al 28% y no llegan: WCAG exime a los controles deshabilitados, y que se lean apagadas es justamente el punto.

### Por qué la escena recorta y Chip no

`#escena` lleva `overflow: hidden` —es la pantalla, nada se le escapa— pero Chip vive adentro con aire de sobra arriba: el sprite de `jugando` tiene 1,3 px de margen transparente y el salto sube 8, y a 371 px de alto le quedan más de 100 px de galpón por encima de la antena. El recorte que antes había que evitar era el del panel de 320, que ya no existe.

### Peso

Los dos fondos son PNG-8 cuantizados, bajo 500 KB cada uno. **No son pixel art de paleta corta**: el original de día tiene 59.685 colores únicos y el de noche 26.103, así que la cuantización es con pérdida y hay que elegirla mirando.

| Archivo | Antes | Ahora | Paleta | Dither |
|---|---|---|---|---|
| `fondo-dia.png` | 1620 KB | 464 KB | 101 colores | no |
| `fondo-noche.png` | 1467 KB | 411 KB | 48 colores | sí |

El dither va por imagen y no por gusto: en el día el piso queda limpio sin él y el dither le mete grano visible; en la noche, sin dither el farol de la pared hace anillos concéntricos en la caída de luz. A 256 colores no bandea ninguna de las dos, pero pesan 765 KB y 946 KB — fuera de presupuesto.

---

## La colección

Los eventos dejan cosas. "Encontró una tuerca del tamaño de su cabeza" ya no es sólo una línea: la tuerca entra a la colección y se queda.

Mismo corte que los eventos: **`js/datos-objetos.js` es el contenido** (qué objetos hay, de qué evento salen, de qué tier son) y **`js/coleccion.js` es la lógica** (qué deja una visita). `coleccion.js` no toca `localStorage` — devuelve una colección nueva y quien guarda es `main.js`, igual que con el decay.

**La línea del canon no se copia.** Cada objeto apunta a su evento por id y el texto se toma de `datos-eventos.js`. Copiarlo sería tener dos originales del mismo texto y que se separen en la primera corrección editorial. Hay una prueba que verifica que cada `canon` sea exactamente el texto de su evento.

### Las reglas

| Regla | Dónde | Cómo |
|---|---|---|
| un objeto no se otorga dos veces | `otorgarPorEventos` | el id ya está en la colección |
| el raro pide moneda cargada | `PROBABILIDAD_OBJETO_RARO` | 0.04 — fracción, no porcentaje |
| una sola tirada por visita | `otorgarPorEventos` | no una por objeto |
| techo por visita | `MAX_OBJETOS_POR_VISITA` | 3 |
| garantía diaria | `horasConGarantiaDiaria` | piso sobre las horas |

**El evento sigue saliendo aunque su objeto ya esté.** Se decidió no sacarlo del pool: siete de los veinte eventos dejan objeto, y excluirlos iría achicando el pool justo a medida que la colección crece. Que Chip encuentre otra tuerca y no sume nada es fiel — la tuerca ya la tiene. La mezcla de eventos-con-objeto y eventos-puros aumenta sola con el tiempo, que es el ritmo que pide el brief.

**La tirada de rareza va en el objeto, no en el evento.** El plan la pedía en el evento, pero el evento 8 deja tres objetos —resorte, arandela y la-cosa-que-no-sabe-qué-es— y sólo el tercero es raro: gatillar el evento al 4% habría arrastrado dos comunes a la rareza, justo lo contrario de "los comunes caen con la cadencia normal". Cuando los raros tengan evento propio, las dos lecturas coinciden y no hay que cambiar nada.

**El techo existe porque un solo evento puede dejar tres objetos.** La tabla de horas ya limita los eventos a dos, pero sin techo una vuelta de ausencia larga podía entregar cinco cosas de golpe. Lo que no entra no se pierde: queda para la próxima visita.

### La garantía diaria

La primera visita de cada día calendario trae algo aunque hayan pasado diez minutos — el "periódico de Tsuki". Se implementa como **piso sobre las horas** y no como una rama adentro de `cuantosTocan`: "hoy todavía no viste nada" equivale exactamente a "pasó al menos el mínimo", y así la tabla de horas sigue siendo el único lugar donde se decide cuántos eventos tocan.

El día es **local** y en formato `YYYY-MM-DD`: volver a las 23:50 y de nuevo a las 00:10 son dos días. Se guarda en `ultimoDiaConEvento`.

### El save v4

`coleccion` (array de ids) y `ultimoDiaConEvento` son campos nuevos, así que **la migración salió gratis**: el merge-con-defaults-primero de `estado.js` los trae solos. Una partida de meses cruza a v4 con la colección vacía y la garantía lista, sin código de puente. Es exactamente para lo que ese merge estaba escrito.

El panel de debug muestra la colección cruda —`colección 2/8` y la lista de ids—, el día del último evento y un botón `sumar objeto` para poblar el estante sin esperar al sorteo.

### El estante no está en el estante

La panorámica tiene un estante de madera dibujado, con una tuerca, un cable enrollado, una arandela y un resorte pintados encima: el arte estaba hecho esperando la colección. **Pero está en x 1180-1480 de la imagen y nunca entró en cuadro** — ni siquiera en el panel cuadrado de antes, que llegaba hasta 1075.

Y no puede entrar. Los números:

| | |
|---|---|
| panorámica visible en 390×844 | 435 px de imagen |
| ventana (validada, con el polvo y la luz) | x 150-335 |
| estante pintado | x 1180-1480 |
| hace falta para los dos juntos | 1330 px |

Encuadrar sobre el estante tampoco sirve: Chip mide 371 de 390 y queda parado justo delante, tapándolo.

Así que las piezas van **al alféizar de la ventana**, que es la única superficie visible que queda libre de Chip. Medido sobre el sprite, la franja libre a la izquierda de Chip por altura de escena:

| y 340-380 | y 460-500 | y 570-680 (piso) |
|---|---|---|
| 0-179 px | 0-73 px | 0-72 px |

Entran cuatro piezas de 16 px por fila, y las filas se apilan hacia arriba desde la línea del alféizar.

**Se probó primero en el rincón del piso y se descartó con la captura a la vista:** sobre el piso oscuro las siluetas de lo que falta desaparecían, y ahí está justamente su trabajo. Contra el cielo del atardecer se recortan solas. Por la misma razón la silueta no es "opacidad baja" sino **sombra** (`brightness(0.3)`): oscura contra la ventana iluminada, que es donde está.

El alféizar además es canon — "Miró la lluvia por la ventana del fondo. Es su ventana" — y es una superficie de verdad: las piezas se apoyan, no flotan.

### Las formas

Los sprites de los objetos **se dibujan por código** (`js/formas.js`): siluetas SVG simples con la paleta del juego, todas en un `viewBox` de 24×24 para que el tamaño lo decida el CSS. No pretenden ser arte — pretenden ser reconocibles a 16 px mientras el arte ilustrado no exista. Hay una prueba que verifica que cada objeto del catálogo tenga la suya y no caiga al casillero genérico.

### Los gigantes

Los cuatro grandes del canon —la grúa vieja, el carguero, el robot de carga y los de mantenimiento pesado como grupo— viven en la segunda sección de la colección y se revelan **por capas, según la presencia acumulada**.

**Presencia son días distintos con visita**, no visitas y no tareas: abrir tres veces el mismo día cuenta uno. Estar es lo único que hace avanzar esto, y eso es lo que lo separa de una barra de progreso.

| Capa | Días | Qué se ve |
|---|---|---|
| silueta | 0 | una incógnita: no sabés quién es |
| nombre | 3 | la silueta de verdad y el nombre |
| detalle | 10 | lo que Chip fue entendiendo de él |
| hito | 30 | el momento en que ese gigante lo nota |

**El hito no se lee antes de vivirlo.** Llegar al umbral no alcanza: hasta que el evento no pasó, la ficha no muestra el texto. Leerlo antes sería spoilear el único momento del juego.

**Regla de tono, textual del brief y anotada en `datos-gigantes.js`:** los gigantes nunca se vuelven amigos. Notar ≠ adoptar. El máximo del arco es un gesto.

### La resignificación del evento del brazo

El evento de la grúa que baja el brazo **ya no se sortea**. Salía con una moneda cargada al 1,5% por visita, fuera del pool; ahora es el hito del arco de la grúa y se dispara **una sola vez en la partida**, cuando la presencia llega a 30 días.

Lo que eso cambió en el código:

- `elegirEventos` perdió su cuarto parámetro y su import de `EVENTO_RARO`. Volvió a hacer una sola cosa: repartir el pool general.
- `PROBABILIDAD_EVENTO_RARO` desapareció. La prueba de "probabilidad como fracción" sigue viva, pero sobre `PROBABILIDAD_OBJETO_RARO`, que es la que hoy sortea rareza.
- El hito, cuando toca, es **el único evento de esa visita**: no comparte cartel con "barrió el pasillo tres".
- `hitosVistos` en el save es lo que lo hace único. Los días siguen subiendo; el momento pasa una vez.

La escasez es la misma que antes. Lo que cambia es que ahora significa algo: llegaste ahí por estar, no por suerte.

### El estado sin números

El panel que aparece al tocar a Chip perdió las cifras: el nivel se lee del largo, con **marcas de referencia a 25 / 50 / 75%** para tener contra qué leerlo. Es lo que tiene un instrumento analógico y no tiene una barra de progreso web. Los decimales siguen en el panel de debug.

**El número se fue de la vista, no del DOM.** Las barras son puro CSS: borrar el dígito dejaría a un lector de pantalla sin ninguna forma de saber cómo está Chip. Se esconde con `clip-path` y sigue disponible para quien lo necesita.

---

## Animaciones de vida

| Qué | Dónde | Duración |
|---|---|---|
| rebote permanente, `0` → `-4px` | `#contenedor-mascota` | `CICLO_REBOTE_MS` — 2.2 s, loop |
| salto de acción, `0` → `-8px` → `0` | `#canvas-mascota.saltando` | `DURACION_SALTO_MS` — 300 ms, una vez |
| barra viajando al valor nuevo | `.barra-fill` | `TRANSICION_BARRA_MS` — 400 ms |
| tecla que se hunde 1 px | `#acciones button:active` | `DURACION_PRESION_MS` — 90 ms |

El rebote corre siempre, en todos los estados, sin que el jugador toque nada.

**Las duraciones viven en `config.js`, no en el CSS.** Una hoja de estilos no puede importar un módulo, así que `ui.js` las inyecta como custom properties en `:root` al arrancar (`VARS_ANIMACION`) y `style.css` las lee con `var()`. Duplicarlas en el CSS habría sido un cuarto carve-out de la regla de `config.js`, y este no hacía falta. Sin JS las `var()` no resuelven, la declaración de `animation` queda inválida y no hay movimiento: el juego funciona igual.

**2.2 s y no 2, a propósito.** `DEBOUNCE_VISUAL_MS` y `DURACION_ESTADO_ACCION_MS` valen 2 s los dos: un ciclo del mismo largo quedaría en fase con ellos y el cambio de sprite caería siempre en el mismo punto del rebote.

**El rebote va en el contenedor y el salto en el canvas de adentro.** Dos animaciones sobre el mismo elemento no se suman: para la propiedad que las dos tocan (`transform`) gana la última declarada, así que el salto se comería el rebote mientras dura. Anidados, los dos transforms se componen solos. Para eso existe `#contenedor-mascota` en `index.html` — es un elemento que está sólo para animar.

`main.js` llama a `animarAccion()` dentro de `ejecutar()`, **después** del early return: si la acción no se aplicó —jugar sin batería—, no hay salto.

### La piel del aparato

La interfaz pertenece al galpón: es un instrumento, no una página.

**Los colores salen de Chip, no de una paleta de UI.** Están muestreados de `sprites/idle.png` con conteo de píxeles y viven en `COLORES_BARRAS` (`config.js`), de donde `ui.js` los inyecta como custom properties.

| Barra | Color | De dónde |
|---|---|---|
| Batería | `#01ffff` | las barras del display del pecho |
| Humor | `#ffa300` | las hombreras |
| Mant. | `#ffc899` | el brillo cálido de los aros de los ojos |

**Los tres son colores de luz, y ahí está el criterio.** El primer candidato para Mant. fue `#c2a593`, la placa del torso: al 100% se leía apagado al lado de los otros dos, porque es color de superficie —luz reflejada— y las barras son indicadores encendidos. El naranja del hover de los botones y el `>` del log son el mismo `--color-humor`: el acento del aparato es el del personaje.

**Escala de espaciado 8 / 16 / 24** (`--esp-1/2/3`), y nada fuera de esa escala.

**La fuente de instrumento** (`--fuente-instrumento`) es el stack monoespaciado del sistema, sin archivo. Cualquier fuente externa rompería el offline. Si algún día entra una propia, se declara en el mismo lugar y va a `ARCHIVOS_CACHE` con su bump.

**El prefijo `>` del evento es un `::before`**, no un elemento: `ui.js` escribe únicamente el texto. La sangría francesa de `2ch` alinea la segunda línea bajo el texto y no bajo el prefijo, que es exactamente el ancho de `"> "` porque la fuente es monoespaciada.

**Los tres estados de una tecla** tienen que distinguirse sin leer: normal con borde y canto duro abajo, apretada 1 px más abajo con el canto a la mitad, y deshabilitada sin borde, sin canto y al 28% — una tecla que no está no se puede confundir con una que sí.

---

## La escena es la pantalla

El juego no es un panel de control con un dibujo arriba: es un lugar. Abrirlo es entrar al galpón.

```
#escena  ← la panorámica a pantalla completa, nítida
├── #polvo          16 motitas de polvo, en toda la escena
├── #toma           la toma de corriente; z-index -1, recibe la luz de la hora
├── #chip           posición y tamaño; NO se anima
│   ├── #sombra     quieta: cuando Chip salta, se queda en el piso
│   └── #contenedor-mascota   rebota
│       ├── canvas 256×256
│       ├── #pantalla         la del pecho, con la batería de verdad
│       └── #efectos          glow, Z, chispas
├── #estado         los números, sólo al tocar a Chip
├── #evento         una línea apoyada en el piso
└── #acciones       la botonera, en el piso de la pantalla
```

**Mobile-first.** En un teléfono la escena es la pantalla entera; en desktop se limita a `--ancho-escena` (480 px) y el resto queda en negro. El juego es un objeto vertical.

**Chip mide 44% del alto** (`--alto-chip`) y pisa al 18% del borde inferior. Es el protagonista: el tamaño no es decorativo, es la jerarquía.

**El canvas pasó de 320 a 256**, que es el tamaño nativo de los sprites: el contexto 2D ya no reescala nada y el CSS lleva el canvas al tamaño de la escena. Eso cierra de paso la arista del ×1,25 irregular que quedaba anotada. Ojo: ese escalado lo hace el navegador, no el contexto, así que `imageSmoothingEnabled` no lo cubre — hace falta `image-rendering: pixelated`.

**El estado vive en Chip.** No hay barras permanentes: se leen la pose, el sprite y la pantallita del pecho, y los números aparecen al tocarlo (`DURACION_PANEL_ESTADO_MS`, 4 s) o al darle Enter con el teclado. `#chip` es `role="button"` con `tabindex` porque, sin eso, con teclado no habría forma de leerlos.

**El evento es texto en el mundo**, no un panel: apoyado sobre el piso, arriba de la botonera. Se ve uno por vez; si la visita trajo dos, el segundo reemplaza al primero a los `ESPERA_SEGUNDO_EVENTO_MS`.

**El evento y la botonera son lo único en el flujo** de `#escena`, apilados contra el borde inferior con `justify-content: flex-end`. Chip, el polvo y el panel de estado están posicionados y no participan. Así el evento queda siempre justo arriba de la botonera sin tener que adivinar cuánto mide.

**Safe areas.** `viewport-fit=cover` deja que la escena llegue al borde físico, y la botonera se protege con `env(safe-area-inset-bottom)` para no quedar abajo de la barra de gestos. Las teclas miden 48 px de alto, arriba del mínimo de 44 para el pulgar.

**El alto va en `dvh`**, no en `vh`: en mobile la barra del navegador aparece y desaparece, y con `vh` la escena queda cortada o sobra por abajo. `--alto-escena` existe como variable porque el encuadre del fondo se calcula a partir de ella.

### El parpadeo

La primera animación que pasa **adentro** de Chip. Todo lo anterior desplazaba la imagen entera, que es lo que lo hacía leer como sticker.

Los recortes `idle-ojos.png` y `feliz-ojos.png` están alineados al mismo lienzo de 256 que su sprite base, así que la capa se apoya encima sin calcular ningún offset. **Sólo idle y feliz parpadean**: los demás no tienen recorte y quedan igual, que es lo correcto — standby ya tiene los ojos cerrados, critico entrecerrados y jugando guiña. Un estado sin recorte no es un error.

**Va por capa DOM y no por transformación del contexto 2D**, y las razones son de arquitectura, no de calidad de imagen:

1. Todo lo que se mueve en este proyecto es CSS. En canvas habría que redibujar ~8 cuadros por parpadeo, o sea un bucle de render que hoy no existe.
2. `prefers-reduced-motion` ya lo cubre el bloque `@media` de siempre; en canvas habría que consultarlo desde JS.
3. `transform-origin` da el pivote exacto — el centro vertical de la región ocular, medido en los recortes (y=97 y y=98 de 256, los dos redondean a 38%).
4. La capa y el canvas escalan idéntico, así que la alineación sale sola.

**El párpado, que la spec no preveía.** El sprite base trae los ojos dibujados: al achatar la capa, los del cuerpo asomaban arriba y abajo de la banda, con el brillo blanco flotando sobre el párpado. Se ve sólo con zoom — a tamaño real parecía funcionar. La solución es una capa que usa el **mismo recorte como máscara** y lo rellena con `COLOR_PARPADO`, tapando los ojos del cuerpo; queda debajo de la capa de ojos, así que en reposo no cambia nada.

Ese color tampoco está elegido a ojo: es el que el artista usó para dibujar los ojos cerrados de `standby` (`#ffc493`, dominante de su zona ocular después del contorno).

**El ritmo:** 130 ms en total, con el reparto interno —50 de cierre, 20 de mantener, 60 de apertura— en los porcentajes del keyframe, porque es la forma del movimiento. El párpado baja más rápido de lo que sube. El intervalo entre parpadeos se **resortea después de cada uno** (2 a 6 s): fijo leería como metrónomo, que es peor que no parpadear. Y un 15% de las veces parpadea dos veces seguidas.

### Los efectos por estado

Damián borró de los siete sprites los efectos que estaban dibujados. Estos los reemplazan, animados y prendidos por la clase de estado — **cada uno con su comportamiento**, no partículas genéricas recoloreadas:

| Estado | Efecto | Comportamiento |
|---|---|---|
| feliz | cuatro corazones + cuatro chispas | los corazones suben en abanico, dos por lado; las chispas laten |
| cargando | cuatro pulsos + latido del rayo | los pulsos suben del enchufe al pecho y el display se enciende en sincronía |
| jugando | cinco rayitas | pulso radial, el doble de rápido que en feliz |
| limpiando | cinco burbujas | suben y **estallan** al final |
| standby | tres Z | flotan hacia arriba-derecha, cada una desde su punto |
| critico | **ninguno** | la ausencia es la lectura del estado |
| idle | ninguno | |

**Los tamaños, colores y posiciones no están estimados.** Salen de medir por diferencia los sprites viejos —sacados de git— contra los pelados: lo que desapareció de cada uno es exactamente el efecto que había, con su caja y su paleta. Los corazones dibujados median 24×22 px sobre 256, o sea 9,4% del alto de Chip; las Z, 20×25.

**Todo lleva tres tonos: borde saturado, cuerpo y brillo.** Así está pintado el arte del juego, y el borde no es negro — en el corazón es rojo (`#ff2741` sobre `#ff8d90`) y en la Z es azul marino (`#00204b` sobre `#00efff`). Sin borde, cualquier forma se hunde en la pared charcoal: la primera versión de los corazones, de un tono y a la mitad del tamaño, **no se veía**. Los tamaños van en % del contenedor para acompañar a Chip en cualquier pantalla.

#### Las dos reglas de composición

El tamaño y el color no alcanzan: un efecto puede estar bien medido y componer mal. De mirar las capturas en producción salieron dos reglas, las dos en `config.js` y las dos válidas para los cinco estados.

**1. Nada toca la punta de la antena** (`RADIO_EXCLUSION_ANTENA`, 11% del contenedor). El bulbo tiene su propio glow y es el indicador de "encendido": una partícula encima le apaga la lectura. No se resuelve detectando colisiones — se resuelve componiendo, con las piezas naciendo a los costados y yéndose hacia afuera. Los corazones de feliz son **cuatro y no tres** exactamente por esto: con tres, uno queda en el medio, y ese era el que se paraba arriba del bulbo.

**2. Los efectos caben en la silueta ensanchada un 30%** (`FRANJA_EFECTOS`, de 5% a 88%). Lo que se sale deja de leerse como algo que le pasa a Chip y pasa a ser decoración de pantalla. Los arcos que orbitaban en `cargando` median 40% de ancho, arrancaban en −4% y daban la vuelta entera: se veían como dos ganchos cian saliendo de los costados de la cabeza —orejas— y al pasar por el frente tapaban el display del pecho, que era justo lo que había que enfatizar. **Los efectos acompañan a Chip, no lo envuelven.**

Las dos se verifican barriendo el ciclo completo de cada estado y midiendo, para cada pieza visible, el rectángulo de contorno contra la franja y su distancia al bulbo. Lo que no se puede medir —si el efecto *funciona*— se mira: **tres momentos separados del ciclo por estado**, no uno. Las dos formas encontraron cosas que la otra no veía.

#### Lo que sólo apareció en la captura ampliada

Tres defectos de esta tanda no los mostró ninguna medición. Los tres decían "está ahí, con su tamaño y su color":

- **Las chispas de feliz se las comían los corazones.** Estaban a la misma altura y a pocos píxeles; el corazón es más grande y va encima. Al bajarlas a los hombros pasó lo otro: la chispa es una cuña finita y, apoyada sobre el brazo naranja, desaparece. Ahora van en aire oscuro, medido fila por fila sobre `feliz.png`.
- **El pulso de cargando se dibujaba cuadrado.** El SVG tiene `viewBox` de 24×24 y el elemento es alto y angosto: con el `preserveAspectRatio` por defecto el dibujo entra a lo ancho y queda centrado con aire arriba y abajo. Un huso de 17 px en vez de un trazo de 17×50. Es el único efecto con `preserveAspectRatio="none"`.
- **El pulso cian sobre el display cian no se despegaba.** Subiendo derecho pasaba por la zona más cargada del sprite. Ahora sube en diagonal a la izquierda, por la chapa gris — que además es la continuación natural del cable, que llega desde abajo a la derecha.

#### Y uno que sólo apareció midiendo

Las tres Z del standby **latían todas al mismo tiempo**, desde siempre. `animation` es un shorthand: `.estado-standby .zeta { animation: … }` reseteaba a `0s` los `animation-delay` de `.zeta:nth-child(N)`, que tiene la misma especificidad y viene antes. Como además las tres estaban posicionadas en el mismo punto —el contenedor tenía la posición y las Z no—, se leían como una sola Z que crecía y se achicaba. Apiladas **y** sincronizadas.

En la captura eso era invisible: tres Z superpuestas parecen una Z. Se encontró leyendo el `animation-delay` computado. La misma trampa tenían las chispas del enchufe. Los `animation-delay` de cada pieza van **después** de la regla que pone el shorthand y adentro del mismo estado; las burbujas se salvaron porque su regla de estado usa longhands.

### La toma de corriente

El cable de `cargando.png` sale hacia abajo a la derecha y **terminaba en el aire**. Ahora termina en una toma dibujada por código —sin assets nuevos— que es **mobiliario del galpón**: está en todos los estados, no sólo mientras Chip carga.

**Posicionada por el sprite, no por la escena.** `PUNTA_DEL_CABLE` (`config.js`) está medida con la misma técnica que la tabla de la antena —componente conexa de cian, la que llega al borde inferior— y da **79,7% / 98,6%** del lienzo de 256. El CSS la convierte usando los mismos anclajes que `#chip`: el 50% de ancho y `var(--piso-chip)`. Por eso el encastre no depende de la proporción de la pantalla — verificado con el alto de Chip en 229, 308, 416 y 484 px: el desfase entre la punta del cable y el borde de la toma nunca pasa de **0,02 px**.

Un `left: 76%` de la escena no habría servido: Chip se escala con el **alto** y los porcentajes de `left` miden sobre el **ancho**, así que el encastre se rompería en cuanto cambiara la proporción.

Mide el 11% del alto de Chip, que es el tamaño de su puño. Recibe la luz de la hora por estar en `z-index: -1` —debajo de la capa de luz, encima de la panorámica— y se apaga de noche con un filtro propio, porque al ser código no cambia con la panorámica nocturna. En `cargando`, las dos ranuras se encienden una vez **por pulso que sale**, no una por ciclo: `--duracion-pulso × 0,25`, que es el desfase entre pulsos. La energía sale de la toma y llega al rayo del pecho, y por eso el destello de la toma está al principio del ciclo y el del rayo al final.

El selector es `#escena:has(.estado-cargando) #toma .ranura`. El `:has()` evita una segunda fuente de verdad: la clase de estado la sigue escribiendo `ui.js` en `#contenedor-mascota` y en ningún otro lado.

**Desvío anotado.** La instrucción pedía la toma "en el zócalo de la pared". Ahí no hay pared: midiendo la columna de la panorámica en la x del cable, la línea donde el muro se junta con el piso está en el **65-66%** del alto de la escena y la punta del cable cae en el **81,4%** — quince puntos más adelante, unos 140 px de piso abierto de por medio. Una chapa de pared ahí flotaría. Se conservó el anclaje, que era lo que la instrucción pedía medir, y se cambió el objeto: es una caja de toma apoyada en el piso, con sombra de contacto, con la misma chapa oscura, las mismas dos ranuras y el mismo bisel naranja.

### La luz que recorre el día

El galpón tenía día y noche. Ahora tiene hora: el charco que entra por la ventana cambia de lugar, de tamaño y de temperatura.

| Franja | Horas | Dónde | Color |
|---|---|---|---|
| amanecer | 7–11 | bajo y a la izquierda | `#ffae5e` |
| mediodía | 11–16 | alto y centrado, tenue | `#fff2d2` |
| tarde | 16–20 | largo y a la derecha | `#ff8a3c` |
| anochecer | 20–23 | apagándose | `#c9683f` |
| noche | 23–7 | sin luz | — |

Es un degradé radial en `#escena::after`, **puro CSS y sin arte nuevo**, con `z-index` negativo para quedar sobre la panorámica y debajo de Chip: es luz de piso y Chip está parado encima.

> **Y durante un tiempo no se vio nunca.** El `z-index: -1` sólo hace eso si el ancestro es un contexto de apilado, y `#escena` era `position: relative` con `z-index: auto`, que **no** lo es. La capa se iba al contexto de la raíz y terminaba pintando **detrás del `background-image` de la propia escena**. El gradiente estaba perfectamente calculado y el CSS computado lo confirmaba; lo que fallaba era el orden de pintado, que ninguna medición de estilos iba a revelar.
>
> Se detectó con una prueba de una línea: poner `--luz-fuerza` en `1` y `--luz-color` en rojo puro, y capturar. Si el galpón no se pone rojo, la capa no existe. Se arregló con `isolation: isolate` en `#escena`, que la vuelve contexto de apilado sin efectos colaterales de posicionamiento.
>
> La moraleja para el resto del archivo: **toda capa con `z-index` negativo depende de que su ancestro sea contexto de apilado.** Hoy hay dos —la luz y la toma de corriente— y las dos cuelgan de ese `isolation`.

`franjaDeLuz()` vive en `sprites.js` al lado de `esDeNoche()` porque es la misma pregunta y tiene que contestar con el mismo reloj — si la luz dijera "tarde" mientras el fondo ya es el nocturno, el galpón se contradiría solo.

**Chip no se desplaza por el taller.** El que se mueve es la luz. Es decisión de diseño cerrada: mover a Chip rompería el modelo pasivo y competiría con los eventos, que ya cuentan lo que hizo mientras no estabas.

### Los corazones y los destellos

Estaban dibujados adentro de `feliz.png`. Ahora son partículas, y eso desbloquea lo que un dibujo pegado al sprite no podía hacer: **dispararse por evento**.

Los dos colores salen muestreados del `feliz.png` viejo antes de reemplazarlo — `#ff8b8d` los corazones y `#ffe02c` los destellos. El rosa **no** es el `#ff6b81` que estimaba la spec: el del sprite es más cálido.

**Los corazones suben en abanico**, no en línea recta: uno que sube derecho parece un globo, y uno que cruza al otro lado le pasa por encima a la antena. Son cuatro —par interno en 27% y 65%, par externo en 15% y 75%, simétricos respecto del 50%— y cada uno se abre hacia su lado. La tanda por evento reordena las mismas posiciones para que, cuando salen dos, sean un par simétrico y no dos del mismo lado.

**Los destellos no flotan: laten.** Aparecen y desaparecen desde el centro hacia afuera en 900 ms. Esa diferencia de comportamiento es lo que los separa de los corazones.

**El disparo por evento no mira la acción, mira el humor.** `main.js` compara el humor antes y después: si subió, hay tanda. Con el humor en 100, jugar se aplica igual —gasta batería— pero no hay nada que festejar, y un corazón sin efecto le mentiría al jugador. Mismo criterio que el salto, y vale para cualquier acción futura que suba humor.

### La pantalla del pecho, viva

El display del torso estaba **pintado** en los siete sprites y decía siempre `100%`. Era lo único del juego que mentía: Chip podía estar con la batería en 12 y mostrar el instrumento lleno. Ahora una capa lo tapa y lo redibuja con el stat real — seis segmentos y el número.

**La tabla salió de dos métodos, porque ninguno solo resuelve los nueve sprites**, y cada fracaso tiene su motivo:

| método | qué busca | dónde falla |
|---|---|---|
| vidrio | el color del cristal: `b − r ≥ 26` con luminancia baja. Muestreado adentro de idle, el vidrio es un azul-verde muy oscuro y esa firma no la tiene nada más — el contorno negro tiene `b − r ≈ 0` y la chapa del pecho es cálida | `critico`, donde la pantalla está en alarma y el cristal se pinta gris; `cargando`, donde el cable cian comparte la firma |
| hueco | el agujero oscuro más grande adentro de la placa del pecho. Topológico, no cromático | `limpiando` y `standby`, donde el trapo y los brazos parten la placa |

**La elección entre los dos no es a ojo.** Una pantalla válida entra en la placa del pecho, ocupa entre 14% y 27% del ancho del lienzo y tiene relación de aspecto entre 1,15 y 2,3. Sin la condición de la placa, en `critico` el método del vidrio elegía un recorte de más abajo que pasaba las pruebas de forma, y en `esperando` elegía los antebrazos cruzados.

A los dos que salen por el método del hueco se les **erosiona el borde** después, porque ese método se come el bisel. El corte de la derecha lo marca el separador del rayo: el rayo vive en su propio recuadro, al lado del cristal, y no es parte de la pantalla. Sin la erosión, el reemplazo de `cargando` se comía el marco y el rayo del arte — se vio en la captura ampliada, no en los números. Las ocho cajas terminan entre **17,2% y 18,3% de ancho**, que es la confirmación de que los dos métodos miden la misma cosa.

**El giro también está medido**, ajustando una recta al borde superior del cristal columna por columna y descartando el 12% de cada punta por las esquinas redondeadas. Va de 0° en las poses frontales a 7,4° en `jugando`. El residuo del ajuste delata algo: 0 a 0,4 px de frente, pero **2,9 px en `cargando`**, donde la pantalla no está girada sino en **perspectiva** — es un trapecio, y 2,5° es la mejor aproximación con un giro plano.

**No se redibuja en los siete estados, y eso es a propósito:**

- `standby` muestra una luna. No hay número, no hay mentira: Chip duerme.
- `critico` muestra la batería vacía en rojo, que es exactamente lo que pasa cuando el stat está abajo del umbral.
- `esperando` **no tiene pantalla visible**: los antebrazos cruzados la tapan entera. No es que el detector falle — es que no está.

Taparlas sería cambiar un dibujo correcto por uno peor.

**El número es una fuente de píxeles de 3×5 dibujada en `formas.js`**, no tipografía. El primer intento usó la monoespaciada del sistema y, comparando la captura ampliada contra el sprite **a la misma escala** —la única comparación que vale—, quedaba una mancha ilegible al lado del `100%` del arte, que es una fuente de display gruesa. A 3×5 la proporción sale sola: `100%` son cuatro caracteres de 3 más tres separaciones de 1, o sea 15 × 5 unidades, y esa relación 3:1 es exactamente la del texto dibujado, que ocupa el 50% del ancho y el 15% del alto del cristal.

Los segmentos redondean **hacia arriba con piso en 1**: con batería en 1 queda algo encendido —el aparato está prendido— y sólo en 0 queda todo apagado. Redondear al más cercano dejaría el instrumento vacío desde el 8% para abajo, que es justo cuando el jugador más mira la pantalla.

### El glow de la antena, por estado

El bulbo de la antena no está en el mismo lugar en todos los sprites: va del **44,2% al 60,5%** de ancho según la pose. Con la posición clavada en idle, en `jugando` quedaba unos 39 px corrido y se leía como un brillo suelto al costado.

`POSICIONES_ANTENA` (`config.js`) tiene la tabla estado → {x%, y%}, medida sprite por sprite **aislando la componente conexa de cian**: la redondez del blob es lo que distingue el bulbo de las "Z" del standby y del cable de `cargando`, que son del mismo color y engañan a cualquier promedio. Un estado sin entrada cae en idle.

Los números viajan por el puente de custom properties en vez de por catorce reglas de CSS, porque son medidas del arte — igual que los colores de las barras. El ritmo nocturno no cambia: de noche sigue latiendo más lento y más tenue; lo único que cambió es dónde se dibuja.

### Efectos de vida

Cinco micro-efectos de CSS puro superpuestos al canvas. **Ninguno toca los PNG ni el contexto 2D**, ninguno recibe el mouse (`pointer-events: none`) y ninguno existe para un lector de pantalla (`aria-hidden`).

| Efecto | Dónde vive | Cuándo corre | Ciclo |
|---|---|---|---|
| glow de la antena | `#antena` | siempre | `CICLO_ANTENA_MS` — 3,1 s (5 s de noche) |
| sombra que respira | `#sombra` | siempre | `CICLO_REBOTE_MS` — 2,2 s |
| Z que flotan | `.zeta` ×3 | sólo `standby` | `CICLO_ZETA_MS` — 4 s |
| chispas de carga | `.chispa` ×4 | sólo `cargando` | `CICLO_CHISPA_MS` — 0,6 s |
| polvo en el aire | `.mota` ×16 | sólo de día | `CICLOS_POLVO_MS` — 11 / 14 / 17 s |

**Ningún efecto tiene lógica propia.** Los que dependen del estado se prenden con la clase `estado-*` que `ui.js` pone en `#contenedor-mascota`, derivada de la **misma** cadena que elige el sprite; los que dependen de la hora usan la clase `es-noche` del `body`, derivada del mismo `esDeNoche()` que el fondo. No hay un solo timer nuevo en el JS, y por lo tanto no hay forma de que un efecto muestre algo distinto de lo que muestra Chip.

#### El polvo, recalibrado

Vivía en una caja de 46% × 30% pegada al borde izquierdo, con **seis motas de 2 px y un pico de opacidad de 0,22**. En una escena de 480×944 eso son seis puntos casi transparentes en un sexto de la pantalla: el galpón se veía quieto.

Ahora son **dieciséis, de 2 a 4 px, repartidas por toda la escena**. El cambio de idea es que el galpón tiene polvo en todos lados y el haz de la ventana es *donde se ve*: las seis que caen en la columna de la ventana llevan la clase `en-luz` y pican en **0,5**; las diez de la penumbra, en **0,25**. El pico no está escrito en el `@keyframes` sino en la variable `--pico` de cada mota, así que una sola animación sostiene los dos brillos.

Y estaban **todas corriendo el mismo ciclo con el mismo arranque**. `body:not(.es-noche) .mota` es (0,2,1) contra el (0,2,0) de `.mota:nth-child(N)`: el shorthand `animation` ganaba y reseteaba `animation-duration` y `animation-delay` a los valores por defecto. Un bloque de polvo en formación, no un campo. Es el mismo defecto de las Z del standby y de las chispas del enchufe — tercera vez en el mismo archivo, y por eso ahora los ritmos van siempre **después** de la regla que pone el shorthand, con el mismo prefijo de estado.

Verificado con dos capturas separadas 4,5 s: **13 grupos de píxeles cambiados repartidos por toda la escena**, con todo lo demás congelado. Detalle del entorno que hay que saber para repetir la prueba: en la pestaña de automatización `document.visibilityState` es `hidden` y el reloj de animaciones **no avanza solo** (`currentTime` leído dos veces con 1,5 s de por medio da 0 las dos veces). Los 4,5 s se producen moviendo `currentTime`, no esperando. Esperar da dos capturas idénticas y eso no prueba nada.

Sin la clase, los elementos van a `display: none` — que además de esconderlos **cancela la animación**, así que no gastan nada mientras no corresponden.

**Qué rebota y qué no.** El glow, las Z y las chispas viven adentro de `#contenedor-mascota` porque tienen que moverse con Chip: si el glow no rebotara, se despegaría de la antena. La sombra y el polvo viven afuera. Por eso, cuando Chip salta por una acción, **la sombra se queda en el piso** — que es lo que vende el despegue.

**La contrafase de la sombra no usa delay.** El rebote está arriba en su 50%, así que la sombra chica en el 50% ya es la contrafase; atarla con un `animation-delay` de medio ciclo la habría puesto justo al revés, chica con Chip abajo. Las dos animaciones comparten la variable de duración, que es lo que importa. Verificado buscando las dos al mismo `currentTime`: Chip en `translateY(0)` → sombra en `scaleX(1)`; Chip en `-4px` → sombra en `scaleX(0.88)`.

**El glow de la antena ya no está clavado en `idle`:** sigue la tabla por estado de más arriba. Ese mismo bulbo es el centro del círculo de exclusión que ninguna partícula puede pisar, y por eso la tabla es una medida y no una estimación — si la posición estuviera mal, la zona prohibida estaría mal.

**Las chispas del enchufe son el detalle, no el efecto.** Cuatro puntos de 4 px en la boca del zócalo: la lectura del estado la sostienen los pulsos que suben y el latido del display. Cuidado al tocarlas, porque el sprite de `cargando` ya trae cable y display en el mismo cian — todo lo que se agregue ahí compite con el arte.

En idle diurno corren **19 animaciones** (16 motas + glow + rebote + sombra); el pico es **28**, en `cargando`. El polvo es la mayoría: son transformaciones y opacidad, las dos propiedades que el compositor maneja sin recalcular layout.

### prefers-reduced-motion

Un bloque al final de `style.css` apaga el rebote, el salto, el viaje de las barras, la transición de las teclas y la del panel de estado. **El panel igual aparece**: se le va el viaje, no la función — es la única forma de leer los números. No es opcional y no tiene interruptor propio: quién puede moverse lo decide el CSS. `ui.js` pone la clase del salto igual, y con reduced-motion la clase no hace nada.

La tecla apretada **sigue avisando** con reduced-motion: se le apaga el viaje de 1 px y la transición, pero el canto se achica igual. Eso es cambio de estado, no movimiento.

De los efectos de vida se van los cinco menos uno: **la sombra queda**, estática y en su tamaño medio, porque su trabajo es anclar a Chip al piso y eso lo hace igual de quieta. Verificado en el peor caso —de día y con `standby` forzado, que es cuando más cosas pueden estar prendidas—: **0 animaciones**, glow, Z, chispas y polvo en `display: none`, la sombra visible en `scaleX(0.94)` y el canvas dibujado.

Los selectores del bloque `@media` repiten los que prenden cada efecto (`.estado-standby .zeta`, no `.zeta`): con el selector corto perderían por especificidad aunque vengan después.

---

## Estado y migraciones

```js
{ nombre, bateria, humor, mantenimiento, ultimaVisita, creado, ultimosEventosIds, version }
```

Key: `chip.save.v1` — **no se sube de versión nunca**, cambiarla borra todas las partidas en silencio. Para eso está el campo `version`, que `estado.js` usa para migrar en el lugar.

Los tres stats se guardan **decimales**. Solo la UI redondea. Redondear al persistir pierde el decaimiento parcial y en visitas cortas nunca baja nada.

| Versión | Cambio |
|---|---|
| 1 | forma original |
| 2 | agregó `ultimoEventoId` |
| 3 | lo reemplazó por `ultimosEventosIds` (array) |

`migrar()` hace merge con los defaults primero, así un campo nuevo entra solo sin una rama por versión. Un campo que **cambia de forma** sí necesita su paso explícito: si no, el viejo queda colgado en el save para siempre.

### El piso del decay no es un imán

```js
nuevoValor = min(valorAnterior, max(DECAY_FLOOR, valorConDecay))
```

`DECAY_FLOOR` limita **cuánto puede bajar el paso del tiempo**, no dónde tiene que estar el valor. Un stat por debajo del piso se queda donde está y sube **solo con acciones**.

Con `max(FLOOR, valor)` a secas, jugar con la batería en 15 la dejaba en 5 y el tick siguiente devolvía esos 5 gratis: el costo de la acción se evaporaba justo en el borde donde tiene que doler.

---

## Eventos (vida propia)

Los textos son del brief editorial y **no se escriben en el código**: `js/datos-eventos.js` los transporta. Si un texto cambia, cambia primero en el brief.

El pool son veinte eventos agrupados en cuatro categorías: `funcion`, `coleccion`, `grandes`, `resto`. La agrupación es estructura de datos, no un comentario — `EVENTOS` es la vista plana que consume `eventos.js`, con la categoría estampada en cada entrada, y `CATEGORIAS` se deriva de las claves para que la lista no exista escrita dos veces. Nadie filtra por categoría todavía: está para poder condicionar el pool al estado de Chip sin reescribir la estructura.

Cuántos salen, según las horas fuera (las mismas del decay, ya capeadas):

| Horas | Eventos |
|---|---|
| < 1 | ninguno |
| 1 a 6 | uno |
| > 6 | dos |

Se persisten los ids de **todo** lo mostrado en `ultimosEventosIds`: nada de una visita puede repetirse en la siguiente.

### El evento raro

`EVENTO_RARO` vive **fuera del pool** y no se sortea: se tira una moneda cargada con `PROBABILIDAD_EVENTO_RARO` (`config.js`, hoy 1.5%), una vez por visita con evento. Si sale, **ocupa uno de los lugares de la visita** en vez de sumar uno extra: la tabla de arriba no cambia. Respeta la exclusión como cualquier otro.

La escasez es el diseño, no un número de balance: adentro del pool saldría cada tres días y no significaría nada.

`elegirEventos(horas, ultimosIds, aleatorio, azarRaro)` recibe las dos fuentes de azar **separadas**: `aleatorio` sortea la bolsa, `azarRaro` es el portero del raro. Compartiendo fuente, un `aleatorio` fijo en 0 —el que hace que el sorteo saque siempre el primero de la bolsa— dispararía el raro en todas las visitas de las pruebas.

---

## Service worker

Se registra siempre, **incluido en desarrollo**: `localhost` y `127.0.0.1` son contextos seguros. Una IP de LAN sobre HTTP plano **no** lo es — para probar desde el celular hace falta HTTPS.

**Subí `CACHE_VERSION` en `sw.js` en cada cambio de cualquier archivo de `ARCHIVOS_CACHE`.** Si no, el usuario sigue viendo la versión vieja para siempre. Vive ahí y no en `config.js` a propósito: el navegador dispara el update comparando los bytes de `sw.js`.

Mientras desarrollás, dejá tildado en DevTools → Application → Service Workers: **Update on reload** y **Bypass for network**. Sin eso parece que los cambios no se aplican. Si ya quedó pegado: Unregister + Clear site data + Ctrl+Shift+R.

`icons/generador.html` regenera los PNG del manifest sin instalar nada. Desde que hay arte, dibuja a Chip desde `sprites/idle.png` sobre el charcoal del juego (`#0d0f14`, el mismo de `manifest.json` y del `body`) en vez del placeholder. El suavizado lo decide el sentido del escalado: 512 es 2x exacto de 256 y va con nearest; 192 es una reducción a 0,75 y con nearest se caerían filas de píxeles justo en la cara.

`ARCHIVOS_CACHE` incluye **todo el arte**: los siete sprites de estado y los dos fondos. Instalada y sin red, la app abre completa — Chip real sobre el galpón real, no placeholders. La instalación pesa ~1,6 MB.

La lista está escrita a mano y no sale de `RUTAS_SPRITES`: `sw.js` no puede importar `config.js`, es el mismo carve-out de `CACHE_VERSION`. **Un sprite nuevo hay que agregarlo en los dos lados.**

---

## Qué NO está en el código

- **El criterio editorial de los eventos.** Los veinte textos ya están en `js/datos-eventos.js`, pero la fuente de verdad es el brief: el código los transporta, no los decide. Agregar un evento es agregar una entrada con `id` único; la lógica no se toca.
- **El balance de números.** Se ajusta mirando a Chip, no leyendo código.

---

## Notas

- El estado en memoria no se resincroniza con `localStorage`: dos pestañas abiertas se pisan. Irrelevante en celular, confunde en desarrollo.
- El debounce visual de 2 s es prácticamente inerte: nada repinta más rápido que el tick de 60 s salvo las acciones, que lo saltean. Es una guarda a futuro — no lo tunees a ojo porque no vas a poder observarlo.
- Se trabaja desde dos máquinas: `git pull` al arrancar, `git push` al terminar. Nunca copiar la carpeta a mano.
