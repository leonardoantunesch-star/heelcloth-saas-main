import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const movimentacaoSchema = z.object({
  type: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
  quantity: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  reason: z.string().min(2, "Motivo ou observação é obrigatório"),
});

// POST /api/estoque/[id]/movimentacao - Registra movimentação de estoque
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = movimentacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { type, quantity, reason } = parsed.data;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ erro: "Item não encontrado no estoque" }, { status: 404 });
    }

    const previousQty = item.quantity;
    let newQty: number;

    if (type === "ENTRADA") {
      newQty = previousQty + quantity;
    } else if (type === "SAIDA") {
      if (quantity > previousQty) {
        return NextResponse.json(
          {
            erro: `Saldo insuficiente em estoque! Saldo atual: ${previousQty} ${item.unit}. Quantidade requerida para saída: ${quantity} ${item.unit}.`,
          },
          { status: 400 }
        );
      }
      newQty = previousQty - quantity;
    } else {
      // AJUSTE: a quantidade informada se torna a nova quantidade real em estoque
      newQty = quantity;
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Atualizar saldo do item
      const itemAtualizado = await tx.inventoryItem.update({
        where: { id },
        data: { quantity: newQty },
      });

      // 2. Registrar movimentação
      const movimento = await tx.inventoryMovement.create({
        data: {
          itemId: id,
          type,
          quantity,
          previousQty,
          newQty,
          reason,
          userId: session.userId,
        },
        include: {
          user: { select: { name: true } },
        },
      });

      // 3. Auditoria
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: `ESTOQUE_${type}`,
          entity: "ESTOQUE",
          entityId: id,
          details: JSON.stringify({
            itemName: item.name,
            tipo: type,
            quantidade: quantity,
            saldoAnterior: previousQty,
            novoSaldo: newQty,
            motivo: reason,
          }),
        },
      });

      return { itemAtualizado, movimento };
    });

    const isBaixoEstoque = resultado.itemAtualizado.quantity <= resultado.itemAtualizado.minQuantity;

    return NextResponse.json({
      sucesso: true,
      mensagem: `Movimentação de ${type} registrada com sucesso! Novo saldo: ${newQty} ${item.unit}.`,
      item: {
        ...resultado.itemAtualizado,
        isBaixoEstoque,
      },
      movimento: resultado.movimento,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao registrar movimentação de estoque:", error);
    return NextResponse.json({ erro: "Erro ao registrar movimentação" }, { status: 500 });
  }
}
