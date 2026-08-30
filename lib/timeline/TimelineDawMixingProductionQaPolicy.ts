export const TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS = [
  "plugin-instantiation",
  "state-recall",
  "automation-write-read",
  "latency-compensation",
  "bypass-crash-recovery",
  "missing-plugin-placeholder",
  "rendered-audio-fallback",
  "control-surface-faders",
  "control-surface-pan-mute-solo",
  "session-reopen",
  "full-mix-audition",
  "export-verification",
] as const;

export type TimelineDawMixingProductionQaCheck = (typeof TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS)[number];

export const TIMELINE_DAW_MIXING_PRODUCTION_QA_LABELS: Record<TimelineDawMixingProductionQaCheck, string> = {
  "plugin-instantiation": "Real plug-in opens through the named bridge",
  "state-recall": "Plug-in state survives save, close, and reopen",
  "automation-write-read": "Real plug-in automation writes and reads correctly",
  "latency-compensation": "Measured plug-in latency is compensated",
  "bypass-crash-recovery": "Bypass or simulated crash keeps dry audio playing",
  "missing-plugin-placeholder": "Missing plug-in reopens as a safe placeholder",
  "rendered-audio-fallback": "Rendered-audio fallback matches the approved source",
  "control-surface-faders": "Physical faders control the intended channels",
  "control-surface-pan-mute-solo": "Physical pan, mute, and solo control the intended channels",
  "session-reopen": "Complete mix and routing survive session reopen",
  "full-mix-audition": "The complete mix is auditioned without clipping or routing errors",
  "export-verification": "Export is played through and matches the approved mix",
};

export type TimelineDawMixingProductionQaReport = {
  status: "equipment-required" | "in-progress" | "needs-review" | "passed";
  bridgeName: string;
  pluginIdentity: string;
  controlSurfaceName: string;
  evidence: Partial<Record<TimelineDawMixingProductionQaCheck, "pass" | "issue">>;
  passedChecks: TimelineDawMixingProductionQaCheck[];
  remainingChecks: TimelineDawMixingProductionQaCheck[];
  issues: TimelineDawMixingProductionQaCheck[];
  productionEvidenceComplete: boolean;
};

export function assessTimelineDawMixingProductionQa(input: {
  bridgeName: string;
  pluginIdentity: string;
  controlSurfaceName: string;
  evidence: Partial<Record<TimelineDawMixingProductionQaCheck, "pass" | "issue">>;
}): TimelineDawMixingProductionQaReport {
  const bridgeName = input.bridgeName.trim();
  const pluginIdentity = input.pluginIdentity.trim();
  const controlSurfaceName = input.controlSurfaceName.trim();
  const identitiesComplete = Boolean(bridgeName && pluginIdentity && controlSurfaceName);
  const passedChecks = TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS.filter((check) => input.evidence[check] === "pass");
  const issues = TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS.filter((check) => input.evidence[check] === "issue");
  const remainingChecks = TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS.filter((check) => input.evidence[check] !== "pass");
  const productionEvidenceComplete = identitiesComplete && issues.length === 0 && remainingChecks.length === 0;
  const status = !identitiesComplete ? "equipment-required" : issues.length ? "needs-review" : productionEvidenceComplete ? "passed" : "in-progress";
  return { status, bridgeName, pluginIdentity, controlSurfaceName, evidence: { ...input.evidence }, passedChecks, remainingChecks, issues, productionEvidenceComplete };
}
