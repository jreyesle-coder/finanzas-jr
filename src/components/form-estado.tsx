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
