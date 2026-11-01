"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Marca } from "@/components/Marca";
import { AlternarTema } from "@/components/AlternarTema";
import "./tema-faixas.css";

// Menu do topo, igual em todas as páginas públicas. Cada item abre uma página própria.
// O visual segue o da loja: faixa de avisos, menu em letras maiúsculas e gaveta no celular.
const ITENS = [
  { href: "/pedido", rotulo: "Fazer pedido" },
  { href: "/catalogo", rotulo: "Catálogo" },
  { href: "/simulador", rotulo: "Simulador 3D" },
  { href: "/tamanhos", rotulo: "Tamanhos" },
  { href: "/rastreio", rotulo: "Acompanhe seu pedido" },
  { href: "/contato", rotulo: "Contato" },
] as const;

// Avisos que se alternam na faixa preta do topo (como na loja).
const AVISOS = ["Pedido mínimo de 10 camisas", "Receba seu orçamento online", "Enviamos para todo o Brasil"];

function FaixaAvisos() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % AVISOS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bloco-preto bg-[#121212] text-white">
      <p aria-live="polite" className="mx-auto max-w-[1440px] truncate px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-xs">
        {AVISOS[i]}
      </p>
    </div>
  );
}

interface SiteHeaderProps {
  // Conteúdo extra opcional, mostrado ao lado do seletor de tema (telas médias para cima).
  extra?: React.ReactNode;
}

export function SiteHeader({ extra }: SiteHeaderProps) {
  const pathname = usePathname() ?? "/";
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu do celular ao trocar de página.
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // Esc fecha a gaveta do menu.
  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [menuAberto]);

  const ativo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="font-editorial sticky top-0 z-30">
      <FaixaAvisos />
      <div className="border-b border-black/10 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-8 lg:px-12 xl:py-4">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-expanded={menuAberto}
            aria-label="Abrir menu de navegação"
            className="-ml-2 rounded-full p-1.5 text-[#121212] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] sm:p-2 xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/sublimacao"
            aria-label="Página inicial da sublimação"
            className="group shrink-0 rounded-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
          >
            <Marca />
          </Link>

          <nav aria-label="Navegação principal" className="ml-8 hidden flex-1 items-center gap-6 xl:flex">
            {ITENS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo(item.href) ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 py-1 text-[13px] font-bold uppercase tracking-[0.08em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] ${
                  ativo(item.href) ? "border-current" : "border-transparent hover:border-current"
                }`}
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {extra && <div className="hidden sm:block">{extra}</div>}
            <Link
              href="/"
              className="hidden h-9 shrink-0 items-center rounded-full border border-[#121212] px-4 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-[#121212] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 xl:inline-flex"
            >
              Heel Loja
            </Link>
            <AlternarTema className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {menuAberto && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/40" onClick={() => setMenuAberto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white text-[#121212] animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
              <Link href="/sublimacao" className="group">
                <Marca />
              </Link>
              <button type="button" className="rounded-full p-2" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto">
              {ITENS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ativo(item.href) ? "page" : undefined}
                  className={`block border-b border-black/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] ${ativo(item.href) ? "bg-black/[0.04]" : ""}`}
                >
                  {item.rotulo}
                </Link>
              ))}
              <div className="flex items-center justify-between px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] sm:hidden">
                <span>Tema</span>
                <AlternarTema />
              </div>
            </nav>
            <Link href="/" className="bloco-preto flex items-center justify-between border-t border-black/10 bg-[#121212] px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-white">
              Heel Loja <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
