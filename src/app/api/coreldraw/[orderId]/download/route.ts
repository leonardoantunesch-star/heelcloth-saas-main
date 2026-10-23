import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { formatarParaVba } from "@/services/coreldraw";

// GET /api/coreldraw/[orderId]/download - Download do arquivo .txt tabulado para CorelDRAW VBA
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
    const fileName = `Heelcloth-CorelDRAW-${pedido.orderNumber}.txt`;

    return new NextResponse(vbaData, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro no download CorelDRAW:", error);
    return NextResponse.json(
      { erro: "Erro ao gerar arquivo de download" },
      { status: 500 }
    );
  }
}
