import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Gera número sequencial de pedido no formato HC-YYMM-XXXX
async function gerarNumeroPedido(): Promise<string> {
  const agora = new Date();
  const ano = agora.getFullYear().toString().slice(-2);
  const mes = (agora.getMonth() + 1).toString().padStart(2, "0");
  const prefixo = `HC-${ano}${mes}-`;

  const ultimo = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefixo } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  let sequencia = 1;
  if (ultimo?.orderNumber) {
    const partes = ultimo.orderNumber.split("-");
    if (partes.length === 3) {
      const num = parseInt(partes[2], 10);
      if (!isNaN(num)) sequencia = num + 1;
    }
  }

  return `${prefixo}${sequencia.toString().padStart(4, "0")}`;
}

// POST /api/orcamentos/[id]/converter - Converte orçamento aprovado em pedido (Seção 8)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const orcamento = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!orcamento) {
      return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
    }

    if (orcamento.status === "CONVERTIDO") {
      return NextResponse.json(
        { erro: "Este orçamento já foi convertido em um pedido anteriormente." },
        { status: 400 }
      );
    }

    if (orcamento.items.length === 0) {
      return NextResponse.json(
        { erro: "O orçamento não possui itens para serem convertidos em pedido." },
        { status: 400 }
      );
    }

    // Prazo padrão: 15 dias a partir da conversão se não especificado
    const prazoPadrao = new Date(Date.now() + 15 * 24 * 3600 * 1000);
    const orderNumber = await gerarNumeroPedido();

    // Executar conversão em transação atômica do Prisma
    const novoPedido = await prisma.$transaction(async (tx) => {
      // 1. Criar o pedido copiando todos os dados
      const pedido = await tx.order.create({
        data: {
          orderNumber,
          customerId: orcamento.customerId,
          quoteId: orcamento.id,
          status: "APROVADO",
          totalAmount: orcamento.totalAmount,
          paidAmount: 0,
          pendingAmount: orcamento.totalAmount,
          paymentMethod: "A_DEFINIR",
          deliveryDeadline: prazoPadrao,
          notes: orcamento.notes
            ? `Convertido do Orçamento ${orcamento.quoteNumber}. ${orcamento.notes}`
            : `Convertido do Orçamento ${orcamento.quoteNumber}`,
          items: {
            create: orcamento.items.map((item) => ({
              product: item.product,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.details,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 2. Inicializar a esteira produtiva (Seção 10)
      await tx.productionOrder.create({
        data: {
          orderId: pedido.id,
          currentStage: "ARTE",
          stageStatus: "PENDENTE",
          deadline: prazoPadrao,
          notes: "Aguardando envio da lista de jogadores e aprovação da arte visual.",
          history: {
            create: {
              stage: "ARTE",
              status: "INICIADO",
              notes: `Pedido criado a partir do orçamento ${orcamento.quoteNumber}.`,
            },
          },
        },
      });

      // 3. Atualizar o status do orçamento para CONVERTIDO
      await tx.quote.update({
        where: { id: orcamento.id },
        data: { status: "CONVERTIDO" },
      });

      // 4. Registrar logs de auditoria
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "CONVERSAO",
          entity: "ORCAMENTO",
          entityId: orcamento.id,
          details: JSON.stringify({
            orcamento: orcamento.quoteNumber,
            pedidoGerado: pedido.orderNumber,
            valor: pedido.totalAmount,
          }),
        },
      });

      return pedido;
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `Orçamento ${orcamento.quoteNumber} convertido com sucesso no Pedido ${novoPedido.orderNumber}!`,
      pedido: {
        id: novoPedido.id,
        numero: novoPedido.orderNumber,
        cliente: novoPedido.customer.name,
        total: novoPedido.totalAmount,
      },
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao converter orçamento em pedido:", error);
    return NextResponse.json(
      { erro: "Erro interno ao converter orçamento em pedido" },
      { status: 500 }
    );
  }
}
