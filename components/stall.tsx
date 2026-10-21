import Link from "next/link";
import { RiMapPin2Line, RiTimeLine } from "@remixicon/react";
import { Shot } from "@/components/shot";
import type { StallDay, StallSlot } from "@/lib/db/repo";
import { dayNumber, euros, longDate, weekdayShort, cap } from "@/lib/format";
import { productPhoto } from "@/lib/photos";

// Piezas del puesto compartido: la cabecera de un día de mercado y la tarjeta de un producto en venta.

export function DayHeader({ day, as: H = "h3" }: { day: Pick<StallDay, "date" | "market" | "time" | "place" | "municipality">; as?: "h2" | "h3" }) {
  return (
    <div className="flex items-start gap-4">
      <div className="grid w-16 shrink-0 place-items-center rounded-[14px] bg-ink py-2 text-white" aria-hidden>
        <span className="text-xs font-semibold uppercase">{weekdayShort(day.date)}</span>
        <span className="text-2xl leading-none font-semibold tabular-nums">{dayNumber(day.date)}</span>
      </div>
      <div className="min-w-0">
        <H className="text-xl leading-snug font-semibold tracking-[-0.02em]">
          <span className="sr-only">{longDate(day.date)}: </span>
          {day.market}
        </H>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-ink-2">
          <span className="inline-flex items-center gap-1">
            <RiTimeLine className="size-4 text-ink-3" aria-hidden /> <span>{cap(longDate(day.date))}</span> · {day.time}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${day.place}, ${day.municipality}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-ink"
          >
            <RiMapPin2Line className="size-4 text-ink-3" aria-hidden /> {day.place}
            <span className="sr-only">(abre el mapa en otra pestaña)</span>
          </a>
        </p>
      </div>
    </div>
  );
}

export function StallItemCard({ slot }: { slot: StallSlot }) {
  const left = slot.available;
  return (
    <article className="flex overflow-hidden rounded-md border border-line bg-white sm:flex-col">
      <Shot
        photo={productPhoto({ id: slot.product_id, name: slot.product_name, category: slot.category })}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 112px"
        className="m-3 mr-0 size-24 shrink-0 rounded-[10px] sm:m-0 sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none"
      />
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <h4 className="line-clamp-2 text-[15px] leading-snug font-semibold">{slot.product_name}</h4>
        <p className="mt-0.5 text-sm text-ink-2">
          {slot.producer_name} · {slot.municipality}
        </p>
        <p className="mt-2 text-[15px] sm:mt-3">
          <span className="text-lg font-semibold tabular-nums">{euros(slot.unit_price)}</span> <span className="text-ink-2">· {slot.unit_label}</span>
        </p>
        <p className={left > 0 ? "text-sm text-ink-2" : "text-sm font-semibold text-clay"}>{left > 0 ? `Quedan ${left} para reservar` : "Reservas agotadas: quedará algo en el puesto"}</p>
        {left > 0 && (
          <div className="mt-auto pt-3 sm:pt-4">
            <Link
              href={`/puesto/reservar/${slot.id}`}
              className="flex h-12 items-center justify-center rounded-full bg-ink px-5 text-base font-semibold text-white transition-transform hover:bg-ink/85 active:scale-[0.98]"
            >
              Reservar<span className="sr-only"> {slot.product_name}</span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
