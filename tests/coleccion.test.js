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
  RECORRIDO_CABLE,
  TOMA_PARED,
  CONECTOR_PECHO,
  PASA_DETRAS_CABLE
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

// ---- El cable: la forma sale de la referencia y de los dos extremos ----
//
// El cable dejó de tener perspectiva. Con eso se fueron tres pruebas que
// verificaban el afinado —la reducción de 7 a 1, el piso del grosor y el tramo
// que sube al alejarse— y no se reemplazan por equivalentes: lo que medían ya no
// es cierto ni deseable. Este cable no se aleja, se apoya.
//
// Lo que sí hay que atar es lo nuevo: que el camino salga de los dos extremos,
// que la forma de la referencia sobreviva, y que la cinta no se pliegue.

const RAIZ_CSS = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ESCENA = { ancho: 480, alto: 889 };
const CONECTOR = { x: 250.6, y: 662.5 };
const TOMA = { x: (TOMA_PARED.x / 100) * ESCENA.ancho, y: (TOMA_PARED.y / 100) * ESCENA.alto };

prueba('cable: la línea media ARRANCA en el conector', () => {
  // El defecto era otro: se creía que el cable nacía en el borde del canvas. No
  // era cierto —era una confusión de sistemas de coordenadas— pero la propiedad
  // vale igual, porque el día que alguien meta un corrimiento en el origen esto
  // lo agarra.
  const linea = lineaDelCable(CONECTOR, TOMA, CABLE, RECORRIDO_CABLE);
  const d = Math.hypot(linea[0].x - CONECTOR.x, linea[0].y - CONECTOR.y);
  verdadero(d < 1, `el primer punto está a ${d.toFixed(2)} px del conector`);
});

prueba('cable: la línea media TERMINA en el toma', () => {
  // La otra mitad de lo mismo, y es nueva: antes la llegada era un punto suelto
  // de la tabla que había que mantener a mano en el mismo lugar que la caja. Si
  // los dos se separaban, el cable terminaba en el aire al lado del toma. Ahora
  // el extremo ES el toma y no se pueden separar.
  const linea = lineaDelCable(CONECTOR, TOMA, CABLE, RECORRIDO_CABLE);
  const u = linea[linea.length - 1];
  const d = Math.hypot(u.x - TOMA.x, u.y - TOMA.y);
  verdadero(d < 1, `el último punto está a ${d.toFixed(2)} px del toma`);
});

prueba('cable: mover cualquiera de los dos extremos mueve el cable entero', () => {
  // ES EL PEDIDO DEL PUNTO 16, y lo que separa esto de un path dibujado a mano.
  // Un camino congelado en coordenadas de escena deja de coincidir con el arte
  // al primer ajuste — el mismo problema que tuvieron los íconos.
  const base = lineaDelCable(CONECTOR, TOMA, CABLE, RECORRIDO_CABLE);
  const otroToma = { x: TOMA.x - 60, y: TOMA.y + 40 };
  const movido = lineaDelCable(CONECTOR, otroToma, CABLE, RECORRIDO_CABLE);

  const dFin = Math.hypot(movido.at(-1).x - otroToma.x, movido.at(-1).y - otroToma.y);
  verdadero(dFin < 1, 'el final sigue al toma');

  // Y el medio se movió también: si sólo se moviera la punta, el cable estaría
  // estirándose en vez de trasladarse.
  const medio = Math.floor(base.length / 2);
  const dMedio = Math.hypot(movido[medio].x - base[medio].x, movido[medio].y - base[medio].y);
  verdadero(dMedio > 10, `el medio del cable se movió ${dMedio.toFixed(1)} px`);
});

prueba('cable: el grosor va en % del EJE y no del ancho de la escena', () => {
  // ES LA CORRECCIÓN DE DAMIÁN Y ES LA QUE IMPORTA. La referencia es arte
  // conceptual: no comparte encuadre con la escena, así que medir el cable
  // contra el ancho de esa imagen es precisión falsa. El eje pecho->toma sí es
  // la misma pieza en las dos y sobrevive al cambio de encuadre.
  //
  // Se comprueba contra el eje REAL y no contra la constante: si alguien vuelve
  // a atarlo al ancho de la escena, el cable deja de escalar con el recorrido y
  // esto lo agarra aunque los dos números se parezcan en un teléfono.
  const eje = Math.hypot(TOMA.x - CONECTOR.x, TOMA.y - CONECTOR.y);
  const g = grosorDelCable(eje, CABLE);
  verdadero(g > 2, `mide ${g.toFixed(1)} px sobre un eje de ${eje.toFixed(0)}`);

  // Un eje el doble de largo da un cable el doble de grueso: la silueta se
  // conserva cuando cambia el tamaño de la escena.
  verdadero(grosorDelCable(eje * 2, CABLE) === g * 2, 'escala con el eje');

  // Y EL NÚMERO SIGUE SALIENDO DE LA REFERENCIA, aunque ya no sea 2,98.
  //
  // La referencia mide 25,3 px de cable sobre un eje de 849,6, o sea 2,978%. Ese
  // porcentaje valía mientras el eje del juego fuera la misma pieza que el de la
  // referencia: pecho -> toma de la pared, con el toma en el 90% del ancho.
  //
  // El toma se fue de cuadro —al 106%, ver TOMA_PARED— así que el eje se estiró
  // sin que el CABLE haya cambiado de grosor. Mantener el 2,978 sobre un eje más
  // largo habría engordado el trazo un 15,6% de rebote: 8,82 px donde antes había
  // 7,63. Lo que se conserva es el GROSOR DIBUJADO, no el porcentaje.
  //
  // Así que el porcentaje se re-deriva, y acá se re-deriva de nuevo en vez de
  // creerle a la constante: 2,978% escalado por (eje viejo / eje nuevo).
  const ESCENA = { ancho: 390, alto: 844 }; // el teléfono, que es el aparato
  const ejeCon = (x) =>
    Math.hypot(
      ((x - CONECTOR_PECHO.x) / 100) * ESCENA.ancho,
      ((TOMA_PARED.y - CONECTOR_PECHO.y) / 100) * ESCENA.alto
    );
  const DONDE_ESTABA_EL_TOMA = 90;
  const medido = (25.3 / 849.6) * 100;
  const esperado = medido * (ejeCon(DONDE_ESTABA_EL_TOMA) / ejeCon(TOMA_PARED.x));

  verdadero(
    Math.abs(CABLE.grosor - esperado) < 0.05,
    `${CABLE.grosor}% contra el ${esperado.toFixed(2)}% que sale de la referencia ` +
      `re-escalada por el eje (${medido.toFixed(2)}% cuando el toma estaba en el 90%)`
  );

  // Y EL GROSOR DIBUJADO, que es lo que de verdad se conserva: 7,6 px en el
  // teléfono, los mismos que había antes de mover el toma.
  const px = grosorDelCable(ejeCon(TOMA_PARED.x), CABLE);
  verdadero(
    Math.abs(px - 7.63) < 0.3,
    `el cable dibujado mide ${px.toFixed(2)} px y antes medía 7,63`
  );
});

prueba('cable: la tabla trae el quiebre en S, y el quiebre RETROCEDE', () => {
  // ES LO QUE HACE QUE EL CABLE PAREZCA UN CABLE: cerca del 80% del recorrido el
  // camino se dobla sobre sí mismo, o sea que `t` retrocede. Si alguien
  // "simplifica" la tabla y el retroceso desaparece, queda una curva trazada y se
  // perdió el punto entero del punto 16.
  //
  // SE MIDE SOBRE LA TABLA Y NO SOBRE LA LÍNEA DIBUJADA, y eso costó tres
  // intentos. Medir el retroceso entre muestras consecutivas de la línea
  // depende de la densidad del muestreo: el mismo quiebre repartido en cinco
  // pasos da un quinto del retroceso por paso, y parece que desapareció cuando
  // lo único que pasó es que hay más puntos. Es el mismo error que ya nos mordió
  // midiendo radios de curvatura antes de remuestrear.
  //
  // La tabla no tiene ese problema: es el dato, y el dato o tiene el retroceso o
  // no lo tiene.
  // Y se mide el retroceso TOTAL del tramo, no el mayor entre dos puntos
  // seguidos: el quiebre retrocede repartido en varios puntos —0,7872 hasta
  // 0,7747— y quedarse con el escalón más grande da 0,0040 en vez de 0,0125.
  // Partir un retroceso en más pasos no lo hace más chico.
  const t = RECORRIDO_CABLE.map(([x]) => x);
  let retroceso = 0;
  for (let i = 0; i < t.length; i++) {
    for (let j = i + 1; j < t.length && t[j] <= t[i]; j++) {
      retroceso = Math.max(retroceso, t[i] - t[j]);
    }
  }
  verdadero(retroceso > 0.008, `el retroceso del quiebre es ${retroceso.toFixed(4)} del eje`);
});

prueba('cable: el camino dibujado es bastante más largo que la recta', () => {
  // La otra mitad, y esta sí sobre lo dibujado: un camino con panza y quiebre
  // recorre bastante más que la recta entre los dos extremos. Si alguien lo
  // aplanara, esto cae — y no depende del muestreo, porque el largo de arco es
  // el mismo con diez puntos que con mil.
  const linea = lineaDelCable(CONECTOR, TOMA, CABLE, RECORRIDO_CABLE);
  let arco = 0;
  for (let i = 1; i < linea.length; i++) {
    arco += Math.hypot(linea[i].x - linea[i - 1].x, linea[i].y - linea[i - 1].y);
  }
  const recta = Math.hypot(TOMA.x - CONECTOR.x, TOMA.y - CONECTOR.y);
  const razon = arco / recta;
  verdadero(razon > 1.3, `el cable recorre ${razon.toFixed(2)} veces la recta`);
});

prueba('cable: la panza baja hacia el piso y no hacia arriba', () => {
  // El signo de la perpendicular. Si alguien lo invierte, el cable cuelga para
  // arriba y sigue siendo una curva perfectamente válida — no hay nada que se
  // rompa, sólo un cable flotando.
  const linea = lineaDelCable(CONECTOR, TOMA, CABLE, RECORRIDO_CABLE);
  const masBajo = linea.reduce((m, p) => (p.y > m.y ? p : m), linea[0]);
  verdadero(
    masBajo.y > CONECTOR.y,
    `el punto más bajo está en y=${masBajo.y.toFixed(0)} y el conector en ${CONECTOR.y}`
  );
});

prueba('cable: la cinta no se pliega sobre sí misma en ninguna curva', () => {
  // El borde interno de un giro recorre menos que la línea media, y si el radio
  // es menor que el medio ancho de la cinta, se cruza: eso es un pico.
  //
  // EL TOPE SALE DEL PROPIO CABLE y no de una constante escrita acá. Con el
  // grosor constante, `saltoMaximo` y `afinadoMaximo` desaparecieron: existían
  // para acotar cuánto se corre el borde cuando el ANCHO cambia, y ya no cambia.
  //
  // Lo que puede seguir pasando es el pliegue por curvatura: si el radio de un
  // giro baja del semiancho, el borde interno se cruza. El tope es entonces el
  // grosor del cable — un borde que avanza más que el ancho de la pieza en un
  // solo paso de muestreo es un pliegue, no una curva.
  const EJE = Math.hypot(TOMA.x - CONECTOR.x, TOMA.y - CONECTOR.y);
  const { atras, adelante } = cintaDelCable(
    CONECTOR,
    TOMA,
    CABLE,
    RECORRIDO_CABLE,
    (CABLE.entraAlCuerpo / 100) * EJE,
    (PASA_DETRAS_CABLE / 100) * ESCENA.alto
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
        max <= grosorDelCable(EJE, CABLE) + 0.01,
        `${nombre}: salto máximo ${max.toFixed(2)} px, tope ${grosorDelCable(EJE, CABLE).toFixed(2)}`
      );
    }
  }
});

prueba('cable: la línea donde pasa atrás es la línea donde Chip apoya', () => {
  const CSS = readFileSync(join(RAIZ_CSS, 'style.css'), 'utf8');
  const m = CSS.match(/--piso-chip:\s*([\d.]+)%/);
  verdadero(Boolean(m), 'style.css declara --piso-chip');
  igual(
    PASA_DETRAS_CABLE,
    100 - Number(m[1]),
    'PASA_DETRAS_CABLE es el complemento de --piso-chip'
  );
});