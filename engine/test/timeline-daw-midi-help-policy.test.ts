import { describe, expect, it } from "vitest";
import { normalizeTimelineDawMidiHelpStep, TIMELINE_DAW_MIDI_HELP_STEPS, timelineDawMidiHelpStorageKey } from "../../lib/timeline/TimelineDawMidiHelpPolicy";

describe("timeline DAW MIDI baby-step help", () => {
  it("covers the complete protected MIDI workflow", () => expect(TIMELINE_DAW_MIDI_HELP_STEPS.map((step) => step.title).join(" ")).toMatch(/begin.*Hear.*note.*timing.*instrument.*expression.*audio.*safely/i));
  it("uses a private session-scoped progress key", () => expect(timelineDawMidiHelpStorageKey("session-9")).toBe("the-muzes-garden:daw-midi-help:session-9"));
  it("restores only valid help positions", () => { expect(normalizeTimelineDawMidiHelpStep("5")).toBe(5); expect(normalizeTimelineDawMidiHelpStep(8)).toBe(0); expect(normalizeTimelineDawMidiHelpStep(-1)).toBe(0); });
  it("rejects missing or oversized session identities", () => { expect(() => timelineDawMidiHelpStorageKey(" ")).toThrow(/valid session/i); expect(() => timelineDawMidiHelpStorageKey("x".repeat(161))).toThrow(/valid session/i); });
});
