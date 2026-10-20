"use client";

import { useActionState, useState } from "react";
import type { EstadoForm } from "@/components/form-estado";

type Props = {
  accion: (p: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  categoriasGasto: string[];
  categoriasIngreso: string[];
  cuentas: { id: string; nombre: string }[];
  hoy: string;
};

/** Registro en pocos toques: monto → categoría → guardar. */
export function RegistroRapido({ accion, categoriasGasto, categoriasIngreso, cuentas, hoy }: Props) {
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const categorias = tipo === "gasto" ? categoriasGasto : categoriasIngreso;

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="tipo" value={tipo} />
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        {(["gasto", "ingreso"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`rounded-lg py-2 text-sm font-semibold ${tipo === t ? (t === "gasto" ? "bg-white text-red-600 shadow" : "bg-white text-emerald-700 shadow") : "text-slate-500"}`}
          >
            {t === "gasto" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-emerald-600">
        <select name="moneda" defaultValue="DOP" className="bg-transparent text-sm font-medium text-slate-500 outline-none" aria-label="Moneda">
          <option value="DOP">RD$</option>
          <option value="USD">US$</option>
        </select>
        <input
          name="monto"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-label="Monto"
          className="cifra w-full bg-transparent text-3xl font-semibold outline-none"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Categoría</legend>
        <div className="flex flex-wrap gap-2" key={tipo}>
          {categorias.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="categoria" value={c} className="peer sr-only" />
              <span className="block rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white">
                {c}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Fecha</span>
          <input name="fecha" type="date" defaultValue={hoy} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Cuenta</span>
          <select name="cuentaId" defaultValue="" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base">
            <option value="">—</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input name="nota" placeholder="Nota (opcional)" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base" />

      {estado.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      {estado.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{estado.ok}</p>}
      <button disabled={pendiente} className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white active:bg-emerald-700 disabled:opacity-60">
        {pendiente ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
