# BACO · Qué está implementado

Documento de referencia del prototipo: qué hace cada parte, dónde está el código, qué es real y qué es de
demostración, y cómo se ha comprobado. Fecha: 21 de octubre de 2026.

---

## 1. En una frase

BACO es un buscador que conecta a restaurantes, tiendas y público con los productores del sello
**M Producto Certificado** de la Comunidad de Madrid. Además de la web, organiza **actividad en persona**: un
**puesto compartido en mercadillos** donde vendemos el producto de varios productores a la vez, una **agenda** de
mercados, ferias y encuentros, **altas asistidas** (el equipo le hace la página al productor) y un **distintivo**
para los restaurantes que compran producto de Madrid.

Todo está pensado para gente del campo que usa sobre todo el móvil y WhatsApp: botones grandes, lenguaje llano,
entrar sin contraseña, contestar con un toque desde el WhatsApp y una **ayuda paso a paso en cada página**.

---

## 2. Cómo arrancarlo

```bash
npm install          # instala dependencias (nuevas: qrcode)
npm run seed         # crea data/baco.db desde cero con el catálogo y los datos de demo
npm run dev          # http://localhost:3000
```

- Si ya tenías una `data/baco.db` de antes, **no hace falta** volver a ejecutar `seed`: al arrancar, la base se
  migra sola (nuevas tablas, nuevo perfil «equipo», teléfonos, agenda, puesto…). Si quieres partir de cero, `seed`.
- Para comprobar el código: `npm run typecheck`, `npm run lint` y `npm run build`.

### Cuentas de demo

| Perfil | Persona | Móvil (para entrar con código) |
| --- | --- | --- |
| Hostelero | Lucía Ortega | 600 000 001 |
| Productor | Andrés Gil (La Rosa Amarilla C.B.) | 600 000 002 |
| Consumidor | Marta Ruiz | 600 000 003 |
| Equipo BACO | Sara Molina | 600 000 009 |

En `/entrar` se puede pulsar la cuenta directamente o escribir el móvil: el «SMS» con el código no se envía, se
enseña en pantalla.

### Variables de entorno (`.env.local`, todas opcionales)

| Variable | Para qué | Si falta |
| --- | --- | --- |
| `NEXT_PUBLIC_BACO_PHONE` | Teléfono de ayuda | 900 000 000, marcado «dato de ejemplo» |
| `NEXT_PUBLIC_BACO_WHATSAPP` | WhatsApp de ayuda (solo dígitos con prefijo) | 34600000000, marcado |
| `NEXT_PUBLIC_BACO_EMAIL` | Correo de ayuda | ayuda@baco.example, marcado |
| `NEXT_PUBLIC_BACO_HOURS` | Horario de atención | L-V 9-14 y 16-19 |
| `NEXT_PUBLIC_SITE_URL` | Dirección pública para los QR de los carteles | La del propio servidor |
| `GEMINI_API_KEY` | Entender la búsqueda con Gemini y embeddings | Reglas en español e índice léxico |

---

## 3. Mapa de páginas

| Ruta | Qué es | Quién la usa |
| --- | --- | --- |
| `/` | Portada: buscador, ejemplo real de respuesta, «Nos vemos en el mercado» (puesto + agenda), tendencias, sellos, categorías | Todos |
| `/buscar` | Resultados con lo que hemos entendido (chips editables), filtros y el porqué de cada resultado | Todos |
| `/producto/[id]` | Ficha de producto: datos, sellos, pedir muestra/precio/pregunta, favoritos, opiniones | Todos |
| `/productor/[id]` | Página del productor con todos sus productos | Todos |
| `/productor/[id]/cartel` | **Cartel A4 con QR** a la página del productor, listo para imprimir | Productor |
| `/puesto` | **Puesto compartido en mercadillos**: cómo funciona, próximos días con sus productos, reservar | Público y productores |
| `/puesto/reservar/[slotId]` | Reservar unidades para recoger en el mercado (gratis, se paga allí) | Público |
| `/puesto/vender` | Condiciones y formulario para que un productor lleve producto al puesto | Productor |
| `/agenda` | **Agenda**: mercados y ferias reales + actividades de BACO, con filtros por público y tipo | Todos |
| `/agenda/[id]` | Detalle, inscripción y «Añadir a mi calendario» | Todos |
| `/agenda/[id]/ics` | Archivo de calendario (.ics) | — |
| `/restaurantes` | Restaurantes con el **distintivo** «Cocina con producto de Madrid» y a quién compran | Público |
| `/restaurantes/[id]/cartel` | Cartel A4 con QR del distintivo para el local | Hostelero |
| `/piloto/sierra-norte` | **Piloto comarcal** de la Sierra Norte: productores, citas y cómo unirse | Todos |
| `/entrar` | Entrar con el móvil (código por SMS) o con una cuenta de demo | Todos |
| `/entrar/codigo` | Escribir el código de 6 cifras | Todos |
| `/r/[token]` | **Contestar desde el WhatsApp** a un restaurante, sin entrar ni contraseña | Productor |
| `/revisar/[token]` | **Revisar y publicar** la página que le ha preparado el equipo | Productor |
| `/panel` | Panel según el perfil (ver punto 5) | Con cuenta |
| `/demo/avisos` | Todos los WhatsApp/SMS/correos que BACO «ha enviado» en la demo | Demo |
| `/ayuda` | Guías paso a paso, preguntas frecuentes y contacto con una persona | Todos |
| `/aviso-legal`, `/privacidad`, `/cookies`, `/accesibilidad` | Páginas legales | Todos |

---

## 4. Cada parte, explicada

### 4.1 Ayuda paso a paso en todas las páginas

- **Qué es.** Botón fijo «¿Necesitas ayuda?» (en el móvil, «Ayuda») abajo a la derecha, en todas las páginas y
  siempre en el mismo sitio. Abre un panel con:
  1. **«Para esta página»**: las guías que sirven donde estás. **Todas las páginas tienen al menos una**
     (comprobado para los 5 perfiles en las 25 rutas).
  2. **Otras guías**, plegadas para no abrumar.
  3. **Habla con una persona**, siempre en el mismo orden: WhatsApp (con el mensaje ya escrito diciendo desde qué
     página escribes), Llamar, Que me llamen (eliges mañana o tarde) y Correo.
- **Cómo funciona una guía.** Oscurece la pantalla y señala el botón o la zona real que hay que usar, con una
  tarjeta que explica el paso en una o dos frases. Si el paso está en otra página, te lleva («Ir allí»); si necesita
  otra cuenta, te lo dice y te lleva a entrar. Cada paso se puede **oír en voz alta**. Sigue funcionando al cambiar
  de página y se sale con «Salir» o Escape.
- **19 guías**: buscar, pedir muestra, guardar y valorar, página de productor, entrar con el móvil, contestar a un
  restaurante (panel), contestar desde el WhatsApp, revisar tu página, reservar en el puesto, vender en el puesto,
  apuntarse a una actividad, tu panel, distintivo, imprimir el cartel, piloto Sierra Norte, avisos, panel del
  equipo, pedir ayuda a una persona y tus datos.
- **Código.** `lib/help/guides.ts` (texto de las guías), `lib/help/demo.ts` (a qué producto, reserva o enlace
  lleva cada guía), `components/help/help-center.tsx` (panel, recorrido, lectura en voz alta). Cada elemento
  señalado lleva `data-help="…"` en la página.

### 4.2 Entrar sin contraseña (código por SMS)

- Escribes el móvil, te llega un código de 6 cifras (caduca en 10 minutos) y entras. El campo admite el
  autocompletado del código en el móvil. Si el número no tiene cuenta, se explica y se ofrece que te llamemos.
- **Por qué.** La gente del campo olvida contraseñas; un código es lo que ya usan con el banco (WCAG 3.3.8).
- **Demo.** No se envía SMS: el código se ve en la pantalla y queda en «Avisos enviados».
- **Código.** `app/entrar/`, `startPhoneLogin` y `verifyPhoneLogin` en `app/actions.ts`, tabla `login_codes`.

### 4.3 Avisos por WhatsApp / SMS y enlaces mágicos

- Cada vez que pasa algo importante BACO avisa a quien toca: petición nueva al productor, respuesta al
  restaurante, código de acceso, reserva, solicitud del puesto aceptada o no, página lista para revisar,
  inscripción en la agenda, distintivo concedido, «que me llamen».
- Los avisos al productor llevan un **enlace que abre directamente lo que tiene que hacer**: contestar
  (`/r/…`, con botones «Sí, puedo» / «Ahora no puedo» / escribir) o revisar su página (`/revisar/…`). No hace
  falta entrar ni recordar nada. Los enlaces caducan (14 días los de contestar, 30 los de revisar; los creados con los datos de demo, 90) y si uno no sirve se explica.
- **Demo.** No sale ningún mensaje: se guardan en la tabla `notifications` y se ven en `/demo/avisos` y en cada
  panel, dibujados como burbuja de WhatsApp/SMS.
- **Para producción.** Sustituir el interior de `lib/notify.ts` por la API de WhatsApp Business y un proveedor de SMS;
  el resto no cambia.
- **Código.** `lib/notify.ts`, `components/phone-message.tsx`, `app/r/`, `app/revisar/`, tabla `magic_links`.

### 4.4 Puesto compartido en mercadillos (B2C)

**La idea.** Muchos productores pequeños no tienen género ni tiempo para un puesto propio. BACO pone **un puesto
en mercados de productores** y vende ahí el producto de varios a la vez. El productor se da a conocer y vende
sin ir; el público encuentra en un sitio producto de toda la Comunidad.

**Si compras** (`/puesto`, `/puesto/reservar/[id]`)
1. Ves los próximos días de mercado con fecha, sitio, horario y los productos que llevaremos (precio, formato y
   cuántos quedan para reservar).
2. Si quieres asegurarte, reservas: eliges cantidad con + y −, ves el total, pones nombre y móvil. **Gratis**.
3. Te llega un código `BACO-1234` por SMS. Lo enseñas en el puesto y **pagas allí** (efectivo o tarjeta).
4. Tu reserva aparece en tu panel y la puedes cancelar.
- El sistema no deja reservar más de lo que queda (comprobación dentro de una transacción) y avisa
  «Solo quedan N para reservar».

**Si eres productor** (`/puesto/vender`)
- Condiciones a la vista, sin letra pequeña: qué pagas, cuándo cobras, qué pasa con lo que no se vende, dónde lo
  dejas, cómo se fija el precio y el requisito (estar en el catálogo M).
- Formulario: día, producto, cuántas unidades y nota. **Calculadora en vivo** de lo que te llevarías si se vende todo.
- No deja apuntarse fuera de plazo ni dos veces el mismo producto el mismo día.
- En su panel ve sus productos apuntados (en revisión / aceptado), lo vendido en mercados anteriores y lo que
  cobra ya descontada la comisión.

**El equipo** (panel del equipo) acepta o rechaza solicitudes, ve por día qué se lleva, cuántas reservas hay,
marca reservas como recogidas o canceladas y anota las unidades vendidas para pagar a cada productor.

**Datos de demo** (se dice en pantalla): comisión del 15 %, entrega el día antes de 17:00 a 19:00, devolución de lo
no vendido, pago en 7 días, precios por formato. **Reales**: los mercados, su sitio y su regla de fechas.

**Código.** `app/puesto/`, `components/stall.tsx`, `components/forms-extra.tsx` (`ReserveForm`, `StallSlotForm`),
acciones `reserveStall`, `cancelReservation`, `requestStallSlot`, `teamDecideSlot`, `teamRecordSold`,
`teamMarkReservation`; tablas `stall_days`, `stall_slots`, `stall_reservations`.

### 4.5 Agenda en persona

- **Mercados reales** con fecha calculada por su regla publicada:
  Día de Mercado de la Cámara Agraria (1.er sábado, Casa de Campo), Mercado de Productores Planetario
  (1.er y 3.er domingo, salvo julio y agosto), Alcobendas (2.º domingo) y Valdebebas (4.º domingo).
- **Ferias reales**: Madrid Top Wine, BioCultura, Madrid Fusión, HIP, Salón Gourmets, Jornadas de Pastoreo de
  Colmenar Viejo, La Despensa de Madrid y Feria de la Sierra Norte (las que no tienen fecha cerrada lo dicen).
- **Actividades de BACO** (de ejemplo y marcadas): «Te hacemos tu página en 15 minutos» en el Día de Mercado,
  encuentro productor–chef, ruta de cocineros por la Sierra Norte, taller en Torrelaguna, presentación del piloto.
- Filtros «¿Para quién?» y «¿Qué?»; los dos primeros meses abiertos y el resto plegado.
- En cada actividad de BACO: **inscripción** con nombre y móvil, plazas que quedan, aviso de completo y archivo
  de calendario. En las de otros organizadores se enlaza a su web.
- **Código.** `app/agenda/`, `components/agenda-item.tsx`, `lib/db/demo-extras.ts` (reglas y fuentes), tablas
  `agenda` y `agenda_signups`.

### 4.6 Alta asistida (el equipo hace la página)

1. El equipo, en su panel, rellena la página de un productor del catálogo mientras habla con él (en el mercado o
   por teléfono): persona de contacto, móvil, dónde le conocimos, qué hace, qué ofrece, web. Exige marcar que el
   productor ha dado permiso.
2. «Preparar y enviar por WhatsApp» le manda un enlace a `/revisar/…`.
3. El productor ve cómo quedaría su página y pulsa **«Está bien, publicar»** o escribe qué cambiar.
4. Al publicar, sus datos pasan a su página y queda marcada como verificada. Si pide cambios, el equipo lo ve.
- **Código.** `teamCreateOnboarding`, `teamSendOnboarding`, `reviewOnboarding`, `app/revisar/`, tabla `onboardings`.

### 4.7 Distintivo para restaurantes

- Voluntario y gratuito: «Cocina con producto de Madrid». El restaurante lo pide desde su panel; se concede si ha
  cerrado al menos 2 pedidos o muestras con productores de BACO (el panel le dice cuántos lleva).
- El equipo lo concede; el restaurante sale en `/restaurantes` con sus proveedores y puede **imprimir su cartel
  con QR**.
- **Código.** `BadgeCard` en `components/panel-parts.tsx`, `requestBadge`, `teamGrantBadge`, `app/restaurantes/`.

### 4.8 Carteles con QR

- Productor y restaurante tienen un cartel A4 listo para imprimir o guardar en PDF, con un QR que abre su página.
  Al imprimir se ocultan cabecera, pie y botón de ayuda.
- **Código.** `lib/site.ts` (QR en SVG con la librería `qrcode`), `components/poster.tsx`, páginas `cartel`.

### 4.9 Piloto Sierra Norte

- Página de una comarca concreta (Braojos, Buitrago del Lozoya, Lozoyuela, Rascafría, Torrelaguna) con sus
  productores del catálogo, las citas de la agenda allí y cómo unirse. Cita el estudio de viabilidad del nodo
  logístico de la Sierra Norte (Germinando, 2024).
- **Por qué.** Empezar por una zona concentra oferta y demanda y abarata cada reparto.

### 4.10 Paneles

| Perfil | Qué ve |
| --- | --- |
| **Productor** | Mensajes de restaurantes (con botones **WhatsApp** y **Llamar** además de contestar por escrito), su página, cifras, el puesto compartido, sus avisos, enlace a su cartel |
| **Hostelero** | Sus peticiones y respuestas, distintivo, favoritos, actividades a las que va, avisos |
| **Consumidor** | Sus reservas en el puesto (con código y cancelar), favoritos, actividades, lo más buscado, avisos |
| **Equipo BACO** | Resumen con cifras y, por urgencia: llamadas pendientes, altas asistidas, puesto (solicitudes y detalle por día), personas apuntadas a la agenda y distintivos por revisar |

### 4.11 Portada y navegación

- Cabecera: en escritorio, Buscar · Puesto en mercadillos · Agenda · Restaurantes · Ayuda. En el móvil, «Buscar» a
  mano y un botón **«Menú»** (con la palabra, no solo el icono) con las mismas secciones y las acciones de cuenta.
- Portada más corta en el móvil: se quitan la figura del hub, una foto de origen y las fotos de los sellos, y
  quedan 2 de los «Recién descubiertos». Nueva banda **«Nos vemos en el mercado»** con el próximo día del puesto y las
  tres próximas citas de la agenda.
- Pie con Explora / Ayuda / Legal.

### 4.12 Páginas legales

- `aviso-legal` (LSSI art. 10), `privacidad` (tabla de cada dato, para qué, base legal y plazo; derechos y AEPD),
  `cookies` (solo la cookie técnica de sesión y dos marcas de la ayuda en el navegador; por eso no hay banner) y
  `accesibilidad` (objetivo WCAG 2.2 AA, lo hecho y lo que falta).
- **Los datos del titular (nombre, NIF, domicilio) son de ejemplo** y se avisa en cada página: hay que poner los
  reales antes de abrir al público.

---

## 5. Qué es real y qué es de demostración

| Real | De demostración (marcado en pantalla) |
| --- | --- |
| Productos, empresas, categorías y sellos del catálogo M Producto Certificado (544 productos, 93 empresas) | Ubicación, teléfonos, precios, capacidad, reseñas, actividad y fotos de producto (ilustrativas) |
| Mercados de productores, su sitio y su calendario | Que BACO tenga puesto en ellos, los productos, precios, comisión y reservas |
| Ferias y su organizador | Actividades organizadas por BACO y sus inscritos |
| Contacto oficial de la Comunidad para certificarse | Teléfono, WhatsApp y correo de BACO (salvo que se configuren) |
| Estudio de la Sierra Norte | Datos del titular en las páginas legales |
| | Envío de SMS y WhatsApp (se guardan, no se envían) |

---

## 6. Base de datos

SQLite en `data/baco.db`. Tablas nuevas: `notifications`, `magic_links`, `login_codes`, `agenda`,
`agenda_signups`, `stall_days`, `stall_slots`, `stall_reservations`, `onboardings`, `badges`, `meta`. Cambios:
`profiles` admite el perfil `equipo` y tiene `phone`; `producers` tiene `verified_at`.

- `lib/db/client.ts`: esquema y **migración automática** de bases antiguas.
- `lib/db/demo-extras.ts`: datos de demo de las partes nuevas. Se ejecuta una sola vez por base (marca en `meta`).
- `lib/db/repo.ts`: todas las consultas. Es la única capa que toca la base; para pasar a Supabase basta con
  reescribirla con el mismo contrato.

---

## 7. Cómo se ha verificado

Todo con el servidor de producción (`next build` + `next start`) y un navegador real (Playwright/Chromium).

| Comprobación | Resultado |
| --- | --- |
| TypeScript, ESLint y `next build` | Sin errores ni avisos |
| Accesibilidad con axe-core (WCAG 2.0/2.1/2.2 A y AA + buenas prácticas): 26 rutas (incluida «página no encontrada») × 5 perfiles × móvil (390 px) y escritorio (1440 px) | **0 fallos** en 260 cargas |
| Accesibilidad con el panel de ayuda abierto, una guía en marcha y el menú del móvil abierto | 0 fallos |
| Desbordamiento horizontal a 360, 390 y 1440 px | Ninguno |
| Ayuda: cada ruta × perfil tiene al menos una guía «Para esta página» y el WhatsApp de contacto | 125 de 125 |
| Ayuda: las 19 guías recorridas de principio a fin, comprobando que cada paso señala su elemento | 19 de 19 |
| Recorridos completos (entrar con código, código erróneo, móvil desconocido, reservar, cancelar, apuntarse a vender, duplicado, equipo acepta/anota/marca/concede/llama, alta asistida y publicación por enlace, contestar por enlace, enlace caducado, inscripción, aforo completo, .ics, distintivo, carteles e impresión, menú móvil) | 36 de 36 + casos límite |
| Teclado: primer Tab «Saltar al contenido», orden lógico y foco visible | Correcto |
| Errores de JavaScript en consola durante todas las pruebas | Ninguno |

**Revisión independiente (QA con otro agente, sin ver cómo se hizo).** Encontró 16 puntos; todos corregidos:
redirección abierta con `next` (ahora solo rutas de la web), `/demo/avisos` enseñaba códigos y enlaces de personas
reales (ahora se ocultan salvo cuentas de demo o equipo), código SMS sin límite de intentos (máximo 5 fallos y 3
códigos cada 10 minutos), campos de cantidad que no se podían vaciar, foco perdido tras enviar formularios (ahora va
al mensaje de error o de éxito), inscripciones duplicadas sin cuenta (se comprueba el móvil y el aforo en la misma
transacción), `.ics` sin marcar «[Ejemplo]» y sin hora, texto contradictorio en «Sí, puedo», etiquetas de las guías
que no coincidían con los botones, «1 pasos», cancelación imposible sin cuenta (texto corregido), doble clic del
equipo que repetía avisos (se comprueba el estado previo), distintivo concedible sin cumplir el mínimo, enlace
«Ver los N productos» pequeño y desplegable de días cortado en el móvil. Re-comprobado después: recorridos
completos (35 de 35) y una batería específica de esos fallos (todo correcto).

---

## 8. Límites conocidos y siguientes pasos

**Pendiente de volver a pasar tras las últimas correcciones de QA** (se pasaron antes de ellas con 0 fallos; los
cambios son pequeños, pero no se ha repetido la batería completa):
- axe en las 26 rutas × 5 perfiles × 2 tamaños y desbordamiento a 360 px.
- Recorrido automático de las 19 guías y cobertura «Para esta página».
- Revisión visual en móvil de la portada, el puesto y la agenda después de compactarlos.
- Textos de 12–13 px en etiquetas pequeñas (fechas del calendario, estados): valorar subirlos a 14 px.

Para repetirlo: `npm run build && npm start` y los scripts de Playwright/axe (no incluidos en el repo).


- **Envíos reales.** Conectar WhatsApp Business y un proveedor de SMS en `lib/notify.ts`.
- **Datos del titular** y condiciones reales del puesto (comisión, punto de entrega, pago).
- **Probar con personas reales**: productores y restaurantes con su móvil, y lectores de pantalla (VoiceOver,
  TalkBack, NVDA). axe detecta en torno a la mitad de los problemas de accesibilidad; el resto requiere personas.
- **Pago.** El puesto no cobra online a propósito (se paga en el mercado). Si se quiere señal o prepago, hará falta
  una pasarela.
- **Alojamiento.** SQLite escribe en un fichero local; para una URL pública, Turso o Supabase.
- **Inicio de sesión de demo.** Las cuentas de ejemplo entran sin código; en producción, solo con código.

---

## 9. Fuentes

- Catálogo M Producto Certificado: https://www.comunidad.madrid/info/productos
- Día de Mercado (Cámara Agraria): https://www.esmadrid.com/compras/dia-de-mercado-camara-agraria-de-madrid
- Mercado de Productores Planetario: https://www.esmadrid.com/agenda/mercado-municipal-productores-planetario
- Mercados de Alcobendas y otros: https://www.madridhappypeople.com/ocio-madrid/mercado-de-productores-madrid/
- Mercado de Valdebebas: https://diario.madrid.es/hortaleza/2023/02/09/la-huerta-de-madrid-llega-al-distrito/
- Madrid Top Wine 2026: https://vivirediciones.es/madrid/madrid-top-wine-2026-xxvi-salon-mejores-vinos/
- BioCultura Madrid: https://www.biocultura.org/madrid
- Madrid Fusión: https://www.esmadrid.com/agenda/madrid-fusion-ifema-feria-madrid
- HIP: https://www.expohip.com/en/
- Salón Gourmets 2027: https://www.gourmets.net/descargas/2027/salongourmets/documentacion/40sg-reglamento-regimen-interno.pdf
- La Despensa de Madrid: https://www.comunidad.madrid/node/114204
- Feria de la Sierra Norte: https://madridinforma.es/feria-sierra-norte-2026-en-la-cabrera-talleres-gratis-y-horarios/
- Estudio de viabilidad del nodo logístico Sierra Norte: https://germinando.es/wp-content/uploads/2024/01/Estudio_viabilidad_-nodo_-logistico_SN_VsR.pdf
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Ley 34/2002 (LSSI): https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- Agencia Española de Protección de Datos: https://www.aepd.es
