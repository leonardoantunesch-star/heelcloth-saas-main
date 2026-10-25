"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AlternarTema } from "@/components/AlternarTema";

// Menu do topo, igual em todas as páginas públicas. Cada item abre uma página própria.
const ITENS = [
  { href: "/pedido", rotulo: "Fazer pedido" },
  { href: "/", rotulo: "Loja" },
  { href: "/catalogo", rotulo: "Catálogo" },
  { href: "/simulador", rotulo: "Simulador 3D" },
  { href: "/tamanhos", rotulo: "Tamanhos" },
  { href: "/rastreio", rotulo: "Acompanhe seu pedido" },
  { href: "/contato", rotulo: "Contato" },
] as const;

interface SiteHeaderProps {
  // Conteúdo extra opcional, mostrado ao lado do botão "Entrar" (telas médias para cima).
  extra?: React.ReactNode;
}

export function SiteHeader({ extra }: SiteHeaderProps) {
  const pathname = usePathname() ?? "/";
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu do celular ao trocar de página.
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  const ativo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="font-editorial w-full border-b border-black/[0.06] bg-white/95 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-4 sm:py-5 flex items-center justify-between gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/sublimacao"
          className="flex items-center gap-2.5 group justify-self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] rounded-xs"
        >
          <Marca />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden xl:flex items-center bg-[#121212] text-white rounded-full p-1 shadow-xs"
        >
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo(item.href) ? "page" : undefined}
              className={`ripple-host ripple-escuro px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] ${
                ativo(item.href)
                  ? "bg-white text-[#121212] shadow-2xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3 justify-self-end">
          {extra}
          <AlternarTema />
          <Link
            href="/login"
            className="ripple-host inline-flex items-center justify-center h-9 px-4 rounded-full border border-black/15 bg-white text-xs sm:text-[13px] font-medium text-[#121212] active:scale-[0.98] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
          >
            Entrar
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-expanded={menuAberto}
          aria-label="Abrir menu de navegação"
          className="ripple-host xl:hidden p-2 rounded-full border border-black/10 text-[#121212] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
        >
          {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuAberto && (
        <div className="xl:hidden bg-white border-b border-black/10 px-6 py-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2 text-sm font-medium text-[#121212]">
            {ITENS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo(item.href) ? "page" : undefined}
                className={`ripple-host text-left py-2.5 px-3 rounded-lg ${
                  ativo(item.href) ? "bg-black/10 text-[#121212] font-semibold" : ""
                }`}
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-black/10 flex items-center gap-3">
            <AlternarTema className="shrink-0" />
            <Link
              href="/login"
              className="ripple-host flex-1 text-center py-2.5 rounded-full border border-black/20 text-xs font-semibold text-[#121212]"
            >
              Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
