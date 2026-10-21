// Datos de demo de las partes añadidas después del seed inicial: teléfonos, cuenta del equipo,
// agenda en persona, puesto compartido, reservas, avisos, altas asistidas y distintivos.
// Se ejecuta una vez por base de datos (marca en la tabla meta), tanto desde `npm run seed`
// como al abrir una base antigua, para no obligar a regenerarla.
//
// Qué es real y qué es de ejemplo:
// - Mercados y ferias: reales, con su organizador y enlace (fuentes en docs/IMPLEMENTACION.md).
//   Las fechas de los mercados se calculan con su regla publicada (p. ej. "primer sábado de cada mes").
// - Todo lo que organiza BACO (puesto, encuentros, talleres, rutas), teléfonos, precios,
//   comisiones, reservas y avisos: datos de ejemplo, marcados con is_mock o señalados en pantalla.
import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";

const EXTRAS_VERSION = "extras-v1";

// --- fechas --------------------------------------------------------------------------

export function todayISO(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (isoDate: string, days: number) => iso(new Date(Date.parse(isoDate) + days * 864e5));

// n-ésimo día de la semana del mes (dow: 0 = domingo, 6 = sábado; n = 1..4).
function nthWeekday(year: number, month: number, dow: number, n: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (dow - first.getUTCDay() + 7) % 7;
  return iso(new Date(Date.UTC(year, month, 1 + offset + 7 * (n - 1))));
}

type Rule = { dow: number; nth: number[]; skipMonths?: number[] };

// Fechas de un mercado recurrente entre `from` (incluido) y `months` meses después.
export function occurrences(rule: Rule, from: string, months: number) {
  const [y, m] = from.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i <= months; i++) {
    const year = y + Math.floor((m - 1 + i) / 12);
    const month = (m - 1 + i) % 12;
    if (rule.skipMonths?.includes(month + 1)) continue;
    for (const n of rule.nth) {
      const d = nthWeekday(year, month, rule.dow, n);
      if (d >= from) out.push(d);
    }
  }
  return out.sort();
}

// --- mercados y ferias reales ----------------------------------------------------------

export const MARKETS = [
  {
    key: "dia-mercado",
    title: "Día de Mercado «Madrid cultiva y produce»",
    rule: { dow: 6, nth: [1] } as Rule,
    time: "10:00–15:00",
    place: "Recinto Ferial de la Casa de Campo (Pº Puerta del Ángel, 4)",
    municipality: "Madrid",
    organizer: "Cámara Agraria de la Comunidad de Madrid",
    url: "https://www.esmadrid.com/compras/dia-de-mercado-camara-agraria-de-madrid",
    description: "Mercado mensual de productores de la región: huerta, quesos, vino, carne de la sierra.",
  },
  {
    key: "planetario",
    title: "Mercado de Productores Planetario",
    rule: { dow: 0, nth: [1, 3], skipMonths: [7, 8] } as Rule,
    time: "10:00–16:00",
    place: "Avenida del Planetario (Arganzuela)",
    municipality: "Madrid",
    organizer: "Madrid Alfa Market S.L.",
    url: "https://www.esmadrid.com/agenda/mercado-municipal-productores-planetario",
    description: "Unos 36 productores de menos de 120 km, artesanos o ecológicos.",
  },
  {
    key: "alcobendas",
    title: "Mercado de Productores de Alcobendas",
    rule: { dow: 0, nth: [2] } as Rule,
    time: null,
    place: "Paseo de Valdelasfuentes",
    municipality: "Alcobendas",
    organizer: "Madrid Alfa Market S.L.",
    url: "https://www.madridhappypeople.com/ocio-madrid/mercado-de-productores-madrid/",
    description: "Unos 45 productores. Horario en la web del organizador.",
  },
  {
    key: "valdebebas",
    title: "Mercado de Productores de Valdebebas",
    rule: { dow: 0, nth: [4] } as Rule,
    time: null,
    place: "Plaza de Francisco de Asís Cabrero (Hortaleza)",
    municipality: "Madrid",
    organizer: "Madrid Alfa Market S.L.",
    url: "https://diario.madrid.es/hortaleza/2023/02/09/la-huerta-de-madrid-llega-al-distrito/",
    description: "Unos 36 puestos de producto de cercanía.",
  },
] as const;

const FAIRS = [
  { title: "Madrid Top Wine", date: "2026-11-16", end: "2026-11-17", note: null, place: "IFEMA Madrid", organizer: "Comunidad de Madrid y Peñín", url: "https://vivirediciones.es/madrid/madrid-top-wine-2026-xxvi-salon-mejores-vinos/", description: "Salón profesional con más de 300 bodegas, compradores y restauración.", audience: "hosteleros" },
  { title: "BioCultura Madrid", date: "2026-11-26", end: "2026-11-29", note: null, place: "IFEMA Madrid, pabellón 3", organizer: "Asociación Vida Sana", url: "https://www.biocultura.org/madrid", description: "Feria de producto ecológico, con stand de empresas madrileñas.", audience: "todos" },
  { title: "Madrid Fusión", date: "2027-02-01", end: "2027-02-03", note: null, place: "IFEMA Madrid", organizer: "Madrid Fusión", url: "https://www.esmadrid.com/agenda/madrid-fusion-ifema-feria-madrid", description: "Congreso gastronómico. La Comunidad suele llevar stand de producto madrileño.", audience: "hosteleros" },
  { title: "HIP · Horeca Professional Expo", date: "2027-03-01", end: "2027-03-03", note: null, place: "IFEMA Madrid", organizer: "Grupo Nebext", url: "https://www.expohip.com/en/", description: "Feria profesional de hostelería, más de 65.000 visitantes.", audience: "hosteleros" },
  { title: "Salón Gourmets", date: "2027-04-26", end: "2027-04-29", note: null, place: "IFEMA Madrid", organizer: "Grupo Gourmets", url: "https://www.gourmets.net/descargas/2027/salongourmets/documentacion/40sg-reglamento-regimen-interno.pdf", description: "Feria de alimentación de calidad. La Comunidad tiene stand con empresas del sello M.", audience: "todos" },
  { title: "Jornadas de Pastoreo y Feria de Quesos Artesanales", date: "2027-04-01", end: null, note: "Abril de 2027, fecha por confirmar", place: "Explanada de la Plaza de Toros", organizer: "Ayuntamiento de Colmenar Viejo", url: "https://colmenarviejo.com/", description: "Unas 20 queserías artesanas.", audience: "todos" },
  { title: "La Despensa de Madrid", date: "2027-05-15", end: "2027-10-17", note: "De mayo a octubre de 2027, fechas por confirmar", place: "Itinerante por unos 20 municipios", organizer: "Comunidad de Madrid", url: "https://www.comunidad.madrid/node/114204", description: "Mercado itinerante de empresas del sello M Producto Certificado.", audience: "todos" },
  { title: "Feria de la Sierra Norte", date: "2027-06-26", end: "2027-06-27", note: "Junio de 2027, fecha por confirmar", place: "Itinerante (en 2026, La Cabrera)", organizer: "Comunidad de Madrid", url: "https://madridinforma.es/feria-sierra-norte-2026-en-la-cabrera-talleres-gratis-y-horarios/", description: "70 expositores de los 42 municipios de la Sierra Norte.", audience: "todos" },
] as const;

// --- puesto compartido: formato y precio por categoría (de ejemplo) ----------------------

const STALL_FORMAT: Record<string, [string, number]> = {
  Quesos: ["cuña de 500 g", 0.5],
  Aceite: ["botella de 500 ml", 0.5],
  "Aceitunas y encurtidos": ["tarro de 400 g", 0.4],
  Vinos: ["botella de 75 cl", 1],
  Carnes: ["bandeja de 1 kg", 1],
  Embutidos: ["pieza de 250 g", 0.25],
  Lácteos: ["unidad", 1],
  "Verduras y frutas": ["bolsa de 1 kg", 1],
  "Pan y repostería": ["unidad", 1],
  "Conservas y ahumados": ["lata o tarro", 1],
  Bebidas: ["botella", 1],
  "Café y chocolates": ["paquete de 250 g", 0.25],
  "Alimentos preparados": ["ración", 1],
  "Otros alimentos": ["tarro o bolsa de 250 g", 0.25],
};

// Precio de venta al público en el puesto: precio orientativo × formato × margen minorista.
export function stallFormat(category: string, priceHint: number | null) {
  const [label, factor] = STALL_FORMAT[category] ?? STALL_FORMAT["Otros alimentos"];
  const price = Math.max(1.5, Math.round((priceHint ?? 6) * factor * 1.8 * 2) / 2);
  return { label, price };
}

export const STALL_COMMISSION = 0.15;

// --- datos de ejemplo ----------------------------------------------------------------

export function ensureDemoExtras(conn: Database.Database, now = new Date()) {
  const done = conn.prepare(`SELECT value FROM meta WHERE key = ?`).get(EXTRAS_VERSION);
  if (done) return ensureDemoLinks(conn);
  const hasCatalog = (conn.prepare(`SELECT count(*) n FROM products`).get() as { n: number }).n > 0;
  const hasProfiles = (conn.prepare(`SELECT count(*) n FROM profiles`).get() as { n: number }).n > 0;
  if (!hasCatalog || !hasProfiles) return; // base vacía: el seed la llenará y volverá a llamar

  const today = todayISO(now);
  const run = conn.transaction(() => {
    // Teléfonos de ejemplo (numeración inventada; se muestran como "dato de ejemplo").
    const phones: Record<string, string> = {
      lucia: "600 000 001",
      andres: "600 000 002",
      marta: "600 000 003",
      "h-brote": "600 000 101",
      "h-mirador": "600 000 102",
      "h-sierra": "600 000 103",
      "h-mercado": "600 000 104",
      "c-pablo": "600 000 201",
      "c-irene": "600 000 202",
    };
    const setPhone = conn.prepare(`UPDATE profiles SET phone = ? WHERE id = ? AND phone IS NULL`);
    for (const [id, phone] of Object.entries(phones)) setPhone.run(phone, id);

    // Cuenta del equipo de BACO (Aplus): gestiona altas asistidas, el puesto, la agenda y las llamadas.
    conn
      .prepare(
        `INSERT OR IGNORE INTO profiles (id, role, name, phone, business_name, business_type, municipality, is_demo)
         VALUES ('equipo', 'equipo', 'Sara Molina', '600 000 009', 'Equipo BACO', 'Altas, puesto y agenda', 'Madrid', 1)`,
      )
      .run();

    // --- agenda ---
    const insAgenda = conn.prepare(
      `INSERT INTO agenda (kind, title, date, end_date, date_note, time, place, municipality, organizer, url, description, audience, by_baco, capacity, is_mock)
       VALUES (@kind, @title, @date, @end_date, @date_note, @time, @place, @municipality, @organizer, @url, @description, @audience, @by_baco, @capacity, @is_mock)`,
    );
    const marketIds: Record<string, { date: string; id: number }[]> = {};
    for (const m of MARKETS) {
      marketIds[m.key] = occurrences(m.rule, today, 4).map((date) => ({
        date,
        id: Number(
          insAgenda.run({
            kind: "mercado",
            title: m.title,
            date,
            end_date: null,
            date_note: null,
            time: m.time,
            place: m.place,
            municipality: m.municipality,
            organizer: m.organizer,
            url: m.url,
            description: m.description,
            audience: "todos",
            by_baco: 0,
            capacity: null,
            is_mock: 0,
          }).lastInsertRowid,
        ),
      }));
    }
    for (const f of FAIRS) {
      if ((f.end ?? f.date) < today) continue;
      insAgenda.run({
        kind: "feria",
        title: f.title,
        date: f.date,
        end_date: f.end,
        date_note: f.note,
        time: null,
        place: f.place,
        municipality: "Madrid",
        organizer: f.organizer,
        url: f.url,
        description: f.description,
        audience: f.audience,
        by_baco: 0,
        capacity: null,
        is_mock: 0,
      });
    }

    const dia = marketIds["dia-mercado"];
    const baco = (e: { kind: string; title: string; date: string; time: string; place: string; municipality: string; description: string; audience: string; capacity: number | null }) =>
      Number(insAgenda.run({ ...e, end_date: null, date_note: null, organizer: "BACO", url: null, by_baco: 1, is_mock: 1 }).lastInsertRowid);

    // Alta asistida en el Día de Mercado (los tres próximos).
    for (const d of dia.slice(0, 3)) {
      baco({
        kind: "alta",
        title: "Te hacemos tu página en BACO en 15 minutos",
        date: d.date,
        time: "10:00–14:00",
        place: "Puesto de BACO en el Día de Mercado (Casa de Campo)",
        municipality: "Madrid",
        description: "Pásate con tus productos: te hacemos fotos, preparamos tu página y tú solo la revisas en el móvil.",
        audience: "productores",
        capacity: null,
      });
    }
    const nextMonth = (n: number) => {
      const [y, m] = today.split("-").map(Number);
      return { y: y + Math.floor((m - 1 + n) / 12), m: (m - 1 + n) % 12 };
    };
    const nm = nextMonth(1);
    const encuentro = nthWeekday(nm.y, nm.m, 1, 2); // segundo lunes (día de descanso habitual en hostelería)
    baco({
      kind: "encuentro",
      title: "Encuentro productor–chef",
      date: encuentro,
      time: "11:00–14:00",
      place: "Sala por confirmar, Madrid centro",
      municipality: "Madrid",
      description: "Mesas de 10 minutos entre productores y cocineros. Llegas con tus emparejamientos ya preparados por BACO.",
      audience: "todos",
      capacity: 40,
    });
    baco({
      kind: "ruta",
      title: "Ruta de cocineros por la Sierra Norte",
      date: nthWeekday(nm.y, nm.m, 1, 3),
      time: "9:00–18:00",
      place: "Salida desde Plaza de Castilla (autobús)",
      municipality: "Buitrago del Lozoya",
      description: "Visita a una quesería, un colmenar y una huerta. Plazas limitadas para cocineros y responsables de compras.",
      audience: "hosteleros",
      capacity: 12,
    });
    const tm = nextMonth(0);
    const tallerDate = nthWeekday(tm.y, tm.m, 3, 4) >= today ? nthWeekday(tm.y, tm.m, 3, 4) : nthWeekday(nm.y, nm.m, 3, 1);
    baco({
      kind: "taller",
      title: "Taller: tu página en BACO en 15 minutos",
      date: tallerDate,
      time: "18:00–19:00",
      place: "Centro cultural de Torrelaguna (sala por confirmar)",
      municipality: "Torrelaguna",
      description: "Trae tu móvil. Te enseñamos a revisar tu página, contestar a un restaurante y apuntarte al puesto compartido.",
      audience: "productores",
      capacity: 20,
    });
    baco({
      kind: "encuentro",
      title: "Presentación del piloto Sierra Norte",
      date: nthWeekday(nm.y, nm.m, 3, 4),
      time: "12:00–13:30",
      place: "Buitrago del Lozoya (lugar por confirmar)",
      municipality: "Buitrago del Lozoya",
      description: "Presentamos el catálogo común de productores de la comarca a restaurantes, alojamientos y tiendas.",
      audience: "todos",
      capacity: 60,
    });

    // --- puesto compartido ---
    const insDay = conn.prepare(
      `INSERT INTO stall_days (market, date, time, place, municipality, deadline, drop_off, commission, max_products, agenda_id)
       VALUES (@market, @date, @time, @place, @municipality, @deadline, @drop_off, @commission, @max_products, @agenda_id)`,
    );
    const dropOff = "El día anterior, de 17:00 a 19:00, en el punto de recogida de BACO (dirección de ejemplo: calle del Mercado 1, Madrid).";
    const mk = (key: (typeof MARKETS)[number]["key"]) => MARKETS.find((m) => m.key === key)!;
    const dayFor = (key: (typeof MARKETS)[number]["key"], date: string, agendaId: number | null) =>
      Number(
        insDay.run({
          market: mk(key).title,
          date,
          time: mk(key).time ?? "Horario del mercado",
          place: mk(key).place,
          municipality: mk(key).municipality,
          deadline: addDays(date, -4),
          drop_off: dropOff,
          commission: STALL_COMMISSION,
          max_products: 24,
          agenda_id: agendaId,
        }).lastInsertRowid,
      );
    // Un día ya celebrado (para el informe de ventas) y los tres próximos en mercados distintos.
    // El Día de Mercado más reciente ya celebrado (este mes si ya pasó, si no el del mes anterior).
    const pastDate = (() => {
      const [y, m] = today.split("-").map(Number);
      const thisMonth = nthWeekday(y, m - 1, 6, 1);
      return thisMonth < today ? thisMonth : nthWeekday(m === 1 ? y - 1 : y, (m + 10) % 12, 6, 1);
    })();
    const pastDay = dayFor("dia-mercado", pastDate, null);
    const upcoming = [
      dayFor("dia-mercado", dia[0].date, dia[0].id),
      dayFor("planetario", marketIds["planetario"][0].date, marketIds["planetario"][0].id),
      dayFor("alcobendas", marketIds["alcobendas"][0].date, marketIds["alcobendas"][0].id),
    ];

    // Productos de ejemplo en el puesto: el productor de demo y una selección variada.
    const andres = conn.prepare(`SELECT id FROM producers WHERE owner_profile_id = 'andres'`).get() as { id: number } | undefined;
    const productRows = conn
      .prepare(
        `SELECT p.id, p.producer_id, p.category, p.price_hint FROM products p
         JOIN producers pr ON pr.id = p.producer_id
         WHERE p.category IN ('Quesos','Vinos','Aceite','Verduras y frutas','Pan y repostería','Embutidos','Otros alimentos','Aceitunas y encurtidos','Lácteos')
         ORDER BY p.id`,
      )
      .all() as { id: number; producer_id: number; category: string; price_hint: number | null }[];
    const insSlot = conn.prepare(
      `INSERT INTO stall_slots (stall_day_id, producer_id, product_id, unit_label, unit_price, quantity, sold, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`,
    );
    const slot = (day: number, p: (typeof productRows)[number], qty: number, sold: number, status: string, ago: string) => {
      const f = stallFormat(p.category, p.price_hint);
      return Number(insSlot.run(day, p.producer_id, p.id, f.label, f.price, qty, sold, status, ago).lastInsertRowid);
    };
    const andresProducts = andres ? productRows.filter((p) => p.producer_id === andres.id) : [];
    // Un producto por productor, de categorías distintas, para que el puesto se vea variado.
    const seenProducers = new Set<number>(andres ? [andres.id] : []);
    const variety: typeof productRows = [];
    const perCat = new Map<string, number>();
    for (const p of productRows) {
      if (seenProducers.has(p.producer_id) || (perCat.get(p.category) ?? 0) >= 2) continue;
      seenProducers.add(p.producer_id);
      perCat.set(p.category, (perCat.get(p.category) ?? 0) + 1);
      variety.push(p);
    }
    if (andresProducts[0]) {
      slot(pastDay, andresProducts[0], 20, 17, "aceptado", "-40 days");
      if (andresProducts[1]) slot(pastDay, andresProducts[1], 12, 12, "aceptado", "-40 days");
      slot(upcoming[0], andresProducts[0], 20, 0, "aceptado", "-3 days");
      if (andresProducts[2]) slot(upcoming[1], andresProducts[2], 10, 0, "solicitado", "-1 days");
    }
    variety.slice(0, 4).forEach((p, i) => slot(pastDay, p, 15, 9 + i, "aceptado", "-40 days"));
    const firstSlots = variety.slice(0, 7).map((p, i) => slot(upcoming[0], p, 10 + (i % 3) * 5, 0, "aceptado", "-5 days"));
    variety.slice(7, 12).forEach((p) => slot(upcoming[1], p, 12, 0, "aceptado", "-2 days"));
    variety.slice(12, 15).forEach((p) => slot(upcoming[2], p, 10, 0, "aceptado", "-1 days"));
    if (variety[15]) slot(upcoming[0], variety[15], 8, 0, "solicitado", "-6 hours");

    // Reservas de ejemplo (Marta y otros consumidores).
    const insRes = conn.prepare(
      `INSERT INTO stall_reservations (slot_id, profile_id, name, phone, quantity, code, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'reservada', datetime('now', ?))`,
    );
    if (firstSlots[0]) insRes.run(firstSlots[0], "marta", "Marta Ruiz", "600 000 003", 2, "BACO-4821", "-1 days");
    if (firstSlots[1]) insRes.run(firstSlots[1], "c-pablo", "Pablo M.", "600 000 201", 1, "BACO-1937", "-2 days");

    // --- avisos simulados (lo que les llega al móvil) ---
    const insNote = conn.prepare(
      `INSERT INTO notifications (channel, profile_id, phone, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`,
    );
    insNote.run("whatsapp", "andres", "600 000 002", "Nueva petición en BACO", "El Brote te pide una muestra. Ábrelo para contestar con un toque.", null, "-5 hours");
    insNote.run("whatsapp", "andres", "600 000 002", "Puesto compartido", "Tu queso está aceptado para el próximo Día de Mercado. Entrega el día anterior de 17:00 a 19:00.", "/puesto", "-3 days");
    insNote.run("whatsapp", "lucia", "600 000 001", "Te han contestado", "La bodega ha contestado a tu petición de muestra. Míralo en tu panel.", "/panel", "-3 days");

    // --- altas asistidas de ejemplo ---
    const someProducers = conn
      .prepare(`SELECT id FROM producers WHERE owner_profile_id IS NULL AND name NOT GLOB '*[A-Z]. *' AND name NOT LIKE '%(%' ORDER BY id LIMIT 2 OFFSET 5`)
      .all() as { id: number }[];
    const insOnb = conn.prepare(
      `INSERT INTO onboardings (producer_id, contact_name, phone, met_at, description, capacity_note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`,
    );
    if (someProducers[0])
      insOnb.run(someProducers[0].id, "Persona de contacto (ejemplo)", "600 000 301", "Día de Mercado", "Hacemos producto artesano en pequeñas tandas.", "Pedidos con una semana de antelación.", "enviado", "-2 days", "-2 days");
    if (someProducers[1])
      insOnb.run(someProducers[1].id, "Persona de contacto (ejemplo)", "600 000 302", "Llamada telefónica", "Producción familiar desde hace tres generaciones.", "Reparto los jueves en Madrid capital.", "borrador", "-1 days", "-1 days");

    // --- distintivo de restaurantes ---
    conn.prepare(`INSERT OR IGNORE INTO badges (profile_id, status, requested_at, granted_at) VALUES ('h-brote', 'concedido', datetime('now','-30 days'), datetime('now','-28 days'))`).run();
    conn.prepare(`INSERT OR IGNORE INTO badges (profile_id, status, requested_at, granted_at) VALUES ('h-mercado', 'concedido', datetime('now','-20 days'), datetime('now','-19 days'))`).run();
    conn.prepare(`INSERT OR IGNORE INTO badges (profile_id, status, requested_at) VALUES ('h-sierra', 'solicitado', datetime('now','-2 days'))`).run();

    // --- llamadas pendientes de ejemplo ---
    const insHelp = conn.prepare(`INSERT INTO help_requests (name, phone, slot, topic, page, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))`);
    insHelp.run("Quesería de ejemplo", "600 000 401", "manana", "Quiero salir en BACO pero no sé usar la web", "/", "-3 hours");
    insHelp.run("Restaurante de ejemplo", "600 000 402", "tarde", "Cómo pido una muestra", "/producto", "-1 days");

    conn.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`).run(EXTRAS_VERSION, today);
  });
  run();
  ensureDemoLinks(conn);
}

// Enlaces de WhatsApp de ejemplo: uno para contestar una petición sin entrar (/r/…) y otro para que
// un productor revise la página que le ha preparado el equipo (/revisar/…). Duran 90 días.
const LINKS_VERSION = "extras-v2-links";
function ensureDemoLinks(conn: Database.Database) {
  if (conn.prepare(`SELECT 1 FROM meta WHERE key = ?`).get(LINKS_VERSION)) return;
  const link = (purpose: "responder" | "revisar", profileId: string | null, requestId: number | null, onboardingId: number | null) => {
    const token = randomBytes(18).toString("base64url");
    conn
      .prepare(`INSERT INTO magic_links (token, purpose, profile_id, request_id, onboarding_id, expires_at) VALUES (?, ?, ?, ?, ?, datetime('now', '+90 days'))`)
      .run(token, purpose, profileId, requestId, onboardingId);
    return token;
  };
  conn.transaction(() => {
    const req = conn
      .prepare(
        `SELECT r.id, pr.owner_profile_id AS owner FROM requests r JOIN producers pr ON pr.id = r.producer_id
         WHERE pr.owner_profile_id IS NOT NULL AND r.status = 'enviada' ORDER BY r.id LIMIT 1`,
      )
      .get() as { id: number; owner: string } | undefined;
    if (req) {
      const t = link("responder", req.owner, req.id, null);
      const n = conn.prepare(`UPDATE notifications SET link = ? WHERE profile_id = ? AND title = 'Nueva petición en BACO' AND link IS NULL`).run(`/r/${t}`, req.owner);
      if (n.changes === 0)
        conn
          .prepare(`INSERT INTO notifications (channel, profile_id, phone, title, body, link, created_at) VALUES ('whatsapp', ?, NULL, 'Nueva petición en BACO', 'Un restaurante te ha escrito. Ábrelo para contestar con un toque.', ?, datetime('now', '-5 hours'))`)
          .run(req.owner, `/r/${t}`);
    }
    const onb = conn.prepare(`SELECT id, phone FROM onboardings WHERE status = 'enviado' ORDER BY id LIMIT 1`).get() as { id: number; phone: string } | undefined;
    if (onb) {
      const t = link("revisar", null, null, onb.id);
      conn
        .prepare(`INSERT INTO notifications (channel, profile_id, phone, title, body, link, created_at) VALUES ('whatsapp', NULL, ?, 'Tu página en BACO está lista', 'Te hemos preparado la página con lo que nos contaste. Revísala y publícala con un toque.', ?, datetime('now', '-2 days'))`)
        .run(onb.phone, `/revisar/${t}`);
    }
    conn.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`).run(LINKS_VERSION, todayISO());
  })();
}
