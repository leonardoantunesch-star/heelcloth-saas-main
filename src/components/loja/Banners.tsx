"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { urlImagemLoja, type BannerLoja } from "@/data/loja";

// Banner principal da loja, de ponta a ponta, trocando sozinho.
export function Banners({ banners }: { banners: BannerLoja[] }) {
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const n = banners.length;
  useEffect(() => {
    if (n < 2 || pausado) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, pausado]);
  if (n === 0) return null;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className="relative overflow-hidden bg-[var(--lj-pri)]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, k) => {
          const conteudo = (
            <div className="relative h-[68vh] min-h-[420px] max-h-[760px] w-full">
              {b.imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlImagemLoja(b.imagem)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(255,255,255,0.14),transparent_60%)]" />
              )}
              {b.imagem && <div className={`absolute inset-0 ${b.textoClaro ? "bg-gradient-to-t from-black/60 via-black/10 to-transparent" : "bg-gradient-to-t from-white/50 to-transparent"}`} />}
              <div className={`absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-14 sm:px-10 sm:pb-20 ${b.textoClaro ? "text-white" : "text-black"}`}>
                {b.titulo && <h2 className="max-w-3xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{b.titulo}</h2>}
                {b.subtitulo && <p className="mt-4 max-w-xl text-sm sm:text-base opacity-90">{b.subtitulo}</p>}
                {b.botao && (
                  <span className={`mt-7 inline-flex h-12 items-center px-7 text-xs font-bold uppercase tracking-[0.18em] ${b.textoClaro ? "bg-white text-black" : "bg-black text-white"}`}>
                    {b.botao}
                  </span>
                )}
              </div>
            </div>
          );
          return (
            <div key={b.id} className="w-full shrink-0" aria-hidden={k !== i} role="group" aria-roledescription="slide" aria-label={`${k + 1} de ${n}`}>
              {b.link ? (
                <Link href={b.link} tabIndex={k === i ? 0 : -1} aria-label={b.titulo || b.botao || "Ver"} className="block">{conteudo}</Link>
              ) : (
                conteudo
              )}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button type="button" aria-label="Anterior" onClick={() => setI((x) => (x - 1 + n) % n)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 text-black hover:bg-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Próximo" onClick={() => setI((x) => (x + 1) % n)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 text-black hover:bg-white">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((b, k) => (
              <button key={b.id} type="button" aria-label={`Ir para o destaque ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={`h-1 transition-all ${k === i ? "w-8 bg-white" : "w-4 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
