"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { ImagemLoja } from "./ImagemLoja";
import { brl } from "@/data/loja";

// Carrinho que abre na lateral ao adicionar um produto.
export function CarrinhoLateral() {
  const { itens, aberto, setAberto, alterarQuantidade, remover, config } = useLoja();
  const fechar = useRef<HTMLButtonElement>(null);
  const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const falta = config.frete.gratisAcima !== null ? config.frete.gratisAcima - subtotal : null;

  useEffect(() => {
    if (!aberto) return;
    fechar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [aberto, setAberto]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho">
      <button type="button" aria-label="Fechar carrinho" className="absolute inset-0 bg-black/40" onClick={() => setAberto(false)} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[var(--lj-bg)] text-[var(--lj-txt)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em]">Carrinho ({itens.reduce((s, i) => s + i.quantidade, 0)})</h2>
          <button ref={fechar} type="button" className="p-2" aria-label="Fechar carrinho" onClick={() => setAberto(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {falta !== null && itens.length > 0 && (
          <p className="bg-black/[0.04] px-5 py-2.5 text-xs">
            {falta > 0 ? <>Faltam <strong>{brl(falta)}</strong> para o frete grátis.</> : <strong>Você ganhou frete grátis!</strong>}
          </p>
        )}
        {itens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-black/60">Seu carrinho está vazio.</p>
            <button type="button" onClick={() => setAberto(false)} className="text-xs font-bold uppercase tracking-widest underline underline-offset-4">
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-black/10 overflow-y-auto px-5">
              {itens.map((i) => (
                <li key={`${i.produtoId}-${i.tamanho}`} className="flex gap-4 py-4">
                  <Link href={`/loja/produto/${i.produtoId}`} onClick={() => setAberto(false)} className="shrink-0">
                    <ImagemLoja id={i.imagem} alt={i.nome} className="h-24 w-20" rotulo="" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold">{i.nome}</p>
                    <p className="text-xs text-black/55">Tamanho {i.tamanho}{i.cor && ` · ${i.cor}`}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-black/20">
                        <button type="button" aria-label="Diminuir" className="p-1.5 disabled:opacity-30" disabled={i.quantidade <= 1} onClick={() => alterarQuantidade(i.produtoId, i.tamanho, i.quantidade - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums" aria-label="Quantidade">{i.quantidade}</span>
                        <button type="button" aria-label="Aumentar" className="p-1.5" onClick={() => alterarQuantidade(i.produtoId, i.tamanho, i.quantidade + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{brl(i.preco * i.quantidade)}</span>
                    </div>
                    <button type="button" onClick={() => remover(i.produtoId, i.tamanho)} className="mt-1 self-start text-[11px] text-black/50 underline">
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-black/10 p-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <strong className="tabular-nums">{brl(subtotal)}</strong>
              </div>
              <Link
                href="/loja/carrinho"
                onClick={() => setAberto(false)}
                className="flex h-12 items-center justify-center bg-[var(--lj-pri)] text-xs font-bold uppercase tracking-[0.18em] text-white hover:opacity-90"
              >
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
