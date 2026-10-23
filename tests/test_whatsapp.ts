import { prisma } from "@/lib/db";
import {
  TEMPLATES_NOTIFICACAO,
  renderizarTemplate,
  formatarTelefoneWhatsApp,
  gerarLinkWhatsApp,
  getWhatsAppService,
} from "@/services/whatsapp";

async function testWhatsApp() {
  console.log("🧪 Testando Automação e Comunicação WhatsApp (Etapa 17 - Seção 15)...\n");
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
    // 1. Obter usuário ADMIN
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: { email: "admin_wa@heelcloth.com", name: "Admin WA", passwordHash: "h", role: "ADMIN" },
      });
    }

    // 2. Testar renderização de templates com variáveis da confecção
    const templateConfirmado = TEMPLATES_NOTIFICACAO.PEDIDO_CONFIRMADO;
    const msgConfirmado = renderizarTemplate(templateConfirmado, {
      cliente: "Vila Real FC",
      pedido: "HC-2603-9999",
      valorTotal: "R$ 1.800,00",
      valorPago: "R$ 900,00",
      totalPecas: 18,
      prazo: "15/10/2026",
    });

    assert(msgConfirmado.includes("Vila Real FC"), "Variável {cliente} substituída");
    assert(msgConfirmado.includes("HC-2603-9999"), "Variável {pedido} substituída");
    assert(msgConfirmado.includes("R$ 1.800,00"), "Variável {valorTotal} substituída");
    assert(msgConfirmado.includes("18 peças"), "Variável {totalPecas} substituída");

    // 3. Testar template de Pedido Pronto com saldo pendente
    const templatePronto = TEMPLATES_NOTIFICACAO.PEDIDO_PRONTO;
    const msgPronto = renderizarTemplate(templatePronto, {
      cliente: "Vila Real FC",
      pedido: "HC-2603-9999",
      infoSaldo: "💳 Saldo restante: R$ 900,00",
    });

    assert(msgPronto.includes("ESTÁ PRONTO"), "Template PEDIDO_PRONTO renderizado");
    assert(msgPronto.includes("Saldo restante: R$ 900,00"), "Aviso de saldo pendente incorporado");

    // 4. Testar sanitização de telefone (formatarTelefoneWhatsApp)
    const tel1 = formatarTelefoneWhatsApp("(11) 98765-4321");
    const tel2 = formatarTelefoneWhatsApp("11987654321");
    const tel3 = formatarTelefoneWhatsApp("5511987654321");

    assert(tel1 === "5511987654321", "Formatação de telefone com parênteses e traço: 5511987654321");
    assert(tel2 === "5511987654321", "Adição automática de DDI 55 em celular de 11 dígitos");
    assert(tel3 === "5511987654321", "Preservação de número já com DDI 55");

    // 5. Testar geração de link para WhatsApp Web (gerarLinkWhatsApp)
    const linkWeb = gerarLinkWhatsApp("(11) 98765-4321", "Olá!");
    assert(linkWeb.startsWith("https://wa.me/5511987654321?text="), "Link wa.me gerado com número correto");
    assert(linkWeb.includes("Ol%C3%A1!"), "Texto codificado em percent-encoding para URL");

    // 6. Testar disparo pelo provedor de WhatsApp (MockWhatsAppService)
    const waService = getWhatsAppService();
    const respEnvio = await waService.enviarMensagem({
      destinatario: "5511987654321",
      evento: "pedido_confirmado",
      variaveis: { nomeCliente: "Vila Real FC", numeroPedido: "HC-2603-9999" },
      mensagemPersonalizada: msgConfirmado,
    });

    assert(respEnvio.sucesso === true, "Provedor WhatsApp retornou sucesso");
    assert(respEnvio.mensagemId !== undefined, "ID de mensagem retornado pelo serviço");

    // 7. Testar gravação na fila do banco de dados (WhatsAppMessage)
    const cliente = await prisma.customer.create({
      data: { name: "Vila Real FC", whatsapp: "5511987654321" },
    });

    const pedido = await prisma.order.create({
      data: {
        orderNumber: `HC-WA-${Date.now().toString().slice(-4)}`,
        customerId: cliente.id,
        status: "EM_PRODUCAO",
        totalAmount: 1800.0,
        paidAmount: 900.0,
        pendingAmount: 900.0,
        paymentMethod: "PIX",
      },
    });

    const msgGravada = await prisma.whatsAppMessage.create({
      data: {
        orderId: pedido.id,
        customerId: cliente.id,
        phone: "5511987654321",
        templateType: "PEDIDO_CONFIRMADO",
        content: msgConfirmado,
        status: "ENVIADO",
        sentAt: new Date(),
      },
    });

    assert(msgGravada.id !== undefined, "Mensagem gravada na tabela WhatsAppMessage");
    assert(msgGravada.status === "ENVIADO", "Status gravado como ENVIADO");
    assert(msgGravada.orderId === pedido.id, "Vínculo com Pedido confirmado");

    // 8. Testar recuperação e reenvio de mensagem com status FALHA
    const msgComFalha = await prisma.whatsAppMessage.create({
      data: {
        orderId: pedido.id,
        customerId: cliente.id,
        phone: "5511987654321",
        templateType: "PRODUCAO_INICIADA",
        content: "Mensagem teste falha",
        status: "FALHA",
        errorMessage: "Timeout no gateway",
      },
    });

    assert(msgComFalha.status === "FALHA", "Mensagem de falha criada na fila");

    // Simular reenvio
    const respReenvio = await waService.enviarMensagem({
      destinatario: msgComFalha.phone,
      evento: "producao_iniciada",
      variaveis: { nomeCliente: "Vila Real FC", numeroPedido: pedido.orderNumber },
      mensagemPersonalizada: msgComFalha.content,
    });

    const msgReenviada = await prisma.whatsAppMessage.update({
      where: { id: msgComFalha.id },
      data: {
        status: respReenvio.sucesso ? "ENVIADO" : "FALHA",
        errorMessage: null,
        sentAt: new Date(),
      },
    });

    assert(msgReenviada.status === "ENVIADO", "Mensagem recuperada da fila e reenviada com sucesso");
    assert(msgReenviada.errorMessage === null, "Mensagem de erro limpa após sucesso");

    // Limpeza dos dados de teste
    await prisma.whatsAppMessage.delete({ where: { id: msgReenviada.id } });
    await prisma.whatsAppMessage.delete({ where: { id: msgGravada.id } });
    await prisma.order.delete({ where: { id: pedido.id } });
    await prisma.customer.delete({ where: { id: cliente.id } });

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

testWhatsApp();
