"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import {
  requestStallSlot,
  reserveStall,
  respondByLink,
  reviewOnboarding,
  signupAgenda,
  startPhoneLogin,
  teamCreateOnboarding,
  verifyPhoneLogin,
  type ActionState,
} from "@/app/actions";

// Formularios de las partes nuevas. Mismo patrón en todos (pensado para gente poco digital):
// etiqueta visible encima, letra de 16 px, campos de 48 px, el error dice qué pasa y cómo arreglarlo,
// y si algo falla no se pierde lo escrito (la acción devuelve `values`).

export const fieldClass = "h-12 w-full rounded-[12px] border border-line-2 bg-white px-3.5 text-base outline-none focus:border-ink";
const areaClass = "w-full resize-none rounded-[12px] border border-line-2 bg-white px-3.5 py-2.5 text-base leading-relaxed outline-none focus:border-ink";
const primary = "h-12 w-full rounded-full bg-ink px-6 text-base font-semibold text-white transition-transform hover:bg-ink/85 active:scale-[0.98] disabled:opacity-60";

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[15px] font-semibold">
      {children} {optional && <span className="font-normal text-ink-3">(si quieres)</span>}
    </label>
  );
}

// Tras enviar, el foco va al mensaje (error o éxito) para que quien usa teclado o lector de pantalla sepa qué ha pasado.
function ErrorBox({ state, id }: { state: ActionState; id: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state && !state.ok) ref.current?.focus();
  }, [state]);
  if (!state || state.ok) return null;
  return (
    <p ref={ref} tabIndex={-1} id={id} role="alert" className="help-pop outline-none focus-visible:ring-2 focus-visible:ring-clay rounded-[12px] bg-clay-50 px-3.5 py-2.5 text-[15px] font-medium text-clay">
      {state.message}
    </p>
  );
}

export function SuccessBox({ children, focus }: { children: React.ReactNode; focus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  return (
    <div ref={ref} tabIndex={focus ? -1 : undefined} role="status" className="help-pop outline-none flex items-start gap-3 rounded-[16px] bg-sage-50 p-4 text-[15px] leading-relaxed text-sage-700">
      <svg viewBox="0 0 24 24" className="draw-check mt-0.5 size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      <div className="min-w-0 flex-1 font-medium">{children}</div>
    </div>
  );
}

function Consent({ id, defaultChecked, children }: { id: string; defaultChecked?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
      <input id={id} type="checkbox" name="consent" required defaultChecked={defaultChecked} className="mt-0.5 size-6 shrink-0 accent-[#2E5B47]" />
      <span>{children}</span>
    </label>
  );
}

// --- entrar con el móvil -----------------------------------------------------------------------

export function PhoneLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(startPhoneLogin, null);
  const id = useId();
  const v = state?.values ?? {};
  return (
    <form action={action} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor={`${id}-phone`}>Tu número de móvil</Label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="612 345 678"
          defaultValue={v.phone}
          aria-describedby={`${id}-hint ${id}-err`}
          className={fieldClass}
        />
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-3">
          Te mandamos un código por SMS. Sin contraseñas.
        </p>
      </div>
      <ErrorBox state={state} id={`${id}-err`} />
      <button disabled={pending} className={primary}>
        {pending ? "Enviando…" : "Enviarme el código"}
      </button>
    </form>
  );
}

export function CodeForm({ phone, next }: { phone: string; next?: string }) {
  const [state, action, pending] = useActionState(verifyPhoneLogin, null);
  const id = useId();
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="phone" value={phone} />
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor={`${id}-code`}>Código de 6 números</Label>
        <input
          id={`${id}-code`}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          aria-describedby={`${id}-err`}
          className={clsx(fieldClass, "text-center text-2xl tracking-[0.4em] tabular-nums")}
        />
      </div>
      <ErrorBox state={state} id={`${id}-err`} />
      <button disabled={pending} className={primary}>
        {pending ? "Comprobando…" : "Entrar"}
      </button>
    </form>
  );
}

// --- responder desde el WhatsApp ----------------------------------------------------------------

export function RespondByLinkForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(respondByLink, null);
  const [writing, setWriting] = useState(false);
  const id = useId();
  if (state?.ok) return <SuccessBox focus>{state.message}</SuccessBox>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {!writing ? (
        <div className="grid gap-2">
          <button name="choice" value="si" disabled={pending} className={primary}>
            Sí, puedo. Le llamo para concretar
          </button>
          <button name="choice" value="no" disabled={pending} className="h-12 w-full rounded-full border border-line-2 bg-white text-base font-semibold hover:bg-paper-2">
            No puedo esta vez
          </button>
          <button type="button" onClick={() => setWriting(true)} className="h-12 w-full rounded-full text-base font-semibold text-ink-2 underline underline-offset-2 hover:text-ink">
            Prefiero escribir la respuesta
          </button>
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor={`${id}-reply`}>Tu respuesta al restaurante</Label>
            <textarea id={`${id}-reply`} name="reply" rows={4} required defaultValue={state?.values?.reply} aria-describedby={`${id}-err`} className={areaClass} placeholder="Precio, plazo, qué día llevas la muestra…" />
          </div>
          <button name="choice" value="texto" disabled={pending} className={primary}>
            {pending ? "Enviando…" : "Enviar respuesta"}
          </button>
        </>
      )}
      <ErrorBox state={state} id={`${id}-err`} />
    </form>
  );
}

// --- alta asistida: revisar y publicar --------------------------------------------------------------

export function ReviewOnboardingForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(reviewOnboarding, null);
  const [changes, setChanges] = useState(false);
  const id = useId();
  if (state?.ok) return <SuccessBox focus>{state.message}</SuccessBox>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {!changes ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button name="decision" value="publicar" disabled={pending} className={primary}>
            Está bien, publicar
          </button>
          <button type="button" onClick={() => setChanges(true)} className="h-12 w-full rounded-full border border-line-2 bg-white text-base font-semibold hover:bg-paper-2">
            Quiero cambiar algo
          </button>
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor={`${id}-fb`}>¿Qué quieres cambiar?</Label>
            <textarea id={`${id}-fb`} name="feedback" rows={3} required defaultValue={state?.values?.feedback} aria-describedby={`${id}-err`} className={areaClass} placeholder="Por ejemplo: el teléfono, la descripción, una foto…" />
          </div>
          <button name="decision" value="cambios" disabled={pending} className={primary}>
            {pending ? "Enviando…" : "Enviar al equipo"}
          </button>
        </>
      )}
      <ErrorBox state={state} id={`${id}-err`} />
    </form>
  );
}

// --- puesto: reservar para recoger --------------------------------------------------------------------

export function ReserveForm({ slotId, max, name, phone, unitPrice, loggedIn }: { slotId: number; max: number; name?: string; phone?: string; unitPrice: number; loggedIn?: boolean }) {
  const [state, action, pending] = useActionState(reserveStall, null);
  const id = useId();
  const v = state?.values ?? {};
  const [qtyText, setQtyText] = useState(v.quantity ?? "1");
  const qty = Math.max(0, Number(qtyText) || 0);
  const setQty = (f: (q: number) => number) => setQtyText(String(f(Math.max(1, qty))));
  if (state?.ok) {
    return (
      <SuccessBox focus>
        <p>Reservado. Tu código de recogida es:</p>
        <p className="my-2 text-3xl font-semibold tracking-[0.06em] text-ink tabular-nums">{state.message}</p>
        <p>Te lo hemos mandado por SMS. Enséñalo en el puesto y pagas allí.</p>
      </SuccessBox>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slotId" value={slotId} />
      <div>
        <Label htmlFor={`${id}-qty`}>¿Cuántas unidades?</Label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center rounded-full border border-line-2 text-xl font-semibold" aria-label="Una menos">
            −
          </button>
          <input
            id={`${id}-qty`}
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, Math.min(10, max))}
            value={qtyText}
            onChange={(e) => setQtyText(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={() => setQtyText(String(Math.min(Math.max(1, qty), Math.max(1, Math.min(10, max)))))}
            className={clsx(fieldClass, "w-24 text-center tabular-nums")}
          />
          <button type="button" onClick={() => setQty((q) => Math.min(Math.min(10, max), q + 1))} className="grid size-12 place-items-center rounded-full border border-line-2 text-xl font-semibold" aria-label="Una más">
            +
          </button>
          <p className="ml-2 text-[15px] text-ink-2" aria-live="polite">
            Total: <span className="font-semibold text-ink tabular-nums">{(qty * unitPrice).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor={`${id}-name`}>Tu nombre</Label>
        <input id={`${id}-name`} name="name" required autoComplete="name" defaultValue={v.name ?? name} className={fieldClass} />
      </div>
      <div>
        <Label htmlFor={`${id}-phone`}>Tu móvil</Label>
        <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="612 345 678" defaultValue={v.phone ?? phone} aria-describedby={`${id}-ph`} className={fieldClass} />
        <p id={`${id}-ph`} className="mt-1 text-sm text-ink-3">
          Te mandamos el código de recogida por SMS.
        </p>
      </div>
      <Consent id={`${id}-consent`} defaultChecked={v.consent === "on"}>
        Acepto que usen mi nombre y móvil solo para esta reserva.{" "}
        <a href="/privacidad" className="font-semibold text-ink underline underline-offset-2">
          Privacidad
        </a>
      </Consent>
      <ErrorBox state={state} id={`${id}-err`} />
      <button disabled={pending} className={primary}>
        {pending ? "Reservando…" : "Reservar para recoger"}
      </button>
      <p className="text-sm text-ink-3">No pagas nada ahora. Si no puedes ir, {loggedIn ? "cancela la reserva desde tu panel o escríbenos" : "escríbenos o llámanos con tu código y la anulamos"}.</p>
    </form>
  );
}

// --- puesto: el productor se apunta ----------------------------------------------------------------------

export function StallSlotForm({
  days,
  products,
  defaultDay,
}: {
  days: { id: number; label: string; deadline: string }[];
  products: { id: number; name: string; format: string; price: number }[];
  defaultDay?: number;
}) {
  const [state, action, pending] = useActionState(requestStallSlot, null);
  const id = useId();
  const v = state?.values ?? {};
  const [productId, setProductId] = useState(Number(v.productId) || products[0]?.id || 0);
  const [qtyText, setQtyText] = useState(v.quantity ?? "10");
  const qty = Math.max(0, Number(qtyText) || 0);
  const product = products.find((p) => p.id === productId);
  if (state?.ok) return <SuccessBox focus>{state.message}</SuccessBox>;
  const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor={`${id}-day`}>¿Qué día?</Label>
        <select id={`${id}-day`} name="dayId" defaultValue={v.dayId ?? defaultDay ?? days[0]?.id} className={fieldClass}>
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${id}-product`}>¿Qué producto?</Label>
        <select id={`${id}-product`} name="productId" value={productId} onChange={(e) => setProductId(Number(e.target.value))} className={fieldClass}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {product && (
          <p className="mt-1 text-sm text-ink-2">
            Se vende en formato «{product.format}» a {euros(product.price)} <span className="text-ink-3">(precio de ejemplo; lo ajustamos contigo)</span>
          </p>
        )}
      </div>
      <div>
        <Label htmlFor={`${id}-qty`}>¿Cuántas unidades llevas?</Label>
        <input id={`${id}-qty`} name="quantity" type="number" inputMode="numeric" min={1} max={200} value={qtyText} onChange={(e) => setQtyText(e.target.value.replace(/\D/g, "").slice(0, 3))} onBlur={() => setQtyText(String(Math.min(200, Math.max(1, qty))))} className={clsx(fieldClass, "w-32 tabular-nums")} />
      </div>
      {product && (
        <div className="rounded-[14px] bg-paper-2 p-4 text-[15px] leading-relaxed" aria-live="polite">
          <p>
            Si se vende todo: <span className="font-semibold tabular-nums">{euros(qty * product.price)}</span>
          </p>
          <p>
            Comisión del puesto (15 %): <span className="tabular-nums">−{euros(qty * product.price * 0.15)}</span>
          </p>
          <p className="font-semibold">
            Para ti: <span className="tabular-nums">{euros(qty * product.price * 0.85)}</span>
          </p>
          <p className="mt-1 text-sm text-ink-3">Lo que no se venda te lo devolvemos. Cobras en 7 días. (Condiciones de ejemplo.)</p>
        </div>
      )}
      <div>
        <Label htmlFor={`${id}-note`} optional>
          ¿Algo que debamos saber?
        </Label>
        <input id={`${id}-note`} name="note" defaultValue={v.note} placeholder="Ej. necesita frío" className={fieldClass} />
      </div>
      <label className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
        <input type="checkbox" name="accept" required defaultChecked={v.accept === "on"} className="mt-0.5 size-6 shrink-0 accent-[#2E5B47]" />
        <span>Acepto las condiciones del puesto: dejo el producto en depósito, BACO lo vende en mi nombre y se queda el 15 % de lo vendido.</span>
      </label>
      <ErrorBox state={state} id={`${id}-err`} />
      <button disabled={pending} className={primary}>
        {pending ? "Enviando…" : "Apuntarme al puesto"}
      </button>
    </form>
  );
}

// --- agenda: apuntarse ---------------------------------------------------------------------------------------

export function SignupForm({ agendaId, name, phone, full }: { agendaId: number; name?: string; phone?: string; full?: boolean }) {
  const [state, action, pending] = useActionState(signupAgenda, null);
  const id = useId();
  const v = state?.values ?? {};
  if (state?.ok) return <SuccessBox focus>{state.message}</SuccessBox>;
  if (full) return <p className="rounded-[12px] bg-paper-2 p-4 text-[15px]">No quedan plazas. Pide que te llamemos y te avisamos si se libera alguna.</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="agendaId" value={agendaId} />
      <div>
        <Label htmlFor={`${id}-name`}>Tu nombre</Label>
        <input id={`${id}-name`} name="name" required autoComplete="name" defaultValue={v.name ?? name} className={fieldClass} />
      </div>
      <div>
        <Label htmlFor={`${id}-phone`}>Tu móvil</Label>
        <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="612 345 678" defaultValue={v.phone ?? phone} className={fieldClass} />
      </div>
      <Consent id={`${id}-consent`} defaultChecked={v.consent === "on"}>
        Acepto que usen mi nombre y móvil solo para esta actividad.{" "}
        <a href="/privacidad" className="font-semibold text-ink underline underline-offset-2">
          Privacidad
        </a>
      </Consent>
      <ErrorBox state={state} id={`${id}-err`} />
      <button disabled={pending} className={primary}>
        {pending ? "Apuntando…" : "Apuntarme"}
      </button>
    </form>
  );
}

// --- equipo: preparar un alta asistida --------------------------------------------------------------------------

export function OnboardingForm({ producers }: { producers: { id: number; name: string; municipality: string }[] }) {
  const [state, action, pending] = useActionState(teamCreateOnboarding, null);
  const id = useId();
  const v = state?.values ?? {};
  return (
    <form action={action} className="space-y-3" key={state?.ok ? "done" : "form"}>
      <div>
        <Label htmlFor={`${id}-producer`}>Productor (del catálogo)</Label>
        <select id={`${id}-producer`} name="producerId" required defaultValue={v.producerId ?? ""} className={fieldClass}>
          <option value="" disabled>
            Elige…
          </option>
          {producers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.municipality}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-contact`}>Persona de contacto</Label>
          <input id={`${id}-contact`} name="contactName" required defaultValue={v.contactName} className={fieldClass} />
        </div>
        <div>
          <Label htmlFor={`${id}-phone`}>Su móvil (para el WhatsApp)</Label>
          <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" required defaultValue={v.phone} placeholder="612 345 678" className={fieldClass} />
        </div>
      </div>
      <div>
        <Label htmlFor={`${id}-met`} optional>
          Dónde le conocimos
        </Label>
        <input id={`${id}-met`} name="metAt" defaultValue={v.metAt} placeholder="Ej. Día de Mercado" className={fieldClass} />
      </div>
      <div>
        <Label htmlFor={`${id}-desc`} optional>
          Qué hace, en sus palabras
        </Label>
        <textarea id={`${id}-desc`} name="description" rows={2} defaultValue={v.description} className={areaClass} />
      </div>
      <div>
        <Label htmlFor={`${id}-cap`} optional>
          Qué ofrece a restaurantes
        </Label>
        <input id={`${id}-cap`} name="capacityNote" defaultValue={v.capacityNote} placeholder="Cantidades, reparto, plazos" className={fieldClass} />
      </div>
      <div>
        <Label htmlFor={`${id}-web`} optional>
          Web
        </Label>
        <input id={`${id}-web`} name="website" type="url" defaultValue={v.website} placeholder="https://" className={fieldClass} />
      </div>
      <label className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
        <input type="checkbox" name="consent" required className="mt-0.5 size-6 shrink-0 accent-[#2E5B47]" />
        <span>El productor ha dado permiso para usar sus datos y fotos en BACO.</span>
      </label>
      <ErrorBox state={state} id={`${id}-err`} />
      {state?.ok && <SuccessBox focus>{state.message}</SuccessBox>}
      <div className="grid gap-2 sm:grid-cols-2">
        <button name="send" value="1" disabled={pending} className={primary}>
          Preparar y enviar por WhatsApp
        </button>
        <button name="send" value="0" disabled={pending} className="h-12 w-full rounded-full border border-line-2 bg-white text-base font-semibold hover:bg-paper-2">
          Guardar como borrador
        </button>
      </div>
    </form>
  );
}
