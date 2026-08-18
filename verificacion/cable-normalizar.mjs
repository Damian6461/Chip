// Convierte el camino de píxeles de la referencia al [t, v] normalizado que
// guarda config.js. Correr esto es cómo se regenera RECORRIDO_CABLE.
//
//   node verificacion/cable-normalizar.mjs
//
// ---- POR QUÉ EL MARCO NO ES PERPENDICULAR AL EJE ----
//
// La primera versión usaba el marco obvio: `t` a lo largo de la recta
// pecho->toma y `n` sobre su PERPENDICULAR. Es una rotación, así que la forma se
// conserva exactamente y en la referencia da lo mismo — el eje de la referencia
// está a 6,6° de la horizontal, o sea que la perpendicular es casi la vertical.
//
// En la escena no. Ahí el toma está en la pared, arriba y a la derecha, y el eje
// sube 40,6°. Con el marco perpendicular la panza cuelga girada 40°: el cable
// deja de apoyarse en el piso y se arquea por el aire. Verificado mirándolo, a
// tamaño de teléfono: sale del pecho, cruza por delante de las orugas y de ahí
// se va en diagonal hacia arriba a la derecha, flotando.
//
// El error es de física y no de código. UN CABLE TIRADO EN EL PISO NO GIRA CON
// SUS EXTREMOS: la gravedad no rota. Lo que se conserva cuando el toma se mueve
// es que la panza cae PARA ABAJO, no que caiga perpendicular a una recta que
// nadie ve.
//
// Así que el marco es un corte, no una rotación:
//
//   P = A + t*(B - A) + v*(0, L)
//
// `t` reparte la posición HORIZONTAL entre los dos extremos y `v` es cuánto cae
// por debajo de la recta, en vertical y en unidades del largo del eje. Con el
// eje casi horizontal de la referencia los dos marcos coinciden dentro del 1%,
// así que la forma medida sobrevive igual; con el eje inclinado de la escena, la
// panza sigue apuntando al piso.
//
// El quiebre en S sobrevive y se lee mejor: acá `t` retrocede porque la x
// retrocede, que es literalmente lo que hace el cable en la imagen.

import { PUNTOS } from './cable-puntos.mjs';

const A = PUNTOS[0];
const B = PUNTOS[PUNTOS.length - 1];
const ejeX = B[0] - A[0];
const ejeY = B[1] - A[1];
const largo = Math.hypot(ejeX, ejeY);

const norm = PUNTOS.map(([x, y]) => {
  const t = (x - A[0]) / ejeX;
  const v = (y - A[1] - t * ejeY) / largo;
  return [+t.toFixed(4), +v.toFixed(4)];
});

console.log('extremos:', A, '->', B, '   eje', largo.toFixed(1), 'px');
console.log('inclinación del eje:', ((Math.atan2(ejeY, ejeX) * 180) / Math.PI).toFixed(1) + '°');
console.log('grosor medido 25,3 px =', ((25.3 / largo) * 100).toFixed(2) + '% del eje');
console.log('\nexport const RECORRIDO_CABLE = [');
for (let i = 0; i < norm.length; i += 4) {
  console.log(
    '  ' +
      norm
        .slice(i, i + 4)
        .map(([t, v]) => `[${t}, ${v}]`)
        .join(', ') +
      (i + 4 < norm.length ? ',' : '')
  );
}
console.log('];');

const vMax = Math.max(...norm.map((p) => p[1]));
const iMax = norm.reduce((m, p, i) => (p[1] > norm[m][1] ? i : m), 0);
console.log(`\npanza máxima ${vMax} en t=${norm[iMax][0]}`);

// El retroceso del quiebre, sumado sobre todo el tramo: es la propiedad del dato
// que el test de config verifica, así que se imprime acá para poder cruzarla.
let retroceso = 0;
for (let i = 1; i < norm.length; i++) {
  if (norm[i][0] < norm[i - 1][0]) retroceso += norm[i - 1][0] - norm[i][0];
}
console.log('retroceso total del quiebre en S:', retroceso.toFixed(4), 'del eje');
