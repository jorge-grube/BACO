import type { Metadata } from "next";
import { RiArrowRightLine } from "@remixicon/react";
import { signIn } from "@/app/actions";
import { Shot } from "@/components/shot";
import { Avatar } from "@/components/ui";
import { demoProfiles, producerOwnedBy } from "@/lib/db/repo";
import { ROLE_NAMES, type Role } from "@/lib/domain";
import { EDITORIAL, photo } from "@/lib/photos";

export const metadata: Metadata = { title: "Entrar" };

const ROLE_COPY: Record<Role, string> = {
  hostelero: "Busca con el asistente, pide muestras y sigue tus solicitudes.",
  productor: "Gestiona tu ficha, responde solicitudes y mira cuántas veces apareces.",
  consumidor: "Descubre producto de Madrid, guarda favoritos y deja reseñas.",
};
const ROLE_PHOTO: Record<Role, string> = {
  hostelero: EDITORIAL.cocinaDetalle,
  productor: EDITORIAL.queseria,
  consumidor: EDITORIAL.pintxos,
};
const ORDER: Role[] = ["hostelero", "productor", "consumidor"];

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; rol?: string }> }) {
  const { next, rol } = await searchParams;
  const profiles = demoProfiles().sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role));

  return (
    <div className="mx-auto max-w-3xl px-5 pt-14">
      <p className="label">Prototipo · cuentas de demo</p>
      <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-[-0.035em]">¿Con qué perfil quieres entrar?</h1>
      <p className="mt-2 max-w-xl text-[15px] text-ink-2">
        Sin contraseñas: cada cuenta muestra BACO desde un lado del mercado. Puedes cambiar de perfil cuando quieras.
      </p>
      <div className="mt-8 space-y-3">
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
                    : "group flex w-full items-center gap-4 overflow-hidden rounded-md border border-line bg-white pr-5 text-left shadow-card hover:border-line-2"
                }
              >
                <Shot photo={photo(ROLE_PHOTO[p.role])} sizes="128px" className="hidden w-28 self-stretch sm:block" />
                <span className="w-1 sm:hidden" aria-hidden />
                <Avatar name={p.name} className="my-5 size-11 text-sm" />
                <span className="min-w-0 flex-1 py-5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="rounded-md bg-sage-50 px-1.5 py-0.5 text-[11px] font-semibold text-sage-700">{ROLE_NAMES[p.role]}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-ink-2">
                    {p.role === "hostelero" && `${p.business_name} · ${p.business_type}`}
                    {p.role === "productor" && producer && `Gestiona ${producer.name}`}
                    {p.role === "consumidor" && "Vive en Madrid y compra producto local"}
                  </span>
                  <span className="mt-1 block text-[13px] text-ink-3">{ROLE_COPY[p.role]}</span>
                </span>
                <RiArrowRightLine className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
