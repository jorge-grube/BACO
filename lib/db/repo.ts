// Repositorio de datos. Es la única puerta a la base de datos: páginas, acciones
// y el motor de match llaman a estas funciones, nunca a SQL directamente.
import { db } from "./client";
import type { LabelCode, RequestStatus, RequestType, Role } from "../domain";

export type Profile = {
  id: string;
  role: Role;
  name: string;
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
};

const REQUEST_SELECT = /* sql */ `
  SELECT r.*, p.name AS product_name, p.category AS product_category, pr.name AS producer_name,
         f.name AS from_name, f.business_name AS from_business, f.business_type AS from_business_type,
         f.municipality AS from_municipality
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
