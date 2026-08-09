# Chip

Virtual pet en pixel art. HTML, CSS y JavaScript vanilla con módulos ES. Sin frameworks, sin build, sin dependencias.

Este archivo documenta **lo que el código hace hoy**: cómo correrlo, qué contratos hay que respetar y dónde están los bordes filosos. El *por qué* de las decisiones de diseño vive en el brief del proyecto, que no está en el repo.

---

## Correrlo

Hay que servirlo por HTTP. **Los módulos ES no cargan desde `file://`** — abrir `index.html` con doble clic tira error de CORS. Usá Live Server o cualquier server estático sobre la carpeta.

```
http://127.0.0.1:5500/index.html
```

## Tests

41 pruebas, mismos archivos en dos entrypoints:

```bash
node tests/correr.mjs        # sale 0 si pasa todo, 1 si no
```

```
http://127.0.0.1:5500/tests/   # verde/rojo en la página, resumen en el <title>
```

No hace falta `package.json`: Node detecta la sintaxis de módulo sola. Los dos entrypoints instalan un `localStorage` en memoria antes de importar nada del juego, así que **la suite nunca toca tu partida**, ni siquiera en el navegador donde el origen es el mismo.

Se corren después de cualquier cambio que toque estado, decay o persistencia.

## Panel de debug

```
http://127.0.0.1:5500/index.html?debug=1
```

Sin el parámetro, `js/debug.js` ni se descarga (import dinámico). Cinco controles:

| Control | Qué hace |
|---|---|
| multiplicador | escala las horas de los dos controles de abajo |
| simular h | aplica el decay de N horas **en el momento** |
| volver tras N h | retrocede `ultimaVisita` **sin** aplicar decay y recarga |
| visual | fuerza un estado visual, o `auto` para volver a la cadena |
| reiniciar partida | save nuevo en 100/100/100 |

**`simular h` y `volver tras N h` no son lo mismo.** El primero cobra el decay ya; al recargar no quedan horas transcurridas y **los eventos nunca se disparan**. El segundo recorre el camino de arranque real, como si hubieras cerrado y vuelto a abrir la app: es el único que sirve para ver eventos.

*Arista conocida: la lectura de stats del panel se refresca con los controles del panel, no con los botones del juego. Las barras del juego sí.*

---

## Reglas de arquitectura

Se rompen y el proyecto se degrada rápido.

- **`estado.js` es el único que toca `localStorage`.**
- **`ui.js` es el único que toca el DOM del juego** (lo declarado en `index.html`). Recibe y pinta: no calcula. Excepción declarada: `debug.js` crea su propio subárbol, lo appendea a `document.body` y no lee ni modifica nada que no haya creado él.
- **`decay.js` es puro.** No guarda, no lee `localStorage`, no toca el DOM, no muta lo que recibe.
- **`acciones.js` es puro.** Señala "no apliqué" devolviendo la misma referencia.
- **`config.js` es el único hogar de las constantes del juego.** Tres carve-outs documentados en el propio archivo: `sw.js`, `manifest.json` y `tests/config.pruebas.js`.
- **El decay se calcula por diferencia de timestamps, nunca con un contador corriendo.**

`main.js` orquesta: mantiene el estado vivo, resuelve el reloj y es el único con timers.

---

## Cadena de estados visuales

Prioridad, gana la primera condición verdadera:

1. acción en curso → `cargando` / `jugando` / `limpiando`
2. `bateria < 15` → `critico`
3. hora local entre 23 y 7 → `standby`
4. `bateria > 70` **y** `humor > 70` → `feliz`
5. resto → `idle`

Las tres comparaciones son **estrictas**: batería en 15 exacto no es `critico`, y `feliz` pide que los dos stats pasen el umbral.

Las acciones van primero porque son feedback transitorio: si tocás Cargar con la batería en 12 y no cambia nada, la acción se siente muerta justo cuando más importa que responda. El bucle queda `critico` → `cargando` → `idle`.

**Las acciones del jugador saltean el debounce.** Sin eso, con el debounce y la duración de acción valiendo lo mismo (2 s), la ventana se come la transición y a veces no ves nada.

`resolverEstadoVisual({ estado, ahora, accion })` recibe `ahora` como timestamp **sin default**: el reloj entra por el llamador, así `standby` es testeable en cualquier zona horaria.

---

## Contrato de sprites

`/sprites/`, **carpeta en minúscula** — Windows no distingue, un hosting Linux sí.

```
idle.png  feliz.png  critico.png  standby.png  cargando.png  jugando.png  limpiando.png
```

256×256, PNG con transparencia, personaje centrado. **Mismo tamaño y mismo encuadre en todos**: si el robot está más arriba en uno, salta al cambiar de estado.

Siete archivos ideales, **seis obligatorios**: `limpiando.png` es opcional.

El loader degrada en dos escalones: falta el sprite pedido → usa el de `idle`; falta ese también → placeholder con el nombre del estado escrito. Eso permite desarrollar sin arte y verificar la cadena a ojo. **Contrapartida:** con arte real, un sprite faltante se ve como `idle` en vez de cantar el error.

Pendiente para cuando entre el arte: `ctx.imageSmoothingEnabled = false` en `ui.js`, o el pixel art sale borroso.

---

## Estado y migraciones

```js
{ nombre, bateria, humor, mantenimiento, ultimaVisita, creado, ultimosEventosIds, version }
```

Key: `chip.save.v1` — **no se sube de versión nunca**, cambiarla borra todas las partidas en silencio. Para eso está el campo `version`, que `estado.js` usa para migrar en el lugar.

Los tres stats se guardan **decimales**. Solo la UI redondea. Redondear al persistir pierde el decaimiento parcial y en visitas cortas nunca baja nada.

| Versión | Cambio |
|---|---|
| 1 | forma original |
| 2 | agregó `ultimoEventoId` |
| 3 | lo reemplazó por `ultimosEventosIds` (array) |

`migrar()` hace merge con los defaults primero, así un campo nuevo entra solo sin una rama por versión. Un campo que **cambia de forma** sí necesita su paso explícito: si no, el viejo queda colgado en el save para siempre.

### El piso del decay no es un imán

```js
nuevoValor = min(valorAnterior, max(DECAY_FLOOR, valorConDecay))
```

`DECAY_FLOOR` limita **cuánto puede bajar el paso del tiempo**, no dónde tiene que estar el valor. Un stat por debajo del piso se queda donde está y sube **solo con acciones**.

Con `max(FLOOR, valor)` a secas, jugar con la batería en 15 la dejaba en 5 y el tick siguiente devolvía esos 5 gratis: el costo de la acción se evaporaba justo en el borde donde tiene que doler.

---

## Service worker

Se registra siempre, **incluido en desarrollo**: `localhost` y `127.0.0.1` son contextos seguros. Una IP de LAN sobre HTTP plano **no** lo es — para probar desde el celular hace falta HTTPS.

**Subí `CACHE_VERSION` en `sw.js` en cada cambio de cualquier archivo de `ARCHIVOS_CACHE`.** Si no, el usuario sigue viendo la versión vieja para siempre. Vive ahí y no en `config.js` a propósito: el navegador dispara el update comparando los bytes de `sw.js`.

Mientras desarrollás, dejá tildado en DevTools → Application → Service Workers: **Update on reload** y **Bypass for network**. Sin eso parece que los cambios no se aplican. Si ya quedó pegado: Unregister + Clear site data + Ctrl+Shift+R.

`icons/generador.html` regenera los PNG del manifest sin instalar nada.

---

## Qué NO está en el código

- **El sprite de Chip.** La carpeta está vacía. Es el camino crítico real.
- **El texto de los eventos.** `js/datos-eventos.js` tiene 6 placeholders. Es la decisión de diseño central y no la toma el código. Agregar un evento es agregar una entrada con `id` único; la lógica no se toca.
- **El balance de números.** Se ajusta mirando a Chip, no leyendo código.

---

## Notas

- El estado en memoria no se resincroniza con `localStorage`: dos pestañas abiertas se pisan. Irrelevante en celular, confunde en desarrollo.
- El debounce visual de 2 s es prácticamente inerte: nada repinta más rápido que el tick de 60 s salvo las acciones, que lo saltean. Es una guarda a futuro — no lo tunees a ojo porque no vas a poder observarlo.
- Se trabaja desde dos máquinas: `git pull` al arrancar, `git push` al terminar. Nunca copiar la carpeta a mano.
