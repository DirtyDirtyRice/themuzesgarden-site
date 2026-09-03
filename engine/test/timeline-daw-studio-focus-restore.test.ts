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
});
