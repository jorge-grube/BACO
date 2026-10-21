import Image from "next/image";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Photo } from "@/lib/photos";

// Foto a sangre dentro de una caja. La caja fija la proporción (clases del padre) y se pinta con el
// color medio de la foto mientras carga, para que no aparezcan huecos blancos.
export function Shot({
  photo,
  alt = "",
  sizes,
  className,
  imgClassName,
  preload,
  scrim,
  children,
}: {
  photo: Photo;
  alt?: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  preload?: boolean;
  /** Oscurece la parte baja para poder escribir encima en blanco. */
  scrim?: "bottom" | "full";
  children?: ReactNode;
}) {
  return (
    <div className={clsx("relative overflow-hidden", className)} style={{ backgroundColor: photo.color }}>
      <Image
        src={photo.src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={clsx("object-cover", imgClassName)}
      />
      {scrim === "bottom" && (
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(20_24_22/0.84),rgb(20_24_22/0.45)_50%,transparent_82%)]" />
      )}
      {scrim === "full" && <span aria-hidden className="pointer-events-none absolute inset-0 bg-ink/45" />}
      {children}
    </div>
  );
}

// Aviso discreto: las fotos son del tipo de producto, no del producto concreto.
export function IllustrativeTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-[4px] bg-white/90 px-2 py-0.5 text-xs font-medium text-ink-2",
        className,
      )}
    >
      Foto ilustrativa
    </span>
  );
}
