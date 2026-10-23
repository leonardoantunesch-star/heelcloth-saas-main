import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { obterConfiguracoes, salvarConfiguracoes } from "@/services/configuracoes";

// GET /api/configuracoes - Retorna todas as configurações da empresa (Seção 22)
// Acesso restrito a ADMIN
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const configuracoes = await obterConfiguracoes();

    return NextResponse.json({
      sucesso: true,
      configuracoes,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { erro: "Acesso negado. Módulo de configurações restrito ao Administrador." },
        { status: 403 }
      );
    }
    console.error("Erro ao obter configurações:", error);
    return NextResponse.json(
      { erro: "Erro ao obter parâmetros de configuração" },
      { status: 500 }
    );
  }
}

// POST /api/configuracoes - Atualiza configurações em lote
// Acesso restrito a ADMIN
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN"]);

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { erro: "Payload de configurações inválido" },
        { status: 400 }
      );
    }

    const resultado = await salvarConfiguracoes(body, session.userId);

    const configuracoesAtualizadas = await obterConfiguracoes();

    return NextResponse.json({
      sucesso: true,
      mensagem: "Configurações atualizadas com sucesso!",
      totalSalvas: resultado.totalSalvas,
      configuracoes: configuracoesAtualizadas,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { erro: "Acesso negado. Módulo de configurações restrito ao Administrador." },
        { status: 403 }
      );
    }
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { erro: "Erro ao salvar parâmetros de configuração" },
      { status: 500 }
    );
  }
}
