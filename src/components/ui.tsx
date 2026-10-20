import type { ReactNode } from "react";

export function Encabezado({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-xl font-semibold">{titulo}</h1>
      {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
    </header>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>{children}</section>;
}

export function Proximamente({ sprint, texto }: { sprint: number; texto: string }) {
  return (
    <Tarjeta className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sprint {sprint}</p>
      <p className="mt-1 text-sm text-slate-600">{texto}</p>
    </Tarjeta>
  );
}
