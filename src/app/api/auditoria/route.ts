import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { listarAuditorias } from "@/services/auditoria";

// GET /api/auditoria - Lista registros de auditoria com filtros e paginação (Seção 18)
// Acesso restrito a ADMIN
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const busca = searchParams.get("busca")?.trim() || "";
    const acao = searchParams.get("acao")?.trim() || "";
    const entidade = searchParams.get("entidade")?.trim() || "";
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const resultado = await listarAuditorias({
      page,
      limit,
      busca,
      acao,
      entidade,
      dataInicio,
      dataFim,
    });

    return NextResponse.json({
      sucesso: true,
      ...resultado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { erro: "Acesso negado. Módulo de auditoria restrito ao Administrador." },
        { status: 403 }
      );
    }
    console.error("Erro ao listar logs de auditoria:", error);
    return NextResponse.json(
      { erro: "Erro interno ao processar logs de auditoria" },
      { status: 500 }
    );
  }
}
