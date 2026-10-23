"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  PlusCircle,
  Copy,
  Check,
  Ban,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function NfePage() {
  const [dados, setDados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  // Modais
  const [modalEmitirAberto, setModalEmitirAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState("");
  const [notaSelecionada, setNotaSelecionada] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");

  const [chaveCopiada, setChaveCopiada] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const carregarNfe = () => {
    setIsLoading(true);
    let url = `/api/nfe?status=${statusFiltro}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setDados(data);
        } else {
          setMensagemErro(data.erro || "Falha ao carregar dados fiscais");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setMensagemErro("Erro ao conectar com o serviço fiscal");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    carregarNfe();
  }, [statusFiltro]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarNfe();
  };

  const handleCopiarChave = (chave: string) => {
    navigator.clipboard.writeText(chave);
    setChaveCopiada(chave);
    setTimeout(() => setChaveCopiada(null), 2000);
  };

  const handleEmitirNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoSelecionadoId) return;

    setIsSubmitting(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch("/api/nfe/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pedidoSelecionadoId, serie: "1" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagemErro(data.erro || "Erro na emissão fiscal");
        setIsSubmitting(false);
        return;
      }

      setMensagemSucesso(data.mensagem);
      setModalEmitirAberto(false);
      setPedidoSelecionadoId("");
      carregarNfe();
    } catch {
      setMensagemErro("Erro ao comunicar com a SEFAZ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrirCancelar = (nota: any) => {
    setNotaSelecionada(nota);
    setJustificativa("");
    setModalCancelarAberto(true);
  };

  const handleConfirmarCancelar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaSelecionada) return;

    if (justificativa.length < 15) {
      alert("A justificativa deve ter no mínimo 15 caracteres por exigência da SEFAZ.");
      return;
    }

    setIsSubmitting(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch(`/api/nfe/${notaSelecionada.id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificativa }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagemErro(data.erro || "Falha ao cancelar NF-e");
        setIsSubmitting(false);
        return;
      }

      setMensagemSucesso(data.mensagem);
      setModalCancelarAberto(false);
      carregarNfe();
    } catch {
      setMensagemErro("Erro ao conectar com a SEFAZ para cancelamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const metricas = dados?.metricas;
  const notas = dados?.notas || [];
  const pedidosAptos = dados?.pedidosAptosParaEmissao || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="h-7 w-7 text-indigo-600" />
            Módulo Fiscal - Nota Fiscal Eletrônica (NF-e)
          </h1>
          <p className="text-sm text-slate-500">
            Emissão de NF-e modelo 55, DANFE, XML e cancelamento com protocolo SEFAZ (Seção 14 - Exclusivo Admin)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalEmitirAberto(true)}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Emitir NF-e de Pedido
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

      {/* 4 Cards de Métricas Fiscais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Total Emitidas</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {metricas?.totalEmitidas ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Histórico fiscal</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Autorizadas</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                {metricas?.totalAutorizadas ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Válidas e homologadas</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Canceladas</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-600 mt-1">
                {metricas?.totalCanceladas ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Com protocolo SEFAZ</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
              <Ban className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Aptos p/ Emissão</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">
                {metricas?.pedidosAptos ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Pedidos sem nota</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["TODOS", "AUTORIZADA", "CANCELADA"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFiltro(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFiltro === s
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "TODOS" ? "Todas as Notas" : s}
              </button>
            ))}
          </div>

          <form onSubmit={handleBuscar} className="flex gap-2 w-full sm:w-72">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nº nota, chave ou cliente..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-8 text-xs shrink-0">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista e Tabela de Notas Fiscais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Notas Fiscais Homologadas ({notas.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Documentos eletrônicos integrados diretamente à SEFAZ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : notas.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Receipt className="h-6 w-6 text-slate-400" />}
                title="Nenhuma nota fiscal encontrada"
                description="Não há notas fiscais emitidas ou compatíveis com os filtros selecionados."
                action={
                  <Button size="sm" onClick={() => setModalEmitirAberto(true)}>
                    Emitir NF-e
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Visualização Mobile: Cards */}
              <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {notas.map((nota: any) => (
                  <div key={nota.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        NF-e #{nota.invoiceNumber || "1001"} (Série {nota.series || "1"})
                      </span>
                      <Badge
                        variant={
                          nota.status === "AUTORIZADA"
                            ? "success"
                            : nota.status === "CANCELADA"
                            ? "secondary"
                            : "danger"
                        }
                        className="text-[10px]"
                      >
                        {nota.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-700">
                      <span className="font-semibold block">{nota.order?.customer?.name || "Cliente Padrão"}</span>
                      <span className="text-slate-400 text-[11px]">{nota.order?.customer?.document || "000.000.000-00"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <Link
                        href={`/admin/pedidos/${nota.order?.id}`}
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        #{nota.order?.orderNumber}
                      </Link>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(nota.order?.totalAmount || 0)}
                      </span>
                    </div>

                    {nota.accessKey && (
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px] font-mono text-slate-600">
                        <span>{`${nota.accessKey.slice(0, 12)}...${nota.accessKey.slice(-6)}`}</span>
                        <button
                          onClick={() => handleCopiarChave(nota.accessKey)}
                          className="p-1 hover:text-indigo-600 text-slate-400"
                          title="Copiar chave"
                        >
                          {chaveCopiada === nota.accessKey ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1.5 pt-2">
                      <span className="text-[10px] text-slate-400">
                        {formatDate(nota.emittedAt || nota.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/api/nfe/${nota.accessKey || nota.id}/danfe`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          >
                            <FileText className="h-3.5 w-3.5 mr-0.5" />
                            DANFE
                          </Button>
                        </a>
                        <a href={`/api/nfe/${nota.accessKey || nota.id}/xml`} download>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-teal-700 border-teal-200 hover:bg-teal-50"
                          >
                            <FileCode2 className="h-3.5 w-3.5 mr-0.5" />
                            XML
                          </Button>
                        </a>
                        {nota.status === "AUTORIZADA" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAbrirCancelar(nota)}
                            className="h-7 px-2 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50"
                          >
                            <Ban className="h-3.5 w-3.5 mr-0.5" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visualização Desktop: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <th className="p-3.5">Nº / Série</th>
                      <th className="p-3.5">Chave de Acesso (44 dígitos)</th>
                      <th className="p-3.5">Pedido</th>
                      <th className="p-3.5">Destinatário</th>
                      <th className="p-3.5 text-right">Valor Total</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Data Emissão</th>
                      <th className="p-3.5 text-right">Ações Fiscais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notas.map((nota: any) => (
                      <tr key={nota.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {nota.invoiceNumber || "1001"} / {nota.series || "1"}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                            <span>
                              {nota.accessKey
                                ? `${nota.accessKey.slice(0, 10)}...${nota.accessKey.slice(-6)}`
                                : "-"}
                            </span>
                            {nota.accessKey && (
                              <button
                                onClick={() => handleCopiarChave(nota.accessKey)}
                                className="p-1 hover:text-indigo-600 rounded transition-colors"
                                title="Copiar chave de acesso"
                              >
                                {chaveCopiada === nota.accessKey ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <Link
                            href={`/admin/pedidos/${nota.order?.id}`}
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            #{nota.order?.orderNumber}
                          </Link>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900 block">
                            {nota.order?.customer?.name || "Cliente Padrão"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {nota.order?.customer?.document || "000.000.000-00"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(nota.order?.totalAmount || 0)}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge
                            variant={
                              nota.status === "AUTORIZADA"
                                ? "success"
                                : nota.status === "CANCELADA"
                                ? "secondary"
                                : "danger"
                            }
                            className="text-[10px]"
                          >
                            {nota.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-center text-slate-500">
                          {formatDate(nota.emittedAt || nota.createdAt)}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botão DANFE */}
                            <a
                              href={`/api/nfe/${nota.accessKey || nota.id}/danfe`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                title="Visualizar DANFE"
                              >
                                <FileText className="h-3.5 w-3.5 mr-0.5" />
                                DANFE
                              </Button>
                            </a>

                            {/* Botão XML */}
                            <a href={`/api/nfe/${nota.accessKey || nota.id}/xml`} download>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-teal-700 border-teal-200 hover:bg-teal-50"
                              >
                                <FileCode2 className="h-3.5 w-3.5 mr-0.5" />
                                XML
                              </Button>
                            </a>

                            {/* Botão Cancelar */}
                            {nota.status === "AUTORIZADA" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAbrirCancelar(nota)}
                                className="h-7 px-2 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50"
                                title="Cancelar NF-e na SEFAZ"
                              >
                                <Ban className="h-3.5 w-3.5 mr-0.5" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal: Emitir NF-e para Pedido */}
      <Modal
        isOpen={modalEmitirAberto}
        onClose={() => setModalEmitirAberto(false)}
        title="Emitir NF-e (Modelo 55)"
        description="Selecione o pedido faturado para transmissão do documento à SEFAZ."
        maxWidth="lg"
      >
        <form onSubmit={handleEmitirNota} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Selecione o Pedido Apto para Emissão Fiscal *
            </label>
            {pedidosAptos.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Nenhum pedido finalizado disponível para emissão fiscal no momento.
              </div>
            ) : (
              <select
                required
                value={pedidoSelecionadoId}
                onChange={(e) => setPedidoSelecionadoId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="">Selecione um pedido...</option>
                {pedidosAptos.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    #{p.orderNumber} - {p.customer?.name} ({formatCurrency(p.totalAmount)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">Informações Tributárias:</span>
            <p className="text-[11px] text-slate-600">
              • <strong>NCM Padrão:</strong> 6109.10.00 (Camisetas de malha)<br />
              • <strong>CFOP:</strong> 5.101 (Venda de produção do estabelecimento)<br />
              • <strong>Ambiente:</strong> Homologação SEFAZ / Modelo 55<br />
              • <strong>Série:</strong> 1
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalEmitirAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !pedidoSelecionadoId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmitting ? "Emitindo..." : "Transmitir para SEFAZ"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cancelar NF-e */}
      <Modal
        isOpen={modalCancelarAberto && !!notaSelecionada}
        onClose={() => setModalCancelarAberto(false)}
        title={`Cancelar NF-e nº ${notaSelecionada?.invoiceNumber || ""}`}
        description="O cancelamento de NF-e é irreversível perante a Secretaria da Fazenda."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmarCancelar} className="space-y-3.5 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
            Atenção: O cancelamento de NF-e exige justificativa válida perante o fisco.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Justificativa de Cancelamento * (Mínimo 15 caracteres)
            </label>
            <textarea
              required
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex: Cancelamento solicitado pelo cliente antes do despacho da mercadoria..."
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-rose-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Caracteres: {justificativa.length} / 15 mínimo
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalCancelarAberto(false)}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || justificativa.length < 15}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
