# Estado del proyecto · ECLIPSSEINORBIT

**Última actualización:** 2026-10-08
**Tipo:** integración de Stripe para tienda online
**Estado:** activo — **preproducción validada; apto con pendientes para preparar una puesta en producción controlada, todavía no para conmutar el dominio**
**Ingresos confirmados:** no confirmados
**Compromiso o fecha:** ninguno confirmado

> Este archivo manda sobre la memoria, sobre conversaciones anteriores y sobre cualquier suposición. Si algo aquí contradice lo que se recuerda, gana lo que está escrito aquí.
>
> **Ana trabaja este proyecto con varias herramientas (Claude Code y Codex).** Este archivo es el punto de encuentro: debe entenderse sin haber visto ninguna conversación previa. Quien lo lea, lo lee entero antes de tocar nada.

## 📌 CIERRE DEL 2026-10-07 — LEE ESTO PRIMERO

**Este bloque manda sobre «Si retomas aquí, lee esto primero» y sobre «Próxima acción», que son anteriores y están en parte desfasados.**

### ✅ ACTUALIZACIÓN 2026-10-08 — manda sobre la lista de abajo

**Confirmado por Ana, probado por ella en la preproducción (Stripe en modo test):** compras completas, reservas, **email de stock negativo, email de talla agotada**, y el stock real de Airtable **restaurado y correcto** tras borrar las ventas de prueba. Preproducción desplegada con `npm run deploy:preprod` (versión `f318a760-22cb-48b4-a2ba-15ba09906236`). Todo guardado en git hasta `97fe6b9` (el commit de cierre de hoy va encima).

- **Arreglo de hoy (ya en preprod):** tras comprar, la web seguía enseñando el stock anterior en la misma pestaña, porque el cargador del enrutador no se repite al navegar. Ahora se vuelve a pedir al cambiar de página, al volver a la pestaña y 8 s tras `/pedido/confirmado`; caché del servidor de 60 a 15 s. Aprendizaje guardado en el playbook.
- **Emails de Airtable (configuración que vive en Airtable, NO en el repositorio):** un enlace a una vista **no sirve en el móvil** (pide la aplicación), así que el correo lleva los datos dentro: un campo fórmula `Aviso` en `Stock` redacta el mensaje y la automatización inserta **una sola etiqueta**. Hay dos: «Stock negativo» (`Disponible` < 0, acción urgente: reembolsar) y «Agotado» (`Disponible` = 0 y `Unidades iniciales` > 0, informativa). Solo avisa cuando una fila **entra** en la vista.
- **De la lista de abajo, ya hechos:** 1 (email), 2 (stock restaurado). **El 3** (enlace `Ventas.Stock` a un solo registro, formato de fecha, borrar «Table 1») **no se ha confirmado**.
- **Siguen pendientes, por este orden:** (4) probar en un iPhone real; (5) decidir con Jacobo el domicilio del Aviso legal y si se abre la tienda; (6) poner `AIRTABLE_STOCK_TOKEN` y `AIRTABLE_STOCK_BASE_ID` como Secret en el Worker de **producción** (sin ellos no vende); (7) `git push origin auditoria-preproduccion` a la bifurcación de Ana (hay commits sin subir; ningún PR ni `main` de Jacobo sin hablarlo).
- **Todavía sin ejercitar en real:** rechazo del servidor por falta de stock, comportamiento con Airtable caído, y la carrera de dos reservas simultáneas.

### 🚀 2026-10-08 (noche) — SE ABRE LA TIENDA: plan de apertura (nada de esto está hecho todavía)

**Decisiones de Ana:** Jacobo da el sí a **abrir la tienda**. El **DNS de `eclipssebrand.es` lo controla Jacobo** (hará falta su colaboración en la Fase C). **El Worker de producción `eclipsseinorbit` NO existe**: en la cuenta de Cloudflare solo está `eclipsseinorbit-preprod` (comprobado por Ana en el panel).

**Hecho hoy:** política de privacidad corregida, **«Vercel (alojamiento de la web)» → «Cloudflare»** (visto bueno de Ana; no es asesoramiento jurídico, conviene que lo vea su asesor). **Sin confirmar:** que **Hostinger** siga siendo el servidor de n8n tal como dice esa página.

**Fases (cada paso por separado, autorizado y comprobado; ver «Recorrido 2» del playbook):**
- **A · Crear la tienda real en su propia dirección `workers.dev`, sin tocar el dominio.** `npm run deploy:produccion` (pide escribir PRODUCCION). Cargar **7 valores como Secret** en el panel (los pega Ana, nunca por chat): `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live, sale al crear el webhook), `N8N_ORDER_WEBHOOK_URL`, `N8N_ORDER_WEBHOOK_SECRET` (los mismos de preprod), `SITE_URL` (en esta fase, la `workers.dev` de producción; **al cambiar el dominio pasa a `https://www.eclipssebrand.es`**), `AIRTABLE_STOCK_TOKEN`, `AIRTABLE_STOCK_BASE_ID`. ⚠️ **`wrangler.jsonc` no define `SITE_URL` para producción** (solo para preprod): sin ella el pago falla a propósito. Mantener la tienda oculta con `APP_ENV=preprod` (como Secret) hasta abrir, y **quitarla al abrir**.
- **B · Una compra real pequeña** con tarjeta de verdad; comprobar que llega a Airtable (pedidos y stock) y **devolverla**. Antes, resolver el **IVA con el asesor de Jacobo** (los precios llevan IVA incluido; Stripe no lo desglosa).
- **C · Cambiar el dominio** `www.eclipssebrand.es` de Vercel a Cloudflare (**lo hace Jacobo en su DNS**), ajustar `SITE_URL`, **crear el webhook live de Stripe con el dominio real** (su `whsec_…` nuevo va a `STRIPE_WEBHOOK_SECRET`) y quitar `APP_ENV`. **Vercel se conserva funcionando** como reversión.
- **D · Pausar Vercel** pasados unos días de tráfico real. Punto de parada propio. **No** aceptar ningún PR en el repositorio de Jacobo hasta decidir qué proveedor queda vinculado a producción.
- ✅ **Plan de reversión ESCRITO el 2026-10-08: `PLAN_DE_REVERSION.md`** (raíz del proyecto, **borrador sin ensayar**): cómo deshacer cada paso por separado (A1-D), el **botón rojo** (borrar el secreto `AIRTABLE_STOCK_BASE_ID` del Worker de producción corta las ventas al instante, comprobado en preprod), qué hacer si se pierden pedidos con el webhook apagado, reembolsos, y las 7 casillas que hay que cumplir **antes de la Fase C** (captura del DNS actual, bajar el TTL 24 h antes, Jacobo disponible, Vercel intacto…). **Lo debe leer Ana antes de la Fase C.**

⚠️ **La tienda NO está abierta ni «en uso» todavía** (2026-10-08, noche): solo existe preproducción en modo de pruebas de Stripe. **No hay Worker de producción, no hay claves reales cargadas, el dominio sigue en Vercel y no puede cobrarse dinero real.** Lo que se terminó hoy es la preproducción completa y el plan; la Fase A (crear el Worker real) no ha empezado.

✅ **RESUELTO el 2026-10-08 (noche): preproducción usa su propia base de stock.** Ana duplicó la base desde Airtable: **«ECLIPSSE Stock PRUEBAS», ID `appM7ee36WS7Vvk6U`** (no es secreto), con su propio token. **Es la que usa SOLO el Worker `eclipsseinorbit-preprod`.** La **real** es `appUjZ8uk9xpMIrB2` («ECLIPSSE Stock») y **será la que use el Worker de producción**. El conector de Claude solo ve la real, no la de pruebas. Comprobado por Ana: una compra de prueba en preprod funciona contra la copia. Incidente de configuración resuelto: el primer intento falló con 404 (el ID de la base estaba mal copiado) y la web mostraba «No se ha podido procesar el pago» (es el comportamiento acordado: sin Airtable no se vende). ⚠️ **Regla:** el ID que va en Cloudflare es el trozo `app…` entero (17 caracteres) de la URL de la base, **no** el `tbl…` ni el `viw…`.

🧹 **Filas heredadas en `Reservas`:** la copia trajo 2 filas de la original (pedido `ef63153b-…`: gorra-verde ×12 y camiseta-orbit M ×1, creadas el 2026-10-08 a las 16:00 UTC y **caducadas a las 16:35 UTC**). Son **inofensivas** (una reserva caducada deja de contar sola), pero siguen en **las dos bases**: conviene borrarlas.

⚠️ Otros pendientes de apertura: borrar las compras de prueba de la **tabla real de pedidos** de Airtable (antiguas, a nombre de «ana»/«pepe rodriguez») si siguen ahí; los recibos de Stripe y los métodos de pago ya están configurados en el entorno real (2026-09-21).

### ✅ 2026-10-08 (noche) — confirmado por Ana y último cambio de contenido

- **Confirmado por Ana:** probada la web en un **iPhone real, todo bien**; el **Aviso legal ya está bien** (queda como está).
- **Quitada la sección «Cómo comprar»** de «Información» en la tienda (decía «a través de Instagram DM o WhatsApp», desfasado: ya se compra en la web). Queda solo «Historia». Comprobado: no aparece en ninguna página; 138+ pruebas y 18/18 responsive pasan. **Hay que redesplegar con `npm run deploy:preprod`** para verlo en preprod.
- **IVA — hecho comprobado en el código:** la tienda **no usa Stripe Tax** (no hay `automatic_tax` ni tasas en `createCheckoutSession`). Los precios del catálogo son **precios finales con IVA incluido** (`products.ts`: «IVA incluido»; el carrito lo rotula) y Stripe cobra exactamente precio + envío; **no suma IVA aparte** ni lo desglosa en el recibo. Cómo declararlo y si hacen falta facturas con desglose es asunto de Jacobo y su asesor, **sin decidir**.
- **Código postal / coste de envío — mitigado, NO impedido:** el envío se cobra según el CP que escribe el comprador en nuestro checkout; Stripe recoge después la dirección real. Si no coinciden, el pedido llega a Airtable con el texto **«REVISAR — se cobró envío de X pero la entrega es en Y. Puede faltar diferencia de portes»** en la columna «Aviso envío» (o «NO ENVIAR» si es Canarias/Ceuta/Melilla). **Se detecta después de cobrar, no se bloquea antes**: alguien puede pagar menos envío y hay que reclamar la diferencia o devolver a mano. Implementado y probado el 2026-09-21.

### 🛠️ REVISIÓN AUTOMÁTICA DE VENTAS (Opción 2, hecha el 2026-10-08) — DESPLEGADA EN PREPROD, PRIMERA EJECUCIÓN SIN COMPROBAR

✅ **Desplegada por Ana el 2026-10-08 (19:5x) con `npm run deploy:preprod`: versión `98491ab4-ae20-4ce9-aece-ca1502c7bcec`; Cloudflare confirmó `schedule: 7 * * * *`.** Comprobado desde fuera tras desplegar: 4 páginas responden 200 y el stock servido es el correcto. **La automatización «Incidencias de la tienda» figura como `deployed` (encendida)** según el conector de Airtable. ✅ **Primera ejecución confirmada por Ana el 2026-10-08 a las 20:07:10 CEST** (registros de Cloudflare): evento `scheduled` del cron `7 * * * *`, `outcome: ok`, 244 ms de reloj y 13 ms de CPU, y la línea «conciliación: {"saltada":false,"revisadas"…}» (**`saltada:false` = encontró las claves de Airtable**). La tabla `Incidencias` seguía vacía a las 20:09 (comprobado con el conector). **Línea completa confirmada por Ana: `{"saltada":false,"revisadas":0,"pendientes":0,"recuperadas":0,"reembolsadas":0,"yaAnotadas":0,"errores":0}`** → primera revisión real limpia. Sigue sin ejercitarse en real la rama «recuperar una venta perdida» (solo simulada). ~~Falta ver la primera ejecución del horario~~ (ya hecho; queda lo siguiente): (registros del Worker en Cloudflare, línea «conciliación: {…}» tras el minuto 7 de una hora) **y la prueba en real de que no hace nada indebido** (`revisadas`/`pendientes` coherentes y 0 ventas duplicadas). Lo que sigue en el bloque describe el diseño y lo verificado antes de desplegar.

**Para qué:** si se cobra un pedido pero falla anotar su venta en Airtable, la unidad volvería a venderse a los 31 min y **no saltaría ningún aviso** (Airtable nunca supo de esa venta). Esto lo detecta y lo repara.

- **Cómo funciona:** cada hora, al minuto 7 (`triggers.crons` en `wrangler.jsonc`, en producción y en preprod; **Ana autorizó tocar ese archivo, solo para esto; son 9 líneas añadidas, ninguna quitada**), el Worker lista los pagos de Stripe de las últimas 72 h y **anota los que no tengan venta**. Es idempotente. Código: `src/lib/conciliacion.server.ts`, manejador `scheduled` en `src/server.ts`.
- **Para no recrear ventas que alguien borra a propósito** (pruebas, devoluciones): el webhook deja en el PaymentIntent la marca `stockRegistrado=1` al anotar la venta, y la revisión **solo actúa sobre pagos sin esa marca**. Tampoco toca pagos **reembolsados**, ni pagos de hace **menos de 40 min** (el webhook aún puede estar con ellos), ni **anteriores a `DESDE` = 2026-10-09 00:00 UTC** (las pruebas de antes de existir la marca).
- **Avisos:** nueva tabla `Incidencias` en la base de stock (`tbl37PqGY24aJvRwq`: Resumen, Pedido, Tipo, Detalle, Registrada) y una automatización de Airtable «Incidencias de la tienda» (`wfln7LNrutXf1Tr7i`, https://airtable.com/appUjZ8uk9xpMIrB2/wfln7LNrutXf1Tr7i) que manda un email a las mismas dos direcciones que el aviso de stock negativo. **Se creó APAGADA: Ana tiene que encenderla.** Tipos: «Venta no anotada» (la escribe el webhook tras 3 intentos fallidos), «Venta recuperada», «Stock negativo» y «Revisión con errores» (como mucho 1 cada 24 h).
- **El webhook ahora:** reintenta la anotación 3 veces (0,4 s y 1,5 s de espera), deja la marca si lo consigue y, si no, escribe la incidencia. Sigue sin hacer fallar el aviso a Stripe.
- **Verificado:** 156 pruebas (18 nuevas de la revisión, con Stripe y Airtable simulados: recupera, no recrea lo marcado, idempotente, reembolsos, antigüedad, corte, stock negativo, fallos de Airtable y de Stripe, sin configuración), `tsc` limpio, lint a cero errores; el paquete de preprod trae el manejador y el horario (ensayo `--dry-run`). Esquema real de Airtable comprobado con el conector (nombres de campo OK, incl. `Caduca`).
- ⚠️ **NO verificado en real:** que el horario se dispare en Cloudflare, y **la rama «recuperar» contra Stripe y Airtable reales**: solo se puede ejercitar con simulación, porque exige que falle la anotación mientras el cobro funciona. En real se podrá comprobar que la revisión corre sin errores (registros del Worker: líneas «conciliación: {…}» a partir del minuto 7 de cada hora), que respeta la marca y que no duplica.
- **Pasos pendientes de Ana:** (1) encender la automatización «Incidencias de la tienda» en Airtable; (2) `npm run deploy:preprod`; (3) mirar en Cloudflare → Worker `eclipsseinorbit-preprod` → Registros que sale «conciliación» sin errores; (4) antes de producción, el mismo horario ya viaja en `wrangler.jsonc`, pero hacen falta las claves de Airtable en ese Worker.

### 🔹 Por dónde empezar mañana (en este orden)

1. **Email de stock negativo — Ana.** La automatización de Airtable pasa el test en verde pero **el correo no llegó**. Revisar spam; comprobar que «Para» solo tiene colaboradores de la base (el plan gratuito no deja escribir a otros: error «Cannot email non-collaborators»), o invitar a `eclipssebrand@gmail.com` como colaborador de solo lectura; repetir «Prueba de automatización»; y hacer la **prueba real**: añadir a mano en `Ventas` una fila `camiseta-azul` · `M` · 1 enlazada a su fila de `Stock`, y borrarla después. El texto del email es fijo, **sin etiquetas**, con enlace a la vista «Stock negativo».
2. **Restaurar el stock de las compras de prueba — Ana.** Borrar de `Ventas` las filas de las pruebas A y B; `Reservas` debe quedar vacía; comprobar que `Stock` cuadra con `01_DOCUMENTOS/airtable-stock-inicial.csv`. **Si no, la camiseta azul M real queda en 0 y no se vende.**
3. **Arreglos a mano en Airtable** (el conector no pudo): enlace `Ventas.Stock` limitado a un solo registro; formato 24 h y Europe/Madrid en `Fecha`/`Creada`; borrar la tabla vacía «Table 1».
4. **Probar en un iPhone real** (Safari) la preproducción `https://eclipsseinorbit-preprod.eclipssebrand.workers.dev`: la QA de hoy fue con Chromium, Firefox y WebKit de Playwright, que no sustituye a un iPhone.
5. **Decidir con Jacobo** el domicilio del Aviso legal (hoy sale su casa; la LSSI exige uno) y **si se abre la tienda**.
6. **Antes de producción:** poner `AIRTABLE_STOCK_TOKEN` y `AIRTABLE_STOCK_BASE_ID` como **Secret** también en el Worker de producción. **Sin ellos la tienda no vende** (decisión de Ana: sin Airtable no se vende).
7. **Subir lo que falta a GitHub** (`git push origin auditoria-preproduccion`, a la bifurcación de Ana): en GitHub está hasta `94c8cf6`; faltan `3be08ca`, `22acd6f` y el commit de este cierre. **Ningún PR ni integración en `main` del repositorio de Jacobo sin hablarlo con Ana.**

### 🔹 Dónde está cada cosa hoy

- **Preproducción desplegada por Ana** el 2026-10-07: versión `7b0093f3`, código hasta `3be08ca`. El commit `22acd6f` (despliegue seguro) no cambia la web. Se despliega **solo** con `npm run deploy:preprod` (ver «ARREGLADO» más abajo). **`npm run deploy` ya no despliega.**
- **Stock real:** base de Airtable `appUjZ8uk9xpMIrB2` (tablas `Stock`, `Ventas`, `Reservas`), en la cuenta de Ana, **separada de la de pedidos** a propósito (el token no puede ver datos de clientes). Reserva de 31 min, venta idempotente por pedido, caché de 60 s para pintar la web. Detalle en la sección «STOCK» de más abajo.
- **Pruebas de compra en preprod (Stripe test) hechas por Ana:** reserva (A) y compra con venta anotada (B) → **funcionan**. **No ejercitado nunca:** el rechazo del servidor por falta de stock (el carrito del navegador filtra antes), el comportamiento con Airtable caído, y el email.
- **2026-10-08 · fallo corregido en código, PENDIENTE DE DESPLEGAR:** tras comprar, la azul S seguía saliendo disponible en la misma pestaña. Comprobado contra la preproducción: **el servidor ya servía `camiseta-azul|S = 0` (la venta SÍ se anotó)**, pero **el cargador del enrutador no se repite al navegar dentro de la misma pestaña** (0 peticiones medidas), así que la web enseñaba el stock de antes de pagar hasta recargar. Arreglo: `__root.tsx` vuelve a pedir el stock al cambiar de página, al volver a la pestaña y 8 s después de entrar en `/pedido/confirmado` (el aviso de Stripe tarda unos segundos en anotar la venta); y la caché del servidor baja de 60 a 15 s. Probado en Chromium, Firefox y WebKit (1 petición por navegación, sin errores); 138 pruebas pasan. ✅ **Desplegado por Ana el 2026-10-08 con `npm run deploy:preprod` (versión `f318a760-22cb-48b4-a2ba-15ba09906236`; el script comprobó el destino antes de subir).** Comprobado desde fuera: la preproducción ya hace 1 petición de stock al navegar. **Falta la prueba de compra con la web abierta sin recargar.** Al desplegar, el stock servido coincidía con el del CSV (azul S=1, M=1; orbit M=1; gorra=12): se supone que Ana ya había borrado las ventas de prueba, **sin confirmar**. Ojo: **la reserva solo se crea al pulsar «pagar» en `/checkout`** (es cuando se crea la sesión de Stripe), no al añadir al carrito.

### 🔹 Qué tocó hoy y qué no — verificado contra el último commit de ayer (`33a09c3`), no de memoria

- **Nada borrado. Ninguna prueba previa modificada:** las 110 pruebas de antes siguen pasando sin cambios; hay 28 nuevas en 3 archivos nuevos (138 en total). `tsc` limpio, lint sin errores en lo que va a git, 18/18 responsive. El **repositorio de la oficina está limpio**: no se tocó ningún otro cliente ni proyecto.
- **El motor de pago SÍ se tocó, solo de forma aditiva:** `checkout.server.ts` (+65 −40; ignorando sangría, **solo 2 líneas realmente reescritas**: la llamada que crea la sesión de Stripe y la clave de idempotencia, que ahora es `checkout:{orderRef}:{expiración}`), `api.stripe-webhook.ts` (+27 −0), `checkout-schema.ts` (+1), `cart.tsx` (+34 −9). Añade: reservar antes de crear la sesión, `expires_at` en Stripe, liberar la reserva si Stripe falla, anotar la venta **después** de entregar a n8n.
- **Intactos (sin un solo cambio):** envío por zonas (`shipping.ts`), deduplicación del webhook, estado del pedido, cliente de Stripe, limitador de peticiones, seguridad de logs, catálogo de productos, `wrangler.jsonc`, `vite.config.ts`.
- **Cambió por encargo de Jacobo (todo el diseño):** paleta gris, cabecera en isla, animaciones, nombre único «ECLIPSSE™ universe», redes en el pie, textos legales (datos del titular solo en el Aviso legal), imágenes a WebP, dos fotos de la camiseta gris reducidas. **Criterio mío a revisar:** el nombre histórico «DROP 007 — ECLIPSSEBRAND × ANDEX» pasó a «ECLIPSSE™ universe × ANDEX» al aplicar «el nombre pasa a ser solo ECLIPSSE™ universe, para todo».
- ⚠️ **La validación del 27-09 sigue valiendo para todo el motor salvo lo listado arriba**, que se probó después con las compras A y B en preprod.

### 🔹 Riesgos abiertos ⚠️

- Si anotar la venta en Airtable falla, **el pedido se guarda pero el stock no se descuenta**; queda en el log del Worker «ANOTAR A MANO». No hay reintento automático.
- `wrangler deploy` escrito a mano sube lo que haya en `dist/`. Usar siempre `npm run deploy:preprod`.
- La caché de 60 s puede enseñar «disponible» una unidad recién reservada; el pago la rechaza.
- Edge no se probó aparte; no hay prueba con lector de pantalla ni en iPhone/Android reales; faltan `<main>` y «saltar al contenido».
- Ana dice que las fotos de producto con el símbolo antiguo y el texto del cartel de IN ORBIT están resueltos con Jacobo: **no verificado en el código**.
- El botón «Instagram» del banner de la tienda sigue apuntando a una publicación de la cuenta antigua `@eclipssebrand`.

---

## ✅ Validación real en Cloudflare (preprod) — 2026-09-27

Primera vez que se prueba el código de verdad desplegado en Cloudflare, no solo en preview
local. Rama `auditoria-preproduccion`, hasta el commit `6b08bd1`.

**Worker de preproducción creado**: `eclipsseinorbit-preprod`
(`https://eclipsseinorbit-preprod.eclipssebrand.workers.dev`), como entorno `env.preprod`
dentro del mismo `wrangler.jsonc` (no un archivo de configuración aparte). Worker
independiente del de producción: nombre propio, rate limiter propio (`namespace_id 1002` vs
`1001` de producción), variables propias (`SITE_URL`, `APP_ENV=preprod`), y una cabecera
`X-Robots-Tag: noindex, nofollow, noarchive` que solo se activa en preprod (producción no la
recibe, comprobado por comparación directa).

**Secretos configurados en preprod** (nombres, nunca valores): `STRIPE_SECRET_KEY` (clave de
**test**), `STRIPE_WEBHOOK_SECRET`, `N8N_ORDER_WEBHOOK_URL`, `N8N_ORDER_WEBHOOK_SECRET`.
Decisión expresa de Ana: en vez de duplicar el workflow de n8n y crear una tabla de Airtable
aislada, se usó **el workflow activo (`qmS3k2Pp3wxyKUqZ`) y la tabla real de Airtable**,
aceptando crear una fila de prueba claramente identificada y borrarla después.

**Compra completa de prueba, de punta a punta:** Checkout Session en modo test, pagada con
tarjeta de prueba. Webhook entregado con `200` en 4703 ms (`releer sesión 190 · n8n 4327 ·
marcar 186`). n8n confirmó y creó **una única fila** en Airtable — Ana la verificó con los
datos correctos (importe, prendas, envío, estado, `orderRef`) y la borró. `/pedido/confirmado`
y `/api/pedido-estado` respondieron correctamente.

**Endpoints probados contra el Worker real:** `GET` al webhook → `405`; `POST` sin firma →
`400` sin llamar a n8n; `POST` con firma inválida → `400`, log sanitizado; `pedido-estado`
con sesión inexistente → `200` controlado, sin stack ni datos sensibles.

**Flujo de cancelación:** una sesión de test creada, sin pagar, vuelta por `/pedido/cancelado`
→ correcto, y **confirmado con logs en tiempo real que no llega ningún pedido a n8n/Airtable**
por una sesión abandonada.

**Rate limiting, comportamiento real (matiza lo que decía este archivo y `SEGURIDAD.md` sobre
la preview local):** el binding de Cloudflare bloquea de verdad en el Worker desplegado, pero
**no en un corte exacto de 20/21** — en tráfico real es aproximado (primer bloqueo entre la
petición ~15 y ~22 según el tráfico reciente, alternando después). Los cupos de checkout y de
`pedido-estado` se confirmaron **independientes** entre sí. Nunca se observó un `503`.

**Cabeceras de seguridad:** las seis (incluida CSP `Report-Only`) confirmadas en el Worker
real, no solo en preview local.

**QA visual y funcional final (Codex + Playwright)**, contra la versión desplegada
`fb3aeff4-f06c-4fe5-a844-1bd911852975`: **18/18** comprobaciones responsive en 375×812,
390×844 y 768×1024 (portada, navegación, cookies, producto, carrito, checkout, páginas
legales) — cero errores de consola durante el recorrido cubierto (esto no demuestra que la
CSP pueda pasar a modo bloqueante; sigue en `Report-Only`), sin desbordamientos, recortes ni
solapamientos, una sesión `cs_test_` creada y cancelada sin pago. Esta QA **encontró y
corrigió un desbordamiento horizontal real en móvil** (commit `9ee1fbc`, detalle en
`CALIDAD.md` B-13): espaciado del contador de portada y falta de `overflow-hidden` en dos
secciones con animación de escala (`eclipssebrand.tsx`, `personaliza.tsx`). De paso se
instaló Playwright como dependencia de desarrollo (commit `7e32ef5`) y se dejó configurado un
servidor MCP de Playwright para Claude Code (commit `6b08bd1`), **pendiente de aprobación**:
esta QA la ejecutó Codex con Playwright directamente, no ese MCP.

**Comprobación manual final de Ana**, en navegador real (web y móvil): banner de cookies en
sesión privada, ficha de producto, carrito, checkout, llegada a Stripe en modo test y
cancelación — todo correcto, sin completar ningún pago.

**Pruebas automáticas, cifra actual: 110/110, en 8 archivos** (`npm test`), tras añadir esta
sesión las pruebas de `robots-header.server` (preprod/producción). Las cifras de «98/98» que
aparecen más abajo en este documento son la fotografía correcta del cierre del 2026-09-26; no
se han reescrito para no falsear esa fecha.

⚠️ **Lo que esto NO cierra:** nada de esto es producción ni claves live. Sigue sin probarse
con tráfico real de compradores, sin activar la CSP en modo bloqueante, y M4, M8, M10 y B2
siguen exactamente con el mismo riesgo aceptado que antes. Tampoco se ha probado en
Firefox/Safari/Edge (solo Chromium, vía Playwright), ni accesibilidad, ni rendimiento.

## Cierre de sesión — 2026-09-27

**Punto exacto para retomar:** rama `auditoria-preproduccion`. El último commit de
validación antes de este cierre documental fue `7270fcd` y el árbol estaba limpio. La
cantidad actual de commits locales se consulta con
`git rev-list --count origin/auditoria-preproduccion..HEAD`. La
preproducción está desplegada y validada en Cloudflare; producción, `main`, el dominio y
Vercel siguen sin cambios.

**Conclusión de entrega:** el código y el flujo de prueba quedan **aptos para el alcance
comprobado en preproducción**, con los riesgos residuales documentados y aceptados. Esto no
equivale a estar listo para pulsar un único botón de producción: faltan la preparación y la
conmutación live descritas más abajo.

**Próxima acción única al retomar:** subir `auditoria-preproduccion` a su rama remota para
guardar y revisar los commits locales, **sin integrar todavía en `main`**. Después se preparará,
en una sesión separada y con autorización expresa, la checklist live: política de privacidad
Cloudflare, Worker y secretos de producción, webhook Stripe live, recibos live, control del
autodeploy de Vercel, dominio/DNS y plan de reversión.

⚠️ **No ejecutar mañana como una sola maniobra:** merge a `main`, secretos live, webhook
live, cambio de dominio y retirada de Vercel. Cada paso debe comprobarse antes de pasar al
siguiente; la web actual de producción se conserva como reversión hasta validar la nueva.

---

## Cierre de la auditoría local — 2026-09-26

✅ Auditoría local terminada. Pasan `typecheck`, **98/98 pruebas**, lint (0 errores y 7
avisos no bloqueantes), build de Cloudflare y `npm audit` tanto completo como solo de
producción, con **0 vulnerabilidades**. Gitleaks revisó todo el contenido textual añadido en
el historial: 0 hallazgos; los cinco commits que no suma su contador son cuatro cambios
exclusivamente binarios de imágenes y una eliminación de `package-lock.json`.

✅ El paquete exacto que prepararía `wrangler deploy --dry-run` se inspeccionó sin desplegar:
no contiene `.env`, `.dev.vars` ni valores de secretos. El `.dev.vars` que el plugin de
Cloudflare genera dentro de `dist/server` se confirmó como artefacto exclusivo de la preview
local. La carpeta `dist` se borró al terminar y Git quedó limpio.

✅ M8 está mitigado en el workflow real de n8n mediante upsert por `orderRef` y rechazo 400
si falta esa referencia; las pruebas secuenciales con datos ficticios pasaron y las filas de
prueba se borraron. Ana acepta el riesgo residual de dos peticiones verdaderamente
simultáneas. No se implementa D1 ni Durable Objects.

⛔ No hubo push ni despliegue real. La auditoría local cerrada no autoriza producción. Falta
una preview real en Cloudflare con configuración de prueba, el recorrido completo de compra
y webhook, y los controles de producción documentados más abajo.

## Revisión independiente del 2026-09-23

Codex revisó el trabajo del 2026-09-22 y corrigió cuatro puntos locales, cada uno
verificado antes de documentarlo, más un quinto commit para alinear los informes y este
estado oficial:

- `ddf2102`: `SITE_URL` es obligatoria en producción; ya no se confía en el Host.
- `68ee82c`: idempotencia estable por intento de checkout, validada en servidor.
- `3072a63`: dominio canónico centralizado e imágenes sociales con URL absoluta.
- `ea57e99`: lint sin errores y añadido a la revisión automática.

Verificación local actual: `npm run typecheck` pasa, **66 pruebas** pasan, `npm run
lint` termina con 0 errores y 7 avisos no bloqueantes, `npm run build` pasa y
`npm audit` devuelve 0 vulnerabilidades. Con la actualización de esta decisión habrá seis
commits locales de la revisión del 2026-09-23 y 24: **no se han subido ni desplegado**.

✅ **Decisión de alojamiento del 2026-09-24:** Ana descarta continuar en Vercel y elige
**Cloudflare** como destino. Ana lo ha denominado «Cloudflare Pages». La forma técnica exacta
se resolvió y se implementó el mismo día: **Cloudflare Workers**, `@cloudflare/vite-plugin` y
`wrangler` (no Pages con exportación estática, que no conservaría server functions ni webhook).
Ver la sección siguiente.

✅ **Hook de pre-commit reparado el 2026-09-24.** El `Permission denied` de Gitleaks desde Git
Bash era Acceso controlado a carpetas de Windows bloqueando `git.exe` (mismo tipo de bloqueo
que ya había afectado a `node.exe`). Ana autorizó `C:\Program Files\Git\mingw64\bin\git.exe`
en Windows Defender y el hook volvió a funcionar: todos los commits de esta sesión pasaron
Gitleaks automáticamente, sin comprobación manual aparte.

## Migración a Cloudflare Workers — implementada y verificada en local, 2026-09-24

Hecho por Claude Code, siguiendo la autorización de Ana para preparar y verificar la
migración localmente, sin login, sin desplegar y sin tocar secretos reales. Tres commits en
`auditoria-preproduccion`:

- `7c6cfe6` — `vite.config.ts` reescrito sin el wrapper `@lovable.dev/vite-tanstack-config`
  (ya no se usa Lovable.dev, confirmado por Ana), con `@cloudflare/vite-plugin` +
  `tanstackStart()` + `react()` en el orden oficial. `wrangler.jsonc` nuevo, apuntando a
  `src/server.ts` (ya tenía la firma `fetch(request, env, ctx)`, compatible sin tocarlo).
- `1985355` — rate limiting (SEGURIDAD A1) con el binding oficial de Cloudflare, ver detalle
  abajo.
- `09b4156` — cabeceras de seguridad (SEGURIDAD M1), ver detalle abajo.

⚠️ **Bloqueo de entorno encontrado y resuelto en el camino:** `workerd.exe`
(`node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe`) tampoco estaba autorizado en
Acceso controlado a carpetas — mismo síntoma que `node.exe` y luego `git.exe`. Ana lo autorizó
y la preview local arrancó sin más.

**Verificado con `npm run preview` (runtime real de Cloudflare, workerd, en local, sin
desplegar):**
- Portada, ficha de producto (`/eclipssebrand`) y `/checkout` cargan (SSR completo, sin
  errores).
- El SDK de Stripe funciona **sin adaptación**: `stripe.balance.retrieve()` en modo test
  respondió con `livemode:false`. No hizo falta `createFetchHttpClient()`: el SDK detecta
  Node vía `process` (que `nodejs_compat` expone) y usa su cliente HTTP basado en el módulo
  `https`, que `nodejs_compat` también soporta.
- El webhook (`/api/stripe-webhook`) sigue verificando la firma sobre el body crudo
  (`request.text()`, sin parsear antes) — no se tocó, y sigue igual bajo Workers.
- Rate limiting (ver abajo): 20 peticiones permitidas, la 21ª bloqueada con 429, reseteo a
  los ~60 s, webhook fuera del límite.
- Cabeceras de seguridad presentes en páginas SSR, en el webhook y en un asset estático.
- `npm run typecheck`, **70 pruebas** (`npm test`, +4 nuevas de rate limiting), `npm run
  lint` (0 errores, 7 avisos no bloqueantes, mismo baseline de siempre) y `npm run build`
  pasan. `npm audit` sigue en 0 vulnerabilidades.

⚠️ **Lo que NO se ha podido verificar en local:** crear una Checkout Session real (el
servidor exige `SITE_URL` en modo producción — M3 — y esta variable no está puesta para la
preview local; es correcto que falle así, no es un bug). Tampoco se ha probado el webhook con
firma real de Stripe (`stripe listen`) bajo este runtime nuevo, ni una compra de punta a
punta. Falta también decidir el script `deploy` exacto (`wrangler deploy`) y probarlo — hoy
solo está escrito, nunca ejecutado.

**Rate limiting (SEGURIDAD A1):** binding oficial `Rate Limiting` de Cloudflare Workers, 20
peticiones cada 60 s por `CF-Connecting-IP` (única cabecera de IP que Cloudflare garantiza en
el borde; no se registra en ningún log), exclusivo de `createCheckoutSession`. Falla cerrado:
si el binding no responde, 503 en vez de crear una sesión de Stripe sin límite.

⚠️ **Hallazgo técnico real, no una suposición:** awaitear este binding **dentro** del
`.handler()` de una `createServerFn` rompe la construcción de la respuesta (500 genérico en
vez de servir el resultado). Se comprobó con tres variantes distintas, incluidas las dos que
pidió Ana como alternativa "oficial" (`createMiddleware({type: "function"})` de TanStack,
tanto devolviendo un `Response` propio —rechazado por el compilador— como pasando el
resultado por `sendContext` y devolviendo el 429 desde el handler —mismo 500 en runtime—). La
solución que sí funciona: el límite vive en un middleware de **petición** en `src/start.ts`
(la misma capa que ya usan el CSRF y el manejo de errores), no en el de función. Documentado
en el comentario junto a `rateLimitMiddleware`.

⚠️ **Limitación conocida y documentada, no corregida:** el filtro del middleware es
`handlerType === "serverFn"`, que hoy equivale exactamente a "solo `createCheckoutSession`"
porque es la única server function del proyecto (confirmado por grep). Comprobado leyendo el
código fuente del framework: ese `handlerType` se fija por el prefijo de la URL antes de
resolver qué función concreta es, así que **cualquier server function futura compartiría el
mismo cupo de IP**. Si se añade una segunda, revisar el filtro.

**Cabeceras de seguridad (SEGURIDAD M1):** middleware de petición en `src/start.ts` añade
X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy y HSTS (sin
`preload`) a toda respuesta del Worker. CSP en `Content-Security-Policy-Report-Only`, no
bloqueante: TanStack Start inyecta scripts inline y no se ha probado en un despliegue real
qué necesita `script-src`. No hay colector de reportes configurado — hay que mirar la consola
del navegador a mano en cada QA hasta que se decida activarla en modo bloqueante o montar uno.
Los archivos estáticos de `public/` no pasan por el Worker; llevan sus cabeceras aparte en
`public/_headers` (Cloudflare las sirve directamente desde el binding de assets).

## Segunda pasada de correcciones — 2026-09-24

Continuación en la misma sesión, cinco commits más en `auditoria-preproduccion`:

- `a49139c` — **CALIDAD B-8 resuelto.** El webhook ya no vuelca códigos postales en logs de
  servidor. `compararEnvioCobradoConEntrega()` (`shipping.ts`) separa el mensaje completo
  (con CPs, para Airtable) de un código corto sin datos personales (para el log). El payload
  que llega a n8n/Airtable no cambió.
- `ca76609` — **`@lovable.dev/vite-tanstack-config` y `nitro` eliminados**, confirmado sin
  referencias por grep. 80 paquetes transitivos menos, 0 vulnerabilidades.
- `781313a` — **CALIDAD B-3 resuelto.** `src/components/ui/chart.tsx` y `recharts` borrados
  (sin consumidores, confirmado por grep): el proyecto queda sin ningún
  `dangerouslySetInnerHTML`.
- `0e982ad` — **SEGURIDAD M9 resuelto.** `/pedido/confirmado` ya no afirma el pago por llegar
  a la URL: consulta `/api/pedido-estado`, una ruta de servidor normal (no una
  `createServerFn`, a propósito: no comparte cupo con el rate limiter del checkout) que
  relee la sesión en Stripe y exige los mismos cuatro criterios que el webhook (marca de
  origen, mode, moneda, formato de orderRef). Solo tres estados visibles, sin datos del
  cliente. No sustituye al webhook.
- Este commit de documentación.

⚠️ **`node_modules` se rompió y se reparó en el camino.** Un `npm ci` chocó con un archivo
bloqueado (patrón EPERM ya conocido de este equipo) y quedó a medio borrar (45 paquetes en
vez de cientos). La causa real: dos procesos de una preview anterior (`npm run preview` /
`vite preview`) habían quedado vivos y tenían bloqueado el directorio de `@cloudflare/vite-
plugin`. Se cerraron esos dos procesos y `npm install` reparó `node_modules` sin tocar
código. Repetible si vuelve a pasar: comprobar procesos `node.exe`/`workerd.exe` colgados de
una preview anterior antes de asumir que es un problema de dependencias.

✅ **90 pruebas** (`npm test`), typecheck, lint (0 errores, mismos 7 avisos de siempre),
build y `npm audit` (0 vulnerabilidades) — todo verificado tras cada commit de esta pasada.

Después de esta pasada, un commit más guardó la propuesta de M8 completa aquí mismo (antes
solo estaba en el chat): `dde064b`.

## Tercera pasada de correcciones — 2026-09-26

Revisión de Ana sobre el cierre anterior: encontró dos huecos de seguridad reales y una
propuesta de M8 que afirmaba más de lo demostrado. Tres commits más en
`auditoria-preproduccion`:

- `210f078` — **`/api/pedido-estado` tenía rate limiting propio, sin límite.** Un
  `session_id` con formato válido pero inexistente disparaba una llamada real a Stripe por
  petición, sin ningún tope. Ahora reutiliza el mismo binding oficial que el checkout, con
  clave separada (`pedido-estado:<ip>`), así que los dos cupos son independientes. Falla
  cerrado (503) si el binding no responde, 429 al superar el límite, `Cache-Control:
  no-store` en toda respuesta. Verificado en preview: 20 permitidas y 429 en la 21ª: y
  comprobado en las dos direcciones que el cupo del checkout y el de pedido-estado no se
  pisan entre sí para la misma IP. 4 pruebas nuevas.
- `27e6944` — **Logs de servidor volcaban objetos completos de error.** Comprobado en vivo:
  un fallo real de Stripe volcaba `raw`, cabeceras completas (incluida una URL de Stripe) y
  el mensaje sin filtrar — contradice `CLAUDE.md` §6. `log-safety.server.ts` añade
  `errorSeguro()`: de un error de Stripe extrae solo tipo/código/estadoHttp/requestId; de
  un `Error` normal, nombre y mensaje. Aplicado en el webhook (firma inválida, releer
  sesión, entrega a n8n), en pedido-estado, en el rate limiter, en el marcado de eventos
  entregados y en los tres manejadores globales de errores (`start.ts`, `server.ts`). No se
  tocó `__root.tsx`: ese log corre en el navegador del comprador, no en el servidor. 4
  pruebas nuevas. ⚠️ El mensaje de ese commit dice «8 pruebas nuevas»; son 4 — error de
  redacción, no de código.
- Este commit de documentación — corrige la propuesta de M8 (ver más abajo) y estas cifras.

⚠️ **Corrección importante sobre M8:** la propuesta anterior (arriba, sección «Propuesta
técnica para M8») decía que el upsert de Airtable era una operación demostradamente atómica
frente a concurrencia. **Eso era una afirmación no demostrada.** Ya está corregido en esa
misma sección: sigue habiendo dos opciones (A, sencilla, con riesgo residual de concurrencia
asumido explícitamente; B, cierre técnico fuerte con D1/Durable Object + idempotencia en
n8n), y **M8 sigue pendiente de decisión, no resuelto.** (Actualización del mismo día: Ana
eligió la Opción A pocas horas después y se aplicó en n8n; ver «Qué se aplicó de verdad —
2026-09-26» más abajo, dentro de la sección de la propuesta.)

✅ **98 pruebas** (`npm test`), typecheck, lint (0 errores, mismos 7 avisos de siempre),
build de Cloudflare, preview local (incluida la independencia de los dos rate limiters) y
`npm audit` (0 vulnerabilidades) — verificado tras cada commit. `gitleaks` explícito sobre
todos los commits locales: sin hallazgos.

🔢 **No fijes aquí una cifra de commits como si fuera permanente: cada commit nuevo la deja
obsoleta.** Consulta siempre en el momento:
- `git log --oneline auditoria-preproduccion ^origin/auditoria-preproduccion | wc -l` →
  commits locales sin subir.
- `git rev-list --left-right --count main...auditoria-preproduccion` → commits por detrás /
  por delante de `main`.

Referencia histórica, no vigente: inmediatamente antes del commit `5b38cb5` eran **21
commits locales sin subir** y **95 por delante de `main`, 0 por detrás**.

⚠️ **«Nada desplegado» se refiere solo a la web** (este repositorio: no hay `wrangler
deploy` hecho, no hay login de Cloudflare, no hay dominio real sirviendo este código).
**No es cierto para n8n:** el cambio de M8 (`fieldsToMergeOn` a `orderRef`, más el nodo de
rechazo sin referencia) se aplicó el 2026-09-26 directamente sobre el workflow real de n8n,
fuera de este repositorio y sin control de versiones aquí. **Puede estar ya operativo** si
ese workflow está activo — no depende de que la web se despliegue.

## Cuarta pasada — 2026-09-26: M8 aplicado (Opción A)

Ana probó `orderRef` con datos falsos, guiada paso a paso (no tiene acceso técnico directo
a n8n cómodo; hizo los clics ella misma en su instancia). Resultado: los 4 casos de prueba
(nuevo, mismo pedido, pedido distinto, sin referencia) se comportan como debían. Detalle
completo, con la tabla de pruebas, en «Qué se aplicó de verdad — 2026-09-26» dentro de la
sección de la propuesta, justo debajo. Sin cambios de código en este repositorio: el cambio
vive en el workflow de n8n `qmS3k2Pp3wxyKUqZ`.

## Propuesta técnica para M8 (deduplicación) — presentada el 2026-09-24, corregida el 2026-09-26, Opción A aplicada el 2026-09-26

🔹 **Ana pidió esta recomendación antes de tocar nada.** El mismo día 2026-09-26, más tarde,
eligió la Opción A y autorizó aplicar exclusivamente el cambio de `fieldsToMergeOn` en n8n.
Se aplicó, se probó con datos falsos y se documenta en detalle en «Qué se aplicó de verdad —
2026-09-26», al final de esta sección. **M8 está mitigado, no es un cierre atómico
garantizado** — la Opción B sigue sin implementarse y el riesgo de concurrencia real queda
aceptado expresamente por Ana.

⚠️ **Corrección del 2026-09-26 a la versión anterior de esta propuesta:** la primera
versión presentaba el upsert de Airtable como si fuera una operación atómica frente a
concurrencia. **Eso no está demostrado.** Que sea una sola petición HTTP no prueba que
Airtable aplique una restricción de unicidad o una exclusión mutua real cuando llegan dos
upserts simultáneos con el mismo valor de `fieldsToMergeOn` — solo se ha comprobado (2026-09-21,
más arriba) que colapsa **reintentos secuenciales** del mismo `event.id`, uno detrás de
otro. No se ha probado ni documentado qué pasa con dos peticiones concurrentes.

**El problema exacto:** la barrera final es hoy el upsert de Airtable con
`fieldsToMergeOn: ["eventId"]`. Si Stripe llega a emitir dos `Event` distintos (dos
`event.id` diferentes) para la misma sesión y el mismo tipo, ambos pasan las barreras
actuales y pueden crear **dos filas** en Airtable para el mismo pedido.

**Dos opciones, no una — para que decida Ana:**

### Opción A · Sencilla y proporcional al volumen bajo

Cambiar la clave del upsert de Airtable, de `eventId` a `orderRef` (el UUID
`checkoutAttemptId`, ya validado en servidor, ya usado como `client_reference_id` de Stripe
y como clave de idempotencia `checkout:${orderRef}`).

- **Qué consigue de verdad:** evita duplicados cuando los eventos llegan **secuenciales**
  (uno después de otro, que es el caso observado y probado hasta ahora). ⚠️ Corrección: el
  webhook descarta `checkout.session.completed` con `payment_status: "unpaid"` **antes** de
  llamar a n8n (`return ... status: 200` sin seguir) — ese evento nunca llega a Airtable ni
  al upsert. En un pago asíncrono, el único evento que de verdad escribe es
  `async_payment_succeeded` (o `_failed`). No hay dos eventos «buenos» compitiendo por la
  misma fila en ese caso: hay uno solo. El caso que sí cubre el upsert por `orderRef` es
  otro: reintentos secuenciales del **mismo tipo** de evento con `event.id` distintos.
- **Qué NO demuestra ni garantiza:** que dos upserts con el mismo `orderRef` lleguen a
  Airtable **al mismo tiempo** (dos entregas casi simultáneas del webhook) no vayan a crear
  dos filas. Es una mitigación práctica, razonable para «unidades limitadas, pocos
  pedidos», pero **no es un cierre atómico demostrado** — es un riesgo residual que hay que
  aceptar y documentar como tal, no borrar de la lista de pendientes.
- **Recursos:** cero recursos nuevos de Cloudflare. Un cambio de configuración en el nodo
  «Crear pedido» del workflow `qmS3k2Pp3wxyKUqZ`, campo `fieldsToMergeOn`, de `["eventId"]`
  a `["orderRef"]`. El acceso de esta oficina a n8n es de solo lectura: tiene que aplicarlo
  Ana o Jacobo, o autorizarlo expresamente al especialista de Entrega y Automatizaciones.
  Coste adicional: ninguno.
- **Pruebas:** simular dos `eventId` distintos con el mismo `orderRef` llegando **uno
  después de otro** al nodo «Crear pedido» (se puede forzar desde el propio n8n) y
  comprobar que Airtable sigue teniendo una sola fila. Esto prueba el caso secuencial, no
  el concurrente.

### Opción B · Cierre técnico fuerte

Coordinación persistente (Cloudflare D1 o un Durable Object) que reserve el `orderRef`
**antes** de llamar a n8n, combinada con que n8n/Airtable también validen idempotencia por
`orderRef` (no solo por `eventId`) para cubrir el caso de que la reserva se haga pero el
marcado final falle.

- **Por qué hace falta lo segundo y no basta con D1 solo:** ni siquiera D1 garantiza por sí
  solo «exactly once» entre dos sistemas externos (este Worker y Airtable/n8n). D1 puede
  garantizar que **este Worker** solo intenta la operación una vez por `orderRef`, pero no
  puede garantizar que esa única llamada a n8n llegue, se procese y se confirme sin fallos
  de red por el camino. Hace falta combinar una **reserva/lease persistente** (D1 o DO)
  con un **consumidor idempotente** en el otro extremo (n8n/Airtable ya validando por
  `orderRef`) para que un reintento tras un fallo a mitad de camino no duplique nada.
- **Con D1:** tabla `processed_orders`, restricción `UNIQUE` en `order_ref`. Antes de
  llamar a n8n, `INSERT` (reserva); si falla por conflicto, ya se está procesando o ya se
  procesó, se corta ahí. Requiere `wrangler d1 create`, un binding nuevo en
  `wrangler.jsonc` y una migración — recurso nuevo de Cloudflare, necesita que Ana lo cree
  y autorice.
- **Con Durable Objects:** un objeto por `orderRef` que serializa cualquier concurrencia de
  verdad (dos peticiones al mismo objeto se ejecutan una detrás de otra, nunca en
  paralelo). Es la garantía más fuerte que existe en Cloudflare para esto, pero
  sobredimensionada para el volumen actual («unidades limitadas, pocos pedidos»). Añade
  complejidad de clases, migraciones y depuración.
- **Qué pasa si se reserva pero n8n falla:** con D1, la fila de `processed_orders` quedaría
  en un estado «reservado, no confirmado». Hace falta decidir un timeout o un reintento
  explícito para no dejar pedidos huérfanos en ese estado — esto es trabajo de diseño
  adicional que esta propuesta no cierra, solo señala.
- **Qué pasa si n8n confirma pero falla el marcado final:** igual que hoy
  (`markForwarded` nunca lanza; se registra y se sigue, porque el pedido ya llegó). Con
  idempotencia por `orderRef` en el lado de n8n/Airtable, un reintento posterior no
  duplica nada aunque la reserva de D1 no se haya cerrado bien.
- **Recursos, coste:** un recurso nuevo de Cloudflare (D1, más barato y más simple; o un
  Durable Object, más caro y más complejo), un binding nuevo, una migración, y el mismo
  cambio en n8n/Airtable que la Opción A (idempotencia por `orderRef`) como red de
  seguridad del otro lado.
- **Pruebas:** además de las de la Opción A, una prueba específica de **concurrencia real**
  — dos peticiones al mismo `orderRef` disparadas a la vez (no una detrás de otra) —, que
  es justo la prueba que la Opción A no puede pasar con garantías.

**Alternativas descartadas en ambos casos:**
- **Cloudflare KV**: eventualmente consistente, no ofrece ninguna garantía atómica ni de
  exclusión mutua.
- **Seguir solo con memoria**: ya demostrado insuficiente, es el propio hallazgo M8.

**Recuperación/reconciliación (aplica a las dos opciones):** antes de aplicar cualquier
cambio, conviene una comprobación puntual en Airtable — agrupar por `orderRef` y confirmar
que no hay ya filas duplicadas por el mismo pedido bajo el esquema actual.

**Contrato que se mantiene intacto en ambas opciones:** Stripe sigue sin recibir 200 hasta
que n8n confirma. Ninguna de las dos opciones lo toca.

### Qué se aplicó de verdad — 2026-09-26

Ana autorizó exclusivamente la Opción A, con instrucciones concretas: verificar antes de
tocar nada, cambiar solo `fieldsToMergeOn`, no tocar nada más, probar con datos falsos y
documentar aquí el resultado sin datos personales.

**Verificación previa.** Un envío de prueba con `orderRef` a través de la herramienta de
pruebas (fuera de este repositorio) confirmó que el campo llega y se guarda bien en la
columna «Referencia del pedido», antes de tocar nada en n8n.

**Cambio aplicado.** En el nodo «Crear pedido» del workflow `qmS3k2Pp3wxyKUqZ`, «Columnas
para coincidir en» pasó de `eventId` a **`Referencia del pedido`** (la columna mapeada a
`orderRef`). `eventId` se conserva en la fila como dato informativo, ya no como clave del
upsert.

**Comprobación añadida, no prevista en la propuesta original.** Al probar un pedido sin
`orderRef`, el upsert de Airtable creaba una fila sin referencia en vez de fallar. Ana pidió
cerrarlo «limpio y profesional»: se insertó un nodo **«Si»** entre «Webhook» y «Crear
pedido» que comprueba que `{{ $('Webhook').item.json.body.orderRef }}` no esté vacío. Si
falla, un nodo nuevo **«Responder al webhook»** devuelve `400` con
`{"error": "Falta la referencia del pedido"}` sin tocar Airtable. La rama verdadera sigue
exactamente igual que antes: → Crear pedido → Responder 200.

**Pruebas ejecutadas**, con datos de prueba en el Airtable real (`orderRef`
`11111111-…`/`22222222-…`, sin datos de clientes reales), mediante la herramienta
`prueba-orderref.ps1`/`.bat`:

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Pedido nuevo | Crea 1 fila | ✅ Crea 1 fila |
| Mismo `orderRef`, `eventId` distinto (simula un segundo Event de Stripe) | Actualiza la misma fila, no duplica | ✅ Actualiza la misma fila |
| `orderRef` distinto | Crea una fila aparte | ✅ Crea una fila aparte |
| Sin `orderRef` | Rechazado, ninguna fila creada | ✅ n8n responde 400, ninguna fila creada |

Los 4 casos se probaron **uno detrás de otro (secuenciales), no simultáneos**. No se ha
probado ni se garantiza el caso de concurrencia real (dos peticiones al mismo `orderRef`
llegando exactamente a la vez). Ana aceptó expresamente ese riesgo residual y decidió no
implementar la Opción B.

**Orden de respuesta a Stripe.** Sin cambios: el nodo «Responder 200» sigue colgando
únicamente de la salida de «Crear pedido», así que n8n solo responde éxito después de que
Airtable confirme el upsert. Verificado mirando las conexiones reales del workflow, no solo
leído de memoria.

**Filas de prueba.** Las creadas durante estas pruebas se borraron de Airtable a mano tras
verificar cada resultado; no deben quedar filas con `orderRef` de prueba (`1111…`/`2222…`).

**Qué no cambió.** Ningún archivo de este repositorio, ningún despliegue, ninguna otra
configuración de n8n o Airtable. El único cambio de datos fue `fieldsToMergeOn` en el nodo
«Crear pedido», más los dos nodos nuevos («Si» y «Responder al webhook») para el caso sin
referencia. Sin commit de código: el cambio vive en n8n, fuera de este repositorio.

⛔ **Sigue bloqueada la producción** hasta resolver o aceptar expresamente:

1. ✅ Migración técnica verificada a Cloudflare — hecho el 2026-09-24, SSR, server functions y
   body crudo del webhook conservados. Falta la prueba con tráfico real (no local).
2. ✅ Rate limiting de Cloudflare solo para crear sesiones de Checkout — hecho el 2026-09-24,
   y extendido el 2026-09-26 a `/api/pedido-estado` con un cupo propio e independiente.
3. ✅ Cabeceras de seguridad y CSP (`Report-Only`) en el nuevo alojamiento — hecho el
   2026-09-24.
4. ✅ **Deduplicación por sesión y tipo de evento, no solo por `event.id`** (M8) —
   **mitigada el 2026-09-26**, Opción A aplicada en n8n y probada con datos falsos (ver «Qué
   se aplicó de verdad» arriba). Riesgo residual de concurrencia real aceptado
   expresamente por Ana; la Opción B (D1/Durable Object) no se implementó.
5. Alta y prueba del webhook live, secretos de Cloudflare y controles operativos.
6. Sustituir Vercel por Cloudflare en la política de privacidad y el resto de documentación
   antes de publicar — **no hecho todavía a propósito**: hay que verificar qué datos, región
   y condiciones corresponden realmente a Cloudflare antes de escribirlo, no sustituir el
   nombre sin más.
7. Decisiones visibles: fecha/comportamiento del contador, 4 o 5 camisetas y si la
   espalda debe ser la imagen principal.
8. Preview de Cloudflare real (no local) y una compra de prueba completa de punta a punta,
   incluido el webhook con firma real de Stripe.
9. Decidir y probar el comando de despliegue (`wrangler deploy`) — escrito, no ejecutado.

## Qué pasó el 2026-09-22 (sesión larga, resumen para retomar)

✅ **Hecho y verificado:**
- **Dominio confirmado** y el bloqueo principal levantado. Ver abajo.
- **20 hallazgos tratados** de `CALIDAD.md` y `SEGURIDAD.md`; varios quedaron parciales o pendientes.
- **Dependencias: de 10 vulnerabilidades (6 altas) a 0.** Los tres `overrides`
  las causaban, no las tapaban. `npm run lint` vuelve a funcionar, y de minutos
  pasa a 5 segundos.
- **Tipos: de 6 errores a 0.** Nuevo `npm run typecheck`.
- **66 pruebas** (`npm test`) del catálogo, cálculo de envío y esquema de checkout. Probadas de
  verdad: poniendo `priceCents: 24` a mano, los tipos y el build pasan y **la
  prueba falla**. Es el fallo que más caro salía.
- **Revisión automática en GitHub Actions**, en verde: tipos, tests, build y
  vulnerabilidades en cada push.
- **Todo subido** a `origin/auditoria-preproduccion`. Antes existía solo en el
  portátil de Ana.
- **Stripe configurado por Ana**: recibos automáticos y política de devoluciones.
- **n8n ajustado por Ana**: deja de guardar datos personales de cada pedido.

⛔ **Quedan código, configuración externa, pruebas y decisiones de contenido.** Ver la revisión del 2026-09-23 y «Próxima acción».

## 🎨 Rediseño de identidad pedido por Jacobo — EN CURSO desde el 2026-10-05

Jacobo entregó un encargo largo (14 puntos) para **adaptar la web a una identidad de marca nueva**. El texto completo lo tiene Ana en la conversación del 2026-10-04.

⚠️ **No es un retoque: es rehacer la capa visual entera.** Toca los ~55 componentes, la tipografía, la paleta, todos los logos y favicons, el lenguaje de formas (radios), transparencias y las animaciones de todo el sitio. El propio punto 13 pide «que parezca que toda la web fue diseñada desde el principio bajo una única dirección artística».

✅ **No toca la maquinaria**: pagos, envío por zonas, webhook, deduplicación, n8n y Airtable se quedan igual. La validación del motor sigue valiendo.
❌ **Sí invalida toda la QA visual**: los 18/18 responsive del 2026-09-27, los contrastes (paleta nueva = accesibilidad nueva), el rendimiento en móvil (animaciones nuevas) y posibles incumplimientos de la CSP por fuentes y recursos nuevos.

### ⚠️ Aviso importante para quien retome esto

El encargo está redactado **como un prompt para una herramienta generativa de webs**, y este proyecto nació en Lovable. **Pegarlo en una herramienta que regenere código apuntando al repositorio puede reescribir componentes y romper el checkout sin que se note** — por delante hay dos semanas de auditoría, 110 pruebas y la validación en Cloudflare. La forma correcta es cambiar los **tokens de diseño** (colores, tipografía, radios) y propagarlos tocando los componentes con cuidado, repitiendo después la QA.

### Qué entregó y qué falta — revisado el 2026-10-04

Los archivos están en **`02_ARCHIVOS/`** (versionados en el repo; no son sensibles).

| Entregado | Estado |
|---|---|
| `BANNER_ACTUALIZADO.jpeg` (2560×1340) | ✅ **Usable.** Es la foto nueva del hero: calle en B/N con dos prendas ECLIPSSE y el símbolo encima |
| `LOGO_FONDO_NEGRO.jpeg` (2560²) | ✅ Símbolo en **blanco puro sobre negro puro**. 🔹 De aquí se puede derivar una **versión transparente de forma automática y exacta** (la luminancia hace de canal alfa), sin retoque manual |
| `LOGO_PRINCIPAL.jpeg` (2560²) | ⚠️ Símbolo + «ECLIPSSE™ universe», pero en **gris sobre gris claro**: el recorte a transparente no sale limpio |
| `LOGO_SOLO_SIMBOLO.jpeg`, `SOLO_TEXTO.jpeg` | ⚠️ Igual, fondo claro |

### ✅ DESBLOQUEADO el 2026-10-05 por respuesta de Jacobo

Dijo literalmente: **«No hace falta la tipografía exacta y lo de los colores q lo saque de la imagen»**.

**1 · Paleta — RESUELTA, medida, no estimada.** Se muestrearon los cinco JPEG píxel a píxel con Playwright. Resultado:

```
saturación media: 0.000   en los CINCO archivos
```

**La marca es estrictamente monocroma: no hay ni una pizca de color en ningún archivo.** Valores reales:

| Archivo | Colores |
|---|---|
| `LOGO_FONDO_NEGRO` | `#000000` fondo · `#F8F8F8` símbolo |
| `LOGO_PRINCIPAL`, `LOGO_SOLO_SIMBOLO`, `SOLO_TEXTO` | `#E8E8E8` fondo · `#B8B8B8` logo |
| `BANNER_ACTUALIZADO` | negros de `#000000` a `#484848` |

⚠️ **Aviso de accesibilidad: el logo gris sobre gris claro da un contraste de ~1.9:1**, muy por debajo del mínimo exigible de 4.5:1. **Sobre fondo claro hay que usar el logo en negro, no ese gris.** El de fondo negro sí cumple de sobra.

**2 · Tipografía — libre elección.** Al no exigir la exacta, **desaparece el problema de la licencia**: se elegirá una fuente con licencia web abierta.

⚠️ **Consecuencia que Jacobo debe asumir y conviene recordarle:** la web llevará una tipografía **distinta** a la de sus prendas, su Instagram y su logo. En una marca de ropa la coherencia visual es parte del producto; no es grave si la elegida es de la misma familia estética, pero **no será idéntica**.

🔹 **Dirección propuesta, sin aplicar todavía:** una grotesca ancha y de peso alto, en la línea del «ECLIPSSE» del logo. **Antes de tocar los 55 componentes hay que enseñarle a Ana 2-3 opciones aplicadas sobre la propia web para que elijan.** Probar una fuente es media hora; descubrir que no gusta después de propagarla es rehacerlo todo.

**3 · 🔹 Sigue siendo deseable el logo en vectorial** (`.svg` o `.ai`) para favicons y tamaños pequeños. No bloquea: de `LOGO_FONDO_NEGRO.jpeg` se puede derivar una versión transparente exacta.

### ✅ Avance del 2026-10-05 — EN CURSO (rama `auditoria-preproduccion`)

**Cambio de rumbo importante:** Jacobo dijo que **le gusta la tipografía actual** y que se mantenga. La web ya usa **League Spartan** (títulos) e **Inter** (texto), ambas de Google Fonts, con licencia de uso web. **El punto 3 del encargo desaparece entero**, y con él el riesgo de licencias.

**Estado punto por punto del encargo de Jacobo:**

| Punto | Estado |
|---|---|
| 1 · Logos y favicon | ✅ **Cambiados** (`9edc329`). ⚠️ **Corrección:** antes se anotó aquí que «ya estaban», **y era falso**: se comparó el contenido sin mirar la forma. El símbolo de la web era otro (lunas más finas, punta roma, corte con tramo recto); el nuevo son medias lunas limpias con corte circular y puntas afiladas. Fue Jacobo quien lo señaló |
| 2 · Colores | ✅ **Ya eran monocromos** (`#fff`/`#000` y grises). Tokens documentados en `styles.css` |
| 3 · Tipografía | ✅ **Se mantiene la actual** |
| 5 · Formas | ✅ Escala de radios suave en `styles.css`; ~100 elementos la adoptan de golpe. Redondeados además: selector de cantidad (carrito y ficha), fotos de producto, miniaturas, imagen de Personaliza |
| 6 · Transparencias | ✅ La cabecera **ya era** translúcida con desenfoque. Aviso de cookies convertido en tarjeta flotante translúcida |
| 7 · Animaciones | 🟡 **Parcial.** Hecho: las animaciones de `framer-motion` ahora **respetan «reducir movimiento»** (`MotionConfig` en la raíz; antes ignoraban esa opción). **Pendiente** el pulido de microinteracciones, hover y transiciones |
| 9 · Foto del hero | ✅ **Cambiada** (`9edc329`) por `BANNER_ACTUALIZADO.jpeg`. ⚠️ **Corrección:** antes se anotó «no tocar, ya es esa foto, en mejor resolución», **y era un error**: es la misma escena pero la foto antigua llevaba **integrado el símbolo viejo**, y la nueva el símbolo nuevo. Se perdió resolución a cambio (**2560×1340 frente a 3750×1963**); sigue sobrando para pantallas de escritorio normales. Si se ve blanda en pantallas grandes o retina, pedir a Jacobo el original sin comprimir |
| 10 · Quitar cuenta atrás y foto de IN ORBIT | ✅ Ambas retiradas (`14d5014`, `af07313`) |

**📌 BALANCE AL CIERRE DEL 2026-10-05 — qué falta de verdad del encargo de Jacobo**

- **Hecho y comprobado en pantalla:** símbolo gris nuevo (logo, favicon, foto de portada, imagen al compartir), toda la interfaz en gris/blanco/negro (medido en tienda, checkout, páginas legales y Personaliza: ningún color), curvas en toda la web **incluido el checkout** (campo de código postal, notas, aviso de zona y resumen del pedido, corregido el mismo día porque una revisión previa había dado por bueno el checkout sin llegar a verlo: redirige si el carrito está vacío), cuenta atrás y cartel de IN ORBIT fuera, pantalla de entrada intacta, sin desbordes en móvil a 390 px.
- **A medias:** transparencias (cabecera ya la tenía; aviso de cookies nuevo) y animaciones (solo arreglado que respeten «reducir movimiento»).
- **SIN HACER — punto 7, pulido de animaciones:** hover, microinteracciones y transiciones entre páginas. Es lo único sustancial que queda.
- **SIN MEDIR:** rendimiento en móvil. **SIN PROBAR:** Firefox, Safari, Edge. La QA completa de preproducción **hay que repetirla** antes de publicar.
- **Las fotos de producto y la galería siguen llevando el símbolo antiguo dentro** (p. ej. la camiseta Orbit). No lo cambia el logo; habría que sustituir las fotos. Avisar a Jacobo.
- **Decisión sin tomar:** ¿abrir la tienda ya o esperar a pulir las animaciones? La tienda lleva lista desde el 2026-09-27.

**⚠️ Pendientes y decisiones abiertas que salen de esto:**

1. ✅ **Resuelto el 2026-10-05 (decisión de Jacobo vía Ana): la vista previa al compartir el enlace** (`og:image` y `twitter:image`) **ahora es la foto de portada** (`hero_drop.jpeg`), coherente con la identidad monocroma. Su proporción (2560×1340 ≈ 1,91:1) es casi exactamente la que piden las redes. `drop008-banner.png` **ya no lo usa nada**; sigue en `public/images/` (pesa mucho, 3375×4219) y se puede borrar cuando se quiera, el historial de git lo conserva. ⚠️ **Las redes cachean la vista previa**: WhatsApp e Instagram pueden seguir enseñando el cartel antiguo en enlaces ya compartidos hasta que caduque su caché.
2. **El texto del cartel** («Summer has its own gravity… En verano no vas en línea recta: orbitas…») **solo existía dentro de la imagen**: al quitarla deja de estar en la web. Si Jacobo lo quiere, se puede poner como texto real con la tipografía de la web.
3. ✅ **Resuelto el 2026-10-05: el botón de WhatsApp pasa a gris** (era el único color que quedaba). Fondo `#EBEBEB` (el gris claro de la identidad) e icono `#6B6B6B`, **no** el gris del logo `#BCBCBC`: blanco o gris claro sobre ese fondo daba ~1,9:1 y un botón que hay que encontrar a la primera no puede perderse; así sale ~4,5:1. Comprobado en pantalla sobre blanco y negro. ⚠️ **Se pierde el reconocimiento instantáneo del verde de WhatsApp**: a cambio de coherencia de marca. Si se nota que escriben menos, es lo primero a revisar. El botón **solo existe en la página Personaliza**.
4. **Quedan por pulir** microinteracciones y estados hover (punto 7). Las animaciones de entrada ya existen y son suaves.
5. **QA completa pendiente de repetir** sobre la versión final: accesibilidad, Firefox/Safari/Edge y rendimiento en móvil. Lo hecho hasta ahora se ha comprobado con `scripts/revision-visual.mjs`.

**🧬 Cómo se derivaron el logo y el favicon, por si hay que repetirlo** (script temporal, no guardado, basado en Playwright + canvas): se partió de `02_ARCHIVOS/LOGO_FONDO_NEGRO.jpeg`, no de `LOGO_SOLO_SIMBOLO.jpeg`, porque **tienen la misma silueta (coincidencia 99,94 %)** pero el primero es blanco puro sobre negro puro y el segundo gris sobre gris claro, donde el ruido del JPEG ensucia los bordes. La luminancia hace de canal alfa con un umbral suave (24–232), y el símbolo sale **gris sobre transparente**. `logo.png` conserva el lienzo de 1920×960 y el **mismo ancho y centro** del símbolo anterior para no mover la maquetación. `favicon.png`: 512×512, símbolo al 88 % del ancho.

⚠️ **El logo es GRIS, no negro, y es a propósito.** La primera vez se puso en negro por iniciativa propia para que se leyera mejor sobre blanco, y Jacobo no lo quería: su identidad es el gris claro sobre gris más claro de `LOGO_SOLO_SIMBOLO`, tal como se ve en el avatar de su Instagram (captura del 2026-10-05). Colores **medidos sobre el archivo** (mediana de los píxeles dentro y fuera de la silueta): **símbolo `#BCBCBC`, fondo `#EBEBEB`**. `favicon.png` lleva ese mismo gris sobre ese mismo fondo. **No volver a «mejorarlo» a negro.**

🔹 **Consecuencia asumida por decisión de Jacobo:** el símbolo gris sobre el blanco de la web tiene un contraste de ~1,9:1. A 16-24 px (favicon y cabecera) se ve mucho más suave que el negro. Los logotipos suelen estar exentos de los requisitos de contraste, pero si algún día se quiere más presencia, la opción es una versión oscura **para uso en la web**, no cambiar la identidad. Todo pasa por un único componente `Logo` que lee `/images/logo.png`.

**🔧 Herramienta nueva: `scripts/revision-visual.mjs`.** Con `npm run dev` arrancado, `node scripts/revision-visual.mjs` revisa en escritorio y móvil que nada se sale de la pantalla, que no hay errores de consola y qué cajas siguen con esquinas rectas; deja capturas en `tmp-capturas/` (ignorada por git junto a cualquier `tmp-*`). **No sustituye la QA de preproducción**: es el chequeo de ida y vuelta mientras se diseña.

**⚠️ Lección sobre mi propio trabajo, para quien retome esto:** dos veces el 2026-10-05 se afirmó que algo «ya estaba hecho» (logos, hero) **comparando nombres y tamaños de archivo en vez del contenido**. Resultó falso las dos veces. **Antes de decir que un recurso gráfico ya coincide, hay que mirarlo, o medirlo.** La comparación visual lado a lado (símbolo en la foto vieja / foto nueva / símbolo entregado) lo resolvió en un solo paso.

**⚠️ Lección técnica del día:** al usar fondos translúcidos, **el contraste cambia según lo que haya debajo**. El texto gris del aviso de cookies pasaba de legible sobre blanco a ~2,7:1 sobre una sección negra (mínimo exigible 4,5:1). Se corrigió con texto casi negro. **Todo componente translúcido nuevo debe comprobarse sobre fondo claro Y oscuro.**

**🔎 Dato sin resolver:** en una captura de Jacobo aparecía un rectángulo gris borroso junto a «INICIO» en la cuadrícula de camisetas. No se ha vuelto a ver al revisarlo con Playwright, que no muestra errores; probablemente fue una imagen cargando.

### 🆕 Cambios del 2026-10-07 — SIN COMMIT (rama `auditoria-preproduccion`)

Jacobo pidió (vía Ana) cambiar la paleta, la cabecera y el aspecto general. Hecho y **comprobado en pantalla** (Chromium, escritorio y móvil 390 px; `tsc` limpio, 110 pruebas pasan, `revision-visual.mjs` sin desbordes ni errores de consola):

- **Paleta nueva (sustituye a «blanco y negro»):** fondo de toda la web `#EBEBEB`, superficies `#BCBCBC` (tokens `--background` y `--surface` en `styles.css`). Las secciones que eran negras (Sobre nosotros, Personaliza, pie) pasan a `#BCBCBC` con texto negro. Negro y blanco solo en texto, botones y detalles. ⚠️ `#BCBCBC` sobre `#EBEBEB` ≈ 1,9:1: no usar nunca como color de texto.
- **Cabecera en isla** centrada, translúcida (cristal con desenfoque), tipo Becay. **Banda «POR Y PARA JÓVENES»** más fina, texto pequeño gris y más lenta.
- **Línea fina en las fotos de producto:** era el fondo casi blanco de las fotos contra el de la página. Arreglado con `mix-blend-multiply` y sin fondo en el contenedor. ⚠️ Oscurece ~8 % cualquier foto con color (p. ej. la del modelo en la galería); si molesta, recortar las fotos a PNG transparente.
- **Animaciones (punto 7):** transición suave entre páginas (View Transitions, `defaultViewTransition` en `router.tsx`), pulsación de botones, zoom suave de foto en hover, todo apagado con «reducir movimiento». **Falta probar la transición entre páginas a mano en navegador real** (solo comprobado que no da errores).
- **Páginas legales:** nombre, NIF y domicilio quedan **solo en el Aviso legal** (LSSI art. 10 los exige; no se pueden quitar). Privacidad y Términos remiten a él. ⚠️ **Decisión de Jacobo pendiente:** el domicilio es su casa; si no quiere mostrarlo, necesita domicilio de actividad (oficina virtual/coworking) declarado a Hacienda. Consultar a su gestor.
- ✅ **Repaso con la paleta nueva (2026-10-07), solo Chromium escritorio:** checkout con carrito lleno, pedido cancelado/confirmado, Aviso legal, Privacidad, Cookies, Términos, Devoluciones, Personaliza, tienda y ficha. Contraste de texto medido con script (`tmp-contraste.mjs`, no versionado): **peor caso 4,55:1** (banda del eslogan, decorativa), ningún texto por debajo de 4,5:1 (3:1 en texto grande). Límites: no mide texto sobre fotos ni el cristal translúcido de la cabecera y de las cookies sobre lo que tengan detrás.
- 🐞 **Error previo corregido, no era de este rediseño:** en `src/lib/cart.tsx`, `clear()` guardaba siempre un array nuevo y `/pedido/confirmado` caía en un bucle («Maximum update depth exceeded») cuando llegabas con el carrito aún lleno, que es lo normal tras pagar. Ahora `clear()` no cambia nada si ya está vacío. Comprobado: sin errores de consola, `tsc` limpio, 110 pruebas pasan. ⚠️ **No probado con un pago real de Stripe en test**, solo cargando la página con un carrito sembrado a mano: conviene repetir una compra de prueba completa antes de publicar.
- La isla de la cabecera sube a `bg-white/75` porque sobre las secciones grises el logo gris desaparecía.
- **Segunda tanda del 2026-10-07 (pedido de Jacobo vía Ana), SIN COMMIT:**
  - Página de entrada: botones transparentes, sin relleno blanco.
  - Tienda: sin franja entre la banda del eslogan y el hero; la isla flota sobre la foto (`SiteHeader overlay`, altura 0 en el flujo).
  - Pie de página compacto con botones de Instagram, WhatsApp y TikTok (`SocialIcons.tsx`); «Escríbenos» queda solo con WhatsApp y email.
  - Páginas legales mucho más pequeñas (texto 12 px, título 20-24 px, columna estrecha).
  - Enlaces nuevos: Instagram `instagram.com/eclipsseuniverse/`, TikTok `www.tiktok.com/@eclipssebrand`.
  - **Nombre comercial único: «ECLIPSSE™ universe»**, tal cual escrito. Sustituidos ECLIPSSEBRAND, ECLIPSSE™ UNIVERSE y ECLIPSSE™ FACTORY en textos, títulos SEO y datos estructurados. **No se tocan** el email `eclipssebrand@gmail.com`, el dominio `eclipssebrand.es`, la ruta `/eclipssebrand` ni el usuario de TikTok, que son identificadores reales. ⚠️ El botón «Instagram» del banner de la tienda enlaza a una publicación de la cuenta antigua `@eclipssebrand`; no se ha cambiado porque la URL de una publicación no se puede trasladar a otra cuenta.
  - **📦 STOCK — fase 1 hecha (2026-10-07), sin commit.** Datos de Jacobo: gorra verde 12 · camiseta azul 1 S + 1 M · camiseta blanca Orbit 1 M · **Sun y Gris agotadas** · «la de España» **no existe todavía** (cuando se añada: 1 M + 1 L). Vive en `src/data/stock.ts` (**fuente temporal, a mano, NO se descuenta al vender**). Lo que ya hace: etiqueta translúcida «Agotada» en la foto de la tienda y «Agotada» en lugar del precio; en la ficha, tallas sin stock tachadas y desactivadas, «Última unidad / Quedan N», botón «Agotada»; el carrito descarta lo agotado y limita cantidades al stock; **el servidor rechaza con `SIN_STOCK`** lo que no hay (`checkout.server.ts`). Probado: tsc limpio, 113 pruebas, capturas y carrito normalizado (Sun fuera, azul 5→1, gorra 20→12). ⚠️ **El rechazo del servidor no se ha ejercitado de extremo a extremo** (el carrito del navegador ya filtra antes); solo está tipado y revisado.
  - **📦 STOCK — fase 2, DISEÑO PROPUESTO 2026-10-07 (pendiente de que Ana cree el Airtable; nada construido):** base de Airtable **nueva y separada** de la de pedidos (el token solo ve stock, nunca datos de clientes) con dos tablas: `Stock` (producto, talla, unidades iniciales) y `Movimientos` (pedido, producto, talla, cantidad, fecha). **Stock disponible = unidades iniciales − suma de movimientos.** Libro de solo añadir: evita el «leer, restar y escribir», que en Airtable no es atómico. El Worker lee (caché ~60 s para mostrar, **sin caché** al crear el pago) y **escribe un movimiento por línea de pedido** tras confirmarse el pago, **idempotente por `orderRef`+producto+talla**; no usa n8n (Claude no puede editarlo) y reutiliza los `line_items` con `productId`/`size` que el webhook ya relee de Stripe. Si el movimiento deja el stock en negativo (dos pagos de la misma unidad): se registra y se avisa, y **Ana reembolsa a mano al segundo**. Secretos nuevos en Cloudflare: `AIRTABLE_STOCK_TOKEN` y `AIRTABLE_STOCK_BASE_ID`. Decisiones abiertas: qué hace el pago si Airtable no responde (propuesta: **no vender** hasta que responda; la web seguirá mostrando el último stock conocido) y por qué canal se avisa de un stock negativo.
  - **🛠️ STOCK FASE 2 — CÓDIGO ESCRITO el 2026-10-07 (sin commit al escribir esto), SIN PROBAR contra Airtable real.** Base creada por Ana en su app de Claude: **Base ID `appUjZ8uk9xpMIrB2`** (no es secreto), con tablas `Stock`, `Ventas`, `Reservas`. Pendiente a mano en Airtable (el conector no pudo): enlace `Ventas.Stock` limitado a un solo registro; formato 24 h/Europe/Madrid de `Fecha`/`Creada`; borrar la tabla vacía «Table 1»; vista «Stock negativo» (`Disponible` < 0) + automatización de email. **El rollup `Vendidas` y la fórmula `Disponible` existen pero nunca se han probado con datos reales.** Los nombres exactos de los campos de `Reservas` (sobre todo `Caduca`) **no se han verificado**: Ana pegó el resultado de la herramienta sin el listado completo; si la primera reserva real falla, mirar eso primero.
    - **Archivos:** `src/lib/stock-airtable.server.ts` (núcleo: leer, reservar, liberar, registrar venta), `src/lib/stock.server.ts` (server fn `getStockPublico`), `src/lib/stock-context.tsx` (reparte el stock a la web), `src/lib/stock-airtable.server.test.ts` (19 pruebas con un Airtable simulado). `src/data/stock.ts` pasa a ser **solo respaldo** (desarrollo, y lo que se muestra si Airtable falla al pintar la web).
    - **Flujo del pago:** `createCheckoutSession` reserva en directo (sin caché) → crea la sesión de Stripe con `expires_at` = caducidad de la reserva y clave de idempotencia `checkout:{orderRef}:{expiraEn}` → si Stripe falla, libera la reserva. La caducidad se redondea a tramos de 5 min y dura ≥31 min (Stripe exige ≥30): así un reintento repite exactamente los mismos parámetros. Si hay dos reservas simultáneas, gana la creada antes (segunda comprobación).
    - **Webhook:** tras entregar a n8n y marcar el evento, `registrarVenta` (idempotente por pedido+producto+talla) y libera la reserva; si el pago falló, solo libera. **Si anotar la venta falla, NO hace fallar el webhook** (el pedido ya está en n8n y un reintento lo duplicaría): queda `⚠️ NO se pudo anotar la venta… ANOTAR A MANO` en el log del Worker. Límite conocido: no hay reintento automático de esa anotación.
    - **Sin configuración:** en desarrollo usa el stock estático; **en producción (NODE_ENV=production, incluida la preproducción de Cloudflare) sin `AIRTABLE_STOCK_TOKEN` y `AIRTABLE_STOCK_BASE_ID` NO se puede comprar** (`SERVICIO_NO_DISPONIBLE`). Es lo acordado, pero significa que **desplegar esto sin poner antes esos dos secretos corta las ventas**.
    - **Pendiente de Ana:** crear el token de Airtable (`airtable.com/create/tokens`, `data.records:read` + `data.records:write`, solo la base «ECLIPSSE Stock») y ponerlo como secreto en Cloudflare junto con el Base ID; y la prueba de punta a punta en preproducción (comprar la última azul M, ver la fila en Ventas, intentar comprarla otra vez, reenviar el aviso, apagar Airtable).
  - **✅ ARREGLADO (2026-10-07): ya no hace falta acordarse de nada.** Comandos: **`npm run deploy:preprod`** (compila con `CLOUDFLARE_ENV=preprod`, **comprueba que el paquete apunta a `eclipsseinorbit-preprod` y se niega a subir si no**, y despliega); `npm run deploy:preprod -- --ensayo` (todo igual pero **sin subir**); `npm run deploy:produccion` (pide escribir `PRODUCCION` y exige terminal interactiva). **`npm run deploy` a secas ya NO despliega**: solo enseña el uso. El destino se fija pisando cualquier `CLOUDFLARE_ENV` del entorno. Código en `scripts/desplegar.mjs` y `scripts/despliegue-comprobar.mjs`; 6 pruebas en `src/lib/despliegue-comprobar.test.ts` (incluida la que reproduce el error: paquete de producción → destino preprod = rechazado). Probado con ensayos de preprod y de producción (sin subir). ⚠️ **`wrangler deploy` suelto sigue desplegando lo que haya en `dist/`**: usar siempre los comandos de arriba. Texto original de la trampa, por contexto:
  - **🚨 (contexto) trampa descubierta el 2026-10-07.** Con `@cloudflare/vite-plugin` **el entorno se elige al COMPILAR, no al desplegar**. Compilar con `npx vite build` a secas genera un paquete que apunta al Worker de **PRODUCCIÓN** (`"name": "eclipsseinorbit"`, sin las variables de preprod, limitador 1001); `wrangler deploy` después lo sube ahí. **`npm run deploy` también despliega producción.** Forma correcta (PowerShell): `$env:CLOUDFLARE_ENV="preprod"; npx vite build; npx wrangler deploy`. **Comprobar SIEMPRE antes de subir:** `node -e "console.log(JSON.parse(require('fs').readFileSync('dist/server/wrangler.json','utf8')).name)"` debe imprimir `eclipsseinorbit-preprod`, y `npx wrangler deploy --dry-run` debe listar `env.APP_ENV ("preprod")`. Se comprobó así el 2026-10-07 (compilado con `CLOUDFLARE_ENV=preprod`; dry-run correcto). ✅ **Desplegado por Ana a mano el 2026-10-07** en `eclipsseinorbit-preprod` (versión `7b0093f3-663b-4397-8350-d2b9b9dfdc31`, código hasta el commit `3be08ca`); el permiso automático de Claude Code había bloqueado el despliegue hecho por Claude. Secretos `AIRTABLE_STOCK_TOKEN` y `AIRTABLE_STOCK_BASE_ID` puestos como **Secret** en el panel. Comprobado con GET: 5 páginas responden 200 con `noindex`, y **el HTML entrega `fiable:true` con el stock correcto** (azul M=1, azul L=0, gorra=12, Sun y Gris=0) → la **lectura** de Airtable funciona desde Cloudflare. ✅ **Prueba de punta a punta hecha por Ana el 2026-10-07 en preproducción: la reserva (prueba A) y la compra con anotación de la venta (prueba B) funcionan** («estupendamente», según Ana; no se pegaron capturas de las tablas). ⚠️ **El email de stock negativo falla:** Airtable devuelve «Cannot email non-collaborators on the current billing plan» porque en el plan gratuito solo se puede escribir a colaboradores de la base; el destinatario `eclipssebrand@gmail.com` no lo es. Solución: invitar ese correo como colaborador de solo lectura o quitarlo. **Recordatorio:** borrar de `Ventas` las filas de prueba para restaurar el stock real.
  - **✅ Decisiones de Ana (2026-10-07):** (1) si Airtable no responde, **no se puede comprar** (falla cerrado); la web muestra el último stock conocido. (2) El aviso de stock negativo va **por email**, y se resuelve **dentro de Airtable** (automatización «cuando un registro entra en una vista» sobre `Stock` con `Disponible` < 0 → enviar email a Ana), **sin servicio de email nuevo ni cambios en n8n**. Para eso `Ventas` lleva un campo de enlace a `Stock` y `Stock` un rollup `Vendidas` y una fórmula `Disponible = Unidades iniciales − Vendidas`; el Worker crea cada venta enlazándola al registro de `Stock` que ya ha leído. CSV de carga inicial: `01_DOCUMENTOS/airtable-stock-inicial.csv` (17 filas).
  - **Propuesta pendiente de respuesta de Ana: reserva por tiempo** para cerrar el hueco de dos pagos de la misma unidad. Tabla extra `Reservas` (pedido, producto, talla, cantidad, caduca). Al crear el pago se anota una reserva de 30 min (el mínimo de Stripe); la disponibilidad = `Disponible` − reservas **no caducadas** de otros pedidos; al confirmarse el pago se crea la `Venta` y se borra la reserva. Las caducadas **dejan de contar solas**, sin evento nuevo de Stripe ni tareas de limpieza. Coste: una tabla más y algo más de código; contra: un pago abandonado retiene la última unidad hasta 30 min.
  - **(Texto anterior de la fase 2, superado por el diseño de arriba salvo el punto 4):**
    1. Una tabla `Stock` en Airtable (producto, talla, unidades) y un **token de Airtable de solo lectura+escritura sobre esa tabla**, que Ana mete como secreto en Cloudflare (nunca en el chat ni en el repo).
    2. El Worker lee el stock (caché corta, ~60 s) para mostrarlo, y **sin caché** al crear el pago.
    3. **Descontar al confirmarse el pago** en el webhook, de forma idempotente por `orderRef`/`eventId` (el reintento de Stripe no debe descontar dos veces). Hay que decidir si lo hace el Worker directamente o una rama nueva en n8n; Claude no puede editar n8n.
    4. ⚠️ **Hueco que no cierra el plan:** entre que alguien abre el pago y lo paga pasan minutos. Con 1 unidad por talla, dos personas pueden pagar la misma. Mitigación: avisar a Ana/Jacobo cuando el descuento deje stock negativo y **reembolsar a mano** al segundo; o reservar la unidad al abrir el pago (caduca a los 30 min, más trabajo). Decisión pendiente.
    5. ⚠️ Mientras no exista la fase 2, **la tienda no debería abrirse con stock de 1 unidad por talla** sin descontar a mano tras cada venta.
- **Tercera tanda del 2026-10-07 (pedido de Jacobo vía Ana), commiteada:**
  - **Isla de la cabecera:** al inicio quedaba pegada a la banda/foto y al bajar tenía hueco. Ahora **24 px en ambos casos** (medido en tienda, ficha y legal, escritorio y móvil). En la tienda va en posición absoluta: con un margen normal se colapsaba.
  - **Caja blanca que parpadea al abrir la web:** causa medida. La animación de entrada de cada tarjeta (opacidad <1) la aísla del fondo y el `mix-blend-multiply` de la foto deja de fundir su blanco: foto a 254 con el contenedor sin color, a 235 (=página) con `bg-background` en el contenedor. Arreglado también en ficha, miniaturas, relacionados, carrito y checkout. ⚠️ **Regla:** cualquier foto de producto con `mix-blend-multiply` necesita el color de la página en su contenedor inmediato.
  - **Prenda agotada:** sin sello «Unidades limitadas» y con el selector de cantidad desactivado.
- ✅ **Según Ana (2026-10-07), las tres pendientes de Jacobo están resueltas:** domicilio del Aviso legal, fotos de producto con el símbolo antiguo y texto del cartel de IN ORBIT. No consta aquí cómo se resolvió cada una: **no se ha verificado en el código ni en la web**. Si el domicilio cambió, hay que actualizar el Aviso legal.
- 🧪 **QA en navegadores hecha por Claude el 2026-10-07 (Ana la delegó), sobre el servidor de desarrollo local:** Chromium, Firefox 1543 y WebKit 2359 (motor de Safari), cada uno con 12 páginas × 3 tamaños (390/768/1440) + flujo ficha→talla→añadir→checkout. **Los tres sin fallos** en la pasada final (sin desbordes ni errores de consola; se ignoran los avisos CSP «Report-Only»). Los 18 controles de responsive de `npm run test:responsive` pasan; 113 pruebas unitarias pasan; `tsc` limpio. Edge no se ha probado aparte: usa el mismo motor que Chromium.
  - 🐞 **Hallado y corregido: la API View Transitions (`defaultViewTransition`) cuelga WebKit** al redirigir `/checkout` con el carrito vacío (3 de 3 caídas con ella, 3 de 3 bien sin ella). La añadí yo el mismo día. **Quitada**; la sustituye un fundido de entrada solo con opacidad (`.pagina-entra` en `styles.css`, envoltorio en `__root.tsx`). ⚠️ No volver a activarla sin repetir esta prueba en WebKit.
  - ♿ **Accesibilidad (comprobación automática parcial, sin lector de pantalla):** `lang=es` en todas, ninguna imagen sin `alt`, ningún botón/enlace sin nombre, ningún campo sin etiqueta, sin saltos de nivel de título. Corregido: faltaba `h1` en la entrada y en la tienda (añadido oculto visualmente) y varios enlaces medían 14-17 px de alto (por debajo de los 24 px de WCAG 2.2 AA): INICIO, logo, pie, «Volver», «Guía de tallas», email; ahora tienen más zona pulsable. El carrito abre como diálogo y se cierra con Esc; el foco se ve. **Pendiente:** no hay `<main>` en la mayoría de páginas (solo en la entrada) ni enlace «saltar al contenido». No se ha probado con lector de pantalla (VoiceOver/NVDA).
  - 📉 **Rendimiento en móvil (390 px, red simulada ~1,6 Mbps/150 ms y CPU ×4, Chromium):** el problema son las **imágenes**, no el JavaScript (0,6-0,8 MB). Medido en el código actual, servidor local: tienda 2,6 MB de imágenes; Personaliza 3,2 MB. Los PNG de `public/images/` pesan 1-3 MB cada uno y miden 3669×1920 (`gallery-1…5`, `personaliza-hero-wide`, `sudaderas-grupos`, `instagram-banner`) para mostrarse a ~300-1400 px; `drop008-banner.png` (9,2 MB) ya no lo usa nada. En la **preproducción de Cloudflare (versión anterior, con el banner de 9 MB)** la tienda cargó 12,7 MB y su LCP fue 17 s con esa red lenta; Personaliza 17,6 s. ⚠️ Esa red es dura (equivale a «4G lento»); en 4G normal sería bastante menos, pero los pesos son los reales. ✅ **Hecho el 2026-10-07 (con permiso de Ana): esas 8 imágenes pasan a WebP** (`public/images/*.webp`, calidad 0,97, redimensionadas a 1080-2560 px). De ~12 MB a ~2,7 MB; fidelidad medida píxel a píxel 39-50 dB (>40 dB no se distingue; la peor, `gallery-3`, comparada ampliada ×2 sin diferencia visible). Los **PNG originales se conservan** (no se borraron). La imagen de `og:image` de Personaliza se queda en PNG (WhatsApp/Facebook no siempre aceptan WebP). Resultado en servidor local, móvil con red lenta: Personaliza 3,2 → 0,7 MB de imágenes y LCP ~17 s → 6,2 s. **Fotos de la camiseta gris (hecho 2026-10-07):** `camiseta_gris_front/back.jpeg` medían 3375×4219 px (14 MP, ~57 MB descomprimidas en el móvil cada una) y pasan a 1280×1600 como las demás (~150 KB cada una, antes ~720 KB); siguen en **JPEG a propósito**, porque Stripe muestra estas fotos en su página de pago y no se quiso arriesgar con WebP. Comparada ampliada ×2 contra el original, sin diferencia visible salvo un grano de tela algo más suave. **Original recuperable con `git show HEAD~:public/images/camiseta_gris_front.jpeg` (commit anterior).** La tienda baja de 4,8 a **3,7 MB** de imágenes en móvil; lo que queda son sobre todo la galería (2 MB, WebP) y el hero. Falta medir en una preproducción nueva con el código compilado.
  - ⚠️ **Lo que esto NO prueba:** un iPhone o Android reales (barra del navegador, teclado en pantalla, tacto). Hay que abrir la web una vez en un iPhone antes de publicar.

### Lo único que sí se hizo

✅ **Punto 10, mitad: retirada la cuenta atrás del drop** (commit `14d5014`). Estaba caducada y abrir con un contador vencido da mala imagen. El componente `DropCountdown.tsx` **se conserva sin usar**: una marca de drops lo necesitará en el siguiente lanzamiento.

⏳ **Punto 10, otra mitad: pendiente.** Falta quitar «la fotografía asociada a la explicación de ECLIPSSE IN ORBIT». **No se tocó porque nadie ha confirmado cuál es** de las varias que hay en esa página.

⏳ **Punto 9 (foto del hero): se puede hacer ya**, es un cambio de una línea. Se dejó a propósito: cambiarla sola deja la portada con la identidad nueva y el resto de la web con la vieja, y una web a medias se nota más que una coherente aunque sea antigua.

### Decisión de fondo, sin tomar

**¿Abrir la tienda con la identidad actual y rediseñar después, o esperar al rediseño?** No es obvio: en una marca de ropa la imagen es el producto, y abrir con una identidad ya descartada tiene coste real. Pero el rediseño son semanas y reinicia la QA, y la tienda lleva lista desde el 2026-09-27. **Se decidirá cuando lleguen la tipografía y la paleta**, no antes.

## Si retomas aquí, lee esto primero

**Hay compras reales en modo test ya documentadas, pero eso no cierra los bloqueantes actuales.** No desplegar hasta completar la lista de la revisión del 2026-09-23.

✅ **DESBLOQUEADO el 2026-09-22.** Ana confirmó el dominio y se comprobó en vivo:
la web **está publicada en `https://www.eclipssebrand.es/`**. De ahí salen
`SITE_URL` y la URL del webhook de Stripe (`https://www.eclipssebrand.es/api/stripe-webhook`).

⚠️ **Lo publicado es `main`, la web antigua, no la tienda.** Comprobado el
2026-09-22 abriendo el sitio real:
- `/eclipssebrand` muestra las prendas con sus precios, pero **no hay carrito ni
  botón de comprar**: dice «a través de Instagram DM o WhatsApp».
- `/checkout` devuelve **404**.
- La cuenta atrás de la portada se estaba viendo **a cero** (`00 : 00 : 00 : 00`).
  ✅ **Retirada del código el 2026-10-04** (`14d5014`), pero **sigue viéndose en la web
  publicada** hasta que se despliegue, porque lo que está en producción es `main`.

✅ **Dominio canónico centralizado el 2026-09-23.** `og:url`, canonicals y las
imágenes sociales absolutas se construyen desde `src/data/site.ts`.

⚠️ **La rama buena es ahora `auditoria-preproduccion`**, no `feature/stripe-integration`.
En `main` está la web antigua, sin tienda.

✅ **Todo subido el 2026-10-04**: los 32 commits que quedaban en local están ya en el remoto.
No queda trabajo viviendo solo en el portátil.

⚠️ **Corrección del 2026-10-04 — aquí se decía algo incorrecto.** El remoto `origin`
(`github.com/afombuena-art/ECLIPSSEINORBIT`) es una **bifurcación** del repositorio de
Jacobo, y **no es el que despliega**. Ver «Se trabaja sobre una BIFURCACIÓN» más abajo:
Vercel vigila `eclipsseuniverse/ECLIPSSEINORBIT`, rama `main`. Subir cualquier cosa al
remoto de Ana es inofensivo; **lo que despliega es aceptar el Pull Request**.

🎨 **Encima de la mesa desde el 2026-10-04: el rediseño de identidad de Jacobo.**
**Desbloqueado el 2026-10-05** —paleta medida y tipografía de libre elección— pero **sin
empezar**. Ver «🎨 Rediseño de identidad» al principio de este archivo, **incluido el aviso de
no pasarle ese encargo a una herramienta generativa**.

⚠️ **Y la decisión de fondo sigue sin tomarse: ¿se abre la tienda con la identidad actual o se
espera al rediseño?** La tienda lleva lista desde el 2026-09-27. Cada semana de espera es una
semana sin vender; abrir con una identidad ya descartada también tiene coste en una marca de
ropa. **Hay que hablarlo con Jacobo, no dejarlo correr.**

⚠️ **Decisiones todavía abiertas:** contador, 4 o 5 camisetas, imagen principal de
las camisetas y cómo mantendrá Jacobo el catálogo sin romper precios.

🔹 `CALIDAD.md` y `SEGURIDAD.md` están versionados y actualizados con el estado real.

## Situación

Convertir la web en tienda online integrando Stripe. Stack: **TanStack + Vite 8**, `stripe ^22.6.0`.
Rama de trabajo: **`auditoria-preproduccion`** (nunca se hace push directo a `main`).

El proyecto tiene **su propio repositorio git**, excluido del de la oficina.

Archivos clave:
- `src/routes/checkout.tsx`
- `src/lib/stripe.server.ts`, `src/lib/checkout.server.ts`, `src/lib/checkout-schema.ts`
- `src/lib/shipping.ts` — cálculo de envío
- `src/routes/api.stripe-webhook.ts` — **endpoint público**
- `src/lib/webhook-dedup.server.ts` — **nuevo el 2026-09-20**

## Qué se hizo el 2026-09-20

**1. Revisión real del código de pago** (antes solo se había mirado por encima). Resultado:

✅ Verificado leyendo el código, está correcto:
- Firma del webhook validada con `constructEventAsync` sobre el body bruto; firma inválida → 400.
- Importes recalculados en el servidor desde el catálogo; no se confía en el frontend.
- El webhook relee la sesión completa desde la API de Stripe, no se fía del payload recibido.
- Checkout alojado por Stripe: el número de tarjeta no pasa por código propio.
- Solo responde 200 a Stripe si n8n confirma (2xx); si n8n falla, 5xx para que Stripe reintente.
- Secreto compartido `X-Webhook-Secret` en la llamada a n8n.
- `.env` en `.gitignore` y no trackeado. Hook `pre-commit` con gitleaks activo.
- Banner de cookies implementado.

⚠️ **Corrección importante al estado anterior:** el estado del 2026-09-12 decía que la *verificación de firma de Stripe* estaba pendiente. **Era falso**: está implementada desde el commit `c7f3ff4`. Se marcó como pendiente sin haber abierto el archivo. No volver a darla por pendiente.

**2. Deduplicación de eventos implementada en código** (decisión de Ana el 2026-09-20).

Antes, la deduplicación dependía **solo** de un nodo de n8n, y ese nodo falla (ver bug abierto). Ahora hay tres barreras:
1. Caché en memoria del servidor (descarta repetidos inmediatos, sin llamar a Stripe).
2. Marca persistente en la **metadata del PaymentIntent de Stripe** (`n8nForwarded`), que se lee gratis al expandir la sesión. Se escribe solo después de que n8n confirme.
3. La deduplicación de n8n, que sigue actuando como red de seguridad.

Se eligió la metadata de Stripe porque **el proyecto no tiene base de datos** y se descartó añadir una (Vercel KV / Upstash) para no meter dependencia, cuenta y coste nuevos.

Criterios aplicados, por si hay que revisarlos:
- Si falla la escritura de la marca en Stripe, **no** se devuelve error: el pedido ya llegó a n8n y un error provocaría un reintento y un duplicado. Se registra en el log.
- La lista de eventos se autorrecorta al acercarse al límite de 500 caracteres de metadata de Stripe.

## Estado de esos cambios — ✅ PROBADO DE PUNTA A PUNTA

- ✅ **Commiteado** el 2026-09-20: `0e30596`, en la rama `feature/stripe-integration`.
- ✅ **Probado con una compra real en modo test el 2026-09-20.** El bug del 2026-08-29 está cerrado.

**Cómo se verificó** (evento `evt_1UHp4B3pSwZ8rGo9lkJq48Tz`, sesión `cs_test_a1KtiApw…`):

| Prueba | Resultado |
|---|---|
| Compra normal | 200 en **7 s** (releer sesión + n8n + marcar). **1 fila en Airtable** |
| `stripe events resend` con el servidor vivo | 200 **instantáneo**, log `ya procesado (memoria)`. **Sigue 1 fila** |
| `stripe events resend` tras **reiniciar el servidor** | log `ya entregado a n8n, se descarta`. **Sigue 1 fila** |

La tercera prueba es la importante: con el servidor recién arrancado la caché en memoria está vacía, igual que en Vercel, donde cada petición puede caer en una instancia nueva. **Se confirmó que el cerrojo persistente (la marca en la metadata del PaymentIntent) funciona por sí solo.** Si alguien toca este código, repetir esa prueba concreta, no solo la fácil.

✅ **Los 7 segundos — resueltos el 2026-09-21.** Bajaron a **3749 ms** al simplificar el workflow de n8n (ver más abajo). El webhook registra ahora el desglose en cada entrega:
```
stripe-webhook: evt_... entregado en 3749 ms (releer sesión 390 · n8n 3077 · marcar 282)
```
El grueso es n8n↔Airtable y no se puede bajar más sin romper el contrato de «solo 200 si n8n confirma», que pidió Ana expresamente. ⚠️ Stripe **no publica su tiempo límite exacto**; solo recomienda responder 2xx antes de la lógica pesada y reintenta 3 días en producción. Nuestro diseño va a propósito contra esa recomendación, y la deduplicación es justo lo que lo hace seguro.

✅ **Resuelto el 2026-09-21: no hay camino paralelo.** El `pending_webhooks: 2` del evento reenviado hizo sospechar de un segundo destino. Comprobado en el panel (Workbench → Webhooks → Destinos de eventos): el único oyente era el `stripe listen` local (`JACOBO_HP → localhost:5000/api/stripe-webhook`) y **«No se han añadido destinos»**. Cero endpoints configurados. El único camino hacia Airtable es el del código, y está deduplicado.

⚠️ **Consecuencia para producción, no olvidar:** como no hay ningún endpoint dado de alta,
al pasar a modo live hay que crearlo a mano apuntando al dominio servido por Cloudflare
(`https://<dominio>/api/stripe-webhook`). Ese endpoint genera un signing secret distinto
del de `stripe listen`, y es el que debe ir en `STRIPE_WEBHOOK_SECRET` de producción. Si se
olvida, la tienda cobrará pero ningún pedido llegará a Airtable.

✅ `npm run typecheck` pasa sin errores en todo el proyecto.

## Entorno local — ✅ desbloqueado el 2026-09-20 (sin verificar todavía)

El 2026-09-20 el servidor de desarrollo no arrancaba y eso impidió hacer el pedido de prueba.

**Causa:** el **Acceso controlado a carpetas** de Windows Defender protege `Documentos` y **`node.exe` no estaba autorizado**, así que Node no podía escribir en `node_modules`. Se manifestaba de dos formas que son el mismo problema, no dos bugs:
- `ENOENT: no such file or directory` en `node_modules\.vite-temp\vite.config.ts.timestamp-*.mjs`
- `EPERM: operation not permitted, unlink` en `node_modules\.vite\deps\*`

✅ **Ana autorizó `node.exe` el 2026-09-20 y lo deja autorizado de forma permanente.** Ya estaban autorizados `git.exe` y `bash.exe`.

✅ **Comprobado el mismo día:** `npm run dev` arranca sin errores. Vite 8.2.2, listo en ~3 s.

🔹 **El servidor de desarrollo escucha en el puerto `5000`**, no en el 3000. La URL local es `http://localhost:5000/`. Todo lo de Stripe debe apuntar ahí:
```
stripe listen --forward-to localhost:5000/api/stripe-webhook
```

Si volviera a fallar la escritura en `Documentos` desde Node (`ENOENT` o `EPERM` con el archivo existiendo), es otra vez el Acceso controlado. ⛔ **No buscar rodeos técnicos**: el 2026-09-20 se probaron `npx vite dev --configLoader runner`, borrar la caché de Vite y `dangerouslyDisableSandbox`, y **ninguno sirve**. ⛔ **Nunca desactivar la protección entera**: esta oficina maneja datos de clientes y proyectos sanitarios.

⚠️ Contrapartida asumida por Ana: con Node autorizado, **un paquete malicioso de npm puede escribir en `Documentos` durante un `npm install`**. Mitigación acordada: no instalar dependencias sin su visto bueno (ya está en `CLAUDE.md` §11), usar `npm ci` cuando el `package-lock.json` sirva, y mantener al día la copia en el disco externo.

✅ **ESLint reparado el 2026-09-23.** `npm run lint` termina con 0 errores y 7 avisos no
bloqueantes, y la revisión automática ya incluye este paso (`ea57e99`).

## Pendiente antes de pasar a producción

### A · Depende de Ana y del equipo técnico

1. ✅ **Autorizar `node.exe`** — hecho el 2026-09-20. Falta comprobar que `npm run dev` arranca de verdad.
2. **Probar la deduplicación de punta a punta**, en modo test:
   - `stripe listen --forward-to localhost:5000/api/stripe-webhook` → da un `whsec_...` que **debe** estar en `STRIPE_WEBHOOK_SECRET` del `.env`, y hay que reiniciar el servidor. Sin esto, todo falla por firma inválida.
   - Compra con `4242 4242 4242 4242`.
   - `stripe events resend evt_XXXX` → debe responder `duplicado` y **en Airtable debe seguir habiendo una sola fila**.
   - ⚠️ La CLI de Stripe **no estaba conectada a ninguna cuenta** el 2026-09-20 (pedía `stripe login`). Al hacerlo, elegir la cuenta de ECLIPSSE.
3. **Diagnosticar el bug de n8n** (sigue abierto, ver abajo). El arreglo en código lo tapa, pero el nodo sigue mal.
4. **Completar la checklist de pruebas manuales de `CLAUDE.md` §10.** La revisión local del
   2026-09-23 comprobó portada, banner, carrito y entrada al checkout, pero no un pago test
   completo ni los servicios externos.
5. ✅ **Tests automáticos disponibles:** `npm test` ejecuta 66 pruebas y `npm run typecheck`
   comprueba tipos. Ambos pasan el 2026-09-23.
6. Cuando todos los bloqueantes estén cerrados y Ana autorice publicar: integrar
   `auditoria-preproduccion` en `main`, configurar claves **live** y el endpoint del webhook
   en modo live, y cargar las variables de entorno en el alojamiento.

### B · Depende del cliente — ⚠️ pedírselo cuanto antes, es lo que más tarda

7. ✅ **Datos fiscales — COMPLETADO el 2026-09-20** (commit `d55b28f`). Los 10 huecos están rellenos en las tres páginas legales.
   - Titular: **Jacobo Otero Campos**, NIF `48806552T`, Plaza del Cabildo 12, 41001, Sevilla.
   - Es **autónomo**, así que se eliminaron las líneas de datos registrales del aviso legal (solo aplican a sociedades).
   - El domicilio se publica **sin piso ni puerta**, a petición del cliente. Comprobado que `legal.devoluciones.tsx` no publica dirección postal, así que acortarlo no afecta a las devoluciones.
   - ⚠️ **Criterio, no dictamen jurídico:** se valoró que calle + número + CP + ciudad cumple el art. 10 de la LSSI-CE. No lo ha revisado un abogado ni el especialista legal de la oficina.
   - ⚠️ El único contacto en las tres páginas es `eclipssebrand@gmail.com`. Legal, pero da mala imagen en una tienda. Pendiente de comentárselo.
8. ✅ **Tarifas de envío — COMPLETADO Y PROBADO el 2026-09-20** (commits `aeebf88` y `fd71f79`).

   El cliente pasó su tabla real de Correos vía **Packlink PRO**, enviando desde **41001**. El precio depende de **peso y zona**, no solo del peso como antes.

   **Cuatro zonas**, deducidas de los dos primeros dígitos del código postal:
   - `41` → **Sevilla** · `11, 21, 14, 29` (Cádiz, Huelva, Córdoba, Málaga) → **limítrofes** · `07` → **Baleares** · resto → **península**.
   - Jacobo dijo «aproximadamente» sobre las limítrofes. **Se dejaron exactamente las cuatro que nombró**: entre limítrofe y península hay 9 céntimos, y cobrar de menos sí le costaría dinero. Badajoz linda con Sevilla y **no** está incluida, a propósito.

   **Siete tramos de peso** hasta 15 kg, en `SHIPPING_TABLE`. Por encima no hay tarifa y el pedido se rechaza en vez de inventar un precio. Referencia: camiseta 220 g, gorra 120 g → **casi todos los pedidos caen en el primer tramo**.

   **Dónde se pide el código postal:** en **nuestro** checkout, no en Stripe. Stripe recoge la dirección cuando el importe ya está fijado, así que no sirve para calcular.
   - ⛔ **No migrar al checkout incrustado de Stripe para esto.** Stripe sí tiene esa función (`permissions.update_shipping_details=server_only`), pero **desactiva automáticamente Apple Pay y Google Pay**, y obliga a rehacer el checkout entero. Se descartó el 2026-09-20 tras comprobarlo en su documentación.

   **Destinos:** solo península y Baleares. **Canarias (35, 38), Ceuta (51) y Melilla (52) quedan fuera** —además están fuera del IVA peninsular— y el checkout ofrece contactar por WhatsApp. El extranjero ya estaba excluido por `allowed_countries: ["ES"]`.

   **Envío gratis: retirado** por decisión de Ana el 2026-09-20. `FREE_SHIPPING_THRESHOLD_CENTS = null`. El umbral anterior de 75 € no lo había decidido nadie y le costaba el envío de su bolsillo. Se quitó también de los textos de **términos** y **devoluciones**, donde estaba prometido al comprador. Para reactivarlo basta con poner el subtotal en céntimos; el aviso del carrito reaparece solo.

   **Tres validaciones, no una:** el navegador calcula para mostrar, `checkout.server.ts` **recalcula la zona en el servidor** (el cliente se puede manipular) y el webhook compara la zona cobrada con el CP que acabó recogiendo Stripe.

   ⚠️ **Agujero conocido y asumido: el CP del checkout y la dirección de Stripe pueden no coincidir.** Se cobra antes de que Stripe pida la dirección, así que se puede pagar tarifa de Sevilla y recibir en Barcelona, **o saltarse el bloqueo de Canarias**. Comprobado el 2026-09-21. La defensa actual es detectarlo y que se vea antes de preparar el paquete.

   🔹 **Cómo se eliminaría del todo, si algún día compensa** (evaluado el 2026-09-21, **decisión de Ana: no hacerlo ahora**). El problema existe porque la dirección se pide en dos sitios. Si se pide **solo en nuestro checkout** —nombre, calle, piso, ciudad y CP— y se le pasa a Stripe ya hecha con **`payment_intent_data.shipping`** (verificado en su API: `name` y `address.line1` obligatorios, más `city`, `postal_code`, `country`), se quita `shipping_address_collection` y **Stripe deja de pedirla**. Sigue siendo checkout alojado, así que **Apple Pay se conserva**; no es lo mismo que el checkout incrustado descartado en el punto 8.
   - Contrapartida: hoy la dirección la valida Stripe con autocompletado. Si la pedimos nosotros, **esa validación pasa a ser nuestra** y una dirección mal escrita son paquetes devueltos. Y obliga a repetir todas las pruebas del checkout.
   - **Cuándo replantearlo:** si con clientes reales la columna «Aviso envío» se llena a menudo.

   ✅ **Aviso de envío — implementado y probado el 2026-09-21** (commit `00aec8e`). El webhook manda `envio.aviso`, un texto ya redactado, que el nodo de n8n vuelca en la columna **«Aviso envío»** de Airtable. Vacío cuando todo cuadra. Dos gravedades:
   - `REVISAR — se cobró envío de sevilla (CP 41001) pero la entrega es en peninsula (CP 08001)…`
   - `NO ENVIAR — la dirección de entrega (CP 35007) está en Canarias, Ceuta o Melilla…` ← **el caso que importa**, probado de punta a punta.

   ⚠️ Antes solo se mandaba `revisar: true`, **y n8n no lo mapeaba a ninguna columna**: el aviso se generaba y se perdía. Si alguien añade campos al payload, comprobar que el nodo «Crear pedido» los mapea, o no llegan.

   ✅ **Probado el 2026-09-20:** 41001→4,50 €, 14001→4,90 €, 28001→4,99 €, 07001→6,50 €, 35001→bloqueado con aviso de WhatsApp. Compra completa a Sevilla: 23,97 + 4,50 = **28,47 €** cobrados correctamente, con `shippingZone: "sevilla"` en la metadata.

### C · Legal y protección de datos — sin revisar

9. ✅ **Política de privacidad corregida el 2026-09-20.** Antes solo nombraba Stripe, Correos y Vercel; ahora declara los seis destinatarios reales: **Stripe, Correos y Packlink PRO, Vercel, iActivaPráctica, Hostinger y Airtable**. Se añadió además un párrafo que dice expresamente que Airtable es estadounidense y que los datos salen del EEE.

   ⚠️ **Cambio pendiente por la decisión del 2026-09-24:** antes de publicar desde
   Cloudflare hay que sustituir Vercel por Cloudflare en la política y comprobar qué datos,
   región y condiciones corresponden realmente. No cambiar el texto legal por simple
   sustitución de nombre sin revisar el tratamiento efectivo.

   ⚠️ **Contexto que manda sobre cualquier suposición: Jacobo es el marido de Ana.** Por eso no hay contrato de servicios ni de encargado del tratamiento entre ellos, y no hay que proponerlo. La base de datos de pedidos vive en la **cuenta de Airtable de iActivaPráctica (de Ana)**, decisión consciente del 2026-09-20; se revisará solo si la tienda crece.

   ✅ **DPA de Airtable FIRMADO el 2026-09-20** por Ana Fombuena Zapata a nombre de **iactivapractica**, vía DocuSign. PDF guardado en `01_DOCUMENTOS/` del proyecto.
   - ✅ **Incluye las cláusulas contractuales tipo de la UE** (sección 9.2, Módulo 2 responsable→encargado), que es justo lo que promete la política de privacidad. Ley y tribunales **de Irlanda**; autoridad de control, la irlandesa.
   - Airtable se obliga a: no vender ni compartir los datos, avisar de brechas **en 72 h**, avisar con **10 días** de antelación de subencargados nuevos (con derecho a oponerse en 10 días hábiles), ayudar con los derechos de los clientes y enseñar sus auditorías (SOC 2, ISO 27001) una vez al año.
   - ⚠️ **Los avisos llegan a `afombuena@gmail.com`** (el correo del bloque de firma). Que no caigan en spam: el plazo para oponerse a un subencargado nuevo es de solo 10 días hábiles.
   - ⚠️ **El borrado al terminar no es automático:** la sección 12 exige **petición escrita**. Si algún día se deja Airtable, hay que pedirlo expresamente.
   - ⚠️ El PDF **no está versionado a propósito** (`01_DOCUMENTOS/` está en el `.gitignore` desde el commit `d427d58`): lleva firma, nombre y dirección, y este repo tiene remoto en GitHub. Existe **solo en el disco del portátil**; la copia al disco externo del 2026-09-12 no lo cubre.

   ✅ **Plazos de conservación fijados el 2026-09-21** y escritos en la política: **facturación 6 años** (obligación fiscal y contable), **contacto y envío 3 años** desde la entrega, **email de marketing** hasta la baja.

   ⚠️ **PENDIENTE y ahora es una promesa por escrito: que alguien borre de verdad.** En Airtable no borra nada nadie. Con el texto publicado, incumplirlo es peor que no haberlo escrito. Basta una limpieza manual una vez al año (borrar teléfono y dirección de los pedidos de hace más de 3 años, dejando importe y factura) o un workflow de n8n que lo haga solo. No corre prisa mientras no haya pedidos reales.

   🔹 Detectado y **no tocado**: la política dice que también se tratan datos de quien escriba por **WhatsApp o Instagram**, lo que convierte a **Meta** en otro encargado no declarado.

   🔹 Aclaración: para gestionar el pedido **no hace falta consentimiento** (base legal: ejecución de contrato). El consentimiento solo aplica a marketing, y esa casilla (`marketingOptIn`) ya está separada y desmarcada por defecto. Correcto.

   ⚠️ Todo lo anterior es criterio técnico, **no dictamen jurídico**. No lo ha revisado un abogado ni el especialista Legal de la oficina.

## Bug de n8n — ✅ RESUELTO el 2026-09-21

**Síntoma (2026-08-29):** al reenviar un evento, se creaba un **registro duplicado en Airtable con el mismo `eventId`**.

**Qué se hizo (2026-09-21):** en vez de buscar la causa exacta del nodo que fallaba, se
**rediseñó el workflow** para que el problema no pueda darse. La deduplicación era un
«comprobar y luego actuar» en tres pasos (buscar → ¿existe? → crear), frágil por
construcción. Se sustituyó por un único `upsert` de Airtable, que **evita duplicados en
reenvíos secuenciales** del mismo evento — no se demostró entonces, ni se demuestra ahora,
que cubra dos peticiones simultáneas llegando al mismo tiempo; ver M8 de `SEGURIDAD.md`.

```
ANTES (hasta 2026-09-21)   Webhook → Wait(2s) → Buscar duplicado → ¿Ya existe? → Crear → Responder
DESPUÉS (2026-09-21)       Webhook → Crear pedido (upsert, coincidencia por eventId) → Responder
```

🔁 **Actualizado el 2026-09-26 (M8, Opción A):** la coincidencia del upsert pasó de
`eventId` a `orderRef`, y se añadió un rechazo explícito para pedidos sin referencia. El
workflow activo tiene ahora **5 nodos**, con dos ramas después de la comprobación:

```
ACTUAL (2026-09-26)  Webhook → Si (¿hay orderRef?)
                                 ├─ verdadero → Crear pedido (upsert por orderRef) → Responder 200
                                 └─ falso → Responder al webhook (400, sin tocar Airtable)
```

Detalle completo, con la tabla de pruebas ejecutadas, en «Qué se aplicó de verdad —
2026-09-26», dentro de la propuesta técnica de M8 más arriba.

⚠️ **El workflow en uso es OTRO, con ID nuevo:**
- **Activo:** `qmS3k2Pp3wxyKUqZ` — «Pedidos Stripe — ECLIPSSEINORBIT», 5 nodos desde el
  2026-09-26 (antes 3), ruta `stripe-eclipsse-order`.
- **Desactivado:** `17y7m9VMFcYZDNff` — «Pedidos Stripe — ECLIPSSEINORBIT_versión anterior (con bug)», 7 nodos. Se conserva como respaldo; **no reactivar**.
- La ruta del webhook y la autenticación de cabecera son las mismas, así que **el `.env` no cambia**.

✅ Efecto medido en la prueba del 2026-09-21: el webhook pasó de **~7000 ms a 3749 ms** (releer sesión 390 · n8n 3077 · marcar 282). Se quitaron los 2 s del `Wait` y una llamada entera a Airtable. **El grueso restante es latencia de n8n↔Airtable**; no se puede bajar más sin romper el contrato de «solo 200 si n8n confirma». Con ese margen, el aviso sobre los 7 segundos queda cerrado.

✅ **El upsert se probó en ejecución, no solo leyendo su configuración.** El primer reenvío lo paraba el cerrojo del código antes de llegar a n8n, así que para ejercitar el upsert hubo que anular las dos defensas del código a propósito:

1. Borrar la clave **`n8nForwarded`** de la metadata del PaymentIntent en el panel de Stripe (ahí deja el código su marca persistente).
2. **Reiniciar `npm run dev`**, que vacía la caché en memoria.
3. `stripe events resend evt_1UI3JO3pSwZ8rGo9YtB463Ek`.

Resultado: el log pasó de «ya procesado (memoria), se descarta» a **«entregado en 3285 ms»**, confirmando que el mismo `eventId` llegó a n8n por segunda vez. **En Airtable siguió habiendo una sola fila.** El upsert actualizó el registro en lugar de duplicarlo.

**Las dos defensas están verificadas por separado.** Este procedimiento es el que hay que repetir si alguien vuelve a tocar el workflow de n8n.

## Bloqueado por el cliente

Nada. Los datos fiscales y las tarifas de envío llegaron el 2026-09-20 y ya están aplicados.

## Revisión de calidad de código — 2026-09-21

Se hizo una **revisión estática** de todo el código escrito a mano (`src/`, excluyendo los 48 ficheros de shadcn y lo generado), más la configuración del proyecto. Resultado en **`CALIDAD.md`**, en esta misma carpeta: **22 hallazgos con fichero y línea — 0 altos, 10 medios, 12 bajos.**

En esa revisión del 2026-09-21 solo hubo diagnóstico: **no se tocó ni una línea de código ni
de configuración.** Las correcciones y verificaciones posteriores constan al inicio de este
archivo y en los propios informes.

✅ **Confirmado de nuevo, leyendo el código:** los importes se recalculan en el servidor, el webhook verifica firma, hay CSRF en las server functions, no hay ningún secreto en el repositorio, ningún `TODO`/`FIXME`, ningún `localhost` en `src/`, ningún `any` escrito a mano, y el hook de gitleaks está activo. Las cinco variables de entorno están correctamente declaradas en `.env` y en `.env.example`.

⚠️ **Tres cosas que no dependen de ninguna decisión pendiente.** Las dos primeras están **también en `main`**, idénticas (comprobado el 2026-09-21), así que **no llegaron con el trabajo de Stripe**: si la web está publicada, se están viendo ya. Eso no se sabrá hasta responder la pregunta del dominio.

1. **La cuenta atrás de la portada marca `00:00:00:00`.** `DropCountdown.tsx:4` apunta al 2026-09-01, que ya pasó. Hay que decidir dos cosas: qué fecha va ahí y qué debe mostrarse cuando venza (ahora no hay ninguna previsión para ese caso).
2. **La tienda anuncia 5 camisetas del DROP 008 y el catálogo tiene 4.** En `src/assets/` están las imágenes de la camiseta granate sin ningún producto que las use. O falta darla de alta, o sobra el «5» del texto. **Es una pregunta para Jacobo.**
3. ✅ **Imágenes sociales corregidas el 2026-09-23.** Hay `og:image` general y las fichas
   usan URLs absolutas construidas desde el dominio canónico (`3072a63`).

✅ **Dominio canónico centralizado el 2026-09-23:** las etiquetas `og:url`, canonical,
JSON-LD e imágenes sociales usan `src/data/site.ts` (`3072a63`).

🔹 **Estado actual:** los tests de envío y la idempotencia de creación están resueltos. La
deduplicación atómica por sesión y tipo de evento continúa pendiente en `SEGURIDAD.md`.

## ✅ Decisión tomada el 2026-09-24 · Se abandona Vercel y se migra a Cloudflare

Ana elige Cloudflare como alojamiento y descarta pagar Vercel Pro. La investigación de
Vercel que sigue se conserva como antecedente de la decisión, pero sus instrucciones de
configuración y rate limiting están **anuladas**. No se debe configurar ni desplegar nada
nuevo en Vercel.

La documentación oficial consultada el 2026-09-24 recomienda para TanStack Start full-stack
el runtime de **Cloudflare Workers**, con `@cloudflare/vite-plugin`, `wrangler`,
`compatibility_flags: ["nodejs_compat"]` y el entrypoint de TanStack. Cloudflare Pages
Functions se ejecuta sobre Workers, pero Pages solo admite un subconjunto de bindings; el
binding oficial de Rate Limiting está documentado para Workers. Claude debe confirmar la
arquitectura exacta antes de editar y no convertir la aplicación en una web estática.

Fuentes oficiales:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/pages/functions/bindings/

## Histórico · Riesgo detectado el 2026-09-22 en Vercel Hobby

El despliegue está en **la cuenta de Jacobo, en plan Hobby (gratuito)**, según
Ana. Texto literal de `vercel.com/docs/limits/fair-use-guidelines`, apartado
*Commercial usage*, consultado el 2026-09-22:

> **Hobby teams** are restricted to non-commercial personal use only. All
> commercial usage of the platform requires either a Pro or Enterprise plan.
>
> Commercial usage is defined as any Deployment that is used for the purpose of
> financial gain of **anyone** involved in **any part of the production** of the
> project, including a paid employee or consultant writing the code. Examples of
> this include, but are not limited to, the following:
> - Any method of requesting or processing payment from visitors of the site
> - **Advertising the sale of a product or service**
> - Receiving payment to create, update, or host the site

⚠️ **Corrección al aviso anterior de este archivo: no es un problema futuro.** Se
dijo que «hoy no hay problema porque lo publicado es una web sin tienda». Es
falso. El segundo ejemplo de la lista es *anunciar la venta de un producto*, y
`https://www.eclipssebrand.es/eclipssebrand` ya muestra las prendas **con su
precio** (23,97 €, 14,97 €) e indica cómo comprarlas por Instagram o WhatsApp.
Según la definición de Vercel, **eso ya es uso comercial**, sin tienda y sin
pasarela de pago.

⚠️ **No hay excepción por vender poco.** Se buscó expresamente: la definición no
menciona volumen, ingresos ni tamaño del proyecto. La única excepción que recoge
es pedir donaciones.

⚠️ **Y no avisan antes.** El «avisamos antes de actuar» de su documentación se
refiere al **consumo excesivo de recursos**, no a las infracciones de política.
Para una infracción de política, según
`vercel.com/kb/guide/why-is-my-account-deployment-blocked`, **pausan primero y
mandan el email después**. No hay plazo de gracia documentado.

✅ **Decisión cerrada el 2026-09-24:** no se contratará Vercel Pro para este proyecto; se
migrará a Cloudflare.

⚠️ **No se ha verificado en la cuenta real**: nadie de esta oficina tiene acceso
al Vercel de Jacobo, y el conector de Vercel no está autorizado. Lo que consta es
lo que dice la documentación de Vercel y lo que Ana ha dicho del plan. **Hay que
confirmarlo con Jacobo antes de abrir.**

## Histórico · Paso a paso de Vercel — no ejecutar

### 1 · El plan — hay que pagarlo antes de abrir la tienda

Ver el riesgo de arriba. **20 $ por usuario y mes** el plan Pro, según la web de
Vercel a 2026-09-22. Cómo comprobar el plan actual: en el panel de Vercel,
seleccionar el equipo arriba a la izquierda → **Settings → Billing** → apartado
**Plan**. Si pone «Hobby», es el gratuito.

Este paso queda descartado por la decisión de migrar a Cloudflare.

### 1 bis · ¿Hay alternativa gratuita? Consultado el 2026-09-22

| Sitio | ¿Permite una tienda en su plan gratuito? |
|---|---|
| **Vercel Hobby** | ⛔ **No.** Prohíbe el uso comercial, incluido solo anunciar la venta de un producto. |
| **Cloudflare (Workers/Pages)** | ✅ **Elegido por Ana el 2026-09-24.** La tarjeta seguirá introduciéndose únicamente en Stripe Checkout. Queda confirmar por escrito las condiciones del plan y usar la arquitectura full-stack oficial de TanStack Start. |
| **Netlify gratis** | 🟡 **Sin verificar del todo.** Su página de precios no impone ninguna restricción comercial como la de Vercel, pero no se han leído sus términos completos. |

⚠️ **El coste real de cambiar no es el plan, es el trabajo.** Mover el proyecto
a Cloudflare **exige tocar código**: el SDK de Stripe necesita su cliente HTTP
basado en `fetch` para funcionar en Workers, y hay que cambiar el preset de
Nitro. A Netlify es más ligero, pero en los dos casos hay que rehacer variables
de entorno, mover el dominio, dar de alta otra vez el webhook y **volver a
probar la tienda entera**, que es justo lo que acabamos de dejar verificado.

🔹 **Conclusión histórica sustituida:** Ana ha decidido asumir la migración a Cloudflare.

### 2 · Rate limiting de Vercel — instrucciones anuladas

Estas instrucciones se conservan como antecedente y **no deben ejecutarse**. Verificado en
`vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting`
(2026-09-22): **incluido en el plan Hobby**, 1 regla por proyecto, conteo por IP,
ventana de 10 s a 10 min, 1.000.000 de peticiones permitidas incluidas.

Pasos exactos:

1. Panel de Vercel → el proyecto → **Firewall** en el menú lateral.
2. Arriba a la derecha: **Configure** → **+ New Rule**.
3. Nombre: `Limite creacion de pagos`.
4. **If**: la ruta (*Path*) **empieza por** `/_serverFn`.
5. **Then**: **Rate Limit**. La primera vez sale un aviso de precios → Continue.
6. Estrategia: **Fixed Window** (es la única del plan gratuito).
7. **Time Window**: `60s`. **Request Limit**: `20`.
8. Clave de conteo: **IP**.
9. Acción: empezar en **Log** (solo observa, no bloquea). Pasada una semana con
   tráfico real, si no salta con compradores normales, cambiar a **Deny**.
10. **Save Rule** → **Review Changes** → **Publish**.

⚠️ **No tocar el webhook.** La regla debe afectar solo a `/_serverFn`, nunca a
`/api/stripe-webhook`: Stripe reintenta de forma legítima y un límite ahí
tumbaría entregas reales. Lo prohíbe el `CLAUDE.md` §4 del proyecto.

🔹 Para comprobar que funciona: Firewall → vista general → elegir la regla en el
desplegable de agrupación de tráfico.

## Paso a paso · Stripe — ✅ HECHO por Ana el 2026-09-22

⚠️ **Sin verificar desde aquí:** esta oficina no tiene acceso al panel de Stripe.
Consta lo que dijo Ana. Lo de abajo queda como registro de qué se configuró y
por qué, para poder comprobarlo de un vistazo antes de abrir.

⚠️ **Todo esto se configura por separado en modo prueba y en modo live.** Tiene
que estar en **live**, que es donde va a cobrar. El selector está arriba a la
izquierda. **Comprobar que se hizo en live y no en pruebas** es la única
verificación que queda pendiente de este bloque.

### 1 · Emails al comprador — `dashboard.stripe.com/settings/emails`

Decidido el 2026-09-22: **las dos casillas del apartado «Pagos» activadas.**
- **«Pagos que se han efectuado correctamente»** → el justificante de pago.
- **«Reembolsos»** → aviso automático cuando se devuelve dinero. Evita el
  «¿me has devuelto ya?» y deja constancia de la fecha.

### 2 · Política de devoluciones en la pasarela de pago

Comprobado el 2026-09-22 contra el texto real de
`https://www.eclipssebrand.es/legal/devoluciones`, que está publicado y accesible:

- ✅ **«Se aceptan devoluciones»** — sí. La página reconoce los 14 días naturales
  de desistimiento que exige la ley.
- ⛔ **«Se aceptan cambios»** — **no marcar.** La política **no dice nada de
  cambios**. Marcarlo sería prometer en la pasarela algo que no está escrito.
  Si algún día se quieren ofrecer, primero se añade a la página legal.
- ✅ **«Se admiten reembolsos»** — sí. La página tiene su apartado: reembolso por
  el mismo medio de pago, máximo 14 días naturales.
- **URL (obligatoria):** `https://www.eclipssebrand.es/legal/devoluciones`
- **Mensaje personalizado** (opcional, 300 caracteres), redactado a partir de la
  política real:
  > 14 días naturales para devolver desde que recibes el pedido. La prenda debe
  > estar sin usar, con su etiqueta y su embalaje. El envío de la devolución
  > corre a tu cargo, salvo defecto de fabricación. Los productos personalizados
  > están excluidos por ley.

## Decisiones del 2026-09-22

**1 · Email al comprador: recibos automáticos de Stripe.** Decidido por Ana. No se
añade ningún nodo de Gmail. ⚠️ **Hay que activarlos a mano en el panel de Stripe
antes de vender** (Configuración → Pagos → Emails a clientes → «Pagos
completados»). Mientras no se active, nadie recibe nada: por eso la página de
confirmación ya no promete ningún email. Cuando esté activado, se puede volver a
mencionar en esa página, pero **solo el justificante de pago**: el recibo de
Stripe no es una factura ni lleva seguimiento del envío.

**2 · Notas del pedido: se quedan como están.** Ana pidió que fueran solo a
Airtable y no a Stripe. **No es posible tal como está montado el flujo:** el
único camino entre el formulario y Airtable es la metadata de la Checkout
Session (checkout → Stripe → webhook → n8n → Airtable). Quitarlas de Stripe es
quitarlas de Airtable, y Jacobo dejaría de verlas. Se mantiene el aviso al
comprador de no escribir datos sensibles, que es la medida que sí reduce el
riesgo. Queda como opción futura, si alguna vez importa: borrar el campo `notes`
de la metadata de Stripe justo después de que n8n confirme.

**3 · Deduplicación por sesión (M8 de `SEGURIDAD.md`): decisión histórica, sustituida.**
Esta entrada es del 2026-09-22: en ese momento se decidió aplazar M8 y la red de seguridad
era el `upsert` de n8n por `eventId`. **Ya no es el estado actual.** El 2026-09-26 Ana
decidió aplicar la Opción A: el `upsert` de n8n pasó de `eventId` a `orderRef`, y se añadió
un rechazo explícito (400) para pedidos sin `orderRef`. Ver «Qué se aplicó de verdad —
2026-09-26» y la fila de M8 en la tabla de `SEGURIDAD.md`. Se deja este párrafo como
registro de la decisión original, no como estado vigente.

**4 · Retención en n8n — ✅ HECHO por Ana el 2026-09-22.** Se detectó que el
workflow `qmS3k2Pp3wxyKUqZ` no tenía configurado nada de guardado y usaba el
valor por defecto (guardar todas las ejecuciones con sus datos): había **4
ejecuciones guardadas** con nombre, email, teléfono, dirección y notas de las
pruebas del 21. Ana lo ajustó. ⚠️ **Sin verificar desde aquí:** el acceso a n8n
de esta oficina es de solo lectura y no se ha vuelto a comprobar el estado.
Conviene confirmar de un vistazo que las ejecuciones de éxito ya no se guardan y
que las 4 antiguas están borradas.

## Próxima acción

✅ **Auditoría local de seguridad y calidad — cerrada el 2026-09-26.** Ver «Cierre de la
auditoría local» al principio de este archivo. Pasan 98 pruebas, typecheck, lint y build;
`npm audit` y Gitleaks no dejaron hallazgos, y el paquete real del dry-run no contiene
secretos. Nada de la web se ha subido ni desplegado.

✅ **M8 decidido y aplicado — 2026-09-26.** Ana eligió la Opción A, se aplicó en n8n
(`fieldsToMergeOn` de `eventId` a `orderRef`, más rechazo de pedidos sin referencia) y se
probó con datos falsos en el Airtable real. Detalle completo en «Qué se aplicó de verdad —
2026-09-26». Riesgo residual de concurrencia real aceptado expresamente por Ana; Opción B no
implementada. Ya no es «lo primero al retomar».

✅ **Preview de Cloudflare real y compra de prueba completa de punta a punta — hecho el
2026-09-27.** Ver «✅ Validación real en Cloudflare (preprod)» al principio de este archivo.
Ya no es «lo primero al retomar».

🔸 **Lo primero al retomar ahora:** subir `auditoria-preproduccion` a su rama remota, sin
integrar en `main`. Después, preparar la puesta en producción por pasos: política de
privacidad, configuración y secretos live de Cloudflare, webhook Stripe live, recibos,
control del autodeploy de Vercel, dominio/DNS y reversión. La QA adicional de accesibilidad,
Firefox/Safari/Edge y rendimiento sigue siendo recomendable, pero no se confunde con la QA
de preproducción ya cerrada. También siguen abiertas las decisiones visibles sobre contador,
4 o 5 camisetas e imagen frontal/trasera.

**1 · ✅ DPA de Airtable — FIRMADO el 2026-09-20.** Ver punto 9.

**2 · ✅ Webhooks de Stripe — COMPROBADO el 2026-09-21.** No hay ningún endpoint configurado, así que no existe camino paralelo. Ver arriba, incluida la consecuencia para producción.

**3 · ✅ Plazos de conservación — ESCRITOS el 2026-09-21** (6 / 3 años). Queda **aplicarlos**: hoy nada borra nada en Airtable y ahora está prometido por escrito. Ver punto 9.

**4 · ✅ Cerrado con Jacobo el 2026-09-21.** Confirmó que **no hay envío gratis «de momento»**. Sobre las limítrofes no lo tenía claro, así que Ana decidió usar la definición geográfica habitual: se **añadió Badajoz (06)** a las cuatro que él nombró (commit `bb3f74c`). Ya le explicó la columna «Aviso envío» y borró la opción basura de Airtable.

⚠️ **No quitar el `typecast` del nodo de Airtable**: sin él, un valor inesperado haría fallar el nodo, n8n no respondería 200 y el pedido no se guardaría. Es preferible una etiqueta rara a un pedido perdido.

**5 · ✅ Los 7 segundos — resueltos el 2026-09-21** (3749 ms). Ver arriba.

**6 · Puesta en producción — PREPRODUCCIÓN VALIDADA; CONMUTACIÓN LIVE PENDIENTE.** El código
y el flujo de prueba están validados en Cloudflare. No se cambia aún el dominio: faltan la
política de privacidad, configuración y secretos live, webhook live, recibos, control del
autodeploy de Vercel, dominio/DNS, plan de reversión y autorización expresa de Ana.

**7 · Activar los recibos automáticos de Stripe** (decisión 1 de arriba). Panel de
Stripe, en **modo live**. ⚠️ En modo prueba Stripe no manda recibos solos, así que
no se puede comprobar hasta estar en producción: no dar por roto lo que no se ha
podido probar.

**8 · Dejar de guardar los datos personales de cada pedido en n8n** (decisión 4).
En el workflow → menú de los tres puntos → Settings:
- «Save successful production executions» → **Do not save**.
- «Save failed production executions» → **dejar en Save**, que es lo que permite
  averiguar qué pasó cuando un pedido no llega.
Y en la instancia de EasyPanel, activar el purgado por antigüedad
(`EXECUTIONS_DATA_PRUNE` y `EXECUTIONS_DATA_MAX_AGE`) para que lo que sí se
guarde no se quede para siempre. **Borrar además las 4 ejecuciones de prueba
que hay ahora.**

**9 · Decisiones visibles pendientes:** contador caducado, 4 o 5 camisetas e imagen
frontal/trasera. `og:image` quedó resuelto el 2026-09-23 (`3072a63`).

**10 · ⏳ DESPUÉS DE ABRIR LA TIENDA · Poner los repositorios en privado y quitar la
bifurcación.** Ana lo pidió el 2026-10-04 y **quiere que se le recuerde**; se aplazó a
propósito para no reestructurar los repositorios justo antes del despliegue.

⚠️ **Hacerlo solo en el de Jacobo no sirve de nada.** Al poner en privado un repositorio
con bifurcaciones, GitHub **no las vuelve privadas: las separa y siguen públicas**. El código
quedaría igual de visible en el de Ana. Y el de Ana **no se puede poner en privado**: GitHub
lo impide expresamente por ser una bifurcación (comprobado el 2026-10-04).

**La única secuencia que funciona, y es un paquete, no un clic:**
1. Jacobo pone `eclipsseuniverse/ECLIPSSEINORBIT` en privado.
2. Ana **deja de usar una bifurcación**: o borra la suya y Jacobo la añade como colaboradora
   del repositorio original, o crea un repositorio propio y privado.
3. Reapuntar el `origin` local y comprobar que el despliegue sigue conectado a donde toca.

🔹 **La opción de «colaboradora en el de Jacobo» es la mejor a futuro**: además de resolver
la privacidad, **elimina el Pull Request entre repositorios** del punto anterior.

**Qué se gana:** que deje de verse la tabla de tarifas de envío, de la que se deducen los
costes de Jacobo. **No hay secretos en el repositorio** (`.env` ignorado, gitleaks en cada
commit, `01_DOCUMENTOS/` ignorado), así que no es una fuga: es discreción comercial.

## Cómo pasar a producción

⛔ **Esta sección queda sustituida por la migración a Cloudflare. No ejecutar todavía.**
Primero debe existir una versión de preview comprobada. La secuencia nueva será:

1. Adaptar y probar localmente TanStack Start para el runtime oficial de Cloudflare.
2. Crear una preview sin secretos live y comprobar SSR, checkout test y webhook con body
   crudo.
3. Configurar rate limiting solo en la creación de Checkout, cabeceras y observabilidad.
4. Cambiar la política de privacidad y documentación de Vercel a Cloudflare.
5. Configurar secretos, dominio y webhook live solo con autorización expresa.
6. Desconectar o pausar el despliegue automático de Vercel antes de integrar en `main`.

✅ **Dato resuelto el 2026-09-22:** la web está publicada en
`https://www.eclipssebrand.es/` y sirve la rama `main`.

- `SITE_URL` = `https://www.eclipssebrand.es`
- URL del webhook en Stripe = `https://www.eclipssebrand.es/api/stripe-webhook`

### ⚠️ Se trabaja sobre una BIFURCACIÓN — descubierto el 2026-10-04

```
eclipsseuniverse/ECLIPSSEINORBIT     ← el original, cuenta de Jacobo
        ↑ fork
afombuena-art/ECLIPSSEINORBIT        ← el de Ana, es a donde apunta `origin`
```

**Dos consecuencias que no estaban contempladas en esta checklist:**

**1 · Hace falta un Pull Request entre repositorios.** Subir la rama al `origin` de Ana **no** la acerca a producción: solo la guarda. Para que el trabajo llegue a la web hay que abrir un **PR de `afombuena-art` a `eclipsseuniverse`**, que Jacobo tendrá que aceptar. Es un paso extra, con su revisión, que conviene no descubrir el día del despliegue.

**2 · ✅ RESUELTO el 2026-10-04 mirando el panel de Vercel (Settings → Git).** Donde antes se decía que el despliegue estaba conectado a `afombuena-art` era **incorrecto**: se escribió el 2026-09-22, antes de saber que había una bifurcación.

```
Connected Git Repository:  eclipsseuniverse/ECLIPSSEINORBIT   (conectado el 2 de julio)
```

**Vercel vigila el repositorio de JACOBO, no el de Ana.** Consecuencias:

- ✅ **La bifurcación de Ana no despliega nada.** Subir cualquier rama a `origin`, incluida `main`, es inofensivo. Comprobado el 2026-10-04 subiendo 32 commits de `auditoria-preproduccion`.
- ⚠️ **El punto de riesgo real es aceptar el Pull Request en el repositorio de Jacobo.** Ese es el momento en que Vercel se entera y despliega; nada antes.
- ✅ **No hay deploy hooks** («This project does not have any deploy hooks»), así que no existe ninguna URL capaz de disparar un despliegue por su cuenta.

✅ **Confirmado también el 2026-10-04** en Settings → Environments:

| Entorno | Rama que sigue | Dominio |
|---|---|---|
| **Production** | **`main`** | **www.eclipssebrand.es** |
| Preview | todas las demás ramas | sin dominio propio |
| Development | solo por CLI | sin dominio propio |

Es decir: **el despliegue a producción lo dispara exactamente un merge a `main` de `eclipsseuniverse/ECLIPSSEINORBIT`**, y nada más.

⚠️ **Aun así, no aceptar el PR hasta tener Cloudflare preparado y decidido qué proveedor queda vinculado a producción.**

**1 · Integrar `auditoria-preproduccion` en `main` solo tras cerrar los bloqueantes, preparar
Cloudflare y recibir autorización expresa.** Tras registrar esta decisión, la rama va **80
commits por delante de `main` y 0 por detrás**; seis siguen solo en local. ⚠️ `CLAUDE.md` §9 prohíbe
`git push` directo a `main`.

**2 · Dar de alta el webhook en Stripe modo live**, apuntando al dominio servido por
Cloudflare cuando esté validado. **No existe ninguno** (comprobado). ⚠️ Genera un signing
secret distinto del de `stripe listen`.

**3 · Cargar los secretos y variables en Cloudflare**, cinco: `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `N8N_ORDER_WEBHOOK_URL`, `N8N_ORDER_WEBHOOK_SECRET` y `SITE_URL`.
No guardarlos como texto en el repositorio ni leerlos desde Claude Code.

⚠️ **`SITE_URL` no es un detalle.** De ahí salen las URLs de «pedido confirmado» y **las imágenes de producto que el cliente ve en la pantalla de pago de Stripe**. Si apunta a `localhost`, el comprador paga sin ver las fotos.

✅ **Metadatos centralizados el 2026-09-23.** `SITE_URL` sigue siendo una variable separada
para el checkout, pero las etiquetas públicas `og:url`, canonical, JSON-LD e imágenes
sociales salen de `src/data/site.ts`. Detalle en `CALIDAD.md`, hallazgos M-6 y M-7.

**4 · Limpiar Airtable.** Las compras de prueba del 2026-09-20 y 21 (a nombre de «ana» y «pepe rodriguez») están en **la tabla real**, la misma que usará la tienda. Borrarlas antes de abrir.

**5 · Una compra real de importe pequeño** con tarjeta de verdad, comprobar que llega a Airtable, y devolverla.

### Métodos de pago

✅ **Métodos de pago depurados el 2026-09-21.** Había **16 habilitados**, casi todos inútiles para una tienda que solo envía a España. Quedan **cinco**:

| Se queda | Por qué |
|---|---|
| **Tarjetas** | El principal |
| **Cartes Bancaires** | ⚠️ **No tocar.** No es un botón aparte, es una red de tarjetas francesa; desactivarlo podría impedir pagar a algunas tarjetas |
| **Apple Pay** | Es una tarjeta por debajo, **sin comisión extra** |
| **Google Pay** | Igual. ⚠️ Se desactivó por error y se volvió a habilitar |
| **Link** | Tarifa de tarjeta normal; agiliza la segunda compra de quien repite |

Desactivados: Klarna (decisión de Ana: más comisión y poco sentido en carritos de 24 €), Amazon Pay, Alipay, Pix, BLIK, Bancontact, EPS, MB WAY, Satispay, y los coreanos (Kakao Pay, Naver Pay, PAYCO, Samsung Pay, Tarjetas coreanas).

⚠️ **Apple Pay solo se ve en Safari sobre iPhone o Mac.** Que no cunda el pánico al no verlo desde Windows: es lo esperado.

✅ **Hecho en los dos entornos el 2026-09-21**: en el de prueba (`Entorno de prueba de eclipssebrand`) y en la cuenta real (`marca eclipse`), cinco métodos activos en cada uno. Los ajustes son independientes por entorno, así que **si algún día se cambia uno hay que cambiar el otro**.

🔹 **Efecto secundario bueno: desaparece un riesgo que estaba sin probar.** Algunos métodos son **asíncronos** (Klarna entre ellos): Stripe manda `checkout.session.completed` con `payment_status: "unpaid"` y confirma después con `async_payment_succeeded`. El webhook ya lo contempla desde el principio —sale antes si el pago está pendiente y escucha los dos eventos—, **pero nunca se probó**, porque todas las pruebas fueron con tarjeta, que es instantánea. Al quedar solo métodos síncronos, ese camino ya no se usa.

⚠️ **Si algún día se reactiva Klarna o cualquier método asíncrono, hay que probar ese camino antes**: una compra de prueba con él, comprobando que el pedido llega a Airtable una sola vez y solo cuando el pago se confirma de verdad. El síntoma de un fallo sería un pedido que no aparece, o que aparece como pagado sin estarlo.

### Tests automáticos — ✅ incorporados

El proyecto tiene `vitest`, script `test` y **90 pruebas** (2026-09-24) para catálogo, envío,
aviso de envío sin datos personales en logs, checkout, rate limiting y el estado del pedido
confirmado. `npm test` y `npm run typecheck` pasan. No sustituyen las pruebas reales de
Stripe, n8n, Airtable ni el runtime de Cloudflare en producción.

### ⚠️ Riesgo abierto: Jacobo editando productos

Los productos viven en `src/data/products.ts`, **código TypeScript**, no en un panel. Añadir
una prenda son ~25 líneas más tres imágenes con sus `import`. Ana planteó el 2026-09-21 que
Jacobo lo hiciera él y subiera los cambios a GitHub para que el alojamiento desplegara.
**No es seguro tal como está.** Cuatro riesgos reales:

1. ⚠️ **`priceCents` va en céntimos.** `2397` = 23,97 €. Si escribe `24` pensando en euros, **la tienda cobra 24 céntimos** y nadie se entera hasta que llegue el pedido.
2. **`weightGrams` decide el envío cobrado.** Mal puesto, se pierde dinero en portes.
3. Un error de sintaxis rompe el build. Molesto, pero visible.
4. ⚠️ **Un `id` repetido rompe el checkout en silencio**: se vende el producto equivocado sin que falle nada.

**Sin decidir. Depende de la frecuencia, que Ana aún no sabe (2026-09-21):**
- **Por drops, cada dos o tres meses** → que Jacobo pase la información y lo haga Ana. Cero infraestructura, cero riesgo.
- **Cambios semanales de precios o catálogo** → sacar los productos a **Airtable**, que él ya usa: rellena una tabla y la web lee de ahí. Son horas de trabajo, pero le da autonomía sin poder romper nada.

En cualquiera de los dos casos, **tests con comprobaciones de cordura** (ningún precio por debajo de 5 €, ningún peso a cero, ningún `id` repetido) cazarían el error de los céntimos antes de que llegue a la web.

### Cómo repetir las pruebas manuales

```
# Terminal 1 — servidor, puerto 5000
cd C:\Users\JACOBO\Documents\OFICINA_IACTIVAPRACTICA\01_PROYECTOS_ACTIVOS\04_ECLIPSSEINORBIT
npm run dev

# Terminal 2 — Stripe (cuenta: "Entorno de prueba de eclipssebrand", acct_1U92kk3pSwZ8rGo9)
stripe listen --forward-to localhost:5000/api/stripe-webhook
```

🔹 **Corrección del 2026-09-21:** el `whsec_` de `stripe listen` **NO cambia entre arranques** mientras sea la misma cuenta y la sesión de la CLI siga viva (verificado en la documentación de Stripe). Antes aquí ponía lo contrario. En la práctica: **basta con lanzar los dos comandos**, sin tocar el `.env` ni reiniciar nada.

⚠️ Solo si el `whsec_` que imprime **no coincide** con el del `.env` (por haber cerrado sesión o cambiado de cuenta) hay que actualizarlo **y reiniciar el servidor**. Si no coincide y no se actualiza, el webhook rechaza todo con «firma no válida» y parece que el código está roto cuando no lo está.

Tarjeta de prueba: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
Para la deduplicación: `stripe events resend <evt_ de checkout.session.completed>` — **no** los `evt_3U…`, que son eventos que el webhook ignora a propósito.

## Reglas y límites del proyecto

- No desplegar a producción sin autorización expresa de Ana.
- No usar claves reales de Stripe en pruebas: modo test y tarjetas de prueba. El 2026-09-20 Ana confirmó que `STRIPE_SECRET_KEY` empieza por `sk_test_`.
- Nunca `git push` directo a `main`. Todo vive en `auditoria-preproduccion` (antes `feature/stripe-integration`, que se quedó un commit atrás).
- Preguntar a Ana antes de instalar dependencias nuevas o tocar configuración de despliegue (`CLAUDE.md` §11).
- Para probar el flujo de pago de punta a punta, la herramienta es **playwright** (MCP instalado en la oficina para esto).

## Documentación

- `CLAUDE.md` de este proyecto — reglas técnicas, §10 es la checklist de pruebas y §11 cuándo parar y preguntar.
- `CALIDAD.md` — revisión estática de código del 2026-09-21. 22 hallazgos con fichero y línea, ordenados por prioridad. Solo diagnóstico.
- `SEGURIDAD.md` — revisión de seguridad. Cubre idempotencia, deduplicación, validación del origen del pedido y operación en producción. **`CALIDAD.md` no lo sustituye ni lo duplica.**
- `ESTADO_ACTUAL.md` — notas técnicas del 2026-08-29. ⚠️ Está desfasado respecto a este archivo; **si hay contradicción, manda este**.
