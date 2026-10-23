import { prisma } from "@/lib/db";
import { formatarParaVba, gerarMacroVbaPadrao, corelDrawService } from "@/services/coreldraw";

async function testCorelDraw() {
  console.log("🧪 Testando Central de Automação CorelDRAW (Etapa 18 - Seção 16)...\n");
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
    // 1. Testar formatação de jogadores para VBA tab-delimited
    // -------------------------------------------------------------
    console.log("--- 1. Testando formatação para VBA tab-delimited ---");

    const jogadoresExemplo = [
      {
        nome: "Gabriel Jesus",
        numero: "9",
        tamanho: "G",
        observacoes: "Manga Longa",
        shortSize: "GG",
        modelo: "JOGADOR",
      },
      {
        nome: "Alisson Becker",
        numero: "1",
        tamanho: "XG",
        observacoes: "",
        shortSize: "G",
        modelo: "GOLEIRO",
      },
      {
        name: "Neymar Jr",
        number: "10",
        size: "M",
        notes: "Gola V",
        shortSize: "M",
        model: "CAPITAO",
      },
    ];

    const vbaFormatado = formatarParaVba(jogadoresExemplo);
    const linhas = vbaFormatado.split("\n");

    assert(linhas.length === 3, "Número exato de 3 linhas geradas");

    const colunasLinha1 = linhas[0].split("\t");
    assert(colunasLinha1[0] === "GABRIEL JESUS", "Nome em maiúsculas na coluna 0");
    assert(colunasLinha1[1] === "9", "Número correto na coluna 1");
    assert(colunasLinha1[2] === "G", "Tamanho da camisa na coluna 2");
    assert(colunasLinha1[3] === "MANGA LONGA", "Observações em maiúsculas na coluna 3");
    assert(colunasLinha1[4] === "GG", "Tamanho do calção na coluna 4");
    assert(colunasLinha1[5] === "JOGADOR", "Modelo na coluna 5");

    const colunasLinha2 = linhas[1].split("\t");
    assert(colunasLinha2[0] === "ALISSON BECKER", "Segundo jogador formatado");
    assert(colunasLinha2[1] === "1", "Número do segundo jogador");
    assert(colunasLinha2[5] === "GOLEIRO", "Modelo GOLEIRO na coluna 5");

    const colunasLinha3 = linhas[2].split("\t");
    assert(colunasLinha3[0] === "NEYMAR JR", "Terceiro jogador (chaves em inglês)");
    assert(colunasLinha3[1] === "10", "Número 10 mapeado corretamente");
    assert(colunasLinha3[2] === "M", "Tamanho M mapeado corretamente");

    // Testar com campos vazios / defaults
    const jogadorVazio = [{ nome: "   ronaldinho   ", numero: "10" }];
    const vbaVazio = formatarParaVba(jogadorVazio);
    const colVazio = vbaVazio.split("\t");
    assert(colVazio[0] === "RONALDINHO", "Trim e uppercase funcionando");
    assert(colVazio[2] === "M", "Default tamanho 'M' aplicado");
    assert(colVazio[5] === "PADRAO", "Default modelo 'PADRAO' aplicado");

    // -------------------------------------------------------------
    // 2. Testar código da macro VBA padrão
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando macro VBA para CorelDRAW ---");

    const macroVba = gerarMacroVbaPadrao();
    assert(macroVba.includes("Public Sub GerarCamisasHeelcloth()"), "Contém procedimento GerarCamisasHeelcloth");
    assert(macroVba.includes("Split(linhaTexto, vbTab)"), "Utiliza separador tabulação vbTab");
    assert(macroVba.includes("docAtivo.DuplicatePage"), "Duplica gabarito ativo por camisa");
    assert(macroVba.includes("s.Text.Story.Text = nomeJogador"), "Substitui texto do Nome");
    assert(macroVba.includes("s.Text.Story.Text = numJogador"), "Substitui texto do Número");
    assert(macroVba.includes("Optimization = True"), "Ativa Optimization para performance em lote");
    assert(macroVba.includes("On Error GoTo TratarErro"), "Possui tratamento robusto de erros VBA");
    assert(macroVba.includes("CorelScriptTools.GetFileBox"), "Abre diálogo de seleção de arquivo .txt");

    // -------------------------------------------------------------
    // 3. Testar Payload do CorelDrawService
    // -------------------------------------------------------------
    console.log("\n--- 3. Testando CorelDrawService ---");
    const payload = corelDrawService.criarPayloadApi({
      id: "job-123",
      pedidoId: "ped-456",
      numeroPedido: "HC-2603-0001",
      totalPecas: 2,
      templateArquivo: "gabarito_futebol_2026.cdr",
      status: "concluido",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      jogadores: [
        {
          nome: "LUCAS",
          numero: "8",
          tamanho: "G",
          modelo: "MANGA CURTA",
          tipoCamisa: "JOGADOR",
        },
      ],
    });

    assert(payload.jobId === "job-123", "Payload com jobId correto");
    assert(payload.pedido === "HC-2603-0001", "Payload com número de pedido correto");
    assert(payload.itens.length === 1, "Payload com itens mapeados");
    assert(payload.itens[0].nome === "LUCAS", "Jogador mapeado no payload");

    // -------------------------------------------------------------
    // 4. Testar integração com banco de dados (Prisma)
    // -------------------------------------------------------------
    console.log("\n--- 4. Testando integração com banco de dados Prisma ---");

    let customer = await prisma.customer.findFirst();
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: "Esporte Clube Teste Corel",
          whatsapp: "11988887777",
          address: "São Paulo - SP",
        },
      });
    }

    const testOrderNumber = `HC-COR-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        customerId: customer.id,
        status: "EM_PRODUCAO",
        totalAmount: 1200.0,
        players: {
          create: [
            {
              playerIndex: 1,
              name: "CARLOS SILVA",
              number: "7",
              size: "G",
              model: "JOGADOR",
              notes: "Sem patrocinador manga",
              shortSize: "G",
            },
            {
              playerIndex: 2,
              name: "MARCOS SOUZA",
              number: "12",
              size: "GG",
              model: "GOLEIRO",
              notes: "Manga Longa",
              shortSize: "GG",
            },
          ],
        },
      },
      include: {
        players: { orderBy: { playerIndex: "asc" } },
        customer: true,
      },
    });

    assert(order.players.length === 2, "Pedido de teste com 2 jogadores criado no banco");

    // Testar busca e formatação direta do pedido
    const pedidoDoBanco = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        players: { orderBy: { playerIndex: "asc" } },
      },
    });

    assert(pedidoDoBanco !== null, "Pedido recuperado do banco com sucesso");
    const vbaDoBanco = formatarParaVba(pedidoDoBanco!.players);
    const linhasDoBanco = vbaDoBanco.split("\n");

    assert(linhasDoBanco.length === 2, "2 linhas formatadas a partir do banco");
    assert(linhasDoBanco[0].startsWith("CARLOS SILVA\t7\tG"), "Linha 1 confere com Carlos Silva");
    assert(linhasDoBanco[1].startsWith("MARCOS SOUZA\t12\tGG"), "Linha 2 confere com Marcos Souza");

    // Testar estrutura de download
    const fileName = `Heelcloth-CorelDRAW-${order.orderNumber}.txt`;
    const contentDisposition = `attachment; filename="${fileName}"`;
    assert(contentDisposition.includes(testOrderNumber), "Header de download contém número do pedido");

    // Testar contagem de métricas de pedidos com jogadores
    const pedidosComJogadores = await prisma.order.count({
      where: {
        players: { some: {} },
      },
    });
    assert(pedidosComJogadores >= 1, "Métrica prisma.order.count com players.some() funciona");

    // Limpeza
    await prisma.orderPlayer.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    console.log("🧹 Dados de teste limpos com sucesso.");
  } catch (error) {
    console.error("Erro no teste CorelDRAW:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testCorelDraw()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
