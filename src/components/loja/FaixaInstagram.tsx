import React from "react";
import { Camera } from "lucide-react";
import { EMPRESA, FOTOS_INSTAGRAM } from "@/lib/empresa";

// Faixa "Siga-nos no Instagram" acima do rodapé. Só entra na página inicial da loja (LojaInicio).
export function FaixaInstagram() {
  return (
    <section aria-label="Instagram" className="-mb-16 mt-16 border-t border-black/10 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <a
          href={EMPRESA.instagramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto flex w-fit flex-col items-center text-center"
        >
          <Camera className="h-8 w-8" aria-hidden="true" />
          <span className="mt-2 text-sm text-black/60">Siga-nos no Instagram</span>
          <span className="text-xl font-extrabold tracking-tight sm:text-2xl">@{EMPRESA.instagram}</span>
        </a>
        <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {FOTOS_INSTAGRAM.map((f) => (
            <li key={f.arquivo}>
              <a
                href={EMPRESA.instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-black/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/instagram/${f.arquivo}`}
                  alt={f.alt}
                  width={720}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="sr-only">Abrir o Instagram @{EMPRESA.instagram}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
