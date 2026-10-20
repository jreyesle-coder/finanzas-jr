import { obtenerSesion } from "@/lib/auth";
import { resumenMensual, type Fase } from "@/lib/resumen";
import { dinero } from "@/lib/format";
import { Tarjeta } from "@/components/ui";

const fases: Record<Fase, { texto: string; color: string }> = {
  rescate: { texto: "Rescate", color: "bg-red-500" },
  estabilizacion: { texto: "Estabilización", color: "bg-amber-400" },
  crecimiento: { texto: "Crecimiento", color: "bg-emerald-500" },
};

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: number; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${fuerte ? "font-semibold" : "text-slate-600"}`}>
      <span>{etiqueta}</span>
      <span className="cifra">{dinero(valor)}</span>
    </div>
  );
}

export default async function InicioPage() {
  const [sesion, r] = await Promise.all([obtenerSesion(), resumenMensual()]);
  const fase = fases[r.fase];

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Hola, {sesion?.nombre}</p>
          <h1 className="text-xl font-semibold">Resumen del mes</h1>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium">
          <span className={`h-2.5 w-2.5 rounded-full ${fase.color}`} />
          {fase.texto}
        </span>
      </header>

      <Tarjeta className="bg-slate-900 text-white border-slate-900">
        <p className="text-xs uppercase tracking-wide text-slate-400">{r.superavit >= 0 ? "Superávit mensual" : "Déficit mensual"}</p>
        <p className={`cifra mt-1 text-3xl font-semibold ${r.superavit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {r.superavit >= 0 ? "+" : ""}
          {dinero(r.superavit)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Ingresos</p>
            <p className="cifra font-medium">{dinero(r.ingresosTotal)}</p>
          </div>
          <div>
            <p className="text-slate-400">Egresos</p>
            <p className="cifra font-medium">{dinero(r.egresosTotal)}</p>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disponible manejable real</p>
        <p className={`cifra mt-1 text-2xl font-semibold ${r.disponibleManejable >= 0 ? "text-emerald-700" : "text-red-600"}`}>
          {dinero(r.disponibleManejable)}
        </p>
        <div className="mt-2 border-t border-slate-100 pt-2">
          <Fila etiqueta="Entra al bolsillo manejable" valor={r.ingresosManejables} />
          <Fila etiqueta="Gastos del hogar" valor={-r.gastosTotal} />
          <Fila etiqueta="Cuotas no auto-debitadas" valor={-(r.cuotasTotal - r.cuotasAuto)} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Bolsillo auto-debitado: entra {dinero(r.ingresosAuto)}, sale {dinero(r.cuotasAuto)} en auto-débito (queda {dinero(r.sobranteAuto)}).
        </p>
      </Tarjeta>

      <div className="grid grid-cols-2 gap-3">
        <Tarjeta>
          <p className="text-xs text-slate-500">Deuda total</p>
          <p className="cifra mt-1 text-lg font-semibold">{dinero(r.deudaTotal)}</p>
        </Tarjeta>
        <Tarjeta>
          <p className="text-xs text-slate-500">Atrasos pendientes</p>
          <p className="cifra mt-1 text-lg font-semibold text-amber-700">{dinero(r.atrasosSaldo)}</p>
        </Tarjeta>
      </div>

      {r.porVerificar > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {r.porVerificar} ingreso(s) marcados &ldquo;por verificar&rdquo; (recurrencia o día de cobro).
        </p>
      )}
      <p className="text-center text-xs text-slate-400">Montos consolidados en DOP · tasa USD {r.tasa}</p>
    </div>
  );
}
