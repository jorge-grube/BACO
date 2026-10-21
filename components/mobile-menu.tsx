"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiCloseLine, RiMenuLine } from "@remixicon/react";

export type MenuLink = { href: string; label: string; hint?: string };

// Menú para móvil y tableta: botón con texto ("Menú"), enlaces grandes, se cierra al navegar y con Escape.
export function MobileMenu({ links, account }: { links: MenuLink[]; account: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        ref={button}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="menu-movil"
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-ink hover:bg-paper-2 lg:hidden"
      >
        {open ? <RiCloseLine className="size-5" aria-hidden /> : <RiMenuLine className="size-5" aria-hidden />} Menú
      </button>
      {open && (
        <div id="menu-movil" className="help-pop fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-64px)] overflow-y-auto border-b border-line bg-white shadow-pop lg:hidden">
          <nav aria-label="Menú principal" className="mx-auto max-w-[1440px] px-4 py-3">
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className="flex min-h-14 flex-col justify-center rounded-[12px] px-3 py-2 hover:bg-paper-2 aria-[current=page]:bg-sage-50"
                  >
                    <span className="text-[17px] font-semibold">{l.label}</span>
                    {l.hint && <span className="text-sm text-ink-2">{l.hint}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-line pt-3 pb-2">{account}</div>
          </nav>
        </div>
      )}
    </>
  );
}
