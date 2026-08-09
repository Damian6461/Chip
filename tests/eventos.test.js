// Sistema de eventos: cuántos tocan según las horas, que no se repita el
// último mostrado, y que la migración v1 -> v2 no rompa una partida vieja.

import { prueba, igual, verdadero } from './runner.js';
import { T0 } from './config.pruebas.js';
import { VERSION_ESTADO, MAX_EVENTOS_POR_VISITA } from '../js/config.js';
import { EVENTOS } from '../js/datos-eventos.js';
import { elegirEventos } from '../js/eventos.js';
import { cargarEstado, guardarEstado } from '../js/estado.js';

// Con `aleatorio` fijo el sorteo es determinista: siempre saca el primero de la
// bolsa de candidatos.
const PRIMERO = () => 0;

// ---- Cuántos eventos según las horas ----

prueba('eventos: menos de 1 hora no muestra nada', () => {
  igual(elegirEventos(0, null, PRIMERO).length, 0, '0 h -> ningún evento');
  igual(elegirEventos(0.99, null, PRIMERO).length, 0, '0.99 h -> ningún evento');
});

prueba('eventos: entre 1 y 6 horas muestra uno', () => {
  igual(elegirEventos(1, null, PRIMERO).length, 1, '1 h -> un evento (borde inclusive)');
  igual(elegirEventos(3, null, PRIMERO).length, 1, '3 h -> un evento');
  igual(elegirEventos(6, null, PRIMERO).length, 1, '6 h -> un evento (borde inclusive)');
});

prueba('eventos: más de 6 horas muestra hasta dos', () => {
  igual(elegirEventos(6.1, null, PRIMERO).length, 2, '6.1 h -> dos eventos');
  igual(elegirEventos(24, null, PRIMERO).length, MAX_EVENTOS_POR_VISITA, '24 h -> el máximo');
});

// ---- No repetir el último mostrado ----

prueba('eventos: el último mostrado nunca vuelve a salir', () => {
  for (const excluido of EVENTOS.map((e) => e.id)) {
    const elegidos = elegirEventos(24, excluido, PRIMERO);
    verdadero(
      elegidos.every((e) => e.id !== excluido),
      `${excluido} quedó excluido del sorteo`
    );
  }
});

prueba('eventos: los dos de una misma visita son distintos entre sí', () => {
  const elegidos = elegirEventos(24, null, PRIMERO);
  igual(elegidos.length, 2, 'salieron dos');
  verdadero(elegidos[0].id !== elegidos[1].id, 'no se repite el mismo evento en una visita');
});

prueba('eventos: con aleatorio fijo el resultado es reproducible', () => {
  const a = elegirEventos(24, null, PRIMERO);
  const b = elegirEventos(24, null, PRIMERO);
  igual(a.map((e) => e.id).join(), b.map((e) => e.id).join(), 'mismo aleatorio -> mismo resultado');
});

prueba('eventos: todos los del pool tienen id único y texto', () => {
  const ids = new Set(EVENTOS.map((e) => e.id));
  igual(ids.size, EVENTOS.length, 'no hay ids repetidos en el pool');
  verdadero(
    EVENTOS.every((e) => typeof e.texto === 'string' && e.texto.length > 0),
    'todos los eventos tienen texto'
  );
});

// ---- Migración del save ----

prueba('migración v1 -> v2: agrega ultimoEventoId sin tocar los stats', () => {
  // Un save de v1 tal cual era: sin ultimoEventoId.
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
  igual(migrado.ultimoEventoId, null, 'ultimoEventoId entra con su default');
  igual(migrado.bateria, 42.5, 'bateria intacta');
  igual(migrado.humor, 17.25, 'humor intacto');
  igual(migrado.mantenimiento, 88, 'mantenimiento intacto');
  igual(migrado.ultimaVisita, T0, 'ultimaVisita intacta: el decay se sigue cobrando bien');
  igual(migrado.creado, T0, 'creado intacto');
});

prueba('migración: un save ya en v2 pasa sin tocarse', () => {
  const v2 = {
    nombre: 'Chip',
    bateria: 50,
    humor: 50,
    mantenimiento: 50,
    ultimaVisita: T0,
    creado: T0,
    ultimoEventoId: 'evento-03',
    version: VERSION_ESTADO
  };
  guardarEstado(v2);

  const cargado = cargarEstado();
  igual(cargado.ultimoEventoId, 'evento-03', 'el último evento sobrevive al round-trip');
  igual(cargado.version, VERSION_ESTADO, 'la versión no cambia');
});
