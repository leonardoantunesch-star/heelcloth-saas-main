"use client";

import React, { useMemo, useState } from "react";
import { GradeProdutos } from "./CardProduto";
import { estoqueTotal, precoFinal, type ProdutoLoja } from "@/data/loja";

type Ordem = "novos" | "menor" | "maior" | "nome";

// Página de listagem: título, contagem, ordenação e filtro de tamanho.
export function ListaProdutos({
  titulo,
  descricao,
  produtos,
  parcelasMax,
  vazio = "Nenhum produto por aqui ainda.",
}: {
  titulo: string;
  descricao?: string;
  produtos: ProdutoLoja[];
  parcelasMax: number;
  vazio?: string;
}) {
  const [ordem, setOrdem] = useState<Ordem>("novos");
  const [tamanho, setTamanho] = useState("");
  const [disponiveis, setDisponiveis] = useState(false);

  const tamanhos = useMemo(() => Array.from(new Set(produtos.flatMap((p) => p.tamanhos.map((t) => t.nome)))), [produtos]);
  const lista = useMemo(() => {
    let l = produtos.filter((p) => !tamanho || p.tamanhos.some((t) => t.nome === tamanho && t.estoque > 0));
    if (disponiveis) l = l.filter((p) => estoqueTotal(p) > 0);
    const s = [...l];
    if (ordem === "menor") s.sort((a, b) => precoFinal(a) - precoFinal(b));
    if (ordem === "maior") s.sort((a, b) => precoFinal(b) - precoFinal(a));
    if (ordem === "nome") s.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (ordem === "novos") s.sort((a, b) => b.criadoEm - a.criadoEm);
    return s;
  }, [produtos, ordem, tamanho, disponiveis]);

  const sel = "h-10 border border-black/20 bg-white px-3 text-xs font-semibold uppercase tracking-wider outline-none focus:border-black";
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-10 sm:px-8">
      <h1 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">{titulo}</h1>
      {descricao && <p className="mt-2 text-sm text-black/60">{descricao}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-black/10 py-3">
        <span className="mr-auto text-xs text-black/55" aria-live="polite">{lista.length} {lista.length === 1 ? "produto" : "produtos"}</span>
        {tamanhos.length > 1 && (
          <select aria-label="Filtrar por tamanho" className={sel} value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
            <option value="">Todos os tamanhos</option>
            {tamanhos.map((t) => <option key={t} value={t}>Tamanho {t}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <input type="checkbox" checked={disponiveis} onChange={(e) => setDisponiveis(e.target.checked)} className="h-4 w-4 accent-black" />
          Só disponíveis
        </label>
        <select aria-label="Ordenar" className={sel} value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
          <option value="novos">Mais recentes</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
      </div>
      <div className="mt-8">
        {lista.length === 0 ? <p className="py-16 text-center text-sm text-black/55">{vazio}</p> : <GradeProdutos produtos={lista} parcelasMax={parcelasMax} />}
      </div>
    </div>
  );
}
