import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RiExternalLinkLine, RiMapPin2Line, RiPhoneLine, RiShieldCheckLine } from "@remixicon/react";
import { ProductCard } from "@/components/product-card";
import { Shot } from "@/components/shot";
import { ButtonLink, LabelBadge, MockTag } from "@/components/ui";
import { getProducer, productsByProducer } from "@/lib/db/repo";
import type { LabelCode } from "@/lib/domain";
import { categoryPhoto, productPhoto, type Photo } from "@/lib/photos";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getProducer(Number((await params).id))?.name ?? "Productor" };
}

export default async function ProducerPage({ params }: Props) {
  const producer = getProducer(Number((await params).id));
  if (!producer) notFound();
  const products = productsByProducer(producer.id);
  const labels = [...new Set(products.flatMap((p) => p.labels))] as LabelCode[];
  const categories = [...new Set(products.map((p) => p.category))];
  // Mosaico de cabecera: abre con la portada de su categoría principal y sigue con fotos distintas de su gama.
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const mainCategory = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  const gallery = new Map<string, Photo>();
  if (mainCategory) gallery.set(categoryPhoto(mainCategory).src, categoryPhoto(mainCategory));
  for (const p of products) gallery.set(productPhoto(p).src, productPhoto(p));
  const shots: Photo[] = [...gallery.values()].slice(0, 3);

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12 pt-6">
      <section className="grain grid overflow-hidden rounded-lg bg-sage-50 lg:grid-cols-[1.15fr_1fr]">
        <div className="px-6 py-10 md:px-10" data-help="producer-header">
          <p className="label">{categories.join(" · ")}</p>
          <h1 className="mt-3 max-w-3xl text-[30px] leading-[1.1] font-semibold tracking-[-0.035em] md:text-[40px]">{producer.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
            <span className="inline-flex items-center gap-1">
              <RiMapPin2Line className="size-4 text-ink-3" /> {producer.municipality} <MockTag />
            </span>
            {producer.owner_profile_id ? (
              <span className="inline-flex items-center gap-1 font-semibold text-sage-700">
                <RiShieldCheckLine className="size-4" /> Ficha gestionada por el productor
              </span>
            ) : (
              <span className="text-ink-3">Página creada con los datos del catálogo oficial</span>
            )}
            {producer.phone && (
              <span className="inline-flex items-center gap-1">
                <RiPhoneLine className="size-4 text-ink-3" /> {producer.phone}
              </span>
            )}
            {producer.website && (
              <a href={producer.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                Web <RiExternalLinkLine className="size-3.5" />
              </a>
            )}
          </div>
          {producer.description && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-2">{producer.description}</p>}
          {labels.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {labels.map((l) => (
                <LabelBadge key={l} code={l} />
              ))}
            </div>
          )}
          {!producer.owner_profile_id && (
            <ButtonLink href="/entrar?rol=productor" variant="secondary" size="sm" className="mt-6">
              ¿Eres el productor? Gestiona esta página gratis
            </ButtonLink>
          )}
        </div>
        {shots.length > 0 && (
          <div className={shots.length >= 3 ? "grid min-h-[260px] grid-cols-2 grid-rows-2 gap-1 p-1 lg:p-1.5" : "grid min-h-[260px] gap-1 p-1 lg:p-1.5"}>
            {shots.map((ph, i) => (
              <Shot
                key={ph.src}
                photo={ph}
                sizes="(min-width: 1024px) 25vw, 50vw"
                className={i === 0 && shots.length >= 3 ? "row-span-2 rounded-[14px]" : "rounded-[14px]"}
                preload={i === 0}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10" data-help="producer-products">
        <p className="mb-4 text-sm text-ink-2">
          <span className="font-semibold text-ink">{products.length}</span> {products.length === 1 ? "producto" : "productos"} en BACO
        </p>
        <h2 className="sr-only">Productos</h2>
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} morph />
          ))}
        </div>
      </section>
    </div>
  );
}
