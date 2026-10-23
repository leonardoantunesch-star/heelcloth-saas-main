import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const novaTransacaoSchema = z.object({
  type: z.enum(["RECEITA", "DESPESA"]),
  category: z.enum([
    "VENDA",
    "MATERIA_PRIMA",
    "MAQUINARIO",
    "ENERGIA",
    "SALARIO",
    "COMISSAO",
    "ALUGUEL",
    "OUTRO",
  ]),
  description: z.string().min(2, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  dueDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  paymentMethod: z.enum(["PIX", "BOLETO", "CARTAO", "TRANSFERENCIA", "DINHEIRO"]).optional().nullable(),
  status: z.enum(["PENDENTE", "PAGO", "CANCELADO"]).default("PENDENTE"),
  orderId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
});

// GET /api/financeiro - Listagem de transações, filtros e indicadores da Seção 13
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "FINANCEIRO"]);

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const periodo = searchParams.get("periodo")?.trim() || "mes"; // hoje | 7dias | mes | ano | todos
    const busca = searchParams.get("busca")?.trim() || "";

    const where: any = {};

    if (tipo && tipo !== "TODOS") {
      where.type = tipo;
    }

    if (status && status !== "TODOS") {
      where.status = status;
    }

    if (busca) {
      where.OR = [
        { description: { contains: busca } },
        { supplier: { contains: busca } },
        { customer: { name: { contains: busca } } },
        { order: { orderNumber: { contains: busca } } },
      ];
    }

    // Filtro temporal
    const now = new Date();
    if (periodo === "hoje") {
      const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: inicio };
    } else if (periodo === "7dias") {
      const seteDiasAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      where.createdAt = { gte: seteDiasAtras };
    } else if (periodo === "mes") {
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
      where.createdAt = { gte: inicioMes };
    } else if (periodo === "ano") {
      const inicioAno = new Date(now.getFullYear(), 0, 1);
      where.createdAt = { gte: inicioAno };
    }

    const transacoes = await prisma.financialTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { id: true, orderNumber: true } },
        customer: { select: { id: true, name: true, whatsapp: true } },
      },
    });

    // Calcular Indicadores Financeiros (Seção 13)
    const todasTransacoesPeriodo = await prisma.financialTransaction.findMany({
      where: {
        createdAt: where.createdAt || undefined,
      },
    });

    let totalReceitasPagas = 0;
    let totalDespesasPagas = 0;
    let aReceber = 0;
    let aPagar = 0;

    todasTransacoesPeriodo.forEach((t) => {
      if (t.type === "RECEITA") {
        if (t.status === "PAGO") totalReceitasPagas += t.amount;
        else if (t.status === "PENDENTE") aReceber += t.amount;
      } else if (t.type === "DESPESA") {
        if (t.status === "PAGO") totalDespesasPagas += t.amount;
        else if (t.status === "PENDENTE") aPagar += t.amount;
      }
    });

    const lucroLiquido = totalReceitasPagas - totalDespesasPagas;
    const margemLucro = totalReceitasPagas > 0 ? (lucroLiquido / totalReceitasPagas) * 100 : 0;

    return NextResponse.json({
      sucesso: true,
      indicadores: {
        totalReceitasPagas,
        totalDespesasPagas,
        lucroLiquido,
        margemLucro: Number(margemLucro.toFixed(1)),
        aReceber,
        aPagar,
        totalTransacoes: transacoes.length,
      },
      transacoes,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { erro: "Acesso restrito ao perfil Administrador e Financeiro (Seção 13)" },
        { status: 403 }
      );
    }
    console.error("Erro ao listar transações financeiras:", error);
    return NextResponse.json({ erro: "Erro ao buscar dados financeiros" }, { status: 500 });
  }
}

// POST /api/financeiro - Cadastrar nova receita ou despesa
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "FINANCEIRO"]);

    const body = await req.json();
    const parsed = novaTransacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      type,
      category,
      description,
      amount,
      dueDate,
      paymentDate,
      paymentMethod,
      status,
      orderId,
      customerId,
      supplier,
    } = parsed.data;

    const transacao = await prisma.$transaction(async (tx) => {
      const nova = await tx.financialTransaction.create({
        data: {
          type,
          category,
          description,
          amount,
          dueDate: dueDate ? new Date(dueDate) : null,
          paymentDate: paymentDate ? new Date(paymentDate) : status === "PAGO" ? new Date() : null,
          paymentMethod: paymentMethod || null,
          status,
          orderId: orderId || null,
          customerId: customerId || null,
          supplier: supplier || null,
        },
      });

      // Se for pagamento vinculado a um pedido e status for PAGO, atualizar o pedido
      if (orderId && type === "RECEITA" && status === "PAGO") {
        const ped = await tx.order.findUnique({ where: { id: orderId } });
        if (ped) {
          const novoPago = ped.paidAmount + amount;
          const novoPendente = Math.max(0, ped.totalAmount - novoPago);
          await tx.order.update({
            where: { id: orderId },
            data: {
              paidAmount: novoPago,
              pendingAmount: novoPendente,
            },
          });
        }
      }

      // Log de Auditoria (Seção 18)
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: `FINANCEIRO_${type}`,
          entity: "FINANCEIRO",
          entityId: nova.id,
          details: JSON.stringify({ description, amount, type, category, status }),
        },
      });

      return nova;
    });

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: `${type === "RECEITA" ? "Receita" : "Despesa"} lançada com sucesso!`,
        transacao,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ erro: "Acesso restrito ao perfil Financeiro" }, { status: 403 });
    }
    console.error("Erro ao criar transação financeira:", error);
    return NextResponse.json({ erro: "Erro ao lançar transação financeira" }, { status: 500 });
  }
}
