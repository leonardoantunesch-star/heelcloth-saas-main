"use client";

import React, { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Aba = "adulto" | "babylook" | "infantil";
type LinhaMedida = { tamanho: string; largura: string; altura: string; indicacao?: string };

// Medidas oficiais. Adulto e baby look vêm da tabela da confecção; a aba Infantil mantém os valores anteriores.
const MEDIDAS: Record<Aba, { colunaAltura: string; linhas: LinhaMedida[] }> = {
  adulto: {
    colunaAltura: "Comprimento",
    linhas: [
      { tamanho: "PP", largura: "50,5 cm", altura: "70 cm" },
      { tamanho: "P", largura: "52,5 cm", altura: "71 cm" },
      { tamanho: "M", largura: "53,5 cm", altura: "73 cm" },
      { tamanho: "G", largura: "55,5 cm", altura: "76 cm" },
      { tamanho: "GG", largura: "58,5 cm", altura: "79 cm" },
      { tamanho: "G1", largura: "61 cm", altura: "81 cm" },
      { tamanho: "G2", largura: "63 cm", altura: "82 cm" },
      { tamanho: "G3", largura: "65,5 cm", altura: "83 cm" },
      { tamanho: "G4", largura: "68 cm", altura: "84 cm" },
      { tamanho: "G5 extra", largura: "75 cm", altura: "86 cm" },
    ],
  },
  babylook: {
    colunaAltura: "Altura",
    linhas: [
      { tamanho: "P", largura: "44 cm", altura: "55 cm" },
      { tamanho: "M", largura: "46 cm", altura: "57 cm" },
      { tamanho: "G", largura: "48 cm", altura: "58,5 cm" },
      { tamanho: "GG", largura: "50,5 cm", altura: "60 cm" },
    ],
  },
  infantil: {
    colunaAltura: "Altura",
    linhas: [
      { tamanho: "06", largura: "36 cm", altura: "48 cm", indicacao: "5 a 6 anos" },
      { tamanho: "08", largura: "39 cm", altura: "52 cm", indicacao: "7 a 8 anos" },
      { tamanho: "10", largura: "42 cm", altura: "56 cm", indicacao: "9 a 10 anos" },
      { tamanho: "12", largura: "44 cm", altura: "60 cm", indicacao: "11 a 12 anos" },
      { tamanho: "14", largura: "46 cm", altura: "64 cm", indicacao: "13 a 14 anos" },
    ],
  },
};

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "adulto", rotulo: "Adulto" },
  { id: "babylook", rotulo: "Baby look" },
  { id: "infantil", rotulo: "Infantil" },
];

export default function TamanhosPage() {
  const [aba, setAba] = useState<Aba>("adulto");
  const tabela = MEDIDAS[aba];
  const mostrarReferencia = tabela.linhas.some((l) => l.indicacao);

  return (
    <div className="min-h-screen bg-white text-[#121212] font-editorial selection:bg-[#121212] selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <span className="uppercase tracking-widest font-mono text-[11px] text-[#121212]/50 font-medium">
            Guia de Medidas
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#121212] mt-1.5">
            Tabela de Tamanhos Oficiais
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#606060]">
            Consulte as medidas de largura e comprimento para escolher o tamanho ideal para cada jogador da sua equipe.
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-6 bg-[#121212]/5 p-1 rounded-full max-w-xs mx-auto border border-black/5">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                aria-pressed={aba === a.id}
                className={`ripple-host flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${
                  aba === a.id ? "bg-[#121212] text-white shadow-2xs" : "text-[#606060] hover:text-[#121212]"
                }`}
              >
                {a.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto border border-black/10 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/[0.02] border-b border-black/10 text-[#121212]/60 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-3 px-4">Tamanho</th>
                  <th className="py-3 px-4">Largura</th>
                  <th className="py-3 px-4">{tabela.colunaAltura}</th>
                  {mostrarReferencia && <th className="py-3 px-4">Referência Indicada</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[#121212]">
                {tabela.linhas.map((item) => (
                  <tr key={item.tamanho} className="hover:bg-black/[0.04] transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono">{item.tamanho}</td>
                    <td className="py-3.5 px-4 text-[#606060]">{item.largura}</td>
                    <td className="py-3.5 px-4 text-[#606060]">{item.altura}</td>
                    {mostrarReferencia && <td className="py-3.5 px-4 text-[#606060]">{item.indicacao}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-black/[0.02] border-t border-black/5 text-[11px] text-[#606060] text-center">
            * As medidas podem variar cerca de 2 cm para mais ou para menos na hora de sublimar, por causa da temperatura.
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
