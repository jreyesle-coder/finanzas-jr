import { Encabezado, Tarjeta, Volver } from "@/components/ui";
import { FormEstado } from "@/components/form-estado";
import { CamposFondo } from "../campos";
import { crearFondo } from "../actions";

export default function NuevoFondoPage() {
  return (
    <>
      <Volver href="/fondos" texto="Fondos" />
      <Encabezado titulo="Nuevo fondo" />
      <Tarjeta>
        <FormEstado accion={crearFondo} boton="Crear fondo">
          <CamposFondo />
        </FormEstado>
      </Tarjeta>
    </>
  );
}
