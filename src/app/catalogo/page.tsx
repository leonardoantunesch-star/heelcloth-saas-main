"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRECOS_PADRAO } from "@/lib/orcamento";
import { CATEGORIAS_CATALOGO, PRODUTOS_CATALOGO, type ProdutoCatalogo } from "@/data/catalogo";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");

// Desenho de exemplo enquanto não há foto real do produto (veja src/data/catalogo.ts).
function Silhueta({ forma }: { forma: ProdutoCatalogo["forma"] }) {
  return (
    <svg viewBox="0 0 120 120" className="h-3/5 w-3/5" fill="none" stroke="#121212" strokeOpacity="0.55" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      {forma === "camisa" ? (
        <>
          <path d="M40 14 22 24 8 46l18 10 8-10v60h52V46l8 10 18-10-14-22L80 14c-4 8-12 12-20 12s-16-4-20-12Z" fill="#fff" />
          <path d="M40 14c4 8 12 12 20 12s16-4 20-12" />
        </>
      ) : (
        <>
          <path d="M30 24h60l8 76H66L60 56l-6 44H22Z" fill="#fff" />
          <path d="M30 32h60" />
        </>
      )}
    </svg>
  );
}

export default function CatalogoPage() {
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS_CATALOGO)[number]["id"]>("todos");
  const produtos = PRODUTOS_CATALOGO.filter((p) => categoria === "todos" || p.categoria === categoria);

  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#121212] selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <div className="max-w-2xl">
          <span className="uppercase tracking-[0.25em] font-mono text-[11px] text-[#121212]/50 font-medium">
            Catálogo
          </span>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            O que a gente produz para o seu time.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#606060] leading-relaxed">
            Veja as peças, os acabamentos e os valores. Para pedir, é só escolher os tamanhos de cada jogador na página
            de pedido.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar produtos">
          {CATEGORIAS_CATALOGO.map((c) => (
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
          {produtos.map((p) => (
            <li key={p.id} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f2f2f2] flex items-center justify-center">
                {p.src ? (
                  <img src={p.src} alt={p.nome} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <Silhueta forma={p.forma} />
                )}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <h2 className="text-base font-bold tracking-tight">{p.nome}</h2>
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
              <Link
                href="/pedido"
                className="ripple-host mt-4 inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-full border border-black/15 px-5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
              >
                Fazer pedido <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-16 sm:mt-24 border-t border-black/[0.08] pt-10 sm:pt-14">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Como funciona o preço</h2>
          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            {[
              ["Camisa de jogo", `${brl(PRECOS_PADRAO.camisa)} cada, em qualquer tamanho.`],
              ["Com punho", `${brl(PRECOS_PADRAO.camisa_punho)} cada camisa.`],
              ["Texturizada", `${brl(PRECOS_PADRAO.camisa_text)} cada. O punho já está incluso.`],
              ["Manga longa", `Soma ${brl(PRECOS_PADRAO.manga_longa)} em cada camisa.`],
            ].map(([t, d]) => (
              <div key={t} className="border-l border-black/15 pl-4">
                <dt className="font-bold">{t}</dt>
                <dd className="mt-1 text-[#606060] leading-relaxed">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-[#606060]">
            Pedido mínimo de 10 camisas. Os shorts não contam nesse mínimo e podem ser pedidos sozinhos, junto com as
            camisas. Os valores finais são confirmados após a aprovação do layout.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
