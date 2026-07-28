/**
 * NL Eats, auth gate helpers.
 *
 * A free, app-level "soft gate": a shared password checked server-side, backed by
 * an HMAC-signed cookie. Shared by BOTH the gate Route Handler (app/api/gate) and
 * the root proxy (proxy.ts). Next 16's Proxy defaults to the Node.js runtime, so
 * `node:crypto` works in both places.
 *
 * SERVER-ONLY. This module reads server-only secrets (SITE_PASSWORD, AUTH_SECRET)
 * and must never be imported by a client component. Neither secret carries the
 * NEXT_PUBLIC_ prefix (that would inline it into the browser bundle).
 *
 * Security shape: constant-time password compare (no timing leak), HMAC-SHA256
 * cookie signed with AUTH_SECRET (NOT the raw password, so the cookie cannot be
 * forged and does not carry the secret), httpOnly + Secure + SameSite=Lax. The
 * proxy check is optimistic per Next's docs; the HMAC verification here is the
 * real guard. The gate is INERT unless BOTH env vars are set (dev / CI / preview
 * stay open, and the maintainer flips the wall on by setting them in Netlify).
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Name of the signed session cookie. */
export const AUTH_COOKIE = "nleats_auth";

/** Cookie / token lifetime in seconds (7 days). */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Token format version, bumped if the payload shape ever changes. */
const TOKEN_VERSION = 1;

/** The gate is only active when BOTH secrets are configured. */
export function isGateEnabled(): boolean {
  return Boolean(process.env.SITE_PASSWORD && process.env.AUTH_SECRET);
}

/**
 * Constant-time password check. Hashes both sides to a fixed 32-byte digest first
 * so `timingSafeEqual` never sees unequal lengths (which would throw and leak the
 * length), then compares in constant time. Returns false if SITE_PASSWORD is unset.
 */
export function verifyPassword(submitted: string): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(submitted, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

interface TokenPayload {
  v: number;
  /** absolute expiry, epoch ms */
  exp: number;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function hmac(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

/**
 * Mint a signed session token: `base64url(payload).base64url(HMAC(payload))`.
 * `now` is injectable for deterministic tests. Throws if AUTH_SECRET is unset
 * (only called on the authenticated success path, where the gate is enabled).
 */
export function signToken(now: number = Date.now()): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    exp: now + COOKIE_MAX_AGE * 1000,
  };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = base64url(hmac(payloadB64, secret));
  return `${payloadB64}.${sig}`;
}

/**
 * Verify a session token: recompute the HMAC, compare in constant time, then check
 * the version and expiry. Any tampering, a wrong key, a bad shape, or an expired
 * token returns false. Returns false (never throws) if AUTH_SECRET is unset.
 */
export function verifyToken(
  token: string | undefined | null,
  now: number = Date.now(),
): boolean {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expectedSig = base64url(hmac(payloadB64, secret));
  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as Partial<TokenPayload>;
    if (payload.v !== TOKEN_VERSION) return false;
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < now) return false;
    return true;
  } catch {
    return false;
  }
}
