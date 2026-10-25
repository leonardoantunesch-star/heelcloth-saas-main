import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { lerLoja, salvarLoja, tokenMercadoPago } from "@/lib/loja";
import { lojaSchema } from "@/data/loja";

function tratarErro(error: unknown, contexto: string) {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  console.error(contexto, error);
  return NextResponse.json({ erro: "Erro interno ao processar a loja." }, { status: 500 });
}

// GET /api/admin/loja - configuração completa da loja (inclui itens escondidos)
export async function GET() {
  try {
    await requireRole(["ADMIN", "VENDEDOR"]);
    return NextResponse.json({ loja: await lerLoja(), mercadoPago: Boolean(tokenMercadoPago()) });
  } catch (error) {
    return tratarErro(error, "Erro ao ler a loja:");
  }
}

// PUT /api/admin/loja - publica as alterações
export async function PUT(req: Request) {
  try {
    await requireRole(["ADMIN", "VENDEDOR"]);
    const body = await req.json().catch(() => null);
    const parsed = lojaSchema.safeParse(body?.loja);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      const onde = i?.path?.length ? ` (${i.path.join(" › ")})` : "";
      return NextResponse.json({ erro: (i?.message || "Dados inválidos.") + onde }, { status: 400 });
    }
    const ids = new Set<string>();
    for (const p of parsed.data.produtos) {
      if (ids.has(p.id)) return NextResponse.json({ erro: `Produto repetido: ${p.nome}` }, { status: 400 });
      ids.add(p.id);
      const tams = new Set(p.tamanhos.map((t) => t.nome.toLowerCase()));
      if (tams.size !== p.tamanhos.length)
        return NextResponse.json({ erro: `Tamanho repetido em ${p.nome}.` }, { status: 400 });
    }
    return NextResponse.json({ sucesso: true, loja: await salvarLoja(parsed.data) });
  } catch (error) {
    return tratarErro(error, "Erro ao salvar a loja:");
  }
}
