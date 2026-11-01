import { NextRequest, NextResponse } from "next/server";
import { contaAtual, criarCodigo, origemSite } from "@/lib/conta";
import { emailVerificacao } from "@/lib/email";
import { limitar, textoEspera } from "@/lib/limite";

// POST /api/conta/reenviar - manda de novo o e-mail de confirmação (3 por hora).
export async function POST(req: NextRequest) {
  const conta = await contaAtual(req);
  if (!conta) return NextResponse.json({ erro: "Entre na sua conta." }, { status: 401 });
  if (conta.verificado) return NextResponse.json({ ok: true, jaConfirmado: true });
  const lim = await limitar(`reenviar:${conta.id}`, 3, 3600);
  if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
  const codigo = await criarCodigo(conta.id, "VERIFICAR_EMAIL", 24 * 60);
  const enviado = await emailVerificacao(conta.email, conta.nome, `${await origemSite(req)}/loja/conta/verificar?codigo=${encodeURIComponent(codigo)}`);
  return NextResponse.json({ ok: true, emailEnviado: enviado });
}
