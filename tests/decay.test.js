// Los cuatro chequeos obligatorios del brief, formalizados.
// Se corren después de cualquier cambio que toque estado, decay o persistencia.

import { prueba, igual, cerca, verdadero } from './runner.js';
import { T0, HORAS_LARGAS, HORAS_PISO } from './config.pruebas.js';
import { MS_POR_HORA, DECAY_FLOOR, VERSION_ESTADO } from '../js/config.js';
import { aplicarDecay } from '../js/decay.js';
import { cargarEstado, guardarEstado } from '../js/estado.js';

const STATS = ['bateria', 'humor', 'mantenimiento'];

function base(ultimaVisita = T0) {
  return {
    nombre: 'Chip',
    bateria: 100,
    humor: 100,
    mantenimiento: 100,
    ultimaVisita,
    creado: ultimaVisita,
    version: VERSION_ESTADO
  };
}

const enHoras = (horas) => T0 + horas * MS_POR_HORA;

// ---- 1. Persistencia ----
// Cerrar y reabrir: el decay se aplica según el tiempo transcurrido y no se
// resetea. Es el único chequeo que pasa por localStorage; los otros tres son
// propiedades puras de aplicarDecay.
prueba('1. persistencia: el save sobrevive el round-trip y el decay se aplica al reabrir', () => {
  guardarEstado(base(T0 - 3 * MS_POR_HORA));

  const cargado = cargarEstado();
  igual(cargado.bateria, 100, 'cargarEstado no aplica decay ni resetea');
  igual(cargado.ultimaVisita, T0 - 3 * MS_POR_HORA, 'ultimaVisita sobrevive al guardar/cargar');

  const conDecay = aplicarDecay(cargado, T0);
  cerca(conDecay.bateria, 85, '3 h transcurridas -> bateria 85');
  cerca(conDecay.humor, 90.1, '3 h transcurridas -> humor 90.1');
  igual(conDecay.ultimaVisita, T0, 'ultimaVisita se mueve DESPUES de calcular');
});

// ---- 2. Cap offline de 24 h ----
prueba('2. cap de 24 h: 24 h y 500 h desde el mismo punto dan resultado idéntico', () => {
  const a = aplicarDecay(base(), enHoras(24));
  const b = aplicarDecay(base(), enHoras(HORAS_LARGAS));

  igual(a.bateria, 10, '24 h desde 100 -> bateria 10 (toca el piso)');
  cerca(a.humor, 20.8, '24 h desde 100 -> humor 20.8');
  cerca(a.mantenimiento, 59.2, '24 h desde 100 -> mantenimiento 59.2');

  for (const stat of STATS) {
    igual(a[stat], b[stat], `${stat}: 500 h cobran exactamente lo mismo que 24 h`);
  }
});

// ---- 3. Piso de 10 ----
// Con el cap de 24 h este caso da lo mismo que el chequeo 2, así que además del
// valor de batería asserta el piso sobre los tres stats para aportar algo propio.
prueba('3. piso de 10: 200 h no dejan ningún stat por debajo de DECAY_FLOOR', () => {
  const r = aplicarDecay(base(), enHoras(HORAS_PISO));

  igual(r.bateria, DECAY_FLOOR, '200 h -> bateria exactamente 10');
  verdadero(r.bateria > 0, 'la batería no queda en 0 ni negativa');

  for (const stat of STATS) {
    verdadero(r[stat] >= DECAY_FLOOR, `${stat} no baja de DECAY_FLOOR`);
  }
});

// ---- 4. Sin doble decay ----
// La caída total corresponde al tiempo real transcurrido, no a una aplicación
// por recarga. Es una propiedad de aplicarDecay + el avance de ultimaVisita, así
// que se testea puro, sin localStorage.
prueba('4. sin doble decay: reaplicar en el mismo instante no vuelve a cobrar', () => {
  const momento = enHoras(3);
  let e = base();

  e = aplicarDecay(e, momento);
  e = aplicarDecay(e, momento);
  e = aplicarDecay(e, momento);

  cerca(e.bateria, 85, 'tres recargas seguidas cobran 3 h, no 9');
});

// ---- El decay nunca regala stats ----
// DECAY_FLOOR limita cuánto puede bajar el paso del tiempo, no dónde tiene que
// estar el valor. Un stat por debajo del piso se queda donde está: sube sólo
// con acciones. Si no, jugar con la batería en 15 la deja en 5 y el siguiente
// tick devuelve esos 5 gratis.
prueba('piso: un stat por debajo de DECAY_FLOOR no sube con el decay', () => {
  const bajo = { ...base(), bateria: 5, humor: 3, mantenimiento: 0 };

  const r = aplicarDecay(bajo, enHoras(5));

  igual(r.bateria, 5, 'bateria en 5 se queda en 5, no sube a 10');
  igual(r.humor, 3, 'humor en 3 se queda en 3');
  igual(r.mantenimiento, 0, 'mantenimiento en 0 se queda en 0');
});

prueba('piso: el costo de jugar en el borde no se evapora', () => {
  // El caso concreto: bateria 15, jugar la deja en 5 (clamp de acción), y el
  // decay que viene después no puede devolverla a 10.
  const traseJugar = { ...base(), bateria: 5 };

  let e = aplicarDecay(traseJugar, enHoras(1));
  e = aplicarDecay(e, enHoras(12));

  igual(e.bateria, 5, 'dos ticks después sigue en 5');
});

prueba('piso: el decay nunca aumenta ningún stat, arranque donde arranque', () => {
  for (const valor of [0, 1, 5, 9.99, 10, 10.01, 50, 100]) {
    const inicial = { ...base(), bateria: valor, humor: valor, mantenimiento: valor };
    const r = aplicarDecay(inicial, enHoras(24));

    for (const stat of STATS) {
      verdadero(r[stat] <= valor, `desde ${valor}, ${stat} no aumentó (quedó en ${r[stat]})`);
    }
  }
});

prueba('4b. sin doble decay: 2 h + 3 h da lo mismo que 5 h de una', () => {
  const partido = aplicarDecay(aplicarDecay(base(), enHoras(2)), enHoras(5));
  const entero = aplicarDecay(base(), enHoras(5));

  for (const stat of STATS) {
    cerca(partido[stat], entero[stat], `${stat}: partir el intervalo no cambia el total`);
  }
});
