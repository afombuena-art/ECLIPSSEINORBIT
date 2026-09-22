import { defineConfig } from "vitest/config";

// Configuración aparte de `vite.config.ts` a propósito: las pruebas solo
// necesitan resolver los alias `@/...`, no montar el servidor de TanStack Start
// ni el adaptador de Vercel. Así arrancan en un segundo.
export default defineConfig({
  resolve: {
    // Lee los alias de `tsconfig.json` (`@/*` → `./src/*`) sin plugins.
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
