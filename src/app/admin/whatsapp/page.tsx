"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingCart,
  Phone,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { TEMPLATES_NOTIFICACAO, renderizarTemplate, gerarLinkWhatsApp } from "@/services/whatsapp";

const TEMPLATES_LISTA = [
  { id: "PEDIDO_CONFIRMADO", label: "1. Confirmação de Pedido" },
  { id: "PRODUCAO_INICIADA", label: "2. Produção Iniciada (Corte/Estampa)" },
  { id: "PRODUCAO_CONCLUIDA", label: "3. Produção Concluída (Acabamento)" },
  { id: "PEDIDO_PRONTO", label: "4. Pedido Pronto para Retirada/Envio" },
  { id: "PEDIDO_ENTREGUE", label: "5. Pedido Entregue / Agradecimento" },
  { id: "MENSAGEM_LIVRE", label: "6. Mensagem Livre / Personalizada" },
];

export default function WhatsAppPage() {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  // Modal Novo Disparo
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidosRecentes, setPedidosRecentes] = useState<any[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);

  const [formDisparo, setFormDisparo] = useState({
    orderId: "",
    phone: "",
    templateType: "PEDIDO_CONFIRMADO",
    customMessage: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const carregarMensagens = () => {
    setIsLoading(true);
    let url = `/api/whatsapp?status=${statusFiltro}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setMensagens(data.mensagens);
          setMetricas(data.metricas);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  const carregarPedidos = () => {
    fetch("/api/pedidos")
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setPedidosRecentes(data.pedidos || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    carregarMensagens();
    carregarPedidos();
  }, [statusFiltro]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarMensagens();
  };

  const handleSelecionarPedido = (orderId: string) => {
    const ped = pedidosRecentes.find((p) => p.id === orderId);
    setPedidoSelecionado(ped || null);
    setFormDisparo((prev) => ({
      ...prev,
      orderId,
      phone: ped?.clienteTelefone || ped?.clienteWhatsapp || prev.phone,
    }));
  };

  // Gerar preview do texto em tempo real
  const textoPreview = (() => {
    if (formDisparo.templateType === "MENSAGEM_LIVRE") {
      return formDisparo.customMessage || "Digite sua mensagem personalizada...";
    }
    const raw = TEMPLATES_NOTIFICACAO[formDisparo.templateType] || "";
    return renderizarTemplate(raw, {
      cliente: pedidoSelecionado?.clienteNome || "Nome do Cliente",
      pedido: pedidoSelecionado?.numero || "HC-2603-0001",
      valorTotal: pedidoSelecionado?.total ? `R$ ${pedidoSelecionado.total.toFixed(2)}` : "R$ 1.500,00",
      valorPago: pedidoSelecionado?.total ? `R$ ${(pedidoSelecionado.total / 2).toFixed(2)}` : "R$ 750,00",
      totalPecas: pedidoSelecionado?.totalPecas || 15,
      prazo: pedidoSelecionado?.prazo ? formatDate(pedidoSelecionado.prazo) : "10 dias",
      infoSaldo: "💳 Saldo restante a pagar na entrega: *R$ 750,00*",
      mensagem: formDisparo.customMessage,
    });
  })();

  const linkWaWebPreview = gerarLinkWhatsApp(formDisparo.phone || "5511999999999", textoPreview);

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch("/api/whatsapp/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: formDisparo.orderId || undefined,
          phone: formDisparo.phone,
          templateType: formDisparo.templateType,
          customMessage: formDisparo.customMessage,
          dispararAutomatico: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagemErro(data.erro || "Falha ao enviar mensagem");
        setIsSubmitting(false);
        return;
      }

      setMensagemSucesso(data.mensagem);
      setModalAberto(false);
      setFormDisparo({
        orderId: "",
        phone: "",
        templateType: "PEDIDO_CONFIRMADO",
        customMessage: "",
      });
      setPedidoSelecionado(null);
      carregarMensagens();
    } catch {
      setMensagemErro("Erro ao comunicar com o servidor de WhatsApp");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReenviar = async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/${id}/reenviar`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMensagemSucesso("Mensagem reenviada com sucesso!");
        carregarMensagens();
      } else {
        alert(data.erro || "Falha ao reenviar");
      }
    } catch {
      alert("Erro ao conectar com o servidor");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            Comunicação & Automação WhatsApp
          </h1>
          <p className="text-sm text-slate-500">
            Fila de disparos automáticos por status do pedido e links diretos para WhatsApp Web (Seção 15)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalAberto(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Novo Disparo WhatsApp
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

      {/* 4 Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Total Mensagens</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {metricas?.total ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Histórico completo</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Enviadas</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                {metricas?.enviadas ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Disparadas com sucesso</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Pendentes</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">
                {metricas?.pendentes ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Na fila de envio</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">Falhas</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
                {metricas?.falhas ?? 0}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Necessitam reenvio</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["TODOS", "ENVIADO", "PENDENTE", "FALHA"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFiltro(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFiltro === s
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "TODOS" ? "Todas as Mensagens" : s}
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
                placeholder="Buscar por telefone, cliente..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-8 text-xs shrink-0">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista e Tabela de Mensagens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Fila de Comunicação & Histórico ({mensagens.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Registro cronológico das mensagens enviadas e pendentes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<MessageSquare className="h-6 w-6 text-slate-400" />}
                title="Nenhuma mensagem de WhatsApp encontrada"
                description="Não há notificações enviadas ou pendentes com os filtros atuais."
                action={
                  <Button size="sm" onClick={() => setModalAberto(true)}>
                    Novo Disparo
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Visualização Mobile: Cards */}
              <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {mensagens.map((msg: any) => {
                  const waLink = gerarLinkWhatsApp(msg.phone, msg.content);
                  return (
                    <div key={msg.id} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {msg.customer?.name || "Cliente Avulso"}
                        </span>
                        <Badge
                          variant={
                            msg.status === "ENVIADO"
                              ? "success"
                              : msg.status === "PENDENTE"
                              ? "warning"
                              : "danger"
                          }
                          className="text-[10px]"
                        >
                          {msg.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          {msg.phone}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {msg.templateType}
                        </Badge>
                      </div>

                      {msg.order && (
                        <div className="text-xs">
                          <Link
                            href={`/admin/pedidos/${msg.order.id}`}
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Pedido #{msg.order.orderNumber}
                          </Link>
                        </div>
                      )}

                      <div className="p-2.5 rounded bg-slate-50 border border-slate-100 text-slate-700 text-xs whitespace-pre-wrap font-sans line-clamp-3">
                        {msg.content}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">
                          {formatDate(msg.sentAt || msg.createdAt)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              WhatsApp
                            </Button>
                          </a>
                          {msg.status !== "ENVIADO" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReenviar(msg.id)}
                              className="h-7 px-2 text-[11px] text-slate-600 hover:bg-slate-100"
                              title="Tentar reenviar"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visualização Desktop: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <th className="p-3.5">Destinatário</th>
                      <th className="p-3.5">Template</th>
                      <th className="p-3.5">Pedido</th>
                      <th className="p-3.5">Prévia da Mensagem</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Data Envio</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mensagens.map((msg: any) => {
                      const waLink = gerarLinkWhatsApp(msg.phone, msg.content);
                      return (
                        <tr key={msg.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">
                              {msg.customer?.name || "Cliente Avulso"}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-emerald-600" />
                              {msg.phone}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {msg.templateType}
                            </Badge>
                          </td>
                          <td className="p-3.5">
                            {msg.order ? (
                              <Link
                                href={`/admin/pedidos/${msg.order.id}`}
                                className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                #{msg.order.orderNumber}
                              </Link>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3.5 max-w-xs truncate text-slate-700 font-mono text-[11px]">
                            {msg.content}
                          </td>
                          <td className="p-3.5 text-center">
                            <Badge
                              variant={
                                msg.status === "ENVIADO"
                                  ? "success"
                                  : msg.status === "PENDENTE"
                                  ? "warning"
                                  : "danger"
                              }
                              className="text-[10px]"
                            >
                              {msg.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-center text-slate-500">
                            {formatDate(msg.sentAt || msg.createdAt)}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão WhatsApp Web */}
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                  title="Abrir conversa no WhatsApp Web"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-0.5" />
                                  Abrir WhatsApp
                                </Button>
                              </a>

                              {/* Botão Reenviar */}
                              {msg.status !== "ENVIADO" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReenviar(msg.id)}
                                  className="h-7 px-2 text-[11px] text-slate-600 hover:bg-slate-100"
                                  title="Tentar reenviar"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              )}
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

      {/* Modal: Novo Disparo com Balão de Preview WhatsApp */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Disparar Mensagem de WhatsApp"
        description="Envie notificações automáticas com link direto para o WhatsApp do cliente."
        maxWidth="2xl"
      >
        <form onSubmit={handleEnviarMensagem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selecionar Pedido */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vincular a Pedido (Opcional)
              </label>
              <select
                value={formDisparo.orderId}
                onChange={(e) => handleSelecionarPedido(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-emerald-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="">Nenhum (Mensagem Avulsa)</option>
                {pedidosRecentes.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.numero} - {p.clienteNome}
                  </option>
                ))}
              </select>
            </div>

            {/* Telefone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Número do WhatsApp (com DDD) *
              </label>
              <input
                type="text"
                required
                value={formDisparo.phone}
                onChange={(e) => setFormDisparo({ ...formDisparo, phone: e.target.value })}
                placeholder="Ex: 5511999998888 ou (11) 99999-8888"
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tipo de Template */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Template da Mensagem (Seção 15) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES_LISTA.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormDisparo({ ...formDisparo, templateType: t.id })}
                  className={`p-2 rounded-lg border text-left transition-all text-xs ${
                    formDisparo.templateType === t.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mensagem Livre (se selecionado) */}
          {formDisparo.templateType === "MENSAGEM_LIVRE" && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Texto Personalizado *
              </label>
              <textarea
                required
                rows={3}
                value={formDisparo.customMessage}
                onChange={(e) =>
                  setFormDisparo({ ...formDisparo, customMessage: e.target.value })
                }
                placeholder="Digite a mensagem para o cliente..."
                className="w-full rounded-lg border border-slate-300 p-2 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Balão de Preview Estilo WhatsApp */}
          <div className="rounded-xl border border-emerald-200 bg-[#EFEAE2] p-4">
            <span className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Pré-visualização do Balão de WhatsApp:
            </span>
            <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none shadow-xs text-slate-800 text-xs whitespace-pre-line max-w-md ml-auto border border-emerald-100">
              {textoPreview}
              <div className="text-[10px] text-slate-500 text-right mt-1.5 flex items-center justify-end gap-1">
                <span>12:00</span>
                <CheckCircle2 className="h-3 w-3 text-sky-500" />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
            {/* Link Direto WhatsApp Web */}
            <a
              href={linkWaWebPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Abrir no WhatsApp Web
              </Button>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formDisparo.phone}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Send className="h-4 w-4 mr-1.5" />
                {isSubmitting ? "Disparando..." : "Disparar via Sistema"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
