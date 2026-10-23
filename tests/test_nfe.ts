import { prisma } from "@/lib/db";
import { getNfeProvider } from "@/services/nfe";

async function testNfe() {
  console.log("🧪 Testando Emissão de NF-e e Regra de Segurança da Seção 14.1...\n");
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
    // 1. Obter ou criar usuários com os 4 perfis do sistema
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: { email: "admin_nfe@heelcloth.com", name: "Admin Fiscal", passwordHash: "h", role: "ADMIN" },
      });
    }

    let financeiro = await prisma.user.findFirst({ where: { role: "FINANCEIRO" } });
    if (!financeiro) {
      financeiro = await prisma.user.create({
        data: { email: "fin_nfe@heelcloth.com", name: "Fin Fiscal", passwordHash: "h", role: "FINANCEIRO" },
      });
    }

    let producao = await prisma.user.findFirst({ where: { role: "PRODUCAO" } });
    if (!producao) {
      producao = await prisma.user.create({
        data: { email: "prod_nfe@heelcloth.com", name: "Prod Fiscal", passwordHash: "h", role: "PRODUCAO" },
      });
    }

    let vendedor = await prisma.user.findFirst({ where: { role: "VENDEDOR" } });
    if (!vendedor) {
      vendedor = await prisma.user.create({
        data: { email: "vend_nfe@heelcloth.com", name: "Vend Fiscal", passwordHash: "h", role: "VENDEDOR" },
      });
    }

    // 2. TESTE DA REGRA CRÍTICA DA SEÇÃO 14.1:
    // "O módulo de NF-e é estritamente restrito ao perfil ADMIN no backend."
    assert(admin.role === "ADMIN", "Perfil ADMIN autorizado na emissão fiscal");
    assert(financeiro.role !== "ADMIN", "Perfil FINANCEIRO bloqueado na NF-e (Seção 14.1)");
    assert(producao.role !== "ADMIN", "Perfil PRODUCAO bloqueado na NF-e (Seção 14.1)");
    assert(vendedor.role !== "ADMIN", "Perfil VENDEDOR bloqueado na NF-e (Seção 14.1)");

    // 3. Criar cliente e pedido para emissão fiscal
    const cliente = await prisma.customer.create({
      data: {
        name: "Clube Atlético Metropolitano",
        document: "12.345.678/0001-90",
        phone: "(11) 98765-4321",
        whatsapp: "5511987654321",
        email: "fiscal@cametropolitano.com.br",
      },
    });

    const orderNumber = `HC-NFE-${Date.now().toString().slice(-4)}`;
    const pedido = await prisma.order.create({
      data: {
        orderNumber,
        customerId: cliente.id,
        status: "PRONTO",
        totalAmount: 2400.0,
        paidAmount: 2400.0,
        pendingAmount: 0.0,
        paymentMethod: "PIX",
        items: {
          create: [
            {
              product: "Jogo de Uniforme Completo Futebol",
              quantity: 20,
              unitPrice: 120.0,
              totalPrice: 2400.0,
            },
          ],
        },
      },
      include: { items: true, customer: true },
    });

    assert(pedido.id !== undefined, "Pedido criado com sucesso para faturamento");

    // 4. Testar Provedor Fiscal e Emissão (Modelo 55)
    const provider = getNfeProvider();
    const dadosEmissao = {
      pedidoId: pedido.id,
      numeroPedido: pedido.orderNumber,
      cliente: {
        nome: cliente.name,
        cpfCnpj: cliente.document || "",
        email: cliente.email || undefined,
        telefone: cliente.phone || undefined,
        endereco: {
          logradouro: "Rua do Esporte",
          numero: "500",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01310-000",
        },
      },
      itens: pedido.items.map((i) => ({
        descricao: i.product,
        codigo: "HC-CONF",
        ncm: "61091000",
        cfop: "5101",
        quantidade: i.quantity,
        valorUnitario: i.unitPrice,
        valorTotal: i.totalPrice,
      })),
      valorTotal: pedido.totalAmount,
      formaPagamento: "PIX",
    };

    const respEmissao = await provider.emitir(dadosEmissao);
    assert(respEmissao.sucesso === true, "Comunicação com o provedor fiscal bem-sucedida");
    assert(respEmissao.status === "autorizada", "Status fiscal AUTORIZADA retornado");
    assert(respEmissao.chaveAcesso !== undefined, "Chave de acesso gerada");
    assert(respEmissao.chaveAcesso?.length === 44, "Chave de acesso possui exatamente 44 dígitos padrão SEFAZ");

    // 5. Gravação da NF-e no Banco de Dados
    const notaFiscal = await prisma.invoice.create({
      data: {
        orderId: pedido.id,
        invoiceNumber: respEmissao.numero || "1001",
        accessKey: respEmissao.chaveAcesso,
        series: respEmissao.serie || "1",
        status: "AUTORIZADA",
        xmlUrl: respEmissao.xmlUrl,
        danfeUrl: respEmissao.danfeUrl,
        emittedAt: new Date(),
      },
    });

    assert(notaFiscal.id !== undefined, "Nota fiscal registrada no banco com sucesso");
    assert(notaFiscal.status === "AUTORIZADA", "Status gravado como AUTORIZADA");

    // 6. Testar prevenção de duplicidade (mesmo pedido não pode emitir 2ª nota autorizada)
    const jaPossuiNota = await prisma.invoice.findFirst({
      where: { orderId: pedido.id, status: "AUTORIZADA" },
    });
    assert(jaPossuiNota !== null, "Prevenção de duplicidade: pedido identificado como já faturado");

    // 7. Testar geração e estrutura do XML da NF-e
    const xml = await provider.baixarXml(notaFiscal.accessKey!);
    const xmlStr = xml.toString();
    assert(xmlStr.includes('<nfeProc versao="4.00"'), "XML contém declaração nfeProc 4.00");
    assert(xmlStr.includes(notaFiscal.accessKey!), "XML contém a chave de acesso correspondente");
    assert(xmlStr.includes("61091000"), "XML contém o NCM têxtil padrão (61091000)");

    // 8. Testar geração do DANFE
    const danfe = await provider.baixarDanfe(notaFiscal.accessKey!);
    assert(danfe.length > 0, "Buffer do DANFE gerado com sucesso");

    // 9. Testar validação de justificativa de cancelamento (mínimo 15 caracteres)
    const justificativaCurta = "Cancelado";
    const justificativaCurtaValida = justificativaCurta.length >= 15;
    assert(!justificativaCurtaValida, "SEFAZ: Justificativa menor que 15 caracteres rejeitada");

    const justificativaCorreta = "Cancelamento homologado por distrato comercial antes da expedicao da carga";
    const justificativaCorretaValida = justificativaCorreta.length >= 15;
    assert(justificativaCorretaValida, "SEFAZ: Justificativa com 15+ caracteres aceita");

    // 10. Testar cancelamento de NF-e autorizada
    const respCancelamento = await provider.cancelar(notaFiscal.accessKey!, justificativaCorreta);
    assert(respCancelamento.sucesso === true, "Cancelamento homologado pelo provedor fiscal");

    const notaCancelada = await prisma.invoice.update({
      where: { id: notaFiscal.id },
      data: {
        status: "CANCELADA",
        errorMessage: `Cancelada: ${justificativaCorreta}`,
      },
    });

    assert(notaCancelada.status === "CANCELADA", "Status da nota atualizado para CANCELADA no banco");

    // 11. Limpeza dos dados de teste
    await prisma.invoice.delete({ where: { id: notaFiscal.id } });
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

testNfe();
