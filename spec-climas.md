# SPEC — Los dos fondos de clima

Damián generó dos fondos nuevos, verificados contra el original: **encuadre alineado a 0 px de desplazamiento** en los dos.

```
                 luminancia   correlacion de estructura
dia                  57,2       (referencia)
niebla               41,6           0,838
tormenta             26,7           0,920
noche                18,6           0,802
```

Los dos correlacionan mejor que `fondo-noche`, que ya está en producción. La arquitectura, el portón, el estante y las juntas del piso coinciden.

**Archivos:** `sprites/fondo-tormenta.*` y `sprites/fondo-niebla.*`

---

## 1. No son tramos horarios

Ninguno de los dos entra en la rotación de amanecer / mediodía / atardecer / noche. **Son estados de evento**: se activan cuando sale su evento, duran lo que dura la sesión, y a la próxima visita el mundo vuelve a la normalidad.

Un fondo de clima **reemplaza al de la franja mientras está activo**, con el mismo crossfade que ya usás entre tramos. La lógica horaria sigue corriendo por debajo, sin tocar: si la sesión se extiende y cambia el tramo, el clima gana igual.

**Los dos son excluyentes.** No puede haber niebla y tormenta a la vez.

## 2. La tormenta es el evento 16

Ya existe en el canon y ya lo enganchaste. Lo que cambia: además del ambiente de lluvia, **el fondo pasa a `fondo-tormenta`**.

**Y la lluvia por código sigue, encima del fondo nuevo.** El fondo se generó deliberadamente **sin gotas dibujadas** para que no compitan: la imagen da la atmósfera y el cielo, el código da el movimiento. Las dos cosas juntas.

## 3. La niebla es un evento nuevo

Sin ambiente de sonido propio: la niebla se siente por lo que **no** hay. Que suene el ambiente de la franja como siempre, quizás con el volumen un poco más bajo si te resulta fácil.

**El texto del evento:**

> Hoy no se ve nada por la ventana. Chip se quedó mirando igual.

Categoría `resto` — no es colección ni gigantes, es Chip parando a mirar algo que no es trabajo, igual que la familia de objetos de afuera.

**Nada de partículas de niebla dentro del galpón.** La niebla está afuera y el fondo ya la cuenta. Sumar niebla por código adentro sería tapar a Chip.

**Frecuencia:** los dos climas juntos no deberían salir más de lo que sale cualquier otro evento del pool. Que no se vuelvan lo normal — su valor está en que sorprenden.

## 4. Bug — la lluvia se sale de la ventana

Medido en producción: las gotas van de **y = -0,3% a y = 81,6%**, y la abertura de la ventana termina cerca del **63%**. O sea que **llueve sobre la pared de abajo y un poco por encima del marco**. Se ve claramente en captura: hay rayas cayendo sobre la chapa, fuera del vidrio.

**Recortá la lluvia a la abertura exacta.** Un `clip-path` o una máscara con la forma del vidrio —que no es un rectángulo, el marco tiene esquinas redondeadas y perspectiva—, no una caja aproximada. Si la abertura ya está medida para otra cosa, reusá esa medición en vez de hacer una nueva.

Verificá con la lluvia activa y **mirando a tamaño real**: ninguna gota puede aparecer sobre la pared, el marco, ni por arriba del borde superior de la abertura.

---

## Verificación

- Con el evento de tormenta activo: fondo de tormenta + ambiente de lluvia + lluvia por código, toda dentro de la ventana.
- Con el evento de niebla activo: fondo de niebla, sin partículas, ambiente normal.
- Al cerrar y volver a abrir: el mundo vuelve a la franja horaria que corresponda.
- Los dos fondos pesados y comparados contra el presupuesto de assets, y sumados a `ARCHIVOS_CACHE` con bump.

## Reglas de siempre

Constantes en `config.js`. Tests en verde, incluido uno que fije que los climas no entran en la rotación horaria y que son excluyentes entre sí. Commit y push antes de reportar. Verificá a tamaño real.
