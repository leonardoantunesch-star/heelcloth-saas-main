"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { editorialSlides, EditorialSlide } from "@/data/editorialSlides";

interface EditorialSlideshowProps {
  slides?: EditorialSlide[];
  intervalMs?: number;
}

export function EditorialSlideshow({
  slides = editorialSlides,
  intervalMs = 5000,
}: EditorialSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  // 1. Detectar preferência por movimento reduzido (a11y)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 2. Pausa automática quando a aba do navegador fica oculta
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 3. Navegação: avançar e retroceder
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 4. Autoplay gerenciado com respeito a pausas e motion
  useEffect(() => {
    if (prefersReducedMotion || isPaused || totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [prefersReducedMotion, isPaused, intervalMs, handleNext, totalSlides]);

  // 5. Suporte a Teclado (Setas Esquerda / Direita)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  // 6. Manipulação de Gesto Touch / Swipe (pan-y seguro para scroll)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null) {
      const threshold = 45; // pixels para disparar navegação
      if (touchDeltaX < -threshold) {
        handleNext();
      } else if (touchDeltaX > threshold) {
        handlePrev();
      }
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsDragging(false);
    setIsPaused(false);
  };

  // Criamos uma lista estendida para garantir o loop visual sem cortes bruscos
  // Exibimos todos os slides com transform relativo ao currentIndex
  return (
    <section
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Faixa Editorial de Campanha da Coleção"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative w-full overflow-hidden select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] rounded-xl"
    >
      {/* Contêiner de slides com rolagem suave */}
      <div
        className="w-full py-2 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex gap-4 sm:gap-5 transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(calc(-${currentIndex * 260}px + ${isDragging ? touchDeltaX : 0}px), 0, 0)`,
            transitionDuration: isDragging ? "0ms" : prefersReducedMotion ? "0ms" : "800ms",
          }}
        >
          {/* Renderização dos slides originais + duplicação para transição contínua */}
          {[...slides, ...slides].map((slide, idx) => {
            const isActualSlide = idx % totalSlides === currentIndex;
            const hasImage = Boolean(slide.src && slide.src.trim() !== "");

            return (
              <div
                key={`${slide.id}-${idx}`}
                aria-hidden={!isActualSlide}
                className="shrink-0 w-[220px] sm:w-[250px] md:w-[270px] lg:w-[280px] h-[320px] sm:h-[360px] md:h-[400px] rounded-lg overflow-hidden relative flex flex-col justify-between border border-black/8 transition-all duration-300"
                style={{
                  backgroundColor: slide.tone || "#F0EFEA",
                }}
              >
                {hasImage ? (
                  <img
                    src={slide.src!}
                    alt={slide.alt}
                    loading={idx < 4 ? "eager" : "lazy"}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{
                      objectPosition: slide.focalPoint || "center",
                    }}
                  />
                ) : (
                  // Placeholder refinado e contemporâneo
                  <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-b from-black/[0.02] to-black/[0.06] text-[#121212]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-[#121212]/50 font-medium">
                        {slide.label || `0${(idx % totalSlides) + 1}`}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#49AAB8]/40" />
                    </div>

                    <div className="flex flex-col items-center justify-center text-center px-2 py-6">
                      <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-[#121212]/40 mb-3 bg-white/40 backdrop-blur-xs">
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
            );
          })}
        </div>
      </div>

      {/* Controles discretos e elegantes (Anterior / Próximo + Indicadores de Posição) */}
      <div className="mt-5 flex items-center justify-between px-1">
        {/* Indicadores de barra/pontos acessíveis */}
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Indicadores dos slides">
          {slides.map((slide, i) => {
            const isActive = i === currentIndex;
            return (
              <button
                key={slide.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir para ${slide.label || `slide ${i + 1}`}`}
                onClick={() => goToSlide(i)}
                className={`h-1.5 transition-all duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
                  isActive
                    ? "w-7 bg-[#121212]"
                    : "w-2 bg-[#121212]/20 hover:bg-[#121212]/40"
                }`}
              />
            );
          })}
        </div>

        {/* Botões direcionais elegantes com área de clique confortável */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide anterior"
            className="w-8 h-8 rounded-full border border-black/15 bg-white text-[#121212] flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo slide"
            className="w-8 h-8 rounded-full border border-black/15 bg-white text-[#121212] flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </section>
  );
}
