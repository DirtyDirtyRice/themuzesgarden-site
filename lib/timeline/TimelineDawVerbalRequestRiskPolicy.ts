export type TimelineDawVerbalRequestRiskAssessment = {
  confidence: "high" | "medium" | "low" | "blocked";
  executionAllowed: false;
  destructiveRequest: boolean;
  evidence: readonly string[];
  warnings: readonly string[];
  clarificationQuestions: readonly string[];
  protectedAlternative: string | null;
  sourceMutationAllowed: false;
  persistenceAllowed: false;
};

const ACTION = /\b(add|copy|duplicate|extend|move|trim|split|repeat|transpose|harmon(?:ize|ise)|double|triple|replace|mute|fade|quantize|change|remove)\b/i;
const TARGET = /\b(song|verse|chorus|bridge|intro|outro|track|vocal|guitar|bass|drum|piano|sax|riff|phrase|chord|note|solo|section|clip)\b/i;
const LOCATION = /\b(at the (?:start|beginning|end)|before|after|between|from|to|middle|bar|beat|tick|second|verse|chorus|bridge|intro|outro)\b/i;
const VAGUE = /\b(make it better|fix it|change it|do something|somewhere|maybe|kind of|sort of|stuff|thing)\b/i;
const DESTRUCTIVE = /\b(overwrite|erase|destroy|flatten|bake in|permanently delete|delete permanently|replace (?:the )?(?:original|source|master)|delete (?:the )?(?:original|source|master))\b/i;

export function assessTimelineDawVerbalRequestRisk(instructionInput: unknown): TimelineDawVerbalRequestRiskAssessment {
  const instruction = String(instructionInput ?? "").replace(/\s+/g, " ").trim();
  if (instruction.length < 4) throw new Error("Enter a verbal edit request before assessing confidence.");
  const hasAction = ACTION.test(instruction);
  const hasTarget = TARGET.test(instruction);
  const hasLocation = LOCATION.test(instruction);
  const vague = VAGUE.test(instruction);
  const destructiveRequest = DESTRUCTIVE.test(instruction);
  const evidence = [
    hasAction ? "A concrete edit action was recognized." : "No concrete edit action was recognized.",
    hasTarget ? "A musical target was recognized." : "No musical target was recognized.",
    hasLocation ? "A timeline or section location was recognized." : "No timeline or section location was recognized.",
  ];
  const clarificationQuestions = [
    ...(!hasAction ? ["What exact action should be performed: add, move, repeat, trim, transpose, harmonize, mute, or another named action?"] : []),
    ...(!hasTarget ? ["Which exact song section, track, instrument, phrase, riff, chord, or note is the target?"] : []),
    ...(!hasLocation ? ["Where should the edit begin and end: named section, bars/beats, seconds, or ticks?"] : []),
    ...(vague ? ["What should sound measurably different after the edit?"] : []),
    ...(destructiveRequest ? ["May the DAW create a protected new revision instead of changing or deleting the source?"] : []),
  ];
  const specifiedCount = [hasAction, hasTarget, hasLocation].filter(Boolean).length;
  const confidence = destructiveRequest ? "blocked" : vague || specifiedCount <= 1 ? "low" : specifiedCount === 2 ? "medium" : "high";
  return {
    confidence,
    executionAllowed: false,
    destructiveRequest,
    evidence,
    warnings: [
      ...(vague ? ["Vague wording can produce a musically wrong edit even when the words are grammatically clear."] : []),
      ...(destructiveRequest ? ["Destructive source changes are blocked. Original recordings, masters, and approved revisions must remain recoverable."] : []),
      ...(confidence !== "high" && !destructiveRequest ? ["Clarification is required before an execution plan can be approved."] : []),
    ],
    clarificationQuestions,
    protectedAlternative: destructiveRequest ? "Create a new private revision, audition it against the unchanged source, and retain instant undo." : null,
    sourceMutationAllowed: false,
    persistenceAllowed: false,
  };
}
