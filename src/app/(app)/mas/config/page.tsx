import { obtenerConfig } from "@/lib/config";
import { Encabezado, Tarjeta } from "@/components/ui";
import { Campo, FormEstado } from "@/components/form-estado";
import { guardarConfig } from "../actions";

export default async function ConfigPage() {
  const c = await obtenerConfig();
  return (
    <>
      <Encabezado titulo="Configuración" subtitulo="Parámetros compartidos por ambos usuarios" />
      <Tarjeta>
        <FormEstado accion={guardarConfig}>
          <Campo
            etiqueta="Tasa USD → DOP"
            name="tasaUSDtoDOP"
            type="number"
            step="0.01"
            inputMode="decimal"
            defaultValue={c.tasaUSDtoDOP}
            ayuda="Se usa para consolidar en DOP los montos en dólares."
          />
          <Campo
            etiqueta="Día de inicio del mes financiero"
            name="diaInicioMes"
            type="number"
            min={1}
            max={28}
            inputMode="numeric"
            defaultValue={c.diaInicioMes}
            ayuda="1 = mes calendario. Útil si prefieren cerrar el mes en la quincena."
          />
        </FormEstado>
      </Tarjeta>
    </>
  );
}
