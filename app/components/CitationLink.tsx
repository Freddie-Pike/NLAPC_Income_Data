"use client";

/**
 * CitationLink, a source link with a Notion-style hover/focus preview.
 *
 * The preview is built from our own curated metadata (`lib/sources.ts`: full
 * label, domain, one-line description), NOT a live Open Graph fetch, canada.ca
 * 403-blocks bots, client fetches are CORS-blocked, and the site must stay free +
 * offline. So the card is always reliable and never ships a broken thumbnail.
 *
 * The card is positioned `fixed` so it escapes the data table's `overflow-x`
 * clip, flips above the link near the viewport bottom, opens on hover (short
 * delay) and on keyboard focus, and dismisses on blur / mouse-leave / Escape /
 * scroll. It's decorative (`aria-hidden`): the link's own text already carries the
 * accessible citation, so screen readers aren't made to read it twice.
 */

import { useEffect, useRef, useState } from "react";
import { getSource } from "@/lib/sources";

const CARD_WIDTH = 300;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

interface PreviewPos {
  left: number;
  top: number;
  /** true → card sits below the link; false → above (translateY -100%) */
  below: boolean;
}

export default function CitationLink({
  sourceKey,
  text = "label",
}: {
  sourceKey: string;
  /** which registry field to show as the link text */
  text?: "short" | "label";
}) {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<PreviewPos | null>(null);
  const source = getSource(sourceKey);

  // Dismiss the open preview on scroll/resize (its anchor would drift otherwise).
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (!source) return <span className="text-ink-muted">{sourceKey}</span>;

  const place = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const roomBelow = window.innerHeight - r.bottom;
    const below = roomBelow > 168; // approx card height + gap
    setPos({
      left: Math.min(Math.max(8, r.left), window.innerWidth - CARD_WIDTH - 8),
      top: below ? r.bottom + 8 : r.top - 8,
      below,
    });
  };

  const openSoon = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(place, 120);
  };
  const openNow = () => {
    if (timer.current) clearTimeout(timer.current);
    place();
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setPos(null);
  };

  const linkText = text === "short" ? source.short : source.label;

  return (
    <>
      <a
        ref={anchorRef}
        className="source-link"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={openSoon}
        onMouseLeave={close}
        onFocus={openNow}
        onBlur={close}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        {linkText}
        <span aria-hidden> ↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {pos && (
        <span
          aria-hidden
          className="citation-preview"
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            transform: pos.below ? undefined : "translateY(-100%)",
            width: CARD_WIDTH,
            maxWidth: "calc(100vw - 16px)",
            zIndex: 50,
            display: "grid",
            gap: 6,
            padding: "12px 14px",
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,9,29,0.16)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              color: "var(--ink-muted)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "var(--accent)",
                flex: "0 0 auto",
              }}
            />
            {hostname(source.url)}
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {source.label}
          </span>
          <span
            style={{
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "var(--ink-muted)",
            }}
          >
            {source.description}
          </span>
        </span>
      )}
    </>
  );
}
