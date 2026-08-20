// El desgaste de la chapita, contado píxel por píxel sobre el render de verdad.
//
//   node verificacion/chapita-desgaste.mjs
//
// ---- QUÉ PREGUNTA CONTESTA ----
//
// El desgaste por filas son tres capas de fondo de 1 px de alto: luz, pintura y
// sombra. Por construcción eso no puede mezclar tonos — todas las medidas son
// enteras y ninguna capa se superpone.
//
// La del medio iba PARTIDA cada 23 px para dejar ver el piso por cuatro huecos.
// Se fue: cuatro puntos regulares sobre una barra naranja se leen como LEDs, no
// como pintura saltada. Cualquier cosa REGULAR sobre esa barra se lee como
// información.
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
//   fila 1    un solo tono, la pintura base
//   fila 2    un solo tono, el naranja gastado
//
// Un segundo tono en cualquiera de las tres es antialiasing.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { leerPng, aHex } from '../tools/png.mjs';
import { COLORES_BOTON, COLORES_BOTON_CHAPITA } from '../js/config.js';

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

  const hex = aHex;


  const esperados = {
    0: COLORES_BOTON_CHAPITA['naranja-luz'],
    1: COLORES_BOTON.naranja,
    2: COLORES_BOTON_CHAPITA['naranja-sombra']
  };

  console.log(`Viewport ${ANCHO}x${ALTO}, escala 1. Desgaste por FILAS MACIZAS, sin patrón.\n`);

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

      // LA FILA DEL MEDIO YA NO TIENE HUECOS, y este chequeo es lo que queda de
      // cuando los tenía. Iba partida cada 23 px para dejar ver el piso, y se
      // fue porque cuatro puntos regulares sobre una barra naranja se leen como
      // LEDs y no como pintura saltada.
      //
      // Así que ahora las tres filas se miden igual: un solo tono cada una. Y el
      // chequeo se queda en vez de borrarse, mirando lo contrario de lo que
      // miraba: que NO haya huecos. Si vuelven, este número los ve.
      if (y === 1) {
        for (let x = 0; x < img.ancho; x++) {
          const p = (y * img.ancho + x) * img.canales;
          if (hex(img.datos[p], img.datos[p + 1], img.datos[p + 2]) !== esperado) huecos.push(x);
        }
        if (huecos.length) {
          console.log(
            `  fila ${y}  OJO: ${huecos.length} píxeles que no son la pintura, en x = ` +
              `${huecos.slice(0, 12).join(', ')}${huecos.length > 12 ? '…' : ''}. ` +
              'El desgaste es por filas macizas; un patrón acá vuelve a leerse como LEDs.'
          );
          problemas++;
          continue;
        }
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
    ? 'Ni un píxel mezclado: las tres filas salen macizas y sin patrón encima.'
    : `${problemas} cosa(s) para mirar.`);
} finally {
  await cromo.cerrar();
  servidor.close();
}
