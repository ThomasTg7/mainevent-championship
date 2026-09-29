import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Solo filtro rápido por cookie: la verificación real (sesión válida + lista
// blanca) la hace requireAdmin() en cada página y server action.
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/recuperar", "/admin/restablecer"]);

export function proxy(request: NextRequest) {
  if (PUBLIC_ADMIN_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
