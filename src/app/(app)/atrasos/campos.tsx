import type { Atraso } from "@prisma/client";
import { AreaTexto, Campo, Dos, Selector } from "@/components/form-estado";
import { MONEDAS } from "@/lib/opciones";

export function CamposAtraso({ a }: { a?: Atraso }) {
  return (
    <>
      <Campo etiqueta="Concepto" name="concepto" defaultValue={a?.concepto} placeholder="Alquiler atrasado" required />
      <Dos>
        <Campo etiqueta="Monto original" name="montoOriginal" inputMode="decimal" defaultValue={a?.montoOriginal} required />
        <Selector etiqueta="Moneda" name="moneda" defaultValue={a?.moneda ?? "DOP"} opciones={MONEDAS} />
      </Dos>
      <Dos>
        <Campo etiqueta="Prioridad" name="prioridad" inputMode="numeric" defaultValue={a?.prioridad ?? 1} ayuda="1 = más urgente" />
        <Campo etiqueta="Abono mensual planeado" name="abonoMensualPlan" inputMode="decimal" defaultValue={a?.abonoMensualPlan ?? ""} />
      </Dos>
      <AreaTexto etiqueta="Nota" name="nota" defaultValue={a?.nota ?? ""} />
    </>
  );
}
