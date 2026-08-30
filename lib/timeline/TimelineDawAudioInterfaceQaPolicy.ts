export type TimelineDawAudioInterfaceQaCheck = "identity" | "input-signal" | "output-monitoring" | "channel-routing" | "sample-rate" | "latency" | "reconnect";
export type TimelineDawAudioInterfaceQaOutcome = "pass" | "problem";

export const TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS: TimelineDawAudioInterfaceQaCheck[] = [
  "identity", "input-signal", "output-monitoring", "channel-routing", "sample-rate", "latency", "reconnect",
];

export type TimelineDawAudioInterfaceQaReport = {
  interfaceName: string | null;
  status: "hardware-required" | "in-progress" | "needs-review" | "passed";
  evidence: Array<{ check: TimelineDawAudioInterfaceQaCheck; outcome: TimelineDawAudioInterfaceQaOutcome; note: string }>;
  passedChecks: TimelineDawAudioInterfaceQaCheck[];
  remainingChecks: TimelineDawAudioInterfaceQaCheck[];
  productionEvidenceComplete: boolean;
};

export function createTimelineDawAudioInterfaceQaReport(interfaceName?: string | null): TimelineDawAudioInterfaceQaReport {
  const name = interfaceName?.trim() || null;
  return { interfaceName: name, status: name ? "in-progress" : "hardware-required", evidence: [], passedChecks: [], remainingChecks: [...TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS], productionEvidenceComplete: false };
}

export function recordTimelineDawAudioInterfaceQaEvidence(input: { report: TimelineDawAudioInterfaceQaReport; check: TimelineDawAudioInterfaceQaCheck; outcome: TimelineDawAudioInterfaceQaOutcome; note: string }): TimelineDawAudioInterfaceQaReport {
  if (!input.report.interfaceName) throw new Error("Test the microphone and latency first so Chrome can identify the physical interface.");
  if (!TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS.includes(input.check)) throw new Error("Choose a recognized audio-interface QA check.");
  const note = input.note.trim();
  if (note.length < 4) throw new Error("Add a short note describing the physical result.");
  const evidence = [...input.report.evidence.filter((item) => item.check !== input.check), { check: input.check, outcome: input.outcome, note }];
  const passedChecks = TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS.filter((check) => evidence.some((item) => item.check === check && item.outcome === "pass"));
  const remainingChecks = TIMELINE_DAW_AUDIO_INTERFACE_QA_CHECKS.filter((check) => !passedChecks.includes(check));
  const hasProblem = evidence.some((item) => item.outcome === "problem");
  const productionEvidenceComplete = !hasProblem && remainingChecks.length === 0;
  return { ...input.report, evidence, passedChecks, remainingChecks, productionEvidenceComplete, status: hasProblem ? "needs-review" : productionEvidenceComplete ? "passed" : "in-progress" };
}
