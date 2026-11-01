import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { podeAcessar, AREAS } from "@/lib/permissoes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraficoBarras, Rosca } from "@/components/painel/graficos";
import { hojeBrasil, maioresPor, progressoPorStatus, serieMensal, seriePorSemana } from "@/lib/painel-dados";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const compacto = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : String(Math.round(n)));

export default async function AnalyticsPage() {
  const sessao = await getSession();
  if (!sessao) redirect("/login");
  const area = AREAS.find((a) => a.href === "/admin/analytics")!;
  if (!podeAcessar(sessao.role, area)) redirect("/admin/dashboard");

  const hoje = hojeBrasil();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  inicio.setDate(inicio.getDate() - 3); // folga de fuso

  const [pedidos, porStatus, orcamentos] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: inicio }, status: { not: "CANCELADO" } },
      select: { createdAt: true, totalAmount: true, customer: { select: { name: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.quote.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  type Linha = { createdAt: Date; totalAmount: number; customer: { name: string } };
  const linhas: Linha[] = pedidos;
  const semanas = seriePorSemana(linhas, hoje, 8);
  const meses = serieMensal(linhas, hoje, 6);
  const progresso = progressoPorStatus(
    (porStatus as { status: string; _count: { _all: number } }[]).map((g) => ({ status: g.status, quantidade: g._count._all }))
  );
  const melhores = maioresPor(linhas, (l) => l.customer.name, (l) => l.totalAmount, 5);

  const totalMeses = meses.reduce((s, m) => s + m.faturamento, 0);
  const pedidosMeses = meses.reduce((s, m) => s + m.pedidos, 0);
  const ticket = pedidosMeses > 0 ? totalMeses / pedidosMeses : 0;

  const orc = orcamentos as { status: string; _count: { _all: number } }[];
  const totalOrc = orc.reduce((s, o) => s + o._count._all, 0);
  const fechados = orc.filter((o) => ["APROVADO", "CONVERTIDO"].includes(o.status)).reduce((s, o) => s + o._count._all, 0);
  const conversao = totalOrc > 0 ? Math.round((fechados / totalOrc) * 100) : 0;

  const resumo = [
    { titulo: "Vendido em 6 meses", valor: formatCurrency(totalMeses) },
    { titulo: "Pedidos em 6 meses", valor: String(pedidosMeses) },
    { titulo: "Ticket médio", valor: formatCurrency(ticket) },
    { titulo: "Orçamentos fechados", valor: totalOrc > 0 ? `${conversao}%` : "—" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Como as vendas da confecção estão indo, semana a semana e mês a mês.</p>
        </div>
        <Link href="/admin/relatorios" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
          Relatórios completos →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {resumo.map((r) => (
          <Card key={r.titulo}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">{r.titulo}</p>
              <p className="mt-2 truncate text-lg sm:text-2xl font-bold tracking-tight text-slate-900">{r.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Vendas por semana</CardTitle>
            <CardDescription className="text-xs">Valor dos pedidos em R$, últimas 8 semanas (semana começa na segunda)</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoBarras
              descricao="Vendas por semana"
              dados={semanas.map((s) => ({ rotulo: s.rotulo, valor: s.faturamento, dica: `Semana de ${s.rotulo}: ${s.pedidos} pedidos, ${formatCurrency(s.faturamento)}` }))}
              formatar={compacto}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Vendas por mês</CardTitle>
            <CardDescription className="text-xs">Valor dos pedidos em R$, últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoBarras
              descricao="Vendas por mês"
              cor="bg-emerald-500"
              dados={meses.map((m) => ({ rotulo: m.rotulo, valor: m.faturamento, dica: `${m.rotulo}: ${m.pedidos} pedidos, ${formatCurrency(m.faturamento)}` }))}
              formatar={compacto}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Andamento dos pedidos</CardTitle>
            <CardDescription className="text-xs">Onde estão os pedidos (cancelados não entram)</CardDescription>
          </CardHeader>
          <CardContent>
            <Rosca
              descricao="Andamento dos pedidos"
              centro="pedidos"
              fatias={[
                { rotulo: "Concluídos", valor: progresso.concluido, stroke: "stroke-emerald-500", ponto: "bg-emerald-500" },
                { rotulo: "Em produção", valor: progresso.producao, stroke: "stroke-amber-500", ponto: "bg-amber-500" },
                { rotulo: "Aguardando", valor: progresso.pendente, stroke: "stroke-slate-400", ponto: "bg-slate-400" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Clientes que mais compraram</CardTitle>
            <CardDescription className="text-xs">Nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {melhores.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">Sem vendas no período.</p>
            ) : (
              <ol className="space-y-3">
                {melhores.map((c, i) => (
                  <li key={c.nome} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.quantidade} {c.quantidade === 1 ? "pedido" : "pedidos"}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(c.valor)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
