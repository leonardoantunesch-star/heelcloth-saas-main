import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apagarCookieConta, usarCodigo } from "@/lib/conta";
import { ipDe, limitar, textoEspera } from "@/lib/limite";
import { senhaSchema } from "@/lib/senha-schema";

const schema = z.object({ codigo: z.string().min(10).max(200), senha: senhaSchema });

// POST /api/conta/redefinir { codigo, senha } - grava a nova senha. Quem recebeu o link prova que é dono do
// e-mail, então a conta também fica confirmada. Todas as sessões antigas deixam de valer.
export async function POST(req: NextRequest) {
  try {
    const lim = await limitar(`redefinir:${ipDe(req)}`, 10, 3600);
    if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    const conta = await usarCodigo(parsed.data.codigo, "REDEFINIR_SENHA");
    if (!conta) return NextResponse.json({ erro: "Este link venceu ou já foi usado. Peça um novo em \"Esqueci minha senha\"." }, { status: 400 });
    await prisma.conta.update({ where: { id: conta.id }, data: { passwordHash: hashPassword(parsed.data.senha), emailVerificadoEm: conta.emailVerificadoEm ?? new Date() } });
    const res = NextResponse.json({ ok: true });
    apagarCookieConta(res);
    return res;
  } catch (erro) {
    console.error("Redefinir senha:", erro);
    return NextResponse.json({ erro: "Não foi possível trocar a senha. Tente de novo." }, { status: 500 });
  }
}
