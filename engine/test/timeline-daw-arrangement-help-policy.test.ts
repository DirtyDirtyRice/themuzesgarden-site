import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_ARRANGEMENT_HELP_STEPS, timelineDawArrangementHelpStorageKey } from "../../lib/timeline/TimelineDawArrangementHelpPolicy";

describe("timeline DAW arrangement baby-step help", () => {
  const guide = TIMELINE_DAW_ARRANGEMENT_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ");
  it("covers selection, edit modes, movement, trim, split, fades, organization, and recovery", () => expect(guide).toMatch(/Choose one clip[\s\S]*Grid[\s\S]*Move[\s\S]*Trim[\s\S]*Split[\s\S]*fade[\s\S]*Lock[\s\S]*Undo/i));
  it("names every professional arrangement edit mode", () => expect(guide).toMatch(/Grid[\s\S]*Slip[\s\S]*Shuffle[\s\S]*Spot/i));
  it("protects private sources and requires audition", () => expect(guide).toMatch(/private source recording remains preserved[\s\S]*Audition/i));
  it("uses a validated session-scoped progress key", () => { expect(timelineDawArrangementHelpStorageKey("session-13")).toBe("the-muzes-garden:daw-arrangement-help:session-13"); expect(() => timelineDawArrangementHelpStorageKey("bad/session")).toThrow(/invalid/i); });
});
