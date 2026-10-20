import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CamposGasto } from "../../_presupuesto/campos";
import { actualizarGasto, eliminarGasto } from "../../_presupuesto/actions";

export default async function EditarGastoPage({ params }: PageProps<"/gastos/[id]">) {
  const { id } = await params;
  const [g, cats] = await Promise.all([
    prisma.gasto.findUnique({ where: { id } }),
    prisma.gasto.findMany({ select: { categoria: true }, distinct: ["categoria"] }),
  ]);
  if (!g) notFound();
  return (
    <>
      <Volver href="/gastos" texto="Gastos" />
      <Encabezado titulo="Editar gasto" />
      <Tarjeta>
        <FormEstado accion={actualizarGasto.bind(null, id)} boton="Guardar cambios">
          <CamposGasto g={g} categorias={cats.map((c) => c.categoria)} />
        </FormEstado>
      </Tarjeta>
      <div className="mt-6 text-center">
        <BotonConfirmar accion={eliminarGasto.bind(null, id)} mensaje={`¿Eliminar "${g.descripcion}"?`}>
          Eliminar gasto
        </BotonConfirmar>
      </div>
    </>
  );
}
