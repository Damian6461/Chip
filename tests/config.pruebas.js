// Constantes de las pruebas. No son números del juego — meterlas en
// js/config.js contaminaría el runtime con valores que sólo existen para
// testear. Los del juego se importan desde js/config.js, no se copian.

// Tolerancia de `cerca`. Las tasas de decay son decimales y multiplicarlas
// arrastra error de punto flotante.
export const EPSILON = 1e-9;

// Instantes fijos, construidos con el constructor de hora LOCAL para que la
// franja de standby dé lo mismo en cualquier zona horaria.
export const T0 = new Date(2026, 0, 15, 12, 0, 0).getTime(); // mediodía
export const T_MADRUGADA = new Date(2026, 0, 15, 3, 0, 0).getTime();
export const T_NOCHE = new Date(2026, 0, 15, 23, 0, 0).getTime(); // borde inclusive
export const T_SEIS = new Date(2026, 0, 15, 6, 0, 0).getTime(); // último de la franja
export const T_SIETE = new Date(2026, 0, 15, 7, 0, 0).getTime(); // borde exclusive

// Horas simuladas de los chequeos de cap y piso.
export const HORAS_LARGAS = 500;
export const HORAS_PISO = 200;
