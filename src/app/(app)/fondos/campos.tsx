import type { Fondo } from "@prisma/client";
import { AreaTexto, Campo, Dos, Selector } from "@/components/form-estado";
import { MONEDAS, TIPOS_FONDO } from "@/lib/opciones";

export function CamposFondo({ f }: { f?: Fondo }) {
  return (
    <>
      <Campo etiqueta="Nombre" name="nombre" defaultValue={f?.nombre} placeholder="Fondo de emergencia" required />
      <Dos>
        <Selector etiqueta="Tipo" name="tipo" defaultValue={f?.tipo ?? "otro"} opciones={TIPOS_FONDO} />
        <Selector etiqueta="Moneda" name="moneda" defaultValue={f?.moneda ?? "DOP"} opciones={MONEDAS} />
      </Dos>
      <Dos>
        <Campo etiqueta="Meta" name="meta" inputMode="decimal" defaultValue={f?.meta ?? ""} placeholder="Opcional" />
        <Campo etiqueta="Aporte mensual planeado" name="aporteMensualPlan" inputMode="decimal" defaultValue={f?.aporteMensualPlan ?? ""} />
      </Dos>
      {!f && <Campo etiqueta="Saldo que ya tienen" name="saldoInicial" inputMode="decimal" placeholder="0" />}
      <AreaTexto etiqueta="Nota" name="nota" defaultValue={f?.nota ?? ""} />
    </>
  );
}
