import React from "react";
import Link from "next/link";
import Image from "next/image";

// Rodapé das páginas públicas, com os mesmos destinos do menu do topo.
export function SiteFooter() {
  const link = "ripple-host rounded-md px-2 py-1 hover:text-[#121212] transition-colors";
  return (
    <footer className="w-full border-t border-black/[0.06] bg-white">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#606060]">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Logo Heelcloth" width={16} height={30} className="h-5 w-auto object-contain" />
          <span className="font-bold text-[#121212]">HEELCLOTH</span>
          <span className="text-black/20">•</span>
          <span>Uniformes Esportivos Sob Medida</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/pedido" className={link}>Fazer pedido</Link>
          <Link href="/tamanhos" className={link}>Tamanhos</Link>
          <Link href="/rastreio" className={link}>Acompanhe seu pedido</Link>
          <Link href="/contato" className={link}>Contato</Link>
          <Link href="/login" className={link}>Entrar</Link>
        </div>
      </div>
    </footer>
  );
}
