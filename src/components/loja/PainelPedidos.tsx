"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronRight, Search } from "lucide-react";
import { brl } from "@/data/loja";

export interface PedidoPainel {
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { product: string; size: string | null; color: string | null; quantity: number }[];
}

const SITUACOES: Record<string, string> = {
  ORCAMENTO: "Em análise", AGUARDANDO_APROVACAO: "Aguardando aprovação", APROVADO: "Aprovado", PAGAMENTO_PENDENTE: "Aguardando pagamento",
  PAGAMENTO_CONFIRMADO: "Pagamento confirmado", EM_PRODUCAO: "Em preparação", CONTROLE_QUALIDADE: "Em preparação", PRONTO: "Pronto para envio",
  ENTREGUE: "Entregue", CONCLUIDO: "Concluído", CANCELADO: "Cancelado", EM_ATRASO: "Em preparação", AGUARDANDO_ALTERACAO: "Aguardando alteração",
};
const situacao = (s: string) => SITUACOES[s] ?? "Em andamento";
const finalizado = (s: string) => ["ENTREGUE", "CONCLUIDO", "CANCELADO"].includes(s);
const DIA = 86_400_000;
const CODIGO_VALIDO = /^[A-Z0-9][A-Z0-9-]{4,28}$/;

// Painel "Pedidos" da conta do cliente:
//  - compras da loja online Heel Cloth feitas com o e-mail da conta aparecem sozinhas (com filtro de período);
//  - pedidos de uniforme (sublimação) são acompanhados pelo código, no formulário logo abaixo;
//  - dúvidas frequentes no fim.
export function PainelPedidos({ pedidos, precisaConfirmar }: { pedidos: PedidoPainel[] | null; precisaConfirmar: boolean }) {
  const [periodo, setPeriodo] = useState("todos");

  const anos = useMemo(
    () => [...new Set((pedidos ?? []).map((p) => new Date(p.createdAt).getFullYear()))].sort((a, b) => b - a),
    [pedidos],
  );

  const lista = useMemo(() => {
    const agora = Date.now();
    return (pedidos ?? []).filter((p) => {
      const t = new Date(p.createdAt).getTime();
      if (periodo === "30d") return agora - t <= 30 * DIA;
      if (periodo === "6m") return agora - t <= 183 * DIA;
      if (/^\d{4}$/.test(periodo)) return new Date(p.createdAt).getFullYear() === Number(periodo);
      return true;
    });
  }, [pedidos, periodo]);

  return (
    <section aria-labelledby="titulo-pedidos">
      <h1 id="titulo-pedidos" className="text-4xl lj-titulo sm:text-5xl">Pedidos</h1>

      <div className="mt-6 flex flex-col gap-5 border-b border-[var(--lj-borda)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed text-[var(--lj-mudo)]">
          Suas compras na loja online Heel Cloth aparecem aqui automaticamente, inclusive as feitas antes de criar a conta com este mesmo e-mail.
        </p>
        <label className="flex items-center gap-3 text-sm">
          <span className="shrink-0">Ver pedidos de:</span>
          <span className="relative">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="h-12 min-w-[13rem] appearance-none rounded-full border border-[var(--lj-borda)] bg-[var(--lj-bg)] pl-5 pr-11 text-sm focus:border-[var(--lj-pri)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lj-pri)]"
            >
              <option value="todos">Qualquer período</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="6m">Últimos 6 meses</option>
              {anos.map((a) => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
          </span>
        </label>
      </div>

      <div aria-live="polite">
        {pedidos === null ? (
          <p className="py-20 text-center text-[var(--lj-mudo)]">Carregando pedidos...</p>
        ) : lista.length === 0 ? (
          <Vazio filtrado={periodo !== "todos"} precisaConfirmar={precisaConfirmar} limpar={() => setPeriodo("todos")} />
        ) : (
          <ul aria-label="Compras da loja online" className="divide-y divide-[var(--lj-borda)] border-b border-[var(--lj-borda)]">
            {lista.map((p) => (
              <li key={p.orderNumber} className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--lj-mudo)]">
                      {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    <p className="mt-1 text-lg font-extrabold">Pedido {p.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold tabular-nums">{brl(p.totalAmount)}</p>
                    <p className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${p.status === "CANCELADO" ? "text-[#b42318]" : ""}`}>
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${p.status === "CANCELADO" ? "bg-[#b42318]" : finalizado(p.status) ? "bg-[#1f7a3d]" : "bg-[#b45309]"}`} />
                      {situacao(p.status)}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-[var(--lj-mudo)]">
                  {p.items.map((i, k) => (
                    <li key={k}>
                      {i.quantity}× {i.product}
                      {i.color || i.size ? ` (${[i.color, i.size].filter(Boolean).join(", ")})` : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RastrearSublimacao />

      <div className="mt-12 border-t border-[var(--lj-borda)] pt-12">
        <h2 className="text-2xl lj-titulo">Dúvidas frequentes</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          <li>
            <Link
              href="/loja/duvidas"
              className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-[var(--lj-borda)] p-6 font-semibold transition-colors hover:border-[var(--lj-pri)]"
            >
              Conheça as formas de pagamento, prazos de entrega e frete
              <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" />
            </Link>
          </li>
          <li>
            <Link
              href="/trocas"
              className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-[var(--lj-borda)] p-6 font-semibold transition-colors hover:border-[var(--lj-pri)]"
            >
              Saiba como trocar ou devolver um produto e todas as condições
              <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

// Uniformes personalizados não ficam ligados à conta: a pessoa digita o código que recebeu e vai para o rastreio.
function RastrearSublimacao() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");

  const ir = (e: React.FormEvent) => {
    e.preventDefault();
    const c = codigo.trim().toUpperCase().replace(/\s+/g, "");
    if (!CODIGO_VALIDO.test(c)) {
      setErro("Digite o código do jeito que você recebeu, por exemplo HC-2611-ABCD.");
      return;
    }
    setErro("");
    router.push(`/rastreio/${encodeURIComponent(c)}`);
  };

  return (
    <section aria-labelledby="titulo-sublimacao" className="mt-12 rounded-2xl bg-[var(--lj-suave)] p-6 sm:p-8">
      <h2 id="titulo-sublimacao" className="text-xl lj-titulo sm:text-2xl">Uniforme personalizado (sublimação)</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--lj-mudo)]">
        Pedidos de uniforme são acompanhados pelo código que você recebeu ao enviar o pedido (começa com HC-).
      </p>
      <form onSubmit={ir} noValidate className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold">
          Código do pedido
          <input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setErro("");
            }}
            placeholder="HC-2611-ABCD"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={30}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "erro-codigo" : undefined}
            className="mt-1 h-12 w-full rounded-full border border-[var(--lj-borda)] bg-[var(--lj-bg)] px-5 font-mono text-base uppercase tracking-wider focus:border-[var(--lj-pri)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lj-pri)]"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--lj-pri)] px-7 text-sm font-bold text-[var(--lj-pri-txt)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lj-pri)] focus-visible:ring-offset-2"
        >
          <Search aria-hidden="true" className="h-4 w-4" /> Acompanhar
        </button>
      </form>
      {erro && <p id="erro-codigo" role="alert" className="mt-2 text-sm font-semibold text-[#b42318]">{erro}</p>}
    </section>
  );
}

function Vazio({ filtrado, precisaConfirmar, limpar }: { filtrado: boolean; precisaConfirmar: boolean; limpar: () => void }) {
  const titulo = "text-3xl lj-titulo sm:text-4xl";
  const botaoCheio = "mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-[var(--lj-pri)] px-7 text-sm font-bold text-[var(--lj-pri-txt)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lj-pri)] focus-visible:ring-offset-2";
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      {filtrado ? (
        <>
          <p className={titulo}>Nenhum pedido neste período</p>
          <p className="mt-2 text-[var(--lj-mudo)]">Tente outro período para ver suas compras.</p>
          <button type="button" onClick={limpar} className={botaoCheio}>Ver todos os pedidos</button>
        </>
      ) : precisaConfirmar ? (
        <>
          <p className={titulo}>Confirme seu e-mail</p>
          <p className="mt-2 max-w-md text-[var(--lj-mudo)]">Por segurança, suas compras só aparecem aqui depois que você confirma o e-mail da conta. Use o link que enviamos ou o botão “Reenviar e-mail” acima.</p>
        </>
      ) : (
        <>
          <p className={titulo}>Nenhum pedido ainda</p>
          <p className="mt-2 text-[var(--lj-mudo)]">Pronto para começar?</p>
          <Link href="/loja/todos" className={botaoCheio}>
            Começar a comprar <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </>
      )}
    </div>
  );
}
