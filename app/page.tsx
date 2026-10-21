import Link from "next/link";
import { RiArrowRightLine, RiArrowRightUpLine } from "@remixicon/react";
import { ProductCard, ProductRow } from "@/components/product-card";
import { CMLogo } from "@/components/cm-logo";
import { HubFigure } from "@/components/hub/figure";
import { SearchBox } from "@/components/search-box";
import { Shot } from "@/components/shot";
import { ButtonLink, LabelBadge, SectionHeader } from "@/components/ui";
import {
  catalogStats,
  categoryCounts,
  currentOffers,
  labelCounts,
  trendingProducers,
  trendingProducts,
} from "@/lib/db/repo";
import { CATALOG_URL, LABEL_CODES } from "@/lib/domain";
import { MUNICIPALITIES, findMunicipality } from "@/lib/geo";
import { parseIntentRules } from "@/lib/match/intent";
import { search } from "@/lib/match/search";
import { EXAMPLES } from "@/lib/examples";
import { EDITORIAL, categoryPhoto, distinctPhotos, photo } from "@/lib/photos";
import { currentProfile } from "@/lib/session";

const LABEL_BLURB: Record<string, string> = {
  DOP_VINOS_MADRID: "Vinos de las subzonas de Arganda, Navalcarnero, San Martín de Valdeiglesias y El Molar.",
  DOP_ACEITE_MADRID: "Aceite de oliva virgen extra producido y envasado en la Comunidad de Madrid.",
  DC_ACEITUNAS_CAMPO_REAL: "Aceitunas con el aliño tradicional de Campo Real.",
  IGP_CARNE_GUADARRAMA: "Vacuno criado en la Sierra de Guadarrama, con trazabilidad de origen.",
  ECO: "Producción ecológica certificada en la Comunidad de Madrid.",
};

const LABEL_PHOTO: Record<string, string> = {
  DOP_VINOS_MADRID: EDITORIAL.vinedo,
  DOP_ACEITE_MADRID: "1474979266404-7eaacbcd87c5",
  DC_ACEITUNAS_CAMPO_REAL: EDITORIAL.aceitunas,
  IGP_CARNE_GUADARRAMA: EDITORIAL.ganado,
  ECO: "1591586116988-62fe65164f8d",
};

export default async function Home() {
  const profile = await currentProfile();
  const stats = catalogStats();
  const labels = new Map(labelCounts().map((l) => [l.code, l.n]));
  const categories = categoryCounts();
  const trending = trendingProducts(5);
  const producers = trendingProducers(5);
  const offers = currentOffers(3);

  // Ejemplo vivo: la misma búsqueda que usamos en la demo, con datos reales.
  const example = EXAMPLES[0];
  const exampleIntent = parseIntentRules(example);
  const exampleResult = await search(
    exampleIntent,
    { category: exampleIntent.category, labels: [], municipality: exampleIntent.municipality, radiusKm: exampleIntent.radiusKm },
    null,
    3,
    { embeddings: false },
  );
  const origin = findMunicipality(exampleIntent.municipality);
  const examplePhotos = distinctPhotos(exampleResult.matches.map((m) => m.product));
  const countOf = (category: string) => categories.find((c) => c.category === category)?.n ?? 0;

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12">
      {/* Cabecera */}
      <section className="grain mx-auto mt-8 max-w-[1240px] overflow-hidden rounded-lg bg-sage md:mt-10">
        {/* Etiqueta de la fuente de los datos, arriba a la derecha */}
        <a
          href={CATALOG_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Catálogo M Producto Certificado de la Comunidad de Madrid"
          className="absolute top-4 right-4 z-10 flex items-center gap-3 rounded-[8px] bg-white py-2 pr-3.5 pl-2.5 shadow-card transition-shadow hover:shadow-pop md:top-6 md:right-6"
        >
          <CMLogo className="h-6 md:h-7" />
        </a>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center px-6 pt-24 pb-12 md:px-12 md:py-16 xl:pl-16">
            <p className="label !text-sage-700">Catálogo M Producto Certificado · {stats.products} productos</p>
            <h1 className="mt-5 max-w-[15ch] text-[38px] leading-[1.03] font-semibold tracking-[-0.045em] text-ink md:text-[50px] xl:text-[54px]">
              El productor madrileño que tu cocina busca.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-ink/75 md:text-base">
              Escribe lo que necesitas como se lo dirías a tu proveedor. BACO lo entiende, filtra por sello, zona y
              volumen, y te explica por qué encaja cada productor.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchBox defaultValue="" size="lg" />
            </div>
            <p className="mt-5 max-w-xl text-[13px] leading-loose text-ink/60">
              Prueba con{" "}
              {EXAMPLES.slice(1, 4).map((q, i) => (
                <span key={q}>
                  {i > 0 && " · "}
                  <Link href={`/buscar?q=${encodeURIComponent(q)}`} className="text-ink/80 underline decoration-ink/25 underline-offset-3 hover:text-ink hover:decoration-ink">
                    {q}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {/* Fig 1 · Muelle BACO (skill anatomy), integrada en el verde */}
          <div className="self-center px-4 pb-8 md:px-8 lg:py-8 lg:pr-8 lg:pl-0">
            <HubFigure bare />
          </div>
        </div>
      </section>

      {/* Ejemplo real de respuesta */}
      <section className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 border-b border-line py-8 md:mt-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="label">Así responde BACO · resultado en vivo</p>
          <p className="mt-3 text-[17px] leading-snug font-semibold tracking-[-0.015em] text-ink">“{example}”</p>
          <p className="mt-3 text-[13px] text-ink-2">
            <span className="text-ink-3">Entiende: </span>
            {[
    exampleIntent.category,
    ...exampleIntent.attributes.slice(0, 2),
    exampleIntent.volume ? `${exampleIntent.volume.amount} ${exampleIntent.volume.unit}/${exampleIntent.volume.period}` : null,
    origin ? `${origin.name} (${exampleIntent.radiusKm} km)` : null,
  ].filter(Boolean).join(" · ")}
          </p>
          <ButtonLink href={`/buscar?q=${encodeURIComponent(example)}`} variant="secondary" size="sm" className="mt-5">
            Ver los {exampleResult.total} resultados <RiArrowRightLine className="size-4" />
          </ButtonLink>
        </div>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
          {exampleResult.matches.map((m, i) => (
            <li key={m.product.id} className="bg-white">
              <Link href={`/producto/${m.product.id}`} className="group flex h-full flex-col gap-1 hover:bg-paper-2">
                <Shot
                  photo={examplePhotos[i]}
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 100vw"
                  className="mb-3 aspect-[16/9] w-full"
                  imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                >
                  <span className="absolute top-3 left-3 grid size-7 place-items-center rounded-[6px] bg-white text-xs font-semibold text-ink tabular-nums shadow-card">
                    {i + 1}
                  </span>
                </Shot>
                <span className="line-clamp-2 px-4 text-sm font-semibold group-hover:underline group-hover:underline-offset-2">{m.product.name}</span>
                <span className="truncate px-4 text-xs text-ink-2">
                  {m.product.producer_name} · {m.product.municipality}
                </span>
                <span className="mt-auto px-4 pt-3 pb-4 text-xs leading-snug text-ink-3">{m.why.slice(0, 2).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Cifras */}
      <section className="mt-8 grid grid-cols-2 divide-line rounded-md border border-line md:grid-cols-4 md:divide-x">
        <Stat value={stats.products} label="productos certificados" />
        <Stat value={stats.producers} label="empresas productoras" />
        <Stat value={stats.labelled} label="con DOP, IGP o ecológico" />
        <Stat value={MUNICIPALITIES.length} label="municipios en el mapa" />
      </section>
      <a
        href={CATALOG_URL}
        target="_blank"
        rel="noreferrer"
        className="group mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-5 py-3 hover:bg-paper-2"
      >
        <span className="text-[13px] text-ink-2">
          Productos y empresas del catálogo oficial <span className="font-semibold text-ink">M Producto Certificado</span>, la marca de
          garantía de los alimentos de Madrid.
        </span>
        <CMLogo className="h-7 opacity-90 group-hover:opacity-100" />
      </a>

      {/* Origen: banda editorial con foto */}
      <section className="mt-16">
        <SectionHeader label="Del origen a tu carta" title="Producto con nombre, apellidos y municipio" />
        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr] lg:grid-rows-2">
          <OriginTile
            href={`/buscar?cat=${encodeURIComponent("Quesos")}`}
            photoId={EDITORIAL.cava}
            label="Quesos"
            title="Oveja y cabra, de leche cruda o pasteurizada"
            meta={`${countOf("Quesos")} quesos certificados`}
            className="aspect-[4/3] lg:row-span-2 lg:aspect-auto"
            big
          />
          <OriginTile
            href="/buscar?sello=DOP_VINOS_MADRID"
            photoId={EDITORIAL.vinedo}
            label="DOP Vinos de Madrid"
            title="Albillo, malvar y garnacha de cuatro subzonas"
            meta={`${labels.get("DOP_VINOS_MADRID") ?? 0} vinos con denominación`}
            className="aspect-[4/3] sm:aspect-[16/9]"
          />
          <OriginTile
            href={`/buscar?cat=${encodeURIComponent("Verduras y frutas")}`}
            photoId={EDITORIAL.mercado}
            label="Huerta"
            title="Verdura de temporada, mucha de producción ecológica"
            meta={`${countOf("Verduras y frutas")} verduras y frutas`}
            className="aspect-[4/3] sm:aspect-[16/9]"
          />
        </div>
      </section>

      {/* Tendencias */}
      <section id="tendencias" className="mt-16 scroll-mt-24 overflow-hidden rounded-lg bg-ink text-white">
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[1.6fr_1fr]">
          <div className="p-6 md:p-10">
            <p className="label !text-white/45">Últimos 7 días</p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em]">Lo que está buscando la hostelería</h2>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {trending.map((p, i) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  rank={i + 1}
                  dark
                  meta={
                    <span className="hidden h-1 w-28 overflow-hidden rounded-[2px] bg-white/10 sm:block" aria-hidden>
                      <span className="block h-full bg-sage" style={{ width: `${Math.max(12, (p.heat / trending[0].heat) * 100)}%` }} />
                    </span>
                  }
                />
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 p-6 md:p-10 lg:border-t-0 lg:border-l">
            <p className="label !text-white/45">Productores en tendencia</p>
            <ul className="mt-3 divide-y divide-white/10">
              {producers.map((p) => (
                <li key={p.id}>
                  <Link href={`/productor/${p.id}`} className="group flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold group-hover:underline group-hover:underline-offset-2">{p.name}</span>
                      <span className="text-xs text-white/45">{p.municipality}</span>
                    </span>
                    <span className="shrink-0 text-xs text-white/45 tabular-nums">{p.events} visitas</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="label mt-8 !text-white/45">Ofertas activas</p>
            <ul className="mt-3 divide-y divide-white/10">
              {offers.map((p) => (
                <li key={p.id}>
                  <Link href={`/producto/${p.id}`} className="group block py-2.5 text-sm">
                    <span className="block truncate font-semibold group-hover:underline group-hover:underline-offset-2">{p.name}</span>
                    <span className="text-xs text-sage">{p.offer}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sellos */}
      <section id="sellos" className="mt-20 scroll-mt-24">
        <SectionHeader label="Calidad diferenciada" title="Busca por sello, no por suerte" />
        <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {LABEL_CODES.map((code) => (
            <Link key={code} href={`/buscar?sello=${code}`} className="group flex flex-col bg-white hover:bg-paper-2">
              <Shot
                photo={photo(LABEL_PHOTO[code])}
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[16/10] w-full"
                imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              >
                <span className="absolute top-3 left-3 rounded-[5px] bg-white">
                  <LabelBadge code={code} />
                </span>
              </Shot>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <p className="text-[13px] leading-snug text-ink-2">{LABEL_BLURB[code]}</p>
                <p className="mt-auto flex items-center justify-between pt-2 text-sm font-semibold">
                  <span className="tabular-nums">
                    {labels.get(code) ?? 0} {labels.get(code) === 1 ? "producto" : "productos"}
                  </span>
                  <RiArrowRightUpLine className="size-4 text-ink-3 group-hover:text-ink" />
                </p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Todos los productos llevan además la marca de garantía M Producto Certificado. Las DOP, IGP y DC son figuras de
          calidad ligadas al origen, con su propio consejo regulador.
        </p>
      </section>

      {/* Categorías */}
      <section className="mt-20">
        <SectionHeader title="Explora por categoría" action={<ButtonLink href="/buscar" variant="ghost" size="sm">Ver todo <RiArrowRightLine className="size-4" /></ButtonLink>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {categories.map((c) => (
            <Link key={c.category} href={`/buscar?cat=${encodeURIComponent(c.category)}`} className="group overflow-hidden rounded-md">
              <Shot
                photo={categoryPhoto(c.category)}
                sizes="(min-width: 1024px) 14vw, (min-width: 640px) 33vw, 50vw"
                className="aspect-[4/5] w-full"
                imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                scrim="bottom"
              >
                <span className="absolute inset-x-3 bottom-3 text-white">
                  <span className="block text-[13px] leading-tight font-semibold">{c.category}</span>
                  <span className="mt-0.5 block text-xs text-white/70 tabular-nums">{c.n} productos</span>
                </span>
              </Shot>
            </Link>
          ))}
        </div>
      </section>

      {/* Para quién */}
      <section className="mt-20">
        <SectionHeader label="Tres lados, un mismo catálogo" title="Hecho para quien cocina, quien produce y quien come" />
        <div className="grid gap-4 md:grid-cols-3">
          <Audience
            label="Hostelería y comercios"
            photoId={EDITORIAL.cocina}
            title="Encuentra, compara y pide muestra en minutos"
            points={["Búsqueda en lenguaje natural", "Filtra por sello, zona y volumen mensual", "Solicitudes con seguimiento"]}
            href={profile?.role === "hostelero" ? "/panel" : "/entrar?rol=hostelero"}
            cta={profile?.role === "hostelero" ? "Ir a mi panel" : "Entrar como hostelero"}
            dark
          />
          <Audience
            label="Productores"
            photoId={EDITORIAL.queseria}
            title="Te encuentran los restaurantes que ya te buscan"
            points={["Tu ficha ya está creada a partir del catálogo", "Bandeja de solicitudes", "Cuántas veces apareces y quién te mira"]}
            href={profile?.role === "productor" ? "/panel" : "/entrar?rol=productor"}
            cta={profile?.role === "productor" ? "Ir a mi panel" : "Reclamar mi ficha"}
          />
          <Audience
            label="Consumidores"
            photoId={EDITORIAL.pintxos}
            title="Lo mejor de Madrid, y dónde probarlo"
            points={["Tendencias y ofertas de la semana", "Favoritos con aviso de cambios", "Reseñas de quien ya lo ha probado"]}
            href="/buscar"
            cta="Explorar productos"
          />
        </div>
      </section>

      {trending.length > 0 && (
        <section className="mt-20">
          <SectionHeader title="Recién descubiertos" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...trending].reverse().slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-5 py-5">
      <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value.toLocaleString("es-ES")}</p>
      <p className="mt-0.5 text-xs text-ink-3">{label}</p>
    </div>
  );
}

function OriginTile({
  href,
  photoId,
  label,
  title,
  meta,
  className,
  big,
}: {
  href: string;
  photoId: string;
  label: string;
  title: string;
  meta: string;
  className?: string;
  big?: boolean;
}) {
  return (
    <Link href={href} className={`group block overflow-hidden rounded-lg ${className ?? ""}`}>
      <Shot
        photo={photo(photoId)}
        sizes={big ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"}
        className="h-full min-h-[240px] w-full"
        imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        scrim="bottom"
      >
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white md:p-7">
          <div>
            <p className="label !text-white/70">{label}</p>
            <p className={big ? "mt-2 max-w-[22ch] text-2xl leading-tight font-semibold tracking-[-0.03em] md:text-[30px]" : "mt-1.5 max-w-[28ch] text-lg leading-snug font-semibold tracking-[-0.02em]"}>
              {title}
            </p>
            <p className="mt-2 text-[13px] text-white/75 tabular-nums">{meta}</p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-0.5">
            <RiArrowRightLine className="size-4" />
          </span>
        </div>
      </Shot>
    </Link>
  );
}

function Audience({
  photoId,
  label,
  title,
  points,
  href,
  cta,
  dark,
}: {
  photoId: string;
  label: string;
  title: string;
  points: string[];
  href: string;
  cta: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? "flex flex-col overflow-hidden rounded-md bg-ink text-white" : "flex flex-col overflow-hidden rounded-md border border-line"}>
      <Shot photo={photo(photoId)} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <p className={dark ? "label !text-white/50" : "label"}>{label}</p>
        <h3 className="mt-3 text-lg leading-snug font-semibold tracking-[-0.02em]">{title}</h3>
        <ul className={dark ? "mt-4 space-y-2 text-sm text-white/75" : "mt-4 space-y-2 text-sm text-ink-2"}>
          {points.map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className={dark ? "mt-2 size-1 shrink-0 rounded-full bg-sage" : "mt-2 size-1 shrink-0 rounded-full bg-sage-700"} />
              {p}
            </li>
          ))}
        </ul>
        <ButtonLink href={href} variant={dark ? "sage" : "secondary"} size="sm" className="mt-6 self-start">
          {cta} <RiArrowRightLine className="size-4" />
        </ButtonLink>
      </div>
    </div>
  );
}
