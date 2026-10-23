import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const atualizarTransacaoSchema = z.object({
  status: z.enum(["PENDENTE", "PAGO", "CANCELADO"]).optional(),
  paymentMethod: z.enum(["PIX", "BOLETO", "CARTAO", "TRANSFERENCIA", "DINHEIRO"]).optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  description: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
});

// GET /api/financeiro/[id] - Detalhes da transação
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "FINANCEIRO"]);
    const { id } = await params;

    const transacao = await prisma.financialTransaction.findUnique({
      where: { id },
      include: {
        order: true,
        customer: true,
      },
    });

    if (!transacao) {
      return NextResponse.json({ erro: "Transação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ sucesso: true, transacao });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ erro: "Acesso restrito ao perfil Financeiro" }, { status: 403 });
    }
    console.error("Erro ao buscar transação:", error);
    return NextResponse.json({ erro: "Erro ao buscar transação" }, { status: 500 });
  }
}

// PATCH /api/financeiro/[id] - Atualização de status e baixa de recebimento
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN", "FINANCEIRO"]);
    const { id } = await params;

    const body = await req.json();
    const parsed = atualizarTransacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const anterior = await prisma.financialTransaction.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ erro: "Transação não encontrada" }, { status: 404 });
    }

    const { status, paymentMethod, paymentDate, description, amount } = parsed.data;

    const dataUpdate: any = {};
    if (description !== undefined) dataUpdate.description = description;
    if (amount !== undefined) dataUpdate.amount = amount;
    if (paymentMethod !== undefined) dataUpdate.paymentMethod = paymentMethod;

    if (status !== undefined) {
      dataUpdate.status = status;
      if (status === "PAGO" && !anterior.paymentDate) {
        dataUpdate.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const atualizada = await tx.financialTransaction.update({
        where: { id },
        data: dataUpdate,
      });

      // Se a transação passou de PENDENTE para PAGO e tem pedido associado
      if (
        anterior.status !== "PAGO" &&
        status === "PAGO" &&
        atualizada.type === "RECEITA" &&
        atualizada.orderId
      ) {
        const ped = await tx.order.findUnique({ where: { id: atualizada.orderId } });
        if (ped) {
          const novoPago = ped.paidAmount + atualizada.amount;
          const novoPendente = Math.max(0, ped.totalAmount - novoPago);
          await tx.order.update({
            where: { id: atualizada.orderId },
            data: {
              paidAmount: novoPago,
              pendingAmount: novoPendente,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "ATUALIZAR_TRANSACAO_FINANCEIRA",
          entity: "FINANCEIRO",
          entityId: id,
          details: JSON.stringify({
            statusAnterior: anterior.status,
            novoStatus: status,
            amount: atualizada.amount,
          }),
        },
      });

      return atualizada;
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Transação financeira atualizada com sucesso!",
      transacao: resultado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ erro: "Acesso restrito ao perfil Financeiro" }, { status: 403 });
    }
    console.error("Erro ao atualizar transação:", error);
    return NextResponse.json({ erro: "Erro ao atualizar transação" }, { status: 500 });
  }
}

// DELETE /api/financeiro/[id] - Excluir transação
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(["ADMIN", "FINANCEIRO"]);
    const { id } = await params;

    const anterior = await prisma.financialTransaction.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ erro: "Transação não encontrada" }, { status: 404 });
    }

    await prisma.financialTransaction.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "EXCLUIR_TRANSACAO_FINANCEIRA",
        entity: "FINANCEIRO",
        entityId: id,
        details: JSON.stringify({ description: anterior.description, amount: anterior.amount }),
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Transação financeira removida com sucesso!",
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ erro: "Acesso restrito ao perfil Financeiro" }, { status: 403 });
    }
    console.error("Erro ao excluir transação:", error);
    return NextResponse.json({ erro: "Erro ao excluir transação" }, { status: 500 });
  }
}
