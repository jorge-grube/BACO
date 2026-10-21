// Búsqueda léxica en español: normaliza, quita palabras vacías, aplica un
// stemming mínimo y expande sinónimos de cocina. Es el respaldo cuando no hay
// embeddings de Gemini y también un componente del score.
import { normalize } from "../geo";

const STOP = new Set(
  "a al algo algun alguna busco buscamos buscando cerca con como cual de del desde donde el en entre era es esta este esto estos hay la las le lo los mas me mi mucho muy necesito necesitamos para pero por que quiero queremos se sea ser si sin sobre su sus tambien tener tengo un una unas unos y ya mes semana semanal mensual kg kilo kilos litro litros l unidades botellas aprox aproximadamente unos unas zona madrid restaurante bar local cocina carta producto productos productor proveedor".split(
    " ",
  ),
);

// Sinónimos de una palabra concreta. Nunca apuntan al nombre genérico de la categoría
// ("tinto" → "vino"): si no, cualquier vino contaría como coincidencia en "tinto".
const SYNONYMS: Record<string, string[]> = {
  aove: ["aceite", "oliva", "virgen", "extra"],
  aceite: ["aove"],
  vermut: ["vermu", "bebida"],
  vermu: ["vermut", "bebida"],
  cerveza: ["artesana", "bebida"],
  ternera: ["vacuno"],
  vacuno: ["ternera"],
  cordero: ["ovino"],
  cochinillo: ["cerdo"],
  queso: ["quesos"],
  curado: ["curada", "viejo"],
  semicurado: ["semi"],
  oveja: ["ovino", "manchego"],
  cabra: ["caprino"],
  vaca: ["vacuno"],
  miel: ["apicultor", "colmena"],
  pan: ["panaderia", "hogaza", "barra"],
  dulce: ["reposteria", "bolleria"],
  postre: ["reposteria", "dulce", "miel", "chocolate"],
  tapa: ["aperitivo", "encurtido", "aceituna", "queso", "embutido"],
  aperitivo: ["tapa", "aceituna", "encurtido"],
  aceituna: ["aceitunas", "oliva", "encurtido"],
  verdura: ["hortaliza", "huerta"],
  fruta: ["huerta"],
  huevo: ["huevos", "avicola"],
  cafe: ["tostado", "grano"],
  eco: ["ecologico", "biologico"],
  ecologico: ["eco", "bio"],
  bio: ["ecologico"],
};

export function stem(word: string) {
  if (word.length <= 4) return word;
  return word.replace(/(es|s)$/, "").replace(/(itos|itas|ito|ita)$/, "");
}

export function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

export function expand(words: string[]): string[] {
  const out = new Set(words);
  for (const w of words) for (const s of SYNONYMS[w] ?? []) out.add(stem(s));
  return [...out];
}

export function buildSearchText(p: {
  name: string;
  brand?: string | null;
  producer: string;
  category: string;
  subcategory?: string | null;
  labels: string[];
}) {
  return expand(tokens([p.name, p.brand, p.producer, p.category, p.subcategory, ...p.labels].join(" "))).join(" ");
}

// Similitud léxica 0..1: proporción ponderada (por rareza) de los términos pedidos que
// aparecen en la ficha. Un término cuenta si aparece él o alguno de sus sinónimos.
export function hasTerm(doc: Set<string>, t: string) {
  return doc.has(t) || (SYNONYMS[t] ?? []).some((s) => doc.has(stem(s)));
}

export function lexicalScore(terms: string[], docText: string, idf: (t: string) => number) {
  if (terms.length === 0) return 0;
  const doc = new Set(docText.split(" "));
  let hit = 0;
  let total = 0;
  for (const t of terms) {
    const w = idf(t);
    total += w;
    if (hasTerm(doc, t)) hit += w;
  }
  return total ? hit / total : 0;
}
