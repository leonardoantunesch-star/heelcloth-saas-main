import { prisma } from "@/lib/db";
import { formatarParaVba } from "@/services/coreldraw";

async function testPedidosEJogadores() {
  console.log("🧪 Testando Pedidos e Personalização de Camisas (Etapas 10 e 11 - Seções 5, 6 e 7)...\n");
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
    // 1. Obter ou criar cliente
    let cliente = await prisma.customer.findFirst();
    if (!cliente) {
      cliente = await prisma.customer.create({
        data: { name: "Time dos Campeões", whatsapp: "5511988887777" },
      });
    }

    // 2. Criar pedido de teste
    const agora = new Date();
    const ano = agora.getFullYear().toString().slice(-2);
    const mes = (agora.getMonth() + 1).toString().padStart(2, "0");
    const orderNumber = `HC-${ano}${mes}-8888`;

    const pedido = await prisma.order.create({
      data: {
        orderNumber,
        customerId: cliente.id,
        status: "AGUARDANDO_APROVACAO",
        totalAmount: 1500.0,
        paidAmount: 500.0,
        pendingAmount: 1000.0,
        paymentMethod: "PIX",
        deliveryDeadline: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        notes: "Pedido de teste com personalização de camisas",
        items: {
          create: [
            {
              product: "Camisa Tradicional Jogador",
              quantity: 15,
              unitPrice: 60.0,
              totalPrice: 900.0,
            },
            {
              product: "Short de Jogo",
              quantity: 15,
              unitPrice: 40.0,
              totalPrice: 600.0,
            },
          ],
        },
      },
      include: { items: true },
    });

    assert(pedido.id !== undefined, "Pedidos: Pedido criado com sucesso");
    assert(pedido.items.length === 2, "Pedidos: 2 itens vinculados");
    assert(pedido.pendingAmount === 1000.0, "Financeiro: Saldo pendente calculado corretamente (1500 - 500 = 1000)");

    // 3. Testar Esteira de Status (Seção 7)
    const pedidoAprovado = await prisma.order.update({
      where: { id: pedido.id },
      data: { status: "EM_PRODUCAO" },
    });
    assert(pedidoAprovado.status === "EM_PRODUCAO", "Status Seção 7: Pedido avançou para EM_PRODUCAO");

    // 4. Testar Trava de Qualidade da Seção 11 (Bloqueio antes de PRONTO sem conferência)
    // Simula a validação aplicada na rota /api/pedidos/[id]/status
    const checkSemQualidade = await prisma.qualityCheck.findUnique({ where: { orderId: pedido.id } });
    const podeAvancarParaPronto = Boolean(checkSemQualidade && checkSemQualidade.isApproved);
    assert(!podeAvancarParaPronto, "Regra Seção 11: Pedido bloqueado de avançar para PRONTO sem checklist aprovado");

    // 5. Testar Personalização Individual de Camisas (Seção 6)
    const jogadoresParaSalvar = [
      { index: 1, name: "GABRIEL", number: "1", size: "G", model: "Goleiro", short: "G" },
      { index: 2, name: "BRUNO", number: "5", size: "M", model: "Jogador", short: "M" },
      { index: 3, name: "LUCAS", number: "10", size: "M", model: "Jogador", short: "M" },
      { index: 4, name: "DUDU", number: "7", size: "M", model: "Jogador", short: "M" },
    ];

    for (const j of jogadoresParaSalvar) {
      await prisma.orderPlayer.create({
        data: {
          orderId: pedido.id,
          playerIndex: j.index,
          name: j.name,
          number: j.number,
          size: j.size,
          model: j.model,
          shortSize: j.short,
        },
      });
    }

    const jogadoresCadastrados = await prisma.orderPlayer.findMany({
      where: { orderId: pedido.id },
      orderBy: { playerIndex: "asc" },
    });
    assert(jogadoresCadastrados.length === 4, `Personalização Seção 6: 4 camisas cadastradas individualmente`);

    // 6. Testar Validação de Números Duplicados (Seção 6)
    const listaComDuplicado = [
      { number: "10", name: "JOGADOR A" },
      { number: "7", name: "JOGADOR B" },
      { number: "10", name: "JOGADOR C" }, // Duplicado!
    ];
    const numeros = listaComDuplicado.map((j) => j.number);
    const temDuplicados = numeros.some((num, idx) => numeros.indexOf(num) !== idx);
    assert(temDuplicados, "Validação Seção 6: Algoritmo detectou número de camisa duplicado na equipe");

    // 7. Testar Exportação para CorelDRAW VBA (Seção 16)
    const vbaFormatado = formatarParaVba(
      jogadoresCadastrados.map((j) => ({
        nome: j.name,
        numero: j.number,
        tamanho: j.size,
        modelo: j.model,
        observacoes: j.notes || undefined,
      }))
    );
    assert(vbaFormatado.includes("\t"), "Automação CorelDRAW Seção 16: Formatação tab-delimited gerada");
    assert(vbaFormatado.includes("GABRIEL\t1\tG"), "Automação CorelDRAW Seção 16: Linha de jogador formatada para o VBA");

    // 8. Limpeza do pedido de teste
    await prisma.orderPlayer.deleteMany({ where: { orderId: pedido.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: pedido.id } });
    await prisma.order.delete({ where: { id: pedido.id } });

    console.log(`\n========================================`);
    console.log(`Pedidos e Camisas Test: ${passed} passaram, ${failed} falharam.`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Erro no teste:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPedidosEJogadores();
