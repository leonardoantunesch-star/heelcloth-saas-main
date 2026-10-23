"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  AlertCircle,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ItemRow {
  product: string;
  quantity: number;
  unitPrice: number;
  details: string;
}

interface ClienteOption {
  id: string;
  name: string;
  whatsapp: string;
}

const sugestoesProdutos = [
  { nome: "Camisa Tradicional Jogador", preco: 59.9 },
  { nome: "Camisa Tradicional Goleiro", preco: 69.9 },
  { nome: "Short / Calção de Jogo", preco: 35.0 },
  { nome: "Meião de Compressão", preco: 22.0 },
  { nome: "Kit Completo (Camisa + Short + Meião)", preco: 110.0 },
  { nome: "Colete de Treino Dupla Face", preco: 28.0 },
  { nome: "Agasalho / Jaqueta de Treino", preco: 140.0 },
];

function NovoOrcamentoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdUrl = searchParams.get("clienteId") || "";

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>(clienteIdUrl);
  const [discount, setDiscount] = useState<number>(0);
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [items, setItems] = useState<ItemRow[]>([
    {
      product: "Kit Completo (Camisa + Short + Meião)",
      quantity: 15,
      unitPrice: 110.0,
      details: "Dry-Fit poliéster com personalização de nome e número",
    },
  ]);

  // Carregar lista de clientes para o seletor
  useEffect(() => {
    fetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso && data.clientes) {
          setClientes(data.clientes);
          if (clienteIdUrl) {
            setSelectedClienteId(clienteIdUrl);
          } else if (data.clientes.length > 0 && !selectedClienteId) {
            setSelectedClienteId(data.clientes[0].id);
          }
        }
      })
      .catch(() => {});
  }, [clienteIdUrl]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: "Camisa Tradicional Jogador",
        quantity: 10,
        unitPrice: 59.9,
        details: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSelectSugestao = (index: number, sug: { nome: string; preco: number }) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product: sug.nome,
        unitPrice: sug.preco,
      };
      return copy;
    });
  };

  // Cálculos de totais
  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const totalFinal = Math.max(0, subtotal - (Number(discount) || 0));
  const totalPecas = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setErrorMessage("Por favor, selecione ou cadastre um cliente.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedClienteId,
          items: items.map((i) => ({
            product: i.product,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            details: i.details,
          })),
          discount: Number(discount) || 0,
          validUntil: validUntil || null,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Erro ao salvar orçamento.");
        setIsLoading(false);
        return;
      }

      router.push(`/admin/orcamentos/${data.orcamento.id}`);
      router.refresh();
    } catch {
      setErrorMessage("Erro de conexão com o servidor ao salvar orçamento.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Nav */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orcamentos">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Orçamentos
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Orçamento</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gere uma proposta comercial detalhada com itens, valores, descontos e validade.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cliente do Orçamento</span>
              <Link href="/admin/clientes/novo" className="text-xs text-blue-600 hover:underline font-normal">
                + Novo Cliente
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Selecione o Cliente *</label>
                <select
                  required
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente cadastrado...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.whatsapp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Validade da Proposta</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Items Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Itens da Proposta</CardTitle>
              <CardDescription>
                Adicione produtos, uniformes e quantidades para compor o orçamento
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              {items.map((item, idx) => {
                const subItem = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Product Name & Quick Presets */}
                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Produto / Peça *</label>
                        <input
                          type="text"
                          required
                          value={item.product}
                          onChange={(e) => handleItemChange(idx, "product", e.target.value)}
                          placeholder="Ex: Camisa Tradicional Jogador"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                        {/* Sugestões rápidas */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sugestoesProdutos.slice(0, 4).map((s) => (
                            <button
                              key={s.nome}
                              type="button"
                              onClick={() => handleSelectSugestao(idx, s)}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 cursor-pointer"
                            >
                              {s.nome.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Qtd *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Preço Unit. (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Line Subtotal */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-500 block">Subtotal</label>
                        <div className="h-9 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-900 flex items-center justify-end font-mono">
                          {formatCurrency(subItem)}
                        </div>
                      </div>

                      {/* Item Details / Notes */}
                      <div className="sm:col-span-12 space-y-1">
                        <label className="text-[11px] font-medium text-slate-500 block">
                          Detalhes técnicos (tecido, modelo de gola, acabamentos especiais)
                        </label>
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) => handleItemChange(idx, "details", e.target.value)}
                          placeholder="Ex: Dry-Fit texturizado, gola V preta com punho elástico..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:border-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Totals & Notes Card */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
          <div className="sm:col-span-7">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Observações da Proposta</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Condições de pagamento (50% de entrada e saldo na entrega), prazo estimado de produção..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </CardContent>
            </Card>
          </div>

          <div className="sm:col-span-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total de Peças:</span>
                  <span className="font-bold text-slate-900">{totalPecas} un.</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600 gap-2">
                  <span>Desconto (R$):</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 text-right bg-white border border-slate-300 rounded-md text-xs font-mono font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total da Proposta:</span>
                  <span className="text-xl font-extrabold text-blue-600 font-mono">
                    {formatCurrency(totalFinal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link href="/admin/orcamentos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            Gerar Orçamento
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NovoOrcamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
            <p className="text-xs text-slate-400">Carregando formulário de orçamento...</p>
          </div>
        </div>
      }
    >
      <NovoOrcamentoForm />
    </Suspense>
  );
}

