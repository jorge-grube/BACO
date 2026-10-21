import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CMLogo } from "@/components/cm-logo";
import { SiteHeader } from "@/components/site-header";
import { CATALOG_URL } from "@/lib/domain";
import { HelpCenter } from "@/components/help/help-center";
import { CONTACT } from "@/lib/contact";
import { buildGuides } from "@/lib/help/guides";
import { demoProductId } from "@/lib/help/demo";
import { currentProfile } from "@/lib/session";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "BACO · Producto de Madrid para hostelería", template: "%s · BACO" },
  description: "Encuentra a los productores certificados de la Comunidad de Madrid que encajan con lo que necesita tu cocina.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await currentProfile();
  const contact = {
    isDemo: CONTACT.isDemo,
    phoneDisplay: CONTACT.phoneDisplay,
    phoneHref: CONTACT.phoneHref,
    whatsappNumber: CONTACT.whatsappNumber,
    email: CONTACT.email,
    hours: CONTACT.hours,
  };
  return (
    <html lang="es" className={`${montserrat.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 md:px-8 xl:px-12 py-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <a href={CATALOG_URL} target="_blank" rel="noreferrer" aria-label="Comunidad de Madrid: catálogo M Producto Certificado (abre en otra pestaña)">
                <CMLogo className="h-9" />
              </a>
              <p className="max-w-md text-xs leading-relaxed text-ink-3">
                Datos del catálogo M Producto Certificado. Ubicación, capacidad, precios, reseñas y actividad son datos de ejemplo
                del prototipo. Las fotos son ilustrativas (Unsplash): muestran el tipo de producto, no el producto concreto.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-ink-3 md:items-end">
              <a href="/ayuda" className="text-sm font-semibold text-ink underline underline-offset-2">
                Ayuda y contacto
              </a>
              <p>BACO · Reto Aplus Gastromarketing · 2026</p>
            </div>
          </div>
        </footer>
        <HelpCenter guides={buildGuides(demoProductId())} role={profile?.role ?? null} contact={contact} />
      </body>
    </html>
  );
}
