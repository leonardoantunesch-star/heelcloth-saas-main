import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rotas administrativas (/admin e sub-rotas)
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("heelcloth_session")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Se já estiver logado e tentar acessar /login, redirecionar para /admin/dashboard
  if (pathname === "/login") {
    const sessionCookie = request.cookies.get("heelcloth_session")?.value;
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
