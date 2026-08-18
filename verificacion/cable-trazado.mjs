import sharp from 'sharp';

const { data, info } = await sharp('C:/Chip/referencia-cable.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const W = info.width, H = info.height, C = info.channels;
const gris = (x, y) => {
  const i = (y * W + x) * C;
  return (data[i] + data[i + 1] + data[i + 2]) / 3;
};

// EL 95 SOLO NO REPRODUCE NADA: LA VENTANA ES EL MÉTODO.
//
// Sobre la imagen entera, 95 no separa el cable de nada — la pared del fondo da
// 20 a 90, el cuerpo de Chip también, y el histograma global no tiene valle: de
// 80 a 110 es una meseta y cualquier corte ahí da casi lo mismo. Quien corra
// este script con otro recorte y el mismo umbral no va a obtener este camino.
//
// Lo que hace que el número no sea delicado es el recorte. La ventana deja
// afuera la pared del fondo (arriba), el cuerpo de Chip (izq) y la junta del
// piso de abajo. Dentro de ella hay 18.066 px bajo 95 y la componente conectada
// más grande se lleva 18.011: el 99,7%. O sea que adentro de la ventana el
// umbral ya no está decidiendo nada, y por eso mover el 95 entre 80 y 110 no
// cambia el camino. Ver cable-metodo.md para la tabla de sensibilidad.
const OSCURO = 95;
const X0 = 405, X1 = 1000, Y0 = 370, Y1 = 720;

const dentro = (x, y) => x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
const idx = (x, y) => (y - Y0) * (X1 - X0 + 1) + (x - X0);
const mask = new Uint8Array((X1 - X0 + 1) * (Y1 - Y0 + 1));
for (let y = Y0; y <= Y1; y++) {
  for (let x = X0; x <= X1; x++) if (gris(x, y) < OSCURO) mask[idx(x, y)] = 1;
}

// Componente conectada más grande: el cable. Cualquier junta suelta que se haya
// colado queda afuera por tamaño.
const visto = new Uint8Array(mask.length);
let mejor = null;
for (let y = Y0; y <= Y1; y++) {
  for (let x = X0; x <= X1; x++) {
    if (!mask[idx(x, y)] || visto[idx(x, y)]) continue;
    const pila = [[x, y]];
    const comp = [];
    visto[idx(x, y)] = 1;
    while (pila.length) {
      const [px, py] = pila.pop();
      comp.push([px, py]);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (!dentro(nx, ny) || !mask[idx(nx, ny)] || visto[idx(nx, ny)]) continue;
          visto[idx(nx, ny)] = 1;
          pila.push([nx, ny]);
        }
      }
    }
    if (!mejor || comp.length > mejor.length) mejor = comp;
  }
}

console.log('componente del cable:', mejor.length, 'px');

// BFS desde la punta del enchufe de pared —el extremo de arriba a la derecha—
// para tener la distancia a lo largo del cable.
const enComp = new Set(mejor.map(([x, y]) => idx(x, y)));
let semilla = mejor[0];
for (const p of mejor) if (p[0] - p[1] > semilla[0] - semilla[1]) semilla = p;

const dist = new Map();
dist.set(idx(...semilla), 0);
let frente = [semilla];
let d = 0;
while (frente.length) {
  const siguiente = [];
  d++;
  for (const [px, py] of frente) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (!dentro(nx, ny) || !enComp.has(idx(nx, ny)) || dist.has(idx(nx, ny))) continue;
        dist.set(idx(nx, ny), d);
        siguiente.push([nx, ny]);
      }
    }
  }
  frente = siguiente;
}

// Centroide por banda de distancia: eso es la línea media del cable.
const bandas = new Map();
for (const [x, y] of mejor) {
  const k = Math.floor(dist.get(idx(x, y)) / 12);
  if (!bandas.has(k)) bandas.set(k, []);
  bandas.get(k).push([x, y]);
}

const linea = [...bandas.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([k, ps]) => [
    +(ps.reduce((s, p) => s + p[0], 0) / ps.length).toFixed(1),
    +(ps.reduce((s, p) => s + p[1], 0) / ps.length).toFixed(1)
  ]);

console.log('\nlínea media, del enchufe de pared hacia Chip (' + linea.length + ' puntos):');
console.log(linea.map(([x, y]) => `${x},${y}`).join('  '));

// Grosor: ancho de la componente medido perpendicular, aproximado por el área
// sobre el largo.
const largo = Math.max(...dist.values());
console.log('\nlargo aprox', largo, 'px   área', mejor.length, '   grosor medio', (mejor.length / largo).toFixed(1), 'px');
