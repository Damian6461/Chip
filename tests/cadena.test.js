// Cadena de estados visuales: que cada rama se active cuando corresponde y que
// el orden de prioridad se respete.
//
// resolverEstadoVisual es pura y recibe `ahora` inyectado, así que estas pruebas
// no llaman Date.now() y no dependen del reloj ni de la zona horaria.

import { prueba, igual } from './runner.js';
import { T0, T_MADRUGADA, T_NOCHE, T_SEIS, T_SIETE } from './config.pruebas.js';
import { ESTADOS_VISUALES as E } from '../js/config.js';
import { resolverEstadoVisual, esDeNoche } from '../js/sprites.js';

const estado = (bateria, humor = 50) => ({ bateria, humor, mantenimiento: 50 });

// [nombre, contexto, estado visual esperado]
const CASOS = [
  // Prioridad: la acción en curso le gana a TODO. Es feedback transitorio — si
  // no gana, apretar un botón en el peor momento no muestra nada.
  ['la acción gana sobre critico', { estado: estado(10), ahora: T0, accion: E.cargando }, E.cargando],
  ['la acción gana sobre standby', { estado: estado(50), ahora: T_MADRUGADA, accion: E.cargando }, E.cargando],
  ['la acción gana sobre critico Y standby a la vez', { estado: estado(10), ahora: T_MADRUGADA, accion: E.cargando }, E.cargando],

  // Prioridad: sin acción en curso, critico gana sobre el resto.
  ['critico gana sobre standby', { estado: estado(10), ahora: T_MADRUGADA, accion: null }, E.critico],
  ['critico gana sobre feliz', { estado: estado(10, 100), ahora: T0, accion: null }, E.critico],

  // Prioridad: standby gana sobre feliz.
  ['standby gana sobre feliz', { estado: estado(100, 100), ahora: T_MADRUGADA, accion: null }, E.standby],

  // Bordes de la franja de standby: 23 inclusive, 7 exclusive.
  ['las 23 ya son standby (borde inclusive)', { estado: estado(50), ahora: T_NOCHE, accion: null }, E.standby],
  ['las 6 siguen siendo standby', { estado: estado(50), ahora: T_SEIS, accion: null }, E.standby],
  ['las 7 ya no son standby (borde exclusive)', { estado: estado(50), ahora: T_SIETE, accion: null }, E.idle],

  // Borde del umbral crítico: la comparación es estricta.
  ['bateria 15 NO es critico (comparación estricta)', { estado: estado(15), ahora: T0, accion: null }, E.idle],
  ['bateria 14.99 sí es critico', { estado: estado(14.99), ahora: T0, accion: null }, E.critico],

  // Estados de acción.
  ['cargando', { estado: estado(50), ahora: T0, accion: E.cargando }, E.cargando],
  ['jugando', { estado: estado(50), ahora: T0, accion: E.jugando }, E.jugando],
  ['limpiando', { estado: estado(50), ahora: T0, accion: E.limpiando }, E.limpiando],
  ['limpiando gana sobre critico', { estado: estado(10), ahora: T0, accion: E.limpiando }, E.limpiando],
  ['la acción gana sobre feliz', { estado: estado(100, 100), ahora: T0, accion: E.jugando }, E.jugando],

  // Feliz pide que los DOS stats pasen el umbral, y también es estricto.
  ['feliz con 80/80', { estado: estado(80, 80), ahora: T0, accion: null }, E.feliz],
  ['71/70 no es feliz: humor no supera el umbral', { estado: estado(71, 70), ahora: T0, accion: null }, E.idle],
  ['70/71 no es feliz: bateria no supera el umbral', { estado: estado(70, 71), ahora: T0, accion: null }, E.idle],

  // Fallback.
  ['idle cuando no aplica nada', { estado: estado(50, 50), ahora: T0, accion: null }, E.idle]
];

for (const [nombre, contexto, esperado] of CASOS) {
  prueba(`cadena: ${nombre}`, () => {
    igual(resolverEstadoVisual(contexto), esperado, nombre);
  });
}

// ---- El fondo del galpón usa la MISMA franja que el standby ----
//
// Si esto se desincroniza, Chip duerme con el galpón de día. Los bordes van con
// los mismos instantes que los casos de arriba a propósito: son el mismo
// contrato horario, no dos parecidos.

prueba('noche: la franja del fondo es exactamente la del standby', () => {
  igual(esDeNoche(T_NOCHE), true, 'las 23 ya son de noche (borde inclusive)');
  igual(esDeNoche(T_MADRUGADA), true, 'las 3 son de noche');
  igual(esDeNoche(T_SEIS), true, 'las 6 siguen siendo de noche');
  igual(esDeNoche(T_SIETE), false, 'las 7 ya son de día (borde exclusive)');
  igual(esDeNoche(T0), false, 'el mediodía es de día');
});

prueba('noche: el fondo acompaña al standby en todos los bordes', () => {
  for (const instante of [T_NOCHE, T_MADRUGADA, T_SEIS, T_SIETE, T0]) {
    const visual = resolverEstadoVisual({ estado: estado(50), ahora: instante, accion: null });
    igual(
      esDeNoche(instante),
      visual === E.standby,
      `en ${new Date(instante).getHours()}h el fondo y el standby coinciden`
    );
  }
});
