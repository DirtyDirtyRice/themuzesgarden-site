import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_NAVIGATION_DESTINATIONS } from "../../lib/timeline/TimelineDawNavigationGuide";

describe("TimelineDawNavigationGuide", () => {
  it("covers the musician's main DAW destinations", () => {
    expect(TIMELINE_DAW_NAVIGATION_DESTINATIONS.map((item) => item.id)).toEqual(expect.arrayContaining(["start-song", "open-session", "add-audio", "record-audio", "midi", "edit-tracks", "mix", "export", "recover"]));
  });
  it("gives every destination a route, action, and baby steps", () => {
    for (const destination of TIMELINE_DAW_NAVIGATION_DESTINATIONS) {
      expect(destination.href).toMatch(/^\//);
      expect(destination.actionLabel.length).toBeGreaterThan(3);
      expect(destination.steps.length).toBeGreaterThanOrEqual(4);
    }
  });
  it("uses unique destination identifiers", () => {
    const ids = TIMELINE_DAW_NAVIGATION_DESTINATIONS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
