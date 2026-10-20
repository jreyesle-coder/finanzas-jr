import Link from "next/link";
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

export function Progreso({ valor, color = "bg-emerald-500" }: { valor: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, valor * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Etiqueta({ children, tono = "gris" }: { children: ReactNode; tono?: "gris" | "verde" | "ambar" | "rojo" | "azul" }) {
  const tonos = {
    gris: "bg-slate-100 text-slate-600",
    verde: "bg-emerald-50 text-emerald-700",
    ambar: "bg-amber-50 text-amber-800",
    rojo: "bg-red-50 text-red-700",
    azul: "bg-sky-50 text-sky-700",
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${tonos[tono]}`}>{children}</span>;
}

export function EncabezadoAccion({ titulo, subtitulo, href, texto = "Nuevo" }: { titulo: string; subtitulo?: string; href: string; texto?: string }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{titulo}</h1>
        {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
      </div>
      <Link href={href} className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white active:bg-slate-700">
        + {texto}
      </Link>
    </header>
  );
}

export function Volver({ href, texto = "Volver" }: { href: string; texto?: string }) {
  return (
    <Link href={href} className="mb-3 inline-block text-sm text-slate-500">
      ‹ {texto}
    </Link>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{texto}</p>;
}

export function SelectorMes({ base, mes, anterior, siguiente, titulo }: { base: string; mes: string; anterior: string; siguiente: string; titulo: string }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-2 py-1.5" data-mes={mes}>
      <Link href={`${base}?mes=${anterior}`} className="rounded-lg px-3 py-1 text-lg text-slate-500" aria-label="Mes anterior">
        ‹
      </Link>
      <span className="text-sm font-semibold">{titulo}</span>
      <Link href={`${base}?mes=${siguiente}`} className="rounded-lg px-3 py-1 text-lg text-slate-500" aria-label="Mes siguiente">
        ›
      </Link>
    </div>
  );
}
