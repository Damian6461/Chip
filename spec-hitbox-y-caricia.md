# SPEC — Hitbox, objetos del piso y la caricia

Cinco cosas que Damián reportó probando en el teléfono. Las dos primeras tienen medición.

---

## 1. El hitbox de Chip se come los objetos del piso

**Medido en producción:**

```
escena              480 × 945
hitbox de Chip      416 × 416   en x 32-448, y 359-775
objeto en el piso    25 ×  25   en x 391-416, y 750-775
```

El hitbox de Chip ocupa el **87% del ancho de la escena** y contiene por completo la posición del objeto. Por eso Damián no puede levantarlo: el tap lo captura Chip.

Y no es que el objeto esté sobre el cuerpo de Chip — el sprite visible llega hasta x≈379, así que el objeto en x=391 está **fuera de su silueta pero dentro de su caja**.

**Qué hacer:**

- **Ajustá el hitbox a la silueta real.** Una caja de 416×416 para un personaje que mide ~278 px de ancho visible es casi el doble de lo necesario. Podés usar la caja del sprite (que ya está medida) o, mejor, un `clip-path` con la forma aproximada del cuerpo.
- **Los objetos del piso van por encima** en el orden de apilamiento. Aunque el hitbox quede ajustado, si un objeto cae cerca del borde de Chip tiene que ganarle el tap.
- **Y el hitbox de Chip nunca debe cubrir la franja del piso** donde caen los objetos. Esa zona ya está definida (la banda útil entre 66% y 82% de alto): que el hitbox termine antes.

## 2. Los objetos del piso son muy chicos

Miden **25×25 px**. El mínimo táctil recomendado es 44×44, así que hoy son poco más de la mitad.

- **Subí el tamaño visual** a ~34-38 px. Damián los quiere un poco más grandes, y además así se descubren mejor: un objeto de 25 px en una escena de 480 es fácil de no ver.
- **Y el área táctil a 44×44 como mínimo**, con padding invisible alrededor si el gráfico queda más chico. Igual que hiciste con el botón del menú.

## 3. El halo azul de la caricia sigue apareciendo

Se pidió sacarlo en la spec anterior y sigue ahí. **Va sin reemplazo.** Parece el ripple de un botón, y es luz fría, que es lo contrario de lo que comunica una caricia. La respuesta tiene que estar en el cuerpo de Chip: los ojos, la respiración, la cabeza, los corazones.

## 4. Los ojos entrecerrados están fuera de paleta

Cuando los ojos se achican al acariciar, el color no es el de la cabeza y se ve postizo.

El párpado tiene que estar pintado **con el gris de la chapa de la cabeza**, tomado del sprite, no de un color aparte. Un párpado es la propia cabeza bajando sobre el ojo: si es de otro color, se lee como una mancha encima.

Sacá el valor del propio sprite —el gris del casco justo arriba del ojo— en vez de elegirlo. Y verificá que funcione en los cuatro fondos, porque la iluminación cambia entre franjas.

## 5. El panel de debug sigue sin abrir en el teléfono

El arreglo de `touch-action` no alcanzó, o no llegó. Damián sigue sin poder abrirlo manteniendo apretado el botón del menú en la PWA instalada.

**Revisá los cuatro puntos juntos, no de a uno** — con que falte uno, el navegador cancela igual:

1. `touch-action: none` sobre el botón
2. `user-select: none` y `-webkit-touch-callout: none`
3. `preventDefault()` en el evento `contextmenu`
4. `setPointerCapture` en el `pointerdown`, y **sacar `pointerleave` de la lista de cancelación** — reemplazalo por un umbral de movimiento de ~20 px

Y si después de eso sigue sin andar, **cambiá el gesto**: cinco toques rápidos en una esquina fija es más robusto que un long-press, porque no compite con ningún comportamiento nativo del navegador. Decidilo vos y reportá cuál elegiste.

---

## Verificación

Los puntos 1 y 2 se pueden medir: el hitbox de Chip no debe solaparse con la zona donde caen los objetos, y el área táctil del objeto debe dar 44×44 o más.

Los puntos 3, 4 y 5 los verifica Damián con el dedo en el teléfono. Reportá qué cambiaste en cada uno.

---

## Reglas de siempre

Constantes en `config.js`. `prefers-reduced-motion` cubre lo nuevo. Tests en verde. Commit y push antes de reportar. Verificá a tamaño real y contra la frase textual.
