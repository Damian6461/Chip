import sharp from 'sharp';

const { data, info } = await sharp('C:/Chip/referencia-cable.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const W = info.width, C = info.channels;
const gris = (x, y) => {
  const i = (y * W + x) * C;
  return (data[i] + data[i + 1] + data[i + 2]) / 3;
};

const X0 = 405, X1 = 1000, Y0 = 370, Y1 = 720;
const dentro = (x, y) => x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
const idx = (x, y) => (y - Y0) * (X1 - X0 + 1) + (x - X0);

function componente(umbral) {
  const mask = new Uint8Array((X1 - X0 + 1) * (Y1 - Y0 + 1));
  let oscuros = 0;
  for (let y = Y0; y <= Y1; y++) {
    for (let x = X0; x <= X1; x++) if (gris(x, y) < umbral) { mask[idx(x, y)] = 1; oscuros++; }
  }

  const visto = new Uint8Array(mask.length);
  let mejor = 0;
  for (let y = Y0; y <= Y1; y++) {
    for (let x = X0; x <= X1; x++) {
      if (!mask[idx(x, y)] || visto[idx(x, y)]) continue;
      const pila = [[x, y]];
      visto[idx(x, y)] = 1;
      let n = 0;
      while (pila.length) {
        const [px, py] = pila.pop();
        n++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx, ny = py + dy;
            if (!dentro(nx, ny) || !mask[idx(nx, ny)] || visto[idx(nx, ny)]) continue;
            visto[idx(nx, ny)] = 1;
            pila.push([nx, ny]);
          }
        }
      }
      if (n > mejor) mejor = n;
    }
  }
  return { oscuros, mejor };
}

console.log('umbral   px oscuros en la ventana   componente mayor   % que es el cable');
for (const u of [60, 70, 80, 90, 95, 100, 110, 120, 130]) {
  const { oscuros, mejor } = componente(u);
  console.log(
    String(u).padStart(6),
    String(oscuros).padStart(24),
    String(mejor).padStart(18),
    ((mejor / oscuros) * 100).toFixed(1).padStart(17) + '%'
  );
}
