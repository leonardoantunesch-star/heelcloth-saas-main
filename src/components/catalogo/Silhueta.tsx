import React from "react";
import type { ProdutoCatalogo } from "@/data/catalogo";

// Desenho de exemplo enquanto não há foto do produto (a foto é cadastrada na aba "Catálogo" do painel).
export function Silhueta({ forma }: { forma: ProdutoCatalogo["forma"] }) {
  return (
    <svg viewBox="0 0 120 120" className="h-3/5 w-3/5" fill="none" stroke="#121212" strokeOpacity="0.55" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      {forma === "camisa" ? (
        <>
          <path d="M40 14 22 24 8 46l18 10 8-10v60h52V46l8 10 18-10-14-22L80 14c-4 8-12 12-20 12s-16-4-20-12Z" fill="#fff" />
          <path d="M40 14c4 8 12 12 20 12s16-4 20-12" />
        </>
      ) : forma === "short" ? (
        <>
          <path d="M30 24h60l8 76H66L60 56l-6 44H22Z" fill="#fff" />
          <path d="M30 32h60" />
        </>
      ) : (
        <>
          <path d="M46 10h28v50c0 8 8 12 20 18 8 4 10 12 8 20-2 8-10 10-18 10H50c-8 0-12-6-12-14Z" fill="#fff" />
          <path d="M46 22h28M46 30h28" />
        </>
      )}
    </svg>
  );
}
