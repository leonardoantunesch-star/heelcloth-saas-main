"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { editorialSlides, EditorialSlide } from "@/data/editorialSlides";

interface EditorialSlideshowProps {
  slides?: EditorialSlide[];
  // Quantos segundos cada foto leva para atravessar a posição de um cartão. Maior = mais devagar.
  segundosPorFoto?: number;
}

// Faixa de fotos que anda sozinha, sempre na mesma velocidade, em ciclo infinito.
// A lista aparece duas vezes seguidas e a animação desliza metade do trilho, então a volta é invisível.
export function EditorialSlideshow({
  slides = editorialSlides,
  segundosPorFoto = 9,
}: EditorialSlideshowProps) {
  const total = slides.length;
  if (total === 0) return null;

  const duracao = Math.max(20, total * segundosPorFoto);

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Faixa Editorial de Campanha da Coleção"
      className="carrossel relative w-full overflow-hidden select-none rounded-xl"
    >
      <div
        className="carrossel-trilho py-2"
        style={{ ["--carrossel-duracao" as string]: `${duracao}s` }}
      >
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0" aria-hidden={copia === 1}>
            {slides.map((slide, idx) => {
              const temImagem = Boolean(slide.src && slide.src.trim() !== "");
              return (
                <div
                  key={`${slide.id}-${copia}`}
                  className="shrink-0 pr-4 sm:pr-5"
                >
                  <div
                    className="w-[220px] sm:w-[250px] md:w-[270px] lg:w-[280px] h-[320px] sm:h-[360px] md:h-[400px] rounded-lg overflow-hidden relative flex flex-col justify-between border border-black/8"
                    style={{ backgroundColor: slide.tone || "#F0EFEA" }}
                  >
                    {temImagem ? (
                      <img
                        src={slide.src!}
                        alt={copia === 0 ? slide.alt : ""}
                        loading="eager"
                        draggable={false}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: slide.focalPoint || "center" }}
                      />
                    ) : (
                      <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-b from-black/[0.02] to-black/[0.06] text-[#121212]">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono tracking-wider uppercase text-[#121212]/50 font-medium">
                            {slide.label || `0${idx + 1}`}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-[#121212]/40" />
                        </div>

                        <div className="flex flex-col items-center justify-center text-center px-2 py-6">
                          <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-[#121212]/40 mb-3 bg-white/40">
                            <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <p className="text-xs font-medium text-[#121212]/60 max-w-[170px] leading-relaxed">
                            Imagem editorial a ser enviada
                          </p>
                          <span className="text-[10px] text-[#121212]/35 mt-1 font-mono">
                            3:4 • Formato Campanha
                          </span>
                        </div>

                        <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-[#121212]/45 font-medium">
                          <span>Coleção Atual</span>
                          <span>Ref. {slide.id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
