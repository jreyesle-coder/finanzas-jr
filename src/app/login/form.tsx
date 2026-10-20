"use client";

import { useActionState } from "react";
import { iniciarSesion, type EstadoLogin } from "./actions";

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(iniciarSesion, {});
  return (
    <form action={accion} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Usuario</span>
        <input
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="julio"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Contraseña</span>
        <input
          name="clave"
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
        />
      </label>
      {estado.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      <button
        disabled={pendiente}
        className="w-full rounded-xl bg-slate-900 py-3 text-base font-semibold text-white active:bg-slate-800 disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
