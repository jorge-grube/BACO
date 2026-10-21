import type { Metadata } from "next";
import { RiArrowRightLine } from "@remixicon/react";
import { signIn } from "@/app/actions";
import { PhoneLoginForm } from "@/components/forms-extra";
import { DemoNote } from "@/components/phone-message";
import { Shot } from "@/components/shot";
import { Avatar } from "@/components/ui";
import { demoProfiles, producerOwnedBy } from "@/lib/db/repo";
import { ROLE_NAMES, type Role } from "@/lib/domain";
import { EDITORIAL, photo } from "@/lib/photos";

export const metadata: Metadata = { title: "Entrar" };

const ROLE_COPY: Record<Role, string> = {
  hostelero: "Busca con el asistente, pide muestras y sigue tus peticiones.",
  productor: "Contesta a restaurantes, revisa tu página y apúntate al puesto compartido.",
  consumidor: "Reserva en el puesto de BACO, guarda favoritos y deja reseñas.",
  equipo: "Altas asistidas, el puesto en los mercados, la agenda y las llamadas.",
};
const ROLE_PHOTO: Record<Role, string> = {
  hostelero: EDITORIAL.cocinaDetalle,
  productor: EDITORIAL.queseria,
  consumidor: EDITORIAL.pintxos,
  equipo: EDITORIAL.mercado,
};
const ORDER: Role[] = ["hostelero", "productor", "consumidor", "equipo"];

// Dos formas de entrar: con el móvil y un código por SMS (WCAG 2.2, 3.3.8: sin contraseña que recordar)
// o, en la demo, con un toque en una de las cuentas de prueba.
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; rol?: string }> }) {
  const { next, rol } = await searchParams;
  const profiles = demoProfiles().sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role));

  return (
    <div className="mx-auto max-w-3xl px-5 pt-12">
      <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.035em]">Entra en BACO</h1>
      <p className="mt-2 max-w-xl text-[17px] text-ink-2">Sin contraseñas: con tu móvil y un código que te llega por SMS.</p>

      <section className="mt-8 rounded-[20px] border border-line p-6" aria-labelledby="movil" data-help="login-phone">
        <h2 id="movil" className="text-xl font-semibold tracking-[-0.02em]">
          Entrar con tu móvil
        </h2>
        <div className="mt-4 max-w-md">
          <PhoneLoginForm next={next} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="pruebas">
        <h2 id="pruebas" className="text-xl font-semibold tracking-[-0.02em]">
          O prueba una cuenta de ejemplo
        </h2>
        <div className="mt-3">
          <DemoNote>con un toque entras directamente. También puedes usar su número arriba para probar el código por SMS.</DemoNote>
        </div>
        <div className="mt-4 space-y-3">
          {profiles.map((p) => {
            const producer = p.role === "productor" ? producerOwnedBy(p.id) : undefined;
            const highlighted = rol === p.role;
            return (
              <form key={p.id} action={signIn} data-help={`role-${p.role}`}>
                <input type="hidden" name="profileId" value={p.id} />
                {next && <input type="hidden" name="next" value={next} />}
                <button
                  className={
                    highlighted
                      ? "group flex w-full items-center gap-4 overflow-hidden rounded-md border-2 border-ink bg-white pr-5 text-left"
                      : "group flex w-full items-center gap-4 overflow-hidden rounded-md border border-line bg-white pr-5 text-left shadow-card transition-transform hover:border-line-2 active:scale-[0.99]"
                  }
                >
                  <Shot photo={photo(ROLE_PHOTO[p.role])} sizes="128px" className="hidden w-28 self-stretch sm:block" />
                  <span className="w-1 sm:hidden" aria-hidden />
                  <Avatar name={p.name} className="my-5 size-11 text-sm" />
                  <span className="min-w-0 flex-1 py-5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[17px] font-semibold">{p.name}</span>
                      <span className="rounded-md bg-sage-50 px-1.5 py-0.5 text-xs font-semibold text-sage-700">{ROLE_NAMES[p.role]}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-2">
                      {p.role === "hostelero" && `${p.business_name} · ${p.business_type}`}
                      {p.role === "productor" && producer && `Gestiona ${producer.name}`}
                      {p.role === "consumidor" && "Vive en Madrid y compra producto local"}
                      {p.role === "equipo" && "Equipo de BACO"}
                      {p.phone && <span className="text-ink-3"> · móvil {p.phone}</span>}
                    </span>
                    <span className="mt-1 block text-sm text-ink-3">{ROLE_COPY[p.role]}</span>
                  </span>
                  <RiArrowRightLine className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                  <span className="sr-only">Entrar como {p.name}</span>
                </button>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
