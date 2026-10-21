import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { RiArrowLeftSLine, RiExternalLinkLine, RiHeart3Fill, RiHeart3Line, RiMapPin2Line, RiShieldCheckLine } from "@remixicon/react";
import { toggleFavorite } from "@/app/actions";
import { ProductCard } from "@/components/product-card";
import { RequestForm, ReviewForm } from "@/components/forms";
import { IllustrativeTag, Shot } from "@/components/shot";
import { Avatar, ButtonLink, LabelBadge, MockTag, Rating, SectionHeader, SponsoredTag } from "@/components/ui";
import { getProducer, getProduct, isFavorite, logEvent, reviewsFor, similarProducts } from "@/lib/db/repo";
import { LABELS, ROLE_NAMES, type RequestType } from "@/lib/domain";
import { distanceKm } from "@/lib/geo";
import { formatNumber } from "@/lib/match/search";
import { productPhoto } from "@/lib/photos";
import { currentProfile } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct(Number((await params).id));
  return { title: p?.name ?? "Producto" };
}

const UNIT_LABEL: Record<string, string> = { kg: "kg", l: "litro", botella: "botella", ud: "unidad" };

export default async function ProductPage({ params }: Props) {
  const id = Number((await params).id);
  const product = Number.isInteger(id) ? getProduct(id) : undefined;
  if (!product) notFound();
  const producer = getProducer(product.producer_id)!;
  const profile = await currentProfile();
  logEvent(profile?.id ?? null, product.id, "view");

  const reviews = reviewsFor(product.id);
  const similar = similarProducts(product, 4);
  const fav = profile ? isFavorite(profile.id, product.id) : false;
  const km = profile?.lat && profile.lng ? distanceKm({ lat: profile.lat, lng: profile.lng }, product) : null;
  const allowed: RequestType[] =
    profile?.role === "consumidor" ? ["contacto"] : ["muestra", "pedido", "contacto"];
  const unit = UNIT_LABEL[product.unit] ?? product.unit;

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12 pt-6">
      <Link
        href={`/buscar?cat=${encodeURIComponent(product.category)}`}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink"
      >
        <RiArrowLeftSLine className="size-5" aria-hidden /> Volver a {product.category.toLowerCase()}
      </Link>

      {/* En el móvil, el recuadro para escribir al productor va antes que las reseñas (antes quedaba dos pantallas más abajo). */}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="lg:col-start-1">
          <ViewTransition name={`product-photo-${product.id}`} share="morph" default="none">
          <Shot
            photo={productPhoto(product)}
            alt={`Foto ilustrativa de ${product.category.toLowerCase()}`}
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="aspect-[4/3] rounded-lg sm:aspect-[2/1]"
            scrim="bottom"
            preload
          >
            <span title="El catálogo oficial no publica fotos: la imagen muestra el tipo de producto, no este producto concreto.">
              <IllustrativeTag className="absolute top-4 right-4" />
            </span>
            <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 text-white md:inset-x-6 md:bottom-5">
              <div>
                <p className="label !text-white">{product.category}</p>
                <p className="mt-1 text-xs font-medium text-white/80">
                  {product.brand ? `${product.brand} · ` : ""}M Producto Certificado
                </p>
              </div>
            </div>
          </Shot>
          </ViewTransition>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {product.labels.map((l) => (
              <LabelBadge key={l} code={l} />
            ))}
            {product.boost ? <SponsoredTag /> : null}
          </div>
          <h1 data-help="product-title" className="mt-3 text-[30px] leading-[1.1] font-semibold tracking-[-0.035em] md:text-[38px]">{product.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[15px] text-ink-2">
            <Link href={`/productor/${producer.id}`} className="font-semibold text-ink hover:underline hover:underline-offset-2">
              {producer.name}
            </Link>
            <span className="text-ink-3">·</span>
            <span className="inline-flex items-center gap-1">
              <RiMapPin2Line className="size-4 text-ink-3" /> {producer.municipality}
              {km !== null && <span className="text-ink-3">· a {formatNumber(km)} km de {profile?.business_name ?? "ti"}</span>}
            </span>
            <span className="text-ink-3">·</span>
            <Rating value={product.rating} count={product.reviews} />
          </p>

          {product.offer && (
            <p className="mt-5 inline-flex rounded-[10px] bg-clay-50 px-3 py-2 text-sm font-semibold text-clay">Oferta: {product.offer}</p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line text-sm md:grid-cols-4">
            <Fact label="Categoría oficial" value={product.subcategory ?? product.category} />
            <Fact label="Marca" value={product.brand ?? "—"} />
            <Fact
              label="Precio orientativo"
              value={product.price_hint ? `${formatNumber(product.price_hint, 1)} €/${unit}` : "—"}
              mock
            />
            <Fact
              label="Capacidad mensual"
              value={product.monthly_capacity ? `${formatNumber(product.monthly_capacity)} ${product.unit === "botella" ? "botellas" : product.unit}` : "—"}
              mock
            />
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <a href={product.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
              Ficha oficial en comunidad.madrid <RiExternalLinkLine className="size-3.5" />
            </a>
            {producer.website && (
              <a href={producer.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                Comprar en la web del productor <RiExternalLinkLine className="size-3.5" />
              </a>
            )}
          </div>

        </div>

        {/* Columna de acción */}
        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div id="solicitar" data-help="request" className="scroll-mt-24 rounded-md border border-line bg-white p-5 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="label">Contactar con el productor</p>
                <p className="mt-1 text-[13px] text-ink-2">Tu solicitud llega a su panel de BACO.</p>
              </div>
              {profile && (
                <form action={toggleFavorite.bind(null, product.id)} data-help="favorite">
                  <button
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold transition-transform hover:bg-paper-2 active:scale-95"
                    aria-pressed={fav}
                  >
                    {fav ? <RiHeart3Fill className="size-5 text-clay" aria-hidden /> : <RiHeart3Line className="size-5 text-ink-2" aria-hidden />}
                    {fav ? "Guardado" : "Guardar"}
                  </button>
                </form>
              )}
            </div>
            {!profile ? (
              <div className="space-y-2">
                <ButtonLink href={`/entrar?next=/producto/${product.id}`} className="w-full">
                  Entra para pedir muestra
                </ButtonLink>
                <p className="text-center text-xs text-ink-3">Cuentas de demo, sin contraseña.</p>
              </div>
            ) : profile.role === "productor" ? (
              <p className="rounded-[10px] bg-paper-2 p-3 text-[13px] text-ink-2">Estás viendo BACO como productor. Las solicitudes las envían hosteleros y consumidores.</p>
            ) : (
              <RequestForm productId={product.id} productName={product.name} unit={product.unit} allowed={allowed} />
            )}
          </div>

          <div className="mt-4 rounded-md border border-line p-5">
            <p className="label">Productor</p>
            <Link href={`/productor/${producer.id}`} className="mt-2 block font-semibold hover:underline hover:underline-offset-2">
              {producer.name}
            </Link>
            <p className="mt-0.5 text-[13px] text-ink-2">{producer.municipality}</p>
            {producer.owner_profile_id ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-sage-700">
                <RiShieldCheckLine className="size-4" /> Ficha gestionada por el productor
              </p>
            ) : (
              <p className="mt-3 text-[13px] leading-snug text-ink-3">
                Este productor aún no gestiona su página en BACO: tu mensaje le llega a través de Aplus.
              </p>
            )}
            {producer.capacity_note && <p className="dash mt-3 pt-3 text-[13px] leading-snug text-ink-2">{producer.capacity_note}</p>}
            <p className="dash mt-3 pt-3 text-xs text-ink-3">
              Sellos del producto: {product.labels.length ? product.labels.map((l) => LABELS[l].name).join(", ") : "M Producto Certificado"}
            </p>
          </div>
        </aside>

        {/* Reseñas */}
        <div className="lg:col-start-1 lg:row-start-2">
          <section data-help="reviews">
            <SectionHeader label={`${reviews.length} ${reviews.length === 1 ? "reseña" : "reseñas"}`} title="Qué dicen quienes ya lo usan" />
            {profile && profile.role !== "productor" && (
              <div className="mb-5">
                <ReviewForm productId={product.id} />
              </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-3">Todavía no hay reseñas.</p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {reviews.map((r) => (
                  <li key={r.id} className="flex gap-3 py-4">
                    <Avatar name={r.business_name ?? r.name} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="font-semibold">{r.business_name ?? r.name}</span>
                        <span className="text-ink-3">{ROLE_NAMES[r.role]}</span>
                        <span className="font-semibold tabular-nums">{r.rating}/5</span>
                        {r.is_mock ? <MockTag>reseña de ejemplo</MockTag> : null}
                      </p>
                      {r.text && <p className="mt-1 text-sm leading-relaxed text-ink-2">{r.text}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <SectionHeader label="Misma categoría, otros productores" title={`Más ${product.category.toLowerCase()} de Madrid`} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} morph />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({ label, value, mock }: { label: string; value: string; mock?: boolean }) {
  return (
    <div className="bg-white p-4">
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">
        {label} {mock && <MockTag>ejemplo</MockTag>}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
