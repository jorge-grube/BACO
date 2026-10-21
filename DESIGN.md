# BACO — sistema de diseño

Base blanca, Montserrat y un único acento salvia. Referencias: AlignUI Pro (densidad, micro-etiquetas,
tarjetas con borde fino), kargul swipe file (contenedores grandes y redondeados), Grainient (grano sobre
color plano, solo en la cabecera).

## Color

| Token | Hex | Uso |
| --- | --- | --- |
| `ink` | `#141816` | Texto principal, botón primario |
| `ink-2` | `#535C57` | Texto secundario |
| `ink-3` | `#89928D` | Etiquetas, metadatos |
| `line` | `#E6E9E7` | Bordes y divisores |
| `paper` | `#FFFFFF` | Fondo |
| `paper-2` | `#F6F7F6` | Superficies hundidas, fondo de página interior |
| `sage` | `#B8D2C3` | Acento: bandas, chips activos, selección |
| `sage-50` | `#EDF4F0` | Tinte suave de fondo |
| `sage-700` | `#2E5B47` | Texto y bordes sobre salvia (contraste AA) |
| `clay` | `#C2643F` | Solo para "Patrocinado" y avisos; nunca decorativo |

## Tipografía

Montserrat 400/500/600/700. Titulares 600 con `letter-spacing: -0.03em`. Micro-etiquetas en mayúsculas,
11 px, 600, `letter-spacing: 0.08em`, color `ink-3`. Números con `tabular-nums`.

## Forma

Radio 10 (inputs, chips cuadrados), 16 (tarjetas), 28 (contenedores grandes). Botones en píldora.
Sombras casi invisibles: borde de 1 px + `0 1px 2px rgb(20 24 22 / 0.04)`.

## Reglas anti-"hecho con IA"

- Nada de degradados morados, brillos, `✨`, emojis ni glassmorphism.
- El asistente se llama "Asistente", no "IA mágica"; explica qué ha entendido en chips editables.
- Composición editorial alineada a la izquierda, no todo centrado.
- Datos reales del catálogo en cada pantalla; lo simulado lleva la marca "dato de ejemplo".
- Iconos Remix en trazo fino, tamaño 16–18, nunca dentro de círculos de colores.
