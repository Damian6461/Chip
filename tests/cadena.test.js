// Cadena de estados visuales: que cada rama se active cuando corresponde y que
// el orden de prioridad se respete.
//
// resolverEstadoVisual es pura y recibe `ahora` inyectado, así que estas pruebas
// no llaman Date.now() y no dependen del reloj ni de la zona horaria.

import { prueba, igual } from './runner.js';
import {
  T0,
  T_MADRUGADA,
  T_NOCHE,
  T_SEIS,
  T_SIETE,
  T_VEINTIUNA,
  T_VEINTE,
  T_DIECIOCHO,
  T_NUEVE,
  T_DIEZ
} from './config.pruebas.js';
import {
  ESTADOS_VISUALES as E,
  POSES_IDLE,
  RUTAS_SPRITES,
  POSICIONES_ANTENA,
  PANTALLAS_PECHO,
  RUTAS_OJOS,
  ESTADOS_CON_PANTALLA_VIVA,
  ASPECTO_PANTALLA,
  ALTO_NUMERO,
  CAJA_NUMERO,
  CAJA_SEGMENTOS
} from '../js/config.js';
import {
  resolverEstadoVisual,
  esDeNoche,
  franjaDelDia,
  poseDeIdle,
  cajaDeContenidoPantalla
} from '../js/sprites.js';

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

  // `esperando`: Chip aguanta el paso de un gigante. Va entre standby y feliz.
  ['esperando gana sobre feliz', { estado: estado(100, 100), ahora: T0, accion: null, gigantePasando: true }, E.esperando],
  ['esperando gana sobre idle', { estado: estado(50, 50), ahora: T0, accion: null, gigantePasando: true }, E.esperando],
  ['standby gana sobre esperando: dormido no se entera', { estado: estado(50), ahora: T_MADRUGADA, accion: null, gigantePasando: true }, E.standby],
  ['critico gana sobre esperando: el aviso urgente es el otro', { estado: estado(10), ahora: T0, accion: null, gigantePasando: true }, E.critico],
  ['la acción gana sobre esperando', { estado: estado(50), ahora: T0, accion: E.jugando, gigantePasando: true }, E.jugando],
  ['sin gigante no hay esperando', { estado: estado(50, 50), ahora: T0, accion: null, gigantePasando: false }, E.idle],
  // El contexto viejo —sin el campo— no puede activar el estado nuevo: la
  // condición compara contra true y no confía en que el campo exista.
  ['el contexto sin gigantePasando no activa esperando', { estado: estado(50, 50), ahora: T0, accion: null }, E.idle],

  // Fallback.
  ['idle cuando no aplica nada', { estado: estado(50, 50), ahora: T0, accion: null }, E.idle]
];

for (const [nombre, contexto, esperado] of CASOS) {
  prueba(`cadena: ${nombre}`, () => {
    igual(resolverEstadoVisual(contexto), esperado, nombre);
  });
}

// ---- El mundo tiene su hora y Chip la suya ----
//
// Este contrato CAMBIÓ, y el cambio es el punto. Antes los tramos del día eran
// los del standby, para garantizar "si Chip duerme, afuera es de noche". Pero
// repartidos así el atardecer duraba seis horas: a las 22, con el cielo real
// negro hacía rato, el galpón tenía luz dorada de sol poniente.
//
// Con 3/9/3/9 el sol manda, y quedan dos ventanas de desfase deliberadas: de 21
// a 23 el mundo ya es de noche y Chip sigue despierto, y de 6 a 7 amanece y Chip
// sigue durmiendo. Estas pruebas fijan las dos, para que si alguien "arregla" el
// desfase se entere de que lo está deshaciendo a propósito.

prueba('tramos: el reparto es 3/9/3/9 y no parejo', () => {
  const nombreEn = (t) => franjaDelDia(t).nombre;
  igual(nombreEn(T_SEIS), 'amanecer', 'las 6 arrancan el amanecer');
  igual(nombreEn(T_SIETE), 'amanecer', 'las 7 siguen en amanecer');
  igual(nombreEn(T_NUEVE), 'mediodia', 'a las 9 ya es mediodía');
  igual(nombreEn(T_DIEZ), 'mediodia', 'a las 10 la luz ya no es rosada');
  igual(nombreEn(T0), 'mediodia', 'el mediodía es mediodía');
  igual(nombreEn(T_DIECIOCHO), 'atardecer', 'a las 18 arranca el atardecer');
  igual(nombreEn(T_VEINTE), 'atardecer', 'las 20 son el último del atardecer');
  igual(nombreEn(T_VEINTIUNA), 'noche', 'a las 21 el atardecer se terminó');
  igual(nombreEn(T_NOCHE), 'noche', 'las 23 son de noche');
  igual(nombreEn(T_MADRUGADA), 'noche', 'las 3 son de noche');
});

prueba('noche: la del MUNDO sale del tramo, no del standby', () => {
  igual(esDeNoche(T_VEINTIUNA), true, 'a las 21 el galpón ya es nocturno');
  igual(esDeNoche(T_VEINTE), false, 'a las 20 todavía es atardecer');
  igual(esDeNoche(T_MADRUGADA), true, 'las 3 son de noche');
  igual(esDeNoche(T_SEIS), false, 'a las 6 ya amaneció, aunque Chip duerma');
  igual(esDeNoche(T0), false, 'el mediodía es de día');
});

prueba('desfase: de 21 a 23 el mundo es de noche y Chip está despierto', () => {
  const visual = resolverEstadoVisual({ estado: estado(50), ahora: T_VEINTIUNA, accion: null });
  igual(esDeNoche(T_VEINTIUNA), true, 'el mundo ya se apagó');
  igual(visual === E.standby, false, 'y Chip sigue levantado');
});

prueba('desfase: de 6 a 7 amanece y Chip sigue durmiendo', () => {
  const visual = resolverEstadoVisual({ estado: estado(50), ahora: T_SEIS, accion: null });
  igual(esDeNoche(T_SEIS), false, 'afuera ya amaneció');
  igual(visual, E.standby, 'y Chip se quedó dormido');
});

prueba('desfase: fuera de esas dos ventanas, mundo y Chip coinciden', () => {
  for (const instante of [T0, T_MADRUGADA, T_NOCHE, T_DIEZ, T_DIECIOCHO]) {
    const visual = resolverEstadoVisual({ estado: estado(50), ahora: instante, accion: null });
    igual(
      esDeNoche(instante),
      visual === E.standby,
      `en ${new Date(instante).getHours()}h el mundo y Chip dicen lo mismo`
    );
  }
});

// ---- Las poses de idle ----
//
// La pose no es un estado: no entra en la cadena y no tiene condición. Lo único
// que hay que garantizar es que el índice cicle y que ninguna entrada de
// POSES_IDLE quede sin ruta de sprite — un nombre mal escrito acá se ve como
// idle en producción, porque el loader degrada en silencio.

prueba('poses: el índice cicla y nunca se sale de la lista', () => {
  // Sin índices literales: la lista se achicó a una sola pose cuando
  // idle-manitos quedó suspendida, y un test atado a POSES_IDLE[1] se rompe por
  // el largo en vez de por la propiedad que está cuidando.
  igual(poseDeIdle(0), POSES_IDLE[0], 'el 0 es la primera');
  igual(poseDeIdle(POSES_IDLE.length), POSES_IDLE[0], 'da la vuelta');
  for (let i = -7; i <= 20; i++) {
    igual(POSES_IDLE.includes(poseDeIdle(i)), true, `el índice ${i} cae adentro de la lista`);
  }
  igual(poseDeIdle(-1), POSES_IDLE[POSES_IDLE.length - 1], 'el negativo no rompe');
});

// LA REGLA QUE FALTABA, y que costó media sesión de Chip sin parpadear: el
// parpadeo es una capa aparte que sale de RUTAS_OJOS, y una pose sin recorte de
// ojos no parpadea en toda la sesión. Como la pose se sortea al abrir, el
// síntoma aparecía en la mitad de las visitas y desaparecía en la otra mitad,
// que es la peor forma de un bug.
//
// Esto es lo que tiene que fallar el día que idle-manitos vuelva a POSES_IDLE
// sin su recorte.
prueba('poses: toda pose de idle tiene recorte de ojos y por lo tanto parpadea', () => {
  for (const pose of POSES_IDLE) {
    igual(Boolean(RUTAS_OJOS[pose]), true, `${pose} necesita entrada en RUTAS_OJOS`);
  }
});

prueba('poses: todas tienen sprite declarado', () => {
  for (const pose of POSES_IDLE) {
    igual(typeof RUTAS_SPRITES[pose], 'string', `${pose} tiene ruta`);
  }
});

// La primera pose ES idle: si no lo fuera, el fallback del loader y el default
// de la tabla de la antena estarían apuntando a otra cosa que la que se dibuja.
prueba('poses: la primera es idle', () => {
  igual(POSES_IDLE[0], E.idle, 'idle encabeza la lista de poses');
});

// ---- Las tablas medidas cubren lo que se dibuja ----
//
// Cada clave de sprite que se puede llegar a dibujar necesita su entrada en la
// tabla de la antena, o el glow se dibuja donde no está el bulbo. Es la clase de
// error que no rompe nada y se ve feo para siempre.
prueba('antena: hay posición medida para cada sprite dibujable', () => {
  for (const clave of Object.keys(RUTAS_SPRITES)) {
    igual(typeof POSICIONES_ANTENA[clave], 'object', `${clave} tiene antena medida`);
  }
});

// Y cada estado con pantalla viva necesita su caja, o se dibujaría un rectángulo
// sin coordenadas encima del pecho.
prueba('pantalla: hay caja medida para cada estado con pantalla viva', () => {
  for (const clave of ESTADOS_CON_PANTALLA_VIVA) {
    igual(typeof PANTALLAS_PECHO[clave], 'object', `${clave} tiene pantalla medida`);
  }
});

// ---- La pantalla del pecho es UNA pantalla, no siete ----
//
// Verificado con la batería en el mismo valor en los cinco estados con pantalla
// viva, ampliados al 400%: las barritas cambiaban de proporción entre estados
// —alto/ancho de 2,29 en cargando a 3,17 en limpiando, 38% de dispersión— y el
// número iba de 7,0 px de alto a 10,0, un 43%.
//
// La causa no era el layout, que estaba bien medido: era la caja a la que se
// aplicaba. Los recuadros de los sprites van de 1,186 de aspecto (jugando, que
// se inclina hacia adelante) a 1,505 (cargando), y ese 27% se trasladaba entero
// al contenido.
//
// Estas pruebas fijan el contrato: lo único que puede cambiar entre estados es
// dónde se ancla el contenido y a qué escala. La geometría de adentro, nunca.

prueba('pantalla: las ocho poses dan la MISMA proporción interna', () => {
  for (const [nombre, recuadro] of Object.entries(PANTALLAS_PECHO)) {
    const cont = cajaDeContenidoPantalla(recuadro);
    const aspecto = (recuadro.ancho * cont.ancho) / (recuadro.alto * cont.alto);
    igual(
      Math.abs(aspecto - ASPECTO_PANTALLA) < 0.001,
      true,
      `${nombre}: aspecto del contenido ${aspecto.toFixed(4)} contra ${ASPECTO_PANTALLA}`
    );
  }
});

prueba('pantalla: el contenido entra en el recuadro y va centrado', () => {
  for (const [nombre, recuadro] of Object.entries(PANTALLAS_PECHO)) {
    const cont = cajaDeContenidoPantalla(recuadro);
    igual(cont.ancho <= 100 && cont.alto <= 100, true, `${nombre}: no se desborda`);
    igual(cont.ancho === 100 || cont.alto === 100, true, `${nombre}: toca el lado que lo limita`);
    igual(
      Math.abs(cont.x * 2 + cont.ancho - 100) < 0.001 && Math.abs(cont.y * 2 + cont.alto - 100) < 0.001,
      true,
      `${nombre}: centrado en el eje que sobra`
    );
  }
});

prueba('pantalla: el número entra entero en la caja de contenido', () => {
  // El glifo mide ALTO_NUMERO de la caja de contenido y vive dentro de la caja
  // del número. Si el glifo fuera más alto que su caja, se cortaría abajo — que
  // es exactamente lo que pasaba con 15 cqh del recuadro del sprite.
  igual(ALTO_NUMERO <= CAJA_NUMERO.alto, true, `glifo ${ALTO_NUMERO} en caja ${CAJA_NUMERO.alto}`);
  igual(CAJA_NUMERO.y + CAJA_NUMERO.alto <= 100, true, 'la caja del número no se sale por abajo');
  igual(
    CAJA_SEGMENTOS.y + CAJA_SEGMENTOS.alto <= CAJA_NUMERO.y,
    true,
    'las barras terminan antes de que empiece el número'
  );
});
