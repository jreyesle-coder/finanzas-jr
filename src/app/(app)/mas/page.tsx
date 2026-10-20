import Link from "next/link";
import { salir } from "@/app/login/actions";
import { Encabezado } from "@/components/ui";

const secciones = [
  {
    titulo: "Presupuesto",
    enlaces: [
      { href: "/ingresos", titulo: "Ingresos", detalle: "Fuentes, días de cobro y bolsillo" },
      { href: "/gastos", titulo: "Gastos", detalle: "Fijos y variables del hogar" },
      { href: "/movimientos", titulo: "Movimientos", detalle: "Lo registrado día a día, por mes" },
    ],
  },
  {
    titulo: "Salir de deudas",
    enlaces: [
      { href: "/atrasos", titulo: "Atrasos", detalle: "Saldos acumulados, abonos y proyección" },
      { href: "/fondos", titulo: "Fondos y metas", detalle: "Emergencia, médico y otros" },
      { href: "/simulador", titulo: "Simulador de abono", detalle: "Cuánto ahorras con un pago extra" },
      { href: "/proyeccion", titulo: "Proyección de salida", detalle: "Cuándo se liquida cada préstamo" },
    ],
  },
  {
    titulo: "Datos",
    enlaces: [
      { href: "/importar", titulo: "Importar CSV del banco", detalle: "Banreservas, Santa Cruz u otro" },
      { href: "/respaldo", titulo: "Respaldo y exportación", detalle: "JSON, CSV y copias automáticas" },
    ],
  },
  {
    titulo: "Ajustes",
    enlaces: [
      { href: "/mas/config", titulo: "Configuración", detalle: "Tasa USD→DOP, día de inicio de mes" },
      { href: "/mas/cuenta", titulo: "Mi cuenta", detalle: "Nombre y contraseña" },
    ],
  },
];

export default function MasPage() {
  return (
    <>
      <Encabezado titulo="Más" />
      <div className="space-y-5">
        {secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{s.titulo}</h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {s.enlaces.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="flex items-center justify-between px-4 py-3 active:bg-slate-50">
                    <span>
                      <span className="block font-medium">{e.titulo}</span>
                      <span className="block text-xs text-slate-500">{e.detalle}</span>
                    </span>
                    <span className="text-slate-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <form action={salir} className="mt-6">
        <button className="w-full rounded-xl border border-slate-300 bg-white py-3 font-medium text-red-600 active:bg-slate-50">Cerrar sesión</button>
      </form>
    </>
  );
}
