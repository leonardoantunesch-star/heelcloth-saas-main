import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { SENHA_FALSA, MINUTOS_CODIGO_LOGIN, anularCodigosLogin, criarCodigoLogin, criarDesafioLogin, gravarCookieConta, loginComCodigoAtivo } from "@/lib/conta";
import { emailCodigoLogin } from "@/lib/email";
import { ipDe, limitar, marcaDe, textoEspera, zerarLimite } from "@/lib/limite";

const schema = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120), senha: z.string().min(1, "Digite a senha.").max(128) });

// POST /api/conta/entrar - 1ª etapa do login do cliente: e-mail e senha. Se conferem, manda um código de 6 dígitos
// para o e-mail e devolve um "desafio" assinado; a sessão só é criada em /api/conta/entrar/codigo.
// Limite por IP e por e-mail, e a mesma mensagem para e-mail ou senha errados.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ erro: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    const { email, senha } = parsed.data;

    const chaveEmail = `login-cliente:e:${marcaDe(email)}`;
    const porIp = await limitar(`login-cliente:ip:${ipDe(req)}`, 30, 900);
    const porEmail = await limitar(chaveEmail, 8, 900);
    if (!porIp.ok || !porEmail.ok) return NextResponse.json({ erro: textoEspera(Math.max(porIp.esperaSeg, porEmail.esperaSeg)) }, { status: 429 });

    const conta = await prisma.conta.findUnique({ where: { email } });
    const confere = verifyPassword(senha, conta?.passwordHash ?? SENHA_FALSA);
    if (!conta || !confere) return NextResponse.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });

    await zerarLimite(chaveEmail);

    if (!loginComCodigoAtivo()) {
      const res = NextResponse.json({ ok: true });
      gravarCookieConta(res, conta);
      return res;
    }

    // No máximo 5 e-mails de código por hora para a mesma conta (evita encher a caixa de entrada de alguém).
    const envios = await limitar(`login-codigo-envio:${conta.id}`, 5, 3600);
    if (!envios.ok) return NextResponse.json({ erro: textoEspera(envios.esperaSeg) }, { status: 429 });
    const codigo = await criarCodigoLogin(conta.id);
    const enviado = await emailCodigoLogin(conta.email, conta.nome, codigo, MINUTOS_CODIGO_LOGIN);
    if (!enviado) {
      await anularCodigosLogin(conta.id);
      return NextResponse.json({ erro: "Não conseguimos enviar o código para o seu e-mail agora. Tente de novo em instantes." }, { status: 503 });
    }
    return NextResponse.json({ etapa: "codigo", desafio: criarDesafioLogin(conta), minutos: MINUTOS_CODIGO_LOGIN });
  } catch (erro) {
    console.error("Login de cliente:", erro);
    return NextResponse.json({ erro: "Não foi possível entrar. Tente de novo." }, { status: 500 });
  }
}
