import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>; // orderId
}

const etapaSchema = z.object({
  novaEtapa: z.enum([
    "ARTE",
    "CORTE",
    "PERSONALIZACAO",
    "COSTURA",
    "ESTAMPA",
    "ACABAMENTO",
    "CONTROLE_QUALIDADE",
    "PRONTO",
  ]),
  statusEtapa: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "ATRASADO"]).default("EM_ANDAMENTO"),
  responsavel: z.string().optional(),
  prazo: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

// PATCH /api/producao/[id]/etapa - Avançar ou alterar etapa da esteira produtiva (Seção 10)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params; // orderId

    const body = await req.json();
    const parsed = etapaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { novaEtapa, statusEtapa, responsavel, prazo, observacao } = parsed.data;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        productionOrder: true,
        qualityCheck: true,
        customer: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    // REGRA DA SEÇÃO 11: Bloqueio estrito no backend antes de avançar para "PRONTO"
    if (novaEtapa === "PRONTO") {
      const qCheck = pedido.qualityCheck;
      const isConferido =
        qCheck &&
        qCheck.checkQuantity &&
        qCheck.checkSizes &&
        qCheck.checkNames &&
        qCheck.checkNumbers &&
        qCheck.checkModel &&
        qCheck.checkPersonalization &&
        qCheck.checkComplete;

      if (!isConferido) {
        return NextResponse.json(
          {
            erro: "Bloqueio de Qualidade (Seção 11): O pedido só pode avançar para a etapa 'Pronto' após a realização completa do checklist de controle de qualidade.",
            requerQualidade: true,
          },
          { status: 400 }
        );
      }
    }

    // Executar atualização da esteira e histórico
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Atualizar ou criar ProductionOrder
      const prodOrder = await tx.productionOrder.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          currentStage: novaEtapa,
          stageStatus: statusEtapa,
          responsible: responsavel || null,
          deadline: prazo ? new Date(prazo) : null,
          notes: observacao || null,
        },
        update: {
          currentStage: novaEtapa,
          stageStatus: statusEtapa,
          responsible: responsavel || undefined,
          deadline: prazo ? new Date(prazo) : undefined,
          notes: observacao || undefined,
          finishedAt: novaEtapa === "PRONTO" ? new Date() : undefined,
        },
      });

      // 2. Gravar no histórico de produção
      await tx.productionHistory.create({
        data: {
          productionOrderId: prodOrder.id,
          stage: novaEtapa,
          status: statusEtapa,
          responsible: responsavel || session.name,
          notes: observacao || `Etapa alterada para ${novaEtapa}`,
        },
      });

      // 3. Sincronizar status do pedido geral
      let orderStatusToSync = pedido.status;
      if (novaEtapa === "CONTROLE_QUALIDADE") {
        orderStatusToSync = "CONTROLE_QUALIDADE";
      } else if (novaEtapa === "PRONTO") {
        orderStatusToSync = "PRONTO";
      } else if (pedido.status !== "EM_PRODUCAO" && novaEtapa !== "ARTE") {
        orderStatusToSync = "EM_PRODUCAO";
      }

      if (orderStatusToSync !== pedido.status) {
        await tx.order.update({
          where: { id },
          data: { status: orderStatusToSync },
        });
      }

      // 4. Registrar em Auditoria
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "PRODUCAO_ETAPA",
          entity: "PRODUCAO",
          entityId: id,
          details: JSON.stringify({
            etapaAnterior: pedido.productionOrder?.currentStage,
            novaEtapa,
            responsavel,
          }),
        },
      });

      return prodOrder;
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `Pedido avançado para a etapa: ${novaEtapa}`,
      producao: resultado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao avançar etapa de produção:", error);
    return NextResponse.json({ erro: "Erro ao atualizar etapa de produção" }, { status: 500 });
  }
}
