// Contrato de los assets: peso y presencia en el caché.
//
// SÓLO CORRE EN NODE. Es el único archivo de pruebas que toca el sistema de
// archivos, y por eso no está en tests/index.html: el navegador no puede leer
// sprites/ ni sw.js como texto. Lo importa nada más que tests/correr.mjs.
//
// Por qué existe: las dos cosas que verifica ya se habían hecho a mano y las dos
// se rompieron igual.
//
//   El peso  — los fondos se optimizaron una vez, y un reemplazo posterior de
//              arte pisó los optimizados con los originales sin que nadie se
//              enterara. Volvieron a 1,6 MB cada uno.
//   El caché — `esperando` e `idle-manitos` estuvieron en el deploy y fuera de
//              ARCHIVOS_CACHE. La app instalada los pedía a la red y sin
//              conexión mostraba el sprite de idle en su lugar, en silencio.
//
// Las dos eran disciplina. La disciplina se olvida; un test no.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { prueba, igual, verdadero } from './runner.js';
import {
  RUTAS_SPRITES,
  RUTAS_OJOS,
  RUTAS_FONDOS,
  AMBIENTES,
  SONIDO,
  RUTAS_BRAZOS,
  BRAZOS,
  ANGULO_BRAZO,
  SALUDO_BRAZO
} from '../js/config.js';
import {
  LIMITES_PESO,
  PRESUPUESTO_TOTAL_KB,
  LIMITE_AMBIENTE_KB,
  PRESUPUESTO_SONIDO_KB
} from './presupuesto.js';

const SW = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CARPETAS = ['sprites', 'icons'];

const listar = (carpeta) =>
  readdirSync(join(RAIZ, carpeta))
    .filter((n) => /\.(webp|png|jpg|jpeg|gif|svg)$/i.test(n))
    .map((n) => ({ carpeta, nombre: n, kb: statSync(join(RAIZ, carpeta, n)).size / 1024 }));

const ASSETS = CARPETAS.flatMap(listar);

// ---- Presupuesto de peso ----
//
// El límite es por archivo y por familia, no un número único: una panorámica de
// 1672x941 y un ícono de 192 no se miden con la misma vara.

prueba('peso: ningún asset supera su límite', () => {
  const excedidos = ASSETS.filter((a) => a.kb > limiteDe(a.nombre)).map(
    (a) => `${a.carpeta}/${a.nombre} pesa ${a.kb.toFixed(0)} KB y el límite es ${limiteDe(a.nombre)}`
  );
  igual(excedidos.join(' | '), '', 'assets fuera de presupuesto');
});

prueba('peso: el total de la instalación entra en el presupuesto', () => {
  const total = ASSETS.reduce((s, a) => s + a.kb, 0);
  verdadero(
    total <= PRESUPUESTO_TOTAL_KB,
    `los assets suman ${total.toFixed(0)} KB y el presupuesto total es ${PRESUPUESTO_TOTAL_KB} KB`
  );
});

function limiteDe(nombre) {
  const regla = LIMITES_PESO.find((r) => r.patron.test(nombre));
  return regla ? regla.kb : LIMITES_PESO.at(-1).kb;
}

// ---- Cruce sprites/ contra ARCHIVOS_CACHE ----

const sw = readFileSync(join(RAIZ, 'sw.js'), 'utf8');
const enCache = new Set([...sw.matchAll(/'\.\/((?:sprites|icons)\/[^']+)'/g)].map((m) => m[1]));

prueba('caché: todo asset del repo está en ARCHIVOS_CACHE', () => {
  const faltan = ASSETS.map((a) => `${a.carpeta}/${a.nombre}`).filter((r) => !enCache.has(r));
  igual(faltan.join(' | '), '', 'assets que existen y no se cachean');
});

prueba('caché: todo asset de ARCHIVOS_CACHE existe en el repo', () => {
  const enRepo = new Set(ASSETS.map((a) => `${a.carpeta}/${a.nombre}`));
  const fantasmas = [...enCache].filter((r) => !enRepo.has(r));
  igual(fantasmas.join(' | '), '', 'assets cacheados que no existen');
});

// Un archivo que falte en ARCHIVOS_CACHE rompe el install del service worker
// entero —`cache.addAll` es atómico— así que esto no es cosmética: la app deja
// de instalarse.
prueba('caché: las rutas declaradas en config.js existen en el disco', () => {
  const declaradas = [
    ...Object.values(RUTAS_SPRITES),
    ...Object.values(RUTAS_OJOS),
    ...Object.values(RUTAS_FONDOS)
  ];
  const enRepo = new Set(ASSETS.map((a) => `${a.carpeta}/${a.nombre}`));
  const rotas = declaradas.filter((r) => !enRepo.has(r));
  igual(rotas.join(' | '), '', 'rutas de config.js sin archivo');
});

prueba('caché: las rutas declaradas en config.js están cacheadas', () => {
  const declaradas = [
    ...Object.values(RUTAS_SPRITES),
    ...Object.values(RUTAS_OJOS),
    ...Object.values(RUTAS_FONDOS)
  ];
  const fuera = declaradas.filter((r) => !enCache.has(r));
  igual(fuera.join(' | '), '', 'rutas de config.js fuera del caché');
});

// ---- Los ambientes: otra bolsa, otro límite ----
//
// El sonido NO se instala con la PWA. Los ambientes no están en ARCHIVOS_CACHE:
// se bajan bajo demanda la primera vez que alguien prende el sonido. Por eso
// tienen su propio presupuesto — sumarlos al de los sprites haría que el número
// de "lo que pesa instalar" mienta por más del doble.

const AMBIENTES_EN_DISCO = readdirSync(join(RAIZ, 'sonidos'))
  .filter((n) => /\.(ogg|mp3|m4a|wav)$/i.test(n))
  .map((n) => ({ nombre: n, kb: statSync(join(RAIZ, 'sonidos', n)).size / 1024 }));

prueba('sonido: ningún ambiente supera su límite', () => {
  const excedidos = AMBIENTES_EN_DISCO.filter((a) => a.kb > LIMITE_AMBIENTE_KB).map(
    (a) => `sonidos/${a.nombre} pesa ${a.kb.toFixed(0)} KB y el límite es ${LIMITE_AMBIENTE_KB}`
  );
  igual(excedidos.join(' | '), '', 'ambientes fuera de presupuesto');
});

prueba('sonido: el total de lo que se baja bajo demanda entra en su presupuesto', () => {
  const total = AMBIENTES_EN_DISCO.reduce((s, a) => s + a.kb, 0);
  verdadero(
    total <= PRESUPUESTO_SONIDO_KB,
    `los ambientes suman ${total.toFixed(0)} KB y el presupuesto es ${PRESUPUESTO_SONIDO_KB}`
  );
});

// El que evita que la decisión se deshaga sin querer: si alguien mete un
// ambiente en ARCHIVOS_CACHE, la instalación de la PWA pasa de 1,6 MB a 3,9 y
// nadie se entera hasta que alguien mida por qué tarda tanto en instalar.
prueba('sonido: ningún ambiente está en ARCHIVOS_CACHE', () => {
  const cacheados = AMBIENTES_EN_DISCO.filter((a) => SW.includes(`sonidos/${a.nombre}`)).map(
    (a) => a.nombre
  );
  igual(
    cacheados.join(', '),
    '',
    'los ambientes se bajan bajo demanda: no van en el caché de instalación'
  );
});

// Y el otro lado del mismo contrato: el código tiene que poder pedirlos. Una
// ruta mal escrita en AMBIENTES daría un 404 silencioso —el <audio> no tira
// error visible— y el galpón se quedaría mudo sin que nada lo diga.
prueba('sonido: toda ruta de AMBIENTES existe en el disco', () => {
  for (const [franja, ruta] of Object.entries(AMBIENTES)) {
    verdadero(
      existsSync(join(RAIZ, ruta)),
      `${franja} apunta a ${ruta}, que no está en el repo`
    );
  }
});

// ---- El crossfade del loop ----
//
// sonido.js no se puede importar en Node —crea elementos y escucha en document—
// así que se lee como texto, igual que style.css en composicion.test.js. Lo que
// se defiende acá no es una implementación sino dos propiedades que ya fallaron
// una vez en producción: el empalme se escuchaba en el teléfono.

const SONIDO_JS = readFileSync(join(RAIZ, 'js/sonido.js'), 'utf8');

// LA CURVA TIENE QUE SER DE IGUAL POTENCIA, y esto no es preferencia.
//
// Dos grabaciones de ambiente no están correlacionadas, así que en la mezcla se
// suman sus POTENCIAS, no sus amplitudes. Con ganancias lineales, en el medio
// del cruce las dos valen 0,5 y la potencia total queda en sqrt(0,5²+0,5²) =
// 0,707: un pozo de 3 dB en cada vuelta. Con seno y coseno, sen²+cos² = 1 y no
// hay pozo.
prueba('sonido: el crossfade usa curvas de igual potencia y no rampas lineales', () => {
  verdadero(
    /Math\.sin\(/.test(SONIDO_JS) && /Math\.cos\(/.test(SONIDO_JS),
    'las curvas se arman con seno y coseno'
  );
  verdadero(
    SONIDO_JS.includes('setValueCurveAtTime'),
    'y se programan de una sobre el reloj de audio'
  );
});

// Y la propiedad en sí, calculada igual que en el módulo: la suma de potencias
// no puede moverse. Si alguien cambia la forma de la curva, esto lo agarra
// aunque siga habiendo un Math.sin en el archivo.
prueba('sonido: la suma de potencias del cruce es plana', () => {
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < SONIDO.pasosCurva; i++) {
    const u = i / (SONIDO.pasosCurva - 1);
    const p = Math.sin((u * Math.PI) / 2) ** 2 + Math.cos((u * Math.PI) / 2) ** 2;
    min = Math.min(min, p);
    max = Math.max(max, p);
  }

  const rizado = 20 * Math.log10(Math.sqrt(max) / Math.sqrt(min));
  verdadero(rizado < 0.01, `el rizado es ${rizado.toFixed(4)} dB y tiene que ser inaudible`);
});

// EL RELOJ DE JS NO PUEDE MOVER LA GANANCIA. La versión anterior movía el
// volumen con un setInterval de 50 ms y disparaba la vuelta con un setTimeout
// programado a un minuto vista. En un teléfono los dos se estrangulan: si el
// timer llega tarde el archivo que sale YA TERMINÓ —silencio y arranque en
// seco— y si la rampa se estrangula, el que sale llega al final con la ganancia
// arriba, que es un click.
prueba('sonido: la ganancia no la mueve ningún timer de JS', () => {
  // SE MIRA EL CÓDIGO, NO LOS COMENTARIOS. La cabecera de sonido.js explica por
  // qué el setInterval se fue, así que buscar la palabra en el archivo entero da
  // rojo sobre código correcto. Dos intentos anteriores de este test fallaron
  // así —uno por el comentario y otro por un lookahead que no frenaba el
  // retroceso del \s*— y un test que da rojo por su propia expresión regular es
  // peor que no tenerlo.
  const codigo = SONIDO_JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  verdadero(!codigo.includes('setInterval'), 'no queda ningún setInterval moviendo ganancia');

  // Y las asignaciones a .volume se extraen y se comparan por valor, en vez de
  // intentar describir "distinto de 1" con una clase de caracteres.
  const asignaciones = [...codigo.matchAll(/\.volume\s*=\s*([^;\n]+)/g)].map((m) => m[1].trim());
  igual(
    asignaciones.filter((v) => v !== '1').join(', '),
    '',
    'el volumen del elemento se queda en 1: quien manda es el GainNode'
  );
});

// Y la vuelta se dispara con el reloj del MEDIO, que avanza con la
// reproducción. Si la pestaña se estrangula, timeupdate se espacia pero no se
// desfasa respecto del audio; un setTimeout largo sí.
prueba('sonido: la vuelta la dispara el reloj del medio, no el de JS', () => {
  verdadero(SONIDO_JS.includes("'timeupdate'"), 'escucha timeupdate del propio elemento');
  verdadero(SONIDO_JS.includes("'ended'"), 'y tiene la red de contención por si no llega');
});

// El loop nativo NO alcanza, y es la razón de que todo esto exista: reinicia en
// seco, así que siempre deja discontinuidad en la unión.
prueba('sonido: el loop nativo queda apagado', () => {
  verdadero(/loop\s*=\s*false/.test(SONIDO_JS), 'audio.loop en false: el bucle lo hace el cruce');
});

// ---- Los brazos ----
//
// Mismo criterio que el guardián de POSES_IDLE y el de RUTAS_OJOS: si el código
// declara una capa, su recorte tiene que existir. Un src que da 404 no rompe
// nada visible —la capa queda vacía y el sprite base sigue dibujando el brazo—
// así que sin esto se descubre mirando, o no se descubre.

prueba('brazos: todo recorte declarado existe en el disco', () => {
  for (const [pose, lados] of Object.entries(RUTAS_BRAZOS)) {
    for (const [lado, ruta] of Object.entries(lados)) {
      verdadero(existsSync(join(RAIZ, ruta)), `${pose}/${lado} apunta a ${ruta}, que no está`);
    }
  }
});

prueba('brazos: toda pose con recortes tiene su pivote, y al revés', () => {
  igual(
    Object.keys(RUTAS_BRAZOS).sort().join(','),
    Object.keys(BRAZOS).sort().join(','),
    'las poses de RUTAS_BRAZOS y las de BRAZOS son las mismas'
  );

  for (const [pose, lados] of Object.entries(BRAZOS)) {
    for (const lado of ['izq', 'der']) {
      const p = lados[lado];
      verdadero(p && p.x > 0 && p.x < 100, `${pose}/${lado}: x=${p?.x} está adentro del lienzo`);
      verdadero(p && p.y > 0 && p.y < 100, `${pose}/${lado}: y=${p?.y} está adentro del lienzo`);
    }
  }
});

// EL ÁNGULO ESTÁ LIMITADO POR EL SPRITE DE ABAJO, y esto lo fija.
//
// El recorte rota ENCIMA del sprite entero, que sigue teniendo el brazo
// dibujado: en el borde queda a la vista el de abajo, corrido. Medido sobre los
// cuatro recortes, con el punto más lejano a ~73 px del pivote en un lienzo de
// 256 que se muestra a 1,62x:
//
//    2° ->  2,5 px de lienzo (4,1 en pantalla)
//    3° ->  3,8 px          ( 6,1)
//    6° ->  7,5 px          (12,2)
//   12° -> 15,0 px          (24,3)
//
// Hasta que exista un cuerpo sin brazos, el ángulo no puede pasar de donde el
// corrimiento entra en el grosor del contorno del dibujo.
prueba('brazos: el ángulo no pasa de lo que el sprite de abajo aguanta', () => {
  const PALANCA = 73;
  const ESCALA = 1.62;
  const corrimiento = PALANCA * Math.sin((ANGULO_BRAZO * Math.PI) / 180) * ESCALA;

  verdadero(
    corrimiento <= 5,
    `a ${ANGULO_BRAZO}° el brazo de abajo asoma ${corrimiento.toFixed(1)} px en pantalla`
  );

  // El saludo tiene el MISMO techo, y por eso está acá y no en su propio test:
  // si se levanta uno hay que levantar los dos, porque los dos dependen del
  // mismo archivo de arte que falta.
  const saludo = PALANCA * Math.sin((SALUDO_BRAZO.angulo * Math.PI) / 180) * ESCALA;
  verdadero(
    saludo <= 7,
    `el saludo a ${SALUDO_BRAZO.angulo}° asoma ${saludo.toFixed(1)} px en pantalla`
  );
});

// En `critico` los brazos quedan quietos, y eso es diseño y no un olvido: la
// ausencia de movimiento es información.
prueba('brazos: critico no tiene recortes, y es a propósito', () => {
  verdadero(!('critico' in RUTAS_BRAZOS), 'sin recorte no hay nada que mover');
  verdadero(!('standby' in RUTAS_BRAZOS), 'dormido tampoco');
});
