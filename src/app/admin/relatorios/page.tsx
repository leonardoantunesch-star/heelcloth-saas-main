"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  Download,
  Calendar,
  Users,
  Shirt,
  Filter,
  RefreshCw,
  Percent,
  Clock,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface MetricasBI {
  kpis: {
    faturamentoTotal: number;
    valorTotalPedidos: number;
    ticketMedio: number;
    totalPedidos: number;
    pedidosConcluidos: number;
    totalPecas: number;
    receitaTotal: number;
    despesaTotal: number;
    lucroLiquido: number;
    margemLucro: number;
    totalOrcamentos: number;
    orcamentosConvertidos: number;
    taxaConversaoOrcamento: number;
    totalInspecionados: number;
    totalAprovados: number;
    taxaQualidade: number;
  };
  rankingClientes: Array<{
    id: string;
    nome: string;
    pedidos: number;
    totalGasto: number;
    pecas: number;
  }>;
  rankingProdutos: Array<{
    nome: string;
    quantidade: number;
    receita: number;
  }>;
  etapasProducao: Record<string, number>;
  serieVendas: Array<{
    data: string;
    total: number;
    pedidos: number;
  }>;
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<string>("mes");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [dados, setDados] = useState<MetricasBI | null>(null);
  const [labelPeriodo, setLabelPeriodo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modalExportar, setModalExportar] = useState(false);
  const [tipoExportacao, setTipoExportacao] = useState<string>("vendas");

  const carregarRelatorio = async () => {
    try {
      setLoading(true);
      let url = `/api/relatorios?periodo=${periodo}`;
      if (periodo === "personalizado" && dataInicio && dataFim) {
        url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.sucesso) {
        setDados(json);
        setLabelPeriodo(json.periodo?.label || "");
      }
    } catch (err) {
      console.error("Erro ao carregar dados de BI:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRelatorio();
  }, [periodo]);

  const handleExportarCsv = () => {
    let url = `/api/relatorios/exportar?tipo=${tipoExportacao}&periodo=${periodo}`;
    if (periodo === "personalizado" && dataInicio && dataFim) {
      url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
    }
    window.open(url, "_blank");
    setModalExportar(false);
  };

  const formatarMoeda = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Relatórios & Business Intelligence
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Métricas de desempenho comercial, esteira produtiva e indicadores operacionais da fábrica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalExportar(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Exportar CSV
          </button>
          <button
            onClick={carregarRelatorio}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Período:
          </span>
          {[
            { id: "hoje", label: "Hoje" },
            { id: "semana", label: "Últimos 7 dias" },
            { id: "mes", label: "Este Mês" },
            { id: "ano", label: "Este Ano" },
            { id: "personalizado", label: "Personalizado" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodo(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                periodo === item.id
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {periodo === "personalizado" && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
            <button
              onClick={carregarRelatorio}
              className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Filtrar
            </button>
          </div>
        )}

        <div className="text-xs text-slate-500 font-medium ml-auto">
          Exibindo: <strong className="text-slate-800">{labelPeriodo || "..."}</strong>
        </div>
      </div>

      {/* Grid de KPIs Principais (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Faturamento */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Faturamento Pago</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {formatarMoeda(dados?.kpis.faturamentoTotal || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Total bruto: {formatarMoeda(dados?.kpis.valorTotalPedidos || 0)}
          </p>
        </div>

        {/* KPI 2: Lucro Líquido & Margem */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Lucro Líquido</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-indigo-600">
            {formatarMoeda(dados?.kpis.lucroLiquido || 0)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <span>Margem: {dados?.kpis.margemLucro || 0}%</span>
          </div>
        </div>

        {/* KPI 3: Volume de Vendas */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total de Pedidos</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {dados?.kpis.totalPedidos || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {dados?.kpis.pedidosConcluidos || 0} finalizados
          </p>
        </div>

        {/* KPI 4: Total de Peças */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Peças Fabricadas</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Shirt className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {dados?.kpis.totalPecas || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Camisas e calções</p>
        </div>

        {/* KPI 5: Ticket Médio */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Ticket Médio</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {formatarMoeda(dados?.kpis.ticketMedio || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Por pedido emitido</p>
        </div>

        {/* KPI 6: Conversão e Qualidade */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Controle Qualidade</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-teal-700">
            {dados?.kpis.taxaQualidade || 100}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Conv. Orçamento: {dados?.kpis.taxaConversaoOrcamento || 0}%
          </p>
        </div>
      </div>

      {/* Seção 2: Eficiência da Esteira de Produção */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Fluxo da Esteira de Produção (8 Etapas)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Tempo real</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { id: "ARTE", label: "Arte / Layout", cor: "bg-blue-500" },
            { id: "CORTE", label: "Corte", cor: "bg-cyan-500" },
            { id: "PERSONALIZACAO", label: "Personalização", cor: "bg-indigo-500" },
            { id: "COSTURA", label: "Costura", cor: "bg-violet-500" },
            { id: "ESTAMPA", label: "Estampa", cor: "bg-purple-500" },
            { id: "ACABAMENTO", label: "Acabamento", cor: "bg-amber-500" },
            { id: "CONTROLE_QUALIDADE", label: "Qualidade", cor: "bg-emerald-500" },
            { id: "PRONTO", label: "Pronto", cor: "bg-emerald-700" },
          ].map((etapa) => {
            const count = dados?.etapasProducao[etapa.id] || 0;
            return (
              <div
                key={etapa.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center relative overflow-hidden flex flex-col justify-between"
              >
                <div className={`h-1 w-full absolute top-0 left-0 ${etapa.cor}`} />
                <p className="text-[11px] font-semibold text-slate-600 truncate mt-1">
                  {etapa.label}
                </p>
                <p className="text-xl font-bold text-slate-900 mt-2">{count}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">pedidos</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 3: Tabelas Analíticas Lado a Lado (Top Clientes & Top Produtos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela: Top 10 Clientes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Top 10 Maiores Clientes
              </h3>
            </div>
            <span className="text-xs text-slate-400">Por volume faturado</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5 text-center">Pedidos</th>
                  <th className="px-4 py-2.5 text-center">Peças</th>
                  <th className="px-4 py-2.5 text-right">Total Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados?.rankingClientes && dados.rankingClientes.length > 0 ? (
                  dados.rankingClientes.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[180px]">{c.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-slate-700">
                        {c.pedidos}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500">
                        {c.pecas}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                        {formatarMoeda(c.totalGasto)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      Nenhum pedido registrado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela: Top Produtos Mais Vendidos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Mix de Produtos Mais Vendidos
              </h3>
            </div>
            <span className="text-xs text-slate-400">Unidades & Receita</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Produto / Item</th>
                  <th className="px-4 py-2.5 text-center">Unidades</th>
                  <th className="px-4 py-2.5 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados?.rankingProdutos && dados.rankingProdutos.length > 0 ? (
                  dados.rankingProdutos.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[200px]">{p.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-indigo-700">
                        {p.quantidade} un
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                        {formatarMoeda(p.receita)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      Nenhum item comercializado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Exportação de Relatórios CSV */}
      {modalExportar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Download className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Exportar Relatório CSV
                </h3>
              </div>
              <button
                onClick={() => setModalExportar(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Selecione o Tipo de Relatório:
                </label>
                <div className="space-y-2">
                  {[
                    { id: "vendas", label: "Relatório de Vendas & Pedidos", desc: "Pedidos, clientes, valores, status e peças" },
                    { id: "financeiro", label: "Relatório Financeiro & DRE", desc: "Receitas, despesas, categorias e pagamentos" },
                    { id: "producao", label: "Relatório da Linha de Produção", desc: "Etapas ativas, responsáveis e status" },
                    { id: "clientes", label: "Relatório da Carteira de Clientes", desc: "Contatos, histórico de compras e faturamento" },
                  ].map((opcao) => (
                    <label
                      key={opcao.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        tipoExportacao === opcao.id
                          ? "border-indigo-600 bg-indigo-50/60"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoExportacao"
                        value={opcao.id}
                        checked={tipoExportacao === opcao.id}
                        onChange={(e) => setTipoExportacao(e.target.value)}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{opcao.label}</p>
                        <p className="text-[11px] text-slate-500">{opcao.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                O arquivo será baixado com codificação UTF-8 e compatibilidade total com Excel e Google Planilhas.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalExportar(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportarCsv}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Baixar Planilha CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
