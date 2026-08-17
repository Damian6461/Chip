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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  DURACIONES_ACCION,
  DEBOUNCE_VISUAL_MS,
  DURACION_ESPERANDO_MS,
  CATEGORIA_GRANDES,
  TIERS_OBJETO,
  VALORES_ACCION,
  DURACION_CRUCE_FONDO_MS,
  PROBABILIDAD_OBJETO_PISO,
  ZONA_PISO,
  OBJETO_PISO,
  SILUETA_CHIP,
  DURACION_FASTIDIO_MS,
  DURACION_FELIZ_MS,
  CARICIA_HUMOR,
  TOQUE_HUMOR,
  STAT_MAX
} from '../js/config.js';
import { OBJETOS } from '../js/datos-objetos.js';
import { crearEstadoNuevo, cargarEstado, guardarEstado } from '../js/estado.js';
import { cargar, limpiar, jugar } from '../js/acciones.js';
import { EVENTOS } from '../js/datos-eventos.js';
import { abrirVisita } from '../js/visita.js';
import { crearSesion } from '../js/sesion.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

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
  // La duración es la DE CARGAR y no una sola para las tres: ver DURACIONES_ACCION.
  reloj.avanzar(DURACIONES_ACCION.cargar + 1);
  verdadero(sesion.estadoVisual() !== E.cargando, 'cuando vence, deja de ser cargando');
});

// ---- Las acciones ocupan a Chip mientras duran ----
//
// Antes las tres duraban lo mismo y se podía apretar Cargar y Jugar en el mismo
// segundo: Chip pasaba de enchufado a jugando de un cuadro al otro.
//
// NO ES UN COOLDOWN, y estas pruebas fijan la diferencia porque es todo el
// modelo: no hay espera DESPUÉS, no hay penalización, no hay tiempo bloqueado.
// Mientras Chip carga está cargando, y en el instante en que termina vuelve a
// estar todo disponible.

prueba('acciones: las tres duran distinto, porque no son lo mismo', () => {
  verdadero(
    DURACIONES_ACCION.cargar > DURACIONES_ACCION.limpiar,
    'cargar tiene que durar más que limpiar: enchufarse es un proceso'
  );
  verdadero(
    DURACIONES_ACCION.limpiar > DURACIONES_ACCION.jugar,
    'limpiar tiene que durar más que jugar: jugar es un gesto'
  );
});

prueba('acciones: con una en curso, la siguiente no entra', () => {
  const { sesion, vista, guardados } = sesionDePrueba({
    ...crearEstadoNuevo(),
    bateria: 20,
    mantenimiento: 20
  });

  sesion.actualizarVisual({ inmediato: true });
  sesion.ejecutar(E.cargando, cargar, 'cargar');

  const guardadosTrasLaPrimera = guardados();
  const saltosTrasLaPrimera = vista.cuenta.animarAccion;

  sesion.ejecutar(E.limpiando, limpiar, 'limpiar');

  igual(sesion.estado().mantenimiento, 20, 'la segunda no se aplicó');
  igual(guardados(), guardadosTrasLaPrimera, 'y no guardó nada');
  igual(vista.cuenta.animarAccion, saltosTrasLaPrimera, 'ni saltó');
  // En silencio: los botones ya están apagados, así que contestarle "estoy bien"
  // sería explicarle algo que la pantalla ya le está diciendo.
  igual(vista.cuenta.estoyBien, 0, 'y no contesta nada');
  igual(sesion.estadoVisual(), E.cargando, 'sigue cargando');
});

prueba('acciones: NO es un cooldown — al terminar, la siguiente entra al instante', () => {
  const { sesion, reloj } = sesionDePrueba({
    ...crearEstadoNuevo(),
    bateria: 20,
    mantenimiento: 20
  });

  sesion.actualizarVisual({ inmediato: true });
  sesion.ejecutar(E.cargando, cargar, 'cargar');

  // Justo antes de terminar sigue ocupado.
  reloj.avanzar(DURACIONES_ACCION.cargar - 10);
  igual(sesion.ocupado(), true, 'a 10 ms del final todavía está cargando');

  // Y apenas termina, sin un milisegundo de espera extra, la siguiente aplica.
  reloj.avanzar(20);
  igual(sesion.ocupado(), false, 'terminó y ya no está ocupado');

  sesion.ejecutar(E.limpiando, limpiar, 'limpiar');
  cerca(
    sesion.estado().mantenimiento,
    20 + VALORES_ACCION.limpiar.mantenimiento,
    'la limpieza entra sin ninguna espera de por medio'
  );
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

  // Las dos seguidas, pero con la primera terminada: apretar los dos botones en
  // el mismo segundo YA NO aplica las dos —ver "con una en curso"— así que lo
  // que se prueba acá es que dos acciones consecutivas no se pisen el save.
  sesion.ejecutar(E.cargando, cargar, 'cargar');
  reloj.avanzar(DURACIONES_ACCION.cargar + 1);
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
  reloj.avanzar(DURACIONES_ACCION.limpiar + 1);
  verdadero(sesion.estadoVisual() !== E.limpiando, 'al vencer, la acción suelta el sprite');

  // Y lo que suelta es `feliz`, no `idle`: una acción que aplicó encadena la
  // reacción. El único timer que queda es el de esa reacción.
  igual(sesion.estadoVisual(), E.feliz, 'la acción que aplicó deja a Chip contento');
  igual(reloj.cuantosTimers(), 1, 'y el único timer vivo es el de la reacción');

  reloj.avanzar(DURACION_FELIZ_MS + 1);
  igual(sesion.estadoVisual(), E.idle, 'que también se apaga sola y vuelve a idle');
  igual(reloj.cuantosTimers(), 0, 'ahí sí no queda ningún timer colgado');
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

  // Se espera a que la carga termine: con una acción en curso la siguiente no
  // entra, y lo que esta prueba cuida es el save, no esa regla.
  reloj.avanzar(DURACIONES_ACCION.cargar + 1);
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

  // SIN acción de por medio, y es a propósito. La primera versión de esta
  // prueba disparaba `cargar` para forzar un cambio, y dejó de valer cuando las
  // acciones pasaron a durar lo suyo: el debounce vence a los 2 s pero cargar
  // dura 7, así que la cadena seguía devolviendo `cargando` —que le gana a
  // critico— y la prueba fallaba por una razón que no era la suya.
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

  sesion.programarReacciones([
    { id: 'evento-x', texto: '', categoria: CATEGORIA_GRANDES, presente: true }
  ]);

  reloj.avanzar(1);
  igual(sesion.estadoVisual(), E.esperando, 'cuando se lee el evento, Chip se queda esperando');

  reloj.avanzar(DURACION_ESPERANDO_MS + 1);
  igual(sesion.estadoVisual(), antes, 'y cuando termina, vuelve solo');
  igual(reloj.cuantosTimers(), 0, 'sin dejar timers colgados');
});

prueba('sesión: un evento común no dispara `esperando` ni programa nada', () => {
  const { sesion, reloj } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });

  sesion.actualizarVisual({ inmediato: true });
  sesion.programarReacciones([{ id: 'evento-y', texto: '', categoria: 'chicas' }]);

  igual(reloj.cuantosTimers(), 0, 'no hay nada que programar');
  verdadero(sesion.estadoVisual() !== E.esperando, 'y Chip no espera nada');
});

prueba('sesión: una visita nueva cancela los timers de gigante de la anterior', () => {
  const { sesion, reloj } = sesionDePrueba(crearEstadoNuevo(), { ahora: T0 });
  // `presente: true`: la pose la dispara el gigante que ESTÁ, no toda la
  // categoría. Ver programarReacciones.
  const grande = { id: 'evento-x', texto: '', categoria: CATEGORIA_GRANDES, presente: true };

  sesion.actualizarVisual({ inmediato: true });
  sesion.programarReacciones([grande, grande]);
  igual(reloj.cuantosTimers(), 4, 'dos gigantes programan cuatro momentos');

  sesion.programarReacciones([]);
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

// ---- Lo que quedó tirado en el piso ----
//
// El orden de la apertura vuelve a ser la regla, igual que con el decay y la
// presencia: lo que quedó tirado se guarda ANTES de repartir y lo nuevo se
// sortea DESPUÉS. Las dos puntas tienen su prueba porque las dos fallan en
// silencio — una duplica una pieza en el estante y la otra te hace levantar del
// suelo algo que ya tenías.

// Moneda del piso armada a mano. El orden de las tiradas está fijado en
// tirarAlPiso: sale/no sale, cuál, dónde en x, a qué altura.
const CAE_AL_PISO = (indice = 0, x = 0.5, y = 0.5) => {
  const valores = [0, indice, x, y];
  let n = 0;
  return () => valores[Math.min(n++, valores.length - 1)];
};
const NO_CAE_AL_PISO = () => 1;

prueba('piso: lo que quedó tirado la vez pasada se guardó solo', () => {
  const guardado = {
    ...crearEstadoNuevo(),
    ultimaVisita: T0 - 8 * MS_POR_HORA,
    objetoEnPiso: 'resorte',
    ultimosEventosIds: []
  };

  const visita = abrirVisita({
    estado: guardado,
    ahora: T0,
    aleatorio: elegirEstos(['evento-01', 'evento-02']),
    azarRaro: NO_SALE_EL_RARO,
    azarPiso: NO_CAE_AL_PISO
  });

  verdadero(visita.estado.coleccion.includes('resorte'), 'el resorte está en la colección');
  igual(visita.estado.objetoEnPiso, null, 'y ya no está tirado');
  igual(visita.piso, null, 'no cayó nada nuevo');

  // Y no lleva ceremonia: no hay hallazgo, no hay cartel, no hay animación de
  // llegada. Pasó mientras no estabas.
  igual(
    visita.hallazgos.nuevos.filter((o) => o.id === 'resorte').length,
    0,
    'guardarse solo no es un hallazgo'
  );
});

prueba('piso: lo tirado se guarda ANTES de repartir, así no queda duplicado', () => {
  // evento-06 deja la tuerca. Si la tuerca está tirada y el orden se invirtiera,
  // el evento la otorgaría y después el piso la sumaría de nuevo.
  const guardado = {
    ...crearEstadoNuevo(),
    ultimaVisita: T0 - 8 * MS_POR_HORA,
    objetoEnPiso: 'tuerca-cabeza',
    ultimosEventosIds: []
  };

  const visita = abrirVisita({
    estado: guardado,
    ahora: T0,
    aleatorio: elegirEstos(['evento-06', 'evento-07']),
    azarRaro: NO_SALE_EL_RARO,
    azarPiso: NO_CAE_AL_PISO
  });

  igual(
    visita.estado.coleccion.filter((id) => id === 'tuerca-cabeza').length,
    1,
    'la tuerca está una sola vez'
  );
  igual(
    visita.hallazgos.nuevos.filter((o) => o.id === 'tuerca-cabeza').length,
    0,
    'y el evento no la volvió a otorgar: ya era suya'
  );
});

prueba('piso: lo nuevo se sortea DESPUÉS de repartir, nunca algo de esta visita', () => {
  const guardado = {
    ...crearEstadoNuevo(),
    ultimaVisita: T0 - 8 * MS_POR_HORA,
    ultimosEventosIds: []
  };

  // Se corre el sorteo del piso sobre TODOS los casilleros del pool. Ninguno
  // puede caer en algo que esta visita acaba de regalar.
  let cayeron = 0;

  for (let i = 0; i < OBJETOS.length; i++) {
    const visita = abrirVisita({
      estado: guardado,
      ahora: T0,
      aleatorio: elegirEstos(['evento-06', 'evento-07']),
      azarRaro: NO_SALE_EL_RARO,
      azarPiso: CAE_AL_PISO((i + 0.5) / OBJETOS.length)
    });

    if (!visita.piso) continue;
    cayeron++;

    verdadero(
      !visita.estado.coleccion.includes(visita.piso.id),
      visita.piso.id + ' cayó al piso y NO está en la colección'
    );
  }

  verdadero(cayeron > 0, 'y el barrido probó algo: al menos una cayó');
});

prueba('piso: la probabilidad es la de config, ni una décima más', () => {
  const guardado = { ...crearEstadoNuevo(), ultimaVisita: T0 - 8 * MS_POR_HORA };

  const conMoneda = (m) =>
    abrirVisita({
      estado: guardado,
      ahora: T0,
      aleatorio: elegirEstos(['evento-01', 'evento-02']),
      azarRaro: NO_SALE_EL_RARO,
      azarPiso: () => m
    }).piso;

  // Justo abajo del umbral cae; justo en el umbral no. Con >= en vez de > en el
  // código, el borde exacto sería el que se escapa.
  verdadero(conMoneda(PROBABILIDAD_OBJETO_PISO - 0.0001) !== null, 'abajo del umbral cae');
  verdadero(conMoneda(PROBABILIDAD_OBJETO_PISO) === null, 'en el umbral exacto NO cae');
  verdadero(conMoneda(0.99) === null, 'y muy arriba tampoco');
});

prueba('piso: la posición cae siempre adentro de una franja de ZONA_PISO', () => {
  const guardado = { ...crearEstadoNuevo(), ultimaVisita: T0 - 8 * MS_POR_HORA };

  // Se barre el eje entero del sorteo de x, incluidos los dos bordes y la
  // costura entre las dos franjas, que es donde un signo de más manda el objeto
  // a caer justo encima de Chip.
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const visita = abrirVisita({
      estado: guardado,
      ahora: T0,
      aleatorio: elegirEstos(['evento-01']),
      azarRaro: NO_SALE_EL_RARO,
      azarPiso: CAE_AL_PISO(0.5, t, t)
    });

    const { x, y } = visita.piso;
    const dentro = ZONA_PISO.franjas.some((f) => x >= f.x0 - EPSILON && x <= f.x1 + EPSILON);

    verdadero(dentro, 'x=' + x + ' (t=' + t.toFixed(3) + ') cae en una de las dos franjas');
    verdadero(
      y >= ZONA_PISO.y0 - EPSILON && y <= ZONA_PISO.y1 + EPSILON,
      'y=' + y + ' está entre ' + ZONA_PISO.y0 + ' y ' + ZONA_PISO.y1
    );
  }
});

// LOS TRES OBSTÁCULOS, y esto es un guardián de medición como el de las poses.
//
// El pedido nombraba dos —Chip y la botonera— y en el galpón hay tres: el cartel
// de evento se apoya en el piso y no se va nunca. Si alguien mueve la zona sin
// volver a mirar la escena, esto lo frena antes de que el objeto quede abajo de
// algo.
prueba('piso: la zona segura no toca a Chip, ni la botonera, ni el cartel', () => {
  // ESTE TEST TENÍA LOS NÚMEROS MAL, y por eso pasaba con una zona que sí se
  // cruzaba con Chip. Decía "abajo de la mitad ninguna de las nueve poses pasa
  // de x 18,2% ni de x 74,7%", y esos dos valores son los de `critico` sola: la
  // medición vieja se quedó con una pose y los anotó como si fueran la unión.
  // `jugando` llega ocho puntos más a la derecha con su rueda.
  //
  // Ahora el contorno no se escribe acá: sale de SILUETA_CHIP, que es la misma
  // tabla que recorta la zona táctil de Chip, y así las dos cosas no pueden
  // separarse.
  //
  // Y la cuenta se hace en DOS pantallas. La caja de Chip mide 44% del ALTO y la
  // escena tiene el ancho topado en 480, así que cuánto ocupa Chip a lo ancho
  // depende de la proporción: en 480x945 es el 86,6% del ancho y en 390x844 el
  // 95,2%. Una zona que despeja en una puede pisarlo en la otra.
  const PANTALLAS = [
    { nombre: '480x945', w: 480, h: 945 },
    { nombre: '390x844', w: 390, h: 844 }
  ];

  // Las bandas de SILUETA_CHIP que caen dentro de la franja donde vive la pieza.
  // La pieza apoya entre y0 e y1 y mide `lado` de alto, así que ocupa desde
  // y0 - lado hasta y1.
  const bandasDelPiso = (h) => {
    const alto = 44; // % del alto de la escena que mide la caja de Chip
    const base = 82; // % del alto donde apoya
    const techoPieza = ZONA_PISO.y0 - (OBJETO_PISO.lado / h) * 100;
    return SILUETA_CHIP.filter((_, i) => {
      const y0 = base - alto + (SILUETA_CHIP[i][0] / 100) * alto;
      const y1 = base - alto + ((SILUETA_CHIP[i + 1]?.[0] ?? 100) / 100) * alto;
      return y1 > techoPieza && y0 < ZONA_PISO.y1;
    });
  };

  for (const p of PANTALLAS) {
    const anchoChip = ((44 * p.h) / p.w) * 100 / 100; // % del ancho de la escena
    const izqChip = 50 - anchoChip / 2;
    const aEscena = (cx) => izqChip + (cx / 100) * anchoChip;

    const bandas = bandasDelPiso(p.h);
    verdadero(bandas.length > 0, `${p.nombre}: alguna banda de la silueta cae en la franja del piso`);

    const chipIzq = aEscena(Math.min(...bandas.map((b) => b[1])));
    const chipDer = aEscena(Math.max(...bandas.map((b) => b[2])));
    const media = (OBJETO_PISO.lado / p.w) * 100 / 2;

    for (const f of ZONA_PISO.franjas) {
      verdadero(
        f.x1 + media <= chipIzq || f.x0 - media >= chipDer,
        `${p.nombre}: la pieza dibujada en la franja ${f.x0}-${f.x1} no toca la silueta ` +
          `(${chipIzq.toFixed(1)} a ${chipDer.toFixed(1)}, media pieza ${media.toFixed(1)})`
      );
      verdadero(
        f.x0 - media >= 0 && f.x1 + media <= 100,
        `${p.nombre}: la pieza de la franja ${f.x0}-${f.x1} entra entera en la escena`
      );
    }
  }

  // El cartel de evento arranca en y 86,7% y la botonera en y 93%.
  verdadero(ZONA_PISO.y1 <= 86.7, 'el techo de la zona queda arriba del cartel de evento');
  verdadero(ZONA_PISO.y1 < 93, 'y bien lejos de la botonera');
  verdadero(ZONA_PISO.y0 < ZONA_PISO.y1, 'y la zona tiene alto');
});

// LA CAJA TÁCTIL, que es lo que el dedo toca y no lo que el ojo ve.
//
// El mínimo recomendado es 44x44. La pieza medía 25 y por eso levantarla era
// difícil incluso cuando el tap llegaba.
prueba('piso: la pieza respeta el mínimo táctil y el dibujo entra adentro', () => {
  verdadero(OBJETO_PISO.toque >= 44, `la caja táctil mide ${OBJETO_PISO.toque}, el mínimo es 44`);
  verdadero(
    OBJETO_PISO.lado <= OBJETO_PISO.toque,
    'el dibujo entra en la caja: si fuera más grande, el padding sería negativo'
  );
  verdadero(
    OBJETO_PISO.lado >= 34,
    `el dibujo mide ${OBJETO_PISO.lado} y se pidió 34-38 para que se descubra`
  );

  // Y el CSS tiene que estar usando las dos, no una sola: con la caja sin el
  // dibujo la pieza se ve gigante, y con el dibujo sin la caja no cambia nada
  // del área táctil.
  const CSS = readFileSync(join(RAIZ, 'style.css'), 'utf8');
  verdadero(
    CSS.includes('var(--objeto-piso-toque)') && CSS.includes('var(--objeto-piso-lado)'),
    'style.css lee las dos medidas'
  );
});

// LA ZONA TÁCTIL DE CHIP existe y está recortada. Sin esto se puede volver al
// cuadrado de 416 px sin que nada se queje: la escena se ve idéntica y lo único
// que cambia es que el tap de la pieza vuelve a írsele a Chip.
prueba('chip: el toque lo recibe la zona recortada y no la caja entera', () => {
  const CSS = readFileSync(join(RAIZ, 'style.css'), 'utf8');
  const HTML = readFileSync(join(RAIZ, 'index.html'), 'utf8');

  verdadero(HTML.includes('id="zona-chip"'), 'el nodo de la zona está en el documento');
  verdadero(/#chip\s*\{[^}]*pointer-events:\s*none/s.test(CSS), '#chip no engancha el puntero');
  verdadero(
    /#zona-chip\s*\{[^}]*clip-path:\s*var\(--zona-chip\)/s.test(CSS),
    'la zona se recorta con el polígono del tema'
  );

  // Y el polígono tiene que ser MÁS CHICO que la caja: si alguien lo aplanara a
  // un rectángulo completo, el recorte dejaría de recortar.
  const ancho = Math.max(...SILUETA_CHIP.map((b) => b[2] - b[1]));
  verdadero(ancho < 95, `la banda más ancha del polígono ocupa ${ancho}% de la caja, no el 100%`);
});

prueba('sesión: levantar del piso lo guarda y pone la cara de fastidio', () => {
  const { sesion, reloj, vista } = sesionDePrueba({
    ...crearEstadoNuevo(),
    objetoEnPiso: 'resorte'
  });

  sesion.actualizarVisual({ inmediato: true });
  const antes = sesion.estadoVisual();

  igual(sesion.recogerDelPiso('resorte'), true, 'aplicó');
  igual(sesion.estado().objetoEnPiso, null, 'ya no está tirado');
  verdadero(sesion.estado().coleccion.includes('resorte'), 'y está en la colección');
  igual(cargarEstado().objetoEnPiso, null, 'el save también lo sabe');

  igual(sesion.estadoVisual(), E.esperando, 'los brazos cruzados: se lo ordenaste');

  reloj.avanzar(DURACION_FASTIDIO_MS - 1);
  igual(sesion.estadoVisual(), E.esperando, 'y se aguanta los dos segundos');

  // PRIMERO SE QUEJA Y DESPUÉS SE PONE CONTENTO de tenerlo. El encadenado es el
  // punto: la queja sola se lee como "no le gustó" y la alegría sola pierde el
  // chiste de que se lo ordenaste.
  reloj.avanzar(2);
  igual(sesion.estadoVisual(), E.feliz, 'después de la queja, contento de tenerlo');

  reloj.avanzar(DURACION_FELIZ_MS + 1);
  igual(sesion.estadoVisual(), antes, 'y recién ahí vuelve a lo que estaba');
  verdadero(vista.cuenta.render > 0, 'y todo eso se pintó');
});

prueba('sesión: levantar dos veces la misma pieza no la suma dos veces', () => {
  const { sesion } = sesionDePrueba({ ...crearEstadoNuevo(), objetoEnPiso: 'resorte' });

  igual(sesion.recogerDelPiso('resorte'), true, 'la primera aplica');
  igual(sesion.recogerDelPiso('resorte'), false, 'la segunda no');
  igual(
    sesion.estado().coleccion.filter((id) => id === 'resorte').length,
    1,
    'y quedó una sola vez'
  );
});

prueba('sesión: levantar algo que NO está tirado no hace nada', () => {
  const { sesion } = sesionDePrueba({ ...crearEstadoNuevo(), objetoEnPiso: 'resorte' });

  igual(sesion.recogerDelPiso('tuerca-cabeza'), false, 'no aplica');
  igual(sesion.recogerDelPiso(null), false, 'ni con null');
  igual(sesion.estado().objetoEnPiso, 'resorte', 'el resorte sigue tirado');
});

// EL FASTIDIO NO ES UNA ACCIÓN. No ocupa a Chip, no apaga los botones y no
// bloquea nada — igual que la caricia. Es una cara, no un estado de juego.
prueba('sesión: el fastidio no ocupa a Chip', () => {
  // El mantenimiento va bajo a propósito: con el estado nuevo, los tres stats
  // arrancan en 100 y limpiar no aplica —contesta "estoy bien" y no pasa nada—,
  // así que la prueba habría dado verde sin probar nada.
  const { sesion } = sesionDePrueba({
    ...crearEstadoNuevo(),
    mantenimiento: 40,
    objetoEnPiso: 'resorte'
  });

  sesion.recogerDelPiso('resorte');
  igual(sesion.ocupado(), false, 'no está ocupado: la cara no es una acción');
  igual(sesion.estadoVisual(), E.esperando, 'y sí está con la cara de fastidio');

  // Y las acciones siguen entrando con normalidad: la cadena pone los estados de
  // acción ARRIBA de esperando, así que la acción le gana al fastidio.
  sesion.ejecutar(E.limpiando, limpiar, 'limpiar');
  igual(sesion.estadoVisual(), E.limpiando, 'limpiar entró igual y le ganó a la cara');
});

// ---- Los tres gestos, del lado del modelo ----
//
// ui.js decide CUÁL gesto fue —eso es interpretación de punteros y no se puede
// probar sin navegador— y la sesión decide qué significa cada uno. Esto prueba
// lo segundo, que es donde están las reglas.
//
// Lo que hace que los tres signifiquen cosas distintas es que DEN cosas
// distintas: si acariciar y tocar dieran lo mismo, arrastrar el dedo sería una
// forma más incómoda de tocar.

prueba('gestos: la caricia da más que el toque', () => {
  const { sesion: a } = sesionDePrueba({ ...crearEstadoNuevo(), humor: 50 });
  igual(a.acariciar(), true, 'la caricia aplica');
  const conCaricia = a.estado().humor - 50;

  const { sesion: b } = sesionDePrueba({ ...crearEstadoNuevo(), humor: 50 });
  igual(b.tocar(), true, 'el toque aplica');
  const conToque = b.estado().humor - 50;

  cerca(conCaricia, CARICIA_HUMOR, 'la caricia sube lo que dice config');
  cerca(conToque, TOQUE_HUMOR, 'y el toque lo suyo');
  verdadero(conToque < conCaricia, `${conToque} es menos que ${conCaricia}`);
});

// LOS TRES GESTOS NO PUEDEN DEJAR UN POZO EN EL MEDIO. La decisión vive en
// ui.js —que necesita un DOM y no se importa acá— así que se lee como texto,
// igual que style.css un poco más arriba en este mismo archivo.
//
// Qué pasó: además de `habiaMantenido` había un `duro < TOQUE_SECO_MS` con
// TOQUE_SECO_MS en 200 ms, o sea un segundo umbral MÁS CHICO que el del
// mantenido (500 ms). Dos umbrales de tiempo así no separan dos gestos: dejan
// un pozo de 300 ms donde soltar no era nada. Ni toque, ni panel, ni una unidad
// para el fastidio — y por eso Chip no se enojaba nunca aunque lo picaran.
//
// Verificado en el navegador por las dos puntas: el teclado llama a unToque()
// sin puerta de duración y cuatro Enter seguidos dejan a Chip en `esperando`
// 2,4 s; con el dedo, soltar a los 300 ms no hacía nada.
prueba('gestos: soltar sin moverse siempre es un toque, sin pozo en el medio', () => {
  const UI = readFileSync(join(RAIZ, 'js/ui.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const cuerpo = UI.match(/function soltarGesto\([\s\S]*?\n}/);
  verdadero(cuerpo !== null, 'tiene que existir soltarGesto en ui.js');

  verdadero(
    /if \(habiaMantenido\) unToque\(\);/.test(cuerpo[0]),
    'la rama del toque decide sólo por habiaMantenido'
  );
  verdadero(
    !/duro\s*[<>]/.test(cuerpo[0]),
    'ningún umbral de duración adicional: el del mantenido ya parte el espacio'
  );
});

prueba('gestos: con el humor lleno ninguno de los dos aplica', () => {
  const { sesion } = sesionDePrueba({ ...crearEstadoNuevo(), humor: STAT_MAX });

  igual(sesion.acariciar(), false, 'la caricia no aplica');
  igual(sesion.tocar(), false, 'el toque tampoco');
  igual(sesion.estado().humor, STAT_MAX, 'y el humor no se movió');
});

// LA CARICIA PONE CONTENTO Y EL TOQUE NO, y esa es la diferencia que hace que
// los dos gestos digan cosas distintas del personaje. Un toque es un sobresalto,
// no una alegría.
prueba('gestos: la caricia pone contento; el toque, no', () => {
  const { sesion: a } = sesionDePrueba({ ...crearEstadoNuevo(), humor: 50 });
  a.actualizarVisual({ inmediato: true });
  a.acariciar();
  igual(a.estadoVisual(), E.feliz, 'acariciar deja a Chip contento');

  const { sesion: b } = sesionDePrueba({ ...crearEstadoNuevo(), humor: 50 });
  b.actualizarVisual({ inmediato: true });
  const antes = b.estadoVisual();
  b.tocar();
  igual(b.estadoVisual(), antes, 'tocar no cambia el estado visual');
});

prueba('gestos: fastidiarse pone la cara y se pasa solo', () => {
  const { sesion, reloj } = sesionDePrueba({ ...crearEstadoNuevo(), humor: 50 });
  sesion.actualizarVisual({ inmediato: true });
  const antes = sesion.estadoVisual();

  igual(sesion.estaFastidiado(), false, 'arranca tranquilo');
  sesion.fastidiar();
  igual(sesion.estaFastidiado(), true, 'y se fastidia');
  igual(sesion.estadoVisual(), E.esperando, 'con los brazos cruzados');

  reloj.avanzar(DURACION_FASTIDIO_MS - 1);
  igual(sesion.estadoVisual(), E.esperando, 'se lo aguanta');

  reloj.avanzar(2);
  igual(sesion.estaFastidiado(), false, 'y se le pasa solo');
  igual(sesion.estadoVisual(), antes, 'volviendo a lo que estaba');
});

// EL FASTIDIO NO ENCADENA EN FELIZ, a diferencia del de que le levanten algo
// del piso. Ahí primero se queja y después se pone contento de tenerlo; acá no
// hay nada que agradecer, lo estuviste picando con el dedo.
prueba('gestos: el fastidio del toque NO termina en feliz', () => {
  const { sesion, reloj } = sesionDePrueba({ ...crearEstadoNuevo(), humor: 50 });
  sesion.actualizarVisual({ inmediato: true });

  sesion.fastidiar();
  reloj.avanzar(DURACION_FASTIDIO_MS + 1);

  verdadero(sesion.estadoVisual() !== E.feliz, 'no se pone contento después de fastidiarse');
});

// NO BAJA NINGÚN STAT. Es la única forma de molestarlo que tiene el juego y es
// graciosa, no punitiva — el modelo sin culpa no se toca.
prueba('gestos: fastidiarse no cuesta nada', () => {
  const { sesion } = sesionDePrueba({ ...crearEstadoNuevo(), bateria: 60, humor: 55, mantenimiento: 70 });
  const antes = sesion.estado();

  sesion.fastidiar();
  const despues = sesion.estado();

  igual(despues.bateria, antes.bateria, 'la batería no baja');
  igual(despues.humor, antes.humor, 'el humor tampoco');
  igual(despues.mantenimiento, antes.mantenimiento, 'ni el mantenimiento');
});

// Y no ocupa a Chip: es una cara, no un estado de juego. Las tres teclas siguen
// funcionando mientras dura.
prueba('gestos: fastidiado, las acciones siguen entrando', () => {
  const { sesion } = sesionDePrueba({ ...crearEstadoNuevo(), mantenimiento: 40 });
  sesion.actualizarVisual({ inmediato: true });

  sesion.fastidiar();
  igual(sesion.ocupado(), false, 'no está ocupado');

  sesion.ejecutar(E.limpiando, limpiar, 'limpiar');
  igual(sesion.estadoVisual(), E.limpiando, 'y limpiar le gana a la cara');
});

// Mientras Chip está ocupado con una acción, ni la caricia ni el toque entran.
// Es la misma regla que ya valía: mientras carga, está cargando.
prueba('gestos: con una acción en curso no entra ninguno de los dos', () => {
  const { sesion } = sesionDePrueba({ ...crearEstadoNuevo(), bateria: 30, humor: 50 });
  sesion.actualizarVisual({ inmediato: true });
  sesion.ejecutar(E.cargando, cargar, 'cargar');

  igual(sesion.ocupado(), true, 'está cargando');
  igual(sesion.acariciar(), false, 'la caricia no entra');
  igual(sesion.tocar(), false, 'el toque tampoco');
});
