// SONDA DE LOS OJOS — para el defecto "los ojos se salen de la órbita".
//
// Se pega en la consola con el juego abierto:
//
//   fetch('verificacion/ojos-sonda.js').then(r => r.text()).then(eval)
//
// QUÉ HACE Y POR QUÉ ASÍ. El defecto aparece durante un gesto que dura tres
// segundos y pasa solo cada veinte o cuarenta: mirarlo a ojo es cuestión de
// suerte, y una captura al azar no cae nunca en el cuadro que importa.
//
// Así que la sonda muestrea sin parar y, cuando ve la combinación, CONGELA: para
// todas las animaciones del documento y sostiene las clases que el camino real
// acababa de poner. La pantalla se queda en el cuadro del defecto y se puede
// mirar, medir y capturar con calma.
//
// No inventa el estado: no llama funciones del juego ni adelanta temporizadores.
// Espera a que el camino real pase y ahí para el reloj — que es la diferencia
// entre reproducir y simular. Y `paso(t)` deja recorrer a mano el gesto que
// quedó congelado, que es cómo se mira un ladeo de tres segundos sin apurarse.
//
// CON ESTO SE ENCONTRÓ que el shorthand `transition` de la regla de la mirada
// —`#cabeza-grupo #ojos`, dos ids contra uno— le reseteaba a #ojos la
// transición de opacidad, así que el cruce de las capas de ojo dejaba 260 ms con
// dos ojos dibujados en dos lugares. Arreglado con longhands; ver el bloque de
// #ojos en style.css y el guardián del shorthand en tests/composicion.test.js.
//
// `__sonda.soltar()` despausa. `__sonda.parar()` la apaga.

window.__sonda = (() => {
  const ojos = document.getElementById('ojos');
  const parpado = document.getElementById('parpado');
  const grupo = document.getElementById('cabeza-grupo');
  const cabeza = document.getElementById('cabeza');
  const chip = document.getElementById('chip');
  const raiz = document.documentElement;
  const gestos = ['ojos-contento-izq', 'ojos-contento-der', 'ojos-cerrado-izq', 'ojos-cerrado-der']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const nombre = (u) => (u || '').replace(/^.*\//, '').replace(/["')]/g, '').trim();
  const caja = (n) => {
    const r = n.getBoundingClientRect();
    return [r.x, r.y, r.width, r.height].map((v) => +v.toFixed(2));
  };
  const estilo = (n) => {
    const c = getComputedStyle(n);
    return {
      rotate: c.rotate, translate: c.translate, scale: c.scale,
      transform: c.transform, origen: c.transformOrigin, op: +(+c.opacity).toFixed(3)
    };
  };

  const buffer = [];
  const hallazgos = [];
  let n = 0;
  let corriendo = true;
  let congelada = false;
  let vigia = null;

  // CONGELAR ES DOS COSAS, y la segunda hizo falta después de perder tres
  // capturas. Parar las animaciones deja quieto el dibujo, pero NO para los
  // setTimeout del juego: a los 3150 ms `unaInclinacion` le saca la clase y el
  // estado que se quería mirar se desarma solo, aunque en pantalla nada se
  // mueva. Entre que la sonda detecta y llega la captura pasan segundos.
  //
  // Así que además se SOSTIENE la clase: un MutationObserver vuelve a poner la
  // que el juego saque, hasta que se suelte. No inventa el estado —lo puso el
  // camino real, `unaInclinacion` sorteando su temporizador— sólo lo sostiene.
  // Es abrir el obturador y dejarlo abierto.
  function congelar() {
    congelada = true;
    const grupoClases = grupo.className;
    const chipClases = chip.className;
    vigia?.disconnect();
    vigia = new MutationObserver(() => {
      if (grupo.className !== grupoClases) grupo.className = grupoClases;
      if (chip.className !== chipClases) chip.className = chipClases;
    });
    vigia.observe(grupo, { attributes: true, attributeFilter: ['class'] });
    vigia.observe(chip, { attributes: true, attributeFilter: ['class'] });
    document.getAnimations().forEach((a) => a.pause());
  }

  // LA CONDICIÓN, y son DOS cosas distintas.
  //
  // 1. LAS POSES NO COINCIDEN. El recorte de cabeza, el de ojos y la máscara del
  //    párpado salen los tres de la misma pose —idle o feliz— y las dos poses
  //    tienen la región ocular en lugares distintos: en feliz la cabeza está
  //    siete píxeles a la derecha. Si una capa se queda en la pose vieja
  //    mientras la de abajo ya cambió, el ojo pintado en el sprite base queda
  //    DESTAPADO al costado del crema. Eso es exactamente lo que se ve.
  //
  // 2. DOS FAMILIAS DE OJO ENCENDIDAS de más. El cruce entre #ojos, `contento`
  //    y `cerrado` es a propósito, y durante la transición hay dos a 0,5 — eso
  //    es normal. Lo que no es normal es que se quede así, porque las capas de
  //    gesto van corridas arriba y a la derecha. Se pide que dure.
  //
  // Las dos mitades de un mismo gesto no cuentan como dos: son una familia.
  const pose = (n) => (/^feliz/.test(n) ? 'feliz' : /^idle/.test(n) ? 'idle' : n || '—');

  let seguidas = 0;

  function mirar(f) {
    f.poses = {
      cabeza: pose(f.srcCabeza),
      ojos: pose(f.srcOjos),
      mascara: pose(f.srcMascara)
    };
    const conocidas = Object.values(f.poses).filter((p) => p === 'idle' || p === 'feliz');
    f.posesMezcladas = new Set(conocidas).size > 1;

    const familias = [
      f.ojos.op > 0.02,
      f.gestos.some((g) => g.id.startsWith('ojos-contento') && g.op > 0.02),
      f.gestos.some((g) => g.id.startsWith('ojos-cerrado') && g.op > 0.02)
    ].filter(Boolean).length;
    seguidas = familias > 1 ? seguidas + 1 : 0;
    f.familias = familias;
    f.seguidas = seguidas;

    const ladeada =
      f.clasesGrupo.includes('inclinada') ||
      f.clasesGrupo.includes('distraida') ||
      (f.grupo.rotate !== 'none' && f.grupo.rotate !== '0deg');
    f.ladeada = ladeada;

    if (f.posesMezcladas) { f.motivo = 'poses mezcladas: ' + JSON.stringify(f.poses); return true; }
    // EL CRUCE, que es el sospechoso principal: #ojos y una capa de gesto
    // encendidas a la vez CON LA CABEZA LADEADA. Las dos dibujan un ojo, pero en
    // lugares distintos —las de gesto van corridas arriba y a la derecha— así
    // que mientras dura el cruce hay DOS ojos pintados separados. Se congela en
    // el medio para poder mirarlo.
    if (ladeada && f.ojos.op > 0.05 && f.ojos.op < 0.95) {
      f.motivo = `cruce a mitad de camino con la cabeza ladeada (#ojos en ${f.ojos.op})`;
      return true;
    }
    if (seguidas > 20) { f.motivo = `${familias} familias de ojo encendidas por ${seguidas} cuadros`; return true; }
    // Y el caso que Damián describe literalmente: el ladeo ocasional CAYENDO
    // ENCIMA de una caricia. No es un defecto por sí solo; se congela para poder
    // mirarlo, que es lo que no se podía hacer a ojo en tres segundos.
    if (f.clasesGrupo.includes('inclinada') && f.clasesChip.includes('acariciando')) {
      f.motivo = 'ladeo ocasional durante la caricia';
      return true;
    }
    return false;
  }

  function frame() {
    if (!corriendo) return;
    n++;
    const f = {
      n,
      t: Math.round(performance.now()),
      clasesChip: chip.className,
      clasesGrupo: grupo.className,
      clasesOjos: ojos.className,
      srcOjos: nombre(ojos.currentSrc || ojos.src),
      srcCabeza: nombre(cabeza && !cabeza.hidden ? cabeza.currentSrc || cabeza.src : ''),
      srcMascara: nombre(getComputedStyle(raiz).getPropertyValue('--mascara-ojos')),
      ojos: estilo(ojos),
      parpado: estilo(parpado),
      grupo: estilo(grupo),
      gestos: gestos.map((g) => ({ id: g.id, oculto: g.hidden, ...estilo(g), caja: caja(g) })),
      cajaOjos: caja(ojos),
      cajaParpado: caja(parpado)
    };
    f.desfasado = f.srcOjos !== f.srcMascara;
    f.separacion = +Math.hypot(f.cajaOjos[0] - f.cajaParpado[0], f.cajaOjos[1] - f.cajaParpado[1]).toFixed(2);

    buffer.push(f);
    if (buffer.length > 3000) buffer.shift();

    const sospechoso = mirar(f);
    if (!congelada && sospechoso) {
      hallazgos.push(f);
      congelar();
      console.warn('[sonda] CONGELADA en la muestra', n, f.motivo);
    }

  }

  // EL MUESTREO VA POR setInterval Y NO POR requestAnimationFrame, y eso no es
  // un detalle: con la pestaña en segundo plano rAF NO CORRE —cero cuadros— y
  // la sonda no ve nada. setInterval sigue corriendo; el navegador lo limita a
  // uno por segundo, que alcanza de sobra para un gesto de tres.
  //
  // Es la primera de las cuatro trampas del README mordiendo al instrumento en
  // vez de al juego.
  const reloj = setInterval(() => { if (corriendo) frame(); }, 60);

  // Y EL RELOJ DE LAS ANIMACIONES SE MANEJA A MANO. Una vez congelada, `paso(t)`
  // pone TODAS las animaciones del documento en el milisegundo t: así se puede
  // recorrer el ladeo entero cuadro por cuadro y capturarlo, en vez de esperar
  // que caiga justo. La animación es la real y el estado es el real; lo único
  // que se controla es el tiempo.
  return {
    buffer,
    hallazgos,
    get congelada() { return congelada; },
    congelar,
    paso(t) {
      const vivas = document.getAnimations();
      vivas.forEach((a) => { a.pause(); a.currentTime = t; });
      return vivas.map((a) => `${a.animationName ?? a.transitionProperty ?? '?'}@${Math.round(a.currentTime)}`);
    },
    soltar() {
      congelada = false;
      vigia?.disconnect();
      vigia = null;
      document.getAnimations().forEach((a) => a.play());
    },
    parar() { corriendo = false; clearInterval(reloj); vigia?.disconnect(); },
    resumen: () => ({ muestras: n, congelada, hallazgos: hallazgos.length })
  };
})();

// ---- LA CARICIA, por el camino real de los eventos ----
//
// No llama a ninguna función del juego: despacha PointerEvent sobre #zona-chip,
// que es donde ui.js engancha. Pasa por el mismo umbral de distancia, el mismo
// seguimiento del gesto y los mismos temporizadores. Lo único sintético es el
// origen del evento.
window.__caricia = (() => {
  const zona = document.getElementById('zona-chip');
  const r = zona.getBoundingClientRect();
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height * 0.32; // la cabeza, no el cuerpo
  let id = 1000;
  let reloj = null;
  let pulso = null;
  let paso = 0;

  const evento = (tipo, x, y) =>
    zona.dispatchEvent(new PointerEvent(tipo, {
      pointerId: id, pointerType: 'touch', isPrimary: true,
      clientX: x, clientY: y, bubbles: true, cancelable: true
    }));

  return {
    empezar() {
      id++;
      paso = 0;
      evento('pointerdown', cx, cy);
      reloj = setInterval(() => {
        paso++;
        const a = paso * 0.5;
        evento('pointermove', cx + Math.cos(a) * 26, cy + Math.sin(a) * 14);
      }, 90);
    },
    soltar() {
      clearInterval(reloj);
      reloj = null;
      evento('pointerup', cx, cy);
    },
    // ACARICIAR A TANDAS: sostener, soltar, sostener. Cada soltada dispara el
    // cruce de vuelta —las capas de gesto se apagan y #ojos se vuelve a
    // encender—, que es el momento en que hay dos ojos pintados a la vez. El
    // ladeo pasa solo cada veinte o cuarenta segundos, así que hay que tener el
    // cruce ocurriendo seguido para que los dos coincidan.
    pulsar(sostiene = 3500, suelta = 1800) {
      const paso = () => {
        this.empezar();
        setTimeout(() => {
          this.soltar();
          pulso = setTimeout(paso, suelta);
        }, sostiene);
      };
      paso();
    },
    parar() {
      clearTimeout(pulso);
      if (reloj) this.soltar();
    }
  };
})();

'sonda y caricia puestas';
