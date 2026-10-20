import { Encabezado, Proximamente } from "@/components/ui";

export default function Page() {
  return (
    <>
      <Encabezado titulo="Deudas" />
      <Proximamente sprint={1} texto="Préstamos con progreso, deuda consolidada y registro de pagos." />
    </>
  );
}
