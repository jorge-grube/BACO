"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as repo from "@/lib/db/repo";
import { SESSION_COOKIE, currentProfile } from "@/lib/session";

export type ActionState = { ok: boolean; message: string } | null;

export async function signIn(formData: FormData) {
  const id = String(formData.get("profileId") ?? "");
  const profile = repo.getProfile(id);
  if (!profile || !profile.is_demo) return;
  (await cookies()).set(SESSION_COOKIE, profile.id, { httpOnly: true, sameSite: "lax", path: "/" });
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/panel");
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
  repo.createRequest({
    fromProfileId: profile.id,
    productId: parsed.data.productId,
    type: parsed.data.type,
    quantity: parsed.data.quantity || null,
    message: parsed.data.message,
  });
  refresh();
  return { ok: true, message: "Solicitud enviada. El productor la verá en su panel." };
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
  return { ok: true, message: "Ficha actualizada." };
}
