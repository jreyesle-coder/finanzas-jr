// Freno de fuerza bruta en el login: 5 intentos fallidos por usuario+IP bloquean 15 minutos.
const MAX = 5;
const VENTANA_MS = 15 * 60_000;
const intentos = new Map<string, { n: number; desde: number }>();

export function bloqueado(clave: string) {
  const e = intentos.get(clave);
  if (!e) return 0;
  if (Date.now() - e.desde > VENTANA_MS) {
    intentos.delete(clave);
    return 0;
  }
  return e.n >= MAX ? Math.ceil((VENTANA_MS - (Date.now() - e.desde)) / 60_000) : 0;
}

export function fallo(clave: string) {
  const e = intentos.get(clave);
  if (!e || Date.now() - e.desde > VENTANA_MS) intentos.set(clave, { n: 1, desde: Date.now() });
  else e.n++;
}

export function exito(clave: string) {
  intentos.delete(clave);
}
