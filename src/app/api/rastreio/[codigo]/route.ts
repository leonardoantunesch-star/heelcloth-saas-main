import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ipDe, limitar, textoEspera } from "@/lib/limite";

// Só os 4 últimos dígitos, comparados sem pontuação.
const finais = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "").slice(-4);

// "Maria da Silva" vira "Maria S." (o nome inteiro não sai do servidor).
function abreviarNome(nome?: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "Cliente";
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
}

// GET /api/rastreio/[codigo]?tel=1234 - consulta pública de rastreamento de pedido (Seção 8)
// Qualquer pessoa com o código vê a situação do pedido (etapas, prazo, pagamento), para o link do WhatsApp continuar funcionando.
// A lista de jogadores (nomes e números) só aparece com os 4 últimos dígitos do WhatsApp do pedido.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    let codigoFormatado = "";
    try {
      codigoFormatado = decodeURIComponent(codigo).trim().toUpperCase();
    } catch {
      return NextResponse.json({ erro: "Código do pedido inválido." }, { status: 400 });
    }

    if (!codigoFormatado || codigoFormatado.length > 40) {
      return NextResponse.json(
        { erro: "Código do pedido não fornecido" },
        { status: 400 }
      );
    }

    // Só aceita o formato do protocolo (ex.: HC-2610-0002). O id interno do banco não serve para consultar.
    if (!/^[A-Z0-9][A-Z0-9-]{4,28}$/.test(codigoFormatado)) {
      return NextResponse.json(
        { erro: "Pedido não encontrado. Verifique o número informado e tente novamente." },
        { status: 404 }
      );
    }

    // Limite por IP: segura quem tenta adivinhar códigos em massa.
    const lim = await limitar(`rastreio:ip:${ipDe(req)}`, 30, 600);
    if (!lim.ok) {
      return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429, headers: { "Retry-After": String(lim.esperaSeg) } });
    }

    const telInformado = finais(req.nextUrl.searchParams.get("tel"));
    // Palpites dos 4 dígitos: poucos por pedido, não importa de qual IP venham.
    if (telInformado.length === 4) {
      const limTel = await limitar(`rastreio:tel:${codigoFormatado.toUpperCase()}`, 8, 3600);
      if (!limTel.ok) {
        return NextResponse.json({ erro: textoEspera(limTel.esperaSeg) }, { status: 429, headers: { "Retry-After": String(limTel.esperaSeg) } });
      }
    }

    const pedido = await prisma.order.findFirst({
      where: { orderNumber: codigoFormatado },
      include: {
        customer: {
          select: {
            name: true,
            whatsapp: true,
            phone: true,
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

    // Só libera nomes e números quando os 4 últimos dígitos do telefone do pedido conferem.
    const detalhesLiberados =
      telInformado.length === 4 &&
      [finais(pedido.customer?.whatsapp), finais(pedido.customer?.phone)].includes(telInformado);

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
        orderNumber: pedido.orderNumber,
        status: pedido.status,
        etapaNumero,
        subEtapaFabril,
        statusEtapaProducao: pedido.productionOrder?.stageStatus || null,
        clienteNome: abreviarNome(pedido.customer?.name),
        createdAt: pedido.createdAt,
        prazoEntrega: pedido.deliveryDeadline,
        totalAmount: pedido.totalAmount,
        paidAmount: pedido.paidAmount,
        pendingAmount: Math.max(0, pedido.totalAmount - pedido.paidAmount),
        statusPagamento,
        totalPecas,
        qualidadeAprovada: pedido.qualityCheck?.isApproved || false,
        itens: pedido.items,
        detalhesLiberados,
        telIncorreto: telInformado.length === 4 && !detalhesLiberados,
        jogadores: detalhesLiberados ? pedido.players : [],
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
