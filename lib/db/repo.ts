// Repositorio de datos. Es la única puerta a la base de datos: páginas, acciones
// y el motor de match llaman a estas funciones, nunca a SQL directamente.
import { randomBytes, randomInt } from "node:crypto";
import { db } from "./client";
import { stallFormat, todayISO } from "./demo-extras";
import type { LabelCode, RequestStatus, RequestType, Role } from "../domain";

export type Profile = {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  business_name: string | null;
  business_type: string | null;
  municipality: string | null;
  lat: number | null;
  lng: number | null;
  is_demo: number;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  unit: string;
  price_hint: number | null;
  monthly_capacity: number | null;
  is_eco: number;
  search_text: string;
  embedding: string | null;
  source_url: string;
  producer_id: number;
  producer_name: string;
  municipality: string;
  lat: number;
  lng: number;
  owner_profile_id: string | null;
  labels: LabelCode[];
  rating: number | null;
  reviews: number;
  boost: number | null;
  offer: string | null;
};

export type Producer = {
  id: number;
  name: string;
  owner_profile_id: string | null;
  municipality: string;
  lat: number;
  lng: number;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  capacity_note: string | null;
  verified_at: string | null;
  is_mock: number;
};

const PRODUCT_SELECT = /* sql */ `
  SELECT p.id, p.slug, p.name, p.brand, p.category, p.subcategory, p.unit, p.price_hint,
         p.monthly_capacity, p.is_eco, p.search_text, p.embedding, p.source_url, p.producer_id,
         pr.name AS producer_name, pr.municipality, pr.lat, pr.lng, pr.owner_profile_id,
         (SELECT group_concat(label_code) FROM product_labels l WHERE l.product_id = p.id) AS labels,
         (SELECT avg(rating) FROM reviews r WHERE r.product_id = p.id) AS rating,
         (SELECT count(*) FROM reviews r WHERE r.product_id = p.id) AS reviews,
         (SELECT max(boost) FROM sponsorships s WHERE s.product_id = p.id AND s.ends_at >= date('now')) AS boost,
         (SELECT title FROM offers o WHERE o.product_id = p.id AND o.valid_until >= date('now') LIMIT 1) AS offer
  FROM products p JOIN producers pr ON pr.id = p.producer_id`;

type ProductRow = Omit<Product, "labels"> & { labels: string | null };
const toProduct = (r: ProductRow): Product => ({
  ...r,
  labels: (r.labels ? r.labels.split(",") : []) as LabelCode[],
});

// --- productos -----------------------------------------------------------------

let allCache: { at: number; rows: Product[] } | null = null;

// Catálogo completo en memoria (unos cientos de filas). Se refresca cada 30 s para
// recoger reseñas, patrocinios y ofertas nuevas.
export function allProducts(): Product[] {
  if (!allCache || Date.now() - allCache.at > 30_000) {
    const rows = db().prepare(PRODUCT_SELECT).all() as ProductRow[];
    allCache = { at: Date.now(), rows: rows.map(toProduct) };
  }
  return allCache.rows;
}

export function invalidateProducts() {
  allCache = null;
}

export function getProduct(id: number): Product | undefined {
  const row = db().prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) as ProductRow | undefined;
  return row && toProduct(row);
}

export function productsByProducer(producerId: number): Product[] {
  return (db().prepare(`${PRODUCT_SELECT} WHERE p.producer_id = ? ORDER BY p.category, p.name`).all(producerId) as ProductRow[]).map(
    toProduct,
  );
}

export function similarProducts(p: Product, limit = 4): Product[] {
  return (
    db()
      .prepare(`${PRODUCT_SELECT} WHERE p.category = ? AND p.id != ? AND p.producer_id != ? ORDER BY random() LIMIT ?`)
      .all(p.category, p.id, p.producer_id, limit) as ProductRow[]
  ).map(toProduct);
}

export function catalogStats() {
  const one = (sql: string) => (db().prepare(sql).get() as { n: number }).n;
  return {
    products: one(`SELECT count(*) n FROM products`),
    producers: one(`SELECT count(*) n FROM producers`),
    labelled: one(`SELECT count(DISTINCT product_id) n FROM product_labels`),
    claimed: one(`SELECT count(*) n FROM producers WHERE owner_profile_id IS NOT NULL`),
  };
}

export function categoryCounts() {
  return db().prepare(`SELECT category, count(*) AS n FROM products GROUP BY category ORDER BY n DESC`).all() as {
    category: string;
    n: number;
  }[];
}

export function labelCounts() {
  return db().prepare(`SELECT label_code AS code, count(*) AS n FROM product_labels GROUP BY label_code`).all() as {
    code: LabelCode;
    n: number;
  }[];
}

// Tendencias: eventos de los últimos 7 días, pesando más los recientes.
export function trendingProducts(limit = 6): (Product & { heat: number })[] {
  const rows = db()
    .prepare(
      `SELECT product_id AS id,
              sum(CASE type WHEN 'request' THEN 5 WHEN 'favorite' THEN 3 WHEN 'view' THEN 1 ELSE 0.5 END
                  * (1.0 / (1 + (julianday('now') - julianday(ts))))) AS heat
       FROM events WHERE ts >= datetime('now', '-7 days') AND product_id IS NOT NULL
       GROUP BY product_id ORDER BY heat DESC LIMIT ?`,
    )
    .all(limit) as { id: number; heat: number }[];
  const byId = new Map(allProducts().map((p) => [p.id, p]));
  return rows.flatMap((r) => {
    const p = byId.get(r.id);
    return p ? [{ ...p, heat: r.heat }] : [];
  });
}

export function trendingProducers(limit = 5) {
  return db()
    .prepare(
      `SELECT pr.id, pr.name, pr.municipality, count(*) AS events
       FROM events e JOIN products p ON p.id = e.product_id JOIN producers pr ON pr.id = p.producer_id
       WHERE e.ts >= datetime('now', '-7 days')
       GROUP BY pr.id ORDER BY events DESC LIMIT ?`,
    )
    .all(limit) as { id: number; name: string; municipality: string; events: number }[];
}

export function currentOffers(limit = 6): Product[] {
  return allProducts()
    .filter((p) => p.offer)
    .slice(0, limit);
}

// --- productores ---------------------------------------------------------------

export function getProducer(id: number): Producer | undefined {
  return db().prepare(`SELECT * FROM producers WHERE id = ?`).get(id) as Producer | undefined;
}

export function producerOwnedBy(profileId: string): Producer | undefined {
  return db().prepare(`SELECT * FROM producers WHERE owner_profile_id = ?`).get(profileId) as Producer | undefined;
}

export function updateProducer(id: number, fields: Pick<Producer, "description" | "phone" | "website" | "capacity_note">) {
  db()
    .prepare(`UPDATE producers SET description = @description, phone = @phone, website = @website, capacity_note = @capacity_note WHERE id = @id`)
    .run({ ...fields, id });
}

export function producerStats(producerId: number) {
  const q = (type: string) =>
    (
      db()
        .prepare(
          `SELECT count(*) n FROM events e JOIN products p ON p.id = e.product_id
           WHERE p.producer_id = ? AND e.type = ? AND e.ts >= datetime('now', '-7 days')`,
        )
        .get(producerId, type) as { n: number }
    ).n;
  const req = db()
    .prepare(
      `SELECT count(*) AS total, sum(status IN ('respondida','cerrada')) AS answered
       FROM requests WHERE producer_id = ?`,
    )
    .get(producerId) as { total: number; answered: number | null };
  return {
    searchHits: q("search_hit"),
    views: q("view"),
    favorites: q("favorite"),
    requests: req.total,
    answerRate: req.total ? (req.answered ?? 0) / req.total : 0,
  };
}

// --- perfiles ------------------------------------------------------------------

export function getProfile(id: string): Profile | undefined {
  return db().prepare(`SELECT * FROM profiles WHERE id = ?`).get(id) as Profile | undefined;
}

export function demoProfiles(): Profile[] {
  return db().prepare(`SELECT * FROM profiles WHERE is_demo = 1 ORDER BY role`).all() as Profile[];
}

// --- solicitudes ---------------------------------------------------------------

export type RequestRow = {
  id: number;
  type: RequestType;
  quantity: string | null;
  message: string;
  status: RequestStatus;
  reply: string | null;
  created_at: string;
  updated_at: string;
  product_id: number | null;
  product_name: string | null;
  product_category: string | null;
  producer_id: number;
  producer_name: string;
  from_profile_id: string;
  from_name: string;
  from_business: string | null;
  from_business_type: string | null;
  from_municipality: string | null;
  from_phone: string | null;
  owner_profile_id: string | null;
};

const REQUEST_SELECT = /* sql */ `
  SELECT r.*, p.name AS product_name, p.category AS product_category, pr.name AS producer_name,
         f.name AS from_name, f.business_name AS from_business, f.business_type AS from_business_type,
         f.municipality AS from_municipality, f.phone AS from_phone, pr.owner_profile_id
  FROM requests r
  JOIN producers pr ON pr.id = r.producer_id
  JOIN profiles f ON f.id = r.from_profile_id
  LEFT JOIN products p ON p.id = r.product_id`;

export function createRequest(input: {
  fromProfileId: string;
  productId: number;
  type: RequestType;
  quantity: string | null;
  message: string;
}) {
  const product = getProduct(input.productId);
  if (!product) throw new Error("Producto no encontrado");
  const info = db()
    .prepare(
      `INSERT INTO requests (from_profile_id, producer_id, product_id, type, quantity, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(input.fromProfileId, product.producer_id, product.id, input.type, input.quantity, input.message);
  logEvent(input.fromProfileId, product.id, "request");
  return Number(info.lastInsertRowid);
}

export function requestsFrom(profileId: string): RequestRow[] {
  return db().prepare(`${REQUEST_SELECT} WHERE r.from_profile_id = ? ORDER BY r.created_at DESC`).all(profileId) as RequestRow[];
}

export function requestsFor(producerId: number): RequestRow[] {
  return db()
    .prepare(
      `${REQUEST_SELECT} WHERE r.producer_id = ?
       ORDER BY CASE r.status WHEN 'enviada' THEN 0 WHEN 'vista' THEN 1 ELSE 2 END, r.created_at DESC`,
    )
    .all(producerId) as RequestRow[];
}

export function getRequest(id: number): RequestRow | undefined {
  return db().prepare(`${REQUEST_SELECT} WHERE r.id = ?`).get(id) as RequestRow | undefined;
}

export function updateRequest(id: number, status: RequestStatus, reply?: string | null) {
  db()
    .prepare(`UPDATE requests SET status = ?, reply = coalesce(?, reply), updated_at = datetime('now') WHERE id = ?`)
    .run(status, reply ?? null, id);
}

// --- reseñas, favoritos y eventos ------------------------------------------------

export type Review = { id: number; rating: number; text: string | null; created_at: string; name: string; business_name: string | null; role: Role; is_mock: number };

export function reviewsFor(productId: number): Review[] {
  return db()
    .prepare(
      `SELECT r.id, r.rating, r.text, r.created_at, r.is_mock, f.name, f.business_name, f.role
       FROM reviews r JOIN profiles f ON f.id = r.profile_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC`,
    )
    .all(productId) as Review[];
}

export function addReview(profileId: string, productId: number, rating: number, text: string | null) {
  db().prepare(`INSERT INTO reviews (profile_id, product_id, rating, text) VALUES (?, ?, ?, ?)`).run(profileId, productId, rating, text);
  invalidateProducts();
}

export function isFavorite(profileId: string, productId: number) {
  return !!db().prepare(`SELECT 1 FROM favorites WHERE profile_id = ? AND product_id = ?`).get(profileId, productId);
}

export function toggleFavorite(profileId: string, productId: number) {
  if (isFavorite(profileId, productId)) {
    db().prepare(`DELETE FROM favorites WHERE profile_id = ? AND product_id = ?`).run(profileId, productId);
    return false;
  }
  db().prepare(`INSERT INTO favorites (profile_id, product_id) VALUES (?, ?)`).run(profileId, productId);
  logEvent(profileId, productId, "favorite");
  return true;
}

export function favoritesOf(profileId: string): Product[] {
  const ids = (db().prepare(`SELECT product_id FROM favorites WHERE profile_id = ? ORDER BY created_at DESC`).all(profileId) as {
    product_id: number;
  }[]).map((r) => r.product_id);
  const byId = new Map(allProducts().map((p) => [p.id, p]));
  return ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}

export function logEvent(profileId: string | null, productId: number, type: "view" | "search_hit" | "favorite" | "request") {
  db().prepare(`INSERT INTO events (profile_id, product_id, type) VALUES (?, ?, ?)`).run(profileId, productId, type);
}

export function logSearchHits(profileId: string | null, productIds: number[]) {
  const ins = db().prepare(`INSERT INTO events (profile_id, product_id, type) VALUES (?, ?, 'search_hit')`);
  db().transaction(() => productIds.forEach((id) => ins.run(profileId, id)))();
}

export function setEmbedding(productId: number, vector: number[]) {
  db().prepare(`UPDATE products SET embedding = ? WHERE id = ?`).run(JSON.stringify(vector), productId);
}

// --- ayuda ---------------------------------------------------------------------------

export function createHelpRequest(r: { name: string; phone: string; slot: string; topic: string | null; page: string | null; profileId: string | null }) {
  db()
    .prepare(`INSERT INTO help_requests (name, phone, slot, topic, page, profile_id) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(r.name, r.phone, r.slot, r.topic, r.page, r.profileId);
}

// --- utilidades ------------------------------------------------------------------------

// Teléfono normalizado a 9 cifras (sin prefijo +34, espacios ni guiones).
export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "").replace(/^(0034|34)(?=\d{9}$)/, "");
}

export function profileByPhone(phone: string): Profile | undefined {
  const want = phoneDigits(phone);
  return (db().prepare(`SELECT * FROM profiles WHERE phone IS NOT NULL`).all() as Profile[]).find((p) => phoneDigits(p.phone!) === want);
}

export function profilesByRole(role: Role): Profile[] {
  return db().prepare(`SELECT * FROM profiles WHERE role = ? ORDER BY name`).all(role) as Profile[];
}

// --- avisos (WhatsApp / SMS / correo simulados) ---------------------------------------

export type Notification = { id: number; channel: "whatsapp" | "sms" | "email"; profile_id: string | null; phone: string | null; title: string; body: string; link: string | null; created_at: string };

export function addNotification(n: Omit<Notification, "id" | "created_at">) {
  db()
    .prepare(`INSERT INTO notifications (channel, profile_id, phone, title, body, link) VALUES (@channel, @profile_id, @phone, @title, @body, @link)`)
    .run(n);
}

export function notificationsFor(profileId: string, limit = 10): Notification[] {
  return db().prepare(`SELECT * FROM notifications WHERE profile_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`).all(profileId, limit) as Notification[];
}

export function allNotifications(limit = 60): (Notification & { profile_name: string | null })[] {
  return db()
    .prepare(
      `SELECT n.*, p.name AS profile_name FROM notifications n LEFT JOIN profiles p ON p.id = n.profile_id
       ORDER BY n.created_at DESC, n.id DESC LIMIT ?`,
    )
    .all(limit) as (Notification & { profile_name: string | null })[];
}

// --- enlaces de un solo uso -------------------------------------------------------------

export type MagicLink = { token: string; purpose: "responder" | "revisar"; profile_id: string | null; request_id: number | null; onboarding_id: number | null; expires_at: string; used_at: string | null };

export function createMagicLink(l: { purpose: MagicLink["purpose"]; profileId?: string | null; requestId?: number | null; onboardingId?: number | null; days?: number }) {
  const token = randomBytes(18).toString("base64url");
  db()
    .prepare(`INSERT INTO magic_links (token, purpose, profile_id, request_id, onboarding_id, expires_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))`)
    .run(token, l.purpose, l.profileId ?? null, l.requestId ?? null, l.onboardingId ?? null, `+${l.days ?? 14} days`);
  return token;
}

// Devuelve el enlace si existe y no ha caducado (puede estar ya usado: la página lo dice).
export function getMagicLink(token: string): MagicLink | undefined {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return undefined;
  return db().prepare(`SELECT * FROM magic_links WHERE token = ? AND expires_at > datetime('now')`).get(token) as MagicLink | undefined;
}

export function markMagicLinkUsed(token: string) {
  db().prepare(`UPDATE magic_links SET used_at = datetime('now') WHERE token = ? AND used_at IS NULL`).run(token);
}

// --- códigos de acceso por SMS -----------------------------------------------------------

export function createLoginCode(phone: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  db().prepare(`INSERT INTO login_codes (phone, code, expires_at, created_at) VALUES (?, ?, datetime('now', '+10 minutes'), datetime('now'))`).run(phoneDigits(phone), code);
  return code;
}

export const MAX_CODE_ATTEMPTS = 5;

// Compara con el código más reciente sin usar y sin caducar de ese teléfono.
// Cada fallo cuenta; al quinto el código deja de valer y hay que pedir otro.
export function verifyLoginCode(phone: string, code: string): "ok" | "mal" | "bloqueado" {
  const row = db()
    .prepare(`SELECT id, code, attempts FROM login_codes WHERE phone = ? AND used_at IS NULL AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1`)
    .get(phoneDigits(phone)) as { id: number; code: string; attempts: number } | undefined;
  if (!row) return "mal";
  if (row.attempts >= MAX_CODE_ATTEMPTS) return "bloqueado";
  if (row.code !== code.replace(/\D/g, "")) {
    db().prepare(`UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?`).run(row.id);
    return row.attempts + 1 >= MAX_CODE_ATTEMPTS ? "bloqueado" : "mal";
  }
  db().prepare(`UPDATE login_codes SET used_at = datetime('now') WHERE id = ?`).run(row.id);
  return "ok";
}

// Códigos pedidos para ese teléfono en los últimos 10 minutos (para no mandar SMS sin fin).
export function recentLoginCodes(phone: string) {
  return (db().prepare(`SELECT count(*) n FROM login_codes WHERE phone = ? AND created_at > datetime('now', '-10 minutes')`).get(phoneDigits(phone)) as { n: number }).n;
}

// Teléfonos reservados para la demo (600 000 xxx): solo para ellos se enseñan códigos y avisos completos.
export function isDemoPhone(phone: string | null | undefined) {
  return /^600000\d{3}$/.test(phoneDigits(phone ?? ""));
}

export function latestLoginCode(phone: string) {
  return (
    db()
      .prepare(`SELECT code FROM login_codes WHERE phone = ? AND used_at IS NULL AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1`)
      .get(phoneDigits(phone)) as { code: string } | undefined
  )?.code;
}

// --- agenda en persona -------------------------------------------------------------------

export type AgendaItem = {
  id: number;
  kind: "mercado" | "feria" | "encuentro" | "taller" | "ruta" | "alta";
  title: string;
  date: string;
  end_date: string | null;
  date_note: string | null;
  time: string | null;
  place: string;
  municipality: string | null;
  organizer: string;
  url: string | null;
  description: string;
  audience: "productores" | "hosteleros" | "consumidores" | "todos";
  by_baco: number;
  capacity: number | null;
  is_mock: number;
  signups: number;
  has_stall: number;
};

const AGENDA_SELECT = /* sql */ `
  SELECT a.*, (SELECT count(*) FROM agenda_signups s WHERE s.agenda_id = a.id) AS signups,
         EXISTS (SELECT 1 FROM stall_days d WHERE d.agenda_id = a.id) AS has_stall
  FROM agenda a`;

export function upcomingAgenda(filter: { audience?: string; kind?: string; limit?: number } = {}): AgendaItem[] {
  const today = todayISO();
  return (db().prepare(`${AGENDA_SELECT} WHERE coalesce(a.end_date, a.date) >= ? ORDER BY a.date, a.by_baco DESC, a.id`).all(today) as AgendaItem[])
    .filter((a) => !filter.audience || a.audience === filter.audience || a.audience === "todos")
    .filter((a) => !filter.kind || (filter.kind === "baco" ? a.by_baco === 1 : a.kind === filter.kind))
    .slice(0, filter.limit ?? 200);
}

export function getAgenda(id: number): AgendaItem | undefined {
  return db().prepare(`${AGENDA_SELECT} WHERE a.id = ?`).get(id) as AgendaItem | undefined;
}

// Comprueba el aforo y apunta en la misma transacción. Devuelve false si ya no quedan plazas.
export function addSignup(s: { agendaId: number; profileId: string | null; name: string; phone: string; role: string | null }) {
  const conn = db();
  return conn.transaction(() => {
    const a = conn.prepare(`SELECT capacity, (SELECT count(*) FROM agenda_signups WHERE agenda_id = ?) AS n FROM agenda WHERE id = ?`).get(s.agendaId, s.agendaId) as
      | { capacity: number | null; n: number }
      | undefined;
    if (!a || (a.capacity && a.n >= a.capacity)) return false;
    conn.prepare(`INSERT INTO agenda_signups (agenda_id, profile_id, name, phone, role) VALUES (?, ?, ?, ?, ?)`).run(s.agendaId, s.profileId, s.name, s.phone, s.role);
    return true;
  })();
}

export function isPhoneSignedUp(agendaId: number, phone: string) {
  const digits = phoneDigits(phone);
  const rows = db().prepare(`SELECT phone FROM agenda_signups WHERE agenda_id = ?`).all(agendaId) as { phone: string | null }[];
  return rows.some((r) => r.phone && phoneDigits(r.phone) === digits);
}

export function isSignedUp(agendaId: number, profileId: string) {
  return Boolean(db().prepare(`SELECT 1 FROM agenda_signups WHERE agenda_id = ? AND profile_id = ?`).get(agendaId, profileId));
}

export function signupsOf(profileId: string): AgendaItem[] {
  return db()
    .prepare(`${AGENDA_SELECT} WHERE a.id IN (SELECT agenda_id FROM agenda_signups WHERE profile_id = ?) AND coalesce(a.end_date, a.date) >= ? ORDER BY a.date`)
    .all(profileId, todayISO()) as AgendaItem[];
}

export function signupsByEvent(): { id: number; title: string; date: string; capacity: number | null; people: { name: string; phone: string; role: string | null }[] }[] {
  const events = db()
    .prepare(`SELECT id, title, date, capacity FROM agenda WHERE by_baco = 1 AND coalesce(end_date, date) >= ? ORDER BY date`)
    .all(todayISO()) as { id: number; title: string; date: string; capacity: number | null }[];
  const people = db().prepare(`SELECT name, phone, role FROM agenda_signups WHERE agenda_id = ? ORDER BY created_at`);
  return events.map((e) => ({ ...e, people: people.all(e.id) as { name: string; phone: string; role: string | null }[] }));
}

// --- puesto compartido ---------------------------------------------------------------------

export type StallDay = {
  id: number;
  market: string;
  date: string;
  time: string;
  place: string;
  municipality: string;
  deadline: string;
  drop_off: string;
  commission: number;
  max_products: number;
  agenda_id: number | null;
  accepted: number;
  pending: number;
};

const DAY_SELECT = /* sql */ `
  SELECT d.*, (SELECT count(*) FROM stall_slots s WHERE s.stall_day_id = d.id AND s.status = 'aceptado') AS accepted,
         (SELECT count(*) FROM stall_slots s WHERE s.stall_day_id = d.id AND s.status = 'solicitado') AS pending
  FROM stall_days d`;

export function stallDays(when: "proximos" | "pasados" | "todos" = "proximos"): StallDay[] {
  const today = todayISO();
  const where = when === "proximos" ? `WHERE d.date >= ?` : when === "pasados" ? `WHERE d.date < ?` : `WHERE ? = ?`;
  const args = when === "todos" ? [1, 1] : [today];
  return db().prepare(`${DAY_SELECT} ${where} ORDER BY d.date ${when === "pasados" ? "DESC" : ""}`).all(...args) as StallDay[];
}

export function getStallDay(id: number): StallDay | undefined {
  return db().prepare(`${DAY_SELECT} WHERE d.id = ?`).get(id) as StallDay | undefined;
}

export type StallSlot = {
  id: number;
  stall_day_id: number;
  producer_id: number;
  product_id: number;
  unit_label: string;
  unit_price: number;
  quantity: number;
  sold: number;
  status: "solicitado" | "aceptado" | "rechazado";
  note: string | null;
  created_at: string;
  reserved: number;
  available: number;
  product_name: string;
  category: string;
  producer_name: string;
  municipality: string;
  day_date: string;
  day_market: string;
  commission: number;
};

const SLOT_SELECT = /* sql */ `
  SELECT s.*, p.name AS product_name, p.category, pr.name AS producer_name, pr.municipality,
         d.date AS day_date, d.market AS day_market, d.commission,
         coalesce((SELECT sum(quantity) FROM stall_reservations r WHERE r.slot_id = s.id AND r.status = 'reservada'), 0) AS reserved,
         s.quantity - s.sold - coalesce((SELECT sum(quantity) FROM stall_reservations r WHERE r.slot_id = s.id AND r.status = 'reservada'), 0) AS available
  FROM stall_slots s
  JOIN products p ON p.id = s.product_id
  JOIN producers pr ON pr.id = s.producer_id
  JOIN stall_days d ON d.id = s.stall_day_id`;

export function slotsForDay(dayId: number, status?: StallSlot["status"]): StallSlot[] {
  return db()
    .prepare(`${SLOT_SELECT} WHERE s.stall_day_id = ? ${status ? "AND s.status = ?" : ""} ORDER BY p.category, p.name`)
    .all(...(status ? [dayId, status] : [dayId])) as StallSlot[];
}

export function getSlot(id: number): StallSlot | undefined {
  return db().prepare(`${SLOT_SELECT} WHERE s.id = ?`).get(id) as StallSlot | undefined;
}

export function slotsOfProducer(producerId: number): StallSlot[] {
  return db().prepare(`${SLOT_SELECT} WHERE s.producer_id = ? ORDER BY d.date DESC, s.id`).all(producerId) as StallSlot[];
}

export function pendingSlots(): StallSlot[] {
  return db().prepare(`${SLOT_SELECT} WHERE s.status = 'solicitado' AND d.date >= ? ORDER BY d.date, s.created_at`).all(todayISO()) as StallSlot[];
}

export function createSlot(input: { dayId: number; producerId: number; productId: number; quantity: number; note: string | null }) {
  const product = getProduct(input.productId);
  if (!product || product.producer_id !== input.producerId) throw new Error("Producto no válido");
  const f = stallFormat(product.category, product.price_hint);
  const info = db()
    .prepare(`INSERT INTO stall_slots (stall_day_id, producer_id, product_id, unit_label, unit_price, quantity, note) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(input.dayId, input.producerId, input.productId, f.label, f.price, input.quantity, input.note);
  return Number(info.lastInsertRowid);
}

export function slotExists(dayId: number, productId: number) {
  return Boolean(db().prepare(`SELECT 1 FROM stall_slots WHERE stall_day_id = ? AND product_id = ? AND status != 'rechazado'`).get(dayId, productId));
}

export function setSlotStatus(id: number, status: StallSlot["status"]) {
  db().prepare(`UPDATE stall_slots SET status = ? WHERE id = ?`).run(status, id);
}

export function setSlotSold(id: number, sold: number) {
  db().prepare(`UPDATE stall_slots SET sold = min(?, quantity) WHERE id = ?`).run(Math.max(0, sold), id);
}

export type Reservation = {
  id: number;
  slot_id: number;
  profile_id: string | null;
  name: string;
  phone: string;
  quantity: number;
  code: string;
  status: "reservada" | "recogida" | "cancelada";
  created_at: string;
  product_name: string;
  product_id: number;
  category: string;
  unit_label: string;
  unit_price: number;
  producer_name: string;
  day_id: number;
  day_date: string;
  day_market: string;
  day_time: string;
  day_place: string;
};

const RES_SELECT = /* sql */ `
  SELECT r.*, p.name AS product_name, p.id AS product_id, p.category, s.unit_label, s.unit_price, pr.name AS producer_name,
         d.id AS day_id, d.date AS day_date, d.market AS day_market, d.time AS day_time, d.place AS day_place
  FROM stall_reservations r
  JOIN stall_slots s ON s.id = r.slot_id
  JOIN products p ON p.id = s.product_id
  JOIN producers pr ON pr.id = s.producer_id
  JOIN stall_days d ON d.id = s.stall_day_id`;

// Reserva para recoger en el puesto. Comprueba existencias en la misma transacción.
export function createReservation(r: { slotId: number; profileId: string | null; name: string; phone: string; quantity: number }) {
  return db().transaction(() => {
    const slot = getSlot(r.slotId);
    if (!slot || slot.status !== "aceptado") return { ok: false as const, reason: "Este producto ya no está en el puesto." };
    if (slot.day_date < todayISO()) return { ok: false as const, reason: "Ese día de mercado ya ha pasado." };
    if (r.quantity > slot.available) return { ok: false as const, reason: slot.available > 0 ? `Solo quedan ${slot.available} para reservar.` : "Ya no quedan unidades para reservar." };
    const code = `BACO-${String(randomInt(1000, 10000))}`;
    const info = db()
      .prepare(`INSERT INTO stall_reservations (slot_id, profile_id, name, phone, quantity, code) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(r.slotId, r.profileId, r.name, r.phone, r.quantity, code);
    return { ok: true as const, id: Number(info.lastInsertRowid), code };
  })();
}

export function getReservation(id: number): Reservation | undefined {
  return db().prepare(`${RES_SELECT} WHERE r.id = ?`).get(id) as Reservation | undefined;
}

export function reservationsOf(profileId: string): Reservation[] {
  return db().prepare(`${RES_SELECT} WHERE r.profile_id = ? ORDER BY d.date DESC, r.id DESC`).all(profileId) as Reservation[];
}

export function reservationsForDay(dayId: number): Reservation[] {
  return db().prepare(`${RES_SELECT} WHERE d.id = ? ORDER BY r.status, r.name`).all(dayId) as Reservation[];
}

export function setReservationStatus(id: number, status: Reservation["status"]) {
  db().prepare(`UPDATE stall_reservations SET status = ? WHERE id = ?`).run(status, id);
}

// --- altas asistidas -------------------------------------------------------------------------

export type Onboarding = {
  id: number;
  producer_id: number;
  producer_name: string;
  municipality: string;
  contact_name: string;
  phone: string;
  met_at: string | null;
  description: string | null;
  capacity_note: string | null;
  website: string | null;
  status: "borrador" | "enviado" | "publicado" | "cambios";
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

const ONB_SELECT = /* sql */ `SELECT o.*, pr.name AS producer_name, pr.municipality FROM onboardings o JOIN producers pr ON pr.id = o.producer_id`;

export function onboardings(): Onboarding[] {
  return db()
    .prepare(`${ONB_SELECT} ORDER BY CASE o.status WHEN 'cambios' THEN 0 WHEN 'borrador' THEN 1 WHEN 'enviado' THEN 2 ELSE 3 END, o.updated_at DESC`)
    .all() as Onboarding[];
}

export function getOnboarding(id: number): Onboarding | undefined {
  return db().prepare(`${ONB_SELECT} WHERE o.id = ?`).get(id) as Onboarding | undefined;
}

export function createOnboarding(o: { producerId: number; contactName: string; phone: string; metAt: string | null; description: string | null; capacityNote: string | null; website: string | null }) {
  const info = db()
    .prepare(`INSERT INTO onboardings (producer_id, contact_name, phone, met_at, description, capacity_note, website) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(o.producerId, o.contactName, o.phone, o.metAt, o.description, o.capacityNote, o.website);
  return Number(info.lastInsertRowid);
}

export function setOnboardingStatus(id: number, status: Onboarding["status"], feedback?: string | null) {
  db()
    .prepare(`UPDATE onboardings SET status = ?, feedback = coalesce(?, feedback), updated_at = datetime('now') WHERE id = ?`)
    .run(status, feedback ?? null, id);
}

// Publica lo que preparó el equipo en la página del productor y la marca como revisada por él.
export function publishOnboarding(id: number) {
  const o = getOnboarding(id);
  if (!o) return;
  db().transaction(() => {
    db()
      .prepare(
        `UPDATE producers SET description = coalesce(?, description), capacity_note = coalesce(?, capacity_note),
           website = coalesce(?, website), phone = ?, verified_at = datetime('now') WHERE id = ?`,
      )
      .run(o.description, o.capacity_note, o.website, o.phone, o.producer_id);
    setOnboardingStatus(id, "publicado");
  })();
}

export function searchProducers(q: string, limit = 8): { id: number; name: string; municipality: string; products: number; onboarded: number }[] {
  const like = `%${q.trim()}%`;
  return db()
    .prepare(
      `SELECT pr.id, pr.name, pr.municipality, (SELECT count(*) FROM products p WHERE p.producer_id = pr.id) AS products,
              EXISTS (SELECT 1 FROM onboardings o WHERE o.producer_id = pr.id) AS onboarded
       FROM producers pr WHERE pr.owner_profile_id IS NULL AND pr.name LIKE ? ORDER BY pr.name LIMIT ?`,
    )
    .all(like, limit) as { id: number; name: string; municipality: string; products: number; onboarded: number }[];
}

// --- distintivo de restaurantes --------------------------------------------------------------

export type Badge = { profile_id: string; status: "solicitado" | "concedido"; requested_at: string; granted_at: string | null };

export function badgeOf(profileId: string): Badge | undefined {
  return db().prepare(`SELECT * FROM badges WHERE profile_id = ?`).get(profileId) as Badge | undefined;
}

export function requestBadge(profileId: string) {
  db().prepare(`INSERT OR IGNORE INTO badges (profile_id, status) VALUES (?, 'solicitado')`).run(profileId);
}

export function grantBadge(profileId: string) {
  db().prepare(`UPDATE badges SET status = 'concedido', granted_at = datetime('now') WHERE profile_id = ?`).run(profileId);
}

export function pendingBadges(): (Profile & { answered: number })[] {
  return db()
    .prepare(
      `SELECT pf.*, (SELECT count(*) FROM requests r WHERE r.from_profile_id = pf.id AND r.status IN ('respondida','cerrada')) AS answered
       FROM badges b JOIN profiles pf ON pf.id = b.profile_id WHERE b.status = 'solicitado' ORDER BY b.requested_at`,
    )
    .all() as (Profile & { answered: number })[];
}

// Productores con los que un restaurante ha cerrado conversación (petición contestada).
export function suppliersOf(profileId: string): { id: number; name: string; municipality: string }[] {
  return db()
    .prepare(
      `SELECT DISTINCT pr.id, pr.name, pr.municipality FROM requests r JOIN producers pr ON pr.id = r.producer_id
       WHERE r.from_profile_id = ? AND r.status IN ('respondida','cerrada') ORDER BY pr.name`,
    )
    .all(profileId) as { id: number; name: string; municipality: string }[];
}

export function restaurantsWithBadge(): (Profile & { granted_at: string })[] {
  return db()
    .prepare(`SELECT pf.*, b.granted_at FROM badges b JOIN profiles pf ON pf.id = b.profile_id WHERE b.status = 'concedido' ORDER BY pf.business_name`)
    .all() as (Profile & { granted_at: string })[];
}

// --- llamadas pendientes ("Que me llamen") ----------------------------------------------------

export type HelpRequest = { id: number; name: string; phone: string; slot: string; topic: string | null; page: string | null; status: "pendiente" | "llamada"; created_at: string };

export function helpRequests(): HelpRequest[] {
  return db().prepare(`SELECT * FROM help_requests ORDER BY status = 'llamada', created_at DESC`).all() as HelpRequest[];
}

export function markHelpCalled(id: number) {
  db().prepare(`UPDATE help_requests SET status = 'llamada' WHERE id = ?`).run(id);
}

// --- zonas (piloto Sierra Norte) ---------------------------------------------------------------

export function producersIn(municipalities: string[]): (Producer & { products: number; main_category: string | null })[] {
  const marks = municipalities.map(() => "?").join(",");
  return db()
    .prepare(
      `SELECT pr.*, (SELECT count(*) FROM products p WHERE p.producer_id = pr.id) AS products,
              (SELECT p.category FROM products p WHERE p.producer_id = pr.id GROUP BY p.category ORDER BY count(*) DESC LIMIT 1) AS main_category
       FROM producers pr WHERE pr.municipality IN (${marks}) ORDER BY pr.municipality, pr.name`,
    )
    .all(...municipalities) as (Producer & { products: number; main_category: string | null })[];
}
