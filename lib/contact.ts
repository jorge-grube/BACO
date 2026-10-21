// Canales de contacto de BACO. Los valores reales los pone Aplus en .env.local;
// sin ellos se muestran valores de ejemplo marcados como "dato de ejemplo" (nunca un número real inventado).
const env = (key: string) => (process.env[key] ?? "").trim();

const phone = env("NEXT_PUBLIC_BACO_PHONE"); // formato: +34 900 000 000
const whatsapp = env("NEXT_PUBLIC_BACO_WHATSAPP"); // solo dígitos con prefijo: 34600000000
const email = env("NEXT_PUBLIC_BACO_EMAIL");
const hours = env("NEXT_PUBLIC_BACO_HOURS");

export const CONTACT = {
  isDemo: !phone || !whatsapp || !email,
  phoneDisplay: phone || "900 000 000",
  phoneHref: `tel:${(phone || "+34900000000").replace(/\s+/g, "")}`,
  whatsappNumber: whatsapp || "34600000000",
  email: email || "ayuda@baco.example",
  hours: hours || "Lunes a viernes, de 9:00 a 14:00 y de 16:00 a 19:00",
};

export function whatsappHref(text: string) {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export const CALLBACK_SLOTS = {
  manana: "Por la mañana (9:00–14:00)",
  tarde: "Por la tarde (16:00–19:00)",
  cualquiera: "Cuando os venga bien",
} as const;
export type CallbackSlot = keyof typeof CALLBACK_SLOTS;
