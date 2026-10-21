import "../iso/iso.css";
import "./hub.css";
import { parseIntentRules } from "@/lib/match/intent";
import { search } from "@/lib/match/search";
import { BASIS, BEAM, CRATE_SVG, HEIGHT, LABEL, LANES, LAYERS, POINTER, RIDE, SCAN_X, TABLE, VANS_SVG, WIDTH } from "./geometry";
import { HubLive, type HubMatch } from "./live";

// Cada furgoneta es un hostelero de la demo y cada caja, un resultado real del buscador
// para lo que ese hostelero ha pedido.
const ORDERS = [
  { dest: "Taberna La Corrala", query: "Queso curado de oveja para tapas, unos 20 kg al mes" },
  { dest: "El Brote", query: "Vino tinto DOP para servir por copas" },
  { dest: "Hotel Mirador", query: "AOVE ecológico para cocina, 30 litros al mes" },
];

const short = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function HubFigure({ bare = false }: { bare?: boolean } = {}) {
  const perDest = await Promise.all(
    ORDERS.map(async (o, dest) => {
      const intent = parseIntentRules(o.query);
      const r = await search(intent, { category: intent.category, labels: intent.labels }, null, 2, { embeddings: false });
      return r.matches.map((m): HubMatch => ({ product: short(m.product.name, 24), producer: short(m.product.producer_name, 26), dest, score: Math.round(m.score * 100) }));
    }),
  );
  // Intercalamos: una caja para cada furgoneta por turno.
  const matches: HubMatch[] = [];
  for (let i = 0; i < 2; i++) for (const list of perDest) if (list[i]) matches.push(list[i]);
  const first = matches[0];

  return (
    <HubLive
      width={WIDTH}
      height={HEIGHT}
      label={LABEL}
      layers={LAYERS}
      crate={CRATE_SVG}
      vans={VANS_SVG}
      basis={BASIS}
      lanes={LANES}
      table={TABLE}
      pointer={POINTER}
      beam={BEAM}
      ride={RIDE}
      scanX={SCAN_X}
      matches={matches}
      dests={ORDERS.map((o) => o.dest)}
      restText={first ? `${first.product} → ${ORDERS[first.dest].dest}` : "Muelle BACO"}
      bare={bare}
    />
  );
}

