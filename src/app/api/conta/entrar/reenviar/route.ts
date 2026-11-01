import { NextRequest, NextResponse } from "next/server";
import { MINUTOS_CODIGO_LOGIN, anularCodigosLogin, contaDoDesafio, criarCodigoLogin } from "@/lib/conta";
import { emailCodigoLogin } from "@/lib/email";
import { ipDe, limitar, textoEspera } from "@/lib/limite";

// POST /api/conta/entrar/reenviar { desafio } - manda outro código para quem já passou pela senha (3 por 10 min).
export async function POST(req: NextRequest) {
  try {
    const { desafio } = (await req.json().catch(() => ({}))) as { desafio?: string };
    const porIp = await limitar(`login-reenvio:ip:${ipDe(req)}`, 15, 3600);
    if (!porIp.ok) return NextResponse.json({ erro: textoEspera(porIp.esperaSeg) }, { status: 429 });
    const conta = await contaDoDesafio(typeof desafio === "string" ? desafio : undefined);
    if (!conta) return NextResponse.json({ erro: "Esta etapa venceu. Digite seu e-mail e senha de novo.", reiniciar: true }, { status: 401 });
    const lim = await limitar(`login-reenvio:c:${conta.id}`, 3, 600);
    const horaria = await limitar(`login-codigo-envio:${conta.id}`, 5, 3600);
    if (!lim.ok || !horaria.ok) return NextResponse.json({ erro: textoEspera(Math.max(lim.esperaSeg, horaria.esperaSeg)) }, { status: 429 });
    const codigo = await criarCodigoLogin(conta.id);
    if (!(await emailCodigoLogin(conta.email, conta.nome, codigo, MINUTOS_CODIGO_LOGIN))) {
      await anularCodigosLogin(conta.id);
      return NextResponse.json({ erro: "Não conseguimos enviar o código agora. Tente de novo em instantes." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("Reenviar código de login:", erro);
    return NextResponse.json({ erro: "Não foi possível reenviar. Tente de novo." }, { status: 500 });
  }
}
