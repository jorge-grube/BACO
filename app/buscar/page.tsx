import type { Metadata } from "next";
import Link from "next/link";
import { RiCheckLine, RiCloseLine } from "@remixicon/react";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { logSearchHits } from "@/lib/db/repo";
import { CATEGORIES, LABELS, LABEL_CODES, type Category, type LabelCode } from "@/lib/domain";
import { EXAMPLES } from "@/lib/examples";
import { MUNICIPALITIES, findMunicipality } from "@/lib/geo";
import { parseIntent, type Intent } from "@/lib/match/intent";
import { MAX_BOOST, WEIGHTS, formatNumber, search } from "@/lib/match/search";
import { currentProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Buscar" };

type Params = { q?: string; cat?: string; sello?: string | string[]; mun?: string; km?: string; skip?: string };

const EMPTY_INTENT: Intent = { text: "", attributes: [], labels: [], source: "reglas" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const profile = await currentProfile();
  const q = (params.q ?? "").trim().slice(0, 300);
  const skip = new Set((params.skip ?? "").split(",").filter(Boolean));
  const intent = q ? await parseIntent(q) : EMPTY_INTENT;

  // La URL manda sobre lo que entendió el asistente: los chips se pueden quitar.
  const effective: Intent = {
    ...intent,
    attributes: intent.attributes.filter((a) => !skip.has(`attr:${a}`)),
    volume: skip.has("vol") ? undefined : intent.volume,
    use: skip.has("use") ? undefined : intent.use,
  };
  const category =
    params.cat === "todas"
      ? undefined
      : (CATEGORIES.find((c) => c === params.cat) ?? (skip.has("cat") ? undefined : intent.category));
  const selloParam = ([] as string[]).concat(params.sello ?? []);
  const labels = (selloParam.length ? selloParam : intent.labels.filter((l) => !skip.has(`sello:${l}`))).filter(
    (l): l is LabelCode => (LABEL_CODES as string[]).includes(l),
  );
  const municipality = params.mun ? findMunicipality(params.mun)?.name : skip.has("loc") ? undefined : intent.municipality;
  const radiusKm = params.km ? Math.min(150, Math.max(5, Number(params.km) || 40)) : municipality ? (intent.radiusKm ?? 60) : undefined;

  const userLoc =
    profile?.lat && profile.lng ? { name: profile.business_name ?? profile.municipality ?? "tu local", lat: profile.lat, lng: profile.lng } : null;
  const result = await search(effective, { category: category as Category | undefined, labels, municipality, radiusKm }, userLoc, 20);
  if (q || category || labels.length || municipality) logSearchHits(profile?.id ?? null, result.matches.slice(0, 10).map((m) => m.product.id));

  const base: Params = { q: q || undefined, cat: params.cat, sello: params.sello, mun: params.mun, km: params.km, skip: params.skip };
  const href = (over: Partial<Params>) => {
    const merged = { ...base, ...over };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === "") continue;
      for (const item of ([] as string[]).concat(v)) usp.append(k, item);
    }
    const s = usp.toString();
    return s ? `/buscar?${s}` : "/buscar";
  };
  const withSkip = (key: string) => href({ skip: [...skip, key].join(",") });

  const chips: { key: string; text: string; remove: string }[] = [];
  if (category) chips.push({ key: "cat", text: category, remove: params.cat ? href({ cat: undefined, skip: [...skip, "cat"].join(",") }) : withSkip("cat") });
  for (const a of effective.attributes) chips.push({ key: `attr:${a}`, text: a, remove: withSkip(`attr:${a}`) });
  if (effective.use) chips.push({ key: "use", text: `para ${effective.use}`, remove: withSkip("use") });
  if (effective.volume)
    chips.push({
      key: "vol",
      text: `${formatNumber(effective.volume.amount, 1)} ${effective.volume.unit}${effective.volume.period === "pedido" ? "" : `/${effective.volume.period}`}`,
      remove: withSkip("vol"),
    });
  for (const l of labels)
    chips.push({
      key: `sello:${l}`,
      text: LABELS[l].short,
      remove: selloParam.length ? href({ sello: selloParam.filter((s) => s !== l) }) : withSkip(`sello:${l}`),
    });
  if (municipality)
    chips.push({ key: "loc", text: `${municipality} · ${radiusKm} km`, remove: params.mun ? href({ mun: undefined, km: undefined, skip: [...skip, "loc"].join(",") }) : withSkip("loc") });

  const hasQuery = Boolean(q || category || labels.length || municipality);

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12 pt-8">
      <div className="max-w-3xl">
        <SearchBox defaultValue={q} />
        {q ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="mr-1.5 text-ink-3">{intent.source === "gemini" ? "El asistente ha entendido:" : "Hemos entendido:"}</span>
            {chips.length === 0 && <span className="text-ink-2">tu búsqueda como texto libre</span>}
            {chips.map((c) => (
              <span key={c.key} className="group inline-flex items-center text-ink">
                <span className="font-medium">{c.text}</span>
                <Link
                  href={c.remove}
                  className="ml-0.5 grid size-4 place-items-center rounded-[3px] text-ink-3 opacity-60 group-hover:opacity-100 hover:bg-paper-2 hover:text-ink"
                  aria-label={`Quitar ${c.text}`}
                >
                  <RiCloseLine className="size-3" />
                </Link>
              </span>
            ))}
            {skip.size > 0 && (
              <Link href={href({ skip: undefined })} className="ml-1 text-xs font-medium text-ink-3 underline underline-offset-2 hover:text-ink">
                Restaurar
              </Link>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
            Por ejemplo:{" "}
            {EXAMPLES.map((e, i) => (
              <span key={e}>
                {i > 0 && " · "}
                <Link href={`/buscar?q=${encodeURIComponent(e)}`} className="text-ink-2 underline decoration-line-2 underline-offset-3 hover:text-ink hover:decoration-ink">
                  {e}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filtros */}
        <aside className="order-2 space-y-7 text-sm lg:order-1">
          <div>
            <p className="label mb-2">Categoría</p>
            <ul className="space-y-0.5">
              <li>
                <FilterLink href={href({ cat: "todas", skip: [...skip, "cat"].join(",") })} active={!category}>
                  Todas
                </FilterLink>
              </li>
              {result.categoryFacets.map((f) => (
                <li key={f.category}>
                  <FilterLink href={href({ cat: f.category })} active={category === f.category} count={f.n}>
                    {f.category}
                  </FilterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-2">Sello</p>
            <ul className="space-y-0.5">
              {LABEL_CODES.map((code) => {
                const on = labels.includes(code);
                const next = on ? labels.filter((l) => l !== code) : [...labels, code];
                return (
                  <li key={code}>
                    <Link
                      href={href({ sello: next.length ? next : [""], skip: [...skip].filter((s) => !s.startsWith("sello:")).join(",") || undefined })}
                      className="flex items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-ink-2 hover:bg-paper-2 hover:text-ink"
                    >
                      <span className={on ? "grid size-4 place-items-center rounded-[4px] bg-ink text-white" : "size-4 rounded-[4px] border border-line-2"}>
                        {on && <RiCheckLine className="size-3" />}
                      </span>
                      {LABELS[code].short}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <form action="/buscar" className="space-y-2">
            <p className="label mb-2">Zona</p>
            {q && <input type="hidden" name="q" value={q} />}
            {params.cat && <input type="hidden" name="cat" value={params.cat} />}
            {labels.map((l) => (
              <input key={l} type="hidden" name="sello" value={l} />
            ))}
            <select name="mun" defaultValue={municipality ?? ""} className="h-9 w-full rounded-[10px] border border-line bg-white px-2.5 text-sm">
              <option value="">Cualquier municipio</option>
              {MUNICIPALITIES.map((m) => (
                <option key={m.name}>{m.name}</option>
              ))}
            </select>
            <select name="km" defaultValue={String(radiusKm ?? 60)} className="h-9 w-full rounded-[10px] border border-line bg-white px-2.5 text-sm">
              {[10, 20, 40, 60, 100].map((k) => (
                <option key={k} value={k}>
                  Hasta {k} km
                </option>
              ))}
            </select>
            <button className="h-9 w-full rounded-[10px] border border-line bg-paper-2 text-[13px] font-semibold hover:bg-white">Aplicar zona</button>
          </form>
          <div className="rounded-md bg-paper-2 p-4 text-xs leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">Cómo ordenamos</p>
            <p className="mt-1">
              Parecido con tu petición {pct(WEIGHTS.sem)}, distancia {pct(WEIGHTS.dist)}, sello {pct(WEIGHTS.sello)}, capacidad{" "}
              {pct(WEIGHTS.cap)} y reseñas {pct(WEIGHTS.rating)}. Un patrocinio suma como mucho {Math.round(MAX_BOOST * 100)} puntos y
              siempre se indica.
            </p>
          </div>
        </aside>

        {/* Resultados */}
        <section className="order-1 lg:order-2">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h1 className="text-lg font-semibold tracking-[-0.02em]">
              {hasQuery ? `${result.total} ${result.total === 1 ? "producto encaja" : "productos encajan"}` : "Todo el catálogo"}
            </h1>
            <p className="text-xs text-ink-3">
              {hasQuery ? "Ordenados por encaje" : "Elige una categoría o escribe lo que necesitas"}
              {result.origin && !municipality ? ` · distancias desde ${result.origin.name}` : ""}
            </p>
          </div>
          {result.matches.length === 0 ? (
            <div className="rounded-md border border-dashed border-line-2 p-10 text-center">
              <p className="font-semibold">Ningún producto cumple todo a la vez</p>
              <p className="mt-1 text-sm text-ink-2">Quita algo de lo que hemos entendido o amplía la zona.</p>
            </div>
          ) : (
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.matches.map((m) => (
                <li key={m.product.id} className="flex">
                  <ProductCard product={m.product} />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

const pct = (w: number) => `${Math.round(w * 100)} %`;

function FilterLink({ href, active, count, children }: { href: string; active: boolean; count?: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center justify-between rounded-[8px] bg-ink px-2 py-1.5 font-semibold text-white"
          : "flex items-center justify-between rounded-[8px] px-2 py-1.5 text-ink-2 hover:bg-paper-2 hover:text-ink"
      }
    >
      <span className="truncate">{children}</span>
      {count !== undefined && <span className={active ? "text-xs text-white/60 tabular-nums" : "text-xs text-ink-3 tabular-nums"}>{count}</span>}
    </Link>
  );
}
