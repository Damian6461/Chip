# Chip

Virtual pet en pixel art. HTML, CSS y JavaScript vanilla con módulos ES. Sin frameworks, sin build, sin dependencias.

Este archivo documenta **lo que el código hace hoy**: cómo correrlo, qué contratos hay que respetar y dónde están los bordes filosos. Es lo que hace falta para trabajar mañana.

El **por qué** de las decisiones —lo que se probó y se descartó, y los bugs que costó encontrar— vive en [EL-PORQUE.md](EL-PORQUE.md). El brief editorial no está en el repo.

---

## Correrlo

Hay que servirlo por HTTP. **Los módulos ES no cargan desde `file://`** — abrir `index.html` con doble clic tira error de CORS. Usá Live Server o cualquier server estático sobre la carpeta.

```
http://127.0.0.1:5500/index.html
```

---

## Tests

112 pruebas, mismos archivos en dos entrypoints:

```bash
node tests/correr.mjs        # sale 0 si pasa todo, 1 si no
```

```
http://127.0.0.1:5500/tests/   # verde/rojo en la página, resumen en el <title>
```

No hace falta `package.json`: Node detecta la sintaxis de módulo sola. Los dos entrypoints instalan un `localStorage` en memoria antes de importar nada del juego, así que **la suite nunca toca tu partida**, ni siquiera en el navegador donde el origen es el mismo.

Se corren después de cualquier cambio que toque estado, decay o persistencia.

---

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
| cambiar pose | fuerza la otra pose de idle, que si no cambia una vez por minuto y con moneda |
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
- **Nunca el shorthand `animation` en una regla que pueda pisar delays de `:nth-child`.** Se declaran las propiedades por separado, o los `animation-delay` van **después** de la regla del shorthand y con el mismo prefijo de estado. Ver abajo: mordió tres veces.
- **Todo asset nuevo entra en `ARCHIVOS_CACHE` con su bump de `CACHE_VERSION`**, y `tests/assets.test.js` lo verifica: el cruce ya no es disciplina.
- **Nunca medir con `getBoundingClientRect` un elemento con `transform`.** Devuelve la caja del bounding box rotado, no la del elemento. Para la caja de layout van `offsetWidth` / `offsetHeight`. Ver abajo: el instrumento miente.

`main.js` orquesta: mantiene el estado vivo, resuelve el reloj y es el único con timers.

### La regla del shorthand `animation`

Mordió **tres veces** en el mismo archivo, con el mismo mecanismo y tres síntomas distintos:

| dónde | qué se veía | qué pasaba |
|---|---|---|
| las Z de `standby` | "apenas se ve una Z" | las tres latían al unísono |
| las chispas del enchufe | nada raro, por suerte | las cuatro salían juntas |
| las motas de polvo | el galpón quieto | las seis corrían el mismo ciclo con el mismo arranque |

Siempre lo mismo: `animation` es un **shorthand**, así que una regla como `.estado-standby .zeta { animation: … }` resetea `animation-delay` a `0s`. Y le gana a `.zeta:nth-child(N)`, que declara el delay, porque **tienen la misma especificidad** (0,2,0 contra 0,2,0 — o peor, 0,2,1 en el caso del polvo) y viene después en el archivo.

Lo peligroso es que **no se detecta mirando ni midiendo el resultado**: los elementos están, tienen su color y su tamaño, y la animación corre. Lo único que lo delata es leer el `animation-delay` computado. Tres Z superpuestas y sincronizadas se ven exactamente como una Z.

Las burbujas de `limpiando` nunca tuvieron el problema, y no por suerte: su regla de estado usa longhands (`animation-name`, `animation-duration`, …) en vez del shorthand. Ese es el patrón a copiar.

Tres veces es patrón, no casualidad. Por eso está arriba, entre las reglas de arquitectura.

### Cuando el instrumento miente

Cuatro veces en la misma sesión una medición dio un número correcto de una cosa
que no era la que se estaba midiendo. Ninguna de las cuatro se detecta mirando
el número: todos parecen razonables. Se detectan sabiendo que existen.

| el instrumento | lo que devuelve | lo que uno cree que devuelve |
|---|---|---|
| la pestaña de automatización | los relojes de animación **congelados**: `animationend` no llega nunca y `requestAnimationFrame` no dispara | el estado de una animación corriendo |
| `fetch` con el service worker vivo | lo que hay **en la caché**, que puede ser de tres deploys atrás | el archivo que acabás de escribir |
| una captura durante una transición | un fotograma **a mitad de camino** | el estado final |
| `getBoundingClientRect` sobre un elemento con `transform` | la caja **alineada a los ejes** del elemento rotado, siempre más grande | la caja del elemento |

Las cuatro salidas:

- **Pestaña oculta:** nada de esperar `animationend`. Se busca el momento con
  `animacion.pause()` y `animacion.currentTime = t`. De paso es mejor método:
  permite capturar tres momentos exactos del ciclo en vez de tres momentos que
  cayeron donde cayeron.
- **Service worker:** `unregister()` de todas las registraciones y `caches.delete()`
  de todas las claves **antes de cada medición**, no una vez al principio. Se
  vuelve a registrar en cada carga.
- **Transiciones:** se termina lo que esté corriendo —`for (const a of
  document.getAnimations()) a.finish()`— y recién ahí se mide.
- **`transform`:** `offsetWidth` / `offsetHeight` para la caja de layout.
  `getBoundingClientRect` sólo cuando lo que se quiere es justamente la caja
  rotada en coordenadas de viewport.

El caso del `transform` fue el más traicionero de los cuatro porque el error era
**parcial**: las poses con `giro: 0` —idle y limpiando— daban el valor exacto, y
las otras tres venían infladas cada una por su propio ángulo. Un resultado
mezclado se parece mucho a un bug real.

---

## Cadena de estados visuales

Prioridad, gana la primera condición verdadera:

1. acción en curso → `cargando` / `jugando` / `limpiando`
2. `bateria < 15` → `critico`
3. hora local entre 23 y 7 → `standby`
4. está pasando un gigante → `esperando`
5. `bateria > 70` **y** `humor > 70` → `feliz`
6. resto → `idle`

Las tres comparaciones son **estrictas**: batería en 15 exacto no es `critico`, y `feliz` pide que los dos stats pasen el umbral.

Las acciones van primero porque son feedback transitorio: si tocás Cargar con la batería en 12 y no cambia nada, la acción se siente muerta justo cuando más importa que responda. El bucle queda `critico` → `cargando` → `idle`.

**Las acciones del jugador saltean el debounce.** Sin eso, con el debounce y la duración de acción valiendo lo mismo (2 s), la ventana se come la transición y a veces no ves nada.

`resolverEstadoVisual({ estado, ahora, accion, gigantePasando })` recibe `ahora` como timestamp **sin default**: el reloj entra por el llamador, así `standby` es testeable en cualquier zona horaria.

### `esperando`: Chip aguanta el paso de un gigante

El disparador **sale del canon, no de un timer**. El evento 11 dice *"Pasó un carguero de siete metros. **Chip esperó a que terminara de pasar** y después siguió con lo suyo, un poco despeinado por el viento"*, y el sprite entró al repo con el mensaje "Chip aguanta el paso de un gigante". La pose son los brazos cruzados: no es impaciencia, es aguantar.

Lo que lo prende es la **categoría `grandes`** de `datos-eventos.js` — "el mundo que no lo ve". Ese archivo ya avisaba que la categoría era dato y no etiqueta decorativa, y que *"hoy nadie filtra por categoría todavía"*: este es su primer consumidor. `EVENTO_RARO` también lleva `categoria: 'grandes'`, así que el hito de la grúa entra por la misma puerta sin un caso especial.

`main.js` programa la pose para que arranque **en el instante en que ese evento aparece en pantalla** — con el mismo `ESPERA_SEGUNDO_EVENTO_MS` que usa `ui.js` para encadenar los textos — y la apaga a los `DURACION_ESPERANDO_MS` (9 s). Así el texto y la pose dicen lo mismo al mismo tiempo, y sigue habiendo una sola fuente de verdad: **el evento decide, el sprite ilustra.** Nada de un timer aparte inventando gigantes que el jugador no leyó.

Los timers viven en `main.js` porque es el único módulo que los tiene. La alternativa —que `ui.js` mire la categoría al pintar el texto— pondría una decisión de estado en el módulo que sólo pinta.

**Dónde va en la cadena y por qué:** arriba de `feliz`, porque está pasando ahora del otro lado de la pared; abajo de `standby`, porque dormido Chip no se entera; y abajo de `critico`, porque con la batería en rojo el aviso urgente es el otro.

`esperando` **no tiene efectos dibujados** —igual que `critico`— y **no tiene pantalla del pecho**: los antebrazos cruzados la tapan entera.

### Las poses de idle

`idle-manitos.png` es una **pose alternativa, no un estado**. La diferencia es estructural: el estado decide los efectos, la clase del CSS y la cadena; la pose sólo decide qué PNG se dibuja, dónde cae la antena y dónde la pantalla del pecho. Meterla en la cadena obligaría a inventarle una condición que no tiene.

`render()` recibe por eso dos cosas distintas: `estadoVisual` para la clase y `claveSprite` para el dibujo. Y `pintarClaseEstado` toma las dos, porque **la antena sigue al dibujo y no al estado**: entre `idle` e `idle-manitos` el bulbo se corre 1,7% de ancho y 1,8% de alto, y con una sola entrada de tabla el glow quedaría flotando al lado de la antena en una de las dos poses.

La pose se **sortea una vez por sesión** y no cambia mientras la app está abierta. La primera versión la rotaba cada minuto con una moneda, y estaba mal: Chip cambiando de postura solo mientras lo mirás se lee como un glitch, no como que se acomodó. Sorteada al abrir, la pose es simplemente cómo está hoy, y la variación se nota entre visitas, que es donde tiene que notarse.

**La pose alternativa NO parpadea, y es una decisión medida.** La tentación era reusar `idle-ojos.webp`, porque es la misma cara. No sirve: comparando el centro de las dos pupilas entre los dos PNG, el ojo izquierdo se corre **12 px a la derecha y 9 hacia arriba**, y el derecho **6 y 6**. Que los dos ojos se muevan *distinto* quiere decir que la cabeza está a otro ángulo, no simplemente corrida — no hay offset que lo arregle. Un recorte desalineado 6-12 px es exactamente el defecto que apareció con el párpado: no se nota midiendo y canta al 400%.

### Y por eso `idle-manitos` está suspendida

Lo que no se pesó al tomar esa decisión fue su **consecuencia combinada con el sorteo por sesión**: media visita al azar con Chip parpadeando y media con la cara completamente quieta. La inconsistencia que el jugador no se puede explicar hace más daño que la falta de variedad — una pose que nunca parpadea se lee como que algo se colgó, no como una postura distinta.

Así que `POSES_IDLE` quedó en `['idle']` solo. **No se borró nada más**: la entrada de `RUTAS_SPRITES`, la de `POSICIONES_ANTENA`, la de `PANTALLAS_PECHO`, la de `RECUADROS_RAYO` y la de `APOYO_ORUGAS` siguen ahí y siguen estando bien medidas. Volver a habilitarla es agregar `idle-manitos-ojos.webp` a `RUTAS_OJOS` y devolver la pose a la lista. Nada más.

Y hay un test que lo cuida: **toda pose de `POSES_IDLE` tiene que tener recorte en `RUTAS_OJOS`**. Es lo que va a fallar el día que alguien devuelva la pose sin su recorte. La regla no existía porque el código soporta el caso sin ramas —una clave sin entrada en `RUTAS_OJOS` simplemente no parpadea y esconde la capa— y eso hizo que el defecto fuera **silencioso**: no rompe nada, sólo apaga media cara media sesión.

---

## Contrato de sprites

`/sprites/`, **carpeta en minúscula** — Windows no distingue, un hosting Linux sí.

```
idle.png  feliz.png  critico.png  standby.png  cargando.png  jugando.png  limpiando.png
esperando.png                      ← estado
idle-manitos.png                   ← pose alternativa de idle, NO es un estado
```

256×256, PNG con transparencia, personaje centrado. **Mismo tamaño y mismo encuadre en todos**: si el robot está más arriba en uno, salta al cambiar de estado.

Siete archivos ideales, **seis obligatorios**: `limpiando.png` es opcional. Los siete están en el repo desde `2e6b288`, todos a 256×256. Después entraron dos más: `esperando.png`, que es un estado nuevo, e `idle-manitos.png`, que **no** es un estado sino una pose alternativa de idle. Los dos pasan por el mismo loader y el mismo fallback, así que `RUTAS_SPRITES` los lista igual.

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

---

## El porqué de todo esto

Las decisiones de diseño, lo que se probó y se descartó, y los bugs que costó
encontrar están en **[EL-PORQUE.md](EL-PORQUE.md)**. Este archivo es lo que hace
falta para trabajar; ese es lo que hace falta para no repetir errores.
