import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { PERFIS } from "@/lib/permissoes";
import { senhaSchema } from "@/lib/senha-schema";
import { ipDe } from "@/lib/limite";
import { registrarAuditoria } from "@/services/auditoria";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const editarSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome da pessoa.").max(80),
    role: z.enum(PERFIS as [string, ...string[]], { message: "Perfil inválido." }),
    active: z.boolean(),
    password: senhaSchema,
  })
  .partial();

// PATCH /api/equipe/[id] - muda nome, perfil, ativa/desativa ou define nova senha (só administrador)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const sessao = await requireRole(["ADMIN"]);
    const { id } = await params;
    const dados = editarSchema.safeParse(await req.json().catch(() => null));
    if (!dados.success) {
      return NextResponse.json({ erro: dados.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    }
    const { name, role, active, password } = dados.data;
    if (name === undefined && role === undefined && active === undefined && password === undefined) {
      return NextResponse.json({ erro: "Nada para alterar." }, { status: 400 });
    }

    const alvo = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, active: true } });
    if (!alvo) return NextResponse.json({ erro: "Pessoa não encontrada." }, { status: 404 });

    const ehEu = alvo.id === sessao.userId;
    const deixaDeSerAdminAtivo = alvo.role === "ADMIN" && alvo.active && (role !== undefined && role !== "ADMIN" || active === false);
    if (ehEu && (deixaDeSerAdminAtivo || active === false)) {
      return NextResponse.json({ erro: "Você não pode tirar o seu próprio acesso de administrador nem se desativar." }, { status: 400 });
    }
    if (deixaDeSerAdminAtivo) {
      const outros = await prisma.user.count({ where: { role: "ADMIN", active: true, NOT: { id } } });
      if (outros === 0) {
        return NextResponse.json({ erro: "É preciso manter pelo menos um administrador ativo." }, { status: 400 });
      }
    }

    const pessoa = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(password !== undefined ? { passwordHash: hashPassword(password) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    await registrarAuditoria({
      userId: sessao.userId,
      action: "ATUALIZACAO",
      entity: "USUARIO",
      entityId: id,
      // A senha nunca vai para o registro: só o fato de ter sido trocada.
      details: { nome: name, perfil: role, ativo: active, senhaTrocada: password !== undefined || undefined },
      ipAddress: ipDe(req),
    });
    return NextResponse.json({ pessoa });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ erro: "Só o administrador gerencia a equipe." }, { status: 403 });
    console.error("Erro ao editar acesso:", error);
    return NextResponse.json({ erro: "Não foi possível concluir. Tente de novo." }, { status: 500 });
  }
}
