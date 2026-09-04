export const TIMELINE_DAW_OWNER_TEST_STEPS = ["protect", "import", "audition", "edit", "mix", "recover", "return", "export"] as const;
export type TimelineDawOwnerTestStep = (typeof TIMELINE_DAW_OWNER_TEST_STEPS)[number];
export type TimelineDawOwnerTestOutcome = "pass" | "fail" | "confusing" | "blocked";

export function parseTimelineDawOwnerTestReturnStep(value: unknown): TimelineDawOwnerTestStep | null {
  return typeof value === "string" && TIMELINE_DAW_OWNER_TEST_STEPS.includes(value as TimelineDawOwnerTestStep)
    ? value as TimelineDawOwnerTestStep
    : null;
}

export function timelineDawOwnerTestReturnStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(normalized)) throw new Error("A valid DAW session is required for return-to-step memory.");
  return `muzes:daw-owner-test-return:${normalized}`;
}

export function timelineDawOwnerTestAwayStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(normalized)) throw new Error("A valid DAW session is required for leave-and-return memory.");
  return `muzes:daw-owner-test-away:${normalized}`;
}

export function isTimelineDawOwnerTestReturnVerified(leftAppAt: number | null, returnedAt: number, minimumAwayMilliseconds = 1_000) {
  return leftAppAt !== null
    && Number.isFinite(leftAppAt)
    && Number.isFinite(returnedAt)
    && Number.isFinite(minimumAwayMilliseconds)
    && minimumAwayMilliseconds >= 1_000
    && returnedAt - leftAppAt >= minimumAwayMilliseconds;
}

export type TimelineDawOwnerTestEvidence = {
  audioSourceCount: number;
  editCount: number;
  mixControlCount: number;
  snapshotCount: number;
  completedExportCount: number;
};

export type TimelineDawOwnerTestObservation = {
  step: TimelineDawOwnerTestStep;
  outcome: TimelineDawOwnerTestOutcome;
};

export type TimelineDawOwnerTestDefinition = {
  step: TimelineDawOwnerTestStep;
  title: string;
  instruction: string;
  destination: string;
  proof: keyof TimelineDawOwnerTestEvidence | null;
};

export const TIMELINE_DAW_OWNER_TEST_DEFINITIONS: TimelineDawOwnerTestDefinition[] = [
  { step: "protect", title: "Protect the original", instruction: "Confirm that this test uses a copy of your song and never replaces the original.", destination: "#owner-test-workspace", proof: null },
  { step: "import", title: "Import your song", instruction: "Import a full song, stems, or alternate versions into protected lanes.", destination: "#musician-audio-import", proof: "audioSourceCount" },
  { step: "audition", title: "Listen before editing", instruction: "Play the imported audio and confirm that it is the song you expected.", destination: "#timeline-daw-transport", proof: null },
  { step: "edit", title: "Make one reversible edit", instruction: "Move, trim, split, or arrange one item, then listen to the change.", destination: "#timeline-daw-arrange", proof: "editCount" },
  { step: "mix", title: "Make one Quick Mix decision", instruction: "Change one level, pan, mute, solo, send, route, or native mix preset.", destination: "#musician-quick-mix", proof: "mixControlCount" },
  { step: "recover", title: "Prove recovery works", instruction: "Create a named recovery snapshot before export.", destination: "#private-session-snapshots", proof: "snapshotCount" },
  { step: "return", title: "Leave for this chat and return", instruction: "Leave the Muzes Garden app, spend at least one second in this Codex chat, then return. Confirm that the DAW stays on this step without traveling through other pages or work areas.", destination: "#owner-test-workspace", proof: null },
  { step: "export", title: "Verify the delivered file", instruction: "Create and download one completed, checksum-protected export.", destination: "#daw-export-workspace", proof: "completedExportCount" },
];

export function evaluateTimelineDawOwnerTest(observations: TimelineDawOwnerTestObservation[], evidence: TimelineDawOwnerTestEvidence) {
  const latest = new Map<TimelineDawOwnerTestStep, TimelineDawOwnerTestObservation>();
  for (const observation of observations) latest.set(observation.step, observation);
  const completedSteps = TIMELINE_DAW_OWNER_TEST_STEPS.filter((step) => latest.get(step)?.outcome === "pass");
  const current = TIMELINE_DAW_OWNER_TEST_DEFINITIONS.find((definition) => latest.get(definition.step)?.outcome !== "pass") ?? null;
  return { completed: completedSteps.length, required: TIMELINE_DAW_OWNER_TEST_STEPS.length, current, complete: completedSteps.length === TIMELINE_DAW_OWNER_TEST_STEPS.length, evidence };
}

export function validateTimelineDawOwnerTestResult(input: { step: TimelineDawOwnerTestStep; outcome: TimelineDawOwnerTestOutcome; evidence: TimelineDawOwnerTestEvidence; downloadVerified?: boolean; controlActionVerified?: boolean; returnVerified?: boolean }) {
  const definition = TIMELINE_DAW_OWNER_TEST_DEFINITIONS.find((item) => item.step === input.step);
  if (!definition) throw new Error("The guided-test step is invalid.");
  // The owner-test result itself is the durable human attestation for clip edits.
  // ProjectDawTimeline clip edits are intentionally reversible current-session state,
  // so they do not always create a server-side arrangement edit row.
  const verifiedCurrentSessionAction = input.step === "edit" || input.step === "mix";
  if (input.outcome === "pass" && definition.proof && input.evidence[definition.proof] < 1 && !verifiedCurrentSessionAction) {
    throw new Error(`The DAW has not recorded the required proof for “${definition.title}” yet.`);
  }
  if (input.step === "export" && input.outcome === "pass" && !input.downloadVerified) {
    throw new Error("Verify the downloaded WAV or stems ZIP before passing this step.");
  }
  if (input.step === "return" && input.outcome === "pass" && !input.returnVerified) {
    throw new Error("Leave the app for this chat, wait at least one second, and return before passing this step.");
  }
  return definition;
}
