import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { MINUTOS_CODIGO_LOGIN, apagarCookieConta, criarCodigo, gravarCookieConta, loginComCodigoAtivo, origemSite } from "@/lib/conta";
import { mandarCodigoLogin } from "@/lib/conta-codigo";
import { emailVerificacao } from "@/lib/email";
import { ipDe, limitar, textoEspera } from "@/lib/limite";
import { senhaSchema } from "@/lib/senha-schema";

const schema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo.").max(100),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120),
  telefone: z.string().trim().max(20).optional(),
  senha: senhaSchema,
});

// POST /api/conta/cadastro - cria a conta do cliente. Com o código ativo (padrão), manda um código de 6 dígitos para o
// e-mail e devolve o "desafio": a sessão só nasce quando o código confere (em /api/conta/entrar/codigo), o que também
// confirma o e-mail. Sem o código (LOGIN_SEM_CODIGO=1), mantém o jeito antigo: link de confirmação e já fica logado.
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

    if (loginComCodigoAtivo()) {
      const r = await mandarCodigoLogin(conta);
      if (!r.ok) {
        // Sem conseguir mandar o código a conta ficaria inacessível: desfaz, e a pessoa tenta de novo.
        await prisma.conta.delete({ where: { id: conta.id } }).catch(() => {});
        return NextResponse.json({ erro: r.erro }, { status: r.status });
      }
      const res = NextResponse.json({ ok: true, etapa: "codigo", desafio: r.desafio, minutos: MINUTOS_CODIGO_LOGIN });
      apagarCookieConta(res);
      return res;
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
