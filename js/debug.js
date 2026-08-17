// Panel de debug. Se activa con ?debug en la URL y main.js lo carga con import
// dinámico, así que en juego normal este archivo ni se descarga.
//
// Toca el DOM, pero no rompe la regla de que ui.js es su único dueño: crea su
// propio subárbol, lo appendea a document.body y no lee ni modifica ningún
// elemento declarado en index.html. Lo que necesita del juego llega por `api`.

import {
  PANEL_DEBUG,
  MULTIPLICADOR_DEBUG_INICIAL,
  HORAS_DEBUG_INICIAL,
  OPCION_DEBUG_AUTO,
  HORAS_DEL_DIA,
  DIAS_DEBUG_INICIAL,
  CLIMAS
} from './config.js';

function crearPanel() {
  const panel = document.createElement('div');
  // ID Y CLASE, y no es cosmética: sin ellos no hay forma de apuntarle desde un
  // test ni desde una regla de CSS, y este panel resultó tapar media escena sin
  // que nada pudiera denunciarlo.
  panel.id = 'panel-debug';
  Object.assign(panel.style, {
    position: 'fixed',
    top: PANEL_DEBUG.margen,
    right: PANEL_DEBUG.margen,
    width: PANEL_DEBUG.ancho,
    padding: PANEL_DEBUG.padding,
    background: PANEL_DEBUG.fondo,
    border: PANEL_DEBUG.borde,
    borderRadius: PANEL_DEBUG.radio,
    color: PANEL_DEBUG.color,
    font: PANEL_DEBUG.fuente,
    zIndex: PANEL_DEBUG.zIndex,
    display: 'flex',
    flexDirection: 'column',
    gap: PANEL_DEBUG.separacion
  });
  return panel;
}

// EL PLEGADO. Arranca cerrado siempre: el panel es una superficie de desarrollo
// y no puede decidir por su cuenta taparle media escena a quien abrió el juego.
//
// En pantallas angostas, desplegado va ABAJO y a lo ancho —que es donde no está
// Chip— con tope de alto y scroll propio. En anchas se queda al costado, que es
// donde nunca molestó.
function armarPlegado(panel, cuerpo) {
  const angosta = () => window.innerWidth < PANEL_DEBUG.anchoAngosto;
  let abierto = false;

  const manija = crearBoton('debug ▾');
  manija.style.width = '100%';

  function aplicar() {
    cuerpo.style.display = abierto ? 'flex' : 'none';
    manija.textContent = abierto ? 'debug ▴' : 'debug ▾';

    if (abierto && angosta()) {
      Object.assign(panel.style, {
        top: 'auto',
        bottom: PANEL_DEBUG.margen,
        left: PANEL_DEBUG.margen,
        right: PANEL_DEBUG.margen,
        width: 'auto'
      });
      Object.assign(cuerpo.style, { maxHeight: PANEL_DEBUG.altoMaximoAngosto, overflowY: 'auto' });
      return;
    }

    Object.assign(panel.style, {
      top: PANEL_DEBUG.margen,
      bottom: 'auto',
      left: 'auto',
      right: PANEL_DEBUG.margen,
      width: abierto ? PANEL_DEBUG.ancho : 'auto'
    });
    Object.assign(cuerpo.style, { maxHeight: 'none', overflowY: 'visible' });
  }

  manija.addEventListener('click', () => {
    abierto = !abierto;
    aplicar();
  });

  aplicar();
  return manija;
}

function crearFila() {
  const fila = document.createElement('div');
  Object.assign(fila.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });
  return fila;
}

function crearEtiqueta(texto) {
  const etiqueta = document.createElement('span');
  etiqueta.textContent = texto;
  Object.assign(etiqueta.style, { color: '#9aa0ab', whiteSpace: 'nowrap' });
  return etiqueta;
}

function crearNumero(valorInicial) {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = String(valorInicial);
  Object.assign(input.style, {
    width: '100%',
    minWidth: '0',
    background: '#1e2129',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    color: 'inherit',
    font: 'inherit',
    padding: '3px 5px'
  });
  return input;
}

function crearBoton(texto) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = texto;
  Object.assign(boton.style, {
    background: '#1e2129',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    color: 'inherit',
    font: 'inherit',
    padding: '4px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  });
  return boton;
}

function crearSelect(opciones) {
  const select = document.createElement('select');
  Object.assign(select.style, {
    flex: '1',
    minWidth: '0',
    background: '#1e2129',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    color: 'inherit',
    font: 'inherit',
    padding: '3px 4px'
  });

  for (const valor of opciones) {
    const opcion = document.createElement('option');
    opcion.value = valor;
    opcion.textContent = valor;
    select.appendChild(opcion);
  }

  return select;
}

export function iniciarDebug(api) {
  const panel = crearPanel();

  // ---- Multiplicador de tiempo ----
  const filaMultiplicador = crearFila();
  const inputMultiplicador = crearNumero(MULTIPLICADOR_DEBUG_INICIAL);
  filaMultiplicador.append(crearEtiqueta('multiplicador'), inputMultiplicador);

  // ---- Simular horas ----
  const filaHoras = crearFila();
  const inputHoras = crearNumero(HORAS_DEBUG_INICIAL);
  const botonSimular = crearBoton('simular h');
  botonSimular.addEventListener('click', () => {
    const horas = Number(inputHoras.value) || 0;
    const multiplicador = Number(inputMultiplicador.value) || 1;
    api.simularHoras(horas, multiplicador);
  });
  filaHoras.append(inputHoras, botonSimular);

  // ---- Volver tras N horas ----
  // Reusa los mismos inputs de arriba. A diferencia de "simular h", esto no
  // aplica el decay en el momento: retrocede la última visita y recarga, así
  // corre el camino de arranque real y los eventos se disparan.
  const botonVolver = crearBoton('volver tras N h');
  botonVolver.addEventListener('click', () => {
    const horas = Number(inputHoras.value) || 0;
    const multiplicador = Number(inputMultiplicador.value) || 1;
    api.volverTrasHoras(horas, multiplicador);
  });

  // ---- Forzar estado visual ----
  const filaVisual = crearFila();
  const selectVisual = crearSelect([OPCION_DEBUG_AUTO, ...api.obtenerNombresVisuales()]);
  selectVisual.addEventListener('change', () => {
    const elegido = selectVisual.value;
    api.forzarEstadoVisual(elegido === OPCION_DEBUG_AUTO ? null : elegido);
  });
  filaVisual.append(crearEtiqueta('visual'), selectVisual);

  // ---- Forzar hora ----
  // No es lo mismo que forzar el estado visual: esto mueve el reloj que usa el
  // juego, así que el sprite y el fondo del galpón cambian juntos. Poner 23 o 3
  // muestra a Chip en standby con el galpón de noche.
  const filaHora = crearFila();
  const horas = Array.from({ length: HORAS_DEL_DIA }, (_, i) => String(i));
  const selectHora = crearSelect([OPCION_DEBUG_AUTO, ...horas]);
  selectHora.addEventListener('change', () => {
    const elegida = selectHora.value;
    api.forzarHora(elegida === OPCION_DEBUG_AUTO ? null : Number(elegida));
  });
  filaHora.append(crearEtiqueta('hora'), selectHora);

  // ---- Simular presencia ----
  // El arco de los gigantes avanza por días distintos con visita, así que sin
  // esto habría que esperar un mes para ver la última capa.
  const filaDias = crearFila();
  const inputDias = crearNumero(DIAS_DEBUG_INICIAL);
  const botonDias = crearBoton('sumar días');
  botonDias.addEventListener('click', () => api.sumarDias(Number(inputDias.value) || 0));
  filaDias.append(inputDias, botonDias);

  const botonHito = crearBoton('disparar hito');
  botonHito.addEventListener('click', () => api.dispararHito());

  // ---- Sumar un objeto ----
  // Para ver el estante poblado sin esperar a que el sorteo traiga los hallazgos.
  const botonObjeto = crearBoton('sumar objeto');
  botonObjeto.addEventListener('click', () => api.sumarObjeto());

  // ---- Tirar un objeto al piso ----
  // La moneda del piso sale una de cada siete aperturas, y encima sólo al abrir:
  // sin esto, verificar el vuelo al estante era recargar hasta que tocara.
  const botonPiso = crearBoton('tirar al piso');
  botonPiso.addEventListener('click', () => api.tirarObjetoAlPiso());

  // ---- Los dos climas ----
  // Cada uno sale de un evento que es uno de cuarenta y nueve: esperarlos para
  // ver si el fondo cambia no es una forma de verificar nada. Un botón por
  // clima, sacado de la tabla, así el tercero aparece solo el día que exista.
  const filaClima = crearFila();
  for (const nombre of Object.keys(CLIMAS)) {
    const boton = crearBoton(`clima: ${nombre}`);
    boton.addEventListener('click', () => api.ponerClima(nombre));
    filaClima.appendChild(boton);
  }

  // ---- Simular una apertura con el tramo cambiado ----
  const botonTramo = crearBoton('abrir en otro tramo');
  botonTramo.addEventListener('click', () => api.simularAperturaEnOtroTramo());

  // ---- Cambiar la pose de idle ----
  // La rotación real corre una vez por minuto y con moneda, así que esperar a
  // ver la pose alternativa es incómodo. Esto la fuerza.
  const botonPose = crearBoton('cambiar pose');
  botonPose.addEventListener('click', () => api.cambiarPose());

  // ---- Reiniciar partida ----
  const botonReiniciar = crearBoton('reiniciar partida');
  botonReiniciar.addEventListener('click', () => {
    api.reiniciarSave();
    selectVisual.value = OPCION_DEBUG_AUTO;
  });

  // El forzado de hora NO se resetea acá: reiniciar la partida es del save, y la
  // hora forzada es del reloj. Mezclarlos haría que probar la franja nocturna se
  // pierda cada vez que se reinicia.

  // ---- Lectura de stats ----
  const stats = document.createElement('div');
  Object.assign(stats.style, {
    color: '#9aa0ab',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '11px',
    whiteSpace: 'pre'
  });

  function refrescarStats() {
    const e = api.obtenerEstado();
    const coleccion = e.coleccion ?? [];

    stats.textContent = [
      `bat  ${e.bateria.toFixed(2)}`,
      `hum  ${e.humor.toFixed(2)}`,
      `mant ${e.mantenimiento.toFixed(2)}`,
      '',
      // Lista cruda de ids a propósito: el panel es una superficie de desarrollo
      // y lo que hace falta ver es qué hay en el save, no cómo se ve.
      `colección ${coleccion.length}/${api.totalDeObjetos()}`,
      ...(coleccion.length ? coleccion.map((id) => `  ${id}`) : ['  (vacía)']),
      `día evento ${e.ultimoDiaConEvento ?? '—'}`,
      '',
      `presencia ${e.diasDePresencia ?? 0} días`,
      `capa grúa ${api.capaDeLaGrua()}`,
      `hitos ${(e.hitosVistos ?? []).join(', ') || '(ninguno)'}`
    ].join('\n');
  }

  // Primera pintada: debug.js se carga async, después del render inicial, así
  // que el panel nace vacío si no se llena una vez acá.
  refrescarStats();

  // Todo lo que había suelto en el panel pasa a vivir adentro de un cuerpo que
  // se pliega. El panel queda siendo la manija más eso.
  const cuerpo = document.createElement('div');
  Object.assign(cuerpo.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: PANEL_DEBUG.separacion
  });

  cuerpo.append(
    filaMultiplicador,
    filaHoras,
    botonVolver,
    filaVisual,
    filaHora,
    filaDias,
    botonHito,
    botonObjeto,
    botonPiso,
    filaClima,
    botonTramo,
    botonPose,
    botonReiniciar,
    stats
  );

  panel.append(armarPlegado(panel, cuerpo), cuerpo);
  document.body.appendChild(panel);

  // main.js llama a esto en cada pintada. Sin eso la lectura se queda vieja al
  // usar los botones del juego, que el panel no puede escuchar sin meterse con
  // el DOM que es de ui.js.
  return refrescarStats;
}
