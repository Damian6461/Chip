# SPEC — Chip

**Este es el único archivo de spec del proyecto.** Se sobrescribe entero en cada vuelta.
No se crean `spec-algo.md` nuevos: el historial de git ya guarda todas las versiones
anteriores con fecha y autor, y trece archivos de spec sueltos ya dejaron al dev sin saber
cuál manda.

Consolidado el 17/08/2026 a partir de `spec-mirada-y-carga.md`, `spec-peso-y-enojo.md`,
`spec-deploy-y-apertura.md` y `spec-botonera-pixel.md`. Los cuatro se borran con este
commit — ver la última sección.

**En producción está `a93a79e`.** Hay tres commits sin deployar: `8ea3368`, `4bac19d`,
`91e8965`.

---

# 0. BLOQUEANTE — `CACHE_VERSION`

**Va antes que todo lo demás, y el bump en sí va último.** Mientras no se suba, nada de
esta spec le llega a nadie que ya haya abierto Chip. Ni lo que ya está commiteado.

## Qué está mal

El blob de `sw.js` es el mismo archivo —
`19ce964c566ba97f7b1ca7a7b9053027cde834dd` — en estos cuatro commits:

| commit | hora | qué cambió |
|---|---|---|
| `a93a79e` | 12:54 | la antena (**esto es lo que hay en producción**) |
| `8ea3368` | 13:13 | el rayo y el enojo |
| `4bac19d` | 13:16 | el cuerpo sin orugas |
| `91e8965` | 13:22 | la sombra en dos manchas |

`CACHE_VERSION` es `chip-cache-v81` en los cuatro, mientras cambiaron `index.html`,
`style.css`, `js/config.js`, `js/ui.js` y `js/tema.js`.

El encabezado de `sw.js` ya lo dice: *"Subir CACHE_VERSION en CADA cambio de cualquier
archivo de ARCHIVOS_CACHE. Si no se sube, el usuario sigue viendo la versión vieja para
siempre."*

## Probado, no razonado

Servido en localhost con un perfil de navegador limpio:

1. Primera visita con los archivos de `a93a79e`. El SW toma control y cachea
   `chip-cache-v81`. La sombra de Chip computa **1** `radial-gradient`.
2. "Deploy": se reemplazan todos los archivos por los de `91e8965`, `sw.js` incluido.
   `cmp` confirma que `sw.js` es **idéntico**.
3. El usuario vuelve. Primera recarga: sigue **1** gradiente. Segunda recarga: sigue **1**.

El archivo nuevo tiene **2**. El usuario que vuelve corre el `style.css` viejo,
indefinidamente. El navegador no dispara el update porque compara los bytes de `sw.js` y
son los mismos.

## Qué hacer

Subir `CACHE_VERSION` a `'chip-cache-v82'`, **al final de todo lo que toque un archivo de
`ARCHIVOS_CACHE`**. Una sola vez, la última. Ojo que la fuente pixel del punto 4 también
entra a `ARCHIVOS_CACHE`.

## Cómo verificarlo

No alcanza recargar en tu navegador: ese caso ya funciona. Hay que reproducir el caso del
usuario que vuelve.

1. Perfil limpio o incógnito. Abrir Chip. Confirmar en DevTools → Application → Cache
   Storage que quedó `chip-cache-v81`.
2. Deployar.
3. **Sin borrar nada**, recargar dos veces.
4. `getComputedStyle(document.getElementById('sombra')).backgroundImage` tiene que
   devolver dos `radial-gradient`, y Cache Storage tiene que mostrar `chip-cache-v82` y
   **no** tener `chip-cache-v81`.

Si `v81` sigue ahí, el `activate` no está borrando las cachés viejas y eso es un segundo
bug.

## Y una pregunta que hay que contestar

Estos cuatro commits pasaron sin que nada avisara. Vale un test que falle cuando el árbol
de archivos cacheados cambia y `CACHE_VERSION` no. Es el único bug de esta spec que se
puede atrapar solo.

---

# 1. El objeto del piso: el caso de dos objetos

El bug principal ya está arreglado. Queda el caso que no se verificó:

> Si hay uno de evento y uno del piso, que levantar uno no afecte al otro.

Verificá el ciclo entero para los dos por separado: aparece al abrir → se toca → vuela →
**desaparece del piso** → queda en la repisa → no reaparece en la próxima visita.

Y un test que valga para siempre, no solo para este caso:

```js
new Set([...document.querySelectorAll('[id]')].map(e => e.id)).size
  === document.querySelectorAll('[id]').length
```

Ver el punto 6: hoy eso da `false`.

---

# 2. Cargar pasa a ser una acción por retención

**El cambio:** en vez de apretar y esperar 7 segundos, **mantenés apretado y Chip carga
mientras lo hagas.** Soltás y para, conservando lo cargado.

Hoy medido: un tap solo lleva la batería de 10,00 a **90,00 de golpe** y ahí se queda.

- **Posición: Cargar va a la derecha.** Es el gesto que se sostiene, y el pulgar derecho lo
  alcanza mejor ahí. Jugar y Limpiar se corren. Hoy Cargar está al 4,1% y Limpiar al
  66,67%.
- **Ritmo:** que llenar de 0 a 100 lleve unos 6-7 segundos de retención continua.
  Constante en `config.js`.
- **La pantalla del pecho muestra la carga en vivo:** las barritas se llenan de a una y el
  porcentaje sube mientras mantenés, no al final. Eso es lo que hace que el gesto tenga
  sentido — estás viendo el efecto de lo que hacés.
- **El cable y los pulsos** corren mientras dura la retención y paran al soltar.
- **Al soltar:** Chip pasa a `feliz` si la batería subió de verdad, con la lógica que ya
  está.
- Si la batería llega a 100 mientras mantenés, la acción termina sola y el botón se apaga.
- Jugar y Limpiar **siguen como están**, con su duración fija. No todo tiene que ser igual:
  cargar es un proceso, los otros dos son gestos.

**Ojo con el mismo problema del panel de debug:** este gesto es una retención, así que
necesita `touch-action`, `user-select: none` y `contextmenu` prevenido, o el navegador lo
cancela.

---

# 3. La botonera: es de otro juego

La botonera está bien construida y es del juego equivocado. Chip está dibujado a mano en
píxeles y hoy está apoyado sobre tres paneles renderizados con perspectiva, gradientes
metálicos y tipografía de sistema.

**Decisión de Damián: se resuelve por código, sin arte nuevo.**

## Lo que hay hoy, medido a 390 px de ancho

| qué | valor |
|---|---|
| `#acciones` | `perspective: 620px` |
| cada botón | `matrix3d(...)` que es un `rotateX(6°)` |
| variables | `--boton-inclinacion: 6deg`, `--boton-perspectiva: 620px`, `--boton-fuga-x: 138%`, `--boton-fuga-y: 55.26%` |
| esquinas | `border-radius: 3px`, con antialiasing |
| tipografía | **Arial 12px**. No hay ninguna fuente pixel en el proyecto |
| íconos | `<svg viewBox="0 0 24 24">` con trazos de ancho fraccionario |
| paleta propia | doce grises: `--boton-arriba #737a86`, `--boton-chapa #5e6672`, `--boton-bajo #3d434d`, `--boton-fondo #2b3039`, `--boton-filo #0f1217`, `--boton-brillo #aeb6c2`, `--boton-remache #20252c`, `--boton-texto #cdd3dd`, `--boton-mate #3a3f47`, `--boton-mate-bajo #262a31`, `--boton-mate-texto #7b828d` |
| naranja | `--boton-naranja: #c8781f` |

Y mirado al 3×: esquinas blandas, antialiasing gris en cada letra, trazos capilares que se
desarman.

## 3.1 Fuera la inclinación y la perspectiva

Sacar `perspective` de `#acciones` y el `rotateX` de los botones, con sus cuatro variables
y las entradas correspondientes en `BOTONERA` y `VARS_BOTONERA`.

**Esto es lo primero y lo más importante.** Inclinar algo en 3D obliga al navegador a
resamplear cada borde fuera de la grilla de píxeles: con la inclinación puesta, ningún
otro arreglo de acá se va a ver nítido.

Si hace falta que se lea apoyada en el piso y no pegada como una calcomanía, eso lo
resuelve la sombra que ya está — ver 3.6.

## 3.2 Esquinas duras

`border-radius: 0`.

Si el canto hace falta, se hace **escalonado a mano**: dos o tres píxeles enteros
recortados en cada esquina con `clip-path: polygon(...)` en unidades de píxel entero, no
en porcentaje. Un radio redondeado nunca cae en la grilla.

## 3.3 Colores planos, y de la paleta que ya existe

Fuera los doce grises propios. La botonera usa los tonos que la escena ya tiene
declarados: `--panel-chapa #2b313c`, `--panel-filo #0b0e13`, `--panel-hueco #12161d`,
`--panel-linea #5d6675`.

Un color por superficie: un relleno, un filo, y nada en el medio. Sin gradientes, sin
brillo, sin remaches.

El naranja tiene que ser **`#ffa300`**, el de la paleta cerrada, no `#c8781f`. Si sobre
este fondo quema, se le baja la opacidad —no se le inventa un tono— y se anota el número.

Los tres estados que hay hoy (normal, apretado, deshabilitado) se mantienen. El
deshabilitado puede ser el mismo relleno con el texto en `--panel-linea`.

## 3.4 Los íconos, como píxeles y no como trazos

Redibujar los tres (rayo, jugar, limpiar) sobre una grilla de **16 × 16 unidades**:

- `shape-rendering: crispEdges`
- ningún `stroke`: todo `<rect>` rellenos de 1 × 1 unidad o más
- `viewBox="0 0 16 16"` y el tamaño en pantalla un **múltiplo entero** de 16

Un ícono de 16 unidades escalado a 32 px se ve pixel art. A 30 px, no.

## 3.5 La tipografía: fuente pixel subseteada

**Decidido por Damián.** Fuera Arial. Fuente pixel, autohospedada y subseteada.

Las etiquetas son "Cargar", "Jugar" y "Limpiar". Los caracteres distintos son **diez**:
`C a r g J u L i m p`, más el espacio si alguna lo llevara. Un WOFF2 subseteado a eso pesa
unos pocos KB.

Requisitos, ninguno opcional:

- **Autohospedada, en el repo.** No se carga de un CDN: Chip funciona offline y una fuente
  remota rompe eso.
- **Agregada a `ARCHIVOS_CACHE` en `sw.js`.** Si no está, la primera apertura offline cae
  al fallback y las etiquetas cambian de forma. Y agregarla **obliga a subir
  `CACHE_VERSION`** — ver el punto 0.
- **Renderizada a su tamaño nativo o a un múltiplo entero.** Una fuente diseñada a 8 px se
  ve nítida a 8, 16 o 24. A 12 o a 18 vuelve el antialiasing. Tamaño en `px` enteros, nunca
  `em`, `rem` ni `%`.
- **`font-display: block`**, no `swap`. Con `swap` se ve un frame en la fuente de fallback y
  las etiquetas saltan de forma al llegar la buena — justo el parpadeo que el punto 5 está
  sacando.
- **Licencia permisiva y anotada**, con el archivo de licencia al lado de la fuente.

Sugerencia no obligatoria: **Silkscreen** (SIL OFL) está diseñada a 8 px, es angosta y
limpia, y a 16 px entra bien en un botón de teléfono. El único requisito real es que esté
diseñada en píxeles y tenga tamaño nativo declarado.

**No** usar una fuente de aspecto pixelado que en realidad sea vectorial suave, ni forzar
una sans con `-webkit-font-smoothing: none` — eso no funciona parejo y en Android no hace
nada.

## 3.6 La sombra se queda

`#btn-cargar::before` tiene un `radial-gradient` de 85,1 px sobre un botón de ~117 px, o
sea el 73% del ancho. **Eso está bien y no se toca**: es lo que pidió la spec de sombras
—degradé radial, más chica que el objeto— y es lo único de la botonera que tiene que ser
suave, porque una sombra real lo es.

## 3.7 Píxeles enteros

Los tres anchos y las separaciones tienen que dar un número **entero de píxeles**. Un
botón de 30% sobre 390 px son 117; sobre 393 son 117,9, y ese decimal es medio píxel de
borde borroso en todos los cantos. El ancho sale de una unidad base entera, no de un
porcentaje.

## Cómo verificarlo

**Mirándolo, siempre.** Esta parte es entera sobre cómo se ve: ninguna medición de
`getComputedStyle` alcanza para aprobarla.

1. Captura **a tamaño real** en un ancho de teléfono, y otra al 3× o 4× para los cantos.
   Las dos, porque el zoom miente en las dos direcciones.
2. En la ampliada: cada borde tiene que ser una transición de un píxel entre dos colores.
   Si hay un píxel intermedio, hay antialiasing y algo quedó fuera de la grilla.
3. La captura de la botonera **al lado de un recorte de Chip al mismo aumento**. Si se leen
   del mismo dibujo, está.
4. Los tres estados de los tres botones. Nueve capturas.
5. Confirmar que `#btn-jugar` sigue como hoy: `disabled` en `false`, `aria-disabled` en
   `true` cuando no hay nada que jugar, y el click sin efecto. **Eso está bien hecho y es
   fácil de romper sin darse cuenta al reescribir los estados.**

**No agregarle rasgos al arte que el ilustrador no dibujó.** La botonera es interfaz y
tiene más libertad que Chip, pero la libertad es de forma, no de lenguaje. Sin remaches,
sin tornillos, sin chapa. Plano, duro y de la paleta.

---

# 4. La apertura sin parpadeo

*Ojo con el nombre: esto no es el velo de entrada ni su fundido. Es el parpadeo antes del
primer pintado.*

## Qué está mal

`document.head.querySelectorAll('style').length` es **0**. La única hoja es el
`<link rel="stylesheet" href="style.css">`, que bloquea el primer pintado. `style.css` son
174 KB. En un teléfono con red mala, eso es el tiempo que el usuario mira una pantalla que
no es Chip.

Y tres valores para el mismo color:

- `<meta name="theme-color" content="#181b1f">`
- el `body` computa `rgb(5, 7, 10)`, o sea `#05070a`
- `#apertura` computa `rgb(24, 27, 31)`, o sea `#181b1f`

El `<html>` no tiene fondo propio: computa `rgba(0, 0, 0, 0)`.

## Qué hacer

En `index.html`, dentro del `<head>` y **antes** del `<link>`:

```html
<style>html,body{background:#05070a;margin:0}</style>
```

Va en el `<html>` además del `body`: el fondo del canvas del navegador lo propaga el
`html`, y hoy no lo tiene.

Y decidir **un** color. Si el fondo de la escena es `#05070a`, `theme-color` y `#apertura`
también. Si el que vale es `#181b1f`, al revés. Pero uno.

Ese color es el único número que se duplica entre `index.html` y `style.css`: anotarlo en
los dos lados como atados, porque es la clase de par que se desincroniza en silencio.

## Cómo verificarlo

**Mirándolo.** DevTools → Network → throttling en "Slow 4G", perfil limpio, grabar la
carga. En los frames de la película no tiene que aparecer ningún frame blanco ni de otro
color entre la pantalla anterior y la escena.

Medir el `<style>` con `querySelectorAll` confirma que está, no que se ve bien.

---

# 5. El ID duplicado `repisa-caida`

Hay **dos** `<linearGradient id="repisa-caida">` en el mismo documento: uno dentro de
`#repisa` y otro dentro de `#repisa-1`, los dos con los mismos stops (`0%` con
`stop-opacity 0.72`, `100%` con `0`). Y hay **2** referencias por `fill`.

`url(#repisa-caida)` resuelve **solo al primero**: el segundo estante pinta con el
gradiente del primero.

Hoy no se ve porque el contenido es idéntico. El día que uno necesite otro valor, el
cambio no va a tener efecto y no va a haber error en ninguna parte.

**Qué hacer:** el `id` del gradiente sale del mismo lugar que el `id` del estante. Si el
estante es `repisa-1`, su gradiente es `repisa-1-caida`, y la referencia del `fill` se arma
con el mismo dato, no con una constante escrita a mano. Renombrar el segundo a mano no
sirve: el bug vuelve con el tercer estante.

**Verificación:** con los dos estantes visibles,
`document.querySelectorAll('[id="repisa-caida"]').length` tiene que dar **0**, y el test de
IDs únicos del punto 1 tiene que dar `true`.

---

# 6. Que Chip parezca atento

**Lo que hace que un personaje se sienta atento no es que te mire: es que dejó de mirar
otra cosa para mirarte.** La atención es un cambio de estado, no un estado. Un Chip que
mira siempre a la cámara es un póster; uno que estaba mirando la ventana y se da vuelta
cuando llegás, está vivo.

Hacen falta las dos mitades: **una mirada que vaga, y una mirada que vuelve.**

## Lo que se puede hacer ya, sin arte nuevo

**a) La reacción de llegada.** Cuando la app termina de abrir, después del fundido: la
cabeza hace una inclinación corta y vuelve al centro, el bulbo pulsa una vez más fuerte, y
la respiración se acelera apenas por un segundo. La lectura es "levantó la vista porque
entraste". Es lo más barato y lo más efectivo.

**b) Que la reacción escale con la ausencia.** El dato de días de presencia ya está. Si
volviste a los cinco minutos, casi nada. Si volviste después de tres días, la reacción es
más marcada: dos inclinaciones, el bulbo más brillante, los brazos se acomodan. Nada de
culpa ni de reproche — es alegría proporcional.

**c) Que la mirada se vaya cuando no pasa nada.** Si no tocás nada por 40-60 segundos, la
cabeza se inclina hacia la ventana y **se queda ahí**, en vez de volver. Chip se distrajo.
Y en cuanto tocás la pantalla, vuelve al centro. Ese ida y vuelta es lo que hace que
"volver" signifique algo.

## El paso siguiente, con arte

**Las pupilas que se mueven.** Es lo que realmente vende la atención, y necesita separar la
pupila del aro.

Hay un camino que quizás no necesita recorte nuevo: debajo de `#ojos` hay una capa de color
plano con la forma de los ojos, siempre pintada. Si `#ojos` se traslada 2-3 px, en un lado
asomaría esa capa plana — que es exactamente cómo se ve un ojo moviéndose dentro de su
cuenca.

**Probalo antes de pedir arte:** trasladá `#ojos` 3 px a un lado y **mirá la captura a
4×**. Si se lee como una mirada que se mueve, hay pupilas gratis. Si se ve como la capa de
ojos despegada, hace falta un recorte y se pide.

Si funciona: la mirada vaga lento en reposo, vuelve al centro cuando llegás o cuando
tocás, y durante la caricia sigue el dedo.

**Ojo con el instrumento:** medir los 40-60 segundos con la pestaña en segundo plano no
sirve. Chrome congela `requestAnimationFrame` y throttlea los timers cuando la pestaña no
está visible.

---

# 7. El sonido no vuelve a sonar al reabrir

Funciona la primera vez, después de tocar algo. Pero si salís de la app y volvés a entrar,
no suena más, aunque el ajuste siga en "activado".

**Dos escenarios distintos, y conviene distinguirlos antes de arreglar:**

**a) La app pasa a segundo plano y vuelve.** Acá el audio debería retomar solo. El
sospechoso es el handler de `visibilitychange`: pausa al ocultarse, pero al volver puede
que no llame a `play()`, o que el `AudioContext` haya quedado en `suspended` y falte un
`resume()`. Chequeá el `state` del contexto al volver a ser visible y resumilo
explícitamente.

**b) La app se cierra del todo y se abre de nuevo.** Acá el navegador **exige un gesto
nuevo del usuario** antes de permitir audio. Eso no se puede saltear, y está bien que sea
así.

**Lo que sí corresponde hacer:** que el ajuste siga guardado en "activado", y que **el
audio arranque solo con el primer toque de la sesión, sea cual sea** — tocar a Chip,
apretar un botón, abrir el menú, cualquier cosa. El usuario no tiene que ir a buscar el
toggle otra vez ni enterarse de que hubo un problema.

O sea: un listener de `pointerdown` de una sola vez sobre el documento que, si el ajuste
está activado y el audio no suena, lo arranca y se desregistra.

**Verificación:** con el sonido activado, cerrar la PWA por completo, abrirla, y tocar
cualquier cosa — el ambiente tiene que empezar a sonar sin tocar el ajuste. **Lo prueba
Damián en el teléfono**, porque el audio de una PWA instalada no se reproduce bien en el
navegador de escritorio.

---

# 8. Las orugas levantan polvo

Extender lo que se hizo con el arco de luz en los aros: que las orugas **delaten
movimiento levantando polvo**.

**Cuándo:** solo cuando las orugas están girando, o sea en el cuarto de vuelta de una
acción y en el mecerse de `jugando`. En reposo no hay polvo.

**Cómo:**

- **Dos o tres motas por oruga**, no más. Nacen en el punto de contacto con el piso, salen
  hacia atrás y afuera, suben poco y se disuelven. Ciclo corto, 600-900 ms.
- **Del color del piso**, no blancas ni cian. El tono del suelo de la panorámica; el polvo
  es piso levantado.
- **Muy tenues**, opacidad máxima 0,25-0,3. Es un detalle que se nota sin mirarlo; si se ve
  claramente, está de más.
- **Desfasadas entre las dos orugas**, para que no salgan en espejo.
- Reusá el sistema de motas del ambiente si sirve, pero **con su propio ciclo** — estas
  responden a una acción, no al aire.

Es lo mismo que el arco de luz: en vez de mover una pieza que no puede moverse, **contás el
movimiento por lo que produce**.

Necesita `sprites/idle-cuerpo-sin-orugas.png` cableado, que ya está en el repo y hoy hace
fallar un test de assets justamente por estar sin usar.

---

# 9. El botón de debug sigue sin funcionar en el teléfono

Damián sigue sin poder abrirlo, después de dos intentos. **Cambiá el enfoque en vez de
seguir ajustando el mismo gesto.**

La opción más robusta: **cinco toques rápidos en una esquina fija de la escena** (la
superior izquierda, que está vacía). Un tap corto no compite con ningún comportamiento
nativo del navegador, así que no hay nada que lo cancele.

Si preferís otra, elegila vos — pero que **no sea una retención**, porque ese camino ya
falló dos veces.

---

# 10. Las luces de las orejas — última, y con una condición

Los rectángulos naranjas del costado de la cabeza tienen LEDs cian pintados. La idea es
hacerlos vivir. Hoy no hay ningún elemento en el DOM para esto.

**Pero cuidado:** ya late el bulbo, ya late el rayo, ya laten los tres LED de los botones.
Sumar otra cosa que parpadea corre dos riesgos: que Chip se vea como un arbolito, y que
ninguna luz signifique nada porque todas hacen lo mismo.

**Así que tienen que tener una función propia, distinta de las demás: son el indicador de
"pasó algo".**

- **Apagadas la mayor parte del tiempo.** Ese es el punto.
- **Se encienden cuando hay algo nuevo que ver:** un evento del día sin leer, un objeto
  encontrado y no guardado, un objeto esperando en el piso.
- **El patrón: un barrido corto, no un parpadeo.** Los LEDs están apilados, así que se
  encienden en secuencia de abajo hacia arriba y se apagan — como un indicador de
  actividad. Cada 4-6 segundos, breve.
- **Se apagan cuando el jugador vio lo que había:** abrió el menú, levantó el objeto, leyó
  el evento.

Si al implementarlo se ve ruidoso junto con el resto de las luces, **reportalo y se saca**.
Es la menos importante de todas.

---

# 11. Los íconos — AGREGADO 17/08, después del primer commit

**Los tres archivos ya están en `C:\Chip\icons`, sin commitear.** Solo hay que
commitearlos y hacer lo del generador.

## Qué se cambió y por qué

Los íconos que estaban eran **un archivo congelado**: se generaron una vez, el arte
cambió y ellos no. Tenían otro encuadre — Chip chiquito adentro de una escena ancha, que
a 192 px en una pantalla de inicio no se lee.

Los nuevos salen de `icons/generador.html`, que lee el encuadre de `ICONOS` en
`config.js`, así que ya no se pueden separar del arte.

| archivo | antes | ahora |
|---|---|---|
| `icon-192.png` | 19.923 | 24.232 |
| `icon-512.png` | 98.544 | 94.926 |
| `icon-512-maskable.png` | 87.931 | 103.314 |
| **total** | **202 KB** | **217 KB** |

Guardados con paleta de 256 colores **y dithering**. Verificado: `paletteBitDepth: 8`,
192×192 y 512×512, y el círculo punteado de la zona segura **no** quedó horneado en el
maskable — es solo de la previsualización.

## El bandeo: no se pudo reproducir

El comentario de `generador.html` culpa a la indexación a 256 colores por el bandeo de la
splash de Android. Comparé el mismo origen a 256 colores con dither y sin dither,
ampliado sobre el cielo, y **no hay diferencia visible**. Se dejó el dither igual porque
cuesta poco y es lo que corresponde contra el bandeo.

Lo único que no se pudo probar es la splash de Android. **Lo mira Damián en el teléfono**
después de deployar.

## LA TRAMPA DEL GENERADOR — esto sí hay que arreglar

Los tres PNG tal como los **baja el navegador** pesan **806 KB**, contra los 202 KB que
había. `canvas.toDataURL('image/png')` es un mal compresor: escribe RGBA sin paleta y con
compresión floja.

O sea que el flujo que la propia página indica —"Movelos a `/icons/` pisando los que ya
están"— **cuadruplica el peso de los íconos sin que nada avise.** Sobre una instalación
de ~1,6 MB, los íconos pasarían a ser la mitad.

Medido:

| | peso |
|---|---|
| lo que baja el navegador | 806 KB |
| RGBA bien comprimido, sin paleta | 799 KB |
| paleta 256 con dither ← **lo que se guardó** | 217 KB |
| paleta 256 sin dither | 195 KB |

Dos cosas:

1. **Un test que falle si algún PNG de `icons/` supera un techo** — 260 KB entre los tres
   deja margen y atrapa el caso. Es el mismo tipo de guardia que el de `CACHE_VERSION`: el
   error es invisible y el test es la única forma de que avise.
2. **Un aviso en `generador.html`**, arriba, diciendo que lo que baja el navegador está sin
   comprimir y hay que pasarlo por un compresor de PNG antes de moverlo a `icons/`. Y si
   se puede, que la página misma lo diga con el peso al lado de cada botón.

## Y una nota sobre el `file://`

`generador.html` no funciona abriéndolo con doble clic: usa
`<script type="module">` con `import { ICONOS } from '../js/config.js'`, y los módulos ES
están bloqueados sobre `file://`. Hay que servirlo por HTTP. Vale ponerlo en el texto de
la página, porque el próximo que la abra va a ver un cartel vacío igual que Damián.

---

# 12. Los ojos de la caricia no caen sobre los de idle

Damián lo reportó: *"los ojos últimos que pusimos, hay escenas que no están bien
cuadrados"*, en la caricia, y pasa **tanto en idle como en feliz**.

Verificado, y **el ajuste que ya existe no está roto**: `AJUSTE_OJOS` se aplica bien —vía
las propiedades independientes `scale` y `translate`, no `transform`— y la caja del par
entero cae sobre la de idle con 1 a 3 px de error. Eso funciona.

El problema es que **la caja del par no es la unidad correcta**. Medido ojo por ojo,
cortando cada recorte por el hueco que separa los dos:

| recorte | ojo izquierdo | ojo derecho | desnivel |
|---|---|---|---|
| `idle-ojos` | centro (85,5 · 97) 56×59 | centro (152 · 97) 55×59 | **0,0 px** |
| `idle-ojos-contento` | centro (82,5 · 107) 48×53 | centro (140 · 101,5) 51×54 | **−5,5 px** |
| `idle-ojos-cerrado` | centro (79,5 · 116) 48×51 | centro (137,5 · 119,5) 52×52 | **+3,5 px** |

Tres cosas salen de ahí:

1. **En idle los dos ojos están perfectamente a nivel.** En los dos gestos no, y el
   desnivel **cambia de signo**: contento inclina para un lado y cerrado para el otro. O
   sea que durante la caricia la cara se bambolea.
2. **Los dos gestos están bajos.** Contento 4,5 y 10 px por debajo de idle, cerrado 19 y
   22,5. Sobre el lienzo de 256, que en pantalla son ~371 px: hasta **33 px de caída**
   para cerrado. Eso es lo que se ve como el arco pegado abajo del hueco crema.
3. **Cada ojo necesita una escala distinta.** El izquierdo pide 1,167 y el derecho 1,078
   en contento. Con un solo `scale` de capa —hoy 1,151— el izquierdo queda bien y el
   derecho sale ~7% grande.

Un solo `scale` y un solo `translate` por capa no pueden satisfacer dos ojos que
necesitan cosas distintas. Por eso el ajuste actual, aunque esté bien calculado, no puede
cuadrar esto.

## Se resuelve por código, no con arte nueva

Cada recorte tiene un **hueco limpio de columnas vacías** entre los dos ojos:
`idle` en 114-124, `contento` en 107-114, `cerrado` en 104-111. Así que cada gesto se
puede partir en **dos capas independientes** por ese hueco, y darle a cada ojo su propia
escala y su propio corrimiento.

Los números, ya medidos, en px del lienzo de 256:

| | escala | mover x | mover y |
|---|---|---|---|
| contento izquierdo | 1,167 | +3,0 | −10,0 |
| contento derecho | 1,078 | +12,0 | −4,5 |
| cerrado izquierdo | 1,167 | +6,0 | −19,0 |
| cerrado derecho | 1,058 | +14,5 | −22,5 |

**El objetivo es que cada ojo caiga sobre el ojo de idle que le corresponde**: izquierdo
en (85,5 · 97) con 56×59, derecho en (152 · 97) con 55×59.

Ojo con el orden: las propiedades independientes de CSS aplican **`translate` primero y
`scale` después**, al revés de lo que dice el comentario de `AJUSTE_OJOS` en
`config.js`. Los números de hoy están calculados para el orden real de CSS y dan bien; los
de arriba también hay que expresarlos para ese orden. **Corregir el comentario**, que dice
lo contrario y va a hacer tropezar al próximo.

Esto reemplaza la nota vieja de "no se toca porque sería editarle el arte al ilustrador":
partir por el hueco y mover cada mitad **no toca el dibujo**, sólo lo coloca.

## Cómo verificarlo

Mirándolo. Capturar la cabeza en los tres momentos —reposo, contento, cerrado— y ponerlos
uno al lado del otro al mismo aumento. Los dos arcos tienen que quedar a la misma altura
entre sí, y a la altura donde estaban las pupilas en reposo. Hoy quedan abajo y torcidos.

Y hacer la caricia **sin `?debug=1`** — ver el punto 13.

---

# 13. El panel de debug tapa a Chip

Encontrado mientras probaba la caricia: mis toques no llegaban a Chip.

El panel que crea `?debug=1` es un **`div` sin `id` y sin clase**, con
`position: fixed` y `z-index: 9999`. A 390 px de ancho ocupa de x=172 a x=382 y de y=8 a
y=587 — o sea **la mitad derecha de la pantalla, encima de Chip**, con
`pointer-events: auto`.

En un teléfono, `?debug=1` deja media escena sin poder tocar. Y como el panel no tiene
`id` ni clase, tampoco hay forma de apuntarle desde un test.

**Qué hacer:** darle un `id`, y que en pantallas angostas no se superponga con la escena
—que sea un panel plegable, o que ocupe el ancho completo abajo, o que arranque cerrado.
Va junto con el punto 9, que es el otro problema del debug en el teléfono.

---

# 14. El párpado tiene que volver al crema

Damián: *"yo le dije el parpadeo sea gris hace tiempo, quedó malísimo, hay que volver al
color crema que tienen los ojos"*.

Hoy `COLOR_PARPADO = '#676c77'` en `config.js`, que es el gris de la chapa de la cabeza.

**El crema es `#ffc899`.** Está medido sobre `sprites/idle-ojos.webp`, descartando la
pupila: es el tono dominante de la cuenca. Y no es un color nuevo — **es el durazno de la
paleta cerrada del proyecto**, el mismo que ya está declarado.

Cambiar `COLOR_PARPADO` a `#ffc899` y actualizar el comentario, que hoy justifica el gris
diciendo que sale de la chapa de la cabeza.

**Verificación, mirándolo:** el párpado se ve cuando `#ojos` se achata o se corre. Con el
crema, un ojo entrecerrado tiene que leerse como un párpado de la misma cuenca; con el
gris se leía como un agujero en la cara.

---

# Lo que NO hay que tocar

Estas cinco cosas se reportaron como bugs y **estaban bien**. Van acá para que nadie las
"arregle":

| lo que se reportó | la verdad |
|---|---|
| Las variables de la antena no están definidas, la inercia está muerta | Están las nueve. El pivote computa en la base del poste (`185.68px 69.44px`). La inercia corre: sale atrás a −1,29°, pico +1,95° (= sobrepaso 0,65 × 3°), asienta en 1,2° (= extra 0,4), rebota 1,8 y −0,75. Despegue máximo **0,96 px** contra 3,33 de tolerancia |
| El vaivén de reposo no mueve nada | Barre **−0,7° a +0,7°**, 716 valores distintos en 12 s. Se midió `transform`, y los keyframes usan la propiedad independiente **`rotate`** |
| Los objetos del piso no tienen sombra | `::after` con `radial-gradient(0.6 → 0 al 68%)`, 22,3 px contra 36 px de objeto |
| La caja no tiene sombra | Dos elipses `var(--toma-sombra)` dentro del SVG: rx 18 al 0,3 y rx 12,5 al 0,55, la chica más densa. Cumple "más densa en el contacto" |
| `#btn-jugar` se contradice: `aria-disabled` true con `disabled` false | Es el patrón correcto y bien hecho: enfocable, anunciado no disponible, y el click sin efecto |

Lo único menor que queda de la caja: sus dos elipses son de opacidad plana y no un degradé
radial como las otras cuatro superficies. Decide Damián si vale unificarlo.

**Sin resolver:** si la sombra de dos manchas de `91e8965` realmente se ve. El perfil de
gris a lo ancho del contacto da 79 en la vieja y 85 en la nueva, sobre un piso de ~170:
seis niveles sobre 255, y no se pudo distinguir mirándolas. Hace falta medir a resolución
completa. No es una objeción al commit — es que no consta.

---

# Limpieza de archivos, en este mismo commit

El repo tiene **19 `.md`**, 230 KB de prosa contra 693 KB de código. Trece eran specs y
once ya estaban implementadas.

**Se borran (su contenido está en el código, en `EL-PORQUE.md`, o consolidado acá):**

```
spec-mirada-y-carga.md      spec-peso-y-enojo.md
spec-deploy-y-apertura.md   spec-botonera-pixel.md
spec-apertura-y-cabeza.md   spec-brazos.md
spec-cable-definitiva.md    spec-cable-y-botones.md
spec-climas.md              spec-feliz-reaccion.md
spec-feliz-y-ajustes.md     spec-hitbox-y-caricia.md
spec-tanda-objetos.md
objetos-28.md               ← los 36 objetos están en js/datos-objetos.js
plan-loop.md                ← plan de ejecución, terminado
loop-brief.md               ← sus decisiones son las reglas cerradas del traspaso
```

**Se quedan:**

- `SPEC.md` — este, el único que se sobrescribe
- `EL-PORQUE.md` y `README.md` — el "por qué" y la documentación
- `TRASPASO.md`
- `eventos-brief.md` — **no es una spec terminada, es la guía de tono** para escribir
  eventos nuevos. Sigue viva
- `investigacion-loop.md` — es la **evidencia** detrás de las reglas sagradas del modelo
  sin culpa. No es un plan: es por qué el plan es así. Si se borra, la próxima vez que
  alguien proponga un sistema de energía no va a haber con qué contestarle

Nada de lo borrado se pierde: está todo en el historial de git, con fecha y autor.

---

# Reglas de siempre

- **Un valor no se verifica con el instrumento que lo generó.**
- **Probalo viéndolo también, siempre.** Ninguna medición de `getComputedStyle` reemplaza
  mirar la cosa, a tamaño real **y** ampliada. El zoom miente en las dos direcciones.
- La pestaña en segundo plano congela `requestAnimationFrame` y throttlea los timers.
- Borrar el service worker y las cachés **no alcanza**: los `import` de módulos ES van sin
  query, así que vienen de la caché HTTP y se puede terminar leyendo el source nuevo
  mientras corre el código viejo.
- `transform` y `rotate` son dos propiedades distintas. Keyframes que animan `rotate:` no
  aparecen en `getComputedStyle(el).transform`.
- El shorthand `animation` pisa los delays de `:nth-child` por especificidad.
- `elemento.hidden = true` no esconde nada por sí solo: un `display` de autor le gana.
- Nada de cooldowns, timers punitivos, FOMO ni energía.
- Paleta: cian / naranja `#ffa300` / durazno `#ffc899`. Nada afuera.
- No se agregan rasgos al arte que el ilustrador no dibujó.
