import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CMLogo } from "@/components/cm-logo";
import { SiteHeader } from "@/components/site-header";
import { CATALOG_URL } from "@/lib/domain";
import { HelpCenter } from "@/components/help/help-center";
import { CONTACT } from "@/lib/contact";
import { buildGuides } from "@/lib/help/guides";
import { demoTargets } from "@/lib/help/demo";
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
        <footer className="no-print mt-24 border-t border-line pb-20">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8 xl:px-12">
            <div>
              <a href={CATALOG_URL} target="_blank" rel="noreferrer" aria-label="Comunidad de Madrid: catálogo M Producto Certificado (abre en otra pestaña)">
                <CMLogo className="h-9" />
              </a>
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-3">
                Productos y empresas del catálogo oficial M Producto Certificado. Ubicación, precios, reseñas, actividad, teléfonos y lo que organiza BACO son
                datos de ejemplo del prototipo. Las fotos son ilustrativas (Unsplash).
              </p>
              <p className="mt-3 text-[13px] text-ink-3">BACO · Reto Aplus Gastromarketing · 2026</p>
            </div>
            {[
              ["Explora", [["/buscar", "Buscar"], ["/puesto", "Puesto en mercadillos"], ["/agenda", "Agenda en persona"], ["/restaurantes", "Restaurantes"], ["/piloto/sierra-norte", "Piloto Sierra Norte"]]],
              ["Ayuda", [["/ayuda", "Ayuda y contacto"], ["/ayuda#guias", "Guías paso a paso"], ["/entrar", "Entrar con tu móvil"], ["/demo/avisos", "Avisos enviados (demo)"]]],
              ["Legal", [["/aviso-legal", "Aviso legal"], ["/privacidad", "Privacidad"], ["/cookies", "Cookies"], ["/accesibilidad", "Accesibilidad"]]],
            ].map(([title, links]) => (
              <nav key={title as string} aria-label={title as string}>
                <p className="text-sm font-semibold">{title as string}</p>
                <ul className="mt-2">
                  {(links as string[][]).map(([href, label]) => (
                    <li key={href}>
                      <a href={href} className="inline-flex min-h-11 items-center text-[15px] text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </footer>
        <HelpCenter guides={buildGuides(demoTargets())} role={profile?.role ?? null} contact={contact} />
      </body>
    </html>
  );
}
