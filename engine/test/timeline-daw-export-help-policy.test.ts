import { describe, expect, it } from "vitest";
import { normalizeTimelineDawExportHelpStep, timelineDawExportHelpStorageKey, TIMELINE_DAW_EXPORT_HELP_STEPS } from "../../lib/timeline/TimelineDawExportHelpPolicy";

describe("DAW export baby-step help", () => {
  it("shows the complete delivery workflow one ordered action at a time", () => {
    expect(TIMELINE_DAW_EXPORT_HELP_STEPS.map((step) => step.title)).toEqual([
      "Create the delivery", "Download the completed file", "Verify the downloaded file", "Save the verification receipt", "Recheck the delivery later",
    ]);
  });
  it("restores only an allowlisted step number", () => {
    expect(normalizeTimelineDawExportHelpStep("3")).toBe(3);
    expect(normalizeTimelineDawExportHelpStep(-1)).toBe(0);
    expect(normalizeTimelineDawExportHelpStep(99)).toBe(0);
    expect(normalizeTimelineDawExportHelpStep("private audio")).toBe(0);
  });
  it("scopes progress to the exact DAW session", () => {
    expect(timelineDawExportHelpStorageKey("session-1")).not.toBe(timelineDawExportHelpStorageKey("session-2"));
    expect(() => timelineDawExportHelpStorageKey(" ")).toThrow(/session ID is invalid/i);
  });
});
