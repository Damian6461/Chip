// Sistema de eventos: cuántos tocan según las horas, que no se repita el
// último mostrado, que el evento del brazo ya no salga por sorteo, y que
// las migraciones de save no rompan una partida vieja. La cadencia diaria y la
// colección tienen su propio archivo: coleccion.test.js.

import { prueba, igual, verdadero } from './runner.js';
import { T0 } from './config.pruebas.js';
import {
  VERSION_ESTADO,
  MAX_EVENTOS_POR_VISITA,
  CATEGORIA_GRANDES,
  EVENTO_LLUVIA,
  CLIMAS,
  FRANJAS_DIA
} from '../js/config.js';
import { readFileSync } from 'node:fs';

const SONIDO_JS = readFileSync(new URL('../js/sonido.js', import.meta.url), 'utf8');
const UI_JS = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const ESTADO_JS = readFileSync(new URL('../js/estado.js', import.meta.url), 'utf8');
import { EVENTOS, EVENTOS_POR_CATEGORIA, CATEGORIAS, EVENTO_RARO } from '../js/datos-eventos.js';
import { elegirEventos } from '../js/eventos.js';
import { cargarEstado, guardarEstado } from '../js/estado.js';

// Con `aleatorio` fijo el sorteo es determinista: siempre saca el primero de la
// bolsa de candidatos.
const PRIMERO = () => 0;


// ---- Cuántos eventos según las horas ----

prueba('eventos: menos de 1 hora no muestra nada', () => {
  igual(elegirEventos(0, [], PRIMERO).length, 0, '0 h -> ningún evento');
  igual(elegirEventos(0.99, [], PRIMERO).length, 0, '0.99 h -> ningún evento');
});

prueba('eventos: entre 1 y 6 horas muestra uno', () => {
  igual(elegirEventos(1, [], PRIMERO).length, 1, '1 h -> un evento (borde inclusive)');
  igual(elegirEventos(3, [], PRIMERO).length, 1, '3 h -> un evento');
  igual(elegirEventos(6, [], PRIMERO).length, 1, '6 h -> un evento (borde inclusive)');
});

prueba('eventos: más de 6 horas muestra hasta dos', () => {
  igual(elegirEventos(6.1, [], PRIMERO).length, 2, '6.1 h -> dos eventos');
  igual(
    elegirEventos(24, [], PRIMERO).length,
    MAX_EVENTOS_POR_VISITA,
    '24 h -> el máximo'
  );
});

// ---- No repetir NADA de la visita anterior ----

prueba('eventos: cualquiera de la visita anterior queda excluido', () => {
  for (const excluido of EVENTOS.map((e) => e.id)) {
    const elegidos = elegirEventos(24, [excluido], PRIMERO);
    verdadero(
      elegidos.every((e) => e.id !== excluido),
      `${excluido} quedó excluido del sorteo`
    );
  }
});

prueba('eventos: si la visita anterior mostró dos, NINGUNO de los dos se repite', () => {
  const anteriores = elegirEventos(24, [], PRIMERO);
  igual(anteriores.length, 2, 'la visita anterior mostró dos');

  const ids = anteriores.map((e) => e.id);
  const siguientes = elegirEventos(24, ids, PRIMERO);

  verdadero(
    siguientes.every((e) => !ids.includes(e.id)),
    `ninguno de ${ids.join(' y ')} volvió a salir`
  );
  igual(siguientes.length, 2, 'igual salen dos: el pool alcanza');
});

prueba('eventos: sin ultimosIds se comporta como si no hubiera exclusiones', () => {
  igual(elegirEventos(24, undefined, PRIMERO).length, 2, 'undefined -> default []');
  igual(elegirEventos(24, [], PRIMERO).length, 2, '[] -> sin exclusiones');
});

prueba('eventos: los dos de una misma visita son distintos entre sí', () => {
  const elegidos = elegirEventos(24, [], PRIMERO);
  igual(elegidos.length, 2, 'salieron dos');
  verdadero(elegidos[0].id !== elegidos[1].id, 'no se repite el mismo evento en una visita');
});

prueba('eventos: con aleatorio fijo el resultado es reproducible', () => {
  const a = elegirEventos(24, [], PRIMERO);
  const b = elegirEventos(24, [], PRIMERO);
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

// ---- El evento del brazo ----
//
// Ya no se sortea. Era el "evento raro" con moneda cargada al 1.5% por visita;
// ahora es el hito del arco de la grúa y lo dispara gigantes.js cuando la
// presencia llega al umbral. Lo que este archivo verifica es que este módulo no
// lo conozca; el arco tiene sus pruebas en gigantes.test.js.

prueba('brazo: no está en el pool general', () => {
  verdadero(
    !EVENTOS.some((e) => e.id === EVENTO_RARO.id),
    'nunca fue uno más de la bolsa'
  );
});

prueba('brazo: elegirEventos no lo devuelve nunca', () => {
  for (const horas of [1, 3, 6, 10, 24]) {
    const elegidos = elegirEventos(horas, [], PRIMERO);
    verdadero(
      elegidos.every((e) => e.id !== EVENTO_RARO.id),
      `${horas} h: el brazo no sale de acá`
    );
  }
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

// ---- Los brazos cruzados, y por qué no son toda la categoría ----
//
// `grandes` pasó de 5 eventos a 13 sobre 48 cuando entró el pool de 36. Si los
// trece dispararan la pose, cruzarse de brazos dejaría de ser una reacción y
// pasaría a ser una muletilla. La bandera `presente` separa al gigante que ESTÁ
// del rastro que dejó uno que ya pasó.
//
// La banda no es un capricho: menos de seis y la pose casi no se ve; más de
// ocho y vuelve el problema. Este test la fija.

prueba('gigantes: sólo una parte de `grandes` dispara los brazos cruzados', () => {
  const grandes = EVENTOS.filter((e) => e.categoria === CATEGORIA_GRANDES);
  const presentes = grandes.filter((e) => e.presente);

  verdadero(grandes.length > 8, `son ${grandes.length}, así que la distinción hace falta`);
  verdadero(
    presentes.length >= 6 && presentes.length <= 8,
    `disparan ${presentes.length} de ${grandes.length}, y la banda es 6 a 8`
  );
});

prueba('gigantes: `presente` es un dato y no una heurística sobre el texto', () => {
  // Si alguien la reemplaza por una búsqueda de palabras en la línea, esto lo
  // agarra: la bandera tiene que estar en el objeto.
  const conBandera = EVENTOS.filter((e) => 'presente' in e);
  verdadero(conBandera.length > 0, 'hay eventos con la bandera puesta');
  verdadero(
    conBandera.every((e) => e.categoria === CATEGORIA_GRANDES),
    'y ninguno fuera de `grandes` la lleva: no significa nada ahí'
  );
});

prueba('gigantes: el evento raro también tiene al gigante presente', () => {
  // "La grúa vieja bajó el brazo hasta su altura y lo dejó ahí un segundo."
  // Si ese no cruza los brazos, ninguno.
  verdadero(EVENTO_RARO.presente === true, 'la grúa está ahí, bajando el brazo');
});

// ---- La lluvia, que es un evento y no un tramo ----

prueba('lluvia: el evento que la dispara existe en el pool', () => {
  const suyo = EVENTOS.find((e) => e.id === EVENTO_LLUVIA);
  verdadero(suyo !== undefined, `${EVENTO_LLUVIA} tiene que estar entre los eventos`);
  verdadero(/lluvia/i.test(suyo.texto), 'y su texto tiene que ser el de la lluvia');
});

prueba('lluvia: NO es un quinto tramo del día', () => {
  // Si alguien la agrega a FRANJAS_DIA, la lluvia pasa a tener hora y a entrar
  // en la rotación, que es exactamente lo que el canon dice que no es. Es un
  // evento que además se ve y se escucha.
  const nombres = FRANJAS_DIA.map((f) => f.nombre);
  verdadero(!nombres.includes('lluvia'), `las franjas son ${nombres.join(', ')} y nada más`);
  igual(nombres.length, 4, 'cuatro tramos, los de siempre');
});

prueba('lluvia: mientras llueve, la franja no le pisa el ambiente', () => {
  // sonido.js no se importa en Node. Se lee como texto, igual que style.css en
  // composicion.test.js: sin este corte, la próxima pintada volvería a pedir el
  // ambiente de la hora y la lluvia se apagaría sola a los segundos.
  const codigo = SONIDO_JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  verdadero(/if \(lloviendo\) return;/.test(codigo), 'ambientar corta si está lloviendo');
  verdadero(/export function llover\(\)/.test(codigo), 'y hay una forma de prenderla');
});

// ---- Los dos climas ----
//
// Son eventos que además cambian el MUNDO, no tramos del día. La distinción no
// es semántica: si entraran en la rotación tendrían hora, saldrían todos los
// días a la misma y dejarían de sorprender, que es de dónde sale su valor.

prueba('climas: cada uno sale de un evento que existe en el pool', () => {
  for (const [nombre, clima] of Object.entries(CLIMAS)) {
    const suyo = EVENTOS.find((e) => e.id === clima.evento);
    verdadero(suyo !== undefined, `${nombre} apunta a ${clima.evento}, que tiene que estar en el pool`);
    igual(suyo.categoria, 'resto', `${nombre} es de la familia de Chip parando a mirar algo`);
  }
});

prueba('climas: ninguno es un tramo del día', () => {
  const nombres = FRANJAS_DIA.map((f) => f.nombre);
  for (const nombre of Object.keys(CLIMAS)) {
    verdadero(!nombres.includes(nombre), `${nombre} no puede estar entre las franjas`);
  }
  igual(nombres.length, 4, 'cuatro tramos, los de siempre');
});

prueba('climas: son excluyentes por construcción y no por una condición', () => {
  // ui.js guarda UN clima activo, no una lista. Es lo que hace estructuralmente
  // imposible que haya niebla y tormenta a la vez: para que las hubiera habría
  // que cambiar la forma del dato, no olvidarse de un if.
  const codigo = UI_JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  verdadero(/let climaActivo = null;/.test(codigo), 'hay un solo clima activo');
  verdadero(
    /climaActivo = nombre;/.test(codigo),
    'y ponerClima lo REEMPLAZA, no lo acumula'
  );
  verdadero(
    !/climaActivo\.push|climaActivo\.add/.test(codigo),
    'nada de listas de climas'
  );
});

prueba('climas: cada uno trae su fondo, y el fondo existe', () => {
  for (const [nombre, clima] of Object.entries(CLIMAS)) {
    verdadero(
      typeof clima.fondo === 'string' && clima.fondo.endsWith('.webp'),
      `${nombre} tiene que traer su fondo`
    );
    // La rotación horaria es FRANJAS_DIA y son CUATRO fondos. Esto comparaba
    // contra un `RUTAS_FONDOS` de dos entradas, así que un clima que apuntara a
    // `fondo-amanecer.webp` pasaba: el guardián decía "no pisa la rotación"
    // mirando media rotación.
    const deLaRotacion = FRANJAS_DIA.map((f) => f.fondo);
    verdadero(
      !deLaRotacion.includes(clima.fondo),
      `${clima.fondo} no puede estar además en la rotación horaria`
    );
  }
});

prueba('climas: sólo la tormenta trae lluvia', () => {
  igual(CLIMAS.tormenta.llueve, true, 'la tormenta llueve');
  igual(CLIMAS.niebla.llueve, false, 'la niebla no: se siente por lo que no hay');
});

prueba('climas: no se persisten, así que a la próxima visita el mundo vuelve', () => {
  // Si `climaActivo` entrara al estado guardado, un día de tormenta duraría para
  // siempre. Vive en una variable de módulo de ui.js y en ningún save.
  const codigo = ESTADO_JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  verdadero(!/clima/i.test(codigo), 'estado.js no sabe que existen los climas');
});
