"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, MailWarning, UserRound } from "lucide-react";
import { brl } from "@/data/loja";

const SITUACOES: Record<string, string> = {
  ORCAMENTO: "Em análise", AGUARDANDO_APROVACAO: "Aguardando aprovação", APROVADO: "Aprovado", PAGAMENTO_PENDENTE: "Aguardando pagamento",
  PAGAMENTO_CONFIRMADO: "Pagamento confirmado", EM_PRODUCAO: "Em preparação", CONTROLE_QUALIDADE: "Em preparação", PRONTO: "Pronto",
  ENTREGUE: "Entregue", CONCLUIDO: "Concluído", CANCELADO: "Cancelado", EM_ATRASO: "Em preparação", AGUARDANDO_ALTERACAO: "Aguardando alteração",
};
const rotuloSituacao = (s: string, _x?: boolean) => SITUACOES[s] ?? "Em andamento";

// Telas da conta do cliente: entrar, criar conta, esqueci a senha, nova senha, confirmar e-mail e "Minha conta".

const campo = "h-12 w-full rounded-2xl border border-[var(--lj-borda)] bg-[var(--lj-bg)] px-4 text-base outline-none focus:border-[var(--lj-pri)]";
const botao = "h-14 w-full rounded-full bg-[var(--lj-pri)] text-base font-semibold text-[var(--lj-pri-txt)] hover:opacity-95 disabled:opacity-50";
const botaoVazado = "inline-flex h-11 items-center justify-center rounded-full border border-[var(--lj-borda)] px-5 text-sm font-semibold hover:border-[var(--lj-pri)] disabled:opacity-50";
const dia = (v: string) => new Date(v).toLocaleDateString("pt-BR");

// Só aceita voltar para caminhos do próprio site (evita "redirecionamento aberto").
const caminhoSeguro = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/loja/conta");

type Resposta = { ok: boolean; j: Record<string, unknown> & { erro?: string } };

async function chamar(url: string, corpo?: unknown, metodo = "POST"): Promise<Resposta> {
  try {
    const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, j };
  } catch {
    return { ok: false, j: { erro: "Sem conexão. Tente de novo." } };
  }
}

function Moldura({ titulo, texto, children }: { titulo: string; texto?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--lj-suave)] text-[var(--lj-pri)]">
        <UserRound className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-center text-4xl lj-titulo">{titulo}</h1>
      {texto && <p className="mx-auto mt-3 text-center text-[var(--lj-mudo)]">{texto}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Campo({ rotulo, ...props }: { rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium">
      {rotulo}
      <input className={`${campo} mt-1`} {...props} />
    </label>
  );
}

const Erro = ({ texto }: { texto: string }) => (texto ? <p role="alert" className="text-sm font-semibold text-[#b42318]">{texto}</p> : null);

export function TelaEntrar() {
  const router = useRouter();
  const voltar = caminhoSeguro(useSearchParams().get("voltar"));
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/entrar", { email, senha });
    if (ok) {
      router.push(voltar);
      router.refresh();
    } else {
      setErro(j.erro || "Não foi possível entrar.");
      setEnviando(false);
    }
  };

  return (
    <Moldura titulo="Entrar" texto="Acompanhe seus pedidos e compre mais rápido.">
      <form onSubmit={enviar} className="space-y-3">
        <Campo rotulo="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <Erro texto={erro} />
        <button type="submit" disabled={enviando} className={botao}>{enviando ? "Entrando..." : "Entrar"}</button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/loja/conta/esqueci" className="font-semibold text-[var(--lj-pri)] underline">Esqueci minha senha</Link>
      </p>
      <p className="mt-3 text-center text-sm text-[var(--lj-mudo)]">
        Ainda não tem conta?{" "}
        <Link href={`/loja/conta/cadastrar${voltar !== "/loja/conta" ? `?voltar=${encodeURIComponent(voltar)}` : ""}`} className="font-semibold text-[var(--lj-pri)] underline">Criar conta</Link>
      </p>
    </Moldura>
  );
}

export function TelaCadastrar() {
  const router = useRouter();
  const voltar = caminhoSeguro(useSearchParams().get("voltar"));
  const [f, setF] = useState({ nome: "", email: "", telefone: "", senha: "", repetir: "" });
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState<{ emailEnviado: boolean } | null>(null);
  const mudar = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (f.senha !== f.repetir) return setErro("As duas senhas não são iguais.");
    if (!aceite) return setErro("Para criar a conta, marque a caixa de concordância.");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/cadastro", { nome: f.nome, email: f.email, telefone: f.telefone, senha: f.senha });
    if (ok) setFeito({ emailEnviado: j.emailEnviado === true });
    else setErro(j.erro || "Não foi possível criar a conta.");
    setEnviando(false);
  };

  if (feito) {
    return (
      <Moldura titulo="Conta criada">
        <div className="rounded-[var(--lj-r-gg)] bg-[var(--lj-suave)] p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--lj-pri)]" aria-hidden="true" />
          <p className="mt-3 font-semibold">{feito.emailEnviado ? `Enviamos um e-mail de confirmação para ${f.email}.` : "Sua conta está pronta."}</p>
          <p className="mt-2 text-sm text-[var(--lj-mudo)]">
            {feito.emailEnviado
              ? "Abra o e-mail e toque no botão para confirmar. Enquanto isso você já pode comprar."
              : "Não conseguimos enviar o e-mail de confirmação agora. Você pode pedir outro na página Minha conta."}
          </p>
        </div>
        <button type="button" onClick={() => { router.push(voltar); router.refresh(); }} className={`${botao} mt-6`}>Continuar</button>
      </Moldura>
    );
  }

  return (
    <Moldura titulo="Criar conta" texto="Leva um minuto. Você acompanha seus pedidos e não digita seus dados toda vez.">
      <form onSubmit={enviar} className="space-y-3">
        <Campo rotulo="Nome completo" autoComplete="name" value={f.nome} onChange={mudar("nome")} required minLength={3} />
        <Campo rotulo="E-mail" type="email" autoComplete="email" value={f.email} onChange={mudar("email")} required />
        <Campo rotulo="WhatsApp (opcional)" type="tel" autoComplete="tel" value={f.telefone} onChange={mudar("telefone")} />
        <Campo rotulo="Senha (mínimo 8 caracteres)" type="password" autoComplete="new-password" value={f.senha} onChange={mudar("senha")} required minLength={8} />
        <Campo rotulo="Repita a senha" type="password" autoComplete="new-password" value={f.repetir} onChange={mudar("repetir")} required minLength={8} />
        <label className="flex items-start gap-3 pt-1 text-sm text-[var(--lj-mudo)]">
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
          <span>Concordo que a loja guarde meu nome, e-mail e telefone para criar minha conta e acompanhar meus pedidos. Posso apagar a conta quando quiser.</span>
        </label>
        <Erro texto={erro} />
        <button type="submit" disabled={enviando} className={botao}>{enviando ? "Criando..." : "Criar conta"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--lj-mudo)]">
        Já tem conta?{" "}
        <Link href="/loja/conta/entrar" className="font-semibold text-[var(--lj-pri)] underline">Entrar</Link>
      </p>
    </Moldura>
  );
}

export function TelaEsqueci() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/esqueci", { email });
    if (ok) setFeito(true);
    else setErro(j.erro || "Não foi possível enviar agora.");
    setEnviando(false);
  };

  return (
    <Moldura titulo="Esqueci minha senha" texto="Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.">
      {feito ? (
        <div role="status" className="rounded-[var(--lj-r-gg)] bg-[var(--lj-suave)] p-6 text-center">
          <p className="font-semibold">Pronto! Se existir uma conta com {email}, o link já está a caminho.</p>
          <p className="mt-2 text-sm text-[var(--lj-mudo)]">Olhe também a caixa de spam. O link vale por 1 hora.</p>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <Campo rotulo="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Erro texto={erro} />
          <button type="submit" disabled={enviando} className={botao}>{enviando ? "Enviando..." : "Enviar link"}</button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link href="/loja/conta/entrar" className="font-semibold text-[var(--lj-pri)] underline">Voltar para entrar</Link></p>
    </Moldura>
  );
}

export function TelaRedefinir() {
  const codigo = useSearchParams().get("codigo") ?? "";
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (senha !== repetir) return setErro("As duas senhas não são iguais.");
    setEnviando(true);
    const { ok, j } = await chamar("/api/conta/redefinir", { codigo, senha });
    if (ok) setFeito(true);
    else setErro(j.erro || "Não foi possível trocar a senha.");
    setEnviando(false);
  };

  if (!codigo) {
    return (
      <Moldura titulo="Link incompleto">
        <p className="text-center text-[var(--lj-mudo)]">Abra o link que enviamos por e-mail, ou <Link href="/loja/conta/esqueci" className="font-semibold text-[var(--lj-pri)] underline">peça um novo</Link>.</p>
      </Moldura>
    );
  }
  if (feito) {
    return (
      <Moldura titulo="Senha trocada">
        <p className="text-center text-[var(--lj-mudo)]">Sua nova senha já vale. Entre com ela.</p>
        <Link href="/loja/conta/entrar" className={`${botao} mt-6 inline-flex items-center justify-center`}>Entrar</Link>
      </Moldura>
    );
  }
  return (
    <Moldura titulo="Nova senha" texto="Escolha uma senha com pelo menos 8 caracteres.">
      <form onSubmit={enviar} className="space-y-3">
        <Campo rotulo="Nova senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={8} />
        <Campo rotulo="Repita a nova senha" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={8} />
        <Erro texto={erro} />
        <button type="submit" disabled={enviando} className={botao}>{enviando ? "Salvando..." : "Salvar nova senha"}</button>
      </form>
    </Moldura>
  );
}

export function TelaVerificar() {
  const codigo = useSearchParams().get("codigo") ?? "";
  const [estado, setEstado] = useState<"conferindo" | "ok" | "erro">(codigo ? "conferindo" : "erro");
  const [msg, setMsg] = useState(codigo ? "" : "Link incompleto. Abra o link que enviamos por e-mail.");

  useEffect(() => {
    if (!codigo) return;
    chamar("/api/conta/verificar", { codigo })
      .then(({ ok, j }) => {
        setEstado(ok ? "ok" : "erro");
        setMsg(ok ? "" : j.erro || "Não foi possível confirmar.");
      })
      .catch(() => {
        setEstado("erro");
        setMsg("Sem conexão. Tente de novo.");
      });
  }, [codigo]);

  return (
    <Moldura titulo={estado === "ok" ? "E-mail confirmado" : estado === "erro" ? "Não foi possível confirmar" : "Confirmando..."}>
      {estado === "ok" && <p className="text-center text-[var(--lj-mudo)]">Tudo certo! Sua conta está protegida e seus pedidos aparecem em Minha conta.</p>}
      {estado === "erro" && <p role="alert" className="text-center text-[var(--lj-mudo)]">{msg}</p>}
      <Link href="/loja/conta" className={`${botao} mt-6 inline-flex items-center justify-center`}>Ir para Minha conta</Link>
    </Moldura>
  );
}

interface ContaDados { id: string; nome: string; email: string; telefone: string | null; verificado: boolean }
interface PedidoConta { orderNumber: string; status: string; totalAmount: number; trackingCode: string | null; createdAt: string; items: { product: string; size: string | null; color: string | null; quantity: number }[] }

export function TelaMinhaConta() {
  const router = useRouter();
  const [conta, setConta] = useState<ContaDados | null | undefined>(undefined);
  const [pedidos, setPedidos] = useState<PedidoConta[] | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const [senhas, setSenhas] = useState({ atual: "", nova: "" });
  const [excluindo, setExcluindo] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState("");

  const carregar = useCallback(async () => {
    const r = await fetch("/api/conta/eu", { cache: "no-store" }).then((x) => x.json()).catch(() => ({ conta: null }));
    if (!r.conta) {
      router.replace("/loja/conta/entrar");
      setConta(null);
      return;
    }
    setConta(r.conta);
    setNome(r.conta.nome);
    setTelefone(r.conta.telefone ?? "");
    fetch("/api/conta/pedidos", { cache: "no-store" }).then((x) => x.json()).then((j) => setPedidos(j.pedidos ?? [])).catch(() => setPedidos([]));
  }, [router]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aviseCom = (ok: boolean, texto: string) => {
    setAviso(ok ? texto : "");
    setErro(ok ? "" : texto);
  };

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, j } = await chamar("/api/conta/perfil", { nome, telefone }, "PATCH");
    aviseCom(ok, ok ? "Dados salvos." : j.erro || "Não foi possível salvar.");
  };
  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, j } = await chamar("/api/conta/senha", senhas);
    if (ok) setSenhas({ atual: "", nova: "" });
    aviseCom(ok, ok ? "Senha trocada." : j.erro || "Não foi possível trocar a senha.");
  };
  const reenviar = async () => {
    const { ok, j } = await chamar("/api/conta/reenviar");
    aviseCom(ok, ok ? (j.emailEnviado === false ? "Não conseguimos enviar o e-mail agora. Tente mais tarde." : "Enviamos um novo e-mail de confirmação.") : j.erro || "Não foi possível reenviar.");
  };
  const sair = async () => {
    await chamar("/api/conta/sair");
    router.push("/");
    router.refresh();
  };
  const excluir = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, j } = await chamar("/api/conta/excluir", { senha: senhaExcluir });
    if (ok) {
      router.push("/");
      router.refresh();
    } else aviseCom(false, j.erro || "Não foi possível excluir.");
  };

  if (!conta) return <div className="mx-auto max-w-md px-4 py-24 text-center text-[var(--lj-mudo)]">Carregando...</div>;

  const bloco = "rounded-[var(--lj-r-gg)] bg-[var(--lj-suave)] p-6";
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--lj-mudo)]">Minha conta</p>
          <h1 className="text-4xl lj-titulo">Olá, {conta.nome.split(" ")[0]}</h1>
        </div>
        <button type="button" onClick={sair} className={botaoVazado}>Sair</button>
      </div>

      {!conta.verificado && (
        <div role="status" className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <MailWarning className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">Confirme seu e-mail ({conta.email}) para ver aqui os pedidos que você já fez antes de criar a conta.</p>
          <button type="button" onClick={reenviar} className="rounded-full border border-amber-400 px-4 py-2 font-semibold">Reenviar e-mail</button>
        </div>
      )}
      {aviso && <p role="status" className="mt-4 text-sm font-semibold text-[var(--lj-pri)]">{aviso}</p>}
      {erro && <p role="alert" className="mt-4 text-sm font-semibold text-[#b42318]">{erro}</p>}

      <section className="mt-10" aria-labelledby="meus-pedidos">
        <h2 id="meus-pedidos" className="text-2xl font-extrabold tracking-tight">Meus pedidos</h2>
        {pedidos === null && <p className="mt-3 text-[var(--lj-mudo)]">Carregando...</p>}
        {pedidos?.length === 0 && <p className="mt-3 text-[var(--lj-mudo)]">Você ainda não fez nenhum pedido com esta conta. <Link href="/loja/todos" className="font-semibold text-[var(--lj-pri)] underline">Ver produtos</Link></p>}
        <ul className="mt-4 space-y-3">
          {pedidos?.map((p) => (
            <li key={p.orderNumber} className={bloco}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">{p.orderNumber}</p>
                <p className="text-sm text-[var(--lj-mudo)]">{dia(p.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm">{p.status === "CANCELADO" ? "Cancelado" : rotuloSituacao(p.status, false)} · <strong>{brl(p.totalAmount)}</strong></p>
              <ul className="mt-2 text-sm text-[var(--lj-mudo)]">
                {p.items.map((i, k) => <li key={k}>{i.quantity}× {i.product}{i.color || i.size ? ` (${[i.color, i.size].filter(Boolean).join(", ")})` : ""}</li>)}
              </ul>
              {p.trackingCode && <p className="mt-2 text-sm">Rastreio: <span className="font-mono font-bold">{p.trackingCode}</span></p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <form onSubmit={salvarPerfil} className={`${bloco} space-y-3`}>
          <h2 className="text-lg font-bold">Meus dados</h2>
          <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required minLength={3} />
          <Campo rotulo="WhatsApp" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <p className="text-sm text-[var(--lj-mudo)]">E-mail: {conta.email} {conta.verificado ? "(confirmado)" : "(não confirmado)"}</p>
          <button type="submit" className={botaoVazado}>Salvar dados</button>
        </form>
        <form onSubmit={trocarSenha} className={`${bloco} space-y-3`}>
          <h2 className="text-lg font-bold">Trocar senha</h2>
          <Campo rotulo="Senha atual" type="password" autoComplete="current-password" value={senhas.atual} onChange={(e) => setSenhas((s) => ({ ...s, atual: e.target.value }))} required />
          <Campo rotulo="Nova senha (mínimo 8)" type="password" autoComplete="new-password" value={senhas.nova} onChange={(e) => setSenhas((s) => ({ ...s, nova: e.target.value }))} required minLength={8} />
          <button type="submit" className={botaoVazado}>Trocar senha</button>
        </form>
      </section>

      <section className="mt-10 text-sm text-[var(--lj-mudo)]">
        {!excluindo ? (
          <button type="button" onClick={() => setExcluindo(true)} className="underline">Excluir minha conta</button>
        ) : (
          <form onSubmit={excluir} className="max-w-sm space-y-3">
            <p>Isso apaga seu acesso e seus dados de conta. Os pedidos já feitos continuam registrados na loja. Digite sua senha para confirmar.</p>
            <input type="password" value={senhaExcluir} onChange={(e) => setSenhaExcluir(e.target.value)} className={campo} autoComplete="current-password" required aria-label="Senha para confirmar" />
            <div className="flex gap-3">
              <button type="submit" className="h-11 rounded-full bg-[#b42318] px-5 text-sm font-semibold text-white">Excluir conta</button>
              <button type="button" onClick={() => setExcluindo(false)} className={botaoVazado}>Cancelar</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
