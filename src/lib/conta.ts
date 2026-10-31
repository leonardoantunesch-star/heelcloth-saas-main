import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { COOKIE_NAME } from "./auth";
import { getJwtSecret } from "./jwt-secret";

// Contas de CLIENTE da loja. É um login totalmente separado do painel da equipe:
// outro cookie, outra chave de assinatura e outro tipo de token, então um token de cliente nunca abre o /admin.

export const COOKIE_CONTA = COOKIE_NAME.replace(/_session$/, "_cliente");
const DIAS_SESSAO = 14;

export interface ContaPublica {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  verificado: boolean;
}

const chave = () => `${getJwtSecret()}|conta-cliente`;
const assinar = (texto: string) => crypto.createHmac("sha256", chave()).update(texto).digest("base64url");
// Impressão da senha atual: quando a senha muda, as sessões antigas deixam de valer.
const marcaSenha = (hash: string) => crypto.createHash("sha256").update(hash).digest("hex").slice(0, 16);

export function criarTokenConta(c: { id: string; passwordHash: string }): string {
  const corpo = Buffer.from(JSON.stringify({ t: "conta", sub: c.id, v: marcaSenha(c.passwordHash), exp: Math.floor(Date.now() / 1000) + DIAS_SESSAO * 86400 })).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

function lerTokenConta(token: string | undefined): { sub: string; v: string } | null {
  try {
    if (!token) return null;
    const [corpo, assinatura] = token.split(".");
    if (!corpo || !assinatura) return null;
    const esperada = Buffer.from(assinar(corpo));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !crypto.timingSafeEqual(esperada, recebida)) return null;
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    if (dados.t !== "conta" || typeof dados.sub !== "string" || dados.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: dados.sub, v: String(dados.v) };
  } catch {
    return null;
  }
}

export function gravarCookieConta(res: NextResponse, conta: { id: string; passwordHash: string }) {
  res.cookies.set({ name: COOKIE_CONTA, value: criarTokenConta(conta), httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DIAS_SESSAO * 86400 });
}

export function apagarCookieConta(res: NextResponse) {
  res.cookies.set({ name: COOKIE_CONTA, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

const publica = (c: { id: string; email: string; nome: string; telefone: string | null; emailVerificadoEm: Date | null }): ContaPublica => ({
  id: c.id,
  email: c.email,
  nome: c.nome,
  telefone: c.telefone,
  verificado: Boolean(c.emailVerificadoEm),
});

// Cliente logado (ou null). Confere no banco para que conta apagada ou senha trocada derrube a sessão.
export async function contaAtual(req?: Request): Promise<(ContaPublica & { passwordHash: string }) | null> {
  let token: string | undefined;
  if (req) {
    const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|; )${COOKIE_CONTA}=([^;]*)`));
    token = m ? decodeURIComponent(m[1]) : undefined;
  } else {
    try {
      token = (await cookies()).get(COOKIE_CONTA)?.value;
    } catch {
      token = undefined;
    }
  }
  const t = lerTokenConta(token);
  if (!t) return null;
  const c = await prisma.conta.findUnique({ where: { id: t.sub } });
  if (!c || marcaSenha(c.passwordHash) !== t.v) return null;
  return { ...publica(c), passwordHash: c.passwordHash };
}

export const semSenha = ({ passwordHash: _ignorado, ...resto }: ContaPublica & { passwordHash: string }): ContaPublica => resto;

// --- Links por e-mail (confirmar e-mail e trocar senha) ---------------------------------------------
// O link leva um código aleatório; no banco guardamos só a impressão (SHA-256) dele.
const impressao = (codigo: string) => crypto.createHash("sha256").update(codigo).digest("hex");

export type TipoToken = "VERIFICAR_EMAIL" | "REDEFINIR_SENHA";

export async function criarCodigo(contaId: string, tipo: TipoToken, minutos: number): Promise<string> {
  const codigo = crypto.randomBytes(32).toString("base64url");
  await prisma.tokenConta.updateMany({ where: { contaId, tipo, usadoEm: null }, data: { usadoEm: new Date() } });
  await prisma.tokenConta.create({ data: { contaId, tipo, hash: impressao(codigo), expiraEm: new Date(Date.now() + minutos * 60_000) } });
  return codigo;
}

// Usa o código uma única vez. Devolve a conta, ou null se o código for inválido, vencido ou já usado.
export async function usarCodigo(codigo: string, tipo: TipoToken) {
  if (!codigo || codigo.length > 200) return null;
  const hash = impressao(codigo);
  const t = await prisma.tokenConta.findUnique({ where: { hash } });
  if (!t || t.tipo !== tipo) return null;
  const r = await prisma.tokenConta.updateMany({ where: { id: t.id, usadoEm: null, expiraEm: { gt: new Date() } }, data: { usadoEm: new Date() } });
  if (r.count !== 1) return null;
  return prisma.conta.findUnique({ where: { id: t.contaId } });
}

export async function origemSite(req: Request): Promise<string> {
  const fixa = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fixa) return fixa;
  return new URL(req.url).origin;
}

// Senha "falsa" para gastar o mesmo tempo quando o e-mail não existe (não revela quais e-mails têm conta).
export const SENHA_FALSA = `${"00".repeat(16)}:${"00".repeat(64)}`;
