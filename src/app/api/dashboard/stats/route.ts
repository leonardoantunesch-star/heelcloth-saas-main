import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Validar autenticação no backend
    await requireAuth();

    const now = new Date();

    // 2. Consultas e agregações paralelas no Prisma
    const [
      totalPedidos,
      pedidosEmProducao,
      pedidosAguardandoAprovacao,
      pedidosConcluidos,
      pedidosAtrasados,
      totalClientes,
      somaPedidos,
      receitasPagas,
      receitasPendentes,
      despesasPagar,
      despesasPagas,
      pedidosRecentes,
    ] = await Promise.all([
      // Total de pedidos
      prisma.order.count(),

      // Pedidos em produção
      prisma.order.count({
        where: { status: "EM_PRODUCAO" },
      }),

      // Aguardando aprovação
      prisma.order.count({
        where: { status: "AGUARDANDO_APROVACAO" },
      }),

      // Pedidos concluídos
      prisma.order.count({
        where: { status: { in: ["CONCLUIDO", "ENTREGUE", "PRONTO"] } },
      }),

      // Pedidos atrasados (status marcado como EM_ATRASO ou prazo expirado e não concluído)
      prisma.order.count({
        where: {
          OR: [
            { status: "EM_ATRASO" },
            {
              deliveryDeadline: { lt: now },
              status: { notIn: ["CONCLUIDO", "ENTREGUE", "CANCELADO"] },
            },
          ],
        },
      }),

      // Total de clientes
      prisma.customer.count(),

      // Soma total de pedidos
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
          paidAmount: true,
          pendingAmount: true,
        },
      }),

      // Receitas pagas no financeiro
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "RECEITA", status: "PAGO" },
      }),

      // Valores a receber
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "RECEITA", status: "PENDENTE" },
      }),

      // Valores a pagar
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "DESPESA", status: "PENDENTE" },
      }),

      // Despesas já pagas
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "DESPESA", status: "PAGO" },
      }),

      // Últimos pedidos
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { name: true, phone: true },
          },
          items: true,
          players: true,
        },
      }),
    ]);

    // Faturamento: se houver transações financeiras pagas, usa a soma dos pedidos ou receitas
    const faturamento = somaPedidos._sum.totalAmount || receitasPagas._sum.amount || 0;
    const aReceber = somaPedidos._sum.pendingAmount ?? receitasPendentes._sum.amount ?? 0;
    const aPagar = despesasPagar._sum.amount ?? 0;
    const totalDespesas = despesasPagas._sum.amount ?? 0;
    const lucro = faturamento - totalDespesas;

    return NextResponse.json({
      sucesso: true,
      indicadores: {
        totalPedidos,
        pedidosEmProducao,
        pedidosAguardandoAprovacao,
        pedidosConcluidos,
        pedidosAtrasados,
        totalClientes,
        faturamento,
        valoresAReceber: aReceber,
        valoresAPagar: aPagar,
        lucro,
      },
      pedidosRecentes: pedidosRecentes.map((p) => ({
        id: p.id,
        numero: p.orderNumber,
        cliente: p.customer.name,
        telefone: p.customer.phone,
        status: p.status,
        totalItens: p.players.length > 0 ? p.players.length : p.items.reduce((acc, i) => acc + i.quantity, 0),
        valorTotal: p.totalAmount,
        valorPago: p.paidAmount,
        prazo: p.deliveryDeadline,
        criadoEm: p.createdAt,
      })),
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ erro: "Acesso não autorizado" }, { status: 401 });
    }
    console.error("Erro ao carregar estatísticas do dashboard:", error);
    return NextResponse.json(
      { erro: "Erro interno ao carregar estatísticas do dashboard" },
      { status: 500 }
    );
  }
}
