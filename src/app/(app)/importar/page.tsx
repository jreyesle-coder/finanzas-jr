import { prisma } from "@/lib/db";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from "@/lib/opciones";
import { Encabezado, Volver } from "@/components/ui";
import { Importador } from "./importador";

export default async function ImportarPage() {
  const cuentas = await prisma.cuenta.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });
  return (
    <>
      <Volver href="/mas" texto="Más" />
      <Encabezado titulo="Importar CSV del banco" subtitulo="Banreservas, Santa Cruz u otro: el archivo se lee en tu teléfono y solo se guardan las filas que confirmes." />
      <Importador cuentas={cuentas} categorias={Array.from(new Set([...CATEGORIAS_GASTO, ...CATEGORIAS_INGRESO]))} />
    </>
  );
}
