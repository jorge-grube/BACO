"use client";

import { RiPrinterLine } from "@remixicon/react";

export function PrintButton() {
  return (
    <button data-help="poster-print" onClick={() => window.print()} className="no-print inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-white hover:bg-ink/85">
      <RiPrinterLine className="size-5" aria-hidden /> Imprimir o guardar en PDF
    </button>
  );
}
