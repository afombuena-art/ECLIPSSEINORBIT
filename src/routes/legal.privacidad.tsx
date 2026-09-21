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
        <strong>Jacobo Otero Campos</strong> — NIF <strong>48806552T</strong> — <strong>Plaza del Cabildo 12, 41001</strong>, Sevilla,
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
        Los datos de facturación se conservan <strong>6 años</strong>, como exige la normativa fiscal y contable. Los
        datos de contacto y envío, <strong>3 años</strong> desde la entrega, mientras puedan ejercerse garantías o
        reclamaciones. Si nos has dado tu consentimiento para recibir novedades, tu email se conserva hasta que te des
        de baja.
      </p>
      <h2>Destinatarios y encargados del tratamiento</h2>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Para prestar el servicio trabajamos con proveedores que
        actúan como encargados del tratamiento: <strong>Stripe</strong> (procesamiento del pago),
        <strong> Correos</strong> y <strong>Packlink PRO</strong> (preparación y entrega del envío),
        <strong> Vercel</strong> (alojamiento de la web), <strong>iActivaPráctica</strong> (soporte técnico de la
        tienda: mantiene la web, la automatización de pedidos y la base de datos donde quedan registrados),
        <strong> Hostinger</strong> (servidor donde se ejecuta la herramienta que registra tu pedido de forma automática
        una vez confirmado el pago) y <strong>Airtable</strong> (registro y gestión de los pedidos).
      </p>
      <p>
        <strong>Airtable</strong> es una empresa estadounidense, por lo que los datos de tu pedido se tratan fuera del
        Espacio Económico Europeo. Esa transferencia se ampara en las cláusulas contractuales tipo aprobadas por la
        Comisión Europea. Otros proveedores pueden tratar datos fuera del EEE con esas mismas garantías.
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
