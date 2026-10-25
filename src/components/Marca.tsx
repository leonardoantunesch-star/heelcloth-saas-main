import React from "react";
import Image from "next/image";

// Marca do site: logo, nome com as letras bem espaçadas e, embaixo, "sublimação esportiva" em letra pequena e fina.
export function Marca({ pequena = false }: { pequena?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="Logo Heelcloth"
        width={24}
        height={45}
        className={`${pequena ? "h-6" : "h-8"} w-auto object-contain transition-transform group-hover:scale-105`}
        priority
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-bold text-[#121212] transition-opacity group-hover:opacity-80 ${
            pequena ? "text-sm tracking-[0.3em] [word-spacing:0.3em]" : "text-lg sm:text-xl tracking-[0.3em] [word-spacing:0.3em]"
          }`}
        >
          HEEL CLOTH
        </span>
        <span className="mt-1.5 text-[9px] font-light uppercase tracking-[0.28em] text-[#121212]/55">
          Sublimação esportiva
        </span>
      </span>
    </span>
  );
}
