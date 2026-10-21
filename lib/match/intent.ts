// Paso 1 del match: convertir la frase del hostelero en una intención estructurada.
// Con GEMINI_API_KEY usa Gemini; sin clave (o si falla) usa reglas en español.
import { z } from "zod";
import { CATEGORIES, LABEL_CODES, type Category, type LabelCode } from "../domain";
import { detectMunicipality, findMunicipality, normalize } from "../geo";
import { gemini, GEMINI_MODEL } from "./gemini";
import { stem, tokens } from "./text";

export type Intent = {
  text: string;
  category?: Category;
  attributes: string[];
  use?: string;
  volume?: { amount: number; unit: string; period: "mes" | "semana" | "dia" | "pedido" };
  municipality?: string;
  radiusKm?: number;
  labels: LabelCode[];
  source: "gemini" | "reglas";
};

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/\bquesos?\b|manchego|torta del casar/, "Quesos"],
  [/\baove\b|\baceites?\b/, "Aceite"],
  [/aceitunas?|encurtid|pepinillo|banderilla|berenjena de almagro/, "Aceitunas y encurtidos"],
  [/\bvinos?\b|\btintos?\b|\bblancos?\b|rosado|crianza|espumoso/, "Vinos"],
  [/\bcarnes?\b|ternera|vacuno|cordero|chuleton|cochinillo|solomillo|hamburguesa/, "Carnes"],
  [/embutido|chorizo|salchichon|\blomo\b|jamon|morcilla|fiambre/, "Embutidos"],
  [/\bleche\b|yogur|\bnata\b|mantequilla|lacteo/, "Lácteos"],
  [/verdura|hortaliza|\bfrutas?\b|tomate|lechuga|melon|esparrago|fresa|patata|\bajos?\b|cebolla/, "Verduras y frutas"],
  [/\bpan\b|hogaza|panaderia|bolleria|reposteria|magdalena|galleta|\bdulces?\b|tarta|rosquilla/, "Pan y repostería"],
  [/conserva|ahumad|salmon|escabeche|anchoa|bonito/, "Conservas y ahumados"],
  [/cerveza|licor|vermut|vermu|\bzumo|bebida|ginebra|pacharan/, "Bebidas"],
  [/\bcafe\b|chocolate|cacao|bombon/, "Café y chocolates"],
  [/croqueta|precocinad|preparad|\bsalsas?\b|gazpacho|tortilla/, "Alimentos preparados"],
  [/\bmiel\b|polen|frutos secos|huevos?\b|legumbre|garbanzo/, "Otros alimentos"],
];

const HEAD_NOUNS = "aove queso vino aceite aceituna carne embutido leche lacteo verdura fruta pan conserva bebida cafe producto";

const DOP_BY_CATEGORY: Partial<Record<Category, LabelCode>> = {
  Vinos: "DOP_VINOS_MADRID",
  Aceite: "DOP_ACEITE_MADRID",
  "Aceitunas y encurtidos": "DC_ACEITUNAS_CAMPO_REAL",
  Carnes: "IGP_CARNE_GUADARRAMA",
};

const VOLUME_RE =
  /(\d+(?:[.,]\d+)?)\s*(kg|kilos?|l\b|litros?|botellas?|unidades|uds?\b|piezas?)\s*(?:(?:al|a la|por|cada|\/)\s*(mes|semana|dia))?/;

function unitOf(raw: string) {
  if (/^k/.test(raw)) return "kg";
  if (/^l/.test(raw)) return "l";
  if (/^b/.test(raw)) return "botella";
  return "ud";
}

export function parseIntentRules(text: string): Intent {
  const t = normalize(text);
  const category = CATEGORY_WORDS.find(([re]) => re.test(t))?.[1];

  const labels = new Set<LabelCode>();
  if (/\becos?\b|ecologic|\bbio\b|organic/.test(t)) labels.add("ECO");
  if (/\bigp\b|indicacion geografica|guadarrama/.test(t)) labels.add("IGP_CARNE_GUADARRAMA");
  if (/\bdop\b|\bdo\b|denominacion de origen|\bdc\b|campo real/.test(t)) {
    const l = category ? DOP_BY_CATEGORY[category] : undefined;
    if (l) labels.add(l);
  }

  // "Sierra de Guadarrama" es el nombre de la IGP, no el municipio de Guadarrama.
  const mun = /sierra de guadarrama/.test(t) ? undefined : detectMunicipality(text);
  const km = t.match(/(\d+)\s*km/);
  const radiusKm = km ? Number(km[1]) : mun ? 60 : undefined;

  const v = t.match(VOLUME_RE);
  const volume = v
    ? {
        amount: Number(v[1].replace(",", ".")),
        unit: unitOf(v[2]),
        period: ((v[3] as "mes" | "semana" | "dia") ?? "pedido") as NonNullable<Intent["volume"]>["period"],
      }
    : undefined;

  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const useMatch = lower.match(/\bpara (?:el |la |los |las |un |una )?([a-z ]{3,30}?)(?:,|\.|$| cerca| unos| unas| de unos| que| con| a menos| en )/);
  const use = useMatch?.[1]?.trim();

  // Atributos: lo que queda tras quitar categoría, lugar, cantidades y uso.
  const skip = new Set(
    tokens([mun?.name ?? "", ...(mun?.aliases ?? []), use ?? "", "dop igp eco ecologico bio denominacion origen cerca km"].join(" ")),
  );
  // Quitamos el sustantivo genérico de la categoría ("queso", "vino"…) pero no sus
  // variantes, que sí son atributos útiles ("tinto", "ternera", "semicurado").
  const head = new Set(tokens(`${category ?? ""} ${HEAD_NOUNS}`));
  const attributes = [...new Set(tokens(text))].filter((w) => !skip.has(w) && !head.has(w)).slice(0, 6);

  return {
    text,
    category,
    attributes,
    use,
    volume,
    municipality: mun?.name,
    radiusKm,
    labels: [...labels],
    source: "reglas",
  };
}

const GeminiIntent = z.object({
  categoria: z.string().nullable().optional(),
  atributos: z.array(z.string()).default([]),
  uso: z.string().nullable().optional(),
  volumen: z
    .object({ cantidad: z.number(), unidad: z.string(), periodo: z.string().nullable().optional() })
    .nullable()
    .optional(),
  municipio: z.string().nullable().optional(),
  radio_km: z.number().nullable().optional(),
  sellos: z.array(z.string()).default([]),
});

const SCHEMA = {
  type: "object",
  properties: {
    categoria: { type: ["string", "null"], enum: [...CATEGORIES, null] },
    atributos: { type: "array", items: { type: "string" }, description: "características del producto en minúsculas: curado, oveja, tinto, crianza…" },
    uso: { type: ["string", "null"], description: "para qué lo quiere: tapas, postres, desayuno…" },
    volumen: {
      type: ["object", "null"],
      properties: {
        cantidad: { type: "number" },
        unidad: { type: "string", enum: ["kg", "l", "botella", "ud"] },
        periodo: { type: ["string", "null"], enum: ["mes", "semana", "dia", "pedido", null] },
      },
      required: ["cantidad", "unidad"],
    },
    municipio: { type: ["string", "null"], description: "municipio de la Comunidad de Madrid mencionado" },
    radio_km: { type: ["number", "null"] },
    sellos: { type: "array", items: { type: "string", enum: LABEL_CODES } },
  },
  required: ["categoria", "atributos", "sellos"],
};

const PROMPT = `Eres el buscador de BACO, que conecta hosteleros con productores de la Comunidad de Madrid.
Extrae la intención de compra de la petición del usuario. No inventes nada que no esté en la petición.
- categoria: una de la lista o null.
- sellos: DOP_VINOS_MADRID, DOP_ACEITE_MADRID, DC_ACEITUNAS_CAMPO_REAL, IGP_CARNE_GUADARRAMA o ECO, solo si los pide (DOP/IGP/ecológico).
- radio_km: si dice "cerca de X" sin distancia, usa 60.
Petición: `;

export async function parseIntent(text: string): Promise<Intent> {
  const rules = parseIntentRules(text);
  const ai = gemini();
  if (!ai || text.trim().length < 3) return rules;
  try {
    const res = await Promise.race([
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: PROMPT + text,
        config: { responseMimeType: "application/json", responseJsonSchema: SCHEMA, temperature: 0 },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
    ]);
    const g = GeminiIntent.parse(JSON.parse(res.text ?? "{}"));
    const category = CATEGORIES.find((c) => c === g.categoria) ?? rules.category;
    const mun = findMunicipality(g.municipio) ?? (rules.municipality ? findMunicipality(rules.municipality) : undefined);
    const labels = g.sellos.filter((s): s is LabelCode => (LABEL_CODES as string[]).includes(s));
    const period = g.volumen?.periodo;
    return {
      text,
      category,
      attributes: [...new Set(g.atributos.map((a) => stem(normalize(a))).filter(Boolean))].slice(0, 6),
      use: g.uso ?? rules.use,
      volume: g.volumen
        ? {
            amount: g.volumen.cantidad,
            unit: g.volumen.unidad,
            period: period === "mes" || period === "semana" || period === "dia" ? period : "pedido",
          }
        : rules.volume,
      municipality: mun?.name,
      radiusKm: g.radio_km ?? (mun ? rules.radiusKm ?? 60 : undefined),
      labels: labels.length ? labels : rules.labels,
      source: "gemini",
    };
  } catch (err) {
    console.warn("[intent] Gemini no disponible, uso reglas:", (err as Error).message);
    return rules;
  }
}
