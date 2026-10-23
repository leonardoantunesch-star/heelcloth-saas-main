import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const statusEnum = z.enum([
  "ORCAMENTO",
  "AGUARDANDO_APROVACAO",
  "APROVADO",
  "PAGAMENTO_PENDENTE",
  "PAGAMENTO_CONFIRMADO",
  "EM_PRODUCAO",
  "CONTROLE_QUALIDADE",
  "PRONTO",
  "ENTREGUE",
  "CONCLUIDO",
  "CANCELADO",
  "EM_ATRASO",
  "AGUARDANDO_ALTERACAO",
]);

const statusSchema = z.object({
  status: statusEnum,
  motivo: z.string().optional(),
});

// PATCH /api/pedidos/[id]/status - Transição de status do pedido (Seção 7 e 11)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Status inválido", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { status, motivo } = parsed.data;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        qualityCheck: true,
        customer: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    // REGRA CRÍTICA DA SEÇÃO 11: Trava no backend antes do status PRONTO
    // "Regra: o pedido só pode avançar para 'Pronto' após a conferência completa. Essa regra deve ser aplicada no backend."
    if (status === "PRONTO") {
      const qCheck = pedido.qualityCheck;
      const conferido =
        qCheck &&
        qCheck.checkQuantity &&
        qCheck.checkSizes &&
        qCheck.checkNames &&
        qCheck.checkNumbers &&
        qCheck.checkModel &&
        qCheck.checkPersonalization &&
        qCheck.checkComplete;

      if (!conferido) {
        return NextResponse.json(
          {
            erro: "Bloqueio de Qualidade: O pedido só pode avançar para 'Pronto' após a conferência completa do checklist de controle de qualidade (quantidade, tamanhos, nomes, números, modelo e personalização).",
          },
          { status: 400 }
        );
      }
    }

    // Atualizar status do pedido
    const pedidoAtualizado = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Se entrou em EM_PRODUCAO, atualizar ou garantir esteira de produção
    if (status === "EM_PRODUCAO") {
      await prisma.productionOrder.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          currentStage: "CORTE",
          stageStatus: "EM_ANDAMENTO",
        },
        update: {
          stageStatus: "EM_ANDAMENTO",
        },
      });
    }

    // Registrar no histórico de auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "STATUS_CHANGE",
        entity: "PEDIDO",
        entityId: id,
        details: JSON.stringify({
          statusAnterior: pedido.status,
          novoStatus: status,
          motivo: motivo || null,
        }),
      },
    });

    // Disparo de notificação WhatsApp se configurado (Seção 15)
    let mensagemWhatsapp = null;
    if (status === "PAGAMENTO_CONFIRMADO" || status === "APROVADO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} foi confirmado com sucesso e já está sendo preparado.`;
    } else if (status === "EM_PRODUCAO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} entrou em produção na fábrica da Heelcloth.`;
    } else if (status === "PRONTO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} foi finalizado, revisado no controle de qualidade e está PRONTO para retirada/entrega!`;
    } else if (status === "ENTREGUE") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} foi entregue. Agradecemos pela confiança na Heelcloth Uniformes!`;
    }

    if (mensagemWhatsapp && pedido.customer.whatsapp) {
      await prisma.whatsAppMessage.create({
        data: {
          orderId: id,
          customerId: pedido.customerId,
          phone: pedido.customer.whatsapp,
          templateType: status,
          content: mensagemWhatsapp,
          status: "PENDENTE",
        },
      });
    }

    return NextResponse.json({
      sucesso: true,
      pedido: pedidoAtualizado,
      mensagem: `Status atualizado para ${status}`,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao alterar status do pedido:", error);
    return NextResponse.json({ erro: "Erro interno ao atualizar status" }, { status: 500 });
  }
}
