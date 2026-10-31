import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { anularCodigosLogin, contaDoDesafio, gravarCookieConta, usarCodigoLogin } from "@/lib/conta";
import { ipDe, limitar, textoEspera, zerarLimite } from "@/lib/limite";

// POST /api/conta/entrar/codigo { desafio, codigo } - 2ª etapa do login: confere o código do e-mail e cria a sessão.
// 5 erros e o código é anulado (é preciso entrar de novo para receber outro). Quem digita o código certo prova
// que é dono do e-mail, então a conta também fica confirmada.
export async function POST(req: NextRequest) {
  try {
    const { desafio, codigo } = (await req.json().catch(() => ({}))) as { desafio?: string; codigo?: string };
    const porIp = await limitar(`login-codigo:ip:${ipDe(req)}`, 40, 900);
    if (!porIp.ok) return NextResponse.json({ erro: textoEspera(porIp.esperaSeg) }, { status: 429 });
    const conta = await contaDoDesafio(typeof desafio === "string" ? desafio : undefined);
    if (!conta) return NextResponse.json({ erro: "Esta etapa venceu. Digite seu e-mail e senha de novo.", reiniciar: true }, { status: 401 });

    const chave = `login-codigo:c:${conta.id}`;
    const tent = await limitar(chave, 5, 600);
    if (!tent.ok) {
      await anularCodigosLogin(conta.id);
      return NextResponse.json({ erro: "Muitos erros. Entre de novo para receber outro código.", reiniciar: true }, { status: 429 });
    }
    const limpo = String(codigo ?? "").replace(/\s+/g, "");
    if (!(await usarCodigoLogin(conta.id, limpo))) return NextResponse.json({ erro: "Código incorreto ou vencido." }, { status: 401 });

    await zerarLimite(chave);
    if (!conta.emailVerificadoEm) await prisma.conta.update({ where: { id: conta.id }, data: { emailVerificadoEm: new Date() } });
    const res = NextResponse.json({ ok: true });
    gravarCookieConta(res, conta);
    return res;
  } catch (erro) {
    console.error("Código de login:", erro);
    return NextResponse.json({ erro: "Não foi possível confirmar o código. Tente de novo." }, { status: 500 });
  }
}
