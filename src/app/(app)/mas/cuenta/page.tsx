import { requerirSesion } from "@/lib/auth";
import { Encabezado, Tarjeta } from "@/components/ui";
import { Campo, FormEstado } from "@/components/form-estado";
import { cambiarClave, guardarNombre } from "../actions";

export default async function CuentaPage() {
  const s = await requerirSesion();
  return (
    <div className="space-y-3">
      <Encabezado titulo="Mi cuenta" />
      <Tarjeta>
        <FormEstado accion={guardarNombre} boton="Guardar nombre">
          <Campo etiqueta="Nombre" name="nombre" defaultValue={s.nombre} autoComplete="name" />
        </FormEstado>
      </Tarjeta>
      <Tarjeta>
        <FormEstado accion={cambiarClave} boton="Cambiar contraseña">
          <Campo etiqueta="Contraseña actual" name="actual" type="password" autoComplete="current-password" />
          <Campo etiqueta="Nueva contraseña" name="nueva" type="password" autoComplete="new-password" ayuda="Mínimo 10 caracteres." />
          <Campo etiqueta="Repite la nueva" name="confirmar" type="password" autoComplete="new-password" />
        </FormEstado>
      </Tarjeta>
    </div>
  );
}
