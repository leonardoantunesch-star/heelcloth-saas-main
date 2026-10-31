import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contaAtual } from "@/lib/conta";

export const dynamic = "force-dynamic";

// GET /api/conta/pedidos - pedidos feitos com o e-mail da conta. Só depois de o e-mail ser confirmado
// (senão qualquer um poderia criar uma conta com o e-mail de outra pessoa e ver as compras dela).
export async function GET(req: NextRequest) {
  const conta = await contaAtual(req);
  if (!conta) return NextResponse.json({ erro: "Entre na sua conta." }, { status: 401 });
  if (!conta.verificado) return NextResponse.json({ pedidos: [], precisaConfirmar: true }, { headers: { "Cache-Control": "no-store" } });
  const pedidos = await prisma.order.findMany({
    where: { customer: { email: { equals: conta.email, mode: "insensitive" } } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      items: { select: { product: true, size: true, color: true, quantity: true } },
    },
  });
  return NextResponse.json({ pedidos: pedidos.map((p) => ({ ...p, trackingCode: null })) }, { headers: { "Cache-Control": "no-store" } });
}
