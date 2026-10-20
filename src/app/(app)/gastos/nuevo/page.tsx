import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { CamposGasto } from "../../_presupuesto/campos";
import { crearGasto } from "../../_presupuesto/actions";

export default async function NuevoGastoPage() {
  const cats = await prisma.gasto.findMany({ select: { categoria: true }, distinct: ["categoria"] });
  return (
    <>
      <Volver href="/gastos" texto="Gastos" />
      <Encabezado titulo="Nuevo gasto" />
      <Tarjeta>
        <FormEstado accion={crearGasto} boton="Crear gasto">
          <CamposGasto categorias={cats.map((c) => c.categoria)} />
        </FormEstado>
      </Tarjeta>
    </>
  );
}
