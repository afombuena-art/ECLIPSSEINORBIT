import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/legal/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y condiciones — ECLIPSSE™ UNIVERSE" },
      { name: "description", content: "Términos y condiciones de venta de ECLIPSSE™ UNIVERSE." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/legal/terminos" }],
  }),
  component: () => (
    <LegalLayout title="Términos y condiciones">
      <h2>Información general</h2>
      <p>
        Las presentes condiciones regulan la venta de productos a través de la tienda online de ECLIPSSE™ UNIVERSE,
        titularidad de <strong>Jacobo Otero Campos</strong>, con NIF <strong>48806552T</strong> y domicilio en
        <strong> Plaza del Cabildo 12, 41001</strong>, Sevilla (España). Realizar un pedido implica la aceptación expresa de estas
        condiciones.
      </p>
      <h2>Productos y precios</h2>
      <p>
        Los precios se expresan en euros (€) e incluyen el IVA aplicable. Los gastos de envío se calculan y se muestran
        durante el proceso de compra (checkout), antes de que confirmes y pagues el pedido. ECLIPSSE™ UNIVERSE se reserva
        el derecho a modificar precios sin previo aviso, respetando siempre los pedidos ya confirmados y pagados.
      </p>
      <h2>Proceso de compra y pago</h2>
      <p>
        La compra se realiza en la web: añades los productos al carrito, completas tus datos de envío en el checkout y
        pagas con tarjeta. El pago se procesa de forma segura a través de <strong>Stripe</strong> como proveedor de
        servicios de pago; los datos de tu tarjeta se introducen y se tratan directamente en el entorno seguro de Stripe
        y en ningún momento son almacenados por ECLIPSSE™ UNIVERSE.
      </p>
      <p>
        El pedido se considera perfeccionado cuando el pago queda confirmado. Recibirás la confirmación por email. Si el
        pago no puede verificarse, el pedido no se tramita.
      </p>
      <h2>Disponibilidad</h2>
      <p>
        Trabajamos por <strong>DROPS</strong> con unidades limitadas. Si un producto se agota tras tu pago por un error
        de stock, te informaremos y te reembolsaremos el importe correspondiente. Una vez agotado el stock de un DROP,
        el producto no vuelve a estar disponible.
      </p>
      <h2>Envíos</h2>
      <p>
        Los envíos se realizan mediante Correos a la <strong>península y Baleares</strong>. El coste se calcula en el
        checkout según el peso del pedido y la zona de destino. El plazo estimado de entrega es de 3 a 10 días
        laborables tras la confirmación del pago, salvo en pedidos personalizados (ver sección correspondiente).
      </p>
      <p>
        <strong>No se realizan envíos a Canarias, Ceuta, Melilla ni fuera de España</strong> por el procedimiento
        habitual. Para esos destinos es necesario contactar previamente con nosotros por WhatsApp, y el pedido se
        gestionará de forma separada a esta tienda.
      </p>
      <h2>Productos personalizados</h2>
      <p>
        Los productos personalizados se gestionan a través de la sección <em>Personaliza</em> y se fabrican bajo pedido.
        No se admiten devoluciones salvo defecto de fabricación, de acuerdo con el artículo 103.c del texto refundido de
        la Ley General para la Defensa de los Consumidores y Usuarios.
      </p>
      <h2>Desistimiento y devoluciones</h2>
      <p>
        Dispones de 14 días naturales desde la recepción para desistir de la compra. Consulta las condiciones y el
        procedimiento en <a href="/legal/devoluciones">Envíos y devoluciones</a>.
      </p>
      <h2>Atención al cliente</h2>
      <p>
        Para cualquier consulta: <a href="mailto:eclipssebrand@gmail.com">eclipssebrand@gmail.com</a> o por WhatsApp /
        Instagram.
      </p>
      <h2>Legislación</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Los consumidores pueden acudir a la plataforma
        europea de resolución de litigios en línea:{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
      </p>
    </LegalLayout>
  ),
});
