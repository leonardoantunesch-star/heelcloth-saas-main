import { NextRequest, NextResponse } from "next/server";
import { ehProvedor, iniciarSocial } from "@/lib/social";

// GET /api/conta/social/{google|facebook|apple}/iniciar?voltar=/caminho - leva a pessoa para entrar no provedor.
export async function GET(req: NextRequest, ctx: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await ctx.params;
  if (!ehProvedor(provedor)) return NextResponse.json({ erro: "Provedor desconhecido." }, { status: 404 });
  return iniciarSocial(req, provedor);
}
