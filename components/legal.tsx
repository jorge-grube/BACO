import { DemoNote } from "@/components/phone-message";
import { CONTACT } from "@/lib/contact";

// Datos del titular. Son de ejemplo hasta que se defina la empresa que opera BACO.
export const OWNER = {
  name: "BACO (proyecto de demostración)",
  nif: "B00000000",
  address: "Calle de Ejemplo, 1 · 28001 Madrid",
  registry: "Inscripción registral pendiente",
  email: CONTACT.email,
  updated: "21 de octubre de 2026",
};

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <p className="label">Legal</p>
      <h1 className="mt-2 text-[32px] leading-tight font-semibold tracking-[-0.035em]">{title}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-2" data-help="legal-intro">
        {intro}
      </p>
      <div className="mt-4">
        <DemoNote>los datos del titular son de ejemplo. Antes de abrir BACO al público hay que sustituirlos por los reales.</DemoNote>
      </div>
      <div className="legal mt-8 space-y-8 text-[17px] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_td]:border-t [&_td]:border-line [&_td]:py-2.5 [&_td]:pr-3 [&_td]:align-top [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
      <p className="mt-10 text-sm text-ink-3">Última actualización: {OWNER.updated}.</p>
    </div>
  );
}
