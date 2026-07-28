/**
 * POST /api/gate/logout, end the shared-password session.
 *
 * Clears the signed session cookie and returns to /gate. This is still a shared
 * gate, not per-user auth: "sign out" just drops the cookie so the wall reappears.
 * POST (not GET) so a link prefetch or an <img> can never log a visitor out.
 * Excluded from the proxy matcher (the /api/gate prefix), so it is always reachable.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/gate", request.url), {
    status: 303,
  });
  // Overwrite the cookie with an immediately-expired one (maxAge 0) using the
  // same attributes it was set with, so the browser drops it.
  response.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
