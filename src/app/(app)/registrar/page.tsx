import Link from "next/link";
import { prisma } from "@/lib/db";
import { dinero, fecha } from "@/lib/format";
import { hoyInput } from "@/lib/form";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from "@/lib/opciones";
import { Encabezado, Tarjeta } from "@/components/ui";
import { RegistroRapido } from "./registro-rapido";
import { registrarMovimiento } from "../_presupuesto/actions";

export default async function RegistrarPage() {
  const [cuentas, recientes] = await Promise.all([
    prisma.cuenta.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.movimiento.findMany({ orderBy: [{ fecha: "desc" }, { createdAt: "desc" }], take: 6, include: { user: { select: { nombre: true } } } }),
  ]);

  return (
    <div className="space-y-3">
      <Encabezado titulo="Registrar" subtitulo="Lo que entró o salió hoy" />
      <Tarjeta>
        <RegistroRapido
          accion={registrarMovimiento}
          categoriasGasto={CATEGORIAS_GASTO}
          categoriasIngreso={CATEGORIAS_INGRESO}
          cuentas={cuentas}
          hoy={hoyInput()}
        />
      </Tarjeta>

      <Tarjeta>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Últimos movimientos</h2>
          <Link href="/movimientos" className="text-sm font-medium text-emerald-700">
            Ver todos
          </Link>
        </div>
        {recientes.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay movimientos.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recientes.map((m) => (
              <li key={m.id} className="flex justify-between py-2 text-sm">
                <span>
                  {m.categoria}
                  <span className="block text-xs text-slate-500">
                    {fecha(m.fecha)}
                    {m.user ? ` · ${m.user.nombre}` : ""}
                    {m.nota ? ` · ${m.nota}` : ""}
                  </span>
                </span>
                <span className={`cifra font-medium ${m.tipo === "gasto" ? "text-red-600" : "text-emerald-700"}`}>
                  {m.tipo === "gasto" ? "−" : "+"}
                  {dinero(m.monto, m.moneda)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
