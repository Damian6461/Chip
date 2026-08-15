// El sistema de colección: qué deja una visita, qué no vuelve a dejar, el techo
// por visita, la rareza y la garantía diaria de cadencia.

import { prueba, igual, verdadero } from './runner.js';
import { T0 } from './config.pruebas.js';
import {
  VERSION_ESTADO,
  PROBABILIDAD_OBJETO_RARO,
  MAX_OBJETOS_POR_VISITA,
  TIERS_OBJETO,
  HORAS_MINIMAS_EVENTO
} from '../js/config.js';
import { OBJETOS, objetosDelEvento, objetoPorId } from '../js/datos-objetos.js';
import { EVENTOS } from '../js/datos-eventos.js';
import { otorgarPorEventos, tiene, objetosConEstado } from '../js/coleccion.js';
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
