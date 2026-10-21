import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine } from "@remixicon/react";
import { ReserveForm } from "@/components/forms-extra";
import { Shot } from "@/components/shot";
import { DayHeader } from "@/components/stall";
import { getSlot, getStallDay } from "@/lib/db/repo";
import { todayISO } from "@/lib/db/demo-extras";
import { euros } from "@/lib/format";
import { productPhoto } from "@/lib/photos";
import { currentProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Reservar en el puesto" };

// Una cosa por página (GOV.UK): qué reservas, cuántas y a nombre de quién.
export default async function ReservePage({ params }: { params: Promise<{ slotId: string }> }) {
  const id = Number((await params).slotId);
  const slot = Number.isInteger(id) ? getSlot(id) : undefined;
  const day = slot && getStallDay(slot.stall_day_id);
  if (!slot || !day || slot.status !== "aceptado") notFound();
  const profile = await currentProfile();
  const past = day.date < todayISO();

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6">
      <Link href="/puesto#proximos" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
        <RiArrowLeftSLine className="size-5" aria-hidden /> Volver al puesto
      </Link>
      <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.03em]">Reservar para recoger en el puesto</h1>

      <div className="mt-5 flex gap-4 rounded-[18px] border border-line p-4">
        <Shot photo={productPhoto({ id: slot.product_id, name: slot.product_name, category: slot.category })} sizes="96px" className="size-24 shrink-0 rounded-[12px]" />
        <div className="min-w-0 text-[15px]">
          <p className="text-[17px] leading-snug font-semibold">{slot.product_name}</p>
          <p className="text-ink-2">{slot.producer_name}</p>
          <p className="mt-1">
            <span className="font-semibold tabular-nums">{euros(slot.unit_price)}</span> · {slot.unit_label}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <DayHeader day={day} as="h2" />
      </div>

      <div className="mt-8" data-help="reserve-form">
        {past ? (
          <p className="text-[17px] text-ink-2">Ese día ya ha pasado.</p>
        ) : slot.available <= 0 ? (
          <p className="text-[17px] text-ink-2">Ya no quedan unidades para reservar. Pásate por el puesto: puede que quede alguna.</p>
        ) : (
          <ReserveForm slotId={slot.id} max={slot.available} unitPrice={slot.unit_price} name={profile?.name} phone={profile?.phone ?? undefined} loggedIn={Boolean(profile)} />
        )}
      </div>
    </div>
  );
}
