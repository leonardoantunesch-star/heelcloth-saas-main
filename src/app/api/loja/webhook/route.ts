import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { confirmarPagamento } from "@/lib/loja";

// Confere a assinatura que o Mercado Pago coloca no aviso (cabeçalho x-signature), com o segredo da integração
// (variável MERCADOPAGO_WEBHOOK_SECRET, em Suas integrações > Webhooks > Chave secreta).
// Devolve true/false, ou null quando o segredo ainda não foi cadastrado.
function assinaturaConfere(req: NextRequest, dataId: string): boolean | null {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!segredo) return null;
  const cab = req.headers.get("x-signature") ?? "";
  const partes = Object.fromEntries(cab.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;
  const idRequisicao = req.headers.get("x-request-id") ?? "";
  const manifesto = `${dataId ? `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};` : ""}${idRequisicao ? `request-id:${idRequisicao};` : ""}ts:${ts};`;
  const esperado = crypto.createHmac("sha256", segredo).update(manifesto).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(v1.toLowerCase()));
}

let avisouSemSegredo = false;

// POST /api/loja/webhook - aviso do Mercado Pago. Com o segredo cadastrado, avisos sem assinatura válida são
// recusados. Mesmo assim o conteúdo do aviso não é confiável: só usamos o número do pagamento e consultamos
// o pagamento direto no Mercado Pago.
export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const body = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: unknown } };
    const tipo = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const id = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

    // A assinatura vale para o id que vem na URL (data.id); se não vier, usa o do corpo.
    const confere = assinaturaConfere(req, url.searchParams.get("data.id") ?? id);
    if (confere === false) {
      console.warn("Webhook Mercado Pago recusado: assinatura inválida.");
      return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
    }
    if (confere === null && !avisouSemSegredo) {
      avisouSemSegredo = true;
      console.warn("MERCADOPAGO_WEBHOOK_SECRET não está cadastrada: os avisos de pagamento não estão sendo verificados.");
    }

    if (tipo === "payment" && id) await confirmarPagamento(id);
  } catch (erro) {
    console.error("Webhook Mercado Pago:", erro);
  }
  // 200 para o Mercado Pago não reenviar o aviso sem parar.
  return NextResponse.json({ ok: true });
}
