import { describe, expect, it } from "vitest";
import { getTimelineDawRestoredDeviceWarning, parseTimelineDawRecordingSetup, timelineDawRecordingSetupKey } from "../../lib/timeline/TimelineDawRecordingSetup";

describe("recording setup recall", () => {
  it("restores only bounded safe configuration", () => {
    expect(parseTimelineDawRecordingSetup({ deviceId: "mic", outputFormat: "mp3", recordingMode: "loop", monitoringMode: "direct", countInBars: 99, bpm: 2, beatsPerBar: 100 })).toEqual({
      deviceId: "mic", outputFormat: "mp3", recordingMode: "loop", monitoringMode: "direct", countInBars: 8, bpm: 20, beatsPerBar: 32,
    });
  });
  it("detects a missing restored device", () => {
    expect(getTimelineDawRestoredDeviceWarning("old", ["new"])).toMatch(/missing or changed/i);
    expect(getTimelineDawRestoredDeviceWarning("new", ["new"])).toBeNull();
  });
  it("scopes browser setup by encoded session", () => {
    expect(timelineDawRecordingSetupKey("session/one")).toContain("session%2Fone");
  });
});
