// PLANTILLAS PARA REDIBUJAR LOS CUATRO RECORTES DE OJOS.
//
// Deja seis PNG de 256x256 en verificacion/plantillas/: las cuatro que hay que
// corregir —cabeza + el recorte del gesto YA CON la transformación de hoy
// aplicada— y las dos de referencia, que son el caso que sí está bien.
//
// ============================================================================
// POR QUÉ ESTO NO ES UN SCRIPT DE NODE, AUNQUE TERMINE EN .mjs
// ============================================================================
//
// Porque hay que DECODIFICAR WEBP, y el proyecto no tiene dependencias. Es la
// misma razón que ya está escrita arriba de cable-tonos.mjs.
//
// Se probó la salida sin dependencias que ofrece Windows —WIC, vía
// PresentationCore— y NO SIRVE, medido: decodifica el .webp, devuelve los
// 256x256 correctos, y el canal alfa llega en `Bgr32`. Sobre idle-ojos.webp da
// 65536 píxeles opacos, 0 transparentes, 0 parciales. O sea que aplana el alfa
// contra negro y devuelve un cuadrado lleno. Para un recorte que es 90 % de
// transparencia, eso no es una aproximación: es otra imagen.
//
// El único decodificador de webp con alfa que hay en esta máquina es el
// navegador. Así que este módulo corre en el navegador —lo abre
// plantillas-ojos.html— y los archivos los escribe plantillas-escribidor.mjs,
// que es un servidor de doce líneas que recibe los PNG y los guarda. Sin el
// escribidor la página igual sirve: muestra las seis y ofrece cada una para
// bajar.
//
// ============================================================================
// LA TRANSFORMACIÓN SE SACA DE LA HOJA, NO SE SUPONE
// ============================================================================
//
// Si esto se equivoca, las cuatro plantillas salen corridas y nadie se entera
// hasta que Damián dibuje encima de una mentira. Así que los tres datos que
// importan salen de style.css leída en vivo, y además se CRUZAN contra el
// navegador antes de exportar nada. Los tres:
//
//   1. EL ORDEN. `translate` y `scale` son propiedades individuales, y el orden
//      del spec es translate, rotate, scale — todas alrededor del origen. El
//      translate NO se multiplica por la escala. Está medido y escrito arriba de
//      la regla en style.css: un cuadrado de 100 px con `translate: 10%` y
//      `scale: 2` cae en [-40, 160], no en [-30, 170].
//
//   2. EL ORIGEN. `.ojos-gesto` no declara `transform-origin`, así que es el
//      inicial: 50 % 50 %, el CENTRO de la caja. No la esquina. Se lee con
//      getComputedStyle igual, porque suponerlo es exactamente el error.
//
//   3. LA CAJA. `.ojos-gesto` es `inset: 0` con 100 % de ancho y alto sobre el
//      mismo contenedor que el cuerpo, y el sprite es de 256x256. O sea que la
//      caja y el lienzo del dibujo son la misma cosa, y todo se puede hacer en
//      coordenadas de 256. Los `x` e `y` de AJUSTE_OJOS son PORCENTAJES DE ESA
//      CAJA, que es lo que significa un translate en %.
//
// De ahí sale la matriz, que es la del comentario de la hoja:
//
//   p' = T + s·(p − o) + o        con o = (128, 128)
//      = s·p + (T + (1 − s)·o)
//
// Y EL CLIP VA ANTES DEL TRANSFORM. `clip-path` se define en el sistema de
// coordenadas de la caja SIN transformar, y después se transforma el resultado.
// En canvas eso es: poner la matriz PRIMERO y recortar DESPUÉS con coordenadas
// locales, porque `ctx.clip()` usa la transformación vigente.
//
// ============================================================================
// EL CRUCE CONTRA EL NAVEGADOR
// ============================================================================
//
// No alcanza con que la cuenta parezca bien. La página arma una réplica de las
// ocho capas —cuatro plantillas por dos ojos— con las reglas REALES de
// style.css, en una caja de 256x256, y compara la caja transformada que devuelve
// `getBoundingClientRect` contra la que predice la matriz de acá. Si no coinciden
// al décimo de píxel, la página lo dice y NO exporta.
//
// Es el cruce que pidió el revisor y es el único que sirve: mide el pipeline
// contra el motor que dibuja el juego, no contra otra cuenta mía.

import { AJUSTE_OJOS, RUTAS_OJOS, RUTAS_OJOS_GESTO } from '../js/config.js';

export const LIENZO = 256;
const ORIGEN = LIENZO / 2;

// Las cuatro plantillas y las dos referencias, declaradas en una sola tabla para
// que el nombre del archivo y lo que lleva adentro no se puedan separar.
export const PLANTILLAS = [
  { archivo: 'plantilla-idle-contento.png', estado: 'idle', gesto: 'contento' },
  { archivo: 'plantilla-idle-cerrado.png', estado: 'idle', gesto: 'cerrado' },
  { archivo: 'plantilla-feliz-contento.png', estado: 'feliz', gesto: 'contento' },
  { archivo: 'plantilla-feliz-cerrado.png', estado: 'feliz', gesto: 'cerrado' }
];

export const REFERENCIAS = [
  { archivo: 'referencia-idle.png', estado: 'idle' },
  { archivo: 'referencia-feliz.png', estado: 'feliz' }
];

// La cabeza de cada estado. NO sale de una tabla de config porque no existe: los
// recortes de cabeza los usa el juego para la inclinación, y sólo idle tiene uno
// declarado. Acá hacen falta las dos, así que van por nombre y el test de que
// existen es que la imagen cargue — si falta una, la página lo dice.
export const CABEZAS = {
  idle: 'sprites/idle-cabeza.webp',
  feliz: 'sprites/feliz-cabeza.webp'
};

export function cargar(ruta) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('no cargó ' + ruta));
    img.src = '../' + ruta;
  });
}

// LA MATRIZ DE UNA MITAD, en coordenadas del lienzo de 256.
//
// Devuelve [a, b, c, d, e, f] como los toma `setTransform`: escala uniforme en
// la diagonal y el corrimiento ya con el origen incorporado.
export function matrizDe(ajusteDelOjo) {
  const s = ajusteDelOjo.escala;
  const tx = (ajusteDelOjo.x / 100) * LIENZO;
  const ty = (ajusteDelOjo.y / 100) * LIENZO;
  return [s, 0, 0, s, tx + (1 - s) * ORIGEN, ty + (1 - s) * ORIGEN];
}

// La caja de 256x256 después de la transformación, que es lo que se compara
// contra getBoundingClientRect.
export function cajaTransformada(ajusteDelOjo) {
  const [a, , , d, e, f] = matrizDe(ajusteDelOjo);
  return { x: e, y: f, ancho: a * LIENZO, alto: d * LIENZO };
}

// El recorte de cada mitad, en coordenadas de la caja sin transformar. Es el
// `clip-path: inset(...)` de la hoja, con `--corte` en % del ancho.
export function recorteDe(corte, lado) {
  const x = (corte / 100) * LIENZO;
  return lado === 'izq' ? { x: 0, ancho: x } : { x, ancho: LIENZO - x };
}

// ---- El dibujo ----

function lienzoNuevo() {
  const c = document.createElement('canvas');
  c.width = LIENZO;
  c.height = LIENZO;
  const g = c.getContext('2d', { willReadFrequently: true });
  // NEAREST y no suavizado: es lo que hace `image-rendering: pixelated` en la
  // hoja, y es la mitad del punto. Un remuestreo bilineal de un dibujo de pixel
  // art inventa medios tonos en cada borde — y el borde es justamente lo que
  // Damián tiene que mirar.
  g.imageSmoothingEnabled = false;
  return { c, g };
}

// Una mitad del gesto: se pone la matriz, se recorta con coordenadas LOCALES
// —que es como se comporta clip-path— y se dibuja el sprite entero.
function ponerMitad(g, sprite, ajusteDelOjo, corte, lado) {
  const [a, b, c, d, e, f] = matrizDe(ajusteDelOjo);
  const recorte = recorteDe(corte, lado);
  g.save();
  g.setTransform(a, b, c, d, e, f);
  g.beginPath();
  g.rect(recorte.x, 0, recorte.ancho, LIENZO);
  g.clip();
  g.drawImage(sprite, 0, 0, LIENZO, LIENZO);
  g.restore();
}

export function dibujarPlantilla(cabeza, sprite, ajusteDelGesto) {
  const { c, g } = lienzoNuevo();
  g.drawImage(cabeza, 0, 0, LIENZO, LIENZO);
  ponerMitad(g, sprite, ajusteDelGesto.izq, ajusteDelGesto.corte, 'izq');
  ponerMitad(g, sprite, ajusteDelGesto.der, ajusteDelGesto.corte, 'der');
  return c;
}

// La referencia NO lleva transformación, y ése es todo el asunto: el recorte de
// ojos del propio estado entra tal cual, del tamaño y en el lugar que va. Es la
// prueba de cómo se ve un borde que encaja.
export function dibujarReferencia(cabeza, ojos) {
  const { c, g } = lienzoNuevo();
  g.drawImage(cabeza, 0, 0, LIENZO, LIENZO);
  g.drawImage(ojos, 0, 0, LIENZO, LIENZO);
  return c;
}

// ---- El cruce contra el navegador ----
//
// Arma las ocho capas de verdad, con las reglas de style.css y las variables que
// escribe ui.js, adentro de una caja de 256x256, y devuelve para cada una la
// caja que el motor calculó y la que predice la matriz.
export function cruzarContraElNavegador() {
  const caja = document.createElement('div');
  caja.style.cssText =
    `position:absolute;left:0;top:0;width:${LIENZO}px;height:${LIENZO}px;visibility:hidden`;
  document.body.appendChild(caja);

  const filas = [];
  for (const { estado, gesto } of PLANTILLAS) {
    const ajuste = AJUSTE_OJOS[estado][gesto];
    for (const lado of ['izq', 'der']) {
      const capa = document.createElement('img');
      // Las mismas reglas que en el juego: la clase pone la caja y el id pone el
      // translate y el scale. No se copia ninguna declaración acá.
      capa.className = 'ojos-gesto';
      capa.id = `ojos-${gesto}-${lado}`;
      capa.style.setProperty(`--ojos-${gesto}-corte`, `${ajuste.corte}%`);
      capa.style.setProperty(`--ojos-${gesto}-${lado}-escala`, String(ajuste[lado].escala));
      capa.style.setProperty(`--ojos-${gesto}-${lado}-x`, `${ajuste[lado].x}%`);
      capa.style.setProperty(`--ojos-${gesto}-${lado}-y`, `${ajuste[lado].y}%`);
      capa.style.opacity = '1';
      caja.appendChild(capa);

      const real = capa.getBoundingClientRect();
      const base = caja.getBoundingClientRect();
      const predicha = cajaTransformada(ajuste[lado]);
      const origen = getComputedStyle(capa).transformOrigin;

      filas.push({
        estado,
        gesto,
        lado,
        origen,
        real: { x: real.x - base.x, y: real.y - base.y, ancho: real.width, alto: real.height },
        predicha,
        error: Math.max(
          Math.abs(real.x - base.x - predicha.x),
          Math.abs(real.y - base.y - predicha.y),
          Math.abs(real.width - predicha.ancho),
          Math.abs(real.height - predicha.alto)
        )
      });
      capa.remove();
    }
  }
  caja.remove();
  return filas;
}

// ---- Todo junto ----

export async function generar() {
  const cabezas = {
    idle: await cargar(CABEZAS.idle),
    feliz: await cargar(CABEZAS.feliz)
  };
  const gestos = {
    contento: await cargar(RUTAS_OJOS_GESTO.contento),
    cerrado: await cargar(RUTAS_OJOS_GESTO.cerrado)
  };
  const ojos = {
    idle: await cargar(RUTAS_OJOS.idle),
    feliz: await cargar(RUTAS_OJOS.feliz)
  };

  const salida = [];
  for (const p of PLANTILLAS) {
    salida.push({
      ...p,
      lienzo: dibujarPlantilla(cabezas[p.estado], gestos[p.gesto], AJUSTE_OJOS[p.estado][p.gesto])
    });
  }
  for (const r of REFERENCIAS) {
    salida.push({ ...r, lienzo: dibujarReferencia(cabezas[r.estado], ojos[r.estado]) });
  }
  return salida;
}
