import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Contato",
  description: "Fale com a Heel Cloth pelo WhatsApp ou e-mail. R. Antônio de Matos, 171 - Centro, Itaúna - MG.",
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#121212] selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="uppercase tracking-widest font-mono text-[11px] text-[#121212]/50 font-medium">
            Atendimento & Suporte
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#121212]">Fale com nossa equipe</h1>
          <p className="text-xs sm:text-sm text-[#606060] max-w-lg mx-auto leading-relaxed">
            Dúvidas sobre tecidos, personalização de uniformes, prazos de confecção ou pedidos de fardamentos especiais? Estamos à disposição.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pedido"
              className="ripple-so-clique inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#121212] text-white text-xs sm:text-sm font-medium hover:bg-black/85 transition"
            >
              Fazer meu pedido
            </Link>
            <Link
              href="/ajuda"
              className="ripple-host inline-flex items-center justify-center h-11 px-6 rounded-full border border-black/15 bg-white text-[#121212] text-xs sm:text-sm font-medium transition"
            >
              Perguntas Frequentes & Ajuda
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
