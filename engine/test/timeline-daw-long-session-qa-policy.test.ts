import { describe, expect, it } from "vitest";
import { assessTimelineDawLongSessionQa } from "../../lib/timeline/TimelineDawLongSessionQaPolicy";

const complete = { durationMinutes: 30, persistentStorage: true, captureCompleted: true, recoveryProtected: true, reloadPassed: true, playbackPassed: true, clipped: false, errorCount: 0 };

describe("timeline DAW long-session production QA", () => {
  it("passes a complete clean 30-minute recording", () => expect(assessTimelineDawLongSessionQa(complete)).toMatchObject({ status: "passed", productionEvidenceComplete: true, issues: [] }));
  it("does not substitute a short simulation for real extended recording", () => expect(assessTimelineDawLongSessionQa({ ...complete, durationMinutes: 5 })).toMatchObject({ status: "needs-review", productionEvidenceComplete: false }));
  it("requires persistence, recovery, reload, and playback evidence", () => {
    const report = assessTimelineDawLongSessionQa({ ...complete, persistentStorage: false, recoveryProtected: false, reloadPassed: false, playbackPassed: false });
    expect(report.issues.join(" ")).toMatch(/persistent|checkpoint|reload|playback/i);
  });
  it("fails clean-production evidence when clipping or errors occurred", () => expect(assessTimelineDawLongSessionQa({ ...complete, clipped: true, errorCount: 2 })).toMatchObject({ status: "needs-review", productionEvidenceComplete: false }));
});
