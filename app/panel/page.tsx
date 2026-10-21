import type { Metadata } from "next";
import Link from "next/link";
import { RiArrowRightLine, RiInboxLine } from "@remixicon/react";
import { updateRequest } from "@/app/actions";
import { ProducerForm } from "@/components/forms";
import { ProductCard, ProductRow } from "@/components/product-card";
import { Shot } from "@/components/shot";
import { Avatar, ButtonLink, SectionHeader } from "@/components/ui";
import {
  favoritesOf,
  producerOwnedBy,
  producerStats,
  productsByProducer,
  requestsFor,
  requestsFrom,
  trendingProducts,
  type Profile,
  type RequestRow,
} from "@/lib/db/repo";
import { REQUEST_STATUS, REQUEST_TYPES, type RequestStatus } from "@/lib/domain";
import { productPhoto } from "@/lib/photos";
import { requireProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Mi panel" };

export default async function PanelPage() {
  const profile = await requireProfile();
  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-8 xl:px-12 pt-8">
      {profile.role === "productor" ? (
        <ProducerPanel profile={profile} />
      ) : profile.role === "hostelero" ? (
        <BuyerPanel profile={profile} />
      ) : (
        <ConsumerPanel profile={profile} />
      )}
    </div>
  );
}

// --- productor ----------------------------------------------------------------------

function ProducerPanel({ profile }: { profile: Profile }) {
  const producer = producerOwnedBy(profile.id);
  if (!producer) return <p>No gestionas ninguna ficha todavía.</p>;
  const stats = producerStats(producer.id);
  const requests = requestsFor(producer.id);
  const products = productsByProducer(producer.id);
  const pending = requests.filter((r) => r.status === "enviada").length;

  return (
    <>
      <PanelHeader
        profile={profile}
        title={producer.name}
        subtitle={`${products.length} productos · ${producer.municipality}`}
        action={
          <ButtonLink href={`/productor/${producer.id}`} variant="secondary" size="sm">
            Ver mi ficha pública
          </ButtonLink>
        }
      />
      <section className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-4">
        <Kpi value={stats.searchHits} label="veces que has salido en búsquedas" hint="últimos 7 días" />
        <Kpi value={stats.views} label="visitas a tus productos" hint="últimos 7 días" />
        <Kpi value={stats.favorites} label="veces guardado en favoritos" hint="últimos 7 días" />
        <Kpi value={`${Math.round(stats.answerRate * 100)} %`} label="solicitudes respondidas" hint={`${stats.requests} recibidas`} />
      </section>

      {/* minmax(0,…): sin él, los nombres largos ensanchaban la columna y la página se salía del móvil */}
      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section data-help="inbox">
          <SectionHeader label={pending ? `${pending} sin leer` : "Al día"} title="Mensajes de restaurantes y tiendas" />
          {requests.length === 0 ? (
            <Empty text="Todavía no te ha escrito nadie. Cuando un restaurante te pida algo, lo verás aquí." />
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <InboxItem key={r.id} r={r} />
              ))}
            </ul>
          )}
        </section>
        <aside className="space-y-8">
          <div>
            <SectionHeader label="Lo que ve la hostelería" title="Tu página en BACO" />
            <div className="rounded-md border border-line p-5" data-help="ficha">
              <ProducerForm values={producer} />
            </div>
          </div>
          <div>
            <p className="label mb-1">Tus productos</p>
            <div className="divide-y divide-line">
              {products.slice(0, 8).map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
            {products.length > 8 && (
              <Link href={`/productor/${producer.id}`} className="mt-2 inline-block text-[13px] font-semibold underline underline-offset-2">
                Ver los {products.length}
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function InboxItem({ r }: { r: RequestRow }) {
  const open = r.status === "enviada" || r.status === "vista";
  return (
    <li className={open ? "rounded-md border border-line bg-white p-5 shadow-card" : "rounded-md border border-line bg-paper-2/60 p-5"}>
      <div className="flex items-start gap-3">
        <Avatar name={r.from_business ?? r.from_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{r.from_business ?? r.from_name}</span>
            <StatusBadge status={r.status} />
            <span className="ml-auto text-xs text-ink-3">{ago(r.created_at)}</span>
          </div>
          <p className="text-[13px] text-ink-3">
            {[r.from_business_type, r.from_municipality].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-3 text-[13px]">
            <span className="font-semibold">{REQUEST_TYPES[r.type]}</span>
            {r.product_name && <> · {r.product_name}</>}
            {r.quantity && <span className="text-ink-2"> · {r.quantity}</span>}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{r.message}</p>
          {r.reply && (
            <p className="mt-3 border-l-2 border-sage pl-3 text-sm leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">Tu respuesta: </span>
              {r.reply}
            </p>
          )}
          {open && (
            <form action={updateRequest} className="mt-4 space-y-2" data-help="reply">
              <input type="hidden" name="requestId" value={r.id} />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Tu respuesta al restaurante</span>
                <textarea
                  name="reply"
                  rows={3}
                  required
                  placeholder="Por ejemplo: precio, plazo, qué día llevas la muestra…"
                  className="w-full resize-none rounded-[10px] border border-line-2 px-3 py-2 text-base leading-relaxed outline-none focus:border-ink"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button name="status" value="respondida" className="h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-white transition-transform hover:bg-ink/85 active:scale-95">
                  Enviar respuesta
                </button>
                {r.status === "enviada" && (
                  <button name="status" value="vista" formNoValidate className="h-11 rounded-full border border-line px-4 text-[15px] font-semibold hover:bg-paper-2">
                    Ya la he leído
                  </button>
                )}
                <button name="status" value="cerrada" formNoValidate className="h-11 rounded-full px-3 text-[15px] font-semibold text-ink-2 hover:text-ink">
                  Archivar sin responder
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}

// --- hostelero ----------------------------------------------------------------------

function BuyerPanel({ profile }: { profile: Profile }) {
  const requests = requestsFrom(profile.id);
  const favorites = favoritesOf(profile.id);
  const answered = requests.filter((r) => r.status === "respondida" || r.status === "cerrada").length;
  return (
    <>
      <PanelHeader
        profile={profile}
        title={profile.business_name ?? profile.name}
        subtitle={[profile.business_type, profile.municipality].filter(Boolean).join(" · ")}
        action={
          <ButtonLink href="/buscar" size="sm">
            Nueva búsqueda <RiArrowRightLine className="size-4" />
          </ButtonLink>
        }
      />
      <section className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
        <Kpi value={requests.length} label="solicitudes enviadas" />
        <Kpi value={answered} label="con respuesta" />
        <Kpi value={favorites.length} label="productos guardados" />
      </section>

      <section className="mt-12">
        <SectionHeader title="Tus solicitudes" />
        {requests.length === 0 ? (
          <Empty text="Cuando pidas una muestra o un pedido, lo verás aquí." />
        ) : (
          <>
          {/* Móvil: una tarjeta por petición, con la respuesta a la vista (la tabla cortaba "Estado" y "Respuesta") */}
          <ul className="space-y-3 md:hidden">
            {requests.map((r) => (
              <li key={r.id} className="rounded-md border border-line p-4">
                <div className="flex items-start gap-3">
                  {r.product_id && r.product_name && r.product_category && (
                    <Shot
                      photo={productPhoto({ id: r.product_id, name: r.product_name, category: r.product_category })}
                      sizes="56px"
                      className="size-12 shrink-0 rounded-[8px]"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-[13px] text-ink-3">{ago(r.created_at)}</span>
                    </div>
                    {r.product_id ? (
                      <Link href={`/producto/${r.product_id}`} className="mt-1 block text-[15px] leading-snug font-semibold underline-offset-2 hover:underline">
                        {r.product_name}
                      </Link>
                    ) : null}
                    <p className="text-[13px] text-ink-2">
                      {REQUEST_TYPES[r.type]} · {r.producer_name}
                    </p>
                  </div>
                </div>
                <p className="mt-3 border-l-2 border-sage pl-3 text-[15px] leading-relaxed text-ink-2">
                  {r.reply ? (
                    <>
                      <span className="font-semibold text-ink">Respuesta: </span>
                      {r.reply}
                    </>
                  ) : (
                    "Aún sin respuesta. Te avisaremos aquí."
                  )}
                </p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-md border border-line md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-paper-2 text-xs text-ink-3">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Producto</th>
                  <th className="px-4 py-2.5 font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 font-semibold">Respuesta</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Enviada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {r.product_id && r.product_name && r.product_category && (
                          <Shot
                            photo={productPhoto({ id: r.product_id, name: r.product_name, category: r.product_category })}
                            sizes="48px"
                            className="size-10 shrink-0 rounded-[6px]"
                          />
                        )}
                        <div className="min-w-0">
                          {r.product_id ? (
                            <Link href={`/producto/${r.product_id}`} className="font-semibold hover:underline hover:underline-offset-2">
                              {r.product_name}
                            </Link>
                          ) : (
                            <span className="font-semibold">—</span>
                          )}
                          <p className="text-xs text-ink-3">{r.producer_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {REQUEST_TYPES[r.type]}
                      {r.quantity && <p className="text-xs text-ink-3">{r.quantity}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-[13px] text-ink-2">{r.reply ?? <span className="text-ink-3">—</span>}</td>
                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap text-ink-3">{ago(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      <Favorites products={favorites} />
    </>
  );
}

// --- consumidor ---------------------------------------------------------------------

function ConsumerPanel({ profile }: { profile: Profile }) {
  const favorites = favoritesOf(profile.id);
  const trending = trendingProducts(4);
  return (
    <>
      <PanelHeader profile={profile} title={`Hola, ${profile.name.split(" ")[0]}`} subtitle="Tus productos de Madrid guardados" />
      <Favorites products={favorites} />
      <section className="mt-12">
        <SectionHeader label="Esta semana" title="Lo que más se está buscando" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}

// --- piezas comunes -------------------------------------------------------------------

function Favorites({ products }: { products: ReturnType<typeof favoritesOf> }) {
  return (
    <section className="mt-12">
      <SectionHeader label="Para tenerlos a mano" title="Favoritos" />
      {products.length === 0 ? (
        <Empty text="Aún no has guardado nada. Pulsa «Guardar» en la ficha de un producto." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function PanelHeader({ profile, title, subtitle, action }: { profile: Profile; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar name={profile.name} className="size-12 text-sm" />
        <div>
          <p className="text-[13px] text-ink-3">{profile.name}</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
          {subtitle && <p className="text-[13px] text-ink-2">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Kpi({ value, label, hint }: { value: number | string; label: string; hint?: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      <p className="mt-0.5 text-[13px] text-ink-2">{label}</p>
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

const STATUS_STYLE: Record<RequestStatus, string> = {
  enviada: "bg-ink text-white",
  vista: "bg-paper-2 text-ink border border-line",
  respondida: "bg-sage-50 text-sage-700",
  cerrada: "bg-paper-2 text-ink-3",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold ${STATUS_STYLE[status]}`}>{REQUEST_STATUS[status]}</span>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-line-2 p-6 text-sm text-ink-2">
      <RiInboxLine className="size-5 text-ink-3" /> {text}
    </div>
  );
}

function ago(sqlDate: string) {
  const then = new Date(sqlDate.replace(" ", "T") + "Z").getTime();
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}
