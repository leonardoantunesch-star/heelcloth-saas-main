import { NextResponse } from "next/server";
import { PROVEDORES, provedorAtivo } from "@/lib/social";

// GET /api/conta/social - quais botões "Entrar com..." estão ligados nesta loja.
export async function GET() {
  return NextResponse.json(Object.fromEntries(PROVEDORES.map((p) => [p, provedorAtivo(p)])), { headers: { "Cache-Control": "no-store" } });
}
