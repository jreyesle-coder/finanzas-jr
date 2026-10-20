import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { CamposDeuda } from "../campos";
import { crearDeuda } from "../actions";

export default async function NuevaDeudaPage() {
  const cuentas = await prisma.cuenta.findMany({ orderBy: { nombre: "asc" } });
  return (
    <>
      <Volver href="/deudas" texto="Deudas" />
      <Encabezado titulo="Nueva deuda" />
      <Tarjeta>
        <FormEstado accion={crearDeuda} boton="Crear deuda">
          <CamposDeuda cuentas={cuentas} />
        </FormEstado>
      </Tarjeta>
    </>
  );
}
