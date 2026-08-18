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
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { prueba, igual, verdadero } from './runner.js';
import { archivosSellados, huellaDe, leerHuella, leerVersion } from './huella-cache.mjs';
import {
  RUTAS_SPRITES,
  RUTAS_OJOS,
  FRANJAS_DIA,
  CLIMAS,
  AMBIENTES,
  SONIDO,
  RUTAS_BRAZOS,
  BRAZOS,
  ANGULO_BRAZO,
  SALUDO_BRAZO,
  RUTAS_CABEZA,
  PIVOTES_CABEZA,
  RUTAS_OJOS_GESTO,
  AJUSTE_OJOS,
  RUTAS_CUERPO,
  INCLINACION_CABEZA,
  ANGULO_BRAZO_SIN_CUERPO
} from '../js/config.js';
import {
  LIMITES_PESO,
  PRESUPUESTO_TOTAL_KB,
  PRESUPUESTO_ICONOS_KB,
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

prueba('peso: los tres íconos juntos entran en su propia bolsa', () => {
  // El techo por archivo no alcanza para lo que hay que atrapar: el generador
  // baja los tres PNG sin comprimir —806 KB medidos contra los 217 guardados— y
  // la propia página indica moverlos tal cual a icons/. Eso convertiría a los
  // íconos en casi la mitad de la instalación, y nadie lo vería: los íconos no
  // se miran, se instalan.
  //
  // Es el mismo tipo de guardia que la del caché: el error es invisible y el
  // test es la única forma de que avise.
  const iconos = ASSETS.filter((a) => a.carpeta === 'icons');
  const total = iconos.reduce((s, a) => s + a.kb, 0);

  verdadero(iconos.length === 3, `esperaba tres íconos y hay ${iconos.length}`);
  verdadero(
    total <= PRESUPUESTO_ICONOS_KB,
    `los íconos suman ${total.toFixed(0)} KB y el techo es ${PRESUPUESTO_ICONOS_KB} KB. ` +
      'Si los acabás de generar: pasalos por un compresor de PNG antes de moverlos.'
  );
});

function limiteDe(nombre) {
  const regla = LIMITES_PESO.find((r) => r.patron.test(nombre));
  return regla ? regla.kb : LIMITES_PESO.at(-1).kb;
}

// ---- EL GUARDIÁN DEL DEPLOY ----
//
// Falla si cambió cualquier archivo de ARCHIVOS_CACHE sin que suba
// CACHE_VERSION. Es el cierre del punto 0, que se llevó dos deploys en un día.
//
// POR QUÉ HACE FALTA UN TEST Y NO ALCANZA CON LA DISCIPLINA: el error es
// invisible en todos los lugares donde uno mira. Todo compila, todas las
// pruebas pasan, el push sale bien, GitHub Pages publica — y el teléfono sigue
// mostrando lo de ayer. El fetch del service worker es cache-first puro y el
// activate sólo borra las cachés con nombre distinto de CACHE_VERSION, así que
// sin bump no se vuelve a bajar nada nunca.
//
// Y ya falló de las dos maneras posibles: la primera vez por descuido, y la
// segunda por una decisión razonable —"el bump va al final de todo"— que a la
// escala de cinco commits estaba mal. Cuando la disciplina falla por descuido y
// por criterio, lo que queda es un test.
prueba('deploy: nada cambia en ARCHIVOS_CACHE sin que suba CACHE_VERSION', () => {
  const archivos = archivosSellados(SW);
  const guardada = leerHuella(SW);
  const ahora = huellaDe(archivos, new URL('..', import.meta.url), createHash);

  verdadero(guardada !== null, 'falta HUELLA_CACHE en sw.js');
  verdadero(
    guardada === ahora,
    `el contenido de los ${archivos.length} archivos cacheados da ${ahora} y sw.js dice ${guardada}. ` +
      `CACHE_VERSION está en ${leerVersion(SW)} y no se movió: corré \`node tests/sellar-cache.mjs\`, ` +
      'que sube la versión y reescribe la huella en la misma edición.'
  );
});

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
// Los fondos salen de FRANJAS_DIA y de CLIMAS, que es donde están de verdad.
// Antes salían de un `RUTAS_FONDOS` con dos entradas de cuando el galpón tenía
// dos fondos: este cruce miraba `fondo-dia` y `fondo-noche` y no se enteraba de
// `fondo-amanecer`, `fondo-mediodia`, `fondo-tormenta` ni `fondo-niebla`. Un
// guardián que verifica la mitad de lo que dice verificar es peor que ninguno,
// porque ocupa el lugar del que haría falta.
const RUTAS_DECLARADAS = [
  ...Object.values(RUTAS_SPRITES),
  ...Object.values(RUTAS_OJOS),
  ...Object.values(RUTAS_OJOS_GESTO),
  ...FRANJAS_DIA.map((f) => f.fondo),
  ...Object.values(CLIMAS).map((c) => c.fondo)
];

prueba('caché: las rutas declaradas en config.js existen en el disco', () => {
  const enRepo = new Set(ASSETS.map((a) => `${a.carpeta}/${a.nombre}`));
  const rotas = RUTAS_DECLARADAS.filter((r) => !enRepo.has(r));
  igual(rotas.join(' | '), '', 'rutas de config.js sin archivo');
});

prueba('caché: las rutas declaradas en config.js están cacheadas', () => {
  const fuera = RUTAS_DECLARADAS.filter((r) => !enCache.has(r));
  igual(fuera.join(' | '), '', 'rutas de config.js fuera del caché');
});

// La red del cruce de arriba: si RUTAS_DECLARADAS quedara corta otra vez —una
// tabla nueva que traiga fondos y nadie sume acá— los dos filtros darían cero
// contra cero y pasarían en verde. Todo `sprites/fondo-*.webp` que exista en el
// repo tiene que estar declarado en alguna tabla de config.js.
prueba('caché: no hay fondos en el repo que config.js no declare', () => {
  const enRepo = ASSETS.map((a) => `${a.carpeta}/${a.nombre}`).filter((r) =>
    /^sprites\/fondo-.*\.webp$/.test(r)
  );
  const declaradas = new Set(RUTAS_DECLARADAS);
  const sueltos = enRepo.filter((r) => !declaradas.has(r));
  igual(sueltos.join(' | '), '', 'fondos en sprites/ que ninguna tabla de config.js nombra');
  verdadero(enRepo.length >= 6, `sólo se encontraron ${enRepo.length} fondos en el repo`);
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

  // Lo mismo para la cabeza: el pivote es por pose desde que `feliz` estrenó su
  // recorte, porque ahí la cabeza está corrida siete píxeles y el cuello no cae
  // donde el de idle. Una pose con recorte y sin pivote rotaría alrededor de un
  // punto que en ese dibujo es aire.
  igual(
    Object.keys(RUTAS_CABEZA).sort().join(','),
    Object.keys(PIVOTES_CABEZA).sort().join(','),
    'las poses de RUTAS_CABEZA y las de PIVOTES_CABEZA son las mismas'
  );

  for (const [pose, lados] of Object.entries(BRAZOS)) {
    for (const lado of ['izq', 'der']) {
      const p = lados[lado];
      verdadero(p && p.x > 0 && p.x < 100, `${pose}/${lado}: x=${p?.x} está adentro del lienzo`);
      verdadero(p && p.y > 0 && p.y < 100, `${pose}/${lado}: y=${p?.y} está adentro del lienzo`);
    }
  }
});

// EL ÁNGULO DEPENDE DE QUE EXISTA EL CUERPO RECORTADO, y esto es lo que lo ata.
//
// Antes el techo lo ponía el fleco: la capa rotaba encima del sprite entero, que
// seguía teniendo la parte dibujada, y en el borde asomaba la de abajo. Con eso
// los brazos no podían pasar de 2° ni la cabeza de 1,2°.
//
// Con el cuerpo sin cabeza ni brazos ese problema desaparece —las capas son las
// únicas que las dibujan— y el techo pasa a ser otro: los huecos INTERIORES del
// compuesto, o sea píxeles que en el sprite original tenían dibujo y en las
// cuatro capas juntas quedan transparentes. Medido sobre el compuesto real:
//
//   cabeza 0° / brazos  0°  ->  interior:  75 px   (la reconstrucción, dispersos)
//   cabeza 3° / brazos  5°  ->  interior: 111 px   (0,39%, sin agrupar)
//   cabeza 4° / brazos  7°  ->  interior: 287 px   (todavía tolerable)
//   cabeza 6° / brazos 10°  ->  interior: 701 px   (se degrada)
//
// Los del borde exterior no cuentan: son el fondo apareciendo donde la parte se
// corrió, que es lo que TIENE que pasar.
//
// Este test fija las dos cosas juntas: que ninguna pose rote capas sin tener su
// cuerpo, y que los ángulos no pasen de la banda verificada.
// UNA POSE PUEDE ROTAR SIN TENER SU CUERPO, pero entonces con el ángulo chico.
//
// La regla nació porque `feliz` tenía brazos y no tenía `feliz-cuerpo`: la capa
// rotaba encima del sprite entero y volvía el fleco. Bajar el ángulo para todos
// habría castigado a `idle`, que sí lo tenía, así que el ángulo se elige por
// pose —ver anguloDeBrazo en ui.js— mirando si EXISTE el archivo.
//
// Hoy la deuda está saldada: feliz tiene su cuerpo y su cabeza, y subió sola de
// 2° a 5° sin tocar una línea, que era exactamente lo que la regla prometía. El
// test se queda igual: es lo que va a sostener la próxima pose que estrene capas
// antes que su cuerpo.
prueba('capas: la que no tiene cuerpo se mueve con el ángulo chico', () => {
  const conCapas = new Set([...Object.keys(RUTAS_CABEZA), ...Object.keys(RUTAS_BRAZOS)]);
  const sinCuerpo = [...conCapas].filter((pose) => !(pose in RUTAS_CUERPO));

  verdadero(
    ANGULO_BRAZO_SIN_CUERPO <= 2,
    `sin cuerpo el techo es el del fleco: ${ANGULO_BRAZO_SIN_CUERPO}° tiene que ser 2 o menos`
  );

  // Y el código tiene que estar eligiendo, no usando el grande siempre.
  const UI = readFileSync(join(RAIZ, 'js/ui.js'), 'utf8');
  verdadero(
    /anguloDeBrazo\(/.test(UI) && /RUTAS_CUERPO\[/.test(UI),
    'ui.js elige el ángulo mirando si la pose tiene cuerpo'
  );

  // Esto no es una falla: es el estado de la deuda de arte, anotado.
  verdadero(
    sinCuerpo.length <= 1,
    `poses rotando sin su cuerpo: ${sinCuerpo.join(', ') || 'ninguna'}`
  );
});

prueba('capas: los ángulos no pasan de la banda verificada sobre el compuesto', () => {
  // 4°/7° es el último punto medido que sigue siendo tolerable; de 6°/10° en
  // adelante los huecos interiores se agrupan y se ven.
  verdadero(
    INCLINACION_CABEZA.angulo <= 4,
    `la cabeza está en ${INCLINACION_CABEZA.angulo}° y el máximo verificado es 4`
  );
  verdadero(
    ANGULO_BRAZO <= 7,
    `los brazos están en ${ANGULO_BRAZO}° y el máximo verificado es 7`
  );

  // El saludo comparte el techo de los brazos: es el mismo recorte girando sobre
  // el mismo hombro. A 10-12° —lo que pedía la spec— el fantasma vuelve, así que
  // el recorrido extra se consigue con la duración y el easing, no con el ángulo.
  verdadero(
    SALUDO_BRAZO.angulo <= 7,
    `el saludo está en ${SALUDO_BRAZO.angulo}° y comparte el techo de los brazos`
  );
});

// En `critico` los brazos quedan quietos, y eso es diseño y no un olvido: la
// ausencia de movimiento es información.
prueba('brazos: critico no tiene recortes, y es a propósito', () => {
  verdadero(!('critico' in RUTAS_BRAZOS), 'sin recorte no hay nada que mover');
  verdadero(!('standby' in RUTAS_BRAZOS), 'dormido tampoco');
});

// ---- Las tres caras de la caricia ----
//
// Lo que este archivo NO puede verificar, y conviene decirlo: la ALINEACIÓN. Los
// números de AJUSTE_OJOS salen de medir la huella alfa de los tres recortes, y
// para eso hace falta decodificar webp — que es una dependencia, y no hay
// ninguna. La medición está contada entera en config.js y se verificó mirando
// las tres capas compuestas sobre el cuerpo, a 3x.
//
// Lo que sí se puede atar es que las tablas no se separen y que la corrección
// vaya en la dirección medida.

prueba('ojos: todo estado con recorte de ojos declara su ajuste', () => {
  // ESTA ES LA ENTRADA OBLIGATORIA, y es el guardián del problema que se
  // arregló: AJUSTE_OJOS estaba calibrado contra la cabeza de idle y se usaba
  // igual sobre feliz, cuyas cuencas están en otro lado. Si mañana un tercer
  // estado suma su recorte y no declara su ajuste, hereda el de idle en silencio
  // y vuelve el mismo defecto.
  igual(
    Object.keys(RUTAS_OJOS).sort().join(','),
    Object.keys(AJUSTE_OJOS).sort().join(','),
    'los estados de RUTAS_OJOS y los de AJUSTE_OJOS tienen que ser los mismos'
  );

  // Y cada estado declara las dos caras del gesto, no una.
  for (const [estado, ajuste] of Object.entries(AJUSTE_OJOS)) {
    igual(
      Object.keys(ajuste).sort().join(','),
      Object.keys(RUTAS_OJOS_GESTO).sort().join(','),
      `${estado} tiene que declarar las mismas caras que RUTAS_OJOS_GESTO`
    );
  }
});

prueba('ojos: cada OJO tiene su propio ajuste, y los dos agrandan', () => {
  // El ajuste va por ojo y no por capa: medido, los dos ojos de cada recorte
  // están desnivelados —y el desnivel cambia de signo entre contento y cerrado—
  // y cada uno pide una escala distinta. Un solo número por capa deja bien uno y
  // saca el otro un 10%.
  //
  // Los recortes vienen de poses con la cabeza más chica, así que las dos
  // escalas tienen que ser mayores que 1. Si alguien las deja abajo, la
  // expresión cambia Y ADEMÁS los ojos se achican.
  for (const [estado, porCara] of Object.entries(AJUSTE_OJOS)) {
    for (const [cara, a] of Object.entries(porCara)) {
      const donde = `${estado}/${cara}`;
      verdadero(
        a.corte > 30 && a.corte < 60,
        `${donde}: el corte del hueco está en ${a.corte}%, y tiene que caer cerca del medio`
      );

      for (const lado of ['izq', 'der']) {
        const o = a[lado];
        verdadero(o, `${donde}: falta el ojo ${lado}`);
        verdadero(o.escala > 1, `${donde}/${lado}: escala ${o.escala}, y el recorte es más chico`);
        verdadero(o.escala < 1.3, `${donde}/${lado}: escala ${o.escala} es demasiada para un encuadre`);
        verdadero(
          Number.isFinite(o.x) && Number.isFinite(o.y),
          `${donde}/${lado}: el corrimiento tiene que ser un par de números`
        );
        // Los recortes de gesto están DIBUJADOS a la derecha de donde van, en las
        // dos cabezas, así que la corrección horizontal empuja para la derecha
        // siempre. El vertical NO tiene un signo fijo: sobre idle hay que subir
        // los dos, y sobre feliz el ojo derecho baja, porque su cuenca está 5 px
        // más abajo que la de idle. Fijar el signo del `y` sería fijar la cabeza.
        verdadero(o.x > 0, `${donde}/${lado}: x = ${o.x}, y los recortes van a la derecha`);
      }
    }
  }
});

// ---- QUE EL SONIDO VUELVA AL REABRIR ----
//
// El punto 7. El ajuste se guardaba bien y el toggle aparecía en "activado" al
// reabrir, pero no sonaba nada: `encender()` SÓLO se llamaba desde el toggle, así
// que nadie prendía el audio en el arranque. Un estado que se contradice: la
// interfaz decía que el sonido estaba puesto y el galpón estaba mudo.
//
// No se puede arreglar llamando a `encender(true)` al arrancar —el navegador
// exige un gesto del usuario y el arranque no lo es— así que el arreglo es
// enganchar el PRIMER TOQUE de la sesión, sea cual sea.
//
// Se verifica leyendo el código y no ejecutándolo, y el motivo vale anotarlo: en
// este banco NO se puede probar que salga sonido. Los eventos sintéticos no
// producen activación de usuario —medido: `navigator.userActivation.hasBeenActive`
// queda en false— así que el navegador deja el AudioContext suspendido y el
// <audio> ni siquiera descarga. Lo que sí se midió, con eventos sintéticos: antes
// del toque hay 0 elementos <audio> y el toggle en "activado"; después del primero
// hay 2 con el ambiente de la franja puesto; después del segundo siguen siendo 2,
// o sea que el listener se borró solo. Que suene lo prueba Damián en el teléfono.

const MAIN_JS = readFileSync(join(RAIZ, 'js/main.js'), 'utf8');

prueba('sonido: el ajuste guardado se rescata con el primer toque de la sesión', () => {
  verdadero(
    /export function arrancarConElPrimerGesto/.test(SONIDO_JS),
    'sonido.js tiene que ofrecer el enganche del primer gesto'
  );
  verdadero(
    /arrancarConElPrimerGesto\(/.test(MAIN_JS),
    'main.js tiene que cablearlo en el arranque, o el ajuste guardado no prende nada'
  );
  verdadero(
    /addEventListener\('pointerdown'[\s\S]{0,120}once:\s*true/.test(SONIDO_JS),
    'el listener va en `once`: si no, cada toque volvería a intentar prender'
  );
  verdadero(
    /capture:\s*true/.test(SONIDO_JS),
    'y en captura, para que ningún stopPropagation de más arriba se lo coma'
  );
});

prueba('sonido: el ajuste se consulta al tocar, no al armar el listener', () => {
  // Entre el arranque y el primer toque el jugador puede haber apagado el
  // sonido. Si el valor se congelara al armar, ese toque prendería algo que el
  // jugador ya apagó.
  verdadero(
    /consultarAjuste\s*=\s*ajuste/.test(SONIDO_JS) && /if \(!consultarAjuste\(\)\) return;/.test(SONIDO_JS),
    'tiene que guardarse la función y llamarse en el momento del toque'
  );
});

prueba('sonido: un resume rechazado vuelve a armar el gesto', () => {
  // El peor estado posible es el silencioso: contexto suspendido, `encendido` en
  // true, las capas creadas y el <audio> sin descargar. Medido en ese estado:
  // readyState 0 y networkState 2 nueve segundos después, con el mismo archivo
  // bajando por fetch en 8 ms. Antes el resultado de `resume()` se tiraba a la
  // basura y no había nada que lo rescatara.
  const rescates = SONIDO_JS.match(/armarElGesto\b/g) || [];
  verdadero(
    rescates.length >= 4,
    `armarElGesto aparece ${rescates.length} veces: hacen falta la definición, el ` +
      'export, el rescate del resume de encender() y el de reanudar()'
  );
  verdadero(
    /\.resume\(\)\s*\n?\s*\.catch\(armarElGesto\)/.test(SONIDO_JS) ||
      /resume\(\)\.catch\(armarElGesto\)/.test(SONIDO_JS),
    'encender() tiene que mirar si el resume falló'
  );
});
