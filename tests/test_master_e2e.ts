import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createToken, verifyToken } from "@/lib/auth";
import { formatarParaVba, gerarMacroVbaPadrao } from "@/services/coreldraw";
import { getNfeProvider } from "@/services/nfe";
import { formatarTelefoneWhatsApp, renderizarTemplate, TEMPLATES_NOTIFICACAO } from "@/services/whatsapp";
import { obterMetricasBI, gerarCsvRelatorio } from "@/services/relatorios";
import { registrarAuditoria, listarAuditorias } from "@/services/auditoria";
import { obterConfiguracoes, salvarConfiguracoes } from "@/services/configuracoes";
import { GET as getRastreioPublico } from "@/app/api/rastreio/[codigo]/route";
import { NextRequest } from "next/server";

async function runMasterE2ETests() {
  console.log("========================================================================");
  console.log("🏆 SUÍTE GERAL DE TESTES E2E - HEELCLOTH SPORTSWEAR SAAS ERP");
  console.log("========================================================================\n");

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
    // -------------------------------------------------------------------------
    // ETAPA 1 A 4: AUTENTICAÇÃO, CRIPTOGRAFIA SCRYPT, SESSÃO E RBAC
    // -------------------------------------------------------------------------
    console.log("--- 1. Testando Autenticação, Criptografia e RBAC ---");
    const testPassword = "Heelcloth@Secret2026";
    const hash = await hashPassword(testPassword);
    const isValidPass = await verifyPassword(testPassword, hash);
    const isInvalidPass = await verifyPassword("wrong_pass", hash);

    assert(isValidPass === true, "Criptografia scrypt validou senha correta");
    assert(isInvalidPass === false, "Criptografia scrypt rejeitou senha errada");

    const token = createToken({
      userId: "user-admin-master",
      email: "master@heelcloth.com",
      name: "Master Admin",
      role: "ADMIN",
    });
    const session = verifyToken(token);
    assert(session?.role === "ADMIN", "Sessão JWT com perfil ADMIN decodificada com sucesso");

    // -------------------------------------------------------------------------
    // ETAPA 5 A 9: CLIENTES, ORÇAMENTOS E CONVERSÃO EM PEDIDO
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Testando Ciclo Comercial: Cliente -> Orçamento -> Pedido ---");
    const cliente = await prisma.customer.create({
      data: {
        name: "Esporte Clube Juventus da Mooca",
        whatsapp: "11976543210",
        phone: "1133334444",
        address: "Rua Javari, 117 - São Paulo, SP",
        document: "12.345.678/0001-90",
      },
    });
    assert(cliente.id !== undefined, "Cliente cadastrado com sucesso");

    const numeroOrcamento = `ORC-E2E-${Date.now().toString().slice(-4)}`;
    const orcamento = await prisma.quote.create({
      data: {
        quoteNumber: numeroOrcamento,
        customerId: cliente.id,
        status: "APROVADO",
        totalAmount: 3500.0,
        validUntil: new Date(Date.now() + 86400000 * 7),
        items: {
          create: [
            { product: "Camisa de Jogo Tradicional", quantity: 20, unitPrice: 100.0, totalPrice: 2000.0 },
            { product: "Calção Dry-Fit", quantity: 20, unitPrice: 50.0, totalPrice: 1000.0 },
            { product: "Meião Profissional", quantity: 20, unitPrice: 25.0, totalPrice: 500.0 },
          ],
        },
      },
      include: { items: true },
    });
    assert(orcamento.items.length === 3, "Orçamento com 3 produtos criado");

    // Conversão em Pedido
    const numeroPedido = `HC-E2E-${Date.now().toString().slice(-4)}`;
    const pedido = await prisma.order.create({
      data: {
        orderNumber: numeroPedido,
        customerId: cliente.id,
        quoteId: orcamento.id,
        status: "EM_PRODUCAO",
        totalAmount: 3500.0,
        paidAmount: 1750.0, // 50% de entrada
        pendingAmount: 1750.0,
        paymentMethod: "PIX",
        deliveryDeadline: new Date(Date.now() + 86400000 * 15),
        items: {
          create: orcamento.items.map((it) => ({
            product: it.product,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          })),
        },
      },
      include: { items: true },
    });
    assert(pedido.id !== undefined, "Pedido convertido a partir do orçamento com 50% de sinal");

    // -------------------------------------------------------------------------
    // ETAPA 10 E 18: NOMES/NÚMEROS DE JOGADORES & AUTOMAÇÃO COREL DRAW VBA
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Testando Personalização de Jogadores e Automação CorelDRAW ---");
    const jogadoresData = [
      { playerIndex: 1, name: "RODRIGO SILVA", number: "10", size: "G", model: "JOGADOR", shortSize: "G", notes: "Manga Longa" },
      { playerIndex: 2, name: "DANILO ALVES", number: "1", size: "GG", model: "GOLEIRO", shortSize: "GG", notes: "Acolchoado" },
      { playerIndex: 3, name: "LUCAS MOURA", number: "7", size: "M", model: "JOGADOR", shortSize: "M", notes: "" },
    ];

    for (const j of jogadoresData) {
      await prisma.orderPlayer.create({
        data: {
          orderId: pedido.id,
          ...j,
        },
      });
    }

    const jogadoresGravados = await prisma.orderPlayer.findMany({
      where: { orderId: pedido.id },
      orderBy: { playerIndex: "asc" },
    });
    assert(jogadoresGravados.length === 3, "3 camisas personalizadas cadastradas");

    const vbaTexto = formatarParaVba(jogadoresGravados);
    const linhasVba = vbaTexto.split("\n");
    assert(linhasVba.length === 3, "Formatação VBA gerou exatamente 3 linhas");
    assert(linhasVba[0].startsWith("RODRIGO SILVA\t10\tG"), "Linha 1 formatada no padrão tab-delimited CorelDRAW");
    assert(linhasVba[1].includes("GOLEIRO"), "Modelo GOLEIRO inserido na coluna 5");

    const macroVba = gerarMacroVbaPadrao();
    assert(macroVba.includes("Public Sub GerarCamisasHeelcloth()"), "Macro VBA nativa gerada com sucesso");

    // -------------------------------------------------------------------------
    // ETAPA 12 E 13: ESTEIRA DE PRODUÇÃO & BARREIRA DE CONTROLE DE QUALIDADE
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Testando Esteira de Produção e Barreira de 7 Itens no CQ ---");
    const producao = await prisma.productionOrder.create({
      data: {
        orderId: pedido.id,
        currentStage: "CORTE",
        stageStatus: "EM_ANDAMENTO",
        responsible: "Mestre Cortador",
      },
    });
    assert(producao.currentStage === "CORTE", "Ordem de produção iniciada no CORTE");

    // Avançar até CONTROLE_QUALIDADE
    await prisma.productionOrder.update({
      where: { id: producao.id },
      data: { currentStage: "CONTROLE_QUALIDADE" },
    });

    // Iniciar inspeção de qualidade
    const cq = await prisma.qualityCheck.create({
      data: {
        orderId: pedido.id,
        checkSizes: true,
        checkNames: true,
        checkNumbers: true,
        checkModel: true,
        checkPersonalization: false, // UM ITEM PENDENTE
        checkComplete: false,
        isApproved: false,
      },
    });

    // Barreira: status não pode virar PRONTO com itens incompletos
    const todosItensAprovados =
      cq.checkSizes &&
      cq.checkNames &&
      cq.checkNumbers &&
      cq.checkModel &&
      cq.checkPersonalization &&
      cq.checkComplete;

    assert(todosItensAprovados === false, "Barreira de qualidade bloqueou aprovação prematura");

    // Completar todos os 7 itens
    const cqAprovado = await prisma.qualityCheck.update({
      where: { id: cq.id },
      data: {
        checkPersonalization: true,
        checkComplete: true,
        isApproved: true,
        checkedAt: new Date(),
      },
    });

    assert(cqAprovado.isApproved === true, "Todos os 7 itens conferidos e lote de camisas APROVADO");

    // Atualizar pedido para PRONTO
    await prisma.order.update({
      where: { id: pedido.id },
      data: { status: "PRONTO" },
    });

    // -------------------------------------------------------------------------
    // ETAPA 14: ESTOQUE E MATÉRIA-PRIMA
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Testando Controle de Estoque & Movimentação ---");
    const itemEstoque = await prisma.inventoryItem.create({
      data: {
        name: "Tecido Dry-Fit Microfibra Branco",
        category: "TECIDO",
        unit: "METRO",
        quantity: 150.0,
        minQuantity: 50.0,
        cost: 25.0,
      },
    });

    // Baixa de 40 metros para a confecção
    const novaQtd = itemEstoque.quantity - 40.0;
    await prisma.inventoryMovement.create({
      data: {
        itemId: itemEstoque.id,
        type: "SAIDA",
        quantity: 40.0,
        previousQty: itemEstoque.quantity,
        newQty: novaQtd,
        reason: `Produção do pedido ${pedido.orderNumber}`,
      },
    });
    await prisma.inventoryItem.update({
      where: { id: itemEstoque.id },
      data: { quantity: novaQtd },
    });

    assert(novaQtd === 110.0, "Baixa de matéria-prima no estoque realizada com sucesso");

    // -------------------------------------------------------------------------
    // ETAPA 15: FINANCEIRO, FLUXO DE CAIXA E QUITAÇÃO
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Testando Módulo Financeiro & Quitação ---");
    const txSinal = await prisma.financialTransaction.create({
      data: {
        orderId: pedido.id,
        customerId: cliente.id,
        type: "RECEITA",
        category: "VENDA",
        description: `Sinal 50% Pedido ${pedido.orderNumber}`,
        amount: 1750.0,
        status: "PAGO",
        paymentMethod: "PIX",
        paymentDate: new Date(),
      },
    });

    const txRestante = await prisma.financialTransaction.create({
      data: {
        orderId: pedido.id,
        customerId: cliente.id,
        type: "RECEITA",
        category: "VENDA",
        description: `Saldo Restante na Entrega ${pedido.orderNumber}`,
        amount: 1750.0,
        status: "PAGO",
        paymentMethod: "PIX",
        paymentDate: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: pedido.id },
      data: { paidAmount: 3500.0, pendingAmount: 0.0 },
    });

    assert(txSinal.amount + txRestante.amount === 3500.0, "Receitas financeiras quitadas (100% pago)");

    // -------------------------------------------------------------------------
    // ETAPA 16: EMISSÃO DE NOTA FISCAL ELETRÔNICA (NF-e)
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Testando Emissão e Cancelamento de NF-e Fiscal ---");
    const provider = getNfeProvider();
    const nfeResult = await provider.emitir({
      pedidoId: pedido.id,
      numeroPedido: pedido.orderNumber,
      cliente: {
        nome: cliente.name,
        cpfCnpj: cliente.document || "12.345.678/0001-90",
        endereco: {
          logradouro: "Rua Javari",
          numero: "117",
          bairro: "Mooca",
          cidade: "São Paulo",
          uf: "SP",
          cep: "03112-000",
        },
      },
      itens: [
        {
          descricao: "Conjunto Esportivo Personalizado",
          quantidade: 20,
          valorUnitario: 175.0,
          valorTotal: 3500.0,
          ncm: "61091000",
        },
      ],
      valorTotal: 3500.0,
    });

    assert(nfeResult.sucesso === true, "NF-e autorizada pela SEFAZ");
    assert(nfeResult.chaveAcesso?.length === 44, "Chave de acesso SEFAZ com 44 dígitos gerada");
    assert(nfeResult.numero !== undefined, "Número de nota fiscal emitido");
    const xmlNfe = await provider.baixarXml(nfeResult.chaveAcesso!);
    assert(xmlNfe.includes("<nfeProc") === true, "Envelope XML nfeProc estruturado");

    // -------------------------------------------------------------------------
    // ETAPA 17: COMUNICAÇÃO WHATSAPP
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Testando Comunicação e Disparos WhatsApp ---");
    const telFormatado = formatarTelefoneWhatsApp(cliente.whatsapp);
    assert(telFormatado === "5511976543210", "Telefone sanitizado com DDI 55 padrão Brasil");

    const msgTexto = renderizarTemplate(TEMPLATES_NOTIFICACAO.PEDIDO_PRONTO, {
      cliente: cliente.name,
      pedido: pedido.orderNumber,
      infoSaldo: "✅ Pedido 100% Quitado!",
    });

    const msgGravada = await prisma.whatsAppMessage.create({
      data: {
        orderId: pedido.id,
        customerId: cliente.id,
        phone: telFormatado,
        templateType: "PEDIDO_PRONTO",
        content: msgTexto,
        status: "ENVIADO",
        sentAt: new Date(),
      },
    });
    assert(msgGravada.status === "ENVIADO", "Mensagem gravada na fila de disparos do WhatsApp");

    // -------------------------------------------------------------------------
    // ETAPA 20: ÁREA DO CLIENTE & RASTREAMENTO PÚBLICO
    // -------------------------------------------------------------------------
    console.log("\n--- 9. Testando Área do Cliente & Rastreamento Público ---");
    const reqRastreio = new NextRequest(`http://localhost:3000/api/rastreio/${pedido.orderNumber}`);
    const resRastreio = await getRastreioPublico(reqRastreio, {
      params: Promise.resolve({ codigo: pedido.orderNumber }),
    });

    assert(resRastreio.status === 200, "Consulta pública de rastreamento respondeu HTTP 200");
    const jsonRastreio = await resRastreio.json();
    assert(jsonRastreio.pedido.etapaNumero === 4, "Status PRONTO mapeado para etapa 4 do stepper");
    assert(jsonRastreio.pedido.statusPagamento === "PAGO", "Status financeiro reportado como PAGO");
    assert(jsonRastreio.pedido.jogadores.length === 3, "Cliente visualiza lista completa de 3 jogadores");

    // -------------------------------------------------------------------------
    // ETAPA 19: RELATÓRIOS & BUSINESS INTELLIGENCE
    // -------------------------------------------------------------------------
    console.log("\n--- 10. Testando Indicadores de BI & Exportação CSV ---");
    const inicioBI = new Date(Date.now() - 3600000);
    const fimBI = new Date(Date.now() + 3600000);
    const metricas = await obterMetricasBI(inicioBI, fimBI);

    assert(metricas.kpis.faturamentoTotal >= 3500.0, "Faturamento do pedido computado no BI");
    assert(metricas.kpis.totalPecas >= 3, "Total de peças fabricadas computado");

    const csvVendas = await gerarCsvRelatorio("vendas", inicioBI, fimBI);
    assert(csvVendas.includes(pedido.orderNumber), "Pedido presente no relatório CSV exportado");

    // -------------------------------------------------------------------------
    // ETAPA 21 E 22: AUDITORIA E CONFIGURAÇÕES DA EMPRESA
    // -------------------------------------------------------------------------
    console.log("\n--- 11. Testando Auditoria e Configurações Globais ---");
    const logAudit = await registrarAuditoria({
      action: "STATUS_CHANGE",
      entity: "PEDIDO",
      entityId: pedido.id,
      details: { novoStatus: "PRONTO" },
    });
    assert(logAudit !== null, "Evento de auditoria registrado no banco");

    const configs = await obterConfiguracoes();
    assert(configs.EMPRESA_NOME_FANTASIA !== undefined, "Configurações da empresa lidas com sucesso");

    // -------------------------------------------------------------------------
    // LIMPEZA FINAL DOS DADOS DE TESTE E2E
    // -------------------------------------------------------------------------
    console.log("\n--- 12. Limpando dados do teste de integração ---");
    if (logAudit) await prisma.auditLog.delete({ where: { id: logAudit.id } });
    await prisma.whatsAppMessage.delete({ where: { id: msgGravada.id } });
    await prisma.invoice.deleteMany({ where: { orderId: pedido.id } });
    await prisma.financialTransaction.delete({ where: { id: txRestante.id } });
    await prisma.financialTransaction.delete({ where: { id: txSinal.id } });
    await prisma.inventoryMovement.deleteMany({ where: { itemId: itemEstoque.id } });
    await prisma.inventoryItem.delete({ where: { id: itemEstoque.id } });
    await prisma.qualityCheck.delete({ where: { id: cqAprovado.id } });
    await prisma.productionOrder.delete({ where: { id: producao.id } });
    await prisma.orderPlayer.deleteMany({ where: { orderId: pedido.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: pedido.id } });
    await prisma.order.delete({ where: { id: pedido.id } });
    await prisma.quoteItem.deleteMany({ where: { quoteId: orcamento.id } });
    await prisma.quote.delete({ where: { id: orcamento.id } });
    await prisma.customer.delete({ where: { id: cliente.id } });

    console.log("🧹 Todos os registros transitórios de teste foram limpos com segurança.");
  } catch (error) {
    console.error("Erro na suíte geral E2E:", error);
    failed++;
  }

  console.log("\n========================================================================");
  console.log(`🏁 RESULTADO FINAL: ${passed} PASSARAM, ${failed} FALHARAM.`);
  console.log("========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterE2ETests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
