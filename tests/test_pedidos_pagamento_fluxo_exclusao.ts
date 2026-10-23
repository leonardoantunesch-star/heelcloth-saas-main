import { prisma } from "@/lib/db";
import { POST as postAvancar } from "@/app/api/pedidos/[id]/avancar/route";
import { POST as postPagamento } from "@/app/api/pedidos/[id]/pagamentos/route";
import { DELETE as deletePedido, GET as getPedido } from "@/app/api/pedidos/[id]/route";
import { NextRequest } from "next/server";
import { createToken } from "@/lib/auth";

async function testPedidosPagamentoFluxoExclusao() {
  console.log("🧪 Testando Sessão de Pagamento, Avanço de Fase & Exclusão de Pedidos...\n");
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

  // Obter usuário admin para os testes
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) {
    console.error("Usuário ADMIN não encontrado.");
    process.exit(1);
  }

  const token = createToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role as any,
    name: adminUser.name,
  });

  const authHeaders = {
    cookie: `heelcloth_session=${token}`,
    "Content-Type": "application/json",
  };

  try {
    // -------------------------------------------------------------
    // 1. Criar Cliente e Pedido de Teste
    // -------------------------------------------------------------
    console.log("--- 1. Criando Pedido de Teste no Banco ---");
    const customer = await prisma.customer.create({
      data: {
        name: "Time Teste FC",
        whatsapp: "11987654321",
        email: "teste@timefc.com",
      },
    });

    const orderNumber = `TESTE-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        totalAmount: 1000.0,
        paidAmount: 0.0,
        pendingAmount: 1000.0,
        status: "AGUARDANDO_APROVACAO",
        items: {
          create: [
            {
              product: "Camisa Dry Fit",
              quantity: 10,
              unitPrice: 100.0,
              totalPrice: 1000.0,
            },
          ],
        },
        players: {
          create: [
            {
              playerIndex: 1,
              name: "JOGADOR 1",
              number: "10",
              size: "M",
              model: "Jogador",
            },
          ],
        },
        productionOrder: {
          create: {
            currentStage: "ARTE",
            stageStatus: "PENDENTE",
          },
        },
      },
    });

    assert(order.id !== undefined, "Pedido de teste criado com sucesso");

    // -------------------------------------------------------------
    // 2. Testar Avanço de Fase (AGUARDANDO_APROVACAO -> APROVADO)
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando Avanço Rápido de Fase (Aguardando -> Aprovado) ---");
    const reqAvancar1 = new NextRequest(`http://localhost:3000/api/pedidos/${order.id}/avancar`, {
      method: "POST",
      headers: authHeaders,
    });

    const resAvancar1 = await postAvancar(reqAvancar1, {
      params: Promise.resolve({ id: order.id }),
    });

    assert(resAvancar1.status === 200, "Avanço de fase respondeu HTTP 200");
    const jsonAvancar1 = await resAvancar1.json();
    assert(jsonAvancar1.novoStatus === "APROVADO", "Status avançou para APROVADO");
    assert(jsonAvancar1.proximaSubsequente === "Pagamento Confirmado", "Próxima fase identificada como Pagamento Confirmado");

    // -------------------------------------------------------------
    // 3. Testar Registro de Parcela 1 (Entrada de 50% = R$ 500)
    // -------------------------------------------------------------
    console.log("\n--- 3. Testando Pagamento de Parcela de Entrada (50% = R$ 500) ---");
    const reqPagamento1 = new NextRequest(`http://localhost:3000/api/pedidos/${order.id}/pagamentos`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        amount: 500.0,
        paymentMethod: "PIX",
        notes: "Entrada 50% via PIX",
        atualizarStatus: true,
      }),
    });

    const resPagamento1 = await postPagamento(reqPagamento1, {
      params: Promise.resolve({ id: order.id }),
    });

    assert(resPagamento1.status === 200, "Registro de pagamento respondeu HTTP 200");
    const jsonPagamento1 = await resPagamento1.json();
    assert(jsonPagamento1.sucesso === true, "Pagamento marcado como sucesso");
    assert(jsonPagamento1.pedido.paidAmount === 500.0, "Valor pago atualizado para R$ 500.00");
    assert(jsonPagamento1.pedido.pendingAmount === 500.0, "Saldo pendente recalculado para R$ 500.00");
    assert(jsonPagamento1.pedido.status === "PAGAMENTO_CONFIRMADO", "Status atualizado para PAGAMENTO_CONFIRMADO");

    // Verificar se a transação financeira foi gravada
    const tx1 = await prisma.financialTransaction.findFirst({
      where: { orderId: order.id },
    });
    assert(tx1 !== null && tx1.amount === 500.0, "Transação de receita de R$ 500 registrada no módulo financeiro");
    assert(tx1?.status === "PAGO", "Status da transação financeira gravado como PAGO");

    // -------------------------------------------------------------
    // 4. Testar Avanço para Produção (PAGAMENTO_CONFIRMADO -> EM_PRODUCAO)
    // -------------------------------------------------------------
    console.log("\n--- 4. Testando Avanço de Fase para EM_PRODUCAO ---");
    const reqAvancar2 = new NextRequest(`http://localhost:3000/api/pedidos/${order.id}/avancar`, {
      method: "POST",
      headers: authHeaders,
    });

    const resAvancar2 = await postAvancar(reqAvancar2, {
      params: Promise.resolve({ id: order.id }),
    });

    assert(resAvancar2.status === 200, "Avanço para produção respondeu HTTP 200");
    const jsonAvancar2 = await resAvancar2.json();
    assert(jsonAvancar2.novoStatus === "EM_PRODUCAO", "Status avançou para EM_PRODUCAO");

    // Verificar se a ordem de produção foi sincronizada
    const prodOrder = await prisma.productionOrder.findUnique({
      where: { orderId: order.id },
    });
    assert(prodOrder?.stageStatus === "EM_ANDAMENTO", "Esteira de produção sincronizada com EM_ANDAMENTO");

    // -------------------------------------------------------------
    // 5. Testar Pagamento da Segunda Parcela (R$ 500 = Quitação 100%)
    // -------------------------------------------------------------
    console.log("\n--- 5. Testando Pagamento da Segunda Parcela (R$ 500) ---");
    const reqPagamento2 = new NextRequest(`http://localhost:3000/api/pedidos/${order.id}/pagamentos`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        amount: 500.0,
        paymentMethod: "CARTAO",
        notes: "Segunda parcela quitada",
        atualizarStatus: false,
      }),
    });

    const resPagamento2 = await postPagamento(reqPagamento2, {
      params: Promise.resolve({ id: order.id }),
    });

    const jsonPagamento2 = await resPagamento2.json();
    assert(jsonPagamento2.pedido.paidAmount === 1000.0, "Valor total pago atingiu R$ 1000.00");
    assert(jsonPagamento2.pedido.pendingAmount === 0.0, "Saldo restante zerado (100% quitado)");

    // -------------------------------------------------------------
    // 6. Testar Exclusão do Pedido via DELETE /api/pedidos/[id]
    // -------------------------------------------------------------
    console.log("\n--- 6. Testando Exclusão do Pedido ---");
    const reqDelete = new NextRequest(`http://localhost:3000/api/pedidos/${order.id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    const resDelete = await deletePedido(reqDelete, {
      params: Promise.resolve({ id: order.id }),
    });

    assert(resDelete.status === 200, "Exclusão respondeu HTTP 200");
    const jsonDelete = await resDelete.json();
    assert(jsonDelete.sucesso === true, "Mensagem de sucesso retornada na exclusão");

    // Verificar que o pedido foi removido do banco
    const pedidoVerif = await prisma.order.findUnique({ where: { id: order.id } });
    assert(pedidoVerif === null, "Pedido não existe mais no banco de dados");

    const jogadoresVerif = await prisma.orderPlayer.findMany({ where: { orderId: order.id } });
    assert(jogadoresVerif.length === 0, "Camisas/jogadores vinculados foram removidos em cascata");

    // Limpar cliente de teste
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log("🧹 Limpeza concluída.");
  } catch (error) {
    console.error("Erro no teste de pagamento, avanço de fase e exclusão:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testPedidosPagamentoFluxoExclusao()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
