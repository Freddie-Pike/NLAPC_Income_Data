import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as gatePost } from "@/app/api/gate/route";
import { POST as logoutPost } from "@/app/api/gate/logout/route";

/**
 * Gate Route Handler tests. We call the exported POST
 * handlers directly (no HTTP server) and assert status, Location, and the
 * Set-Cookie header. `environment: 'node'` (vitest.config.ts).
 */

function postForm(url: string, fields: Record<string, string>): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}

const enableGate = () => {
  vi.stubEnv("SITE_PASSWORD", "correct-secret");
  vi.stubEnv("AUTH_SECRET", "signing-key");
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/gate (login)", () => {
  it("lets the visitor through (303 to /) when the gate is not configured", async () => {
    const res = await gatePost(
      postForm("http://localhost/api/gate", { password: "anything" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("rejects a wrong password: 303 to /gate?error=1, no auth cookie", async () => {
    enableGate();
    const res = await gatePost(
      postForm("http://localhost/api/gate", { password: "nope", next: "/" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/gate?error=1");
    expect(res.headers.get("set-cookie") ?? "").not.toContain("nleats_auth=ey");
  });

  it("accepts the correct password: 303 to next, sets a signed httpOnly cookie", async () => {
    enableGate();
    const res = await gatePost(
      postForm("http://localhost/api/gate", {
        password: "correct-secret",
        next: "/",
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("nleats_auth=");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("ignores an open-redirect next and falls back to /", async () => {
    enableGate();
    const res = await gatePost(
      postForm("http://localhost/api/gate", {
        password: "correct-secret",
        next: "//evil.example.com",
      }),
    );
    expect(res.headers.get("location")).toBe("http://localhost/");
  });
});

describe("POST /api/gate/logout", () => {
  it("clears the cookie and redirects to /gate", async () => {
    const res = await logoutPost(
      new NextRequest("http://localhost/api/gate/logout", { method: "POST" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/gate");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("nleats_auth=");
    expect(cookie).toMatch(/Max-Age=0/i);
  });
});
