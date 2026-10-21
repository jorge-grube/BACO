import type { Metadata } from "next";
import { RiArrowDownSLine, RiPlayCircleLine } from "@remixicon/react";
import { ContactChannels, StartGuideButton } from "@/components/help/help-center";
import { LabelBadge } from "@/components/ui";
import { CONTACT } from "@/lib/contact";
import { currentProfile } from "@/lib/session";
import { buildGuides } from "@/lib/help/guides";
import { demoTargets } from "@/lib/help/demo";

export const metadata: Metadata = { title: "Ayuda" };

// Preguntas frecuentes en lenguaje llano: respuesta corta primero, detalle después.
const FAQ: { q: string; a: React.ReactNode; id?: string }[] = [
  {
    q: "¿Qué es BACO?",
    a: (
      <p>
        Un buscador que te pone en contacto con quien hace alimentos en la Comunidad de Madrid. Todos los productos tienen el sello
        «M Producto Certificado», la marca de garantía de los alimentos de Madrid.
      </p>
    ),
  },
  {
    q: "¿Tengo que pagar algo?",
    a: (
      <p>
        No. Buscar, ver las fichas y pedir muestras es gratis. Para los productores, tener la ficha y recibir mensajes también es gratis.
        Más adelante habrá opciones de pago para salir destacado, y siempre se verá la etiqueta «Patrocinado».
      </p>
    ),
  },
  {
    q: "¿Qué significan los sellos de calidad?",
    a: (
      <ul className="space-y-3">
        <li>
          <LabelBadge code="DOP_VINOS_MADRID" /> <strong>DOP</strong> (Denominación de Origen Protegida): todo el producto se hace en una zona
          concreta y lo vigila un consejo regulador. En Madrid hay DOP de vino y de aceite.
        </li>
        <li>
          <LabelBadge code="IGP_CARNE_GUADARRAMA" /> <strong>IGP</strong> (Indicación Geográfica Protegida): parecida, pero basta con que una
          parte del proceso se haga en la zona. Es el caso de la carne de la Sierra de Guadarrama.
        </li>
        <li>
          <LabelBadge code="DC_ACEITUNAS_CAMPO_REAL" /> <strong>DC</strong> (Denominación de Calidad): sello de la Comunidad de Madrid para las
          aceitunas de Campo Real.
        </li>
        <li>
          <LabelBadge code="ECO" /> <strong>Ecológico</strong>: producción ecológica certificada, sin abonos ni pesticidas químicos de síntesis.
        </li>
      </ul>
    ),
  },
  {
    q: "Soy productor. ¿Cómo salgo en BACO?",
    a: (
      <p>
        Si tu empresa está en el catálogo M Producto Certificado, ya tienes ficha: la hemos creado con tus productos. Pide que te llamemos
        o ven a vernos a un mercado: el equipo te prepara la página y te la manda por WhatsApp para que la revises. No tienes que tener
        página web ni rellenar nada.
      </p>
    ),
  },
  {
    q: "¿Qué pasa cuando pido una muestra?",
    a: (
      <p>
        El mensaje le llega al productor a su panel de BACO. Si el productor todavía no usa BACO, el equipo de BACO le llama y se lo cuenta. Si ya lo usa, además le avisamos por WhatsApp.
        Cuando conteste, verás la respuesta en «Mi panel».
      </p>
    ),
  },
  {
    id: "entrar",
    q: "¿Cómo entro? No tengo contraseña",
    a: (
      <p>
        No hace falta contraseña. En «Entrar» escribe tu móvil y te mandamos un código de 6 números por SMS. Lo escribes y ya estás dentro.
        Si no te llega en un minuto, pulsa «Ayuda» y te llamamos.
      </p>
    ),
  },
  {
    id: "puesto",
    q: "¿Qué es el puesto compartido en los mercadillos?",
    a: (
      <>
        <p>
          BACO pone un puesto en mercados de productores de Madrid y vende ahí productos de varios productores a la vez. Así no necesitas tener
          tu propio puesto ni ir tú ese día.
        </p>
        <p className="mt-2">
          <strong>Si compras:</strong> puedes apartar producto gratis desde la web y pagarlo al recogerlo en el mercado.{" "}
          <strong>Si produces:</strong> nos dejas el producto el día antes, lo vendemos por ti, te devolvemos lo que sobre y te pagamos en 7
          días. Nos quedamos un 15 % de lo vendido (condiciones de ejemplo).
        </p>
        <p className="mt-2">
          <a href="/puesto" className="font-semibold text-ink underline underline-offset-2">
            Ver el puesto
          </a>
        </p>
      </>
    ),
  },
  {
    id: "agenda",
    q: "¿Qué hay en la agenda?",
    a: (
      <p>
        Mercados de productores con fechas reales, ferias del sector y actividades de BACO: altas asistidas en los mercados, encuentros entre
        productores y cocineros, rutas y talleres. Te puedes apuntar y añadirlo a tu calendario. Las actividades de BACO son de ejemplo.
      </p>
    ),
  },
  {
    id: "distintivo",
    q: "Tengo un restaurante. ¿Qué es el distintivo?",
    a: (
      <p>
        Un cartel voluntario y gratuito, «Cocina con producto de Madrid», para restaurantes que compran a productores de BACO. Lo pides desde tu
        panel y, cuando lo tienes, sales en la página de restaurantes y puedes imprimir un cartel con QR.
      </p>
    ),
  },
  {
    id: "whatsapp",
    q: "Me ha llegado un WhatsApp de BACO, ¿es de fiar?",
    a: (
      <p>
        Te escribimos para avisarte de que alguien te ha escrito, de una reserva o para que revises tu página. El enlace siempre empieza por la
        dirección de BACO y nunca te pedimos contraseñas ni datos del banco. Si dudas, llámanos.
      </p>
    ),
  },
  {
    q: "No encuentro lo que busco",
    a: (
      <p>
        Prueba con menos palabras («queso de cabra») o quita lo que hemos entendido pulsando la x de cada etiqueta. También puedes ampliar
        la zona. Si aun así no aparece, llámanos: puede que el productor exista y aún no esté en el catálogo.
      </p>
    ),
  },
  {
    q: "¿Los datos son reales?",
    a: (
      <p>
        Los productos, las empresas y los sellos salen del catálogo oficial de la Comunidad de Madrid. En este prototipo, la ubicación, los
        precios, las reseñas y las fotos son de ejemplo, y lo indicamos donde aparecen.
      </p>
    ),
  },
  {
    id: "privacidad",
    q: "¿Quién ve mis datos?",
    a: (
      <>
        <p>
          Tu mensaje solo lo ve el productor al que escribes. Si pides que te llamemos, guardamos tu nombre y tu teléfono solo para
          devolverte la llamada y los borramos después. No los vendemos ni los usamos para publicidad.
        </p>
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-[15px] sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-ink">Responsable</dt>
          <dd>BACO. Razón social y NIF de ejemplo en este prototipo.</dd>
          <dt className="font-semibold text-ink">Para qué</dt>
          <dd>Atender tu consulta o devolverte la llamada en la franja que elijas.</dd>
          <dt className="font-semibold text-ink">Base legal</dt>
          <dd>Tu consentimiento, que puedes retirar cuando quieras.</dd>
          <dt className="font-semibold text-ink">Quién más los ve</dt>
          <dd>Nadie, salvo obligación legal y los proveedores técnicos (alojamiento y, si nos escribes, WhatsApp).</dd>
          <dt className="font-semibold text-ink">Tus derechos</dt>
          <dd>Acceder, corregir o borrar tus datos escribiendo al correo de ayuda.</dd>
        </dl>
        <p className="mt-2">
          Todo el detalle en{" "}
          <a href="/privacidad" className="font-semibold text-ink underline underline-offset-2">
            Privacidad
          </a>
          .
        </p>
      </>
    ),
  },
];

export default async function HelpPage() {
  const profile = await currentProfile();
  const who = profile?.role ?? "visitante";
  const guides = buildGuides(demoTargets()).filter((g) => g.roles.includes(who));
  const contact = {
    isDemo: CONTACT.isDemo,
    phoneDisplay: CONTACT.phoneDisplay,
    phoneHref: CONTACT.phoneHref,
    whatsappNumber: CONTACT.whatsappNumber,
    email: CONTACT.email,
    hours: CONTACT.hours,
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-10 md:px-8">
      <p className="label">Ayuda</p>
      <h1 className="mt-3 max-w-[20ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] md:text-[44px]">
        Te ayudamos a usar BACO, paso a paso
      </h1>
      <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">
        Elige qué quieres hacer y te lo enseñamos en la pantalla. Si prefieres, habla con una persona.
      </p>

      <section id="guias" className="mt-10 scroll-mt-24" data-help="help-guides">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Guías paso a paso</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <StartGuideButton
              key={g.id}
              id={g.id}
              className="group flex items-start gap-4 rounded-[16px] border border-line p-5 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-pop"
            >
              <RiPlayCircleLine className="size-8 shrink-0 text-sage-700" aria-hidden />
              <span>
                <span className="block text-[17px] font-semibold">{g.title}</span>
                <span className="mt-1 block text-[15px] leading-snug text-ink-2">{g.summary}</span>
                <span className="mt-2 block text-sm font-semibold text-sage-700">Empezar · {g.steps.length} {g.steps.length === 1 ? "paso" : "pasos"}</span>
              </span>
            </StartGuideButton>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Preguntas frecuentes</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} id={f.id} className="group scroll-mt-24">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <RiArrowDownSLine className="size-6 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="pb-5 text-base leading-relaxed text-ink-2">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[20px] border border-line p-6" data-help="help-contact">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Habla con una persona</h2>
            <p className="mt-1 text-[15px] text-ink-2">{contact.hours}.</p>
            <ContactChannels contact={contact} pathname="/ayuda" />
          </div>
          <div className="mt-4 rounded-[20px] bg-paper-2 p-6 text-[15px] leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">¿Quieres certificar tu producto con «M Producto Certificado»?</p>
            <p className="mt-1">
              Lo tramita la Comunidad de Madrid, no BACO. Contacto oficial de la Dirección General de Agricultura, Ganadería y Alimentación:
            </p>
            <p className="mt-2">
              <a href="mailto:mproducto.certificado@madrid.org" className="font-semibold text-ink underline underline-offset-2">
                mproducto.certificado@madrid.org
              </a>
              <br />
              <a href="tel:+34914383204" className="font-semibold text-ink underline underline-offset-2">
                91 438 32 04
              </a>
              {" · "}
              <a
                href="https://sede.comunidad.madrid/autorizaciones-licencias-permisos-carnes/autorizacion-marca-garantia"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-ink underline underline-offset-2"
              >
                Ver el trámite
              </a>
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
