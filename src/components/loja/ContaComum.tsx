"use client";

import React, { useEffect, useState } from "react";

// Peças compartilhadas da conta do cliente: usadas nas páginas (/loja/conta/...) e na aba lateral de login.
// As cores têm um valor reserva porque a aba lateral abre em páginas que não definem as variáveis da área da conta.

export const campo = "h-12 w-full rounded-2xl border border-[var(--lj-borda,rgba(0,0,0,0.2))] bg-[var(--lj-bg,#fff)] px-4 text-base outline-none focus:border-[var(--lj-pri,#000)]";
export const botao = "h-14 w-full rounded-full bg-[var(--lj-pri,#000)] text-base font-semibold text-[var(--lj-pri-txt,#fff)] hover:opacity-95 disabled:opacity-50";

// Versão reta (cantos quadrados) usada na aba lateral, combinando com o resto da loja.
export const campoReto = campo.replace("rounded-2xl", "rounded-none");
export const botaoReto = botao.replace("rounded-full", "rounded-none");

// Nunca mostra o e-mail inteiro na tela: "maria@gmail.com" vira "m***@g***.com".
export function mascararEmail(e: string): string {
  const [u = "", d = ""] = e.split("@");
  const [dom = "", ...resto] = d.split(".");
  return `${u.slice(0, 1)}***@${dom.slice(0, 1)}***${resto.length ? "." + resto.join(".") : ""}`;
}

// Só aceita voltar para caminhos do próprio site (evita "redirecionamento aberto").
export const caminhoSeguro = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/loja/conta");

export type Resposta = { ok: boolean; j: Record<string, unknown> & { erro?: string } };

export async function chamar(url: string, corpo?: unknown, metodo = "POST"): Promise<Resposta> {
  try {
    const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, j };
  } catch {
    return { ok: false, j: { erro: "Sem conexão. Tente de novo." } };
  }
}

export const Erro = ({ texto }: { texto: string }) => (texto ? <p role="alert" className="text-sm font-semibold text-[#b42318]">{texto}</p> : null);

// 2ª etapa do login e do cadastro: o código de 6 dígitos que foi para o e-mail.
// "aoConcluir" roda quando o código confere (a sessão já foi criada); "aoReiniciar" volta para a 1ª etapa.
export function PassoCodigo({ email, desafio, aoConcluir, aoReiniciar, reto = false }: { email: string; desafio: string; aoConcluir: () => void; aoReiniciar: (msg: string) => void; reto?: boolean }) {
  const cCampo = reto ? campoReto : campo;
  const cBotao = reto ? botaoReto : botao;
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(30);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/entrar/codigo", { desafio, codigo });
    if (ok) return aoConcluir();
    if (j.reiniciar) return aoReiniciar(j.erro || "Entre de novo.");
    setErro(j.erro || "Código incorreto.");
    setCodigo("");
    setEnviando(false);
  };

  const reenviar = async () => {
    setErro("");
    setAviso("");
    const { ok, j } = await chamar("/api/conta/entrar/reenviar", { desafio });
    if (ok) {
      setAviso("Enviamos um novo código.");
      setEspera(30);
    } else if (j.reiniciar) {
      aoReiniciar(j.erro || "Entre de novo.");
    } else {
      setErro(j.erro || "Não foi possível reenviar.");
    }
  };

  return (
    <div>
      <p className="text-center text-[var(--lj-mudo,#555)]">Enviamos um código de 6 dígitos para {mascararEmail(email)}. Ele vale por 10 minutos.</p>
      <form onSubmit={confirmar} className="mt-6 space-y-3">
        <label className="block text-sm font-semibold">
          Código de 6 dígitos
          <input
            className={`${cCampo} mt-1 text-center text-2xl tracking-[0.5em]`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
            required
          />
        </label>
        <Erro texto={erro} />
        {aviso && <p role="status" className="text-sm font-semibold text-[var(--lj-pri,#000)]">{aviso}</p>}
        <button type="submit" disabled={enviando || codigo.length !== 6} className={cBotao}>{enviando ? "Conferindo..." : "Confirmar e entrar"}</button>
      </form>
      <p className="mt-5 text-center text-sm">
        <button type="button" onClick={reenviar} disabled={espera > 0} className="font-semibold text-[var(--lj-pri,#000)] underline disabled:no-underline disabled:opacity-50">
          {espera > 0 ? `Reenviar código em ${espera}s` : "Reenviar código"}
        </button>
      </p>
      <p className="mt-3 text-center text-sm text-[var(--lj-mudo,#555)]">
        <button type="button" onClick={() => aoReiniciar("")} className="font-semibold underline">Voltar</button>
      </p>
    </div>
  );
}
