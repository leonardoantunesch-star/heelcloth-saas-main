"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Users,
  Layers,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shirt,
  Calendar,
  DollarSign,
  CreditCard,
  MessageCircle,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

// Fases ordenadas do fluxo de pedidos da Heelcloth
const FLUXO_STEPS = [
  { id: "AGUARDANDO_APROVACAO", label: "Aguardando", short: "Aprovação" },
  { id: "APROVADO", label: "Aprovado", short: "Aprovado" },
  { id: "PAGAMENTO_CONFIRMADO", label: "Pagamento", short: "Pago" },
  { id: "EM_PRODUCAO", label: "Produção", short: "Produção" },
  { id: "CONTROLE_QUALIDADE", label: "Qualidade", short: "Qualidade" },
  { id: "PRONTO", label: "Pronto", short: "Pronto" },
  { id: "ENTREGUE", label: "Entregue", short: "Entregue" },
  { id: "CONCLUIDO", label: "Concluído", short: "Concluído" },
];

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
      return <Badge variant="success">Pagamento Confirmado</Badge>;
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
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function PedidoDetalhesContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  // Estado das Abas
  const tabParam = searchParams.get("tab") as any;
  const [activeTab, setActiveTab] = useState<"fluxo" | "pagamento" | "jogadores" | "excluir">("fluxo");

  useEffect(() => {
    if (tabParam && ["fluxo", "pagamento", "jogadores", "excluir"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [pedido, setPedido] = useState<any>(null);
  const [jogadores, setJogadores] = useState<any[]>([]);
  const [duplicados, setDuplicados] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedVba, setCopiedVba] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [textoImportacao, setTextoImportacao] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário de Pagamento (Parcelas e Entradas)
  const [valorPagamento, setValorPagamento] = useState<string>("");
  const [metodoPagamento, setMetodoPagamento] = useState<string>("PIX");
  const [obsPagamento, setObsPagamento] = useState<string>("");
  const [atualizarStatusAposPago, setAtualizarStatusAposPago] = useState<boolean>(true);

  // Confirmação de Exclusão
  const [confirmarNumeroPedido, setConfirmarNumeroPedido] = useState<string>("");
  const [modalExcluirAberto, setModalExcluirAberto] = useState<boolean>(false);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [resPedido, resJogadores] = await Promise.all([
        fetch(`/api/pedidos/${id}`).then((r) => r.json()),
        fetch(`/api/pedidos/${id}/jogadores`).then((r) => r.json()),
      ]);

      if (resPedido.sucesso && resPedido.pedido) {
        setPedido(resPedido.pedido);
        // Preenche sugestão de valor (saldo pendente ou total)
        if (resPedido.pedido.pendingAmount > 0) {
          setValorPagamento(resPedido.pedido.pendingAmount.toFixed(2));
        } else if (resPedido.pedido.paidAmount === 0) {
          setValorPagamento(resPedido.pedido.totalAmount.toFixed(2));
        }
      }
      if (resJogadores.sucesso) {
        setJogadores(resJogadores.jogadores || []);
        setDuplicados(resJogadores.numerosDuplicados || []);
      }
    } catch {
      setErrorMessage("Erro ao carregar dados do pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  // Avançar 1 fase imediatamente no fluxo
  const handleAvancarFase = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pedidos/${id}/avancar`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Não foi possível avançar a fase.");
        return;
      }

      setSuccessMessage(data.mensagem || `Fase avançada para: ${data.novoStatus}`);
      carregarDados();
    } catch {
      setErrorMessage("Erro de comunicação ao avançar fase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alteração manual de status
  const handleUpdateStatus = async (novoStatus: string) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/pedidos/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Não foi possível alterar o status.");
        return;
      }

      setSuccessMessage(`Status atualizado para: ${novoStatus}`);
      carregarDados();
    } catch {
      setErrorMessage("Erro ao atualizar status.");
    }
  };

  // Registrar pagamento de parcela / entrada
  const handleRegistrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const valorNum = parseFloat(valorPagamento.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErrorMessage("Informe um valor de pagamento válido maior que zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pedidos/${id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: valorNum,
          paymentMethod: metodoPagamento,
          notes: obsPagamento || `Parcela paga para o pedido ${pedido.orderNumber}`,
          atualizarStatus: atualizarStatusAposPago,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Falha ao registrar pagamento.");
        return;
      }

      setSuccessMessage(data.mensagem || "Pagamento registrado com sucesso!");
      setObsPagamento("");
      carregarDados();
    } catch {
      setErrorMessage("Erro de comunicação ao registrar pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclusão definitiva do pedido
  const handleExcluirPedido = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Não foi possível excluir o pedido.");
        setIsSubmitting(false);
        return;
      }

      alert(`Pedido ${pedido.orderNumber} excluído com sucesso.`);
      router.push("/admin/pedidos");
    } catch {
      setErrorMessage("Erro de comunicação ao excluir pedido.");
      setIsSubmitting(false);
    }
  };

  // Copiar formatação CorelDRAW VBA
  const handleCopiarCorelDraw = async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}/jogadores`);
      const data = await res.json();

      if (data.sucesso && data.textoVbaCorelDraw) {
        await navigator.clipboard.writeText(data.textoVbaCorelDraw);
        setCopiedVba(true);
        setTimeout(() => setCopiedVba(false), 2500);
      } else {
        alert("Nenhum jogador cadastrado para exportar ao CorelDRAW.");
      }
    } catch {
      alert("Erro ao copiar para a área de transferência.");
    }
  };

  // Importar jogadores colados da planilha
  const handleImportarJogadores = async () => {
    if (!textoImportacao.trim()) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/pedidos/${id}/jogadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoColado: textoImportacao }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requerConfirmacao) {
          if (confirm(`${data.erro}\nDeseja salvar mesmo assim com os números repetidos?`)) {
            const forcarRes = await fetch(`/api/pedidos/${id}/jogadores`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ textoColado: textoImportacao, permitirDuplicados: true }),
            });
            const forcarData = await forcarRes.json();
            if (forcarRes.ok) {
              setSuccessMessage(forcarData.mensagem);
              setModalImportar(false);
              setTextoImportacao("");
              carregarDados();
              return;
            }
          }
        }
        setErrorMessage(data.erro || "Falha na importação.");
        return;
      }

      setSuccessMessage(data.mensagem);
      setModalImportar(false);
      setTextoImportacao("");
      carregarDados();
    } catch {
      setErrorMessage("Erro de comunicação ao importar jogadores.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
          <p className="text-xs text-slate-400">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Pedido não encontrado</h2>
        <Link href="/admin/pedidos">
          <Button variant="outline" size="sm" className="mt-3">Voltar para Pedidos</Button>
        </Link>
      </div>
    );
  }

  // Próxima fase sugerida
  const proximaFaseMap: Record<string, string> = {
    ORCAMENTO: "APROVADO",
    AGUARDANDO_APROVACAO: "APROVADO",
    APROVADO: "PAGAMENTO_CONFIRMADO",
    PAGAMENTO_PENDENTE: "PAGAMENTO_CONFIRMADO",
    PAGAMENTO_CONFIRMADO: "EM_PRODUCAO",
    EM_PRODUCAO: "CONTROLE_QUALIDADE",
    CONTROLE_QUALIDADE: "PRONTO",
    PRONTO: "ENTREGUE",
    ENTREGUE: "CONCLUIDO",
  };
  const proximaFaseId = proximaFaseMap[pedido.status] || null;
  const proximaFaseLabel = proximaFaseId
    ? FLUXO_STEPS.find((s) => s.id === proximaFaseId)?.label || proximaFaseId
    : null;

  // Percentual de pagamento
  const percentualPago =
    pedido.totalAmount > 0
      ? Math.min(100, Math.round((pedido.paidAmount / pedido.totalAmount) * 100))
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link href="/admin/pedidos">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Pedidos
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Rastreio público:{" "}
            <Link
              href={`/rastreio/${pedido.orderNumber}`}
              target="_blank"
              className="font-mono text-blue-600 hover:underline font-semibold"
            >
              {pedido.orderNumber} ↗
            </Link>
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Banner Principal do Pedido */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {pedido.orderNumber}
            </h1>
            {getStatusBadge(pedido.status)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-4">
            <span>
              Cliente:{" "}
              <Link
                href={`/admin/clientes/${pedido.customer.id}`}
                className="font-bold text-slate-800 hover:text-blue-600 underline"
              >
                {pedido.customer.name}
              </Link>
            </span>
            <span>WhatsApp: <b>{pedido.customer.whatsapp}</b></span>
            <span>Criado em: {formatDate(pedido.createdAt)}</span>
          </div>
        </div>

        {/* Botão de Destaque: Avançar Próxima Fase */}
        {proximaFaseId && (
          <Button
            onClick={handleAvancarFase}
            disabled={isSubmitting}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold h-10 px-4"
          >
            <Sparkles className="h-4 w-4 text-blue-200" />
            <span>Avançar p/ {proximaFaseLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navegação por Abas do Pedido */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 bg-slate-50/50 p-1.5 rounded-xl border">
        <button
          type="button"
          onClick={() => setActiveTab("fluxo")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "fluxo"
              ? "bg-white text-blue-700 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Layers className="h-4 w-4" />
          Fluxo & Fases
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pagamento")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "pagamento"
              ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Confirmar Pagamento
          {pedido.pendingAmount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
              Pendente
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
              100% Pago
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jogadores")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "jogadores"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Shirt className="h-4 w-4" />
          Uniformes & Jogadores ({jogadores.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("excluir")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ml-auto ${
            activeTab === "excluir"
              ? "bg-rose-50 text-rose-700 shadow-xs border border-rose-200"
              : "text-rose-500 hover:text-rose-700 hover:bg-rose-50/50"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Excluir Pedido
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: FLUXO DE FASES & STATUS */}
      {/* ========================================================================= */}
      {activeTab === "fluxo" && (
        <div className="space-y-6">
          {/* Linha do Tempo / Stepper do Fluxo */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    Esteira de Produção & Fases do Pedido
                  </CardTitle>
                  <CardDescription>
                    Avanço ordenado de fases: aprove, confirme pagamento, envie para a fábrica e conclua.
                  </CardDescription>
                </div>
                {proximaFaseId && (
                  <Button
                    onClick={handleAvancarFase}
                    disabled={isSubmitting}
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <span>Avançar para {proximaFaseLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Stepper Visual */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center min-w-[700px] justify-between relative">
                  {FLUXO_STEPS.map((step, idx) => {
                    const stepIndexAtual = FLUXO_STEPS.findIndex((s) => s.id === pedido.status);
                    const isCompleted = stepIndexAtual > idx;
                    const isCurrent = pedido.status === step.id;

                    return (
                      <div key={step.id} className="flex-1 flex flex-col items-center relative text-center">
                        {/* Linha conectora */}
                        {idx !== 0 && (
                          <div
                            className={`absolute top-4 -left-1/2 w-full h-1 -z-0 ${
                              isCompleted || isCurrent ? "bg-blue-600" : "bg-slate-200"
                            }`}
                          />
                        )}

                        {/* Círculo do Stepper */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(step.id)}
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm"
                              : isCompleted
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
                          }`}
                          title={`Clique para definir o status como ${step.label}`}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                        </button>

                        <span
                          className={`mt-2 text-xs font-semibold ${
                            isCurrent
                              ? "text-blue-700"
                              : isCompleted
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {step.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seletor Manual Rápido de Status */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-medium text-slate-500 block">
                  Ou clique para definir o status diretamente:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "APROVADO", label: "Aprovado" },
                    { id: "PAGAMENTO_CONFIRMADO", label: "Pagamento Confirmado" },
                    { id: "EM_PRODUCAO", label: "Em Produção" },
                    { id: "CONTROLE_QUALIDADE", label: "Controle de Qualidade" },
                    { id: "PRONTO", label: "Pronto" },
                    { id: "ENTREGUE", label: "Entregue" },
                    { id: "CONCLUIDO", label: "Concluído" },
                    { id: "CANCELADO", label: "Cancelar Pedido" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleUpdateStatus(st.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                        pedido.status === st.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Indicadores Financeiros e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-medium text-slate-500">Valor Total</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(pedido.totalAmount)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Forma: {pedido.paymentMethod || "A definir"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-medium text-slate-500">Valor Pago Acumulado</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(pedido.paidAmount)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {percentualPago}% quitado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-medium text-slate-500">Saldo Restante</span>
                <div
                  className={`text-xl font-bold mt-1 ${
                    pedido.pendingAmount > 0 ? "text-amber-600" : "text-slate-900"
                  }`}
                >
                  {formatCurrency(pedido.pendingAmount)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {pedido.pendingAmount > 0 ? "Receber na entrega/próx parcela" : "100% Quitado"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-medium text-slate-500">Prazo de Entrega</span>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {pedido.deliveryDeadline ? formatDate(pedido.deliveryDeadline) : "A definir"}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Prazo de produção</p>
              </CardContent>
            </Card>
          </div>

          {/* Ordem de Produção & Fábrica */}
          {pedido.productionOrder && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-600" />
                    Etapa Atual na Fábrica
                  </span>
                  <Badge variant="warning">
                    Etapa: {pedido.productionOrder.currentStage} ({pedido.productionOrder.stageStatus})
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    "ARTE",
                    "CORTE",
                    "PERSONALIZACAO",
                    "COSTURA",
                    "ESTAMPA",
                    "ACABAMENTO",
                    "CONTROLE_QUALIDADE",
                    "PRONTO",
                  ].map((stage) => {
                    const isStageCurrent = pedido.productionOrder.currentStage === stage;
                    return (
                      <span
                        key={stage}
                        className={`px-2.5 py-1 rounded font-mono font-medium ${
                          isStageCurrent
                            ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {stage}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CONFIRMAR PAGAMENTO & PARCELAS */}
      {/* ========================================================================= */}
      {activeTab === "pagamento" && (
        <div className="space-y-6">
          {/* Card Resumo do Status Financeiro */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Gestão Financeira & Parcelamento
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Registre parcelas de entrada combinadas (ex: 50% adiantado) ou quitações totais.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Total do Pedido</span>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(pedido.totalAmount)}
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>
                  Pago: <b>{formatCurrency(pedido.paidAmount)}</b> ({percentualPago}%)
                </span>
                <span>
                  Resta: <b className="text-amber-600">{formatCurrency(pedido.pendingAmount)}</b>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentualPago}%` }}
                />
              </div>
            </div>
          </div>

          {/* Formulário para Registrar Nova Parcela ou Pagamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Confirmar Novo Pagamento / Parcela
              </CardTitle>
              <CardDescription>
                Selecione o valor pago pelo cliente e a forma de pagamento para conciliar no sistema.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleRegistrarPagamento} className="space-y-4">
                {/* Botões Rápidos de Parcela */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Sugestões Rápidas de Pagamento:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {pedido.totalAmount > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValorPagamento((pedido.totalAmount * 0.5).toFixed(2))}
                          className="text-xs bg-slate-50 hover:bg-slate-100"
                        >
                          Entrada 50% ({formatCurrency(pedido.totalAmount * 0.5)})
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValorPagamento((pedido.totalAmount * 0.3).toFixed(2))}
                          className="text-xs bg-slate-50 hover:bg-slate-100"
                        >
                          Entrada 30% ({formatCurrency(pedido.totalAmount * 0.3)})
                        </Button>
                        {pedido.pendingAmount > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setValorPagamento(pedido.pendingAmount.toFixed(2))}
                            className="text-xs bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          >
                            Quitar Saldo Restante ({formatCurrency(pedido.pendingAmount)})
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValorPagamento(pedido.totalAmount.toFixed(2))}
                          className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        >
                          Valor Total 100% ({formatCurrency(pedido.totalAmount)})
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Valor a Pagar */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Valor do Pagamento (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="text"
                        value={valorPagamento}
                        onChange={(e) => setValorPagamento(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Forma de Pagamento *
                    </label>
                    <select
                      value={metodoPagamento}
                      onChange={(e) => setMetodoPagamento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                    >
                      <option value="PIX">PIX (Chave / QR Code)</option>
                      <option value="CARTAO">Cartão de Crédito / Débito</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</option>
                      <option value="DINHEIRO">Dinheiro em Espécie</option>
                    </select>
                  </div>
                </div>

                {/* Observações da parcela */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Descrição ou Observação da Parcela (opcional)
                  </label>
                  <input
                    type="text"
                    value={obsPagamento}
                    onChange={(e) => setObsPagamento(e.target.value)}
                    placeholder="Ex: 1ª Parcela 50% paga via PIX comprovante anexado"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Opção de avançar status */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkAtualizarStatus"
                    checked={atualizarStatusAposPago}
                    onChange={(e) => setAtualizarStatusAposPago(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="chkAtualizarStatus" className="text-xs text-slate-700 cursor-pointer select-none">
                    Atualizar status do pedido para <b>"Pagamento Confirmado"</b> automaticamente
                  </label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar e Lançar Pagamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Histórico de Transações do Pedido */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-slate-500" />
                Histórico de Pagamentos Lançados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pedido.financialTransactions && pedido.financialTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Descrição</th>
                        <th className="py-2.5 px-3">Forma</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pedido.financialTransactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {formatDate(tx.paymentDate || tx.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {tx.description}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-700">{tx.paymentMethod || "-"}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={tx.status === "PAGO" ? "success" : "warning"}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nenhum pagamento registrado no histórico financeiro ainda.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: UNIFORMES & JOGADORES (COREL DRAW & PLANILHAS) */}
      {/* ========================================================================= */}
      {activeTab === "jogadores" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shirt className="h-5 w-5 text-blue-600" />
                Personalização Individual das Camisas (Seção 6)
              </CardTitle>
              <CardDescription>
                {jogadores.length} {jogadores.length === 1 ? "camisa cadastrada" : "camisas cadastradas"} para esta equipe
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopiarCorelDraw}
                size="sm"
                variant="outline"
                className="text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {copiedVba ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedVba ? "Copiado!" : "Copiar p/ CorelDRAW (VBA)"}
              </Button>

              <Button
                onClick={() => setModalImportar(true)}
                size="sm"
                variant="secondary"
                className="gap-1.5 text-xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Colar Lista
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Alerta de números duplicados */}
            {duplicados.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <b>Atenção:</b> Números repetidos na mesma equipe: <b>Camisa(s) Nº {duplicados.join(", ")}</b>.
                </span>
              </div>
            )}

            {jogadores.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Users className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-600">Nenhum jogador cadastrado nesta equipe</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Cole a lista de nomes e números da planilha do cliente para cadastrar todo o time automaticamente.
                </p>
                <Button onClick={() => setModalImportar(true)} size="sm" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Colar Lista de Jogadores
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-16">#</th>
                      <th className="py-2.5 px-4">Nome nas Costas</th>
                      <th className="py-2.5 px-4">Número</th>
                      <th className="py-2.5 px-4">Tam. Camisa</th>
                      <th className="py-2.5 px-4">Modelo</th>
                      <th className="py-2.5 px-4">Tam. Calção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jogadores.map((j) => {
                      const isDuplicado = duplicados.includes(j.number);

                      return (
                        <tr key={j.id} className={isDuplicado ? "bg-amber-50/40" : "hover:bg-slate-50/50"}>
                          <td className="py-2.5 px-4 font-mono text-xs text-slate-400">{j.playerIndex}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 tracking-wide">{j.name}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                                isDuplicado
                                  ? "bg-amber-200 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {j.number}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-700">{j.size}</td>
                          <td className="py-2.5 px-4">
                            <Badge variant={j.model?.toLowerCase().includes("goleiro") ? "warning" : "secondary"}>
                              {j.model || "Jogador"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">{j.shortSize || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: EXCLUSÃO DO PEDIDO (ZONA DE PERIGO) */}
      {/* ========================================================================= */}
      {activeTab === "excluir" && (
        <Card className="border-rose-300 bg-rose-50/20">
          <CardHeader>
            <CardTitle className="text-base text-rose-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Zona de Perigo: Exclusão Definitiva do Pedido
            </CardTitle>
            <CardDescription className="text-rose-700">
              Esta ação é irreversível. O pedido e todos os uniformes vinculados serão removidos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-rose-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-rose-800">
                Ao excluir o pedido <span className="font-mono">{pedido.orderNumber}</span>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>A lista de {jogadores.length} camisas e jogadores será desfeita.</li>
                <li>A esteira de produção e o histórico de etapas da fábrica serão removidos.</li>
                <li>O link de rastreamento do cliente deixará de existir.</li>
                <li>O evento de exclusão será registrado no log de auditoria do sistema.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="danger"
                onClick={() => setModalExcluirAberto(true)}
                className="gap-2 font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Pedido {pedido.orderNumber}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação Segura de Exclusão */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Confirmar Exclusão do Pedido
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Para confirmar, digite o número do pedido{" "}
              <b className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {pedido.orderNumber}
              </b>{" "}
              abaixo:
            </p>

            <input
              type="text"
              value={confirmarNumeroPedido}
              onChange={(e) => setConfirmarNumeroPedido(e.target.value.toUpperCase())}
              placeholder={pedido.orderNumber}
              className="w-full p-2.5 font-mono text-sm uppercase bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalExcluirAberto(false);
                  setConfirmarNumeroPedido("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={confirmarNumeroPedido !== pedido.orderNumber || isSubmitting}
                onClick={handleExcluirPedido}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Colar Lista (CSV / Planilha) */}
      {modalImportar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Importar Lista de Jogadores
              </h3>
              <button
                type="button"
                onClick={() => setModalImportar(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copie da sua planilha (Excel / Google Sheets) ou do WhatsApp e cole abaixo no formato:
              <b className="block mt-1 font-mono text-[11px] text-slate-700">
                Nome [TAB] Número [TAB] Tamanho [TAB] Modelo
              </b>
            </p>

            <textarea
              rows={8}
              value={textoImportacao}
              onChange={(e) => setTextoImportacao(e.target.value)}
              placeholder="Cole os dados aqui..."
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setModalImportar(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleImportarJogadores}>
                Processar e Salvar Lista
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PedidoDetalhesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
        </div>
      }
    >
      <PedidoDetalhesContent />
    </Suspense>
  );
}

