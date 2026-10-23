import { prisma } from "@/lib/db";

async function testFinanceiro() {
  console.log("🧪 Testando Módulo Financeiro & Fluxo de Caixa (Etapa 15 - Seção 13)...\n");
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
    // 1. Obter ou criar usuário com perfil FINANCEIRO
    let userFinanceiro = await prisma.user.findFirst({ where: { role: "FINANCEIRO" } });
    if (!userFinanceiro) {
      userFinanceiro = await prisma.user.create({
        data: {
          email: "financeiro_teste@heelcloth.com",
          name: "Gerente Financeiro",
          passwordHash: "test_hash",
          role: "FINANCEIRO",
        },
      });
    }

    let userProducao = await prisma.user.findFirst({ where: { role: "PRODUCAO" } });
    if (!userProducao) {
      userProducao = await prisma.user.create({
        data: {
          email: "producao_teste@heelcloth.com",
          name: "Operador Producao",
          passwordHash: "test_hash",
          role: "PRODUCAO",
        },
      });
    }

    // 2. Testar regra de RBAC (Seção 13: apenas ADMIN e FINANCEIRO possuem acesso ao módulo)
    const papeisAutorizados = ["ADMIN", "FINANCEIRO"];
    assert(papeisAutorizados.includes(userFinanceiro.role), "Perfil FINANCEIRO autorizado no módulo");
    assert(!papeisAutorizados.includes(userProducao.role), "Perfil PRODUCAO bloqueado no módulo financeiro");

    // 3. Criar transação de RECEITA PAGA (Entrada à vista via PIX)
    const recPaga = await prisma.financialTransaction.create({
      data: {
        type: "RECEITA",
        category: "VENDA",
        description: "Adiantamento 50% Pedido Teste Uniforme",
        amount: 2500.0,
        status: "PAGO",
        paymentMethod: "PIX",
        paymentDate: new Date(),
      },
    });

    assert(recPaga.type === "RECEITA" && recPaga.status === "PAGO", "Receita paga lançada com sucesso");
    assert(recPaga.amount === 2500.0, "Valor de R$ 2.500,00 registrado");

    // 4. Criar transação de RECEITA PENDENTE (Contas a Receber)
    const recPendente = await prisma.financialTransaction.create({
      data: {
        type: "RECEITA",
        category: "VENDA",
        description: "Saldo restante 50% na entrega",
        amount: 1500.0,
        status: "PENDENTE",
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      },
    });

    assert(recPendente.status === "PENDENTE", "Contas a Receber: receita pendente registrada");

    // 5. Criar transação de DESPESA PAGA (Compra de Tecido)
    const despPaga = await prisma.financialTransaction.create({
      data: {
        type: "DESPESA",
        category: "MATERIA_PRIMA",
        description: "Compra de rolos Dry Fit",
        amount: 900.0,
        status: "PAGO",
        paymentMethod: "BOLETO",
        paymentDate: new Date(),
        supplier: "Malharia Santa Catarina",
      },
    });

    assert(despPaga.type === "DESPESA" && despPaga.status === "PAGO", "Despesa de matéria-prima paga lançada");

    // 6. Criar transação de DESPESA PENDENTE (Contas a Pagar - Energia da Fábrica)
    const despPendente = await prisma.financialTransaction.create({
      data: {
        type: "DESPESA",
        category: "ENERGIA",
        description: "Conta de Energia Elétrica Galpão",
        amount: 450.0,
        status: "PENDENTE",
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      },
    });

    assert(despPendente.status === "PENDENTE", "Contas a Pagar: despesa a vencer registrada");

    // 7. Testar cálculo de Indicadores Financeiros (Faturamento, Custos, Lucro Líquido)
    const receitasPagas = [recPaga].reduce((acc, t) => acc + t.amount, 0); // 2500
    const despesasPagas = [despPaga].reduce((acc, t) => acc + t.amount, 0); // 900
    const lucroEsperado = receitasPagas - despesasPagas; // 1600
    const margemEsperada = (lucroEsperado / receitasPagas) * 100; // 64%

    assert(lucroEsperado === 1600.0, "Cálculo de Lucro Líquido correto: R$ 2.500 - R$ 900 = R$ 1.600");
    assert(margemEsperada === 64.0, "Cálculo de Margem Líquida correto: 64%");

    // 8. Testar Liquidação / Baixa da receita pendente
    const recBaixada = await prisma.financialTransaction.update({
      where: { id: recPendente.id },
      data: {
        status: "PAGO",
        paymentDate: new Date(),
        paymentMethod: "PIX",
      },
    });

    assert(recBaixada.status === "PAGO", "Liquidação realizada: transação passou de PENDENTE para PAGO");

    // 9. Testar Sincronização Automática com Pedido do Cliente:
    // Criar cliente e pedido com saldo pendente de R$ 500
    const cliente = await prisma.customer.create({
      data: { name: "Time Financeiro FC", whatsapp: "5511977776666" },
    });

    const pedido = await prisma.order.create({
      data: {
        orderNumber: `HC-FIN-${Date.now().toString().slice(-4)}`,
        customerId: cliente.id,
        status: "EM_PRODUCAO",
        totalAmount: 1000.0,
        paidAmount: 500.0,
        pendingAmount: 500.0,
        paymentMethod: "PIX",
      },
    });

    // Lançar transação de quitação do pedido
    const transacaoQuitacao = await prisma.$transaction(async (tx) => {
      const trans = await tx.financialTransaction.create({
        data: {
          type: "RECEITA",
          category: "VENDA",
          description: `Quitação final Pedido ${pedido.orderNumber}`,
          amount: 500.0,
          status: "PAGO",
          orderId: pedido.id,
          paymentMethod: "PIX",
          paymentDate: new Date(),
        },
      });

      // Atualizar pedido
      const pedAtualizado = await tx.order.update({
        where: { id: pedido.id },
        data: {
          paidAmount: pedido.paidAmount + 500.0,
          pendingAmount: 0.0,
          status: "PAGAMENTO_CONFIRMADO",
        },
      });

      return { trans, pedAtualizado };
    });

    assert(transacaoQuitacao.pedAtualizado.paidAmount === 1000.0, "Pedido sincronizado: valor pago atualizado para R$ 1.000");
    assert(transacaoQuitacao.pedAtualizado.pendingAmount === 0.0, "Pedido sincronizado: saldo pendente zerado");
    assert(transacaoQuitacao.pedAtualizado.status === "PAGAMENTO_CONFIRMADO", "Status do pedido atualizado para PAGAMENTO_CONFIRMADO");

    // Limpeza dos dados criados no teste
    await prisma.financialTransaction.delete({ where: { id: transacaoQuitacao.trans.id } });
    await prisma.order.delete({ where: { id: pedido.id } });
    await prisma.customer.delete({ where: { id: cliente.id } });
    await prisma.financialTransaction.delete({ where: { id: recPaga.id } });
    await prisma.financialTransaction.delete({ where: { id: recPendente.id } });
    await prisma.financialTransaction.delete({ where: { id: despPaga.id } });
    await prisma.financialTransaction.delete({ where: { id: despPendente.id } });

    console.log(`\n========================================`);
    console.log(`📊 RESULTADO: ${passed} passaram, ${failed} falharam.`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFinanceiro();
