import { Encabezado, Proximamente } from "@/components/ui";

export default function Page() {
  return (
    <>
      <Encabezado titulo="Flujo de caja" />
      <Proximamente sprint={3} texto="Calendario de ingresos y egresos por fecha, saldo día a día y alertas de iliquidez." />
    </>
  );
}
