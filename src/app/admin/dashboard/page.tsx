import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  PlusCircle,
  FileText,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

// Status badge mapper
function getStatusBadge(status: string) {
  switch (status) {
    case "EM_PRODUCAO":
      return <Badge variant="warning">Em Produção</Badge>;
    case "CONTROLE_QUALIDADE":
      return <Badge variant="info">Qualidade</Badge>;
    case "PRONTO":
    case "CONCLUIDO":
    case "ENTREGUE":
      return <Badge variant="success">Concluído</Badge>;
    case "EM_ATRASO":
      return <Badge variant="danger">Em Atraso</Badge>;
    case "AGUARDANDO_APROVACAO":
      return <Badge variant="secondary">Aguardando Aprovação</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function DashboardPage() {
  const now = new Date();

  // Buscar dados em paralelo diretamente do banco de dados
  const [
    totalPedidos,
    pedidosEmProducao,
    pedidosAguardandoAprovacao,
    pedidosConcluidos,
    pedidosAtrasados,
    somaPedidos,
    receitasPagas,
    receitasPendentes,
    despesasPagar,
    despesasPagas,
    pedidosRecentes,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "EM_PRODUCAO" } }),
    prisma.order.count({ where: { status: "AGUARDANDO_APROVACAO" } }),
    prisma.order.count({ where: { status: { in: ["CONCLUIDO", "ENTREGUE", "PRONTO"] } } }),
    prisma.order.count({
      where: {
        OR: [
          { status: "EM_ATRASO" },
          {
            deliveryDeadline: { lt: now },
            status: { notIn: ["CONCLUIDO", "ENTREGUE", "CANCELADO"] },
          },
        ],
      },
    }),
    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true,
      },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "RECEITA", status: "PAGO" },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "RECEITA", status: "PENDENTE" },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "DESPESA", status: "PENDENTE" },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "DESPESA", status: "PAGO" },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { name: true, phone: true },
        },
        items: true,
        players: true,
      },
    }),
  ]);

  const faturamento = somaPedidos._sum.totalAmount || receitasPagas._sum.amount || 0;
  const aReceber = somaPedidos._sum.pendingAmount ?? receitasPendentes._sum.amount ?? 0;
  const aPagar = despesasPagar._sum.amount ?? 0;
  const totalDespesas = despesasPagas._sum.amount ?? 0;
  const lucro = faturamento - totalDespesas;

  // Cards de operação (Seção 4)
  const kpiStats = [
    {
      title: "Total Pedidos",
      value: String(totalPedidos),
      sub: "Registrados no sistema",
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Em Produção",
      value: String(pedidosEmProducao),
      sub: "Na esteira da confecção",
      icon: Layers,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "Aguardando",
      value: String(pedidosAguardandoAprovacao),
      sub: "Orçamentos pendentes",
      icon: Clock,
      color: "text-slate-600 bg-slate-50 border-slate-200",
    },
    {
      title: "Concluídos",
      value: String(pedidosConcluidos),
      sub: "Finalizados com sucesso",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Em Atraso",
      value: String(pedidosAtrasados),
      sub: pedidosAtrasados > 0 ? "Atenção necessária" : "Sem atrasos no momento",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      highlight: pedidosAtrasados > 0,
    },
  ];

  // Cards financeiros (Seção 4)
  const financialStats = [
    {
      title: "Faturamento",
      value: formatCurrency(faturamento),
      sub: "Total vendido",
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "A Receber",
      value: formatCurrency(aReceber),
      sub: "Saldo pendente",
      icon: ArrowDownRight,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "A Pagar",
      value: formatCurrency(aPagar),
      sub: "Despesas pendentes",
      icon: ArrowUpRight,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Lucro Operacional",
      value: formatCurrency(lucro),
      sub: "Receita menos despesas",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Visão Geral da Confecção
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Acompanhamento centralizado de pedidos, esteira produtiva e indicadores essenciais.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link href="/admin/orcamentos" className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="gap-2 w-full justify-center">
              <FileText className="h-4 w-4" />
              <span>Novo Orçamento</span>
            </Button>
          </Link>
          <Link href="/admin/pedidos" className="flex-1 sm:flex-initial">
            <Button size="sm" className="gap-2 w-full justify-center">
              <PlusCircle className="h-4 w-4" />
              <span>Novo Pedido</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Production & Operational KPIs */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Operação & Produção
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {kpiStats.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.title}
                className={cn(
                  kpi.highlight ? "border-rose-300 ring-1 ring-rose-300 bg-rose-50/20" : "",
                  idx === 4 && "col-span-2 sm:col-span-1"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 truncate mr-1">{kpi.title}</span>
                    <div className={`p-1.5 sm:p-2 rounded-lg border shrink-0 ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2.5 sm:mt-3">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {kpi.value}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{kpi.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Financial Overview (Section 4 summary cards) */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Indicadores Financeiros Sintéticos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {financialStats.map((fin) => {
            const Icon = fin.icon;
            return (
              <Card key={fin.title}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 truncate mr-1">{fin.title}</span>
                    <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${fin.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2.5 sm:mt-3">
                    <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                      {fin.value}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{fin.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Pedidos Recentes</CardTitle>
              <CardDescription className="text-xs">Últimos pedidos movimentados na confecção</CardDescription>
            </div>
            <Link href="/admin/pedidos">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {pedidosRecentes.length === 0 ? (
              <EmptyState
                title="Nenhum pedido recente"
                description="Novos pedidos cadastrados aparecerão listados aqui."
                action={
                  <Link href="/admin/pedidos/novo">
                    <Button size="sm">Criar Primeiro Pedido</Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {pedidosRecentes.map((pedido) => {
                  const qtdCamisas =
                    pedido.players.length > 0
                      ? `${pedido.players.length} camisas`
                      : `${pedido.items.reduce((acc, i) => acc + i.quantity, 0)} itens`;

                  return (
                    <div
                      key={pedido.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 hover:bg-slate-50/60 p-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 font-mono">
                            {pedido.orderNumber}
                          </span>
                          {getStatusBadge(pedido.status)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          <span className="font-medium text-slate-700">{pedido.customer.name}</span> • {qtdCamisas} • Prazo:{" "}
                          {pedido.deliveryDeadline ? formatDate(pedido.deliveryDeadline) : "A definir"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(pedido.totalAmount)}
                        </div>
                        <Link
                          href={`/admin/pedidos/${pedido.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Acessar →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Operations Guide & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
            <CardDescription className="text-xs">Atalhos para operações frequentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/clientes" className="block">
              <div className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Gerenciar Clientes</div>
                  <div className="text-xs text-slate-500">Cadastrar e consultar histórico</div>
                </div>
              </div>
            </Link>

            <Link href="/admin/producao" className="block">
              <div className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Fila de Produção</div>
                  <div className="text-xs text-slate-500">Avançar etapas da confecção</div>
                </div>
              </div>
            </Link>

            <Link href="/admin/estoque" className="block">
              <div className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Conferir Estoque</div>
                  <div className="text-xs text-slate-500">Tecidos, materiais e insumos</div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
