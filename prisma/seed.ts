import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Hashing de senha com salting idêntico ao implementado em src/lib/auth.ts
 * Utiliza scrypt nativo do Node.js: crypto.scryptSync(password, salt, 64)
 * Formato retornado: `${salt}:${hash}`
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

interface DemoUser {
  name: string;
  email: string;
  role: "ADMIN" | "PRODUCAO" | "FINANCEIRO" | "VENDEDOR";
  password: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    name: "Administrador",
    email: "admin@heelcloth.com.br",
    role: "ADMIN",
    password: "admin123",
  },
  {
    name: "Produção",
    email: "producao@heelcloth.com.br",
    role: "PRODUCAO",
    password: "prod123",
  },
  {
    name: "Financeiro",
    email: "financeiro@heelcloth.com.br",
    role: "FINANCEIRO",
    password: "fin123",
  },
  {
    name: "Vendedor",
    email: "vendedor@heelcloth.com.br",
    role: "VENDEDOR",
    password: "vendas123",
  },
];

async function main() {
  console.log("🌱 Iniciando seed idempotente do banco de dados Heelcloth (Supabase / PostgreSQL)...");

  for (const user of DEMO_USERS) {
    const passwordHash = hashPassword(user.password);

    const upsertedUser = await prisma.user.upsert({
      where: {
        email: user.email.toLowerCase().trim(),
      },
      update: {
        name: user.name,
        role: user.role,
        active: true,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email.toLowerCase().trim(),
        role: user.role,
        active: true,
        passwordHash,
      },
    });

    console.log(`✅ Usuário garantido: [${upsertedUser.role}] ${upsertedUser.name} <${upsertedUser.email}>`);
  }

  console.log("🎉 Seed finalizado com sucesso! Todos os usuários estão ativos e prontos para autenticação.");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante a execução do seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
