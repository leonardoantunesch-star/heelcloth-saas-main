import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const clienteSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório e deve ter ao menos 2 caracteres"),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().min(8, "WhatsApp é obrigatório para comunicação de status"),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/clientes - Listagem de clientes com busca e métricas
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    const whereClause = q
      ? {
          OR: [
            { name: { contains: q } },
            { document: { contains: q } },
            { whatsapp: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {};

    const clientes = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    const resultado = clientes.map((c) => {
      const totalPedidos = c.orders.length;
      const totalOrcamentos = c.quotes.length;
      const valorTotalGasto = c.orders.reduce((acc, o) => acc + o.totalAmount, 0);
      const ultimoPedido = c.orders[0] || null;

      return {
        id: c.id,
        name: c.name,
        document: c.document,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        address: c.address,
        notes: c.notes,
        totalPedidos,
        totalOrcamentos,
        valorTotalGasto,
        ultimoPedido: ultimoPedido
          ? {
              id: ultimoPedido.id,
              numero: ultimoPedido.orderNumber,
              status: ultimoPedido.status,
              data: ultimoPedido.createdAt,
            }
          : null,
        criadoEm: c.createdAt,
      };
    });

    return NextResponse.json({
      sucesso: true,
      total: resultado.length,
      clientes: resultado,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao listar clientes:", error);
    return NextResponse.json(
      { erro: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST /api/clientes - Cadastrar novo cliente
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = clienteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, document, phone, whatsapp, email, address, notes } = parsed.data;

    // Normalizar números de contato
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    const novoCliente = await prisma.customer.create({
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

    // Registrar no histórico de auditoria (Seção 18)
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CRIACAO",
        entity: "CLIENTE",
        entityId: novoCliente.id,
        details: JSON.stringify({
          nome: novoCliente.name,
          whatsapp: novoCliente.whatsapp,
          documento: novoCliente.document,
        }),
      },
    });

    return NextResponse.json(
      { sucesso: true, cliente: novoCliente },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao cadastrar cliente:", error);
    return NextResponse.json(
      { erro: "Erro interno ao cadastrar cliente" },
      { status: 500 }
    );
  }
}
