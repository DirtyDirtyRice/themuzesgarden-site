import type { ProjectContextBundle } from "./projectContext";

export type AiEvidenceKind =
  | "source"
  | "cross-references"
  | "dependency-impact"
  | "code-history"
  | "prevented-errors"
  | "architectural-health"
  | "verification-history";

export type AiQuestionIntent =
  | "explain"
  | "locate"
  | "relationships"
  | "impact"
  | "history"
  | "diagnose"
  | "architecture"
  | "verification";

export type AiEvidencePlan = {
  question: string;
  intents: AiQuestionIntent[];
  evidence: AiEvidenceKind[];
  focusSymbols: Array<{ name: string; path: string; line: number }>;
  focusFiles: string[];
  rationale: string[];
};

type IntentRule = {
  intent: AiQuestionIntent;
  patterns: RegExp[];
  evidence: AiEvidenceKind[];
  rationale: string;
};

const RULES: IntentRule[] = [
  {
    intent: "relationships",
    patterns: [/\b(import|export|reference|usage|uses|used by|depends on|dependency)\b/i, /\bwho (calls|imports|uses)\b/i],
    evidence: ["cross-references"],
    rationale: "The question asks how code is connected or used.",
  },
  {
    intent: "impact",
    patterns: [/\b(impact|blast radius|downstream|what (will|would|could) break|affected files?)\b/i, /\bchange (this|it)\b/i],
    evidence: ["cross-references", "dependency-impact", "architectural-health"],
    rationale: "The question asks what a change could affect.",
  },
  {
    intent: "history",
    patterns: [/\b(history|timeline|breadcrumb|first (created|observed|appeared)|when|origin|introduced|commit|moved|renamed)\b/i],
    evidence: ["code-history"],
    rationale: "The question asks when or how code evolved.",
  },
  {
    intent: "diagnose",
    patterns: [/\b(error|failed|failure|broken|bug|wrong|missing|cannot|can't|won't|doesn't|invalid|diagnos)\w*\b/i],
    evidence: ["cross-references", "dependency-impact", "code-history", "prevented-errors", "verification-history"],
    rationale: "The question asks for an error cause or repair evidence.",
  },
  {
    intent: "architecture",
    patterns: [/\b(architecture|health|risk|coupl|bottleneck|oversized|maintainab|complexity)\w*\b/i],
    evidence: ["dependency-impact", "architectural-health"],
    rationale: "The question asks about structural or maintenance risk.",
  },
  {
    intent: "verification",
    patterns: [/\b(test|typecheck|build|verify|verification|safe patch|validated|green)\b/i],
    evidence: ["prevented-errors", "verification-history"],
    rationale: "The question asks whether code has been proven safe.",
  },
  {
    intent: "locate",
    patterns: [/\b(where|find|locate|defined|definition|file|line)\b/i],
    evidence: ["cross-references"],
    rationale: "The question asks for an exact code location.",
  },
];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function planAiEvidence(question: string, context: ProjectContextBundle): AiEvidencePlan {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) throw new Error("An AI evidence question is required.");

  const matched = RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(cleanQuestion)));
  const intents = unique<AiQuestionIntent>(matched.map((rule) => rule.intent));
  if (!intents.length) intents.push("explain");

  const evidence = unique<AiEvidenceKind>([
    "source",
    ...matched.flatMap((rule) => rule.evidence),
  ]);

  return {
    question: cleanQuestion,
    intents,
    evidence,
    focusSymbols: context.symbols.slice(0, 5).map((symbol) => ({
      name: symbol.name,
      path: symbol.path,
      line: symbol.line,
    })),
    focusFiles: unique([
      ...context.symbols.slice(0, 5).map((symbol) => symbol.path),
      ...context.files.slice(0, 5).map((file) => file.path),
    ]).slice(0, 8),
    rationale: matched.length
      ? unique(matched.map((rule) => rule.rationale))
      : ["The question can be answered from indexed symbols and exact source excerpts."],
  };
}
