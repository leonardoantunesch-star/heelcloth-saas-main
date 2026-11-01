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
import { getSession } from "@/lib/auth";
import { lerCampanhas } from "@/lib/campanhas";
import { verValores } from "@/lib/permissoes";
import { hojeBrasil, progressoPorStatus, seriePorSemana } from "@/lib/painel-dados";
import { GraficoBarras, Rosca } from "@/components/painel/graficos";
import { CampanhasAtivas } from "@/components/painel/campanhas-ativas";
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

// Esta página lê o banco de dados, então é gerada a cada acesso (nunca durante o build).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const sessao = await getSession();
  const podeVerValores = verValores(sessao?.role);
  const podeEditarCampanhas = sessao?.role === "ADMIN" || sessao?.role === "VENDEDOR";
  const hoje = hojeBrasil();
  const desde = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7 * 8 - 3);

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
    pedidosPeriodo,
    contagemStatus,
    producaoAberta,
    usuariosAtivos,
    campanhas,
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
    prisma.order.findMany({
      where: { createdAt: { gte: desde }, status: { not: "CANCELADO" } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.productionOrder.findMany({
      where: { stageStatus: { not: "CONCLUIDO" }, finishedAt: null },
      select: { responsible: true, stageStatus: true, deadline: true },
    }),
    prisma.user.count({ where: { active: true } }),
    lerCampanhas(),
  ]);

  // Gráficos novos (semana a semana, andamento, equipe)
  const semanas = seriePorSemana(pedidosPeriodo as { createdAt: Date; totalAmount: number }[], hoje, 8);
  const progresso = progressoPorStatus(
    (contagemStatus as { status: string; _count: { _all: number } }[]).map((g) => ({ status: g.status, quantidade: g._count._all }))
  );
  const tarefas = producaoAberta as { responsible: string | null; stageStatus: string; deadline: Date | null }[];
  const porResponsavel = new Map<string, { abertas: number; atrasadas: number }>();
  for (const t of tarefas) {
    const nome = t.responsible?.trim() || "Sem responsável";
    const a = porResponsavel.get(nome) ?? { abertas: 0, atrasadas: 0 };
    a.abertas += 1;
    if (t.stageStatus === "ATRASADO" || (t.deadline && t.deadline < now)) a.atrasadas += 1;
    porResponsavel.set(nome, a);
  }
  const equipeTarefas = [...porResponsavel.entries()]
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((x, y) => y.abertas - x.abertas)
    .slice(0, 5);
  const maxTarefas = Math.max(...equipeTarefas.map((e) => e.abertas), 1);
  const compacto = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : String(Math.round(n)));

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

      {/* Financial Overview (só quem vê valores: administrador e financeiro) */}
      {podeVerValores && (
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
      )}

      {/* Desempenho e andamento (gráficos) */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Desempenho</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">{podeVerValores ? "Vendas por semana" : "Pedidos por semana"}</CardTitle>
                <CardDescription className="text-xs">Últimas 8 semanas{podeVerValores ? ", em R$" : ""} (a semana começa na segunda)</CardDescription>
              </div>
              {podeVerValores && (
                <Link href="/admin/analytics" className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Ver Analytics →
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <GraficoBarras
                descricao={podeVerValores ? "Vendas por semana" : "Pedidos por semana"}
                dados={semanas.map((s) => ({
                  rotulo: s.rotulo,
                  valor: podeVerValores ? s.faturamento : s.pedidos,
                  dica: `Semana de ${s.rotulo}: ${s.pedidos} pedidos${podeVerValores ? `, ${formatCurrency(s.faturamento)}` : ""}`,
                }))}
                formatar={podeVerValores ? compacto : undefined}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Andamento dos pedidos</CardTitle>
              <CardDescription className="text-xs">Cancelados não entram na conta</CardDescription>
            </CardHeader>
            <CardContent>
              <Rosca
                descricao="Andamento dos pedidos"
                centro="pedidos"
                fatias={[
                  { rotulo: "Concluídos", valor: progresso.concluido, stroke: "stroke-emerald-500", ponto: "bg-emerald-500" },
                  { rotulo: "Em produção", valor: progresso.producao, stroke: "stroke-amber-500", ponto: "bg-amber-500" },
                  { rotulo: "Aguardando", valor: progresso.pendente, stroke: "stroke-slate-400", ponto: "bg-slate-400" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Equipe e tarefas + Campanhas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Equipe e tarefas</CardTitle>
              <CardDescription className="text-xs">
                {usuariosAtivos} {usuariosAtivos === 1 ? "pessoa ativa" : "pessoas ativas"} • {tarefas.length} {tarefas.length === 1 ? "pedido aberto" : "pedidos abertos"} na produção
              </CardDescription>
            </div>
            {sessao?.role === "ADMIN" && (
              <Link href="/admin/equipe" className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800">
                Gerenciar equipe →
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {equipeTarefas.length === 0 ? (
              <EmptyState title="Nenhuma tarefa aberta" description="Quando houver pedidos na produção, a carga de cada responsável aparece aqui." />
            ) : (
              <ul className="space-y-4">
                {equipeTarefas.map((e) => (
                  <li key={e.nome}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-slate-900">{e.nome}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {e.abertas} {e.abertas === 1 ? "tarefa" : "tarefas"}
                        {e.atrasadas > 0 && <span className="ml-2 font-semibold text-rose-600">{e.atrasadas} em atraso</span>}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${e.nome}: ${e.abertas} tarefas abertas`}>
                      <div className={cn("h-full rounded-full", e.atrasadas > 0 ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${(e.abertas / maxTarefas) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <CampanhasAtivas
          iniciais={campanhas}
          podeEditar={podeEditarCampanhas}
          hoje={`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`}
        />
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
