# Cómo se sacó el camino del cable de `referencia-cable.png`

Corregido después de que el método no se pudiera reproducir. **Lo que hace el
trabajo es la VENTANA, no el umbral**, y en el reporte anterior lo dije al revés.

## El error del reporte anterior

Dije: *"umbral en 95, que es el valle del histograma"*. Es falso, y es una mala
lectura de mi propio histograma.

| región | mínimo entre 60 y 150 |
|---|---|
| la que usé para calibrar (x 420-1099, y 200-857) | **90-99** con 9373 px |
| la franja del piso a ancho completo (y 60%-90%) | **60-69** con 2422 px |
| la ventana de búsqueda (x 405-1000, y 370-720) | **60-69** con 1102 px |

O sea: en mi propia región el mínimo cae en 90-99, pero es un hundimiento
superficial —9373 contra 9693 del bin de al lado— y no un valle que separe nada.
Presentarlo como "el valle" hizo que el umbral pareciera la decisión importante.
No lo es.

## Lo que de verdad manda: la ventana

```
x de 405 a 1000,  y de 370 a 720
```

Adentro de esa ventana hay **18.066 px** bajo 95, y la componente conectada más
grande tiene **18.011**. O sea que ahí adentro, lo único oscuro ES el cable: 55
píxeles sueltos de diferencia.

Afuera, a la izquierda de x=405 y en la misma franja del piso, hay **27.254 px**
más bajo 95 — eso es el cuerpo de Chip. Con la ventana a ancho completo, Chip y
la pared quedan conectados con el cable y la componente mayor deja de ser el
cable. Eso explica los 186.638 px del intento que no reproducía.

Los bordes de la ventana, y por qué:

- `x > 405` deja afuera el cuerpo de Chip y sus orugas.
- `x < 1000` deja afuera el borde derecho del cuadro.
- `y > 370` deja afuera la pared del fondo, que en esta imagen es tan oscura como
  el cable.
- `y < 720` deja afuera la junta de baldosa de abajo de todo.

## El umbral tiene una meseta ancha

Adentro de la ventana, el umbral casi no importa:

| umbral | px oscuros | componente mayor | % que es el cable |
|---|---|---|---|
| 60 | 13.014 | 11.009 | 84,6% |
| 70 | 14.116 | 11.832 | 83,8% |
| **80** | 15.639 | 15.631 | **99,9%** |
| **90** | 17.302 | 17.285 | **99,9%** |
| **95** | 18.066 | 18.011 | **99,7%** |
| **100** | 18.902 | 18.683 | **98,8%** |
| **110** | 20.547 | 19.886 | **96,8%** |
| 120 | 23.027 | 21.874 | 95,0% |
| 130 | 27.481 | 24.284 | 88,4% |

De 80 a 110 el resultado es el mismo cable. Abajo de 80 se fragmenta; arriba de
120 empieza a tragarse otras cosas. 95 está en el medio de la meseta, pero
cualquier valor de esa banda da lo mismo.

## El resto del método

1. Componente conectada más grande adentro de la ventana (8 vecinos).
2. BFS desde el extremo de arriba a la derecha, para tener distancia a lo largo
   del cable.
3. Centroide por banda de distancia (bandas de 12 px). Esto es lo que resuelve
   el quiebre en S: ahí el cable es casi vertical y un barrido por columnas
   devuelve varias corridas por columna.

## Los dos tramos que NO salieron del detector

- **El arranque en el pecho** (x 150-300). Ahí el cable pasa pegado a las orugas
  y al pie. Verificado: con la ventana abierta hasta esa zona, el trazo se va por
  encima de las orugas y vuelve. Esos seis puntos se leyeron de la imagen.
- **El último tramo, el que sube al enchufe.** Ahí la pared mide 20 a 90 y el
  cable 13 a 31: no hay umbral que los separe. No se inventaron puntos — ese
  tramo lo da la restricción del extremo.

## La verificación

`cable-encima.png`: los 36 puntos y la polilínea dibujados sobre la referencia.
Caen sobre el cable en todo su largo, ninguno sobre el cuerpo de Chip ni
flotando.
