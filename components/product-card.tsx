import Link from "next/link";
import { RiMapPin2Line } from "@remixicon/react";
import type { Product } from "@/lib/db/repo";
import { CategoryTile, Rating } from "./ui";

// Tarjeta mínima: nombre, productor, ubicación y reseñas. El patrocinio es una franja,
// no una etiqueta más.
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link
      href={`/producto/${p.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-line-2"
    >
      {p.boost ? (
        <span className="flex h-7 items-center bg-clay-50 px-4 text-[11px] font-semibold tracking-[0.06em] text-clay uppercase">Patrocinado</span>
      ) : null}
      <CategoryTile category={p.category} className="aspect-[16/9] w-full" iconClass="size-8" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold tracking-[-0.01em] group-hover:underline group-hover:underline-offset-2">
          {p.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] text-ink-2">{p.producer_name}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-ink-3">
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
    <Link href={`/producto/${p.id}`} className="group flex items-center gap-4 py-3.5">
      {rank !== undefined && (
        <span className={dark ? "w-5 text-right text-sm font-semibold text-white/40 tabular-nums" : "w-5 text-right text-sm font-semibold text-ink-3 tabular-nums"}>
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold group-hover:underline group-hover:underline-offset-2">{p.name}</p>
        <p className={dark ? "truncate text-xs text-white/50" : "truncate text-xs text-ink-3"}>
          {p.producer_name} · {p.municipality}
        </p>
      </div>
      {meta}
    </Link>
  );
}
