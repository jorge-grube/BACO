import type { Metadata } from "next";
import Link from "next/link";
import { RiMapPin2Line, RiShieldCheckLine } from "@remixicon/react";
import { DemoNote } from "@/components/phone-message";
import { ButtonLink } from "@/components/ui";
import { restaurantsWithBadge, suppliersOf } from "@/lib/db/repo";
import { currentProfile } from "@/lib/session";

export const metadata: Metadata = {
  title: "Restaurantes con producto de Madrid",
  description: "Restaurantes y tiendas que compran a productores certificados de la Comunidad de Madrid a través de BACO.",
};

// Distintivo voluntario (la obligación de Tierra de Sabor en 2016 se retiró por el rechazo de la hostelería).
export default async function RestaurantsPage() {
  const list = restaurantsWithBadge();
  const profile = await currentProfile();
  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-10 md:px-8">
      <p className="label">Distintivo voluntario</p>
      <h1 className="mt-2 max-w-[22ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] md:text-[42px]">Dónde probar producto de Madrid</h1>
      <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-2">
        Restaurantes y tiendas que compran a productores certificados de la región a través de BACO. Llevan el distintivo «Cocina con producto de Madrid»: lo
        concedemos cuando han cerrado al menos 2 pedidos o muestras con productores.
      </p>

      <ul className="stagger mt-10 grid gap-4 md:grid-cols-2" data-help="restaurants-list">
        {list.map((r) => {
          const suppliers = suppliersOf(r.id);
          return (
            <li key={r.id} id={r.id} className="scroll-mt-24 rounded-[20px] border border-line p-6">
              <div className="flex items-start gap-3">
                <RiShieldCheckLine className="mt-1 size-6 shrink-0 text-sage-700" aria-hidden />
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">{r.business_name ?? r.name}</h2>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-[15px] text-ink-2">
                    <span>{r.business_type}</span>
                    {r.municipality && (
                      <span className="inline-flex items-center gap-1">
                        <RiMapPin2Line className="size-4 text-ink-3" aria-hidden /> {r.municipality}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[15px] font-semibold">Compra a</p>
              {suppliers.length === 0 ? (
                <p className="text-[15px] text-ink-2">Productores de BACO (pendiente de completar)</p>
              ) : (
                <ul className="mt-1 space-y-1 text-[15px]">
                  {suppliers.map((s) => (
                    <li key={s.id}>
                      <Link href={`/productor/${s.id}`} className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-sage-700">
                        {s.name} · {s.municipality}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <section className="mt-12 rounded-[20px] bg-sage-50 p-6 md:p-8" data-help="restaurants-join">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">¿Tienes un restaurante o una tienda?</h2>
        <p className="mt-2 max-w-[60ch] text-[17px] text-ink-2">Es gratis y voluntario. Pídelo desde tu panel y te damos un cartel con QR para tu local.</p>
        <ButtonLink href={profile?.role === "hostelero" ? "/panel" : "/entrar?rol=hostelero&next=/panel"} className="mt-4">
          {profile?.role === "hostelero" ? "Pedirlo desde mi panel" : "Entrar como restaurante"}
        </ButtonLink>
      </section>
      <div className="mt-6">
        <DemoNote>los restaurantes de esta lista son de ejemplo.</DemoNote>
      </div>
    </div>
  );
}
