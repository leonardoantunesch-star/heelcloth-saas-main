import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessaoNoEdge } from "@/lib/session-edge";
import { AREAS, podeAcessar } from "@/lib/permissoes";

const COOKIE = "heelcloth_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const sessao = await sessaoNoEdge(token);
  const logado = sessao !== null;

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

  // Cada área do painel tem os perfis que podem abri-la (src/lib/permissoes.ts). Digitar o endereço direto não burla o menu.
  if (pathname.startsWith("/admin") && sessao) {
    const area = AREAS.find((a) => pathname === a.href || pathname.startsWith(`${a.href}/`));
    if (area && !podeAcessar(sessao.role, area)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
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
