import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_IMPORT_HELP_STEPS, timelineDawImportHelpStorageKey } from "../../lib/timeline/TimelineDawImportHelpPolicy";

describe("timeline DAW import baby-step help", () => {
  it("covers every musician import decision and verification", () => expect(TIMELINE_DAW_IMPORT_HELP_STEPS.map((step) => `${step.title} ${step.instruction}`).join(" ")).toMatch(/comes from[\s\S]*import type[\s\S]*Choose the music[\s\S]*versions begin[\s\S]*clear name[\s\S]*Import into[\s\S]*problem safely[\s\S]*Verify/i));
  it("distinguishes full songs, stems, and alternate versions", () => expect(TIMELINE_DAW_IMPORT_HELP_STEPS.map((step) => step.instruction).join(" ")).toMatch(/Full Song[\s\S]*Stems[\s\S]*Alternate Versions/i));
  it("preserves Library originals and requires audition verification", () => expect(TIMELINE_DAW_IMPORT_HELP_STEPS.map((step) => step.instruction).join(" ")).toMatch(/original Library songs are never moved or overwritten[\s\S]*audition/i));
  it("uses a validated session-scoped progress key", () => { expect(timelineDawImportHelpStorageKey("session-13")).toBe("the-muzes-garden:daw-import-help:session-13"); expect(() => timelineDawImportHelpStorageKey("bad/session")).toThrow(/invalid/i); expect(() => timelineDawImportHelpStorageKey(" ")).toThrow(/valid session/i); });
});
