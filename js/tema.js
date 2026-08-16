// El puente de config.js a style.css, como función pura.
//
// Las duraciones, los ciclos y las paletas viven en config.js y las necesita el
// CSS, que no puede importar un módulo. El puente son custom properties: se
// escriben una vez en :root y la hoja las lee con var(). Duplicar los números en
// el CSS sería un carve-out más de la regla de config.js, y este no hace falta.
//
// Acá se ARMA el mapa; quien lo escribe en el DOM es ui-montaje.js. La razón de
// que estén separados es que así el puente se puede probar: hasta que esto fue
// una función, la única forma de verificar que un `var(--x)` tuviera quien lo
// escribiera era abrir el navegador y mirar si algo se veía raro — y una custom
// property sin escritor no se ve raro, se cae al valor por defecto y sigue de
// largo en silencio.
//
// Ver tests/tema.test.js: cruza los nombres contra los `var()` de style.css y
// los de los SVG de formas.js, en las dos direcciones.

import {
  CICLO_RESPIRACION_MS,
  RESPIRACION,
  RESPIRACION_POR_ESTADO,
  RESPIRACION_SOMBRA,
  DURACION_SALTO_MS,
  TRANSICION_BARRA_MS,
  DURACION_PRESION_MS,
  TRANSICION_PANEL_MS,
  DURACION_LLEGADA_MS,
  DURACION_SQUASH_MS,
  CICLO_LED_MS,
  VARS_ANIMACION,
  VARS_CAMBIO,
  VARS_APERTURA,
  COLOR_APERTURA,
  DURACION_APERTURA_MS,
  RETARDO_CHIP_APERTURA_MS,
  DURACION_ENTRADA_CHIP_MS,
  VARS_RAYO,
  CICLO_RAYO_MS,
  CICLO_RAYO_CRITICO_MS,
  CICLO_RAYO_NOCHE_MS,
  VARS_NUBES,
  ABERTURA_VENTANA,
  DEFORMACION_NUBE,
  FACTOR_NUBES_NOCHE,
  VARS_FONDO,
  FONDO_CORRIMIENTO,
  VARS_BARRAS,
  COLORES_BARRAS,
  VARS_EFECTOS,
  CICLO_ZETA_MS,
  CICLO_CHISPA_MS,
  CICLOS_POLVO_MS,
  VARS_PERSONAJE,
  ORIGEN_PARPADEO,
  DURACION_PARPADEO_MS,
  COLOR_PARPADO,
  DURACION_CORAZON_MS,
  DURACION_DESTELLO_MS,
  DURACION_RAYITA_MS,
  DURACION_PULSO_MS,
  DURACION_BURBUJA_MS,
  GRUPOS_DE_COLOR,
  VARS_BULBO,
  DIAMETRO_BULBO,
  COLORES_BULBO,
  CICLOS_BULBO,
  LATIDO_BULBO,
  RESPLANDOR_CABEZA,
  FACTOR_HALO_NOCHE,
  DURACION_DESTELLO_BULBO_MS,
  DESTELLO_BULBO,
  VARS_TOMA,
  PUNTA_DEL_CABLE,
  TAMANO_TOMA,
  ANCLA_TOMA,
  COLORES_TOMA,
  VARS_REPISA,
  REPISA,
  ACHATADO_REPISA,
  COLORES_REPISA,
  COLORES_PANEL
} from './config.js';

const ms = (n) => `${n}ms`;
const pct = (n) => `${n}%`;

// La respiración de un estado: su ciclo y su amplitud, escalada sobre la base.
// El multiplicador se aplica a la DISTANCIA respecto de 1, no al valor, porque
// lo que escala es cuánto se deforma y no cuánto mide.
function respiracionDe({ ciclo = CICLO_RESPIRACION_MS, amplitud = 1 } = {}, sufijo = '') {
  return {
    [`--ciclo-respiracion${sufijo}`]: ms(ciclo),
    [`--respiracion-y${sufijo}`]: String(+(1 + (RESPIRACION.y - 1) * amplitud).toFixed(4)),
    [`--respiracion-x${sufijo}`]: String(+(1 - (1 - RESPIRACION.x) * amplitud).toFixed(4)),
    // La sombra acompaña con la misma amplitud: si Chip casi no respira, su
    // huella tampoco puede estar latiendo.
    [`--sombra-respiracion-x${sufijo}`]: String(
      +(1 - (1 - RESPIRACION_SOMBRA.x) * amplitud).toFixed(4)
    ),
    [`--sombra-respiracion-opacidad${sufijo}`]: String(
      +(1 - (1 - RESPIRACION_SOMBRA.opacidad) * amplitud).toFixed(4)
    )
  };
}

// Los tonos de un grupo viajan por convención de nombre: --<grupo>-<tono>.
// Declarar catorce nombres a mano no agregaría nada; lo que importa es que el
// grupo y el tono estén en config, y ahí están.
function tonos(prefijo, tabla) {
  return Object.fromEntries(Object.entries(tabla).map(([tono, valor]) => [`--${prefijo}-${tono}`, valor]));
}

export function variablesDeTema() {
  return {
    // LA RESPIRACIÓN. La base va sin sufijo; cada estado con ritmo propio suma
    // su juego con el suyo, y una regla de style.css lo levanta por clase. Se
    // resuelven todos acá y no en cada render porque son constantes: lo único
    // que cambia en vivo es qué clase tiene el contenedor.
    ...respiracionDe(),
    ...Object.entries(RESPIRACION_POR_ESTADO).reduce(
      (acc, [estado, valores]) => ({ ...acc, ...respiracionDe(valores, `-${estado}`) }),
      {}
    ),
    // Ritmo de la interfaz
    [VARS_ANIMACION.duracionSalto]: ms(DURACION_SALTO_MS),
    [VARS_ANIMACION.transicionBarra]: ms(TRANSICION_BARRA_MS),
    [VARS_ANIMACION.duracionPresion]: ms(DURACION_PRESION_MS),
    [VARS_ANIMACION.transicionPanel]: ms(TRANSICION_PANEL_MS),
    [VARS_ANIMACION.duracionLlegada]: ms(DURACION_LLEGADA_MS),
    [VARS_CAMBIO.duracionSquash]: ms(DURACION_SQUASH_MS),
    '--ciclo-led': ms(CICLO_LED_MS),

    // La apertura
    [VARS_APERTURA.color]: COLOR_APERTURA,
    [VARS_APERTURA.duracion]: ms(DURACION_APERTURA_MS),
    [VARS_APERTURA.retardoChip]: ms(RETARDO_CHIP_APERTURA_MS),
    [VARS_APERTURA.duracionChip]: ms(DURACION_ENTRADA_CHIP_MS),

    // El rayo del pecho
    [VARS_RAYO.ciclo]: ms(CICLO_RAYO_MS),
    [VARS_RAYO.cicloCritico]: ms(CICLO_RAYO_CRITICO_MS),
    [VARS_RAYO.cicloNoche]: ms(CICLO_RAYO_NOCHE_MS),

    // La ventana y sus dos bandas de nubes
    [VARS_NUBES.x]: pct(ABERTURA_VENTANA.x),
    [VARS_NUBES.y]: pct(ABERTURA_VENTANA.y),
    [VARS_NUBES.ancho]: pct(ABERTURA_VENTANA.ancho),
    [VARS_NUBES.alto]: pct(ABERTURA_VENTANA.alto),
    [VARS_NUBES.deformacion]: String(DEFORMACION_NUBE),
    [VARS_NUBES.factorNoche]: String(FACTOR_NUBES_NOCHE),

    // El encuadre de la escena: cuánto correr la panorámica para entrar 8% en
    // ella. Va sin unidad porque el CSS lo multiplica por el alto de la escena,
    // y así el mismo encuadre vale en cualquier pantalla.
    [VARS_FONDO.corrimiento]: String(FONDO_CORRIMIENTO),

    // Los colores de las barras salen del sprite de Chip: la piel del
    // instrumento la define el personaje.
    ...Object.fromEntries(
      Object.entries(VARS_BARRAS).map(([stat, variable]) => [variable, COLORES_BARRAS[stat]])
    ),

    // Los efectos de vida
    [VARS_EFECTOS.cicloZeta]: ms(CICLO_ZETA_MS),
    [VARS_EFECTOS.cicloChispa]: ms(CICLO_CHISPA_MS),
    ...Object.fromEntries(
      VARS_EFECTOS.ciclosPolvo.map((variable, i) => [variable, ms(CICLOS_POLVO_MS[i])])
    ),

    // El personaje: el pivote del parpadeo, sus tiempos, y los dos colores que
    // salieron muestreados del sprite viejo de feliz.
    [VARS_PERSONAJE.origenParpadeo]: ORIGEN_PARPADEO,
    [VARS_PERSONAJE.duracionParpadeo]: ms(DURACION_PARPADEO_MS),
    [VARS_PERSONAJE.colorParpado]: COLOR_PARPADO,
    [VARS_PERSONAJE.duracionCorazon]: ms(DURACION_CORAZON_MS),
    [VARS_PERSONAJE.duracionDestello]: ms(DURACION_DESTELLO_MS),
    [VARS_PERSONAJE.duracionRayita]: ms(DURACION_RAYITA_MS),
    [VARS_PERSONAJE.duracionPulso]: ms(DURACION_PULSO_MS),
    [VARS_PERSONAJE.duracionBurbuja]: ms(DURACION_BURBUJA_MS),

    // Las paletas de los efectos
    ...Object.entries(GRUPOS_DE_COLOR).reduce(
      (acc, [grupo, tabla]) => ({ ...acc, ...tonos(grupo, tabla) }),
      {}
    ),

    // La toma de corriente. La posición sale de PUNTA_DEL_CABLE, medida sobre el
    // lienzo del sprite; el CSS la convierte a la escena con los mismos anclajes
    // que usa #chip, así que no hay ningún porcentaje de la escena de por medio
    // y el encastre aguanta cualquier viewport.
    [VARS_TOMA.x]: String(PUNTA_DEL_CABLE.x / 100),
    [VARS_TOMA.y]: String(PUNTA_DEL_CABLE.y / 100),
    [VARS_TOMA.ancho]: String(TAMANO_TOMA.ancho / 100),
    [VARS_TOMA.alto]: String(TAMANO_TOMA.alto / 100),
    [VARS_TOMA.anclaX]: String(ANCLA_TOMA.x),
    [VARS_TOMA.anclaY]: String(ANCLA_TOMA.y),
    ...tonos('toma', COLORES_TOMA),

    // La repisa alta. Su geometría entera vive en REPISA, así que mover el
    // estante es tocar cuatro números en config y nada más.
    [VARS_REPISA.x]: pct(REPISA.x),
    [VARS_REPISA.y]: pct(REPISA.y),
    [VARS_REPISA.ancho]: pct(REPISA.ancho),
    [VARS_REPISA.alto]: pct(REPISA.alto),
    [VARS_REPISA.achatado]: String(ACHATADO_REPISA),
    ...tonos('repisa', COLORES_REPISA),

    // El botón del menú
    ...tonos('panel', COLORES_PANEL),

    // LA LUZ DE LA CABEZA. El juego base es el de reposo; cada estado suma el
    // suyo con el nombre sufijado y una regla de style.css lo levanta por clase,
    // igual que la respiración. Nada de esto cambia en vivo salvo la clase.
    [VARS_BULBO.diametro]: pct(DIAMETRO_BULBO),
    [VARS_BULBO.resplandorDiametro]: pct(RESPLANDOR_CABEZA.diametro),
    [VARS_BULBO.resplandorY]: pct(RESPLANDOR_CABEZA.corrimientoY),
    [VARS_BULBO.resplandorOpacidad]: String(RESPLANDOR_CABEZA.opacidad),
    [VARS_BULBO.haloNoche]: String(FACTOR_HALO_NOCHE),
    [VARS_BULBO.duracionDestello]: ms(DURACION_DESTELLO_BULBO_MS),
    [VARS_BULBO.destelloBrillo]: String(DESTELLO_BULBO.brillo),
    [VARS_BULBO.destelloSaturacion]: String(DESTELLO_BULBO.saturacion),

    // El juego de idle NO se emite con sufijo: idle es el DEFECTO y va sin él,
    // más abajo. Emitirlo sería escribir tres variables que ninguna regla lee.
    ...Object.entries(COLORES_BULBO).filter(([e]) => e !== "idle").reduce(
      (acc, [estado, c]) => ({
        ...acc,
        [`--bulbo-nucleo-${estado}`]: c.nucleo,
        [`--bulbo-cuerpo-${estado}`]: c.cuerpo,
        [`--bulbo-halo-${estado}`]: c.halo
      }),
      {}
    ),
    ...Object.entries(CICLOS_BULBO).filter(([e]) => e !== "idle").reduce(
      (acc, [estado, v]) => ({ ...acc, [`--bulbo-ciclo-${estado}`]: ms(v) }),
      {}
    ),
    ...Object.entries(LATIDO_BULBO).filter(([e]) => e !== "idle").reduce(
      (acc, [estado, v]) => ({
        ...acc,
        [`--bulbo-piso-${estado}`]: String(v.piso),
        [`--bulbo-pico-${estado}`]: String(v.pico)
      }),
      {}
    ),

    // Y el juego por defecto, que es el de idle: así una pose sin regla propia
    // igual tiene una luz, en vez de quedarse con las var() sin resolver y
    // desaparecer.
    [VARS_BULBO.nucleo]: COLORES_BULBO.idle.nucleo,
    [VARS_BULBO.cuerpo]: COLORES_BULBO.idle.cuerpo,
    [VARS_BULBO.halo]: COLORES_BULBO.idle.halo,
    [VARS_BULBO.ciclo]: ms(CICLOS_BULBO.idle),
    [VARS_BULBO.piso]: String(LATIDO_BULBO.idle.piso),
    [VARS_BULBO.pico]: String(LATIDO_BULBO.idle.pico)
  };
}
