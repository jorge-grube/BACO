import type { Metadata } from "next";
import Link from "next/link";
import { RespondByLinkForm, SuccessBox } from "@/components/forms-extra";
import { Shot } from "@/components/shot";
import { getMagicLink, getRequest } from "@/lib/db/repo";
import { REQUEST_TYPES } from "@/lib/domain";
import { productPhoto } from "@/lib/photos";

export const metadata: Metadata = { title: "Contestar a un restaurante", robots: { index: false } };

// Pantalla única a la que lleva el WhatsApp: el productor contesta sin entrar ni recordar nada.
export default async function RespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = getMagicLink(token);
  const r = link?.purpose === "responder" && link.request_id ? getRequest(link.request_id) : undefined;
  if (!r) {
    return (
      <div className="mx-auto max-w-md px-5 pt-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Este enlace ya no sirve</h1>
        <p className="mt-2 text-[17px] text-ink-2">Puede que haya caducado. Entra en BACO con tu móvil para ver tus mensajes, o pulsa «Ayuda» y te llamamos.</p>
        <Link href="/entrar" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-base font-semibold text-white">
          Entrar con mi móvil
        </Link>
      </div>
    );
  }
  const answered = r.status === "respondida" || r.status === "cerrada";
  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <p className="label">Mensaje para {r.producer_name}</p>
      <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.03em]">
        {r.from_business ?? r.from_name} {r.type === "muestra" ? "te pide una muestra" : r.type === "pedido" ? "te pide precio y plazo" : "te hace una pregunta"}
      </h1>
      <div className="mt-5 flex gap-3 rounded-[16px] border border-line p-4" data-help="respond-request">
        {r.product_id && r.product_name && r.product_category && (
          <Shot photo={productPhoto({ id: r.product_id, name: r.product_name, category: r.product_category })} sizes="64px" className="size-16 shrink-0 rounded-[10px]" />
        )}
        <div className="min-w-0 text-[15px] leading-relaxed">
          <p className="font-semibold">{REQUEST_TYPES[r.type]}{r.product_name ? ` · ${r.product_name}` : ""}</p>
          {r.quantity && <p className="text-ink-2">Cantidad: {r.quantity}</p>}
          <p className="mt-1 text-ink-2">«{r.message}»</p>
          <p className="mt-1 text-sm text-ink-3">{[r.from_business_type, r.from_municipality].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="mt-6" data-help="respond-buttons">
        {answered ? <SuccessBox>Ya contestaste: «{r.reply}». ¡Gracias!</SuccessBox> : <RespondByLinkForm token={token} />}
      </div>
      <p className="mt-6 text-sm text-ink-3">No hace falta entrar en BACO para contestar. Tu respuesta le llega al restaurante por WhatsApp.</p>
    </div>
  );
}
