"use client";

/**
 * SiteNav, restrained sticky top bar (the site header).
 *
 * Brand mark · one link per page · theme toggle. A NASA-grade instrument, not a
 * SaaS mega-nav: solid background, a hairline that only appears once you scroll,
 * and a quiet active-page indicator driven by the current route. The page links
 * scroll horizontally on very small screens rather than wrapping. A
 * visually-hidden "Skip to content" link leads keyboard users straight to the
 * page's main content.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import { SITE_LINKS } from "@/app/components/site-links";
import logo from "@/public/nl-eats-logo.png";

export default function SiteNav({
  showSignOut = false,
}: {
  /** true when the shared-password gate is on and the visitor is signed in */
  showSignOut?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--bg)",
        borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
        transition: "border-color 200ms ease",
      }}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className="mx-auto grid max-w-[1160px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6 lg:px-8"
      >
        {/* left: brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 justify-self-start"
          style={{ textDecoration: "none" }}
        >
          <Image
            src={logo}
            alt=""
            aria-hidden
            width={28}
            height={28}
            priority
            className="brand-logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <span
            className="font-extrabold tracking-tight text-ink max-[479px]:sr-only"
            style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}
          >
            NL&nbsp;Eats
          </span>
        </Link>

        {/* center: page links (scroll horizontally before they ever wrap) */}
        <ul
          className="flex min-w-0 items-center justify-self-center overflow-x-auto"
          style={{ listStyle: "none", margin: 0, padding: 0, gap: 2 }}
        >
          {SITE_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="inline-block rounded-lg px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors sm:px-3"
                  style={{
                    color: active ? "var(--ink)" : "var(--ink-muted)",
                    textDecoration: "none",
                    boxShadow: active
                      ? "inset 0 -2px 0 0 var(--accent)"
                      : "none",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* right: theme + session controls */}
        <div className="flex items-center gap-1 justify-self-end sm:gap-2">
          <ThemeToggle />
          {showSignOut && (
            <form method="post" action="/api/gate/logout">
              <button
                type="submit"
                className="inline-block rounded-lg px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-muted transition-colors hover:text-ink sm:px-3"
                style={{ background: "transparent", cursor: "pointer" }}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}
