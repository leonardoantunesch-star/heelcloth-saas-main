"use client";

import React, { createContext, useContext, useId, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { enviarImagemLoja } from "@/lib/reduzir-imagem";
import { urlImagemLoja } from "@/data/loja";

// Peças de formulário do painel da loja.
export const estiloCampo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50";
export const estiloRotulo = "mb-1 block text-xs font-semibold text-slate-700";

interface Envios {
  enviar: (arquivo: File, lado?: number) => Promise<string | null>;
}
export const EnviosCtx = createContext<Envios | null>(null);
export const useEnvios = () => {
  const c = useContext(EnviosCtx);
  if (!c) throw new Error("EnviosCtx ausente");
  return c;
};

export function Campo({ rotulo, ajuda, children, className = "" }: { rotulo: string; ajuda?: string; children: (id: string) => React.ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={estiloRotulo}>{rotulo}</label>
      {children(id)}
      {ajuda && <p className="mt-1 text-[11px] text-slate-500">{ajuda}</p>}
    </div>
  );
}

export function Texto({ rotulo, valor, onChange, max, ajuda, placeholder, linhas, className }: {
  rotulo: string; valor: string; onChange: (v: string) => void; max: number; ajuda?: string; placeholder?: string; linhas?: number; className?: string;
}) {
  return (
    <Campo rotulo={rotulo} ajuda={ajuda} className={className}>
      {(id) =>
        linhas ? (
          <textarea id={id} rows={linhas} maxLength={max} placeholder={placeholder} className={estiloCampo} value={valor} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input id={id} maxLength={max} placeholder={placeholder} className={estiloCampo} value={valor} onChange={(e) => onChange(e.target.value)} />
        )
      }
    </Campo>
  );
}

// Valor em reais. Aceita vírgula. "vazio" permite deixar em branco (ex: preço promocional).
export function Dinheiro({ rotulo, valor, onChange, vazio = false, ajuda, className }: {
  rotulo: string; valor: number | null; onChange: (v: number | null) => void; vazio?: boolean; ajuda?: string; className?: string;
}) {
  const fmt = (v: number | null) => (v === null ? "" : v.toFixed(2).replace(".", ","));
  const [texto, setTexto] = useState(fmt(valor));
  const [focado, setFocado] = useState(false);
  const mostrado = focado ? texto : fmt(valor);
  return (
    <Campo rotulo={rotulo} ajuda={ajuda} className={className}>
      {(id) => (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
          <input
            id={id}
            inputMode="decimal"
            className={`${estiloCampo} pl-9 tabular-nums`}
            value={mostrado}
            placeholder={vazio ? "—" : "0,00"}
            onFocus={() => { setTexto(fmt(valor)); setFocado(true); }}
            onBlur={() => setFocado(false)}
            onChange={(e) => {
              const t = e.target.value.replace(/[^\d,.]/g, "");
              setTexto(t);
              if (t.trim() === "") return onChange(vazio ? null : 0);
              const n = Number(t.replace(/\./g, "").replace(",", "."));
              if (Number.isFinite(n)) onChange(Math.min(100000, Math.round(n * 100) / 100));
            }}
          />
        </div>
      )}
    </Campo>
  );
}

export function Inteiro({ rotulo, valor, onChange, min = 0, max = 100000, className, esconderRotulo }: {
  rotulo: string; valor: number; onChange: (v: number) => void; min?: number; max?: number; className?: string; esconderRotulo?: boolean;
}) {
  return esconderRotulo ? (
    <input aria-label={rotulo} type="number" min={min} max={max} className={`${estiloCampo} tabular-nums ${className ?? ""}`} value={valor}
      onChange={(e) => onChange(Math.max(min, Math.min(max, Math.floor(Number(e.target.value) || 0))))} />
  ) : (
    <Campo rotulo={rotulo} className={className}>
      {(id) => (
        <input id={id} type="number" min={min} max={max} className={`${estiloCampo} tabular-nums`} value={valor}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Math.floor(Number(e.target.value) || 0))))} />
      )}
    </Campo>
  );
}

export function Marcar({ rotulo, valor, onChange, ajuda }: { rotulo: string; valor: boolean; onChange: (v: boolean) => void; ajuda?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
      <span>
        <span className="font-medium">{rotulo}</span>
        {ajuda && <span className="block text-[11px] text-slate-500">{ajuda}</span>}
      </span>
    </label>
  );
}

export function Cor({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <Campo rotulo={rotulo}>
      {(id) => (
        <div className="flex items-center gap-2">
          <input type="color" aria-label={`${rotulo} (seletor)`} value={valor} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1" />
          <input id={id} className={`${estiloCampo} font-mono uppercase`} maxLength={7} value={valor} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </Campo>
  );
}

// Uma imagem com prévia, botão de enviar/trocar e remover.
export function UmaImagem({ rotulo, valor, onChange, ajuda, proporcao = "aspect-[4/3]", lado }: {
  rotulo: string; valor: string | null; onChange: (v: string | null) => void; ajuda?: string; proporcao?: string; lado?: number;
}) {
  const { enviar } = useEnvios();
  const [enviando, setEnviando] = useState(false);
  return (
    <div>
      <span className={estiloRotulo}>{rotulo}</span>
      <div className={`relative flex ${proporcao} w-full max-w-xs items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50`}>
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlImagemLoja(valor)} alt="" className="h-full w-full object-cover" />
        ) : enviando ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <span className="text-xs text-slate-400">sem imagem</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500">
          <ImagePlus className="h-3.5 w-3.5" /> {valor ? "Trocar" : "Enviar imagem"}
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setEnviando(true);
            const id = await enviar(f, lado);
            setEnviando(false);
            if (id) onChange(id);
          }} />
        </label>
        {valor && (
          <button type="button" onClick={() => onChange(null)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        )}
      </div>
      {ajuda && <p className="mt-1 text-[11px] text-slate-500">{ajuda}</p>}
    </div>
  );
}

export function Cartao({ titulo, descricao, children, acoes }: { titulo: string; descricao?: string; children: React.ReactNode; acoes?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-xs text-slate-500">{descricao}</p>}
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}
