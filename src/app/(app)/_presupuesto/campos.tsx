import type { Cuenta, Gasto, Ingreso } from "@prisma/client";
import { AreaTexto, Campo, Casilla, Dos, Selector } from "@/components/form-estado";
import { BOLSILLOS, CATEGORIAS_GASTO, FRECUENCIAS, MONEDAS, TIPOS_GASTO } from "@/lib/opciones";
import { aInputFecha } from "@/lib/form";

function CuandoOcurre({ frecuencia, diaDelMes, fecha }: { frecuencia?: string; diaDelMes?: number | null; fecha?: Date | null }) {
  return (
    <>
      <Selector etiqueta="Frecuencia" name="frecuencia" defaultValue={frecuencia ?? "recurrente"} opciones={FRECUENCIAS} />
      <Dos>
        <Campo etiqueta="Día del mes" name="diaDelMes" inputMode="numeric" defaultValue={diaDelMes ?? ""} placeholder="Si es recurrente" />
        <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={aInputFecha(fecha)} />
      </Dos>
      <p className="-mt-2 text-xs text-slate-500">Recurrente usa el día del mes (vacío = sin día fijo). Puntual usa la fecha.</p>
    </>
  );
}

export function CamposIngreso({ i, cuentas }: { i?: Ingreso; cuentas: Cuenta[] }) {
  return (
    <>
      <Campo etiqueta="Nombre" name="nombre" defaultValue={i?.nombre} placeholder="Salario quincena 1" required />
      <Campo etiqueta="Fuente" name="fuente" defaultValue={i?.fuente} placeholder="Empresa o cliente" />
      <Dos>
        <Campo etiqueta="Monto" name="monto" inputMode="decimal" defaultValue={i?.monto} required />
        <Selector etiqueta="Moneda" name="moneda" defaultValue={i?.moneda ?? "DOP"} opciones={MONEDAS} />
      </Dos>
      <CuandoOcurre frecuencia={i?.frecuencia} diaDelMes={i?.diaDelMes} fecha={i?.fecha} />
      <Selector
        etiqueta="Bolsillo"
        name="bolsillo"
        defaultValue={i?.bolsillo ?? "manejable"}
        opciones={BOLSILLOS}
        ayuda="Auto-debitado = se va completo en un auto-débito y no está disponible para el día a día."
      />
      <Selector
        etiqueta="Cuenta destino"
        name="cuentaId"
        defaultValue={i?.cuentaId ?? ""}
        opciones={[{ valor: "", texto: "—" }, ...cuentas.map((c) => ({ valor: c.id, texto: c.nombre }))]}
      />
      <Casilla etiqueta="Por verificar" name="porVerificar" defaultChecked={i?.porVerificar} ayuda="Recurrencia o día de cobro aún sin confirmar." />
      <AreaTexto etiqueta="Nota" name="nota" defaultValue={i?.nota ?? ""} />
      {i && <Casilla etiqueta="Inactivo" name="inactivo" defaultChecked={!i.activo} ayuda="Ya no se recibe; deja de contar en el flujo." />}
    </>
  );
}

export function CamposGasto({ g, categorias }: { g?: Gasto; categorias: string[] }) {
  const opciones = Array.from(new Set([...CATEGORIAS_GASTO, ...categorias])).map((c) => ({ valor: c, texto: c }));
  return (
    <>
      <Campo etiqueta="Descripción" name="descripcion" defaultValue={g?.descripcion} placeholder="Alquiler" required />
      <Dos>
        <Selector etiqueta="Categoría" name="categoria" defaultValue={g?.categoria ?? "Otros"} opciones={opciones} />
        <Selector etiqueta="Tipo" name="tipo" defaultValue={g?.tipo ?? "fijo"} opciones={TIPOS_GASTO} />
      </Dos>
      <Dos>
        <Campo etiqueta="Monto" name="monto" inputMode="decimal" defaultValue={g?.monto} required />
        <Selector etiqueta="Moneda" name="moneda" defaultValue={g?.moneda ?? "DOP"} opciones={MONEDAS} />
      </Dos>
      <CuandoOcurre frecuencia={g?.frecuencia} diaDelMes={g?.diaDelMes} fecha={g?.fecha} />
      <AreaTexto etiqueta="Nota" name="nota" defaultValue={g?.nota ?? ""} />
      {g && <Casilla etiqueta="Inactivo" name="inactivo" defaultChecked={!g.activo} ayuda="Ya no se paga; deja de contar en el flujo." />}
    </>
  );
}
