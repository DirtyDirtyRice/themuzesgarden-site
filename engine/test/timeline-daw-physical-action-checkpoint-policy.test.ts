import { describe, expect, it } from "vitest";
import { createTimelineDawPhysicalActionCheckpoint, verifyTimelineDawPhysicalActionCheckpoint } from "../../lib/timeline/TimelineDawPhysicalActionCheckpointPolicy";

describe("TimelineDawPhysicalActionCheckpointPolicy", () => {
  it("pauses on one precise human action without performing or persisting it", () => {
    expect(createTimelineDawPhysicalActionCheckpoint("Connect output 1 to the left monitor input.")).toMatchObject({ status: "paused-for-human", resumeAllowed: false, automaticHardwareActionAllowed: false, persistenceAllowed: false });
  });

  it("requires action confirmation, verification evidence, and a note before resume", () => {
    const checkpoint = createTimelineDawPhysicalActionCheckpoint("Connect output 1 to the left monitor input.");
    expect(() => verifyTimelineDawPhysicalActionCheckpoint({ checkpoint, physicalActionConfirmed: false, verification: "signal-detected", verificationNote: "Meter moved." })).toThrow(/completed/i);
    expect(() => verifyTimelineDawPhysicalActionCheckpoint({ checkpoint, physicalActionConfirmed: true, verification: "not-verified", verificationNote: "Meter moved." })).toThrow(/verified/i);
    expect(() => verifyTimelineDawPhysicalActionCheckpoint({ checkpoint, physicalActionConfirmed: true, verification: "signal-detected", verificationNote: "" })).toThrow(/note/i);
  });

  it("resumes only after a human-confirmed verification", () => {
    const checkpoint = createTimelineDawPhysicalActionCheckpoint("Connect output 1 to the left monitor input.");
    expect(verifyTimelineDawPhysicalActionCheckpoint({ checkpoint, physicalActionConfirmed: true, verification: "signal-detected", verificationNote: "Left output meter moved." })).toMatchObject({ status: "ready-to-resume", resumeAllowed: true, verification: "signal-detected", verificationNote: "Left output meter moved." });
  });
});
