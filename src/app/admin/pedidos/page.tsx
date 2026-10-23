import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  PlusCircle,
  Search,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  DollarSign,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PedidosPageProps {
  searchParams: Promise<{ q?: string; status?: string; clienteId?: string }>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ORCAMENTO":
      return <Badge variant="secondary">Orçamento</Badge>;
    case "AGUARDANDO_APROVACAO":
      return <Badge variant="secondary">Aguardando Aprovação</Badge>;
    case "APROVADO":
      return <Badge variant="info">Aprovado</Badge>;
    case "PAGAMENTO_PENDENTE":
      return <Badge variant="warning">Pagamento Pendente</Badge>;
    case "PAGAMENTO_CONFIRMADO":
      return <Badge variant="success">Pago</Badge>;
    case "EM_PRODUCAO":
      return <Badge variant="warning">Em Produção</Badge>;
    case "CONTROLE_QUALIDADE":
      return <Badge variant="info">Controle de Qualidade</Badge>;
    case "PRONTO":
      return <Badge variant="success">Pronto</Badge>;
    case "ENTREGUE":
      return <Badge variant="default">Entregue</Badge>;
    case "CONCLUIDO":
      return <Badge variant="default">Concluído</Badge>;
    case "CANCELADO":
      return <Badge variant="danger">Cancelado</Badge>;
    case "EM_ATRASO":
      return <Badge variant="danger">Em Atraso</Badge>;
    case "AGUARDANDO_ALTERACAO":
      return <Badge variant="warning">Aguardando Alteração</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const { q, status, clienteId } = await searchParams;
  const query = q?.trim() || "";
  const filterStatus = status?.trim() || "";

  const where: any = {};
  if (clienteId) where.customerId = clienteId;
  if (filterStatus) where.status = filterStatus;
  if (query) {
    where.OR = [
      { orderNumber: { contains: query } },
      { customer: { name: { contains: query } } },
      { customer: { whatsapp: { contains: query } } },
    ];
  }

  const pedidos = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, whatsapp: true } },
      items: true,
      players: true,
      productionOrder: { select: { currentStage: true, stageStatus: true } },
    },
  });

  const now = new Date();
  const totalPedidos = pedidos.length;
  const emProducao = pedidos.filter((p) => p.status === "EM_PRODUCAO").length;
  const concluidos = pedidos.filter((p) => ["PRONTO", "ENTREGUE", "CONCLUIDO"].includes(p.status)).length;
  const atrasados = pedidos.filter(
    (p) =>
      p.status === "EM_ATRASO" ||
      (p.deliveryDeadline && p.deliveryDeadline < now && !["PRONTO", "ENTREGUE", "CONCLUIDO", "CANCELADO"].includes(p.status))
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Controle de fluxo de pedidos, prazos, esteira de produção e personalização individual.
          </p>
        </div>

        <Link href="/admin/pedidos/novo" className="w-full sm:w-auto">
          <Button className="gap-2 w-full justify-center">
            <PlusCircle className="h-4 w-4" />
            <span>Novo Pedido</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Total Pedidos</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalPedidos}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Em Produção</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">{emProducao}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Concluídos</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{concluidos}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={atrasados > 0 ? "border-rose-300 ring-1 ring-rose-300 bg-rose-50/20" : ""}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Em Atraso</span>
              <div className={`text-xl sm:text-2xl font-bold mt-1 ${atrasados > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {atrasados}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <form method="GET" className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar por nº (HC-...), cliente ou WhatsApp..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <select
              name="status"
              defaultValue={filterStatus}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
              <option value="APROVADO">Aprovado</option>
              <option value="PAGAMENTO_CONFIRMADO">Pagamento Confirmado</option>
              <option value="EM_PRODUCAO">Em Produção</option>
              <option value="CONTROLE_QUALIDADE">Controle de Qualidade</option>
              <option value="PRONTO">Pronto</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="EM_ATRASO">Em Atraso</option>
              <option value="CANCELADO">Cancelado</option>
            </select>

            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" className="flex-1 sm:flex-initial">
                Filtrar
              </Button>
              {(query || filterStatus) && (
                <Link href="/admin/pedidos" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full">Limpar</Button>
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Orders List Container */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Pedidos</CardTitle>
          <CardDescription className="text-xs">
            {pedidos.length} {pedidos.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {pedidos.length === 0 ? (
            <EmptyState
              title="Nenhum pedido encontrado"
              description={query || filterStatus ? "Tente ajustar os filtros de busca." : "Inicie um novo pedido de uniformes."}
              action={
                <Link href="/admin/pedidos/novo">
                  <Button size="sm">Novo Pedido</Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* 1. Mobile Card View (< 768px) */}
              <div className="md:hidden divide-y divide-slate-100">
                {pedidos.map((p) => {
                  const totalCamisas = p.players.length > 0 ? p.players.length : p.items.reduce((acc, i) => acc + i.quantity, 0);
                  const isAtrasado = p.deliveryDeadline && p.deliveryDeadline < now && !["PRONTO", "ENTREGUE", "CONCLUIDO", "CANCELADO"].includes(p.status);

                  return (
                    <div key={p.id} className="py-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/admin/pedidos/${p.id}`}
                          className="font-bold text-slate-900 font-mono text-sm hover:text-blue-600"
                        >
                          {p.orderNumber}
                        </Link>
                        {getStatusBadge(p.status)}
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{p.customer.name}</span>
                        <span className="text-slate-400 ml-1.5">• {p.customer.whatsapp}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="font-semibold text-slate-700">{totalCamisas} peças</span>
                          {p.productionOrder?.currentStage && (
                            <span className="block text-[11px] text-blue-600 font-medium mt-0.5">
                              Fase: {p.productionOrder.currentStage}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm block">
                            {formatCurrency(p.totalAmount)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Prazo: {p.deliveryDeadline ? formatDate(p.deliveryDeadline) : "A definir"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link href={`/admin/pedidos/${p.id}?tab=pagamento`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 border-emerald-300 text-emerald-700">
                            <DollarSign className="h-3 w-3 mr-1 text-emerald-600" />
                            Pagar
                          </Button>
                        </Link>
                        <Link href={`/admin/pedidos/${p.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8">
                            Gerenciar
                          </Button>
                        </Link>
                        <Link href={`/admin/pedidos/${p.id}?tab=excluir`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Desktop/Tablet Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pedido</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Uniformes</th>
                      <th className="py-3 px-4">Status & Produção</th>
                      <th className="py-3 px-4">Prazo</th>
                      <th className="py-3 px-4">Financeiro</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pedidos.map((p) => {
                      const totalCamisas = p.players.length > 0 ? p.players.length : p.items.reduce((acc, i) => acc + i.quantity, 0);
                      const isAtrasado = p.deliveryDeadline && p.deliveryDeadline < now && !["PRONTO", "ENTREGUE", "CONCLUIDO", "CANCELADO"].includes(p.status);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/pedidos/${p.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 font-mono transition-colors block"
                            >
                              {p.orderNumber}
                            </Link>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {formatDate(p.createdAt)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/clientes/${p.customer.id}`}
                              className="font-medium text-slate-800 hover:text-blue-600 transition-colors block"
                            >
                              {p.customer.name}
                            </Link>
                            <span className="text-xs text-slate-400 block">{p.customer.whatsapp}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {totalCamisas} peças
                            </span>
                            {p.players.length > 0 ? (
                              <span className="text-[11px] text-blue-600 font-medium">
                                {p.players.length} jogadores cadastrados
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600">
                                Sem lista individual
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <div>{getStatusBadge(p.status)}</div>
                            {p.productionOrder?.currentStage && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Layers className="h-3 w-3 text-slate-400" />
                                Etapa: <b className="text-slate-700">{p.productionOrder.currentStage}</b>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-xs">
                            {p.deliveryDeadline ? (
                              <span className={isAtrasado ? "text-rose-600 font-bold" : "text-slate-700"}>
                                {formatDate(p.deliveryDeadline)}
                                {isAtrasado && <span className="block text-[10px] text-rose-500">Atrasado</span>}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">A definir</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {formatCurrency(p.totalAmount)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {p.pendingAmount > 0 ? (
                                <span className="text-amber-600">Resta: {formatCurrency(p.pendingAmount)}</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">100% Pago</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link href={`/admin/pedidos/${p.id}?tab=pagamento`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  title="Confirmar pagamento / parcelas"
                                >
                                  <DollarSign className="h-3 w-3 mr-0.5 text-emerald-600" />
                                  Pagar
                                </Button>
                              </Link>

                              <Link href={`/admin/pedidos/${p.id}`}>
                                <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                                  Gerenciar
                                </Button>
                              </Link>

                              <Link href={`/admin/pedidos/${p.id}?tab=excluir`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  title="Excluir pedido"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
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
    </div>
  );
}
