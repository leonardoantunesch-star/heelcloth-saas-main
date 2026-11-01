import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { apagarCookieConta, contaAtual } from "@/lib/conta";
import { limitar, textoEspera } from "@/lib/limite";

const schema = z.object({ senha: z.string().min(1).max(128) });

// POST /api/conta/excluir - apaga a conta e os dados de acesso (LGPD). Os pedidos continuam no sistema da loja,
// sem ligação com a conta, porque a loja precisa guardá-los para fins fiscais.
export async function POST(req: NextRequest) {
  const conta = await contaAtual(req);
  if (!conta) return NextResponse.json({ erro: "Entre na sua conta." }, { status: 401 });
  const lim = await limitar(`excluir:${conta.id}`, 5, 900);
  if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !verifyPassword(parsed.data.senha, conta.passwordHash)) return NextResponse.json({ erro: "Senha incorreta." }, { status: 400 });
  await prisma.conta.delete({ where: { id: conta.id } });
  const res = NextResponse.json({ ok: true });
  apagarCookieConta(res);
  return res;
}
