import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessaoValidaNoEdge } from "@/lib/session-edge";

const COOKIE = "heelcloth_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const logado = await sessaoValidaNoEdge(token);

  // Proteger rotas administrativas (/admin e sub-rotas): só entra com sessão assinada e dentro da validade.
  if (pathname.startsWith("/admin")) {
    if (!logado) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const resposta = NextResponse.redirect(loginUrl);
      // Cookie vencido ou inválido é apagado, para não ficar preso em /admin sem acesso de verdade.
      if (token) resposta.cookies.delete(COOKIE);
      return resposta;
    }
  }

  // Se já estiver logado e tentar acessar /login, redirecionar para /admin/dashboard
  if (pathname === "/login") {
    if (logado) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (token) {
      const resposta = NextResponse.next();
      resposta.cookies.delete(COOKIE);
      return resposta;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
