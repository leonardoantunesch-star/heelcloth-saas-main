import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// As 8 etapas canônicas da confecção (Seção 10)
const ETAPAS_PRODUCAO = [
  "ARTE",
  "CORTE",
  "PERSONALIZACAO",
  "COSTURA",
  "ESTAMPA",
  "ACABAMENTO",
  "CONTROLE_QUALIDADE",
  "PRONTO",
] as const;

// GET /api/producao - Lista pedidos na esteira produtiva agrupados por etapa
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const etapa = searchParams.get("etapa")?.trim() || "";

    const now = new Date();

    const whereOrder: any = {
      // Excluir pedidos concluídos ou cancelados da esteira ativa
      status: { notIn: ["CONCLUIDO", "CANCELADO"] },
    };

    if (etapa) {
      whereOrder.productionOrder = { currentStage: etapa };
    }

    const pedidosNaEsteira = await prisma.order.findMany({
      where: whereOrder,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, whatsapp: true } },
        items: true,
        players: true,
        productionOrder: {
          include: {
            history: { orderBy: { createdAt: "desc" }, take: 3 },
          },
        },
        qualityCheck: true,
      },
    });

    // Formatar pedidos e computar atrasos
    const pedidos = pedidosNaEsteira.map((p) => {
      const prod = p.productionOrder;
      const totalCamisas = p.players.length > 0 ? p.players.length : p.items.reduce((acc, i) => acc + i.quantity, 0);

      const prazo = prod?.deadline || p.deliveryDeadline;
      const isAtrasado = Boolean(prazo && prazo < now && p.status !== "PRONTO");

      return {
        id: p.id,
        numero: p.orderNumber,
        cliente: p.customer.name,
        whatsapp: p.customer.whatsapp,
        statusGeral: p.status,
        etapaAtual: prod?.currentStage || "ARTE",
        statusEtapa: prod?.stageStatus || "PENDENTE",
        responsavel: prod?.responsible || "Não atribuído",
        prazo: prazo,
        isAtrasado,
        totalCamisas,
        jogadoresCount: p.players.length,
        notas: prod?.notes || p.notes,
        qualidadeConferida: Boolean(p.qualityCheck?.isApproved),
        historicoRecente: prod?.history || [],
      };
    });

    // Resumo de contagem por etapa para o pipeline
    const contadoresPorEtapa: Record<string, number> = {};
    ETAPAS_PRODUCAO.forEach((et) => {
      contadoresPorEtapa[et] = pedidos.filter((p) => p.etapaAtual === et).length;
    });

    const totalAtrasados = pedidos.filter((p) => p.isAtrasado).length;

    return NextResponse.json({
      sucesso: true,
      totalEmProducao: pedidos.length,
      totalAtrasados,
      contadoresPorEtapa,
      pedidos,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao listar produção:", error);
    return NextResponse.json({ erro: "Erro ao buscar esteira de produção" }, { status: 500 });
  }
}
