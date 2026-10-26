import React from "react";
import Link from "next/link";
import { Marca } from "@/components/Marca";

// Rodapé das páginas públicas, com os mesmos destinos do menu do topo.
export function SiteFooter() {
  const link = "ripple-host rounded-md px-2 py-1 hover:text-[#121212] transition-colors";
  return (
    <footer className="font-editorial w-full border-t border-black/[0.06] bg-white">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#606060]">
        <div className="flex flex-col items-center sm:items-start gap-1.5">
          <Marca pequena />
          <span className="text-[11px] text-[#606060]">Uniformes esportivos sob medida</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/pedido" className={link}>Fazer pedido</Link>
          <Link href="/" className={link}>Loja</Link>
          <Link href="/catalogo" className={link}>Catálogo</Link>
          <Link href="/simulador" className={link}>Simulador 3D</Link>
          <Link href="/tamanhos" className={link}>Tamanhos</Link>
          <Link href="/rastreio" className={link}>Acompanhe seu pedido</Link>
          <Link href="/contato" className={link}>Contato</Link>
        </div>
      </div>
    </footer>
  );
}
