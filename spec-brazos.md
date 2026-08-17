# SPEC — Los brazos

Damián recortó los dos brazos de `idle`. Están pusheados y verificados: `sprites/idle-brazo-izq.png` y `sprites/idle-brazo-der.png`, los dos en 256×256, alineados con el sprite base.

**Esto va después de `spec-apertura-y-cabeza.md`**, no antes.

---

## Ya verificado — no hace falta que lo repitas

Simulé la rotación de los brazos sobre el sprite completo, en las dos poses.

**`idle`** — a 0°, 6° y 12°, con pivotes en el hombro (aproximadamente **170,145** el izquierdo y **78,147** el derecho, en coordenadas del lienzo de 256). **El solape aguanta hasta 12°** sin descubrir hueco.

**`feliz`** — a 0°, 8° y 14°, con pivotes en **163,172** y **80,163**. **Aguanta hasta 14°.** Y en esta pose los brazos ya están levantados, así que el movimiento se lee como saludar, que encaja con el estado.

Tomá esos pivotes como punto de partida y ajustalos si al verlos en movimiento quedan mejor unos píxeles corridos.

Posiciones medidas de los recortes:
```
idle.webp  (base)      x42-213   y10-246
idle-brazo-izq.png     x156-207  y140-211
idle-brazo-der.png     x43-85    y142-215

feliz.webp (base)      x23-218   y7-247
feliz-brazo-izq.png    x155-218  y126-177
feliz-brazo-der.png    x23-85    y99-168
```

---

## Por qué los brazos

Son lo único de Chip que nunca se mueve. Ya tenés animados los ojos (parpadeo), la cabeza (inclinación) y el aro de las orugas. Después de los ojos, los brazos son la parte más viva de un personaje: mueven la lectura de "sprite con efectos encima" a "algo que está ahí".

---

## Cómo se agrupan

Mismo patrón que `#cabeza-grupo`, con **un grupo por brazo**, cada uno con su propio `transform-origin` en el hombro. No un grupo compartido: los dos brazos tienen que poder moverse por separado, y de hecho la mayoría de los gestos son asimétricos.

Ojo con lo que ya te pasó con la cabeza: si algún elemento dibujado por código cae encima de un brazo, tiene que entrar al grupo o se va a despegar al rotar. Revisalo antes de dar el punto por cerrado.

---

## Los movimientos

Todos son chicos. Un brazo que se mueve mucho se lee como un muñeco articulado; uno que se mueve poco se lee como un cuerpo.

**En reposo — acomodarse.** Cada 25-45 s (aleatorio, e independiente entre los dos brazos), un brazo rota 3-5° y vuelve, en ~1,2 s. No los dos a la vez: si coinciden se ve coreografiado. Es el equivalente a la inclinación de cabeza, y por la misma razón conviene que sea impredecible.

**En `feliz` — levantar uno.** Ahora que `feliz` es una reacción y dura pocos segundos, el brazo puede acompañarla: uno de los dos sube 10-12° durante el estado y baja al terminar. Con overshoot al subir y vuelta más lenta que la ida, como el resto de las animaciones del proyecto.

**Durante una acción — asomarse.** Mientras `cargando`, `jugando` o `limpiando` está en curso, un brazo con un movimiento muy leve y cíclico (2-3°, ciclo de ~2 s). Es el "está haciendo algo" que hoy solo cuenta el sprite.

**Durante la caricia — el que está más cerca.** Cuando el punto 3 de la spec anterior esté hecho: el brazo del lado donde va el dedo se levanta apenas (4-6°), como acercándose. Sutil, acompañando el gesto.

**En `critico`** los brazos quedan quietos. No acomodarse, no moverse. La ausencia de movimiento es información.

---

## En `idle` y en `feliz`

Existen recortes de esas dos poses. Los movimientos de arriba aplican **cuando el sprite base es `idle` o `feliz`**; en las otras poses los brazos son los del sprite y no se mueven.

Eso significa que el movimiento durante las acciones (`cargando`, `jugando`, `limpiando`) **no se puede hacer todavía**. Implementá lo que funcione con las dos poses que hay y reportá qué quedó afuera. Si vale la pena, después pedimos los recortes de las otras.

Y la caricia: como dispara `feliz`, ahí sí hay brazos disponibles. Pero el momento en que el dedo está apoyado y Chip todavía está en `idle` también los tiene. Los dos casos están cubiertos.

---

## Reglas de siempre

`prefers-reduced-motion` los apaga por completo. Constantes en `config.js`. Los dos PNG a `.webp` con bump de caché, y borrá los PNG cuando los conviertas. Guardián: si existe un grupo de brazo, tiene que existir su recorte — mismo criterio que el de `POSES_IDLE` y `RUTAS_OJOS`.

**Verificá a tamaño real en 390×844 y capturando tres momentos del ciclo**, no solo el extremo. Un brazo que en el pico se ve bien puede estar cruzando el torso a mitad de camino.
