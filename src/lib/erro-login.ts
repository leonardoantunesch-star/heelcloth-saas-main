import { JWT_SECRET_AUSENTE } from "./jwt-secret";

// Traduz a falha técnica em um aviso que diz o que fazer. Nunca expõe senhas, URLs ou chaves.
export function descreverFalha(error: unknown): { erro: string; codigo: string } {
  const texto = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  const codigoPrisma = (error as { code?: string } | null)?.code;

  if (texto.includes(JWT_SECRET_AUSENTE)) {
    return {
      codigo: "JWT_SECRET_AUSENTE",
      erro: "A variável JWT_SECRET não está configurada no servidor (mínimo de 16 caracteres). Cadastre-a na Vercel em Settings > Environment Variables e faça um Redeploy.",
    };
  }
  // P2021 / P2022: a tabela ou coluna não existe no banco.
  if (codigoPrisma === "P2021" || codigoPrisma === "P2022" || /does not exist in the current database/i.test(texto)) {
    return {
      codigo: "TABELAS_AUSENTES",
      erro: "O banco de dados está sem as tabelas. Rode 'npm run prisma:push' e depois 'npm run prisma:seed' no seu computador, apontando para o banco de produção.",
    };
  }
  if (/Environment variable not found: DATABASE_URL|DATABASE_URL/i.test(texto) && /not found|invalid|empty/i.test(texto)) {
    return {
      codigo: "DATABASE_URL_AUSENTE",
      erro: "A variável DATABASE_URL não está configurada no servidor. Cadastre-a na Vercel e faça um Redeploy.",
    };
  }
  // P1000: senha errada. P1001/P1002/P1017: banco inacessível. P2024: fila de conexões esgotada.
  if (
    ["P1000", "P1001", "P1002", "P1003", "P1017", "P2024"].includes(codigoPrisma ?? "") ||
    /Can't reach database server|PrismaClientInitializationError|Authentication failed|timed out/i.test(texto)
  ) {
    return {
      codigo: "BANCO_INDISPONIVEL",
      erro: "Não foi possível conectar ao banco de dados. Confira a DATABASE_URL (senha, e use a conexão do pooler do Supabase, porta 6543, com ?pgbouncer=true) e faça um Redeploy.",
    };
  }
  return { codigo: "ERRO_INTERNO", erro: "Erro interno no servidor ao processar autenticação. Veja os logs do deploy na Vercel." };
}
