// El arco de los gigantes: las capas por presencia, el hito que pasa una sola
// vez, y la resignificación del evento de la grúa.

import { prueba, igual, verdadero } from './runner.js';
import { T0 } from './config.pruebas.js';
import { VERSION_ESTADO, UMBRALES_GIGANTE, CAPAS_GIGANTE } from '../js/config.js';
import { GIGANTES, gigantePorId } from '../js/datos-gigantes.js';
import { EVENTOS, EVENTO_RARO } from '../js/datos-eventos.js';
import {
  capaPorDias,
  alcanzo,
  gigantesConEstado,
  hitoPendiente,
  eventoDeHito
} from '../js/gigantes.js';
import { elegirEventos } from '../js/eventos.js';
import { cargarEstado, guardarEstado } from '../js/estado.js';

const PRIMERO = () => 0;
const GRUA = 'grua-vieja';

// ---- El catálogo ----

prueba('gigantes: están los cuatro del canon', () => {
  igual(GIGANTES.length, 4, 'grúa, carguero, robot de carga y mantenimiento pesado');
  verdadero(
    GIGANTES.every((g) => typeof g.nombre === 'string' && g.nombre.length > 0),
    'todos tienen nombre, aunque todavía no se muestre'
  );
});

prueba('gigantes: sólo la grúa tiene arco escrito en esta pasada', () => {
  const conHito = GIGANTES.filter((g) => g.hito !== null);
  igual(conHito.length, 1, 'un solo arco completo');
  igual(conHito[0].id, GRUA, 'y es el de la grúa');

  const sinContenido = GIGANTES.filter((g) => g.id !== GRUA);
  igual(sinContenido.length, 3, 'los otros tres esperan la pasada editorial');
  verdadero(
    sinContenido.every((g) => g.detalle === null && g.hito === null),
    'con la estructura lista y el contenido en null'
  );
});

prueba('gigantes: el texto del hito sale del evento y no de una copia', () => {
  igual(
    gigantePorId(GRUA).hito,
    EVENTO_RARO.texto,
    'la grúa muestra exactamente el evento del brazo'
  );
});

// ---- Las capas ----

prueba('capas: la presencia revela en orden', () => {
  igual(capaPorDias(0), 'silueta', 'día cero: sólo la silueta');
  igual(capaPorDias(UMBRALES_GIGANTE.nombre), 'nombre', 'en el umbral, el nombre');
  igual(capaPorDias(UMBRALES_GIGANTE.detalle), 'detalle', 'después el detalle');
  igual(capaPorDias(UMBRALES_GIGANTE.hito), 'hito', 'y al final el hito');
});

prueba('capas: el umbral es inclusive y no se salta ninguna', () => {
  igual(capaPorDias(UMBRALES_GIGANTE.nombre - 1), 'silueta', 'un día antes, todavía no');
  igual(capaPorDias(UMBRALES_GIGANTE.detalle - 1), 'nombre', 'ídem para el detalle');
  igual(capaPorDias(UMBRALES_GIGANTE.hito - 1), 'detalle', 'ídem para el hito');
  igual(capaPorDias(9999), 'hito', 'y no hay nada después del hito');
});

prueba('capas: los umbrales son crecientes', () => {
  const valores = CAPAS_GIGANTE.map((capa) => UMBRALES_GIGANTE[capa]);
  const ordenados = [...valores].sort((a, b) => a - b);
  igual(valores.join(), ordenados.join(), 'cada capa pide más presencia que la anterior');
});

prueba('capas: alcanzo() compara por orden, no por nombre', () => {
  verdadero(alcanzo(UMBRALES_GIGANTE.hito, 'nombre'), 'quien llegó al hito pasó por el nombre');
  verdadero(!alcanzo(0, 'nombre'), 'y el día cero no llegó a nada');
});

// ---- Lo que ve la colección ----

prueba('vista: el día cero no revela nada', () => {
  const [grua] = gigantesConEstado(0);
  igual(grua.nombre, null, 'sin nombre');
  igual(grua.detalle, null, 'sin detalle');
  igual(grua.hito, null, 'sin hito');
});

prueba('vista: el nombre aparece en su umbral', () => {
  const [grua] = gigantesConEstado(UMBRALES_GIGANTE.nombre);
  igual(grua.nombre, 'La grúa vieja', 'ya se sabe quién es');
  igual(grua.detalle, null, 'pero todavía no qué hace');
});

prueba('vista: el detalle aparece en el suyo', () => {
  const [grua] = gigantesConEstado(UMBRALES_GIGANTE.detalle);
  verdadero(grua.detalle !== null, 'el detalle del canon está');
  igual(grua.hito, null, 'el hito todavía no');
});

prueba('vista: el hito NO se lee antes de vivirlo', () => {
  const sinVivir = gigantesConEstado(UMBRALES_GIGANTE.hito, [])[0];
  igual(sinVivir.hito, null, 'llegar al umbral no alcanza: spoilearlo lo arruinaría');
  igual(sinVivir.hitoVivido, false, 'y queda marcado como no vivido');

  const vivido = gigantesConEstado(UMBRALES_GIGANTE.hito, [GRUA])[0];
  igual(vivido.hito, EVENTO_RARO.texto, 'después de vivirlo, queda para releer');
  igual(vivido.hitoVivido, true, 'y marcado');
});

prueba('vista: los tres sin contenido muestran nombre y nada más', () => {
  const otros = gigantesConEstado(9999, []).filter((g) => g.id !== GRUA);
  verdadero(
    otros.every((g) => g.nombre !== null),
    'con presencia de sobra, los cuatro tienen nombre'
  );
  verdadero(
    otros.every((g) => g.detalle === null && g.hito === null),
    'pero los tres sin escribir no inventan contenido'
  );
});

// ---- El hito ----

prueba('hito: no se dispara antes del umbral', () => {
  igual(hitoPendiente(UMBRALES_GIGANTE.hito - 1, []), null, 'un día antes, nada');
});

prueba('hito: se dispara al llegar al umbral', () => {
  const pendiente = hitoPendiente(UMBRALES_GIGANTE.hito, []);
  verdadero(pendiente !== null, 'hay hito para vivir');
  igual(pendiente.id, GRUA, 'y es el de la grúa');
});

prueba('hito: pasa UNA sola vez en la partida', () => {
  igual(
    hitoPendiente(UMBRALES_GIGANTE.hito, [GRUA]),
    null,
    'ya vivido: no vuelve a disparar'
  );
  igual(
    hitoPendiente(9999, [GRUA]),
    null,
    'y los días siguen subiendo sin volver a dispararlo'
  );
});

prueba('hito: los gigantes sin hito escrito no disparan nada', () => {
  const todosLosIds = GIGANTES.map((g) => g.id);
  igual(
    hitoPendiente(9999, todosLosIds),
    null,
    'con la grúa vivida, los otros tres no se cuelan'
  );
});

prueba('hito: viaja como un evento común', () => {
  const evento = eventoDeHito(gigantePorId(GRUA));
  igual(evento.id, EVENTO_RARO.id, 'con el id del evento original');
  igual(evento.texto, EVENTO_RARO.texto, 'y su texto');
  verdadero(typeof evento.categoria === 'string', 'con categoría, como cualquier otro');
});

// ---- La resignificación ----

prueba('resignificación: el evento del brazo no está en el pool general', () => {
  verdadero(
    !EVENTOS.some((e) => e.id === EVENTO_RARO.id),
    'nunca estuvo en el pool y sigue sin estar'
  );
});

prueba('resignificación: ya no sale por sorteo, con ninguna cantidad de horas', () => {
  // Antes esto dependía de una moneda cargada al 1.5%. Ahora elegirEventos no
  // conoce el evento del brazo: la única forma de verlo es el arco.
  for (const horas of [1, 3, 6, 10, 24, 500]) {
    for (let i = 0; i < 40; i++) {
      const elegidos = elegirEventos(horas, [], Math.random);
      verdadero(
        elegidos.every((e) => e.id !== EVENTO_RARO.id),
        `${horas} h: el brazo no aparece por sorteo`
      );
    }
  }
});

prueba('resignificación: elegirEventos ya no toma portero de rareza', () => {
  // Con el sorteo fijo en el primero de la bolsa, el resultado tiene que ser
  // estable: si todavía quedara una moneda adentro, un cuarto argumento fantasma
  // podría cambiarlo.
  const a = elegirEventos(24, [], PRIMERO);
  const b = elegirEventos(24, [], PRIMERO);
  igual(a.map((e) => e.id).join(), b.map((e) => e.id).join(), 'mismo aleatorio, mismo resultado');
  igual(a.length, 2, 'y siguen saliendo dos');
});

// ---- Migración ----

prueba('migración v4 -> v5: agrega presencia e hitos sin tocar lo demás', () => {
  guardarEstado({
    nombre: 'Chip',
    bateria: 60,
    humor: 60,
    mantenimiento: 60,
    ultimaVisita: T0,
    creado: T0,
    ultimosEventosIds: ['evento-03'],
    coleccion: ['tuerca-cabeza'],
    ultimoDiaConEvento: '2026-08-15',
    version: 4
  });

  const migrado = cargarEstado();

  igual(migrado.version, VERSION_ESTADO, 'la versión queda al día');
  igual(migrado.diasDePresencia, 0, 'el arco arranca de cero, no se inventa hacia atrás');
  igual(migrado.ultimoDiaVisitado, null, 'sin día visitado todavía');
  verdadero(Array.isArray(migrado.hitosVistos), 'hitosVistos es un array');
  igual(migrado.hitosVistos.length, 0, 'y está vacío');
  igual(migrado.coleccion.join(), 'tuerca-cabeza', 'la colección de v4 sobrevive');
  igual(migrado.bateria, 60, 'y los stats también');
});

prueba('migración: una presencia ya guardada no se pisa', () => {
  guardarEstado({
    nombre: 'Chip',
    bateria: 50,
    humor: 50,
    mantenimiento: 50,
    ultimaVisita: T0,
    creado: T0,
    ultimosEventosIds: [],
    coleccion: [],
    ultimoDiaConEvento: null,
    diasDePresencia: 17,
    ultimoDiaVisitado: '2026-08-14',
    hitosVistos: ['grua-vieja'],
    version: 4
  });

  const migrado = cargarEstado();

  igual(migrado.diasDePresencia, 17, 'lo guardado gana sobre el default');
  igual(migrado.ultimoDiaVisitado, '2026-08-14', 'y el día visitado');
  igual(migrado.hitosVistos.join(), 'grua-vieja', 'y los hitos vividos');
});
