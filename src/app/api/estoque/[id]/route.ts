import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const atualizarItemSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório").optional(),
  category: z.enum(["TECIDO", "MATERIAL", "PRODUTO", "EMBALAGEM", "OUTRO"]).optional(),
  unit: z.enum(["METRO", "UNIDADE", "KG", "ROLO", "PACOTE"]).optional(),
  minQuantity: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  supplier: z.string().optional().nullable(),
});

// GET /api/estoque/[id] - Detalhes do item com histórico de movimentações
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ erro: "Item não encontrado no estoque" }, { status: 404 });
    }

    const isBaixoEstoque = item.quantity <= item.minQuantity;
    const valorTotal = item.quantity * item.cost;

    return NextResponse.json({
      sucesso: true,
      item: {
        ...item,
        isBaixoEstoque,
        valorTotal,
      },
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao buscar item do estoque:", error);
    return NextResponse.json({ erro: "Erro ao buscar insumo" }, { status: 500 });
  }
}

// PUT /api/estoque/[id] - Atualiza dados cadastrais do item
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = atualizarItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const atualizado = await prisma.inventoryItem.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "EDITAR_ITEM_ESTOQUE",
        entity: "ESTOQUE",
        entityId: id,
        details: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Item do estoque atualizado com sucesso!",
      item: atualizado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao atualizar item do estoque:", error);
    return NextResponse.json({ erro: "Erro ao atualizar item" }, { status: 500 });
  }
}

// DELETE /api/estoque/[id] - Exclui item do estoque
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ erro: "Item não encontrado" }, { status: 404 });
    }

    await prisma.inventoryItem.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "EXCLUIR_ITEM_ESTOQUE",
        entity: "ESTOQUE",
        entityId: id,
        details: JSON.stringify({ name: item.name }),
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Item removido do estoque com sucesso!",
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao excluir item do estoque:", error);
    return NextResponse.json({ erro: "Erro ao excluir insumo" }, { status: 500 });
  }
}
