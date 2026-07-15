/**
 * proxy.ts, the auth perimeter.
 *
 * Next.js 16 renamed Middleware to Proxy; the file lives at the project root and
 * Proxy defaults to the Node.js runtime, so lib/auth.ts (node:crypto) works here.
 *
 * This runs before every matched route and, when the gate is enabled, redirects
 * requests without a valid signed cookie to /gate. Per Next's docs a proxy check
 * is OPTIMISTIC, not real security; the real guard is the HMAC verification in
 * lib/auth.ts (a forged or tampered cookie fails verifyToken). The gate is inert
 * unless SITE_PASSWORD and AUTH_SECRET are both set, so dev / CI / preview stay open.
 *
 * The matcher excludes /gate and /api/gate (else the login screen would be gated
 * against itself) and Next's static assets. Everything else, including the page and
 * /api/graph-data, is behind the wall.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, isGateEnabled, verifyToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  if (!isGateEnabled()) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (verifyToken(token)) return NextResponse.next();

  const gateUrl = new URL("/gate", request.url);
  const dest = request.nextUrl.pathname + request.nextUrl.search;
  if (dest && dest !== "/") gateUrl.searchParams.set("next", dest);
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|gate|api/gate).*)"],
};
