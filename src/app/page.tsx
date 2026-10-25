"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EditorialSlideshow } from "@/components/EditorialSlideshow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#49AAB8] selection:text-white flex flex-col justify-between">
      <SiteHeader />

      {/* ==================================================================== */}
      {/* HERO SECTION — CENTRALIZADO COM SLIDESHOW EDITORIAL NA BASE */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col justify-between px-5 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-8 sm:pb-12 max-w-[1440px] w-full mx-auto">
        
        {/* Bloco de Título e Chamada Central */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto my-auto py-4 sm:py-8">
          
          {/* Título Atualizado */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-[#121212] leading-[1.05] max-w-2xl sm:max-w-3xl">
            Uniformes personalizados para o seu time.
          </h1>

          {/* Texto de Apoio Atualizado */}
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] text-[#606060] max-w-xl leading-relaxed font-normal">
            Monte seu pedido, informe os jogadores e receba seu orçamento.
          </p>

          {/* CTA Primário em Azul Aqua redirecionando para a rota de Pedido */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center">
            <Link
              href="/pedido"
              className="ripple-so-clique inline-flex items-center justify-center h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-[#49AAB8] hover:bg-[#368D9C] text-white text-sm sm:text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] shadow-2xs group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] focus-visible:ring-offset-2"
            >
              <span>Fazer pedido</span>
              <ArrowUpRight
                className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>

        {/* Faixa / Slideshow Horizontal Editorial de Imagens Verticais na Base */}
        <div className="w-full mt-10 sm:mt-14 pt-4 border-t border-black/[0.04]">
          <div className="flex items-center justify-between mb-3 px-1 text-xs text-[#606060] font-medium">
            <span className="uppercase tracking-wider font-mono text-[11px] text-[#121212]/50">
              Galeria de Camisas & Fardamentos
            </span>
            <span className="hidden sm:inline-block text-[11px] text-[#606060]/70 font-mono">
              Arraste ou navegue com as setas
            </span>
          </div>

          <EditorialSlideshow />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
