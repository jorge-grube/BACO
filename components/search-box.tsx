import Form from "next/form";
import { RiSearchLine } from "@remixicon/react";
import clsx from "clsx";

// Formulario GET a /buscar con next/form: navega sin recargar la página (y muestra el esqueleto
// de app/buscar/loading.tsx), pero sigue funcionando sin JavaScript y deja la URL compartible.
export function SearchBox({ defaultValue, size = "md" }: { defaultValue: string; size?: "md" | "lg" }) {
  return (
    <Form action="/buscar" role="search" className="w-full">
      <label
        className={clsx(
          "flex items-center gap-3 rounded-[12px] border border-line bg-white pl-4 shadow-card transition-shadow focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-sage-700/40",
          size === "lg" ? "h-14 pr-1.5" : "h-12 pr-1",
        )}
      >
        <RiSearchLine className="size-5 shrink-0 text-ink-3" aria-hidden />
        <span className="sr-only">¿Qué necesitas? Escribe producto, cantidad y zona</span>
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder="¿Qué necesitas? Ej.: queso de oveja"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button
          type="submit"
          className={clsx(
            "shrink-0 rounded-[9px] bg-ink font-semibold text-white transition-transform hover:bg-ink/85 active:scale-95",
            size === "lg" ? "h-11 px-5 text-[15px]" : "h-10 px-4 text-sm",
          )}
        >
          Buscar
        </button>
      </label>
    </Form>
  );
}
