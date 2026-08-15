// Presupuesto de peso de los assets.
//
// Vive en tests/ y no en config.js a propósito, con el mismo criterio que
// tests/config.pruebas.js: no es un número del juego, es un número del contrato
// de entrega. Cambiarlo tiene que ser una decisión, no un efecto colateral de
// que un archivo haya crecido.
//
// Los límites son por familia porque una panorámica de 1672x941 y un ícono de
// 192 no se miden con la misma vara. El orden importa: gana la primera regla
// cuyo patrón matchea, y la última es el cajón de sastre.
export const LIMITES_PESO = [
  // Las cuatro panorámicas del galpón. El techo lo puso Damián en 500 KB; hoy
  // la más pesada (mediodía, la del cielo azul con los degradés más amplios)
  // está en 328.
  { patron: /^fondo-.*\.(webp|png)$/i, kb: 500 },

  // Los sprites del personaje y los recortes de ojos: son 256x256 con alfa.
  { patron: /^icon-\d+\.(webp|png)$/i, kb: 120 },

  { patron: /.*/, kb: 120 }
];

// Y el total, que es lo que de verdad importa: es lo que pesa instalar la PWA.
// Antes de pasar los assets a WebP eran 7579 KB; hoy son ~1556.
export const PRESUPUESTO_TOTAL_KB = 2500;
