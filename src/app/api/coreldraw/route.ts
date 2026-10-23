import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/coreldraw - Lista pedidos disponíveis para exportação CorelDRAW (Seção 16)
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const where: any = {};

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (busca) {
      where.OR = [
        { orderNumber: { contains: busca } },
        { customer: { name: { contains: busca } } },
      ];
    }

    const pedidos = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
            address: true,
          },
        },
        players: {
          orderBy: { playerIndex: "asc" },
          select: {
            id: true,
            playerIndex: true,
            name: true,
            number: true,
            size: true,
            model: true,
            notes: true,
            shortSize: true,
          },
        },
        _count: {
          select: { players: true },
        },
      },
    });

    // Estatísticas
    const totalPedidos = pedidos.length;
    const pedidosComJogadores = pedidos.filter((p) => p.players.length > 0).length;
    const totalPecas = pedidos.reduce((acc, p) => acc + p.players.length, 0);

    return NextResponse.json({
      sucesso: true,
      metricas: {
        totalPedidos,
        pedidosComJogadores,
        totalPecas,
      },
      pedidos: pedidos.map((p) => ({
        id: p.id,
        orderNumber: p.orderNumber,
        status: p.status,
        createdAt: p.createdAt,
        customer: p.customer,
        totalJogadores: p.players.length,
        players: p.players,
      })),
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao listar dados CorelDRAW:", error);
    return NextResponse.json(
      { erro: "Erro ao listar pedidos para CorelDRAW" },
      { status: 500 }
    );
  }
}
