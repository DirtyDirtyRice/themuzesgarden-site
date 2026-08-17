import { describe, expect, it } from "vitest";
import { assessTimelineDawRecordedSignalHealth } from "../../lib/timeline/TimelineDawRecordedSignalHealth";

describe("TimelineDawRecordedSignalHealth", () => {
  it("identifies a silent capture without recommending deletion", () => {
    const result = assessTimelineDawRecordedSignalHealth(-96);
    expect(result).toMatchObject({ state: "silent", peakDbfs: -96 });
    expect(result.warning).toMatch(/wav was preserved/i);
  });

  it("warns about an extremely quiet capture", () => {
    const result = assessTimelineDawRecordedSignalHealth(-55);
    expect(result.state).toBe("very-low");
    expect(result.warning).toMatch(/raise the interface gain/i);
  });

  it("accepts a useful signal and clamps invalid readings", () => {
    expect(assessTimelineDawRecordedSignalHealth(-18)).toEqual({
      state: "healthy", peakDbfs: -18, warning: null,
    });
    expect(assessTimelineDawRecordedSignalHealth(Number.NaN).state).toBe("silent");
    expect(assessTimelineDawRecordedSignalHealth(4).peakDbfs).toBe(0);
  });
});
