"use client";

import { useActionState, type ReactNode } from "react";

export type EstadoForm = { ok?: string; error?: string };

/** Formulario con mensaje de éxito/error para server actions. */
export function FormEstado({
  accion,
  children,
  boton = "Guardar",
}: {
  accion: (prev: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  children: ReactNode;
  boton?: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  return (
    <form action={enviar} className="space-y-4">
      {children}
      {estado.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      {estado.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{estado.ok}</p>}
      <button disabled={pendiente} className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white disabled:opacity-60">
        {pendiente ? "Guardando…" : boton}
      </button>
    </form>
  );
}

export function Campo({ etiqueta, ayuda, ...props }: { etiqueta: string; ayuda?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
      />
      {ayuda && <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>}
    </label>
  );
}

const claseControl =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";

export function Selector({
  etiqueta,
  opciones,
  ayuda,
  ...props
}: { etiqueta: string; opciones: { valor: string; texto: string }[]; ayuda?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <select {...props} className={claseControl}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {ayuda && <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>}
    </label>
  );
}

export function Casilla({ etiqueta, ayuda, ...props }: { etiqueta: string; ayuda?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
      <input type="checkbox" {...props} className="mt-0.5 h-5 w-5 accent-emerald-600" />
      <span>
        <span className="block text-sm font-medium text-slate-700">{etiqueta}</span>
        {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
      </span>
    </label>
  );
}

export function AreaTexto({ etiqueta, ...props }: { etiqueta: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <textarea rows={2} {...props} className={claseControl} />
    </label>
  );
}

export function Dos({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
