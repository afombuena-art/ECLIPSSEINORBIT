export const DESTINOS: Record<
  string,
  { cloudflareEnv: string | null; worker: string; descripcion: string }
>;
export function comprobarPaquete(
  config: unknown,
  destino: string,
): { ok: true } | { ok: false; motivo: string };
