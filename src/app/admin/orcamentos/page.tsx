import React from "react";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  XCircle,
  Layers,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrcamentosPageProps {
  searchParams: Promise<{ q?: string; status?: string; clienteId?: string }>;
}

function getQuoteStatusBadge(status: string) {
  switch (status) {
    case "PENDENTE":
      return <Badge variant="secondary">Pendente</Badge>;
    case "ENVIADO":
      return <Badge variant="info">Enviado</Badge>;
    case "APROVADO":
      return <Badge variant="success">Aprovado</Badge>;
    case "CONVERTIDO":
      return <Badge variant="default">Convertido em Pedido</Badge>;
    case "RECUSADO":
      return <Badge variant="danger">Recusado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function OrcamentosPage({ searchParams }: OrcamentosPageProps) {
  const { q, status, clienteId } = await searchParams;
  const query = q?.trim() || "";
  const filterStatus = status?.trim() || "";

  const where: any = {};
  if (clienteId) where.customerId = clienteId;
  if (filterStatus) where.status = filterStatus;
  if (query) {
    where.OR = [
      { quoteNumber: { contains: query } },
      { customer: { name: { contains: query } } },
      { customer: { whatsapp: { contains: query } } },
    ];
  }

  const orcamentos = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, whatsapp: true } },
      items: true,
      orders: { select: { id: true, orderNumber: true, status: true } },
    },
  });

  // Métricas do topo
  const totalOrcamentos = orcamentos.length;
  const pendentes = orcamentos.filter((o) => o.status === "PENDENTE" || o.status === "ENVIADO").length;
  const aprovadosOuConvertidos = orcamentos.filter((o) => o.status === "APROVADO" || o.status === "CONVERTIDO").length;
  const valorTotalOrcado = orcamentos.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Módulo de Orçamentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Crie propostas comerciais, acompanhe aprovações e converta orçamentos em pedidos em 1 clique.
          </p>
        </div>

        <Link href="/admin/orcamentos/novo" className="w-full sm:w-auto">
          <Button className="gap-2 w-full justify-center">
            <PlusCircle className="h-4 w-4" />
            <span>Novo Orçamento</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Total Orçamentos</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{totalOrcamentos}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Aguardando</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">{pendentes}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Aprovados</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{aprovadosOuConvertidos}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Volume Total</span>
              <div className="text-base sm:text-xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(valorTotalOrcado)}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <form method="GET" className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar por número, cliente ou WhatsApp..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <select
              name="status"
              defaultValue={filterStatus}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ENVIADO">Enviado</option>
              <option value="APROVADO">Aprovado</option>
              <option value="CONVERTIDO">Convertido</option>
              <option value="RECUSADO">Recusado</option>
            </select>

            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" className="flex-1 sm:flex-initial">
                Filtrar
              </Button>
              {(query || filterStatus) && (
                <Link href="/admin/orcamentos" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full">Limpar</Button>
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quotes Container */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Propostas Comerciais</CardTitle>
          <CardDescription className="text-xs">
            {orcamentos.length} {orcamentos.length === 1 ? "orçamento encontrado" : "orçamentos encontrados"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {orcamentos.length === 0 ? (
            <EmptyState
              title="Nenhum orçamento encontrado"
              description={query || filterStatus ? "Tente ajustar os filtros." : "Crie a primeira proposta comercial para um cliente."}
              action={
                <Link href="/admin/orcamentos/novo">
                  <Button size="sm">Novo Orçamento</Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* 1. Mobile Cards (< 768px) */}
              <div className="md:hidden divide-y divide-slate-100">
                {orcamentos.map((o) => {
                  const totalPecas = o.items.reduce((acc, i) => acc + i.quantity, 0);
                  const pedido = o.orders[0];

                  return (
                    <div key={o.id} className="py-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/admin/orcamentos/${o.id}`}
                          className="font-bold text-slate-900 font-mono text-sm hover:text-blue-600"
                        >
                          {o.quoteNumber}
                        </Link>
                        {getQuoteStatusBadge(o.status)}
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{o.customer.name}</span>
                        <span className="text-slate-400 ml-1.5">• {o.customer.whatsapp}</span>
                      </div>

                      {pedido && (
                        <div>
                          <Link
                            href={`/admin/pedidos/${pedido.id}`}
                            className="text-[11px] text-blue-600 font-medium inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md"
                          >
                            <Layers className="h-3 w-3" />
                            Convertido em Pedido: {pedido.orderNumber}
                          </Link>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="font-semibold text-slate-700">{totalPecas} peças</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            {formatDate(o.createdAt)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm block">
                            {formatCurrency(o.totalAmount)}
                          </span>
                          {o.discount > 0 && (
                            <span className="text-[11px] text-emerald-600 block">
                              Desc: -{formatCurrency(o.discount)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <Link href={`/admin/orcamentos/${o.id}`} className="block">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8">
                            Ver Proposta Comercial →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Desktop/Tablet Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Orçamento</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Itens</th>
                      <th className="py-3 px-4">Valor Final</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Data / Validade</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {orcamentos.map((o) => {
                      const totalPecas = o.items.reduce((acc, i) => acc + i.quantity, 0);
                      const pedido = o.orders[0];

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/orcamentos/${o.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 font-mono transition-colors block"
                            >
                              {o.quoteNumber}
                            </Link>
                            {pedido && (
                              <Link
                                href={`/admin/pedidos/${pedido.id}`}
                                className="text-[11px] text-blue-600 font-medium inline-flex items-center gap-1 mt-0.5"
                              >
                                <Layers className="h-3 w-3" />
                                Pedido: {pedido.orderNumber}
                              </Link>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/clientes/${o.customer.id}`}
                              className="font-medium text-slate-800 hover:text-blue-600 transition-colors block"
                            >
                              {o.customer.name}
                            </Link>
                            <span className="text-xs text-slate-400 block">{o.customer.whatsapp}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {totalPecas} {totalPecas === 1 ? "peça" : "peças"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {o.items.length} {o.items.length === 1 ? "tipo de produto" : "tipos de produto"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatCurrency(o.totalAmount)}
                            {o.discount > 0 && (
                              <span className="text-[11px] text-emerald-600 font-normal block">
                                Desc: -{formatCurrency(o.discount)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">{getQuoteStatusBadge(o.status)}</td>

                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            <div>Criado: {formatDate(o.createdAt)}</div>
                            {o.validUntil && (
                              <div className="text-[11px] text-slate-400">
                                Validade: {formatDate(o.validUntil)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link href={`/admin/orcamentos/${o.id}`}>
                                <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                                  Ver Proposta
                                </Button>
                              </Link>
                              <Link href={`/admin/orcamentos/${o.id}`}>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ChevronRight className="h-4 w-4" />
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
