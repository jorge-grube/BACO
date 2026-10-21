import Link from "next/link";
import { RiArrowRightLine, RiPhoneLine } from "@remixicon/react";
import { teamDecideSlot, teamGrantBadge, teamMarkCalled, teamMarkReservation, teamRecordSold, teamSendOnboarding } from "@/app/actions";
import { OnboardingForm } from "@/components/forms-extra";
import { ago } from "@/components/phone-message";
import { ButtonLink, SectionHeader } from "@/components/ui";
import {
  helpRequests,
  onboardings,
  pendingBadges,
  pendingSlots,
  reservationsForDay,
  searchProducers,
  signupsByEvent,
  slotsForDay,
  stallDays,
  type Profile,
} from "@/lib/db/repo";
import { CALLBACK_SLOTS, type CallbackSlot } from "@/lib/contact";
import { euros, longDate } from "@/lib/format";

// Panel del equipo de BACO (Aplus). Todo lo que pasa fuera de la web empieza o acaba aquí:
// llamadas pendientes, altas asistidas, el puesto en los mercados, la agenda y los distintivos.

const ONB_STATUS = { borrador: "Borrador", enviado: "Enviada, esperando al productor", publicado: "Publicada", cambios: "Pide cambios" } as const;
const small = "h-11 rounded-full px-4 text-sm font-semibold";

export function TeamPanel({ profile }: { profile: Profile }) {
  const calls = helpRequests();
  const pendingCalls = calls.filter((c) => c.status === "pendiente");
  const onbs = onboardings();
  const slotsToReview = pendingSlots();
  const days = stallDays("proximos");
  const lastDay = stallDays("pasados")[0];
  const badges = pendingBadges();
  const events = signupsByEvent();
  const producers = searchProducers("", 200);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">{profile.name}</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Equipo BACO</h1>
          <p className="text-[15px] text-ink-2">Lo que hay que hacer hoy, de más urgente a menos.</p>
        </div>
        <ButtonLink href="/demo/avisos" variant="secondary" size="sm">
          Ver los avisos enviados
        </ButtonLink>
      </div>

      <nav aria-label="Secciones del panel" className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-5">
        {[
          ["#llamadas", pendingCalls.length, "llamadas pendientes"],
          ["#altas", onbs.filter((o) => o.status !== "publicado").length, "altas en curso"],
          ["#puesto", slotsToReview.length, "solicitudes del puesto"],
          ["#agenda", events.reduce((n, e) => n + e.people.length, 0), "personas apuntadas"],
          ["#distintivos", badges.length, "distintivos por revisar"],
        ].map(([href, n, label]) => (
          <a key={href as string} href={href as string} className="bg-white px-5 py-4 last:col-span-2 hover:bg-paper-2 md:last:col-span-1">
            <span className="block text-2xl font-semibold tracking-[-0.03em] tabular-nums">{n}</span>
            <span className="text-[13px] text-ink-2">{label}</span>
          </a>
        ))}
      </nav>

      {/* Llamadas */}
      <section id="llamadas" className="mt-12 scroll-mt-24" data-help="team-calls">
        <SectionHeader label="Que me llamen" title="Llamadas pendientes" />
        {calls.length === 0 ? (
          <p className="text-[15px] text-ink-2">No hay llamadas pendientes.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {calls.map((c) => (
              <li key={c.id} className={c.status === "pendiente" ? "rounded-md border border-line p-4" : "rounded-md border border-line bg-paper-2/60 p-4 text-ink-2"}>
                <p className="text-[15px] font-semibold">{c.name}</p>
                <p className="text-sm text-ink-2">
                  {CALLBACK_SLOTS[c.slot as CallbackSlot] ?? c.slot} · {ago(c.created_at)}
                  {c.page ? ` · desde ${c.page}` : ""}
                </p>
                {c.topic && <p className="mt-1 text-[15px]">«{c.topic}»</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={`${small} inline-flex items-center gap-1.5 border border-line hover:bg-paper-2`}>
                    <RiPhoneLine className="size-4" aria-hidden /> {c.phone}
                  </a>
                  {c.status === "pendiente" ? (
                    <form action={teamMarkCalled}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className={`${small} bg-ink text-white hover:bg-ink/85`}>Ya le he llamado</button>
                    </form>
                  ) : (
                    <span className="inline-flex h-11 items-center text-sm text-sage-700">Llamada hecha</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Altas asistidas */}
      <section id="altas" className="mt-14 scroll-mt-24" data-help="team-onboarding">
        <SectionHeader label="El alta la hacemos nosotros" title="Altas asistidas" />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[20px] border border-line p-5">
            <h3 className="text-lg font-semibold">Preparar la página de un productor</h3>
            <p className="mt-1 mb-4 text-[15px] text-ink-2">Lo rellenas tú (en el mercado o por teléfono). Al productor le llega un WhatsApp para revisarla y publicarla con un toque.</p>
            <OnboardingForm producers={producers} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">En curso</h3>
            {onbs.length === 0 ? (
              <p className="mt-2 text-[15px] text-ink-2">Ninguna todavía.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {onbs.map((o) => (
                  <li key={o.id} className="rounded-md border border-line p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/productor/${o.producer_id}`} className="text-[15px] font-semibold underline-offset-2 hover:underline">
                        {o.producer_name}
                      </Link>
                      <span className={o.status === "cambios" ? "text-sm font-semibold text-clay" : o.status === "publicado" ? "text-sm text-sage-700" : "text-sm text-ink-2"}>
                        {ONB_STATUS[o.status]}
                      </span>
                    </div>
                    <p className="text-sm text-ink-2">
                      {o.contact_name} · {o.phone}
                      {o.met_at ? ` · ${o.met_at}` : ""} · {ago(o.updated_at)}
                    </p>
                    {o.feedback && <p className="mt-1 text-[15px]">«{o.feedback}»</p>}
                    {o.status !== "publicado" && (
                      <form action={teamSendOnboarding} className="mt-3">
                        <input type="hidden" name="id" value={o.id} />
                        <button className={`${small} border border-line hover:bg-paper-2`}>{o.status === "borrador" ? "Enviar por WhatsApp" : "Volver a enviar"}</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Puesto */}
      <section id="puesto" className="mt-14 scroll-mt-24" data-help="team-stall">
        <SectionHeader label="Venta directa" title="Puesto compartido" action={<ButtonLink href="/puesto" variant="ghost" size="sm">Ver la página pública <RiArrowRightLine className="size-4" /></ButtonLink>} />
        <h3 className="text-lg font-semibold">Solicitudes por revisar</h3>
        {slotsToReview.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-2">Ninguna.</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {slotsToReview.map((s) => (
              <li key={s.id} className="rounded-md border border-line p-4">
                <p className="text-[15px] font-semibold">
                  {s.quantity} × {s.product_name}
                </p>
                <p className="text-sm text-ink-2">
                  {s.producer_name} · {longDate(s.day_date)} · {s.day_market}
                </p>
                <p className="text-sm text-ink-2">
                  {s.unit_label} a {euros(s.unit_price)}
                  {s.note ? ` · «${s.note}»` : ""}
                </p>
                <form action={teamDecideSlot} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button name="status" value="aceptado" className={`${small} bg-ink text-white hover:bg-ink/85`}>
                    Aceptar
                  </button>
                  <button name="status" value="rechazado" className={`${small} border border-line hover:bg-paper-2`}>
                    No hay sitio
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {days.map((d, i) => (
          <StallDayDetail key={d.id} dayId={d.id} title={`${i === 0 ? "Próximo mercado" : "Después"}: ${longDate(d.date)} · ${d.market}`} />
        ))}
        {lastDay && <StallDayDetail dayId={lastDay.id} title={`Último mercado: ${longDate(lastDay.date)} · ${lastDay.market}`} past />}
      </section>

      {/* Agenda */}
      <section id="agenda" className="mt-14 scroll-mt-24" data-help="team-agenda">
        <SectionHeader label="En persona" title="Personas apuntadas" action={<ButtonLink href="/agenda" variant="ghost" size="sm">Ver la agenda <RiArrowRightLine className="size-4" /></ButtonLink>} />
        <ul className="grid gap-3 md:grid-cols-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-md border border-line p-4">
              <Link href={`/agenda/${e.id}`} className="text-[15px] font-semibold underline-offset-2 hover:underline">
                {e.title}
              </Link>
              <p className="text-sm text-ink-2">
                {longDate(e.date)} · {e.people.length}
                {e.capacity ? ` de ${e.capacity}` : ""} personas
              </p>
              {e.people.length > 0 && (
                <ul className="mt-2 text-sm text-ink-2">
                  {e.people.map((p, i) => (
                    <li key={i}>
                      {p.name} · {p.phone}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Distintivos */}
      <section id="distintivos" className="mt-14 scroll-mt-24" data-help="team-badges">
        <SectionHeader label="Voluntario" title="Distintivos por revisar" />
        {badges.length === 0 ? (
          <p className="text-[15px] text-ink-2">Ninguno.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {badges.map((b) => (
              <li key={b.id} className="rounded-md border border-line p-4">
                <p className="text-[15px] font-semibold">{b.business_name ?? b.name}</p>
                <p className="text-sm text-ink-2">
                  {b.answered} pedidos o muestras cerrados con productores de BACO {b.answered >= 2 ? "· cumple" : "· aún no cumple (mínimo 2)"}
                </p>
                {b.answered >= 2 ? (
                  <form action={teamGrantBadge} className="mt-3">
                    <input type="hidden" name="profileId" value={b.id} />
                    <button className={`${small} bg-ink text-white hover:bg-ink/85`}>Conceder distintivo</button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-ink-2">Cuando cierre 2, podrás concederlo. Mientras, llámale y cuéntale qué productores le pueden servir.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function StallDayDetail({ dayId, title, past }: { dayId: number; title: string; past?: boolean }) {
  const slots = slotsForDay(dayId, "aceptado");
  const reservations = reservationsForDay(dayId);
  const total = slots.reduce((s, x) => s + x.sold * x.unit_price, 0);
  return (
    <div className="mt-8 rounded-[20px] border border-line p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-[15px] text-ink-2">
        {slots.length} productos · vendido {euros(total)} · comisión {euros(total * (slots[0]?.commission ?? 0.15))}
      </p>
      <div className="relative mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label={`Productos: ${title} (la tabla se desplaza de lado)`}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Productos del puesto y unidades vendidas</caption>
          <thead className="text-ink-2">
            <tr>
              <th scope="col" className="py-2 pr-3 font-semibold">Producto</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Llevan</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Reservadas</th>
              <th scope="col" className="py-2 font-semibold">Vendidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {slots.map((s) => (
              <tr key={s.id}>
                <td className="py-2.5 pr-3">
                  <span className="font-semibold">{s.product_name}</span>
                  <span className="block text-ink-2">{s.producer_name}</span>
                </td>
                <td className="py-2.5 pr-3 tabular-nums">{s.quantity}</td>
                <td className="py-2.5 pr-3 tabular-nums">{s.reserved}</td>
                <td className="py-2.5">
                  <form action={teamRecordSold} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <label className="sr-only" htmlFor={`sold-${s.id}`}>
                      Vendidas de {s.product_name}
                    </label>
                    <input id={`sold-${s.id}`} name="sold" type="number" min={0} max={s.quantity} defaultValue={s.sold} className="h-11 w-20 rounded-[10px] border border-line-2 px-2 text-base tabular-nums" />
                    <button className={`${small} border border-line hover:bg-paper-2`}>Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!past && (
        <>
          <h4 className="mt-6 text-[15px] font-semibold">Reservas para recoger ({reservations.filter((r) => r.status === "reservada").length})</h4>
          {reservations.length === 0 ? (
            <p className="text-[15px] text-ink-2">Ninguna.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {reservations.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[15px]">
                  <span>
                    <span className="font-semibold tabular-nums">{r.code}</span> · {r.name} · {r.quantity} × {r.product_name}
                  </span>
                  {r.status === "reservada" ? (
                    <form action={teamMarkReservation} className="flex gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <button name="status" value="recogida" className={`${small} bg-ink text-white hover:bg-ink/85`}>
                        Recogida
                      </button>
                      <button name="status" value="cancelada" className={`${small} border border-line hover:bg-paper-2`}>
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <span className="text-sm text-ink-2">{r.status === "recogida" ? "Recogida" : "Cancelada"}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
