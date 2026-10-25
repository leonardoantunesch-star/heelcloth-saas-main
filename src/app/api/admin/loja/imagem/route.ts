import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { salvarImagemLoja } from "@/lib/loja";

// POST /api/admin/loja/imagem - recebe a imagem já reduzida (data URL) e devolve o código dela
export async function POST(req: Request) {
  try {
    await requireRole(["ADMIN", "VENDEDOR"]);
    const body = (await req.json().catch(() => null)) as { dataUrl?: unknown } | null;
    if (!body || typeof body.dataUrl !== "string") return NextResponse.json({ erro: "Envie a imagem." }, { status: 400 });
    const id = await salvarImagemLoja(body.dataUrl);
    return NextResponse.json({ id, url: `/api/loja/imagem/${id}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    if (msg === "IMAGEM_INVALIDA")
      return NextResponse.json({ erro: "Imagem inválida ou grande demais. Use JPG, PNG ou WEBP." }, { status: 400 });
    console.error("Erro ao salvar imagem da loja:", error);
    return NextResponse.json({ erro: "Erro interno ao salvar a imagem." }, { status: 500 });
  }
}
