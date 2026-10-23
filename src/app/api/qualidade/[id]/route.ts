import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>; // orderId
}

const checklistSchema = z.object({
  checkQuantity: z.boolean(),
  checkSizes: z.boolean(),
  checkNames: z.boolean(),
  checkNumbers: z.boolean(),
  checkModel: z.boolean(),
  checkPersonalization: z.boolean(),
  checkComplete: z.boolean(),
  observations: z.string().optional().nullable(),
});

// GET /api/qualidade/[id] - Obter checklist de conferência do pedido (Seção 11)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        qualityCheck: {
          include: {
            checkedBy: { select: { id: true, name: true, email: true } },
          },
        },
        players: { orderBy: { playerIndex: "asc" } },
        items: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      sucesso: true,
      pedido: {
        id: pedido.id,
        numero: pedido.orderNumber,
        totalPecas: pedido.players.length > 0 ? pedido.players.length : pedido.items.reduce((acc, i) => acc + i.quantity, 0),
        jogadores: pedido.players,
      },
      qualityCheck: pedido.qualityCheck || {
        checkQuantity: false,
        checkSizes: false,
        checkNames: false,
        checkNumbers: false,
        checkModel: false,
        checkPersonalization: false,
        checkComplete: false,
        isApproved: false,
        observations: null,
      },
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao obter qualidade:", error);
    return NextResponse.json({ erro: "Erro ao buscar controle de qualidade" }, { status: 500 });
  }
}

// POST /api/qualidade/[id] - Salvar conferência do checklist (Seção 11)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = checklistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      checkQuantity,
      checkSizes,
      checkNames,
      checkNumbers,
      checkModel,
      checkPersonalization,
      checkComplete,
      observations,
    } = parsed.data;

    // Regra da Seção 11: isApproved é verdadeiro se TODOS os 7 itens estiverem conferidos
    const isApproved =
      checkQuantity &&
      checkSizes &&
      checkNames &&
      checkNumbers &&
      checkModel &&
      checkPersonalization &&
      checkComplete;

    const checkAtualizado = await prisma.qualityCheck.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        checkQuantity,
        checkSizes,
        checkNames,
        checkNumbers,
        checkModel,
        checkPersonalization,
        checkComplete,
        isApproved,
        observations: observations || null,
        checkedById: session.userId,
        checkedAt: isApproved ? new Date() : null,
      },
      update: {
        checkQuantity,
        checkSizes,
        checkNames,
        checkNumbers,
        checkModel,
        checkPersonalization,
        checkComplete,
        isApproved,
        observations: observations !== undefined ? observations : undefined,
        checkedById: session.userId,
        checkedAt: isApproved ? new Date() : null,
      },
      include: {
        checkedBy: { select: { name: true } },
      },
    });

    // Auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "QUALIDADE_CHECK",
        entity: "QUALIDADE",
        entityId: id,
        details: JSON.stringify({
          isApproved,
          conferente: session.name,
        }),
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: isApproved
        ? "Conferência de qualidade aprovada com sucesso! Pedido liberado para status 'Pronto'."
        : "Checklist de conferência atualizado (pendente de conclusão para liberação).",
      isApproved,
      qualityCheck: checkAtualizado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao salvar qualidade:", error);
    return NextResponse.json({ erro: "Erro ao salvar checklist de qualidade" }, { status: 500 });
  }
}
