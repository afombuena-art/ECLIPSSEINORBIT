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

⚠️ **Pendiente de revisar, no bloquea: los 7 segundos.** La entrega buena tardó 7 s en responder a Stripe (20:03:51 → 20:03:58). Dentro de ese tiempo caben: releer la sesión expandida, el POST a n8n (timeout propio de 12 s), la escritura en Airtable y el `paymentIntents.update` de la marca. Stripe corta los webhooks lentos, así que **hoy va sobrado pero sin mucho margen**: si n8n o Airtable se ralentizan, Stripe reintentará. No es grave —para eso está la deduplicación— pero conviene medir de dónde vienen esos segundos y, si hace falta, bajar `N8N_TIMEOUT_MS` o aligerar el workflow de n8n. **Verificar antes el límite real de Stripe, que no está confirmado.**

⚠️ **Pendiente de mirar: `pending_webhooks: 2`.** El evento reenviado indicaba **dos** destinos pendientes, no uno. Uno es el `stripe listen` local. **Hay que mirar en el panel de Stripe → Desarrolladores → Webhooks qué otro endpoint está dado de alta.** Si hubiera uno apuntando directamente a n8n, existiría un camino paralelo hacia Airtable que la deduplicación de este código **no cubre**.
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

   **Tres validaciones, no una:** el navegador calcula para mostrar, `checkout.server.ts` **recalcula la zona en el servidor** (el cliente se puede manipular) y el webhook compara la zona cobrada con el CP que acabó recogiendo Stripe. Si no coinciden, el pedido llega a n8n con `envio.revisar: true` y se avisa en el log. No bloquea —el pago ya se hizo— pero se ve antes de enviar.

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

   ⚠️ **PENDIENTE: el borrado.** La política promete conservar los datos «el tiempo necesario» y **en Airtable no borra nada nadie**. Hay que decidir plazos (orientación: facturación 6 años por obligación fiscal, datos de envío 3 años), escribirlos en el texto en vez del «tiempo necesario», y que alguien los aplique —a mano una vez al año o con un workflow de n8n—. No es urgente mientras no haya pedidos reales, pero conviene decidirlo antes de abrir.

   🔹 Detectado y **no tocado**: la política dice que también se tratan datos de quien escriba por **WhatsApp o Instagram**, lo que convierte a **Meta** en otro encargado no declarado.

   🔹 Aclaración: para gestionar el pedido **no hace falta consentimiento** (base legal: ejecución de contrato). El consentimiento solo aplica a marketing, y esa casilla (`marketingOptIn`) ya está separada y desmarcada por defecto. Correcto.

   ⚠️ Todo lo anterior es criterio técnico, **no dictamen jurídico**. No lo ha revisado un abogado ni el especialista Legal de la oficina.

## Bug abierto en n8n — sigue sin diagnosticar

- **Síntoma (2026-08-29):** al reenviar el evento `evt_1U9q0m3pSwZ8rGo9SvI6bh3A` con `stripe events resend`, se creó un **registro duplicado en Airtable con el mismo `eventId`**. La tabla estaba vacía antes de la prueba.
- **Diagnóstico pendiente:** abrir el historial de *Executions* de n8n, localizar esa ejecución y ver qué devolvió el nodo **«Buscar duplicado»**. El fallo está o en la búsqueda (filtro o campo equivocado) o en la condición del nodo **«¿Ya existe?»** (rama invertida).
- ⚠️ El conector de n8n **requiere autorización** y no estaba autorizado el 2026-09-20. Hay que activarlo en los ajustes de conectores de claude.ai antes de poder consultarlo desde Claude Code.

## Bloqueado por el cliente

Nada. Los datos fiscales y las tarifas de envío llegaron el 2026-09-20 y ya están aplicados.

## Próxima acción

**El código está terminado y probado. Lo que queda son trámites y decisiones, no programación.**

**1 · ✅ DPA de Airtable — FIRMADO el 2026-09-20.** Ver punto 9.

**2 · Mirar los webhooks dados de alta en Stripe** (panel → Desarrolladores → Webhooks). El `pending_webhooks: 2` sugiere que hay otro endpoint además del local. Si apunta a n8n, hay un camino paralelo sin deduplicar.

**3 · Decidir los plazos de conservación** y sustituir el «tiempo necesario» de la política de privacidad por plazos concretos. Orientación: facturas 6 años (obligación fiscal), datos de envío 3 años. Y que alguien los aplique de verdad: hoy **nada borra nada en Airtable**.

**4 · Confirmar con Jacobo dos cosas de la tabla de envíos:** que las limítrofes son solo Cádiz, Huelva, Córdoba y Málaga (dijo «aproximadamente», y Badajoz no está), y que está de acuerdo con que no haya envío gratis.

**5 · Revisar los 7 segundos del webhook** (ver arriba). No bloquea.

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
