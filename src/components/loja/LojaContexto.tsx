"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CategoriaLoja, ConfigLoja } from "@/data/loja";

// Contexto da loja: configuração pública + carrinho (guardado no navegador do cliente).
export interface ItemCarrinho {
  produtoId: string;
  tamanho: string;
  quantidade: number;
  nome: string;
  preco: number;
  imagem: string | null;
  cor: string;
}

interface Contexto {
  config: ConfigLoja;
  categorias: CategoriaLoja[];
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  adicionar: (item: ItemCarrinho) => void;
  alterarQuantidade: (produtoId: string, tamanho: string, quantidade: number) => void;
  remover: (produtoId: string, tamanho: string) => void;
  substituir: (itens: ItemCarrinho[]) => void;
  limpar: () => void;
  aberto: boolean;
  setAberto: (v: boolean) => void;
}

const Ctx = createContext<Contexto | null>(null);
const CHAVE = "heelcloth-carrinho";

export function LojaProvider({
  config,
  categorias,
  children,
}: {
  config: ConfigLoja;
  categorias: CategoriaLoja[];
  children: React.ReactNode;
}) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) || "[]");
      if (Array.isArray(salvo)) setItens(salvo.filter((i) => i && typeof i.produtoId === "string"));
    } catch {}
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {}
  }, [itens, carregado]);

  const adicionar = useCallback((item: ItemCarrinho) => {
    setItens((l) => {
      const i = l.findIndex((x) => x.produtoId === item.produtoId && x.tamanho === item.tamanho);
      if (i < 0) return [...l, item];
      const n = [...l];
      n[i] = { ...n[i], ...item, quantidade: Math.min(50, n[i].quantidade + item.quantidade) };
      return n;
    });
    setAberto(true);
  }, []);
  const alterarQuantidade = useCallback((produtoId: string, tamanho: string, quantidade: number) => {
    setItens((l) =>
      l.map((x) => (x.produtoId === produtoId && x.tamanho === tamanho ? { ...x, quantidade: Math.max(1, Math.min(50, quantidade)) } : x))
    );
  }, []);
  const remover = useCallback((produtoId: string, tamanho: string) => {
    setItens((l) => l.filter((x) => !(x.produtoId === produtoId && x.tamanho === tamanho)));
  }, []);
  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo(
    () => ({
      config,
      categorias,
      itens,
      quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0),
      adicionar,
      alterarQuantidade,
      remover,
      substituir: setItens,
      limpar,
      aberto,
      setAberto,
    }),
    [config, categorias, itens, adicionar, alterarQuantidade, remover, limpar, aberto]
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useLoja() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLoja fora do LojaProvider");
  return c;
}
