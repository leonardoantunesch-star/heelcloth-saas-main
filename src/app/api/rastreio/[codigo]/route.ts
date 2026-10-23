import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/rastreio/[codigo] - Endpoint público de rastreamento de pedido (Seção 8)
// Sem autenticação exigida para permitir que o cliente final consulte via link do WhatsApp
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const codigoFormatado = decodeURIComponent(codigo).trim();

    if (!codigoFormatado) {
      return NextResponse.json(
        { erro: "Código do pedido não fornecido" },
        { status: 400 }
      );
    }

    const pedido = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: codigoFormatado } },
          { id: { equals: codigoFormatado } },
        ],
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            product: true,
            quantity: true,
            size: true,
            model: true,
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
            shortSize: true,
            notes: true,
          },
        },
        productionOrder: {
          select: {
            currentStage: true,
            stageStatus: true,
          },
        },
        qualityCheck: {
          select: {
            isApproved: true,
            checkedAt: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { erro: "Pedido não encontrado. Verifique o número informado e tente novamente." },
        { status: 404 }
      );
    }

    // Calcular status financeiro
    let statusPagamento: "PAGO" | "PARCIAL" | "PENDENTE" = "PENDENTE";
    if (pedido.paidAmount >= pedido.totalAmount && pedido.totalAmount > 0) {
      statusPagamento = "PAGO";
    } else if (pedido.paidAmount > 0) {
      statusPagamento = "PARCIAL";
    }

    // Determinar etapa numérica do stepper (1 a 5)
    let etapaNumero = 1;
    const statusUpper = (pedido.status || "").toUpperCase();

    if (["ENTREGUE", "CONCLUIDO"].includes(statusUpper)) {
      etapaNumero = 5;
    } else if (["PRONTO"].includes(statusUpper)) {
      etapaNumero = 4;
    } else if (["CONTROLE_QUALIDADE"].includes(statusUpper)) {
      etapaNumero = 3;
    } else if (["EM_PRODUCAO"].includes(statusUpper)) {
      etapaNumero = 2;
    } else {
      etapaNumero = 1;
    }

    // Nomes amigáveis para as sub-etapas fabris
    const mapaEtapasProducao: Record<string, string> = {
      ARTE: "Aprovação de Arte & Layout",
      CORTE: "Corte dos Tecidos",
      PERSONALIZACAO: "Personalização de Nomes e Números",
      COSTURA: "Costura e Montagem",
      ESTAMPA: "Sublimação / Estamparia",
      ACABAMENTO: "Acabamento & Passadoria",
      CONTROLE_QUALIDADE: "Controle de Qualidade",
      PRONTO: "Pronto para Retirada / Envio",
    };

    const subEtapaFabril = pedido.productionOrder?.currentStage
      ? mapaEtapasProducao[pedido.productionOrder.currentStage] || pedido.productionOrder.currentStage
      : null;

    // Total de peças
    const totalPecas =
      pedido.players.length > 0
        ? pedido.players.length
        : pedido.items.reduce((s, it) => s + (it.quantity || 1), 0);

    return NextResponse.json({
      sucesso: true,
      pedido: {
        id: pedido.id,
        orderNumber: pedido.orderNumber,
        status: pedido.status,
        etapaNumero,
        subEtapaFabril,
        statusEtapaProducao: pedido.productionOrder?.stageStatus || null,
        clienteNome: pedido.customer?.name || "Cliente",
        createdAt: pedido.createdAt,
        prazoEntrega: pedido.deliveryDeadline,
        totalAmount: pedido.totalAmount,
        paidAmount: pedido.paidAmount,
        pendingAmount: Math.max(0, pedido.totalAmount - pedido.paidAmount),
        statusPagamento,
        totalPecas,
        qualidadeAprovada: pedido.qualityCheck?.isApproved || false,
        itens: pedido.items,
        jogadores: pedido.players,
      },
    });
  } catch (error) {
    console.error("Erro no rastreamento público de pedido:", error);
    return NextResponse.json(
      { erro: "Erro ao consultar rastreamento do pedido" },
      { status: 500 }
    );
  }
}
