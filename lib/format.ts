// Formatos de fecha y dinero en español, iguales en servidor y navegador (zona Europe/Madrid).

const parse = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

// "sábado, 7 de noviembre"
export function longDate(iso: string) {
  return parse(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

// "sáb 7 nov"
export function shortDate(iso: string) {
  return parse(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(/\./g, "");
}

export function monthLabel(iso: string) {
  const s = parse(iso).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayNumber(iso: string) {
  return parse(iso).getUTCDate();
}

export function weekdayShort(iso: string) {
  return parse(iso).toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" }).replace(/\./g, "");
}

export function euros(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function daysUntil(iso: string, today: string) {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 864e5);
}

// "domingo, 25 de octubre" → "Domingo, 25 de octubre" (solo la primera letra).
export function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
