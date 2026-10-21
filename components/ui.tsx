import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import {
  RiBeerLine,
  RiBowlLine,
  RiBox3Line,
  RiBreadLine,
  RiCupLine,
  RiDrinks2Line,
  RiDropLine,
  RiFireLine,
  RiFlowerLine,
  RiGoblet2Line,
  RiKnifeLine,
  RiPlantLine,
} from "@remixicon/react";
import { LABELS, type LabelCode } from "@/lib/domain";

// --- botones ----------------------------------------------------------------------

type Variant = "primary" | "secondary" | "ghost" | "sage";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85 shadow-[0_1px_0_rgb(255_255_255/0.12)_inset]",
  secondary: "bg-white text-ink border border-line hover:border-line-2 hover:bg-paper-2 shadow-card",
  ghost: "text-ink-2 hover:text-ink hover:bg-paper-2",
  sage: "bg-sage text-ink hover:bg-sage-100",
};
// En el móvil los botones miden al menos 44 px de alto (dedos grandes, cocina, campo); en escritorio, más compactos.
const SIZES = {
  sm: "h-11 px-4 text-[15px] gap-1.5 md:h-8 md:px-3 md:text-[13px]",
  md: "h-12 px-5 text-base gap-2 md:h-10 md:px-4 md:text-sm",
  lg: "h-12 px-5 text-[15px] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: keyof typeof SIZES = "md", extra?: string) {
  return clsx(
    "inline-flex items-center justify-center rounded-[8px] font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// --- marca ------------------------------------------------------------------------

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-baseline gap-[3px] font-bold tracking-[-0.06em] text-ink", className)}>
      baco
      <span aria-hidden className="inline-block size-[0.32em] translate-y-[-0.05em] rounded-full bg-sage-700" />
    </span>
  );
}

// --- sellos y etiquetas --------------------------------------------------------------

export function LabelBadge({ code, size = "md" }: { code: LabelCode; size?: "sm" | "md" }) {
  const l = LABELS[code];
  return (
    <span
      title={l.name}
      className={clsx(
        "inline-flex items-center gap-1 rounded-[4px] border font-semibold whitespace-nowrap",
        size === "sm" ? "h-6 px-1.5 text-xs" : "h-7 px-2 text-[13px]",
        l.kind === "eco" ? "border-sage text-sage-700" : "border-line-2 text-ink",
      )}
    >
      {l.kind === "dop" && <span className="size-1.5 rounded-full bg-sage-700" aria-hidden />}
      {l.short}
    </span>
  );
}

export function SponsoredTag() {
  return (
    <span className="inline-flex h-6 items-center rounded-md bg-clay-50 px-1.5 text-xs font-semibold text-clay">
      Patrocinado
    </span>
  );
}

export function MockTag({ children = "dato de ejemplo" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-dashed border-line-2 px-1 text-xs font-medium text-ink-3">
      {children}
    </span>
  );
}

// --- tesela de categoría (sustituye a la foto del producto) ---------------------------

const CATEGORY_STYLE: Record<string, { icon: typeof RiDropLine | null; tint: string }> = {
  Quesos: { icon: null, tint: "bg-[#F4EFE4]" },
  Aceite: { icon: RiDropLine, tint: "bg-sage-50" },
  "Aceitunas y encurtidos": { icon: null, tint: "bg-sage-50" },
  Vinos: { icon: RiGoblet2Line, tint: "bg-[#F3EBEA]" },
  Carnes: { icon: RiFireLine, tint: "bg-[#F3EBEA]" },
  Embutidos: { icon: RiKnifeLine, tint: "bg-[#F3EBEA]" },
  Lácteos: { icon: RiDrinks2Line, tint: "bg-[#EEF1F2]" },
  "Verduras y frutas": { icon: RiPlantLine, tint: "bg-sage-50" },
  "Pan y repostería": { icon: RiBreadLine, tint: "bg-[#F4EFE4]" },
  "Conservas y ahumados": { icon: RiBox3Line, tint: "bg-[#EEF1F2]" },
  Bebidas: { icon: RiBeerLine, tint: "bg-[#F4EFE4]" },
  "Café y chocolates": { icon: RiCupLine, tint: "bg-[#F4EFE4]" },
  "Alimentos preparados": { icon: RiBowlLine, tint: "bg-[#EEF1F2]" },
  "Otros alimentos": { icon: RiFlowerLine, tint: "bg-[#F4EFE4]" },
};

// Glifos propios donde Remix no tiene icono (queso, aceituna).
function CheeseGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={className}>
      <path d="M3 17.5V11l12.5-6.5L21 11v6.5H3Z" />
      <path d="M3 11h18" />
      <circle cx="8" cy="14.5" r="1.1" />
      <circle cx="14.5" cy="15" r="0.8" />
      <circle cx="17.5" cy="13.2" r="0.6" />
    </svg>
  );
}
function OliveGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <ellipse cx="9.5" cy="14.5" rx="4" ry="5.2" transform="rotate(-20 9.5 14.5)" />
      <path d="M11.5 9.5c1.5-3 4-4.8 7.5-5" />
      <path d="M15.5 6.2c1.6.4 2.7 1.6 3 3.3-1.8.2-3.3-.6-4-2" />
    </svg>
  );
}

export function CategoryTile({ category, className, iconClass = "size-7" }: { category: string; className?: string; iconClass?: string }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["Otros alimentos"];
  const Icon = s.icon;
  return (
    <div className={clsx("grid place-items-center text-ink/70", s.tint, className)} aria-hidden>
      {category === "Quesos" ? (
        <CheeseGlyph className={iconClass} />
      ) : category === "Aceitunas y encurtidos" ? (
        <OliveGlyph className={iconClass} />
      ) : Icon ? (
        <Icon className={iconClass} />
      ) : null}
    </div>
  );
}

// --- piezas de layout --------------------------------------------------------------

export function SectionHeader({ label, title, action }: { label?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {label && <p className="label mb-1.5">{label}</p>}
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink md:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("rounded-md border border-line bg-white shadow-card", className)} {...props} />;
}

export function Rating({ value, count }: { value: number | null; count: number }) {
  if (!count || !value) return <span className="text-[13px] text-ink-3">Sin reseñas</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[13px] whitespace-nowrap text-ink-2 tabular-nums">
      <svg viewBox="0 0 12 12" className="size-3 text-ink" aria-hidden>
        <path fill="currentColor" d="m6 .8 1.6 3.3 3.6.5-2.6 2.5.6 3.6L6 9l-3.2 1.7.6-3.6L.8 4.6l3.6-.5L6 .8Z" />
      </svg>
      <span className="font-semibold text-ink">{value.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</span>
      <span>· {count} {count === 1 ? "reseña" : "reseñas"}</span>
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-ZÁÉÍÓÚÑ]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span aria-hidden className={clsx("grid size-8 shrink-0 place-items-center rounded-full bg-sage-100 text-[11px] font-semibold text-sage-700", className)}>
      {initials}
    </span>
  );
}
