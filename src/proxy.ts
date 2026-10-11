import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { requestHost, routeByHost } from "@/lib/admin-routing";
import { adminOrigin } from "@/lib/site-urls";
import { oflPublicPath } from "@/domain/legacy-brand-path";

// El panel vive en su subdominio (ADMIN_URL) y el sitio en el suyo (SITE_URL); ver `routeByHost`.
export function proxy(request: NextRequest) {
  const origin = adminOrigin();
  const route = routeByHost(
    {
      // Falsear el dominio no da acceso: las páginas del panel igual exigen la sesión, y su cookie solo existe en el subdominio.
      host: requestHost(request.headers, request.nextUrl.host),
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      hasSession: Boolean(getSessionCookie(request)),
      isServerAction: request.headers.has("next-action"),
    },
    { adminHost: new URL(origin).host, adminOrigin: origin },
  );

  if (route.kind === "redirect") return NextResponse.redirect(route.url);
  if (route.kind === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    return NextResponse.rewrite(url);
  }
  const pathname = oflPublicPath(request.nextUrl.pathname);
  if (pathname !== request.nextUrl.pathname && ["GET", "HEAD"].includes(request.method)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Todo menos lo que se sirve igual en ambos dominios: la API (auth, subidas, cron), las imágenes locales,
  // los archivos de Next y los que tienen extensión (favicon, robots.txt, sitemap.xml).
  matcher: ["/((?!api/|media/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
