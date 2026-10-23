import { prisma } from "@/lib/db";
import { POST as postEnviar } from "@/app/api/enviar/route";
import { GET as getRastreio } from "@/app/api/rastreio/[codigo]/route";
import { NextRequest } from "next/server";

async function testFluxoClienteHome() {
  console.log("🧪 Testando Fluxo do Cliente & Navegação da Home...\n");
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
    // 1. Testar envio de pedido pelo cliente via /api/enviar
    // -------------------------------------------------------------
    console.log("--- 1. Testando envio de pedido do cliente (mínimo 10 camisas) ---");

    const itensExemplo = Array.from({ length: 12 }, (_, i) => ({
      nome: `ATLETA ${i + 1}`,
      numero: (i + 1).toString(),
      tamCamisa: "M",
      tamShort: i < 6 ? "M" : "",
      goleiro: i === 0,
      opcoes: i % 2 === 0 ? ["manga_longa"] : [],
      obs: i === 0 ? "Camisa de goleiro acolchoada" : "",
    }));

    const reqEnviar = new NextRequest("http://localhost:3000/api/enviar", {
      method: "POST",
      body: JSON.stringify({
        representante: "Atlética Poli USP",
        contato: "11998765432",
        itens: itensExemplo,
      }),
    });

    const resEnviar = await postEnviar(reqEnviar);
    assert(resEnviar.status === 200, "Envio do pedido respondeu HTTP 200");
    const jsonEnviar = await resEnviar.json();

    assert(jsonEnviar.ok === true, "Campo ok retornado como true");
    assert(jsonEnviar.protocolo !== undefined, "Número de protocolo gerado");
    assert(jsonEnviar.camisas === 12, "12 camisas contabilizadas");
    assert(jsonEnviar.shorts === 6, "6 calções contabilizados");
    assert(jsonEnviar.orcamento?.total > 0, "Cálculo do orçamento realizado");

    const protocolo = jsonEnviar.protocolo;
    console.log(`Protocolo gerado: ${protocolo}`);

    // -------------------------------------------------------------
    // 2. Verificar se o pedido foi salvo no banco de dados
    // -------------------------------------------------------------
    console.log("\n--- 2. Verificando persistência no banco Prisma ---");

    const pedidoSalvo = await prisma.order.findUnique({
      where: { orderNumber: protocolo },
      include: {
        customer: true,
        players: true,
        items: true,
        productionOrder: true,
      },
    });

    assert(pedidoSalvo !== null, "Pedido salvo no banco de dados com o protocolo");
    assert(pedidoSalvo?.customer.name === "Atlética Poli USP", "Cliente vinculado ao pedido");
    assert(pedidoSalvo?.players.length === 12, "12 jogadores persistidos com nomes e números");
    assert(pedidoSalvo?.status === "AGUARDANDO_APROVACAO", "Status inicial gravado como AGUARDANDO_APROVACAO");
    assert(pedidoSalvo?.productionOrder?.currentStage === "ARTE", "Ordem de produção inicializada na etapa ARTE");

    // -------------------------------------------------------------
    // 3. Testar se o cliente consegue rastrear imediatamente via /api/rastreio
    // -------------------------------------------------------------
    console.log("\n--- 3. Testando rastreamento imediato pelo cliente ---");

    const reqRastreio = new NextRequest(`http://localhost:3000/api/rastreio/${protocolo}`);
    const resRastreio = await getRastreio(reqRastreio, {
      params: Promise.resolve({ codigo: protocolo }),
    });

    assert(resRastreio.status === 200, "Rastreamento do pedido recém-criado respondeu HTTP 200");
    const jsonRastreio = await resRastreio.json();

    assert(jsonRastreio.sucesso === true, "Rastreio com sucesso retornado");
    assert(jsonRastreio.pedido.orderNumber === protocolo, "Número do pedido confere no rastreamento");
    assert(jsonRastreio.pedido.jogadores.length === 12, "Lista de 12 jogadores visível para conferência do cliente");

    // Limpeza
    if (pedidoSalvo) {
      await prisma.productionOrder.deleteMany({ where: { orderId: pedidoSalvo.id } });
      await prisma.orderPlayer.deleteMany({ where: { orderId: pedidoSalvo.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: pedidoSalvo.id } });
      await prisma.order.delete({ where: { id: pedidoSalvo.id } });
      await prisma.customer.delete({ where: { id: pedidoSalvo.customerId } });
    }

    console.log("🧹 Dados de teste limpos com sucesso.");
  } catch (error) {
    console.error("Erro no teste de fluxo do cliente:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testFluxoClienteHome()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
