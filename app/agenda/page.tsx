import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { RiArrowDownSLine } from "@remixicon/react";
import { AgendaRow } from "@/components/agenda-item";
import { DemoNote } from "@/components/phone-message";
import { upcomingAgenda, type AgendaItem } from "@/lib/db/repo";
import { monthLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Agenda en persona",
  description: "Mercados de productores, ferias y actividades de BACO en la Comunidad de Madrid.",
};

const AUDIENCES = [
  ["", "Todo"],
  ["productores", "Productores"],
  ["hosteleros", "Restaurantes"],
  ["consumidores", "Público"],
] as const;
const KINDS = [
  ["", "Todo"],
  ["baco", "De BACO"],
  ["mercado", "Mercados"],
  ["feria", "Ferias"],
] as const;

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ para?: string; tipo?: string }> }) {
  const { para = "", tipo = "" } = await searchParams;
  const audience = AUDIENCES.some(([k]) => k === para) ? para : "";
  const kind = KINDS.some(([k]) => k === tipo) ? tipo : "";
  const items = upcomingAgenda({ audience: audience || undefined, kind: kind || undefined });
  const months = new Map<string, AgendaItem[]>();
  for (const a of items) {
    const k = a.date.slice(0, 7);
    months.set(k, [...(months.get(k) ?? []), a]);
  }
  const href = (over: { para?: string; tipo?: string }) => {
    const q = new URLSearchParams();
    const p = over.para ?? audience;
    const t = over.tipo ?? kind;
    if (p) q.set("para", p);
    if (t) q.set("tipo", t);
    const s = q.toString();
    return s ? `/agenda?${s}` : "/agenda";
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-10 md:px-8">
      <p className="label">En persona</p>
      <h1 className="mt-2 max-w-[22ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] md:text-[42px]">Dónde encontrarnos (y encontrar productores)</h1>
      <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-2">
        Mercados de productores y ferias de Madrid, y lo que organiza BACO: te hacemos tu página en el mercado, encuentros entre productores y cocineros, talleres y
        visitas.
      </p>

      <div className="mt-8 space-y-3" data-help="agenda-filters">
        <FilterRow label="¿Para quién?" options={AUDIENCES} active={audience} build={(k) => href({ para: k })} />
        <FilterRow label="¿Qué?" options={KINDS} active={kind} build={(k) => href({ tipo: k })} />
      </div>

      <div className="mt-10 space-y-12" data-help="agenda-list">
        {items.length === 0 && <p className="text-[17px] text-ink-2">No hay nada con esos filtros. <Link href="/agenda" className="font-semibold text-ink underline underline-offset-2">Ver todo</Link>.</p>}
        {[...months.entries()].slice(0, 2).map(([m, list]) => (
          <MonthBlock key={m} month={m} list={list} />
        ))}
        {months.size > 2 && (
          <details className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-line px-5 text-[17px] font-semibold hover:bg-paper-2 [&::-webkit-details-marker]:hidden">
              Más adelante: {[...months.values()].slice(2).reduce((n, l) => n + l.length, 0)} fechas hasta {monthLabel(`${[...months.keys()].at(-1)}-01`).toLowerCase()}
              <RiArrowDownSLine className="size-6 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-8 space-y-12">
              {[...months.entries()].slice(2).map(([m, list]) => (
                <MonthBlock key={m} month={m} list={list} />
              ))}
            </div>
          </details>
        )}
      </div>
      <div className="mt-10">
        <DemoNote>
          los mercados y ferias son reales (fechas calculadas con su calendario publicado; confirma en la web del organizador). Lo que organiza BACO es de ejemplo.
        </DemoNote>
      </div>
    </div>
  );
}

function MonthBlock({ month, list }: { month: string; list: AgendaItem[] }) {
  return (
    <section aria-labelledby={`m-${month}`}>
      <h2 id={`m-${month}`} className="text-xl font-semibold tracking-[-0.02em]">
        {monthLabel(`${month}-01`)}
      </h2>
      <ul className="stagger mt-4 grid gap-3 lg:grid-cols-2">
        {list.map((a) => (
          <AgendaRow key={a.id} a={a} />
        ))}
      </ul>
    </section>
  );
}

function FilterRow({ label, options, active, build }: { label: string; options: readonly (readonly [string, string])[]; active: string; build: (k: string) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-[15px] font-semibold sm:w-28">{label}</span>
      {options.map(([k, name]) => (
        <Link
          key={k}
          href={build(k)}
          aria-current={active === k ? "true" : undefined}
          className={clsx(
            "inline-flex h-11 items-center rounded-full border px-4 text-[15px] font-semibold transition-colors",
            active === k ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 hover:border-ink/30 hover:text-ink",
          )}
        >
          {name}
        </Link>
      ))}
    </div>
  );
}
