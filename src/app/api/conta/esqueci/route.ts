import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { criarCodigo, origemSite } from "@/lib/conta";
import { emailRedefinicao } from "@/lib/email";
import { ipDe, limitar, marcaDe, textoEspera } from "@/lib/limite";

const schema = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120) });

// POST /api/conta/esqueci { email } - manda o link para criar nova senha. A resposta é sempre a mesma,
// exista ou não conta com o e-mail, para ninguém descobrir quem é cliente.
export async function POST(req: NextRequest) {
  try {
    const lim = await limitar(`esqueci:ip:${ipDe(req)}`, 6, 3600);
    if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ erro: parsed.error.issues[0]?.message || "E-mail inválido." }, { status: 400 });
    const { email } = parsed.data;

    const porEmail = await limitar(`esqueci:e:${marcaDe(email)}`, 3, 3600);
    const conta = porEmail.ok ? await prisma.conta.findUnique({ where: { email } }) : null;
    if (conta) {
      const codigo = await criarCodigo(conta.id, "REDEFINIR_SENHA", 60);
      await emailRedefinicao(conta.email, conta.nome, `${await origemSite(req)}/loja/conta/redefinir?codigo=${encodeURIComponent(codigo)}`);
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("Esqueci a senha:", erro);
    return NextResponse.json({ erro: "Não foi possível enviar agora. Tente de novo." }, { status: 500 });
  }
}
