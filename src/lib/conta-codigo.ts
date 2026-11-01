import { MINUTOS_CODIGO_LOGIN, anularCodigosLogin, criarCodigoLogin, criarDesafioLogin } from "./conta";
import { emailCodigoLogin } from "./email";
import { limitar, textoEspera } from "./limite";

type ContaBase = { id: string; email: string; nome: string; passwordHash: string };

// Manda o código de 6 dígitos para o e-mail da conta e devolve o "desafio" assinado da 2ª etapa.
// No máximo 5 e-mails de código por hora para a mesma conta (não enche a caixa de entrada de ninguém).
// Usado no login (depois da senha) e no cadastro (para provar que o e-mail é da pessoa).
export async function mandarCodigoLogin(conta: ContaBase): Promise<{ ok: true; desafio: string } | { ok: false; status: number; erro: string }> {
  const envios = await limitar(`login-codigo-envio:${conta.id}`, 5, 3600);
  if (!envios.ok) return { ok: false, status: 429, erro: textoEspera(envios.esperaSeg) };
  const codigo = await criarCodigoLogin(conta.id);
  const enviado = await emailCodigoLogin(conta.email, conta.nome, codigo, MINUTOS_CODIGO_LOGIN);
  if (!enviado) {
    await anularCodigosLogin(conta.id);
    return { ok: false, status: 503, erro: "Não conseguimos enviar o código para o seu e-mail agora. Tente de novo em instantes." };
  }
  return { ok: true, desafio: criarDesafioLogin(conta) };
}
