export const TIMELINE_DAW_VERBAL_ACCEPTANCE_LEVELS = [
  { id: "sections", label: "Song sections and arrangement" },
  { id: "tracks", label: "Tracks and instruments" },
  { id: "phrases", label: "Phrases, riffs, and drum patterns" },
  { id: "chords", label: "Chords and harmony" },
  { id: "notes", label: "Individual notes and timing" },
] as const;

export type TimelineDawVerbalAcceptanceLevelId = typeof TIMELINE_DAW_VERBAL_ACCEPTANCE_LEVELS[number]["id"];
export type TimelineDawVerbalAcceptanceResult = { id: TimelineDawVerbalAcceptanceLevelId; label: string; status: "not-tested" | "pass" | "needs-revision"; evidence: string };
export type TimelineDawVerbalAcceptance = {
  results: readonly TimelineDawVerbalAcceptanceResult[];
  status: "incomplete" | "needs-revision" | "accepted";
  musicianAccepted: boolean;
  executionAllowed: false;
  sourceMutationAllowed: false;
  persistenceAllowed: false;
};

export function createTimelineDawVerbalAcceptance(): TimelineDawVerbalAcceptance {
  return { results: TIMELINE_DAW_VERBAL_ACCEPTANCE_LEVELS.map((level) => ({ ...level, status: "not-tested", evidence: "" })), status: "incomplete", musicianAccepted: false, executionAllowed: false, sourceMutationAllowed: false, persistenceAllowed: false };
}

export function recordTimelineDawVerbalAcceptance(input: { acceptance: TimelineDawVerbalAcceptance; levelId: unknown; status: unknown; evidence: unknown }): TimelineDawVerbalAcceptance {
  const levelId = String(input.levelId) as TimelineDawVerbalAcceptanceLevelId;
  if (!TIMELINE_DAW_VERBAL_ACCEPTANCE_LEVELS.some((level) => level.id === levelId)) throw new Error("Choose a supported musical acceptance level.");
  if (input.status !== "not-tested" && input.status !== "pass" && input.status !== "needs-revision") throw new Error("Choose not tested, pass, or needs revision.");
  const evidence = String(input.evidence ?? "").replace(/\s+/g, " ").trim();
  if (input.status !== "not-tested" && evidence.length < 4) throw new Error("Add a short listening note for every tested level.");
  if (evidence.length > 1_000) throw new Error("Keep each listening note to 1,000 characters or fewer.");
  const results = input.acceptance.results.map((result) => result.id === levelId ? { ...result, status: input.status as TimelineDawVerbalAcceptanceResult["status"], evidence } : result);
  const status = results.some((result) => result.status === "needs-revision") ? "needs-revision" : results.every((result) => result.status === "pass") ? "accepted" : "incomplete";
  return { results, status, musicianAccepted: status === "accepted", executionAllowed: false, sourceMutationAllowed: false, persistenceAllowed: false };
}
