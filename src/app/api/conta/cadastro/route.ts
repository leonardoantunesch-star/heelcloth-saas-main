import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apagarCookieConta, criarCodigo, gravarCookieConta, origemSite } from "@/lib/conta";
import { emailVerificacao } from "@/lib/email";
import { ipDe, limitar, textoEspera } from "@/lib/limite";
import { senhaSchema } from "@/lib/senha-schema";

const schema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo.").max(100),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120),
  telefone: z.string().trim().max(20).optional(),
  senha: senhaSchema,
});

// POST /api/conta/cadastro - cria a conta do cliente, manda o e-mail de confirmação e já deixa logado.
export async function POST(req: NextRequest) {
  try {
    const lim = await limitar(`cadastro:${ipDe(req)}`, 5, 3600);
    if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    const { nome, email, telefone, senha } = parsed.data;

    if (await prisma.conta.findUnique({ where: { email } })) {
      return NextResponse.json({ erro: "Já existe uma conta com esse e-mail. Entre ou crie uma nova senha." }, { status: 409 });
    }
    let conta;
    try {
      conta = await prisma.conta.create({ data: { nome, email, telefone: telefone || null, passwordHash: hashPassword(senha) } });
    } catch {
      return NextResponse.json({ erro: "Já existe uma conta com esse e-mail. Entre ou crie uma nova senha." }, { status: 409 });
    }

    const codigo = await criarCodigo(conta.id, "VERIFICAR_EMAIL", 24 * 60);
    const enviado = await emailVerificacao(conta.email, conta.nome, `${await origemSite(req)}/loja/conta/verificar?codigo=${encodeURIComponent(codigo)}`);

    const res = NextResponse.json({ ok: true, emailEnviado: enviado });
    apagarCookieConta(res);
    gravarCookieConta(res, conta);
    return res;
  } catch (erro) {
    console.error("Cadastro de cliente:", erro);
    return NextResponse.json({ erro: "Não foi possível criar a conta. Tente de novo." }, { status: 500 });
  }
}
