import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { contaAtual } from "@/lib/conta";

const schema = z.object({ nome: z.string().trim().min(3, "Informe seu nome completo.").max(100), telefone: z.string().trim().max(20).optional() });

// PATCH /api/conta/perfil - atualiza nome e telefone.
export async function PATCH(req: NextRequest) {
  const conta = await contaAtual(req);
  if (!conta) return NextResponse.json({ erro: "Entre na sua conta." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  await prisma.conta.update({ where: { id: conta.id }, data: { nome: parsed.data.nome, telefone: parsed.data.telefone || null } });
  return NextResponse.json({ ok: true });
}
