"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Search,
  CreditCard,
  ShoppingCart,
  Trash2,
  Check,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

const PERIODOS = [
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "Últimos 7 Dias" },
  { id: "mes", label: "Mês Atual" },
  { id: "ano", label: "Ano Atual" },
  { id: "todos", label: "Todo o Histórico" },
];

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [indicadores, setIndicadores] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [periodo, setPeriodo] = useState("mes");
  const [tipo, setTipo] = useState("TODOS");
  const [status, setStatus] = useState("TODOS");
  const [busca, setBusca] = useState("");

  // Modais e Estados
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  // Formulário Nova Transação
  const [novaTransacao, setNovaTransacao] = useState({
    type: "RECEITA" as "RECEITA" | "DESPESA",
    category: "VENDA" as string,
    description: "",
    amount: 0,
    paymentMethod: "PIX",
    dueDate: "",
    status: "PAGO" as "PAGO" | "PENDENTE",
    supplier: "",
  });

  const carregarFinanceiro = () => {
    setIsLoading(true);
    let url = `/api/financeiro?periodo=${periodo}`;
    if (tipo !== "TODOS") url += `&tipo=${tipo}`;
    if (status !== "TODOS") url += `&status=${status}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setTransacoes(data.transacoes);
          setIndicadores(data.indicadores);
        } else {
          setMensagemErro(data.erro || "Falha ao carregar financeiro");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setMensagemErro("Erro ao conectar com o servidor financeiro");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    carregarFinanceiro();
  }, [periodo, tipo, status]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarFinanceiro();
  };

  const handleCriarTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTransacao),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagemErro(data.erro || "Falha ao registrar transação");
        setIsSubmitting(false);
        return;
      }

      setMensagemSucesso(data.mensagem);
      setModalNovoAberto(false);
      setNovaTransacao({
        type: "RECEITA",
        category: "VENDA",
        description: "",
        amount: 0,
        paymentMethod: "PIX",
        dueDate: "",
        status: "PAGO",
        supplier: "",
      });
      carregarFinanceiro();
    } catch {
      setMensagemErro("Erro ao registrar transação financeira");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDarBaixa = async (id: string) => {
    if (!confirm("Confirmar a liquidação/recebimento desta transação agora?")) return;

    try {
      const res = await fetch(`/api/financeiro/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAGO" }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensagemSucesso("Transação liquidada e marcada como PAGA!");
        carregarFinanceiro();
      } else {
        alert(data.erro || "Erro ao dar baixa");
      }
    } catch {
      alert("Erro ao conectar com o servidor");
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Deseja realmente remover esta transação financeira?")) return;

    try {
      const res = await fetch(`/api/financeiro/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMensagemSucesso("Transação removida com sucesso!");
        carregarFinanceiro();
      } else {
        alert(data.erro || "Erro ao remover");
      }
    } catch {
      alert("Erro ao excluir transação");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-indigo-600" />
            Gestão Financeira & Fluxo de Caixa
          </h1>
          <p className="text-sm text-slate-500">
            Faturamento, receitas de vendas, despesas fabris e margem líquida (Seção 13)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setModalNovoAberto(true)} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* 5 Cards de Indicadores Financeiros */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Receitas Realizadas */}
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Receitas Pagas</p>
              <h3 className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                {indicadores ? formatCurrency(indicadores.totalReceitasPagas) : "-"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Entradas confirmadas</p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Despesas Pagas */}
        <Card className="border-rose-200 bg-rose-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Despesas Pagas</p>
              <h3 className="text-lg sm:text-xl font-black text-rose-700 mt-1">
                {indicadores ? formatCurrency(indicadores.totalDespesasPagas) : "-"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Matéria-prima e custos</p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="border-indigo-200 bg-indigo-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Lucro Líquido</p>
              <h3
                className={`text-lg sm:text-xl font-black mt-1 ${
                  indicadores && indicadores.lucroLiquido < 0 ? "text-rose-600" : "text-indigo-700"
                }`}
              >
                {indicadores ? formatCurrency(indicadores.lucroLiquido) : "-"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Margem: {indicadores ? `${indicadores.margemLucro.toFixed(1)}%` : "-"}
              </p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Contas a Receber */}
        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">A Receber</p>
              <h3 className="text-lg sm:text-xl font-black text-amber-700 mt-1">
                {indicadores ? formatCurrency(indicadores.totalReceitasPendentes) : "-"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Saldos de pedidos</p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Contas a Pagar */}
        <Card className="col-span-2 lg:col-span-1 border-slate-200 bg-slate-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">A Pagar</p>
              <h3 className="text-lg sm:text-xl font-black text-slate-700 mt-1">
                {indicadores ? formatCurrency(indicadores.totalDespesasPendentes) : "-"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Boletos a vencer</p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Filtros de Período */}
            <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    periodo === p.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Filtros de Tipo e Status */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="RECEITA">Apenas Receitas (+)</option>
                <option value="DESPESA">Apenas Despesas (-)</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PAGO">Liquidados (Pagos)</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="CANCELADO">Cancelados</option>
              </select>

              {/* Busca Textual */}
              <form onSubmit={handleBuscar} className="flex gap-1.5 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar transação..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <Button type="submit" variant="outline" size="sm" className="h-8 text-xs shrink-0">
                  Filtrar
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista e Tabela de Transações */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Livro Caixa & Transações ({transacoes.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Histórico detalhado de entradas e saídas financeiras
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : transacoes.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<DollarSign className="h-6 w-6 text-slate-400" />}
                title="Nenhuma transação financeira encontrada"
                description="Não há lançamentos registrados para os filtros e período selecionados."
                action={
                  <Button size="sm" onClick={() => setModalNovoAberto(true)}>
                    Nova Transação
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Visualização Mobile: Cards */}
              <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {transacoes.map((t) => {
                  const isReceita = t.type === "RECEITA";
                  return (
                    <div key={t.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={isReceita ? "success" : "danger"} className="text-[10px]">
                          {isReceita ? "+ RECEITA" : "- DESPESA"}
                        </Badge>
                        <Badge variant={t.status === "PAGO" ? "success" : t.status === "PENDENTE" ? "warning" : "secondary"} className="text-[10px]">
                          {t.status}
                        </Badge>
                      </div>

                      <div className="font-semibold text-slate-900 text-sm">
                        {t.description}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{t.category}</span>
                        <span className="font-medium text-slate-700">{t.paymentMethod || "PIX"}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          {formatDate(t.paymentDate || t.dueDate || t.createdAt)}
                        </span>
                        <span className={`text-base font-black ${isReceita ? "text-emerald-700" : "text-rose-700"}`}>
                          {isReceita ? "+" : "-"} {formatCurrency(t.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        {t.status === "PENDENTE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDarBaixa(t.id)}
                            className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Baixar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluir(t.id)}
                          className="h-7 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visualização Desktop: Tabela Completa */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <th className="p-3.5">Tipo</th>
                      <th className="p-3.5">Descrição</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Vínculo</th>
                      <th className="p-3.5 text-right">Valor</th>
                      <th className="p-3.5 text-center">Forma</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Data</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transacoes.map((t) => {
                      const isReceita = t.type === "RECEITA";
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <Badge variant={isReceita ? "success" : "danger"} className="text-[10px]">
                              {isReceita ? "+ RECEITA" : "- DESPESA"}
                            </Badge>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900">
                            {t.description}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            <Badge variant="secondary" className="text-[10px]">
                              {t.category}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {t.order ? (
                              <Link
                                href={`/admin/pedidos/${t.order.id}`}
                                className="text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                #{t.order.orderNumber}
                              </Link>
                            ) : t.customer ? (
                              <span className="text-slate-700">{t.customer.name}</span>
                            ) : t.supplier ? (
                              <span className="text-slate-500">{t.supplier}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td
                            className={`p-3.5 text-right font-black text-sm ${
                              isReceita ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {isReceita ? "+" : "-"} {formatCurrency(t.amount)}
                          </td>
                          <td className="p-3.5 text-center text-slate-600 font-medium">
                            {t.paymentMethod || "PIX"}
                          </td>
                          <td className="p-3.5 text-center">
                            {t.status === "PAGO" ? (
                              <Badge variant="success" className="text-[10px]">
                                PAGO
                              </Badge>
                            ) : t.status === "PENDENTE" ? (
                              <Badge variant="warning" className="text-[10px]">
                                PENDENTE
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                {t.status}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3.5 text-center text-slate-500 text-[11px]">
                            {formatDate(t.paymentDate || t.dueDate || t.createdAt)}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {t.status === "PENDENTE" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDarBaixa(t.id)}
                                  className="h-7 px-2 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                  title="Liquidar e marcar como pago"
                                >
                                  <Check className="h-3.5 w-3.5 mr-0.5" />
                                  Baixar
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExcluir(t.id)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                title="Remover transação"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal: Nova Transação Financeira */}
      <Modal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        title="Lançar Transação Financeira"
        description="Registre uma nova entrada ou saída no fluxo de caixa da empresa."
        maxWidth="lg"
      >
        <form onSubmit={handleCriarTransacao} className="space-y-3.5 text-xs">
          {/* Seletor Tipo: Receita vs Despesa */}
          <div className="flex rounded-lg border p-1 bg-slate-50">
            <button
              type="button"
              onClick={() =>
                setNovaTransacao({
                  ...novaTransacao,
                  type: "RECEITA",
                  category: "VENDA",
                })
              }
              className={`flex-1 py-1.5 text-center font-bold rounded-md transition-colors ${
                novaTransacao.type === "RECEITA"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              + RECEITA (Entrada)
            </button>
            <button
              type="button"
              onClick={() =>
                setNovaTransacao({
                  ...novaTransacao,
                  type: "DESPESA",
                  category: "MATERIA_PRIMA",
                })
              }
              className={`flex-1 py-1.5 text-center font-bold rounded-md transition-colors ${
                novaTransacao.type === "DESPESA"
                  ? "bg-rose-600 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              - DESPESA (Saída)
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Descrição da Transação *
            </label>
            <input
              type="text"
              required
              value={novaTransacao.description}
              onChange={(e) =>
                setNovaTransacao({ ...novaTransacao, description: e.target.value })
              }
              placeholder={
                novaTransacao.type === "RECEITA"
                  ? "Ex: Entrada 50% Pedido uniforme escolar"
                  : "Ex: Pagamento rolo tecido Dry-Fit"
              }
              className="w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
              <select
                value={novaTransacao.category}
                onChange={(e) =>
                  setNovaTransacao({ ...novaTransacao, category: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none bg-white"
              >
                {novaTransacao.type === "RECEITA" ? (
                  <>
                    <option value="VENDA">Venda de Pedido</option>
                    <option value="OUTRO">Outra Entrada</option>
                  </>
                ) : (
                  <>
                    <option value="MATERIA_PRIMA">Matéria-Prima / Tecidos</option>
                    <option value="COMISSAO">Comissão de Vendedor</option>
                    <option value="MAQUINARIO">Maquinário / Manutenção</option>
                    <option value="ENERGIA">Energia / Luz / Água</option>
                    <option value="ALUGUEL">Aluguel do Galpão</option>
                    <option value="SALARIO">Folha de Pagamento</option>
                    <option value="OUTRO">Outras Despesas</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={novaTransacao.amount}
                onChange={(e) =>
                  setNovaTransacao({
                    ...novaTransacao,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={novaTransacao.paymentMethod}
                onChange={(e) =>
                  setNovaTransacao({ ...novaTransacao, paymentMethod: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CARTAO">Cartão de Crédito/Débito</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
                <option value="DINHEIRO">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Inicial</label>
              <select
                value={novaTransacao.status}
                onChange={(e) =>
                  setNovaTransacao({
                    ...novaTransacao,
                    status: e.target.value as "PAGO" | "PENDENTE",
                  })
                }
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="PAGO">Liquidado (Pago agora)</option>
                <option value="PENDENTE">Pendente (A vencer/receber)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fornecedor / Favorecido (Opcional)
            </label>
            <input
              type="text"
              value={novaTransacao.supplier}
              onChange={(e) =>
                setNovaTransacao({ ...novaTransacao, supplier: e.target.value })
              }
              placeholder="Ex: Têxtil Santa Catarina, Imobiliária, etc."
              className="w-full rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? "Lançando..." : "Confirmar Lançamento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
