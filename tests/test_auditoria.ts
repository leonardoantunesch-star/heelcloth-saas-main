import { prisma } from "@/lib/db";
import { registrarAuditoria, listarAuditorias } from "@/services/auditoria";

async function testAuditoria() {
  console.log("🧪 Testando Auditoria & Logs de Segurança (Etapa 21 - Seção 18)...\n");
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
    // 1. Testar gravação de eventos com registrarAuditoria
    // -------------------------------------------------------------
    console.log("--- 1. Testando gravação de logs de auditoria ---");

    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "admin_audit@heelcloth.com",
          name: "Admin Audit",
          passwordHash: "h",
          role: "ADMIN",
        },
      });
    }

    const testEntityId = `ped-audit-${Date.now()}`;
    const log1 = await registrarAuditoria({
      userId: admin.id,
      action: "CRIACAO",
      entity: "PEDIDO",
      entityId: testEntityId,
      details: {
        orderNumber: "HC-AUDIT-001",
        totalAmount: 1800.0,
        cliente: "Atlética Medicina",
      },
      ipAddress: "192.168.1.50",
    });

    assert(log1 !== null, "Log de criação de pedido registrado no banco");
    assert(log1?.action === "CRIACAO", "Ação gravada como CRIACAO");
    assert(log1?.entity === "PEDIDO", "Entidade gravada como PEDIDO");
    assert(log1?.entityId === testEntityId, "ID da entidade confere");
    assert(log1?.details?.includes("HC-AUDIT-001") === true, "Detalhes serializados em formato JSON");

    // Testar gravação de ação de mudança de status
    const log2 = await registrarAuditoria({
      userId: admin.id,
      action: "STATUS_CHANGE",
      entity: "PRODUCAO",
      entityId: testEntityId,
      details: {
        etapaAnterior: "CORTE",
        etapaNova: "PERSONALIZACAO",
        responsavel: "Carlos M.",
      },
    });

    assert(log2 !== null, "Log de mudança de etapa produtiva registrado");
    assert(log2?.entity === "PRODUCAO", "Entidade PRODUCAO gravada");

    // Testar gravação sem usuário (ação do sistema / anônima)
    const logAnonimo = await registrarAuditoria({
      action: "LOGIN",
      entity: "AUTH",
      entityId: "session-anon",
      details: "Login efetuado com sucesso via credenciais seguras",
    });

    assert(logAnonimo !== null, "Log de sistema sem userId registrado com sucesso");
    assert(logAnonimo?.userId === null, "userId nulo tratado corretamente");

    // -------------------------------------------------------------
    // 2. Testar consulta e filtros com listarAuditorias
    // -------------------------------------------------------------
    console.log("\n--- 2. Testando listagem, busca e filtros de auditoria ---");

    // Listagem geral
    const listagem = await listarAuditorias({ page: 1, limit: 10 });
    assert(listagem.logs.length >= 2, "Listagem retornou logs gravados");
    assert(listagem.paginacao.total >= 2, "Total de registros computado");
    assert(listagem.metricas.totalHoje >= 2, "Métrica de ações hoje calculada");

    // Filtro por Entidade
    const filtroEntidade = await listarAuditorias({ entidade: "PRODUCAO" });
    const todosProducao = filtroEntidade.logs.every((l) => l.entity === "PRODUCAO");
    assert(todosProducao, "Filtro por entidade 'PRODUCAO' restringe registros corretamente");

    // Filtro por Ação
    const filtroAcao = await listarAuditorias({ acao: "STATUS_CHANGE" });
    const todosStatus = filtroAcao.logs.every((l) => l.action === "STATUS_CHANGE");
    assert(todosStatus, "Filtro por ação 'STATUS_CHANGE' funciona");

    // Busca textual
    const busca = await listarAuditorias({ busca: "HC-AUDIT-001" });
    assert(busca.logs.length >= 1, "Busca textual por termo no JSON de detalhes funciona");
    assert(busca.logs[0].entityId === testEntityId, "Registro correto retornado pela busca");

    // -------------------------------------------------------------
    // 3. Limpeza dos dados de teste
    // -------------------------------------------------------------
    if (log1) await prisma.auditLog.delete({ where: { id: log1.id } });
    if (log2) await prisma.auditLog.delete({ where: { id: log2.id } });
    if (logAnonimo) await prisma.auditLog.delete({ where: { id: logAnonimo.id } });

    console.log("🧹 Dados de teste limpos com sucesso.");
  } catch (error) {
    console.error("Erro no teste de Auditoria:", error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testAuditoria()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
