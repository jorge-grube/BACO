import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowLeftSLine } from "@remixicon/react";
import { StallSlotForm } from "@/components/forms-extra";
import { DemoNote } from "@/components/phone-message";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { producerOwnedBy, productsByProducer, stallDays } from "@/lib/db/repo";
import { STALL_COMMISSION, stallFormat, todayISO } from "@/lib/db/demo-extras";
import { longDate, shortDate, cap } from "@/lib/format";
import { currentProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Vender en el puesto de BACO" };

export default async function SellPage() {
  const profile = await currentProfile();
  const producer = profile?.role === "productor" ? producerOwnedBy(profile.id) : undefined;
  const today = todayISO();
  const days = stallDays("proximos");
  const open = days.filter((d) => d.deadline >= today);
  const products = producer ? productsByProducer(producer.id) : [];
  const pct = Math.round(STALL_COMMISSION * 100);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 md:px-8">
      <Link href="/puesto" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
        <RiArrowLeftSLine className="size-5" aria-hidden /> Volver al puesto
      </Link>
      <h1 className="mt-2 max-w-[22ch] text-[32px] leading-tight font-semibold tracking-[-0.035em]">Vende en el puesto de BACO sin montar el tuyo</h1>
      <p className="mt-3 max-w-[56ch] text-[17px] leading-relaxed text-ink-2">
        Traes lo que tengas, aunque sea poco. Nosotros ponemos el puesto, la persona que vende y el datáfono. Tú te das a conocer y vendes sin perder el día.
      </p>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="condiciones" data-help="sell-conditions">
          <h2 id="condiciones" className="text-xl font-semibold tracking-[-0.02em]">
            Cómo funciona
          </h2>
          <dl className="mt-4 divide-y divide-line border-y border-line text-[17px] leading-relaxed">
            {[
              ["Qué pagas", `Nada por adelantado. Nos quedamos un ${pct} % de lo que se vende.`],
              ["Cuándo cobras", "En 7 días, por transferencia, con el detalle de lo vendido."],
              ["Lo que no se vende", "Te lo devolvemos al día siguiente, o lo recoges en el punto."],
              ["Dónde lo dejas", "El día anterior al mercado, de 17:00 a 19:00, en nuestro punto de recogida."],
              ["Precio", "Lo fijamos contigo. Te proponemos uno según el formato (cuña, botella, tarro…)."],
              ["Requisito", "Ser productor del catálogo M Producto Certificado y tener tu página en BACO."],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <dt className="font-semibold">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <DemoNote>la comisión, los plazos de cobro y la dirección del punto de recogida son de ejemplo.</DemoNote>
          </div>

          <h2 className="mt-10 text-xl font-semibold tracking-[-0.02em]">Próximas fechas</h2>
          <ul className="mt-3 divide-y divide-line rounded-md border border-line text-[15px]">
            {days.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 p-4">
                <span>
                  <span className="font-semibold">{cap(longDate(d.date))}</span> · {d.market}
                </span>
                <span className={d.deadline >= today ? "text-ink-2" : "text-ink-3"}>{d.deadline >= today ? `Apúntate hasta el ${shortDate(d.deadline)}` : "Plazo cerrado"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[20px] border border-line p-6" data-help="sell-form">
          <SectionHeader title="Apuntarme" />
          {!profile ? (
            <div className="space-y-3 text-[17px]">
              <p className="text-ink-2">Entra con tu móvil para elegir día y productos. Si prefieres, te llamamos y lo hacemos contigo.</p>
              <ButtonLink href="/entrar?rol=productor&next=/puesto/vender" size="lg" className="w-full">
                Entrar como productor
              </ButtonLink>
              <ButtonLink href="/ayuda" variant="secondary" size="lg" className="w-full">
                Que me llamen
              </ButtonLink>
            </div>
          ) : !producer ? (
            <p className="text-[17px] text-ink-2">El puesto es para productores. Si quieres comprar, mira los <Link href="/puesto#proximos" className="font-semibold text-ink underline underline-offset-2">próximos días</Link>.</p>
          ) : open.length === 0 ? (
            <p className="text-[17px] text-ink-2">Ahora mismo no hay fechas abiertas. Te avisaremos por WhatsApp cuando haya nuevas.</p>
          ) : (
            <StallSlotForm
              days={open.map((d) => ({ id: d.id, label: `${shortDate(d.date)} · ${d.market.replace(/^Mercado de Productores (de )?/, "").replace(/ «.*»$/, "")}`, deadline: d.deadline }))}
              products={products.map((p) => {
                const f = stallFormat(p.category, p.price_hint);
                return { id: p.id, name: p.name, format: f.label, price: f.price };
              })}
            />
          )}
        </section>
      </div>
    </div>
  );
}
