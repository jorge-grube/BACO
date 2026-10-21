import { RiSearchLine } from "@remixicon/react";
import clsx from "clsx";

// Formulario GET a /buscar: funciona sin JavaScript y deja la URL compartible.
export function SearchBox({ defaultValue, size = "md" }: { defaultValue: string; size?: "md" | "lg" }) {
  return (
    <form action="/buscar" role="search" className="w-full">
      <label
        className={clsx(
          "flex items-center gap-3 rounded-[10px] border border-line bg-white pl-4 shadow-card focus-within:border-ink/40",
          size === "lg" ? "h-14 pr-1.5" : "h-12 pr-1",
        )}
      >
        <RiSearchLine className="size-[18px] shrink-0 text-ink-3" aria-hidden />
        <span className="sr-only">Explica qué necesitas</span>
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder="Explica qué necesitas: producto, uso, cantidad y zona…"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          autoComplete="off"
        />
        <button
          type="submit"
          className={clsx(
            "shrink-0 rounded-[7px] bg-ink font-semibold text-white hover:bg-ink/85",
            size === "lg" ? "h-11 px-5 text-sm" : "h-10 px-4 text-[13px]",
          )}
        >
          Buscar
        </button>
      </label>
    </form>
  );
}
