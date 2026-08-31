import { describe, expect, it } from "vitest";
import { assessTimelineDawChromeMidiProductionQa, identifyTimelineDawGoogleChrome, TIMELINE_DAW_CHROME_MIDI_QA_CHECKS } from "../../lib/timeline/TimelineDawChromeMidiProductionQaPolicy";

const chromeUa = "Mozilla/5.0 Windows NT 10.0 Win64 x64 AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36";
describe("timeline DAW Chrome MIDI production QA", () => {
  it("identifies Google Chrome but excludes Edge and other Chromium browsers", () => { expect(identifyTimelineDawGoogleChrome(chromeUa)).toEqual({ browser: "Google Chrome", version: "140.0.0.0" }); expect(identifyTimelineDawGoogleChrome(`${chromeUa} Edg/140.0.0.0`)).toBeNull(); expect(identifyTimelineDawGoogleChrome(`${chromeUa} OPR/120.0`)).toBeNull(); });
  it("requires Google Chrome before qualification", () => expect(assessTimelineDawChromeMidiProductionQa({ userAgent: "Mozilla Firefox/142", deviceName: "Keyboard", evidence: {} })).toMatchObject({ status: "chrome-required", productionEvidenceComplete: false }));
  it("requires a named physical controller", () => expect(assessTimelineDawChromeMidiProductionQa({ userAgent: chromeUa, deviceName: "", evidence: {} })).toMatchObject({ status: "hardware-required", productionEvidenceComplete: false }));
  it("holds partial evidence and every reported issue", () => expect(assessTimelineDawChromeMidiProductionQa({ userAgent: chromeUa, deviceName: "Real Keyboard", evidence: { "midi-access-permission": "pass", "clock-and-input-timing": "issue" } })).toMatchObject({ status: "needs-review", productionEvidenceComplete: false, issues: ["clock-and-input-timing"] }));
  it("passes only all twelve real Chrome and hardware trials", () => { const evidence = Object.fromEntries(TIMELINE_DAW_CHROME_MIDI_QA_CHECKS.map((check) => [check, "pass" as const])); expect(assessTimelineDawChromeMidiProductionQa({ userAgent: chromeUa, deviceName: "Real Keyboard", evidence })).toMatchObject({ status: "passed", productionEvidenceComplete: true, realHardwareEvidenceComplete: true, passedChecks: TIMELINE_DAW_CHROME_MIDI_QA_CHECKS, remainingChecks: [] }); });
});
