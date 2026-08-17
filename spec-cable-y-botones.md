# SPEC — El cable y los botones

Dos cosas. La del cable tiene medición; la de los botones es dirección de arte.

---

## 1. El cable: se lee corto y hay un corte

### El corte, localizado

Medido sobre la línea media del polígono: **el salto más grande es de 7,1 px, en la coordenada (233,7 · 747,5)** — el codo de abajo a la izquierda, donde el cable toca el piso y gira. El resto de los saltos van de 4,4 a 5,3 px, y el promedio del recorrido es mucho menor.

Ahí la curva se quiebra en vez de doblar. Es el mismo problema del pico anterior, más chico: el radio de redondeo no está entrando en ese vértice. Aplicá el mismo clampeo que usaste para el otro, y bajá el techo del test a **5 px** para que este caso también quede cubierto.

### Se lee corto — y el problema es la perspectiva, no la longitud

Medido: el cable va de **13 px de ancho en el pecho a 4 px en la caja**. Una reducción de 3,25 a 1.

Para un galpón donde Chip es minúsculo y la caja está en la pared del fondo, esa reducción es poca. Un objeto que se aleja de verdad en un espacio grande se achica mucho más — y **es la reducción, no la distancia recorrida, lo que hace que algo se lea como lejano.**

**Tres cambios, en orden de importancia:**

**a) Reducción mucho más agresiva.** Llevá el extremo lejano de 4 px a **1,5-2 px**, manteniendo los 13 en el pecho. Eso es una relación de 7 u 8 a 1. Va a parecer exageradamente fino y ese es el punto: así se ve un cable que se va al fondo de una nave.

**b) Que recorra más piso antes de subir.** Hoy el cable sale de Chip, hace un rulo cerca, y sube en diagonal a la caja. La lectura es "la caja está acá nomás". En vez de eso: que corra por el piso **alejándose** —hacia arriba en la pantalla, siguiendo la fuga de las baldosas que ya mediste— buena parte del camino, y recién cerca de la pared suba a la caja. El tramo horizontal es el que cuenta la distancia.

**c) La caja, más chica y más arriba.** Si la caja está lejos, tiene que ser más chica de lo que es. Bajá su ancho un 25-30% y subila un poco más hacia la línea del horizonte. Verificá que siga siendo reconocible como caja de conexión a tamaño real.

**El criterio para saber si funcionó:** mirando la escena a tamaño real, el cable tiene que hacer que **Chip se vea chico**. Hoy pasa lo contrario: el cable es tan grueso en todo su recorrido que compite con él. Si al mirarlo pensás "qué grande es este galpón", está bien.

---

## 2. Los botones no pertenecen al galpón

Hoy son rectángulos oscuros redondeados con un ícono fino y una etiqueta. Se leen como interfaz de aplicación, no como parte del mundo. Y todo lo demás de la escena —el cable, la repisa, la caja, la toma— ya está dibujado con el vocabulario del galpón.

**La dirección: que parezcan tres piezas de chapa atornilladas a una consola**, del mismo mundo que el tanque, los caños y la panorámica.

Elementos del lenguaje que ya existe en el arte y se pueden usar:

- **Chapa con desgaste**, no un color plano. La misma familia de grises que el cuerpo de Chip y las consolas del fondo.
- **Tornillos o remaches en las esquinas.** Es el detalle que más rápido dice "esto es una pieza física".
- **Bisel real:** un borde superior más claro y uno inferior más oscuro, para que el botón tenga volumen y el hundimiento al apretar signifique algo.
- **El acento naranja del juego** en el borde o en el ícono, como lo tienen las articulaciones de Chip y los aros de las orugas.
- **El ícono grabado, no dibujado encima:** un relieve hundido con su sombra, como si estuviera estampado en la chapa.
- **El LED que ya tienen** encaja perfecto con esto: es el indicador de una máquina.

**Lo que no hay que perder:**

- El área táctil de 44×44 como mínimo.
- El contraste del texto, que ya está medido en AA. Si la chapa sube la luminancia del fondo, remedí.
- El tratamiento de apagado por material —chapa mate, relieve aplanado, LED apagado— que ya funciona bien y es coherente con esta dirección.
- Que se distingan entre sí de un vistazo.

**Cuidado con una cosa:** más textura puede hacerlos más ruidosos y más difíciles de leer. Probá primero con el bisel y los tornillos, que son estructura, antes de sumar textura de desgaste. Y verificá **a tamaño real en 390×844**, que es donde se va a usar.

---

## Verificación

El corte del cable es medible: ningún salto entre muestras consecutivas mayor a 5 px. La reducción también: el ancho en el extremo lejano contra el ancho en el pecho.

El resto lo juzga Damián mirando. Pasá capturas a tamaño real de la escena completa en `cargando`, y de la botonera sola.

---

## Reglas de siempre

Constantes en `config.js`. Tests en verde, con el techo de salto bajado a 5 px. Commit y push antes de reportar. Verificá a tamaño real, no ampliado.
