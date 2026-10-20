import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CamposIngreso } from "../../_presupuesto/campos";
import { actualizarIngreso, eliminarIngreso } from "../../_presupuesto/actions";

export default async function EditarIngresoPage({ params }: PageProps<"/ingresos/[id]">) {
  const { id } = await params;
  const [i, cuentas] = await Promise.all([prisma.ingreso.findUnique({ where: { id } }), prisma.cuenta.findMany({ orderBy: { nombre: "asc" } })]);
  if (!i) notFound();
  return (
    <>
      <Volver href="/ingresos" texto="Ingresos" />
      <Encabezado titulo="Editar ingreso" />
      <Tarjeta>
        <FormEstado accion={actualizarIngreso.bind(null, id)} boton="Guardar cambios">
          <CamposIngreso i={i} cuentas={cuentas} />
        </FormEstado>
      </Tarjeta>
      <div className="mt-6 text-center">
        <BotonConfirmar accion={eliminarIngreso.bind(null, id)} mensaje={`¿Eliminar "${i.nombre}"?`}>
          Eliminar ingreso
        </BotonConfirmar>
      </div>
    </>
  );
}
