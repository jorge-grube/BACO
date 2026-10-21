import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CMLogo } from "@/components/cm-logo";
import { SiteHeader } from "@/components/site-header";
import { CATALOG_URL } from "@/lib/domain";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "BACO · Producto de Madrid para hostelería", template: "%s · BACO" },
  description: "Encuentra a los productores certificados de la Comunidad de Madrid que encajan con lo que necesita tu cocina.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 md:px-8 xl:px-12 py-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <a href={CATALOG_URL} target="_blank" rel="noreferrer" aria-label="Catálogo M Producto Certificado de la Comunidad de Madrid">
                <CMLogo className="h-9" />
              </a>
              <p className="max-w-md text-xs leading-relaxed text-ink-3">
                Datos del catálogo M Producto Certificado. Ubicación, capacidad, precios, reseñas y actividad son datos de ejemplo
                del prototipo. Las fotos son ilustrativas (Unsplash): muestran el tipo de producto, no el producto concreto.
              </p>
            </div>
            <p className="shrink-0 text-xs text-ink-3">BACO · Reto Aplus Gastromarketing · 2026</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
