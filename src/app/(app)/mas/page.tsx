import Link from "next/link";
import { salir } from "@/app/login/actions";
import { Encabezado } from "@/components/ui";

const enlaces = [
  { href: "/mas/config", titulo: "Configuración", detalle: "Tasa USD→DOP, día de inicio de mes" },
  { href: "/mas/cuenta", titulo: "Mi cuenta", detalle: "Nombre y contraseña" },
];

export default function MasPage() {
  return (
    <>
      <Encabezado titulo="Más" />
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {enlaces.map((e) => (
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
      <form action={salir} className="mt-6">
        <button className="w-full rounded-xl border border-slate-300 bg-white py-3 font-medium text-red-600 active:bg-slate-50">
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
