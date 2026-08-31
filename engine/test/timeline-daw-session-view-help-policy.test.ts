import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_SESSION_VIEW_HELP_STEPS, timelineDawSessionViewHelpStorageKey } from "../../lib/timeline/TimelineDawSessionViewHelpPolicy";

describe("timeline DAW Session View baby-step help", () => {
  const guide = TIMELINE_DAW_SESSION_VIEW_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ");

  it("starts with Named Regions and musical launch timing", () => expect(guide).toMatch(/Named Regions[\s\S]*Empty slots[\s\S]*Session BPM[\s\S]*Launch quantization[\s\S]*Immediate[\s\S]*Next Beat[\s\S]*Next 2 Beats[\s\S]*Next Bar/i));
  it("covers individual clip setup, launch queue, and transport", () => expect(guide).toMatch(/Individual clip launch[\s\S]*One-Shot[\s\S]*Loop Until Stopped[\s\S]*Clip behavior[\s\S]*Clip quantization[\s\S]*Launch Now[\s\S]*Cancel queued launch[\s\S]*Previous Pass[\s\S]*Replay Clip[\s\S]*Pause Clip[\s\S]*Resume Clip[\s\S]*Stop Clip/i));
  it("covers scene routing, launch, navigation, and stopping", () => expect(guide).toMatch(/After this scene[\s\S]*Plays before Stop\/Next[\s\S]*Launch Next target[\s\S]*Live Set Flow Check[\s\S]*Previous Scene[\s\S]*Replay Scene[\s\S]*Next Scene[\s\S]*Pause Scene[\s\S]*Resume Scene[\s\S]*Stop Scene[\s\S]*Stop Session Audio/i));
  it("preserves linear arrangement and private sources", () => expect(guide).toMatch(/never move, trim, delete, replace, publish, or rewrite the linear arrangement, private recordings, or Global Library songs/i));
  it("uses a validated session-scoped progress key", () => { expect(timelineDawSessionViewHelpStorageKey("session-13")).toBe("the-muzes-garden:daw-session-view-help:session-13"); expect(() => timelineDawSessionViewHelpStorageKey("bad/session")).toThrow(/invalid/i); });
});
