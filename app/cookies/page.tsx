import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Cookies" };

export default function Cookies() {
  return (
    <LegalPage title="Cookies" intro="BACO solo usa lo imprescindible para funcionar. No hay cookies de publicidad ni de analítica, por eso no te mostramos un aviso de cookies.">
      <section>
        <h2>Lo que guardamos en tu navegador</h2>
        <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de cookies (se desplaza de lado)">
          <table className="w-full min-w-[520px] text-[15px]">
            <caption className="sr-only">Cookies y almacenamiento del navegador</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Tipo</th>
                <th scope="col">Para qué</th>
                <th scope="col">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>baco_profile</td>
                <td>Cookie técnica</td>
                <td>Mantenerte dentro después de entrar</td>
                <td>Hasta que cierres sesión o el navegador</td>
              </tr>
              <tr>
                <td>baco-help-nudge</td>
                <td>Almacenamiento local</td>
                <td>No repetirte el aviso «¿Es tu primera vez?»</td>
                <td>Hasta que lo borres</td>
              </tr>
              <tr>
                <td>baco-tour</td>
                <td>Almacenamiento de sesión</td>
                <td>Seguir la guía paso a paso al cambiar de página</td>
                <td>Hasta que cierres la pestaña</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Son técnicas y necesarias, por lo que no requieren tu consentimiento (Ley 34/2002, artículo 22.2).</p>
      </section>
    </LegalPage>
  );
}
