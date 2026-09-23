/** Dominio público canónico confirmado para la tienda. No contiene secretos. */
export const SITE_ORIGIN = "https://www.eclipssebrand.es";

/** Convierte una ruta pública en la URL absoluta que necesitan buscadores y redes. */
export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
