import { PHOTOS, POOLS, type Photo, type PoolKey } from "./photo-library";

// El catálogo M Producto Certificado no publica fotos. Cada producto recibe una foto ilustrativa
// del tipo de producto que es (queso fresco ≠ queso curado ≠ crema de queso), elegida por reglas
// sobre el nombre y la categoría. Es determinista: el mismo producto siempre lleva la misma foto,
// y productos parecidos de un mismo productor alternan entre las fotos del grupo.

export type { Photo, PoolKey };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// [patrón sobre el nombre normalizado, grupo de fotos]. Gana la primera regla que encaje dentro de la categoría.
type Rule = [RegExp, PoolKey];

const RULES: Record<string, Rule[]> = {
  Quesos: [
    [/\bcrema\b/, "queso-crema"],
    [/azul|moho|pasta blanda/, "queso-azul"],
    [/fresco|burgos|burrata|mozzarella|bocconcini|bocadito|villalon|cincho/, "queso-fresco"],
    [/tierno|semicurado/, "queso-semi"],
  ],
  Lácteos: [
    [/yogu|kefir/, "yogur"],
    [/reques/, "requeson"],
    [/\bnata\b/, "yogur"],
  ],
  "Aceitunas y encurtidos": [[/aceituna/, "aceituna"]],
  Vinos: [
    [/rose|rosado/, "vino-rosado"],
    [/blanco|albillo|malvar|moscatel|parellada|mosto|semidulce/, "vino-blanco"],
  ],
  Carnes: [
    [/pollo|pechuga|\balas?\b|carcasa/, "pollo"],
    [/burg|picada|albondiga|carpaccio/, "carne-picada"],
    [/callos|carrillada|estofad|asad/, "guiso"],
    [/chorizo|chistorra|butifarra|salchich/, "chorizo"],
  ],
  Embutidos: [
    [/bacon/, "bacon"],
    [/chorizo|chistorra|butifarra|fuet|salchich|morcilla/, "chorizo"],
    [/fiambre|cocid|chopped|galantina|sajonia|codillo|cabeza|delicias/, "fiambre"],
    [/jamon|paleta|cecina|lomo|chicharron/, "jamon"],
  ],
  "Otros alimentos": [
    [/ajedrea|albahaca|cilantro|eneldo|estragon|calendula|hierba|tomillo|romero|oregano|perejil|menta/, "hierbas"],
    [/empanada/, "pan"],
  ],
  "Verduras y frutas": [
    [/calabaza/, "calabaza"],
    [/berenjena/, "berenjena"],
    [/acelga|apio|albahaca|lechuga|espinaca|col\b/, "hoja-verde"],
  ],
  "Pan y repostería": [
    [/bizcoch|almendrado|besito|bocadito|barrita|galleta|magdalena|pasta|bayonesa|tarta|rosquilla/, "reposteria"],
    [/baguette/, "baguette"],
  ],
  "Conservas y ahumados": [
    [/alubia|garbanzo|lenteja|judia/, "alubias"],
    [/ahumad|salmon|anguila|bacalao|atun/, "ahumado"],
    [/anchoa|boqueron|sardina/, "anchoa"],
  ],
  Bebidas: [[/sangria|vermut|licor|ginebra|aguardiente|orujo|crema|pacharan/, "licor"]],
  "Café y chocolates": [
    [/bombon/, "bombones"],
    [/choco|cacao/, "chocolate"],
  ],
};

// Grupo por defecto de cada categoría (y foto de portada de la categoría).
export const CATEGORY_POOL: Record<string, PoolKey> = {
  Quesos: "queso-curado",
  Aceite: "aceite",
  "Aceitunas y encurtidos": "pintxo",
  Vinos: "vino-tinto",
  Carnes: "vacuno",
  Embutidos: "tabla",
  Lácteos: "leche",
  "Verduras y frutas": "mercado",
  "Pan y repostería": "pan",
  "Conservas y ahumados": "anchoa",
  Bebidas: "cerveza",
  "Café y chocolates": "cafe",
  "Alimentos preparados": "guiso",
  "Otros alimentos": "frutos-secos",
};

// Portada de cada categoría: la foto más representativa, no la primera que salga.
const CATEGORY_COVER: Record<string, string> = {
  Quesos: "1654513547430-973fe7570159",
  Aceite: "1474979266404-7eaacbcd87c5",
  "Aceitunas y encurtidos": "1698775942613-3e9fc114b2a1",
  Vinos: "1474722883778-792e7990302f",
  Carnes: "1690983330536-3b0089d07cf9",
  Embutidos: "1781714534211-3236a60d9ce4",
  Lácteos: "1550583724-b2692b85b150",
  "Verduras y frutas": "1591586116988-62fe65164f8d",
  "Pan y repostería": "1590301157172-7ba48dd1c2b2",
  "Conservas y ahumados": "1560174122-cac0c0bdacc6",
  Bebidas: "1687771454203-97d0b08bbeb2",
  "Café y chocolates": "1447933601403-0c6688de566e",
  "Alimentos preparados": "1698917467449-08bcd1d9014b",
  "Otros alimentos": "1631815333332-e3ffb24e2bf8",
};

export function poolFor(product: { name: string; category: string }): PoolKey {
  const name = norm(product.name);
  // Algunos productos llegan sin categoría fiable (p. ej. vinos sueltos): el nombre manda.
  const category = product.category in CATEGORY_POOL ? product.category : /vino/.test(name) ? "Vinos" : "Otros alimentos";
  for (const [re, pool] of RULES[category] ?? []) if (re.test(name)) return pool;
  return CATEGORY_POOL[category];
}

export function pick(pool: PoolKey, seed: number): Photo {
  const ids = POOLS[pool];
  return PHOTOS[ids[Math.abs(seed) % ids.length]];
}

export function productPhoto(product: { id: number; name: string; category: string }): Photo {
  return pick(poolFor(product), product.id);
}

// Fotos para una lista corta (p. ej. los 3 resultados de ejemplo): si dos productos caen en la misma
// foto, el segundo pasa a la siguiente del grupo, para que la fila no repita imagen.
export function distinctPhotos(products: { id: number; name: string; category: string }[]): Photo[] {
  const used = new Set<string>();
  return products.map((p) => {
    const pool = poolFor(p);
    for (let k = 0; k < POOLS[pool].length; k++) {
      const ph = pick(pool, p.id + k);
      if (!used.has(ph.src)) {
        used.add(ph.src);
        return ph;
      }
    }
    return productPhoto(p);
  });
}

export function categoryPhoto(category: string): Photo {
  return PHOTOS[CATEGORY_COVER[category] ?? CATEGORY_COVER["Otros alimentos"]];
}

export function photo(id: string): Photo {
  return PHOTOS[id];
}

// Fotos editoriales con nombre, para no repartir ids por las páginas.
export const EDITORIAL = {
  cocina: "1769955821416-9273532bb148",
  cocinaDetalle: "1622021142947-da7dedc7c39a",
  pastor: "1758716147599-f12800e4e98c",
  ganado: "1791398102358-04f0a3a3cc5c",
  cava: "1756922245026-934ff1648d79",
  queseria: "1642702614835-4e2e8058edcc",
  vinedo: "1767034248012-53ceb03bdf86",
  uva: "1690139510290-8c9eb0806344",
  olivo: "1680990606383-492261dd064d",
  aceitunas: "1698775942613-3e9fc114b2a1",
  mercado: "1550989460-0adf9ea622e2",
  barTapas: "1780639026821-f680fae0d99d",
  pintxos: "1781115650818-3e3504c4ad67",
  vacuno: "1723893905879-0e309c2a8e06",
} as const;
