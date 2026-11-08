"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EVENTO_ABRIR_COOKIES, gravarConsentimento, lerConsentimento } from "@/lib/cookies-consentimento";

const botao = "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2";

// Aviso de cookies: Aceitar tudo, Recusar opcionais e Configurar têm o mesmo tamanho e destaque.
// Começa tudo que é opcional desligado; sem escolha, nada opcional é guardado.
export function AvisoCookies() {
  const caminho = usePathname();
  const [pronto, setPronto] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [configurando, setConfigurando] = useState(false);
  const [preferencias, setPreferencias] = useState(false);
  const [reaberto, setReaberto] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const c = lerConsentimento();
    setPreferencias(c?.preferencias === true);
    setAberto(c === null);
    setPronto(true);
    const reabrir = () => {
      setPreferencias(lerConsentimento()?.preferencias === true);
      setConfigurando(true);
      setReaberto(true);
      setAberto(true);
    };
    window.addEventListener(EVENTO_ABRIR_COOKIES, reabrir);
    return () => window.removeEventListener(EVENTO_ABRIR_COOKIES, reabrir);
  }, []);

  // Quando a pessoa abre pelo rodapé, o foco vai para o aviso (leitor de tela e teclado).
  useEffect(() => {
    if (aberto && reaberto) titulo.current?.focus();
  }, [aberto, reaberto]);

  // Área da equipe não mostra o aviso: só usa o cookie de sessão, que é essencial.
  if (!pronto || !aberto || caminho.startsWith("/admin") || caminho === "/login") return null;

  const decidir = (pref: boolean) => {
    gravarConsentimento(pref);
    setAberto(false);
    setConfigurando(false);
    setReaberto(false);
  };
  const fechar = () => {
    // Fechar sem escolher não grava nada. Se ainda não houve escolha, o aviso volta na próxima página.
    setAberto(false);
    setConfigurando(false);
    setReaberto(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookies-titulo"
      aria-describedby="cookies-texto"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        if (configurando && !reaberto) setConfigurando(false);
        else if (lerConsentimento()) fechar();
      }}
      className="font-editorial fixed inset-x-3 bottom-3 z-40 mx-auto max-h-[85vh] max-w-xl overflow-y-auto rounded-2xl border border-black/10 bg-white p-5 text-[#121212] shadow-2xl sm:left-4 sm:right-auto sm:mx-0"
    >
      <h2 id="cookies-titulo" ref={titulo} tabIndex={-1} className="text-base font-bold focus:outline-none">
        Cookies e armazenamento
      </h2>
      <p id="cookies-texto" className="mt-2 text-sm leading-relaxed text-[#121212]/80">
        Guardamos no seu navegador só o que o site precisa para funcionar (login e carrinho). Se você deixar, também lembramos se prefere o tema claro ou escuro.
        Não usamos cookies de publicidade nem de análise.{" "}
        <Link href="/privacidade" className="font-semibold underline underline-offset-2">
          Saiba mais
        </Link>
      </p>

      {configurando && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl bg-[#f3f3f1] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Essenciais</p>
              <span className="rounded-full bg-[#121212] px-2.5 py-0.5 text-[11px] font-bold text-white">Sempre ligados</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#121212]/70">
              Mantêm você logado (cookie de sessão, até 14 dias na loja), guardam o carrinho e o rascunho do simulador no navegador e protegem o login com Google (cookie temporário de 10 minutos). Sem eles o site não funciona.
            </p>
          </div>
          <div className="rounded-xl bg-[#f3f3f1] p-3">
            <div className="flex items-center justify-between gap-3">
              <p id="cookies-pref-rotulo" className="font-semibold">Preferências</p>
              <button
                type="button"
                role="switch"
                aria-checked={preferencias}
                aria-labelledby="cookies-pref-rotulo"
                onClick={() => setPreferencias((v) => !v)}
                className="inline-flex h-8 items-center gap-2 rounded-full border border-[#121212]/40 bg-white px-3 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121212]"
              >
                <span aria-hidden="true" className={`h-3 w-3 rounded-full ${preferencias ? "bg-[#121212]" : "border border-[#121212]/50"}`} />
                {preferencias ? "Ligado" : "Desligado"}
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#121212]/70">
              Lembra o tema claro ou escuro que você escolheu, no armazenamento do navegador, até você apagar. Desligado, o tema volta ao padrão a cada visita.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => decidir(true)} className={`${botao} flex-1 bg-[#121212] text-white hover:bg-[#3a3a3a]`}>
          Aceitar tudo
        </button>
        <button type="button" onClick={() => decidir(false)} className={`${botao} flex-1 border-2 border-[#121212] bg-white hover:bg-[#f3f3f1]`}>
          Recusar opcionais
        </button>
        {configurando ? (
          <button type="button" onClick={() => decidir(preferencias)} className={`${botao} flex-1 border-2 border-[#121212]/40 bg-white hover:bg-[#f3f3f1]`}>
            Salvar escolhas
          </button>
        ) : (
          <button type="button" onClick={() => setConfigurando(true)} className={`${botao} flex-1 border-2 border-[#121212]/40 bg-white hover:bg-[#f3f3f1]`}>
            Configurar
          </button>
        )}
      </div>

      {reaberto && (
        <button type="button" onClick={fechar} className="mt-3 text-xs font-semibold underline underline-offset-2">
          Fechar sem mudar
        </button>
      )}
    </div>
  );
}
