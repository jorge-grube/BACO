import type { Role } from "@/lib/domain";
import { EXAMPLES } from "@/lib/examples";

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

export function buildGuides(demoProductId: number): Guide[] {
  const example = `/buscar?q=${encodeURIComponent(EXAMPLES[0])}`;
  const product = `/producto/${demoProductId}`;
  return [
    {
      id: "buscar",
      title: "Buscar un producto",
      summary: "Escribe lo que necesitas y te decimos quién lo hace en Madrid.",
      roles: ["visitante", "hostelero", "consumidor"],
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
      roles: ["visitante", "hostelero"],
      pages: ["/producto"],
      steps: [
        {
          path: "/producto",
          href: product,
          target: "product-title",
          title: "La ficha del producto",
          text: "Aquí ves quién lo hace, en qué pueblo está y qué opinan otros restaurantes.",
        },
        {
          path: "/producto",
          target: "request",
          title: "El recuadro para escribirle",
          text: "Desde aquí le escribes al productor. Si todavía no has entrado, pulsa el botón negro: no hace falta contraseña.",
        },
        {
          path: "/producto",
          target: "request-type",
          optional: true,
          title: "Elige qué quieres",
          text: "Muestra para probarlo, precio si quieres comprar, o pregunta si solo tienes una duda.",
        },
        {
          path: "/producto",
          target: "request-message",
          optional: true,
          title: "El mensaje ya está escrito",
          text: "Te dejamos un mensaje preparado. Puedes cambiarlo o enviarlo tal cual.",
        },
        {
          path: "/producto",
          target: "request",
          title: "Envíalo",
          text: "Pulsa el botón negro. El productor lo recibe en su panel y, cuando conteste, lo verás en «Mi panel».",
        },
      ],
    },
    {
      id: "productor",
      title: "Soy productor: responder a un restaurante",
      summary: "Dónde llegan los mensajes y cómo se contestan.",
      roles: ["visitante", "productor"],
      pages: ["/panel", "/entrar", "/productor"],
      steps: [
        {
          path: "/entrar",
          href: "/entrar?rol=productor",
          target: "role-productor",
          title: "Entra como productor",
          text: "Pulsa tu cuenta. En la versión final, el equipo de Aplus te llama para comprobar que la empresa es tuya: no tienes que rellenar nada complicado.",
        },
        {
          path: "/panel",
          href: "/panel",
          role: "productor",
          target: "inbox",
          title: "Tus mensajes",
          text: "Aquí llegan las peticiones de restaurantes y tiendas. Las nuevas salen arriba y con un número en tu nombre, arriba a la derecha.",
        },
        {
          path: "/panel",
          role: "productor",
          target: "reply",
          optional: true,
          title: "Contesta",
          text: "Escribe la respuesta (precio, cuándo llevas la muestra…) y pulsa «Enviar respuesta». El restaurante la verá en su panel.",
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
      id: "favoritos",
      title: "Guardar y valorar productos",
      summary: "Guarda lo que te gusta y cuenta qué tal te fue.",
      roles: ["visitante", "hostelero", "consumidor"],
      pages: ["/producto"],
      steps: [
        {
          path: "/producto",
          href: product,
          target: "favorite",
          optional: true,
          title: "Guardar en favoritos",
          text: "Pulsa «Guardar» para tener el producto a mano. Lo encontrarás después en «Mi panel».",
        },
        {
          path: "/producto",
          target: "reviews",
          title: "Opiniones",
          text: "Aquí lees lo que dicen otros. Si has entrado con tu cuenta, puedes dar tu nota del 1 al 5.",
        },
      ],
    },
  ];
}
