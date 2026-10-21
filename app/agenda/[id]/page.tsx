import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine, RiCalendarEventLine, RiExternalLinkLine, RiMapPin2Line, RiStore2Line, RiTimeLine, RiUserLine } from "@remixicon/react";
import { AUDIENCE_NAME, KIND_NAME } from "@/components/agenda-item";
import { SignupForm, SuccessBox } from "@/components/forms-extra";
import { DemoNote } from "@/components/phone-message";
import { ButtonLink } from "@/components/ui";
import { getAgenda, isSignedUp, stallDays } from "@/lib/db/repo";
import { longDate, cap } from "@/lib/format";
import { currentProfile } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getAgenda(Number((await params).id));
  return { title: a?.title ?? "Agenda" };
}

export default async function AgendaDetail({ params }: Props) {
  const id = Number((await params).id);
  const a = Number.isInteger(id) ? getAgenda(id) : undefined;
  if (!a) notFound();
  const profile = await currentProfile();
  const already = profile ? isSignedUp(a.id, profile.id) : false;
  const stall = a.has_stall ? stallDays("proximos").find((d) => d.agenda_id === a.id) : undefined;
  const left = a.capacity ? Math.max(0, a.capacity - a.signups) : null;

  return (
    <div className="mx-auto max-w-[1000px] px-5 pt-6 md:px-8">
      <Link href="/agenda" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
        <RiArrowLeftSLine className="size-5" aria-hidden /> Volver a la agenda
      </Link>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <p className="text-[15px] font-semibold text-ink-2">
            {KIND_NAME[a.kind]} · {AUDIENCE_NAME[a.audience]}
          </p>
          <h1 className="mt-2 text-[32px] leading-tight font-semibold tracking-[-0.035em]">{a.title}</h1>
          <p className="mt-4 text-[17px] leading-relaxed">{a.description}</p>
          <dl className="mt-6 space-y-3 text-[17px]">
            <div className="flex gap-3">
              <dt>
                <RiTimeLine className="mt-1 size-5 text-ink-3" aria-hidden />
                <span className="sr-only">Cuándo</span>
              </dt>
              <dd>
                <span>{a.date_note ?? cap(longDate(a.date))}</span>
                {!a.date_note && a.end_date && a.end_date !== a.date ? ` al ${longDate(a.end_date)}` : ""}
                {a.time ? ` · ${a.time}` : ""}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt>
                <RiMapPin2Line className="mt-1 size-5 text-ink-3" aria-hidden />
                <span className="sr-only">Dónde</span>
              </dt>
              <dd>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.place}, ${a.municipality ?? "Madrid"}`)}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {a.place}
                  <span className="sr-only"> (abre el mapa en otra pestaña)</span>
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt>
                <RiUserLine className="mt-1 size-5 text-ink-3" aria-hidden />
                <span className="sr-only">Organiza</span>
              </dt>
              <dd>Organiza {a.organizer}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {!a.date_note && (
              <ButtonLink href={`/agenda/${a.id}/ics`} variant="secondary" prefetch={false}>
                <RiCalendarEventLine className="size-5" aria-hidden /> Añadir a mi calendario
              </ButtonLink>
            )}
            {a.url && (
              <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-line px-5 text-base font-semibold hover:bg-paper-2 md:h-10 md:text-sm">
                Web del organizador <RiExternalLinkLine className="size-4" aria-hidden />
                <span className="sr-only">(abre en otra pestaña)</span>
              </a>
            )}
          </div>
          {stall && (
            <div className="mt-8 flex items-start gap-3 rounded-[16px] bg-clay-50 p-5">
              <RiStore2Line className="mt-0.5 size-6 shrink-0 text-clay" aria-hidden />
              <div className="text-[17px]">
                <p className="font-semibold">Ese día está el puesto de BACO</p>
                <p className="text-ink-2">
                  {stall.accepted} productos de pequeños productores. <Link href="/puesto#proximos" className="font-semibold text-ink underline underline-offset-2">Ver y reservar</Link>
                </p>
              </div>
            </div>
          )}
          {a.is_mock ? (
            <div className="mt-6">
              <DemoNote>esta actividad de BACO es un ejemplo para la demo.</DemoNote>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" data-help="agenda-signup">
          {a.by_baco ? (
            <div className="rounded-[20px] border border-line p-6">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Apúntate</h2>
              <p className="mt-1 mb-4 text-[15px] text-ink-2">
                {left === 0 ? "Está completo." : `Gratis.${left !== null ? ` Quedan ${left} ${left === 1 ? "plaza" : "plazas"}.` : ""} Te mandamos un SMS de confirmación y otro el día antes.`}
              </p>
              {already ? (
                <SuccessBox>Ya estás apuntado. ¡Nos vemos allí!</SuccessBox>
              ) : (
                <SignupForm agendaId={a.id} name={profile?.name} phone={profile?.phone ?? undefined} full={left === 0} />
              )}
            </div>
          ) : (
            <div className="rounded-[20px] border border-line p-6 text-[17px]">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">No hace falta apuntarse</h2>
              <p className="mt-2 text-ink-2">Es una actividad abierta de {a.organizer}. Confirma horario y condiciones en su web.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
