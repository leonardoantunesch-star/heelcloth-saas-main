"use client";

import React, { useEffect, useState } from "react";
import {
  Boxes,
  Package,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  Clock,
  Layers,
  Scissors,
  X,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORIAS = [
  { id: "TODOS", label: "Todos os Itens" },
  { id: "TECIDO", label: "Tecidos" },
  { id: "MATERIAL", label: "Materiais & Aviamentos" },
  { id: "EMBALAGEM", label: "Embalagens" },
  { id: "PRODUTO", label: "Produtos Prontos" },
  { id: "OUTRO", label: "Outros" },
];

export default function EstoquePage() {
  const [itens, setItens] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("TODOS");
  const [apenasBaixo, setApenasBaixo] = useState(false);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalMovAberto, setModalMovAberto] = useState(false);
  const [modalHistAberto, setModalHistAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [historicoMovimentos, setHistoricoMovimentos] = useState<any[]>([]);

  // Formulário Novo Item
  const [novoItem, setNovoItem] = useState({
    name: "",
    category: "TECIDO",
    unit: "METRO",
    quantity: 0,
    minQuantity: 20,
    cost: 0,
    supplier: "",
  });

  // Formulário Movimentação
  const [movimento, setMovimento] = useState({
    type: "ENTRADA" as "ENTRADA" | "SAIDA" | "AJUSTE",
    quantity: 1,
    reason: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const carregarEstoque = () => {
    setIsLoading(true);
    let url = `/api/estoque?categoria=${categoriaAtiva}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;
    if (apenasBaixo) url += `&baixoEstoque=true`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setItens(data.itens);
          setMetricas(data.metricas);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    carregarEstoque();
  }, [categoriaAtiva, apenasBaixo]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarEstoque();
  };

  const handleCriarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoItem),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagemErro(data.erro || "Falha ao cadastrar item");
        setIsSubmitting(false);
        return;
      }

      setMensagemSucesso("Item cadastrado no estoque com sucesso!");
      setModalNovoAberto(false);
      setNovoItem({
        name: "",
        category: "TECIDO",
        unit: "METRO",
        quantity: 0,
        minQuantity: 20,
        cost: 0,
        supplier: "",
      });
      carregarEstoque();
    } catch {
      setMensagemErro("Erro ao conectar com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrirMovimentacao = (item: any, tipoDefault: "ENTRADA" | "SAIDA" | "AJUSTE" = "ENTRADA") => {
    setItemSelecionado(item);
    setMovimento({
      type: tipoDefault,
      quantity: 1,
      reason: tipoDefault === "ENTRADA" ? "Recebimento de fornecedor" : tipoDefault === "SAIDA" ? "Consumo na produção" : "Ajuste de inventário",
    });
    setModalMovAberto(true);
  };

  const handleSalvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSelecionado) return;

    setIsSubmitting(true);
    setMensagemSucesso("");
    setMensagemErro("");

    try {
      const res = await fetch(`/api/estoque/${itemSelecionado.id}/movimentacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movimento),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagemErro(data.erro || "Erro ao registrar movimentação");
        setIsSubmitting(false);
        return;
      }

      setMensagemSucesso(data.mensagem);
      setModalMovAberto(false);
      carregarEstoque();
    } catch {
      setMensagemErro("Erro ao registrar movimentação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerHistorico = async (item: any) => {
    setItemSelecionado(item);
    setModalHistAberto(true);
    try {
      const res = await fetch(`/api/estoque/${item.id}`);
      const data = await res.json();
      if (data.sucesso) {
        setHistoricoMovimentos(data.item.movements || []);
      }
    } catch {
      console.error("Erro ao carregar histórico");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Boxes className="h-6 w-6 text-blue-600" />
            Controle de Estoque & Matéria-Prima
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão de tecidos, aviamentos, embalagens e alerta de nível crítico de confecção.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => setModalNovoAberto(true)} className="w-full sm:w-auto justify-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Novo Insumo</span>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <Alert variant="success" onClose={() => setMensagemSucesso("")}>
          {mensagemSucesso}
        </Alert>
      )}

      {mensagemErro && (
        <Alert variant="danger" onClose={() => setMensagemErro("")}>
          {mensagemErro}
        </Alert>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Total Insumos</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {metricas?.totalItens ?? "-"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">Cadastrados no catálogo</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Valor em Estoque</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {metricas ? formatCurrency(metricas.totalValorEstoque) : "-"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">Custo acumulado</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setApenasBaixo(!apenasBaixo)}
          className={`col-span-2 lg:col-span-1 cursor-pointer transition-all ${
            apenasBaixo
              ? "border-rose-400 bg-rose-50/40 ring-2 ring-rose-300"
              : metricas?.totalItensCriticos > 0
              ? "border-amber-300 hover:border-amber-400"
              : ""
          }`}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold uppercase text-slate-500">Nível Crítico</p>
                {apenasBaixo && (
                  <Badge variant="danger" className="text-[10px] py-0 px-1">
                    Filtrado
                  </Badge>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
                {metricas?.totalItensCriticos ?? 0}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {metricas?.totalItensCriticos > 0
                  ? "Itens abaixo do mínimo!"
                  : "Todos os insumos regulares"}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card>
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Abas de Categoria */}
            <div className="flex overflow-x-auto gap-1.5 w-full sm:w-auto pb-1 sm:pb-0">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    categoriaAtiva === cat.id
                      ? "bg-blue-600 text-white shadow-2xs font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Busca Textual */}
            <form onSubmit={handleBuscar} className="flex gap-2 w-full sm:w-72">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar tecido, insumo..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-500 bg-white"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Filtrar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Insumos */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Inventário de Matéria-Prima ({itens.length} itens)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Monitore saldos físicos, custos médios e acione reposições
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : itens.length === 0 ? (
            <EmptyState
              title="Nenhum insumo encontrado"
              description="Não há itens com os filtros selecionados."
              action={
                <Button size="sm" onClick={() => setModalNovoAberto(true)}>
                  Cadastrar Insumo
                </Button>
              }
            />
          ) : (
            <>
              {/* 1. Mobile Cards (< 768px) */}
              <div className="md:hidden divide-y divide-slate-100 p-3">
                {itens.map((item) => (
                  <div key={item.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.category}
                          </Badge>
                          {item.supplier && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {item.supplier}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.isBaixoEstoque ? (
                        <Badge variant="danger" className="text-[10px]">
                          CRÍTICO
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          REGULAR
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Saldo Físico:</span>
                        <span className={`font-bold text-sm ${item.isBaixoEstoque ? "text-rose-600" : "text-slate-900"}`}>
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Mín: {item.minQuantity} {item.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Custo / Total:</span>
                        <span className="font-bold text-slate-900 text-xs block">
                          {formatCurrency(item.valorTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500">Unit: {formatCurrency(item.cost)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirMovimentacao(item, "ENTRADA")}
                        className="flex-1 text-xs h-8 text-emerald-700 border-emerald-300"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        Entrada
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirMovimentacao(item, "SAIDA")}
                        className="flex-1 text-xs h-8 text-rose-700 border-rose-300"
                      >
                        <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                        Saída
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerHistorico(item)}
                        className="h-8 px-2 text-xs"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <th className="p-3.5">Insumo / Tecido</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5 text-center">Saldo Atual</th>
                      <th className="p-3.5 text-center">Estoque Mínimo</th>
                      <th className="p-3.5 text-right">Custo Unitário</th>
                      <th className="p-3.5 text-right">Valor Total</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          {item.supplier && (
                            <span className="text-[11px] text-slate-500 block">
                              Fornecedor: {item.supplier}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`font-black text-sm ${
                              item.isBaixoEstoque ? "text-rose-600" : "text-slate-900"
                            }`}
                          >
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-slate-500">
                          {item.minQuantity} {item.unit}
                        </td>
                        <td className="p-3.5 text-right text-slate-700 font-medium">
                          {formatCurrency(item.cost)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(item.valorTotal)}
                        </td>
                        <td className="p-3.5 text-center">
                          {item.isBaixoEstoque ? (
                            <Badge variant="danger" className="text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              CRÍTICO
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              REGULAR
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirMovimentacao(item, "ENTRADA")}
                              className="h-7 px-2 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              title="Entrada de insumo"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                              Entrada
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirMovimentacao(item, "SAIDA")}
                              className="h-7 px-2 text-[11px] text-rose-700 border-rose-300 hover:bg-rose-50"
                              title="Saída para produção"
                            >
                              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                              Saída
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerHistorico(item)}
                              className="h-7 px-2 text-[11px]"
                              title="Ver histórico de movimentações"
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
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

      {/* Modal: Novo Insumo */}
      <Modal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        title="Cadastrar Novo Insumo / Tecido"
        maxWidth="lg"
      >
        <form onSubmit={handleCriarItem} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nome do Insumo *
            </label>
            <input
              type="text"
              required
              value={novoItem.name}
              onChange={(e) => setNovoItem({ ...novoItem, name: e.target.value })}
              placeholder="Ex: Tecido Dry-Fit Colmeia Branco"
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
              <select
                value={novoItem.category}
                onChange={(e) => setNovoItem({ ...novoItem, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden bg-white"
              >
                <option value="TECIDO">Tecido</option>
                <option value="MATERIAL">Material / Aviamento</option>
                <option value="EMBALAGEM">Embalagem</option>
                <option value="PRODUTO">Produto Pronto</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unidade *</label>
              <select
                value={novoItem.unit}
                onChange={(e) => setNovoItem({ ...novoItem, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden bg-white"
              >
                <option value="METRO">Metro (m)</option>
                <option value="KG">Quilo (kg)</option>
                <option value="UNIDADE">Unidade (un)</option>
                <option value="ROLO">Rolo</option>
                <option value="PACOTE">Pacote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Saldo Inicial
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={novoItem.quantity}
                onChange={(e) =>
                  setNovoItem({ ...novoItem, quantity: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estoque Mínimo *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={novoItem.minQuantity}
                onChange={(e) =>
                  setNovoItem({ ...novoItem, minQuantity: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Custo Unit. (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={novoItem.cost}
                onChange={(e) =>
                  setNovoItem({ ...novoItem, cost: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fornecedor</label>
            <input
              type="text"
              value={novoItem.supplier}
              onChange={(e) => setNovoItem({ ...novoItem, supplier: e.target.value })}
              placeholder="Ex: Têxtil Santa Catarina Ltda"
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Salvar Insumo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registrar Movimentação */}
      {itemSelecionado && (
        <Modal
          isOpen={modalMovAberto}
          onClose={() => setModalMovAberto(false)}
          title={`Movimentar Estoque — ${itemSelecionado.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSalvarMovimentacao} className="space-y-3.5 text-xs">
            <div className="flex rounded-xl border p-1 bg-slate-100 gap-1">
              {(["ENTRADA", "SAIDA", "AJUSTE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMovimento({ ...movimento, type: t })}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-colors cursor-pointer ${
                    movimento.type === t
                      ? t === "ENTRADA"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : t === "SAIDA"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantidade ({itemSelecionado.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={movimento.quantity}
                onChange={(e) =>
                  setMovimento({ ...movimento, quantity: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Saldo atual: <strong>{itemSelecionado.quantity} {itemSelecionado.unit}</strong> |
                Projeção:{" "}
                <strong>
                  {movimento.type === "ENTRADA"
                    ? itemSelecionado.quantity + movimento.quantity
                    : movimento.type === "SAIDA"
                    ? Math.max(0, itemSelecionado.quantity - movimento.quantity)
                    : movimento.quantity}{" "}
                  {itemSelecionado.unit}
                </strong>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Motivo / Observação *
              </label>
              <textarea
                required
                rows={2}
                value={movimento.reason}
                onChange={(e) => setMovimento({ ...movimento, reason: e.target.value })}
                placeholder="Ex: Compra NF 1234, Consumo no pedido HC-2603-0001, etc."
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalMovAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Confirmar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Histórico de Movimentações */}
      {itemSelecionado && (
        <Modal
          isOpen={modalHistAberto}
          onClose={() => setModalHistAberto(false)}
          title={`Histórico — ${itemSelecionado.name}`}
          maxWidth="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setModalHistAberto(false)}>
              Fechar
            </Button>
          }
        >
          <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
            {historicoMovimentos.length === 0 ? (
              <p className="text-slate-500 text-center py-6">
                Nenhuma movimentação registrada para este insumo.
              </p>
            ) : (
              historicoMovimentos.map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          mov.type === "ENTRADA"
                            ? "success"
                            : mov.type === "SAIDA"
                            ? "danger"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {mov.type}
                      </Badge>
                      <span className="font-bold text-slate-900">
                        {mov.type === "ENTRADA" ? "+" : mov.type === "SAIDA" ? "-" : "="}
                        {mov.quantity} {itemSelecionado.unit}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({mov.previousQty} → {mov.newQty})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{mov.reason}</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <span>{formatDate(mov.createdAt)}</span>
                    {mov.user && <span className="block font-medium">{mov.user.name}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
