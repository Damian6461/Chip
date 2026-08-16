# SPEC — Feliz como reacción, y tres ajustes

Cuatro puntos. El primero es un cambio de fondo en la cadena de estados; los otros son ajustes y el cierre de la lista anterior.

Orden: 1 → 2 → 3 → 4.

---

## 1. `feliz` deja de ser un estado y pasa a ser una reacción

**El problema, verificado en el código:** hoy `feliz` es una condición de umbral —`bateria > UMBRAL_FELIZ_BATERIA && humor > UMBRAL_FELIZ_HUMOR`— y por lo tanto se sostiene indefinidamente mientras los stats estén altos. Como cuidar a Chip sube los stats, el estado natural del juego termina siendo `feliz` permanente.

Eso rompe dos cosas. La primera: **si Chip siempre está feliz, la felicidad no comunica nada.** Deja de ser información. La segunda: **`idle` es quien Chip es.** El reposo con su respiración, su parpadeo y su cabeza ladeándose cada tanto es el personaje; `feliz` es una respuesta a algo.

**El cambio:** `feliz` se convierte en una **bandera temporal**, exactamente igual que `esperando`. La sesión la enciende cuando pasa algo bueno, dura unos segundos, y se apaga sola. `idle` vuelve a ser el estado normal.

### Qué dispara `feliz`

- **Una caricia** (cuando esté implementado el punto 10).
- **Una acción que efectivamente aplicó** — cargar, jugar o limpiar cuando el stat subió de verdad. Si la acción no aplicaba porque el stat ya estaba al máximo, **no hay `feliz`**: ahí ya está el "estoy bien" de los botones apagados, y sumar felicidad sería premiar algo que no pasó.
- **Levantar un objeto del piso**, encadenado *después* del `esperando` de fastidio: primero se queja de que se lo ordenaste, después se pone contento de tenerlo. Ese encadenamiento dice más del personaje que cualquiera de los dos por separado.
- **Un evento de la categoría `coleccion`**, cuando encuentra algo.

### Duración y comportamiento

- Entre **2,5 y 4 segundos**, constante en `config.js`. Lo suficiente para leerse, no tanto como para volverse el estado.
- Si el disparador se repite mientras `feliz` está activo, **se reinicia el temporizador** en vez de acumularse.
- **No se apila con `esperando`**: si los dos están activos, gana el que corresponda por la cadena. `esperando` sigue arriba, como está hoy.
- Al terminar vuelve a `idle` con la transición de squash que ya existe.

### La cadena queda así

`cargando / jugando / limpiando` → `critico` → `standby` → `esperando` → `feliz` (bandera) → `idle`

El orden no cambia. Lo que cambia es que la condición de `feliz` deja de mirar los stats y pasa a mirar la bandera.

### Los umbrales

`UMBRAL_FELIZ_BATERIA` y `UMBRAL_FELIZ_HUMOR` dejan de gobernar el estado visual. **No los borres todavía**: pueden servir como condición adicional —que la caricia dispare `feliz` solo si Chip no está en crítico, por ejemplo—. Decidí si tienen uso y reportalo; si no lo tienen, se van.

### Verificación

Con los stats en 100 y sin tocar nada, Chip tiene que estar en **`idle`**, no en `feliz`. Al ejecutar una acción que aplica, pasa a `feliz` unos segundos y vuelve. Con los stats en 100 y una acción que no aplica, no hay `feliz`. Un test tiene que fijar que `feliz` no se sostiene con stats altos.

---

## 2. La repisa volvió a taparse con los caños

Medido en producción: la repisa arranca en **x=64%** y termina en 90%. Antes arrancaba en 70-71%. Al alargarla volvió a montarse sobre los **conductos verticales de la pared** (que están en 52-58% y 63-68%), que es exactamente el problema que ya habíamos corregido.

**El ancho de 26% está bien — no lo cambies.** Lo que hay que hacer es **centrar la repisa en el hueco que queda entre el caño y el borde del juego**.

La cuenta: el conducto más a la derecha termina en **68%**, y la escena termina en **100%**. Ese hueco mide 32%. Con la repisa en 26%, centrada quedan 3% de margen a cada lado:

**La repisa va de x=71% a x=97%.**

Si tu medición de los conductos difiere de 63-68%, recalculá con el valor real y reportá los números — lo que importa es que quede **centrada en el hueco**, no el número exacto.

Verificá que a 390×844 las ocho piezas sigan entrando sin cortarse contra el borde derecho: con el borde en 97% el margen es chico, y ese fue el bug que resolviste con la grilla `minmax(0, 1fr)`. Debería aguantar, pero confirmalo mirando.

---

## 3. La frecuencia de brazos cruzados

Con el pool nuevo, la categoría `grandes` pasó de 5 a 13 eventos sobre 48 — más de una cuarta parte. Como esa categoría dispara `esperando`, Chip va a cruzarse de brazos mucho más seguido, y hay riesgo de que la pose se vuelva una muletilla.

**No cambies la categoría de los eventos** — la clasificación es correcta, esos textos son gigantes pasando. En vez de eso: que **solo una parte de los eventos de `grandes` dispare la pose**. Los que describen un gigante presente ahora mismo la disparan; los que describen algo que quedó de un gigante que ya pasó, no.

La distinción, con dos textos del pool:
- *"Se le cayó un remache al carguero y siguió de largo. Chip esperó a que se fuera para levantarlo."* → **sí**, el gigante está pasando.
- *"Una placa numerada se soltó de algo grande. El número es 4471."* → **no**, es un hallazgo, el gigante no está.

Marcá cuáles con una bandera en el dato del evento, no con una heurística sobre el texto. Apuntá a que queden **6-8 de los 13** disparando la pose.

---

## 4. La lluvia como evento 16

Lo último de la lista anterior. Cuando sale ese evento:

- El **ambiente de lluvia** reemplaza al de la franja horaria, con el crossfade que ya tenés.
- Se suma **lluvia visual sobre la ventana** dibujada por código: líneas finas cayendo en diagonal, más densas cerca del vidrio y más difusas al fondo, sin arte nuevo. Que se lea **a través de la abertura** y no sobre toda la escena.
- Dura lo que dura la sesión; a la próxima visita vuelve a la normalidad.
- **No es un quinto tramo ni un sistema de clima.** Es un evento que además se ve y se escucha.

---

## Reglas de siempre

`prefers-reduced-motion` cubre lo nuevo. Constantes en `config.js`. Assets nuevos a `ARCHIVOS_CACHE` con bump. Tests en verde. Commit y push antes de reportar. Verificá **a tamaño real y contra la frase textual**, y preguntá cuando una instrucción admita dos lecturas.
