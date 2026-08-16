import { describe, expect, it } from "vitest";
import { assessTimelineDawRecordingMonitoring } from "../../lib/timeline/TimelineDawRecordingMonitoring";

describe("recording monitoring", () => {
  it("keeps off and direct modes silent in the browser", () => {
    expect(assessTimelineDawRecordingMonitoring({ mode: "off", latencyMs: null, headphonesConfirmed: false })).toMatchObject({ ready: true, browserGain: 0 });
    expect(assessTimelineDawRecordingMonitoring({ mode: "direct", latencyMs: 80, headphonesConfirmed: false })).toMatchObject({ ready: true, browserGain: 0 });
  });
  it("requires headphones and measured low latency for browser monitoring", () => {
    expect(assessTimelineDawRecordingMonitoring({ mode: "browser", latencyMs: 10, headphonesConfirmed: false }).ready).toBe(false);
    expect(assessTimelineDawRecordingMonitoring({ mode: "browser", latencyMs: null, headphonesConfirmed: true }).ready).toBe(false);
    expect(assessTimelineDawRecordingMonitoring({ mode: "browser", latencyMs: 30, headphonesConfirmed: true })).toMatchObject({ ready: false, browserGain: 0 });
    expect(assessTimelineDawRecordingMonitoring({ mode: "browser", latencyMs: 12, headphonesConfirmed: true })).toMatchObject({ ready: true, browserGain: 1 });
  });
});
