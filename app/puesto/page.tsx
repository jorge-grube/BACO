import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowRightLine } from "@remixicon/react";
import { DemoNote } from "@/components/phone-message";
import { Shot } from "@/components/shot";
import { DayHeader, StallItemCard } from "@/components/stall";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { slotsForDay, stallDays } from "@/lib/db/repo";
import { STALL_COMMISSION } from "@/lib/db/demo-extras";
import { EDITORIAL, photo } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Puesto de BACO en los mercadillos",
  description: "Producto de pequeños productores de Madrid en un solo puesto compartido. Reserva y recoge en el mercado.",
};

// Venta al consumidor (B2C): BACO pone un puesto en mercados de productores que ya existen y en él
// venden juntos productores que no tienen género o tiempo para un puesto propio.
export default function StallPage() {
  const days = stallDays("proximos");
  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-8 md:px-8 xl:px-12">
      <section className="grid overflow-hidden rounded-lg bg-sage-50 lg:grid-cols-[1.1fr_1fr]">
        <div className="px-6 py-10 md:px-10 md:py-14">
          <p className="label !text-ink">Venta directa · mercadillos de Madrid</p>
          <h1 className="mt-3 max-w-[18ch] text-[34px] leading-[1.05] font-semibold tracking-[-0.04em] md:text-[46px]">El puesto de BACO en tu mercado</h1>
          <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
            Muchos pequeños productores no tienen bastante género para un puesto propio. En el nuestro venden juntos: tú encuentras varios en un solo sitio y ellos se dan a conocer.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <ButtonLink href="#proximos" size="lg">
              Ver qué habrá y reservar
            </ButtonLink>
            <ButtonLink href="/puesto/vender" variant="secondary" size="lg">
              Soy productor: quiero vender aquí
            </ButtonLink>
          </div>
        </div>
        <Shot photo={photo(EDITORIAL.mercado)} sizes="(min-width: 1024px) 45vw, 100vw" className="min-h-[240px]" preload />
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-2" aria-label="Cómo funciona">
        <div className="rounded-[20px] border border-line p-6" data-help="stall-how-buy">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Si vienes a comprar</h2>
          <ol className="mt-4 space-y-3 text-[17px] leading-relaxed">
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">1</span>Mira qué productos habrá cada día.
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">2</span>Si quieres asegurarte, resérvalo: te llega un código por SMS.
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">3</span>Recógelo en el puesto y paga allí, en efectivo o con tarjeta.
            </li>
          </ol>
        </div>
        <div className="rounded-[20px] border border-line p-6" data-help="stall-how-sell">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Si eres productor</h2>
          <ol className="mt-4 space-y-3 text-[17px] leading-relaxed">
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-700 text-sm font-semibold text-white">1</span>Elige el día y cuánto producto llevas.
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-700 text-sm font-semibold text-white">2</span>Lo dejas el día anterior en nuestro punto de recogida.
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-700 text-sm font-semibold text-white">3</span>
              Lo vendemos por ti. Cobras lo vendido menos un {Math.round(STALL_COMMISSION * 100)} % y te devolvemos lo que sobre.
            </li>
          </ol>
          <Link href="/puesto/vender" className="mt-4 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold underline underline-offset-2">
            Condiciones y fechas <RiArrowRightLine className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section id="proximos" className="mt-16 scroll-mt-24">
        <SectionHeader title="Próximos días del puesto" />
        {days.length === 0 && <p className="text-[17px] text-ink-2">Estamos preparando las próximas fechas. Mira la agenda o vuelve pronto.</p>}
        <div className="space-y-14">
          {days.map((d) => {
            const slots = slotsForDay(d.id, "aceptado");
            return (
              <section key={d.id} aria-label={d.market} data-help="stall-day">
                <DayHeader day={d} />
                {slots.length === 0 ? (
                  <p className="mt-4 rounded-md border border-dashed border-line-2 p-5 text-[15px] text-ink-2">Aún estamos eligiendo los productos de este día. Vuelve en unos días.</p>
                ) : (
                  <div className="stagger mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" data-help="stall-products">
                    {slots.map((s) => (
                      <StallItemCard key={s.id} slot={s} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>

      <section className="mt-16 max-w-3xl">
        <SectionHeader title="Preguntas" />
        <div className="divide-y divide-line border-y border-line text-[17px] leading-relaxed">
          {[
            ["¿Tengo que reservar?", "No. Puedes pasarte y comprar lo que quede. Reservar solo asegura que lo tengas."],
            ["¿Cómo pago?", "En el puesto, cuando lo recoges: efectivo o tarjeta. Reservar es gratis."],
            ["¿Y si al final no puedo ir?", "Cancela la reserva desde tu panel o escríbenos por WhatsApp. Así lo puede comprar otra persona."],
            ["¿Por qué un puesto compartido?", "Porque a muchos pequeños productores no les compensa un puesto propio. Juntos llenan uno, se dan a conocer y venden sin perder un día entero."],
          ].map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-ink-3 transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-4 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6">
          <DemoNote>las fechas son las de mercados reales, pero la presencia de BACO, los productos, los precios y la comisión son de ejemplo.</DemoNote>
        </div>
      </section>
    </div>
  );
}
