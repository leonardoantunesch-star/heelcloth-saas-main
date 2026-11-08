import { lerLoja } from "./loja";

// Envio de e-mail pelo Resend (https://resend.com). Variáveis na Vercel:
//   RESEND_API_KEY     chave criada no painel do Resend
//   EMAIL_REMETENTE    ex.: Minha Loja <contato@seudominio.com.br> (o domínio precisa estar verificado no Resend)
// Sem RESEND_API_KEY nada é enviado: o link fica só no registro do servidor (útil para testar).

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function nomeDaLoja(): Promise<string> {
  try {
    return (await lerLoja()).config.marca.nome || "Loja";
  } catch {
    return "Loja";
  }
}

async function enviar(para: string, assunto: string, html: string, texto: string): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY?.trim();
  if (!chave) {
    console.warn(`[e-mail não enviado: RESEND_API_KEY ausente] para=${para} assunto="${assunto}"\n${texto}`);
    return false;
  }
  try {
    const r = await fetch(process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_REMETENTE?.trim() || "Loja <onboarding@resend.dev>", to: [para], subject: assunto, html, text: texto }),
    });
    if (!r.ok) console.error("Resend recusou o e-mail:", r.status, await r.text().catch(() => ""));
    return r.ok;
  } catch (erro) {
    console.error("Falha ao enviar e-mail:", erro);
    return false;
  }
}

// Teste do envio de e-mail (tela Diagnóstico). Devolve o motivo real da recusa do Resend, sem mostrar chave nenhuma.
export async function testarEmail(para: string): Promise<{ ok: boolean; status: number; detalhe: string }> {
  const chave = process.env.RESEND_API_KEY?.trim();
  if (!chave) return { ok: false, status: 0, detalhe: "A variável RESEND_API_KEY não está configurada na Vercel." };
  try {
    const r = await fetch(process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE?.trim() || "Loja <onboarding@resend.dev>",
        to: [para],
        subject: "Teste de e-mail do painel",
        text: "Se você recebeu esta mensagem, o envio de e-mails (incluindo o código de login) está funcionando.",
      }),
    });
    if (r.ok) return { ok: true, status: r.status, detalhe: "Enviado. Confira a caixa de entrada e o spam." };
    const j = (await r.json().catch(() => ({}))) as { message?: string };
    return { ok: false, status: r.status, detalhe: String(j.message || "O Resend recusou o envio.").slice(0, 400) };
  } catch {
    return { ok: false, status: 0, detalhe: "Não foi possível falar com o Resend (rede)." };
  }
}

function modelo(loja: string, titulo: string, corpo: string, botao: string, link: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td><p style="margin:0 0 8px;font-size:14px;color:#52525b">${esc(loja)}</p>
<h1 style="margin:0 0 16px;font-size:22px">${esc(titulo)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">${corpo}</p>
<p style="margin:0 0 24px"><a href="${esc(link)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold">${esc(botao)}</a></p>
<p style="margin:0;font-size:13px;color:#71717a;line-height:1.5">Se o botão não abrir, copie este endereço no navegador:<br>${esc(link)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function emailVerificacao(para: string, nome: string, link: string) {
  const loja = await nomeDaLoja();
  const primeiro = nome.split(" ")[0];
  const html = modelo(loja, "Confirme seu e-mail", `Olá, ${esc(primeiro)}! Confirme seu e-mail para proteger sua conta e ver seus pedidos anteriores. O link vale por 24 horas.`, "Confirmar e-mail", link);
  return enviar(para, `Confirme seu e-mail - ${loja}`, html, `Olá, ${primeiro}! Confirme seu e-mail (vale por 24 horas): ${link}`);
}

export async function emailRedefinicao(para: string, nome: string, link: string) {
  const loja = await nomeDaLoja();
  const primeiro = nome.split(" ")[0];
  const html = modelo(loja, "Criar uma nova senha", `Olá, ${esc(primeiro)}! Recebemos um pedido para trocar a senha da sua conta. O link vale por 1 hora. Se não foi você, ignore este e-mail: sua senha continua a mesma.`, "Criar nova senha", link);
  return enviar(para, `Nova senha - ${loja}`, html, `Olá, ${primeiro}! Para criar uma nova senha (vale por 1 hora): ${link}\nSe não foi você, ignore este e-mail.`);
}

// Código de login. Sem RESEND_API_KEY em produção nada é enviado e o código NÃO vai para o registro do servidor.
export async function emailCodigoLogin(para: string, nome: string, codigo: string, minutos: number): Promise<boolean> {
  if (!process.env.RESEND_API_KEY?.trim() && process.env.NODE_ENV === "production") {
    console.error("Código de login não enviado: RESEND_API_KEY ausente.");
    return false;
  }
  if (process.env.NODE_ENV === "production" && !process.env.EMAIL_REMETENTE?.trim()) {
    // Sem remetente próprio o Resend só entrega para o dono da conta dele: clientes não receberiam o código.
    console.error("Aviso: EMAIL_REMETENTE ausente. Com o remetente de teste do Resend, o código só chega para o e-mail do dono da conta Resend.");
  }
  const loja = await nomeDaLoja();
  const primeiro = nome.split(" ")[0];
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td><p style="margin:0 0 8px;font-size:14px;color:#52525b">${esc(loja)}</p>
<h1 style="margin:0 0 16px;font-size:22px">Seu código para entrar</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5">Olá, ${esc(primeiro)}! Digite este código na loja para concluir o login. Ele vale por ${minutos} minutos e só pode ser usado uma vez.</p>
<p style="margin:0 0 24px;font-size:36px;font-weight:bold;letter-spacing:10px;text-align:center;background:#f4f4f5;border-radius:12px;padding:16px 0">${esc(codigo)}</p>
<p style="margin:0;font-size:13px;color:#71717a;line-height:1.5">Se não foi você que tentou entrar, ignore este e-mail e troque sua senha: sem o código ninguém acessa sua conta.</p>
</td></tr></table></td></tr></table></body></html>`;
  return enviar(para, `${codigo} é seu código de acesso - ${loja}`, html, `Olá, ${primeiro}! Seu código para entrar na ${loja}: ${codigo}\nVale por ${minutos} minutos. Se não foi você, ignore este e-mail e troque sua senha.`);
}
