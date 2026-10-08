/**
 * Despliegue a Cloudflare con el destino explícito y comprobado.
 *
 *   npm run deploy:preprod                 compila para preproducción y sube
 *   npm run deploy:preprod -- --ensayo     compila y comprueba, SIN subir nada
 *   npm run deploy:produccion              pide escribir PRODUCCION para continuar
 *
 * `npm run deploy` a secas ya no despliega: solo enseña esto.
 * Ver «Cómo desplegar en preproducción» en 00_ESTADO_PROYECTO.md.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { comprobarPaquete, DESTINOS } from "./despliegue-comprobar.mjs";

const [destino, ...banderas] = process.argv.slice(2);
const ensayo = banderas.includes("--ensayo");

function uso() {
  console.log(`
Uso:
  npm run deploy:preprod                   Compila y sube a PREPRODUCCIÓN
  npm run deploy:preprod -- --ensayo       Compila y comprueba, sin subir nada
  npm run deploy:produccion                Sube a PRODUCCIÓN (pide confirmación)

El destino se decide al compilar. Este comando lo fija y comprueba el paquete
antes de subirlo; si no coincide, no sube nada.
`);
}

function ejecutar(orden, args, env) {
  // Una sola cadena con shell: en Windows `npx` es un .cmd. Los argumentos son
  // constantes de este archivo, nunca datos externos. (Pasar un array junto con
  // `shell: true` está desaconsejado por Node: aviso DEP0190.)
  const r = spawnSync(`${orden} ${args.join(" ")}`, { stdio: "inherit", env, shell: true });
  if (r.status !== 0) {
    console.error(`
✖ «${orden} ${args.join(" ")}» ha fallado. No se ha subido nada.`);
    process.exit(r.status ?? 1);
  }
}

if (!DESTINOS[destino]) {
  uso();
  process.exit(destino ? 1 : 0);
}

const d = DESTINOS[destino];
console.log(`\n→ Destino: ${d.descripcion}${ensayo ? "  [ENSAYO: no se sube nada]" : ""}\n`);

if (destino === "produccion" && !ensayo) {
  if (!process.stdin.isTTY) {
    console.error(
      "✖ El despliegue a producción necesita una terminal interactiva para confirmarlo.",
    );
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resp = await rl.question(
    "Vas a sobrescribir la tienda REAL. Escribe PRODUCCION para continuar: ",
  );
  rl.close();
  if (resp.trim() !== "PRODUCCION") {
    console.error("✖ Cancelado. No se ha hecho nada.");
    process.exit(1);
  }
}

// El destino se fija AL COMPILAR: se pisa cualquier valor que viniera del entorno.
const env = { ...process.env };
if (d.cloudflareEnv) env.CLOUDFLARE_ENV = d.cloudflareEnv;
else delete env.CLOUDFLARE_ENV;

ejecutar("npx", ["vite", "build"], env);

let config = null;
try {
  config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
} catch {
  /* se informa abajo */
}
const veredicto = comprobarPaquete(config, destino);
if (!veredicto.ok) {
  console.error(`\n✖ PAQUETE INCORRECTO: ${veredicto.motivo}.\n  No se sube nada.`);
  process.exit(1);
}
console.log(`\n✔ El paquete apunta a «${d.worker}». Se puede subir.\n`);

ejecutar("npx", ["wrangler", "deploy", ...(ensayo ? ["--dry-run"] : [])], env);
console.log(
  ensayo ? "\n✔ Ensayo terminado: no se ha subido nada." : `\n✔ Desplegado en «${d.worker}».`,
);
