"use client";

import { useState } from "react";
import { corto, dinero } from "@/lib/format";

// Saldo total de deuda en el tiempo: sin extra (ámbar, discontinua) vs con extra (verde, continua).
const COLOR_BASE = "#d97706";
const COLOR_CON = "#059669";

export function GraficaDeuda({ base, con, inicio }: { base: number[]; con: number[]; inicio: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = 180;
  const pad = { l: 40, r: 10, t: 10, b: 22 };
  const n = Math.max(base.length, con.length);
  const max = Math.max(...base, ...con, 1);
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const linea = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const [a0, m0] = inicio.split("-").map(Number);
  const etiquetaMes = (i: number) =>
    new Intl.DateTimeFormat("es-DO", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a0, m0 - 1 + i, 1)));
  const anios = Array.from({ length: Math.floor((n - 1) / 12) + 1 }, (_, k) => k * 12).filter((i) => i < n);

  return (
    <figure>
      <div className="mb-2 flex gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="4" aria-hidden>
            <line x1="0" y1="2" x2="18" y2="2" stroke={COLOR_BASE} strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          Sin extra
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="4" aria-hidden>
            <line x1="0" y1="2" x2="18" y2="2" stroke={COLOR_CON} strokeWidth="2" />
          </svg>
          Con extra
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label="Saldo total de deuda por mes, con y sin pago extra"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1));
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pad.l - 4} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#64748b">
              {corto(max * f)}
            </text>
          </g>
        ))}
        {anios.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b">
            {a0 + Math.floor((m0 - 1 + i) / 12)}
          </text>
        ))}
        <path d={linea(base)} fill="none" stroke={COLOR_BASE} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        <path d={linea(con)} fill="none" stroke={COLOR_CON} strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#94a3b8" strokeWidth="1" />
            {hover < base.length && <circle cx={x(hover)} cy={y(base[hover])} r="4" fill={COLOR_BASE} stroke="white" strokeWidth="2" />}
            {hover < con.length && <circle cx={x(hover)} cy={y(con[hover])} r="4" fill={COLOR_CON} stroke="white" strokeWidth="2" />}
          </g>
        )}
      </svg>
      <figcaption className="mt-1 min-h-[2.5rem] text-xs text-slate-600">
        {hover !== null ? (
          <>
            <b>{etiquetaMes(hover)}</b> · sin extra {dinero(base[hover] ?? 0)} · con extra {dinero(con[hover] ?? 0)}
          </>
        ) : (
          "Toca o pasa el dedo sobre la gráfica para ver cada mes."
        )}
      </figcaption>
    </figure>
  );
}
