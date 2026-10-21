import { RiArrowRightLine } from "@remixicon/react";
import { SearchBox } from "@/components/search-box";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-16">
      <p className="label">Página no encontrada</p>
      <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-[-0.035em]">No encontramos esta página</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
        Puede que el enlace esté mal escrito o que el producto ya no esté en el catálogo. Busca lo que necesitas o vuelve al inicio.
      </p>
      <div className="mt-8">
        <SearchBox defaultValue="" size="lg" />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/" variant="secondary">
          Volver al inicio <RiArrowRightLine className="size-4" />
        </ButtonLink>
        <ButtonLink href="/ayuda" variant="ghost">
          Pedir ayuda
        </ButtonLink>
      </div>
    </div>
  );
}
