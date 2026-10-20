import Link from "next/link";
import { prisma } from "@/lib/db";
import { resumenMensual } from "@/lib/resumen";
import { aDOP, dinero, fecha } from "@/lib/format";
import { EncabezadoAccion, Etiqueta, Tarjeta, Vacio, Volver } from "@/components/ui";

export default async function IngresosPage() {
  const [r, ingresos] = await Promise.all([
    resumenMensual(),
    prisma.ingreso.findMany({ orderBy: [{ activo: "desc" }, { bolsillo: "asc" }, { diaDelMes: "asc" }] }),
  ]);
  const grupos = [
    { clave: "manejable", titulo: "Bolsillo manejable", ayuda: "Lo que realmente pueden mover" },
    { clave: "auto_debitado", titulo: "Bolsillo auto-debitado", ayuda: "Entra y se va solo en auto-débitos" },
  ];

  return (
    <>
      <Volver href="/mas" texto="Más" />
      <EncabezadoAccion titulo="Ingresos" subtitulo="Recurrentes y puntuales" href="/ingresos/nuevo" texto="Ingreso" />

      <Tarjeta className="mb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500">Total mensual</p>
            <p className="cifra text-lg font-semibold">{dinero(r.ingresosTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Disponible manejable</p>
            <p className={`cifra text-lg font-semibold ${r.disponibleManejable >= 0 ? "text-emerald-700" : "text-red-600"}`}>{dinero(r.disponibleManejable)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Manejable {dinero(r.ingresosManejables)} · auto-debitado {dinero(r.ingresosAuto)}. El disponible descuenta gastos y cuotas que salen del bolsillo manejable.
        </p>
      </Tarjeta>

      {ingresos.length === 0 && <Vacio texto="No hay ingresos registrados." />}

      {grupos.map((g) => {
        const lista = ingresos.filter((i) => i.bolsillo === g.clave);
        if (!lista.length) return null;
        return (
          <section key={g.clave} className="mb-4">
            <h2 className="text-sm font-semibold">{g.titulo}</h2>
            <p className="mb-2 text-xs text-slate-500">{g.ayuda}</p>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {lista.map((i) => (
                <li key={i.id}>
                  <Link href={`/ingresos/${i.id}`} className={`flex items-center justify-between gap-2 px-4 py-3 active:bg-slate-50 ${i.activo ? "" : "opacity-50"}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {i.frecuencia === "puntual" ? (i.fecha ? `Puntual · ${fecha(i.fecha)}` : "Puntual") : i.diaDelMes ? `Día ${i.diaDelMes}` : "Sin día fijo"}
                        {!i.activo && " · inactivo"}
                      </p>
                      {i.porVerificar && <Etiqueta tono="ambar">Por verificar</Etiqueta>}
                    </div>
                    <div className="text-right">
                      <p className="cifra text-sm font-semibold text-emerald-700">{dinero(i.monto, i.moneda)}</p>
                      {i.moneda === "USD" && <p className="cifra text-xs text-slate-500">≈ {dinero(aDOP(i.monto, i.moneda, r.tasa))}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
