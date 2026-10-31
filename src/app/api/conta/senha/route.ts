import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { contaAtual, gravarCookieConta } from "@/lib/conta";
import { limitar, textoEspera } from "@/lib/limite";
import { senhaSchema } from "@/lib/senha-schema";

const schema = z.object({ atual: z.string().min(1).max(128), nova: senhaSchema });

// POST /api/conta/senha - troca a senha sabendo a atual. As outras sessões caem e esta continua logada.
export async function POST(req: NextRequest) {
  const conta = await contaAtual(req);
  if (!conta) return NextResponse.json({ erro: "Entre na sua conta." }, { status: 401 });
  const lim = await limitar(`senha:${conta.id}`, 8, 900);
  if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  if (!verifyPassword(parsed.data.atual, conta.passwordHash)) return NextResponse.json({ erro: "A senha atual está incorreta." }, { status: 400 });
  const passwordHash = hashPassword(parsed.data.nova);
  await prisma.conta.update({ where: { id: conta.id }, data: { passwordHash } });
  const res = NextResponse.json({ ok: true });
  gravarCookieConta(res, { id: conta.id, passwordHash });
  return res;
}
