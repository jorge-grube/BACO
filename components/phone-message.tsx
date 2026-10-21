import Link from "next/link";
import { RiChat3Line, RiMailLine, RiWhatsappLine } from "@remixicon/react";
import type { Notification } from "@/lib/db/repo";

const CHANNEL = {
  whatsapp: { name: "WhatsApp", Icon: RiWhatsappLine },
  sms: { name: "SMS", Icon: RiChat3Line },
  email: { name: "Correo", Icon: RiMailLine },
} as const;

export function ago(sqlDate: string) {
  const then = new Date(sqlDate.replace(" ", "T") + "Z").getTime();
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

// Cómo se ve en el móvil un aviso que BACO "envía". En la demo no sale del servidor.
export function PhoneMessage({ n, to }: { n: Pick<Notification, "channel" | "title" | "body" | "link" | "created_at" | "phone">; to?: string | null }) {
  const c = CHANNEL[n.channel];
  return (
    <article className="rounded-[18px] border border-line bg-paper-2 p-3">
      <header className="flex items-center gap-2 px-1 text-[13px] text-ink-2">
        <c.Icon className="size-4 text-sage-700" aria-hidden />
        <span className="font-semibold text-ink">{c.name}</span>
        {to && <span className="truncate">· para {to}</span>}
        <span className="ml-auto shrink-0">{ago(n.created_at)}</span>
      </header>
      <div className="mt-2 rounded-[14px] rounded-tl-[4px] bg-white p-3.5 shadow-card">
        <p className="text-[15px] font-semibold">{n.title}</p>
        <p className="mt-0.5 text-[15px] leading-relaxed text-ink-2">{n.body}</p>
        {n.link && (
          <Link href={n.link} className="mt-2 inline-flex min-h-11 items-center text-[15px] font-semibold text-sage-700 underline underline-offset-2">
            {n.link.startsWith("/r/") ? "Contestar ahora" : n.link.startsWith("/revisar/") ? "Revisar mi página" : "Abrir en BACO"}
          </Link>
        )}
      </div>
    </article>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[12px] border border-dashed border-line-2 px-3.5 py-2.5 text-sm leading-relaxed text-ink-2">
      <span className="font-semibold text-ink">Demo: </span>
      {children}
    </p>
  );
}
