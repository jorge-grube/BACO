"use client";

import { useActionState, useState } from "react";
import clsx from "clsx";
import { addReview, sendRequest, updateProducer, type ActionState } from "@/app/actions";
import { REQUEST_TYPES, type RequestType } from "@/lib/domain";

const DEFAULT_MESSAGE: Record<RequestType, (product: string) => string> = {
  muestra: (p) => `Hola, nos interesa ${p} para nuestra carta. ¿Podríais enviarnos una muestra?`,
  pedido: (p) => `Hola, queremos hacer un pedido de ${p}. ¿Qué precio y plazo de entrega tenéis?`,
  contacto: (p) => `Hola, me gustaría saber más sobre ${p}.`,
};

const SEGMENT: Record<RequestType, string> = { muestra: "Muestra", pedido: "Precio", contacto: "Pregunta" };

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={clsx(
        "help-pop flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[15px] font-medium",
        state.ok ? "bg-sage-50 text-sage-700" : "bg-clay-50 text-clay",
      )}
    >
      {state.ok && (
        <svg viewBox="0 0 24 24" className="draw-check mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
      {state.message}
    </p>
  );
}

export function RequestForm({
  productId,
  productName,
  unit,
  allowed,
}: {
  productId: number;
  productName: string;
  unit: string;
  allowed: RequestType[];
}) {
  const [state, action, pending] = useActionState(sendRequest, null);
  const [type, setType] = useState<RequestType>(allowed[0]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE[allowed[0]](productName.toLowerCase()));

  if (state?.ok) {
    return (
      <div className="space-y-3">
        <Feedback state={state} />
        <a href="/panel" className="flex h-11 items-center justify-center text-[15px] font-semibold underline underline-offset-2">
          Ver mis peticiones
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="type" value={type} />
      {allowed.length > 1 && (
        <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-paper-2 p-1" role="radiogroup" aria-label="Tipo de solicitud" data-help="request-type">
          {allowed.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => {
                setType(t);
                setMessage(DEFAULT_MESSAGE[t](productName.toLowerCase()));
              }}
              className={clsx(
                "h-11 rounded-[9px] text-sm font-semibold transition-colors",
                type === t ? "bg-white text-ink shadow-card" : "text-ink-3 hover:text-ink",
              )}
            >
              {SEGMENT[t]}
            </button>
          ))}
        </div>
      )}
      {type !== "contacto" && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink-2">
            Cantidad <span className="font-normal text-ink-3">(si lo sabes)</span>
          </span>
          <input
            name="quantity"
            placeholder={type === "muestra" ? "Ej. 1 pieza" : `Ej. 20 ${unit === "botella" ? "botellas" : unit} al mes`}
            className="h-11 w-full rounded-[10px] border border-line-2 px-3 text-base outline-none focus:border-ink"
          />
        </label>
      )}
      <label className="block" data-help="request-message">
        <span className="mb-1 block text-sm font-semibold text-ink-2">Mensaje para el productor</span>
        <textarea
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none rounded-[10px] border border-line-2 px-3 py-2 text-base leading-relaxed outline-none focus:border-ink"
        />
      </label>
      <Feedback state={state} />
      <button disabled={pending} className="h-12 w-full rounded-full bg-ink text-base font-semibold text-white transition-transform hover:bg-ink/85 active:scale-[0.98] disabled:opacity-60">
        {pending ? "Enviando…" : REQUEST_TYPES[type]}
      </button>
    </form>
  );
}

export function ReviewForm({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState(addReview, null);
  const [rating, setRating] = useState(0);
  if (state?.ok) return <Feedback state={state} />;
  return (
    <form action={action} className="space-y-3 rounded-md border border-line p-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold">Tu nota</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Valoración de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              onClick={() => setRating(n)}
              className={clsx(
                "grid size-11 place-items-center rounded-[10px] border text-[15px] font-semibold tabular-nums transition-[color,background-color,transform] active:scale-90",
                n <= rating ? "border-ink bg-ink text-white" : "border-line text-ink-3 hover:border-line-2 hover:text-ink",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <textarea
        name="text"
        rows={2}
        aria-label="Tu opinión (opcional)"
        placeholder="¿Cómo lo usáis? ¿Qué tal el servicio?"
        className="w-full resize-none rounded-[10px] border border-line-2 px-3 py-2 text-base outline-none focus:border-ink"
      />
      <Feedback state={state} />
      <button disabled={pending || !rating} className="h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-white disabled:opacity-40">
        Publicar reseña
      </button>
    </form>
  );
}

export function ProducerForm({
  values,
}: {
  values: { description: string | null; phone: string | null; website: string | null; capacity_note: string | null };
}) {
  const [state, action, pending] = useActionState(updateProducer, null);
  const field = "w-full rounded-[10px] border border-line-2 px-3 text-base outline-none focus:border-ink";
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink-2">Qué haces, en pocas palabras</span>
        <textarea name="description" rows={3} defaultValue={values.description ?? ""} className={`${field} resize-none py-2`} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink-2">Qué ofreces a restaurantes (cantidades, reparto…)</span>
        <textarea name="capacity_note" rows={2} defaultValue={values.capacity_note ?? ""} className={`${field} resize-none py-2`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink-2">Teléfono</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={values.phone ?? ""} className={`${field} h-11`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink-2">
            Página web <span className="font-normal text-ink-3">(si tienes)</span>
          </span>
          <input name="website" type="url" inputMode="url" defaultValue={values.website ?? ""} placeholder="https://" className={`${field} h-11`} />
        </label>
      </div>
      <Feedback state={state} />
      <button disabled={pending} className="h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-white disabled:opacity-50">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
