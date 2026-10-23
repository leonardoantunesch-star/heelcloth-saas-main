import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "heelcloth-super-secret-jwt-key-2026-saas";
const COOKIE_NAME = "heelcloth_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "PRODUCAO" | "FINANCEIRO" | "VENDEDOR";
  exp: number;
}

// -------------------------------------------------------------
// HASHING DE SENHA COM SALTING (Node.js nativo crypto scrypt)
// -------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computed = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// GERAÇÃO E VALIDAÇÃO DE TOKEN DE SESSÃO HMAC-SHA256
// -------------------------------------------------------------
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function createToken(payload: Omit<SessionPayload, "exp">, expiresInHours = 24): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const fullPayload: SessionPayload = { ...payload, exp };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature !== expectedSignature) return null;

    const decodedPayload = JSON.parse(base64UrlDecode(payload)) as SessionPayload;
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expirado
    }

    return decodedPayload;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// EXTRAÇÃO E VALIDAÇÃO DA SESSÃO ATUAL (Next.js Server Side)
// -------------------------------------------------------------
export async function getSession(req?: any): Promise<SessionPayload | null> {
  // 1. Tentar extrair do objeto de requisição (NextRequest / Request)
  if (req && req.headers) {
    const cookieHeader = req.headers.get ? req.headers.get("cookie") : req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
      if (match) {
        const verified = verifyToken(decodeURIComponent(match[1]));
        if (verified) return verified;
      }
    }
    const authHeader = req.headers.get ? req.headers.get("authorization") : req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const verified = verifyToken(authHeader.substring(7));
      if (verified) return verified;
    }
  }

  // 2. Tentar cookies() nativo do Next.js
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const verified = verifyToken(token);
      if (verified) return verified;
    }
  } catch {
    // Fora do request store do Next.js (ex: chamadas diretas de testes unitários)
  }

  return null;
}

export async function requireAuth(req?: any): Promise<SessionPayload> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(
  allowedRoles: Array<"ADMIN" | "PRODUCAO" | "FINANCEIRO" | "VENDEDOR">,
  req?: any
): Promise<SessionPayload> {
  const session = await requireAuth(req);
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export { COOKIE_NAME };
