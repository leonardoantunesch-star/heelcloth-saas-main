"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  AlertCircle,
  Calculator,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ItemRow {
  product: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  model?: string;
  notes?: string;
}

interface ClienteOption {
  id: string;
  name: string;
  whatsapp: string;
}

function NovoPedidoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdUrl = searchParams.get("clienteId") || "";

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>(clienteIdUrl);
  const [deliveryDeadline, setDeliveryDeadline] = useState<string>(
    new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [items, setItems] = useState<ItemRow[]>([
    {
      product: "Camisa Tradicional Jogador",
      quantity: 15,
      unitPrice: 60.0,
      size: "M",
      model: "Tradicional",
    },
  ]);

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
        product: "Camisa Tradicional Goleiro",
        quantity: 2,
        unitPrice: 70.0,
        size: "G",
        model: "Goleiro",
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

  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const pending = Math.max(0, subtotal - (Number(paidAmount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setErrorMessage("Selecione um cliente para vincular ao pedido.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedClienteId,
          deliveryDeadline,
          paymentMethod,
          paidAmount: Number(paidAmount) || 0,
          notes,
          items: items.map((i) => ({
            product: i.product,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            size: i.size || null,
            model: i.model || null,
            notes: i.notes || null,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.erro || "Falha ao criar pedido.");
        setIsLoading(false);
        return;
      }

      router.push(`/admin/pedidos/${data.pedido.id}`);
      router.refresh();
    } catch {
      setErrorMessage("Erro de conexão com o servidor ao cadastrar pedido.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/pedidos">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Pedidos
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Pedido</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre um novo pedido de uniformes esportivos na fábrica.
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cliente & Prazo</span>
              <Link href="/admin/clientes/novo" className="text-xs text-blue-600 hover:underline">
                + Cadastrar Novo Cliente
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Cliente *</label>
                <select
                  required
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.whatsapp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Prazo de Entrega Prometido</label>
                <input
                  type="date"
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Itens do Pedido</CardTitle>
              <CardDescription>Produtos e quantidades que compõem este pedido</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Produto *</label>
                    <input
                      type="text"
                      required
                      value={item.product}
                      onChange={(e) => handleItemChange(idx, "product", e.target.value)}
                      placeholder="Ex: Camisa Tradicional Jogador"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

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

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">Subtotal</label>
                    <div className="h-9 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-900 flex items-center justify-end font-mono">
                      {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pagamento & Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão de Crédito / Débito</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="DINHEIRO">Dinheiro / À Vista</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Observações do Pedido</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações para a confecção, acabamento, entrega..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-blue-600" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total Bruto:</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600 gap-2">
                <span>Valor Pago (Entrada):</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1 text-right bg-white border border-slate-300 rounded-md text-xs font-mono font-medium focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Saldo a Receber:</span>
                <span className="text-xl font-extrabold text-amber-600 font-mono">
                  {formatCurrency(pending)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link href="/admin/pedidos">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            Cadastrar Pedido
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NovoPedidoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
            <p className="text-xs text-slate-400">Carregando formulário de pedido...</p>
          </div>
        </div>
      }
    >
      <NovoPedidoForm />
    </Suspense>
  );
}
