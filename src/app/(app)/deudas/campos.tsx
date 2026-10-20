import type { Cuenta, Deuda } from "@prisma/client";
import { AreaTexto, Campo, Casilla, Dos, Selector } from "@/components/form-estado";
import { MONEDAS, TIPOS_DEUDA } from "@/lib/opciones";
import { aInputFecha } from "@/lib/form";

export function CamposDeuda({ d, cuentas }: { d?: Deuda; cuentas: Cuenta[] }) {
  return (
    <>
      <Campo etiqueta="Nombre" name="nombre" defaultValue={d?.nombre} placeholder="Préstamo personal" required />
      <Dos>
        <Campo etiqueta="Acreedor" name="acreedor" defaultValue={d?.acreedor} placeholder="Banco" />
        <Selector etiqueta="Tipo" name="tipo" defaultValue={d?.tipo ?? "prestamo"} opciones={TIPOS_DEUDA} />
      </Dos>
      <Dos>
        <Campo etiqueta="Saldo actual" name="saldoActual" inputMode="decimal" defaultValue={d?.saldoActual} required />
        <Selector etiqueta="Moneda" name="moneda" defaultValue={d?.moneda ?? "DOP"} opciones={MONEDAS} />
      </Dos>
      <Dos>
        <Campo etiqueta="Cuota mensual" name="cuotaMensual" inputMode="decimal" defaultValue={d?.cuotaMensual} required />
        <Campo etiqueta="Tasa anual %" name="tasaAnual" inputMode="decimal" defaultValue={d?.tasaAnual ?? ""} placeholder="21.95" />
      </Dos>
      <Dos>
        <Campo etiqueta="Plazo (meses)" name="plazoMeses" inputMode="numeric" defaultValue={d?.plazoMeses ?? ""} />
        <Campo etiqueta="Cuotas pagadas" name="cuotasPagadas" inputMode="numeric" defaultValue={d?.cuotasPagadas ?? 0} />
      </Dos>
      <Dos>
        <Campo etiqueta="Día de pago" name="diaPago" inputMode="numeric" defaultValue={d?.diaPago ?? ""} placeholder="1–31" />
        <Campo etiqueta="Tasa fija hasta" name="tasaFijaHasta" type="date" defaultValue={aInputFecha(d?.tasaFijaHasta)} />
      </Dos>
      <Selector
        etiqueta="Cuenta de origen"
        name="cuentaOrigenId"
        defaultValue={d?.cuentaOrigenId ?? ""}
        opciones={[
          { valor: "", texto: "—" },
          ...cuentas.map((c) => ({ valor: c.id, texto: `${c.nombre} (${c.bolsillo === "manejable" ? "manejable" : "auto-debitado"})` })),
        ]}
      />
      <Casilla etiqueta="Auto-débito" name="autoDebito" defaultChecked={d?.autoDebito} ayuda="La cuota se descuenta sola; no sale del bolsillo manejable." />
      <Casilla etiqueta="Permite prepago" name="permitePrepago" defaultChecked={d?.permitePrepago} />
      <Campo etiqueta="Condiciones de prepago" name="condicionesPrepago" defaultValue={d?.condicionesPrepago ?? ""} placeholder="30% anual sin penalidad" />
      <AreaTexto etiqueta="Nota" name="nota" defaultValue={d?.nota ?? ""} />
      {d && <Casilla etiqueta="Marcar como saldada" name="saldada" defaultChecked={!d.activa} ayuda="Deja de contar en cuotas y deuda total." />}
    </>
  );
}
