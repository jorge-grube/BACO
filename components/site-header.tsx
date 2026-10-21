import Link from "next/link";
import { RiLogoutBoxRLine } from "@remixicon/react";
import { signOut } from "@/app/actions";
import { producerOwnedBy, requestsFor } from "@/lib/db/repo";
import { ROLE_NAMES } from "@/lib/domain";
import { currentProfile } from "@/lib/session";
import { Avatar, ButtonLink, Logo } from "./ui";

export async function SiteHeader() {
  const profile = await currentProfile();
  const producer = profile?.role === "productor" ? producerOwnedBy(profile.id) : undefined;
  const pending = producer ? requestsFor(producer.id).filter((r) => r.status === "enviada").length : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 md:px-8 xl:px-12">
        <Link href="/" className="text-[26px] leading-none" aria-label="BACO, inicio">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-2 md:flex">
          <Link href="/buscar" className="hover:text-ink">
            Buscar
          </Link>
          <Link href="/#tendencias" className="hover:text-ink">
            Tendencias
          </Link>
          <Link href="/#sellos" className="hover:text-ink">
            Sellos de calidad
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {profile ? (
            <>
              <Link
                href="/panel"
                className="flex items-center gap-2.5 rounded-full border border-line py-1 pr-3.5 pl-1 text-sm hover:bg-paper-2"
              >
                <Avatar name={profile.name} className="size-7" />
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[13px] font-semibold">{profile.name}</span>
                  <span className="text-[11px] text-ink-3">{ROLE_NAMES[profile.role]}</span>
                </span>
                {pending > 0 && (
                  <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-white tabular-nums">
                    {pending}
                  </span>
                )}
              </Link>
              <form action={signOut}>
                <button className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink" title="Salir">
                  <RiLogoutBoxRLine className="size-[18px]" />
                </button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/entrar?rol=productor" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Soy productor
              </ButtonLink>
              <ButtonLink href="/entrar" variant="primary" size="sm">
                Entrar
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
