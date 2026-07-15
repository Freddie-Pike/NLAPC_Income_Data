/**
 * PageHeader, the editorial header every page opens with.
 *
 * An accent eyebrow (the golden brand mark, used as chrome, never as text colour,
 * so contrast holds), a Lato headline, and a muted intro. The home page uses the
 * larger `hero` size; the rest use the standard size. Qualitative copy only, no
 * figures are hardcoded here (every number lives in the data payload).
 */

export default function PageHeader({
  eyebrow,
  title,
  intro,
  hero = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  hero?: boolean;
}) {
  return (
    <header className="grid gap-3.5 pt-2">
      <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: "var(--accent)",
            flex: "0 0 auto",
          }}
        />
        {eyebrow}
      </span>
      <h1
        className="text-balance"
        style={{
          margin: 0,
          fontSize: hero
            ? "clamp(1.9rem, 4vw, 2.85rem)"
            : "clamp(1.6rem, 3vw, 2.25rem)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
        }}
      >
        {title}
      </h1>
      <p
        className="text-pretty text-ink-muted"
        style={{
          margin: 0,
          maxWidth: "68ch",
          fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
          lineHeight: 1.55,
        }}
      >
        {intro}
      </p>
    </header>
  );
}
