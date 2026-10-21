import { db } from "@/lib/db/client";
import { demoProfiles, producerOwnedBy, productsByProducer, slotsForDay, stallDays, upcomingAgenda } from "@/lib/db/repo";

// Destinos de ejemplo que usan las guías para llevar al usuario a una página concreta.
export type DemoTargets = {
  productId: number;
  producerId: number | null;
  slotId: number | null;
  agendaId: number | null;
  respondHref: string;
  reviewHref: string;
};

// Último enlace de WhatsApp de ese tipo que sigue vivo; si no hay, la página de avisos.
function latestLink(prefix: string) {
  const row = db()
    .prepare(
      `SELECT n.link FROM notifications n JOIN magic_links m ON m.token = substr(n.link, ?)
       WHERE n.link LIKE ? AND m.expires_at > datetime('now') ORDER BY n.id DESC LIMIT 1`,
    )
    .get(prefix.length + 1, `${prefix}%`) as { link: string } | undefined;
  return row?.link ?? "/demo/avisos";
}

export function demoTargets(): DemoTargets {
  const owner = demoProfiles().find((p) => p.role === "productor");
  const producer = owner ? producerOwnedBy(owner.id) : undefined;
  const productId = (producer && productsByProducer(producer.id)[0]?.id) || 1;
  let slotId: number | null = null;
  for (const d of stallDays("proximos")) {
    const s = slotsForDay(d.id, "aceptado").find((x) => x.available > 0);
    if (s) {
      slotId = s.id;
      break;
    }
  }
  const agenda = upcomingAgenda().find((a) => a.by_baco && (!a.capacity || a.signups < a.capacity));
  return {
    productId,
    producerId: producer?.id ?? null,
    slotId,
    agendaId: agenda?.id ?? null,
    respondHref: latestLink("/r/"),
    reviewHref: latestLink("/revisar/"),
  };
}

// Compatibilidad: producto que usa la guía de muestras.
export function demoProductId(): number {
  return demoTargets().productId;
}
