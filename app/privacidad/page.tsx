import type { Metadata } from "next";
import { LegalPage, OWNER } from "@/components/legal";

export const metadata: Metadata = { title: "Privacidad" };

const USES = [
  ["Tu cuenta (nombre, móvil, tipo de negocio)", "Entrar con un código por SMS y mostrar tu panel", "Contrato (usar el servicio)", "Mientras tengas cuenta"],
  ["Peticiones a productores", "Hacer llegar tu mensaje al productor y su respuesta", "Contrato", "2 años"],
  ["«Que me llamen»", "Devolverte la llamada", "Tu consentimiento", "Hasta que te llamemos, y como mucho 30 días"],
  ["Reservas en el puesto", "Apartar el producto y enviarte el código", "Tu consentimiento", "3 meses después del día de mercado"],
  ["Inscripciones a la agenda", "Confirmar tu plaza y avisarte el día antes", "Tu consentimiento", "Hasta 1 mes después de la actividad"],
  ["Avisos por WhatsApp o SMS", "Contarte que te han escrito o contestado", "Tu consentimiento, que puedes retirar", "Mientras no lo retires"],
];

export default function Privacy() {
  return (
    <LegalPage title="Privacidad" intro="Qué datos pedimos, para qué, cuánto tiempo los guardamos y cómo puedes pedir que los borremos. Pedimos lo mínimo.">
      <section id="resumen">
        <h2>En resumen</h2>
        <ul>
          <li>Responsable: {OWNER.name}, NIF {OWNER.nif} (datos de ejemplo).</li>
          <li>No vendemos tus datos ni los usamos para publicidad.</li>
          <li>Tu mensaje solo lo ve el productor al que escribes.</li>
          <li>Puedes acceder, corregir o borrar tus datos escribiendo a {OWNER.email}.</li>
        </ul>
      </section>
      <section>
        <h2>Para qué usamos cada dato</h2>
        <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de datos (se desplaza de lado)">
          <table className="w-full min-w-[560px] text-[15px]">
            <caption className="sr-only">Datos, finalidad, base legal y plazo de conservación</caption>
            <thead>
              <tr>
                <th scope="col">Dato</th>
                <th scope="col">Para qué</th>
                <th scope="col">Base legal</th>
                <th scope="col">Cuánto tiempo</th>
              </tr>
            </thead>
            <tbody>
              {USES.map((r) => (
                <tr key={r[0]}>
                  {r.map((c) => (
                    <td key={c}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Quién más los trata</h2>
        <ul>
          <li>El proveedor de alojamiento de la web.</li>
          <li>WhatsApp (Meta), si nos escribes o te avisamos por WhatsApp. No envíes datos delicados por ese canal.</li>
          <li>El proveedor de SMS, para los códigos de acceso y las reservas.</li>
        </ul>
        <p>En esta demo no sale ningún mensaje: los avisos se guardan y se pueden ver en «Avisos enviados».</p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>
          Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {OWNER.email}. Si crees que no te atendemos bien, puedes
          reclamar ante la{" "}
          <a href="https://www.aepd.es" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
            Agencia Española de Protección de Datos<span className="sr-only"> (abre en otra pestaña)</span>
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
