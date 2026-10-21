import Link from "next/link";
import { ViewTransition } from "react";
import { RiMapPin2Line } from "@remixicon/react";
import type { Product } from "@/lib/db/repo";
import { LABELS } from "@/lib/domain";
import { productPhoto } from "@/lib/photos";
import { Shot } from "./shot";
import { Rating } from "./ui";

// Tarjeta: foto ilustrativa del tipo de producto, nombre, productor, ubicación y reseñas.
// Los sellos van sobre la foto; el patrocinio es una franja, no una etiqueta más.
// `morph`: la foto vuela hasta la cabecera de la ficha al abrirla. Solo en listas donde el producto
// aparece una vez (si un nombre se repite en la página, el navegador cancela la transición).
export function ProductCard({ product: p, morph = false }: { product: Product; morph?: boolean }) {
  const photo = (
    <Shot
      photo={productPhoto(p)}
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      className="aspect-[4/3] w-full"
      imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
    >
      {p.labels.length > 0 && (
        <span className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {p.labels.map((l) => (
            <span key={l} className="inline-flex h-6 items-center gap-1 rounded-[5px] bg-white px-2 text-xs font-semibold text-ink shadow-card">
              {LABELS[l].kind === "dop" && <span className="size-1.5 rounded-full bg-sage-700" aria-hidden />}
              {LABELS[l].short}
            </span>
          ))}
        </span>
      )}
    </Shot>
  );
  return (
    <Link
      href={`/producto/${p.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-md border border-line bg-white transition-[border-color,box-shadow,transform] hover:border-line-2 hover:shadow-pop active:scale-[0.99]"
    >
      {p.boost ? (
        <span className="flex h-7 items-center bg-clay-50 px-4 text-xs font-semibold tracking-[0.06em] text-clay uppercase">Patrocinado</span>
      ) : null}
      {morph ? (
        <ViewTransition name={`product-photo-${p.id}`} share="morph" default="none">
          {photo}
        </ViewTransition>
      ) : (
        photo
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold tracking-[-0.01em] group-hover:underline group-hover:underline-offset-2">
          {p.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-ink-2">{p.producer_name}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px] text-ink-3">
          <span className="inline-flex min-w-0 items-center gap-1">
            <RiMapPin2Line className="size-3.5 shrink-0" />
            <span className="truncate">{p.municipality}</span>
          </span>
          <Rating value={p.rating} count={p.reviews} />
        </div>
      </div>
    </Link>
  );
}

export function ProductRow({ product: p, rank, meta, dark }: { product: Product; rank?: number; meta?: React.ReactNode; dark?: boolean }) {
  return (
    <Link href={`/producto/${p.id}`} className="group flex items-center gap-4 py-3">
      {rank !== undefined && (
        <span className={dark ? "w-5 text-right text-sm font-semibold text-white/60 tabular-nums" : "w-5 text-right text-sm font-semibold text-ink-3 tabular-nums"}>
          {rank}
        </span>
      )}
      <Shot photo={productPhoto(p)} sizes="56px" className="size-12 shrink-0 rounded-[8px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold group-hover:underline group-hover:underline-offset-2">{p.name}</p>
        <p className={dark ? "truncate text-[13px] text-white/65" : "truncate text-[13px] text-ink-3"}>
          {p.producer_name} · {p.municipality}
        </p>
      </div>
      {meta}
    </Link>
  );
}
