"use client";

import React, { useMemo, useState } from "react";
import { Check, Megaphone, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { diasAte, textoPrazo } from "@/lib/painel-dados";
import type { Campanha } from "@/lib/campanhas";

function novoId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

const dataCurta = (iso: string) => iso.split("-").reverse().join("/");

// "Campanhas ativas": lista de campanhas (Black Friday, promoções...) com data final, que a equipe cadastra.
export function CampanhasAtivas({ iniciais, podeEditar, hoje }: { iniciais: Campanha[]; podeEditar: boolean; hoje: string }) {
  const [lista, setLista] = useState<Campanha[]>(iniciais);
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [verConcluidas, setVerConcluidas] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const [a, m, d] = hoje.split("-").map(Number);
  const hojeData = useMemo(() => new Date(a, m - 1, d), [a, m, d]);

  const ativas = useMemo(() => lista.filter((c) => !c.concluida).sort((x, y) => x.data.localeCompare(y.data)), [lista]);
  const concluidas = useMemo(() => lista.filter((c) => c.concluida).sort((x, y) => y.data.localeCompare(x.data)), [lista]);

  async function gravar(nova: Campanha[]): Promise<boolean> {
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch("/api/campanhas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campanhas: nova }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(j.erro || "Não foi possível salvar.");
        return false;
      }
      setLista(j.campanhas as Campanha[]);
      return true;
    } catch {
      setErro("Sem conexão. Tente de novo.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 2) return setErro("Dê um nome à campanha.");
    if (!data) return setErro("Escolha a data final da campanha.");
    if (await gravar([...lista, { id: novoId(), nome: nome.trim(), data, concluida: false }])) {
      setNome("");
      setData("");
      setFormAberto(false);
    }
  }

  const alterar = (id: string, mudanca: Partial<Campanha>) => gravar(lista.map((c) => (c.id === id ? { ...c, ...mudanca } : c)));
  const excluir = async (id: string) => {
    if (await gravar(lista.filter((c) => c.id !== id))) setExcluindo(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base sm:text-lg">Campanhas ativas</CardTitle>
          <CardDescription className="text-xs">Promoções e ações de divulgação, com a data final de cada uma</CardDescription>
        </div>
        {podeEditar && (
          <Button size="sm" variant={formAberto ? "ghost" : "outline"} className="shrink-0 gap-1.5" onClick={() => { setFormAberto((v) => !v); setErro(""); }}>
            {formAberto ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {formAberto ? "Fechar" : "Nova"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-1">
        {formAberto && (
          <form onSubmit={adicionar} className="mb-4 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <label className="block text-xs font-medium text-slate-600">
              Nome da campanha
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={80}
                placeholder="Ex.: Black Friday"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Data final
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <Button type="submit" size="sm" isLoading={salvando} className="w-full">
              Adicionar campanha
            </Button>
          </form>
        )}

        {erro && (
          <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {erro}
          </p>
        )}

        {ativas.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
            <Megaphone className="h-6 w-6 text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Nenhuma campanha ativa</p>
            <p className="mt-0.5 text-xs text-slate-500">{podeEditar ? "Clique em Nova para cadastrar a primeira." : "Quem vende ou administra pode cadastrar."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ativas.map((c) => {
              const dias = diasAte(c.data, hojeData);
              return (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.nome}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Até {dataCurta(c.data)}</p>
                  </div>
                  <Badge variant={dias < 0 ? "danger" : dias <= 3 ? "warning" : "info"} className="shrink-0">
                    {textoPrazo(dias)}
                  </Badge>
                  {podeEditar &&
                    (excluindo === c.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button size="sm" variant="danger" disabled={salvando} onClick={() => excluir(c.id)}>Excluir</Button>
                        <Button size="sm" variant="ghost" onClick={() => setExcluindo(null)}>Não</Button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center">
                        <button type="button" disabled={salvando} onClick={() => alterar(c.id, { concluida: true })} title="Marcar como concluída" aria-label={`Concluir ${c.nome}`} className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={salvando} onClick={() => setExcluindo(c.id)} title="Excluir" aria-label={`Excluir ${c.nome}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </li>
              );
            })}
          </ul>
        )}

        {concluidas.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => setVerConcluidas((v) => !v)} aria-expanded={verConcluidas} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
              {verConcluidas ? "Esconder" : "Ver"} concluídas ({concluidas.length})
            </button>
            {verConcluidas && (
              <ul className="mt-2 space-y-1.5">
                {concluidas.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-xs text-slate-500">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate line-through">{c.nome}</span>
                    <span className="shrink-0">{dataCurta(c.data)}</span>
                    {podeEditar && (
                      <button type="button" disabled={salvando} onClick={() => alterar(c.id, { concluida: false })} title="Reabrir" aria-label={`Reabrir ${c.nome}`} className="shrink-0 rounded p-1 hover:bg-slate-100 hover:text-slate-800">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
