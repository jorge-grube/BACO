import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine, RiShieldCheckLine } from "@remixicon/react";
import { PrintButton } from "@/components/poster";
import { Logo } from "@/components/ui";
import { badgeOf, getProfile, suppliersOf } from "@/lib/db/repo";
import { qrSvg, siteOrigin } from "@/lib/site";

export const metadata: Metadata = { title: "Cartel del distintivo" };

// Cartel para la puerta del restaurante con el distintivo. No usa el logo de M Producto Certificado
// (marca de la Comunidad de Madrid): solo con su autorización.
export default async function BadgePoster({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getProfile(id);
  if (!profile || profile.role !== "hostelero" || badgeOf(id)?.status !== "concedido") notFound();
  const suppliers = suppliersOf(id);
  const url = `${await siteOrigin()}/restaurantes#${profile.id}`;
  const svg = await qrSvg(url);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/panel" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
          <RiArrowLeftSLine className="size-5" aria-hidden /> Volver a mi panel
        </Link>
        <PrintButton />
      </div>
      <article data-help="poster" className="poster mx-auto flex aspect-[210/297] w-full max-w-[560px] flex-col items-center justify-between rounded-[8px] border border-line bg-white p-10 text-center print:border-0">
        <div className="text-[34px] leading-none">
          <Logo />
        </div>
        <div>
          <RiShieldCheckLine className="mx-auto size-14 text-sage-700" aria-hidden />
          <h1 className="mt-2 text-[32px] leading-tight font-semibold tracking-[-0.035em]">Cocina con producto de Madrid</h1>
          <p className="mt-2 text-lg text-ink-2">{profile.business_name ?? profile.name}</p>
        </div>
        <div className="w-[52%]" role="img" aria-label={`Código QR que abre ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <div>
          <p className="text-lg font-semibold">Escanea y conoce a nuestros productores</p>
          {suppliers.length > 0 && <p className="mt-1 text-base text-ink-2">{suppliers.slice(0, 3).map((s) => s.name).join(" · ")}</p>}
          <p className="mt-2 text-sm break-all text-ink-3">{url}</p>
        </div>
      </article>
    </div>
  );
}
