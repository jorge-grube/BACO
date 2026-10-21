"use client";

import { useState } from "react";
import { RiArrowDownSLine, RiEqualizerLine } from "@remixicon/react";

// En el móvil los filtros se pliegan detrás de un botón encima de los resultados
// (antes quedaban al final de una página de 20 tarjetas). En pantallas grandes, siempre visibles.
export function MobileFilters({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="filtros"
        className="flex h-12 w-full items-center justify-between rounded-[12px] border border-line bg-white px-4 text-[15px] font-semibold shadow-card lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <RiEqualizerLine className="size-5 text-sage-700" aria-hidden /> Filtrar: {summary}
        </span>
        <RiArrowDownSLine className={`size-5 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="filtros" className={`${open ? "help-pop mt-4 block" : "hidden"} lg:mt-0 lg:block`}>
        {children}
      </div>
    </div>
  );
}
