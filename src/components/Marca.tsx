import React from "react";
import Image from "next/image";

// Marca do site: logo, nome com as letras bem espaçadas e, embaixo, "sublimação esportiva" em letra pequena e fina.
// "claro" deixa tudo branco, para usar sobre fundo preto (rodapé).
export function Marca({ pequena = false, claro = false }: { pequena?: boolean; claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="Logo Heelcloth"
        width={24}
        height={45}
        className={`${pequena ? "h-6" : "h-8"} w-auto object-contain transition-transform group-hover:scale-105 ${claro ? "logo-claro brightness-0 invert" : ""}`}
        priority
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-extrabold transition-opacity group-hover:opacity-80 ${claro ? "text-white" : "text-[#121212]"} ${
            pequena ? "text-sm tracking-[0.3em] [word-spacing:0.3em]" : "text-lg sm:text-xl tracking-[0.3em] [word-spacing:0.3em]"
          }`}
        >
          HEEL CLOTH
        </span>
        <span className={`mt-1.5 text-[9px] font-light uppercase tracking-[0.28em] ${claro ? "text-white/60" : "text-[#121212]/70"}`}>
          Sublimação esportiva
        </span>
      </span>
    </span>
  );
}
