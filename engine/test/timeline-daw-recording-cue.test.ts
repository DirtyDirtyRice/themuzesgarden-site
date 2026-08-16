import { describe, expect, it } from "vitest";
import { getTimelineDawRecordingCueBeat, parseTimelineDawRecordingCueSettings } from "../../lib/timeline/TimelineDawRecordingCue";

describe("recording metronome cues", () => {
  it("bounds cue volume and defaults accent safely", () => {
    expect(parseTimelineDawRecordingCueSettings({ enabled: true, volume: 9 })).toEqual({ enabled: true, volume: 0.5, accentEnabled: true });
    expect(parseTimelineDawRecordingCueSettings({ volume: 0 })).toMatchObject({ volume: 0.05 });
  });
  it("creates tempo-aware bar accents", () => {
    const settings = parseTimelineDawRecordingCueSettings({ enabled: true, volume: 0.2 });
    expect(getTimelineDawRecordingCueBeat({ beatIndex: 0, beatsPerBar: 4, bpm: 120, settings })).toMatchObject({ beat: 1, accent: true, frequencyHz: 1320, intervalMs: 500 });
    expect(getTimelineDawRecordingCueBeat({ beatIndex: 1, beatsPerBar: 4, bpm: 120, settings })).toMatchObject({ beat: 2, accent: false, frequencyHz: 880 });
  });
});
