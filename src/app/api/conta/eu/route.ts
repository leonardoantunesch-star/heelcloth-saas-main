import { NextRequest, NextResponse } from "next/server";
import { contaAtual, semSenha } from "@/lib/conta";

export const dynamic = "force-dynamic";

// GET /api/conta/eu - quem está logado (ou { conta: null }).
export async function GET(req: NextRequest) {
  const c = await contaAtual(req);
  return NextResponse.json({ conta: c ? semSenha(c) : null }, { headers: { "Cache-Control": "no-store" } });
}
