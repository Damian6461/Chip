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

79 pruebas, mismos archivos en dos entrypoints:

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

Sin el parámetro, `js/debug.js` ni se descarga (import dinámico). Cinco controles:

| Control | Qué hace |
|---|---|
| multiplicador | escala las horas de los dos controles de abajo |
| simular h | aplica el decay de N horas **en el momento** |
| volver tras N h | retrocede `ultimaVisita` **sin** aplicar decay y recarga |
| visual | fuerza un estado visual, o `auto` para volver a la cadena |
| hora | fuerza la hora del reloj (0-23), o `auto` |
| reiniciar partida | save nuevo en 100/100/100 |

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

El loader degrada en dos escalones: falta el sprite pedido → usa el de `idle`; falta ese también → placeholder con el nombre del estado escrito. Eso permitió desarrollar sin arte y verificar la cadena a ojo. **Contrapartida, y ahora está activa:** con los siete PNG en su lugar, un sprite que falte se ve como `idle` en vez de cantar el error.

`ui.js` apaga el suavizado (`ctx.imageSmoothingEnabled = false`) apenas crea el contexto: el bilineal del navegador emborrona el pixel art al escalarlo. Es estado del contexto, no un parámetro de `drawImage`, así que se setea una sola vez y sobrevive a `clearRect`. **Cambiar el tamaño del canvas lo resetea a `true`** — si algún día el canvas deja de ser fijo, hay que volver a bajarlo.

Arista abierta: el canvas mide **320** y los sprites **256**, así que se dibujan escalados ×1.25. Sin suavizado eso ya no es borroso, pero sigue siendo irregular: de cada cuatro píxeles del sprite, uno sale del doble de ancho. La salida limpia es un factor entero — canvas a 256, o dibujar el sprite a 256 centrado adentro de los 320.

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

El panel de debug muestra la colección cruda —`colección 2/8` y la lista de ids— y el día del último evento.

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
├── #polvo          motitas en el haz de la ventana
├── #chip           posición y tamaño; NO se anima
│   ├── #sombra     quieta: cuando Chip salta, se queda en el piso
│   └── #contenedor-mascota   rebota
│       ├── canvas 256×256
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

### Efectos de vida

Cinco micro-efectos de CSS puro superpuestos al canvas. **Ninguno toca los PNG ni el contexto 2D**, ninguno recibe el mouse (`pointer-events: none`) y ninguno existe para un lector de pantalla (`aria-hidden`).

| Efecto | Dónde vive | Cuándo corre | Ciclo |
|---|---|---|---|
| glow de la antena | `#antena` | siempre | `CICLO_ANTENA_MS` — 3,1 s (5 s de noche) |
| sombra que respira | `#sombra` | siempre | `CICLO_REBOTE_MS` — 2,2 s |
| Z que flotan | `.zeta` ×3 | sólo `standby` | `CICLO_ZETA_MS` — 4 s |
| chispas de carga | `.chispa` ×4 | sólo `cargando` | `CICLO_CHISPA_MS` — 0,6 s |
| polvo en el haz | `.mota` ×6 | sólo de día | `CICLOS_POLVO_MS` — 11 / 14 / 17 s |

**Ningún efecto tiene lógica propia.** Los que dependen del estado se prenden con la clase `estado-*` que `ui.js` pone en `#contenedor-mascota`, derivada de la **misma** cadena que elige el sprite; los que dependen de la hora usan la clase `es-noche` del `body`, derivada del mismo `esDeNoche()` que el fondo. No hay un solo timer nuevo en el JS, y por lo tanto no hay forma de que un efecto muestre algo distinto de lo que muestra Chip.

Sin la clase, los elementos van a `display: none` — que además de esconderlos **cancela la animación**, así que no gastan nada mientras no corresponden.

**Qué rebota y qué no.** El glow, las Z y las chispas viven adentro de `#contenedor-mascota` porque tienen que moverse con Chip: si el glow no rebotara, se despegaría de la antena. La sombra y el polvo viven afuera. Por eso, cuando Chip salta por una acción, **la sombra se queda en el piso** — que es lo que vende el despegue.

**La contrafase de la sombra no usa delay.** El rebote está arriba en su 50%, así que la sombra chica en el 50% ya es la contrafase; atarla con un `animation-delay` de medio ciclo la habría puesto justo al revés, chica con Chip abajo. Las dos animaciones comparten la variable de duración, que es lo que importa. Verificado buscando las dos al mismo `currentTime`: Chip en `translateY(0)` → sombra en `scaleX(1)`; Chip en `-4px` → sombra en `scaleX(0.88)`.

**El glow de la antena está posicionado sobre `idle` y en los otros estados no cae perfecto.** La bombita, medida en los siete sprites, va del 44,5% al 60,4% de ancho porque las poses son distintas:

| | idle | feliz | critico | standby | cargando | jugando | limpiando |
|---|---|---|---|---|---|---|---|
| x | 50,1% | 54,0% | 44,5% | *(tapada)* | 45,9% | **60,4%** | 45,4% |

El glow se fija en 50% / 8%, que es `idle` —el estado por defecto y el más frecuente—, y la capa difusa ancha tapa buena parte del desvío. El peor caso es `jugando`, donde queda unos 30 px corrido y se lee como un brillo suelto al lado de la antena; dura los 2 s del estado de acción. Afinarlo por estado son cuatro líneas de CSS con las clases `estado-*` que ya existen, pero no se hizo en esta pasada.

**Las chispas suman poco.** El sprite de `cargando` ya trae remolinos, destellos y cable dibujados en el mismo cian: las partículas compiten con el arte en vez de agregarle. Están en la boca del enchufe, que es la zona más limpia del cuadro.

En idle diurno corren **9 animaciones** (6 motas + glow + rebote + sombra); el pico es **13**, en `cargando`.

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
