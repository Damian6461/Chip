// ¿Alcanza una máscara para meter los ojos de la caricia adentro de la cuenca?
//
//   node verificacion/ojos-mascara.mjs
//
// ---- LA HIPÓTESIS ----
//
// Las capas de gesto son recortes de OTRA pose de la cabeza, colocados sobre la
// cuenca con dieciséis números medidos (AJUSTE_OJOS). Por bien colocados que
// estén, el recorte trae su propio contorno oscuro y ese contorno desborda de la
// cuenca — que es el defecto que se ve.
//
// La hipótesis: recortar las capas de gesto con el ALFA DEL SPRITE NORMAL de la
// misma cabeza. Lo que desborde de la cuenca no se dibuja. Si funciona, no hay
// que redibujar nada.
//
// No es una técnica nueva acá: `#parpado` YA se recorta así, con el mismo
// archivo, y su comentario dice "la forma es exactamente la de los ojos, así que
// tapa los del cuerpo sin desbordar ni un píxel".
//
// ---- POR QUÉ SON DOS VARIANTES ----
//
// `mask` se aplica ANTES que `transform`, y las capas de gesto están
// transformadas: llevan un translate en % y un scale de hasta 1,19. Una máscara
// puesta EN LA CAPA viaja con ella y termina corrida de la cuenca exactamente lo
// que la capa está corrida.
//
//   A. la máscara en la propia capa   — se mueve con el ajuste
//   B. la máscara en un contenedor    — se queda en el espacio de la cabeza
//
// A es la que se probó a mano. B es la estructuralmente correcta. Medir sólo A
// daría un sí o un no sobre la técnica equivocada.
//
// ---- QUÉ SE MIDE ----
//
//   DESBORDE   cuánto cambia la imagen AFUERA de la cuenca al prender el gesto.
//              Es el defecto. Con la máscara andando tiene que caer a casi cero.
//   ADENTRO    cuánto cambia ADENTRO. Es el gesto haciendo su trabajo. Si la
//              máscara lo baja mucho, se está comiendo el arco del párpado.
//
// ---- Y UNA PRUEBA DEL PROPIO INSTRUMENTO ----
//
// La variante B mete un <div> en el medio, y un contenedor puede cambiar la
// geometría sin que nadie lo note: la primera versión de esta página lo hizo, y
// las capas pasaron de 371x372 a 369x377. Así que antes de medir nada se
// comprueba que el contenedor SIN máscara dibuje exactamente lo mismo que sin
// contenedor. Si no, no hay medición: se estaría comparando dos layouts.

import { writeFileSync, mkdirSync } from 'node:fs';
import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { leerPng } from '../tools/png.mjs';

const CASOS = [
  { estado: 'idle', clase: 'ojos-contento', mascara: 'idle-ojos.webp' },
  { estado: 'idle', clase: 'ojos-cerrado', mascara: 'idle-ojos.webp' },
  { estado: 'feliz', clase: 'ojos-contento', mascara: 'feliz-ojos.webp' },
  { estado: 'feliz', clase: 'ojos-cerrado', mascara: 'feliz-ojos.webp' }
];

// LA MÁSCARA VA POR ESTADO y no una sola para los dos: la cabeza de feliz está
// dibujada un 13% más chica, así que su cuenca no cae donde la de idle.
const mascaraCss = (sel, archivo) => `
  ${sel} {
    -webkit-mask-image: url("/sprites/${archivo}");
    mask-image: url("/sprites/${archivo}");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }`;

// LOS CONTENEDORES YA ESTÁN EN index.html con su máscara: la variante B se
// implementó. Así que ahora las variantes se arman APAGANDO lo que hay, no
// agregándolo — que es lo que mantiene viva a esta página después del cambio.
// Una verificación que mide un estado del código que ya no existe está muerta.
const APAGAR = '.ojos-gesto-caja { -webkit-mask-image: none !important; mask-image: none !important; }';

const VARIANTES = [
  { nombre: '0-sin-mascara', css: () => APAGAR },
  { nombre: 'A-en-la-capa', css: (m) => APAGAR + mascaraCss('.ojos-gesto', m) },
  { nombre: 'B-en-contenedor', css: () => '' },
  // La neutralidad del contenedor ya no se puede medir sacándolo —está en el
  // marcado— pero sí apagándole la máscara: con la máscara apagada tiene que
  // dar exactamente lo mismo que la línea de base, y eso es lo que compara
  // '0-sin-mascara' contra sí mismo.
  { nombre: 'C-sin-ajustes', sinAjustes: true, css: () => APAGAR },
  { nombre: 'D-sin-ajustes-con-mascara', sinAjustes: true, css: () => '' }
];

const SALIDA = new URL('capturas/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(SALIDA, { recursive: true });

const { servidor, puerto } = await servir(0);
const cromo = await abrirCromo({ ancho: 390, alto: 844 });

try {
  await cromo.enviar('Page.enable');
  await cromo.enviar('Runtime.enable');
  await cromo.enviar('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  // Con el panel de debug abierto, que es lo que permite forzar el estado
  // visual: `feliz` no se puede pedir de afuera de otra manera, y medir idle
  // poniéndole la etiqueta "feliz" sería un número correcto con el nombre
  // equivocado.
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html?debug` });
  await dormir(3000);

  const ev = async (expr) =>
    (await cromo.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))
      .result.value;

  // Todo quieto. El parpadeo, la inclinación de la cabeza y la respiración
  // mueven las capas entre dos capturas, y entonces el diff mide el movimiento.
  await ev(`(() => {
    const e = document.createElement('style');
    e.id = 'quieto';
    e.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }' +
      /* EL PANEL DE DEBUG TAPA LA ESCENA. Se abre para poder forzar el estado
         visual —es el unico camino a feliz desde afuera— y despues se esconde,
         porque si no la captura de la cara es una captura del panel: la primera
         corrida devolvio un PNG de 1.217 bytes para un recorte de 371x371, o sea
         un rectangulo liso. Se sigue pudiendo operar el select escondido. */
      ' #panel-debug { opacity: 0 !important; pointer-events: none !important; }' +
      /* Y EL VELO DE APERTURA SE ESCONDE, NO SE CONGELA. El apagar-todas-las-
         animaciones de arriba lo dejaba puesto para siempre: es un rectangulo
         opaco del tamano de la escena, asi que las capturas salian planas y las
         doce combinaciones daban cero. La hoja YA tiene esta leccion escrita en
         su bloque de movimiento reducido —display:none y NO animation:none— y
         este script cayo igual. */
      ' #apertura { display: none !important; }';
    document.head.appendChild(e);
    return 1;
  })()`);

  // ESPERAR A QUE LA CARA ESTÉ MONTADA. `esperando` —el gigante pasando— deja la
  // cabeza sin sus capas: `#parpado` en 0x0 y las de gesto sin src. Dura 9 s y
  // arranca hasta 8 s después de abrir. Sin esta espera la página informaba
  // ceros, que se leen como "la máscara no hace nada".
  const listo = Date.now() + 25000;
  let montada = false;
  while (Date.now() < listo) {
    montada = await ev(`(() => {
      const g = document.getElementById('ojos-contento-izq');
      const c = document.getElementById('cabeza-grupo');
      return Boolean(c && c.getBoundingClientRect().width > 10 && g && g.src && !g.hidden);
    })()`);
    if (montada) break;
    await dormir(500);
  }
  if (!montada) {
    console.log('La cara no llegó a montarse en 25 s. NO HAY MEDICIÓN.');
    process.exit(1);
  }

  const capturar = async (caja) => {
    const foto = await cromo.enviar('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      clip: { ...caja, scale: 1 }
    });
    const png = Buffer.from(foto.data, 'base64');
    return { png, img: leerPng(png) };
  };

  const ponerCaja = async (poner) =>
    ev(`(() => {
      const hay = document.querySelector('.ojos-gesto-caja');
      if (${poner} && !hay) {
        const grupos = { 'ojos-contento': [], 'ojos-cerrado': [] };
        for (const id of ['ojos-contento-izq','ojos-contento-der','ojos-cerrado-izq','ojos-cerrado-der']) {
          grupos[id.startsWith('ojos-contento') ? 'ojos-contento' : 'ojos-cerrado'].push(document.getElementById(id));
        }
        for (const [n, capas] of Object.entries(grupos)) {
          const d = document.createElement('div');
          d.className = 'ojos-gesto-caja';
          d.style.cssText = 'position:absolute; inset:0; pointer-events:none;';
          capas[0].parentNode.insertBefore(d, capas[0]);
          for (const x of capas) d.appendChild(x);
        }
      } else if (!${poner} && hay) {
        for (const d of document.querySelectorAll('.ojos-gesto-caja')) {
          while (d.firstChild) d.parentNode.insertBefore(d.firstChild, d);
          d.remove();
        }
      }
      return 1;
    })()`);

  const ponerVariante = async (css) =>
    ev(`(() => {
      let e = document.getElementById('variante');
      if (!e) { e = document.createElement('style'); e.id = 'variante'; document.head.appendChild(e); }
      e.textContent = ${JSON.stringify(css)};
      return 1;
    })()`);

  const ponerGesto = async (clase) =>
    ev(`(() => {
      const chip = document.getElementById('chip');
      chip.classList.remove('ojos-contento', 'ojos-cerrado');
      if (${JSON.stringify(clase)}) {
        // cerrado se monta ENCIMA de contento: es la progresión del gesto y no
        // un estado suelto. Ver la regla de la progresión en style.css.
        // (Sin comillas invertidas acá adentro: esto vive en un template
        // literal y una comilla invertida en un comentario lo termina.)
        chip.classList.add('ojos-contento');
        if (${JSON.stringify(clase)} === 'ojos-cerrado') chip.classList.add('ojos-cerrado');
      }
      return 1;
    })()`);

  const forzarVisual = async (nombre) =>
    ev(`(() => {
      const sel = [...document.querySelectorAll('#panel-debug select, .debug select, select')]
        .find((s) => [...s.options].some((o) => o.value === ${JSON.stringify(nombre)}));
      if (!sel) return 'no encontré el selector';
      sel.value = ${JSON.stringify(nombre)};
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    })()`);

  const diff = (A, B, cuenca) => {
    let afuera = 0;
    let adentro = 0;
    let oscuraAfuera = 0;
    const ancho = A.ancho;
    for (let y = 0; y < A.alto; y++) {
      for (let x = 0; x < ancho; x++) {
        const p = (y * ancho + x) * A.canales;
        const d = Math.max(
          Math.abs(A.datos[p] - B.datos[p]),
          Math.abs(A.datos[p + 1] - B.datos[p + 1]),
          Math.abs(A.datos[p + 2] - B.datos[p + 2])
        );
        if (d <= 8) continue; // ruido de compresión
        if (cuenca && cuenca[y * ancho + x] > 128) { adentro++; continue; }
        afuera++;
        // LA TINTA OSCURA AFUERA DE LA CUENCA es el defecto que se ve: el
        // contorno del recorte pisando la chapa de la cara. Un cambio afuera
        // que queda CLARO no es el problema — el problema es el borde negro.
        const lum = 0.2126 * A.datos[p] + 0.7152 * A.datos[p + 1] + 0.0722 * A.datos[p + 2];
        if (lum < 70) oscuraAfuera++;
      }
    }
    return { afuera, adentro, oscuraAfuera, total: afuera + adentro };
  };

  console.log('LO QUE CAMBIA AL PRENDER EL GESTO, adentro y afuera de la cuenca.\n');
  const resumen = [];

  for (const caso of CASOS) {
    const forzado = await forzarVisual(caso.estado);
    if (forzado !== 'ok') {
      console.log(`${caso.estado} ${caso.clase}: ${forzado}. NO HAY MEDICIÓN.\n`);
      continue;
    }
    await dormir(600);

    // La caja: el grupo de la cabeza, que es el contenedor de todas las capas y
    // no lleva transform propio con las animaciones apagadas.
    const caja = JSON.parse(
      await ev(`(() => {
        const r = document.getElementById('cabeza-grupo').getBoundingClientRect();
        return JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) });
      })()`)
    );

    // LA CUENCA: el alfa del sprite normal dibujado en ESA MISMA CAJA.
    const alfaB64 = await ev(`(async () => {
      const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = '/sprites/${caso.mascara}'; });
      if (!img) return '';
      const c = document.createElement('canvas');
      c.width = ${caja.width}; c.height = ${caja.height};
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const a = new Uint8Array(c.width * c.height);
      for (let i = 0, k = 0; i < d.length; i += 4, k++) a[k] = d[i + 3];
      let s = '';
      for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192));
      return btoa(s);
    })()`);
    const cuenca = Buffer.from(alfaB64, 'base64');

    console.log(`--- ${caso.estado} · ${caso.clase} · caja ${caja.width}x${caja.height} · cuenca ${caso.mascara} ---`);
    if (cuenca.length !== caja.width * caja.height) {
      console.log('  la cuenca no calza con la caja. NO HAY MEDICIÓN.\n');
      continue;
    }

    // Referencias sin gesto, una por cada montaje.
    await ponerVariante('');
    await ponerGesto(null);
    await dormir(300);
    const base = await capturar(caja);


    for (const v of VARIANTES) {
      await ponerVariante(
        v.css(caso.mascara) +
          (v.sinAjustes ? ' .ojos-gesto { translate: none !important; scale: none !important; }' : '')
      );
      await ponerGesto(caso.clase);
      await dormir(350);

      const vivo = JSON.parse(
        await ev(`(() => {
          const n = document.getElementById(${JSON.stringify(caso.clase + '-izq')});
          const cs = getComputedStyle(n);
          return JSON.stringify({ op: parseFloat(cs.opacity), oculta: n.hidden, src: (n.src || '').split('/').pop() });
        })()`)
      );
      if (vivo.op < 0.9 || vivo.oculta || !vivo.src) {
        console.log(`  ${v.nombre.padEnd(26)} SUJETO APAGADO (${JSON.stringify(vivo)}). NO HAY MEDICIÓN.`);
        continue;
      }

      const con = await capturar(caja);
      if (con.img.ancho !== base.img.ancho || con.img.alto !== base.img.alto) {
        console.log(`  ${v.nombre.padEnd(26)} dimensiones distintas. NO HAY MEDICIÓN.`);
        continue;
      }

      const r = diff(con.img, base.img, cuenca);
      if (process.env.CHIP_DEBUG) console.log(`      [dbg] png con=${con.png.length} base=${base.png.length} iguales=${con.png.equals(base.png)} clases=${await ev("document.getElementById(String.fromCharCode(99,104,105,112)).className")}`);
      resumen.push({ caso: `${caso.estado} ${caso.clase}`, variante: v.nombre, ...r });
      console.log(
        `  ${v.nombre.padEnd(26)} afuera ${String(r.afuera).padStart(5)} px ` +
          `(oscura ${String(r.oscuraAfuera).padStart(4)})   adentro ${String(r.adentro).padStart(6)} px`
      );
      writeFileSync(`${SALIDA}ojos-${caso.estado}-${caso.clase}-${v.nombre}.png`, con.png);
    }
    console.log('');
  }

  // ---- La lectura ----
  console.log('LECTURA\n');
  for (const nombre of [...new Set(resumen.map((r) => r.caso))]) {
    const filas = resumen.filter((r) => r.caso === nombre);
    const sin = filas.find((f) => f.variante === '0-sin-mascara');
    if (!sin) continue;
    console.log(`${nombre}  — sin máscara desborda ${sin.afuera} px`);
    for (const f of filas.filter((f) => f.variante.startsWith('A') || f.variante.startsWith('B'))) {
      const corta = sin.afuera ? 1 - f.afuera / sin.afuera : 0;
      const cortaOscura = sin.oscuraAfuera ? 1 - f.oscuraAfuera / sin.oscuraAfuera : 0;
      const pierde = sin.adentro ? 1 - f.adentro / sin.adentro : 0;
      console.log(
        `  ${f.variante.padEnd(18)} corta el ${(corta * 100).toFixed(0)}% del desborde, ` +
          `el ${(cortaOscura * 100).toFixed(0)}% de la tinta OSCURA · ` +
          `se lleva el ${(pierde * 100).toFixed(0)}% del gesto`
      );
    }
  }

  console.log('');
  console.log('  Corta mucho y se lleva poco = la máscara sirve.');
  console.log('  Se lleva mucho = se está comiendo el arco del párpado.');
  console.log('  Capturas en verificacion/capturas/');
} finally {
  await cromo.cerrar();
  servidor.close();
}
