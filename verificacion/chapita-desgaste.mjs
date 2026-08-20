// El desgaste de la chapita, contado píxel por píxel sobre el render de verdad.
//
//   node verificacion/chapita-desgaste.mjs
//
// ---- QUÉ PREGUNTA CONTESTA ----
//
// El desgaste por filas es tres capas de fondo de 1 px de alto, y la del medio
// partida cada 23 px para dejar un píxel transparente. Por construcción eso no
// puede mezclar tonos: todas las medidas son enteras y ninguna capa se superpone.
//
// "Por construcción" es exactamente el tipo de argumento que este proyecto ya
// aprendió a no creerle. Un `background-position` de 12 px sobre un botón cuyo
// borde izquierdo caiga en 130,5 deja las tres filas en medio píxel, y ahí el
// navegador promedia — y la pieza que se viene limpiando de antialiasing durante
// tres rehechas vuelve a tenerlo, sin que nada se ponga rojo.
//
// Así que se captura la botonera A TAMAÑO REAL, con el escalado forzado a 1, y
// se cuentan los tonos de cada fila de cada chapita. Lo que tiene que dar:
//
//   fila 0    un solo tono, el naranja-alto de la caja de conexión
//   fila 1    DOS tonos: la pintura base y lo que se ve por los huecos
//   fila 2    un solo tono, el naranja gastado
//
// Un tercer tono en la fila 0 o en la 2, o más de dos familias en la 1, es
// antialiasing. Y el hueco tiene que medir 1 px exacto y repetirse cada 23.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { BOTONERA, COLORES_BOTON, COLORES_BOTON_CHAPITA } from '../js/config.js';

const ANCHO = 390;
const ALTO = 844;

const { servidor, puerto } = await servir(0);
const cromo = await abrirCromo({ ancho: ANCHO, alto: ALTO });

try {
  await cromo.enviar('Page.enable');
  await cromo.enviar('Runtime.enable');
  // El viewport se fija por CDP y no por el tamaño de ventana: la ventana trae
  // barras y el número que importa es el del layout.
  await cromo.enviar('Emulation.setDeviceMetricsOverride', {
    width: ANCHO,
    height: ALTO,
    deviceScaleFactor: 1,
    mobile: true
  });
  // UN ESTADO CON LOS TRES BOTONES PRENDIDOS, sembrado antes de que corra un
  // solo módulo. Sin esto la partida arranca con todo al 100% y los tres botones
  // dicen "no hace falta": la primera corrida de esta página midió los tres en
  // gris apagado y las tres filas dieron el mismo tono, que es correcto para ESE
  // estado y no dice nada del desgaste.
  await cromo.enviar('Page.addScriptToEvaluateOnNewDocument', {
    source: `try {
      const s = JSON.parse(localStorage.getItem('chip.save.v1') || '{}');
      localStorage.setItem('chip.save.v1', JSON.stringify({
        ...s, bateria: 40, humor: 40, mantenimiento: 40,
        ajustes: { ...(s.ajustes || {}), movimientoReducido: true, sonido: false }
      }));
    } catch (e) {}`
  });
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(2500);

  // Las cajas de las tres chapitas, en coordenadas de layout. Salen del propio
  // pseudo-elemento y no de una cuenta: lo que se mide es lo que se pintó.
  const { result } = await cromo.enviar('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const botones = [...document.querySelectorAll('#acciones button')];
      return JSON.stringify(botones.map((b) => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b, '::after');
        const filo = parseFloat(cs.getPropertyValue('top'));
        const izq = parseFloat(cs.getPropertyValue('left'));
        const der = parseFloat(cs.getPropertyValue('right'));
        return {
          etiqueta: b.textContent.trim(),
          apagado: b.disabled || b.getAttribute('aria-disabled') === 'true',
          x: r.left + izq,
          y: r.top + filo,
          ancho: r.width - izq - der,
          alto: parseFloat(cs.height),
          bordeBoton: r.left
        };
      }));
    })()`
  });
  const chapitas = JSON.parse(result.value);

  const capturas = [];
  for (const c of chapitas) {
    const foto = await cromo.enviar('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      clip: {
        x: Math.round(c.x),
        y: Math.round(c.y),
        width: Math.round(c.ancho),
        height: Math.round(c.alto),
        scale: 1
      }
    });
    capturas.push({ ...c, png: Buffer.from(foto.data, 'base64') });
  }

  // ---- El decodificador de PNG, sin dependencias ----
  //
  // Chrome devuelve PNG de 8 bits por canal. Sólo hace falta leer IHDR y IDAT,
  // inflar con `zlib` —que viene en Node— y deshacer los cinco filtros por fila.
  // Es lo mismo que ya hace verificacion/cable-tonos.mjs; si aparece una tercera
  // copia, se muda a tools/.
  const { inflateSync } = await import('node:zlib');

  function leerPng(buf) {
    let i = 8;
    let ancho = 0;
    let alto = 0;
    let canales = 0;
    const trozos = [];

    while (i < buf.length) {
      const largo = buf.readUInt32BE(i);
      const tipo = buf.toString('ascii', i + 4, i + 8);
      const datos = buf.subarray(i + 8, i + 8 + largo);
      if (tipo === 'IHDR') {
        ancho = datos.readUInt32BE(0);
        alto = datos.readUInt32BE(4);
        const color = datos[9];
        canales = color === 6 ? 4 : color === 2 ? 3 : 0;
        if (!canales) throw new Error(`tipo de color ${color} no contemplado`);
        if (datos[8] !== 8) throw new Error(`profundidad ${datos[8]} no contemplada`);
      } else if (tipo === 'IDAT') trozos.push(datos);
      else if (tipo === 'IEND') break;
      i += 12 + largo;
    }

    const crudo = inflateSync(Buffer.concat(trozos));
    const paso = ancho * canales;
    const salida = Buffer.alloc(alto * paso);

    for (let y = 0; y < alto; y++) {
      const filtro = crudo[y * (paso + 1)];
      const linea = crudo.subarray(y * (paso + 1) + 1, y * (paso + 1) + 1 + paso);
      for (let x = 0; x < paso; x++) {
        const a = x >= canales ? salida[y * paso + x - canales] : 0;
        const b = y > 0 ? salida[(y - 1) * paso + x] : 0;
        const c = x >= canales && y > 0 ? salida[(y - 1) * paso + x - canales] : 0;
        let v = linea[x];
        if (filtro === 1) v += a;
        else if (filtro === 2) v += b;
        else if (filtro === 3) v += (a + b) >> 1;
        else if (filtro === 4) {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        salida[y * paso + x] = v & 0xff;
      }
    }

    return { ancho, alto, canales, datos: salida };
  }

  const hex = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');

  const esperados = {
    0: COLORES_BOTON_CHAPITA['naranja-luz'],
    1: COLORES_BOTON.naranja,
    2: COLORES_BOTON_CHAPITA['naranja-sombra']
  };

  console.log(`Viewport ${ANCHO}x${ALTO}, escala 1. Período ${BOTONERA.desgaste.periodo}, ` +
    `hueco ${BOTONERA.desgaste.hueco}, arranque ${BOTONERA.desgaste.arranque}.\n`);

  let problemas = 0;

  for (const c of capturas) {
    const img = leerPng(c.png);
    console.log(`--- ${c.etiqueta} — chapita de ${img.ancho}x${img.alto} px, ` +
      `borde del botón en x=${c.bordeBoton}${c.apagado ? ', APAGADO' : ''} ---`);

    if (!Number.isInteger(c.bordeBoton)) {
      console.log(`    OJO: el botón arranca en ${c.bordeBoton}, que no es entero. ` +
        'Todo lo de abajo sale de una grilla corrida medio píxel.');
      problemas++;
    }

    for (let y = 0; y < img.alto; y++) {
      const cuenta = new Map();
      const huecos = [];
      for (let x = 0; x < img.ancho; x++) {
        const p = (y * img.ancho + x) * img.canales;
        const tono = hex(img.datos[p], img.datos[p + 1], img.datos[p + 2]);
        cuenta.set(tono, (cuenta.get(tono) ?? 0) + 1);
      }

      const tonos = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
      const esperado = esperados[y];
      const dominante = tonos[0][0];

      // La fila del medio tiene dos poblaciones legítimas: la pintura y lo que
      // se ve por los huecos, que es el piso del galpón y por lo tanto NO es un
      // color fijo — el fondo cambia con la hora. Así que ahí no se compara
      // contra un hex: se cuenta cuántos píxeles NO son la pintura, y tienen que
      // ser exactamente los huecos.
      if (y === 1) {
        for (let x = 0; x < img.ancho; x++) {
          const p = (y * img.ancho + x) * img.canales;
          if (hex(img.datos[p], img.datos[p + 1], img.datos[p + 2]) !== esperado) huecos.push(x);
        }
        const separaciones = huecos.slice(1).map((v, i) => v - huecos[i]);
        const todosIguales = separaciones.every((s) => s === BOTONERA.desgaste.periodo);
        console.log(
          `  fila ${y}  pintura ${esperado} en ${cuenta.get(esperado) ?? 0}/${img.ancho} px · ` +
            `huecos en x = ${huecos.join(', ')} · separaciones ${[...new Set(separaciones)].join('/')}`
        );
        if (!todosIguales && separaciones.length) {
          console.log('    OJO: los huecos no están parejos.');
          problemas++;
        }
        if (huecos[0] !== 11) {
          console.log(`    OJO: el primer hueco cae en ${huecos[0]} y la decisión dice 11.`);
          problemas++;
        }
        continue;
      }

      const limpia = tonos.length === 1 && dominante === esperado;
      console.log(
        `  fila ${y}  ${tonos.length} tono(s): ` +
          tonos.map(([t, n]) => `${t} x${n}`).join(', ') +
          (limpia ? '  OK' : `  <- se esperaba ${esperado} y nada más`)
      );
      if (!limpia) problemas++;
    }
    console.log('');
  }

  console.log(problemas === 0
    ? 'Ni un píxel mezclado: las tres filas salen macizas y los huecos caen donde tienen que caer.'
    : `${problemas} cosa(s) para mirar.`);
} finally {
  await cromo.cerrar();
  servidor.close();
}
