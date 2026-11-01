import { NextRequest, NextResponse } from "next/server";
import { concluirSocial, ehProvedor } from "@/lib/social";

type Ctx = { params: Promise<{ provedor: string }> };

// Google e Facebook devolvem a pessoa por GET; a Apple, por POST (formulário). Os dois caem na mesma conferência.
export async function GET(req: NextRequest, ctx: Ctx) {
  const { provedor } = await ctx.params;
  if (!ehProvedor(provedor)) return NextResponse.json({ erro: "Provedor desconhecido." }, { status: 404 });
  const q = new URL(req.url).searchParams;
  return concluirSocial(req, provedor, { code: q.get("code"), state: q.get("state"), erro: q.get("error"), user: null });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { provedor } = await ctx.params;
  if (!ehProvedor(provedor)) return NextResponse.json({ erro: "Provedor desconhecido." }, { status: 404 });
  const f = await req.formData().catch(() => null);
  const pega = (k: string) => { const v = f?.get(k); return typeof v === "string" ? v : null; };
  return concluirSocial(req, provedor, { code: pega("code"), state: pega("state"), erro: pega("error"), user: pega("user") });
}
