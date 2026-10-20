import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { CamposAtraso } from "../campos";
import { crearAtraso } from "../actions";

export default function NuevoAtrasoPage() {
  return (
    <>
      <Volver href="/atrasos" texto="Atrasos" />
      <Encabezado titulo="Nuevo atraso" />
      <Tarjeta>
        <FormEstado accion={crearAtraso} boton="Crear atraso">
          <CamposAtraso />
        </FormEstado>
      </Tarjeta>
    </>
  );
}
