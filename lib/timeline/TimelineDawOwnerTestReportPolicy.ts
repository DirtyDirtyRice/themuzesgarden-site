import {
  TIMELINE_DAW_TECHNICAL_TEST_DEFINITIONS,
  type TimelineDawTechnicalTestResult,
} from "./TimelineDawTechnicalTestPolicy";
import type {
  TimelineDawOwnerTestOutcome,
  TimelineDawOwnerTestStep,
} from "./TimelineDawOwnerMusicianTestPolicy";

export type TimelineDawReportObservation = {
  id: string;
  step: TimelineDawOwnerTestStep;
  outcome: TimelineDawOwnerTestOutcome;
  notes: string;
  clickCount: number | null;
  excessiveSteps: boolean;
  screenshotDataUrl: string | null;
  failureContext: Record<string, unknown>;
  createdAt: string;
};

export type TimelineDawReportFindingStatus =
  | "verified"
  | "human-required"
  | "attention-required";

export function buildTimelineDawOwnerTestReport(input: {
  generatedAt: string;
  technicalResults: TimelineDawTechnicalTestResult[];
  observations: TimelineDawReportObservation[];
}) {
  const latestObservation = new Map<TimelineDawOwnerTestStep, TimelineDawReportObservation>();
  for (const observation of input.observations) latestObservation.set(observation.step, observation);
  const technical = new Map(input.technicalResults.map((result) => [result.step, result]));

  const findings = TIMELINE_DAW_TECHNICAL_TEST_DEFINITIONS.map((definition) => {
    const machine = technical.get(definition.step) ?? null;
    const human = latestObservation.get(definition.step) ?? null;
    const attention = machine?.status === "held" || (human !== null && human.outcome !== "pass");
    const verified = machine?.status === "verified" && human?.outcome === "pass";
    const status: TimelineDawReportFindingStatus = attention
      ? "attention-required"
      : verified
        ? "verified"
        : "human-required";
    return {
      step: definition.step,
      title: definition.title,
      lessonId: definition.lessonId,
      anchor: definition.anchor,
      status,
      technical: machine,
      human,
    };
  });

  return {
    generatedAt: input.generatedAt,
    privacy: "private-owner-only" as const,
    findings,
    verifiedCount: findings.filter((item) => item.status === "verified").length,
    humanRequiredCount: findings.filter((item) => item.status === "human-required").length,
    attentionRequiredCount: findings.filter((item) => item.status === "attention-required").length,
    screenshotCount: findings.filter((item) => Boolean(item.human?.screenshotDataUrl)).length,
  };
}
