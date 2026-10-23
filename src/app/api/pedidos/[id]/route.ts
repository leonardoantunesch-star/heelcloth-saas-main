import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updatePedidoSchema = z.object({
  deliveryDeadline: z.string().optional().nullable(),
  paymentMethod: z.string().optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

// GET /api/pedidos/[id] - Obter detalhes completos do pedido
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(req);
    const { id } = await params;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        players: {
          orderBy: { playerIndex: "asc" },
        },
        productionOrder: {
          include: {
            history: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        qualityCheck: true,
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        whatsappMessages: {
          orderBy: { createdAt: "desc" },
        },
        financialTransactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ sucesso: true, pedido });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao carregar pedido:", error);
    return NextResponse.json({ erro: "Erro interno no servidor" }, { status: 500 });
  }
}

// PUT /api/pedidos/[id] - Atualizar dados do pedido
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const body = await req.json();
    const parsed = updatePedidoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { deliveryDeadline, paymentMethod, paidAmount, notes } = parsed.data;

    const pedidoAtual = await prisma.order.findUnique({ where: { id } });
    if (!pedidoAtual) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (deliveryDeadline !== undefined) {
      dataToUpdate.deliveryDeadline = deliveryDeadline ? new Date(deliveryDeadline) : null;
    }
    if (paymentMethod !== undefined) {
      dataToUpdate.paymentMethod = paymentMethod;
    }
    if (notes !== undefined) {
      dataToUpdate.notes = notes ? notes.trim() : null;
    }
    if (paidAmount !== undefined) {
      dataToUpdate.paidAmount = paidAmount;
      dataToUpdate.pendingAmount = Math.max(0, pedidoAtual.totalAmount - paidAmount);
    }

    const pedidoAtualizado = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "ATUALIZACAO",
        entity: "PEDIDO",
        entityId: id,
        details: JSON.stringify(dataToUpdate),
      },
    });

    return NextResponse.json({ sucesso: true, pedido: pedidoAtualizado });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ erro: "Erro ao atualizar dados do pedido" }, { status: 500 });
  }
}

// DELETE /api/pedidos/[id] - Exclusão completa do pedido
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Desvincular transações financeiras (mantém histórico financeiro sem quebrar FK)
      await tx.financialTransaction.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      });

      // 2. Remover mensagens de WhatsApp atreladas ao pedido
      await tx.whatsAppMessage.deleteMany({
        where: { orderId: id },
      });

      // 3. Remover notas fiscais associadas
      await tx.invoice.deleteMany({
        where: { orderId: id },
      });

      // 4. Remover checklist de qualidade
      await tx.qualityCheck.deleteMany({
        where: { orderId: id },
      });

      // 5. Remover ordem de produção e seu histórico
      await tx.productionOrder.deleteMany({
        where: { orderId: id },
      });

      // 6. Remover jogadores personalizados
      await tx.orderPlayer.deleteMany({
        where: { orderId: id },
      });

      // 7. Remover itens do pedido
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      // 8. Remover o pedido
      await tx.order.delete({
        where: { id },
      });

      // 9. Registrar auditoria
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "EXCLUSAO_PEDIDO",
          entity: "PEDIDO",
          entityId: id,
          details: JSON.stringify({
            orderNumber: pedido.orderNumber,
            customer: pedido.customer.name,
            totalAmount: pedido.totalAmount,
          }),
        },
      });
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `Pedido ${pedido.orderNumber} excluído com sucesso.`,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao excluir pedido:", error);
    return NextResponse.json({ erro: "Erro ao excluir pedido" }, { status: 500 });
  }
}
