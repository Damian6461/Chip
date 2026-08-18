// EL CAMINO DEL CABLE, en píxeles de referencia-cable.png.
//
// Esta es la fuente única: config.js guarda la versión normalizada, que sale de
// correr `node verificacion/cable-normalizar.mjs`.
//
// ---- DE DÓNDE SALE CADA TRAMO ----
//
// De x=299 en adelante: trazado automático. Ver cable-metodo.md.
// Verificado punto por punto midiendo la luminancia mediana en un radio de 13 px
// alrededor de cada marcador: los 26 dan entre 37 y 54, o sea cable, sin una
// sola excepción — incluido todo el quiebre en S.
//
// De x=134 a x=225: leído de la imagen. Ahí el cable pasa pegado a las orugas y
// al pie de Chip, y el detector los fusiona.
//
// ---- LAS TRES CORRECCIONES DEL TRAMO LEÍDO A OJO ----
//
// La verificación por luminancia encontró tres puntos fuera del cable, los tres
// adentro de ese tramo. Dos se corrigieron barriendo la columna en busca de
// corridas oscuras:
//
//   x=180   corrida de 22 px entre y=599 y y=620, centro 609.  Estaba en 630.
//   x=225   corrida de 17 px entre y=619 y y=635, centro 627.  Estaba en 642.
//
// El tercero, x=147, SE SACÓ en vez de corregirse. Esa columna está dominada por
// una corrida oscura de 106 px que es el cuerpo de Chip, no el cable, así que no
// hay forma de resolverlo por medición. Sus dos vecinos —(134, 570) y (180, 609)—
// sí están verificados y quedan a 60 px uno del otro, que el remuestreo cubre de
// sobra. Un punto que no se puede cruzar vale menos que el hueco que deja.
export const PUNTOS = [
  [150, 472], [136, 520], [134, 570], [180, 609], [225, 627],
  [300, 648], [411, 651], [459, 648], [507, 643], [555, 636], [603, 627],
  [651, 617], [699, 603], [747, 590], [787, 581], [803, 571], [817, 560],
  [827, 545], [829, 530], [828, 514], [823, 500], [819, 490], [816, 480],
  [813, 470], [811, 459], [815, 444], [826, 431], [838, 423], [862, 412],
  [886, 404], [910, 397], [934, 391], [958, 385], [983, 381], [994, 375]
];
