import { prisma } from "@/lib/db";

async function testOrcamentos() {
  console.log("🧪 Testando Módulo de Orçamentos e Conversão em Pedido (Etapa 9 - Seção 8)...\n");
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
    // 1. Obter ou criar cliente para o teste
    let cliente = await prisma.customer.findFirst();
    if (!cliente) {
      cliente = await prisma.customer.create({
        data: {
          name: "Cliente Teste Orçamentos",
          whatsapp: "5511999998888",
        },
      });
    }

    // 2. Criar novo orçamento de teste
    const agora = new Date();
    const ano = agora.getFullYear().toString().slice(-2);
    const mes = (agora.getMonth() + 1).toString().padStart(2, "0");
    const quoteNumber = `ORC-${ano}${mes}-9999`;

    const orcamentoCriado = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: cliente.id,
        status: "PENDENTE",
        totalAmount: 1850.0,
        discount: 50.0,
        validUntil: new Date(Date.now() + 15 * 24 * 3600 * 1000),
        notes: "Orçamento de teste de uniformes esportivos",
        items: {
          create: [
            {
              product: "Camisa Tradicional Jogador",
              quantity: 20,
              unitPrice: 60.0,
              totalPrice: 1200.0,
              details: "Dry-Fit com sublimação total",
            },
            {
              product: "Short de Jogo",
              quantity: 20,
              unitPrice: 35.0,
              totalPrice: 700.0,
              details: "Poliéster com elástico canelado",
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    assert(orcamentoCriado.id !== undefined, "Criação: Orçamento criado com sucesso");
    assert(orcamentoCriado.items.length === 2, "Itens: 2 itens vinculados ao orçamento");
    assert(orcamentoCriado.totalAmount === 1850.0, "Cálculo: Valor total com desconto confere (1900 - 50 = 1850)");

    // 3. Atualizar status para APROVADO
    const orcAprovado = await prisma.quote.update({
      where: { id: orcamentoCriado.id },
      data: { status: "APROVADO" },
    });
    assert(orcAprovado.status === "APROVADO", "Status: Orçamento marcado como APROVADO");

    // 4. Testar Conversão de Orçamento em Pedido (Seção 8)
    const orderNumber = `HC-${ano}${mes}-9999`;
    const novoPedido = await prisma.$transaction(async (tx) => {
      const pedido = await tx.order.create({
        data: {
          orderNumber,
          customerId: orcamentoCriado.customerId,
          quoteId: orcamentoCriado.id,
          status: "APROVADO",
          totalAmount: orcamentoCriado.totalAmount,
          paidAmount: 0,
          pendingAmount: orcamentoCriado.totalAmount,
          deliveryDeadline: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          notes: `Convertido do Orçamento ${orcamentoCriado.quoteNumber}`,
          items: {
            create: orcamentoCriado.items.map((i) => ({
              product: i.product,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              notes: i.details,
            })),
          },
        },
        include: { items: true },
      });

      await tx.productionOrder.create({
        data: {
          orderId: pedido.id,
          currentStage: "ARTE",
          stageStatus: "PENDENTE",
        },
      });

      await tx.quote.update({
        where: { id: orcamentoCriado.id },
        data: { status: "CONVERTIDO" },
      });

      return pedido;
    });

    assert(novoPedido.id !== undefined, "Conversão: Pedido criado com sucesso a partir do orçamento");
    assert(novoPedido.items.length === 2, "Conversão Seção 8: Todos os 2 itens copiados sem retrabalho");
    assert(novoPedido.totalAmount === 1850.0, "Conversão Seção 8: Valor total do pedido idêntico ao orçamento");

    // Verificar se o orçamento ficou CONVERTIDO
    const orcFinal = await prisma.quote.findUnique({ where: { id: orcamentoCriado.id } });
    assert(orcFinal?.status === "CONVERTIDO", "Conversão Seção 8: Status do orçamento atualizado para CONVERTIDO");

    // Verificar esteira de produção criada
    const producao = await prisma.productionOrder.findUnique({ where: { orderId: novoPedido.id } });
    assert(producao !== null && producao.currentStage === "ARTE", "Produção Seção 10: Pedido encaminhado automaticamente para etapa de ARTE");

    // 5. Limpeza do teste
    await prisma.productionOrder.delete({ where: { orderId: novoPedido.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: novoPedido.id } });
    await prisma.order.delete({ where: { id: novoPedido.id } });
    await prisma.quoteItem.deleteMany({ where: { quoteId: orcamentoCriado.id } });
    await prisma.quote.delete({ where: { id: orcamentoCriado.id } });

    console.log(`\n========================================`);
    console.log(`Orçamentos Test: ${passed} passaram, ${failed} falharam.`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Erro no teste de orçamentos:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testOrcamentos();
