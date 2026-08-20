// ¿Chip habla demasiado o de menos?
//
//   node verificacion/voz-sesion.mjs
//
// ---- QUÉ ES ESTO Y QUÉ NO ----
//
// Es un MODELO de las reglas de `hablar`, no `hablar` mismo. `hablar` vive en
// sonido.js y necesita un AudioContext y un DOM; importarlo acá pediría medio
// navegador para contar cuántas veces habla un bicho en diez minutos.
//
// Un modelo de una regla que uno mismo escribió es exactamente el tipo de
// instrumento que este proyecto ya vio mentir. Así que hay dos redes:
//
//   1. TODAS las constantes salen de config.js. Ningún número está copiado acá.
//   2. Al final se leen las siete reglas en el texto de sonido.js y se avisa si
//      alguna dejó de estar. Si el modelo se separa de la fuente, se entera acá
//      y no dentro de tres meses.
//
// Lo que el modelo NO puede contestar es cómo SUENA. Contesta cuántas veces,
// cada cuánto, y cuánto silencio queda en el medio — que es lo que decide si un
// bicho se siente parlanchín.

import { readFileSync } from 'node:fs';
import { VOZ, VOCES_LARGAS, VOZ_DE, PROBABILIDAD_VOZ, VOZ_IDLE } from '../js/config.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// ---- El modelo de `hablar` ----
//
// Las mismas SIETE reglas, en el mismo orden, con las mismas constantes. Seis
// dicen cuándo NO PUEDE hablar; la séptima —la moneda de PROBABILIDAD_VOZ— dice
// cuándo NO QUIERE.
function crearVoz() {
  let ultimaVoz = null;
  let ultimoHabla = -Infinity;
  let ultimaLarga = -Infinity;
  let hablandoHasta = -Infinity;
  const dicho = [];

  // Cuánto dura una voz. No está en config —el largo lo tiene el archivo— así
  // que se estima, y la estimación va POR SEPARADO de las constantes para que
  // se vea que es una estimación: las cortas alrededor de 0,8 s y las largas
  // alrededor de 2,5 s. Sólo afecta a la regla 3 (no encimarse), y el piso de
  // 4 s de cooldown la domina en todos los casos menos el de dos disparos en el
  // mismo segundo.
  const DURACION_CORTA_MS = 800;
  const DURACION_LARGA_MS = 2500;

  return {
    dicho,
    hablar(situacion, ahora) {
      const candidatos = VOZ_DE[situacion];
      if (!candidatos) return null; // situación que no existe
      if (ahora < hablandoHasta) return null; // 3. nunca encimadas

      // 7. LA MONEDA, y va acá porque acá está en el código. Estuvo del lado de
      // quien llamaba —un `seAnima()` en main.js— y por eso los gestos la
      // esquivaban. Este modelo la tenía del lado del llamador también, o sea
      // que reproducía el defecto: la primera corrida después de arreglarlo
      // seguía informando 21,4 voces porque el modelo no se había movido.
      // Lo que no está en la tabla habla siempre.
      if (Math.random() >= (PROBABILIDAD_VOZ[situacion] ?? 1)) return null;

      if (ahora - ultimoHabla < VOZ.cooldownMs) return null; // 4. piso de silencio

      const lista = [].concat(candidatos).filter((id) => id !== ultimaVoz); // 1.
      if (!lista.length) return null;
      const id = lista[Math.floor(Math.random() * lista.length)];

      const esLarga = VOCES_LARGAS.includes(id);
      if (esLarga && ahora - ultimaLarga < VOZ.cooldownLargasMs) return null; // 2.

      ultimaVoz = id;
      ultimoHabla = ahora;
      if (esLarga) ultimaLarga = ahora;
      hablandoHasta = ahora + (esLarga ? DURACION_LARGA_MS : DURACION_CORTA_MS);
      dicho.push({ t: ahora, situacion, id, larga: esLarga });
      return id;
    }
  };
}

// ---- Las dos sesiones ----
//
// No son un modelo del jugador: son sus dos extremos. Lo que interesa de la
// tranquila es cuánto silencio hay; de la activa, si Chip se vuelve una
// interfaz que hace ruido.

// El reloj de idle, que es de main.js: cada VOZ_IDLE.cadaMs tira los dados una
// vez, y sólo estando en idle.
function tirarIdle(voz, ahora) {
  const tirada = Math.random();
  if (tirada < VOZ_IDLE.firma) voz.hablar('firma', ahora);
  else if (tirada < VOZ_IDLE.firma + VOZ_IDLE.profundo) voz.hablar('idleProfundo', ahora);
  else if (tirada < VOZ_IDLE.firma + VOZ_IDLE.profundo + VOZ_IDLE.murmullo) voz.hablar('idle', ahora);
}

function sesionTranquila(minutos) {
  const voz = crearVoz();
  const fin = minutos * 60000;

  // Una acción a los 20 s: entra a `jugando` y sale.
  voz.hablar('jugando', 20000);
  voz.hablar('hecho', 26000);

  for (let t = VOZ_IDLE.cadaMs; t < fin; t += VOZ_IDLE.cadaMs) tirarIdle(voz, t);
  return { voz, fin };
}

function sesionActiva(minutos) {
  const voz = crearVoz();
  const fin = minutos * 60000;
  // Un gesto cada 6 s durante los primeros dos minutos: tocarlo, acariciarlo,
  // volver a tocarlo. Es el peor caso realista de alguien jugando con el bicho.
  const GESTO_CADA = 6000;
  const gestos = ['toque', 'caricia', 'toque', 'caricia', 'fastidio'];

  let i = 0;
  for (let t = 3000; t < Math.min(fin, 120000); t += GESTO_CADA) {
    voz.hablar(gestos[i++ % gestos.length], t);
  }

  // Y las tres acciones, con sus entradas y salidas de estado.
  for (const [t, dentro, fuera] of [
    [30000, 'jugando', 'hecho'],
    [70000, 'jugando', 'hecho'],
    [110000, 'jugando', 'hecho']
  ]) {
    voz.hablar(dentro, t);
    voz.hablar(fuera, t + 6000);
  }

  for (let t = VOZ_IDLE.cadaMs; t < fin; t += VOZ_IDLE.cadaMs) {
    if (t > 120000) tirarIdle(voz, t); // en idle recién cuando el jugador soltó
  }

  return { voz, fin };
}

// ---- Correr muchas y promediar ----
//
// Una sola corrida no dice nada: PROBABILIDAD_VOZ es una moneda. Mil corridas
// dan la forma.
function medir(fabrica, minutos, corridas = 1000) {
  const totales = [];
  const huecos = [];
  const silencios = [];
  const porSituacion = new Map();

  for (let i = 0; i < corridas; i++) {
    const { voz, fin } = fabrica(minutos);
    totales.push(voz.dicho.length);

    for (const d of voz.dicho) {
      porSituacion.set(d.situacion, (porSituacion.get(d.situacion) ?? 0) + 1);
    }

    for (let k = 1; k < voz.dicho.length; k++) huecos.push(voz.dicho[k].t - voz.dicho[k - 1].t);

    // El silencio más largo, contando desde el arranque y hasta el final.
    let mayor = voz.dicho.length ? voz.dicho[0].t : fin;
    for (let k = 1; k < voz.dicho.length; k++) {
      mayor = Math.max(mayor, voz.dicho[k].t - voz.dicho[k - 1].t);
    }
    if (voz.dicho.length) mayor = Math.max(mayor, fin - voz.dicho.at(-1).t);
    silencios.push(mayor);
  }

  const media = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const orden = [...huecos].sort((a, b) => a - b);

  return {
    vecesMedia: media(totales),
    porMinuto: media(totales) / minutos,
    huecoMinimo: orden[0] ?? null,
    huecoMediano: orden[Math.floor(orden.length / 2)] ?? null,
    silencioMayorMedio: media(silencios),
    porSituacion: [...porSituacion.entries()]
      .map(([s, n]) => [s, n / corridas])
      .sort((a, b) => b[1] - a[1])
  };
}

const seg = (ms) => (ms === null ? '—' : (ms / 1000).toFixed(1) + ' s');

for (const [nombre, fabrica, minutos] of [
  ['TRANQUILA — abre, hace una acción y lo deja quieto', sesionTranquila, 10],
  ['ACTIVA — un gesto cada 6 s durante dos minutos, y tres acciones', sesionActiva, 10]
]) {
  const m = medir(fabrica, minutos);
  console.log(`--- ${nombre} (${minutos} min, 1000 corridas) ---`);
  console.log(`  habla ${m.vecesMedia.toFixed(1)} veces  =  ${m.porMinuto.toFixed(2)} por minuto`);
  console.log(`  hueco entre voces: mínimo ${seg(m.huecoMinimo)} · mediana ${seg(m.huecoMediano)}`);
  console.log(`  silencio más largo, en promedio: ${seg(m.silencioMayorMedio)}`);
  console.log(
    '  reparto: ' + m.porSituacion.map(([s, n]) => `${s} ${n.toFixed(2)}`).join(' · ')
  );
  console.log('');
}

// ---- LA RED: que el modelo siga siendo el de sonido.js ----
const SONIDO = readFileSync(RAIZ + 'js/sonido.js', 'utf8');
const REGLAS = [
  ['1. no repite el archivo anterior', /candidatos\.filter\(\(id\) => id !== ultimaVoz\)/],
  ['2. las largas tienen su propio piso', /ultimaLarga < VOZ\.cooldownLargasMs/],
  ['3. nunca encimadas', /if \(hablando\) return null/],
  ['4. piso de silencio entre dos', /ultimoHabla < VOZ\.cooldownMs/],
  ['5. nada sin sonido o sin contexto', /ctx\.state !== 'running'/],
  ['6. nada con la pestaña oculta', /visibilityState === 'hidden'/],
  ['7. la moneda de PROBABILIDAD_VOZ, adentro de hablar', /PROBABILIDAD_VOZ\[situacion\]/]
];

const faltan = REGLAS.filter(([, re]) => !re.test(SONIDO)).map(([n]) => n);
console.log(
  faltan.length
    ? `OJO: el modelo de arriba supone reglas que ya no están en sonido.js: ${faltan.join(' | ')}`
    : 'Las siete reglas del modelo siguen escritas en sonido.js.'
);
