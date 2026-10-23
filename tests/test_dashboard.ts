import { prisma } from "@/lib/db";

async function testDashboard() {
  console.log("🧪 Testando métricas reais do Dashboard (Etapa 7 - Seção 4)...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    const now = new Date();

    const [
      totalPedidos,
      pedidosEmProducao,
      pedidosAguardandoAprovacao,
      pedidosConcluidos,
      pedidosAtrasados,
      somaPedidos,
      receitasPagas,
      receitasPendentes,
      despesasPagar,
      despesasPagas,
      pedidosRecentes,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "EM_PRODUCAO" } }),
      prisma.order.count({ where: { status: "AGUARDANDO_APROVACAO" } }),
      prisma.order.count({ where: { status: { in: ["CONCLUIDO", "ENTREGUE", "PRONTO"] } } }),
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
      prisma.order.aggregate({
        _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "RECEITA", status: "PAGO" },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "RECEITA", status: "PENDENTE" },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "DESPESA", status: "PENDENTE" },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "DESPESA", status: "PAGO" },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, players: true, items: true },
      }),
    ]);

    const faturamento = somaPedidos._sum.totalAmount || receitasPagas._sum.amount || 0;
    const aReceber = somaPedidos._sum.pendingAmount ?? receitasPendentes._sum.amount ?? 0;
    const aPagar = despesasPagar._sum.amount ?? 0;
    const totalDespesas = despesasPagas._sum.amount ?? 0;
    const lucro = faturamento - totalDespesas;

    assert(totalPedidos > 0, `Total de pedidos contabilizado: ${totalPedidos}`);
    assert(pedidosEmProducao > 0, `Pedidos em produção contabilizado: ${pedidosEmProducao}`);
    assert(pedidosAguardandoAprovacao >= 0, `Pedidos aguardando aprovação contabilizado: ${pedidosAguardandoAprovacao}`);
    assert(pedidosConcluidos >= 0, `Pedidos concluídos contabilizado: ${pedidosConcluidos}`);
    assert(pedidosAtrasados >= 0, `Pedidos atrasados contabilizado: ${pedidosAtrasados}`);
    assert(faturamento > 0, `Faturamento operacional: R$ ${faturamento.toFixed(2)}`);
    assert(aReceber > 0, `Valores a receber de clientes: R$ ${aReceber.toFixed(2)}`);
    assert(aPagar >= 0, `Valores a pagar para fornecedores: R$ ${aPagar.toFixed(2)}`);
    assert(lucro > 0, `Lucro calculado: R$ ${lucro.toFixed(2)}`);
    assert(pedidosRecentes.length > 0, `Lista de pedidos recentes retornou: ${pedidosRecentes.length} itens`);
    assert(pedidosRecentes[0].customer.name.length > 0, `Pedido recente vinculado a cliente válido: ${pedidosRecentes[0].customer.name}`);

    console.log(`\n========================================`);
    console.log(`Dashboard Test: ${passed} passaram, ${failed} falharam.`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Erro no teste de dashboard:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboard();
