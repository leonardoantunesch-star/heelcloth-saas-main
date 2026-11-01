"use client";

import React, { useState } from "react";
import { KeyRound, Plus, UserCheck, UserX, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PERFIL_INFO, PERFIS, areasDoPerfil, type Perfil } from "@/lib/permissoes";

export interface PessoaEquipe {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const campo =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const nomePerfil = (r: string) => PERFIL_INFO[r as Perfil]?.nome ?? r;

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "?") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

// Gestão de quem tem login: criar acesso, trocar perfil, ativar/desativar e redefinir senha.
export function EquipeGerenciar({ iniciais: inicial, meuId }: { iniciais: PessoaEquipe[]; meuId: string }) {
  const [pessoas, setPessoas] = useState<PessoaEquipe[]>(inicial);
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("VENDEDOR");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [senhaDe, setSenhaDe] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  async function chamar(url: string, metodo: "POST" | "PATCH", corpo: unknown): Promise<PessoaEquipe | null> {
    setErro("");
    setAviso("");
    try {
      const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(j.erro || "Não foi possível salvar.");
        return null;
      }
      return j.pessoa as PessoaEquipe;
    } catch {
      setErro("Sem conexão. Tente de novo.");
      return null;
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado("novo");
    const p = await chamar("/api/equipe", "POST", { name: nome, email, role: perfil, password: senha });
    setOcupado(null);
    if (!p) return;
    setPessoas((l) => [...l, p].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "pt-BR")));
    setNome("");
    setEmail("");
    setSenha("");
    setPerfil("VENDEDOR");
    setFormAberto(false);
    setAviso(`Acesso criado para ${p.name}. Passe o e-mail e a senha para a pessoa entrar.`);
  }

  async function alterar(id: string, mudanca: { role?: string; active?: boolean; password?: string }, ok: string) {
    setOcupado(id);
    const p = await chamar(`/api/equipe/${id}`, "PATCH", mudanca);
    setOcupado(null);
    if (!p) return false;
    setPessoas((l) => l.map((x) => (x.id === id ? p : x)));
    setAviso(ok);
    return true;
  }

  async function trocarSenha(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (await alterar(id, { password: novaSenha }, "Senha redefinida. A pessoa usa a nova senha no próximo login.")) {
      setSenhaDe(null);
      setNovaSenha("");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base sm:text-lg">Pessoas com acesso</CardTitle>
          <CardDescription className="text-xs">Quem entra no painel e o que cada perfil enxerga. Mudanças valem no próximo login da pessoa.</CardDescription>
        </div>
        <Button size="sm" variant={formAberto ? "ghost" : "default"} className="shrink-0 gap-1.5" onClick={() => { setFormAberto((v) => !v); setErro(""); }}>
          {formAberto ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {formAberto ? "Fechar" : "Novo acesso"}
        </Button>
      </CardHeader>
      <CardContent className="pt-1">
        {formAberto && (
          <form onSubmit={criar} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              Nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required className={campo} />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              E-mail de login
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} required autoComplete="off" className={campo} />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Perfil de acesso
              <select value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)} className={campo}>
                {PERFIS.map((p) => (
                  <option key={p} value={p}>{PERFIL_INFO[p].nome}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Senha inicial (mín. 8 caracteres)
              <input type="text" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} maxLength={128} required autoComplete="off" className={campo} />
            </label>
            <p className="text-xs text-slate-500 sm:col-span-2">{PERFIL_INFO[perfil].resumo}</p>
            <Button type="submit" isLoading={ocupado === "novo"} className="sm:col-span-2">Criar acesso</Button>
          </form>
        )}

        {erro && <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{erro}</p>}
        {aviso && <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{aviso}</p>}

        <ul className="divide-y divide-slate-100">
          {pessoas.map((p) => {
            const eu = p.id === meuId;
            const areas = areasDoPerfil(p.role);
            return (
              <li key={p.id} className={`py-4 ${p.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white" aria-hidden="true">{iniciais(p.name)}</span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {p.name} {eu && <span className="text-xs font-normal text-slate-400">(você)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{p.email}</p>
                  </div>
                  {!p.active && <Badge variant="outline">Desativado</Badge>}
                  <select
                    aria-label={`Perfil de ${p.name}`}
                    value={p.role}
                    disabled={ocupado === p.id || eu}
                    onChange={(e) => alterar(p.id, { role: e.target.value }, `Perfil de ${p.name} alterado para ${nomePerfil(e.target.value)}.`)}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 disabled:bg-slate-50"
                    title={eu ? "Você não pode mudar o seu próprio perfil" : undefined}
                  >
                    {PERFIS.map((r) => (
                      <option key={r} value={r}>{PERFIL_INFO[r].nome}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" disabled={ocupado === p.id} onClick={() => { setSenhaDe(senhaDe === p.id ? null : p.id); setNovaSenha(""); }} className="gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" /> Senha
                    </Button>
                    {!eu && (
                      <Button size="sm" variant={p.active ? "ghost" : "success"} disabled={ocupado === p.id} onClick={() => alterar(p.id, { active: !p.active }, p.active ? `${p.name} foi desativado.` : `${p.name} foi reativado.`)} className="gap-1.5">
                        {p.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {p.active ? "Desativar" : "Reativar"}
                      </Button>
                    )}
                  </div>
                </div>

                {senhaDe === p.id && (
                  <form onSubmit={(e) => trocarSenha(e, p.id)} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
                    <label className="block flex-1 basis-48 text-xs font-medium text-slate-600">
                      Nova senha (mín. 8 caracteres)
                      <input type="text" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={8} maxLength={128} required autoComplete="off" className={campo} />
                    </label>
                    <Button type="submit" size="md" isLoading={ocupado === p.id}>Salvar senha</Button>
                  </form>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {areas.map((a) => (
                    <span key={a.href} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{a.titulo}</span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
