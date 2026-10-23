"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Shirt,
  User,
  Calendar,
  CheckSquare,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

const ETAPAS = [
  { id: "ARTE", nome: "1. Arte", cor: "border-purple-300 bg-purple-50/30" },
  { id: "CORTE", nome: "2. Corte", cor: "border-blue-300 bg-blue-50/30" },
  { id: "PERSONALIZACAO", nome: "3. Personalização", cor: "border-indigo-300 bg-indigo-50/30" },
  { id: "COSTURA", nome: "4. Costura", cor: "border-amber-300 bg-amber-50/30" },
  { id: "ESTAMPA", nome: "5. Estampa", cor: "border-orange-300 bg-orange-50/30" },
  { id: "ACABAMENTO", nome: "6. Acabamento", cor: "border-teal-300 bg-teal-50/30" },
  { id: "CONTROLE_QUALIDADE", nome: "7. Qualidade", cor: "border-cyan-300 bg-cyan-50/30" },
  { id: "PRONTO", nome: "8. Pronto", cor: "border-emerald-300 bg-emerald-50/30" },
];

export default function ProducaoPage() {
  const [dados, setDados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [etapaFiltro, setEtapaFiltro] = useState<string>("");
  const [avancandoId, setAvancandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string>("");

  const carregarProducao = () => {
    setIsLoading(true);
    fetch("/api/producao")
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setDados(data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    carregarProducao();
  }, []);

  // Avançar para a próxima etapa na esteira
  const handleAvancarEtapa = async (orderId: string, etapaAtual: string) => {
    const currentIndex = ETAPAS.findIndex((e) => e.id === etapaAtual);
    if (currentIndex === -1 || currentIndex >= ETAPAS.length - 1) return;

    const proximaEtapa = ETAPAS[currentIndex + 1].id;

    setAvancandoId(orderId);
    setMensagem("");

    try {
      const res = await fetch(`/api/producao/${orderId}/etapa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaEtapa: proximaEtapa }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requerQualidade) {
          alert(`Bloqueio de Qualidade (Seção 11):\n${data.erro}\n\nVocê será redirecionado para a conferência de qualidade.`);
          window.location.href = `/admin/producao/${orderId}/qualidade`;
          return;
        }
        alert(data.erro || "Falha ao avançar etapa.");
        setAvancandoId(null);
        return;
      }

      setMensagem(data.mensagem);
      carregarProducao();
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setAvancandoId(null);
    }
  };

  const pedidos = dados?.pedidos || [];
  const contadores = dados?.contadoresPorEtapa || {};
  const pedidosFiltrados = etapaFiltro
    ? pedidos.filter((p: any) => p.etapaAtual === etapaFiltro)
    : pedidos;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Esteira de Produção
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Acompanhe as 8 etapas da confecção de uniformes, prazos por setor e pedidos em atraso.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={carregarProducao} className="text-xs w-full sm:w-auto justify-center">
            Atualizar Esteira
          </Button>
        </div>
      </div>

      {mensagem && (
        <Alert variant="success" onClose={() => setMensagem("")}>
          {mensagem}
        </Alert>
      )}

      {/* Top Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Na Linha de Produção</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{dados?.totalEmProducao || 0}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={dados?.totalAtrasados > 0 ? "border-rose-300 ring-1 ring-rose-300 bg-rose-50/20" : ""}>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Em Atraso</span>
              <div className={`text-xl sm:text-2xl font-bold mt-1 ${dados?.totalAtrasados > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {dados?.totalAtrasados || 0}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Aguardando Qualidade</span>
              <div className="text-xl sm:text-2xl font-bold text-cyan-700 mt-1">
                {contadores["CONTROLE_QUALIDADE"] || 0}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Stepper Tabs with horizontal scroll */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => setEtapaFiltro("")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              etapaFiltro === ""
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Todas as Etapas ({pedidos.length})
          </button>
          {ETAPAS.map((et) => {
            const count = contadores[et.id] || 0;
            const isSelected = etapaFiltro === et.id;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setEtapaFiltro(et.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                }`}
              >
                <span>{et.nome}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pipeline Grid View */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
            <p className="text-xs text-slate-400">Carregando esteira produtiva...</p>
          </div>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum pedido nesta etapa"
          description="Todos os pedidos foram avançados ou estão distribuídos em outros setores da confecção."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosFiltrados.map((p: any) => {
            const currentIndex = ETAPAS.findIndex((e) => e.id === p.etapaAtual);
            const proximaEtapa = currentIndex < ETAPAS.length - 1 ? ETAPAS[currentIndex + 1] : null;

            return (
              <Card
                key={p.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  p.isAtrasado ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/10" : ""
                )}
              >
                {/* Red stripe if delayed */}
                {p.isAtrasado && (
                  <div className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 text-center">
                    Pedido em Atraso — Atenção Fábrica
                  </div>
                )}

                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/pedidos/${p.id}`}
                        className="font-bold text-base text-slate-900 hover:text-blue-600 font-mono transition-colors"
                      >
                        {p.numero}
                      </Link>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">{p.cliente}</div>
                    </div>
                    <Badge variant={p.isAtrasado ? "danger" : "info"}>
                      {ETAPAS.find((e) => e.id === p.etapaAtual)?.nome || p.etapaAtual}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 bg-slate-50/50 -mx-4 sm:-mx-5 px-4 sm:px-5">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Uniformes:</span>
                      <span className="font-semibold text-slate-800">{p.totalCamisas} peças</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Prazo:</span>
                      <span className={`font-semibold ${p.isAtrasado ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                        {p.prazo ? formatDate(p.prazo) : "Não definido"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Responsável: <b>{p.responsavel}</b></span>
                    </div>
                    {p.notas && (
                      <p className="text-[11px] text-slate-500 italic truncate">
                        "{p.notas}"
                      </p>
                    )}
                  </div>

                  {/* Actions according to stage */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <Link href={`/admin/pedidos/${p.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-8 px-2">
                        Ver Pedido
                      </Button>
                    </Link>

                    {p.etapaAtual === "CONTROLE_QUALIDADE" ? (
                      <Link href={`/admin/producao/${p.id}/qualidade`}>
                        <Button
                          size="sm"
                          className="text-xs h-8 gap-1.5 bg-cyan-700 hover:bg-cyan-800 text-white"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          Conferir Qualidade
                        </Button>
                      </Link>
                    ) : proximaEtapa ? (
                      <Button
                        size="sm"
                        onClick={() => handleAvancarEtapa(p.id, p.etapaAtual)}
                        isLoading={avancandoId === p.id}
                        className="text-xs h-8 gap-1"
                      >
                        Avançar p/ {proximaEtapa.nome.split(" ")[1]}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Badge variant="success" className="h-7 text-xs">
                        Pronto para Entrega
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
