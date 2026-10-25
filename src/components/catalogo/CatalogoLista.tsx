"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PRECOS_PADRAO } from "@/lib/orcamento";
import { CATEGORIAS_CATALOGO, type ProdutoPublico } from "@/data/catalogo";
import { Silhueta } from "@/components/catalogo/Silhueta";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");

export function CatalogoLista({ produtos }: { produtos: ProdutoPublico[] }) {
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS_CATALOGO)[number]["id"]>("todos");
  const visiveis = produtos.filter((p) => p.visivel && (categoria === "todos" || p.categoria === categoria));
  // só mostra o filtro de uma categoria se ela tiver produto
  const categorias = CATEGORIAS_CATALOGO.filter(
    (c) => c.id === "todos" || produtos.some((p) => p.visivel && p.categoria === c.id)
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar produtos">
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={categoria === c.id}
            onClick={() => setCategoria(c.id)}
            className={`ripple-host h-10 rounded-full border px-5 text-xs sm:text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] ${
              categoria === c.id ? "border-[#121212] bg-[#121212] text-white" : "border-black/15 bg-white text-[#121212]"
            }`}
          >
            {c.rotulo}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
        {visiveis.map((p) => (
          <li key={p.id} className="group flex flex-col">
            <Link
              href={`/catalogo/${p.id}`}
              className="ripple-so-clique relative block aspect-[4/5] overflow-hidden rounded-xl bg-[#f2f2f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
              aria-label={`Ver ${p.nome}`}
            >
              <span className="flex h-full w-full items-center justify-center">
                {p.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/catalogo/imagem/${p.imagem}`} alt={p.nome} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <Silhueta forma={p.forma} />
                )}
              </span>
              {p.modelos.length > 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold shadow-2xs">
                  {p.modelos.length} {p.modelos.length === 1 ? "modelo pronto" : "modelos prontos"}
                </span>
              )}
            </Link>
            <div className="mt-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold tracking-tight">
                <Link href={`/catalogo/${p.id}`} className="hover:underline focus:outline-none focus-visible:underline">
                  {p.nome}
                </Link>
              </h2>
              <p className="shrink-0 text-right leading-tight">
                {p.precoPrefixo && <span className="block text-[10px] uppercase tracking-wider text-[#606060]">{p.precoPrefixo}</span>}
                <span className="text-base font-bold">{brl(p.preco)}</span>
              </p>
            </div>
            <p className="mt-1.5 text-xs sm:text-[13px] text-[#606060] leading-relaxed">{p.descricao}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.destaques.map((d) => (
                <li key={d} className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-medium text-[#121212]/70">
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/catalogo/${p.id}`}
                className="ripple-host inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#121212] px-5 text-xs font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2"
              >
                {p.modelos.length > 0 ? "Ver modelos" : "Ver detalhes"} <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pedido"
                className="ripple-host inline-flex h-10 items-center justify-center rounded-full border border-black/15 px-5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
              >
                Fazer pedido
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-16 sm:mt-24 border-t border-black/[0.08] pt-10 sm:pt-14">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Como funciona o preço</h2>
        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-sm">
          {[
            ["Camisa de jogo", `${brl(PRECOS_PADRAO.camisa)} cada, em qualquer tamanho.`],
            ["Com punho", `${brl(PRECOS_PADRAO.camisa_punho)} cada camisa.`],
            ["Texturizada", `${brl(PRECOS_PADRAO.camisa_text)} cada. O punho já está incluso.`],
            ["Manga longa", `Soma ${brl(PRECOS_PADRAO.manga_longa)} em cada camisa.`],
            ["Meião", `${brl(PRECOS_PADRAO.meiao)} cada. Cores: branco, preto, azul, verde e vermelho.`],
          ].map(([t, d]) => (
            <div key={t} className="border-l border-black/15 pl-4">
              <dt className="font-bold">{t}</dt>
              <dd className="mt-1 text-[#606060] leading-relaxed">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-[#606060]">
          Pedido mínimo de 10 camisas. Os shorts e os meiões não contam nesse mínimo e podem ser pedidos junto com as
          camisas. Os valores finais são confirmados após a aprovação do layout.
        </p>
      </section>
    </>
  );
}
