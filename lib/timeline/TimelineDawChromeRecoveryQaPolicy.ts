import { identifyTimelineDawGoogleChrome } from "./TimelineDawChromeMidiProductionQaPolicy";

export const TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS = [
  "extended-session",
  "checkpoint-capture",
  "checkpoint-integrity",
  "recording-recovery-reload",
  "saved-takes-reload",
  "history-reopen",
  "restore-cancel-guard",
  "exact-checkpoint-restore",
  "undo-redo-after-recovery",
  "private-owner-boundary",
] as const;

export type TimelineDawChromeRecoveryQaCheck = (typeof TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS)[number];
export type TimelineDawChromeRecoveryQaEvidence = "pass" | "issue";

export const TIMELINE_DAW_CHROME_RECOVERY_QA_LABELS: Record<TimelineDawChromeRecoveryQaCheck, string> = {
  "extended-session": "A real 30-minute Chrome session completes without losing recovery state",
  "checkpoint-capture": "A named checkpoint is captured before risky work",
  "checkpoint-integrity": "The checkpoint reloads with its revision, date, byte count, and verified integrity",
  "recording-recovery-reload": "An unsaved recovery WAV remains available after a Chrome refresh",
  "saved-takes-reload": "Reload Saved Takes returns the expected private take and it auditions correctly",
  "history-reopen": "Session edit history remains available after closing and reopening Studio",
  "restore-cancel-guard": "Canceling Verify & Restore leaves the current session unchanged",
  "exact-checkpoint-restore": "Confirming restore returns the exact intended checkpoint and not another revision",
  "undo-redo-after-recovery": "Undo and redo work correctly after the restored session reopens",
  "private-owner-boundary": "Recovery audio, checkpoints, and history remain private to the authorized owner",
};

export function timelineDawChromeRecoveryQaStorageKey(sessionId: string) {
  const value = sessionId.trim();
  if (!value || value.length > 160 || !/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("A valid session is required for Chrome recovery QA.");
  return `the-muzes-garden:daw-chrome-recovery-qa:${value}`;
}

export function normalizeTimelineDawChromeRecoveryQaEvidence(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS.flatMap((check) => {
    const result = (value as Record<string, unknown>)[check];
    return result === "pass" || result === "issue" ? [[check, result]] : [];
  })) as Partial<Record<TimelineDawChromeRecoveryQaCheck, TimelineDawChromeRecoveryQaEvidence>>;
}

export function assessTimelineDawChromeRecoveryQa(input: { userAgent: string; evidence: Partial<Record<TimelineDawChromeRecoveryQaCheck, TimelineDawChromeRecoveryQaEvidence>> }) {
  const chrome = identifyTimelineDawGoogleChrome(input.userAgent);
  const evidence = normalizeTimelineDawChromeRecoveryQaEvidence(input.evidence);
  const passedChecks = TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS.filter((check) => evidence[check] === "pass");
  const issues = TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS.filter((check) => evidence[check] === "issue");
  const remainingChecks = TIMELINE_DAW_CHROME_RECOVERY_QA_CHECKS.filter((check) => evidence[check] !== "pass");
  const productionEvidenceComplete = Boolean(chrome) && issues.length === 0 && remainingChecks.length === 0;
  const status = !chrome ? "chrome-required" as const : issues.length ? "needs-review" as const : productionEvidenceComplete ? "passed" as const : "in-progress" as const;
  return { status, chrome, evidence, passedChecks, issues, remainingChecks, productionEvidenceComplete, automatedEvidenceAccepted: false as const, privateSourcesPreserved: true as const };
}
