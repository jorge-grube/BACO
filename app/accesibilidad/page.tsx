import type { Metadata } from "next";
import { LegalPage, OWNER } from "@/components/legal";

export const metadata: Metadata = { title: "Accesibilidad" };

export default function Accessibility() {
  return (
    <LegalPage title="Declaración de accesibilidad" intro="Queremos que BACO lo pueda usar cualquiera, también quien no se lleva bien con la tecnología. Esto es lo que hemos hecho y lo que nos falta.">
      <section>
        <h2>Objetivo</h2>
        <p>Cumplir las pautas WCAG 2.2 en nivel AA (norma europea EN 301 549).</p>
      </section>
      <section>
        <h2>Lo que ya está hecho</h2>
        <ul>
          <li>Contraste de color comprobado en todas las páginas con la herramienta axe.</li>
          <li>Botones de al menos 44 píxeles en el móvil y letra de 16 píxeles en los formularios.</li>
          <li>Se puede usar con el teclado, con foco visible y enlace para saltar al contenido.</li>
          <li>Ayuda paso a paso y contacto con una persona siempre en el mismo sitio, con lectura en voz alta de cada paso.</li>
          <li>Entrar sin contraseña, con un código por SMS que se puede pegar.</li>
          <li>Las animaciones se apagan si tu sistema pide reducir el movimiento, y la animación de la portada se puede pausar.</li>
          <li>Lenguaje llano y siglas explicadas.</li>
        </ul>
      </section>
      <section>
        <h2>Lo que nos falta</h2>
        <ul>
          <li>Probar con lectores de pantalla reales (VoiceOver, TalkBack, NVDA).</li>
          <li>Probar con productores y restaurantes de verdad, con su móvil y sin ayuda.</li>
          <li>Los carteles con QR en papel aún no tienen versión en lectura fácil.</li>
        </ul>
      </section>
      <section>
        <h2>¿Algo no te funciona?</h2>
        <p>Escríbenos a {OWNER.email} o pulsa «Ayuda» y te llamamos. Te contestamos en 2 días laborables como mucho.</p>
      </section>
    </LegalPage>
  );
}
