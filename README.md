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

51 pruebas, mismos archivos en dos entrypoints:

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

*Arista conocida: la lectura de stats del panel se refresca con los controles del panel, no con los botones del juego. Las barras del juego sí.*

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

Dos panorámicas de 1672×941 en `/sprites/`: `fondo-dia.png` y `fondo-noche.png`. No son sprites de estado — no entran en `RUTAS_SPRITES` ni pasan por el loader con fallback. Las rutas viven en `RUTAS_FONDOS` (`config.js`) y las aplica `ui.js` como `background-image` de `#panel-juego`.

### El encuadre

```
background-size: auto 100%;      /* la panorámica se escala a la altura del panel */
background-position-x: 18.3%;    /* FONDO_POSICION_X */
```

El encuadre buscado es entrar **8% dentro de la panorámica** desde su borde izquierdo. El valor CSS no es 8% porque `background-position` en porcentaje no mide lo que parece: no es "8% del ancho de la imagen", es 8% del **sobrante** entre la imagen escalada y el panel. Escalada a 320 de alto, la panorámica mide 569 px de ancho contra un panel de 320: sobran 249. Entrar 8% en la imagen son 45,5 px, y 45,5 sobre 249 dan **18,3%**.

Con eso la ventana del galpón cae en el tercio izquierdo del panel y detrás de Chip queda la pared lisa del portón. Con `8%` literal el cuadro empezaba 20 px antes: entraban los caños y el aparatito de la punta izquierda, y la ventana se le iba atrás a Chip.

### Día y noche

El swap usa `esDeNoche()` de `sprites.js`, que es **la misma franja que el standby** (23 a 7): si Chip duerme, afuera es de noche. No es una regla paralela, es la misma función — hay una prueba que lo verifica en los cuatro bordes.

`main.js` la resuelve con el mismo `relojEfectivo()` que la cadena, así el sprite y el fondo no pueden discrepar. El tick de 60 s evalúa **las dos cosas sin cortocircuito**: con la batería en `critico`, cruzar las 23:00 no cambia el sprite —`critico` le gana a `standby`— pero el galpón igual se tiene que hacer de noche.

### Por qué el panel no recorta

`#panel-juego` **no** lleva `overflow: hidden`. La imagen de fondo se recorta sola contra el `border-radius`, y recortar el panel entero le cortaría la cabeza a Chip: el sprite de `jugando` tiene 1,3 px de margen transparente arriba y el salto de acción sube 8 px. Chip saliéndose un instante del cuadro es la opción buena; la antena cortada no.

El marco (borde, radio, color) pasó del canvas al panel. **El canvas ya no puede tener color de fondo propio** o taparía la panorámica.

### Peso

Los dos fondos son PNG-8 cuantizados, bajo 500 KB cada uno. **No son pixel art de paleta corta**: el original de día tiene 59.685 colores únicos y el de noche 26.103, así que la cuantización es con pérdida y hay que elegirla mirando.

| Archivo | Antes | Ahora | Paleta | Dither |
|---|---|---|---|---|
| `fondo-dia.png` | 1620 KB | 464 KB | 101 colores | no |
| `fondo-noche.png` | 1467 KB | 411 KB | 48 colores | sí |

El dither va por imagen y no por gusto: en el día el piso queda limpio sin él y el dither le mete grano visible; en la noche, sin dither el farol de la pared hace anillos concéntricos en la caída de luz. A 256 colores no bandea ninguna de las dos, pero pesan 765 KB y 946 KB — fuera de presupuesto.

---

## Animaciones de vida

| Qué | Dónde | Duración |
|---|---|---|
| rebote permanente, `0` → `-4px` | `#contenedor-mascota` | `CICLO_REBOTE_MS` — 2.2 s, loop |
| salto de acción, `0` → `-8px` → `0` | `#canvas-mascota.saltando` | `DURACION_SALTO_MS` — 300 ms, una vez |
| barra viajando al valor nuevo | `.barra-fill` | `TRANSICION_BARRA_MS` — 400 ms |

El rebote corre siempre, en todos los estados, sin que el jugador toque nada.

**Las duraciones viven en `config.js`, no en el CSS.** Una hoja de estilos no puede importar un módulo, así que `ui.js` las inyecta como custom properties en `:root` al arrancar (`VARS_ANIMACION`) y `style.css` las lee con `var()`. Duplicarlas en el CSS habría sido un cuarto carve-out de la regla de `config.js`, y este no hacía falta. Sin JS las `var()` no resuelven, la declaración de `animation` queda inválida y no hay movimiento: el juego funciona igual.

**2.2 s y no 2, a propósito.** `DEBOUNCE_VISUAL_MS` y `DURACION_ESTADO_ACCION_MS` valen 2 s los dos: un ciclo del mismo largo quedaría en fase con ellos y el cambio de sprite caería siempre en el mismo punto del rebote.

**El rebote va en el contenedor y el salto en el canvas de adentro.** Dos animaciones sobre el mismo elemento no se suman: para la propiedad que las dos tocan (`transform`) gana la última declarada, así que el salto se comería el rebote mientras dura. Anidados, los dos transforms se componen solos. Para eso existe `#contenedor-mascota` en `index.html` — es un elemento que está sólo para animar.

`main.js` llama a `animarAccion()` dentro de `ejecutar()`, **después** del early return: si la acción no se aplicó —jugar sin batería—, no hay salto.

### prefers-reduced-motion

Un bloque al final de `style.css` apaga las tres. No es opcional y no tiene interruptor propio: quién puede moverse lo decide el CSS. `ui.js` pone la clase del salto igual, y con reduced-motion la clase no hace nada.

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
