// GENERA RECORRIDO_CABLE. `node tools/recorrido-cable.mjs` imprime la tabla
// lista para pegar en config.js, más las alturas que produce.
//
// POR QUÉ HAY UN GENERADOR Y NO UN TRAZADO A MANO. La tabla anterior salía de
// calcar referencia-cable.png, y estaba bien mientras el cable fuera a la toma
// de la pared: el arte y el juego dibujaban la misma pieza. Cuando el destino
// pasó a ser "fuera de cuadro por el borde derecho", la forma de la referencia
// dejó de describir este cable — su panza existía para apoyarse en un piso al
// que este cable ya no va.
//
// Calcar de nuevo una imagen que muestra otro recorrido habría sido precisión
// falsa. Así que la forma se DECLARA, con tres números que se pueden discutir,
// y la tabla se deriva de ellos. Lo que se pierde es el trazo del ilustrador; lo
// que se gana es que "sale casi horizontal, se afloja tres puntos y sube" deje
// de ser una descripción y pase a ser el código.
//
// EL FORMATO ES [t, n], y no es un punto en la escena:
//
//   t  fracción del recorrido en X, de 0 en el puerto a 1 en el destino.
//   n  cuánto CUELGA por debajo de la recta puerto->destino, en fracciones del
//      LARGO de esa recta. Positivo es hacia abajo.
//
// Así el camino se reconstruye entre los dos extremos y mover cualquiera de los
// dos mueve el cable entero, que es el pedido del punto 16. Ver lineaDelCable.

// ---- LA FORMA, EN TRES NÚMEROS ----
//
// Medidos sobre la escena de 390x844, que es el teléfono:
//
//   el puerto del pecho cae en  52,57% / 74,52%   (CONECTOR_PECHO es % de la
//                                                  caja de Chip, no de la escena)
//   el destino está en          106% / 58%        (TOMA_PARED, fuera de cuadro)
//
// La recta entre los dos SUBE 16,5 puntos. Un cable que va a un punto más alto
// no pasa antes por abajo, así que lo único que se le pide a la curva es:
//
//   - salir del puerto CASI HORIZONTAL. Un cable que arranca en diagonal se ve
//     tirado, no enchufado.
//   - aflojarse un poco en el medio. Sin esto es una recta, y un cable rígido se
//     ve peor que uno mal ubicado.
//   - subir al final y cruzar el borde.
const PUERTO = { x: 52.57, y: 74.52 };
const DESTINO = { x: 106, y: 58 };

// CUÁNTO SE AFLOJA, en puntos de alto de escena por debajo del puerto. Tres.
//
// El techo lo pone el panel de mensajes, que con tres líneas arranca en el
// 81,3%: la curva no puede llegar ahí. Con 3 el punto más bajo queda en 77,5% y
// sobran casi cuatro puntos. Con 12 —que es lo que hacía la panza anterior— el
// cable cruzaba el texto.
const AFLOJE = 3;

const MUESTRAS = 44;

// La subida va con smoothstep y no lineal: su derivada es cero en los dos
// extremos, y eso es lo que hace que el cable SALGA horizontal del puerto en vez
// de arrancar en diagonal.
const suave = (s) => s * s * (3 - 2 * s);

// Y el afloje es una campana. EL EXPONENTE ES 2,5 Y ESTÁ MEDIDO, no elegido:
// gobierna con qué velocidad se hunde el cable apenas sale del puerto, y ahí se
// pelea con la subida del smoothstep. Barrido, con el afloje fijo en 3 puntos y
// midiendo el ángulo de salida sobre la escena de 390x844:
//
//   exponente 1,35  ->  27,2°   la campana gana: el cable se tira para abajo
//   exponente 2     ->   7,5°
//   exponente 2,5   ->   0,3°   se cancelan
//   exponente 3     ->   4,1°   ahora gana la subida: sale para arriba
//   exponente 4     ->   6,8°
//
// 2,5 es donde el hundimiento inicial y la subida se anulan y el cable sale
// horizontal de verdad. No es un óptimo frágil: el test lo cuida con 12° de
// margen, así que mover los extremos no lo rompe en silencio.
const campana = (s) => Math.sin(Math.PI * s) ** 2.5;

// LA AMPLITUD DE LA CAMPANA NO ES EL AFLOJE, y confundirlas costó una vuelta:
// la subida del cable le come casi todo. Con amplitud 3 el punto más bajo queda
// 0,16 puntos por debajo del puerto, no 3.
//
// Así que se busca la amplitud que da el afloje pedido, por bisección. El
// número que se declara arriba es el que se ve; éste es el que hay que poner
// para que se vea.
function curvaCon(amplitud) {
  const puntos = [];
  for (let i = 0; i < MUESTRAS; i++) {
    const s = i / (MUESTRAS - 1);
    puntos.push({
      s,
      x: PUERTO.x + (DESTINO.x - PUERTO.x) * s,
      y: PUERTO.y + (DESTINO.y - PUERTO.y) * suave(s) + amplitud * campana(s)
    });
  }
  return puntos;
}

const aflojeDe = (amplitud) => Math.max(...curvaCon(amplitud).map((p) => p.y)) - PUERTO.y;

let bajo = 0;
let alto = 60;
for (let i = 0; i < 60; i++) {
  const medio = (bajo + alto) / 2;
  if (aflojeDe(medio) < AFLOJE) bajo = medio;
  else alto = medio;
}
const AMPLITUD = +((bajo + alto) / 2).toFixed(3);
const puntos = curvaCon(AMPLITUD);

// ---- DE PUNTOS DE ESCENA A [t, n] ----
//
// El largo del eje se mide EN PÍXELES sobre la escena de referencia, porque `n`
// va en fracciones de ese largo y `lineaDelCable` lo multiplica por el mismo
// largo cuando dibuja. Si se midiera en puntos porcentuales, el cable se
// deformaría al cambiar la relación de aspecto.
const ESCENA = { ancho: 390, alto: 844 };
const px = (p) => ({ x: (p.x / 100) * ESCENA.ancho, y: (p.y / 100) * ESCENA.alto });

const p0 = px(PUERTO);
const p1 = px(DESTINO);
const largo = Math.hypot(p1.x - p0.x, p1.y - p0.y);

const tabla = puntos.map((p) => {
  const q = px(p);
  const t = (q.x - p0.x) / (p1.x - p0.x);
  const yEnLaRecta = p0.y + t * (p1.y - p0.y);
  const n = (q.y - yEnLaRecta) / largo;
  return [+t.toFixed(4), +n.toFixed(4)];
});

const ys = puntos.map((p) => p.y);
const borde = puntos.filter((p) => p.x <= 100).at(-1);

console.log('// Generada por tools/recorrido-cable.mjs. No se edita a mano.');
console.log('export const RECORRIDO_CABLE = [');
for (let i = 0; i < tabla.length; i += 4) {
  const tramo = tabla.slice(i, i + 4).map(([t, n]) => `[${t}, ${n}]`).join(', ');
  console.log('  ' + tramo + (i + 4 < tabla.length ? ',' : ''));
}
console.log('];');
console.log('');
console.log('// alto de escena que ocupa la curva, en %:');
console.log(`//   sale del puerto en   ${PUERTO.y}`);
console.log(`//   punto más bajo       ${Math.max(...ys).toFixed(2)}   (el panel arranca en 81,3)`);
console.log(`//   punto más alto       ${Math.min(...ys).toFixed(2)}`);
console.log(`//   cruza el borde en    ${borde.y.toFixed(2)}  con x = ${borde.x.toFixed(1)}%`);
console.log(`//   amplitud de la campana ${AMPLITUD}`);
console.log(`//   afloje bajo el puerto ${(Math.max(...ys) - PUERTO.y).toFixed(2)} puntos`);
