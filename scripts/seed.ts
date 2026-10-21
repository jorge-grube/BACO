// Crea data/baco.db a partir de data/catalog.raw.json (catálogo oficial) y completa
// con datos de ejemplo lo que el catálogo no publica: ubicación, capacidad, precio,
// reseñas, actividad y solicitudes. Todo lo simulado queda marcado con is_mock = 1.
// Uso: npm run seed
import { readFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { openFresh } from "../lib/db/client";
import { ensureDemoExtras } from "../lib/db/demo-extras";
import { MUNICIPALITIES, findMunicipality, normalize } from "../lib/geo";
import { CATEGORIES, LABELS, type LabelCode } from "../lib/domain";
import { buildSearchText } from "../lib/match/text";

type Raw = {
  slug: string;
  url: string;
  tag: string;
  name: string;
  producer: string;
  brand: string;
  category: string | null;
  labels: LabelCode[];
};

const root = path.join(__dirname, "..");
// Algunas fichas del catálogo no traen empresa: usamos la marca como nombre del productor.
const raw: Raw[] = (JSON.parse(readFileSync(path.join(root, "data", "catalog.raw.json"), "utf8")) as Raw[]).map((p) => ({
  ...p,
  producer: p.producer.trim() || p.brand.trim() || "Productor sin identificar",
}));
const dbFile = path.join(root, "data", "baco.db");
for (const f of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) if (existsSync(f)) rmSync(f);
const db = openFresh(dbFile);

// --- aleatoriedad reproducible -------------------------------------------------
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

// --- categoría de los productos que solo llegaron por un sello -------------------
function inferCategory(p: Raw): string {
  if (p.category) return p.category;
  const t = normalize(`${p.tag} ${p.name}`);
  if (p.labels.includes("DOP_VINOS_MADRID") || /\bvino\b|tinto|blanco|rosado|crianza/.test(t)) return "Vinos";
  if (p.labels.includes("DOP_ACEITE_MADRID") || /aceite/.test(t)) return "Aceite";
  if (p.labels.includes("DC_ACEITUNAS_CAMPO_REAL") || /aceituna|encurt/.test(t)) return "Aceitunas y encurtidos";
  if (p.labels.includes("IGP_CARNE_GUADARRAMA") || /carne|ternera|vacuno/.test(t)) return "Carnes";
  if (/queso/.test(t)) return "Quesos";
  if (/miel/.test(t)) return "Otros alimentos";
  if (/pan|bolleria|reposter|galleta|magdalena/.test(t)) return "Pan y repostería";
  if (/cafe|chocolate|cacao/.test(t)) return "Café y chocolates";
  if (/leche|yogur|lacteo|nata|mantequilla/.test(t)) return "Lácteos";
  if (/fruta|verdura|hortaliza|tomate|lechuga|melon|patata|ajo|cebolla/.test(t)) return "Verduras y frutas";
  if (/cerveza|licor|zumo|bebida/.test(t)) return "Bebidas";
  return "Otros alimentos";
}

// --- ubicación de ejemplo del productor -----------------------------------------
const AREAS: Record<string, string[]> = {
  Vinos: ["San Martín de Valdeiglesias", "Navalcarnero", "Arganda del Rey", "Colmenar de Oreja", "Villarejo de Salvanés", "Cadalso de los Vidrios"],
  Aceite: ["Campo Real", "Morata de Tajuña", "Villarejo de Salvanés", "Chinchón"],
  "Aceitunas y encurtidos": ["Campo Real", "Arganda del Rey", "Madrid"],
  Carnes: ["Guadarrama", "Colmenar Viejo", "Rascafría", "Buitrago del Lozoya"],
  Embutidos: ["Colmenar Viejo", "Guadarrama", "Navalcarnero", "Getafe"],
  Quesos: ["Colmenar Viejo", "Torrelaguna", "Lozoyuela", "Miraflores de la Sierra", "Campo Real", "Villarejo de Salvanés"],
  Lácteos: ["Colmenar Viejo", "Torrelaguna", "San Sebastián de los Reyes"],
  "Verduras y frutas": ["Aranjuez", "Villa del Prado", "Chinchón", "Valdemoro"],
  "Pan y repostería": ["Torrelaguna", "Getafe", "Madrid", "Alcalá de Henares"],
  "Otros alimentos": ["Braojos", "Miraflores de la Sierra", "Buitrago del Lozoya", "Mejorada del Campo"],
};
const INDUSTRIAL = ["Getafe", "Fuenlabrada", "Alcobendas", "Mejorada del Campo", "Torrejón de Ardoz", "Pinto", "Madrid"];
const NAME_HINTS: [RegExp, string][] = [
  [/braojos/, "Braojos"],
  [/valdeiglesias/, "San Martín de Valdeiglesias"],
  [/arganda/, "Arganda del Rey"],
  [/guadarrama/, "Guadarrama"],
  [/colmenarena/, "Colmenar Viejo"],
  [/miraflores/, "Miraflores de la Sierra"],
  [/vallekas|vallecas/, "Madrid"],
  [/campo real|aceitunas/, "Campo Real"],
  [/chinchon/, "Chinchón"],
];

function producerTown(name: string, category: string): string {
  const n = normalize(name);
  for (const [re, town] of NAME_HINTS) if (re.test(n)) return town;
  const r = rng(`town:${name}`);
  return pick(r, AREAS[category] ?? INDUSTRIAL);
}

// --- unidad, precio y capacidad orientativos por categoría ------------------------
const UNIT: Record<string, [string, number, [number, number]]> = {
  Quesos: ["kg", 18, [40, 400]],
  Aceite: ["l", 9, [200, 2000]],
  "Aceitunas y encurtidos": ["kg", 6, [150, 1500]],
  Vinos: ["botella", 8, [300, 4000]],
  Carnes: ["kg", 15, [100, 1200]],
  Embutidos: ["kg", 16, [80, 900]],
  Lácteos: ["l", 1.6, [500, 6000]],
  "Verduras y frutas": ["kg", 2.5, [500, 8000]],
  "Pan y repostería": ["ud", 1.5, [1000, 15000]],
  "Conservas y ahumados": ["ud", 4.5, [300, 4000]],
  Bebidas: ["botella", 3.5, [300, 5000]],
  "Café y chocolates": ["kg", 20, [100, 1500]],
  "Alimentos preparados": ["ud", 5, [300, 5000]],
  "Otros alimentos": ["kg", 10, [50, 800]],
};

// --- productores y productos ------------------------------------------------------
const insProducer = db.prepare(
  `INSERT INTO producers (name, municipality, lat, lng, description, capacity_note, is_mock)
   VALUES (@name, @municipality, @lat, @lng, @description, @capacity_note, 1)`,
);
const insProduct = db.prepare(
  `INSERT INTO products (slug, producer_id, name, brand, category, subcategory, description, unit,
     price_hint, monthly_capacity, is_eco, search_text, source_url, is_mock)
   VALUES (@slug, @producer_id, @name, @brand, @category, @subcategory, @description, @unit,
     @price_hint, @monthly_capacity, @is_eco, @search_text, @source_url, 1)`,
);
const insLabel = db.prepare(`INSERT OR IGNORE INTO product_labels (product_id, label_code) VALUES (?, ?)`);

// Categoría dominante de cada productor, para situarlo en una zona coherente.
const producerCats = new Map<string, Map<string, number>>();
for (const p of raw) {
  const c = inferCategory(p);
  const m = producerCats.get(p.producer) ?? new Map<string, number>();
  m.set(c, (m.get(c) ?? 0) + 1);
  producerCats.set(p.producer, m);
}

const producerIds = new Map<string, number>();
const seedAll = db.transaction(() => {
  for (const [name, cats] of producerCats) {
    const main = [...cats.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const town = producerTown(name, main);
    const m = findMunicipality(town) ?? MUNICIPALITIES[0];
    const r = rng(`geo:${name}`);
    const info = insProducer.run({
      name,
      municipality: m.name,
      lat: m.lat + (r() - 0.5) * 0.04,
      lng: m.lng + (r() - 0.5) * 0.04,
      description: `Empresa adherida a M Producto Certificado. Elabora ${[...cats.keys()].join(", ").toLowerCase()} en ${m.name}.`,
      capacity_note: null,
    });
    producerIds.set(name, Number(info.lastInsertRowid));
  }

  for (const p of raw) {
    const category = inferCategory(p);
    const [unit, base, [lo, hi]] = UNIT[category] ?? UNIT["Otros alimentos"];
    const r = rng(`product:${p.slug}`);
    const isEco = p.labels.includes("ECO") || /ecologic|\beco\b|\bbio\b/.test(normalize(p.name));
    const labels = [...new Set<LabelCode>([...p.labels, ...(isEco ? (["ECO"] as LabelCode[]) : [])])];
    const capacity = Math.round((lo + r() * (hi - lo)) / 10) * 10;
    const info = insProduct.run({
      slug: p.slug,
      producer_id: producerIds.get(p.producer)!,
      name: p.name,
      brand: p.brand,
      category,
      subcategory: p.tag,
      description: null,
      unit,
      price_hint: Math.round(base * (0.7 + r() * 0.6) * 10) / 10,
      monthly_capacity: capacity,
      is_eco: isEco ? 1 : 0,
      search_text: buildSearchText({
        name: p.name,
        brand: p.brand,
        producer: p.producer,
        category,
        subcategory: p.tag,
        labels: labels.map((l) => LABELS[l].name),
      }),
      source_url: p.url,
    });
    for (const l of labels) insLabel.run(info.lastInsertRowid, l);
  }
});
seedAll();

// --- perfiles de demo y actividad de ejemplo ----------------------------------------
const insProfile = db.prepare(
  `INSERT INTO profiles (id, role, name, business_name, business_type, municipality, lat, lng, is_demo)
   VALUES (@id, @role, @name, @business_name, @business_type, @municipality, @lat, @lng, @is_demo)`,
);
const madrid = findMunicipality("Madrid")!;
const alcala = findMunicipality("Alcalá de Henares")!;
const demo = [
  { id: "lucia", role: "hostelero", name: "Lucía Ortega", business_name: "Taberna La Corrala", business_type: "Taberna · 60 cubiertos", municipality: "Madrid", lat: 40.4089, lng: -3.7006, is_demo: 1 },
  { id: "andres", role: "productor", name: "Andrés Gil", business_name: null, business_type: null, municipality: null, lat: null, lng: null, is_demo: 1 },
  { id: "marta", role: "consumidor", name: "Marta Ruiz", business_name: null, business_type: null, municipality: "Madrid", lat: madrid.lat, lng: madrid.lng, is_demo: 1 },
];
const extras = [
  { id: "h-brote", role: "hostelero", name: "Equipo El Brote", business_name: "El Brote", business_type: "Restaurante de temporada", municipality: "Madrid", lat: 40.4265, lng: -3.7025, is_demo: 0 },
  { id: "h-mirador", role: "hostelero", name: "Compras Hotel Mirador", business_name: "Hotel Mirador del Henares", business_type: "Hotel · 80 habitaciones", municipality: alcala.name, lat: alcala.lat, lng: alcala.lng, is_demo: 0 },
  { id: "h-sierra", role: "hostelero", name: "Catering Sierra Norte", business_name: "Catering Sierra Norte", business_type: "Catering de eventos", municipality: "Buitrago del Lozoya", lat: 40.9907, lng: -3.6366, is_demo: 0 },
  { id: "h-mercado", role: "hostelero", name: "Puesto 14", business_name: "Puesto 14 · Mercado de Antón Martín", business_type: "Puesto de mercado gourmet", municipality: "Madrid", lat: 40.4123, lng: -3.6987, is_demo: 0 },
  { id: "c-pablo", role: "consumidor", name: "Pablo M.", business_name: null, business_type: null, municipality: "Getafe", lat: 40.3083, lng: -3.7327, is_demo: 0 },
  { id: "c-irene", role: "consumidor", name: "Irene S.", business_name: null, business_type: null, municipality: "Madrid", lat: madrid.lat, lng: madrid.lng, is_demo: 0 },
];
for (const p of [...demo, ...extras]) insProfile.run(p);

// Andrés (cuenta de demo) reclama la ficha de una quesería. Evitamos empresas que llevan
// el nombre de una persona para no atribuirle a nadie real un perfil inventado.
const andresProducer = db
  .prepare(
    `SELECT p.producer_id AS id FROM products p JOIN producers pr ON pr.id = p.producer_id
     WHERE p.category = 'Quesos' AND pr.name NOT GLOB '*[A-Z]. *' AND pr.name NOT LIKE '%(%'
     GROUP BY p.producer_id ORDER BY COUNT(*) DESC LIMIT 1`,
  )
  .get() as { id: number };
db.prepare(
  `UPDATE producers SET owner_profile_id = 'andres', phone = '600 000 000', email = 'demo@baco.local',
   capacity_note = 'Pedidos para hostelería con 48 h de antelación. Reparto propio los martes y viernes.'
   WHERE id = ?`,
).run(andresProducer.id);

const products = db.prepare(`SELECT id, category, producer_id FROM products`).all() as {
  id: number;
  category: string;
  producer_id: number;
}[];
const r = rng("activity");
const reviewers = ["h-brote", "h-mirador", "h-sierra", "h-mercado", "c-pablo", "c-irene"];
const REVIEW_TEXTS = [
  "Producto constante pedido tras pedido. Lo tenemos fijo en carta.",
  "Muy buena relación calidad-precio para el menú del día.",
  "A los clientes les gusta saber que es de Madrid; lo indicamos en la carta.",
  "Entrega puntual. El formato para hostelería podría ser más grande.",
  "Lo probamos para una cata de producto local y repetimos.",
  "Buen producto, aunque el plazo de entrega fue algo largo la primera vez.",
  "Compro para casa desde que lo vi en el mercado. Muy recomendable.",
];
const insReview = db.prepare(
  `INSERT INTO reviews (profile_id, product_id, rating, text, is_mock, created_at)
   VALUES (?, ?, ?, ?, 1, datetime('now', ?))`,
);
const insEvent = db.prepare(
  `INSERT INTO events (profile_id, product_id, type, ts) VALUES (?, ?, ?, datetime('now', ?))`,
);
const seedActivity = db.transaction(() => {
  for (const p of products) {
    if (r() < 0.32) {
      const n = 1 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        insReview.run(pick(r, reviewers), p.id, r() < 0.15 ? 3 : r() < 0.55 ? 4 : 5, pick(r, REVIEW_TEXTS), `-${Math.floor(r() * 60)} days`);
      }
    }
    // Unos pocos productos concentran la actividad: así hay tendencias que mostrar.
    const heat = r() < 0.08 ? 40 : r() < 0.3 ? 8 : 2;
    const views = Math.floor(r() * heat);
    for (let i = 0; i < views; i++) {
      insEvent.run(pick(r, reviewers), p.id, r() < 0.6 ? "view" : "search_hit", `-${Math.floor(r() * 13 * 24)} hours`);
    }
  }
});
seedActivity();

// Ofertas y patrocinios de ejemplo.
const insOffer = db.prepare(`INSERT INTO offers (product_id, title, valid_until) VALUES (?, ?, date('now', '+30 days'))`);
const insSponsor = db.prepare(`INSERT INTO sponsorships (product_id, boost, ends_at) VALUES (?, 0.05, date('now', '+60 days'))`);
const OFFERS = ["−10 % en el primer pedido de hostelería", "Muestra gratuita para restaurantes", "Envío sin coste a partir de 150 €", "Precio de temporada hasta fin de mes"];
const shuffled = [...products].sort(() => r() - 0.5);
shuffled.slice(0, 14).forEach((p, i) => insOffer.run(p.id, OFFERS[i % OFFERS.length]));
for (const cat of ["Quesos", "Vinos", "Aceite", "Carnes"]) {
  const p = shuffled.find((x) => x.category === cat && x.producer_id !== andresProducer.id);
  if (p) insSponsor.run(p.id);
}

// Solicitudes de ejemplo: la bandeja de Andrés y el historial de Lucía.
const insRequest = db.prepare(
  `INSERT INTO requests (from_profile_id, producer_id, product_id, type, quantity, message, status, reply, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`,
);
const andresProducts = products.filter((p) => p.producer_id === andresProducer.id);
const ap = (i: number) => andresProducts[i % andresProducts.length].id;
insRequest.run("h-brote", andresProducer.id, ap(0), "muestra", "1 pieza", "Queremos probarlo para la tabla de quesos de otoño. ¿Podéis traer una muestra el jueves?", "enviada", null, "-5 hours", "-5 hours");
insRequest.run("h-mirador", andresProducer.id, ap(1), "pedido", "15 kg/mes", "Buscamos proveedor fijo para el desayuno buffet. ¿Precio para 15 kg al mes?", "vista", null, "-1 day", "-20 hours");
insRequest.run("h-mercado", andresProducer.id, ap(2), "contacto", null, "Tenemos un puesto de producto madrileño y nos gustaría tener vuestra referencia.", "respondida", "¡Encantados! Os llamo mañana para pasar catálogo y precios de mercado.", "-3 days", "-2 days");
insRequest.run("h-sierra", andresProducer.id, ap(3), "pedido", "8 kg", "Boda de 120 invitados el 14 de noviembre. ¿Llegáis a Buitrago?", "cerrada", "Sí, reparto confirmado el día 13.", "-9 days", "-7 days");

const others = products.filter((p) => p.producer_id !== andresProducer.id);
const wine = others.find((p) => p.category === "Vinos") ?? others[0];
const oil = others.find((p) => p.category === "Aceite") ?? others[1];
insRequest.run("lucia", wine.producer_id, wine.id, "muestra", "2 botellas", "Estamos montando una carta de vinos de Madrid por copas. ¿Nos enviáis muestra?", "respondida", "Os la dejamos el martes en la taberna.", "-4 days", "-3 days");
insRequest.run("lucia", oil.producer_id, oil.id, "pedido", "20 l/mes", "Necesitamos AOVE para cocina, unos 20 litros al mes.", "enviada", null, "-1 day", "-1 day");

// Partes añadidas después (puesto, agenda, avisos, altas asistidas…): ver lib/db/demo-extras.ts.
ensureDemoExtras(db);

const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
console.log(
  `baco.db listo: ${count("SELECT COUNT(*) n FROM products")} productos, ${count("SELECT COUNT(*) n FROM producers")} productores, ` +
    `${count("SELECT COUNT(*) n FROM reviews")} reseñas, ${count("SELECT COUNT(*) n FROM events")} eventos. ` +
    `Andrés gestiona el productor #${andresProducer.id}.`,
);
console.log("Categorías:", CATEGORIES.map((c) => `${c} ${count(`SELECT COUNT(*) n FROM products WHERE category = '${c}'`)}`).join(" · "));
db.close();
