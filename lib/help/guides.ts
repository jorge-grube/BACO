import type { Role } from "@/lib/domain";
import { EXAMPLES } from "@/lib/examples";
import type { DemoTargets } from "@/lib/help/demo";

// Guías paso a paso. Cada paso señala un elemento de la página marcado con data-help="…".
// Si el paso vive en otra página, `href` dice adónde ir y `path` cómo reconocerla.
// Los textos van en lenguaje llano: frases cortas, en segunda persona, sin siglas sin explicar.

export type GuideStep = {
  target?: string;
  path: string; // prefijo de ruta donde está el paso
  href?: string; // adónde llevar al usuario si no está en `path`
  title: string;
  text: string;
  optional?: boolean; // si el elemento no está (p. ej. sin sesión), se salta
  role?: Role; // el paso necesita entrar con este perfil
};

export type Guide = {
  id: string;
  title: string;
  summary: string;
  roles: (Role | "visitante")[];
  pages: string[]; // páginas donde se recomienda
  steps: GuideStep[];
};

const ALL: Guide["roles"] = ["visitante", "hostelero", "consumidor", "productor", "equipo"];
const LEGAL = ["/aviso-legal", "/privacidad", "/cookies", "/accesibilidad"];

export function buildGuides(d: DemoTargets): Guide[] {
  const example = `/buscar?q=${encodeURIComponent(EXAMPLES[0])}`;
  const product = `/producto/${d.productId}`;
  const producer = d.producerId ? `/productor/${d.producerId}` : "/buscar";
  const reserve = d.slotId ? `/puesto/reservar/${d.slotId}` : "/puesto";
  const event = d.agendaId ? `/agenda/${d.agendaId}` : "/agenda";
  return [
    {
      id: "buscar",
      title: "Buscar un producto",
      summary: "Escribe lo que necesitas y te decimos quién lo hace en Madrid.",
      roles: ALL,
      pages: ["/", "/buscar"],
      steps: [
        {
          path: "/",
          href: "/",
          target: "search",
          title: "Escribe lo que buscas",
          text: "Escríbelo como se lo dirías a tu proveedor. Por ejemplo: «queso curado de oveja para tapas, 20 kilos al mes, cerca de Alcalá». No hace falta escribirlo perfecto.",
        },
        {
          path: "/",
          target: "examples",
          title: "O pulsa un ejemplo",
          text: "Si no sabes por dónde empezar, pulsa una de estas frases y verás cómo funciona.",
        },
        {
          path: "/buscar",
          href: example,
          target: "chips",
          title: "Esto es lo que hemos entendido",
          text: "Si algo no es lo que querías, pulsa encima para quitarlo. La lista se actualiza sola.",
        },
        {
          path: "/buscar",
          target: "results",
          title: "Los productos que encajan",
          text: "Salen ordenados: primero los que mejor encajan. Pulsa en una foto para ver todos los datos del producto.",
        },
        {
          path: "/buscar",
          target: "filters",
          title: "Afinar la búsqueda",
          text: "Aquí puedes elegir el tipo de producto, un sello de calidad o una zona. En el móvil está debajo de los resultados.",
        },
      ],
    },
    {
      id: "muestra",
      title: "Pedir una muestra",
      summary: "Escríbele al productor desde la ficha. Es gratis.",
      roles: ["visitante", "hostelero", "equipo"],
      pages: ["/producto/"],
      steps: [
        {
          path: "/producto/",
          href: product,
          target: "product-title",
          title: "La ficha del producto",
          text: "Aquí tienes quién lo hace, dónde y con qué sellos. Los datos marcados como «ejemplo» todavía no son reales.",
        },
        {
          path: "/producto/",
          target: "request",
          title: "Escríbele al productor",
          text: "Desde este recuadro le pides una muestra, precio o le haces una pregunta. No pagas nada.",
        },
        {
          path: "/producto/",
          target: "request-type",
          optional: true,
          title: "Elige qué quieres",
          text: "Pulsa «Muestra» si quieres probarlo, «Precio» si ya quieres comprar o «Pregunta» si tienes una duda.",
        },
        {
          path: "/producto/",
          target: "request-message",
          optional: true,
          title: "Cuéntale lo que necesitas",
          text: "Ya te hemos escrito un mensaje de ejemplo. Cámbialo si quieres: cuánto necesitas, cada cuánto, para qué plato…",
        },
        {
          path: "/producto/",
          target: "request",
          title: "Envía y espera la respuesta",
          text: "Pulsa «Pedir muestra» (o el botón que corresponda). Al productor le avisamos por WhatsApp y tú verás su respuesta en «Mi panel».",
        },
      ],
    },
    {
      id: "favoritos",
      title: "Guardar y valorar productos",
      summary: "Guarda lo que te gusta y cuenta qué tal te fue.",
      roles: ALL,
      pages: ["/producto/"],
      steps: [
        {
          path: "/producto/",
          href: product,
          target: "favorite",
          optional: true,
          title: "Guardar en favoritos",
          text: "Pulsa «Guardar» para tener el producto a mano. Lo encontrarás después en «Mi panel».",
        },
        {
          path: "/producto/",
          target: "reviews",
          title: "Opiniones",
          text: "Aquí lees lo que dicen otros. Si has entrado con tu cuenta, puedes dar tu nota del 1 al 5.",
        },
      ],
    },
    {
      id: "pagina-productor",
      title: "La página de un productor",
      summary: "Quién es, dónde está y todo lo que hace.",
      roles: ALL,
      pages: ["/productor/"],
      steps: [
        {
          path: "/productor/",
          href: producer,
          target: "producer-header",
          title: "Quién es",
          text: "El nombre, el pueblo, sus sellos y cómo contactar. Si pone «Ficha gestionada por el productor», es él quien la mantiene al día.",
        },
        {
          path: "/productor/",
          target: "producer-products",
          title: "Sus productos",
          text: "Pulsa en cualquiera para ver la ficha completa y escribirle desde allí.",
        },
      ],
    },
    {
      id: "entrar",
      title: "Entrar con el móvil",
      summary: "Sin contraseña: te mandamos un código por SMS.",
      roles: ALL,
      pages: ["/entrar"],
      steps: [
        {
          path: "/entrar",
          href: "/entrar",
          target: "login-phone",
          optional: true,
          title: "Escribe tu móvil",
          text: "Pon tu número de móvil y pulsa «Enviarme el código». Para probar, puedes pulsar una de las cuentas de ejemplo de abajo.",
        },
        {
          path: "/entrar/codigo",
          href: "/entrar/codigo?tel=600000001",
          target: "login-code",
          title: "Escribe el código",
          text: "Te llega un SMS con 6 números. Escríbelos aquí (en muchos móviles se rellena solo) y pulsa «Entrar». En la demo no se manda SMS: el código sale en la pantalla después de pedirlo.",
        },
      ],
    },
    {
      id: "productor",
      title: "Soy productor: contestar a un restaurante",
      summary: "Dónde llegan los mensajes y cómo se contestan.",
      roles: ["visitante", "productor"],
      pages: ["/panel", "/entrar", "/productor/"],
      steps: [
        {
          path: "/entrar",
          href: "/entrar?rol=productor",
          target: "role-productor",
          title: "Entra como productor",
          text: "Pulsa la cuenta de ejemplo. En la versión final entras con tu móvil y un código por SMS: no tienes que recordar ninguna contraseña.",
        },
        {
          path: "/panel",
          href: "/panel",
          role: "productor",
          target: "inbox",
          title: "Tus mensajes",
          text: "Aquí llegan las peticiones de restaurantes y tiendas. Las nuevas salen arriba. Además te avisamos por WhatsApp.",
        },
        {
          path: "/panel",
          role: "productor",
          target: "reply-phone",
          optional: true,
          title: "Contesta por WhatsApp o llama",
          text: "Si te resulta más fácil, pulsa «Contestar por WhatsApp» o «Llamar» y habla directamente con el restaurante.",
        },
        {
          path: "/panel",
          role: "productor",
          target: "reply",
          optional: true,
          title: "O contesta aquí",
          text: "Escribe la respuesta (precio, cuándo llevas la muestra…) y pulsa «Enviar respuesta». Al restaurante le avisamos.",
        },
        {
          path: "/panel",
          role: "productor",
          target: "ficha",
          title: "Tus datos",
          text: "Aquí cambias tu teléfono, tu web y lo que ofreces a restaurantes. Pulsa «Guardar cambios» al terminar.",
        },
      ],
    },
    {
      id: "responder-whatsapp",
      title: "Contestar desde el WhatsApp",
      summary: "Para productores: contesta sin entrar en BACO.",
      roles: ALL,
      pages: ["/r/", "/demo/avisos"],
      steps: [
        {
          path: "/r/",
          href: d.respondHref,
          target: "respond-request",
          title: "Lo que te piden",
          text: "Al pulsar el enlace del WhatsApp llegas aquí. Ves quién te escribe, qué producto y cuánto necesita.",
        },
        {
          path: "/r/",
          target: "respond-buttons",
          title: "Contesta con un botón",
          text: "Pulsa «Sí, puedo» o «No puedo esta vez». Si prefieres, pulsa «Prefiero escribir la respuesta». No hace falta entrar ni contraseña.",
        },
      ],
    },
    {
      id: "revisar",
      title: "Revisar la página que te hemos preparado",
      summary: "Para productores dados de alta por el equipo.",
      roles: ALL,
      pages: ["/revisar/", "/demo/avisos"],
      steps: [
        {
          path: "/revisar/",
          href: d.reviewHref,
          target: "review-preview",
          title: "Así quedaría tu página",
          text: "El equipo de BACO la ha preparado con lo que nos contaste. Léela con calma.",
        },
        {
          path: "/revisar/",
          target: "review-buttons",
          title: "Publícala o pide cambios",
          text: "Si está bien, pulsa «Está bien, publicar». Si algo no te gusta, escribe qué cambiar y te llamamos.",
        },
      ],
    },
    {
      id: "puesto-comprar",
      title: "Reservar en el puesto del mercado",
      summary: "Aparta producto y recógelo en el mercadillo. Pagas allí.",
      roles: ALL,
      pages: ["/", "/puesto"],
      steps: [
        {
          path: "/puesto",
          href: "/puesto",
          target: "stall-how-buy",
          title: "Cómo funciona",
          text: "BACO pone un puesto en mercados de productores con productos de varios productores. Puedes ir sin más o apartar lo que quieras.",
        },
        {
          path: "/puesto",
          target: "stall-day",
          title: "Elige el día",
          text: "Cada bloque es un día de mercado: fecha, lugar y horario. Debajo, lo que llevaremos.",
        },
        {
          path: "/puesto",
          target: "stall-products",
          title: "Elige el producto",
          text: "Pulsa «Reservar» en el que quieras. Verás cuántas unidades quedan.",
        },
        {
          path: "/puesto/reservar",
          href: reserve,
          target: "reserve-form",
          title: "Di cuántas y tus datos",
          text: "Elige la cantidad con + y −, pon tu nombre y tu móvil y pulsa «Reservar para recoger». Te mandamos un código por SMS para recogerlo. Es gratis y pagas en el puesto.",
        },
      ],
    },
    {
      id: "puesto-vender",
      title: "Vender en el puesto compartido",
      summary: "Para productores: vendemos tu producto por ti en el mercado.",
      roles: ALL,
      pages: ["/puesto", "/panel"],
      steps: [
        {
          path: "/puesto",
          href: "/puesto",
          target: "stall-how-sell",
          title: "La idea",
          text: "No necesitas tener puesto propio ni ir tú. Nos dejas el producto el día antes y lo vendemos junto al de otros productores.",
        },
        {
          path: "/puesto/vender",
          href: "/puesto/vender",
          target: "sell-conditions",
          title: "Las condiciones",
          text: "Qué pagas, cuándo cobras y qué pasa con lo que no se vende. Todo por escrito, sin letra pequeña.",
        },
        {
          path: "/puesto/vender",
          target: "sell-form",
          title: "Apúntate",
          text: "Elige el día, el producto y cuántas unidades. Ves al momento cuánto te llevarías si se vende todo. El equipo te confirma por WhatsApp.",
        },
      ],
    },
    {
      id: "agenda",
      title: "Apuntarse a una actividad",
      summary: "Mercados, ferias, encuentros y talleres cerca de ti.",
      roles: ALL,
      pages: ["/", "/agenda"],
      steps: [
        {
          path: "/agenda",
          href: "/agenda",
          target: "agenda-filters",
          title: "Elige qué te interesa",
          text: "Pulsa para ver solo lo que es para ti (productores, restaurantes o público) o un tipo de actividad.",
        },
        {
          path: "/agenda",
          target: "agenda-list",
          title: "Las próximas fechas",
          text: "Ordenadas por mes. Las que organiza BACO llevan su nombre. Pulsa una para ver los detalles.",
        },
        {
          path: "/agenda/",
          href: event,
          target: "agenda-signup",
          title: "Apúntate",
          text: "Pon tu nombre y tu móvil y pulsa «Apuntarme». También puedes añadirla a tu calendario.",
        },
      ],
    },
    {
      id: "mi-panel",
      title: "Lo que tienes en tu panel",
      summary: "Tus mensajes, reservas, actividades y avisos.",
      roles: ["hostelero", "consumidor"],
      pages: ["/panel"],
      steps: [
        {
          path: "/panel",
          href: "/panel",
          target: "badge",
          optional: true,
          title: "El distintivo para tu local",
          text: "Si compras a productores de BACO, pide aquí el distintivo «Cocina con producto de Madrid». Es gratis.",
        },
        {
          path: "/panel",
          target: "my-reservations",
          optional: true,
          title: "Tus reservas en el puesto",
          text: "Aquí ves qué has apartado, el código para recogerlo y lo que pagarás. Puedes cancelar si no vas a ir.",
        },
        {
          path: "/panel",
          target: "my-signups",
          title: "Actividades a las que vas",
          text: "Las actividades de la agenda a las que te has apuntado.",
        },
        {
          path: "/panel",
          target: "notices",
          title: "Avisos",
          text: "Los WhatsApp y SMS que te hemos mandado, por si borraste alguno.",
        },
      ],
    },
    {
      id: "distintivo",
      title: "El distintivo para restaurantes",
      summary: "Cuenta a tus clientes que cocinas con producto de Madrid.",
      roles: ALL,
      pages: ["/restaurantes"],
      steps: [
        {
          path: "/restaurantes",
          href: "/restaurantes",
          target: "restaurants-list",
          title: "Restaurantes con el distintivo",
          text: "Locales que compran a productores de BACO. Pulsa en uno para ver a quién compra.",
        },
        {
          path: "/restaurantes",
          target: "restaurants-join",
          title: "¿Tienes un restaurante?",
          text: "Pídelo gratis desde tu panel. Lo damos si has cerrado al menos 2 pedidos o muestras con productores de BACO.",
        },
        {
          path: "/panel",
          href: "/panel",
          role: "hostelero",
          target: "badge",
          title: "Pídelo aquí",
          text: "Pulsa «Pedir el distintivo». El equipo lo revisa y te avisa por WhatsApp. Después podrás imprimir tu cartel con QR.",
        },
      ],
    },
    {
      id: "cartel",
      title: "Imprimir tu cartel con QR",
      summary: "Para el puesto, la tienda o el restaurante.",
      roles: ALL,
      pages: ["/*/*/cartel", "/productor/"],
      steps: [
        {
          path: "/*/*/cartel",
          href: d.producerId ? `/productor/${d.producerId}/cartel` : "/ayuda",
          target: "poster",
          title: "Tu cartel",
          text: "Quien escanee el código con la cámara del móvil llega directamente a tu página de BACO.",
        },
        {
          path: "/*/*/cartel",
          target: "poster-print",
          title: "Imprímelo",
          text: "Pulsa aquí. Sale en un folio A4; también puedes guardarlo en PDF y llevarlo a una copistería.",
        },
      ],
    },
    {
      id: "piloto",
      title: "El piloto de la Sierra Norte",
      summary: "Productores y locales de la comarca, en un mismo sitio.",
      roles: ALL,
      pages: ["/piloto"],
      steps: [
        {
          path: "/piloto",
          href: "/piloto/sierra-norte",
          target: "pilot-producers",
          title: "Productores de la comarca",
          text: "Todos los del catálogo que están en la Sierra Norte. Pulsa en uno para ver sus productos.",
        },
        {
          path: "/piloto",
          target: "pilot-events",
          optional: true,
          title: "Citas en la comarca",
          text: "Encuentros y rutas que organizamos allí. Pulsa una para apuntarte.",
        },
        {
          path: "/piloto",
          target: "pilot-join",
          title: "Únete",
          text: "Elige si tienes un local o si produces y te explicamos cómo empezar. Si prefieres, te llamamos.",
        },
      ],
    },
    {
      id: "avisos",
      title: "Los avisos por WhatsApp y SMS",
      summary: "Qué te mandamos y para qué sirve cada enlace.",
      roles: ALL,
      pages: ["/demo/avisos", "/panel"],
      steps: [
        {
          path: "/demo/avisos",
          href: "/demo/avisos",
          target: "demo-notices",
          title: "Así te llegan",
          text: "Cada aviso dice qué ha pasado y trae un enlace. Al pulsarlo vas directo a lo que tienes que hacer, sin entrar ni contraseña. En la demo no se envía nada: se guardan aquí.",
        },
      ],
    },
    {
      id: "equipo",
      title: "Panel del equipo de BACO",
      summary: "Llamadas, altas asistidas, el puesto, la agenda y los distintivos.",
      roles: ["visitante", "equipo"],
      pages: ["/panel", "/entrar"],
      steps: [
        {
          path: "/panel",
          href: "/panel",
          role: "equipo",
          target: "team-calls",
          title: "Llamadas pendientes",
          text: "Quien ha pulsado «Que me llamen». Llama y pulsa «Ya le he llamado» al terminar.",
        },
        {
          path: "/panel",
          role: "equipo",
          target: "team-onboarding",
          title: "Altas asistidas",
          text: "Prepara la página de un productor mientras hablas con él y mándasela por WhatsApp para que la revise y la publique.",
        },
        {
          path: "/panel",
          role: "equipo",
          target: "team-stall",
          title: "El puesto",
          text: "Acepta o rechaza los productos que se apuntan, marca las reservas recogidas y anota lo vendido para pagar a cada productor.",
        },
        {
          path: "/panel",
          role: "equipo",
          target: "team-agenda",
          title: "Inscritos",
          text: "Cuánta gente va a cada actividad de BACO y sus teléfonos para llamarles si hay cambios.",
        },
        {
          path: "/panel",
          role: "equipo",
          target: "team-badges",
          title: "Distintivos",
          text: "Restaurantes que lo han pedido, con cuántos productores trabajan. Concédelo si cumplen.",
        },
      ],
    },
    {
      id: "ayuda",
      title: "Pedir ayuda a una persona",
      summary: "Por WhatsApp, por teléfono, que te llamemos o por correo.",
      roles: ALL,
      pages: ["/ayuda", ...LEGAL],
      steps: [
        {
          path: "/ayuda",
          href: "/ayuda",
          target: "help-contact",
          title: "Elige cómo hablar con nosotros",
          text: "WhatsApp, llamar, que te llamemos (tú eliges cuándo) o correo. Siempre en este orden y siempre en el botón «Ayuda», en cualquier página.",
        },
        {
          path: "/ayuda",
          target: "help-guides",
          title: "O sigue una guía",
          text: "Cada guía te lleva por la pantalla paso a paso. Puedes oír cada paso en voz alta.",
        },
      ],
    },
    {
      id: "legal",
      title: "Tus datos y tus derechos",
      summary: "Qué guardamos, para qué y cómo borrarlo.",
      roles: ALL,
      pages: LEGAL,
      steps: [
        {
          path: "/privacidad",
          href: "/privacidad",
          target: "legal-intro",
          title: "En pocas palabras",
          text: "Pedimos lo mínimo y no vendemos tus datos. Más abajo tienes una tabla con cada dato, para qué es y cuánto tiempo lo guardamos.",
        },
      ],
    },
  ];
}
