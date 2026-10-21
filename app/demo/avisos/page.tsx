import type { Metadata } from "next";
import { DemoNote, PhoneMessage } from "@/components/phone-message";
import { allNotifications, getProfile, isDemoPhone } from "@/lib/db/repo";
import { currentProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Avisos enviados (demo)", robots: { index: false } };

// Bandeja de todo lo que BACO "envía" por WhatsApp, SMS o correo. En la demo no sale del servidor:
// esta página sirve para enseñar en la presentación qué le llega a cada persona y cuándo.
// Solo se ven enteros los avisos a cuentas de demo (móviles 600 000 xxx) o si quien mira es el equipo.
// Los de personas reales salen ocultos: así nadie puede usar sus códigos ni sus enlaces.
export default async function NoticesDemoPage() {
  const viewer = await currentProfile();
  const notes = allNotifications(80).map((n) => {
    const phone = n.phone ?? (n.profile_id ? getProfile(n.profile_id)?.phone : null) ?? null;
    const open = viewer?.role === "equipo" || isDemoPhone(phone);
    const masked = phone ? `${phone.replace(/\D/g, "").slice(0, 3)} ··· ··· ${phone.replace(/\D/g, "").slice(-2)}` : "una persona";
    return open ? n : { ...n, body: "Contenido oculto: es un aviso para una persona real.", link: null, profile_name: null, phone: masked };
  });
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <p className="label">Demo</p>
      <h1 className="mt-2 text-[32px] leading-tight font-semibold tracking-[-0.035em]">Avisos enviados</h1>
      <p className="mt-2 text-[17px] text-ink-2">Lo que le llegaría al móvil a cada persona, del más reciente al más antiguo.</p>
      <div className="mt-4">
        <DemoNote>
          ningún mensaje sale de verdad. En producción, los WhatsApp irían por la API de WhatsApp Business (con plantillas aprobadas y permiso previo de cada
          persona) y los SMS por un proveedor de mensajería.
        </DemoNote>
      </div>
      <ol className="mt-8 space-y-3" data-help="demo-notices">
        {notes.map((n) => (
          <li key={n.id}>
            <PhoneMessage n={n} to={n.profile_name ?? n.phone} />
          </li>
        ))}
      </ol>
    </div>
  );
}
