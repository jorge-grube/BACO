# BACO — sistema de diseño

Base blanca, Montserrat y un único acento salvia. Referencias: AlignUI Pro (densidad, micro-etiquetas,
tarjetas con borde fino), kargul swipe file (contenedores grandes y redondeados), Grainient (grano sobre
color plano, solo en la cabecera).

## Color

| Token | Hex | Uso |
| --- | --- | --- |
| `ink` | `#141816` | Texto principal, botón primario |
| `ink-2` | `#535C57` | Texto secundario |
| `ink-3` | `#646C68` | Etiquetas, metadatos (5,4:1; el antiguo `#89928D` daba 3,2:1 y suspendía AA) |
| `line` | `#E6E9E7` | Bordes y divisores |
| `paper` | `#FFFFFF` | Fondo |
| `paper-2` | `#F6F7F6` | Superficies hundidas, fondo de página interior |
| `sage` | `#B8D2C3` | Acento: bandas, chips activos, selección |
| `sage-50` | `#EDF4F0` | Tinte suave de fondo |
| `sage-700` | `#2E5B47` | Texto y bordes sobre salvia (contraste AA) |
| `clay` | `#A8502D` | Solo para "Patrocinado" y avisos; nunca decorativo (4,7:1 sobre `clay-50`) |

## Tipografía

Montserrat 400/500/600/700. Titulares 600 con `letter-spacing: -0.03em`. Micro-etiquetas en mayúsculas,
12 px, 600, `letter-spacing: 0.06em`, color `ink-3`. Números con `tabular-nums`. En el móvil ningún texto con
información baja de 13 px (los de 12-13 px suben un punto en `globals.css`) y los campos de formulario van a 16 px.

## Forma

Radio 10 (inputs, chips cuadrados), 16 (tarjetas), 28 (contenedores grandes). Botones en píldora.
Sombras casi invisibles: borde de 1 px + `0 1px 2px rgb(20 24 22 / 0.04)`.

## Fotografía

- El catálogo oficial no publica fotos. Cada producto lleva una foto **ilustrativa** del tipo de producto
  (`lib/photos.ts`: reglas sobre nombre y categoría → grupo de fotos en `lib/photo-library.ts`), siempre la misma
  para el mismo producto. La ficha lo indica con la etiqueta "Foto ilustrativa" y el pie de página lo explica.
- Fotos cálidas, de producto o de origen (cava, viñedo, huerta, cocina); nada de fotos de stock con marcas visibles.
- Tarjetas 4:3, portada de categoría 4:5, banda editorial a sangre. Texto sobre foto solo en blanco y con velo
  inferior (`scrim="bottom"`). Al pasar el ratón la foto escala un 4 %, nada más.
- Mientras carga, la caja se pinta con el color medio de la foto (`Shot`), no con gris.
- Licencia Unsplash; origen de cada archivo en `public/photos/CREDITS.md`.

## Público y accesibilidad

Muchos productores son gente del campo de 45-65 años que usa sobre todo el móvil y WhatsApp.
- Objetivos táctiles de 44 px en el móvil (`SIZES` de `ui.tsx`: compactos solo desde `md`). Iconos siempre con texto.
- Lenguaje llano: "Pedir precio y plazo", "Mensajes de restaurantes", "Tu página en BACO", "Enviar respuesta".
  Nada de "ficha sin reclamar", "encaje", "apariciones", "HORECA". Siglas explicadas en /ayuda.
- Foco visible en todo (`:focus-visible` en `globals.css`), enlace "Saltar al contenido", contraste AA comprobado con axe.
- Ayuda siempre en el mismo sitio (WCAG 3.2.6): botón fijo abajo a la derecha, "Ayuda" en la cabecera y en el pie.
  Contacto en el mismo orden en todas partes: WhatsApp, llamar, que me llamen, correo.

## Movimiento

Corto (100-340 ms), con propósito y anulado por `prefers-reduced-motion`:
- Respuesta al toque (`active:scale`), etiquetas que entran, check que se dibuja al enviar.
- Resultados que entran escalonados (`.stagger`, solo las 6 primeras) y esqueleto mientras busca (`app/buscar/loading.tsx`).
- La foto de la tarjeta vuela a la cabecera de la ficha (`<ViewTransition>` de React 19.3, `morph` en `ProductCard`).
- El hub de la portada se puede pausar (WCAG 2.2.2). Nada de parallax, carruseles automáticos ni revelado al hacer scroll.

## Reglas anti-"hecho con IA"

- Nada de degradados morados, brillos, `✨`, emojis ni glassmorphism.
- El asistente se llama "Asistente", no "IA mágica"; explica qué ha entendido en chips editables.
- Composición editorial alineada a la izquierda, no todo centrado.
- Datos reales del catálogo en cada pantalla; lo simulado lleva la marca "dato de ejemplo".
- Iconos Remix en trazo fino, tamaño 16–18, nunca dentro de círculos de colores.
