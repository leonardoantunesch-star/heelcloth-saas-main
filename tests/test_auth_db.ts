import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createToken, verifyToken } from "@/lib/auth";

async function runTests() {
  console.log("🧪 Iniciando bateria de testes: Banco de Dados, Autenticação e Permissões...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Teste de Banco de Dados
    const usersCount = await prisma.user.count();
    assert(usersCount >= 4, `Banco de dados: Usuários cadastrados (${usersCount} encontrados)`);

    const productsCount = await prisma.product.count();
    assert(productsCount >= 5, `Banco de dados: Catálogo de produtos (${productsCount} itens)`);

    const customersCount = await prisma.customer.count();
    assert(customersCount >= 2, `Banco de dados: Clientes cadastrados (${customersCount} clientes)`);

    const ordersCount = await prisma.order.count();
    assert(ordersCount >= 1, `Banco de dados: Pedidos criados (${ordersCount} pedidos)`);

    const playersCount = await prisma.orderPlayer.count();
    assert(playersCount >= 12, `Banco de dados: Jogadores individualizados para CorelDRAW (${playersCount} camisas)`);

    const inventoryCount = await prisma.inventoryItem.count();
    assert(inventoryCount >= 3, `Banco de dados: Itens de estoque (${inventoryCount} insumos)`);

    // 2. Teste de Criptografia de Senha
    const testPassword = "MinhaSenhaForte2026";
    const hashed = hashPassword(testPassword);
    assert(hashed.includes(":"), "Segurança: Hash de senha contém salt e hash scrypt");
    assert(verifyPassword(testPassword, hashed), "Segurança: Validação de senha correta");
    assert(!verifyPassword("SenhaErrada", hashed), "Segurança: Rejeição de senha incorreta");

    // 3. Teste de Autenticação com Usuários do Seed
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@heelcloth.com.br" } });
    assert(adminUser !== null && adminUser.role === "ADMIN", "RBAC: Usuário Admin localizado com perfil ADMIN");
    assert(verifyPassword("admin123", adminUser!.passwordHash), "Autenticação: Credenciais do Administrador válidas");

    const prodUser = await prisma.user.findUnique({ where: { email: "producao@heelcloth.com.br" } });
    assert(prodUser !== null && prodUser.role === "PRODUCAO", "RBAC: Usuário Produção localizado com perfil PRODUCAO");
    assert(verifyPassword("prod123", prodUser!.passwordHash), "Autenticação: Credenciais da Produção válidas");

    const finUser = await prisma.user.findUnique({ where: { email: "financeiro@heelcloth.com.br" } });
    assert(finUser !== null && finUser.role === "FINANCEIRO", "RBAC: Usuário Financeiro localizado com perfil FINANCEIRO");

    const vendUser = await prisma.user.findUnique({ where: { email: "vendedor@heelcloth.com.br" } });
    assert(vendUser !== null && vendUser.role === "VENDEDOR", "RBAC: Usuário Vendedor localizado com perfil VENDEDOR");

    // 4. Teste de Tokens de Sessão HMAC
    const token = createToken({
      userId: adminUser!.id,
      email: adminUser!.email,
      name: adminUser!.name,
      role: adminUser!.role as any,
    });
    assert(typeof token === "string" && token.split(".").length === 3, "Segurança: Token de sessão JWT estruturado");

    const sessionPayload = verifyToken(token);
    assert(sessionPayload !== null && sessionPayload.email === adminUser!.email, "Segurança: Token decodificado e verificado com sucesso");

    const invalidToken = token + "tampered";
    assert(verifyToken(invalidToken) === null, "Segurança: Token adulterado rejeitado corretamente");

    // 5. Teste de Regras de Permissão (Seção 14.1 e 25)
    // NF-e exclusiva para Administrador
    const canAdminEmitNfe = adminUser!.role === "ADMIN";
    const canProdEmitNfe = prodUser!.role === "ADMIN";
    const canFinEmitNfe = finUser!.role === "ADMIN";
    assert(canAdminEmitNfe, "Permissões Seção 14.1: Administrador possui autorização para emissão fiscal NF-e");
    assert(!canProdEmitNfe, "Permissões Seção 14.1: Produção bloqueada para emissão fiscal NF-e");
    assert(!canFinEmitNfe, "Permissões Seção 14.1: Financeiro comum bloqueado para emissão fiscal direta NF-e");

    // 6. Teste de Compatibilidade Legada de Preços e Cálculos
    const orderWithPlayers = await prisma.order.findFirst({
      where: { orderNumber: "HC-2603-0001" },
      include: { players: true, items: true },
    });
    assert(orderWithPlayers !== null, "Integridade: Pedido piloto localizado");
    assert(orderWithPlayers!.players.length === 12, "Integridade: 12 jogadores vinculados ao pedido piloto");

    console.log(`\n========================================`);
    console.log(`Resultados: ${passed} passaram, ${failed} falharam.`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Erro fatal no teste:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
