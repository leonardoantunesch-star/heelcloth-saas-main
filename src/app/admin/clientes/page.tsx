import React from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  MessageCircle,
  Mail,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ClientesPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const whereClause = query
    ? {
        OR: [
          { name: { contains: query } },
          { document: { contains: query } },
          { whatsapp: { contains: query } },
          { email: { contains: query } },
        ],
      }
    : {};

  const clientes = await prisma.customer.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      quotes: {
        select: { id: true },
      },
    },
  });

  const totalClientes = clientes.length;
  const totalFaturamento = clientes.reduce(
    (acc, c) => acc + c.orders.reduce((oAcc, o) => oAcc + o.totalAmount, 0),
    0
  );
  const ticketMedio =
    totalClientes > 0 && totalFaturamento > 0
      ? totalFaturamento / totalClientes
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre, pesquise e acompanhe o histórico completo de pedidos e orçamentos de cada cliente.
          </p>
        </div>

        <Link href="/admin/clientes/novo" className="w-full sm:w-auto">
          <Button className="gap-2 w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            Cadastrar Cliente
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Total de Clientes</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalClientes}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Volume Total Faturado</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(totalFaturamento)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Ticket Médio por Cliente</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(ticketMedio)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar por nome do cliente, CPF/CNPJ, WhatsApp ou e-mail..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" size="md" className="flex-1 sm:flex-initial">
                Buscar
              </Button>
              {query && (
                <Link href="/admin/clientes" className="flex-1 sm:flex-initial">
                  <Button variant="outline" size="md" className="w-full">
                    Limpar
                  </Button>
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Clientes Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lista de Clientes Cadastrados</CardTitle>
          <CardDescription>
            {clientes.length} {clientes.length === 1 ? "cliente encontrado" : "clientes encontrados"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:pt-0">
          {clientes.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Users className="h-6 w-6 text-slate-400" />}
                title="Nenhum cliente localizado"
                description={query ? "Tente buscar com outros termos." : "Comece adicionando seu primeiro cliente para gerenciar pedidos e orçamentos."}
                action={!query ? (
                  <Link href="/admin/clientes/novo">
                    <Button size="sm">Cadastrar Cliente</Button>
                  </Link>
                ) : undefined}
              />
            </div>
          ) : (
            <>
              {/* Visualização Mobile: Cards */}
              <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {clientes.map((c) => {
                  const totalGasto = c.orders.reduce((acc, o) => acc + o.totalAmount, 0);
                  const ultimoPedido = c.orders[0];
                  const cleanPhone = c.whatsapp.replace(/\D/g, "");

                  return (
                    <div key={c.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/admin/clientes/${c.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm"
                        >
                          {c.name}
                        </Link>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(totalGasto)}
                        </span>
                      </div>

                      {c.document && (
                        <div className="text-[11px] font-mono text-slate-400">
                          {c.document}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors font-medium"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {c.whatsapp}
                        </a>
                        {c.email && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          {c.orders.length} pedidos • {c.quotes.length} orçamentos
                        </span>
                        {ultimoPedido ? (
                          <span className="text-[11px] text-slate-400">
                            Último: {formatDate(ultimoPedido.createdAt)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem pedidos</span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Link href={`/admin/pedidos/novo?clienteId=${c.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                            + Pedido
                          </Button>
                        </Link>
                        <Link href={`/admin/clientes/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visualização Desktop: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Contatos</th>
                      <th className="py-3 px-4">Pedidos & Orçamentos</th>
                      <th className="py-3 px-4">Total Gasto</th>
                      <th className="py-3 px-4">Último Pedido</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clientes.map((c) => {
                      const totalGasto = c.orders.reduce((acc, o) => acc + o.totalAmount, 0);
                      const ultimoPedido = c.orders[0];
                      const cleanPhone = c.whatsapp.replace(/\D/g, "");

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/clientes/${c.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                            >
                              {c.name}
                            </Link>
                            {c.document && (
                              <span className="text-xs text-slate-400 block font-mono mt-0.5">
                                {c.document}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors font-medium"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {c.whatsapp}
                              </a>
                            </div>
                            {c.email && (
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {c.email}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-xs font-medium text-slate-700">
                              {c.orders.length} pedidos
                            </div>
                            <div className="text-xs text-slate-400">
                              {c.quotes.length} orçamentos
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {formatCurrency(totalGasto)}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {ultimoPedido ? (
                              <div>
                                <span className="font-medium text-slate-700 block">
                                  {ultimoPedido.orderNumber}
                                </span>
                                <span>{formatDate(ultimoPedido.createdAt)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Nenhum</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link href={`/admin/pedidos/novo?clienteId=${c.id}`}>
                                <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                                  + Pedido
                                </Button>
                              </Link>
                              <Link href={`/admin/clientes/${c.id}`}>
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
