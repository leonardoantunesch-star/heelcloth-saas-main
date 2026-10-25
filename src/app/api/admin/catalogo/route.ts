import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { ID_IMAGEM, lerCatalogo, salvarCatalogo } from "@/lib/catalogo";
import { comPreco } from "@/data/catalogo";

const imagemSchema = z.string().regex(ID_IMAGEM).nullable();

const catalogoSchema = z.object({
  produtos: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        nome: z.string().trim().min(1, "Todo produto precisa de um nome.").max(80),
        descricao: z.string().max(400),
        destaques: z.array(z.string().max(40)).max(6),
        imagem: imagemSchema,
        visivel: z.boolean(),
        modelos: z
          .array(
            z.object({
              id: z.string().min(1).max(60),
              nome: z.string().trim().min(1, "Todo modelo precisa de um nome.").max(80),
              descricao: z.string().max(200),
              imagem: imagemSchema,
            })
          )
          .max(60),
      })
    )
    .max(40),
});

function tratarErro(error: unknown, contexto: string) {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  console.error(contexto, error);
  return NextResponse.json({ erro: "Erro interno ao processar o catálogo." }, { status: 500 });
}

// GET /api/admin/catalogo - catálogo completo (inclui produtos escondidos)
export async function GET() {
  try {
    await requireRole(["ADMIN", "VENDEDOR"]);
    const produtos = (await lerCatalogo()).map(comPreco);
    return NextResponse.json({ produtos });
  } catch (error) {
    return tratarErro(error, "Erro ao ler catálogo:");
  }
}

// PUT /api/admin/catalogo - publica as alterações no site
export async function PUT(req: Request) {
  try {
    await requireRole(["ADMIN", "VENDEDOR"]);
    const body = await req.json().catch(() => null);
    const parsed = catalogoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    }
    const produtos = (await salvarCatalogo(parsed.data.produtos)).map(comPreco);
    return NextResponse.json({ sucesso: true, produtos });
  } catch (error) {
    return tratarErro(error, "Erro ao salvar catálogo:");
  }
}
