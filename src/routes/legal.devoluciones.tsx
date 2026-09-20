import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/legal/devoluciones")({
  head: () => ({
    meta: [
      { title: "Envíos y devoluciones — ECLIPSSE™ UNIVERSE" },
      { name: "description", content: "Condiciones de envío y devoluciones de ECLIPSSE™ UNIVERSE." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/legal/devoluciones" }],
  }),
  component: () => (
    <LegalLayout title="Envíos y devoluciones">
      <h2>Envíos</h2>
      <p>
        Realizamos envíos mediante Correos a la <strong>península y Baleares</strong>. El coste se calcula
        automáticamente en el proceso de compra según el peso del pedido y la zona de destino, y se muestra antes de
        pagar. El plazo estimado es de 3 a 10 días laborables desde la confirmación del pago. En pedidos personalizados
        o de gran cantidad, el plazo puede ampliarse hasta 14 días laborables.
      </p>
      <p>
        <strong>No realizamos envíos a Canarias, Ceuta, Melilla ni fuera de España</strong> por el procedimiento
        habitual. Si quieres un pedido para alguno de esos destinos, escríbenos por WhatsApp y lo gestionamos de otra
        manera.
      </p>
      <h2>Derecho de desistimiento</h2>
      <p>
        Conforme a la Ley General para la Defensa de los Consumidores y Usuarios, dispones de 14 días naturales desde la
        recepción para desistir del pedido, sin necesidad de justificación. Para ejercerlo, escríbenos a{" "}
        <a href="mailto:eclipssebrand@gmail.com">eclipssebrand@gmail.com</a> indicando tu pedido.
      </p>
      <h2>Condiciones de la devolución</h2>
      <p>
        El producto debe devolverse en perfecto estado, sin usar, con su etiquetado y embalaje original. Los costes de
        envío de la devolución corren a cargo del cliente, salvo defecto de fabricación.
      </p>
      <h2>Productos personalizados</h2>
      <p>
        Los productos personalizados (DTF, serigrafía, bordado o cualquier producto fabricado a medida) están excluidos
        del derecho de desistimiento, salvo defecto de fabricación, de acuerdo con el artículo 103.c de la mencionada
        Ley.
      </p>
      <h2>Reembolsos</h2>
      <p>
        Una vez recibida y verificada la devolución, se realizará el reembolso a través de Stripe al mismo medio de pago
        utilizado en la compra, en un plazo máximo de 14 días naturales. El reembolso incluye el importe del producto y,
        cuando proceda por desistimiento total, los gastos de envío estándar iniciales.
      </p>
      <h2>Productos defectuosos</h2>
      <p>
        Si recibes un producto defectuoso o erróneo, contacta con nosotros en un plazo de 48 horas para gestionar la
        solución sin coste alguno.
      </p>
    </LegalLayout>
  ),
});
