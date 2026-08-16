# SPEC — Feliz como reacción

Tres puntos. El primero es un cambio de fondo en la cadena de estados; los otros dos son ajustes.

---

## 1. `feliz` deja de ser un estado y pasa a ser una reacción

**El problema, verificado en el código:** hoy `feliz` es una condición de umbral —`bateria > UMBRAL_FELIZ_BATERIA && humor > UMBRAL_FELIZ_HUMOR`— y por lo tanto se sostiene indefinidamente mientras los stats estén altos. Como cuidar a Chip sube los stats, el estado natural del juego termina siendo `feliz` permanente.

Eso rompe dos cosas. La primera: **si Chip siempre está feliz, la felicidad no comunica nada.** Deja de ser información. La segunda: **`idle` es quien Chip es.** El reposo con su respiración, su parpadeo y su cabeza ladeándose cada tanto es el personaje; `feliz` es una respuesta a algo.

**El cambio:** `feliz` se convierte en una **bandera temporal**, exactamente igual que `esperando`. La sesión la enciende cuando pasa algo bueno, dura unos segundos, y se apaga sola. `idle` vuelve a ser el estado normal.

### Qué dispara `feliz`

- **Una caricia** (cuando esté implementado el punto 10).
- **Una acción que efectivamente aplicó** — cargar, jugar o limpiar cuando el stat subió de verdad. Si la acción no aplicaba porque el stat ya estaba al máximo, no hay `feliz`: ahí ya está el "estoy bien" de los botones apagados.
- **Levantar un objeto del piso**, después del `esperando` de fastidio: primero se queja, después se pone contento de tenerlo. Ese encadenamiento vale la pena.
- **Un evento de la categoría `coleccion`**, cuando encuentra algo.

### Duración y comportamiento

- Entre **2,5 y 4 segundos**, constante en `config.js`. Lo suficiente para leerse, no tanto como para volverse el estado.
- Si el disparador se repite mientras `feliz` está activo, **se reinicia el temporizador** en vez de acumularse.
- **No se apila con `esperando`**: si los dos están activos, gana el que corresponda por la cadena. `esperando` va arriba, como está hoy.
- Al terminar, vuelve a `idle` con la transición de squash que ya existe.

### La cadena queda así

`cargando / jugando / limpiando` → `critico` → `standby` → `esperando` → `feliz` (bandera) → `idle`

El orden no cambia. Lo que cambia es que la condición de `feliz` deja de mirar los stats y pasa a mirar la bandera.

### Los umbrales

`UMBRAL_FELIZ_BATERIA` y `UMBRAL_FELIZ_HUMOR` dejan de gobernar el estado visual. **No los borres todavía**: pueden servir como condición adicional —que la caricia dispare `feliz` solo si Chip no está en crítico, por ejemplo—. Decidí vos si tienen uso y reportalo; si no lo tienen, se van.

### Verificación

Con los stats en 100 y sin tocar nada, Chip tiene que estar en **`idle`**, no en `feliz`. Al ejecutar una acción que aplica, pasa a `feliz` unos segundos y vuelve. Con los stats en 100 y una acción que no aplica, no hay `feliz`.

---

## 2. La frecuencia de brazos cruzados

Con el pool nuevo, la categoría `grandes` pasó de 5 a 13 eventos sobre 48 — más de una cuarta parte. Como esa categoría dispara `esperando`, Chip va a cruzarse de brazos mucho más seguido, y hay riesgo de que la pose se vuelva una muletilla.

**No cambies la categoría de los eventos** — la clasificación es correcta, esos textos son gigantes pasando. En vez de eso: que **solo una parte de los eventos de `grandes` dispare la pose**. Los que describen un gigante presente ahora mismo la disparan; los que describen algo que quedó de un gigante que ya pasó, no.

Ejemplo de la distinción, con dos textos del pool:
- *"Se le cayó un remache al carguero y siguió de largo. Chip esperó a que se fuera para levantarlo."* → **sí**, el gigante está pasando.
- *"Una placa numerada se soltó de algo grande. El número es 4471."* → **no**, es un hallazgo, el gigante no está.

Marcá cuáles con una bandera en el dato del evento, no con una heurística sobre el texto. Apuntá a que queden **6-8 de los 13** disparando la pose.

---

## 3. La lluvia como evento 16

Lo último de la lista anterior. Cuando sale ese evento:

- El **ambiente de lluvia** reemplaza al de la franja horaria, con el crossfade que ya tenés.
- Se suma **lluvia visual sobre la ventana** dibujada por código: líneas finas cayendo en diagonal, más densas cerca del vidrio y más difusas al fondo, sin arte nuevo. Que se lea a través de la abertura y no sobre toda la escena.
- Dura lo que dura la sesión; a la próxima visita vuelve a la normalidad.
- **No es un quinto tramo ni un sistema de clima.** Es un evento que además se ve y se escucha.

---

## Reglas de siempre

`prefers-reduced-motion` cubre lo nuevo. Constantes en `config.js`. Tests en verde, incluido uno que fije que `feliz` no se sostiene con stats altos. Commit y push antes de reportar. Verificá a tamaño real y contra la frase textual.
