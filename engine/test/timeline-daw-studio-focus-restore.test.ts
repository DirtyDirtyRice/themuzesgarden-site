import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/TimelineDawStudioFocusRestore.tsx", "utf8");

describe("DAW Studio focus restore behavior", () => {
  it("does not save temporary scroll positions while a direct destination is active", () => {
    expect(source).toContain("if (window.location.hash) return;");
  });

  it("realigns a direct destination when Chrome returns to the page", () => {
    expect(source).toContain("openHashDestination(true)");
    expect(source).toContain('window.addEventListener("focus", restoreHashOnFocus)');
    expect(source).toContain('document.addEventListener("visibilitychange", restoreHashWhenVisible)');
  });

  it("uses immediate anchor correction instead of visible smooth scrolling", () => {
    expect(source).toContain('target.scrollIntoView({ behavior: "auto", block: "start" })');
    expect(source).not.toContain('target.scrollIntoView({ behavior: "smooth", block: "start" })');
  });

  it("corrects late layout movement without repeatedly scrolling an aligned target", () => {
    expect(source).toContain("!isHashDestinationAligned(target)");
    expect(source).toContain("getBoundingClientRect().top - margin");
  });

  it("opens and aligns the requested workspace before paint", () => {
    expect(source).toContain("useLayoutEffect(() => {");
    expect(source).toContain('target.scrollIntoView({ behavior: "auto", block: "start" })');
  });

  it("tracks real layout changes instead of waiting through a timed correction loop", () => {
    expect(source).toContain("new ResizeObserver");
    expect(source).not.toContain("15_000");
    expect(source).not.toContain("setInterval(openHashDestination");
  });

  it("consumes a successful direct hash so Chrome cannot replay anchor travel", () => {
    expect(source).toContain('window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`)');
    expect(source).toContain("writeStorage(scrollStorageKey, String(Math.round(window.scrollY)))");
  });

  it("covers the page while the saved position is restored", () => {
    expect(source).toContain("restoringPosition");
    expect(source).toContain("Returning to your DAW…");
    expect(source).toContain("setRestoringPosition(false)");
  });
});
