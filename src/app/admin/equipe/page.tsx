import React from "react";
import { redirect } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AREAS, PERFIL_INFO, PERFIS, podeAcessar } from "@/lib/permissoes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipeGerenciar, type PessoaEquipe } from "@/components/painel/equipe-gerenciar";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const sessao = await getSession();
  if (!sessao) redirect("/login");
  if (sessao.role !== "ADMIN") redirect("/admin/dashboard");

  const usuarios = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  const pessoas: PessoaEquipe[] = usuarios.map(
    (u: { id: string; name: string; email: string; role: string; active: boolean; createdAt: Date }) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })
  );
  const ativos = pessoas.filter((p) => p.active).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Equipe</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {ativos} {ativos === 1 ? "pessoa ativa" : "pessoas ativas"} com acesso ao painel. Aqui você define quem entra e o que cada perfil pode abrir.
        </p>
      </div>

      <EquipeGerenciar iniciais={pessoas} meuId={sessao.userId} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">O que cada perfil acessa</CardTitle>
          <CardDescription className="text-xs">Regras fixas do sistema. Para liberar uma área a alguém, mude o perfil da pessoa.</CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERFIS.map((p) => (
              <div key={p} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">{PERFIL_INFO[p].nome}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{PERFIL_INFO[p].resumo}</p>
              </div>
            ))}
          </div>

          <div className="-mx-2 overflow-x-auto px-2">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Área do painel</th>
                  {PERFIS.map((p) => (
                    <th key={p} className="px-2 py-2 text-center font-semibold">{PERFIL_INFO[p].nome}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AREAS.map((a) => (
                  <tr key={a.href}>
                    <td className="py-2 pr-3 font-medium text-slate-700">{a.titulo}</td>
                    {PERFIS.map((p) => (
                      <td key={p} className="px-2 py-2 text-center">
                        {podeAcessar(p, a) ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Pode acessar" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Sem acesso" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
