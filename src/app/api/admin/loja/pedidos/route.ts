import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/loja/pedidos - últimos pedidos feitos pela loja online (protocolo começa com LJ-)
export async function GET() {
  try {
    await requireRole(["ADMIN", "VENDEDOR", "FINANCEIRO"]);
    const pedidos = await prisma.order.findMany({
      where: { orderNumber: { startsWith: "LJ-" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        notes: true,
        customer: { select: { name: true, whatsapp: true } },
        items: { select: { product: true, size: true, quantity: true } },
      },
    });
    return NextResponse.json({ pedidos });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    console.error("Erro ao listar pedidos da loja:", error);
    return NextResponse.json({ erro: "Não foi possível carregar os pedidos." }, { status: 500 });
  }
}
