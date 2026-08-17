// El sistema de colección: qué deja una visita, qué no vuelve a dejar, el techo
// por visita, la rareza y la garantía diaria de cadencia.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prueba, igual, cerca, verdadero } from './runner.js';
import { T0 } from './config.pruebas.js';
import {
  VERSION_ESTADO,
  PROBABILIDAD_OBJETO_RARO,
  MAX_OBJETOS_POR_VISITA,
  TIERS_OBJETO,
  HORAS_MINIMAS_EVENTO,
  BASES_OBJETO,
  LIENZO_OBJETO,
  PIEZAS_POR_ESTANTE,
  ESTANTES,
  VUELO_OBJETO,
  CABLE,
  RECORRIDO_CABLE
} from '../js/config.js';
import { OBJETOS, objetosDelEvento, objetoPorId } from '../js/datos-objetos.js';
import { EVENTOS } from '../js/datos-eventos.js';
import {
  otorgarPorEventos,
  tiene,
  objetosConEstado,
  guardarLoDelPiso,
  sortearDelPiso
} from '../js/coleccion.js';
import {
  svgDeObjeto,
  tieneForma,
  caminoDeVuelo,
  picoDelVuelo,
  lineaDelCable,
  cintaDelCable,
  grosorDelCable
} from '../js/formas.js';
import { diaLocal, horasConGarantiaDiaria } from '../js/eventos.js';
import { cargarEstado, guardarEstado } from '../js/estado.js';

// Porteros deterministas para la tirada de rareza.
const RARO_SI = () => 0;
const RARO_NO = () => 1;

// Un evento cualquiera del pool, por id.
const evento = (id) => EVENTOS.find((e) => e.id === id);

// El evento 8 es el caso interesante: deja tres objetos, dos comunes y un raro.
const EVENTO_TRES = evento('evento-08');
const EVENTO_UNO = evento('evento-06'); // la tuerca, un solo común
const EVENTO_PURO = evento('evento-16'); // miró la lluvia: no deja nada

// ---- El catálogo ----

prueba('objetos: el catálogo es coherente', () => {
  const ids = new Set(OBJETOS.map((o) => o.id));
  igual(ids.size, OBJETOS.length, 'no hay ids repetidos');
  verdadero(
    OBJETOS.every((o) => Object.values(TIERS_OBJETO).includes(o.tier)),
    'todos los tiers son conocidos'
  );
  verdadero(
    OBJETOS.every((o) => typeof o.nombre === 'string' && o.nombre.length > 0),
    'todos tienen nombre'
  );
});

prueba('objetos: la línea del canon sale del evento y no de una copia', () => {
  for (const objeto of OBJETOS) {
    const suyo = evento(objeto.eventoId);
    verdadero(suyo !== undefined, `${objeto.id} apunta a un evento que existe`);
    igual(objeto.canon, suyo.texto, `${objeto.id} muestra el texto del evento que lo trajo`);
  }
});

prueba('objetos: el evento 8 deja tres, y uno es el raro', () => {
  const delOcho = objetosDelEvento('evento-08');
  igual(delOcho.length, 3, 'resorte, arandela y la-cosa');
  igual(
    delOcho.filter((o) => o.tier === TIERS_OBJETO.raro).length,
    1,
    'uno solo es raro'
  );
});

prueba('objetos: un evento sin objeto no tiene nada colgado', () => {
  igual(objetosDelEvento('evento-16').length, 0, 'miró la lluvia no deja nada');
  igual(objetoPorId('no-existe'), null, 'un id desconocido no rompe');
});

// ---- Otorgamiento ----

prueba('colección: el evento que trae objeto lo otorga', () => {
  const { coleccion, nuevos } = otorgarPorEventos([], [EVENTO_UNO], RARO_NO);
  igual(nuevos.length, 1, 'salió un objeto');
  igual(nuevos[0].id, 'tuerca-cabeza', 'y es el de ese evento');
  verdadero(tiene(coleccion, 'tuerca-cabeza'), 'quedó en la colección');
});

prueba('colección: un evento puro no deja nada', () => {
  const { coleccion, nuevos } = otorgarPorEventos([], [EVENTO_PURO], RARO_SI);
  igual(nuevos.length, 0, 'ningún objeto');
  igual(coleccion.length, 0, 'la colección no se toca');
});

prueba('colección: sin eventos no pasa nada', () => {
  const { coleccion, nuevos } = otorgarPorEventos(['tuerca-cabeza'], [], RARO_SI);
  igual(nuevos.length, 0, 'nada nuevo');
  igual(coleccion.join(), 'tuerca-cabeza', 'la colección queda igual');
});

prueba('colección: no se otorga dos veces el mismo objeto', () => {
  const primera = otorgarPorEventos([], [EVENTO_UNO], RARO_NO);
  const segunda = otorgarPorEventos(primera.coleccion, [EVENTO_UNO], RARO_NO);

  igual(segunda.nuevos.length, 0, 'la segunda vez no deja nada');
  igual(segunda.coleccion.length, 1, 'la colección no crece');
  igual(segunda.coleccion.join(), primera.coleccion.join(), 'y es la misma');
});

prueba('colección: el evento sigue saliendo aunque su objeto ya esté', () => {
  // La decisión documentada: el objeto no se repite, el evento sí. Se comprueba
  // que otorgarPorEventos no toque el pool de eventos ni lo filtre.
  const { nuevos } = otorgarPorEventos(['tuerca-cabeza'], [EVENTO_UNO], RARO_NO);
  igual(nuevos.length, 0, 'no otorga de nuevo');
  verdadero(
    EVENTOS.some((e) => e.id === EVENTO_UNO.id),
    'y el evento sigue en el pool, para salir como evento puro'
  );
});

prueba('colección: no muta la colección que recibe', () => {
  const original = ['tuerca-cabeza'];
  const { coleccion } = otorgarPorEventos(original, [evento('evento-09')], RARO_NO);

  igual(original.length, 1, 'la de entrada quedó intacta');
  igual(coleccion.length, 2, 'la nueva tiene el objeto agregado');
});

// ---- Rareza ----

prueba('rareza: la probabilidad es una fracción, no un porcentaje', () => {
  verdadero(
    PROBABILIDAD_OBJETO_RARO > 0 && PROBABILIDAD_OBJETO_RARO < 1,
    `${PROBABILIDAD_OBJETO_RARO} está entre 0 y 1 (4 sería 400%)`
  );
});

prueba('rareza: con el portero cerrado salen los comunes y no el raro', () => {
  const { nuevos } = otorgarPorEventos([], [EVENTO_TRES], RARO_NO);
  igual(nuevos.length, 2, 'los dos comunes del evento 8');
  verdadero(
    nuevos.every((o) => o.tier === TIERS_OBJETO.comun),
    'ninguno es raro'
  );
});

prueba('rareza: con el portero abierto sale también el raro', () => {
  const { nuevos } = otorgarPorEventos([], [EVENTO_TRES], RARO_SI);
  igual(nuevos.length, 3, 'los tres del evento 8');
  igual(
    nuevos.filter((o) => o.tier === TIERS_OBJETO.raro).length,
    1,
    'el raro entró'
  );
});

prueba('rareza: el umbral es estricto', () => {
  const { nuevos } = otorgarPorEventos([], [EVENTO_TRES], () => PROBABILIDAD_OBJETO_RARO);
  verdadero(
    nuevos.every((o) => o.tier !== TIERS_OBJETO.raro),
    'caer exactamente en la probabilidad NO otorga el raro'
  );
});

prueba('rareza: se tira una sola vez por visita', () => {
  let tiradas = 0;
  const contar = () => {
    tiradas++;
    return 1;
  };

  otorgarPorEventos([], [EVENTO_TRES, EVENTO_TRES], contar);
  igual(tiradas, 1, 'dos eventos con raro a tiro, una sola moneda');
});

prueba('rareza: una visita sin raros a tiro no gasta la tirada', () => {
  let tiradas = 0;
  otorgarPorEventos([], [EVENTO_UNO], () => {
    tiradas++;
    return 0;
  });
  igual(tiradas, 0, 'ni se tiró');
});

// ---- Techo por visita ----

prueba('cap: una visita no puede dejar más de MAX_OBJETOS_POR_VISITA', () => {
  // El peor caso realista: dos eventos con objeto en la misma visita, uno de
  // ellos el que deja tres, y el raro saliendo.
  const { nuevos, coleccion } = otorgarPorEventos([], [EVENTO_TRES, EVENTO_UNO], RARO_SI);

  igual(nuevos.length, MAX_OBJETOS_POR_VISITA, 'se corta en el techo');
  igual(coleccion.length, MAX_OBJETOS_POR_VISITA, 'y la colección crece lo mismo');
});

prueba('cap: el techo está en el rango que pide el brief', () => {
  verdadero(
    MAX_OBJETOS_POR_VISITA >= 1 && MAX_OBJETOS_POR_VISITA <= 3,
    `${MAX_OBJETOS_POR_VISITA} está entre 1 y 3`
  );
});

prueba('cap: lo que no entró queda para la próxima visita', () => {
  const primera = otorgarPorEventos([], [EVENTO_TRES, EVENTO_UNO], RARO_SI);
  const segunda = otorgarPorEventos(primera.coleccion, [EVENTO_UNO], RARO_NO);

  verdadero(
    primera.nuevos.every((o) => o.id !== 'tuerca-cabeza'),
    'la tuerca no entró en la primera'
  );
  igual(segunda.nuevos.length, 1, 'y entra en la siguiente');
  igual(segunda.nuevos[0].id, 'tuerca-cabeza', 'nada se pierde, sólo se posterga');
});

// ---- La vista del pool ----

prueba('estante: el pool completo se ve, obtenido o no', () => {
  const conEstado = objetosConEstado(['tuerca-cabeza']);

  igual(conEstado.length, OBJETOS.length, 'están todos, no sólo los obtenidos');
  igual(conEstado.filter((o) => o.obtenido).length, 1, 'uno marcado como obtenido');
  verdadero(
    conEstado.find((o) => o.id === 'tuerca-cabeza').obtenido,
    'y es el que corresponde'
  );
});

// ---- Cadencia: la garantía diaria ----

prueba('cadencia: el primer regreso del día siempre trae algo', () => {
  const horas = horasConGarantiaDiaria(0.1, '2026-01-14', T0);
  verdadero(horas >= HORAS_MINIMAS_EVENTO, '10 minutos alcanzan si el día está sin estrenar');
});

prueba('cadencia: volver de nuevo el mismo día no regala otro evento', () => {
  const hoy = diaLocal(T0);
  igual(horasConGarantiaDiaria(0.1, hoy, T0), 0.1, 'las horas quedan como estaban');
});

prueba('cadencia: la garantía es un piso, no un techo', () => {
  igual(horasConGarantiaDiaria(30, '2026-01-14', T0), 30, 'una ausencia larga no se recorta');
  igual(horasConGarantiaDiaria(30, diaLocal(T0), T0), 30, 'ni con el día ya estrenado');
});

prueba('cadencia: una partida nueva cuenta como día sin estrenar', () => {
  const horas = horasConGarantiaDiaria(0, null, T0);
  verdadero(horas >= HORAS_MINIMAS_EVENTO, 'ultimoDiaConEvento null trae evento');
});

prueba('cadencia: el día es local y cambia a la medianoche', () => {
  const antes = new Date(2026, 0, 15, 23, 50, 0).getTime();
  const despues = new Date(2026, 0, 16, 0, 10, 0).getTime();

  verdadero(diaLocal(antes) !== diaLocal(despues), '23:50 y 00:10 son días distintos');
  igual(diaLocal(antes), '2026-01-15', 'formato YYYY-MM-DD con ceros');
  igual(diaLocal(despues), '2026-01-16', 'y el día siguiente');
});

// ---- Migración del save ----

prueba('migración v3 -> v4: agrega colección y día sin tocar lo viejo', () => {
  guardarEstado({
    nombre: 'Chip',
    bateria: 42.5,
    humor: 17.25,
    mantenimiento: 88,
    ultimaVisita: T0,
    creado: T0,
    ultimosEventosIds: ['evento-04', 'evento-07'],
    version: 3
  });

  const migrado = cargarEstado();

  igual(migrado.version, VERSION_ESTADO, 'la versión queda al día');
  verdadero(Array.isArray(migrado.coleccion), 'coleccion es un array');
  igual(migrado.coleccion.length, 0, 'arranca vacía');
  igual(migrado.ultimoDiaConEvento, null, 'y sin día estrenado');
  igual(migrado.bateria, 42.5, 'bateria intacta');
  igual(migrado.ultimaVisita, T0, 'ultimaVisita intacta: el decay se sigue cobrando bien');
  igual(migrado.ultimosEventosIds.join(), 'evento-04,evento-07', 'las exclusiones sobreviven');
});

prueba('migración: una colección ya guardada no se pisa con el default', () => {
  guardarEstado({
    ...JSON.parse(JSON.stringify({
      nombre: 'Chip',
      bateria: 50,
      humor: 50,
      mantenimiento: 50,
      ultimaVisita: T0,
      creado: T0,
      ultimosEventosIds: [],
      coleccion: ['tuerca-cabeza', 'resorte'],
      ultimoDiaConEvento: '2026-01-15',
      version: 3
    }))
  });

  const migrado = cargarEstado();

  igual(migrado.coleccion.join(), 'tuerca-cabeza,resorte', 'lo guardado gana sobre el default');
  igual(migrado.ultimoDiaConEvento, '2026-01-15', 'y el día también');
});

prueba('migración v1 -> v4: un save prehistórico llega entero', () => {
  guardarEstado({
    nombre: 'Chip',
    bateria: 30,
    humor: 40,
    mantenimiento: 50,
    ultimaVisita: T0,
    creado: T0,
    version: 1
  });

  const migrado = cargarEstado();

  igual(migrado.version, VERSION_ESTADO, 'queda en la última');
  verdadero(Array.isArray(migrado.ultimosEventosIds), 'tiene los campos de v3');
  verdadero(Array.isArray(migrado.coleccion), 'y los de v4');
  igual(migrado.bateria, 30, 'con los stats de siempre');
});

// ---- Las formas ----

prueba('formas: todos los objetos del catálogo tienen la suya', () => {
  for (const objeto of OBJETOS) {
    verdadero(tieneForma(objeto.id), `${objeto.id} tiene forma propia y no cae al casillero vacío`);
  }
});

prueba('formas: el SVG sale armado y con el viewBox compartido', () => {
  const svg = svgDeObjeto('tuerca-cabeza');
  verdadero(svg.startsWith('<svg viewBox="0 0 24 24"'), 'mismo viewBox para todas, la escala la da el CSS');
  verdadero(svg.includes('aria-hidden'), 'la forma no habla: el nombre lo pone el aria-label del nodo');
});

prueba('formas: un id desconocido devuelve el casillero vacío y no rompe', () => {
  const svg = svgDeObjeto('no-existe');
  verdadero(svg.includes('<svg'), 'devuelve algo dibujable igual');
  verdadero(!tieneForma('no-existe'), 'y avisa que no era propia');
});

// ---- Lo que quedó tirado en el piso ----
//
// Es un extra ocasional que CONVIVE con los eventos, no un reemplazo. Estas
// pruebas cubren las dos reglas que lo hacen coherente: sólo puede aparecer lo
// que Chip todavía no tiene, y lo que no se levantó se guarda solo a la próxima.

prueba('piso: lo que quedó tirado entra a la colección tal cual', () => {
  const antes = ['tuerca-cabeza'];
  const despues = guardarLoDelPiso(antes, 'resorte');

  igual(despues.join(','), 'tuerca-cabeza,resorte', 'se sumó al final');
  igual(antes.join(','), 'tuerca-cabeza', 'y la colección original no se tocó');
});

prueba('piso: sin nada tirado no cambia nada, y devuelve la MISMA referencia', () => {
  const antes = ['tuerca-cabeza'];

  verdadero(guardarLoDelPiso(antes, null) === antes, 'sin objeto, el mismo array');
  // Un objeto que ya está no se suma dos veces. No debería poder pasar —lo del
  // piso se guarda antes de repartir— pero si el orden se rompiera algún día,
  // el síntoma sería una pieza duplicada en el estante y no un error.
  verdadero(
    guardarLoDelPiso(antes, 'tuerca-cabeza') === antes,
    'y algo que ya está tampoco se duplica'
  );
});

prueba('piso: sólo puede caer algo que Chip todavía no tiene', () => {
  const casiTodo = OBJETOS.slice(0, -1).map((o) => o.id);
  const ultimo = OBJETOS[OBJETOS.length - 1].id;

  // Con todo menos uno, sea cual sea la moneda, sólo puede salir ese uno.
  for (const moneda of [0, 0.5, 0.999]) {
    igual(sortearDelPiso(casiTodo, () => moneda), ultimo, `con ${moneda} sale el único que falta`);
  }
});

prueba('piso: con la colección completa no cae nada', () => {
  const todo = OBJETOS.map((o) => o.id);
  igual(sortearDelPiso(todo, () => 0.5), null, 'no queda nada que Chip pueda haber encontrado');
});

prueba('piso: el sorteo recorre TODO el pool que falta y no se atasca en uno', () => {
  const salidas = new Set();
  const n = OBJETOS.length;

  for (let i = 0; i < n; i++) {
    salidas.add(sortearDelPiso([], () => (i + 0.5) / n));
  }

  igual(salidas.size, n, 'cada casillero de la moneda cae en un objeto distinto');
});

prueba('piso: la moneda al ras del 1 no se sale del pool', () => {
  // Math.random() nunca devuelve 1, pero un doble inyectado sí puede, y un
  // índice fuera de rango acá sería un `undefined.id` en producción.
  verdadero(sortearDelPiso([], () => 0.9999999999) !== null, 'sigue devolviendo un objeto');
});

// ---- El arco del vuelo al estante ----
//
// Esta prueba existe por un error concreto: la primera versión ponía el punto de
// control a la altura pedida y daba por hecho que la curva pasaba por ahí. Medido
// en el navegador, subía 1,9% en vez de 11 — el vuelo era una diagonal. Una
// cuadrática no pasa por su control, y eso no se ve mirando el código.

prueba('vuelo: el arco sube EXACTAMENTE lo que se le pide', () => {
  const desde = { x: 403, y: 762 };
  const hasta = { x: 359, y: 331 };

  for (const altura of [20, 57, 104, 200]) {
    const pico = picoDelVuelo(desde, hasta, altura);
    cerca(
      Math.min(desde.y, hasta.y) - pico.y,
      altura,
      'con altura ' + altura + ' el vértice queda a esa distancia del punto más alto'
    );
  }
});

prueba('vuelo: el vértice cae ADENTRO de la curva, no después del final', () => {
  // La otra raíz de la cuadrática da un t mayor que 1: un vértice que la curva
  // nunca alcanza, que es exactamente el arco falso del que venimos.
  const pico = picoDelVuelo({ x: 403, y: 762 }, { x: 359, y: 331 }, 57);

  verdadero(pico.t > 0 && pico.t < 1, 't=' + pico.t.toFixed(3) + ' está entre 0 y 1');
});

prueba('vuelo: el camino arranca y termina en los dos puntos que se le dieron', () => {
  const d = caminoDeVuelo({ x: 100, y: 800 }, { x: 300, y: 200 }, 50);

  verdadero(d.startsWith('M 100.0 800.0'), 'arranca en la salida: ' + d);
  verdadero(d.endsWith('300.0 200.0'), 'y termina en la llegada: ' + d);
  verdadero(d.includes(' Q '), 'y es una cuadrática');
});

prueba('vuelo: sale un path que el CSS puede parsear', () => {
  const d = caminoDeVuelo({ x: 1, y: 2 }, { x: 3, y: 4 }, 5);

  verdadero(
    /^M -?\d+\.\d \S+ Q -?\d+\.\d \S+ -?\d+\.\d \S+$/.test(d.replace(/ -?\d+\.\d(?= |$)/g, ' N').replace(/N/g, '0.0')) ||
      /^M [-\d.]+ [-\d.]+ Q [-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+$/.test(d),
    'forma del path: ' + d
  );
  verdadero(!d.includes('NaN'), 'y sin NaN, que en offset-path es un elemento que no se mueve');
});

prueba('vuelo: la altura de config da un arco que se ve, no una diagonal', () => {
  // El tramo real medido en la escena: del piso (y 80,7%) al estante (y 35,1%).
  // Con el bug viejo el arco subía 1,9 puntos y eso se lee como una recta.
  const alto = 945;
  const desde = { x: 0.84 * 480, y: 0.807 * alto };
  const hasta = { x: 0.916 * 480, y: 0.351 * alto };
  const pico = picoDelVuelo(desde, hasta, (VUELO_OBJETO.altura / 100) * alto);

  const sube = ((hasta.y - pico.y) / alto) * 100;
  cerca(sube, VUELO_OBJETO.altura, 'sube los ' + VUELO_OBJETO.altura + ' puntos de config');
  verdadero(sube > 3, 'y más de tres puntos, que es donde deja de leerse como una recta');
});

// ---- El pool completo: 36 objetos ----

prueba('pool: son 36, con la distribución que fija el brief', () => {
  igual(OBJETOS.length, 36, 'las 8 iniciales más las 28 nuevas');

  const comunes = OBJETOS.filter((o) => o.tier === TIERS_OBJETO.comun).length;
  const raros = OBJETOS.filter((o) => o.tier === TIERS_OBJETO.raro).length;

  igual(comunes, 30, 'treinta comunes');
  igual(raros, 6, 'seis raros');
  verdadero(raros / OBJETOS.length < 0.2, `la rareza queda en ${((raros / OBJETOS.length) * 100).toFixed(0)}%, bajo el 20% del brief`);
});

prueba('pool: cada objeto tiene su silueta dibujada', () => {
  const sin = OBJETOS.filter((o) => !tieneForma(o.id)).map((o) => o.id);
  igual(sin.join(', '), '', 'un objeto sin forma cae al casillero vacío y no se distingue de otro');
});

prueba('pool: cada objeto tiene su línea de apoyo medida', () => {
  const sin = OBJETOS.filter((o) => !(o.id in BASES_OBJETO)).map((o) => o.id);
  igual(sin.join(', '), '', 'sin base, la pieza cae al default y flota o se hunde en la tabla');
});

prueba('pool: ninguna base se sale del lienzo', () => {
  const fuera = Object.entries(BASES_OBJETO)
    .filter(([, v]) => v <= 0 || v > LIENZO_OBJETO)
    .map(([k, v]) => `${k}=${v}`);
  igual(fuera.join(', '), '', `todas entre 0 y ${LIENZO_OBJETO}`);
});

prueba('pool: no hay dos objetos con la misma silueta', () => {
  const vistas = new Map();
  const repetidas = [];

  for (const o of OBJETOS) {
    const svg = svgDeObjeto(o.id);
    if (vistas.has(svg)) repetidas.push(`${vistas.get(svg)} y ${o.id}`);
    else vistas.set(svg, o.id);
  }

  igual(repetidas.join(' | '), '', 'dos piezas idénticas en el estante no se pueden distinguir');
});

// LA FAMILIA ORGÁNICA TIENE QUE NOTARSE DISTINTA, y eso es canon, no estilo.
//
// Son lo único no metálico de una colección de metal, y existen para decir que
// afuera hay otra cosa y que Chip lo notó. Si alguna vez alguien las "unifica"
// con el resto de la paleta, la familia deja de decir eso y pasa a ser cinco
// chatarras más. Este test es el que lo impide.
const ORGANICOS = ['hoja-seca', 'piedra-lisa', 'pluma', 'papel-humedad', 'semilla-alas'];

prueba('pool: la familia de afuera usa su propia paleta y no la del metal', () => {
  for (const id of ORGANICOS) {
    const svg = svgDeObjeto(id);
    verdadero(svg.includes('--organico'), `${id} usa la paleta orgánica`);
    verdadero(!svg.includes('var(--metal)'), `${id} NO usa el gris del metal`);
    verdadero(!svg.includes('var(--filo)'), `${id} NO usa el filo negro duro del resto`);
  }
});

prueba('pool: y ninguna pieza de metal se coló en la paleta orgánica', () => {
  const coladas = OBJETOS.filter(
    (o) => !ORGANICOS.includes(o.id) && svgDeObjeto(o.id).includes('--organico')
  ).map((o) => o.id);

  igual(coladas.join(', '), '', 'la paleta cálida es de las cinco de afuera y de ninguna más');
});

// El estante ya no es el inventario: con 36 piezas no entran. Muestra las
// últimas y el menú muestra todas. Ver pintarEstante.
prueba('pool: el estante no pretende mostrar las 36', () => {
  const capacidad = PIEZAS_POR_ESTANTE * ESTANTES;
  verdadero(capacidad < OBJETOS.length, `entran ${capacidad} y el pool son ${OBJETOS.length}`);
  igual(capacidad, 8, 'cuatro por tabla, dos tablas');
});

// ---- El cable: dos propiedades geométricas ----
//
// Las dos salieron de defectos medidos en producción y las dos se comprueban
// solas, sin navegador: son geometría, no pintura.

const RAIZ_CSS = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ESCENA = { ancho: 480, alto: 889 };
const enPx = (p) => ({ ...p, x: (p.x / 100) * ESCENA.ancho, y: (p.y / 100) * ESCENA.alto });
const RUTA = {
  apoyo: enPx(RECORRIDO_CABLE.apoyo),
  quiebres: RECORRIDO_CABLE.quiebres.map(enPx),
  llegada: enPx(RECORRIDO_CABLE.llegada)
};
const CONECTOR = { x: 250.6, y: 662.5 };

prueba('cable: la línea media ARRANCA en el conector', () => {
  // El defecto era otro: se creía que el cable nacía en el borde del canvas. No
  // era cierto —era una confusión de sistemas de coordenadas, comparar unidades
  // del viewBox contra píxeles de página— pero la propiedad vale igual, porque
  // el día que alguien meta un corrimiento en el origen esto lo agarra.
  const linea = lineaDelCable(CONECTOR, RUTA, CABLE);
  const d = Math.hypot(linea[0].x - CONECTOR.x, linea[0].y - CONECTOR.y);

  verdadero(d < 1, `arranca a ${d.toFixed(2)} px del conector, y la tolerancia es 1`);
});

prueba('cable: sale PERPENDICULAR al pecho, no tangente', () => {
  // Un cable que corre pegado al cuerpo se lee apoyado por más que su origen sea
  // exacto. El primer tramo tiene que bajar, no irse de costado.
  const linea = lineaDelCable(CONECTOR, RUTA, CABLE);
  const dx = linea[1].x - linea[0].x;
  const dy = linea[1].y - linea[0].y;
  const grados = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;

  verdadero(grados > 75, `el primer tramo baja a ${grados.toFixed(1)}° de la horizontal`);
});

prueba('cable: ninguna muestra de la línea media salta más que el paso', () => {
  // ESTE es el defecto real que se midió: la línea media venía de dos fuentes
  // con densidades distintas y en los tramos rectos largos no había muestras
  // intermedias. Entre dos consecutivas había hasta 63 px contra los 3 o 4 del
  // resto, y con eso el grosor se afinaba de golpe en el extremo del tramo.
  const linea = lineaDelCable(CONECTOR, RUTA, CABLE);
  let max = 0;

  for (let i = 1; i < linea.length; i++) {
    max = Math.max(max, Math.hypot(linea[i].x - linea[i - 1].x, linea[i].y - linea[i - 1].y));
  }

  verdadero(
    max <= CABLE.pasoMuestreo + 0.01,
    `el salto máximo es ${max.toFixed(2)} px y el paso es ${CABLE.pasoMuestreo}`
  );
});

prueba('cable: la cinta no se pliega sobre sí misma en ninguna curva', () => {
  // El borde interno de un giro recorre menos que la línea media, y si el radio
  // es menor que el medio ancho de la cinta, se cruza: eso es un pico.
  //
  // EL TOPE BAJÓ DE 8 A 5, y con el de 8 pasaba un corte que se veía: 7,08 px en
  // (233,7 · 747,5), el codo donde el cable tocaba el piso y giraba. El número
  // ya no se escribe acá — sale de CABLE.saltoMaximo, que es el MISMO que usa
  // cintaDelCable para clampear el ancho contra la curvatura. Si alguien lo
  // cambia, el clampeo y el test se mueven juntos y no puede quedar uno sin el
  // otro.
  const { atras, adelante } = cintaDelCable(
    CONECTOR,
    RUTA,
    CABLE,
    CABLE.entraAlCuerpo,
    (RECORRIDO_CABLE.pasaDetras / 100) * ESCENA.alto
  );

  // Cada capa puede traer DOS polígonos: la de atrás es la punta que entra al
  // puerto más todo lo que queda más lejos que Chip. Se parten por la M, porque
  // el salto de un subpath al siguiente no es una muestra.
  for (const [nombre, d] of [['atrás', atras], ['adelante', adelante]]) {
    for (const trozo of d.split('M').filter((t) => t.trim())) {
      const p = [...('M' + trozo).matchAll(/([ML])\s+([-\d.]+)\s+([-\d.]+)/g)].map((m) => ({
        x: +m[2],
        y: +m[3]
      }));
      const mitad = p.length / 2;
      let max = 0;

      // Se saltea la vuelta del polígono —el paso de un borde al otro— porque
      // ahí el salto vale el ANCHO del cable por definición, no es una muestra.
      for (let i = 1; i < p.length; i++) {
        if (i === mitad) continue;
        max = Math.max(max, Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y));
      }

      verdadero(
        max <= CABLE.saltoMaximo + 0.01,
        `${nombre}: salto máximo ${max.toFixed(2)} px, tope ${CABLE.saltoMaximo}`
      );
    }
  }
});

// LA PERSPECTIVA, que es lo que hace que el galpón se lea grande.
//
// No alcanza con que el cable se afine: tiene que afinarse MUCHO. A 3,25 a 1
// —que es, de hecho, la reducción físicamente correcta para este encuadre—
// conserva cuerpo en todo el recorrido y compite con Chip.
prueba('cable: la reducción de grosor es de 7 a 1 o más', () => {
  const cerca = grosorDelCable(0, CABLE);
  const lejos = grosorDelCable(1, CABLE);
  const relacion = cerca / lejos;

  verdadero(
    relacion >= 7,
    `el cable va de ${cerca} px a ${lejos.toFixed(2)}: ${relacion.toFixed(2)} a 1, y se pidió 7 u 8`
  );
  verdadero(lejos >= 1.5, `el extremo lejano mide ${lejos.toFixed(2)} px y por debajo de 1,5 desaparece`);
  verdadero(lejos <= 2, `el extremo lejano mide ${lejos.toFixed(2)} px y se pidió 1,5-2`);
});

// EL TRAMO DEL PISO SE ALEJA, y esto es lo que la versión anterior no hacía.
//
// El recorrido viejo corría entre 83,5% y 84,3% de punta a punta mientras su `z`
// declarada subía de 0,05 a 0,3: la posición decía "misma profundidad" y el
// grosor decía "me voy al fondo". Un cable que corre por una horizontal se lee
// pegado al borde de adelante del piso.
prueba('cable: el tramo del piso sube en pantalla a medida que se aleja', () => {
  const enPiso = [RECORRIDO_CABLE.apoyo, ...RECORRIDO_CABLE.quiebres].filter(
    (p) => p.y > RECORRIDO_CABLE.pasaDetras - 12
  );

  for (let i = 1; i < enPiso.length; i++) {
    verdadero(
      enPiso[i].y < enPiso[i - 1].y && enPiso[i].x > enPiso[i - 1].x,
      `el punto en x=${enPiso[i].x} tiene que estar más arriba y más a la derecha que el anterior`
    );
  }

  // Y el avance a lo ancho tiene que ser el que manda en ese tramo: es el que
  // cuenta la distancia.
  const ancho = Math.abs(enPiso.at(-1).x - enPiso[0].x) * 4.8; // px en 480
  const alto = Math.abs(enPiso.at(-1).y - enPiso[0].y) * 8.89; // px en 889
  verdadero(ancho > alto, `el tramo del piso avanza ${ancho.toFixed(0)} px a lo ancho y ${alto.toFixed(0)} a lo alto`);
});

// EL CABLE PASA DETRÁS DE CHIP cuando se aleja más que él, y el número que lo
// decide es su línea de apoyo. Si --piso-chip cambia y esto no, el cable le
// cruza el cuerpo con una franja gris o se le esconde de más.
prueba('cable: la línea donde pasa atrás es la línea donde Chip apoya', () => {
  const CSS = readFileSync(join(RAIZ_CSS, 'style.css'), 'utf8');
  const m = CSS.match(/--piso-chip:\s*([\d.]+)%/);
  verdadero(Boolean(m), 'style.css declara --piso-chip');
  igual(
    RECORRIDO_CABLE.pasaDetras,
    100 - Number(m[1]),
    'pasaDetras es el complemento de --piso-chip'
  );
});

prueba('cable: el afinado tiene piso y nunca desaparece', () => {
  for (const z of [0, 0.5, 1, 2]) {
    verdadero(
      grosorDelCable(z, CABLE) >= CABLE.grosorMinimo,
      `a z=${z} mide ${grosorDelCable(z, CABLE).toFixed(1)} px`
    );
  }
  verdadero(grosorDelCable(0, CABLE) === CABLE.grosor, 'y cerca mide lo que dice config');
});
