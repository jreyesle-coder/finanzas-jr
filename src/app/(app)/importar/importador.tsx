"use client";

import { useMemo, useState, useTransition } from "react";
import { detectarFormatoFecha, leerFecha, leerMonto, parsearCSV, sugerirCategoria, type FormatoFecha } from "@/lib/csv";
import { dinero } from "@/lib/format";
import { importarMovimientos, type ResultadoImportar } from "./actions";

type Props = { cuentas: { id: string; nombre: string }[]; categorias: string[] };

const sel = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm";

function Columna({ etiqueta, valor, cambiar, opciones }: { etiqueta: string; valor: string; cambiar: (v: string) => void; opciones: { v: string; t: string }[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{etiqueta}</span>
      <select value={valor} onChange={(e) => cambiar(e.target.value)} className={sel}>
        {opciones.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}

function adivinar(cab: string[], patrones: RegExp) {
  const i = cab.findIndex((c) => patrones.test(c));
  return i >= 0 ? String(i) : "";
}

export function Importador({ cuentas, categorias }: Props) {
  const [nombre, setNombre] = useState("");
  const [filas, setFilas] = useState<string[][]>([]);
  const [tieneCabecera, setTieneCabecera] = useState(true);
  const [colFecha, setColFecha] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [modo, setModo] = useState<"signo" | "debcred">("signo");
  const [colMonto, setColMonto] = useState("");
  const [colDebito, setColDebito] = useState("");
  const [colCredito, setColCredito] = useState("");
  const [invertir, setInvertir] = useState(false);
  const [formato, setFormato] = useState<FormatoFecha>("dmy");
  const [moneda, setMoneda] = useState<"DOP" | "USD">("DOP");
  const [cuentaId, setCuentaId] = useState("");
  const [cats, setCats] = useState<Record<number, string>>({});
  const [excluir, setExcluir] = useState<Record<number, boolean>>({});
  const [resultado, setResultado] = useState<ResultadoImportar>({});
  const [pendiente, iniciar] = useTransition();

  const cabecera = useMemo(() => (filas[0] ?? []).map((c, i) => (tieneCabecera ? c || `Columna ${i + 1}` : `Columna ${i + 1}`)), [filas, tieneCabecera]);
  const datos = useMemo(() => (tieneCabecera ? filas.slice(1) : filas), [filas, tieneCabecera]);

  async function cargar(archivo: File) {
    const texto = await archivo.text();
    const f = parsearCSV(texto);
    setNombre(archivo.name);
    setFilas(f);
    setCats({});
    setExcluir({});
    setResultado({});
    const cab = f[0] ?? [];
    setColFecha(adivinar(cab, /fecha|date/i));
    setColDesc(adivinar(cab, /descrip|concepto|detalle|referencia|memo/i));
    const deb = adivinar(cab, /d[eé]bito|retiro|cargo/i);
    const cre = adivinar(cab, /cr[eé]dito|dep[oó]sito|abono/i);
    if (deb && cre) {
      setModo("debcred");
      setColDebito(deb);
      setColCredito(cre);
    } else {
      setModo("signo");
      setColMonto(adivinar(cab, /monto|importe|valor|amount/i));
    }
    const iF = cab.findIndex((c) => /fecha|date/i.test(c));
    if (iF >= 0) setFormato(detectarFormatoFecha(f.slice(1, 15).map((r) => r[iF] ?? "")));
  }

  const vista = useMemo(() => {
    if (colFecha === "" || (modo === "signo" ? colMonto === "" : colDebito === "" && colCredito === "")) return [];
    return datos.map((r, idx) => {
      const fecha = leerFecha(r[Number(colFecha)], formato);
      let valor: number | null;
      if (modo === "signo") valor = leerMonto(r[Number(colMonto)]);
      else {
        const d = colDebito !== "" ? leerMonto(r[Number(colDebito)]) : null;
        const c = colCredito !== "" ? leerMonto(r[Number(colCredito)]) : null;
        valor = (c ? Math.abs(c) : 0) - (d ? Math.abs(d) : 0) || null;
      }
      if (valor !== null && invertir) valor = -valor;
      const tipo: "ingreso" | "gasto" = (valor ?? 0) >= 0 ? "ingreso" : "gasto";
      const nota = colDesc !== "" ? (r[Number(colDesc)] ?? "").slice(0, 300) : "";
      const valida = !!fecha && valor !== null && valor !== 0;
      return { idx, fecha, monto: Math.abs(valor ?? 0), tipo, nota, valida, categoria: cats[idx] ?? sugerirCategoria(nota, tipo) };
    });
  }, [datos, colFecha, colDesc, modo, colMonto, colDebito, colCredito, invertir, formato, cats]);

  const aImportar = vista.filter((v) => v.valida && !excluir[v.idx]);
  const opcionesCol = [{ v: "", t: "—" }, ...cabecera.map((c, i) => ({ v: String(i), t: c }))];

  return (
    <div className="space-y-4">
      <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center">
        <span className="block text-sm font-medium">{nombre || "Elegir archivo CSV del banco"}</span>
        <span className="block text-xs text-slate-500">{filas.length ? `${datos.length} filas leídas` : "Descárgalo desde la banca en línea como CSV"}</span>
        <input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={(e) => e.target.files?.[0] && cargar(e.target.files[0])} />
      </label>

      {filas.length > 0 && (
        <>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">1. Columnas</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tieneCabecera} onChange={(e) => setTieneCabecera(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              La primera fila son títulos
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Columna etiqueta="Fecha" valor={colFecha} cambiar={setColFecha} opciones={opcionesCol} />
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Formato de fecha</span>
                <select value={formato} onChange={(e) => setFormato(e.target.value as FormatoFecha)} className={sel}>
                  <option value="dmy">dd/mm/aaaa</option>
                  <option value="ymd">aaaa-mm-dd</option>
                  <option value="mdy">mm/dd/aaaa</option>
                </select>
              </label>
            </div>
            <Columna etiqueta="Descripción" valor={colDesc} cambiar={setColDesc} opciones={opcionesCol} />
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
              {(["signo", "debcred"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setModo(m)} className={`rounded-lg py-1.5 font-medium ${modo === m ? "bg-white shadow" : "text-slate-500"}`}>
                  {m === "signo" ? "Una columna de monto" : "Débito y crédito"}
                </button>
              ))}
            </div>
            {modo === "signo" ? (
              <Columna etiqueta="Monto (negativo = gasto)" valor={colMonto} cambiar={setColMonto} opciones={opcionesCol} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Columna etiqueta="Débito (sale)" valor={colDebito} cambiar={setColDebito} opciones={opcionesCol} />
                <Columna etiqueta="Crédito (entra)" valor={colCredito} cambiar={setColCredito} opciones={opcionesCol} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={invertir} onChange={(e) => setInvertir(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              Invertir signo (si los gastos salen como positivos)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Moneda</span>
                <select value={moneda} onChange={(e) => setMoneda(e.target.value as "DOP" | "USD")} className={sel}>
                  <option value="DOP">RD$</option>
                  <option value="USD">US$</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Cuenta</span>
                <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={sel}>
                  <option value="">—</option>
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {vista.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">2. Revisa antes de importar</h2>
              <p className="mb-2 text-xs text-slate-500">
                {aImportar.length} de {vista.length} filas listas. Desmarca las que no quieras (p. ej. transferencias entre sus cuentas).
              </p>
              <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                {vista.map((v) => (
                  <li key={v.idx} className={`flex items-start gap-2 py-2 ${!v.valida ? "opacity-40" : excluir[v.idx] ? "opacity-50" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={!v.valida}
                      checked={v.valida && !excluir[v.idx]}
                      onChange={(e) => setExcluir({ ...excluir, [v.idx]: !e.target.checked })}
                      className="mt-1 h-4 w-4 accent-emerald-600"
                      aria-label="Importar esta fila"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="truncate">{v.nota || "(sin descripción)"}</span>
                        <span className={`cifra shrink-0 font-medium ${v.tipo === "gasto" ? "text-red-600" : "text-emerald-700"}`}>
                          {v.valida ? `${v.tipo === "gasto" ? "−" : "+"}${dinero(v.monto, moneda)}` : "no válida"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{v.fecha ? v.fecha.split("-").reverse().join("/") : "fecha ?"}</span>
                        {v.valida && (
                          <select value={v.categoria} onChange={(e) => setCats({ ...cats, [v.idx]: e.target.value })} className="rounded-md border border-slate-200 bg-white px-1 py-0.5 text-xs">
                            {Array.from(new Set([...categorias, v.categoria])).map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {resultado.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{resultado.error}</p>}
              {resultado.ok && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{resultado.ok}</p>}
              <button
                type="button"
                disabled={pendiente || aImportar.length === 0}
                onClick={() =>
                  iniciar(async () => {
                    setResultado(
                      await importarMovimientos({
                        filas: aImportar.map((v) => ({ fecha: v.fecha!, tipo: v.tipo, monto: Math.round(v.monto * 100) / 100, categoria: v.categoria, nota: v.nota })),
                        moneda,
                        cuentaId: cuentaId || null,
                      }),
                    );
                  })
                }
                className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-50"
              >
                {pendiente ? "Importando…" : `Importar ${aImportar.length} movimiento(s)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
