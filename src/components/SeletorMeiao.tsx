"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { CORES_MEIAO } from "@/lib/orcamento";

interface SeletorMeiaoProps {
  value: string;
  onChange: (valor: string) => void;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

// Escolha da cor do meião: lista simples (funciona bem no celular) com uma bolinha da cor escolhida.
export function SeletorMeiao({ value, onChange, ariaLabel, id, className = "" }: SeletorMeiaoProps) {
  const cor = CORES_MEIAO.find((c) => c.valor === value);
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border"
        style={{
          background: cor?.hex ?? "transparent",
          borderColor: cor ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.25)",
          borderStyle: cor ? "solid" : "dashed",
        }}
      />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={`${className} appearance-none pl-7 pr-6`}
      >
        <option value="">Sem meião</option>
        {CORES_MEIAO.map((c) => (
          <option key={c.valor} value={c.valor}>
            {c.rotulo}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
