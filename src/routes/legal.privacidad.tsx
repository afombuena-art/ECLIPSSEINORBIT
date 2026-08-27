import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/legal/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad — ECLIPSSE™ UNIVERSE" },
      { name: "description", content: "Política de privacidad y tratamiento de datos personales en ECLIPSSE™ UNIVERSE." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/legal/privacidad" }],
  }),
  component: () => (
    <LegalLayout title="Política de privacidad">
      <p>
        En ECLIPSSE™ UNIVERSE tratamos tus datos personales con el máximo respeto y conforme al Reglamento (UE) 2016/679
        (RGPD) y a la Ley Orgánica 3/2018 de Protección de Datos.
      </p>
      <h2>Responsable</h2>
      <p>
        <strong>[RAZÓN SOCIAL]</strong> — NIF <strong>[NIF/CIF]</strong> — <strong>[DOMICILIO FISCAL]</strong>, Sevilla,
        España · <a href="mailto:eclipssebrand@gmail.com">eclipssebrand@gmail.com</a>
      </p>
      <h2>Datos que recogemos</h2>
      <p>
        Cuando compras en la web, recogemos los datos que introduces en el proceso de compra: nombre y apellidos, email,
        teléfono, dirección de envío y facturación, y —si lo solicitas— NIF para factura. Los datos de tu tarjeta los
        recoge y trata directamente Stripe; nosotros no los vemos ni los almacenamos. Si nos contactas por WhatsApp,
        Instagram o email, tratamos los datos que nos facilites en esa comunicación.
      </p>
      <h2>Finalidad</h2>
      <p>
        Tramitar y enviar tu pedido, gestionar el cobro y las devoluciones, emitir factura cuando proceda, atender tus
        consultas y cumplir las obligaciones legales asociadas a la venta. Si marcas la casilla correspondiente,
        también para enviarte novedades por email (puedes darte de baja en cualquier momento).
      </p>
      <h2>Base legal</h2>
      <p>
        La ejecución del contrato de compraventa (art. 6.1.b RGPD), el cumplimiento de obligaciones legales (art. 6.1.c)
        y, para el envío de comunicaciones comerciales, tu consentimiento (art. 6.1.a).
      </p>
      <h2>Conservación</h2>
      <p>
        Conservamos los datos el tiempo necesario para gestionar el pedido y, después, durante los plazos legales de
        prescripción (facturación, garantías, obligaciones fiscales y contables).
      </p>
      <h2>Destinatarios y encargados del tratamiento</h2>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Para prestar el servicio trabajamos con proveedores que
        actúan como encargados del tratamiento: <strong>Stripe</strong> (procesamiento de pagos),
        <strong> Correos</strong> y la plataforma logística de envíos (entrega del pedido) y <strong>Vercel</strong>
        (alojamiento de la web). Alguno de estos proveedores puede tratar datos fuera del Espacio Económico Europeo con
        las garantías previstas en el RGPD (cláusulas contractuales tipo).
      </p>
      <h2>Derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo
        a <a href="mailto:eclipssebrand@gmail.com">eclipssebrand@gmail.com</a>. También puedes reclamar ante la Agencia
        Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>).
      </p>
    </LegalLayout>
  ),
});
