"use client";

import { useTransition } from "react";

/** Botón que ejecuta una server action tras confirmar (borrar, revertir…). */
export function BotonConfirmar({
  accion,
  mensaje,
  children,
  className = "text-sm font-medium text-red-600",
}: {
  accion: () => Promise<unknown>;
  mensaje: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      className={`${className} disabled:opacity-50`}
      onClick={() => {
        if (confirm(mensaje)) iniciar(async () => void (await accion()));
      }}
    >
      {pendiente ? "…" : children}
    </button>
  );
}
