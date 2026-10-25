import React from "react";
import Link from "next/link";
import { ImagemLoja } from "./ImagemLoja";
import { brl, emPromocao, estoqueTotal, precoFinal, type ProdutoLoja } from "@/data/loja";

export function CardProduto({ produto: p, parcelasMax }: { produto: ProdutoLoja; parcelasMax: number }) {
  const final = precoFinal(p);
  const promo = emPromocao(p);
  const esgotado = estoqueTotal(p) === 0;
  const parcelas = Math.min(parcelasMax, Math.max(1, Math.floor(final / 20)));
  return (
    <Link href={`/loja/produto/${p.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1f1ef]">
        <ImagemLoja id={p.imagens[0]} alt={p.nome} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]" rotulo={p.nome} />
        {p.imagens[1] && (
          <ImagemLoja id={p.imagens[1]} alt="" className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {esgotado ? (
            <span className="bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Esgotado</span>
          ) : (
            <>
              {promo && (
                <span className="bg-[var(--lj-dest)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  -{Math.round((1 - final / p.preco) * 100)}%
                </span>
              )}
              {p.lancamento && <span className="bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black">Novo</span>}
            </>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {p.cor && <p className="text-[11px] uppercase tracking-wider text-black/50">{p.cor}</p>}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">{p.nome}</h3>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm font-bold tabular-nums ${promo ? "text-[var(--lj-dest)]" : ""}`}>{brl(final)}</span>
          {promo && <span className="text-xs text-black/40 line-through tabular-nums">{brl(p.preco)}</span>}
        </p>
        {parcelas > 1 && <p className="text-[11px] text-black/55">ou {parcelas}x de {brl(final / parcelas)}</p>}
      </div>
    </Link>
  );
}

export function GradeProdutos({ produtos, parcelasMax }: { produtos: ProdutoLoja[]; parcelasMax: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {produtos.map((p) => (
        <li key={p.id}>
          <CardProduto produto={p} parcelasMax={parcelasMax} />
        </li>
      ))}
    </ul>
  );
}
