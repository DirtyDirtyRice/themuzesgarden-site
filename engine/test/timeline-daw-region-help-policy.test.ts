import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_REGION_HELP_STEPS, timelineDawRegionHelpStorageKey } from "../../lib/timeline/TimelineDawRegionHelpPolicy";

describe("timeline DAW region baby-step help", () => {
  const guide = TIMELINE_DAW_REGION_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ");

  it("names the complete visible Named Regions workflow", () => expect(guide).toMatch(/Hear This Track Alone[\s\S]*Set Region Start[\s\S]*Save Region End[\s\S]*Hear Region[\s\S]*Loop Region[\s\S]*Stop Loop[\s\S]*Move Start Here[\s\S]*Move End Here[\s\S]*Save Region Name[\s\S]*Remove Label/i));
  it("explains boundary safety and requires audition", () => expect(guide).toMatch(/does not cut or change the audio[\s\S]*end must be later[\s\S]*audition again/i));
  it("connects consistent names to Session View", () => expect(guide).toMatch(/Verse 1[\s\S]*Session View[\s\S]*launchable scenes/i));
  it("protects tracks, recordings, clips, and Library songs", () => expect(guide).toMatch(/not the track, private recording, arrangement clip, or Global Library song/i));
  it("uses a validated session-scoped progress key", () => { expect(timelineDawRegionHelpStorageKey("session-13")).toBe("the-muzes-garden:daw-region-help:session-13"); expect(() => timelineDawRegionHelpStorageKey("bad/session")).toThrow(/invalid/i); });
});
