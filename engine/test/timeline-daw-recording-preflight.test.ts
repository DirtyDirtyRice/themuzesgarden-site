import { describe, expect, it } from "vitest";
import { assessTimelineDawRecordingPreflight } from "../../lib/timeline/TimelineDawRecordingPreflight";

describe("recording input preflight", () => {
  it("holds silent and low signals with actionable guidance", () => {
    expect(assessTimelineDawRecordingPreflight(-96)).toMatchObject({ status: "silent", ready: false });
    expect(assessTimelineDawRecordingPreflight(-42)).toMatchObject({ status: "low", ready: false });
  });

  it("accepts useful headroom and warns before clipping", () => {
    expect(assessTimelineDawRecordingPreflight(-18)).toMatchObject({ status: "ready", ready: true });
    expect(assessTimelineDawRecordingPreflight(-4)).toMatchObject({ status: "hot", ready: false });
    expect(assessTimelineDawRecordingPreflight(-0.5)).toMatchObject({ status: "clipping", ready: false });
  });

  it("bounds invalid measurements safely", () => {
    expect(assessTimelineDawRecordingPreflight(Number.NaN)).toMatchObject({ status: "silent", peakDbfs: -96 });
    expect(assessTimelineDawRecordingPreflight(12).peakDbfs).toBe(0);
  });
});
