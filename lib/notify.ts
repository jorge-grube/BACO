// Avisos fuera de la web: lo que BACO mandaría por WhatsApp, SMS o correo en cada momento.
// En la demo no sale nada del servidor: cada aviso se guarda (tabla notifications) y se ve
// en el panel de la persona y en /demo/avisos. Para producción, sustituir addNotification
// por la API de WhatsApp Business (plantillas aprobadas + consentimiento) y un proveedor de SMS.
import * as repo from "@/lib/db/repo";

export const TEAM_ID = "equipo";

const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export function onRequestCreated(requestId: number) {
  const r = repo.getRequest(requestId);
  if (!r) return;
  const who = r.from_business ?? r.from_name;
  const what = { muestra: "te pide una muestra", pedido: "te pide precio y plazo", contacto: "te hace una pregunta" }[r.type];
  if (r.owner_profile_id) {
    const owner = repo.getProfile(r.owner_profile_id);
    const token = repo.createMagicLink({ purpose: "responder", profileId: r.owner_profile_id, requestId });
    repo.addNotification({
      channel: "whatsapp",
      profile_id: r.owner_profile_id,
      phone: owner?.phone ?? null,
      title: "Nueva petición en BACO",
      body: `${who} ${what}${r.product_name ? ` de ${r.product_name}` : ""}. Contesta con un toque, sin entrar:`,
      link: `/r/${token}`,
    });
  } else {
    // Productor que aún no usa BACO: el equipo se lo hace llegar (PDD, riesgo "fichas sin reclamar").
    repo.addNotification({
      channel: "email",
      profile_id: TEAM_ID,
      phone: null,
      title: "Petición para un productor sin página activa",
      body: `${who} ${what} a ${r.producer_name}. Llámale para hacérsela llegar y ofrécele el alta asistida.`,
      link: "/panel",
    });
  }
}

export function onRequestAnswered(requestId: number) {
  const r = repo.getRequest(requestId);
  if (!r) return;
  repo.addNotification({
    channel: "whatsapp",
    profile_id: r.from_profile_id,
    phone: r.from_phone,
    title: "Te han contestado",
    body: `${r.producer_name} ha contestado a tu petición${r.product_name ? ` de ${r.product_name}` : ""}: «${(r.reply ?? "").slice(0, 120)}»`,
    link: "/panel",
  });
}

export function onLoginCode(phone: string, code: string, profileId: string) {
  repo.addNotification({
    channel: "sms",
    profile_id: profileId,
    phone,
    title: "Código para entrar en BACO",
    body: `Tu código es ${code}. Caduca en 10 minutos. Si no lo has pedido tú, ignora este mensaje.`,
    link: null,
  });
}

export function onSlotRequested(slotId: number) {
  const s = repo.getSlot(slotId);
  if (!s) return;
  repo.addNotification({
    channel: "email",
    profile_id: TEAM_ID,
    phone: null,
    title: "Nueva solicitud para el puesto",
    body: `${s.producer_name} quiere llevar ${s.quantity} × ${s.product_name} al ${s.day_market} del ${shortDate(s.day_date)}.`,
    link: "/panel",
  });
}

export function onSlotDecided(slotId: number) {
  const s = repo.getSlot(slotId);
  const producer = s && repo.getProducer(s.producer_id);
  if (!s || !producer?.owner_profile_id) return;
  const owner = repo.getProfile(producer.owner_profile_id);
  const day = repo.getStallDay(s.stall_day_id);
  repo.addNotification({
    channel: "whatsapp",
    profile_id: producer.owner_profile_id,
    phone: owner?.phone ?? null,
    title: "Puesto compartido",
    body:
      s.status === "aceptado"
        ? `Aceptado: ${s.quantity} × ${s.product_name} para el ${s.day_market} del ${shortDate(s.day_date)}. Entrega: ${day?.drop_off ?? ""}`
        : `Esta vez no hay sitio para ${s.product_name} el ${shortDate(s.day_date)}. Apúntate a otro día.`,
    link: "/panel",
  });
}

export function onReservation(reservationId: number) {
  const r = repo.getReservation(reservationId);
  if (!r) return;
  repo.addNotification({
    channel: "sms",
    profile_id: r.profile_id,
    phone: r.phone,
    title: "Reserva en el puesto de BACO",
    body: `Reservado: ${r.quantity} × ${r.product_name}. Recógelo el ${shortDate(r.day_date)} en el ${r.day_market} con el código ${r.code}. Pagas allí.`,
    link: "/puesto",
  });
}

export function onOnboardingSent(onboardingId: number) {
  const o = repo.getOnboarding(onboardingId);
  if (!o) return;
  const token = repo.createMagicLink({ purpose: "revisar", onboardingId, days: 30 });
  repo.addNotification({
    channel: "whatsapp",
    profile_id: null,
    phone: o.phone,
    title: "Tu página en BACO está lista",
    body: `Hola, ${o.contact_name}. Hemos preparado la página de ${o.producer_name}. Mírala y, si está bien, pulsa «Está bien, publicar»:`,
    link: `/revisar/${token}`,
  });
  return token;
}

export function onOnboardingFeedback(onboardingId: number, published: boolean) {
  const o = repo.getOnboarding(onboardingId);
  if (!o) return;
  repo.addNotification({
    channel: "email",
    profile_id: TEAM_ID,
    phone: null,
    title: published ? "Página publicada" : "El productor pide cambios",
    body: published ? `${o.producer_name} ha revisado y publicado su página.` : `${o.producer_name}: «${o.feedback ?? ""}». Llámale al ${o.phone}.`,
    link: "/panel",
  });
}

export function onSignup(agendaId: number, phone: string, profileId: string | null) {
  const a = repo.getAgenda(agendaId);
  if (!a) return;
  repo.addNotification({
    channel: "sms",
    profile_id: profileId,
    phone,
    title: "Inscripción confirmada",
    body: `Te esperamos en «${a.title}» el ${shortDate(a.date)}${a.time ? ` (${a.time})` : ""}, ${a.place}. Te avisaremos el día antes.`,
    link: `/agenda/${a.id}`,
  });
}

export function onBadgeGranted(profileId: string) {
  const p = repo.getProfile(profileId);
  repo.addNotification({
    channel: "whatsapp",
    profile_id: profileId,
    phone: p?.phone ?? null,
    title: "Distintivo concedido",
    body: "Ya puedes mostrar el distintivo «Cocina con producto de Madrid». Descarga el cartel con QR desde tu panel.",
    link: "/panel",
  });
}

export function onHelpRequested(name: string, topic: string | null) {
  repo.addNotification({
    channel: "email",
    profile_id: TEAM_ID,
    phone: null,
    title: "Nueva llamada pendiente",
    body: `${name} pide que le llamen${topic ? `: «${topic}»` : "."}`,
    link: "/panel",
  });
}
