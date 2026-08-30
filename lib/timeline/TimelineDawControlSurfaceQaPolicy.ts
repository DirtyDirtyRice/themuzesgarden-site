import type { TimelineDawMidiTransportCommand } from "./TimelineDawMidiTransportPolicy";

export type TimelineDawControlSurfaceQaCheck = TimelineDawMidiTransportCommand | "reconnect";
export type TimelineDawControlSurfaceQaOutcome = "pass" | "problem";

export type TimelineDawControlSurfaceQaTrial = {
  check: TimelineDawControlSurfaceQaCheck;
  outcome: TimelineDawControlSurfaceQaOutcome;
  note: string;
};

export type TimelineDawControlSurfaceQaReport = {
  deviceName: string | null;
  status: "hardware-required" | "in-progress" | "needs-review" | "passed";
  trials: TimelineDawControlSurfaceQaTrial[];
  completedChecks: TimelineDawControlSurfaceQaCheck[];
  remainingChecks: TimelineDawControlSurfaceQaCheck[];
  productionEvidenceComplete: boolean;
};

export const TIMELINE_DAW_CONTROL_SURFACE_QA_CHECKS: TimelineDawControlSurfaceQaCheck[] = [
  "start",
  "continue",
  "stop",
  "reconnect",
];

export function createTimelineDawControlSurfaceQaReport(deviceName?: string | null): TimelineDawControlSurfaceQaReport {
  const normalizedDeviceName = deviceName?.trim() || null;
  return {
    deviceName: normalizedDeviceName,
    status: normalizedDeviceName ? "in-progress" : "hardware-required",
    trials: [],
    completedChecks: [],
    remainingChecks: [...TIMELINE_DAW_CONTROL_SURFACE_QA_CHECKS],
    productionEvidenceComplete: false,
  };
}

export function recordTimelineDawControlSurfaceQaTrial(input: {
  report: TimelineDawControlSurfaceQaReport;
  check: TimelineDawControlSurfaceQaCheck;
  outcome: TimelineDawControlSurfaceQaOutcome;
  note: string;
}): TimelineDawControlSurfaceQaReport {
  if (!input.report.deviceName) throw new Error("Connect and identify a physical MIDI control surface first.");
  if (!TIMELINE_DAW_CONTROL_SURFACE_QA_CHECKS.includes(input.check)) throw new Error("Choose a recognized control-surface QA check.");
  const note = input.note.trim();
  if (note.length < 4) throw new Error("Add a short listening or transport-response note for this physical trial.");

  const trials = [...input.report.trials, { check: input.check, outcome: input.outcome, note }];
  const completedChecks = TIMELINE_DAW_CONTROL_SURFACE_QA_CHECKS.filter((check) =>
    trials.filter((trial) => trial.check === check && trial.outcome === "pass").length >= 3,
  );
  const remainingChecks = TIMELINE_DAW_CONTROL_SURFACE_QA_CHECKS.filter((check) => !completedChecks.includes(check));
  const hasProblem = trials.some((trial) => trial.outcome === "problem");
  const productionEvidenceComplete = !hasProblem && remainingChecks.length === 0;

  return {
    ...input.report,
    trials,
    completedChecks,
    remainingChecks,
    productionEvidenceComplete,
    status: hasProblem ? "needs-review" : productionEvidenceComplete ? "passed" : "in-progress",
  };
}
