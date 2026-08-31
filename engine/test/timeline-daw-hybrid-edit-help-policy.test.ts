import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_HYBRID_EDIT_HELP_STEPS, timelineDawHybridEditHelpStorageKey } from "../../lib/timeline/TimelineDawHybridEditHelpPolicy";

describe("timeline DAW Hybrid Edit baby-step help", () => {
  const guide = TIMELINE_DAW_HYBRID_EDIT_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ");

  it("starts with matching-riff analysis and source audition", () => expect(guide).toMatch(/Analyze Selected Tracks[\s\S]*Hear riff[\s\S]*Hear Across All Selected Tracks/i));
  it("names the complete visible Track 4 workflow", () => expect(guide).toMatch(/Copy Riff[\s\S]*Move Earlier[\s\S]*Move Later[\s\S]*Duplicate[\s\S]*Cut from Hybrid[\s\S]*Play Hybrid Edit[\s\S]*Stop Riff Comparison[\s\S]*Clear Hybrid Track/i));
  it("explains numbered playback order and full-edit audition", () => expect(guide).toMatch(/numbered Track 4 list[\s\S]*list order is the playback order[\s\S]*top to bottom/i));
  it("protects every source boundary", () => expect(guide).toMatch(/does not cut, move, or duplicate the original recording[\s\S]*never deletes, publishes, replaces, or edits the three source songs, private recordings, arrangement tracks, or Global Library records/i));
  it("uses a validated session-scoped progress key", () => { expect(timelineDawHybridEditHelpStorageKey("session-13")).toBe("the-muzes-garden:daw-hybrid-edit-help:session-13"); expect(() => timelineDawHybridEditHelpStorageKey("bad/session")).toThrow(/invalid/i); });
});
