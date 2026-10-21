import Link from "next/link";
import { RiMapPin2Line, RiStore2Line, RiTimeLine } from "@remixicon/react";
import { MockTag } from "@/components/ui";
import type { AgendaItem } from "@/lib/db/repo";
import { dayNumber, longDate, weekdayShort, cap } from "@/lib/format";

export const KIND_NAME: Record<AgendaItem["kind"], string> = {
  mercado: "Mercado",
  feria: "Feria",
  encuentro: "Encuentro",
  taller: "Taller",
  ruta: "Visita",
  alta: "Alta asistida",
};
export const AUDIENCE_NAME: Record<AgendaItem["audience"], string> = {
  productores: "Para productores",
  hosteleros: "Para restaurantes",
  consumidores: "Para el público",
  todos: "Para todos",
};

export function AgendaRow({ a }: { a: AgendaItem }) {
  return (
    <li>
      <Link href={`/agenda/${a.id}`} className="group flex h-full gap-4 rounded-md border border-line bg-white p-4 transition-[border-color,transform] hover:border-ink/25 active:scale-[0.995]">
        <div className={`grid w-14 shrink-0 place-items-center self-start rounded-[12px] py-1.5 ${a.by_baco ? "bg-sage-700 text-white" : "bg-paper-2 text-ink"}`} aria-hidden>
          <span className="text-xs font-semibold uppercase">{weekdayShort(a.date)}</span>
          <span className="text-xl leading-none font-semibold tabular-nums">{dayNumber(a.date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-2">
            <span>{KIND_NAME[a.kind]}</span>
            <span aria-hidden>·</span>
            <span>{AUDIENCE_NAME[a.audience]}</span>
            {a.by_baco ? (
              <span className="rounded-full bg-sage-50 px-2 py-0.5 text-sage-700">Organiza BACO</span>
            ) : null}
            {a.has_stall ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-clay-50 px-2 py-0.5 text-clay">
                <RiStore2Line className="size-3.5" aria-hidden /> Con puesto de BACO
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 text-[17px] leading-snug font-semibold group-hover:underline group-hover:underline-offset-2">{a.title}</h3>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[15px] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <RiTimeLine className="size-4 text-ink-3" aria-hidden />
              <span className="sr-only">Cuándo: </span>
              {a.date_note ?? (
                <span>
                  {cap(longDate(a.date))}
                  {a.end_date && a.end_date !== a.date ? ` al ${longDate(a.end_date)}` : ""}
                </span>
              )}
              {a.time ? ` · ${a.time}` : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <RiMapPin2Line className="size-4 text-ink-3" aria-hidden />
              <span className="sr-only">Dónde: </span>
              {a.place}
            </span>
          </p>
          {a.is_mock ? (
            <p className="mt-1.5">
              <MockTag>actividad de ejemplo</MockTag>
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
