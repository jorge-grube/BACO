import type { Metadata } from "next";
import { LegalPage, OWNER } from "@/components/legal";

export const metadata: Metadata = { title: "Aviso legal" };

export default function LegalNotice() {
  return (
    <LegalPage title="Aviso legal" intro="Quién está detrás de BACO y en qué condiciones puedes usarlo (Ley 34/2002 de servicios de la sociedad de la información, artículo 10).">
      <section>
        <h2>Titular</h2>
        <ul>
          <li>Nombre: {OWNER.name}</li>
          <li>NIF: {OWNER.nif} (dato de ejemplo)</li>
          <li>Domicilio: {OWNER.address} (dato de ejemplo)</li>
          <li>Registro: {OWNER.registry}</li>
          <li>Correo: {OWNER.email}</li>
        </ul>
      </section>
      <section>
        <h2>Qué es BACO</h2>
        <p>Un buscador que pone en contacto a la hostelería y al público con productores de la Comunidad de Madrid adheridos a la marca de garantía M Producto Certificado.</p>
        <p>
          Los productos, empresas y sellos salen del catálogo público de la Comunidad de Madrid. BACO no está vinculado a la Comunidad ni usa su marca con fines
          propios. Los precios, la ubicación, las reseñas y la actividad que ves son de ejemplo.
        </p>
      </section>
      <section>
        <h2>Compras y pagos</h2>
        <p>BACO no cobra ni vende online. Las muestras y los pedidos se acuerdan directamente con el productor. En el puesto compartido se paga en el mercado, al recoger.</p>
      </section>
      <section>
        <h2>Contenido patrocinado</h2>
        <p>Los productos patrocinados llevan siempre la etiqueta «Patrocinado» y nunca pasan por delante de los que no cumplen lo que buscas.</p>
      </section>
    </LegalPage>
  );
}
