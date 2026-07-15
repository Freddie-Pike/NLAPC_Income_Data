import { describe, it, expect, afterEach, vi } from "vitest";
import {
  COOKIE_MAX_AGE,
  isGateEnabled,
  signToken,
  verifyPassword,
  verifyToken,
} from "@/lib/auth";

/**
 * Auth-gate unit tests. The helpers read server-only env
 * (SITE_PASSWORD, AUTH_SECRET) at call time, so each test stubs them. `now` is
 * injected for deterministic expiry checks. `environment: 'node'` (vitest.config.ts).
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isGateEnabled", () => {
  it("is false unless BOTH secrets are set", () => {
    expect(isGateEnabled()).toBe(false);

    vi.stubEnv("SITE_PASSWORD", "hunter2");
    expect(isGateEnabled()).toBe(false); // no AUTH_SECRET yet

    vi.stubEnv("AUTH_SECRET", "s3cr3t-signing-key");
    expect(isGateEnabled()).toBe(true);
  });
});

describe("verifyPassword", () => {
  it("accepts the exact password and rejects anything else", () => {
    vi.stubEnv("SITE_PASSWORD", "correct horse battery staple");
    expect(verifyPassword("correct horse battery staple")).toBe(true);
    expect(verifyPassword("wrong")).toBe(false);
    expect(verifyPassword("")).toBe(false);
    // near-miss (differing length) must not throw and must be rejected
    expect(verifyPassword("correct horse battery stapl")).toBe(false);
  });

  it("is false when SITE_PASSWORD is unset", () => {
    expect(verifyPassword("anything")).toBe(false);
  });
});

describe("signToken / verifyToken", () => {
  const setup = () => {
    vi.stubEnv("SITE_PASSWORD", "pw");
    vi.stubEnv("AUTH_SECRET", "signing-key-A");
  };

  it("round-trips a freshly signed token", () => {
    setup();
    const now = 1_700_000_000_000;
    const token = signToken(now);
    expect(verifyToken(token, now + 1000)).toBe(true);
  });

  it("rejects a tampered payload or signature", () => {
    setup();
    const token = signToken(1_700_000_000_000);
    const [payload, sig] = token.split(".");
    // flip the last char of the signature
    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    expect(verifyToken(`${payload}.${flipped}`)).toBe(false);
    // swap in a different payload while keeping the old signature
    expect(verifyToken(`${payload}x.${sig}`)).toBe(false);
    // structurally invalid tokens
    expect(verifyToken("not-a-token")).toBe(false);
    expect(verifyToken("")).toBe(false);
    expect(verifyToken(undefined)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    setup();
    const token = signToken(1_700_000_000_000);
    vi.stubEnv("AUTH_SECRET", "signing-key-B");
    expect(verifyToken(token, 1_700_000_000_000 + 1000)).toBe(false);
  });

  it("rejects an expired token", () => {
    setup();
    const now = 1_700_000_000_000;
    const token = signToken(now);
    const afterExpiry = now + COOKIE_MAX_AGE * 1000 + 1;
    expect(verifyToken(token, afterExpiry)).toBe(false);
  });

  it("returns false when AUTH_SECRET is unset", () => {
    // no env stubbed: verifyToken must not throw
    expect(verifyToken("a.b")).toBe(false);
  });
});
