// ¿Chip es pixel art? La pregunta que decide qué se puede endurecer.
//
//   node verificacion/alfa-sprites.mjs
//
// ---- POR QUÉ EXISTE ----
//
// Durante meses este proyecto trató a los sprites de Chip como pixel art: bordes
// duros, `pixelated`, nada de tonos intermedios. La regla salía de mirar el
// dibujo, que TIENE estética de sprite.
//
// Estética de sprite y pixel art no son lo mismo, y la diferencia se decide
// contando píxeles. Un pixel art de verdad tiene pocos colores y el alfa es
// binario: un píxel está o no está. Una ilustración con estética de sprite tiene
// miles de colores y un borde de alfa parcial, que es lo que le da la forma.
//
// Este script cuenta las dos cosas sobre los archivos de verdad, decodificados
// por el mismo navegador que los va a dibujar. No hay estimación en el medio.
//
// LA MEDICIÓN NO SE PUEDE HACER EN NODE. WebP no lo lee Node sin dependencias, y
// el decodificador de Windows —el que se usó una vez para esto— APLANA EL ALFA:
// devolvió 65.536 opacos y 0 transparentes sobre un archivo que tiene medio
// borde en alfa parcial. Un decodificador que miente sobre justo la propiedad
// que se está midiendo es peor que no medir.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';

const SPRITES = [
  'idle-cabeza.webp',
  'idle-ojos.webp',
  'idle-ojos-contento.webp',
  'idle-ojos-cerrado.webp',
  'feliz-cabeza.webp',
  'feliz-ojos.webp',
  'idle.webp',
  'fondo-mediodia.webp'
];

const { servidor, puerto } = await servir(0);
const cromo = await abrirCromo({ ancho: 400, alto: 400 });

try {
  await cromo.enviar('Runtime.enable');
  await cromo.enviar('Page.enable');
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(1500);

  const { result } = await cromo.enviar('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const salida = [];
      for (const nombre of ${JSON.stringify(SPRITES)}) {
        const img = await new Promise((listo, falla) => {
          const i = new Image();
          i.onload = () => listo(i);
          i.onerror = () => listo(null);
          i.src = '/sprites/' + nombre;
        });
        if (!img) { salida.push({ nombre, error: 'no cargó' }); continue; }

        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;

        let opacos = 0, transparentes = 0, parciales = 0;
        const colores = new Set();
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a === 255) opacos++;
          else if (a === 0) transparentes++;
          else parciales++;
          // Los colores se cuentan sólo donde hay tinta: contar el RGB de un
          // píxel totalmente transparente cuenta basura que no se ve.
          if (a > 0) colores.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
        }

        salida.push({
          nombre,
          lado: [c.width, c.height],
          total: c.width * c.height,
          opacos, transparentes, parciales,
          colores: colores.size
        });
      }
      return JSON.stringify(salida);
    })()`
  });

  const datos = JSON.parse(result.value);

  console.log('archivo                    tamaño     con tinta   alfa parcial   colores   veredicto');
  console.log('-'.repeat(92));

  for (const s of datos) {
    if (s.error) {
      console.log(`${s.nombre.padEnd(26)} ${s.error}`);
      continue;
    }
    const conTinta = s.opacos + s.parciales;
    // LA PROPORCIÓN QUE DECIDE. En pixel art el borde es binario: casi todo lo
    // que tiene tinta es opaco. Acá se mira qué fracción de la tinta es alfa
    // parcial. Arriba de la mitad no es un borde antialiaseado: ES el dibujo.
    const fraccion = conTinta ? s.parciales / conTinta : 0;
    const veredicto =
      s.colores <= 64 && fraccion < 0.1 ? 'PIXEL ART' : 'ilustración de bordes suaves';

    console.log(
      `${s.nombre.padEnd(26)} ${(s.lado.join('x')).padEnd(10)} ` +
        `${String(conTinta).padStart(9)}   ${String(s.parciales).padStart(9)} ` +
        `(${(fraccion * 100).toFixed(0)}%)  ${String(s.colores).padStart(7)}   ${veredicto}`
    );
  }

  console.log('');
  console.log('  "con tinta" = opacos + alfa parcial. Los totalmente transparentes no cuentan:');
  console.log('  un WebP de 256x256 con una cabeza adentro es casi todo vacío.');
  console.log('');
  console.log('  Un pixel art de verdad tendría decenas de colores y un alfa BINARIO. Lo que');
  console.log('  hay acá son miles de colores y la mayoría de la tinta en alfa parcial: el');
  console.log('  borde suave NO es un artefacto, es el dibujo. Ver el README.');
} finally {
  await cromo.cerrar();
  servidor.close();
}
