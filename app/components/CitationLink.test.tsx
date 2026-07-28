// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import CitationLink from "@/app/components/CitationLink";
import { getSource } from "@/lib/sources";

/**
 * CitationLink tests. The link's own text carries the accessible
 * citation, and every known key must open its primary source in a new tab; an
 * unknown key degrades to the raw key with no broken anchor.
 */

afterEach(cleanup);

const KEY = "maytree-nl-2024";

describe("CitationLink", () => {
  it("renders an anchor to the source URL that opens safely in a new tab", () => {
    render(<CitationLink sourceKey={KEY} />);
    const source = getSource(KEY)!;
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(source.url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    // sr-only affordance is part of the accessible name.
    expect(link.textContent).toContain("(opens in a new tab)");
  });

  it("uses the full label as the link text by default", () => {
    render(<CitationLink sourceKey={KEY} />);
    const source = getSource(KEY)!;
    const link = screen.getByRole("link");
    expect(link.textContent).toContain(source.label);
  });

  it('uses the compact short citation when text="short"', () => {
    render(<CitationLink sourceKey={KEY} text="short" />);
    const source = getSource(KEY)!;
    const link = screen.getByRole("link");
    expect(link.textContent).toContain(source.short);
  });

  it("degrades to the raw key with no anchor for an unknown source", () => {
    render(<CitationLink sourceKey="not-a-real-key" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("not-a-real-key")).toBeTruthy();
  });
});
