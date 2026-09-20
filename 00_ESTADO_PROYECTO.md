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

## Estado de esos cambios — ⚠️ leer antes de seguir

- ✅ **Commiteado** el 2026-09-20: `0e30596`, en la rama `feature/stripe-integration`. El repo del proyecto está limpio.
- ⚠️ **Sin probar en ejecución.** No se ha hecho ni un pedido de prueba con este código. Compila, pero nadie lo ha visto funcionar.
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
8. **Tarifas de envío reales — SIGUE PENDIENTE.** `src/lib/shipping.ts` línea 12 lleva `TODO Ana`. Los tramos actuales (3,95 € – 12,90 €, por peso, en céntimos) **son inventados**.
   - El cliente confirmó el 2026-09-20 que envía por **Packlink PRO** y dijo «sacar tarifas de ahí», pero **esas tarifas están dentro de su cuenta y no son públicas**: dependen del volumen de cada cuenta. ⛔ **No usar precios genéricos de internet**: cada céntimo de desviación lo pierde él en cada envío.
   - Lo que hay que pedirle: captura de su simulador de Packlink PRO con el **precio por tramo de peso**. Si sus tramos no coinciden con los del código, se adapta el código a los suyos.
   - Además, `FREE_SHIPPING_THRESHOLD_CENTS = 7500` (envío gratis desde 75 €) **es una decisión suya, no una tarifa**: cada pedido por encima le cuesta el envío de su bolsillo. Que lo confirme.
   - Estado: el 2026-09-20 se le preparó a Ana el mensaje para pedírselo. **No consta enviado.**

### C · Legal y protección de datos — sin revisar

9. ✅ **Política de privacidad corregida el 2026-09-20.** Antes solo nombraba Stripe, Correos y Vercel; ahora declara los seis destinatarios reales: **Stripe, Correos y Packlink PRO, Vercel, iActivaPráctica, Hostinger y Airtable**. Se añadió además un párrafo que dice expresamente que Airtable es estadounidense y que los datos salen del EEE.

   ⚠️ **Contexto que manda sobre cualquier suposición: Jacobo es el marido de Ana.** Por eso no hay contrato de servicios ni de encargado del tratamiento entre ellos, y no hay que proponerlo. La base de datos de pedidos vive en la **cuenta de Airtable de iActivaPráctica (de Ana)**, decisión consciente del 2026-09-20; se revisará solo si la tienda crece.

   ⚠️ **PENDIENTE y es el único trámite previo a abrir: firmar el DPA de Airtable a nombre de iActivaPráctica.**
   - Formulario: `https://airtable.com/shrxzlIweOYYaBBuv` → llega por DocuSign → firmar y **guardar el PDF**.
   - **No es automático al registrarse**, hay que pedirlo (verificado el 2026-09-20 en la documentación de Airtable).
   - Lo firma **Ana con los datos de iActivaPráctica**, no Jacobo: la cuenta es de ella.
   - Al leerlo, comprobar que **incluye las cláusulas contractuales tipo**. La web ya las promete, así que hasta que se firme el texto publicado afirma algo sin respaldo.

   ⚠️ **PENDIENTE: el borrado.** La política promete conservar los datos «el tiempo necesario» y **en Airtable no borra nada nadie**. Hay que decidir plazos (orientación: facturación 6 años por obligación fiscal, datos de envío 3 años), escribirlos en el texto en vez del «tiempo necesario», y que alguien los aplique —a mano una vez al año o con un workflow de n8n—. No es urgente mientras no haya pedidos reales, pero conviene decidirlo antes de abrir.

   🔹 Detectado y **no tocado**: la política dice que también se tratan datos de quien escriba por **WhatsApp o Instagram**, lo que convierte a **Meta** en otro encargado no declarado.

   🔹 Aclaración: para gestionar el pedido **no hace falta consentimiento** (base legal: ejecución de contrato). El consentimiento solo aplica a marketing, y esa casilla (`marketingOptIn`) ya está separada y desmarcada por defecto. Correcto.

   ⚠️ Todo lo anterior es criterio técnico, **no dictamen jurídico**. No lo ha revisado un abogado ni el especialista Legal de la oficina.

## Bug abierto en n8n — sigue sin diagnosticar

- **Síntoma (2026-08-29):** al reenviar el evento `evt_1U9q0m3pSwZ8rGo9SvI6bh3A` con `stripe events resend`, se creó un **registro duplicado en Airtable con el mismo `eventId`**. La tabla estaba vacía antes de la prueba.
- **Diagnóstico pendiente:** abrir el historial de *Executions* de n8n, localizar esa ejecución y ver qué devolvió el nodo **«Buscar duplicado»**. El fallo está o en la búsqueda (filtro o campo equivocado) o en la condición del nodo **«¿Ya existe?»** (rama invertida).
- ⚠️ El conector de n8n **requiere autorización** y no estaba autorizado el 2026-09-20. Hay que activarlo en los ajustes de conectores de claude.ai antes de poder consultarlo desde Claude Code.

## Bloqueado por el cliente

- Datos fiscales (punto 7).
- Tarifas de envío reales (punto 8).

## Próxima acción

**Dos cosas, en este orden:**

**1 · Enviar al cliente la petición de tarifas de envío.** Los datos fiscales ya los dio y están puestos (punto 7). Falta su tabla de Packlink PRO por tramos de peso y que confirme el umbral de envío gratis. El mensaje se le redactó a Ana el 2026-09-20 pero **no consta enviado**. Es lo único que no depende de Ana, y por eso va primero.

**2 · Hacer el pedido de prueba** de la deduplicación. El entorno ya funciona, así que se retoma directamente aquí:

```
# Terminal 1 — servidor (arranca en el puerto 5000)
cd 01_PROYECTOS_ACTIVOS\04_ECLIPSSEINORBIT
npm run dev

# Terminal 2 — Stripe
stripe login          # la CLI NO estaba conectada el 2026-09-20; elegir la cuenta de ECLIPSSE
stripe listen --forward-to localhost:5000/api/stripe-webhook
```

⚠️ **El paso que rompe todo si se salta:** `stripe listen` devuelve un `whsec_...`. Ese valor debe ir al `.env` en `STRIPE_WEBHOOK_SECRET` **y hay que reiniciar el servidor**. Si no, el webhook rechaza todo con «firma no válida» y parece que el código está roto cuando no lo está.

Luego, en `http://localhost:5000`, comprar con la tarjeta `4242 4242 4242 4242` (fecha futura, CVC y CP cualquiera).

**Qué debe pasar, y es la prueba que importa:**
- Compra normal → 1 fila en Airtable.
- `stripe events resend evt_XXXX` → el servidor responde `duplicado` y registra `evento evt_... ya procesado`. **En Airtable sigue habiendo 1 sola fila.**
- Si aparecen 2 filas, la deduplicación no funciona y hay que mirar el código antes que n8n.

## Reglas y límites del proyecto

- No desplegar a producción sin autorización expresa de Ana.
- No usar claves reales de Stripe en pruebas: modo test y tarjetas de prueba. El 2026-09-20 Ana confirmó que `STRIPE_SECRET_KEY` empieza por `sk_test_`.
- Nunca `git push` directo a `main`. Todo vive en `feature/stripe-integration`.
- Preguntar a Ana antes de instalar dependencias nuevas o tocar configuración de despliegue (`CLAUDE.md` §11).
- Para probar el flujo de pago de punta a punta, la herramienta es **playwright** (MCP instalado en la oficina para esto).

## Documentación

- `CLAUDE.md` de este proyecto — reglas técnicas, §10 es la checklist de pruebas y §11 cuándo parar y preguntar.
- `ESTADO_ACTUAL.md` — notas técnicas del 2026-08-29. ⚠️ Está desfasado respecto a este archivo; **si hay contradicción, manda este**.
