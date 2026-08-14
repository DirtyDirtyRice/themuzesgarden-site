import { createHash } from "node:crypto";

export const TIMELINE_DAW_BETA_STAGES = ["setup", "capture", "edit", "mix", "protect", "export"] as const;
export type TimelineDawBetaStage = (typeof TIMELINE_DAW_BETA_STAGES)[number];

export type TimelineDawBetaEvidence = {
  sessionExists: boolean;
  audioSourceCount: number;
  editCount: number;
  mixControlCount: number;
  snapshotCount: number;
  completedExportCount: number;
  failedJobCount: number;
  unresolvedIntegrityCount: number;
};

export type TimelineDawBetaCheckpoint = {
  stage: TimelineDawBetaStage;
  completed: boolean;
  title: string;
  detail: string;
  action: string;
  anchor: string;
};

const definitions: Record<TimelineDawBetaStage, Omit<TimelineDawBetaCheckpoint, "stage" | "completed">> = {
  setup: { title: "Open a protected session", detail: "The project owner has a durable DAW session.", action: "Open or create the song session.", anchor: "beta-workflow-session" },
  capture: { title: "Add playable audio", detail: "Record a take or import audio into a private lane.", action: "Record or import at least one audio source.", anchor: "beta-workflow-capture" },
  edit: { title: "Make a reversible edit", detail: "Create an edit receipt, arrangement decision, comp, or MIDI edit.", action: "Make and audition one non-destructive edit.", anchor: "beta-workflow-edit" },
  mix: { title: "Set the mix", detail: "Use a mixer, bus, insert, send, automation, or master control.", action: "Make one intentional mix decision.", anchor: "beta-workflow-mix" },
  protect: { title: "Save a recovery point", detail: "A private session snapshot protects the work before delivery.", action: "Create a named session snapshot.", anchor: "beta-workflow-protect" },
  export: { title: "Create a verified export", detail: "A completed render or bounce has a checksum-protected artifact.", action: "Render and download a verified mix.", anchor: "beta-workflow-export" },
};

export function evaluateTimelineDawBetaWorkflow(evidence: TimelineDawBetaEvidence) {
  const completion: Record<TimelineDawBetaStage, boolean> = {
    setup: evidence.sessionExists,
    capture: evidence.audioSourceCount > 0,
    edit: evidence.editCount > 0,
    mix: evidence.mixControlCount > 0,
    protect: evidence.snapshotCount > 0,
    export: evidence.completedExportCount > 0,
  };
  const checkpoints = TIMELINE_DAW_BETA_STAGES.map((stage) => ({ stage, completed: completion[stage], ...definitions[stage] }));
  const next = checkpoints.find((checkpoint) => !checkpoint.completed) ?? null;
  const blockers = [
    ...(evidence.unresolvedIntegrityCount ? [`${evidence.unresolvedIntegrityCount} integrity incident(s) require review.`] : []),
    ...(evidence.failedJobCount ? [`${evidence.failedJobCount} render or bounce job(s) failed.`] : []),
  ];
  return {
    checkpoints,
    completed: checkpoints.filter((checkpoint) => checkpoint.completed).length,
    required: checkpoints.length,
    percent: Math.round((checkpoints.filter((checkpoint) => checkpoint.completed).length / checkpoints.length) * 100),
    next,
    blockers,
    exportReady: completion.capture && completion.edit && completion.mix && completion.protect && blockers.length === 0,
    complete: checkpoints.every((checkpoint) => checkpoint.completed) && blockers.length === 0,
  };
}

export function createTimelineDawBetaWorkflowReceipt(input: { sessionId: string; evidence: TimelineDawBetaEvidence; observedAt?: string }) {
  const evaluation = evaluateTimelineDawBetaWorkflow(input.evidence);
  const body = { schema: "the-muzes-garden/daw-beta-workflow/v1", sessionId: input.sessionId, observedAt: input.observedAt ?? new Date().toISOString(), evidence: input.evidence, evaluation };
  return { ...body, checksum: `sha256:${createHash("sha256").update(JSON.stringify(body)).digest("hex")}` };
}
