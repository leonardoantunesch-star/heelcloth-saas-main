"use client";

import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { ImagemLoja } from "./ImagemLoja";
import { brl, emPromocao, precoFinal, type ProdutoLoja } from "@/data/loja";

// Galeria de fotos do produto.
export function GaleriaProduto({ produto }: { produto: ProdutoLoja }) {
  const [i, setI] = useState(0);
  const fotos = produto.imagens;
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {fotos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto md:w-20 md:flex-col">
          {fotos.map((f, k) => (
            <li key={f} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-label={`Ver foto ${k + 1}`} aria-current={k === i} className={`block w-16 border-2 md:w-20 ${k === i ? "border-black" : "border-transparent"}`}>
                <ImagemLoja id={f} alt="" className="aspect-[4/5] w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex-1 bg-[#f1f1ef]">
        <ImagemLoja id={fotos[i] ?? null} alt={produto.nome} className="aspect-[4/5] w-full" rotulo={produto.nome} />
      </div>
    </div>
  );
}

export function ComprarProduto({ produto: p }: { produto: ProdutoLoja }) {
  const { adicionar, config } = useLoja();
  const unico = p.tamanhos.length === 1 ? p.tamanhos[0].nome : "";
  const [tamanho, setTamanho] = useState(unico);
  const [qtd, setQtd] = useState(1);
  const [erro, setErro] = useState("");
  const final = precoFinal(p);
  const promo = emPromocao(p);
  const t = p.tamanhos.find((x) => x.nome === tamanho);
  const esgotado = p.tamanhos.every((x) => x.estoque === 0);
  const parcelas = Math.min(config.pagamento.parcelasMax, Math.max(1, Math.floor(final / 20)));

  const comprar = () => {
    if (!t) return setErro("Escolha um tamanho.");
    if (t.estoque < qtd) return setErro(`Só temos ${t.estoque} unidade(s) nesse tamanho.`);
    setErro("");
    adicionar({ produtoId: p.id, tamanho: t.nome, quantidade: qtd, nome: p.nome, preco: final, imagem: p.imagens[0] ?? null, cor: p.cor });
    setQtd(1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className={`text-2xl font-extrabold tabular-nums ${promo ? "text-[var(--lj-dest)]" : ""}`}>{brl(final)}</span>
        {promo && <span className="text-sm text-black/40 line-through tabular-nums">{brl(p.preco)}</span>}
      </div>
      {parcelas > 1 && <p className="mt-1 text-sm text-black/60">ou {parcelas}x de {brl(final / parcelas)} no cartão</p>}

      {p.tamanhos.length > 0 && (
        <fieldset className="mt-8">
          <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em]">
            Tamanho{tamanho && <span className="font-normal normal-case tracking-normal text-black/60">: {tamanho}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {p.tamanhos.map((x) => (
              <button
                key={x.nome}
                type="button"
                disabled={x.estoque === 0}
                aria-pressed={tamanho === x.nome}
                onClick={() => {
                  setTamanho(x.nome);
                  setErro("");
                }}
                className={`h-11 min-w-[52px] border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:text-black/25 disabled:line-through ${
                  tamanho === x.nome ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                }`}
              >
                {x.nome}
              </button>
            ))}
          </div>
          {t && t.estoque > 0 && t.estoque <= 3 && <p className="mt-2 text-xs font-semibold text-[var(--lj-dest)]">Últimas {t.estoque} unidades!</p>}
        </fieldset>
      )}

      <div className="mt-6 flex gap-3">
        <div className="flex items-center border border-black/20">
          <button type="button" aria-label="Diminuir quantidade" className="h-12 px-3 disabled:opacity-30" disabled={qtd <= 1} onClick={() => setQtd(qtd - 1)}><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center tabular-nums" aria-live="polite" aria-label="Quantidade">{qtd}</span>
          <button type="button" aria-label="Aumentar quantidade" className="h-12 px-3" onClick={() => setQtd(Math.min(50, qtd + 1))}><Plus className="h-4 w-4" /></button>
        </div>
        <button
          type="button"
          onClick={comprar}
          disabled={esgotado}
          className="h-12 flex-1 bg-[var(--lj-pri)] text-xs font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {esgotado ? "Esgotado" : "Adicionar ao carrinho"}
        </button>
      </div>
      {erro && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--lj-dest)]">{erro}</p>}
    </div>
  );
}
