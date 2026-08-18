// Verifica que cada punto del camino caiga SOBRE el cable, midiendo la
// luminancia mediana alrededor de él en la referencia.
//
// Es el mismo método con el que se encontraron los tres puntos fuera del cable
// en el tramo leído a ojo. Sobre el cable da 37 a 74; sobre el piso, 170+.
//
//   node verificacion/cable-verificar.mjs

import sharp from 'sharp';
import { PUNTOS } from './cable-puntos.mjs';

const { data, info } = await sharp('referencia-cable.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const W = info.width, H = info.height, C = info.channels;
const gris = (x, y) => {
  const i = (y * W + x) * C;
  return (data[i] + data[i + 1] + data[i + 2]) / 3;
};

const RADIO = 13;
const SOBRE_CABLE = 90; // el techo de lo que se considera cable; el piso da 170+

let fuera = 0;
console.log('  #     x     y   mediana   veredicto');
PUNTOS.forEach(([x, y], i) => {
  const muestras = [];
  for (let dy = -RADIO; dy <= RADIO; dy++) {
    for (let dx = -RADIO; dx <= RADIO; dx++) {
      if (dx * dx + dy * dy > RADIO * RADIO) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      muestras.push(gris(nx, ny));
    }
  }
  muestras.sort((a, b) => a - b);
  const mediana = Math.round(muestras[Math.floor(muestras.length / 2)]);
  const ok = mediana <= SOBRE_CABLE;
  if (!ok) fuera++;
  console.log(
    String(i).padStart(3),
    String(x).padStart(5),
    String(y).padStart(5),
    String(mediana).padStart(9),
    '  ' + (ok ? 'cable' : 'FUERA')
  );
});

console.log(`\n${PUNTOS.length - fuera} de ${PUNTOS.length} sobre el cable` + (fuera ? `, ${fuera} FUERA` : ''));
process.exit(fuera ? 1 : 0);
