export const TIMELINE_DAW_VERBAL_EDIT_SCOPES = [
  { id: "whole-song", label: "Whole song" },
  { id: "section", label: "Verse, chorus, bridge, or other section" },
  { id: "track", label: "One or more tracks or instruments" },
  { id: "phrase", label: "Phrase, riff, chord, or drum pattern" },
  { id: "notes", label: "Individual notes" },
] as const;

export type TimelineDawVerbalEditScope = typeof TIMELINE_DAW_VERBAL_EDIT_SCOPES[number]["id"];

export type TimelineDawVerbalEditRequest = {
  instruction: string;
  scope: TimelineDawVerbalEditScope;
  preserveSources: true;
};

function normalizeInstruction(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function parseTimelineDawVerbalEditRequest(value: unknown): TimelineDawVerbalEditRequest {
  if (!value || typeof value !== "object") throw new Error("Describe the musical edit you want.");
  const input = value as Record<string, unknown>;
  const instruction = normalizeInstruction(input.instruction);
  if (instruction.length < 10) throw new Error("Describe the musical edit in at least 10 characters.");
  if (instruction.length > 4_000) throw new Error("Keep this edit request under 4,000 characters.");
  const scope = typeof input.scope === "string" && TIMELINE_DAW_VERBAL_EDIT_SCOPES.some((item) => item.id === input.scope)
    ? input.scope as TimelineDawVerbalEditScope
    : null;
  if (!scope) throw new Error("Choose which part of the music this request should affect.");
  if (input.preserveSources !== true) throw new Error("Source preservation must remain on for verbal editing.");
  return { instruction, scope, preserveSources: true };
}

export function summarizeTimelineDawVerbalEditRequest(request: TimelineDawVerbalEditRequest) {
  const scope = TIMELINE_DAW_VERBAL_EDIT_SCOPES.find((item) => item.id === request.scope);
  return {
    scopeLabel: scope?.label ?? "Music",
    instruction: request.instruction,
    safetyLabel: "Original recordings and approved edits stay unchanged.",
  };
}
