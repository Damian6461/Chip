# Cómo usar estas plantillas

- **Lienzo 256x256. NO MOVER EL LIENZO ni recortarlo.** Todo lo que hay acá está
  en las coordenadas exactas en las que el juego lo dibuja; correr o recortar el
  lienzo desalinea el sprite entero.
- **Exportar WebP con alfa, con el mismo nombre del sprite que reemplaza.** Cada
  plantilla dice arriba cuál es.
- **El borde de la crema tiene que caer SOBRE el contorno oscuro del metal de la
  cabeza, no adentro de la crema.** Ése es el defecto que estamos corrigiendo:
  hoy hay una segunda línea oscura flotando adentro del ojo.
- **La capa de la cabeza es referencia: NO va en el archivo final.** El WebP
  lleva sólo los ojos, con todo lo demás transparente.

---

## Qué es cada archivo

| archivo | reemplaza a | cabeza |
|---|---|---|
| `plantilla-idle-contento.png` | `sprites/idle-ojos-contento.webp` | idle |
| `plantilla-idle-cerrado.png` | `sprites/idle-ojos-cerrado.webp` | idle |
| `plantilla-feliz-contento.png` | `sprites/feliz-ojos-contento.webp` *(nuevo)* | feliz |
| `plantilla-feliz-cerrado.png` | `sprites/feliz-ojos-cerrado.webp` *(nuevo)* | feliz |

Las cuatro llevan **dos capas y nada más**: la cabeza del estado, y encima el
recorte de ojos que se usa hoy **con la transformación de hoy ya aplicada**
—escala, corrimiento y recorte—, remuestreada con vecino más cercano. O sea: es
exactamente lo que se ve hoy en pantalla, congelado como archivo.

Los dos de `feliz` **son archivos nuevos**. Hoy `feliz` usa los mismos dos
recortes que `idle`, corregidos con otros números; por eso están peor.

### Y las dos referencias

| archivo | qué es |
|---|---|
| `referencia-idle.png` | `idle-ojos.webp` sobre `idle-cabeza.webp` |
| `referencia-feliz.png` | `feliz-ojos.webp` sobre `feliz-cabeza.webp` |

**Éste es el caso que sí está bien**, y está bien por una sola razón: el recorte
entra sin transformación ninguna, del tamaño y en el lugar que va. Mirá el borde
de la crema contra el metal en éstas y después en las otras cuatro. La diferencia
es lo que hay que arreglar.

---

## Por qué no alcanzaba con corregir los números

Los dos sprites traen su propio borde oscuro, y son casi igual de oscuros:

```
idle-ojos.webp           borde de alfa: 146 px, luminancia media 73,7
idle-ojos-contento.webp  borde de alfa:  82 px, luminancia media 70,6
```

La diferencia no es el sprite: **es dónde cae**. El de `idle-ojos` cae encima del
contorno del metal y se pierde adentro. El del gesto, escalado 1,17 y corrido,
cae adentro de la crema. Ese es el segundo contorno.

O sea que **el borde negro es consecuencia de la transformación**, no del dibujo.
Y no hay transformación que lo arregle, porque no hay una escala correcta que
buscar: alineando por la crema —lo único que los dos dibujos comparten— los dos
ojos del mismo archivo piden escalas que difieren en 0,16 y 0,19, y no es
encuadre, es que el párpado del gesto tapa parte de la crema y la caja de crema
mide otra cosa en cada dibujo.

Los dieciséis números de `AJUSTE_OJOS` son dieciséis intentos a ojo contra un
objetivo que se mueve. Se arregla en el dibujo.

---

## Cómo se regeneran

```
node verificacion/plantillas-escribidor.mjs
```

y abrir `verificacion/plantillas-ojos.html?guardar=1`.

Corre en el navegador y no en Node porque hay que decodificar WebP con alfa y el
proyecto no tiene dependencias. La salida que ofrece Windows —WIC— decodifica el
WebP pero **aplana el alfa**: sobre `idle-ojos.webp` devuelve 65536 píxeles
opacos, 0 transparentes, 0 parciales. Está medido y anotado en
`plantillas-ojos.mjs`.

La página **cruza su matriz contra el navegador antes de exportar**: arma las
ocho capas con las reglas reales de `style.css` y compara
`getBoundingClientRect` contra lo que predice la cuenta. Si no coinciden, no
exporta. Hoy el error es **0,0000 px en las ocho**.
