import Link from "next/link";
import { calcularAvisos } from "@/lib/avisos";
import { Encabezado, Vacio } from "@/components/ui";

const ESTILO = {
  urgente: "border-red-200 bg-red-50 text-red-800",
  atencion: "border-amber-200 bg-amber-50 text-amber-900",
  logro: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export default async function AvisosPage() {
  const avisos = await calcularAvisos();
  return (
    <>
      <Encabezado titulo="Avisos" subtitulo="Pagos próximos, descalces y logros" />
      {avisos.length === 0 ? (
        <Vacio texto="Todo en orden. Nada pendiente por ahora." />
      ) : (
        <ul className="space-y-2">
          {avisos.map((a, i) => (
            <li key={i}>
              <Link href={a.href} className={`block rounded-2xl border p-4 ${ESTILO[a.nivel]}`}>
                <p className="text-sm font-semibold">{a.titulo}</p>
                <p className="text-xs opacity-90">{a.detalle}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
