import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const itemSchema = z.object({
  product: z.string().min(1, "Produto é obrigatório"),
  quantity: z.number().int().min(1, "Quantidade deve ser no mínimo 1"),
  size: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  playerName: z.string().optional().nullable(),
  playerNumber: z.string().optional().nullable(),
  personalization: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  unitPrice: z.number().min(0),
});

const pedidoSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  deliveryDeadline: z.string().optional().nullable(),
  paymentMethod: z.string().default("PIX"),
  paidAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "Ao menos um item deve ser adicionado ao pedido"),
});

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

// GET /api/pedidos - Listagem de pedidos com busca e filtro
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const clienteId = searchParams.get("clienteId")?.trim() || "";

    const where: any = {};
    if (clienteId) where.customerId = clienteId;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { orderNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { whatsapp: { contains: q } } },
      ];
    }

    const pedidos = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, name: true, whatsapp: true, phone: true },
        },
        items: true,
        players: true,
        productionOrder: {
          select: { currentStage: true, stageStatus: true },
        },
      },
    });

    return NextResponse.json({
      sucesso: true,
      total: pedidos.length,
      pedidos: pedidos.map((p) => ({
        id: p.id,
        numero: p.orderNumber,
        cliente: p.customer,
        status: p.status,
        totalAmount: p.totalAmount,
        paidAmount: p.paidAmount,
        pendingAmount: p.pendingAmount,
        paymentMethod: p.paymentMethod,
        prazo: p.deliveryDeadline,
        itensCount: p.players.length > 0 ? p.players.length : p.items.reduce((acc, i) => acc + i.quantity, 0),
        itens: p.items,
        jogadoresCount: p.players.length,
        etapaProducao: p.productionOrder?.currentStage || null,
        criadoEm: p.createdAt,
      })),
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao listar pedidos:", error);
    return NextResponse.json({ erro: "Erro ao buscar pedidos" }, { status: 500 });
  }
}

// POST /api/pedidos - Criar novo pedido
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = pedidoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { customerId, deliveryDeadline, paymentMethod, paidAmount, notes, items } = parsed.data;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
    }

    // Calcular valores totais
    let totalAmount = 0;
    const itemsData = items.map((i) => {
      const lineTotal = i.quantity * i.unitPrice;
      totalAmount += lineTotal;
      return {
        product: i.product.trim(),
        quantity: i.quantity,
        size: i.size || null,
        model: i.model || null,
        color: i.color || null,
        playerName: i.playerName || null,
        playerNumber: i.playerNumber || null,
        personalization: i.personalization || null,
        notes: i.notes || null,
        unitPrice: i.unitPrice,
        totalPrice: lineTotal,
      };
    });

    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const orderNumber = await gerarNumeroPedido();
    const prazo = deliveryDeadline ? new Date(deliveryDeadline) : new Date(Date.now() + 15 * 24 * 3600 * 1000);

    const novoPedido = await prisma.$transaction(async (tx) => {
      const pedido = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: paidAmount > 0 ? "PAGAMENTO_CONFIRMADO" : "AGUARDANDO_APROVACAO",
          totalAmount,
          paidAmount,
          pendingAmount,
          paymentMethod,
          deliveryDeadline: prazo,
          notes: notes ? notes.trim() : null,
          items: {
            create: itemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // Inicializar esteira de produção (Seção 10)
      await tx.productionOrder.create({
        data: {
          orderId: pedido.id,
          currentStage: "ARTE",
          stageStatus: "PENDENTE",
          deadline: prazo,
          notes: "Pedido iniciado manualmente.",
          history: {
            create: {
              stage: "ARTE",
              status: "INICIADO",
              notes: "Pedido criado no painel administrativo.",
            },
          },
        },
      });

      // Registrar auditoria
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "CRIACAO",
          entity: "PEDIDO",
          entityId: pedido.id,
          details: JSON.stringify({
            numero: pedido.orderNumber,
            cliente: customer.name,
            total: pedido.totalAmount,
          }),
        },
      });

      return pedido;
    });

    return NextResponse.json(
      { sucesso: true, pedido: novoPedido },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json({ erro: "Erro interno ao cadastrar pedido" }, { status: 500 });
  }
}
