"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as repo from "@/lib/db/repo";
import { SESSION_COOKIE, currentProfile } from "@/lib/session";
import * as notify from "@/lib/notify";
import type { Role } from "@/lib/domain";

// `values` devuelve lo que escribió el usuario para no vaciarle el formulario si hay un error.
export type ActionState = { ok: boolean; message: string; values?: Record<string, string> } | null;

export async function signIn(formData: FormData) {
  const id = String(formData.get("profileId") ?? "");
  const profile = repo.getProfile(id);
  if (!profile || !profile.is_demo) return;
  (await cookies()).set(SESSION_COOKIE, profile.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(safeNext(String(formData.get("next") ?? "")));
}

// Solo rutas de esta web: descarta "//otro.sitio", "/\\otro.sitio", esquemas y caracteres de control.
function safeNext(next: string) {
  if (!next.startsWith("/") || /[\\\u0000-\u001f]/.test(next)) return "/panel";
  try {
    const u = new URL(next, "http://baco.local");
    return u.origin === "http://baco.local" ? u.pathname + u.search + u.hash : "/panel";
  } catch {
    return "/panel";
  }
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}

const RequestInput = z.object({
  productId: z.coerce.number().int().positive(),
  type: z.enum(["muestra", "pedido", "contacto"]),
  quantity: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Cuéntale al productor algo más (mínimo 10 caracteres).").max(1000),
});

export async function sendRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, message: "Entra con una cuenta para enviar solicitudes." };
  const parsed = RequestInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (profile.role === "productor") return { ok: false, message: "Las solicitudes las envían hosteleros y consumidores." };
  if (profile.role === "consumidor" && parsed.data.type !== "contacto")
    return { ok: false, message: "Las muestras y pedidos son para cuentas de hostelería." };
  const requestId = repo.createRequest({
    fromProfileId: profile.id,
    productId: parsed.data.productId,
    type: parsed.data.type,
    quantity: parsed.data.quantity || null,
    message: parsed.data.message,
  });
  notify.onRequestCreated(requestId);
  refresh();
  return { ok: true, message: "Enviado. Al productor le llega un aviso al móvil; cuando conteste, lo verás en «Mi panel»." };
}

export async function toggleFavorite(productId: number) {
  const profile = await currentProfile();
  if (!profile) redirect(`/entrar?next=/producto/${productId}`);
  if (!repo.getProduct(productId)) return;
  repo.toggleFavorite(profile.id, productId);
  refresh();
}

const ReviewInput = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(500).optional(),
});

export async function addReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await currentProfile();
  if (!profile || profile.role === "productor") return { ok: false, message: "Solo hosteleros y consumidores pueden valorar." };
  const parsed = ReviewInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Elige una valoración de 1 a 5." };
  if (!repo.getProduct(parsed.data.productId)) return { ok: false, message: "Producto no encontrado." };
  repo.addReview(profile.id, parsed.data.productId, parsed.data.rating, parsed.data.text || null);
  refresh();
  return { ok: true, message: "Gracias, tu reseña ya es visible." };
}

const RequestUpdate = z.object({
  requestId: z.coerce.number().int().positive(),
  status: z.enum(["vista", "respondida", "cerrada"]),
  reply: z.string().trim().max(1000).optional(),
});

// Solo el productor que ha reclamado la ficha puede gestionar sus solicitudes.
export async function updateRequest(formData: FormData) {
  const profile = await currentProfile();
  if (!profile || profile.role !== "productor") return;
  const producer = repo.producerOwnedBy(profile.id);
  const parsed = RequestUpdate.safeParse(Object.fromEntries(formData));
  if (!producer || !parsed.success) return;
  const request = repo.getRequest(parsed.data.requestId);
  if (!request || request.producer_id !== producer.id) return;
  if (parsed.data.status === "respondida" && !parsed.data.reply) return;
  repo.updateRequest(request.id, parsed.data.status, parsed.data.reply || null);
  if (parsed.data.status === "respondida") notify.onRequestAnswered(request.id);
  refresh();
}

const ProducerUpdate = z.object({
  description: z.string().trim().max(600),
  phone: z.string().trim().max(30),
  website: z.union([z.literal(""), z.url().max(200)]),
  capacity_note: z.string().trim().max(300),
});

export async function updateProducer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await currentProfile();
  const producer = profile?.role === "productor" ? repo.producerOwnedBy(profile.id) : undefined;
  if (!producer) return { ok: false, message: "No gestionas ninguna ficha." };
  const parsed = ProducerUpdate.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Revisa la web: debe empezar por https://" };
  repo.updateProducer(producer.id, {
    description: parsed.data.description || null,
    phone: parsed.data.phone || null,
    website: parsed.data.website || null,
    capacity_note: parsed.data.capacity_note || null,
  });
  refresh();
  return { ok: true, message: "Cambios guardados. Ya los ve la hostelería." };
}

// "Que me llamen": funciona sin cuenta. Guardamos solo lo necesario para devolver la llamada.
const CallbackInput = z.object({
  name: z.string().trim().min(2, "Dinos tu nombre.").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(/^(\+34|0034)?[6789]\d{8}$/, "Revisa el teléfono: son 9 números, por ejemplo 612 345 678.")),
  slot: z.enum(["manana", "tarde", "cualquiera"]),
  topic: z.string().trim().max(300).optional(),
  page: z.string().max(200).optional(),
  consent: z.literal("on", { message: "Marca la casilla para que podamos llamarte." }),
});

export async function requestCallback(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = CallbackInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, values: raw };
  const profile = await currentProfile();
  repo.createHelpRequest({
    name: parsed.data.name,
    phone: parsed.data.phone,
    slot: parsed.data.slot,
    topic: parsed.data.topic || null,
    page: parsed.data.page || null,
    profileId: profile?.id ?? null,
  });
  notify.onHelpRequested(parsed.data.name, parsed.data.topic || null);
  return { ok: true, message: "Apuntado. Te llamaremos en la franja que has elegido." };
}

// --- utilidades comunes --------------------------------------------------------------------

const Phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(/^(\+34|0034)?[6789]\d{8}$/, "Revisa el teléfono: son 9 números, por ejemplo 612 345 678."));
const Consent = z.literal("on", { message: "Marca la casilla de privacidad para continuar." });

async function requireRole(role: Role) {
  const profile = await currentProfile();
  return profile?.role === role ? profile : null;
}
const fail = (message: string, values?: Record<string, string>): ActionState => ({ ok: false, message, values });
const raw = (fd: FormData) => Object.fromEntries(fd) as Record<string, string>;

// --- entrar con el móvil (sin contraseña) ---------------------------------------------------

export async function startPhoneLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const parsed = z.object({ phone: Phone }).safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message, values);
  const profile = repo.profileByPhone(parsed.data.phone);
  if (!profile) return fail("No encontramos una cuenta con ese número. Si quieres darte de alta, pide que te llamemos y lo hacemos contigo.", values);
  if (repo.recentLoginCodes(parsed.data.phone) >= 3) return fail("Ya te hemos mandado varios códigos. Espera 10 minutos o pulsa «Ayuda» y te llamamos.", values);
  const code = repo.createLoginCode(parsed.data.phone);
  notify.onLoginCode(profile.phone ?? parsed.data.phone, code, profile.id);
  const next = values.next ? `&next=${encodeURIComponent(safeNext(values.next))}` : "";
  redirect(`/entrar/codigo?tel=${repo.phoneDigits(parsed.data.phone)}${next}`);
}

export async function verifyPhoneLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const parsed = z.object({ phone: Phone, code: z.string().trim().regex(/^\d{6}$/, "El código son 6 números.") }).safeParse({
    phone: values.phone,
    code: (values.code ?? "").replace(/\s/g, ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message, values);
  const profile = repo.profileByPhone(parsed.data.phone);
  const check = profile ? repo.verifyLoginCode(parsed.data.phone, parsed.data.code) : "mal";
  if (check === "bloqueado") return fail("Has escrito mal el código demasiadas veces. Pide un código nuevo.", values);
  if (!profile || check !== "ok") return fail("Ese código no es correcto o ha caducado. Revisa el SMS o pide otro.", values);
  (await cookies()).set(SESSION_COOKIE, profile.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(safeNext(values.next ?? ""));
}

// --- responder desde el enlace del WhatsApp (sin entrar) ---------------------------------------

const QUICK_REPLY = {
  si: "¡Sí! Podemos. Te llamo para concretar día y precio.",
  no: "Lo siento, ahora mismo no podemos atender esta petición.",
} as const;

export async function respondByLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const link = repo.getMagicLink(values.token ?? "");
  if (!link || link.purpose !== "responder" || !link.request_id) return fail("Este enlace ya no es válido. Entra en BACO para contestar.");
  const request = repo.getRequest(link.request_id);
  if (!request) return fail("No encontramos esta petición.");
  if (request.status === "respondida" || request.status === "cerrada") return { ok: true, message: "Esta petición ya estaba contestada. ¡Gracias!" };
  const choice = values.choice as "si" | "no" | "texto";
  const reply = choice === "texto" ? (values.reply ?? "").trim() : QUICK_REPLY[choice as "si" | "no"];
  if (!reply || reply.length < 2) return fail("Escribe tu respuesta antes de enviarla.", values);
  if (reply.length > 1000) return fail("La respuesta es demasiado larga (máximo 1.000 letras).", values);
  repo.updateRequest(request.id, "respondida", reply);
  repo.markMagicLinkUsed(link.token);
  notify.onRequestAnswered(request.id);
  return { ok: true, message: "Enviado. El restaurante ya tiene tu respuesta." };
}

// --- puesto compartido ----------------------------------------------------------------------

export async function requestStallSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const profile = await requireRole("productor");
  const producer = profile && repo.producerOwnedBy(profile.id);
  if (!producer) return fail("Entra con tu cuenta de productor para apuntarte al puesto.", values);
  const parsed = z
    .object({
      dayId: z.coerce.number().int().positive(),
      productId: z.coerce.number({ message: "Elige un producto." }).int().positive("Elige un producto."),
      quantity: z.coerce.number({ message: "Indica cuántas unidades llevas." }).int().min(1, "Lleva al menos 1 unidad.").max(200, "Como mucho 200 unidades por producto."),
      note: z.string().trim().max(300).optional(),
      accept: z.literal("on", { message: "Marca la casilla para aceptar las condiciones del puesto." }),
    })
    .safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message, values);
  const day = repo.getStallDay(parsed.data.dayId);
  if (!day) return fail("Ese día de mercado no existe.", values);
  if (day.deadline < (await import("@/lib/db/demo-extras")).todayISO()) return fail("El plazo para ese día ya ha cerrado. Elige otro.", values);
  if (repo.slotExists(day.id, parsed.data.productId)) return fail("Ya habías apuntado ese producto para ese día.", values);
  try {
    const slotId = repo.createSlot({ dayId: day.id, producerId: producer.id, productId: parsed.data.productId, quantity: parsed.data.quantity, note: parsed.data.note || null });
    notify.onSlotRequested(slotId);
  } catch {
    return fail("Ese producto no es tuyo o no existe.", values);
  }
  refresh();
  return { ok: true, message: "Solicitud enviada. El equipo la revisa en 1 o 2 días y te avisamos por WhatsApp." };
}

export async function reserveStall(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const profile = await currentProfile();
  const parsed = z
    .object({
      slotId: z.coerce.number().int().positive(),
      quantity: z.coerce.number({ message: "Indica cuántas unidades quieres." }).int().min(1, "Reserva al menos 1 unidad.").max(10, "Como mucho 10 unidades por reserva."),
      name: z.string().trim().min(2, "Dinos tu nombre para la reserva.").max(80),
      phone: Phone,
      consent: Consent,
    })
    .safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message, values);
  const res = repo.createReservation({ slotId: parsed.data.slotId, profileId: profile?.id ?? null, name: parsed.data.name, phone: parsed.data.phone, quantity: parsed.data.quantity });
  if (!res.ok) return fail(res.reason, values);
  notify.onReservation(res.id);
  refresh();
  return { ok: true, message: res.code, values: { reservationId: String(res.id) } };
}

export async function cancelReservation(formData: FormData) {
  const profile = await currentProfile();
  const id = Number(formData.get("id"));
  const r = Number.isInteger(id) ? repo.getReservation(id) : undefined;
  if (!profile || !r || r.profile_id !== profile.id || r.status !== "reservada") return;
  repo.setReservationStatus(r.id, "cancelada");
  refresh();
}

// --- agenda ---------------------------------------------------------------------------------

export async function signupAgenda(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const profile = await currentProfile();
  const parsed = z
    .object({
      agendaId: z.coerce.number().int().positive(),
      name: z.string().trim().min(2, "Dinos tu nombre.").max(80),
      phone: Phone,
      consent: Consent,
    })
    .safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message, values);
  const a = repo.getAgenda(parsed.data.agendaId);
  if (!a || !a.by_baco) return fail("A esta actividad no hace falta apuntarse en BACO.", values);
  if (a.capacity && a.signups >= a.capacity) return fail("No quedan plazas. Pide que te llamemos y te avisamos si se libera alguna.", values);
  if ((profile && repo.isSignedUp(a.id, profile.id)) || repo.isPhoneSignedUp(a.id, parsed.data.phone)) return { ok: true, message: "Ya estabas apuntado. ¡Nos vemos allí!" };
  if (!repo.addSignup({ agendaId: a.id, profileId: profile?.id ?? null, name: parsed.data.name, phone: parsed.data.phone, role: profile?.role ?? null }))
    return fail("No quedan plazas. Pide que te llamemos y te avisamos si se libera alguna.", values);
  notify.onSignup(a.id, parsed.data.phone, profile?.id ?? null);
  refresh();
  return { ok: true, message: "Apuntado. Te hemos mandado un SMS de confirmación y te avisaremos el día antes." };
}

// --- distintivo -------------------------------------------------------------------------------

export async function requestBadge() {
  const profile = await requireRole("hostelero");
  if (!profile) return;
  repo.requestBadge(profile.id);
  refresh();
}

// --- alta asistida: el productor revisa lo que preparó el equipo --------------------------------

export async function reviewOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  const link = repo.getMagicLink(values.token ?? "");
  if (!link || link.purpose !== "revisar" || !link.onboarding_id) return fail("Este enlace ya no es válido. Llámanos y lo vemos juntos.");
  const o = repo.getOnboarding(link.onboarding_id);
  if (!o) return fail("No encontramos tu página.");
  if (o.status === "publicado") return { ok: true, message: "Tu página ya está publicada." };
  if (values.decision === "publicar") {
    repo.publishOnboarding(o.id);
    repo.markMagicLinkUsed(link.token);
    notify.onOnboardingFeedback(o.id, true);
    return { ok: true, message: "¡Publicada! Los restaurantes ya ven tu página." };
  }
  const feedback = (values.feedback ?? "").trim();
  if (feedback.length < 3) return fail("Cuéntanos qué quieres cambiar.", values);
  repo.setOnboardingStatus(o.id, "cambios", feedback.slice(0, 600));
  notify.onOnboardingFeedback(o.id, false);
  return { ok: true, message: "Recibido. El equipo te llama para hacer los cambios contigo." };
}

// --- acciones del equipo BACO -------------------------------------------------------------------

export async function teamCreateOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = raw(formData);
  if (!(await requireRole("equipo"))) return fail("Solo el equipo de BACO puede preparar altas.", values);
  const parsed = z
    .object({
      producerId: z.coerce.number({ message: "Elige el productor." }).int().positive("Elige el productor."),
      contactName: z.string().trim().min(2, "Escribe el nombre de la persona de contacto.").max(80),
      phone: Phone,
      metAt: z.string().trim().max(80).optional(),
      description: z.string().trim().max(600).optional(),
      capacityNote: z.string().trim().max(300).optional(),
      website: z.union([z.literal(""), z.url("La web debe empezar por https://").max(200)]).optional(),
      consent: z.literal("on", { message: "Confirma que el productor ha dado permiso para usar sus datos y fotos." }),
    })
    .safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message, values);
  if (!repo.getProducer(parsed.data.producerId)) return fail("Ese productor no existe.", values);
  const id = repo.createOnboarding({
    producerId: parsed.data.producerId,
    contactName: parsed.data.contactName,
    phone: parsed.data.phone,
    metAt: parsed.data.metAt || null,
    description: parsed.data.description || null,
    capacityNote: parsed.data.capacityNote || null,
    website: parsed.data.website || null,
  });
  if (values.send === "1") {
    repo.setOnboardingStatus(id, "enviado");
    notify.onOnboardingSent(id);
  }
  refresh();
  return { ok: true, message: values.send === "1" ? "Preparada y enviada por WhatsApp para que la revise." : "Guardada como borrador." };
}

export async function teamSendOnboarding(formData: FormData) {
  if (!(await requireRole("equipo"))) return;
  const id = Number(formData.get("id"));
  const o = Number.isInteger(id) ? repo.getOnboarding(id) : undefined;
  if (!o || o.status === "publicado") return;
  repo.setOnboardingStatus(o.id, "enviado");
  notify.onOnboardingSent(o.id);
  refresh();
}

export async function teamDecideSlot(formData: FormData) {
  if (!(await requireRole("equipo"))) return;
  const id = Number(formData.get("id"));
  const status = formData.get("status");
  if (!Number.isInteger(id) || (status !== "aceptado" && status !== "rechazado")) return;
  if (repo.getSlot(id)?.status !== "solicitado") return; // ya decidida (p. ej. doble clic): no se avisa dos veces
  repo.setSlotStatus(id, status);
  notify.onSlotDecided(id);
  refresh();
}

export async function teamRecordSold(formData: FormData) {
  if (!(await requireRole("equipo"))) return;
  const id = Number(formData.get("id"));
  const sold = Number(formData.get("sold"));
  const slot = Number.isInteger(id) ? repo.getSlot(id) : undefined;
  if (!slot || !Number.isFinite(sold)) return;
  repo.setSlotSold(id, Math.min(slot.quantity, Math.max(0, Math.round(sold))));
  refresh();
}

export async function teamMarkReservation(formData: FormData) {
  if (!(await requireRole("equipo"))) return;
  const id = Number(formData.get("id"));
  const status = formData.get("status");
  if (!Number.isInteger(id) || (status !== "recogida" && status !== "cancelada")) return;
  if (repo.getReservation(id)?.status !== "reservada") return;
  repo.setReservationStatus(id, status);
  refresh();
}

export async function teamGrantBadge(formData: FormData) {
  if (!(await requireRole("equipo"))) return;
  const id = String(formData.get("profileId") ?? "");
  // Regla publicada en el panel y la ayuda: al menos 2 pedidos o muestras cerrados con productores de BACO.
  const pending = repo.pendingBadges().find((b) => b.id === id);
  if (!pending || pending.answered < 2) return;
  repo.grantBadge(id);
  notify.onBadgeGranted(id);
  refresh();
}

export async function teamMarkCalled(formData: FormData) {
  if (!(await requireRole("equipo"))) return;
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  repo.markHelpCalled(id);
  refresh();
}
