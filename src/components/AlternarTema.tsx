"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const CHAVE = "heelcloth-tema";

// Botão que alterna o site entre claro (branco) e escuro (preto). A escolha fica salva no navegador.
export function AlternarTema({ className = "" }: { className?: string }) {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains("tema-escuro"));
  }, []);

  const alternar = () => {
    const novo = !escuro;
    setEscuro(novo);
    document.documentElement.classList.toggle("tema-escuro", novo);
    try {
      localStorage.setItem(CHAVE, novo ? "escuro" : "claro");
    } catch {
      /* navegador sem armazenamento: a escolha vale só nesta visita */
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={escuro}
      aria-label={escuro ? "Mudar para o tema branco" : "Mudar para o tema preto"}
      title={escuro ? "Tema branco" : "Tema preto"}
      className={`ripple-host inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-white text-[#121212] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${className}`}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
