import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const clienteUpdateSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().min(8, "WhatsApp é obrigatório"),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clientes/[id] - Obter detalhes completos do cliente
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const cliente = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            players: true,
          },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
        financialTransactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
    }

    const valorTotalGasto = cliente.orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const valorTotalPago = cliente.orders.reduce((acc, o) => acc + o.paidAmount, 0);
    const saldoPendente = cliente.orders.reduce((acc, o) => acc + o.pendingAmount, 0);

    return NextResponse.json({
      sucesso: true,
      cliente: {
        ...cliente,
        metricas: {
          totalPedidos: cliente.orders.length,
          totalOrcamentos: cliente.quotes.length,
          valorTotalGasto,
          valorTotalPago,
          saldoPendente,
          ultimoPedido: cliente.orders[0] || null,
        },
      },
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao carregar cliente:", error);
    return NextResponse.json({ erro: "Erro interno no servidor" }, { status: 500 });
  }
}

// PUT /api/clientes/[id] - Atualizar dados do cliente
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = clienteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, document, phone, whatsapp, email, address, notes } = parsed.data;

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    const clienteAtualizado = await prisma.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        document: document ? document.trim() : null,
        phone: phone ? phone.trim() : null,
        whatsapp: cleanWhatsapp,
        email: email && email.trim() !== "" ? email.trim().toLowerCase() : null,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    // Auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "ATUALIZACAO",
        entity: "CLIENTE",
        entityId: clienteAtualizado.id,
        details: JSON.stringify({
          nome: clienteAtualizado.name,
          whatsapp: clienteAtualizado.whatsapp,
        }),
      },
    });

    return NextResponse.json({ sucesso: true, cliente: clienteAtualizado });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ erro: "Erro ao atualizar dados do cliente" }, { status: 500 });
  }
}

// DELETE /api/clientes/[id] - Excluir cliente
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const pedidosCount = await prisma.order.count({ where: { customerId: id } });
    if (pedidosCount > 0) {
      return NextResponse.json(
        { erro: "Não é possível excluir um cliente com pedidos vinculados. Preserve o histórico." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "EXCLUSAO",
        entity: "CLIENTE",
        entityId: id,
      },
    });

    return NextResponse.json({ sucesso: true, mensagem: "Cliente excluído com sucesso" });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ erro: "Erro ao excluir cliente" }, { status: 500 });
  }
}
