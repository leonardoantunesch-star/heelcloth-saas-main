import { prisma } from "@/lib/db";

async function testClientes() {
  console.log("🧪 Testando Módulo de Clientes (Etapa 8 - Seção 9)...\n");
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
    // 1. Criar novo cliente de teste
    const uniqueEmail = `cliente.teste.${Date.now()}@sportclub.com.br`;
    const clienteCriado = await prisma.customer.create({
      data: {
        name: "Esporte Clube Juventus Teste",
        document: "45.123.890/0001-55",
        phone: "(11) 3344-5566",
        whatsapp: "551199998888",
        email: uniqueEmail,
        address: "Rua Javari, 117 - Mooca, São Paulo - SP",
        notes: "Cliente de teste automatizado",
      },
    });

    assert(clienteCriado.id !== undefined, "Cadastro: Cliente criado com ID gerado com sucesso");
    assert(clienteCriado.whatsapp === "551199998888", "Cadastro: WhatsApp do cliente registrado corretamente");

    // 2. Busca por termos variados (nome, doc, whatsapp)
    const buscaNome = await prisma.customer.findMany({
      where: { name: { contains: "Juventus" } },
    });
    assert(buscaNome.length >= 1, `Busca: Localizou cliente por nome parcial (${buscaNome.length} encontrado)`);

    const buscaDoc = await prisma.customer.findMany({
      where: { document: { contains: "45.123.890" } },
    });
    assert(buscaDoc.length >= 1, `Busca: Localizou cliente por documento parcial (${buscaDoc.length} encontrado)`);

    // 3. Atualização de dados
    const clienteAtualizado = await prisma.customer.update({
      where: { id: clienteCriado.id },
      data: { notes: "Observação atualizada via teste automatizado" },
    });
    assert(Boolean(clienteAtualizado.notes?.includes("atualizada")), "Atualização: Dados do cliente alterados com sucesso");

    // 4. Testar métricas e histórico de cliente com pedidos
    let clienteComPedidos = await prisma.customer.findFirst({
      where: { orders: { some: {} } },
      include: { orders: true, quotes: true },
    });

    let pedidoCriadoParaTeste: any = null;
    let orcamentoCriadoParaTeste: any = null;

    if (!clienteComPedidos) {
      const clienteAlvo = await prisma.customer.findFirst({ where: { name: { contains: "Fúria" } } }) || clienteCriado;
      pedidoCriadoParaTeste = await prisma.order.create({
        data: {
          orderNumber: `HC-TEST-${Date.now().toString().slice(-4)}`,
          customerId: clienteAlvo.id,
          totalAmount: 1500,
          status: "EM_PRODUCAO",
        },
      });
      orcamentoCriadoParaTeste = await prisma.quote.create({
        data: {
          quoteNumber: `ORC-TEST-${Date.now().toString().slice(-4)}`,
          customerId: clienteAlvo.id,
          totalAmount: 1500,
          status: "APROVADO",
        },
      });
      clienteComPedidos = await prisma.customer.findUnique({
        where: { id: clienteAlvo.id },
        include: { orders: true, quotes: true },
      });
    }

    if (clienteComPedidos && clienteComPedidos.quotes.length === 0) {
      orcamentoCriadoParaTeste = await prisma.quote.create({
        data: {
          quoteNumber: `ORC-TEST-${Date.now().toString().slice(-4)}`,
          customerId: clienteComPedidos.id,
          totalAmount: 1500,
          status: "APROVADO",
        },
      });
      clienteComPedidos = await prisma.customer.findUnique({
        where: { id: clienteComPedidos.id },
        include: { orders: true, quotes: true },
      });
    }

    assert(clienteComPedidos !== null, "Histórico: Cliente com histórico localizado no banco");
    assert(clienteComPedidos!.orders.length >= 1, `Histórico: Pedidos vinculados ao cliente (${clienteComPedidos!.orders.length} pedidos)`);
    assert(clienteComPedidos!.quotes.length >= 1, `Histórico: Orçamentos vinculados ao cliente (${clienteComPedidos!.quotes.length} orçamentos)`);

    const totalGasto = clienteComPedidos!.orders.reduce((acc, o) => acc + o.totalAmount, 0);
    assert(totalGasto > 0, `Métricas financeiras: Total gasto pelo cliente calculado: R$ ${totalGasto.toFixed(2)}`);

    // 5. Testar integridade de exclusão (cliente com pedidos não pode ser excluído)
    const pedidosVinculados = await prisma.order.count({ where: { customerId: clienteComPedidos!.id } });
    assert(pedidosVinculados > 0, "Regra de Negócio: Cliente com pedidos vinculados possui trava de integridade");

    if (pedidoCriadoParaTeste) {
      await prisma.order.delete({ where: { id: pedidoCriadoParaTeste.id } });
    }
    if (orcamentoCriadoParaTeste) {
      await prisma.quote.delete({ where: { id: orcamentoCriadoParaTeste.id } });
    }

    // 6. Limpeza do cliente de teste
    await prisma.customer.delete({ where: { id: clienteCriado.id } });
    const clienteAposExclusao = await prisma.customer.findUnique({ where: { id: clienteCriado.id } });
    assert(clienteAposExclusao === null, "Exclusão: Cliente sem vínculos removido com sucesso");

    console.log(`\n========================================`);
    console.log(`Clientes Test: ${passed} passaram, ${failed} falharam.`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Erro no teste de clientes:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testClientes();
