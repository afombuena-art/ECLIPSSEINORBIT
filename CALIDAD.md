# CALIDAD — Revisión estática de código de ECLIPSSEINORBIT

**Fecha:** 2026-09-21 · **Rama revisada:** `auditoria-preproduccion` (último commit `b294526`)
**Revisión complementaria:** 2026-09-21
**Alcance:** todo `src/` escrito a mano: 40 ficheros y 3.839 líneas físicas, contando
comentarios y líneas en blanco, y excluyendo `src/components/ui/`, `src/routeTree.gen.ts` y
`src/assets/`. También se revisaron `package.json`, `tsconfig.json`, `vite.config.ts`,
`eslint.config.js`, `.gitignore`, `.env.example`, `.githooks/` y `scripts/`.
**Fuera de alcance:** `src/components/ui/` (48 ficheros de shadcn sin tocar), `src/routeTree.gen.ts` (generado), `node_modules/`, el workflow de n8n y la configuración real de Vercel y Stripe, que no se pueden leer desde aquí.

**No se ha modificado código ni configuración; solo se ha ampliado este informe.** Todo
hallazgo de aquí está verificado leyendo el código citado; cuando algo no se ha podido
comprobar, se dice expresamente.

---

## 🔹 Resumen

| Severidad | Nº | Qué significa |
|---|---|---|
| 🔴 Alta | 0 | No se ha demostrado un fallo de calidad que por sí solo cause cobro erróneo, pérdida de pedido o indisponibilidad general |
| 🟠 Media | 10 | Falla en casos límite reales, muestra información incorrecta o queda visiblemente mal en la web publicada |
| 🟡 Baja | 12 | Deuda técnica, duplicación, incoherencias de contenido |

Está comprobado que los importes se recalculan en el servidor, el webhook verifica firma,
hay CSRF en las server functions y no se han encontrado secretos en el repositorio. No debe
concluirse por ello que no quedan problemas de arquitectura: `SEGURIDAD.md` documenta
pendientes de idempotencia, deduplicación, validación del origen del pedido y operación en
producción. Este informe se limita a calidad de código y experiencia visible.

---

## 🟠 MEDIA

### M-10 · Un pedido que no se puede enviar muestra «Envío: Gratis» y un total falso

**Fichero:** [src/lib/shipping.ts:141-148](src/lib/shipping.ts#L141-L148)

```ts
export function calcShippingCents(items, subtotalCents, zone = "peninsula"): number {
  const quote = quoteShipping(items, subtotalCents, zone);
  return quote.ok ? quote.cents : 0;   // ← el fallo: "no se puede enviar" se traduce a "cero euros"
}
```

`quoteShipping` está bien diseñada: devuelve `{ ok: false, reason: "demasiado-peso" }` para no inventarse un precio. Pero `calcShippingCents` convierte ese «no lo sé» en **0**, y ese 0 es el que se pinta:

- [src/lib/cart.tsx:96](src/lib/cart.tsx#L96) — `shippingCents` del contexto del carrito.
- [src/components/CartSheet.tsx:111](src/components/CartSheet.tsx#L111) — `shippingCents === 0 ? "Gratis" : ...`
- [src/routes/checkout.tsx:67-69](src/routes/checkout.tsx#L67-L69) — mientras no haya código postal escrito, `quote` es `null` y se cae a ese mismo `shippingCents`.

**Caso concreto que falla:** el carrito acepta hasta 99 unidades por línea ([cart.tsx:13](src/lib/cart.tsx#L13)). 99 camisetas × 220 g = **21.780 g**, por encima de los 15.000 g de la tabla. El cliente ve en el panel del carrito:

```
Subtotal       2.373,03 €
Envío (estimado)    Gratis      ← falso: no es gratis, es que no se puede enviar
Total          2.373,03 €
```

Y sigue viendo «Gratis» en el checkout hasta que escribe las cinco cifras del código postal; solo entonces aparece el aviso correcto de «Pedido demasiado grande». El servidor sí lo bloquea después ([checkout.server.ts:73-77](src/lib/checkout.server.ts#L73-L77)), así que **no se cobra de menos**, pero se le enseña un total que no existe.

El servidor bloquea el pedido antes de cobrar, por lo que el impacto es de información y
experiencia de compra, no de cobro incorrecto. Se clasifica como **medio**, no alto.

**Arreglo:** que `calcShippingCents` devuelva `number | null` y que los tres puntos de pintado distingan «gratis» de «no disponible», como ya hace `checkout.tsx` cuando conoce la zona. El texto correcto ya está escrito en [checkout.tsx:149-154](src/routes/checkout.tsx#L149-L154); es cuestión de que llegue también al panel lateral.

---

### M-1 · El primer cerrojo de deduplicación no protege de entregas simultáneas

**Ficheros:** [src/routes/api.stripe-webhook.ts:66](src/routes/api.stripe-webhook.ts#L66) · [src/lib/webhook-dedup.server.ts:78](src/lib/webhook-dedup.server.ts#L78)

`seenInMemory(event.id)` se consulta al entrar, pero `remember(event.id)` solo se ejecuta dentro de `markForwarded`, es decir **después** de que n8n haya confirmado. Entre la comprobación y la marca hay varios segundos (la propia llamada a n8n, medida en 3,7 s según `00_ESTADO_PROYECTO.md`).

Si Stripe entrega el mismo evento dos veces en esa ventana —o alguien pulsa «reenviar» dos veces— ambas ejecuciones pasan la comprobación en memoria, ambas leen la metadata *antes* de que ninguna escriba, y **las dos reenvían el pedido a n8n**.

No es catastrófico: la deduplicación por `eventId` de n8n sigue detrás y es la que evita el duplicado en Airtable. Pero el comentario del fichero vende este cerrojo como una barrera que en concurrencia no lo es. Marcar al entrar y desmarcar si n8n falla tampoco sería garantía suficiente: un proceso serverless puede terminar entre ambas operaciones. El `Set` debe describirse como optimización para duplicados secuenciales; la garantía debe estar en una operación persistente y atómica, coordinada con M-8 de `SEGURIDAD.md`.

### M-2 · La caché de eventos vistos se borra entera al llenarse

**Fichero:** [src/lib/webhook-dedup.server.ts:33-36](src/lib/webhook-dedup.server.ts#L33-L36)

```ts
if (seenInThisInstance.size >= SEEN_MAX) seenInThisInstance.clear();
```

Al llegar a 500 se tira **todo**, incluido el evento procesado hace un segundo, no los más antiguos. Justo después del borrado, la primera barrera está ciega. Con el volumen previsto (unidades limitadas, pocos pedidos) es improbable, pero no se ha medido en producción. Un `Set` mantiene orden de inserción: se puede obtener el valor más antiguo, comprobar que existe y eliminar solo ese, sin vaciar toda la caché.

### M-3 · El checkout traga el motivo real del error y ofrece un reintento que nunca funcionará

**Fichero:** [src/routes/checkout.tsx:80-87](src/routes/checkout.tsx#L80-L87)

```ts
} catch {
  setSubmitError("No se ha podido iniciar el pago. Inténtalo de nuevo en unos segundos.");
}
```

El `catch` no captura el error, descarta el mensaje. `checkout.server.ts` lanza cuatro errores distintos y **tres de ellos son permanentes**: producto retirado del catálogo ([checkout.server.ts:32](src/lib/checkout.server.ts#L32)), talla que ya no existe ([:35](src/lib/checkout.server.ts#L35)) y código postal fuera de cobertura ([:61-66](src/lib/checkout.server.ts#L61-L66)). Ante cualquiera de ellos el cliente lee «inténtalo de nuevo en unos segundos» y entra en un bucle: el reintento dará exactamente el mismo error siempre.

El mensaje de fuera de cobertura está además escrito con cuidado en el servidor («Escríbenos por WhatsApp y gestionamos tu pedido de otra manera») y **nunca se muestra a nadie**. La UI lo filtra antes, por código postal, así que ese camino es difícil de alcanzar; los dos de catálogo no.

**Arreglo:** no enviar al navegador excepciones internas sin filtrar. Definir errores públicos
estables (`PRODUCTO_NO_DISPONIBLE`, `TALLA_NO_DISPONIBLE`, `FUERA_DE_COBERTURA`,
`ERROR_TEMPORAL`) y traducirlos a mensajes accionables. Los fallos desconocidos deben seguir
mostrando el mensaje genérico y conservar el detalle solo en el log del servidor.

### M-4 · El carrito no valida la talla, y una talla obsoleta deja el carrito bloqueado

**Fichero:** [src/lib/cart.tsx:45-65](src/lib/cart.tsx#L45-L65) y [:114-123](src/lib/cart.tsx#L114-L123)

`readStorage` comprueba que el producto siga existiendo (`.filter((l) => getProductById(l.id))`) pero **no comprueba la talla** contra `product.sizes`. `add()` tampoco. El servidor sí lo hace, y lanza.

**Caso concreto:** alguien añade una `XL` hoy; el catálogo se edita y esa talla desaparece (los productos viven en código, `products.ts`, y se editan a mano — ver `00_ESTADO_PROYECTO.md:295`). La línea sobrevive en `localStorage`, se pinta con normalidad, el botón «Ir a pagar» está activo, y cada intento de pago muere en el servidor con el mensaje genérico del hallazgo M-3. El cliente puede eliminar la línea o reducir su cantidad desde el carrito, pero **la interfaz no le dice qué producto o talla debe corregir**; no necesita vaciar todo el carrito ni borrar el navegador.

Arreglo pequeño: añadir a `readStorage` un `.filter((l) => getProductById(l.id)?.sizes.includes(l.size))`. Cuesta una línea y cierra el caso.

### M-5 · La cuenta atrás de la portada está caducada: marca 00:00:00:00

**Fichero:** [src/components/DropCountdown.tsx:4](src/components/DropCountdown.tsx#L4)

```ts
const TARGET = new Date("2026-09-01T00:00:00");
```

Esa fecha pasó hace veinte días. `getTimeLeft()` devuelve todo ceros desde el 1 de septiembre, así que la sección de la página de la marca muestra un contador congelado en `00 : 00 : 00 : 00` bajo el texto «El tiempo que queda para el fin del verano». En una tienda que vende por drops y escasez, un contador a cero es peor que no tener contador.

Dos decisiones que tomar, no una: qué fecha va ahí, y **qué debe pasar cuando venza** (ocultar la sección, cambiar el texto, apuntar al siguiente drop). Ahora mismo no hay ninguna rama para ese caso.

Aparte, la fecha se construye sin zona horaria, así que se interpreta en hora **local**: el servidor de Vercel (UTC) y un navegador en España (UTC+2) calculan valores distintos. Aquí no se nota porque el componente no pinta hasta montar en el cliente (`mounted`, línea 50) y lleva `suppressHydrationWarning`, pero si se reactiva el contador con una fecha futura conviene escribirla como `2027-06-21T00:00:00+02:00`.

### M-6 · El dominio está escrito a mano ocho veces en cuatro ficheros, y es justo el dato que falta

**Ficheros:** [src/routes/index.tsx:23](src/routes/index.tsx#L23) y [:31](src/routes/index.tsx#L31) · [src/routes/eclipssebrand.tsx:30](src/routes/eclipssebrand.tsx#L30) y [:40](src/routes/eclipssebrand.tsx#L40) · [src/routes/personaliza.tsx:27](src/routes/personaliza.tsx#L27) y [:38](src/routes/personaliza.tsx#L38) · [src/routes/__root.tsx:84](src/routes/__root.tsx#L84) y [:115](src/routes/__root.tsx#L115)

`https://www.eclipssebrand.es/` aparece literal en ocho etiquetas (`og:url`, `canonical` y el JSON-LD). Mientras tanto, `00_ESTADO_PROYECTO.md:17` dice que el proyecto está bloqueado precisamente porque **nadie ha confirmado si la web está publicada ni en qué dominio**.

Si el despliegue acaba sirviéndose desde otro dominio —un `*.vercel.app`, o el dominio con otra forma—, cada página publicada le dirá a Google «la versión buena de esta página está en eclipssebrand.es», que puede no existir o no ser esa. Consecuencia: **la tienda real se desindexa a favor de una URL equivocada**, y es un fallo lento y difícil de relacionar con la causa.

El mismo dato vive además en `SITE_URL` (env). Debería salir de un solo sitio. Cuando se sepa el dominio, revisar los ocho puntos a la vez.

### M-7 · Las imágenes de vista previa al compartir no funcionan

**Fichero:** [src/routes/prendas.$slug.tsx:36-39](src/routes/prendas.$slug.tsx#L36-L39)

```ts
...(p ? [{ property: "og:image" as const, content: p.front }] : []),
{ property: "og:url", content: `/prendas/${params.slug}` },
```

`p.front` es una ruta **relativa** (`/images/camiseta_azul_back.jpeg`). Open Graph exige URL absoluta: WhatsApp, Instagram y Twitter no resuelven rutas relativas y no muestran imagen. `og:url` tiene el mismo problema en esa línea, mientras que las demás rutas sí lo ponen absoluto (M-6) — o sea que el proyecto hace las dos cosas.

Además, [`__root.tsx`](src/routes/__root.tsx#L85) declara `twitter:card: summary_large_image` **sin ningún `og:image` global**. Traducción práctica: compartir la portada o la tienda por WhatsApp —el canal principal de esta marca, según su propio FAQ— produce una tarjeta gris sin foto.

### M-8 · Aceptar o rechazar cookies puede petar y dejar el banner pegado

**Fichero:** [src/components/CookieBanner.tsx:16-24](src/components/CookieBanner.tsx#L16-L24)

La **lectura** está protegida (`try/catch`, líneas 7-14, con el comentario «localStorage unavailable»). La **escritura** no:

```ts
const accept = () => {
  localStorage.setItem("cookie_consent", "accepted");   // puede lanzar
  setVisible(false);                                    // no se ejecuta si lanza
};
```

La API de almacenamiento puede lanzar, por ejemplo por cuota agotada, almacenamiento
restringido o una política del navegador. Si `setItem` lanza, el `setVisible(false)` de la
línea siguiente no se ejecuta: **el banner no se cierra por mucho que pulses**, y tapa la
parte baja de la pantalla, incluido el botón de pagar en móvil. No se ha reproducido en un
navegador concreto durante esta revisión; el hallazgo se deriva del camino de error del
código. La lectura ya está protegida y falta aplicar el mismo patrón a las dos escrituras.

### M-9 · La tienda anuncia cinco camisetas y vende cuatro

**Ficheros:** [src/routes/eclipssebrand.tsx:54](src/routes/eclipssebrand.tsx#L54) · [src/data/products.ts:36-157](src/data/products.ts#L36-L157)

El texto de la historia dice: *«DROP 008 — IN ORBIT: Colección para el Verano de 2026 de **5 camisetas oversize** ... y una gorra vintage»*. El catálogo tiene cuatro camisetas (azul, orbit, sun, gris) más la gorra.

No es un descuadre de redacción: en `src/assets/` están los tres ficheros `camiseta_granate_front / _back` con sus `url` apuntando a `/images/camiseta_granate_*.jpeg`, **sin producto que los importe**. O falta dar de alta la camiseta granate, o sobra el «5» del texto. Alguien lo dejó a medias y las dos mitades siguen publicadas.

---

## 🟡 BAJA

**B-1 · El consentimiento se lee para ocultar el banner, pero no gobierna ninguna carga.** [CookieBanner.tsx:7-24](src/components/CookieBanner.tsx#L7-L24) — `cookie_consent` sí se consulta al montar el componente: si existe `accepted` o `rejected`, el banner no vuelve a mostrarse. Lo que no existe es ninguna diferencia funcional entre aceptar y rechazar, ni ningún recurso condicionado por el valor. [legal.cookies.tsx:16-19](src/routes/legal.cookies.tsx#L16-L19) declara que solo hay cookies técnicas exentas de consentimiento; en ese caso, presentar dos decisiones sin efecto es confuso. Es una decisión de negocio y cumplimiento, no un fallo técnico demostrado.

**B-2 · Google Fonts contradice la política de cookies.** [__root.tsx:97-102](src/routes/__root.tsx#L97-L102) carga tipografías desde `fonts.googleapis.com` y `fonts.gstatic.com`, con `preconnect`. No instala cookies, pero envía la IP del visitante a Google en cada carga, mientras la política afirma que el sitio «no utiliza cookies de analítica ni de publicidad **de terceros**». No es falso literalmente; sí es incompleto. Alojar las dos fuentes en `/public` lo cierra y además acelera la carga.

**B-3 · `front` y `back` están cruzados en el catálogo.** [products.ts:43-44](src/data/products.ts#L43-L44) y equivalentes en las cuatro camisetas: `front: azulBack.url, back: azul.url`. El campo `front` apunta al asset `_back` y viceversa. Está hecho igual en los cuatro productos, así que probablemente sea deliberado (los ficheros llegaron mal nombrados) — pero `front` es el que se usa como imagen del producto en el carrito, en el checkout, en la rejilla y **en la pantalla de pago de Stripe** ([checkout.server.ts:44](src/lib/checkout.server.ts#L44)). Merece una comprobación visual: si se está enseñando la espalda de la camiseta como foto principal, es un error caro. En la gorra el cruce es distinto (`back: gorraModel.url`, la foto de modelo), lo que refuerza la sospecha de que el nombrado es ruido.

**B-4 · Código muerto en el cálculo de envío.** [shipping.ts:133](src/lib/shipping.ts#L133) — `SHIPPING_TABLE.find(...) ?? SHIPPING_TABLE[0]`. El `??` es inalcanzable: seis líneas antes ya se ha devuelto `demasiado-peso` para todo lo que excede el último tramo, así que `find` siempre encuentra. Sobra, y de paso disimula que el caso ya estaba tratado.

**B-5 · La URL de WhatsApp está copiada cuatro veces.** [ContactCTA.tsx:3](src/components/ContactCTA.tsx#L3), [WhatsAppButton.tsx:12](src/components/WhatsAppButton.tsx#L12), [checkout.tsx:14](src/routes/checkout.tsx#L14), [prendas.$slug.tsx:12](src/routes/prendas.$slug.tsx#L12). El email `eclipssebrand@gmail.com` está repetido en seis ficheros más. Cuando cambie el número —y en una marca joven cambia—, hay que acordarse de cuatro sitios. Un `src/data/contacto.ts` lo resuelve.

**B-6 · Efecto secundario dentro del render.** [__root.tsx:42](src/routes/__root.tsx#L42) — `console.error(error)` está en el cuerpo de `ErrorComponent`, no en un efecto o en el manejador central. Se ejecuta en cada render y puede duplicarse durante comprobaciones de desarrollo con Strict Mode; no se ha demostrado que se duplique en producción.

**B-7 · Dos `setTimeout` sin limpiar.** [index.tsx:43-45](src/routes/index.tsx#L43-L45) (680 ms antes de navegar) y [prendas.$slug.tsx:82-84](src/routes/prendas.$slug.tsx#L82-L84) (50 ms antes de hacer scroll). Si el componente se desmonta antes, el callback corre igual sobre algo que ya no está. En el segundo caso es inocuo (`?.`); en el primero puede provocar una navegación que el usuario ya no quería.

**B-8 · Códigos postales en los logs.** [api.stripe-webhook.ts:138](src/routes/api.stripe-webhook.ts#L138) — `console.warn` vuelca `avisoEnvio`, que incluye el CP cobrado y el de entrega. Los logs de Vercel se conservan y son accesibles a quien tenga el proyecto. Es un dato personal de baja sensibilidad y la traza es útil, pero conviene que esté decidido a propósito y recogido en el plazo de conservación de la política de privacidad, no que aparezca por defecto.

**B-9 · Un `as` que el compilador no puede verificar.** [api.stripe-webhook.ts:71](src/routes/api.stripe-webhook.ts#L71) — `event.data.object as Stripe.Checkout.Session`. En la práctica es seguro porque va después del filtro `RELEVANT_EVENTS`, que solo deja pasar eventos de sesión; pero si mañana alguien añade un tipo de evento a ese `Set` sin mirar, la aserción deja de ser cierta y el fallo aparece en tiempo de ejecución, en producción, dentro del webhook. Un `switch` sobre `event.type` daría el estrechamiento de tipo gratis.

**B-10 · No hay tests automáticos ni scripts `test` o `typecheck`.** [package.json:6-13](package.json#L6-L13) — hay `dev`, `build`, `preview`, `lint` y `format`; no hay `test` ni `typecheck`, y no existe ningún fichero de prueba en el proyecto. `zoneFromPostalCode` y `quoteShipping` son lógica pura y buenos primeros candidatos. `webhook-dedup.server.ts` también debe probarse, pero requiere controlar estado en memoria y simular Stripe; no se presupone aquí el tiempo necesario.

**B-11 · La página de error está en inglés.** [error-page.ts:6-22](src/lib/error-page.ts#L6-L22) — *«This page didn't load / Something went wrong on our end»*, con los botones *Try again* y *Go home*, en una tienda íntegramente en español. Se sirve desde [server.ts:34](src/server.ts#L34) y [start.ts:18](src/start.ts#L18), o sea en el peor momento posible: cuando algo ya ha fallado.

**B-12 · Enlace con recarga completa dentro del banner.** [CookieBanner.tsx:41](src/components/CookieBanner.tsx#L41) — `<a href="/legal/cookies">` en vez de `<Link to=...>`. Recarga la página entera y reinicializa el estado en memoria; el carrito se recupera de `localStorage`, así que no se pierde, pero el salto y la rehidratación son innecesarios.

---

## ⚪ No comprobado en esta revisión

Este documento es una revisión estática. No equivale a QA funcional, visual ni de
producción. Antes de declarar la tienda lista faltan evidencias de:

- **Build y tipos:** no se ha ejecutado `npm run build` ni un `tsc --noEmit` documentado.
  No existe script `typecheck` y `npm run lint` está roto por los `overrides` descritos en
  `SEGURIDAD.md` y `00_ESTADO_PROYECTO.md`.
- **Pruebas funcionales actuales:** carrito, cantidades límite, talla retirada, código
  postal inválido, pérdida de red, doble clic, retorno desde Stripe y errores de n8n en un
  preview que contenga exactamente el código candidato a producción.
- **QA visual responsive:** apertura y capturas reales en móvil, tablet y escritorio. En
  particular, contador, banner de cookies, carrito, checkout, errores y páginas legales.
- **Accesibilidad:** navegación solo con teclado, orden y visibilidad del foco, nombres
  accesibles, contraste, zoom, mensajes de error y una comprobación con lector de pantalla.
- **Compatibilidad:** Chrome, Firefox, Safari y Edge. M-8 se deriva del código, pero no se ha
  reproducido en esos navegadores.
- **Rendimiento:** Lighthouse/Core Web Vitals, peso y dimensiones de imágenes, carga de
  fuentes y comportamiento en red lenta.
- **SEO y compartición reales:** canonicals, sitemap, robots, JSON-LD, `og:url`, `og:image`
  y tarjetas de WhatsApp u otras redes sobre el dominio definitivo. La lectura del código
  detecta M-6 y M-7, pero no sustituye una prueba contra una URL publicada.
- **Enlaces y rutas:** recorrido automático o manual de enlaces internos, 404, correo,
  WhatsApp, Instagram y textos legales. Que los enlaces de este informe apunten a ficheros
  existentes no prueba los enlaces de la web.
- **Servicios externos:** configuración real de Vercel, Stripe, n8n y Airtable. Se cubren
  por separado en `SEGURIDAD.md` y en la lista de puesta en producción.

Hasta completar esas comprobaciones, el estado correcto es **revisión estática terminada;
QA visual y funcional pendiente**.

---

## ✅ Comprobaciones estáticas sin hallazgos

Estas búsquedas de texto se hicieron expresamente y **no dieron resultado**; conviene que
consten sin confundirlas con ejecución o pruebas:

- **Sin `TODO`, `FIXME`, `HACK` ni `XXX`** en todo `src/`.
- **Sin claves ni secretos en el código**: ni `sk_test`, ni `sk_live`, ni `pk_`, ni `whsec_`. Los cinco únicos accesos a configuración pasan por `process.env`.
- **Sin `localhost` ni `http://`** en `src/` (la única coincidencia es el namespace XML de un SVG).
- **Sin `.env` en el historial de git**: el único fichero `.env*` que se ha commiteado nunca es `.env.example`. `.gitignore:10-13` está bien puesto y el hook de `gitleaks` está **activo** (`core.hooksPath = .githooks`, verificado).
- **Las cinco variables de entorno están declaradas**, tanto en `.env` (comprobado por Ana el 2026-09-21) como en `.env.example`. En la primera versión de este informe se dijo lo contrario: era un error de la revisión, no del proyecto. El patrón de búsqueda usado (`^[A-Z_]+=`) no admitía dígitos y por eso no veía `N8N_ORDER_WEBHOOK_URL` ni `N8N_ORDER_WEBHOOK_SECRET`. La documentación de entorno está correcta y coincide con `00_ESTADO_PROYECTO.md:255`.
- **Sin `any` escrito a mano, ni `@ts-ignore`, ni `@ts-expect-error`.** Los trece `as any` están todos en `routeTree.gen.ts`, que es generado y no se toca. `tsconfig.json` tiene `strict: true`.
- **Ningún `console.log`**: los catorce registros son `error`, `warn` o `info` deliberados, con texto explicativo. Solo uno lleva dato personal (B-8).
- **Ninguna promesa sin `await` ni `catch` que se trague un fallo en silencio** en la ruta del dinero: las llamadas a Stripe, el `fetch` a n8n y el `markForwarded` están todas envueltas, y cada rama devuelve el código HTTP que corresponde al contrato de reintentos.

## ✅ Bien resuelto, para que no se rompa al tocarlo

Tres decisiones del código que están mejor de lo habitual y que **conviene no deshacer** en el arreglo de los hallazgos de arriba:

1. **Los importes se recalculan en el servidor.** [checkout.server.ts:28-78](src/lib/checkout.server.ts#L28-L78) no usa ni un solo número del navegador: precio, talla y zona salen del catálogo y del CP revalidado. Es lo que hace que M-10 sea un problema de lo que se *muestra*, no de lo que se *cobra*.
2. **El contrato de reintentos del webhook es explícito y correcto.** 400 para firma inválida, 200 para irrelevante o duplicado, 5xx solo cuando el pedido no llegó a n8n. Está documentado en el propio fichero, líneas 20-24, y el código lo cumple.
3. **`markForwarded` nunca lanza.** [webhook-dedup.server.ts:99-106](src/lib/webhook-dedup.server.ts#L99-L106) — si Stripe rechaza la escritura de la marca, se registra y se sigue, porque el pedido ya está entregado y un fallo aquí provocaría un reintento y un duplicado. Es un detalle fácil de «limpiar» por error en una refactorización.

---

## 🔗 Relación con `SEGURIDAD.md`

`SEGURIDAD.md` revisa el mismo código desde el riesgo de pagos y producción. Sus hallazgos
no se suman al recuento de esta revisión para evitar duplicarlos, pero varios también afectan
a la calidad del producto:

- La clave de idempotencia cambia en cada intento: un reintento puede crear otra sesión.
- La deduplicación cubre el mismo `event.id`, no dos Event distintos para la misma sesión.
- El webhook no exige una marca que demuestre que la sesión pertenece a esta tienda.
- `/pedido/confirmado` afirma que el pago se recibió sin comprobarlo.
- Las notas libres se copian a metadata de Stripe sin advertencia de minimización.

Por ello, este informe no puede concluir que los problemas restantes sean solo cosméticos o
de casos límite. Para una decisión de producción deben leerse juntos `CALIDAD.md`,
`SEGURIDAD.md` y `00_ESTADO_PROYECTO.md`.

---

## 🔹 Orden sugerido

0. **Resolver primero los bloqueantes de `SEGURIDAD.md`.** Este orden solo prioriza los
   hallazgos de calidad; no autoriza producción por sí mismo.
1. **M-6**, cuando se sepa el dominio: `SITE_URL`, las ocho etiquetas y el alta del endpoint
   de Stripe en modo live salen todos del mismo dato. Es lo que desbloquea la publicación.
2. **M-5** — el contador a cero es visible en la portada. Hay que decidir fecha y conducta al
   vencer, no sustituirla por otra fecha inventada.
3. **M-10 + M-3 + M-4** — los tres son el mismo tema: qué ve el cliente cuando el carrito no
   se puede procesar.
4. **M-9, M-7, M-8** — contenido, compartición y cierre del banner.
5. **Recuperar lint, añadir typecheck y decidir tests** de `shipping.ts`; después cubrir la
   deduplicación con dobles y concurrencia controlada.
6. **Ejecutar la matriz funcional, visual, responsive, accesible y de navegadores** de la
   sección «No comprobado» sobre un preview candidato a producción.

`CALIDAD.md` y `SEGURIDAD.md` siguen sin versionar en esta rama. Este informe no sustituye
las pruebas pendientes ni actualiza el estado oficial del proyecto.
