"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Erro, PassoCodigo, botao, campo, chamar } from "./ContaComum";
import { IconeGoogle } from "./IconesSociais";

// Aba lateral de login e cadastro (como nas grandes lojas): abre ao tocar no bonequinho do topo.
// Passos: entrar (e-mail e senha) -> código de 6 dígitos no e-mail; ou criar conta -> código de 6 dígitos no e-mail.
// Também tem "Entrar com Google" (só funciona depois de ligado nas variáveis da loja). Facebook e Apple não são mostrados.

export const EVENTO_ABRIR_CONTA = "loja:abrir-conta";

type Modo = "entrar" | "criar" | "codigo";
type Disponiveis = Partial<Record<"google", boolean>>;

const AVISOS: Record<string, string> = {
  "social-indisponivel": "Esse tipo de login ainda não está ativo nesta loja. Entre com seu e-mail.",
  "social-falhou": "Não foi possível entrar com essa conta. Tente de novo ou use seu e-mail.",
  "social-cancelado": "O login foi cancelado. Se quiser, tente de novo.",
  "social-sem-email": "Essa conta não informou um e-mail, então não conseguimos criar seu acesso. Use outra forma de entrar.",
  "social-email-nao-confirmado": "O e-mail dessa conta ainda não foi confirmado no provedor. Confirme lá e tente de novo.",
};

const NOMES = { google: "Google" } as const;
const ICONES = { google: IconeGoogle } as const;

// O que a pessoa digita fica só na página em que ela está: trocar de página limpa tudo (recarregar também).
const VAZIO = { nome: "", email: "", telefone: "", senha: "", repetir: "" };

function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {texto}
      {children}
    </label>
  );
}

export function ContaLateral() {
  const pathname = usePathname() ?? "/";
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<Modo>("entrar");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [disponiveis, setDisponiveis] = useState<Disponiveis>({});
  const [f, setF] = useState(VAZIO);
  const [aceite, setAceite] = useState(false);
  const [desafio, setDesafio] = useState("");
  const painel = useRef<HTMLDivElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const origem = useRef<HTMLElement | null>(null);
  const mudar = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  const abrir = useCallback((m: Modo = "entrar", msg = "") => {
    origem.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setModo(m);
    setErro("");
    setAviso(msg);
    setDesafio("");
    setAberto(true);
  }, []);

  // Troca entre "Entrar" e "Criar conta": a senha digitada num formulário nunca aparece preenchida no outro.
  const trocarModo = (m: Modo) => {
    setModo(m);
    setErro("");
    setAviso("");
    setF((v) => ({ ...v, senha: "", repetir: "" }));
  };

  // Mudou de página: fecha a aba e apaga o que foi digitado.
  const paginaAnterior = useRef(pathname);
  useEffect(() => {
    if (paginaAnterior.current === pathname) return;
    paginaAnterior.current = pathname;
    setAberto(false);
    setModo("entrar");
    setErro("");
    setAviso("");
    setDesafio("");
    setAceite(false);
    setF(VAZIO);
  }, [pathname]);

  const encerrar = useCallback(() => {
    setAberto(false);
    setF((v) => ({ ...v, senha: "", repetir: "" }));
    origem.current?.focus?.();
  }, []);

  // Abre pelo bonequinho do topo.
  useEffect(() => {
    const ouvir = (e: Event) => abrir((e as CustomEvent<{ modo?: Modo }>).detail?.modo ?? "entrar");
    window.addEventListener(EVENTO_ABRIR_CONTA, ouvir);
    return () => window.removeEventListener(EVENTO_ABRIR_CONTA, ouvir);
  }, [abrir]);

  // Voltando de "Entrar com Google..." com algum aviso no endereço (?entrar=...): abre a aba e mostra o aviso.
  useEffect(() => {
    const url = new URL(window.location.href);
    const motivo = url.searchParams.get("entrar");
    if (!motivo) return;
    url.searchParams.delete("entrar");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    if (AVISOS[motivo]) abrir("entrar", AVISOS[motivo]);
  }, [abrir]);

  // Quais botões "Entrar com..." estão ligados.
  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    fetch("/api/conta/social", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (vivo) setDisponiveis(j); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [aberto]);

  // Foco, tecla Esc, "prender" o Tab dentro da aba e travar a rolagem da página.
  useEffect(() => {
    if (!aberto) return;
    fechar.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") return encerrar();
      if (e.key !== "Tab" || !painel.current) return;
      const itens = Array.from(painel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
      if (itens.length === 0) return;
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = antes; };
  }, [aberto, encerrar]);

  // Entrou: recarrega a página para a loja inteira (menu, carrinho, dados do pedido) já enxergar a conta.
  const concluir = () => {
    const nasPaginasDeLogin = pathname.startsWith("/loja/conta/entrar") || pathname.startsWith("/loja/conta/cadastrar");
    if (nasPaginasDeLogin) window.location.href = "/loja/conta";
    else window.location.reload();
  };

  const social = (p: keyof typeof NOMES) => {
    setErro("");
    if (disponiveis[p] === false) {
      setAviso("");
      return setErro(`Entrar com ${NOMES[p]} ainda não está ativo nesta loja. Use seu e-mail.`);
    }
    const voltar = `${pathname}${window.location.search}`;
    window.location.href = `/api/conta/social/${p}/iniciar?voltar=${encodeURIComponent(voltar)}`;
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/entrar", { email: f.email, senha: f.senha });
    if (ok && j.etapa === "codigo" && typeof j.desafio === "string") {
      setDesafio(j.desafio);
      setModo("codigo");
      setF((v) => ({ ...v, senha: "" }));
    } else if (ok) {
      return concluir();
    } else {
      setErro(j.erro || "Não foi possível entrar.");
    }
    setEnviando(false);
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    if (f.senha !== f.repetir) return setErro("As duas senhas não são iguais.");
    if (!aceite) return setErro("Para criar a conta, marque a caixa de concordância.");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/cadastro", { nome: f.nome, email: f.email, telefone: f.telefone, senha: f.senha });
    if (ok && j.etapa === "codigo" && typeof j.desafio === "string") {
      setDesafio(j.desafio);
      setModo("codigo");
      setF((v) => ({ ...v, senha: "", repetir: "" }));
    } else if (ok) {
      return concluir();
    } else {
      setErro(j.erro || "Não foi possível criar a conta.");
    }
    setEnviando(false);
  };

  const recomecar = (msg: string) => {
    setDesafio("");
    setModo("entrar");
    setErro(msg);
    setF((v) => ({ ...v, senha: "", repetir: "" }));
    setEnviando(false);
  };

  if (!aberto) return null;

  const titulo = modo === "codigo" ? "Digite o código" : modo === "criar" ? "Criar conta" : "Fazer login ou criar conta";
  const subtitulo =
    modo === "criar"
      ? "Leva um minuto. Você acompanha seus pedidos e não digita seus dados toda vez."
      : "Acompanhe seus pedidos e compre mais rápido, com seus dados já preenchidos.";
  const botaoSocial = "flex h-14 items-center justify-center rounded-full border border-[var(--lj-txt,#111)]/30 bg-[var(--lj-bg,#fff)] px-2 text-[var(--lj-txt,#111)] transition-colors hover:border-[var(--lj-txt,#111)] hover:bg-black/5 focus-visible:border-[var(--lj-txt,#111)] focus-visible:bg-black/5";

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="conta-lateral-titulo">
      <style>{"@keyframes lj-conta-entra{from{transform:translateX(100%)}to{transform:none}}@keyframes lj-conta-fundo{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion:no-preference){.lj-conta-painel{animation:lj-conta-entra .28s ease-out}.lj-conta-fundo{animation:lj-conta-fundo .28s ease-out}}"}</style>
      <button type="button" aria-label="Fechar" tabIndex={-1} className="lj-conta-fundo absolute inset-0 bg-black/50" onClick={encerrar} />
      <div ref={painel} className="lj-conta-painel absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col bg-[var(--lj-bg,#fff)] text-[var(--lj-txt,#111)] shadow-2xl">
        <div className="flex shrink-0 justify-end px-3 pt-3">
          <button ref={fechar} type="button" onClick={encerrar} aria-label="Fechar" className="inline-flex h-11 w-11 items-center justify-center">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-10 sm:px-8">
          <h2 id="conta-lateral-titulo" className="text-3xl font-extrabold uppercase leading-[1.05] tracking-[-0.01em] sm:text-[2rem]">{titulo}</h2>
          {modo !== "codigo" && <p className="mt-3 text-[var(--lj-mudo,#555)]">{subtitulo}</p>}

          {aviso && <p role="status" className="mt-5 border-l-4 border-[var(--lj-pri,#000)] bg-[var(--lj-suave,#f3f3f3)] px-4 py-3 text-sm font-medium">{aviso}</p>}

          {modo === "codigo" ? (
            <div className="mt-6">
              <PassoCodigo email={f.email} desafio={desafio} aoConcluir={concluir} aoReiniciar={recomecar} />
            </div>
          ) : (
            <>
              {disponiveis.google === true && (
              <>
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">Continuar com</p>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(NOMES) as (keyof typeof NOMES)[]).map((p) => {
                    const Icone = ICONES[p];
                    return (
                      <button key={p} type="button" onClick={() => social(p)} aria-label={`Entrar com ${NOMES[p]}`} title={NOMES[p]} className={botaoSocial}>
                        <Icone className="h-6 w-6" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--lj-mudo,#555)]" aria-hidden="true">
                <span className="h-px flex-1 bg-black/15" />
                ou com e-mail
                <span className="h-px flex-1 bg-black/15" />
              </div>
              </>
              )}

              {modo === "entrar" ? (
                <form key="entrar" onSubmit={entrar} className={`space-y-3 ${disponiveis.google === true ? "" : "mt-6"}`}>
                  <Rotulo texto="E-mail"><input className={`${campo} mt-1`} type="email" autoComplete="email" value={f.email} onChange={mudar("email")} required /></Rotulo>
                  <Rotulo texto="Senha"><input className={`${campo} mt-1`} type="password" name="senha" autoComplete="current-password" value={f.senha} onChange={mudar("senha")} required /></Rotulo>
                  <Erro texto={erro} />
                  <button type="submit" disabled={enviando} className={botao}>{enviando ? "Entrando..." : "Entrar"}</button>
                  <p className="pt-1 text-center text-sm">
                    <Link href="/loja/conta/esqueci" onClick={encerrar} className="font-semibold underline">Esqueci minha senha</Link>
                  </p>
                  <p className="pt-2 text-center text-sm text-[var(--lj-mudo,#555)]">
                    Ainda não tem conta?{" "}
                    <button type="button" onClick={() => trocarModo("criar")} className="font-semibold text-[var(--lj-txt,#111)] underline">Criar conta</button>
                  </p>
                </form>
              ) : (
                <form key="criar" onSubmit={criar} className={`space-y-3 ${disponiveis.google === true ? "" : "mt-6"}`}>
                  <Rotulo texto="Nome completo"><input className={`${campo} mt-1`} autoComplete="name" value={f.nome} onChange={mudar("nome")} required minLength={3} /></Rotulo>
                  <Rotulo texto="E-mail"><input className={`${campo} mt-1`} type="email" autoComplete="email" value={f.email} onChange={mudar("email")} required /></Rotulo>
                  <Rotulo texto="WhatsApp (opcional)"><input className={`${campo} mt-1`} type="tel" autoComplete="tel" value={f.telefone} onChange={mudar("telefone")} /></Rotulo>
                  <Rotulo texto="Senha (mínimo 8 caracteres)"><input className={`${campo} mt-1`} type="password" name="nova-senha" autoComplete="new-password" value={f.senha} onChange={mudar("senha")} required minLength={8} /></Rotulo>
                  <Rotulo texto="Repita a senha"><input className={`${campo} mt-1`} type="password" name="repetir-senha" autoComplete="new-password" value={f.repetir} onChange={mudar("repetir")} required minLength={8} /></Rotulo>
                  <label className="flex items-start gap-3 pt-1 text-sm text-[var(--lj-mudo,#555)]">
                    <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-black" />
                    <span>Concordo que a loja guarde meu nome, e-mail e telefone para criar minha conta e acompanhar meus pedidos. Posso apagar a conta quando quiser.</span>
                  </label>
                  <Erro texto={erro} />
                  <button type="submit" disabled={enviando} className={botao}>{enviando ? "Criando..." : "Criar conta"}</button>
                  <p className="pt-2 text-center text-sm text-[var(--lj-mudo,#555)]">
                    Já tem conta?{" "}
                    <button type="button" onClick={() => trocarModo("entrar")} className="font-semibold text-[var(--lj-txt,#111)] underline">Entrar</button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
