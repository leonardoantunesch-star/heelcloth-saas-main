import { NextRequest, NextResponse } from "next/server";
import { confirmarPagamento } from "@/lib/loja";

// POST /api/loja/webhook - aviso do Mercado Pago. O conteúdo do aviso não é confiável:
// só usamos o número do pagamento e consultamos o pagamento direto no Mercado Pago.
export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const body = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: unknown } };
    const tipo = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const id = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
    if (tipo === "payment" && id) await confirmarPagamento(id);
  } catch (erro) {
    console.error("Webhook Mercado Pago:", erro);
  }
  // Sempre 200, senão o Mercado Pago fica reenviando o aviso.
  return NextResponse.json({ ok: true });
}
