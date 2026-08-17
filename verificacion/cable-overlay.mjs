import sharp from 'sharp';

const PUNTOS = [
  [150, 472], [136, 520], [134, 570], [147, 607], [180, 630], [225, 642],
  [300, 648], [411, 651], [459, 648], [507, 643], [555, 636], [603, 627],
  [651, 617], [699, 603], [747, 590], [787, 581], [803, 571], [817, 560],
  [827, 545], [829, 530], [828, 514], [823, 500], [819, 490], [816, 480],
  [813, 470], [811, 459], [815, 444], [826, 431], [838, 423], [862, 412],
  [886, 404], [910, 397], [934, 391], [958, 385], [983, 381], [994, 375]
];

const marcas = PUNTOS.map(([x, y], i) =>
  `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#ff2d55" stroke-width="2"/>` +
  (i % 5 === 0 ? `<text x="${x + 7}" y="${y - 7}" font-size="14" fill="#ff2d55">${i}</text>` : '')
).join('');

const linea = `<polyline points="${PUNTOS.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.8"/>`;

const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="858">${linea}${marcas}</svg>`
);

const base = await sharp('C:/Chip/referencia-cable.png').png().toBuffer();
await sharp(base).composite([{ input: svg }]).png().toFile('encima.png');
console.log('listo');
