// Sistema de eventos: cuántos tocan según las horas, que no se repita el
// último mostrado, que el evento raro salga sólo cuando tiene que salir, y que
// las migraciones de save no rompan una partida vieja. La cadencia diaria y la
// colección tienen su propio archivo: coleccion.test.js.

import { prueba, igual, verdadero } from './runner.js';
import { T0 } from './config.pruebas.js';
import {
  VERSION_ESTADO,
  MAX_EVENTOS_POR_VISITA,
  PROBABILIDAD_EVENTO_RARO
} from '../js/config.js';
import { EVENTOS, EVENTOS_POR_CATEGORIA, CATEGORIAS, EVENTO_RARO } from '../js/datos-eventos.js';
import { elegirEventos } from '../js/eventos.js';
import { cargarEstado, guardarEstado } from '../js/estado.js';

// Con `aleatorio` fijo el sorteo es determinista: siempre saca el primero de la
// bolsa de candidatos.
const PRIMERO = () => 0;

// El portero del evento raro va aparte del sorteo. Casi todas las pruebas de
// abajo son sobre el pool general, así que lo dejan cerrado a propósito: si
// compartiera fuente con PRIMERO, el raro saldría en todas.
const NUNCA_RARO = () => 1;
const SIEMPRE_RARO = () => 0;

// ---- Cuántos eventos según las horas ----

prueba('eventos: menos de 1 hora no muestra nada', () => {
  igual(elegirEventos(0, [], PRIMERO, NUNCA_RARO).length, 0, '0 h -> ningún evento');
  igual(elegirEventos(0.99, [], PRIMERO, NUNCA_RARO).length, 0, '0.99 h -> ningún evento');
});

prueba('eventos: entre 1 y 6 horas muestra uno', () => {
  igual(elegirEventos(1, [], PRIMERO, NUNCA_RARO).length, 1, '1 h -> un evento (borde inclusive)');
  igual(elegirEventos(3, [], PRIMERO, NUNCA_RARO).length, 1, '3 h -> un evento');
  igual(elegirEventos(6, [], PRIMERO, NUNCA_RARO).length, 1, '6 h -> un evento (borde inclusive)');
});

prueba('eventos: más de 6 horas muestra hasta dos', () => {
  igual(elegirEventos(6.1, [], PRIMERO, NUNCA_RARO).length, 2, '6.1 h -> dos eventos');
  igual(
    elegirEventos(24, [], PRIMERO, NUNCA_RARO).length,
    MAX_EVENTOS_POR_VISITA,
    '24 h -> el máximo'
  );
});

// ---- No repetir NADA de la visita anterior ----

prueba('eventos: cualquiera de la visita anterior queda excluido', () => {
  for (const excluido of EVENTOS.map((e) => e.id)) {
    const elegidos = elegirEventos(24, [excluido], PRIMERO, NUNCA_RARO);
    verdadero(
      elegidos.every((e) => e.id !== excluido),
      `${excluido} quedó excluido del sorteo`
    );
  }
});

prueba('eventos: si la visita anterior mostró dos, NINGUNO de los dos se repite', () => {
  const anteriores = elegirEventos(24, [], PRIMERO, NUNCA_RARO);
  igual(anteriores.length, 2, 'la visita anterior mostró dos');

  const ids = anteriores.map((e) => e.id);
  const siguientes = elegirEventos(24, ids, PRIMERO, NUNCA_RARO);

  verdadero(
    siguientes.every((e) => !ids.includes(e.id)),
    `ninguno de ${ids.join(' y ')} volvió a salir`
  );
  igual(siguientes.length, 2, 'igual salen dos: el pool alcanza');
});

prueba('eventos: sin ultimosIds se comporta como si no hubiera exclusiones', () => {
  igual(elegirEventos(24, undefined, PRIMERO, NUNCA_RARO).length, 2, 'undefined -> default []');
  igual(elegirEventos(24, [], PRIMERO, NUNCA_RARO).length, 2, '[] -> sin exclusiones');
});

prueba('eventos: los dos de una misma visita son distintos entre sí', () => {
  const elegidos = elegirEventos(24, [], PRIMERO, NUNCA_RARO);
  igual(elegidos.length, 2, 'salieron dos');
  verdadero(elegidos[0].id !== elegidos[1].id, 'no se repite el mismo evento en una visita');
});

prueba('eventos: con aleatorio fijo el resultado es reproducible', () => {
  const a = elegirEventos(24, [], PRIMERO, NUNCA_RARO);
  const b = elegirEventos(24, [], PRIMERO, NUNCA_RARO);
  igual(a.map((e) => e.id).join(), b.map((e) => e.id).join(), 'mismo aleatorio -> mismo resultado');
});

prueba('eventos: el pool tiene margen para excluir dos y seguir sorteando', () => {
  verdadero(
    EVENTOS.length > MAX_EVENTOS_POR_VISITA * 2,
    `el pool (${EVENTOS.length}) supera el doble del máximo por visita`
  );
});

prueba('eventos: todos los del pool tienen id único y texto', () => {
  const ids = new Set(EVENTOS.map((e) => e.id));
  igual(ids.size, EVENTOS.length, 'no hay ids repetidos en el pool');
  verdadero(
    EVENTOS.every((e) => typeof e.texto === 'string' && e.texto.length > 0),
    'todos los eventos tienen texto'
  );
});

// ---- Categorías ----

prueba('eventos: las cuatro categorías están y ninguna quedó vacía', () => {
  igual(CATEGORIAS.join(), 'funcion,coleccion,grandes,resto', 'las cuatro, en el orden del brief');
  verdadero(
    CATEGORIAS.every((nombre) => EVENTOS_POR_CATEGORIA[nombre].length > 0),
    'ninguna categoría quedó sin eventos'
  );
});

prueba('eventos: la vista plana no pierde ni inventa nada', () => {
  const sumaPorCategoria = CATEGORIAS.reduce(
    (total, nombre) => total + EVENTOS_POR_CATEGORIA[nombre].length,
    0
  );
  igual(EVENTOS.length, sumaPorCategoria, 'EVENTOS es exactamente la unión de las categorías');
  verdadero(
    EVENTOS.every((e) => CATEGORIAS.includes(e.categoria)),
    'cada evento del pool lleva estampada una categoría conocida'
  );
});

// ---- Evento raro ----

prueba('raro: no está en el pool general', () => {
  verdadero(
    !EVENTOS.some((e) => e.id === EVENTO_RARO.id),
    'el raro no puede salir sorteado como uno más'
  );
});

prueba('raro: la probabilidad es una fracción, no un porcentaje', () => {
  verdadero(
    PROBABILIDAD_EVENTO_RARO > 0 && PROBABILIDAD_EVENTO_RARO < 1,
    `${PROBABILIDAD_EVENTO_RARO} está entre 0 y 1 (1.5 sería 150% y saldría siempre)`
  );
});

prueba('raro: con el portero cerrado no sale nunca', () => {
  for (const horas of [1, 3, 6, 10, 24]) {
    const elegidos = elegirEventos(horas, [], PRIMERO, NUNCA_RARO);
    verdadero(
      elegidos.every((e) => e.id !== EVENTO_RARO.id),
      `${horas} h sin raro`
    );
  }
});

prueba('raro: cuando sale ocupa un lugar de la visita, no suma uno más', () => {
  const unaVisita = elegirEventos(3, [], PRIMERO, SIEMPRE_RARO);
  igual(unaVisita.length, 1, '3 h siguen siendo un evento');
  igual(unaVisita[0].id, EVENTO_RARO.id, 'y ese evento es el raro');

  const dosVisitas = elegirEventos(10, [], PRIMERO, SIEMPRE_RARO);
  igual(dosVisitas.length, MAX_EVENTOS_POR_VISITA, '10 h siguen siendo dos eventos');
  igual(dosVisitas[0].id, EVENTO_RARO.id, 'el raro es uno de los dos');
  verdadero(
    EVENTOS.some((e) => e.id === dosVisitas[1].id),
    'el otro sale del pool general'
  );
});

prueba('raro: el umbral es estricto', () => {
  const justo = elegirEventos(24, [], PRIMERO, () => PROBABILIDAD_EVENTO_RARO);
  verdadero(
    justo.every((e) => e.id !== EVENTO_RARO.id),
    'caer exactamente en la probabilidad NO dispara el raro'
  );
});

prueba('raro: si salió la visita pasada, no se repite', () => {
  const elegidos = elegirEventos(24, [EVENTO_RARO.id], PRIMERO, SIEMPRE_RARO);
  verdadero(
    elegidos.every((e) => e.id !== EVENTO_RARO.id),
    'el raro respeta la exclusión igual que cualquier otro'
  );
  igual(elegidos.length, 2, 'los dos lugares los llena el pool general');
});

// ---- Migración del save ----

prueba('migración v1 -> actual: agrega los campos nuevos sin tocar los stats', () => {
  // Un save de v1 tal cual era: sin nada de eventos ni de colección.
  guardarEstado({
    nombre: 'Chip',
    bateria: 42.5,
    humor: 17.25,
    mantenimiento: 88,
    ultimaVisita: T0,
    creado: T0,
    version: 1
  });

  const migrado = cargarEstado();

  igual(migrado.version, VERSION_ESTADO, 'la versión queda al día');
  verdadero(Array.isArray(migrado.ultimosEventosIds), 'ultimosEventosIds es un array');
  igual(migrado.ultimosEventosIds.length, 0, 'arranca sin exclusiones');
  igual(migrado.bateria, 42.5, 'bateria intacta');
  igual(migrado.humor, 17.25, 'humor intacto');
  igual(migrado.mantenimiento, 88, 'mantenimiento intacto');
  igual(migrado.ultimaVisita, T0, 'ultimaVisita intacta: el decay se sigue cobrando bien');
  igual(migrado.creado, T0, 'creado intacto');
});

prueba('migración v2 -> actual: ultimoEventoId se convierte en ultimosEventosIds', () => {
  guardarEstado({
    nombre: 'Chip',
    bateria: 60,
    humor: 60,
    mantenimiento: 60,
    ultimaVisita: T0,
    creado: T0,
    ultimoEventoId: 'evento-04',
    version: 2
  });

  const migrado = cargarEstado();

  igual(migrado.version, VERSION_ESTADO, 'la versión queda al día');
  igual(migrado.ultimosEventosIds.join(), 'evento-04', 'el evento viejo se conserva excluido');
  verdadero(!('ultimoEventoId' in migrado), 'el campo viejo no queda colgado en el save');
  igual(migrado.bateria, 60, 'los stats no se tocan');
});

prueba('migración: un save ya en la versión actual pasa sin tocarse', () => {
  guardarEstado({
    nombre: 'Chip',
    bateria: 50,
    humor: 50,
    mantenimiento: 50,
    ultimaVisita: T0,
    creado: T0,
    ultimosEventosIds: ['evento-02', 'evento-03'],
    version: VERSION_ESTADO
  });

  const cargado = cargarEstado();
  igual(cargado.ultimosEventosIds.join(), 'evento-02,evento-03', 'sobreviven los dos');
  igual(cargado.version, VERSION_ESTADO, 'la versión no cambia');
});
