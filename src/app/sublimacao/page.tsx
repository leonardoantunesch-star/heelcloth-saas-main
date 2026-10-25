"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EditorialSlideshow } from "@/components/EditorialSlideshow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const DESTAQUES = [
  { numero: "01", titulo: "Pedido mínimo de 10 camisas", texto: "Monte a lista dos jogadores com nome, número e tamanho de cada um." },
  { numero: "02", titulo: "Do jeito do seu time", texto: "Camisa, punho, textura, manga longa e short, tudo no mesmo pedido." },
  { numero: "03", titulo: "Acompanhe online", texto: "Com o código do pedido, você vê em que etapa da produção ele está." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#121212] selection:text-white flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 flex flex-col px-5 sm:px-8 lg:px-12 max-w-[1440px] w-full mx-auto">
        {/* Abertura */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-16 sm:pt-24 pb-12 sm:pb-16">
          <span className="uppercase tracking-[0.3em] font-light text-[10px] sm:text-[11px] text-[#121212]/55">
            Sublimação esportiva
          </span>
          <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] leading-[1.02]">
            Uniformes personalizados para o seu time.
          </h1>
          <p className="mt-6 text-[15px] sm:text-[17px] text-[#606060] max-w-xl leading-relaxed">
            Monte seu pedido, informe os jogadores e receba seu orçamento.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pedido"
              className="ripple-so-clique group inline-flex items-center justify-center h-12 px-7 rounded-full bg-[#121212] hover:bg-[#3a3a3a] text-white text-sm sm:text-[15px] font-semibold transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2"
            >
              <span>Fazer pedido</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
            </Link>
            <Link
              href="/catalogo"
              className="ripple-host inline-flex items-center justify-center h-12 px-7 rounded-full border border-black/20 bg-white text-sm sm:text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2"
            >
              Ver catálogo
            </Link>
          </div>
        </section>

        {/* Três pontos rápidos */}
        <section aria-label="Como funciona" className="border-y border-black/[0.08] grid grid-cols-1 md:grid-cols-3 md:divide-x divide-black/[0.08]">
          {DESTAQUES.map((d) => (
            <div key={d.numero} className="px-1 md:px-8 py-7 first:md:pl-0 last:md:pr-0">
              <span className="font-mono text-[11px] text-[#121212]/40">{d.numero}</span>
              <h2 className="mt-2 text-base font-bold tracking-tight">{d.titulo}</h2>
              <p className="mt-1.5 text-[13px] text-[#606060] leading-relaxed">{d.texto}</p>
            </div>
          ))}
        </section>

        {/* Faixa de fotos em movimento */}
        <section className="w-full mt-12 sm:mt-16 pb-12 sm:pb-16">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="uppercase tracking-[0.2em] font-mono text-[11px] text-[#121212]/50">
              Galeria de camisas &amp; fardamentos
            </span>
            <Link href="/catalogo" className="ripple-host rounded-md px-2 py-1 text-[11px] font-semibold text-[#121212]/70 hover:text-[#121212]">
              Ver tudo
            </Link>
          </div>
          <EditorialSlideshow />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
