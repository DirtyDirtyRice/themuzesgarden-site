import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_RIFF_COMPARISON_HELP_STEPS, timelineDawRiffComparisonHelpStorageKey } from "../../lib/timeline/TimelineDawRiffComparisonHelpPolicy";

describe("timeline DAW three-version riff-comparison help", () => {
  const guide = TIMELINE_DAW_RIFF_COMPARISON_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ");

  it("walks through a true A/B/C comparison", () => expect(guide).toMatch(/three complete song versions[\s\S]*A, B, and C[\s\S]*Track 1 of 3/i));
  it("names the exact analysis and audition controls", () => expect(guide).toMatch(/Analyze Selected Tracks[\s\S]*Hear riff[\s\S]*Hear Across All Selected Tracks[\s\S]*Repeat Comparison 3 Times[\s\S]*Previous Riff Track[\s\S]*Replay Current Riff[\s\S]*Skip to Next Track[\s\S]*Pause Riff Comparison[\s\S]*Resume Riff Comparison[\s\S]*Play All Matching Riffs[\s\S]*Stop Riff Comparison/i));
  it("explains the strict waveform threshold honestly", () => expect(guide).toMatch(/waveform and attack shapes[\s\S]*90% match requirement[\s\S]*does not mean the songs contain no similar ideas/i));
  it("protects private recordings, tracks, and Library songs", () => expect(guide).toMatch(/do not edit, publish, replace, or duplicate any private recording, arrangement track, or Global Library song/i));
  it("uses a validated session-scoped progress key", () => { expect(timelineDawRiffComparisonHelpStorageKey("session-13")).toBe("the-muzes-garden:daw-riff-comparison-help:session-13"); expect(() => timelineDawRiffComparisonHelpStorageKey("bad/session")).toThrow(/invalid/i); });
});
