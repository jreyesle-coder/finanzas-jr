import { fecha } from "@/lib/format";
import { listarRespaldos, respaldosConfigurados } from "@/lib/respaldo";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { respaldarAhora } from "./actions";

const CSVS = [
  { tabla: "movimientos", texto: "Movimientos" },
  { tabla: "ingresos", texto: "Ingresos" },
  { tabla: "gastos", texto: "Gastos" },
  { tabla: "deudas", texto: "Deudas" },
  { tabla: "pagos", texto: "Pagos de deudas" },
  { tabla: "atrasos", texto: "Atrasos" },
  { tabla: "fondos", texto: "Fondos" },
];

function tamano(b: number) {
  return b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`;
}

export default async function RespaldoPage() {
  const respaldos = await listarRespaldos();
  return (
    <div className="space-y-3">
      <Volver href="/mas" texto="Más" />
      <Encabezado titulo="Respaldo y exportación" subtitulo="Para que ningún dato se pierda" />

      <Tarjeta>
        <h2 className="font-semibold">Exportar</h2>
        <p className="mb-3 text-xs text-slate-500">JSON = todo junto (para guardar). CSV = cada tabla, se abre en Excel.</p>
        <a href="/api/exportar/json" className="block w-full rounded-xl bg-slate-900 py-3 text-center font-semibold text-white">
          Descargar todo (JSON)
        </a>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CSVS.map((c) => (
            <a key={c.tabla} href={`/api/exportar/csv/${c.tabla}`} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-medium">
              {c.texto} (CSV)
            </a>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold">Copias automáticas</h2>
        <p className="mb-3 text-xs text-slate-500">Cada día a las 6:00 a. m. se guarda una copia completa (JSON) en Supabase Storage y se conservan las últimas 30.</p>
        {!respaldosConfigurados && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para las copias automáticas.</p>
        )}
        <FormEstado accion={respaldarAhora} boton="Crear copia ahora">
          <span />
        </FormEstado>
        {respaldos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aún no hay copias.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {respaldos.map((r) => (
              <li key={r.nombre} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {fecha(r.fecha)} {r.fecha.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Santo_Domingo" })}
                  <span className="block text-xs text-slate-500">{tamano(r.bytes)}</span>
                </span>
                <a href={`/api/respaldo/${r.nombre}`} className="text-sm font-medium text-emerald-700">
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
