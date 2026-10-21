import type { Metadata } from "next";
import Link from "next/link";
import { AgendaRow } from "@/components/agenda-item";
import { DemoNote } from "@/components/phone-message";
import { Shot } from "@/components/shot";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { producersIn, upcomingAgenda } from "@/lib/db/repo";
import { SIERRA_NORTE } from "@/lib/geo";
import { EDITORIAL, categoryPhoto, photo } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Piloto Sierra Norte",
  description: "Catálogo común de productores de la Sierra Norte de Madrid para restaurantes, alojamientos y tiendas.",
};


const STUDY = "https://germinando.es/wp-content/uploads/2024/01/Estudio_viabilidad_-nodo_-logistico_SN_VsR.pdf";

export default function SierraNortePage() {
  const producers = producersIn(SIERRA_NORTE);
  const events = upcomingAgenda().filter((a) => a.municipality && SIERRA_NORTE.includes(a.municipality));

  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-8 md:px-8 xl:px-12">
      <section className="grid overflow-hidden rounded-lg bg-sage-50 lg:grid-cols-[1.1fr_1fr]">
        <div className="px-6 py-10 md:px-10 md:py-14">
          <p className="label !text-ink">Piloto por comarcas</p>
          <h1 className="mt-3 max-w-[18ch] text-[34px] leading-[1.05] font-semibold tracking-[-0.04em] md:text-[46px]">Sierra Norte: el catálogo común que pedían</h1>
          <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-ink-2">
            Empezamos por una comarca para que haya muchos productores y restaurantes cerca. Así cada pedido cuesta menos de mover.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <ButtonLink href="#productores" size="lg">
              Ver productores de la comarca
            </ButtonLink>
            <ButtonLink href="#apuntarse" variant="secondary" size="lg">
              Quiero participar
            </ButtonLink>
          </div>
        </div>
        <Shot photo={photo(EDITORIAL.ganado)} sizes="(min-width: 1024px) 45vw, 100vw" className="min-h-[240px]" preload />
      </section>

      <section className="mt-14 max-w-4xl" aria-labelledby="porque">
        <h2 id="porque" className="text-2xl font-semibold tracking-[-0.03em]">
          Por qué aquí
        </h2>
        <p className="mt-2 text-[17px] text-ink-2">
          Un estudio de 2023 para la Mancomunidad Valle Norte del Lozoya entrevistó a 41 establecimientos de la comarca (
          <a href={STUDY} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Germinando, informe de demanda<span className="sr-only"> (PDF, abre en otra pestaña)</span>
          </a>
          ):
        </p>
        <dl className="mt-5 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
          {[
            ["21 de 23", "restaurantes ya usan producto local"],
            ["19", "restaurantes piden un catálogo común de productores"],
            ["20", "establecimientos se sumarían a un piloto"],
          ].map(([n, t]) => (
            <div key={t} className="bg-white p-5">
              <dt className="sr-only">{t}</dt>
              <dd>
                <span className="block text-3xl font-semibold tracking-[-0.03em] tabular-nums">{n}</span>
                <span className="text-[15px] text-ink-2">{t}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[15px] text-ink-2">
          Piden sobre todo por teléfono y WhatsApp, por eso BACO avisa y deja contestar por WhatsApp. Lo que BACO no resuelve por sí solo: el reparto y el precio
          en un territorio disperso.
        </p>
      </section>

      <section id="productores" className="mt-14 scroll-mt-24" data-help="pilot-producers">
        <SectionHeader label={`${producers.length} en el catálogo`} title="Productores de la Sierra Norte" />
        <ul className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {producers.map((p) => (
            <li key={p.id}>
              <Link href={`/productor/${p.id}`} className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-white transition-[border-color,transform] hover:border-ink/25 active:scale-[0.99]">
                <Shot photo={categoryPhoto(p.main_category ?? "Otros alimentos")} sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[16/10]" />
                <div className="p-4">
                  <h3 className="text-[15px] leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">{p.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {p.municipality} · {p.products} productos{p.main_category ? ` · ${p.main_category.toLowerCase()}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {events.length > 0 && (
        <section className="mt-14" data-help="pilot-events">
          <SectionHeader title="Próximas citas en la comarca" />
          <ul className="grid gap-3 lg:grid-cols-2">
            {events.map((a) => (
              <AgendaRow key={a.id} a={a} />
            ))}
          </ul>
        </section>
      )}

      <section id="apuntarse" className="mt-14 grid scroll-mt-24 gap-4 md:grid-cols-2" data-help="pilot-join">
        <div className="rounded-[20px] border border-line p-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Tengo un restaurante, alojamiento o tienda</h2>
          <p className="mt-2 text-[17px] text-ink-2">Busca productores de la comarca y pídeles muestra. Ven a la presentación del piloto.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/buscar">Buscar productores</ButtonLink>
            <ButtonLink href="/agenda?para=hosteleros" variant="secondary">
              Ver citas
            </ButtonLink>
          </div>
        </div>
        <div className="rounded-[20px] border border-line p-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Soy productor de la Sierra Norte</h2>
          <p className="mt-2 text-[17px] text-ink-2">Te preparamos la página nosotros. Ven al taller o pide que te llamemos.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/agenda?para=productores">Ver talleres</ButtonLink>
            <ButtonLink href="/ayuda" variant="secondary">
              Que me llamen
            </ButtonLink>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <DemoNote>las cifras del estudio son reales (enlace arriba). El piloto, sus citas y los datos de contacto de los productores son de ejemplo.</DemoNote>
      </div>
    </div>
  );
}
