import React from "react";
import { cn } from "@/lib/utils";

// Gráficos simples do painel, desenhados só com HTML e SVG (sem biblioteca extra).

export interface BarraDado {
  rotulo: string;
  valor: number;
  // Texto que aparece ao passar o mouse (opcional).
  dica?: string;
}

export function GraficoBarras({
  dados,
  formatar = (n: number) => String(n),
  altura = 168,
  cor = "bg-blue-500",
  descricao,
}: {
  dados: BarraDado[];
  formatar?: (n: number) => string;
  altura?: number;
  cor?: string;
  descricao: string;
}) {
  const max = Math.max(...dados.map((d) => d.valor), 0);
  const mostrarValor = dados.length <= 8;
  return (
    <div role="img" aria-label={`${descricao}: ${dados.map((d) => `${d.rotulo} ${formatar(d.valor)}`).join(", ")}`}>
      <div className="flex gap-2 border-b border-slate-200 pt-5" style={{ height: altura + 20 }}>
        {dados.map((d, i) => {
          const pct = max > 0 ? (d.valor / max) * 100 : 0;
          return (
            <div key={`${d.rotulo}-${i}`} className="relative flex h-full min-w-0 flex-1 items-end justify-center" title={d.dica ?? `${d.rotulo}: ${formatar(d.valor)}`}>
              {mostrarValor && d.valor > 0 && (
                <span className="absolute left-0 right-0 truncate text-center text-[10px] font-semibold text-slate-600" style={{ bottom: `calc(${pct}% + 3px)` }}>
                  {formatar(d.valor)}
                </span>
              )}
              <div className={cn("w-full max-w-[34px] rounded-t-md transition-all", d.valor > 0 ? cor : "bg-slate-200")} style={{ height: d.valor > 0 ? `max(${pct}%, 4px)` : "3px" }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {dados.map((d, i) => (
          <span key={`${d.rotulo}-r-${i}`} className="min-w-0 flex-1 truncate text-center text-[10px] text-slate-500">
            {d.rotulo}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface FatiaDado {
  rotulo: string;
  valor: number;
  // Cor da fatia (classe "stroke-..." do Tailwind) e do ponto da legenda (classe "bg-...").
  stroke: string;
  ponto: string;
}

export function Rosca({ fatias, centro, descricao }: { fatias: FatiaDado[]; centro: string; descricao: string }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let acumulado = 0;
  return (
    <div className="flex flex-col items-center gap-5" role="img" aria-label={`${descricao}: ${fatias.map((f) => `${f.rotulo} ${f.valor}`).join(", ")}`}>
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="11" className="stroke-slate-100" />
          {total > 0 &&
            fatias.map((f) => {
              if (f.valor <= 0) return null;
              const tam = (f.valor / total) * C;
              const el = (
                <circle
                  key={f.rotulo}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  strokeWidth="11"
                  strokeDasharray={`${Math.max(tam - 1.2, 0.5)} ${C}`}
                  strokeDashoffset={-acumulado}
                  className={f.stroke}
                />
              );
              acumulado += tam;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{centro}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center gap-2.5">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", f.ponto)} aria-hidden="true" />
            <span className="flex-1 text-slate-600">{f.rotulo}</span>
            <span className="font-semibold text-slate-900">{f.valor}</span>
            <span className="w-10 text-right text-xs text-slate-400">{total > 0 ? `${Math.round((f.valor / total) * 100)}%` : "0%"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
