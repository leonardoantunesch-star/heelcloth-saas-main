import { prisma } from "@/lib/db";
import {
  obterConfiguracoes,
  salvarConfiguracoes,
  CONFIGURACOES_PADRAO,
} from "@/services/configuracoes";

async function testConfiguracoes() {
  console.log("🧪 Testando Configurações Globais da Empresa (Etapa 22 - Seção 22)...\n");
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
    // 1. Testar obtenção de configurações padrão
    // -------------------------------------------------------------
    console.log("--- 1. Testando defaults de configuração ---");

    const configs = await obterConfiguracoes();
    assert(configs.EMPRESA_CNPJ !== undefined, "Chave EMPRESA_CNPJ presente");
    assert(configs.EMPRESA_CNPJ.valor.length >= 14, "CNPJ válido carregado");
    assert(configs.PRAZO_PADRAO_DIAS.valor === "15", "Prazo padrão de 15 dias carregado");
    assert(configs.PERCENTUAL_SINAL_MINIMO.valor === "50", "Sinal mínimo de 50% carregado");
    assert(configs.CHAVE_PIX !== undefined, "Chave PIX presente");
    assert(configs.NFE_AMBIENTE.valor === "HOMOLOGACAO", "Ambiente SEFAZ padrão em HOMOLOGAÇÃO");
    assert(configs.NFE_NCM_PADRAO.valor === "6109.10.00", "NCM têxtil padrão presente");

    // -------------------------------------------------------------
    // 2. Testar atualização em lote e persistência
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando salvarConfiguracoes e auditoria ---");

    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "admin_cfg@heelcloth.com",
          name: "Admin Cfg",
          passwordHash: "h",
          role: "ADMIN",
        },
      });
    }

    const valorOriginalPrazo = configs.PRAZO_PADRAO_DIAS.valor;
    const valorNovoPrazo = "21";

    const resultadoSalvar = await salvarConfiguracoes(
      {
        PRAZO_PADRAO_DIAS: valorNovoPrazo,
        PERCENTUAL_SINAL_MINIMO: "60",
      },
      admin.id
    );

    assert(resultadoSalvar.sucesso === true, "salvarConfiguracoes retornou sucesso");
    assert(resultadoSalvar.totalSalvas === 2, "2 configurações atualizadas");

    // Verificar se persistiu no banco
    const configsAposUpdate = await obterConfiguracoes();
    assert(
      configsAposUpdate.PRAZO_PADRAO_DIAS.valor === valorNovoPrazo,
      "Novo prazo padrão de 21 dias persistido"
    );
    assert(
      configsAposUpdate.PERCENTUAL_SINAL_MINIMO.valor === "60",
      "Novo percentual de sinal de 60% persistido"
    );

    // Verificar se gerou log de auditoria
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: "CONFIG",
        entityId: "CONFIGURACOES_GLOBAIS",
        action: "ATUALIZACAO",
      },
      orderBy: { createdAt: "desc" },
    });

    assert(auditLog !== null, "Registro de auditoria gerado automaticamente na alteração de configurações");
    assert(auditLog?.userId === admin.id, "ID do administrador gravado na auditoria");
    assert(auditLog?.details?.includes("PRAZO_PADRAO_DIAS") === true, "Chave alterada informada no log");

    // Restaurar valor original
    await salvarConfiguracoes(
      {
        PRAZO_PADRAO_DIAS: valorOriginalPrazo,
        PERCENTUAL_SINAL_MINIMO: "50",
      },
      admin.id
    );

    // Limpar log de teste da auditoria
    if (auditLog) {
      await prisma.auditLog.delete({ where: { id: auditLog.id } });
    }

    console.log("🧹 Valores originais restaurados e dados de teste limpos.");
  } catch (error) {
    console.error("Erro no teste de Configurações:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testConfiguracoes()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
