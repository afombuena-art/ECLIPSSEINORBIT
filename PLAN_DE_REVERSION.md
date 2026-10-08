# Plan de reversión — apertura de la tienda en producción

**Escrito el 2026-10-08 (Claude, con Ana).** Estado: **BORRADOR SIN ENSAYAR**: ningún paso de este plan se ha deshecho nunca en real. Los nombres de pantalla de Cloudflare, Stripe, Airtable y Vercel pueden variar; si algo no coincide, manda lo que se vea en pantalla.

Este plan acompaña al «plan de apertura» de `00_ESTADO_PROYECTO.md` (fases A-D). **Debe estar leído antes de empezar la Fase C.** Cada paso de apertura se deshace por separado.

---

## 0 · Regla de oro

1. **Un solo cambio cada vez, comprobado antes de pasar al siguiente.** Si algo falla, se deshace solo el último paso.
2. **El sistema anterior no se toca hasta el final.** La web actual (en Vercel) sigue funcionando, sin carrito, hasta la Fase D. **No se acepta ningún Pull Request ni se integra nada en `main` del repositorio de Jacobo.**
3. **Quién decide revertir: Ana, hablándolo con Jacobo.** Claude no puede desplegar ni cambiar el dominio; prepara y acompaña.
4. Dinero real: **cualquier cobro dudoso se reembolsa primero y se investiga después** (ver sección 5).

## 1 · Antes de empezar la Fase C (obligatorio)

- [ ] **Captura de pantalla de los registros DNS actuales de `eclipssebrand.es`** (Jacobo). Es lo que se restaura si hay que volver atrás. Guardarla fuera del ordenador de trabajo (móvil, correo).
- [ ] **Bajar el TTL de esos registros** (a 300 s, unos 5 minutos) **24 horas antes** del cambio. *(Recomendación habitual; no probada aquí.)* Así, deshacer tarda minutos y no horas.
- [ ] **Jacobo disponible** durante el cambio y la hora siguiente.
- [ ] **Vercel intacto**: proyecto activo, sin pausar, sin borrar.
- [ ] Elegir una **hora de poco tráfico** y no hacer el cambio en viernes ni antes de un fin de semana.
- [ ] Estas tres cosas **ya comprobadas en la Fase B**: la compra real pequeña llegó a Airtable (pedidos y stock) y se pudo devolver.

## 2 · Cómo se deshace cada paso

| Paso | Se deshace así | Quién | Tarda | Qué se pierde / ojo |
|---|---|---|---|---|
| **A1** · Crear el Worker de producción (`npm run deploy:produccion`) | Cloudflare → Workers → `eclipsseinorbit` → Configuración → **Eliminar**. Mientras no tenga dominio, solo existe en su dirección `workers.dev`. | Ana | 1 min | Nada: no hay clientes. Mientras exista, se mantiene oculta a buscadores con `APP_ENV=preprod`. |
| **A2** · Cargar los 7 secretos | Borrarlos en el Worker (Configuración → Variables y secretos), o borrar el Worker. **Si alguna clave pudo quedar expuesta** (se pegó donde no debía): rotarla en su origen (Stripe: «renovar clave»; Airtable: borrar el token y crear otro). | Ana | 2 min | La tienda deja de poder cobrar. |
| **A3** · Subir una versión nueva con un fallo | `npx wrangler rollback --name eclipsseinorbit` (elige una versión anterior de la lista), o en el panel: Worker → Implementaciones → volver a una versión anterior. | Ana | 1-2 min | Solo el código; los secretos se conservan. *(El comando existe; no se ha ejecutado en real.)* |
| **B** · Compra real pequeña | **Reembolsarla en Stripe** (Pagos → el pago → Reembolsar). Borrar su fila de `Ventas` en la base de stock **real** y su fila en la tabla de pedidos de Airtable. | Ana | 5 min | Stripe **no suele devolver su comisión**. Avisar al asesor de que existió ese cobro y devolución. |
| **C1** · Webhook live de Stripe | Stripe → Workbench → Webhooks → Destinos de eventos → **desactivar** (o borrar) el destino. | Ana | 1 min | ⚠️ **Con el webhook apagado, los pedidos pagados NO llegan a Airtable ni a n8n.** Los cobros siguen existiendo en Stripe; ver sección 4. |
| **C2** · Cambiar `SITE_URL` al dominio real | Volver a poner la dirección `workers.dev` como Secret y esperar a que se aplique. | Ana | 2 min | Los enlaces de «pedido confirmado» y las fotos de la pantalla de pago apuntan a la dirección vieja. |
| **C3** · Dominio y DNS (**Jacobo**) | **Restaurar los registros DNS de la captura** de la sección 1. Después, quitar el dominio personalizado del Worker (Cloudflare → Worker → Configuración → Dominios y rutas). | **Jacobo** | **Lo que dure el TTL** (≈5 min si se bajó; hasta horas si no) | Mientras tanto, parte de los visitantes ve una web y parte la otra. La web vieja no tiene carrito: **no hay cobros en ella**, así que no hay conflicto de pedidos. |
| **C4** · Quitar `APP_ENV` (la tienda pasa a ser indexable) | Volver a poner `APP_ENV=preprod` como Secret. | Ana | 2 min | Google puede haber guardado ya alguna página: tarda semanas en olvidarla. |
| **D** · Pausar Vercel | Vercel → el proyecto → **reanudar**. **No borrar nunca el proyecto** hasta pasadas varias semanas con tráfico real estable. | **Jacobo** (es su cuenta) | 2 min | Nada, si no se ha borrado. |

## 3 · El botón rojo: parar las ventas ya, sin tocar el dominio

Si algo va mal con dinero (cobros raros, totales o envíos mal calculados, pedidos duplicados) y hay que parar **inmediatamente**:

1. Cloudflare → Worker `eclipsseinorbit` → Configuración → Variables y secretos → **borrar el secreto `AIRTABLE_STOCK_BASE_ID`**.
2. Efecto: la tienda sigue visible, pero **nadie puede pagar** («No se ha podido procesar el pago…»). Es el comportamiento «sin Airtable, no se vende» y **se comprobó en preproducción el 2026-10-08**. La web mostrará un stock orientativo mientras tanto.
3. Los pagos **ya iniciados** (hasta ~36 minutos) todavía pueden completarse y llegarán bien.
4. Para volver a vender: volver a poner el secreto (el ID es `appUjZ8uk9xpMIrB2`, la base real) y comprobar con una compra.

*(Alternativa más fina: `npx wrangler rollback --name eclipsseinorbit` a la última versión buena.)*

## 4 · Si se pierden pedidos mientras el webhook estaba apagado o roto

- **Stripe es la fuente de verdad del dinero.** Pagos → todos los cobros del periodo.
- Para cada pago que no esté en la tabla de pedidos de Airtable: en Stripe → Workbench → Webhooks → el evento `checkout.session.completed` → **Reenviar**, o introducir el pedido a mano.
- **El stock** lo repara solo la revisión automática (cada hora, minuto 7), **pero solo para pagos posteriores al 2026-10-09 y sin la marca `stockRegistrado`**. Los pedidos de n8n/Airtable (datos del cliente y envío) **no** los recupera: hay que reenviarlos o anotarlos a mano.
- Si hay duda de si un pedido llegó: la «Referencia del pedido» de Airtable es la misma que `orderRef` en los metadatos del pago de Stripe.

## 5 · Dinero y clientes

- **Reembolso**: Stripe → Pagos → el pago → Reembolsar. Vuelve a la misma tarjeta; al cliente le puede tardar unos 5-10 días hábiles en verse.
- **Tras reembolsar**, ajustar el stock: borrar la fila de ese pedido en `Ventas` si la unidad vuelve a estar a la venta.
- Avisar al cliente por correo o WhatsApp con el motivo. **No mandar mensajes automáticos en nombre de Jacobo sin su visto bueno.**
- **Facturas / IVA**: si a algún cliente se le dio factura, una devolución normalmente exige rectificativa. **Preguntar al asesor** (no es asesoramiento fiscal).

## 6 · Señales de que hay que revertir (cualquiera de ellas)

| Señal | Primer paso |
|---|---|
| Alguien paga y **no llega el pedido** a Airtable en unos minutos | Mirar el registro del Worker («stripe-webhook»); si no se arregla en 15 min, botón rojo y sección 4. |
| El **total cobrado no coincide** con el del carrito | Botón rojo; reembolsar los afectados. |
| La web **no abre** o da error en el dominio | Restaurar DNS (C3). |
| **Cobros que nadie esperaba** o duplicados | Botón rojo y reembolsar. |
| El **stock real no cuadra** con las ventas | No es urgente: mirar `Incidencias` y la tabla `Ventas`. |

## 7 · Después de revertir, comprobar siempre

1. La web abre en el dominio y en `www`.
2. Si se vuelve a Vercel: la web vieja se ve y no hay carrito (es lo esperado).
3. Stripe live: ningún pago pendiente de revisar.
4. Airtable: la tabla de pedidos y la base de stock **real** sin filas de prueba.
5. Anotar en `00_ESTADO_PROYECTO.md` qué se revirtió, por qué y qué falta.

## 8 · Lo que este plan NO cubre (conocido)

- No se ha **ensayado** ningún paso en real.
- No se conoce **dónde está alojado el DNS** de `eclipssebrand.es` ni qué registros tiene: se sabrá al hablar con Jacobo (sección 1).
- No hay **copia de seguridad automática** de las bases de Airtable: antes de la Fase B conviene una copia manual de la tabla de pedidos.
- Si la cuenta de Stripe real tiene alguna otra configuración (impuestos, envíos, correos) distinta de la de pruebas, hay que **revisarla antes de la Fase B**.
