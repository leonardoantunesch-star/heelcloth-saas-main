import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { formatarParaVba, gerarMacroVbaPadrao } from "@/services/coreldraw";

// GET /api/coreldraw/[orderId] - Detalhes do pedido com dados formatados para CorelDRAW VBA
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireAuth();
    const { orderId } = await params;

    const pedido = await prisma.order.findUnique({
      where: { id: orderId },
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
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { erro: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    const vbaData = formatarParaVba(pedido.players);
    const vbaMacro = gerarMacroVbaPadrao();

    return NextResponse.json({
      sucesso: true,
      pedido: {
        id: pedido.id,
        orderNumber: pedido.orderNumber,
        status: pedido.status,
        customer: pedido.customer,
        totalJogadores: pedido.players.length,
        players: pedido.players,
      },
      vbaData,
      vbaMacro,
      nomeArquivoDownload: `Heelcloth-CorelDRAW-${pedido.orderNumber}.txt`,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao buscar dados CorelDRAW do pedido:", error);
    return NextResponse.json(
      { erro: "Erro ao obter dados para CorelDRAW" },
      { status: 500 }
    );
  }
}
