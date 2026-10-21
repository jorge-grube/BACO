// Calcula los embeddings de Gemini de los productos que aún no los tienen.
// Opcional: sin embeddings la búsqueda funciona con el índice léxico.
// Uso: GEMINI_API_KEY=... npm run embed
import { db } from "../lib/db/client";
import { LABELS, type LabelCode } from "../lib/domain";
import { embed } from "../lib/match/gemini";

type Row = { id: number; name: string; brand: string | null; category: string; subcategory: string | null; producer: string; labels: string | null };

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.log("Sin GEMINI_API_KEY: nada que hacer (la búsqueda usará el índice léxico).");
    return;
  }
  const rows = db()
    .prepare(
      `SELECT p.id, p.name, p.brand, p.category, p.subcategory, pr.name AS producer,
              (SELECT group_concat(label_code) FROM product_labels l WHERE l.product_id = p.id) AS labels
       FROM products p JOIN producers pr ON pr.id = p.producer_id WHERE p.embedding IS NULL`,
    )
    .all() as Row[];
  const update = db().prepare(`UPDATE products SET embedding = ? WHERE id = ?`);
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const texts = batch.map((r) =>
      [
        r.name,
        `Categoría: ${r.category}${r.subcategory ? ` (${r.subcategory})` : ""}`,
        r.brand ? `Marca: ${r.brand}` : "",
        `Productor: ${r.producer}, Comunidad de Madrid`,
        r.labels ? `Sellos: ${r.labels.split(",").map((l) => LABELS[l as LabelCode]?.name ?? l).join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(". "),
    );
    const vectors = await embed(texts, "RETRIEVAL_DOCUMENT");
    if (!vectors) throw new Error("Gemini no devolvió embeddings");
    db().transaction(() => batch.forEach((r, j) => update.run(JSON.stringify(vectors[j]), r.id)))();
    console.log(`${Math.min(i + 50, rows.length)}/${rows.length}`);
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log("Embeddings listos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
