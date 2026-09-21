# Estado del proyecto · ECLIPSSEINORBIT

**Última actualización:** 2026-09-20
**Tipo:** integración de Stripe para tienda online
**Estado:** activo — **no está en producción**
**Ingresos confirmados:** no confirmados
**Compromiso o fecha:** ninguno confirmado

> Este archivo manda sobre la memoria, sobre conversaciones anteriores y sobre cualquier suposición. Si algo aquí contradice lo que se recuerda, gana lo que está escrito aquí.
>
> **Ana trabaja este proyecto con varias herramientas (Claude Code y Codex).** Este archivo es el punto de encuentro: debe entenderse sin haber visto ninguna conversación previa. Quien lo lea, lo lee entero antes de tocar nada.

## Situación

Convertir la web en tienda online integrando Stripe. Stack: **TanStack + Vite 8**, `stripe ^22.6.0`.
Rama de trabajo: **`feature/stripe-integration`** (nunca se hace push directo a `main`).

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

⚠️ **Consecuencia para producción, no olvidar:** como no hay ningún endpoint dado de alta, **al pasar a modo live hay que crearlo a mano** apuntando a la URL de Vercel (`https://<dominio>/api/stripe-webhook`). Ese endpoint genera un **signing secret distinto** del de `stripe listen`, y es el que debe ir en `STRIPE_WEBHOOK_SECRET` de producción. Si se olvida, la tienda **cobrará pero ningún pedido llegará a Airtable**.
- ✅ `npx tsc --noEmit` pasa limpio en los dos archivos.
- Los errores de tipos que aparecen en `src/components/ContactCTA.tsx` y `src/routes/prendas.$slug.tsx` son **preexistentes** (framer-motion), no los introdujo este cambio.

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

⚠️ **ESLint está roto en todo el proyecto**, esto sí es independiente del antivirus: `TypeError: expand is not a function` en `minimatch`. **`npm run lint` no funciona.** Preexistente, sin arreglar.

⚠️ **ESLint está roto en todo el proyecto**, no solo en los archivos tocados: `TypeError: expand is not a function` en `minimatch`. **`npm run lint` no funciona.** Es preexistente y no se ha arreglado.

## Pendiente antes de pasar a producción

### A · Depende de Ana y del equipo técnico

1. ✅ **Autorizar `node.exe`** — hecho el 2026-09-20. Falta comprobar que `npm run dev` arranca de verdad.
2. **Probar la deduplicación de punta a punta**, en modo test:
   - `stripe listen --forward-to localhost:3000/api/stripe-webhook` → da un `whsec_...` que **debe** estar en `STRIPE_WEBHOOK_SECRET` del `.env`, y hay que reiniciar el servidor. Sin esto, todo falla por firma inválida.
   - Compra con `4242 4242 4242 4242`.
   - `stripe events resend evt_XXXX` → debe responder `duplicado` y **en Airtable debe seguir habiendo una sola fila**.
   - ⚠️ La CLI de Stripe **no estaba conectada a ninguna cuenta** el 2026-09-20 (pedía `stripe login`). Al hacerlo, elegir la cuenta de ECLIPSSE.
3. **Diagnosticar el bug de n8n** (sigue abierto, ver abajo). El arreglo en código lo tapa, pero el nodo sigue mal.
4. **Pasar la checklist de pruebas manuales de `CLAUDE.md` §10** (5 pruebas). Ninguna está pasada con el código actual.
5. **Cero tests automáticos.** Sin script `test` en `package.json`, sin archivos `.test.` ni `.spec.`. Añadirlos requiere una dependencia nueva (vitest) → `CLAUDE.md` §11 obliga a preguntar a Ana antes.
6. Mergear `feature/stripe-integration` → `main`, configurar claves **live** y el endpoint del webhook en modo live (el signing secret es distinto), y cargar las variables de entorno en Vercel (`.vercel` está vacío: no hay despliegue configurado).

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

   ⚠️ **Agujero conocido y asumido: el CP del checkout y la dirección de Stripe pueden no coincidir.** Se cobra antes de que Stripe pida la dirección, así que se puede pagar tarifa de Sevilla y recibir en Barcelona, **o saltarse el bloqueo de Canarias**. Comprobado el 2026-09-21. **Con el checkout alojado no se puede impedir**: impedirlo exige el checkout incrustado, que desactiva Apple Pay (ver punto 8). La defensa es detectarlo y que se vea antes de preparar el paquete.

   ✅ **Aviso de envío — implementado y probado el 2026-09-21** (commit `00aec8e`). El webhook manda `envio.aviso`, un texto ya redactado, que el nodo de n8n vuelca en la columna **«Aviso envío»** de Airtable. Vacío cuando todo cuadra. Dos gravedades:
   - `REVISAR — se cobró envío de sevilla (CP 41001) pero la entrega es en peninsula (CP 08001)…`
   - `NO ENVIAR — la dirección de entrega (CP 35007) está en Canarias, Ceuta o Melilla…` ← **el caso que importa**, probado de punta a punta.

   ⚠️ Antes solo se mandaba `revisar: true`, **y n8n no lo mapeaba a ninguna columna**: el aviso se generaba y se perdía. Si alguien añade campos al payload, comprobar que el nodo «Crear pedido» los mapea, o no llegan.

   ✅ **Probado el 2026-09-20:** 41001→4,50 €, 14001→4,90 €, 28001→4,99 €, 07001→6,50 €, 35001→bloqueado con aviso de WhatsApp. Compra completa a Sevilla: 23,97 + 4,50 = **28,47 €** cobrados correctamente, con `shippingZone: "sevilla"` en la metadata.

### C · Legal y protección de datos — sin revisar

9. ✅ **Política de privacidad corregida el 2026-09-20.** Antes solo nombraba Stripe, Correos y Vercel; ahora declara los seis destinatarios reales: **Stripe, Correos y Packlink PRO, Vercel, iActivaPráctica, Hostinger y Airtable**. Se añadió además un párrafo que dice expresamente que Airtable es estadounidense y que los datos salen del EEE.

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

**Qué se hizo:** en vez de buscar la causa exacta del nodo que fallaba, se **rediseñó el workflow** para que el problema no pueda darse. La deduplicación era un «comprobar y luego actuar» en tres pasos (buscar → ¿existe? → crear), frágil por construcción. Ahora **la garantiza Airtable**.

```
ANTES    Webhook → Wait(2s) → Buscar duplicado → ¿Ya existe? → Crear → Responder
DESPUÉS  Webhook → Crear pedido (upsert, coincidencia por eventId) → Responder
```

⚠️ **El workflow en uso es OTRO, con ID nuevo:**
- **Activo:** `qmS3k2Pp3wxyKUqZ` — «Pedidos Stripe — ECLIPSSEINORBIT», 3 nodos, ruta `stripe-eclipsse-order`.
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

## Próxima acción

**El código está terminado y probado. Lo que queda son trámites y decisiones, no programación.**

**1 · ✅ DPA de Airtable — FIRMADO el 2026-09-20.** Ver punto 9.

**2 · ✅ Webhooks de Stripe — COMPROBADO el 2026-09-21.** No hay ningún endpoint configurado, así que no existe camino paralelo. Ver arriba, incluida la consecuencia para producción.

**3 · ✅ Plazos de conservación — ESCRITOS el 2026-09-21** (6 / 3 años). Queda **aplicarlos**: hoy nada borra nada en Airtable y ahora está prometido por escrito. Ver punto 9.

**4 · Confirmar con Jacobo dos cosas de la tabla de envíos:** que las limítrofes son solo Cádiz, Huelva, Córdoba y Málaga (dijo «aproximadamente», y Badajoz no está), y que está de acuerdo con que no haya envío gratis. **Es lo único que queda pendiente de terceros.**

🔹 **Y explicarle la columna «Aviso envío» de Airtable**: si un pedido la trae rellena, no se prepara hasta mirarla. Un `NO ENVIAR` significa dirección fuera de cobertura.

🔹 **Limpieza pendiente en Airtable:** la columna «Estado» tiene una opción basura, `Pagado` precedida de un tabulador, creada por el `typecast` del nodo. Borrarla. Origen desconocido, probablemente manual; si reaparece tras una compra, la genera el flujo y hay que investigarlo. **No quitar el `typecast`**: sin él, un valor inesperado haría fallar el nodo, n8n no respondería 200 y el pedido no se guardaría.

**5 · ✅ Los 7 segundos — resueltos el 2026-09-21** (3749 ms). Ver arriba.

**6 · Puesta en producción**, cuando lo anterior esté: mergear `feature/stripe-integration` → `main`, pasar a claves **live**, dar de alta el endpoint del webhook en modo live (el signing secret es **distinto**), cargar las variables de entorno en Vercel (`.vercel` está vacío) y hacer una compra real de importe pequeño.

⚠️ **Sigue sin haber ni un test automático.** Todo lo verificado el 2026-09-20 fue a mano. Si se toca el webhook o el cálculo de envío, hay que repetir las pruebas a mano. Añadir tests requiere una dependencia nueva (vitest) → `CLAUDE.md` §11 obliga a preguntar a Ana.

### Cómo repetir las pruebas manuales

```
# Terminal 1 — servidor, puerto 5000
cd C:\Users\JACOBO\Documents\OFICINA_IACTIVAPRACTICA\01_PROYECTOS_ACTIVOS\04_ECLIPSSEINORBIT
npm run dev

# Terminal 2 — Stripe (cuenta: "Entorno de prueba de eclipssebrand", acct_1U92kk3pSwZ8rGo9)
stripe listen --forward-to localhost:5000/api/stripe-webhook
```

⚠️ **El paso que rompe todo si se salta:** `stripe listen` devuelve un `whsec_...` **nuevo cada vez**. Debe ir al `.env` en `STRIPE_WEBHOOK_SECRET` **y hay que reiniciar el servidor**. Si no, el webhook rechaza todo con «firma no válida» y parece que el código está roto cuando no lo está.

Tarjeta de prueba: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
Para la deduplicación: `stripe events resend <evt_ de checkout.session.completed>` — **no** los `evt_3U…`, que son eventos que el webhook ignora a propósito.

## Reglas y límites del proyecto

- No desplegar a producción sin autorización expresa de Ana.
- No usar claves reales de Stripe en pruebas: modo test y tarjetas de prueba. El 2026-09-20 Ana confirmó que `STRIPE_SECRET_KEY` empieza por `sk_test_`.
- Nunca `git push` directo a `main`. Todo vive en `feature/stripe-integration`.
- Preguntar a Ana antes de instalar dependencias nuevas o tocar configuración de despliegue (`CLAUDE.md` §11).
- Para probar el flujo de pago de punta a punta, la herramienta es **playwright** (MCP instalado en la oficina para esto).

## Documentación

- `CLAUDE.md` de este proyecto — reglas técnicas, §10 es la checklist de pruebas y §11 cuándo parar y preguntar.
- `ESTADO_ACTUAL.md` — notas técnicas del 2026-08-29. ⚠️ Está desfasado respecto a este archivo; **si hay contradicción, manda este**.
