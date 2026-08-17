// Cableado. Este módulo no decide nada del juego: arma las piezas, les pasa el
// reloj real y el DOM real, y las conecta entre sí.
//
// Lo que decide vive en dos lados y los dos se pueden probar sin navegador:
//
// - visita.js: qué pasa al abrir. Función pura de (estado, ahora) a lo que hay
//   que mostrar.
// - sesion.js: qué pasa mientras está abierta. Fábrica que recibe vista, reloj
//   y guardado.
//
// Acá quedan las cuatro cosas que sólo tienen sentido con un navegador delante:
// el reloj de pared, los timers de verdad, el service worker y el panel de
// debug. Y el estado vivo ya no vive acá: lo tiene la sesión.

import { MS_POR_HORA, FRANJAS_DIA, DURACION_CRUCE_APERTURA_MS, DURACION_CRUCE_FONDO_MS, TICK_VISUAL_MS, ESTADOS_VISUALES as E, PARAM_DEBUG, RUTA_SW, ZONA_PISO, CLIMAS } from './config.js';
import { crearEstadoNuevo, cargarEstado, guardarEstado } from './estado.js';
import { aplicarDecay } from './decay.js';
import { cargar, jugar, limpiar } from './acciones.js';
import { OBJETOS } from './datos-objetos.js';
import { hitoPendiente, eventoDeHito, capaPorDias } from './gigantes.js';
import { cargarSprites, franjaDelDia } from './sprites.js';
import { abrirVisita } from './visita.js';
import { crearSesion } from './sesion.js';
import { ambientar, encender, llover as lloverAmbiente, dejarDeLlover as dejarDeLloverAmbiente } from './sonido.js';
import {
  render,
  sembrarFondo,
  aplicarAjustes,
  conectarMenu,
  mostrarEventos,
  mostrarColeccion,
  mostrarGigantes,
  conectarAcciones,
  conectarCaricia,
  conectarPiso,
  ponerEnElPiso,
  conectarDebugOculto,
  ponerClima,
  enojarse,
  animarAccion,
  iniciarAccion,
  celebrarHumor,
  responderEstoyBien
} from './ui.js';

// ---- El reloj ----
//
// `horaForzada` sólo la escribe el panel de debug. Mueve el reloj del MUNDO
// entero, no sólo el sprite: por eso el fondo y el estado visual cambian juntos
// y no puede quedar Chip durmiendo con el galpón de día.
//
// El reloj de pared NO se fuerza nunca. Es el que mide el debounce, que cuenta
// cuánto hace que cambió el sprite; forzarlo lo rompería. Ver sesion.js.
let horaForzada = null; // 0-23, o null para el reloj real

const reloj = {
  mundo() {
    if (horaForzada === null) return Date.now();

    const fecha = new Date();
    fecha.setHours(horaForzada, 0, 0, 0);
    return fecha.getTime();
  },
  real: () => Date.now(),
  programar: (fn, ms) => setTimeout(fn, ms),
  cancelar: (id) => clearTimeout(id)
};

// ---- La visita ----

const guardado = cargarEstado();
const visita = abrirVisita({ estado: guardado, ahora: Date.now() });

guardarEstado(visita.estado);

// `refrescarDebug` lo engancha el panel si está activo. Se cuelga del render y
// no de un pintar() propio a propósito: así la lectura de stats sigue TODAS las
// pintadas, incluidas las que dispara la sesión sola desde sus timers —el
// vencimiento de una acción, el debounce, el gigante que pasa— y no sólo las que
// arrancan de un botón.
let refrescarDebug = null;

const sesion = crearSesion({
  estado: visita.estado,
  vista: {
    render(...args) {
      render(...args);
      // El ambiente sigue al MISMO tramo que el fondo: llega como argumento de
      // render y no de un reloj propio. ambientar() ignora los repetidos, así
      // que llamarlo en cada pintada no cuesta nada.
      ambientar(args[5]?.nombre);
      if (refrescarDebug) refrescarDebug();
    },
    sembrarFondo,
    animarAccion,
    iniciarAccion,
    celebrarHumor,
    responderEstoyBien,
    // UN CLIMA TOCA TRES COSAS: el fondo, el dibujo de encima y el ambiente.
    // Las tres se juntan acá, que es donde se cablea todo lo que cruza módulos.
    //
    // El ambiente sólo lo cambia la tormenta. La niebla no tiene sonido propio a
    // propósito: se siente por lo que NO hay, así que sigue el ambiente de la
    // franja como cualquier otro día.
    ponerClima(nombre, cruce) {
      ponerClima(nombre, cruce);
      if (CLIMAS[nombre]?.llueve) lloverAmbiente();
      else dejarDeLloverAmbiente();
    },
    enojarse
  },
  reloj,
  guardar: guardarEstado
});

const pintar = sesion.pintar;

mostrarEventos(visita.eventos);
sesion.programarReacciones(visita.eventos);
mostrarColeccion(sesion.estado().coleccion, visita.hallazgos.nuevos);
// Después de mostrarColeccion y no antes: la pieza del piso saca su nombre del
// mismo pool que el estante, y el aria-label lo necesita puesto.
ponerEnElPiso(visita.piso);
mostrarGigantes(sesion.estado().diasDePresencia, sesion.estado().hitosVistos);

// Los ajustes se aplican ANTES del primer pintado: si no, el juego arranca con
// todo moviéndose y recién después se apaga, que es peor que no tener ajuste.
aplicarAjustes(sesion.estado().ajustes);

conectarMenu({
  ajustesActuales: () => sesion.estado().ajustes,
  onMovimiento(activado) {
    const e = sesion.estado();
    sesion.establecerEstado({ ...e, ajustes: { ...e.ajustes, movimientoReducido: activado } });
    aplicarAjustes(sesion.estado().ajustes);
  },
  onSonido(activado) {
    const e = sesion.estado();
    sesion.establecerEstado({ ...e, ajustes: { ...e.ajustes, sonido: activado } });
    // Este click ES el gesto de usuario que el navegador exige para poder
    // reproducir audio, así que encender() sólo puede llamarse desde acá.
    encender(activado);
  },
  onReiniciar() {
    // El mismo camino que el botón del panel de debug, pero con confirmación
    // adelante. Reiniciar borra la colección, la presencia y los stats.
    sesion.establecerEstado(crearEstadoNuevo());
    aplicarAjustes(sesion.estado().ajustes);
    // Reiniciar devuelve el ajuste a su default, que es apagado.
    encender(false);
    mostrarColeccion(sesion.estado().coleccion);
    mostrarGigantes(sesion.estado().diasDePresencia, sesion.estado().hitosVistos);
    sesion.actualizarVisual({ inmediato: true });
    pintar();
  }
});

conectarAcciones({
  // Cargar no pasa por `ejecutar`: dejó de ser un salto de valor con una
  // animación encima y pasó a ser un proceso que dura lo que lo sostengas. La
  // sesión es la dueña del proceso; acá sólo se dice cuándo baja y sube el dedo.
  onCargarAbajo: () => sesion.arrancarCarga(),
  onCargarArriba: () => sesion.soltarCarga(),
  onJugar: () => sesion.ejecutar(E.jugando, jugar, 'jugar'),
  onLimpiar: () => sesion.ejecutar(E.limpiando, limpiar, 'limpiar')
});

// El gesto de acariciar. Va aparte de conectarAcciones porque no es una acción:
// no tiene tecla, no tiene estado visual y no ocupa a Chip. ui.js decide CUÁNDO
// —el cooldown de la animación y el cansancio son suyos— y la sesión decide SI
// aplica, que es lo del modelo.
// Los tres gestos. ui.js decide CUÁL fue —interpretar punteros es presentación—
// y la sesión decide qué significa cada uno.
conectarCaricia({
  onCaricia: () => sesion.acariciar(),
  onToque: () => sesion.tocar(),
  onFastidio: () => sesion.fastidiar(),
  fastidiado: () => sesion.estaFastidiado()
});

// Levantar lo que quedó tirado. ui.js avisa qué se tocó, la sesión decide si
// aplica y repinta el estante con la pieza ya en su casillero; recién entonces
// ui.js puede medir a dónde volarla.
conectarPiso((id) => {
  if (!sesion.recogerDelPiso(id)) return false;
  mostrarColeccion(sesion.estado().coleccion);
  return true;
});

sesion.actualizarVisual({ inmediato: true });

// El fade de apertura. Casi nadie va a tener la app abierta justo en el minuto
// del cambio de tramo; en cambio todos abren después de horas y encuentran el
// galpón distinto. Es la misma lógica que los eventos: lo que pasó mientras no
// estabas se muestra, no se oculta.
sesion.sembrarTramoAnterior(
  FRANJAS_DIA.find((f) => f.nombre === guardado.ultimaFranja),
  DURACION_CRUCE_APERTURA_MS
);

sesion.actualizarNoche();
cargarSprites().then(pintar);
pintar();

// Reevaluación periódica. Ver tick() en sesion.js: el único efecto real es
// detectar el cruce de un límite de tramo con la app abierta.
setInterval(sesion.tick, TICK_VISUAL_MS);

// ---- Service worker ----
// Se registra también en desarrollo: localhost es contexto seguro y el SW anda
// ahí sin trucos. Si parece que los cambios no se aplican, es caché: el bloque
// de cabecera de sw.js tiene el procedimiento.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(RUTA_SW);
}

// ---- Modo debug ----
// Todo lo que el panel necesita del juego pasa por acá: debug.js no importa ni
// estado.js ni sesion.js, y el estado vivo nunca sale de la sesión.
const apiDebug = {
  obtenerEstado: () => sesion.estado(),

  obtenerNombresVisuales: () => Object.values(E),

  // Cambia la pose de idle a mano. Con el sorteo por sesión, verla cambiar pide
  // recargar; esto la fuerza sin recargar.
  cambiarPose: () => {
    const clave = sesion.cambiarPose();
    pintar();
    return clave;
  },

  // Para que el panel pueda mostrar "3/8" sin importar datos-objetos.js por su
  // cuenta: todo lo que el debug sabe del juego pasa por acá.
  totalDeObjetos: () => OBJETOS.length,

  // La capa que alcanzó el arco con la presencia de hoy, para verlo avanzar en
  // el panel sin abrir la colección.
  capaDeLaGrua: () => capaPorDias(sesion.estado().diasDePresencia),

  // Suma el primer objeto que falte, para poder ver el estante poblado sin
  // esperar a que el sorteo lo traiga. Pasa por el mismo camino que un hallazgo
  // real: cambia el estado, se guarda y se repinta.
  sumarObjeto() {
    const estado = sesion.estado();
    const falta = OBJETOS.find((objeto) => !estado.coleccion.includes(objeto.id));
    if (!falta) return;

    sesion.establecerEstado({ ...estado, coleccion: [...estado.coleccion, falta.id] });
    mostrarColeccion(sesion.estado().coleccion, [falta]);
    pintar();
  },

  // Tira al piso la primera pieza que falte, sin esperar a que la moneda del 15%
  // salga. Pasa por el mismo camino que una de verdad: escribe objetoEnPiso en
  // el estado y la dibuja, así que levantarla ejerce el código real.
  tirarObjetoAlPiso() {
    const estado = sesion.estado();
    let falta = OBJETOS.find((objeto) => !estado.coleccion.includes(objeto.id));
    let coleccion = estado.coleccion;

    // CON LA COLECCIÓN COMPLETA NO HAY NADA QUE TIRAR, y eso es correcto: sólo
    // cae al piso lo que Chip todavía no tiene. Pero entonces el botón deja de
    // servir justo cuando uno quiere probar, que es lo que pasó la primera vez
    // que se intentó verificar el punto 9. Así que acá —y sólo acá, que es el
    // panel de debug— se le saca la última pieza a la colección para poder
    // volver a encontrarla. El juego nunca hace esto.
    if (!falta) {
      const ultima = coleccion[coleccion.length - 1];
      falta = OBJETOS.find((objeto) => objeto.id === ultima);
      if (!falta) return null;
      coleccion = coleccion.slice(0, -1);
    }

    sesion.establecerEstado({ ...estado, coleccion, objetoEnPiso: falta.id });
    mostrarColeccion(sesion.estado().coleccion);
    ponerEnElPiso({ id: falta.id, x: ZONA_PISO.franjas[1].x0 + 4, y: ZONA_PISO.y1 - 4 });
    return falta.id;
  },

  // Un clima sin esperar a que salga su evento, que es uno de cuarenta y nueve.
  // Pasa por el MISMO camino que el evento: la misma llamada, el mismo fondo, el
  // mismo ambiente. No hay un modo clima aparte que probar.
  ponerClima(nombre) {
    ponerClima(nombre, DURACION_CRUCE_FONDO_MS);
    if (CLIMAS[nombre]?.llueve) lloverAmbiente();
    else dejarDeLloverAmbiente();
    return true;
  },

  // Simula presencia acumulada para ver el arco de los gigantes avanzar sin
  // esperar meses. No recarga: repinta la colección en el lugar, así se puede
  // ver la capa cambiar con el panel abierto.
  sumarDias(dias) {
    const estado = sesion.estado();
    sesion.establecerEstado({ ...estado, diasDePresencia: estado.diasDePresencia + dias });
    mostrarGigantes(sesion.estado().diasDePresencia, sesion.estado().hitosVistos);
    pintar();
  },

  // Dispara el hito que esté pendiente, si lo hay, sin esperar a la próxima
  // apertura. Devuelve el texto para poder verificarlo desde el panel.
  dispararHito() {
    const estado = sesion.estado();
    const pendiente = hitoPendiente(estado.diasDePresencia, estado.hitosVistos);
    if (!pendiente) return null;

    sesion.establecerEstado({ ...estado, hitosVistos: [...estado.hitosVistos, pendiente.id] });

    const evento = eventoDeHito(pendiente);
    mostrarEventos([evento]);
    // El mismo par que en el arranque. Si acá faltara, el hito de la grúa —que
    // es de la categoría `grandes`— saldría por debug sin la pose, y el panel
    // estaría probando un camino que no es el del juego.
    sesion.programarReacciones([evento]);
    mostrarGigantes(sesion.estado().diasDePresencia, sesion.estado().hitosVistos);
    pintar();
    return pendiente.hito;
  },

  // El multiplicador escala cuántas horas representa cada simulación, para
  // probar el decay sin esperar horas reales.
  simularHoras(horas, multiplicador) {
    const estado = sesion.estado();
    const retrocedido = {
      ...estado,
      ultimaVisita: estado.ultimaVisita - horas * multiplicador * MS_POR_HORA
    };
    sesion.establecerEstado(aplicarDecay(retrocedido));
    sesion.actualizarVisual({ inmediato: true });
    pintar();
  },

  // Retrocede ultimaVisita SIN aplicar decay y recarga, para que el arranque
  // corra completo igual que si hubieras cerrado y vuelto a abrir la app.
  // simularHoras no sirve para esto: aplica el decay en el momento, así que al
  // recargar ya no quedan horas transcurridas y los eventos nunca se disparan.
  volverTrasHoras(horas, multiplicador) {
    const estado = sesion.estado();
    guardarEstado({
      ...estado,
      ultimaVisita: estado.ultimaVisita - horas * multiplicador * MS_POR_HORA
    });
    location.reload();
  },

  forzarEstadoVisual(nombre) {
    sesion.forzarVisual(nombre);
    sesion.actualizarVisual({ inmediato: true });
    pintar();
  },

  forzarHora(hora) {
    horaForzada = hora;
    sesion.actualizarVisual({ inmediato: true });
    sesion.actualizarNoche();
    pintar();
  },

  // Para poder ver el fade de apertura sin esperar seis horas: deja el save
  // apuntando a otro tramo y recarga, que es exactamente el camino real.
  simularAperturaEnOtroTramo() {
    const actual = franjaDelDia(reloj.mundo());
    const otra = FRANJAS_DIA.find((f) => f.nombre !== actual.nombre);
    sesion.establecerEstado({ ...sesion.estado(), ultimaFranja: otra.nombre });
    location.reload();
  },

  // Mismo camino que el reinicio del menú, y con las mismas tres repintadas: sin
  // ellas el save quedaba en cero pero el estante seguía mostrando los objetos
  // de la partida anterior hasta que recargaras, que es justo la clase de mentira
  // que un panel de debug no puede permitirse.
  reiniciarSave() {
    sesion.establecerEstado(crearEstadoNuevo());
    mostrarColeccion(sesion.estado().coleccion);
    mostrarGigantes(sesion.estado().diasDePresencia, sesion.estado().hitosVistos);
    sesion.actualizarVisual({ inmediato: true });
    pintar();
  }
};

// Import dinámico: sin ?debug en la URL, debug.js no se descarga.
// iniciarDebug devuelve su refresco, que pintar() engancha para que la lectura
// de stats siga a los botones del juego y no sólo a los del panel.
// El panel se descarga sólo cuando alguien lo pide: sin ?debug y sin el gesto,
// debug.js no se baja nunca.
let panelDebugPedido = false;

function abrirPanelDebug() {
  if (panelDebugPedido) return;
  panelDebugPedido = true;

  import('./debug.js')
    .then(({ iniciarDebug }) => {
      refrescarDebug = iniciarDebug(apiDebug);
      pintar();
    })
    .catch((e) => {
      // debug.js NO está en ARCHIVOS_CACHE, y es a propósito: es superficie de
      // desarrollo y no forma parte del juego instalado. Pero eso quiere decir
      // que este import sale a la red, y sin red no llega. Sin el catch el
      // gesto quedaba indistinguible de un gesto que no se registró: cinco
      // toques, nada, y ninguna forma de saber si el problema era el gesto o la
      // descarga. Se permite reintentar.
      panelDebugPedido = false;
      console.warn('No se pudo abrir el panel de debug:', e);
    });
}

if (new URLSearchParams(location.search).has(PARAM_DEBUG)) abrirPanelDebug();

// Y la puerta de servicio, para la app instalada: cinco toques rápidos en la
// esquina de arriba a la izquierda. Ver conectarDebugOculto en ui.js.
conectarDebugOculto(abrirPanelDebug);
