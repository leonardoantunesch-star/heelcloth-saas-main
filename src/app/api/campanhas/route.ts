import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { gravarCampanhas, lerCampanhas, listaCampanhasSchema } from "@/lib/campanhas";

function falha(error: unknown, contexto: string) {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  console.error(contexto, error);
  return NextResponse.json({ erro: "Não foi possível concluir. Tente de novo." }, { status: 500 });
}

// GET /api/campanhas - lista as campanhas (qualquer pessoa com login)
export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({ campanhas: await lerCampanhas() });
  } catch (error) {
    return falha(error, "Erro ao ler campanhas:");
  }
}

// PUT /api/campanhas - grava a lista inteira (administrador e vendedor)
export async function PUT(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "VENDEDOR"]);
    const corpo = z.object({ campanhas: listaCampanhasSchema }).safeParse(await req.json().catch(() => null));
    if (!corpo.success) {
      return NextResponse.json({ erro: corpo.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    }
    await gravarCampanhas(corpo.data.campanhas);
    return NextResponse.json({ campanhas: corpo.data.campanhas });
  } catch (error) {
    return falha(error, "Erro ao gravar campanhas:");
  }
}
