# El arte de los objetos

Acá van los PNG de las cosas que Chip junta. Uno por objeto.

## El contrato

- **Maestro 32×32.** No 30, no 34, no 48. Los dos tamaños en que el juego dibuja
  un objeto son 32 (el piso) y 16 (el estante y la colección), que son el maestro
  y su mitad exacta. Cualquier otro maestro deja de dividir y el PNG sale
  remuestreado en al menos uno de los dos lugares. Ver `TAMANO_OBJETO` en
  `js/config.js`.
- **PNG con alfa.** El fondo transparente, no un color de fondo.
- **El nombre del archivo es el `id` del objeto** en `js/datos-objetos.js`, tal
  cual, más `.png`. Ejemplo: `tuerca-cabeza.png`, `cosa-sin-nombre.png`. De ahí
  sale el mapa solo; si el nombre no coincide con ningún id, el guardián lo
  denuncia en vez de dibujar un archivo que nadie pidió.
- **La base de la pieza cerca del borde de abajo.** El estante corrige el aire
  que queda debajo de la tinta con `BASES_OBJETO`, y esa tabla está medida contra
  las siluetas viejas: cuando entren los PNG hay que remedirla. Mientras tanto,
  cuanto menos aire tenga el sprite abajo, menos se nota.

## Cómo se cablean

Los PNG en esta carpeta no se dibujan solos: hay un mapa `id -> ruta` en
`js/config.js` que arranca vacío a propósito, para que el juego nunca quede
apuntando a archivos que no existen.

```
node tools/sellar-sprites.mjs     lee esta carpeta y reescribe SPRITES_OBJETO
node tests/sellar-cache.mjs       los mete en ARCHIVOS_CACHE y sube la versión
node tests/correr.mjs             y que quede verde
```

Se pueden cablear de a uno: el objeto que tiene PNG sale con su arte y el que no,
con la silueta provisoria de `js/formas.js`.

## El que no lleva sprite

`marca-derrape` no es una cosa que Chip levantó: son dos huellas de oruga
frenando, una marca del piso. La sigue dibujando `formas.js` y está declarado en
`OBJETOS_SIN_SPRITE` para que el guardián no lo reclame.

## Los dos que vienen mal a propósito

`foto` y `cosa-sin-nombre` se van a rehacer. Entran igual: el mapa los toma como
a cualquier otro y reemplazarlos después es pisar el archivo y volver a sellar.
