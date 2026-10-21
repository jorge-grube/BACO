// Descarga una muestra del catálogo oficial M Producto Certificado
// (https://www.comunidad.madrid/info/productos) y la guarda en data/catalog.raw.json.
// Respeta el Crawl-delay: 10 del robots.txt de comunidad.madrid.
// Uso: node scripts/scrape-catalog.mjs
import { writeFile, mkdir } from "node:fs/promises";

const BASE = "https://www.comunidad.madrid";
const DELAY_MS = 10_000;

// [id de faceta en el catálogo, categoría BACO, páginas a leer (10 productos/página)]
const TIPOS = [
  [677, "Quesos", 10],
  [686, "Aceite", 3],
  [684, "Aceitunas y encurtidos", 3],
  [676, "Lácteos", 2],
  [675, "Vinos", 5],
  [674, "Carnes", 5],
  [724, "Embutidos", 4],
  [685, "Otros alimentos", 5],
  [678, "Verduras y frutas", 4],
  [680, "Pan y repostería", 4],
  [681, "Conservas y ahumados", 3],
  [679, "Bebidas", 3],
  [682, "Café y chocolates", 2],
  [687, "Alimentos preparados", 2],
];

// [id de faceta, código de sello BACO, páginas]
const DISTINTIVOS = [
  [741, "DOP_ACEITE_MADRID", 2],
  [739, "DC_ACEITUNAS_CAMPO_REAL", 1],
  [738, "IGP_CARNE_GUADARRAMA", 1],
  [737, "DOP_VINOS_MADRID", 5],
  [742, "ECO", 6],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function fetchPage(facet, page) {
  const url = `${BASE}/info/productos?f%5B0%5D=${encodeURIComponent(facet)}&page=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": "BACO-hackathon-prototype (catalog sample)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function parseProducts(html) {
  const items = [];
  const re =
    /<div class="tag">([\s\S]*?)<\/div>\s*<div class="title"><h3><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h3><\/div>\s*<div class="bussiness">([\s\S]*?)<\/div>\s*<div class="bussiness">([\s\S]*?)<\/div>/g;
  for (const m of html.matchAll(re)) {
    items.push({
      slug: m[2].split("/").pop(),
      url: BASE + m[2],
      tag: decode(m[1]),
      name: decode(m[3]),
      producer: decode(m[4]),
      brand: decode(m[5]),
    });
  }
  return items;
}

const products = new Map();
let requests = 0;

async function crawl(facet, pages, onItem) {
  for (let page = 0; page < pages; page++) {
    if (requests++ > 0) await sleep(DELAY_MS);
    const html = await fetchPage(facet, page);
    const items = parseProducts(html);
    console.log(`${facet} p${page}: ${items.length}`);
    items.forEach(onItem);
    if (items.length < 10) break;
  }
}

for (const [id, category, pages] of TIPOS) {
  await crawl(`tipo_producto:${id}`, pages, (p) => {
    const prev = products.get(p.slug);
    products.set(p.slug, { ...p, category, labels: prev?.labels ?? [] });
  });
}

for (const [id, code, pages] of DISTINTIVOS) {
  await crawl(`distintivos_de_calidad:${id}`, pages, (p) => {
    const prev = products.get(p.slug);
    if (prev) {
      if (!prev.labels.includes(code)) prev.labels.push(code);
    } else {
      products.set(p.slug, { ...p, category: null, labels: [code] });
    }
  });
}

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
const out = [...products.values()];
await writeFile(new URL("../data/catalog.raw.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(`Guardados ${out.length} productos en data/catalog.raw.json (${requests} peticiones)`);
