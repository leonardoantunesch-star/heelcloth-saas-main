import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const novoItemSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  category: z.enum(["TECIDO", "MATERIAL", "PRODUTO", "EMBALAGEM", "OUTRO"]).default("TECIDO"),
  unit: z.enum(["METRO", "UNIDADE", "KG", "ROLO", "PACOTE"]).default("UNIDADE"),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(10),
  cost: z.number().min(0).default(0),
  supplier: z.string().optional().nullable(),
});

// GET /api/estoque - Lista itens de estoque com filtros e métricas
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const busca = searchParams.get("busca")?.trim() || "";
    const categoria = searchParams.get("categoria")?.trim() || "";
    const apenasBaixo = searchParams.get("baixoEstoque") === "true";

    const where: any = {};

    if (busca) {
      where.OR = [
        { name: { contains: busca } },
        { supplier: { contains: busca } },
      ];
    }

    if (categoria && categoria !== "TODOS") {
      where.category = categoria;
    }

    const todosItens = await prisma.inventoryItem.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { movements: true } },
      },
    });

    // Mapear itens e identificar alertas de estoque baixo
    const itens = todosItens.map((item) => {
      const isBaixoEstoque = item.quantity <= item.minQuantity;
      const valorTotal = item.quantity * item.cost;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        cost: item.cost,
        supplier: item.supplier,
        isBaixoEstoque,
        valorTotal,
        totalMovimentacoes: item._count.movements,
        updatedAt: item.updatedAt,
      };
    });

    const itensFiltrados = apenasBaixo ? itens.filter((i) => i.isBaixoEstoque) : itens;

    // Métricas gerais de estoque (Seção 12)
    const totalItens = todosItens.length;
    const totalValorEstoque = todosItens.reduce((acc, i) => acc + i.quantity * i.cost, 0);
    const totalItensCriticos = todosItens.filter((i) => i.quantity <= i.minQuantity).length;

    return NextResponse.json({
      sucesso: true,
      metricas: {
        totalItens,
        totalValorEstoque,
        totalItensCriticos,
      },
      itens: itensFiltrados,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao listar estoque:", error);
    return NextResponse.json({ erro: "Erro ao buscar itens de estoque" }, { status: 500 });
  }
}

// POST /api/estoque - Cadastra novo insumo/tecido no estoque
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = novoItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, category, unit, quantity, minQuantity, cost, supplier } = parsed.data;

    const item = await prisma.$transaction(async (tx) => {
      const novo = await tx.inventoryItem.create({
        data: {
          name,
          category,
          unit,
          quantity,
          minQuantity,
          cost,
          supplier: supplier || null,
        },
      });

      // Se cadastrado já com saldo inicial, registrar movimento de ENTRADA
      if (quantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            itemId: novo.id,
            type: "ENTRADA",
            quantity: quantity,
            previousQty: 0,
            newQty: quantity,
            reason: "Saldo inicial no cadastro de insumo",
            userId: session.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "CRIAR_ITEM_ESTOQUE",
          entity: "ESTOQUE",
          entityId: novo.id,
          details: JSON.stringify({ name, category, quantity, cost }),
        },
      });

      return novo;
    });

    return NextResponse.json(
      { sucesso: true, mensagem: "Item cadastrado no estoque com sucesso!", item },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao cadastrar item de estoque:", error);
    return NextResponse.json({ erro: "Erro ao cadastrar insumo no estoque" }, { status: 500 });
  }
}
