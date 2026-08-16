// El orquestador: la visita y la sesión.
//
// Esto es lo que faltaba. Las siete suites anteriores prueban PIEZAS —el decay,
// la cadena, los eventos, la colección, el arco— y todas pasaban mientras el
// lugar donde esas piezas se combinan no tenía una sola prueba. Combinar es
// justamente donde están los errores que ninguna pieza puede tener sola: el
// orden de dos pasos, un estado leído antes de actualizarse, dos guardados que
// se pisan.
//
// No se prueba main.js: main.js es cableado y no decide nada. Se prueban los dos
// módulos a los que se les sacó la decisión de adentro, que es lo mismo que
// probar el orquestador y además se puede correr en Node.

import { prueba, igual, cerca, verdadero } from './runner.js';
import { T0, T_VEINTE, T_VEINTIUNA, EPSILON } from './config.pruebas.js';
import {
  MS_POR_HORA,
  MAX_DECAY_HOURS,
  DECAY_POR_HORA,
  DECAY_FLOOR,
  MAX_OBJETOS_POR_VISITA,
  ESTADOS_VISUALES as E,
  DURACION_ESTADO_ACCION_MS,
  DEBOUNCE_VISUAL_MS,
  DURACION_ESPERANDO_MS,
  CATEGORIA_GRANDES,
  TIERS_OBJETO,
  VALORES_ACCION,
  DURACION_CRUCE_FONDO_MS
} from '../js/config.js';
import { crearEstadoNuevo, cargarEstado, guardarEstado } from '../js/estado.js';
import { cargar, limpiar, jugar } from '../js/acciones.js';
import { EVENTOS } from '../js/datos-eventos.js';
import { abrirVisita } from '../js/visita.js';
import { crearSesion } from '../js/sesion.js';

// ---- Los dobles ----

// Un `aleatorio` que hace que elegirEventos saque exactamente estos ids, en este
// orden. Se calcula contra EVENTOS de verdad en vez de escribir fracciones a
// mano: así agregar un evento al pool no rompe estas pruebas por una razón que
// no tiene nada que ver con lo que están probando.
function elegirEstos(ids, excluidos = []) {
  const restantes = EVENTOS.map((evento) => evento.id).filter((id) => !excluidos.includes(id));

  const fracciones = ids.map((id) => {
    const i = restantes.indexOf(id);
    if (i < 0) throw new Error(`${id} no está disponible en el pool`);
    restantes.splice(i, 1);
    // El medio del casillero, para que el floor no dependa de la precisión.
    return (i + 0.5) / (restantes.length + 1);
  });

  let n = 0;
  return () => fracciones[n++];
}

const SALE_EL_RARO = () => 0;
const NO_SALE_EL_RARO = () => 1;

// Reloj controlado. Las DOS lecturas se mueven por separado a propósito: es la
// única forma de probar que el debounce mide el reloj de pared y la cadena mide
// el del mundo. Ver la cabecera de sesion.js.
function relojFalso(inicio) {
  let pared = inicio;
  let mundo = inicio;
  let siguienteId = 1;
  let pendientes = [];

  return {
    mundo: () => mundo,
    real: () => pared,
    programar(fn, ms) {
      const id = siguienteId++;
      pendientes.push({ id, fn, vence: pared + ms });
      return id;
    },
    cancelar(id) {
      pendientes = pendientes.filter((t) => t.id !== id);
    },

    // --- control ---
    ponerHoraDelMundo(t) {
      mundo = t;
    },
    // Corre el reloj de pared y dispara lo vencido en orden. Un timer que
    // programa otro timer dentro de la misma ventana también corre: por eso es
    // un while y no un forEach.
    avanzar(ms) {
      const fin = pared + ms;
      let vencido = pendientes.filter((t) => t.vence <= fin).sort((a, b) => a.vence - b.vence)[0];

      while (vencido) {
        pared = vencido.vence;
        pendientes = pendientes.filter((t) => t.id !== vencido.id);
        vencido.fn();
        vencido = pendientes.filter((t) => t.vence <= fin).sort((a, b) => a.vence - b.vence)[0];
      }

      pared = fin;
    },
    cuantosTimers: () => pendientes.length
  };
}

// Vista falsa: cuenta llamadas y guarda los argumentos del último render, que es
// donde viajan el tramo, la noche y el cruce.
function vistaFalsa() {
  const cuenta = { render: 0, sembrarFondo: 0, animarAccion: 0, celebrarHumor: 0, estoyBien: 0 };
  let ultimoRender = null;
  let fondoSembrado = null;

  return {
    cuenta,
    ultimoRender: () => ultimoRender,
    fondoSembrado: () => fondoSembrado,
    render(estado, estadoVisual, esNoche, luz, claveSprite, franja, cruce) {
      cuenta.render++;
      ultimoRender = { estado, estadoVisual, esNoche, luz, claveSprite, franja, cruce };
    },
    sembrarFondo(ruta) {
      cuenta.sembrarFondo++;
      fondoSembrado = ruta;
    },
    animarAccion: () => cuenta.animarAccion++,
    celebrarHumor: () => cuenta.celebrarHumor++,
    responderEstoyBien: () => cuenta.estoyBien++
  };
}

// Sesión armada con dobles y con el save de verdad —el almacén falso ya está
// instalado—, para que "se guardó" quiera decir que se puede volver a leer.
function sesionDePrueba(estado, { ahora = T0 } = {}) {
  const reloj = relojFalso(ahora);
  const vista = vistaFalsa();
  let guardados = 0;

  const sesion = crearSesion({
    estado,
    vista,
    reloj,
    guardar(e) {
      guardados++;
      guardarEstado(e);
    },
    poseInicial: 0
  });

  return { sesion, reloj, vista, guardados: () => guardados };
}

// ---- 1. El ciclo de visita completo ----

prueba('visita: el ciclo completo deja un save coherente consigo mismo', () => {
  const ahora = T0;
  const guardado = {
    ...crearEstadoNuevo(),
    ultimaVisita: ahora - 8 * MS_POR_HORA,
    ultimosEventosIds: [],
    ultimoDiaVisitado: null,
    ultimoDiaConEvento: null
  };

  const visita = abrirVisita({
    estado: guardado,
    ahora,
    aleatorio: elegirEstos(['evento-06', 'evento-07']),
    azarRaro: NO_SALE_EL_RARO
  });

  // 1. el decay se cobró con las horas reales
  cerca(visita.horasFuera, 8, 'ocho horas afuera');
  cerca(visita.estado.bateria, 100 - DECAY_POR_HORA.bateria * 8, 'la batería bajó ocho horas');
  igual(visita.estado.ultimaVisita, ahora, 'y ultimaVisita quedó en ahora, no antes');

  // 2. la presencia se contó UNA vez
  igual(visita.estado.diasDePresencia, 1, 'el día de hoy cuenta uno');
  igual(visita.diaNuevo, true, 'y se sabe que era un día nuevo');

  // 3. ocho horas son dos eventos
  igual(visita.eventos.length, 2, 'ocho horas traen los dos eventos');

  // 4. lo mostrado quedó anotado para que no se repita
  igual(
    visita.estado.ultimosEventosIds.join(','),
    visita.eventos.map((e) => e.id).join(','),
    'los ids anotados son los que se mostraron'
  );
  verdadero(visita.estado.ultimoDiaConEvento !== null, 'y el día quedó marcado con evento');

  // 5. lo que la visita dejó está en la colección, y nada más que eso
  for (const objeto of visita.hallazgos.nuevos) {
    verdadero(visita.estado.coleccion.includes(objeto.id), `${objeto.id} entró a la colección`);
  }
  igual(
    visita.estado.coleccion.length,
    guardado.coleccion.length + visita.hallazgos.nuevos.length,
    'la colección creció exactamente lo que se encontró'
  );

  // 6. y el save sobrevive a la ida y vuelta por localStorage
  guardarEstado(visita.estado);
  igual(
    JSON.stringify(cargarEstado()),
    JSON.stringify(visita.estado),
    'lo que se guarda es lo que se lee'
  );
});

prueba('visita: la presencia no se cuenta dos veces si abrís de nuevo el mismo día', () => {
  const primera = abrirVisita({
    estado: { ...crearEstadoNuevo(), ultimaVisita: T0 - 8 * MS_POR_HORA },
    ahora: T0,
    aleatorio: elegirEstos(['evento-06', 'evento-07']),
    azarRaro: NO_SALE_EL_RARO
  });

  const segunda = abrirVisita({
    estado: primera.estado,
    ahora: T0 + 10 * 60 * 1000,
    aleatorio: elegirEstos(['evento-09'], primera.estado.ultimosEventosIds),
    azarRaro: NO_SALE_EL_RARO
  });

  igual(primera.estado.diasDePresencia, 1, 'la primera abre el día');
  igual(segunda.estado.diasDePresencia, 1, 'la segunda del mismo día no suma');
  igual(segunda.diaNuevo, false, 'y lo dice');
});

// ---- 2. La primera visita absoluta ----

prueba('visita: la primera visita absoluta arranca en los defaults y no inventa nada', () => {
  const nuevo = crearEstadoNuevo();
  const visita = abrirVisita({
    estado: { ...nuevo, ultimaVisita: T0 },
    ahora: T0,
    aleatorio: elegirEstos(['evento-06']),
    azarRaro: SALE_EL_RARO
  });

  // Cero horas afuera: el decay no puede tocar nada.
  cerca(visita.horasFuera, 0, 'no pasó tiempo');
  igual(visita.estado.bateria, nuevo.bateria, 'la batería queda en el default');
  igual(visita.estado.humor, nuevo.humor, 'el humor también');
  igual(visita.estado.mantenimiento, nuevo.mantenimiento, 'y el mantenimiento');

  // Pero la garantía diaria sí aplica: una partida nueva no arranca en blanco.
  igual(visita.eventos.length, 1, 'la garantía diaria trae un evento igual');
  igual(visita.estado.diasDePresencia, 1, 'y el día uno queda contado');

  // Nada raro: sin presencia no hay hito, aunque el hito no mire las horas.
  igual(visita.estado.hitosVistos.length, 0, 'con presencia 1 no hay hito que disparar');

  // Y la colección sólo puede crecer con objetos del evento que salió.
  const idsDelEvento = new Set(visita.hallazgos.nuevos.map((o) => o.eventoId));
  for (const id of idsDelEvento) {
    igual(id, 'evento-06', 'no se otorga nada de un evento que no salió');
  }
});

prueba('visita: sin la moneda del raro, una partida nueva no puede empezar con el raro', () => {
  const visita = abrirVisita({
    estado: { ...crearEstadoNuevo(), ultimaVisita: T0 },
    ahora: T0,
    aleatorio: elegirEstos(['evento-08']),
    azarRaro: NO_SALE_EL_RARO
  });

  for (const objeto of visita.hallazgos.nuevos) {
    verdadero(objeto.tier !== TIERS_OBJETO.raro, `${objeto.id} no puede ser raro con la moneda en contra`);
  }
});

// ---- 4. La ausencia larga ----

prueba('visita: volver tras 200 h respeta el cap de 24 h de decay', () => {
  const visita = abrirVisita({
    estado: { ...crearEstadoNuevo(), ultimaVisita: T0 - 200 * MS_POR_HORA },
    ahora: T0,
    aleatorio: elegirEstos(['evento-08', 'evento-06']),
    azarRaro: SALE_EL_RARO
  });

  cerca(visita.horasFuera, MAX_DECAY_HOURS, '200 horas se cobran como 24');

  // La batería a 5/h se pasaría de largo en 24 h: la frena el piso, no el cap.
  igual(visita.estado.bateria, DECAY_FLOOR, 'la batería toca el piso');
  cerca(
    visita.estado.humor,
    100 - DECAY_POR_HORA.humor * MAX_DECAY_HOURS,
    'el humor baja 24 horas y ni una más'
  );
  cerca(
    visita.estado.mantenimiento,
    100 - DECAY_POR_HORA.mantenimiento * MAX_DECAY_HOURS,
    'el mantenimiento también'
  );
});

prueba('visita: y respeta el cap de 3 objetos, dejando el cuarto para más adelante', () => {
  // evento-08 deja tres objetos él solo; evento-06 deja un cuarto.
  const primera = abrirVisita({
    estado: { ...crearEstadoNuevo(), ultimaVisita: T0 - 200 * MS_POR_HORA },
    ahora: T0,
    aleatorio: elegirEstos(['evento-08', 'evento-06']),
    azarRaro: SALE_EL_RARO
  });

  igual(primera.hallazgos.nuevos.length, MAX_OBJETOS_POR_VISITA, 'la visita corta en tres');
  verdadero(
    !primera.estado.coleccion.includes('tuerca-cabeza'),
    'el cuarto objeto no entró aunque su evento se mostró'
  );

  // Y lo que quedó afuera NO se pierde: sigue faltando, así que puede volver.
  // Vuelve una visita después y no la siguiente, porque evento-06 se mostró y
  // los ids de la última visita quedan excluidos. Ese retraso de una visita es
  // consecuencia de la regla de exclusión, no un olvido.
  const segunda = abrirVisita({
    estado: primera.estado,
    ahora: T0 + 30 * MS_POR_HORA,
    aleatorio: elegirEstos(['evento-01', 'evento-02'], primera.estado.ultimosEventosIds),
    azarRaro: NO_SALE_EL_RARO
  });

  verdadero(
    !segunda.estado.ultimosEventosIds.includes('evento-06'),
    'en la visita siguiente evento-06 está excluido'
  );

  const tercera = abrirVisita({
    estado: segunda.estado,
    ahora: T0 + 60 * MS_POR_HORA,
    aleatorio: elegirEstos(['evento-06', 'evento-07'], segunda.estado.ultimosEventosIds),
    azarRaro: NO_SALE_EL_RARO
  });

  verdadero(
    tercera.estado.coleccion.includes('tuerca-cabeza'),
    'y cuando su evento vuelve a salir, el objeto que había quedado en la cola se otorga'
  );
});

// ---- 3. La acción que no aplica ----

prueba('sesión: una acción que no hace falta no guarda, no salta y no festeja', () => {
  const { sesion, vista, guardados } = sesionDePrueba({
    ...crearEstadoNuevo(),
    bateria: 100
  });

  sesion.actualizarVisual({ inmediato: true });
  const visualAntes = sesion.estadoVisual();
  const guardadosAntes = guardados();
  const estadoAntes = sesion.estado();

  sesion.ejecutar(E.cargando, cargar, 'cargar');

  igual(vista.cuenta.estoyBien, 1, 'Chip contesta que ya está atendido');
  igual(vista.cuenta.animarAccion, 0, 'no salta');
  igual(vista.cuenta.celebrarHumor, 0, 'no tira corazones');
  igual(guardados(), guardadosAntes, 'y no se guarda nada');
  igual(sesion.estado(), estadoAntes, 'el estado es el mismo objeto, no una copia igual');
  igual(sesion.estadoVisual(), visualAntes, 'y el sprite no se mueve');
});

prueba('sesión: la acción que SÍ aplica guarda, salta y marca su estado visual', () => {
  const { sesion, vista, reloj, guardados } = sesionDePrueba({
    ...crearEstadoNuevo(),
    bateria: 40
  });

  sesion.actualizarVisual({ inmediato: true });
  const guardadosAntes = guardados();

  sesion.ejecutar(E.cargando, cargar, 'cargar');

  igual(vista.cuenta.estoyBien, 0, 'acá no contesta: hace');
  igual(vista.cuenta.animarAccion, 1, 'salta una vez');
  igual(guardados(), guardadosAntes + 1, 'y guarda una vez');
  cerca(sesion.estado().bateria, 40 + VALORES_ACCION.cargar.bateria, 'la batería subió');
  igual(sesion.estadoVisual(), E.cargando, 'y el sprite es el de cargando');

  // El estado de acción vence solo y devuelve la cadena a lo que corresponda.
  reloj.avanzar(DURACION_ESTADO_ACCION_MS + 1);
  verdadero(sesion.estadoVisual() !== E.cargando, 'cuando vence, deja de ser cargando');
});

prueba('sesión: jugar con el humor al máximo gasta batería pero no festeja', () => {
  const { sesion, vista } = sesionDePrueba({
    ...crearEstadoNuevo(),
    bateria: 80,
    humor: 100
  });

  sesion.actualizarVisual({ inmediato: true });
  sesion.ejecutar(E.jugando, jugar, 'jugar');

  // `aplica` corta antes: con el humor en 100 la acción no hace falta.
  igual(vista.cuenta.estoyBien, 1, 'contesta que está bien');
  igual(vista.cuenta.celebrarHumor, 0, 'y no hay nada que festejar');
  igual(sesion.estado().bateria, 80, 'ni se gasta batería, porque ni se ejecuta');
});

// ---- 6. El doble guardado ----

prueba('sesión: dos acciones seguidas dejan un save con las dos, no con una', () => {
  const { sesion, reloj } = sesionDePrueba({
    ...crearEstadoNuevo(),
    bateria: 20,
    mantenimiento: 20
  });

  sesion.actualizarVisual({ inmediato: true });

  // Sin avanzar el reloj entre las dos: es el caso del jugador que aprieta los
  // dos botones al toque.
  sesion.ejecutar(E.cargando, cargar, 'cargar');
  sesion.ejecutar(E.limpiando, limpiar, 'limpiar');

  const enMemoria = sesion.estado();
  const enDisco = cargarEstado();

  cerca(enMemoria.bateria, 20 + VALORES_ACCION.cargar.bateria, 'la carga está');
  cerca(
    enMemoria.mantenimiento,
    20 + VALORES_ACCION.limpiar.mantenimiento,
    'y la limpieza también'
  );
  igual(JSON.stringify(enDisco), JSON.stringify(enMemoria), 'el save tiene exactamente lo mismo');
  igual(sesion.estadoVisual(), E.limpiando, 'y el sprite es el de la última');

  // Y el timer de la primera acción no revive a la segunda: cuando vence el de
  // limpiar, `accionEnCurso` ya no existe y la cadena decide sola.
  reloj.avanzar(DURACION_ESTADO_ACCION_MS + 1);
  verdadero(sesion.estadoVisual() !== E.limpiando, 'al vencer, la acción suelta el sprite');
  igual(reloj.cuantosTimers(), 0, 'y no queda ningún timer colgado');
});

prueba('sesión: un cambio de tramo entre dos acciones no se come ninguna de las dos', () => {
  const { sesion, reloj } = sesionDePrueba(
    { ...crearEstadoNuevo(), bateria: 20, mantenimiento: 20 },
    { ahora: T_VEINTE }
  );

  sesion.actualizarVisual({ inmediato: true });
  sesion.actualizarNoche();

  sesion.ejecutar(E.cargando, cargar, 'cargar');

  // El tick del minuto cruza a la noche y guarda el tramo. Ese guardado escribe
  // el estado ENTERO, así que si leyera una copia vieja se llevaría puesta la
  // carga de recién.
  reloj.ponerHoraDelMundo(T_VEINTIUNA);
  sesion.tick();

  sesion.ejecutar(E.limpiando, limpiar, 'limpiar');

  const enDisco = cargarEstado();
  cerca(enDisco.bateria, 20 + VALORES_ACCION.cargar.bateria, 'la carga sobrevivió al cruce');
  cerca(
    enDisco.mantenimiento,
    20 + VALORES_ACCION.limpiar.mantenimiento,
    'y la limpieza posterior también'
  );
  igual(enDisco.ultimaFranja, 'noche', 'y el tramo quedó anotado');
});

// ---- 5. El cruce de tramo con la sesión abierta ----

prueba('sesión: el tick cruza el límite del tramo y avisa que cambió', () => {
  const { sesion, reloj, vista } = sesionDePrueba(crearEstadoNuevo(), { ahora: T_VEINTE });

  sesion.actualizarVisual({ inmediato: true });
  sesion.actualizarNoche();
  sesion.pintar();

  igual(sesion.franja().nombre, 'atardecer', 'a las 20 es atardecer');
  igual(sesion.esNoche(), false, 'y no es de noche');

  reloj.ponerHoraDelMundo(T_VEINTIUNA);
  const cambio = sesion.tick();

  igual(cambio, true, 'a las 21 el tick avisa que algo cambió');
  igual(sesion.franja().nombre, 'noche', 'el tramo es noche');
  igual(sesion.esNoche(), true, 'y el galpón se hace de noche');
  igual(vista.ultimoRender().cruce, DURACION_CRUCE_FONDO_MS, 'con disolvencia, no de golpe');
  igual(cargarEstado().ultimaFranja, 'noche', 'y el tramo nuevo quedó guardado');
});

prueba('sesión: el cruce de tramo no toca los stats ni pierde el sprite de crítico', () => {
  // Con la batería en rojo, `critico` le gana a `standby`: cruzar el límite NO
  // puede cambiar el sprite, pero SÍ tiene que cambiar el galpón. Es el caso que
  // obliga a que los dos chequeos del tick corran sin cortocircuito.
  const inicial = { ...crearEstadoNuevo(), bateria: 5, humor: 42, mantenimiento: 71 };
  const { sesion, reloj } = sesionDePrueba(inicial, { ahora: T_VEINTE });

  sesion.actualizarVisual({ inmediato: true });
  sesion.actualizarNoche();
  igual(sesion.estadoVisual(), E.critico, 'con la batería en 5 el sprite es crítico');

  reloj.ponerHoraDelMundo(T_VEINTIUNA);
  igual(sesion.tick(), true, 'el tick avisa igual');

  igual(sesion.estadoVisual(), E.critico, 'el sprite sigue siendo crítico');
  igual(sesion.esNoche(), true, 'pero el galpón ya es de noche');

  const estado = sesion.estado();
  igual(estado.bateria, inicial.bateria, 'la batería no la tocó nadie');
  igual(estado.humor, inicial.humor, 'el humor tampoco');
  igual(estado.mantenimiento, inicial.mantenimiento, 'ni el mantenimiento');
  igual(estado.ultimaVisita, inicial.ultimaVisita, 'y el tick no aplica decay');
});

prueba('sesión: la medianoche pasa sin cambiar el tramo y sin escribir el save', () => {
  const antes = new Date(2026, 0, 15, 23, 30, 0).getTime();
  const despues = new Date(2026, 0, 16, 0, 30, 0).getTime();

  const { sesion, reloj, guardados } = sesionDePrueba(crearEstadoNuevo(), { ahora: antes });

  sesion.actualizarVisual({ inmediato: true });
  sesion.actualizarNoche();
  const guardadosAntes = guardados();

  reloj.ponerHoraDelMundo(despues);

  igual(sesion.tick(), false, 'cruzar la medianoche no cambia nada visible');
  igual(sesion.franja().nombre, 'noche', 'antes y después es noche');
  igual(guardados(), guardadosAntes, 'y el save no se escribe por un cambio de fecha');
});

prueba('sesión: el tramo sólo se guarda cuando cambia, no en cada tick', () => {
  const { sesion, reloj, guardados } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });

  sesion.actualizarVisual({ inmediato: true });
  sesion.actualizarNoche();

  const guardadosTrasElPrimero = guardados();

  for (let i = 0; i < 10; i++) {
    reloj.avanzar(60_000);
    sesion.tick();
  }

  igual(guardados(), guardadosTrasElPrimero, 'diez ticks adentro del mismo tramo, cero escrituras');
});

// ---- El fade de apertura ----

prueba('sesión: si el tramo cambió mientras no estabas, el fondo se siembra con el anterior', () => {
  const { sesion, vista } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });

  const atardecer = { nombre: 'atardecer', fondo: 'sprites/fondo-dia.webp' };
  const sembro = sesion.sembrarTramoAnterior(atardecer, 400);

  igual(sembro, true, 'a mediodía, viniendo del atardecer, hay de dónde venir');
  igual(vista.fondoSembrado(), atardecer.fondo, 'y se siembra el fondo del tramo viejo');

  // actualizarNoche entra sí o sí acá —el tramo sembrado es distinto del real—
  // y antes pisaba la duración de apertura con la de cruce. Que el 400 llegue
  // entero a la pintada es la prueba de ese arreglo.
  sesion.actualizarNoche();
  sesion.pintar();
  igual(vista.ultimoRender().cruce, 400, 'la primera pintada trae la disolvencia de APERTURA');

  sesion.pintar();
  igual(vista.ultimoRender().cruce, null, 'y la segunda ya no: el cruce es un evento, no un modo');
});

prueba('sesión: si el tramo es el mismo, no hay nada que sembrar', () => {
  const { sesion, vista } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });

  const mediodia = { nombre: 'mediodia', fondo: 'sprites/fondo-mediodia.webp' };

  igual(sesion.sembrarTramoAnterior(mediodia, 400), false, 'no sembró');
  igual(vista.cuenta.sembrarFondo, 0, 'y no tocó el fondo');
});

// ---- El debounce ----

prueba('sesión: el debounce suprime el cambio pero converge cuando vence', () => {
  const { sesion, reloj } = sesionDePrueba({ ...crearEstadoNuevo(), bateria: 40 }, { ahora: T0 });

  sesion.actualizarVisual({ inmediato: true });
  sesion.ejecutar(E.cargando, cargar, 'cargar');

  // Bajar la batería a rojo justo después: el cambio a critico se suprime.
  sesion.establecerEstado({ ...sesion.estado(), bateria: 5 });
  igual(sesion.actualizarVisual(), false, 'el cambio se suprime');

  // El timer del debounce vuelve a RESOLVER la cadena, no a reproducir el
  // objetivo viejo: por eso lo que llega es el estado correcto de ese momento y
  // no el que había cuando se suprimió.
  reloj.avanzar(DEBOUNCE_VISUAL_MS + 1);
  igual(sesion.estadoVisual(), E.critico, 'y al vencer el debounce llega al estado correcto');
});

// ---- Los gigantes que pasan ----

prueba('sesión: el evento de un gigante prende y apaga `esperando` solo', () => {
  const { sesion, reloj } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });

  sesion.actualizarVisual({ inmediato: true });
  const antes = sesion.estadoVisual();

  sesion.programarEsperando([{ id: 'evento-x', texto: '', categoria: CATEGORIA_GRANDES }]);

  reloj.avanzar(1);
  igual(sesion.estadoVisual(), E.esperando, 'cuando se lee el evento, Chip se queda esperando');

  reloj.avanzar(DURACION_ESPERANDO_MS + 1);
  igual(sesion.estadoVisual(), antes, 'y cuando termina, vuelve solo');
  igual(reloj.cuantosTimers(), 0, 'sin dejar timers colgados');
});

prueba('sesión: un evento común no dispara `esperando` ni programa nada', () => {
  const { sesion, reloj } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });

  sesion.actualizarVisual({ inmediato: true });
  sesion.programarEsperando([{ id: 'evento-y', texto: '', categoria: 'chicas' }]);

  igual(reloj.cuantosTimers(), 0, 'no hay nada que programar');
  verdadero(sesion.estadoVisual() !== E.esperando, 'y Chip no espera nada');
});

prueba('sesión: una visita nueva cancela los timers de gigante de la anterior', () => {
  const { sesion, reloj } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });
  const grande = { id: 'evento-x', texto: '', categoria: CATEGORIA_GRANDES };

  sesion.actualizarVisual({ inmediato: true });
  sesion.programarEsperando([grande, grande]);
  igual(reloj.cuantosTimers(), 4, 'dos gigantes programan cuatro momentos');

  sesion.programarEsperando([]);
  igual(reloj.cuantosTimers(), 0, 'y la tanda siguiente los limpia a todos');
});

prueba('sesión: el debounce mide el reloj de pared, no el del mundo', () => {
  const { sesion, reloj } = sesionDePrueba({ ...crearEstadoNuevo(), bateria: 40 }, { ahora: T0 });

  sesion.actualizarVisual({ inmediato: true });
  sesion.ejecutar(E.cargando, cargar, 'cargar');

  // Forzar la hora del mundo mueve la cadena, pero no puede regalarle horas al
  // debounce: si el debounce leyera esta hora, se saltearía siempre.
  reloj.ponerHoraDelMundo(T_VEINTIUNA);

  igual(sesion.actualizarVisual(), false, 'sin tiempo de pared, el cambio se suprime');
  verdadero(reloj.cuantosTimers() > 0, 'y queda un timer para reintentar');
});
