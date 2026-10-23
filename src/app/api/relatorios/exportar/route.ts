import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { obterIntervaloData, gerarCsvRelatorio } from "@/services/relatorios";

// GET /api/relatorios/exportar - Exporta dados em formato CSV para download
// Acesso restrito a ADMIN e FINANCEIRO
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "FINANCEIRO"]);

    const { searchParams } = new URL(req.url);
    const tipo = (searchParams.get("tipo") || "vendas") as
      | "vendas"
      | "financeiro"
      | "producao"
      | "clientes";
    const periodo = searchParams.get("periodo") || "mes";
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const intervalo = obterIntervaloData(periodo, dataInicio, dataFim);
    const csvContent = await gerarCsvRelatorio(tipo, intervalo.inicio, intervalo.fim);

    const dataHoje = new Date().toISOString().split("T")[0];
    const nomeArquivo = `Heelcloth-${tipo.toUpperCase()}-${periodo}-${dataHoje}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
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
    console.error("Erro ao exportar CSV de relatórios:", error);
    return NextResponse.json(
      { erro: "Erro ao gerar exportação CSV" },
      { status: 500 }
    );
  }
}
