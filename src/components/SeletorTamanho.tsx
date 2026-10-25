"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { GRUPOS, TAMANHOS_CAMISA, nomeDoTamanho, rotuloCurto } from "@/lib/tamanhos";

interface SeletorTamanhoProps {
  value: string;
  onChange: (valor: string) => void;
  id?: string;
  ariaLabel?: string;
  className?: string;
  // "camisa" (padrão) mostra infantil, baby look e adulto. "short" mostra os mesmos, sem o baby look.
  tipo?: "camisa" | "short";
}

interface Posicao {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

// Seletor de tamanho com bolinhas (estilo Nike).
// Ordem da lista: infantil, baby look e adulto. Ao abrir, a rolagem já fica nos adultos.
export function SeletorTamanho({ value, onChange, id, ariaLabel, className = "", tipo = "camisa" }: SeletorTamanhoProps) {
  const ehShort = tipo === "short";
  const textoVazio = ehShort ? "Sem calção" : "Sem camisa";
  const textoGatilhoVazio = ehShort ? "Sem calção" : "Nenhum";
  const nomeValor = (v: string) => (ehShort ? `Short ${nomeDoTamanho(v)}` : nomeDoTamanho(v));
  // O short usa os mesmos tamanhos da camisa, menos o baby look.
  const grupos = GRUPOS.filter((g) => !ehShort || g.id !== "babylook").map((g) => ({
    id: g.id as string,
    titulo: g.titulo,
    itens: TAMANHOS_CAMISA.filter((t) => t.grupo === g.id),
  }));
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<Posicao | null>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const adultoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visivel = aberto && pos !== null;

  const fechar = useCallback((devolverFoco = false) => {
    setAberto(false);
    setPos(null);
    if (devolverFoco) gatilhoRef.current?.focus();
  }, []);

  const abrir = () => {
    const r = gatilhoRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(300, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    const abaixo = window.innerHeight - r.bottom - 12;
    const acima = r.top - 12;
    const emCima = abaixo < 260 && acima > abaixo;
    const maxHeight = Math.max(200, Math.min(300, emCima ? acima : abaixo));
    setPos({
      left,
      width,
      maxHeight,
      ...(emCima ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    });
    setAberto(true);
  };

  // Abre já rolado até os tamanhos adultos.
  useLayoutEffect(() => {
    if (!visivel) return;
    const area = rolagemRef.current;
    const adulto = adultoRef.current;
    if (area && adulto) area.scrollTop = adulto.offsetTop;
    painelRef.current?.focus({ preventScroll: true });
  }, [visivel]);

  // Fecha ao clicar fora, rolar a página, redimensionar ou apertar Esc.
  useEffect(() => {
    if (!visivel) return;
    const aoPressionar = (e: globalThis.PointerEvent) => {
      const alvo = e.target as Node;
      if (painelRef.current?.contains(alvo) || gatilhoRef.current?.contains(alvo)) return;
      fechar();
    };
    const aoRolar = (e: Event) => {
      if (e.target instanceof Node && painelRef.current?.contains(e.target)) return;
      fechar();
    };
    const aoRedimensionar = () => fechar();
    const aoTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fechar(true);
      }
    };
    document.addEventListener("pointerdown", aoPressionar);
    window.addEventListener("scroll", aoRolar, true);
    window.addEventListener("resize", aoRedimensionar);
    document.addEventListener("keydown", aoTecla);
    return () => {
      document.removeEventListener("pointerdown", aoPressionar);
      window.removeEventListener("scroll", aoRolar, true);
      window.removeEventListener("resize", aoRedimensionar);
      document.removeEventListener("keydown", aoTecla);
    };
  }, [visivel, fechar]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // Escolhe na hora e fecha logo depois, para dar tempo de ver o círculo expandir.
  const escolher = (valor: string) => {
    onChange(valor);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fechar(true), 260);
  };

  const painel =
    visivel && pos ? (
      <div
        ref={painelRef}
        role="dialog"
        aria-label={ehShort ? "Escolher o tamanho do short" : "Escolher o tamanho da camisa"}
        tabIndex={-1}
        style={{
          position: "fixed",
          left: pos.left,
          width: pos.width,
          top: pos.top,
          bottom: pos.bottom,
          maxHeight: pos.maxHeight,
          zIndex: 60,
        }}
        className="seletor-painel flex flex-col rounded-2xl border border-black/10 bg-white shadow-xl outline-none"
      >
        <div ref={rolagemRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              ref={grupo.id === "adulto" ? adultoRef : undefined}
              className="pb-3 last:pb-0"
            >
              <p className="px-1 pb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#121212]/50">
                {grupo.titulo}
              </p>
              <div role="listbox" aria-label={grupo.titulo} className="flex flex-wrap gap-2">
                {grupo.itens.map((t) => {
                  const ativo = t.valor === value;
                  return (
                    <button
                      key={t.valor}
                      type="button"
                      role="option"
                      aria-selected={ativo}
                      aria-label={t.nome}
                      title={t.nome}
                      onClick={() => escolher(t.valor)}
                      className={`ripple-host inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-3 font-mono text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
                        ativo
                          ? "border-[#121212] bg-[#121212] text-white"
                          : "border-black/15 bg-white text-[#121212]"
                      }`}
                    >
                      {t.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-black/10 p-2">
          <button
            type="button"
            aria-pressed={value === ""}
            onClick={() => escolher("")}
            className={`ripple-host h-9 w-full rounded-full text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] ${
              value === "" ? "bg-[#121212] text-white" : "text-[#606060]"
            }`}
          >
            {textoVazio}
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={gatilhoRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={visivel}
        aria-label={
          ariaLabel ? `${ariaLabel}: ${value ? nomeValor(value) : "nenhum"}` : undefined
        }
        onClick={() => (visivel ? fechar() : abrir())}
        className={`ripple-host inline-flex items-center justify-between gap-1 text-left ${className}`}
      >
        <span className="truncate">{value ? rotuloCurto(value) : textoGatilhoVazio}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${visivel ? "rotate-180" : ""}`}
        />
      </button>
      {painel && typeof document !== "undefined" ? createPortal(painel, document.body) : null}
    </>
  );
}
