import Link from "next/link";
import { RiArrowRightLine, RiPrinterLine, RiShieldCheckLine } from "@remixicon/react";
import { cancelReservation, requestBadge } from "@/app/actions";
import { PhoneMessage } from "@/components/phone-message";
import { Shot } from "@/components/shot";
import { ButtonLink, MockTag, SectionHeader } from "@/components/ui";
import { badgeOf, notificationsFor, reservationsOf, signupsOf, slotsOfProducer, suppliersOf } from "@/lib/db/repo";
import { todayISO } from "@/lib/db/demo-extras";
import { longDate, euros } from "@/lib/format";
import { productPhoto } from "@/lib/photos";

// Piezas del panel compartidas por los distintos perfiles.

export function NoticesCard({ profileId }: { profileId: string }) {
  const notes = notificationsFor(profileId, 3);
  return (
    <section data-help="notices">
      <SectionHeader label="Lo que te llega al móvil" title="Avisos" />
      {notes.length === 0 ? (
        <p className="text-[15px] text-ink-2">Aún no te hemos enviado ningún aviso.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <PhoneMessage key={n.id} n={n} />
          ))}
        </div>
      )}
      <p className="mt-2 text-sm text-ink-3">Demo: los avisos no salen del servidor; así es como llegarían por WhatsApp o SMS.</p>
    </section>
  );
}

export function SignupsCard({ profileId }: { profileId: string }) {
  const items = signupsOf(profileId);
  return (
    <section className="mt-12" data-help="my-signups">
      <SectionHeader label="En persona" title="Actividades a las que vas" action={<ButtonLink href="/agenda" variant="ghost" size="sm">Ver agenda <RiArrowRightLine className="size-4" /></ButtonLink>} />
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-2 p-5 text-[15px] text-ink-2">
          No te has apuntado a nada todavía. Mira la <Link href="/agenda" className="font-semibold text-ink underline underline-offset-2">agenda</Link>: encuentros con productores, talleres y mercados.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/agenda/${a.id}`} className="flex flex-wrap items-baseline justify-between gap-2 p-4 hover:bg-paper-2">
                <span className="text-[15px] font-semibold">{a.title}</span>
                <span className="text-sm text-ink-2">
                  {longDate(a.date)}
                  {a.time ? ` · ${a.time}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReservationsCard({ profileId }: { profileId: string }) {
  const items = reservationsOf(profileId);
  const today = todayISO();
  return (
    <section className="mt-12" data-help="my-reservations">
      <SectionHeader label="Puesto de BACO" title="Tus reservas" action={<ButtonLink href="/puesto" variant="ghost" size="sm">Ver el puesto <RiArrowRightLine className="size-4" /></ButtonLink>} />
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-2 p-5 text-[15px] text-ink-2">
          No tienes reservas. En el <Link href="/puesto" className="font-semibold text-ink underline underline-offset-2">puesto de BACO</Link> puedes apartar producto y recogerlo en el mercado.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((r) => (
            <li key={r.id} className="flex gap-3 rounded-md border border-line p-4">
              <Shot photo={productPhoto({ id: r.product_id, name: r.product_name, category: r.category })} sizes="64px" className="size-16 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1 text-[15px]">
                <p className="font-semibold">
                  {r.quantity} × {r.product_name}
                </p>
                <p className="text-ink-2">
                  {longDate(r.day_date)} · {r.day_market}
                </p>
                <p className="mt-1">
                  {r.status === "reservada" ? (
                    <>
                      Código <span className="font-semibold tabular-nums">{r.code}</span> · pagas {euros(r.quantity * r.unit_price)} allí
                    </>
                  ) : r.status === "recogida" ? (
                    <span className="text-sage-700">Recogida</span>
                  ) : (
                    <span className="text-ink-3">Cancelada</span>
                  )}
                </p>
                {r.status === "reservada" && r.day_date >= today && (
                  <form action={cancelReservation} className="mt-2">
                    <input type="hidden" name="id" value={r.id} />
                    <button className="h-11 rounded-full border border-line px-4 text-sm font-semibold hover:bg-paper-2">Cancelar reserva</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StallProducerCard({ producerId }: { producerId: number }) {
  const slots = slotsOfProducer(producerId);
  const today = todayISO();
  const upcoming = slots.filter((s) => s.day_date >= today);
  const past = slots.filter((s) => s.day_date < today && s.status === "aceptado");
  const earned = past.reduce((sum, s) => sum + s.sold * s.unit_price * (1 - s.commission), 0);
  const STATUS = { solicitado: "En revisión", aceptado: "Aceptado", rechazado: "Sin sitio esta vez" } as const;
  return (
    <section data-help="my-stall">
      <SectionHeader label="Venta directa" title="Puesto compartido" />
      {upcoming.length === 0 ? (
        <p className="text-[15px] text-ink-2">No tienes productos apuntados para los próximos mercados.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((s) => (
            <li key={s.id} className="rounded-md border border-line p-3.5 text-[15px]">
              <p className="font-semibold">
                {s.quantity} × {s.product_name}
              </p>
              <p className="text-ink-2">
                {longDate(s.day_date)} · {s.day_market}
              </p>
              <p className={s.status === "aceptado" ? "text-sage-700" : "text-ink-2"}>
                {STATUS[s.status]}
                {s.reserved > 0 && ` · ${s.reserved} reservadas`}
              </p>
            </li>
          ))}
        </ul>
      )}
      {past.length > 0 && (
        <div className="mt-3 rounded-md bg-paper-2 p-3.5 text-[15px]">
          <p>
            Vendido en mercados anteriores: <span className="font-semibold tabular-nums">{past.reduce((n, s) => n + s.sold, 0)} unidades</span>
          </p>
          <p>
            Para ti, ya descontada la comisión: <span className="font-semibold tabular-nums">{euros(earned)}</span> <MockTag />
          </p>
        </div>
      )}
      <ButtonLink href="/puesto/vender" variant="secondary" className="mt-3 w-full">
        Apuntarme a un mercado
      </ButtonLink>
    </section>
  );
}

export function BadgeCard({ profileId }: { profileId: string }) {
  const badge = badgeOf(profileId);
  const suppliers = suppliersOf(profileId);
  return (
    <section className="mt-12 rounded-[20px] border border-line p-6" data-help="badge">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sage-50 text-sage-700">
          <RiShieldCheckLine className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label">Voluntario y gratuito</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">Distintivo «Cocina con producto de Madrid»</h2>
          {badge?.status === "concedido" ? (
            <>
              <p className="mt-2 text-[15px] text-ink-2">Lo tienes. Sales en la página de restaurantes y puedes poner el cartel con QR en tu local.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/restaurantes/${profileId}/cartel`}>
                  <RiPrinterLine className="size-4" aria-hidden /> Imprimir mi cartel
                </ButtonLink>
                <ButtonLink href="/restaurantes" variant="secondary">
                  Ver la página de restaurantes
                </ButtonLink>
              </div>
            </>
          ) : badge?.status === "solicitado" ? (
            <p className="mt-2 text-[15px] text-ink-2">Lo has pedido. El equipo comprueba tus compras y te avisamos por WhatsApp en unos días.</p>
          ) : (
            <>
              <p className="mt-2 text-[15px] text-ink-2">
                Para restaurantes que compran a productores de BACO. Te ayuda a contarlo a tus clientes. Lo concedemos si has cerrado al menos 2 pedidos o muestras con
                productores de BACO (llevas {suppliers.length}).
              </p>
              <form action={requestBadge} className="mt-4">
                <button className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-base font-semibold text-white hover:bg-ink/85">Pedir el distintivo</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
