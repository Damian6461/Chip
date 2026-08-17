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

function histo(nombre, x0, x1, y0, y1) {
  const bins = new Array(26).fill(0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) bins[Math.min(25, Math.floor(gris(x, y) / 10))]++;
  const total = bins.reduce((s, n) => s + n, 0);
  console.log(`\n${nombre}   x ${x0}-${x1}, y ${y0}-${y1}   (${total} px)`);
  console.log(bins.map((n, i) => `${i * 10}:${n}`).join(' '));
  // El valle: el bin más bajo entre 60 y 150.
  let min = Infinity, donde = -1;
  for (let i = 6; i <= 15; i++) if (bins[i] < min) { min = bins[i]; donde = i * 10; }
  console.log(`valle entre 60 y 150 -> ${donde}-${donde + 9} con ${min} px`);
}

// La región que usé YO para calibrar.
histo('MÍA (la que usé)', 420, W - 1, 200, H - 1);

// La que probaste vos: la franja del piso, ancho completo.
histo('TUYA (franja del piso)', 0, W - 1, Math.round(0.6 * H), Math.round(0.9 * H));

// Y la que de verdad manda: la VENTANA de búsqueda de la componente.
histo('LA VENTANA DE BÚSQUEDA', 405, 1000, 370, 720);

// Cuánto pesa Chip en la franja del piso a ancho completo: es lo que explica
// los 186.638 px.
let oscurosChip = 0, oscurosVentana = 0;
for (let y = Math.round(0.6 * H); y <= Math.round(0.9 * H); y++) {
  for (let x = 0; x < 405; x++) if (gris(x, y) < 95) oscurosChip++;
}
for (let y = 370; y <= 720; y++) {
  for (let x = 405; x <= 1000; x++) if (gris(x, y) < 95) oscurosVentana++;
}
console.log(`\npíxeles bajo 95 a la IZQUIERDA de x=405, en la franja del piso: ${oscurosChip}`);
console.log(`píxeles bajo 95 adentro de la ventana de búsqueda:              ${oscurosVentana}`);
