import { describe, expect, it } from "vitest";
import { assessTimelineDawChromeRecoveryQa, normalizeTimelineDawChromeRecoveryQaEvidence, TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS, timelineDawChromeRecoveryQaStorageKey } from "../../lib/timeline/TimelineDawChromeRecoveryQaPolicy";

const chrome = "Mozilla/5.0 Windows NT 10.0 Win64 x64 AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36";
describe("timeline DAW Chrome recovery production QA", () => {
  it("rejects Edge even when its user agent contains Chrome", () => expect(assessTimelineDawChromeRecoveryQa({ userAgent: `${chrome} Edg/140.0.0.0`, evidence: {} })).toMatchObject({ status: "chrome-required", productionEvidenceComplete: false }));
  it("requires every real recovery trial", () => expect(assessTimelineDawChromeRecoveryQa({ userAgent: chrome, evidence: { "checkpoint-capture": "pass" } })).toMatchObject({ status: "in-progress", productionEvidenceComplete: false, passedChecks: ["checkpoint-capture"] }));
  it("holds any reported issue", () => expect(assessTimelineDawChromeRecoveryQa({ userAgent: chrome, evidence: { "saved-takes-reload": "issue" } })).toMatchObject({ status: "needs-review", issues: ["saved-takes-reload"] }));
  it("passes only all ten real Chrome trials", () => { const evidence = Object.fromEntries(TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS.map((check) => [check, "pass" as const])); expect(assessTimelineDawChromeRecoveryQa({ userAgent: chrome, evidence })).toMatchObject({ status: "passed", productionEvidenceComplete: true, automatedEvidenceAccepted: false, remainingChecks: [] }); });
  it("stores only allowlisted evidence markers", () => expect(normalizeTimelineDawChromeRecoveryQaEvidence({ "checkpoint-capture": "pass", privateName: "secret", "history-reopen": "unknown" })).toEqual({ "checkpoint-capture": "pass" }));
  it("uses a validated session-scoped key", () => { expect(timelineDawChromeRecoveryQaStorageKey("session-10")).toBe("the-muzes-garden:daw-chrome-recovery-qa:session-10"); expect(() => timelineDawChromeRecoveryQaStorageKey("bad/session")).toThrow(/valid session/i); });
});
