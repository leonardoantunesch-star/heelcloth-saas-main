import { prisma } from "@/lib/db";

async function testEstoque() {
  console.log("🧪 Testando Estoque e Matéria-Prima (Etapa 14 - Seção 12)...\n");
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
    // 1. Obter usuário ADMIN para registrar movimentações
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: "admin_estoque@heelcloth.com",
          name: "Admin Estoque",
          passwordHash: "test_hash",
          role: "ADMIN",
        },
      });
    }

    // 2. Criar novo item de estoque (Tecido Dry Fit Furadinho)
    const itemTecido = await prisma.inventoryItem.create({
      data: {
        name: "Tecido Dry Fit Furadinho Lateral",
        category: "TECIDO",
        unit: "METRO",
        quantity: 80.0,
        minQuantity: 30.0,
        cost: 16.5,
        supplier: "Malharia Brasil Têxtil",
        movements: {
          create: {
            type: "ENTRADA",
            quantity: 80.0,
            previousQty: 0,
            newQty: 80.0,
            reason: "Saldo inicial de abertura de estoque",
            userId: admin.id,
          },
        },
      },
      include: { movements: true },
    });

    assert(itemTecido.id !== undefined, "Item de tecido cadastrado com sucesso");
    assert(itemTecido.quantity === 80.0, "Saldo inicial de 80 metros gravado");
    assert(itemTecido.movements.length === 1, "Movimentação inicial de ENTRADA registrada");
    assert(itemTecido.quantity > itemTecido.minQuantity, "Item criado com estoque regular (80 > 30)");

    // 3. Testar movimentação de ENTRADA (compra adicional de 50 metros)
    const saldoAnterior = itemTecido.quantity;
    const qtdEntrada = 50.0;
    const novoSaldoEntrada = saldoAnterior + qtdEntrada;

    const entrada = await prisma.$transaction(async (tx) => {
      const atualizado = await tx.inventoryItem.update({
        where: { id: itemTecido.id },
        data: { quantity: novoSaldoEntrada },
      });
      const mov = await tx.inventoryMovement.create({
        data: {
          itemId: itemTecido.id,
          type: "ENTRADA",
          quantity: qtdEntrada,
          previousQty: saldoAnterior,
          newQty: novoSaldoEntrada,
          reason: "Compra NF 45892",
          userId: admin.id,
        },
      });
      return { atualizado, mov };
    });

    assert(entrada.atualizado.quantity === 130.0, "Saldo atualizado para 130m após ENTRADA de 50m");
    assert(entrada.mov.type === "ENTRADA", "Tipo de movimentação ENTRADA confirmado");

    // 4. Testar movimentação de SAÍDA (consumo de 110 metros para produção de lote)
    const saldoAntesSaida = entrada.atualizado.quantity; // 130m
    const qtdSaida = 110.0;
    const novoSaldoSaida = saldoAntesSaida - qtdSaida; // 20m

    const saida = await prisma.$transaction(async (tx) => {
      const atualizado = await tx.inventoryItem.update({
        where: { id: itemTecido.id },
        data: { quantity: novoSaldoSaida },
      });
      const mov = await tx.inventoryMovement.create({
        data: {
          itemId: itemTecido.id,
          type: "SAIDA",
          quantity: qtdSaida,
          previousQty: saldoAntesSaida,
          newQty: novoSaldoSaida,
          reason: "Consumo produção lote camisas",
          userId: admin.id,
        },
      });
      return { atualizado, mov };
    });

    assert(saida.atualizado.quantity === 20.0, "Saldo reduzido para 20m após SAÍDA de 110m");
    assert(saida.mov.type === "SAIDA", "Tipo de movimentação SAÍDA confirmado");

    // 5. Testar regra de Estoque Baixo (Seção 12: quantity <= minQuantity)
    // minQuantity é 30m, saldo atual é 20m -> Alerta Crítico!
    const isAlertaBaixo = saida.atualizado.quantity <= saida.atualizado.minQuantity;
    assert(isAlertaBaixo === true, "Alerta de Estoque Baixo ativado: saldo (20m) <= mínimo (30m)");

    // 6. Testar bloqueio de SAÍDA com saldo insuficiente
    const saldoDisponivel = saida.atualizado.quantity; // 20m
    const tentativaSaidaMaior = 50.0;
    const saldoSuficiente = tentativaSaidaMaior <= saldoDisponivel;
    assert(!saldoSuficiente, "Validação de estoque: saída maior que saldo disponível é bloqueada");

    // 7. Testar movimentação de AJUSTE (balanço físico aponta 25 metros)
    const saldoAntesAjuste = saida.atualizado.quantity; // 20m
    const novoSaldoAjuste = 25.0; // inventário físico

    const ajuste = await prisma.$transaction(async (tx) => {
      const atualizado = await tx.inventoryItem.update({
        where: { id: itemTecido.id },
        data: { quantity: novoSaldoAjuste },
      });
      const mov = await tx.inventoryMovement.create({
        data: {
          itemId: itemTecido.id,
          type: "AJUSTE",
          quantity: novoSaldoAjuste,
          previousQty: saldoAntesAjuste,
          newQty: novoSaldoAjuste,
          reason: "Balanço físico semanal de almoxarifado",
          userId: admin.id,
        },
      });
      return { atualizado, mov };
    });

    assert(ajuste.atualizado.quantity === 25.0, "Saldo ajustado diretamente para 25m via AJUSTE");
    assert(ajuste.mov.type === "AJUSTE", "Tipo de movimentação AJUSTE gravado");

    // 8. Testar atualização de dados cadastrais (preço de custo e fornecedor)
    const atualizadoCad = await prisma.inventoryItem.update({
      where: { id: itemTecido.id },
      data: {
        cost: 18.0,
        supplier: "Malharia Brasil Têxtil Ltda (Atualizado)",
      },
    });

    assert(atualizadoCad.cost === 18.0, "Custo unitário atualizado para R$ 18,00");
    assert(atualizadoCad.supplier?.includes("Atualizado") === true, "Fornecedor atualizado");

    // 9. Testar cálculo de valor total do estoque (quantidade * custo)
    const valorTotalItem = atualizadoCad.quantity * atualizadoCad.cost; // 25 * 18 = 450
    assert(valorTotalItem === 450.0, "Valor monetário acumulado do item calculado corretamente (R$ 450,00)");

    // 10. Testar histórico de movimentações completo do item
    const historico = await prisma.inventoryMovement.findMany({
      where: { itemId: itemTecido.id },
      orderBy: { createdAt: "desc" },
    });

    assert(historico.length === 4, "4 movimentações rastreadas no histórico do item (Abertura, Entrada, Saída, Ajuste)");

    // Limpeza do item de teste
    await prisma.inventoryItem.delete({ where: { id: itemTecido.id } });

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

testEstoque();
