# Estado del proyecto · ECLIPSSEINORBIT

**Última actualización:** 2026-09-12
**Tipo:** integración de Stripe para tienda online
**Estado:** activo — **no está en producción**
**Ingresos confirmados:** no confirmados
**Compromiso o fecha:** ninguno confirmado

> Este archivo manda sobre la memoria, sobre conversaciones anteriores y sobre cualquier suposición. Si algo aquí contradice lo que se recuerda, gana lo que está escrito aquí.

## Situación

Convertir la web en tienda online integrando Stripe. Stack: **TanStack + Vite**, `stripe ^22.6.0`.

Archivos clave:
- `src/routes/checkout.tsx`
- `src/lib/stripe.server.ts`, `src/lib/checkout.server.ts`, `src/lib/checkout-schema.ts`
- `src/routes/api.stripe-webhook.ts` — **endpoint público**

El proyecto tiene **su propio repositorio git**, excluido del de la oficina.

## ⚠️ Pendiente antes de pasar a producción

Verificado el 2026-09-12, sin revisar aún el código del webhook:

1. **Verificación de la firma de Stripe** (`stripe.webhooks.constructEvent` con el signing secret). Sin ella, cualquiera puede enviar un «pago confirmado» falso al endpoint, que es público.
2. **Idempotencia.** Stripe reintenta los webhooks: si el mismo evento llega dos veces, no puede procesarse ni entregarse dos veces.
3. ⚠️ **El proyecto no tiene ni un test** — sin script `test` en `package.json`, sin archivos `.test.` ni `.spec.` en `src`.

✅ Comprobado y correcto: el `.env` está en `.gitignore` y **no está trackeado** en git.

## Próxima acción

Revisar el webhook (puntos 1 y 2) antes de que la web pase a producción. Aplazado por Ana el 2026-09-12.

## Reglas y límites del proyecto

- No desplegar a producción sin autorización expresa de Ana.
- No usar claves reales de Stripe en pruebas: modo test y tarjetas de prueba.
- Para probar el flujo completo de pago de punta a punta, la herramienta es **playwright** (MCP instalado en la oficina precisamente para esto).

## Documentación

- `CLAUDE.md` y `ESTADO_ACTUAL.md` de este proyecto.
