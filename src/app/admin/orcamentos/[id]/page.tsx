"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  Shirt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function getQuoteStatusBadge(status: string) {
  switch (status) {
    case "PENDENTE":
      return <Badge variant="secondary">Pendente</Badge>;
    case "ENVIADO":
      return <Badge variant="info">Enviado ao Cliente</Badge>;
    case "APROVADO":
      return <Badge variant="success">Aprovado pelo Cliente</Badge>;
    case "CONVERTIDO":
      return <Badge variant="default">Convertido em Pedido</Badge>;
    case "RECUSADO":
      return <Badge variant="danger">Recusado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function OrcamentoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const carregarOrcamento = () => {
    setIsLoading(true);
    fetch(`/api/orcamentos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso && data.orcamento) {
          setOrcamento(data.orcamento);
        } else {
          setErrorMessage("Orçamento não localizado.");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage("Erro ao conectar com o servidor.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (id) carregarOrcamento();
  }, [id]);

  // Converter Orçamento em Pedido (Seção 8)
  const handleConverter = async () => {
    if (!confirm("Deseja realmente converter este orçamento em um Pedido de Produção? Todos os itens e valores serão importados automaticamente sem retrabalho.")) {
      return;
    }

    setIsConverting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/orcamentos/${id}/converter`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Falha ao converter orçamento em pedido.");
        setIsConverting(false);
        return;
      }

      setSuccessMessage(data.mensagem);
      // Redirecionar para o pedido gerado após 1.5s
      setTimeout(() => {
        router.push(`/admin/pedidos/${data.pedido.id}`);
      }, 1200);
    } catch {
      setErrorMessage("Erro de comunicação ao converter orçamento.");
      setIsConverting(false);
    }
  };

  // Alterar Status (Aprovar / Recusar / Marcar como Enviado)
  const handleUpdateStatus = async (novoStatus: string) => {
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (res.ok) {
        carregarOrcamento();
      }
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
          <p className="text-xs text-slate-400">Carregando detalhes da proposta...</p>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="text-center py-16 space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Orçamento não encontrado</h2>
        <Link href="/admin/orcamentos">
          <Button variant="outline" size="sm">Voltar para Orçamentos</Button>
        </Link>
      </div>
    );
  }

  const cleanPhone = orcamento.customer?.whatsapp?.replace(/\D/g, "") || "";
  const pedidoVinculado = orcamento.orders?.[0];
  const totalPecas = orcamento.items.reduce((acc: number, i: any) => acc + i.quantity, 0);

  // Mensagem pré-formatada para WhatsApp (Seção 15)
  const msgWhatsapp = encodeURIComponent(
    `Olá ${orcamento.customer.name}! Segue a proposta comercial *${orcamento.quoteNumber}* da Heelcloth Uniformes:\n` +
    `📦 Total de Peças: ${totalPecas} un.\n` +
    `💰 Valor Final: ${formatCurrency(orcamento.totalAmount)}\n` +
    `📅 Validade: ${orcamento.validUntil ? formatDate(orcamento.validUntil) : "15 dias"}\n` +
    `Ficamos à disposição para tirar qualquer dúvida e iniciar a produção dos seus uniformes!`
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link href="/admin/orcamentos">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Orçamentos
          </Button>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Imprimir Proposta
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMessage} Redirecionando para o pedido...</span>
        </div>
      )}

      {/* Proposal Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {orcamento.quoteNumber}
            </h1>
            {getQuoteStatusBadge(orcamento.status)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Criado em {formatDate(orcamento.createdAt)}
            {orcamento.validUntil && <span> • Válido até {formatDate(orcamento.validUntil)}</span>}
          </p>
        </div>

        {/* Action Buttons: Section 8 Converter button */}
        <div className="flex flex-wrap items-center gap-2">
          {orcamento.status === "CONVERTIDO" && pedidoVinculado ? (
            <Link href={`/admin/pedidos/${pedidoVinculado.id}`}>
              <Button variant="default" size="sm" className="gap-2">
                <Layers className="h-4 w-4" />
                Acessar Pedido {pedidoVinculado.orderNumber}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleConverter}
              isLoading={isConverting}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4" />
              Converter em Pedido
            </Button>
          )}

          <a
            href={`https://wa.me/${cleanPhone}?text=${msgWhatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              <MessageCircle className="h-4 w-4" />
              Enviar no WhatsApp
            </Button>
          </a>
        </div>
      </div>

      {/* Status workflow switch (when not yet converted) */}
      {orcamento.status !== "CONVERTIDO" && (
        <Card className="bg-slate-50/70 border-slate-200">
          <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-600">Atualizar status da negociação:</span>
            <div className="flex items-center gap-2">
              <Button
                variant={orcamento.status === "ENVIADO" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleUpdateStatus("ENVIADO")}
              >
                Marcar como Enviado
              </Button>
              <Button
                variant={orcamento.status === "APROVADO" ? "success" : "outline"}
                size="sm"
                className="h-7 text-xs text-emerald-700"
                onClick={() => handleUpdateStatus("APROVADO")}
              >
                Marcar como Aprovado
              </Button>
              <Button
                variant={orcamento.status === "RECUSADO" ? "danger" : "outline"}
                size="sm"
                className="h-7 text-xs text-rose-700"
                onClick={() => handleUpdateStatus("RECUSADO")}
              >
                Recusado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Sheet Card */}
      <Card className="overflow-hidden">
        {/* Printable Letterhead Header */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shirt className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight block">Heelcloth Confecção</span>
              <span className="text-xs text-slate-400 block">Uniformes Esportivos & Personalização</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-300">
            <div>Proposta Comercial Nº: <b className="text-white font-mono">{orcamento.quoteNumber}</b></div>
            <div>Data: {formatDate(orcamento.createdAt)}</div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Dados do Cliente
            </span>
            <div className="font-bold text-slate-900 mt-1">{orcamento.customer.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">WhatsApp: {orcamento.customer.whatsapp}</div>
            {orcamento.customer.email && (
              <div className="text-xs text-slate-500">E-mail: {orcamento.customer.email}</div>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Condições Comerciais
            </span>
            <div className="text-xs text-slate-600 mt-1">
              Validade da Proposta: <b>{orcamento.validUntil ? formatDate(orcamento.validUntil) : "15 dias"}</b>
            </div>
            <div className="text-xs text-slate-600">
              Prazo Estimado de Produção: <b>10 a 15 dias úteis</b> após aprovação da arte
            </div>
          </div>
        </div>

        {/* Items Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Item / Produto</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4 text-right">Preço Unitário</th>
                  <th className="py-3 px-6 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orcamento.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{item.product}</div>
                      {item.details && (
                        <div className="text-xs text-slate-500 mt-0.5">{item.details}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-medium text-slate-800">
                      {item.quantity} un.
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes Section */}
          <div className="p-6 border-t border-slate-200 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-12 gap-6">
            <div className="sm:col-span-7 space-y-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Observações & Termos
              </span>
              <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                {orcamento.notes || "Proposta sujeita à aprovação final de tecidos e layout dos modelos."}
              </p>
            </div>

            <div className="sm:col-span-5 space-y-2">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono text-slate-800">
                    {formatCurrency(
                      orcamento.items.reduce((acc: number, i: any) => acc + i.totalPrice, 0)
                    )}
                  </span>
                </div>

                {orcamento.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-sm">
                    <span>Desconto Concedido:</span>
                    <span className="font-mono">-{formatCurrency(orcamento.discount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Total da Proposta:</span>
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    {formatCurrency(orcamento.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
