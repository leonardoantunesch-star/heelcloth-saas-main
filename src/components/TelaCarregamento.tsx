"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Tela de carregamento do site: logo, barra de progresso e uma cortina que sobe.
// Toda a animação é feita em CSS (veja .splash em globals.css), então funciona mesmo antes do JavaScript carregar
// e some sozinha. Fica no layout, por isso só toca ao abrir ou recarregar o site, não a cada troca de página.
// Não aparece dentro do painel administrativo.
export function TelaCarregamento() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-conteudo">
        <Image src="/logo.png" alt="" width={44} height={82} priority className="splash-logo" />
        <span className="splash-nome">HEELCLOTH</span>
        <span className="splash-barra">
          <span />
        </span>
      </div>
    </div>
  );
}
