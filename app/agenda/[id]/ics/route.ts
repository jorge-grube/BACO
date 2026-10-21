import { getAgenda } from "@/lib/db/repo";

// Archivo .ics para "Añadir a mi calendario" (funciona en el calendario del móvil, Google y Outlook).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = getAgenda(Number((await params).id));
  if (!a) return new Response("No encontrado", { status: 404 });
  const d = (iso: string) => iso.replace(/-/g, "");
  const end = new Date(Date.parse(a.end_date ?? a.date) + 864e5).toISOString().slice(0, 10);
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  // Si tiene hora ("18:00–19:00") se exporta con hora de Madrid; si no, como día entero.
  const t = a.time?.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  const hm = (h: string, m: string) => `T${h.padStart(2, "0")}${m}00`;
  const when = t && (!a.end_date || a.end_date === a.date)
    ? [`DTSTART;TZID=Europe/Madrid:${d(a.date)}${hm(t[1], t[2])}`, `DTEND;TZID=Europe/Madrid:${d(a.date)}${hm(t[3], t[4])}`]
    : [`DTSTART;VALUE=DATE:${d(a.date)}`, `DTEND;VALUE=DATE:${d(end)}`];
  const title = a.is_mock ? `[Ejemplo] ${a.title}` : a.title;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BACO//Agenda//ES",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Madrid",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:agenda-${a.id}@baco`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    ...when,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(a.place)}`,
    `DESCRIPTION:${esc(`${a.time ? `${a.time}. ` : ""}${a.description} Organiza ${a.organizer}.${a.is_mock ? " Actividad de ejemplo de la demo de BACO." : ""}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="baco-agenda-${a.id}.ics"` },
  });
}
