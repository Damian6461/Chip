# El cable contra el piso, en las cuatro franjas

La verificación que pide el punto 16 es mirarlo. Esto es lo otro: los números que
acompañan lo que se vio, para que se puedan cruzar sin depender de mi ojo.

**Cómo se sacaron.** `verificacion/cable-tonos.mjs`, pegado en la consola del
navegador con la app abierta y Chip cargando. Mide el fondo **crudo** del `.webp`
—no lo compuesto en pantalla— 9 px por debajo de la línea media del cable, en
cada una de sus 35 muestras. La escala es 0 a 255 de luminancia relativa.

Se mide el crudo y no la pantalla por dos razones: el archivo no cambia, así que
el número se puede reproducir; y es la misma base con la que se calibró la tabla
`CLIMAS` de `config.js`, así que los dos juegos de números se pueden poner uno al
lado del otro. En pantalla, encima de esto pasa la capa de luz de `#escena::after`
y todo sube.

## El piso que el cable cruza

| franja | mediana | mínimo | máximo |
|---|---|---|---|
| amanecer | 80 | 15 | 111 |
| mediodía | **142** | 14 | 196 |
| atardecer | 75 | 13 | 104 |
| noche | **27** | 1 | 33 |

## Los tres tonos del cable

| pieza | constante | luminancia |
|---|---|---|
| cuerpo | `#2b3138` | 48 |
| filo de arriba | `#7b858f` | 132 |
| filo de abajo | `#171b21` | 27 |

## Qué dicen los dos juntos

**El cable no se apoya en un solo tono, y por eso aguanta las cuatro franjas.**
Es el argumento para tener los dos filos y no uno.

- **A mediodía**, con el piso en 142, el que trabaja es el **cuerpo** (48) contra
  el piso: el cable se lee oscuro sobre claro. El filo de arriba (132) queda a 10
  puntos del piso y prácticamente desaparece — que está bien, porque a esa hora
  no hace falta.
- **De noche**, con el piso en 27, pasa lo contrario. El cuerpo (48) queda a 21
  puntos del piso y el filo de abajo (27) coincide con él **exactamente**: los
  dos se van. El que sostiene la lectura es el **filo de arriba**, a 105 puntos.
  El cable se ve como una línea pálida sobre el piso oscuro.
- **Amanecer y atardecer** caen en el medio, con el piso en 75-80: ahí los dos
  filos aportan y ninguno hace todo el trabajo.

O sea que el riesgo que marcaba el spec —"despegado del piso de noche o quemado
de día"— existe para cada filo por separado y no para el par. El que se apagaría
de día es el brillo y el que se apagaría de noche es la sombra, y nunca los dos a
la vez.

## Lo que queda anotado como límite

De noche el filo de abajo vale 27 y el piso vale 27. No es un problema hoy
—alcanza con el de arriba— pero significa que **el volumen del tubo se pierde de
noche**: se ve un cable plano y claro, no un caño redondo. Si alguna vez molesta,
el mecanismo para arreglarlo ya existe y es el mismo que usan los climas
(`clima?.cable ?? CABLE` en `ui.js`): basta con que la franja de noche traiga su
propio par de tonos.
