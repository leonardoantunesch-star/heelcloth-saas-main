import { getJwtSecret } from "./jwt-secret";

// Confere a assinatura e a validade do token de sessão dentro do middleware.
// O middleware roda no ambiente "edge", que não tem o módulo crypto do Node, então usamos a Web Crypto API.
// O formato do token é o mesmo criado em auth.ts (HS256).

function base64UrlParaBytes(texto: string): Uint8Array<ArrayBuffer> {
  let b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export interface SessaoEdge {
  role?: string;
}

// Devolve os dados da sessão (perfil) quando o token é válido; null quando não vale.
export async function sessaoNoEdge(token: string | undefined): Promise<SessaoEdge | null> {
  if (!token) return null;
  try {
    const [cabecalho, corpo, assinatura] = token.split(".");
    if (!cabecalho || !corpo || !assinatura) return null;

    const chave = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getJwtSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    // verify compara em tempo constante.
    const ok = await crypto.subtle.verify(
      "HMAC",
      chave,
      base64UrlParaBytes(assinatura),
      new TextEncoder().encode(`${cabecalho}.${corpo}`)
    );
    if (!ok) return null;

    const dados = JSON.parse(new TextDecoder().decode(base64UrlParaBytes(corpo))) as { exp?: number; role?: string };
    if (dados.exp && dados.exp < Math.floor(Date.now() / 1000)) return null;
    return { role: dados.role };
  } catch {
    // Inclui a falta de JWT_SECRET em produção: sem chave, nenhuma sessão vale.
    return null;
  }
}
