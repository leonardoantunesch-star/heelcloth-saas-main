"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { EditorialSlideshow } from "@/components/EditorialSlideshow";

export default function HomePage() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [navAtiva, setNavAtiva] = useState<"pedido" | "tamanhos" | "rastreio" | "contato">("pedido");
  const [abaMedidas, setAbaMedidas] = useState<"masculino" | "feminino" | "infantil">("masculino");

  const medidas = {
    masculino: [
      { tamanho: "P", largura: "50 cm", altura: "68 cm", indicacao: "Até 1,70m e 68kg" },
      { tamanho: "M", largura: "52 cm", altura: "71 cm", indicacao: "Até 1,78m e 78kg" },
      { tamanho: "G", largura: "55 cm", altura: "74 cm", indicacao: "Até 1,85m e 88kg" },
      { tamanho: "GG", largura: "58 cm", altura: "77 cm", indicacao: "Até 1,92m e 100kg" },
      { tamanho: "XGG", largura: "62 cm", altura: "80 cm", indicacao: "Acima de 100kg" },
    ],
    feminino: [
      { tamanho: "P", largura: "43 cm", altura: "60 cm", indicacao: "Manequim 36-38" },
      { tamanho: "M", largura: "46 cm", altura: "63 cm", indicacao: "Manequim 40" },
      { tamanho: "G", largura: "49 cm", altura: "66 cm", indicacao: "Manequim 42-44" },
      { tamanho: "GG", largura: "52 cm", altura: "69 cm", indicacao: "Manequim 46" },
    ],
    infantil: [
      { tamanho: "06", largura: "36 cm", altura: "48 cm", indicacao: "5 a 6 anos" },
      { tamanho: "08", largura: "39 cm", altura: "52 cm", indicacao: "7 a 8 anos" },
      { tamanho: "10", largura: "42 cm", altura: "56 cm", indicacao: "9 a 10 anos" },
      { tamanho: "12", largura: "44 cm", altura: "60 cm", indicacao: "11 a 12 anos" },
      { tamanho: "14", largura: "46 cm", altura: "64 cm", indicacao: "13 a 14 anos" },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#49AAB8] selection:text-white flex flex-col justify-between">
      
      {/* ==================================================================== */}
      {/* HEADER CONTIDO NO TOPO DO CANVAS BRANCO */}
      {/* ==================================================================== */}
      <header className="w-full border-b border-black/[0.06] bg-white/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-5 sm:py-6 flex items-center justify-between">
          
          {/* Logo da Marca */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] rounded-xs"
          >
            <Image
              src="/logo.png"
              alt="Logo Heelcloth"
              width={24}
              height={45}
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#121212] transition-opacity group-hover:opacity-80">
              HEELCLOTH
            </span>
          </Link>

          {/* Navegação Desktop: Recipiente Preto em Formato Cápsula */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center bg-[#121212] text-white rounded-full p-1 shadow-xs"
          >
            <Link
              href="/pedido"
              onClick={() => setNavAtiva("pedido")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
                navAtiva === "pedido"
                  ? "bg-[#49AAB8] text-white shadow-2xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Fazer pedido
            </Link>

            <a
              href="#tamanhos"
              onClick={() => setNavAtiva("tamanhos")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
                navAtiva === "tamanhos"
                  ? "bg-[#49AAB8] text-white shadow-2xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Tamanhos
            </a>

            <Link
              href="/rastreio"
              onClick={() => setNavAtiva("rastreio")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
                navAtiva === "rastreio"
                  ? "bg-[#49AAB8] text-white shadow-2xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Acompanhe seu pedido
            </Link>

            <a
              href="#contato"
              onClick={() => setNavAtiva("contato")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
                navAtiva === "contato"
                  ? "bg-[#49AAB8] text-white shadow-2xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Contato
            </a>
          </nav>

          {/* Ação à Direita: Apenas botão "Entrar" */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-black/15 bg-white text-xs sm:text-[13px] font-medium text-[#121212] hover:bg-black/5 active:scale-[0.98] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8]"
            >
              Entrar
            </Link>
          </div>

          {/* Botão Mobile Hambúrguer */}
          <button
            type="button"
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
            aria-expanded={menuMobileAberto}
            aria-label="Abrir menu de navegação"
            className="md:hidden p-2 rounded-full border border-black/10 text-[#121212] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8]"
          >
            {menuMobileAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Mobile Retrátil e Acessível */}
        {menuMobileAberto && (
          <div className="md:hidden bg-white border-b border-black/10 px-6 py-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2 text-sm font-medium text-[#121212]">
              <Link
                href="/pedido"
                onClick={() => setMenuMobileAberto(false)}
                className="text-left py-2 px-3 rounded-lg hover:bg-black/5"
              >
                Fazer pedido
              </Link>
              <a
                href="#tamanhos"
                onClick={() => setMenuMobileAberto(false)}
                className="text-left py-2 px-3 rounded-lg hover:bg-black/5"
              >
                Tamanhos
              </a>
              <Link
                href="/rastreio"
                onClick={() => setMenuMobileAberto(false)}
                className="text-left py-2 px-3 rounded-lg hover:bg-black/5"
              >
                Acompanhe seu pedido
              </Link>
              <a
                href="#contato"
                onClick={() => setMenuMobileAberto(false)}
                className="text-left py-2 px-3 rounded-lg hover:bg-black/5"
              >
                Contato
              </a>
            </nav>
            <div className="pt-3 border-t border-black/10 flex items-center">
              <Link
                href="/login"
                className="w-full text-center py-2 rounded-full border border-black/20 text-xs font-semibold text-[#121212]"
              >
                Entrar
              </Link>
            </div>
          </div>
        )}
      </header>

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
              className="inline-flex items-center justify-center h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-[#49AAB8] hover:bg-[#368D9C] text-white text-sm sm:text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] shadow-2xs group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] focus-visible:ring-offset-2"
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

      {/* ==================================================================== */}
      {/* SEÇÃO DE TABELA DE MEDIDAS E TAMANHOS */}
      {/* ==================================================================== */}
      <section id="tamanhos" className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <span className="uppercase tracking-widest font-mono text-[11px] text-[#121212]/50 font-medium">
            Guia de Medidas
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#121212] mt-1.5">
            Tabela de Tamanhos Oficiais
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#606060]">
            Consulte as medidas de largura (tórax) e altura para escolher o tamanho ideal para cada jogador da sua equipe.
          </p>

          {/* Alternador de Categoria */}
          <div className="flex items-center justify-center gap-1.5 mt-6 bg-[#121212]/5 p-1 rounded-full max-w-xs mx-auto border border-black/5">
            {(["masculino", "feminino", "infantil"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setAbaMedidas(tipo)}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold capitalize transition-all ${
                  abaMedidas === tipo
                    ? "bg-[#121212] text-white shadow-2xs"
                    : "text-[#606060] hover:text-[#121212]"
                }`}
              >
                {tipo === "feminino" ? "Feminino" : tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela Editorial Minimalista */}
        <div className="max-w-4xl mx-auto border border-black/10 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/[0.02] border-b border-black/10 text-[#121212]/60 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-3 px-4">Tamanho</th>
                  <th className="py-3 px-4">Largura (Tórax)</th>
                  <th className="py-3 px-4">Altura (Comprimento)</th>
                  <th className="py-3 px-4">Referência Indicada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[#121212]">
                {medidas[abaMedidas].map((item) => (
                  <tr key={item.tamanho} className="hover:bg-black/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono">
                      {item.tamanho}
                    </td>
                    <td className="py-3.5 px-4 text-[#606060]">{item.largura}</td>
                    <td className="py-3.5 px-4 text-[#606060]">{item.altura}</td>
                    <td className="py-3.5 px-4 text-[#606060]">{item.indicacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-black/[0.02] border-t border-black/5 text-[11px] text-[#606060] text-center">
            * Tolerância técnica padrão de até 1,5 cm permitida no corte têxtil e costura esportiva.
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SEÇÃO DE CONTATO E ATENDIMENTO */}
      {/* ==================================================================== */}
      <section id="contato" className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="uppercase tracking-widest font-mono text-[11px] text-[#121212]/50 font-medium">
            Atendimento & Suporte
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#121212]">
            Fale com nossa equipe
          </h2>
          <p className="text-xs sm:text-sm text-[#606060] max-w-lg mx-auto leading-relaxed">
            Dúvidas sobre tecidos, personalização de uniformes, prazos de confecção ou pedidos de fardamentos especiais? Estamos à disposição.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pedido"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#121212] text-white text-xs sm:text-sm font-medium hover:bg-black/85 transition"
            >
              Fazer meu pedido
            </Link>
            <Link
              href="/ajuda"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-black/15 bg-white text-[#121212] text-xs sm:text-sm font-medium hover:bg-black/5 transition"
            >
              Perguntas Frequentes & Ajuda
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* RODAPÉ EDITORIAL DISCRETO */}
      {/* ==================================================================== */}
      <footer className="w-full border-t border-black/[0.06] bg-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#606060]">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Logo Heelcloth"
              width={16}
              height={30}
              className="h-5 w-auto object-contain"
            />
            <span className="font-bold text-[#121212]">HEELCLOTH</span>
            <span className="text-black/20">•</span>
            <span>Uniformes Esportivos Sob Medida</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/pedido" className="hover:text-[#121212] transition-colors">
              Fazer pedido
            </Link>
            <a href="#tamanhos" className="hover:text-[#121212] transition-colors">
              Tamanhos
            </a>
            <Link href="/rastreio" className="hover:text-[#121212] transition-colors">
              Acompanhe seu pedido
            </Link>
            <Link href="/ajuda" className="hover:text-[#121212] transition-colors">
              Contato
            </Link>
            <Link href="/login" className="hover:text-[#121212] transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
