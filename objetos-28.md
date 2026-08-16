# CHIP — Los 28 objetos que faltan

Completan el pool de 36 (8 ya implementados + 28 nuevos). Escritos según `eventos-brief.md`: tercera persona, pasado, máximo dos oraciones, precisión de inventario, sin drama, sin reclamo.

**Distribución:** 23 comunes, 5 raros. Con los 8 existentes (7 comunes + 1 raro), el pool final queda en **30 comunes y 6 raros** — 17% de rareza, dentro del ~20% del brief.

---

## FAMILIA A — Piezas del galpón (10 comunes)

Cosas que estaban ahí. Lo que un lugar viejo deja tirado.

**A1 — Bulón del doce**
> Encontró un bulón del doce. Ya tenía uno del doce, pero este está más limpio y ahora tiene dos.

**A2 — Chapa con forma de pez**
> Una chapa recortada quedó con forma de pez. Nadie la cortó así a propósito, y por eso le gusta más.

**A3 — Resto de embalaje**
> Barrió un pedazo de embalaje con letras impresas. No sabe qué dicen. Lo guardó por las letras.

**A4 — Media junta de goma**
> Encontró media junta de goma. La otra mitad no apareció y Chip volvió a buscarla dos veces.

**A5 — Llave de once**
> Una llave de once apareció bajo el estante. No le sirve para nada de lo que tiene, pero es una llave.

**A6 — Perno doblado**
> El perno estaba doblado en un ángulo raro. Chip trató de enderezarlo, no pudo, y así le gustó más.

**A7 — Tapa de válvula**
> Encontró una tapa de válvula que gira y hace clic. Estuvo un rato largo haciéndola clic.

**A8 — Cinta métrica rota**
> Una cinta métrica sin carcasa, enrollada sola. Mide hasta ochenta y siete y ahí se corta.

**A9 — Rodamiento suelto**
> Un rodamiento rodó desde el fondo del galpón y se detuvo contra su oruga. Chip lo miró un rato antes de guardarlo.

**A10 — Trozo de manguera**
> Cortó un trozo de manguera vieja que ya no llevaba nada. El resto de la manguera sigue donde estaba.

---

## FAMILIA B — Lo que los gigantes pierden (8 comunes)

Cosas que se les caen sin que lo noten. Es el único contacto real con ellos.

**B1 — Remache del carguero**
> Se le cayó un remache al carguero y siguió de largo. Chip esperó a que se fuera para levantarlo.

**B2 — Eslabón de la grúa**
> Un eslabón de cadena quedó en el piso después de que la grúa terminara. Pesa más que su cabeza.

**B3 — Filtro descartado**
> Los de mantenimiento pesado tiraron un filtro usado. Chip lo revisó: todavía sirve para algo, seguro.

**B4 — Placa con número**
> Una placa numerada se soltó de algo grande. El número es 4471. Chip no sabe de qué era, pero ahora lo sabe alguien.

**B5 — Muelle industrial**
> Encontró un muelle tan grande que no se comprime con su peso. Se subió encima igual, para probar.

**B6 — Guante de trabajo**
> Un guante enorme quedó tirado cerca del portón. Le entra el cuerpo entero adentro. No lo hizo, pero lo pensó.

**B7 — Terminal quemada**
> Una terminal eléctrica quemada, negra en un extremo. Alguien la cambió y no barrió lo viejo.

**B8 — Pastilla de freno gastada**
> Encontró una pastilla de freno gastada hasta la mitad. Del lado sin gastar todavía se lee la marca.

---

## FAMILIA C — Lo que entra de afuera (5 comunes)

Cosas que no son del galpón. El mundo colándose por la ventana.

**C1 — Hoja seca**
> Entró una hoja por la ventana y aterrizó en el alféizar. Es lo único del galpón que no es de metal.

**C2 — Piedra lisa**
> Una piedra chata y lisa apareció cerca de la puerta. No hay piedras adentro del galpón.

**C3 — Pluma**
> Encontró una pluma gris en el piso. Miró hacia arriba un rato largo y no vio nada.

**C4 — Papel con humedad**
> Un papel mojado se secó pegado a la pared. Se despegó entero. Chip lo estiró con cuidado.

**C5 — Semilla con alas**
> Una semilla con alas bajó girando por la ventana. Chip la siguió con la cabeza hasta que tocó el piso.

---

## FAMILIA D — Las rarezas (5 raros)

Baja probabilidad. Cada una tiene que sentirse como un hallazgo.

**D1 — Pieza de ningún robot conocido**
> Encontró una pieza que no encaja con nada. La comparó con todo lo que tiene y con todo lo que vio. No es de acá.

**D2 — Foto**
> Debajo del estante había una foto muy vieja. No se distingue qué muestra. Chip la guardó igual, boca arriba.

**D3 — Llave con etiqueta**
> Una llave con una etiqueta escrita a mano. La etiqueta dice una sola palabra y está borroneada.

**D4 — Engranaje dorado**
> Un engranaje dorado apareció donde ayer no había nada. Gira sin ruido, que es raro para algo tan viejo.

**D5 — Lo que suena adentro**
> Encontró una caja cerrada que suena cuando la mueve. No la puede abrir. La agita cada tanto.

---

## Notas de implementación

**Mapeo evento → objeto:** cada entrada es un evento del pool general y otorga un objeto. Los ids sugeridos: `bulon-doce`, `chapa-pez`, `resto-embalaje`, `media-junta`, `llave-once`, `perno-doblado`, `tapa-valvula`, `cinta-metrica`, `rodamiento`, `trozo-manguera`, `remache-carguero`, `eslabon-grua`, `filtro-descartado`, `placa-numero`, `muelle-industrial`, `guante-trabajo`, `terminal-quemada`, `pastilla-freno`, `hoja-seca`, `piedra-lisa`, `pluma`, `papel-humedad`, `semilla-alas`, `pieza-desconocida`, `foto`, `llave-etiqueta`, `engranaje-dorado`, `caja-suena`.

**Formas para el estante:** las 28 necesitan silueta dibujada por código, como las 8 actuales. Las de la familia C (hoja, piedra, pluma, semilla) son las más distintas del resto — vale que se noten: son lo único orgánico de una colección de metal.

**Los eventos de la familia B pueden convivir con el arco de gigantes.** Cuando el arco de un gigante avance, sus objetos podrían volverse más probables — pero eso es una mejora posterior, no hace falta ahora.

**D2, D3 y D5 no se resuelven nunca.** La foto no se distingue, la etiqueta está borroneada, la caja no se abre. Es deliberado: son objetos que abren una pregunta y no la cierran. Si algún día alguien pide una respuesta, la respuesta es que no la hay.

## Nota de canon

La familia C existe para que la colección no sea solo chatarra. Una hoja seca en un estante de bulones dice algo que ningún bulón puede decir: que afuera hay otra cosa, y que Chip lo notó.
