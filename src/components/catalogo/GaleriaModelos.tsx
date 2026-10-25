"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ModeloCatalogo } from "@/data/catalogo";
import { Silhueta } from "@/components/catalogo/Silhueta";

interface Props {
  modelos: ModeloCatalogo[];
  produtoNome: string;
  forma: "camisa" | "short" | "meiao";
}

const linkPedido = (modelo: string, peca: string) =>
  `/pedido?modelo=${encodeURIComponent(modelo)}&peca=${encodeURIComponent(peca)}`;

// Grade dos modelos prontos de uma peça. Clicar abre a imagem grande com o botão "Quero este modelo".
export function GaleriaModelos({ modelos, produtoNome, forma }: Props) {
  const [aberto, setAberto] = useState<number | null>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const origem = useRef<HTMLElement | null>(null);

  const fechar = useCallback(() => {
    setAberto(null);
    origem.current?.focus();
  }, []);
  const ir = useCallback(
    (delta: number) => setAberto((i) => (i === null ? i : (i + delta + modelos.length) % modelos.length)),
    [modelos.length]
  );

  useEffect(() => {
    if (aberto === null) return;
    botaoFechar.current?.focus();
    const aoTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowLeft") ir(-1);
      if (e.key === "ArrowRight") ir(1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", aoTecla);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", aoTecla);
    };
  }, [aberto, fechar, ir]);

  const atual = aberto === null ? null : modelos[aberto];

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {modelos.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={(e) => {
                origem.current = e.currentTarget;
                setAberto(i);
              }}
              className="ripple-so-clique group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 rounded-xl"
              aria-label={`Ampliar o modelo ${m.nome}`}
            >
              <span className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-[#f2f2f2]">
                {m.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/catalogo/imagem/${m.imagem}`} alt={m.nome} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <Silhueta forma={forma} />
                )}
              </span>
              <span className="mt-3 block text-sm font-bold tracking-tight">{m.nome}</span>
              {m.descricao && <span className="mt-0.5 block text-xs text-[#606060] leading-relaxed">{m.descricao}</span>}
            </button>
            <Link
              href={linkPedido(m.nome, produtoNome)}
              className="ripple-host mt-3 inline-flex h-9 items-center rounded-full border border-black/15 px-4 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
            >
              Quero este modelo
            </Link>
          </li>
        ))}
      </ul>

      {atual && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Modelo ${atual.nome}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) fechar();
          }}
        >
          <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white sm:flex-row">
            <div className="flex min-h-[260px] flex-1 items-center justify-center bg-[#f2f2f2]">
              {atual.imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/catalogo/imagem/${atual.imagem}`} alt={atual.nome} className="max-h-[70vh] w-full object-contain" />
              ) : (
                <Silhueta forma={forma} />
              )}
            </div>
            <div className="flex w-full flex-col justify-between gap-6 p-6 sm:w-64">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#121212]/50">{produtoNome}</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight">{atual.nome}</h3>
                {atual.descricao && <p className="mt-2 text-sm leading-relaxed text-[#606060]">{atual.descricao}</p>}
              </div>
              <div className="space-y-2">
                <Link
                  href={linkPedido(atual.nome, produtoNome)}
                  className="ripple-host inline-flex h-11 w-full items-center justify-center rounded-full bg-[#121212] text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2"
                >
                  Quero este modelo
                </Link>
                {modelos.length > 1 && (
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => ir(-1)} aria-label="Modelo anterior" className="ripple-host flex h-10 w-10 items-center justify-center rounded-full border border-black/15">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-[#606060]">
                      {(aberto ?? 0) + 1} de {modelos.length}
                    </span>
                    <button type="button" onClick={() => ir(1)} aria-label="Próximo modelo" className="ripple-host flex h-10 w-10 items-center justify-center rounded-full border border-black/15">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              ref={botaoFechar}
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="ripple-host absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-xs"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
