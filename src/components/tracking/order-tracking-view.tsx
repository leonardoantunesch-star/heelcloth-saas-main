"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shirt,
  Search,
  CheckCircle2,
  Clock,
  MessageCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

interface Jogador {
  id: string;
  playerIndex: number;
  name: string;
  number: string;
  size: string;
  model: string;
  shortSize?: string | null;
  notes?: string | null;
}

interface Item {
  id: string;
  product: string;
  quantity: number;
  size?: string | null;
  model?: string | null;
}

interface DadosRastreio {
  id: string;
  orderNumber: string;
  status: string;
  etapaNumero: number;
  subEtapaFabril?: string | null;
  statusEtapaProducao?: string | null;
  clienteNome: string;
  createdAt: string;
  prazoEntrega?: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  statusPagamento: "PAGO" | "PARCIAL" | "PENDENTE";
  totalPecas: number;
  qualidadeAprovada: boolean;
  itens: Item[];
  jogadores: Jogador[];
}

// Formatação com privacidade para o nome do cliente
function formatarNomePrivacidade(nomeCompleto?: string | null): string {
  if (!nomeCompleto) return "Cliente";
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  const primeiroNome = partes[0];
  const inicialSobrenome = partes[partes.length - 1][0].toUpperCase();
  return `${primeiroNome} ${inicialSobrenome}.`;
}

export function OrderTrackingView({
  codigoInicial = "",
}: {
  codigoInicial?: string;
}) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [buscaInput, setBuscaInput] = useState(codigoInicial);
  const [loading, setLoading] = useState(Boolean(codigoInicial));
  const [erro, setErro] = useState<string | null>(null);
  const [pedido, setPedido] = useState<DadosRastreio | null>(null);

  const consultarPedido = async (cod: string) => {
    const codLimpo = cod.trim();
    if (!codLimpo) {
      setErro("Informe o código do pedido para consultar.");
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const res = await fetch(`/api/rastreio/${encodeURIComponent(codLimpo)}`);
      const data = await res.json();

      if (res.ok && data.sucesso && data.pedido) {
        setPedido(data.pedido);
        setCodigo(codLimpo);
      } else {
        setPedido(null);
        setErro(
          data.erro ||
            "Pedido não localizado. Confira o código informado e tente novamente."
        );
      }
    } catch (err) {
      console.error("Erro ao buscar rastreamento:", err);
      setPedido(null);
      setErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigoInicial) {
      consultarPedido(codigoInicial);
    }
  }, [codigoInicial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    consultarPedido(buscaInput);
  };

  const formatarMoeda = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return null;
    return new Date(dataStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Os 5 estágios reais do fluxo produtivo
  const etapas = [
    {
      numero: 1,
      titulo: "Orçamento Aprovado",
      desc: "Pedido confirmado e projeto inicializado",
    },
    {
      numero: 2,
      titulo: "Em Produção",
      desc: "Corte, sublimação e confecção das peças",
    },
    {
      numero: 3,
      titulo: "Controle de Qualidade",
      desc: "Inspeção de acabamento e medidas",
    },
    {
      numero: 4,
      titulo: "Pronto para Envio",
      desc: "Embalado para despacho ou retirada",
    },
    {
      numero: 5,
      titulo: "Entregue",
      desc: "Pedido finalizado com sucesso",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121212] flex flex-col justify-between selection:bg-[#49AAB8] selection:text-white">
      {/* ==================================================================== */}
      {/* HEADER BRANCO SIMPLES */}
      {/* ==================================================================== */}
      <header className="w-full border-b border-slate-200/80 bg-white sticky top-0 z-30">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8] rounded-xs"
          >
            <Image
              src="/logo.png"
              alt="Logo Heelcloth"
              width={24}
              height={45}
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#121212] transition-opacity group-hover:opacity-80">
              HEELCLOTH
            </span>
          </Link>

          {/* Botão Discreto de Suporte via WhatsApp */}
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:text-[#121212] hover:bg-slate-50 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8]"
          >
            <MessageCircle className="w-4 h-4 text-[#49AAB8]" />
            <span>Suporte pelo WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* HERO COMPACTO & CAMPO DE BUSCA */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-2xs">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#121212]">
            Acompanhe seu pedido
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Consulte a situação atual da confecção, confira a lista de peças e prazos de entrega em tempo real.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3 max-w-md mx-auto" noValidate>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <label htmlFor="codigo-pedido" className="sr-only">
                  Código do pedido
                </label>
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="codigo-pedido"
                  type="text"
                  value={buscaInput}
                  onChange={(e) => setBuscaInput(e.target.value.toUpperCase())}
                  placeholder="Ex.: HC-2610-0002"
                  className="w-full h-11 pl-10 pr-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-[#121212] font-mono placeholder:font-sans placeholder-slate-400 focus:outline-none focus:border-[#49AAB8] focus-visible:ring-2 focus-visible:ring-[#49AAB8]/20 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !buscaInput.trim()}
                className="min-h-[44px] h-11 px-6 bg-[#49AAB8] hover:bg-[#368D9C] text-white text-xs sm:text-sm font-semibold rounded-xl disabled:opacity-50 transition active:scale-[0.98] shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8]"
              >
                {loading ? "Buscando..." : "Rastrear"}
              </button>
            </div>

            {/* Mensagem de Erro próxima ao campo de rastreio */}
            {erro && !loading && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-left text-red-800 text-xs"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">{erro}</p>
                  <p className="text-[11px] text-red-600/90 mt-0.5">
                    Certifique-se de digitar o código completo do pedido (ex: HC-2610-0002).
                  </p>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#49AAB8] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Consultando status do pedido...</p>
          </div>
        )}

        {/* DETALHES DO PEDIDO LOCALIZADO */}
        {pedido && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            
            {/* 1. RESULTADO DO PEDIDO: FAIXA CLARA E ORGANIZADA */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Código, Status e Nome com Privacidade */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#121212] tracking-tight">
                      {pedido.orderNumber}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {pedido.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Responsável:{" "}
                    <strong className="text-slate-700">
                      {formatarNomePrivacidade(pedido.clienteNome)}
                    </strong>
                  </p>
                </div>

                {/* Métricas: Datas e Quantidade de Peças */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Data do Pedido</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatarData(pedido.createdAt) || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Previsão de Entrega</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#49AAB8]" />
                      {formatarData(pedido.prazoEntrega) || "Sob consulta"}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Total de Peças</span>
                    <span className="font-semibold text-[#121212] flex items-center gap-1.5 mt-0.5">
                      <Shirt className="w-3.5 h-3.5 text-[#49AAB8]" />
                      {pedido.totalPecas} un
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. LINHA DO TEMPO: 5 ESTÁGIOS REAIS (HORIZONTAL DESKTOP / VERTICAL MOBILE) */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#49AAB8]" />
                  Linha do Tempo de Produção
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  Etapa {pedido.etapaNumero} de 5
                </span>
              </div>

              {/* VISUALIZAÇÃO DESKTOP: LINHA HORIZONTAL */}
              <div className="hidden md:block pt-3 pb-2">
                <div className="relative flex items-start justify-between">
                  {/* Linha conectora de fundo cinza claro */}
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 z-0" />

                  {/* Linha conectora ativa azul aqua */}
                  <div
                    className="absolute top-5 left-10 h-0.5 bg-[#49AAB8] z-0 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, ((pedido.etapaNumero - 1) / 4) * 100)
                      )}%`,
                    }}
                  />

                  {etapas.map((etapa) => {
                    const isConcluido = pedido.etapaNumero > etapa.numero;
                    const isAtual = pedido.etapaNumero === etapa.numero;

                    return (
                      <div
                        key={etapa.numero}
                        className="relative z-10 flex flex-col items-center text-center max-w-[170px]"
                      >
                        {/* Indicador do Estágio */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition ${
                            isConcluido
                              ? "bg-[#49AAB8] text-white"
                              : isAtual
                              ? "bg-white text-[#49AAB8] border-2 border-[#49AAB8] ring-4 ring-[#49AAB8]/15"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {isConcluido ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <span>{etapa.numero}</span>
                          )}
                        </div>

                        {/* Textos da Etapa */}
                        <div className="mt-2.5 space-y-0.5">
                          <p
                            className={`text-xs font-bold ${
                              isAtual
                                ? "text-[#121212]"
                                : isConcluido
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {etapa.titulo}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {etapa.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VISUALIZAÇÃO MOBILE: LINHA VERTICAL */}
              <div className="md:hidden space-y-6 relative pl-6 border-l-2 border-slate-200 ml-4 py-1">
                {etapas.map((etapa) => {
                  const isConcluido = pedido.etapaNumero > etapa.numero;
                  const isAtual = pedido.etapaNumero === etapa.numero;

                  return (
                    <div key={etapa.numero} className="relative flex items-start gap-3.5">
                      {/* Marcador alinhado à linha vertical */}
                      <div
                        className={`absolute -left-[37px] w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isConcluido
                            ? "bg-[#49AAB8] text-white"
                            : isAtual
                            ? "bg-white text-[#49AAB8] border-2 border-[#49AAB8] ring-4 ring-[#49AAB8]/15"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isConcluido ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span>{etapa.numero}</span>
                        )}
                      </div>

                      <div className="space-y-0.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs font-bold ${
                              isAtual
                                ? "text-[#121212]"
                                : isConcluido
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {etapa.titulo}
                          </p>
                          {isAtual && (
                            <span className="text-[10px] font-semibold text-[#49AAB8] bg-[#49AAB8]/10 px-2 py-0.5 rounded-full">
                              Etapa atual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {etapa.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detalhe da fase fabril ativa quando o status for "Em Produção" */}
              {pedido.subEtapaFabril && pedido.etapaNumero === 2 && (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Fase em andamento na confecção:{" "}
                    <strong className="text-slate-900">{pedido.subEtapaFabril}</strong>
                  </span>
                  <span className="text-[11px] font-medium text-[#49AAB8] bg-[#49AAB8]/10 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    {pedido.statusEtapaProducao || "Em andamento"}
                  </span>
                </div>
              )}
            </section>

            {/* 3. CONFERÊNCIA DE NOMES E NÚMEROS */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#49AAB8]" />
                    Conferência de Nomes e Números ({pedido.jogadores.length} peças)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifique os nomes, números e tamanhos cadastrados para a produção.
                  </p>
                </div>

                {pedido.qualidadeAprovada && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 self-start sm:self-auto">
                    Aprovado no Controle de Qualidade
                  </span>
                )}
              </div>

              {pedido.jogadores.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    <table className="w-full text-xs text-left text-slate-700 border-collapse">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold font-mono tracking-wider sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center">#</th>
                          <th className="px-4 py-2.5">Nome na Camisa</th>
                          <th className="px-2 py-2.5 w-16 text-center">Nº</th>
                          <th className="px-3 py-2.5 w-24 text-center">Camisa</th>
                          <th className="px-3 py-2.5 w-24 text-center">Short</th>
                          <th className="px-3 py-2.5">Modelo / Tipo</th>
                          <th className="px-3 py-2.5">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {pedido.jogadores.map((jogador) => (
                          <tr
                            key={jogador.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                              {jogador.playerIndex}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-[#121212]">
                              {jogador.name}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                {jogador.number}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-medium text-slate-700">
                              {jogador.size}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-500">
                              {jogador.shortSize || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {jogador.model || "PADRÃO"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 italic text-[11px]">
                              {jogador.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 bg-slate-50/70 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  Este pedido foi registrado com itens padronizados, sem lista individual de nomes e números.
                </div>
              )}
            </section>

            {/* 4. SITUAÇÃO FINANCEIRA & SUPORTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Situação Financeira */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#49AAB8]" />
                    Situação Financeira
                  </h3>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      pedido.statusPagamento === "PAGO"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : pedido.statusPagamento === "PARCIAL"
                        ? "bg-[#49AAB8]/10 text-[#368D9C] border-[#49AAB8]/30"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {pedido.statusPagamento === "PAGO"
                      ? "Quitado"
                      : pedido.statusPagamento === "PARCIAL"
                      ? "Sinal Confirmado"
                      : "Aguardando Pagamento"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Valor total do pedido:</span>
                    <strong className="text-[#121212]">{formatarMoeda(pedido.totalAmount)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Valor pago / sinal:</span>
                    <strong className="text-emerald-700">{formatarMoeda(pedido.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-slate-100 text-xs font-bold">
                    <span className="text-slate-700">Saldo restante na entrega:</span>
                    <span
                      className={
                        pedido.pendingAmount > 0 ? "text-[#121212]" : "text-emerald-700"
                      }
                    >
                      {formatarMoeda(pedido.pendingAmount)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Dúvidas ou Alterações (Suporte WhatsApp) */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#49AAB8]" />
                    Dúvidas ou Alterações?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Precisa alterar algum detalhe antes da confecção ou tirar dúvidas sobre o prazo de entrega? Converse com a nossa equipe informando o código do pedido.
                  </p>
                </div>

                <a
                  href={`https://wa.me/5511999999999?text=${encodeURIComponent(
                    `Olá! Estou acompanhando meu pedido ${pedido.orderNumber} e gostaria de tirar uma dúvida.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#49AAB8] hover:bg-[#368D9C] text-white font-semibold text-xs transition active:scale-[0.98] shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#49AAB8]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Falar sobre o Pedido {pedido.orderNumber}</span>
                </a>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* FOOTER DISCRETO */}
      {/* ==================================================================== */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Heelcloth Sportswear. Confecção especializada sob medida.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#121212] transition">
              Início
            </Link>
            <Link href="/pedido" className="hover:text-[#121212] transition">
              Fazer Pedido
            </Link>
            <Link href="/ajuda" className="hover:text-[#121212] transition">
              Ajuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
