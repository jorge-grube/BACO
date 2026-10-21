"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiMailLine,
  RiPhoneLine,
  RiPlayCircleLine,
  RiQuestionLine,
  RiVolumeUpLine,
  RiWhatsappLine,
} from "@remixicon/react";
import { requestCallback } from "@/app/actions";
import type { Role } from "@/lib/domain";
import type { Guide, GuideStep } from "@/lib/help/guides";
import { CALLBACK_SLOTS } from "@/lib/contact";

// Centro de ayuda: un botón fijo, siempre en el mismo sitio (WCAG 2.2, 3.2.6 "ayuda consistente"),
// que abre un panel con (1) guías paso a paso sobre la página real y (2) formas de hablar con una persona.
// La guía no bloquea la página: se puede seguir usando mientras se lee el paso.

export type ContactInfo = {
  isDemo: boolean;
  phoneDisplay: string;
  phoneHref: string;
  whatsappNumber: string;
  email: string;
  hours: string;
};

// Mensaje de WhatsApp ya escrito, con la página desde la que se pide ayuda.
const PAGE_NAMES: [string, string][] = [
  ["/producto", "una ficha de producto"],
  ["/productor", "la ficha de un productor"],
  ["/buscar", "la búsqueda"],
  ["/panel", "mi panel"],
  ["/entrar", "la entrada"],
  ["/ayuda", "la ayuda"],
];
function whatsappLink(number: string, pathname?: string) {
  const where = PAGE_NAMES.find(([p]) => pathname?.startsWith(p))?.[1] ?? "la portada";
  const text = `Hola, vengo de BACO (estoy en ${where}) y necesito ayuda con: `;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

type TourState = { guideId: string; index: number } | null;
const TOUR_KEY = "baco-tour";
const NUDGE_KEY = "baco-help-nudge";
const START_EVENT = "baco:guide";

// Para lanzar una guía desde cualquier sitio (p. ej. la página /ayuda).
export function startGuide(id: string) {
  window.dispatchEvent(new CustomEvent(START_EVENT, { detail: id }));
}

const onPath = (pathname: string, path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

// La guía activa vive en sessionStorage para sobrevivir a los cambios de página.
// useSyncExternalStore la lee sin desajustes entre servidor (sin guía) y navegador.
const tourListeners = new Set<() => void>();
let memoryTour: string | null = null; // por si el navegador bloquea sessionStorage
function readTourRaw(): string | null {
  try {
    return sessionStorage.getItem(TOUR_KEY);
  } catch {
    return memoryTour;
  }
}
function writeTour(t: TourState) {
  memoryTour = t ? JSON.stringify(t) : null;
  try {
    if (t) sessionStorage.setItem(TOUR_KEY, memoryTour!);
    else sessionStorage.removeItem(TOUR_KEY);
  } catch {}
  tourListeners.forEach((l) => l());
}
function subscribeTour(cb: () => void) {
  tourListeners.add(cb);
  return () => tourListeners.delete(cb);
}

export function HelpCenter({ guides, role, contact }: { guides: Guide[]; role: Role | null; contact: ContactInfo }) {
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tourRaw = useSyncExternalStore(subscribeTour, readTourRaw, () => null);
  const tour = useMemo<TourState>(() => {
    try {
      return tourRaw ? JSON.parse(tourRaw) : null;
    } catch {
      return null;
    }
  }, [tourRaw]);
  const [nudge, setNudge] = useState(false);
  const setTour = writeTour;

  const begin = useCallback(
    (id: string) => {
      const guide = guides.find((g) => g.id === id);
      if (!guide) return;
      dialogRef.current?.close();
      setTour({ guideId: id, index: 0 });
      const first = guide.steps[0];
      if (!onPath(pathname, first.path) && first.href) router.push(first.href);
    },
    [guides, pathname, router, setTour],
  );

  useEffect(() => {
    const onStart = (e: Event) => begin((e as CustomEvent<string>).detail);
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [begin]);

  // Aviso discreto la primera vez que alguien entra en la portada.
  useEffect(() => {
    if (pathname !== "/") return;
    let seen = "1";
    try {
      seen = localStorage.getItem(NUDGE_KEY) ?? "";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setNudge(true), 3500);
    return () => clearTimeout(t);
  }, [pathname]);
  const dismissNudge = () => {
    setNudge(false);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {}
  };

  const openPanel = () => {
    dismissNudge();
    dialogRef.current?.showModal();
  };

  const who: Role | "visitante" = role ?? "visitante";
  const forPage = guides.filter((g) => g.roles.includes(who) && g.pages.some((p) => onPath(pathname, p)));
  const rest = guides.filter((g) => !forPage.includes(g));

  const guide = tour ? guides.find((g) => g.id === tour.guideId) : undefined;

  return (
    <>
      {guide && tour ? (
        <TourOverlay
          key={`${guide.id}-${tour.index}`}
          guide={guide}
          index={tour.index}
          role={role}
          pathname={pathname}
          onMove={(index) => {
            const step = guide.steps[index];
            setTour({ guideId: guide.id, index });
            if (step && !onPath(pathname, step.path) && step.href) router.push(step.href);
          }}
          onGo={(href) => router.push(href)}
          onExit={() => setTour(null)}
        />
      ) : (
        <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 md:right-6 md:bottom-6">
          {nudge && (
            <div role="status" className="help-pop max-w-[260px] rounded-[14px] bg-white p-4 text-[15px] leading-snug text-ink shadow-pop ring-1 ring-line">
              <p className="font-semibold">¿Es tu primera vez?</p>
              <p className="mt-1 text-ink-2">Te enseñamos a buscar en menos de un minuto.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => (dismissNudge(), begin("buscar"))} className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/85">
                  Enséñame
                </button>
                <button onClick={dismissNudge} className="h-10 rounded-full px-3 text-sm font-semibold text-ink-2 hover:bg-paper-2">
                  Ahora no
                </button>
              </div>
            </div>
          )}
          <button
            onClick={openPanel}
            className="help-pop inline-flex h-12 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-[15px] font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700"
            aria-haspopup="dialog"
          >
            <RiQuestionLine className="size-5" aria-hidden />
            <span className="md:hidden">Ayuda</span>
            <span className="hidden md:inline">¿Necesitas ayuda?</span>
          </button>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="help-title"
        className="help-sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[24px] bg-white p-0 text-ink shadow-pop backdrop:bg-ink/40 md:mr-6 md:mb-6 md:ml-auto md:max-h-[calc(100dvh-48px)] md:w-[440px] md:rounded-[24px]"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h2 id="help-title" className="text-xl font-semibold tracking-[-0.02em]">
            ¿En qué te ayudamos?
          </h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-ink"
            aria-label="Cerrar la ayuda"
          >
            <RiCloseLine className="size-6" />
          </button>
        </div>

        <div className="space-y-8 px-6 pt-5 pb-8">
          <section>
            <p className="text-[15px] font-semibold">Te lo enseñamos paso a paso</p>
            <p className="mt-0.5 text-[15px] text-ink-2">Te señalamos en la pantalla qué pulsar. Puedes salir cuando quieras.</p>
            <ul className="mt-3 space-y-2">
              {[...forPage, ...rest].map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => begin(g.id)}
                    className="group flex w-full items-center gap-3 rounded-[14px] border border-line p-4 text-left transition-colors hover:border-ink/30 hover:bg-paper-2"
                  >
                    <RiPlayCircleLine className="size-7 shrink-0 text-sage-700" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">{g.title}</span>
                        {forPage.includes(g) && (
                          <span className="rounded-full bg-sage-50 px-2 py-0.5 text-xs font-semibold text-sage-700">Para esta página</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-2">
                        {g.summary} · {g.steps.length} pasos
                      </span>
                    </span>
                    <RiArrowRightLine className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-[15px] font-semibold">Prefiero hablar con una persona</p>
            <p className="mt-0.5 text-[15px] text-ink-2">{contact.hours}.</p>
            <ContactChannels contact={contact} pathname={pathname} />
          </section>

          <a href="/ayuda" className="flex items-center justify-between rounded-[14px] bg-paper-2 px-4 py-3.5 text-[15px] font-semibold hover:bg-sage-50">
            Preguntas frecuentes y más ayuda <RiArrowRightLine className="size-5" aria-hidden />
          </a>
        </div>
      </dialog>
    </>
  );
}

// --- canales de contacto ----------------------------------------------------------------

export function ContactChannels({ contact, pathname }: { contact: ContactInfo; pathname?: string }) {
  const [callback, setCallback] = useState(false);
  return (
    <div className="mt-3 space-y-2">
      {contact.isDemo && (
        <p className="rounded-[10px] border border-dashed border-line-2 px-3 py-2 text-[13px] text-ink-3">
          Prototipo: el teléfono, el WhatsApp y el correo son de ejemplo.
        </p>
      )}
      {/* Mismo orden en todas partes (WCAG 3.2.6): WhatsApp, llamar, que me llamen, correo */}
      <div className="grid grid-cols-2 gap-2">
        <a href={whatsappLink(contact.whatsappNumber, pathname)} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-[14px] border border-line px-4 py-3 hover:bg-paper-2">
          <RiWhatsappLine className="size-6 shrink-0 text-sage-700" aria-hidden />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold">WhatsApp</span>
            <span className="block text-[13px] text-ink-2">Escríbenos</span>
          </span>
        </a>
        <a href={contact.phoneHref} className="flex min-h-14 items-center gap-3 rounded-[14px] border border-line px-4 py-3 hover:bg-paper-2">
          <RiPhoneLine className="size-6 shrink-0 text-sage-700" aria-hidden />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold">Llamar</span>
            <span className="block text-[13px] text-ink-2 tabular-nums">{contact.phoneDisplay}</span>
          </span>
        </a>
        <button
          onClick={() => setCallback((v) => !v)}
          aria-expanded={callback}
          className={clsx(
            "flex min-h-14 items-center gap-3 rounded-[14px] border px-4 py-3 text-left",
            callback ? "border-ink bg-paper-2" : "border-line hover:bg-paper-2",
          )}
        >
          <RiPhoneLine className="size-6 shrink-0 -scale-x-100 text-sage-700" aria-hidden />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold">Que me llamen</span>
            <span className="block text-[13px] text-ink-2">Te llamamos gratis</span>
          </span>
        </button>
        <a href={`mailto:${contact.email}`} className="flex min-h-14 items-center gap-3 rounded-[14px] border border-line px-4 py-3 hover:bg-paper-2">
          <RiMailLine className="size-6 shrink-0 text-sage-700" aria-hidden />
          <span className="min-w-0 leading-tight">
            <span className="block text-[15px] font-semibold">Correo</span>
            <span className="block truncate text-[13px] text-ink-2">{contact.email}</span>
          </span>
        </a>
      </div>
      {callback && <CallbackForm pathname={pathname} />}
      <p className="text-[13px] leading-snug text-ink-3">
        Por correo respondemos en 2 días laborables como mucho. Por WhatsApp, tus mensajes pasan por Meta: no envíes datos delicados.
      </p>
    </div>
  );
}

function CallbackForm({ pathname }: { pathname?: string }) {
  const [state, action, pending] = useActionState(requestCallback, null);
  const v = state?.values ?? {};
  const field = "h-12 w-full rounded-[12px] border border-line-2 bg-white px-3.5 text-base outline-none focus:border-ink";
  if (state?.ok) {
    return (
      <p role="status" className="help-pop rounded-[14px] bg-sage-50 p-4 text-[15px] font-semibold text-sage-700">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="help-pop space-y-3 rounded-[14px] border border-line p-4">
      <input type="hidden" name="page" value={pathname ?? ""} />
      <label className="block">
        <span className="mb-1 block text-[15px] font-semibold">Tu nombre</span>
        <input name="name" required autoComplete="name" defaultValue={v.name} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[15px] font-semibold">Tu teléfono</span>
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="612 345 678" defaultValue={v.phone} aria-describedby="cb-error" className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[15px] font-semibold">¿Cuándo te viene mejor?</span>
        <select name="slot" defaultValue={v.slot ?? "cualquiera"} className={field}>
          {Object.entries(CALLBACK_SLOTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[15px] font-semibold">
          ¿Sobre qué? <span className="font-normal text-ink-3">(si quieres)</span>
        </span>
        <input name="topic" defaultValue={v.topic} className={field} placeholder="Ej. quiero dar de alta mis quesos" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-snug text-ink-2">
        <input type="checkbox" name="consent" required defaultChecked={v.consent === "on"} className="mt-0.5 size-5 shrink-0 accent-[#2E5B47]" />
        <span>
          Acepto que usen mi nombre y teléfono solo para devolverme la llamada.{" "}
          <a href="/ayuda#privacidad" className="font-semibold text-ink underline underline-offset-2">
            Más información
          </a>
        </span>
      </label>
      {state && !state.ok && (
        <p id="cb-error" role="alert" className="rounded-[10px] bg-clay-50 px-3 py-2 text-[15px] font-medium text-clay">
          {state.message}
        </p>
      )}
      <button disabled={pending} className="h-12 w-full rounded-full bg-ink text-base font-semibold text-white hover:bg-ink/85 disabled:opacity-60">
        {pending ? "Enviando…" : "Pedir que me llamen"}
      </button>
    </form>
  );
}

// --- guía paso a paso ----------------------------------------------------------------------

type Rect = { top: number; left: number; width: number; height: number };

function findTarget(name: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-help="${name}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function TourOverlay({
  guide,
  index,
  role,
  pathname,
  onMove,
  onGo,
  onExit,
}: {
  guide: Guide;
  index: number;
  role: Role | null;
  pathname: string;
  onMove: (index: number) => void;
  onGo: (href: string) => void;
  onExit: () => void;
}) {
  const step: GuideStep | undefined = guide.steps[index];
  const total = guide.steps.length;
  const here = step ? onPath(pathname, step.path) : false;
  const wrongRole = Boolean(step?.role && role !== step.role);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [cardH, setCardH] = useState(220);

  // Busca el elemento a señalar (la página puede tardar un poco en pintarse tras navegar).
  // El resultado se guarda con la ruta en la que se buscó, para no reutilizarlo en otra página.
  const needsSearch = Boolean(step?.target && here && !wrongRole);
  const [found, setFound] = useState<{ path: string; el: HTMLElement | null } | null>(null);
  const target = needsSearch && found?.path === pathname ? found.el : null;
  const searching = needsSearch && found?.path !== pathname;
  useEffect(() => {
    if (!needsSearch || !step?.target) return;
    let tries = 0;
    const id = setInterval(() => {
      const el = findTarget(step.target!);
      if (el || ++tries > 20) {
        clearInterval(id);
        setFound({ path: pathname, el });
        if (el) {
          // En el móvil la tarjeta ocupa la parte de abajo: el elemento se deja en el tercio superior.
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const behavior = reduce ? "auto" : "smooth";
          if (window.innerWidth < 768) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior });
          else el.scrollIntoView({ block: "center", behavior });
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [needsSearch, step, pathname]);

  // Un paso opcional cuyo elemento no está (p. ej. sin sesión) se salta solo.
  useEffect(() => {
    if (!searching && step?.optional && here && !wrongRole && !target) onMove(index + 1 < total ? index + 1 : index);
  }, [searching, step, here, wrongRole, target, index, total, onMove]);

  // Sigue al elemento si la página se desplaza o cambia de tamaño.
  const [tracked, setTracked] = useState<Rect | null>(null);
  const rect = target ? tracked : null;
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    const tick = () => {
      const r = target.getBoundingClientRect();
      setTracked((prev) =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [target]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const ro = new ResizeObserver(() => setCardH(card.offsetHeight));
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  useEffect(() => {
    if (!step) onExit();
  }, [step, onExit]);
  if (!step) return null;

  const last = index === total - 1;
  const pad = 8;

  // Posición de la tarjeta: en el móvil, abajo; en pantallas grandes, junto al elemento.
  let cardStyle: React.CSSProperties | undefined;
  // Si el elemento es muy alto (una lista entera), la tarjeta va a la esquina para no taparlo.
  if (rect && typeof window !== "undefined" && window.innerWidth >= 768 && rect.height < window.innerHeight * 0.45) {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const below = rect.top + rect.height + pad + 16;
    const top = below + cardH < vh - 16 ? below : Math.max(16, rect.top - pad - 16 - cardH);
    const left = Math.min(Math.max(16, rect.left), vw - 400 - 16);
    cardStyle = { top, left };
  }

  let body: React.ReactNode = <p className="text-base leading-relaxed text-ink-2">{step.text}</p>;
  let primary: React.ReactNode = (
    <button
      onClick={() => (last ? onExit() : onMove(index + 1))}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-white hover:bg-ink/85"
    >
      {last ? "Terminar" : "Siguiente"} {!last && <RiArrowRightLine className="size-5" aria-hidden />}
    </button>
  );
  if (wrongRole) {
    body = (
      <p className="text-base leading-relaxed text-ink-2">
        Este paso es para cuentas de {step.role}. Entra con esa cuenta y seguimos donde lo dejamos.
      </p>
    );
    primary = (
      <button onClick={() => onGo(`/entrar?rol=${step.role}&next=${encodeURIComponent(step.href ?? step.path)}`)} className="h-12 rounded-full bg-ink px-6 text-base font-semibold text-white hover:bg-ink/85">
        Entrar como {step.role}
      </button>
    );
  } else if (!here) {
    body = <p className="text-base leading-relaxed text-ink-2">Este paso está en otra página. Te llevamos allí.</p>;
    primary = (
      <button onClick={() => onGo(step.href ?? step.path)} className="h-12 rounded-full bg-ink px-6 text-base font-semibold text-white hover:bg-ink/85">
        Ir allí
      </button>
    );
  }

  return (
    <>
      {rect && (
        <div
          aria-hidden
          className="tour-spot pointer-events-none fixed z-[60] rounded-[16px]"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        className={clsx(
          "help-pop fixed z-[61] rounded-[20px] bg-white p-5 text-ink shadow-pop ring-1 ring-line",
          cardStyle ? "w-[400px]" : "inset-x-3 bottom-3 md:inset-x-auto md:right-6 md:bottom-6 md:w-[400px]",
        )}
        style={cardStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-sage-700">
            {guide.title} · paso {index + 1} de {total}
          </p>
          <button onClick={onExit} className="-mr-2 inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
            Salir <RiCloseLine className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {guide.steps.map((_, i) => (
            <span key={i} className={clsx("h-1.5 flex-1 rounded-full transition-colors", i <= index ? "bg-sage-700" : "bg-line")} />
          ))}
        </div>
        <h2 id="tour-title" ref={titleRef} tabIndex={-1} className="mt-4 text-lg leading-snug font-semibold tracking-[-0.01em] outline-none">
          {step.title}
        </h2>
        <div className="mt-1.5" aria-live="polite">
          {body}
        </div>
        {here && !wrongRole && <SpeakButton text={`${step.title}. ${step.text}`} />}
        <div className="mt-5 flex items-center justify-between gap-3">
          {index > 0 ? (
            <button onClick={() => onMove(index - 1)} className="inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-base font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
              <RiArrowLeftLine className="size-5" aria-hidden /> Atrás
            </button>
          ) : (
            <span />
          )}
          {primary}
        </div>
      </div>
    </>
  );
}

// Lee el paso en voz alta con la voz del navegador (sin servicios externos). Útil con las manos ocupadas.
function SpeakButton({ text }: { text: string }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  if (!supported) return null;
  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang.startsWith("es"));
    if (voice) u.voice = voice;
    synth.speak(u);
  };
  return (
    <button onClick={speak} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
      <RiVolumeUpLine className="size-5" aria-hidden /> Escúchalo
    </button>
  );
}

// Botón para lanzar una guía desde contenido de servidor (página /ayuda).
export function StartGuideButton({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={() => startGuide(id)} className={className}>
      {children}
    </button>
  );
}
