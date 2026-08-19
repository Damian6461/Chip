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

237 pruebas, mismos archivos en dos entrypoints:

```bash
node tests/correr.mjs        # sale 0 si pasa todo, 1 si no
```

```
http://127.0.0.1:5500/tests/   # verde/rojo en la página, resumen en el <title>
```

No hace falta `package.json`: Node detecta la sintaxis de módulo sola. Los dos entrypoints instalan un `localStorage` en memoria antes de importar nada del juego, así que **la suite nunca toca tu partida**, ni siquiera en el navegador donde el origen es el mismo.

Se corren después de cualquier cambio que toque estado, decay o persistencia.

`tests/tema.test.js` cruza el puente de `config.js` al resto del proyecto en las dos direcciones y en las dos capas: que ningún `var()` que la hoja no defina se quede sin escritor, que nada de lo que el tema escribe quede sin lector, y que toda constante de `config.js` la lea alguien. Ver abajo por qué eso hacía falta.

`tests/composicion.test.js` hace cumplir las dos reglas de composición de los efectos: que ninguna partícula se salga de `FRANJA_EFECTOS` y que ninguna entre en el círculo de `RADIO_EXCLUSION_ANTENA`. Las dos constantes existían hace rato y **no las leía nadie** — aparecían sólo en un comentario de `style.css` contando que las posiciones se habían verificado a mano. Los números que mandan viven en el CSS como literales, así que mover un corazón al 92% no rompía nada y nadie se enteraba. Mismo patrón que el guardián de las poses: una regla sostenida por disciplina, no por construcción.

`tests/orquestador.test.js` es el que cubre la secuencia y no las piezas: el ciclo de visita completo, la primera visita absoluta, la ausencia larga contra los dos caps, la acción que no aplica, el cruce de tramo con la app abierta y el doble guardado. Las otras siete suites pasaban enteras mientras el lugar donde esas piezas se combinan no tenía una sola prueba — y ahí estaban los dos bugs de arriba.

---

## Panel de debug

```
http://127.0.0.1:5500/index.html?debug=1
```

Sin el parámetro, `js/debug.js` ni se descarga (import dinámico).

**En la app instalada el parámetro no llega** —la PWA arranca en la `start_url` cacheada y el service worker responde con `caches.match` sin `ignoreSearch`—, así que hay una puerta de servicio.

> ### CÓMO SE ABRE EL PANEL EN EL TELÉFONO
>
> **Cinco toques rápidos en la esquina de arriba a la izquierda**, dentro de dos
> segundos. La zona es de 56 × 56 px y está 12 px adentro del canto.
>
> **YA NO ES MANTENER APRETADO EL BOTÓN DEL MENÚ.** Ese era el gesto anterior y
> se cambió porque no funcionaba con el dedo, aunque tuviera las cuatro cosas
> que un gesto sostenido necesita.
>
> Cada toque, del segundo en adelante, deja una marca blanca de 220 ms en la
> esquina. El quinto la deja **cian**: eso quiere decir que el gesto entró y el
> panel se está pidiendo. Si después no aparece nada, el problema es la descarga
> y no el gesto — y en ese caso la marca se pone **roja**.

Ese cambio de gesto tardó en llegarle a la única persona que lo usa, y eso fue
el defecto real del punto 9: el mecanismo andaba desde hacía cincuenta commits y
la instrucción vivía nada más que en un comentario de `index.html`, donde nadie
la iba a leer. Por eso está acá arriba y no en una nota al pie.

**Y si no hay conexión, el gesto correcto falla igual.** `js/debug.js` NO está en
`ARCHIVOS_CACHE` a propósito —es superficie de desarrollo y no parte del juego
instalado— así que ese import sale a la red. La marca roja es lo que distingue
"no bajó" de "no se registró el gesto", y la consola lo dice con todas las
letras. Ver `TOQUES_DEBUG` en `config.js`.

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
| tirar al piso | deja una pieza tirada en el piso sin esperar la moneda del 15%. Con la colección completa le saca la última a la colección para poder volver a encontrarla — sólo el panel hace eso |
| clima: tormenta / niebla | pone el clima sin esperar a que salga su evento, que es uno de cuarenta y nueve. Un botón por entrada de `CLIMAS`: el tercero aparece solo el día que exista |
| cambiar pose | avanza el índice de pose de idle sin recargar (hoy `POSES_IDLE` tiene una sola, así que no cambia nada) |
| reiniciar partida | save nuevo en 100/100/100 |

La lectura de abajo muestra los stats con decimales, la colección cruda, la presencia, la capa que alcanzó el arco y los hitos ya vividos.

**`visual` y `hora` no son lo mismo.** `visual` pisa el resultado de la cadena y no toca nada más: forzar `standby` cambia el sprite y deja el galpón como esté. `hora` mueve el reloj que usa el juego, así que arrastra la cadena **y** el fondo: poner 23 muestra a Chip en standby con el galpón de noche, que es el estado real de esa hora. `hora` no se resetea al reiniciar la partida — el save y el reloj son cosas distintas.

**`simular h` y `volver tras N h` no son lo mismo.** El primero cobra el decay ya; al recargar no quedan horas transcurridas y **los eventos nunca se disparan**. El segundo recorre el camino de arranque real, como si hubieras cerrado y vuelto a abrir la app: es el único que sirve para ver eventos.

La lectura de stats de abajo sigue **también** a los botones del juego: `iniciarDebug` devuelve su función de refresco y `pintar()` la engancha.

---

## Reglas de arquitectura

Se rompen y el proyecto se degrada rápido.

- **`estado.js` es el único que toca `localStorage`.**
- **`ui.js` y `ui-montaje.js` son los únicos que tocan el DOM del juego** (lo declarado en `index.html`). Reciben y pintan: no calculan. Excepción declarada: `debug.js` crea su propio subárbol, lo appendea a `document.body` y no lee ni modifica nada que no haya creado él.
- **`tema.js` es puro.** Arma el mapa de custom properties y no lo escribe: quien lo escribe es `ui-montaje.js`.
- **`decay.js` es puro.** No guarda, no lee `localStorage`, no toca el DOM, no muta lo que recibe.
- **`acciones.js` es puro.** Señala "no apliqué" devolviendo la misma referencia.
- **`config.js` es el único hogar de las constantes del juego.** Tres carve-outs documentados en el propio archivo: `sw.js`, `manifest.json` y `tests/config.pruebas.js`.
- **El decay se calcula por diferencia de timestamps, nunca con un contador corriendo.**
- **Ningún shorthand de CSS en una propiedad que otra regla declare por su cuenta.** No es una regla sobre `animation` ni sobre `transition`: es sobre **todos** los shorthands, porque todos hacen lo mismo. Un shorthand no declara lo que uno escribió: declara **toda su familia**, y le pone el valor inicial a los longhands que uno no nombró. Así que si dos reglas comparten sujeto y una usa el shorthand, la que gane por especificidad no *agrega* lo suyo — **borra lo que declaró la otra**, sin error, sin consola y sin que ninguna de las dos se vea mal leída por separado. Van longhands: la regla base declara la lista completa y las demás tocan sólo el valor que les toca. Ver abajo: **mordió cuatro veces**.
- **Todo asset nuevo entra en `ARCHIVOS_CACHE` con su bump de `CACHE_VERSION`**, y `tests/assets.test.js` lo verifica: el cruce ya no es disciplina.
- **Nunca medir con `getBoundingClientRect` un elemento con `transform`.** Devuelve la caja del bounding box rotado, no la del elemento. Para la caja de layout van `offsetWidth` / `offsetHeight`. Ver abajo: el instrumento miente.
- **Cualquier gesto sostenido o de arrastre necesita `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none` y `contextmenu` prevenido**, o el navegador lo cancela solo: el long-press nativo —menú contextual, selección, guardar imagen— emite `pointercancel` y aborta el gesto. Además hay que capturar el puntero y cancelar por DISTANCIA, no con `pointerleave`: un dedo apoyado tres segundos se mueve solo. Ver abajo: el instrumento miente, y acá el instrumento es el evento sintético.
- **Un guardián no está verificado hasta que se lo vio ROJO.** Verde no prueba nada: puede estar mirando el lugar equivocado. Y hay un motivo por el que suele estarlo — **un guardián escrito contra el bug que ya pasó cuida la forma vieja del código**. El arreglo cambia la forma, así que la reincidencia entra por la nueva y el test ni se entera. Pasó exactamente así con el shorthand `transition`: el guardián comparaba shorthand contra shorthand, y esa forma dejó de existir en el mismo commit que lo escribió, porque el arreglo pasó `#ojos` a longhands. El defecto reintroducido por la forma nueva daba **314 en verde**. Por eso los tests de esa familia llevan **fixtures con el defecto adentro** y exigen que el guardián falle: la prueba de que sirve no es que pase, es que se lo haya visto no pasar.
- **Un porcentaje de la escena no puede seguir a algo dibujado en el fondo.** El galpón se dibuja con `background-size: auto 100%`: la imagen se escala por alto y lo que sobra a los costados **se recorta**, así que cuánto se ve depende de la relación de aspecto. En un teléfono de 390×844 entra **del 8,0% al 34,0%** del ancho de la imagen; en pantalla ancha, del 8,0% al 36,6%. **El mismo punto del dibujo cae en 75,17% de la escena a 390×844 y en 68,39% en pantalla ancha.** Una constante en % de escena que apunte a un rasgo del fondo está bien en un aparato y mal en el otro, **siempre**: o es código que convierte en runtime, o el rasgo no se persigue. Pasó con `TOMA_PARED`, y en dos capas: la punta del cable llegaba exactamente a la constante —medido, 90,0 / 58,0— y la constante no apuntaba a ningún toma dibujado dentro de la franja visible; los dos números coincidían porque salían del mismo lado. Se resolvió sacando el cable de cuadro, que es lo único que funciona igual en todos los anchos. `verificacion/telefono.html` es la página que lo mide.
- **Un fundido cruzado entre dos dibujos de pixel art inventa colores que nadie dibujó.** El pixel art **corta, no disuelve**: no tiene píxeles semitransparentes, así que dos sprites al 50% cada uno dan una mancha que no existe en ninguna paleta del proyecto. Pasó con las capas de ojo: durante 260 ms Chip tenía ojos de fantasma cada vez que cambiaba de cara. Y el cruce **medía perfecto** —la suma de opacidades daba 1,00 en todos los cuadros y el salto máximo era 0,19—, porque lo que estaba mal no era el valor: era la técnica. **Se detecta mirando un cuadro del medio, nunca midiendo los extremos.** Un fundido entre un dibujo y la nada (aparecer, desaparecer) no tiene el problema y no se toca. Lo hace cumplir `tests/composicion.test.js`.
- **Una herramienta de verificación que no se puede abrir no verifica nada.** Y si falla **en silencio** es peor que no existir: se lee como "no hay nada que ver", que es la conclusión opuesta a la correcta. `verificacion/botonera-hueca.html` estuvo cinco intercambios frenando la última decisión abierta del proyecto porque abrirla con doble clic la deja muda — se dibuja con módulos ES y el navegador los bloquea en `file://` por CORS, así que queda sólo la prosa. Toda página de `verificacion/` avisa, arriba de todo y en un script **clásico** —el único que corre con los módulos bloqueados—, cuándo la abrieron mal, y trae **la URL del deploy** a la vista, porque las decisiones de dedo sobre vidrio no se pueden contestar desde la PC. Lo hace cumplir `tests/assets.test.js`.
- **Un rojo no se explica, se reproduce.** Una explicación plausible de por qué un test falló es exactamente igual de barata que una explicación plausible de por qué pasó. Si el rojo no se corre, no se sabe qué era. Pasó acá: ante un `316 / 1` se dio por hecho que el que fallaba era el guardián del deploy —"salta porque se tocó `style.css`"— y el que fallaba era el del shorthand, con nombre y apellido, avisando de un falso positivo real sobre `#puerta-servicio::after`. Es la misma familia que el test verde que se creyó, del otro lado: **un veredicto que no se miró no es un veredicto, es una expectativa**.
- **Y SE PRUEBA EN LAS DOS DIRECCIONES.** Rojo con el defecto no alcanza: hay que verlo **verde con un cambio legítimo del mismo vecindario**. Un guardián que ladra donde no debe bloquea trabajo bueno, y eso no se descubre al escribirlo — se descubre meses después, peleando media hora contra un test que tiene razón en el nombre y no en el caso. Pasó: el guardián del shorthand juntaba `#x::after` con `#x`, que son **dos cajas** y no comparten cascada, así que darle una transición propia a `#puerta-servicio` lo ponía en rojo sin motivo. Por eso la mitad de sus fixtures son de los que **no** tienen que ladrar.
- **Una condición que siempre da lo mismo se lee como una decisión y no lo es.** El `sujetoDe` del guardián tenía `coincidencia.startsWith(':') ? '' : coincidencia`, que parece separar pseudo-clases de pseudo-elementos y no separa nada: `'::after'.startsWith(':')` es `true` y la rama derecha nunca corrió. Lo peor no es el bug: es que el comentario de al lado describía la **intención**, así que leerlo confirmaba el error en vez de delatarlo.
- **Un criterio de análisis se descarta con el número, no con el argumento.** Tres variantes de la clave del guardián, medidas sobre `style.css`: comparar por conjuntos de clases suelto dio **975** hallazgos de ruido; exigiendo ids iguales, **145**; puras clases con contención estricta, **0**. La tercera entró por el 0, no porque sonara mejor — y la primera se había descartado antes "porque abría falsos positivos", que era cierto y no era una medición.
- **Un número publicado viaja con su definición o no viaja.** Un umbral, un porcentaje o un "pierde 62 píxeles" sin decir *sobre qué se contó* no se reproduce, y lo que no se reproduce no se puede cruzar: dos personas miden, les da distinto, y no hay forma de saber cuál de las dos cuentas era otra cuenta. Mordió dos veces —el 95 del histograma del cable, que no decía sobre qué ventana; y el 62 de `verificacion/capas.html`, que no decía si los píxeles iban pegados—, y las dos veces el número estaba bien. Va **al lado del número**, en el archivo que lo publica, no en el commit ni en el parte. Y si el número es un corte que decide algo, va también de dónde salió y cuánto aire tiene.
- **`main.js` es cableado y no decide nada.** Arma las piezas, les pasa el reloj real y el DOM real, y las conecta. Lo que decide vive en `visita.js` y `sesion.js`, que se prueban sin navegador.

### El orquestador son tres archivos

Durante mucho tiempo fue uno solo, y ese uno era el único lugar del juego sin una prueba. No por descuido: `main.js` **corre al importarse** y arrastra el DOM entero de `ui.js`, así que no había forma de cargarlo en Node. Justo la parte con más dependencias entre pasos era la que no se podía tocar sin cruzar los dedos.

Ahora son tres, y el corte no es por tamaño sino por qué necesita cada uno para correr:

| archivo | qué es | qué necesita |
|---|---|---|
| `visita.js` | qué pasa al abrir: decay, presencia, eventos, hallazgos | nada. Función pura de `(estado, ahora)` |
| `sesion.js` | qué pasa mientras está abierta: la cadena, el debounce, las acciones, el tick | una vista, un reloj y un guardado, **inyectados** |
| `main.js` | el cableado | un navegador |

Las tres dependencias que recibe `sesion.js` son exactamente las tres cosas que no tiene derecho a hacer sola, y son las mismas reglas de siempre dichas de otra forma: `vista` porque `ui.js` es el único que toca el DOM, `guardar` porque `estado.js` es el único que toca `localStorage`, y `reloj` porque los timers de verdad los pone `main.js`.

#### El reloj tiene dos lecturas y no una

`reloj.mundo()` es la hora del juego —la que el panel de debug puede forzar— y la consultan la cadena de estados y el tramo del día. `reloj.real()` es el reloj de pared y lo usa **sólo** el debounce, que mide cuánto hace que cambió el sprite.

No es una sutileza: si el debounce leyera el reloj forzado, mover la hora a las 23 en el panel le daría un "transcurrido" de horas y el debounce dejaría de existir. En `main.js` esto ya funcionaba así —eran `relojEfectivo()` y `Date.now()` mezclados en el mismo cuerpo— pero la distinción no estaba escrita en ningún lado y la primera persona que unificara los dos llamados rompía el debounce sin enterarse. Ahora son dos nombres y hay un test que lo dice.

#### Los dos bugs que aparecieron el primer día

Las dos primeras pruebas de integración que corrieron encontraron dos cosas que ninguna prueba de pieza podía encontrar, porque las piezas estaban bien y lo que fallaba era la secuencia:

**El fade de apertura nunca existió.** `DURACION_CRUCE_APERTURA_MS` (1500 ms) se programaba al sembrar el tramo anterior y `actualizarNoche()`, llamada dos líneas después, la pisaba con `DURACION_CRUCE_FONDO_MS` (2600 ms) — porque la condición que hace entrar a `actualizarNoche` es exactamente la misma que hizo sembrar. La constante estaba declarada, usada, y no llegó a la pantalla ni una vez. Arreglado con un `??`: un cruce ya programado gana.

**Cada clic tiraba una excepción.** Un handler de "clic afuera para cerrar la colección" llamaba a `ocultarColeccion()`, que se borró cuando la colección se mudó adentro del menú. Parecía protegido por `if (panelColeccion.hidden) return`, pero mudar el panel al menú lo deja con `hidden = false` para siempre, así que el guard nunca cortaba. No era código muerto: era código que corría y fallaba, en silencio, en cada toque del galpón.

Ninguno de los dos rompía nada visible. Los dos llevaban meses.

### El módulo que pinta son tres archivos

Mismo corte que el del orquestador y por la misma razón: no por tamaño, sino por qué necesita cada parte para correr.

De las 779 líneas de código de `ui.js`, **310 se ejecutaban una sola vez al importarse** — los veinte `getElementById`, el puente de custom properties y los tres SVG del mobiliario. Estaban ahí porque tenían que correr antes que todo lo demás, no porque pertenecieran al módulo que pinta.

| archivo | qué es | qué necesita |
|---|---|---|
| `tema.js` | el mapa de custom properties que sale de config | nada. Función pura |
| `ui-montaje.js` | los nodos, el puente aplicado, el mobiliario dibujado | un DOM, al importarse |
| `ui.js` | las once funciones que pintan, y sus auxiliares | un DOM, al llamarlas |

**Lo que se gana es `tema.js`.** Una custom property sin escritor no se rompe: `var(--x)` sin valor se cae al fallback y la página sigue andando. Un `--duracion` que nadie escribe deja una animación en su default; un `--color` que nadie escribe deja un elemento transparente. Nada tira error, nada llega a la consola. Mientras el puente vivió en noventa líneas de `raiz.style.setProperty(...)` adentro de `ui.js`, la única forma de verificarlo era abrir el navegador y fijarse si algo se veía raro.

**Lo que NO se gana, dicho claro:** `ui.js` sigue sin poder importarse desde Node. Importa `ui-montaje.js`, que toca el DOM al cargarse. Para que fuera importable habría que inyectarle los nodos, como se hizo con `sesion.js`, y eso es tocar las cuarenta y seis funciones. Hoy no vale la pena; el día que valga, la costura ya está.

**El límite conocido que sale de ahí, y conviene tenerlo escrito:** *la suite puede estar entera en verde con la app rota*. Nada de `ui.js` se ejecuta en Node, ni siquiera se parsea — así que un error que el motor encuentra al cargar el módulo pasa los 261 tests sin despeinarse. Ya pasó: un `import` duplicado de `VARS_CABLE` dejó `ui.js` tirando `SyntaxError: Identifier has already been declared`, la app no arrancaba, y la suite decía 259 pasaron, 0 fallaron. Lo agarró el navegador en el primer reload.

De ahí salen dos costumbres, y no son cortesía:

- **Abrir la app después de tocar `ui.js`**, aunque el cambio parezca de una línea y aunque los tests estén verdes. Verde no quiere decir que cargue.
- **Lo que se puede cruzar como TEXTO, se cruza.** Varias pruebas leen `ui.js`, `style.css`, `sonido.js` o `estado.js` con `readFileSync` en vez de importarlos — es lo que permite guardar decisiones que viven en el módulo que pinta (que la rama del toque decida sólo por `habiaMantenido`, que `pintarFondo` caiga en `CABLE` sin clima, que haya UN clima activo y no una lista). Es más frágil que importar y agarra menos, pero agarra el renombre y el borrado, que es el modo de falla que pasa de verdad.

Lo que ninguna de las dos cubre es la tercera capa: **qué se ve**. Para eso no hay atajo — se mide en pantalla y se mira a tamaño real, que es de dónde salieron el pozo de 300 ms del toque y el cruce del cable con el piso de la niebla.

**Lo que quedó del lado del pintado a propósito:** el cableado de listeners del menú y del alféizar. También corre al importar, pero engancha funciones de `ui.js` —`abrirMenu`, `cerrarMenu`, `irAColeccion`—, así que mudarlo daría una dependencia circular a cambio de nada. Montaje es "dejar el galpón puesto", no "conectar los botones".

---

### Toda constante tiene lector

El cruce del puente resultó ser un caso de algo más general, y conviene decirlo como regla: **un nombre que se escribe y nadie lee es peso muerto, y casi siempre es el rastro de una mudanza a medio hacer.** Vale igual para una custom property que para un `export const`. En JS el error es incluso más silencioso: una constante que nadie importa no llega ni a caerse a un fallback.

`tests/tema.test.js` cruza las dos capas. La de abajo recorre los `export const` de `config.js` y exige que cada uno tenga al menos un lector; una revisión a mano encontró siete que no lo tenían, y las siete contaban la misma historia — la mudanza del tap a los tres gestos había dejado su versión vieja escrita al lado de la nueva.

Dos detalles del guardián, que son los que lo hacen servir:

- **Cuenta como lector** cualquier mención del nombre fuera de su declaración: otro módulo, un test, una herramienta del repo (`icons/generador.html` es el único lector de `ICONOS`), o el propio `config.js` armando otra tabla con él (`EVENTO_NIEBLA` no lo lee nadie afuera; lo consume `CLIMAS`, dos líneas más abajo).
- **No cuenta** un `import * as CONFIG` recorrido con `Object.entries`, que es lo que hace ese mismo archivo unas líneas más arriba. Un recorrido así toca todos los nombres sin nombrar ninguno: si contara, taparía justo el defecto que se busca.

Y hay un segundo escalón, que **tampoco es un lujo**: una constante que sólo leen los tests no está describiendo el juego, está describiendo a otro test. Ahí vivía `RUTAS_FONDOS` — muerta para el juego y, peor, prestándole autoridad a dos guardianes que por culpa de ella verificaban dos fondos de seis.

**El costo de dejarlas** no es el peso. Es que quien lee `config.js` las lee como si estuvieran vigentes, y quien busca por qué algo no anda las encuentra y cree haber encontrado la causa. Por eso, cuando una se va, en su lugar queda escrito **a qué constante mudó la decisión** — no un borrado limpio, que invita a reponerla.

---

### La regla de los shorthands

Mordió **cuatro veces**, con el mismo mecanismo y cuatro síntomas que no se parecen en nada:

| dónde | qué se veía | qué pasaba |
|---|---|---|
| las Z de `standby` | "apenas se ve una Z" | las tres latían al unísono |
| las chispas del enchufe | nada raro, por suerte | las cuatro salían juntas |
| las motas de polvo | el galpón quieto | las seis corrían el mismo ciclo con el mismo arranque |
| los ojos, al soltar la caricia | "los ojos se salen de la órbita" | `#ojos` saltaba de 0 a 1 en un cuadro |

Las tres primeras son `animation` pisando `animation-delay`: una regla como `.estado-standby .zeta { animation: … }` resetea el delay a `0s` y le gana a `.zeta:nth-child(N)`, que sí lo declara, porque **tienen la misma especificidad** (0,2,0 contra 0,2,0 — o peor, 0,2,1 en el caso del polvo) y viene después en el archivo.

La cuarta es `transition` pisando `transition-property`, y por eso la regla dejó de ser sobre `animation`:

```css
#ojos               { transition: opacity   … }   /* un id */
#cabeza-grupo #ojos { transition: translate … }   /* DOS ids, gana */
```

El segundo no agrega el `translate`: deja `transition-property` en `translate` **solo**, y el cruce de opacidad de los ojos deja de existir. Consecuencia medida: `#ojos` pasaba de 0 a 1 sin transición mientras la capa de gesto —corrida arriba y a la derecha, porque es un recorte de otra pose— seguía apagándose 260 ms. Un cuarto de segundo con dos ojos dibujados en dos lugares.

Lo que las cuatro tienen en común, y es la razón de que la regla sea general:

- **Las dos reglas se leen bien por separado.** Ninguna dice nada falso. El daño está en la relación entre las dos, que no se ve desde ninguna de las dos.
- **No lo detecta mirar ni medir el resultado.** Los elementos están, tienen su color y su tamaño, y la animación corre. Tres Z superpuestas y sincronizadas se ven exactamente como una Z. Lo único que lo delata es leer el **valor computado** del longhand.
- **Las dos reglas suelen tener autores o momentos distintos.** El cruce de los ojos lo escribió el punto 17 y lo rompió el punto 6, con un commit de diferencia y el mismo día.

Las burbujas de `limpiando` nunca tuvieron el problema, y no por suerte: su regla de estado usa longhands (`animation-name`, `animation-duration`, …). Ese es el patrón a copiar, y ahora también el de `#ojos`: `transition-property` en la regla base, y las reglas más específicas tocando sólo `-duration` y `-timing-function`.

Cuatro veces no es una anécdota: es una propiedad del proyecto. Por eso está arriba, entre las reglas de arquitectura, y por eso está escrita para **cualquier** shorthand y no para los dos que ya mordieron.

**Lo hacen cumplir dos tests** (`tests/composicion.test.js`), sobre las familias `transition` y `animation`, y son dos porque el hueco se abre de dos formas:

| forma | qué mira |
|---|---|
| shorthand contra shorthand | dos reglas del mismo sujeto declaran el shorthand con propiedades **distintas** |
| **shorthand contra longhand** | un sujeto declara un longhand en cualquier regla y **otra de igual o mayor especificidad** usa el shorthand de esa familia |

La segunda es la que faltaba, y no es un detalle: **es la forma que queda después de arreglar la primera.** Ver más abajo.

Dos carve-outs, los dos sobre código que está bien: con especificidad **igual** manda el orden del archivo, así que un longhand escrito **después** no se marca —es lo que hacen `#chip.acariciando` y `#chip.volviendo` sobre `#cabeza-grupo`—, y dos declaraciones de la **misma regla** tampoco, porque ahí el orden se lee de arriba abajo, como en `.mota-polvo`. `transition: none` y `animation: none` tampoco: apagar todo es un reset a propósito.

**Y un test puede estar verde mientras el defecto está vivo.** Pasó dos veces seguidas con el mismo defecto, de dos maneras distintas, y las dos vale tenerlas escritas:

1. **El test miraba la declaración, no el valor calculado.** Buscaba el texto `transition: opacity var(--ojos-cruce)` en el CSS, y ahí estaba, escrito tal cual — pero otra regla lo reseteaba. Un grep sobre la hoja no puede resolver la cascada. Así que lo que un test de texto puede hacer no es comprobar el valor: es **prohibir la construcción** que deja el valor a merced de la especificidad.
2. **El guardián que reemplazó a ese test cuidaba la forma vieja del código.** Comparaba shorthand contra shorthand; el arreglo pasó `#ojos` a longhands y esa forma dejó de existir **en el mismo commit**. Reintroducido el defecto por la forma nueva —una sola regla más específica con el shorthand— el suite daba 314 en verde con el bug vivo y medible en el navegador.

De ahí sale la regla de arriba: **verde no prueba nada hasta que se lo vio rojo.** El guardián viene con ocho fixtures de CSS de mentira y el test exige rojo en tres —el defecto de los ojos, la forma de las Z con `animation`, y `.objeto.volando` contra `.objeto`— y **verde en los otros cinco**, que son cambios legítimos: el longhand posterior con igual especificidad, las dos declaraciones de la misma regla, `transition: none`, el pseudo-elemento contra su elemento, y la contención al revés. Además se lo probó contra la hoja real en las dos direcciones: devolviendo `transition: translate …` a `#cabeza-grupo.distraida #ojos` falla nombrando las dos reglas y el longhand pisado; poniendo un `animation-delay` en `.objeto` encuentra los tres `.objeto.*` que lo pisan; y dándole una transición propia a `#puerta-servicio` no dice nada, que es lo correcto.

El sujeto contra el que se comparan las reglas tiene su propia historia y está escrita en el test: las **pseudo-clases** salen de la clave —`.zeta:nth-child(2)` y `.zeta` son el mismo elemento, y ése era el agujero por donde `animation` se colaba igual— y el **pseudo-elemento** se queda, porque `#x::after` es otra caja. Y hay un segundo pase para `.a.b` contra `.a`, angosto a propósito, cuyo ancho se decidió con los números de la regla de arriba.

### La regla del `[hidden]` contra el `display`

De la misma familia que la anterior, y la más traicionera de las cuatro: **cosas que funcionan hasta que otro cambio, perfectamente legítimo, las apaga en silencio.**

`elemento.hidden = true` no esconde nada por sí solo. Lo esconde la regla `[hidden] { display: none }` de la hoja del **user agent**, y esa hoja pierde contra cualquier declaración de autor. Un `display: grid` en `style.css` deja el `hidden` sin efecto: no hay error, no hay consola, y el atributo queda puesto en el DOM como si funcionara.

Lo que la hace distinta del shorthand es **el retardo**. El defecto no aparece cuando alguien escribe el `hidden`; en ese momento anda. Aparece meses después, cuando otra persona —o la misma— le agrega un `display` al elemento por un motivo que no tiene nada que ver:

| elemento | por qué le llegó el `display` | qué se rompió |
|---|---|---|
| `#estado` | `flex` para acomodar las tres barras | quedó anotado a tiempo |
| `#eventos` | `flex` para la línea de texto | quedó anotado a tiempo |
| `#piso` | `grid` para centrar la pieza adentro de la caja táctil de 44 px | la pieza volaba al estante **y quedaba también en el piso** |

Los dos primeros tienen un comentario en la hoja avisando de la trampa, escrito por quien la sufrió. Y volvió a pasar igual, porque **un comentario protege el lugar donde está, no la clase de error**. Entre el `hidden` de `#piso` y el `display` que lo apagó pasaron meses y una tarea entera de otra cosa.

Por eso ahora hay un test (`tests/composicion.test.js`) que cruza los dos archivos: saca de `ui.js` y `ui-montaje.js` qué nodos esconde el JS con `.hidden` —resolviendo el id desde su `getElementById`— y busca en `style.css` cuáles de esos tienen un `display` propio sin repetir la regla `[hidden]`. Son doce nodos.

Un detalle que lo hace servir: **el id tiene que ser el sujeto de la regla, no un ancestro.** `#rayo svg { display: block }` le da display al `svg`, no a `#rayo`, y contarlo sería un falso positivo — que es la única aserción con nombre propio del test.

**Las cuatro reglas de esta familia**, juntas porque el modo de falla es el mismo:

| regla | qué la apaga | cómo se detecta |
|---|---|---|
| `animation-delay` por `:nth-child` | una regla posterior con el shorthand `animation` | leyendo el `delay` computado; mirar no alcanza |
| `transition-property` de un elemento | una regla más específica con el shorthand `transition`, que lo resetea a lo suyo | leyendo el `transitionProperty` computado |
| `transform` de una capa | otra regla que declara `transform` y lo pisa entero, porque no se suman | leyendo el `transform` computado |
| `hidden` de un nodo | un `display` de autor en cualquier regla que lo matchee | cruzando JS contra CSS |

Ninguna de las cuatro tira error. Ninguna se ve al escribirla. Todas se cierran con un test o con un longhand, nunca con disciplina.

### Cuando el instrumento miente

Una y otra vez, una medición dio un número correcto de una cosa que no era la
que se estaba midiendo. Ninguna se detecta mirando el número: todos parecen
razonables. Se detectan sabiendo que existen.

| el instrumento | lo que devuelve | lo que uno cree que devuelve |
|---|---|---|
| la pestaña de automatización | los relojes de animación **congelados**: `animationend` no llega nunca y `requestAnimationFrame` no dispara | el estado de una animación corriendo |
| `fetch` con el service worker vivo | lo que hay **en la caché**, que puede ser de tres deploys atrás | el archivo que acabás de escribir |
| una captura durante una transición | un fotograma **a mitad de camino** | el estado final |
| `getBoundingClientRect` sobre un elemento con `transform` | la caja **alineada a los ejes** del elemento rotado, siempre más grande | la caja del elemento |
| un gesto sostenido con eventos SINTÉTICOS | que el gesto **anda** | que anda en automatización, que es justo donde el navegador no lo cancela |
| `setTimeout(fn, 30)` en la pestaña oculta | un timer de **un segundo**: el navegador clampea los timers de las pestañas en segundo plano | treinta milisegundos |
| una medición del contorno hecha sobre **una** pose | los extremos de esa pose | los de las nueve |
| la captura de la extensión | el viewport **reescalado** a su ancho máximo, y las regiones de `zoom` van en esas coordenadas, no en px de CSS | píxeles de CSS uno a uno |
| `getBoundingClientRect` sobre un hijo de un `overflow: hidden` | dónde estaría el elemento **si nadie lo recortara** | dónde se ve |

La octava explica un reporte que parecía peor de lo que era: las gotas de lluvia
medían de y −0,3% a y 81,6%, muy por debajo del vidrio, y por ese número el
defecto parecía ser "la lluvia se desborda media pantalla". El `overflow: hidden`
del contenedor las recortaba: lo que de verdad se pintaba afuera era el filo del
marco, unos pocos píxeles. El defecto existía —y se arregló—, pero para verlo hay
que **mirar los píxeles**, no los rects. Se confirma pintando las gotas de rojo y
sacando la máscara: ahí no hay nada que interpretar.

La sexta es la que dejó pasar un bug entero. `ZONA_PISO` decía "abajo de la mitad
ninguna pose pasa de x 18,2% ni de x 74,7%", y esos dos números son los de
`critico` sola: `jugando` llega ocho puntos más a la derecha con su rueda, o sea
adentro de la franja donde caía el objeto. La medición se había verificado contra
sí misma. La salida es la de siempre en este proyecto —**medir la unión, no una
muestra**— y además dejarla escrita en una tabla que el test vuelva a recorrer,
en vez de en un comentario.

La quinta es la que más caro sale, porque no falla: devuelve un dato coherente
del momento equivocado. Un `await` de 30 ms entre dos lecturas mide un segundo
después, así que todo lo que dura menos de un segundo —el fastidio de dos
segundos leído tarde, la red de contención de un vuelo que barre el nodo antes
de la segunda muestra— aparece como si no existiera. La salida es **no esperar**:
`getBoundingClientRect()` fuerza el layout por su cuenta, así que un barrido de
posiciones se puede hacer entero en una sola vuelta del bucle, sin un solo
`await` en el medio.

Las salidas de las otras cuatro:

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

### Un número correcto con la etiqueta equivocada es peor que un número equivocado

El equivocado se cae al reproducirlo. **El mal etiquetado sobrevive a la
revisión**, porque el que revisa comprueba el número y no el nombre.

Pasó con el piso del galpón. La medición decía «el atardecer tiene 112 de
luminancia media, y es donde se murieron las tres botoneras anteriores». El 112
era correcto y el atardecer no: el script mapeaba la etiqueta `atardecer` al
archivo `fondo-mediodia.webp`. Reproducido después, archivo por archivo:

```
fondo-amanecer    66,1
fondo-dia         58,9      <- éste es el atardecer
fondo-mediodia   112,0      <- de acá salía el 112
fondo-noche       25,3
```

Sobrevivió porque las dos mitades eran verdaderas por separado: existe una franja
con 112 y existe una franja llamada atardecer. Sólo se cayó cuando alguien midió
las cuatro **desde el archivo** y no desde la tabla.

Y no es una trampa de una sola vez: `fondo-dia.webp` **es** el atardecer, con el
nombre viejo mantenido para no romper referencias. O sea que el proyecto ya tenía
un archivo cuyo nombre miente, y este error es lo que pasa cuando esa mentira se
propaga a un script.

**Se detecta cruzando la etiqueta contra el ARCHIVO, no contra la tabla.** Toda
medición que agrupe por nombre tiene que imprimir al lado de qué archivo salió
cada fila.

### El resplandor se dibuja, la sombra se difumina

Una **sombra** real es suave, y por eso la elipse de contacto de las piezas
apoyadas es la excepción declarada del tratamiento de cantos duros. Pero una
**luz** que sale de una pieza de píxeles no: en pixel art un resplandor es
**escalonado**, y se dibuja en anillos de borde duro.

Un `drop-shadow` con blur sobre un elemento de pixel art mete cientos de píxeles
parciales que ninguna paleta tiene. Medido sobre un pulso del cable, en una caja
de 28×28 y con el círculo ya en radio entero: **14 píxeles opacos y 440 parciales
en 26 tonos**. Dibujado como un anillo: **32 opacos, 0 parciales, 2 colores** —
los dos que hay escritos en `config.js`.

Y la parte que hay que recordar: **`shape-rendering: crispEdges` no lo ve.** Los
filtros se aplican *después* del rasterizado y son ciegos a él. Poner
`crispEdges` y dejar el blur al lado es no haber cambiado nada, con aspecto de
haberlo cambiado.

El contraejemplo correcto está en la misma hoja: `#acciones button svg` usa
cuatro `drop-shadow` con **blur 0** para hacerle un contorno al ícono. Eso es un
offset entero, no un halo.

Lo que sí va suave y no se toca: las sombras de contacto, las de los objetos, el
blur de la lluvia, el del botón del menú y el de la sombra del puerto. Son sombra
y atmósfera.

### Probar un guardián en rojo también se puede hacer mal

La regla de siempre es que un guardián no está verificado hasta que se le
reintroduce el defecto y **se lo ve ponerse rojo**. Falta la otra mitad: si el
defecto se inyecta **en el lugar equivocado**, el verde que sigue no dice que el
guardián funcione — dice que no lo tocaste.

Pasó con el cable. Para probar el guardián de `crispEdges` se inyectó el defecto
buscando el par `stroke: none; shape-rendering: crispEdges`… que es también el
par que tiene el ícono de la botonera, y aparece antes en la hoja. Se reemplazó
el primero, el cable quedó intacto, y el resultado fue un guardián «verde» sin
haber sido probado. Lo delató que el rojo que sí apareció era el del ícono.

**La inyección tiene que ser única.** Verificá que el patrón que vas a reemplazar
aparezca **una sola vez** en el archivo antes de reemplazarlo, y si no, alargalo
hasta que lo sea.

### Cuando un defecto tiene grados, el peor punto suele ser el que explica la causa

El cable se midió cortándolo en tres puntos y contando colores: dieron **6, 7 y
12**. Lo fácil es leer el 12 como «ahí está peor» y seguir. Lo que decía es
**dónde**: el tercer corte cae justo en el cruce de las dos capas del cable, y
ahí el filo de una pasa por encima del filo de la otra. Con los filos dibujados a
opacidad 0,55 y 0,7, ese cruce apila dos mezclas — o sea que el peor punto no era
el peor por azar, era **el único lugar donde la técnica fallaba dos veces**.

Eso convierte una medición en un diagnóstico: el defecto no era «los bordes salen
suaves», era «el tono se calcula en función de lo que haya debajo». Y la
diferencia entre esas dos frases es la diferencia entre subir el contraste y
cambiar la técnica.

**Ante una escala de valores, el extremo no es sólo el caso más grave: es la
muestra donde la causa se ve amplificada.** Vale la pena ir a mirar qué tiene de
particular ese punto antes de promediar nada.

### Un guardián roto no se cae: se relaja

**Un test que ubica su sujeto por búsqueda de texto se ensancha cuando el ancla
desaparece, y ensancharse lo hace pasar más fácil, no menos.**

Media docena de estas pruebas cortan la hoja con
`CSS.slice(CSS.indexOf('A'), CSS.indexOf('B'))`. Si el ancla `B` deja de existir
—porque alguien borró esa regla, que es lo que pasa cuando el diseño avanza—
`indexOf` devuelve −1, `slice` lo lee como «un carácter antes del final» y el
bloque pasa a ser **el archivo entero**. Y ahí el test no falla: encuentra lo que
busca en cualquier otra pieza y sigue verde.

Pasó dos veces. La primera, el corte de los estados del botón apuntaba a un
comentario y `CSS` viene con los comentarios ya sacados: denunciaba un `width`
que estaba a tres mil líneas de la botonera — ése al menos se cayó ruidosamente.
La segunda fue peor y casi no se ve: el guardián de los íconos cortaba en
`.led {`, se borró el LED, y **siguió pasando** encontrando un `crispEdges` de
otra pieza.

La salida no es revisar mejor: es que **el corte lleve su red adentro**. En
`tests/composicion.test.js` vive `bloqueEntre(texto, desde, hasta, tope)`, y
hace lo que un slice suelto no hace:

- si falta cualquiera de las dos anclas, **tira** — no devuelve un bloque raro;
- si el bloque supera el tope, **tira**: una regla son cientos de caracteres, no
  miles, y el tope es lo que distingue «encontré mi regla» de «me comí la hoja»;
- si el fin quedara antes del principio, tira.

Los trece cortes del archivo pasaron por ahí. El único que queda abierto —el del
bloque de movimiento reducido, que es lo último de la hoja y no tiene ancla de
fin— lleva las dos comprobaciones escritas al lado, por lo mismo.

**Todo corte por texto lleva su tope. Si el ancla no aparece, el test rompe en
vez de ampliarse.**

### Una constante no está huérfana porque la hoja no la lea

`--panel-chapa`, `--panel-filo` y `--panel-hueco` quedaron sin un solo lector en
`style.css` cuando la botonera perdió la caja, y estuvieron a un commit de
borrarse. **Los lee `formas.js`**, en el SVG del panel de mantenimiento — que es
el dueño original de la tabla y la razón del nombre. La botonera era el inquilino.

El JS que genera SVG también lee tokens: `fill="var(--panel-chapa)"` es un lector
tan real como una regla de CSS. Un `grep` sobre `style.css` no alcanza para
declarar muerta una constante, y **el nombre de la variable dice quién fue el
dueño original, no quién es el único**.

El barrido tiene que mirar los dos, y de hecho lo hace: el guardián del puente
—`tests/tema.test.js`— cruza `style.css` **y** `formas.js`, y fue el que lo
agarró. La regla queda escrita porque el error se cometió igual: alcanzó con
mirar una sola fuente y creerle.

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

La decisión vive en `sesion.js` y los timers de verdad los pone `main.js`. La alternativa —que `ui.js` mire la categoría al pintar el texto— pondría una decisión de estado en el módulo que sólo pinta.

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

### Las capacidades visuales se derivan de qué archivos existen

Es un patrón del proyecto y no una casualidad del loader. **Una pose puede o no puede hacer un gesto según qué recortes tenga en el disco, y eso se pregunta mirando la tabla de rutas, no una lista aparte que haya que mantener sincronizada a mano.**

| Si existe | La pose gana |
|---|---|
| `<pose>-ojos.webp` | parpadea, y cierra los ojos con la caricia |
| `<pose>-cabeza.webp` + su pivote | ladea la cabeza |
| `<pose>-brazo-izq/der.webp` + su pivote | mueve los brazos, se acomoda y saluda |
| `<pose>-cuerpo.webp` | y **además** puede hacerlo con el ángulo grande |

Ese último es el caso que lo muestra mejor. La capa que rota va encima del sprite entero, que sigue teniendo la parte dibujada, así que en el borde asoma la de abajo corrida: por eso sin `-cuerpo` el techo son 2°. `anguloDeBrazo()` en `ui.js` pregunta si la pose está en `RUTAS_CUERPO` y elige el ángulo. Cuando llegó `feliz-cuerpo.webp`, esa pose subió sola de 2° a 5° sin tocar una línea de código.

La regla general: **que la ausencia de un archivo degrade el gesto, nunca que lo rompa.** El sistema se vuelve predecible —se sabe qué va a pasar con arte a medio terminar— y la deuda de arte queda declarada en un solo lugar, que es la carpeta.

`ui.js` apaga el suavizado (`ctx.imageSmoothingEnabled = false`) apenas crea el contexto: el bilineal del navegador emborrona el pixel art al escalarlo. Es estado del contexto, no un parámetro de `drawImage`, así que se setea una sola vez y sobrevive a `clearRect`. **Cambiar el tamaño del canvas lo resetea a `true`** — si algún día el canvas deja de ser fijo, hay que volver a bajarlo.

Esa arista se cerró con el rediseño full-bleed: **el canvas mide 256, igual que los sprites**, así que el contexto 2D dibuja 1 a 1 y el escalado a pantalla lo hace el CSS con `image-rendering: pixelated`. Antes el canvas medía 320 y el ×1,25 dejaba uno de cada cuatro píxeles del doble de ancho.

---

## El fondo del galpón

Seis panorámicas de 1672×941 en `/sprites/`. No son sprites de estado — no entran en `RUTAS_SPRITES` ni pasan por el loader con fallback. `ui.js` escribe la ruta en `--fondo-actual`, la custom property que pinta la escena.

**Las rutas viven en la tabla que las manda, y en ninguna otra:** las cuatro de la rotación horaria en `FRANJAS_DIA`, pegadas a su tramo; las dos de clima en `CLIMAS`, pegadas a su evento. Hubo además un `RUTAS_FONDOS` con dos entradas de cuando el galpón tenía dos fondos, y sobrevivió a la llegada de las otras cuatro sin que nadie lo leyera: era la lista que los tests usaban como fuente de verdad, así que el guardián de rutas verificaba dos de seis. Es el mismo modo de falla que el del puente de custom properties, y ahora lo agarra el mismo tipo de test — ver *Toda constante tiene lector*.

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

`sesion.js` la resuelve con el mismo `reloj.mundo()` que la cadena, así el sprite y el fondo no pueden discrepar. El tick de 60 s evalúa **las dos cosas sin cortocircuito**: con la batería en `critico`, cruzar las 23:00 no cambia el sprite —`critico` le gana a `standby`— pero el galpón igual se tiene que hacer de noche.

La clase `es-noche` del `body` sale del mismo dato, para lo que cambia de ritmo y no de imagen: el latido de la antena y el polvo del haz.

### Contraste sobre la escena

La escena va a plena luz, así que **ningún texto se apoya directamente sobre ella**: cada pieza trae su propio fondo. Medido contra el píxel más claro de cada panorámica —el peor caso, en cualquier viewport:

| Texto | Sobre | Día | Noche |
|---|---|---|---|
| evento `#c9ced7` | `rgba(6,8,12,.72)` | 5.75:1 | 6.58:1 |
| etiqueta `#b8bec8` | `rgba(10,12,17,.93)` | 9.14:1 | 9.36:1 |
| número `#e6e6e6` | `rgba(10,12,17,.93)` | 13.69:1 | 14.01:1 |

Los tres pasan AA (4,5:1) con margen. Las teclas deshabilitadas quedan al 28% y no llegan: WCAG exime a los controles deshabilitados, y que se lean apagadas es justamente el punto.

### El cable no cambia de tono; el piso sí

Un caso que vale como método. Reporte: *"el cable casi no se ve con los climas"*. La lectura fácil es "poco contraste, subile el tono", y es la lectura equivocada. Medido en pantalla sobre el tramo lejano —el que sube a la toma, ya afinado— en los seis fondos, en valores de 0 a 255:

| fondo | piso | cable | cómo se lee |
|---|---|---|---|
| mediodía | ~190 | 49-57 | oscuro sobre claro |
| amanecer | ~130 | 49-57 | oscuro sobre claro |
| atardecer | 66 a 150 | 49-57 | oscuro sobre claro |
| noche | 17 a 28 | 43-50 | **claro** sobre oscuro, y se lee bien |
| tormenta | 24 a 37 | 48-51 | claro sobre oscuro, al límite |
| niebla | 29 a **47** | 42-47 | **se cruzan**: no hay nada que separar |

**El cable se pinta siempre del mismo gris.** Lo que cambia es el piso, y con la niebla sube justo hasta la banda donde el cable ya estaba: abajo del todo el cable queda *por debajo* del piso. No es un problema de grado, es un cruce.

Dos cosas salieron de tener la tabla y no la impresión:

- **La dirección.** Bajar el tono también separaría del piso de la niebla, y hundiría el cable en el de la noche. Sólo sirve subirlo, y por eso el test lo fija: `el cable del clima ACLARA, nunca oscurece`.
- **Qué NO tocar.** La noche mide 1,32 de contraste, más cerca de la tormenta (1,19) que de los tramos claros, y sin embargo se lee perfecto a tamaño real. Es la prueba de que el mecanismo alcanza y la referencia de cuánto hace falta — no una sexta cosa para arreglar. Los climas quedaron en 2,03 y 2,32.

El tono va en la tabla `CLIMAS`, al lado de `nube` y por el mismo motivo: es un dato del clima, y el tercero que aparezca trae el suyo. Lo escribe `pintarFondo` junto con el fondo, que es la función que sabe cuál está puesto, y cae en `CABLE` cuando no hay clima — sin eso, el cable se aclara en el primer clima de la sesión y se queda aclarado sobre el piso blanco del mediodía.

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
