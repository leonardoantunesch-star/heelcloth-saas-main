import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { hashPassword } from "./auth";
import { apagarCookieConta, gravarCookieConta, origemSite } from "./conta";
import { getJwtSecret } from "./jwt-secret";
import { ipDe, limitar } from "./limite";

// Entrar com Google, Facebook ou Apple (OAuth 2.0 / OpenID Connect, fluxo "código de autorização" feito no servidor).
// Variáveis na Vercel (cada provedor só liga quando todas as suas variáveis existem):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
//   APPLE_CLIENT_ID (o "Services ID"), APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (conteúdo do arquivo .p8)
// Endereço de retorno que cada provedor precisa conhecer:  {endereço do site}/api/conta/social/{google|facebook|apple}/retorno
// Os endereços dos provedores podem ser trocados por GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL etc. (só para testes locais).

export type Provedor = "google" | "facebook" | "apple";
export const PROVEDORES: Provedor[] = ["google", "facebook", "apple"];
export const ehProvedor = (v: string): v is Provedor => (PROVEDORES as string[]).includes(v);

const env = (nome: string) => process.env[nome]?.trim() || "";

export function provedorAtivo(p: Provedor): boolean {
  if (p === "google") return Boolean(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET"));
  if (p === "facebook") return Boolean(env("FACEBOOK_APP_ID") && env("FACEBOOK_APP_SECRET"));
  return Boolean(env("APPLE_CLIENT_ID") && env("APPLE_TEAM_ID") && env("APPLE_KEY_ID") && env("APPLE_PRIVATE_KEY"));
}

const URLS = {
  google: { auth: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", info: "https://openidconnect.googleapis.com/v1/userinfo" },
  facebook: { auth: "https://www.facebook.com/v19.0/dialog/oauth", token: "https://graph.facebook.com/v19.0/oauth/access_token", info: "https://graph.facebook.com/v19.0/me" },
  apple: { auth: "https://appleid.apple.com/auth/authorize", token: "https://appleid.apple.com/auth/token", info: "" },
} as const;
const urlDe = (p: Provedor, tipo: "auth" | "token" | "info") => env(`${p.toUpperCase()}_${tipo.toUpperCase()}_URL`) || URLS[p][tipo];

// --- Cookie de estado (assinado, vale 10 min): liga a volta do provedor à pessoa que clicou ---------------
const COOKIE_SOCIAL = "lj_social";
const assinar = (texto: string) => crypto.createHmac("sha256", `${getJwtSecret()}|social-cliente`).update(texto).digest("base64url");
interface Estado { p: Provedor; s: string; n: string; v: string; b: string; exp: number }

function empacotar(e: Estado): string {
  const corpo = Buffer.from(JSON.stringify(e)).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}
function desempacotar(token: string | undefined): Estado | null {
  try {
    if (!token || token.length > 1200) return null;
    const [corpo, assinatura] = token.split(".");
    if (!corpo || !assinatura) return null;
    const esperada = Buffer.from(assinar(corpo));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !crypto.timingSafeEqual(esperada, recebida)) return null;
    const e = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as Estado;
    if (!ehProvedor(e.p) || e.exp < Math.floor(Date.now() / 1000)) return null;
    return e;
  } catch {
    return null;
  }
}
const cookieEstado = (valor: string, p: Provedor, maxAge: number) => ({
  name: COOKIE_SOCIAL,
  value: valor,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // A Apple devolve a pessoa por um POST vindo de outro site; só "none" deixa o cookie ir junto.
  sameSite: (p === "apple" && process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  path: "/api/conta/social",
  maxAge,
});

// Só aceita voltar para caminhos do próprio site.
export const caminhoSeguro = (v: string | null | undefined) => (v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") && v.length < 300 ? v : "/");

function comAviso(caminho: string, aviso: string) {
  const [semHash] = caminho.split("#");
  return `${semHash}${semHash.includes("?") ? "&" : "?"}entrar=${aviso}`;
}

const redirecionar = (alvo: string, origem: string) => NextResponse.redirect(new URL(alvo, origem), 303);

const aleatorio = (bytes = 24) => crypto.randomBytes(bytes).toString("base64url");

// --- 1ª etapa: manda a pessoa para o provedor ---------------------------------------------------------------
export async function iniciarSocial(req: Request, p: Provedor): Promise<NextResponse> {
  const origem = await origemSite(req);
  const url = new URL(req.url);
  const voltar = caminhoSeguro(url.searchParams.get("voltar"));
  if (!provedorAtivo(p)) return redirecionar(comAviso(voltar, "social-indisponivel"), origem);
  const lim = await limitar(`social-inicio:${ipDe(req)}`, 40, 900);
  if (!lim.ok) return redirecionar(comAviso(voltar, "social-falhou"), origem);

  const estado: Estado = { p, s: aleatorio(), n: aleatorio(), v: aleatorio(32), b: voltar, exp: Math.floor(Date.now() / 1000) + 600 };
  const desafioPkce = crypto.createHash("sha256").update(estado.v).digest("base64url");
  const redirectUri = `${origem}/api/conta/social/${p}/retorno`;

  const q = new URLSearchParams();
  if (p === "google") {
    q.set("client_id", env("GOOGLE_CLIENT_ID"));
    q.set("redirect_uri", redirectUri);
    q.set("response_type", "code");
    q.set("scope", "openid email profile");
    q.set("state", estado.s);
    q.set("nonce", estado.n);
    q.set("code_challenge", desafioPkce);
    q.set("code_challenge_method", "S256");
    q.set("prompt", "select_account");
  } else if (p === "facebook") {
    q.set("client_id", env("FACEBOOK_APP_ID"));
    q.set("redirect_uri", redirectUri);
    q.set("response_type", "code");
    q.set("scope", "email,public_profile");
    q.set("state", estado.s);
  } else {
    q.set("client_id", env("APPLE_CLIENT_ID"));
    q.set("redirect_uri", redirectUri);
    q.set("response_type", "code");
    q.set("response_mode", "form_post");
    q.set("scope", "name email");
    q.set("state", estado.s);
    q.set("nonce", estado.n);
  }
  const res = NextResponse.redirect(`${urlDe(p, "auth")}?${q.toString()}`, 303);
  res.cookies.set(cookieEstado(empacotar(estado), p, 600));
  return res;
}

// --- 2ª etapa: o provedor devolve a pessoa com um código --------------------------------------------------
interface Perfil { email: string; verificado: boolean; nome: string }

function segredoApple(): string {
  const cab = Buffer.from(JSON.stringify({ alg: "ES256", kid: env("APPLE_KEY_ID") })).toString("base64url");
  const agora = Math.floor(Date.now() / 1000);
  const corpo = Buffer.from(JSON.stringify({ iss: env("APPLE_TEAM_ID"), iat: agora, exp: agora + 300, aud: "https://appleid.apple.com", sub: env("APPLE_CLIENT_ID") })).toString("base64url");
  const chave = env("APPLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  const assinatura = crypto.sign("sha256", Buffer.from(`${cab}.${corpo}`), { key: chave, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${cab}.${corpo}.${assinatura}`;
}

async function pegarJson(r: Response): Promise<Record<string, unknown>> {
  return (await r.json().catch(() => ({}))) as Record<string, unknown>;
}

async function perfilDoProvedor(p: Provedor, codigo: string, estado: Estado, redirectUri: string, nomeApple: string): Promise<Perfil | null> {
  if (p === "google") {
    const r = await fetch(urlDe(p, "token"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: codigo, client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: estado.v }),
    });
    const t = await pegarJson(r);
    if (!r.ok || typeof t.access_token !== "string") return null;
    const i = await fetch(urlDe(p, "info"), { headers: { Authorization: `Bearer ${t.access_token}` } });
    const u = await pegarJson(i);
    if (!i.ok || typeof u.email !== "string") return null;
    return { email: u.email, verificado: u.email_verified === true || u.email_verified === "true", nome: typeof u.name === "string" ? u.name : "" };
  }
  if (p === "facebook") {
    const q = new URLSearchParams({ client_id: env("FACEBOOK_APP_ID"), client_secret: env("FACEBOOK_APP_SECRET"), redirect_uri: redirectUri, code: codigo });
    const r = await fetch(`${urlDe(p, "token")}?${q.toString()}`);
    const t = await pegarJson(r);
    if (!r.ok || typeof t.access_token !== "string") return null;
    const i = await fetch(`${urlDe(p, "info")}?${new URLSearchParams({ fields: "id,name,email", access_token: t.access_token }).toString()}`);
    const u = await pegarJson(i);
    if (!i.ok) return null;
    // O Facebook só entrega o e-mail principal já confirmado por ele; sem e-mail, não dá para criar a conta.
    return { email: typeof u.email === "string" ? u.email : "", verificado: typeof u.email === "string", nome: typeof u.name === "string" ? u.name : "" };
  }
  const r = await fetch(urlDe(p, "token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env("APPLE_CLIENT_ID"), client_secret: segredoApple(), code: codigo, grant_type: "authorization_code", redirect_uri: redirectUri }),
  });
  const t = await pegarJson(r);
  if (!r.ok || typeof t.id_token !== "string") return null;
  // O id_token veio direto do servidor da Apple por conexão segura (HTTPS), então basta conferir as informações dele.
  try {
    const d = JSON.parse(Buffer.from(t.id_token.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
    const aud = Array.isArray(d.aud) ? d.aud : [d.aud];
    if (d.iss !== "https://appleid.apple.com" || !aud.includes(env("APPLE_CLIENT_ID")) || typeof d.exp !== "number" || d.exp < Date.now() / 1000 || d.nonce !== estado.n) return null;
    if (typeof d.email !== "string") return null;
    return { email: d.email, verificado: d.email_verified === true || d.email_verified === "true", nome: nomeApple };
  } catch {
    return null;
  }
}

function nomeDoApple(bruto: string | null): string {
  try {
    if (!bruto) return "";
    const u = JSON.parse(bruto) as { name?: { firstName?: string; lastName?: string } };
    return [u.name?.firstName, u.name?.lastName].filter(Boolean).join(" ");
  } catch {
    return "";
  }
}

export async function concluirSocial(req: Request, p: Provedor, dados: { code: string | null; state: string | null; erro: string | null; user: string | null }): Promise<NextResponse> {
  const origem = await origemSite(req);
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|; )${COOKIE_SOCIAL}=([^;]*)`));
  const estado = desempacotar(m ? decodeURIComponent(m[1]) : undefined);
  const voltar = estado ? caminhoSeguro(estado.b) : "/";
  const terminar = (res: NextResponse) => { res.cookies.set(cookieEstado("", p, 0)); return res; };
  const falha = (aviso: string) => terminar(redirecionar(comAviso(voltar, aviso), origem));

  try {
    const lim = await limitar(`social-retorno:${ipDe(req)}`, 40, 900);
    if (!lim.ok) return falha("social-falhou");
    if (!provedorAtivo(p) || !estado || estado.p !== p || !dados.state) return falha("social-falhou");
    const a = Buffer.from(estado.s);
    const b = Buffer.from(dados.state);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return falha("social-falhou");
    if (dados.erro || !dados.code) return falha("social-cancelado");

    const perfil = await perfilDoProvedor(p, dados.code, estado, `${origem}/api/conta/social/${p}/retorno`, nomeDoApple(dados.user));
    if (!perfil) return falha("social-falhou");
    const email = perfil.email.trim().toLowerCase();
    if (!email || email.length > 120) return falha("social-sem-email");
    if (!perfil.verificado) return falha("social-email-nao-confirmado");

    let conta = await prisma.conta.findUnique({ where: { email } });
    if (!conta) {
      const nome = (perfil.nome.trim() || email.split("@")[0]).slice(0, 100);
      try {
        // Conta criada pelo provedor: senha aleatória que ninguém conhece (a pessoa pode criar uma em "Esqueci minha senha").
        conta = await prisma.conta.create({ data: { email, nome, passwordHash: hashPassword(aleatorio(32)), emailVerificadoEm: new Date() } });
      } catch {
        conta = await prisma.conta.findUnique({ where: { email } });
      }
    } else if (!conta.emailVerificadoEm) {
      // Conta antiga que nunca confirmou o e-mail: alguém pode tê-la criado com o e-mail de outra pessoa.
      // O provedor provou que o e-mail é de quem está entrando, então a senha antiga é descartada.
      conta = await prisma.conta.update({ where: { id: conta.id }, data: { emailVerificadoEm: new Date(), passwordHash: hashPassword(aleatorio(32)) } });
    }
    if (!conta) return falha("social-falhou");

    const res = redirecionar(voltar, origem);
    apagarCookieConta(res);
    gravarCookieConta(res, conta);
    return terminar(res);
  } catch (erro) {
    console.error(`Entrar com ${p}:`, erro);
    return falha("social-falhou");
  }
}
