import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { testarEmail } from "@/lib/email";
import { ipDe, limitar, textoEspera } from "@/lib/limite";

// Só ADMIN. Mostra apenas se cada configuração existe (sim/não), nunca o valor.
const tem = (nome: string) => Boolean(process.env[nome]?.trim());

function negado(error: unknown) {
  const m = error instanceof Error ? error.message : "";
  if (m === "UNAUTHORIZED") return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (m === "FORBIDDEN") return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  return null;
}

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const producao = process.env.NODE_ENV === "production";
    const itens = [
      { nome: "RESEND_API_KEY", ok: tem("RESEND_API_KEY"), obrigatorio: true, para: "Enviar o código de 6 dígitos do login e os e-mails da conta." },
      { nome: "EMAIL_REMETENTE", ok: tem("EMAIL_REMETENTE"), obrigatorio: true, para: "Remetente com domínio verificado no Resend. Sem isso o Resend só entrega para o dono da conta dele, e os clientes não recebem o código." },
      { nome: "GOOGLE_CLIENT_ID", ok: tem("GOOGLE_CLIENT_ID"), obrigatorio: false, para: "Botão “Entrar com o Google”." },
      { nome: "GOOGLE_CLIENT_SECRET", ok: tem("GOOGLE_CLIENT_SECRET"), obrigatorio: false, para: "Botão “Entrar com o Google”." },
      { nome: "MERCADOPAGO_ACCESS_TOKEN", ok: tem("MERCADOPAGO_ACCESS_TOKEN"), obrigatorio: false, para: "Cobrar por Pix na loja." },
      { nome: "MERCADOPAGO_WEBHOOK_SECRET", ok: tem("MERCADOPAGO_WEBHOOK_SECRET"), obrigatorio: false, para: "Confirmar pagamentos automaticamente com segurança." },
      { nome: "JWT_SECRET", ok: tem("JWT_SECRET"), obrigatorio: true, para: "Assinar o login (cliente e equipe)." },
      { nome: "NEXT_PUBLIC_SITE_URL", ok: tem("NEXT_PUBLIC_SITE_URL"), obrigatorio: false, para: "Endereço usado nos links e no retorno do Google." },
    ];
    return NextResponse.json({
      producao,
      itens,
      // Aviso importante: com isto ligado o login do cliente vira só e-mail + senha.
      loginSemCodigo: process.env.LOGIN_SEM_CODIGO === "1",
    });
  } catch (error) {
    return negado(error) ?? NextResponse.json({ erro: "Erro ao ler o diagnóstico" }, { status: 500 });
  }
}

// Envia um e-mail de teste para o próprio e-mail de quem está logado.
export async function POST(req: NextRequest) {
  try {
    const sessao = await requireRole(["ADMIN"]);
    const lim = await limitar(`diag-email:${ipDe(req)}`, 5, 600);
    if (!lim.ok) return NextResponse.json({ erro: textoEspera(lim.esperaSeg) }, { status: 429 });
    const r = await testarEmail(sessao.email);
    return NextResponse.json({ ok: r.ok, status: r.status, detalhe: r.detalhe, para: sessao.email });
  } catch (error) {
    return negado(error) ?? NextResponse.json({ erro: "Erro ao testar o e-mail" }, { status: 500 });
  }
}
