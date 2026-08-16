# Chip — el porqué

Este archivo es el registro de decisiones y hallazgos: **por qué** el código es
como es, qué se probó y se descartó, y qué bugs costó encontrar.

Está separado del README a propósito. El README contesta "cómo trabajo mañana":
cómo correrlo, qué contratos no se rompen, dónde están los bordes filosos. Esto
contesta "por qué no lo cambio a lo obvio", que es una pregunta distinta y que
se hace mucho menos seguido. Juntos pasaban los 60 KB — más que cualquier
módulo del proyecto— y eso hacía que no se leyera ninguno de los dos.

La regla para agregar acá: si algo se descubrió mirando o midiendo, y volver a
descubrirlo costaría lo mismo, va acá con su evidencia. Si es un contrato que
hay que respetar, va al README.

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

### Los cuatro momentos del día

El galpón tenía día y noche. Ahora tiene cuatro panorámicas con la misma composición y la misma ventana, y el degradé del piso pasó de simular el recorrido de la luz a hacer lo que un dibujo fijo no puede: moverse **dentro** del tramo.

| tramo | horas | archivo | cielo |
|---|---|---|---|
| amanecer | 7-11 | `fondo-amanecer.webp` | lila, luz fría y baja |
| mediodía | 11-17 | `fondo-mediodia.webp` | azul, luz blanca y alta |
| atardecer | 17-23 | `fondo-dia.webp` | dorado, luz larga |
| noche | 23-7 | `fondo-noche.webp` | estrellas |

**El corte de la noche no es un número nuevo:** son `HORA_STANDBY_INICIO` y `HORA_STANDBY_FIN`, los mismos que deciden el standby. La invariante de siempre —si Chip duerme, afuera es de noche— queda garantizada por construcción y no por dos tablas que hay que acordarse de mantener iguales.

**Ojo con los nombres de archivo:** `fondo-dia.webp` **es el atardecer**. Mantiene el nombre viejo para no romper referencias. Se verificó mirando las cuatro, no leyendo los nombres.

**La luz se interpola adentro del tramo.** Cada franja declara dónde arranca su charco; el destino es el arranque de la siguiente, y `luzDelMomento()` interpola posición, radio, color y fuerza según lo que se corrió la hora — con minutos, no con la hora entera, o daría cuatro saltos por tramo. Al final del atardecer la luz ya viaja hacia la fuerza 0 de la noche y llega apagada al cambio de fondo.

**De noche no hay charco:** la fuerza se queda en 0 en vez de interpolar hacia el amanecer. Sin eso, a las 6:59 el piso tenía un charco lila al 0,26 con el galpón nocturno de fondo — la luna no entra por esa ventana. La posición sí sigue interpolando, para que al llegar el amanecer el charco aparezca donde corresponde en vez de viajar desde el borde.

#### Las dos transiciones

**Tramos con transición, no crossfade continuo.** Mezclar los dos fondos vecinos según la hora exacta obliga a tener dos imágenes superpuestas en memoria todo el tiempo, y no vale lo que aporta.

- **Al cruzar con la app abierta:** disolvencia de 2,6 s. La panorámica que SE VA se desvanece **encima** de la nueva; al revés, el galpón se oscurecería un instante en el medio porque las dos son opacas.
- **Al abrir:** si el tramo cambió desde la última visita, fade de 1,5 s desde el anterior. Es la parte que más importa —casi nadie tiene la app abierta en el minuto del cambio, pero todos abren después de horas— y es la misma lógica que los eventos: lo que pasó mientras no estabas se muestra, no se oculta. Requiere el campo `ultimaFranja` del save (v6), que el merge-con-defaults trae gratis.

Con `prefers-reduced-motion` no hay disolvencia ni interpolación: el momento correcto se muestra igual, estático.

#### El contraste del texto contra las cuatro

El mediodía es mucho más luminoso que las escenas contra las que se calculó el contraste original, así que se recalculó **contra el píxel más claro de las cuatro panorámicas**, compuesto con el velo de cada superficie:

| superficie | peor caso | compuesto | contraste |
|---|---|---|---|
| panel de estado | mediodía, blanco puro | `rgb(27,29,34)` | **9,02:1** |
| línea de evento | mediodía, `rgb(186,188,178)` | `rgb(56,58,58)` | **7,20:1** |
| botonera | amanecer, `rgb(92,91,98)` | `rgb(36,42,53)` | **11,54:1** |

Los tres pasan AA con holgura y **no hizo falta tocar nada**. El motivo es de diseño y estaba de antes: ninguna superficie de texto se apoya directo sobre la panorámica — todas llevan su propio velo opaco (0,72 a 1,0), así que el fondo aporta como mucho el 28% del color compuesto. La conclusión importante para el futuro: mientras se respete esa regla, un fondo nuevo no puede romper el contraste.

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

## El rayo del pecho: cómo se mide algo que cambia de color

El rayo se ubicó primero buscándolo como **hueco a la derecha del cristal**, tomando la caja de contorno de todo lo que tuviera firma de vidrio en una ventana de 41 px. El error: eso mete el marco y la hombrera. Los recuadros salían de 11 a 16% de ancho —terminando en el 63-78% del lienzo— y el rayo quedaba dibujado **sobre el brazo de Chip**.

La medición buena es **template matching**, y es un solo método para los ocho sprites. Buscarlo por color no cierra: en `critico` el rayo es rojo y en `standby` no hay rayo sino una luna, así que cada máscara cromática necesitaba su excepción. Pero el rayo es el **mismo dibujo** en todas las poses: se recorta el de `idle` —verificado a ojo— y se lo busca por correlación normalizada en el resto, comparando forma y no brillo absoluto.

Lo mejor del método es que **el puntaje contesta si el rayo está**:

| sprite | correlación | |
|---|---|---|
| idle | 1,00 | es el patrón |
| limpiando | 0,86 | |
| cargando | 0,85 | |
| critico | 0,79 | el rayo es rojo y la correlación no se entera |
| feliz | 0,77 | |
| jugando | 0,69 | |
| idle-manitos | 0,52 | el brazo levantado lo tapa a medias |
| standby | 0,44 | **no hay rayo**: el display muestra una luna |

La caída del puntaje es la señal, no una falla del método. Las cajas pasaron de 11-16% de ancho a 4,3%.

## "Estoy bien, gracias": por qué no es un cooldown

Con los stats al máximo los tres botones quedaban encendidos y no hacían nada al tocarlos. La corrección tiene dos mitades y la segunda es la que importa.

Las teclas se apagan por **dos motivos distintos que se ven igual pero no significan lo mismo**:

- **No hace falta** — el stat está al máximo. La tecla queda apagada pero **sigue recibiendo el toque** (`aria-disabled`, no `disabled`), porque Chip tiene algo que contestar. Con `disabled` de verdad el click nunca llega y el jugador se queda sin respuesta, que es exactamente el problema original.
- **No puedo** — jugar sin batería. Eso sí es `disabled`: no hay nada que decir y no hay nada que hacer hasta cargarlo.

Y Chip contesta con un **tilde** en la pantalla del pecho, con las barritas atenuadas detrás. Va ahí porque es donde Chip ya habla —misma caja medida, misma fuente de píxeles que el número— en vez de inventarle una burbuja de diálogo aparte, que sería un segundo idioma para lo mismo. Es un tilde y no una cruz: la acción no está prohibida, ya está hecha.

**Nada de esto es un cooldown**, y esa distinción sostiene el modelo sin culpa: no hay tiempo de espera, no hay penalización y nada se bloquea por reloj. La restricción es de **estado**. Hay una prueba dedicada a eso —el mismo estado da el mismo resultado dos veces seguidas, y con los stats a medias las tres acciones aplican sin espera— para que un cooldown metido más adelante la rompa en vez de colarse.
