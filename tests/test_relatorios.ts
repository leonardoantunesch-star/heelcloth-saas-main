import { prisma } from "@/lib/db";
import {
  obterIntervaloData,
  obterMetricasBI,
  gerarCsvRelatorio,
} from "@/services/relatorios";

async function testRelatorios() {
  console.log("🧪 Testando Relatórios & Business Intelligence (Etapa 19 - Seção 17)...\n");
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
    // 1. Testar cálculo e formatação de intervalos de data
    // -------------------------------------------------------------
    console.log("--- 1. Testando cálculo de intervalos de data ---");

    const hoje = obterIntervaloData("hoje");
    assert(hoje.label === "Hoje", "Período 'hoje' tem label correto");
    assert(hoje.inicio.getHours() === 0 && hoje.inicio.getMinutes() === 0, "Início do dia zerado");
    assert(hoje.fim.getHours() === 23 && hoje.fim.getMinutes() === 59, "Fim do dia no último minuto");

    const semana = obterIntervaloData("semana");
    assert(semana.label === "Últimos 7 dias", "Período 'semana' tem label correto");
    assert(semana.fim.getTime() > semana.inicio.getTime(), "Fim da semana posterior ao início");

    const mes = obterIntervaloData("mes");
    assert(mes.inicio.getDate() === 1, "Início do mês é dia 1");

    const ano = obterIntervaloData("ano");
    assert(ano.inicio.getMonth() === 0 && ano.inicio.getDate() === 1, "Início do ano é 01/01");

    const custom = obterIntervaloData("personalizado", "2026-06-01", "2026-06-30");
    assert(custom.label === "2026-06-01 a 2026-06-30", "Label do período personalizado formatado");
    assert(custom.inicio.getMonth() === 5, "Mês de junho interpretado corretamente");

    // -------------------------------------------------------------
    // 2. Testar métricas e agregação de dados no banco
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando consolidação de dados e métricas BI ---");

    // Criar cliente de teste
    const cliente = await prisma.customer.create({
      data: {
        name: "Clube Atlético BI Teste",
        whatsapp: "11977776666",
      },
    });

    // Criar pedido com itens e jogadores
    const pedido = await prisma.order.create({
      data: {
        orderNumber: `HC-BI-${Date.now().toString().slice(-4)}`,
        customerId: cliente.id,
        status: "CONCLUIDO",
        totalAmount: 2400.0,
        paidAmount: 2400.0,
        items: {
          create: [
            { product: "Camisa Tradicional Dry-Fit", quantity: 20, unitPrice: 80.0, totalPrice: 1600.0 },
            { product: "Calção Esportivo", quantity: 20, unitPrice: 40.0, totalPrice: 800.0 },
          ],
        },
        players: {
          create: [
            { playerIndex: 1, name: "BRUNO", number: "10", size: "M", model: "JOGADOR" },
            { playerIndex: 2, name: "LEO", number: "1", size: "G", model: "GOLEIRO" },
          ],
        },
      },
      include: { items: true, players: true },
    });

    // Criar transações financeiras
    const txReceita = await prisma.financialTransaction.create({
      data: {
        orderId: pedido.id,
        customerId: cliente.id,
        type: "RECEITA",
        category: "VENDA",
        description: `Recebimento pedido ${pedido.orderNumber}`,
        amount: 2400.0,
        status: "PAGO",
        paymentDate: new Date(),
      },
    });

    const txDespesa = await prisma.financialTransaction.create({
      data: {
        type: "DESPESA",
        category: "MATERIA_PRIMA",
        description: "Tecido Dry-Fit e Tinta Sublimática",
        amount: 800.0,
        status: "PAGO",
        paymentDate: new Date(),
      },
    });

    // Obter métricas de um intervalo amplo cobrindo hoje
    const inicioBusca = new Date(Date.now() - 3600000);
    const fimBusca = new Date(Date.now() + 3600000);

    const bi = await obterMetricasBI(inicioBusca, fimBusca);

    assert(bi.kpis.faturamentoTotal >= 2400.0, "Faturamento computado com valor pago");
    assert(bi.kpis.receitaTotal >= 2400.0, "Receita total computada");
    assert(bi.kpis.despesaTotal >= 800.0, "Despesa total computada");
    assert(bi.kpis.lucroLiquido === bi.kpis.receitaTotal - bi.kpis.despesaTotal, "Cálculo do Lucro Líquido exato");
    assert(bi.kpis.margemLucro > 0, "Margem de lucro calculada com sucesso");
    assert(bi.kpis.totalPedidos >= 1, "Contagem de pedidos computada");
    assert(bi.kpis.ticketMedio > 0, "Ticket Médio calculado");

    // Verificar ranking de clientes
    const clienteNoRanking = bi.rankingClientes.find((c) => c.id === cliente.id);
    assert(clienteNoRanking !== undefined, "Cliente presente no ranking de faturamento");
    assert(clienteNoRanking!.totalGasto >= 2400.0, "Valor do cliente acumulado corretamente");

    // Verificar ranking de produtos
    const produtoNoRanking = bi.rankingProdutos.find((p) => p.nome.includes("Camisa Tradicional"));
    assert(produtoNoRanking !== undefined, "Produto agrupado no ranking de vendas");
    assert(produtoNoRanking!.quantidade >= 20, "Quantidade do produto computada");

    // -------------------------------------------------------------
    // 3. Testar exportação de relatórios CSV
    // -------------------------------------------------------------
    console.log("\n--- 3. Testando exportação de relatórios CSV ---");

    const csvVendas = await gerarCsvRelatorio("vendas", inicioBusca, fimBusca);
    assert(csvVendas.startsWith("\uFEFF"), "CSV de Vendas contém BOM UTF-8");
    assert(csvVendas.includes("Numero_Pedido,Data,Cliente"), "Cabeçalho de vendas presente");
    assert(csvVendas.includes(pedido.orderNumber), "Número do pedido consta no CSV de Vendas");

    const csvFinanceiro = await gerarCsvRelatorio("financeiro", inicioBusca, fimBusca);
    assert(csvFinanceiro.includes("Data,Tipo,Categoria,Descricao,Valor"), "Cabeçalho financeiro presente");
    assert(csvFinanceiro.includes("RECEITA") && csvFinanceiro.includes("DESPESA"), "Tipos financeiros presentes");

    const csvClientes = await gerarCsvRelatorio("clientes", inicioBusca, fimBusca);
    assert(csvClientes.includes("Nome,Documento,WhatsApp"), "Cabeçalho da carteira de clientes presente");
    assert(csvClientes.includes("Clube Atlético BI Teste"), "Cliente consta na base exportada");

    const csvProducao = await gerarCsvRelatorio("producao", inicioBusca, fimBusca);
    assert(csvProducao.includes("Numero_Pedido,Cliente,Etapa_Atual"), "Cabeçalho de produção presente");

    // Limpeza dos dados de teste
    await prisma.financialTransaction.delete({ where: { id: txDespesa.id } });
    await prisma.financialTransaction.delete({ where: { id: txReceita.id } });
    await prisma.orderPlayer.deleteMany({ where: { orderId: pedido.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: pedido.id } });
    await prisma.order.delete({ where: { id: pedido.id } });
    await prisma.customer.delete({ where: { id: cliente.id } });

    console.log("🧹 Dados de teste limpos com sucesso.");
  } catch (error) {
    console.error("Erro no teste de Relatórios:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testRelatorios()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
