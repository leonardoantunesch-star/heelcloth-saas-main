"use client";

import React from "react";

// Primeiro item da página para quem navega pelo teclado: pula o menu e leva o foco ao <main>.
export function PularConteudo() {
  return (
    <a
      href="#conteudo"
      onClick={(e) => {
        const main = document.querySelector("main");
        if (!main) return;
        e.preventDefault();
        if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
        main.focus();
        main.scrollIntoView();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#121212] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#121212]"
    >
      Pular para o conteúdo
    </a>
  );
}
