import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { CamposIngreso } from "../../_presupuesto/campos";
import { crearIngreso } from "../../_presupuesto/actions";

export default async function NuevoIngresoPage() {
  const cuentas = await prisma.cuenta.findMany({ orderBy: { nombre: "asc" } });
  return (
    <>
      <Volver href="/ingresos" texto="Ingresos" />
      <Encabezado titulo="Nuevo ingreso" />
      <Tarjeta>
        <FormEstado accion={crearIngreso} boton="Crear ingreso">
          <CamposIngreso cuentas={cuentas} />
        </FormEstado>
      </Tarjeta>
    </>
  );
}
