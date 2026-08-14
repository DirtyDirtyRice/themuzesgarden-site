import type {
  TimelineDawOwnerTestEvidence,
  TimelineDawOwnerTestStep,
} from "./TimelineDawOwnerMusicianTestPolicy";
import type { TimelineDawVisualLessonId } from "./TimelineDawVisualGuidePolicy";

export type TimelineDawTechnicalTestStatus =
  | "verified"
  | "held"
  | "human-required";

export type TimelineDawTechnicalTestResult = {
  step: TimelineDawOwnerTestStep;
  lessonId: TimelineDawVisualLessonId;
  title: string;
  status: TimelineDawTechnicalTestStatus;
  detail: string;
  anchor: string;
  evidenceKey: keyof TimelineDawOwnerTestEvidence | null;
  evidenceCount: number | null;
};

type Definition = {
  step: TimelineDawOwnerTestStep;
  lessonId: TimelineDawVisualLessonId;
  title: string;
  anchor: string;
  evidenceKey: keyof TimelineDawOwnerTestEvidence | null;
  verifiedDetail: string;
  heldDetail: string;
};

export const TIMELINE_DAW_TECHNICAL_TEST_DEFINITIONS: Definition[] = [
  {
    step: "protect",
    lessonId: "protect-copy",
    title: "Protected source",
    anchor: "#owner-test-workspace",
    evidenceKey: "audioSourceCount",
    verifiedDetail: "A checksum-bearing protected audio source exists.",
    heldDetail: "Import protected audio before claiming source protection.",
  },
  {
    step: "import",
    lessonId: "import-audio",
    title: "Audio import",
    anchor: "#musician-audio-import",
    evidenceKey: "audioSourceCount",
    verifiedDetail: "At least one protected audio source or lane is recorded.",
    heldDetail: "No protected audio source or lane has been recorded.",
  },
  {
    step: "audition",
    lessonId: "audition",
    title: "Audition",
    anchor: "#timeline-daw-transport",
    evidenceKey: null,
    verifiedDetail: "",
    heldDetail: "Only a musician can confirm that the expected song is heard.",
  },
  {
    step: "edit",
    lessonId: "edit",
    title: "Reversible edit",
    anchor: "#beta-workflow-edit",
    evidenceKey: "editCount",
    verifiedDetail: "At least one durable arrangement or lane edit exists.",
    heldDetail: "No durable reversible edit has been recorded.",
  },
  {
    step: "mix",
    lessonId: "quick-mix",
    title: "Quick Mix",
    anchor: "#musician-quick-mix",
    evidenceKey: "mixControlCount",
    verifiedDetail: "At least one durable bus, insert, or automation decision exists.",
    heldDetail: "No durable mix-control decision has been recorded.",
  },
  {
    step: "recover",
    lessonId: "recover",
    title: "Recovery snapshot",
    anchor: "#beta-workflow-protect",
    evidenceKey: "snapshotCount",
    verifiedDetail: "At least one checksum-protected recovery snapshot exists.",
    heldDetail: "No recovery snapshot has been recorded.",
  },
  {
    step: "export",
    lessonId: "export",
    title: "Completed export",
    anchor: "#beta-workflow-export",
    evidenceKey: "completedExportCount",
    verifiedDetail: "At least one completed protected export exists.",
    heldDetail: "No completed protected export has been recorded.",
  },
];

export function evaluateTimelineDawTechnicalTest(
  evidence: TimelineDawOwnerTestEvidence,
) {
  const results: TimelineDawTechnicalTestResult[] =
    TIMELINE_DAW_TECHNICAL_TEST_DEFINITIONS.map((definition) => {
      if (definition.evidenceKey === null) {
        return {
          ...definition,
          status: "human-required" as const,
          detail: definition.heldDetail,
          evidenceCount: null,
        };
      }

      const evidenceCount = evidence[definition.evidenceKey];
      const verified = evidenceCount > 0;
      return {
        ...definition,
        status: verified ? ("verified" as const) : ("held" as const),
        detail: verified ? definition.verifiedDetail : definition.heldDetail,
        evidenceCount,
      };
    });

  const verifiedCount = results.filter((item) => item.status === "verified").length;
  const heldCount = results.filter((item) => item.status === "held").length;
  const humanRequiredCount = results.filter(
    (item) => item.status === "human-required",
  ).length;

  return {
    results,
    verifiedCount,
    heldCount,
    humanRequiredCount,
    readyForHuman: heldCount === 0,
  };
}
