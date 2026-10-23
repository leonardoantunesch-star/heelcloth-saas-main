import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const itemSchema = z.object({
  product: z.string().min(1, "Nome do produto é obrigatório"),
  quantity: z.number().int().min(1, "Quantidade deve ser no mínimo 1"),
  unitPrice: z.number().min(0, "Preço unitário não pode ser negativo"),
  details: z.string().optional().nullable(),
});

const orcamentoSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  items: z.array(itemSchema).min(1, "Ao menos um item deve ser adicionado ao orçamento"),
  discount: z.number().min(0).default(0),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Gera número sequencial de orçamento no formato ORC-YYMM-XXXX
async function gerarNumeroOrcamento(): Promise<string> {
  const agora = new Date();
  const ano = agora.getFullYear().toString().slice(-2);
  const mes = (agora.getMonth() + 1).toString().padStart(2, "0");
  const prefixo = `ORC-${ano}${mes}-`;

  const ultimo = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefixo } },
    orderBy: { quoteNumber: "desc" },
    select: { quoteNumber: true },
  });

  let sequencia = 1;
  if (ultimo?.quoteNumber) {
    const partes = ultimo.quoteNumber.split("-");
    if (partes.length === 3) {
      const num = parseInt(partes[2], 10);
      if (!isNaN(num)) sequencia = num + 1;
    }
  }

  return `${prefixo}${sequencia.toString().padStart(4, "0")}`;
}

// GET /api/orcamentos - Listagem de orçamentos com filtro e busca
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const clienteId = searchParams.get("clienteId")?.trim() || "";

    const where: any = {};

    if (clienteId) {
      where.customerId = clienteId;
    }

    if (status) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { quoteNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { whatsapp: { contains: q } } },
      ];
    }

    const orcamentos = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
            email: true,
          },
        },
        items: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      sucesso: true,
      total: orcamentos.length,
      orcamentos: orcamentos.map((o) => ({
        id: o.id,
        numero: o.quoteNumber,
        cliente: o.customer,
        status: o.status,
        valorTotal: o.totalAmount,
        desconto: o.discount,
        itensCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        itens: o.items,
        validade: o.validUntil,
        observacoes: o.notes,
        pedidoVinculado: o.orders[0] || null,
        criadoEm: o.createdAt,
      })),
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao listar orçamentos:", error);
    return NextResponse.json(
      { erro: "Erro ao buscar orçamentos" },
      { status: 500 }
    );
  }
}

// POST /api/orcamentos - Criar novo orçamento
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = orcamentoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { customerId, items, discount, validUntil, notes } = parsed.data;

    // Validar se cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json(
        { erro: "Cliente informado não foi encontrado" },
        { status: 404 }
      );
    }

    // Calcular valores totais
    let subtotal = 0;
    const itemsData = items.map((i) => {
      const itemTotal = i.quantity * i.unitPrice;
      subtotal += itemTotal;
      return {
        product: i.product.trim(),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: itemTotal,
        details: i.details ? i.details.trim() : null,
      };
    });

    const valorFinal = Math.max(0, subtotal - discount);
    const quoteNumber = await gerarNumeroOrcamento();

    const novoOrcamento = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        status: "PENDENTE",
        totalAmount: valorFinal,
        discount,
        validUntil: validUntil ? new Date(validUntil) : null,
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

    // Auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CRIACAO",
        entity: "ORCAMENTO",
        entityId: novoOrcamento.id,
        details: JSON.stringify({
          numero: novoOrcamento.quoteNumber,
          cliente: customer.name,
          valor: novoOrcamento.totalAmount,
        }),
      },
    });

    return NextResponse.json(
      { sucesso: true, orcamento: novoOrcamento },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json(
      { erro: "Erro interno ao cadastrar orçamento" },
      { status: 500 }
    );
  }
}
