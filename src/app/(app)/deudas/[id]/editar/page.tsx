import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { CamposDeuda } from "../../campos";
import { actualizarDeuda, eliminarDeuda } from "../../actions";

export default async function EditarDeudaPage({ params }: PageProps<"/deudas/[id]/editar">) {
  const { id } = await params;
  const [d, cuentas] = await Promise.all([
    prisma.deuda.findUnique({ where: { id } }),
    prisma.cuenta.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!d) notFound();
  return (
    <>
      <Volver href={`/deudas/${id}`} texto={d.nombre} />
      <Encabezado titulo="Editar deuda" />
      <Tarjeta>
        <FormEstado accion={actualizarDeuda.bind(null, id)} boton="Guardar cambios">
          <CamposDeuda d={d} cuentas={cuentas} />
        </FormEstado>
      </Tarjeta>
      <div className="mt-6 text-center">
        <BotonConfirmar accion={eliminarDeuda.bind(null, id)} mensaje={`¿Eliminar "${d.nombre}" y todos sus pagos? No se puede deshacer.`}>
          Eliminar deuda
        </BotonConfirmar>
      </div>
    </>
  );
}
