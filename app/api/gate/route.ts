/**
 * POST /api/gate, the shared-password check.
 *
 * Verifies the submitted password in constant time, and on success sets an
 * HMAC-signed, httpOnly, Secure, SameSite=Lax session cookie, then 303-redirects
 * (POST -> GET) to a validated local path. On failure it redirects back to /gate
 * with an error flag. All the crypto lives in lib/auth.ts, shared with proxy.ts.
 *
 * Never cached: this endpoint reads a secret and sets a cookie per request.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  COOKIE_MAX_AGE,
  isGateEnabled,
  signToken,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Only allow same-site absolute paths as the post-login destination. */
function safeNext(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  )
    return value;
  return "/";
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url);

  // Nothing to guard when the gate is not configured: let the visitor through.
  if (!isGateEnabled()) {
    return NextResponse.redirect(new URL("/", origin), { status: 303 });
  }

  const form = await request.formData();
  const password =
    typeof form.get("password") === "string"
      ? String(form.get("password"))
      : "";
  const next = safeNext(form.get("next"));

  if (!verifyPassword(password)) {
    const dest = new URL("/gate", origin);
    dest.searchParams.set("error", "1");
    if (next !== "/") dest.searchParams.set("next", next);
    return NextResponse.redirect(dest, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, origin), {
    status: 303,
  });
  response.cookies.set({
    name: AUTH_COOKIE,
    value: signToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
