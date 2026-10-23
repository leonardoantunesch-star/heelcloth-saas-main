import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingCart,
  PlusCircle,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ClienteDetalhesProps {
  params: Promise<{ id: string }>;
}

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

export default async function ClienteDetalhesPage({ params }: ClienteDetalhesProps) {
  const { id } = await params;

  const cliente = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          players: true,
        },
      },
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      financialTransactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cliente) {
    notFound();
  }

  const valorTotalGasto = cliente.orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const valorTotalPago = cliente.orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const saldoPendente = cliente.orders.reduce((acc, o) => acc + o.pendingAmount, 0);
  const cleanPhone = cliente.whatsapp.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      {/* Top Back Nav */}
      <div className="flex items-center gap-3">
        <Link href="/admin/clientes">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{cliente.name}</h1>
            <Badge variant="info">Cliente Ativo</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            {cliente.document && <span>Doc: <b className="text-slate-700 font-mono">{cliente.document}</b></span>}
            <span>Cadastrado em {formatDate(cliente.createdAt)}</span>
          </div>
        </div>

        {/* Action Button: Section 9 Requirement */}
        <div className="flex items-center gap-3">
          <Link href={`/admin/orcamentos?clienteId=${cliente.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
          <Link href={`/admin/pedidos?clienteId=${cliente.id}`}>
            <Button size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Criar Pedido para este Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial & Order Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-slate-500">Total Gasto em Pedidos</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(valorTotalGasto)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{cliente.orders.length} pedidos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-slate-500">Total Pago</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(valorTotalPago)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Pagamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-slate-500">Saldo Pendente</span>
            <div className={`text-xl font-bold mt-1 ${saldoPendente > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {formatCurrency(saldoPendente)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">A receber na entrega/prazo</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-slate-500">Orçamentos Solicitados</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{cliente.quotes.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Propostas comerciais geradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Contact and Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-medium">WhatsApp</span>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 mt-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  {cliente.whatsapp}
                </a>
              </div>

              {cliente.phone && (
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Telefone Fixo</span>
                  <div className="flex items-center gap-1.5 text-slate-700 mt-0.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {cliente.phone}
                  </div>
                </div>
              )}

              {cliente.email && (
                <div>
                  <span className="text-xs text-slate-400 block font-medium">E-mail</span>
                  <div className="flex items-center gap-1.5 text-slate-700 mt-0.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {cliente.email}
                  </div>
                </div>
              )}

              {cliente.address && (
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Endereço de Entrega</span>
                  <div className="flex items-start gap-1.5 text-slate-700 mt-0.5">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{cliente.address}</span>
                  </div>
                </div>
              )}

              {cliente.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Observações</span>
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {cliente.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order and Quote History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Histórico de Pedidos</CardTitle>
                <CardDescription>
                  {cliente.orders.length} pedidos vinculados a este cliente
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {cliente.orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  Nenhum pedido realizado por este cliente até o momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cliente.orders.map((pedido) => {
                    const totalCamisas =
                      pedido.players.length > 0
                        ? `${pedido.players.length} camisas personalizadas`
                        : `${pedido.items.reduce((acc, i) => acc + i.quantity, 0)} itens`;

                    return (
                      <div key={pedido.id} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {pedido.orderNumber}
                            </span>
                            {getStatusBadge(pedido.status)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {totalCamisas} • Data: {formatDate(pedido.createdAt)}
                            {pedido.deliveryDeadline && (
                              <span> • Prazo: {formatDate(pedido.deliveryDeadline)}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            {formatCurrency(pedido.totalAmount)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Pago: {formatCurrency(pedido.paidAmount)}
                          </div>
                          <Link
                            href={`/admin/pedidos/${pedido.id}`}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
                          >
                            Ver detalhes →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Histórico de Orçamentos</CardTitle>
                <CardDescription>
                  Propostas geradas para este cliente
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {cliente.quotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  Nenhum orçamento emitido para este cliente.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cliente.quotes.map((quote) => (
                    <div key={quote.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {quote.quoteNumber}
                          </span>
                          <Badge variant="secondary">{quote.status}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {quote.items.length} itens cotados • Emitido em {formatDate(quote.createdAt)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCurrency(quote.totalAmount)}
                        </div>
                        <Link
                          href={`/admin/orcamentos/${quote.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver proposta →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
