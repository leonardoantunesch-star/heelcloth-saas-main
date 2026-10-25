"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useLoja } from "./LojaContexto";
import { urlImagemLoja } from "@/data/loja";

export function MarcaLoja({ claro = false }: { claro?: boolean }) {
  const { config } = useLoja();
  return (
    <span className="inline-flex items-center gap-2.5">
      {config.marca.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlImagemLoja(config.marca.logo)} alt="" className="h-8 w-auto object-contain" />
      )}
      <span className={`whitespace-nowrap text-lg font-extrabold uppercase tracking-[0.22em] [word-spacing:0.25em] ${claro ? "text-white" : ""}`}>
        {config.marca.nome}
      </span>
    </span>
  );
}

// Faixa de avisos que troca sozinha (como "Frete grátis acima de...").
function FaixaPromo() {
  const { config } = useLoja();
  const avisos = config.faixa.filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (avisos.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % avisos.length), 4500);
    return () => clearInterval(t);
  }, [avisos.length]);
  if (avisos.length === 0) return null;
  return (
    <div className="bg-[var(--lj-pri)] text-white">
      <p aria-live="polite" className="mx-auto max-w-[1440px] truncate px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-xs">
        {avisos[i % avisos.length]}
      </p>
    </div>
  );
}

export function LojaHeader() {
  const { categorias, quantidadeTotal, setAberto } = useLoja();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [busca, setBusca] = useState(false);
  const [termo, setTermo] = useState("");

  useEffect(() => {
    setMenu(false);
    setBusca(false);
  }, [pathname]);

  const links = [
    { href: "/loja/novidades", rotulo: "Lançamentos" },
    ...categorias.map((c) => ({ href: `/loja/categoria/${c.id}`, rotulo: c.nome })),
    { href: "/loja/ofertas", rotulo: "Ofertas", destaque: true },
  ];
  // leva ao site de uniformes personalizados (sublimação)
  const sublimacao = { href: "/sublimacao", rotulo: "Heel Sublimação" };
  const ativo = (h: string) => pathname === h;
  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (termo.trim()) router.push(`/loja/busca?q=${encodeURIComponent(termo.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40">
      <FaixaPromo />
      <div className="border-b border-black/10 bg-[var(--lj-bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-8 lg:py-4">
          <button type="button" className="-ml-2 p-2 lg:hidden" aria-label="Abrir menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="shrink-0" aria-label="Página inicial da loja">
            <MarcaLoja />
          </Link>
          <nav aria-label="Categorias" className="ml-6 hidden flex-1 items-center gap-6 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`border-b-2 py-1 text-[13px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  ativo(l.href) ? "border-current" : "border-transparent hover:border-current"
                } ${"destaque" in l && l.destaque ? "text-[var(--lj-dest)]" : ""}`}
              >
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <Link
            href={sublimacao.href}
            className="ml-auto hidden h-9 shrink-0 items-center rounded-full border border-current px-4 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-[var(--lj-pri)] hover:text-white lg:inline-flex"
          >
            {sublimacao.rotulo}
          </Link>
          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <button type="button" className="p-2" aria-label="Buscar" aria-expanded={busca} onClick={() => setBusca((v) => !v)}>
              <Search className="h-5 w-5" />
            </button>
            <button type="button" className="relative p-2" aria-label={`Abrir carrinho (${quantidadeTotal} itens)`} onClick={() => setAberto(true)}>
              <ShoppingBag className="h-5 w-5" />
              {quantidadeTotal > 0 && (
                <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--lj-dest)] px-1 text-[10px] font-bold text-white">
                  {quantidadeTotal}
                </span>
              )}
            </button>
          </div>
        </div>
        {busca && (
          <form onSubmit={buscar} role="search" className="mx-auto flex max-w-[1440px] gap-2 px-4 pb-3 sm:px-8">
            <input
              autoFocus
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="O que você procura?"
              aria-label="Buscar produtos"
              className="h-11 flex-1 border border-black/20 bg-white px-4 text-sm outline-none focus:border-black"
            />
            <button type="submit" className="h-11 bg-[var(--lj-pri)] px-5 text-xs font-bold uppercase tracking-widest text-white">
              Buscar
            </button>
          </form>
        )}
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-[var(--lj-bg)] text-[var(--lj-txt)]">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
              <MarcaLoja />
              <button type="button" className="p-2" aria-label="Fechar menu" onClick={() => setMenu(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`block border-b border-black/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] ${
                    "destaque" in l && l.destaque ? "text-[var(--lj-dest)]" : ""
                  }`}
                >
                  {l.rotulo}
                </Link>
              ))}
            </nav>
            <Link href={sublimacao.href} className="flex items-center justify-between border-t border-black/10 bg-[var(--lj-pri)] px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-white">
              {sublimacao.rotulo} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
