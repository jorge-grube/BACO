import Link from "next/link";
import { RiLogoutBoxRLine, RiSearchLine } from "@remixicon/react";
import { signOut } from "@/app/actions";
import { producerOwnedBy, requestsFor } from "@/lib/db/repo";
import { ROLE_NAMES } from "@/lib/domain";
import { currentProfile } from "@/lib/session";
import { MobileMenu, type MenuLink } from "./mobile-menu";
import { Avatar, ButtonLink, Logo } from "./ui";

// Mismas secciones y en el mismo orden en escritorio y en el menú del móvil.
const LINKS: MenuLink[] = [
  { href: "/buscar", label: "Buscar", hint: "Productos y productores" },
  { href: "/puesto", label: "Puesto en mercadillos", hint: "Compra y reserva producto local" },
  { href: "/agenda", label: "Agenda", hint: "Mercados, ferias y encuentros" },
  { href: "/restaurantes", label: "Restaurantes", hint: "Dónde probar producto de Madrid" },
  { href: "/ayuda", label: "Ayuda", hint: "Guías paso a paso y contacto" },
];

export async function SiteHeader() {
  const profile = await currentProfile();
  const producer = profile?.role === "productor" ? producerOwnedBy(profile.id) : undefined;
  const pending = producer ? requestsFor(producer.id).filter((r) => r.status === "enviada").length : 0;

  const account = profile ? (
    <div className="flex flex-wrap gap-2">
      <ButtonLink href="/panel" className="flex-1">
        Mi panel{pending > 0 ? ` (${pending} sin leer)` : ""}
      </ButtonLink>
      <form action={signOut} className="flex-1">
        <button className="h-12 w-full rounded-[8px] border border-line text-base font-semibold hover:bg-paper-2">Cerrar sesión</button>
      </form>
    </div>
  ) : (
    <div className="flex flex-wrap gap-2">
      <ButtonLink href="/entrar" className="flex-1">
        Entrar
      </ButtonLink>
      <ButtonLink href="/entrar?rol=productor" variant="secondary" className="flex-1">
        Soy productor
      </ButtonLink>
    </div>
  );

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 md:px-8 lg:gap-8 xl:px-12">
        <Link href="/" className="text-[26px] leading-none" aria-label="BACO, inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-ink-2 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 lg:gap-2">
          <Link href="/buscar" className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-ink hover:bg-paper-2 lg:hidden">
            <RiSearchLine className="size-5" aria-hidden /> <span className="max-[400px]:sr-only">Buscar</span>
          </Link>
          <MobileMenu links={LINKS} account={account} />
          {profile ? (
            <>
              <Link
                href="/panel"
                className="flex items-center gap-2.5 rounded-full border border-line p-1 text-sm hover:bg-paper-2 sm:py-1 sm:pr-3.5 sm:pl-1"
              >
                <Avatar name={profile.name} className="size-8" />
                <span className="sr-only sm:hidden">Mi panel: {profile.name}</span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[13px] font-semibold">{profile.name}</span>
                  <span className="text-xs text-ink-3">{ROLE_NAMES[profile.role]}</span>
                </span>
                {pending > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-white tabular-nums sm:ml-1">
                    {pending}
                    <span className="sr-only"> sin leer</span>
                  </span>
                )}
              </Link>
              <form action={signOut} className="hidden lg:block">
                <button className="grid size-11 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink" title="Cerrar sesión" aria-label="Cerrar sesión">
                  <RiLogoutBoxRLine className="size-5" aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="hidden lg:contents">
                <ButtonLink href="/entrar?rol=productor" variant="ghost" size="sm">
                  Soy productor
                </ButtonLink>
              </span>
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
