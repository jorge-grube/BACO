import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine } from "@remixicon/react";
import { PrintButton } from "@/components/poster";
import { Logo } from "@/components/ui";
import { getProducer, productsByProducer } from "@/lib/db/repo";
import { qrSvg, siteOrigin } from "@/lib/site";

export const metadata: Metadata = { title: "Cartel con QR para tu puesto" };

// Cartel A4 para el puesto del mercado: el cliente escanea y llega a la página del productor.
export default async function ProducerPoster({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const producer = Number.isInteger(id) ? getProducer(id) : undefined;
  if (!producer) notFound();
  const products = productsByProducer(producer.id);
  const url = `${await siteOrigin()}/productor/${producer.id}`;
  const svg = await qrSvg(url);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/productor/${producer.id}`} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
          <RiArrowLeftSLine className="size-5" aria-hidden /> Volver a la página
        </Link>
        <PrintButton />
      </div>
      <article data-help="poster" className="poster mx-auto flex aspect-[210/297] w-full max-w-[560px] flex-col items-center justify-between rounded-[8px] border border-line bg-white p-10 text-center print:border-0">
        <div className="text-[34px] leading-none">
          <Logo />
        </div>
        <div>
          <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.035em]">{producer.name}</h1>
          <p className="mt-2 text-lg text-ink-2">{producer.municipality} · Comunidad de Madrid</p>
          <p className="mt-1 text-base text-ink-2">{products.length} productos con el sello M Producto Certificado</p>
        </div>
        <div className="w-[62%]" role="img" aria-label={`Código QR que abre ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <div>
          <p className="text-xl font-semibold">Escanea y encuentra nuestros productos</p>
          <p className="mt-1 text-base text-ink-2">Restaurantes: pídenos muestra desde BACO</p>
          <p className="mt-2 text-sm break-all text-ink-3">{url}</p>
        </div>
      </article>
    </div>
  );
}
