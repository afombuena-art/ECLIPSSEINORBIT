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

⚠️ **Autorizado sí, comprobado no:** después de autorizarlo no se llegó a arrancar el servidor. **Lo primero de la próxima sesión es comprobar que `npm run dev` levanta.**

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

7. **Datos fiscales.** Hay **10 huecos sin rellenar**. Vender sin esto incumple la LSSI-CE.
   - `src/routes/legal.aviso-legal.tsx` líneas 21, 23, 25, 27 → `[RAZÓN SOCIAL]`, `[NIF/CIF]`, `[DOMICILIO FISCAL]`, `[DATOS REGISTRALES SI APLICA]`
   - `src/routes/legal.privacidad.tsx` línea 21 → razón social, NIF, domicilio
   - `src/routes/legal.terminos.tsx` líneas 18-19 → razón social, NIF, domicilio
   - Si el titular es autónomo, `[DATOS REGISTRALES SI APLICA]` se elimina.
   - ⚠️ El único contacto en las tres páginas es `eclipssebrand@gmail.com`. Legal, pero da mala imagen en una tienda. Comentárselo.
8. **Tarifas de envío reales.** `src/lib/shipping.ts` línea 12 lleva `TODO Ana`. Los tramos actuales (3,95 € – 12,90 €, por peso, en céntimos) **son inventados**. Hace falta su tarifa real de Correos / Packlink PRO por tramos de peso.
   - Además, `FREE_SHIPPING_THRESHOLD_CENTS = 7500` (envío gratis desde 75 €) **es una decisión suya, no una tarifa**: cada pedido por encima le cuesta el envío de su bolsillo. Que lo confirme.

### C · Legal y protección de datos — sin revisar

9. ⚠️ **La política de privacidad no declara a dónde van de verdad los datos.**
   - `src/routes/legal.privacidad.tsx` línea 47 solo nombra **Stripe, Correos y Vercel** como encargados del tratamiento.
   - Pero el webhook envía **nombre, email, teléfono y dirección postal** del comprador a **n8n** (instancia en EasyPanel) y de ahí a **Airtable**. Ninguno de los dos está declarado.
   - Qué falta: (a) añadirlos al texto, (b) contrato de encargado del tratamiento con Airtable — **empresa de EEUU**, verificar que su DPA incluye cláusulas contractuales tipo, (c) decidir plazo de borrado, porque **hoy nada borra nada en Airtable**.
   - Aclaración: para gestionar el pedido **no hace falta consentimiento** (base legal: ejecución de contrato). El consentimiento solo aplica a marketing, y esa casilla (`marketingOptIn`) ya está separada y desmarcada por defecto. Correcto.

## Bug abierto en n8n — sigue sin diagnosticar

- **Síntoma (2026-08-29):** al reenviar el evento `evt_1U9q0m3pSwZ8rGo9SvI6bh3A` con `stripe events resend`, se creó un **registro duplicado en Airtable con el mismo `eventId`**. La tabla estaba vacía antes de la prueba.
- **Diagnóstico pendiente:** abrir el historial de *Executions* de n8n, localizar esa ejecución y ver qué devolvió el nodo **«Buscar duplicado»**. El fallo está o en la búsqueda (filtro o campo equivocado) o en la condición del nodo **«¿Ya existe?»** (rama invertida).
- ⚠️ El conector de n8n **requiere autorización** y no estaba autorizado el 2026-09-20. Hay que activarlo en los ajustes de conectores de claude.ai antes de poder consultarlo desde Claude Code.

## Bloqueado por el cliente

- Datos fiscales (punto 7).
- Tarifas de envío reales (punto 8).

## Próxima acción

**Tres cosas, en este orden:**

1. **Escribir al cliente** pidiéndole los cinco datos: razón social, NIF/CIF, domicilio fiscal, datos registrales (si es sociedad) y tarifa real de Correos por tramos de peso. Es lo único que no depende de Ana, y por eso va primero. *(No se hizo el 2026-09-20; el correo no está redactado ni enviado.)*
2. **Comprobar que `npm run dev` arranca** ahora que `node.exe` está autorizado. Si da `EPERM` en `node_modules\.vite`, borrar esa carpeta (es solo caché, se regenera) y repetir.
3. **Hacer el pedido de prueba** con la deduplicación nueva y comprobar que `stripe events resend` no duplica la fila en Airtable. La CLI de Stripe necesita `stripe login` (no estaba conectada el 2026-09-20) y el `whsec_` que da `stripe listen` debe ir al `.env` antes de arrancar el servidor.

## Reglas y límites del proyecto

- No desplegar a producción sin autorización expresa de Ana.
- No usar claves reales de Stripe en pruebas: modo test y tarjetas de prueba. El 2026-09-20 Ana confirmó que `STRIPE_SECRET_KEY` empieza por `sk_test_`.
- Nunca `git push` directo a `main`. Todo vive en `feature/stripe-integration`.
- Preguntar a Ana antes de instalar dependencias nuevas o tocar configuración de despliegue (`CLAUDE.md` §11).
- Para probar el flujo de pago de punta a punta, la herramienta es **playwright** (MCP instalado en la oficina para esto).

## Documentación

- `CLAUDE.md` de este proyecto — reglas técnicas, §10 es la checklist de pruebas y §11 cuándo parar y preguntar.
- `ESTADO_ACTUAL.md` — notas técnicas del 2026-08-29. ⚠️ Está desfasado respecto a este archivo; **si hay contradicción, manda este**.
