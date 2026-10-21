import type { Metadata } from "next";
import Link from "next/link";
import { ReviewOnboardingForm, SuccessBox } from "@/components/forms-extra";
import { DemoNote } from "@/components/phone-message";
import { Shot } from "@/components/shot";
import { getMagicLink, getOnboarding, productsByProducer } from "@/lib/db/repo";
import { productPhoto } from "@/lib/photos";

export const metadata: Metadata = { title: "Revisa tu página", robots: { index: false } };

// Alta asistida: el equipo preparó la página; el productor la ve tal cual y la publica con un toque.
export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = getMagicLink(token);
  const o = link?.purpose === "revisar" && link.onboarding_id ? getOnboarding(link.onboarding_id) : undefined;
  if (!o) {
    return (
      <div className="mx-auto max-w-md px-5 pt-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Este enlace ya no sirve</h1>
        <p className="mt-2 text-[17px] text-ink-2">Pulsa «Ayuda» y te llamamos para revisarlo juntos.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-base font-semibold text-white">
          Ir a BACO
        </Link>
      </div>
    );
  }
  const products = productsByProducer(o.producer_id);
  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <p className="label">Hola, {o.contact_name}</p>
      <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.03em]">Así se verá tu página en BACO</h1>
      <p className="mt-2 text-[17px] text-ink-2">La hemos preparado con lo que nos contaste. Si está bien, pulsa «Está bien, publicar». Si no, dinos qué cambiar.</p>

      <section className="mt-6 overflow-hidden rounded-[20px] border border-line" data-help="review-preview">
        <div className="grid grid-cols-3 gap-1 p-1">
          {products.slice(0, 3).map((p) => (
            <Shot key={p.id} photo={productPhoto(p)} sizes="200px" className="aspect-square rounded-[14px]" />
          ))}
        </div>
        <div className="p-5">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">{o.producer_name}</h2>
          <p className="text-[15px] text-ink-2">{o.municipality} · teléfono {o.phone}</p>
          {o.description && <p className="mt-3 text-[17px] leading-relaxed">{o.description}</p>}
          {o.capacity_note && (
            <p className="mt-3 text-[15px] text-ink-2">
              <span className="font-semibold text-ink">Para restaurantes: </span>
              {o.capacity_note}
            </p>
          )}
          <p className="mt-3 text-[15px] text-ink-2">
            {products.length} productos del catálogo M Producto Certificado: {products.slice(0, 4).map((p) => p.name).join(", ")}
            {products.length > 4 ? "…" : ""}
          </p>
        </div>
      </section>

      <div className="mt-6" data-help="review-buttons">
        {o.status === "publicado" ? <SuccessBox>Tu página ya está publicada. ¡Gracias!</SuccessBox> : <ReviewOnboardingForm token={token} />}
      </div>
      <div className="mt-6">
        <DemoNote>en la versión final este enlace llega por WhatsApp y sirve 30 días. Las fotos del ejemplo son ilustrativas.</DemoNote>
      </div>
    </div>
  );
}
