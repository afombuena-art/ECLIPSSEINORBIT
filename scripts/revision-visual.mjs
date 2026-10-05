/**
 * Revisión visual rápida con Playwright. Herramienta de QA, no es parte de la web.
 *
 * Con el servidor de desarrollo arrancado (`npm run dev`, puerto 5000):
 *
 *   node scripts/revision-visual.mjs
 *   node scripts/revision-visual.mjs http://localhost:4173    # otra URL
 *
 * Qué comprueba, en escritorio y en móvil, sobre las páginas principales:
 *   - que nada se salga de la pantalla (desborde horizontal)
 *   - que no haya errores en la consola del navegador
 *   - qué cajas con borde, fondo, imagen o control siguen con esquinas rectas
 *
 * Deja capturas en `tmp-capturas/` (ignorada por git) para mirarlas a ojo.
 *
 * ⚠️ No sustituye la QA completa de preproducción (18 comprobaciones responsive,
 * accesibilidad, Firefox/Safari): es el chequeo de ida y vuelta mientras se
 * trabaja el diseño.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5000";
const SALIDA = "./tmp-capturas";
mkdirSync(SALIDA, { recursive: true });

const vistas = [
  { nombre: "escritorio", ancho: 1440, alto: 900 },
  { nombre: "movil", ancho: 390, alto: 844 },
];

const paginas = [
  { ruta: "/", id: "entrada" },
  { ruta: "/eclipssebrand", id: "tienda" },
  { ruta: "/prendas/camiseta-azul", id: "ficha" },
  { ruta: "/personaliza", id: "personaliza" },
  { ruta: "/checkout", id: "checkout" },
];

const navegador = await chromium.launch();
const problemas = [];
const cuadradas = new Map();

for (const v of vistas) {
  const ctx = await navegador.newContext({
    viewport: { width: v.ancho, height: v.alto },
    deviceScaleFactor: 2,
  });
  const p = await ctx.newPage();

  const errores = [];
  p.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  p.on("pageerror", (e) => errores.push(String(e)));

  for (const pg of paginas) {
    await p.goto(BASE + pg.ruta, { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(600);

    const desborde = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (desborde > 2) problemas.push(`${pg.id} @${v.nombre}: desborde horizontal de ${desborde}px`);

    if (v.nombre === "escritorio") {
      const cajas = await p.evaluate(() => {
        const fuera = new Set();
        for (const el of document.querySelectorAll(
          "div,section,button,a,img,input,textarea,aside",
        )) {
          const s = getComputedStyle(el);
          if (s.borderRadius !== "0px") continue;
          const c = el.getBoundingClientRect();
          if (c.width < 80 || c.height < 40) continue;
          const borde = s.borderTopWidth !== "0px" || s.borderBottomWidth !== "0px";
          const fondo = !["rgba(0, 0, 0, 0)", "transparent"].includes(s.backgroundColor);
          const control = ["IMG", "BUTTON", "INPUT", "TEXTAREA"].includes(el.tagName);
          if (!borde && !fondo && !control) continue;
          const clase = typeof el.className === "string" ? el.className.split(" ").slice(0, 3).join(".") : "";
          fuera.add(`${el.tagName.toLowerCase()}.${clase}`.slice(0, 90));
        }
        return [...fuera];
      });
      cuadradas.set(pg.id, cajas);
    }

    await p.screenshot({ path: `${SALIDA}/${pg.id}-${v.nombre}.png` });
  }

  if (errores.length) problemas.push(`errores de consola @${v.nombre}: ${errores.slice(0, 3).join(" | ")}`);
  await ctx.close();
}
await navegador.close();

console.log("\n=== PROBLEMAS ===");
console.log(problemas.length ? problemas.map((x) => "  ⚠️  " + x).join("\n") : "  ninguno");

console.log("\n=== CAJAS CON ESQUINAS RECTAS (escritorio) ===");
console.log("  Muchas son correctas a propósito: secciones a todo el ancho, cabecera fija, marquee.");
for (const [id, lista] of cuadradas) {
  console.log(`\n  ${id}: ${lista.length}`);
  for (const c of lista.slice(0, 8)) console.log("     " + c);
}
