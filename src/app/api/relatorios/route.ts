import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { obterIntervaloData, obterMetricasBI } from "@/services/relatorios";

// GET /api/relatorios - Retorna indicadores de Business Intelligence (Seção 17)
// Acesso restrito a ADMIN e FINANCEIRO
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "FINANCEIRO"]);

    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "mes";
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const intervalo = obterIntervaloData(periodo, dataInicio, dataFim);
    const dadosBI = await obterMetricasBI(intervalo.inicio, intervalo.fim);

    return NextResponse.json({
      sucesso: true,
      periodo: {
        tipo: periodo,
        label: intervalo.label,
        inicio: intervalo.inicio.toISOString(),
        fim: intervalo.fim.toISOString(),
      },
      ...dadosBI,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { erro: "Acesso negado. Módulo restrito a Administradores e Financeiro." },
        { status: 403 }
      );
    }
    console.error("Erro ao gerar dados de BI e Relatórios:", error);
    return NextResponse.json(
      { erro: "Erro ao processar dados de relatórios" },
      { status: 500 }
    );
  }
}
