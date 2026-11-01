import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { PERFIS } from "@/lib/permissoes";
import { senhaSchema } from "@/lib/senha-schema";
import { ipDe } from "@/lib/limite";
import { registrarAuditoria } from "@/services/auditoria";

const criarSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da pessoa.").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120),
  role: z.enum(PERFIS as [string, ...string[]], { message: "Escolha o perfil de acesso." }),
  password: senhaSchema,
});

const CAMPOS = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;

function falha(error: unknown, contexto: string) {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Só o administrador gerencia a equipe." }, { status: 403 });
  console.error(contexto, error);
  return NextResponse.json({ erro: "Não foi possível concluir. Tente de novo." }, { status: 500 });
}

// GET /api/equipe - quem tem login e o perfil de cada um (só administrador)
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const pessoas = await prisma.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], select: CAMPOS });
    return NextResponse.json({ pessoas });
  } catch (error) {
    return falha(error, "Erro ao listar equipe:");
  }
}

// POST /api/equipe - cria um novo acesso (só administrador)
export async function POST(req: NextRequest) {
  try {
    const sessao = await requireRole(["ADMIN"]);
    const dados = criarSchema.safeParse(await req.json().catch(() => null));
    if (!dados.success) {
      return NextResponse.json({ erro: dados.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    }
    const { name, email, role, password } = dados.data;

    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ erro: "Já existe um acesso com esse e-mail." }, { status: 409 });
    }
    const pessoa = await prisma.user.create({
      data: { name, email, role, active: true, passwordHash: hashPassword(password) },
      select: CAMPOS,
    });
    await registrarAuditoria({
      userId: sessao.userId,
      action: "CRIACAO",
      entity: "USUARIO",
      entityId: pessoa.id,
      details: { email, perfil: role },
      ipAddress: ipDe(req),
    });
    return NextResponse.json({ pessoa }, { status: 201 });
  } catch (error) {
    return falha(error, "Erro ao criar acesso:");
  }
}
