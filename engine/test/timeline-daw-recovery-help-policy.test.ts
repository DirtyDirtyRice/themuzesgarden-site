import { describe, expect, it } from "vitest";
import { normalizeTimelineDawRecoveryHelpStep, TIMELINE_DAW_RECOVERY_HELP_STEPS, timelineDawRecoveryHelpStorageKey } from "../../lib/timeline/TimelineDawRecoveryHelpPolicy";

describe("timeline DAW recovery baby-step help", () => {
  it("covers recording recovery, saved takes, checkpoints, guarded restore, and verification", () => expect(TIMELINE_DAW_RECOVERY_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ")).toMatch(/unsaved recording[\s\S]*Saved Takes[\s\S]*checkpoint[\s\S]*Verify & Restore[\s\S]*Verify the recovered music/i));
  it("distinguishes undo from durable checkpoint restore", () => expect(TIMELINE_DAW_RECOVERY_HELP_STEPS.map((step) => step.instruction).join(" ")).toMatch(/Undo is for recent edits; checkpoint restore is for the durable session/i));
  it("uses a private session-scoped progress key", () => expect(timelineDawRecoveryHelpStorageKey("session-10")).toBe("the-muzes-garden:daw-recovery-help:session-10"));
  it("restores only valid help positions", () => { expect(normalizeTimelineDawRecoveryHelpStep("6")).toBe(6); expect(normalizeTimelineDawRecoveryHelpStep(8)).toBe(0); expect(normalizeTimelineDawRecoveryHelpStep(-1)).toBe(0); });
  it("rejects invalid session identities", () => { expect(() => timelineDawRecoveryHelpStorageKey(" ")).toThrow(/valid session/i); expect(() => timelineDawRecoveryHelpStorageKey("bad/session")).toThrow(/invalid/i); expect(() => timelineDawRecoveryHelpStorageKey("x".repeat(161))).toThrow(/valid session/i); });
});
