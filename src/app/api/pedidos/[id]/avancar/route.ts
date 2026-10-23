import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Fluxo linear de fases do pedido da Heelcloth
const FLUXO_FASES: Record<string, { proximo: string | null; label: string; proximoLabel: string | null }> = {
  ORCAMENTO: { proximo: "APROVADO", label: "Orçamento", proximoLabel: "Aprovado" },
  AGUARDANDO_APROVACAO: { proximo: "APROVADO", label: "Aguardando Aprovação", proximoLabel: "Aprovado" },
  APROVADO: { proximo: "PAGAMENTO_CONFIRMADO", label: "Aprovado", proximoLabel: "Pagamento Confirmado" },
  PAGAMENTO_PENDENTE: { proximo: "PAGAMENTO_CONFIRMADO", label: "Pagamento Pendente", proximoLabel: "Pagamento Confirmado" },
  PAGAMENTO_CONFIRMADO: { proximo: "EM_PRODUCAO", label: "Pagamento Confirmado", proximoLabel: "Em Produção" },
  EM_PRODUCAO: { proximo: "CONTROLE_QUALIDADE", label: "Em Produção", proximoLabel: "Controle de Qualidade" },
  CONTROLE_QUALIDADE: { proximo: "PRONTO", label: "Controle de Qualidade", proximoLabel: "Pronto" },
  PRONTO: { proximo: "ENTREGUE", label: "Pronto", proximoLabel: "Entregue" },
  ENTREGUE: { proximo: "CONCLUIDO", label: "Entregue", proximoLabel: "Concluído" },
  CONCLUIDO: { proximo: null, label: "Concluído", proximoLabel: null },
  CANCELADO: { proximo: null, label: "Cancelado", proximoLabel: null },
  EM_ATRASO: { proximo: "EM_PRODUCAO", label: "Em Atraso", proximoLabel: "Em Produção" },
  AGUARDANDO_ALTERACAO: { proximo: "APROVADO", label: "Aguardando Alteração", proximoLabel: "Aprovado" },
};

// POST /api/pedidos/[id]/avancar - Avança imediatamente para a próxima fase do fluxo
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        qualityCheck: true,
        productionOrder: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    const configuracaoFase = FLUXO_FASES[pedido.status] || {
      proximo: "APROVADO",
      label: pedido.status,
      proximoLabel: "Aprovado",
    };

    const proximoStatus = configuracaoFase.proximo;

    if (!proximoStatus) {
      return NextResponse.json(
        { erro: `O pedido já está na fase final (${configuracaoFase.label}) e não pode mais avançar.` },
        { status: 400 }
      );
    }

    // REGRA DA SEÇÃO 11: Barreira de Qualidade antes do status PRONTO
    if (proximoStatus === "PRONTO") {
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
            erro: "Barreira de Qualidade (Seção 11): Para avançar para 'Pronto', todos os 7 itens do Checklist de Controle de Qualidade devem estar conferidos e aprovados.",
            linkQualidade: `/admin/producao/${id}/qualidade`,
          },
          { status: 400 }
        );
      }
    }

    // Atualizar status do pedido
    const pedidoAtualizado = await prisma.order.update({
      where: { id },
      data: { status: proximoStatus },
    });

    // Sincronizar esteira de produção caso avance para EM_PRODUCAO
    if (proximoStatus === "EM_PRODUCAO") {
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

    // Auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "AVANCO_FASE",
        entity: "PEDIDO",
        entityId: id,
        details: JSON.stringify({
          statusAnterior: pedido.status,
          novoStatus: proximoStatus,
        }),
      },
    });

    // Notificação WhatsApp automática se configurado (Seção 15)
    let mensagemWhatsapp: string | null = null;
    if (proximoStatus === "APROVADO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} foi APROVADO pela Heelcloth e aguarda confirmação de pagamento para entrada em produção.`;
    } else if (proximoStatus === "PAGAMENTO_CONFIRMADO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! O pagamento do seu pedido ${pedido.orderNumber} foi confirmado com sucesso.`;
    } else if (proximoStatus === "EM_PRODUCAO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} acaba de entrar na esteira de produção na nossa fábrica.`;
    } else if (proximoStatus === "PRONTO") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} está PRONTO e revisado com sucesso.`;
    } else if (proximoStatus === "ENTREGUE") {
      mensagemWhatsapp = `Olá ${pedido.customer.name}! Seu pedido ${pedido.orderNumber} foi entregue! Esperamos que gostem dos uniformes!`;
    }

    if (mensagemWhatsapp && pedido.customer.whatsapp) {
      await prisma.whatsAppMessage.create({
        data: {
          orderId: id,
          customerId: pedido.customerId,
          phone: pedido.customer.whatsapp,
          templateType: proximoStatus,
          content: mensagemWhatsapp,
          status: "PENDENTE",
        },
      });
    }

    const proximaSubsequente = FLUXO_FASES[proximoStatus]?.proximoLabel || null;

    return NextResponse.json({
      sucesso: true,
      mensagem: `Pedido avançou com sucesso de '${configuracaoFase.label}' para '${configuracaoFase.proximoLabel}'!`,
      statusAnterior: pedido.status,
      novoStatus: proximoStatus,
      proximaSubsequente,
      pedido: pedidoAtualizado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao avançar fase do pedido:", error);
    return NextResponse.json({ erro: "Erro interno ao avançar fase do pedido" }, { status: 500 });
  }
}
