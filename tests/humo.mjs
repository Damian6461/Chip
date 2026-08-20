// EL TEST QUE ABRE EL JUEGO.
//
// ---- POR QUÉ EXISTE, Y POR QUÉ NO EXISTÍA ----
//
// Trescientos treinta y dos tests en verde con la app tirando ReferenceError en
// el arranque, la pantalla del pecho apagada y Chip clavado en `esperando` con
// los brazos cruzados. Se reportó desde afuera como "no se muestra la carga".
//
// Ninguno de los trescientos treinta y dos podía verlo, y no por un descuido de
// alguno: TODOS leen archivos y cruzan texto. Verifican lo que está escrito.
// Ninguno ejecuta el juego. Un `let` declarado cuatrocientas líneas abajo de su
// primer uso —zona muerta temporal— es sintácticamente impecable, pasa
// cualquier lectura, y revienta al correr.
//
// Este archivo hace la única cosa que faltaba: ABRE EL JUEGO EN UN NAVEGADOR DE
// VERDAD, espera a que asiente, y falla si hubo un solo error de consola o una
// excepción sin atrapar. Más tres preguntas de que arrancó de verdad y no que
// arrancó a medias, que es el estado que este bug producía.
//
// ---- POR QUÉ CDP CRUDO Y NO PLAYWRIGHT ----
//
// El proyecto no tiene dependencias y esa regla vale más que la comodidad. Node
// 24 trae `WebSocket` global y Chrome habla su protocolo por ahí, así que
// alcanza con lanzarlo con `--remote-debugging-port` y hablarle. Son cien líneas
// y no bajan ciento cincuenta megas de navegador.
//
// Esas cien líneas viven en tools/cromo.mjs y no acá, porque son dos los que
// necesitan un navegador de verdad: este test y las verificaciones que miran
// píxeles. Estuvieron duplicadas exactamente una vez.
//
// ---- POR QUÉ FALLA EN VEZ DE SALTEARSE SI NO ENCUENTRA CHROME ----
//
// Porque un test de humo que se saltea solo es exactamente el agujero que vino a
// tapar: verde sin haber mirado. Si el navegador no está donde lo busca, se le
// dice con CHIP_NAVEGADOR y sigue. Callarse no es una opción.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, buscarNavegador, dormir } from '../tools/cromo.mjs';

// LO QUE SE MIRA UNA VEZ QUE ASENTÓ. Corre adentro de la página: son las tres
// preguntas de "arrancó de verdad", elegidas porque son justo las tres que el
// ReferenceError del arranque contestaba mal.
const SONDA = `(() => {
  const pantalla = document.getElementById('pantalla');
  const numero = document.getElementById('pantalla-numero');
  const mascota = document.getElementById('mascota') || document.querySelector('[class*="estado-"]');
  return JSON.stringify({
    pantalla: pantalla ? getComputedStyle(pantalla).display : 'no existe',
    clases: mascota ? mascota.className : 'no existe',
    bateria: numero ? (numero.dataset.texto || '') : 'no existe'
  });
})()`;

export async function correrHumo(informar = () => {}) {
  const resultados = [];
  const anotar = (nombre, mensaje) => {
    resultados.push({ nombre, ok: !mensaje, mensaje });
    informar({ nombre, ok: !mensaje, mensaje });
  };

  const navegador = buscarNavegador();
  if (!navegador) {
    anotar(
      'humo: el juego abre sin un solo error de consola',
      'no encontré Chrome. Pasale la ruta en CHIP_NAVEGADOR=... y volvé a correr. ' +
        'Este test NO se saltea solo: un test de humo que se calla es el agujero que vino a tapar.'
    );
    return { pasaron: 0, fallaron: 1, total: 1 };
  }

  const { servidor, puerto } = await servir(0);
  let cliente = null;

  try {
    // Perfil TEMPORAL, que lo arma abrirCromo: sin service worker viejo
    // sirviendo una versión de ayer, que es el otro modo de falla que este
    // proyecto ya conoce, y sin el localStorage de nadie.
    cliente = await abrirCromo({ ancho: 390, alto: 844 });

    const errores = [];
    cliente.alEvento((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        errores.push(`pageerror: ${d.exception?.description ?? d.text} (${d.url ?? '?'}:${d.lineNumber})`);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errores.push('console.error: ' + msg.params.args.map((a) => a.description ?? a.value).join(' '));
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        const e = msg.params.entry;
        errores.push(`log(${e.source}): ${e.text} ${e.url ?? ''}`);
      }
    });

    await cliente.enviar('Runtime.enable');
    await cliente.enviar('Log.enable');
    await cliente.enviar('Page.enable');
    await cliente.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });

    // ASENTAR, Y ESPERAR A QUE SE DESOCUPE.
    //
    // Dos segundos alcanzan para lo que se está buscando —un error de arranque
    // sale en el primer cuadro— y NO alcanzan para el otro modo de falla, que
    // apareció corriendo esto cuatro veces: una de cada cuatro daba rojo en
    // `#pantalla quedó en display:none` y `la mascota quedó en
    // estado-esperando`, sin un solo error de consola.
    //
    // No era un bug: era el juego. `esperando` es el estado en que Chip aguanta
    // el paso de un gigante —brazos cruzados, pantalla del pecho apagada— y dura
    // DURACION_ESPERANDO_MS arrancando hasta 8 s después de abrir. O sea que la
    // aserción del arranque estaba denunciando un estado legítimo, una de cada
    // cuatro veces.
    //
    // Un test intermitente es peor que no tener test: la respuesta a un rojo
    // intermitente es correrlo de nuevo, y esa costumbre se lleva puestos los
    // rojos de verdad. Así que en vez de esperar más tiempo fijo —que lo haría
    // lento siempre para arreglar un caso raro— se sondea hasta que se desocupe,
    // con tope. El caso común sale en dos segundos; el del gigante espera lo que
    // tenga que esperar y no miente.
    //
    // La ventana más larga no debilita nada: los errores de consola se juntan
    // todo el tiempo que la página esté abierta.
    await dormir(2000);

    let sonda = null;
    const limite = Date.now() + 20000;
    while (true) {
      const { result } = await cliente.enviar('Runtime.evaluate', {
        expression: SONDA,
        returnByValue: true
      });
      sonda = JSON.parse(result.value);
      const ocupado = /estado-esperando/.test(sonda.clases) || sonda.pantalla === 'none';
      if (!ocupado || Date.now() > limite) break;
      await dormir(500);
    }

    anotar(
      'humo: el juego abre sin un solo error de consola',
      errores.length ? `${errores.length} error(es): ${errores.join(' | ')}` : null
    );

    anotar(
      'humo: la pantalla del pecho está encendida',
      sonda.pantalla === 'none' || sonda.pantalla === 'no existe'
        ? `#pantalla quedó en display:${sonda.pantalla}`
        : null
    );

    anotar(
      'humo: Chip salió de esperando',
      /estado-esperando/.test(sonda.clases)
        ? `la mascota quedó en "${sonda.clases}": el arranque se cortó antes del primer estado real`
        : null
    );

    anotar(
      'humo: la batería muestra un número',
      /\d/.test(sonda.bateria) ? null : `el display del pecho dice "${sonda.bateria}"`
    );
  } catch (e) {
    anotar('humo: el juego abre sin un solo error de consola', `no se pudo correr: ${e.message}`);
  } finally {
    try {
      await cliente?.cerrar();
    } catch {}
    servidor.close();
  }

  const fallaron = resultados.filter((r) => !r.ok).length;
  return { pasaron: resultados.length - fallaron, fallaron, total: resultados.length };
}
