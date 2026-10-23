import { prisma } from "@/lib/db";
import { GET as getRastreio } from "@/app/api/rastreio/[codigo]/route";
import { NextRequest } from "next/server";

async function testRastreio() {
  console.log("🧪 Testando Área do Cliente & Rastreamento Público (Etapa 20 - Seção 8)...\n");
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
    // -------------------------------------------------------------
    // 1. Criar dados de teste com Pedido, Itens, Jogadores e Produção
    // -------------------------------------------------------------
    console.log("--- 1. Preparando pedido de teste para rastreamento ---");

    const cliente = await prisma.customer.create({
      data: {
        name: "Grêmio Esportivo Estrela",
        whatsapp: "11988881234",
        address: "Rua das Palmeiras, 100 - SP",
      },
    });

    const numeroPedido = `HC-RAS-${Date.now().toString().slice(-4)}`;
    const pedido = await prisma.order.create({
      data: {
        orderNumber: numeroPedido,
        customerId: cliente.id,
        status: "EM_PRODUCAO",
        totalAmount: 1500.0,
        paidAmount: 750.0, // 50% pago (Sinal)
        pendingAmount: 750.0,
        deliveryDeadline: new Date(Date.now() + 86400000 * 10), // +10 dias
        items: {
          create: [
            { product: "Camisa Dry-Fit", quantity: 10, unitPrice: 100.0, totalPrice: 1000.0 },
            { product: "Calção Dry", quantity: 10, unitPrice: 50.0, totalPrice: 500.0 },
          ],
        },
        players: {
          create: [
            { playerIndex: 1, name: "THIAGO SILVA", number: "3", size: "G", model: "JOGADOR" },
            { playerIndex: 2, name: "CASEMIRO", number: "5", size: "GG", model: "JOGADOR" },
          ],
        },
        productionOrder: {
          create: {
            currentStage: "ESTAMPA",
            stageStatus: "EM_ANDAMENTO",
          },
        },
        qualityCheck: {
          create: {
            isApproved: false,
          },
        },
      },
      include: {
        players: true,
        productionOrder: true,
      },
    });

    assert(pedido.id !== undefined, "Pedido gravado no banco para rastreamento");

    // -------------------------------------------------------------
    // 2. Testar consulta pública por número de pedido
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando rota GET /api/rastreio/[codigo] por orderNumber ---");

    const reqPublica = new NextRequest(`http://localhost:3000/api/rastreio/${numeroPedido}`);
    const resPublica = await getRastreio(reqPublica, {
      params: Promise.resolve({ codigo: numeroPedido }),
    });

    assert(resPublica.status === 200, "Endpoint público responde 200 sem necessidade de login");
    const jsonPublico = await resPublica.json();

    assert(jsonPublico.sucesso === true, "Campo sucesso retornado");
    assert(jsonPublico.pedido.orderNumber === numeroPedido, "Número do pedido confere");
    assert(jsonPublico.pedido.clienteNome === "Grêmio Esportivo Estrela", "Nome do cliente retornado");
    assert(jsonPublico.pedido.statusPagamento === "PARCIAL", "Status de pagamento calculado como PARCIAL");
    assert(jsonPublico.pedido.etapaNumero === 2, "Etapa 2 calculada para EM_PRODUCAO");
    assert(jsonPublico.pedido.subEtapaFabril === "Sublimação / Estamparia", "Sub-etapa fabril traduzida com sucesso");
    assert(jsonPublico.pedido.totalPecas === 2, "Total de peças computado");
    assert(jsonPublico.pedido.jogadores.length === 2, "2 jogadores retornados na lista de conferência");
    assert(jsonPublico.pedido.jogadores[0].name === "THIAGO SILVA", "Nome do jogador confere");

    // -------------------------------------------------------------
    // 3. Testar proteção de privacidade de dados
    // -------------------------------------------------------------
    console.log("\n--- 3. Verificando segurança e privacidade ---");
    assert(jsonPublico.pedido.customer?.address === undefined, "Endereço privado não exposto publicamente");
    assert(jsonPublico.pedido.customer?.document === undefined, "CPF/CNPJ privado não exposto publicamente");

    // -------------------------------------------------------------
    // 4. Testar consulta por ID interno
    // -------------------------------------------------------------
    console.log("\n--- 4. Testando consulta por ID do pedido ---");
    const reqId = new NextRequest(`http://localhost:3000/api/rastreio/${pedido.id}`);
    const resId = await getRastreio(reqId, {
      params: Promise.resolve({ codigo: pedido.id }),
    });
    assert(resId.status === 200, "Consulta por ID interno também funciona");

    // -------------------------------------------------------------
    // 5. Testar pedido não encontrado (404)
    // -------------------------------------------------------------
    console.log("\n--- 5. Testando código inexistente (404) ---");
    const req404 = new NextRequest(`http://localhost:3000/api/rastreio/HC-INEXISTENTE-9999`);
    const res404 = await getRastreio(req404, {
      params: Promise.resolve({ codigo: "HC-INEXISTENTE-9999" }),
    });
    assert(res404.status === 404, "Pedido inexistente retorna HTTP 404");
    const json404 = await res404.json();
    assert(json404.erro !== undefined, "Mensagem de erro amigável retornada");

    // -------------------------------------------------------------
    // 6. Testar variações de status (Pronto e Entregue)
    // -------------------------------------------------------------
    console.log("\n--- 6. Testando transição de etapas (Pronto e 100% Pago) ---");
    await prisma.order.update({
      where: { id: pedido.id },
      data: {
        status: "PRONTO",
        paidAmount: 1500.0, // 100% quitado
      },
    });

    const reqPronto = new NextRequest(`http://localhost:3000/api/rastreio/${numeroPedido}`);
    const resPronto = await getRastreio(reqPronto, {
      params: Promise.resolve({ codigo: numeroPedido }),
    });
    const jsonPronto = await resPronto.json();

    assert(jsonPronto.pedido.etapaNumero === 4, "Status PRONTO mapeado para etapa 4 do stepper");
    assert(jsonPronto.pedido.statusPagamento === "PAGO", "Status financeiro calculado como 100% PAGO");
    assert(jsonPronto.pedido.pendingAmount === 0, "Saldo restante zerado");

    // Limpeza dos dados de teste
    await prisma.qualityCheck.deleteMany({ where: { orderId: pedido.id } });
    await prisma.productionOrder.deleteMany({ where: { orderId: pedido.id } });
    await prisma.orderPlayer.deleteMany({ where: { orderId: pedido.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: pedido.id } });
    await prisma.order.delete({ where: { id: pedido.id } });
    await prisma.customer.delete({ where: { id: cliente.id } });

    console.log("🧹 Dados de teste limpos com sucesso.");
  } catch (error) {
    console.error("Erro no teste de Rastreamento:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testRastreio()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
