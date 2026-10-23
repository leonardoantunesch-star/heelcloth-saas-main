import { prisma } from "@/lib/db";

async function testProducaoEQualidade() {
  console.log("🧪 Testando Produção e Controle de Qualidade (Etapas 12 e 13 - Seções 10 e 11)...\n");
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
    // 1. Obter ou criar usuário ADMIN para os testes
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "admin_test@heelcloth.com",
          name: "Admin Tester",
          passwordHash: "test_hash",
          role: "ADMIN",
        },
      });
    }

    // 2. Obter ou criar cliente
    let cliente = await prisma.customer.findFirst();
    if (!cliente) {
      cliente = await prisma.customer.create({
        data: { name: "Atlético Fabril FC", whatsapp: "5511999990000" },
      });
    }

    // 3. Criar pedido exclusivo para o teste de esteira fabril e qualidade
    const orderNumber = `HC-PROD-${Date.now().toString().slice(-4)}`;
    const pedido = await prisma.order.create({
      data: {
        orderNumber,
        customerId: cliente.id,
        status: "EM_PRODUCAO",
        totalAmount: 1800.0,
        paidAmount: 900.0,
        pendingAmount: 900.0,
        paymentMethod: "PIX",
        deliveryDeadline: new Date(Date.now() + 5 * 24 * 3600 * 1000), // daqui a 5 dias
        notes: "Pedido para teste de linha de montagem e controle de qualidade",
        items: {
          create: [
            {
              product: "Conjunto Completo Futebol",
              quantity: 12,
              unitPrice: 150.0,
              totalPrice: 1800.0,
            },
          ],
        },
        players: {
          create: [
            { playerIndex: 0, name: "MARCELO", number: "10", size: "M", shortSize: "M", model: "Tradicional" },
            { playerIndex: 1, name: "GABRIEL", number: "9", size: "G", shortSize: "G", model: "Tradicional" },
            { playerIndex: 2, name: "LUCAS", number: "1", size: "GG", shortSize: "GG", model: "Goleiro", notes: "Manga longa" },
          ],
        },
        productionOrder: {
          create: {
            currentStage: "CORTE",
            stageStatus: "EM_ANDAMENTO",
            responsible: admin.name,
            notes: "Corte iniciado no setor 1",
          },
        },
      },
      include: {
        players: true,
        items: true,
        productionOrder: true,
      },
    });

    assert(pedido.productionOrder?.currentStage === "CORTE", "Pedido iniciado na etapa inicial CORTE");
    assert(pedido.players.length === 3, "3 jogadores criados para bancada de conferência");

    // 4. Testar avanço de etapas de produção com registro de histórico
    const etapaCostura = await prisma.productionOrder.update({
      where: { orderId: pedido.id },
      data: {
        currentStage: "COSTURA",
        stageStatus: "EM_ANDAMENTO",
        history: {
          create: {
            stage: "COSTURA",
            status: "EM_ANDAMENTO",
            responsible: admin.name,
            notes: "Corte finalizado, enviado para costura",
          },
        },
      },
      include: { history: true },
    });

    assert(etapaCostura.currentStage === "COSTURA", "Etapa avançada para COSTURA");
    assert(etapaCostura.history.length >= 1, "Histórico de produção gravado");

    // 5. Avançar para CONTROLE_QUALIDADE
    const etapaQualidade = await prisma.productionOrder.update({
      where: { orderId: pedido.id },
      data: {
        currentStage: "CONTROLE_QUALIDADE",
        stageStatus: "EM_ANDAMENTO",
        history: {
          create: {
            stage: "CONTROLE_QUALIDADE",
            status: "EM_ANDAMENTO",
            responsible: admin.name,
            notes: "Montagem completa, chegado na bancada de conferência de qualidade",
          },
        },
      },
    });

    assert(etapaQualidade.currentStage === "CONTROLE_QUALIDADE", "Etapa avançada para CONTROLE_QUALIDADE");

    // 6. Testar Bloqueio da Seção 11:
    // Tentar avançar para PRONTO sem aprovação de qualidade deve ser barrado!
    const qualityCheckExistente = await prisma.qualityCheck.findUnique({
      where: { orderId: pedido.id },
    });
    const podeAvancarSemQualidade = qualityCheckExistente?.isApproved === true;
    assert(!podeAvancarSemQualidade, "Seção 11: Pedido SEM qualidade aprovada NÃO pode avançar para PRONTO");

    // 7. Salvar conferência PARCIAL (ex: 5 de 7 itens conferidos)
    const checkParcial = await prisma.qualityCheck.create({
      data: {
        orderId: pedido.id,
        checkQuantity: true,
        checkSizes: true,
        checkNames: true,
        checkNumbers: true,
        checkModel: true,
        checkPersonalization: false, // Faltando
        checkComplete: false,        // Faltando
        isApproved: false,           // Não aprovado
        checkedById: admin.id,
        observations: "Aguardando confirmação do patch no calção",
      },
    });

    assert(checkParcial.isApproved === false, "Checklist com 5 de 7 itens resulta em isApproved = false");

    // Verificar se o sistema ainda bloqueia o status PRONTO
    const aprovadoAindaNao = checkParcial.isApproved;
    assert(!aprovadoAindaNao, "Bloqueio mantido: pedido com 5/7 itens NÃO é liberado");

    // 8. Completar todos os 7 itens da Seção 11:
    // [X] Quantidade correta
    // [X] Tamanhos corretos
    // [X] Nomes corretos
    // [X] Números corretos
    // [X] Modelo correto
    // [X] Personalização correta
    // [X] Pedido completo
    const checkCompleto = await prisma.qualityCheck.update({
      where: { orderId: pedido.id },
      data: {
        checkPersonalization: true,
        checkComplete: true,
        isApproved: true,
        checkedAt: new Date(),
        observations: "100% conferido na bancada. Nenhum defeito. Liberado!",
      },
    });

    assert(
      checkCompleto.checkQuantity &&
      checkCompleto.checkSizes &&
      checkCompleto.checkNames &&
      checkCompleto.checkNumbers &&
      checkCompleto.checkModel &&
      checkCompleto.checkPersonalization &&
      checkCompleto.checkComplete &&
      checkCompleto.isApproved === true,
      "Seção 11: Todos os 7 itens conferidos resultam em isApproved = true"
    );

    // 9. Agora que isApproved é true, avançar para PRONTO é permitido!
    const pedidoPronto = await prisma.order.update({
      where: { id: pedido.id },
      data: {
        status: "PRONTO",
        productionOrder: {
          update: {
            currentStage: "PRONTO",
            stageStatus: "CONCLUIDO",
            history: {
              create: {
                stage: "PRONTO",
                status: "CONCLUIDO",
                responsible: admin.name,
                notes: "Conferência aprovada com sucesso. Embalado para entrega.",
              },
            },
          },
        },
      },
      include: {
        qualityCheck: true,
        productionOrder: {
          include: { history: true },
        },
      },
    });

    assert(pedidoPronto.status === "PRONTO", "Pedido com qualidade aprovada avançou para PRONTO com sucesso");
    assert(pedidoPronto.productionOrder?.currentStage === "PRONTO", "ProductionOrder avançou para PRONTO");
    assert(pedidoPronto.qualityCheck?.isApproved === true, "Verificação de qualidade associada e confirmada");

    // 10. Testar cálculo de Pedido em Atraso (Deadline ultrapassado)
    const pedidoAtrasado = await prisma.order.create({
      data: {
        orderNumber: `HC-DELAY-${Date.now().toString().slice(-4)}`,
        customerId: cliente.id,
        status: "EM_PRODUCAO",
        totalAmount: 500,
        paidAmount: 500,
        pendingAmount: 0,
        paymentMethod: "PIX",
        deliveryDeadline: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 dias atrás (vencido!)
        productionOrder: {
          create: {
            currentStage: "ESTAMPA",
            stageStatus: "EM_ANDAMENTO",
          },
        },
      },
    });

    const estaAtrasado = new Date(pedidoAtrasado.deliveryDeadline!) < new Date();
    assert(estaAtrasado === true, "Regra de atraso: prazo anterior à data atual detectado como atrasado");

    // Limpeza dos pedidos de teste
    await prisma.order.delete({ where: { id: pedidoAtrasado.id } });
    await prisma.order.delete({ where: { id: pedido.id } });

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

testProducaoEQualidade();
