import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const pagamentoSchema = z.object({
  amount: z.number().positive("O valor deve ser maior que zero"),
  paymentMethod: z.enum(["PIX", "BOLETO", "CARTAO", "TRANSFERENCIA", "DINHEIRO"]),
  paymentDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  atualizarStatus: z.boolean().default(true),
});

// POST /api/pedidos/[id]/pagamentos - Registrar pagamento de parcela / entrada
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const body = await req.json();
    const parsed = pagamentoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados de pagamento inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { amount, paymentMethod, paymentDate, notes, atualizarStatus } = parsed.data;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const novoPaidAmount = pedido.paidAmount + amount;
      const novoPendingAmount = Math.max(0, pedido.totalAmount - novoPaidAmount);

      // Determinar novo status se solicitado
      let novoStatus = pedido.status;
      if (atualizarStatus) {
        if (novoPendingAmount === 0 || novoPaidAmount >= pedido.totalAmount) {
          novoStatus = "PAGAMENTO_CONFIRMADO";
        } else if (novoPaidAmount > 0) {
          // Parcela de entrada paga
          novoStatus = "PAGAMENTO_CONFIRMADO";
        }
      }

      // Atualizar pedido no banco
      const pedidoAtualizado = await tx.order.update({
        where: { id },
        data: {
          paidAmount: novoPaidAmount,
          pendingAmount: novoPendingAmount,
          paymentMethod: paymentMethod,
          status: novoStatus,
        },
      });

      // Criar transação correspondente no módulo Financeiro (Seção 13)
      const transacao = await tx.financialTransaction.create({
        data: {
          type: "RECEITA",
          category: "VENDA",
          description: notes?.trim() || `Pagamento Pedido ${pedido.orderNumber} (${paymentMethod})`,
          amount: amount,
          paymentMethod: paymentMethod,
          status: "PAGO",
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          orderId: id,
          customerId: pedido.customerId,
        },
      });

      // Se o status avançou para PAGAMENTO_CONFIRMADO, gerar mensagem WhatsApp
      if (novoStatus === "PAGAMENTO_CONFIRMADO" && pedido.status !== "PAGAMENTO_CONFIRMADO") {
        if (pedido.customer.whatsapp) {
          await tx.whatsAppMessage.create({
            data: {
              orderId: id,
              customerId: pedido.customerId,
              phone: pedido.customer.whatsapp,
              templateType: "PAGAMENTO_CONFIRMADO",
              content: `Olá ${pedido.customer.name}! Confirmamos o recebimento do pagamento de R$ ${amount.toFixed(2)} referente ao seu pedido ${pedido.orderNumber}. Saldo restante: R$ ${novoPendingAmount.toFixed(2)}. Seu pedido está confirmado e pronto para produção!`,
              status: "PENDENTE",
            },
          });
        }
      }

      // Auditoria (Seção 18)
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "CONFIRMAR_PAGAMENTO",
          entity: "PEDIDO",
          entityId: id,
          details: JSON.stringify({
            amount,
            paymentMethod,
            novoPaidAmount,
            novoPendingAmount,
            statusAnterior: pedido.status,
            novoStatus,
            transactionId: transacao.id,
          }),
        },
      });

      return { pedido: pedidoAtualizado, transacao };
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso!`,
      pedido: resultado.pedido,
      transacao: resultado.transacao,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao registrar pagamento do pedido:", error);
    return NextResponse.json({ erro: "Erro interno ao registrar pagamento" }, { status: 500 });
  }
}
