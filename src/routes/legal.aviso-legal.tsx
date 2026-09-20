import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/legal/aviso-legal")({
  head: () => ({
    meta: [
      { title: "Aviso legal — ECLIPSSE™ UNIVERSE" },
      { name: "description", content: "Aviso legal e información del responsable de ECLIPSSE™ UNIVERSE." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/legal/aviso-legal" }],
  }),
  component: () => (
    <LegalLayout title="Aviso legal">
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información
        y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos del titular de este sitio web.
      </p>
      <h2>Titular</h2>
      <p>
        <strong>Jacobo Otero Campos</strong> (marca comercial «ECLIPSSE™ UNIVERSE» / «ECLIPSSEBRAND»).
        <br />
        NIF / CIF: <strong>48806552T</strong>
        <br />
        Domicilio: <strong>Plaza del Cabildo 12, 41001</strong>, Sevilla (España)
        <br />
        Contacto: <a href="mailto:eclipssebrand@gmail.com">eclipssebrand@gmail.com</a>
        <br />
        Instagram: <a href="https://www.instagram.com/eclipssebrand/" target="_blank" rel="noopener noreferrer">@eclipssebrand</a>
      </p>
      <h2>Objeto</h2>
      <p>
        El presente sitio web tiene por objeto presentar la marca y sus colecciones (DROPS), ofrecer los servicios de
        personalización y permitir la <strong>compraventa online</strong> de productos, con pago con tarjeta a través de
        la pasarela de pago Stripe. Las condiciones de venta se detallan en los{" "}
        <a href="/legal/terminos">términos y condiciones</a>.
      </p>
      <h2>Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio (textos, imágenes, logotipos, marcas, diseños) son titularidad de ECLIPSSE™
        FACTORY o se utilizan con autorización. Queda prohibida cualquier reproducción, distribución o comunicación
        pública sin autorización expresa.
      </p>
      <h2>Responsabilidad</h2>
      <p>
        ECLIPSSE™ UNIVERSE no se responsabiliza de los daños o perjuicios que pudieran derivarse de un mal uso del sitio
        web o de la información contenida en él.
      </p>
      <h2>Legislación aplicable</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para cualquier controversia las partes se
        someten a los Juzgados y Tribunales de Sevilla.
      </p>
    </LegalLayout>
  ),
});
