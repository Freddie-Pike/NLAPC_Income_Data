import type { Metadata } from "next";
import Image from "next/image";
import { isGateEnabled } from "@/lib/auth";
import { redirect } from "next/navigation";
import logo from "@/public/nl-eats-logo.png";

/**
 * /gate, the shared-password wall.
 *
 * A quiet, instrument-grade "not public yet" screen: the NL Eats mark, one honest
 * line, and a single password field. Server component; the form posts to the gate
 * Route Handler, which sets the signed cookie and redirects. Built on the existing
 * design tokens (no new colours), so it themes light/dark from one signal.
 *
 * The page is EXCLUDED from the proxy matcher so it is always reachable. If the
 * gate is not configured (no SITE_PASSWORD/AUTH_SECRET), there is nothing to guard,
 * so send visitors straight to the site rather than showing a dead form.
 */

export const metadata: Metadata = {
  title: "NL Eats, preview access",
  description: "Enter the shared access password to view the NL Eats preview.",
  robots: { index: false, follow: false },
};

// Evaluate the gate config and searchParams per request (never bake a build-time
// redirect into a static prerender, which could loop against the proxy).
export const dynamic = "force-dynamic";

function safeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (!isGateEnabled()) redirect("/");

  const sp = await searchParams;
  const hasError = sp.error === "1";
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="gate-enter w-full max-w-[26rem]">
        {/* brand mark, matches SiteNav */}
        <div className="mb-6 flex items-center gap-2.5">
          <Image
            src={logo}
            alt=""
            aria-hidden
            width={32}
            height={32}
            priority
            className="brand-logo"
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <span
            className="font-extrabold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}
          >
            NL&nbsp;Eats
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h1
            className="text-ink"
            style={{
              margin: 0,
              fontSize: "clamp(1.5rem, 3.2vw, 1.9rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            This preview isn&rsquo;t public yet
          </h1>
          <p
            className="mt-3 text-[15px] leading-normal text-ink-muted"
            style={{ margin: "12px 0 0" }}
          >
            NL Eats is interactive evidence for the Newfoundland &amp; Labrador
            Anti-Poverty Coalition, still in preview. Enter the shared access
            password to continue.
          </p>

          <form method="post" action="/api/gate" className="mt-6 grid gap-3">
            <input type="hidden" name="next" value={next} />
            {/* Hidden, fixed username: this is a shared secret, not per-user auth,
                but a username field lets browsers offer to save the password and
                satisfies the a11y guidance that password forms include one. */}
            <input
              type="text"
              name="username"
              value="nl-eats"
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="username"
              className="sr-only"
            />
            <label
              htmlFor="password"
              className="text-[13px] font-semibold text-ink"
            >
              Access password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              aria-describedby={hasError ? "gate-error" : undefined}
              aria-invalid={hasError || undefined}
              className="w-full rounded-lg border bg-bg px-3 py-2.5 text-ink"
              style={{
                fontSize: 15,
                borderColor: hasError
                  ? "var(--chart-deficit)"
                  : "var(--border)",
              }}
            />
            {hasError && (
              <p
                id="gate-error"
                role="alert"
                className="text-[13px]"
                style={{ margin: 0, color: "var(--chart-deficit)" }}
              >
                That password wasn&rsquo;t right. Please try again.
              </p>
            )}
            <button
              type="submit"
              className="mt-1 rounded-lg font-bold"
              style={{
                background: "var(--accent)",
                color: "var(--accent-ink)",
                padding: "11px 16px",
                fontSize: 15,
              }}
            >
              View the preview
            </button>
          </form>
        </div>

        <p
          className="mt-5 text-center text-[13px] text-ink-muted"
          style={{ margin: "20px 0 0" }}
        >
          Need access? Ask the site maintainer for the password.
        </p>
      </div>
    </main>
  );
}
