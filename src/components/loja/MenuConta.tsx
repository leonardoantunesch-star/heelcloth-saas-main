"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { EVENTO_ABRIR_CONTA } from "./ContaLateral";

interface ContaResumo { nome: string; email: string }

// Bonequinho do topo da loja (como nas grandes lojas): sem login abre a aba lateral "Fazer login ou criar conta";
// com o cliente logado mostra "Olá, nome", Meus pedidos e Sair.
export function MenuConta({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const [aberto, setAberto] = useState(false);
  const [conta, setConta] = useState<ContaResumo | null>(null);
  const [saindo, setSaindo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Confere quem está logado; de novo a cada página (a pessoa pode ter entrado ou saído).
  useEffect(() => {
    let vivo = true;
    fetch("/api/conta/eu", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (vivo) setConta(j.conta ? { nome: j.conta.nome, email: j.conta.email } : null); })
      .catch(() => { if (vivo) setConta(null); });
    setAberto(false);
    return () => { vivo = false; };
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent | TouchEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("touchstart", fora);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("touchstart", fora); document.removeEventListener("keydown", tecla); };
  }, [aberto]);

  // Com mouse, abre ao passar por cima (no celular só no toque).
  const passou = useCallback((dentro: boolean) => {
    if (typeof window === "undefined" || !conta || !window.matchMedia("(hover: hover)").matches) return;
    if (fecharTimer.current) clearTimeout(fecharTimer.current);
    if (dentro) setAberto(true);
    else fecharTimer.current = setTimeout(() => setAberto(false), 180);
  }, [conta]);

  async function sair() {
    setSaindo(true);
    try { await fetch("/api/conta/sair", { method: "POST" }); } catch { /* segue */ }
    setConta(null);
    setSaindo(false);
    setAberto(false);
    window.location.href = pathname.startsWith("/loja/conta") ? "/" : pathname;
  }

  const primeiroNome = conta?.nome.split(" ")[0] ?? "";
  const borda = "var(--lj-borda, rgba(0,0,0,0.2))";
  const item = "block px-5 py-3 text-sm hover:bg-[var(--lj-suave,#f3f3f3)] focus-visible:bg-[var(--lj-suave,#f3f3f3)] focus-visible:outline-none";

  return (
    <div ref={raiz} className={`relative ${className}`} onMouseEnter={() => passou(true)} onMouseLeave={() => passou(false)}>
      <button
        type="button"
        onClick={() => {
          if (!conta) return void window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_CONTA));
          setAberto((v) => (window.matchMedia("(hover: hover)").matches ? true : !v));
        }}
        aria-label={conta ? `Minha conta (${primeiroNome})` : "Entrar ou criar conta"}
        aria-expanded={aberto}
        aria-haspopup={conta ? "true" : "dialog"}
        className="relative inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center"
      >
        <UserRound className="h-[22px] w-[22px]" aria-hidden="true" strokeWidth={1.6} />
        {conta && <span aria-hidden="true" className="absolute right-[9px] top-[9px] h-2.5 w-2.5 rounded-full border-2 border-[var(--lj-bg,#fff)] bg-[var(--lj-dest,var(--lj-pri,#000))]" />}
      </button>

      {aberto && conta && (
        <div
          role="menu"
          aria-label="Conta"
          style={{ borderColor: borda, borderRadius: "var(--lj-r, 0px)" }}
          className="absolute right-0 top-full z-50 mt-1 w-[17.5rem] max-w-[calc(100vw-2rem)] border bg-[var(--lj-bg,#fff)] text-[var(--lj-txt,#111)] shadow-xl"
        >
          <div className="px-5 pb-3 pt-5">
            <p className="text-base font-bold">Olá, {primeiroNome}</p>
          </div>
          <div className="border-t py-1" style={{ borderColor: borda }}>
            <Link href="/loja/conta" role="menuitem" className={item}>Meus pedidos</Link>
            <Link href="/loja/conta" role="menuitem" className={item}>Meus dados e senha</Link>
            <button type="button" role="menuitem" onClick={sair} disabled={saindo} className={`${item} w-full text-left`}>{saindo ? "Saindo..." : "Sair"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
