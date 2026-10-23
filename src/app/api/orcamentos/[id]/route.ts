import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum(["PENDENTE", "ENVIADO", "APROVADO", "RECUSADO"]),
});

// GET /api/orcamentos/[id] - Detalhes do orçamento
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const orcamento = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
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

    if (!orcamento) {
      return NextResponse.json(
        { erro: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ sucesso: true, orcamento });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao obter orçamento:", error);
    return NextResponse.json({ erro: "Erro interno no servidor" }, { status: 500 });
  }
}

// PUT /api/orcamentos/[id] - Atualizar status do orçamento
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Status inválido", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    const orcamentoAtual = await prisma.quote.findUnique({ where: { id } });
    if (!orcamentoAtual) {
      return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
    }

    if (orcamentoAtual.status === "CONVERTIDO") {
      return NextResponse.json(
        { erro: "Este orçamento já foi convertido em pedido e não pode ter seu status alterado." },
        { status: 400 }
      );
    }

    const orcamentoAtualizado = await prisma.quote.update({
      where: { id },
      data: { status },
    });

    // Auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "STATUS_CHANGE",
        entity: "ORCAMENTO",
        entityId: id,
        details: JSON.stringify({
          statusAnterior: orcamentoAtual.status,
          novoStatus: status,
        }),
      },
    });

    return NextResponse.json({ sucesso: true, orcamento: orcamentoAtualizado });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json({ erro: "Erro ao atualizar orçamento" }, { status: 500 });
  }
}

// DELETE /api/orcamentos/[id] - Excluir orçamento
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const orcamento = await prisma.quote.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!orcamento) {
      return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
    }

    if (orcamento.status === "CONVERTIDO" || orcamento.orders.length > 0) {
      return NextResponse.json(
        { erro: "Não é possível excluir um orçamento já convertido em pedido." },
        { status: 400 }
      );
    }

    await prisma.quote.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "EXCLUSAO",
        entity: "ORCAMENTO",
        entityId: id,
        details: JSON.stringify({ numero: orcamento.quoteNumber }),
      },
    });

    return NextResponse.json({ sucesso: true, mensagem: "Orçamento excluído com sucesso" });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao excluir orçamento:", error);
    return NextResponse.json({ erro: "Erro ao excluir orçamento" }, { status: 500 });
  }
}
