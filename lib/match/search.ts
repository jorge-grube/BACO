// Pasos 2–4 del match (ver PDD, "Algoritmo de match"): filtros duros, similitud,
// puntuación con pesos fijos y una explicación construida solo con datos de la ficha.
import { allProducts, type Product } from "../db/repo";
import { LABELS, type Category, type LabelCode } from "../domain";
import { distanceKm, findMunicipality } from "../geo";
import { cosine, embed } from "./gemini";
import type { Intent } from "./intent";
import { hasTerm, lexicalScore, tokens } from "./text";

export const WEIGHTS = { sem: 0.45, dist: 0.2, sello: 0.15, cap: 0.1, rating: 0.1 } as const;
export const MAX_BOOST = 0.05;
const DEFAULT_RADIUS = 60;

export type Filters = {
  category?: Category;
  labels: LabelCode[];
  municipality?: string;
  radiusKm?: number;
};

export type Factors = { sem: number; dist: number; sello: number; cap: number; rating: number; boost: number };

export type Match = {
  product: Product;
  score: number;
  factors: Factors;
  distanceKm: number | null;
  why: string[];
};

export type SearchResult = {
  matches: Match[];
  total: number;
  categoryFacets: { category: string; n: number }[];
  origin: { name: string; lat: number; lng: number } | null;
  semantic: "embeddings" | "lexico";
};

// Vectores parseados una sola vez por proceso.
const vectors = new Map<number, number[]>();
function vectorOf(p: Product) {
  if (!p.embedding) return null;
  let v = vectors.get(p.id);
  if (!v) {
    v = JSON.parse(p.embedding) as number[];
    vectors.set(p.id, v);
  }
  return v;
}

function idfFor(products: Product[]) {
  const df = new Map<string, number>();
  for (const p of products) for (const t of new Set(p.search_text.split(" "))) df.set(t, (df.get(t) ?? 0) + 1);
  const n = products.length;
  return (t: string) => Math.log(1 + n / (1 + (df.get(t) ?? 0)));
}
let idfCache: { n: number; fn: (t: string) => number } | null = null;

const MONTH = { mes: 1, semana: 4.3, dia: 30, pedido: 1 } as const;
const UNIT_NAMES: Record<string, string> = { kg: "kg", l: "l", botella: "botellas", ud: "uds" };

export function formatNumber(n: number, digits = 0) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export async function search(
  intent: Intent,
  filters: Filters,
  userLocation: { name: string; lat: number; lng: number } | null,
  limit = 20,
  opts: { embeddings?: boolean } = {},
): Promise<SearchResult> {
  const products = allProducts();
  if (!idfCache || idfCache.n !== products.length) idfCache = { n: products.length, fn: idfFor(products) };
  const idf = idfCache.fn;

  const mun = findMunicipality(filters.municipality);
  const origin = mun ? { name: mun.name, lat: mun.lat, lng: mun.lng } : userLocation;
  const radius = filters.radiusKm ?? DEFAULT_RADIUS;

  // Paso 2: filtros duros.
  const passesNonCategory = (p: Product) => {
    if (filters.labels.some((l) => !p.labels.includes(l))) return false;
    if (mun && distanceKm(mun, p) > radius) return false;
    return true;
  };
  const base = products.filter(passesNonCategory);
  const facetMap = new Map<string, number>();
  for (const p of base) facetMap.set(p.category, (facetMap.get(p.category) ?? 0) + 1);
  const candidates = filters.category ? base.filter((p) => p.category === filters.category) : base;

  // Similitud: embeddings si hay clave y vectores; si no, léxico con sinónimos.
  // Para el léxico contamos lo que describe el producto (categoría y atributos), no el uso ni el lugar.
  const queryText = [intent.text, ...intent.attributes, intent.use ?? ""].join(" ");
  const qTokens =
    intent.attributes.length || intent.category
      ? [...new Set([...intent.attributes, ...tokens(intent.category ?? "")])]
      : [...new Set(tokens(intent.text))];
  const hasVectors = candidates.some((p) => p.embedding);
  let qVec: number[] | null = null;
  if (hasVectors && opts.embeddings !== false && intent.text.trim()) {
    try {
      qVec = (await embed([queryText], "RETRIEVAL_QUERY"))?.[0] ?? null;
    } catch (err) {
      console.warn("[search] embeddings no disponibles:", (err as Error).message);
    }
  }

  const need = intent.volume ? intent.volume.amount * MONTH[intent.volume.period] : null;

  const scored = candidates.map((p): Match & { attrHits: number; emb: number | null } => {
    const lex = qTokens.length ? lexicalScore(qTokens, p.search_text, idf) : 0.5;
    const v = qVec && vectorOf(p);
    const emb = v ? Math.min(1, Math.max(0, (cosine(qVec!, v) - 0.35) / 0.4)) : null;
    const sem = emb === null ? lex : 0.65 * emb + 0.35 * lex;

    const d = origin ? distanceKm(origin, p) : null;
    const dist = d === null ? 0.5 : Math.max(0, 1 - d / Math.max(radius, DEFAULT_RADIUS));

    const sello = filters.labels.length
      ? 1
      : p.labels.some((l) => LABELS[l].kind === "dop")
        ? 0.7
        : p.labels.length
          ? 0.5
          : 0;

    let cap = 0.5;
    if (need && intent.volume && p.monthly_capacity && intent.volume.unit === p.unit) {
      cap = Math.min(1, p.monthly_capacity / need);
    }

    const n = p.reviews;
    const bayes = (3 * 3.8 + (p.rating ?? 0) * n) / (3 + n);
    const rating = (bayes - 1) / 4;

    const boost = Math.min(MAX_BOOST, p.boost ?? 0);
    const factors = { sem, dist, sello, cap, rating, boost };
    const score =
      WEIGHTS.sem * sem + WEIGHTS.dist * dist + WEIGHTS.sello * sello + WEIGHTS.cap * cap + WEIGHTS.rating * rating + boost;

    const doc = new Set(p.search_text.split(" "));
    const attrHits = intent.attributes.filter((a) => hasTerm(doc, a)).length;
    return { product: p, score, factors, distanceKm: d, why: [], attrHits, emb };
  });

  // "Encaja" = cumple al menos un atributo pedido (o se parece mucho según los embeddings).
  // Sin atributos, basta con no ser totalmente ajeno a la consulta.
  const kept = intent.attributes.length
    ? scored.filter((m) => m.attrHits > 0 || (m.emb ?? 0) > 0.6)
    : !intent.category && qTokens.length
      ? scored.filter((m) => m.factors.sem > 0.08)
      : scored;
  kept.sort((a, b) => b.score - a.score);

  // Variedad: como mucho 2 productos por productor en los primeros puestos.
  const perProducer = new Map<number, number>();
  const head: typeof kept = [];
  const tail: typeof kept = [];
  for (const m of kept) {
    const n = perProducer.get(m.product.producer_id) ?? 0;
    perProducer.set(m.product.producer_id, n + 1);
    (n < 2 ? head : tail).push(m);
  }
  const top = [...head, ...tail].slice(0, limit);
  for (const m of top) m.why = explain(m, intent, origin);

  return {
    matches: top.map((m) => ({ product: m.product, score: m.score, factors: m.factors, distanceKm: m.distanceKm, why: m.why })),
    total: kept.length,
    categoryFacets: [...facetMap.entries()].map(([category, n]) => ({ category, n })).sort((a, b) => b.n - a.n),
    origin,
    semantic: qVec ? "embeddings" : "lexico",
  };
}

// Paso 4: el porqué, solo con campos de la ficha (nunca inventa datos).
function explain(m: Match, intent: Intent, origin: { name: string } | null): string[] {
  const p = m.product;
  const why: string[] = [];
  const doc = new Set(p.search_text.split(" "));
  const hits = intent.attributes.filter((a) => hasTerm(doc, a));
  if (hits.length) why.push(`Coincide en ${hits.join(", ")}`);
  const dop = p.labels.filter((l) => l !== "ECO");
  if (dop.length) why.push(LABELS[dop[0]].short);
  if (p.labels.includes("ECO")) why.push("Ecológico certificado");
  if (m.distanceKm !== null && origin) why.push(`A ${formatNumber(m.distanceKm)} km de ${origin.name}`);
  if (intent.volume && p.monthly_capacity && intent.volume.unit === p.unit) {
    const need = intent.volume.amount * MONTH[intent.volume.period];
    why.push(
      p.monthly_capacity >= need
        ? `Cubre ${formatNumber(need)} ${UNIT_NAMES[p.unit] ?? p.unit}/mes (hasta ${formatNumber(p.monthly_capacity)})`
        : `Solo llega a ${formatNumber(p.monthly_capacity)} ${UNIT_NAMES[p.unit] ?? p.unit}/mes`,
    );
  }
  if (p.reviews > 0 && p.rating) why.push(`${formatNumber(p.rating, 1)}/5 en ${p.reviews} ${p.reviews === 1 ? "reseña" : "reseñas"}`);
  return why;
}
