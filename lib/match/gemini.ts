import { GoogleGenAI } from "@google/genai";

// Modelos configurables: los nombres cambian a menudo en el plan gratuito.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
export const EMBED_DIM = 768;

let client: GoogleGenAI | null | undefined;

// Devuelve null si no hay clave: el resto del sistema cae a reglas y búsqueda léxica.
export function gemini(): GoogleGenAI | null {
  if (client === undefined) {
    const apiKey = process.env.GEMINI_API_KEY;
    client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }
  return client;
}

export async function embed(texts: string[], taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT") {
  const ai = gemini();
  if (!ai) return null;
  const res = await ai.models.embedContent({
    model: GEMINI_EMBED_MODEL,
    contents: texts,
    config: { outputDimensionality: EMBED_DIM, taskType },
  });
  return res.embeddings?.map((e) => e.values ?? []) ?? null;
}

export function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
